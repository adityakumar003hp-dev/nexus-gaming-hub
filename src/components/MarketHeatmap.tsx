// src/components/MarketHeatmap.tsx
import React, { useState } from 'react';
import { StockListing } from '../utils/gameEconomicsSetup';
import { Flame, TrendingUp, TrendingDown, Activity, AlertTriangle, Zap } from 'lucide-react';

export interface MarketHeatmapProps {
  stocks: StockListing[];
  onSelectStock?: (stock: StockListing) => void;
  selectedStockId?: string;
  compact?: boolean;
  className?: string;
}

export default function MarketHeatmap({
  stocks,
  onSelectStock,
  selectedStockId,
  compact = false,
  className = '',
}: MarketHeatmapProps) {
  const [filter, setFilter] = useState<'all' | 'high-vol' | 'gainers' | 'losers'>('all');

  // Helper to parse numeric percent from changeIndicator e.g. "+12.4%", "-35% 🚨"
  const parsePercent = (changeIndicator?: string): number => {
    if (!changeIndicator) return 0;
    const match = changeIndicator.match(/([+-]?\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Helper to classify volatility
  const getVolatilityRating = (vol: number): { label: string; color: string; isHigh: boolean } => {
    if (vol >= 0.12) return { label: 'High Volatility', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10', isHigh: true };
    if (vol >= 0.07) return { label: 'Medium Volatility', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10', isHigh: false };
    return { label: 'Low Volatility', color: 'text-blue-400 border-blue-500/40 bg-blue-500/10', isHigh: false };
  };

  // Filter stocks according to tab selection
  const filteredStocks = stocks.filter((stock) => {
    const pct = parsePercent(stock.changeIndicator);
    const isGain = stock.isPositive ?? pct >= 0;
    if (filter === 'high-vol') return stock.volatility >= 0.10;
    if (filter === 'gainers') return isGain && pct > 0;
    if (filter === 'losers') return !isGain || pct < 0;
    return true;
  });

  // Calculate market metrics
  const totalStocks = stocks.length;
  const gainersCount = stocks.filter((s) => (s.isPositive ?? parsePercent(s.changeIndicator) >= 0)).length;
  const losersCount = totalStocks - gainersCount;
  const highVolCount = stocks.filter((s) => s.volatility >= 0.10).length;

  return (
    <div
      id="market-heatmap-container"
      className={`bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col gap-3.5 ${className}`}
    >
      {/* Header & Market Pulse */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-rose-500/20 border border-slate-700 flex items-center justify-center text-base">
            🔥
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
              Market Heatmap & Volatility Matrix
            </h3>
            <p className="text-[11px] text-slate-400">
              Color-coded performance tracking & high-volatility opportunity screener
            </p>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px]">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              filter === 'all' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({totalStocks})
          </button>
          <button
            onClick={() => setFilter('high-vol')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
              filter === 'high-vol' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Zap className="w-3 h-3" />
            High Vol ({highVolCount})
          </button>
          <button
            onClick={() => setFilter('gainers')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
              filter === 'gainers' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 shadow' : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            Gainers ({gainersCount})
          </button>
          <button
            onClick={() => setFilter('losers')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
              filter === 'losers' ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 shadow' : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <TrendingDown className="w-3 h-3" />
            Losers ({losersCount})
          </button>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div
        className={`grid gap-3 ${
          compact ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {filteredStocks.map((stock) => {
          const pct = parsePercent(stock.changeIndicator);
          const isProfit = stock.isPositive ?? pct >= 0;
          const volInfo = getVolatilityRating(stock.volatility);
          const isSelected = selectedStockId === stock.id;

          // Color calculation: green for profit, red for loss with intensity
          const absPct = Math.abs(pct);
          let bgClass = '';
          let borderClass = '';
          let textAccent = '';

          if (isProfit) {
            if (absPct >= 20) {
              bgClass = 'bg-emerald-950/70 hover:bg-emerald-900/80';
              borderClass = 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
              textAccent = 'text-emerald-300';
            } else if (absPct >= 8) {
              bgClass = 'bg-emerald-950/40 hover:bg-emerald-900/50';
              borderClass = 'border-emerald-500/40';
              textAccent = 'text-emerald-400';
            } else {
              bgClass = 'bg-emerald-950/20 hover:bg-emerald-900/30';
              borderClass = 'border-emerald-500/25';
              textAccent = 'text-emerald-400';
            }
          } else {
            if (absPct >= 25) {
              bgClass = 'bg-rose-950/70 hover:bg-rose-900/80';
              borderClass = 'border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.15)]';
              textAccent = 'text-rose-300';
            } else if (absPct >= 10) {
              bgClass = 'bg-rose-950/40 hover:bg-rose-900/50';
              borderClass = 'border-rose-500/40';
              textAccent = 'text-rose-400';
            } else {
              bgClass = 'bg-rose-950/20 hover:bg-rose-900/30';
              borderClass = 'border-rose-500/25';
              textAccent = 'text-rose-400';
            }
          }

          return (
            <div
              key={stock.id}
              onClick={() => onSelectStock && onSelectStock(stock)}
              className={`relative rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between cursor-pointer ${bgClass} ${borderClass} ${
                isSelected ? 'ring-2 ring-cyan-400 scale-[1.02]' : 'hover:scale-[1.01]'
              }`}
            >
              {/* Top row: Symbol & Volatility Badge */}
              <div className="flex items-start justify-between gap-1.5 mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-white tracking-wider font-mono">
                      {stock.id}
                    </span>
                    {volInfo.isHigh && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold border flex items-center gap-0.5 bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse">
                        <Flame className="w-2.5 h-2.5" />
                        HIGH VOL
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate max-w-[130px]" title={stock.name}>
                    {stock.name}
                  </div>
                </div>

                {/* Performance Pill */}
                <div
                  className={`text-xs font-bold px-2 py-0.5 rounded-lg border font-mono flex items-center gap-1 ${
                    isProfit
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{stock.changeIndicator || `${isProfit ? '+' : ''}${pct}%`}</span>
                </div>
              </div>

              {/* Bottom Row: Price & Volatility Meter */}
              <div className="pt-2 border-t border-white/5 flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                    Asset Price
                  </div>
                  <div className="text-base font-black text-white font-mono">
                    ${stock.price.toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                    Volatility
                  </div>
                  <div className={`text-xs font-bold ${volInfo.color.split(' ')[0]}`}>
                    {(stock.volatility * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Volatility Indicator Progress bar */}
              <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stock.volatility >= 0.12
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : stock.volatility >= 0.07
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, stock.volatility * 500)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend & Summary Footer */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-slate-300 font-medium">Profit / Gain</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            <span className="text-slate-300 font-medium">Loss / Drawdown</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <span className="text-slate-300 font-medium">High Volatility (≥10%)</span>
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="text-emerald-400 font-bold">{gainersCount} Bull</span>
          <span>/</span>
          <span className="text-rose-400 font-bold">{losersCount} Bear</span>
        </div>
      </div>
    </div>
  );
}
