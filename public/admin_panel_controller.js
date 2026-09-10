// ============================================================================
// FILE: admin_panel_controller.js
// Description: Binds Existing Admin Panel UI Components to the Universal Sync Engine
// Keeps all existing layout components intact while enabling live propagation.
// ============================================================================

import { db, auth } from './firebase_config.js';
import { 
  adminSaveUserAdjustment, 
  adminSaveEconomyConfig, 
  adminSaveModerationConfig, 
  adminCreateTournament, 
  adminModerateClan, 
  adminSetPlatformLockdown 
} from './universal_app_sync.js';

document.addEventListener("DOMContentLoaded", () => {
  setupAdminPanelEventListeners();
});

export function setupAdminPanelEventListeners() {

  // --------------------------------------------------------------------------
  // 1. USERS TAB: Save Adjustments, Grant Balance, Ban, Mute & Kick
  // --------------------------------------------------------------------------
  
  // A. Save User Adjustments Button (Coins & Gems Grant)
  const saveUserAdjBtn = document.getElementById("btnSaveUserAdjustments") || document.querySelector(".btn-save-adjustments");
  if (saveUserAdjBtn && !saveUserAdjBtn.dataset.boundSync) {
    saveUserAdjBtn.dataset.boundSync = "true";
    saveUserAdjBtn.addEventListener("click", async () => {
      const targetUid = getTargetUserId();
      const coinsVal = document.getElementById("inputNewCoins")?.value || document.getElementById("userCoinsInput")?.value;
      const gemsVal = document.getElementById("inputNewGems")?.value || document.getElementById("userGemsInput")?.value;

      if (!targetUid) return alert("❌ Please select or enter a target User ID first.");

      await adminSaveUserAdjustment(targetUid, {
        coins: Number(coinsVal) || 0,
        gems: Number(gemsVal) || 0
      });
    });
  }

  // B. Mute Chat Button
  const muteChatBtn = document.getElementById("btnMuteChat") || document.querySelector(".btn-mute-chat");
  if (muteChatBtn && !muteChatBtn.dataset.boundSync) {
    muteChatBtn.dataset.boundSync = "true";
    muteChatBtn.addEventListener("click", async () => {
      const targetUid = getTargetUserId();
      if (!targetUid) return alert("❌ Select a user to mute.");

      await adminSaveUserAdjustment(targetUid, { isMuted: true });
    });
  }

  // C. Permanent Ban Button
  const permBanBtn = document.getElementById("btnPermanentBan") || document.querySelector(".btn-permanent-ban");
  if (permBanBtn && !permBanBtn.dataset.boundSync) {
    permBanBtn.dataset.boundSync = "true";
    permBanBtn.addEventListener("click", async () => {
      const targetUid = getTargetUserId();
      if (!targetUid) return alert("❌ Select a user to ban.");

      if (confirm(`Are you sure you want to PERMANENTLY BAN user: ${targetUid}?`)) {
        await adminSaveUserAdjustment(targetUid, { isBanned: true });
      }
    });
  }

  // --------------------------------------------------------------------------
  // 2. ECONOMY TAB: Update Entry Fees, Exchange Rates & Jackpot
  // --------------------------------------------------------------------------
  
  const updateParamsBtn = document.getElementById("btnUpdateParams") || document.querySelector(".btn-update-params") || document.getElementById("btnUpdateEconomy");
  if (updateParamsBtn && !updateParamsBtn.dataset.boundSync) {
    updateParamsBtn.dataset.boundSync = "true";
    updateParamsBtn.addEventListener("click", async () => {
      const coinsFee = document.getElementById("inputCoinsFee")?.value || document.getElementById("gameEntryFeeCoins")?.value || 1000;
      const gemsFee = document.getElementById("inputGemsFee")?.value || document.getElementById("gameEntryFeeGems")?.value || 500;
      const exchangeRate = document.getElementById("inputExchangeRate")?.value || document.getElementById("admConfigGemRate")?.value || 4;
      const jackpotPool = document.getElementById("inputJackpotPool")?.value || 1000000;

      await adminSaveEconomyConfig({
        coinsFee,
        gemsFee,
        exchangeRate,
        jackpotPool
      });
    });
  }

  // --------------------------------------------------------------------------
  // 3. MODERATION TAB: Broadcast Banner & Global Chat Rules
  // --------------------------------------------------------------------------
  
  const broadcastBtn = document.getElementById("btnBroadcast") || document.querySelector(".btn-broadcast");
  if (broadcastBtn && !broadcastBtn.dataset.boundSync) {
    broadcastBtn.dataset.boundSync = "true";
    broadcastBtn.addEventListener("click", async () => {
      const broadcastText = document.getElementById("inputBroadcastMsg")?.value || document.getElementById("globalBroadcastInput")?.value || document.getElementById("admBroadcastInput")?.value || "";
      const chatCooldown = document.getElementById("inputChatCooldown")?.value || document.getElementById("admChatSlowmode")?.value || 3;
      const autoFilter = document.getElementById("toggleAutoFilter")?.checked || true;

      await adminSaveModerationConfig({
        broadcastText,
        chatCooldown,
        autoFilter
      });
    });
  }

  // --------------------------------------------------------------------------
  // 4. TOURNAMENTS TAB: Create & Launch Tournaments
  // --------------------------------------------------------------------------
  
  const launchTournamentBtn = document.getElementById("btnLaunchTournament") || document.querySelector(".btn-launch-tournament");
  if (launchTournamentBtn && !launchTournamentBtn.dataset.boundSync) {
    launchTournamentBtn.dataset.boundSync = "true";
    launchTournamentBtn.addEventListener("click", async () => {
      const name = document.getElementById("inputTournamentName")?.value || document.getElementById("tournName")?.value || "Grand Championship";
      const prizePool = document.getElementById("inputPrizePool")?.value || document.getElementById("tournPrize")?.value || 50000;
      const entryFee = document.getElementById("inputTournamentEntryFee")?.value || document.getElementById("tournFee")?.value || 2000;

      await adminCreateTournament({
        name,
        prizePool: Number(prizePool),
        entryFee: Number(entryFee),
        maxPlayers: 64,
        joinedPlayers: 1
      });
    });
  }

  // --------------------------------------------------------------------------
  // 5. SYSTEM TAB: Emergency Panic Lockdown
  // --------------------------------------------------------------------------
  
  const engageLockdownBtn = document.getElementById("btnEngageLockdown") || document.querySelector(".btn-engage-lockdown");
  if (engageLockdownBtn && !engageLockdownBtn.dataset.boundSync) {
    engageLockdownBtn.dataset.boundSync = "true";
    engageLockdownBtn.addEventListener("click", async () => {
      const duration = document.getElementById("inputLockdownDuration")?.value || 60;
      const reason = document.getElementById("inputLockdownReason")?.value || "Admin Initiated Maintenance & Security Shutdown";

      if (confirm("🚨 WARNING: Engage Emergency Platform Lockdown? This will restrict player access.")) {
        await adminSetPlatformLockdown({
          active: true,
          duration,
          reason
        });
      }
    });
  }
}

/**
 * Helper function to retrieve the active selected user ID from your UI list or input field.
 */
export function getTargetUserId() {
  const activeUserCard = document.querySelector(".user-item.active, .selected-user");
  if (activeUserCard && activeUserCard.dataset.userId) {
    return activeUserCard.dataset.userId;
  }
  
  const inputEl = document.getElementById("targetUserIdInput") || document.getElementById("inputTargetUserId");
  return inputEl ? inputEl.value.trim() : null;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.setupAdminPanelEventListeners = setupAdminPanelEventListeners;
  window.getTargetUserId = getTargetUserId;
}
