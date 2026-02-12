import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Invitation, Template } from '../types';
import { Mail, Calendar, MapPin, Clock, X, Check, User as UserIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  user: User;
  compact?: boolean;
  invitations?: Invitation[]; // Received from parent (Dashboard)
}

const Inbox: React.FC<Props> = ({ user, compact = false, invitations = [] }) => {
  const [selectedInvite, setSelectedInvite] = useState<Invitation | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const openInvite = async (invite: Invitation) => {
    setSelectedInvite(invite);
    if (invite.templateId) {
      try {
        const tSnap = await getDoc(doc(db, 'templates', invite.templateId));
        if (tSnap.exists()) setSelectedTemplate({ id: tSnap.id, ...tSnap.data() } as Template);
      } catch (e) { console.warn("Style load failed"); }
    }
    
    // Mark as viewed in Firestore if it was just 'sent'
    if (invite.status === 'sent') {
      try {
        await updateDoc(doc(db, 'invitations', invite.id), { status: 'viewed' });
      } catch (e) {
        console.error("Error updating invite status:", e);
      }
    }
    
    confetti({ particleCount: 50, spread: 360, origin: { x: 0.5, y: 0.5 } });
  };

  // If compact, only show the first 3
  const displayedInvites = compact ? invitations.slice(0, 3) : invitations;

  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass rounded-3xl text-slate-500 text-center">
        <Mail className="w-10 h-10 opacity-10 mb-4" />
        <p className="font-medium text-sm">No invitations yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayedInvites.map(invite => (
        <div 
          key={invite.id} 
          onClick={() => openInvite(invite)}
          className={`glass p-4 rounded-2xl cursor-pointer transition-all hover:bg-slate-800 border-white/5 flex items-center gap-4 ${invite.status === 'sent' ? 'ring-1 ring-indigo-500/50' : ''}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${invite.status === 'sent' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
            <Mail className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm truncate">{invite.templateData?.eventTitle || 'Invitation'}</h4>
            <p className="text-[11px] text-slate-500 truncate">From {invite.senderName}</p>
          </div>
          <div className="hidden xs:flex flex-col items-end gap-1">
             <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400">{invite.category}</span>
             {invite.status === 'sent' && <span className="bg-green-500 w-1.5 h-1.5 rounded-full animate-pulse" />}
          </div>
        </div>
      ))}

      {selectedInvite && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-slate-950/95 backdrop-blur-md animate-fade overflow-y-auto">
          <div className="relative glass w-full md:max-w-2xl h-full md:h-auto md:min-h-[500px] md:rounded-[40px] flex flex-col overflow-y-auto">
             <button onClick={() => { setSelectedInvite(null); setSelectedTemplate(null); }} className="absolute top-4 right-4 p-2.5 bg-black/40 text-white rounded-full z-10"><X className="w-6 h-6" /></button>
             
             <div className="p-8 md:p-12 flex-1 flex flex-col items-center justify-center text-center space-y-6 md:space-y-8" style={{ background: selectedTemplate?.style || '#1e293b' }}>
                <div className="space-y-4 drop-shadow-xl pt-10 md:pt-0" style={{ fontFamily: selectedTemplate?.fontFamily || 'inherit', color: selectedTemplate?.textColor || '#ffffff' }}>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ color: 'inherit' }}>{selectedInvite.category}</span>
                  <h1 className="text-3xl md:text-5xl font-black playfair tracking-tight" style={{ color: 'inherit' }}>{selectedInvite.templateData?.eventTitle}</h1>
                  <p className="text-xl font-medium italic opacity-90">Host: {selectedInvite.templateData?.hostName}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 w-full max-sm:max-w-[280px] max-w-sm">
                   <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3 border border-white/10">
                     <Calendar className="w-6 h-6 text-white" />
                     <div className="text-left"><p className="text-[9px] uppercase font-bold opacity-60">Date</p><p className="text-sm font-semibold text-white">{selectedInvite.templateData?.date}</p></div>
                   </div>
                   <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3 border border-white/10">
                     <Clock className="w-6 h-6 text-white" />
                     <div className="text-left"><p className="text-[9px] uppercase font-bold opacity-60">Time</p><p className="text-sm font-semibold text-white">{selectedInvite.templateData?.time}</p></div>
                   </div>
                   <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3 border border-white/10">
                     <MapPin className="w-6 h-6 text-white" />
                     <div className="text-left truncate"><p className="text-[9px] uppercase font-bold opacity-60">Venue</p><p className="text-sm font-semibold text-white truncate">{selectedInvite.templateData?.location}</p></div>
                   </div>
                </div>

                <div className="pt-2 space-y-6 w-full max-w-sm pb-10 md:pb-0" style={{ fontFamily: selectedTemplate?.fontFamily || 'inherit' }}>
                  {selectedInvite.templateData?.message && <p className="text-sm italic leading-relaxed opacity-80" style={{ color: selectedTemplate?.textColor || '#ffffff' }}>"{selectedInvite.templateData.message}"</p>}
                  <button onClick={() => { setSelectedInvite(null); setSelectedTemplate(null); }} className="w-full py-4 bg-white text-slate-950 rounded-2xl font-bold shadow-xl active:scale-95 transition-all">
                    I'm Attending
                  </button>
                  <p className="text-white/50 text-[10px]">Shared by {selectedInvite.senderName}</p>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inbox;