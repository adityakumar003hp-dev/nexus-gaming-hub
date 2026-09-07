import React from 'react';
import { CITY_PROPERTY_CARDS, TRANSIT_WAYS_CARDS, CityPropertyCardData, TransitWaysCardData } from './PropertyAndWaysCards';

// Mapping from property colors / names to global market sectors
export const PROPERTY_SECTOR_MAP: Record<string, string> = {
  // Cities by name
  "Bangkok, Thailand": "Tourism & Commercial",
  "Cairo, Egypt": "Global Real Estate",
  "London, England": "Global Financial",
  "Tokyo, Japan": "International Tech",
  "Mexico City, Mexico": "Tourism & Commercial",
  "Toronto, Canada": "International Tech",
  "Zurich, Switzerland": "Global Financial",
  "Berlin, Germany": "Energy & Utilities",
  "Rio De Janeiro, Brazil": "Global Real Estate",
  "New Delhi, India": "Tourism & Commercial",
  "Kuala Lumpur, Malaysia": "International Tech",
  "Dubai, UAE": "Telecom & Satellites",
  "Sydney, Australia": "Global Financial",
  "Hong Kong, China": "International Tech",
  "Rome, Italy": "Tourism & Commercial",
  "New York, US": "Global Financial",
  "Moscow, Russia": "Energy & Utilities",
  "Seoul, South Korea": "International Tech",
  "Cape Town, South Africa": "Tourism & Commercial",
  "Auckland, New Zealand": "Global Real Estate",
  "Singapore": "Global Financial",
  
  // Transit / Ways
  "Roadways": "Aviation & Logistics",
  "Waterways": "Aviation & Logistics",
  "Railways": "Aviation & Logistics",
  "Airways": "Aviation & Logistics",
  "Airways / Special": "Aviation & Logistics",
};

// Fallback color to sector
export const COLOR_TO_SECTOR: Record<string, string> = {
  brown: "Tourism & Commercial",
  yellow: "Global Real Estate",
  purple: "International Tech",
  red: "Global Financial",
  orange: "Tourism & Commercial",
  cyan: "International Tech",
  blue: "Global Financial",
  green: "Energy & Utilities",
  pink: "Telecom & Satellites",
};

export interface DynamicPropertyCardProps {
  spaceName: string;
  spaceType?: 'property' | 'transit' | string;
  data?: (CityPropertyCardData & { sector?: string }) | (TransitWaysCardData & { sector?: string });
  owner?: { id: number; name: string; color: string } | null;
  marketRates?: Record<string, number>; // e.g. { "International Tech": 1.142, "Global Real Estate": 1.095, ... }
  playerCash?: number;
  currentHouses?: number;
  onBuy?: (price: number) => void;
  onSkip?: (bankMortgageValue?: number) => void;
  onBuildHouse?: () => void;
  onMortgage?: () => void;
  onStartAuction?: (data?: any) => void;
}

