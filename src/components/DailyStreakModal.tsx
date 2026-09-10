import React, { useState, useEffect } from 'react';
import { X, Calendar, Gift, Flame, CheckCircle2, Clock, Sparkles, Trophy, Award, ArrowRight } from 'lucide-react';
import { getUserPoints, getUserGems, setUserPoints, setUserGems } from '../utils/pointsManager';
import { soundFx } from '../utils/audio';

interface DailyRewardDay {
  day: number;
  coins: number;
  gems: number;
  badge?: string;
  isGrandPrize?: boolean;
}

const STREAK_DAYS: DailyRewardDay[] = [
  { day: 1, coins: 500, gems: 0 },
  { day: 2, coins: 1000, gems: 2 },
  { day: 3, coins: 2000, gems: 5 },
  { day: 4, coins: 3500, gems: 10 },
  { day: 5, coins: 5000, gems: 15 },
  { day: 6, coins: 7500, gems: 25 },
  { day: 7, coins: 15000, gems: 100, badge: 'Streak Legend Badge', isGrandPrize: true },
];

const STREAK_STORAGE_KEY = 'user_daily_streak_data';

export interface DailyStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim?: (coins: number, gems: number) => void;
  onNotification?: (text: string, type?: 'success' | 'warning' | 'error') => void;
}

