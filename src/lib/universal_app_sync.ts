// ============================================================================
// FILE: src/lib/universal_app_sync.ts
// Universal App Sync Engine for React / TypeScript
// Writes directly to Firestore with multi-layer fallback to the REST API wrapper
// ============================================================================

import { 
  executeAdminUserAction, 
  saveEconomySettings, 
  saveModerationSettings, 
  createGlobalTournament, 
  updateClanStatus, 
  setEmergencyLockdown,
  initUniversalGameListeners 
} from './master_admin_sync';

export interface UserAdjustmentPayload {
  coins?: number;
  gems?: number;
  isMuted?: boolean;
  isBanned?: boolean;
  role?: string;
  [key: string]: any;
}

export interface EconomyConfigPayload {
  coinsFee?: number | string;
  gemsFee?: number | string;
  exchangeRate?: number | string;
  jackpotPool?: number | string;
  [key: string]: any;
}

export interface ModerationConfigPayload {
  broadcastText?: string;
  chatCooldown?: number | string;
  autoFilter?: boolean;
  [key: string]: any;
}

export interface TournamentConfigPayload {
  name: string;
  prizePool: number;
  entryFee: number;
  maxPlayers?: number;
  joinedPlayers?: number;
  [key: string]: any;
}

export interface ClanModerationPayload {
  isApproved?: boolean;
  banReason?: string;
  [key: string]: any;
}

export interface LockdownPayload {
  active: boolean;
  duration?: number | string;
  reason?: string;
  [key: string]: any;
}

/**
 * 1. User Adjustments (Coins, Gems, Mute, Ban, Role)
 */
export async function adminSaveUserAdjustment(targetUid: string, adjustmentData: UserAdjustmentPayload): Promise<void> {
  if (!targetUid) {
    if (typeof window !== 'undefined') alert("❌ Please select or enter a target User ID first.");
    return;
  }
  return await executeAdminUserAction(targetUid, adjustmentData);
}

/**
 * 2. Economy Configuration (Fees, Gem Rate, Jackpot Pool)
 */
export async function adminSaveEconomyConfig(config: EconomyConfigPayload): Promise<void> {
  const coinsFee = config.coinsFee !== undefined ? config.coinsFee : 1000;
  const gemsFee = config.gemsFee !== undefined ? config.gemsFee : 500;
  const exchangeRate = config.exchangeRate !== undefined ? config.exchangeRate : 4;
  const jackpotPool = config.jackpotPool !== undefined ? config.jackpotPool : 1000000;
  return await saveEconomySettings(coinsFee, gemsFee, exchangeRate, jackpotPool);
}

/**
 * 3. Moderation Configuration (Broadcast Banner, Slowmode, Profanity Auto-filter)
 */
export async function adminSaveModerationConfig(config: ModerationConfigPayload): Promise<void> {
  const broadcastText = config.broadcastText || "";
  const chatCooldown = config.chatCooldown !== undefined ? config.chatCooldown : 3;
  const autoFilter = config.autoFilter !== undefined ? Boolean(config.autoFilter) : true;
  return await saveModerationSettings(broadcastText, chatCooldown, autoFilter);
}

/**
 * 4. Tournaments (Create and broadcast tournament)
 */
export async function adminCreateTournament(tournamentPayload: TournamentConfigPayload): Promise<void> {
  return await createGlobalTournament({
    ...tournamentPayload,
    title: tournamentPayload.name,
    prizeGems: tournamentPayload.prizePool,
    entryFeeGems: tournamentPayload.entryFee,
    maxParticipants: tournamentPayload.maxPlayers || 64,
    participants: tournamentPayload.joinedPlayers || 1,
    status: 'live'
  });
}

/**
 * 5. Clan Moderation (Approve or Sanction Clan)
 */
export async function adminModerateClan(clanId: string, options: ClanModerationPayload = {}): Promise<void> {
  const isApproved = options.isApproved !== undefined ? options.isApproved : true;
  const banReason = options.banReason || "";
  return await updateClanStatus(clanId, isApproved, banReason);
}

/**
 * 6. Platform Lockdown (Emergency panic mode)
 */
export async function adminSetPlatformLockdown(lockdownPayload: LockdownPayload): Promise<void> {
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
  (window as any).adminSaveUserAdjustment = adminSaveUserAdjustment;
  (window as any).adminSaveEconomyConfig = adminSaveEconomyConfig;
  (window as any).adminSaveModerationConfig = adminSaveModerationConfig;
  (window as any).adminCreateTournament = adminCreateTournament;
  (window as any).adminModerateClan = adminModerateClan;
  (window as any).adminSetPlatformLockdown = adminSetPlatformLockdown;
}
