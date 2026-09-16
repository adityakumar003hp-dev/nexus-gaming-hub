// ============================================================================
// 🏆 MASTER 656-BADGE ARCHITECTURE & AUTOMATIC PROGRESSION ENGINE
// ============================================================================
// Permanent Targets:
//   • 150 Core Badges (30 Families × 5 Tiers: Starter, Medium, Pro, Super, Enthusiast)
//   • 6 Top Rank Badges (Silver, Gold, Platinum, Master, Grandmaster, Champions)
//   • 500 Additional Badges (25 Categories × 20 Badges based on real website systems)
//   TOTAL = EXACTLY 656 PERMANENT BADGES
// Includes:
//   • Central Event System: BadgeSystem.event(eventName, data)
//   • Automatic Progression & Unlocks
//   • Exact 656-Badge Validation: validateBadgeCount()
//   • AI Future Feature Analyzer & Suggester
// ============================================================================

import { addPoints, addGems } from '../utils/pointsManager';

export type BadgeRarity =
  | 'Common'
  | 'Uncommon'
  | 'Rare'
  | 'Epic'
  | 'Legendary'
  | 'Mythic'
  | 'Secret'
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'
  | 'secret';
export type BadgeTier = 'Starter' | 'Medium' | 'Pro' | 'Super' | 'Enthusiast' | 'Rank' | 'Special';

export interface BadgeThemeMetadata {
  color: string;
  border: string;
  bgGradient: string;
}

export interface BadgeReward {
  coins: number;
  gems: number;
}

export interface BadgeRequirement {
  statKey: string;
  target: number;
  label: string;
}

export interface GameBadge {
  id: string;
  name: string;
  description: string;
  category: string;
  subCategory: string;
  tier: BadgeTier;
  stars: number; // 1 to 5 for core, 6 for top rank
  rarity: BadgeRarity;
  requirement: BadgeRequirement;
  progress: number;
  unlocked: boolean;
  reward: BadgeReward;
  icon: string;
  theme: BadgeThemeMetadata;
  createdBy: 'system' | 'ai_inspector';
  event: string;
  isSecret?: boolean;
  familyId?: string;
}

// Backward compatibility alias for CarromBadge
export type CarromBadge = GameBadge;
export type BadgeCategory = 'core' | 'top_rank' | 'special';

export interface SuggestedBadge {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: BadgeRarity;
  requirement: number;
  event: string;
  reward: BadgeReward;
  icon: string;
  discoveredFrom: string;
  suggestedAt: number;
  approved: boolean;
}

export interface BadgePlayerStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  winStreak: number;
  bestWinStreak: number;
  queensPocketed: number;
  whitePiecesPocketed: number;
  blackPiecesPocketed: number;
  totalPockets: number;
  accuracy: number;
  trickShots: number;
  cleanBreaks: number;
  defensiveBlocks: number;
  speedWins: number;
  perfectGames: number;
  comebackWins: number;
  coinsEarned: number;
  coinsSpent: number;
  gemsEarned: number;
  gemsSpent: number;
  dailyStreak: number;
  dailyLogins: number;
  tournamentsPlayed: number;
  tournamentsWon: number;
  clanMatchesPlayed: number;
  clanWins: number;
  championshipsPlayed: number;
  championshipsWon: number;
  strikersUnlocked: number;
  powersUnlocked: number;
  pucksUnlocked: number;
  trailsUnlocked: number;
  stylesUnlocked: number;
  pocketEffectsUnlocked: number;
  totalCollectionItems: number;
  seasonTier: number;
  eventsCompleted: number;
  eloRating: number;
  aiBattlesPlayed: number;
  aiWins: number;
  aiEasyWins: number;
  aiMediumWins: number;
  aiHardWins: number;
  aiSpeedWins: number;
  aiAccuracy: number;
  wheelSpins: number;
  luckySpins: number;
  chatMessages: number;
  puzzlesSolved: number;
  gamesExplored: number;
  strikerShots: number;
  secretEvents: number;
  [key: string]: number;
}

export const DEFAULT_BADGE_STATS: BadgePlayerStats = {
  matchesPlayed: 14,
  wins: 9,
  losses: 5,
  winStreak: 3,
  bestWinStreak: 5,
  queensPocketed: 7,
  whitePiecesPocketed: 38,
  blackPiecesPocketed: 22,
  totalPockets: 67,
  accuracy: 68,
  trickShots: 6,
  cleanBreaks: 8,
  defensiveBlocks: 11,
  speedWins: 2,
  perfectGames: 1,
  comebackWins: 3,
  coinsEarned: 18500,
  coinsSpent: 3200,
  gemsEarned: 140,
  gemsSpent: 20,
  dailyStreak: 4,
  dailyLogins: 8,
  tournamentsPlayed: 3,
  tournamentsWon: 1,
  clanMatchesPlayed: 5,
  clanWins: 4,
  championshipsPlayed: 1,
  championshipsWon: 0,
  strikersUnlocked: 4,
  powersUnlocked: 3,
  pucksUnlocked: 5,
  trailsUnlocked: 3,
  stylesUnlocked: 4,
  pocketEffectsUnlocked: 3,
  totalCollectionItems: 19,
  seasonTier: 12,
  eventsCompleted: 2,
  eloRating: 1450,
  aiBattlesPlayed: 8,
  aiWins: 6,
  aiEasyWins: 3,
  aiMediumWins: 2,
  aiHardWins: 1,
  aiSpeedWins: 2,
  aiAccuracy: 72,
  wheelSpins: 4,
  luckySpins: 2,
  chatMessages: 15,
  puzzlesSolved: 6,
  gamesExplored: 5,
  strikerShots: 120,
  secretEvents: 2,
};

export interface UserBadgesState {
  unlockedBadges: Record<string, { unlockedAt: number; claimed: boolean }>;
  equippedBadges: string[]; // up to 3 badge IDs
  archivedBadges: string[]; // archived from active view
  stats: BadgePlayerStats;
  suggestedBadges: SuggestedBadge[];
}

const STORAGE_KEY = 'carrom_master_badges_state_v2';
const SUGGESTED_STORAGE_KEY = 'badge_system_suggested_badges_v1';

// Theme styling helper
function getThemeMetadata(rarity: BadgeRarity): BadgeThemeMetadata {
  switch (rarity) {
    case 'Mythic':
      return {
        color: '#f43f5e',
        border: 'border-rose-500/80',
        bgGradient: 'from-rose-950/80 via-[#180914] to-slate-950',
      };
    case 'Legendary':
      return {
        color: '#f59e0b',
        border: 'border-amber-500/80',
        bgGradient: 'from-amber-950/80 via-[#1a1205] to-slate-950',
      };
    case 'Epic':
      return {
        color: '#a855f7',
        border: 'border-purple-500/80',
        bgGradient: 'from-purple-950/80 via-[#140822] to-slate-950',
      };
    case 'Rare':
      return {
        color: '#0284c7',
        border: 'border-sky-500/80',
        bgGradient: 'from-sky-950/80 via-[#071322] to-slate-950',
      };
    case 'Secret':
      return {
        color: '#ec4899',
        border: 'border-pink-500/90',
        bgGradient: 'from-pink-950/90 via-[#1a0515] to-slate-950',
      };
    case 'Uncommon':
      return {
        color: '#10b981',
        border: 'border-emerald-500/70',
        bgGradient: 'from-emerald-950/70 via-[#061914] to-slate-950',
      };
    default:
      return {
        color: '#94a3b8',
        border: 'border-slate-700/80',
        bgGradient: 'from-slate-900/80 via-[#0d121f] to-slate-950',
      };
  }
}

