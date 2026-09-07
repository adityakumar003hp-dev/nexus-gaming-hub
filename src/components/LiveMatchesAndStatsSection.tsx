import React, { useState } from 'react';
import { Send, Trophy, Swords, Users, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { UserSession, ChatMessage } from '../types';

interface LiveMatchesAndStatsSectionProps {
  currentUser: UserSession | null;
  chatMessages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  onOpenStats: () => void;
  onOpenLeaderboard: () => void;
  onOpenMatchmaking: () => void;
  onOpenTournament: () => void;
}

export const LiveMatchesAndStatsSection: React.FC<LiveMatchesAndStatsSectionProps> = ({
  currentUser,
  chatMessages,
  onSendMessage,
  onOpenStats,
  onOpenLeaderboard,
  onOpenMatchmaking,
  onOpenTournament,
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'top' | 'tournaments'>('live');
  const [inputText, setInputText] = useState('');

  const stats = currentUser?.stats || {
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    resigns: 0,
    winRate: 0,
    lossRate: 0,
    drawRate: 0,
    resignRate: 0,
    pvpGames: 0,
    aiGames: 0,
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const sampleChat = [
    { sender: 'Chess_Master', text: 'Great move!', time: '2m ago', avatar: '♟️', color: 'text-indigo-400' },
    { sender: 'QueenBee', text: 'Well played!', time: '2m ago', avatar: '👑', color: 'text-purple-400' },
    { sender: 'Legend_007', text: "Let's go!", time: '1m ago', avatar: '⚡', color: 'text-amber-400' },
    { sender: 'Aditya-Owner', text: 'All the best everyone!', time: 'Just now', avatar: '👑', color: 'text-emerald-400', isOwner: true },
  ];

  return (
    <div className="w-full space-y-3">
      {/* Top Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === 'live'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Live Matches</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('top');
              onOpenLeaderboard();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === 'top'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Top Players</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('tournaments');
              onOpenTournament();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === 'tournaments'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Tournaments</span>
          </button>
        </div>

        <button
          onClick={onOpenMatchmaking}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3 Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Live Matches */}
        <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                LIVE MATCHES
              </h4>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                2 In Progress
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Match 1 */}
              <div 
                onClick={onOpenMatchmaking}
                className="bg-[#070b14] border border-slate-800 hover:border-indigo-500/40 p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition"
              >
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-700 text-xs flex items-center justify-center">👤</div>
                    <span className="text-xs font-bold text-white">Guest_1023</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-600 text-xs flex items-center justify-center">⚡</div>
                    <span className="text-xs font-bold text-amber-300">Aryan_Chess</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-mono font-bold text-indigo-300">12:45</div>
                  <div className="text-[9px] text-emerald-400 font-semibold animate-pulse">● LIVE</div>
                </div>
              </div>

              {/* Match 2 */}
              <div 
                onClick={onOpenMatchmaking}
                className="bg-[#070b14] border border-slate-800 hover:border-indigo-500/40 p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition"
              >
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-700 text-xs flex items-center justify-center">♞</div>
                    <span className="text-xs font-bold text-white">Knight_Rider</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-700 text-xs flex items-center justify-center">♛</div>
                    <span className="text-xs font-bold text-purple-300">Queen_Bee</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-mono font-bold text-indigo-300">15:00</div>
                  <div className="text-[9px] text-emerald-400 font-semibold animate-pulse">● LIVE</div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenMatchmaking}
            className="w-full py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-black transition active:scale-95"
          >
            View All Live Matches
          </button>
        </div>

        {/* Column 2: Global Chat */}
        <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                GLOBAL CHAT
              </h4>
              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>1,245 Online</span>
              </span>
            </div>

            {/* Chat Messages */}
            <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1 text-left">
              {sampleChat.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className="w-5 h-5 rounded-full bg-[#070b14] border border-slate-800 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    {c.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-black text-[11px] ${c.color}`}>{c.sender}:</span>
                      <span className="text-slate-200 text-[11px] truncate">{c.text}</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-500 whitespace-nowrap">{c.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-[#070b14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
            <button
              type="submit"
              className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition active:scale-95 shrink-0"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Column 3: Your Stats */}
        <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                YOUR STATS
              </h4>
              <button
                onClick={onOpenStats}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5"
              >
                <span>View All</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-left">
              <div className="flex items-center justify-between bg-[#070b14] p-2 rounded-lg border border-slate-800/60">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <span>🎮</span>
                  <span>Games Played</span>
                </span>
                <span className="font-black text-white">{stats.totalGames || 0}</span>
              </div>

              <div className="flex items-center justify-between bg-[#070b14] p-2 rounded-lg border border-slate-800/60">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <span>🏆</span>
                  <span>Win Rate</span>
                </span>
                <span className="font-black text-emerald-400">
                  {stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : (stats.winRate || 0)}%
                </span>
              </div>

              <div className="flex items-center justify-between bg-[#070b14] p-2 rounded-lg border border-slate-800/60">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <span>🌟</span>
                  <span>Wins</span>
                </span>
                <span className="font-black text-indigo-300">{stats.wins || 0}</span>
              </div>

              <div className="flex items-center justify-between bg-[#070b14] p-2 rounded-lg border border-slate-800/60">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <span>❌</span>
                  <span>Losses</span>
                </span>
                <span className="font-black text-red-400">{stats.losses || 0}</span>
              </div>

              <div className="flex items-center justify-between bg-[#070b14] p-2 rounded-lg border border-slate-800/60">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <span>🤝</span>
                  <span>Draws</span>
                </span>
                <span className="font-black text-amber-400">{stats.draws || 0}</span>
              </div>

              <div className="flex items-center justify-between bg-[#070b14] p-2 rounded-lg border border-slate-800/60">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <span>⏱️</span>
                  <span>Avg Game Time</span>
                </span>
                <span className="font-mono font-bold text-slate-300">
                  {stats.avgMatchTimeSeconds ? Math.round(stats.avgMatchTimeSeconds / 60) : 5}m 0s
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
