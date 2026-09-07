import React from 'react';
import { ChevronRight, Gamepad2 } from 'lucide-react';
import { ActiveBoardGame } from '../types';
import { GameEconomy } from '../utils/gameEconomy';

interface ExploreGamesGridProps {
  activeBoardGame: ActiveBoardGame;
  onSelectGame: (game: ActiveBoardGame) => void;
  onOpenMultiGameHub: () => void;
}

interface GameCardDef {
  id: ActiveBoardGame;
  name: string;
  sub: string;
  icon: string;
  iconBg: string;
  borderGlow: string;
}

const EXPLORE_20_GAMES: GameCardDef[] = [
  { id: 'chess', name: 'Chess', sub: 'Classic', icon: '♟️', iconBg: 'from-emerald-600 to-teal-800', borderGlow: 'hover:border-emerald-500' },
  { id: 'checkers', name: 'Draughts', sub: 'Checkers', icon: '⚪', iconBg: 'from-amber-600 to-yellow-800', borderGlow: 'hover:border-amber-500' },
  { id: 'carrom', name: 'Carrom', sub: 'Board', icon: '🎯', iconBg: 'from-orange-600 to-amber-800', borderGlow: 'hover:border-orange-500' },
  { id: 'ludo', name: 'Ludo', sub: 'Classic', icon: '🎲', iconBg: 'from-blue-600 to-indigo-800', borderGlow: 'hover:border-blue-500' },
  { id: 'snakes', name: 'Snakes &', sub: 'Ladders', icon: '🐍', iconBg: 'from-emerald-700 to-green-900', borderGlow: 'hover:border-emerald-500' },
  { id: 'backgammon', name: 'Backgammon', sub: 'Tables', icon: '🪵', iconBg: 'from-amber-700 to-yellow-900', borderGlow: 'hover:border-amber-500' },
  { id: 'gomoku', name: 'Gomoku', sub: '5-in-a-Row', icon: '⭕', iconBg: 'from-green-600 to-emerald-800', borderGlow: 'hover:border-green-400' },
  { id: 'reversi', name: 'Reversi', sub: 'Othello', icon: '⚪⚫', iconBg: 'from-slate-700 to-slate-900', borderGlow: 'hover:border-slate-400' },
  { id: 'connect4', name: 'Connect Four', sub: '4 in a Row', icon: '🔵', iconBg: 'from-blue-600 to-indigo-800', borderGlow: 'hover:border-blue-400' },
  { id: 'ultimatetictactoe', name: 'Tic Tac Toe', sub: 'Ultimate', icon: '❌', iconBg: 'from-amber-600 to-orange-800', borderGlow: 'hover:border-amber-400' },
  { id: 'dotsandboxes', name: 'Dots & Boxes', sub: 'Territory', icon: '🔲', iconBg: 'from-yellow-600 to-amber-800', borderGlow: 'hover:border-yellow-500' },
  { id: 'battleship', name: 'Battleship', sub: 'Naval War', icon: '🚢', iconBg: 'from-cyan-600 to-blue-800', borderGlow: 'hover:border-cyan-400' },
  { id: 'sim', name: 'Sim Game', sub: 'Triangle', icon: '📐', iconBg: 'from-purple-600 to-indigo-800', borderGlow: 'hover:border-purple-400' },
  { id: 'uno', name: 'Uno Cards', sub: 'Crazy Eights', icon: '🎴', iconBg: 'from-red-600 to-amber-700', borderGlow: 'hover:border-red-400' },
  { id: 'hearts', name: 'Hearts', sub: 'Trick Taking', icon: '♥️', iconBg: 'from-pink-600 to-rose-800', borderGlow: 'hover:border-pink-400' },
  { id: 'ginrummy', name: 'Gin Rummy', sub: 'Melds', icon: '♠️', iconBg: 'from-amber-600 to-yellow-700', borderGlow: 'hover:border-amber-400' },
  { id: 'speed', name: 'Speed Cards', sub: 'Fast Spit', icon: '⚡', iconBg: 'from-yellow-500 to-amber-700', borderGlow: 'hover:border-yellow-400' },
  { id: 'darts', name: 'Darts', sub: '501 / Bullseye', icon: '🎯', iconBg: 'from-red-600 to-rose-800', borderGlow: 'hover:border-red-500' },
  { id: 'pingpong', name: 'Table Tennis', sub: 'Ping Pong', icon: '🏓', iconBg: 'from-orange-500 to-red-700', borderGlow: 'hover:border-orange-400' },
  { id: 'business', name: 'Business', sub: 'Empire Tycoon', icon: '🏛️', iconBg: 'from-amber-500 to-yellow-600', borderGlow: 'hover:border-amber-400' },
];

export const ExploreGamesGrid: React.FC<ExploreGamesGridProps> = ({
  activeBoardGame,
  onSelectGame,
  onOpenMultiGameHub,
}) => {
  return (
    <div className="w-full bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-indigo-400" />
            <span>EXPLORE 20 GAMES</span>
          </h3>
          <p className="text-xs text-slate-400 font-medium">Something for everyone — 20 full games in one platform!</p>
        </div>

        <button
          onClick={onOpenMultiGameHub}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
        >
          <span>View All 20 Games</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid of 20 Games */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2.5 sm:gap-3">
        {EXPLORE_20_GAMES.map((game) => {
          const isActive = activeBoardGame === game.id;
          const launchId = game.id === 'checkers' ? 'DRAUGHTS' : game.id === 'chess' ? 'DUO_CHESS' : game.id.toUpperCase();
          return (
            <button
              key={game.id}
              id={`btn-launch-${launchId}`}
              data-game-id={game.id}
              data-game-title={game.name}
              onClick={() => {
                if (typeof (window as any).selectAndLaunchGame === 'function') {
                  (window as any).selectAndLaunchGame(launchId);
                } else {
                  GameEconomy.requestGameStart(game.id, game.name, () => {
                    onSelectGame(game.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  });
                }
              }}
              className={`game-card game-item p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-200 group active:scale-95 text-center cursor-pointer ${
                isActive
                  ? 'bg-indigo-950/60 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                  : `bg-[#070b14] border-slate-800/80 hover:bg-slate-900/80 ${game.borderGlow}`
              }`}
            >
              {/* Game Icon Box */}
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${game.iconBg} flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform duration-200`}
              >
                <span>{game.icon}</span>
              </div>

              {/* Game Title & Subtitle */}
              <div className="space-y-0.5">
                <div className="text-xs font-extrabold text-white group-hover:text-indigo-200 transition-colors leading-tight line-clamp-1">
                  {game.name}
                </div>
                <div className="text-[10px] text-slate-400 font-medium line-clamp-1">
                  {game.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
