// emergency_system.js - Re-export wrapper for unified emergency_shutdown.js
export * from './emergency_shutdown.js';
import {
  initGlobalShutdownObserver,
  initiatePanicShutdown,
  terminateEmergencyShutdown,
  authenticateWithLockdownGate,
  bindShutdownUIEvents,
  OWNER_SECRET_KEY
} from './emergency_shutdown.js';

export {
  initGlobalShutdownObserver as initLockdownListener,
  initiatePanicShutdown as enableEmergencyLockdown,
  terminateEmergencyShutdown as submitSecretOwnerKey
};