// ----------------------------------------------------------------------------
// 1. CORE ACHIEVEMENT BADGES (30 Families × 5 Levels = 150)
// ----------------------------------------------------------------------------
const CORE_FAMILIES = [
  { id: 'rookie', name: 'Carrom Rookie', icon: '🌱', statKey: 'matchesPlayed', event: 'MATCH_STARTED', targets: [1, 5, 15, 35, 75], unit: 'matches' },
  { id: 'first_strike', name: 'First Strike', icon: '⚡', statKey: 'cleanBreaks', event: 'CLEAN_BREAK', targets: [1, 5, 12, 25, 50], unit: 'clean breaks' },
  { id: 'precision', name: 'Precision', icon: '🎯', statKey: 'accuracy', event: 'MATCH_WON', targets: [30, 50, 70, 85, 95], unit: '% accuracy' },
  { id: 'pocket_master', name: 'Pocket Master', icon: '🕳️', statKey: 'totalPockets', event: 'POCKET', targets: [5, 25, 75, 180, 400], unit: 'pockets' },
  { id: 'queen_hunter', name: 'Queen Hunter', icon: '👑', statKey: 'queensPocketed', event: 'QUEEN_POCKETED', targets: [1, 5, 15, 35, 80], unit: 'queens' },
  { id: 'queen_master', name: 'Queen Master', icon: '💎', statKey: 'queensPocketed', event: 'QUEEN_POCKETED', targets: [3, 10, 25, 60, 120], unit: 'queen covers' },
  { id: 'win_streak', name: 'Win Streak', icon: '🔥', statKey: 'bestWinStreak', event: 'WIN_STREAK', targets: [2, 4, 7, 10, 15], unit: 'streak wins' },
  { id: 'speed_player', name: 'Speed Player', icon: '⏱️', statKey: 'speedWins', event: 'SPEED_WIN', targets: [1, 3, 8, 18, 40], unit: 'blitz wins' },
  { id: 'perfect_game', name: 'Perfect Game', icon: '🌟', statKey: 'perfectGames', event: 'PERFECT_GAME', targets: [1, 2, 5, 10, 20], unit: 'perfect sweeps' },
  { id: 'comeback_king', name: 'Comeback King', icon: '🔄', statKey: 'comebackWins', event: 'COMEBACK_WIN', targets: [1, 3, 7, 15, 30], unit: 'comebacks' },
  { id: 'defender', name: 'Defender', icon: '🛡️', statKey: 'defensiveBlocks', event: 'DEFENSIVE_BLOCK', targets: [2, 8, 20, 45, 100], unit: 'defensive plays' },
  { id: 'striker_master', name: 'Striker Master', icon: '🥏', statKey: 'strikersUnlocked', event: 'STRIKER_UNLOCKED', targets: [1, 3, 6, 10, 18], unit: 'strikers unlocked' },
  { id: 'power_master', name: 'Power Master', icon: '✨', statKey: 'powersUnlocked', event: 'POWER_UNLOCKED', targets: [1, 3, 6, 10, 18], unit: 'powers mastered' },
  { id: 'collector', name: 'Collector', icon: '🎒', statKey: 'totalCollectionItems', event: 'TRAIL_UNLOCKED', targets: [5, 15, 30, 60, 100], unit: 'inventory items' },
  { id: 'style_player', name: 'Style Player', icon: '🎨', statKey: 'stylesUnlocked', event: 'THEME_UNLOCKED', targets: [1, 3, 6, 10, 18], unit: 'board styles' },
  { id: 'daily_player', name: 'Daily Player', icon: '📅', statKey: 'dailyStreak', event: 'DAILY_STREAK', targets: [1, 3, 7, 14, 30], unit: 'day streak' },
  { id: 'loyal_player', name: 'Loyal Player', icon: '🤝', statKey: 'matchesPlayed', event: 'MATCH_STARTED', targets: [10, 30, 75, 150, 300], unit: 'arena games' },
  { id: 'tournament_player', name: 'Tournament Player', icon: '🏟️', statKey: 'tournamentsPlayed', event: 'TOURNAMENT_STARTED', targets: [1, 3, 8, 18, 40], unit: 'tournaments' },
  { id: 'tournament_winner', name: 'Tournament Winner', icon: '🥇', statKey: 'tournamentsWon', event: 'TOURNAMENT_WON', targets: [1, 2, 5, 10, 25], unit: 'trophies won' },
  { id: 'clan_player', name: 'Clan Player', icon: '🏰', statKey: 'clanMatchesPlayed', event: 'CLAN_MATCH', targets: [1, 5, 15, 35, 80], unit: 'clan matches' },
  { id: 'clan_warrior', name: 'Clan Warrior', icon: '⚔️', statKey: 'clanWins', event: 'CLAN_WIN', targets: [1, 3, 10, 25, 60], unit: 'clan victories' },
  { id: 'clan_champion', name: 'Clan Champion', icon: '🎖️', statKey: 'clanWins', event: 'CLAN_WIN', targets: [2, 6, 15, 40, 100], unit: 'clan triumphs' },
  { id: 'championship', name: 'Championship', icon: '🏆', statKey: 'championshipsPlayed', event: 'CHAMPIONSHIP_WIN', targets: [1, 2, 5, 12, 30], unit: 'grand leagues' },
  { id: 'championship_winner', name: 'Championship Winner', icon: '🔱', statKey: 'championshipsWon', event: 'CHAMPIONSHIP_WIN', targets: [1, 2, 4, 8, 16], unit: 'league titles' },
  { id: 'elite_player', name: 'Elite Player', icon: '⭐', statKey: 'wins', event: 'MATCH_WON', targets: [5, 20, 50, 120, 250], unit: 'total wins' },
  { id: 'legend', name: 'Legend', icon: '👑', statKey: 'eloRating', event: 'RANK_CHANGED', targets: [1100, 1300, 1600, 1900, 2300], unit: 'ELO rating' },
  { id: 'mythic_player', name: 'Mythic Player', icon: '🔮', statKey: 'wins', event: 'MATCH_WON', targets: [10, 35, 80, 180, 400], unit: 'career wins' },
  { id: 'global_star', name: 'Global Star', icon: '🌍', statKey: 'coinsEarned', event: 'COINS_EARNED', targets: [2000, 10000, 35000, 100000, 300000], unit: 'coins earned' },
  { id: 'carrom_enthusiast', name: 'Carrom Enthusiast', icon: '💫', statKey: 'matchesPlayed', event: 'MATCH_STARTED', targets: [20, 50, 120, 250, 500], unit: 'games played' },
  { id: 'victory_hunter', name: 'Victory Hunter', icon: '🏹', statKey: 'wins', event: 'MATCH_WON', targets: [8, 25, 65, 150, 350], unit: 'victories' },
];

const CORE_LEVELS: { tier: BadgeTier; stars: number; label: string; coinMult: number; gemMult: number; rarity: BadgeRarity }[] = [
  { tier: 'Starter', stars: 1, label: 'Starter', coinMult: 250, gemMult: 5, rarity: 'Common' },
  { tier: 'Medium', stars: 2, label: 'Medium', coinMult: 500, gemMult: 10, rarity: 'Uncommon' },
  { tier: 'Pro', stars: 3, label: 'Pro', coinMult: 1000, gemMult: 20, rarity: 'Rare' },
  { tier: 'Super', stars: 4, label: 'Super', coinMult: 2500, gemMult: 50, rarity: 'Epic' },
  { tier: 'Enthusiast', stars: 5, label: 'Enthusiast', coinMult: 5000, gemMult: 100, rarity: 'Legendary' },
];

function generateCoreBadges(): GameBadge[] {
  const badges: GameBadge[] = [];
  CORE_FAMILIES.forEach((fam, famIndex) => {
    CORE_LEVELS.forEach((lvl, lvlIndex) => {
      const target = fam.targets[lvlIndex];
      const badgeId = `core_${fam.id}_${lvl.tier.toLowerCase()}`;
      badges.push({
        id: badgeId,
        name: `${fam.name} ${lvl.label}`,
        familyId: fam.id,
        category: 'Core Achievements',
        subCategory: 'Core Progression',
        tier: lvl.tier,
        stars: lvl.stars,
        icon: fam.icon,
        description: `Achieve ${target} ${fam.unit} in browser arena gameplay.`,
        requirement: {
          statKey: fam.statKey,
          target,
          label: `${target} ${fam.unit}`,
        },
        progress: 0,
        unlocked: false,
        reward: {
          coins: (famIndex + 1) * lvl.coinMult,
          gems: ((famIndex % 3) + 1) * lvl.gemMult,
        },
        rarity: lvl.rarity,
        theme: getThemeMetadata(lvl.rarity),
        createdBy: 'system',
        event: fam.event,
        isSecret: false,
      });
    });
  });
  return badges;
}

