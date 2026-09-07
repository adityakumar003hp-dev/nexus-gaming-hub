import React from 'react';

export interface PropertyItem {
  id: number;
  name: string;
  price: number;
  isOwned?: boolean;
  hasHouse?: boolean;
  ownerId?: number;
  ownerColor?: string;
  [key: string]: any;
}

export interface PropertyTileProps {
  property: PropertyItem;
  onBuyClick?: (currentPlayer: any, propertyId: number) => void;
  currentPlayer?: any;
}

// Board Tile Rendering Component
export function PropertyTile({ property, onBuyClick, currentPlayer }: PropertyTileProps) {
  const houseColorClasses: Record<string, string> = {
    red: 'bg-red-500 border-red-700 shadow-red-500/50',
    green: 'bg-green-500 border-green-700 shadow-green-500/50',
    yellow: 'bg-yellow-400 border-yellow-600 shadow-yellow-400/50',
    blue: 'bg-blue-500 border-blue-700 shadow-blue-500/50',
    orange: 'bg-orange-500 border-orange-700 shadow-orange-500/50',
    purple: 'bg-purple-500 border-purple-700 shadow-purple-500/50',
  };

  const colorKey = property.ownerColor?.toLowerCase() || '';
  const selectedColorClass =
    houseColorClasses[colorKey] ||
    (property.ownerColor ? `border-black/40 shadow-md` : 'bg-gray-500 border-gray-700');

  const customInlineBg =
    !houseColorClasses[colorKey] && property.ownerColor
      ? { backgroundColor: property.ownerColor }
      : undefined;

  return (
    <div className="relative w-24 h-28 border border-slate-700 bg-slate-900 text-white p-2 flex flex-col justify-between rounded-lg shadow-md select-none">
      <div className="text-xs font-bold leading-tight truncate">{property.name}</div>
      <div className="text-xs text-slate-400 font-mono">${property.price.toLocaleString()}</div>

      {/* Renders House ONLY if player selected and bought the property */}
      {property.hasHouse && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <div
            style={customInlineBg}
            className={`w-3.5 h-3.5 rounded-sm border shadow-md transform rotate-45 ${selectedColorClass}`}
            title={`House built by ${property.ownerColor || 'Owner'}`}
          />
        </div>
      )}

      {/* Buy Button / Housefull Badge */}
      {!property.isOwned ? (
        <button
          onClick={() => onBuyClick && onBuyClick(currentPlayer, property.id)}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] py-1 rounded font-bold transition active:scale-95 cursor-pointer"
        >
          Buy
        </button>
      ) : (
        <span className="w-full text-center bg-rose-950 text-rose-300 text-[9px] py-0.5 border border-rose-800 rounded font-semibold uppercase tracking-wider">
          HOUSEFULL
        </span>
      )}
    </div>
  );
}

export default PropertyTile;
