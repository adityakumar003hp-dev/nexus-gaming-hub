import React from 'react';
import { Zap, Users, Bot, Trophy, Sparkles, Wand2, Dices, Brain, Swords, Flame, ShieldAlert, Cpu } from 'lucide-react';
import { GameMode, AIDifficulty } from '../types';
import { GameEconomy } from '../utils/gameEconomy';
import { normalizeAIDifficulty, AI_DIFFICULTY_TIERS } from './AIDifficultySelector';

interface ChooseModePanelProps {
  gameMode: GameMode;
  onChangeGameMode: (mode: GameMode) => void;
  onOpenMatchmaking: () => void;
  onOpenTournament?: () => void;
  onOpenPuzzles?: () => void;
  onOpenAskGemini?: () => void;
  onOpenWheelLobby?: () => void;
  aiDifficulty?: AIDifficulty | number;
  onAiDifficultyChange?: (difficulty: AIDifficulty) => void;
}

export const ChooseModePanel: React.FC<ChooseModePanelProps> = ({
  gameMode,
  onChangeGameMode,
  onOpenMatchmaking,
  onOpenTournament,
  onOpenPuzzles,
  onOpenAskGemini,
  onOpenWheelLobby,
  aiDifficulty = 4,
  onAiDifficultyChange,
}) => {
  const currentNumLvl = normalizeAIDifficulty(aiDifficulty);
  const activeTier = AI_DIFFICULTY_TIERS.find((t) => t.level === currentNumLvl) || AI_DIFFICULTY_TIERS[3];

  return (
    <div className="w-full bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between h-full space-y-4">
      <div>
        <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-3.5 text-left flex items-center justify-between">
          <span>CHOOSE MODE</span>
          {gameMode === 'ai' && (
            <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Bot className="w-3 h-3 text-purple-400" />
              <span>AI Level {currentNumLvl}: {activeTier.name}</span>
            </span>
          )}
        </h3>

        <div className="flex flex-col gap-2.5">
          {/* Quick Match Button */}
          <button
            id="btnQuickMatch"
            data-mode="quick_match"
            onClick={() => onOpenMatchmaking()}
            className="mode-card mode-btn w-full p-3.5 rounded-xl bg-gradient-to-r from-indigo-900/50 to-indigo-700/30 hover:from-indigo-800/60 hover:to-indigo-600/40 border border-indigo-500/50 hover:border-indigo-400 text-white text-left transition-all active:scale-[0.98] shadow-lg shadow-indigo-950/40 group relative overflow-hidden cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-[0_0_12px_rgba(79,70,229,0.6)] group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-sm text-white group-hover:text-indigo-200 transition-colors">
                  ⚡ Quick Match
                </div>
                <div className="text-[11px] text-indigo-300/80 font-medium flex items-center justify-between">
                  <span>Random Opponent</span>
                  <span id="labelQuickMatchFee" className="bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 font-bold">
                    <span id="entryFeeDisplay">2000 Coins / Gems</span>
                  </span>
                </div>
              </div>
            </div>
          </button>

          {/* Chess Pro / Ranked AI Match Button */}
          <button
            id="btnChessPro"
            data-mode="chess_pro"
            onClick={() => GameEconomy.requestGameStart(2, 'Chess Pro AI', () => onChangeGameMode('ai'), 'vs_ai')}
            className={`mode-card mode-btn w-full p-3.5 rounded-xl border text-left transition-all active:scale-[0.98] group cursor-pointer ${
              gameMode === 'ai'
                ? 'bg-sky-950/40 border-sky-500/60 shadow-lg shadow-sky-950/30'
                : 'bg-[#070b14] hover:bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-sky-900/40 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-sm text-white group-hover:text-sky-200 transition-colors flex items-center gap-2">
                    <span>🏆 Chess Pro</span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Lvl {currentNumLvl}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                    <span>{activeTier.name} Master</span>
                    <span id="labelChessProFee" className="bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 font-bold">2000 Coins / Gems</span>
                  </div>
                </div>
              </div>
            </div>
          </button>

          {/* Pass & Play / Local Mode Button */}
          <button
            id="btnPassAndPlay"
            data-mode="pass_play"
            onClick={() => GameEconomy.requestGameStart(3, 'Pass & Play', () => onChangeGameMode('local'), 'pass_play')}
            className={`mode-card mode-btn w-full p-3.5 rounded-xl border text-left transition-all active:scale-[0.98] group cursor-pointer ${
              gameMode === 'local'
                ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/30'
                : 'bg-[#070b14] hover:bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0 group-hover:border-amber-400/40 transition-colors">
                <Swords className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-sm text-white group-hover:text-amber-200 transition-colors">
                  👥 Pass &amp; Play
                </div>
                <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                  <span>Two players on one screen</span>
                  <span className="text-emerald-400 font-bold">Free (0 Coins)</span>
                </div>
              </div>
            </div>
          </button>

          {/* Tournament Button */}
          <button
            onClick={onOpenTournament}
            className="w-full p-3.5 rounded-xl bg-[#070b14] hover:bg-slate-900/80 border border-slate-800/90 hover:border-emerald-500/40 text-left transition-all active:scale-[0.98] group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-900/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white group-hover:text-emerald-200 transition-colors">
                  Tournament
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Compete &amp; win rewards
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Auxiliary Quick Tools Footer */}
      <div className="pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-2">
        {onOpenPuzzles && (
          <button
            onClick={onOpenPuzzles}
            className="p-2 rounded-lg bg-[#070b14] hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition"
            title="Tactical Puzzles"
          >
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span>Puzzles</span>
          </button>
        )}
        {onOpenAskGemini && (
          <button
            onClick={onOpenAskGemini}
            className="p-2 rounded-lg bg-[#070b14] hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition"
            title="AI Strategic Coach"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Coach</span>
          </button>
        )}
      </div>
    </div>
  );
};
