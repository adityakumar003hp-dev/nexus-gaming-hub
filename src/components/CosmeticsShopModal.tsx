import React, { useState, useEffect } from 'react';
import { X, Sparkles, ShoppingBag, Check, Lock, Palette, Dice5, Eye, Coins, Gem, Flame, Zap, Shield, Crown } from 'lucide-react';
import { getUserPoints, getUserGems, setUserPoints, setUserGems } from '../utils/pointsManager';
import { soundFx } from '../utils/audio';

export interface CosmeticItem {
  id: string;
  name: string;
  category: 'dice' | 'board' | 'trail';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  description: string;
  costCoins?: number;
  costGems?: number;
  previewBg: string;
  iconColor: string;
  glowColor: string;
}

const COSMETICS_CATALOG: CosmeticItem[] = [
  // DICE SKINS
  {
    id: 'dice_classic',
    name: 'Classic Ivory',
    category: 'dice',
    rarity: 'Common',
    description: 'The timeless standard polished ivory dice with deep obsidian pips.',
    costCoins: 0,
    previewBg: 'from-slate-100 to-slate-300 text-slate-900',
    iconColor: '#f1f5f9',
    glowColor: 'rgba(241, 245, 249, 0.3)',
  },
  {
    id: 'dice_neon_cyber',
    name: 'Neon Cyberpunk',
    category: 'dice',
    rarity: 'Rare',
    description: 'High-frequency luminescent neon die emitting a sharp cyan laser pulse.',
    costCoins: 5000,
    previewBg: 'from-cyan-500 to-blue-600 text-white',
    iconColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.5)',
  },
  {
    id: 'dice_inferno_crimson',
    name: 'Inferno Crimson',
    category: 'dice',
    rarity: 'Epic',
    description: 'Forged in subterranean magma; embers drift off each roll.',
    costCoins: 12000,
    costGems: 50,
    previewBg: 'from-amber-600 to-rose-700 text-amber-100',
    iconColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.6)',
  },
  {
    id: 'dice_golden_luxury',
    name: '24K Grand High Roller',
    category: 'dice',
    rarity: 'Legendary',
    description: 'Pure gilded platinum-gold alloy reserved for elite tournament victors.',
    costGems: 250,
    previewBg: 'from-amber-300 via-yellow-400 to-amber-600 text-slate-950',
    iconColor: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.7)',
  },
  {
    id: 'dice_void_obsidian',
    name: 'Void Obsidian',
    category: 'dice',
    rarity: 'Legendary',
    description: 'Crafted from compressed galactic dark matter that warps surrounding light.',
    costGems: 400,
    previewBg: 'from-purple-900 via-indigo-950 to-black text-purple-200',
    iconColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.8)',
  },

  // BOARD THEMES
  {
    id: 'board_classic_wood',
    name: 'Standard Oak Wood',
    category: 'board',
    rarity: 'Common',
    description: 'Traditional hand-carved mahogany and maple tournament grain.',
    costCoins: 0,
    previewBg: 'from-amber-800 to-amber-950 text-amber-100',
    iconColor: '#d97706',
    glowColor: 'rgba(217, 119, 6, 0.3)',
  },
  {
    id: 'board_midnight_cyber',
    name: 'Midnight Matrix',
    category: 'board',
    rarity: 'Rare',
    description: 'Sub-zero obsidian grid with pulsed LED circuitry lines.',
    costCoins: 8000,
    previewBg: 'from-slate-900 via-indigo-950 to-slate-900 text-cyan-300',
    iconColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
  },
  {
    id: 'board_royal_emerald',
    name: 'Royal Emerald Velvet',
    category: 'board',
    rarity: 'Epic',
    description: 'Lush casino velvet bordered by polished brass and emerald gemstone inlays.',
    costCoins: 15000,
    costGems: 75,
    previewBg: 'from-emerald-800 to-teal-950 text-emerald-100',
    iconColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.5)',
  },
  {
    id: 'board_galaxy_nebula',
    name: 'Cosmic Nebula',
    category: 'board',
    rarity: 'Legendary',
    description: 'Deep space starfield with orbiting cosmic dust and radiant aurora tiles.',
    costGems: 300,
    previewBg: 'from-fuchsia-950 via-purple-900 to-indigo-950 text-pink-200',
    iconColor: '#e879f9',
    glowColor: 'rgba(232, 121, 249, 0.7)',
  },

  // TOKEN FX TRAILS
  {
    id: 'trail_none',
    name: 'Minimalist Motion',
    category: 'trail',
    rarity: 'Common',
    description: 'Clean, instantaneous token translation without motion particles.',
    costCoins: 0,
    previewBg: 'from-slate-800 to-slate-900 text-slate-300',
    iconColor: '#94a3b8',
    glowColor: 'rgba(148, 163, 184, 0.2)',
  },
  {
    id: 'trail_lightning',
    name: 'Thunderbolt Surge',
    category: 'trail',
    rarity: 'Rare',
    description: 'Electric blue arc that discharges sparks upon capturing any token.',
    costCoins: 10000,
    previewBg: 'from-sky-700 to-blue-900 text-cyan-200',
    iconColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.5)',
  },
  {
    id: 'trail_dragon_fire',
    name: 'Solar Flare Trail',
    category: 'trail',
    rarity: 'Epic',
    description: 'Intense trailing thermal flare that ignites opponent landing spots.',
    costCoins: 20000,
    costGems: 100,
    previewBg: 'from-orange-600 to-red-900 text-amber-200',
    iconColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.6)',
  },
  {
    id: 'trail_stardust_gold',
    name: 'Stardust Supernova',
    category: 'trail',
    rarity: 'Legendary',
    description: 'Shimmering gold star clusters and diamond halos trail each turn.',
    costGems: 350,
    previewBg: 'from-yellow-500 via-amber-400 to-yellow-600 text-slate-950',
    iconColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.8)',
  },
];

