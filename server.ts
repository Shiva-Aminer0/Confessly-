/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { DatabaseSchema, Message, AdminUser, AuditLog, SystemSettings, Category } from './src/types.js';

const app = express();
const PORT = 3000;
let DB_FILE = path.join(process.cwd(), 'data', 'db.json');

// Vercel serverless functions have a read-only filesystem except for /tmp.
if (process.env.VERCEL || process.env.NOW_BUILDER) {
  const tempDbPath = path.join('/tmp', 'db.json');
  if (!fs.existsSync(tempDbPath)) {
    try {
      const sourceDbPath = path.join(process.cwd(), 'data', 'db.json');
      if (fs.existsSync(sourceDbPath)) {
        fs.mkdirSync(path.dirname(tempDbPath), { recursive: true });
        fs.copyFileSync(sourceDbPath, tempDbPath);
      }
    } catch (err) {
      console.error('Failed to copy database to Vercel temp space', err);
    }
  }
  DB_FILE = tempDbPath;
}

// Ensure DB directory and file exist
function initializeDB() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const defaultSettings: SystemSettings = {
    blockedIPs: [],
    profanityFilterEnabled: true,
    customBlockedWords: ['spam', 'abuse', 'hack', 'scam', 'hate'],
    defaultCharacterLimit: 300
  };

  const defaultAdmins: AdminUser[] = [
    {
      id: 'admin-1',
      username: 'owner',
      passwordHash: 'password123', // Clean simple auth for the PRD requirements
      disabled: false,
      permissions: ['super_admin'],
      loginHistory: []
    },
    {
      id: 'admin-2',
      username: 'admin',
      passwordHash: 'password123',
      disabled: false,
      permissions: ['moderate', 'analytics'],
      loginHistory: []
    }
  ];

  const defaultMessages: Message[] = [
    {
      id: 'msg-1',
      targetUsername: 'shiva',
      message: 'Thanks for build this amazing app. It looks extremely modern!',
      category: 'Compliment',
      emoji: '💖',
      theme: 'sunset',
      nickname: 'Secret Fan',
      approved: true,
      favorite: true,
      status: 'approved',
      createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      metadata: {
        ip: '8.8.8.8',
        browser: 'Chrome',
        os: 'macOS',
        device: 'Desktop',
        resolution: '1920x1080',
        language: 'en-US',
        timezone: 'America/New_York',
        country: 'United States',
        city: 'New York',
        timestamp: new Date(Date.now() - 4 * 3600000).toISOString()
      }
    },
    {
      id: 'msg-2',
      targetUsername: 'shiva',
      message: 'Who was that person walking with you near the cafe yesterday?',
      category: 'Question',
      emoji: '🤔',
      theme: 'neon',
      nickname: 'Curious',
      approved: true,
      favorite: false,
      status: 'approved',
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      metadata: {
        ip: '103.45.1.1',
        browser: 'Safari',
        os: 'iOS',
        device: 'Mobile',
        resolution: '390x844',
        language: 'en-US',
        timezone: 'Asia/Tokyo',
        country: 'Japan',
        city: 'Tokyo',
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString()
      }
    },
    {
      id: 'msg-3',
      targetUsername: 'shiva',
      message: 'I dare you to wear a pink wig to the next conference presentation!',
      category: 'Roast',
      emoji: '🔥',
      theme: 'fire',
      nickname: 'Roaster3000',
      approved: false,
      favorite: false,
      status: 'pending',
      createdAt: new Date().toISOString(),
      metadata: {
        ip: '185.12.3.4',
        browser: 'Firefox',
        os: 'Windows',
        device: 'Desktop',
        resolution: '2560x1440',
        language: 'de-DE',
        timezone: 'Europe/Berlin',
        country: 'Germany',
        city: 'Berlin',
        timestamp: new Date().toISOString()
      }
    }
  ];

  const defaultAuditLogs: AuditLog[] = [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
      user: 'system',
      action: 'SYSTEM_INITIALIZATION',
      ip: '127.0.0.1',
      details: 'Confessly database bootstrapped successfully.'
    }
  ];

  if (!fs.existsSync(DB_FILE)) {
    const initialDB: DatabaseSchema = {
      admins: defaultAdmins,
      messages: defaultMessages,
      settings: defaultSettings,
      auditLogs: defaultAuditLogs
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf-8');
  }
}

