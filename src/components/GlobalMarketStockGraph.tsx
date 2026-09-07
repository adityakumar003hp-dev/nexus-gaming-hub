import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Maximize2,
  Minimize2,
  DollarSign,
  BarChart3,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface StockTickerData {
  symbol: string;
  name: string;
  category: string;
  basePrice: number;
  currentPrice: number;
  changePercent: number;
  changeAmount: number;
  high24h: number;
  low24h: number;
  volume: string;
  marketCap: string;
  isUp: boolean;
  color: string;
  data1D: Array<{ time: string; price: number; volume: number; ma?: number }>;
  data1W: Array<{ time: string; price: number; volume: number; ma?: number }>;
  data1M: Array<{ time: string; price: number; volume: number; ma?: number }>;
  data1Y: Array<{ time: string; price: number; volume: number; ma?: number }>;
}

// Generate realistic stock time series data
const generateStockHistory = (basePrice: number, volatility: number, trend: number) => {
  // 1D: 24 points (hourly)
  let curr = basePrice * (1 - volatility * 0.5);
  const data1D: Array<{ time: string; price: number; volume: number; ma: number }> = [];
  const hours = ['09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00'];
  hours.forEach((h, i) => {
    const delta = (Math.random() - 0.45 + trend * 0.1) * (basePrice * volatility);
    curr = Math.max(basePrice * 0.5, curr + delta);
    const vol = Math.floor(Math.random() * 80000 + 20000);
    data1D.push({
      time: h,
      price: Math.round(curr * 100) / 100,
      volume: vol,
      ma: Math.round((curr * 0.98 + basePrice * 0.02) * 100) / 100,
    });
  });

  // 1W: 7 days
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let currW = basePrice * 0.92;
  const data1W = days.map((d) => {
    currW += (Math.random() - 0.42 + trend * 0.15) * (basePrice * volatility * 2);
    return {
      time: d,
      price: Math.round(currW * 100) / 100,
      volume: Math.floor(Math.random() * 500000 + 150000),
      ma: Math.round(currW * 0.96 * 100) / 100,
    };
  });

  // 1M: 4 weeks
  const weeks = ['W1', 'W2', 'W3', 'W4'];
  let currM = basePrice * 0.88;
  const data1M = weeks.map((w) => {
    currM += (Math.random() - 0.38 + trend * 0.2) * (basePrice * volatility * 3);
    return {
      time: w,
      price: Math.round(currM * 100) / 100,
      volume: Math.floor(Math.random() * 2000000 + 500000),
      ma: Math.round(currM * 0.94 * 100) / 100,
    };
  });

  // 1Y: 12 months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let currY = basePrice * 0.75;
  const data1Y = months.map((m) => {
    currY += (Math.random() - 0.35 + trend * 0.25) * (basePrice * volatility * 4);
    return {
      time: m,
      price: Math.round(currY * 100) / 100,
      volume: Math.floor(Math.random() * 8000000 + 2000000),
      ma: Math.round(currY * 0.9 * 100) / 100,
    };
  });

  return { data1D, data1W, data1M, data1Y };
};

export const INITIAL_STOCKS: StockTickerData[] = [
  {
    symbol: 'GLOB:TECH',
    name: 'Global Tech Index',
    category: 'Technology & Internet',
    basePrice: 1240.5,
    currentPrice: 1385.2,
    changePercent: 11.66,
    changeAmount: 144.7,
    high24h: 1398.0,
    low24h: 1230.1,
    volume: '$48.2M',
    marketCap: '$4.2B',
    isUp: true,
    color: '#10b981',
    ...generateStockHistory(1240.5, 0.035, 0.6),
  },
  {
    symbol: 'GLOB:REIT',
    name: 'Prime World Realty',
    category: 'Real Estate & Cities',
    basePrice: 850.0,
    currentPrice: 918.4,
    changePercent: 8.05,
    changeAmount: 68.4,
    high24h: 925.0,
    low24h: 842.0,
    volume: '$31.6M',
    marketCap: '$2.8B',
    isUp: true,
    color: '#06b6d4',
    ...generateStockHistory(850.0, 0.025, 0.4),
  },
  {
    symbol: 'GLOB:AIR',
    name: 'International Aviation',
    category: 'Logistics & Airlines',
    basePrice: 620.0,
    currentPrice: 662.3,
    changePercent: 6.82,
    changeAmount: 42.3,
    high24h: 670.5,
    low24h: 615.0,
    volume: '$19.4M',
    marketCap: '$1.6B',
    isUp: true,
    color: '#f59e0b',
    ...generateStockHistory(620.0, 0.03, 0.3),
  },
  {
    symbol: 'GLOB:TELC',
    name: 'Orbital Sat & Telecom',
    category: 'Satellites & 5G',
    basePrice: 410.0,
    currentPrice: 428.5,
    changePercent: 4.51,
    changeAmount: 18.5,
    high24h: 434.0,
    low24h: 408.0,
    volume: '$14.2M',
    marketCap: '$980M',
    isUp: true,
    color: '#a855f7',
    ...generateStockHistory(410.0, 0.02, 0.25),
  },
  {
    symbol: 'GLOB:NRG',
    name: 'Clean Utilities & Grid',
    category: 'Energy & Power',
    basePrice: 310.0,
    currentPrice: 319.6,
    changePercent: 3.1,
    changeAmount: 9.6,
    high24h: 324.0,
    low24h: 308.5,
    volume: '$11.8M',
    marketCap: '$720M',
    isUp: true,
    color: '#ec4899',
    ...generateStockHistory(310.0, 0.015, 0.15),
  },
];

