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
    category
}) => {
  const [viewType, setViewType] = useState<'GRID' | 'MAP'>('GRID');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Reset to Grid if category changes (e.g. from Temples to Gods)
  useEffect(() => {
      if (category !== AppSection.TEMPLES) {
          setViewType('GRID');
      }
  }, [category]);

  // Initialize Map when viewType changes to MAP
  useEffect(() => {
      if (viewType === 'MAP' && !isLoading && items.length > 0 && mapRef.current) {
          if (!mapInstanceRef.current && window.L) {
              // Create map
              const map = window.L.map(mapRef.current).setView([20.5937, 78.9629], 5); // Center of India
              
              // Dark theme map tiles
              window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                  subdomains: 'abcd',
                  maxZoom: 20
              }).addTo(map);

              // Add markers
              const markers: any[] = [];
              items.forEach(item => {
                  if (item.lat && item.lng) {
                      const marker = window.L.marker([item.lat, item.lng])
                        .addTo(map)
                        .bindPopup(`
                            <div class="text-center text-slate-900">
                                <b class="text-sm font-bold">${item.title}</b><br/>
                                <button id="popup-${item.id}" class="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">Explore</button>
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

              // Fit bounds if markers exist
              if (markers.length > 0) {
                  const group = window.L.featureGroup(markers);
                  map.fitBounds(group.getBounds(), { padding: [50, 50] });
              }

              mapInstanceRef.current = map;
          }
      }

      // Cleanup
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
        <div key={i} className="bg-surface rounded-xl overflow-hidden animate-pulse border border-slate-700">
          <div className="h-64 bg-slate-800"></div>
          <div className="p-6 space-y-4">
            <div className="h-6 bg-slate-800 rounded w-3/4"></div>
            <div className="h-4 bg-slate-800 rounded w-full"></div>
            <div className="h-4 bg-slate-800 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto pb-20">
      <div className="mb-12 flex flex-col md:flex-row justify-between items-end md:items-center border-b border-slate-800 pb-6">
        <div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-100 mb-2 tracking-tight">{title}</h2>
            <p className="text-text-muted text-sm uppercase tracking-widest">
                {isLoading ? "Unearthing ancient secrets..." : `Found ${items.length} Records`}
            </p>
        </div>
        
        {/* View Toggles - ONLY VISIBLE FOR TEMPLES */}
        {!isLoading && items.length > 0 && category === AppSection.TEMPLES && (
            <div className="flex space-x-2 bg-surface p-1 rounded-lg border border-slate-700 mt-4 md:mt-0">
                <button 
                    onClick={() => setViewType('GRID')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewType === 'GRID' ? 'bg-primary text-slate-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Grid View
                </button>
                <button 
                    onClick={() => setViewType('MAP')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewType === 'MAP' ? 'bg-primary text-slate-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Map View
                </button>
            </div>
        )}
      </div>

      {viewType === 'GRID' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
            {items.map((item) => (
              <div 
                key={item.id}
                onClick={() => onItemClick(item)}
                className="group relative bg-surface rounded-xl overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 border border-slate-700 shadow-xl"
              >
                {/* Image Container */}
                <div className="relative h-64 overflow-hidden bg-slate-800">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0"
                    onError={(e) => {
                       const target = e.target as HTMLImageElement;
                       if (!target.src.includes('placehold.co')) {
                           target.src = `https://placehold.co/600x400/1e293b/d97706?text=${encodeURIComponent(item.title)}`;
                       }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90"></div>
                  
                  {/* Overlay Text */}
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
                
                <div className="p-6 border-t border-slate-700 bg-surface">
                  <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed font-light">
                    {item.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center text-primary text-xs font-bold tracking-widest uppercase opacity-60 group-hover:opacity-100 transition-opacity">
                        Read Full Profile <span className="ml-2 text-lg">→</span>
                      </div>
                      {item.lat && category === AppSection.TEMPLES && (
                          <span className="text-xs text-gray-500 border border-slate-700 px-2 py-1 rounded flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
                              Map
                          </span>
                      )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && renderSkeleton(3)}
          </div>
      ) : (
          /* MAP VIEW - ONLY FOR TEMPLES */
          <div className="w-full h-[600px] rounded-xl border border-slate-700 overflow-hidden bg-slate-900 relative shadow-2xl animate-fade-in">
              <div ref={mapRef} className="w-full h-full z-0"></div>
              <div className="absolute bottom-4 left-4 bg-surface/80 backdrop-blur-md p-4 rounded-lg border border-slate-600 z-[1000] max-w-xs">
                  <h4 className="font-bold text-primary mb-1">Interactive Map</h4>
                  <p className="text-xs text-gray-300">Explore locations geographically. Click markers to view details.</p>
              </div>
          </div>
      )}
      
      {/* Load More / Empty State */}
      {!isLoading && items.length === 0 && (
          <div className="text-center py-20 border border-dashed border-slate-700 rounded-2xl bg-surface/30">
             <p className="text-gray-500 font-serif text-lg">The archives are silent.</p>
          </div>
      )}

      {!isLoading && items.length > 0 && onLoadMore && viewType === 'GRID' && (
          <div className="mt-16 text-center">
              <button 
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="px-8 py-3 bg-surface border border-slate-600 hover:border-primary text-gray-300 hover:text-primary rounded-full transition-all duration-300 font-semibold tracking-wide disabled:opacity-50"
              >
                {isLoadingMore ? (
                    <span className="flex items-center">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></span>
                        Discovering more...
                    </span>
                ) : "Load More from Archives"}
              </button>
          </div>
      )}
    </div>
  );
};