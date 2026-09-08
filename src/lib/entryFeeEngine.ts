// ============================================================================
// FILE: src/lib/entryFeeEngine.ts
// Universal Game Switch & First-Move Entry Fee Manager
// ============================================================================

import { db, auth } from './firebase';
import { 
  doc, 
  runTransaction 
} from 'firebase/firestore';

// Default mandatory fee structure (Overridden dynamically if set in Admin Panel)
export const DEFAULT_ENTRY_FEE = {
  COINS: 2000,
  GEMS: 2000
};

// Global state interface
declare global {
  interface Window {
    CURRENT_ENTRY_FEE?: {
      coins: number;
      gems: number;
    };
    executeGameSwitchFee?: (newGameId: string, customCoinsFee?: number, customGemsFee?: number) => Promise<boolean>;
    executeFirstMoveWithFee?: (matchSessionId: string, movePayload: any) => Promise<{ success: boolean; error?: string }>;
  }
}

/**
 * 1. GAME SWITCHING FEE
 * Deducts currency when a user manually switches to a different game mode.
 * 
 * @param newGameId - ID of the game being switched to
 * @param customCoinsFee - Optional fee override (defaults to 1000)
 * @param customGemsFee - Optional fee override (defaults to 500)
 */
export async function executeGameSwitchFee(
  newGameId: string,
  customCoinsFee: number = DEFAULT_ENTRY_FEE.COINS,
  customGemsFee: number = DEFAULT_ENTRY_FEE.GEMS
): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert("❌ Please log in or continue as guest to switch games.");
    return false;
  }

  const userRef = doc(db, "users", currentUser.uid);

  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw new Error("User record not found.");

      const userData = userDoc.data();
      const currentCoins = userData.coins || 0;
      const currentGems = userData.gems || 0;

      if (currentCoins < customCoinsFee || currentGems < customGemsFee) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // Deduct switching fee
      transaction.update(userRef, {
        coins: currentCoins - customCoinsFee,
        gems: currentGems - customGemsFee,
        activeSelectedGame: newGameId,
        lastGameSwitchAt: new Date().toISOString()
      });
    });

    console.log(`✅ Switched to ${newGameId}. Fee deducted: ${customCoinsFee} Coins / ${customGemsFee} Gems.`);
    return true;

  } catch (error: any) {
    if (error?.message === "INSUFFICIENT_FUNDS") {
      alert(`⛔ Switch Blocked: Switching to this game requires ${customCoinsFee} Coins and ${customGemsFee} Gems.`);
    } else {
      console.error("Game switch error:", error);
      alert(`❌ Switch Error: ${error?.message || error}`);
    }
    return false;
  }
}

/**
 * 2. FIRST MOVE MATCH ENTRY FEE
 * Deducts entry fee on the first turn move inside any active match session.
 * 
 * @param matchSessionId - Unique ID of the current match session
 * @param movePayload - Data representing the move being executed
 */
export async function executeFirstMoveWithFee(
  matchSessionId: string,
  movePayload: any
): Promise<{ success: boolean; error?: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert("❌ Authentication required to make a move.");
    return { success: false, error: "Unauthenticated" };
  }

  const userId = currentUser.uid;
  const userRef = doc(db, "users", userId);
  const matchRef = doc(db, "matches", matchSessionId);

  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const matchDoc = await transaction.get(matchRef);

      if (!userDoc.exists()) throw new Error("User record missing.");

      const userData = userDoc.data();
      const matchData = matchDoc.exists() ? matchDoc.data() : { players: {} };

      // Check if entry fee was already collected for this user in this match
      const hasPaid = matchData.players && matchData.players[userId]?.feePaid === true;

      if (!hasPaid) {
        const requiredCoins = (typeof window !== 'undefined' && window.CURRENT_ENTRY_FEE?.coins) || DEFAULT_ENTRY_FEE.COINS;
        const requiredGems = (typeof window !== 'undefined' && window.CURRENT_ENTRY_FEE?.gems) || DEFAULT_ENTRY_FEE.GEMS;

        const currentCoins = userData.coins || 0;
        const currentGems = userData.gems || 0;

        if (currentCoins < requiredCoins || currentGems < requiredGems) {
          throw new Error("INSUFFICIENT_FUNDS");
        }

        // Deduct first-move match entry fee
        transaction.update(userRef, {
          coins: currentCoins - requiredCoins,
          gems: currentGems - requiredGems,
          lastMatchPlayedAt: new Date().toISOString()
        });

        // If match doc doesn't exist, create it; otherwise update
        if (!matchDoc.exists()) {
          transaction.set(matchRef, {
            id: matchSessionId,
            players: {
              [userId]: {
                feePaid: true,
                paidAmount: { coins: requiredCoins, gems: requiredGems }
              }
            },
            lastMove: movePayload,
            turnUserId: movePayload?.nextTurnUserId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          return;
        }

        // Mark fee as settled for this match
        transaction.update(matchRef, {
          [`players.${userId}.feePaid`]: true,
          [`players.${userId}.paidAmount`]: { coins: requiredCoins, gems: requiredGems }
        });
      }

      // Execute game move
      if (matchDoc.exists()) {
        transaction.update(matchRef, {
          lastMove: movePayload,
          turnUserId: movePayload?.nextTurnUserId || null,
          updatedAt: new Date().toISOString()
        });
      }
    });

    return { success: true };

  } catch (error: any) {
    if (error?.message === "INSUFFICIENT_FUNDS") {
      alert("⛔ Entry Fee Required: You need 2,000 Coins and 2,000 Gems to play your first move!");
    } else {
      console.error("Move execution failed:", error);
      alert(`❌ Move Execution Error: ${error?.message || error}`);
    }
    return { success: false, error: error?.message || String(error) };
  }
}

// Global window registration
if (typeof window !== 'undefined') {
  window.executeGameSwitchFee = executeGameSwitchFee;
  window.executeFirstMoveWithFee = executeFirstMoveWithFee;
  if (!window.CURRENT_ENTRY_FEE) {
    window.CURRENT_ENTRY_FEE = {
      coins: DEFAULT_ENTRY_FEE.COINS,
      gems: DEFAULT_ENTRY_FEE.GEMS
    };
  }
}
