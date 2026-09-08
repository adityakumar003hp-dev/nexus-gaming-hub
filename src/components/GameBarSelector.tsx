import React, { useState } from 'react';
import { ActiveBoardGame } from '../types';
import { Gamepad2, ChevronDown } from 'lucide-react';
import { GameEconomy } from '../utils/gameEconomy';

interface GameBarSelectorProps {
  activeBoardGame: ActiveBoardGame;
  onSelectGame: (game: ActiveBoardGame) => void;
  onOpenMultiGameHub?: () => void;
}

export const PRIMARY_NAV_ITEMS: { id: ActiveBoardGame | 'all'; title: string; subtitle?: string; icon: string }[] = [
  { id: 'all', title: 'All Games', subtitle: '20 Games', icon: '🎮' },
  { id: 'chess', title: 'Chess', subtitle: 'Pro', icon: '♟️' },
  { id: 'checkers', title: 'Draughts', subtitle: '(Checkers)', icon: '⚪' },
  { id: 'carrom', title: 'Carrom', subtitle: 'Striker', icon: '🎯' },
  { id: 'ludo', title: 'Ludo', subtitle: 'Classic', icon: '🎲' },
];

export const ALL_GAME_ITEMS: { id: ActiveBoardGame; title: string; icon: string }[] = [
  { id: 'chess', title: '1. Chess', icon: '♟️' },
  { id: 'checkers', title: '2. Draughts (Checkers)', icon: '⚪' },
  { id: 'carrom', title: '3. Carrom Board', icon: '🎯' },
  { id: 'ludo', title: '4. Ludo', icon: '🎲' },
  { id: 'snakes', title: '5. Snakes & Ladders', icon: '🐍' },
  { id: 'backgammon', title: '6. Backgammon', icon: '🎲' },
  { id: 'speed', title: '7. 9 Ball Pool / Speed', icon: '🎱' },
  { id: 'darts', title: '8. Darts Championship', icon: '🎯' },
  { id: 'pingpong', title: '9. Table Tennis', icon: '🏓' },
  { id: 'sim', title: '10. Air Hockey / Sim', icon: '🏒' },
  { id: 'dotsandboxes', title: '11. Foosball / Dots', icon: '⚽' },
  { id: 'gomoku', title: '12. Mini Golf / Gomoku', icon: '⛳' },
  { id: 'battleship', title: '13. Battleship Arena', icon: '🚢' },
  { id: 'reversi', title: '14. Reversi (Othello)', icon: '☯️' },
  { id: 'connect4', title: '15. Connect Four', icon: '🔵' },
  { id: 'ultimatetictactoe', title: '16. Ultimate Tic Tac Toe', icon: '❌' },
  { id: 'uno', title: '17. Uno Cards', icon: '🔥' },
  { id: 'hearts', title: '18. Hearts Card Arena', icon: '♥' },
  { id: 'ginrummy', title: '19. Gin Rummy', icon: '🃏' },
  { id: 'business', title: '20. Business Empire', icon: '👑' },
];

export const GameBarSelector: React.FC<GameBarSelectorProps> = ({
  activeBoardGame,
  onSelectGame,
  onOpenMultiGameHub,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div className="w-full max-w-5xl bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-1.5 flex items-center justify-between gap-2 shadow-2xl backdrop-blur-xl">
        {/* Main Quick Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar flex-1 py-0.5">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const isActive = item.id === 'all' ? false : activeBoardGame === item.id;
            return (
              <button
                key={item.id}
                id={item.id !== 'all' ? `btn-launch-${item.id.toUpperCase()}` : undefined}
                data-game-id={item.id !== 'all' ? item.id : undefined}
                data-game-title={item.title}
                onClick={() => {
                  if (item.id === 'all') {
                    if (onOpenMultiGameHub) onOpenMultiGameHub();
                  } else {
                    onSelectGame(item.id as any);
                  }
                }}
                className={`game-card px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 whitespace-nowrap active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] border border-indigo-400/50'
                    : 'bg-[#070b14] text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800/80'
                }`}
              >
                <span className="text-base select-none">{item.icon}</span>
                <div className="text-left leading-tight">
                  <div className="font-extrabold">{item.title}</div>
                  {item.subtitle && (
                    <div className="text-[9px] text-slate-400 font-semibold">{item.subtitle}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* More Games Dropdown / Hub Button */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="px-3.5 py-2 rounded-xl bg-[#070b14] hover:bg-slate-800/80 border border-slate-800 text-indigo-300 hover:text-indigo-200 text-xs font-black flex items-center gap-1.5 transition active:scale-95 shadow-md"
          >
            <Gamepad2 className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">More Games (16+)</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Expanded Games Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#0a0f1d] border border-slate-700/80 rounded-2xl p-3 shadow-2xl z-50 max-h-96 overflow-y-auto custom-scrollbar space-y-1 text-left animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between border-b border-slate-800 mb-2">
                <span>ALL 20 PLAYABLE GAMES</span>
                <span className="text-indigo-400">DUO ARENA</span>
              </div>

              {ALL_GAME_ITEMS.map((g) => (
                <button
                  key={g.id}
                  id={`btn-launch-${g.id.toUpperCase()}`}
                  data-game-id={g.id}
                  data-game-title={g.title}
                  onClick={() => {
                    setShowDropdown(false);
                    onSelectGame(g.id as any);
                  }}
                  className={`game-card game-item w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                    activeBoardGame === g.id
                      ? 'bg-indigo-600 text-white font-extrabold shadow-md'
                      : 'text-slate-300 hover:bg-[#070b14] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{g.icon}</span>
                    <span>{g.title}</span>
                  </div>
                  {activeBoardGame === g.id && (
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-black">
                      ACTIVE
                    </span>
                  )}
                </button>
              ))}

              {onOpenMultiGameHub && (
                <button
                  onClick={() => {
                    onOpenMultiGameHub();
                    setShowDropdown(false);
                  }}
                  className="w-full mt-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs text-center shadow-lg transition active:scale-95"
                >
                  Open Full Screen Game Hub 🏆
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

