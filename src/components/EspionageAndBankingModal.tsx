import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  Shield,
  CreditCard,
  Building,
  DollarSign,
  Skull,
  Zap,
  Lock,
  Landmark,
  KeyRound,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Flame,
  AlertTriangle,
  Users,
} from 'lucide-react';
import {
  MARKET_FLUX_EVENTS,
  SABOTAGE_CATALOG,
  executeSabotageOperation,
  processCorporateBanking,
  MarketFluxEvent,
  AudioFX,
} from '../utils/businessEmpireEngine';

export interface EspionageAndBankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: any[];
  activePlayerId: number;
  currentMarketPhase?: MarketFluxEvent;
  onTriggerMarketShift?: () => void;
  setPlayers: React.Dispatch<React.SetStateAction<any[]>>;
  onAddLogMessage?: (msg: string) => void;
  onOpenCodebreaker?: (targetName: string) => void;
}

export const EspionageAndBankingModal: React.FC<EspionageAndBankingModalProps> = ({
  isOpen,
  onClose,
  players,
  activePlayerId,
  currentMarketPhase = MARKET_FLUX_EVENTS.BULL_RUN,
  onTriggerMarketShift,
  setPlayers,
  onAddLogMessage,
  onOpenCodebreaker,
}) => {
  const [activeTab, setActiveTab] = useState<'banking' | 'espionage' | 'market'>('banking');
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(10000);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(10000);
  const [repayAmount, setRepayAmount] = useState<number>(5000);

  if (!isOpen) return null;

  const humanPlayer = players.find((p) => !p.isAi || p.id === activePlayerId) || players[0];
  const rivals = players.filter((p) => p.id !== humanPlayer?.id);

  const humanCash = humanPlayer ? (humanPlayer.cash ?? humanPlayer.totalCash ?? 0) : 0;
  const humanVault = humanPlayer?.offshoreVault ?? 0;
  const humanDebt = humanPlayer?.outstandingDebt ?? 0;
  const humanRisk = humanPlayer?.riskIndex ?? 0;

  const handleDeposit = () => {
    if (depositAmount <= 0) return;
    const ok = processCorporateBanking.depositOffshore(
      humanPlayer.id,
      depositAmount,
      setPlayers,
      onAddLogMessage
    );
    if (!ok) {
      AudioFX.playAccessDenied();
    }
  };

  const handleWithdraw = () => {
    if (withdrawAmount <= 0) return;
    const ok = processCorporateBanking.withdrawOffshore(
      humanPlayer.id,
      withdrawAmount,
      setPlayers,
      onAddLogMessage
    );
    if (!ok) {
      AudioFX.playAccessDenied();
    }
  };

  const handleTakeLoan = (amount: number) => {
    processCorporateBanking.issueEmergencyLoan(
      humanPlayer.id,
      amount,
      setPlayers,
      onAddLogMessage
    );
  };

  const handleRepayDebt = () => {
    if (repayAmount <= 0) return;
    const ok = processCorporateBanking.repayLoan(
      humanPlayer.id,
      repayAmount,
      setPlayers,
      onAddLogMessage
    );
    if (!ok) {
      AudioFX.playAccessDenied();
    }
  };

  const handleLaunchSabotage = (opType: 'FRAME_JOB' | 'CYBER_ATTACK' | 'EXECUTIVE_POACH') => {
    if (selectedTargetId === null) return;
    const res = executeSabotageOperation(
      opType,
      humanPlayer.id,
      selectedTargetId,
      setPlayers,
      onAddLogMessage
    );
    if (!res.success) {
      AudioFX.playAccessDenied();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl text-slate-100"
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-md">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Corporate Vaults &amp; Espionage HQ</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  Empire Suite
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Offshore tax shielding, emergency credit lines &amp; covert rival disruption
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 gap-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('banking')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition ${
              activeTab === 'banking'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Offshore Vault &amp; Loans</span>
          </button>

          <button
            onClick={() => setActiveTab('espionage')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition ${
              activeTab === 'espionage'
                ? 'bg-rose-500 text-slate-950 font-black shadow-lg shadow-rose-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Skull className="w-4 h-4" />
            <span>Industrial Espionage</span>
          </button>

          <button
            onClick={() => setActiveTab('market')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition ${
              activeTab === 'market'
                ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Global Market Cycles</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Quick Player Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Cash</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                ${humanCash.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Offshore Vault</span>
              <span className="text-sm font-black text-indigo-300 font-mono">
                ${humanVault.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Debt Outstanding</span>
              <span className="text-sm font-black text-rose-400 font-mono">
                ${humanDebt.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Audit Risk Index</span>
              <span className={`text-sm font-black font-mono ${humanRisk > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {humanRisk}%
              </span>
            </div>
          </div>

          {/* TAB 1: BANKING & OFFSHORE VAULTS */}
          {activeTab === 'banking' && (
            <div className="space-y-4">
              {/* Offshore Vault Shield Section */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-bold text-sm text-indigo-200">
                      Offshore Tax Shield (Cayman Islands Vault)
                    </h3>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Shielded from IRS Raids
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Funds stored in your offshore vault cannot be seized during Federal Audits or IRS Tax
                  Raids. You can deposit or repatriate funds at any time.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Deposit */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">Stash to Vault</span>
                      <span className="text-slate-500">${depositAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDepositAmount(5000)}
                        className="px-2 py-1 bg-slate-800 text-[10px] rounded hover:bg-slate-700 font-bold"
                      >
                        $5k
                      </button>
                      <button
                        onClick={() => setDepositAmount(15000)}
                        className="px-2 py-1 bg-slate-800 text-[10px] rounded hover:bg-slate-700 font-bold"
                      >
                        $15k
                      </button>
                      <button
                        onClick={() => setDepositAmount(Math.floor(humanCash * 0.5))}
                        className="px-2 py-1 bg-slate-800 text-[10px] rounded hover:bg-slate-700 font-bold"
                      >
                        50%
                      </button>
                    </div>
                    <button
                      onClick={handleDeposit}
                      disabled={humanCash < depositAmount || depositAmount <= 0}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Deposit ${depositAmount.toLocaleString()}</span>
                    </button>
                  </div>

                  {/* Withdraw */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">Repatriate Funds</span>
                      <span className="text-slate-500">${withdrawAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setWithdrawAmount(5000)}
                        className="px-2 py-1 bg-slate-800 text-[10px] rounded hover:bg-slate-700 font-bold"
                      >
                        $5k
                      </button>
                      <button
                        onClick={() => setWithdrawAmount(15000)}
                        className="px-2 py-1 bg-slate-800 text-[10px] rounded hover:bg-slate-700 font-bold"
                      >
                        $15k
                      </button>
                      <button
                        onClick={() => setWithdrawAmount(humanVault)}
                        className="px-2 py-1 bg-slate-800 text-[10px] rounded hover:bg-slate-700 font-bold"
                      >
                        All
                      </button>
                    </div>
                    <button
                      onClick={handleWithdraw}
                      disabled={humanVault < withdrawAmount || withdrawAmount <= 0}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Withdraw ${withdrawAmount.toLocaleString()}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Emergency Bank Loans Section */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-sm text-amber-200">
                      Emergency Bank Credit Line (20% Interest)
                    </h3>
                  </div>
                  <span className="text-[11px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                    Debt Incurred: ${humanDebt.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Instantly obtain liquid capital during cash shortfalls or auctions. Loans incur a 20%
                  interest charge.
                </p>

                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => handleTakeLoan(10000)}
                    className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/50 rounded-xl transition text-center active:scale-95 cursor-pointer"
                  >
                    <span className="text-xs font-bold text-amber-400 block">$10,000 Loan</span>
                    <span className="text-[10px] text-slate-400 block">+$12k Debt</span>
                  </button>
                  <button
                    onClick={() => handleTakeLoan(25000)}
                    className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/50 rounded-xl transition text-center active:scale-95 cursor-pointer"
                  >
                    <span className="text-xs font-bold text-amber-400 block">$25,000 Loan</span>
                    <span className="text-[10px] text-slate-400 block">+$30k Debt</span>
                  </button>
                  <button
                    onClick={() => handleTakeLoan(50000)}
                    className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/50 rounded-xl transition text-center active:scale-95 cursor-pointer"
                  >
                    <span className="text-xs font-bold text-amber-400 block">$50,000 Loan</span>
                    <span className="text-[10px] text-slate-400 block">+$60k Debt</span>
                  </button>
                </div>

                {humanDebt > 0 && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">Repay Debt:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRepayAmount(Math.min(humanDebt, humanCash))}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded font-bold"
                      >
                        Max (${Math.min(humanDebt, humanCash).toLocaleString()})
                      </button>
                      <button
                        onClick={handleRepayDebt}
                        disabled={humanCash <= 0 || humanDebt <= 0}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition"
                      >
                        Pay Down Debt
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INDUSTRIAL ESPIONAGE */}
          {activeTab === 'espionage' && (
            <div className="space-y-4">
              {/* Target Selector */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-rose-400" />
                  <span>Select Corporate Rival Target:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {rivals.map((r) => {
                    const isSelected = selectedTargetId === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelectedTargetId(r.id)}
                        className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-rose-950/60 border-rose-500 shadow-md shadow-rose-500/20'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                          style={{ backgroundColor: r.color || '#3b82f6', color: '#fff' }}
                        >
                          {r.name?.charAt(0) || 'P'}
                        </div>
                        <div className="overflow-hidden flex-1">
                          <span className="text-xs font-bold text-white block truncate">
                            {r.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            ${(r.cash ?? r.totalCash ?? 0).toLocaleString()} | Risk: {r.riskIndex || 0}%
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sabotage Operations List */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Frame Job */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{SABOTAGE_CATALOG.FRAME_JOB.icon}</span>
                      <span className="text-xs font-mono font-black text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
                        ${SABOTAGE_CATALOG.FRAME_JOB.cost.toLocaleString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white">
                      {SABOTAGE_CATALOG.FRAME_JOB.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {SABOTAGE_CATALOG.FRAME_JOB.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => handleLaunchSabotage('FRAME_JOB')}
                    disabled={
                      selectedTargetId === null ||
                      humanCash < SABOTAGE_CATALOG.FRAME_JOB.cost
                    }
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition shadow active:scale-95"
                  >
                    Execute Frame Job
                  </button>
                </div>

                {/* 2. Cyber Attack */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{SABOTAGE_CATALOG.CYBER_ATTACK.icon}</span>
                      <span className="text-xs font-mono font-black text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
                        ${SABOTAGE_CATALOG.CYBER_ATTACK.cost.toLocaleString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white">
                      {SABOTAGE_CATALOG.CYBER_ATTACK.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {SABOTAGE_CATALOG.CYBER_ATTACK.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => handleLaunchSabotage('CYBER_ATTACK')}
                    disabled={
                      selectedTargetId === null ||
                      humanCash < SABOTAGE_CATALOG.CYBER_ATTACK.cost
                    }
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition shadow active:scale-95"
                  >
                    Launch Cyber Attack
                  </button>
                </div>

                {/* 3. Poach Executive */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{SABOTAGE_CATALOG.EXECUTIVE_POACH.icon}</span>
                      <span className="text-xs font-mono font-black text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
                        ${SABOTAGE_CATALOG.EXECUTIVE_POACH.cost.toLocaleString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white">
                      {SABOTAGE_CATALOG.EXECUTIVE_POACH.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {SABOTAGE_CATALOG.EXECUTIVE_POACH.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => handleLaunchSabotage('EXECUTIVE_POACH')}
                    disabled={
                      selectedTargetId === null ||
                      humanCash < SABOTAGE_CATALOG.EXECUTIVE_POACH.cost
                    }
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition shadow active:scale-95"
                  >
                    Poach Management
                  </button>
                </div>
              </div>

              {/* Interactive Codebreaker Launch */}
              {onOpenCodebreaker && (
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-300">
                        Codebreaker Safe Override Mini-Game
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Manual decryption module for audit sanitization &amp; defense
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCodebreaker(humanPlayer.name || 'Your Portfolio');
                    }}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Open Console
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GLOBAL MARKET CYCLES */}
          {activeTab === 'market' && (
            <div className="space-y-4">
              {/* Active Market Phase Banner */}
              <div className="bg-gradient-to-br from-slate-900 to-amber-950/30 border border-amber-500/40 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{currentMarketPhase.icon}</span>
                    <h3 className="font-black text-base text-amber-300">
                      {currentMarketPhase.name}
                    </h3>
                  </div>
                  <span className="text-xs font-bold bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-400/30">
                    ACTIVE CYCLE
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentMarketPhase.description}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                  <div className="bg-slate-950/80 p-2 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Property Yield</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      x{currentMarketPhase.propertyMultiplier}
                    </span>
                  </div>
                  <div className="bg-slate-950/80 p-2 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Stock Volatility</span>
                    <span className="text-xs font-bold text-cyan-400 font-mono">
                      x{currentMarketPhase.stockVolatility}
                    </span>
                  </div>
                  <div className="bg-slate-950/80 p-2 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Risk Modifier</span>
                    <span className="text-xs font-bold text-rose-400 font-mono">
                      +{currentMarketPhase.riskModifier}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Cycle Catalog Reference */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  All Global Macroeconomic Cycles:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.values(MARKET_FLUX_EVENTS).map((evt) => (
                    <div
                      key={evt.name}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        evt.name === currentMarketPhase.name
                          ? 'bg-amber-950/30 border-amber-500/50'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-slate-200">
                        <span>{evt.icon}</span>
                        <span>{evt.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{evt.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trigger Shift Action */}
              {onTriggerMarketShift && (
                <button
                  onClick={onTriggerMarketShift}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl transition shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Cycle Macroeconomic Phase Now</span>
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default EspionageAndBankingModal;
