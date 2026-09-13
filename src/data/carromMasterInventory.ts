// ============================================================================
// FILE: carromMasterInventory.ts
// Master Inventory Data for Carrom Strikers, Powers, Pucks, Trails & Pockets
// ============================================================================

export type CarromRarity = 'STANDARD' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
export type CarromItemCategory = 'strikers' | 'powers' | 'pucks' | 'trails' | 'pockets';

export interface CarromItemPrice {
  type: 'coins' | 'gems';
  amount: number;
}

export interface StrikerStats {
  force: number;
  aim: number;
  time: number;
}

export interface CarromStrikerItem {
  id: string;
  name: string;
  rarity: CarromRarity;
  source: string;
  price: CarromItemPrice;
  stats: StrikerStats;
  color?: string;
  rimColor?: string;
  innerColor?: string;
  glowColor?: string;
}

export interface CarromPowerItem {
  id: string;
  name: string;
  isUnlocked: boolean;
  force: number;
  aim: number;
  time: number;
  pointsRequired: number;
  price?: CarromItemPrice;
  source?: string;
  description?: string;
}

export interface CarromPuckItem {
  id: string;
  name: string;
  rarity: CarromRarity;
  source: string;
  price: CarromItemPrice;
  whiteColor?: string;
  blackColor?: string;
  queenColor?: string;
  rimColor?: string;
  accentColor?: string;
}

export interface CarromTrailItem {
  id: string;
  name: string;
  rarity: CarromRarity;
  source: string;
  price: CarromItemPrice;
  dashPattern?: number[];
  color?: string;
  glowColor?: string;
  gradient?: string[];
}

export interface CarromPocketItem {
  id: string;
  name: string;
  rarity: CarromRarity;
  source: string;
  price: CarromItemPrice;
  glowColor?: string;
  ringColor?: string;
  pulseEffect?: boolean;
}

export interface CarromMasterInventory {
  strikers: CarromStrikerItem[];
  powers: CarromPowerItem[];
  pucks: CarromPuckItem[];
  trails: CarromTrailItem[];
  pockets: CarromPocketItem[];
}

export interface CarromEquippedLoadout {
  striker: string;
  power: string;
  puck: string;
  trail: string;
  pocket: string;
}

export const DEFAULT_CARROM_LOADOUT: CarromEquippedLoadout = {
  striker: 'str_blaze',
  power: 'pwr_blaze',
  puck: 'puck_black_std',
  trail: 'trl_none',
  pocket: 'pkt_none',
};

