// Master statistics breakdown and universal updater engine for all 20 mini-games

export interface SingleGameStatRecord {
  id: number;
  gameKey?: string;
  name: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  earnings: number;
  icon?: string;
}

export interface UserProfileSchema {
  username: string;
  avatarId: string;
  level: number;
  xp: number;
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  totalEarnings: number;
  gameStats: Record<number, SingleGameStatRecord>;
}

export const TWENTY_GAMES_METADATA: Record<number, { name: string; key: string; icon: string }> = {
  1:  { name: "Monopoly Classic", key: "monopoly", icon: "🎩" },
  2:  { name: "Chess Arena", key: "chess", icon: "♟️" },
  3:  { name: "Ludo Star", key: "ludo", icon: "🎯" },
  4:  { name: "Snakes & Ladders", key: "snakes", icon: "🐍" },
  5:  { name: "Checkers", key: "checkers", icon: "⚪" },
  6:  { name: "Tic Tac Toe", key: "ultimatetictactoe", icon: "❌" },
  7:  { name: "Connect 4", key: "connect4", icon: "🟡" },
  8:  { name: "Battleship", key: "battleship", icon: "🚢" },
  9:  { name: "Dominoes", key: "dominoes", icon: "🀄" },
  10: { name: "Uno Express", key: "uno", icon: "🃏" },
  11: { name: "Poker Holdem", key: "poker", icon: "♠️" },
  12: { name: "Blackjack 21", key: "blackjack", icon: "♦️" },
  13: { name: "Roulette Royale", key: "roulette", icon: "🎰" },
  14: { name: "Carrom Board", key: "carrom", icon: "🥏" },
  15: { name: "8 Ball Pool", key: "pool", icon: "🎱" },
  16: { name: "Air Hockey", key: "airhockey", icon: "🏒" },
  17: { name: "Darts Master", key: "darts", icon: "🎯" },
  18: { name: "Ping Pong", key: "pingpong", icon: "🏓" },
  19: { name: "Bowling Strike", key: "bowling", icon: "🎳" },
  20: { name: "Business Empire", key: "business", icon: "🏙️" },
};

export const INITIAL_USER_PROFILE: UserProfileSchema = {
  username: "TycoonPlayer",
  avatarId: "avatar_red",
  level: 1,
  xp: 0,
  totalGamesPlayed: 0,
  totalWins: 0,
  totalLosses: 0,
  totalEarnings: 0,
  
  // Stats breakdown across all 20 games
  gameStats: {
    1:  { id: 1,  name: "Monopoly Classic", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "🎩" },
    2:  { id: 2,  name: "Chess Arena", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "♟️" },
    3:  { id: 3,  name: "Ludo Star", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "🎯" },
    4:  { id: 4,  name: "Snakes & Ladders", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "🐍" },
    5:  { id: 5,  name: "Checkers", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "⚪" },
    6:  { id: 6,  name: "Tic Tac Toe", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "❌" },
    7:  { id: 7,  name: "Connect 4", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "🟡" },
    8:  { id: 8,  name: "Battleship", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "🚢" },
    9:  { id: 9,  name: "Dominoes", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "🀄" },
    10: { id: 10, name: "Uno Express", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "🃏" },
    11: { id: 11, name: "Poker Holdem", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "♠️" },
    12: { id: 12, name: "Blackjack 21", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "♦️" },
    13: { id: 13, name: "Roulette Royale", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "🎰" },
    14: { id: 14, name: "Carrom Board", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "🥏" },
    15: { id: 15, name: "8 Ball Pool", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "🎱" },
    16: { id: 16, name: "Air Hockey", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "🏒" },
    17: { id: 17, name: "Darts Master", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "🎯" },
    18: { id: 18, name: "Ping Pong", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "🏓" },
    19: { id: 19, name: "Bowling Strike", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "🎳" },
    20: { id: 20, name: "Business Empire", matchesPlayed: 0, wins: 0, losses: 0, earnings: 0, icon: "🏙️" }
  }
};

