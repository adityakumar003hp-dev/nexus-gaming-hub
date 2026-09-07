// ============================================================================
// FILE: game_fee_deduction.js
// DESCRIPTION: Dynamic Entry Fee Deduction Engine for All Game Modes
// ============================================================================

import { db, auth } from './firebase_config.js';
import { 
  doc, 
  onSnapshot, 
  runTransaction, 
  increment 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Central cache for all game mode entry fees (synced with Firestore)
export const gameFeeConfig = {
  QUICK_MATCH: 100,
  CHESS_PRO: 500,
  WHEEL_SPIN: 50,
  PASS_PLAY: 0
};

// ============================================================================
// 1. DYNAMIC FEE LISTENERS & UI SYNCHRONIZATION
// ============================================================================

/**
 * Syncs game entry fees from the admin platform_state in real time.
 */
export function initGameFeeListeners() {
  const economyRef = doc(db, "platform_state", "economy");

  // Real-time listener for admin fee changes
  onSnapshot(economyRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.gameEntryFeeCoins !== undefined) gameFeeConfig.QUICK_MATCH = Number(data.gameEntryFeeCoins);
      if (data.chessProFeeCoins !== undefined) gameFeeConfig.CHESS_PRO = Number(data.chessProFeeCoins);
      if (data.wheelSpinFeeCoins !== undefined) gameFeeConfig.WHEEL_SPIN = Number(data.wheelSpinFeeCoins);
      if (data.passAndPlayFeeCoins !== undefined) gameFeeConfig.PASS_PLAY = Number(data.passAndPlayFeeCoins);

      renderFeeLabelsOnUI();
    }
  }, (err) => console.error("Error listening to game fees:", err));

  // Real-time listener for user coin/gem balance
  auth.onAuthStateChanged((user) => {
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
  const quickMatchLabel = document.getElementById("labelQuickMatchFee");
  const chessProLabel = document.getElementById("labelChessProFee");
  const wheelSpinLabel = document.getElementById("labelWheelSpinFee");

  if (quickMatchLabel) quickMatchLabel.textContent = `${gameFeeConfig.QUICK_MATCH} Coins`;
  if (chessProLabel) chessProLabel.textContent = `${gameFeeConfig.CHESS_PRO} Coins`;
  if (wheelSpinLabel) wheelSpinLabel.textContent = `${gameFeeConfig.WHEEL_SPIN} Coins`;
}

/**
 * Updates all coin/gem displays on the screen.
 */
export function renderUserBalance(coins, gems) {
  document.querySelectorAll('.user-coin-balance').forEach(el => el.textContent = Number(coins).toLocaleString());
  document.querySelectorAll('.user-gem-balance').forEach(el => el.textContent = Number(gems).toLocaleString());
}

// ============================================================================
// 2. CORE FEE DEDUCTION ENGINE
// ============================================================================

/**
 * Atomically checks and deducts coins from user balance before starting a game.
 * @param {string} modeKey - "QUICK_MATCH" | "CHESS_PRO" | "WHEEL_SPIN" | "PASS_PLAY" | "TOURNAMENT"
 * @param {number|null} [customFee] - Optional custom entry fee override
 * @returns {Promise<boolean>} Success status
 */
export async function deductFeeForGame(modeKey, customFee = null) {
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

  } catch (error) {
    console.error(`[Fee Engine] Deduction Failed for ${modeKey}:`, error.message);
    alert(`❌ ${error.message}`);
    return false;
  }
}

// Convenience alias for deduction
export const deductGameEntryFee = deductFeeForGame;
export const initFeeSystemListeners = initGameFeeListeners;

// ============================================================================
// 3. GAME MODE ACTION BINDINGS
// ============================================================================

/**
 * Attaches entry fee logic to UI buttons for every game mode.
 */
export function bindGameFeeButtons() {
  // Quick Match Mode
  document.getElementById("btnQuickMatch")?.addEventListener("click", async () => {
    if (await deductFeeForGame("QUICK_MATCH")) {
      startQuickMatch();
    }
  });

  // Chess Pro Mode
  document.getElementById("btnChessPro")?.addEventListener("click", async () => {
    if (await deductFeeForGame("CHESS_PRO")) {
      startChessProMatch();
    }
  });

  // Wheel of Luck Spin
  document.getElementById("btnSpinWheel")?.addEventListener("click", async () => {
    if (await deductFeeForGame("WHEEL_SPIN")) {
      spinWheelOfLuck();
    }
  });

  // Pass & Play Mode (Free)
  document.getElementById("btnPassAndPlay")?.addEventListener("click", async () => {
    if (await deductFeeForGame("PASS_PLAY")) {
      startPassAndPlayMatch();
    }
  });
}

export const setupMatchButtons = bindGameFeeButtons;

// Handler Placeholders
function startQuickMatch() { console.log("🎮 Quick Match started!"); }
function startChessProMatch() { console.log("🏆 Chess Pro started!"); }
function spinWheelOfLuck() { console.log("🎡 Wheel of Luck spinning!"); }
function startPassAndPlayMatch() { console.log("♟️ Pass & Play started!"); }

// Global window attachment for easy accessibility
if (typeof window !== 'undefined') {
  window.GameFeeDeduction = {
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

// Initialize system listeners automatically
initGameFeeListeners();
