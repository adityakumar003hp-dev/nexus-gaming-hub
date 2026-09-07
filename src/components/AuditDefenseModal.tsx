import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, FileText, AlertTriangle, Lock, DollarSign, Activity, CheckCircle, XCircle, Zap, Cpu } from 'lucide-react';
import { AUDIT_CONFIG, AuditState } from '../utils/auditManager';

export type MiniGameType = 'SHREDDER' | 'WIRE_DEFENSE' | 'NEGOTIATION' | 'CODEBREAKER';

interface AuditDefenseModalProps {
  player: any;
  auditState: AuditState;
  onBribe: () => void;
  onComplete: (won: boolean) => void;
  onClose?: () => void;
}

export const AuditDefenseModal: React.FC<AuditDefenseModalProps> = ({
  player,
  auditState,
  onBribe,
  onComplete,
}) => {
  const [selectedGame, setSelectedGame] = useState<MiniGameType>('SHREDDER');
  const [timeLeft, setTimeLeft] = useState<number>(AUDIT_CONFIG.INVESTIGATION_TIME_SEC || 30);
  const [gameResult, setGameResult] = useState<'PLAYING' | 'WON' | 'LOST'>('PLAYING');

  const bribeCost = Math.round(AUDIT_CONFIG.AUDIT_COST * AUDIT_CONFIG.BRIBE_PENALTY_MULTIPLIER);
  const playerCash = player.totalCash ?? player.cash ?? 0;
  const canBribe = playerCash >= bribeCost;

  // Master Investigation Timer countdown
  useEffect(() => {
    if (gameResult !== 'PLAYING') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFail('Investigation timer expired! Federal agents seized the records.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameResult]);

  const handleWin = () => {
    setGameResult('WON');
    setTimeout(() => {
      onComplete(true);
    }, 1200);
  };

  const handleFail = (reason?: string) => {
    setGameResult('LOST');
    setTimeout(() => {
      onComplete(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-gradient-to-b from-[#0f172a] to-[#090d16] border-2 border-red-500/80 rounded-3xl p-6 shadow-[0_0_60px_rgba(239,68,68,0.4)] text-white flex flex-col gap-4 relative overflow-hidden">
        {/* Top Hazard Stripe */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse" />

        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-950/60 border border-red-800/60 px-2 py-0.5 rounded-full">
                  IRS Corporate Raid
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  Risk Level: <strong className="text-amber-400">{player.riskIndex || 50}%</strong>
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                Audit Defense Center: {player.name}
              </h2>
            </div>
          </div>

          {/* Master Countdown Pill */}
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Agents Arrive In</span>
            <div className="text-xl font-mono font-black text-red-400 px-3 py-1 rounded-xl bg-red-950/80 border border-red-700/60 flex items-center gap-1.5 shadow-inner">
              <Activity className="w-4 h-4 animate-spin text-red-500" />
              <span>{timeLeft}s</span>
            </div>
          </div>
        </div>

        {/* Mini-Game Strategy Selector Tabs */}
        {gameResult === 'PLAYING' && (
          <div className="grid grid-cols-4 gap-1.5 bg-[#070b14] p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => setSelectedGame('SHREDDER')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                selectedGame === 'SHREDDER'
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg border border-rose-400/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Shredder</span>
            </button>
            <button
              onClick={() => setSelectedGame('WIRE_DEFENSE')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                selectedGame === 'WIRE_DEFENSE'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg border border-cyan-400/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>2. Wire Grid</span>
            </button>
            <button
              onClick={() => setSelectedGame('NEGOTIATION')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                selectedGame === 'NEGOTIATION'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg border border-amber-400/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>3. Negotiate</span>
            </button>
            <button
              onClick={() => setSelectedGame('CODEBREAKER')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                selectedGame === 'CODEBREAKER'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg border border-emerald-400/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>4. Codebreaker</span>
            </button>
          </div>
        )}

        {/* Mini-Game Workspace Container */}
        <div className="bg-[#080d1a] border border-white/10 rounded-2xl p-4 min-h-[290px] flex flex-col justify-center relative overflow-hidden">
          {gameResult === 'WON' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center text-center p-6 gap-3"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-emerald-400">AUDIT DEFENSE SUCCESSFUL!</h3>
              <p className="text-xs text-gray-300 max-w-md">
                All records cleansed & encrypted. Investigators found zero conclusive fraud evidence. Your Risk Index is reset to 0%.
              </p>
            </motion.div>
          )}

          {gameResult === 'LOST' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center text-center p-6 gap-3"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                <XCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-red-400">FRAUD CONFIRMED BY AUDITORS!</h3>
              <p className="text-xs text-gray-300 max-w-md">
                Defense failed. Severe statutory fines and real estate forfeitures are now being enforced!
              </p>
            </motion.div>
          )}

          {gameResult === 'PLAYING' && (
            <>
              {selectedGame === 'SHREDDER' && (
                <DocumentShredderGame onWin={handleWin} onFail={handleFail} />
              )}
              {selectedGame === 'WIRE_DEFENSE' && (
                <WireDefenseGame onWin={handleWin} onFail={handleFail} />
              )}
              {selectedGame === 'NEGOTIATION' && (
                <RegulatoryNegotiationGame onWin={handleWin} onFail={handleFail} />
              )}
              {selectedGame === 'CODEBREAKER' && (
                <CodebreakerGame onWin={handleWin} onFail={handleFail} />
              )}
            </>
          )}
        </div>

        {/* Footer with Instant Bribe Emergency Action */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] text-gray-400">
              Skip defense by paying off the auditor with hush money.
            </span>
          </div>

          <button
            onClick={onBribe}
            disabled={!canBribe || gameResult !== 'PLAYING'}
            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-md ${
              canBribe && gameResult === 'PLAYING'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Pay Hush Bribe (${bribeCost.toLocaleString()})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 1. MINI-GAME: DOCUMENT SHREDDER (ARCADE MATCH)
// ==========================================
const DocumentShredderGame: React.FC<{ onWin: () => void; onFail: () => void }> = ({ onWin, onFail }) => {
  const [shreddedCount, setShreddedCount] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [files, setFiles] = useState<Array<{ id: number; isIllicit: boolean; title: string; x: number; y: number }>>([]);
  const targetShred = 8;
  const maxMistakes = 2;

  useEffect(() => {
    const interval = setInterval(() => {
      setFiles((prev) => {
        const isIllicit = Math.random() < 0.65;
        const newFile = {
          id: Date.now() + Math.random(),
          isIllicit,
          title: isIllicit ? '🔴 Illicit Ledger' : '📄 Clean Audit Sheet',
          x: Math.floor(Math.random() * 70) + 15,
          y: 0,
        };
        return [...prev.slice(-7), newFile];
      });
    }, 900);

    return () => clearInterval(interval);
  }, []);

  const handleShred = (file: { id: number; isIllicit: boolean }) => {
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    if (file.isIllicit) {
      const next = shreddedCount + 1;
      setShreddedCount(next);
      if (next >= targetShred) {
        onWin();
      }
    } else {
      const nextMistake = mistakes + 1;
      setMistakes(nextMistake);
      if (nextMistake >= maxMistakes) {
        onFail();
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full px-2">
        <span className="text-xs text-gray-300 font-bold">
          Shred only <strong className="text-red-400">Red Illicit Ledgers</strong>. Do NOT shred clean sheets!
        </span>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-emerald-400 font-black">Shredded: {shreddedCount}/{targetShred}</span>
          <span className="text-rose-400 font-black">Mistakes: {mistakes}/{maxMistakes}</span>
        </div>
      </div>

      {/* Conveyor Belt Box */}
      <div className="w-full h-44 bg-[#050811] rounded-2xl border border-white/10 p-3 relative overflow-hidden flex flex-wrap gap-2 items-center justify-center">
        <AnimatePresence>
          {files.map((file) => (
            <motion.button
              key={file.id}
              initial={{ scale: 0.6, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => handleShred(file)}
              className={`px-3 py-2 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-90 ${
                file.isIllicit
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white border border-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse'
                  : 'bg-slate-800 text-gray-300 border border-white/10 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{file.title}</span>
            </motion.button>
          ))}
        </AnimatePresence>

        {files.length === 0 && (
          <span className="text-xs text-gray-500 animate-pulse">Incoming financial files on conveyor...</span>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 2. MINI-GAME: OFF-SHORE WIRE DEFENSE (PATTERN MEMORY)
// ==========================================
const WireDefenseGame: React.FC<{ onWin: () => void; onFail: () => void }> = ({ onWin, onFail }) => {
  const banks = [
    '🇨🇭 Zurich', '🇰🇾 Cayman', '🇵🇦 Panama',
    '🇸🇬 Singapore', '🇦🇪 Dubai', '🇱🇺 Luxembourg',
    '🇲🇨 Monaco', '🇧🇸 Bahamas', '🇬🇧 London'
  ];

  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [round, setRound] = useState<number>(1);
  const [activeHighlight, setActiveHighlight] = useState<number | null>(null);
  const [isShowingSequence, setIsShowingSequence] = useState<boolean>(true);
  const [mistakes, setMistakes] = useState<number>(0);
  const targetRounds = 4;

  const startRound = (roundNum: number) => {
    setIsShowingSequence(true);
    setPlayerInput([]);
    
    // Generate new sequence of length roundNum + 2
    const seqLength = roundNum + 2;
    const newSeq: number[] = [];
    for (let i = 0; i < seqLength; i++) {
      newSeq.push(Math.floor(Math.random() * 9));
    }
    setSequence(newSeq);

    // Play sequence
    let step = 0;
    const interval = setInterval(() => {
      if (step < newSeq.length) {
        setActiveHighlight(newSeq[step]);
        setTimeout(() => setActiveHighlight(null), 400);
        step++;
      } else {
        clearInterval(interval);
        setActiveHighlight(null);
        setIsShowingSequence(false);
      }
    }, 600);
  };

  useEffect(() => {
    startRound(1);
  }, []);

  const handleBankClick = (index: number) => {
    if (isShowingSequence) return;

    const nextInput = [...playerInput, index];
    setPlayerInput(nextInput);
    setActiveHighlight(index);
    setTimeout(() => setActiveHighlight(null), 250);

    const currentIndex = nextInput.length - 1;
    if (sequence[currentIndex] !== index) {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      if (nextMistakes >= 2) {
        onFail();
      } else {
        // Retry current round
        setTimeout(() => startRound(round), 600);
      }
      return;
    }

    if (nextInput.length === sequence.length) {
      if (round >= targetRounds) {
        onWin();
      } else {
        const nextRound = round + 1;
        setRound(nextRound);
        setTimeout(() => startRound(nextRound), 800);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full px-2">
        <span className="text-xs text-gray-300 font-bold">
          Repeat the <strong className="text-cyan-400">Off-shore Routing Pattern</strong> to hide liquid transfers!
        </span>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-cyan-400 font-black">Stage: {round}/{targetRounds}</span>
          <span className="text-rose-400 font-black">Strikes: {mistakes}/2</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 w-full max-w-sm">
        {banks.map((bank, idx) => {
          const isLit = activeHighlight === idx;
          return (
            <button
              key={idx}
              onClick={() => handleBankClick(idx)}
              disabled={isShowingSequence}
              className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                isLit
                  ? 'bg-cyan-500 text-slate-950 border-white shadow-[0_0_20px_rgba(6,182,212,0.8)] scale-105'
                  : 'bg-[#0b1224] text-gray-300 border-white/10 hover:bg-white/5 active:scale-95'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 opacity-75" />
              <span>{bank}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 3. MINI-GAME: REGULATORY NEGOTIATION (TUG-OF-WAR)
// ==========================================
const RegulatoryNegotiationGame: React.FC<{ onWin: () => void; onFail: () => void }> = ({ onWin, onFail }) => {
  const [needlePos, setNeedlePos] = useState<number>(50); // 0 (Severe Penalty) to 100 (Audit Cleared)
  const [greenZone, setGreenZone] = useState<{ min: number; max: number }>({ min: 65, max: 90 });

  // Move needle naturally toward penalties (left)
  useEffect(() => {
    const interval = setInterval(() => {
      setNeedlePos((prev) => {
        const next = prev - 3.5;
        if (next <= 5) {
          clearInterval(interval);
          onFail();
          return 0;
        }
        return next;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  const handlePush = () => {
    setNeedlePos((prev) => {
      const next = prev + 12;
      if (next >= 95) {
        onWin();
        return 100;
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="text-center">
        <h4 className="text-sm font-black text-amber-400">Tug-of-War Settlement Slider</h4>
        <p className="text-xs text-gray-300 mt-0.5">
          Tap <strong>Counter-Offer</strong> rapidly to push the settlement needle into the safe green zone!
        </p>
      </div>

      {/* Meter Track */}
      <div className="w-full max-w-md h-8 bg-slate-900 rounded-full border-2 border-white/20 relative overflow-hidden shadow-inner flex items-center">
        {/* Red Hazard Left */}
        <div className="w-1/3 h-full bg-red-600/40 border-r border-red-500/50" />
        {/* Safe Green Zone Right */}
        <div className="w-1/3 h-full bg-amber-500/20" />
        <div className="w-1/3 h-full bg-emerald-500/50 border-l border-emerald-400/50 flex items-center justify-center text-[10px] font-black text-emerald-300">
          SAFE
        </div>

        {/* Dynamic Needle Marker */}
        <motion.div
          className="absolute top-0 bottom-0 w-3 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)]"
          style={{ left: `calc(${needlePos}% - 6px)` }}
        />
      </div>

      <button
        onClick={handlePush}
        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-95 transition-all hover:brightness-110"
      >
        ⚖️ Tap to Push Counter-Offer!
      </button>
    </div>
  );
};

// ==========================================
// 4. MINI-GAME: CODEBREAKER ENCRYPTION (3-DIGIT LOCK)
// ==========================================
const CodebreakerGame: React.FC<{ onWin: () => void; onFail: () => void }> = ({ onWin, onFail }) => {
  const [targetCode] = useState<number[]>([
    Math.floor(Math.random() * 9) + 1,
    Math.floor(Math.random() * 9) + 1,
    Math.floor(Math.random() * 9) + 1,
  ]);
  const [currentGuess, setCurrentGuess] = useState<number[]>([5, 5, 5]);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(6);
  const [feedback, setFeedback] = useState<string[]>(['', '', '']);

  const adjustDigit = (digitIndex: number, delta: number) => {
    setCurrentGuess((prev) => {
      const next = [...prev];
      let val = next[digitIndex] + delta;
      if (val > 9) val = 1;
      if (val < 1) val = 9;
      next[digitIndex] = val;
      return next;
    });
  };

  const handleTestCombination = () => {
    const newFeedback = currentGuess.map((g, idx) => {
      if (g === targetCode[idx]) return '✅ EXACT';
      if (g < targetCode[idx]) return '⬆️ HIGHER';
      return '⬇️ LOWER';
    });

    setFeedback(newFeedback);

    const isMatch = currentGuess.every((g, idx) => g === targetCode[idx]);
    if (isMatch) {
      onWin();
      return;
    }

    const nextAttempts = attemptsLeft - 1;
    setAttemptsLeft(nextAttempts);
    if (nextAttempts <= 0) {
      onFail();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full px-2">
        <span className="text-xs text-gray-300 font-bold">
          Crack the <strong className="text-emerald-400">3-Digit Safe Combination</strong> to encrypt ledger files!
        </span>
        <span className="text-xs font-mono text-emerald-400 font-black">
          Attempts: {attemptsLeft}/6
        </span>
      </div>

      {/* 3 Digits Selectors */}
      <div className="flex items-center gap-4">
        {[0, 1, 2].map((idx) => (
          <div key={idx} className="flex flex-col items-center gap-1.5 bg-[#050811] p-3 rounded-2xl border border-white/10 shadow-lg">
            <button
              onClick={() => adjustDigit(idx, 1)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-black text-sm"
            >
              ▲
            </button>
            <span className="text-2xl font-mono font-black text-amber-400 py-1">
              {currentGuess[idx]}
            </span>
            <button
              onClick={() => adjustDigit(idx, -1)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-black text-sm"
            >
              ▼
            </button>
            <span className="text-[10px] font-black font-mono text-gray-400 mt-1">
              {feedback[idx] || '---'}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={handleTestCombination}
        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs shadow-lg active:scale-95 hover:brightness-110"
      >
        🔓 Test Lock Code
      </button>
    </div>
  );
};

export default AuditDefenseModal;
