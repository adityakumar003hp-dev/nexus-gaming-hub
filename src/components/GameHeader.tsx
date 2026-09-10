import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  RotateCw,
  RotateCcw,
  Flag,
  Handshake,
  Volume2,
  VolumeX,
  RefreshCw,
  Swords,
  Bot,
  User,
  Trophy,
  UserCheck,
  Sparkles,
  Play,
  Lightbulb,
  Gamepad2,
  Users,
  Eye,
  Flame,
  BarChart2,
  Cloud,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Clock,
  ArrowLeftRight,
  FileText,
  Coins,
  ShoppingBag,
  Award,
  Crown,
  Dice5,
} from 'lucide-react';
import { GameMode, UserSession, ActiveBoardGame } from '../types';
import { isSiteOwner } from '../utils/owner';
import { OwnerBadge } from './OwnerBadge';
import { getUserPoints, getUserGems } from '../utils/pointsManager';
import { getDefaultGuestHandle } from '../utils/auth';

interface GameHeaderProps {
  activeBoardGame: ActiveBoardGame;
  gameMode: GameMode;
  onChangeGameMode: (mode: GameMode) => void;
  currentUser: UserSession | null;
  onOpenAuth: () => void;
  onOpenProfile?: () => void;
  onOpenStats: () => void;
  onOpenLeaderboard: () => void;
  onOpenTelemetry?: () => void;
  onOpenGoogleAuth?: () => void;
  onOpenGoogleForms?: () => void;
  onOpenWheelLobby?: () => void;
  onOpenMatchmaking: () => void;
  onOpenTournament?: () => void;
  onOpenQuests?: () => void;
  onOpenCustomization?: () => void;
  onOpenGameHub?: () => void;
  onOpenSocialHub?: () => void;
  onOpenAskGemini: () => void;
  onOpenAnimationHub?: () => void;
  onOpenDailyWheel?: () => void;
  onOpenExchange?: (direction?: 'gemToCoin' | 'coinToGem') => void;
  onOpenCoinHistory?: () => void;
  onOpenCosmeticsShop?: () => void;
  onOpenDailyStreak?: () => void;
  onOpenFriends?: () => void;
  onOpenRankedLadder?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenPuzzles?: () => void;
  onOpenPositionEditor?: () => void;
  onOpenCustomSandbox?: () => void;
  onUndoMove?: () => void;
  canUndo?: boolean;
  onResetGame: () => void;
  onFlipBoard: () => void;
  onOfferDraw: () => void;
  onResign: () => void;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isGameActive: boolean;
  isSpectator?: boolean;
}

const GAME_BRANDING: Record<
  ActiveBoardGame,
  {
    title: string;
    subtitle: string;
    icon: string;
    bgGradient: string;
    borderColor: string;
    textColor: string;
    accentGlow: string;
    playerSlots: string;
  }
