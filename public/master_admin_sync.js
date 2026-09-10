// ============================================================================
// FILE: master_admin_sync.js
// Universal Admin Panel Sync System (Covers 100% of Admin Panel Elements)
// ============================================================================

import { db, auth } from './firebase_config.js';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  collection, 
  onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Global Game State (Read by all clients)
window.ADMIN_SYNC_STATE = window.ADMIN_SYNC_STATE || {
  economy: {},
  moderation: {},
  tournaments: [],
  clans: [],
  lockdown: false
};

// ============================================================================
// 1. UNIVERSAL ADMIN WRITING ENGINE (Pushes Panel Actions Live)
// ============================================================================

/**
 * A. USER MANAGEMENT (Direct Balance Grant, Ban, Mute, Kick)
 */
export async function executeAdminUserAction(targetUserId, actionData) {
  if (!targetUserId) return alert("❌ Please select a target user.");

  try {
    const userRef = doc(db, "users", targetUserId);
    await setDoc(userRef, {
      ...actionData,
      lastAdminActionAt: new Date().toISOString(),
      updatedBy: auth.currentUser ? auth.currentUser.uid : "ADMIN"
    }, { merge: true });

    alert(`✅ Action successfully applied to User: ${targetUserId}`);
  } catch (err) {
    console.error("User Action Error:", err);
    alert(`❌ Failed to update user: ${err.message}`);
  }
}

/**
 * B. ECONOMY & GLOBAL FEES (Entry Fees, Exchange Rates, Jackpots)
 */
