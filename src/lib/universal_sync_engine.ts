// ============================================================================
// FILE: src/lib/universal_sync_engine.ts
// Description: Universal Real-Time Admin-to-Game Synchronization System
// Works seamlessly for both Guest Accounts and Permanent Registered Users.
// ============================================================================

import { db, auth } from './firebase';
import { 
  doc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';

export interface UniversalGameState {
  activeGame: string;
  entryFeeCoins: number;
  entryFeeGems: number;
  chatCooldown: number;
  profanityFilter: boolean;
  isLockdownActive: boolean;
  broadcastMessage: string;
}

declare global {
  interface Window {
    GAME_STATE?: UniversalGameState;
    adminUpdateEconomyAndFees?: (coinsFee: number | string, gemsFee: number | string, activeGameName?: string) => Promise<void>;
    adminAdjustUserBalance?: (targetUserId: string, coinDelta: number | string, gemDelta: number | string) => Promise<void>;
    adminUpdateModeration?: (broadcastMsg: string, cooldownSec?: number | string, enableFilter?: boolean) => Promise<void>;
    startMainGameSyncListeners?: () => void;
    updateGameFeeDisplaysInUI?: () => void;
  }
}

// Global In-Memory Game State
if (typeof window !== 'undefined') {
  window.GAME_STATE = window.GAME_STATE || {
    activeGame: "Draughts",
    entryFeeCoins: 2000,
    entryFeeGems: 2000,
    chatCooldown: 3,
    profanityFilter: true,
    isLockdownActive: false,
    broadcastMessage: ""
  };
}

export const getGameState = (): UniversalGameState => {
  if (typeof window !== 'undefined' && window.GAME_STATE) {
    return window.GAME_STATE;
  }
  return {
    activeGame: "Draughts",
    entryFeeCoins: 2000,
    entryFeeGems: 2000,
    chatCooldown: 3,
    profanityFilter: true,
    isLockdownActive: false,
    broadcastMessage: ""
  };
};

// ============================================================================
// 1. ADMIN WRITERS (Pushes Panel Changes Directly to Firestore)
// ============================================================================

/**
 * Syncs Economy & Fee changes from Admin Panel directly to global config
 */
export async function adminUpdateEconomyAndFees(
  coinsFee: number | string, 
  gemsFee: number | string, 
  activeGameName?: string
): Promise<void> {
  try {
    const coins = Number(coinsFee);
    const gems = Number(gemsFee);
    const currentGame = activeGameName || (typeof window !== 'undefined' && window.GAME_STATE ? window.GAME_STATE.activeGame : "Draughts");

    // Update in-memory state immediately for instant feedback
    if (typeof window !== 'undefined' && window.GAME_STATE) {
      window.GAME_STATE.entryFeeCoins = coins;
      window.GAME_STATE.entryFeeGems = gems;
      if (activeGameName) window.GAME_STATE.activeGame = activeGameName;
      updateGameFeeDisplaysInUI();
    }

    const globalRef = doc(db, "system", "global_config");
    await setDoc(globalRef, {
      entryFeeCoins: coins,
      entryFeeGems: gems,
      activeGame: currentGame,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser ? auth.currentUser.uid : "ADMIN"
    }, { merge: true });

    // Also sync to platform_state/economy for legacy listeners
    const platformEconomyRef = doc(db, "platform_state", "economy");
    await setDoc(platformEconomyRef, {
      gameEntryFeeCoins: coins,
      gameEntryFeeGems: gems,
      updatedAt: new Date().toISOString()
    }, { merge: true }).catch(() => {});

    console.log("✅ Economy settings pushed to Firestore.");
  } catch (err: any) {
    console.error("❌ Admin Economy Write Failed:", err);
    if (typeof window !== 'undefined') {
      alert(`Permission Denied or Network Error: ${err?.message || err}`);
    }
  }
}

/**
 * Syncs User Balance Adjustments (Coins/Gems) for Guest or Permanent User
 */
export async function adminAdjustUserBalance(
  targetUserId: string, 
  coinDelta: number | string, 
  gemDelta: number | string
): Promise<void> {
  if (!targetUserId || !targetUserId.trim()) {
    if (typeof window !== 'undefined') {
      alert("Please enter or select a valid Target User ID.");
    }
    return;
  }

  const cleanUserId = targetUserId.trim();
  const coinsNum = Number(coinDelta);
  const gemsNum = Number(gemDelta);

  try {
    const userRef = doc(db, "users", cleanUserId);
    await setDoc(userRef, {
      coins: coinsNum,
      gems: gemsNum,
      lastAdminAdjustment: new Date().toISOString()
    }, { merge: true });

    // Notify local user if current session matches target user
    if (auth.currentUser && auth.currentUser.uid === cleanUserId) {
      window.dispatchEvent(new CustomEvent('chess_points_updated', { detail: { points: coinsNum } }));
      window.dispatchEvent(new CustomEvent('chess_gems_updated', { detail: { gems: gemsNum } }));
    }

    if (typeof window !== 'undefined') {
      alert(`✅ Updated User (${cleanUserId}) balance successfully!`);
    }
  } catch (err: any) {
    console.error("❌ Admin User Balance Write Failed:", err);
    if (typeof window !== 'undefined') {
      alert(`Failed to update balance: ${err?.message || err}`);
    }
  }
}

/**
 * Syncs Moderation & System Broadcasts
 */
export async function adminUpdateModeration(
  broadcastMsg: string, 
  cooldownSec?: number | string, 
  enableFilter?: boolean
): Promise<void> {
  try {
    const cooldown = Number(cooldownSec) || 3;
    const filterEnabled = enableFilter !== undefined ? Boolean(enableFilter) : true;

    // Update in-memory state
    if (typeof window !== 'undefined' && window.GAME_STATE) {
      window.GAME_STATE.broadcastMessage = broadcastMsg || "";
      window.GAME_STATE.chatCooldown = cooldown;
      window.GAME_STATE.profanityFilter = filterEnabled;
    }

    const modRef = doc(db, "system", "moderation");
    await setDoc(modRef, {
      broadcastMessage: broadcastMsg || "",
      chatCooldown: cooldown,
      profanityFilter: filterEnabled,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Also sync to platform_state/moderation
    const legacyModRef = doc(db, "platform_state", "moderation");
    await setDoc(legacyModRef, {
      globalBroadcast: broadcastMsg || "",
      slowModeSeconds: cooldown,
      autoFilter: filterEnabled,
      updatedAt: new Date().toISOString()
    }, { merge: true }).catch(() => {});

    if (broadcastMsg && broadcastMsg.trim().length > 0) {
      showSystemBroadcastBanner(broadcastMsg);
    } else {
      const banner = document.getElementById("globalSystemBroadcastBanner");
      if (banner) banner.remove();
    }

    if (typeof window !== 'undefined') {
      alert("📢 Moderation and Broadcast settings live-applied!");
    }
  } catch (err) {
    console.error("❌ Admin Moderation Write Failed:", err);
  }
}

// ============================================================================
// 2. MAIN GAME LISTENERS (Instantly Applies Changes to Guest & Permanent Sessions)
// ============================================================================

let listenersInitialized = false;

/**
 * Real-time Global System Config Observer
 * Listens 24/7 on main app UI regardless of login type (Guest or Registered).
 */
export function startMainGameSyncListeners(): void {
  if (typeof window === 'undefined') return;
  if (listenersInitialized) return;
  listenersInitialized = true;

  // A. Listen to Global Fees & Active Game Switching
  const globalRef = doc(db, "system", "global_config");
  onSnapshot(globalRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();

    if (window.GAME_STATE) {
      // Dynamically update game global memory
      if (data.entryFeeCoins !== undefined) window.GAME_STATE.entryFeeCoins = Number(data.entryFeeCoins);
      if (data.entryFeeGems !== undefined) window.GAME_STATE.entryFeeGems = Number(data.entryFeeGems);
      if (data.activeGame !== undefined) {
        window.GAME_STATE.activeGame = data.activeGame;
        if (typeof window.updateMainAppGameMode === 'function') {
          window.updateMainAppGameMode(data.activeGame);
        }
      }
    }

    // Immediately update UI displays across main website
    updateGameFeeDisplaysInUI();

    // Trigger custom events so React modules re-render effortlessly
    window.dispatchEvent(new CustomEvent('global_config_updated', { detail: data }));
  }, (err) => console.warn("universal_sync_engine global_config listener:", err));

  // B. Listen to Moderation & Global Broadcast Banner
  const modRef = doc(db, "system", "moderation");
  onSnapshot(modRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();

    if (window.GAME_STATE) {
      if (data.chatCooldown !== undefined) window.GAME_STATE.chatCooldown = Number(data.chatCooldown);
      if (data.profanityFilter !== undefined) window.GAME_STATE.profanityFilter = Boolean(data.profanityFilter);
      if (data.broadcastMessage !== undefined) window.GAME_STATE.broadcastMessage = data.broadcastMessage;
    }

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

  // Attach DOM button listener bindings if DOM elements exist
  bindDomControls();
}

// ============================================================================
// 3. UI DOM UPDATERS
// ============================================================================

export function updateGameFeeDisplaysInUI(): void {
  if (typeof document === 'undefined' || !window.GAME_STATE) return;

  const coins = window.GAME_STATE.entryFeeCoins;
  const gems = window.GAME_STATE.entryFeeGems;

  // Finds and updates all entry fee cards in the game lobby
  const feeDisplays = document.querySelectorAll('.entry-fee-tag, .game-card-fee');
  feeDisplays.forEach(el => {
    el.textContent = `${coins.toLocaleString()} Coins / ${gems.toLocaleString()} Gems`;
  });

  const entryFeeDisplay = document.getElementById('entryFeeDisplay');
  if (entryFeeDisplay) {
    entryFeeDisplay.textContent = `${coins.toLocaleString()} Coins / ${gems.toLocaleString()} Gems`;
  }

  const quickFee = document.getElementById('labelQuickMatchFee');
  if (quickFee) {
    quickFee.textContent = `${coins.toLocaleString()} Coins / Gems`;
  }

  const chessProFee = document.getElementById('labelChessProFee');
  if (chessProFee) {
    chessProFee.textContent = `${coins.toLocaleString()} Coins / Gems`;
  }
}

export function showSystemBroadcastBanner(message: string): void {
  if (typeof document === 'undefined') return;

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
export function bindDomControls(): void {
  if (typeof document === 'undefined') return;

  // Event Listener for "UPDATE PARAMETERS" Button in Economy Panel
  const btnUpdate = document.getElementById("btnUpdateEconomy");
  if (btnUpdate && !(btnUpdate as any)._hasSyncListener) {
    (btnUpdate as any)._hasSyncListener = true;
    btnUpdate.addEventListener("click", () => {
      const coinsInput = document.getElementById("inputCoinsFee") as HTMLInputElement | null;
      const gemsInput = document.getElementById("inputGemsFee") as HTMLInputElement | null;
      const coinsFee = coinsInput ? coinsInput.value : (window.GAME_STATE?.entryFeeCoins ?? 2000);
      const gemsFee = gemsInput ? gemsInput.value : (window.GAME_STATE?.entryFeeGems ?? 2000);
      
      // Saves directly to Firestore, triggers instant update on player screens
      adminUpdateEconomyAndFees(coinsFee, gemsFee);
    });
  }

  // Event Listener for "SAVE ADJUSTMENTS" Button in User Panel
  const btnSave = document.getElementById("btnSaveUserAdjustments");
  if (btnSave && !(btnSave as any)._hasSyncListener) {
    (btnSave as any)._hasSyncListener = true;
    btnSave.addEventListener("click", () => {
      const targetUidInput = document.getElementById("inputTargetUserId") as HTMLInputElement | null;
      const coinsInput = document.getElementById("inputNewCoins") as HTMLInputElement | null;
      const gemsInput = document.getElementById("inputNewGems") as HTMLInputElement | null;

      const targetUid = targetUidInput ? targetUidInput.value : "";
      const newCoins = coinsInput ? coinsInput.value : "0";
      const newGems = gemsInput ? gemsInput.value : "0";

      adminAdjustUserBalance(targetUid, newCoins, newGems);
    });
  }
}

// Expose on window object
if (typeof window !== 'undefined') {
  window.adminUpdateEconomyAndFees = adminUpdateEconomyAndFees;
  window.adminAdjustUserBalance = adminAdjustUserBalance;
  window.adminUpdateModeration = adminUpdateModeration;
  window.startMainGameSyncListeners = startMainGameSyncListeners;
  window.updateGameFeeDisplaysInUI = updateGameFeeDisplaysInUI;

  if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => {
      startMainGameSyncListeners();
    });
  } else {
    startMainGameSyncListeners();
  }
}
