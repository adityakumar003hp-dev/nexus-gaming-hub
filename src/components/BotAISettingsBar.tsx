import React, { useState, useRef, useEffect } from 'react';
import { Bot, Users, Sparkles, User, ChevronDown, Check } from 'lucide-react';
import { normalizeAIDifficulty } from './AIDifficultySelector';

export type StandardAIDifficulty = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'easy' | 'medium' | 'hard' | 'master';
export type StandardOpponentType = 'pvp' | 'ai' | 'solo' | 'wall' | 'local';

export interface BotAISettingsBarProps {
  opponentType: StandardOpponentType;
  onOpponentTypeChange: (type: 'pvp' | 'ai' | 'solo' | any) => void;
  aiDifficulty?: StandardAIDifficulty | string | number;
  onAiDifficultyChange?: (difficulty: any) => void;
  statusMessage?: string;
  hasSoloMode?: boolean;
  soloLabel?: string;
  className?: string;
  accentColor?: 'blue' | 'amber' | 'emerald' | 'purple' | 'red';
}

export const BOT_AI_LEVELS = [
  { level: 1, label: 'Lvl 1 - Novice' },
  { level: 2, label: 'Lvl 2 - Casual' },
  { level: 3, label: 'Lvl 3 - Intermediate' },
  { level: 4, label: 'Lvl 4 - Advanced' },
  { level: 5, label: 'Lvl 5 - Expert' },
  { level: 6, label: 'Lvl 6 - Master' },
  { level: 7, label: 'Lvl 7 - Grandmaster' },
  { level: 8, label: 'Lvl 8 - Super AI' },
];

export const BotAISettingsBar: React.FC<BotAISettingsBarProps> = ({
  opponentType,
  onOpponentTypeChange,
  aiDifficulty = 4,
  onAiDifficultyChange,
  statusMessage = 'Play 2-Player local or challenge the AI Bot!',
  hasSoloMode = false,
  soloLabel = 'Solo / Wall',
  className = '',
  accentColor = 'amber',
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAi = opponentType === 'ai';
  const isPvp = opponentType === 'pvp' || opponentType === 'local';
  const isSolo = opponentType === 'solo' || opponentType === 'wall';

  const currentNumericalLevel = normalizeAIDifficulty(aiDifficulty);
  const activeLevelObj = BOT_AI_LEVELS.find((l) => l.level === currentNumericalLevel) || BOT_AI_LEVELS[3];

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const handleSelectLevel = (lvl: number) => {
    if (onAiDifficultyChange) {
      onAiDifficultyChange(lvl);
    }
    setIsDropdownOpen(false);
  };

  return (
    <div
      id="bot-ai-settings-bar"
      className={`w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-[#0e0c1f]/90 border border-[#231b42] p-3 rounded-2xl shadow-xl backdrop-blur-md transition-all ${className}`}
    >
      {/* Left side: Status with icon matching screenshot 1 */}
      <div className="text-xs text-slate-300 text-center sm:text-left flex items-center gap-2 flex-1 min-w-0 font-medium">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="truncate">{statusMessage}</span>
      </div>

      {/* Right side: 2P Local / AI Bot / Solo Switcher + Difficulty Dropdown */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex bg-[#120f26] rounded-xl p-0.5 border border-[#28214d] shadow-inner">
          <button
            type="button"
            id="bot-bar-btn-local"
            onClick={() => onOpponentTypeChange('pvp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              isPvp
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Two players on the same screen"
          >
            <Users className="w-3.5 h-3.5" />
            <span>2P Local</span>
          </button>

          <button
            type="button"
            id="bot-bar-btn-ai"
            onClick={() => onOpponentTypeChange('ai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              isAi
                ? 'bg-[#ff9800] text-slate-950 shadow-md shadow-amber-500/40 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Play against AI Bot"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Bot</span>
          </button>

          {hasSoloMode && (
            <button
              type="button"
              id="bot-bar-btn-solo"
              onClick={() => onOpponentTypeChange('solo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isSolo
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Practice solo"
            >
              <User className="w-3.5 h-3.5" />
              <span>{soloLabel}</span>
            </button>
          )}
        </div>

        {/* AI Difficulty Selector (Visible when AI Bot is selected) matching screenshot 1 & 2 */}
        {isAi && (
          <div className="relative" ref={dropdownRef}>
            {/* Button matching screenshot 1 */}
            <button
              type="button"
              id="bot-ai-difficulty-dropdown-btn"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="bg-[#120f26] border border-[#2b2253] text-[#fcd34d] hover:text-[#fbbf24] text-xs font-bold rounded-xl px-3 py-1.5 outline-none flex items-center gap-1.5 shadow-md hover:border-amber-400/50 transition-all cursor-pointer"
              title="Select AI Bot Difficulty"
            >
              <span>{activeLevelObj.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#fcd34d] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu matching screenshot 2 */}
            {isDropdownOpen && (
              <div
                id="bot-ai-difficulty-menu"
                className="absolute right-0 top-full mt-2 w-64 bg-[#ffffff] text-[#1e293b] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex flex-col divide-y divide-slate-100">
                  {BOT_AI_LEVELS.map(({ level, label }) => {
                    const isSelected = currentNumericalLevel === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        id={`bot-ai-menu-lvl-${level}`}
                        onClick={() => handleSelectLevel(level)}
                        className={`w-full px-4 py-3 text-left text-sm font-semibold flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-slate-50 text-slate-900 font-bold'
                            : 'hover:bg-slate-50/80 text-slate-800'
                        }`}
                      >
                        <span className="text-slate-900 font-medium">{label}</span>
                        {/* Radio selection circle matching screenshot 2 */}
                        <div className="shrink-0 ml-3 flex items-center justify-center">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full border-2 border-[#4f46e5] flex items-center justify-center">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#4f46e5]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

