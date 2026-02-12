import React, { useState } from 'react';
import { auth } from '../firebase';
// Fix: Standardized modular functional exports for auth methods without spaces in braces
import {signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup} from 'firebase/auth';
import { Gift, Mail, Lock, UserPlus, LogIn, Chrome } from 'lucide-react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      {/* Left Decoration */}
      <div className="hidden lg:flex flex-col justify-center px-12 xl:px-24 w-1/2 bg-indigo-600/5">
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-indigo-400">
            <Gift className="w-10 h-10" />
            <span className="text-3xl font-bold tracking-tight">InviteX Pro</span>
          </div>
          <h1 className="text-6xl font-extrabold leading-tight tracking-tighter playfair">
            Design <span className="gradient-text">Unforgettable</span> <br /> Memories Today.
          </h1>
          <p className="text-slate-400 text-xl max-w-lg leading-relaxed">
            The world's most elegant platform for digital invitations. Join thousands of users creating stunning experiences.
          </p>
          <div className="flex gap-4 pt-4">
             {[1, 2, 3].map(i => (
               <div key={i} className="w-12 h-12 rounded-full glass flex items-center justify-center border-indigo-500/20">
                 <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 glass p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden border-white/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
          
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-400 mt-2">
              {isLogin ? 'Sign in to access your invitations' : 'Join us and start designing for free'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>}

            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Or continue with</span></div>
          </div>

          <button
            onClick={googleSignIn}
            className="w-full py-3.5 bg-white text-slate-900 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-[0.98]"
          >
            <Chrome className="w-5 h-5" />
            Sign in with Google
          </button>

          <p className="text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-400 font-semibold hover:underline"
            >
              {isLogin ? 'Create one now' : 'Log in here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;