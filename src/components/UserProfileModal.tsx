import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  Search,
  CheckCircle2,
  Flame,
  Crown,
  Gamepad2,
  Clock,
  Timer,
  XCircle,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Zap,
  BarChart2,
  Swords,
  Layers,
  ShieldCheck,
  AlertCircle,
  Medal,
  ChevronRight,
  History,
  Users,
} from 'lucide-react';
import { isSiteOwner } from '../utils/owner';
import { MatchRecord } from '../types';
import { soundFx } from '../utils/audio';
import { getUserPoints } from '../utils/pointsManager';
import { getDefaultGuestHandle } from '../utils/auth';

export interface GameMetadataItem {
  id: string;
  num: number;
  name: string;
  category: string;
  iconEmoji: string;
  defaultMatches: number;
  baseEarnings?: number;
}

export const TWENTY_GAMES_METADATA: GameMetadataItem[] = [
  { id: 'chess', num: 1, name: 'Chess', category: 'Strategy', iconEmoji: '♟️', defaultMatches: 18, baseEarnings: 1000 },
  { id: 'draughts', num: 2, name: 'Draughts', category: 'Board', iconEmoji: '⚪', defaultMatches: 8, baseEarnings: 0 },
  { id: 'carrom', num: 3, name: 'Carrom', category: 'Physics', iconEmoji: '🥏', defaultMatches: 6, baseEarnings: 0 },
  { id: 'ludo', num: 4, name: 'Ludo', category: 'Dice', iconEmoji: '🎯', defaultMatches: 12, baseEarnings: 0 },
  { id: 'snakes', num: 5, name: 'Snakes & Ladders', category: 'Dice', iconEmoji: '🐍', defaultMatches: 5, baseEarnings: 0 },
  { id: 'backgammon', num: 6, name: 'Backgammon', category: 'Board', iconEmoji: '🎲', defaultMatches: 4, baseEarnings: 0 },
  { id: 'connect4', num: 7, name: 'Connect 4', category: 'Grid', iconEmoji: '🟡', defaultMatches: 7, baseEarnings: 0 },
  { id: 'othello', num: 8, name: 'Othello', category: 'Strategy', iconEmoji: '⚫', defaultMatches: 3, baseEarnings: 0 },
  { id: 'go', num: 9, name: 'Go', category: 'Strategy', iconEmoji: '🪨', defaultMatches: 2, baseEarnings: 0 },
  { id: 'battleship', num: 10, name: 'Battleship', category: 'Strategy', iconEmoji: '🚢', defaultMatches: 5, baseEarnings: 0 },
  { id: 'dominoes', num: 11, name: 'Dominoes', category: 'Board', iconEmoji: '🀄', defaultMatches: 4, baseEarnings: 0 },
  { id: 'tictactoe', num: 12, name: 'Tic-Tac-Toe', category: 'Grid', iconEmoji: '❌', defaultMatches: 10, baseEarnings: 0 },
  { id: 'chinese_checkers', num: 13, name: 'Chinese Checkers', category: 'Board', iconEmoji: '🔯', defaultMatches: 3, baseEarnings: 0 },
  { id: 'shogi', num: 14, name: 'Shogi', category: 'Strategy', iconEmoji: '🀄', defaultMatches: 2, baseEarnings: 0 },
  { id: 'business', num: 15, name: 'Business Empire', category: 'Tycoon', iconEmoji: '🏙️', defaultMatches: 6, baseEarnings: 0 },
  { id: 'airhockey', num: 16, name: 'Air Hockey', category: 'Sports', iconEmoji: '🏒', defaultMatches: 5, baseEarnings: 0 },
  { id: 'pool', num: 17, name: 'Pool', category: 'Sports', iconEmoji: '🎱', defaultMatches: 8, baseEarnings: 0 },
  { id: 'darts', num: 18, name: 'Darts', category: 'Sports', iconEmoji: '🎯', defaultMatches: 4, baseEarnings: 0 },
  { id: 'tabletennis', num: 19, name: 'Table Tennis', category: 'Sports', iconEmoji: '🏓', defaultMatches: 6, baseEarnings: 0 },
  { id: 'speedcards', num: 20, name: 'Speed Cards', category: 'Cards', iconEmoji: '🃏', defaultMatches: 5, baseEarnings: 0 },
];

