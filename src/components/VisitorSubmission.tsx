/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from './Router.jsx';
import { CARD_THEMES, CATEGORIES, CATEGORY_EMOJIS } from '../constants.js';
import { Category } from '../types.js';
import { ArrowLeft, Sparkles, Send, CheckCircle2, AlertTriangle, ChevronRight, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VisitorSubmissionProps {
  prefilledUsername?: string;
  onSuccessNavigate?: string;
}

export default function VisitorSubmission({ prefilledUsername = '', onSuccessNavigate }: VisitorSubmissionProps) {
  const { navigate } = useRouter();
  
  // Form States
  const [targetUsername, setTargetUsername] = useState(prefilledUsername);
  const [message, setMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Confession');
  const [selectedTheme, setSelectedTheme] = useState(CARD_THEMES[0]);
  const [nickname, setNickname] = useState('');
  const [charLimit, setCharLimit] = useState(300); // Updated dynamically from settings if available
  
  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [autoBlocked, setAutoBlocked] = useState(false);

  // Load character limit from settings on mount
  useEffect(() => {
    fetch('/api/session') // session fetch is fast and public
      .then(() => {
        // Simple mock fetch settings or config
        // Let's assume default 300
        setCharLimit(300);
      })
      .catch(() => {});
  }, []);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= charLimit) {
      setMessage(text);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername.trim()) {
      setSubmitError('Please specify a username to receive your confession.');
      return;
    }
    if (!message.trim()) {
      setSubmitError('The confession message cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      targetUsername: targetUsername.trim().replace(/^@/, ''),
      message: message.trim(),
      category: selectedCategory,
      emoji: CATEGORY_EMOJIS[selectedCategory],
      theme: selectedTheme.id,
      nickname: nickname.trim() || undefined,
      resolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit confession. Please try again.');
      }

      setIsSubmitting(false);
      setSubmitSuccess(true);
      setAutoBlocked(!!data.autoBlocked);
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitError(err.message || 'Network error occurred. Please try again.');
    }
  };

  const activeThemeObj = CARD_THEMES.find(t => t.id === selectedTheme.id) || CARD_THEMES[0];

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      {!prefilledUsername && (
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 group transition-colors text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>
      )}

      <AnimatePresence mode="wait">
        {!submitSuccess ? (
          <motion.div
            key="submission-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-slate-900">Send Anonymous Message</h1>
                <p className="text-xs text-slate-500">Your identity is completely hidden, guaranteed.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Target Username */}
              {!prefilledUsername && (
                <div>
                  <label htmlFor="targetUsername" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    To User <span className="text-indigo-600 font-mono">(e.g. @shiva)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400 font-semibold font-mono text-lg">@</span>
                    <input
                      id="targetUsername"
                      type="text"
                      placeholder="username"
                      value={targetUsername.replace(/^@/, '')}
                      onChange={(e) => setTargetUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl py-3.5 pl-9 pr-4 text-slate-900 font-sans font-semibold placeholder:text-slate-400 outline-none transition-colors"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Message Box */}
              <div>
                <div className="flex justify-between items-baseline mb-1.5">
                  <label htmlFor="message" className="block text-sm font-semibold text-slate-700">
                    Your Message
                  </label>
                  <span className="text-xs font-mono text-slate-400">
                    {message.length} / {charLimit}
                  </span>
                </div>
                <textarea
                  id="message"
                  rows={4}
                  placeholder={`Write your honest ${selectedCategory.toLowerCase()}... (300 char max)`}
                  value={message}
                  onChange={handleMessageChange}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 outline-none transition-colors leading-relaxed font-sans text-sm sm:text-base resize-none"
                  required
                />
              </div>

              {/* Category Picker */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Select Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-550 border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <span>{CATEGORY_EMOJIS[cat]}</span>
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Choose Card Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CARD_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme)}
                      className={`relative overflow-hidden rounded-xl h-12 flex items-center justify-center text-xs font-bold transition-all border cursor-pointer ${
                        selectedTheme.id === theme.id
                          ? 'ring-2 ring-indigo-500 border-transparent scale-[1.02]'
                          : 'border-slate-200 hover:border-slate-300'
                      } ${theme.bgClass}`}
                    >
                      {/* Font Color override */}
                      <span className={theme.id === 'matcha' ? 'text-emerald-950' : theme.id === 'bubblegum' ? 'text-slate-900' : 'text-white'}>
                        {theme.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nickname */}
              <div>
                <label htmlFor="nickname" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Optional Nickname <span className="text-slate-400 font-normal">(Leave blank for Anonymous)</span>
                </label>
                <input
                  id="nickname"
                  type="text"
                  maxLength={25}
                  placeholder="e.g. Secret admirer, RoasterX"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl py-3 px-4 text-slate-900 placeholder:text-slate-400 outline-none transition-colors font-medium text-sm"
                />
              </div>

              {/* Live Card Preview */}
              <div className="pt-2">
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-2.5">
                  Live Preview
                </label>
                <div className={`rounded-2xl p-5 border shadow-lg transition-all ${activeThemeObj.bgClass} ${activeThemeObj.borderClass}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${activeThemeObj.badgeClass}`}>
                      {CATEGORY_EMOJIS[selectedCategory]} {selectedCategory}
                    </span>
                    <span className={`text-[11px] font-mono opacity-80 ${activeThemeObj.textClass}`}>
                      by {nickname.trim() || 'Anonymous'}
                    </span>
                  </div>
                  <p className={`text-base font-medium italic min-h-[50px] leading-relaxed break-words ${activeThemeObj.textClass}`}>
                    {message.trim() || 'Your message preview will appear here...'}
                  </p>
                </div>
              </div>

              {/* Error Warning */}
              {submitError && (
                <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs leading-relaxed animate-headShake">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Privacy Notice Agreement */}
              <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                By submitting, you agree to our{' '}
                <button type="button" onClick={() => navigate('/privacy')} className="text-indigo-400 underline hover:text-indigo-300">
                  Privacy Notice
                </button>{' '}
                and understand that approximate location metadata will be shared with the owner.
              </p>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 active:scale-[0.98] cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Anonymous Card
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden shadow-slate-200/50"
          >
            {/* Top decorative light effect */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-pink-500 to-rose-500" />
            
            <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h1 className="text-3xl font-display font-bold text-slate-900 mb-3">Confession Submitted!</h1>
            
            {autoBlocked ? (
              <p className="text-slate-500 max-w-md mx-auto mb-8 text-sm">
                Your message was successfully received, but flagged by the profanity filters. It is in the trash folder for the owner's safety.
              </p>
            ) : (
              <p className="text-slate-500 max-w-md mx-auto mb-8 text-sm">
                Your anonymous message is securely stored. Once approved by the user, it will appear live on their public board.
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSubmitSuccess(false);
                  setMessage('');
                  setAutoBlocked(false);
                }}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-all cursor-pointer border border-slate-200"
              >
                Send Another
              </button>
              <button
                onClick={() => navigate(`/@${targetUsername.replace(/^@/, '')}`)}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/15 cursor-pointer"
              >
                Go to @{targetUsername.replace(/^@/, '')}'s Board
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