// ----------------------------------------------------------------------------
// 2. TOP RANK BADGES (6 Badges)
// ----------------------------------------------------------------------------
const TOP_RANK_DATA: { id: string; name: string; icon: string; eloTarget: number; rarity: BadgeRarity; coins: number; gems: number }[] = [
  { id: 'rank_silver', name: 'Silver Rank', icon: '🥈', eloTarget: 1200, rarity: 'Common', coins: 5000, gems: 50 },
  { id: 'rank_gold', name: 'Gold Rank', icon: '🥇', eloTarget: 1500, rarity: 'Rare', coins: 10000, gems: 100 },
  { id: 'rank_platinum', name: 'Platinum Rank', icon: '💎', eloTarget: 1800, rarity: 'Epic', coins: 20000, gems: 200 },
  { id: 'rank_master', name: 'Master Rank', icon: '👑', eloTarget: 2100, rarity: 'Legendary', coins: 40000, gems: 400 },
  { id: 'rank_grandmaster', name: 'Grandmaster Rank', icon: '🔥', eloTarget: 2400, rarity: 'Mythic', coins: 75000, gems: 750 },
  { id: 'rank_champions', name: 'Champions Rank', icon: '🏆', eloTarget: 2700, rarity: 'Mythic', coins: 150000, gems: 1500 },
];

function generateTopRankBadges(): GameBadge[] {
  return TOP_RANK_DATA.map((rank) => ({
    id: rank.id,
    name: rank.name,
    category: 'Top Rank Division',
    subCategory: 'Competitive Ladder',
    tier: 'Rank',
    stars: 6,
    icon: rank.icon,
    description: `Ascend to ${rank.eloTarget}+ ELO in competitive multiplayer rating.`,
    requirement: {
      statKey: 'eloRating',
      target: rank.eloTarget,
      label: `${rank.eloTarget} ELO Rating`,
    },
    progress: 0,
    unlocked: false,
    reward: {
      coins: rank.coins,
      gems: rank.gems,
    },
    rarity: rank.rarity,
    theme: getThemeMetadata(rank.rarity),
    createdBy: 'system',
    event: 'RANK_CHANGED',
    isSecret: false,
  }));
}

// ----------------------------------------------------------------------------
// 3. ADDITIONAL SYSTEM BADGES (25 Categories × 20 Badges = 500 Badges)
// Generated from the actual systems discovered by code analysis
// ----------------------------------------------------------------------------
interface SpecialCategoryDef {
  title: string;
  category: string;
  icon: string;
  statKey: string;
  event: string;
  baseTarget: number;
  stepTarget: number;
  unit: string;
  isSecretCategory?: boolean;
  badgeNames: string[];
  descriptions?: string[];
}