export const SIXTEEN_GAMES_METADATA = TWENTY_GAMES_METADATA;

export interface GameStatDetail {
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  resigns: number;
  totalTimeSeconds: number;
  earnings?: number;
}

interface UserProfileModalProps {
  username: string;
  isOpen: boolean;
  onClose: () => void;
  gameType?: string;
  onSelectGame?: (gameId: string) => void;
}

function formatTime(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0m 0s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  username: initialUsername,
  isOpen,
  onClose,
  gameType: defaultGame = 'all',
  onSelectGame,
}) => {
  const [targetUsername, setTargetUsername] = useState(initialUsername || getDefaultGuestHandle());
  const [selectedGame, setSelectedGame] = useState<string>(defaultGame || 'all');
  const [searchInput, setSearchInput] = useState('');

  // Per game stats map
  const [gameStatsMap, setGameStatsMap] = useState<Record<string, GameStatDetail>>({});
  const [matchesHistory, setMatchesHistory] = useState<MatchRecord[]>([]);
  const [dailyStreak, setDailyStreak] = useState<number>(1);
  const [totalScore, setTotalScore] = useState<number>(2650);

  useEffect(() => {
    if (initialUsername) {
      setTargetUsername(initialUsername);
    }
  }, [initialUsername]);

  const isOwnerUser = isSiteOwner(targetUsername);

  // Load user stats from local storage & server matches
  useEffect(() => {
    if (!isOpen) return;

    try {
      const storedStreak = parseInt(localStorage.getItem('chess_daily_streak') || '1', 10);
      setDailyStreak(isOwnerUser ? 1 : Math.max(1, storedStreak || 1));
      
      const livePoints = getUserPoints();
      setTotalScore(livePoints);
    } catch {
      setDailyStreak(1);
      setTotalScore(getUserPoints());
    }

    const handlePointsUpdated = (e: any) => {
      const newPoints = e.detail?.points ?? getUserPoints();
      setTotalScore(newPoints);
    };

    window.addEventListener('chess_points_updated', handlePointsUpdated);

    // Build per-game stats
    const stats: Record<string, GameStatDetail> = {};
    TWENTY_GAMES_METADATA.forEach((g) => {
      const key = `game_stats_${g.id}_${targetUsername}`;
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          stats[g.id] = JSON.parse(raw);
        } else {
          // Default baseline for visual optimism
          if (isOwnerUser) {
            stats[g.id] = {
              matchesPlayed: g.defaultMatches,
              wins: Math.round(g.defaultMatches * 0.7),
              losses: Math.round(g.defaultMatches * 0.2),
              draws: Math.round(g.defaultMatches * 0.1),
              resigns: 0,
              totalTimeSeconds: g.defaultMatches * 180,
              earnings: g.id === 'chess' ? 1000 : g.defaultMatches * 50,
            };
          } else {
            stats[g.id] = {
              matchesPlayed: 0,
              wins: 0,
              losses: 0,
              draws: 0,
              resigns: 0,
              totalTimeSeconds: 0,
              earnings: 0,
            };
          }
        }
      } catch {
        stats[g.id] = {
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          resigns: 0,
          totalTimeSeconds: 0,
          earnings: 0,
        };
      }
    });

    setGameStatsMap(stats);

    // Fetch match records
    fetch(`/api/user/matches?username=${encodeURIComponent(targetUsername)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.matches)) {
          setMatchesHistory(data.matches);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('chess_points_updated', handlePointsUpdated);
    };
  }, [isOpen, targetUsername, isOwnerUser]);

  if (!isOpen) return null;

  // Calculate aggregated metrics
  let totalPlayedAgg = 0;
  let totalWinsAgg = 0;
  let totalLossesAgg = 0;
  let totalDrawsAgg = 0;
  let totalResignsAgg = 0;
  let totalTimeSecondsAgg = 0;
  let totalEarningsAgg = 0;

  Object.values(gameStatsMap).forEach((st) => {
    totalPlayedAgg += st.matchesPlayed || 0;
    totalWinsAgg += st.wins || 0;
    totalLossesAgg += st.losses || 0;
    totalDrawsAgg += st.draws || 0;
    totalResignsAgg += st.resigns || 0;
    totalTimeSecondsAgg += st.totalTimeSeconds || 0;
    totalEarningsAgg += st.earnings || 0;
  });

  const totalPlayed = totalPlayedAgg || (isOwnerUser ? 78 : 0);
  const totalWins = totalWinsAgg || (isOwnerUser ? 53 : 0);
  const totalLosses = totalLossesAgg || (isOwnerUser ? 17 : 0);
  const totalDraws = totalDrawsAgg || (isOwnerUser ? 8 : 0);
  const totalResigns = totalResignsAgg || 0;
  const totalTimeSec = totalTimeSecondsAgg || (isOwnerUser ? 15120 : 230); // 4h 12m for owner
  const avgMatchSec = totalPlayed > 0 ? Math.round(totalTimeSec / totalPlayed) : 270; // 4m 30s

  const winRatePercent = totalPlayed > 0 ? Math.round((totalWins / totalPlayed) * 100) : 68;
  const lossRatePercent = totalPlayed > 0 ? Math.round((totalLosses / totalPlayed) * 100) : 22;
  const drawRatePercent = totalPlayed > 0 ? Math.round((totalDraws / totalPlayed) * 100) : 10;
  const resignRatePercent = totalPlayed > 0 ? Math.round((totalResigns / totalPlayed) * 100) : 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setTargetUsername(searchInput.trim());
      setSearchInput('');
      soundFx.playMove();
    }
  };

  const sampleLeaderboard = [
    { rank: 1, name: 'Aditya-Owner', elo: 2650, isCrown: true, isOwner: true, avatar: '👑' },
    { rank: 2, name: 'Guest_1232', elo: 2410, isCrown: false, avatar: '👤' },
    { rank: 3, name: 'Player_456', elo: 2210, isCrown: false, avatar: '👤' },
    { rank: 4, name: 'Gamer_789', elo: 2100, isCrown: false, avatar: '👤' },
    { rank: 5, name: 'Chess_Pro', elo: 1980, isCrown: false, avatar: '👤' },
  ];

  const sampleRecentMatches = [
    { opponent: 'Guest_1232', outcome: 'Victory', time: '2m ago', score: '+12', game: 'Chess', moves: 34, win: true },
    { opponent: 'Player_456', outcome: 'Victory', time: '15m ago', score: '+10', game: 'Chess', moves: 28, win: true },
    { opponent: 'Gamer_789', outcome: 'Draw', time: '30m ago', score: '+5', game: 'Draughts', moves: 42, draw: true },
    { opponent: 'Guest_8741', outcome: 'Defeat', time: '1h ago', score: '-8', game: 'Ludo', moves: 19, loss: true },
    { opponent: 'Chess_Pro', outcome: 'Victory', time: '2h ago', score: '+15', game: 'Chess', moves: 51, win: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-y-auto font-sans animate-in fade-in duration-200">
      {/* Modal Card Shell */}
      <div className="relative w-full max-w-5xl rounded-[28px] bg-[#070b14] border border-slate-800/90 shadow-[0_0_80px_rgba(0,0,0,0.85)] text-slate-100 flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* Top Floating Action Bar (Search & Close) */}
        <div className="px-5 py-3.5 bg-[#050810]/90 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="text-amber-400">DUO CHESS</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-300">USER PROFILE</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <form onSubmit={handleSearchSubmit} className="relative w-44 sm:w-60">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search player handle..."
                className="w-full bg-[#0d1424] border border-slate-800 focus:border-sky-500/60 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 outline-none transition font-sans"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            </form>

            <button
              onClick={() => {
                soundFx.playMove();
                setGameStatsMap({ ...gameStatsMap });
              }}
              title="Refresh User Stats"
              className="p-2 rounded-xl bg-[#0d1424] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              title="Close Profile"
              className="p-2 rounded-xl bg-[#0d1424] border border-slate-800 hover:border-red-500/50 text-slate-400 hover:text-red-400 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Main Area */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto scrollbar-thin">
          
          {/* ================= 1. HEADER & HERO BANNER (Balanced Dual-Column Header Card) ================= */}
          <div className="w-full bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            {/* Background glow accents */}
            <div className="absolute top-0 left-12 w-56 h-56 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 right-12 w-56 h-56 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              
              {/* Left Column: Player Handle, Verification Badges, Rank Badge */}
              <div className="flex items-center gap-4 sm:gap-5 flex-1">
                {/* Glowing Avatar Ring */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-500 p-[3px] shadow-[0_0_30px_rgba(147,51,234,0.4)]">
                    <div className="w-full h-full rounded-full bg-[#070b14] flex items-center justify-center text-3xl font-black text-white border border-slate-800">
                      {isOwnerUser ? '👑' : targetUsername.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  {/* Live Status Pill */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#030712] border border-emerald-500/50 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-400 tracking-wider">LIVE</span>
                  </div>
                </div>

                {/* Info Stack */}
                <div className="space-y-1.5 text-left">
                  {/* Handle & Verification Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase font-mono flex items-center gap-1.5">
                      {targetUsername.toUpperCase()}
                      {isOwnerUser && <CheckCircle2 className="w-5 h-5 text-sky-400 fill-sky-400/20" />}
                    </span>

                    {/* Custom Verification Badges */}
                    {isOwnerUser ? (
                      <>
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black tracking-wider flex items-center gap-1 shadow-sm">
                          <span>👑</span>
                          <span>SITE OWNER</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-black tracking-wider flex items-center gap-1 shadow-sm">
                          <span>♟️</span>
                          <span>PLATFORM FOUNDER</span>
                        </span>
                      </>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-black tracking-wider flex items-center gap-1">
                        <Gamepad2 className="w-3 h-3" />
                        <span>VERIFIED PLAYER</span>
                      </span>
                    )}
                  </div>

                  {/* Rank Badge & Sub-labels */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400 font-medium">
                    {/* Rank Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/15 to-purple-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isOwnerUser ? 'Grandmaster / Tier Standard' : 'Competitive Tier Standard'}</span>
                    </div>

                    <span className="text-slate-600 hidden sm:inline">•</span>
                    <span className="text-slate-300 font-medium">
                      {isOwnerUser ? '#1 Verified Platform Owner' : 'Top Tier Challenger'}
                    </span>
                    <span className="text-slate-600 hidden sm:inline">•</span>
                    <span className="text-indigo-400 font-semibold font-mono">20 Games Arena</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Daily Streak Counter & Elo Score in Dual-Column Card */}
              <div className="flex items-center gap-3 sm:gap-4 shrink-0 w-full sm:w-auto justify-start sm:justify-end">
                {/* Daily Streak Counter Card */}
                <div className="flex-1 sm:flex-initial bg-[#070b14] border border-slate-800/90 hover:border-amber-500/40 rounded-xl p-3.5 sm:px-4 sm:py-3.5 flex items-center gap-3 shadow-lg transition">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Flame className="w-6 h-6 text-amber-400 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Daily Streak</div>
                    <div className="text-lg font-black text-amber-400 leading-tight font-mono">{dailyStreak} Day</div>
                    <div className="text-[9px] text-slate-500 font-medium">Consecutive login</div>
                  </div>
                </div>

                {/* Elo Score Card */}
                <div className="flex-1 sm:flex-initial bg-[#070b14] border border-slate-800/90 hover:border-indigo-500/40 rounded-xl p-3.5 sm:px-4 sm:py-3.5 flex items-center gap-3 shadow-lg relative group transition">
                  {/* Gold Crown Accent for site owner */}
                  {isOwnerUser && (
                    <div className="absolute -top-3 -right-2 text-xl filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] group-hover:rotate-12 transition-transform">
                      👑
                    </div>
                  )}
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <Trophy className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="text-left pr-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Elo Rating</div>
                    <div className="text-lg font-black text-cyan-400 leading-tight font-mono">{totalScore.toLocaleString()}</div>
                    <div className="text-[9px] text-slate-500 font-medium">Top 1% Global</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ================= 2. CAREER OVERVIEW & STAT CARDS (8 Clean Metric Cards) ================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider font-mono">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                <span>CAREER OVERVIEW &amp; PERFORMANCE METRICS</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">8 Key Performance Indicators</span>
            </div>

            {/* 8-Card Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              {/* 1. Total Games Played */}
              <div className="p-3.5 rounded-2xl bg-[#090e1c] border border-slate-800/80 hover:border-slate-700 transition space-y-1 text-left">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                  <span>TOTAL PLAYED</span>
                  <Gamepad2 className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">{totalPlayed}</div>
                <div className="text-[10px] text-slate-500 font-mono">Total career games</div>
              </div>

              {/* 2. Win Rate % */}
              <div className="p-3.5 rounded-2xl bg-[#090e1c] border border-emerald-950/40 hover:border-emerald-500/40 transition space-y-1 text-left">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                  <span>WIN RATE %</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono">{winRatePercent}%</div>
                <div className="text-[10px] text-slate-500 font-mono">{totalWins} match victories</div>
              </div>

              {/* 3. Loss Rate % */}
              <div className="p-3.5 rounded-2xl bg-[#090e1c] border border-rose-950/40 hover:border-rose-500/40 transition space-y-1 text-left">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                  <span>LOSS RATE %</span>
                  <XCircle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-rose-400 font-mono">{lossRatePercent}%</div>
                <div className="text-[10px] text-slate-500 font-mono">{totalLosses} match losses</div>
              </div>

              {/* 4. Draw Rate % */}
              <div className="p-3.5 rounded-2xl bg-[#090e1c] border border-amber-950/40 hover:border-amber-500/40 transition space-y-1 text-left">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                  <span>DRAW RATE %</span>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400 font-mono">{drawRatePercent}%</div>
                <div className="text-[10px] text-slate-500 font-mono">{totalDraws} drawn ties</div>
              </div>

              {/* 5. Total Game Time */}
              <div className="p-3.5 rounded-2xl bg-[#090e1c] border border-sky-950/40 hover:border-sky-500/40 transition space-y-1 text-left">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                  <span>TOTAL GAME TIME</span>
                  <Clock className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">{formatTime(totalTimeSec)}</div>
                <div className="text-[10px] text-slate-500 font-mono">Real-time play duration</div>
              </div>

              {/* 6. Average Match Time */}
              <div className="p-3.5 rounded-2xl bg-[#090e1c] border border-indigo-950/40 hover:border-indigo-500/40 transition space-y-1 text-left">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                  <span>AVG MATCH TIME</span>
                  <Timer className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">{formatTime(avgMatchSec)}</div>
                <div className="text-[10px] text-slate-500 font-mono">Mean session duration</div>
              </div>

              {/* 7. Resignations % */}
              <div className="p-3.5 rounded-2xl bg-[#090e1c] border border-purple-950/40 hover:border-purple-500/40 transition space-y-1 text-left">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                  <span>RESIGNATIONS %</span>
                  <AlertCircle className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-purple-400 font-mono">{resignRatePercent}%</div>
                <div className="text-[10px] text-slate-500 font-mono">Forfeits recorded</div>
              </div>

              {/* 8. Daily Streak */}
              <div className="p-3.5 rounded-2xl bg-[#090e1c] border border-amber-950/40 hover:border-amber-500/40 transition space-y-1 text-left">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                  <span>DAILY STREAK</span>
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400 font-mono">{dailyStreak} Day</div>
                <div className="text-[10px] text-slate-500 font-mono">Active login streak</div>
              </div>

            </div>
          </div>

          {/* ================= 3. GAME-WISE BREAKDOWN GRID (20 Icon Tiles) ================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider font-mono">
                <Gamepad2 className="w-4 h-4 text-amber-400" />
                <span>GAME WISE BREAKDOWN</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">20 Supported Titles</span>
            </div>

            {/* 20 Game Tiles Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {TWENTY_GAMES_METADATA.map((game) => {
                const stat = gameStatsMap[game.id] || {
                  matchesPlayed: game.defaultMatches,
                  wins: Math.round(game.defaultMatches * 0.7),
                  losses: Math.round(game.defaultMatches * 0.2),
                  draws: Math.round(game.defaultMatches * 0.1),
                  resigns: 0,
                  totalTimeSeconds: game.defaultMatches * 180,
                  earnings: 0,
                };
                const playedCount = isOwnerUser ? game.defaultMatches : stat.matchesPlayed || 0;
                const isSelected = selectedGame === game.id;

                return (
                  <div
                    key={game.id}
                    onClick={() => {
                      setSelectedGame(game.id);
                      soundFx.playMove();
                      if (onSelectGame) {
                        onSelectGame(game.id);
                      }
                    }}
                    className={`p-3 rounded-2xl bg-[#090e1c] border transition cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden ${
                      isSelected
                        ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-[#0e1628]'
                        : 'border-slate-800/80 hover:border-slate-700 hover:bg-[#0c1326]'
                    }`}
                  >
                    {/* Game Icon */}
                    <div className="w-12 h-12 rounded-xl bg-[#050810] border border-slate-800 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform shadow-inner">
                      {game.iconEmoji}
                    </div>

                    {/* Game Title */}
                    <div className="text-xs font-black text-white group-hover:text-amber-300 transition truncate w-full">
                      {game.name}
                    </div>

                    {/* Games-Played Counter */}
                    <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                      <span className="font-bold text-amber-400">{playedCount}</span>
                      <span>matches</span>
                    </div>

                    {/* Active highlight pill */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,1)]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= 4. LEADERBOARDS & LIVE ACTIVITY PANELS ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Global Leaderboard Widget */}
            <div className="bg-[#090e1c] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                      GLOBAL LEADERBOARD
                    </h4>
                  </div>
                  <span className="text-[10px] text-indigo-400 font-bold font-mono">Tier S Champions</span>
                </div>

                {/* Leaderboard Rows */}
                <div className="space-y-2">
                  {sampleLeaderboard.map((player) => (
                    <div
                      key={player.rank}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                        player.rank === 1
                          ? 'bg-amber-950/25 border-amber-500/40 text-amber-300'
                          : 'bg-[#060a14] border-slate-800/80 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono ${
                            player.rank === 1
                              ? 'bg-amber-500 text-slate-950 shadow-md'
                              : player.rank === 2
                              ? 'bg-slate-300 text-slate-950'
                              : player.rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {player.rank}
                        </div>

                        <div className="w-6 h-6 rounded-full bg-[#120716] border border-slate-700 flex items-center justify-center text-xs">
                          {player.avatar}
                        </div>

                        <div className="flex items-center gap-1.5 font-bold text-xs font-mono">
                          <span>{player.name}</span>
                          {player.isCrown && <span>👑</span>}
                          {player.isOwner && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
                          )}
                        </div>
                      </div>

                      <div className="font-mono font-black text-xs text-amber-400">
                        {player.elo.toLocaleString()} Elo
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Matches Feed Widget */}
            <div className="bg-[#090e1c] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                      RECENT MATCHES
                    </h4>
                  </div>
                  <button
                    onClick={() => soundFx.playMove()}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5 transition"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Match feed list */}
                <div className="space-y-2 text-left">
                  {sampleRecentMatches.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 font-mono text-xs italic">
                      No matches played yet
                    </div>
                  ) : (
                    sampleRecentMatches.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#060a14] border border-slate-800/80 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm">♟️</span>
                          <div>
                            <div className="font-bold text-white">vs {m.opponent}</div>
                            <div className="text-[10px] text-slate-500">{m.time} • {m.game} • {m.moves} moves</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`font-black uppercase text-[11px] ${
                              m.win
                                ? 'text-emerald-400'
                                : m.draw
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {m.outcome}
                          </span>
                          <span className="text-indigo-300 font-bold text-[11px]">{m.score}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
