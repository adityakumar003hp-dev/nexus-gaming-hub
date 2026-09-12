import React, { useState } from 'react';
import {
  carromAudio,
  CarromSoundTheme,
  CarromSoundSettings,
} from '../utils/carromAudio';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Music,
  Check,
  Disc,
} from 'lucide-react';

interface CarromSoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (newSettings: CarromSoundSettings) => void;
}

export const CarromSoundSettingsModal: React.FC<CarromSoundSettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChange,
}) => {
  const [settings, setSettings] = useState<CarromSoundSettings>(() =>
    carromAudio.getSettings()
  );
  const [activeTest, setActiveTest] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdate = (partial: Partial<CarromSoundSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    carromAudio.saveSettings(partial);
    if (onSettingsChange) onSettingsChange(updated);
  };

  const handleTestSound = (type: 'strike' | 'clack' | 'rim' | 'pocket' | 'foul' | 'win') => {
    setActiveTest(type);
    if (type === 'strike') carromAudio.playStrikerRelease(75);
    else if (type === 'clack') carromAudio.playCoinClack(8);
    else if (type === 'rim') carromAudio.playRimBounce(7);
    else if (type === 'pocket') carromAudio.playPocketSink('queen');
    else if (type === 'foul') carromAudio.playFoulPenalty();
    else if (type === 'win') carromAudio.playVictoryFanfare();

    setTimeout(() => setActiveTest(null), 400);
  };

  const handleResetDefaults = () => {
    const defaults: CarromSoundSettings = {
      theme: 'classic',
      volume: 0.85,
      pitchScale: 1.0,
      woodResonance: 1.0,
      enabled: true,
    };
    setSettings(defaults);
    carromAudio.saveSettings(defaults);
    if (onSettingsChange) onSettingsChange(defaults);
    carromAudio.playCoinClack(8);
  };

  const soundThemes: {
    id: CarromSoundTheme;
    name: string;
    description: string;
    tag: string;
    color: string;
    border: string;
  }[] = [
    {
      id: 'classic',
      name: 'Classic Rosewood & Boxwood',
      description: 'Warm, resonant hardwood acoustic clacks, authentic Indian carrom board cushion bounce, and woven pocket thud.',
      tag: 'Authentic Traditional',
      color: 'bg-amber-950/40 text-amber-300',
      border: 'border-amber-700/50',
    },
    {
      id: 'tournament',
      name: 'Tournament Pro (Ivory & Birch)',
      description: 'Heavy competition acrylic striker snap, dense resin piece impacts, and stiff English birchwood rim feedback.',
      tag: 'Crisp & Snappy',
      color: 'bg-blue-950/40 text-blue-300',
      border: 'border-blue-700/50',
    },
    {
      id: 'arcade',
      name: 'Arcade Crystal Neon',
      description: 'Futuristic glass pings, synth harmonic strikes, and celebratory cosmic pocket chimes.',
      tag: 'Modern & Punchy',
      color: 'bg-purple-950/40 text-purple-300',
      border: 'border-purple-700/50',
    },
    {
      id: 'retro',
      name: 'Retro Tactile (Mechanical Click)',
      description: 'Tight 8-bit mechanical keystroke clicks and low-resonance arcade hits.',
      tag: 'Vintage Tactile',
      color: 'bg-emerald-950/40 text-emerald-300',
      border: 'border-emerald-700/50',
    },
    {
      id: 'synth',
      name: 'Web Audio Synthesizer (carrom_game.js)',
      description: 'Ultra-fast procedural Web Audio API audio synthesis: dynamic triangle frequency ramps (400Hz → 100Hz) and pure sine pocket drops (150Hz → 40Hz).',
      tag: 'Synthesizer Engine',
      color: 'bg-cyan-950/40 text-cyan-300',
      border: 'border-cyan-700/50',
    },
    {
      id: 'custom',
      name: 'Custom Sound Profile',
      description: 'User-calibrated pitch shifter, wood body damping, and customized frequency harmonics.',
      tag: 'Equalizer Tuned',
      color: 'bg-rose-950/40 text-rose-300',
      border: 'border-rose-700/50',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fadeIn">
      <div className="relative bg-[#0d121f] border border-[#242f4c] rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl text-white flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#242f4c] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Disc className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Carrom Board Sound Studio
              </h3>
              <p className="text-xs text-slate-400">
                Change, customize, and test realistic board acoustic profiles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 text-xs">
          {/* Master Mute & Volume */}
          <div className="bg-[#141a2c] border border-[#222d48] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#3498db]" /> Master Sound
              </label>
              <button
                onClick={() => {
                  const newEnabled = !settings.enabled;
                  handleUpdate({ enabled: newEnabled });
                  if (newEnabled) carromAudio.playCoinClack(6);
                }}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition ${
                  settings.enabled
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                }`}
              >
                {settings.enabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{settings.enabled ? 'Sound Enabled' : 'Muted'}</span>
              </button>
            </div>

            {/* Volume Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Volume Level</span>
                <span className="font-mono text-white">{Math.round(settings.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  handleUpdate({ volume: val });
                }}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          {/* Sound Themes */}
          <div className="space-y-2">
            <label className="font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-400" /> Sound Profiles &amp; Themes
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Click to switch</span>
            </label>

            <div className="grid grid-cols-1 gap-2">
              {soundThemes.map((theme) => {
                const isSelected = settings.theme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      handleUpdate({ theme: theme.id });
                      setTimeout(() => {
                        carromAudio.playCoinClack(8);
                      }, 50);
                    }}
                    className={`text-left p-3 rounded-xl border transition flex items-start justify-between gap-3 ${
                      isSelected
                        ? `${theme.border} bg-[#161f36] shadow-md`
                        : 'border-[#1e273d] bg-[#111624] hover:border-slate-600 hover:bg-[#151c2e]'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{theme.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${theme.color}`}>
                          {theme.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{theme.description}</p>
                    </div>

                    <div className="pt-0.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                          isSelected
                            ? 'bg-amber-500 border-amber-400 text-black'
                            : 'border-slate-600 bg-slate-900/60'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Equalizer / Tone Replacement Tuner (Pitch & Wood Resonance) */}
          <div className="bg-[#141a2c] border border-[#222d48] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-400" /> Pitch &amp; Resonance Tuner
              </label>
              <button
                onClick={handleResetDefaults}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition"
                title="Reset pitch and resonance to defaults"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Pitch Scale Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Tone Pitch (Deep Hardwood &harr; High Crisp Snap)</span>
                <span className="font-mono text-white">{settings.pitchScale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.5"
                step="0.05"
                value={settings.pitchScale}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  handleUpdate({ pitchScale: val });
                }}
                className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Wood Resonance Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Wood Body Damping &amp; Resonance</span>
                <span className="font-mono text-white">{settings.woodResonance.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.8"
                step="0.05"
                value={settings.woodResonance}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  handleUpdate({ woodResonance: val });
                }}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          {/* Live Audition / Sound Test Rack */}
          <div className="space-y-2">
            <label className="font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Audition / Test Board Sounds
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Tap to preview</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTestSound('strike')}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                  activeTest === 'strike'
                    ? 'bg-amber-500/30 border-amber-400 text-white'
                    : 'bg-[#111624] border-[#1e273d] hover:border-slate-500 text-slate-300'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="font-bold text-[11px]">Striker Flick</span>
                  <span className="text-[9px] text-slate-400">Release snap</span>
                </div>
                <Play className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleTestSound('clack')}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                  activeTest === 'clack'
                    ? 'bg-amber-500/30 border-amber-400 text-white'
                    : 'bg-[#111624] border-[#1e273d] hover:border-slate-500 text-slate-300'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="font-bold text-[11px]">Coin Clack</span>
                  <span className="text-[9px] text-slate-400">Piece collision</span>
                </div>
                <Play className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleTestSound('rim')}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                  activeTest === 'rim'
                    ? 'bg-amber-500/30 border-amber-400 text-white'
                    : 'bg-[#111624] border-[#1e273d] hover:border-slate-500 text-slate-300'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="font-bold text-[11px]">Cushion Rim</span>
                  <span className="text-[9px] text-slate-400">Hardwood bounce</span>
                </div>
                <Play className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleTestSound('pocket')}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                  activeTest === 'pocket'
                    ? 'bg-amber-500/30 border-amber-400 text-white'
                    : 'bg-[#111624] border-[#1e273d] hover:border-slate-500 text-slate-300'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="font-bold text-[11px]">Queen Pocket</span>
                  <span className="text-[9px] text-slate-400">Royal chime sink</span>
                </div>
                <Play className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleTestSound('foul')}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                  activeTest === 'foul'
                    ? 'bg-amber-500/30 border-amber-400 text-white'
                    : 'bg-[#111624] border-[#1e273d] hover:border-slate-500 text-slate-300'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="font-bold text-[11px]">Striker Foul</span>
                  <span className="text-[9px] text-slate-400">Damped penalty</span>
                </div>
                <Play className="w-3.5 h-3.5 text-red-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleTestSound('win')}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                  activeTest === 'win'
                    ? 'bg-amber-500/30 border-amber-400 text-white'
                    : 'bg-[#111624] border-[#1e273d] hover:border-slate-500 text-slate-300'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="font-bold text-[11px]">Victory Melody</span>
                  <span className="text-[9px] text-slate-400">Championship</span>
                </div>
                <Play className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#242f4c] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Active: <span className="text-amber-400 font-bold capitalize">{settings.theme}</span> Theme
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition"
          >
            Apply &amp; Done
          </button>
        </div>
      </div>
    </div>
  );
};