const SPECIAL_CATEGORIES: SpecialCategoryDef[] = [
  // 1. AI Battles (Actual AI Difficulty, Battles & Wins)
  {
    title: 'AI Battles',
    category: 'AI Battles',
    icon: '🤖',
    statKey: 'aiWins',
    event: 'AI_MATCH_WON',
    baseTarget: 1,
    stepTarget: 2,
    unit: 'AI victories',
    badgeNames: [
      'First AI Battle', 'AI Challenger', 'Easy AI Slayer', 'Medium AI Slayer', 'Hard AI Slayer',
      'Expert Bot Hunter', 'Master AI Slayer', 'Silicon Conqueror', 'AI Streak Dynamo', 'Cyber Tactician',
      'Deep Thought Defier', 'Neural Network Nemesis', 'Machine Dominator', 'AI Nightmare Slayer', 'Omni Bot Demolisher',
      'Zero Algorithm Defeat', 'Turing Test Victor', 'Quantum AI Cracker', 'Synthetic Mind Victor', 'Master of All Machines',
    ],
  },
  // 2. AI Advanced Tactics & Decisions
  {
    title: 'AI Tactics',
    category: 'AI Battles',
    icon: '🧠',
    statKey: 'aiAccuracy',
    event: 'AI_MATCH_WON',
    baseTarget: 40,
    stepTarget: 3,
    unit: '% accuracy vs AI',
    badgeNames: [
      'AI Sharp Eye', 'AI Angle Outplay', 'Outsmart the Machine', 'AI Pocket Sniper', 'Outplay the AI',
      'AI Trick Shot', 'AI Bank Shot', 'AI Queen Hunter', 'AI Deflector', 'AI Calculated Bounce',
      'Counter Algorithm', 'Subtle Spin on AI', 'Machine Mindreader', 'Anti-Bot Trajectory', 'AI Flawless Defense',
      'Predictive Bot Punisher', 'Grand Bot Counter', 'Algorithm Overwrite', 'Machine Checkmate', 'Ultimate AI Outplay',
    ],
  },
  // 3. AI Speed & Clutches
  {
    title: 'AI Speed & Clutch',
    category: 'AI Battles',
    icon: '⚡',
    statKey: 'aiSpeedWins',
    event: 'AI_MATCH_WON',
    baseTarget: 1,
    stepTarget: 1,
    unit: 'speed blitz wins vs AI',
    badgeNames: [
      'AI Fast Hands', 'AI Blitz Striker', 'AI 60s Speedrun', 'Sonic Bot Slayer', 'Hyperdrive AI Victory',
      'AI Speed Victory', 'AI No-Miss Victory', 'Turbo Bot Sweep', 'Overclocked Defeat', 'Lightning vs Machine',
      'Flash AI Finish', 'Sub-Minute Bot Break', 'Rapid Bot Dismissal', 'Mach 2 Bot Finisher', 'Instant Machine Down',
      'AI Comeback', 'Defeat AI From Behind', 'Bot Rally Breaker', 'Miracle AI Comeback', 'Impossible AI Reversal',
    ],
  },
  // 4. Carrom Physics & Striker Mechanics
  {
    title: 'Striker Mechanics',
    category: 'Carrom',
    icon: '🥏',
    statKey: 'strikerShots',
    event: 'POCKET',
    baseTarget: 10,
    stepTarget: 25,
    unit: 'striker shots executed',
    badgeNames: [
      'Baseline Slider', 'Aim Angle Calibrator', 'Pullback Master', 'Precision Vector', 'Release Velocity',
      'Smooth Deceleration', 'Friction Master', 'Double-Ring Impact', 'Low-Angle Strike', 'Max Force Burst',
      'Feather Touch', 'Cross-Board Rocket', 'Center Circle Drive', 'Direct Line Striker', 'Recoil Controller',
      'High-Impact Cleave', 'Linear Momentum', 'Velocity Threshold', 'Striker Kinetic Core', 'Master Striker Driver',
    ],
  },
  // 5. Queen Mechanics & Cover Rules
  {
    title: 'Queen Mechanics',
    category: 'Carrom',
    icon: '👑',
    statKey: 'queensPocketed',
    event: 'QUEEN_POCKETED',
    baseTarget: 1,
    stepTarget: 3,
    unit: 'queens secured and covered',
    badgeNames: [
      'Queen Seeker', 'Queen Chaser', 'Red Gem Prowler', 'Queen Finder', 'Queen Snatch',
      'Royal Cover', 'Sovereign Crown', 'Empress Cover', 'Queen Duelist', 'Red Orb Titan',
      'Queen Strategist', 'Royal Heist', 'Empress Vault', 'Monarch Guardian', 'Crown Sovereign',
      'First Turn Queen', 'Cover in Single Shot', 'Back-to-Back Queen Covers', 'Royal Bloodline', 'Imperial Queen Dynasty',
    ],
  },
  // 6. Trick Shots, Bank & Rebound Shots
  {
    title: 'Trick & Bank Shots',
    category: 'Carrom',
    icon: '🎱',
    statKey: 'trickShots',
    event: 'TRICK_SHOT',
    baseTarget: 1,
    stepTarget: 2,
    unit: 'trick & bank shots performed',
    badgeNames: [
      'Trick Starter', 'Bank Shot', 'Rebound Artist', 'Angle Artist', 'Double Cushion',
      'Cushion Ricochet', 'Corner Carver', 'Reverse Spin', 'Scissor Cut', 'Reflection Master',
      'Geometric Wizard', 'Pocket Mirage', 'Prism Angle', 'Sidewall Wizard', 'Diamond Kick',
      'Quantum Rebound', 'Orbit Snooker', 'Impossible Bank', 'Mirage Deflection', 'Master of Angles',
    ],
  },
  // 7. Coin Pocketing Mastery
  {
    title: 'Coin Pocketing',
    category: 'Carrom',
    icon: '🕳️',
    statKey: 'totalPockets',
    event: 'POCKET',
    baseTarget: 10,
    stepTarget: 25,
    unit: 'coins pocketed',
    badgeNames: [
      'Pocket Novice', 'Pocket Scout', 'Corner Sinker', 'Deep Drop', 'Quad Pockets',
      'Gravity Well', 'Net Collector', 'Pocket Magnet', 'Precision Funnel', 'Edge Drop',
      'Swish Finisher', 'Corner Hunter', 'Pocket Surgeon', 'Black Hole', 'Gravity Master',
      'Vortex Sinker', 'Pocket Maestro', 'Abyss Gate', 'Universal Pocket', 'Dimension Sinker',
    ],
  },
  // 8. Break Shots & Kinetic Openers
  {
    title: 'Break Shots',
    category: 'Carrom',
    icon: '💥',
    statKey: 'cleanBreaks',
    event: 'CLEAN_BREAK',
    baseTarget: 1,
    stepTarget: 3,
    unit: 'clean opening breaks',
    badgeNames: [
      'Clean Break', 'Scatter King', 'Shockwave', 'Kinetic Surge', 'Cluster Cracker',
      'Power Opener', 'Center Exploder', 'Seismic Strike', 'Resonance Burst', 'Shatter Shot',
      'Earthquake Opener', 'Supernova Break', 'Big Bang', 'Momentum Breaker', 'Kinetic Titan',
      'Shock Cannon', 'Dynamic Scatter', 'Heavy Cleave', 'Pulse Breaker', 'Apex Rupture',
    ],
  },
  // 9. Defensive Blocks & Snookers
  {
    title: 'Defensive Blocks',
    category: 'Carrom',
    icon: '🛡️',
    statKey: 'defensiveBlocks',
    event: 'DEFENSIVE_BLOCK',
    baseTarget: 2,
    stepTarget: 3,
    unit: 'defensive snookers & blocks',
    badgeNames: [
      'Guard Wall', 'Puck Blocker', 'Pocket Denier', 'Iron Fortress', 'Tactical Freeze',
      'Angle Snooker', 'Safe Play', 'Stalemate Wall', 'Strategic Shield', 'Safe Haven',
      'Obstacle Grid', 'Lockdown Artist', 'Perimeter Guard', 'Aegis Defense', 'Citadel Wall',
      'Impenetrable Barrier', 'Bastion Commander', 'Grand Shield', 'Fortress Mind', 'Absolute Defense',
    ],
  },
  // 10. Speed & Blitz Victories
  {
    title: 'Speed & Blitz',
    category: 'Carrom',
    icon: '⏱️',
    statKey: 'speedWins',
    event: 'SPEED_WIN',
    baseTarget: 1,
    stepTarget: 2,
    unit: 'blitz speed victories (<60s)',
    badgeNames: [
      'Fast Hands', 'Rapid Fire', 'Quick Turn', 'Swift Sinker', 'Blitz Striker',
      'Sonic Release', 'Lightning Touch', 'Flash Pocket', 'Turbostrike', 'Whirlwind',
      'Mach Velocity', 'Speed Demon', 'Pulse Quick', 'Hyper Pacer', 'Chrono Striker',
      'Light Speed', 'Time Bender', 'Velocity King', 'Quantum Dash', 'Instant Execution',
    ],
  },
  // 11. Comeback Wins & Clutch Plays
  {
    title: 'Comebacks',
    category: 'Carrom',
    icon: '🔄',
    statKey: 'comebackWins',
    event: 'COMEBACK_WIN',
    baseTarget: 1,
    stepTarget: 2,
    unit: 'clutch comeback wins',
    badgeNames: [
      'Comeback Kid', 'Second Wind', 'Never Say Die', 'Defeat Defier', 'Turnabout',
      'Clutch Turn', 'Down But Not Out', 'Phoenix Rise', 'Cardiac Match', 'Table Turner',
      'Against the Ropes', 'Reverse Sweep', 'Unbroken Spirit', 'Miracle Rally', 'Desperate Striker',
      'Comeback Titan', 'Iron Resurgence', 'Legendary Revival', 'Great Reversal', 'Master of Comebacks',
    ],
  },
  // 12. Perfect Games & Clean Sweeps
  {
    title: 'Perfect Games',
    category: 'Carrom',
    icon: '🌟',
    statKey: 'perfectGames',
    event: 'PERFECT_GAME',
    baseTarget: 1,
    stepTarget: 1,
    unit: 'perfect sweep victories',
    badgeNames: [
      'Clean Sheet', 'Zero Miss', 'Untouchable', 'Flawless Sweep', 'Perfect Pockets',
      'Zero Turn Foul', 'Pristine Board', 'Golden Sweep', 'Immaculate Match', 'Royal Cleanse',
      'Unmatched Precision', 'Flawless Diamond', 'Board Vacuum', 'Zero Opposition', 'Masterstroke',
      'Celestial Sweep', 'Ascended Perfection', 'Godlike Run', 'Flawless Record', 'Absolute Zenith',
    ],
  },
  // 13. Win Streaks & Momentum
  {
    title: 'Win Streaks',
    category: 'Carrom',
    icon: '🔥',
    statKey: 'bestWinStreak',
    event: 'WIN_STREAK',
    baseTarget: 2,
    stepTarget: 1,
    unit: 'consecutive wins',
    badgeNames: [
      'Hot Start', 'Hot Hand', 'Winning Fire', 'Winning Wave', 'Unstoppable Surge',
      'Streak Dynamo', 'Burning Momentum', 'Blazing Run', 'Comet Flight', 'Inferno March',
      'Iron Streak', 'Apex Sequence', 'Relentless Wave', 'Golden Run', 'Unbroken Chain',
      'Eternal Streak', 'Demigod Run', 'Legend Momentum', 'Grand Streak', 'Zenith Ascendant',
    ],
  },
  // 14. Tournaments & Brackets
  {
    title: 'Tournaments',
    category: 'Tournament',
    icon: '🏟️',
    statKey: 'tournamentsWon',
    event: 'TOURNAMENT_WON',
    baseTarget: 1,
    stepTarget: 1,
    unit: 'tournament cups won',
    badgeNames: [
      'Bracket Contender', 'Round 1 Survivor', 'Quarterfinalist', 'Semifinalist', 'Finalist Strikers',
      'Trophy Challenger', 'Bracket Buster', 'Grand Arena Champ', 'Tournament Hero', 'Stage Conqueror',
      'Silver Cup', 'Golden Cup', 'Platinum Cup', 'Tourney Titan', 'Open Invitational',
      'Master Cup', 'Grand Slam', 'Apex Open', 'Championship Cup', 'Tournament Immortal',
    ],
  },
  // 15. Clan System & Guild Battles
  {
    title: 'Clan Battles',
    category: 'Clan',
    icon: '🏰',
    statKey: 'clanWins',
    event: 'CLAN_WIN',
    baseTarget: 1,
    stepTarget: 2,
    unit: 'clan battle victories',
    badgeNames: [
      'Clan Recruit', 'Clan Footman', 'Clan Scout', 'Clan Enforcer', 'Banner Bearer',
      'Guild Striker', 'Clan Shield', 'Clan Centurion', 'War General', 'Clan Vanguard',
      'Brotherhood Champ', 'Clan Champion', 'Crest Bearer', 'Citadel Leader', 'Legion Commander',
      'Guild Master', 'Clan Legend', 'Warlord Supreme', 'Clan Patriarch', 'Dynasty Ruler',
    ],
  },
  // 16. Championships & Grand Leagues
  {
    title: 'Championships',
    category: 'Tournament',
    icon: '🏆',
    statKey: 'championshipsWon',
    event: 'CHAMPIONSHIP_WIN',
    baseTarget: 1,
    stepTarget: 1,
    unit: 'championship titles won',
    badgeNames: [
      'Regional Hope', 'State Champion', 'National Contender', 'Continental Master', 'World Challenger',
      'Grand Stage', 'Trophy Collector', 'Premier League', 'Crown Contender', 'Podium Finisher',
      'Gold Medalist', 'Triple Crown', 'Apex Champion', 'World Champion', 'Global Cup',
      'Legend of Cups', 'Dynasty Victor', 'Immortal Champion', 'Hall of Fame', 'Eternal Sovereign',
    ],
  },
  // 17. Coins & Economy
  {
    title: 'Coin Wealth',
    category: 'Economy',
    icon: '🪙',
    statKey: 'coinsEarned',
    event: 'COINS_EARNED',
    baseTarget: 1000,
    stepTarget: 8000,
    unit: 'coins earned',
    badgeNames: [
      'Pocket Change', 'Piggy Bank', 'Coin Stash', 'Merchant Purse', 'Gold Seeker',
      'Thousand Coins', 'Gold Pouch', 'Treasure Chest', 'Bank Vault', 'High Roller',
      'Wealthy Striker', 'Coin Tycoon', 'Millionaire Club', 'Fortune Hunter', 'Royal Treasury',
      'Golden Dragon', 'Coin Overlord', 'Midas Touch', 'Trillionaire', 'Infinite Wealth',
    ],
  },
  // 18. Gems & Rare Currency
  {
    title: 'Gem Hoard',
    category: 'Economy',
    icon: '💎',
    statKey: 'gemsEarned',
    event: 'GEMS_EARNED',
    baseTarget: 10,
    stepTarget: 50,
    unit: 'gems earned',
    badgeNames: [
      'First Sparkle', 'Gem Collector', 'Amethyst Find', 'Sapphire Glint', 'Ruby Hoard',
      'Emerald Cluster', 'Diamond Hand', 'Crystal Vault', 'Gem Baron', 'Jewel Collector',
      'Prism Master', 'Radiant Stash', 'Astral Shards', 'Celestial Gems', 'Gem Tycoon',
      'Divine Crystals', 'Infinite Facets', 'Sovereign Jewels', 'Cosmic Gem', 'Eternal Paragon',
    ],
  },
  // 19. Daily Streak & Daily Login Rewards
  {
    title: 'Daily Dedication',
    category: 'Daily',
    icon: '📅',
    statKey: 'dailyStreak',
    event: 'DAILY_STREAK',
    baseTarget: 1,
    stepTarget: 2,
    unit: 'day login streak',
    badgeNames: [
      'Day One', '3-Day Streak', 'Weekly Devotee', '10-Day Routine', 'Fortnight Player',
      '20-Day Commitment', 'Monthly Master', '45-Day Veteran', '60-Day Habit', 'Quarter Year',
      '100-Day Centurion', '120-Day Loyal', 'Half Year', '200-Day Relentless', '250-Day Devotion',
      '300-Day Legend', 'Year of Carrom', '400-Day Eternal', '500-Day Immortal', 'Unbroken Faith',
    ],
  },
  // 20. Wheel of Luck & Daily Spins
  {
    title: 'Wheel of Luck',
    category: 'Economy',
    icon: '🎡',
    statKey: 'wheelSpins',
    event: 'WHEEL_SPIN',
    baseTarget: 1,
    stepTarget: 2,
    unit: 'wheel spins',
    badgeNames: [
      'First Wheel Spin', 'Lucky Spinner', 'Wheel Regular', 'Fortune Seeker', 'Wheel of Wonder',
      'Jackpot Dreamer', 'Gem Wheel Winner', 'Coin Wheel Winner', 'Lucky Streak', 'Mystic Spinner',
      'Grand Wheel Turner', 'High Roller Wheel', 'Fortune Favored', 'Wheel Maestro', 'Daily Jackpot',
      'Super Wheel Master', 'Miracle Needle', 'Golden Pointer', 'Destiny Spinner', 'Wheel of the Gods',
    ],
  },
  // 21. Custom Strikers & Shop Inventory
  {
    title: 'Striker Wardrobe',
    category: 'Collection',
    icon: '🎯',
    statKey: 'strikersUnlocked',
    event: 'STRIKER_UNLOCKED',
    baseTarget: 1,
    stepTarget: 1,
    unit: 'custom strikers collected',
    badgeNames: [
      'Wood Striker', 'Ivory Striker', 'Metal Striker', 'Marble Striker', 'Obsidian Striker',
      'Neon Striker', 'Crystal Striker', 'Dragon Striker', 'Cyber Striker', 'Phoenix Striker',
      'Galaxy Striker', 'Titan Striker', 'Golden Striker', 'Quantum Striker', 'Plasma Striker',
      'Eclipse Striker', 'Celestial Striker', 'Void Striker', 'Omniverse Striker', 'God Striker',
    ],
  },
  // 22. Pucks, Trails & Boards Collection
  {
    title: 'Master Inventory',
    category: 'Collection',
    icon: '🎒',
    statKey: 'totalCollectionItems',
    event: 'TRAIL_UNLOCKED',
    baseTarget: 2,
    stepTarget: 3,
    unit: 'catalog items in wardrobe',
    badgeNames: [
      'Novice Hoarder', 'Vault Starter', 'Item Seeker', 'Treasure Scout', 'Wardrobe Builder',
      'Catalog Explorer', 'Trophy Stash', 'Arsenal Builder', 'Rare Finder', 'Epic Hoarder',
      'Legendary Vault', 'Museum Keeper', 'Grand Collector', 'Relic Hunter', 'Vault Master',
      'Supreme Hoarder', 'Complete Set', 'All-Tier Curator', 'Royal Vault', 'Master Collector',
    ],
  },
  // 23. Social, Chat & Live Reactions
  {
    title: 'Social & Chat',
    category: 'Arena',
    icon: '💬',
    statKey: 'chatMessages',
    event: 'CHAT_MESSAGE',
    baseTarget: 2,
    stepTarget: 4,
    unit: 'chat messages & reactions',
    badgeNames: [
      'Hello Arena', 'Chat Starter', 'Good Game GG', 'Friendly Striker', 'Emote Enthusiast',
      'Reaction Spark', 'Cheerleader', 'Lobby Regular', 'Voice Chatter', 'Room Moderator',
      'Social Butterfly', 'Community Icon', 'Respectful Player', 'Hype Master', 'Arena Voice',
      'Crowd Favorite', 'Global Correspondent', 'Grand Diplomat', 'Universal Friend', 'Legend of the Chat',
    ],
  },
  // 24. Multi-Game Arena Explorer
  {
    title: 'Multi-Game Arena',
    category: 'Arena',
    icon: '🎮',
    statKey: 'gamesExplored',
    event: 'MATCH_STARTED',
    baseTarget: 1,
    stepTarget: 1,
    unit: 'different arena games played',
    badgeNames: [
      'Carrom Pioneer', 'Chess Tactician', 'Draughts Crown', 'Ludo Roller', 'Snakes & Climber',
      'Connect 4 Strategist', 'Backgammon Bearer', 'Battleship Admiral', 'Reversi Master', 'Gomoku Line',
      'Sim Poly', 'Uno Caller', 'Hearts Shooter', 'Gin Rummy Melder', 'Darts Bullseye',
      'Ping Pong Return', 'Business Tycoon', 'Arcade Enthusiast', 'Multi-Game Master', 'Arena Polymath',
    ],
  },
  // 25. Secret & Hidden Achievements
  {
    title: 'Secret Achievements',
    category: 'Secret',
    icon: '🕵️',
    statKey: 'secretEvents',
    event: 'SECRET_UNLOCKED',
    baseTarget: 1,
    stepTarget: 1,
    unit: 'secret discoveries',
    isSecretCategory: true,
    badgeNames: [
      'Secret: Machine Humiliation',
      'Secret: Blind Precision',
      'Secret: The Great Escape',
      'Secret: Clean Hands',
      'Secret: Sub-45 Blitz',
      'Secret: Queen Gambit',
      'Secret: Double Bounce',
      'Secret: Midnight Striker',
      'Secret: High Roller Spin',
      'Secret: Gold Rush',
      'Secret: Diamond Hands',
      'Secret: Grand Loadout',
      'Secret: Five in a Row',
      'Secret: Friendly Rivals',
      'Secret: Century Pockets',
      'Secret: Dark Knight',
      'Secret: Master of 20 Games',
      'Secret: Zero Mercy',
      'Secret: Ricochet Royalty',
      'Secret: The Grand Architect',
    ],
    descriptions: [
      'Defeat Hard AI without losing a single queen cover opportunity.',
      'Execute 3 bank cushion shots in a single competitive match.',
      'Rally back to win after being more than 20 points behind.',
      'Complete a full game victory with absolutely zero striker fouls.',
      'Defeat your opponent in under 45 seconds of gameplay time.',
      'Pocket the Queen on your very first strike of the game.',
      'Sink a coin after double ricocheting off two perimeter cushions.',
      'Win a match in the arena during the midnight hours (12 AM - 4 AM).',
      'Spin the Wheel of Luck on 5 separate sessions.',
      'Accumulate 25,000+ total coins in your player treasury.',
      'Reach a milestone balance of 250+ shiny gems.',
      'Equip a custom striker, puck, trail, and pocket effect together.',
      'Achieve 5 back-to-back match victories without a single defeat.',
      'Transmit 10 friendly reactions and GG messages in live chat.',
      'Pocket 100 white coins across your arena career.',
      'Pocket 100 black coins across your arena career.',
      'Launch and explore at least 5 different classic board games.',
      'Win a match leaving your opponent with zero pocketed coins.',
      'Cover the Queen utilizing a wall bank rebound shot.',
      'Inspect and browse the master 656-Badge Vault catalog.',
    ],
  },
];

