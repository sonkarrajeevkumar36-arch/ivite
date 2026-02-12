import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
// Fix: Consolidate modular auth imports to ensure correct member resolution
import {onAuthStateChanged, User} from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { UserProfile } from './types';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Real-time listener with error handling
        unsubscribeProfile = onSnapshot(userRef, {
          next: async (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile(docSnap.data() as UserProfile);
              setLoading(false);
            } else {
              // Create default profile if missing
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Guest',
                email: firebaseUser.email || '',
                photoURL: firebaseUser.photoURL || '',
                friends: []
              };
              await setDoc(userRef, newProfile);
            }
          },
          error: (err) => {
            console.error("Profile Listener Error:", err);
            setLoading(false);
          }
        });
      } else {
        if (unsubscribeProfile) unsubscribeProfile();
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-400 font-medium animate-pulse">Connecting to InviteX Pro...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      {user && userProfile ? (
        <Dashboard user={user} profile={userProfile} />
      ) : (
        <Login />
      )}
    </div>
  );
};

export default App;