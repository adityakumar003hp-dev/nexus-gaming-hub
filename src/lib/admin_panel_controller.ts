// ============================================================================
// FILE: src/lib/admin_panel_controller.ts
// Binds Existing Admin Panel UI Components to the Universal Sync Engine
// Preserves all existing HTML UI layout, components, and input IDs.
// ============================================================================

import { 
  adminSaveUserAdjustment, 
  adminSaveEconomyConfig, 
  adminSaveModerationConfig, 
  adminCreateTournament, 
  adminModerateClan, 
  adminSetPlatformLockdown,
  executeAdminUserAction
} from './universal_app_sync';

export function setupAdminPanelEventListeners(): void {
  if (typeof document === 'undefined') return;

  // --------------------------------------------------------------------------
  // 1. USERS TAB: Save Adjustments, Grant Balance, Ban, Mute & Kick
  // --------------------------------------------------------------------------
  
  // A. Save User Adjustments Button (Coins & Gems Grant)
  const saveUserAdjBtn = document.getElementById("btnSaveUserAdjustments") || document.querySelector(".btn-save-adjustments");
  if (saveUserAdjBtn && !saveUserAdjBtn.hasAttribute("data-bound-sync")) {
    saveUserAdjBtn.setAttribute("data-bound-sync", "true");
    saveUserAdjBtn.addEventListener("click", async () => {
      const targetUid = getTargetUserId();
      const coinsInput = (document.getElementById("inputNewCoins") || document.getElementById("userCoinsInput")) as HTMLInputElement | null;
      const gemsInput = (document.getElementById("inputNewGems") || document.getElementById("userGemsInput")) as HTMLInputElement | null;
      const roleSelect = document.getElementById("roleSelect") as HTMLSelectElement | null;

      if (!targetUid) {
        alert("❌ Please select or enter a target User ID first.");
        return;
      }

      const payload: Record<string, any> = {};
      if (coinsInput && coinsInput.value.trim() !== '') payload.coins = Number(coinsInput.value);
      if (gemsInput && gemsInput.value.trim() !== '') payload.gems = Number(gemsInput.value);
      if (roleSelect && roleSelect.value) payload.role = roleSelect.value;

      await adminSaveUserAdjustment(targetUid, payload);
    });
  }

  // B. Mute Chat Button
  const muteChatBtn = document.getElementById("btnMuteChat") || document.querySelector(".btn-mute-chat");
  if (muteChatBtn && !muteChatBtn.hasAttribute("data-bound-sync")) {
    muteChatBtn.setAttribute("data-bound-sync", "true");
    muteChatBtn.addEventListener("click", async () => {
      const targetUid = getTargetUserId();
      if (!targetUid) return alert("❌ Select a user to mute.");

      await adminSaveUserAdjustment(targetUid, { isMuted: true });
    });
  }

  // C. Permanent Ban Button
  const permBanBtn = document.getElementById("btnPermanentBan") || document.querySelector(".btn-permanent-ban");
  if (permBanBtn && !permBanBtn.hasAttribute("data-bound-sync")) {
    permBanBtn.setAttribute("data-bound-sync", "true");
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
  if (updateParamsBtn && !updateParamsBtn.hasAttribute("data-bound-sync")) {
    updateParamsBtn.setAttribute("data-bound-sync", "true");
    updateParamsBtn.addEventListener("click", async () => {
      const coinsFeeEl = (document.getElementById("inputCoinsFee") || document.getElementById("gameEntryFeeCoins")) as HTMLInputElement | null;
      const gemsFeeEl = (document.getElementById("inputGemsFee") || document.getElementById("gameEntryFeeGems")) as HTMLInputElement | null;
      const exchangeRateEl = (document.getElementById("inputExchangeRate") || document.getElementById("admConfigGemRate")) as HTMLInputElement | null;
      const jackpotPoolEl = document.getElementById("inputJackpotPool") as HTMLInputElement | null;

      const coinsFee = coinsFeeEl?.value ? Number(coinsFeeEl.value) : 1000;
      const gemsFee = gemsFeeEl?.value ? Number(gemsFeeEl.value) : 500;
      const exchangeRate = exchangeRateEl?.value ? Number(exchangeRateEl.value) : 4;
      const jackpotPool = jackpotPoolEl?.value ? Number(jackpotPoolEl.value) : 1000000;

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
  if (broadcastBtn && !broadcastBtn.hasAttribute("data-bound-sync")) {
    broadcastBtn.setAttribute("data-bound-sync", "true");
    broadcastBtn.addEventListener("click", async () => {
      const broadcastInput = (document.getElementById("inputBroadcastMsg") || document.getElementById("globalBroadcastInput") || document.getElementById("admBroadcastInput")) as HTMLInputElement | null;
      const cooldownInput = (document.getElementById("inputChatCooldown") || document.getElementById("admChatSlowmode")) as HTMLInputElement | null;
      const autoFilterToggle = document.getElementById("toggleAutoFilter") as HTMLInputElement | null;
      const chatFilterSelect = document.getElementById("admChatFilter") as HTMLSelectElement | null;

      const broadcastText = broadcastInput?.value || "";
      const chatCooldown = cooldownInput?.value ? Number(cooldownInput.value) : 3;
      const autoFilter = autoFilterToggle ? autoFilterToggle.checked : chatFilterSelect ? chatFilterSelect.value === 'enabled' : true;

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
  if (launchTournamentBtn && !launchTournamentBtn.hasAttribute("data-bound-sync")) {
    launchTournamentBtn.setAttribute("data-bound-sync", "true");
    launchTournamentBtn.addEventListener("click", async () => {
      const nameInput = (document.getElementById("inputTournamentName") || document.getElementById("tournName")) as HTMLInputElement | null;
      const prizeInput = (document.getElementById("inputPrizePool") || document.getElementById("tournPrize")) as HTMLInputElement | null;
      const feeInput = (document.getElementById("inputTournamentEntryFee") || document.getElementById("tournFee")) as HTMLInputElement | null;
      const maxInput = (document.getElementById("tournMax")) as HTMLInputElement | null;

      const name = nameInput?.value || "Grand Championship";
      const prizePool = prizeInput?.value ? Number(prizeInput.value) : 50000;
      const entryFee = feeInput?.value ? Number(feeInput.value) : 2000;
      const maxPlayers = maxInput?.value ? Number(maxInput.value) : 64;

      await adminCreateTournament({
        name,
        prizePool,
        entryFee,
        maxPlayers,
        joinedPlayers: 1
      });
    });
  }

  // --------------------------------------------------------------------------
  // 5. SYSTEM TAB: Emergency Panic Lockdown
  // --------------------------------------------------------------------------
  
  const engageLockdownBtn = document.getElementById("btnEngageLockdown") || document.querySelector(".btn-engage-lockdown");
  if (engageLockdownBtn && !engageLockdownBtn.hasAttribute("data-bound-sync")) {
    engageLockdownBtn.setAttribute("data-bound-sync", "true");
    engageLockdownBtn.addEventListener("click", async () => {
      const durationInput = document.getElementById("inputLockdownDuration") as HTMLInputElement | null;
      const reasonInput = document.getElementById("inputLockdownReason") as HTMLInputElement | null;

      const duration = durationInput?.value ? Number(durationInput.value) : 60;
      const reason = reasonInput?.value || "Admin Initiated Maintenance & Security Shutdown";

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
 * Helper function to retrieve the active selected user ID from UI list or input field.
 */
export function getTargetUserId(): string | null {
  const activeUserCard = document.querySelector(".user-item.active, .selected-user") as HTMLElement | null;
  if (activeUserCard && activeUserCard.dataset.userId) {
    return activeUserCard.dataset.userId;
  }
  
  const inputEl = (document.getElementById("targetUserIdInput") || document.getElementById("inputTargetUserId")) as HTMLInputElement | null;
  return inputEl ? inputEl.value.trim() : null;
}

// Global window registration
if (typeof window !== 'undefined') {
  (window as any).setupAdminPanelEventListeners = setupAdminPanelEventListeners;
  (window as any).getTargetUserId = getTargetUserId;

  // Auto-bind on DOM load and on periodic DOM mutations (e.g. modal open / tab switch)
  if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => {
      setupAdminPanelEventListeners();
    });
  } else {
    setupAdminPanelEventListeners();
  }
}
