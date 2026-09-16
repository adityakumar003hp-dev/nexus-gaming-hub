import React, { useState, useEffect, useMemo } from 'react';
import { X, Trophy, RefreshCw, UserCheck, Sparkles, Gift, Search, Award, CheckCircle2, ChevronRight, Zap, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActiveBoardGame } from '../types';
import { socketService } from '../utils/socket';
import { UserProfileModal } from './UserProfileModal';
import { isSiteOwner } from '../utils/owner';
import { OwnerBadge } from './OwnerBadge';
import {
  TOP_150_LEADERBOARD_REWARDS,
  getLeaderboardPayout,
  formatPayout,
  formatCompactPayout,
  LEADERBOARD_REWARDS_LIST,
} from '../utils/leaderboardRewards';
import { addPoints, addGems } from '../utils/pointsManager';

export interface LeaderboardUser {
  username: string;
  score?: number;
  times_played?: number;
  wins: number;
  losses: number;
  draws: number;
  resigns?: number;
  total_time_seconds?: number;
  totalGames: number;
  winRate: number;
  global_rank?: number;
  lastActive: number;
  rewardPayout?: number;
  formattedPayout?: string;
}

interface LeaderboardModalProps {
  activeBoardGame?: ActiveBoardGame;
  isOpen: boolean;
  onClose: () => void;
  currentUserHandle?: string;
}

const GAME_NAMES: Record<ActiveBoardGame, string> = {
  chess: 'Chess Pro',
  checkers: 'Draughts Arena',
  backgammon: 'Backgammon Club',
  snakes: 'Snakes & Ladders',
  ludo: 'Ludo Master',
  gomoku: 'Gomoku Arena',
  reversi: 'Reversi Othello',
  connect4: 'Connect Four',
  ultimatetictactoe: 'Ultimate TTT',
  dotsandboxes: 'Dots & Boxes',
  battleship: 'Battleship Fleet',
  sim: 'Sim Triangle',
  uno: 'Uno Card Hub',
  hearts: 'Hearts Club',
  ginrummy: 'Gin Rummy',
  speed: 'Speed Spit',
  carrom: 'Carrom Board',
  darts: 'Darts Championship',
  pingpong: 'Ping Pong Classic',
  business: 'Business Empire Online',
};

const GAME_ICONS: Record<ActiveBoardGame, string> = {
  chess: '♔',
  checkers: '👑',
  backgammon: '🎲',
  snakes: '🐍',
  ludo: '🎯',
  gomoku: '⚫',
  reversi: '⚪',
  connect4: '🟡',
  ultimatetictactoe: '❌',
  dotsandboxes: '⏹️',
  battleship: '🚢',
  sim: '🔺',
  uno: '🃏',
  hearts: '♥',
  ginrummy: '🎴',
  speed: '⚡',
  carrom: '🥏',
  darts: '🎯',
  pingpong: '🏓',
  business: '👑',
};

const ALL_GAMES: ActiveBoardGame[] = [
  'chess', 'checkers', 'backgammon', 'snakes', 'ludo', 'gomoku',
  'reversi', 'connect4', 'ultimatetictactoe', 'dotsandboxes',
  'battleship', 'sim', 'uno', 'hearts', 'ginrummy', 'speed',
  'carrom', 'darts', 'pingpong', 'business'
];