export const DailyStreakModal: React.FC<DailyStreakModalProps> = ({
  isOpen,
  onClose,
  onClaim,
  onNotification,
}) => {
  const [streakData, setStreakData] = useState<{
    currentDay: number;
    lastClaimTimestamp: number;
    claimedDays: number[];
  }>(() => {
    try {
      const raw = localStorage.getItem(STREAK_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { currentDay: 1, lastClaimTimestamp: 0, claimedDays: [] };
  });

  const [isOpeningChest, setIsOpeningChest] = useState<boolean>(false);
  const [revealedChestReward, setRevealedChestReward] = useState<{ coins: number; gems: number; badge?: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(STREAK_STORAGE_KEY);
      if (raw) setStreakData(JSON.parse(raw));
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const timeSinceLastClaim = now - streakData.lastClaimTimestamp;
  const canClaimToday = streakData.lastClaimTimestamp === 0 || timeSinceLastClaim >= ONE_DAY_MS;

  const handleClaimDay = (reward: DailyRewardDay) => {
    if (!canClaimToday) {
      soundFx.playError();
      if (onNotification) onNotification('You have already claimed today! Return tomorrow for your next reward.', 'warning');
      return;
    }

    if (reward.isGrandPrize) {
      setIsOpeningChest(true);
      soundFx.playWin();
      setTimeout(() => {
        setIsOpeningChest(false);
        setRevealedChestReward({ coins: reward.coins, gems: reward.gems, badge: reward.badge });
        finishClaim(reward);
      }, 1500);
    } else {
      soundFx.playCash();
      finishClaim(reward);
    }
  };

  const finishClaim = (reward: DailyRewardDay) => {
    // Add coins and gems
    const curCoins = getUserPoints();
    const curGems = getUserGems();
    setUserPoints(curCoins + reward.coins, `Claimed Day ${reward.day} Streak Reward`);
    if (reward.gems > 0) {
      setUserGems(curGems + reward.gems, `Claimed Day ${reward.day} Streak Reward`);
    }

    const nextClaimedDays = [...streakData.claimedDays, reward.day];
    const nextDay = reward.day >= 7 ? 1 : reward.day + 1;
    const nextState = {
      currentDay: nextDay,
      lastClaimTimestamp: Date.now(),
      claimedDays: reward.day >= 7 ? [] : nextClaimedDays,
    };

    setStreakData(nextState);
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(nextState));

    if (onNotification) {
      onNotification(
        `🎉 Claimed Day ${reward.day}! +🪙 ${reward.coins.toLocaleString()} Coins${reward.gems > 0 ? ` + 💎 ${reward.gems} Gems` : ''}!`,
        'success'
      );
    }
    if (onClaim) onClaim(reward.coins, reward.gems);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-[#0b0f19] border border-amber-500/40 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden text-slate-100 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#080c14]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <Flame className="w-6 h-6 fill-current text-slate-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <span>7-Day Login Streak Rewards</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  DAY {streakData.currentDay}/7
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Log in every day to claim bonus currency & unlock the Day 7 Mythic Chest
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Status banner */}
          <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-white">
                  Streak Status:{' '}
                  <span className={canClaimToday ? 'text-emerald-400' : 'text-amber-400'}>
                    {canClaimToday ? 'Ready to Claim Today!' : 'Claimed for Today (Next in < 24h)'}
                  </span>
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  Keep your daily streak uninterrupted to preserve Day 7 unlock progress.
                </p>
              </div>
            </div>

            {canClaimToday && (
              <button
                onClick={() => handleClaimDay(STREAK_DAYS[streakData.currentDay - 1])}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase font-mono tracking-wider shadow-lg active:scale-95 transition"
              >
                Claim Day {streakData.currentDay}
              </button>
            )}
          </div>

          {/* 7-Day Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STREAK_DAYS.slice(0, 6).map((item) => {
              const isClaimed = streakData.claimedDays.includes(item.day);
              const isCurrent = streakData.currentDay === item.day;

              return (
                <div
                  key={item.day}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between items-center text-center relative transition ${
                    isClaimed
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400'
                      : isCurrent
                      ? 'bg-amber-500/10 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider font-mono text-slate-400 mb-1">
                    Day {item.day}
                  </span>

                  <div className="my-2">
                    <Gift className={`w-7 h-7 ${isClaimed ? 'text-emerald-400' : isCurrent ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-xs font-mono font-bold text-amber-300">
                      +{item.coins.toLocaleString()}
                    </p>
                    {item.gems > 0 && (
                      <p className="text-[11px] font-mono font-bold text-fuchsia-300">
                        +💎 {item.gems}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 w-full">
                    {isClaimed ? (
                      <span className="w-full py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase flex items-center justify-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Done</span>
                      </span>
                    ) : isCurrent && canClaimToday ? (
                      <button
                        onClick={() => handleClaimDay(item)}
                        className="w-full py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black uppercase font-mono shadow active:scale-95 transition"
                      >
                        Claim
                      </button>
                    ) : (
                      <span className="w-full py-1 rounded-lg bg-slate-800 text-slate-500 text-[10px] font-bold uppercase font-mono block">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Day 7 Grand Mystery Chest Card (spans 2 cols on mobile, 2 cols on desktop) */}
            <div
              className={`col-span-2 p-4 rounded-2xl border flex items-center justify-between relative overflow-hidden transition ${
                streakData.claimedDays.includes(7)
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : streakData.currentDay === 7
                  ? 'bg-gradient-to-br from-amber-500/20 via-purple-900/30 to-fuchsia-900/20 border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                  : 'bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border-amber-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30">
                  <Trophy className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono">
                      DAY 7 GRAND PRIZE
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white font-mono mt-0.5">
                    Mythic Jackpot Chest
                  </h4>
                  <p className="text-xs text-amber-300 font-mono">
                    +🪙 15,000 Coins • +💎 100 Gems • Mythic Badge
                  </p>
                </div>
              </div>

              <div>
                {streakData.claimedDays.includes(7) ? (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold font-mono uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Claimed</span>
                  </span>
                ) : streakData.currentDay === 7 && canClaimToday ? (
                  <button
                    onClick={() => handleClaimDay(STREAK_DAYS[6])}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase font-mono shadow-lg active:scale-95 transition"
                  >
                    Open Chest
                  </button>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold font-mono uppercase">
                    Day 7 Goal
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Chest opening modal/overlay if triggered */}
          {revealedChestReward && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-purple-600/20 border border-amber-400/50 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-amber-400 animate-spin" />
                <div>
                  <p className="text-sm font-bold text-white font-mono">
                    🎉 Grand Chest Unboxed!
                  </p>
                  <p className="text-xs text-amber-300 font-mono">
                    Received 🪙 {revealedChestReward.coins.toLocaleString()} Coins + 💎 {revealedChestReward.gems} Gems + {revealedChestReward.badge}!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRevealedChestReward(null)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase font-mono"
              >
                Awesome!
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#080c14] flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Streak resets if you miss 48 continuous hours.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase tracking-wider transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
