import React, { useState, useEffect } from 'react';
import {
  Coins,
  Gem,
  Swords,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  X,
  Gift,
  Trophy,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { GameEconomy, checkBalanceAndPlay } from '../utils/gameEconomy';
import { getUserPoints, getUserGems } from '../utils/pointsManager';
import { soundFx } from '../utils/audio';

interface GameEntryFeeModalProps {
  isOpen: boolean;
  gameTitle?: string;
  gameMode?: string;
  onClose: () => void;
  onConfirmStart: () => void;
  onOpenWheel?: () => void;
  onOpenTasks?: () => void;
  onOpenExchange?: () => void;
}

export const GameEntryFeeModal: React.FC<GameEntryFeeModalProps> = ({
  isOpen,
  gameTitle = 'Chess Arena',
  gameMode = 'Player vs Player',
  onClose,
  onConfirmStart,
  onOpenWheel,
  onOpenTasks,
  onOpenExchange,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<'coins' | 'gems'>('coins');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const onFeeUpdated = () => setTick((t) => t + 1);
    window.addEventListener('admin_fee_updated', onFeeUpdated);
    return () => window.removeEventListener('admin_fee_updated', onFeeUpdated);
  }, []);

  const coins = getUserPoints();
  const gems = getUserGems();

  const isFree = GameEconomy.isFreeMode();
  const feeCoins = isFree ? 0 : GameEconomy.getFeeCoins(gameTitle);
  const feeGems = isFree ? 0 : GameEconomy.getFeeGems(gameTitle);

  const hasEnoughCoins = isFree || feeCoins === 0 || coins >= feeCoins;
  const hasEnoughGems = isFree || feeGems === 0 || gems >= feeGems;
  const hasNoBalance = !hasEnoughCoins && !hasEnoughGems;

  if (!isOpen) return null;

  const handlePayAndEnter = (type: 'coins' | 'gems') => {
    setSelectedCurrency(type);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Run checkBalanceAndPlay
    const canPlay = checkBalanceAndPlay(type, gameTitle);

    if (!canPlay) {
      soundFx.playError();
      setErrorMessage(
        `🪙 Insufficient Balance!\nYou need ${feeCoins.toLocaleString()} Coins or ${feeGems.toLocaleString()} Gems to enter this game or rematch.\nEarn more currency via the Wheel of Fortune, completing Tasks, or winning matches!`
      );
      return;
    }

    setIsProcessing(true);
    const success = GameEconomy.payEntryFee(gameTitle, type);

    if (success) {
      soundFx.playWin();
      setSuccessMessage(
        isFree || (type === 'coins' ? feeCoins === 0 : feeGems === 0)
          ? '🎉 Free Entry Granted by Admin! Entering Match...'
          : `✅ Entry Fee Deducted: -${type === 'coins' ? `${feeCoins.toLocaleString()} 🪙 Coins` : `${feeGems.toLocaleString()} 💎 Gems`}! Entering Match...`
      );

      setTimeout(() => {
        setIsProcessing(false);
        onConfirmStart();
        onClose();
      }, 700);
    } else {
      setIsProcessing(false);
      setErrorMessage(
        `🪙 Insufficient Balance!\nYou need ${feeCoins.toLocaleString()} Coins or ${feeGems.toLocaleString()} Gems to enter this game or rematch.\nEarn more currency via the Wheel of Fortune, completing Tasks, or winning matches!`
      );
    }
  };

  return (
    <div
      id="gameEntryFeeModal"
      className="admin-modal-overlay animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onClose();
        }
      }}
    >
      <div className="auth-card !max-w-md animate-scale-up relative overflow-hidden bg-[#0d111d]/95 border border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.25)] rounded-2xl p-5 text-white">
        {/* Glow accents */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-white text-base shadow-md">
              🎮
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider font-mono">
                Match Entry Fee
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {gameTitle} &bull; <span className="text-purple-300 capitalize">{gameMode}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-white text-2xl font-bold transition leading-none cursor-pointer disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        {/* Current Balances Card */}
        <div className="my-4 p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-around relative z-10 shadow-inner">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-amber-400/90 tracking-wider">
              Your Coins
            </span>
            <div className="flex items-center gap-1 text-sm font-black text-amber-300 font-mono">
              <span>🪙</span>
              <span>{coins.toLocaleString()}</span>
            </div>
            <span className="text-[9px] text-slate-500 mt-0.5">
              {isFree || feeCoins === 0 ? 'Free Entry (0 🪙)' : `Need: ${feeCoins.toLocaleString()} 🪙`}
            </span>
          </div>

          <div className="w-px h-8 bg-slate-800" />

          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-fuchsia-400/90 tracking-wider">
              Your Gems
            </span>
            <div className="flex items-center gap-1 text-sm font-black text-fuchsia-300 font-mono">
              <span>💎</span>
              <span>{gems.toLocaleString()}</span>
            </div>
            <span className="text-[9px] text-slate-500 mt-0.5">
              {isFree || feeGems === 0 ? 'Free Entry (0 💎)' : `Need: ${feeGems.toLocaleString()} 💎`}
            </span>
          </div>
        </div>

        {isFree && (
          <div className="mb-3 p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <span>✨</span>
            <span>ADMIN FREE PLAY EVENT: All match entry fees currently waived (0 Coins / 0 Gems).</span>
          </div>
        )}

        {/* Feedback / Insufficient Balance Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/50 text-rose-200 text-xs font-semibold flex flex-col gap-2 animate-shake relative z-10 shadow-lg shadow-rose-950/40">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="block text-rose-300 font-bold text-xs uppercase tracking-wide">
                  🪙 Insufficient Balance!
                </strong>
                <p className="text-[11px] leading-relaxed text-rose-100">
                  You need <strong>{feeCoins.toLocaleString()} Coins</strong> or <strong>{feeGems.toLocaleString()} Gems</strong> to enter this game or rematch.
                  Earn more currency via the Wheel of Fortune, completing Tasks, or request admin grant!
                </p>
              </div>
            </div>

            {/* Quick action triggers */}
            <div className="flex items-center gap-2 pt-1 border-t border-rose-500/30 mt-1">
              {onOpenWheel && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWheel();
                  }}
                  className="flex-1 py-1 px-2 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>🎡 Spin Wheel</span>
                </button>
              )}
              {onOpenTasks && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTasks();
                  }}
                  className="flex-1 py-1 px-2 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-400/40 text-amber-200 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>🎯 Tasks</span>
                </button>
              )}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in relative z-10">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="leading-tight">{successMessage}</span>
          </div>
        )}

        {/* Payment Selection Options */}
        <div className="space-y-2.5 relative z-10">
          <label className="text-[11px] font-black uppercase text-slate-300 tracking-wider font-mono flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Select Payment Method</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Option 1: Pay Coins */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handlePayAndEnter('coins')}
              className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all cursor-pointer text-left active:scale-95 ${
                hasEnoughCoins
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 hover:border-amber-400 text-amber-100 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 opacity-60 hover:opacity-100 hover:border-amber-500/30'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  🪙 {isFree || feeCoins === 0 ? 'FREE (0 Coins)' : `${feeCoins.toLocaleString()} Coins`}
                </span>
                {hasEnoughCoins ? (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                    Ready
                  </span>
                ) : (
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold">
                    Low
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400">
                Balance: {coins.toLocaleString()} 🪙
              </span>
            </button>

            {/* Option 2: Pay Gems */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handlePayAndEnter('gems')}
              className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all cursor-pointer text-left active:scale-95 ${
                hasEnoughGems
                  ? 'bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border-fuchsia-500/40 hover:border-fuchsia-400 text-fuchsia-100 shadow-md shadow-fuchsia-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 opacity-60 hover:opacity-100 hover:border-fuchsia-500/30'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-fuchsia-300 flex items-center gap-1">
                  💎 {isFree || feeGems === 0 ? 'FREE (0 Gems)' : `${feeGems.toLocaleString()} Gems`}
                </span>
                {hasEnoughGems ? (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                    Ready
                  </span>
                ) : (
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold">
                    Low
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400">
                Balance: {gems.toLocaleString()} 💎
              </span>
            </button>
          </div>
        </div>

        {/* Footer info and extra top-up triggers */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
          <span>Match Rewards: 🥇 +2000🪙 90💎</span>
          {onOpenExchange && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenExchange();
              }}
              className="text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer"
            >
              Convert Gems / Coins
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
