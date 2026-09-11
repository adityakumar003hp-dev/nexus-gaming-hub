// src/lib/gameFeeDeduction.ts
// TypeScript bridge for Dynamic Entry Fee Deduction Engine for All Game Modes

import { db, auth } from './firebase';
import { 
  doc, 
  onSnapshot, 
  runTransaction, 
  increment 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { GameEconomy } from '../utils/gameEconomy';

// Central cache for all game mode entry fees (synced with Firestore)
export const gameFeeConfig: Record<string, number> = {
  QUICK_MATCH: 2000,
  CHESS_PRO: 2000,
  WHEEL_SPIN: 50,
  PASS_PLAY: 0
};

/**
 * Syncs game entry fees from the admin platform_state in real time.
 */
export function initGameFeeListeners() {
  if (typeof window === 'undefined') return;

  const economyRef = doc(db, "platform_state", "economy");

  // Real-time listener for admin fee changes from Firestore
  onSnapshot(economyRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      const coins = Number(data.gameEntryFeeCoins ?? data.entryFeeCoins ?? gameFeeConfig.QUICK_MATCH);
      const gems = Number(data.gameEntryFeeGems ?? data.entryFeeGems ?? coins);
      const isFree = data.isFreeMode === true || data.freeMode === true;

      gameFeeConfig.QUICK_MATCH = coins;
      gameFeeConfig.CHESS_PRO = Number(data.chessProFeeCoins ?? coins);
      if (data.wheelSpinFeeCoins !== undefined) gameFeeConfig.WHEEL_SPIN = Number(data.wheelSpinFeeCoins);
      if (data.passAndPlayFeeCoins !== undefined) gameFeeConfig.PASS_PLAY = Number(data.passAndPlayFeeCoins);

      GameEconomy.setFees(coins, gems, isFree, data.gameOverrides || data.gameFeeOverrides);
      renderFeeLabelsOnUI();
    }
  }, (err) => console.error("Error listening to game fees:", err));

  // Also listen for immediate client-side event dispatches from AdminPanel
  window.addEventListener('admin_fee_updated', () => {
    gameFeeConfig.QUICK_MATCH = GameEconomy.getFeeCoins();
    gameFeeConfig.CHESS_PRO = GameEconomy.getFeeCoins();
    renderFeeLabelsOnUI();
  });
  window.addEventListener('admin_economy_updated', () => {
    gameFeeConfig.QUICK_MATCH = GameEconomy.getFeeCoins();
    gameFeeConfig.CHESS_PRO = GameEconomy.getFeeCoins();
    renderFeeLabelsOnUI();
  });

  // Real-time listener for user coin/gem balance
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          renderUserBalance(userData.coins || 0, userData.gems || 0);
        }
      });
    }
  });
}

/**
 * Updates UI labels showing entry fees across the lobby.
 */
export function renderFeeLabelsOnUI() {
  if (typeof document === 'undefined') return;

  const isFree = GameEconomy.isFreeMode();
  const feeCoins = isFree ? 0 : GameEconomy.getFeeCoins();
  const feeGems = isFree ? 0 : GameEconomy.getFeeGems();
  const isZero = isFree || (feeCoins === 0 && feeGems === 0);

  const feeBadgeText = isZero
    ? 'Free (0 Coins)'
    : `${feeCoins.toLocaleString()} Coins${feeGems > 0 ? ` / ${feeGems.toLocaleString()} Gems` : ''}`;

  const quickMatchLabel = document.getElementById("labelQuickMatchFee");
  const chessProLabel = document.getElementById("labelChessProFee");
  const entryFeeDisplay = document.getElementById("entryFeeDisplay");
  const wheelSpinLabel = document.getElementById("labelWheelSpinFee");

  if (quickMatchLabel) quickMatchLabel.textContent = feeBadgeText;
  if (entryFeeDisplay) entryFeeDisplay.textContent = feeBadgeText;
  if (chessProLabel) chessProLabel.textContent = feeBadgeText;
  if (wheelSpinLabel) wheelSpinLabel.textContent = `${gameFeeConfig.WHEEL_SPIN} Coins`;
}

/**
 * Updates all coin/gem displays on the screen.
 */
export function renderUserBalance(coins: number, gems: number) {
  document.querySelectorAll('.user-coin-balance').forEach(el => {
    el.textContent = Number(coins).toLocaleString();
  });
  document.querySelectorAll('.user-gem-balance').forEach(el => {
    el.textContent = Number(gems).toLocaleString();
  });
}

