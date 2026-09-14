// 🏆 CARROM BADGE SYSTEM — 656 BADGES MASTER REPOSITORY
// Implements the full 150 Core + 6 Top Rank + 500 Special = 656 Total Badges structure

import { addPoints, addGems } from '../utils/pointsManager';

export type BadgeCategory = 'core' | 'top_rank' | 'special';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type BadgeTier = 'Starter' | 'Medium' | 'Pro' | 'Super' | 'Enthusiast' | 'Rank' | 'Special';

export interface BadgeRequirement {
  statKey: string;
  target: number;
  label: string;
}

export interface BadgeReward {
  coins: number;
  gems: number;
}

export interface CarromBadge {
  id: string;
  name: string;
  familyId?: string;
  category: BadgeCategory;
  subCategory: string;
  tier: BadgeTier;
  stars: number; // 1 to 5 for core, 6 for top rank
  icon: string;
  description: string;
  requirement: BadgeRequirement;
  reward: BadgeReward;
  rarity: BadgeRarity;
}

export interface CarromPlayerStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  winStreak: number;
  bestWinStreak: number;
  queensPocketed: number;
  whitePiecesPocketed: number;
  blackPiecesPocketed: number;
  totalPockets: number;
  accuracy: number; // percentage (e.g. 75)
  trickShots: number;
  cleanBreaks: number;
  defensiveBlocks: number;
  speedWins: number; // wins under 60 seconds
  perfectGames: number;
  comebackWins: number;
  coinsEarned: number;
  gemsEarned: number;
  dailyStreak: number;
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
  totalCollectionItems: number;
  seasonTier: number;
  eventsCompleted: number;
  eloRating: number;
}

export const DEFAULT_CARROM_STATS: CarromPlayerStats = {
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
  gemsEarned: 140,
  dailyStreak: 4,
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
  totalCollectionItems: 19,
  seasonTier: 12,
  eventsCompleted: 2,
  eloRating: 1450,
};

