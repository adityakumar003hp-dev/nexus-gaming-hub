import { db } from './firebase_config.js';
import { doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// References to Firestore System Documents
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
});

// 2. LIVE ECONOMY & ENTRY FEES LISTENER
onSnapshot(economyDocRef, (docSnap) => {
  if (docSnap.exists()) {
    const { coinsPerGem, gameEntryFeeCoins } = docSnap.data();
    
    // Update match entry fees and economy rates on UI elements
    const entryFeeDisplay = document.getElementById("entryFeeDisplay");
    if (entryFeeDisplay) entryFeeDisplay.textContent = `${gameEntryFeeCoins} Coins`;
    
    window.currentEconomyRates = { coinsPerGem, gameEntryFeeCoins };
  }
});

// 3. LIVE MODERATION & CHAT POLICY LISTENER
onSnapshot(moderationDocRef, (docSnap) => {
  if (docSnap.exists()) {
    const { globalBroadcast, slowModeSeconds, autoFilter } = docSnap.data();
    
    // Display broadcast banner if active
    const broadcastElement = document.getElementById("globalBroadcastBanner");
    if (broadcastElement && globalBroadcast) {
      broadcastElement.textContent = globalBroadcast;
      broadcastElement.style.display = "block";
    } else if (broadcastElement && !globalBroadcast) {
      broadcastElement.style.display = "none";
    }

    // Update chat system rules
    window.chatSettings = { slowModeSeconds, autoFilter };
  }
});

// 4. LIVE TOURNAMENT LISTENER
onSnapshot(tournamentDocRef, (docSnap) => {
  if (docSnap.exists()) {
    const tournamentData = docSnap.data();
    
    // Render current active tournament to main lobby
    if (window.renderActiveTournaments) {
      window.renderActiveTournaments(tournamentData.list || []);
    }
  }
});
