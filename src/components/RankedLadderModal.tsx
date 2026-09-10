import React, { useState, useEffect } from 'react';
import { X, Trophy, Award, Shield, Flame, Star, Crown, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import { getUserPoints } from '../utils/pointsManager';
import { soundFx } from '../utils/audio';

export interface RankedTier {
  tier: string;
  minRp: number;
  maxRp: number;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  seasonReward: string;
}

const TIERS: RankedTier[] = [
  { tier: 'Bronze', minRp: 0, maxRp: 999, color: '#cd7f32', badgeBg: 'bg-amber-900/30', badgeBorder: 'border-amber-800/40', textColor: 'text-amber-600', seasonReward: '500 Coins' },
  { tier: 'Silver', minRp: 1000, maxRp: 1999, color: '#94a3b8', badgeBg: 'bg-slate-700/30', badgeBorder: 'border-slate-500/40', textColor: 'text-slate-300', seasonReward: '2,500 Coins + 5 Gems' },
  { tier: 'Gold', minRp: 2000, maxRp: 2999, color: '#fbbf24', badgeBg: 'bg-amber-500/20', badgeBorder: 'border-amber-400/50', textColor: 'text-amber-400', seasonReward: '8,000 Coins + 25 Gems + Gold Frame' },
  { tier: 'Platinum', minRp: 3000, maxRp: 3999, color: '#38bdf8', badgeBg: 'bg-sky-500/20', badgeBorder: 'border-sky-400/50', textColor: 'text-sky-400', seasonReward: '15,000 Coins + 60 Gems + Platinum Dice' },
  { tier: 'Diamond', minRp: 4000, maxRp: 4999, color: '#c084fc', badgeBg: 'bg-purple-500/20', badgeBorder: 'border-purple-400/50', textColor: 'text-purple-400', seasonReward: '30,000 Coins + 120 Gems + Diamond Board' },
  { tier: 'Master', minRp: 5000, maxRp: 5999, color: '#f43f5e', badgeBg: 'bg-rose-500/20', badgeBorder: 'border-rose-400/50', textColor: 'text-rose-400', seasonReward: '50,000 Coins + 250 Gems + Master Crown' },
  { tier: 'Grandmaster', minRp: 6000, maxRp: 99999, color: '#f59e0b', badgeBg: 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30', badgeBorder: 'border-yellow-400/70', textColor: 'text-yellow-300', seasonReward: '100,000 Coins + 500 Gems + Grandmaster Title' },
];

const TOP_GRANDMASTERS = [
  { rank: 1, name: 'ADITYA-OWNER', rp: 8420, winRate: '78%', streak: 12 },
  { rank: 2, name: 'Magnus_Vortex', rp: 7910, winRate: '74%', streak: 8 },
  { rank: 3, name: 'TacticalQueen', rp: 7650, winRate: '71%', streak: 5 },
  { rank: 4, name: 'DragonSlayer99', rp: 7320, winRate: '68%', streak: 3 },
  { rank: 5, name: 'CyberKnight', rp: 6980, winRate: '66%', streak: 4 },
];

export interface RankedLadderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayRanked?: () => void;
}

export const RankedLadderModal: React.FC<RankedLadderModalProps> = ({ isOpen, onClose, onPlayRanked }) => {
  const [playerRp, setPlayerRp] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('user_ranked_rp');
      return saved ? parseInt(saved, 10) : 2340;
    } catch {
      return 2340;
    }
  });

  const [activeTab, setActiveTab] = useState<'tier' | 'leaderboard'>('tier');

  if (!isOpen) return null;

  // Find current tier
  const currentTier = TIERS.find((t) => playerRp >= t.minRp && playerRp <= t.maxRp) || TIERS[0];
  const nextTierIndex = TIERS.findIndex((t) => t.tier === currentTier.tier) + 1;
  const nextTier = nextTierIndex < TIERS.length ? TIERS[nextTierIndex] : null;

  const progressPercent = nextTier
    ? Math.min(100, Math.max(0, ((playerRp - currentTier.minRp) / (currentTier.maxRp - currentTier.minRp + 1)) * 100))
    : 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl bg-[#0b0f19] border border-amber-500/40 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden text-slate-100 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#080c14]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <span>Ranked Competitive Ladder</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  SEASON 4
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Compete in multiplayer matches to earn RP, ascend divisions, and earn season titles
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

        {/* Tab switch */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-[#080c14]/50">
          <button
            onClick={() => setActiveTab('tier')}
            className={`px-4 py-2 rounded-t-xl text-xs font-black uppercase tracking-wider font-mono border-b-2 transition ${
              activeTab === 'tier'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Tier Roadmap & Rewards
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-t-xl text-xs font-black uppercase tracking-wider font-mono border-b-2 transition ${
              activeTab === 'leaderboard'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Grandmaster Top 50
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Current Rank Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-900/20 to-indigo-950/40 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl ${currentTier.badgeBg} border ${currentTier.badgeBorder} flex items-center justify-center text-2xl shadow-lg`}
              >
                <Crown className="w-8 h-8" style={{ color: currentTier.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-black uppercase font-mono ${currentTier.textColor}`}>
                    {currentTier.tier} Division
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  Current Rating: <strong className="text-white">{playerRp.toLocaleString()} RP</strong>
                </p>
                {nextTier && (
                  <p className="text-[11px] text-slate-400 font-mono">
                    {(nextTier.minRp - playerRp).toLocaleString()} RP needed to reach {nextTier.tier}
                  </p>
                )}
              </div>
            </div>

            {/* Streak Multiplier */}
            <div className="flex items-center gap-2 bg-[#070b14] border border-amber-500/30 px-3.5 py-2 rounded-xl shrink-0 font-mono text-xs">
              <Flame className="w-4 h-4 text-orange-400" />
              <div>
                <span className="text-slate-400 text-[10px] block">WIN STREAK BONUS</span>
                <span className="text-amber-300 font-bold">+15% RP BOOST ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {nextTier && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{currentTier.tier} ({currentTier.minRp} RP)</span>
                <span className="text-amber-300 font-bold">{Math.round(progressPercent)}% to {nextTier.tier}</span>
                <span className="text-slate-400">{nextTier.tier} ({nextTier.minRp} RP)</span>
              </div>
              <div className="w-full h-3 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {activeTab === 'tier' ? (
            /* Tier Roadmap */
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">
                Competitive Division Tier Roadmap
              </h3>
              <div className="space-y-2">
                {TIERS.map((t) => {
                  const isCurrent = t.tier === currentTier.tier;
                  const isPassed = playerRp > t.maxRp;

                  return (
                    <div
                      key={t.tier}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : isPassed
                          ? 'bg-slate-900/40 border-slate-800/80 opacity-75'
                          : 'bg-slate-900/70 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl ${t.badgeBg} border ${t.badgeBorder} flex items-center justify-center font-bold text-xs`}
                        >
                          <Shield className="w-4 h-4" style={{ color: t.color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white font-mono">{t.tier}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {t.minRp.toLocaleString()} - {t.maxRp === 99999 ? 'MAX' : `${t.maxRp.toLocaleString()} RP`}
                            </span>
                          </div>
                          <span className="text-[11px] text-amber-300/90 font-mono block">
                            Reward: {t.seasonReward}
                          </span>
                        </div>
                      </div>

                      <div>
                        {isCurrent ? (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black uppercase font-mono">
                            Current Tier
                          </span>
                        ) : isPassed ? (
                          <span className="text-emerald-400 text-xs font-bold font-mono">✓ Achieved</span>
                        ) : (
                          <span className="text-slate-500 text-xs font-mono">Locked</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Grandmaster Leaderboard */
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">
                Top Grandmaster Players
              </h3>
              <div className="space-y-2">
                {TOP_GRANDMASTERS.map((gm) => (
                  <div
                    key={gm.rank}
                    className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-3 font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                          gm.rank === 1
                            ? 'bg-amber-400 text-slate-950 shadow'
                            : gm.rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : gm.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        #{gm.rank}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-white">{gm.name}</span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>Win Rate: {gm.winRate}</span>
                          <span>•</span>
                          <span className="text-amber-400">🔥 {gm.streak} Streak</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-amber-300 text-sm">{gm.rp.toLocaleString()} RP</span>
                      <span className="text-[10px] text-slate-500 block uppercase">Grandmaster I</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#080c14] flex flex-wrap gap-2 items-center justify-between text-xs font-mono text-slate-400">
          <span>Season 4 resets in 18 days. Tiers convert to badge awards.</span>
          <div className="flex items-center gap-2">
            {onPlayRanked && (
              <button
                onClick={() => {
                  soundFx.playWin();
                  onPlayRanked();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black uppercase tracking-wider transition shadow-lg shadow-amber-500/20"
              >
                ⚔️ Play Ranked Match
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase tracking-wider transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