export async function saveEconomySettings(coinsFee, gemsFee, exchangeRate, jackpotPool) {
  try {
    const econRef = doc(db, "system", "economy");
    await setDoc(econRef, {
      entryFeeCoins: Number(coinsFee),
      entryFeeGems: Number(gemsFee),
      coinsPerGemRate: Number(exchangeRate),
      jackpotPool: Number(jackpotPool),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    alert("✅ Economy settings applied globally!");
  } catch (err) {
    alert(`❌ Economy Update Error: ${err.message}`);
  }
}

/**
 * C. MODERATION & BROADCAST (System Banner, Chat Cooldown, Auto-Filter)
 */
export async function saveModerationSettings(broadcastText, cooldownSeconds, isFilterOn) {
  try {
    const modRef = doc(db, "system", "moderation");
    await setDoc(modRef, {
      globalBroadcast: broadcastText || "",
      chatCooldown: Number(cooldownSeconds) || 0,
      autoFilterEnabled: Boolean(isFilterOn),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    alert("📢 Moderation rules updated live across all active chats!");
  } catch (err) {
    alert(`❌ Moderation Update Error: ${err.message}`);
  }
}

/**
 * D. TOURNAMENT CREATION (Pushes live tournaments to all players)
 */
export async function createGlobalTournament(tournamentPayload) {
  try {
    const tournamentRef = collection(db, "tournaments");
    await addDoc(tournamentRef, {
      ...tournamentPayload,
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    });

    alert(`🏆 Tournament "${tournamentPayload.name || tournamentPayload.title || 'Official Tournament'}" launched successfully!`);
  } catch (err) {
    alert(`❌ Tournament Creation Error: ${err.message}`);
  }
}

/**
 * E. CLAN INSPECTION & MODERATION
 */
export async function updateClanStatus(clanId, isApproved, banReason = "") {
  try {
    const clanRef = doc(db, "clans", clanId);
    await updateDoc(clanRef, {
      isApproved: Boolean(isApproved),
      banReason: banReason,
      updatedAt: new Date().toISOString()
    });

    alert(`🛡️ Clan ${clanId} status updated.`);
  } catch (err) {
    alert(`❌ Clan Update Error: ${err.message}`);
  }
}

/**
 * F. EMERGENCY LOCKDOWN CONTROL
 */
export async function setEmergencyLockdown(isEngaged, durationMins, reasonText) {
  try {
    const lockdownRef = doc(db, "platform_state", "lockdown");
    await setDoc(lockdownRef, {
      active: Boolean(isEngaged),
      durationMinutes: Number(durationMins) || 60,
      reason: reasonText || "System Maintenance",
      engagedAt: new Date().toISOString()
    }, { merge: true });

    alert(`🚨 Emergency Lockdown state updated: ${isEngaged ? 'ENGAGED' : 'STANDBY'}`);
  } catch (err) {
    alert(`❌ Lockdown Error: ${err.message}`);
  }
}

// ============================================================================
// 2. MAIN APP REAL-TIME LISTENERS (Listens & Apply Updates To Main Website)
// ============================================================================

export function initUniversalGameListeners() {
  if (!db) return;

  // 1. Listen to Economy Node
  onSnapshot(doc(db, "system", "economy"), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    window.ADMIN_SYNC_STATE.economy = data;

    // Update entry fees on match creation cards
    document.querySelectorAll(".game-entry-fee-display").forEach(el => {
      el.textContent = `${data.entryFeeCoins} Coins / ${data.entryFeeGems} Gems`;
    });
    document.querySelectorAll(".entry-fee-tag, .game-card-fee").forEach(el => {
      el.textContent = `${data.entryFeeCoins} Coins / ${data.entryFeeGems} Gems`;
    });
    const entryFeeDisplay = document.getElementById("entryFeeDisplay");
    if (entryFeeDisplay) {
      entryFeeDisplay.textContent = `${data.entryFeeCoins} Coins / ${data.entryFeeGems} Gems`;
    }
  });

  // 2. Listen to Moderation & Broadcast Node
  onSnapshot(doc(db, "system", "moderation"), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    window.ADMIN_SYNC_STATE.moderation = data;

    // Render system banner
    const banner = document.getElementById("mainAppSystemBanner") || document.getElementById("globalBroadcastBanner");
    if (banner && data.globalBroadcast) {
      banner.style.display = "block";
      banner.textContent = `📢 ${data.globalBroadcast}`;
    } else if (banner) {
      banner.style.display = "none";
    }
  });

  // 3. Listen to Active Tournaments
  onSnapshot(collection(db, "tournaments"), (snap) => {
    const tournaments = [];
    snap.forEach(d => tournaments.push({ id: d.id, ...d.data() }));
    window.ADMIN_SYNC_STATE.tournaments = tournaments;

    // Render tournament list dynamically in main lobby
    if (typeof window.renderLobbyTournaments === "function") {
      window.renderLobbyTournaments(tournaments);
    }
  });

  // 4. Listen to Lockdown Document
  onSnapshot(doc(db, "platform_state", "lockdown"), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    window.ADMIN_SYNC_STATE.lockdown = data.active;

    const overlay = document.getElementById("emergencyLockdownOverlay");
    if (overlay) {
      overlay.style.display = data.active ? "flex" : "none";
    }
  });

  // 5. Listen to Current User's Profile (Gems, Coins, Bans, Mutes)
  auth.onAuthStateChanged((user) => {
    if (user) {
      onSnapshot(doc(db, "users", user.uid), (userSnap) => {
        if (!userSnap.exists()) return;
        const uData = userSnap.data();

        // Handle live account bans/mutes
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
      });
    }
  });
}

// Attach globally
window.executeAdminUserAction = executeAdminUserAction;
window.saveEconomySettings = saveEconomySettings;
window.saveModerationSettings = saveModerationSettings;
window.createGlobalTournament = createGlobalTournament;
window.updateClanStatus = updateClanStatus;
window.setEmergencyLockdown = setEmergencyLockdown;
window.initUniversalGameListeners = initUniversalGameListeners;

// Automatically bind listeners on startup
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => {
      initUniversalGameListeners();
    });
  } else {
    initUniversalGameListeners();
  }
}