// ----------------------------------------------------
// 1. CORE ACHIEVEMENT BADGES (30 Families × 5 Levels = 150)
// ----------------------------------------------------
const CORE_FAMILIES = [
  { id: 'rookie', name: 'Carrom Rookie', icon: '🌱', statKey: 'matchesPlayed', targets: [1, 5, 15, 35, 75], unit: 'matches' },
  { id: 'first_strike', name: 'First Strike', icon: '⚡', statKey: 'cleanBreaks', targets: [1, 5, 12, 25, 50], unit: 'clean breaks' },
  { id: 'precision', name: 'Precision', icon: '🎯', statKey: 'accuracy', targets: [30, 50, 70, 85, 95], unit: '% accuracy' },
  { id: 'pocket_master', name: 'Pocket Master', icon: '🕳️', statKey: 'totalPockets', targets: [5, 25, 75, 180, 400], unit: 'pockets' },
  { id: 'queen_hunter', name: 'Queen Hunter', icon: '👑', statKey: 'queensPocketed', targets: [1, 5, 15, 35, 80], unit: 'queens' },
  { id: 'queen_master', name: 'Queen Master', icon: '💎', statKey: 'queensPocketed', targets: [3, 10, 25, 60, 120], unit: 'queen covers' },
  { id: 'win_streak', name: 'Win Streak', icon: '🔥', statKey: 'bestWinStreak', targets: [2, 4, 7, 10, 15], unit: 'streak wins' },
  { id: 'speed_player', name: 'Speed Player', icon: '⏱️', statKey: 'speedWins', targets: [1, 3, 8, 18, 40], unit: 'blitz wins' },
  { id: 'perfect_game', name: 'Perfect Game', icon: '🌟', statKey: 'perfectGames', targets: [1, 2, 5, 10, 20], unit: 'perfect sweeps' },
  { id: 'comeback_king', name: 'Comeback King', icon: '🔄', statKey: 'comebackWins', targets: [1, 3, 7, 15, 30], unit: 'comebacks' },
  { id: 'defender', name: 'Defender', icon: '🛡️', statKey: 'defensiveBlocks', targets: [2, 8, 20, 45, 100], unit: 'defensive plays' },
  { id: 'striker_master', name: 'Striker Master', icon: '🥏', statKey: 'strikersUnlocked', targets: [1, 3, 6, 10, 18], unit: 'strikers unlocked' },
  { id: 'power_master', name: 'Power Master', icon: '✨', statKey: 'powersUnlocked', targets: [1, 3, 6, 10, 18], unit: 'powers mastered' },
  { id: 'collector', name: 'Collector', icon: '🎒', statKey: 'totalCollectionItems', targets: [5, 15, 30, 60, 100], unit: 'inventory items' },
  { id: 'style_player', name: 'Style Player', icon: '🎨', statKey: 'stylesUnlocked', targets: [1, 3, 6, 10, 18], unit: 'board styles' },
  { id: 'daily_player', name: 'Daily Player', icon: '📅', statKey: 'dailyStreak', targets: [1, 3, 7, 14, 30], unit: 'day streak' },
  { id: 'loyal_player', name: 'Loyal Player', icon: '🤝', statKey: 'matchesPlayed', targets: [10, 30, 75, 150, 300], unit: 'arena games' },
  { id: 'tournament_player', name: 'Tournament Player', icon: '🏟️', statKey: 'tournamentsPlayed', targets: [1, 3, 8, 18, 40], unit: 'tournaments' },
  { id: 'tournament_winner', name: 'Tournament Winner', icon: '🥇', statKey: 'tournamentsWon', targets: [1, 2, 5, 10, 25], unit: 'trophies won' },
  { id: 'clan_player', name: 'Clan Player', icon: '🏰', statKey: 'clanMatchesPlayed', targets: [1, 5, 15, 35, 80], unit: 'clan matches' },
  { id: 'clan_warrior', name: 'Clan Warrior', icon: '⚔️', statKey: 'clanWins', targets: [1, 3, 10, 25, 60], unit: 'clan victories' },
  { id: 'clan_champion', name: 'Clan Champion', icon: '🎖️', statKey: 'clanWins', targets: [2, 6, 15, 40, 100], unit: 'clan triumphs' },
  { id: 'championship', name: 'Championship', icon: '🏆', statKey: 'championshipsPlayed', targets: [1, 2, 5, 12, 30], unit: 'grand leagues' },
  { id: 'championship_winner', name: 'Championship Winner', icon: '🔱', statKey: 'championshipsWon', targets: [1, 2, 4, 8, 16], unit: 'league titles' },
  { id: 'elite_player', name: 'Elite Player', icon: '⭐', statKey: 'wins', targets: [5, 20, 50, 120, 250], unit: 'total wins' },
  { id: 'legend', name: 'Legend', icon: '👑', statKey: 'eloRating', targets: [1100, 1300, 1600, 1900, 2300], unit: 'ELO rating' },
  { id: 'mythic_player', name: 'Mythic Player', icon: '🔮', statKey: 'wins', targets: [10, 35, 80, 180, 400], unit: 'career wins' },
  { id: 'global_star', name: 'Global Star', icon: '🌍', statKey: 'coinsEarned', targets: [2000, 10000, 35000, 100000, 300000], unit: 'coins earned' },
  { id: 'carrom_enthusiast', name: 'Carrom Enthusiast', icon: '💫', statKey: 'matchesPlayed', targets: [20, 50, 120, 250, 500], unit: 'games played' },
  { id: 'victory_hunter', name: 'Victory Hunter', icon: '🏹', statKey: 'wins', targets: [8, 25, 65, 150, 350], unit: 'victories' },
];

const CORE_LEVELS: { tier: BadgeTier; stars: number; label: string; coinMult: number; gemMult: number; rarity: BadgeRarity }[] = [
  { tier: 'Starter', stars: 1, label: 'Starter', coinMult: 250, gemMult: 5, rarity: 'common' },
  { tier: 'Medium', stars: 2, label: 'Medium', coinMult: 500, gemMult: 10, rarity: 'common' },
  { tier: 'Pro', stars: 3, label: 'Pro', coinMult: 1000, gemMult: 20, rarity: 'rare' },
  { tier: 'Super', stars: 4, label: 'Super', coinMult: 2500, gemMult: 50, rarity: 'epic' },
  { tier: 'Enthusiast', stars: 5, label: 'Enthusiast', coinMult: 5000, gemMult: 100, rarity: 'legendary' },
];

function generateCoreBadges(): CarromBadge[] {
  const badges: CarromBadge[] = [];
  CORE_FAMILIES.forEach((fam, famIndex) => {
    CORE_LEVELS.forEach((lvl, lvlIndex) => {
      const target = fam.targets[lvlIndex];
      const badgeId = `core_${fam.id}_${lvl.tier.toLowerCase()}`;
      badges.push({
        id: badgeId,
        name: `${fam.name} ${lvl.label}`,
        familyId: fam.id,
        category: 'core',
        subCategory: 'Core Achievements',
        tier: lvl.tier,
        stars: lvl.stars,
        icon: fam.icon,
        description: `Reach ${target} ${fam.unit} in Carrom Board Arena.`,
        requirement: {
          statKey: fam.statKey,
          target,
          label: `${target} ${fam.unit}`,
        },
        reward: {
          coins: (famIndex + 1) * lvl.coinMult,
          gems: (famIndex % 3 + 1) * lvl.gemMult,
        },
        rarity: lvl.rarity,
      });
    });
  });
  return badges;
}