// Fallback pool of competitive names to ensure full 150 player table
const FALLBACK_CONTENDER_NAMES = [
  'Grandmaster_Alex', 'ChessKing_99', 'TacticsQueen', 'CrownMaster_Sam', 'PipMaster_Elena',
  'LudoEmperor', 'SuperGrid_Ninja', 'WildCard_Champion', 'StrikerLegend_Raj', 'SpinMaster_Ma',
  'Admiral_Nelson', 'Bullseye_Sniper', 'Arjun_Tycoon', 'DoubleJump_Pro', 'BearingOff_King',
  'LadderRunner_Max', 'TokenCapturer', 'FiveStone_Master', 'CornerFlipper', 'GravityAligner',
  'ChainMaster_Dan', 'GraphTheory_Ace', 'MoonShooter_007', 'MeldMaster_Gin', 'SpitSpeed_Demon',
  'Triple20_Phil', 'PaddleAce_Timo', 'Sneha_Empire', 'ApexKnight', 'VortexBishop',
  'ShadowRook', 'BlitzPawn', 'MasterMind_99', 'TitanStrategist', 'QuantumGamer',
  'NovaPawn', 'EchoMaster', 'CosmicPlayer', 'DragonRook', 'PhoenixQueen',
  'SilverFox_88', 'GoldenKing', 'IronDefense', 'NeonStriker', 'TurboTactics',
  'AlphaPawn', 'BetaBishop', 'GammaKnight', 'DeltaRook', 'OmegaKing',
  'SolarFlare', 'LunarEclipse', 'AeroKnight', 'CyberStrategist', 'HyperPawn',
  'InfinityQueen', 'ZenMaster_01', 'StormBringer', 'ThunderPawn', 'FrostBishop',
  'BlazeKing', 'ShadowHunter', 'PhantomKnight', 'Valkyrie_77', 'SamuraiTactic',
  'RoninPawn', 'ShinobiMaster', 'Vanguard_99', 'Centurion_X', 'GladiatorPro',
  'SpartanKing', 'TitanRook', 'OlympianPlayer', 'VortexChampion', 'ApexGlory',
  'RaptorPawn', 'FalconMaster', 'EagleEye_Pro', 'HawkEye_99', 'CobraCommander',
  'ViperTactics', 'PantherRider', 'TigerStrike', 'LionHeart_Pro', 'WolfPack_Ace',
  'BearClaw_99', 'FoxHound_Pro', 'StarlightGamer', 'SunburstKnight', 'MoonlightQueen',
  'AstralPlayer', 'GalacticPawn', 'NebulaMaster', 'CometStrike', 'MeteorShower',
  'Supernova_99', 'PulsarQueen', 'QuasarKing', 'CosmoRider', 'AstroKnight',
  'ZephyrPawn', 'TempestKing', 'CycloneQueen', 'TornadoMaster', 'HurricanePro',
  'Thunderbolt_99', 'LightningFast', 'BlizzardKing', 'Avalanche_Ace', 'TsunamiMaster',
  'Earthshaker', 'MagmaRook', 'VolcanoQueen', 'GeyserPawn', 'CraterKing',
  'CrystalPawn', 'DiamondKnight', 'EmeraldQueen', 'RubyMaster', 'SapphirePro',
  'TopazKing', 'AmethystRider', 'OnyxKnight', 'PlatinumQueen', 'TitaniumPawn',
  'SteelRook', 'IronClad_99', 'BronzeTitan', 'CopperMaster', 'GoldenEagle',
  'SilverHawk', 'RavenClaw_99', 'NightOwl_Pro', 'FalconPunch', 'ThunderBird',
  'PhoenixRise', 'GriffinRook', 'HydraMaster', 'KrakenKing', 'LeviathanPro',
  'AbyssWatcher', 'VortexRider', 'NovaBlast', 'ZenithKnight', 'ApexPredator',
  'Solaris_Pro', 'EclipseRider', 'QuantumLeap', 'HyperionKing', 'ChronosMaster',
  'SpecterPawn', 'WraithKnight', 'ShadowBlade', 'IronWill_99', 'ValorHeart',
  'AegisShield', 'BastionMaster', 'SentinelPro', 'Paladin_77', 'CrusaderKing'
];