export interface GlobalMarketStockGraphProps {
  compact?: boolean;
  playerCash?: number;
  chartTheme?: 'default' | 'red-bearish' | string;
  isMarketCrashed?: boolean;
  onInvest?: (sectorName: string, amount: number) => void;
  onCashOutProfit?: (sectorName: string) => void;
  onExpand?: () => void;
}

export const GlobalMarketStockGraph: React.FC<GlobalMarketStockGraphProps> = ({
  compact = false,
  playerCash = 15000,
  chartTheme = 'default',
  isMarketCrashed = false,
  onInvest,
  onCashOutProfit,
  onExpand,
}) => {
  const isBearishRed = chartTheme === 'red-bearish' || isMarketCrashed;
  const [stocks, setStocks] = useState<StockTickerData[]>(INITIAL_STOCKS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('GLOB:TECH');
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '1Y'>('1D');
  const [showMA, setShowMA] = useState<boolean>(true);
  const [lastTickDirection, setLastTickDirection] = useState<'up' | 'down' | null>('up');

  const currentStock = useMemo(() => {
    return stocks.find((s) => s.symbol === selectedSymbol) || stocks[0];
  }, [stocks, selectedSymbol]);

  // Active dataset based on selected timeframe
  const chartData = useMemo(() => {
    switch (timeframe) {
      case '1W':
        return currentStock.data1W;
      case '1M':
        return currentStock.data1M;
      case '1Y':
        return currentStock.data1Y;
      case '1D':
      default:
        return currentStock.data1D;
    }
  }, [currentStock, timeframe]);

  // Realistic Live Stock Tick Engine
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prevStocks) =>
        prevStocks.map((stock) => {
          const deltaFactor = (Math.random() - 0.46) * (stock.basePrice * 0.006);
          const newPrice = Math.max(stock.basePrice * 0.5, Math.round((stock.currentPrice + deltaFactor) * 100) / 100);
          const changeAmount = Math.round((newPrice - stock.basePrice) * 100) / 100;
          const changePercent = Math.round(((changeAmount / stock.basePrice) * 100) * 100) / 100;
          const isUp = changeAmount >= 0;

          if (stock.symbol === selectedSymbol) {
            setLastTickDirection(deltaFactor >= 0 ? 'up' : 'down');
          }

          // Append real-time tick to 1D data if in 1D view
          const updated1D = [...stock.data1D];
          const lastPoint = updated1D[updated1D.length - 1];
          if (lastPoint) {
            updated1D[updated1D.length - 1] = {
              ...lastPoint,
              price: newPrice,
              ma: Math.round((newPrice * 0.98 + stock.basePrice * 0.02) * 100) / 100,
            };
          }

          return {
            ...stock,
            currentPrice: newPrice,
            changeAmount,
            changePercent,
            isUp,
            high24h: Math.max(stock.high24h, newPrice),
            low24h: Math.min(stock.low24h, newPrice),
            data1D: updated1D,
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  // Compute min/max for dynamic Y-axis domain
  const { minPrice, maxPrice } = useMemo(() => {
    const prices = chartData.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.15 || 5;
    return {
      minPrice: Math.floor(min - padding),
      maxPrice: Math.ceil(max + padding),
    };
  }, [chartData]);

  // Custom Chart Tooltip
  const CustomStockTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-white/20 p-2.5 rounded-xl shadow-2xl backdrop-blur-md text-white text-xs space-y-1">
          <div className="flex items-center justify-between gap-3 text-gray-400 font-mono text-[10px]">
            <span>Time: {label}</span>
            <span className="text-cyan-300 font-semibold">{currentStock.symbol}</span>
          </div>
          <div className="text-base font-black font-mono text-emerald-400">
            ${dataPoint.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          {dataPoint.ma && (
            <div className="text-[10px] text-amber-300 font-mono flex items-center justify-between gap-2">
              <span>MA(20):</span>
              <span>${dataPoint.ma.toFixed(2)}</span>
            </div>
          )}
          <div className="text-[10px] text-gray-400 flex items-center justify-between gap-2 border-t border-white/10 pt-1">
            <span>Volume:</span>
            <span className="font-mono text-white">${(dataPoint.volume / 1000).toFixed(0)}k</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // ================= COMPACT SIDEBAR VIEW =================
  if (compact) {
    return (
      <div className="bg-[#0b1022]/95 border border-[#1e293b] rounded-2xl p-3 shadow-xl flex flex-col gap-2.5 text-white relative overflow-hidden group">
        {/* Header with Live Ticker Pulse */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-black uppercase text-gray-200">Live Global Market</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Real Stock
            </span>
            {onExpand && (
              <button
                onClick={onExpand}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white transition"
                title="Expand Real Stock Trading Desk"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Mini Ticker Selector Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1">
          {stocks.map((s) => {
            const isSelected = s.symbol === selectedSymbol;
            return (
              <button
                key={s.symbol}
                onClick={() => setSelectedSymbol(s.symbol)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition flex items-center gap-1 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-sm'
                    : 'bg-slate-900/60 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                <span>{s.symbol.replace('GLOB:', '')}</span>
                <span className={`font-mono text-[9px] ${s.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {s.changePercent > 0 ? `+${s.changePercent}%` : `${s.changePercent}%`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Stock Live Price & Direction Banner */}
        <div className="flex items-center justify-between px-2 py-1.5 bg-slate-950/80 rounded-xl border border-white/5">
          <div>
            <div className="text-[10px] text-gray-400 font-semibold">{currentStock.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono font-black text-sm text-white">
                ${currentStock.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <motion.span
                key={currentStock.currentPrice}
                initial={{ scale: 1.2, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-[10px] font-mono font-bold flex items-center gap-0.5 px-1.5 py-0.2 rounded-full ${
                  currentStock.isUp ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                }`}
              >
                {currentStock.isUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                {currentStock.changePercent > 0 ? `+${currentStock.changePercent}%` : `${currentStock.changePercent}%`}
              </motion.span>
            </div>
          </div>

          {/* Timeframe switch */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-white/10">
            {(['1D', '1W', '1M', '1Y'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono transition ${
                  timeframe === tf ? 'bg-emerald-500 text-slate-950' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Mini Real Stock Recharts Graph */}
        <div className="h-28 w-full bg-[#080d1e] rounded-xl border border-white/5 p-1 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad_${selectedSymbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={currentStock.color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={currentStock.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} opacity={0.5} />
              <XAxis dataKey="time" hide />
              <YAxis domain={[minPrice, maxPrice]} hide />
              <Tooltip content={<CustomStockTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={currentStock.color}
                strokeWidth={2}
                fill={`url(#grad_${selectedSymbol})`}
                isAnimationActive={false}
              />
              {showMA && (
                <Area
                  type="monotone"
                  dataKey="ma"
                  stroke="#fbbf24"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  fill="none"
                  isAnimationActive={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>

          {/* Quick Indicator */}
          <div className="absolute bottom-1 right-2 text-[9px] font-mono text-gray-400 pointer-events-none">
            Vol: {currentStock.volume}
          </div>
        </div>

        {/* Quick Invest / Trade Action */}
        {onInvest && (
          <button
            onClick={() => onInvest(currentStock.name, 1000)}
            disabled={playerCash < 1000}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs border border-emerald-400/40 shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Invest $1,000 in {currentStock.name.split(' ')[0]}</span>
          </button>
        )}
      </div>
    );
  }

  // ================= EXPANDED / FULL INVESTMENT HUB VIEW =================
  return (
    <div className="w-full bg-slate-950/95 border border-[#1e293b] rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
                Global Stock &amp; Capital Market
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Real-Time Feed
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Live international security indices &amp; sector asset equities
            </p>
          </div>
        </div>

        {/* Stock Switcher Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {stocks.map((s) => {
            const isSelected = s.symbol === selectedSymbol;
            return (
              <button
                key={s.symbol}
                onClick={() => setSelectedSymbol(s.symbol)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-gray-300 border border-white/10'
                }`}
              >
                <span>{s.symbol}</span>
                <span className={`font-mono text-[10px] ${isSelected ? 'text-slate-950 font-black' : s.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {s.changePercent > 0 ? `+${s.changePercent}%` : `${s.changePercent}%`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Stock Banner Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-white/10">
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Stock Price</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-white">
              ${currentStock.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className={`text-xs font-mono font-bold flex items-center gap-1 ${currentStock.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {currentStock.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {currentStock.changeAmount > 0 ? `+$${currentStock.changeAmount}` : `-$${Math.abs(currentStock.changeAmount)}`} ({currentStock.changePercent}%)
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-gray-400 block">24h Range</span>
          <div className="text-xs font-mono font-bold text-white mt-1">
            <span className="text-emerald-400">${currentStock.high24h.toFixed(1)}</span>
            <span className="text-gray-500 mx-1">/</span>
            <span className="text-red-400">${currentStock.low24h.toFixed(1)}</span>
          </div>
          <span className="text-[10px] text-gray-400">High / Low Range</span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Trading Volume</span>
          <span className="text-sm sm:text-base font-black font-mono text-amber-300 mt-0.5 block">
            {currentStock.volume}
          </span>
          <span className="text-[10px] text-gray-400">Market Cap: {currentStock.marketCap}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Chart Controls</span>
          <div className="flex items-center gap-1 mt-1">
            {(['1D', '1W', '1M', '1Y'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded-lg text-xs font-bold font-mono transition ${
                  timeframe === tf
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-gray-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowMA((prev) => !prev)}
            className={`text-[10px] font-mono mt-1 underline cursor-pointer ${showMA ? 'text-amber-300' : 'text-gray-500'}`}
          >
            {showMA ? '✓ MA(20) Visible' : '+ Show MA(20)'}
          </button>
        </div>
      </div>

      {/* Primary Interactive Stock Recharts Canvas */}
      <div className={`h-64 sm:h-72 w-full rounded-2xl border p-3 relative transition-colors duration-500 ${
        isBearishRed
          ? 'bg-[#180509] border-rose-600/50 shadow-[0_0_25px_rgba(225,29,72,0.2)]'
          : 'bg-[#080d1e] border-white/10'
      }`}>
        {isBearishRed && (
          <div className="absolute top-2 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600/20 border border-rose-500/50 text-rose-300 text-[10px] font-black uppercase tracking-wider animate-pulse">
            <span>📉</span> BEAR MARKET IMPLOSION (-30% to -40%)
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad_full_${selectedSymbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isBearishRed ? '#f43f5e' : currentStock.color}
                  stopOpacity={isBearishRed ? 0.7 : 0.5}
                />
                <stop
                  offset="60%"
                  stopColor={isBearishRed ? '#e11d48' : currentStock.color}
                  stopOpacity={isBearishRed ? 0.25 : 0.15}
                />
                <stop offset="100%" stopColor={isBearishRed ? '#881337' : currentStock.color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isBearishRed ? '#4c0519' : '#1e293b'} opacity={0.6} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<CustomStockTooltip />} />
            <ReferenceLine y={currentStock.basePrice} stroke="#475569" strokeDasharray="3 3" label={{ value: 'Base', fill: '#64748b', fontSize: 10 }} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isBearishRed ? '#f43f5e' : currentStock.color}
              strokeWidth={3}
              fill={`url(#grad_full_${selectedSymbol})`}
              isAnimationActive={false}
            />
            {showMA && (
              <Area
                type="monotone"
                dataKey="ma"
                stroke="#fbbf24"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                fill="none"
                isAnimationActive={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Portfolio Allocation & Quick Investment Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <span className="text-gray-400 block text-[10px]">Your Available Cash</span>
            <span className="font-mono font-black text-emerald-400 text-sm sm:text-base">
              ${playerCash.toLocaleString()}
            </span>
          </div>
          <div className="h-6 w-[1px] bg-white/10" />
          <div className="text-xs">
            <span className="text-gray-400 block text-[10px]">Selected Security</span>
            <span className="font-bold text-white text-xs">{currentStock.name}</span>
          </div>
        </div>

        {onInvest && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onInvest(currentStock.name, 1000)}
              disabled={playerCash < 1000}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wide transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Invest $1,000
            </button>
            <button
              onClick={() => onInvest(currentStock.name, 5000)}
              disabled={playerCash < 5000}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-xs uppercase tracking-wide transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Invest $5,000 (5x)
            </button>
            {onCashOutProfit && (
              <button
                onClick={() => onCashOutProfit(currentStock.name)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wide transition shadow-lg animate-pulse active:scale-95 cursor-pointer"
              >
                Cash Out Profit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
