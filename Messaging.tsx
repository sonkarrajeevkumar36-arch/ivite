import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  arrayUnion, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy,
  limit
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { 
  Search, 
  UserPlus, 
  Check, 
  User as UserIcon, 
  Loader2, 
  ArrowRight,
  Users,
  MessageSquare,
  MoreVertical,
  X,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Globe,
  Send,
  ExternalLink
} from 'lucide-react';

interface Props {
  user: User;
  profile: UserProfile;
}

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
}

const Messaging: React.FC<Props> = ({ user, profile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<UserProfile[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Profile Modal State
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  // Chat State
  const [activeChatFriend, setActiveChatFriend] = useState<UserProfile | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch full profiles for the current user's friends list
  useEffect(() => {
    if (!profile.friends || profile.friends.length === 0) {
      setFriendProfiles([]);
      return;
    }

    setLoadingFriends(true);
    const fetchFriends = async () => {
      try {
        const q = query(
          collection(db, 'users'), 
          where('email', 'in', profile.friends.slice(0, 30))
        );
        const snap = await getDocs(q);
        const profiles = snap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile));
        setFriendProfiles(profiles);
      } catch (err) {
        console.error("Error fetching friend profiles:", err);
      } finally {
        setLoadingFriends(false);
      }
    };

    fetchFriends();
  }, [profile.friends]);

  // Real-time Chat Listener
  useEffect(() => {
    if (!activeChatFriend) return;

    const chatId = [user.uid, activeChatFriend.uid].sort().join('_');
    const msgsRef = collection(db, 'chats', chatId, 'messages');
    const q = query(msgsRef, orderBy('timestamp', 'asc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatMessage));
      setChatMessages(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [activeChatFriend, user.uid]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTerm = searchTerm.trim().toLowerCase();
    if (!cleanTerm) return;
    
    setLoadingSearch(true);
    try {
      const emailQ = query(collection(db, 'users'), where('email', '==', cleanTerm));
      const nameQ = query(
        collection(db, 'users'), 
        where('name', '>=', searchTerm.trim()), 
        where('name', '<=', searchTerm.trim() + '\uf8ff')
      );
      
      const [emailSnap, nameSnap] = await Promise.all([getDocs(emailQ), getDocs(nameQ)]);
      const results: UserProfile[] = [];
      const seenUids = new Set<string>();

      [...emailSnap.docs, ...nameSnap.docs].forEach(doc => {
        const data = doc.data() as UserProfile;
        if (data.uid !== user.uid && !seenUids.has(data.uid)) {
          results.push({ ...data, uid: doc.id });
          seenUids.add(data.uid);
        }
      });

      setSearchResults(results);
    } catch (err) {
      console.error("Search Error:", err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const addFriend = async (targetUser: UserProfile) => {
    try {
      const myRef = doc(db, 'users', user.uid);
      const targetRef = doc(db, 'users', targetUser.uid);

      await Promise.all([
        updateDoc(myRef, { friends: arrayUnion(targetUser.email) }),
        updateDoc(targetRef, { friends: arrayUnion(profile.email) })
      ]);
    } catch (err) {
      console.error("Add Friend Error:", err);
      alert("Failed to add friend.");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatFriend) return;

    const chatId = [user.uid, activeChatFriend.uid].sort().join('_');
    const msgData = {
      senderId: user.uid,
      text: newMessage,
      timestamp: serverTimestamp()
    };

    setNewMessage('');
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), msgData);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const formatTime = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade pb-20">
      {/* Search Section */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-3xl font-black tracking-tight">Expand Your <span className="gradient-text">Circle</span></h3>
            <p className="text-slate-500 text-sm">Find people to invite to your next big event</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-0 bg-indigo-500/5 blur-2xl group-focus-within:bg-indigo-500/10 transition-colors rounded-3xl" />
          <div className="relative glass rounded-3xl border-white/5 overflow-hidden flex items-center p-2">
            <Search className="ml-4 w-5 h-5 text-slate-500" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or exact email..."
              className="flex-1 bg-transparent border-none py-4 px-4 outline-none text-slate-100 placeholder:text-slate-600"
            />
            <button 
              type="submit" 
              disabled={loadingSearch}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
            >
              {loadingSearch ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
        </form>

        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {searchResults.map((result) => {
              const isFriend = profile.friends?.includes(result.email);
              return (
                <div key={result.uid} className="glass p-5 rounded-3xl border-white/5 flex items-center gap-4 group hover:border-indigo-500/30 transition-all">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border border-white/10 flex-shrink-0">
                    {result.photoURL ? <img src={result.photoURL} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 m-4 text-slate-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-100 truncate">{result.name}</h4>
                    <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest">{result.email}</p>
                  </div>
                  {isFriend ? (
                    <div className="p-2 bg-green-500/10 text-green-400 rounded-xl" title="Already Friends">
                      <Check className="w-5 h-5" />
                    </div>
                  ) : (
                    <button 
                      onClick={() => addFriend(result)}
                      className="p-3 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl transition-all active:scale-90"
                      title="Add Friend"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Friends List Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold">My Connections <span className="text-slate-600 ml-2 text-sm font-medium">({profile.friends?.length || 0})</span></h3>
        </div>

        {loadingFriends ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="glass h-24 rounded-3xl animate-pulse" />)}
          </div>
        ) : profile.friends?.length === 0 ? (
          <div className="glass rounded-[40px] p-12 text-center space-y-4 border-dashed border-white/5">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto opacity-20">
              <Users className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h4 className="text-slate-300 font-bold">No friends yet</h4>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">Search for users by name or email to start building your network.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {friendProfiles.map((f) => (
              <div key={f.uid} className="glass p-5 rounded-[32px] border-white/5 hover:bg-slate-800/50 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 hover:bg-white/5 rounded-full text-slate-500">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-indigo-500/10 bg-slate-900 shadow-2xl">
                      {f.photoURL ? (
                        <img src={f.photoURL} alt={f.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                          <UserIcon className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-slate-900 rounded-full" />
                  </div>

                  <div className="space-y-1 w-full px-2">
                    <h4 className="font-bold text-slate-100 truncate">{f.name}</h4>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest truncate">{f.email}</p>
                  </div>

                  <div className="w-full pt-2 flex gap-2">
                    <button 
                      onClick={() => setSelectedProfile(f)}
                      className="flex-1 py-2.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      View Profile
                    </button>
                    <button 
                      onClick={() => setActiveChatFriend(f)}
                      className="p-2.5 bg-slate-800 hover:bg-indigo-600 text-slate-500 hover:text-white rounded-xl transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Profile Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade">
          <div className="glass w-full max-w-lg rounded-[40px] overflow-hidden border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setSelectedProfile(null)}
              className="absolute top-6 right-6 p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full z-10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="h-32 bg-indigo-600/20 w-full" />
            
            <div className="px-8 pb-10 -mt-16 relative">
              <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-slate-900 bg-slate-800 shadow-2xl mb-6">
                {selectedProfile.photoURL ? (
                  <img src={selectedProfile.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <UserIcon className="w-12 h-12" />
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-3xl font-black text-white">{selectedProfile.name}</h3>
                  <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest">{selectedProfile.email}</p>
                </div>

                {selectedProfile.bio && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">About</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{selectedProfile.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {selectedProfile.instagram && (
                    <a href={selectedProfile.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-pink-500/10 text-pink-500 rounded-2xl hover:bg-pink-500 hover:text-white transition-all">
                      <Instagram className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-wider">Instagram</span>
                    </a>
                  )}
                  {selectedProfile.facebook && (
                    <a href={selectedProfile.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-blue-600/10 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                      <Facebook className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-wider">Facebook</span>
                    </a>
                  )}
                  {selectedProfile.twitter && (
                    <a href={selectedProfile.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-sky-400/10 text-sky-400 rounded-2xl hover:bg-sky-400 hover:text-white transition-all">
                      <Twitter className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-wider">Twitter</span>
                    </a>
                  )}
                  {selectedProfile.whatsapp && (
                    <a href={`https://wa.me/${selectedProfile.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-green-500/10 text-green-500 rounded-2xl hover:bg-green-500 hover:text-white transition-all">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-wider">WhatsApp</span>
                    </a>
                  )}
                  {selectedProfile.website && (
                    <a href={selectedProfile.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-slate-100/10 text-slate-100 rounded-2xl hover:bg-white hover:text-slate-900 transition-all col-span-full">
                      <Globe className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-wider">Official Website</span>
                      <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {activeChatFriend && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-slate-950/95 backdrop-blur-xl animate-fade">
          <div className="glass w-full md:max-w-2xl h-full md:h-[80vh] md:rounded-[40px] flex flex-col overflow-hidden border-indigo-500/20 shadow-2xl relative">
            {/* Chat Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-slate-800">
                  {activeChatFriend.photoURL ? <img src={activeChatFriend.photoURL} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 m-3 text-slate-600" />}
                </div>
                <div>
                  <h3 className="font-bold text-white leading-none mb-1">{activeChatFriend.name}</h3>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Active Now</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveChatFriend(null)}
                className="p-3 hover:bg-slate-800 rounded-2xl transition-all"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                   <MessageSquare className="w-16 h-16" />
                   <p className="text-sm font-bold uppercase tracking-[0.2em]">Start a conversation</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderId === user.uid;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-lg ${
                          isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'glass bg-slate-800/80 text-slate-200 rounded-tl-none border-white/5'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[9px] text-slate-600 font-bold px-1">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-6 border-t border-white/5 bg-slate-900/30">
              <div className="relative glass rounded-3xl border-white/10 overflow-hidden flex items-center p-1.5 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none py-3 px-4 outline-none text-slate-100 placeholder:text-slate-600 text-sm"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="w-11 h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messaging;