import React from 'react';
import { Users, Sparkles, Bot, User } from 'lucide-react';
import { COLOR_POOL, updateGamePlayerCount } from '../utils/playerSetupEngine';

export interface PlayerLobbySelectorProps {
  playerCount: number;
  setPlayerCount: (count: number) => void;
  players: any[];
  setPlayers: React.Dispatch<React.SetStateAction<any[]>>;
  setTurnIndex?: (idx: number) => void;
  onResetGame?: () => void;
}

export const PlayerLobbySelector: React.FC<PlayerLobbySelectorProps> = ({
  playerCount,
  setPlayerCount,
  players,
  setPlayers,
  setTurnIndex,
  onResetGame,
}) => {
  // Toggle Human/AI for any active slot (keeping Player 1 as Human)
  const toggleSlotAI = (slotId: any) => {
    setPlayers((prev) =>
      prev.map((p, idx) => {
        if (idx !== 0 && (p.id === slotId || p.colorKey === slotId || String(p.id) === String(slotId))) {
          const nextAI = !(p.isAI !== undefined ? p.isAI : p.isAi);
          return {
            ...p,
            isAI: nextAI,
            isAi: nextAI,
          };
        }
        return p;
      })
    );
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 font-mono shadow-xl">
      {/* 1. PLAYER COUNT SELECTION BUTTONS (2 - 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-4 h-4 text-amber-400" />
          <span>👥 PLAYERS:</span>
        </span>
        <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[2, 3, 4, 5, 6].map((count) => (
            <button
              key={count}
              id={`player-count-btn-${count}`}
              onClick={() => updateGamePlayerCount(count, setPlayerCount, setPlayers, setTurnIndex, onResetGame)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                playerCount === count
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {count} Players
            </button>
          ))}
        </div>
      </div>

      {/* 2. DYNAMIC ACTIVE PLAYER SLOTS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {players.map((player, idx) => {
          const isAI = player.isAI !== undefined ? player.isAI : player.isAi;
          const displayName = player.name || player.id || `Player ${idx + 1}`;
          const colorHex = player.color || '#ef4444';

          return (
            <div
              key={player.id !== undefined ? String(player.id) : idx}
              className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-2.5 transition shadow-inner"
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/40 shadow-sm"
                    style={{ backgroundColor: colorHex }}
                  />
                  <span className="text-xs font-bold text-white truncate" title={displayName}>
                    {displayName}
                  </span>
                </div>
                {idx === 0 && (
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-400/30 flex-shrink-0">
                    YOU
                  </span>
                )}
              </div>

              {/* Toggle Human / AI for slots 2 through 6 */}
              {idx !== 0 ? (
                <button
                  id={`toggle-ai-slot-${idx}`}
                  onClick={() => toggleSlotAI(player.id)}
                  className={`w-full py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    isAI
                      ? 'bg-purple-950/60 border-purple-700/50 text-purple-300 hover:bg-purple-900/70'
                      : 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/70'
                  }`}
                >
                  {isAI ? (
                    <>
                      <Bot className="w-3 h-3 text-purple-400" />
                      <span>🤖 AI Bot</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 text-emerald-400" />
                      <span>👤 Human</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full py-1.5 text-center text-[11px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg flex items-center justify-center gap-1">
                  <User className="w-3 h-3 text-amber-400" />
                  <span>👤 Player 1</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerLobbySelector;
