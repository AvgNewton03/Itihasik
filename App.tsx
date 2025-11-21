
import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { QuickStories } from './components/QuickStories';
import { SectionGrid } from './components/SectionGrid';
import { AIChat } from './components/AIChat';
import { TopicDetail } from './components/TopicDetail';
import { AppSection, SectionItem, Story } from './types';
import { fetchDynamicSectionData, isGeminiConfigured } from './services/geminiService';

const STORIES: Story[] = [
  { id: '1', title: 'The Churning of the Ocean', category: 'Mythology', preview: 'Devas and Asuras churn the ocean...', imageUrl: 'https://image.pollinations.ai/prompt/Samudra%20Manthan%20churning%20ocean%20milk%20hindu%20mythology%20art%20photorealistic?width=400&height=400&nologo=true' },
  { id: '2', title: 'Ashokas Transformation', category: 'History', preview: 'How the Kalinga war changed an emperor...', imageUrl: 'https://image.pollinations.ai/prompt/Emperor%20Ashoka%20looking%20at%20battlefield%20sad%20cinematic%20historical?width=400&height=400&nologo=true' },
  { id: '3', title: 'The Loyalty of Karna', category: 'Mythology', preview: 'A warrior defined by friendship and fate...', imageUrl: 'https://image.pollinations.ai/prompt/Karna%20mahabharata%20warrior%20golden%20armor%20sun%20god%20cinematic?width=400&height=400&nologo=true' },
  { id: '4', title: 'Building of Brihadeeswarar', category: 'History', preview: 'The architectural marvel of Thanjavur...', imageUrl: 'https://image.pollinations.ai/prompt/Brihadeeswarar%20Temple%20thanjavur%20ancient%20architecture%20photorealistic?width=400&height=400&nologo=true' },
  { id: '5', title: 'Krishna and Sudama', category: 'Folklore', preview: 'A tale of divine friendship...', imageUrl: 'https://image.pollinations.ai/prompt/Krishna%20washing%20feet%20of%20poor%20sudama%20friendship%20hindu%20art?width=400&height=400&nologo=true' },
];

