// ============================================================================
// FILE: src/lib/adminGameBridge.ts
// Description: Real-time Event Listener & Sync Bridge for Admin Panel Elements
// ============================================================================

import { db } from './firebase';
import { doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

// References
const globalConfigRef = doc(db, 'system', 'global_config');
const moderationRef = doc(db, 'system', 'moderation');
const tournamentRef = doc(db, 'system', 'tournaments');

/**
 * GAME SELECT & ENTRY FEE SYNCHRONIZATION
 * Triggered by: "SWITCH GLOBAL ACTIVE GAME" button
 */
export async function syncGameModeAndFee() {
  const gameSelect = document.querySelector<HTMLSelectElement>('select[name="game_select"]');
  const entryFeeInput = document.querySelector<HTMLInputElement>('input[name="entry_fee"]');
  const currencySelect = document.querySelector<HTMLSelectElement>('select[name="currency_type"]');

  if (!gameSelect || !entryFeeInput) {
    console.error('Missing UI elements for Game Switcher.');
    return;
  }

  const selectedGame = gameSelect.value;
  const entryFee = Number(entryFeeInput.value) || 0;
  const currency = currencySelect ? currencySelect.value : 'Coins';

  try {
    await setDoc(
      globalConfigRef,
      {
        activeGame: selectedGame,
        entryFeeCoins: currency === 'Coins' ? entryFee : 2000,
        entryFeeGems: currency === 'Gems' ? entryFee : 2000,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Mirror to platform_state for existing ecosystem listeners
    try {
      await setDoc(doc(db, 'platform_state', 'active_game'), {
        activeGame: selectedGame,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      await setDoc(doc(db, 'platform_state', 'economy'), {
        gameEntryFeeCoins: currency === 'Coins' ? entryFee : 1000,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.warn('Mirror platform_state warning:', e);
    }

    const entryFeeDisplay = document.getElementById('entryFeeDisplay');
    if (entryFeeDisplay) {
      entryFeeDisplay.textContent = `${entryFee} ${currency}`;
    }

    if (typeof window !== 'undefined' && (window as any).updateMainAppGameMode) {
      (window as any).updateMainAppGameMode(selectedGame);
    }

    alert(`✅ Global Game updated to: ${selectedGame} (${entryFee} ${currency})`);
  } catch (error: any) {
    console.error('Error updating game settings:', error);
    alert(`❌ Failed to sync game settings: ${error?.message || error}`);
  }
}

/**
 * USER BALANCE & SETTINGS ADJUSTMENT
 * Triggered by: "SAVE ADJUSTMENTS" button
 */
export async function syncUserAdjustments() {
  const userLookupInput = (document.querySelector('input[placeholder="Target Username or ID"]') ||
    document.querySelector('input[placeholder*="Target Username or ID"]') ||
    document.getElementById('searchInput')) as HTMLInputElement | null;

  const coinsInput = (document.querySelector('input[placeholder*="5000 or -1000"]') ||
    document.getElementById('coinDelta')) as HTMLInputElement | null;

  const gemsInput = (document.querySelector('input[placeholder*="500 or -100"]') ||
    document.getElementById('gemDelta')) as HTMLInputElement | null;

  if (!userLookupInput || !userLookupInput.value.trim()) {
    alert('Please enter a valid User ID or Username.');
    return;
  }

  const userId = userLookupInput.value.trim();
  const coinsValue = Number(coinsInput ? coinsInput.value : 0) || 0;
  const gemsValue = Number(gemsInput ? gemsInput.value : 0) || 0;

  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        coins: coinsValue,
        gems: gemsValue,
        lastAdminUpdate: new Date().toISOString(),
      },
      { merge: true }
    );

    if (typeof window !== 'undefined' && typeof (window as any).fetchPermanentUsers === 'function') {
      (window as any).fetchPermanentUsers();
    }

    alert(`✅ Updated account (${userId}) with ${coinsValue} Coins and ${gemsValue} Gems.`);
  } catch (error: any) {
    console.error('Error modifying user balance:', error);
    alert(`❌ Balance update failed: ${error?.message || error}`);
  }
}

/**
 * USER SANCTIONS (MUTE / BAN / KICK)
 * Triggered by: "MUTE CHAT", "KICK SESSION", "PERMANENT BAN"
 */
export async function applyUserSanction(actionType: 'MUTE' | 'BAN' | 'KICK') {
  const userLookupInput = (document.querySelector('input[placeholder="Target Username or ID"]') ||
    document.querySelector('input[placeholder*="Target Username or ID"]') ||
    document.getElementById('searchInput')) as HTMLInputElement | null;

  if (!userLookupInput || !userLookupInput.value.trim()) {
    alert('Please select or lookup a valid User ID first.');
    return;
  }

  const userId = userLookupInput.value.trim();
  const userRef = doc(db, 'users', userId);

  try {
    if (actionType === 'MUTE') {
      await updateDoc(userRef, { isMuted: true, mutedAt: new Date().toISOString() });
      alert(`🔇 User (${userId}) muted.`);
    } else if (actionType === 'BAN') {
      await updateDoc(userRef, { isBanned: true, bannedAt: new Date().toISOString() });
      alert(`⛔ User (${userId}) permanently banned.`);
    } else if (actionType === 'KICK') {
      await updateDoc(userRef, { forceSessionRevoke: true, kickedAt: new Date().toISOString() });
      alert(`🥾 Session revoked for (${userId}).`);
    }

    if (typeof window !== 'undefined' && typeof (window as any).fetchPermanentUsers === 'function') {
      (window as any).fetchPermanentUsers();
    }
  } catch (error: any) {
    console.error(`Error executing ${actionType}:`, error);
    alert(`❌ Action failed: ${error?.message || error}`);
  }
}

/**
 * BROADCAST & CHAT MODERATION RULES
 * Triggered by: "BROADCAST" and "APPLY CHAT RULES"
 */
export async function syncModerationRules() {
  const broadcastInput = (document.querySelector('input[placeholder="system notification"]') ||
    document.querySelector('input[placeholder*="system notification"]') ||
    document.getElementById('admBroadcastInput')) as HTMLInputElement | null;

  const cooldownInput = (document.querySelector('input[placeholder="3"]') ||
    document.getElementById('admChatSlowmode')) as HTMLInputElement | null;

  const profanitySelect = (document.querySelector('select[name="profanity_filter"]') ||
    document.getElementById('admChatFilter')) as HTMLSelectElement | null;

  const payload: Record<string, any> = {
    chatCooldownSeconds: cooldownInput ? Number(cooldownInput.value) : 3,
    autoFilterProfanity: profanitySelect ? profanitySelect.value : 'Enabled',
    updatedAt: new Date().toISOString(),
  };

  if (broadcastInput && broadcastInput.value.trim() !== '') {
    payload.latestBroadcast = broadcastInput.value.trim();
    payload.broadcastTimestamp = new Date().toISOString();
  }

  try {
    await setDoc(moderationRef, payload, { merge: true });

    try {
      await setDoc(doc(db, 'platform_state', 'moderation'), {
        globalBroadcast: payload.latestBroadcast || '',
        slowModeSeconds: payload.chatCooldownSeconds,
        autoFilter: payload.autoFilterProfanity,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.warn('Mirror moderation warning:', e);
    }

    const broadcastElement = document.getElementById('globalBroadcastBanner');
    if (broadcastElement && payload.latestBroadcast) {
      broadcastElement.textContent = payload.latestBroadcast;
      broadcastElement.style.display = 'block';
    }

    alert('📢 Chat rules & broadcast updated globally across all active sessions.');
  } catch (error: any) {
    console.error('Error updating moderation rules:', error);
    alert(`❌ Moderation sync failed: ${error?.message || error}`);
  }
}

/**
 * TOURNAMENT CREATION
 * Triggered by: "LAUNCH TOURNAMENT" button
 */
export async function launchNewTournament() {
  const nameInput = (document.querySelector('input[placeholder="Grand Blitz Showdown"]') ||
    document.querySelector('input[placeholder*="Grand Blitz Showdown"]') ||
    document.getElementById('tournName')) as HTMLInputElement | null;

  const prizeInput = (document.querySelector('input[placeholder="10000"]') ||
    document.getElementById('tournPrize')) as HTMLInputElement | null;

  const entryInput = (document.querySelector('input[placeholder="200"]') ||
    document.getElementById('tournFee')) as HTMLInputElement | null;

  const maxPlayersInput = (document.querySelector('input[placeholder="64"]') ||
    document.getElementById('tournMax')) as HTMLInputElement | null;

  if (!nameInput || !nameInput.value.trim()) {
    alert('Please enter a valid tournament name.');
    return;
  }

  const tournamentData = {
    id: `tourn_${Date.now()}`,
    name: nameInput.value.trim(),
    prizePool: Number(prizeInput ? prizeInput.value : 10000),
    entryFee: Number(entryInput ? entryInput.value : 200),
    maxPlayers: Number(maxPlayersInput ? maxPlayersInput.value : 64),
    status: 'LIVE',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(tournamentRef, { latestTournament: tournamentData }, { merge: true });

    try {
      await setDoc(doc(db, 'platform_state', 'tournaments'), {
        latestTournament: tournamentData,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.warn('Mirror tournament warning:', e);
    }

    alert(`🏆 Tournament "${tournamentData.name}" is now live!`);
  } catch (error: any) {
    console.error('Error launching tournament:', error);
    alert(`❌ Failed to launch tournament: ${error?.message || error}`);
  }
}

// Global registry for direct programmatic and window calls
if (typeof window !== 'undefined') {
  (window as any).syncGameModeAndFee = syncGameModeAndFee;
  (window as any).syncUserAdjustments = syncUserAdjustments;
  (window as any).applyUserSanction = applyUserSanction;
  (window as any).syncModerationRules = syncModerationRules;
  (window as any).launchNewTournament = launchNewTournament;
}

// Live propagation listener: Listen to system/global_config, system/moderation, system/tournaments
export function initAdminBridgeLivePropagation() {
  if (typeof window === 'undefined') return;

  // 1. Listen for global game config changes
  onSnapshot(
    globalConfigRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.entryFeeCoins !== undefined || data.entryFeeGems !== undefined) {
          if (typeof window !== 'undefined') {
            window.CURRENT_ENTRY_FEE = {
              coins: data.entryFeeCoins !== undefined ? Number(data.entryFeeCoins) : 2000,
              gems: data.entryFeeGems !== undefined ? Number(data.entryFeeGems) : 2000
            };
          }
        }
        if (data.activeGame && (window as any).updateMainAppGameMode) {
          (window as any).updateMainAppGameMode(data.activeGame);
        }
        const entryFeeDisplay = document.getElementById('entryFeeDisplay');
        if (entryFeeDisplay && data.entryFeeCoins !== undefined) {
          entryFeeDisplay.textContent = `${data.entryFeeCoins} Coins`;
        }
      }
    },
    (err) => console.warn('Bridge global_config listener warning:', err)
  );

  // 2. Listen for moderation changes & broadcasts
  onSnapshot(
    moderationRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const banner = document.getElementById('globalBroadcastBanner');
        if (banner) {
          if (data.latestBroadcast && String(data.latestBroadcast).trim().length > 0) {
            banner.textContent = String(data.latestBroadcast);
            banner.style.display = 'block';
          } else {
            banner.style.display = 'none';
          }
        }
        if (data.chatCooldownSeconds !== undefined) {
          (window as any).chatCooldownSeconds = data.chatCooldownSeconds;
        }
      }
    },
    (err) => console.warn('Bridge moderation listener warning:', err)
  );

  // 3. Listen for tournament changes
  onSnapshot(
    tournamentRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.latestTournament && (window as any).renderActiveTournaments) {
          (window as any).renderActiveTournaments([data.latestTournament]);
        }
      }
    },
    (err) => console.warn('Bridge tournaments listener warning:', err)
  );
}

// Auto-run listener initialization
if (typeof window !== 'undefined') {
  initAdminBridgeLivePropagation();
}
