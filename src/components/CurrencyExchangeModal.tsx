import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeftRight, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getUserPoints, getUserGems, setUserPoints, setUserGems, syncBalancesToBackend } from '../utils/pointsManager';
import { soundFx } from '../utils/audio';
import { executeCoinTransaction } from '../utils/coinRewardEngine';

interface CurrencyExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDirection?: 'gemToCoin' | 'coinToGem';
}

export const GEM_TO_COIN_RATE = 10;

interface InsufficientModalState {
  isOpen: boolean;
  currencyType: 'Gems' | 'Coins';
  requiredAmount: number;
  currentAmount: number;
}

export const CurrencyExchangeModal: React.FC<CurrencyExchangeModalProps> = ({
  isOpen,
  onClose,
  defaultDirection = 'gemToCoin',
}) => {
  const [activeTab, setActiveTab] = useState<'gemToCoin' | 'coinToGem'>(defaultDirection);
  const [gemInput, setGemInput] = useState<string>('');
  const [coinInput, setCoinInput] = useState<string>('');
  const [userCoins, setUserCoins] = useState<number>(() => getUserPoints());
  const [userGems, setUserGemsState] = useState<number>(() => getUserGems());
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Glassmorphism Insufficient Balance Pop-Up State
  const [insufficientModal, setInsufficientModal] = useState<InsufficientModalState>({
    isOpen: false,
    currencyType: 'Gems',
    requiredAmount: 0,
    currentAmount: 0,
  });

  useEffect(() => {
    if (isOpen) {
      setUserCoins(getUserPoints());
      setUserGemsState(getUserGems());
      setActiveTab(defaultDirection);
      setGemInput('');
      setCoinInput('');
      setFeedbackMsg(null);
      setInsufficientModal({
        isOpen: false,
        currencyType: 'Gems',
        requiredAmount: 0,
        currentAmount: 0,
      });
    }
  }, [isOpen, defaultDirection]);

  useEffect(() => {
    const handlePointsUpdated = (e: any) => {
      setUserCoins(e.detail?.points ?? getUserPoints());
    };
    const handleGemsUpdated = (e: any) => {
      setUserGemsState(e.detail?.gems ?? getUserGems());
    };

    window.addEventListener('chess_points_updated', handlePointsUpdated);
    window.addEventListener('chess_gems_updated', handleGemsUpdated);
    return () => {
      window.removeEventListener('chess_points_updated', handlePointsUpdated);
      window.removeEventListener('chess_gems_updated', handleGemsUpdated);
    };
  }, []);

  if (!isOpen) return null;

  const showNotification = (text: string, type: 'success' | 'error') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg((current) => (current?.text === text ? null : current));
    }, 4000);
  };

  // Insufficient Balance Pop-Up Display
  const showInsufficientBalanceModal = (currencyType: 'Gems' | 'Coins', requiredAmount: number, currentAmount: number) => {
    soundFx.playError();
    setInsufficientModal({
      isOpen: true,
      currencyType,
      requiredAmount,
      currentAmount,
    });
  };

  const closeInsufficientModal = () => {
    setInsufficientModal((prev) => ({ ...prev, isOpen: false }));
  };

  // UI Refresh & Server Synchronization Helper
  const syncAndRefreshBalances = (nextGems: number, nextCoins: number) => {
    setUserGems(nextGems, 'Currency Exchange');
    setUserPoints(nextCoins, 'Currency Exchange');
    setUserGemsState(nextGems);
    setUserCoins(nextCoins);
    syncBalancesToBackend(nextGems, nextCoins);
  };

  /**
   * 1. CONVERT GEMS TO COINS
   * Deducts Gems from user's balance and adds Coins.
   * Rejects transaction if Gems are insufficient.
   */
  const handleConvertGemsToCoins = (nGems: number | string): boolean => {
    const gemsToDeduct = parseInt(nGems as string, 10);

    // Validation Check: Input must be a positive integer
    if (isNaN(gemsToDeduct) || gemsToDeduct <= 0) {
      showNotification('Please enter a valid amount of Gems to convert.', 'error');
      soundFx.playError();
      return false;
    }

    const userGemsBalance = getUserGems();
    const userCoinsBalance = getUserPoints();

    // Strict Balance Check
    if (userGemsBalance < gemsToDeduct) {
      showInsufficientBalanceModal('Gems', gemsToDeduct, userGemsBalance);
      return false;
    }

    // Calculate target Coins
    const coinsToAdd = gemsToDeduct * GEM_TO_COIN_RATE;

    // Execute Balance Deductions & Additions
    const nextGems = userGemsBalance - gemsToDeduct;
    const nextCoins = userCoinsBalance + coinsToAdd;

    // Sync state across UI and Backend
    syncAndRefreshBalances(nextGems, nextCoins);

    // Audit log in Firestore
    executeCoinTransaction({
      amount: coinsToAdd,
      type: 'currency_exchange',
      description: `Converted 💎 ${gemsToDeduct.toLocaleString()} Gems to 🪙 ${coinsToAdd.toLocaleString()} Coins`,
      metadata: { gemsDeducted: gemsToDeduct, coinsAdded: coinsToAdd, rate: GEM_TO_COIN_RATE }
    });

    // Attempt secure server-side execution
    try {
      const token = localStorage.getItem('chess_pro_token_v3') || localStorage.getItem('chess_pro_token');
      fetch('/api/currency/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ direction: 'gemToCoin', amount: gemsToDeduct }),
      }).catch(() => {});
    } catch {}

    setGemInput('');
    soundFx.playWin();
    showNotification(`Success! 💎 ${gemsToDeduct.toLocaleString()} Gems were deducted and 🪙 ${coinsToAdd.toLocaleString()} Coins were added.`, 'success');
    return true;
  };

  /**
   * 2. CONVERT COINS TO GEMS
   * Deducts Coins from user's balance and adds Gems.
   * Rejects transaction if Coins are insufficient.
   */
  const handleConvertCoinsToGems = (nCoins: number | string): boolean => {
    const coinsToDeduct = parseInt(nCoins as string, 10);

    // Validation Check: Must meet minimum conversion threshold
    if (isNaN(coinsToDeduct) || coinsToDeduct < GEM_TO_COIN_RATE) {
      showNotification(`Minimum conversion requires at least 🪙 ${GEM_TO_COIN_RATE} Coins.`, 'error');
      soundFx.playError();
      return false;
    }

    const userCoinsBalance = getUserPoints();
    const userGemsBalance = getUserGems();

    // Strict Balance Check
    if (userCoinsBalance < coinsToDeduct) {
      showInsufficientBalanceModal('Coins', coinsToDeduct, userCoinsBalance);
      return false;
    }

    // Calculate target Gems and exact Coin deduction (prevents remainder loss)
    const gemsToAdd = Math.floor(coinsToDeduct / GEM_TO_COIN_RATE);
    const exactCoinsToDeduct = gemsToAdd * GEM_TO_COIN_RATE;

    // Execute Balance Deductions & Additions
    const nextCoins = userCoinsBalance - exactCoinsToDeduct;
    const nextGems = userGemsBalance + gemsToAdd;

    // Sync state across UI and Backend
    syncAndRefreshBalances(nextGems, nextCoins);

    // Audit log in Firestore
    executeCoinTransaction({
      amount: -exactCoinsToDeduct,
      type: 'currency_exchange',
      description: `Converted 🪙 ${exactCoinsToDeduct.toLocaleString()} Coins to 💎 ${gemsToAdd.toLocaleString()} Gems`,
      metadata: { coinsDeducted: exactCoinsToDeduct, gemsAdded: gemsToAdd, rate: GEM_TO_COIN_RATE }
    });

    // Attempt secure server-side execution
    try {
      const token = localStorage.getItem('chess_pro_token_v3') || localStorage.getItem('chess_pro_token');
      fetch('/api/currency/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ direction: 'coinToGem', amount: coinsToDeduct }),
      }).catch(() => {});
    } catch {}

    setCoinInput('');
    soundFx.playWin();
    showNotification(`Success! 🪙 ${exactCoinsToDeduct.toLocaleString()} Coins were deducted and 💎 ${gemsToAdd.toLocaleString()} Gems were added.`, 'success');
    return true;
  };

  // Form Process Handlers
  const processCustomGemToCoin = () => {
    handleConvertGemsToCoins(gemInput);
  };

  const processCustomCoinToGem = () => {
    handleConvertCoinsToGems(coinInput);
  };

  const parsedGems = parseInt(gemInput, 10) || 0;
  const liveCoinOutput = parsedGems * GEM_TO_COIN_RATE;

  const parsedCoins = parseInt(coinInput, 10) || 0;
  const liveGemOutput = Math.floor(parsedCoins / GEM_TO_COIN_RATE);

  return (
    <>
      {/* Universal Currency Exchange Modal */}
      <div 
        id="currencyExchangeModal" 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="exchange-card w-full max-w-lg bg-[#0a0f1d] border border-indigo-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(79,70,229,0.35)] relative overflow-hidden text-slate-100 animate-scale-up">
          {/* Background glow flares */}
          <div className="absolute -top-16 -left-16 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="exchange-header flex items-center justify-between gap-3 pb-4 border-b border-slate-800/80 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-purple-500/20 to-fuchsia-500/20 border border-indigo-400/40 flex items-center justify-center shadow-inner text-lg">
                <ArrowLeftRight className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <span>🪙 ⇆ 💎 Currency Exchange Hub</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <span>Rate:</span>
                  <span className="text-fuchsia-300 font-bold">1 Gem 💎</span>
                  <span>=</span>
                  <span className="text-amber-300 font-bold">10 Coins 🪙</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="close-btn w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
              id="btn-close-exchange-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Balances Header Capsule */}
          <div className="my-4 p-3 rounded-2xl bg-[#060919] border border-slate-800/90 flex items-center justify-around text-center relative z-10 shadow-inner">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-xs">
                🪙
              </div>
              <div className="text-left leading-none">
                <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">YOUR COINS</div>
                <div className="text-sm font-black text-amber-300 font-mono">{userCoins.toLocaleString()}</div>
              </div>
            </div>

            <div className="h-7 w-[1px] bg-slate-800" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 flex items-center justify-center text-fuchsia-300 text-xs">
                💎
              </div>
              <div className="text-left leading-none">
                <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">YOUR GEMS</div>
                <div className="text-sm font-black text-fuchsia-300 font-mono">{userGems.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Direction Switcher Tabs */}
          <div className="tab-switcher grid grid-cols-2 gap-2 p-1 bg-[#060919] border border-slate-800/90 rounded-2xl mb-5 relative z-10">
            <button
              id="tabGemToCoin"
              onClick={() => {
                setActiveTab('gemToCoin');
                soundFx.playMove();
              }}
              className={`tab-btn py-2.5 px-3 rounded-xl font-black text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'gemToCoin'
                  ? 'active bg-gradient-to-r from-purple-700 via-fuchsia-600 to-pink-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)] border border-fuchsia-400/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>💎 Gems ➔ 🪙 Coins</span>
            </button>

            <button
              id="tabCoinToGem"
              onClick={() => {
                setActiveTab('coinToGem');
                soundFx.playMove();
              }}
              className={`tab-btn py-2.5 px-3 rounded-xl font-black text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'coinToGem'
                  ? 'active bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🪙 Coins ➔ 💎 Gems</span>
            </button>
          </div>

          {/* Feedback Message */}
          {feedbackMsg && (
            <div
              className={`mb-4 p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-fade-in ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* TAB 1: GEM TO COIN CONVERTER (N Gems -> N * 10 Coins) */}
          {activeTab === 'gemToCoin' && (
            <div id="gemToCoinPanel" className="exchange-panel space-y-4 relative z-10 animate-fade-in">
              {/* Presets Grid */}
              <div className="preset-grid grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { gems: 10, coins: 100 },
                  { gems: 20, coins: 200 },
                  { gems: 50, coins: 500 },
                  { gems: 100, coins: 1000 },
                  { gems: 250, coins: 2500 },
                  { gems: 500, coins: 5000 },
                ].map((preset) => {
                  return (
                    <div
                      key={`gem-preset-${preset.gems}`}
                      className="preset-card p-3 rounded-2xl bg-[#060919]/90 border border-slate-800/80 hover:border-fuchsia-500/50 flex flex-col justify-between gap-2 text-center transition group"
                    >
                      <div className="flex items-center justify-center gap-1.5 text-xs font-black">
                        <span className="text-fuchsia-300">💎 {preset.gems} Gems</span>
                        <span className="arrow text-slate-500">➔</span>
                        <span className="text-amber-300">🪙 {preset.coins} Coins</span>
                      </div>
                      <button
                        onClick={() => handleConvertGemsToCoins(preset.gems)}
                        className="btn-exchange w-full py-1.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer bg-fuchsia-600/30 hover:bg-fuchsia-500/40 text-fuchsia-200 border border-fuchsia-400/40 hover:shadow-[0_0_10px_rgba(217,70,239,0.3)]"
                      >
                        Convert
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Custom N Gems Input */}
              <div className="custom-converter p-4 rounded-2xl bg-[#060919]/90 border border-indigo-900/60 space-y-3">
                <h4 className="flex items-center justify-between text-xs font-black text-slate-300">
                  <span>Custom Convert</span>
                  <span className="text-[10px] text-fuchsia-400 font-mono font-normal">(N Gems ➔ N × 10 Coins)</span>
                </h4>

                <div className="input-group flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      id="gemInput"
                      value={gemInput}
                      placeholder="Enter N Gems..."
                      min="1"
                      onChange={(e) => setGemInput(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-fuchsia-400 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-fuchsia-300 placeholder-slate-500 outline-none transition"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">💎</span>
                  </div>

                  <span className="equals text-slate-500 font-bold text-lg">=</span>

                  <div
                    id="coinOutputPreview"
                    className="preview-text flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-amber-300 flex items-center justify-between"
                  >
                    <span>🪙 {liveCoinOutput.toLocaleString()} Coins</span>
                  </div>
                </div>

                <button
                  onClick={processCustomGemToCoin}
                  className="btn-submit w-full py-2.5 rounded-xl font-black text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)] border border-fuchsia-400 active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Convert Gems to Coins</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: COIN TO GEM CONVERTER (10 Coins -> 1 Gem) */}
          {activeTab === 'coinToGem' && (
            <div id="coinToGemPanel" className="exchange-panel space-y-4 relative z-10 animate-fade-in">
              {/* Presets Grid */}
              <div className="preset-grid grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { coins: 100, gems: 10 },
                  { coins: 200, gems: 20 },
                  { coins: 500, gems: 50 },
                  { coins: 1000, gems: 100 },
                  { coins: 2500, gems: 250 },
                  { coins: 5000, gems: 500 },
                ].map((preset) => {
                  return (
                    <div
                      key={`coin-preset-${preset.coins}`}
                      className="preset-card p-3 rounded-2xl bg-[#060919]/90 border border-slate-800/80 hover:border-amber-500/50 flex flex-col justify-between gap-2 text-center transition group"
                    >
                      <div className="flex items-center justify-center gap-1.5 text-xs font-black">
                        <span className="text-amber-300">🪙 {preset.coins} Coins</span>
                        <span className="arrow text-slate-500">➔</span>
                        <span className="text-fuchsia-300">💎 {preset.gems} Gems</span>
                      </div>
                      <button
                        onClick={() => handleConvertCoinsToGems(preset.coins)}
                        className="btn-exchange w-full py-1.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border border-amber-400/40 hover:shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                      >
                        Convert
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Custom Coins Input */}
              <div className="custom-converter p-4 rounded-2xl bg-[#060919]/90 border border-indigo-900/60 space-y-3">
                <h4 className="flex items-center justify-between text-xs font-black text-slate-300">
                  <span>Custom Convert</span>
                  <span className="text-[10px] text-amber-400 font-mono font-normal">(10 Coins ➔ 1 Gem)</span>
                </h4>

                <div className="input-group flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      id="coinInput"
                      value={coinInput}
                      placeholder="Enter Coins..."
                      min="10"
                      step="10"
                      onChange={(e) => setCoinInput(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-amber-400 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-amber-300 placeholder-slate-500 outline-none transition"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">🪙</span>
                  </div>

                  <span className="equals text-slate-500 font-bold text-lg">=</span>

                  <div
                    id="gemOutputPreview"
                    className="preview-text flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-fuchsia-300 flex items-center justify-between"
                  >
                    <span>💎 {liveGemOutput.toLocaleString()} Gems</span>
                  </div>
                </div>

                <button
                  onClick={processCustomCoinToGem}
                  className="btn-submit w-full py-2.5 rounded-xl font-black text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-300 active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Convert Coins to Gems</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer info note */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium relative z-10">
            <span>⚡ Instant Bi-Directional Settlement</span>
            <span className="text-slate-500">Zero Transaction Fees</span>
          </div>
        </div>
      </div>

      {/* Insufficient Balance Glassmorphism Modal */}
      {insufficientModal.isOpen && (
        <div 
          id="insufficientBalanceModal" 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeInsufficientModal();
          }}
        >
          <div className="alert-card w-full max-w-sm bg-gradient-to-b from-[#160b1c]/95 via-[#0e0717]/95 to-[#08030d]/95 border border-rose-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(244,63,94,0.4)] relative text-center text-slate-100 animate-scale-up backdrop-blur-2xl">
            {/* Soft Ambient Flare */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Alert Icon */}
            <div className="alert-icon w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-amber-500/20 border border-rose-400/40 flex items-center justify-center text-3xl shadow-[0_0_25px_rgba(244,63,94,0.3)]">
              ⚠️
            </div>

            {/* Alert Title */}
            <h3 id="alertTitle" className="text-lg font-black text-white font-mono tracking-wider uppercase">
              ⚠️ Insufficient Balance
            </h3>

            {/* Alert Message */}
            <p id="alertMessage" className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
              You don't have enough {insufficientModal.currencyType} to complete this conversion. You need{' '}
              <span className="font-bold text-rose-300">
                {insufficientModal.currencyType === 'Gems' ? '💎' : '🪙'}{' '}
                {(insufficientModal.requiredAmount - insufficientModal.currentAmount).toLocaleString()} more {insufficientModal.currencyType}
              </span>{' '}
              to proceed.
            </p>

            {/* Balance Comparison Boxes */}
            <div className="balance-comparison grid grid-cols-2 gap-3 my-5">
              <div className="comp-box p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-center">
                <span className="label block text-[10px] uppercase font-black tracking-wider text-rose-300/80 mb-1">
                  Required
                </span>
                <span id="compRequired" className="val required-val text-sm font-black font-mono text-rose-200">
                  {insufficientModal.currencyType === 'Gems' ? '💎' : '🪙'}{' '}
                  {insufficientModal.requiredAmount.toLocaleString()}
                </span>
              </div>

              <div className="comp-box p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
                <span className="label block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                  Your Balance
                </span>
                <span id="compCurrent" className="val current-val text-sm font-black font-mono text-amber-300">
                  {insufficientModal.currencyType === 'Gems' ? '💎' : '🪙'}{' '}
                  {insufficientModal.currentAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={closeInsufficientModal}
              className="btn-close-alert w-full py-2.5 rounded-xl font-black text-xs tracking-wider uppercase transition bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] border border-rose-400/50 active:scale-95 cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
