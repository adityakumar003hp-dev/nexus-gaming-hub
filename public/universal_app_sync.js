// ============================================================================
// FILE: universal_app_sync.js
// Description: Core Universal App Sync Engine - writes directly to Firestore
// and triggers live updates across the main website.
// ============================================================================

import { db, auth } from './firebase_config.js';
import { 
  executeAdminUserAction, 
  saveEconomySettings, 
  saveModerationSettings, 
  createGlobalTournament, 
  updateClanStatus, 
  setEmergencyLockdown,
  initUniversalGameListeners
} from './master_admin_sync.js';

/**
 * 1. User Adjustments: Balance grant (coins/gems), ban, mute, kick
 */
export async function adminSaveUserAdjustment(targetUid, adjustmentData) {
  return await executeAdminUserAction(targetUid, adjustmentData);
}

/**
 * 2. Economy Configuration: Entry fees, gem exchange rate, jackpot pool
 */
export async function adminSaveEconomyConfig(config) {
  const coinsFee = config.coinsFee !== undefined ? config.coinsFee : 1000;
  const gemsFee = config.gemsFee !== undefined ? config.gemsFee : 500;
  const exchangeRate = config.exchangeRate !== undefined ? config.exchangeRate : 4;
  const jackpotPool = config.jackpotPool !== undefined ? config.jackpotPool : 1000000;
  return await saveEconomySettings(coinsFee, gemsFee, exchangeRate, jackpotPool);
}

/**
 * 3. Moderation Configuration: Broadcast banner, cooldowns, auto-filter
 */
export async function adminSaveModerationConfig(config) {
  const broadcastText = config.broadcastText || "";
  const chatCooldown = config.chatCooldown !== undefined ? config.chatCooldown : 3;
  const autoFilter = config.autoFilter !== undefined ? config.autoFilter : true;
  return await saveModerationSettings(broadcastText, chatCooldown, autoFilter);
}

/**
 * 4. Tournaments: Create and broadcast tournament
 */
export async function adminCreateTournament(tournamentPayload) {
  return await createGlobalTournament(tournamentPayload);
}

/**
 * 5. Clan Moderation: Status approval or ban
 */
export async function adminModerateClan(clanId, options = {}) {
  const isApproved = options.isApproved !== undefined ? options.isApproved : true;
  const banReason = options.banReason || "";
  return await updateClanStatus(clanId, isApproved, banReason);
}

/**
 * 6. Platform Lockdown: Emergency panic shutdown
 */
export async function adminSetPlatformLockdown(lockdownPayload) {
  const active = Boolean(lockdownPayload.active);
  const duration = lockdownPayload.duration || 60;
  const reason = lockdownPayload.reason || "Admin Initiated Maintenance & Security Shutdown";
  return await setEmergencyLockdown(active, duration, reason);
}

// Re-export core sync methods
export {
  executeAdminUserAction, 
  saveEconomySettings, 
  saveModerationSettings, 
  createGlobalTournament, 
  updateClanStatus, 
  setEmergencyLockdown,
  initUniversalGameListeners
};

// Global window registration
if (typeof window !== 'undefined') {
  window.adminSaveUserAdjustment = adminSaveUserAdjustment;
  window.adminSaveEconomyConfig = adminSaveEconomyConfig;
  window.adminSaveModerationConfig = adminSaveModerationConfig;
  window.adminCreateTournament = adminCreateTournament;
  window.adminModerateClan = adminModerateClan;
  window.adminSetPlatformLockdown = adminSetPlatformLockdown;
}
