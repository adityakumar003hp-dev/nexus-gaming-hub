// ============================================================================
// FILE: admin_game_bridge.js
// Description: Real-time Event Listener & Sync Bridge for Admin Panel Elements
// ============================================================================

import { db } from './firebase_config.js';
import { 
  doc, 
  setDoc, 
  updateDoc 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Global Firestore References
let globalConfigRef = null;
let moderationRef = null;
let tournamentRef = null;

function resolveFirestoreRefs() {
  const activeDb = db || (typeof window !== 'undefined' ? window.db : null);
  if (activeDb) {
    if (!globalConfigRef) globalConfigRef = doc(activeDb, "system", "global_config");
    if (!moderationRef) moderationRef = doc(activeDb, "system", "moderation");
    if (!tournamentRef) tournamentRef = doc(activeDb, "system", "tournaments");
  }
}

try {
  resolveFirestoreRefs();
} catch (e) {
  // Deferred until first invocation
}

/**
 * GAME SELECT & ENTRY FEE SYNCHRONIZATION
 * Triggered by: "SWITCH GLOBAL ACTIVE GAME" button
 */
export async function syncGameModeAndFee() {
  resolveFirestoreRefs();
  const gameSelect = document.querySelector('select[name="game_select"]');
  const entryFeeInput = document.querySelector('input[name="entry_fee"]');
  const currencySelect = document.querySelector('select[name="currency_type"]');

  if (!gameSelect || !entryFeeInput) {
    console.error("Missing UI elements for Game Switcher.");
    return;
  }

  const selectedGame = gameSelect.value;
  const entryFee = Number(entryFeeInput.value) || 0;
  const currency = currencySelect ? currencySelect.value : "Coins";

  try {
    const activeDb = db || (typeof window !== 'undefined' ? window.db : null);
    const targetRef = globalConfigRef || (activeDb ? doc(activeDb, "system", "global_config") : null);

    if (targetRef) {
      await setDoc(targetRef, {
        activeGame: selectedGame,
        entryFeeCoins: currency === "Coins" ? entryFee : 1000,
        entryFeeGems: currency === "Gems" ? entryFee : 500,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    // Mirror to platform_state for universal listener compatibility
    if (activeDb) {
      try {
        await setDoc(doc(activeDb, "platform_state", "active_game"), {
          activeGame: selectedGame,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        await setDoc(doc(activeDb, "platform_state", "economy"), {
          gameEntryFeeCoins: currency === "Coins" ? entryFee : 1000,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (mirrorErr) {
        console.warn("Mirror platform_state notice:", mirrorErr);
      }
    }

    // Immediate UI and callback synchronization
    const entryFeeDisplay = document.getElementById("entryFeeDisplay");
    if (entryFeeDisplay) {
      entryFeeDisplay.textContent = `${entryFee} ${currency}`;
    }
    if (typeof window !== 'undefined' && typeof window.updateMainAppGameMode === 'function') {
      window.updateMainAppGameMode(selectedGame);
    }

    alert(`✅ Global Game updated to: ${selectedGame} (${entryFee} ${currency})`);
  } catch (error) {
    console.error("Error updating game settings:", error);
    alert(`❌ Failed to sync game settings: ${error.message}`);
  }
}

/**
 * USER BALANCE & SETTINGS ADJUSTMENT
 * Triggered by: "SAVE ADJUSTMENTS" button
 */
export async function syncUserAdjustments() {
  resolveFirestoreRefs();
  const userLookupInput = document.querySelector('input[placeholder="Target Username or ID"]') 
    || document.querySelector('input[placeholder*="Target Username or ID"]')
    || document.getElementById('searchInput');

  const coinsInput = document.querySelector('input[placeholder*="5000 or -1000"]')
    || document.getElementById('coinDelta');

  const gemsInput = document.querySelector('input[placeholder*="500 or -100"]')
    || document.getElementById('gemDelta');

  if (!userLookupInput || !userLookupInput.value.trim()) {
    alert("Please enter a valid User ID or Username.");
    return;
  }

  const userId = userLookupInput.value.trim();
  const coinsValue = Number(coinsInput ? coinsInput.value : 0) || 0;
  const gemsValue = Number(gemsInput ? gemsInput.value : 0) || 0;

  try {
    const activeDb = db || (typeof window !== 'undefined' ? window.db : null);
    if (!activeDb) throw new Error("Database not initialized");

    const userRef = doc(activeDb, "users", userId);
    await setDoc(userRef, {
      coins: coinsValue,
      gems: gemsValue,
      lastAdminUpdate: new Date().toISOString()
    }, { merge: true });

    if (typeof window !== 'undefined' && typeof window.fetchPermanentUsers === 'function') {
      window.fetchPermanentUsers();
    }

    alert(`✅ Updated account (${userId}) with ${coinsValue} Coins and ${gemsValue} Gems.`);
  } catch (error) {
    console.error("Error modifying user balance:", error);
    alert(`❌ Balance update failed: ${error.message}`);
  }
}

/**
 * USER SANCTIONS (MUTE / BAN / KICK)
 * Triggered by: "MUTE CHAT", "KICK SESSION", "PERMANENT BAN"
 */
export async function applyUserSanction(actionType) {
  resolveFirestoreRefs();
  const userLookupInput = document.querySelector('input[placeholder="Target Username or ID"]') 
    || document.querySelector('input[placeholder*="Target Username or ID"]')
    || document.getElementById('searchInput');

  if (!userLookupInput || !userLookupInput.value.trim()) {
    alert("Please select or lookup a valid User ID first.");
    return;
  }

  const userId = userLookupInput.value.trim();
  const activeDb = db || (typeof window !== 'undefined' ? window.db : null);
  if (!activeDb) {
    alert("Database connection offline");
    return;
  }
  const userRef = doc(activeDb, "users", userId);

  try {
    if (actionType === "MUTE") {
      await updateDoc(userRef, { isMuted: true, mutedAt: new Date().toISOString() });
      alert(`🔇 User (${userId}) muted.`);
    } else if (actionType === "BAN") {
      await updateDoc(userRef, { isBanned: true, bannedAt: new Date().toISOString() });
      alert(`⛔ User (${userId}) permanently banned.`);
    } else if (actionType === "KICK") {
      await updateDoc(userRef, { forceSessionRevoke: true, kickedAt: new Date().toISOString() });
      alert(`🥾 Session revoked for (${userId}).`);
    }

    if (typeof window !== 'undefined' && typeof window.fetchPermanentUsers === 'function') {
      window.fetchPermanentUsers();
    }
  } catch (error) {
    console.error(`Error executing ${actionType}:`, error);
    alert(`❌ Action failed: ${error.message}`);
  }
}

/**
 * BROADCAST & CHAT MODERATION RULES
 * Triggered by: "BROADCAST" and "APPLY CHAT RULES"
 */
export async function syncModerationRules() {
  resolveFirestoreRefs();
  const broadcastInput = document.querySelector('input[placeholder="system notification"]')
    || document.querySelector('input[placeholder*="system notification"]')
    || document.getElementById('admBroadcastInput');

  const cooldownInput = document.querySelector('input[placeholder="3"]')
    || document.getElementById('admChatSlowmode');

  const profanitySelect = document.querySelector('select[name="profanity_filter"]')
    || document.getElementById('admChatFilter');

  const payload = {
    chatCooldownSeconds: cooldownInput ? Number(cooldownInput.value) : 3,
    autoFilterProfanity: profanitySelect ? profanitySelect.value : "Enabled",
    updatedAt: new Date().toISOString()
  };

  if (broadcastInput && broadcastInput.value.trim() !== "") {
    payload.latestBroadcast = broadcastInput.value.trim();
    payload.broadcastTimestamp = new Date().toISOString();
  }

  try {
    const activeDb = db || (typeof window !== 'undefined' ? window.db : null);
    const targetRef = moderationRef || (activeDb ? doc(activeDb, "system", "moderation") : null);
    if (!targetRef) throw new Error("Database not connected");

    await setDoc(targetRef, payload, { merge: true });

    // Mirror to platform_state/moderation and local broadcast banner
    if (activeDb) {
      try {
        await setDoc(doc(activeDb, "platform_state", "moderation"), {
          globalBroadcast: payload.latestBroadcast || "",
          slowModeSeconds: payload.chatCooldownSeconds,
          autoFilter: payload.autoFilterProfanity,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (mirrorErr) {
        console.warn("Mirror moderation state notice:", mirrorErr);
      }
    }

    const broadcastElement = document.getElementById("globalBroadcastBanner");
    if (broadcastElement && payload.latestBroadcast) {
      broadcastElement.textContent = payload.latestBroadcast;
      broadcastElement.style.display = "block";
    }

    alert("📢 Chat rules & broadcast updated globally across all active sessions.");
  } catch (error) {
    console.error("Error updating moderation rules:", error);
    alert(`❌ Moderation sync failed: ${error.message}`);
  }
}

/**
 * TOURNAMENT CREATION
 * Triggered by: "LAUNCH TOURNAMENT" button
 */
export async function launchNewTournament() {
  resolveFirestoreRefs();
  const nameInput = document.querySelector('input[placeholder="Grand Blitz Showdown"]')
    || document.querySelector('input[placeholder*="Grand Blitz Showdown"]')
    || document.getElementById('tournName');

  const prizeInput = document.querySelector('input[placeholder="10000"]')
    || document.getElementById('tournPrize');

  const entryInput = document.querySelector('input[placeholder="200"]')
    || document.getElementById('tournFee');

  const maxPlayersInput = document.querySelector('input[placeholder="64"]')
    || document.getElementById('tournMax');

  if (!nameInput || !nameInput.value.trim()) {
    alert("Please enter a valid tournament name.");
    return;
  }

  const tournamentData = {
    id: `tourn_${Date.now()}`,
    name: nameInput.value.trim(),
    prizePool: Number(prizeInput ? prizeInput.value : 10000),
    entryFee: Number(entryInput ? entryInput.value : 200),
    maxPlayers: Number(maxPlayersInput ? maxPlayersInput.value : 64),
    status: "LIVE",
    createdAt: new Date().toISOString()
  };

  try {
    const activeDb = db || (typeof window !== 'undefined' ? window.db : null);
    const targetRef = tournamentRef || (activeDb ? doc(activeDb, "system", "tournaments") : null);
    if (!targetRef) throw new Error("Database not connected");

    await setDoc(targetRef, { latestTournament: tournamentData }, { merge: true });

    // Mirror to platform_state/tournaments
    if (activeDb) {
      try {
        await setDoc(doc(activeDb, "platform_state", "tournaments"), {
          latestTournament: tournamentData,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (mirrorErr) {
        console.warn("Mirror tournament state notice:", mirrorErr);
      }
    }

    alert(`🏆 Tournament "${tournamentData.name}" is now live!`);
  } catch (error) {
    console.error("Error launching tournament:", error);
    alert(`❌ Failed to launch tournament: ${error.message}`);
  }
}

// Global registry for direct programmatic invocation
if (typeof window !== 'undefined') {
  window.syncGameModeAndFee = syncGameModeAndFee;
  window.syncUserAdjustments = syncUserAdjustments;
  window.applyUserSanction = applyUserSanction;
  window.syncModerationRules = syncModerationRules;
  window.launchNewTournament = launchNewTournament;
}

// Automatic Event Binding on DOM Load
export function bindBridgeButtons() {
  // Bind Switch Global Active Game
  const btnSwitchGame = Array.from(document.querySelectorAll("button")).find(b => b.textContent && b.textContent.toUpperCase().includes("SWITCH GLOBAL ACTIVE GAME"));
  if (btnSwitchGame && !btnSwitchGame.dataset.bridgeBound) {
    btnSwitchGame.dataset.bridgeBound = "true";
    btnSwitchGame.addEventListener("click", syncGameModeAndFee);
  }

  // Bind Save Adjustments
  const btnSaveAdjustments = Array.from(document.querySelectorAll("button")).find(b => b.textContent && b.textContent.toUpperCase().includes("SAVE ADJUSTMENTS"));
  if (btnSaveAdjustments && !btnSaveAdjustments.dataset.bridgeBound) {
    btnSaveAdjustments.dataset.bridgeBound = "true";
    btnSaveAdjustments.addEventListener("click", syncUserAdjustments);
  }

  // Bind Sanction Buttons
  const btnMute = Array.from(document.querySelectorAll("button")).find(b => b.textContent && b.textContent.toUpperCase().includes("MUTE CHAT"));
  if (btnMute && !btnMute.dataset.bridgeBound) {
    btnMute.dataset.bridgeBound = "true";
    btnMute.addEventListener("click", () => applyUserSanction("MUTE"));
  }

  const btnKick = Array.from(document.querySelectorAll("button")).find(b => b.textContent && b.textContent.toUpperCase().includes("KICK SESSION"));
  if (btnKick && !btnKick.dataset.bridgeBound) {
    btnKick.dataset.bridgeBound = "true";
    btnKick.addEventListener("click", () => applyUserSanction("KICK"));
  }

  const btnBan = Array.from(document.querySelectorAll("button")).find(b => b.textContent && b.textContent.toUpperCase().includes("PERMANENT BAN"));
  if (btnBan && !btnBan.dataset.bridgeBound) {
    btnBan.dataset.bridgeBound = "true";
    btnBan.addEventListener("click", () => applyUserSanction("BAN"));
  }

  // Bind Broadcast & Chat Rules
  const btnBroadcast = Array.from(document.querySelectorAll("button")).find(b => b.textContent && b.textContent.toUpperCase().includes("BROADCAST"));
  if (btnBroadcast && !btnBroadcast.dataset.bridgeBound) {
    btnBroadcast.dataset.bridgeBound = "true";
    btnBroadcast.addEventListener("click", syncModerationRules);
  }

  const btnApplyRules = Array.from(document.querySelectorAll("button")).find(b => b.textContent && b.textContent.toUpperCase().includes("APPLY CHAT RULES"));
  if (btnApplyRules && !btnApplyRules.dataset.bridgeBound) {
    btnApplyRules.dataset.bridgeBound = "true";
    btnApplyRules.addEventListener("click", syncModerationRules);
  }

  // Bind Launch Tournament
  const btnLaunchTourn = Array.from(document.querySelectorAll("button")).find(b => b.textContent && b.textContent.toUpperCase().includes("LAUNCH TOURNAMENT"));
  if (btnLaunchTourn && !btnLaunchTourn.dataset.bridgeBound) {
    btnLaunchTourn.dataset.bridgeBound = "true";
    btnLaunchTourn.addEventListener("click", launchNewTournament);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindBridgeButtons);
  } else {
    bindBridgeButtons();
  }

  // Event Delegation for dynamically rendered React modal and tab controls
  document.addEventListener("click", (e) => {
    const target = e.target;
    const button = target && (target.tagName === "BUTTON" ? target : target.closest("button"));
    if (!button) return;
    const text = (button.textContent || "").toUpperCase().trim();

    if (text.includes("SWITCH GLOBAL ACTIVE GAME")) {
      syncGameModeAndFee();
    } else if (text.includes("SAVE ADJUSTMENTS")) {
      syncUserAdjustments();
    } else if (text.includes("MUTE CHAT")) {
      applyUserSanction("MUTE");
    } else if (text.includes("KICK SESSION")) {
      applyUserSanction("KICK");
    } else if (text.includes("PERMANENT BAN")) {
      applyUserSanction("BAN");
    } else if (text === "BROADCAST" || (text.includes("BROADCAST") && button.closest("#admPanel-moderation"))) {
      syncModerationRules();
    } else if (text.includes("APPLY CHAT RULES")) {
      syncModerationRules();
    } else if (text.includes("LAUNCH TOURNAMENT")) {
      launchNewTournament();
    }
  });
}