/**
 * Find game ID (1-20) from either numeric ID or string gameKey
 */
export const resolveGameId = (gameIdentifier: number | string): number => {
  if (typeof gameIdentifier === 'number' && gameIdentifier >= 1 && gameIdentifier <= 20) {
    return gameIdentifier;
  }
  const strKey = String(gameIdentifier).toLowerCase();
  for (const [idStr, meta] of Object.entries(TWENTY_GAMES_METADATA)) {
    if (meta.key.toLowerCase() === strKey || meta.name.toLowerCase() === strKey) {
      return Number(idStr);
    }
  }
  // Mapping common active game keys
  const aliasMap: Record<string, number> = {
    business: 20,
    monopoly: 1,
    chess: 2,
    ludo: 3,
    snakes: 4,
    checkers: 5,
    ultimatetictactoe: 6,
    connect4: 7,
    battleship: 8,
    dominoes: 9,
    uno: 10,
    poker: 11,
    blackjack: 12,
    roulette: 13,
    carrom: 14,
    pool: 15,
    airhockey: 16,
    darts: 17,
    pingpong: 18,
    bowling: 19
  };
  return aliasMap[strKey] || 20;
};

/**
 * Universal Stats Updater Engine
 * Update stats for any completed game (1 through 20)
 */
export const recordTwentyGameResult = (
  gameIdOrKey: number | string,
  isWin: boolean,
  matchEarnings: number = 0,
  customUsername?: string
): UserProfileSchema => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return INITIAL_USER_PROFILE;
  }

  const gameId = resolveGameId(gameIdOrKey);
  const savedData = localStorage.getItem("USER_PROFILE");
  let profile: UserProfileSchema = savedData ? JSON.parse(savedData) : JSON.parse(JSON.stringify(INITIAL_USER_PROFILE));

  // Ensure gameStats exists and has all 20 entries
  if (!profile.gameStats) {
    profile.gameStats = JSON.parse(JSON.stringify(INITIAL_USER_PROFILE.gameStats));
  }
  for (let i = 1; i <= 20; i++) {
    if (!profile.gameStats[i]) {
      profile.gameStats[i] = {
        id: i,
        name: TWENTY_GAMES_METADATA[i]?.name || `Game ${i}`,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        earnings: 0,
        icon: TWENTY_GAMES_METADATA[i]?.icon || "🎮"
      };
    }
  }

  if (customUsername) {
    profile.username = customUsername;
  }

  // 1. Update Global Totals
  profile.totalGamesPlayed = (profile.totalGamesPlayed || 0) + 1;
  if (isWin) {
    profile.totalWins = (profile.totalWins || 0) + 1;
  } else {
    profile.totalLosses = (profile.totalLosses || 0) + 1;
  }
  profile.totalEarnings = (profile.totalEarnings || 0) + matchEarnings;

  // 2. XP & Level Progression (100 XP for win, 30 XP for loss)
  const earnedXP = isWin ? 100 : 30;
  profile.xp = (profile.xp || 0) + earnedXP;
  const xpNeeded = (profile.level || 1) * 500;
  if (profile.xp >= xpNeeded) {
    profile.level = (profile.level || 1) + 1; // Level Up
  }

  // 3. Update Specific Game Stats (1 to 20)
  if (profile.gameStats[gameId]) {
    profile.gameStats[gameId].matchesPlayed = (profile.gameStats[gameId].matchesPlayed || 0) + 1;
    if (isWin) {
      profile.gameStats[gameId].wins = (profile.gameStats[gameId].wins || 0) + 1;
    } else {
      profile.gameStats[gameId].losses = (profile.gameStats[gameId].losses || 0) + 1;
    }
    profile.gameStats[gameId].earnings = (profile.gameStats[gameId].earnings || 0) + matchEarnings;
  }

  // Save to persistent storage
  try {
    localStorage.setItem("USER_PROFILE", JSON.stringify(profile));
  } catch (err) {
    console.error("Failed to save USER_PROFILE to localStorage", err);
  }

  return profile;
};
