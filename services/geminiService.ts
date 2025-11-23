
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { decodeBase64, decodeAudioData } from "./audioUtils";
import { TopicDetailData } from "../types";

const API_KEY = process.env.API_KEY || '';

// --- FALLBACK DATA (Offline Mode) ---
const FALLBACK_TEMPLES = [
  { id: 'f1', title: 'Konark Sun Temple', description: 'The 13th-century Sun Temple at Konark, designed as a colossal chariot with 24 wheels, dedicated to the Sun God Surya.', imageSearchTerm: 'Konark Sun Temple stone wheels architecture', tags: ['Odisha', 'Sun God', 'Chariot'], lat: 19.8876, lng: 86.0945 },
  { id: 'f2', title: 'Brihadeeswarar Temple', description: 'A masterpiece of Chola architecture in Thanjavur, featuring one of the tallest temple towers in the world.', imageSearchTerm: 'Brihadeeswarar Temple Thanjavur vimana', tags: ['Tamil Nadu', 'Chola', 'Shiva'], lat: 10.7828, lng: 79.1318 },
  { id: 'f3', title: 'Kedarnath Temple', description: 'Located in the Himalayas, this ancient Shiva temple is one of the Chota Char Dham pilgrimage sites.', imageSearchTerm: 'Kedarnath Temple himalayas snow stone', tags: ['Himalayas', 'Shiva', 'Jyotirlinga'], lat: 30.7352, lng: 79.0669 },
  { id: 'f4', title: 'Meenakshi Amman Temple', description: 'A historic Hindu temple located on the southern bank of the Vaigai River in the temple city of Madurai.', imageSearchTerm: 'Meenakshi Amman Temple colorful gopuram', tags: ['Madurai', 'Dravidian', 'Parvati'], lat: 9.9195, lng: 78.1193 },
  { id: 'f5', title: 'Khajuraho Group of Monuments', description: 'Famous for their nagara-style architectural symbolism and their erotic sculptures.', imageSearchTerm: 'Khajuraho temple sculptures detailed', tags: ['Madhya Pradesh', 'Chandela', 'Art'], lat: 24.8318, lng: 79.9199 },
  { id: 'f6', title: 'Golden Temple', description: 'The holiest Gurdwara of Sikhism, located in the city of Amritsar, Punjab, India.', imageSearchTerm: 'Golden Temple Amritsar night reflection', tags: ['Punjab', 'Sikhism', 'Gold'], lat: 31.6200, lng: 74.8765 },
];

const FALLBACK_GODS = [
  { id: 'g1', title: 'Shiva', description: 'The Destroyer within the Trimurti, the Hindu trinity that includes Brahma and Vishnu.', imageSearchTerm: 'Lord Shiva meditation himalayas', tags: ['Trimurti', 'Destroyer', 'Yogi'], lat: 30.7352, lng: 79.0669 },
  { id: 'g2', title: 'Vishnu', description: 'The Preserver who descends to earth as avatars to restore cosmic order.', imageSearchTerm: 'Lord Vishnu cosmic ocean serpent', tags: ['Preserver', 'Dashavatara', 'Cosmic'], lat: 0, lng: 0 },
  { id: 'g3', title: 'Ganesha', description: 'The remover of obstacles, patron of arts and sciences, and the deva of intellect and wisdom.', imageSearchTerm: 'Ganesha elephant god intricate art', tags: ['Wisdom', 'Beginnings', 'Elephant'], lat: 19.1690, lng: 73.0085 },
  { id: 'g4', title: 'Durga', description: 'A major form of the Hindu goddess Parvati, associated with protection, strength, motherhood.', imageSearchTerm: 'Goddess Durga lion trishul fierce', tags: ['Shakti', 'Warrior', 'Mother'], lat: 22.5726, lng: 88.3639 },
];

const FALLBACK_TEXTS = [
  { id: 't1', title: 'The Bhagavad Gita', description: 'A 700-verse Hindu scripture that is part of the epic Mahabharata.', imageSearchTerm: 'Bhagavad Gita Krishna Arjuna chariot war', tags: ['Philosophy', 'Mahabharata', 'Krishna'], lat: 29.9695, lng: 76.8783 },
  { id: 't2', title: 'The Rigveda', description: 'The oldest known Vedic Sanskrit text, a collection of over 1,000 hymns.', imageSearchTerm: 'Rigveda ancient palm leaf manuscript sanskrit', tags: ['Vedas', 'Hymns', 'Sanskrit'], lat: 0, lng: 0 },
  { id: 't3', title: 'Arthashastra', description: 'An ancient Indian Sanskrit treatise on statecraft, economic policy and military strategy.', imageSearchTerm: 'Chanakya writing arthashastra ancient', tags: ['Politics', 'Chanakya', 'Economics'], lat: 25.6126, lng: 85.1588 },
];

