import React, { useState } from 'react';
import { GameEconomy } from '../utils/gameEconomy';
import { Trophy, Zap, Gift, Coins, Gem, Sparkles, Swords, RefreshCw } from 'lucide-react';

export const EconomyRewardsWidget: React.FC = () => {
  const [selectedGameId, setSelectedGameId] = useState<number>(1);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4 font-sans">
      <div className="bg-[#0b0f19]/90 border border-purple-500/30 rounded-2xl p-4 sm:p-6 shadow-[0_0_30px_rgba(124,58,237,0.15)] backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white text-lg shadow-md">
              💰
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <span>Economy &amp; Rewards Engine</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Entry Fees, Placement Rewards, Tasks, and Wheel of Fortune
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-xs text-purple-400 hover:text-purple-300 font-bold px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 cursor-pointer"
          >
            {isCollapsed ? 'Expand Controls' : 'Minimize'}
          </button>
        </div>

        {!isCollapsed && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Game Entry Fee */}
            <div className="game-entry-box !m-0">
              <h3>
                <Swords className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Select Entry Fee for Game</span>
              </h3>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] text-slate-400 font-bold">Game ID:</span>
                <select
                  value={selectedGameId}
                  onChange={(e) => setSelectedGameId(Number(e.target.value))}
                  className="!py-1 !px-2 !text-xs !bg-slate-900 !border-slate-700 !rounded-lg !w-auto"
                >
                  <option value={1}>#1 Duo Classic</option>
                  <option value={2}>#2 Blitz Arena</option>
                  <option value={3}>#3 Tournament</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => GameEconomy.payEntryFee(selectedGameId, 'coins')}
                className="hover:border-amber-400 hover:text-amber-300"
              >
                <span>🪙 Play (200 Coins)</span>
              </button>
              <button
                type="button"
                onClick={() => GameEconomy.payEntryFee(selectedGameId, 'gems')}
                className="hover:border-fuchsia-400 hover:text-fuchsia-300"
              >
                <span>💎 Play (100 Gems)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).promptGameFeeAndStart) {
                    (window as any).promptGameFeeAndStart();
                  } else {
                    GameEconomy.payEntryFee(selectedGameId, 'coins');
                  }
                }}
                className="!bg-purple-600/30 hover:!bg-purple-600/50 !border-purple-500/50 text-purple-200"
              >
                <span>✨ Open Fee Deduct Menu</span>
              </button>
            </div>

            {/* 2. Match Results Rewards */}
            <div className="match-results-box !m-0">
              <h3>
                <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
                <span>Match Results Rewards</span>
              </h3>
              <button
                type="button"
                onClick={() => GameEconomy.claimMatchReward(1)}
                className="hover:border-yellow-400 hover:text-yellow-300"
              >
                <span>🥇 1st Place (+2000 🪙 / +90 💎)</span>
              </button>
              <button
                type="button"
                onClick={() => GameEconomy.claimMatchReward(2)}
                className="hover:border-slate-300 hover:text-slate-200"
              >
                <span>🥈 2nd Place (+1000 🪙 / +60 💎)</span>
              </button>
              <button
                type="button"
                onClick={() => GameEconomy.claimMatchReward(3)}
                className="hover:border-amber-600 hover:text-amber-400"
              >
                <span>🥉 3rd Place (+500 🪙 / +30 💎)</span>
              </button>
            </div>

            {/* 3. Task & Wheel Rewards */}
            <div className="extra-rewards-box !m-0">
              <h3>
                <Gift className="w-4 h-4 text-pink-400 shrink-0" />
                <span>Earn Extra Currency</span>
              </h3>
              <button
                type="button"
                onClick={() => GameEconomy.completeTask('Win 1 Game')}
                className="hover:border-emerald-400 hover:text-emerald-300"
              >
                <span>🎯 Complete Task (Random 100 🪙/💎)</span>
              </button>
              <button
                type="button"
                onClick={() => GameEconomy.spinWheel()}
                className="hover:border-purple-400 hover:text-purple-300"
              >
                <span>🎡 Spin Wheel of Fortune</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
