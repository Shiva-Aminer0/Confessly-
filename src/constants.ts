/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category } from './types.js';

export const CATEGORIES: Category[] = [
  'Confession',
  'Roast',
  'Question',
  'Suggestion',
  'Compliment',
  'Random',
  'Crush'
];

export const CATEGORY_EMOJIS: { [key in Category]: string } = {
  Confession: '🤫',
  Roast: '🔥',
  Question: '🤔',
  Suggestion: '💡',
  Compliment: '💖',
  Random: '🎲',
  Crush: '💌'
};

export interface CardTheme {
  id: string;
  name: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
}

export const CARD_THEMES: CardTheme[] = [
  {
    id: 'sunset',
    name: 'Sunset Glow',
    bgClass: 'bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500',
    textClass: 'text-white',
    borderClass: 'border-white/20',
    badgeClass: 'bg-white/20 text-white'
  },
  {
    id: 'neon',
    name: 'Neon Night',
    bgClass: 'bg-slate-950 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    textClass: 'text-purple-100',
    borderClass: 'border-purple-500/20',
    badgeClass: 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    bgClass: 'bg-gradient-to-tr from-blue-600 to-emerald-500',
    textClass: 'text-white',
    borderClass: 'border-white/20',
    badgeClass: 'bg-white/20 text-white'
  },
  {
    id: 'fire',
    name: 'Hellfire',
    bgClass: 'bg-gradient-to-tr from-stone-900 via-orange-950 to-red-600',
    textClass: 'text-white border border-red-500/30',
    borderClass: 'border-red-500/20',
    badgeClass: 'bg-red-500/20 text-red-200 border border-red-500/30'
  },
  {
    id: 'cosmic',
    name: 'Cosmic Star',
    bgClass: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950',
    textClass: 'text-slate-100',
    borderClass: 'border-indigo-500/20',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
  },
  {
    id: 'matcha',
    name: 'Matcha Zen',
    bgClass: 'bg-gradient-to-tr from-emerald-100 via-lime-100 to-green-100',
    textClass: 'text-emerald-950',
    borderClass: 'border-emerald-900/10',
    badgeClass: 'bg-emerald-900/10 text-emerald-900'
  },
  {
    id: 'bubblegum',
    name: 'Bubblegum',
    bgClass: 'bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300',
    textClass: 'text-slate-900',
    borderClass: 'border-white/30',
    badgeClass: 'bg-white/30 text-slate-850'
  }
];
