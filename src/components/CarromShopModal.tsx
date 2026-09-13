import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShoppingBag,
  Coins,
  Gem,
  Check,
  Zap,
  Search,
  Sparkles,
  Flame,
  Shield,
  CircleDot,
  Compass,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import {
  CARROM_SHOP_DATA,
  CarromItemCategory,
  CarromRarity,
  CarromEquippedLoadout,
  getCarromOwnedItems,
  saveCarromOwnedItems,
  getCarromLoadout,
  saveCarromLoadout,
  CarromStrikerItem,
  CarromPowerItem,
  CarromPuckItem,
  CarromTrailItem,
  CarromPocketItem,
} from '../data/carromMasterInventory';
import {
  getUserPoints,
  spendPoints,
  addPoints,
  getUserGems,
  spendGems,
  addGems,
  syncBalancesToBackend,
} from '../utils/pointsManager';
import { carromAudio } from '../utils/carromAudio';

interface CarromShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquipChange?: (loadout: CarromEquippedLoadout) => void;
  onOpenExchange?: () => void;
}

const RARITY_COLORS: Record<CarromRarity, { bg: string; text: string; border: string }> = {
  STANDARD: { bg: 'bg-slate-700/80', text: 'text-slate-200', border: 'border-slate-500' },
  RARE: { bg: 'bg-blue-600/80', text: 'text-blue-100', border: 'border-blue-400' },
  EPIC: { bg: 'bg-purple-600/80', text: 'text-purple-100', border: 'border-purple-400' },
  LEGENDARY: { bg: 'bg-amber-600/90', text: 'text-amber-100', border: 'border-amber-400' },
  MYTHIC: { bg: 'bg-rose-600/90', text: 'text-rose-100', border: 'border-rose-400' },
};