// Helper to check configuration
export const isGeminiConfigured = (): boolean => {
  return !!API_KEY && API_KEY.length > 0 && API_KEY !== "undefined";
};

// Initialize client securely
const ai = new GoogleGenAI({ apiKey: API_KEY });

const BASE_IMAGE_PROMPT = "historical, ancient india, photorealistic, 8k";

// Helper to clean AI JSON output
const cleanJSON = (text: string): string => {
  if (!text) return "[]";
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  if (firstBrace === -1 && firstBracket === -1) return cleaned;

  let startIndex = -1;
  let endIndex = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIndex = firstBrace;
      endIndex = cleaned.lastIndexOf('}');
  } else {
      startIndex = firstBracket;
      endIndex = cleaned.lastIndexOf(']');
  }

  if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
      return cleaned.substring(startIndex, endIndex + 1);
  }

  return cleaned;
};

export const generateHistoryResponse = async (prompt: string): Promise<{ text: string; imagePrompt: string }> => {
  if (!isGeminiConfigured()) return { text: "API Key is missing. Please configure it to chat with the historian.", imagePrompt: "" };
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User Query: ${prompt}. Answer as Itihasik, an Indian historian. Keep it under 80 words for quick reading. No markdown. End with ||IMG|| followed by a 5-word visual description of the subject.`,
    });

    const fullText = response.text || "I could not find information on that.";
    const parts = fullText.split("||IMG||");
    let cleanText = parts[0].trim().replace(/\*\*/g, "").replace(/__/g, "").replace(/^#+\s/gm, "");

    return {
      text: cleanText,
      imagePrompt: parts.length > 1 ? parts[1].trim() : `${prompt} ancient india`
    };

  } catch (error) {
    console.warn("Gemini Chat Error (Quota/Network):", error);
    return { 
        text: "The archives are experiencing high traffic (Quota Exceeded). I can currently only guide you through our preserved records in the Temples, Gods, and Texts sections.", 
        imagePrompt: "" 
    };
  }
};

// Improved Location Fetching
export const getTopicLocation = async (topic: string): Promise<{ name: string; googleMapsUri: string; lat?: number; lng?: number } | undefined> => {
    const knownLocation = [...FALLBACK_TEMPLES, ...FALLBACK_GODS, ...FALLBACK_TEXTS].find(i => i.title.toLowerCase().includes(topic.toLowerCase()) || topic.toLowerCase().includes(i.title.toLowerCase()));
    if (knownLocation && knownLocation.lat) {
        return {
            name: knownLocation.title,
            googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${knownLocation.lat},${knownLocation.lng}`,
            lat: knownLocation.lat,
            lng: knownLocation.lng
        };
    }

    if (!isGeminiConfigured()) return undefined;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Return JSON only: { "lat": number, "lng": number, "placeName": string } for the exact location of "${topic}". If mythological/unknown, use the most famous temple location for it.`,
            config: { responseMimeType: "application/json" }
        });
        
        const text = cleanJSON(response.text || "{}");
        const data = JSON.parse(text);

        if (data.lat && data.lng) {
            return {
                name: data.placeName || topic,
                googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lng}`,
                lat: data.lat,
                lng: data.lng
            };
        }
        return undefined;
    } catch (e) {
        console.warn("Location fetch failed", e);
        return undefined;
    }
};

