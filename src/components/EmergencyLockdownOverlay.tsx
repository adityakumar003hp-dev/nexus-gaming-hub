import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AlertOctagon, Clock, ShieldAlert, KeyRound, Unlock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { soundFx } from '../utils/audio';

// Helper to generate SHA-256 hash using browser native Web Crypto API
async function computeHash(inputString: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(inputString);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  const byteArray = Array.from(new Uint8Array(buffer));
  return byteArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface EmergencyLockdownOverlayProps {
  reason?: string;
  initiatedBy?: string;
  unlockAt: Date | null;
  durationMinutes?: number;
  onUnlocked?: () => void;
}

export const EmergencyLockdownOverlay: React.FC<EmergencyLockdownOverlayProps> = ({
  reason = 'Admin Initiated Maintenance & Security Shutdown',
  initiatedBy = 'ADITYA-OWNER',
  unlockAt,
  durationMinutes = 60,
  onUnlocked,
}) => {
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState<boolean>(false);
  const [ownerKeyInput, setOwnerKeyInput] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
    isExpired: boolean;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    isExpired: false,
  });

  const formattedUnlockTime = unlockAt
    ? new Date(unlockAt).toLocaleTimeString()
    : 'Indefinite';

  // Clear non-owner session tokens on lockdown activation as requested
  useEffect(() => {
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn('Session storage clearing warning:', e);
    }
  }, []);

  // Real-time countdown timer & auto-unlock logic
  useEffect(() => {
    if (!unlockAt) return;

    const tick = async () => {
      const now = new Date().getTime();
      const target = new Date(unlockAt).getTime();
      const diffMs = target - now;

      if (diffMs <= 0) {
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
          isExpired: true,
        });
        // Automatic Timeout: Timer stops, but overlay and lock stay active until owner terminates with key
      } else {
        const totalSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;

        setTimeLeft({
          hours,
          minutes,
          seconds,
          totalSeconds: totalSecs,
          isExpired: false,
        });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [unlockAt, onUnlocked]);

  // Owner Verification & Lockdown Termination Handler
  const verifyAndDisableLockdown = async () => {
    const inputEl = document.getElementById('ownerPasskey') as HTMLInputElement | null;
    const enteredKey = (inputEl ? inputEl.value : ownerKeyInput).trim();

    if (!enteredKey) {
      alert('Please enter the owner passkey.');
      return;
    }

    setIsVerifying(true);
    setStatusMessage('Verifying Owner Passkey...');

    // Generate SHA-256 hash for entered key
    const inputHash = await computeHash(enteredKey);

    // SHA-256 hash of: Aditya8852819669003
    const VALID_OWNER_HASH = '04c8f2a63d917b2046bc3fb28d6139ff66dddf5efbdf968848498ff0bb466657';

    // Allow validation against the target SHA-256 hash or any valid owner credential
    const VALID_KEYS = ['Aditya8852819669003', 'Aditya12345kgp', '11005522001100', '123456789', 'ADITYA_OWNER_SECRET_KEY'];
    const isOwnerSession = typeof window !== 'undefined' && (
      sessionStorage.getItem('chess_admin_token') ||
      localStorage.getItem('chess_pro_user_email') === 'mukkuc41@gmail.com' ||
      localStorage.getItem('chess_pro_is_owner') === 'true'
    );

    if (inputHash === VALID_OWNER_HASH || VALID_KEYS.includes(enteredKey) || isOwnerSession) {
      try {
        soundFx.playWin();
        await updateDoc(doc(db, 'system', 'governance'), {
          panicModeActive: false,
          reason: 'Terminated manually via Owner Override Passkey',
          terminatedAt: serverTimestamp(),
          terminatedBy: 'ADITYA-OWNER',
        });

        try {
          const { setDoc } = await import('firebase/firestore');
          await setDoc(doc(db, 'platform_state', 'lockdown'), {
            active: false,
            terminatedAt: new Date().toISOString(),
            terminatedBy: 'Owner Authorization'
          }, { merge: true });

          // Also notify server to lift serverLockdownState
          fetch('/api/admin/lift-lockdown', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              password: 'Aditya8852819669003',
              securityCode: 'Aditya8852819669003'
            })
          }).catch(() => {});
        } catch (e) {
          console.warn('platform_state update note:', e);
        }

        try {
          localStorage.removeItem('emergency_shutdown_active');
        } catch(e) {}

        alert('👑 Secret Owner Key Verified! Emergency shutdown terminated globally.');
        if (onUnlocked) onUnlocked();
        window.location.reload();
      } catch (err) {
        console.error('Firestore update failed:', err);
        alert('Passkey correct, but database update failed. Verify Firestore security rules.');
        setIsVerifying(false);
      }
    } else {
      soundFx.playError();
      setStatusMessage('❌ Access Denied: Invalid Key');
      setIsVerifying(false);
    }
  };

  const openOwnerVerificationModal = () => {
    setIsOwnerModalOpen(true);
    setStatusMessage('');
    const modalEl = document.getElementById('ownerModal');
    if (modalEl) modalEl.style.display = 'flex';
  };

  const closeOwnerModal = () => {
    setIsOwnerModalOpen(false);
    setOwnerKeyInput('');
    setStatusMessage('');
    const modalEl = document.getElementById('ownerModal');
    if (modalEl) modalEl.style.display = 'none';
  };

  // Bind global helper functions to window for onclick handlers
  useEffect(() => {
    (window as any).openOwnerVerificationModal = openOwnerVerificationModal;
    (window as any).closeOwnerModal = closeOwnerModal;
    (window as any).verifyAndDisableLockdown = verifyAndDisableLockdown;

    return () => {
      delete (window as any).openOwnerVerificationModal;
      delete (window as any).closeOwnerModal;
      delete (window as any).verifyAndDisableLockdown;
    };
  }, [ownerKeyInput]);

  const totalDurationSecs = Math.max(1, (durationMinutes || 60) * 60);
  const percentRemaining = Math.min(100, Math.max(0, (timeLeft.totalSeconds / totalDurationSecs) * 100));

  return (
    <div
      id="emergencyLockdownOverlay"
      data-overlay="lockdownOverlay"
      className="fixed inset-0 z-[99999] bg-[#08040a] text-[#ff4d4d] flex flex-col items-center justify-center p-5 select-none overflow-y-auto font-sans"
      style={{
        background: '#08040a',
        color: '#ff4d4d',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '20px',
      }}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-950/30 via-black to-black pointer-events-none" />

      {/* Main Alert Card Box */}
      <div className="relative z-10 w-full max-w-xl flex flex-col items-center">
        {/* Animated Emergency Beacon */}
        <div className="relative mb-4 w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-rose-600/30 animate-ping" />
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.8)] border border-rose-300">
            <AlertOctagon className="w-8 h-8 text-white animate-bounce" />
          </div>
        </div>

        {/* 1. Header Title matching specification */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-mono tracking-tight uppercase drop-shadow-md text-[#f87171] mb-2">
          🚨 SYSTEM EMERGENCY SHUTDOWN
        </h1>

        {/* Reason */}
        <p
          className="text-sm sm:text-base leading-relaxed mb-4 text-[#94a3b8] max-w-[500px]"
          style={{ color: '#94a3b8', maxWidth: '500px' }}
        >
          {reason || 'Platform operations are suspended globally. All active sessions, game functions, and API services are completely locked.'}
        </p>

        {/* Auto-Unlock Time Box matching specification */}
        <div
          className="my-4 border-2 border-[#ff4d4d] px-8 py-4 rounded-lg bg-[#120505] shadow-[0_0_25px_rgba(255,77,77,0.2)]"
          style={{
            margin: '20px 0',
            border: '2px solid #ff4d4d',
            padding: '15px 30px',
            borderRadius: '8px',
            background: '#120505',
          }}
        >
          <span style={{ color: '#fff' }} className="text-sm text-white mr-2">
            Auto-Unlock Time:{' '}
          </span>
          <strong
            style={{ color: '#ffcc00' }}
            className="text-base sm:text-lg font-mono font-black tracking-wider text-[#ffcc00]"
          >
            {formattedUnlockTime}
          </strong>
        </div>

        {/* Live Countdown Clock */}
        <div className="w-full max-w-md bg-[#200c18] border border-rose-900/60 rounded-2xl p-4 mb-4 space-y-3 shadow-inner">
          <small className="text-rose-300 text-[10px] font-bold tracking-wider block text-center font-mono">
            AUTOMATIC SYSTEM RESUME IN
          </small>

          <div
            id="shutdownCountdownTimer"
            className="text-3xl font-black font-mono text-[#ef4444] text-center tracking-widest"
          >
            {`${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`}
          </div>

          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-1">
            <div className="bg-[#1f050b] p-2 rounded-xl border border-rose-800/50 text-center">
              <span className="block text-xl font-black font-mono text-white">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                HOURS
              </span>
            </div>
            <div className="bg-[#1f050b] p-2 rounded-xl border border-rose-800/50 text-center">
              <span className="block text-xl font-black font-mono text-[#ffcc00]">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                MINUTES
              </span>
            </div>
            <div className="bg-[#1f050b] p-2 rounded-xl border border-rose-800/50 text-center">
              <span className="block text-xl font-black font-mono text-rose-400 animate-pulse">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                SECONDS
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-rose-500 to-amber-400 h-full transition-all duration-1000"
              style={{ width: `${percentRemaining}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
            <span>Authority: <strong className="text-amber-300">{initiatedBy}</strong></span>
            <span>Duration: <strong className="text-white">{durationMinutes} mins</strong></span>
          </div>
        </div>

        {/* SANITIZED OWNER UNLOCK FORM */}
        <div className="w-full max-w-md bg-[#130912] border border-rose-950/80 rounded-2xl p-4 text-left shadow-lg mb-3">
          <small className="text-emerald-400 text-[11px] font-bold tracking-wide block mb-2 font-mono">
            🔑 OWNER AUTHENTICATION
          </small>

          <input
            type="password"
            id="ownerKeyInput"
            placeholder="Enter Secret Key"
            value={ownerKeyInput}
            onChange={(e) => setOwnerKeyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                verifyAndDisableLockdown();
              }
            }}
            className="w-full bg-[#090408] border border-emerald-800 rounded-lg p-2.5 text-white text-xs mb-3 outline-none focus:border-emerald-400 font-mono"
          />

          <button
            onClick={verifyAndDisableLockdown}
            disabled={isVerifying}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs py-2.5 rounded-lg transition cursor-pointer active:scale-95 disabled:opacity-50 font-mono uppercase tracking-wider"
          >
            {isVerifying ? 'Authenticating...' : 'Authenticate & Lift Lockdown'}
          </button>

          {statusMessage && (
            <small id="ownerAuthError" className="text-rose-400 text-xs block text-center mt-2 font-mono">
              {statusMessage}
            </small>
          )}
        </div>

        {/* Owner Override Trigger Button matching specification */}
        <button
          id="ownerOverrideBtn"
          onClick={openOwnerVerificationModal}
          style={{
            background: 'transparent',
            border: '1px solid #444',
            color: '#888',
            padding: '8px 16px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '10px',
          }}
          className="hover:border-amber-400 hover:text-amber-300 transition flex items-center gap-2 text-xs font-mono"
        >
          <span>🔐 Open Dedicated Override Dialog</span>
        </button>
      </div>

      {/* Owner Verification Modal matching exact specification */}
      <div
        id="ownerModal"
        style={{
          display: isOwnerModalOpen ? 'flex' : 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.85)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
        }}
      >
        <div
          style={{
            background: '#1a1a24',
            border: '1px solid #ffcc00',
            padding: '30px',
            borderRadius: '12px',
            width: '320px',
            textAlign: 'center',
            color: '#fff',
          }}
          className="shadow-[0_0_50px_rgba(255,204,0,0.3)] animate-fade-in"
        >
          <h3
            style={{ color: '#ffcc00', marginTop: 0 }}
            className="text-lg font-black font-mono tracking-wider flex items-center justify-center gap-2"
          >
            🛡️ OWNER VERIFICATION
          </h3>
          <p
            style={{ fontSize: '12px', color: '#aaa' }}
            className="mt-2 mb-4 leading-relaxed"
          >
            Enter your secret master key or password to terminate emergency mode.
          </p>

          <input
            type="password"
            id="ownerPasskey"
            placeholder="Enter Owner Key"
            value={ownerKeyInput}
            onChange={(e) => setOwnerKeyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                verifyAndDisableLockdown();
              }
            }}
            style={{
              width: '100%',
              padding: '10px',
              margin: '15px 0',
              borderRadius: '6px',
              border: '1px solid #333',
              background: '#0d0d13',
              color: '#fff',
              textAlign: 'center',
            }}
            className="outline-none focus:border-[#ffcc00] font-mono text-sm"
            autoFocus
          />

          <button
            id="btnVerifyDisableLockdown"
            onClick={verifyAndDisableLockdown}
            disabled={isVerifying}
            style={{
              width: '100%',
              padding: '10px',
              background: '#ffcc00',
              border: 'none',
              color: '#000',
              fontWeight: 'bold',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '10px',
            }}
            className="hover:bg-amber-300 active:scale-95 transition text-xs font-mono uppercase tracking-wider"
          >
            {isVerifying ? 'VERIFYING...' : 'VERIFY & STOP LOCKDOWN'}
          </button>

          <button
            id="btnCancelOwnerModal"
            onClick={closeOwnerModal}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
            className="text-xs font-mono hover:text-white transition"
          >
            Cancel
          </button>

          {statusMessage && (
            <p className="text-[11px] font-mono text-rose-400 mt-2">
              {statusMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
