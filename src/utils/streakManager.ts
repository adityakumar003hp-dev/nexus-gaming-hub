// Centralized Daily Login Streak Engine
import { getUserPoints, getUserGems, setUserPoints, setUserGems } from './pointsManager';

export interface DailyRewardDay {
  day: number;
  coins: number;
  gems: number;
  badge?: string;
  isGrandPrize?: boolean;
}

export const STREAK_DAYS: DailyRewardDay[] = [
  { day: 1, coins: 500, gems: 0 },
  { day: 2, coins: 1000, gems: 2 },
  { day: 3, coins: 2000, gems: 5 },
  { day: 4, coins: 3500, gems: 10 },
  { day: 5, coins: 5000, gems: 15 },
  { day: 6, coins: 7500, gems: 25 },
  { day: 7, coins: 15000, gems: 100, badge: 'Streak Legend Badge', isGrandPrize: true },
];

export const STREAK_STORAGE_KEY = 'user_daily_streak_data';
export const LEGACY_STREAK_KEY = 'chess_daily_streak';

export interface DailyStreakData {
  currentDay: number;
  lastClaimTimestamp: number;
  claimedDays: number[];
  totalStreakDays?: number;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const RESET_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 continuous hours without claiming resets streak

/**
 * Retrieves the current daily streak data from localStorage,
 * performing automatic 48-hour expiration checking.
 */
export function getDailyStreakData(): DailyStreakData {
  if (typeof window === 'undefined') {
    return { currentDay: 1, lastClaimTimestamp: 0, claimedDays: [], totalStreakDays: 1 };
  }

  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (raw) {
      const data: DailyStreakData = JSON.parse(raw);
      const now = Date.now();

      // Check for streak expiration (missed 48 continuous hours)
      if (data.lastClaimTimestamp > 0 && now - data.lastClaimTimestamp > RESET_WINDOW_MS) {
        const resetState: DailyStreakData = {
          currentDay: 1,
          lastClaimTimestamp: 0,
          claimedDays: [],
          totalStreakDays: 0,
        };
        localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(resetState));
        localStorage.setItem(LEGACY_STREAK_KEY, '1');
        return resetState;
      }

      return {
        currentDay: Math.min(7, Math.max(1, data.currentDay || 1)),
        lastClaimTimestamp: data.lastClaimTimestamp || 0,
        claimedDays: Array.isArray(data.claimedDays) ? data.claimedDays : [],
        totalStreakDays: data.totalStreakDays ?? (data.claimedDays?.length || (data.lastClaimTimestamp > 0 ? 1 : 0)),
      };
    }
  } catch (err) {
    console.warn('Error reading streak storage:', err);
  }

  // Initial default: Day 1 ready to start
  return {
    currentDay: 1,
    lastClaimTimestamp: 0,
    claimedDays: [],
    totalStreakDays: 1,
  };
}

/**
 * Returns the active continuous streak number to display on badges, cards, and profiles.
 * Matches user's claimed progression:
 * - When Day 1 is claimed (or on Day 1): 1 Day
 * - When Day 2 is claimed: 2 Days
 * - Progresses up to 7 Days and carries over cycles.
 */
export function getDailyStreakCount(): number {
  const data = getDailyStreakData();
  
  // If claimed days exist, the streak is at least the number of claimed days
  if (data.claimedDays && data.claimedDays.length > 0) {
    return Math.max(data.claimedDays.length, data.totalStreakDays || 0);
  }

  // If user has not claimed today or first session, display 1 Day (current active day)
  return 1;
}

/**
 * Checks if the user is eligible to claim the daily streak reward today.
 */
export function isDailyStreakClaimAvailable(): boolean {
  const data = getDailyStreakData();
  if (data.lastClaimTimestamp === 0) return true;
  const timeSinceLastClaim = Date.now() - data.lastClaimTimestamp;
  return timeSinceLastClaim >= ONE_DAY_MS;
}

/**
 * Returns remaining milliseconds until next claim is ready (0 if ready now).
 */
export function getTimeUntilNextClaimMs(): number {
  const data = getDailyStreakData();
  if (data.lastClaimTimestamp === 0) return 0;
  const elapsed = Date.now() - data.lastClaimTimestamp;
  return Math.max(0, ONE_DAY_MS - elapsed);
}

/**
 * Executes a daily reward claim, updates points/gems, persists streak,
 * and notifies all components via window custom events.
 */
export function claimDailyStreakReward(reward: DailyRewardDay): DailyStreakData {
  const currentData = getDailyStreakData();
  const curCoins = getUserPoints();
  const curGems = getUserGems();

  // Award Coins & Gems
  setUserPoints(curCoins + reward.coins, `Claimed Day ${reward.day} Streak Reward`);
  if (reward.gems > 0) {
    setUserGems(curGems + reward.gems, `Claimed Day ${reward.day} Streak Reward`);
  }

  const nextClaimedDays = [...(currentData.claimedDays || []), reward.day];
  const isFullWeekCompleted = reward.day >= 7;
  const nextDay = isFullWeekCompleted ? 1 : reward.day + 1;
  const newTotalStreak = (currentData.totalStreakDays || currentData.claimedDays.length) + 1;

  const nextState: DailyStreakData = {
    currentDay: nextDay,
    lastClaimTimestamp: Date.now(),
    claimedDays: isFullWeekCompleted ? [] : nextClaimedDays,
    totalStreakDays: newTotalStreak,
  };

  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(nextState));
    localStorage.setItem(LEGACY_STREAK_KEY, newTotalStreak.toString());
  } catch (err) {
    console.warn('Error saving streak storage:', err);
  }

  notifyStreakUpdated(newTotalStreak, nextState);
  return nextState;
}

/**
 * Dispatches custom event to notify all listening components of streak changes.
 */
export function notifyStreakUpdated(streakCount: number, streakData?: DailyStreakData) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('chess_streak_updated', {
        detail: {
          streak: streakCount,
          streakData: streakData || getDailyStreakData(),
          timestamp: Date.now(),
        },
      })
    );
  }
}
