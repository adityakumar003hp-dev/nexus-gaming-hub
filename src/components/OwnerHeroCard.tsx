import React, { useState, useEffect } from 'react';
import { CheckCircle2, Flame, Trophy, UserCheck, Gamepad2, ChevronRight, Coins, Sparkles } from 'lucide-react';
import { UserSession } from '../types';
import { isSiteOwner } from '../utils/owner';
import { getUserPoints, getUserGems } from '../utils/pointsManager';
import { getDefaultGuestHandle } from '../utils/auth';
import { getDailyStreakCount, isDailyStreakClaimAvailable, getDailyStreakData } from '../utils/streakManager';

interface OwnerHeroCardProps {
  currentUser?: UserSession | null;
  onOpenProfile?: () => void;
  onOpenDailyWheel?: () => void;
  onOpenDailyStreak?: () => void;
  onOpenExchange?: (direction?: 'gemToCoin' | 'coinToGem') => void;
  onOpenLeaderboard?: () => void;
  onOpenGoogleAuth?: () => void;
  onOpenMatchmaking?: () => void;
  onOpenTournaments?: () => void;
  onOpenAdminPanel?: () => void;
}

export const OwnerHeroCard: React.FC<OwnerHeroCardProps> = ({
  currentUser = null,
  onOpenProfile,
  onOpenDailyWheel,
  onOpenDailyStreak,
  onOpenExchange,
  onOpenLeaderboard,
  onOpenGoogleAuth,
  onOpenMatchmaking,
  onOpenTournaments,
  onOpenAdminPanel,
}) => {
  const username = currentUser?.username || (currentUser?.isGuest ? getDefaultGuestHandle() : getDefaultGuestHandle());
  const isOwner = currentUser ? isSiteOwner(currentUser.username || currentUser.email) : false;

  const [streak, setStreak] = useState<number>(() => {
    return currentUser?.dailyStreak || currentUser?.stats?.streakDays || getDailyStreakCount();
  });
  const [canClaimStreak, setCanClaimStreak] = useState<boolean>(() => isDailyStreakClaimAvailable());
  const [streakData, setStreakData] = useState(() => getDailyStreakData());

  const [score, setScore] = useState<number>(() => {
    return getUserPoints();
  });
  const [gems, setGems] = useState<number>(() => {
    return getUserGems();
  });

  useEffect(() => {
    setScore(getUserPoints());
    setGems(getUserGems());
    setStreak(currentUser?.dailyStreak || currentUser?.stats?.streakDays || getDailyStreakCount());
    setCanClaimStreak(isDailyStreakClaimAvailable());
    setStreakData(getDailyStreakData());

    const handlePointsUpdated = (e: any) => {
      const newPoints = e.detail?.points ?? getUserPoints();
      setScore(newPoints);
    };

    const handleGemsUpdated = (e: any) => {
      const newGems = e.detail?.gems ?? getUserGems();
      setGems(newGems);
    };

    const handleStreakUpdated = (e: any) => {
      const updatedStreak = e.detail?.streak ?? getDailyStreakCount();
      setStreak(updatedStreak);
      setCanClaimStreak(isDailyStreakClaimAvailable());
      setStreakData(e.detail?.streakData ?? getDailyStreakData());
    };

    window.addEventListener('chess_points_updated', handlePointsUpdated);
    window.addEventListener('chess_gems_updated', handleGemsUpdated);
    window.addEventListener('chess_streak_updated', handleStreakUpdated);

    return () => {
      window.removeEventListener('chess_points_updated', handlePointsUpdated);
      window.removeEventListener('chess_gems_updated', handleGemsUpdated);
      window.removeEventListener('chess_streak_updated', handleStreakUpdated);
    };
  }, [currentUser]);

  return (
    <div className="w-full bg-gradient-to-r from-[#0b0f24] via-[#0d102e] to-[#120f30] border border-indigo-900/60 rounded-3xl p-5 sm:p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden">
      {/* Background glow flares */}
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-12 -translate-y-1/2 w-80 h-80 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-1/3 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6 relative z-10">
        
        {/* Left Column: Avatar + Handle + Badges + Profile link */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1">
          {/* Avatar with faceted neon crystal frame */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="relative cursor-pointer group shrink-0 text-left"
            title="Click to view full user profile & stats"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-indigo-950 via-purple-900 to-fuchsia-950 p-1.5 shadow-[0_0_30px_rgba(147,51,234,0.45)] border-2 border-purple-500/60 group-hover:scale-105 transition-transform duration-300 relative">
              <div className="w-full h-full rounded-xl bg-[#070b18] flex items-center justify-center text-3xl sm:text-4xl border border-purple-400/30">
                {isOwner ? '👑' : '🎮'}
              </div>
            </div>
            {/* Online Indicator Badge */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#030712] border border-emerald-500/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-[9px] font-black text-emerald-400 tracking-wider">ONLINE</span>
            </div>
          </button>

          {/* User Details */}
          <div className="space-y-1.5 text-left flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onOpenProfile}
                className="text-xl sm:text-2xl font-black text-white hover:text-sky-300 tracking-wider uppercase flex items-center gap-2 transition text-left font-mono"
              >
                <span>{username.toUpperCase()}</span>
                {isOwner && <CheckCircle2 className="w-5 h-5 text-sky-400 fill-sky-400/20" />}
              </button>

              {/* Badges */}
              <div className="flex items-center gap-2">
                {isOwner ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenAdminPanel) onOpenAdminPanel();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-[11px] font-black tracking-wider flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
                      title="Click to open Command & Control Center"
                    >
                      <span>👑</span>
                      <span>SITE OWNER</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenAdminPanel) onOpenAdminPanel();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300 text-[11px] font-black tracking-wider flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
                      title="Click to open Command & Control Center"
                    >
                      <span>♟️</span>
                      <span>FOUNDER</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 text-[11px] font-black tracking-wider flex items-center gap-1.5 shadow-sm">
                      <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>COMPETITIVE PLAYER</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300 text-[11px] font-bold tracking-wider">
                      UNRANKED
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-400 font-medium">
              <span className={isOwner ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                {isOwner ? 'Rank: #1 (Verified Owner)' : 'Rank: Unranked (Play to climb)'}
              </span>
              <span className="text-slate-600">•</span>
              <span>{isOwner ? 'Platform Creator & Owner' : 'Active Gamer'}</span>
            </div>

            {/* Direct Profile Link Button */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={onOpenProfile}
                className="text-xs sm:text-sm font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition group/link"
              >
                <span className="group-hover/link:underline">View User Profile &amp; Stats</span>
                <ChevronRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Daily Streak & Score / Coins Badges (Bottom row inside hero) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Daily Streak Card */}
              <div 
                id="hero-daily-streak-card"
                onClick={() => {
                  if (onOpenDailyStreak) onOpenDailyStreak();
                  else if (onOpenDailyWheel) onOpenDailyWheel();
                }}
                className={`bg-[#060919]/90 border rounded-2xl px-4 py-3 flex items-center gap-3.5 shadow-lg cursor-pointer transition active:scale-95 group relative overflow-hidden ${
                  canClaimStreak 
                    ? 'border-amber-400 hover:border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/50' 
                    : 'border-amber-500/40 hover:border-amber-400'
                }`}
                title="Daily Streak • Click to open 7-Day Login Streak Rewards"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-300 shrink-0 relative ${
                  canClaimStreak ? 'animate-pulse' : ''
                }`}>
                  <Flame className="w-6 h-6 text-slate-950 fill-amber-950/30" />
                  {canClaimStreak && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border border-slate-950"></span>
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span>DAILY STREAK</span>
                    {canClaimStreak && (
                      <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded border border-amber-400/40 animate-pulse">
                        CLAIM READY
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-black text-amber-400 leading-tight">
                    {streak} Day{streak === 1 ? '' : 's'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">
                    {canClaimStreak ? `Claim Day ${streakData.currentDay}! 🔥` : 'Keep it up!'}
                  </div>
                </div>
              </div>

              {/* Score / Coins Card */}
              <div 
                onClick={() => {
                  if (onOpenExchange) onOpenExchange('coinToGem');
                  else if (onOpenDailyWheel) onOpenDailyWheel();
                }}
                className="bg-[#060919]/90 border border-purple-500/40 hover:border-purple-400 rounded-2xl px-4 py-3 flex items-center gap-3.5 shadow-lg cursor-pointer transition active:scale-95 group"
                title="Live Coins & Score Balance • Click to Open Currency Exchange"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-fuchsia-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-purple-300 shrink-0">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="text-left pr-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SCORE / COINS</div>
                  <div className="text-lg font-black text-amber-300 leading-tight font-mono flex items-center gap-1.5">
                    <span className="text-sm">🪙</span>
                    <span>{score.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">Live Coins Balance</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sparkling 3D Stack of Gold Coins & Diamond Gems Artwork */}
        <div 
          onClick={() => {
            if (onOpenExchange) onOpenExchange('gemToCoin');
            else if (onOpenDailyWheel) onOpenDailyWheel();
          }}
          className="relative flex items-center justify-center shrink-0 cursor-pointer group px-4 py-2"
          title="Currency Exchange Hub • Click to Convert Gems ⇆ Coins!"
        >
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-purple-600/30 to-fuchsia-500/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500 pointer-events-none" />

          {/* Interactive Artwork Container */}
          <div className="relative flex items-end justify-center gap-1">
            {/* Coins Stack & Diamond Gems */}
            <div className="relative flex items-center justify-center">
              {/* Stacked 3D Golden Coins */}
              <div className="relative flex flex-col items-center">
                {/* Floating Coins on Left & Right */}
                <div className="absolute -left-6 bottom-1 w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-600 via-amber-400 to-yellow-200 border-2 border-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.6)] flex items-center justify-center text-amber-950 font-black text-sm transform -rotate-12 group-hover:-translate-y-1 transition-transform">
                  ★
                </div>
                <div className="absolute -bottom-2 -left-2 w-12 h-6 rounded-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 border border-amber-200 shadow-md transform rotate-6" />

                {/* Coin Column */}
                <div className="w-16 h-4 rounded-full bg-gradient-to-r from-amber-700 via-yellow-300 to-amber-700 border border-yellow-200 shadow-sm -mb-2 z-30 flex items-center justify-center text-[10px] font-black text-amber-950">
                  ★
                </div>
                <div className="w-16 h-3.5 rounded-full bg-gradient-to-r from-amber-800 via-yellow-400 to-amber-800 border-t border-yellow-100 -mb-2 z-20" />
                <div className="w-16 h-3.5 rounded-full bg-gradient-to-r from-amber-800 via-yellow-400 to-amber-800 border-t border-yellow-100 -mb-2 z-10" />
                <div className="w-16 h-3.5 rounded-full bg-gradient-to-r from-amber-800 via-yellow-400 to-amber-800 border-t border-yellow-100 -mb-2 z-10" />
                <div className="w-16 h-3.5 rounded-full bg-gradient-to-r from-amber-800 via-yellow-400 to-amber-800 border-t border-yellow-100 -mb-2 z-10" />
                <div className="w-16 h-3.5 rounded-full bg-gradient-to-r from-amber-900 via-yellow-500 to-amber-900 border-t border-yellow-100 z-0" />
              </div>

              {/* Sparkling Giant Purple Faceted Gem (💎) */}
              <div className="relative -ml-4 -mb-1 z-40 transform group-hover:scale-105 group-hover:rotate-6 transition-transform duration-300">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-fuchsia-400 via-purple-600 to-indigo-900 p-0.5 shadow-[0_0_35px_rgba(217,70,239,0.7)] flex items-center justify-center transform rotate-45 border-2 border-fuchsia-200">
                  <div className="w-full h-full rounded-xl bg-gradient-to-tr from-purple-800 via-fuchsia-600 to-pink-300 flex items-center justify-center">
                    <span className="text-3xl sm:text-4xl transform -rotate-45 filter drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                      💎
                    </span>
                  </div>
                </div>

                {/* Floating sparkles */}
                <span className="absolute -top-3 -right-2 text-base animate-bounce">✨</span>
                <span className="absolute bottom-0 -left-3 text-xs animate-pulse text-amber-300">⭐</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