function ensure150Leaders(baseList: LeaderboardUser[], gameKey: ActiveBoardGame): LeaderboardUser[] {
  const result = [...baseList];
  const existingNames = new Set(result.map((u) => u.username.toLowerCase()));

  // Always ensure Aditya-Owner is rank 1
  if (!existingNames.has('aditya-owner')) {
    result.unshift({
      username: 'ADITYA-OWNER',
      score: 2650,
      times_played: 128,
      wins: 120,
      losses: 4,
      draws: 4,
      resigns: 0,
      total_time_seconds: 54000,
      totalGames: 128,
      winRate: 94,
      global_rank: 1,
      lastActive: Date.now(),
      rewardPayout: getLeaderboardPayout(1),
      formattedPayout: formatPayout(getLeaderboardPayout(1)),
    });
    existingNames.add('aditya-owner');
  }

  let nameIndex = 0;
  while (result.length < 150) {
    const rankPos = result.length + 1;
    let chosenName = '';
    while (nameIndex < FALLBACK_CONTENDER_NAMES.length) {
      const candidate = FALLBACK_CONTENDER_NAMES[nameIndex++];
      if (!existingNames.has(candidate.toLowerCase())) {
        chosenName = candidate;
        break;
      }
    }
    if (!chosenName) {
      chosenName = `Contender_${gameKey.toUpperCase()}_${rankPos}`;
    }
    existingNames.add(chosenName.toLowerCase());

    const score = Math.max(1050, Math.round(2500 - ((rankPos - 2) * 9.8) + (Math.sin(rankPos * 1.5) * 5)));
    const wins = Math.max(2, Math.round((score - 950) / 16));
    const losses = Math.max(1, Math.round(wins * (0.16 + (rankPos * 0.003))));
    const draws = rankPos % 5 === 0 ? 2 : rankPos % 3 === 0 ? 1 : 0;
    const totalG = wins + losses + draws;
    const winRate = Math.round((wins / totalG) * 100);
    const payout = getLeaderboardPayout(rankPos);

    result.push({
      username: chosenName,
      score,
      times_played: totalG,
      wins,
      losses,
      draws,
      resigns: Math.floor(losses * 0.1),
      total_time_seconds: totalG * 180,
      totalGames: totalG,
      winRate,
      global_rank: rankPos,
      lastActive: Date.now() - (rankPos * 120000),
      rewardPayout: payout,
      formattedPayout: formatPayout(payout),
    });
  }

  return result.slice(0, 150).map((u, idx) => {
    const rank = idx + 1;
    const payout = getLeaderboardPayout(rank);
    return {
      ...u,
      global_rank: rank,
      rewardPayout: payout,
      formattedPayout: formatPayout(payout),
    };
  });
}