export default function DynamicPropertyCard({
  spaceName,
  spaceType = 'property',
  data: customData,
  owner,
  marketRates = {},
  playerCash = 0,
  currentHouses = 0,
  onBuy,
  onSkip,
  onBuildHouse,
  onMortgage,
  onStartAuction
}: DynamicPropertyCardProps) {
  const isTransit = spaceType === 'transit' || Boolean(TRANSIT_WAYS_CARDS[spaceName]);
  
  // Fetch deed baseline data
  const propertyData: CityPropertyCardData | undefined = !isTransit
    ? (customData as CityPropertyCardData) || CITY_PROPERTY_CARDS[spaceName] || {
        price: 3500,
        baseRent: 400,
        h1: 2000,
        h2: 5500,
        h3: 13000,
        hotel: 19000,
        houseCost: 2000,
        hotelCost: 3000,
        mortgage: 1750,
        color: 'purple',
        rule: 'If a player owns any three properties of same colour, the rent is doubled.',
      }
    : undefined;

  const transitData: TransitWaysCardData | undefined = isTransit
    ? (customData as TransitWaysCardData) || TRANSIT_WAYS_CARDS[spaceName] || {
        price: 5500,
        baseRent: 800,
        multiRent1: 1500,
        multiRent2: 3000,
        mortgage: 2500,
      }
    : undefined;

  const rawData = propertyData || transitData;
  if (!rawData) return null;

  // 1. Fetch live multiplier from stock market state based on property sector/color
  const explicitSector = (customData as any)?.sector;
  const sectorKey =
    explicitSector ||
    PROPERTY_SECTOR_MAP[spaceName] ||
    (propertyData?.color && COLOR_TO_SECTOR[propertyData.color]) ||
    (isTransit ? 'Aviation & Logistics' : 'Global Real Estate');

  const marketMultiplier = marketRates[sectorKey] ?? 1.0;
  const percentDelta = (marketMultiplier - 1) * 100;
  const isBullish = percentDelta >= 0;
  const formattedIndex = isBullish ? `+${percentDelta.toFixed(1)}%` : `${percentDelta.toFixed(1)}%`;

  // 2. Dynamically calculate live values based on stock performance
  const liveBaseRent = Math.round(rawData.baseRent * marketMultiplier);
  const liveTradeValue = Math.round(rawData.price * 1.25 * marketMultiplier);
  const liveAuctionPrice = Math.round(rawData.price * 0.5 * marketMultiplier);
  const buildPrice = propertyData ? propertyData.houseCost || 2000 : 2500;
  const canAffordBuy = playerCash >= rawData.price;
  const canAffordHouse = playerCash >= buildPrice;

  // Header styling by sector / color
  const sectorThemeMap: Record<string, { bg: string; border: string; accent: string; text: string }> = {
    'International Tech': { bg: 'bg-purple-900', border: 'border-purple-500', accent: 'text-purple-300', text: 'from-purple-600 to-indigo-600' },
    'Global Financial': { bg: 'bg-blue-900', border: 'border-blue-500', accent: 'text-blue-300', text: 'from-blue-600 to-cyan-600' },
    'Global Real Estate': { bg: 'bg-emerald-900', border: 'border-emerald-500', accent: 'text-emerald-300', text: 'from-emerald-600 to-teal-600' },
    'Tourism & Commercial': { bg: 'bg-amber-900', border: 'border-amber-500', accent: 'text-amber-300', text: 'from-amber-600 to-orange-600' },
    'Aviation & Logistics': { bg: 'bg-cyan-900', border: 'border-cyan-500', accent: 'text-cyan-300', text: 'from-cyan-600 to-blue-600' },
    'Energy & Utilities': { bg: 'bg-green-900', border: 'border-green-500', accent: 'text-green-300', text: 'from-green-600 to-emerald-600' },
    'Telecom & Satellites': { bg: 'bg-pink-900', border: 'border-pink-500', accent: 'text-pink-300', text: 'from-pink-600 to-rose-600' },
  };

  const theme = sectorThemeMap[sectorKey] || sectorThemeMap['Global Real Estate'];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className={`bg-slate-900 border-2 ${theme.border} rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] text-white`}>
        
        {/* Header with Live Stock Indicator */}
        <div className={`${theme.bg} p-4 text-center border-b ${theme.border} relative shadow-inner`}>
          <span
            className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border backdrop-blur-sm shadow-sm ${
              isBullish
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
            }`}
          >
            📈 Stock: {formattedIndex}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-200 font-bold bg-black/40 px-2.5 py-0.5 rounded-full border border-white/10 inline-block">
            {sectorKey} Sector
          </span>
          <h2 className="text-xl font-black mt-1 text-white drop-shadow-md">{spaceName}</h2>
          <div className="mt-1 inline-block bg-yellow-400 text-slate-950 px-2.5 py-0.5 rounded font-black text-xs shadow-sm">
            Acquisition Price: ${rawData.price.toLocaleString()}
          </div>
        </div>

        {/* Live Scaled Metrics & Details */}
        <div className="p-4 space-y-2 text-xs bg-slate-950 font-medium">
          {/* Live Base Rent */}
          <div className="flex justify-between border-b border-slate-800 pb-1.5 items-center">
            <span className="text-slate-300">Live Rent (Stock Adjusted)</span>
            <div className="text-right">
              <span className="text-emerald-400 font-black font-mono text-sm">${liveBaseRent.toLocaleString()}</span>
              {marketMultiplier !== 1.0 && (
                <span className="text-[10px] text-slate-400 ml-1.5">
                  (Base: ${rawData.baseRent})
                </span>
              )}
            </div>
          </div>

          {/* Property or Transit Rent Tiers */}
          {propertyData ? (
            <div className="space-y-1 text-slate-400 text-[11px] bg-slate-900/50 p-2 rounded-lg border border-slate-800/80">
              <div className="flex justify-between">
                <span>With 1 House:</span>
                <span className="font-mono text-slate-200">${Math.round(propertyData.h1 * marketMultiplier).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>With 2 Houses:</span>
                <span className="font-mono text-slate-200">${Math.round(propertyData.h2 * marketMultiplier).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>With 3 Houses:</span>
                <span className="font-mono text-slate-200">${Math.round(propertyData.h3 * marketMultiplier).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-300">With Hotel:</span>
                <span className="font-mono text-amber-300 font-bold">${Math.round(propertyData.hotel * marketMultiplier).toLocaleString()}</span>
              </div>
            </div>
          ) : transitData ? (
            <div className="space-y-1 text-slate-400 text-[11px] bg-slate-900/50 p-2 rounded-lg border border-slate-800/80">
              <div className="flex justify-between">
                <span>With 2 Transport Hubs:</span>
                <span className="font-mono text-cyan-300">${Math.round(transitData.multiRent1 * marketMultiplier).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Max Network Rent:</span>
                <span className="font-mono text-cyan-300 font-bold">${Math.round(transitData.multiRent2 * marketMultiplier).toLocaleString()}</span>
              </div>
            </div>
          ) : null}

          {/* Economic Metrics: Build Price, Auction Price, Live Trade Value */}
          <div className="grid grid-cols-2 gap-1.5 py-1.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Build Price:</span>
              <span className="text-cyan-400 font-bold font-mono">${buildPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Auction Price:</span>
              <span className="text-amber-400 font-bold font-mono">${liveAuctionPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center col-span-2">
              <span className="text-slate-400">Live Trade Value:</span>
              <span className="text-blue-400 font-bold font-mono">${liveTradeValue.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-1 text-[10px] text-slate-400 italic border-t border-slate-800">
            {propertyData?.rule || "Market fluctuations directly scale property rent, trade valuations, and auction baselines."}
          </div>

          <div className="pt-1 flex justify-between items-center text-slate-300 border-t border-slate-800 text-[11px]">
            <span className="text-slate-400">Bank Mortgage Value:</span>
            <span className="font-bold text-emerald-300 font-mono">${rawData.mortgage.toLocaleString()}</span>
          </div>

          {owner && (
            <div className="mt-1 pt-1.5 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Current Owner:</span>
              <span style={{ color: owner.color }} className="font-black">
                {owner.name} {currentHouses > 0 ? `(Houses: ${currentHouses})` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-3 bg-slate-900 flex gap-2 border-t border-slate-800">
          {!owner ? (
            <>
              {/* Option 1: Pass / Skip (Only available if player has NO house or property built yet) */}
              {onSkip && (
                <button
                  onClick={() => onSkip(rawData.mortgage)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl text-xs font-bold text-slate-200 transition active:scale-95 flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                >
                  Pass / Skip <span className="text-emerald-400 font-bold">(+${rawData.mortgage.toLocaleString()})</span>
                </button>
              )}
              {/* Option 2: Auction */}
              {onStartAuction && (
                <button
                  onClick={() => onStartAuction(rawData)}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 py-2.5 rounded-xl text-xs font-bold shadow text-white transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                >
                  Auction
                </button>
              )}
              {/* Option 3: Buy */}
              <button
                onClick={() => onBuy && onBuy(rawData.price)}
                disabled={!canAffordBuy}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black shadow-lg text-white transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                  isTransit ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-purple-600 hover:bg-purple-500'
                } ${!canAffordBuy ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Buy (${rawData.price.toLocaleString()})
              </button>
            </>
          ) : (
            <div className="w-full flex gap-2">
              {onBuildHouse && propertyData && (
                <button
                  onClick={onBuildHouse}
                  disabled={!canAffordHouse}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                    canAffordHouse
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Build House (${buildPrice.toLocaleString()})
                </button>
              )}
              {onMortgage && (
                <button
                  onClick={onMortgage}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 py-2.5 rounded-xl text-xs font-bold text-white shadow transition active:scale-95 cursor-pointer"
                  title={currentHouses === 0 ? 'No houses built: full bank mortgage value is refunded' : 'Mortgage property to bank'}
                >
                  Mortgage Bank Value (${rawData.mortgage.toLocaleString()})
                </button>
              )}
              {onSkip && (
                <button
                  onClick={() => onSkip && onSkip()}
                  className="px-3 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl text-xs font-bold text-slate-300 cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