export interface CosmeticsShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquip?: (item?: CosmeticItem) => void;
  onNotification?: (text: string, type?: 'success' | 'warning' | 'error') => void;
}

export const CosmeticsShopModal: React.FC<CosmeticsShopModalProps> = ({
  isOpen,
  onClose,
  onEquip,
  onNotification,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'dice' | 'board' | 'trail'>('dice');
  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('user_unlocked_cosmetics');
      return saved ? JSON.parse(saved) : ['dice_classic', 'board_classic_wood', 'trail_none'];
    } catch {
      return ['dice_classic', 'board_classic_wood', 'trail_none'];
    }
  });

  const [equipped, setEquipped] = useState<{ dice: string; board: string; trail: string }>(() => {
    try {
      const saved = localStorage.getItem('user_equipped_cosmetics');
      return saved ? JSON.parse(saved) : { dice: 'dice_classic', board: 'board_classic_wood', trail: 'trail_none' };
    } catch {
      return { dice: 'dice_classic', board: 'board_classic_wood', trail: 'trail_none' };
    }
  });

  const [previewItem, setPreviewItem] = useState<CosmeticItem | null>(null);
  const [coins, setCoins] = useState<number>(getUserPoints());
  const [gems, setGems] = useState<number>(getUserGems());

  useEffect(() => {
    if (isOpen) {
      setCoins(getUserPoints());
      setGems(getUserGems());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredItems = COSMETICS_CATALOG.filter((i) => i.category === selectedCategory);

  const notify = (text: string, type: 'success' | 'warning' | 'error' = 'success') => {
    if (onNotification) onNotification(text, type);
  };

  const handleEquip = (item: CosmeticItem) => {
    const updated = { ...equipped, [item.category]: item.id };
    setEquipped(updated);
    localStorage.setItem('user_equipped_cosmetics', JSON.stringify(updated));
    soundFx.playMove();
    notify(`Equipped "${item.name}"!`, 'success');
    if (onEquip) onEquip(item);
  };

  const handlePurchase = (item: CosmeticItem) => {
    // Check pricing
    const currentCoins = getUserPoints();
    const currentGems = getUserGems();

    if (item.costGems && item.costGems > 0) {
      if (currentGems < item.costGems) {
        soundFx.playError();
        notify(`Insufficient Gems! You need 💎 ${item.costGems - currentGems} more.`, 'warning');
        return;
      }
      setUserGems(currentGems - item.costGems, `Purchased cosmetic: ${item.name}`);
      setGems(currentGems - item.costGems);
    } else if (item.costCoins && item.costCoins > 0) {
      if (currentCoins < item.costCoins) {
        soundFx.playError();
        notify(`Insufficient Coins! You need 🪙 ${(item.costCoins - currentCoins).toLocaleString()} more.`, 'warning');
        return;
      }
      setUserPoints(currentCoins - item.costCoins, `Purchased cosmetic: ${item.name}`);
      setCoins(currentCoins - item.costCoins);
    }

    const nextUnlocked = [...unlockedIds, item.id];
    setUnlockedIds(nextUnlocked);
    localStorage.setItem('user_unlocked_cosmetics', JSON.stringify(nextUnlocked));

    // Auto equip
    const nextEquipped = { ...equipped, [item.category]: item.id };
    setEquipped(nextEquipped);
    localStorage.setItem('user_equipped_cosmetics', JSON.stringify(nextEquipped));

    soundFx.playWin();
    notify(`🎉 Unlocked & equipped "${item.name}"!`, 'success');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0b0f19] border border-amber-500/30 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.2)] overflow-hidden text-slate-100 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#080c14]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <span>Cosmetics & Theme Emporium</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950">
                  NEW
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Unlock custom dice skins, arena boards, and kinetic trails
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Balances */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 px-3 py-1.5 rounded-xl font-mono text-xs">
              <span className="text-amber-300 font-bold flex items-center gap-1">
                🪙 {coins.toLocaleString()}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-fuchsia-300 font-bold flex items-center gap-1">
                💎 {gems.toLocaleString()}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-4 border-b border-slate-800/80 bg-[#080c14]/50">
          <button
            onClick={() => {
              setSelectedCategory('dice');
              soundFx.playMove();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider font-mono border-b-2 transition ${
              selectedCategory === 'dice'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dice5 className="w-4 h-4" />
            <span>Dice Skins ({COSMETICS_CATALOG.filter((i) => i.category === 'dice').length})</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory('board');
              soundFx.playMove();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider font-mono border-b-2 transition ${
              selectedCategory === 'board'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Board Themes ({COSMETICS_CATALOG.filter((i) => i.category === 'board').length})</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory('trail');
              soundFx.playMove();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider font-mono border-b-2 transition ${
              selectedCategory === 'trail'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Token Trails ({COSMETICS_CATALOG.filter((i) => i.category === 'trail').length})</span>
          </button>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isUnlocked = unlockedIds.includes(item.id) || (item.costCoins === 0 && !item.costGems);
              const isCurrent = equipped[item.category] === item.id;
              const isPreview = previewItem?.id === item.id;

              const rarityBadgeColor =
                item.rarity === 'Legendary'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : item.rarity === 'Epic'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : item.rarity === 'Rare'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-500/20 text-slate-300 border-slate-500/40';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden group ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                      : isPreview
                      ? 'bg-indigo-900/30 border-indigo-400/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top tags */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border font-mono ${rarityBadgeColor}`}>
                      {item.rarity}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 flex items-center gap-1 font-mono">
                        <Check className="w-3 h-3" />
                        <span>Equipped</span>
                      </span>
                    )}
                  </div>

                  {/* Preview Banner */}
                  <div
                    className={`w-full h-24 rounded-xl bg-gradient-to-br ${item.previewBg} flex flex-col items-center justify-center p-3 mb-3 shadow-inner relative`}
                  >
                    {item.category === 'dice' && (
                      <div
                        className="w-12 h-12 rounded-xl bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg transition transform group-hover:scale-110 group-hover:rotate-6"
                        style={{ boxShadow: `0 0 20px ${item.glowColor}` }}
                      >
                        <Dice5 className="w-7 h-7" style={{ color: item.iconColor }} />
                      </div>
                    )}
                    {item.category === 'board' && (
                      <div
                        className="w-14 h-14 rounded-xl bg-black/30 border border-white/20 grid grid-cols-2 grid-rows-2 gap-1 p-1.5 shadow-lg group-hover:scale-105 transition"
                        style={{ boxShadow: `0 0 20px ${item.glowColor}` }}
                      >
                        <div className="rounded bg-white/20" />
                        <div className="rounded bg-white/5" />
                        <div className="rounded bg-white/5" />
                        <div className="rounded bg-white/20" />
                      </div>
                    )}
                    {item.category === 'trail' && (
                      <div className="flex items-center gap-1 group-hover:scale-110 transition">
                        <Sparkles className="w-5 h-5 animate-pulse" style={{ color: item.iconColor }} />
                        <Zap className="w-6 h-6" style={{ color: item.iconColor }} />
                        <Flame className="w-5 h-5 animate-bounce" style={{ color: item.iconColor }} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-white font-mono">{item.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {isUnlocked ? (
                      isCurrent ? (
                        <button
                          disabled
                          className="w-full py-2 rounded-xl bg-slate-800/60 text-slate-400 font-mono text-xs font-bold uppercase cursor-default flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Active Item</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEquip(item)}
                          className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-black uppercase transition cursor-pointer shadow-md active:scale-95"
                        >
                          Equip
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handlePurchase(item)}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-mono text-xs font-black uppercase transition cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>
                          Unlock for{' '}
                          {item.costGems
                            ? `💎 ${item.costGems}`
                            : `🪙 ${item.costCoins?.toLocaleString()}`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info banner */}
        <div className="p-4 border-t border-slate-800 bg-[#080c14] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Equipped skins apply across all multiplayer boards and dice rolls instantly.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase tracking-wider transition"
          >
            Close Emporium
          </button>
        </div>
      </div>
    </div>
  );
};
