
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { decodeBase64, decodeAudioData } from "./audioUtils";
import { TopicDetailData } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize client securely
const ai = new GoogleGenAI({ apiKey: API_KEY });

const BASE_IMAGE_PROMPT = "photorealistic, 8k, cinematic lighting, historical photography style, highly detailed, ancient india, authentic, sharp focus, masterpiece";

// Helper to clean AI JSON output (removes markdown code blocks and finds JSON bounds)
const cleanJSON = (text: string): string => {
  if (!text) return "[]";
  
  let cleaned = text.trim();
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  
  // Determine if we are looking for an Object or an Array
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  // If we can't find start symbols, return as is (likely to fail parse, caught in catch block)
  if (firstBrace === -1 && firstBracket === -1) return cleaned;

  let startIndex = -1;
  let endIndex = -1;

  // If object brace comes before array bracket (or no array bracket), treat as object
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIndex = firstBrace;
      endIndex = cleaned.lastIndexOf('}');
  } else {
      // Treat as array
      startIndex = firstBracket;
      endIndex = cleaned.lastIndexOf(']');
  }

  if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
      return cleaned.substring(startIndex, endIndex + 1);
  }

  return cleaned;
};

export const generateHistoryResponse = async (prompt: string): Promise<{ text: string; imagePrompt: string }> => {
  if (!API_KEY) return { text: "API Key is missing. Please configure it.", imagePrompt: "" };
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are Itihasik, a knowledgeable historian.
      User Query: ${prompt}
      
      Task:
      1. Provide a detailed, accurate, and engaging historical or mythological answer.
      2. STRICTLY DO NOT use Markdown formatting (no bolding **, no italics _, no headers #). Write in clean, plain text paragraphs.
      3. At the very end, output a separator "||IMG||" followed by a specific image prompt. 
      
      Image Prompt Rules:
      - Describe the main subject visually.
      - Add keywords: "photorealistic, 8k, cinematic lighting, historical photography style, highly detailed".
      - Keep it under 15 words.
      
      Example Output:
      The Konark Sun Temple is a 13th-century CE Sun Temple at Konark...
      ||IMG|| Konark Sun Temple stone wheels architecture photorealistic 8k cinematic`,
    });

    const fullText = response.text || "I could not find information on that.";
    const parts = fullText.split("||IMG||");
    
    // Clean up any residual markdown
    let cleanText = parts[0].trim();
    cleanText = cleanText.replace(/\*\*/g, "").replace(/__/g, "").replace(/^#+\s/gm, "");

    return {
      text: cleanText,
      imagePrompt: parts.length > 1 ? parts[1].trim() : `${prompt} ${BASE_IMAGE_PROMPT}`
    };

  } catch (error) {
    console.error("Gemini Text Error:", error);
    return { text: "The archives are currently inaccessible.", imagePrompt: "" };
  }
};

// Helper to get location via Google Maps Tool
export const getTopicLocation = async (topic: string): Promise<{ name: string; googleMapsUri: string; lat?: number; lng?: number } | undefined> => {
    if (!API_KEY) return undefined;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find the precise location of "${topic}". 
            Return a JSON object with the following keys:
            - name: The official name of the place.
            - lat: The latitude (number).
            - lng: The longitude (number).
            `,
            config: {
                tools: [{ googleMaps: {} }],
                responseMimeType: "application/json"
            }
        });
        
        const text = cleanJSON(response.text || "{}");
        let data: any = {};
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.warn("JSON Parse for location failed", e);
        }

        // Extract grounding chunks for URI (Source of truth for link)
        let uri = "";
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks && chunks.length > 0) {
            // Look for map URIs
            for (const chunk of chunks) {
                if (chunk.web?.uri && chunk.web.uri.includes('google.com/maps')) {
                     uri = chunk.web.uri;
                     break;
                }
            }
        }
        
        if (!uri && data.lat && data.lng) {
            uri = `https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lng}`;
        }

        if (data.name) {
             return { 
                 name: data.name, 
                 googleMapsUri: uri || '#',
                 lat: data.lat,
                 lng: data.lng
             };
        }
        return undefined;
    } catch (e) {
        console.warn("Maps tool failed", e);
        return undefined;
    }
};

