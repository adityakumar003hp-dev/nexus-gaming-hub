import { 
  doc, 
  collection, 
  setDoc, 
  updateDoc, 
  getDoc,
  getDocs, 
  increment, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit as firestoreLimit 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { 
  getUserPoints, 
  setUserPoints, 
  getUserGems, 
  setUserGems 
} from './pointsManager';

export type CoinTransactionType = 
  | 'match_win' 
  | 'match_draw' 
  | 'match_loss' 
  | 'match_entry' 
  | 'daily_spin' 
  | 'daily_login' 
  | 'mystery_box'
  | 'quest_reward' 
  | 'referral' 
  | 'ad_reward'
  | 'social_share'
  | 'currency_exchange';

export interface CoinTransactionRecord {
  txId: string;
  userId: string;
  amount: number;
  type: CoinTransactionType;
  description: string;
  gameId?: string | null;
  balanceAfter: number;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface CoinRewardBreakdown {
  baseCoins: number;
  streakBonus: number;
  totalCoins: number;
  currentStreak: number;
  isStreakMilestone: boolean;
}

const LOCAL_TX_KEY = 'duo_chess_coin_history_v1';
const WIN_STREAK_KEY = 'duo_chess_win_streak_count';
const LAST_DAILY_CLAIM_KEY = 'duo_chess_last_daily_claim_ts';
const DAILY_STREAK_DAY_KEY = 'duo_chess_daily_streak_day';
const LAST_MYSTERY_BOX_KEY = 'duo_chess_last_mystery_box_ts';
const LAST_AD_WATCH_KEY = 'duo_chess_last_ad_watch_ts';

export const DAILY_LADDER_REWARDS = [
  { day: 1, coins: 50, gems: 0, label: 'Day 1: Kickoff' },
  { day: 2, coins: 100, gems: 0, label: 'Day 2: Momentum' },
  { day: 3, coins: 150, gems: 0, label: 'Day 3: Challenger' },
  { day: 4, coins: 200, gems: 5, label: 'Day 4: Master' },
  { day: 5, coins: 300, gems: 10, label: 'Day 5: Grandmaster' },
  { day: 6, coins: 400, gems: 15, label: 'Day 6: Legend' },
  { day: 7, coins: 500, gems: 25, label: 'Day 7: Champion Jackpot' },
];

/**
 * Reads local cached transaction history
 */
export function getLocalCoinHistory(): CoinTransactionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_TX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Saves transaction to local cache for instant UI availability
 */
function saveLocalCoinTransaction(tx: CoinTransactionRecord) {
  if (typeof window === 'undefined') return;
  try {
    const history = getLocalCoinHistory();
    const updated = [tx, ...history.filter(item => item.txId !== tx.txId)].slice(0, 100);
    localStorage.setItem(LOCAL_TX_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving local coin history:', err);
  }
}

/**
 * Core Atomic Transaction Executor:
 * Updates Firestore with increment(), creates immutable log in /users/{uid}/coin_history/{txId},
 * and updates local pointsManager + emits events.
 */
export async function executeCoinTransaction({
  amount,
  type,
  description,
  gameId,
  metadata = {}
}: {
  amount: number;
  type: CoinTransactionType;
  description: string;
  gameId?: string;
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; newBalance: number; txId: string }> {
  const currentBalance = getUserPoints();
  const nextBalance = Math.max(0, currentBalance + amount);
  const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const currentUser = auth.currentUser;
  const userId = currentUser ? currentUser.uid : 'guest_player';

  // 1. Update local reactive state immediately
  setUserPoints(nextBalance, description);

  // 2. Prepare immutable transaction record
  const record: CoinTransactionRecord = {
    txId,
    userId,
    amount,
    type,
    description,
    gameId: gameId || null,
    balanceAfter: nextBalance,
    createdAt: new Date().toISOString(),
    metadata
  };

  saveLocalCoinTransaction(record);

  // Notify UI elements
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('coin_transaction_logged', { detail: record }));
  }

  // 3. Atomically synchronize with Firebase Firestore if user is authenticated
  if (currentUser) {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const historyDocRef = doc(db, 'users', currentUser.uid, 'coin_history', txId);

      // Atomic increment on user profile
      await updateDoc(userRef, {
        coins: increment(amount),
        updatedAt: serverTimestamp()
      }).catch(async () => {
        // If document doesn't exist yet, create it
        await setDoc(userRef, {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || 'Player',
          coins: nextBalance,
          createdAt: new Date().toISOString(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      });

      // Write immutable audit log document
      await setDoc(historyDocRef, {
        txId,
        userId: currentUser.uid,
        amount,
        type,
        description,
        gameId: gameId || null,
        balanceAfter: nextBalance,
        createdAt: new Date().toISOString(),
        metadata,
        timestamp: serverTimestamp()
      });
    } catch (firebaseErr) {
      console.warn('Firestore coin synchronization deferred or failed:', firebaseErr);
    }
  }

  return { success: true, newBalance: nextBalance, txId };
}

/**
 * Fetches recent coin transaction history (Firestore first, falls back to local storage cache)
 */
export async function fetchCoinHistory(limitCount: number = 30): Promise<CoinTransactionRecord[]> {
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const historyCol = collection(db, 'users', currentUser.uid, 'coin_history');
      const q = query(historyCol, orderBy('createdAt', 'desc'), firestoreLimit(limitCount));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const records: CoinTransactionRecord[] = [];
        snap.forEach(docSnap => {
          records.push(docSnap.data() as CoinTransactionRecord);
        });
        // Merge into local cache
        records.forEach(r => saveLocalCoinTransaction(r));
        return records;
      }
    } catch (err) {
      console.warn('Unable to load Firestore coin ledger, using local cache:', err);
    }
  }
  return getLocalCoinHistory().slice(0, limitCount);
}

// ---------------------------------------------------------------------------
// 1. GAMEPLAY & ACTIVITY-BASED EARNING
// ---------------------------------------------------------------------------

export function getWinStreak(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(WIN_STREAK_KEY) || '0', 10) || 0;
}

