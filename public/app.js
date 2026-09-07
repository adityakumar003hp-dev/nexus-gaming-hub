// ============================================================================
// FILE: app.js
// Client-Side Trigger Wiring for Dynamic Game Fee Deductions
// ============================================================================

import { db, auth } from './firebase_config.js';
import { 
  doc, 
  runTransaction, 
  increment 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Standard fallback game fees
export const GAME_FEES = {
  QUICK_MATCH: 100,
  CHESS_PRO: 500,
  WHEEL_SPIN: 50,
  PASS_PLAY: 0
};

/**
 * Deduct fee for a specific game mode using backend Firestore atomic transaction or client fallback
 */
export async function deductFeeForGame(modeKey, customFee = null) {
  const user = auth?.currentUser;

  // If user not signed in, check if window.GameFeeDeduction exists
  if (typeof window !== 'undefined' && window.GameFeeDeduction?.deductFeeForGame) {
    return await window.GameFeeDeduction.deductFeeForGame(modeKey, customFee);
  }

  if (!user) {
    alert("❌ Please sign in to play.");
    return false;
  }

  let requiredCoins = GAME_FEES[modeKey] !== undefined ? GAME_FEES[modeKey] : 100;
  if (customFee !== null && customFee >= 0) requiredCoins = Number(customFee);

  if (requiredCoins === 0) return true;

  // 1. Try backend server atomic Firestore route
  try {
    const res = await fetch('/api/deduct-fee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.uid,
        gameMode: modeKey,
        customFee: requiredCoins
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        console.log(`[Fee Engine Server] Deducted ${requiredCoins} Coins for ${modeKey}`);
        return true;
      }
      if (data.error && data.error.includes("Insufficient Coins")) {
        alert(`❌ ${data.error}`);
        return false;
      }
    }
  } catch (err) {
    console.warn("[Fee Engine] Server route fallback to client Firestore transaction:", err);
  }

  // 2. Client-side Firestore atomic transaction fallback
  try {
    const userRef = doc(db, "users", user.uid);
    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error("User record not found.");
      }
      const balance = userSnap.data().coins || 0;
      if (balance < requiredCoins) {
        throw new Error(`Insufficient coins! Required: ${requiredCoins} Coins. Balance: ${balance} Coins.`);
      }
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
    console.log(`[Fee Engine Client] Deducted ${requiredCoins} Coins for mode: ${modeKey}`);
    return true;
  } catch (error) {
    console.error(`[Fee Engine] Deduction Failed:`, error?.message || error);
    alert(`❌ ${error?.message || "Transaction failed"}`);
    return false;
  }
}

/**
 * Launch game mode handler with pre-match balance deduction
 */
export async function launchGameMode(modeKey) {
  // 1. Deduct fee via atomic transaction
  const feePaid = await deductFeeForGame(modeKey);

  if (!feePaid) {
    console.warn("Game launch aborted due to insufficient balance or auth error.");
    return;
  }

  // 2. Proceed with launching game board UI
  console.log(`Starting ${modeKey}...`);
  if (typeof window !== 'undefined' && window.updateMainAppGameMode) {
    window.updateMainAppGameMode(modeKey.toLowerCase());
  }
}

// Bind to game cards if DOM is present
if (typeof document !== 'undefined') {
  const initBindings = () => {
    document.getElementById("btnQuickMatch")?.addEventListener("click", () => launchGameMode("QUICK_MATCH"));
    document.getElementById("btnChessPro")?.addEventListener("click", () => launchGameMode("CHESS_PRO"));
    document.getElementById("btnSpinWheel")?.addEventListener("click", () => launchGameMode("WHEEL_SPIN"));
    document.getElementById("btnPassAndPlay")?.addEventListener("click", () => launchGameMode("PASS_PLAY"));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBindings);
  } else {
    initBindings();
  }
}
