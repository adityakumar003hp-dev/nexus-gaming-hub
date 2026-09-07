import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, DollarSign, Building2, TrendingUp, AlertTriangle, UserX } from 'lucide-react';

export interface BribeBailoutModalProps {
  player: {
    id: number | string;
    name?: string;
    isBankrupt?: boolean;
    cash?: number;
    totalCash?: number;
    propertiesOwned?: number[] | any[];
    stocks?: Record<string, any>;
    outstandingDebt?: number;
  } | null;
  onAcceptBribe: (playerId: number | string, bribeCost: number) => void;
  onAcceptBankruptcy: (playerId: number | string) => void;
}

export const BribeBailoutModal: React.FC<BribeBailoutModalProps> = ({
  player,
  onAcceptBribe,
  onAcceptBankruptcy,
}) => {
  if (!player || !player.isBankrupt) return null;

  const BRIBE_COST = 5000;
  const playerName = player.name || `Player ${player.id}`;
  const propsCount = Array.isArray(player.propertiesOwned) ? player.propertiesOwned.length : 0;
  const stocksCount = player.stocks ? Object.keys(player.stocks).length : 0;

  return (
    <AnimatePresence>
      <div
        id="bribe-bailout-modal-backdrop"
        className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn"
      >
        <motion.div
          id="bribe-bailout-modal-card"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-6 w-full max-w-md text-center shadow-2xl shadow-amber-500/20 font-mono relative overflow-hidden"
        >
          {/* Top ambient hazard light */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-20 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Warning Icon & Title */}
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            🕵️‍♂️
          </div>

          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Emergency Bailout Opportunity</span>
          </div>

          <h2 className="text-2xl font-black text-amber-400 tracking-wide uppercase mb-1">
            BANKRUPTCY IMMINENT!
          </h2>
          <p className="text-xs text-slate-400 mb-5">
            <span className="text-slate-200 font-bold">{playerName}</span> has run out of liquid capital!
          </p>

          {/* Offer Breakdown Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-5 text-left space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Official Status:</span>
              <span className="text-rose-400 font-bold uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                Insolvent / Bankrupt
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Assets At Risk:</span>
              <span className="text-slate-200 font-bold">
                {propsCount} Properties • {stocksCount} Stocks
              </span>
            </div>

            <div className="border-t border-slate-800/80 my-2"></div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Under-the-Table Bribe Fee:
              </span>
              <span className="text-emerald-400 font-extrabold text-base">
                ${BRIBE_COST.toLocaleString()}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed italic bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              "Pay off federal regulators to wipe your debt ledger. You keep 100% of your real estate properties, business assets, and stock portfolio."
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              id="accept-bribe-button"
              onClick={() => onAcceptBribe(player.id, BRIBE_COST)}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black py-3 px-4 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
            >
              <span>💵</span> PAY $5,000 BRIBE & RE-ENTER GAME
            </button>

            <button
              id="forfeit-bankruptcy-button"
              onClick={() => onAcceptBankruptcy(player.id)}
              className="w-full bg-slate-800 hover:bg-rose-950/50 hover:border-rose-700 border border-slate-700 text-slate-400 hover:text-rose-300 font-bold py-2.5 px-4 rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <UserX className="w-3.5 h-3.5" />
              ACCEPT BANKRUPTCY & FORFEIT MATCH
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BribeBailoutModal;