// Fetch details for a specific profile page (Text Content Only for speed)
export const generateTopicDetails = async (topic: string): Promise<TopicDetailData | null> => {
  if (!API_KEY) return null;

  try {
    const contentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a detailed profile for "${topic}" in the context of Indian History/Mythology.
      Return valid JSON matching this schema.
      Ensure "galleryPrompts" provides 3 distinct, simple, short visual descriptions for images (e.g. "stone carving detail", "main idol view", "aerial temple structure").
      DO NOT include resolution or style keywords in galleryPrompts, just the subject.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            heroImagePrompt: { type: Type.STRING },
            introduction: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                }
              }
            },
            facts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            galleryPrompts: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = cleanJSON(contentResponse.text || "");
    if (!text || text === "{}") throw new Error("Empty response");

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.warn("JSON Parse failed", e);
      console.warn("Raw text was:", text);
      throw new Error("Invalid JSON format");
    }

    return {
        title: parsed.title || topic,
        subtitle: parsed.subtitle || "Historical Entity",
        heroImagePrompt: parsed.heroImagePrompt || `${topic} authentic historical ancient india`,
        introduction: parsed.introduction || "Information currently unavailable.",
        sections: Array.isArray(parsed.sections) ? parsed.sections : [],
        facts: Array.isArray(parsed.facts) ? parsed.facts : [],
        galleryPrompts: Array.isArray(parsed.galleryPrompts) ? parsed.galleryPrompts : [],
    };

  } catch (error) {
    console.error("Error fetching topic details", error);
    return null;
  }
};

// Fetch dynamic lists (Simulating a database)
export const fetchDynamicSectionData = async (category: 'TEMPLES' | 'GODS' | 'TEXTS', excludeNames: string[] = []): Promise<any[]> => {
  if (!API_KEY) return [];

  const excludeStr = excludeNames.length > 0 ? `Excluding these: ${excludeNames.join(', ')}.` : "";
  
  const prompts = {
    TEMPLES: `List 12 significant, visually stunning ancient temples of India. ${excludeStr} Return JSON array. Include approximate lat/lng coordinates for mapping.`,
    GODS: `List 12 major/minor Hindu deities. ${excludeStr} Return JSON array. For 'lat' and 'lng', provide coordinates of a famous temple dedicated to them (if applicable, else 0).`,
    TEXTS: `List 12 ancient Indian texts. ${excludeStr} Return JSON array. For 'lat' and 'lng', provide coordinates of where it was written or found (approximate).`
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompts[category],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              imageSearchTerm: { type: Type.STRING, description: "2-3 words search term for photo" },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              lat: { type: Type.NUMBER, description: "Latitude coordinate" },
              lng: { type: Type.NUMBER, description: "Longitude coordinate" }
            }
          }
        }
      }
    });

    let cleanedText = cleanJSON(response.text || "[]");
    let data;
    
    try {
        data = JSON.parse(cleanedText);
    } catch (e) {
        console.warn("First parse attempt failed, retrying loose parse logic");
        const start = response.text?.indexOf('[');
        const end = response.text?.lastIndexOf(']');
        if (start !== undefined && start !== -1 && end !== undefined && end !== -1) {
            try {
                data = JSON.parse(response.text!.substring(start, end + 1));
            } catch (e2) {
                console.error("Fatal JSON Parse Error in Section Data", e2);
                return [];
            }
        } else {
             return [];
        }
    }
    
    if (!Array.isArray(data)) {
        if (data && Array.isArray(data.items)) {
            data = data.items;
        } else if (data && typeof data === 'object') {
             data = [data];
        } else {
            return [];
        }
    }
    
    return data.map((item: any) => ({
      ...item,
      imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent((item.imageSearchTerm || item.title) + " " + BASE_IMAGE_PROMPT)}?width=600&height=400&nologo=true&seed=${Math.random()}`
    }));

  } catch (error) {
    console.error("Error fetching section data", error);
    return [];
  }
}

let audioContext: AudioContext | null = null;

export const playTextToSpeech = async (text: string): Promise<void> => {
  if (!API_KEY) {
    console.error("No API Key");
    return;
  }

  if (audioContext) {
      try {
          await audioContext.close();
      } catch (e) {}
      audioContext = null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.substring(0, 800) }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data received");
    }

    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    const audioBytes = decodeBase64(base64Audio);
    const validBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);

    const source = audioContext.createBufferSource();
    source.buffer = validBuffer;
    source.connect(audioContext.destination);
    source.start();

  } catch (error) {
    console.error("TTS Error:", error);
  }
};
