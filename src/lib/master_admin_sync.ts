// ============================================================================
// FILE: src/lib/master_admin_sync.ts
// Universal Admin Panel Sync System (Covers 100% of Admin Panel Elements)
// Works seamlessly for React, TypeScript, and Vanilla contexts across both Guest and Permanent Accounts.
// ============================================================================

import { db, auth } from './firebase';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  collection, 
  onSnapshot 
} from 'firebase/firestore';

export interface AdminSyncState {
  economy: {
    entryFeeCoins?: number;
    entryFeeGems?: number;
    coinsPerGemRate?: number;
    jackpotPool?: number;
    [key: string]: any;
  };
  moderation: {
    globalBroadcast?: string;
    chatCooldown?: number;
    autoFilterEnabled?: boolean;
    [key: string]: any;
  };
  tournaments: Array<Record<string, any>>;
  clans: Array<Record<string, any>>;
  lockdown: boolean;
}

declare global {
  interface Window {
    ADMIN_SYNC_STATE?: AdminSyncState;
    executeAdminUserAction?: (targetUserId: string, actionData: Record<string, any>) => Promise<void>;
    saveEconomySettings?: (coinsFee: number | string, gemsFee: number | string, exchangeRate: number | string, jackpotPool: number | string) => Promise<void>;
    saveModerationSettings?: (broadcastText: string, cooldownSeconds: number | string, isFilterOn: boolean) => Promise<void>;
    createGlobalTournament?: (tournamentPayload: any) => Promise<void>;
    updateClanStatus?: (clanId: string, isApproved: boolean, banReason?: string) => Promise<void>;
    setEmergencyLockdown?: (isEngaged: boolean, durationMins?: number | string, reasonText?: string) => Promise<void>;
    initUniversalGameListeners?: () => void;
    renderLobbyTournaments?: (tournaments: any[]) => void;
  }
}

// Initialize global sync state
if (typeof window !== 'undefined') {
  window.ADMIN_SYNC_STATE = window.ADMIN_SYNC_STATE || {
    economy: {},
    moderation: {},
    tournaments: [],
    clans: [],
    lockdown: false
  };
}

// ============================================================================
// 1. UNIVERSAL ADMIN WRITING ENGINE (Pushes Panel Actions Live)
// ============================================================================

/**
 * A. USER MANAGEMENT (Direct Balance Grant, Ban, Mute, Kick)
 */
export async function executeAdminUserAction(targetUserId: string, actionData: Record<string, any>): Promise<void> {
  if (!targetUserId || !targetUserId.trim()) {
    if (typeof window !== 'undefined') alert("❌ Please select or enter a valid target user.");
    return;
  }

  const cleanUserId = targetUserId.trim();

  try {
    const userRef = doc(db, "users", cleanUserId);
    await setDoc(userRef, {
      ...actionData,
      lastAdminActionAt: new Date().toISOString(),
      updatedBy: auth.currentUser ? auth.currentUser.uid : "ADMIN"
    }, { merge: true });

    // Local notification and trigger
    if (auth.currentUser && auth.currentUser.uid === cleanUserId) {
      if (actionData.coins !== undefined) {
        window.dispatchEvent(new CustomEvent('chess_points_updated', { detail: { points: Number(actionData.coins) } }));
      }
      if (actionData.gems !== undefined) {
        window.dispatchEvent(new CustomEvent('chess_gems_updated', { detail: { gems: Number(actionData.gems) } }));
      }
    }

    if (typeof window !== 'undefined') {
      alert(`✅ Action successfully applied to User: ${cleanUserId}`);
    }
  } catch (err: any) {
    console.error("User Action Error:", err);
    if (typeof window !== 'undefined') {
      alert(`❌ Failed to update user: ${err?.message || err}`);
    }
  }
}

/**
 * B. ECONOMY & GLOBAL FEES (Entry Fees, Exchange Rates, Jackpots)
 */