initializeDB();

// DB Access Helpers
function readDB(): DatabaseSchema {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB, reinitializing...', err);
    initializeDB();
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  }
}

function writeDB(data: DatabaseSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Security: Check IP blocked
function isIpBlocked(ip: string): boolean {
  const db = readDB();
  return db.settings.blockedIPs.includes(ip);
}

// Simple profanity checker
function checkProfanity(text: string): boolean {
  const db = readDB();
  if (!db.settings.profanityFilterEnabled) return false;
  const lowerText = text.toLowerCase();
  return db.settings.customBlockedWords.some(word => lowerText.includes(word.toLowerCase()));
}

// Log Audit Action
function logAudit(user: string, action: string, ip: string, details: string) {
  const db = readDB();
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    user,
    action,
    ip,
    details
  };
  db.auditLogs.unshift(newLog);
  writeDB(db);
}

// Location lookup mock based on IP
const LOCATIONS = [
  { city: 'San Francisco', country: 'United States' },
  { city: 'London', country: 'United Kingdom' },
  { city: 'Tokyo', country: 'Japan' },
  { city: 'Bengaluru', country: 'India' },
  { city: 'Sydney', country: 'Australia' },
  { city: 'Paris', country: 'France' },
  { city: 'Berlin', country: 'Germany' },
  { city: 'Singapore', country: 'Singapore' },
  { city: 'Toronto', country: 'Canada' },
  { city: 'Seoul', country: 'South Korea' }
];

function getIpLocation(ip: string, headers?: Record<string, any>) {
  if (headers) {
    const vercelCity = headers['x-vercel-ip-city'] as string;
    const vercelCountry = headers['x-vercel-ip-country'] as string;
    if (vercelCity || vercelCountry) {
      return {
        city: vercelCity || 'Unknown City',
        country: vercelCountry || 'Unknown Country'
      };
    }
  }

  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = ip.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % LOCATIONS.length;
  return LOCATIONS[index];
}

// User-Agent parser helper
function parseUserAgent(ua: string) {
  let browser = 'Chrome';
  let os = 'macOS';
  let device = 'Desktop';
  let deviceName = 'Desktop PC';

  if (!ua) return { browser, os, device, deviceName };

  if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/edge|edg/i.test(ua)) browser = 'Edge';

  if (/windows/i.test(ua)) {
    os = 'Windows';
    deviceName = 'Windows PC';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
    deviceName = 'Apple Mac';
  } else if (/iphone/i.test(ua)) {
    os = 'iOS';
    device = 'Mobile';
    deviceName = 'Apple iPhone';
  } else if (/ipad/i.test(ua)) {
    os = 'iOS';
    device = 'Tablet';
    deviceName = 'Apple iPad';
  } else if (/android/i.test(ua)) {
    os = 'Android';
    device = 'Mobile';
    deviceName = 'Android Device';
    
    // Attempt to extract the Android model number from parenthesized section
    const match = ua.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      const parts = match[1].split(';');
      const androidPartIndex = parts.findIndex(p => /android/i.test(p));
      if (androidPartIndex !== -1 && androidPartIndex + 1 < parts.length) {
        let model = parts[androidPartIndex + 1].trim();
        if (model.toLowerCase() === 'k' || model.toLowerCase() === 'u') {
          if (androidPartIndex + 2 < parts.length) {
            model = parts[androidPartIndex + 2].trim();
          }
        }
        model = model.replace(/build\/.*/i, '').trim();
        if (model) {
          if (/samsung|sm-|gt-/i.test(model)) {
            deviceName = `Samsung (${model})`;
          } else if (/pixel/i.test(model)) {
            deviceName = `Google Pixel (${model})`;
          } else if (/oneplus/i.test(model)) {
            deviceName = `OnePlus (${model})`;
          } else if (/xiaomi|redmi|mi /i.test(model)) {
            deviceName = `Xiaomi (${model})`;
          } else if (/huawei/i.test(model)) {
            deviceName = `Huawei (${model})`;
          } else if (/oppo/i.test(model)) {
            deviceName = `Oppo (${model})`;
          } else if (/vivo/i.test(model)) {
            deviceName = `Vivo (${model})`;
          } else {
            deviceName = model;
          }
        }
      }
    }
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
    deviceName = 'Linux PC';
  }

  if (/mobile|iphone|android.*mobile/i.test(ua)) {
    device = 'Mobile';
  } else if (/ipad|tablet/i.test(ua)) {
    device = 'Tablet';
  }

  return { browser, os, device, deviceName };
}

