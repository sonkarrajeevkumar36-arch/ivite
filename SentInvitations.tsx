
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {User} from 'firebase/auth';
import { Invitation } from '../types';
import { Send, Calendar, Clock, User as UserIcon, CheckCircle } from 'lucide-react';

interface Props {
  user: User;
}

const SentInvitations: React.FC<Props> = ({ user }) => {
  const [sentInvites, setSentInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'invitations'),
      where('senderId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation));
        const sortedData = data.sort((a, b) => {
          const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
          const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
          return timeB - timeA;
        });
        setSentInvites(sortedData);
        setLoading(false);
      },
      error: (err) => {
        console.error("Sent Invitations Error:", err);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [user.uid]);

  const formatTimestamp = (ts: any) => {
    if (!ts) return { date: '-', time: '-' };
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes} ${ampm}`
    };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass h-48 rounded-2xl md:rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (sentInvites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass rounded-3xl text-slate-500 text-center">
        <Send className="w-12 h-12 opacity-10 mb-4" />
        <p className="font-medium text-sm">No sent invitations yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-fade">
      {sentInvites.map(invite => {
        const sentAt = formatTimestamp(invite.timestamp);
        return (
          <div 
            key={invite.id} 
            className="glass p-5 md:p-6 rounded-2xl md:rounded-3xl border-white/10 hover:border-indigo-500/30 transition-all group flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
                <UserIcon className="w-5 h-5 text-indigo-400" />
              </div>
              <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 border ${invite.status === 'viewed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20'}`}>
                {invite.status === 'viewed' ? <CheckCircle className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                {invite.status === 'viewed' ? 'Opened' : 'Sent'}
              </div>
            </div>

            <div className="space-y-1 mb-4 flex-1">
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Recipient</p>
              <h4 className="text-base font-bold text-slate-100 truncate">{invite.receiverName}</h4>
              <p className="text-[10px] text-slate-500 truncate">{invite.receiverEmail}</p>
            </div>

            <div className="pt-3 border-t border-white/5 grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <p className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> Date</p>
                <p className="text-[10px] font-semibold text-slate-400">{sentAt.date}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Time</p>
                <p className="text-[10px] font-semibold text-slate-400">{sentAt.time}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SentInvitations;
