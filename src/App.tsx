/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RouterProvider, useRouter } from './components/Router.jsx';
import VisitorSubmission from './components/VisitorSubmission.jsx';
import PublicProfile from './components/PublicProfile.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import { PrivacyPolicy, TermsOfService } from './components/StaticPages.jsx';
import SuperAdminPanel from './components/SuperAdminPanel.jsx';
import { CARD_THEMES, CATEGORIES, CATEGORY_EMOJIS } from './constants.js';
import { 
  Sparkles, ArrowRight, ShieldCheck, HelpCircle, Heart, Lock, KeyRound, 
  Globe, Send, User, Check, Copy, MessageSquare, AlertCircle, Eye, EyeOff, 
  RefreshCw, Star, ArrowLeft 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function HomeLanding() {
  const { navigate } = useRouter();
  
  // Onboarding States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [onboardingMode, setOnboardingMode] = useState<'register' | 'login'>('register');
  const [showPassword, setShowPassword] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [onboardingSuccess, setOnboardingSuccess] = useState(false);
  const [onboardedUser, setOnboardedUser] = useState<{ username: string; token: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState(false);

  // Public Message Board States
  const [publicMessages, setPublicMessages] = useState<any[]>([]);
  const [publicLoading, setPublicLoading] = useState(true);
  const [publicError, setPublicError] = useState<string | null>(null);
  
  // Submission on Public Board
  const [newMessageText, setNewMessageText] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<any>('Confession');
  const [selectedThemeId, setSelectedThemeId] = useState('sunset');
  const [isSubmittingConfession, setIsSubmittingConfession] = useState(false);
  const [confessionSuccess, setConfessionSuccess] = useState(false);

  // Load active session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    const savedUser = localStorage.getItem('admin_username');
    if (savedToken && savedUser) {
      setOnboardedUser({ username: savedUser, token: savedToken });
      setOnboardingSuccess(true);
    }
    loadPublicBoard();
  }, []);

  const loadPublicBoard = async () => {
    setPublicLoading(true);
    try {
      const response = await fetch('/api/public/board');
      if (response.ok) {
        const data = await response.json();
        setPublicMessages(data.messages || []);
      } else {
        setPublicError('Failed to load global confessions feed.');
      }
    } catch (err) {
      setPublicError('Network error loading global feed.');
    } finally {
      setPublicLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setOnboardingError('Please provide both username and password.');
      return;
    }

    setIsSubmittingOnboarding(true);
    setOnboardingError(null);

    const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();
    const endpoint = onboardingMode === 'register' ? '/api/auth/register' : '/api/auth/login';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      // Save credentials & log in
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_username', cleanUsername);
      setOnboardedUser({ username: cleanUsername, token: data.token });
      setOnboardingSuccess(true);
      playBellSound();
    } catch (err: any) {
      setOnboardingError(err.message || 'Authentication failed. Please check inputs.');
    } finally {
      setIsSubmittingOnboarding(false);
    }
  };

  const handlePostConfession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    setIsSubmittingConfession(true);
    setConfessionSuccess(false);

    const payload = {
      targetUsername: 'public',
      message: newMessageText.trim(),
      category: selectedCategory,
      emoji: CATEGORY_EMOJIS[selectedCategory] || '🤫',
      theme: selectedThemeId,
      nickname: newNickname.trim() || 'Anonymous'
    };

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to post to global board.');
      }

      setNewMessageText('');
      setNewNickname('');
      setConfessionSuccess(true);
      playBellSound();
      loadPublicBoard();

      // Clear success indicator after 4 seconds
      setTimeout(() => setConfessionSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Error publishing confession.');
    } finally {
      setIsSubmittingConfession(false);
    }
  };

  const playBellSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.1); // G5
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (err) {
      console.warn('Bell sound played blocked:', err);
    }
  };

  const copyToClipboard = () => {
    if (!onboardedUser) return;
    const url = `${window.location.origin}/@${onboardedUser.username}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSignOut = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    setOnboardedUser(null);
    setOnboardingSuccess(false);
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between relative overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header - Simple Logo, No Admin links */}
      <header className="max-w-7xl w-full mx-auto px-6 py-5 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md">
            C
          </div>
          <span className="font-display font-black text-xl tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">
            Confessly
          </span>
        </div>
        <div className="text-[10px] font-extrabold font-mono text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/40">
          🔒 Encrypted & Verified
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-12 relative z-10 space-y-10">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mx-auto">
            <Sparkles className="w-3.5 h-3.5" />
            Live Onboarding
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Create Your Own{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-pink-500 to-rose-500 bg-clip-text text-transparent">
              Anonymous Link
            </span>
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-lg mx-auto">
            Onboard in 10 seconds to generate your custom feedback page. Share it on Instagram, Snapchat, or TikTok to start getting honest, completely anonymous secrets and questions from your followers!
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-pink-500 to-rose-500" />
          
          <AnimatePresence mode="wait">
            {!onboardingSuccess ? (
              <motion.div
                key="onboard-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                {/* Mode selector */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => { setOnboardingMode('register'); setOnboardingError(null); }}
                    className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                      onboardingMode === 'register' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Create Link (Sign Up)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOnboardingMode('login'); setOnboardingError(null); }}
                    className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                      onboardingMode === 'login' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Log In to Account
                  </button>
                </div>

                <form onSubmit={handleOnboardingSubmit} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                      {onboardingMode === 'register' ? 'Choose Username / Link Handle' : 'Username'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-slate-400 font-bold font-mono">@</span>
                      <input
                        type="text"
                        placeholder={onboardingMode === 'register' ? 'your_name' : 'your_handle'}
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-2xl py-3 pl-9 pr-4 text-slate-900 font-sans font-bold placeholder:text-slate-300 outline-none transition-colors text-base"
                      />
                    </div>
                    {onboardingMode === 'register' && username && (
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">
                        Your link: <span className="text-indigo-600 font-bold">{window.location.origin}/@{username.trim().replace(/^@/, '').toLowerCase()}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                      Password (for admin access)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-2xl py-3 px-4 text-slate-900 placeholder:text-slate-300 outline-none transition-colors text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {onboardingError && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{onboardingError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingOnboarding}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer disabled:opacity-75"
                  >
                    {isSubmittingOnboarding ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {onboardingMode === 'register' ? 'Creating...' : 'Logging in...'}
                      </>
                    ) : (
                      <>
                        {onboardingMode === 'register' ? 'Generate My Live Link! 🔥' : 'Access My Dashboard'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Live Instagram sticker mock */}
                {onboardingMode === 'register' && (
                  <div className="pt-4 border-t border-slate-100">
                    <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Instagram Link Sticker Preview</span>
                    <div className="h-28 bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 rounded-2xl p-4 flex flex-col justify-between text-white shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                      <div className="flex justify-between items-center relative z-10">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold bg-black/20 px-2 py-0.5 rounded-md">Confessly.com</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-white/40 animate-pulse" />
                      </div>
                      <div className="mx-auto bg-white/95 text-slate-800 rounded-full py-2 px-5 font-bold text-sm tracking-wide shadow-xl flex items-center gap-1.5 scale-95 transition-all relative z-10 border border-white/25">
                        🔗 confessly.com/@{username.trim() || 'yourname'}
                      </div>
                      <div className="text-[9px] text-white/80 font-medium text-center relative z-10">
                        (Tap here to send an anonymous confession!)
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="onboard-success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-center"
              >
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl mx-auto border-4 border-emerald-50">
                  🎉
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-slate-900">Your Link is Active!</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Welcome, <strong className="text-slate-800 font-semibold">@{onboardedUser?.username}</strong>! Copy your link below and paste it onto your Instagram stories or bio!
                  </p>
                </div>

                {/* Active URL box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-2.5">
                  <span className="font-mono text-xs font-bold text-indigo-600 truncate pl-1 select-all">
                    {window.location.origin}/@{onboardedUser?.username}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0 ${
                      copiedLink 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Link
                      </>
                    )}
                  </button>
                </div>

                {/* Simple Instructions list */}
                <div className="text-left bg-indigo-50/50 border border-indigo-100/40 rounded-2xl p-4 space-y-3.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 block">How to get confessions:</span>
                  <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-600 font-sans">
                    <div className="flex gap-2">
                      <span className="w-5 h-5 bg-indigo-100 text-indigo-600 font-bold rounded-full flex items-center justify-center shrink-0 text-[10px]">1</span>
                      <span>Copy your link above.</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-5 h-5 bg-indigo-100 text-indigo-600 font-bold rounded-full flex items-center justify-center shrink-0 text-[10px]">2</span>
                      <span>Open Instagram and create a new Story.</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-5 h-5 bg-indigo-100 text-indigo-600 font-bold rounded-full flex items-center justify-center shrink-0 text-[10px]">3</span>
                      <span>Select the <strong className="text-slate-800">"Link Sticker"</strong> tool, paste your URL, and write a catchy tag.</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-5 h-5 bg-indigo-100 text-indigo-600 font-bold rounded-full flex items-center justify-center shrink-0 text-[10px]">4</span>
                      <span>Wait for secrets to roll in and reply instantly!</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    onClick={() => navigate('/admin')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 text-xs cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Go to Dashboard
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-3 px-4 rounded-xl transition-all text-xs cursor-pointer"
                  >
                    Sign Out / New Account
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer - Includes terms, privacy AND the Moderator and Super Admin login buttons cleanly */}
      <footer className="border-t border-slate-200 bg-white py-10 px-6 text-center text-xs text-slate-500 relative z-10 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 font-semibold">
          <button onClick={() => navigate('/privacy')} className="hover:text-slate-800 transition-colors">
            Privacy Policy
          </button>
          <span className="hidden sm:inline text-slate-300">•</span>
          <button onClick={() => navigate('/terms')} className="hover:text-slate-800 transition-colors">
            Terms of Service
          </button>
          <span className="hidden sm:inline text-slate-300">•</span>
          <button onClick={() => navigate('/admin')} className="hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer">
            <Lock className="w-3.5 h-3.5 text-indigo-500" /> Admin Dashboard Login
          </button>
          <span className="hidden sm:inline text-slate-300">•</span>
          <button onClick={() => navigate('/su')} className="hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer">
            <KeyRound className="w-3.5 h-3.5 text-rose-500" /> Super Admin Panel
          </button>
        </div>
        
        <p className="font-mono text-[10px] text-slate-400">
          Confessly 2026. Made with <Heart className="w-3 h-3 text-rose-500 inline fill-current" /> for healthy and secure expressions.
        </p>
      </footer>
    </div>
  );
}

// Router Switcing logic
function RouterSwitch() {
  const { path } = useRouter();

  if (path === '/') {
    return <HomeLanding />;
  }
  if (path === '/submit') {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <VisitorSubmission />
      </div>
    );
  }
  if (path.startsWith('/@')) {
    return <PublicProfile />;
  }
  if (path === '/admin') {
    return <AdminPanel />;
  }
  if (path === '/su') {
    return <SuperAdminPanel />;
  }
  if (path === '/privacy') {
    return <PrivacyPolicy />;
  }
  if (path === '/terms') {
    return <TermsOfService />;
  }

  // Fallback 404
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center space-y-4">
      <h1 className="text-4xl font-display font-black text-slate-900">404</h1>
      <p className="text-sm text-slate-500">The requested secret board could not be found.</p>
      <a href="/" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-xl text-xs transition-all">
        Go Home
      </a>
    </div>
  );
}

export default function App() {
  const [visitorLoading, setVisitorLoading] = useState(true);
  const [isVisitor, setIsVisitor] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    const isVis = !path.startsWith('/admin') && !path.startsWith('/su');
    setIsVisitor(isVis);

    if (isVis) {
      const timer = setTimeout(() => {
        setVisitorLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setVisitorLoading(false);
    }
  }, []);

  if (isVisitor && visitorLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center relative overflow-hidden">
        {/* Glowing background details */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Animated emblem */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: [1, 1.08, 1], opacity: 1 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="h-16 w-16 bg-gradient-to-tr from-indigo-600 to-pink-500 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-2xl shadow-indigo-500/30 border border-white/10"
          >
            C
          </motion.div>

          <div className="space-y-1.5 text-center">
            <h2 className="text-2xl font-display font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Confessly
            </h2>
            <p className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">
              🔒 100% Secure & Anonymous Message Board
            </p>
          </div>

          {/* Sleek loading line */}
          <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mt-4 relative">
            <motion.div
              initial={{ left: "-50%" }}
              animate={{ left: "100%" }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
              className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <RouterProvider>
      <RouterSwitch />
    </RouterProvider>
  );
}
