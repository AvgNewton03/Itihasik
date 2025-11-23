
import React, { useEffect, useState, useRef } from 'react';
import { generateTopicDetails, getTopicLocation, playTextToSpeech, stopTextToSpeech, isGeminiConfigured } from '../services/geminiService';
import { TopicDetailData, AppSection } from '../types';

interface TopicDetailProps {
  topicId: string;
  topicName: string;
  onBack: () => void;
  category?: AppSection;
}

declare global {
  interface Window {
    L: any;
  }
}

export const TopicDetail: React.FC<TopicDetailProps> = ({ topicName, onBack, category }) => {
  const [data, setData] = useState<TopicDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [heroUrl, setHeroUrl] = useState('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  
  // Location state
  const [location, setLocation] = useState<{name: string, googleMapsUri: string, lat?: number, lng?: number} | undefined>(undefined);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Simple URL generator
  const createSafeImageUrl = (term: string, seed: number): string => {
      const cleanTerm = term.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 100);
      return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanTerm + " ancient india photorealistic")}?width=800&height=600&nologo=true&seed=${seed}`;
  };

  const loadData = async () => {
    setLoading(true);
    setError(false);
    setGalleryUrls([]);
    setLocation(undefined);
    setShowMapModal(false);
    stopTextToSpeech(); // Stop any previous audio
    setIsPlaying(false);
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const details = await generateTopicDetails(topicName);
      
      if (!details) {
          setError(true);
          setLoading(false);
          return;
      }

      setData(details);
      setHeroUrl(createSafeImageUrl(details.heroImagePrompt || topicName, 999));
      setLoading(false);

      let galleryTerms: string[] = details.galleryPrompts?.length > 0 ? details.galleryPrompts : ["detailed close up", "architectural view", "artistic representation"];
      const urls = galleryTerms.map((term, i) => createSafeImageUrl(term, i + 100));
      setGalleryUrls(urls);

      setLoadingLocation(true);
      const locData = await getTopicLocation(topicName);
      if (locData) {
          setLocation(locData);
      }
      setLoadingLocation(false);

    } catch (e) {
      console.error("Failed to load topic", e);
      setError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
        stopTextToSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicName]);

  const handlePlayAudio = () => {
      if (data) {
          setIsPlaying(true);
          playTextToSpeech(
              `${data.title}. ${data.introduction} ${data.sections?.[0]?.content || ''}`,
              () => setIsPlaying(false)
          );
      }
  };

  const handleStopAudio = () => {
      stopTextToSpeech();
      setIsPlaying(false);
  };

  // Map Init Effect (omitted for brevity, unchanged logic)
  useEffect(() => {
    if (showMapModal && location && location.lat && location.lng && mapRef.current && !mapInstanceRef.current) {
        if (window.L) {
            try {
                setTimeout(() => {
                    if (!mapRef.current) return;
                    const map = window.L.map(mapRef.current).setView([location.lat!, location.lng!], 15);
                    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                        attribution: '&copy; OpenStreetMap &copy; CARTO'
                    }).addTo(map);
                    const marker = window.L.marker([location.lat!, location.lng!]).addTo(map);
                    marker.bindPopup(`<b>${location.name}</b>`).openPopup();
                    mapInstanceRef.current = map;
                }, 100);
            } catch (e) {
                console.warn("Leaflet Init Failed", e);
            }
        }
    }
    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    }
  }, [showMapModal, location]);

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-transparent">
         <div className="text-center space-y-4 bg-slate-900/50 p-10 rounded-3xl backdrop-blur-xl border border-white/10">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-primary font-serif text-xl animate-pulse">Consulting the ancient scrolls...</p>
         </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-full flex items-center justify-center bg-transparent">
          <div className="p-10 text-center glass-card rounded-2xl max-w-md">
            <h2 className="text-2xl font-serif text-gray-200 mb-2">Record Unavailable</h2>
            <button onClick={onBack} className="px-6 py-2 rounded bg-primary text-slate-900 font-bold hover:bg-accent transition-colors">Return</button>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-20 animate-fade-in relative">
        <button 
            onClick={onBack}
            className="fixed top-6 left-6 z-50 flex items-center space-x-2 px-5 py-2.5 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-full text-white shadow-xl hover:bg-slate-800/80 hover:scale-105 transition-all duration-300 group"
        >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium tracking-wide text-sm">Back</span>
        </button>

        <div className="relative h-[60vh] w-full overflow-hidden">
            <img 
                src={heroUrl} 
                alt={data.title} 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-7xl mx-auto">
                <h4 className="text-primary font-bold tracking-widest uppercase mb-2 drop-shadow-md">{data.subtitle}</h4>
                <h1 className="text-4xl md:text-7xl font-serif font-bold text-white mb-8 drop-shadow-2xl">{data.title}</h1>
                <div className="flex gap-4 flex-wrap">
                    
                    {isPlaying ? (
                        <button 
                            onClick={handleStopAudio}
                            className="flex items-center px-6 py-3 bg-red-500/20 text-red-100 border border-red-500/30 rounded-full hover:bg-red-500/30 transition-colors shadow-lg backdrop-blur-md"
                        >
                            <svg className="w-5 h-5 mr-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                            </svg>
                            Stop Listening
                        </button>
                    ) : (
                        <button 
                            onClick={handlePlayAudio}
                            className="flex items-center px-6 py-3 bg-primary/90 text-slate-900 font-bold rounded-full hover:bg-accent transition-colors shadow-[0_0_20px_rgba(217,119,6,0.3)] backdrop-blur-md"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                            Listen to Story
                        </button>
                    )}
                    
                    <button 
                        onClick={() => location?.lat ? setShowMapModal(true) : null}
                        disabled={loadingLocation || !location?.lat}
                        className={`flex items-center px-6 py-3 border border-white/20 rounded-full font-bold transition-all shadow-lg backdrop-blur-md
                            ${loadingLocation || !location?.lat 
                                ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                                : 'bg-white/10 text-gray-200 hover:bg-white/20 hover:text-white'}`}
                    >
                         {loadingLocation ? (
                             <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                Locating...
                             </>
                         ) : (
                             <>
                                 <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {location?.lat ? "View on Map" : "Location Unknown"}
                             </>
                         )}
                    </button>
                </div>
            </div>
        </div>

        {/* Modal Logic Unchanged */}
        {showMapModal && location && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="glass-panel rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col h-[80vh]">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/80">
                         <h3 className="text-lg font-bold text-white flex items-center">
                             <span className="text-primary mr-2">📍</span> {location.name}
                         </h3>
                         <button onClick={() => setShowMapModal(false)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10">
                             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                             </svg>
                         </button>
                    </div>
                    <div className="flex-1 relative bg-slate-800">
                        <div ref={mapRef} className="absolute inset-0 z-0"></div>
                    </div>
                </div>
            </div>
        )}

        <div className="max-w-6xl mx-auto px-6 md:px-10 -mt-20 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-panel rounded-2xl p-8 md:p-10">
                        <p className="text-xl md:text-2xl font-serif text-gray-200 leading-relaxed italic text-center drop-shadow-sm">"{data.introduction}"</p>
                    </div>
                    <div className="space-y-6">
                        {data.sections?.map((section, idx) => (
                            <div key={idx} className="bg-slate-900/40 backdrop-blur-md p-8 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                <h2 className="text-2xl font-serif font-bold text-primary mb-4 flex items-center">
                                    <span className="w-10 h-0.5 bg-primary mr-4 opacity-50"></span>
                                    {section.title}
                                </h2>
                                <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-line font-light">{section.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="glass-card rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-gold mb-4 flex items-center"><span className="text-2xl mr-2">❖</span> Did You Know?</h3>
                        <ul className="space-y-4">
                            {data.facts?.map((fact, i) => (
                                <li key={i} className="flex items-start text-gray-400 text-sm leading-relaxed border-b border-white/5 pb-3 last:border-0">
                                    <span className="text-primary mr-2 mt-1">●</span>
                                    {fact}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="glass-card rounded-2xl p-6">
                         <h3 className="text-xl font-bold text-gray-100 mb-4 flex items-center"><span className="text-primary mr-2">✦</span> Visual Archives</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {galleryUrls.length === 0 ? (
                                [1, 2, 3].map(i => (<div key={i} className="h-48 bg-white/5 animate-pulse rounded-lg"></div>))
                            ) : (
                                galleryUrls.map((url, idx) => (
                                    <div key={idx} className="relative group overflow-hidden rounded-xl border border-white/5 h-48 animate-fade-in shadow-lg">
                                        <img 
                                            src={url} 
                                            alt={`Gallery ${idx}`} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
