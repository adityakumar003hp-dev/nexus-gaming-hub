import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  BarChart3,
  Users,
  Coins,
  MessageSquare,
  Trophy,
  Shield,
  Settings,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  VolumeX,
  UserX,
  Radio,
  RefreshCw,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { getUserPoints, getUserGems, setUserPoints, setUserGems } from '../utils/pointsManager';
import { EmergencyModeController } from './EmergencyModeController';
import { CommandControlUsersModule, setupWindowGovernanceHandlers } from './CommandControlUsersModule';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername?: string;
}

export interface AdminUserData {
  id: string;
  username: string;
  role: 'PLAYER' | 'VIP' | 'MODERATOR' | 'ADMIN' | 'SITE OWNER';
  gems: number;
  coins: number;
  isMuted?: boolean;
  isBanned?: boolean;
  status?: string;
}

export interface AdminTournament {
  id: string;
  title: string;
  prizeGems: number;
  entryFeeGems: number;
  participants: number;
  maxParticipants: number;
  status: 'live' | 'upcoming' | 'completed';
}

export interface AdminClan {
  id: string;
  name: string;
  tag: string;
  leader: string;
  members: number;
  treasuryGems: number;
  rank: number;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose, currentUsername }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'economy' | 'chat' | 'tournaments' | 'clans' | 'system'>('overview');

  // Stats
  const [onlineCount, setOnlineCount] = useState<number>(42);
  const [totalGemsMinted, setTotalGemsMinted] = useState<number>(2450000);
  const [totalCoinsMinted, setTotalCoinsMinted] = useState<number>(24500000);

  // User Lookup State
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [searchedUser, setSearchedUser] = useState<AdminUserData | null>(null);
  const [userRole, setUserRole] = useState<'PLAYER' | 'VIP' | 'MODERATOR' | 'ADMIN' | 'SITE OWNER'>('PLAYER');
  const [userGemsAdjustment, setUserGemsAdjustment] = useState<string>('');
  const [userCoinsAdjustment, setUserCoinsAdjustment] = useState<string>('');

  // Economy State
  const [gemRate, setGemRate] = useState<number>(10);
  const [entryFee, setEntryFee] = useState<number>(100);
  const [jackpotStatus, setJackpotStatus] = useState<'AVAILABLE' | 'CLAIMED'>('AVAILABLE');

  // Moderation State
  const [broadcastMsg, setBroadcastMsg] = useState<string>('');
  const [chatSlowmode, setChatSlowmode] = useState<number>(3);
  const [chatFilter, setChatFilter] = useState<'enabled' | 'disabled'>('enabled');

  // Tournament Creation State
  const [tournName, setTournName] = useState<string>('');
  const [tournPrize, setTournPrize] = useState<string>('10000');
  const [tournFee, setTournFee] = useState<string>('200');
  const [tournMax, setTournMax] = useState<string>('64');
  const [tournaments, setTournaments] = useState<AdminTournament[]>([
    {
      id: 'tourn_1',
      title: 'Grand Blitz Showdown',
      prizeGems: 10000,
      entryFeeGems: 200,
      participants: 64,
      maxParticipants: 64,
      status: 'live',
    },
    {
      id: 'tourn_2',
      title: 'Masters Rapid Trophy',
      prizeGems: 5000,
      entryFeeGems: 100,
      participants: 18,
      maxParticipants: 32,
      status: 'upcoming',
    },
    {
      id: 'tourn_3',
      title: 'Checkers Crown Invitational',
      prizeGems: 3500,
      entryFeeGems: 50,
      participants: 16,
      maxParticipants: 16,
      status: 'live',
    },
  ]);

  // Clan Search State
  const [clanSearchQuery, setClanSearchQuery] = useState<string>('');
  const [searchedClan, setSearchedClan] = useState<AdminClan | null>(null);
  const [clansList, setClansList] = useState<AdminClan[]>([
    { id: 'clan_1', name: 'Grandmaster Council', tag: 'GMC', leader: 'MagnusK', members: 42, treasuryGems: 85000, rank: 1 },
    { id: 'clan_2', name: 'Tactical Titans', tag: 'TT', leader: 'HikaruN', members: 31, treasuryGems: 42000, rank: 2 },
    { id: 'clan_3', name: 'Speed Blitzers', tag: 'SB', leader: 'PraggR', members: 28, treasuryGems: 28000, rank: 3 },
    { id: 'clan_4', name: 'AI Hunters', tag: 'AH', leader: 'DeepBlue', members: 19, treasuryGems: 14000, rank: 4 },
  ]);

  // System State
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [bannerAlert, setBannerAlert] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setBannerAlert({ text, type });
    setTimeout(() => {
      setBannerAlert((curr) => (curr?.text === text ? null : curr));
    }, 4500);
  };

  // Sync / Load initial data
  useEffect(() => {
    setupWindowGovernanceHandlers();
    if (!isOpen) return;

    // Fetch initial server stats if available
    fetch('/api/admin/overview')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.onlinePlayers) setOnlineCount(data.onlinePlayers);
          if (data.totalGemsMinted) setTotalGemsMinted(data.totalGemsMinted);
          if (data.totalCoinsMinted) setTotalCoinsMinted(data.totalCoinsMinted);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Expose global window.AdminPanel object
  useEffect(() => {
    (window as any).AdminPanel = {
      open: () => {
        const modal = document.getElementById('adminPanelModal');
        if (modal) modal.classList.remove('hidden');
      },
      close: () => onClose(),
      checkOwnerSession: async () => {
        try {
          const res = await fetch('/api/admin/verify-session', {
            method: 'GET',
            credentials: 'include',
          });
          return res.ok;
        } catch {
          return false;
        }
      },
      switchTab: (tab: any) => {
        setActiveTab(tab);
        soundFx.playMove();
      },
      searchUser: () => handleSearchUser(),
      updateUserData: () => handleUpdateUserData(),
      applySanction: (type: 'mute' | 'kick' | 'ban') => handleApplySanction(type),
      saveEconomyConfig: () => handleSaveEconomyConfig(),
      resetJackpot: () => handleResetJackpot(),
      sendBroadcast: () => handleSendBroadcast(),
      saveChatSettings: () => handleSaveChatSettings(),
      createTournament: () => handleCreateTournament(),
      searchClan: () => handleSearchClan(),
      adjustClanTreasury: () => handleAdjustClanTreasury(),
      disbandClan: () => handleDisbandClan(),
      toggleMaintenance: () => handleToggleMaintenance(),
    };

    return () => {
      delete (window as any).AdminPanel;
    };
  });

  if (!isOpen) return null;

  // --- ACTIONS ---

  // User Lookup
  const handleSearchUser = () => {
    const query = userSearchQuery.trim();
    if (!query) {
      showNotification('Please enter a target username or ID.', 'warning');
      return;
    }

    soundFx.playMove();

    // Check if searching for current active player / site owner
    const isOwner = query.toLowerCase().includes('aditya') || query.toLowerCase().includes('owner');
    const roleFound = isOwner ? 'SITE OWNER' : query.toLowerCase().includes('vip') ? 'VIP' : 'PLAYER';

    const mockFound: AdminUserData = {
      id: `usr_${Math.floor(1000 + Math.random() * 9000)}`,
      username: isOwner ? 'ADITYA-OWNER' : query,
      role: roleFound,
      gems: isOwner ? 999999 : getUserGems(),
      coins: isOwner ? 9999999 : getUserPoints(),
      status: 'Active',
      isMuted: false,
      isBanned: false,
    };

    setSearchedUser(mockFound);
    setUserRole(mockFound.role);
    setUserGemsAdjustment('');
    setUserCoinsAdjustment('');
    showNotification(`Located player profile for "${mockFound.username}"!`, 'success');
  };

  // Update User Data
  const handleUpdateUserData = () => {
    if (!searchedUser) return;
    const gemsDelta = parseInt(userGemsAdjustment, 10) || 0;
    const coinsDelta = parseInt(userCoinsAdjustment, 10) || 0;

    const newGems = Math.max(0, searchedUser.gems + gemsDelta);
    const newCoins = Math.max(0, searchedUser.coins + coinsDelta);

    const updated: AdminUserData = {
      ...searchedUser,
      role: userRole,
      gems: newGems,
      coins: newCoins,
    };

    setSearchedUser(updated);

    // If adjusting self, also update local storage
    if (searchedUser.username === currentUsername || searchedUser.username === 'ADITYA-OWNER') {
      setUserGems(newGems, 'Admin Adjustment');
      setUserPoints(newCoins, 'Admin Adjustment');
    }

    soundFx.playWin();
    showNotification(
      `Updated ${searchedUser.username}: Role=${userRole}, Gems (${gemsDelta >= 0 ? '+' : ''}${gemsDelta}), Coins (${coinsDelta >= 0 ? '+' : ''}${coinsDelta})`,
      'success'
    );
    setUserGemsAdjustment('');
    setUserCoinsAdjustment('');
  };

  // Apply Sanction
  const handleApplySanction = (type: 'mute' | 'kick' | 'ban') => {
    if (!searchedUser) return;
    soundFx.playError();

    if (type === 'mute') {
      setSearchedUser({ ...searchedUser, isMuted: true });
      showNotification(`Applied 24-hour chat mute to "${searchedUser.username}".`, 'warning');
    } else if (type === 'kick') {
      showNotification(`Forced session termination and kicked "${searchedUser.username}".`, 'warning');
    } else if (type === 'ban') {
      setSearchedUser({ ...searchedUser, isBanned: true, status: 'Permanently Banned' });
      showNotification(`PERMANENT BAN executed on user "${searchedUser.username}".`, 'error');
    }
  };

  // Economy Config
  const handleSaveEconomyConfig = () => {
    soundFx.playWin();
    showNotification(`Economy parameters updated: 1 Gem = ${gemRate} Coins, Match Entry Fee = ${entryFee} Gems.`, 'success');
  };

  // Reset Jackpot
  const handleResetJackpot = () => {
    setJackpotStatus('AVAILABLE');
    soundFx.playCash();
    showNotification('Yearly 100,000 Gem Jackpot successfully reset to AVAILABLE status!', 'success');
  };

  // Chat Broadcast
  const handleSendBroadcast = () => {
    if (!broadcastMsg.trim()) {
      showNotification('Please enter a broadcast notification message.', 'warning');
      return;
    }
    soundFx.playCash();
    showNotification(`Global Announcement Broadcasted: "${broadcastMsg}"`, 'success');
    setBroadcastMsg('');
  };

  // Chat Settings
  const handleSaveChatSettings = () => {
    soundFx.playMove();
    showNotification(`Chat rules updated: Slow-mode ${chatSlowmode}s, Profanity filter: ${chatFilter.toUpperCase()}.`, 'success');
  };

  // Tournaments
  const handleCreateTournament = () => {
    if (!tournName.trim()) {
      showNotification('Please enter a tournament name.', 'warning');
      return;
    }

    const prize = parseInt(tournPrize, 10) || 5000;
    const fee = parseInt(tournFee, 10) || 100;
    const max = parseInt(tournMax, 10) || 64;

    const newTourn: AdminTournament = {
      id: `tourn_${Date.now()}`,
      title: tournName.trim(),
      prizeGems: prize,
      entryFeeGems: fee,
      participants: 1,
      maxParticipants: max,
      status: 'upcoming',
    };

    setTournaments([newTourn, ...tournaments]);
    setTournName('');
    soundFx.playWin();
    showNotification(`🚀 Tournament "${newTourn.title}" launched with 💎 ${prize.toLocaleString()} Gems Prize Pool!`, 'success');
  };

  const handleCancelTournament = (id: string) => {
    setTournaments(tournaments.filter((t) => t.id !== id));
    soundFx.playMove();
    showNotification('Tournament cancelled and removed.', 'warning');
  };

  // Clans
  const handleSearchClan = () => {
    const q = clanSearchQuery.trim().toLowerCase();
    if (!q) {
      showNotification('Please enter a clan tag or name.', 'warning');
      return;
    }

    const found = clansList.find((c) => c.tag.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));

    if (found) {
      setSearchedClan(found);
      soundFx.playMove();
      showNotification(`Found clan [${found.tag}] ${found.name}!`, 'success');
    } else {
      showNotification(`No clan found matching "${clanSearchQuery}".`, 'warning');
    }
  };

  const handleAdjustClanTreasury = () => {
    if (!searchedClan) return;
    const amountStr = prompt(`Enter Gem adjustment for [${searchedClan.tag}] ${searchedClan.name} (e.g. 5000 or -2000):`, '1000');
    if (!amountStr) return;
    const delta = parseInt(amountStr, 10);
    if (isNaN(delta)) return;

    const updated = {
      ...searchedClan,
      treasuryGems: Math.max(0, searchedClan.treasuryGems + delta),
    };
    setSearchedClan(updated);
    setClansList(clansList.map((c) => (c.id === updated.id ? updated : c)));
    soundFx.playCash();
    showNotification(`Clan treasury adjusted by ${delta >= 0 ? '+' : ''}${delta.toLocaleString()} Gems!`, 'success');
  };

  const handleDisbandClan = () => {
    if (!searchedClan) return;
    if (!confirm(`Are you sure you want to force disband clan [${searchedClan.tag}] ${searchedClan.name}?`)) return;

    setClansList(clansList.filter((c) => c.id !== searchedClan.id));
    setSearchedClan(null);
    soundFx.playError();
    showNotification(`Clan [${searchedClan.tag}] has been permanently disbanded.`, 'error');
  };

  // System
  const handleToggleMaintenance = () => {
    const next = !maintenanceMode;
    setMaintenanceMode(next);
    soundFx.playError();
    showNotification(
      next ? '⚠️ MAINTENANCE MODE ACTIVATED: Non-admin logins and currency conversions blocked.' : '✅ MAINTENANCE MODE DEACTIVATED: Server operational.',
      next ? 'warning' : 'success'
    );
  };

  return (
    <div
      id="adminPanelModal"
      className="admin-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-card w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0b0f19] border border-amber-500/40 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.25)] relative overflow-hidden text-slate-100 animate-scale-up">
        {/* Background glow flares */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="admin-header flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#080c14]/90 relative z-10">
          <div className="title-wrap flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono">
                  🛡️ Command & Control Center
                </h2>
                <span className="badge site-owner px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-mono shadow-sm">
                  SITE OWNER
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Platform Administration & Superuser Governance Hub</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="admin-close-btn w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer text-lg font-bold"
            id="btn-close-admin-panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Bar */}
        <div className="admin-nav-tabs flex items-center gap-1.5 p-2 bg-[#060910] border-b border-slate-800/80 overflow-x-auto no-scrollbar relative z-10">
          {[
            { id: 'overview', label: '📊 Overview', icon: BarChart3 },
            { id: 'users', label: '👥 Users', icon: Users },
            { id: 'economy', label: '🪙 Economy', icon: Coins },
            { id: 'chat', label: '💬 Moderation', icon: MessageSquare },
            { id: 'tournaments', label: '🏆 Tournaments', icon: Trophy },
            { id: 'clans', label: '🛡️ Clans', icon: Shield },
            { id: 'system', label: '⚙️ System', icon: Settings },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`admTab-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  soundFx.playMove();
                }}
                className={`adm-tab-btn px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'active bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.35)] border border-amber-300 font-mono'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Notification / Banner Feedback */}
        {bannerAlert && (
          <div
            className={`mx-4 sm:mx-6 mt-4 p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-fade-in ${
              bannerAlert.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : bannerAlert.type === 'warning'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            }`}
          >
            {bannerAlert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{bannerAlert.text}</span>
          </div>
        )}

        {/* MAIN CONTAINER FOR PANELS */}
        <div className="admin-body p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 relative z-10 custom-scrollbar">
          {/* SECTION 1: OVERVIEW & ANALYTICS */}
          {activeTab === 'overview' && (
            <div id="admPanel-overview" className="adm-panel space-y-6 animate-fade-in">
              <div className="stats-grid grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="stat-card p-4 rounded-2xl bg-[#070b14] border border-emerald-500/30 flex flex-col justify-between">
                  <span className="stat-label text-[11px] font-black uppercase text-slate-400 tracking-wider">
                    Online Players
                  </span>
                  <span id="admStat-online" className="stat-value text-2xl font-black font-mono text-emerald-400 mt-2">
                    {onlineCount.toLocaleString()}
                  </span>
                </div>

                <div className="stat-card p-4 rounded-2xl bg-[#070b14] border border-fuchsia-500/30 flex flex-col justify-between">
                  <span className="stat-label text-[11px] font-black uppercase text-slate-400 tracking-wider">
                    Total Gems Minted
                  </span>
                  <span id="admStat-gems" className="stat-value text-2xl font-black font-mono text-fuchsia-300 mt-2">
                    💎 {totalGemsMinted.toLocaleString()}
                  </span>
                </div>

                <div className="stat-card p-4 rounded-2xl bg-[#070b14] border border-amber-500/30 flex flex-col justify-between">
                  <span className="stat-label text-[11px] font-black uppercase text-slate-400 tracking-wider">
                    Total Coins Minted
                  </span>
                  <span id="admStat-coins" className="stat-value text-2xl font-black font-mono text-amber-300 mt-2">
                    🪙 {totalCoinsMinted.toLocaleString()}
                  </span>
                </div>

                <div className="stat-card p-4 rounded-2xl bg-[#070b14] border border-sky-500/30 flex flex-col justify-between">
                  <span className="stat-label text-[11px] font-black uppercase text-slate-400 tracking-wider">
                    Active Tournaments
                  </span>
                  <span id="admStat-tourneys" className="stat-value text-2xl font-black font-mono text-sky-300 mt-2">
                    {tournaments.filter((t) => t.status !== 'completed').length}
                  </span>
                </div>
              </div>

              {/* Quick Health Status */}
              <div className="p-4 rounded-2xl bg-[#070b14]/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    API Server Status: <strong className="text-emerald-300 font-mono">HEALTHY (0ms latency)</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                  <span>
                    Database: <strong className="text-indigo-300 font-mono">Cloud SQL & Firestore SYNCED</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>
                    Defense Engine: <strong className="text-amber-300 font-mono">ANTI-FRAUD ENGAGED</strong>
                  </span>
                </div>
              </div>

              {/* Emergency Mode Settings Widget in Overview */}
              <div className="pt-2">
                <EmergencyModeController
                  currentUsername={currentUsername}
                  onNotification={showNotification}
                />
              </div>
            </div>
          )}

          {/* SECTION 2: USER MANAGEMENT & GOVERNANCE */}
          {activeTab === 'users' && (
            <div id="admPanel-users" className="adm-panel space-y-5 animate-fade-in flex justify-center">
              <CommandControlUsersModule />
            </div>
          )}

          {/* SECTION 3: ECONOMY & JACKPOT */}
          {activeTab === 'economy' && (
            <div id="admPanel-economy" className="adm-panel space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2 mb-3">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Global Exchange Rates & Fees</span>
                </h3>

                <div className="adm-form-grid grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="input-group space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      Coins per Gem Rate (1 Gem = X Coins)
                    </label>
                    <input
                      type="number"
                      id="admConfigGemRate"
                      value={gemRate}
                      onChange={(e) => setGemRate(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono outline-none"
                    />
                  </div>

                  <div className="input-group space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      Game Entry Fee (💎 Gems)
                    </label>
                    <input
                      type="number"
                      id="admConfigEntryFee"
                      value={entryFee}
                      onChange={(e) => setEntryFee(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-fuchsia-300 font-mono outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveEconomyConfig}
                  className="adm-btn primary px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono transition cursor-pointer active:scale-95 shadow-md"
                >
                  Update Parameters
                </button>
              </div>

              <hr className="adm-divider border-slate-800" />

              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-fuchsia-400" />
                  <span>Yearly 100,000 Gem Jackpot</span>
                </h3>

                <div className="jackpot-control-box p-4 rounded-2xl bg-[#070b14] border border-fuchsia-500/30 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-300">
                      Current Status:{' '}
                      <strong
                        id="admJackpotStatus"
                        className={`font-mono text-sm ${
                          jackpotStatus === 'AVAILABLE' ? 'status-green text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {jackpotStatus}
                      </strong>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Grand annual pool: 💎 100,000 Gems</p>
                  </div>

                  <button
                    onClick={handleResetJackpot}
                    className="adm-btn danger px-3.5 py-2 rounded-xl text-xs font-black uppercase bg-rose-600 hover:bg-rose-500 text-white font-mono transition cursor-pointer active:scale-95 shadow-md"
                  >
                    Reset Jackpot Status
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: CHAT MODERATION */}
          {activeTab === 'chat' && (
            <div id="admPanel-chat" className="adm-panel space-y-5 animate-fade-in">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <span>Broadcast & Global Chat Rules</span>
              </h3>

              <div className="adm-form-group space-y-1.5 p-4 rounded-2xl bg-[#070b14] border border-slate-800">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  Global Announcement Broadcast
                </label>
                <div className="adm-form-row flex items-center gap-2">
                  <input
                    type="text"
                    id="admBroadcastInput"
                    value={broadcastMsg}
                    placeholder="Enter system notification message to push across all players..."
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendBroadcast()}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono"
                  />
                  <button
                    onClick={handleSendBroadcast}
                    className="adm-btn primary px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono transition cursor-pointer active:scale-95 shrink-0"
                  >
                    Broadcast
                  </button>
                </div>
              </div>

              <div className="adm-form-grid grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="input-group space-y-1">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                    Chat Cooldown Slow-Mode (Seconds)
                  </label>
                  <input
                    type="number"
                    id="admChatSlowmode"
                    value={chatSlowmode}
                    min="0"
                    onChange={(e) => setChatSlowmode(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>

                <div className="input-group space-y-1">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                    Auto-Filter Profanity
                  </label>
                  <select
                    id="admChatFilter"
                    value={chatFilter}
                    onChange={(e) => setChatFilter(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSaveChatSettings}
                className="adm-btn success px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white font-mono transition cursor-pointer active:scale-95 shadow-md"
              >
                Apply Chat Rules
              </button>
            </div>
          )}

          {/* SECTION 5: TOURNAMENTS */}
          {activeTab === 'tournaments' && (
            <div id="admPanel-tournaments" className="adm-panel space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Create New Tournament</span>
                </h3>

                <div className="adm-form-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <div className="input-group space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      Tournament Name
                    </label>
                    <input
                      type="text"
                      id="tournName"
                      value={tournName}
                      placeholder="e.g. Grand Blitz Showdown"
                      onChange={(e) => setTournName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div className="input-group space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      Prize Pool (💎 Gems)
                    </label>
                    <input
                      type="number"
                      id="tournPrize"
                      value={tournPrize}
                      placeholder="10000"
                      onChange={(e) => setTournPrize(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-fuchsia-300 outline-none font-mono"
                    />
                  </div>

                  <div className="input-group space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      Entry Fee (💎 Gems)
                    </label>
                    <input
                      type="number"
                      id="tournFee"
                      value={tournFee}
                      placeholder="200"
                      onChange={(e) => setTournFee(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 outline-none font-mono"
                    />
                  </div>

                  <div className="input-group space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Max Players</label>
                    <input
                      type="number"
                      id="tournMax"
                      value={tournMax}
                      placeholder="64"
                      onChange={(e) => setTournMax(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-sky-300 outline-none font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateTournament}
                  className="adm-btn primary px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono transition cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5"
                >
                  <span>🚀 Launch Tournament</span>
                </button>
              </div>

              <hr className="adm-divider border-slate-800" />

              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 font-mono mb-3">
                  Active Tournaments
                </h3>

                <div className="table-wrapper rounded-2xl bg-[#070b14] border border-slate-800 overflow-hidden">
                  <table className="adm-table w-full text-left text-xs font-mono">
                    <thead className="bg-[#050810] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Title</th>
                        <th className="p-3">Prize</th>
                        <th className="p-3">Slots</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody id="admTourneyTable" className="divide-y divide-slate-800/60">
                      {tournaments.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-bold text-white">{t.title}</td>
                          <td className="p-3 text-fuchsia-300">💎 {t.prizeGems.toLocaleString()}</td>
                          <td className="p-3 text-slate-400">
                            {t.participants}/{t.maxParticipants}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                t.status === 'live'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleCancelTournament(t.id)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: CLANS */}
          {activeTab === 'clans' && (
            <div id="admPanel-clans" className="adm-panel space-y-5 animate-fade-in">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Clan Governance</span>
              </h3>

              <div className="adm-form-row flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    id="admClanSearchInput"
                    value={clanSearchQuery}
                    placeholder="Search by Clan Tag/Name (e.g. GMC, Tactical Titans)..."
                    onChange={(e) => setClanSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchClan()}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-mono"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  onClick={handleSearchClan}
                  className="adm-btn primary px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-indigo-500 hover:bg-indigo-400 text-white font-mono transition cursor-pointer active:scale-95 shadow-md"
                >
                  Inspect Clan
                </button>
              </div>

              {searchedClan && (
                <div
                  id="admClanDetailCard"
                  className="adm-info-card p-5 rounded-2xl bg-[#070b14] border border-indigo-500/40 space-y-4 shadow-lg animate-scale-up"
                >
                  <div>
                    <h4 id="admClanName" className="text-base font-black text-white font-mono">
                      [{searchedClan.tag}] {searchedClan.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      Leader: <strong id="admClanLeader" className="text-amber-300">{searchedClan.leader}</strong> | Members: <strong className="text-slate-200">{searchedClan.members}</strong> | Treasury:{' '}
                      <strong id="admClanTreasury" className="text-fuchsia-300">💎 {searchedClan.treasuryGems.toLocaleString()}</strong>
                    </p>
                  </div>

                  <div className="adm-actions-row flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={handleAdjustClanTreasury}
                      className="adm-btn success px-4 py-2 rounded-xl text-xs font-black uppercase bg-emerald-600 hover:bg-emerald-500 text-white font-mono transition cursor-pointer active:scale-95"
                    >
                      💎 Modify Treasury
                    </button>
                    <button
                      onClick={handleDisbandClan}
                      className="adm-btn danger px-3.5 py-2 rounded-xl text-xs font-black uppercase bg-rose-600 hover:bg-rose-500 text-white font-mono transition cursor-pointer active:scale-95"
                    >
                      🔥 Force Disband
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 7: SYSTEM CONTROLS */}
          {activeTab === 'system' && (
            <div id="admPanel-system" className="adm-panel space-y-5 animate-fade-in">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Server Operations & Diagnostics</span>
              </h3>

              {/* Emergency Mode Settings Controller */}
              <EmergencyModeController
                currentUsername={currentUsername}
                onNotification={showNotification}
              />

              <div className="system-toggle-box p-4 sm:p-5 rounded-2xl bg-[#070b14] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <strong className="text-sm font-black text-white font-mono">Maintenance Mode</strong>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Blocks non-admin logins, match initiations, and currency conversions.
                  </p>
                </div>
                <button
                  id="admBtnMaintenance"
                  onClick={handleToggleMaintenance}
                  className={`adm-btn px-4 py-2.5 rounded-xl text-xs font-black uppercase font-mono tracking-wider transition cursor-pointer active:scale-95 shrink-0 ${
                    maintenanceMode
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'danger bg-rose-600 hover:bg-rose-500 text-white shadow-lg'
                  }`}
                >
                  {maintenanceMode ? 'Deactivate Maintenance' : 'Activate Maintenance'}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">
                  Database & Cache Purge Tools
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      soundFx.playWin();
                      showNotification('Leaderboard Redis/Memory Cache Purged successfully!', 'success');
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-black font-mono uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  >
                    Purge Leaderboard Cache
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playWin();
                      showNotification('Telemetry Logs compacted and archived.', 'success');
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-black font-mono uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  >
                    Archive Telemetry
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
