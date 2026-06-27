/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from './Router.jsx';
import { CARD_THEMES, CATEGORY_EMOJIS, CATEGORIES } from '../constants.js';
import { Message, Category } from '../types.js';
import VisitorSubmission from './VisitorSubmission.jsx';
import { Share2, Sparkles, AlertCircle, MessageSquare, Copy, Check, Filter, Heart, ArrowLeft, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportCardToPng } from '../utils.js'; // Let's define this helper in a utils.ts file next!

export default function PublicProfile() {
  const { params, navigate } = useRouter();
  const username = params.username || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // Drawer / Interactive flow for direct submission on this page!
  const [showSubmissionDrawer, setShowSubmissionDrawer] = useState(false);
  
  // Copy state
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!username) return;

    setLoading(true);
    fetch(`/api/public/profile/${username}`)
      .then((res) => {
        if (!res.ok) throw new Error('Could not fetch this board. Please check the URL.');
        return res.json();
      })
      .then((data) => {
        setMessages(data.messages || []);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [username]);

  const copyBoardLink = () => {
    const link = `${window.location.origin}/@${username}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const filteredMessages = activeFilter === 'all'
    ? messages
    : messages.filter(m => m.category === activeFilter);

  // Stats
  const totalReceived = messages.length;
  const totalReplies = messages.filter(m => m.reply).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Decorative Grid Lines background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6">
        
        {/* Navigation back */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 group transition-colors text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        {loading ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-mono text-slate-500">Retrieving @{username}'s Board...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-md mx-auto my-12 shadow-xl shadow-slate-200/50">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Board</h2>
            <p className="text-slate-500 text-sm mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-xl transition-all cursor-pointer"
            >
              Back Home
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Header Header Info */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-xl shadow-slate-200/50 backdrop-blur-md">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center font-display font-black text-2xl text-indigo-600">
                    @{username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-1.5">
                      @{username}
                      <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" title="Active confession board" />
                    </h1>
                    <p className="text-xs text-slate-500">Anonymous message inbox is live</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs font-mono text-slate-500 pt-1">
                  <span>📥 {totalReceived} Received</span>
                  <span>💬 {totalReplies} Answered</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
                <button
                  onClick={copyBoardLink}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60 font-semibold px-4 py-3 rounded-xl transition-all text-xs cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Share My Link'}
                </button>
                <button
                  onClick={() => setShowSubmissionDrawer(true)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3 rounded-xl transition-all text-xs shadow-lg shadow-indigo-600/10 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Anonymous Message
                </button>
              </div>
            </div>

            {/* Message Drawer direct submit */}
            <AnimatePresence>
              {showSubmissionDrawer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden border border-slate-200 rounded-3xl bg-white/40 backdrop-blur-lg shadow-xl shadow-slate-200/50"
                >
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-xs uppercase tracking-wider font-bold text-indigo-600">Direct Submission Module</span>
                    <button
                      onClick={() => setShowSubmissionDrawer(false)}
                      className="text-slate-500 hover:text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Hide Form
                    </button>
                  </div>
                  <VisitorSubmission prefilledUsername={username} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Categories filters */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                  <Filter className="w-4 h-4 text-slate-500" />
                  Filter confessions
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-2xl max-w-max shadow-sm">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-white text-slate-950 border border-slate-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({messages.length})
                </button>
                {CATEGORIES.map((cat) => {
                  const count = messages.filter(m => m.category === cat).length;
                  if (count === 0) return null; // Only show active categories

                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveFilter(cat)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeFilter === cat
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{CATEGORY_EMOJIS[cat]}</span>
                      <span>{cat} ({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confessions list */}
            <div className="space-y-6">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-slate-200 rounded-3xl bg-white shadow-xl shadow-slate-200/50">
                  <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-700">No active confessions found</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    {activeFilter === 'all'
                      ? "This board is empty. Be the first to drop an anonymous message below!"
                      : `No approved messages are matching the category "${activeFilter}".`}
                  </p>
                  {activeFilter === 'all' && (
                    <button
                      onClick={() => setShowSubmissionDrawer(true)}
                      className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Write First Confession
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredMessages.map((msg) => {
                    const themeObj = CARD_THEMES.find(t => t.id === msg.theme) || CARD_THEMES[0];
                    const hasReply = !!msg.reply;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col h-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 hover:border-slate-300 transition-all group"
                      >
                        {/* Styled Message Card body */}
                        <div className={`p-6 flex-1 flex flex-col justify-between relative ${themeObj.bgClass} ${themeObj.borderClass}`}>
                          {/* Card top details */}
                          <div className="flex justify-between items-center mb-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-black ${themeObj.badgeClass}`}>
                              {CATEGORY_EMOJIS[msg.category]} {msg.category}
                            </span>
                            <span className={`text-[10px] font-mono opacity-80 ${themeObj.textClass}`}>
                              by {msg.nickname || 'Anonymous'}
                            </span>
                          </div>

                          {/* Message Text content */}
                          <p className={`text-base font-medium italic mb-6 leading-relaxed break-words flex-1 ${themeObj.textClass}`}>
                            "{msg.message}"
                          </p>

                          {/* Card footer details */}
                          <div className="flex justify-between items-center text-[10px] opacity-75">
                            <span className={themeObj.textClass}>
                              {new Date(msg.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            
                            <button
                              onClick={() => exportCardToPng(msg.id, msg.message, msg.category, msg.nickname || 'Anonymous', CATEGORY_EMOJIS[msg.category], msg.theme)}
                              className={`flex items-center gap-1 py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all font-semibold uppercase tracking-wider text-[9px] cursor-pointer ${themeObj.textClass}`}
                            >
                              <Share2 className="w-3 h-3" />
                              Export Card
                            </button>
                          </div>
                        </div>

                        {/* Reply Section */}
                        {hasReply && (
                          <div className="bg-slate-50 border-t border-slate-100 p-5 space-y-2">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-indigo-600 font-mono">
                              <MessageSquare className="w-3.5 h-3.5" />
                              Reply from @{username}
                            </div>
                            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-sans italic">
                              "{msg.reply}"
                            </p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
