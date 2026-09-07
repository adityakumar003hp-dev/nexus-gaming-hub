// src/lib/adminSync.ts
// Real-time Firestore synchronization for platform state

import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface EconomyRates {
  coinsPerGem?: number;
  gameEntryFeeCoins?: number;
}

export interface ChatSettings {
  slowModeSeconds?: number;
  autoFilter?: boolean;
}

export interface TournamentItem {
  id: string;
  name: string;
  prizePool: number;
  entryFee: number;
  maxPlayers: number;
  currentPlayers: number;
  status: string;
}

// Global window declarations
declare global {
  interface Window {
    updateMainAppGameMode?: (mode: string) => void;
    currentEconomyRates?: EconomyRates;
    chatSettings?: ChatSettings;
    renderActiveTournaments?: (tournaments: TournamentItem[]) => void;
  }
}

export function initAdminSyncListeners() {
  if (typeof window === 'undefined') return;

  const systemDocRef = doc(db, 'platform_state', 'system');
  const economyDocRef = doc(db, 'platform_state', 'economy');
  const moderationDocRef = doc(db, 'platform_state', 'moderation');
  const tournamentDocRef = doc(db, 'platform_state', 'tournaments');

  // 1. LIVE GAME MODE LISTENER
  onSnapshot(systemDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("Global Game Mode Updated:", data.activeMode);
      
      // Dynamically toggle accessible modes on main page
      if (window.updateMainAppGameMode) {
        window.updateMainAppGameMode(data.activeMode);
      }
    }
  }, (err) => console.warn("AdminSync system listener warning:", err));

  // 2. LIVE ECONOMY & ENTRY FEES LISTENER
  onSnapshot(economyDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const coinsPerGem = data.coinsPerGem;
      const gameEntryFeeCoins = data.gameEntryFeeCoins;
      
      // Update match entry fees and economy rates on UI elements
      const entryFeeDisplay = document.getElementById("entryFeeDisplay");
      if (entryFeeDisplay && gameEntryFeeCoins !== undefined) {
        entryFeeDisplay.textContent = `${gameEntryFeeCoins} Coins`;
      }
      
      window.currentEconomyRates = { coinsPerGem, gameEntryFeeCoins };
    }
  }, (err) => console.warn("AdminSync economy listener warning:", err));

  // 3. LIVE MODERATION & CHAT POLICY LISTENER
  onSnapshot(moderationDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const globalBroadcast = data.globalBroadcast;
      const slowModeSeconds = data.slowModeSeconds;
      const autoFilter = data.autoFilter;
      
      // Display broadcast banner if active
      const broadcastElement = document.getElementById("globalBroadcastBanner");
      if (broadcastElement) {
        if (globalBroadcast && String(globalBroadcast).trim().length > 0) {
          broadcastElement.textContent = String(globalBroadcast);
          broadcastElement.style.display = "block";
        } else {
          broadcastElement.style.display = "none";
        }
      }

      // Update chat system rules
      window.chatSettings = { slowModeSeconds, autoFilter };
    }
  }, (err) => console.warn("AdminSync moderation listener warning:", err));

  // 4. LIVE TOURNAMENT LISTENER
  onSnapshot(tournamentDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const tournamentData = docSnap.data();
      
      // Render current active tournament to main lobby
      if (window.renderActiveTournaments) {
        window.renderActiveTournaments(tournamentData.list || []);
      }
    }
  }, (err) => console.warn("AdminSync tournament listener warning:", err));
}

// Auto-initialize listeners
initAdminSyncListeners();
