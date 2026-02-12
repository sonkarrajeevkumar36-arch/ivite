
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { Template, InvitationCategory, InvitationData, UserProfile } from '../types';
import {User} from 'firebase/auth';
import {GoogleGenAI} from "@google/genai";
import { Palette, X, Send, CheckCircle2, Users, Mail, Check, Sparkles, Loader2, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  user: User;
  profile: UserProfile;
  onSent: () => void;
}

const CATEGORIES: InvitationCategory[] = [
  'Wedding', 'Ring Ceremony', 'Birthday', 'Pooja', 'Bhandara',
  'Anniversary', 'Baby Shower', 'Housewarming', 'Engagement', 'Festival'
];

const TemplateSelection: React.FC<Props> = ({ user, profile, onSent }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [invitationData, setInvitationData] = useState<InvitationData>({});
  const [activeCategory, setActiveCategory] = useState<InvitationCategory | 'All'>('All');
  const [sending, setSending] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const q = collection(db, 'templates');
      const snap = await getDocs(q);
      setTemplates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!selectedTemplate) return;
    setGeneratingAI(true);
    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const prompt = `Write an elegant, warm invitation message for a ${selectedTemplate.category} event. 
      Title: ${invitationData.eventTitle || selectedTemplate.name}. 
      Host: ${invitationData.hostName || profile.name}.
      Category: ${selectedTemplate.category}. 
      Keep it between 40-60 words. Make it sound professional yet inviting.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      if (response.text) {
        setInvitationData(prev => ({ ...prev, message: response.text.trim() }));
      }
    } catch (err) {
      console.error("AI Error:", err);
    } finally {
      setGeneratingAI(false);
    }
  };

  const filteredTemplates = activeCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === activeCategory);

  const openFriendPicker = () => {
    if (!selectedTemplate) return;
    setShowFriendPicker(true);
  };

  const finalizeSend = async () => {
    if (selectedFriends.length === 0) return;
    setSending(true);
    try {
      for (const friendEmail of selectedFriends) {
        const q = query(collection(db, 'users'), where('email', '==', friendEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const recipientId = snap.docs[0].id;
          const recipientData = snap.docs[0].data() as UserProfile;
          await addDoc(collection(db, 'invitations'), {
            senderId: user.uid,
            senderName: profile.name,
            receiverId: recipientId,
            receiverName: recipientData.name,
            receiverEmail: recipientData.email,
            templateId: selectedTemplate?.id,
            templateData: invitationData,
            status: 'sent',
            category: selectedTemplate?.category,
            timestamp: serverTimestamp()
          });
        }
      }
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setSelectedTemplate(null);
      setShowFriendPicker(false);
      onSent();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const toggleFriendSelection = (email: string) => {
    setSelectedFriends(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
  };

  const FieldLabels: Record<string, string> = {
    hostName: 'Host Name',
    eventTitle: 'Event Title',
    date: 'Date',
    time: 'Time',
    location: 'Location',
    message: 'Message'
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Pick a <span className="gradient-text">Template</span></h2>
          <p className="text-slate-400 text-sm">Select and customize your modern invitation</p>
        </div>
        <div className="flex gap-2 bg-slate-900/50 p-1 rounded-2xl border border-white/5 overflow-x-auto custom-scrollbar whitespace-nowrap -mx-4 px-4 md:mx-0">
           <button 
             onClick={() => setActiveCategory('All')}
             className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === 'All' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
           >
             All
           </button>
           {CATEGORIES.map(cat => (
             <button 
               key={cat}
               onClick={() => setActiveCategory(cat)}
               className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === cat ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
             >
               {cat}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {loading ? [1,2,3,4].map(i => <div key={i} className="aspect-[4/5] glass rounded-2xl md:rounded-3xl animate-pulse" />) : filteredTemplates.map(template => (
          <div 
            key={template.id} 
            className="group glass rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer hover:border-indigo-500/50 transition-all"
            onClick={() => {
              setSelectedTemplate(template);
              setInvitationData({});
            }}
          >
            <div className="relative aspect-[4/5] bg-slate-800">
              <img src={template.previewImage} alt={template.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
              <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4">
                <span className="bg-indigo-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white mb-1 inline-block">{template.category}</span>
                <h4 className="text-base md:text-lg font-bold">{template.name}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedTemplate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 bg-slate-950/90 backdrop-blur-sm animate-fade">
          <div className="glass w-full md:max-w-5xl h-full md:h-auto md:max-h-[90vh] overflow-hidden md:rounded-[40px] shadow-2xl flex flex-col md:flex-row border-white/10 relative">
            
            {/* Mobile Close Button */}
            <button 
              onClick={() => setSelectedTemplate(null)} 
              className="absolute top-4 right-4 z-[70] p-2 bg-black/40 hover:bg-black/60 text-white rounded-full md:hidden"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-full md:w-1/2 p-4 md:p-6 flex flex-col relative overflow-hidden flex-shrink-0 min-h-[300px] md:min-h-0" style={{ background: selectedTemplate.style }}>
              <div className="hidden md:flex items-center justify-between mb-6 relative z-10">
                <span className="bg-black/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">Preview</span>
              </div>
              <div className="flex-1 rounded-2xl md:rounded-3xl flex items-center justify-center text-center p-4 md:p-8 relative z-10 bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
                  <div className="space-y-4 md:space-y-6 drop-shadow-lg overflow-y-auto" style={{ fontFamily: selectedTemplate.fontFamily || 'inherit', color: selectedTemplate.textColor || '#ffffff' }}>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight playfair italic">
                      {invitationData.eventTitle || selectedTemplate.name}
                    </h1>
                    <div className="space-y-2 md:space-y-4">
                       <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] opacity-80">Join us for</p>
                       <p className="text-2xl md:text-4xl playfair font-black">{invitationData.hostName || 'Host Name'}</p>
                    </div>
                    <div className="pt-4 md:pt-6 border-t border-white/20 space-y-1 md:space-y-2">
                       <p className="font-semibold text-base md:text-lg">{invitationData.date || 'Date'} • {invitationData.time || 'Time'}</p>
                       <p className="text-[10px] md:text-sm opacity-80 uppercase tracking-widest">{invitationData.location || 'Location Address'}</p>
                    </div>
                  </div>
              </div>
            </div>

            <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-slate-950 flex flex-col">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h3 className="text-xl md:text-2xl font-bold">Customize</h3>
                <button onClick={() => setSelectedTemplate(null)} className="hidden md:block p-2 hover:bg-slate-800 rounded-xl transition-colors"><X /></button>
              </div>

              <div className="space-y-4 md:space-y-5 flex-1">
                {selectedTemplate.fields.map(field => (
                  <div key={field} className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] md:text-sm font-medium text-slate-400 ml-1 uppercase tracking-wider">{FieldLabels[field] || field}</label>
                      {field === 'message' && (
                        <button 
                          onClick={handleAIGenerate}
                          disabled={generatingAI}
                          className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] md:text-xs font-bold transition-all"
                        >
                          {generatingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          Magic
                        </button>
                      )}
                      {field === 'location' && (
                        <div className="flex items-center gap-1.5 px-2 py-1 text-slate-500 rounded-lg text-[10px] font-bold italic">
                          <MapPin className="w-3 h-3" />
                          Need ideas? Use AI Finder
                        </div>
                      )}
                    </div>
                    {field === 'message' ? (
                      <textarea 
                        value={invitationData[field] || ''}
                        onChange={(e) => setInvitationData({...invitationData, [field]: e.target.value})}
                        className="w-full h-20 md:h-24 bg-slate-900 border border-slate-700/50 rounded-xl md:rounded-2xl py-2 px-4 md:py-3 md:px-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                        placeholder="Invite your guests..."
                      />
                    ) : (
                      <input 
                        type={field === 'date' ? 'date' : field === 'time' ? 'time' : 'text'}
                        value={invitationData[field] || ''}
                        onChange={(e) => setInvitationData({...invitationData, [field]: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700/50 rounded-xl md:rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 md:border-0 md:pt-0">
                <button 
                  onClick={openFriendPicker}
                  className="w-full py-3.5 md:py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl md:rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 group"
                >
                  <Send className="w-5 h-5" />
                  Continue to Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFriendPicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-slate-950/95 backdrop-blur-xl animate-fade">
          <div className="glass w-full md:max-w-md h-full md:h-auto md:rounded-[40px] p-6 md:p-8 flex flex-col border-indigo-500/20">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl md:text-2xl font-bold">Select <span className="text-indigo-400">Guests</span></h3>
               <button onClick={() => setShowFriendPicker(false)} className="p-2 hover:bg-slate-800 rounded-xl"><X /></button>
             </div>
             
             <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1 mb-6">
               {profile.friends.length === 0 ? (
                 <div className="text-center py-10 glass rounded-2xl text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-10" />
                    <p className="text-sm px-4">Find friends in the Friends tab first.</p>
                 </div>
               ) : (
                 profile.friends.map(email => (
                   <div 
                    key={email} 
                    onClick={() => toggleFriendSelection(email)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${selectedFriends.includes(email) ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-900/50 border-white/5'}`}
                   >
                      <div className="flex items-center gap-3 truncate">
                         <Mail className={`w-4 h-4 ${selectedFriends.includes(email) ? 'text-indigo-400' : 'text-slate-500'}`} />
                         <span className="text-sm font-medium truncate">{email}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${selectedFriends.includes(email) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-700'}`}>
                         {selectedFriends.includes(email) && <Check className="w-3 h-3 text-white" />}
                      </div>
                   </div>
                 ))
               )}
             </div>

             <div className="flex gap-3">
                <button onClick={() => setShowFriendPicker(false)} className="flex-1 py-3.5 glass text-slate-400 rounded-xl font-bold text-sm">Cancel</button>
                <button 
                  onClick={finalizeSend}
                  disabled={sending || selectedFriends.length === 0}
                  className="flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {sending ? 'Sending...' : `Send (${selectedFriends.length})`}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelection;
