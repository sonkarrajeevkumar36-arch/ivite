import React, { useState, useRef } from 'react';
import { db, storage, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { UserProfile } from '../types';
import { 
  Camera, 
  User as UserIcon, 
  Instagram, 
  Facebook, 
  Twitter, 
  MessageCircle, 
  Globe, 
  Save, 
  Loader2,
  CheckCircle,
  LogOut,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface Props {
  profile: UserProfile;
}

const ProfileView: React.FC<Props> = ({ profile }) => {
  const [formData, setFormData] = useState({
    name: profile.name || '',
    bio: profile.bio || '',
    instagram: profile.instagram || '',
    facebook: profile.facebook || '',
    twitter: profile.twitter || '',
    whatsapp: profile.whatsapp || '',
    website: profile.website || ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to sign out of InviteX Pro? This will end your active session.")) return;
    
    setLoggingOut(true);
    try {
      // 1. Core Firebase Sign Out
      // This will trigger onAuthStateChanged in App.tsx which cleans up profile listeners
      await signOut(auth);
      
      // 2. Clear UI state and stop active listeners by redirecting to root
      // Redirecting ensures a clean slate, clearing memory and any remaining JS listeners
      window.location.assign('/'); 
    } catch (err: any) {
      console.error("Critical Logout Error:", err);
      
      // 3. Specific error handling for the sign-out promise
      let errorMessage = "Failed to sign out. Please try refreshing the page.";
      
      // Handle common Firebase Auth errors
      if (err.code === 'auth/network-request-failed') {
        errorMessage = "Network connection failed. Please check your internet and try again.";
      } else if (err.code === 'auth/user-token-expired') {
        // If token is expired, we should still try to force local redirect
        window.location.assign('/');
        return;
      }
      
      showToast(errorMessage, "error");
      setLoggingOut(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast("Please select an image file", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be under 2MB", "error");
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `profileImages/${profile.uid}`);
      const metadata = { contentType: file.type };
      await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', profile.uid), { photoURL: downloadURL });
      showToast("Profile Updated");
      if (e.target) e.target.value = '';
    } catch (err: any) {
      console.error("Upload Error:", err);
      showToast("Upload failed. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!profile.photoURL) return;
    if (!window.confirm("Are you sure you want to remove your profile photo?")) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `profileImages/${profile.uid}`);
      try {
        await deleteObject(storageRef);
      } catch (e) {
        console.warn("Storage item already deleted or inaccessible.");
      }
      await updateDoc(doc(db, 'users', profile.uid), { photoURL: "" });
      showToast("Profile Updated");
    } catch (err: any) {
      console.error("Delete Error:", err);
      showToast("Failed to remove photo", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), formData);
      setSuccess(true);
      showToast("Profile Updated");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      showToast("Update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade pb-10 relative">
      {toast && (
        <div className={`fixed top-24 right-4 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md animate-in slide-in-from-right duration-300 ${
          toast.type === 'success' ? 'bg-green-500/90 border-green-400 text-white' : 'bg-red-500/90 border-red-400 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col items-center gap-6">
        <div className="relative group">
          <div className="w-[140px] h-[140px] rounded-full overflow-hidden border-4 border-indigo-500/30 bg-slate-800 shadow-2xl relative">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-indigo-900/40 text-indigo-400/30">
                <UserIcon className="w-20 h-20" />
              </div>
            )}
            
            {(uploading || loggingOut) && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <span className="text-[10px] text-white font-bold mt-2 uppercase tracking-widest">
                  {loggingOut ? 'Signing Out' : 'Processing'}
                </span>
              </div>
            )}
          </div>
          
          <div className="absolute bottom-0 right-0 flex gap-2">
            {profile.photoURL && !uploading && !loggingOut && (
              <button 
                onClick={handleDeletePhoto} 
                className="p-3 bg-red-600 rounded-full text-white shadow-lg hover:bg-red-500 transition-all active:scale-95 border border-white/10"
                title="Delete Photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {!uploading && !loggingOut && (
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="p-3 bg-indigo-600 rounded-full text-white shadow-lg hover:bg-indigo-500 transition-all active:scale-95 border border-white/10"
                title="Change Photo"
              >
                <Camera className="w-5 h-5" />
              </button>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black">{profile.name}</h2>
          <p className="text-slate-500 text-sm">{profile.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass p-6 md:p-10 rounded-[40px] border-white/5 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Basic Details</h4>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 ml-1">Full Name</label>
              <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-100" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 ml-1">Bio</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all text-slate-100" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Social Connections</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="relative text-pink-500">
                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
                <input name="instagram" value={formData.instagram} onChange={handleChange} placeholder="Instagram Link" className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-100" />
              </div>
              <div className="relative text-blue-500">
                <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
                <input name="facebook" value={formData.facebook} onChange={handleChange} placeholder="Facebook Link" className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-100" />
              </div>
              <div className="relative text-sky-400">
                <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
                <input name="twitter" value={formData.twitter} onChange={handleChange} placeholder="Twitter Link" className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-100" />
              </div>
              <div className="relative text-green-500">
                <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
                <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="WhatsApp" className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-100" />
              </div>
              <div className="relative text-slate-400">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
                <input name="website" value={formData.website} onChange={handleChange} placeholder="Website" className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-100" />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading || uploading || loggingOut} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : success ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {loading ? 'Saving Changes...' : success ? 'Saved!' : 'Save Profile Details'}
        </button>
      </form>

      <div className="glass p-6 md:p-8 rounded-[40px] border-red-500/10 bg-red-500/5 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-red-400 ml-1">Account Security</h4>
        <button 
          onClick={handleLogout} 
          disabled={loggingOut || uploading || loading}
          className="w-full py-4 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg disabled:opacity-50"
        >
          {loggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />} 
          {loggingOut ? 'Confirming Sign Out...' : 'Sign Out of My Account'}
        </button>
      </div>
    </div>
  );
};

export default ProfileView;