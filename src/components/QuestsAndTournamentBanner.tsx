import React from 'react';
import { Target, Trophy, Award, CheckCircle2, Lock, ChevronRight } from 'lucide-react';

interface QuestsAndTournamentBannerProps {
  onOpenDailyQuests: () => void;
  onOpenTournament: () => void;
  onOpenAchievements: () => void;
  onStartGame: () => void;
}

export const QuestsAndTournamentBanner: React.FC<QuestsAndTournamentBannerProps> = ({
  onOpenDailyQuests,
  onOpenTournament,
  onOpenAchievements,
  onStartGame,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {/* 1. Daily Challenge Card */}
      <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">DAILY CHALLENGE</h4>
              <p className="text-[11px] text-slate-400 font-medium">Play &amp; win rewards!</p>
            </div>
          </div>

          <div className="space-y-2 text-left bg-[#070b14] border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">Win 3 games today</span>
              <span className="font-extrabold text-indigo-400 font-mono">1/3</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full w-1/3" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-left">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Reward</div>
            <div className="text-xs font-black text-amber-400 flex items-center gap-1">
              <span>🟡</span>
              <span>50 Coins</span>
            </div>
          </div>

          <button
            onClick={onStartGame}
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition active:scale-95"
          >
            Play Now
          </button>
        </div>
      </div>

      {/* 2. Weekly Tournament Card */}
      <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">WEEKLY TOURNAMENT</h4>
              <p className="text-[11px] text-slate-400 font-medium">Ends in</p>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="bg-[#070b14] border border-slate-800 p-3 rounded-xl flex items-center justify-center gap-2 font-mono">
            <div className="text-center">
              <span className="text-base font-black text-white">3d</span>
            </div>
            <span className="text-slate-500 font-bold">:</span>
            <div className="text-center">
              <span className="text-base font-black text-white">12h</span>
            </div>
            <span className="text-slate-500 font-bold">:</span>
            <div className="text-center">
              <span className="text-base font-black text-white">45m</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-left">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Prize Pool</div>
            <div className="text-xs font-black text-amber-400 flex items-center gap-1">
              <span>🏆</span>
              <span>1,000 Coins</span>
            </div>
          </div>

          <button
            onClick={onOpenTournament}
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition active:scale-95"
          >
            Join Now
          </button>
        </div>
      </div>

      {/* 3. Achievements Card */}
      <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">ACHIEVEMENTS</h4>
            </div>
            <button
              onClick={onOpenAchievements}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5"
            >
              <span>See All</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Achievement items */}
          <div className="space-y-2 text-left">
            {/* Item 1 */}
            <div className="bg-[#070b14] border border-slate-800 p-2 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">🎯</span>
                <div>
                  <div className="text-[11px] font-bold text-white leading-tight">First Move</div>
                  <div className="text-[9px] text-slate-400">Play your first game</div>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20 shrink-0" />
            </div>

            {/* Item 2 */}
            <div className="bg-[#070b14] border border-slate-800 p-2 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">👑</span>
                <div>
                  <div className="text-[11px] font-bold text-white leading-tight">Winning Streak</div>
                  <div className="text-[9px] text-slate-400">Win 3 games in a row</div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-indigo-400">1/3</span>
            </div>

            {/* Item 3 */}
            <div className="bg-[#070b14] border border-slate-800 p-2 rounded-xl flex items-center justify-between opacity-75">
              <div className="flex items-center gap-2">
                <span className="text-sm">🏆</span>
                <div>
                  <div className="text-[11px] font-bold text-white leading-tight">Sharp Mind</div>
                  <div className="text-[9px] text-slate-400">Win against AI (Hard)</div>
                </div>
              </div>
              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
