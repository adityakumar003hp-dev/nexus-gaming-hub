import React, { useState } from 'react';
import { Clock, Palette, User, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { GameSettings, BoardTheme, TimeControlPreset } from '../types';
import { soundFx } from '../utils/audio';

interface MatchSettingsWheelPanelProps {
  settings: GameSettings;
  onUpdateSettings: (updater: (prev: GameSettings) => GameSettings) => void;
  orientation: 'w' | 'b';
  onSetOrientation: (orient: 'w' | 'b') => void;
  onSpinReward?: (result: string) => void;
  onOpenDailyWheel?: () => void;
}

const WHEEL_SEGMENTS = [
  { label: 'White', color: '#3b82f6', icon: '⚪' },
  { label: '+100 🟡', color: '#f59e0b', icon: '💰' },
  { label: 'Black', color: '#6366f1', icon: '⚫' },
  { label: '2x XP', color: '#ec4899', icon: '⚡' },
  { label: 'White', color: '#06b6d4', icon: '⚪' },
  { label: '+50 🟡', color: '#10b981', icon: '🪙' },
  { label: 'Black', color: '#8b5cf6', icon: '⚫' },
  { label: 'Mystery', color: '#f43f5e', icon: '🎁' },
];

export const MatchSettingsWheelPanel: React.FC<MatchSettingsWheelPanelProps> = ({
  settings,
  onUpdateSettings,
  orientation,
  onSetOrientation,
  onSpinReward,
  onOpenDailyWheel,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinResult, setSpinResult] = useState<string | null>(null);

  const handleSpin = () => {
    if (onOpenDailyWheel) {
      onOpenDailyWheel();
      return;
    }
    if (isSpinning) return;
    setIsSpinning(true);
    setSpinResult(null);
    soundFx.playMove();

    // Random rotation between 4 to 8 full spins + random slice offset
    const randomDeg = 1440 + Math.floor(Math.random() * 360);
    const newRotation = rotation + randomDeg;
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const normalizedDeg = (newRotation % 360);
      const segmentIndex = Math.floor(((360 - normalizedDeg + 22.5) % 360) / 45);
      const chosen = WHEEL_SEGMENTS[segmentIndex] || WHEEL_SEGMENTS[0];
      setSpinResult(chosen.label);
      soundFx.playCheck();

      if (chosen.label === 'White') {
        onSetOrientation('w');
      } else if (chosen.label === 'Black') {
        onSetOrientation('b');
      }

      if (onSpinReward) {
        onSpinReward(chosen.label);
      }
    }, 3000);
  };

  return (
    <div className="w-full bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between h-full space-y-4">
      {/* Top Section: Match Settings */}
      <div>
        <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-3 text-left">
          MATCH SETTINGS
        </h3>

        <div className="space-y-2.5">
          {/* Time Control */}
          <div className="flex items-center justify-between bg-[#070b14] border border-slate-800/90 rounded-xl p-2.5 px-3">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Time Control</span>
            </div>
            <select
              value={settings.timeControl.preset}
              onChange={(e) => {
                const preset = e.target.value as TimeControlPreset;
                let initialSeconds = 600;
                let incrementSeconds = 0;
                if (preset === '1+0') initialSeconds = 60;
                if (preset === '3+0') initialSeconds = 180;
                if (preset === '3+2') { initialSeconds = 180; incrementSeconds = 2; }
                if (preset === '5+0') initialSeconds = 300;
                if (preset === '5+3') { initialSeconds = 300; incrementSeconds = 3; }
                if (preset === '10+0') initialSeconds = 600;
                if (preset === '15+10') { initialSeconds = 900; incrementSeconds = 10; }
                if (preset === '30+0') initialSeconds = 1800;
                if (preset === 'untimed') initialSeconds = 0;

                onUpdateSettings((prev) => ({
                  ...prev,
                  timeControl: { preset, initialSeconds, incrementSeconds },
                }));
              }}
              className="bg-[#030712] border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="1+0">1 min (Bullet)</option>
              <option value="3+0">3 min (Blitz)</option>
              <option value="3+2">3+2 min</option>
              <option value="5+0">5 min (Rapid)</option>
              <option value="5+3">5+3 min</option>
              <option value="10+0">10 min</option>
              <option value="15+10">15+10 min</option>
              <option value="30+0">30 min (Classical)</option>
              <option value="untimed">Untimed</option>
            </select>
          </div>

          {/* Board Theme */}
          <div className="flex items-center justify-between bg-[#070b14] border border-slate-800/90 rounded-xl p-2.5 px-3">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              <span>Board Theme</span>
            </div>
            <select
              value={settings.boardTheme}
              onChange={(e) => {
                const theme = e.target.value as BoardTheme;
                onUpdateSettings((prev) => ({ ...prev, boardTheme: theme }));
              }}
              className="bg-[#030712] border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-white font-bold focus:outline-none focus:border-indigo-500 capitalize cursor-pointer"
            >
              <option value="emerald">Green / Emerald</option>
              <option value="wood">Wood</option>
              <option value="obsidian">Obsidian</option>
              <option value="midnight">Midnight</option>
              <option value="ocean">Ocean Blue</option>
              <option value="classic">Classic Wood</option>
            </select>
          </div>

          {/* Play As */}
          <div className="flex items-center justify-between bg-[#070b14] border border-slate-800/90 rounded-xl p-2.5 px-3">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Play As</span>
            </div>
            <div className="flex items-center gap-1 bg-[#030712] border border-slate-800 p-0.5 rounded-lg">
              <button
                onClick={() => onSetOrientation('w')}
                className={`px-2 py-0.5 rounded text-[11px] font-extrabold transition ${
                  orientation === 'w'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                White
              </button>
              <button
                onClick={() => onSetOrientation('b')}
                className={`px-2 py-0.5 rounded text-[11px] font-extrabold transition ${
                  orientation === 'b'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Black
              </button>
            </div>
          </div>

          {/* Sound Effects */}
          <div className="flex items-center justify-between bg-[#070b14] border border-slate-800/90 rounded-xl p-2.5 px-3">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
              {settings.soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>Sound Effects</span>
            </div>
            <button
              onClick={() => {
                onUpdateSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
              }}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition duration-300 ${
                settings.soundEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Wheel of Luck (Who goes first?) */}
      <div className="pt-3 border-t border-slate-800/70 text-center">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-200 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>WHEEL OF LUCK</span>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">Who goes first?</span>
        </div>

        {/* Interactive Spin Wheel Graphic */}
        <div className="relative w-36 h-36 mx-auto my-1 flex items-center justify-center">
          {/* Wheel Pointer Arrow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-amber-400 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />

          {/* Spinning SVG Wheel */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full rounded-full shadow-2xl border-2 border-slate-700/80 transition-transform duration-[3000ms] ease-out"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {WHEEL_SEGMENTS.map((seg, i) => {
              const startAngle = i * 45;
              const endAngle = startAngle + 45;
              const x1 = 50 + 50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
              const y1 = 50 + 50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
              const x2 = 50 + 50 * Math.cos((Math.PI * (endAngle - 90)) / 180);
              const y2 = 50 + 50 * Math.sin((Math.PI * (endAngle - 90)) / 180);
              const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

              // Icon position
              const midAngle = startAngle + 22.5;
              const ix = 50 + 32 * Math.cos((Math.PI * (midAngle - 90)) / 180);
              const iy = 50 + 32 * Math.sin((Math.PI * (midAngle - 90)) / 180);

              return (
                <g key={i}>
                  <path d={pathData} fill={seg.color} stroke="#070b14" strokeWidth="1" />
                  <text
                    x={ix}
                    y={iy}
                    fill="#ffffff"
                    fontSize="6"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {seg.icon}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Center SPIN Button */}
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className="absolute z-10 w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-500 border-2 border-white shadow-xl flex items-center justify-center font-black text-[10px] text-white tracking-wider hover:scale-105 active:scale-95 transition-transform disabled:opacity-80 cursor-pointer"
          >
            {isSpinning ? '...' : 'SPIN'}
          </button>
        </div>

        {/* Spin Result Banner */}
        {spinResult && (
          <div className="mt-1 text-xs font-bold text-amber-300 animate-bounce">
            Result: {spinResult}!
          </div>
        )}
      </div>
    </div>
  );
};