> = {
  chess: {
    title: 'Chess',
    subtitle: 'Pro',
    icon: '♔',
    bgGradient: 'bg-indigo-600',
    borderColor: 'border-indigo-400/30',
    textColor: 'text-indigo-400',
    accentGlow: 'shadow-[0_0_15px_rgba(99,102,241,0.4)]',
    playerSlots: '2 Players',
  },
  checkers: {
    title: 'Draughts',
    subtitle: 'Arena',
    icon: '👑',
    bgGradient: 'bg-red-600',
    borderColor: 'border-red-400/30',
    textColor: 'text-red-400',
    accentGlow: 'shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    playerSlots: '2 Players',
  },
  backgammon: {
    title: 'Backgammon',
    subtitle: 'Club',
    icon: '🎲',
    bgGradient: 'bg-purple-600',
    borderColor: 'border-purple-400/30',
    textColor: 'text-purple-400',
    accentGlow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]',
    playerSlots: '2 Players',
  },
  snakes: {
    title: 'Snakes & Ladders',
    subtitle: 'Classic',
    icon: '🐍',
    bgGradient: 'bg-emerald-600',
    borderColor: 'border-emerald-400/30',
    textColor: 'text-emerald-400',
    accentGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    playerSlots: '2-4 Players',
  },
  ludo: {
    title: 'Ludo',
    subtitle: 'Master',
    icon: '🎯',
    bgGradient: 'bg-blue-600',
    borderColor: 'border-blue-400/30',
    textColor: 'text-blue-400',
    accentGlow: 'shadow-[0_0_15px_rgba(37,99,235,0.4)]',
    playerSlots: '2-4 Players',
  },
  gomoku: {
    title: 'Gomoku',
    subtitle: '5 in a Row',
    icon: '⚫',
    bgGradient: 'bg-amber-600',
    borderColor: 'border-amber-400/30',
    textColor: 'text-amber-400',
    accentGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]',
    playerSlots: '2 Players',
  },
  reversi: {
    title: 'Reversi',
    subtitle: 'Othello',
    icon: '☯️',
    bgGradient: 'bg-emerald-600',
    borderColor: 'border-emerald-400/30',
    textColor: 'text-emerald-400',
    accentGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    playerSlots: '2 Players',
  },
  connect4: {
    title: 'Connect Four',
    subtitle: 'Grid Match',
    icon: '🟡',
    bgGradient: 'bg-blue-600',
    borderColor: 'border-blue-400/30',
    textColor: 'text-blue-400',
    accentGlow: 'shadow-[0_0_15px_rgba(37,99,235,0.4)]',
    playerSlots: '2 Players',
  },
  ultimatetictactoe: {
    title: 'Ultimate TTT',
    subtitle: 'Super Grid',
    icon: '❌',
    bgGradient: 'bg-indigo-600',
    borderColor: 'border-indigo-400/30',
    textColor: 'text-indigo-400',
    accentGlow: 'shadow-[0_0_15px_rgba(99,102,241,0.4)]',
    playerSlots: '2 Players',
  },
  dotsandboxes: {
    title: 'Dots & Boxes',
    subtitle: 'Territory',
    icon: '📦',
    bgGradient: 'bg-emerald-600',
    borderColor: 'border-emerald-400/30',
    textColor: 'text-emerald-400',
    accentGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    playerSlots: '2 Players',
  },
  battleship: {
    title: 'Battleship',
    subtitle: 'Naval Grid',
    icon: '🚢',
    bgGradient: 'bg-cyan-600',
    borderColor: 'border-cyan-400/30',
    textColor: 'text-cyan-400',
    accentGlow: 'shadow-[0_0_15px_rgba(6,182,212,0.4)]',
    playerSlots: '2 Players',
  },
  sim: {
    title: 'Sim Game',
    subtitle: 'Triangle Hex',
    icon: '🔺',
    bgGradient: 'bg-purple-600',
    borderColor: 'border-purple-400/30',
    textColor: 'text-purple-400',
    accentGlow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]',
    playerSlots: '2 Players',
  },
  uno: {
    title: 'Uno',
    subtitle: 'Card Arena',
    icon: '🔥',
    bgGradient: 'bg-red-600',
    borderColor: 'border-red-400/30',
    textColor: 'text-red-400',
    accentGlow: 'shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    playerSlots: '2-4 Players',
  },
  hearts: {
    title: 'Hearts',
    subtitle: 'Trick Taking',
    icon: '♥',
    bgGradient: 'bg-pink-600',
    borderColor: 'border-pink-400/30',
    textColor: 'text-pink-400',
    accentGlow: 'shadow-[0_0_15px_rgba(236,72,153,0.4)]',
    playerSlots: '4 Players',
  },
  ginrummy: {
    title: 'Gin Rummy',
    subtitle: 'Meld Master',
    icon: '🃏',
    bgGradient: 'bg-amber-600',
    borderColor: 'border-amber-400/30',
    textColor: 'text-amber-400',
    accentGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]',
    playerSlots: '2 Players',
  },
  speed: {
    title: 'Speed',
    subtitle: 'Spit Cards',
    icon: '⚡',
    bgGradient: 'bg-yellow-500',
    borderColor: 'border-yellow-400/30',
    textColor: 'text-yellow-400',
    accentGlow: 'shadow-[0_0_15px_rgba(234,179,8,0.4)]',
    playerSlots: '2 Players',
  },
  carrom: {
    title: 'Carrom Board',
    subtitle: 'Striker Arena',
    icon: '🥏',
    bgGradient: 'bg-amber-600',
    borderColor: 'border-amber-400/30',
    textColor: 'text-amber-300',
    accentGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]',
    playerSlots: '1-2 Players',
  },
  darts: {
    title: 'Darts Championship',
    subtitle: 'London 501 Arena',
    icon: '🎯',
    bgGradient: 'bg-red-600',
    borderColor: 'border-red-400/30',
    textColor: 'text-red-300',
    accentGlow: 'shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    playerSlots: '1-2 Players',
  },
  pingpong: {
    title: 'Ping Pong Classic',
    subtitle: 'Paddle Rally Arena',
    icon: '🏓',
    bgGradient: 'bg-emerald-600',
    borderColor: 'border-emerald-400/30',
    textColor: 'text-emerald-300',
    accentGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    playerSlots: '1-2 Players',
  },
  business: {
    title: 'Business Empire',
    subtitle: 'Tycoon Board Arena',
    icon: '👑',
    bgGradient: 'bg-amber-600',
    borderColor: 'border-amber-400/30',
    textColor: 'text-[#ffe89e]',
    accentGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]',
    playerSlots: '2-4 Players',
  },
};