/**
 * Atomically checks and deducts coins from user balance before starting a game.
 * @param modeKey - "QUICK_MATCH" | "CHESS_PRO" | "WHEEL_SPIN" | "PASS_PLAY" | "TOURNAMENT"
 * @param customFee - Optional custom entry fee override
 * @returns Success status
 */
export async function deductFeeForGame(modeKey: string, customFee: number | null = null): Promise<boolean> {
  const user = auth.currentUser;
  
  if (!user) {
    alert("❌ Please sign in to play.");
    return false;
  }

  // Calculate required fee for the selected mode
  let requiredCoins = gameFeeConfig[modeKey] !== undefined ? gameFeeConfig[modeKey] : 100;
  if (customFee !== null && customFee >= 0) requiredCoins = Number(customFee);

  // Free modes bypass backend deduction
  if (requiredCoins === 0) return true;

  // 1. Attempt server-side atomic Firestore transaction via /api/deduct-fee
  try {
    const response = await fetch('/api/deduct-fee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.uid,
        gameMode: modeKey,
        customFee: requiredCoins
      })
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log(`[Fee Engine] Server deducted ${requiredCoins} Coins for ${modeKey}`);
        return true;
      }
      if (data.error && data.error.includes("Insufficient Coins")) {
        alert(`❌ ${data.error}`);
        return false;
      }
    }
  } catch (apiErr) {
    console.warn("[Fee Engine] API endpoint unavailable, falling back to client transaction:", apiErr);
  }

  // 2. Client-side atomic transaction fallback
  const userRef = doc(db, "users", user.uid);

  try {
    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error("User record not found.");
      }

      const currentBalance = userSnap.data().coins || 0;

      if (currentBalance < requiredCoins) {
        throw new Error(`Insufficient coins! Required: ${requiredCoins} Coins. Balance: ${currentBalance} Coins.`);
      }

      // Deduct coins atomically
      transaction.update(userRef, {
        coins: increment(-requiredCoins),
        "stats.totalSpent": increment(requiredCoins),
        lastDeduction: {
          gameMode: modeKey,
          amount: requiredCoins,
          timestamp: new Date().toISOString()
        }
      });
    });

    console.log(`[Fee Engine] Deducted ${requiredCoins} Coins for mode: ${modeKey}`);
    return true;

  } catch (error: any) {
    console.error(`[Fee Engine] Deduction Failed for ${modeKey}:`, error?.message || error);
    alert(`❌ ${error?.message || 'Transaction failed'}`);
    return false;
  }
}

export const deductGameEntryFee = deductFeeForGame;
export const initFeeSystemListeners = initGameFeeListeners;

/**
 * Attaches entry fee logic to UI buttons for every game mode.
 */
export function bindGameFeeButtons() {
  if (typeof document === 'undefined') return;

  // Quick Match Mode
  document.getElementById("btnQuickMatch")?.addEventListener("click", async () => {
    if (await deductFeeForGame("QUICK_MATCH")) {
      console.log("🎮 Quick Match started!");
    }
  });

  // Chess Pro Mode
  document.getElementById("btnChessPro")?.addEventListener("click", async () => {
    if (await deductFeeForGame("CHESS_PRO")) {
      console.log("🏆 Chess Pro started!");
    }
  });

  // Wheel of Luck Spin
  document.getElementById("btnSpinWheel")?.addEventListener("click", async () => {
    if (await deductFeeForGame("WHEEL_SPIN")) {
      console.log("🎡 Wheel of Luck spinning!");
    }
  });

  // Pass & Play Mode (Free)
  document.getElementById("btnPassAndPlay")?.addEventListener("click", async () => {
    if (await deductFeeForGame("PASS_PLAY")) {
      console.log("♟️ Pass & Play started!");
    }
  });
}

export const setupMatchButtons = bindGameFeeButtons;

// Global window attachment for easy accessibility
if (typeof window !== 'undefined') {
  (window as any).GameFeeDeduction = {
    gameFeeConfig,
    initGameFeeListeners,
    renderFeeLabelsOnUI,
    renderUserBalance,
    deductFeeForGame,
    deductGameEntryFee,
    bindGameFeeButtons,
    setupMatchButtons
  };
}

// Auto-initialize system listeners
initGameFeeListeners();
