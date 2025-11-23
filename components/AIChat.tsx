
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { generateHistoryResponse, playTextToSpeech, stopTextToSpeech } from '../services/geminiService';

interface AIChatProps {
  initialQuery?: string;
  onBack: () => void;
}

interface ExtendedMessage extends ChatMessage {
    imageUrl?: string;
}

export const AIChat: React.FC<AIChatProps> = ({ initialQuery, onBack }) => {
  const [input, setInput] = useState(initialQuery || '');
  const [messages, setMessages] = useState<ExtendedMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'I am Itihasik, keeper of the chronicles. Ask me about any god, temple, or event in history.',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialQuery) {
        handleSend(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async (queryOverride?: string) => {
    const query = queryOverride || input;
    if (!query.trim()) return;

    const userMsg: ExtendedMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const { text, imagePrompt } = await generateHistoryResponse(query);

    let imageUrl = undefined;
    if (imagePrompt) {
        const promptSuffix = " photorealistic, 8k, cinematic lighting, ancient india, highly detailed, sharp focus";
        const cleanPrompt = (imagePrompt + promptSuffix).substring(0, 300);
        const encodedPrompt = encodeURIComponent(cleanPrompt);
        imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true&seed=${Math.random()}`;
    }

    const modelMsg: ExtendedMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: text,
      imageUrl: imageUrl,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, modelMsg]);
    setIsLoading(false);
  };

  const handleSpeak = (text: string) => {
      setIsPlaying(true);
      playTextToSpeech(text, () => setIsPlaying(false));
  };

  const handleStopSpeak = () => {
      stopTextToSpeech();
      setIsPlaying(false);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto md:py-6 relative">
      {/* Floating Back Button */}
      <div className="absolute top-4 left-4 md:left-0 z-50">
        <button 
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-full text-white shadow-lg hover:bg-slate-800/80 transition-all duration-300 group"
        >
            <svg className="w-5 h-5 md:mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden md:inline font-medium text-sm">Home</span>
        </button>
      </div>

      {/* Main Chat Container */}
      <div className="flex flex-col flex-1 bg-slate-900/30 backdrop-blur-xl md:border md:border-white/10 md:rounded-3xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
          {/* Header */}
          <div className="bg-slate-900/50 border-b border-white/5 p-4 flex justify-center items-center backdrop-blur-md z-10">
            <h3 className="font-serif text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent tracking-wide">
                Oracle of Time
            </h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[90%] md:max-w-[75%] p-6 rounded-3xl shadow-xl backdrop-blur-md border ${
                    msg.role === 'user'
                      ? 'bg-slate-800/80 border-slate-600/50 text-gray-100 rounded-br-sm'
                      : 'bg-black/40 border-white/10 text-gray-200 rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'model' && msg.imageUrl && (
                      <div className="mb-5 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900 min-h-[200px]">
                          <img 
                            src={msg.imageUrl} 
                            alt="Historical visualization" 
                            className="w-full h-auto object-cover max-h-80 hover:scale-105 transition-transform duration-700"
                            loading="lazy"
                          />
                      </div>
                  )}
                  
                  <p className="whitespace-pre-wrap text-[16px] leading-8 font-sans font-light tracking-wide">
                    {msg.text}
                  </p>

                  {msg.role === 'model' && (
                    <div className="mt-5 pt-4 border-t border-white/10 flex justify-between items-center">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Itihasik AI</span>
                      
                      {isPlaying ? (
                          <button
                            onClick={handleStopSpeak}
                            className="flex items-center text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-full hover:bg-red-500/20 transition-all backdrop-blur-sm"
                          >
                            <svg className="w-4 h-4 mr-1.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                            </svg>
                            Stop Listening
                          </button>
                      ) : (
                          <button
                            onClick={() => handleSpeak(msg.text)}
                            className="flex items-center text-xs text-primary font-bold hover:text-accent transition-colors px-3 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                            Listen
                          </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
                <div className="flex items-start animate-fade-in">
                    <div className="bg-black/40 border border-white/10 p-5 rounded-3xl rounded-bl-sm shadow-sm backdrop-blur-md">
                        <div className="flex space-x-2 items-center h-6">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-slate-900/60 border-t border-white/5 backdrop-blur-md">
            <div className="flex space-x-4 relative max-w-4xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about a god, temple, or era..."
                className="flex-1 bg-slate-800/50 border border-slate-600/50 rounded-full px-6 py-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-200 placeholder-gray-500 transition-all backdrop-blur-sm shadow-inner"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="bg-primary hover:bg-accent text-slate-900 font-bold rounded-full w-14 h-14 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-orange-500/40 hover:scale-105"
              >
                <svg className="w-6 h-6 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
      </div>
    </div>
  );
};