function App() {
  const [currentSection, setCurrentSection] = useState<AppSection>(AppSection.HOME);
  const [viewMode, setViewMode] = useState<'LIST' | 'DETAIL'>('LIST');
  const [selectedItem, setSelectedItem] = useState<SectionItem | null>(null);
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('');
  
  // Data States
  const [templesData, setTemplesData] = useState<SectionItem[]>([]);
  const [godsData, setGodsData] = useState<SectionItem[]>([]);
  const [textsData, setTextsData] = useState<SectionItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);

  // Check configuration on mount
  useEffect(() => {
      setIsConfigured(isGeminiConfigured());
  }, []);

  // Load data when section changes if not already loaded
  useEffect(() => {
    const loadSectionData = async () => {
      if (!isGeminiConfigured()) return;

      if (currentSection === AppSection.TEMPLES && templesData.length === 0) {
        setIsLoadingData(true);
        const data = await fetchDynamicSectionData('TEMPLES');
        setTemplesData(data);
        setIsLoadingData(false);
      } else if (currentSection === AppSection.GODS && godsData.length === 0) {
        setIsLoadingData(true);
        const data = await fetchDynamicSectionData('GODS');
        setGodsData(data);
        setIsLoadingData(false);
      } else if (currentSection === AppSection.TEXTS && textsData.length === 0) {
        setIsLoadingData(true);
        const data = await fetchDynamicSectionData('TEXTS');
        setTextsData(data);
        setIsLoadingData(false);
      }
    };

    if (viewMode === 'LIST') {
      loadSectionData();
    }
  }, [currentSection, viewMode, templesData.length, godsData.length, textsData.length]);

  const handleSectionChange = (section: AppSection) => {
    setCurrentSection(section);
    setViewMode('LIST');
    setSelectedItem(null);
    setSearchInitialQuery('');
  };

  const handleReadStory = (story: Story) => {
    setSearchInitialQuery(`Tell me the full story of "${story.title}" in an engaging way.`);
    setCurrentSection(AppSection.CHAT);
    setViewMode('LIST');
  };

  const handleSearch = (query: string) => {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return;
    setSearchInitialQuery(query);
    setCurrentSection(AppSection.CHAT);
    setViewMode('LIST');
  };

  const handleItemClick = (item: SectionItem) => {
    setSelectedItem(item);
    setViewMode('DETAIL');
  };

  const handleBackToArchive = () => {
    setViewMode('LIST');
    setSelectedItem(null);
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !isConfigured) return;
    setIsLoadingMore(true);

    let currentItems: SectionItem[] = [];
    let category: 'TEMPLES' | 'GODS' | 'TEXTS' | null = null;

    if (currentSection === AppSection.TEMPLES) {
        currentItems = templesData;
        category = 'TEMPLES';
    } else if (currentSection === AppSection.GODS) {
        currentItems = godsData;
        category = 'GODS';
    } else if (currentSection === AppSection.TEXTS) {
        currentItems = textsData;
        category = 'TEXTS';
    }

    if (category) {
        const excludeNames = currentItems.map(i => i.title);
        const newItems = await fetchDynamicSectionData(category, excludeNames);
        
        if (category === 'TEMPLES') setTemplesData(prev => [...prev, ...newItems]);
        if (category === 'GODS') setGodsData(prev => [...prev, ...newItems]);
        if (category === 'TEXTS') setTextsData(prev => [...prev, ...newItems]);
    }

    setIsLoadingMore(false);
  };

  const renderContent = () => {
    if (viewMode === 'DETAIL' && selectedItem) {
      return (
        <TopicDetail 
          topicId={selectedItem.id} 
          topicName={selectedItem.title} 
          onBack={handleBackToArchive}
          category={currentSection}
        />
      );
    }

    switch (currentSection) {
      case AppSection.HOME:
        return (
          <div className="p-6 md:p-10 space-y-12 max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[500px] group">
              <img 
                src="https://image.pollinations.ai/prompt/ancient%20indian%20temple%20sunset%20river%20ganga%20cinematic%20photorealistic%208k?width=1200&height=600&nologo=true" 
                alt="Hero" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent flex flex-col justify-end items-start p-10 md:p-16">
                <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 drop-shadow-lg tracking-tight">
                  Unveil the <span className="text-primary">Timeless</span>
                </h1>
                <p className="text-xl text-gray-200 max-w-2xl drop-shadow-md mb-8 font-light leading-relaxed">
                  Journey through the annals of history. Explore the divine architecture, forgotten deities, and sacred scriptures of India with AI-powered storytelling.
                </p>
                <button 
                  onClick={() => handleSectionChange(AppSection.CHAT)}
                  className="px-8 py-4 bg-primary text-slate-900 font-bold rounded-xl hover:bg-accent transition-all shadow-[0_0_20px_rgba(217,119,6,0.4)] hover:shadow-[0_0_30px_rgba(217,119,6,0.6)] flex items-center gap-2"
                >
                  Start Your Quest 
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            </div>
            
            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div onClick={() => handleSectionChange(AppSection.TEMPLES)} className="bg-surface p-8 rounded-2xl border border-slate-700 cursor-pointer hover:border-primary hover:-translate-y-2 transition-all duration-300 group">
                <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <span className="text-3xl group-hover:scale-110 transition-transform">🛕</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-gray-100 group-hover:text-primary transition-colors">Sacred Temples</h3>
                <p className="text-gray-400 mt-3 leading-relaxed">Discover the architectural marvels and the science behind ancient stones.</p>
              </div>
              <div onClick={() => handleSectionChange(AppSection.GODS)} className="bg-surface p-8 rounded-2xl border border-slate-700 cursor-pointer hover:border-primary hover:-translate-y-2 transition-all duration-300 group">
                 <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <span className="text-3xl group-hover:scale-110 transition-transform">🕉️</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-gray-100 group-hover:text-primary transition-colors">Deities & Avatars</h3>
                <p className="text-gray-400 mt-3 leading-relaxed">Explore the pantheon of gods, their origins, and their stories.</p>
              </div>
              <div onClick={() => handleSectionChange(AppSection.TEXTS)} className="bg-surface p-8 rounded-2xl border border-slate-700 cursor-pointer hover:border-primary hover:-translate-y-2 transition-all duration-300 group">
                 <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <span className="text-3xl group-hover:scale-110 transition-transform">📜</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-gray-100 group-hover:text-primary transition-colors">Ancient Texts</h3>
                <p className="text-gray-400 mt-3 leading-relaxed">Decipher the wisdom of the Vedas, Upanishads, and Epics.</p>
              </div>
            </div>
          </div>
        );
      case AppSection.TEMPLES:
        return <SectionGrid title="Sacred Architecture" items={templesData} onItemClick={handleItemClick} isLoading={isLoadingData} onLoadMore={handleLoadMore} isLoadingMore={isLoadingMore} category={AppSection.TEMPLES} apiKeyMissing={!isConfigured} />;
      case AppSection.GODS:
        return <SectionGrid title="The Pantheon" items={godsData} onItemClick={handleItemClick} isLoading={isLoadingData} onLoadMore={handleLoadMore} isLoadingMore={isLoadingMore} category={AppSection.GODS} apiKeyMissing={!isConfigured} />;
      case AppSection.TEXTS:
        return <SectionGrid title="Wisdom Scrolls" items={textsData} onItemClick={handleItemClick} isLoading={isLoadingData} onLoadMore={handleLoadMore} isLoadingMore={isLoadingMore} category={AppSection.TEXTS} apiKeyMissing={!isConfigured} />;
      case AppSection.CHAT:
        return (
            <div className="p-4 h-full">
                <AIChat key={searchInitialQuery} initialQuery={searchInitialQuery} />
            </div>
        );
      default:
        return <div>Section not found</div>;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background font-sans text-gray-200 overflow-hidden">
      <Navigation 
        currentSection={currentSection} 
        onSectionChange={handleSectionChange}
        onSearch={handleSearch}
      />
      
      <main className="flex flex-1 overflow-hidden relative">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto relative scrollbar-thin">
           {renderContent()}
        </div>

        {/* Right Sidebar - Quick Stories (Hidden in Detail View and Chat) */}
        {currentSection !== AppSection.CHAT && viewMode === 'LIST' && (
             <QuickStories stories={STORIES} onReadStory={handleReadStory} />
        )}
      </main>
    </div>
  );
}

export default App;