function generateSpecialBadges(): GameBadge[] {
  const badges: GameBadge[] = [];

  SPECIAL_CATEGORIES.forEach((cat, catIndex) => {
    cat.badgeNames.forEach((name, i) => {
      const target = Math.max(1, Math.round(cat.baseTarget + i * cat.stepTarget));
      const badgeId = `spec_${cat.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${i + 1}`;

      let rarity: BadgeRarity = 'Common';
      if (cat.isSecretCategory) {
        rarity = 'Secret';
      } else if (i >= 5 && i < 10) {
        rarity = 'Rare';
      } else if (i >= 10 && i < 15) {
        rarity = 'Epic';
      } else if (i >= 15 && i < 18) {
        rarity = 'Legendary';
      } else if (i >= 18) {
        rarity = 'Mythic';
      }

      const stars = Math.min(5, Math.floor(i / 4) + 1);
      const isSecret = !!cat.isSecretCategory;
      const desc = cat.descriptions && cat.descriptions[i]
        ? cat.descriptions[i]
        : `Complete ${target} ${cat.unit} across real browser game activities.`;

      badges.push({
        id: badgeId,
        name,
        category: cat.category,
        subCategory: cat.title,
        tier: 'Special',
        stars,
        rarity,
        icon: cat.icon,
        description: desc,
        requirement: {
          statKey: cat.statKey,
          target,
          label: `${target} ${cat.unit}`,
        },
        progress: 0,
        unlocked: false,
        reward: {
          coins: 1000 + catIndex * 200 + i * 350,
          gems: 10 + (catIndex % 4) * 2 + i * 5,
        },
        theme: getThemeMetadata(rarity),
        createdBy: 'system',
        event: cat.event,
        isSecret,
      });
    });
  });

  return badges;
}