export const CARROM_SHOP_DATA: CarromMasterInventory = {
  // --------------------------------------------------------------------------
  // 1. STRIKERS CATALOG (Mythic, Legendary, Epic, Rare, Standard)
  // --------------------------------------------------------------------------
  strikers: [
    // Standard / Default
    {
      id: 'str_blaze',
      name: 'Blaze',
      rarity: 'STANDARD',
      source: 'Default',
      price: { type: 'coins', amount: 0 },
      stats: { force: 3, aim: 2, time: 2 },
      color: '#f8fafc',
      rimColor: '#1e3a8a',
      innerColor: '#3b82f6',
      glowColor: 'rgba(59, 130, 246, 0.4)',
    },
    {
      id: 'str_zen',
      name: 'Zen',
      rarity: 'STANDARD',
      source: 'Delhi Lounge +',
      price: { type: 'coins', amount: 1000 },
      stats: { force: 2, aim: 3, time: 2 },
      color: '#ecfdf5',
      rimColor: '#065f46',
      innerColor: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.4)',
    },
    {
      id: 'str_vega',
      name: 'Vega',
      rarity: 'STANDARD',
      source: 'London Park +',
      price: { type: 'coins', amount: 1200 },
      stats: { force: 3, aim: 2, time: 3 },
      color: '#f5f3ff',
      rimColor: '#5b21b6',
      innerColor: '#8b5cf6',
      glowColor: 'rgba(139, 92, 246, 0.4)',
    },
    {
      id: 'str_taj',
      name: 'Taj',
      rarity: 'STANDARD',
      source: 'Delhi Lounge +',
      price: { type: 'coins', amount: 1500 },
      stats: { force: 3, aim: 3, time: 2 },
      color: '#fefce8',
      rimColor: '#854d0e',
      innerColor: '#eab308',
      glowColor: 'rgba(234, 179, 8, 0.4)',
    },
    {
      id: 'str_chakra',
      name: 'Chakra',
      rarity: 'STANDARD',
      source: 'Delhi Lounge +',
      price: { type: 'coins', amount: 1500 },
      stats: { force: 2, aim: 4, time: 2 },
      color: '#f0f9ff',
      rimColor: '#0369a1',
      innerColor: '#0ea5e9',
      glowColor: 'rgba(14, 165, 233, 0.4)',
    },
    {
      id: 'str_starlight',
      name: 'Starlight',
      rarity: 'STANDARD',
      source: 'Cairo Gallery +',
      price: { type: 'coins', amount: 1800 },
      stats: { force: 4, aim: 2, time: 2 },
      color: '#fdf4ff',
      rimColor: '#86198f',
      innerColor: '#d946ef',
      glowColor: 'rgba(217, 70, 239, 0.4)',
    },
    {
      id: 'str_star',
      name: 'S.T.A.R.',
      rarity: 'STANDARD',
      source: 'London Park +',
      price: { type: 'coins', amount: 2000 },
      stats: { force: 3, aim: 3, time: 3 },
      color: '#f8fafc',
      rimColor: '#334155',
      innerColor: '#64748b',
      glowColor: 'rgba(100, 116, 139, 0.4)',
    },
    {
      id: 'str_hound',
      name: 'Hound',
      rarity: 'STANDARD',
      source: 'London Park +',
      price: { type: 'coins', amount: 2000 },
      stats: { force: 4, aim: 2, time: 3 },
      color: '#fff1f2',
      rimColor: '#9f1239',
      innerColor: '#f43f5e',
      glowColor: 'rgba(244, 63, 94, 0.4)',
    },

    // Mythic
    {
      id: 'str_astro',
      name: 'Astro',
      rarity: 'MYTHIC',
      source: 'Events +',
      price: { type: 'gems', amount: 300 },
      stats: { force: 9, aim: 8, time: 7 },
      color: '#fdf2f8',
      rimColor: '#831843',
      innerColor: '#ec4899',
      glowColor: 'rgba(236, 72, 153, 0.65)',
    },
    {
      id: 'str_pulse',
      name: 'Pulse',
      rarity: 'MYTHIC',
      source: 'Events +',
      price: { type: 'gems', amount: 300 },
      stats: { force: 8, aim: 9, time: 7 },
      color: '#ecfeff',
      rimColor: '#164e63',
      innerColor: '#06b6d4',
      glowColor: 'rgba(6, 182, 212, 0.65)',
    },

    // Legendary
    {
      id: 'str_trace',
      name: 'Trace',
      rarity: 'LEGENDARY',
      source: 'Flashback +',
      price: { type: 'gems', amount: 150 },
      stats: { force: 7, aim: 7, time: 6 },
      color: '#fffbeb',
      rimColor: '#92400e',
      innerColor: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.55)',
    },
    {
      id: 'str_aman',
      name: 'Aman',
      rarity: 'LEGENDARY',
      source: 'Flashback +',
      price: { type: 'gems', amount: 150 },
      stats: { force: 8, aim: 6, time: 6 },
      color: '#fef3c7',
      rimColor: '#78350f',
      innerColor: '#d97706',
      glowColor: 'rgba(217, 119, 6, 0.55)',
    },
    {
      id: 'str_toran',
      name: 'Toran',
      rarity: 'LEGENDARY',
      source: 'Flashback +',
      price: { type: 'gems', amount: 150 },
      stats: { force: 6, aim: 8, time: 6 },
      color: '#ecfdf5',
      rimColor: '#064e3b',
      innerColor: '#059669',
      glowColor: 'rgba(5, 150, 105, 0.55)',
    },
    {
      id: 'str_digitriker',
      name: 'Digitriker',
      rarity: 'LEGENDARY',
      source: 'Flashback +',
      price: { type: 'gems', amount: 160 },
      stats: { force: 7, aim: 7, time: 7 },
      color: '#f0fdfa',
      rimColor: '#134e4a',
      innerColor: '#14b8a6',
      glowColor: 'rgba(20, 184, 166, 0.55)',
    },
    {
      id: 'str_abeer',
      name: 'Abeer',
      rarity: 'LEGENDARY',
      source: 'Flashback +',
      price: { type: 'gems', amount: 160 },
      stats: { force: 8, aim: 7, time: 5 },
      color: '#fdf4ff',
      rimColor: '#701a75',
      innerColor: '#a855f7',
      glowColor: 'rgba(168, 85, 247, 0.55)',
    },
    {
      id: 'str_superstar',
      name: 'Superstar',
      rarity: 'LEGENDARY',
      source: 'Flashback +',
      price: { type: 'gems', amount: 180 },
      stats: { force: 9, aim: 6, time: 6 },
      color: '#fffbeb',
      rimColor: '#b45309',
      innerColor: '#fbbf24',
      glowColor: 'rgba(251, 191, 36, 0.6)',
    },
    {
      id: 'str_rr',
      name: 'RR',
      rarity: 'LEGENDARY',
      source: 'Flashback +',
      price: { type: 'gems', amount: 170 },
      stats: { force: 7, aim: 8, time: 6 },
      color: '#fee2e2',
      rimColor: '#7f1d1d',
      innerColor: '#dc2626',
      glowColor: 'rgba(220, 38, 38, 0.55)',
    },
    {
      id: 'str_gyaani',
      name: 'Gyaani',
      rarity: 'LEGENDARY',
      source: 'Collectors +',
      price: { type: 'gems', amount: 175 },
      stats: { force: 8, aim: 8, time: 5 },
      color: '#eff6ff',
      rimColor: '#1e3a8a',
      innerColor: '#2563eb',
      glowColor: 'rgba(37, 99, 235, 0.55)',
    },
    {
      id: 'str_aqua',
      name: 'Aqua',
      rarity: 'LEGENDARY',
      source: 'Flashback +',
      price: { type: 'gems', amount: 150 },
      stats: { force: 6, aim: 9, time: 6 },
      color: '#ecfeff',
      rimColor: '#155e75',
      innerColor: '#0891b2',
      glowColor: 'rgba(8, 145, 178, 0.55)',
    },
    {
      id: 'str_drishti',
      name: 'Drishti',
      rarity: 'LEGENDARY',
      source: 'Login Calendar +',
      price: { type: 'gems', amount: 160 },
      stats: { force: 8, aim: 7, time: 7 },
      color: '#faf5ff',
      rimColor: '#581c87',
      innerColor: '#9333ea',
      glowColor: 'rgba(147, 51, 234, 0.55)',
    },
    {
      id: 'str_bio',
      name: 'Bio',
      rarity: 'LEGENDARY',
      source: 'Offers +',
      price: { type: 'gems', amount: 180 },
      stats: { force: 9, aim: 7, time: 6 },
      color: '#f7fee7',
      rimColor: '#365314',
      innerColor: '#65a30d',
      glowColor: 'rgba(101, 163, 13, 0.55)',
    },
    {
      id: 'str_bushi',
      name: 'Bushi',
      rarity: 'LEGENDARY',
      source: 'Collectors +',
      price: { type: 'gems', amount: 180 },
      stats: { force: 7, aim: 9, time: 6 },
      color: '#fef2f2',
      rimColor: '#881337',
      innerColor: '#e11d48',
      glowColor: 'rgba(225, 29, 72, 0.55)',
    },
    {
      id: 'str_cyclops',
      name: 'Cyclops',
      rarity: 'LEGENDARY',
      source: 'Grand Master Chest',
      price: { type: 'gems', amount: 200 },
      stats: { force: 9, aim: 8, time: 7 },
      color: '#f8fafc',
      rimColor: '#0f172a',
      innerColor: '#ef4444',
      glowColor: 'rgba(239, 68, 68, 0.6)',
    },
    {
      id: 'str_xolotl',
      name: 'Xolotl',
      rarity: 'LEGENDARY',
      source: 'Grand Master Chest',
      price: { type: 'gems', amount: 200 },
      stats: { force: 8, aim: 9, time: 7 },
      color: '#fff7ed',
      rimColor: '#7c2d12',
      innerColor: '#ea580c',
      glowColor: 'rgba(234, 88, 12, 0.6)',
    },
    {
      id: 'str_devi',
      name: 'Devi',
      rarity: 'LEGENDARY',
      source: 'Flashback +',
      price: { type: 'gems', amount: 190 },
      stats: { force: 9, aim: 9, time: 6 },
      color: '#fff1f2',
      rimColor: '#831843',
      innerColor: '#f43f5e',
      glowColor: 'rgba(244, 63, 94, 0.6)',
    },
    {
      id: 'str_neon',
      name: 'Neon',
      rarity: 'LEGENDARY',
      source: 'Grand Master Chest',
      price: { type: 'gems', amount: 200 },
      stats: { force: 9, aim: 8, time: 8 },
      color: '#f0fdfa',
      rimColor: '#042f2e',
      innerColor: '#00ffff',
      glowColor: 'rgba(0, 255, 255, 0.7)',
    },
    {
      id: 'str_dew',
      name: 'Dew',
      rarity: 'LEGENDARY',
      source: 'Premium +',
      price: { type: 'gems', amount: 170 },
      stats: { force: 7, aim: 8, time: 7 },
      color: '#f0fdf4',
      rimColor: '#14532d',
      innerColor: '#22c55e',
      glowColor: 'rgba(34, 197, 94, 0.55)',
    },
    {
      id: 'str_simhakt',
      name: 'Simhakt',
      rarity: 'LEGENDARY',
      source: 'Collectors +',
      price: { type: 'gems', amount: 180 },
      stats: { force: 8, aim: 8, time: 7 },
      color: '#fffbeb',
      rimColor: '#78350f',
      innerColor: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.6)',
    },
    {
      id: 'str_sweep',
      name: 'Sweep',
      rarity: 'LEGENDARY',
      source: 'Grand Master Chest',
      price: { type: 'gems', amount: 190 },
      stats: { force: 8, aim: 9, time: 6 },
      color: '#eff6ff',
      rimColor: '#172554',
      innerColor: '#3b82f6',
      glowColor: 'rgba(59, 130, 246, 0.6)',
    },
    {
      id: 'str_bhai',
      name: 'Bhai',
      rarity: 'LEGENDARY',
      source: 'Grand Master Chest',
      price: { type: 'gems', amount: 190 },
      stats: { force: 9, aim: 7, time: 7 },
      color: '#fafaf9',
      rimColor: '#292524',
      innerColor: '#d97706',
      glowColor: 'rgba(217, 119, 6, 0.6)',
    },
    {
      id: 'str_deathstrike',
      name: 'Deathstrike',
      rarity: 'LEGENDARY',
      source: 'Grand Master Chest',
      price: { type: 'gems', amount: 210 },
      stats: { force: 10, aim: 8, time: 6 },
      color: '#0f172a',
      rimColor: '#991b1b',
      innerColor: '#ef4444',
      glowColor: 'rgba(239, 68, 68, 0.7)',
    },

    // Epic
    {
      id: 'str_surge',
      name: 'Surge',
      rarity: 'EPIC',
      source: 'Flashback +',
      price: { type: 'coins', amount: 8000 },
      stats: { force: 6, aim: 5, time: 5 },
      color: '#f0fdfa',
      rimColor: '#115e59',
      innerColor: '#0d9488',
      glowColor: 'rgba(13, 148, 136, 0.5)',
    },
    {
      id: 'str_spade',
      name: 'Spade',
      rarity: 'EPIC',
      source: 'Carrom Trials +',
      price: { type: 'coins', amount: 8000 },
      stats: { force: 5, aim: 6, time: 5 },
      color: '#f8fafc',
      rimColor: '#020617',
      innerColor: '#334155',
      glowColor: 'rgba(51, 65, 85, 0.5)',
    },
    {
      id: 'str_sniper',
      name: 'Sniper',
      rarity: 'EPIC',
      source: 'Paris Stage +',
      price: { type: 'coins', amount: 9000 },
      stats: { force: 4, aim: 8, time: 4 },
      color: '#f0fdf4',
      rimColor: '#166534',
      innerColor: '#15803d',
      glowColor: 'rgba(21, 128, 61, 0.5)',
    },
    {
      id: 'str_trifecta',
      name: 'Trifecta',
      rarity: 'EPIC',
      source: 'Flashback +',
      price: { type: 'coins', amount: 8500 },
      stats: { force: 6, aim: 6, time: 5 },
      color: '#fff7ed',
      rimColor: '#9a3412',
      innerColor: '#ea580c',
      glowColor: 'rgba(234, 88, 12, 0.5)',
    },
    {
      id: 'str_shobha',
      name: 'Shobha',
      rarity: 'EPIC',
      source: 'Flashback +',
      price: { type: 'coins', amount: 8500 },
      stats: { force: 5, aim: 7, time: 5 },
      color: '#fdf2f8',
      rimColor: '#9d174d',
      innerColor: '#db2777',
      glowColor: 'rgba(219, 39, 119, 0.5)',
    },
    {
      id: 'str_treant',
      name: 'Treant',
      rarity: 'EPIC',
      source: 'Delhi Lounge +',
      price: { type: 'coins', amount: 7500 },
      stats: { force: 7, aim: 4, time: 5 },
      color: '#fefce8',
      rimColor: '#3f6212',
      innerColor: '#65a30d',
      glowColor: 'rgba(101, 163, 13, 0.5)',
    },
    {
      id: 'str_ninja',
      name: 'Ninja',
      rarity: 'EPIC',
      source: 'Frenzy +',
      price: { type: 'coins', amount: 9500 },
      stats: { force: 6, aim: 8, time: 5 },
      color: '#18181b',
      rimColor: '#b91c1c',
      innerColor: '#ef4444',
      glowColor: 'rgba(239, 68, 68, 0.5)',
    },
    {
      id: 'str_lightning',
      name: 'Lightning',
      rarity: 'EPIC',
      source: 'Flashback +',
      price: { type: 'coins', amount: 9000 },
      stats: { force: 8, aim: 5, time: 5 },
      color: '#fef9c3',
      rimColor: '#854d0e',
      innerColor: '#facc15',
      glowColor: 'rgba(250, 204, 21, 0.5)',
    },
    {
      id: 'str_cosmos',
      name: 'Cosmos',
      rarity: 'EPIC',
      source: 'Frenzy +',
      price: { type: 'coins', amount: 9000 },
      stats: { force: 7, aim: 6, time: 6 },
      color: '#312e81',
      rimColor: '#a855f7',
      innerColor: '#c084fc',
      glowColor: 'rgba(192, 132, 252, 0.5)',
    },
    {
      id: 'str_shaman',
      name: 'Shaman',
      rarity: 'EPIC',
      source: 'Dubai Skybar +',
      price: { type: 'coins', amount: 10000 },
      stats: { force: 6, aim: 7, time: 6 },
      color: '#fef3c7',
      rimColor: '#713f12',
      innerColor: '#b45309',
      glowColor: 'rgba(180, 83, 9, 0.5)',
    },
    {
      id: 'str_umbrella',
      name: 'Umbrella',
      rarity: 'EPIC',
      source: 'Dubai Skybar +',
      price: { type: 'coins', amount: 10000 },
      stats: { force: 5, aim: 8, time: 5 },
      color: '#f0f9ff',
      rimColor: '#075985',
      innerColor: '#0284c7',
      glowColor: 'rgba(2, 132, 199, 0.5)',
    },
    {
      id: 'str_dragonstar',
      name: 'Dragon Star',
      rarity: 'EPIC',
      source: 'Mumbai Arena +',
      price: { type: 'coins', amount: 11000 },
      stats: { force: 8, aim: 6, time: 5 },
      color: '#450a0a',
      rimColor: '#f97316',
      innerColor: '#ef4444',
      glowColor: 'rgba(249, 115, 22, 0.5)',
    },
  ],

  // --------------------------------------------------------------------------
  // 2. POWERS UPGRADES
  // --------------------------------------------------------------------------
  powers: [
    {
      id: 'pwr_blaze',
      name: 'Blaze Power',
      isUnlocked: true,
      force: 8,
      aim: 6,
      time: 5,
      pointsRequired: 0,
      price: { type: 'coins', amount: 0 },
      source: 'Default',
      description: 'Standard carrom kinetic force with balanced trajectory precision.',
    },
    {
      id: 'pwr_spine',
      name: 'Spine',
      isUnlocked: false,
      force: 2,
      aim: 3,
      time: 2,
      pointsRequired: 20,
      price: { type: 'coins', amount: 2500 },
      source: 'Unlock System',
      description: 'Stabilizes striker recoil on off-center edge hits.',
    },
    {
      id: 'pwr_venom',
      name: 'Venom',
      isUnlocked: false,
      force: 3,
      aim: 2,
      time: 3,
      pointsRequired: 20,
      price: { type: 'coins', amount: 2500 },
      source: 'Unlock System',
      description: 'Adds piercing momentum through dense puck clusters.',
    },
    {
      id: 'pwr_particle',
      name: 'Particle',
      isUnlocked: false,
      force: 4,
      aim: 4,
      time: 3,
      pointsRequired: 25,
      price: { type: 'gems', amount: 50 },
      source: 'Unlock System',
      description: 'High-frequency vibration accelerates puck pocket sinkage.',
    },
    {
      id: 'pwr_radiance',
      name: 'Radiance',
      isUnlocked: false,
      force: 5,
      aim: 3,
      time: 4,
      pointsRequired: 25,
      price: { type: 'gems', amount: 50 },
      source: 'Unlock System',
      description: 'Bright optical trajectory guidance for tricky double-bank shots.',
    },
    {
      id: 'pwr_reptile',
      name: 'Reptile',
      isUnlocked: false,
      force: 4,
      aim: 5,
      time: 3,
      pointsRequired: 30,
      price: { type: 'coins', amount: 5000 },
      source: 'Skill Tree',
      description: 'Flexible spin curve response around obstruction pieces.',
    },
    {
      id: 'pwr_roulette',
      name: 'Roulette',
      isUnlocked: false,
      force: 6,
      aim: 4,
      time: 3,
      pointsRequired: 30,
      price: { type: 'coins', amount: 5000 },
      source: 'Skill Tree',
      description: 'Generates extra bounce velocity off wooden frame cushions.',
    },
    {
      id: 'pwr_wave',
      name: 'Wave',
      isUnlocked: false,
      force: 5,
      aim: 5,
      time: 4,
      pointsRequired: 35,
      price: { type: 'gems', amount: 75 },
      source: 'Grand League',
      description: 'Fluid wave dissipation prevents accidental striker pocket fouls.',
    },
    {
      id: 'pwr_petal',
      name: 'Petal',
      isUnlocked: false,
      force: 4,
      aim: 6,
      time: 4,
      pointsRequired: 35,
      price: { type: 'gems', amount: 75 },
      source: 'Grand League',
      description: 'Feather-soft fine adjustment for delicate cut shots.',
    },
    {
      id: 'pwr_gaia',
      name: 'Gaia',
      isUnlocked: false,
      force: 6,
      aim: 6,
      time: 4,
      pointsRequired: 40,
      price: { type: 'gems', amount: 100 },
      source: 'Master Realm',
      description: 'Grounded center gravity gives supreme center puck control.',
    },
    {
      id: 'pwr_crystal',
      name: 'Crystal',
      isUnlocked: false,
      force: 5,
      aim: 7,
      time: 5,
      pointsRequired: 40,
      price: { type: 'gems', amount: 100 },
      source: 'Master Realm',
      description: 'Crystalline trajectory line with micro-angle visual indicators.',
    },
    {
      id: 'pwr_target',
      name: 'Target',
      isUnlocked: false,
      force: 7,
      aim: 7,
      time: 5,
      pointsRequired: 45,
      price: { type: 'gems', amount: 120 },
      source: 'Champion Tier',
      description: 'Maximum precision reticle with automatic pocket lock detection.',
    },
  ],

  // --------------------------------------------------------------------------
  // 3. PUCKS CATALOG
  // --------------------------------------------------------------------------
  pucks: [
    {
      id: 'puck_black_std',
      name: 'Black Standard',
      rarity: 'STANDARD',
      source: 'Default',
      price: { type: 'coins', amount: 0 },
      whiteColor: '#f1f5f9',
      blackColor: '#1e293b',
      queenColor: '#dc2626',
      rimColor: '#334155',
    },
    {
      id: 'puck_white_std',
      name: 'White Standard',
      rarity: 'STANDARD',
      source: 'Default',
      price: { type: 'coins', amount: 0 },
      whiteColor: '#ffffff',
      blackColor: '#0f172a',
      queenColor: '#e11d48',
      rimColor: '#64748b',
    },
    {
      id: 'puck_vervain',
      name: 'Vervain',
      rarity: 'STANDARD',
      source: 'Paris Stage +',
      price: { type: 'coins', amount: 1500 },
      whiteColor: '#f5d0fe',
      blackColor: '#3b0764',
      queenColor: '#c026d3',
      rimColor: '#a855f7',
    },
    {
      id: 'puck_oscar',
      name: 'Oscar',
      rarity: 'STANDARD',
      source: 'London Park +',
      price: { type: 'coins', amount: 2000 },
      whiteColor: '#fef08a',
      blackColor: '#451a03',
      queenColor: '#eab308',
      rimColor: '#ca8a04',
    },
    {
      id: 'puck_milo',
      name: 'Milo',
      rarity: 'STANDARD',
      source: 'Istanbul Bazaar +',
      price: { type: 'coins', amount: 2500 },
      whiteColor: '#ffedd5',
      blackColor: '#27272a',
      queenColor: '#f97316',
      rimColor: '#ea580c',
    },
    {
      id: 'puck_titan',
      name: 'Titan',
      rarity: 'STANDARD',
      source: 'Istanbul Bazaar +',
      price: { type: 'coins', amount: 2500 },
      whiteColor: '#e2e8f0',
      blackColor: '#18181b',
      queenColor: '#64748b',
      rimColor: '#38bdf8',
    },
    {
      id: 'puck_enchant',
      name: 'Enchant',
      rarity: 'RARE',
      source: 'Delhi Lounge +',
      price: { type: 'coins', amount: 3500 },
      whiteColor: '#fae8ff',
      blackColor: '#4a044e',
      queenColor: '#d946ef',
      rimColor: '#c026d3',
    },
    {
      id: 'puck_saffron',
      name: 'Saffron',
      rarity: 'RARE',
      source: 'London Park +',
      price: { type: 'coins', amount: 4000 },
      whiteColor: '#fef3c7',
      blackColor: '#78350f',
      queenColor: '#f59e0b',
      rimColor: '#d97706',
    },
    {
      id: 'puck_surya',
      name: 'Surya',
      rarity: 'RARE',
      source: 'Istanbul Bazaar +',
      price: { type: 'coins', amount: 4500 },
      whiteColor: '#ffedd5',
      blackColor: '#7c2d12',
      queenColor: '#ea580c',
      rimColor: '#f97316',
    },
    {
      id: 'puck_nuke',
      name: 'Nuke',
      rarity: 'RARE',
      source: 'Cairo Gallery +',
      price: { type: 'coins', amount: 5000 },
      whiteColor: '#fef9c3',
      blackColor: '#14532d',
      queenColor: '#84cc16',
      rimColor: '#22c55e',
    },
    {
      id: 'puck_magma',
      name: 'Magma',
      rarity: 'RARE',
      source: 'Cairo Gallery +',
      price: { type: 'coins', amount: 5000 },
      whiteColor: '#fed7aa',
      blackColor: '#431407',
      queenColor: '#ef4444',
      rimColor: '#ea580c',
    },
    {
      id: 'puck_lockdown',
      name: 'Lockdown',
      rarity: 'RARE',
      source: 'Flashback +',
      price: { type: 'coins', amount: 6000 },
      whiteColor: '#e0e7ff',
      blackColor: '#1e1b4b',
      queenColor: '#6366f1',
      rimColor: '#4f46e5',
    },
    {
      id: 'puck_stardust',
      name: 'Stardust',
      rarity: 'EPIC',
      source: 'Delhi Lounge +',
      price: { type: 'gems', amount: 45 },
      whiteColor: '#e0f2fe',
      blackColor: '#082f49',
      queenColor: '#0ea5e9',
      rimColor: '#38bdf8',
    },
    {
      id: 'puck_moon',
      name: 'Moon',
      rarity: 'EPIC',
      source: 'London Park +',
      price: { type: 'gems', amount: 50 },
      whiteColor: '#f8fafc',
      blackColor: '#0f172a',
      queenColor: '#38bdf8',
      rimColor: '#94a3b8',
    },
    {
      id: 'puck_candy',
      name: 'Candy',
      rarity: 'EPIC',
      source: 'Istanbul Bazaar +',
      price: { type: 'gems', amount: 60 },
      whiteColor: '#fce7f3',
      blackColor: '#831843',
      queenColor: '#ec4899',
      rimColor: '#f472b6',
    },
    {
      id: 'puck_tron',
      name: 'Tron',
      rarity: 'EPIC',
      source: 'Cairo Gallery +',
      price: { type: 'gems', amount: 75 },
      whiteColor: '#ecfeff',
      blackColor: '#083344',
      queenColor: '#06b6d4',
      rimColor: '#00ffff',
    },
    {
      id: 'puck_king',
      name: 'King',
      rarity: 'EPIC',
      source: 'Singapore Plaza +',
      price: { type: 'gems', amount: 80 },
      whiteColor: '#fef3c7',
      blackColor: '#451a03',
      queenColor: '#d97706',
      rimColor: '#fbbf24',
    },
    {
      id: 'puck_neon',
      name: 'Neon',
      rarity: 'EPIC',
      source: 'Singapore Plaza +',
      price: { type: 'gems', amount: 80 },
      whiteColor: '#f0fdf4',
      blackColor: '#022c22',
      queenColor: '#10b981',
      rimColor: '#34d399',
    },
  ],

  // --------------------------------------------------------------------------
  // 4. TRAILS CATALOG
  // --------------------------------------------------------------------------
  trails: [
    {
      id: 'trl_none',
      name: 'No Trail',
      rarity: 'STANDARD',
      source: 'Default',
      price: { type: 'coins', amount: 0 },
      color: 'rgba(231, 76, 60, 0.85)',
      glowColor: 'transparent',
    },
    {
      id: 'trl_verdant',
      name: 'Verdant',
      rarity: 'STANDARD',
      source: 'Events',
      price: { type: 'coins', amount: 3000 },
      color: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.6)',
      dashPattern: [6, 4],
    },
    {
      id: 'trl_burst',
      name: 'Burst',
      rarity: 'STANDARD',
      source: 'Events',
      price: { type: 'coins', amount: 3000 },
      color: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.6)',
      dashPattern: [10, 5],
    },
    {
      id: 'trl_death',
      name: 'Death',
      rarity: 'RARE',
      source: 'Events',
      price: { type: 'coins', amount: 6000 },
      color: '#71717a',
      glowColor: 'rgba(113, 113, 122, 0.6)',
      dashPattern: [4, 4],
    },
    {
      id: 'trl_slash',
      name: 'Slash',
      rarity: 'RARE',
      source: 'Events',
      price: { type: 'coins', amount: 6000 },
      color: '#06b6d4',
      glowColor: 'rgba(6, 182, 212, 0.6)',
      dashPattern: [12, 3],
    },
    {
      id: 'trl_flame',
      name: 'Flame',
      rarity: 'RARE',
      source: 'Events',
      price: { type: 'coins', amount: 6500 },
      color: '#ef4444',
      glowColor: 'rgba(239, 68, 68, 0.7)',
      dashPattern: [8, 4],
    },
    {
      id: 'trl_smash',
      name: 'Smash',
      rarity: 'RARE',
      source: 'Cinema Party +',
      price: { type: 'coins', amount: 7000 },
      color: '#f97316',
      glowColor: 'rgba(249, 115, 22, 0.6)',
      dashPattern: [7, 3],
    },
    {
      id: 'trl_blueray',
      name: 'BlueRay',
      rarity: 'RARE',
      source: 'Cinema Party +',
      price: { type: 'coins', amount: 7000 },
      color: '#3b82f6',
      glowColor: 'rgba(59, 130, 246, 0.7)',
      dashPattern: [8, 5],
    },
    {
      id: 'trl_rainbow',
      name: 'Rainbow',
      rarity: 'EPIC',
      source: 'Flashback +',
      price: { type: 'gems', amount: 75 },
      color: '#a855f7',
      glowColor: 'rgba(168, 85, 247, 0.7)',
      gradient: ['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#a855f7'],
    },
    {
      id: 'trl_ignis7',
      name: 'Ignis7',
      rarity: 'LEGENDARY',
      source: 'Flashback +',
      price: { type: 'gems', amount: 120 },
      color: '#fbbf24',
      glowColor: 'rgba(251, 191, 36, 0.8)',
      dashPattern: [9, 3],
    },
    {
      id: 'trl_cinematic',
      name: 'Cinematic',
      rarity: 'LEGENDARY',
      source: 'Flashback +',
      price: { type: 'gems', amount: 130 },
      color: '#38bdf8',
      glowColor: 'rgba(56, 189, 248, 0.8)',
      dashPattern: [6, 2],
    },
    {
      id: 'trl_novachip',
      name: 'Novachip',
      rarity: 'LEGENDARY',
      source: 'Flashback +',
      price: { type: 'gems', amount: 140 },
      color: '#14b8a6',
      glowColor: 'rgba(20, 184, 166, 0.8)',
      dashPattern: [5, 5],
    },
    {
      id: 'trl_spotlight',
      name: 'Spotlight',
      rarity: 'LEGENDARY',
      source: 'Flashback +',
      price: { type: 'gems', amount: 140 },
      color: '#fde047',
      glowColor: 'rgba(253, 224, 71, 0.85)',
      dashPattern: [12, 4],
    },
    {
      id: 'trl_abyss',
      name: 'Abyss',
      rarity: 'LEGENDARY',
      source: 'Flashback +',
      price: { type: 'gems', amount: 150 },
      color: '#c084fc',
      glowColor: 'rgba(192, 132, 252, 0.85)',
      dashPattern: [8, 6],
    },
  ],

  // --------------------------------------------------------------------------
  // 5. POCKETS CATALOG
  // --------------------------------------------------------------------------
  pockets: [
    {
      id: 'pkt_none',
      name: 'No Pocket Effect',
      rarity: 'STANDARD',
      source: 'Default',
      price: { type: 'coins', amount: 0 },
      ringColor: '#3e2723',
    },
    {
      id: 'pkt_firestarter',
      name: 'Firestarter',
      rarity: 'STANDARD',
      source: 'Shop',
      price: { type: 'gems', amount: 50 },
      glowColor: 'rgba(239, 68, 68, 0.65)',
      ringColor: '#ea580c',
      pulseEffect: true,
    },
    {
      id: 'pkt_jade_echo',
      name: 'Jade Echo',
      rarity: 'RARE',
      source: 'Shop',
      price: { type: 'coins', amount: 12000 },
      glowColor: 'rgba(16, 185, 129, 0.65)',
      ringColor: '#059669',
      pulseEffect: true,
    },
    {
      id: 'pkt_mystic',
      name: 'Mystic',
      rarity: 'EPIC',
      source: 'Coming Soon',
      price: { type: 'gems', amount: 90 },
      glowColor: 'rgba(168, 85, 247, 0.7)',
      ringColor: '#9333ea',
      pulseEffect: true,
    },
    {
      id: 'pkt_plasma',
      name: 'Plasma',
      rarity: 'EPIC',
      source: 'Shop',
      price: { type: 'gems', amount: 100 },
      glowColor: 'rgba(6, 182, 212, 0.75)',
      ringColor: '#0891b2',
      pulseEffect: true,
    },
  ],
};

const STORAGE_KEYS = {
  OWNED_ITEMS: 'carrom_shop_owned_items',
  LOADOUT: 'carrom_shop_equipped_loadout',
};

export function getCarromOwnedItems(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OWNED_ITEMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch {
    // fallback
  }
  return new Set([
    'str_blaze',
    'pwr_blaze',
    'puck_black_std',
    'puck_white_std',
    'trl_none',
    'pkt_none',
  ]);
}

export function saveCarromOwnedItems(items: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.OWNED_ITEMS, JSON.stringify(Array.from(items)));
  } catch {
    // ignore
  }
}

export function getCarromLoadout(): CarromEquippedLoadout {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOADOUT);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CARROM_LOADOUT, ...parsed };
    }
  } catch {
    // fallback
  }
  return { ...DEFAULT_CARROM_LOADOUT };
}

export function saveCarromLoadout(loadout: CarromEquippedLoadout): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOADOUT, JSON.stringify(loadout));
  } catch {
    // ignore
  }
}
