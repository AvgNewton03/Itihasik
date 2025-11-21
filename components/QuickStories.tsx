import React from 'react';
import { Story } from '../types';

interface QuickStoriesProps {
  stories: Story[];
  onReadStory: (story: Story) => void;
}

export const QuickStories: React.FC<QuickStoriesProps> = ({ stories, onReadStory }) => {
  return (
    <aside className="w-full lg:w-80 flex-shrink-0 bg-surface border-l border-slate-700 h-full overflow-y-auto hidden lg:block scrollbar-thin">
      <div className="p-5 border-b border-slate-700 bg-surface/80 backdrop-blur-md sticky top-0 z-10">
        <h2 className="font-serif text-lg font-bold text-gray-100 flex items-center tracking-wider">
          <span className="mr-2 text-primary">✦</span> Chronicles
        </h2>
      </div>
      <div className="p-4 space-y-4">
        {stories.map((story) => (
          <div 
            key={story.id} 
            className="group relative bg-slate-900 border border-slate-700 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(217,119,6,0.15)]"
            onClick={() => onReadStory(story)}
          >
            <div className="h-32 w-full overflow-hidden relative">
               <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
               <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors duration-300"></div>
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