export const CarromShopModal: React.FC<CarromShopModalProps> = ({
  isOpen,
  onClose,
  onEquipChange,
  onOpenExchange,
}) => {
  const [activeTab, setActiveTab] = useState<CarromItemCategory>('strikers');
  const [activeRarity, setActiveRarity] = useState<'ALL' | CarromRarity>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [coins, setCoins] = useState<number>(() => getUserPoints());
  const [gems, setGems] = useState<number>(() => getUserGems());
  const [ownedItems, setOwnedItems] = useState<Set<string>>(() => getCarromOwnedItems());
  const [loadout, setLoadout] = useState<CarromEquippedLoadout>(() => getCarromLoadout());
  const [messageToast, setMessageToast] = useState<string | null>(null);

  // Sync wallet on modal open and listen to live events
  useEffect(() => {
    if (isOpen) {
      setCoins(getUserPoints());
      setGems(getUserGems());
      setOwnedItems(getCarromOwnedItems());
      setLoadout(getCarromLoadout());
    }
  }, [isOpen]);

  useEffect(() => {
    const handlePointsUpdated = (e: any) => {
      setCoins(e.detail?.points ?? getUserPoints());
    };
    const handleGemsUpdated = (e: any) => {
      setGems(e.detail?.gems ?? getUserGems());
    };

    window.addEventListener('chess_points_updated', handlePointsUpdated);
    window.addEventListener('chess_gems_updated', handleGemsUpdated);

    return () => {
      window.removeEventListener('chess_points_updated', handlePointsUpdated);
      window.removeEventListener('chess_gems_updated', handleGemsUpdated);
    };
  }, []);

  const showToast = (msg: string) => {
    setMessageToast(msg);
    setTimeout(() => {
      setMessageToast(null);
    }, 2800);
  };

  const currentItems = useMemo(() => {
    const rawList = CARROM_SHOP_DATA[activeTab] || [];
    return rawList.filter((item) => {
      const matchRarity =
        activeRarity === 'ALL' || ('rarity' in item && item.rarity === activeRarity);
      const query = searchQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        ('source' in item && (item.source || '').toLowerCase().includes(query));
      return matchRarity && matchQuery;
    });
  }, [activeTab, activeRarity, searchQuery]);

  const handleBuy = (item: CarromStrikerItem | CarromPowerItem | CarromPuckItem | CarromTrailItem | CarromPocketItem) => {
    const price = item.price;
    if (!price || price.amount === 0) {
      // Free item
      const nextOwned = new Set(ownedItems);
      nextOwned.add(item.id);
      setOwnedItems(nextOwned);
      saveCarromOwnedItems(nextOwned);
      carromAudio.playCoinClack(5);
      showToast(`Acquired ${item.name}!`);
      return;
    }

    if (price.type === 'coins') {
      if (spendPoints(price.amount, `Carrom Shop: ${item.name}`)) {
        const nextCoins = getUserPoints();
        setCoins(nextCoins);
        const nextOwned = new Set(ownedItems);
        nextOwned.add(item.id);
        setOwnedItems(nextOwned);
        saveCarromOwnedItems(nextOwned);
        carromAudio.playPocketSink('queen');
        showToast(`Unlocked ${item.name} for ${price.amount.toLocaleString()} Coins!`);
        syncBalancesToBackend(getUserGems(), nextCoins);
      } else {
        showToast(`Insufficient coins! Need ${price.amount.toLocaleString()}`);
      }
    } else {
      if (spendGems(price.amount, `Carrom Shop: ${item.name}`)) {
        const nextGems = getUserGems();
        setGems(nextGems);
        const nextOwned = new Set(ownedItems);
        nextOwned.add(item.id);
        setOwnedItems(nextOwned);
        saveCarromOwnedItems(nextOwned);
        carromAudio.playPocketSink('queen');
        showToast(`Unlocked ${item.name} for ${price.amount.toLocaleString()} Gems!`);
        syncBalancesToBackend(nextGems, getUserPoints());
      } else {
        showToast(`Insufficient gems! Need ${price.amount.toLocaleString()}`);
      }
    }
  };

  const handleEquip = (category: CarromItemCategory, itemId: string) => {
    const updated: CarromEquippedLoadout = { ...loadout };
    if (category === 'strikers') updated.striker = itemId;
    else if (category === 'powers') updated.power = itemId;
    else if (category === 'pucks') updated.puck = itemId;
    else if (category === 'trails') updated.trail = itemId;
    else if (category === 'pockets') updated.pocket = itemId;

    setLoadout(updated);
    saveCarromLoadout(updated);
    if (onEquipChange) onEquipChange(updated);
    carromAudio.playCoinClack(10);
    showToast(`Equipped to match board!`);
  };

  const handleGrantTestFunds = () => {
    addPoints(10000, 'Test funds');
    addGems(150, 'Test gems');
    const nextPoints = getUserPoints();
    const nextGems = getUserGems();
    setCoins(nextPoints);
    setGems(nextGems);
    syncBalancesToBackend(nextGems, nextPoints);
    carromAudio.playPocketSink('queen');
    showToast('+10,000 Coins & +150 Gems added!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="bg-[#18110b] border-2 border-amber-600/70 rounded-2xl w-full max-w-5xl h-[92vh] max-h-[750px] shadow-[0_0_50px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-white relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast alert */}
        {messageToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black font-bold px-4 py-1.5 rounded-full shadow-lg text-xs flex items-center gap-1.5 animate-bounce">
            <Sparkles className="w-4 h-4" /> {messageToast}
          </div>
        )}

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#2a170d] via-[#1c0f08] to-[#2a170d] px-4 sm:px-6 py-3.5 border-b border-amber-600/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <ShoppingBag className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-amber-300 tracking-wide flex items-center gap-2">
                CARROM BOARD SHOP
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Master Inventory
                </span>
              </h2>
              <p className="text-[11px] text-amber-200/60 hidden sm:block">
                Equip custom strikers, power traits, puck sets, aim laser trails, and pocket auras
              </p>
            </div>
          </div>

          {/* Wallet Balances & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              {/* Coins Pill */}
              <div className="bg-[#0b1328] border border-[#23355d] hover:border-amber-500/50 px-3 py-1.5 rounded-xl shadow-inner flex items-center gap-2 transition">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 flex items-center justify-center text-xs font-black shadow-[0_0_10px_rgba(245,158,11,0.5)] border border-amber-300 shrink-0">
                  🪙
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[8px] uppercase tracking-wider text-amber-400/90 font-black leading-none">
                    COINS
                  </span>
                  <span className="text-xs sm:text-sm font-black text-[#f1c40f] leading-none mt-0.5 font-mono">
                    {coins.toLocaleString()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    addPoints(1000, 'Quick add coins');
                    showToast('+1,000 Coins added!');
                  }}
                  className="w-4 h-4 rounded bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/50 text-amber-300 flex items-center justify-center text-[10px] font-black transition active:scale-95 ml-0.5 cursor-pointer"
                  title="Quick Add Coins"
                >
                  +
                </button>
              </div>

              {/* Gems Pill */}
              <div className="bg-[#0b1328] border border-[#23355d] hover:border-fuchsia-500/50 px-3 py-1.5 rounded-xl shadow-inner flex items-center gap-2 transition">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-700 via-fuchsia-600 to-pink-500 text-white flex items-center justify-center text-xs font-black shadow-[0_0_10px_rgba(217,70,239,0.5)] border border-fuchsia-300 shrink-0">
                  💎
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[8px] uppercase tracking-wider text-fuchsia-400/90 font-black leading-none">
                    GEMS
                  </span>
                  <span className="text-xs sm:text-sm font-black text-fuchsia-300 leading-none mt-0.5 font-mono">
                    {gems.toLocaleString()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenExchange) {
                      onClose();
                      onOpenExchange();
                    } else {
                      addGems(50, 'Quick add gems');
                      showToast('+50 Gems added!');
                    }
                  }}
                  className="w-4 h-4 rounded bg-fuchsia-500/20 hover:bg-fuchsia-500/40 border border-fuchsia-400/50 text-fuchsia-300 flex items-center justify-center text-[10px] font-black transition active:scale-95 ml-0.5 cursor-pointer"
                  title="Quick Add Gems / Exchange"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleGrantTestFunds}
              className="hidden sm:flex bg-gradient-to-r from-amber-600/40 to-amber-700/40 hover:from-amber-600/60 hover:to-amber-700/60 border border-amber-500/50 text-amber-200 text-[10px] font-bold px-2.5 py-1.5 rounded-lg items-center gap-1 transition active:scale-95 shadow-sm"
              title="Add test coins & gems to test unlock any piece immediately"
            >
              +10K Coins &amp; +150 Gems
            </button>

            <button
              onClick={onClose}
              className="text-amber-300/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
              title="Close Shop"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex border-b border-amber-900/50 bg-[#211108] overflow-x-auto select-none">
          {(
            [
              { id: 'strikers', label: 'Strikers', icon: CircleDot, count: CARROM_SHOP_DATA.strikers.length },
              { id: 'powers', label: 'Powers', icon: Zap, count: CARROM_SHOP_DATA.powers.length },
              { id: 'pucks', label: 'Pucks', icon: Shield, count: CARROM_SHOP_DATA.pucks.length },
              { id: 'trails', label: 'Aim Trails', icon: Compass, count: CARROM_SHOP_DATA.trails.length },
              { id: 'pockets', label: 'Pocket FX', icon: Flame, count: CARROM_SHOP_DATA.pockets.length },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setActiveRarity('ALL');
                }}
                className={`flex-1 min-w-[120px] py-3 px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition uppercase tracking-wider ${
                  isActive
                    ? 'border-amber-400 text-amber-300 bg-[#2f190d]'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-amber-200/80">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter & Search Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#140b06] border-b border-amber-950 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-[10px] font-bold text-amber-200/50 uppercase tracking-wider mr-1">
              Rarity:
            </span>
            {(['ALL', 'STANDARD', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'] as const).map((rarity) => (
              <button
                key={rarity}
                onClick={() => setActiveRarity(rarity)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide transition uppercase ${
                  activeRarity === rarity
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'bg-[#25140b] text-slate-400 hover:text-white hover:bg-[#311c11]'
                }`}
              >
                {rarity}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search catalog..."
              className="w-full bg-[#201008] border border-amber-900/60 focus:border-amber-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition"
            />
          </div>
        </div>

        {/* Item Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#160d07] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 custom-scrollbar">
          {currentItems.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center text-slate-500">
              <Sliders className="w-10 h-10 text-amber-600/40 mb-2" />
              <p className="text-sm font-semibold">No catalog items match your search &amp; filter.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveRarity('ALL');
                }}
                className="mt-3 text-xs text-amber-400 underline font-medium"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            currentItems.map((item) => {
              const isOwned = ownedItems.has(item.id);
              const equippedId =
                activeTab === 'strikers'
                  ? loadout.striker
                  : activeTab === 'powers'
                  ? loadout.power
                  : activeTab === 'pucks'
                  ? loadout.puck
                  : activeTab === 'trails'
                  ? loadout.trail
                  : loadout.pocket;
              const isEquipped = equippedId === item.id;
              const rarity = ('rarity' in item ? item.rarity : 'STANDARD') as CarromRarity;
              const rarityStyle = RARITY_COLORS[rarity] || RARITY_COLORS.STANDARD;
              const price = item.price;

              return (
                <div
                  key={item.id}
                  className={`bg-[#20120a] border rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 relative group ${
                    isEquipped
                      ? 'border-cyan-400 ring-1 ring-cyan-400/50 bg-[#162121] shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                      : isOwned
                      ? 'border-amber-900/60 hover:border-amber-600'
                      : 'border-[#381e11] hover:border-amber-700/80'
                  }`}
                >
                  {/* Top Bar: Rarity tag & ID */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${rarityStyle.bg} ${rarityStyle.text} ${rarityStyle.border}`}
                      >
                        {rarity}
                      </span>
                      <span className="text-[10px] text-amber-200/50 truncate max-w-[110px]">
                        {'source' in item ? item.source : 'Special'}
                      </span>
                    </div>

                    {/* Disc / Preview Graphic */}
                    <div className="my-2.5 flex items-center justify-center">
                      {activeTab === 'strikers' ? (
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: (item as CarromStrikerItem).color || '#f8fafc',
                            border: `3.5px solid ${(item as CarromStrikerItem).rimColor || '#1e3a8a'}`,
                            boxShadow: (item as CarromStrikerItem).glowColor
                              ? `0 0 16px ${(item as CarromStrikerItem).glowColor}`
                              : '0 4px 10px rgba(0,0,0,0.5)',
                          }}
                        >
                          <div
                            className="w-7 h-7 rounded-full border-2"
                            style={{
                              borderColor: (item as CarromStrikerItem).innerColor || '#3b82f6',
                            }}
                          />
                        </div>
                      ) : activeTab === 'pucks' ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-9 h-9 rounded-full border-2 shadow-md flex items-center justify-center"
                            style={{
                              backgroundColor: (item as CarromPuckItem).whiteColor || '#ffffff',
                              borderColor: (item as CarromPuckItem).rimColor || '#d97706',
                            }}
                          >
                            <div className="w-3 h-3 rounded-full border border-amber-700" />
                          </div>
                          <div
                            className="w-9 h-9 rounded-full border-2 shadow-md flex items-center justify-center"
                            style={{
                              backgroundColor: (item as CarromPuckItem).blackColor || '#1e293b',
                              borderColor: (item as CarromPuckItem).rimColor || '#d97706',
                            }}
                          >
                            <div className="w-3 h-3 rounded-full border border-slate-500" />
                          </div>
                        </div>
                      ) : activeTab === 'trails' ? (
                        <div className="w-full h-12 bg-black/40 rounded-lg p-2 flex flex-col items-center justify-center border border-amber-950">
                          <div
                            className="w-3/4 h-1 rounded-full"
                            style={{
                              backgroundColor: (item as CarromTrailItem).color || '#f59e0b',
                              boxShadow: `0 0 10px ${(item as CarromTrailItem).glowColor || 'transparent'}`,
                            }}
                          />
                          <span className="text-[9px] text-slate-400 mt-1.5 font-mono">
                            {(item as CarromTrailItem).dashPattern ? 'Dotted Laser' : 'Solid Ray'}
                          </span>
                        </div>
                      ) : activeTab === 'pockets' ? (
                        <div
                          className="w-14 h-14 rounded-full bg-black border-2 flex items-center justify-center relative shadow-inner"
                          style={{
                            borderColor: (item as CarromPocketItem).ringColor || '#ea580c',
                            boxShadow: (item as CarromPocketItem).glowColor
                              ? `0 0 14px ${(item as CarromPocketItem).glowColor}`
                              : 'none',
                          }}
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-900 border border-amber-900/60" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-amber-950/40 border border-amber-700/40 flex items-center justify-center">
                          <Zap className="w-7 h-7 text-amber-400" />
                        </div>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div className="text-center mb-2">
                      <h3 className="font-bold text-sm text-white">{item.name}</h3>
                      {'description' in item && item.description && (
                        <p className="text-[10px] text-amber-200/60 mt-1 leading-snug line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Stats Meters (For Strikers and Powers) */}
                    {'stats' in item && item.stats && (
                      <div className="bg-[#140b06] rounded-lg p-2 my-2 flex flex-col gap-1 border border-amber-950">
                        <div className="flex items-center text-[10px]">
                          <span className="w-10 text-slate-400 font-semibold">Force</span>
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full mx-1.5 overflow-hidden">
                            <div
                              className="h-full bg-rose-500 rounded-full"
                              style={{ width: `${item.stats.force * 10}%` }}
                            />
                          </div>
                          <span className="w-4 text-right font-bold text-slate-200">
                            {item.stats.force}
                          </span>
                        </div>
                        <div className="flex items-center text-[10px]">
                          <span className="w-10 text-slate-400 font-semibold">Aim</span>
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full mx-1.5 overflow-hidden">
                            <div
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ width: `${item.stats.aim * 10}%` }}
                            />
                          </div>
                          <span className="w-4 text-right font-bold text-slate-200">
                            {item.stats.aim}
                          </span>
                        </div>
                        <div className="flex items-center text-[10px]">
                          <span className="w-10 text-slate-400 font-semibold">Time</span>
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full mx-1.5 overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: `${item.stats.time * 10}%` }}
                            />
                          </div>
                          <span className="w-4 text-right font-bold text-slate-200">
                            {item.stats.time}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Area */}
                  <div className="mt-2 pt-2 border-t border-amber-900/30 flex flex-col gap-1.5">
                    {/* Price display if not owned */}
                    {!isOwned && price && (
                      <div className="flex items-center justify-between text-xs font-bold px-1">
                        <span className="text-slate-400 text-[11px]">Cost:</span>
                        <span
                          className={`flex items-center gap-1 ${
                            price.type === 'coins' ? 'text-amber-400' : 'text-cyan-300'
                          }`}
                        >
                          {price.type === 'coins' ? (
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Gem className="w-3.5 h-3.5 text-cyan-300" />
                          )}
                          {price.amount.toLocaleString()} {price.type.toUpperCase()}
                        </span>
                      </div>
                    )}

                    {isEquipped ? (
                      <button
                        disabled
                        className="w-full py-2 bg-cyan-950/80 border border-cyan-400 text-cyan-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-default shadow-sm"
                      >
                        <Check className="w-4 h-4 stroke-[3]" /> EQUIPPED
                      </button>
                    ) : isOwned ? (
                      <button
                        onClick={() => handleEquip(activeTab, item.id)}
                        className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 transition active:scale-95 shadow-md uppercase tracking-wider cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5 stroke-[3]" /> EQUIP
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuy(item)}
                        className={`w-full py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md uppercase tracking-wider cursor-pointer ${
                          price && price.type === 'gems'
                            ? 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black'
                            : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black'
                        }`}
                      >
                        {price && price.amount === 0 ? (
                          'CLAIM FREE'
                        ) : (
                          <>
                            {price?.type === 'coins' ? (
                              <Coins className="w-3.5 h-3.5 text-black" />
                            ) : (
                              <Gem className="w-3.5 h-3.5 text-black" />
                            )}
                            BUY ({price?.amount.toLocaleString()})
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Loadout Overview */}
        <div className="bg-[#190c05] px-4 sm:px-6 py-3 border-t border-amber-700/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">
              Active Loadout:
            </span>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-400 text-[10px]">Striker:</span>
              <span className="font-bold text-amber-300">
                {CARROM_SHOP_DATA.strikers.find((s) => s.id === loadout.striker)?.name || 'Blaze'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-400 text-[10px]">Puck:</span>
              <span className="font-bold text-amber-300">
                {CARROM_SHOP_DATA.pucks.find((p) => p.id === loadout.puck)?.name || 'Standard'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-400 text-[10px]">Trail:</span>
              <span className="font-bold text-amber-300">
                {CARROM_SHOP_DATA.trails.find((t) => t.id === loadout.trail)?.name || 'Default'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-400 text-[10px]">Pocket:</span>
              <span className="font-bold text-amber-300">
                {CARROM_SHOP_DATA.pockets.find((p) => p.id === loadout.pocket)?.name || 'Default'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-4 py-1.5 rounded-lg text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer ml-auto"
          >
            Done &amp; Play
          </button>
        </div>
      </div>
    </div>
  );
};
