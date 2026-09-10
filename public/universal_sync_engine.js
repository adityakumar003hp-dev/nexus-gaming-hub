// ============================================================================
// FILE: universal_sync_engine.js
// Description: Universal Real-Time Admin-to-Game Synchronization System
// Works seamlessly for both Guest Accounts and Permanent Registered Users.
// ============================================================================

import { db, auth } from './firebase_config.js';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Global In-Memory Game State
window.GAME_STATE = window.GAME_STATE || {
  activeGame: "Draughts",
  entryFeeCoins: 2000,
  entryFeeGems: 2000,
  chatCooldown: 3,
  profanityFilter: true,
  isLockdownActive: false,
  broadcastMessage: ""
};

// ============================================================================
// 1. ADMIN WRITERS (Pushes Panel Changes Directly to Firestore)
// ============================================================================

/**
 * Syncs Economy & Fee changes from Admin Panel directly to global config
 */
export async function adminUpdateEconomyAndFees(coinsFee, gemsFee, activeGameName) {
  try {
    const globalRef = doc(db, "system", "global_config");
    await setDoc(globalRef, {
      entryFeeCoins: Number(coinsFee),
      entryFeeGems: Number(gemsFee),
      activeGame: activeGameName || window.GAME_STATE.activeGame,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser ? auth.currentUser.uid : "ADMIN"
    }, { merge: true });

    console.log("✅ Economy settings pushed to Firestore.");
  } catch (err) {
    console.error("❌ Admin Economy Write Failed:", err);
    alert(`Permission Denied or Network Error: ${err.message}`);
  }
}

/**
 * Syncs User Balance Adjustments (Coins/Gems) for Guest or Permanent User
 */
export async function adminAdjustUserBalance(targetUserId, coinDelta, gemDelta) {
  if (!targetUserId) {
    alert("Please enter or select a valid Target User ID.");
    return;
  }

  try {
    const userRef = doc(db, "users", targetUserId);
    await setDoc(userRef, {
      coins: Number(coinDelta),
      gems: Number(gemDelta),
      lastAdminAdjustment: new Date().toISOString()
    }, { merge: true });

    alert(`✅ Updated User (${targetUserId}) balance successfully!`);
  } catch (err) {
    console.error("❌ Admin User Balance Write Failed:", err);
    alert(`Failed to update balance: ${err.message}`);
  }
}

/**
 * Syncs Moderation & System Broadcasts
 */
export async function adminUpdateModeration(broadcastMsg, cooldownSec, enableFilter) {
  try {
    const modRef = doc(db, "system", "moderation");
    await setDoc(modRef, {
      broadcastMessage: broadcastMsg || "",
      chatCooldown: Number(cooldownSec) || 3,
      profanityFilter: Boolean(enableFilter),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    alert("📢 Moderation and Broadcast settings live-applied!");
  } catch (err) {
    console.error("❌ Admin Moderation Write Failed:", err);
  }
}

// ============================================================================
// 2. MAIN GAME LISTENERS (Instantly Applies Changes to Guest & Permanent Sessions)
// ============================================================================

/**
 * Real-time Global System Config Observer
 * Listens 24/7 on main app UI regardless of login type (Guest or Registered).
 */
export function startMainGameSyncListeners() {
  if (typeof window === 'undefined') return;

  // A. Listen to Global Fees & Active Game Switching
  const globalRef = doc(db, "system", "global_config");
  onSnapshot(globalRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();

    // Dynamically update game global memory
    if (data.entryFeeCoins !== undefined) window.GAME_STATE.entryFeeCoins = Number(data.entryFeeCoins);
    if (data.entryFeeGems !== undefined) window.GAME_STATE.entryFeeGems = Number(data.entryFeeGems);
    if (data.activeGame !== undefined) {
      window.GAME_STATE.activeGame = data.activeGame;
      if (typeof window.updateMainAppGameMode === 'function') {
        window.updateMainAppGameMode(data.activeGame);
      }
    }

    // Immediately update UI displays across main website
    updateGameFeeDisplaysInUI();

    // Dispatch event for React / custom listeners
    window.dispatchEvent(new CustomEvent('global_config_updated', { detail: data }));
  }, (err) => console.warn("universal_sync_engine global_config listener:", err));

  // B. Listen to Moderation & Global Broadcast Banner
  const modRef = doc(db, "system", "moderation");
  onSnapshot(modRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();

    if (data.chatCooldown !== undefined) window.GAME_STATE.chatCooldown = Number(data.chatCooldown);
    if (data.profanityFilter !== undefined) window.GAME_STATE.profanityFilter = Boolean(data.profanityFilter);
    if (data.broadcastMessage !== undefined) window.GAME_STATE.broadcastMessage = data.broadcastMessage;

    if (data.broadcastMessage && String(data.broadcastMessage).trim().length > 0) {
      showSystemBroadcastBanner(data.broadcastMessage);
    } else {
      const banner = document.getElementById("globalSystemBroadcastBanner");
      if (banner) banner.remove();
    }

    window.dispatchEvent(new CustomEvent('moderation_updated', { detail: data }));
  }, (err) => console.warn("universal_sync_engine moderation listener:", err));

  // C. Listen to Personal Account Balance Updates (Guest or Permanent)
  auth.onAuthStateChanged((user) => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      onSnapshot(userRef, (userSnap) => {
        if (!userSnap.exists()) return;
        const userData = userSnap.data();

        // Direct real-time balance UI update on main website header
        const coinsEl = document.getElementById("userCoinsDisplay");
        const gemsEl = document.getElementById("userGemsDisplay");

        if (coinsEl && userData.coins !== undefined) {
          coinsEl.textContent = Number(userData.coins).toLocaleString();
        }
        if (gemsEl && userData.gems !== undefined) {
          gemsEl.textContent = Number(userData.gems).toLocaleString();
        }

        // Notify app points/gems event listeners
        if (userData.coins !== undefined) {
          window.dispatchEvent(new CustomEvent('chess_points_updated', { detail: { points: Number(userData.coins) } }));
        }
        if (userData.gems !== undefined) {
          window.dispatchEvent(new CustomEvent('chess_gems_updated', { detail: { gems: Number(userData.gems) } }));
        }
      }, (err) => console.warn("universal_sync_engine user listener:", err));
    }
  });

  // Bind DOM elements if already present
  bindDomControls();
}

