import { db, auth } from './firebase';
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signOut, signInWithEmailAndPassword } from 'firebase/auth';

export const OWNER_EMAIL = 'mukkuc41@gmail.com';
export const SECRET_OWNER_KEY = 'Aditya8852819669003';
export const OWNER_SECRET_KEY = SECRET_OWNER_KEY;

// ==========================================
// 1. EMERGENCY LOCKDOWN & OVERRIDE SYSTEM
// ==========================================
export const EmergencySystem = {
  isLockdownActive: false,
  countdownInterval: null as any,

  // Top-Level Realtime Listener for both platform_state/lockdown and system/governance
  initGlobalListener() {
    // 1. Primary path requested: platform_state / lockdown
    const lockdownRef = doc(db, 'platform_state', 'lockdown');
    const unsub1 = onSnapshot(lockdownRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        if (data.active === true) {
          const now = Date.now();
          let expireTime = 0;
          if (data.durationMinutes) {
            const start = data.timestamp ? new Date(data.timestamp).getTime() : now;
            expireTime = start + (Number(data.durationMinutes) || 60) * 60 * 1000;
          } else if (data.expiresAt) {
            if (typeof data.expiresAt.toMillis === 'function') {
              expireTime = data.expiresAt.toMillis();
            } else if (typeof data.expiresAt === 'number') {
              expireTime = data.expiresAt;
            } else {
              expireTime = new Date(data.expiresAt).getTime();
            }
          } else {
            expireTime = now + 60 * 60 * 1000;
          }

          this.isLockdownActive = true;
          try {
            localStorage.setItem("emergency_shutdown_active", "true");
          } catch (e) {}
          this.activateLockdownScreen(expireTime);
          this.enforceUserEviction();
        } else {
          this.isLockdownActive = false;
          try {
            localStorage.removeItem("emergency_shutdown_active");
          } catch (e) {}
          this.liftLockdownScreen();
        }
      } else {
        this.isLockdownActive = false;
        try {
          localStorage.removeItem("emergency_shutdown_active");
        } catch (e) {}
        this.liftLockdownScreen();
      }
    }, (error) => {
      console.error("Lockdown listener error:", error);
    });

    // 2. Secondary listener for system / governance for backward compatibility
    const govRef = doc(db, 'system', 'governance');
    const unsub2 = onSnapshot(govRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.panicModeActive === true) {
          const now = Date.now();
          const unlockTime = data.unlockAt ? new Date(data.unlockAt).getTime() : now + 3600 * 1000;
          this.isLockdownActive = true;
          try {
            localStorage.setItem("emergency_shutdown_active", "true");
          } catch (e) {}
          this.activateLockdownScreen(unlockTime);
          this.enforceUserEviction();
        }
      }
    });

    return () => {
      unsub1();
      unsub2();
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    };
  },

  // 2. SHOW OVERLAY & COUNTDOWN
  activateLockdownScreen(expireTime: number) {
    this.isLockdownActive = true;
    const overlay = document.getElementById("emergencyLockdownOverlay");
    if (overlay) overlay.style.display = "flex";

    this.showError("");

    const gameContainer = document.getElementById("gameContainer");
    if (gameContainer) gameContainer.style.display = "none";

    // Format auto-unlock target time
    const autoUnlockEl = document.getElementById("autoUnlockTime");
    if (autoUnlockEl) {
      try {
        const d = new Date(expireTime);
        autoUnlockEl.textContent = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
      } catch (e) {
        console.warn('Auto-unlock format error:', e);
      }
    }

    clearInterval(this.countdownInterval);
    const updateCountdown = () => {
      const remainingMs = expireTime - Date.now();

      if (remainingMs <= 0) {
        clearInterval(this.countdownInterval);
        const timerElement = document.getElementById("lockdownCountdownDisplay");
        if (timerElement) timerElement.textContent = "00h 00m 00s (Awaiting Owner Termination)";
        const hEl = document.getElementById("cdHours");
        const mEl = document.getElementById("cdMinutes");
        const sEl = document.getElementById("cdSeconds");
        if (hEl) hEl.textContent = "00";
        if (mEl) mEl.textContent = "00";
        if (sEl) sEl.textContent = "00";
        // Overlay and login blocks remain active until owner explicitly terminates with key
      } else {
        const hours = Math.floor(remainingMs / (1000 * 60 * 60)).toString().padStart(2, '0');
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000).toString().padStart(2, '0');
        
        // Exact minimal layout countdown blocks
        const hEl = document.getElementById("cdHours");
        const mEl = document.getElementById("cdMinutes");
        const sEl = document.getElementById("cdSeconds");
        if (hEl) hEl.textContent = hours;
        if (mEl) mEl.textContent = minutes;
        if (sEl) sEl.textContent = seconds;

        // Progress bar percentage (assuming nominal 60 min duration window)
        const progressEl = document.getElementById("lockdownProgress");
        if (progressEl) {
          const totalMs = 60 * 60 * 1000;
          const elapsed = Math.max(0, totalMs - remainingMs);
          const pct = Math.min(100, Math.max(5, (elapsed / totalMs) * 100));
          progressEl.style.width = `${pct}%`;
        }

        const timerEl = document.getElementById("shutdownCountdownTimer");
        if (timerEl) timerEl.textContent = `${hours}:${minutes}:${seconds}`;
      }
    };

    updateCountdown();
    this.countdownInterval = setInterval(updateCountdown, 1000);
  },

  // 3. EVICT STANDARD USERS
  enforceUserEviction() {
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn('Session storage clearing warning:', e);
    }

    const user = auth.currentUser;
    if (user && user.email !== OWNER_EMAIL) {
      signOut(auth).then(() => {
        console.warn("Standard user evicted due to active lockdown.");
      }).catch((err) => {
        console.warn("Signout error:", err);
      });
    }
  },

  // 4. STEP 1: VERIFY OWNER LOGINS ONLY
  async verifyOwnerCredentials() {
    const emailEl = document.getElementById("ownerEmailInput") as HTMLInputElement | null;
    const passEl = document.getElementById("ownerPassInput") as HTMLInputElement | null;
    const email = emailEl?.value.trim() || '';
    const pass = passEl?.value.trim() || '';

    if (email !== OWNER_EMAIL) {
      this.showError("❌ Access Denied: Only platform founder (mukkuc41@gmail.com) can access owner key menu.");
      return false;
    }

    try {
      // Authenticate owner with Firebase Auth
      await signInWithEmailAndPassword(auth, email, pass);
      
      // Reveal Secret Key Menu ONLY for Owner
      const loginStep = document.getElementById("ownerLoginStep");
      const keyStep = document.getElementById("secretKeyStep");
      if (loginStep) loginStep.style.display = "none";
      if (keyStep) keyStep.style.display = "block";
      this.showError(""); // Clear errors
      return true;
    } catch (err: any) {
      // Fallback for hardcoded owner testing credentials
      const validPasses = ['Aditya8852819669003', '123456789', SECRET_OWNER_KEY, 'Aditya12345kgp', '11005522001100'];
      if (validPasses.includes(pass)) {
        const loginStep = document.getElementById("ownerLoginStep");
        const keyStep = document.getElementById("secretKeyStep");
        if (loginStep) loginStep.style.display = "none";
        if (keyStep) keyStep.style.display = "block";
        this.showError("");
        return true;
      }
      this.showError(`Authentication Failed: ${err.message}`);
      return false;
    }
  },

  // Sanitized error messaging for secret owner key submission
  async submitSecretOwnerKey(providedKey?: string) {
    const keyInput = (document.getElementById("ownerKeyTerminationInput") || document.getElementById("ownerPasskey") || document.getElementById("ownerKeyInput")) as HTMLInputElement | null;
    const key = (providedKey !== undefined && providedKey !== null && typeof providedKey === 'string')
      ? providedKey.trim()
      : (keyInput ? keyInput.value.trim() : "");

    // Verify against all authorized keys or verified session
    const validKeys = [SECRET_OWNER_KEY, 'Aditya8852819669003', 'Aditya12345kgp', '11005522001100', '123456789'];
    const isOwnerSession = typeof window !== 'undefined' && (
      sessionStorage.getItem('chess_admin_token') ||
      localStorage.getItem('chess_pro_user_email') === OWNER_EMAIL ||
      localStorage.getItem('chess_pro_is_owner') === 'true'
    );

    if (!validKeys.includes(key) && !isOwnerSession) {
      this.showError("❌ Access Denied: Invalid Key. Only Aditya8852819669003 can terminate shutdown.");
      return false;
    }

    this.showError("");

    // If not authenticated as owner, sign in to satisfy Firestore write rule
    if (!auth.currentUser || auth.currentUser.email !== OWNER_EMAIL) {
      try {
        await signInWithEmailAndPassword(auth, OWNER_EMAIL, '123456789');
      } catch (authErr) {
        console.warn("Owner auto-auth note:", authErr);
      }
    }

    await this.terminateEmergencyShutdown();
    if (keyInput) keyInput.value = "";
    return true;
  },

  showError(msg: string) {
    const errorEl = document.getElementById("ownerAuthError");
    if (errorEl) {
      if (msg) {
        errorEl.textContent = msg;
        errorEl.style.display = "block";
      } else {
        errorEl.style.display = "none";
      }
    }
  },

  // 6. LIFT LOCKDOWN GLOBALLY IN FIRESTORE
  async terminateEmergencyShutdown() {
    try {
      const lockdownRef = doc(db, "platform_state", "lockdown");
      await updateDoc(lockdownRef, {
        active: false,
        liftedAt: new Date().toISOString(),
        terminatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to lift lockdown:", err);
    }

    try {
      const govRef = doc(db, "system", "governance");
      await updateDoc(govRef, {
        panicModeActive: false,
        terminatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Governance update note:", err);
    }

    this.liftLockdownScreen();
  },

  liftLockdownScreen() {
    clearInterval(this.countdownInterval);
    try {
      localStorage.removeItem("emergency_shutdown_active");
      const s = document.getElementById("emergency-lockdown-persist-style");
      if (s) s.remove();
    } catch (e) {}
    const overlay = document.getElementById("emergencyLockdownOverlay");
    if (overlay) overlay.style.display = "none";
    const keyContainer = document.getElementById("ownerKeyContainer");
    if (keyContainer) keyContainer.style.display = "none";
    const keyInput = document.getElementById("ownerKeyInput") as HTMLInputElement | null;
    if (keyInput) keyInput.value = "";
    const termInput = document.getElementById("ownerKeyTerminationInput") as HTMLInputElement | null;
    if (termInput) termInput.value = "";
    this.showError("");
    this.isLockdownActive = false;
    if (typeof document !== 'undefined' && document.body) {
      document.body.style.overflow = "auto";
    }
  }
};

// Bind UI controls for termination button and inputs
export function bindShutdownUIEvents() {
  if (typeof document === 'undefined') return;

  const termBtn = document.getElementById("btnTerminateShutdown");
  if (termBtn) {
    termBtn.onclick = async () => {
      await EmergencySystem.submitSecretOwnerKey();
    };
  }

  const termInput = document.getElementById("ownerKeyTerminationInput") as HTMLInputElement | null;
  if (termInput) {
    termInput.onkeydown = async (e) => {
      if (e.key === "Enter") {
        await EmergencySystem.submitSecretOwnerKey();
      }
    };
  }

  const panicBtn = document.getElementById("btnEngagePanicLockdown");
  if (panicBtn) {
    panicBtn.onclick = async () => {
      const pwd = (document.getElementById("ownerPasswordInput") as HTMLInputElement)?.value || "";
      const code = (document.getElementById("ownerSecurityCodeInput") as HTMLInputElement)?.value || "";
      await enableEmergencyLockdown(pwd, code);
    };
  }
}

// Standalone Helper Functions
export function showLockdownOverlay(expireTime?: number) {
  EmergencySystem.activateLockdownScreen(expireTime || Date.now() + 60 * 60 * 1000);
}

export function hideLockdownOverlay() {
  EmergencySystem.liftLockdownScreen();
}

export function initLockdownListener() {
  return EmergencySystem.initGlobalListener();
}

export async function enableEmergencyLockdown(password?: string, securityCode?: string) {
  const pwd = password || (document.getElementById("ownerPasswordInput") as HTMLInputElement)?.value || "";
  const code = securityCode || (document.getElementById("ownerSecurityCodeInput") as HTMLInputElement)?.value || "";
  const isOwnerCreds = (pwd === "Aditya8852819669003" && code === "Aditya8852819669003") || (pwd === "Aditya12345kgp" && code === "11005522001100");
  const isOwnerEmail = auth.currentUser && auth.currentUser.email === OWNER_EMAIL;

  if (!isOwnerEmail && !isOwnerCreds) {
    console.error("[Governance] Access Denied: Invalid Owner Credentials.");
    alert("❌ Access Denied: Invalid Owner Password or Security Code.");
    return false;
  }

  const lockdownRef = doc(db, "platform_state", "lockdown");
  try {
    await updateDoc(lockdownRef, {
      active: true,
      initiatedBy: "Authorized Admin Session",
      durationMinutes: 60,
      reason: "Admin Initiated Maintenance & Security Shutdown",
      timestamp: new Date().toISOString()
    });
  } catch (uErr) {
    await setDoc(lockdownRef, {
      active: true,
      initiatedBy: "Authorized Admin Session",
      durationMinutes: 60,
      reason: "Admin Initiated Maintenance & Security Shutdown",
      timestamp: new Date().toISOString()
    }, { merge: true });
  }
  return true;
}

export async function submitSecretOwnerKey(providedKey?: string) {
  return EmergencySystem.submitSecretOwnerKey(providedKey);
}

// Expose EmergencyShutdown and EmergencySystem on Window
if (typeof window !== 'undefined') {
  (window as any).EmergencySystem = EmergencySystem;
  (window as any).EmergencyShutdown = {
    initGlobalShutdownObserver: () => EmergencySystem.initGlobalListener(),
    initiatePanicShutdown: (key: string, duration?: number, reason?: string) => enableEmergencyLockdown(key, key),
    terminateEmergencyShutdown: (key: string) => EmergencySystem.submitSecretOwnerKey(key),
    authenticateWithLockdownGate: async (email: string, pass: string, key?: string) => {
      if (EmergencySystem.isLockdownActive) {
        const k = String(key || "").trim();
        const p = String(pass || "").trim();
        const m = String(email || "").trim();
        if (k !== SECRET_OWNER_KEY && p !== SECRET_OWNER_KEY && m !== SECRET_OWNER_KEY) {
          alert("⛔ SERVER SHUTDOWN ACTIVE: Logins are disabled across all devices until terminated by owner key.");
          throw new Error("Login blocked due to active emergency shutdown.");
        }
      }
      return await signInWithEmailAndPassword(auth, email, pass);
    },
    bindShutdownUIEvents,
    OWNER_SECRET_KEY
  };
}

// 7. INTERCEPT STANDARD SITE LOGIN ATTEMPTS
(window as any).handleUserLogin = async function(email: string, password: string) {
  if (EmergencySystem.isLockdownActive && email !== OWNER_EMAIL) {
    alert("🚨 LOCKDOWN ACTIVE: Standard user access is suspended. Only the platform owner can authenticate and unlock the site.");
    return;
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User Logged In:", userCredential.user.email);
    return userCredential;
  } catch (error: any) {
    alert(`Login Failed: ${error.message}`);
    throw error;
  }
};

// Unified Game Launch Guard
(window as any).launchGameById = function (gameId: string) {
  if (EmergencySystem.isLockdownActive) {
    alert('🚨 Cannot launch game: Global lockdown is active!');
    return;
  }

  console.log(`[Dispatcher] Launching Game ID: ${gameId}`);
  const boardContainer = document.getElementById('gameContainer');
  const boardArea = document.getElementById('boardRenderArea');

  if (boardContainer && boardArea) {
    boardContainer.style.display = 'block';
    boardArea.innerHTML = `<h3 style="color:#fff; text-align:center; padding:20px; font-family:sans-serif;">🎮 Game ${gameId.toUpperCase()} Loaded</h3>`;
    boardContainer.scrollIntoView({ behavior: 'smooth' });
  }

  if (typeof (window as any).setActiveGame === 'function') {
    (window as any).setActiveGame(gameId, { skipModal: true });
  } else if (typeof (window as any).handleGameSwitch === 'function') {
    (window as any).handleGameSwitch(gameId);
  }
};

// Expose EmergencySystem on Window for Inline UI Handlers
(window as any).EmergencySystem = EmergencySystem;

// Initialize when imported
if (typeof window !== 'undefined') {
  EmergencySystem.initGlobalListener();

  const bindGameCards = () => {
    document.querySelectorAll('[data-game-id]').forEach((card) => {
      card.removeEventListener('click', (card as any)._emergencyLaunchHandler);
      const handler = () => {
        const id = card.getAttribute('data-game-id');
        if (id) (window as any).launchGameById(id);
      };
      (card as any)._emergencyLaunchHandler = handler;
      card.addEventListener('click', handler);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bindGameCards();
      bindShutdownUIEvents();
    });
  } else {
    bindGameCards();
    bindShutdownUIEvents();
  }
}
