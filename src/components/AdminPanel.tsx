/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from './Router.jsx';
import { SvgBarChart, SvgTrendChart, SvgDoughnutRing } from './AnalyticsCharts.jsx';
import { CARD_THEMES, CATEGORY_EMOJIS, CATEGORIES } from '../constants.js';
import { Message, Category } from '../types.js';
import { exportCardToPng } from '../utils.js';
import {
  Lock, CheckCircle, Trash2, Star, MessageSquare, ShieldAlert,
  Search, SlidersHorizontal, Eye, RefreshCw, BarChart3, Inbox,
  Compass, Laptop, MapPin, KeyRound, LogOut, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPanel() {
  const { navigate } = useRouter();

  // Authentication States
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [adminUser, setAdminUser] = useState<{ username: string; role: string } | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Active View tabs: 'messages' or 'analytics'
  const [activeTab, setActiveTab] = useState<'messages' | 'analytics'>('messages');

  // Messages State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [replyInputMap, setReplyInputMap] = useState<{ [msgId: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  // Search/Filters State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending'); // default view pending
  const [filterIp, setFilterIp] = useState('');
  const [filterBrowser, setFilterBrowser] = useState('');
  const [filterOs, setFilterOs] = useState('');
  const [filterDevice, setFilterDevice] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Check Session validity on boot
  useEffect(() => {
    if (!authToken) {
      setIsCheckingSession(false);
      return;
    }

    fetch('/api/session', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setAdminUser({ username: data.username, role: data.role });
        } else {
          handleLogout();
        }
        setIsCheckingSession(false);
      })
      .catch(() => {
        setIsCheckingSession(false);
      });
  }, [authToken]);

  // Load Messages & Analytics
  useEffect(() => {
    if (adminUser) {
      loadMessages();
      loadAnalytics();
    }
  }, [adminUser, filterStatus, filterCategory, searchKeyword, filterIp, filterBrowser, filterOs, filterDevice, filterLocation]);

  const loadMessages = async () => {
    if (!authToken) return;
    setIsLoadingMessages(true);

    const params = new URLSearchParams();
    if (filterStatus) params.append('status', filterStatus);
    if (filterCategory) params.append('category', filterCategory);
    if (searchKeyword) params.append('keyword', searchKeyword);
    if (filterIp) params.append('ip', filterIp);
    if (filterBrowser) params.append('browser', filterBrowser);
    if (filterOs) params.append('os', filterOs);
    if (filterDevice) params.append('device', filterDevice);
    if (filterLocation) params.append('location', filterLocation);

    try {
      const response = await fetch(`/api/messages?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadAnalytics = async () => {
    if (!authToken) return;
    setIsLoadingAnalytics(true);
    try {
      const response = await fetch('/api/analytics', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('admin_token', data.token);
      setAuthToken(data.token);
      setAdminUser({ username: data.user.username, role: data.user.role });
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setAuthToken(null);
    setAdminUser(null);
  };

  // Moderation Actions
  const handleUpdateStatus = async (msgId: string, status: string) => {
    if (!authToken) return;
    try {
      const response = await fetch(`/api/messages/${msgId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        // Optimistically update message or reload
        loadMessages();
        loadAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (msgId: string, currentFav: boolean) => {
    if (!authToken) return;
    try {
      const response = await fetch(`/api/messages/${msgId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ favorite: !currentFav })
      });

      if (response.ok) {
        loadMessages();
        loadAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReplySubmit = async (msgId: string) => {
    if (!authToken) return;
    const replyText = replyInputMap[msgId] || '';
    if (!replyText.trim()) return;

    try {
      const response = await fetch(`/api/messages/${msgId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ reply: replyText.trim() })
      });

      if (response.ok) {
        setReplyInputMap(prev => ({ ...prev, [msgId]: '' }));
        setActiveReplyId(null);
        loadMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-500">Checking credentials...</p>
      </div>
    );
  }

  // --- LOGIN SCREEN ---
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-[120px]" />

        <div className="max-w-md w-full space-y-8 relative z-10">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-display font-bold text-slate-900">Admin Dashboard</h2>
            <p className="mt-2 text-sm text-slate-500 font-sans">
              Sign in to moderate confessions and view analytics
            </p>
          </div>

          <form className="mt-8 space-y-5 bg-white border border-slate-200 p-8 rounded-3xl shadow-xl shadow-slate-200/50" onSubmit={handleLogin}>
            {loginError && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl py-3 px-4 text-slate-900 placeholder:text-slate-300 outline-none transition-colors text-sm font-semibold"
                    placeholder="e.g. admin"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl py-3 px-4 text-slate-900 placeholder:text-slate-300 outline-none transition-colors text-sm font-semibold"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                'Access Moderator Portal'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Forgot credentials? Contact Website Super Admin Owner.
          </p>
        </div>
      </div>
    );
  }

  // --- MAIN AUTHENTICATED ADMIN PANEL ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      
      {/* Navigation Top Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-base">
              C
            </div>
            <span className="font-display font-black text-lg tracking-tight text-slate-900">Confessly</span>
            <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-mono uppercase font-bold">
              MODERATOR
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Logged in as <strong className="text-slate-700">@{adminUser.username}</strong>
            </span>
            
            {adminUser.role === 'super_admin' && (
              <button
                onClick={() => navigate('/su')}
                className="text-xs bg-slate-100 hover:bg-slate-200 font-semibold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3 h-3" />
                Super Admin Panel
              </button>
            )}

            <button
              onClick={handleLogout}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Analytics Highlights banner */}
        {analyticsData && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-1 shadow-lg shadow-slate-200/50">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Pending Messages</span>
              <p className="text-2xl font-display font-black text-indigo-600">{analyticsData.summary.unreadCount}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-1 shadow-lg shadow-slate-200/50">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Today Submissions</span>
              <p className="text-2xl font-display font-black text-pink-600">{analyticsData.summary.todayCount}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-1 shadow-lg shadow-slate-200/50">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Approved Live</span>
              <p className="text-2xl font-display font-black text-emerald-600">{analyticsData.summary.approvedCount}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-1 shadow-lg shadow-slate-200/50">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Spam / Blocked</span>
              <p className="text-2xl font-display font-black text-rose-600">{analyticsData.summary.spamCount}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-1 shadow-lg shadow-slate-200/50 col-span-2 lg:col-span-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Starred Favorites</span>
              <p className="text-2xl font-display font-black text-amber-600">{analyticsData.summary.favoriteCount}</p>
            </div>
          </div>
        )}

        {/* View Selection Tab Button Bar */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('messages')}
            className={`pb-4 text-sm font-semibold relative cursor-pointer ${
              activeTab === 'messages' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Inbox className="w-4 h-4" />
              Inbox Submissions Queue
            </span>
            {activeTab === 'messages' && (
              <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-4 text-sm font-semibold relative cursor-pointer ${
              activeTab === 'analytics' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" />
              Website Analytics
            </span>
            {activeTab === 'analytics' && (
              <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'messages' ? (
            <motion.div
              key="messages-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Filter controls */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xl shadow-slate-200/50">
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Keyword search input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search confessions by keyword, username, or nick..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors font-medium"
                    />
                  </div>

                  {/* Status Queue selection tabs */}
                  <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-xl">
                    <button
                      onClick={() => setFilterStatus('pending')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        filterStatus === 'pending' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      Pending Queue
                    </button>
                    <button
                      onClick={() => setFilterStatus('approved')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        filterStatus === 'approved' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      Approved
                    </button>
                    <button
                      onClick={() => setFilterStatus('deleted')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        filterStatus === 'deleted' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      Trash Folder
                    </button>
                  </div>

                  {/* Toggle Advanced Filters */}
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                      showAdvancedFilters ? 'bg-slate-100 text-slate-700' : 'text-slate-500'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Filters
                  </button>
                </div>

                {/* Advanced filters list */}
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-200"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                      >
                        <option value="">All Categories</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sender IP</label>
                      <input
                        type="text"
                        placeholder="e.g. 8.8.8.8"
                        value={filterIp}
                        onChange={(e) => setFilterIp(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Tokyo"
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Browser</label>
                      <select
                        value={filterBrowser}
                        onChange={(e) => setFilterBrowser(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                      >
                        <option value="">All Browsers</option>
                        <option value="Chrome">Chrome</option>
                        <option value="Safari">Safari</option>
                        <option value="Firefox">Firefox</option>
                        <option value="Edge">Edge</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">OS</label>
                      <select
                        value={filterOs}
                        onChange={(e) => setFilterOs(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                      >
                        <option value="">All OS</option>
                        <option value="Windows">Windows</option>
                        <option value="macOS">macOS</option>
                        <option value="iOS">iOS</option>
                        <option value="Android">Android</option>
                        <option value="Linux">Linux</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Device Type</label>
                      <select
                        value={filterDevice}
                        onChange={(e) => setFilterDevice(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                      >
                        <option value="">All Devices</option>
                        <option value="Desktop">Desktop</option>
                        <option value="Mobile">Mobile</option>
                        <option value="Tablet">Tablet</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Loader */}
              {isLoadingMessages ? (
                <div className="py-20 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-mono text-slate-500">Querying database...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-slate-200 rounded-3xl bg-white shadow-xl shadow-slate-200/50">
                  <Inbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-700">No matching messages</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    Could not find any confessions matching the specified criteria in this queue folder.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const themeObj = CARD_THEMES.find(t => t.id === msg.theme) || CARD_THEMES[0];
                    const meta = msg.metadata;

                    return (
                      <div
                        key={msg.id}
                        className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6"
                      >
                        {/* 1. Left Section: Visual Preview of Card */}
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-slate-400 mb-2 font-mono">Visitor Card Style</span>
                          
                          <div className={`rounded-2xl p-4 border relative ${themeObj.bgClass} ${themeObj.borderClass}`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] uppercase tracking-wider font-bold ${themeObj.badgeClass}`}>
                                {CATEGORY_EMOJIS[msg.category]} {msg.category}
                              </span>
                              <span className={`text-[9px] font-mono opacity-80 ${themeObj.textClass}`}>
                                @{msg.targetUsername}
                              </span>
                            </div>
                            <p className={`text-xs font-medium italic mb-4 leading-relaxed break-words ${themeObj.textClass}`}>
                              "{msg.message}"
                            </p>
                            <div className="flex justify-between items-center text-[9px] opacity-75">
                              <span className={themeObj.textClass}>
                                by {msg.nickname || 'Anonymous'}
                              </span>
                              <span className={themeObj.textClass}>
                                {new Date(msg.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Middle Section: Sender Metadata Coordinates */}
                        <div className="space-y-3 border-t lg:border-t-0 lg:border-x border-slate-100 pt-4 lg:pt-0 lg:px-6">
                          <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono">Sender Metadata Collection</span>
                          
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-indigo-500" /> Location
                              </span>
                              <p className="font-semibold text-slate-700">{meta?.city}, {meta?.country}</p>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Laptop className="w-3 h-3 text-pink-500" /> OS / Device
                              </span>
                              <p className="font-semibold text-slate-700">{meta?.os} ({meta?.device})</p>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Compass className="w-3 h-3 text-emerald-500" /> Browser
                              </span>
                              <p className="font-semibold text-slate-700">{meta?.browser}</p>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400">IP Address</span>
                              <p className="font-mono text-indigo-600 font-bold tracking-tight">{meta?.ip}</p>
                            </div>

                            <div className="col-span-2 space-y-0.5">
                              <span className="text-[10px] text-slate-400">UTC Timestamp</span>
                              <p className="font-mono text-slate-500 text-[11px]">{meta ? new Date(meta.timestamp).toISOString() : ''}</p>
                            </div>
                          </div>
                        </div>

                        {/* 3. Right Section: Operations & Controls */}
                        <div className="flex flex-col justify-between pt-4 lg:pt-0">
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-2.5 font-mono">Mod Operations</span>
                            
                            <div className="flex flex-wrap gap-2">
                              {/* Favorite Toggle */}
                              <button
                                onClick={() => handleToggleFavorite(msg.id, msg.favorite)}
                                className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                                  msg.favorite
                                    ? 'bg-amber-50 border-amber-200 text-amber-600'
                                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-200'
                                }`}
                                title="Star Favorite"
                              >
                                <Star className="w-4 h-4 fill-current" />
                              </button>

                              {/* Story generation */}
                              <button
                                onClick={() => exportCardToPng(msg.id, msg.message, msg.category, msg.nickname || 'Anonymous', CATEGORY_EMOJIS[msg.category], msg.theme)}
                                className="p-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <RefreshCw className="w-4 h-4" />
                                Export Card PNG
                              </button>

                              {/* Reply button */}
                              <button
                                onClick={() => setActiveReplyId(activeReplyId === msg.id ? null : msg.id)}
                                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  msg.reply
                                    ? 'bg-purple-50 border-purple-100 text-purple-600'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                                }`}
                              >
                                <MessageSquare className="w-4 h-4" />
                                {msg.reply ? 'Edit Reply' : 'Add Reply'}
                              </button>
                            </div>
                          </div>

                          {/* Quick Decision Actions (Approve / Reject) */}
                          <div className="flex gap-2 mt-4 lg:mt-0">
                            {msg.status !== 'approved' && (
                              <button
                                onClick={() => handleUpdateStatus(msg.id, 'approved')}
                                className="flex-1 bg-emerald-50 border border-emerald-100 hover:bg-emerald-600 hover:text-white text-emerald-600 font-semibold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                            )}

                            {msg.status !== 'deleted' && (
                              <button
                                onClick={() => handleUpdateStatus(msg.id, 'deleted')}
                                className="flex-1 bg-rose-50 border border-rose-100 hover:bg-rose-600 hover:text-white text-rose-600 font-semibold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                                Trash
                              </button>
                            )}

                            {msg.status === 'deleted' && (
                              <button
                                onClick={() => handleUpdateStatus(msg.id, 'pending')}
                                className="flex-1 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                Restore
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Inline Reply Form Expand */}
                        {activeReplyId === msg.id && (
                          <div className="col-span-1 lg:col-span-3 border-t border-slate-100 pt-4 mt-2 space-y-3 animate-fadeIn">
                            <label className="block text-xs font-semibold text-purple-600 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5" />
                              Write moderator response as @{msg.targetUsername}
                            </label>
                            
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Type your reply to this confession..."
                                value={replyInputMap[msg.id] || msg.reply || ''}
                                onChange={(e) => setReplyInputMap(prev => ({ ...prev, [msg.id]: e.target.value }))}
                                className="flex-1 bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl py-2 px-4 text-sm text-slate-900 outline-none transition-colors font-medium"
                              />
                              <button
                                onClick={() => handleReplySubmit(msg.id)}
                                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                                Save
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="analytics-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {isLoadingAnalytics ? (
                <div className="py-20 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-mono text-slate-500">Calculating system analytics...</span>
                </div>
              ) : !analyticsData ? (
                <p className="text-center text-xs text-slate-500">Could not compute analytical graphs.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category Distribution */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Category Distribution</h3>
                    <SvgBarChart
                      data={analyticsData.categories}
                      keys={Object.keys(analyticsData.categories)}
                      colors={['bg-indigo-500', 'bg-pink-500', 'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500', 'bg-purple-500']}
                    />
                  </div>

                  {/* Top Operating Systems */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Operating Systems</h3>
                    <SvgBarChart
                      data={analyticsData.operatingSystems}
                      keys={Object.keys(analyticsData.operatingSystems)}
                      colors={['bg-sky-500', 'bg-slate-400', 'bg-green-500', 'bg-indigo-500']}
                    />
                  </div>

                  {/* Submission trend line chart */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50 space-y-4 col-span-1 md:col-span-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Submission Timeline Trends (Daily Volume)</h3>
                    <SvgTrendChart data={analyticsData.dailySubmissions} />
                  </div>

                  {/* Geographic Location Doughnut Ring */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Top Locations Distribution</h3>
                    <SvgDoughnutRing data={analyticsData.locations} title="cities" />
                  </div>

                  {/* Browsers Doughnut Ring */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Top Browsers</h3>
                    <SvgDoughnutRing data={analyticsData.browsers} title="browsers" />
                  </div>

                  {/* Recent system Audit trail */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50 space-y-4 col-span-1 md:col-span-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 font-mono">Recent Admin Activities & Audit Trail</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                            <th className="py-2 pb-3">Timestamp</th>
                            <th className="py-2 pb-3">Admin</th>
                            <th className="py-2 pb-3">Action</th>
                            <th className="py-2 pb-3">IP Address</th>
                            <th className="py-2 pb-3">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          {analyticsData.recentActivity.map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3.5 font-mono text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                              <td className="py-3.5 font-semibold text-slate-900">@{log.user}</td>
                              <td className="py-3.5">
                                <span className="inline-flex px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 font-mono text-[9px] uppercase font-bold">
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-3.5 font-mono text-slate-500">{log.ip}</td>
                              <td className="py-3.5 text-slate-500 max-w-xs truncate" title={log.details}>{log.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