// ============================================================================
// 3. UI DOM UPDATERS
// ============================================================================

export function updateGameFeeDisplaysInUI() {
  // Finds and updates all entry fee cards in the game lobby
  const feeDisplays = document.querySelectorAll('.entry-fee-tag, .game-card-fee');
  feeDisplays.forEach(el => {
    el.textContent = `${window.GAME_STATE.entryFeeCoins.toLocaleString()} Coins / ${window.GAME_STATE.entryFeeGems.toLocaleString()} Gems`;
  });

  const entryFeeDisplay = document.getElementById('entryFeeDisplay');
  if (entryFeeDisplay) {
    entryFeeDisplay.textContent = `${window.GAME_STATE.entryFeeCoins.toLocaleString()} Coins / ${window.GAME_STATE.entryFeeGems.toLocaleString()} Gems`;
  }

  const quickFee = document.getElementById('labelQuickMatchFee');
  if (quickFee) {
    quickFee.textContent = `${window.GAME_STATE.entryFeeCoins.toLocaleString()} Coins / Gems`;
  }
  const chessProFee = document.getElementById('labelChessProFee');
  if (chessProFee) {
    chessProFee.textContent = `${window.GAME_STATE.entryFeeCoins.toLocaleString()} Coins / Gems`;
  }
}

export function showSystemBroadcastBanner(message) {
  let banner = document.getElementById("globalSystemBroadcastBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "globalSystemBroadcastBanner";
    banner.style.cssText = "position:fixed; top:0; left:0; width:100%; background:#ff9800; color:#000; text-align:center; padding:10px; font-weight:bold; z-index:99999; box-shadow: 0 4px 15px rgba(0,0,0,0.5); font-family: ui-sans-serif, system-ui, sans-serif;";
    document.body.prepend(banner);
  }
  banner.textContent = `📢 ANNOUNCEMENT: ${message}`;
}

/**
 * Attaches real-time bindings to standard admin input and button elements
 */
export function bindDomControls() {
  // Event Listener for "UPDATE PARAMETERS" Button in Economy Panel
  document.getElementById("btnUpdateEconomy")?.addEventListener("click", () => {
    const coinsInput = document.getElementById("inputCoinsFee");
    const gemsInput = document.getElementById("inputGemsFee");
    const coinsFee = coinsInput ? coinsInput.value : window.GAME_STATE.entryFeeCoins;
    const gemsFee = gemsInput ? gemsInput.value : window.GAME_STATE.entryFeeGems;
    
    // Saves directly to Firestore, triggers instant update on player screens
    adminUpdateEconomyAndFees(coinsFee, gemsFee);
  });

  // Event Listener for "SAVE ADJUSTMENTS" Button in User Panel
  document.getElementById("btnSaveUserAdjustments")?.addEventListener("click", () => {
    const targetUidInput = document.getElementById("inputTargetUserId");
    const coinsInput = document.getElementById("inputNewCoins");
    const gemsInput = document.getElementById("inputNewGems");

    const targetUid = targetUidInput ? targetUidInput.value : "";
    const newCoins = coinsInput ? coinsInput.value : "0";
    const newGems = gemsInput ? gemsInput.value : "0";

    adminAdjustUserBalance(targetUid, newCoins, newGems);
  });
}

// Expose functions globally for direct HTML/onclick compatibility
window.adminUpdateEconomyAndFees = adminUpdateEconomyAndFees;
window.adminAdjustUserBalance = adminAdjustUserBalance;
window.adminUpdateModeration = adminUpdateModeration;
window.startMainGameSyncListeners = startMainGameSyncListeners;
window.updateGameFeeDisplaysInUI = updateGameFeeDisplaysInUI;

// Automatically launch game listeners when website renders
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => {
      startMainGameSyncListeners();
    });
  } else {
    startMainGameSyncListeners();
  }
}