// ----------------------------------------------------------------------------
// 4. MASTER 656-BADGE REPOSITORY & VALIDATOR
// ----------------------------------------------------------------------------
let cachedAllBadges: GameBadge[] | null = null;

export function getAllCarromBadges(): GameBadge[] {
  if (cachedAllBadges) return cachedAllBadges;
  const core = generateCoreBadges();       // 150
  const topRank = generateTopRankBadges(); // 6
  const special = generateSpecialBadges(); // 500
  cachedAllBadges = [...core, ...topRank, ...special]; // Exactly 656
  return cachedAllBadges;
}

/**
 * Validates the exact 656-badge architecture and throws an error if count is invalid.
 */
export function validateBadgeCount(): {
  isValid: boolean;
  total: number;
  coreCount: number;
  rankCount: number;
  additionalCount: number;
  uniqueIds: number;
  uniqueNames: number;
} {
  const all = getAllCarromBadges();
  const coreCount = all.filter((b) => b.category === 'Core Achievements').length;
  const rankCount = all.filter((b) => b.category === 'Top Rank Division').length;
  const additionalCount = all.filter(
    (b) => b.category !== 'Core Achievements' && b.category !== 'Top Rank Division'
  ).length;
  const total = all.length;

  if (total !== 656) {
    throw new Error(
      `[BadgeSystem Validation Error] Expected exactly 656 badges, but found ${total}!`
    );
  }
  if (coreCount !== 150) {
    throw new Error(
      `[BadgeSystem Validation Error] Expected 150 Core badges, but found ${coreCount}!`
    );
  }
  if (rankCount !== 6) {
    throw new Error(
      `[BadgeSystem Validation Error] Expected 6 Top Rank badges, but found ${rankCount}!`
    );
  }
  if (additionalCount !== 500) {
    throw new Error(
      `[BadgeSystem Validation Error] Expected 500 Additional badges, but found ${additionalCount}!`
    );
  }

  // Check unique IDs
  const idSet = new Set<string>();
  const nameSet = new Set<string>();
  for (const b of all) {
    if (idSet.has(b.id)) {
      throw new Error(`[BadgeSystem Validation Error] Duplicate badge ID detected: ${b.id}`);
    }
    idSet.add(b.id);

    if (nameSet.has(b.name)) {
      throw new Error(`[BadgeSystem Validation Error] Duplicate badge Name detected: ${b.name}`);
    }
    nameSet.add(b.name);

    if (typeof b.requirement.target !== 'number' || b.requirement.target <= 0) {
      throw new Error(
        `[BadgeSystem Validation Error] Invalid target requirement for badge: ${b.id}`
      );
    }
    if (!b.event) {
      throw new Error(
        `[BadgeSystem Validation Error] Missing detection event for badge: ${b.id}`
      );
    }
  }

  return {
    isValid: true,
    total,
    coreCount,
    rankCount,
    additionalCount,
    uniqueIds: idSet.size,
    uniqueNames: nameSet.size,
  };
}

// Run initial validation check immediately to guarantee production correctness
try {
  validateBadgeCount();
} catch (err) {
  console.error('[BadgeSystem] Initial Validation Failure:', err);
}

// ----------------------------------------------------------------------------
// 5. STORAGE & STATE PERSISTENCE ENGINE
// ----------------------------------------------------------------------------
export function loadUserBadgesState(): UserBadgesState {
  if (typeof window === 'undefined') {
    return {
      unlockedBadges: {},
      equippedBadges: [],
      archivedBadges: [],
      stats: { ...DEFAULT_BADGE_STATS },
      suggestedBadges: [],
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let suggested: SuggestedBadge[] = [];
    try {
      const sRaw = localStorage.getItem(SUGGESTED_STORAGE_KEY);
      if (sRaw) suggested = JSON.parse(sRaw);
    } catch {}

    if (!raw) {
      const initial: UserBadgesState = {
        unlockedBadges: {
          core_rookie_starter: { unlockedAt: Date.now() - 86400000, claimed: true },
          core_rookie_medium: { unlockedAt: Date.now() - 43200000, claimed: true },
          core_first_strike_starter: { unlockedAt: Date.now() - 40000000, claimed: true },
          spec_ai_battles_1: { unlockedAt: Date.now() - 30000000, claimed: true },
          spec_trick___bank_shots_1: { unlockedAt: Date.now() - 20000000, claimed: false }, // ready to claim
          spec_queen_mechanics_1: { unlockedAt: Date.now() - 10000000, claimed: true },
        },
        equippedBadges: ['spec_ai_battles_1', 'core_rookie_starter', 'spec_queen_mechanics_1'],
        archivedBadges: [],
        stats: { ...DEFAULT_BADGE_STATS },
        suggestedBadges: suggested,
      };
      saveUserBadgesState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      unlockedBadges: parsed.unlockedBadges || {},
      equippedBadges: parsed.equippedBadges || [],
      archivedBadges: parsed.archivedBadges || [],
      stats: { ...DEFAULT_BADGE_STATS, ...(parsed.stats || {}) },
      suggestedBadges: suggested,
    };
  } catch {
    return {
      unlockedBadges: {},
      equippedBadges: [],
      archivedBadges: [],
      stats: { ...DEFAULT_BADGE_STATS },
      suggestedBadges: [],
    };
  }
}

export function saveUserBadgesState(state: UserBadgesState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('carrom_badges_updated', { detail: state }));
    window.dispatchEvent(new CustomEvent('badge_system_updated', { detail: state }));
  } catch {}
}

