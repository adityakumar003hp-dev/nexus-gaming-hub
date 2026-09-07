import React from 'react';

// --- DATA DICTIONARIES ---
export interface CityPropertyCardData {
  price: number;
  baseRent: number;
  h1: number;
  h2: number;
  h3: number;
  hotel: number;
  houseCost: number;
  hotelCost: number;
  mortgage: number;
  color: string;
  rule?: string;
}

export interface TransitWaysCardData {
  price: number;
  baseRent: number;
  multiRent1: number;
  multiRent2: number;
  mortgage: number;
}

export const CITY_PROPERTY_CARDS: Record<string, CityPropertyCardData> = {
  "Bangkok, Thailand": { price: 2500, baseRent: 300, h1: 1000, h2: 1500, h3: 2000, hotel: 3000, houseCost: 2000, hotelCost: 3000, mortgage: 1400, color: "brown", rule: "If a player owns any three properties of same colour, the rent is doubled." },
  "Cairo, Egypt": { price: 3500, baseRent: 400, h1: 2000, h2: 5500, h3: 13000, hotel: 19000, houseCost: 2000, hotelCost: 3000, mortgage: 1750, color: "yellow" },
  "London, England": { price: 4500, baseRent: 500, h1: 2500, h2: 7000, h3: 15000, hotel: 22000, houseCost: 2500, hotelCost: 3500, mortgage: 2250, color: "purple" },
  "Tokyo, Japan": { price: 3500, baseRent: 350, h1: 1750, h2: 5000, h3: 12000, hotel: 18000, houseCost: 2000, hotelCost: 3000, mortgage: 1750, color: "red" },
  "Mexico City, Mexico": { price: 3500, baseRent: 400, h1: 2000, h2: 5500, h3: 13000, hotel: 19000, houseCost: 2000, hotelCost: 3000, mortgage: 1750, color: "orange" },
  "Toronto, Canada": { price: 5000, baseRent: 600, h1: 3000, h2: 8500, h3: 18000, hotel: 25000, houseCost: 2500, hotelCost: 3500, mortgage: 2500, color: "cyan" },
  "Zurich, Switzerland": { price: 5500, baseRent: 700, h1: 3500, h2: 9500, h3: 20000, hotel: 28000, houseCost: 3000, hotelCost: 4000, mortgage: 2750, color: "blue" },
  "Berlin, Germany": { price: 5000, baseRent: 600, h1: 3000, h2: 8500, h3: 18000, hotel: 25000, houseCost: 2500, hotelCost: 3500, mortgage: 2500, color: "green" },
  "Rio De Janeiro, Brazil": { price: 2500, baseRent: 250, h1: 1250, h2: 3500, h3: 8500, hotel: 13000, houseCost: 2000, hotelCost: 3000, mortgage: 1250, color: "yellow" },
  "New Delhi, India": { price: 4500, baseRent: 500, h1: 2500, h2: 7000, h3: 15000, hotel: 22000, houseCost: 2500, hotelCost: 3500, mortgage: 2250, color: "orange" },
  "Kuala Lumpur, Malaysia": { price: 3500, baseRent: 400, h1: 2000, h2: 5500, h3: 13000, hotel: 19000, houseCost: 2000, hotelCost: 3000, mortgage: 1750, color: "purple" },
  "Dubai, UAE": { price: 4500, baseRent: 500, h1: 2500, h2: 7000, h3: 15000, hotel: 22000, houseCost: 2500, hotelCost: 3500, mortgage: 2250, color: "pink" },
  "Sydney, Australia": { price: 4500, baseRent: 500, h1: 2500, h2: 7000, h3: 15000, hotel: 22000, houseCost: 2500, hotelCost: 3500, mortgage: 2250, color: "blue" },
  "Hong Kong, China": { price: 3000, baseRent: 300, h1: 1500, h2: 4500, h3: 10000, hotel: 15000, houseCost: 2000, hotelCost: 3000, mortgage: 1500, color: "cyan" },
  "Rome, Italy": { price: 3000, baseRent: 300, h1: 1500, h2: 4500, h3: 10000, hotel: 15000, houseCost: 2000, hotelCost: 3000, mortgage: 1500, color: "brown" },
  "New York, US": { price: 8500, baseRent: 1000, h1: 5000, h2: 15000, h3: 30000, hotel: 40000, houseCost: 4000, hotelCost: 5000, mortgage: 4250, color: "red" },
  "Moscow, Russia": { price: 5000, baseRent: 600, h1: 3000, h2: 8500, h3: 18000, hotel: 25000, houseCost: 2500, hotelCost: 3500, mortgage: 2500, color: "green" },
  "Seoul, South Korea": { price: 3000, baseRent: 300, h1: 1500, h2: 4500, h3: 10000, hotel: 15000, houseCost: 2000, hotelCost: 3000, mortgage: 1500, color: "purple" },
  "Cape Town, South Africa": { price: 4500, baseRent: 500, h1: 2500, h2: 7000, h3: 15000, hotel: 22000, houseCost: 2500, hotelCost: 3500, mortgage: 2250, color: "orange" },
  "Auckland, New Zealand": { price: 3500, baseRent: 400, h1: 2000, h2: 5500, h3: 13000, hotel: 19000, houseCost: 2000, hotelCost: 3000, mortgage: 1750, color: "yellow" },
  "Singapore": { price: 2500, baseRent: 250, h1: 1000, h2: 3000, h3: 7500, hotel: 11000, houseCost: 1500, hotelCost: 2500, mortgage: 1250, color: "blue" }
};