export const GameHeader: React.FC<GameHeaderProps> = ({
  activeBoardGame,
  gameMode,
  onChangeGameMode,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onOpenStats,
  onOpenLeaderboard,
  onOpenTelemetry,
  onOpenGoogleAuth,
  onOpenGoogleForms,
  onOpenWheelLobby,
  onOpenMatchmaking,
  onOpenTournament,
  onOpenQuests,
  onOpenCustomization,
  onOpenGameHub,
  onOpenSocialHub,
  onOpenAskGemini,
  onOpenAnimationHub,
  onOpenDailyWheel,
  onOpenExchange,
  onOpenCoinHistory,
  onOpenCosmeticsShop,
  onOpenDailyStreak,
  onOpenFriends,
  onOpenRankedLadder,
  onOpenAdminPanel,
  onOpenPuzzles,
  onOpenPositionEditor,
  onOpenCustomSandbox,
  onUndoMove,
  canUndo = false,
  onResetGame,
  onFlipBoard,
  onOfferDraw,
  onResign,
  onOpenSettings,
  soundEnabled,
  onToggleSound,
  isGameActive,
  isSpectator = false,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [userCoins, setUserCoins] = useState<number>(() => {
    if (currentUser?.stats?.points) return currentUser.stats.points;
    return getUserPoints();
  });
  const [isCoinBumping, setIsCoinBumping] = useState(false);

  const [userGems, setUserGems] = useState<number>(() => {
    return getUserGems();
  });
  const [isGemBumping, setIsGemBumping] = useState(false);

  useEffect(() => {
    setUserCoins(getUserPoints());
    setUserGems(getUserGems());

    const handlePointsUpdated = (e: any) => {
      const newPoints = e.detail?.points ?? getUserPoints();
      setUserCoins(newPoints);
      setIsCoinBumping(true);
      setTimeout(() => setIsCoinBumping(false), 1200);
    };

    const handleGemsUpdated = (e: any) => {
      const newGems = e.detail?.gems ?? getUserGems();
      setUserGems(newGems);
      setIsGemBumping(true);
      setTimeout(() => setIsGemBumping(false), 1200);
    };

    window.addEventListener('chess_points_updated', handlePointsUpdated);
    window.addEventListener('chess_gems_updated', handleGemsUpdated);

    return () => {
      window.removeEventListener('chess_points_updated', handlePointsUpdated);
      window.removeEventListener('chess_gems_updated', handleGemsUpdated);
    };
  }, [currentUser]);

  const brand = GAME_BRANDING[activeBoardGame] || GAME_BRANDING.chess;
  const username = currentUser?.username || (currentUser?.isGuest ? getDefaultGuestHandle() : getDefaultGuestHandle());
  const isOwner = currentUser ? isSiteOwner(currentUser.username || currentUser.email) : false;
  const streak = currentUser?.stats?.streakDays || currentUser?.dailyStreak || 1;

  return (
    <header className="w-full bg-[#030712]/95 border-b border-slate-800/90 px-4 md:px-6 py-2.5 sticky top-0 z-40 backdrop-blur-2xl transition-all shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        
        {/* Left: DUO CHESS Logo & App Icon */}
        <div className="flex items-center justify-between md:justify-start w-full md:w-auto gap-3">
          <div className="flex items-center gap-3">
            <div
              id="activeGameIconDisplay"
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white text-xl shadow-[0_0_16px_rgba(79,70,229,0.5)] border border-indigo-400/40 shrink-0"
            >
              {GAME_BRANDING[activeBoardGame]?.icon || '♟️'}
            </div>
            <div className="text-left">
              <h1 className="text-base sm:text-lg font-black tracking-wider text-white uppercase flex items-center gap-1.5 leading-none">
                <span id="activeGameTitleDisplay">
                  {GAME_BRANDING[activeBoardGame]?.title ? `${GAME_BRANDING[activeBoardGame].title} ${GAME_BRANDING[activeBoardGame].subtitle || ''}` : 'DUO CHESS'}
                </span>
              </h1>
              <div className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase pt-0.5">
                PLAY. CONNECT. WIN.
              </div>
            </div>
          </div>

          {/* Quick Play & Mode on mobile */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={onOpenMatchmaking}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-black text-xs shadow-md"
            >
              Play
            </button>
            <button
              onClick={onOpenProfile}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-sky-400 font-bold text-xs"
              title="View Profile & Stats"
            >
              Profile
            </button>
          </div>
        </div>

        {/* Center: Play and Profile Action Buttons */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            onClick={onOpenMatchmaking}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-purple-400/40 active:scale-95 transition cursor-pointer"
            id="header-desktop-play-btn"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>PLAY</span>
          </button>
          <button
            onClick={onOpenProfile}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-700 via-sky-600 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white font-black text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2 shadow-[0_0_20px_rgba(14,165,233,0.4)] border border-cyan-400/40 active:scale-95 transition cursor-pointer"
            id="header-desktop-profile-btn"
          >
            <UserCheck className="w-4 h-4" />
            <span>PROFILE</span>
          </button>
        </div>

        {/* Right: Coins, Gems, User Profile Menu Capsule & Core Tool Bar */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Coins Pill */}
          <button
            type="button"
            id="header-coins-pill"
            onClick={() => {
              if (onOpenCoinHistory) {
                onOpenCoinHistory();
              } else if (onOpenExchange) {
                onOpenExchange('coinToGem');
              } else if (onOpenDailyWheel) {
                onOpenDailyWheel();
              }
            }}
            className={`flex items-center gap-2 bg-[#070b14] hover:bg-slate-900 border px-3 py-1.5 rounded-xl text-amber-300 shadow-md cursor-pointer transition active:scale-95 group ${
              isCoinBumping
                ? 'border-amber-400 bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-105 animate-bounce'
                : 'border-amber-500/40 hover:border-amber-400/80'
            }`}
            title="Coins Wallet • Click to open Coin Ledger & Rewards Hub"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-[0_0_10px_rgba(245,158,11,0.5)] border border-amber-300 shrink-0">
              🪙
            </div>
            <div className="flex flex-col items-start leading-none text-left">
              <span id="playerCoins" className="font-mono text-xs sm:text-sm font-black text-amber-300 tracking-wide">
                🪙 <span id="userCoinsDisplay">{userCoins.toLocaleString()}</span>
              </span>
              <span className="text-[8px] font-black text-amber-400/90 tracking-widest uppercase">
                COINS
              </span>
            </div>
            <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center text-xs font-black ml-0.5 group-hover:bg-amber-500/30">
              +
            </div>
          </button>

          {/* Gems Pill */}
          <button
            type="button"
            id="header-gems-pill"
            onClick={() => {
              if (onOpenExchange) {
                onOpenExchange('gemToCoin');
              } else if (onOpenDailyWheel) {
                onOpenDailyWheel();
              }
            }}
            className={`flex items-center gap-2 bg-[#070b14] hover:bg-slate-900 border px-3 py-1.5 rounded-xl text-fuchsia-300 shadow-md cursor-pointer transition active:scale-95 group ${
              isGemBumping
                ? 'border-fuchsia-400 bg-fuchsia-500/20 shadow-[0_0_20px_rgba(217,70,239,0.6)] scale-105 animate-bounce'
                : 'border-fuchsia-500/40 hover:border-fuchsia-400/80'
            }`}
            title="Gems Wallet • Click to open Currency Exchange Hub"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-700 via-fuchsia-600 to-pink-500 flex items-center justify-center text-white text-xs shadow-[0_0_10px_rgba(217,70,239,0.5)] border border-fuchsia-300 shrink-0">
              💎
            </div>
            <div className="flex flex-col items-start leading-none text-left">
              <span id="playerGems" className="font-mono text-xs sm:text-sm font-black text-fuchsia-300 tracking-wide">
                💎 <span id="userGemsDisplay">{userGems.toLocaleString()}</span>
              </span>
              <span className="text-[8px] font-black text-fuchsia-400/90 tracking-widest uppercase">
                GEMS
              </span>
            </div>
            <div className="w-5 h-5 rounded-md bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-300 flex items-center justify-center text-xs font-black ml-0.5 group-hover:bg-fuchsia-500/30">
              +
            </div>
          </button>

          {/* User Profile Menu UI Trigger & Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0a0f1d] hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition active:scale-95 shadow-md group"
              title="Open User Profile & Stats Menu"
              id="user-profile-menu-trigger"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-500/50 flex items-center justify-center text-xs">
                {isOwner ? '👑' : '🎮'}
              </div>
              <span className="text-xs font-extrabold text-white group-hover:text-indigo-200">
                {username}
              </span>
              {isOwner ? (
                <OwnerBadge username={username} size="xs" label="OWNER" />
              ) : (
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold">
                  PRO
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-indigo-400' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {isUserMenuOpen && (
              <div 
                id="user-profile-dropdown-menu"
                className="absolute right-0 mt-2 w-72 bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl"
              >
                {/* User Summary Header */}
                <div className="p-3 bg-[#070b14] rounded-xl border border-slate-800/80 mb-2 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-lg shadow-md border border-indigo-400/40">
                      {isOwner ? '👑' : '🎮'}
                    </div>
                    <div className="text-left overflow-hidden">
                      <div className="text-xs font-black text-white truncate flex items-center gap-1">
                        <span>{username}</span>
                        {isOwner && <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {isOwner ? 'Platform Founder & Site Owner' : 'Competitive Player'}
                      </div>
                      {isOwner && (
                        <div className="mt-1 flex items-center gap-1 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-black tracking-wider flex items-center gap-0.5">
                            <span>👑</span>
                            <span>SITE OWNER</span>
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[9px] font-black tracking-wider flex items-center gap-0.5">
                            <span>♟️</span>
                            <span>PLATFORM FOUNDER</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60 text-[10px]">
                    <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400 font-bold">Rank Status</div>
                      <div className={isOwner ? "text-emerald-400 font-black" : "text-amber-400 font-black"}>
                        {isOwner ? '#1 Verified' : 'UNRANKED'}
                      </div>
                    </div>
                    <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400 font-bold">Daily Streak</div>
                      <div className="text-amber-400 font-black flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>{streak} Day</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Actions */}
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onOpenProfile) onOpenProfile();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-sky-300 hover:bg-sky-500/10 hover:text-white transition border border-transparent hover:border-sky-500/30"
                    id="menu-btn-user-profile"
                  >
                    <BarChart2 className="w-4 h-4 text-sky-400" />
                    <div className="flex-1">
                      <div>View Profile &amp; Career Stats</div>
                      <div className="text-[10px] text-slate-400 font-normal">20 Games breakdown &amp; 8 metric cards</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenLeaderboard();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-amber-300 hover:bg-amber-500/10 hover:text-white transition border border-transparent hover:border-amber-500/30"
                    id="menu-btn-leaderboard"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <div className="flex-1">
                      <div>Global Leaderboards</div>
                      <div className="text-[10px] text-slate-400 font-normal">Rankings across all 20 board games</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenStats();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-indigo-300 hover:bg-indigo-500/10 hover:text-white transition border border-transparent hover:border-indigo-500/30"
                    id="menu-btn-stats-history"
                  >
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <div className="flex-1">
                      <div>Match History &amp; Replay</div>
                      <div className="text-[10px] text-slate-400 font-normal">PGN move history &amp; review tool</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onOpenExchange) onOpenExchange('gemToCoin');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-fuchsia-300 hover:bg-fuchsia-500/10 hover:text-white transition border border-transparent hover:border-fuchsia-500/30"
                    id="menu-btn-currency-exchange"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-fuchsia-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span>Currency Exchange Hub</span>
                        <span className="text-[9px] bg-fuchsia-500/20 text-fuchsia-300 px-1 py-0.2 rounded font-mono">10:1</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">Swap Coins ⇆ Gems instantly</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onOpenDailyWheel) onOpenDailyWheel();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-emerald-300 hover:bg-emerald-500/10 hover:text-white transition border border-transparent hover:border-emerald-500/30"
                    id="menu-btn-daily-wheel"
                  >
                    <Flame className="w-4 h-4 text-amber-400" />
                    <div className="flex-1">
                      <div>Daily Rewards &amp; Lucky Spin</div>
                      <div className="text-[10px] text-slate-400 font-normal">Claim bonus coins &amp; tokens</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onOpenCoinHistory) onOpenCoinHistory();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-amber-300 hover:bg-amber-500/10 hover:text-white transition border border-transparent hover:border-amber-500/30"
                    id="menu-btn-coin-ledger"
                  >
                    <Coins className="w-4 h-4 text-amber-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span>Coin Ledger &amp; Rewards</span>
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-mono font-bold">LEDGER</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">Audit transactions, 7-day ladder &amp; streaks</div>
                    </div>
                  </button>

                  {/* Cosmetics & Theme Emporium */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onOpenCosmeticsShop) onOpenCosmeticsShop();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-amber-300 hover:bg-amber-500/10 hover:text-white transition border border-transparent hover:border-amber-500/30"
                    id="menu-btn-cosmetics-shop"
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span>Cosmetics &amp; Theme Shop</span>
                        <span className="text-[9px] bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-1 py-0.2 rounded font-mono font-black">SHOP</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">Custom dice skins, boards &amp; trails</div>
                    </div>
                  </button>

                  {/* 7-Day Login Streak */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onOpenDailyStreak) onOpenDailyStreak();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-orange-300 hover:bg-orange-500/10 hover:text-white transition border border-transparent hover:border-orange-500/30"
                    id="menu-btn-daily-streak"
                  >
                    <Flame className="w-4 h-4 text-orange-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span>7-Day Login Streak</span>
                        <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1 py-0.2 rounded font-mono font-bold">STREAK</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">Claim daily rewards &amp; Day 7 mythic chest</div>
                    </div>
                  </button>

                  {/* Friends & 1v1 Challenges */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onOpenFriends) onOpenFriends();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-sky-300 hover:bg-sky-500/10 hover:text-white transition border border-transparent hover:border-sky-500/30"
                    id="menu-btn-friends"
                  >
                    <Users className="w-4 h-4 text-sky-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span>Friends &amp; 1v1 Challenges</span>
                        <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1 py-0.2 rounded font-mono font-bold">SOCIAL</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">Live status &amp; direct game challenges</div>
                    </div>
                  </button>

                  {/* Ranked Ladder */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onOpenRankedLadder) onOpenRankedLadder();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-yellow-300 hover:bg-yellow-500/10 hover:text-white transition border border-transparent hover:border-yellow-500/30"
                    id="menu-btn-ranked-ladder"
                  >
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span>Ranked Competitive Ladder</span>
                        <span className="text-[9px] bg-yellow-500/20 text-yellow-300 px-1 py-0.2 rounded font-mono font-bold">SEASON 4</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">Ascend tiers Bronze to Grandmaster</div>
                    </div>
                  </button>

                  {/* Google Forms Suite */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onOpenGoogleForms) onOpenGoogleForms();
                      else if (onOpenGoogleAuth) onOpenGoogleAuth();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-emerald-300 hover:bg-emerald-500/10 hover:text-white transition border border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/5"
                    id="menu-btn-google-forms"
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>Google Forms Suite</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-mono font-bold">API v1</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">Create polls, surveys &amp; tournament forms</div>
                    </div>
                  </button>

                  {/* Command & Control Center (Admin / Site Owner) */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onOpenAdminPanel) onOpenAdminPanel();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-amber-300 hover:bg-amber-500/10 hover:text-white transition border border-amber-500/20 hover:border-amber-500/40 bg-amber-500/5"
                    id="menu-btn-admin-control"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>Command &amp; Control Center</span>
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-mono font-black">ADMIN</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">7-tab system governance &amp; management</div>
                    </div>
                  </button>

                  <div className="pt-1 mt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenAuth();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      id="menu-btn-auth-switch"
                    >
                      <UserCheck className="w-4 h-4 text-purple-400" />
                      <span>{currentUser ? 'Switch / Manage Account' : 'Sign In / Owner Login'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Access Menu Modals */}
          <div className="flex items-center gap-1 bg-[#070b14] p-1 rounded-xl border border-slate-800">
            {/* Direct Profile / Stats Action Button */}
            <button
              onClick={onOpenProfile}
              className="p-1.5 rounded-lg text-sky-400 hover:text-white hover:bg-sky-950/50 transition"
              title="User Profile & Career Stats"
              id="header-profile-stats-btn"
            >
              <BarChart2 className="w-4 h-4" />
            </button>

            {/* Ask Gemini Coach */}
            <button
              onClick={onOpenAskGemini}
              className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-purple-950/50 transition"
              title="Ask Gemini AI Coach"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Leaderboard */}
            <button
              onClick={onOpenLeaderboard}
              className="p-1.5 rounded-lg text-amber-400 hover:text-white hover:bg-amber-950/50 transition"
              title="Global Leaderboard"
            >
              <Trophy className="w-4 h-4" />
            </button>

            {/* Cosmetics & Theme Shop */}
            {onOpenCosmeticsShop && (
              <button
                onClick={onOpenCosmeticsShop}
                className="p-1.5 rounded-lg text-amber-300 hover:text-white hover:bg-amber-950/50 transition"
                title="Cosmetics & Theme Shop (Dice & Boards)"
                id="header-cosmetics-btn"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
            )}

            {/* 7-Day Login Streak */}
            {onOpenDailyStreak && (
              <button
                onClick={onOpenDailyStreak}
                className="p-1.5 rounded-lg text-orange-400 hover:text-white hover:bg-orange-950/50 transition"
                title="7-Day Login Streak Rewards"
                id="header-daily-streak-btn"
              >
                <Flame className="w-4 h-4" />
              </button>
            )}

            {/* Friends & 1v1 Challenges */}
            {onOpenFriends && (
              <button
                onClick={onOpenFriends}
                className="p-1.5 rounded-lg text-sky-400 hover:text-white hover:bg-sky-950/50 transition"
                title="Friends & 1v1 Challenges"
                id="header-friends-btn"
              >
                <Users className="w-4 h-4" />
              </button>
            )}

            {/* Ranked Ladder */}
            {onOpenRankedLadder && (
              <button
                onClick={onOpenRankedLadder}
                className="p-1.5 rounded-lg text-yellow-400 hover:text-white hover:bg-yellow-950/50 transition"
                title="Ranked Competitive Division Ladder"
                id="header-ranked-ladder-btn"
              >
                <Crown className="w-4 h-4" />
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-1.5 rounded-lg transition ${
                soundEnabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500'
              }`}
              title="Toggle Sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Flip Board */}
            <button
              onClick={onFlipBoard}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Flip Board"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg text-indigo-400 hover:text-white hover:bg-indigo-950/50 transition"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};

