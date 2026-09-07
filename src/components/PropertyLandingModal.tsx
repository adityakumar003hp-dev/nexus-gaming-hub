// src/components/PropertyLandingModal.tsx
import React from 'react';

export interface PropertyLandingModalProps {
  property: {
    id: number;
    name: string;
    price: number;
    acquisitionPrice?: number;
    isOwned?: boolean;
    hasHouse?: boolean;
    houses?: number;
    ownerId?: number;
    mortgage?: number;
    [key: string]: any;
  } | null;
  player: {
    id: number;
    name: string;
    color: string;
    cash: number;
    totalCash?: number;
    propertiesOwned?: number[];
    [key: string]: any;
  };
  isOpen: boolean;
  onBuy: (player: any, propertyId: number) => void;
  onAuction: (propertyId: number) => void;
  onPassAndSkip: (player: any, propertyId: number) => void;
  onClose?: () => void;
}

export default function PropertyLandingModal({
  property,
  player,
  isOpen,
  onBuy,
  onAuction,
  onPassAndSkip,
  onClose,
}: PropertyLandingModalProps) {
  if (!isOpen || !property) return null;

  // Check if the player already owns a house or the property itself
  const hasHouseOrProperty =
    property.isOwned ||
    (property.houses && property.houses > 0) ||
    (player.propertiesOwned && player.propertiesOwned.includes(property.id));

  const acquisitionPrice = property.acquisitionPrice || property.price || 3000;
  const currentCash = player.cash ?? player.totalCash ?? 0;
  const canAfford = currentCash >= acquisitionPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-white p-6 flex flex-col gap-4">
        
        {/* Header / Title */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xl font-black text-amber-400 tracking-tight">{property.name}</h3>
            <p className="text-xs text-slate-400 font-medium">Unowned International Property / Landed</p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-emerald-950/90 text-emerald-300 border border-emerald-700/80 rounded-lg font-bold font-mono shadow-sm">
            Acquisition Price: ${acquisitionPrice.toLocaleString()}
          </span>
        </div>

        {/* Notification message regarding automatic acquisition fee requirement */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 rounded-xl text-xs text-slate-300 leading-relaxed shadow-inner">
          ⚠️ <strong className="text-amber-300">Notice:</strong> Landing on this place requires processing the acquisition fee of{' '}
          <strong className="text-white font-mono font-bold">${acquisitionPrice.toLocaleString()}</strong>. If you decide not to buy and haven't built a house on it, bank mortgage value is processed. Choose your action below:
        </div>

        {/* Action Options (3 Distinct Buttons) */}
        <div className="flex flex-col gap-2.5 mt-2">
          
          {/* Option 1: Buy */}
          <button
            onClick={() => onBuy(player, property.id)}
            disabled={!canAfford}
            className={`w-full py-3 px-4 rounded-xl shadow-lg transition active:scale-[0.98] flex items-center justify-between font-bold text-sm cursor-pointer ${
              canAfford
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>🏢</span>
              <span>Buy Property</span>
            </div>
            <span className="text-xs bg-emerald-950/80 text-emerald-200 px-2.5 py-1 rounded-md border border-emerald-600/60 font-mono font-bold">
              ${acquisitionPrice.toLocaleString()}
            </span>
          </button>

          {/* Option 2: Auction */}
          <button
            onClick={() => onAuction(property.id)}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 font-bold text-sm rounded-xl shadow-lg transition active:scale-[0.98] flex items-center justify-between text-white cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>⚖️</span>
              <span>Send to Auction</span>
            </div>
            <span className="text-xs bg-amber-950/80 text-amber-200 px-2.5 py-1 rounded-md border border-amber-600/60 font-mono font-bold">
              Open Bidding
            </span>
          </button>

          {/* Option 3: Pass / Skip (Only available if player has NO house or property built yet) */}
          {!hasHouseOrProperty ? (
            <button
              onClick={() => onPassAndSkip(player, property.id)}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-rose-200 font-semibold text-sm rounded-xl shadow transition active:scale-[0.98] flex items-center justify-between border border-slate-600 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>⏭️</span>
                <span>Pass & Skip</span>
              </div>
              <span className="text-xs bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-800 font-mono font-bold">
                Bank Mortgage +${(property.mortgage || Math.round(acquisitionPrice * 0.5)).toLocaleString()}
              </span>
            </button>
          ) : (
            <div className="text-center text-[11px] text-slate-500 italic py-1 bg-slate-950/50 rounded-lg border border-slate-800">
              Pass & Skip disabled (Property/House already owned or built).
            </div>
          )}

        </div>

        {onClose && (
          <div className="mt-1 flex justify-end">
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-200 transition py-1 px-2 rounded hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
