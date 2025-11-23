
import React, { useState, useEffect, useRef } from 'react';
import { SectionItem, AppSection } from '../types';

interface SectionGridProps {
  title: string;
  items: SectionItem[];
  onItemClick: (item: SectionItem) => void;
  isLoading?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  category?: AppSection;
  apiKeyMissing?: boolean;
}

declare global {
    interface Window {
      L: any;
    }
}

export const SectionGrid: React.FC<SectionGridProps> = ({ 
    title, 
    items, 
    onItemClick, 
    isLoading,
    onLoadMore,
    isLoadingMore,
    category,
    apiKeyMissing
}) => {
  const [viewType, setViewType] = useState<'GRID' | 'MAP'>('GRID');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
      if (category !== AppSection.TEMPLES) {
          setViewType('GRID');
      }
  }, [category]);

  // Scroll to top when switching to Map view
  useEffect(() => {
    if (viewType === 'MAP' && mapRef.current) {
        const scrollParent = mapRef.current.closest('.overflow-y-auto');
        if (scrollParent) {
            scrollParent.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
  }, [viewType]);

  useEffect(() => {
      if (viewType === 'MAP' && !isLoading && items.length > 0 && mapRef.current) {
          if (!mapInstanceRef.current && window.L) {
              const map = window.L.map(mapRef.current).setView([20.5937, 78.9629], 5);
              window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                  attribution: '&copy; OpenStreetMap &copy; CARTO',
                  subdomains: 'abcd',
                  maxZoom: 20
              }).addTo(map);

              const markers: any[] = [];
              items.forEach(item => {
                  if (item.lat && item.lng) {
                      const marker = window.L.marker([item.lat, item.lng])
                        .addTo(map)
                        .bindPopup(`
                            <div class="text-center text-slate-900 min-w-[150px]">
                                <b class="text-sm font-bold font-serif">${item.title}</b><br/>
                                <button id="popup-${item.id}" class="mt-2 text-xs bg-amber-600 text-white px-3 py-1.5 rounded-full font-bold">Explore</button>
                            </div>
                        `);
                        
                        marker.on('popupopen', () => {
                           const btn = document.getElementById(`popup-${item.id}`);
                           if (btn) {
                               btn.onclick = () => onItemClick(item);
                           }
                        });

                      markers.push(marker);
                  }
              });

              if (markers.length > 0) {
                  const group = window.L.featureGroup(markers);
                  map.fitBounds(group.getBounds(), { padding: [50, 50] });
              }
              mapInstanceRef.current = map;
          }
      }
      return () => {
          if (viewType === 'GRID' && mapInstanceRef.current) {
              mapInstanceRef.current.remove();
              mapInstanceRef.current = null;
          }
      };
  }, [viewType, isLoading, items]);

  const renderSkeleton = (count = 6) => (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white/5 rounded-xl overflow-hidden animate-pulse border border-white/5">
          <div className="h-64 bg-white/10"></div>
          <div className="p-6 space-y-4">
            <div className="h-6 bg-white/10 rounded w-3/4"></div>
            <div className="h-4 bg-white/10 rounded w-full"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </>
  );

  if (apiKeyMissing) {
      return (
          <div className="p-10 max-w-4xl mx-auto mt-20 text-center">
              <div className="glass-panel border border-red-500/30 p-8 rounded-3xl shadow-2xl">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Setup Required</h2>
                  <p className="text-gray-400 mb-6">Gemini API Key missing.</p>
                  <a href="/" className="px-6 py-2 bg-primary text-slate-900 font-bold rounded-lg hover:bg-accent transition-colors">Refresh App</a>
              </div>
          </div>
      );
  }

  // Layout changes based on View Type
  return (
    <div className={viewType === 'MAP' ? "w-full h-[calc(100vh-5rem)] relative bg-slate-900" : "p-6 md:p-10 max-w-7xl mx-auto pb-20"}>
      
      {/* HEADER: Only show standard header in Grid Mode */}
      {viewType === 'GRID' && (
        <div className="mb-12 flex flex-col md:flex-row justify-between items-end md:items-center border-b border-white/10 pb-6">
            <div>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-100 mb-2 tracking-tight">{title}</h2>
                <p className="text-text-muted text-sm uppercase tracking-widest">
                    {isLoading ? "Unearthing ancient secrets..." : `Found ${items.length} Records`}
                </p>
            </div>
            
            {!isLoading && items.length > 0 && category === AppSection.TEMPLES && (
                <div className="flex space-x-2 bg-slate-900/50 p-1 rounded-lg border border-white/10 mt-4 md:mt-0 backdrop-blur-md">
                    <button 
                        onClick={() => setViewType('GRID')}
                        className="px-4 py-2 rounded-md text-sm font-bold transition-all bg-primary text-slate-900 shadow-lg"
                    >
                        Grid View
                    </button>
                    <button 
                        onClick={() => setViewType('MAP')}
                        className="px-4 py-2 rounded-md text-sm font-bold transition-all text-gray-400 hover:text-white"
                    >
                        Map View
                    </button>
                </div>
            )}
        </div>
      )}

      {viewType === 'GRID' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
            {items.map((item) => (
              <div 
                key={item.id}
                onClick={() => onItemClick(item)}
                className="group relative glass-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:border-primary/50 shadow-lg"
              >
                <div className="relative h-64 overflow-hidden bg-slate-800">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[10%] group-hover:grayscale-0"
                    onError={(e) => {
                       const target = e.target as HTMLImageElement;
                       if (!target.src.includes('placehold.co')) {
                           target.src = `https://placehold.co/600x400/1e293b/d97706?text=${encodeURIComponent(item.title)}`;
                       }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90"></div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex flex-wrap gap-2 mb-2 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          {item.tags.map(tag => (
                              <span key={tag} className="text-[10px] font-bold text-slate-900 bg-accent px-2 py-0.5 rounded shadow-sm">
                              {tag}
                              </span>
                          ))}
                      </div>
                      <h3 className="text-2xl font-serif font-bold text-gray-100 mb-1 group-hover:text-primary transition-colors drop-shadow-md">
                          {item.title}
                      </h3>
                  </div>
                </div>
                
                <div className="p-6 border-t border-white/5 bg-slate-900/40">
                  <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed font-light">
                    {item.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center text-primary text-xs font-bold tracking-widest uppercase opacity-60 group-hover:opacity-100 transition-opacity">
                        Read Full Profile <span className="ml-2 text-lg">→</span>
                      </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && renderSkeleton(3)}
          </div>
      ) : (
          <div className="w-full h-full relative animate-fade-in">
              <div ref={mapRef} className="w-full h-full z-0"></div>
              
              {/* Floating Overlay for Map Mode */}
              <div className="absolute top-4 left-4 right-4 md:left-6 md:w-80 z-[400] glass-panel p-4 rounded-xl flex flex-col gap-3 animate-fade-in border-slate-700/50 shadow-2xl">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-white shadow-black drop-shadow-md">{title}</h2>
                     <p className="text-xs text-gray-400">Interactive Geo-Archive</p>
                  </div>
                  <div className="flex bg-slate-900/80 p-1 rounded-lg border border-white/10">
                        <button 
                            onClick={() => setViewType('GRID')} 
                            className="flex-1 px-3 py-1.5 rounded-md text-xs font-bold text-gray-400 hover:text-white transition-all hover:bg-white/5"
                        >
                            Grid View
                        </button>
                        <button 
                            onClick={() => setViewType('MAP')} 
                            className="flex-1 px-3 py-1.5 rounded-md text-xs font-bold bg-primary text-slate-900 shadow-md"
                        >
                            Map View
                        </button>
                  </div>
              </div>
          </div>
      )}

      {!isLoading && items.length > 0 && onLoadMore && viewType === 'GRID' && (
          <div className="mt-16 text-center">
              <button 
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="px-8 py-3 bg-white/5 border border-white/10 hover:border-primary text-gray-300 hover:text-primary rounded-full transition-all duration-300 font-semibold tracking-wide disabled:opacity-50 hover:bg-white/10 backdrop-blur-sm"
              >
                {isLoadingMore ? "Discovering more..." : "Load More from Archives"}
              </button>
          </div>
      )}
    </div>
  );
};
