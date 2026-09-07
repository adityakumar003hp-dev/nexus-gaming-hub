// ============================================================================
// FILE: emergency_shutdown.js
// DESCRIPTION: Complete Unified Emergency Shutdown, Token Revocation & Recovery
// ============================================================================

export const OWNER_SECRET_KEY = "Aditya8852819669003";

/**
 * Initializes and starts observing global shutdown state.
 */
export function initGlobalShutdownObserver() {
  if (typeof window !== "undefined" && window.EmergencyShutdown?.initGlobalShutdownObserver) {
    return window.EmergencyShutdown.initGlobalShutdownObserver();
  }
}

/**
 * Initiates panic shutdown across all connected clients.
 */
export async function initiatePanicShutdown(providedKey, durationMinutes = 60, reasonMessage = "") {
  if (typeof window !== "undefined" && window.EmergencyShutdown?.initiatePanicShutdown) {
    return await window.EmergencyShutdown.initiatePanicShutdown(providedKey, durationMinutes, reasonMessage);
  }
}

/**
 * Terminates emergency shutdown using the secret owner key.
 */
export async function terminateEmergencyShutdown(providedKey) {
  if (typeof window !== "undefined" && window.EmergencyShutdown?.terminateEmergencyShutdown) {
    return await window.EmergencyShutdown.terminateEmergencyShutdown(providedKey);
  }
}

/**
 * Pre-Authentication Gateway intercepting logins during active shutdown.
 */
export async function authenticateWithLockdownGate(email, password, providedKey = "") {
  if (typeof window !== "undefined" && window.EmergencyShutdown?.authenticateWithLockdownGate) {
    return await window.EmergencyShutdown.authenticateWithLockdownGate(email, password, providedKey);
  }
}

/**
 * Binds shutdown UI events (termination button, inputs, etc.)
 */
export function bindShutdownUIEvents() {
  if (typeof window !== "undefined" && window.EmergencyShutdown?.bindShutdownUIEvents) {
    return window.EmergencyShutdown.bindShutdownUIEvents();
  }
}

// Ensure window exposure
if (typeof window !== "undefined") {
  window.EmergencyShutdown = window.EmergencyShutdown || {
    initGlobalShutdownObserver,
    initiatePanicShutdown,
    terminateEmergencyShutdown,
    authenticateWithLockdownGate,
    bindShutdownUIEvents,
    OWNER_SECRET_KEY
  };
}
