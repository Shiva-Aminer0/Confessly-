/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from './Router.jsx';
import { SvgBarChart, SvgTrendChart, SvgDoughnutRing } from './AnalyticsCharts.jsx';
import { CARD_THEMES, CATEGORY_EMOJIS, CATEGORIES } from '../constants.js';
import { Message, Category } from '../types.js';
import { exportCardToPng } from '../utils.js';
import {
  Lock, CheckCircle, Trash2, Star, MessageSquare, ShieldAlert,
  Search, SlidersHorizontal, Eye, RefreshCw, BarChart3, Inbox,
  Compass, Laptop, MapPin, KeyRound, LogOut, Check, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPanel() {
  const { navigate } = useRouter();

  // Authentication States
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
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

  // Impersonation & Export Modal States
  const [impersonatedBySu, setImpersonatedBySu] = useState(false);
  const [impersonatedCoords, setImpersonatedCoords] = useState<{ latitude?: number; longitude?: number; username?: string }>({});
  const [exportingMessage, setExportingMessage] = useState<Message | null>(null);
  const [selectedExportTemplate, setSelectedExportTemplate] = useState<string>('sunset');

  // Live Notification, Seen Set and Trash Deletion States
  const [newConfessionNotification, setNewConfessionNotification] = useState<Message | null>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const [isClearingTrash, setIsClearingTrash] = useState(false);

  const handleClearTrash = async () => {
    if (!window.confirm("Are you sure you want to permanently empty the Trash folder? This will delete these confessions forever.")) {
      return;
    }
    setIsClearingTrash(true);
    try {
      const response = await fetch('/api/messages/trash', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        loadMessages();
      } else {
        const errData = await response.json();
        alert(errData.error || "Failed to clear trash folder");
      }
    } catch (err) {
      console.error(err);
      alert("Error clearing trash folder.");
    } finally {
      setIsClearingTrash(false);
    }
  };

  // List of 9 beautiful selectable templates
  const EXPORT_TEMPLATES = [
    { id: 'sunset', name: 'Sunset Glow', bgClass: 'bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500', textClass: 'text-white', badgeClass: 'bg-white/20 text-white', borderClass: 'border-white/20' },
    { id: 'neon', name: 'Neon Cyber', bgClass: 'bg-slate-950 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]', textClass: 'text-purple-100', badgeClass: 'bg-purple-500/20 text-purple-300 border border-purple-500/30', borderClass: 'border-purple-500/20' },
    { id: 'ocean', name: 'Ocean Breeze', bgClass: 'bg-gradient-to-tr from-blue-600 to-emerald-500', textClass: 'text-white', badgeClass: 'bg-white/20 text-white', borderClass: 'border-white/20' },
    { id: 'fire', name: 'Hellfire', bgClass: 'bg-gradient-to-tr from-stone-900 via-orange-950 to-red-600', textClass: 'text-white border border-red-500/30', badgeClass: 'bg-red-500/20 text-red-200 border border-red-500/30', borderClass: 'border-red-500/20' },
    { id: 'cosmic', name: 'Cosmic Space', bgClass: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950', textClass: 'text-slate-100', badgeClass: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30', borderClass: 'border-indigo-500/20' },
    { id: 'matcha', name: 'Matcha Zen', bgClass: 'bg-gradient-to-tr from-emerald-100 via-lime-100 to-green-100', textClass: 'text-emerald-950', badgeClass: 'bg-emerald-900/10 text-emerald-900', borderClass: 'border-emerald-900/10' },
    { id: 'bubblegum', name: 'Bubblegum Pop', bgClass: 'bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300', textClass: 'text-slate-900', badgeClass: 'bg-white/30 text-slate-850', borderClass: 'border-white/30' },
    { id: 'clean', name: 'Swiss Minimalist', bgClass: 'bg-slate-50 border border-slate-200', textClass: 'text-slate-900', badgeClass: 'bg-slate-200 text-slate-800', borderClass: 'border-slate-300' },
    { id: 'gold', name: 'Midnight Luxury', bgClass: 'bg-zinc-950 border border-amber-500/45 shadow-[0_0_15px_rgba(245,158,11,0.05)]', textClass: 'text-zinc-100', badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', borderClass: 'border-amber-500/30' },
  ];

  // Check Session validity on boot
  useEffect(() => {
    // Check SU impersonation
    const isImpersonated = localStorage.getItem('impersonated_by_su') === 'true';
    setImpersonatedBySu(isImpersonated);
    if (isImpersonated) {
      const coordsStr = localStorage.getItem('impersonated_admin_coords');
      if (coordsStr) {
        try {
          setImpersonatedCoords(JSON.parse(coordsStr));
        } catch (e) {
          console.error(e);
        }
      }
    }

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

  // Request & Update admin exact coordinates
  useEffect(() => {
    if (adminUser && authToken && !impersonatedBySu) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetch('/api/admin/coordinates', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              })
            }).catch(err => console.error('Error posting admin location:', err));
          },
          (error) => {
            console.warn('Moderator geolocation declined or timed out', error);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
    }
  }, [adminUser, authToken, impersonatedBySu]);

  // Load Messages & Analytics (only run analytics if super_admin)
  useEffect(() => {
    if (adminUser) {
      loadMessages();
      if (adminUser.role === 'super_admin') {
        loadAnalytics();
      }
    }
  }, [adminUser, filterStatus, filterCategory, searchKeyword, filterIp, filterBrowser, filterOs, filterDevice, filterLocation]);

  // Synthesize beautiful chime sound for new confessions
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (err) {
      console.warn('Audio play blocked or unsupported:', err);
    }
  };

  // Background poller for new confessions (runs every 6 seconds)
  useEffect(() => {
    if (!authToken || !adminUser) return;

    const intervalId = setInterval(async () => {
      try {
        const response = await fetch('/api/messages', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          const fetched: Message[] = data.messages || [];

          if (seenMessageIdsRef.current.size > 0) {
            // Find messages that aren't in the seen list
            const unseen = fetched.filter(m => !seenMessageIdsRef.current.has(m.id));
            if (unseen.length > 0) {
              // Add new ones to seen set
              unseen.forEach(m => seenMessageIdsRef.current.add(m.id));

              // Play notification sound
              playNotificationSound();

              // Trigger visual notification with the newest incoming message
              setNewConfessionNotification(unseen[unseen.length - 1]);

              // Refresh lists in the UI
              loadMessages();
            }
          } else {
            // First run, populate the seen list
            fetched.forEach(m => seenMessageIdsRef.current.add(m.id));
          }
        }
      } catch (err) {
        console.error('Error polling for new confessions:', err);
      }
    }, 6000);

    return () => clearInterval(intervalId);
  }, [authToken, adminUser]);

  // Auto-dismiss the live notification toast
  useEffect(() => {
    if (newConfessionNotification) {
      const timer = setTimeout(() => {
        setNewConfessionNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [newConfessionNotification]);

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
        const fetched = data.messages || [];
        setMessages(fetched);

        // Populate seen set initially if it's empty
        if (seenMessageIdsRef.current.size === 0) {
          fetched.forEach((m: Message) => seenMessageIdsRef.current.add(m.id));
        }
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

    const targetUrl = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput.trim(), password: passwordInput })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('admin_token', data.token);
      setAuthToken(data.token);
      setAdminUser({ username: data.user.username, role: data.user.role });

      if (authMode === 'register') {
        setShowShareModal(true);
      }
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('impersonated_by_su');
    localStorage.removeItem('impersonated_admin_coords');
    setAuthToken(null);
    setAdminUser(null);
  };

  const handleExitImpersonation = () => {
    localStorage.removeItem('impersonated_by_su');
    localStorage.removeItem('impersonated_admin_coords');
    localStorage.removeItem('admin_token');
    setAuthToken(null);
    setAdminUser(null);
    navigate('/su');
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
            <h2 className="text-3xl font-display font-bold text-slate-900">
              {authMode === 'register' ? 'Get Your Handle' : 'Admin Dashboard'}
            </h2>
            <p className="mt-2 text-sm text-slate-500 font-sans">
              {authMode === 'register' 
                ? 'Create a custom shareable link to receive anonymous confessions!' 
                : 'Sign in to moderate confessions and view analytics'}
            </p>

            {/* Tab Swapper */}
            <div className="mt-6 flex bg-slate-200 p-1 rounded-2xl border border-slate-300/30">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setLoginError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === 'login' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setLoginError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === 'register' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Create NGL Link
              </button>
            </div>
          </div>

          <form className="mt-6 space-y-5 bg-white border border-slate-200 p-8 rounded-3xl shadow-xl shadow-slate-200/50" onSubmit={handleLogin}>
            {loginError && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                  {authMode === 'register' ? 'Choose Username / Handle' : 'Username'}
                </label>
                <div className="relative">
                  {authMode === 'register' && (
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                  )}
                  <input
                    id="username"
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className={`w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl py-3 text-slate-900 placeholder:text-slate-300 outline-none transition-colors text-sm font-semibold ${
                      authMode === 'register' ? 'pl-9 pr-4' : 'px-4'
                    }`}
                    placeholder={authMode === 'register' ? 'your_handle' : 'e.g. admin'}
                  />
                </div>
                {authMode === 'register' && usernameInput && (
                  <p className="mt-1.5 text-xs text-indigo-600 font-medium">
                    Your link: <span className="font-semibold underline">{window.location.origin}/@{usernameInput}</span>
                  </p>
                )}
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
              ) : authMode === 'register' ? (
                'Finalize Link & Create Account'
              ) : (
                'Access Moderator Portal'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            {authMode === 'register' 
              ? 'By creating a link, you agree to our terms of anonymous sharing.' 
              : 'Forgot credentials? Contact Website Super Admin Owner.'}
          </p>
        </div>
      </div>
    );
  }

  // --- MAIN AUTHENTICATED ADMIN PANEL ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      
      {impersonatedBySu && (
        <div className="bg-rose-600 text-white text-xs px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 font-sans z-50 relative border-b border-rose-700 shadow-md">
          <div className="flex flex-wrap items-center gap-2">
            <span className="animate-pulse bg-white/20 px-2 py-0.5 rounded text-[9px] uppercase font-bold border border-white/20">🚨 Impersonating Mode</span>
            <span>
              Super Admin owner accessing moderator <strong className="font-semibold">@{adminUser?.username}</strong>'s panel.
            </span>
            {impersonatedCoords.latitude && impersonatedCoords.longitude && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${impersonatedCoords.latitude},${impersonatedCoords.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono bg-black/20 hover:bg-black/40 px-2.5 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                title="Click to view on Google Maps"
              >
                📍 Coordinates: {impersonatedCoords.latitude.toFixed(5)}, {impersonatedCoords.longitude.toFixed(5)} (This GPS data is hidden from standard admins)
              </a>
            )}
          </div>
          <button
            onClick={handleExitImpersonation}
            className="bg-white text-rose-700 hover:bg-slate-100 font-bold px-3 py-1 rounded-lg text-[11px] transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          >
            Exit & Return to SU Panel
          </button>
        </div>
      )}

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
        {adminUser?.role === 'super_admin' && analyticsData && (
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
          
          {adminUser?.role === 'super_admin' && (
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
          )}
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
              {/* NGL Share Link Widget */}
              {adminUser && adminUser.role !== 'super_admin' && (
                <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white rounded-3xl p-6 shadow-xl shadow-rose-500/10 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] uppercase tracking-wider font-bold">
                        🔥 Live Confessly Link
                      </div>
                      <h3 className="text-xl font-display font-bold">Your anonymous feedback channel is ready!</h3>
                      <p className="text-white/80 text-xs font-sans max-w-xl">
                        Share your unique link in your Instagram bio or story sticker to begin receiving real anonymous confessions from friends.
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 font-mono text-sm font-semibold select-all">
                        {window.location.origin}/@{adminUser.username}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/@${adminUser.username}`);
                          setLinkCopied(true);
                          setTimeout(() => setLinkCopied(false), 2000);
                        }}
                        className="bg-white text-rose-600 hover:bg-rose-50 font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Check className="w-4 h-4" />
                        {linkCopied ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <p className="text-xs text-white/95 font-medium flex items-center gap-1.5">
                      💡 <span className="font-semibold">Protip:</span> Add the "Link Sticker" to your Instagram Story and paste your Confessly link!
                    </p>
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="text-xs text-white underline hover:text-white/80 font-bold cursor-pointer"
                    >
                      Show sharing template instructions &rarr;
                    </button>
                  </div>
                </div>
              )}

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

                  {filterStatus === 'deleted' && (
                    <button
                      onClick={handleClearTrash}
                      disabled={isClearingTrash}
                      className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Permanently empty all confessions in this folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isClearingTrash ? 'Emptying...' : 'Empty Trash'}
                    </button>
                  )}
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
                              {meta?.latitude && meta?.longitude && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${meta.latitude},${meta.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-indigo-600 font-bold font-mono bg-indigo-50/50 hover:bg-indigo-100 hover:text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-100/30 inline-flex items-center gap-1 mt-1 transition-all cursor-pointer"
                                  title="Click to view on Google Maps"
                                >
                                  📍 {meta.latitude.toFixed(5)}, {meta.longitude.toFixed(5)}
                                </a>
                              )}
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Laptop className="w-3 h-3 text-pink-500" /> OS / Device
                              </span>
                              <p className="font-semibold text-slate-700" title={meta?.deviceName}>
                                {meta?.deviceName || `${meta?.os} (${meta?.device})`}
                              </p>
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
                                onClick={() => {
                                  setExportingMessage(msg);
                                  setSelectedExportTemplate(msg.theme);
                                }}
                                className="p-2.5 bg-slate-50 border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
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

      {/* 5-10 SELECTABLE STORY CARD TEMPLATES EXPORT MODAL */}
      <AnimatePresence>
        {exportingMessage && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Left Column: Live Preview of Card */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 font-mono">Live Story Preview</h3>
                  
                  {/* Styled preview card using the currently selected template */}
                  {(() => {
                    const temp = EXPORT_TEMPLATES.find(t => t.id === selectedExportTemplate) || EXPORT_TEMPLATES[0];
                    return (
                      <div className="space-y-4">
                        <div className={`rounded-3xl p-6 border shadow-xl relative flex flex-col justify-between transition-all duration-300 ${temp.bgClass} ${temp.borderClass}`}>
                          <div className="flex justify-between items-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold shadow-xs ${temp.badgeClass}`}>
                              {CATEGORY_EMOJIS[exportingMessage.category]} {exportingMessage.category}
                            </span>
                            <span className={`text-xs font-mono font-bold opacity-80 ${temp.textClass}`}>
                              @{exportingMessage.targetUsername}
                            </span>
                          </div>
                          
                          <p className={`text-sm font-semibold italic my-6 leading-relaxed break-words text-center ${temp.textClass}`}>
                            "{exportingMessage.message}"
                          </p>
                          
                          <div className="flex justify-between items-center text-[11px] opacity-75 font-mono">
                            <span className={temp.textClass}>
                              by {exportingMessage.nickname || 'Anonymous'}
                            </span>
                            <span className={temp.textClass}>
                              {new Date(exportingMessage.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {exportingMessage.reply && (
                          <div className={`rounded-2xl p-5 shadow-lg border border-slate-200/50 flex flex-col justify-between text-left animate-fadeIn ${
                            selectedExportTemplate === 'clean' ? 'bg-slate-800 text-white' :
                            selectedExportTemplate === 'matcha' ? 'bg-emerald-800 text-white' :
                            selectedExportTemplate === 'bubblegum' ? 'bg-pink-500 text-white' :
                            selectedExportTemplate === 'gold' ? 'bg-amber-400 text-slate-950 font-semibold' :
                            'bg-white text-slate-900'
                          }`}>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">REPLY:</span>
                            <p className="text-sm font-bold mt-1 break-words">
                              {exportingMessage.reply}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-4 text-[11px] text-slate-400 font-sans leading-tight">
                  💡 Canvas drawings render with premium shadows, typography, and color-matched high-definition borders.
                </div>
              </div>

              {/* Right Column: Template Selector & Actions */}
              <div className="w-full md:w-80 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-rose-600 font-mono">Select Template</h3>
                    <button
                      onClick={() => setExportingMessage(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mb-4">
                    Choose from 9 distinct story card templates to apply instantly to the generated image output:
                  </p>

                  {/* Grid of templates */}
                  <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-1">
                    {EXPORT_TEMPLATES.map((t) => {
                      const isSelected = selectedExportTemplate === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setSelectedExportTemplate(t.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all text-xs font-semibold cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-3.5 h-3.5 rounded-full border border-white/20 ${t.bgClass}`} />
                            <span>{t.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => {
                      exportCardToPng(
                        exportingMessage.id,
                        exportingMessage.message,
                        exportingMessage.category,
                        exportingMessage.nickname || 'Anonymous',
                        CATEGORY_EMOJIS[exportingMessage.category],
                        selectedExportTemplate,
                        exportingMessage.reply
                      );
                      setExportingMessage(null);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate & Download PNG
                  </button>
                  <button
                    onClick={() => setExportingMessage(null)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Onboarding / Link Sharing Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 relative overflow-hidden space-y-6">
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute right-4 top-4 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-2">
                <div className="mx-auto h-16 w-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-500">
                  <Compass className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-2xl font-display font-bold text-slate-900">Your Shareable Link is Ready!</h3>
                <p className="text-sm text-slate-500">
                  Follow these 4 simple steps to start receiving anonymous confessions:
                </p>
              </div>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-pink-100 text-pink-600 font-bold rounded-xl flex items-center justify-center shrink-0">1</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-slate-800 text-left">Copy your link</h4>
                    <div className="mt-2 flex items-center gap-2 w-full">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-600 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">
                        {window.location.origin}/@{adminUser?.username}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/@${adminUser?.username}`);
                          setLinkCopied(true);
                          setTimeout(() => setLinkCopied(false), 2000);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
                      >
                        {linkCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 text-left">
                  <div className="w-8 h-8 bg-rose-100 text-rose-600 font-bold rounded-xl flex items-center justify-center shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Open Instagram and create a Story</h4>
                    <p className="text-xs text-slate-500">Take a photo, select an eye-catching background, or use our customized background generator.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 text-left">
                  <div className="w-8 h-8 bg-amber-100 text-amber-600 font-bold rounded-xl flex items-center justify-center shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Choose the "Link Sticker"</h4>
                    <p className="text-xs text-slate-500">Tap the sticker icon in Instagram Stories, select "LINK", and paste your unique Confessly URL.</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4 text-left">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 font-bold rounded-xl flex items-center justify-center shrink-0">4</div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Publish & Wait!</h4>
                    <p className="text-xs text-slate-500">Your friends can click the link sticker to send confessions anonymously without even downloading an app!</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowShareModal(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-all cursor-pointer text-center text-sm"
              >
                Perfect, let me check my messages!
              </button>
            </div>
          </div>
        )}

        {/* Real-time Toast Notification */}
        {newConfessionNotification && (
          <motion.div
            key="realtime-notification"
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed top-6 right-6 z-[100] max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl shadow-slate-950/40 p-4 border border-slate-800 flex items-start gap-3.5"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl shrink-0 animate-bounce">
              💬
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                  New Confession!
                </span>
                <button
                  onClick={() => setNewConfessionNotification(null)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs font-semibold mt-1 text-slate-100 line-clamp-2">
                "{newConfessionNotification.message}"
              </p>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[9px]">
                  {newConfessionNotification.category}
                </span>
                <span>• {newConfessionNotification.nickname || 'Anonymous'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
