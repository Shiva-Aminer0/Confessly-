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
import { Sparkles, ArrowRight, ShieldCheck, HelpCircle, Heart, Lock, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function HomeLanding() {
  const { navigate } = useRouter();
  const [enteredUsername, setEnteredUsername] = useState('');
  const [showSubmission, setShowSubmission] = useState(false);

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredUsername.trim()) {
      setShowSubmission(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between relative overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-base">
            C
          </div>
          <span className="font-display font-black text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Confessly Web
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          <button onClick={() => navigate('/admin')} className="hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer">
            <Lock className="w-3.5 h-3.5 text-indigo-600" /> Moderator Panel
          </button>
          <button onClick={() => navigate('/su')} className="hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer">
            <KeyRound className="w-3.5 h-3.5 text-rose-600" /> Super Admin
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 flex flex-col items-center justify-center py-16 relative z-10 text-center space-y-12">
        <AnimatePresence mode="wait">
          {!showSubmission ? (
            <motion.div
              key="username-selection"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-lg w-full space-y-6"
            >
              {/* Premium Hero tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold font-display uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                100% Secure & Anonymous
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tight leading-tight">
                  Share Honest Feelings,{' '}
                  <span className="bg-gradient-to-r from-indigo-600 via-pink-500 to-rose-500 bg-clip-text text-transparent">
                    Completely Secret.
                  </span>
                </h1>
                <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-md mx-auto font-sans">
                  Drop a compliment, ask a secret question, roast them, or make an anonymous confession. Start by typing their username.
                </p>
              </div>

              {/* Username submission card */}
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 space-y-4">
                <form onSubmit={handleStartSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="landing-username" className="block text-xs uppercase tracking-wider font-bold text-slate-400 text-left mb-2">
                      Whom is this confession for?
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-slate-400 font-bold font-mono text-lg">@</span>
                      <input
                        id="landing-username"
                        type="text"
                        placeholder="e.g. shiva"
                        required
                        value={enteredUsername}
                        onChange={(e) => setEnteredUsername(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-2xl py-3.5 pl-9 pr-4 text-slate-900 font-sans font-bold placeholder:text-slate-300 outline-none transition-colors text-lg"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                    >
                      Write Anonymous Card
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => navigate(`/@${enteredUsername.trim().replace(/^@/, '') || 'shiva'}`)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3.5 px-5 rounded-xl transition-all text-xs cursor-pointer"
                    >
                      View Profile
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="submission-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <button
                onClick={() => setShowSubmission(false)}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-xs font-semibold cursor-pointer"
              >
                Change Username
              </button>
              <VisitorSubmission prefilledUsername={enteredUsername} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-6 text-center text-xs text-slate-500 relative z-10 space-y-2">
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => navigate('/privacy')} className="hover:text-slate-800 transition-colors">
            Privacy Policy
          </button>
          <span>•</span>
          <button onClick={() => navigate('/terms')} className="hover:text-slate-800 transition-colors">
            Terms of Service
          </button>
        </div>
        <p className="font-mono text-[10px]">
          Confessly Web 2026. Made with <Heart className="w-3 h-3 text-rose-500 inline fill-current" /> for healthy expressions.
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
              Confessly Web
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
