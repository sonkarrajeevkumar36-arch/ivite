import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Sparkles, 
  MapPin, 
  Send, 
  Bot, 
  User as UserIcon, 
  Loader2, 
  ExternalLink,
  Navigation,
  Search,
  Map as MapIcon,
  Star,
  Info,
  MapPinned,
  ShieldAlert,
  LocateFixed
} from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  content: string;
  links?: { title: string; uri: string; snippet?: string }[];
  mode: 'inspiration' | 'venue';
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'inspiration' | 'venue'>('inspiration');
  const [locationStatus, setLocationStatus] = useState<'checking' | 'granted' | 'denied' | 'prompt'>('checking');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle geolocation status and request
  useEffect(() => {
    const checkPermissions = async () => {
      if ("geolocation" in navigator) {
        try {
          // navigator.permissions.query is not supported in all browsers (e.g., Safari)
          if (navigator.permissions && navigator.permissions.query) {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            setLocationStatus(result.state as any);
            result.onchange = () => setLocationStatus(result.state as any);
          } else {
            // Fallback for browsers that don't support permissions query
            setLocationStatus('prompt');
          }
        } catch (e) {
          setLocationStatus('prompt');
        }
      } else {
        setLocationStatus('denied');
      }
    };
    checkPermissions();
  }, []);

  const requestLocation = () => {
    setLocationStatus('checking');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationStatus('granted');
      },
      (err) => {
        setLocationStatus('denied');
        console.warn("Location access denied:", err);
      },
      { timeout: 10000 }
    );
  };

  const getCurrentLocation = (): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        () => resolve(null),
        { timeout: 5000, enableHighAccuracy: true }
      );
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const currentInput = input;
    const currentMode = activeMode;
    const userMessage: Message = { role: 'user', content: currentInput, mode: currentMode };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      if (currentMode === 'inspiration') {
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: currentInput,
          config: {
            systemInstruction: "You are InviteX Pro's Event Inspiration Assistant. Help users with creative party themes, wording for invitations, event planning timelines, and professional hosting advice. Keep responses concise and stylish with a premium tone.",
          },
        });

        const aiMessage: Message = { 
          role: 'ai', 
          content: response.text || "I'm sorry, I couldn't generate a response for your inspiration request.",
          mode: 'inspiration'
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Venue Mode with Maps Grounding - MUST use gemini-2.5-flash
        const position = await getCurrentLocation();
        const latLng = position ? {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        } : undefined;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: currentInput,
          config: {
            systemInstruction: `You are the InviteX Pro Venue Finder. Your goal is to find the perfect physical locations for users' events. 
            If user location is available, prioritize results within 10-20km of them. 
            For each venue, provide a short, enticing description. 
            Always rely on Google Maps data for accuracy. 
            Focus on quality over quantity. Mention ratings if they are exceptional.`,
            tools: [{ googleMaps: {} }],
            toolConfig: latLng ? {
              retrievalConfig: { latLng }
            } : undefined
          },
        });

        const metadata = response.candidates?.[0]?.groundingMetadata;
        const chunks = metadata?.groundingChunks || [];
        
        // Extract links and snippets from grounding chunks as per rules
        const links = chunks
          .filter(c => c.maps)
          .map(c => ({ 
            title: c.maps?.title || "View Venue", 
            uri: c.maps?.uri,
            snippet: c.maps?.placeAnswerSources?.[0]?.reviewSnippets?.[0]
          }));

        const aiMessage: Message = { 
          role: 'ai', 
          content: response.text || "Here are some venue recommendations based on your request:",
          links: links.length > 0 ? links : undefined,
          mode: 'venue'
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("AI Assistant Error:", error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: "I'm having trouble connecting to the network right now. Please try again in a moment.",
        mode: currentMode 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-14rem)] animate-fade relative">
      {/* Mode Selector */}
      <div className="flex p-1.5 bg-slate-900/60 rounded-3xl border border-white/5 mb-6 shadow-xl relative z-20">
        <button 
          onClick={() => setActiveMode('inspiration')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${activeMode === 'inspiration' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden xs:inline">Ideas & Wording</span>
          <span className="xs:hidden">Ideas</span>
        </button>
        <button 
          onClick={() => setActiveMode('venue')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${activeMode === 'venue' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <MapPinned className="w-4 h-4" />
          <span className="hidden xs:inline">Venue Finder</span>
          <span className="xs:hidden">Venues</span>
        </button>
      </div>

      {/* Enhanced Location Bar */}
      {activeMode === 'venue' && (
        <div className={`mb-4 flex items-center justify-between px-5 py-3 rounded-2xl border transition-all animate-in fade-in slide-in-from-top-2 ${
          locationStatus === 'granted' 
            ? 'bg-green-500/5 border-green-500/20' 
            : locationStatus === 'denied' 
            ? 'bg-red-500/5 border-red-500/20' 
            : 'bg-indigo-500/5 border-indigo-500/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${
              locationStatus === 'granted' 
                ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' 
                : locationStatus === 'denied' 
                ? 'bg-red-500' 
                : 'bg-indigo-500 animate-pulse'
            }`} />
            <div className="flex flex-col">
              <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${
                locationStatus === 'granted' ? 'text-green-400' : locationStatus === 'denied' ? 'text-red-400' : 'text-indigo-400'
              }`}>
                {locationStatus === 'granted' ? 'Precise Location Active' : locationStatus === 'denied' ? 'Location Required' : 'Checking Geolocation'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {locationStatus === 'granted' ? 'Optimized for nearby results' : locationStatus === 'denied' ? 'Manual search only (Check settings)' : 'Allow access for better suggestions'}
              </span>
            </div>
          </div>
          {locationStatus !== 'granted' && locationStatus !== 'checking' && (
            <button 
              onClick={requestLocation}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <LocateFixed className="w-3 h-3" />
              Enable
            </button>
          )}
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2 mb-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-10 py-12 opacity-80">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/30 blur-[60px] rounded-full" />
              <div className="relative w-28 h-28 bg-slate-900 rounded-[44px] flex items-center justify-center border border-white/10 shadow-2xl">
                {activeMode === 'inspiration' ? <Bot className="w-14 h-14 text-indigo-400" /> : <MapPinned className="w-14 h-14 text-indigo-400" />}
              </div>
            </div>
            <div className="max-w-md space-y-4">
              <h3 className="text-3xl font-black text-white tracking-tight">
                {activeMode === 'inspiration' ? 'Spark your creativity' : 'Find your destination'}
              </h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                {activeMode === 'inspiration' 
                  ? "I'm here to help you write stunning invitations and plan the perfect theme. Try: 'Write a funny 30th birthday invite for a gamer'." 
                  : "Searching for the perfect spot? I use real-time Google Maps data to find top-rated spots nearby or in any city you choose."}
              </p>
              {activeMode === 'venue' && locationStatus !== 'granted' && (
                <div className="p-4 bg-slate-900/60 rounded-3xl border border-white/5 inline-flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                  <span className="text-xs text-slate-300 text-left max-w-[200px]">Enable location for automatic discovery of nearby venues.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-3 duration-500`}>
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl border border-white/10 ${msg.role === 'user' ? 'bg-slate-800' : 'bg-indigo-600'}`}>
              {msg.role === 'user' ? <UserIcon className="w-5 h-5 text-indigo-400" /> : <Bot className="w-5 h-5 text-white" />}
            </div>
            
            <div className={`flex flex-col space-y-3 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`glass p-5 rounded-[32px] text-sm leading-relaxed border-white/5 shadow-2xl ${
                msg.role === 'user' ? 'bg-indigo-600/10 rounded-tr-none text-slate-100' : 'bg-slate-900/80 rounded-tl-none text-slate-200'
              }`}>
                {msg.content}
                
                {msg.links && msg.links.length > 0 && (
                  <div className="mt-6 space-y-4 border-t border-white/10 pt-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Discover on Google Maps</p>
                    <div className="grid grid-cols-1 gap-3">
                      {msg.links.map((link, j) => (
                        <a 
                          key={j} 
                          href={link.uri} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex flex-col p-4 bg-white/5 hover:bg-white/10 transition-all rounded-[24px] border border-white/5 hover:border-indigo-500/40 group relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex items-center gap-3 mb-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                               <MapPin className="w-4 h-4 text-indigo-400" />
                            </div>
                            <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate pr-4">
                              {link.title}
                            </span>
                          </div>
                          {link.snippet && (
                            <div className="flex gap-2">
                               <div className="mt-1 flex-shrink-0"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /></div>
                               <p className="text-[11px] text-slate-400 line-clamp-2 italic leading-relaxed">
                                 "{link.snippet}"
                               </p>
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] px-1">
                {msg.role === 'user' ? 'Member' : `${msg.mode === 'venue' ? 'AI Venue Specialist' : 'AI Creative Director'}`}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center animate-pulse shadow-2xl">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="glass p-5 rounded-[32px] rounded-tl-none border-white/5 bg-slate-900/40 min-w-[140px]">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Section */}
      <form onSubmit={handleSend} className="relative group mt-auto pb-4">
        <div className="absolute inset-0 bg-indigo-500/5 blur-[40px] group-focus-within:bg-indigo-500/10 transition-all duration-700 rounded-[44px]" />
        <div className="relative glass rounded-[40px] border-white/10 p-2.5 flex items-center gap-2 overflow-hidden shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <div className="w-12 h-12 rounded-[28px] bg-slate-800 flex items-center justify-center flex-shrink-0 border border-white/5 shadow-inner">
            {activeMode === 'inspiration' ? <Sparkles className="w-5 h-5 text-indigo-400" /> : <MapPinned className="w-5 h-5 text-indigo-400" />}
          </div>
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={activeMode === 'inspiration' ? "Describe your event vision..." : "Tell me what kind of venue you need..."}
            className="flex-1 bg-transparent border-none py-4 px-3 outline-none text-slate-100 placeholder:text-slate-600 text-sm font-semibold"
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-90 disabled:opacity-30 disabled:scale-100 disabled:bg-slate-800"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIChat;