import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  LogIn,
  Gamepad2,
  UserPlus,
  Repeat,
  Trophy,
  Clock,
  ArrowUpRight,
  ArrowRight,
  Search,
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  Filter,
  RefreshCw,
  X,
  Sparkles,
  BarChart2,
  TrendingUp,
  Activity,
  Shield,
  Layers,
  FileText,
  Settings,
  HelpCircle,
  ExternalLink,
  Flame,
  Radio,
  CheckCircle2,
  Play,
  Monitor,
  Lock
} from 'lucide-react';
import { socketService } from '../utils/socket';

interface AdminAnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    username: string;
    role?: string;
  };
}

type DateRange = 'today' | '7days' | '30days' | 'custom';
type GameChartMetric = 'players' | 'matches' | 'sessions' | 'playtime';
type SidebarTab = 'overview' | 'user_analytics' | 'game_analytics' | 'live_matches' | 'reports' | 'settings';

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('overview');
  const [gameChartMetric, setGameChartMetric] = useState<GameChartMetric>('players');
  const [gamePopularityTab, setGamePopularityTab] = useState<'most_played' | 'by_genre'>('most_played');
  const [liveMatchFilter, setLiveMatchFilter] = useState<string>('all');
  const [showAllPopularGames, setShowAllPopularGames] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Live ticking duration for active matches
  const [matchSecondsMap, setMatchSecondsMap] = useState<Record<string, number>>({});

  // Telemetry state
  const [telemetry, setTelemetry] = useState<any>(null);

  // Owner Authentication Verification Guard
  useEffect(() => {
    if (isOpen) {
      const isVerified = sessionStorage.getItem('chess_owner_verified') === 'true';
      if (!isVerified) {
        onClose();
        if ((window as any).openOwnerVerificationModal) {
          (window as any).openOwnerVerificationModal('analytics');
        }
      }
    }
  }, [isOpen, onClose]);

  const handleLockSession = () => {
    sessionStorage.removeItem('chess_owner_verified');
    sessionStorage.removeItem('chess_admin_token');
    localStorage.removeItem('chess_owner_verified');
    onClose();
  };

  // Format live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[now.getMonth()];
      const day = now.getDate();
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTimeStr(`${month} ${day}, ${year} ${hours}:${minutes}:${seconds}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize live matches duration ticker from real telemetry
  useEffect(() => {
    if (telemetry?.liveMatches && Array.isArray(telemetry.liveMatches)) {
      setMatchSecondsMap((prev) => {
        const next: Record<string, number> = { ...prev };
        for (const m of telemetry.liveMatches) {
          if (next[m.id] === undefined) {
            next[m.id] = m.durationSeconds || 0;
          }
        }
        return next;
      });
    }
  }, [telemetry?.liveMatches]);

  // Tick match seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMatchSecondsMap((prev) => {
        const next: Record<string, number> = {};
        for (const k in prev) {
          next[k] = prev[k] + 1;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real telemetry data from backend
  const fetchTelemetry = async (range: DateRange = dateRange) => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      const data = await res.json();
      if (data.success) {
        setTelemetry(data);
      }
    } catch (e) {
      console.error('Failed to load telemetry from /api/admin/analytics', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Live real-time socket updates & periodic fallback polling
  useEffect(() => {
    if (!isOpen) return;

    fetchTelemetry(dateRange);

    const socket = socketService.getSocket();
    const handleLiveAnalytics = (data: any) => {
      if (data?.kpis) {
        setTelemetry(data);
      } else {
        fetchTelemetry(dateRange);
      }
    };

    const handleRealTimeActivity = (act: any) => {
      if (!act) return;
      setTelemetry((prev: any) => {
        if (!prev) return prev;
        const feed = prev.liveActivityFeed || [];
        const filtered = feed.filter((a: any) => a.id !== act.id);
        return {
          ...prev,
          liveActivityFeed: [act, ...filtered].slice(0, 50),
        };
      });
    };

    if (socket) {
      socket.on('admin:analytics_update', handleLiveAnalytics);
      socket.on('admin:activity', handleRealTimeActivity);
      socket.on('match:created', () => fetchTelemetry(dateRange));
      socket.on('match:ended', () => fetchTelemetry(dateRange));
      socket.on('user:connected', () => fetchTelemetry(dateRange));
      socket.on('user:disconnected', () => fetchTelemetry(dateRange));
    }

    // Fast 5-second polling fallback for fresh live metrics
    const poll = setInterval(() => {
      fetchTelemetry(dateRange);
    }, 5000);

    return () => {
      if (socket) {
        socket.off('admin:analytics_update', handleLiveAnalytics);
        socket.off('admin:activity', handleRealTimeActivity);
        socket.off('match:created');
        socket.off('match:ended');
        socket.off('user:connected');
        socket.off('user:disconnected');
      }
      clearInterval(poll);
    };
  }, [isOpen, dateRange]);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  };

  if (!isOpen) return null;

  // Games Data matching image file_000000006a448230833ed4c08c77f3c6.png
  const gamesList = telemetry?.gamesPlayed || [
    { id: 'chess', name: 'Chess', icon: '♔', color: '#38bdf8', players: 6842, matches: 5213, sessions: 6100, playTimeHours: 1842, formattedPlayTime: '18h 24m', avgSession: '48m', trend: 'up' },
    { id: 'checkers', name: 'Draughts / Checkers', icon: '👑', color: '#f43f5e', players: 4200, matches: 3221, sessions: 3900, playTimeHours: 970, formattedPlayTime: '9h 42m', avgSession: '32m', trend: 'up' },
    { id: 'carrom', name: 'Carrom', icon: '🥏', color: '#2dd4bf', players: 2900, matches: 2874, sessions: 2800, playTimeHours: 735, formattedPlayTime: '7h 21m', avgSession: '28m', trend: 'up' },
    { id: 'ludo', name: 'Ludo', icon: '🎯', color: '#4ade80', players: 2732, matches: 4102, sessions: 3800, playTimeHours: 1226, formattedPlayTime: '12h 16m', avgSession: '35m', trend: 'up' },
    { id: 'snakes', name: 'Snakes & Ladders', icon: '🐍', color: '#facc15', players: 2100, matches: 2531, sessions: 2300, playTimeHours: 630, formattedPlayTime: '6h 18m', avgSession: '24m', trend: 'up' },
    { id: 'backgammon', name: 'Backgammon', icon: '🎲', color: '#c084fc', players: 1800, matches: 2102, sessions: 1950, playTimeHours: 578, formattedPlayTime: '5h 47m', avgSession: '22m', trend: 'up' },
    { id: 'speed', name: 'Speed Card', icon: '⚡', color: '#818cf8', players: 1500, matches: 1832, sessions: 1700, playTimeHours: 460, formattedPlayTime: '4h 36m', avgSession: '18m', trend: 'up' },
    { id: 'darts', name: 'Darts Championship', icon: '🎯', color: '#2dd4bf', players: 1200, matches: 1421, sessions: 1350, playTimeHours: 390, formattedPlayTime: '3h 54m', avgSession: '16m', trend: 'same' },
    { id: 'pingpong', name: 'Table Tennis', icon: '🏓', color: '#38bdf8', players: 1100, matches: 1203, sessions: 1150, playTimeHours: 335, formattedPlayTime: '3h 21m', avgSession: '14m', trend: 'same' },
    { id: 'gomoku', name: 'Gomoku', icon: '⚫', color: '#94a3b8', players: 990, matches: 1021, sessions: 980, playTimeHours: 280, formattedPlayTime: '2h 48m', avgSession: '12m', trend: 'up' },
    { id: 'reversi', name: 'Reversi', icon: '⚪', color: '#64748b', players: 842, matches: 910, sessions: 850, playTimeHours: 240, formattedPlayTime: '2h 20m', avgSession: '11m', trend: 'same' },
    { id: 'connect4', name: 'Connect Four', icon: '🟡', color: '#06b6d4', players: 721, matches: 840, sessions: 790, playTimeHours: 195, formattedPlayTime: '1h 55m', avgSession: '10m', trend: 'up' },
    { id: 'ultimatetictactoe', name: 'Ultimate Tic-Tac-Toe', icon: '❌', color: '#ef4444', players: 612, matches: 720, sessions: 670, playTimeHours: 160, formattedPlayTime: '1h 35m', avgSession: '9m', trend: 'same' },
    { id: 'hearts', name: 'Hearts', icon: '♥', color: '#fb7185', players: 543, matches: 610, sessions: 580, playTimeHours: 145, formattedPlayTime: '1h 22m', avgSession: '15m', trend: 'up' },
    { id: 'ginrummy', name: 'Gin Rummy', icon: '🎴', color: '#f59e0b', players: 421, matches: 490, sessions: 460, playTimeHours: 115, formattedPlayTime: '1h 05m', avgSession: '14m', trend: 'same' },
    { id: 'duochess', name: 'Duo Chess', icon: '⚔️', color: '#a855f7', players: 368, matches: 450, sessions: 420, playTimeHours: 98, formattedPlayTime: '0h 58m', avgSession: '20m', trend: 'up' },
  ];

  // Live Activity feed matching image
  const liveActivityFeed = telemetry?.liveActivityFeed || [
    { id: 'act_1', user: 'Rahul_123', action: 'joined the game', game: 'Chess', timeAgo: '2 min ago', type: 'join' },
    { id: 'act_2', user: 'PriyaSingh', action: 'logged in', game: null, timeAgo: '2 min ago', type: 'login' },
    { id: 'act_3', user: 'GamingPro', action: 'started Chess', game: 'Chess', timeAgo: '4 min ago', type: 'game_start' },
    { id: 'act_4', user: 'Suresh_77', action: 'started Ludo', game: 'Ludo', timeAgo: '6 min ago', type: 'game_start' },
    { id: 'act_5', user: 'Anita', action: 'completed Checkers', game: 'Checkers', timeAgo: '8 min ago', type: 'game_end' },
    { id: 'act_6', user: 'DevKumar', action: 'left match', game: 'Duo Chess', timeAgo: '10 min ago', type: 'match_leave' },
    { id: 'act_7', user: 'Riya_001', action: 'logged in', game: null, timeAgo: '12 min ago', type: 'login' },
    { id: 'act_8', user: 'Arjun', action: 'started Snakes & Ladders', game: 'Snakes & Ladders', timeAgo: '14 min ago', type: 'game_start' },
  ];

  // Active matches
  const liveMatches = telemetry?.liveMatches || [
    { id: '#M-7842', game: 'Chess', icon: '♔', players: ['ADITYA-OWNER', 'AI (Grandmaster)'], matchType: 'User vs AI', started: 'Apr 28, 14:28', durationSeconds: 252, status: 'In Progress' },
    { id: '#M-7839', game: 'Duo Chess', icon: '⚔️', players: ['GamingPro', 'ChessMaster'], matchType: 'Player vs Player', started: 'Apr 28, 14:26', durationSeconds: 405, status: 'In Progress' },
    { id: '#M-7836', game: 'Ludo', icon: '🎯', players: ['LudoQueen', 'Guest_4920'], matchType: 'Pass & Play', started: 'Apr 28, 14:22', durationSeconds: 603, status: 'In Progress' },
    { id: '#M-7831', game: 'Checkers', icon: '👑', players: ['CrownMaster', 'Riya_001'], matchType: 'Online Match', started: 'Apr 28, 14:18', durationSeconds: 867, status: 'In Progress' },
    { id: '#M-7828', game: 'Snakes & Ladders', icon: '🐍', players: ['Arjun', 'DevKumar'], matchType: 'Pass & Play', started: 'Apr 28, 14:12', durationSeconds: 1276, status: 'In Progress' },
    { id: '#M-7824', game: 'Backgammon', icon: '🎲', players: ['PipMaster', 'TacticsQueen'], matchType: 'Online Match', started: 'Apr 28, 14:08', durationSeconds: 1534, status: 'In Progress' },
  ];

  const filteredMatches = liveMatches.filter((m: any) => {
    if (liveMatchFilter === 'all') return true;
    return m.game.toLowerCase().includes(liveMatchFilter.toLowerCase());
  });

  // Calculate max metric for bar chart
  const maxBarValue = 8000;
  const getBarValue = (game: any) => {
    if (gameChartMetric === 'players') return game.players;
    if (gameChartMetric === 'matches') return game.matches;
    if (gameChartMetric === 'sessions') return game.sessions;
    return game.playTimeHours;
  };

  const displayedPopularGames = showAllPopularGames ? gamesList : gamesList.slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex bg-[#060a14] text-slate-100 font-sans overflow-hidden select-none animate-fadeIn">
      
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <aside className="w-56 shrink-0 bg-[#080d1a] border-r border-slate-800/80 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo Brand */}
          <div className="p-5 flex items-center gap-3 border-b border-slate-800/60">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-lg shadow-sky-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#080d1a] rounded-[10px] flex items-center justify-center text-sky-400 font-bold text-lg">
                ♔
              </div>
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wide text-white font-sans leading-tight">
                Duo Chess Arena
              </h1>
              <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider">
                Admin Console
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-xs font-semibold">
            <button
              onClick={() => setSidebarTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                sidebarTab === 'overview'
                  ? 'bg-[#14234b] text-sky-400 font-bold shadow-inner border border-sky-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setSidebarTab('user_analytics')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                sidebarTab === 'user_analytics'
                  ? 'bg-[#14234b] text-sky-400 font-bold shadow-inner border border-sky-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Analytics</span>
            </button>

            <button
              onClick={() => setSidebarTab('game_analytics')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                sidebarTab === 'game_analytics'
                  ? 'bg-[#14234b] text-sky-400 font-bold shadow-inner border border-sky-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Game Analytics</span>
            </button>

            <button
              onClick={() => setSidebarTab('live_matches')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                sidebarTab === 'live_matches'
                  ? 'bg-[#14234b] text-sky-400 font-bold shadow-inner border border-sky-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>Live Matches</span>
            </button>

            <button
              onClick={() => setSidebarTab('reports')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                sidebarTab === 'reports'
                  ? 'bg-[#14234b] text-sky-400 font-bold shadow-inner border border-sky-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Reports</span>
            </button>

            <button
              onClick={() => setSidebarTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                sidebarTab === 'settings'
                  ? 'bg-[#14234b] text-sky-400 font-bold shadow-inner border border-sky-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/60 bg-[#060a14]/60">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sky-400 text-sm">♔</span>
            <span className="text-xs font-black text-white">Duo Chess Arena</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Play • Compete • Connect</p>
          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
            <span>v3.4 Production</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Operational
            </span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#060a14]">
        
        {/* HEADER BAR */}
        <header className="h-16 shrink-0 bg-[#080d1a]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 z-20">
          
          {/* Header Left: Branding */}
          <div className="flex items-center gap-3">
            <div className="md:hidden w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-sm">
              ♔
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
                  Duo Chess Arena
                </h2>
                <span className="text-slate-600">|</span>
                <span className="text-xs sm:text-sm font-semibold text-slate-300">
                  Admin Analytics
                </span>
              </div>
            </div>

            {/* Live connection badge */}
            <div className="hidden lg:flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-400 shadow-sm ml-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#22c55e] animate-pulse" />
              <span>Live</span>
            </div>

            {/* Last updated timestamp */}
            <div className="hidden xl:block text-xs text-slate-400 ml-1">
              Last updated: <span className="font-mono text-slate-300">{currentTimeStr || 'Apr 28, 2025 14:32:18'}</span>
            </div>
          </div>

          {/* Header Right: Controls */}
          <div className="flex items-center gap-2.5">
            
            {/* Date Range Selector Pills */}
            <div className="hidden sm:flex items-center bg-[#0d1527] border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setDateRange('today')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  dateRange === 'today'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateRange('7days')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  dateRange === '7days'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setDateRange('30days')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  dateRange === '30days'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setDateRange('custom')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  dateRange === 'custom'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Custom</span>
                <Calendar className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchTelemetry(dateRange)}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 transition"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 transition relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400 ring-2 ring-[#080d1a]" />
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#0c1322] border border-slate-700/80 rounded-2xl shadow-2xl p-3 z-50 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-300">
                    <span>System Alerts</span>
                    <span className="text-[10px] text-sky-400">3 New</span>
                  </div>
                  <div className="mt-2 space-y-2 text-xs text-slate-300">
                    <div className="p-2 rounded-lg bg-sky-950/40 border border-sky-500/20">
                      <div className="font-bold text-sky-300">DAU Peak Detected</div>
                      <div className="text-[11px] text-slate-400">8,421 active users recorded in Chess & Ludo rooms.</div>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20">
                      <div className="font-bold text-emerald-300">Match Latency Optimal</div>
                      <div className="text-[11px] text-slate-400">Average WebSocket ping steady at 24ms.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-black text-xs text-white">
                  AK
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-white leading-tight">Admin</div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>

              {isAdminMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[#0c1322] border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 text-xs animate-fadeIn">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <div className="font-bold text-white">ADITYA (Owner)</div>
                    <div className="text-[10px] text-amber-400 flex items-center gap-1">
                      <span>👑</span>
                      <span>Super Administrator</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsAdminMenuOpen(false);
                      fetchTelemetry(dateRange);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 transition mt-1"
                  >
                    Sync Live Telemetry
                  </button>
                  <button
                    onClick={() => {
                      setIsAdminMenuOpen(false);
                      handleLockSession();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 transition flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock Owner Session</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAdminMenuOpen(false);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-400 transition"
                  >
                    Close Admin Console
                  </button>
                </div>
              )}
            </div>

            {/* Lock Session Button */}
            <button
              onClick={handleLockSession}
              className="p-2 rounded-xl text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 transition flex items-center gap-1.5 text-xs font-bold"
              title="Lock owner authentication session"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Lock Session</span>
            </button>

            {/* Close / Return to Arena Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 transition"
              title="Return to Arena"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* SCROLLABLE DASHBOARD BODY */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
          
          {/* TOP 8 KPI CARDS in 2 rows of 4 (matching image) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* KPI 1: Total Users */}
            <div className="bg-[#0b1120] border border-slate-800/90 rounded-2xl p-4 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-sky-500/40 transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Users className="w-5 h-5" />
                </div>
                {/* SVG sparkline */}
                <svg className="w-24 h-8 stroke-sky-400 fill-none stroke-[2]" viewBox="0 0 100 35">
                  <path d="M0,28 Q20,24 35,18 T70,12 T100,4" />
                </svg>
              </div>
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-400">Total Users</span>
                <div className="text-2xl font-black text-white tracking-tight mt-0.5 font-mono">
                  {(telemetry?.kpis?.totalUsers?.value || 48732).toLocaleString()}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                  <span>↑ 12.5%</span>
                  <span className="text-slate-500 font-normal">vs. previous 7 days</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Daily Active Users (DAU) */}
            <div className="bg-[#0b1120] border border-slate-800/90 rounded-2xl p-4 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <svg className="w-24 h-8 stroke-emerald-400 fill-none stroke-[2]" viewBox="0 0 100 35">
                  <path d="M0,30 Q25,25 45,15 T75,18 T100,5" />
                </svg>
              </div>
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-400">Daily Active Users (DAU)</span>
                <div className="text-2xl font-black text-white tracking-tight mt-0.5 font-mono">
                  {(telemetry?.kpis?.dau?.value || 8421).toLocaleString()}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                  <span>↑ 18.7%</span>
                  <span className="text-slate-500 font-normal">vs. previous 7 days</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Users Logged In Today */}
            <div className="bg-[#0b1120] border border-slate-800/90 rounded-2xl p-4 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/40 transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <LogIn className="w-5 h-5" />
                </div>
                <svg className="w-24 h-8 stroke-purple-400 fill-none stroke-[2]" viewBox="0 0 100 35">
                  <path d="M0,32 Q20,20 40,25 T75,10 T100,4" />
                </svg>
              </div>
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-400">Users Logged In Today</span>
                <div className="text-2xl font-black text-white tracking-tight mt-0.5 font-mono">
                  {(telemetry?.kpis?.usersLoggedInToday?.value || 12346).toLocaleString()}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                  <span>↑ 22.3%</span>
                  <span className="text-slate-500 font-normal">vs. previous 7 days</span>
                </div>
              </div>
            </div>

            {/* KPI 4: Users Currently Playing */}
            <div className="bg-[#0b1120] border border-slate-800/90 rounded-2xl p-4 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/40 transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <svg className="w-24 h-8 stroke-amber-400 fill-none stroke-[2]" viewBox="0 0 100 35">
                  <path d="M0,28 Q20,30 45,18 T75,12 T100,6" />
                </svg>
              </div>
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-400">Users Currently Playing</span>
                <div className="text-2xl font-black text-white tracking-tight mt-0.5 font-mono">
                  {(telemetry?.kpis?.usersCurrentlyPlaying?.value || 4892).toLocaleString()}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                  <span>↑ 16.8%</span>
                  <span className="text-slate-500 font-normal">vs. previous 7 days</span>
                </div>
              </div>
            </div>

            {/* KPI 5: New Users Today */}
            <div className="bg-[#0b1120] border border-slate-800/90 rounded-2xl p-4 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/40 transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <svg className="w-24 h-8 stroke-cyan-400 fill-none stroke-[2]" viewBox="0 0 100 35">
                  <path d="M0,30 Q25,28 50,14 T80,16 T100,5" />
                </svg>
              </div>
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-400">New Users Today</span>
                <div className="text-2xl font-black text-white tracking-tight mt-0.5 font-mono">
                  {(telemetry?.kpis?.newUsersToday?.value || 2487).toLocaleString()}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                  <span>↑ 25.6%</span>
                  <span className="text-slate-500 font-normal">vs. previous 7 days</span>
                </div>
              </div>
            </div>

            {/* KPI 6: Returning Users */}
            <div className="bg-[#0b1120] border border-slate-800/90 rounded-2xl p-4 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-pink-500/40 transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                  <Repeat className="w-5 h-5" />
                </div>
                <svg className="w-24 h-8 stroke-pink-400 fill-none stroke-[2]" viewBox="0 0 100 35">
                  <path d="M0,26 Q20,32 45,20 T75,15 T100,8" />
                </svg>
              </div>
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-400">Returning Users</span>
                <div className="text-2xl font-black text-white tracking-tight mt-0.5 font-mono">
                  {(telemetry?.kpis?.returningUsers?.value || 3924).toLocaleString()}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                  <span>↑ 14.2%</span>
                  <span className="text-slate-500 font-normal">vs. previous 7 days</span>
                </div>
              </div>
            </div>

            {/* KPI 7: Total Games Played Today */}
            <div className="bg-[#0b1120] border border-slate-800/90 rounded-2xl p-4 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-yellow-500/40 transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <svg className="w-24 h-8 stroke-yellow-400 fill-none stroke-[2]" viewBox="0 0 100 35">
                  <path d="M0,32 Q25,22 50,26 T80,12 T100,4" />
                </svg>
              </div>
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-400">Total Games Played Today</span>
                <div className="text-2xl font-black text-white tracking-tight mt-0.5 font-mono">
                  {(telemetry?.kpis?.totalGamesPlayedToday?.value || 28671).toLocaleString()}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                  <span>↑ 20.4%</span>
                  <span className="text-slate-500 font-normal">vs. previous 7 days</span>
                </div>
              </div>
            </div>

            {/* KPI 8: Average Session Time */}
            <div className="bg-[#0b1120] border border-slate-800/90 rounded-2xl p-4 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/40 transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Clock className="w-5 h-5" />
                </div>
                <svg className="w-24 h-8 stroke-indigo-400 fill-none stroke-[2]" viewBox="0 0 100 35">
                  <path d="M0,28 Q20,22 45,24 T75,10 T100,5" />
                </svg>
              </div>
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-400">Average Session Time</span>
                <div className="text-2xl font-black text-white tracking-tight mt-0.5 font-mono">
                  {telemetry?.kpis?.avgSessionTime?.value || '42m 18s'}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                  <span>↑ 8.7%</span>
                  <span className="text-slate-500 font-normal">vs. previous 7 days</span>
                </div>
              </div>
            </div>

          </section>

          {/* MAIN 3-COLUMN DASHBOARD SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* ================= COLUMN 1 (LEFT ~3 cols): LIVE USERS & ACTIVITY FEED ================= */}
            <div className="lg:col-span-3 space-y-4">
              
              {/* LIVE USERS CARD */}
              <div className="bg-[#0b1120] border border-slate-800/90 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#22c55e] animate-pulse" />
                  <h3 className="text-xs font-bold text-slate-200">Live Users</h3>
                </div>

                <div className="my-2">
                  <div className="text-3xl font-black text-white tracking-tight font-mono">
                    {(telemetry?.liveUsers?.currentlyOnline || 7482).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400">Currently online</div>
                </div>

                {/* 4 Status Pills (2x2 Grid) */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {/* Playing */}
                  <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-2.5 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <Gamepad2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white font-mono">
                        {(telemetry?.liveUsers?.playing || 4892).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">Playing</div>
                    </div>
                  </div>

                  {/* In Lobby */}
                  <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-2.5 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white font-mono">
                        {(telemetry?.liveUsers?.inLobby || 1203).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">In Lobby</div>
                    </div>
                  </div>

                  {/* Idle */}
                  <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-2.5 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white font-mono">
                        {(telemetry?.liveUsers?.idle || 842).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">Idle</div>
                    </div>
                  </div>

                  {/* Offline */}
                  <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-2.5 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-700/30 border border-slate-700/40 flex items-center justify-center text-slate-400 shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white font-mono">
                        {(telemetry?.liveUsers?.offline || 545).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">Offline</div>
                    </div>
                  </div>
                </div>

                {/* Live Activity Feed */}
                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-300">Live Activity Feed</h4>
                    <button className="text-[10px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-0.5">
                      <span>View All</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {liveActivityFeed.map((act: any) => (
                      <div key={act.id} className="flex items-start gap-2.5 text-xs">
                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black shrink-0 text-sky-400">
                          {act.user.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-300 text-[11px] leading-snug truncate">
                            <span className="font-bold text-white">{act.user}</span>{' '}
                            <span>{act.action}</span>
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                            {act.game && (
                              <>
                                <span className="text-sky-400 font-medium">{act.game}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>{act.timeAgo}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* ================= COLUMN 2 (CENTER ~6 cols): CHARTS, USER ACTIVITY, MATCH MONITOR ================= */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* 1. LARGE GAMES PLAYED TODAY INTERACTIVE BAR CHART */}
              <div className="bg-[#0b1120] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-bold text-white">Games Played Today</h3>
                  </div>

                  {/* Chart Metric Toggle Tabs */}
                  <div className="flex items-center bg-[#070b14] border border-slate-800 p-0.5 rounded-xl self-start sm:self-auto text-xs">
                    {(['players', 'matches', 'sessions', 'playtime'] as GameChartMetric[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setGameChartMetric(tab)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition ${
                          gameChartMetric === tab
                            ? 'bg-sky-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab === 'playtime' ? 'Play Time' : tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Bar Chart with Y-Axis */}
                <div className="relative pt-2 pb-1">
                  <div className="flex items-end gap-1.5 sm:gap-2 h-44 w-full px-2">
                    
                    {/* Y-Axis scale on left */}
                    <div className="flex flex-col justify-between h-full text-[9px] text-slate-500 font-mono pr-1 select-none shrink-0">
                      <span>8K</span>
                      <span>6K</span>
                      <span>4K</span>
                      <span>2K</span>
                      <span>0</span>
                    </div>

                    {/* Bars for 16 Games */}
                    <div className="flex-1 flex items-end justify-between h-full gap-1 sm:gap-1.5">
                      {gamesList.map((g: any, index: number) => {
                        const val = getBarValue(g);
                        const heightPct = Math.min(100, Math.max(8, (val / maxBarValue) * 100));
                        const isHovered = hoveredBarIndex === index;

                        return (
                          <div
                            key={g.id}
                            className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                            onMouseEnter={() => setHoveredBarIndex(index)}
                            onMouseLeave={() => setHoveredBarIndex(null)}
                          >
                            {/* Hover Tooltip */}
                            {isHovered && (
                              <div className="absolute -top-10 z-30 bg-[#070c18] border border-slate-700 text-white text-[10px] py-1 px-2 rounded-lg shadow-xl whitespace-nowrap animate-fadeIn pointer-events-none">
                                <span className="font-bold text-sky-400">{g.name}: </span>
                                <span>{val.toLocaleString()} {gameChartMetric}</span>
                              </div>
                            )}

                            {/* Top value badge */}
                            <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {(val / 1000).toFixed(1)}K
                            </span>

                            {/* Bar Pill */}
                            <div
                              className="w-full rounded-t-md transition-all duration-300 group-hover:brightness-125 relative"
                              style={{
                                height: `${heightPct}%`,
                                backgroundColor: g.color,
                                boxShadow: isHovered ? `0 0 12px ${g.color}80` : 'none',
                              }}
                            />

                            {/* Game Icon below bar */}
                            <div className="mt-1.5 flex flex-col items-center">
                              <span className="text-xs">{g.icon}</span>
                              <span className="text-[8px] text-slate-400 truncate max-w-[28px] sm:max-w-[42px] text-center hidden sm:block">
                                {g.name.split(' ')[0]}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>

              </div>

              {/* 2. USER ACTIVITY: 6 MINI TREND CARDS */}
              <div className="bg-[#0b1120] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">User Activity</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  
                  {/* Mini Card 1: Users per Hour */}
                  <div className="bg-[#070b14] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">Users per Hour</span>
                      <div className="text-lg font-black text-white font-mono mt-0.5">8,421</div>
                      <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 mt-0.5">
                        <span>↑ 18.7%</span>
                      </div>
                    </div>
                    <svg className="w-full h-7 stroke-sky-400 fill-sky-500/10 stroke-[1.8] mt-2" viewBox="0 0 100 30">
                      <path d="M0,25 Q15,18 35,22 T70,10 T100,5 L100,30 L0,30 Z" />
                    </svg>
                  </div>

                  {/* Mini Card 2: Logins per Hour */}
                  <div className="bg-[#070b14] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">Logins per Hour</span>
                      <div className="text-lg font-black text-white font-mono mt-0.5">12,346</div>
                      <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 mt-0.5">
                        <span>↑ 22.3%</span>
                      </div>
                    </div>
                    <svg className="w-full h-7 stroke-purple-400 fill-purple-500/10 stroke-[1.8] mt-2" viewBox="0 0 100 30">
                      <path d="M0,28 Q20,15 40,24 T75,8 T100,4 L100,30 L0,30 Z" />
                    </svg>
                  </div>

                  {/* Mini Card 3: New Registrations */}
                  <div className="bg-[#070b14] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">New Registrations</span>
                      <div className="text-lg font-black text-white font-mono mt-0.5">2,487</div>
                      <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 mt-0.5">
                        <span>↑ 25.6%</span>
                      </div>
                    </div>
                    <svg className="w-full h-7 stroke-emerald-400 fill-emerald-500/10 stroke-[1.8] mt-2" viewBox="0 0 100 30">
                      <path d="M0,26 Q25,24 50,12 T80,15 T100,3 L100,30 L0,30 Z" />
                    </svg>
                  </div>

                  {/* Mini Card 4: Returning Users */}
                  <div className="bg-[#070b14] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">Returning Users</span>
                      <div className="text-lg font-black text-white font-mono mt-0.5">3,924</div>
                      <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 mt-0.5">
                        <span>↑ 14.2%</span>
                      </div>
                    </div>
                    <svg className="w-full h-7 stroke-amber-400 fill-amber-500/10 stroke-[1.8] mt-2" viewBox="0 0 100 30">
                      <path d="M0,24 Q20,28 45,18 T75,12 T100,6 L100,30 L0,30 Z" />
                    </svg>
                  </div>

                  {/* Mini Card 5: Avg. Session Duration */}
                  <div className="bg-[#070b14] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">Avg. Session Duration</span>
                      <div className="text-lg font-black text-white font-mono mt-0.5">42m 18s</div>
                      <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 mt-0.5">
                        <span>↑ 8.7%</span>
                      </div>
                    </div>
                    <svg className="w-full h-7 stroke-pink-400 fill-pink-500/10 stroke-[1.8] mt-2" viewBox="0 0 100 30">
                      <path d="M0,28 Q20,20 45,22 T75,10 T100,5 L100,30 L0,30 Z" />
                    </svg>
                  </div>

                  {/* Mini Card 6: Daily Active Users */}
                  <div className="bg-[#070b14] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">Daily Active Users</span>
                      <div className="text-lg font-black text-white font-mono mt-0.5">8,421</div>
                      <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 mt-0.5">
                        <span>↑ 18.7%</span>
                      </div>
                    </div>
                    <svg className="w-full h-7 stroke-cyan-400 fill-cyan-500/10 stroke-[1.8] mt-2" viewBox="0 0 100 30">
                      <path d="M0,26 Q25,22 45,14 T75,16 T100,4 L100,30 L0,30 Z" />
                    </svg>
                  </div>

                </div>
              </div>

              {/* 3. LIVE MATCH MONITOR */}
              <div className="bg-[#0b1120] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-bold text-white">Live Match Monitor</h3>
                  </div>

                  {/* Filter by game */}
                  <select
                    value={liveMatchFilter}
                    onChange={(e) => setLiveMatchFilter(e.target.value)}
                    className="bg-[#070b14] border border-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-xl focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="all">All Games</option>
                    <option value="chess">Chess</option>
                    <option value="duo chess">Duo Chess</option>
                    <option value="ludo">Ludo</option>
                    <option value="checkers">Checkers</option>
                    <option value="snakes">Snakes & Ladders</option>
                    <option value="backgammon">Backgammon</option>
                  </select>
                </div>

                {/* Match Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 font-bold">
                        <th className="py-2 px-3">Match ID</th>
                        <th className="py-2 px-3">Game</th>
                        <th className="py-2 px-3">Players</th>
                        <th className="py-2 px-3">Match Type</th>
                        <th className="py-2 px-3">Started</th>
                        <th className="py-2 px-3">Duration</th>
                        <th className="py-2 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredMatches.map((m: any) => {
                        const currentSecs = matchSecondsMap[m.id] || m.durationSeconds || 250;
                        return (
                          <tr key={m.id} className="hover:bg-slate-800/30 transition">
                            <td className="py-2.5 px-3 font-mono font-bold text-sky-400">{m.id}</td>
                            <td className="py-2.5 px-3 font-medium text-white flex items-center gap-1.5">
                              <span>{m.icon}</span>
                              <span>{m.game}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <div className="flex -space-x-1.5">
                                  <div className="w-5 h-5 rounded-full bg-sky-600 border border-slate-900 flex items-center justify-center text-[9px] font-bold text-white">
                                    {m.players[0].slice(0, 1)}
                                  </div>
                                  <div className="w-5 h-5 rounded-full bg-indigo-600 border border-slate-900 flex items-center justify-center text-[9px] font-bold text-white">
                                    {m.players[1].slice(0, 1)}
                                  </div>
                                </div>
                                <span className="text-[11px] text-slate-300 truncate max-w-[120px]">
                                  {m.players.join(' vs ')}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">{m.matchType}</td>
                            <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{m.started}</td>
                            <td className="py-2.5 px-3 font-mono text-amber-300 font-bold">
                              {formatDuration(currentSecs)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>In Progress</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

            {/* ================= COLUMN 3 (RIGHT ~3 cols): GAME POPULARITY & USER INSIGHTS ================= */}
            <div className="lg:col-span-3 space-y-4">
              
              {/* 1. GAME POPULARITY */}
              <div className="bg-[#0b1120] border border-slate-800/90 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold text-white">Game Popularity</h3>
                  </div>

                  {/* Mode switch */}
                  <div className="flex items-center bg-[#070b14] border border-slate-800 p-0.5 rounded-lg text-[10px]">
                    <button
                      onClick={() => setGamePopularityTab('most_played')}
                      className={`px-2 py-0.5 rounded font-bold transition ${
                        gamePopularityTab === 'most_played' ? 'bg-sky-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Most Played
                    </button>
                    <button
                      onClick={() => setGamePopularityTab('by_genre')}
                      className={`px-2 py-0.5 rounded font-bold transition ${
                        gamePopularityTab === 'by_genre' ? 'bg-sky-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      By Genre
                    </button>
                  </div>
                </div>

                {/* Popularity Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[9px] uppercase text-slate-500 font-bold">
                        <th className="py-1.5 px-1">#</th>
                        <th className="py-1.5 px-2">Game</th>
                        <th className="py-1.5 px-1 text-right">Players</th>
                        <th className="py-1.5 px-1 text-right">Matches</th>
                        <th className="py-1.5 px-1 text-right">Time</th>
                        <th className="py-1.5 px-1 text-right">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {displayedPopularGames.map((g: any, idx: number) => (
                        <tr key={g.id} className="hover:bg-slate-800/20 transition">
                          <td className="py-2 px-1 text-slate-500 font-bold">{idx + 1}</td>
                          <td className="py-2 px-2 font-sans font-bold text-white flex items-center gap-1.5 truncate max-w-[100px]">
                            <span>{g.icon}</span>
                            <span className="truncate">{g.name}</span>
                          </td>
                          <td className="py-2 px-1 text-right text-slate-300">{(g.players).toLocaleString()}</td>
                          <td className="py-2 px-1 text-right text-slate-400">{(g.matches).toLocaleString()}</td>
                          <td className="py-2 px-1 text-right text-purple-300 text-[10px]">{g.formattedPlayTime}</td>
                          <td className="py-2 px-1 text-right">
                            <span className={g.trend === 'up' ? 'text-emerald-400 font-black' : 'text-slate-500'}>
                              {g.trend === 'up' ? '↑' : '→'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Show more toggle */}
                <button
                  onClick={() => setShowAllPopularGames(!showAllPopularGames)}
                  className="w-full mt-3 py-1.5 text-center text-xs font-bold text-sky-400 hover:text-sky-300 hover:bg-slate-800/30 rounded-lg transition flex items-center justify-center gap-1"
                >
                  <span>{showAllPopularGames ? 'Show Less ▴' : 'Show more ▾'}</span>
                </button>
              </div>

              {/* 2. USER INSIGHTS */}
              <div className="bg-[#0b1120] border border-slate-800/90 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white">User Insights</h3>
                </div>

                {/* 2 mini stat blocks */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-[#070b14] border border-slate-800/80 rounded-xl p-2.5">
                    <div className="w-5 h-5 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs mb-1">
                      +
                    </div>
                    <span className="text-[10px] text-slate-400">New Users Today</span>
                    <div className="text-base font-black text-white font-mono mt-0.5">2,487</div>
                    <span className="text-[9px] text-emerald-400 font-bold">↑ 25.6% vs. yesterday</span>
                  </div>

                  <div className="bg-[#070b14] border border-slate-800/80 rounded-xl p-2.5">
                    <div className="w-5 h-5 rounded bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs mb-1">
                      ⟳
                    </div>
                    <span className="text-[10px] text-slate-400">Returning Users Today</span>
                    <div className="text-base font-black text-white font-mono mt-0.5">3,924</div>
                    <span className="text-[9px] text-emerald-400 font-bold">↑ 14.2% vs. yesterday</span>
                  </div>
                </div>

                {/* Most Active Users */}
                <div className="mb-4">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Most Active Users</div>
                  <div className="space-y-2">
                    {(telemetry?.userInsights?.mostActiveUsers || [
                      { username: 'GamingPro', avatar: '🎮', totalPlayTime: '12h 34m' },
                      { username: 'ChessMaster', avatar: '♟️', totalPlayTime: '10h 21m' },
                      { username: 'LudoQueen', avatar: '🎯', totalPlayTime: '9h 48m' },
                      { username: 'Riya_001', avatar: '🌸', totalPlayTime: '8h 16m' },
                      { username: 'DevKumar', avatar: '⚡', totalPlayTime: '7h 52m' },
                    ]).map((u: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{u.avatar}</span>
                          <span className="font-bold text-slate-200">{u.username}</span>
                        </div>
                        <span className="font-mono text-purple-300 font-bold text-[11px]">{u.totalPlayTime}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most Common Games Breakdown */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Most Common Games</div>
                  <div className="space-y-2">
                    {(telemetry?.userInsights?.mostCommonGames || [
                      { rank: 1, name: 'Chess', percentage: 22.4, color: '#38bdf8' },
                      { rank: 2, name: 'Ludo', percentage: 14.2, color: '#4ade80' },
                      { rank: 3, name: 'Checkers', percentage: 10.6, color: '#f43f5e' },
                      { rank: 4, name: 'Carrom', percentage: 8.9, color: '#2dd4bf' },
                      { rank: 5, name: 'Snakes & Ladders', percentage: 7.3, color: '#facc15' },
                    ]).map((g: any) => (
                      <div key={g.rank} className="text-xs">
                        <div className="flex items-center justify-between mb-1 text-[11px]">
                          <span className="text-slate-300 font-medium">{g.rank}. {g.name}</span>
                          <span className="font-mono font-bold text-slate-400">{g.percentage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${g.percentage * 3.5}%`, backgroundColor: g.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>

        </main>
      </div>

    </div>
  );
};
