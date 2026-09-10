import React, { useState } from 'react';
import { Smile, Flame, Sparkles, MessageSquare, X, ChevronUp, ChevronDown } from 'lucide-react';
import { soundFx } from '../utils/audio';

export interface FloatingEmote {
  id: string;
  emoji: string;
  text?: string;
  x: number;
  y: number;
}

const EMOJI_REACTIONS = ['🔥', '💎', '🎲', '👑', '💥', '⚡', '🎯', '😂', '👏', '🧠', '👀', '🏆'];

const QUICK_TAUNTS = [
  'Good move!',
  'Nice roll! 🎲',
  'Watch this play! ⚡',
  'Checkmate incoming!',
  'Thinking hard... 🧠',
  'Well played! 👏',
  'GG! 🏆',
];

interface InGameReactionsBarProps {
  onNotification?: (text: string, type?: 'success' | 'warning' | 'error') => void;
}

export const InGameReactionsBar: React.FC<InGameReactionsBarProps> = ({ onNotification }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeEmotes, setActiveEmotes] = useState<FloatingEmote[]>([]);

  const triggerReaction = (emoji: string, text?: string) => {
    soundFx.playMove();
    const newEmote: FloatingEmote = {
      id: `emote_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      emoji,
      text,
      x: 30 + Math.random() * 40,
      y: 60 + Math.random() * 15,
    };

    setActiveEmotes((prev) => [...prev, newEmote]);

    setTimeout(() => {
      setActiveEmotes((prev) => prev.filter((e) => e.id !== newEmote.id));
    }, 2400);

    if (onNotification && text) {
      onNotification(`You reacted: "${emoji} ${text}"`, 'success');
    }
  };

  return (
    <>
      {/* Floating animated reactions on screen */}
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        {activeEmotes.map((e) => (
          <div
            key={e.id}
            className="absolute flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-amber-400/80 text-white font-mono text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-bounce"
            style={{
              left: `${e.x}%`,
              top: `${e.y}%`,
              transition: 'all 2s ease-out',
            }}
          >
            <span className="text-xl">{e.emoji}</span>
            {e.text && <span className="text-xs text-amber-300">{e.text}</span>}
          </div>
        ))}
      </div>

      {/* Trigger Pill / Menu */}
      <div className="relative inline-block z-30">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-amber-300 font-mono text-xs font-bold transition shadow-lg active:scale-95"
          title="In-Game Reactions & Taunts"
        >
          <Smile className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">React</span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-72 sm:w-80 p-3 bg-[#0b0f19] border border-amber-500/40 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] animate-scale-up space-y-3 z-50">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-[11px] font-black uppercase text-amber-400 font-mono flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Emotes & Taunts</span>
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Emojis */}
            <div className="grid grid-cols-6 gap-1.5">
              {EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => triggerReaction(emoji)}
                  className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-400/50 flex items-center justify-center text-lg transition active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Tactical Quick Phrases */}
            <div className="space-y-1 pt-1 border-t border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Tactical Quick Phrases
              </span>
              <div className="grid grid-cols-1 gap-1">
                {QUICK_TAUNTS.map((taunt) => (
                  <button
                    key={taunt}
                    onClick={() => triggerReaction('💬', taunt)}
                    className="w-full text-left px-2.5 py-1 rounded-lg bg-slate-900/70 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-amber-300 font-mono transition"
                  >
                    {taunt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
