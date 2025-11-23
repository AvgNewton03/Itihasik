import React from 'react';
import { Story } from '../types';

interface QuickStoriesProps {
  stories: Story[];
  onReadStory: (story: Story) => void;
  variant?: 'sidebar' | 'horizontal';
}

export const QuickStories: React.FC<QuickStoriesProps> = ({ stories, onReadStory, variant = 'sidebar' }) => {
  if (variant === 'horizontal') {
    return (
      <div className="w-full mt-8 md:hidden px-6 animate-fade-in">
        <h2 className="font-serif text-lg font-bold text-gray-100 flex items-center tracking-wider mb-4">
          <span className="mr-2 text-primary">✦</span> Chronicles
        </h2>
        <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide snap-x">
          {stories.map((story) => (
             <div 
              key={story.id} 
              className="flex-shrink-0 w-72 group relative bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden cursor-pointer snap-center backdrop-blur-md shadow-lg"
              onClick={() => onReadStory(story)}
            >
              <div className="h-40 w-full overflow-hidden relative">
                 <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">{story.category}</span>
                <h3 className="mt-2 text-lg font-serif font-bold text-gray-100 group-hover:text-primary transition-colors drop-shadow-md">
                  {story.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 bg-surface/50 border-l border-slate-700/50 h-full overflow-y-auto hidden lg:block scrollbar-thin backdrop-blur-sm">
      <div className="p-5 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <h2 className="font-serif text-lg font-bold text-gray-100 flex items-center tracking-wider">
          <span className="mr-2 text-primary">✦</span> Chronicles
        </h2>
      </div>
      <div className="p-4 space-y-4">
        {stories.map((story) => (
          <div 
            key={story.id} 
            className="group relative bg-slate-900/40 border border-slate-700/50 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(217,119,6,0.15)]"
            onClick={() => onReadStory(story)}
          >
            <div className="h-32 w-full overflow-hidden relative">
               <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
               <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-300"></div>
            </div>
            <div className="p-4">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest border border-primary/30 px-2 py-0.5 rounded-sm">{story.category}</span>
              <h3 className="mt-2 text-sm font-serif font-bold text-gray-200 group-hover:text-primary transition-colors">
                {story.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};