export const TRANSIT_WAYS_CARDS: Record<string, TransitWaysCardData> = {
  "Roadways": { price: 5500, baseRent: 800, multiRent1: 1500, multiRent2: 3000, mortgage: 2500 },
  "Waterways": { price: 7500, baseRent: 1500, multiRent1: 2000, multiRent2: 4000, mortgage: 3000 },
  "Railways": { price: 9500, baseRent: 1800, multiRent1: 2500, multiRent2: 5000, mortgage: 4000 },
  "Airways": { price: 10500, baseRent: 2000, multiRent1: 3000, multiRent2: 4000, mortgage: 4000 },
  "Airways / Special": { price: 7500, baseRent: 1200, multiRent1: 2200, multiRent2: 3500, mortgage: 3000 }
};

export interface PropertyWaysAndEconomicsCardsProps {
  spaceName?: string;
  spaceType?: 'property' | 'transit' | 'PROPERTY' | 'TRANSIT' | 'WAYS' | string;
  data?: {
    name?: string;
    type?: string;
    price?: number;
    baseRent?: number;
    rent?: number;
    color?: string;
    houses?: number;
    ownerId?: number;
    [key: string]: any;
  } | null;
  player?: {
    id?: number;
    name?: string;
    color?: string;
    cash?: number;
    [key: string]: any;
  } | null;
  owner?: { id: number; name: string; color: string } | null;
  currentHouses?: number;
  playerCash?: number;
  onBuy?: (price: number) => void;
  onSkip?: () => void;
  onBuildHouse?: () => void;
  onMortgage?: () => void;
  onStartAuction?: () => void;
  onAuction?: () => void;
}

