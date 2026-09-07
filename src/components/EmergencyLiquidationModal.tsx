// src/components/EmergencyLiquidationModal.tsx
import React from 'react';

export interface EmergencyLiquidationModalProps {
  player: {
    id: number;
    name: string;
    cash: number;
    totalCash?: number;
    stocks?: Record<string, { shares: number; totalInvested: number; [key: string]: any }>;
    shares?: { holdings?: Record<string, number>; prices?: Record<string, number> };
    [key: string]: any;
  } | null;
  isOpen: boolean;
  onClaimDividend: () => void;
  onClose: () => void;
}

export default function EmergencyLiquidationModal({
  player,
  isOpen,
  onClaimDividend,
  onClose,
}: EmergencyLiquidationModalProps) {
  if (!isOpen || !player) return null;

  // Check if player holds any active stock positions (supporting both stocks and shares.holdings)
  const stockHoldings = player.stocks || {};
  const sharesHoldings = player.shares?.holdings || {};
  
  const hasActiveStocksFromStocks = Object.values(stockHoldings).some((h) => (h?.shares || 0) > 0);
  const hasActiveStocksFromShares = Object.values(sharesHoldings).some((count) => count > 0);
  const hasActiveStocks = hasActiveStocksFromStocks || hasActiveStocksFromShares;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0d111a] border border-amber-500/50 rounded-2xl shadow-2xl text-white p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-xl">📈</span>
            <h2 className="text-base font-bold tracking-wide">EMERGENCY LIQUIDATION &amp; ECONOMIC RECOVERY</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        {/* Harvest Dividend Yield Section */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
              <span>📈</span> Harvest Dividend Yield
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Collect yield gains from global investment positions
            </p>
          </div>

          {/* Claim Dividend Button: Disabled if no active stocks are owned */}
          <button
            onClick={onClaimDividend}
            disabled={!hasActiveStocks}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center ${
              hasActiveStocks
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-emerald-500/20 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            Claim Dividend
          </button>
        </div>

        {!hasActiveStocks && (
          <p className="text-[11px] text-amber-400/80 italic text-center -mt-3">
            Note: You must purchase stocks from the exchange market before you can harvest dividends.
          </p>
        )}
      </div>
    </div>
  );
}