// ----------------------------------------------------
// 2. TOP RANK BADGES (6 Badges)
// ----------------------------------------------------
const TOP_RANK_DATA: { id: string; name: string; icon: string; eloTarget: number; rarity: BadgeRarity; coins: number; gems: number }[] = [
  { id: 'rank_silver', name: 'Silver Rank', icon: '🥈', eloTarget: 1200, rarity: 'common', coins: 5000, gems: 50 },
  { id: 'rank_gold', name: 'Gold Rank', icon: '🥇', eloTarget: 1500, rarity: 'rare', coins: 10000, gems: 100 },
  { id: 'rank_platinum', name: 'Platinum Rank', icon: '💎', eloTarget: 1800, rarity: 'epic', coins: 20000, gems: 200 },
  { id: 'rank_master', name: 'Master Rank', icon: '👑', eloTarget: 2100, rarity: 'legendary', coins: 40000, gems: 400 },
  { id: 'rank_grandmaster', name: 'Grandmaster Rank', icon: '🔥', eloTarget: 2400, rarity: 'mythic', coins: 75000, gems: 750 },
  { id: 'rank_champions', name: 'Champions Rank', icon: '🏆', eloTarget: 2700, rarity: 'mythic', coins: 150000, gems: 1500 },
];

function generateTopRankBadges(): CarromBadge[] {
  return TOP_RANK_DATA.map((rank) => ({
    id: rank.id,
    name: rank.name,
    category: 'top_rank',
    subCategory: 'Top Rank Division',
    tier: 'Rank',
    stars: 6,
    icon: rank.icon,
    description: `Ascend to ${rank.eloTarget}+ ELO in competitive Carrom PvP.`,
    requirement: {
      statKey: 'eloRating',
      target: rank.eloTarget,
      label: `${rank.eloTarget} ELO Rating`,
    },
    reward: {
      coins: rank.coins,
      gems: rank.gems,
    },
    rarity: rank.rarity,
  }));
}

// ----------------------------------------------------
// 3. ADDITIONAL SPECIAL BADGES (25 Categories × 20 Badges = 500)
// ----------------------------------------------------
interface SpecialCategoryDef {
  title: string;
  icon: string;
  statKey: string;
  baseTarget: number;
  stepTarget: number;
  unit: string;
  badgeNames: string[];
}