export default function PropertyWaysAndEconomicsCards({
  spaceName: directSpaceName,
  spaceType: directSpaceType,
  data: passedData,
  player: passedPlayer,
  owner: directOwner,
  currentHouses: directHouses = 0,
  playerCash: directCash,
  onBuy,
  onSkip,
  onBuildHouse,
  onMortgage,
  onStartAuction: directAuction,
  onAuction: aliasAuction,
}: PropertyWaysAndEconomicsCardsProps) {
  const onStartAuction = directAuction || aliasAuction;
  const spaceName = directSpaceName || passedData?.name || 'International Property';
  const spaceType = (directSpaceType || passedData?.type || 'property').toLowerCase();
  const playerCash = directCash !== undefined ? directCash : passedPlayer?.cash ?? 0;
  const owner = directOwner || (passedData?.ownerId !== undefined && passedPlayer?.id === passedData.ownerId ? passedPlayer : null);
  const currentHouses = directHouses || passedData?.houses || 0;
  
  // 1. City Property Deed Modal with Market Economics (Build & Auction & Trade)
  if (spaceType === 'property' || CITY_PROPERTY_CARDS[spaceName]) {
    const data = CITY_PROPERTY_CARDS[spaceName] || {
      price: passedData?.price || 3500,
      baseRent: passedData?.rent || 400,
      h1: 2000,
      h2: 5500,
      h3: 13000,
      hotel: 19000,
      houseCost: 2000,
      hotelCost: 3000,
      mortgage: 1750,
      color: passedData?.color || "purple",
      rule: "If a player owns any three properties of same colour, the rent is doubled."
    };

    const buildPrice = data.houseCost || 2000;
    const auctionPrice = Math.round(data.price * 0.5); // Starts at 50% of value
    const tradeValue = Math.round(data.price * 1.25); // 25% markup value
    const investingRate = "+12.5%"; // Dynamic market indicator

    const colorHeaderMap: Record<string, string> = {
      brown: 'bg-amber-900 border-amber-500',
      yellow: 'bg-amber-600 border-yellow-400',
      purple: 'bg-purple-800 border-purple-400',
      red: 'bg-rose-800 border-red-400',
      orange: 'bg-orange-700 border-orange-400',
      cyan: 'bg-cyan-800 border-cyan-400',
      blue: 'bg-blue-800 border-blue-400',
      green: 'bg-emerald-800 border-green-400',
      pink: 'bg-pink-700 border-pink-400',
    };

    const headerStyle = colorHeaderMap[data.color] || 'bg-purple-800 border-purple-400';
    const canAffordBuy = playerCash >= data.price;
    const canAffordHouse = playerCash >= buildPrice;

    return (
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-slate-900 border-2 border-purple-500/80 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.35)] text-white">
          <div className={`${headerStyle} p-4 text-center border-b border-purple-400 shadow-inner`}>
            <span className="text-[10px] uppercase tracking-widest text-purple-200 font-bold bg-purple-950/60 px-3 py-0.5 rounded-full border border-purple-300/30">
              Title Deed Property
            </span>
            <h2 className="text-xl font-black mt-1 text-white drop-shadow">{spaceName}</h2>
            <div className="mt-1 inline-block bg-yellow-400 text-slate-950 px-2.5 py-0.5 rounded font-black text-xs shadow-sm">
              Acquisition Price: ${data.price.toLocaleString()}
            </div>
          </div>

          <div className="p-4 space-y-2 text-xs bg-slate-950 font-medium">
            <div className="flex justify-between border-b border-slate-800 pb-1 items-center">
              <span className="text-slate-300">Rent for Property only</span>
              <span className="text-emerald-400 font-black font-mono text-sm">${data.baseRent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1 items-center">
              <span className="text-slate-400">Rent with 1 House / Hotel</span>
              <span className="font-mono text-slate-200 font-bold">${data.h1.toLocaleString()} / ${data.hotel.toLocaleString()}</span>
            </div>

            {/* Live Economic Metrics */}
            <div className="grid grid-cols-2 gap-1.5 pt-1.5 pb-1.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Build Price:</span>
                <span className="text-cyan-400 font-bold font-mono">${buildPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Auction Price:</span>
                <span className="text-amber-400 font-bold font-mono">${auctionPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Trade Value:</span>
                <span className="text-blue-400 font-bold font-mono">${tradeValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Investing Rate:</span>
                <span className="text-emerald-400 font-black font-mono">{investingRate}</span>
              </div>
            </div>

            <div className="pt-1 text-[10px] text-amber-200/80 italic border-t border-slate-800 bg-yellow-500/5 p-1.5 rounded">
              💡 {data.rule || "If a player owns any three properties of same colour, the rent is doubled."}
            </div>

            <div className="pt-1 flex justify-between items-center text-slate-300 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">Bank Mortgage Value:</span>
              <span className="font-bold text-emerald-300 font-mono">${data.mortgage.toLocaleString()}</span>
            </div>

            {owner && (
              <div className="mt-1 pt-1.5 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Owner:</span>
                <span style={{ color: owner.color }} className="font-black">
                  {owner.name} (Houses: {currentHouses})
                </span>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-900 flex gap-2 border-t border-slate-800">
            {!owner ? (
              <>
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl text-xs font-bold text-slate-200 transition active:scale-95 flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                  >
                    Pass / Skip <span className="text-emerald-400 font-bold">(+${data.mortgage.toLocaleString()})</span>
                  </button>
                )}
                {onStartAuction && (
                  <button
                    onClick={onStartAuction}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 py-2.5 rounded-xl text-xs font-bold text-white shadow transition active:scale-95 cursor-pointer"
                  >
                    Auction (${auctionPrice})
                  </button>
                )}
                <button
                  onClick={() => onBuy && onBuy(data.price)}
                  disabled={!canAffordBuy}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black shadow-lg transition active:scale-95 cursor-pointer ${
                    canAffordBuy
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Buy (${data.price.toLocaleString()})
                </button>
              </>
            ) : (
              <div className="w-full flex gap-2">
                {onBuildHouse && (
                  <button
                    onClick={onBuildHouse}
                    disabled={!canAffordHouse}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                      canAffordHouse
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Build House (${buildPrice})
                  </button>
                )}
                {onMortgage && (
                  <button
                    onClick={onMortgage}
                    className="flex-1 bg-rose-600 hover:bg-rose-500 py-2.5 rounded-xl text-xs font-bold text-white shadow transition active:scale-95"
                  >
                    Mortgage (${data.mortgage.toLocaleString()})
                  </button>
                )}
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="px-3 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl text-xs font-bold text-slate-300"
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

  // 2. Transit / Ways Card Modal with Economics
  if (spaceType === 'transit' || TRANSIT_WAYS_CARDS[spaceName]) {
    const data = TRANSIT_WAYS_CARDS[spaceName] || {
      price: 5500,
      baseRent: 800,
      multiRent1: 1500,
      multiRent2: 3000,
      mortgage: 2500
    };

    const auctionPrice = Math.round(data.price * 0.5);
    const tradeValue = Math.round(data.price * 1.25);
    const investingRate = "+8.4%";
    const canAffordBuy = playerCash >= data.price;

    return (
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-slate-900 border-2 border-cyan-500 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.35)] text-white">
          <div className="bg-cyan-800 p-4 text-center border-b border-cyan-400 shadow-inner">
            <span className="text-[10px] uppercase tracking-widest text-cyan-200 font-bold bg-cyan-950/60 px-3 py-0.5 rounded-full border border-cyan-400/30">
              Transport / Ways Deed
            </span>
            <h2 className="text-xl font-black mt-1 text-white">{spaceName}</h2>
            <div className="mt-1 inline-block bg-yellow-400 text-slate-950 px-2.5 py-0.5 rounded font-black text-xs shadow-sm">
              Acquisition Price: ${data.price.toLocaleString()}
            </div>
          </div>

          <div className="p-4 space-y-2 text-xs bg-slate-950 font-medium">
            <div className="flex justify-between border-b border-slate-800 pb-1.5 items-center">
              <span className="text-slate-300">Rent for Property only</span>
              <span className="text-emerald-400 font-black font-mono text-sm">${data.baseRent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1.5 items-center">
              <span className="text-slate-400">Maximum Network Rent</span>
              <span className="font-bold text-cyan-300 font-mono text-sm">${data.multiRent2.toLocaleString()}</span>
            </div>

            {/* Live Economic Metrics */}
            <div className="grid grid-cols-2 gap-1.5 pt-1.5 pb-1.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Auction Price:</span>
                <span className="text-amber-400 font-bold font-mono">${auctionPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Trade Value:</span>
                <span className="text-blue-400 font-bold font-mono">${tradeValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center col-span-2">
                <span className="text-slate-400">Investing Rate:</span>
                <span className="text-emerald-400 font-black font-mono">{investingRate}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-between text-slate-300 border-t border-slate-800 text-[11px] items-center">
              <span className="text-slate-400">Bank Mortgage Value:</span>
              <span className="font-bold text-emerald-300 font-mono">${data.mortgage.toLocaleString()}</span>
            </div>

            {owner && (
              <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Owner:</span>
                <span style={{ color: owner.color }} className="font-black">
                  {owner.name}
                </span>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-900 flex gap-2 border-t border-slate-800">
            {!owner ? (
              <>
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl text-xs font-bold text-slate-200 transition active:scale-95 flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                  >
                    Pass / Skip <span className="text-emerald-400 font-bold">(+${data.mortgage.toLocaleString()})</span>
                  </button>
                )}
                {onStartAuction && (
                  <button
                    onClick={onStartAuction}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 py-2.5 rounded-xl text-xs font-bold text-white shadow transition active:scale-95 cursor-pointer"
                  >
                    Auction (${auctionPrice})
                  </button>
                )}
                <button
                  onClick={() => onBuy && onBuy(data.price)}
                  disabled={!canAffordBuy}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black shadow-lg transition active:scale-95 cursor-pointer ${
                    canAffordBuy
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Buy (${data.price.toLocaleString()})
                </button>
              </>
            ) : (
              <div className="w-full flex gap-2">
                {onMortgage && (
                  <button
                    onClick={onMortgage}
                    className="flex-1 bg-rose-600 hover:bg-rose-500 py-2.5 rounded-xl text-xs font-bold text-white shadow transition active:scale-95"
                  >
                    Mortgage Property (${data.mortgage.toLocaleString()})
                  </button>
                )}
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="px-3 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl text-xs font-bold text-slate-300"
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

  return null;
}