export async function saveEconomySettings(
  coinsFee: number | string, 
  gemsFee: number | string, 
  exchangeRate: number | string, 
  jackpotPool: number | string
): Promise<void> {
  try {
    const coins = Number(coinsFee);
    const gems = Number(gemsFee);
    const rate = Number(exchangeRate);
    const jackpot = Number(jackpotPool);

    // Write to system/economy
    const econRef = doc(db, "system", "economy");
    await setDoc(econRef, {
      entryFeeCoins: coins,
      entryFeeGems: gems,
      coinsPerGemRate: rate,
      jackpotPool: jackpot,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Also mirror to system/global_config for universal_sync_engine compatibility
    const globalRef = doc(db, "system", "global_config");
    await setDoc(globalRef, {
      entryFeeCoins: coins,
      entryFeeGems: gems,
      updatedAt: new Date().toISOString()
    }, { merge: true }).catch(() => {});

    // Update in-memory and UI fee displays immediately
    if (typeof window !== 'undefined') {
      if (window.ADMIN_SYNC_STATE) {
        window.ADMIN_SYNC_STATE.economy = { entryFeeCoins: coins, entryFeeGems: gems, coinsPerGemRate: rate, jackpotPool: jackpot };
      }
      if (window.GAME_STATE) {
        window.GAME_STATE.entryFeeCoins = coins;
        window.GAME_STATE.entryFeeGems = gems;
      }
      document.querySelectorAll(".game-entry-fee-display, .entry-fee-tag, .game-card-fee").forEach(el => {
        el.textContent = `${coins.toLocaleString()} Coins / ${gems.toLocaleString()} Gems`;
      });
      const entryFeeDisplay = document.getElementById("entryFeeDisplay");
      if (entryFeeDisplay) entryFeeDisplay.textContent = `${coins.toLocaleString()} Coins / ${gems.toLocaleString()} Gems`;
    }

    if (typeof window !== 'undefined') {
      alert("✅ Economy settings applied globally!");
    }
  } catch (err: any) {
    console.error("Economy Update Error:", err);
    if (typeof window !== 'undefined') {
      alert(`❌ Economy Update Error: ${err?.message || err}`);
    }
  }
}

/**
 * C. MODERATION & BROADCAST (System Banner, Chat Cooldown, Auto-Filter)
 */
export async function saveModerationSettings(
  broadcastText: string, 
  cooldownSeconds: number | string, 
  isFilterOn: boolean
): Promise<void> {
  try {
    const cooldown = Number(cooldownSeconds) || 0;
    const isFilter = Boolean(isFilterOn);

    const modRef = doc(db, "system", "moderation");
    await setDoc(modRef, {
      globalBroadcast: broadcastText || "",
      broadcastMessage: broadcastText || "",
      chatCooldown: cooldown,
      autoFilterEnabled: isFilter,
      profanityFilter: isFilter,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    if (typeof window !== 'undefined') {
      if (window.ADMIN_SYNC_STATE) {
        window.ADMIN_SYNC_STATE.moderation = {
          globalBroadcast: broadcastText || "",
          chatCooldown: cooldown,
          autoFilterEnabled: isFilter
        };
      }
      const banner = document.getElementById("mainAppSystemBanner") || document.getElementById("globalBroadcastBanner");
      if (banner && broadcastText && broadcastText.trim()) {
        banner.style.display = "block";
        banner.textContent = `📢 ${broadcastText}`;
      } else if (banner) {
        banner.style.display = "none";
      }

      alert("📢 Moderation rules updated live across all active chats!");
    }
  } catch (err: any) {
    console.error("Moderation Update Error:", err);
    if (typeof window !== 'undefined') {
      alert(`❌ Moderation Update Error: ${err?.message || err}`);
    }
  }
}

/**
 * D. TOURNAMENT CREATION (Pushes live tournaments to all players)
 */
export async function createGlobalTournament(tournamentPayload: any): Promise<void> {
  try {
    const tournamentRef = collection(db, "tournaments");
    await addDoc(tournamentRef, {
      ...tournamentPayload,
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    });

    const title = tournamentPayload.name || tournamentPayload.title || 'Official Tournament';
    if (typeof window !== 'undefined') {
      alert(`🏆 Tournament "${title}" launched successfully!`);
    }
  } catch (err: any) {
    console.error("Tournament Creation Error:", err);
    if (typeof window !== 'undefined') {
      alert(`❌ Tournament Creation Error: ${err?.message || err}`);
    }
  }
}

/**
 * E. CLAN INSPECTION & MODERATION
 */
export async function updateClanStatus(clanId: string, isApproved: boolean, banReason: string = ""): Promise<void> {
  try {
    const clanRef = doc(db, "clans", clanId);
    await setDoc(clanRef, {
      isApproved: Boolean(isApproved),
      banReason: banReason,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    if (typeof window !== 'undefined') {
      alert(`🛡️ Clan ${clanId} status updated.`);
    }
  } catch (err: any) {
    console.error("Clan Update Error:", err);
    if (typeof window !== 'undefined') {
      alert(`❌ Clan Update Error: ${err?.message || err}`);
    }
  }
}

/**
 * F. EMERGENCY LOCKDOWN CONTROL
 */
export async function setEmergencyLockdown(
  isEngaged: boolean, 
  durationMins: number | string = 60, 
  reasonText: string = "System Maintenance"
): Promise<void> {
  try {
    const duration = Number(durationMins) || 60;
    const lockdownRef = doc(db, "platform_state", "lockdown");
    await setDoc(lockdownRef, {
      active: Boolean(isEngaged),
      durationMinutes: duration,
      reason: reasonText || "System Maintenance",
      engagedAt: new Date().toISOString()
    }, { merge: true });

    if (typeof window !== 'undefined') {
      if (window.ADMIN_SYNC_STATE) {
        window.ADMIN_SYNC_STATE.lockdown = Boolean(isEngaged);
      }
      const overlay = document.getElementById("emergencyLockdownOverlay");
      if (overlay) {
        overlay.style.display = isEngaged ? "flex" : "none";
      }

      alert(`🚨 Emergency Lockdown state updated: ${isEngaged ? 'ENGAGED' : 'STANDBY'}`);
    }
  } catch (err: any) {
    console.error("Lockdown Error:", err);
    if (typeof window !== 'undefined') {
      alert(`❌ Lockdown Error: ${err?.message || err}`);
    }
  }
}

// ============================================================================
// 2. MAIN APP REAL-TIME LISTENERS (Listens & Apply Updates To Main Website)
// ============================================================================

let masterListenersInitialized = false;

export function initUniversalGameListeners(): void {
  if (typeof window === 'undefined' || !db) return;
  if (masterListenersInitialized) return;
  masterListenersInitialized = true;

  // 1. Listen to Economy Node
  onSnapshot(doc(db, "system", "economy"), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    if (window.ADMIN_SYNC_STATE) {
      window.ADMIN_SYNC_STATE.economy = data;
    }

    // Update entry fees on match creation cards and labels
    const coins = data.entryFeeCoins ?? 2000;
    const gems = data.entryFeeGems ?? 2000;

    document.querySelectorAll(".game-entry-fee-display").forEach(el => {
      el.textContent = `${coins.toLocaleString()} Coins / ${gems.toLocaleString()} Gems`;
    });
    document.querySelectorAll(".entry-fee-tag, .game-card-fee").forEach(el => {
      el.textContent = `${coins.toLocaleString()} Coins / ${gems.toLocaleString()} Gems`;
    });
    const entryFeeDisplay = document.getElementById("entryFeeDisplay");
    if (entryFeeDisplay) {
      entryFeeDisplay.textContent = `${coins.toLocaleString()} Coins / ${gems.toLocaleString()} Gems`;
    }

    window.dispatchEvent(new CustomEvent('admin_economy_updated', { detail: data }));
  }, (err) => console.warn("master_admin_sync economy listener:", err));

  // 2. Listen to Moderation & Broadcast Node
  onSnapshot(doc(db, "system", "moderation"), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    if (window.ADMIN_SYNC_STATE) {
      window.ADMIN_SYNC_STATE.moderation = data;
    }

    const broadcastMsg = data.globalBroadcast || data.broadcastMessage || "";
    // Render system banner on either element
    const banner = document.getElementById("mainAppSystemBanner") || document.getElementById("globalBroadcastBanner");
    if (banner && broadcastMsg) {
      banner.style.display = "block";
      banner.textContent = `📢 ${broadcastMsg}`;
    } else if (banner) {
      banner.style.display = "none";
    }

    window.dispatchEvent(new CustomEvent('admin_moderation_updated', { detail: data }));
  }, (err) => console.warn("master_admin_sync moderation listener:", err));

  // 3. Listen to Active Tournaments
  onSnapshot(collection(db, "tournaments"), (snap) => {
    const tournaments: any[] = [];
    snap.forEach(d => tournaments.push({ id: d.id, ...d.data() }));
    if (window.ADMIN_SYNC_STATE) {
      window.ADMIN_SYNC_STATE.tournaments = tournaments;
    }

    // Render tournament list dynamically in main lobby
    if (typeof window.renderLobbyTournaments === "function") {
      window.renderLobbyTournaments(tournaments);
    }

    window.dispatchEvent(new CustomEvent('admin_tournaments_updated', { detail: tournaments }));
  }, (err) => console.warn("master_admin_sync tournaments listener:", err));

  // 4. Listen to Lockdown Document
  onSnapshot(doc(db, "platform_state", "lockdown"), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    const isLockdown = Boolean(data.active);
    if (window.ADMIN_SYNC_STATE) {
      window.ADMIN_SYNC_STATE.lockdown = isLockdown;
    }

    const overlay = document.getElementById("emergencyLockdownOverlay");
    if (overlay) {
      overlay.style.display = isLockdown ? "flex" : "none";
    }

    window.dispatchEvent(new CustomEvent('admin_lockdown_updated', { detail: data }));
  }, (err) => console.warn("master_admin_sync lockdown listener:", err));

  // 5. Listen to Current User's Profile (Gems, Coins, Bans, Mutes)
  auth.onAuthStateChanged((user) => {
    if (user) {
      onSnapshot(doc(db, "users", user.uid), (userSnap) => {
        if (!userSnap.exists()) return;
        const uData = userSnap.data();

        // Handle live account bans
        if (uData.isBanned) {
          alert("⛔ Your account has been permanently suspended by an administrator.");
          auth.signOut();
          window.location.reload();
          return;
        }

        // Live header wallet update
        const coinEl = document.getElementById("userCoinsDisplay");
        const gemEl = document.getElementById("userGemsDisplay");
        if (coinEl && uData.coins !== undefined) coinEl.textContent = Number(uData.coins).toLocaleString();
        if (gemEl && uData.gems !== undefined) gemEl.textContent = Number(uData.gems).toLocaleString();

        if (uData.coins !== undefined) {
          window.dispatchEvent(new CustomEvent('chess_points_updated', { detail: { points: Number(uData.coins) } }));
        }
        if (uData.gems !== undefined) {
          window.dispatchEvent(new CustomEvent('chess_gems_updated', { detail: { gems: Number(uData.gems) } }));
        }
      }, (err) => console.warn("master_admin_sync user listener:", err));
    }
  });
}

// Global window exposure
if (typeof window !== 'undefined') {
  window.executeAdminUserAction = executeAdminUserAction;
  window.saveEconomySettings = saveEconomySettings;
  window.saveModerationSettings = saveModerationSettings;
  window.createGlobalTournament = createGlobalTournament;
  window.updateClanStatus = updateClanStatus;
  window.setEmergencyLockdown = setEmergencyLockdown;
  window.initUniversalGameListeners = initUniversalGameListeners;

  if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => {
      initUniversalGameListeners();
    });
  } else {
    initUniversalGameListeners();
  }
}
