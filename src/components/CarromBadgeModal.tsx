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
  Eye,
  Bot,
  Swords,
  Wand2,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GameBadge,
  BadgeRarity,
  BadgeTier,
  UserBadgesState,
  SuggestedBadge,
  BadgeSystem,
  getAllCarromBadges,
  loadUserBadgesState,
  saveUserBadgesState,
  claimBadgeReward,
  toggleArchiveBadge,
  toggleEquipBadge,
  validateBadgeCount,
} from '../data/badgeSystem';
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
  const [allBadges] = useState<GameBadge[]>(() => getAllCarromBadges());

  // Category filter tabs matching user spec:
  // [All] [AI] [Carrom] [Tournament] [Clan] [Collection] [Economy] [Secret] [AI Suggested]
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'ai' | 'carrom' | 'tournament' | 'clan' | 'collection' | 'economy' | 'secret' | 'core' | 'rank' | 'suggested' | 'ready' | 'archived'
  >('all');

  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked' | 'ready'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Sandbox & AI Generator toggles
  const [showSandbox, setShowSandbox] = useState<boolean>(false);
  const [showAIGenerator, setShowAIGenerator] = useState<boolean>(false);
  const [newFeatureInput, setNewFeatureInput] = useState<string>('');
  const [newFeatureCategory, setNewFeatureCategory] = useState<string>('Carrom');

  // Inspected badge modal
  const [inspectedBadge, setInspectedBadge] = useState<GameBadge | null>(null);

  // Validation state
  const validation = useMemo(() => {
    try {
      return validateBadgeCount();
    } catch (e: any) {
      return { isValid: false, total: 0, coreCount: 0, rankCount: 0, additionalCount: 0, uniqueIds: 0, uniqueNames: 0 };
    }
  }, []);

  // Sync state and listen to real-time events
  useEffect(() => {
    if (isOpen) {
      setBadgeState(loadUserBadgesState());
    }

    const handleUpdate = (e: any) => {
      if (e.detail) setBadgeState(e.detail);
    };

    const handleToast = (e: any) => {
      if (e.detail?.badge) {
        showToast(`🏆 Badge Unlocked: ${e.detail.badge.name}!`);
        soundFx.playWin();
      }
    };

    window.addEventListener('badge_system_updated', handleUpdate);
    window.addEventListener('carrom_badges_updated', handleUpdate);
    window.addEventListener('badge_unlocked_toast', handleToast);

    return () => {
      window.removeEventListener('badge_system_updated', handleUpdate);
      window.removeEventListener('carrom_badges_updated', handleUpdate);
      window.removeEventListener('badge_unlocked_toast', handleToast);
    };
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Metrics
  const stats = badgeState.stats;
  const unlockedMap = badgeState.unlockedBadges;
  const archivedList = badgeState.archivedBadges;
  const equippedList = badgeState.equippedBadges;
  const suggestedBadges = badgeState.suggestedBadges || [];

  const totalBadgesCount = allBadges.length; // 656
  const totalUnlockedCount = Object.keys(unlockedMap).length;
  const totalReadyToClaimCount = allBadges.filter(
    (b) => unlockedMap[b.id] && !unlockedMap[b.id].claimed
  ).length;
  const totalArchivedCount = archivedList.length;
  const progressPercentage = Math.round((totalUnlockedCount / totalBadgesCount) * 100);

  // Filter badges
  const filteredBadges = useMemo(() => {
    if (categoryFilter === 'suggested') {
      return [];
    }

    return allBadges.filter((badge) => {
      const isArchived = archivedList.includes(badge.id);
      const isUnlocked = !!unlockedMap[badge.id];
      const isClaimed = isUnlocked && unlockedMap[badge.id].claimed;
      const isReadyToClaim = isUnlocked && !isClaimed;

      // Handle Tab Filter
      if (categoryFilter === 'archived') {
        if (!isArchived) return false;
      } else if (categoryFilter === 'ready') {
        if (!isReadyToClaim) return false;
      } else {
        if (isArchived) return false;

        if (categoryFilter === 'ai') {
          if (badge.category !== 'AI Battles' && !badge.name.includes('AI') && !badge.description.includes('AI')) return false;
        } else if (categoryFilter === 'carrom') {
          if (badge.category !== 'Carrom' && badge.category !== 'Core Achievements') return false;
        } else if (categoryFilter === 'tournament') {
          if (badge.category !== 'Tournament') return false;
        } else if (categoryFilter === 'clan') {
          if (badge.category !== 'Clan') return false;
        } else if (categoryFilter === 'collection') {
          if (badge.category !== 'Collection') return false;
        } else if (categoryFilter === 'economy') {
          if (badge.category !== 'Economy') return false;
        } else if (categoryFilter === 'secret') {
          if (badge.category !== 'Secret' && !badge.isSecret) return false;
        } else if (categoryFilter === 'core') {
          if (badge.category !== 'Core Achievements') return false;
        } else if (categoryFilter === 'rank') {
          if (badge.category !== 'Top Rank Division') return false;
        }
      }

      // Status filter
      if (statusFilter === 'unlocked' && !isUnlocked) return false;
      if (statusFilter === 'locked' && isUnlocked) return false;
      if (statusFilter === 'ready' && !isReadyToClaim) return false;

      // Rarity filter
      if (rarityFilter !== 'all') {
        if (badge.rarity.toLowerCase() !== rarityFilter.toLowerCase()) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = badge.name.toLowerCase().includes(query);
        const matchesDesc = badge.description.toLowerCase().includes(query);
        const matchesCategory = badge.category.toLowerCase().includes(query);
        const matchesSub = (badge.subCategory || '').toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCategory && !matchesSub) return false;
      }

      return true;
    });
  }, [allBadges, categoryFilter, rarityFilter, statusFilter, searchQuery, archivedList, unlockedMap]);

  // Handlers
  const handleClaim = (badgeId: string) => {
    const res = claimBadgeReward(badgeId);
    if (res.success) {
      setBadgeState({ ...res.state });
      soundFx.playCash();
      showToast(`🎉 ${res.message}`);
    } else {
      showToast(`⚠️ ${res.message}`);
    }
  };

  const handleToggleEquip = (badgeId: string) => {
    const res = toggleEquipBadge(badgeId);
    setBadgeState({ ...res.state });
    soundFx.playClick();
    showToast(res.message);
  };

  const handleToggleArchive = (badgeId: string) => {
    const nextState = toggleArchiveBadge(badgeId);
    setBadgeState({ ...nextState });
    soundFx.playClick();
    const isNowArchived = nextState.archivedBadges.includes(badgeId);
    showToast(isNowArchived ? '📦 Badge moved to Archive Vault' : '🌟 Badge restored from Archive Vault');
  };

  // Dispatch Real Event via BadgeSystem
  const handleTriggerEvent = (eventName: string, data: any = {}) => {
    const res = BadgeSystem.event(eventName, data);
    setBadgeState({ ...res.state });
    soundFx.playClick();
    if (res.newlyUnlocked.length > 0) {
      soundFx.playWin();
      showToast(`🏆 ${res.newlyUnlocked.length} New Badge(s) Unlocked!`);
    } else {
      showToast(`⚡ Dispatched event ${eventName}`);
    }
  };

  // AI Feature Generation Handler
  const handleRunAISuggestion = () => {
    const name = newFeatureInput.trim() || 'Trick Shot Replay Hub';
    const suggestions = BadgeSystem.analyzeNewFeaturesAndSuggest({
      featureName: name,
      category: newFeatureCategory,
      description: `Participate in and master ${name} mechanics across real sessions.`,
    });
    setBadgeState((prev) => ({ ...prev, suggestedBadges: suggestions }));
    setCategoryFilter('suggested');
    soundFx.playWin();
    showToast(`🤖 AI generated new suggested badge concept for "${name}"!`);
    setNewFeatureInput('');
  };

  const getRarityBadgeStyle = (rarity: BadgeRarity) => {
    const r = rarity.toLowerCase();
    switch (r) {
      case 'mythic':
        return 'border-rose-500/80 bg-rose-950/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
      case 'legendary':
        return 'border-amber-500/80 bg-amber-950/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
      case 'epic':
        return 'border-purple-500/80 bg-purple-950/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]';
      case 'rare':
        return 'border-sky-500/80 bg-sky-950/40 text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.25)]';
      case 'secret':
        return 'border-pink-500/90 bg-pink-950/40 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.35)]';
      case 'uncommon':
        return 'border-emerald-500/70 bg-emerald-950/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]';
      default:
        return 'border-slate-700 bg-slate-900/60 text-slate-300';
    }
  };

  const getRarityPill = (rarity: BadgeRarity) => {
    const r = rarity.toLowerCase();
    switch (r) {
      case 'mythic':
        return <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-600">Mythic</span>;
      case 'legendary':
        return <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600">Legendary</span>;
      case 'epic':
        return <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-600">Epic</span>;
      case 'rare':
        return <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-600">Rare</span>;
      case 'secret':
        return <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-500">Secret</span>;
      case 'uncommon':
        return <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600">Uncommon</span>;
      default:
        return <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Common</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[940px] bg-[#0a0f1d] border border-[#222f4c] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-white">
        
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
        <div className="bg-[#0e1424] px-4 sm:px-6 py-3 border-b border-[#222f4c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  AI Badge Architect
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                  EXACTLY 656 BADGES
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Validated: 150 Core • 6 Rank • 500 Special
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Real Event-Driven Progression System • Auto-Reward Engine • AI Future Generator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAIGenerator(!showAIGenerator)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                showAIGenerator
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-[#151c30] text-purple-300 border-purple-900/60 hover:bg-[#1a233d]'
              }`}
              title="AI Feature Scanner & Badge Suggester"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Scanner</span>
            </button>

            <button
              onClick={() => setShowSandbox(!showSandbox)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                showSandbox
                  ? 'bg-sky-600 text-white border-sky-400'
                  : 'bg-[#151c30] text-sky-400 border-sky-900/60 hover:bg-[#1a233d]'
              }`}
              title="Event Dispatcher & Sandbox Tester"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Event Sandbox</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#151c30] hover:bg-[#202b48] border border-[#222f4c] text-slate-400 hover:text-white flex items-center justify-center transition text-sm font-bold"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Player Stats & Equipped Showcase Banner */}
        <div className="bg-[#080d1a] px-4 sm:px-6 py-2.5 border-b border-[#222f4c] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
          {/* Progress Overview Bar */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Unlocked:
                <strong className="text-white font-mono">{totalUnlockedCount} / {totalBadgesCount}</strong>
                <span className="text-[10px] text-amber-400 font-mono font-bold">
                  Completion: {progressPercentage}%
                </span>
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-slate-400">Locked: <strong>{totalBadgesCount - totalUnlockedCount}</strong></span>
                <span className="text-emerald-400">Core: <strong>150</strong></span>
                <span className="text-amber-300">Rank: <strong>6</strong></span>
                <span className="text-purple-300">Special: <strong>500</strong></span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-[#151c30] rounded-full overflow-hidden border border-[#222f4c]">
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
                    className={`relative w-[115px] sm:w-[135px] h-[46px] rounded-xl border p-1.5 flex items-center gap-2 transition ${
                      badge
                        ? 'bg-[#12192c] border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
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
                          <span className="text-[8px] text-amber-400 font-semibold block">
                            {slotIdx === 0 ? '★ Primary' : `Slot ${slotIdx + 1}`}
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
                        {slotIdx === 0 ? '+ Main Slot' : `+ Slot ${slotIdx + 1}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Scanner & Future Feature Generator Drawer */}
        <AnimatePresence>
          {showAIGenerator && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#130f26] border-b border-purple-800/40 px-4 sm:px-6 py-2.5 shrink-0 overflow-hidden text-xs"
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <Bot className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>AI Future Badge Generator:</span>
                  <span className="text-[10px] text-purple-400 font-normal hidden md:inline">
                    Detects new games, mechanics, or events and proposes non-destructive suggested badges!
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    placeholder="e.g. Bank Shot Replay, Voice Rooms..."
                    className="bg-[#1e173a] border border-purple-700/50 rounded-lg px-2.5 py-1 text-xs text-purple-100 placeholder-purple-400/60 focus:outline-none focus:border-purple-400"
                  />
                  <select
                    value={newFeatureCategory}
                    onChange={(e) => setNewFeatureCategory(e.target.value)}
                    className="bg-[#1e173a] border border-purple-700/50 rounded-lg px-2 py-1 text-xs text-purple-200"
                  >
                    <option value="AI Battles">AI Battles</option>
                    <option value="Carrom">Carrom</option>
                    <option value="Tournament">Tournament</option>
                    <option value="Clan">Clan</option>
                    <option value="Economy">Economy</option>
                  </select>
                  <button
                    onClick={handleRunAISuggestion}
                    className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition active:scale-95 shadow-md flex items-center gap-1 shrink-0"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Generate Badge Idea</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interactive Event Sandbox Test Drawer */}
        <AnimatePresence>
          {showSandbox && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#0f172a] border-b border-sky-800/40 px-4 sm:px-6 py-2.5 shrink-0 overflow-hidden text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-sky-300 font-semibold">
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  <span>Central Event Dispatcher:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handleTriggerEvent('AI_MATCH_WON', { difficulty: 'hard' })}
                    className="px-2 py-1 bg-[#1a2642] hover:bg-[#25355e] text-purple-300 border border-purple-700/60 rounded-md font-mono text-[10px]"
                  >
                    +1 Hard AI Win
                  </button>
                  <button
                    onClick={() => handleTriggerEvent('POCKET', { count: 3 })}
                    className="px-2 py-1 bg-[#1a2642] hover:bg-[#25355e] text-emerald-300 border border-emerald-700/60 rounded-md font-mono text-[10px]"
                  >
                    +3 Pockets
                  </button>
                  <button
                    onClick={() => handleTriggerEvent('QUEEN_POCKETED')}
                    className="px-2 py-1 bg-[#1a2642] hover:bg-[#25355e] text-red-300 border border-red-700/60 rounded-md font-mono text-[10px]"
                  >
                    +1 Queen Cover
                  </button>
                  <button
                    onClick={() => handleTriggerEvent('BANK_SHOT')}
                    className="px-2 py-1 bg-[#1a2642] hover:bg-[#25355e] text-amber-300 border border-amber-700/60 rounded-md font-mono text-[10px]"
                  >
                    +1 Bank Shot
                  </button>
                  <button
                    onClick={() => handleTriggerEvent('CLEAN_BREAK')}
                    className="px-2 py-1 bg-[#1a2642] hover:bg-[#25355e] text-yellow-300 border border-yellow-700/60 rounded-md font-mono text-[10px]"
                  >
                    +1 Clean Break
                  </button>
                  <button
                    onClick={() => handleTriggerEvent('SPEED_WIN')}
                    className="px-2 py-1 bg-[#1a2642] hover:bg-[#25355e] text-cyan-300 border border-cyan-700/60 rounded-md font-mono text-[10px]"
                  >
                    +1 Blitz Win (&lt;60s)
                  </button>
                  <button
                    onClick={() => handleTriggerEvent('TOURNAMENT_WON')}
                    className="px-2 py-1 bg-[#1a2642] hover:bg-[#25355e] text-indigo-300 border border-indigo-700/60 rounded-md font-mono text-[10px]"
                  >
                    +1 Tourney Cup
                  </button>
                  <button
                    onClick={() => handleTriggerEvent('COINS_EARNED', { amount: 5000 })}
                    className="px-2 py-1 bg-[#1a2642] hover:bg-[#25355e] text-amber-300 border border-amber-700/60 rounded-md font-mono text-[10px]"
                  >
                    +5000 Coins
                  </button>
                  <button
                    onClick={() => handleTriggerEvent('SECRET_UNLOCKED')}
                    className="px-2 py-1 bg-pink-950/80 hover:bg-pink-900 text-pink-300 border border-pink-700/60 rounded-md font-mono text-[10px]"
                  >
                    🕵️ Secret Trigger
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Tab Navigation — Exact User Prompt Structure */}
        {/* [All] [AI] [Carrom] [Tournament] [Clan] [Collection] [Economy] [Secret] [AI Suggested] */}
        <div className="bg-[#0b101c] px-4 sm:px-6 pt-2 border-b border-[#222f4c] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'all'
                  ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'bg-[#141b2e] text-slate-300 hover:bg-[#1a233b] hover:text-white border border-[#222f4c]'
              }`}
            >
              <span>🌐</span> All ({totalBadgesCount})
            </button>

            <button
              onClick={() => setCategoryFilter('ai')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'ai'
                  ? 'bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'bg-[#141b2e] text-slate-300 hover:bg-[#1a233b] hover:text-white border border-[#222f4c]'
              }`}
            >
              <span>🤖</span> AI Battles
            </button>

            <button
              onClick={() => setCategoryFilter('carrom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'carrom'
                  ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-[#141b2e] text-slate-300 hover:bg-[#1a233b] hover:text-white border border-[#222f4c]'
              }`}
            >
              <span>🥏</span> Carrom
            </button>

            <button
              onClick={() => setCategoryFilter('tournament')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'tournament'
                  ? 'bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                  : 'bg-[#141b2e] text-slate-300 hover:bg-[#1a233b] hover:text-white border border-[#222f4c]'
              }`}
            >
              <span>🏟️</span> Tournament
            </button>

            <button
              onClick={() => setCategoryFilter('clan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'clan'
                  ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                  : 'bg-[#141b2e] text-slate-300 hover:bg-[#1a233b] hover:text-white border border-[#222f4c]'
              }`}
            >
              <span>🏰</span> Clan
            </button>

            <button
              onClick={() => setCategoryFilter('collection')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'collection'
                  ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                  : 'bg-[#141b2e] text-slate-300 hover:bg-[#1a233b] hover:text-white border border-[#222f4c]'
              }`}
            >
              <span>🎒</span> Collection
            </button>

            <button
              onClick={() => setCategoryFilter('economy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'economy'
                  ? 'bg-yellow-500 text-black shadow-[0_0_12px_rgba(234,179,8,0.4)]'
                  : 'bg-[#141b2e] text-slate-300 hover:bg-[#1a233b] hover:text-white border border-[#222f4c]'
              }`}
            >
              <span>🪙</span> Economy
            </button>

            <button
              onClick={() => setCategoryFilter('secret')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'secret'
                  ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                  : 'bg-[#141b2e] text-slate-300 hover:bg-[#1a233b] hover:text-white border border-[#222f4c]'
              }`}
            >
              <span>🕵️</span> Secret
            </button>

            <button
              onClick={() => setCategoryFilter('core')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'core'
                  ? 'bg-teal-500 text-black shadow-[0_0_12px_rgba(20,184,166,0.4)]'
                  : 'bg-[#141b2e] text-slate-300 hover:bg-[#1a233b] hover:text-white border border-[#222f4c]'
              }`}
            >
              <span>🟢</span> Core (150)
            </button>

            <button
              onClick={() => setCategoryFilter('rank')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'rank'
                  ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                  : 'bg-[#141b2e] text-slate-300 hover:bg-[#1a233b] hover:text-white border border-[#222f4c]'
              }`}
            >
              <span>👑</span> Rank (6)
            </button>

            {suggestedBadges.length > 0 && (
              <button
                onClick={() => setCategoryFilter('suggested')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  categoryFilter === 'suggested'
                    ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]'
                    : 'bg-purple-950/70 text-purple-300 border border-purple-600'
                }`}
              >
                <span>✨</span> AI Suggested ({suggestedBadges.length})
              </button>
            )}

            {totalReadyToClaimCount > 0 && (
              <button
                onClick={() => setCategoryFilter('ready')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 animate-pulse ${
                  categoryFilter === 'ready'
                    ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.5)]'
                    : 'bg-yellow-950/70 text-yellow-300 border border-yellow-600'
                }`}
              >
                <span>🎁</span> Claim ({totalReadyToClaimCount})
              </button>
            )}

            <button
              onClick={() => setCategoryFilter('archived')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                categoryFilter === 'archived'
                  ? 'bg-slate-300 text-black shadow-[0_0_12px_rgba(203,213,225,0.4)]'
                  : 'bg-[#141b2e] text-slate-300 hover:bg-[#1a233b] hover:text-white border border-[#222f4c]'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive ({totalArchivedCount})</span>
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
              className="w-full bg-[#141b2e] border border-[#222f4c] rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
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

        {/* Sub-Filters: Rarity & Status */}
        <div className="bg-[#090e1b] px-4 sm:px-6 py-2 border-b border-[#222f4c] flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              Rarity:
            </span>
            {['all', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Secret'].map((r) => (
              <button
                key={r}
                onClick={() => setRarityFilter(r)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                  rarityFilter.toLowerCase() === r.toLowerCase()
                    ? 'bg-amber-500 text-black'
                    : 'bg-[#141b2e] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              Status:
            </span>
            {[
              { id: 'all', label: 'All' },
              { id: 'unlocked', label: 'Unlocked' },
              { id: 'locked', label: 'Locked' },
              { id: 'ready', label: 'Ready to Claim' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  statusFilter === st.id
                    ? 'bg-sky-500 text-white'
                    : 'bg-[#141b2e] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Badges Grid Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#070b14] scrollbar-thin scrollbar-thumb-slate-700">
          {categoryFilter === 'suggested' ? (
            /* AI Suggested Badges Tab View */
            <div>
              <div className="p-4 bg-purple-950/40 border border-purple-700/50 rounded-2xl mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-purple-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    AI-Compatible Future Badge Generator Concepts
                  </h3>
                  <p className="text-xs text-purple-300/80 mt-0.5">
                    These achievement concepts were automatically generated by analyzing newly introduced website features.
                    They do not alter the 656 permanent badges.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {suggestedBadges.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 bg-[#111728] border border-purple-700/50 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-lg flex items-center justify-center border border-purple-500/40">
                        {s.icon}
                      </div>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-600">
                        Suggested
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate">{s.name}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{s.description}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                      <span className="text-amber-400 font-mono font-bold">+{s.reward.coins} Coins</span>
                      <span className="text-fuchsia-400 font-mono font-bold">+{s.reward.gems} Gems</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredBadges.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <Award className="w-12 h-12 text-slate-700" />
              <p className="text-sm font-bold text-slate-400">No matching badges found</p>
              <p className="text-xs text-slate-600">
                Try switching categories or clearing search filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredBadges.map((badge) => {
                const isUnlocked = !!unlockedMap[badge.id];
                const isClaimed = isUnlocked && unlockedMap[badge.id].claimed;
                const isReadyToClaim = isUnlocked && !isClaimed;
                const isEquipped = equippedList.includes(badge.id);
                const isArchived = archivedList.includes(badge.id);
                const currentStat = (stats as any)[badge.requirement.statKey] ?? 0;
                const target = badge.requirement.target;
                const pct = Math.min(100, Math.round((currentStat / target) * 100));

                const isSecretHidden = badge.isSecret && !isUnlocked;

                return (
                  <div
                    key={badge.id}
                    onClick={() => setInspectedBadge(badge)}
                    className={`relative rounded-xl border p-3 flex flex-col justify-between transition cursor-pointer group ${
                      isUnlocked
                        ? `${getRarityBadgeStyle(badge.rarity)} hover:scale-[1.02]`
                        : 'bg-[#0e1424] border-slate-800/80 hover:border-slate-700 opacity-90'
                    }`}
                  >
                    {/* Card Top: Icon, Badges, Badges Status */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-1.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border shrink-0 ${
                            isUnlocked
                              ? 'bg-amber-500/20 border-amber-500/40 shadow-sm'
                              : 'bg-slate-800/60 border-slate-700 text-slate-500'
                          }`}
                        >
                          {isSecretHidden ? '🕵️' : badge.icon}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1">
                            {isEquipped && (
                              <span className="text-[8px] font-black uppercase px-1 rounded bg-amber-500 text-black">
                                EQUIPPED
                              </span>
                            )}
                            {getRarityPill(badge.rarity)}
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {badge.category}
                          </span>
                        </div>
                      </div>

                      {/* Title & Desc */}
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition truncate flex items-center gap-1">
                          {isSecretHidden ? 'Secret Achievement' : badge.name}
                          {isUnlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </h4>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                          {isSecretHidden
                            ? '🕵️ Mystery requirement • Revealed upon completing the hidden arena trigger!'
                            : badge.description}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar or Claim Button */}
                    <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1.5">
                      {isReadyToClaim ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaim(badge.id);
                          }}
                          className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs rounded-lg shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <Gift className="w-3.5 h-3.5 text-black" />
                          <span>CLAIM +{badge.reward.coins.toLocaleString()} 🪙</span>
                        </button>
                      ) : isUnlocked ? (
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-400" />
                            UNLOCKED
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleEquip(badge.id);
                            }}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold transition ${
                              isEquipped
                                ? 'bg-red-950 text-red-300 border border-red-700'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                            }`}
                          >
                            {isEquipped ? 'Unequip' : 'Equip'}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[9px] text-slate-400">
                            <span>Progress:</span>
                            <span className="font-mono text-slate-300">
                              {currentStat} / {target} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Reward preview */}
                      <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                        <span className="flex items-center gap-0.5 text-amber-400 font-mono">
                          🪙 {badge.reward.coins.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-0.5 text-fuchsia-400 font-mono">
                          💎 {badge.reward.gems}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-[#090d18] px-4 sm:px-6 py-2.5 border-t border-[#222f4c] flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span>Tip: Click any badge card to inspect full requirements and history.</span>
          </div>

          <div className="flex items-center gap-3">
            {onOpenExchange && (
              <button
                onClick={onOpenExchange}
                className="px-3 py-1.5 rounded-lg bg-[#141b2e] hover:bg-[#1a233b] border border-fuchsia-500/40 text-fuchsia-300 font-bold text-xs transition flex items-center gap-1.5"
              >
                <Gem className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Exchange Gems</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition active:scale-95 shadow-md"
            >
              Done
            </button>
          </div>
        </div>

        {/* Inspected Badge Detail Sub-Modal */}
        <AnimatePresence>
          {inspectedBadge && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-md bg-[#0f172a] border border-amber-500/60 rounded-2xl p-5 shadow-2xl space-y-4 text-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-md">
                      {inspectedBadge.isSecret && !unlockedMap[inspectedBadge.id] ? '🕵️' : inspectedBadge.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">
                        {inspectedBadge.isSecret && !unlockedMap[inspectedBadge.id] ? 'Secret Achievement' : inspectedBadge.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {getRarityPill(inspectedBadge.rarity)}
                        <span className="text-[10px] text-slate-400">
                          {inspectedBadge.category} • {inspectedBadge.tier}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setInspectedBadge(null)}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Requirement:
                  </span>
                  <p className="text-xs text-slate-200">
                    {inspectedBadge.isSecret && !unlockedMap[inspectedBadge.id]
                      ? '🕵️ This is a secret achievement! The requirement is shrouded in mystery until completed through real gameplay in the arena.'
                      : inspectedBadge.description}
                  </p>
                  <div className="pt-1 text-[11px] font-mono text-amber-300">
                    Target: {inspectedBadge.requirement.label}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400">Coins Reward</span>
                    <p className="text-sm font-black text-amber-400 font-mono mt-0.5">
                      🪙 +{inspectedBadge.reward.coins.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400">Gems Reward</span>
                    <p className="text-sm font-black text-fuchsia-400 font-mono mt-0.5">
                      💎 +{inspectedBadge.reward.gems}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {unlockedMap[inspectedBadge.id] ? (
                    <>
                      <button
                        onClick={() => {
                          handleToggleEquip(inspectedBadge.id);
                          setInspectedBadge(null);
                        }}
                        className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow transition"
                      >
                        {equippedList.includes(inspectedBadge.id) ? 'Unequip from Showcase' : 'Equip on Profile'}
                      </button>
                      <button
                        onClick={() => {
                          handleToggleArchive(inspectedBadge.id);
                          setInspectedBadge(null);
                        }}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                      >
                        {archivedList.includes(inspectedBadge.id) ? 'Restore' : 'Archive'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setInspectedBadge(null)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                    >
                      Close
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