const SPECIAL_CATEGORIES: SpecialCategoryDef[] = [
  {
    title: 'Accuracy & Aim',
    icon: '🎯',
    statKey: 'accuracy',
    baseTarget: 25,
    stepTarget: 3.5,
    unit: '% match accuracy',
    badgeNames: [
      'Sharp Aim', 'Perfect Aim', 'Laser Aim', 'Bullseye', 'Dead Center',
      'Pinpoint', 'Sniper Eye', 'Optical Caliber', 'True Line', 'Direct Impact',
      'Hawk Glance', 'Razor Sight', 'Precision Vector', 'Crosshair Elite', 'Apex Scope',
      'Horizon Target', 'Micro Focus', 'Quantum Alignment', 'Unfailing Eye', 'Absolute Accuracy',
    ],
  },
  {
    title: 'Queen Challenges',
    icon: '👑',
    statKey: 'queensPocketed',
    baseTarget: 1,
    stepTarget: 4,
    unit: 'queens secured',
    badgeNames: [
      'Queen Seeker', 'Queen Chaser', 'Queen Finder', 'Queen Collector', 'Royal Escort',
      'Empress Cover', 'Sovereign Crown', 'Red Gem Prowler', 'Queen Duelist', 'Royal Snatch',
      'Queen Stash', 'Crimson Dynasty', 'Queen Incline', 'Imperial Grace', 'Red Orb Titan',
      'Queen Strategist', 'Royal Heist', 'Empress Vault', 'Monarch Guardian', 'Crown Sovereign',
    ],
  },
  {
    title: 'Victories',
    icon: '🏆',
    statKey: 'wins',
    baseTarget: 1,
    stepTarget: 6,
    unit: 'wins',
    badgeNames: [
      'First Victory', 'Victory Spark', 'Victory Flame', 'Victory Force', 'Arena Dominator',
      'Decisive Sweep', 'Flawless Triumph', 'Glory Road', 'Champion Call', 'Victorious Path',
      'Board Ruler', 'Conqueror Might', 'Unbroken Will', 'Match General', 'Grand Triumph',
      'Apex Winner', 'Master Tactician', 'Sovereign Victor', 'Eternal Champion', 'Immortal Victor',
    ],
  },
  {
    title: 'Win Streaks',
    icon: '🔥',
    statKey: 'bestWinStreak',
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
  {
    title: 'Trick Shots',
    icon: '🎱',
    statKey: 'trickShots',
    baseTarget: 1,
    stepTarget: 3,
    unit: 'trick shots performed',
    badgeNames: [
      'Trick Starter', 'Bank Shot', 'Rebound Artist', 'Angle Artist', 'Double Cushion',
      'Cushion Ricochet', 'Corner Carver', 'Reverse Spin', 'Scissor Cut', 'Reflection Master',
      'Geometric Wizard', 'Pocket Mirage', 'Prism Angle', 'Sidewall Wizard', 'Diamond Kick',
      'Quantum Rebound', 'Orbit Snooker', 'Impossible Bank', 'Mirage Deflection', 'Master of Angles',
    ],
  },
  {
    title: 'Pocket Mastery',
    icon: '🕳️',
    statKey: 'totalPockets',
    baseTarget: 10,
    stepTarget: 25,
    unit: 'pieces pocketed',
    badgeNames: [
      'Pocket Novice', 'Pocket Scout', 'Corner Sinker', 'Deep Drop', 'Quad Pockets',
      'Gravity Well', 'Net Collector', 'Pocket Magnet', 'Precision Funnel', 'Edge Drop',
      'Swish Finisher', 'Corner Hunter', 'Pocket Surgeon', 'Black Hole', 'Gravity Master',
      'Vortex Sinker', 'Pocket Maestro', 'Abyss Gate', 'Universal Pocket', 'Dimension Sinker',
    ],
  },
  {
    title: 'Break Mastery',
    icon: '💥',
    statKey: 'cleanBreaks',
    baseTarget: 1,
    stepTarget: 4,
    unit: 'clean breaks',
    badgeNames: [
      'Clean Break', 'Scatter King', 'Shockwave', 'Kinetic Surge', 'Cluster Cracker',
      'Power Opener', 'Center Exploder', 'Seismic Strike', 'Resonance Burst', 'Shatter Shot',
      'Earthquake Opener', 'Supernova Break', 'Big Bang', 'Momentum Breaker', 'Kinetic Titan',
      'Shock Cannon', 'Dynamic Scatter', 'Heavy Cleave', 'Pulse Breaker', 'Apex Rupture',
    ],
  },
  {
    title: 'Defense',
    icon: '🛡️',
    statKey: 'defensiveBlocks',
    baseTarget: 2,
    stepTarget: 4,
    unit: 'defensive snookers',
    badgeNames: [
      'Guard Wall', 'Puck Blocker', 'Pocket Denier', 'Iron Fortress', 'Tactical Freeze',
      'Angle Snooker', 'Safe Play', 'Stalemate Wall', 'Strategic Shield', 'Safe Haven',
      'Obstacle Grid', 'Lockdown Artist', 'Perimeter Guard', 'Aegis Defense', 'Citadel Wall',
      'Impenetrable Barrier', 'Bastion Commander', 'Grand Shield', 'Fortress Mind', 'Absolute Defense',
    ],
  },
  {
    title: 'Speed',
    icon: '⚡',
    statKey: 'speedWins',
    baseTarget: 1,
    stepTarget: 2,
    unit: 'quick blitz matches',
    badgeNames: [
      'Fast Hands', 'Rapid Fire', 'Quick Turn', 'Swift Sinker', 'Blitz Striker',
      'Sonic Release', 'Lightning Touch', 'Flash Pocket', 'Turbostrike', 'Whirlwind',
      'Mach Velocity', 'Speed Demon', 'Pulse Quick', 'Hyper Pacer', 'Chrono Striker',
      'Light Speed', 'Time Bender', 'Velocity King', 'Quantum Dash', 'Instant Execution',
    ],
  },
  {
    title: 'Match Milestones',
    icon: '🎮',
    statKey: 'matchesPlayed',
    baseTarget: 5,
    stepTarget: 20,
    unit: 'matches played',
    badgeNames: [
      'Match Apprentice', '10 Matches', '25 Matches', '50 Matches', 'Century Club',
      '150 Games', 'Double Century', '300 Games', '500 Matches', 'Veteran Battler',
      'Board Dweller', 'Millennial Contender', '1000 Games', 'Seasoned Battler', 'War Horse',
      'Arena Veteran', 'Timeless Competitor', 'Endless Games', 'Pantheon Matchman', 'Infinity Contender',
    ],
  },
  {
    title: 'Tournament',
    icon: '🏟️',
    statKey: 'tournamentsPlayed',
    baseTarget: 1,
    stepTarget: 2,
    unit: 'tournaments entered',
    badgeNames: [
      'Bracket Contender', 'Round 1 Survivor', 'Quarterfinalist', 'Semifinalist', 'Finalist Strikers',
      'Trophy Challenger', 'Bracket Buster', 'Grand Arena Champ', 'Tournament Hero', 'Stage Conqueror',
      'Silver Cup', 'Golden Cup', 'Platinum Cup', 'Tourney Titan', 'Open Invitational',
      'Master Cup', 'Grand Slam', 'Apex Open', 'Championship Cup', 'Tournament Immortal',
    ],
  },
  {
    title: 'Clan',
    icon: '🏰',
    statKey: 'clanMatchesPlayed',
    baseTarget: 1,
    stepTarget: 3,
    unit: 'clan games',
    badgeNames: [
      'Clan Recruit', 'Clan Footman', 'Clan Scout', 'Clan Enforcer', 'Banner Bearer',
      'Guild Striker', 'Clan Shield', 'Clan Centurion', 'War General', 'Clan Vanguard',
      'Brotherhood Champ', 'Clan Champion', 'Crest Bearer', 'Citadel Leader', 'Legion Commander',
      'Guild Master', 'Clan Legend', 'Warlord Supreme', 'Clan Patriarch', 'Dynasty Ruler',
    ],
  },
  {
    title: 'Championship',
    icon: '🏆',
    statKey: 'championshipsPlayed',
    baseTarget: 1,
    stepTarget: 2,
    unit: 'championship matches',
    badgeNames: [
      'Regional Hope', 'State Champion', 'National Contender', 'Continental Master', 'World Challenger',
      'Grand Stage', 'Trophy Collector', 'Premier League', 'Crown Contender', 'Podium Finisher',
      'Gold Medalist', 'Triple Crown', 'Apex Champion', 'World Champion', 'Global Cup',
      'Legend of Cups', 'Dynasty Victor', 'Immortal Champion', 'Hall of Fame', 'Eternal Sovereign',
    ],
  },
  {
    title: 'Collection',
    icon: '🎒',
    statKey: 'totalCollectionItems',
    baseTarget: 2,
    stepTarget: 4,
    unit: 'items in wardrobe',
    badgeNames: [
      'Novice Hoarder', 'Vault Starter', 'Item Seeker', 'Treasure Scout', 'Wardrobe Builder',
      'Catalog Explorer', 'Trophy Stash', 'Arsenal Builder', 'Rare Finder', 'Epic Hoarder',
      'Legendary Vault', 'Museum Keeper', 'Grand Collector', 'Relic Hunter', 'Vault Master',
      'Supreme Hoarder', 'Complete Set', 'All-Tier Curator', 'Royal Vault', 'Master Collector',
    ],
  },
  {
    title: 'Striker Collection',
    icon: '🎯',
    statKey: 'strikersUnlocked',
    baseTarget: 1,
    stepTarget: 1,
    unit: 'custom strikers',
    badgeNames: [
      'Wood Striker', 'Ivory Striker', 'Metal Striker', 'Marble Striker', 'Obsidian Striker',
      'Neon Striker', 'Crystal Striker', 'Dragon Striker', 'Cyber Striker', 'Phoenix Striker',
      'Galaxy Striker', 'Titan Striker', 'Golden Striker', 'Quantum Striker', 'Plasma Striker',
      'Eclipse Striker', 'Celestial Striker', 'Void Striker', 'Omniverse Striker', 'God Striker',
    ],
  },
  {
    title: 'Power Collection',
    icon: '✨',
    statKey: 'powersUnlocked',
    baseTarget: 1,
    stepTarget: 1,
    unit: 'powers acquired',
    badgeNames: [
      'Power Apprentice', 'Spark Catalyst', 'Kinetic Booster', 'Frictionless Glide', 'Magnetic Pull',
      'Ghost Touch', 'Sonic Wave', 'Overdrive Core', 'Force Multiplier', 'Quantum Flux',
      'Gravity Inverter', 'Nova Pulse', 'Time Dilation', 'Dimension Warp', 'Radiant Aura',
      'Infinity Dynamo', 'Titan Core', 'Apex Spark', 'Cosmic Singularity', 'Absolute Power',
    ],
  },
  {
    title: 'Puck Collection',
    icon: '⚫',
    statKey: 'pucksUnlocked',
    baseTarget: 1,
    stepTarget: 1,
    unit: 'puck themes unlocked',
    badgeNames: [
      'Basic Pucks', 'Wood Pucks', 'Glossy Pucks', 'Midnight Pucks', 'Regal Pucks',
      'Emerald Pucks', 'Ruby Pucks', 'Diamond Pucks', 'Carbon Pucks', 'Hologram Pucks',
      'Golden Pucks', 'Starlight Pucks', 'Magma Pucks', 'Glacial Pucks', 'Celestial Pucks',
      'Nebula Pucks', 'Void Pucks', 'Singularity Pucks', 'Eternal Pucks', 'Sovereign Pucks',
    ],
  },
  {
    title: 'Trail Collection',
    icon: '🌈',
    statKey: 'trailsUnlocked',
    baseTarget: 1,
    stepTarget: 1,
    unit: 'motion trails unlocked',
    badgeNames: [
      'Faint Trail', 'Ember Glow', 'Neon Stream', 'Laser Path', 'Stardust Trail',
      'Rainbow Spark', 'Electric Arc', 'Frost Vapor', 'Solar Flare', 'Cosmic Dust',
      'Aurora Borealis', 'Plasma Beam', 'Vortex Trace', 'Cyber Grid', 'Golden Wake',
      'Dark Matter', 'Hyperdrive Streak', 'Dimensional Tear', 'Supernova Wake', 'Godly Radiance',
    ],
  },
  {
    title: 'Style Collection',
    icon: '🎨',
    statKey: 'stylesUnlocked',
    baseTarget: 1,
    stepTarget: 1,
    unit: 'board themes unlocked',
    badgeNames: [
      'Classic Wood', 'Midnight Blue', 'Crimson Royal', 'Cyberpunk Grid', 'Emerald Felt',
      'Sunset Gold', 'Steampunk Brass', 'Obsidian Glass', 'Tokyo Neon', 'Royal Velvet',
      'Minimalist White', 'Retro Arcade', 'Galaxy Void', 'Mythic Gold', 'Cherry Blossom',
      'Ice Glacier', 'Volcanic Core', 'Dragon Lair', 'Celestial Palace', 'Zen Temple',
    ],
  },
  {
    title: 'Coin Achievements',
    icon: '🪙',
    statKey: 'coinsEarned',
    baseTarget: 500,
    stepTarget: 5000,
    unit: 'coins earned',
    badgeNames: [
      'Pocket Change', 'Piggy Bank', 'Coin Stash', 'Merchant Purse', 'Gold Seeker',
      'Thousand Coins', 'Gold Pouch', 'Treasure Chest', 'Bank Vault', 'High Roller',
      'Wealthy Striker', 'Coin Tycoon', 'Millionaire Club', 'Fortune Hunter', 'Royal Treasury',
      'Golden Dragon', 'Coin Overlord', 'Midas Touch', 'Trillionaire', 'Infinite Wealth',
    ],
  },
  {
    title: 'Gem Achievements',
    icon: '💎',
    statKey: 'gemsEarned',
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
  {
    title: 'Daily Achievements',
    icon: '📅',
    statKey: 'dailyStreak',
    baseTarget: 1,
    stepTarget: 2,
    unit: 'consecutive active days',
    badgeNames: [
      'Day One', '3-Day Streak', 'Weekly Devotee', '10-Day Routine', 'Fortnight Player',
      '20-Day Commitment', 'Monthly Master', '45-Day Veteran', '60-Day Habit', 'Quarter Year',
      '100-Day Centurion', '120-Day Loyal', 'Half Year', '200-Day Relentless', '250-Day Devotion',
      '300-Day Legend', 'Year of Carrom', '400-Day Eternal', '500-Day Immortal', 'Unbroken Faith',
    ],
  },
  {
    title: 'Season Achievements',
    icon: '📆',
    statKey: 'seasonTier',
    baseTarget: 1,
    stepTarget: 3,
    unit: 'season battlepass tiers',
    badgeNames: [
      'Season Rookie', 'Bronze Ranker', 'Silver Pass', 'Gold Pass', 'Season Challenger',
      'Tier 20 Pioneer', 'Midseason Hero', 'Tier 50 Veteran', 'Elite Pass', 'Season Conqueror',
      'High Orbit', 'Season Top 100', 'Season Top 50', 'Season Top 10', 'Season Champion',
      'Era Definer', 'Grand Stage Finisher', 'Seasonal Titan', 'Sovereign of the Season', 'Eternal Season God',
    ],
  },
  {
    title: 'Event Achievements',
    icon: '🎉',
    statKey: 'eventsCompleted',
    baseTarget: 1,
    stepTarget: 2,
    unit: 'special events completed',
    badgeNames: [
      'Event Explorer', 'Festival Player', 'Weekend Warrior', 'Holiday Striker', 'Blitz Party',
      'Midnight Madness', 'Special Invite', 'Speedrun Event', 'Carnival King', 'Tournament Gala',
      'Mystery Box Hunter', 'Golden Ticket', 'Grand Finale', 'Anniversary Star', 'Summer Splash',
      'Winter Classic', 'Lunar New Year', 'Solstice Victor', 'Century Event', 'Mythic Festival',
    ],
  },
  {
    title: 'Global Achievements',
    icon: '🌍',
    statKey: 'wins',
    baseTarget: 5,
    stepTarget: 15,
    unit: 'ranked arena wins',
    badgeNames: [
      'Local Hero', 'City Top', 'Regional Star', 'State Contender', 'Country Legend',
      'Border Crosser', 'Continental Ace', 'Global Challenger', 'International Master', 'Hemisphere Ruler',
      'Worldwide Star', 'Planetary Ace', 'Earth Champion', 'Star Voyager', 'Orbit Conqueror',
      'Solar Striker', 'Galaxy Contender', 'Universe Champion', 'Cosmic Entity', 'Omnipresent Master',
    ],
  },
];

function generateSpecialBadges(): CarromBadge[] {
  const badges: CarromBadge[] = [];

  SPECIAL_CATEGORIES.forEach((cat, catIndex) => {
    cat.badgeNames.forEach((name, i) => {
      const target = Math.round(cat.baseTarget + i * cat.stepTarget);
      const badgeId = `spec_${cat.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${i + 1}`;

      let rarity: BadgeRarity = 'common';
      if (i >= 5 && i < 10) rarity = 'rare';
      else if (i >= 10 && i < 15) rarity = 'epic';
      else if (i >= 15 && i < 18) rarity = 'legendary';
      else if (i >= 18) rarity = 'mythic';

      const stars = Math.min(5, Math.floor(i / 4) + 1);

      badges.push({
        id: badgeId,
        name,
        category: 'special',
        subCategory: cat.title,
        tier: 'Special',
        stars,
        icon: cat.icon,
        description: `Achieve ${target} ${cat.unit} in Carrom Board challenges.`,
        requirement: {
          statKey: cat.statKey,
          target,
          label: `${target} ${cat.unit}`,
        },
        reward: {
          coins: 1000 + (catIndex * 200) + (i * 350),
          gems: 10 + (catIndex * 2) + (i * 5),
        },
        rarity,
      });
    });
  });

  return badges;
}

// Full 656 Badges Master Array
let cachedAllBadges: CarromBadge[] | null = null;

export function getAllCarromBadges(): CarromBadge[] {
  if (cachedAllBadges) return cachedAllBadges;
  const core = generateCoreBadges(); // 150
  const topRank = generateTopRankBadges(); // 6
  const special = generateSpecialBadges(); // 500
  cachedAllBadges = [...core, ...topRank, ...special]; // Exactly 656!
  return cachedAllBadges;
}

// ----------------------------------------------------
// LOCAL STORAGE & PERSISTENCE ENGINE
// ----------------------------------------------------
export interface UserBadgesState {
  unlockedBadges: Record<string, { unlockedAt: number; claimed: boolean }>;
  equippedBadges: string[]; // up to 3 badge IDs
  archivedBadges: string[]; // badge IDs archived to clean up active showcase
  stats: CarromPlayerStats;
}

const BADGES_STORAGE_KEY = 'carrom_master_badges_state_v2';

export function loadUserBadgesState(): UserBadgesState {
  if (typeof window === 'undefined') {
    return {
      unlockedBadges: {},
      equippedBadges: [],
      archivedBadges: [],
      stats: { ...DEFAULT_CARROM_STATS },
    };
  }

  try {
    const raw = localStorage.getItem(BADGES_STORAGE_KEY);
    if (!raw) {
      const initial: UserBadgesState = {
        unlockedBadges: {
          core_rookie_starter: { unlockedAt: Date.now() - 86400000, claimed: true },
          core_rookie_medium: { unlockedAt: Date.now() - 43200000, claimed: true },
          core_first_strike_starter: { unlockedAt: Date.now() - 40000000, claimed: true },
          spec_accuracy___aim_1: { unlockedAt: Date.now() - 20000000, claimed: false }, // ready to claim
          spec_queen_challenges_1: { unlockedAt: Date.now() - 10000000, claimed: true },
        },
        equippedBadges: ['core_rookie_starter', 'spec_queen_challenges_1'],
        archivedBadges: [],
        stats: { ...DEFAULT_CARROM_STATS },
      };
      saveUserBadgesState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      unlockedBadges: parsed.unlockedBadges || {},
      equippedBadges: parsed.equippedBadges || [],
      archivedBadges: parsed.archivedBadges || [],
      stats: { ...DEFAULT_CARROM_STATS, ...(parsed.stats || {}) },
    };
  } catch {
    return {
      unlockedBadges: {},
      equippedBadges: [],
      archivedBadges: [],
      stats: { ...DEFAULT_CARROM_STATS },
    };
  }
}

export function saveUserBadgesState(state: UserBadgesState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('carrom_badges_updated', { detail: state }));
  } catch {}
}

