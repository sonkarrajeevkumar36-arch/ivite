import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs, addDoc } from 'firebase/firestore';
import { User, signOut } from 'firebase/auth';
import { UserProfile, Template, Invitation } from '../types';
import TemplateSelection from './TemplateSelection';
import Messaging from './Messaging';
import AdminPanel from './AdminPanel';
import Inbox from './Inbox';
import SentInvitations from './SentInvitations';
import ProfileView from './ProfileView';
import AIChat from './AIChat';
import { 
  LayoutDashboard, 
  Palette, 
  Mail, 
  Users, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Bell,
  Search,
  Plus,
  Send,
  User as UserIcon,
  Sparkles
} from 'lucide-react';

interface Props {
  user: User;
  profile: UserProfile;
}

const Dashboard: React.FC<Props> = ({ user, profile }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'messaging' | 'admin' | 'inbox' | 'sent' | 'profile' | 'ai'>('overview');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationsCount, setInvitationsCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const isAdmin = user.email === 'admin@email.com';

  useEffect(() => {
    // Seed templates if library is empty
    const seedTemplates = async () => {
      try {
        const q = collection(db, 'templates');
        const snap = await getDocs(q);
        if (snap.empty) {
          const standardFields = ['hostName', 'eventTitle', 'date', 'time', 'location', 'message'];
          const defaultTemplates: Partial<Template>[] = [
            { name: 'Gold Majesty', category: 'Wedding', style: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', fields: standardFields, previewImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600' },
            { name: 'Neon Party', category: 'Birthday', style: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)', fields: standardFields, previewImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600' },
            { name: 'Eternal Love', category: 'Anniversary', style: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)', fields: standardFields, previewImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600' },
            { name: 'Soft Clouds', category: 'Baby Shower', style: 'linear-gradient(135deg, #60a5fa 0%, #34d399 100%)', fields: standardFields, previewImage: 'https://images.unsplash.com/photo-1519225495810-751783008118?w=600' },
            { name: 'Minimal Slate', category: 'Housewarming', style: '#1e293b', fields: standardFields, previewImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600' },
            { name: 'Vibrant Holi', category: 'Festival', style: 'linear-gradient(135deg, #f87171 0%, #fb923c 100%)', fields: standardFields, previewImage: 'https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?w=600' },
            { name: 'Sacred Light', category: 'Pooja', style: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)', fields: standardFields, previewImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600' },
            { name: 'Diamond Glow', category: 'Engagement', style: 'linear-gradient(135deg, #2dd4bf 0%, #0891b2 100%)', fields: standardFields, previewImage: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600' }
          ];
          for (const t of defaultTemplates) {
            await addDoc(collection(db, 'templates'), t);
          }
        }
      } catch (e) {
        console.warn("Seeding skipped.");
      }
    };
    seedTemplates();

    const invQuery = query(collection(db, 'invitations'), where('receiverId', '==', user.uid));
    const unsubscribe = onSnapshot(invQuery, {
      next: (snapshot) => {
        const fetchedInvites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation));
        const sortedInvites = fetchedInvites.sort((a, b) => {
          const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
          const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
          return timeB - timeA;
        });
        setInvitations(sortedInvites);
        setInvitationsCount(snapshot.size);
        const unread = fetchedInvites.filter(inv => inv.status === 'sent').length;
        setUnreadCount(unread);
      },
      error: (err) => console.error("Dashboard Invitations Listener Error:", err)
    });
    
    return () => unsubscribe();
  }, [user.uid]);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Logout Error:", err);
        alert("Failed to sign out. Please try again.");
      }
    }
  };

  const SidebarItem = ({ id, icon: Icon, label, badge, special }: { id: any, icon: any, label: string, badge?: number, special?: boolean }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
        activeTab === id 
        ? (special ? 'bg-indigo-600 shadow-indigo-600/30' : 'bg-slate-800') + ' text-white shadow-lg' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className={`w-5 h-5 ${activeTab === id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} ${special && activeTab === id ? 'animate-pulse' : ''}`} />
      <span className="font-medium flex-1 text-left whitespace-nowrap">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );

  const BottomNavItem = ({ id, icon: Icon, label, badge }: { id: any, icon: any, label: string, badge?: number }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center justify-center gap-1 flex-1 relative ${activeTab === id ? 'text-indigo-400' : 'text-slate-500'}`}
    >
      <Icon className={`w-5 h-5 ${activeTab === id ? 'animate-pulse' : ''}`} />
      <span className="text-[10px] font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-0 right-1/4 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full border-2 border-[#0f172a]">
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 border-r border-slate-800 bg-slate-900/50 flex-col p-6 space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">InviteX <span className="text-indigo-400">Pro</span></h2>
        </div>

        <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] uppercase font-bold text-slate-600 tracking-widest px-4 mb-2">Main Menu</p>
          <SidebarItem id="overview" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem id="templates" icon={Palette} label="Templates" />
          <SidebarItem id="ai" icon={Sparkles} label="AI Assistant" special={true} />
          <SidebarItem id="inbox" icon={Mail} label="My Inbox" badge={unreadCount} />
          <SidebarItem id="sent" icon={Send} label="Sent Invites" />
          <SidebarItem id="messaging" icon={Users} label="Friends" />
          <SidebarItem id="profile" icon={UserIcon} label="My Profile" />
          {isAdmin && <SidebarItem id="admin" icon={ShieldCheck} label="Admin" />}
        </div>

        <div className="pt-6 border-t border-slate-800">
          <div 
            onClick={() => setActiveTab('profile')}
            className={`glass p-4 rounded-2xl flex items-center gap-3 mb-4 cursor-pointer transition-all hover:bg-slate-800 ${activeTab === 'profile' ? 'ring-2 ring-indigo-600' : ''}`}
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/5 overflow-hidden">
               {profile.photoURL ? (
                 <img src={profile.photoURL} alt="User" className="w-full h-full object-cover" />
               ) : (
                 <UserIcon className="w-5 h-5 text-slate-500" />
               )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{profile.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 transition-colors group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar pb-24 lg:pb-0">
        <header className="sticky top-0 z-10 glass px-4 md:px-8 py-3 md:py-4 flex items-center justify-between border-b border-white/5">
           <div className="flex items-center gap-3 flex-1">
             <div className="lg:hidden w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
             </div>
             <div className="relative max-w-xs md:max-w-md w-full hidden sm:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
               <input 
                 type="text" 
                 placeholder="Search templates or activity..." 
                 className="w-full bg-slate-800/40 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
               />
             </div>
           </div>
           <div className="flex items-center gap-3">
             <button className="relative w-9 h-9 md:w-10 md:h-10 glass flex items-center justify-center rounded-xl hover:bg-slate-800 transition-colors">
               <Bell className="w-5 h-5 text-slate-400" />
               {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
             </button>
             <button 
              onClick={() => setActiveTab('templates')}
              className="bg-indigo-600 hover:bg-indigo-500 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
             >
               <Plus className="w-4 h-4" />
               <span className="hidden xs:inline">Create</span>
             </button>
             {/* Profile Icon in Top Right */}
             <button 
              onClick={() => setActiveTab('profile')}
              className={`w-9 h-9 md:w-10 md:h-10 glass flex items-center justify-center rounded-xl overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all border border-white/10 shadow-lg ${activeTab === 'profile' ? 'ring-2 ring-indigo-500' : ''}`}
             >
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-slate-400" />
              )}
             </button>
           </div>
        </header>

        <div className="p-4 md:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6 md:space-y-8 animate-fade">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div className="glass p-5 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden group">
                  <p className="text-slate-500 text-xs md:text-sm font-medium">Received Invites</p>
                  <h3 className="text-3xl md:text-4xl font-bold mt-2">{invitationsCount}</h3>
                </div>
                <div className="glass p-5 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden group">
                  <p className="text-slate-500 text-xs md:text-sm font-medium">Unread</p>
                  <h3 className="text-3xl md:text-4xl font-bold mt-2 text-indigo-400">{unreadCount}</h3>
                </div>
                <div className="glass p-5 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden group">
                  <p className="text-slate-500 text-xs md:text-sm font-medium">Friends</p>
                  <h3 className="text-3xl md:text-4xl font-bold mt-2">{profile.friends.length}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-lg md:text-xl font-bold">Recent Activity</h4>
                    <button onClick={() => setActiveTab('inbox')} className="text-indigo-400 text-sm">View Inbox</button>
                  </div>
                  <div className="glass rounded-2xl md:rounded-3xl p-2">
                     <Inbox compact={true} user={user} invitations={invitations} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg md:text-xl font-bold px-1">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div onClick={() => setActiveTab('ai')} className="glass p-4 rounded-2xl cursor-pointer hover:bg-slate-800 transition-all flex flex-col items-center text-center group">
                        <div className="w-12 h-12 bg-indigo-600/10 rounded-xl mb-3 flex items-center justify-center">
                           <Sparkles className="w-6 h-6 text-indigo-400" />
                        </div>
                        <p className="font-semibold text-sm">AI Assistant</p>
                        <p className="text-[10px] text-slate-500 mt-1">Plan smarter</p>
                    </div>
                    <div onClick={() => setActiveTab('templates')} className="glass p-4 rounded-2xl cursor-pointer hover:bg-slate-800 transition-all flex flex-col items-center text-center group">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl mb-3 flex items-center justify-center">
                           <Palette className="w-6 h-6 text-purple-400" />
                        </div>
                        <p className="font-semibold text-sm">Templates</p>
                        <p className="text-[10px] text-slate-500 mt-1">Design new</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && <TemplateSelection user={user} profile={profile} onSent={() => setActiveTab('sent')} />}
          {activeTab === 'inbox' && <Inbox user={user} invitations={invitations} />}
          {activeTab === 'sent' && <SentInvitations user={user} />}
          {activeTab === 'messaging' && <Messaging user={user} profile={profile} />}
          {activeTab === 'profile' && <ProfileView profile={profile} />}
          {activeTab === 'ai' && <AIChat />}
          {activeTab === 'admin' && isAdmin && <AdminPanel />}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-xl border-t border-white/5 h-16 safe-bottom flex items-center px-4 z-40">
        <BottomNavItem id="overview" icon={LayoutDashboard} label="Home" />
        <BottomNavItem id="templates" icon={Palette} label="Design" />
        <BottomNavItem id="ai" icon={Sparkles} label="AI" />
        <BottomNavItem id="inbox" icon={Mail} label="Inbox" badge={unreadCount} />
        <BottomNavItem id="messaging" icon={Users} label="Friends" />
      </nav>
    </div>
  );
};

export default Dashboard;