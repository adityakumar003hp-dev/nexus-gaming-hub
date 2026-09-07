import React from 'react';
import { motion } from 'motion/react';
import { InternationalBoardSpace } from '../data/internationalBusinessData';
import { BusinessPlayer } from './BusinessBoard';
import { BusinessPawn } from './BusinessPawn';
import { InternationalBusinessCenter } from './InternationalBusinessCenter';

export interface InternationalBusinessBoardProps {
  spaces: InternationalBoardSpace[];
  players: BusinessPlayer[];
  currentPlayerId: number;
  isMovingPawn?: boolean;
  targetSpaceId?: number | null;
  onSpaceClick?: (space: InternationalBoardSpace) => void;
  // Center controls props
  isRolling?: boolean;
  diceValue?: number;
  secondDiceValue?: number;
  diceMode?: 'single' | 'double';
  onRollDice?: () => void;
}

export const InternationalBusinessBoard: React.FC<InternationalBusinessBoardProps> = ({
  spaces,
  players,
  currentPlayerId,
  isMovingPawn = false,
  targetSpaceId = null,
  onSpaceClick,
  isRolling = false,
  diceValue = 4,
  secondDiceValue = 3,
  diceMode = 'single',
  onRollDice,
}) => {
  const currentPlayer = players.find((p) => p.id === currentPlayerId) || players[0];

  return (
    <div className="relative w-full max-w-[850px] aspect-square bg-[#7f1d1d] border-4 sm:border-8 border-yellow-400 rounded-2xl shadow-2xl p-1.5 sm:p-2 grid grid-cols-10 grid-rows-10 gap-0.5 sm:gap-1 text-white font-sans select-none overflow-hidden">
      {/* CENTER LOGO & 3D ANIMATED STAGE */}
      <div className="col-start-2 col-end-10 row-start-2 row-end-10 rounded-xl relative overflow-hidden shadow-inner flex flex-col">
        <InternationalBusinessCenter
          isRolling={isRolling}
          diceValue={diceValue}
          secondDiceValue={secondDiceValue}
          diceMode={diceMode}
          onRoll={onRollDice}
          activePlayerColor={currentPlayer.color}
        />
      </div>

      {/* 36 PERIMETER GRID TILES (Mapped to exact 10x10 grid positions) */}
      {spaces.map((space) => {
        // Find if any player tokens are currently on this space index
        const tokensOnSpace = players.filter((t) => t.position === space.id);
        const owner = space.ownerId !== undefined ? players.find((p) => p.id === space.ownerId) : null;
        const isTarget = targetSpaceId === space.id;

        // Custom grid styles for 10x10 positioning
        const gridStyle: React.CSSProperties = {
          gridRowStart: space.gridPos.row,
          gridColumnStart: space.gridPos.col,
        };

        const isCorner = space.type === 'corner';
        const isChance = space.type === 'chance';
        const isTransit = space.type === 'transit';
        const isTax = space.type === 'tax';
        const isBank = space.type === 'bank';

        return (
          <div
            key={space.id}
            style={{
              ...gridStyle,
              borderColor: isTarget
                ? '#facc15'
                : owner
                ? owner.color
                : 'rgba(255,255,255,0.15)',
            }}
            onClick={() => onSpaceClick && onSpaceClick(space)}
            className={`bg-slate-900 border rounded sm:rounded-md flex flex-col items-center justify-between p-0.5 sm:p-1 text-[7px] sm:text-[9px] text-center cursor-pointer hover:border-yellow-400 hover:bg-slate-800 transition-all shadow relative overflow-hidden group ${
              isTarget ? 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)] scale-105 z-20' : ''
            }`}
          >
            {/* Color Strip for Properties & Categories */}
            {space.color && (
              <div className={`w-full h-1.5 sm:h-2 ${space.color} rounded-t absolute top-0 left-0 shadow-sm`} />
            )}

            {/* Corner or Special Header Icon */}
            <div className="flex items-center justify-center pt-1 w-full min-h-0">
              <span className="text-[9px] sm:text-xs leading-none drop-shadow">
                {space.icon}
              </span>
            </div>

            <span className="font-black text-slate-100 truncate w-full px-0.5 group-hover:text-yellow-300 tracking-tighter leading-tight">
              {space.name}
            </span>

            {/* Live Interactive Player Pawns Rendering on Tile */}
            {tokensOnSpace.length > 0 && (
              <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] rounded flex items-center justify-center gap-0.5 flex-wrap p-0.5 z-20">
                {tokensOnSpace.map((player) => (
                  <BusinessPawn
                    key={player.id}
                    colorHex={player.color}
                    token={player.token}
                    name={player.name}
                    isMoving={isMovingPawn && player.id === currentPlayerId}
                    isCurrentTurn={player.id === currentPlayerId}
                    size="sm"
                  />
                ))}
              </div>
            )}

            {/* Price or Action / HOUSEFULL Status Badge */}
            {space.price > 0 && (
              <div className="w-full flex items-center justify-center">
                {space.isOwned || space.ownerId !== undefined ? (
                  <span className="w-full text-center bg-rose-950/90 text-rose-300 text-[5.5px] sm:text-[7.5px] py-0.5 border border-rose-800/80 rounded font-black tracking-tight leading-none">
                    HOUSEFULL
                  </span>
                ) : (
                  <span className="text-yellow-400 font-bold tracking-tight text-[6px] sm:text-[8px] font-mono leading-none">
                    {space.type === 'tax' ? `Pay $${space.price}` : `$${space.price}`}
                  </span>
                )}
              </div>
            )}

            {/* Owner Color Indicator Bar */}
            {owner && (
              <div
                style={{ backgroundColor: owner.color }}
                className="w-full h-1 rounded-b absolute bottom-0 left-0"
                title={`Owned by ${owner.name}`}
              />
            )}

            {/* Renders House with Player Color ONLY if player selected and bought property */}
            {(space.hasHouse || space.houses > 0) && (
              <div className="absolute top-1 right-1 flex items-center gap-0.5 z-10">
                <div
                  style={{
                    backgroundColor: space.ownerColor || owner?.color || '#3b82f6',
                    borderColor: 'rgba(0, 0, 0, 0.4)',
                  }}
                  className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-sm border shadow-md transform rotate-45 flex items-center justify-center"
                  title={`House built by ${space.ownerColor || owner?.name || 'Owner'}`}
                />
                {space.houses > 1 && (
                  <span className="text-[6px] font-black text-amber-300 drop-shadow">
                    +{space.houses}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
