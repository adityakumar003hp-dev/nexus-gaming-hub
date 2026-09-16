import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { GameResult, PlayerInfo, ActiveBoardGame } from '../types';
import { Trophy, RefreshCw, Eye, AlertTriangle, Share2, Flame, Coins, Sparkles, Gem } from 'lucide-react';
import { ShareProgressModal } from './ShareProgressModal';
import { isSiteOwner } from '../utils/owner';
import { OwnerBadge } from './OwnerBadge';
import { GAME_DEFEAT_MESSAGES } from '../data/gameDefeatMessages';
import { getUserPoints, getUserGems } from '../utils/pointsManager';
import { awardMatchCompletion, CoinRewardBreakdown, awardSocialShare } from '../utils/coinRewardEngine';
import { calculateMatchRewards } from '../utils/matchSettlement';

interface GameOverModalProps {
  result: GameResult;
  gameType?: ActiveBoardGame;
  whitePlayer?: PlayerInfo;
  blackPlayer?: PlayerInfo;
  userColor?: 'w' | 'b' | string;
  isDefeat?: boolean;
  defeatSubtitle?: string;
  moveCount: number;
  rank?: number;
  onNewGame: () => void;
  onReviewBoard: () => void;
  onOpenCoinHistory?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  result,
  gameType = 'chess',
  whitePlayer = { name: 'Player 1' },
  blackPlayer = { name: 'Player 2' },
  userColor = 'w',
  isDefeat: explicitDefeat,
  defeatSubtitle,
  moveCount,
  rank: explicitRank,
  onNewGame,
  onReviewBoard,
  onOpenCoinHistory,
}) => {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [walletPoints, setWalletPoints] = useState<number>(getUserPoints());
  const [walletGems, setWalletGems] = useState<number>(getUserGems());
  const [rewardBreakdown, setRewardBreakdown] = useState<CoinRewardBreakdown | null>(null);
  const hasAwardedRef = useRef(false);

  const gameMeta = GAME_DEFEAT_MESSAGES[gameType] || GAME_DEFEAT_MESSAGES.chess;

  // Determine if this outcome represents a defeat for the active user
  const isLoss =
    explicitDefeat !== undefined
      ? explicitDefeat
      : result.winner !== 'draw' &&
        result.winner !== null &&
        result.winner !== userColor;

  const isDraw = result.winner === 'draw';
  const isVictory = !isLoss && !isDraw && result.winner !== null;
  const effectiveRank = explicitRank || (isVictory ? 1 : 2);
  const matchSettlement = calculateMatchRewards(effectiveRank, !isLoss && !isDraw);

  useEffect(() => {
    setWalletPoints(getUserPoints());
    setWalletGems(getUserGems());

    const handlePointsUpdate = (e: any) => {
      if (e.detail?.points !== undefined) {
        setWalletPoints(e.detail.points);
      }
    };
    const handleGemsUpdate = (e: any) => {
      if (e.detail?.gems !== undefined) {
        setWalletGems(e.detail.gems);
      }
    };

    window.addEventListener('chess_points_updated', handlePointsUpdate);
    window.addEventListener('chess_gems_updated', handleGemsUpdate);
    return () => {
      window.removeEventListener('chess_points_updated', handlePointsUpdate);
      window.removeEventListener('chess_gems_updated', handleGemsUpdate);
    };
  }, []);

  useEffect(() => {
    if (hasAwardedRef.current) return;
    hasAwardedRef.current = true;

    if (isVictory) {
      awardMatchCompletion({
        gameId: gameType,
        result: 'win',
        opponentName: (userColor === 'w' ? blackPlayer?.name : whitePlayer?.name) || 'Opponent'
      }).then((res) => {
        if (res) setRewardBreakdown(res);
      });
    } else if (isDraw) {
      awardMatchCompletion({
        gameId: gameType,
        result: 'draw',
        opponentName: 'Opponent'
      }).then((res) => {
        if (res) setRewardBreakdown(res);
      });
    } else if (isLoss) {
      awardMatchCompletion({
        gameId: gameType,
        result: 'loss'
      });
    }
  }, [isVictory, isDraw, isLoss, gameType, userColor, whitePlayer, blackPlayer]);

  useEffect(() => {
    if (isVictory) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  }, [isVictory]);

  const winnerPlayer =
    result.winner === 'w' ? whitePlayer : result.winner === 'b' ? blackPlayer : null;

  const getReasonText = () => {
    switch (result.reason) {
      case 'checkmate':
        return 'by Checkmate';
      case 'timeout':
        return 'on Time';
      case 'resignation':
        return 'by Resignation';
      case 'stalemate':
        return 'by Stalemate';
      case 'threefold':
        return 'by Threefold Repetition';
      case 'insufficient':
        return 'by Insufficient Material';
      case 'agreement':
        return 'by Mutual Agreement';
      default:
        if (typeof result.reason === 'string') {
          return `(${result.reason.replace(/_/g, ' ')})`;
        }
        return '';
    }
  };

  const getSubheaderText = () => {
    if (defeatSubtitle) return defeatSubtitle;
    if (isLoss) {
      if (winnerPlayer?.name) {
        const reason = getReasonText();
        return `${winnerPlayer.name} won ${reason}`.trim();
      }
      return gameMeta.defaultDefeatSubtitle;
    }
    if (isDraw) {
      return `Game drawn ${getReasonText()}`.trim();
    }
    return `Victory ${getReasonText()}`.trim();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-fadeIn">
        <div className="bg-[#0b101f]/95 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/95 max-w-md w-full text-center relative overflow-hidden">
          {/* Decorative Top Accent */}
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              isLoss
                ? 'bg-rose-500 shadow-[0_0_20px_#f43f5e]'
                : isDraw
                ? 'bg-slate-400 shadow-[0_0_10px_#94a3b8]'
                : 'bg-indigo-500 shadow-[0_0_15px_#6366f1]'
            }`}
          />

          {/* Icon */}
          <div
            className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border shadow-lg backdrop-blur-md ${
              isLoss
                ? 'bg-[#220c15] border-rose-500/40 shadow-rose-950/60'
                : isDraw
                ? 'bg-white/5 border-white/10'
                : 'bg-indigo-500/10 border-indigo-400/30'
            }`}
          >
            {isLoss ? (
              <AlertTriangle className="w-8 h-8 text-rose-500 animate-pulse" />
            ) : isDraw ? (
              <AlertTriangle className="w-8 h-8 text-indigo-300" />
            ) : (
              <Trophy className="w-8 h-8 text-indigo-400 animate-bounce" />
            )}
          </div>

          {/* Main Heading */}
          <h2
            className={`text-2xl font-bold mb-1 tracking-tight flex items-center justify-center gap-2 flex-wrap ${
              isLoss
                ? 'text-rose-500'
                : isDraw
                ? 'text-white'
                : 'text-white'
            }`}
          >
            {isLoss ? (
              'Defeat / Game Over'
            ) : isDraw ? (
              'Draw Game'
            ) : (
              <>
                <span
                  className={
                    isSiteOwner(winnerPlayer?.name)
                      ? 'text-amber-300 font-extrabold'
                      : 'text-indigo-300'
                  }
                >
                  {winnerPlayer?.name || 'Player'} Wins!
                </span>
                {isSiteOwner(winnerPlayer?.name) && (
                  <OwnerBadge username={winnerPlayer?.name} size="xs" label="OWNER" />
                )}
              </>
            )}
          </h2>

          <p className="text-sm font-medium text-slate-300/80 mb-5">
            {getSubheaderText()}
          </p>

          {/* Match Reward / Position Settlement Box */}
          {matchSettlement && (
            <div
              className={`mb-5 border rounded-2xl p-4 text-left shadow-xl shadow-black/40 backdrop-blur-md relative overflow-hidden ${
                matchSettlement.coinsDelta > 0
                  ? 'bg-gradient-to-b from-emerald-950/80 to-emerald-950/40 border-emerald-500/40'
                  : 'bg-gradient-to-b from-red-950/80 to-red-950/40 border-red-500/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div
                  className={`flex items-center gap-1.5 text-xs font-black tracking-wider uppercase ${
                    matchSettlement.coinsDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {matchSettlement.coinsDelta > 0 ? (
                    <Sparkles className="w-4 h-4 text-emerald-400 fill-emerald-400/30" />
                  ) : (
                    <Flame className="w-4 h-4 text-rose-500 fill-rose-500/30" />
                  )}
                  <span>
                    {isLoss
                      ? 'MATCH DEFEAT PENALTY'
                      : effectiveRank === 1
                      ? '1ST PLACE CHAMPION REWARD'
                      : `RANK ${effectiveRank} SETTLEMENT`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold shadow-inner ${
                      matchSettlement.coinsDelta > 0
                        ? 'bg-emerald-950/90 border border-emerald-500/40 text-emerald-300'
                        : 'bg-red-950/90 border border-red-500/40 text-rose-300'
                    }`}
                  >
                    {matchSettlement.coinsDelta > 0 ? `+${matchSettlement.coinsDelta.toLocaleString()}` : matchSettlement.coinsDelta.toLocaleString()} 🪙
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold shadow-inner ${
                      matchSettlement.gemsDelta > 0
                        ? 'bg-emerald-950/90 border border-emerald-500/40 text-cyan-300'
                        : 'bg-red-950/90 border border-red-500/40 text-rose-300'
                    }`}
                  >
                    {matchSettlement.gemsDelta > 0 ? `+${matchSettlement.gemsDelta.toLocaleString()}` : matchSettlement.gemsDelta.toLocaleString()} 💎
                  </span>
                </div>
              </div>

              {/* Status explanation */}
              <p
                className={`text-xs leading-relaxed mb-3 font-medium ${
                  matchSettlement.coinsDelta > 0 ? 'text-emerald-100/90' : 'text-rose-100/90'
                }`}
              >
                {matchSettlement.statusText}
              </p>

              {/* Wallet Balances */}
              <div
                className={`flex items-center justify-between pt-2 border-t text-[11px] ${
                  matchSettlement.coinsDelta > 0 ? 'border-emerald-500/20' : 'border-red-500/20'
                }`}
              >
                <span className={matchSettlement.coinsDelta > 0 ? 'text-emerald-300/80 font-medium' : 'text-rose-300/80 font-medium'}>
                  {gameMeta.seriesLabel || 'Competitive League'}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-bold font-mono text-amber-400">
                    🪙 {walletPoints.toLocaleString()}
                  </span>
                  <span className="font-bold font-mono text-cyan-300">
                    💎 {walletGems.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Game Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/10 text-left backdrop-blur-md">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300/60 block">
                Total Moves
              </span>
              <span className="text-sm font-bold text-white">{moveCount}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300/60 block">
                Game Status
              </span>
              <span
                className={`text-sm font-bold ${
                  isLoss
                    ? 'text-rose-400'
                    : isDraw
                    ? 'text-slate-300'
                    : 'text-emerald-300'
                }`}
              >
                {isLoss ? 'Penalty Applied' : 'Match Completed'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => {
                awardSocialShare(gameType);
                setIsShareOpen(true);
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#e83d84] via-[#b838c8] to-[#6366f1] hover:opacity-90 text-white font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 border border-indigo-400/50 active:scale-[0.99] cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Game Result &amp; Progress</span>
            </button>

            <button
              onClick={onNewGame}
              className="w-full py-3 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-indigo-400/50 active:scale-[0.99] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Rematch &amp; Play Again (2000 🪙 / 2000 💎)</span>
            </button>

            <button
              onClick={onReviewBoard}
              className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 transition flex items-center justify-center gap-2 backdrop-blur-md active:scale-[0.99] cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Review Game Board</span>
            </button>
          </div>
        </div>
      </div>

      <ShareProgressModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        moveCount={moveCount}
        gameResult={result}
      />
    </>
  );
};
