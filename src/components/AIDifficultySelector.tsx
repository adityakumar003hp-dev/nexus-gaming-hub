import React from 'react';
import { Bot, Zap, Flame, ShieldAlert, Cpu } from 'lucide-react';
import { AIDifficulty } from '../types';

export interface AIDifficultySelectorProps {
  currentLevel?: AIDifficulty | number;
  onSelectLevel: (level: number) => void;
  className?: string;
}

export const AI_DIFFICULTY_TIERS = [
  { level: 1, label: 'Lvl 1', name: 'Novice', Icon: Zap },
  { level: 2, label: 'Lvl 2', name: 'Casual', Icon: Zap },
  { level: 3, label: 'Lvl 3', name: 'Intermediate', Icon: Flame },
  { level: 4, label: 'Lvl 4', name: 'Advanced', Icon: Flame },
  { level: 5, label: 'Lvl 5', name: 'Expert', Icon: ShieldAlert },
  { level: 6, label: 'Lvl 6', name: 'Master', Icon: ShieldAlert },
  { level: 7, label: 'Lvl 7', name: 'Grandmaster', Icon: Cpu },
  { level: 8, label: 'Lvl 8', name: 'Super AI', Icon: Cpu },
];

export function normalizeAIDifficulty(difficulty?: AIDifficulty | number | string): number {
  if (typeof difficulty === 'number' && difficulty >= 1 && difficulty <= 8) {
    return Math.round(difficulty);
  }
  if (difficulty === 'easy') return 2;
  if (difficulty === 'medium') return 4;
  if (difficulty === 'hard') return 6;
  if (difficulty === 'master') return 8;
  return 4;
}

export const AIDifficultySelector: React.FC<AIDifficultySelectorProps> = ({
  currentLevel = 4,
  onSelectLevel,
  className = '',
}) => {
  const activeNumericalLevel = normalizeAIDifficulty(currentLevel);

  return (
    <div
      id="ai-difficulty-selector-panel"
      className={`w-full bg-[#0c061a]/95 border border-[#4c1d95]/80 rounded-2xl p-3.5 sm:p-4 shadow-[0_0_30px_rgba(76,29,149,0.25)] backdrop-blur-xl flex flex-col gap-2.5 text-white ${className}`}
    >
      {/* Header Label matching screenshot */}
      <div className="flex items-center gap-2">
        <Bot className="w-4 h-4 text-[#c084fc]" />
        <span className="text-xs sm:text-sm font-extrabold tracking-widest text-[#c084fc] uppercase">
          AI DIFFICULTY LEVEL:
        </span>
      </div>

      {/* 8 Level Selector Buttons matching screenshot */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {AI_DIFFICULTY_TIERS.map(({ level, label, name, Icon }) => {
          const isSelected = activeNumericalLevel === level;

          return (
            <button
              key={level}
              id={`ai-diff-btn-lvl-${level}`}
              type="button"
              onClick={() => onSelectLevel(level)}
              title={`Level ${level}: ${name}`}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-[#181106] border-2 border-[#f59e0b] text-[#fbbf24] font-black shadow-[0_0_15px_rgba(245,158,11,0.45)]'
                  : 'bg-[#120d29] border border-[#271d4d] text-slate-300 hover:text-white hover:bg-[#1a143b] hover:border-[#453380]'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isSelected ? 'text-[#fbbf24]' : 'text-slate-400'
                }`}
              />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

