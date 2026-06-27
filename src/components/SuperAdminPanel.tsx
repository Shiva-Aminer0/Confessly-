/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from './Router.jsx';
import {
  Lock, Settings, ShieldAlert, Cpu, HardDrive, Clock, Users,
  Globe, ShieldCheck, Trash2, Key, ToggleLeft, ToggleRight,
  Plus, Edit3, X, RefreshCw, KeyRound, LogOut, Check, ChevronRight, Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SuperAdminPanel() {
  const { navigate } = useRouter();

  // Authentication States
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [superUser, setSuperUser] = useState<{ username: string; role: string } | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Super Admin view tab selections: 'settings', 'admins', 'logs'
  const [activeTab, setActiveTab] = useState<'settings' | 'admins' | 'logs'>('settings');

  // Stats / Server Info State
  const [serverStats, setServerStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Admin Accounts list state
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [newAdminPerms, setNewAdminPerms] = useState<string[]>(['moderate']);

  // Edit Admin Account state
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  const [editAdminPass, setEditAdminPass] = useState('');
  const [editAdminPerms, setEditAdminPerms] = useState<string[]>([]);

  // Settings states
  const [blockedIps, setBlockedIps] = useState<string[]>([]);
  const [newIpToBlock, setNewIpToBlock] = useState('');
  const [profanityEnabled, setProfanityEnabled] = useState(true);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [newBannedWord, setNewBannedWord] = useState('');
  const [charLimit, setCharLimit] = useState(300);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

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
        if (data.valid && data.role === 'super_admin') {
          setSuperUser({ username: data.username, role: data.role });
        } else {
          handleLogout();
        }
        setIsCheckingSession(false);
      })
      .catch(() => {
        setIsCheckingSession(false);
      });
  }, [authToken]);

  // Load Admin list, server statistics, and website settings
  useEffect(() => {
    if (superUser) {
      loadStats();
      loadSettings();
      loadAdmins();
    }
  }, [superUser]);

  const loadStats = async () => {
    if (!authToken) return;
    setIsLoadingStats(true);
    try {
      const response = await fetch('/api/su/server-stats', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setServerStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadSettings = async () => {
    if (!authToken) return;
    try {
      const response = await fetch('/api/su/settings', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBlockedIps(data.settings.blockedIPs || []);
        setProfanityEnabled(data.settings.profanityFilterEnabled);
        setBannedWords(data.settings.customBlockedWords || []);
        setCharLimit(data.settings.defaultCharacterLimit || 300);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAdmins = async () => {
    if (!authToken) return;
    try {
      const response = await fetch('/api/su/admins', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAdminsList(data.admins || []);
      }
    } catch (err) {
      console.error(err);
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

      if (data.user.role !== 'super_admin') {
        throw new Error('Access denied: Unauthorized role credentials');
      }

      localStorage.setItem('admin_token', data.token);
      setAuthToken(data.token);
      setSuperUser({ username: data.user.username, role: data.user.role });
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setAuthToken(null);
    setSuperUser(null);
  };

  // Create Admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUser.trim() || !newAdminPass.trim()) return;

    try {
      const response = await fetch('/api/su/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          username: newAdminUser.trim(),
          password: newAdminPass.trim(),
          permissions: newAdminPerms
        })
      });

      if (response.ok) {
        setNewAdminUser('');
        setNewAdminPass('');
        setNewAdminPerms(['moderate']);
        setShowCreateModal(false);
        loadAdmins();
        loadStats();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create admin account');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Admin status
  const handleToggleAdminStatus = async (id: string, currentDisabled: boolean) => {
    try {
      const response = await fetch(`/api/su/admins/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ disabled: !currentDisabled })
      });

      if (response.ok) {
        loadAdmins();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Admin
  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to permanently delete this moderator?')) return;
    try {
      const response = await fetch(`/api/su/admins/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.ok) {
        loadAdmins();
        loadStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Admin Details (Password & Permissions)
  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    try {
      const response = await fetch(`/api/su/admins/${editingAdmin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          password: editAdminPass.trim() || undefined,
          permissions: editAdminPerms
        })
      });

      if (response.ok) {
        setEditingAdmin(null);
        setEditAdminPass('');
        setEditAdminPerms([]);
        loadAdmins();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update admin account');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Impersonate moderator and enter their panel
  const handleImpersonateAdmin = async (adm: any) => {
    try {
      const response = await fetch(`/api/su/impersonate/${adm.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to impersonate admin');
      }

      // Save impersonated credentials & coordinates so AdminPanel can parse and show
      localStorage.setItem('impersonated_by_su', 'true');
      localStorage.setItem('impersonated_admin_coords', JSON.stringify({
        latitude: adm.latitude,
        longitude: adm.longitude,
        username: adm.username
      }));
      localStorage.setItem('admin_token', data.token);

      // Navigate to standard admin dashboard!
      navigate('/admin');
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  // Save Config Settings
  const saveSystemSettings = async (updatedBlockedIps?: string[], updatedBannedWords?: string[]) => {
    setIsSavingSettings(true);
    const payload = {
      blockedIPs: updatedBlockedIps || blockedIps,
      profanityFilterEnabled: profanityEnabled,
      customBlockedWords: updatedBannedWords || bannedWords,
      defaultCharacterLimit: charLimit
    };

    try {
      const response = await fetch('/api/su/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        loadSettings();
        loadStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const blockIpAddress = () => {
    if (!newIpToBlock.trim() || blockedIps.includes(newIpToBlock.trim())) return;
    const newList = [...blockedIps, newIpToBlock.trim()];
    setBlockedIps(newList);
    setNewIpToBlock('');
    saveSystemSettings(newList, undefined);
  };

  const removeBlockedIp = (ip: string) => {
    const newList = blockedIps.filter(item => item !== ip);
    setBlockedIps(newList);
    saveSystemSettings(newList, undefined);
  };

  const addNewBannedWord = () => {
    if (!newBannedWord.trim() || bannedWords.includes(newBannedWord.trim().toLowerCase())) return;
    const newList = [...bannedWords, newBannedWord.trim().toLowerCase()];
    setBannedWords(newList);
    setNewBannedWord('');
    saveSystemSettings(undefined, newList);
  };

  const removeBannedWord = (word: string) => {
    const newList = bannedWords.filter(w => w !== word);
    setBannedWords(newList);
    saveSystemSettings(undefined, newList);
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-500">Checking owner access...</p>
      </div>
    );
  }

  // --- LOGIN SCREEN ---
  if (!superUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle Decorative Elements */}
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-rose-200/30 rounded-full blur-[120px]" />

        <div className="max-w-md w-full space-y-8 relative z-10 animate-fadeIn">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-rose-500 mb-4 shadow-md">
              <Settings className="w-6 h-6 animate-spin-slow" />
            </div>
            <h2 className="text-3xl font-display font-bold text-slate-950">Super Admin Dashboard</h2>
            <p className="mt-2 text-sm text-slate-500 font-sans">
              Enter credentials to access root level configuration and admin management.
            </p>
          </div>

          <form className="mt-8 space-y-5 bg-white border border-slate-200 p-8 rounded-3xl shadow-xl shadow-slate-200/60" onSubmit={handleLogin}>
            {loginError && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="owner-username" className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-1.5 font-mono">
                  Super Username
                </label>
                <input
                  id="owner-username"
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl py-3 px-4 text-slate-900 placeholder:text-slate-400 outline-none transition-colors text-sm font-semibold"
                  placeholder="e.g. owner"
                />
              </div>

              <div>
                <label htmlFor="owner-password" className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-1.5 font-mono">
                  Secure Password
                </label>
                <input
                  id="owner-password"
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl py-3 px-4 text-slate-900 placeholder:text-slate-400 outline-none transition-colors text-sm font-semibold"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-rose-600/10 cursor-pointer"
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                'Access Root Settings'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">
            For security, super admin logins are fully logged in our core auditing ledger.
          </p>
        </div>
      </div>
    );
  }

  // --- MAIN AUTHENTICATED SUPER ADMIN SYSTEM ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-rose-600 rounded-xl flex items-center justify-center font-black text-white text-base">
              S
            </div>
            <span className="font-display font-black text-lg tracking-tight text-slate-950">Confessly</span>
            <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-600 px-2.5 py-0.5 rounded-full font-mono uppercase font-bold">
              SUPER OWNER
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Go to Moderator Panel
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-500 hover:text-slate-950 flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
        
        {/* Statistics & System Health */}
        {serverStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-1 shadow-sm">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1 font-mono"><Cpu className="w-3.5 h-3.5 text-indigo-500" /> CPU Usage</span>
              <p className="text-xl font-display font-black text-slate-900">{serverStats.cpuUsage}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-1 shadow-sm">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1 font-mono"><HardDrive className="w-3.5 h-3.5 text-pink-500" /> Storage Capacity</span>
              <p className="text-xl font-display font-black text-slate-900">{serverStats.storageUsage}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-1 shadow-sm">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1 font-mono"><Clock className="w-3.5 h-3.5 text-emerald-500" /> System Uptime</span>
              <p className="text-xl font-display font-black text-slate-900">{serverStats.uptime}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-1 shadow-sm">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1 font-mono"><Users className="w-3.5 h-3.5 text-amber-500" /> Active Boards</span>
              <p className="text-xl font-display font-black text-slate-900">{serverStats.totalUsers}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-1 shadow-sm">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1 font-mono"><Globe className="w-3.5 h-3.5 text-rose-500" /> Traffic Volume</span>
              <p className="text-xl font-display font-black text-slate-900">{serverStats.websiteTraffic}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-1 shadow-sm">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1 font-mono"><ShieldCheck className="w-3.5 h-3.5 text-violet-500" /> Total Admin Count</span>
              <p className="text-xl font-display font-black text-slate-900">{serverStats.adminCount}</p>
            </div>
          </div>
        )}

        {/* View Selection Tab Button Bar */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-4 text-sm font-semibold relative cursor-pointer ${
              activeTab === 'settings' ? 'text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            System Settings & Security
            {activeTab === 'settings' && (
              <motion.div layoutId="suActiveTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('admins')}
            className={`pb-4 text-sm font-semibold relative cursor-pointer ${
              activeTab === 'admins' ? 'text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Moderator Account Management
            {activeTab === 'admins' && (
              <motion.div layoutId="suActiveTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-4 text-sm font-semibold relative cursor-pointer ${
              activeTab === 'logs' ? 'text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Root Server Log Audit
            {activeTab === 'logs' && (
              <motion.div layoutId="suActiveTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600" />
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'settings' ? (
            <motion.div
              key="settings-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Blocklist Panel */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5 font-mono">
                  <Ban className="w-4 h-4" /> Blocked IP Address List (Blacklist)
                </h3>
                <p className="text-xs text-slate-500">Blocked IPs are fully prohibited from submitting confessions or attempting logins.</p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter public IP to blacklist..."
                    value={newIpToBlock}
                    onChange={(e) => setNewIpToBlock(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 outline-none focus:border-rose-500 font-mono"
                  />
                  <button
                    onClick={blockIpAddress}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Block IP
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                  {blockedIps.map((ip) => (
                    <div key={ip} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-700">{ip}</span>
                      <button
                        onClick={() => removeBlockedIp(ip)}
                        className="text-slate-500 hover:text-rose-600 text-xs font-semibold cursor-pointer"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                  {blockedIps.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400 italic">No IPs currently blacklisted</div>
                  )}
                </div>
              </div>

              {/* Profanity and Content Controls */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-4 h-4" /> Profanity Filter Configuration
                </h3>
                
                <div className="flex items-center justify-between py-2 bg-slate-50 px-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="block text-xs font-semibold text-slate-800">Active Spam Filter</span>
                    <span className="text-[10px] text-slate-500">Auto-routes flagged words to the trash folder.</span>
                  </div>
                  <button
                    onClick={() => {
                      setProfanityEnabled(!profanityEnabled);
                      // Save state immediately
                      setTimeout(() => saveSystemSettings(), 100);
                    }}
                    className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {profanityEnabled ? (
                      <ToggleRight className="w-9 h-9 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-slate-300" />
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Custom Banned Keywords</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. hack, spam, promotion..."
                      value={newBannedWord}
                      onChange={(e) => setNewBannedWord(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 outline-none focus:border-rose-500"
                    />
                    <button
                      onClick={addNewBannedWord}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold px-4 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2 max-h-[100px] overflow-y-auto">
                    {bannedWords.map((word) => (
                      <span key={word} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium">
                        {word}
                        <X
                          className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                          onClick={() => removeBannedWord(word)}
                        />
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="charLimit" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Default Character Limit</label>
                  <div className="flex items-center gap-4">
                    <input
                      id="charLimit"
                      type="number"
                      value={charLimit}
                      onChange={(e) => setCharLimit(Number(e.target.value))}
                      className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 outline-none focus:border-rose-500"
                    />
                    <button
                      onClick={() => saveSystemSettings()}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Save Boundary Limit
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'admins' ? (
            <motion.div
              key="admins-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-rose-600 font-mono">Moderator Accounts Ledger</h3>
                    <p className="text-xs text-slate-500 mt-1">Manage admin permissions, disable moderators, or spawn new moderator accounts.</p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Create Admin
                  </button>
                </div>

                <div className="overflow-x-auto pt-4">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                        <th className="py-2 pb-3">Username</th>
                        <th className="py-2 pb-3">Roles / Permissions</th>
                        <th className="py-2 pb-3">Status</th>
                        <th className="py-2 pb-3">Last Active Connection</th>
                        <th className="py-2 pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {adminsList.map((adm) => (
                        <tr key={adm.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 font-semibold text-slate-900">@{adm.username}</td>
                          <td className="py-3.5">
                            <div className="flex gap-1">
                              {adm.permissions.map((p: string) => (
                                <span key={p} className="bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 text-[9px] font-mono text-indigo-600 uppercase font-bold">
                                  {p}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5">
                            {adm.disabled ? (
                              <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">🚫 Disabled</span>
                            ) : (
                              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">● Active</span>
                            )}
                          </td>
                          <td className="py-3.5 text-slate-500">
                            {adm.lastActive ? (
                              <div className="space-y-1">
                                <span className="block font-medium text-[10px] text-slate-500">{new Date(adm.lastActive).toLocaleString()}</span>
                                <span className="block text-[9px] font-mono text-slate-400">{adm.location} ({adm.ip})</span>
                                {adm.latitude && adm.longitude && (
                                  <span className="block text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/40 inline-block mt-0.5">
                                    📍 {adm.latitude.toFixed(5)}, {adm.longitude.toFixed(5)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Never connected</span>
                            )}
                          </td>
                          <td className="py-3.5">
                            {!adm.permissions.includes('super_admin') ? (
                              <div className="flex flex-wrap items-center gap-3">
                                <button
                                  onClick={() => handleImpersonateAdmin(adm)}
                                  className="text-indigo-600 hover:text-indigo-800 text-xs font-bold hover:underline cursor-pointer bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors shadow-xs"
                                >
                                  Enter Panel
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingAdmin(adm);
                                    setEditAdminPass('');
                                    setEditAdminPerms(adm.permissions);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                  onClick={() => handleToggleAdminStatus(adm.id, adm.disabled)}
                                  className={`text-xs font-semibold cursor-pointer ${adm.disabled ? 'text-emerald-600 hover:underline' : 'text-amber-600 hover:underline'}`}
                                >
                                  {adm.disabled ? 'Enable' : 'Disable'}
                                </button>
                                <button
                                  onClick={() => handleDeleteAdmin(adm.id)}
                                  className="text-rose-600 hover:text-rose-800 text-xs font-semibold hover:underline cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">Root immutable</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Create Admin dialog modal */}
              {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative"
                  >
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <h3 className="text-base font-bold text-slate-900 font-display">Spawn Moderator Account</h3>

                    <form onSubmit={handleCreateAdmin} className="space-y-4 pt-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">Username</label>
                        <input
                          type="text"
                          required
                          value={newAdminUser}
                          onChange={(e) => setNewAdminUser(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                          placeholder="e.g. mod_alex"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">Password</label>
                        <input
                          type="password"
                          required
                          value={newAdminPass}
                          onChange={(e) => setNewAdminPass(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                          placeholder="••••••••"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 font-mono">Permissions</label>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={newAdminPerms.includes('moderate')}
                              onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewAdminPerms([...newAdminPerms, 'moderate']);
                                  } else {
                                    setNewAdminPerms(newAdminPerms.filter(p => p !== 'moderate'));
                                  }
                                }}
                              className="rounded border-slate-300 bg-white text-indigo-600 focus:ring-0"
                            />
                            Moderate inbox queues
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={newAdminPerms.includes('analytics')}
                              onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewAdminPerms([...newAdminPerms, 'analytics']);
                                  } else {
                                    setNewAdminPerms(newAdminPerms.filter(p => p !== 'analytics'));
                                  }
                                }}
                              className="rounded border-slate-300 bg-white text-indigo-600 focus:ring-0"
                            />
                            View analytics trends
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Create Account
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}

              {editingAdmin && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative"
                  >
                    <button
                      onClick={() => setEditingAdmin(null)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <h3 className="text-base font-bold text-slate-900 font-display">Edit Admin Account</h3>
                    <p className="text-xs text-indigo-600 font-semibold">Editing user: @{editingAdmin.username}</p>

                    <form onSubmit={handleUpdateAdmin} className="space-y-4 pt-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">New Password</label>
                        <input
                          type="password"
                          value={editAdminPass}
                          onChange={(e) => setEditAdminPass(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                          placeholder="Leave blank to keep current password"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 font-mono">Permissions</label>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={editAdminPerms.includes('moderate')}
                              onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditAdminPerms([...editAdminPerms, 'moderate']);
                                  } else {
                                    setEditAdminPerms(editAdminPerms.filter(p => p !== 'moderate'));
                                  }
                                }}
                              className="rounded border-slate-300 bg-white text-indigo-600 focus:ring-0"
                            />
                            Moderate inbox queues
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={editAdminPerms.includes('analytics')}
                              onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditAdminPerms([...editAdminPerms, 'analytics']);
                                  } else {
                                    setEditAdminPerms(editAdminPerms.filter(p => p !== 'analytics'));
                                  }
                                }}
                              className="rounded border-slate-300 bg-white text-indigo-600 focus:ring-0"
                            />
                            View analytics trends
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="logs-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Detailed audit table */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-rose-600 font-mono">Root Auditing Ledger</h3>
                    <p className="text-xs text-slate-500 mt-1">Immutable log of system modifications and administrative session authorizations.</p>
                  </div>
                  
                  <button
                    onClick={loadStats}
                    className="p-2 border border-slate-200 rounded-xl hover:border-slate-300 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Refresh logs"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider font-mono">
                        <th className="py-2 pb-3">Timestamp (UTC)</th>
                        <th className="py-2 pb-3">User Node</th>
                        <th className="py-2 pb-3">Security Action</th>
                        <th className="py-2 pb-3">Device IP</th>
                        <th className="py-2 pb-3">Ledger Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {serverStats?.logs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 font-mono text-[10px] text-slate-400">{new Date(log.timestamp).toISOString()}</td>
                          <td className="py-3 font-semibold text-slate-900">@{log.user}</td>
                          <td className="py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded font-mono text-[9px] uppercase font-bold border ${
                              log.action.includes('FAILED') || log.action.includes('BLOCK')
                                ? 'bg-rose-50 border-rose-100 text-rose-600'
                                : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-slate-500">{log.ip}</td>
                          <td className="py-3 text-slate-500 max-w-sm truncate" title={log.details}>{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
