/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category = 'Confession' | 'Roast' | 'Question' | 'Suggestion' | 'Compliment' | 'Random' | 'Crush';

export interface MessageMetadata {
  ip: string;
  browser: string;
  os: string;
  device: string;
  resolution: string;
  language: string;
  timezone: string;
  country: string;
  city: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  deviceName?: string;
}

export interface Message {
  id: string;
  targetUsername: string; // The username the message is for (e.g. @username)
  message: string;
  category: Category;
  emoji: string;
  theme: string; // Theme name, e.g. 'sunset', 'neon', 'ocean', etc.
  nickname?: string;
  approved: boolean;
  favorite: boolean;
  status: 'pending' | 'approved' | 'deleted';
  reply?: string;
  metadata: MessageMetadata;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  disabled: boolean;
  permissions: string[]; // e.g. ['moderate', 'analytics']
  lastActive?: string;
  ip?: string;
  browser?: string;
  location?: string;
  os?: string;
  device?: string;
  latitude?: number;
  longitude?: number;
  loginHistory: {
    timestamp: string;
    ip: string;
    browser: string;
    os: string;
    device: string;
    location: string;
  }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  ip: string;
  details: string;
}

export interface SystemSettings {
  blockedIPs: string[];
  profanityFilterEnabled: boolean;
  customBlockedWords: string[];
  defaultCharacterLimit: number;
}

export interface DatabaseSchema {
  admins: AdminUser[];
  messages: Message[];
  settings: SystemSettings;
  auditLogs: AuditLog[];
}
