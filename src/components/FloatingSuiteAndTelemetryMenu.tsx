import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  BarChart2,
  Cloud,
  CloudUpload,
  CloudDownload,
  Users,
  Wifi,
  Radio,
  Gamepad,
  Award,
  ChevronUp,
  ChevronDown,
  X,
  Sparkles,
  Maximize2,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  Tv,
  CheckCircle2,
  AlertCircle,
  Move,
  Layers
} from 'lucide-react';
import { auth, onAuthStateChanged, User, saveUserDataToCloud, loadUserDataFromCloud } from '../lib/firebase';
import { telemetryEngine } from '../utils/telemetryEngine';
import { soundFx } from '../utils/audio';

interface FloatingSuiteAndTelemetryMenuProps {
  onOpenTelemetryTab: (tab: 'charts' | 'spectator' | 'network' | 'rivalry' | 'alerts' | 'roster' | 'regional' | 'badges') => void;
  onOpenGoogleTab: (tab: 'profile' | 'cloud' | 'controller' | 'achievements' | 'setup') => void;
  onOpenGoogleForms?: () => void;
  onRestoreLocalData?: (cloudData: any) => void;
  getLocalDataToBackup?: () => Record<string, any>;
}

export const FloatingSuiteAndTelemetryMenu: React.FC<FloatingSuiteAndTelemetryMenuProps> = ({
  onOpenTelemetryTab,
  onOpenGoogleTab,
  onOpenGoogleForms,
  onRestoreLocalData,
  getLocalDataToBackup,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'google'>('telemetry');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right'>('bottom-right');
  const [googleUser, setGoogleUser] = useState<User | null>(auth.currentUser);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [pingMs, setPingMs] = useState<number>(24);
  const [isQuickSyncing, setIsQuickSyncing] = useState<boolean>(false);
  const [quickSyncNotice, setQuickSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setGoogleUser(u);
    });

    const updateMetrics = () => {
      const activeUsers = telemetryEngine.getAllUsers();
      const online = activeUsers.filter((u) => u.onlineStatus === 'In Match' || u.onlineStatus === 'In Lobby').length;
      setOnlineCount(online);
      
      const pingData = telemetryEngine.getNetworkLatencyData();
      const avg = pingData.length > 0 ? Math.round(pingData.reduce((acc, p) => acc + p.pingMs, 0) / pingData.length) : 24;
      setPingMs(avg);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 4000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const handleQuickCloudSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!googleUser) {
      onOpenGoogleTab('cloud');
      return;
    }
    setIsQuickSyncing(true);
    setQuickSyncNotice('Backing up data...');
    try {
      const snapshot = getLocalDataToBackup ? getLocalDataToBackup() : {
        savedAt: new Date().toISOString(),
        localStorageDump: { ...localStorage }
      };
      const ok = await saveUserDataToCloud(googleUser.uid, snapshot);
      if (ok) {
        setQuickSyncNotice('Cloud save complete!');
        soundFx.playMove();
        setTimeout(() => setQuickSyncNotice(null), 3000);
      } else {
        setQuickSyncNotice('Backup failed');
        setTimeout(() => setQuickSyncNotice(null), 3000);
      }
    } catch {
      setQuickSyncNotice('Error backing up');
      setTimeout(() => setQuickSyncNotice(null), 3000);
    } finally {
      setIsQuickSyncing(false);
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-20 left-4 sm:left-6';
      case 'top-right':
        return 'top-20 right-4 sm:right-6';
      case 'bottom-right':
      default:
        return 'bottom-20 right-4 sm:right-6';
    }
  };

  return (
    <div
      id="floating-suite-telemetry-widget"
      className={`fixed z-40 transition-all duration-300 font-sans ${getPositionClasses()}`}
    >
      {/* Minimized Floating Pill */}
      {!isExpanded ? (
        <div
          onClick={() => {
            setIsExpanded(true);
            soundFx.playMove();
          }}
          className="group cursor-pointer flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-950/90 border border-sky-500/40 hover:border-sky-400 backdrop-blur-xl shadow-[0_0_25px_rgba(14,165,233,0.35)] hover:shadow-[0_0_35px_rgba(14,165,233,0.6)] transition-all hover:scale-105 select-none"
        >
          {/* Telemetry Live Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{onlineCount} Live</span>
          </div>

          {/* Network Ping */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>{pingMs}ms</span>
          </div>

          {/* Google Suite Icon Badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="hidden md:inline">G-Suite</span>
          </div>

          <div className="p-1 rounded-lg bg-sky-500/20 text-sky-300 group-hover:bg-sky-500 group-hover:text-slate-950 transition">
            <ChevronUp className="w-4 h-4" />
          </div>
        </div>
      ) : (
        /* Expanded Floating UI Menu */
        <div className="w-[340px] sm:w-[390px] rounded-3xl bg-[#070d1a]/95 border border-sky-500/50 backdrop-blur-2xl shadow-[0_0_50px_rgba(14,165,233,0.3)] text-slate-100 overflow-hidden flex flex-col animate-scaleUp">
          
          {/* Header Bar */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 via-sky-950/60 to-slate-900 border-b border-sky-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-sky-300 uppercase tracking-wider font-mono">
                  Suite & Telemetry HUD
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {onlineCount} Online
                  </span>
                  <span>•</span>
                  <span>{pingMs}ms Ping</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Position Switcher */}
              <button
                title="Cycle dock position"
                onClick={() => {
                  setPosition((prev) =>
                    prev === 'bottom-right'
                      ? 'bottom-left'
                      : prev === 'bottom-left'
                      ? 'top-right'
                      : 'bottom-right'
                  );
                }}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <Move className="w-3.5 h-3.5" />
              </button>
              
              {/* Minimize */}
              <button
                title="Minimize Floating Menu"
                onClick={() => {
                  setIsExpanded(false);
                  soundFx.playMove();
                }}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Tab Selector */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-950 border-b border-slate-800/80 gap-1">
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'telemetry'
                  ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Telemetry & Ops
            </button>
            <button
              onClick={() => setActiveTab('google')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'google'
                  ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Google Suite
            </button>
          </div>

          {/* Quick Sync Notice Alert */}
          {quickSyncNotice && (
            <div className="px-4 py-2 bg-sky-950/80 border-b border-sky-500/30 text-xs font-mono text-sky-300 flex items-center justify-between">
              <span>{quickSyncNotice}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          )}

          {/* Content Area */}
          <div className="p-3.5 space-y-3 max-h-[360px] overflow-y-auto scrollbar-thin">
            {activeTab === 'telemetry' ? (
              <div className="space-y-3">
                {/* Live Telemetry Action Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenTelemetryTab('charts')}
                    className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-sky-950/50 border border-slate-800 hover:border-sky-500/50 text-left transition flex flex-col gap-1 group"
                  >
                    <div className="flex items-center justify-between text-sky-400">
                      <BarChart2 className="w-4 h-4" />
                      <span className="text-[10px] font-mono text-slate-500 group-hover:text-sky-300">Live</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white">Data Charts</span>
                    <span className="text-[10px] text-slate-400">Concurrency & Velocity</span>
                  </button>

                  <button
                    onClick={() => onOpenTelemetryTab('spectator')}
                    className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-500/50 text-left transition flex flex-col gap-1 group"
                  >
                    <div className="flex items-center justify-between text-purple-400">
                      <Tv className="w-4 h-4" />
                      <span className="text-[10px] font-mono text-purple-400 animate-pulse">Stream</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white">Spectator Hub</span>
                    <span className="text-[10px] text-slate-400">Watch Live Matches</span>
                  </button>

                  <button
                    onClick={() => onOpenTelemetryTab('network')}
                    className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-500/50 text-left transition flex flex-col gap-1 group"
                  >
                    <div className="flex items-center justify-between text-emerald-400">
                      <Wifi className="w-4 h-4" />
                      <span className="text-[10px] font-mono text-emerald-400">{pingMs}ms</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white">Ping Heatmap</span>
                    <span className="text-[10px] text-slate-400">14 Edge Relay Nodes</span>
                  </button>

                  <button
                    onClick={() => onOpenTelemetryTab('regional')}
                    className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-amber-950/50 border border-slate-800 hover:border-amber-500/50 text-left transition flex flex-col gap-1 group"
                  >
                    <div className="flex items-center justify-between text-amber-400">
                      <Globe className="w-4 h-4" />
                      <span className="text-[10px] font-mono text-amber-400">Global</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white">Density Map</span>
                    <span className="text-[10px] text-slate-400">Player Geo Heatmap</span>
                  </button>

                  <button
                    onClick={() => onOpenTelemetryTab('rivalry')}
                    className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-red-950/50 border border-slate-800 hover:border-red-500/50 text-left transition flex flex-col gap-1 group"
                  >
                    <div className="flex items-center justify-between text-red-400">
                      <Activity className="w-4 h-4" />
                      <span className="text-[10px] font-mono text-slate-500 group-hover:text-red-300">Matrix</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white">Elo & Rivalry</span>
                    <span className="text-[10px] text-slate-400">Win Curves & Matchups</span>
                  </button>

                  <button
                    onClick={() => onOpenTelemetryTab('roster')}
                    className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/50 text-left transition flex flex-col gap-1 group"
                  >
                    <div className="flex items-center justify-between text-indigo-400">
                      <Users className="w-4 h-4" />
                      <span className="text-[10px] font-mono text-indigo-400">{onlineCount}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white">Online Roster</span>
                    <span className="text-[10px] text-slate-400">Live Global Directory</span>
                  </button>
                </div>

                {/* Quick Telemetry Exports */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      telemetryEngine.exportTelemetryCSV();
                      soundFx.playMove();
                    }}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5 border border-slate-800"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
                  </button>

                  <button
                    onClick={() => {
                      telemetryEngine.exportTelemetryJSON();
                      soundFx.playMove();
                    }}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5 border border-slate-800"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" /> JSON Logs
                  </button>

                  <button
                    onClick={() => onOpenTelemetryTab('charts')}
                    className="p-2 rounded-xl bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-slate-950 transition border border-sky-500/40"
                    title="Open Full Telemetry Dashboard"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Google Suite Tab */
              <div className="space-y-3">
                {/* Account Status Card */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {googleUser?.photoURL ? (
                      <img
                        src={googleUser.photoURL}
                        alt="Google User"
                        className="w-9 h-9 rounded-full border border-blue-400"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300">
                        <Cloud className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-white">
                        {googleUser?.displayName || (googleUser ? 'Google Player' : 'Google Account')}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {googleUser ? googleUser.email : 'Not connected'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                      googleUser
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {googleUser ? 'LINKED' : 'UNLINKED'}
                  </span>
                </div>

                {/* Google Suite Actions Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleQuickCloudSave}
                    disabled={isQuickSyncing}
                    className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-blue-950/50 border border-slate-800 hover:border-blue-500/50 text-left transition flex flex-col gap-1 group"
                  >
                    <div className="flex items-center justify-between text-blue-400">
                      <CloudUpload className="w-4 h-4" />
                      <span className="text-[10px] font-mono text-blue-400">Save</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white">Cloud Save</span>
                    <span className="text-[10px] text-slate-400">Firestore Snapshot</span>
                  </button>

                  <button
                    onClick={() => onOpenGoogleTab('cloud')}
                    className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-sky-950/50 border border-slate-800 hover:border-sky-500/50 text-left transition flex flex-col gap-1 group"
                  >
                    <div className="flex items-center justify-between text-sky-400">
                      <CloudDownload className="w-4 h-4" />
                      <span className="text-[10px] font-mono text-sky-400">Sync</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white">Cloud Restore</span>
                    <span className="text-[10px] text-slate-400">Cross-Device Sync</span>
                  </button>

                  <button
                    onClick={() => onOpenGoogleTab('profile')}
                    className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-500/50 text-left transition flex flex-col gap-1 group"
                  >
                    <div className="flex items-center justify-between text-emerald-400">
                      <Gamepad className="w-4 h-4" />
                      <span className="text-[10px] font-mono text-emerald-400">Lv.42</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white">Play Games</span>
                    <span className="text-[10px] text-slate-400">Play Pass & Gamer XP</span>
                  </button>

                  <button
                    onClick={() => onOpenGoogleTab('controller')}
                    className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-500/50 text-left transition flex flex-col gap-1 group"
                  >
                    <div className="flex items-center justify-between text-purple-400">
                      <Gamepad className="w-4 h-4" />
                      <span className="text-[10px] font-mono text-purple-400">Gamepad</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white">Controller Lab</span>
                    <span className="text-[10px] text-slate-400">Stadia / TV Input</span>
                  </button>

                  <button
                    onClick={() => onOpenGoogleTab('achievements')}
                    className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-amber-950/50 border border-slate-800 hover:border-amber-500/50 text-left transition flex flex-col gap-1 group"
                  >
                    <div className="flex items-center justify-between text-amber-400">
                      <Award className="w-4 h-4" />
                      <span className="text-[10px] font-mono text-amber-400">18/24</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white">Achievements</span>
                    <span className="text-[10px] text-slate-400">Play Games Sync</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenGoogleForms) onOpenGoogleForms();
                      else onOpenGoogleTab('setup');
                    }}
                    className="p-2.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-500/40 hover:border-emerald-400 text-left transition flex flex-col gap-1 group shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                  >
                    <div className="flex items-center justify-between text-emerald-400">
                      <FileText className="w-4 h-4" />
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">Forms v1</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-200 group-hover:text-white">Google Forms</span>
                    <span className="text-[10px] text-emerald-400/80">Polls & Feedback</span>
                  </button>

                  <button
                    onClick={() => onOpenGoogleTab('setup')}
                    className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/50 text-left transition flex flex-col gap-1 group"
                  >
                    <div className="flex items-center justify-between text-indigo-400">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-[10px] font-mono text-indigo-400">OAuth</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white">Google Setup</span>
                    <span className="text-[10px] text-slate-400">APIs & Firestore</span>
                  </button>
                </div>

                {/* Bottom Launch Button */}
                <button
                  onClick={() => onOpenGoogleTab('profile')}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Open Full Google Suite Modal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
