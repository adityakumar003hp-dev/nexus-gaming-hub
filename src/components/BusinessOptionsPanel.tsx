import React, { useState } from 'react';
import { Users, Palette, User, Bot, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BUSINESS_COLORS, BusinessColorKey } from '../data/businessConfig';

export interface BusinessSlotConfig {
  colorKey: BusinessColorKey;
  isAi: boolean;
  isUser: boolean;
}

export interface BusinessOptionsPanelProps {
  playerCount: number;
  onPlayerCountChange: (count: number) => void;
  userColor: BusinessColorKey;
  onUserColorChange: (color: BusinessColorKey) => void;
  activeSlots: BusinessSlotConfig[];
  onToggleSlotAi: (colorKey: BusinessColorKey) => void;
  onResetGame?: () => void;
  onOpenEspionage?: () => void;
  marketPhaseName?: string;
}

export const BusinessOptionsPanel: React.FC<BusinessOptionsPanelProps> = ({
  playerCount,
  onPlayerCountChange,
  userColor,
  onUserColorChange,
  activeSlots,
  onToggleSlotAi,
  onResetGame,
  onOpenEspionage,
  marketPhaseName,
}) => {
  const [showOptions, setShowOptions] = useState<boolean>(true);

  return (
    <div className="w-full bg-[#080d20]/90 border border-[#f3ce6b]/35 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-3 relative z-20">
      {/* Top Header Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Side: Player Count Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Players:</span>
          </span>

          <div className="flex items-center gap-1 bg-slate-900/90 border border-white/10 rounded-xl p-1">
            {[2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => {
                  onPlayerCountChange(num);
                  if (onResetGame) onResetGame();
                }}
                className={`px-3 py-1.5 rounded-lg font-black text-xs transition flex items-center gap-1 ${
                  playerCount === num
                    ? 'bg-[#f3ce6b] text-slate-950 shadow-[0_0_12px_rgba(243,206,107,0.5)] scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {num} Players
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Espionage & Vaults Button & Toggle Options Expansion */}
        <div className="flex items-center gap-2">
          {onOpenEspionage && (
            <button
              onClick={onOpenEspionage}
              className="text-xs font-black text-slate-950 bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 hover:from-indigo-300 hover:to-purple-300 px-3.5 py-1.5 rounded-xl transition shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center gap-1.5 active:scale-95 cursor-pointer border border-indigo-300"
            >
              <span>🕵️‍♂️</span>
              <span>Vaults &amp; Espionage</span>
              {marketPhaseName && (
                <span className="text-[10px] bg-indigo-950 text-indigo-200 px-1.5 py-0.2 rounded font-mono hidden sm:inline">
                  {marketPhaseName.split(' ')[0]}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setShowOptions(!showOptions)}
            className="text-xs font-black text-amber-400 hover:text-amber-300 flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/30 px-3.5 py-1.5 rounded-xl transition shadow-sm hover:bg-amber-400/20 active:scale-95"
          >
            <Palette className="w-4 h-4" />
            <span>{showOptions ? 'Hide Options' : 'Show Options'}</span>
            {showOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Options Panel */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-800/80 pt-3 flex flex-col gap-3"
          >
            {/* Color / Side Selection for Player 1 */}
            <div className="flex flex-wrap items-center justify-between bg-slate-900/90 border border-white/10 rounded-xl p-2.5 gap-2">
              <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Your Color (Player 1):</span>
              </span>

              <div className="flex items-center gap-2">
                {BUSINESS_COLORS.map((cfg) => {
                  const isSelected = userColor === cfg.key;
                  return (
                    <button
                      key={cfg.key}
                      onClick={() => {
                        onUserColorChange(cfg.key);
                        if (onResetGame) onResetGame();
                      }}
                      style={{ backgroundColor: cfg.colorHex }}
                      className={`w-7 h-7 rounded-full border-2 transition transform hover:scale-110 flex items-center justify-center ${
                        isSelected
                          ? 'border-white ring-2 ring-amber-400 scale-110 shadow-lg'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                      title={`Select ${cfg.label}`}
                    >
                      {isSelected && <User className="w-3.5 h-3.5 text-white drop-shadow-md" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Slots Human / AI Toggles */}
            <div className="flex flex-col gap-1.5">
              <div className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Toggle Human / AI for Active Board Colors:</span>
              </div>

              <div
                className={`grid gap-2.5 ${
                  activeSlots.length > 4
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6'
                    : activeSlots.length > 2
                    ? 'grid-cols-2 sm:grid-cols-4'
                    : 'grid-cols-2'
                }`}
              >
                {activeSlots.map((slot) => {
                  const cfg = BUSINESS_COLORS.find((c) => c.key === slot.colorKey) || BUSINESS_COLORS[0];
                  const isUser = slot.isUser;
                  const isAi = slot.isAi;

                  return (
                    <div
                      key={slot.colorKey}
                      className={`border rounded-xl p-2.5 flex flex-col gap-2 transition ${
                        isUser
                          ? 'bg-amber-500/10 border-amber-400/40 shadow-md'
                          : isAi
                          ? 'bg-purple-950/40 border-purple-500/30'
                          : 'bg-emerald-950/20 border-emerald-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border border-white/80 shadow-sm"
                            style={{ backgroundColor: cfg.colorHex }}
                          />
                          <span className="text-xs font-black text-white capitalize">{cfg.label}</span>
                        </div>
                        {isUser && (
                          <span className="text-[10px] bg-amber-400/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-400/30">
                            YOU
                          </span>
                        )}
                      </div>

                      <button
                        disabled={isUser}
                        onClick={() => {
                          onToggleSlotAi(slot.colorKey);
                          if (onResetGame) onResetGame();
                        }}
                        className={`w-full py-1.5 px-2 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                          isUser
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 cursor-default'
                            : isAi
                            ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 hover:bg-purple-600/50'
                            : 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-600/50'
                        }`}
                      >
                        {isUser ? (
                          <>
                            <User className="w-3.5 h-3.5" />
                            <span>Player 1</span>
                          </>
                        ) : isAi ? (
                          <>
                            <Bot className="w-3.5 h-3.5 text-purple-400" />
                            <span>AI</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Human</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
