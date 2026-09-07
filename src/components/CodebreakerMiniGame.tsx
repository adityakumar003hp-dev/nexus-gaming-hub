import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Terminal, Lock, KeyRound, CheckCircle2, XCircle, RefreshCw, Cpu } from 'lucide-react';
import { AudioFX } from '../utils/businessEmpireEngine';

export interface CodebreakerMiniGameProps {
  targetPlayerName?: string;
  isOpen?: boolean;
  onComplete: (victory: boolean) => void;
  onClose?: () => void;
}

export const CodebreakerMiniGame: React.FC<CodebreakerMiniGameProps> = ({
  targetPlayerName = 'Federal Defense Database',
  isOpen = true,
  onComplete,
  onClose,
}) => {
  // Generate random 3-digit key (1-9 each)
  const [targetCode] = useState<number[]>(() =>
    Array.from({ length: 3 }, () => Math.floor(Math.random() * 9) + 1)
  );
  const [userGuess, setUserGuess] = useState<string[]>(['', '', '']);
  const [feedback, setFeedback] = useState<string>('ENTER 3-DIGIT OVERRIDE PIN (1-9)');
  const [attempts, setAttempts] = useState<number>(5);
  const [hintHistory, setHintHistory] = useState<Array<{ guess: string; hints: string[] }>>([]);
  const [isResolved, setIsResolved] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/[^1-9]/g, '').slice(-1);
    const next = [...userGuess];
    next[index] = clean;
    setUserGuess(next);
    if (clean) {
      AudioFX.playKeyBeep();
    }
  };

  const handleKeypadPress = (digit: number) => {
    const emptyIndex = userGuess.findIndex((d) => d === '');
    if (emptyIndex !== -1) {
      handleDigitChange(emptyIndex, digit.toString());
    }
  };

  const handleClear = () => {
    setUserGuess(['', '', '']);
    AudioFX.playKeyBeep();
  };

  const verifyCode = () => {
    if (userGuess.some((d) => d === '')) {
      setFeedback('⚠️ ALL 3 DIGITS REQUIRED');
      AudioFX.playAccessDenied();
      return;
    }

    const current = userGuess.map(Number);
    const guessStr = current.join('');
    const targetStr = targetCode.join('');

    if (guessStr === targetStr) {
      setIsResolved(true);
      setIsSuccess(true);
      setFeedback('ACCESS GRANTED: Audit Records Encrypted & Sanitized!');
      AudioFX.playOverrideSuccess();
      setTimeout(() => {
        onComplete(true);
      }, 1400);
      return;
    }

    const remaining = attempts - 1;
    setAttempts(remaining);

    // High/Low Hinting: ▲ = secret is higher, ▼ = secret is lower, ✓ = match
    const hints = current.map((num, i) =>
      num < targetCode[i] ? '▲' : num > targetCode[i] ? '▼' : '✓'
    );

    setHintHistory((prev) => [{ guess: guessStr, hints }, ...prev]);

    if (remaining <= 0) {
      setIsResolved(true);
      setIsSuccess(false);
      setFeedback(`ACCESS DENIED. DECRYPTION FAILED. KEY WAS: [ ${targetStr} ]`);
      AudioFX.playAccessDenied();
      setTimeout(() => {
        onComplete(false);
      }, 1500);
      return;
    }

    setFeedback(`ACCESS DENIED. HINT: [ ${hints.join(' ')} ] (${remaining} RETRIES LEFT)`);
    AudioFX.playAccessDenied();
    setUserGuess(['', '', '']);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[9999] animate-fadeIn">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-950 border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-7 w-full max-w-lg text-center shadow-[0_0_50px_rgba(16,185,129,0.25)] relative overflow-hidden"
      >
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 shadow-sm">
              <Lock className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h3 className="text-base sm:text-lg font-mono font-black text-emerald-400 tracking-wider">
                SAFE ENCRYPTION OVERRIDE
              </h3>
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <Terminal className="w-3 h-3 text-emerald-400" />
                <span>Target: {targetPlayerName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-mono font-bold text-emerald-300">
              {attempts} / 5 TRIES
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Status Terminal Screen */}
        <div
          className={`text-xs sm:text-sm font-mono font-bold mb-5 py-3 px-4 rounded-xl border transition-all ${
            isSuccess
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              : isResolved
              ? 'bg-rose-950/90 text-rose-300 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
              : 'bg-slate-900/90 text-amber-300 border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {isSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : isResolved ? (
              <XCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <Cpu className="w-4 h-4 text-amber-400 animate-pulse" />
            )}
            <span>{feedback}</span>
          </div>
        </div>

        {/* Guess Input Displays */}
        <div className="flex justify-center gap-3 sm:gap-4 mb-5">
          {userGuess.map((digit, idx) => (
            <input
              key={idx}
              id={`code-digit-input-${idx}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              disabled={isResolved}
              placeholder="-"
              className="w-16 h-20 sm:w-20 sm:h-24 bg-slate-900 border-2 border-emerald-500/60 focus:border-emerald-400 rounded-2xl text-center text-3xl sm:text-4xl font-mono font-black text-emerald-300 shadow-inner focus:outline-none transition-all placeholder:text-slate-700"
            />
          ))}
        </div>

        {/* Quick Numeric Keypad */}
        {!isResolved && (
          <div className="mb-5 bg-slate-900/60 p-3 rounded-2xl border border-emerald-500/20">
            <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  className="py-2 bg-slate-800/80 hover:bg-emerald-600/30 text-emerald-200 border border-emerald-500/30 hover:border-emerald-400 font-mono font-bold text-lg rounded-xl transition active:scale-95 cursor-pointer"
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-2 max-w-[280px] mx-auto">
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 py-1.5 bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 font-mono text-xs font-bold rounded-xl transition cursor-pointer"
              >
                CLEAR
              </button>
            </div>
          </div>
        )}

        {/* Past Attempts Log */}
        {hintHistory.length > 0 && !isResolved && (
          <div className="mb-5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800 text-left">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Decryption Attempts:
            </span>
            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
              {hintHistory.map((h, i) => (
                <div
                  key={i}
                  className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 flex items-center gap-1.5"
                >
                  <span className="font-bold text-emerald-400">{h.guess}</span>
                  <span className="text-[10px] text-amber-400 tracking-widest font-black">
                    [{h.hints.join(' ')}]
                  </span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">
              Legend: <span className="text-emerald-400">▲ Higher</span> |{' '}
              <span className="text-amber-400">▼ Lower</span> |{' '}
              <span className="text-cyan-400">✓ Correct Digit</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        {!isResolved ? (
          <button
            onClick={verifyCode}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-mono font-black py-3.5 rounded-2xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] active:scale-95 cursor-pointer text-sm tracking-wider flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4 text-slate-950" />
            <span>EXECUTE DECRYPTION OVERRIDE</span>
          </button>
        ) : (
          <div className="text-xs font-mono text-slate-400 animate-pulse">
            Processing neural result...
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CodebreakerMiniGame;