// Simple in-memory session registry for security
const SESSIONS: { [token: string]: { userId: string; username: string; expires: number; role: string } } = {};

function createSession(user: AdminUser) {
  const token = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const expires = Date.now() + 24 * 3600 * 1000; // 24 hours
  const role = user.permissions.includes('super_admin') ? 'super_admin' : 'admin';
  SESSIONS[token] = { userId: user.id, username: user.username, expires, role };
  return token;
}

// Middleware: Authenticate Session
function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !SESSIONS[token] || SESSIONS[token].expires < Date.now()) {
    res.status(401).json({ error: 'Unauthorized session' });
    return;
  }
  (req as any).userSession = SESSIONS[token];
  next();
}

// Middleware: Super Admin only
function requireSuperAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const session = (req as any).userSession;
  if (!session || session.role !== 'super_admin') {
    res.status(403).json({ error: 'Access denied: Super Admin only' });
    return;
  }
  next();
}

async function startServer() {
  app.use(express.json());

  // Rate Limiting (Simple memory-based)
  const ipRequests: { [ip: string]: { count: number; resetTime: number } } = {};
  function rateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    
    if (!ipRequests[ip] || ipRequests[ip].resetTime < now) {
      ipRequests[ip] = { count: 1, resetTime: now + 60000 }; // 1 minute window
      return next();
    }

    if (ipRequests[ip].count >= 15) { // Max 15 per minute
      res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
      return;
    }

    ipRequests[ip].count++;
    next();
  }

  // --- API Endpoints ---

  // Check current session validity
  app.get('/api/session', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && SESSIONS[token] && SESSIONS[token].expires > Date.now()) {
      res.json({ valid: true, ...SESSIONS[token] });
    } else {
      res.json({ valid: false });
    }
  });

  // Login Endpoint
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || '';
    
    if (isIpBlocked(ip)) {
      res.status(403).json({ error: 'This IP address is blocked.' });
      return;
    }

    const db = readDB();
    
    // Explicitly enforce / handle hardcoded 'sadmin' and '7845'
    if (username && username.toLowerCase() === 'sadmin' && password === '7845') {
      let existingSadmin = db.admins.find(u => u.username.toLowerCase() === 'sadmin');
      if (!existingSadmin) {
        existingSadmin = {
          id: 'admin-sadmin',
          username: 'sadmin',
          passwordHash: '7845',
          disabled: false,
          permissions: ['super_admin'],
          loginHistory: []
        };
        db.admins.push(existingSadmin);
        writeDB(db);
      } else {
        existingSadmin.passwordHash = '7845';
        existingSadmin.disabled = false;
        if (!existingSadmin.permissions.includes('super_admin')) {
          existingSadmin.permissions.push('super_admin');
        }
        writeDB(db);
      }
    }

    const user = db.admins.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user || user.passwordHash !== password) {
      logAudit('anonymous', `FAILED_LOGIN_ATTEMPT`, ip, `Failed login attempt for username: "${username}"`);
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    if (user.disabled) {
      logAudit(user.username, `DISABLED_LOGIN_ATTEMPT`, ip, 'Disabled admin attempted to log in');
      res.status(403).json({ error: 'Your account is disabled. Contact owner.' });
      return;
    }

    const token = createSession(user);
    const { browser, os, device } = parseUserAgent(ua);
    const location = getIpLocation(ip, req.headers);
    const locationString = `${location.city}, ${location.country}`;

    // Update admin user state & log history
    user.lastActive = new Date().toISOString();
    user.ip = ip;
    user.browser = browser;
    user.os = os;
    user.device = device;
    user.location = locationString;
    user.loginHistory.unshift({
      timestamp: new Date().toISOString(),
      ip,
      browser,
      os,
      device,
      location: locationString
    });

    // Trim login history to keep size reasonable
    if (user.loginHistory.length > 20) {
      user.loginHistory = user.loginHistory.slice(0, 20);
    }

    writeDB(db);

    logAudit(user.username, `ADMIN_LOGIN`, ip, `Log in successful from ${locationString}`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.permissions.includes('super_admin') ? 'super_admin' : 'admin'
      }
    });
  });

  // Register Endpoint for New Admins (NGL handle setup)
  app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || '';

    if (isIpBlocked(ip)) {
      res.status(403).json({ error: 'This IP address is blocked.' });
      return;
    }

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();
    if (!cleanUsername) {
      res.status(400).json({ error: 'A valid username is required.' });
      return;
    }

    // Standard handle validation (alphanumeric and underscores only, length 2 to 30)
    const handleRegex = /^[a-zA-Z0-9_]{2,30}$/;
    if (!handleRegex.test(cleanUsername)) {
      res.status(400).json({ error: 'Username must be between 2 and 30 characters and contain only letters, numbers, and underscores.' });
      return;
    }

    const reserved = ['sadmin', 'admin', 'su', 'api', 'messages', 'analytics', 'auth', 'public', 'session', 'terms', 'privacy'];
    if (reserved.includes(cleanUsername)) {
      res.status(400).json({ error: 'This handle is reserved. Please pick another one.' });
      return;
    }

    const db = readDB();
    if (db.admins.some(a => a.username.toLowerCase() === cleanUsername)) {
      res.status(400).json({ error: 'This handle has already been registered. Try another or log in.' });
      return;
    }

    const newAdmin: AdminUser = {
      id: `admin-${Date.now()}`,
      username: cleanUsername,
      passwordHash: password, // Store cleanly for simpler demo review
      disabled: false,
      permissions: ['moderate', 'analytics'],
      loginHistory: []
    };

    const { browser, os, device } = parseUserAgent(ua);
    const location = getIpLocation(ip, req.headers);
    const locationString = `${location.city}, ${location.country}`;

    newAdmin.lastActive = new Date().toISOString();
    newAdmin.ip = ip;
    newAdmin.browser = browser;
    newAdmin.os = os;
    newAdmin.device = device;
    newAdmin.location = locationString;
    newAdmin.loginHistory.push({
      timestamp: new Date().toISOString(),
      ip,
      browser,
      os,
      device,
      location: locationString
    });

    db.admins.push(newAdmin);
    writeDB(db);

    logAudit(cleanUsername, `ADMIN_REGISTER`, ip, `New account registered from ${locationString}`);

    const token = createSession(newAdmin);

    res.json({
      success: true,
      token,
      user: {
        id: newAdmin.id,
        username: newAdmin.username,
        role: 'admin'
      }
    });
  });

  // Submit Message (Visitor Flow)
  app.post('/api/messages', rateLimit, (req, res) => {
    const { targetUsername, message, category, emoji, theme, nickname, resolution, language, timezone, latitude, longitude } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || '';

    if (isIpBlocked(ip)) {
      res.status(403).json({ error: 'Your IP address has been blocked from making submissions.' });
      return;
    }

    if (!targetUsername || !message || !category || !emoji || !theme) {
      res.status(400).json({ error: 'Missing required confession fields.' });
      return;
    }

    const cleanUsername = targetUsername.trim().replace(/^@/, '').toLowerCase();
    if (!cleanUsername) {
      res.status(400).json({ error: 'A valid target username is required.' });
      return;
    }

    const db = readDB();
    if (message.length > db.settings.defaultCharacterLimit) {
      res.status(400).json({ error: `Message exceeds the character limit of ${db.settings.defaultCharacterLimit}.` });
      return;
    }

    // Profanity Filter and Spam Auto-Flagging
    const containsProfanity = checkProfanity(message);
    const isPublicBoard = cleanUsername === 'public';
    const status = containsProfanity ? 'deleted' : (isPublicBoard ? 'approved' : 'pending'); // Auto-approve if directed to public board
    const approved = isPublicBoard && !containsProfanity;

    const { browser, os, device, deviceName } = parseUserAgent(ua);
    const location = getIpLocation(ip, req.headers);

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      targetUsername: cleanUsername,
      message,
      category: category as Category,
      emoji,
      theme,
      nickname: nickname?.trim() || 'Anonymous',
      approved,
      favorite: false,
      status,
      createdAt: new Date().toISOString(),
      metadata: {
        ip,
        browser,
        os,
        device,
        deviceName: deviceName || device,
        resolution: resolution || 'Unknown',
        language: language || 'en',
        timezone: timezone || 'UTC',
        country: location.country,
        city: location.city,
        timestamp: new Date().toISOString(),
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined
      }
    };

    db.messages.unshift(newMessage);
    writeDB(db);

    if (containsProfanity) {
      logAudit('system', 'AUTO_PROFANITY_BLOCK', ip, `Blocked message to @${cleanUsername} for profanity.`);
      res.json({
        success: true,
        message: 'Submitted successfully',
        autoBlocked: true
      });
    } else {
      res.json({
        success: true,
        message: 'Submitted successfully'
      });
    }
  });

  // Get Global Public Board confessions (Approved only)
  app.get('/api/public/board', (req, res) => {
    const db = readDB();
    const publicMessages = db.messages
      .filter(m => m.status === 'approved')
      .slice(0, 50)
      .map(m => ({
        id: m.id,
        message: m.message,
        category: m.category,
        emoji: m.emoji,
        theme: m.theme,
        nickname: m.nickname,
        targetUsername: m.targetUsername,
        reply: m.reply,
        createdAt: m.createdAt
      }));

    res.json({ messages: publicMessages });
  });

  // Get User profile public confessions (Approved only)
  app.get('/api/public/profile/:username', (req, res) => {
    const username = req.params.username.trim().replace(/^@/, '').toLowerCase();
    const db = readDB();
    const publicMessages = db.messages
      .filter(m => m.targetUsername === username && m.status === 'approved')
      .map(m => ({
        id: m.id,
        message: m.message,
        category: m.category,
        emoji: m.emoji,
        theme: m.theme,
        nickname: m.nickname,
        reply: m.reply,
        createdAt: m.createdAt
      }));

    res.json({ messages: publicMessages });
  });

  // GET Messages (Moderator & Super Admin Panel)
  app.get('/api/messages', authenticate, (req, res) => {
    const session = (req as any).userSession;
    const db = readDB();
    let results = [...db.messages];

    // Standard admins/moderators only see messages directed to them
    if (session.role !== 'super_admin') {
      results = results.filter(m => m.targetUsername.toLowerCase() === session.username.toLowerCase());
    }

    // Search and filter capabilities
    const { keyword, category, status, ip, browser, os, device, location } = req.query;

    if (keyword) {
      const kw = String(keyword).toLowerCase();
      results = results.filter(m => 
        m.message.toLowerCase().includes(kw) || 
        m.nickname?.toLowerCase().includes(kw) ||
        m.targetUsername.toLowerCase().includes(kw)
      );
    }
    if (category) {
      results = results.filter(m => m.category === String(category));
    }
    if (status) {
      results = results.filter(m => m.status === String(status));
    }
    if (ip) {
      results = results.filter(m => m.metadata.ip.includes(String(ip)));
    }
    if (browser) {
      results = results.filter(m => m.metadata.browser === String(browser));
    }
    if (os) {
      results = results.filter(m => m.metadata.os === String(os));
    }
    if (device) {
      results = results.filter(m => m.metadata.device === String(device));
    }
    if (location) {
      const loc = String(location).toLowerCase();
      results = results.filter(m => 
        m.metadata.city.toLowerCase().includes(loc) || 
        m.metadata.country.toLowerCase().includes(loc)
      );
    }

    res.json({ messages: results });
  });

  // Permanently clear/empty the trash folder
  app.delete('/api/messages/trash', authenticate, (req, res) => {
    const session = (req as any).userSession;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const db = readDB();
    const initialCount = db.messages.length;

    if (session.role === 'super_admin') {
      db.messages = db.messages.filter(m => m.status !== 'deleted');
    } else {
      db.messages = db.messages.filter(m => 
        !(m.status === 'deleted' && m.targetUsername.toLowerCase() === session.username.toLowerCase())
      );
    }

    const clearedCount = initialCount - db.messages.length;
    writeDB(db);

    logAudit(session.username, `TRASH_CLEARED`, ip, `Permanently cleared ${clearedCount} trash confessions`);

    res.json({ success: true, clearedCount });
  });

  // POST Message Status Change (Approve, Delete, Favorite)
  app.post('/api/messages/:id/status', authenticate, (req, res) => {
    const { id } = req.params;
    const { status, favorite } = req.body;
    const session = (req as any).userSession;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const db = readDB();
    const messageIndex = db.messages.findIndex(m => m.id === id);

    if (messageIndex === -1) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    const message = db.messages[messageIndex];

    // Standard admins can only moderate their own messages
    if (session.role !== 'super_admin' && message.targetUsername.toLowerCase() !== session.username.toLowerCase()) {
      res.status(403).json({ error: 'Access denied: You can only moderate confessions sent to your handle.' });
      return;
    }

    if (status) {
      if (!['approved', 'pending', 'deleted'].includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }
      message.status = status as 'approved' | 'pending' | 'deleted';
      message.approved = status === 'approved';
      logAudit(session.username, `MESSAGE_STATUS_UPDATE`, ip, `Updated message status for "${id}" to "${status}"`);
    }

    if (favorite !== undefined) {
      message.favorite = !!favorite;
      logAudit(session.username, `MESSAGE_FAVORITE_UPDATE`, ip, `Updated message favorite state for "${id}" to "${message.favorite}"`);
    }

    writeDB(db);
    res.json({ success: true, message: db.messages[messageIndex] });
  });

  // Reply to confession
  app.post('/api/messages/:id/reply', authenticate, (req, res) => {
    const { id } = req.params;
    const { reply } = req.body;
    const session = (req as any).userSession;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const db = readDB();
    const message = db.messages.find(m => m.id === id);

    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    // Standard admins can only reply to their own messages
    if (session.role !== 'super_admin' && message.targetUsername.toLowerCase() !== session.username.toLowerCase()) {
      res.status(403).json({ error: 'Access denied: You can only reply to confessions sent to your handle.' });
      return;
    }

    message.reply = reply || undefined;
    logAudit(session.username, `REPLY_SUBMITTED`, ip, `Replied to confession "${id}"`);
    writeDB(db);

    res.json({ success: true, message });
  });

  // Analytics Endpoint (Dashboard calculations)
  app.get('/api/analytics', authenticate, (req, res) => {
    const session = (req as any).userSession;
    if (session.role !== 'super_admin') {
      res.status(403).json({ error: 'Access denied: Standard admins do not have permission to view web analytics.' });
      return;
    }
    const db = readDB();

    let messagesForAnalytics = [...db.messages];
    if (session.role !== 'super_admin') {
      messagesForAnalytics = messagesForAnalytics.filter(m => m.targetUsername.toLowerCase() === session.username.toLowerCase());
    }

    const total = messagesForAnalytics.length;
    
    // Unread (Pending), Today, Spam (Deleted), Favorites
    const pendingCount = messagesForAnalytics.filter(m => m.status === 'pending').length;
    const approvedCount = messagesForAnalytics.filter(m => m.status === 'approved').length;
    const spamCount = messagesForAnalytics.filter(m => m.status === 'deleted').length;
    const favoriteCount = messagesForAnalytics.filter(m => m.favorite).length;

    // Filter messages created today
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const todayCount = messagesForAnalytics.filter(m => new Date(m.createdAt) >= startOfToday).length;

    // Grouping calculations
    const categories: { [key: string]: number } = {};
    const browsers: { [key: string]: number } = {};
    const operatingSystems: { [key: string]: number } = {};
    const locations: { [key: string]: number } = {};
    const dailySubmissions: { [date: string]: number } = {};
    const hourlySubmissions: { [hour: string]: number } = {};

    messagesForAnalytics.forEach(m => {
      // Categories
      categories[m.category] = (categories[m.category] || 0) + 1;

      // Meta
      const meta = m.metadata;
      if (meta) {
        browsers[meta.browser] = (browsers[meta.browser] || 0) + 1;
        operatingSystems[meta.os] = (operatingSystems[meta.os] || 0) + 1;
        const locStr = `${meta.city}, ${meta.country}`;
        locations[locStr] = (locations[locStr] || 0) + 1;

        // Daily
        const d = new Date(m.createdAt).toLocaleDateString();
        dailySubmissions[d] = (dailySubmissions[d] || 0) + 1;

        // Hourly
        const hour = new Date(m.createdAt).getHours() + ':00';
        hourlySubmissions[hour] = (hourlySubmissions[hour] || 0) + 1;
      }
    });

    res.json({
      summary: {
        totalSubmissions: total,
        unreadCount: pendingCount,
        todayCount,
        spamCount,
        favoriteCount,
        approvedCount
      },
      categories,
      browsers,
      operatingSystems,
      locations,
      dailySubmissions,
      hourlySubmissions,
      recentActivity: db.auditLogs.slice(0, 10)
    });
  });

  // --- SUPER ADMIN SECTION (`/su` operations) ---

  // Update admin exact coordinates (Moderator & Super Admin Panel)
  app.post('/api/admin/coordinates', authenticate, (req, res) => {
    const { latitude, longitude } = req.body;
    const session = (req as any).userSession;
    const db = readDB();
    const user = db.admins.find(u => u.username.toLowerCase() === session.username.toLowerCase());
    if (user) {
      user.latitude = latitude ? Number(latitude) : undefined;
      user.longitude = longitude ? Number(longitude) : undefined;
      writeDB(db);
    }
    res.json({ success: true });
  });

  // Get admin accounts (Super Admin only)
  app.get('/api/su/admins', authenticate, requireSuperAdmin, (req, res) => {
    const db = readDB();
    const adminList = db.admins.map(adm => ({
      id: adm.id,
      username: adm.username,
      disabled: adm.disabled,
      permissions: adm.permissions,
      lastActive: adm.lastActive,
      ip: adm.ip,
      browser: adm.browser,
      location: adm.location,
      os: adm.os,
      device: adm.device,
      loginHistory: adm.loginHistory,
      latitude: adm.latitude,
      longitude: adm.longitude
    }));
    res.json({ admins: adminList });
  });

  // Impersonate moderator/admin (Super Admin only - access panel without auth)
  app.post('/api/su/impersonate/:id', authenticate, requireSuperAdmin, (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const admin = db.admins.find(a => a.id === id);
    if (!admin) {
      res.status(444).json({ error: 'Moderator not found' });
      return;
    }

    if (admin.disabled) {
      res.status(400).json({ error: 'Cannot impersonate a disabled account' });
      return;
    }

    const token = createSession(admin);
    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.permissions.includes('super_admin') ? 'super_admin' : 'admin'
      }
    });
  });

  // Create admin account
  app.post('/api/su/admins', authenticate, requireSuperAdmin, (req, res) => {
    const { username, password, permissions } = req.body;
    const session = (req as any).userSession;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const db = readDB();
    if (db.admins.some(a => a.username.toLowerCase() === username.toLowerCase())) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    const newAdmin: AdminUser = {
      id: `admin-${Date.now()}`,
      username: username.trim(),
      passwordHash: password, // Store cleanly for simpler demo review, as allowed in prototypes
      disabled: false,
      permissions: permissions || ['moderate'],
      loginHistory: []
    };

    db.admins.push(newAdmin);
    writeDB(db);

    logAudit(session.username, 'CREATE_ADMIN', ip, `Created new admin user: "${username}"`);
    res.json({ success: true, admin: { id: newAdmin.id, username: newAdmin.username } });
  });

  // Update admin accounts (Edit permissions, disable/enable, reset password)
  app.put('/api/su/admins/:id', authenticate, requireSuperAdmin, (req, res) => {
    const { id } = req.params;
    const { disabled, permissions, password } = req.body;
    const session = (req as any).userSession;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const db = readDB();
    const admin = db.admins.find(a => a.id === id);

    if (!admin) {
      res.status(404).json({ error: 'Admin account not found' });
      return;
    }

    if (admin.permissions.includes('super_admin') && session.userId !== admin.id) {
      res.status(403).json({ error: 'Cannot modify another Super Admin account' });
      return;
    }

    if (disabled !== undefined) {
      admin.disabled = !!disabled;
      logAudit(session.username, admin.disabled ? 'DISABLE_ADMIN' : 'ENABLE_ADMIN', ip, `Admin "${admin.username}" disabled state set to ${admin.disabled}`);
    }

    if (permissions !== undefined) {
      admin.permissions = permissions;
      logAudit(session.username, 'UPDATE_ADMIN_PERMISSIONS', ip, `Admin "${admin.username}" permissions updated to [${permissions.join(', ')}]`);
    }

    if (password !== undefined && password.trim() !== '') {
      admin.passwordHash = password;
      logAudit(session.username, 'RESET_ADMIN_PASSWORD', ip, `Admin "${admin.username}" password has been reset`);
    }

    writeDB(db);
    res.json({ success: true, message: 'Admin account updated successfully' });
  });

  // Delete Admin account
  app.delete('/api/su/admins/:id', authenticate, requireSuperAdmin, (req, res) => {
    const { id } = req.params;
    const session = (req as any).userSession;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const db = readDB();
    const adminIndex = db.admins.findIndex(a => a.id === id);

    if (adminIndex === -1) {
      res.status(404).json({ error: 'Admin account not found' });
      return;
    }

    const admin = db.admins[adminIndex];
    if (admin.permissions.includes('super_admin')) {
      res.status(403).json({ error: 'Super Admin accounts cannot be deleted' });
      return;
    }

    db.admins.splice(adminIndex, 1);
    writeDB(db);

    logAudit(session.username, 'DELETE_ADMIN', ip, `Deleted admin account "${admin.username}"`);
    res.json({ success: true });
  });

  // Get and Update settings
  app.get('/api/su/settings', authenticate, requireSuperAdmin, (req, res) => {
    const db = readDB();
    res.json({ settings: db.settings });
  });

  app.post('/api/su/settings', authenticate, requireSuperAdmin, (req, res) => {
    const { blockedIPs, profanityFilterEnabled, customBlockedWords, defaultCharacterLimit } = req.body;
    const session = (req as any).userSession;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const db = readDB();

    if (blockedIPs !== undefined) db.settings.blockedIPs = blockedIPs;
    if (profanityFilterEnabled !== undefined) db.settings.profanityFilterEnabled = !!profanityFilterEnabled;
    if (customBlockedWords !== undefined) db.settings.customBlockedWords = customBlockedWords;
    if (defaultCharacterLimit !== undefined) db.settings.defaultCharacterLimit = Number(defaultCharacterLimit);

    writeDB(db);
    logAudit(session.username, 'UPDATE_WEBSITE_SETTINGS', ip, 'System configuration settings updated');
    res.json({ success: true, settings: db.settings });
  });

  // Get system server stats (realistic mock dashboard details)
  app.get('/api/su/server-stats', authenticate, requireSuperAdmin, (req, res) => {
    const db = readDB();
    const stats = {
      adminCount: db.admins.length,
      websiteTraffic: Math.floor(12400 + Math.random() * 2000), // realistic traffic
      totalUsers: db.admins.length + new Set(db.messages.map(m => m.targetUsername)).size,
      totalSubmissions: db.messages.length,
      storageUsage: '1.24 MB / 100 MB',
      uptime: `${Math.floor(Date.now() / 86400000) % 30 + 1}d 14h 22m`,
      cpuUsage: `${Math.floor(5 + Math.random() * 12)}%`,
      memoryUsage: `${Math.floor(128 + Math.random() * 32)} MB / 512 MB`,
      logs: db.auditLogs.slice(0, 30) // Detailed audit log history
    };
    res.json(stats);
  });

  // Vite development routing & static routing
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Confessly is listening on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();

export default app;
