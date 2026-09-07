// ============================================================================
// FILE: admin_panel.js
// DESCRIPTION: Admin Panel Handler for Platform State Management
// ============================================================================

import { db } from './public/firebase_config.js';
import { doc, updateDoc, setDoc, arrayUnion } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Helper to safely write document even if it doesn't exist yet
async function safeSetDoc(docRef, data) {
  try {
    await updateDoc(docRef, data);
  } catch (err) {
    await setDoc(docRef, data, { merge: true });
  }
}

// Update Global Game Mode
export async function setGlobalGameMode(modeName) {
  await safeSetDoc(doc(db, 'platform_state', 'system'), {
    activeMode: modeName,
    updatedAt: new Date().toISOString()
  });
}

// Update Economy Settings
export async function updateEconomy(coinsPerGem, entryFee) {
  await safeSetDoc(doc(db, 'platform_state', 'economy'), {
    coinsPerGem: Number(coinsPerGem),
    gameEntryFeeCoins: Number(entryFee),
    updatedAt: new Date().toISOString()
  });
}

// Broadcast Message & Apply Moderation
export async function applyModeration(broadcastMsg, slowMode, filterEnabled) {
  await safeSetDoc(doc(db, 'platform_state', 'moderation'), {
    globalBroadcast: broadcastMsg,
    slowModeSeconds: Number(slowMode),
    autoFilter: filterEnabled,
    updatedAt: new Date().toISOString()
  });
}

// Launch New Tournament Globally
export async function launchTournament(name, prizePool, entryFee, maxPlayers) {
  const newTournament = {
    id: 'tourn_' + Date.now(),
    name,
    prizePool: Number(prizePool),
    entryFee: Number(entryFee),
    maxPlayers: Number(maxPlayers),
    currentPlayers: 0,
    status: 'ACTIVE'
  };

  try {
    await updateDoc(doc(db, 'platform_state', 'tournaments'), {
      list: arrayUnion(newTournament)
    });
  } catch (err) {
    await setDoc(doc(db, 'platform_state', 'tournaments'), {
      list: [newTournament]
    }, { merge: true });
  }
}

// Credentials configured for Owner verification
export const VALID_OWNER_PASSWORD = "Aditya8852819669003"; // Your configured password
export const VALID_SECURITY_CODE = "Aditya8852819669003";  // Your configured security code

/**
 * Triggers Panic Lockdown when valid verification credentials are passed
 */
export async function triggerPanicLockdown(inputPassword, inputSecurityCode, durationMinutes, reasonMessage) {
  // 1. Verify credentials entered in Owner Modal
  if (inputPassword !== VALID_OWNER_PASSWORD || inputSecurityCode !== VALID_SECURITY_CODE) {
    console.error("[Governance] Access Denied: Invalid Owner Credentials.");
    alert("❌ Access Denied: Invalid Owner Password or Security Code.");
    return false;
  }

  try {
    const lockdownRef = doc(db, "platform_state", "lockdown");

    // 2. Bypass email restriction and execute state change in Firestore
    try {
      await updateDoc(lockdownRef, {
        active: true,
        initiatedBy: "Authorized Admin Session",
        durationMinutes: Number(durationMinutes) || 60,
        reason: reasonMessage || "Admin Initiated Maintenance & Security Shutdown",
        timestamp: new Date().toISOString()
      });
    } catch (uErr) {
      try {
        await setDoc(lockdownRef, {
          active: true,
          initiatedBy: "Authorized Admin Session",
          durationMinutes: Number(durationMinutes) || 60,
          reason: reasonMessage || "Admin Initiated Maintenance & Security Shutdown",
          timestamp: new Date().toISOString()
        }, { merge: true });
      } catch (fErr) {
        console.warn("[Firestore Lockdown Sync]", fErr);
      }
    }

    // 3. Synchronize with server-side panic lockdown API
    try {
      await fetch('/api/admin/panic-lockdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: inputPassword,
          securityCode: inputSecurityCode,
          durationMinutes: Number(durationMinutes) || 60,
          reason: reasonMessage
        })
      });
    } catch (apiErr) {
      console.warn("[API Lockdown Sync]", apiErr);
    }

    console.log("🚨 Panic Lockdown successfully activated across platform!");
    alert("🚨 Panic Lockdown Initiated Successfully!");
    return true;

  } catch (error) {
    console.error("[Governance Error]:", error.message);
    alert(`❌ Failed to initiate lockdown: ${error.message}`);
    return false;
  }
}

// Function to bind lockdown trigger button
export function setupLockdownButton() {
  const btn = document.getElementById("btnEngagePanicLockdown") || document.getElementById("btnEngageLockdown");
  btn?.addEventListener("click", async () => {
    const pwdInput = document.getElementById("ownerPasswordInput")?.value || "";
    const codeInput = document.getElementById("ownerSecurityCodeInput")?.value || "";
    const duration = document.getElementById("shutdownDurationInput")?.value || 60;
    const reason = document.getElementById("shutdownReasonInput")?.value || "";

    await triggerPanicLockdown(pwdInput, codeInput, duration, reason);
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLockdownButton);
  } else {
    setupLockdownButton();
  }
}

// Global window attachment for convenience
if (typeof window !== 'undefined') {
  window.AdminPanel = {
    setGlobalGameMode,
    updateEconomy,
    applyModeration,
    launchTournament,
    triggerPanicLockdown,
    VALID_OWNER_PASSWORD,
    VALID_SECURITY_CODE
  };
}
