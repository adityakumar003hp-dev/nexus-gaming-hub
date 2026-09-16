// ============================================================================
// 🏆 MATCH REWARD & PENALTY SETTLEMENT ENGINE
// ============================================================================
// Reward & Penalty Rules:
// 1st position: +50,000 coins and +5,000 gems
// 2nd position: +20,000 coins and +2,000 gems
// 3rd position: +10,000 coins and +1,000 gems
// 4th position: +5,000 coins and +500 gems
// 5th position or lower: -10,000 coins and -50,000 gems deducted
// Losing (defeat entirely): -50,000 coins and -50,000 gems deducted
// ============================================================================

import { getUserPoints, setUserPoints, getUserGems, setUserGems } from './pointsManager';
import { BadgeSystem } from '../data/badgeSystem';
import { soundFx } from './audio';

export interface MatchRewardResult {
  coinsDelta: number;
  gemsDelta: number;
  statusText: string;
}

export interface MatchSettlementPayload {
  userId?: string;
  rank: number;
  isWinner: boolean;
  gameId?: string;
  opponentName?: string;
}

export interface MatchSettlementSummary extends MatchRewardResult {
  rank: number;
  isWinner: boolean;
  gameId?: string;
  newCoins: number;
  newGems: number;
  coinsDeducted?: number;
  gemsDeducted?: number;
}

/**
 * Pure calculation function according to exact specification
 */
export function calculateMatchRewards(rank: number, isWinner: boolean): MatchRewardResult {
  // If the player lost the match entirely
  if (!isWinner) {
    return {
      coinsDelta: -50000,
      gemsDelta: -50000,
      statusText: 'Defeat: 50,000 coins & 50,000 gems deducted.',
    };
  }

  // Win positions
  switch (rank) {
    case 1:
      return {
        coinsDelta: 50000,
        gemsDelta: 5000,
        statusText: '1st Place! +50,000 coins, +5,000 gems',
      };
    case 2:
      return {
        coinsDelta: 20000,
        gemsDelta: 2000,
        statusText: '2nd Place! +20,000 coins, +2,000 gems',
      };
    case 3:
      return {
        coinsDelta: 10000,
        gemsDelta: 1000,
        statusText: '3rd Place! +10,000 coins, +1,000 gems',
      };
    case 4:
      return {
        coinsDelta: 5000,
        gemsDelta: 500,
        statusText: '4th Place! +5,000 coins, +500 gems',
      };
    default:
      // 5th position or lower
      return {
        coinsDelta: -10000,
        gemsDelta: -50000,
        statusText: '5th Place or lower: 10,000 coins & 50,000 gems deducted.',
      };
  }
}

/**
 * Applies match settlement on client, updates wallet safely (preventing balances below zero),
 * fires BadgeSystem achievements, dispatches synchronization events, and calls backend API.
 */
export function applyMatchSettlement(params: MatchSettlementPayload): MatchSettlementSummary {
  const { rank, isWinner, gameId = 'match', userId } = params;
  const settlement = calculateMatchRewards(rank, isWinner);

  const currentCoins = getUserPoints();
  const currentGems = getUserGems();

  // Prevent balances from dropping below zero
  const updatedCoins = Math.max(0, currentCoins + settlement.coinsDelta);
  const updatedGems = Math.max(0, currentGems + settlement.gemsDelta);

  const actualCoinsDeducted = settlement.coinsDelta < 0 ? currentCoins - updatedCoins : 0;
  const actualGemsDeducted = settlement.gemsDelta < 0 ? currentGems - updatedGems : 0;

  // 1. Commit new balances to local storage & points engine
  setUserPoints(
    updatedCoins,
    isWinner
      ? `Rank ${rank} Victory Reward in ${gameId}`
      : `Match Defeat Penalty in ${gameId} (-50k Coins & -50k Gems)`
  );
  setUserGems(
    updatedGems,
    isWinner
      ? `Rank ${rank} Victory Reward in ${gameId}`
      : `Match Defeat Penalty in ${gameId} (-50k Coins & -50k Gems)`
  );

  // 2. Play appropriate audio feedback
  if (isWinner && settlement.coinsDelta > 0) {
    soundFx.playWin();
  } else {
    soundFx.playGameOver(false);
  }

  // 3. Trigger Badge & Achievement Engine checks
  try {
    if (isWinner) {
      BadgeSystem.event('MATCH_WON', { gameType: gameId, rank });
      if (rank === 1) {
        BadgeSystem.event('1ST_PLACE_WIN', { gameType: gameId });
        BadgeSystem.event('TOURNAMENT_WON', { gameType: gameId });
      }
      if (settlement.coinsDelta > 0) {
        BadgeSystem.event('COINS_EARNED', { amount: settlement.coinsDelta });
      }
      if (settlement.gemsDelta > 0) {
        BadgeSystem.event('GEMS_EARNED', { amount: settlement.gemsDelta });
      }
    } else {
      BadgeSystem.event('MATCH_LOST', { gameType: gameId, rank });
      if (actualCoinsDeducted > 0) {
        BadgeSystem.event('COINS_SPENT', { amount: actualCoinsDeducted });
      }
    }
  } catch (err) {
    console.warn('[BadgeSystem Match Hook Warning]:', err);
  }

  const summary: MatchSettlementSummary = {
    ...settlement,
    rank,
    isWinner,
    gameId,
    newCoins: updatedCoins,
    newGems: updatedGems,
    coinsDeducted: actualCoinsDeducted,
    gemsDeducted: actualGemsDeducted,
  };

  // 4. Notify frontend listeners via CustomEvent
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('match:settlement', {
        detail: summary,
      })
    );
  }

  // 5. Asynchronously synchronize with server-side backend API
  if (typeof window !== 'undefined') {
    const activeUserId = userId || localStorage.getItem('chess_master_hub_active_user_id') || 'guest_user';
    fetch('/api/match/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: activeUserId,
        rank,
        isWinner,
        gameId,
      }),
    }).catch(() => {
      // Offline / background resilient
    });
  }

  return summary;
}
