
import React, { useEffect, useState, useRef } from 'react';
import { generateTopicDetails, getTopicLocation, playTextToSpeech, isGeminiConfigured } from '../services/geminiService';
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
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const details = await generateTopicDetails(topicName);
      
      if (!details) {
          // If even fallback fails
          setError(true);
          setLoading(false);
          return;
      }

      setData(details);
      setHeroUrl(createSafeImageUrl(details.heroImagePrompt || topicName, 999));
      setLoading(false);

      // Generate gallery images
      let galleryTerms: string[] = details.galleryPrompts?.length > 0 ? details.galleryPrompts : ["detailed close up", "architectural view", "artistic representation"];
      const urls = galleryTerms.map((term, i) => createSafeImageUrl(term, i + 100));
      setGalleryUrls(urls);

      // Fetch Location in background
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicName]);

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
      <div className="min-h-full flex items-center justify-center bg-background">
         <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-primary font-serif text-xl animate-pulse">Consulting the ancient scrolls for {topicName}...</p>
         </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-full flex items-center justify-center bg-background">
          <div className="p-10 text-center bg-surface border border-slate-700 rounded-2xl max-w-md">
            <h2 className="text-2xl font-serif text-gray-200 mb-2">Record Unavailable</h2>
            <p className="text-gray-400 mb-6">We could not retrieve details for "{topicName}".</p>
            <button onClick={onBack} className="px-6 py-2 rounded bg-primary text-slate-900 font-bold hover:bg-accent transition-colors">Return to List</button>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background pb-20 animate-fade-in relative">
        <button 
            onClick={onBack}
            className="fixed top-6 left-6 z-50 flex items-center space-x-2 px-5 py-2.5 bg-surface/70 backdrop-blur-xl border border-slate-600/50 rounded-full text-white shadow-xl hover:bg-surface/90 hover:scale-105 transition-all duration-300 group"
        >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium tracking-wide text-sm">Back</span>
        </button>

        <div className="relative h-[50vh] w-full overflow-hidden bg-slate-800">
            <img 
                src={heroUrl} 
                alt={data.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('placehold.co')) {
                       target.src = `https://placehold.co/1200x600/1e293b/d97706?text=${encodeURIComponent(topicName)}`;
                    }
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-7xl mx-auto">
                <h4 className="text-primary font-bold tracking-widest uppercase mb-2">{data.subtitle}</h4>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl">{data.title}</h1>
                <div className="flex gap-4 flex-wrap">
                    <button 
                        onClick={() => playTextToSpeech(`${data.title}. ${data.introduction} ${data.sections?.[0]?.content || ''}`)}
                        className="flex items-center px-6 py-3 bg-primary text-slate-900 font-bold rounded-lg hover:bg-accent transition-colors shadow-lg disabled:opacity-50"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                        Listen to Story
                    </button>
                    
                    {/* Map Button - Now enabled more often due to fallback location logic */}
                    <button 
                        onClick={() => location?.lat ? setShowMapModal(true) : null}
                        disabled={loadingLocation || !location?.lat}
                        className={`flex items-center px-6 py-3 border border-slate-600 rounded-lg font-bold transition-colors shadow-lg
                            ${loadingLocation || !location?.lat 
                                ? 'bg-surface/50 text-gray-500 cursor-not-allowed' 
                                : 'bg-surface text-gray-200 hover:border-primary hover:text-primary'}`}
                    >
                         {loadingLocation ? (
                             <>
                                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></span>
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

        {showMapModal && location && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-surface border border-slate-600 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col h-[80vh]">
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
                         <h3 className="text-lg font-bold text-white flex items-center">
                             <span className="text-primary mr-2">📍</span> {location.name}
                         </h3>
                         <button onClick={() => setShowMapModal(false)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-slate-800">
                             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                             </svg>
                         </button>
                    </div>
                    <div className="flex-1 relative bg-slate-800">
                        <div ref={mapRef} className="absolute inset-0 z-0"></div>
                    </div>
                    <div className="p-4 bg-slate-900 border-t border-slate-700 flex justify-end">
                         <a href={location.googleMapsUri} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center">
                             Open in Google Maps App <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                         </a>
                    </div>
                </div>
            </div>
        )}

        <div className="max-w-5xl mx-auto px-6 md:px-10 -mt-10 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-surface border border-slate-700 rounded-2xl p-8 shadow-2xl">
                        <p className="text-xl font-serif text-gray-200 leading-relaxed italic text-center">"{data.introduction}"</p>
                    </div>
                    <div className="space-y-10">
                        {data.sections?.map((section, idx) => (
                            <div key={idx} className="bg-surface/30 p-6 rounded-xl border border-slate-800">
                                <h2 className="text-2xl font-serif font-bold text-primary mb-4 flex items-center">
                                    <span className="w-8 h-1 bg-primary mr-4 rounded-full"></span>
                                    {section.title}
                                </h2>
                                <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-line">{section.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-gold mb-4 flex items-center"><span className="text-2xl mr-2">❖</span> Did You Know?</h3>
                        <ul className="space-y-4">
                            {data.facts?.map((fact, i) => (
                                <li key={i} className="flex items-start text-gray-400 text-sm leading-relaxed border-b border-slate-800/50 pb-3 last:border-0">
                                    <span className="text-primary mr-2">•</span>
                                    {fact}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                         <h3 className="text-xl font-bold text-gray-100 mb-4 flex items-center"><span className="text-primary mr-2">✦</span> Visual Archives</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {galleryUrls.length === 0 ? (
                                [1, 2, 3].map(i => (<div key={i} className="h-48 bg-slate-800 animate-pulse rounded-lg border border-slate-700"></div>))
                            ) : (
                                galleryUrls.map((url, idx) => (
                                    <div key={idx} className="relative group overflow-hidden rounded-lg border border-slate-700 h-48 animate-fade-in">
                                        <img 
                                            src={url} 
                                            alt={`Gallery ${idx}`} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            loading="lazy"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                if (!target.src.includes('placehold.co')) {
                                                   target.src = `https://placehold.co/600x400/1e293b/d97706?text=Archive+Image`;
                                                }
                                            }}
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