export function saveSuggestedBadges(suggested: SuggestedBadge[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SUGGESTED_STORAGE_KEY, JSON.stringify(suggested));
    window.dispatchEvent(new CustomEvent('badge_suggestions_updated', { detail: suggested }));
  } catch {}
}

// ----------------------------------------------------------------------------
// 6. CENTRAL EVENT SYSTEM & PROGRESSION DISPATCHER
// ----------------------------------------------------------------------------
export interface BadgeEventPayload {
  eventName: string;
  data?: any;
}

export const BadgeSystem = {
  /**
   * Dispatches a real game event to the automatic progression engine.
   * Example: BadgeSystem.event("AI_MATCH_WON", { difficulty: 'hard', duration: 42 })
   */
  event(eventName: string, data: any = {}): { newlyUnlocked: GameBadge[]; state: UserBadgesState } {
    const state = loadUserBadgesState();
    const stats = state.stats;

    // 1. Process Event and update relevant statistics
    switch (eventName) {
      case 'MATCH_STARTED':
        stats.matchesPlayed += 1;
        if (data?.gameType && !data.isReplay) {
          stats.gamesExplored = Math.min(20, (stats.gamesExplored || 1) + 1);
        }
        break;

      case 'MATCH_WON':
        stats.wins += 1;
        stats.winStreak += 1;
        if (stats.winStreak > stats.bestWinStreak) stats.bestWinStreak = stats.winStreak;
        stats.eloRating = Math.min(3000, (stats.eloRating || 1200) + 25);
        if (data?.duration && data.duration < 60) stats.speedWins += 1;
        if (data?.isPerfect) stats.perfectGames += 1;
        if (data?.isComeback) stats.comebackWins += 1;
        if (data?.accuracy) stats.accuracy = Math.round(((stats.accuracy || 70) + data.accuracy) / 2);
        break;

      case 'MATCH_LOST':
        stats.losses += 1;
        stats.winStreak = 0;
        stats.eloRating = Math.max(800, (stats.eloRating || 1200) - 15);
        break;

      case 'AI_MATCH_STARTED':
        stats.matchesPlayed += 1;
        stats.aiBattlesPlayed += 1;
        break;

      case 'AI_MATCH_WON':
        stats.wins += 1;
        stats.aiWins += 1;
        stats.winStreak += 1;
        if (stats.winStreak > stats.bestWinStreak) stats.bestWinStreak = stats.winStreak;
        stats.eloRating = Math.min(3000, (stats.eloRating || 1200) + 20);

        if (data?.difficulty === 'easy') stats.aiEasyWins += 1;
        if (data?.difficulty === 'medium') stats.aiMediumWins += 1;
        if (data?.difficulty === 'hard') stats.aiHardWins += 1;

        if (data?.duration && data.duration < 60) stats.aiSpeedWins += 1;
        if (data?.accuracy) stats.aiAccuracy = Math.round(((stats.aiAccuracy || 70) + data.accuracy) / 2);
        if (data?.isComeback) stats.comebackWins += 1;
        if (data?.isPerfect) stats.perfectGames += 1;
        break;

      case 'AI_MATCH_LOST':
        stats.losses += 1;
        stats.winStreak = 0;
        stats.eloRating = Math.max(800, (stats.eloRating || 1200) - 12);
        break;

      case 'AI_DIFFICULTY_CHANGED':
        // Stat marker for interaction
        break;

      case 'POCKET':
        stats.totalPockets += data?.count || 1;
        stats.strikerShots += 1;
        if (data?.isWhite) stats.whitePiecesPocketed += data?.count || 1;
        if (data?.isBlack) stats.blackPiecesPocketed += data?.count || 1;
        break;

      case 'QUEEN_POCKETED':
        stats.queensPocketed += 1;
        stats.totalPockets += 1;
        break;

      case 'TRICK_SHOT':
      case 'BANK_SHOT':
      case 'REBOUND_SHOT':
        stats.trickShots += data?.count || 1;
        break;

      case 'CLEAN_BREAK':
        stats.cleanBreaks += 1;
        break;

      case 'DEFENSIVE_BLOCK':
        stats.defensiveBlocks += 1;
        break;

      case 'PERFECT_GAME':
        stats.perfectGames += 1;
        break;

      case 'COMEBACK_WIN':
        stats.comebackWins += 1;
        break;

      case 'WIN_STREAK':
        if (data?.streak && data.streak > stats.bestWinStreak) {
          stats.bestWinStreak = data.streak;
        }
        break;

      case '1ST_PLACE_WIN':
      case 'RANK_1_WIN':
        stats.championshipsWon += 1;
        stats.tournamentsWon += 1;
        stats.eloRating = Math.min(3000, (stats.eloRating || 1200) + 50);
        break;

      case 'TOURNAMENT_STARTED':
        stats.tournamentsPlayed += 1;
        break;

      case 'TOURNAMENT_WON':
        stats.tournamentsWon += 1;
        break;

      case 'CLAN_MATCH':
        stats.clanMatchesPlayed += 1;
        break;

      case 'CLAN_WIN':
        stats.clanWins += 1;
        break;

      case 'CHAMPIONSHIP_WIN':
        stats.championshipsWon += 1;
        break;

      case 'COINS_EARNED':
        stats.coinsEarned += data?.amount || 0;
        break;

      case 'COINS_SPENT':
        stats.coinsSpent = (stats.coinsSpent || 0) + (data?.amount || 0);
        break;

      case 'GEMS_EARNED':
        stats.gemsEarned += data?.amount || 0;
        break;

      case 'GEMS_SPENT':
        stats.gemsSpent = (stats.gemsSpent || 0) + (data?.amount || 0);
        break;

      case 'STRIKER_UNLOCKED':
        stats.strikersUnlocked += 1;
        stats.totalCollectionItems += 1;
        break;

      case 'PUCK_UNLOCKED':
        stats.pucksUnlocked += 1;
        stats.totalCollectionItems += 1;
        break;

      case 'POWER_UNLOCKED':
        stats.powersUnlocked += 1;
        stats.totalCollectionItems += 1;
        break;

      case 'TRAIL_UNLOCKED':
        stats.trailsUnlocked += 1;
        stats.totalCollectionItems += 1;
        break;

      case 'POCKET_EFFECT_UNLOCKED':
        stats.pocketEffectsUnlocked += 1;
        stats.totalCollectionItems += 1;
        break;

      case 'THEME_UNLOCKED':
        stats.stylesUnlocked += 1;
        stats.totalCollectionItems += 1;
        break;

      case 'WHEEL_SPIN':
      case 'LUCKY_SPIN':
        stats.wheelSpins += 1;
        break;

      case 'DAILY_LOGIN':
        stats.dailyLogins += 1;
        break;

      case 'DAILY_STREAK':
        if (data?.streak) stats.dailyStreak = data.streak;
        else stats.dailyStreak += 1;
        break;

      case 'CHAT_MESSAGE':
        stats.chatMessages += 1;
        break;

      case 'PUZZLE_SOLVED':
        stats.puzzlesSolved += 1;
        break;

      case 'RANK_CHANGED':
        if (data?.elo) stats.eloRating = data.elo;
        break;

      case 'SECRET_UNLOCKED':
        stats.secretEvents += 1;
        break;

      default:
        // Handle arbitrary dynamic stats
        if (data?.statKey && typeof data?.amount === 'number') {
          stats[data.statKey] = (stats[data.statKey] || 0) + data.amount;
        }
        break;
    }

    // 2. Evaluate all 656 Badges against current stats
    const allBadges = getAllCarromBadges();
    const newlyUnlocked: GameBadge[] = [];

    allBadges.forEach((badge) => {
      // If already unlocked, skip
      if (state.unlockedBadges[badge.id]) return;

      const currentVal = stats[badge.requirement.statKey] ?? 0;
      if (currentVal >= badge.requirement.target) {
        state.unlockedBadges[badge.id] = {
          unlockedAt: Date.now(),
          claimed: false,
        };
        newlyUnlocked.push(badge);

        // Dispatch individual unlock announcement
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('badge_unlocked_toast', {
              detail: {
                badge,
                coins: badge.reward.coins,
                gems: badge.reward.gems,
              },
            })
          );
        }
      }
    });

    saveUserBadgesState(state);
    return { newlyUnlocked, state };
  },

  /**
   * Retrieves all 656 badges populated with live player progress.
   */
  getBadgesWithProgress(): GameBadge[] {
    const state = loadUserBadgesState();
    const all = getAllCarromBadges();
    return all.map((b) => {
      const isUnlocked = !!state.unlockedBadges[b.id];
      const currentStat = state.stats[b.requirement.statKey] ?? 0;
      return {
        ...b,
        progress: Math.min(b.requirement.target, currentStat),
        unlocked: isUnlocked,
      };
    });
  },

  /**
   * Equips or unequips a badge to the profile showcase (Slot 0 is Primary Badge).
   */
  toggleEquip(badgeId: string): { success: boolean; message: string; state: UserBadgesState } {
    return toggleEquipBadge(badgeId);
  },

  /**
   * Claims coins and gems for an unlocked badge.
   */
  claimReward(badgeId: string) {
    return claimBadgeReward(badgeId);
  },

  /**
   * Archives or restores a badge to/from the Archive Vault.
   */
  toggleArchive(badgeId: string) {
    return toggleArchiveBadge(badgeId);
  },

  /**
   * Inspects a new website feature and generates suggested badges without modifying the permanent 656.
   */
  analyzeNewFeaturesAndSuggest(featureInfo: {
    featureName: string;
    category: string;
    description?: string;
    gameType?: string;
  }): SuggestedBadge[] {
    const state = loadUserBadgesState();
    const existing = state.suggestedBadges || [];

    const newSuggestionId = `suggested_${featureInfo.category.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    const newBadge: SuggestedBadge = {
      id: newSuggestionId,
      name: `${featureInfo.featureName} Pioneer`,
      description: featureInfo.description || `Engage with newly added ${featureInfo.featureName} features across the arena.`,
      category: featureInfo.category || 'New Arena Features',
      rarity: 'Rare',
      requirement: 1,
      event: `${featureInfo.featureName.toUpperCase().replace(/\s+/g, '_')}_ACTIVATED`,
      reward: { coins: 3000, gems: 25 },
      icon: '✨',
      discoveredFrom: featureInfo.featureName,
      suggestedAt: Date.now(),
      approved: false,
    };

    const updated = [newBadge, ...existing];
    state.suggestedBadges = updated;
    saveSuggestedBadges(updated);
    saveUserBadgesState(state);
    return updated;
  },

  /**
   * Validates badge count and architecture.
   */
  validate() {
    return validateBadgeCount();
  },
};

// Expose BadgeSystem globally on window for easy developer inspection & cross-module accessibility
if (typeof window !== 'undefined') {
  (window as any).BadgeSystem = BadgeSystem;
}

// ----------------------------------------------------------------------------
// 7. COMPATIBILITY WRAPPERS FOR PREVIOUS IMPORTS
// ----------------------------------------------------------------------------
export function checkAndUpdateBadgeProgress(currentStats?: BadgePlayerStats): {
  newlyUnlocked: GameBadge[];
  state: UserBadgesState;
} {
  const state = loadUserBadgesState();
  const stats = currentStats || state.stats;
  state.stats = stats;

  const allBadges = getAllCarromBadges();
  const newlyUnlocked: GameBadge[] = [];

  allBadges.forEach((badge) => {
    if (state.unlockedBadges[badge.id]) return;
    const currentVal = stats[badge.requirement.statKey] ?? 0;
    if (currentVal >= badge.requirement.target) {
      state.unlockedBadges[badge.id] = {
        unlockedAt: Date.now(),
        claimed: false,
      };
      newlyUnlocked.push(badge);
    }
  });

  if (newlyUnlocked.length > 0 || currentStats) {
    saveUserBadgesState(state);
  }

  return { newlyUnlocked, state };
}

export function toggleArchiveBadge(badgeId: string): UserBadgesState {
  const state = loadUserBadgesState();
  const isArchived = state.archivedBadges.includes(badgeId);

  if (isArchived) {
    state.archivedBadges = state.archivedBadges.filter((id) => id !== badgeId);
  } else {
    state.archivedBadges.push(badgeId);
    state.equippedBadges = state.equippedBadges.filter((id) => id !== badgeId);
  }

  saveUserBadgesState(state);
  return state;
}

export function toggleEquipBadge(badgeId: string): { success: boolean; message: string; state: UserBadgesState } {
  const state = loadUserBadgesState();
  const isEquipped = state.equippedBadges.includes(badgeId);

  if (isEquipped) {
    state.equippedBadges = state.equippedBadges.filter((id) => id !== badgeId);
    saveUserBadgesState(state);
    return { success: true, message: 'Badge unequipped from profile showcase.', state };
  }

  if (!state.unlockedBadges[badgeId]) {
    return { success: false, message: 'Unlock this badge first before equipping!', state };
  }

  if (state.equippedBadges.length >= 3) {
    return { success: false, message: 'You can equip a maximum of 3 badges. Unequip one first!', state };
  }

  state.archivedBadges = state.archivedBadges.filter((id) => id !== badgeId);
  state.equippedBadges.push(badgeId);
  saveUserBadgesState(state);
  return { success: true, message: 'Badge equipped to your profile showcase!', state };
}

export function claimBadgeReward(badgeId: string): {
  success: boolean;
  message: string;
  coinsEarned: number;
  gemsEarned: number;
  state: UserBadgesState;
} {
  const state = loadUserBadgesState();
  const unlocked = state.unlockedBadges[badgeId];

  if (!unlocked) {
    return { success: false, message: 'Badge is not yet unlocked!', coinsEarned: 0, gemsEarned: 0, state };
  }

  if (unlocked.claimed) {
    return { success: false, message: 'Reward already claimed for this badge.', coinsEarned: 0, gemsEarned: 0, state };
  }

  const allBadges = getAllCarromBadges();
  const badge = allBadges.find((b) => b.id === badgeId);
  if (!badge) {
    return { success: false, message: 'Badge not found.', coinsEarned: 0, gemsEarned: 0, state };
  }

  const coins = badge.reward.coins;
  const gems = badge.reward.gems;

  addPoints(coins, `Badge Unlocked: ${badge.name}`);
  addGems(gems, `Badge Unlocked: ${badge.name}`);

  unlocked.claimed = true;
  state.stats.coinsEarned += coins;
  state.stats.gemsEarned += gems;

  saveUserBadgesState(state);

  return {
    success: true,
    message: `Claimed +${coins.toLocaleString()} Coins and +${gems} Gems!`,
    coinsEarned: coins,
    gemsEarned: gems,
    state,
  };
}

export function updateCarromPlayerStats(partial: Partial<BadgePlayerStats>): {
  newlyUnlocked: GameBadge[];
  state: UserBadgesState;
} {
  const state = loadUserBadgesState();
  state.stats = { ...state.stats, ...partial };
  return checkAndUpdateBadgeProgress(state.stats);
}

export function recordCarromMatchOutcome(details: {
  won: boolean;
  queens: number;
  pockets: number;
  accuracy?: number;
  isPerfect?: boolean;
  isComeback?: boolean;
  cleanBreak?: boolean;
  trickShot?: boolean;
  isAgainstAI?: boolean;
  aiDifficulty?: string;
  matchDurationSeconds?: number;
}): { newlyUnlocked: GameBadge[]; state: UserBadgesState } {
  if (details.isAgainstAI) {
    return BadgeSystem.event(details.won ? 'AI_MATCH_WON' : 'AI_MATCH_LOST', {
      difficulty: details.aiDifficulty,
      duration: details.matchDurationSeconds,
      isPerfect: details.isPerfect,
      isComeback: details.isComeback,
      accuracy: details.accuracy,
    });
  } else {
    return BadgeSystem.event(details.won ? 'MATCH_WON' : 'MATCH_LOST', {
      duration: details.matchDurationSeconds,
      isPerfect: details.isPerfect,
      isComeback: details.isComeback,
      accuracy: details.accuracy,
    });
  }
}
