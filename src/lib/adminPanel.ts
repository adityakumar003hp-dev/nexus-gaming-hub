// src/lib/adminPanel.ts
// Admin Panel Handler for Platform State Management

import { db } from './firebase';
import { doc, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';

// Helper to safely write document even if it doesn't exist yet
async function safeSetDoc(docRef: any, data: any) {
  try {
    await updateDoc(docRef, data);
  } catch (err) {
    await setDoc(docRef, data, { merge: true });
  }
}

// Update Global Game Mode
export async function setGlobalGameMode(modeName: string): Promise<void> {
  await safeSetDoc(doc(db, 'platform_state', 'system'), {
    activeMode: modeName,
    updatedAt: new Date().toISOString()
  });
}

// Update Economy Settings
export async function updateEconomy(coinsPerGem: number | string, entryFee: number | string): Promise<void> {
  await safeSetDoc(doc(db, 'platform_state', 'economy'), {
    coinsPerGem: Number(coinsPerGem),
    gameEntryFeeCoins: Number(entryFee),
    updatedAt: new Date().toISOString()
  });
}

// Broadcast Message & Apply Moderation
export async function applyModeration(broadcastMsg: string, slowMode: number | string, filterEnabled: boolean): Promise<void> {
  await safeSetDoc(doc(db, 'platform_state', 'moderation'), {
    globalBroadcast: broadcastMsg,
    slowModeSeconds: Number(slowMode),
    autoFilter: filterEnabled,
    updatedAt: new Date().toISOString()
  });
}

// Launch New Tournament Globally
export async function launchTournament(name: string, prizePool: number | string, entryFee: number | string, maxPlayers: number | string): Promise<void> {
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
export async function triggerPanicLockdown(
  inputPassword: string,
  inputSecurityCode: string,
  durationMinutes: number | string = 60,
  reasonMessage: string = "Admin Initiated Maintenance & Security Shutdown"
): Promise<boolean> {
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

  } catch (error: any) {
    console.error("[Governance Error]:", error?.message || error);
    alert(`❌ Failed to initiate lockdown: ${error?.message || error}`);
    return false;
  }
}

// Function to bind lockdown trigger button
export function setupLockdownButton() {
  if (typeof document === 'undefined') return;

  const btn = document.getElementById("btnEngagePanicLockdown") || document.getElementById("btnEngageLockdown");
  if (btn) {
    btn.addEventListener("click", async () => {
      const pwdInput = (document.getElementById("ownerPasswordInput") as HTMLInputElement)?.value || "";
      const codeInput = (document.getElementById("ownerSecurityCodeInput") as HTMLInputElement)?.value || "";
      const duration = (document.getElementById("shutdownDurationInput") as HTMLInputElement)?.value || 60;
      const reason = (document.getElementById("shutdownReasonInput") as HTMLInputElement)?.value || "";

      await triggerPanicLockdown(pwdInput, codeInput, duration, reason);
    });
  }
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
  (window as any).AdminPanel = {
    setGlobalGameMode,
    updateEconomy,
    applyModeration,
    launchTournament,
    triggerPanicLockdown,
    VALID_OWNER_PASSWORD,
    VALID_SECURITY_CODE,
    setupLockdownButton
  };
}
