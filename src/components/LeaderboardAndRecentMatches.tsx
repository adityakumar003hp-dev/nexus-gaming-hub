import React from 'react';
import { Trophy, ChevronRight, History, CheckCircle2 } from 'lucide-react';
import { UserSession } from '../types';

interface LeaderboardAndRecentMatchesProps {
  currentUser: UserSession | null;
  onOpenLeaderboard: () => void;
  onOpenRecentMatches: () => void;
}

export const LeaderboardAndRecentMatches: React.FC<LeaderboardAndRecentMatchesProps> = ({
  currentUser,
  onOpenLeaderboard,
  onOpenRecentMatches,
}) => {
  const currentUsername = currentUser?.username || 'Aditya-Owner';

  const sampleLeaderboard = [
    { rank: 1, name: 'Aditya-Owner', score: 2650, isCrown: true, isOwner: true },
    { rank: 2, name: 'Guest_0123', score: 1890, isCrown: false },
    { rank: 3, name: 'Player_456', score: 1550, isCrown: false },
    { rank: 4, name: 'Gamer_789', score: 1230, isCrown: false },
    { rank: 5, name: 'Chess_Pro', score: 1100, isCrown: false },
  ];

  const sampleRecentMatches = [
    { opponent: 'Guest_1023', outcome: 'Victory', time: '10m ago', score: '+25', type: 'win' },
    { opponent: 'Player_456', outcome: 'Draw', time: '30m ago', score: '+5', type: 'draw' },
    { opponent: 'Gamer_789', outcome: 'Victory', time: '1h ago', score: '+25', type: 'win' },
    { opponent: 'Guest_8745', outcome: 'Defeat', time: '2h ago', score: '-15', type: 'loss' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* 1. Global Leaderboard */}
      <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                GLOBAL LEADERBOARD
              </h4>
            </div>
            <button
              onClick={onOpenLeaderboard}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 text-left">
            {sampleLeaderboard.map((player) => (
              <div
                key={player.rank}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                  player.rank === 1
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                    : 'bg-[#070b14] border-slate-800/80 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono ${
                      player.rank === 1
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : player.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : player.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {player.rank}
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span>{player.name}</span>
                    {player.isCrown && <span>👑</span>}
                    {player.isOwner && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
                    )}
                  </div>
                </div>

                <div className="font-mono font-black text-xs text-amber-400">
                  {player.score.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Recent Matches */}
      <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                RECENT MATCHES
              </h4>
            </div>
            <button
              onClick={onOpenRecentMatches}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 text-left">
            {sampleRecentMatches.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#070b14] border border-slate-800/80 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>vs {m.opponent}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">{m.time}</div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-black flex items-center gap-1 justify-end ${
                      m.type === 'win'
                        ? 'text-emerald-400'
                        : m.type === 'loss'
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }`}
                  >
                    <span>{m.outcome}</span>
                    <span>{m.type === 'win' ? '🏆' : m.type === 'loss' ? '❌' : '🤝'}</span>
                  </div>
                  <div className="text-[10px] font-mono font-bold text-slate-400">
                    {m.score} pts
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
