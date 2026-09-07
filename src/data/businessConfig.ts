export type BusinessColorKey = 'red' | 'green' | 'yellow' | 'blue' | 'orange' | 'purple';

export interface BusinessColorConfig {
  key: BusinessColorKey;
  label: string;
  colorHex: string;
  borderClass: string;
  glowColor: string;
  badgeBg: string;
  dotBg: string;
  token: string;
  defaultName: string;
  avatar: string;
}

export const BUSINESS_COLORS: BusinessColorConfig[] = [
  {
    key: 'red',
    label: 'Red',
    colorHex: '#ef4444',
    borderClass: 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    glowColor: '#ef4444',
    badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
    dotBg: 'bg-red-500',
    token: '🎩',
    defaultName: 'Red Tycoon',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  },
  {
    key: 'green',
    label: 'Green',
    colorHex: '#22c55e',
    borderClass: 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]',
    glowColor: '#22c55e',
    badgeBg: 'bg-green-500/20 text-green-300 border-green-500/40',
    dotBg: 'bg-green-500',
    token: '🚗',
    defaultName: 'Green Tycoon',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    key: 'yellow',
    label: 'Yellow',
    colorHex: '#eab308',
    borderClass: 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]',
    glowColor: '#eab308',
    badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    dotBg: 'bg-yellow-500',
    token: '🚀',
    defaultName: 'Yellow Tycoon',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  },
  {
    key: 'blue',
    label: 'Blue',
    colorHex: '#3b82f6',
    borderClass: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]',
    glowColor: '#3b82f6',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    dotBg: 'bg-blue-500',
    token: '🚢',
    defaultName: 'Blue Tycoon',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  {
    key: 'orange',
    label: 'Orange',
    colorHex: '#f97316',
    borderClass: 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]',
    glowColor: '#f97316',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    dotBg: 'bg-orange-500',
    token: '⚡',
    defaultName: 'Orange Tycoon',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    key: 'purple',
    label: 'Purple',
    colorHex: '#a855f7',
    borderClass: 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]',
    glowColor: '#a855f7',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    dotBg: 'bg-purple-500',
    token: '👑',
    defaultName: 'Purple Tycoon',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
];
