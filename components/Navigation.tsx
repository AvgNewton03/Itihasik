import React, { useState } from 'react';
import { AppSection } from '../types';

interface NavigationProps {
  currentSection: AppSection;
  onSectionChange: (section: AppSection) => void;
  onSearch: (query: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentSection, onSectionChange, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  // Icons (Minimalist SVGs)
  const Icons = {
    Home: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    Temples: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>,
    Gods: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    Texts: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    Chat: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    Search: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
  };

  const navItems = [
    { id: AppSection.HOME, label: 'Home', Icon: Icons.Home },
    { id: AppSection.TEMPLES, label: 'Temples', Icon: Icons.Temples },
    { id: AppSection.GODS, label: 'Deities', Icon: Icons.Gods },
    { id: AppSection.TEXTS, label: 'Texts', Icon: Icons.Texts },
    { id: AppSection.CHAT, label: 'Guide', Icon: Icons.Chat },
  ];

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div 
            className="flex-shrink-0 flex items-center cursor-pointer group" 
            onClick={() => onSectionChange(AppSection.HOME)}
          >
            <div className="w-8 h-8 bg-primary rounded-sm rotate-45 group-hover:rotate-0 transition-all duration-500 flex items-center justify-center mr-3">
                <span className="text-white font-serif font-bold text-sm -rotate-45 group-hover:rotate-0 transition-all duration-500">I</span>
            </div>
            <span className="font-serif text-2xl font-bold text-gray-100 tracking-widest group-hover:text-primary transition-colors duration-300">ITIHASIK</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300
                  ${currentSection === item.id 
                    ? 'text-primary bg-surface shadow-lg border border-slate-700' 
                    : 'text-text-muted hover:text-gray-100 hover:bg-surface/50'
                  }`}
              >
                <item.Icon />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="flex items-center">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search the archives..."
                className="w-48 sm:w-64 bg-surface/50 border border-slate-700 text-gray-200 text-sm rounded-full focus:ring-2 focus:ring-primary focus:border-transparent block w-full pl-10 p-2.5 transition-all duration-300 group-hover:bg-surface group-hover:w-72"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-hover:text-primary transition-colors">
                <Icons.Search />
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div className="md:hidden flex justify-around bg-surface py-3 border-t border-slate-800">
         {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`flex flex-col items-center px-4 py-1 text-xs font-medium
                ${currentSection === item.id ? 'text-primary' : 'text-gray-500'}`}
            >
              <item.Icon />
              <span className="mt-1">{item.label}</span>
            </button>
         ))}
      </div>
    </nav>
  );
};