export const generateTopicDetails = async (topic: string): Promise<TopicDetailData | null> => {
  const getFallback = () => {
    const fallbackItem = [...FALLBACK_TEMPLES, ...FALLBACK_GODS, ...FALLBACK_TEXTS].find(i => i.title === topic || topic.includes(i.title) || i.title.includes(topic));
     if (fallbackItem) {
         return {
             title: fallbackItem.title,
             subtitle: "Offline Archive Record",
             heroImagePrompt: fallbackItem.imageSearchTerm || fallbackItem.title,
             introduction: fallbackItem.description,
             sections: [{ title: "Overview", content: fallbackItem.description + "\n\n(Note: Full detailed history is currently unavailable due to high server traffic or missing API key. This is a summarized record from our local archives.)" }],
             facts: ["This record is retrieved from local archives.", "The main knowledge library is currently busy."],
             galleryPrompts: [fallbackItem.title + " architecture", fallbackItem.title + " close up", "Ancient India Art"]
         };
     }
     return null;
  };

  if (!isGeminiConfigured()) {
     return getFallback();
  }

  try {
    const contentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Profile for "${topic}" (Ancient India). JSON format.
      Fields: title, subtitle, heroImagePrompt (visual keywords only), introduction (2 sentences), sections (array of {title, content}), facts (array of strings), galleryPrompts (array of 3 visual strings).`,
      config: { responseMimeType: "application/json" }
    });

    const text = cleanJSON(contentResponse.text || "");
    const parsed = JSON.parse(text);

    return {
        title: parsed.title || topic,
        subtitle: parsed.subtitle || "Historical Entity",
        heroImagePrompt: parsed.heroImagePrompt || `${topic} ancient`,
        introduction: parsed.introduction || "Details unavailable.",
        sections: Array.isArray(parsed.sections) ? parsed.sections : [],
        facts: Array.isArray(parsed.facts) ? parsed.facts : [],
        galleryPrompts: Array.isArray(parsed.galleryPrompts) ? parsed.galleryPrompts : [],
    };

  } catch (error) {
    console.error("Error fetching topic details (Quota/Network)", error);
    return getFallback();
  }
};

export const fetchDynamicSectionData = async (category: 'TEMPLES' | 'GODS' | 'TEXTS', excludeNames: string[] = []): Promise<any[]> => {
  if (!isGeminiConfigured()) {
      console.log("Using Fallback Data (No API Key)");
      const dataMap = { 'TEMPLES': FALLBACK_TEMPLES, 'GODS': FALLBACK_GODS, 'TEXTS': FALLBACK_TEXTS };
      const allItems = dataMap[category];
      const newItems = allItems.filter(i => !excludeNames.includes(i.title));
      
      return newItems.map(item => ({
          ...item,
          imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent((item.imageSearchTerm || item.title) + " " + BASE_IMAGE_PROMPT)}?width=600&height=400&nologo=true&seed=${item.id}`
      }));
  }

  try {
    const excludeStr = excludeNames.length > 0 ? `Exclude: ${excludeNames.join(', ')}.` : "";
    const prompts = {
      TEMPLES: `List 6 famous ancient Indian temples. ${excludeStr} JSON Array. Fields: id, title, description, imageSearchTerm (visual keywords), tags, lat, lng.`,
      GODS: `List 6 Hindu gods/goddesses. ${excludeStr} JSON Array. Fields: id, title, description, imageSearchTerm, tags, lat (of main temple), lng.`,
      TEXTS: `List 6 ancient Indian texts. ${excludeStr} JSON Array. Fields: id, title, description, imageSearchTerm, tags, lat (origin/museum), lng.`
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompts[category],
      config: { responseMimeType: "application/json" }
    });

    let cleanedText = cleanJSON(response.text || "[]");
    let data = JSON.parse(cleanedText);
    
    if (!Array.isArray(data) && data.items) data = data.items;
    if (!Array.isArray(data)) data = [];
    
    return data.map((item: any) => ({
      ...item,
      imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent((item.imageSearchTerm || item.title) + " " + BASE_IMAGE_PROMPT)}?width=600&height=400&nologo=true&seed=${Math.random()}`
    }));

  } catch (error) {
    console.warn("API Fetch failed, using fallback data", error);
    const dataMap = { 'TEMPLES': FALLBACK_TEMPLES, 'GODS': FALLBACK_GODS, 'TEXTS': FALLBACK_TEXTS };
    const fallbackItems = dataMap[category].filter(i => !excludeNames.includes(i.title));
    
    return fallbackItems.map(item => ({
          ...item,
          imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent((item.imageSearchTerm || item.title) + " " + BASE_IMAGE_PROMPT)}?width=600&height=400&nologo=true&seed=${item.id}`
    }));
  }
}

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export const stopTextToSpeech = () => {
    if (currentSource) {
        try { currentSource.stop(); } catch(e) {}
        currentSource = null;
    }
    if (audioContext) {
        try { audioContext.close(); } catch(e) {}
        audioContext = null;
    }
};

export const playTextToSpeech = async (text: string, onEnd?: () => void): Promise<void> => {
  if (!isGeminiConfigured()) return;

  stopTextToSpeech();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.substring(0, 400) }] }], // Chunk text for speed
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data");

    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBytes = decodeBase64(base64Audio);
    const validBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);

    const source = audioContext.createBufferSource();
    source.buffer = validBuffer;
    source.connect(audioContext.destination);
    
    source.onended = () => {
        if (onEnd) onEnd();
        currentSource = null;
    };
    
    currentSource = source;
    source.start();

  } catch (error) {
    console.error("TTS Error:", error);
    if (onEnd) onEnd();
  }
};
