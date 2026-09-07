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
  color?: string;
  rule?: string;
  investingRate?: string;
  tradeValue?: number;
  auctionPrice?: number;
  buildPrice?: number;
}

export interface TransitWaysCardData {
  price: number;
  baseRent: number;
  multiRent1: number;
  multiRent2: number;
  mortgage: number;
  investingRate?: string;
  tradeValue?: number;
  auctionPrice?: number;
  buildPrice?: number;
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
  "Airways": { price: 10500, baseRent: 2000, multiRent1: 3000, multiRent2: 4000, mortgage: 4000 }
};

export interface PropertyAndWaysCardsProps {
  spaceName: string;
  spaceType: 'property' | 'transit' | string;
  owner?: { id: number; name: string; color: string } | null;
  marketRates?: Record<string, number>;
  onBuy?: (price: number) => void;
  onSkip?: (bankMortgageValue?: number) => void;
  onBuildHouse?: () => void;
  onMortgage?: () => void;
  onStartAuction?: (data?: any) => void;
}

// --- UNIFIED MODAL COMPONENT ---
export default function PropertyAndWaysCards({
  spaceName,
  spaceType,
  owner,
  marketRates = {},
  onBuy,
  onSkip,
  onBuildHouse,
  onMortgage,
  onStartAuction
}: PropertyAndWaysCardsProps) {
  
  // 1. Render City Property Deed Card
  if (spaceType === 'property' || CITY_PROPERTY_CARDS[spaceName]) {
    const data = CITY_PROPERTY_CARDS[spaceName];
    if (!data) return null;

    const sectorKey = data.color ? (data.color === 'purple' || data.color === 'cyan' ? 'International Tech' : data.color === 'blue' || data.color === 'red' ? 'Global Financial' : data.color === 'green' ? 'Energy & Utilities' : 'Global Real Estate') : 'Global Real Estate';
    const mult = marketRates[sectorKey] ?? 1.0;
    const buildPrice = data.buildPrice || data.houseCost || 2000;
    const auctionPrice = data.auctionPrice || Math.round(data.price * 0.5 * mult);
    const tradeValue = data.tradeValue || Math.round(data.price * 1.25 * mult);
    const investingRate = data.investingRate || (mult >= 1 ? `+${((mult - 1) * 100).toFixed(1)}%` : `${((mult - 1) * 100).toFixed(1)}%`);
    const liveRent = Math.round(data.baseRent * mult);

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 border-2 border-purple-500 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl text-white">
          <div className="bg-purple-800 p-4 text-center border-b border-purple-400">
            <span className="text-[10px] uppercase tracking-widest text-purple-200 font-semibold bg-purple-900/50 px-2 py-0.5 rounded">
              Title Deed Property
            </span>
            <h2 className="text-xl font-bold mt-1">{spaceName}</h2>
            <span className="text-xs text-yellow-300 font-semibold">Acquisition Price: ${data.price}</span>
          </div>

          <div className="p-4 space-y-1.5 text-xs bg-slate-950 font-medium">
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span>Rent for Property only</span>
              <span className="text-emerald-400 font-bold">${data.baseRent}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span>Rent with 1 House</span>
              <span>${data.h1}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span>Rent with 2 Houses</span>
              <span>${data.h2}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span>Rent with 3 Houses</span>
              <span>${data.h3}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span>Rent with Hotel</span>
              <span className="text-amber-400 font-bold">${data.hotel}</span>
            </div>

            {/* Economic Metrics: Investing Rate, Trade Value, Auction Price, Build Price */}
            <div className="grid grid-cols-2 gap-1.5 pt-1.5 pb-1.5 bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Investing rate:</span>
                <span className="text-emerald-400 font-bold">{investingRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trade value:</span>
                <span className="text-blue-400 font-bold">${tradeValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Auction price:</span>
                <span className="text-amber-400 font-bold">${auctionPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Build price:</span>
                <span className="text-cyan-400 font-bold">${buildPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-1.5 text-[10px] text-slate-400 italic border-t border-slate-800">
              {data.rule || "If a player owns any three properties of same colour, the rent is doubled."}
            </div>

            <div className="pt-1.5 space-y-1 text-slate-300 border-t border-slate-800">
              <div className="flex justify-between"><span>Bank Mortgage Value:</span><span className="font-bold text-white">${data.mortgage}</span></div>
              <div className="flex justify-between"><span>Cost of House:</span><span className="font-bold text-white">${data.houseCost}</span></div>
              <div className="flex justify-between"><span>Cost of Hotel:</span><span className="font-bold text-white">${data.hotelCost}</span></div>
            </div>
          </div>

          <div className="p-3 bg-slate-900 flex gap-2">
            {!owner ? (
              <>
                <button 
                  onClick={() => onSkip && onSkip(data.mortgage)} 
                  className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-xs font-medium text-slate-200"
                >
                  Pass / Skip <span className="text-emerald-400 font-bold">(+${data.mortgage})</span>
                </button>
                {onStartAuction && (
                  <button 
                    onClick={() => onStartAuction(data)} 
                    className="flex-1 bg-amber-600 hover:bg-amber-500 py-2 rounded-lg text-xs font-semibold shadow text-white"
                  >
                    Auction
                  </button>
                )}
                <button 
                  onClick={() => onBuy && onBuy(data.price)} 
                  className="flex-1 bg-purple-600 hover:bg-purple-500 py-2 rounded-lg text-xs font-semibold shadow text-white"
                >
                  Buy (${data.price})
                </button>
              </>
            ) : (
              <div className="w-full flex gap-2">
                <button onClick={onBuildHouse} className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded-lg text-xs font-semibold">Build House</button>
                <button onClick={onMortgage} className="flex-1 bg-rose-600 hover:bg-rose-500 py-2 rounded-lg text-xs font-semibold">Mortgage</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Render Ways / Transit Card Modal (Roadways, Waterways, Railways, Airways)
  if (spaceType === 'transit' || TRANSIT_WAYS_CARDS[spaceName]) {
    const data = TRANSIT_WAYS_CARDS[spaceName];
    if (!data) return null;

    const buildPrice = data.buildPrice || 2500;
    const auctionPrice = data.auctionPrice || Math.round(data.price * 0.5);
    const tradeValue = data.tradeValue || Math.round(data.price * 1.25);
    const investingRate = data.investingRate || "+8.4%";

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 border-2 border-cyan-500 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl text-white">
          <div className="bg-cyan-800 p-4 text-center border-b border-cyan-400">
            <span className="text-[10px] uppercase tracking-widest text-cyan-200 font-semibold bg-cyan-900/50 px-2 py-0.5 rounded">
              Transport / Ways Deed
            </span>
            <h2 className="text-xl font-bold mt-1">{spaceName}</h2>
            <span className="text-xs text-yellow-300 font-semibold">Acquisition Price: ${data.price}</span>
          </div>

          <div className="p-4 space-y-2 text-xs bg-slate-950 font-medium">
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span>Rent for Property only</span>
              <span className="text-emerald-400 font-bold">${data.baseRent}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span>If you also own another transport</span>
              <span className="font-bold">${data.multiRent1}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span>Maximum Network Rent</span>
              <span className="font-bold text-cyan-300">${data.multiRent2}</span>
            </div>

            {/* Economic Metrics: Investing Rate, Trade Value, Auction Price, Build Price */}
            <div className="grid grid-cols-2 gap-1.5 pt-1.5 pb-1.5 bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Investing rate:</span>
                <span className="text-emerald-400 font-bold">{investingRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trade value:</span>
                <span className="text-blue-400 font-bold">${tradeValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Auction price:</span>
                <span className="text-amber-400 font-bold">${auctionPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Build price:</span>
                <span className="text-cyan-400 font-bold">${buildPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-between text-slate-300 border-t border-slate-800">
              <span>Bank Mortgage Value:</span>
              <span className="font-bold text-white">${data.mortgage}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900 flex gap-2">
            {!owner ? (
              <>
                <button 
                  onClick={() => onSkip && onSkip(data.mortgage)} 
                  className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-xs font-medium text-slate-200"
                >
                  Pass / Skip <span className="text-emerald-400 font-bold">(+${data.mortgage})</span>
                </button>
                {onStartAuction && (
                  <button 
                    onClick={() => onStartAuction(data)} 
                    className="flex-1 bg-amber-600 hover:bg-amber-500 py-2 rounded-lg text-xs font-semibold shadow text-white"
                  >
                    Auction
                  </button>
                )}
                <button 
                  onClick={() => onBuy && onBuy(data.price)} 
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 py-2 rounded-lg text-xs font-semibold shadow text-white"
                >
                  Buy (${data.price})
                </button>
              </>
            ) : (
              <button onClick={onMortgage} className="w-full bg-rose-600 hover:bg-rose-500 py-2 rounded-lg text-xs font-semibold shadow">
                Mortgage Property (${data.mortgage})
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