export function setWinStreak(streak: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WIN_STREAK_KEY, Math.max(0, streak).toString());
}

/**
 * Awards coins based on match completion:
 * - Win: +100 Coins (plus +50 streak bonus if streak >= 3)
 * - Draw: +25 Coins
 * - Loss: 0 Coins + streak reset
 */
export async function awardMatchCompletion({
  gameId,
  result,
  opponentName
}: {
  gameId: string;
  result: 'win' | 'draw' | 'loss';
  opponentName?: string;
}): Promise<CoinRewardBreakdown | null> {
  const currentStreak = getWinStreak();

  if (result === 'win') {
    const newStreak = currentStreak + 1;
    setWinStreak(newStreak);

    const baseCoins = 100;
    // Streak multiplier: +50 extra coins for every win on a 3+ win streak!
    const streakBonus = newStreak >= 3 ? Math.min(250, (newStreak - 2) * 50) : 0;
    const totalCoins = baseCoins + streakBonus;
    const isStreakMilestone = newStreak === 3 || newStreak === 5 || newStreak === 10;

    await executeCoinTransaction({
      amount: totalCoins,
      type: 'match_win',
      description: `Victory in ${gameId.toUpperCase()}${streakBonus > 0 ? ` (${newStreak}x Win Streak Bonus!)` : ''}`,
      gameId,
      metadata: {
        result: 'win',
        streak: newStreak,
        baseCoins,
        streakBonus,
        opponent: opponentName || 'Opponent'
      }
    });

    return {
      baseCoins,
      streakBonus,
      totalCoins,
      currentStreak: newStreak,
      isStreakMilestone
    };
  } else if (result === 'draw') {
    const totalCoins = 25;
    await executeCoinTransaction({
      amount: totalCoins,
      type: 'match_draw',
      description: `Draw Match Consolation in ${gameId.toUpperCase()}`,
      gameId,
      metadata: { result: 'draw', opponent: opponentName || 'Opponent' }
    });

    return {
      baseCoins: 25,
      streakBonus: 0,
      totalCoins: 25,
      currentStreak,
      isStreakMilestone: false
    };
  } else {
    // Loss resets the win streak
    setWinStreak(0);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 2. DAILY RETENTION & ENGAGEMENT
// ---------------------------------------------------------------------------

export interface DailyLoginStatus {
  canClaim: boolean;
  currentDay: number; // 1 to 7
  nextClaimInMs: number;
  rewardForToday: { day: number; coins: number; gems: number; label: string };
}

export function getDailyLoginStatus(): DailyLoginStatus {
  if (typeof window === 'undefined') {
    return { canClaim: false, currentDay: 1, nextClaimInMs: 0, rewardForToday: DAILY_LADDER_REWARDS[0] };
  }

  const lastClaimTs = parseInt(localStorage.getItem(LAST_DAILY_CLAIM_KEY) || '0', 10);
  let currentDay = parseInt(localStorage.getItem(DAILY_STREAK_DAY_KEY) || '1', 10);
  if (currentDay < 1 || currentDay > 7) currentDay = 1;

  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

  let canClaim = false;
  let nextClaimInMs = 0;

  if (!lastClaimTs) {
    canClaim = true;
    currentDay = 1;
  } else {
    const elapsed = now - lastClaimTs;
    if (elapsed > TWO_DAYS_MS) {
      // Streak broken, reset back to Day 1
      currentDay = 1;
      canClaim = true;
    } else if (elapsed >= ONE_DAY_MS) {
      canClaim = true;
    } else {
      canClaim = false;
      nextClaimInMs = ONE_DAY_MS - elapsed;
    }
  }

  const rewardForToday = DAILY_LADDER_REWARDS[currentDay - 1] || DAILY_LADDER_REWARDS[0];

  return { canClaim, currentDay, nextClaimInMs, rewardForToday };
}

export async function claimDailyLoginReward(): Promise<{ success: boolean; coins: number; gems: number; day: number; message: string }> {
  const status = getDailyLoginStatus();
  if (!status.canClaim) {
    const hoursRemaining = Math.ceil(status.nextClaimInMs / (60 * 60 * 1000));
    return { 
      success: false, 
      coins: 0, 
      gems: 0, 
      day: status.currentDay, 
      message: `Daily reward is on cooldown. Next claim in ~${hoursRemaining}h.` 
    };
  }

  const reward = status.rewardForToday;
  const now = Date.now();

  localStorage.setItem(LAST_DAILY_CLAIM_KEY, now.toString());
  // Advance to next day for tomorrow
  const nextDay = status.currentDay >= 7 ? 1 : status.currentDay + 1;
  localStorage.setItem(DAILY_STREAK_DAY_KEY, nextDay.toString());

  // Award Coins
  await executeCoinTransaction({
    amount: reward.coins,
    type: 'daily_login',
    description: `Daily Login Bonus - Day ${status.currentDay} (${reward.label})`,
    metadata: { day: status.currentDay, gems: reward.gems }
  });

  // Award Gems if any
  if (reward.gems > 0) {
    const curGems = getUserGems();
    setUserGems(curGems + reward.gems, `Daily Login Reward - Day ${status.currentDay}`);
  }

  return {
    success: true,
    coins: reward.coins,
    gems: reward.gems,
    day: status.currentDay,
    message: `Claimed +${reward.coins} Coins${reward.gems ? ` and +${reward.gems} Gems` : ''}!`
  };
}

// ---------------------------------------------------------------------------
// 3. TIME-BASED MYSTERY BOX (Claimable every 2 hours)
// ---------------------------------------------------------------------------

const MYSTERY_BOX_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours

export function getMysteryBoxStatus(): { canClaim: boolean; cooldownRemainingMs: number } {
  if (typeof window === 'undefined') return { canClaim: false, cooldownRemainingMs: 0 };
  const lastTs = parseInt(localStorage.getItem(LAST_MYSTERY_BOX_KEY) || '0', 10);
  const now = Date.now();
  const elapsed = now - lastTs;

  if (!lastTs || elapsed >= MYSTERY_BOX_INTERVAL_MS) {
    return { canClaim: true, cooldownRemainingMs: 0 };
  }
  return { canClaim: false, cooldownRemainingMs: MYSTERY_BOX_INTERVAL_MS - elapsed };
}

export async function claimMysteryBox(): Promise<{ success: boolean; coins: number; message: string }> {
  const status = getMysteryBoxStatus();
  if (!status.canClaim) {
    const mins = Math.ceil(status.cooldownRemainingMs / (60 * 1000));
    return { success: false, coins: 0, message: `Mystery Box ready in ${mins} minutes.` };
  }

  // Random reward between 30 and 75 coins
  const randomCoins = Math.floor(Math.random() * 46) + 30;
  localStorage.setItem(LAST_MYSTERY_BOX_KEY, Date.now().toString());

  await executeCoinTransaction({
    amount: randomCoins,
    type: 'mystery_box',
    description: `Mystery Treasure Box Reward (+${randomCoins} Coins)`,
    metadata: { randomCoins }
  });

  return {
    success: true,
    coins: randomCoins,
    message: `Mystery Chest opened! +${randomCoins} Coins added to your wallet!`
  };
}

// ---------------------------------------------------------------------------
// 4. MONETIZATION & ADS (Rewarded Video Simulation)
// ---------------------------------------------------------------------------

const AD_COOLDOWN_MS = 60 * 1000; // 60 seconds

export function getAdRewardStatus(): { canWatch: boolean; cooldownMs: number } {
  if (typeof window === 'undefined') return { canWatch: false, cooldownMs: 0 };
  const lastTs = parseInt(localStorage.getItem(LAST_AD_WATCH_KEY) || '0', 10);
  const now = Date.now();
  const elapsed = now - lastTs;

  if (!lastTs || elapsed >= AD_COOLDOWN_MS) {
    return { canWatch: true, cooldownMs: 0 };
  }
  return { canWatch: false, cooldownMs: AD_COOLDOWN_MS - elapsed };
}

export async function claimAdWatchReward(): Promise<{ success: boolean; coins: number; message: string }> {
  const status = getAdRewardStatus();
  if (!status.canWatch) {
    const secs = Math.ceil(status.cooldownMs / 1000);
    return { success: false, coins: 0, message: `Next video available in ${secs}s.` };
  }

  const rewardCoins = 100;
  localStorage.setItem(LAST_AD_WATCH_KEY, Date.now().toString());

  await executeCoinTransaction({
    amount: rewardCoins,
    type: 'ad_reward',
    description: 'Rewarded Sponsor Video Watched (+100 Coins)',
    metadata: { provider: 'Simulated Ad Network' }
  });

  return {
    success: true,
    coins: rewardCoins,
    message: `Thank you for watching! +${rewardCoins} Coins credited instantly.`
  };
}

// ---------------------------------------------------------------------------
// 5. SOCIAL & VIRAL REFERRAL SYSTEM
// ---------------------------------------------------------------------------

const CLAIMED_REFERRALS_KEY = 'duo_chess_claimed_referrals';

export function getClaimedReferrals(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CLAIMED_REFERRALS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function generateUserReferralCode(username?: string): string {
  const base = (username || 'PLAYER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
  return `${base}2026`;
}

export async function claimReferralCode(code: string): Promise<{ success: boolean; coins: number; message: string }> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed || trimmed.length < 4) {
    return { success: false, coins: 0, message: 'Please enter a valid 6-character referral code.' };
  }

  const claimed = getClaimedReferrals();
  if (claimed.includes(trimmed)) {
    return { success: false, coins: 0, message: 'This referral code has already been claimed on this device.' };
  }

  const rewardCoins = 200;
  claimed.push(trimmed);
  localStorage.setItem(CLAIMED_REFERRALS_KEY, JSON.stringify(claimed));

  await executeCoinTransaction({
    amount: rewardCoins,
    type: 'referral',
    description: `Friend Referral Bonus - Code: ${trimmed} (+200 Coins)`,
    metadata: { referralCode: trimmed }
  });

  return {
    success: true,
    coins: rewardCoins,
    message: `Referral code verified! +${rewardCoins} Coins awarded to both you and your friend!`
  };
}

/**
 * Social share reward: awarded when sharing a victory card (+50 coins)
 */
export async function awardSocialShare(platform: string = 'General'): Promise<boolean> {
  const rewardCoins = 50;
  await executeCoinTransaction({
    amount: rewardCoins,
    type: 'social_share',
    description: `Social Victory Share on ${platform} (+50 Coins)`,
    metadata: { platform }
  });
  return true;
}