/**
 * Checks progress of all 656 badges against current stats, unlocking newly earned badges.
 */
export function checkAndUpdateBadgeProgress(currentStats?: CarromPlayerStats): {
  newlyUnlocked: CarromBadge[];
  state: UserBadgesState;
} {
  const state = loadUserBadgesState();
  const stats = currentStats || state.stats;
  state.stats = stats;

  const allBadges = getAllCarromBadges();
  const newlyUnlocked: CarromBadge[] = [];

  allBadges.forEach((badge) => {
    // If already unlocked, skip
    if (state.unlockedBadges[badge.id]) return;

    const currentVal = (stats as any)[badge.requirement.statKey] ?? 0;
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

/**
 * Toggles archive status for a badge.
 * Archived badges are safely stored in the Archive Vault to keep the active trophy hall clean.
 */
export function toggleArchiveBadge(badgeId: string): UserBadgesState {
  const state = loadUserBadgesState();
  const isArchived = state.archivedBadges.includes(badgeId);

  if (isArchived) {
    state.archivedBadges = state.archivedBadges.filter((id) => id !== badgeId);
  } else {
    state.archivedBadges.push(badgeId);
    // If equipped, unequip it when archived
    state.equippedBadges = state.equippedBadges.filter((id) => id !== badgeId);
  }

  saveUserBadgesState(state);
  return state;
}

/**
 * Equips or unequips a badge to display on player profile & matches (Max 3).
 */
export function toggleEquipBadge(badgeId: string): { success: boolean; message: string; state: UserBadgesState } {
  const state = loadUserBadgesState();
  const isEquipped = state.equippedBadges.includes(badgeId);

  if (isEquipped) {
    state.equippedBadges = state.equippedBadges.filter((id) => id !== badgeId);
    saveUserBadgesState(state);
    return { success: true, message: 'Badge unequipped from profile showcase.', state };
  }

  // Check if unlocked
  if (!state.unlockedBadges[badgeId]) {
    return { success: false, message: 'Unlock this badge first before equipping!', state };
  }

  // Max 3 badges
  if (state.equippedBadges.length >= 3) {
    return { success: false, message: 'You can equip a maximum of 3 badges. Unequip one first!', state };
  }

  // If archived, unarchive it
  state.archivedBadges = state.archivedBadges.filter((id) => id !== badgeId);
  state.equippedBadges.push(badgeId);
  saveUserBadgesState(state);
  return { success: true, message: 'Badge equipped to your profile showcase!', state };
}

/**
 * Claims the rewards (Coins & Gems) for an unlocked badge.
 */
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

  // Credit player's wallet
  addPoints(coins, `Carrom Badge Unlocked: ${badge.name}`);
  addGems(gems, `Carrom Badge Unlocked: ${badge.name}`);

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

/**
 * Updates stats and triggers automatic unlocking for newly qualified badges.
 */
export function updateCarromPlayerStats(partial: Partial<CarromPlayerStats>): {
  newlyUnlocked: CarromBadge[];
  state: UserBadgesState;
} {
  const state = loadUserBadgesState();
  state.stats = { ...state.stats, ...partial };
  return checkAndUpdateBadgeProgress(state.stats);
}

/**
 * Helper to record match outcome and update streaks & badges.
 */
export function recordCarromMatchOutcome(details: {
  won: boolean;
  queens: number;
  pockets: number;
  accuracy?: number;
  isPerfect?: boolean;
  isComeback?: boolean;
  cleanBreak?: boolean;
  trickShot?: boolean;
  matchDurationSeconds?: number;
}): { newlyUnlocked: CarromBadge[]; state: UserBadgesState } {
  const state = loadUserBadgesState();
  const s = { ...state.stats };

  s.matchesPlayed += 1;
  if (details.won) {
    s.wins += 1;
    s.winStreak += 1;
    if (s.winStreak > s.bestWinStreak) s.bestWinStreak = s.winStreak;
    s.eloRating = Math.min(3000, s.eloRating + 25);
  } else {
    s.losses += 1;
    s.winStreak = 0;
    s.eloRating = Math.max(800, s.eloRating - 15);
  }

  s.queensPocketed += details.queens;
  s.totalPockets += details.pockets;
  if (details.accuracy) s.accuracy = Math.round((s.accuracy + details.accuracy) / 2);
  if (details.isPerfect) s.perfectGames += 1;
  if (details.isComeback) s.comebackWins += 1;
  if (details.cleanBreak) s.cleanBreaks += 1;
  if (details.trickShot) s.trickShots += 1;
  if (details.won && details.matchDurationSeconds && details.matchDurationSeconds < 60) {
    s.speedWins += 1;
  }

  return updateCarromPlayerStats(s);
}
