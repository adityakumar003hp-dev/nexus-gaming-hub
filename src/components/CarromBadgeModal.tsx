import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Award,
  Shield,
  Star,
  Crown,
  Sparkles,
  Zap,
  Flame,
  Target,
  Check,
  CheckCircle2,
  Lock,
  Gift,
  Search,
  Filter,
  Archive,
  ArchiveRestore,
  X,
  Coins,
  Gem,
  ChevronRight,
  RefreshCw,
  Info,
  Sliders,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CarromBadge,
  BadgeCategory,
  BadgeTier,
  BadgeRarity,
  UserBadgesState,
  getAllCarromBadges,
  loadUserBadgesState,
  saveUserBadgesState,
  claimBadgeReward,
  toggleArchiveBadge,
  toggleEquipBadge,
  updateCarromPlayerStats,
  checkAndUpdateBadgeProgress,
} from '../data/carromBadgesData';
import { soundFx } from '../utils/audio';

interface CarromBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExchange?: () => void;
}

export const CarromBadgeModal: React.FC<CarromBadgeModalProps> = ({
  isOpen,
  onClose,
  onOpenExchange,
}) => {
  const [badgeState, setBadgeState] = useState<UserBadgesState>(loadUserBadgesState());
  const [allBadges] = useState<CarromBadge[]>(() => getAllCarromBadges());
  
  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<'all' | 'core' | 'top_rank' | 'special' | 'archived' | 'ready'>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'unlocked' | 'in_progress' | 'locked'>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  
  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Test drawer toggle
  const [showSandbox, setShowSandbox] = useState<boolean>(false);
  // Selected badge for detail modal view
  const [inspectedBadge, setInspectedBadge] = useState<CarromBadge | null>(null);

  // Sync state on open and listen to changes
  useEffect(() => {
    if (isOpen) {
      const refreshed = checkAndUpdateBadgeProgress();
      setBadgeState(refreshed.state);
    }

    const handleStateUpdate = (e: any) => {
      if (e.detail) setBadgeState(e.detail);
    };

    window.addEventListener('carrom_badges_updated', handleStateUpdate);
    return () => {
      window.removeEventListener('carrom_badges_updated', handleStateUpdate);
    };
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Extract unique subcategories
  const specialSubcategories = useMemo(() => {
    const list = allBadges
      .filter((b) => b.category === 'special')
      .map((b) => b.subCategory);
    return Array.from(new Set(list));
  }, [allBadges]);

  // Derived metrics
  const stats = badgeState.stats;
  const unlockedMap = badgeState.unlockedBadges;
  const archivedList = badgeState.archivedBadges;
  const equippedList = badgeState.equippedBadges;

  const totalBadgesCount = allBadges.length; // 656
  const totalUnlockedCount = Object.keys(unlockedMap).length;
  const totalReadyToClaimCount = allBadges.filter(
    (b) => unlockedMap[b.id] && !unlockedMap[b.id].claimed
  ).length;
  const totalArchivedCount = archivedList.length;

  const coreUnlockedCount = allBadges.filter(
    (b) => b.category === 'core' && unlockedMap[b.id]
  ).length;
  const topRankUnlockedCount = allBadges.filter(
    (b) => b.category === 'top_rank' && unlockedMap[b.id]
  ).length;
  const specialUnlockedCount = allBadges.filter(
    (b) => b.category === 'special' && unlockedMap[b.id]
  ).length;

  const progressPercentage = Math.round((totalUnlockedCount / totalBadgesCount) * 100);

  // Filter badges
  const filteredBadges = useMemo(() => {
    return allBadges.filter((badge) => {
      const isArchived = archivedList.includes(badge.id);
      const isUnlocked = !!unlockedMap[badge.id];
      const isClaimed = isUnlocked && unlockedMap[badge.id].claimed;
      const isReadyToClaim = isUnlocked && !isClaimed;
      const currentStat = (stats as any)[badge.requirement.statKey] ?? 0;
      const isInProgress = !isUnlocked && currentStat > 0;
      const isLocked = !isUnlocked && currentStat === 0;

      // Tab filter
      if (activeTab === 'archived') {
        if (!isArchived) return false;
      } else if (activeTab === 'ready') {
        if (!isReadyToClaim) return false;
      } else {
        // If not in archived tab, hide archived badges
        if (isArchived) return false;

        if (activeTab === 'core' && badge.category !== 'core') return false;
        if (activeTab === 'top_rank' && badge.category !== 'top_rank') return false;
        if (activeTab === 'special' && badge.category !== 'special') return false;
      }

      // Subcategory filter (if viewing special or all)
      if (selectedSubCategory !== 'all') {
        if (badge.subCategory !== selectedSubCategory) return false;
      }

      // Status filter
      if (statusFilter === 'ready' && !isReadyToClaim) return false;
      if (statusFilter === 'unlocked' && !isUnlocked) return false;
      if (statusFilter === 'in_progress' && !isInProgress) return false;
      if (statusFilter === 'locked' && (isUnlocked || isInProgress)) return false;

      // Tier filter
      if (tierFilter !== 'all' && badge.tier !== tierFilter) return false;

      // Rarity filter
      if (rarityFilter !== 'all' && badge.rarity !== rarityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = badge.name.toLowerCase().includes(query);
        const matchesDesc = badge.description.toLowerCase().includes(query);
        const matchesSub = badge.subCategory.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesSub) return false;
      }

      return true;
    });
  }, [
    allBadges,
    activeTab,
    selectedSubCategory,
    statusFilter,
    tierFilter,
    rarityFilter,
    searchQuery,
    archivedList,
    unlockedMap,
    stats,
  ]);

  // Handlers
  const handleClaimReward = (badgeId: string) => {
    const result = claimBadgeReward(badgeId);
    if (result.success) {
      setBadgeState({ ...result.state });
      soundFx.playCash();
      showToast(`🎉 ${result.message}`);
    } else {
      showToast(`⚠️ ${result.message}`);
    }
  };

  const handleToggleEquip = (badgeId: string) => {
    const result = toggleEquipBadge(badgeId);
    setBadgeState({ ...result.state });
    soundFx.playClick();
    showToast(result.message);
  };

  const handleToggleArchive = (badgeId: string) => {
    const nextState = toggleArchiveBadge(badgeId);
    setBadgeState({ ...nextState });
    soundFx.playClick();
    const isNowArchived = nextState.archivedBadges.includes(badgeId);
    showToast(isNowArchived ? '📦 Badge moved to Archive Vault' : '🌟 Badge restored from Archive Vault');
  };

  // Sandbox simulation helpers
  const handleSimulateStat = (statKey: string, amount: number) => {
    const current = (stats as any)[statKey] ?? 0;
    const updated = current + amount;
    const res = updateCarromPlayerStats({ [statKey]: updated } as any);
    setBadgeState({ ...res.state });
    soundFx.playClick();
    if (res.newlyUnlocked.length > 0) {
      soundFx.playWin();
      showToast(`🏆 ${res.newlyUnlocked.length} New Badge(s) Unlocked!`);
    } else {
      showToast(`⚡ Stat ${statKey} increased to ${updated}`);
    }
  };

  const handleUnlockAllStarter = () => {
    const starters = allBadges.filter((b) => b.tier === 'Starter');
    const newUnlocked: Record<string, { unlockedAt: number; claimed: boolean }> = { ...badgeState.unlockedBadges };
    starters.forEach((b) => {
      if (!newUnlocked[b.id]) {
        newUnlocked[b.id] = { unlockedAt: Date.now(), claimed: false };
      }
    });
    const nextState: UserBadgesState = {
      ...badgeState,
      unlockedBadges: newUnlocked,
    };
    saveUserBadgesState(nextState);
    setBadgeState(nextState);
    soundFx.playWin();
    showToast(`🌟 Unlocked all ${starters.length} Starter Badges for testing!`);
  };

  const getRarityBadgeStyle = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'mythic':
        return 'border-rose-500/80 bg-rose-950/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
      case 'legendary':
        return 'border-amber-500/80 bg-amber-950/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
      case 'epic':
        return 'border-purple-500/80 bg-purple-950/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]';
      case 'rare':
        return 'border-sky-500/80 bg-sky-950/40 text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.25)]';
      default:
        return 'border-slate-700 bg-slate-900/60 text-slate-300';
    }
  };

  const getRarityPill = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'mythic':
        return <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-600">Mythic</span>;
      case 'legendary':
        return <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600">Legendary</span>;
      case 'epic':
        return <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-600">Epic</span>;
      case 'rare':
        return <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-600">Rare</span>;
      default:
        return <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Common</span>;
    }
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: count }).map((_, i) => (
          <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[920px] bg-[#0c101d] border border-[#242f4c] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-white">
        
        {/* Toast Notification Banner */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs rounded-xl shadow-2xl flex items-center gap-2 border border-amber-300"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Top Header */}
        <div className="bg-[#0e1424] px-4 sm:px-6 py-3.5 border-b border-[#242f4c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                  Carrom Badge System
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                    656 BADGES
                  </span>
                </h2>
              </div>
              <p className="text-[11px] text-slate-400">
                Progression Engine • 150 Core • 6 Top Rank • 500 Special Challenges • Archive Vault
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSandbox(!showSandbox)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                showSandbox
                  ? 'bg-sky-600 text-white border-sky-400'
                  : 'bg-[#151c30] text-sky-400 border-sky-900/60 hover:bg-[#1a233d]'
              }`}
              title="Test & Advance Progression Stats"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sandbox</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#151c30] hover:bg-[#202b48] border border-[#242f4c] text-slate-400 hover:text-white flex items-center justify-center transition text-sm font-bold"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Player Stats & Equipped Showcase Banner */}
        <div className="bg-[#090d18] px-4 sm:px-6 py-3 border-b border-[#242f4c] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
          {/* Progress Overview Bar */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Mastery Completion:
                <strong className="text-white font-mono">{totalUnlockedCount} / {totalBadgesCount}</strong>
                <span className="text-[10px] text-amber-400 font-mono font-bold">({progressPercentage}%)</span>
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-emerald-400 font-medium">Core: <strong>{coreUnlockedCount}/150</strong></span>
                <span className="text-amber-300 font-medium">Rank: <strong>{topRankUnlockedCount}/6</strong></span>
                <span className="text-purple-300 font-medium">Special: <strong>{specialUnlockedCount}/500</strong></span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-[#151c30] rounded-full overflow-hidden border border-[#242f4c]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(1, progressPercentage)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)]"
              />
            </div>
          </div>

          {/* Equipped Profile Showcase Slots */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden lg:inline">
              Equipped:
            </span>
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((slotIdx) => {
                const badgeId = equippedList[slotIdx];
                const badge = badgeId ? allBadges.find((b) => b.id === badgeId) : null;
                return (
                  <div
                    key={slotIdx}
                    className={`relative w-[110px] sm:w-[130px] h-[46px] rounded-xl border p-1.5 flex items-center gap-2 transition ${
                      badge
                        ? 'bg-[#131a2e] border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                        : 'bg-[#0e1424] border-dashed border-slate-700/60 text-slate-500'
                    }`}
                  >
                    {badge ? (
                      <>
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-sm shrink-0">
                          {badge.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-white truncate leading-tight">
                            {badge.name}
                          </p>
                          <span className="text-[9px] text-amber-400 font-semibold block">
                            {badge.tier}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleEquip(badge.id)}
                          className="w-4 h-4 rounded-full bg-red-950/80 hover:bg-red-800 text-red-300 text-[9px] flex items-center justify-center border border-red-700 shrink-0"
                          title="Unequip from profile"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div className="w-full text-center text-[10px] font-medium text-slate-500">
                        + Slot {slotIdx + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Interactive Sandbox Test Drawer */}
        <AnimatePresence>
          {showSandbox && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#10172b] border-b border-[#242f4c] px-4 sm:px-6 py-2.5 shrink-0 overflow-hidden text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-sky-300 font-semibold">
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  <span>Progression Sandbox:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handleSimulateStat('wins', 1)}
                    className="px-2 py-1 bg-[#1a233d] hover:bg-[#233054] text-slate-200 border border-slate-700 rounded-md font-mono text-[10px]"
                  >
                    +1 Win ({stats.wins})
                  </button>
                  <button
                    onClick={() => handleSimulateStat('queensPocketed', 1)}
                    className="px-2 py-1 bg-[#1a233d] hover:bg-[#233054] text-red-300 border border-slate-700 rounded-md font-mono text-[10px]"
                  >
                    +1 Queen ({stats.queensPocketed})
                  </button>
                  <button
                    onClick={() => handleSimulateStat('totalPockets', 5)}
                    className="px-2 py-1 bg-[#1a233d] hover:bg-[#233054] text-emerald-300 border border-slate-700 rounded-md font-mono text-[10px]"
                  >
                    +5 Pockets ({stats.totalPockets})
                  </button>
                  <button
                    onClick={() => handleSimulateStat('cleanBreaks', 1)}
                    className="px-2 py-1 bg-[#1a233d] hover:bg-[#233054] text-amber-300 border border-slate-700 rounded-md font-mono text-[10px]"
                  >
                    +1 Break ({stats.cleanBreaks})
                  </button>
                  <button
                    onClick={() => handleSimulateStat('trickShots', 1)}
                    className="px-2 py-1 bg-[#1a233d] hover:bg-[#233054] text-purple-300 border border-slate-700 rounded-md font-mono text-[10px]"
                  >
                    +1 Trick Shot ({stats.trickShots})
                  </button>
                  <button
                    onClick={() => handleSimulateStat('bestWinStreak', 1)}
                    className="px-2 py-1 bg-[#1a233d] hover:bg-[#233054] text-rose-300 border border-slate-700 rounded-md font-mono text-[10px]"
                  >
                    +1 Streak ({stats.bestWinStreak})
                  </button>
                  <button
                    onClick={() => handleSimulateStat('eloRating', 100)}
                    className="px-2 py-1 bg-[#1a233d] hover:bg-[#233054] text-yellow-300 border border-slate-700 rounded-md font-mono text-[10px]"
                  >
                    +100 ELO ({stats.eloRating})
                  </button>
                  <button
                    onClick={handleUnlockAllStarter}
                    className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-md text-[10px]"
                  >
                    Unlock All Starters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Tab Navigation */}
        <div className="bg-[#0b101c] px-4 sm:px-6 pt-2.5 border-b border-[#242f4c] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => { setActiveTab('all'); setSelectedSubCategory('all'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'bg-[#141b2e] text-slate-300 hover:bg-[#1a233b] hover:text-white border border-[#242f4c]'
              }`}
            >
              <span>🌐</span> All Badges ({totalBadgesCount})
            </button>

            <button
              onClick={() => { setActiveTab('core'); setSelectedSubCategory('all'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'core'
                  ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-[#141b2e] text-slate-300 hover:bg-[#1a233b] hover:text-white border border-[#242f4c]'
              }`}
            >
              <span>🟢</span> Core (150)
              <span className="text-[10px] font-mono opacity-80">({coreUnlockedCount}/150)</span>
            </button>

            <button
              onClick={() => { setActiveTab('top_rank'); setSelectedSubCategory('all'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'top_rank'
                  ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                  : 'bg-[#141b2e] text-slate-300 hover:bg-[#1a233b] hover:text-white border border-[#242f4c]'
              }`}
            >
              <span>👑</span> Top Rank (6)
              <span className="text-[10px] font-mono opacity-80">({topRankUnlockedCount}/6)</span>
            </button>

            <button
              onClick={() => { setActiveTab('special'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'special'
                  ? 'bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'bg-[#141b2e] text-slate-300 hover:bg-[#1a233b] hover:text-white border border-[#242f4c]'
              }`}
            >
              <span>🔥</span> Special (500)
              <span className="text-[10px] font-mono opacity-80">({specialUnlockedCount}/500)</span>
            </button>

            {totalReadyToClaimCount > 0 && (
              <button
                onClick={() => { setActiveTab('ready'); setSelectedSubCategory('all'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 animate-pulse ${
                  activeTab === 'ready'
                    ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.5)]'
                    : 'bg-yellow-950/70 text-yellow-300 border border-yellow-600'
                }`}
              >
                <span>🎁</span> Claim Ready ({totalReadyToClaimCount})
              </button>
            )}

            <button
              onClick={() => { setActiveTab('archived'); setSelectedSubCategory('all'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'archived'
                  ? 'bg-slate-300 text-black shadow-[0_0_12px_rgba(203,213,225,0.4)]'
                  : 'bg-[#141b2e] text-slate-300 hover:bg-[#1a233b] hover:text-white border border-[#242f4c]'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive Vault ({totalArchivedCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 pb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 656 badges..."
              className="w-full bg-[#141b2e] border border-[#242f4c] rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Secondary Subcategory Pills for Special Badges */}
        {(activeTab === 'special' || activeTab === 'all') && (
          <div className="bg-[#0e1424] px-4 sm:px-6 py-2 border-b border-[#242f4c] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 text-xs">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" /> Category:
            </span>
            <button
              onClick={() => setSelectedSubCategory('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition ${
                selectedSubCategory === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60'
                  : 'bg-[#151c30] text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              All 25 Categories
            </button>
            {specialSubcategories.map((subCat) => (
              <button
                key={subCat}
                onClick={() => setSelectedSubCategory(subCat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition ${
                  selectedSubCategory === subCat
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60'
                    : 'bg-[#151c30] text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {subCat}
              </button>
            ))}
          </div>
        )}

        {/* Quick Filter Controls */}
        <div className="bg-[#090d18] px-4 sm:px-6 py-2 border-b border-[#242f4c] flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#141b2e] border border-[#242f4c] text-white rounded-md px-2 py-1 text-[11px] focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="ready">🎁 Ready to Claim</option>
              <option value="unlocked">🏆 Unlocked & Claimed</option>
              <option value="in_progress">⏳ In Progress</option>
              <option value="locked">🔒 Locked</option>
            </select>

            <span className="text-slate-400 font-medium ml-2">Tier:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-[#141b2e] border border-[#242f4c] text-white rounded-md px-2 py-1 text-[11px] focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Tiers</option>
              <option value="Starter">⭐ Starter</option>
              <option value="Medium">⭐⭐ Medium</option>
              <option value="Pro">⭐⭐⭐ Pro</option>
              <option value="Super">⭐⭐⭐⭐ Super</option>
              <option value="Enthusiast">⭐⭐⭐⭐⭐ Enthusiast</option>
              <option value="Rank">👑 Rank</option>
              <option value="Special">🔥 Special</option>
            </select>

            <span className="text-slate-400 font-medium ml-2">Rarity:</span>
            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="bg-[#141b2e] border border-[#242f4c] text-white rounded-md px-2 py-1 text-[11px] focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
              <option value="mythic">Mythic</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-400">
            Showing <strong className="text-white font-mono">{filteredBadges.length}</strong> badges
          </div>
        </div>

        {/* Badges Grid View */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#0a0e1a] scrollbar-thin scrollbar-thumb-[#242f4c]">
          {filteredBadges.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
              <Award className="w-12 h-12 text-slate-600 stroke-[1.5]" />
              <div>
                <p className="text-sm font-bold text-slate-300">No badges match your active filters</p>
                <p className="text-xs text-slate-500 mt-1">Try resetting the search or filter options</p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTierFilter('all');
                  setRarityFilter('all');
                  setSelectedSubCategory('all');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#141b2e] hover:bg-[#1a233b] border border-[#242f4c] text-xs font-semibold text-amber-400 transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredBadges.map((badge) => {
                const isArchived = archivedList.includes(badge.id);
                const isEquipped = equippedList.includes(badge.id);
                const isUnlocked = !!unlockedMap[badge.id];
                const isClaimed = isUnlocked && unlockedMap[badge.id].claimed;
                const isReadyToClaim = isUnlocked && !isClaimed;
                const currentStat = (stats as any)[badge.requirement.statKey] ?? 0;
                const targetStat = badge.requirement.target;
                const progressRatio = Math.min(1, currentStat / targetStat);
                const progressPct = Math.round(progressRatio * 100);

                return (
                  <div
                    key={badge.id}
                    className={`relative rounded-xl border p-3.5 flex flex-col justify-between transition-all duration-200 ${
                      isReadyToClaim
                        ? 'bg-gradient-to-br from-[#1c1809] to-[#131106] border-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.25)]'
                        : isUnlocked
                        ? 'bg-[#111728] border-[#242f4c] hover:border-amber-500/50'
                        : 'bg-[#0e1322] border-slate-800/80 opacity-90'
                    }`}
                  >
                    {/* Top Row: Icon + Title + Rarity */}
                    <div className="flex items-start gap-3">
                      {/* Shield Icon Disc */}
                      <div
                        className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border ${getRarityBadgeStyle(
                          badge.rarity
                        )}`}
                      >
                        <span>{badge.icon}</span>
                        {isEquipped && (
                          <div
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-black font-black text-[10px] flex items-center justify-center border-2 border-[#111728] shadow-md"
                            title="Equipped to Profile Showcase"
                          >
                            ⭐
                          </div>
                        )}
                        {isArchived && (
                          <div
                            className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-700 text-white font-black text-[9px] flex items-center justify-center border border-slate-500"
                            title="Archived Badge"
                          >
                            📦
                          </div>
                        )}
                      </div>

                      {/* Title & Category Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h3 className="text-xs font-bold text-white truncate" title={badge.name}>
                            {badge.name}
                          </h3>
                          {getRarityPill(badge.rarity)}
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                          <span className="font-semibold text-amber-400">{badge.tier}</span>
                          <span>•</span>
                          <span className="truncate">{badge.subCategory}</span>
                        </div>

                        {renderStars(badge.stars)}
                      </div>
                    </div>

                    {/* Middle: Requirement & Live Progress */}
                    <div className="mt-3 space-y-1.5">
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {badge.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Progress:</span>
                        <span className={isUnlocked ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                          {Math.min(currentStat, targetStat)} / {badge.requirement.label}
                        </span>
                      </div>

                      {/* Progress Track */}
                      <div className="w-full h-1.5 bg-[#090d18] rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isUnlocked
                              ? 'bg-emerald-400'
                              : isReadyToClaim
                              ? 'bg-yellow-400'
                              : 'bg-gradient-to-r from-amber-500 to-amber-600'
                          }`}
                          style={{ width: `${isUnlocked ? 100 : progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Reward Tags */}
                    <div className="mt-3 pt-2 border-t border-[#1c243c] flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-amber-300 font-bold font-mono">
                          <span>🪙</span> +{badge.reward.coins.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-purple-300 font-bold font-mono">
                          <span>💎</span> +{badge.reward.gems}
                        </span>
                      </div>

                      {isClaimed && (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Unlocked
                        </span>
                      )}
                      {!isUnlocked && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-500" /> Locked
                        </span>
                      )}
                    </div>

                    {/* Action Buttons: Claim, Equip, Archive */}
                    <div className="mt-2.5 flex items-center gap-1.5">
                      {isReadyToClaim ? (
                        <button
                          onClick={() => handleClaimReward(badge.id)}
                          className="flex-1 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-black text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(250,204,21,0.4)] transition active:scale-95 animate-pulse"
                        >
                          <Gift className="w-3.5 h-3.5 text-black" />
                          <span>Claim Reward</span>
                        </button>
                      ) : isUnlocked ? (
                        <>
                          <button
                            onClick={() => handleToggleEquip(badge.id)}
                            className={`flex-1 py-1 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1 ${
                              isEquipped
                                ? 'bg-amber-500 text-black border-amber-400'
                                : 'bg-[#161d33] hover:bg-[#1d2746] text-amber-300 border-amber-500/40'
                            }`}
                          >
                            <Star className={`w-3 h-3 ${isEquipped ? 'fill-black text-black' : 'text-amber-400'}`} />
                            <span>{isEquipped ? 'Equipped' : 'Equip'}</span>
                          </button>

                          <button
                            onClick={() => handleToggleArchive(badge.id)}
                            className={`p-1 px-2 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${
                              isArchived
                                ? 'bg-slate-700 hover:bg-slate-600 text-white border-slate-500'
                                : 'bg-[#161d33] hover:bg-[#1d2746] text-slate-400 hover:text-white border-[#242f4c]'
                            }`}
                            title={isArchived ? 'Restore to active showcase' : 'Archive to Vault'}
                          >
                            {isArchived ? (
                              <ArchiveRestore className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <Archive className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </>
                      ) : (
                        <div className="w-full py-1 text-center text-[10px] text-slate-500 bg-[#090d18] rounded-lg border border-slate-800">
                          {progressPct > 0 ? `${progressPct}% complete` : 'Requirement not met'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#0e1424] px-4 sm:px-6 py-3 border-t border-[#242f4c] flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>656 Badges Dynamic System Active</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-amber-300 font-mono font-bold">
              🪙 Earned: {stats.coinsEarned.toLocaleString()} Coins
            </span>
            <span className="text-purple-300 font-mono font-bold">
              💎 Earned: {stats.gemsEarned} Gems
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black rounded-lg transition active:scale-95 shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
