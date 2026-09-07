// src/components/StockMarketManager.tsx
import React, { useState } from 'react';
import { StockListing } from '../utils/gameEconomicsSetup';
import MarketHeatmap from './MarketHeatmap';
import { Flame, X } from 'lucide-react';

export interface StockMarketManagerProps {
  // 1. Core State & Variable Props
  marketStocks: StockListing[];
  setMarketStocks: React.Dispatch<React.SetStateAction<StockListing[]>>;
  isMarketCrashed: boolean;
  setIsMarketCrashed: React.Dispatch<React.SetStateAction<boolean>>;
  turnsSinceLastCrash: number;
  setTurnsSinceLastCrash: React.Dispatch<React.SetStateAction<number>>;
  onCloseTurn?: () => void;
  onCrashTriggered?: (message: string) => void;
}

export default function StockMarketManager({
  marketStocks,
  setMarketStocks,
  isMarketCrashed,
  setIsMarketCrashed,
  turnsSinceLastCrash,
  setTurnsSinceLastCrash,
  onCloseTurn,
  onCrashTriggered,
}: StockMarketManagerProps) {
  const [crashMessage, setCrashMessage] = useState<string>('');
  const [showCrashPopup, setShowCrashPopup] = useState<boolean>(false);
  const [showHeatmapModal, setShowHeatmapModal] = useState<boolean>(false);

  // Function called at the start of a new turn/cycle or manual cycle check
  const handleMarketTickCheck = () => {
    // 2. Core Logic & Math Parameters
    const crashProbability = 0.12; // 12% chance per check if cooldown allows

    // Enforce cooldown cushion (e.g., at least 3 turns since last crash)
    if (turnsSinceLastCrash < 3) {
      setTurnsSinceLastCrash((prev) => prev + 1);
      return;
    }

    const roll = Math.random();
    if (roll <= crashProbability) {
      // Trigger crash state
      setIsMarketCrashed(true);
      setTurnsSinceLastCrash(0); // Reset cooldown counter

      const updatedStocks: StockListing[] = marketStocks.map((stock) => {
        // crashSeverityMultiplier: trims down values to 40% - 70% of original price (30-60% drop)
        const crashSeverityMultiplier = 0.4 + Math.random() * 0.3;
        const newPrice = Math.max(50, Math.round(stock.price * crashSeverityMultiplier));
        const priceDrop = stock.price - newPrice;

        // calculatedChange: fix hard-cap bug by accurately computing negative percentage difference
        const calculatedChange = stock.price > 0 ? -Math.round((priceDrop / stock.price) * 100) : -45;

        return {
          ...stock,
          price: newPrice,
          isPositive: false,
          changeIndicator: `${calculatedChange}% 🚨`,
        };
      });

      setMarketStocks(updatedStocks);

      // 3. UI Notification setup
      const alertMsg =
        '🚨 SYSTEM ALERT: A sudden global economic recession has triggered a massive stock market crash! All asset valuations have plummeted drastically (-30% to -60%).';
      setCrashMessage(alertMsg);
      setShowCrashPopup(true);
      if (onCrashTriggered) {
        onCrashTriggered(alertMsg);
      }
    } else {
      setTurnsSinceLastCrash((prev) => prev + 1);
      // Stabilize / slight natural fluctuation if previously crashed
      if (isMarketCrashed && turnsSinceLastCrash >= 1) {
        setIsMarketCrashed(false);
      }
    }
  };

  // 3. UI Action Component Handler
  const handleAcknowledge = () => {
    setShowCrashPopup(false);
    if (onCloseTurn) onCloseTurn();
  };

  return (
    <div className="relative inline-flex items-center gap-1.5">
      {/* Heatmap Quick Toggle Button */}
      <button
        id="btn-toggle-market-heatmap"
        onClick={() => setShowHeatmapModal(true)}
        className="bg-slate-800/90 hover:bg-slate-700 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-300 font-medium transition shadow-sm hover:border-emerald-400 flex items-center gap-1 cursor-pointer"
        title="Open Real-Time Market Heatmap & Volatility Matrix"
      >
        <Flame className="w-3.5 h-3.5 text-amber-400" />
        <span>Heatmap</span>
      </button>

      {/* Manual test trigger or background ticker hook */}
      <button
        id="btn-process-market-cycle"
        onClick={handleMarketTickCheck}
        className="bg-slate-800/90 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg border border-purple-500/40 text-purple-300 font-medium transition shadow-sm hover:border-purple-400 flex items-center gap-1.5 cursor-pointer"
        title={`Process Market Cycle (Cooldown: ${turnsSinceLastCrash >= 3 ? 'Ready' : `${turnsSinceLastCrash}/3 turns`})`}
      >
        <span>📊 Process Cycle</span>
        {turnsSinceLastCrash < 3 && (
          <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
            {turnsSinceLastCrash}/3
          </span>
        )}
      </button>

      {/* Interactive Heatmap Modal */}
      {showHeatmapModal && (
        <div
          id="modal-market-heatmap-view"
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-fadeIn"
        >
          <div className="bg-slate-900 border border-slate-700 max-w-3xl w-full rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <h2 className="text-base font-bold text-white tracking-wide">
                  Live Stock Performance & Volatility Heatmap
                </h2>
              </div>
              <button
                onClick={() => setShowHeatmapModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Embedded Heatmap Grid */}
            <MarketHeatmap stocks={marketStocks} />

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setShowHeatmapModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-xl text-xs transition"
              >
                Close Heatmap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CrashAlertPopup: Overlay modal tracking market crisis */}
      {showCrashPopup && isMarketCrashed && (
        <div
          id="stock-market-crash-popup"
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[120] p-4 animate-fadeIn"
        >
          <div className="bg-slate-900 border border-rose-500/60 max-w-xl w-full rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-rose-500/30 animate-pulse">
              📉
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">MARKET CRASH DETECTED</h2>
              <p className="text-xs text-rose-400 mt-1 font-mono uppercase tracking-wider">
                Status: Bear Market Implosion
              </p>
            </div>

            {/* gameAnnouncement / crashMessage display */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed text-left">
              {crashMessage}
            </div>

            {/* Live visual Market Heatmap representation of affected listings */}
            <MarketHeatmap stocks={marketStocks} compact />

            {/* onClose / handleAcknowledge action trigger */}
            <button
              id="btn-acknowledge-crash"
              onClick={handleAcknowledge}
              className="bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-lg transition transform active:scale-95 cursor-pointer mt-1"
            >
              Acknowledge & Continue Turn
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