function formatTime(totalSeconds?: number): string {
  if (!totalSeconds) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  activeBoardGame = 'chess',
  isOpen,
  onClose,
  currentUserHandle,
}) => {
  const [selectedGame, setSelectedGame] = useState<ActiveBoardGame>(activeBoardGame);
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rankings' | 'rewards'>('rankings');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rankFilter, setRankFilter] = useState<number | 'all'>('all');
  const [claimingRank, setClaimingRank] = useState<number | null>(null);
  const [claimedRanks, setClaimedRanks] = useState<Record<number, boolean>>({});
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);
  const [claimErrorMessage, setClaimErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedGame(activeBoardGame);
  }, [activeBoardGame]);

  // Load claimed ranks for current user
  useEffect(() => {
    if (isOpen) {
      const userKey = currentUserHandle || 'ADITYA-OWNER';
      // Local storage cache
      try {
        const cached = localStorage.getItem(`chess_claimed_ranks_${userKey.toLowerCase()}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            const map: Record<number, boolean> = {};
            for (const r of parsed) map[Number(r)] = true;
            setClaimedRanks(map);
          }
        }
      } catch (e) {}

      // Fetch official claimed ranks from server
      fetch(`/api/leaderboard/claimed-rewards?userId=${encodeURIComponent(userKey)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.claimedRanks)) {
            setClaimedRanks((prev) => {
              const next = { ...prev };
              for (const r of data.claimedRanks) next[Number(r)] = true;
              try {
                localStorage.setItem(
                  `chess_claimed_ranks_${userKey.toLowerCase()}`,
                  JSON.stringify(Object.keys(next).map(Number))
                );
              } catch (e) {}
              return next;
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen, currentUserHandle]);

  const fetchLeaderboard = (gameToFetch: ActiveBoardGame = selectedGame) => {
    fetch(`/api/leaderboard?game=${gameToFetch}&limit=150`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLeaders(ensure150Leaders(data, gameToFetch));
        } else if (data && Array.isArray(data[gameToFetch])) {
          setLeaders(ensure150Leaders(data[gameToFetch], gameToFetch));
        } else {
          setLeaders(ensure150Leaders([], gameToFetch));
        }
      })
      .catch(() => {
        setLeaders(ensure150Leaders([], gameToFetch));
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard(selectedGame);

      const socket = socketService.getSocket();
      if (socket) {
        const handleLiveUpdate = (updatedData: any) => {
          if (Array.isArray(updatedData) && updatedData.length > 0) {
            setLeaders(ensure150Leaders(updatedData, selectedGame));
          } else if (updatedData && Array.isArray(updatedData[selectedGame])) {
            setLeaders(ensure150Leaders(updatedData[selectedGame], selectedGame));
          }
        };

        socket.on('leaderboard_update', handleLiveUpdate);
        return () => {
          socket.off('leaderboard_update', handleLiveUpdate);
        };
      }
    }
  }, [isOpen, selectedGame]);

  // Determine current user's rank in this game
  const normalizedUserHandle = (currentUserHandle || 'ADITYA-OWNER').toLowerCase();
  const userRankEntry = useMemo(() => {
    return leaders.find(
      (u) =>
        u.username.toLowerCase() === normalizedUserHandle ||
        (normalizedUserHandle === 'aditya-owner' && isSiteOwner(u.username))
    );
  }, [leaders, normalizedUserHandle]);

  const userRank = userRankEntry?.global_rank || (normalizedUserHandle === 'aditya-owner' ? 1 : null);
  const userPayout = userRank ? getLeaderboardPayout(userRank) : 0;
  const isClaimed = userRank ? !!claimedRanks[userRank] : false;

  const handleClaimReward = async (targetRank: number) => {
    if (claimedRanks[targetRank]) {
      setClaimErrorMessage(`Reward for Rank #${targetRank} has already been claimed! Each rank can only be claimed once.`);
      return;
    }

    setClaimingRank(targetRank);
    setClaimSuccessMessage(null);
    setClaimErrorMessage(null);
    const userKey = currentUserHandle || 'ADITYA-OWNER';

    try {
      const res = await fetch('/api/leaderboard/claim-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameType: selectedGame,
          rank: targetRank,
          userId: userKey,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addPoints(data.payout, `Rank #${targetRank} Global Leaderboard Payout in ${GAME_NAMES[selectedGame]}`);
        addGems(data.payout, `Rank #${targetRank} Global Leaderboard Payout in ${GAME_NAMES[selectedGame]}`);
        setClaimedRanks((prev) => {
          const next = { ...prev, [targetRank]: true };
          if (Array.isArray(data.claimedRanks)) {
            for (const r of data.claimedRanks) next[Number(r)] = true;
          }
          try {
            localStorage.setItem(
              `chess_claimed_ranks_${userKey.toLowerCase()}`,
              JSON.stringify(Object.keys(next).map(Number))
            );
          } catch (e) {}
          return next;
        });
        setClaimSuccessMessage(`Successfully claimed ${data.payout.toLocaleString()} Coins & ${data.payout.toLocaleString()} Gems for Rank #${targetRank}!`);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } else {
        if (data.alreadyClaimed) {
          setClaimedRanks((prev) => {
            const next = { ...prev, [targetRank]: true };
            if (Array.isArray(data.claimedRanks)) {
              for (const r of data.claimedRanks) next[Number(r)] = true;
            }
            try {
              localStorage.setItem(
                `chess_claimed_ranks_${userKey.toLowerCase()}`,
                JSON.stringify(Object.keys(next).map(Number))
              );
            } catch (e) {}
            return next;
          });
        }
        setClaimErrorMessage(data.error || 'Failed to claim reward. You may have already claimed this rank reward.');
      }
    } catch (err: any) {
      setClaimErrorMessage(err?.message || 'Network error while attempting to claim reward.');
    } finally {
      setClaimingRank(null);
    }
  };

  if (!isOpen) return null;

  const currentLeaders = leaders.length > 0 ? leaders : ensure150Leaders([], selectedGame);
  const totalMatches = currentLeaders.reduce((acc, curr) => acc + (curr.times_played || curr.totalGames || 0), 0);

  // Filtered leaderboard records
  const filteredLeaders = currentLeaders.filter((item) => {
    if (rankFilter !== 'all') {
      if ((item.global_rank || 0) > rankFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchRank = (item.global_rank || 0).toString() === q || `rank ${item.global_rank}` === q || `#${item.global_rank}` === q;
      const matchName = item.username.toLowerCase().includes(q);
      return matchRank || matchName;
    }
    return true;
  });

  // Filtered rewards schedule
  const filteredRewards = LEADERBOARD_REWARDS_LIST.filter((entry) => {
    if (rankFilter !== 'all') {
      if (entry.rank > rankFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchRank = entry.rank.toString() === q || `rank ${entry.rank}` === q || `#${entry.rank}` === q;
      const leaderAtRank = currentLeaders[entry.rank - 1]?.username?.toLowerCase() || '';
      const matchLeader = leaderAtRank.includes(q);
      const matchPayout = entry.formattedPayout.toLowerCase().includes(q);
      return matchRank || matchLeader || matchPayout;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="relative bg-[#0a0806] border border-[#f3ce6b]/40 backdrop-blur-2xl rounded-3xl max-w-6xl w-full max-h-[92vh] overflow-hidden shadow-[0_0_60px_rgba(243,206,107,0.2)] flex flex-col text-[#e0e0e0]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#f3ce6b]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sticky top-0 bg-[#0a0806]/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#ffe89e] to-[#b8973b] p-0.5 shadow-lg shadow-[#f3ce6b]/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0a0806] rounded-[14px] flex items-center justify-center text-[#ffe89e]">
                <Trophy className="w-6 h-6 text-[#f3ce6b]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#ffe89e] tracking-wider uppercase font-serif">
                  {GAME_NAMES[selectedGame]} Global Leaderboard
                </h2>
                <span className="bg-slate-900 border border-slate-700/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-sky-400 flex items-center gap-1 shadow-inner">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
                  LIVE TOP 1-150
                </span>
              </div>
              <p className="text-xs text-[#f3ce6b]/75 mt-0.5">
                Complete Top 1 to 150 Global Payout Table & Real-Time Standings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* View Mode Toggle */}
            <div className="bg-black/70 border border-amber-500/30 p-1 rounded-2xl flex items-center gap-1">
              <button
                onClick={() => setActiveTab('rankings')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'rankings'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Rankings (Top 150)</span>
              </button>
              <button
                onClick={() => setActiveTab('rewards')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'rewards'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Gift className="w-3.5 h-3.5 text-amber-300" />
                <span>Rewards Table (1-150)</span>
              </button>
            </div>

            <button
              onClick={() => fetchLeaderboard()}
              className="p-2 rounded-xl text-amber-300/70 hover:text-amber-200 hover:bg-white/10 transition"
              title="Refresh Leaderboard"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-amber-300/70 hover:text-amber-200 hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Game Tabs Bar across all 20 board & card games */}
        <div className="px-4 sm:px-5 py-2.5 bg-black/60 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          {ALL_GAMES.map((g) => (
            <button
              key={g}
              onClick={() => {
                setSelectedGame(g);
                setClaimSuccessMessage(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                selectedGame === g
                  ? 'bg-[#f3ce6b] text-slate-950 shadow-[0_0_12px_rgba(243,206,107,0.4)] font-black'
                  : 'text-gray-400 hover:text-white bg-white/5'
              }`}
            >
              <span>{GAME_ICONS[g]}</span>
              <span>{GAME_NAMES[g]}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Top 4 Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Ranked Matches</span>
              <span className="text-lg sm:text-xl font-black text-amber-300 font-mono">{totalMatches.toLocaleString()} Matches</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Top 1 Champion</span>
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-lg sm:text-xl font-black text-emerald-400 truncate">{currentLeaders[0]?.username || 'N/A'}</span>
                {isSiteOwner(currentLeaders[0]?.username || '') && <span>👑</span>}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider flex items-center gap-1">
                <span>Rank #1 Payout</span>
                <Sparkles className="w-3 h-3 text-amber-300" />
              </span>
              <span className="text-lg sm:text-xl font-black text-amber-300 font-mono">
                1,000,000,000 🪙💎
              </span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Prize Pool (1-150)</span>
              <span className="text-lg sm:text-xl font-black text-sky-400 font-mono">
                2,654,775,000 🪙💎
              </span>
            </div>
          </div>

          {/* User's Qualification & Claim Banner */}
          {userRank && (
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-600/20 border border-amber-400/50 rounded-2xl p-3.5 sm:p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-xl font-black shrink-0">
                  #{userRank}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-black text-white">
                      Your Global Rank in {GAME_NAMES[selectedGame]}: <span className="text-amber-300">#{userRank}</span>
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-black">
                      TOP {userRank <= 3 ? 'PODIUM' : userRank <= 10 ? '10' : '150'} QUALIFIED
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/90 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>Eligible Payout:</span>
                    <span className="font-black text-amber-300 text-sm">{userPayout.toLocaleString()} Coins</span>
                    <span>&</span>
                    <span className="font-black text-cyan-300 text-sm">{userPayout.toLocaleString()} Gems</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleClaimReward(userRank)}
                  disabled={claimingRank === userRank || isClaimed}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg ${
                    isClaimed
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {isClaimed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Reward Claimed</span>
                    </>
                  ) : claimingRank === userRank ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Claiming...</span>
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4" />
                      <span>Claim Rank #{userRank} Reward</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {claimSuccessMessage && (
            <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-3 text-xs text-emerald-300 font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{claimSuccessMessage} Wallet balances updated with Coins & Gems.</span>
            </div>
          )}

          {claimErrorMessage && (
            <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-300 font-bold flex items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{claimErrorMessage}</span>
              </div>
              <button
                onClick={() => setClaimErrorMessage(null)}
                className="text-rose-400 hover:text-white px-2 py-0.5 rounded text-xs transition"
              >
                ✕
              </button>
            </div>
          )}

          {/* Search & Quick Jump Filter Bar */}
          <div className="bg-black/50 border border-white/10 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by player name or rank (e.g. 1, 50, 150)..."
                className="w-full pl-9 pr-4 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                >
                  ×
                </button>
              )}
            </div>

            {/* Quick Rank Jump Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[10px] uppercase font-bold text-gray-400 mr-1 whitespace-nowrap">Jump:</span>
              <button
                onClick={() => { setRankFilter('all'); setSearchQuery(''); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  rankFilter === 'all' && !searchQuery
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-white/5 text-gray-300 hover:text-white'
                }`}
              >
                All 1-150
              </button>
              <button
                onClick={() => { setRankFilter(3); setSearchQuery(''); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  rankFilter === 3
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-white/5 text-gray-300 hover:text-white'
                }`}
              >
                Top 3 🏆
              </button>
              <button
                onClick={() => { setRankFilter(10); setSearchQuery(''); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  rankFilter === 10
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-white/5 text-gray-300 hover:text-white'
                }`}
              >
                Top 10
              </button>
              <button
                onClick={() => { setRankFilter(50); setSearchQuery(''); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  rankFilter === 50
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-white/5 text-gray-300 hover:text-white'
                }`}
              >
                Top 50
              </button>
              <button
                onClick={() => { setRankFilter(100); setSearchQuery(''); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  rankFilter === 100
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-white/5 text-gray-300 hover:text-white'
                }`}
              >
                Top 100
              </button>
              {userRank && (
                <button
                  onClick={() => { setSearchQuery(userRank.toString()); setRankFilter('all'); }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition whitespace-nowrap flex items-center gap-1"
                >
                  <Award className="w-3 h-3" />
                  <span>My Rank (#{userRank})</span>
                </button>
              )}
            </div>
          </div>

          {/* VIEW 1: LIVE RANKINGS TABLE */}
          {activeTab === 'rankings' && (
            <div className="bg-black/50 border border-white/10 rounded-2xl overflow-x-auto shadow-xl">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-amber-300 font-bold">
                    <th className="p-3">Rank</th>
                    <th className="p-3">Player</th>
                    <th className="p-3 text-amber-300">Coins & Gems Reward</th>
                    <th className="p-3 text-sky-400">Score</th>
                    <th className="p-3">Played</th>
                    <th className="p-3 text-emerald-400">Wins</th>
                    <th className="p-3 text-red-400">Losses</th>
                    <th className="p-3 text-yellow-400">Draws</th>
                    <th className="p-3 text-gray-400">Resigns</th>
                    <th className="p-3 text-purple-300">Total Time</th>
                    <th className="p-3 text-indigo-300">Win Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-gray-200">
                  {filteredLeaders.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-gray-400">
                        No players found matching "{searchQuery}".
                      </td>
                    </tr>
                  ) : (
                    filteredLeaders.map((u) => {
                      const rank = u.global_rank || 1;
                      let rankStyle = 'text-amber-400 font-bold';
                      let crown = '👤';
                      if (rank === 1) {
                        rankStyle = 'text-[#f59e0b] font-black text-sm';
                        crown = '👑';
                      } else if (rank === 2) {
                        rankStyle = 'text-[#94a3b8] font-black text-sm';
                        crown = '🥈';
                      } else if (rank === 3) {
                        rankStyle = 'text-[#d97706] font-black text-sm';
                        crown = '🥉';
                      }

                      const score = u.score || 1200;
                      const played = u.times_played ?? u.totalGames ?? 0;
                      const resigns = u.resigns ?? 0;
                      const timeStr = formatTime(u.total_time_seconds);
                      const isOwner = isSiteOwner(u.username);
                      const payout = u.rewardPayout || getLeaderboardPayout(rank);

                      return (
                        <tr
                          key={rank}
                          className={`cursor-pointer transition animate-fadeIn ${
                            isOwner
                              ? 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-600/15 hover:bg-amber-500/25 border-y border-amber-400/40'
                              : 'hover:bg-white/10'
                          }`}
                          onClick={() => setProfileUsername(u.username)}
                          title={`Click to view ${u.username}'s Profile`}
                        >
                          <td className={`p-3 font-mono ${isOwner ? 'text-amber-300 font-black text-sm' : rankStyle}`}>
                            #{rank}
                          </td>
                          <td className="p-3 font-bold text-white flex items-center gap-2 flex-wrap">
                            <span>{isOwner ? '👑' : crown}</span>
                            <span className={`hover:underline ${isOwner ? 'text-amber-200 font-black' : 'hover:text-amber-300'}`}>
                              {u.username}
                            </span>
                            {isOwner && (
                              <OwnerBadge username={u.username} size="xs" label="OWNER" />
                            )}
                          </td>
                          <td className="p-3 font-mono">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-black text-[11px] shadow-sm">
                              <span>+{payout.toLocaleString()}</span>
                              <span title="Coins">🪙</span>
                              <span title="Gems">💎</span>
                            </span>
                          </td>
                          <td className={`p-3 font-bold font-mono ${isOwner ? 'text-amber-300 font-black' : 'text-sky-400'}`}>
                            {score.toLocaleString()}
                          </td>
                          <td className="p-3 font-mono">{played}</td>
                          <td className="p-3 text-emerald-400 font-bold">{u.wins}</td>
                          <td className="p-3 text-red-400">{u.losses}</td>
                          <td className="p-3 text-yellow-400">{u.draws}</td>
                          <td className="p-3 text-gray-400">{resigns}</td>
                          <td className="p-3 font-mono text-purple-300">{timeStr}</td>
                          <td className={`p-3 font-bold ${isOwner ? 'text-amber-300 font-black' : 'text-indigo-300'}`}>
                            {u.winRate}%
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW 2: DEDICATED TOP 1 TO 150 REWARDS SCHEDULE TABLE */}
          {activeTab === 'rewards' && (
            <div className="bg-black/50 border border-white/10 rounded-2xl overflow-x-auto shadow-xl">
              <div className="p-3 bg-amber-500/10 border-b border-white/10 flex items-center justify-between text-xs text-amber-200">
                <span className="font-bold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  Top 1 to 150 Global Leaderboard Payout Table ({filteredRewards.length} Ranks Listed)
                </span>
                <span className="text-[11px] text-amber-300/80">
                  Every player holding rank 1 through 150 is eligible to claim both Coins & Gems payouts
                </span>
              </div>
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-amber-300 font-bold">
                    <th className="p-3 w-24">Rank</th>
                    <th className="p-3 text-amber-300">Coins & Gems Payout</th>
                    <th className="p-3">Current Qualifier ({GAME_NAMES[selectedGame]})</th>
                    <th className="p-3 text-sky-400">Score Rating</th>
                    <th className="p-3 text-right">Status / Claim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-gray-200 font-mono">
                  {filteredRewards.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400">
                        No ranks found matching "{searchQuery}".
                      </td>
                    </tr>
                  ) : (
                    filteredRewards.map((entry) => {
                      const leader = currentLeaders[entry.rank - 1];
                      const isCurrentUserRank = userRank === entry.rank;
                      const isOwner = isSiteOwner(leader?.username || '');

                      let rankBadgeColor = 'text-amber-400';
                      let medal = `#${entry.rank}`;
                      if (entry.rank === 1) {
                        rankBadgeColor = 'text-amber-300 font-black text-sm';
                        medal = '🥇 #1';
                      } else if (entry.rank === 2) {
                        rankBadgeColor = 'text-slate-300 font-black text-sm';
                        medal = '🥈 #2';
                      } else if (entry.rank === 3) {
                        rankBadgeColor = 'text-amber-600 font-black text-sm';
                        medal = '🥉 #3';
                      }

                      return (
                        <tr
                          key={entry.rank}
                          className={`transition ${
                            isCurrentUserRank
                              ? 'bg-amber-500/20 border-y border-amber-400/50'
                              : entry.rank <= 3
                              ? 'bg-amber-950/20 hover:bg-white/10'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <td className={`p-3 font-bold ${rankBadgeColor}`}>
                            {medal}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-amber-300 text-sm">
                                {entry.formattedPayout}
                              </span>
                              <div className="flex items-center gap-1 text-xs">
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  🪙 COINS
                                </span>
                                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  💎 GEMS
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-sans">
                            {leader ? (
                              <button
                                onClick={() => setProfileUsername(leader.username)}
                                className="flex items-center gap-2 font-bold text-white hover:underline hover:text-amber-300 text-left"
                              >
                                <span>{isOwner ? '👑' : entry.rank <= 3 ? '⭐' : '👤'}</span>
                                <span className={isOwner ? 'text-amber-300 font-black' : ''}>
                                  {leader.username}
                                </span>
                                {isOwner && <OwnerBadge username={leader.username} size="xs" label="OWNER" />}
                              </button>
                            ) : (
                              <span className="text-gray-500 italic">Open Qualifier</span>
                            )}
                          </td>
                          <td className="p-3 text-sky-400 font-mono">
                            {leader?.score ? `${leader.score.toLocaleString()} pts` : '-'}
                          </td>
                          <td className="p-3 text-right">
                            {isCurrentUserRank ? (
                              <button
                                onClick={() => handleClaimReward(entry.rank)}
                                disabled={!!claimedRanks[entry.rank] || claimingRank === entry.rank}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition ${
                                  claimedRanks[entry.rank]
                                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                                    : 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md shadow-amber-500/30'
                                }`}
                              >
                                {claimedRanks[entry.rank] ? 'Claimed' : claimingRank === entry.rank ? 'Claiming...' : 'Claim Payout'}
                              </button>
                            ) : (
                              <span className="text-gray-500 text-[11px]">
                                {leader ? 'Occupied' : 'Available'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* User Profile Modal popup when player clicked */}
        {profileUsername && (
          <UserProfileModal
            username={profileUsername}
            isOpen={!!profileUsername}
            onClose={() => setProfileUsername(null)}
            gameType={selectedGame}
          />
        )}
      </div>
    </div>
  );
};
