import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Crown,
  TrendingUp,
  Building2,
  Home,
  Briefcase,
  DollarSign,
  Gift,
  Trophy,
  Menu,
  Send,
  Sparkles,
  Users,
  RotateCcw,
  Volume2,
  VolumeX,
  Plus,
  HelpCircle,
  ShoppingBag,
  History,
  Settings as SettingsIcon,
  User,
  Zap,
  ArrowRight,
  Gavel,
  Repeat,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { GameMode } from '../types';
import { BUSINESS_COLORS, BusinessColorKey, BusinessColorConfig } from '../data/businessConfig';
import {
  INTERNATIONAL_SPACES,
  InternationalBoardSpace,
  INTERNATIONAL_CHANCE_CARDS,
  INTERNATIONAL_COMMONWEALTH_CARDS,
  ChanceCard,
} from '../data/internationalBusinessData';
import { BOARD_CARDS_DATA } from '../data/boardCards';
import ChanceAndIMFModal from './ChanceAndIMFModal';
import PropertyAndWaysCards, { CITY_PROPERTY_CARDS, TRANSIT_WAYS_CARDS } from './PropertyAndWaysCards';
import DynamicPropertyCard, { PROPERTY_SECTOR_MAP } from './DynamicPropertyCard';
import { handlePlayerLanding } from '../utils/boardMovement';
import { handleTurnCompletion, handleDiceTurnCompletion, checkExtraTurnRule } from '../utils/turnManager';
import { checkDoublesRule, handleTwoDiceTurnCompletion } from '../utils/twoDiceTurnManager';
import { processEconomicAction } from '../utils/gameLogicController';
import { BusinessOptionsPanel, BusinessSlotConfig } from './BusinessOptionsPanel';
import PlayerLobbySelector from './PlayerLobbySelector';
import { COLOR_POOL, updateGamePlayerCount } from '../utils/playerSetupEngine';
import { recordTwentyGameResult } from '../utils/statsEngine';
import { BusinessPawn } from './BusinessPawn';
import { VisualDiceRoller } from './VisualDiceRoller';
import { InternationalBusinessCenter } from './InternationalBusinessCenter';
import { GlobalMarketStockGraph } from './GlobalMarketStockGraph';
import PlayerAndMarketDashboard from './PlayerAndMarketDashboard';
import {
  INITIAL_STOCKS,
  StockListing,
  StockHolding,
  PlayerCashDenominations,
  PlayerDocuments,
  updateMarketPrices,
  buyStock,
  sellStock,
  cashOutStockProfit,
} from '../utils/gameEconomicsSetup';
import { calculateStockInvestmentReturn } from '../utils/stockRangeManager';
import { checkAndTriggerMarketCrash } from '../utils/stockCrashManager';
import { initializeStockPurchase, calculateStockReturnOutcome, getRandomFinancialOutcome } from '../utils/stockPurchaseManager';
import { handleBlackMoneyCheck, regainDocument, handleVisaTileLanding, runAutomaticEconomicMonitoring, bankShopItems, handleShopPurchase, handlePlayerMovementAttempt, BankShopItem, BLACK_MONEY_CONFIG, calculateDynamicFine, executeDynamicBlackMoneySeizure, executeDualThresholdSeizure, calculateTotalNetWorth, checkTotalInsolvency, processLowIncomeStreak, LOW_INCOME_THRESHOLD, MAX_ALLOWED_LOW_INCOME_STREAKS, CONFIG, GET_LOW_INCOME_WARNING, executeAITurnLogic, evaluateEntityBankruptcy, AI_PERSONALITIES, executeHumanizedAITurn, executeAITurnWithDelay, AIPersonalityType, eliminatePlayerFromGame } from '../utils/blackMoneyManager';
import { handleTilePaymentOrBankruptcy, handlePlaceLandingFee, buyOrRenewDocumentAtShop, checkLowIncomeWarnings, AUDIT_CONFIG, launchCorporateAudit, resolveAuditOutcome, processAIAuditDecisions, triggerRandomSystemAudit, triggerRecurringRaid, checkPlayerBankruptcy, handleAcceptBribe, handleForfeitMatch, processAuditTimerTick, AuditState } from '../utils/liquidationManager';
import AuditDefenseModal from './AuditDefenseModal';
import BribeBailoutModal from './BribeBailoutModal';
import FederalAuditRaidOverlay from './FederalAuditRaidOverlay';
import GameRaidHeader from './GameRaidHeader';
import StockMarketManager from './StockMarketManager';
import MasterCrashControl from './MasterCrashControl';
import MarketHeatmap from './MarketHeatmap';
import {
  MARKET_FLUX_EVENTS,
  applyGlobalMarketPhase,
  AudioFX,
  MarketFluxEvent,
} from '../utils/businessEmpireEngine';
import CodebreakerMiniGame from './CodebreakerMiniGame';
import EspionageAndBankingModal from './EspionageAndBankingModal';
import { UserSession } from '../types';

export interface BusinessBoardProps {
  gameMode?: GameMode;
  onGameEnd?: (winner: 'w' | 'b' | 'draw', reason: string) => void;
  currentUser?: UserSession | null;
}

export interface BusinessPlayer {
  id: number;
  colorKey: BusinessColorKey;
  name: string;
  avatar: string;
  color: string;
  borderClass: string;
  badgeBg: string;
  token: string;
  cash: number;
  totalCash?: number;
  netWorth: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  isAi: boolean;
  isOwner?: boolean;
  propertiesOwned: number[];
  investments: { [key: string]: number };
  cashDenominations: PlayerCashDenominations;
  documents: PlayerDocuments;
  stocks: Record<string, StockHolding>;
  lowIncomeWarnings?: number;
  lowIncomeStreak?: number;
  personality?: AIPersonalityType;
  riskIndex?: number;
  auditState?: AuditState;
  isBankrupt?: boolean;
  hasUsedBribeBailout?: boolean;
  outstandingDebt?: number;
  offshoreVault?: number;
  isEliminated?: boolean;
  reason?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  color: string;
  text: string;
  time: string;
}

export interface MarketTrend {
  sector: string;
  change: string;
  changeValue: number;
  isUp: boolean;
}

export const BusinessBoard: React.FC<BusinessBoardProps> = ({
  gameMode = 'ai',
  onGameEnd,
  currentUser,
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [turnIndex, setTurnIndex] = useState<number>(0);
  
  // Dice Roll State (1-6 single die, or toggleable double dice)
  const [diceValue, setDiceValue] = useState<number>(4);
  const [secondDiceValue, setSecondDiceValue] = useState<number>(3);
  const [diceMode, setDiceMode] = useState<'single' | 'double'>('single');
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isMovingPawn, setIsMovingPawn] = useState<boolean>(false);
  const [allowedSteps, setAllowedSteps] = useState<number>(4);
  const [targetSpaceId, setTargetSpaceId] = useState<number | null>(null);
  const [hasExtraTurn, setHasExtraTurn] = useState<boolean>(false);

  // Full Board Focus Mode
  const [isBoardExpanded, setIsBoardExpanded] = useState<boolean>(false);

  // 36-space International Board State
  const [spaces, setSpaces] = useState<InternationalBoardSpace[]>(INTERNATIONAL_SPACES);

  // 6-Player Color & Slot Configuration
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [userColor, setUserColor] = useState<BusinessColorKey>('red');
  const [slotConfigs, setSlotConfigs] = useState<BusinessSlotConfig[]>([
    { colorKey: 'red', isAi: false, isUser: true },
    { colorKey: 'green', isAi: true, isUser: false },
    { colorKey: 'yellow', isAi: true, isUser: false },
    { colorKey: 'blue', isAi: true, isUser: false },
    { colorKey: 'orange', isAi: true, isUser: false },
    { colorKey: 'purple', isAi: true, isUser: false },
  ]);

  // Dynamic Player Creation (Fixed Sequence: 0: Red, 1: Green, 2: Yellow, 3: Blue)
  const createPlayers = useCallback(
    (count: number, uColor: BusinessColorKey, slots: BusinessSlotConfig[]): BusinessPlayer[] => {
      const activeConfigs = BUSINESS_COLORS.slice(0, count);

      return activeConfigs.map((cfg, idx) => {
        const isUser = cfg.key === uColor;
        const matchedSlot = slots.find((s) => s.colorKey === cfg.key);
        const isAi = isUser ? false : matchedSlot ? matchedSlot.isAi : true;

        return {
          id: idx,
          colorKey: cfg.key,
          name: isUser ? `${cfg.label} (You)` : `${cfg.label} Tycoon`,
          avatar: cfg.avatar,
          color: cfg.colorHex,
          borderClass: cfg.borderClass,
          badgeBg: cfg.badgeBg,
          token: cfg.token,
          cash: 16650,
          netWorth: 16650,
          position: 0,
          inJail: false,
          jailTurns: 0,
          isAi,
          isOwner: isUser,
          propertiesOwned: [],
          investments: { tech: 2000, realEstate: 2000 },
          cashDenominations: {
            "10000": 1,
            "5000": 1,
            "1000": 1,
            "500": 1,
            "100": 1,
            "50": 1,
          },
          documents: {
            VISA: 1,
            PASSPORT: 1,
          },
          stocks: {},
        };
      });
    },
    []
  );

  const [players, setPlayers] = useState<BusinessPlayer[]>(() =>
    createPlayers(4, 'red', [
      { colorKey: 'red', isAi: false, isUser: true },
      { colorKey: 'green', isAi: true, isUser: false },
      { colorKey: 'yellow', isAi: true, isUser: false },
      { colorKey: 'blue', isAi: true, isUser: false },
      { colorKey: 'orange', isAi: true, isUser: false },
      { colorKey: 'purple', isAi: true, isUser: false },
    ])
  );

  // Reset Game / Apply Settings
  const resetGame = useCallback(
    (count = playerCount, uColor = userColor, slots = slotConfigs) => {
      const newPlayers = createPlayers(count, uColor, slots);
      setPlayers(newPlayers);
      setEliminatedPlayers([]);
      setWinner(null);
      setIsGameOver(false);
      setActiveModal('none');
      setTurnIndex(0);
      setHasExtraTurn(false);
      setSpaces(INTERNATIONAL_SPACES.map((s) => ({ ...s, ownerId: undefined, houses: 0 })));
      setIsRolling(false);
      setIsMovingPawn(false);
      setTargetSpaceId(null);
      setBannerToast({
        title: `👑 International Business Empire Started!`,
        desc: `Playing with ${count} Tycoons on the authentic 36-space world board. ${newPlayers[0].name} rolls first!`,
      });
    },
    [createPlayers, playerCount, userColor, slotConfigs]
  );

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    const newSlots = slotConfigs.map((s) => ({
      ...s,
      isUser: s.colorKey === userColor,
    }));
    setSlotConfigs(newSlots);
    resetGame(count, userColor, newSlots);
  };

  const handleUserColorChange = (newColor: BusinessColorKey) => {
    setUserColor(newColor);
    const newSlots = slotConfigs.map((s) => ({
      ...s,
      isUser: s.colorKey === newColor,
      isAi: s.colorKey === newColor ? false : s.isAi,
    }));
    setSlotConfigs(newSlots);
    resetGame(playerCount, newColor, newSlots);
  };

  const handleToggleSlotAi = (colorKey: BusinessColorKey) => {
    const updatedSlots = slotConfigs.map((s) =>
      s.colorKey === colorKey && !s.isUser ? { ...s, isAi: !s.isAi } : s
    );
    setSlotConfigs(updatedSlots);
    resetGame(playerCount, userColor, updatedSlots);
  };

  // Market Trends & Live Sector Multipliers
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([
    { sector: 'International Tech', change: '+14.2%', changeValue: 14.2, isUp: true },
    { sector: 'Global Real Estate', change: '+9.5%', changeValue: 9.5, isUp: true },
    { sector: 'Aviation & Logistics', change: '+6.8%', changeValue: 6.8, isUp: true },
    { sector: 'Telecom & Satellites', change: '+4.5%', changeValue: 4.5, isUp: true },
    { sector: 'Energy & Utilities', change: '+3.1%', changeValue: 3.1, isUp: true },
    { sector: 'Global Financial', change: '+8.2%', changeValue: 8.2, isUp: true },
    { sector: 'Tourism & Commercial', change: '+5.4%', changeValue: 5.4, isUp: true },
  ]);

  // Derived live market rates dictionary for dynamic property card calculation
  const marketRates: Record<string, number> = useMemo(() => {
    const rates: Record<string, number> = {
      'International Tech': 1.142,
      'Global Real Estate': 1.095,
      'Aviation & Logistics': 1.068,
      'Telecom & Satellites': 1.045,
      'Energy & Utilities': 1.031,
      'Global Financial': 1.082,
      'Tourism & Commercial': 1.054,
    };
    marketTrends.forEach((t) => {
      rates[t.sector] = Math.max(0.6, 1 + (t.changeValue || 0) / 100);
    });
    return rates;
  }, [marketTrends]);

  // Game Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'Green Tycoon', color: '#22c55e', text: 'Rolling for Paris & New York today! 🗼', time: '1m ago' },
    { id: '2', sender: 'Yellow Tycoon', color: '#eab308', text: 'Targeting Mumbai & Satellite orbital grid 🛰️', time: '45s ago' },
    { id: '3', sender: 'Blue Tycoon', color: '#3b82f6', text: 'Trade deals open for any airline or telecom asset 💎', time: '20s ago' },
    { id: '4', sender: 'Red (You)', color: '#ef4444', text: "Let's roll the dice and conquer the world! 👑", time: 'Just now' },
  ]);
  const [chatInput, setChatInput] = useState<string>('');

  // Modals & Action Controls
  const [activeModal, setActiveModal] = useState<
    | 'none'
    | 'invest'
    | 'trade'
    | 'auction'
    | 'build'
    | 'buy_property'
    | 'chance'
    | 'commonwealth'
    | 'chance_imf'
    | 'profile'
    | 'leaderboard'
    | 'liquidation'
    | 'shop'
    | 'espionage_banking'
    | 'codebreaker'
    | 'game_over'
  >('none');
  const [currentMarketPhase, setCurrentMarketPhase] = useState<MarketFluxEvent>(
    MARKET_FLUX_EVENTS.BULL_RUN
  );
  const [codebreakerTargetName, setCodebreakerTargetName] = useState<string>(
    'IRS Federal Audit Records'
  );
  const [winner, setWinner] = useState<BusinessPlayer | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [eliminatedPlayers, setEliminatedPlayers] = useState<BusinessPlayer[]>([]);
  const [bankruptcyWarning, setBankruptcyWarning] = useState<{ player: BusinessPlayer; message: string; debt: number } | null>(null);
  const [chanceModalSpaceType, setChanceModalSpaceType] = useState<'CHANCE' | 'IMF'>('CHANCE');
  const [pendingSpace, setPendingSpace] = useState<InternationalBoardSpace | null>(null);
  const [activeCard, setActiveCard] = useState<ChanceCard | null>(null);
  const [bannerToast, setBannerToast] = useState<{ title: string; desc: string } | null>({
    title: 'International Business Ready!',
    desc: 'Roll the 3D dice (1-6), watch allowed movement range highlight on the board, and conquer prime global properties!',
  });

  // Daily Mission
  const [missionProgress, setMissionProgress] = useState<number>(2);
  const [missionClaimed, setMissionClaimed] = useState<boolean>(false);

  // Live Stock Exchange Market State
  const [stocks, setStocks] = useState<StockListing[]>(INITIAL_STOCKS);
  const [isMarketCrashed, setIsMarketCrashed] = useState<boolean>(false);
  const [turnsSinceLastCrash, setTurnsSinceLastCrash] = useState<number>(3);
  const [marketState, setMarketState] = useState<{
    status: string;
    isCrashed: boolean;
    dropPercentage: number;
  }>({
    status: 'NORMAL',
    isCrashed: false,
    dropPercentage: 0,
  });
  const [chartTheme, setChartTheme] = useState<'default' | 'red-bearish'>('default');
  const [investViewTab, setInvestViewTab] = useState<'dashboard' | 'chart' | 'heatmap'>('dashboard');

  // Live Stock Market Real-Time Ticker (dynamically changes every second)
  useEffect(() => {
    const stockInterval = setInterval(() => {
      setStocks((prev) => updateMarketPrices(prev));
    }, 1000);
    return () => clearInterval(stockInterval);
  }, []);

  const currentPlayer = players[turnIndex] || players[0];

  // Universal handler for skipping any property or transit tile with Bank Mortgage Payout
  const handleSkipProperty = (bankMortgageValue?: number) => {
    const mortgagePayout =
      bankMortgageValue ||
      (pendingSpace
        ? CITY_PROPERTY_CARDS[pendingSpace.name]?.mortgage ||
          TRANSIT_WAYS_CARDS[pendingSpace.name]?.mortgage ||
          Math.round((pendingSpace.price || 2000) * 0.5)
        : 1000);

    if (soundEnabled) soundFx.playCheck();

    setPlayers((prevPlayers) =>
      prevPlayers.map((player, index) => {
        if (index === turnIndex) {
          return {
            ...player,
            cash: player.cash + mortgagePayout,
            netWorth: player.netWorth + mortgagePayout,
          };
        }
        return player;
      })
    );

    setBannerToast({
      title: `🏦 Bank Subsidy (+ $${mortgagePayout.toLocaleString()})`,
      desc: `${currentPlayer.name} skipped acquiring ${pendingSpace?.name || 'property'} and received $${mortgagePayout.toLocaleString()} Mortgage Payout from Bank.`,
    });

    setActiveModal('none');
    setPendingSpace(null);
    nextTurn();
  };

  // Central Debt & Bankruptcy Resolution Handler
  const handlePlayerDebtOrPayment = (
    debtorId: number,
    recipientId: number | 'bank',
    amount: number,
    reason: string
  ): boolean => {
    const debtor = players.find((p) => p.id === debtorId);
    if (!debtor) return false;

    // Use handleTilePaymentOrBankruptcy for step-by-step automated asset liquidation and bankruptcy determination
    const liquidationResult = handleTilePaymentOrBankruptcy(
      debtor,
      amount,
      setPlayers,
      (eliminatedId, elimReason) => {
        // Bankruptcy elimination callback
        if (soundEnabled) soundFx.playGameOver(false);

        // Release all debtor's properties back to the bank
        setSpaces((prev) =>
          prev.map((s) => (s.ownerId === debtor.id ? { ...s, ownerId: undefined, isOwned: false, hasHouse: false, houses: 0 } : s))
        );

        // Transfer whatever remaining cash they have to creditor if applicable
        const currentDebtorCash = debtor.cash ?? (debtor as any).totalCash ?? 0;
        if (recipientId !== 'bank' && currentDebtorCash > 0) {
          setPlayers((prev) =>
            prev.map((p) => (p.id === recipientId ? { ...p, cash: p.cash + currentDebtorCash, netWorth: p.netWorth + currentDebtorCash } : p))
          );
        }

        // Eliminate player from active roster using eliminatePlayerFromGame
        eliminatePlayerFromGame(
          debtor.id,
          elimReason || `${debtor.name} went bankrupt and was kicked out!`,
          setPlayers,
          setEliminatedPlayers,
          setTurnIndex,
          turnIndex
        );

        addChatMessage(
          'System',
          '#ef4444',
          `🚨 ${elimReason || `${debtor.name} went bankrupt and was kicked out!`}`
        );

        setBannerToast({
          title: `💥 Elimination: ${debtor.name} Bankrupt!`,
          desc: `Unable to cover $${amount.toLocaleString()} ${reason} even after full liquidation. Kicked out!`,
        });

        // If the human user (id === 0) was eliminated, trigger match defeat callback
        if (debtor.id === 0 && onGameEnd) {
          onGameEnd('b', `${debtor.name} was eliminated due to corporate bankruptcy`);
        }

        // Check if only 1 player remains -> Victory!
        setPlayers((currentActive) => {
          if (currentActive.length === 1) {
            const champ = currentActive[0];
            setWinner(champ);
            setIsGameOver(true);
            setActiveModal('game_over');
            if (onGameEnd) {
              onGameEnd(champ.id === 0 ? 'w' : 'b', `${champ.name} won the game as the last tycoon standing!`);
            }
          }
          return currentActive;
        });
      },
      (stockId, shares) => {
        addChatMessage(debtor.name, debtor.color, `📉 Liquidated ${shares} shares of ${stockId} to cover debt.`);
      },
      (propId) => {
        const propSpace = spaces.find((s) => s.id === propId);
        addChatMessage(debtor.name, debtor.color, `🏦 Mortgaged ${propSpace?.name || `Property #${propId}`} to bank to cover debt.`);
      },
      (docType) => {
        addChatMessage(debtor.name, debtor.color, `🛂 Surrendered ${docType.toUpperCase()} document to bank for liquidity.`);
      },
      spaces,
      stocks,
      setSpaces
    );

    if (liquidationResult.bankrupt || liquidationResult.eliminated) {
      return true; // Debtor was eliminated
    }

    // If creditor is another player, credit them with the payment amount
    if (recipientId !== 'bank') {
      setPlayers((prev) =>
        prev.map((p) => (p.id === recipientId ? { ...p, cash: p.cash + amount, netWorth: p.netWorth + amount } : p))
      );
    }

    if (liquidationResult.liquidatedDetails) {
      const details = liquidationResult.liquidatedDetails;
      const hasLiquidated =
        details.stocksSoldValue > 0 ||
        details.propertiesSoldValue > 0 ||
        details.visaValue > 0 ||
        details.passportValue > 0;

      if (hasLiquidated) {
        setBannerToast({
          title: `🔄 Assets Auto-Liquidated: $${amount.toLocaleString()}`,
          desc: `${debtor.name} liquidated assets to settle ${reason}. Remaining cash: $${(liquidationResult.remainingCash || 0).toLocaleString()}`,
        });
      }
    }

    const currentDebtorCash = liquidationResult.remainingCash ?? (debtor.cash - amount);

    // Warning state if human cash drops below $2,500 threshold but has assets to liquidate
    if (debtor.id === 0 && currentDebtorCash < 2500) {
      setBannerToast({
        title: `⚠️ Liquidity Warning: Below $2,500!`,
        desc: `Cash is low ($${currentDebtorCash.toLocaleString()}). Open Emergency Liquidation to sell Visas, Passports, Stocks, or Mortgage properties!`,
      });
      setBankruptcyWarning({
        player: debtor,
        message: `Low cash balance ($${currentDebtorCash.toLocaleString()}). Liquidate assets to stay above $2,500.`,
        debt: amount,
      });
    }

    return false; // not eliminated
  };

  // Calculate target space for current player based on current dice / allowed range
  const prospectiveTargetIndex = (currentPlayer.position + allowedSteps) % spaces.length;
  const prospectiveTargetSpace = spaces[prospectiveTargetIndex];

  // Send Player to Jail Helper: Deducts $500, sets position 9, inJail true, jailTurns 1
  const sendPlayerToJail = (playerId: number) => {
    const targetPlayer = players.find((p) => p.id === playerId);
    if (!targetPlayer) return;

    if (soundEnabled) soundFx.playCapture();
    const isEliminated = handlePlayerDebtOrPayment(playerId, 'bank', 500, 'Jail Bail & Fine');
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId
          ? { ...p, position: 9, inJail: true, jailTurns: 1 }
          : p
      )
    );

    if (!isEliminated) {
      setBannerToast({
        title: `⚖️ Sent to Jail! $500 Deducted`,
        desc: `${targetPlayer.name} paid $500 fine and will skip their next turn.`,
      });
      addChatMessage('System', '#ef4444', `⛓️ ${targetPlayer.name} was sent to Jail ($500 fine deducted, 1 turn skipped).`);
    }
  };

  // Skip Jail Turn Handler
  const handleSkipJailTurn = useCallback(() => {
    if (!currentPlayer || !currentPlayer.inJail) return;

    // Release player from jail
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === currentPlayer.id
          ? { ...p, inJail: false, jailTurns: 0 }
          : p
      )
    );

    setBannerToast({
      title: `⚖️ Jail Sentence Served`,
      desc: `${currentPlayer.name} served their 1-turn jail penalty ($500 paid). Turn skipped and now free for next round!`,
    });
    addChatMessage('System', '#94a3b8', `⚖️ ${currentPlayer.name} served jail sentence (turn skipped). Free on next turn.`);

    if (soundEnabled) soundFx.playCheck();

    // Advance turn to next player
    setTurnIndex((prev) => (prev + 1) % players.length);
  }, [currentPlayer, players.length, soundEnabled]);

  // Real-time automatic economic & black money monitoring whenever players Net Worth > $70k OR Cash > $40k
  useEffect(() => {
    const hasBlackMoney = players.some(
      (p) => {
        const cash = p.totalCash ?? p.cash ?? 0;
        const nw = calculateTotalNetWorth(p);
        const breached = nw > BLACK_MONEY_CONFIG.NET_WORTH_THRESHOLD || cash > BLACK_MONEY_CONFIG.LIQUID_CASH_THRESHOLD;
        return breached && (!p.documents?.blackMoneyFlagged || !p.documents?.visaCaptured || !p.documents?.passportCaptured);
      }
    );

    if (hasBlackMoney) {
      runAutomaticEconomicMonitoring(
        players,
        setPlayers,
        (eliminatedId, reason) => {
          handlePlayerDebtOrPayment(eliminatedId, 'bank', 2500, reason || 'Insolvency');
        },
        10000,
        5000,
        (title, desc, type) => {
          if (soundEnabled) soundFx.playCapture();
          setBannerToast({ title, desc });
          addChatMessage('System', type === 'danger' ? '#ef4444' : '#f59e0b', `🚨 ${desc}`);
        },
        BLACK_MONEY_CONFIG,
        setSpaces
      );
    }
  }, [players, soundEnabled]);

  // Stable reference to current players list for timer callbacks
  const playersRef = useRef(players);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const handleExecutePeriodicRaid = useCallback(() => {
    triggerRecurringRaid(
      playersRef.current,
      setPlayers,
      (msg) => addChatMessage('System', '#ef4444', msg),
      {
        playSirenSound: () => {
          if (soundEnabled) {
            soundFx.playCheck();
          }
        },
      }
    );
  }, [soundEnabled]);

  // Live Audit Countdown Tick Engine (Counts down active 30s investigations every second)
  useEffect(() => {
    const auditInterval = setInterval(() => {
      processAuditTimerTick(
        setPlayers,
        (bankruptId, reason) => {
          eliminatePlayerFromGame(
            bankruptId,
            reason,
            setPlayers,
            setEliminatedPlayers,
            setTurnIndex,
            turnIndex,
            (msg) => addChatMessage('System', '#ef4444', msg)
          );
        },
        (msg) => addChatMessage('System', '#10b981', msg)
      );
    }, 1000);

    return () => clearInterval(auditInterval);
  }, [turnIndex]);

  // Turn Automator (AI rolls & In-Jail automatic turn skip processing)
  useEffect(() => {
    if (!currentPlayer || isRolling || isMovingPawn || activeModal !== 'none') return;

    // Check for player bankruptcy
    const currentCash = currentPlayer.totalCash !== undefined ? currentPlayer.totalCash : currentPlayer.cash;
    if (currentCash <= 0 && !currentPlayer.isBankrupt && !currentPlayer.hasUsedBribeBailout) {
      setPlayers((prev) =>
        prev.map((p) => (p.id === currentPlayer.id ? { ...p, isBankrupt: true } : p))
      );
      return;
    }

    // Guard Check: If active entity is already bankrupt and already used bribe bailout, eliminate them
    if (currentPlayer.isBankrupt && currentPlayer.hasUsedBribeBailout) {
      eliminatePlayerFromGame(
        currentPlayer.id,
        undefined,
        setPlayers,
        setEliminatedPlayers,
        setTurnIndex,
        turnIndex,
        (msg) => addChatMessage('System', '#ef4444', msg)
      );
      return;
    }

    // If human player is currently in bankruptcy state waiting for bribe decision, halt automated actions
    if (currentPlayer.isBankrupt && !currentPlayer.isAi) {
      return;
    }

    // AI Bot Bribe Decision when bankrupt
    if (currentPlayer.isBankrupt && currentPlayer.isAi && !currentPlayer.hasUsedBribeBailout) {
      const shouldAiBribe = (currentPlayer.propertiesOwned || []).length > 0 || Math.random() > 0.4;
      if (shouldAiBribe) {
        handleAcceptBribe(
          currentPlayer.id,
          5000,
          setPlayers,
          (msg) => addChatMessage('System', '#eab308', msg),
          { playCashSound: () => soundEnabled && soundFx.playCash() }
        );
      } else {
        handleForfeitMatch(
          currentPlayer.id,
          setPlayers,
          setEliminatedPlayers,
          setTurnIndex,
          (msg) => addChatMessage('System', '#ef4444', msg),
          eliminatePlayerFromGame
        );
      }
      return;
    }

    if (currentPlayer.inJail) {
      const timer = setTimeout(() => {
        handleSkipJailTurn();
      }, 1600);
      return () => clearTimeout(timer);
    }

    if (currentPlayer.isAi) {
      processAIAuditDecisions(
        currentPlayer,
        players,
        setPlayers,
        undefined,
        eliminatePlayerFromGame,
        (msg) => addChatMessage('System', '#ef4444', msg),
        setEliminatedPlayers,
        setTurnIndex
      );

      const timer = executeAITurnWithDelay(currentPlayer, setPlayers, spaces, () => {
        handleRollDice();
      });
      return () => clearTimeout(timer);
    }
  }, [turnIndex, isRolling, isMovingPawn, activeModal, currentPlayer, handleSkipJailTurn]);

  // Handle Dice Roll
  const handleRollDice = () => {
    if (isRolling || isMovingPawn) return;

    // Enforce Travel Restriction Check based on Visa status
    const movementCheck = handlePlayerMovementAttempt(
      currentPlayer,
      prospectiveTargetSpace,
      (msg) => {
        setBannerToast({
          title: '❌ Travel Restricted',
          desc: msg,
        });
      }
    );

    if (!movementCheck.canTravel) {
      if (soundEnabled) soundFx.playMove();

      if (currentPlayer.isAi) {
        // AI player: attempt to buy a Visa if funds allow ($10,000 USD)
        const visaItem = bankShopItems.find((i) => i.type === 'visa');
        const aiCash = currentPlayer.totalCash ?? currentPlayer.cash ?? 0;
        if (visaItem && aiCash >= visaItem.cost) {
          handleShopPurchase(currentPlayer, visaItem, setPlayers);
          addChatMessage(currentPlayer.name, currentPlayer.color, `🛂 AI purchased a renewed Visa from the Bank Shop ($10,000 USD) to restore travel!`);
          setBannerToast({
            title: `🛂 Visa Restored`,
            desc: `${currentPlayer.name} bought a new Visa at the shop ($10,000 USD) and resumed movement.`,
          });
        } else {
          addChatMessage(currentPlayer.name, currentPlayer.color, `🚫 AI has no valid Visa and cannot afford one ($10,000 USD). Travel restricted. Turn skipped.`);
          nextTurn();
          return;
        }
      } else {
        // Human player: show restriction and open Bank Shop
        addChatMessage('System', '#ef4444', `❌ Travel Restricted: You do not have a valid Visa! Buy or renew one at the shop ($10,000 USD) to travel.`);
        setActiveModal('shop');
        return;
      }
    }

    // AI proactive Bank Shop & Portfolio Management
    if (currentPlayer.isAi) {
      const aiCash = currentPlayer.totalCash ?? currentPlayer.cash ?? 0;

      // 1. Passport Renewal if captured and AI has sufficient reserves
      if (currentPlayer.documents?.passportCaptured && aiCash >= 15000) {
        const passportItem = bankShopItems.find((i) => i.type === 'passport');
        if (passportItem) {
          handleShopPurchase(currentPlayer, passportItem, setPlayers);
          addChatMessage(currentPlayer.name, currentPlayer.color, `🛂 AI renewed International Passport from Bank Shop ($5,000 USD)!`);
        }
      }

      // 2. High-Yield Currency Exchange if liquid cash is high (> $50,000)
      if (aiCash >= 50000 && Math.random() > 0.6) {
        const noteItem = bankShopItems.find((i) => i.type === 'currency' && (i.cost === 10000 || i.cost === 5000));
        if (noteItem && aiCash >= noteItem.cost) {
          handleShopPurchase(currentPlayer, noteItem, setPlayers);
          addChatMessage(currentPlayer.name, currentPlayer.color, `🏦 AI exchanged for High-Yield ${noteItem.label} at Bank Shop! (+Yield)`);
        }
      }
    }

    if (soundEnabled) soundFx.playMove();
    setIsRolling(true);

    let rolls = 0;
    const rollInterval = setInterval(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      setDiceValue(d1);
      setSecondDiceValue(d2);
      rolls++;

      if (rolls > 8) {
        clearInterval(rollInterval);
        const finalD1 = Math.floor(Math.random() * 6) + 1;
        const finalD2 = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalD1);
        setSecondDiceValue(finalD2);

        const totalRoll = diceMode === 'double' ? finalD1 + finalD2 : finalD1;
        setAllowedSteps(totalRoll);

        // Extra Turn Rule:
        // - Two-Dice: Rolling doubles (matching dice like 1-1, 2-2, 3-3, 4-4, 5-5, 6-6)
        // - Single-Die: Rolling a 6
        const isDoubles = checkDoublesRule(finalD1, finalD2);
        const isSingleSix = checkExtraTurnRule(finalD1);
        const earnsExtraTurn = diceMode === 'double' ? isDoubles : isSingleSix;

        setHasExtraTurn(earnsExtraTurn);

        if (earnsExtraTurn) {
          if (diceMode === 'double') {
            setBannerToast({
              title: `🎉 Rolled Doubles (${finalD1} & ${finalD2})! Extra Turn Granted!`,
              desc: `${currentPlayer.name} rolled matching dice! Extra turn awarded after this space action.`,
            });
            addChatMessage('System', '#eab308', `🎉 ${currentPlayer.name} rolled Doubles (${finalD1} & ${finalD2}) and earned an Extra Turn!`);
          } else {
            setBannerToast({
              title: `🎉 Rolled a 6! Extra Turn Granted!`,
              desc: `${currentPlayer.name} rolled a 6! Extra turn awarded after this space action.`,
            });
            addChatMessage('System', '#eab308', `🎉 ${currentPlayer.name} rolled a 6 and earned an Extra Turn!`);
          }
        }

        const destIdx = (currentPlayer.position + totalRoll) % spaces.length;
        setTargetSpaceId(destIdx);
        setIsRolling(false);

        // Animate piece movement along the perimeter
        processMove(totalRoll);
      }
    }, 60);
  };

  // Step-by-Step Pawn Movement Clockwise Around 36 Spaces
  const processMove = (totalSteps: number) => {
    setIsMovingPawn(true);
    let stepCount = 0;

    const moveInterval = setInterval(() => {
      stepCount++;

      setPlayers((prev) => {
        const currentP = prev[turnIndex];
        if (!currentP) return prev;
        const nextPos = (currentP.position + 1) % spaces.length;
        const passedGo = nextPos === 0;
        let bonusCash = 0;

        if (passedGo) {
          bonusCash = 1500;
          if (soundEnabled) soundFx.playCheck();
          setBannerToast({
            title: `💰 ${currentP.name} Passed START!`,
            desc: 'Collected $1,500 salary as you passed the International START hub.',
          });
        }

        if (soundEnabled) soundFx.playMove();

        return prev.map((p, idx) =>
          idx === turnIndex
            ? {
                ...p,
                position: nextPos,
                cash: p.cash + bonusCash,
                netWorth: p.netWorth + bonusCash,
              }
            : p
        );
      });

      if (stepCount >= totalSteps) {
        clearInterval(moveInterval);
        setIsMovingPawn(false);
        setTargetSpaceId(null);
        if (soundEnabled) soundFx.playCheck();

        // Evaluate Landing Space once pawn arrives
        setTimeout(() => {
          setPlayers((latestPlayers) => {
            const finalP = latestPlayers[turnIndex];
            if (finalP) {
              const targetSpace = spaces[finalP.position];
              handleSpaceLanding(finalP, targetSpace, latestPlayers);
            }
            return latestPlayers;
          });
        }, 250);
      }
    }, 220);
  };

  // Handle Space Landing Actions
  const handleSpaceLanding = (
    player: BusinessPlayer,
    space: InternationalBoardSpace,
    latestPlayers: BusinessPlayer[] = players
  ) => {
    if (space.type === 'property' || space.type === 'transit') {
      if (space.ownerId === undefined) {
        // Unowned property or transit hub: trigger landing check
        if (!player.isAi) {
          // Open the card modal ONLY when physically landed on via dice roll
          handlePlayerLanding(space, player, setPendingSpace, (open) => {
            setActiveModal(open ? 'buy_property' : 'none');
          });
        } else {
          // AI Purchase logic
          const shouldBuy = player.cash >= space.price && (player.cash - space.price >= 2500 || Math.random() > 0.35);
          if (shouldBuy) {
            buyProperty(player.id, space.id);
            addChatMessage(player.name, player.color, `Acquired ${space.name} for $${space.price.toLocaleString()}! 🏢`);
          } else {
            // AI Pass / Skip -> Receives Bank Mortgage Payout
            const mortgageValue =
              CITY_PROPERTY_CARDS[space.name]?.mortgage ||
              TRANSIT_WAYS_CARDS[space.name]?.mortgage ||
              Math.round(space.price * 0.5);
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === player.id
                  ? { ...p, cash: p.cash + mortgageValue, netWorth: p.netWorth + mortgageValue }
                  : p
              )
            );
            setBannerToast({
              title: `🏦 Bank Subsidy (+ $${mortgageValue.toLocaleString()})`,
              desc: `${player.name} skipped ${space.name} and received $${mortgageValue.toLocaleString()} Bank Mortgage Payout.`,
            });
          }
          nextTurn();
        }
      } else if (space.ownerId !== player.id) {
        // Ensure card modal stays closed on owned property rent collection
        handlePlayerLanding(space, player, setPendingSpace, (open) => setActiveModal(open ? 'buy_property' : 'none'));
        // Pay Stock-Adjusted Rent / Transit Fee to Owner
        const owner = latestPlayers.find((p) => p.id === space.ownerId);
        if (owner) {
          const sectorKey = PROPERTY_SECTOR_MAP[space.name] || (space.type === 'transit' ? 'Aviation & Logistics' : 'Global Real Estate');
          const marketMult = marketRates[sectorKey] ?? 1.0;
          const rentMultiplier = 1 + space.houses * 0.75;
          const rentToPay = Math.round(space.rent * rentMultiplier * marketMult);
          if (soundEnabled) soundFx.playCapture();

          const eliminated = handlePlayerDebtOrPayment(player.id, owner.id, rentToPay, `Rent on ${space.name}`);

          if (!eliminated) {
            const stockPercent = ((marketMult - 1) * 100).toFixed(1);
            const stockTag = marketMult !== 1.0 ? ` (Stock ${marketMult >= 1 ? '+' : ''}${stockPercent}%)` : '';

            setBannerToast({
              title: `💸 Rent Paid: $${rentToPay.toLocaleString()}${stockTag}`,
              desc: `${player.name} landed on ${space.name} [${sectorKey}] and paid $${rentToPay.toLocaleString()} to ${owner.name}.`,
            });
          }
        }
        nextTurn();
      } else {
        // Landed on own property - ensure card modal stays closed
        handlePlayerLanding(space, player, setPendingSpace, (open) => setActiveModal(open ? 'buy_property' : 'none'));
        
        // AI House Building logic on landing on own property
        if (player.isAi) {
          const houseCost = CITY_PROPERTY_CARDS[space.name]?.houseCost || Math.round(space.price * 0.4);
          const currentHouses = space.houses || 0;
          const aiCash = player.cash ?? (player as any).totalCash ?? 0;

          if (currentHouses < 4 && aiCash >= houseCost + 3000) {
            setSpaces((prev) =>
              prev.map((s) =>
                s.id === space.id ? { ...s, houses: currentHouses + 1, hasHouse: true } : s
              )
            );
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === player.id
                  ? {
                      ...p,
                      cash: p.cash - houseCost,
                      totalCash: (p.totalCash ?? p.cash) - houseCost,
                      netWorth: p.netWorth + Math.round(houseCost * 0.9),
                    }
                  : p
              )
            );
            if (soundEnabled) soundFx.playCheck();
            addChatMessage(player.name, player.color, `🏗️ AI upgraded ${space.name} (House Level ${currentHouses + 1}) for $${houseCost.toLocaleString()}!`);
            setBannerToast({
              title: `🏗️ ${player.name} Upgraded Property`,
              desc: `Built House Level ${currentHouses + 1} on ${space.name} for $${houseCost.toLocaleString()}.`,
            });
          } else {
            setBannerToast({
              title: `🏰 Safe at ${space.name}`,
              desc: `${player.name} rested at their own property.`,
            });
          }
        } else {
          setBannerToast({
            title: `🏰 Safe at ${space.name}`,
            desc: `You landed on your own property. Ready to build more skyscrapers!`,
          });
        }
        nextTurn();
      }
    } else if (space.specialType === 'bank' || space.type === 'bank') {
      // Special tile: Ensure card modal is closed
      handlePlayerLanding(space, player, setPendingSpace, (open) => setActiveModal(open ? 'buy_property' : 'none'));
      if (!player.isAi) {
        setChanceModalSpaceType('IMF');
        setActiveModal('chance_imf');
      } else {
        const roll = Math.floor(Math.random() * 11) + 2;
        const categoryKey = roll % 2 === 0 ? 'imfEven' : 'imfOdd';
        const actionText = BOARD_CARDS_DATA[categoryKey].actions[roll];
        const match = actionText.match(/\$([0-9,]+)/);
        const amount = match ? parseInt(match[1].replace(/,/g, ''), 10) : 2500;
        const isLoss = actionText.toLowerCase().includes('pay') || actionText.toLowerCase().includes('deposit');

        if (isLoss) {
          handlePlayerDebtOrPayment(player.id, 'bank', amount, 'IMF Fee / Fine');
        } else {
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === player.id
                ? { ...p, cash: p.cash + amount, netWorth: p.netWorth + amount }
                : p
            )
          );
        }

        setBannerToast({
          title: `🏦 IMF Fund Draw (Roll: ${roll})`,
          desc: `${player.name}: ${actionText}`,
        });
        nextTurn();
      }
    } else if (space.specialType === 'chance' || space.type === 'chance') {
      if (!player.isAi) {
        setChanceModalSpaceType('CHANCE');
        setActiveModal('chance_imf');
      } else {
        const roll = Math.floor(Math.random() * 11) + 2;
        const categoryKey = roll % 2 === 0 ? 'chanceEven' : 'chanceOdd';
        const actionText = BOARD_CARDS_DATA[categoryKey].actions[roll];
        const match = actionText.match(/\$([0-9,]+)/);
        const amount = match ? parseInt(match[1].replace(/,/g, ''), 10) : 2000;
        const isLoss = actionText.toLowerCase().includes('pay') || actionText.toLowerCase().includes('fine') || actionText.toLowerCase().includes('penalty');

        if (isLoss) {
          handlePlayerDebtOrPayment(player.id, 'bank', amount, 'Chance Penalty / Fee');
        } else {
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === player.id
                ? { ...p, cash: p.cash + amount, netWorth: p.netWorth + amount }
                : p
            )
          );
        }

        setBannerToast({
          title: `🎲 Chance Card Draw (Roll: ${roll})`,
          desc: `${player.name}: ${actionText}`,
        });
        nextTurn();
      }
    } else if (space.specialType === 'commonwealth') {
      const card =
        INTERNATIONAL_COMMONWEALTH_CARDS[
          Math.floor(Math.random() * INTERNATIONAL_COMMONWEALTH_CARDS.length)
        ];
      setActiveCard(card);

      if (!player.isAi) {
        setActiveModal('commonwealth');
        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === turnIndex
              ? { ...p, cash: Math.max(0, p.cash + card.amount), netWorth: p.netWorth + card.amount }
              : p
          )
        );
      } else {
        // AI directly applies Commonwealth card effect
        if (card.amount < 0) {
          handlePlayerDebtOrPayment(player.id, 'bank', Math.abs(card.amount), `Commonwealth: ${card.title}`);
        } else {
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === player.id
                ? { ...p, cash: p.cash + card.amount, netWorth: p.netWorth + card.amount }
                : p
            )
          );
        }
        setBannerToast({
          title: `🌍 Commonwealth Draw: ${card.title}`,
          desc: `${player.name}: ${card.text} (${card.amount >= 0 ? `+$${card.amount}` : `-$${Math.abs(card.amount)}`})`,
        });
        addChatMessage(player.name, player.color, `🌍 Commonwealth: ${card.title} (${card.amount >= 0 ? `+$${card.amount}` : `-$${Math.abs(card.amount)}`})`);
        nextTurn();
      }
    } else if (space.name.toUpperCase().includes('VISA') || space.id === 4) {
      // Landed on Visa Fee tile (Custom landing rule & document check)
      const visaFeeAmount = space.price || 1000;
      const result = handleVisaTileLanding(
        player,
        visaFeeAmount,
        setPlayers,
        (eliminatedId, reason) => {
          handlePlayerDebtOrPayment(eliminatedId, 'bank', visaFeeAmount * 100, reason || 'Insolvency at Visa tile');
        }
      );

      if (result.eliminated) {
        if (soundEnabled) soundFx.playCapture();
        setBannerToast({
          title: `🚨 Visa Fee Violation!`,
          desc: `${player.name} had no valid Visa and could not pay the $${visaFeeAmount.toLocaleString()} fee. Eliminated!`,
        });
        addChatMessage('System', '#ef4444', `🚨 ${player.name} eliminated on Visa Fee tile (no valid visa and insufficient funds).`);
        return;
      } else {
        if (soundEnabled) soundFx.playCheck();
        setBannerToast({
          title: `🛂 Visa Check: ${space.name}`,
          desc: result.message,
        });
        addChatMessage(player.name, player.color, `🛂 Landed on ${space.name}: ${result.message}`);
      }
      nextTurn();
    } else if (space.specialType === 'tax' || space.type === 'tax') {
      const taxAmount = space.price || 1000;
      if (soundEnabled) soundFx.playCapture();
      
      const isEliminated = handlePlayerDebtOrPayment(player.id, 'bank', taxAmount, `Tax on ${space.name}`);
      if (!isEliminated) {
        setBannerToast({
          title: `🧾 ${space.name} Paid: $${taxAmount.toLocaleString()}`,
          desc: `${player.name} paid $${taxAmount.toLocaleString()} to international authorities.`,
        });
      }
      nextTurn();
    } else if (space.specialType === 'jail') {
      const jailPenalty = 500;
      if (soundEnabled) soundFx.playCapture();
      const isEliminated = handlePlayerDebtOrPayment(player.id, 'bank', jailPenalty, 'Jail Fine / Bail');
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === player.id
            ? { ...p, inJail: true, jailTurns: 1 }
            : p
        )
      );
      if (!isEliminated) {
        setBannerToast({
          title: `⚖️ Sent to Jail! $500 Deducted`,
          desc: `${player.name} landed on Jail! $500 fine deducted and 1 turn skipped.`,
        });
        addChatMessage('System', '#ef4444', `⛓️ ${player.name} landed on JAIL ($500 fine deducted, next turn skipped).`);
      }
      nextTurn();
    } else if (space.specialType === 'beach') {
      const bonus = 1000;
      if (soundEnabled) soundFx.playCheck();
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === turnIndex ? { ...p, cash: p.cash + bonus, netWorth: p.netWorth + bonus } : p
        )
      );
      setBannerToast({
        title: `🏖️ Beach Party Celebration!`,
        desc: `${player.name} relaxed at the VIP Beach Party and earned $${bonus} in entertainment dividends.`,
      });
      nextTurn();
    } else if (space.specialType === 'resort') {
      const resortBonus = 1200;
      if (soundEnabled) soundFx.playCheck();
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === turnIndex ? { ...p, cash: p.cash + resortBonus, netWorth: p.netWorth + resortBonus } : p
        )
      );
      setBannerToast({
        title: `🌴 Tourist Resort Dividend!`,
        desc: `${player.name} checked into the luxury Tourist Resort and received $${resortBonus} tourist revenues.`,
      });
      nextTurn();
    } else {
      nextTurn();
    }
  };

  // Buy Property Handler (House placed on property tile when player buys; Housefull check prevents duplicate purchases)
  const buyProperty = (playerId: number, spaceId: number) => {
    const spaceToBuy = spaces.find((s) => s.id === spaceId);
    if (!spaceToBuy) return;

    // 1. Housefull Check: If property is already owned, block buying
    if (spaceToBuy.isOwned || spaceToBuy.ownerId !== undefined) {
      setBannerToast({
        title: `🏢 Housefull!`,
        desc: `This property is already owned by a player.`,
      });
      return;
    }

    const buyer = players.find((p) => p.id === playerId);
    if (!buyer) return;

    // 2. Fund Check: Ensure player has enough cash to buy
    const playerLiquidCash = buyer.cash ?? (buyer as any).totalCash ?? 0;
    if (playerLiquidCash < spaceToBuy.price) {
      setBannerToast({
        title: `❌ Insufficient Funds`,
        desc: `Insufficient funds to buy this property ($${spaceToBuy.price.toLocaleString()} required).`,
      });
      return;
    }

    // 3. Deduct cash from player & add to propertiesOwned
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === playerId) {
          const currentCash = p.cash ?? (p as any).totalCash ?? 0;
          const updatedCash = currentCash - spaceToBuy.price;
          return {
            ...p,
            cash: updatedCash,
            totalCash: updatedCash,
            netWorth: p.netWorth + Math.round(spaceToBuy.price * 0.8),
            propertiesOwned: [...(p.propertiesOwned || []), spaceId],
          };
        }
        return p;
      })
    );

    // 4. Update property status & attach the house with the player's color (red, green, yellow, blue, etc.)
    setSpaces((prev) =>
      prev.map((s) =>
        s.id === spaceId
          ? {
              ...s,
              isOwned: true,
              hasHouse: true, // House is now placed because player selected and bought the property
              houses: Math.max(1, s.houses || 1),
              ownerId: playerId,
              ownerColor: buyer.color, // Uses starting chosen color
            }
          : s
      )
    );

    if (playerId === 0) {
      setMissionProgress((prev) => Math.min(3, prev + 1));
    }

    if (soundEnabled) soundFx.playCheck();

    setBannerToast({
      title: `🏢 Property Acquired with House!`,
      desc: `${buyer.name} bought ${spaceToBuy.name} for $${spaceToBuy.price.toLocaleString()} and placed their house.`,
    });
  };

  // Next Turn Advance (Respecting economic monitoring, Extra Turn on Doubles / 6 Rule, and checking for Market Crashes)
  const nextTurn = () => {
    // 1. Run Continuous Automatic Economic Monitoring across all players
    runAutomaticEconomicMonitoring(
      players,
      setPlayers,
      (eliminatedId, reason) => {
        if (soundEnabled) soundFx.playGameOver(false);
        // Release properties back to bank
        setSpaces((prev) =>
          prev.map((s) => (s.ownerId === eliminatedId ? { ...s, ownerId: undefined, isOwned: false, hasHouse: false, houses: 0 } : s))
        );
        
        eliminatePlayerFromGame(
          eliminatedId,
          reason || `Player ${eliminatedId} was declared bankrupt and eliminated.`,
          setPlayers,
          setEliminatedPlayers,
          setTurnIndex,
          turnIndex
        );

        addChatMessage('System', '#ef4444', `🚨 ${reason || `Player ${eliminatedId} was eliminated!`}`);
        setBannerToast({
          title: `💥 Bankrupt: Economic Elimination!`,
          desc: reason || `Player ${eliminatedId} was declared bankrupt and eliminated.`,
        });
        if (eliminatedId === 0) {
          recordTwentyGameResult(20, false, 500);
          if (onGameEnd) {
            onGameEnd('b', `Player was eliminated due to insolvency or low liquidity`);
          }
        }
        setPlayers((currentActive) => {
          if (currentActive.length === 1) {
            const champ = currentActive[0];
            setWinner(champ);
            setIsGameOver(true);
            setActiveModal('game_over');
            const isUserWinner = champ.id === 0;
            recordTwentyGameResult(20, isUserWinner, isUserWinner ? champ.netWorth : 500);
            if (onGameEnd) {
              onGameEnd(isUserWinner ? 'w' : 'b', `${champ.name} won the game as the last tycoon standing!`);
            }
          }
          return currentActive;
        });
      },
      10000,
      5000,
      (title, desc, type) => {
        if (type === 'danger') {
          if (soundEnabled) soundFx.playCapture();
          addChatMessage('System', '#ef4444', `${title}: ${desc}`);
        } else {
          addChatMessage('System', '#f59e0b', `${title}: ${desc}`);
        }
        setBannerToast({ title, desc });
      },
      BLACK_MONEY_CONFIG,
      setSpaces
    );

    if (hasExtraTurn) {
      // If the player rolled doubles (or a 6 in single-die mode), they get an extra turn (do NOT advance player turnIndex)
      setHasExtraTurn(false);
      setBannerToast({
        title: `🔥 Extra Turn Active!`,
        desc: `Bonus roll for ${currentPlayer.name}! Roll the dice again.`,
      });
      addChatMessage('System', '#eab308', `🎲 Extra Turn active: ${currentPlayer.name} rolls again!`);
      return;
    }

    // Check for random Stock Market Crash (12% probability per turn cycle with 3-turn cooldown cushion)
    if (turnsSinceLastCrash < 3) {
      setTurnsSinceLastCrash((prev) => prev + 1);
    } else {
      const roll = Math.random();
      if (roll <= 0.12) {
        setIsMarketCrashed(true);
        setTurnsSinceLastCrash(0);
        const crashResult = checkAndTriggerMarketCrash(stocks, 1.0);
        setStocks(crashResult.updatedStocks);
        if (soundEnabled) soundFx.playCapture();
        setBannerToast({
          title: `🚨 MARKET CRASH DETECTED!`,
          desc: crashResult.message,
        });
        addChatMessage('System', '#ef4444', crashResult.message);
      } else {
        setTurnsSinceLastCrash((prev) => prev + 1);
        if (isMarketCrashed && turnsSinceLastCrash >= 1) {
          setIsMarketCrashed(false);
        }
      }
    }

    // Otherwise, strictly advance to the next player in sequential order (1 -> 2 -> 3 -> 4 -> 1)
    setTurnIndex((prev) => (prev + 1) % players.length);
  };

  // Chat message helper with guaranteed unique IDs
  const addChatMessage = (sender: string, color: string, text: string) => {
    const uniqueMsgId = `biz_msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setChatMessages((prev) => [
      ...prev,
      { id: uniqueMsgId, sender, color, text, time: 'Just now' },
    ]);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    addChatMessage(players[0].name, players[0].color, chatInput);
    setChatInput('');
  };

  // Stock Market Crash & Portfolio Loss Handler Logic
  const handleManualMarketCrash = (
    currentUserSession: any,
    setPlayersState: React.Dispatch<React.SetStateAction<BusinessPlayer[]>>,
    setMarketStateFn: React.Dispatch<React.SetStateAction<{ status: string; isCrashed: boolean; dropPercentage: number }>>,
    setChartThemeFn?: React.Dispatch<React.SetStateAction<'default' | 'red-bearish'>>
  ) => {
    // 1. Trigger the visual crash state (turn chart/indicators red and down)
    setMarketStateFn({
      status: 'BEAR MARKET IMPLOSION',
      isCrashed: true,
      dropPercentage: -0.40, // 30% to 40% drop
    });

    if (setChartThemeFn) {
      setChartThemeFn('red-bearish');
    }

    setIsMarketCrashed(true);
    setTurnsSinceLastCrash(0);

    // Apply crash drop to stock listings
    const crashResult = checkAndTriggerMarketCrash(stocks, 1.0);
    setStocks(crashResult.updatedStocks);

    // 2. Update players' portfolios and apply damage ONLY if they hold stock shares
    setPlayersState((prevPlayers) =>
      prevPlayers.map((player: any) => {
        // Check if the player has active stock shares
        const holdingList = player.stocks || player.shares?.holdings || {};
        const hasStocks = Object.values(holdingList).some((item: any) => {
          if (typeof item === 'number') return item > 0;
          return item && item.shares > 0;
        });

        if (!hasStocks) {
          return player; // No stocks bought, no loss deduction
        }

        // Calculate crash loss on active investments
        let totalLoss = 0;
        const updatedStocks: Record<string, any> = { ...(player.stocks || {}) };

        Object.keys(holdingList).forEach((stockKey) => {
          const item = holdingList[stockKey];
          const sharesOwned = typeof item === 'number' ? item : item?.shares || 0;
          if (sharesOwned <= 0) return;

          const matchedStock = stocks.find((s) => s.id === stockKey);
          const currentStockPrice = matchedStock?.price || player.shares?.prices?.[stockKey] || 100;

          // Asset devaluation loss calculation (e.g., 35% drop hit)
          const assetValueBefore = sharesOwned * currentStockPrice;
          const assetValueAfter = assetValueBefore * 0.65;
          const loss = assetValueBefore - assetValueAfter;
          totalLoss += loss;

          if (updatedStocks[stockKey]) {
            updatedStocks[stockKey] = {
              ...updatedStocks[stockKey],
              avgPrice: Math.max(10, Math.round(currentStockPrice * 0.65)),
              totalCost: Math.max(0, (updatedStocks[stockKey].totalCost || 0) - loss),
            };
          }
        });

        const currentCash = player.cash ?? player.totalCash ?? 0;
        const updatedCash = Math.max(0, currentCash - totalLoss);
        const updatedNetWorth = Math.max(0, (player.netWorth || 0) - totalLoss);

        return {
          ...player,
          cash: updatedCash,
          totalCash: updatedCash,
          netWorth: updatedNetWorth,
          stocks: updatedStocks,
        };
      })
    );

    if (soundEnabled) soundFx.playCapture();
    setBannerToast({
      title: `🚨 BEAR MARKET IMPLOSION TRIGGERED!`,
      desc: `Global stock valuations crashed by -40%. Active stock owners suffered direct portfolio drawdowns.`,
    });
    addChatMessage(
      'ADITYA-OWNER 👑',
      '#f43f5e',
      `🚨 Master Crash Trigger: BEAR MARKET IMPLOSION (-40%). Deductions applied strictly to active shareholders!`
    );
  };

  // Master Crash Trigger Override (Exclusive for ADITYA-OWNER)
  const handleMasterTriggerCrash = () => {
    handleManualMarketCrash(currentUser, setPlayers, setMarketState, setChartTheme);
  };

  // Real Stock Market Investment handler (Sector Allocator with exact bounds: Profit $1k-$10k, Loss $1k-$50k)
  const handleStockInvest = (sectorOrStock: string, amount: number) => {
    if (players[0].cash >= amount) {
      const outcome = calculateStockReturnOutcome();
      const isProfit = outcome.isSuccess;
      const amountChanged = outcome.amountChanged;

      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === 0) {
            const netCashChange = isProfit ? (amountChanged - amount) : (-amount - amountChanged);
            const newCash = Math.max(0, p.cash + netCashChange);
            const newNetWorth = Math.max(0, p.netWorth + (isProfit ? amountChanged : -amountChanged));
            return { ...p, cash: newCash, netWorth: newNetWorth };
          }
          return p;
        })
      );

      if (isProfit) {
        if (soundEnabled) soundFx.playCash();
        addChatMessage(
          players[0].name,
          players[0].color,
          `📈 Invested in ${sectorOrStock}! Profit secured: +$${amountChanged.toLocaleString()} USD`
        );
        setBannerToast({
          title: `📈 Profit Secured: +$${amountChanged.toLocaleString()} USD`,
          desc: `${outcome.message} on ${sectorOrStock} position.`,
        });
      } else {
        if (soundEnabled) soundFx.playMove();
        addChatMessage(
          players[0].name,
          players[0].color,
          `📉 Trade downturn in ${sectorOrStock}! Loss incurred: -$${amountChanged.toLocaleString()} USD`
        );
        setBannerToast({
          title: `📉 Market Loss: -$${amountChanged.toLocaleString()} USD`,
          desc: `${outcome.message} on ${sectorOrStock} position.`,
        });
      }
    } else {
      if (soundEnabled) soundFx.playMove();
      setBannerToast({
        title: `⚠️ Insufficient Cash`,
        desc: `You need $${amount.toLocaleString()} cash to purchase this stock equity position.`,
      });
    }
  };

  // Stock Market Listing Buy Handler
  const handleBuyStockShares = (stockId: string, stockPrice: number, quantity: number = 1) => {
    const user = players[0];
    const totalCost = stockPrice * quantity;
    
    // Initialize stock purchase holding state
    const holdingState = initializeStockPurchase(stockId, totalCost, stockPrice);
    
    const res = buyStock(
      { money: user.cash, stocks: user.stocks },
      stockId,
      stockPrice,
      quantity
    );
    if (!res.success) {
      if (soundEnabled) soundFx.playMove();
      setBannerToast({
        title: '⚠️ Purchase Failed',
        desc: res.message,
      });
      return;
    }

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === 0
          ? {
              ...p,
              cash: res.newMoney,
              netWorth: p.netWorth + Math.round(stockPrice * quantity * 0.1),
              stocks: res.updatedStocks,
            }
          : p
      )
    );

    if (soundEnabled) soundFx.playCheck();
    addChatMessage(user.name, user.color, `${res.message} (Holding: ${holdingState.sharesPurchased} shares @ $${holdingState.avgBuyPrice}/ea)`);
    setBannerToast({
      title: `📈 Stock Acquired: ${stockId}`,
      desc: `${res.message} (Locked in ${holdingState.sharesPurchased} shares @ $${holdingState.avgBuyPrice})`,
    });
  };

  // Stock Market Listing Sell Handler
  const handleSellStockShares = (stockId: string, stockPrice: number, quantity: number = 1) => {
    const user = players[0];
    const res = sellStock(
      { money: user.cash, stocks: user.stocks },
      stockId,
      stockPrice,
      quantity
    );
    if (!res.success) {
      if (soundEnabled) soundFx.playMove();
      setBannerToast({
        title: '⚠️ Sale Failed',
        desc: res.message,
      });
      return;
    }

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === 0
          ? {
              ...p,
              cash: res.newMoney,
              stocks: res.updatedStocks,
            }
          : p
      )
    );

    if (soundEnabled) soundFx.playCheck();
    addChatMessage(user.name, user.color, res.message);
    setBannerToast({
      title: `💵 Stock Sold: ${stockId}`,
      desc: res.message,
    });
  };

  // Stock Market Listing Cash Out Profit Handler
  const handleCashOutStockProfit = (stockId: string, stockPrice: number) => {
    const user = players[0];
    const res = cashOutStockProfit(
      { money: user.cash, stocks: user.stocks },
      stockId,
      stockPrice
    );
    if (!res.success) {
      if (soundEnabled) soundFx.playMove();
      setBannerToast({
        title: '⚠️ Cash Out Failed',
        desc: res.message,
      });
      return;
    }

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === 0
          ? {
              ...p,
              cash: res.newMoney,
              stocks: res.updatedStocks,
            }
          : p
      )
    );

    if (soundEnabled) soundFx.playCash();
    addChatMessage(user.name, user.color, res.message);
    setBannerToast({
      title: `💰 Profit Cashed Out: +$${res.cashEarned?.toLocaleString()}`,
      desc: res.message,
    });
  };

  // Dynamic Stock Cash-Out or Market Fluctuation Cycle Handler (Profit: $1k-$10k, Loss: $5k-$50k)
  const handleStockCashOut = (player: BusinessPlayer, stockKey: string, isProfitable: boolean) => {
    const outcomeAmount = getRandomFinancialOutcome(isProfitable);

    setPlayers((prevPlayers) =>
      prevPlayers.map((p) => {
        if (p.id !== player.id) return p;

        let updatedCash = p.cash ?? (p as any).totalCash ?? 0;
        if (isProfitable) {
          updatedCash += outcomeAmount; // Add profit (1k - 10k USD)
        } else {
          updatedCash -= outcomeAmount; // Deduct loss (5k - 50k USD)
        }

        const safeCash = updatedCash >= 0 ? updatedCash : 0;
        return {
          ...p,
          cash: safeCash,
          totalCash: safeCash,
          netWorth: Math.max(0, (p.netWorth || 0) + (isProfitable ? outcomeAmount : -outcomeAmount)),
        };
      })
    );

    if (isProfitable) {
      if (soundEnabled) soundFx.playCash();
      setBannerToast({
        title: `💰 Profit Cashed Out: +$${outcomeAmount.toLocaleString()} USD`,
        desc: `Secured return on ${stockKey}: +$${outcomeAmount.toLocaleString()} USD.`,
      });
      addChatMessage(player.name, player.color, `💰 Cashed out from ${stockKey}: +$${outcomeAmount.toLocaleString()} USD`);
    } else {
      if (soundEnabled) soundFx.playMove();
      setBannerToast({
        title: `📉 Market Downturn: -$${outcomeAmount.toLocaleString()} USD`,
        desc: `Penalty incurred on ${stockKey}: -$${outcomeAmount.toLocaleString()} USD.`,
      });
      addChatMessage(player.name, player.color, `📉 Loss incurred on ${stockKey}: -$${outcomeAmount.toLocaleString()} USD`);
    }
  };

  // Sector Cash Out Profit Handler (for Real-Time Chart modal with range-bound profit $1k-$10k, loss $5k-$50k)
  const handleSectorCashOutProfit = (sectorName: string) => {
    // Determine random profit/loss state or check active stock performance
    const isProfitable = Math.random() >= 0.40;
    handleStockCashOut(players[0], sectorName, isProfitable);
  };

  // Sell Travel Documents to Bank (Visa: $10,000, Passport: $5,000)
  const handleSellTravelDocument = (docType: 'VISA' | 'PASSPORT') => {
    const user = players[0];
    const count = user.documents?.[docType] || 0;
    if (count <= 0) {
      if (soundEnabled) soundFx.playMove();
      setBannerToast({
        title: `⚠️ No ${docType} Travel Document`,
        desc: `You do not have any ${docType} credentials remaining to sell.`,
      });
      return;
    }

    const payout = docType === 'VISA' ? 10000 : 5000;
    const updatedDocs = {
      ...user.documents,
      [docType]: count - 1,
    };

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === 0
          ? {
              ...p,
              cash: p.cash + payout,
              documents: updatedDocs,
            }
          : p
      )
    );

    if (soundEnabled) soundFx.playCash();
    addChatMessage(user.name, user.color, `Sold 1 ${docType} to Bank for $${payout.toLocaleString()} cash! 🛂`);
    setBannerToast({
      title: `🛂 ${docType} Liquidated (+ $${payout.toLocaleString()})`,
      desc: `Redeemed ${docType} with the Bank for $${payout.toLocaleString()} instant cash.`,
    });
  };

  // Regain Confiscated/Captured Travel Documents (Visa: $10,000, Passport: $5,000)
  const handleRegainPlayerDocument = (docType: 'visa' | 'passport', cost: number) => {
    const user = players[0];
    const success = regainDocument(user, docType, cost, setPlayers);

    if (success) {
      if (soundEnabled) soundFx.playCash();
      setBannerToast({
        title: `🛂 ${docType.toUpperCase()} Document Restored!`,
        desc: `Paid $${cost.toLocaleString()} to clear confiscated status. Valid credentials restored!`,
      });
      addChatMessage(user.name, user.color, `Paid $${cost.toLocaleString()} recovery fee to regain valid ${docType.toUpperCase()}! 🛂`);
    } else {
      if (soundEnabled) soundFx.playMove();
      setBannerToast({
        title: `⚠️ Insufficient Funds`,
        desc: `You need at least $${cost.toLocaleString()} to regain your confiscated ${docType.toUpperCase()}.`,
      });
    }
  };

  // Direct Bank Shop purchase handler for currency notes & travel documents
  const handleBuyFromBankShop = (item: BankShopItem) => {
    const user = players[0];
    const res = handleShopPurchase(user, item, setPlayers);

    if (res.success) {
      if (soundEnabled) soundFx.playCash();
      setBannerToast({
        title: `🏦 Bank Shop Purchase`,
        desc: res.message,
      });
      addChatMessage(user.name, user.color, `Purchased ${item.label} from Bank Shop! 🏦`);

      // Check if resulting cash exceeds $70,000 USD and trigger immediate Black Money Audit
      const currentCash = (user.totalCash ?? user.cash ?? 0);
      const resultingCash = item.type === 'currency' ? currentCash - item.cost + item.value : currentCash - item.cost;
      if (resultingCash > 70000) {
        setTimeout(() => {
          handleTriggerBlackMoneyCheck(user);
        }, 350);
      }
    } else {
      if (soundEnabled) soundFx.playMove();
      setBannerToast({
        title: `⚠️ Purchase Failed`,
        desc: res.message,
      });
    }
  };

  // Black Money Finance Evaluation & Tax Penalty Checker (Threshold: >$70,000)
  const handleTriggerBlackMoneyCheck = (targetPlayer: BusinessPlayer = players[0]) => {
    const result = handleBlackMoneyCheck(targetPlayer, setPlayers);

    if (result.penalized) {
      if (soundEnabled) soundFx.playCapture();
      setBannerToast({
        title: `🚨 BLACK MONEY DETECTED! (-$${result.totalDeduction?.toLocaleString()})`,
        desc: `$20,000 Penalty applied. Visa & Passport legally captured!`,
      });
      addChatMessage('System', '#ef4444', `🚨 ${targetPlayer.name}: ${result.message}`);
    } else {
      setBannerToast({
        title: `🛡️ Financial Audit Clear`,
        desc: `${targetPlayer.name}'s liquid cash is within standard asset limits ($70,000 threshold).`,
      });
    }
    return result;
  };

  // Surrender / Mortgage Property to Bank
  const handleMortgagePropertyToBank = (spaceId: number) => {
    const space = spaces.find((s) => s.id === spaceId);
    if (!space) return;

    const mortgageVal =
      CITY_PROPERTY_CARDS[space.name]?.mortgage ||
      TRANSIT_WAYS_CARDS[space.name]?.mortgage ||
      Math.round((space.price || 2000) * 0.5);

    setSpaces((prev) =>
      prev.map((s) => (s.id === spaceId ? { ...s, ownerId: undefined, houses: 0 } : s))
    );

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === 0
          ? {
              ...p,
              cash: p.cash + mortgageVal,
              propertiesOwned: p.propertiesOwned.filter((id) => id !== spaceId),
            }
          : p
      )
    );

    if (soundEnabled) soundFx.playCash();
    addChatMessage(players[0].name, players[0].color, `Surrendered ${space.name} to Bank for $${mortgageVal.toLocaleString()} mortgage payout. 🏦`);
    setBannerToast({
      title: `🏦 Surrendered for Bank Mortgage (+ $${mortgageVal.toLocaleString()})`,
      desc: `${space.name} surrendered to Bank. Received $${mortgageVal.toLocaleString()} mortgage payout.`,
    });
  };

  // Liquidate All Shares of a Stock
  const handleLiquidateAllStock = (stockId: string) => {
    const user = players[0];
    const holding = user.stocks?.[stockId];
    if (!holding || holding.shares <= 0) return;

    const liveStock = stocks.find((s) => s.id === stockId);
    const price = liveStock?.price || holding.avgBuyPrice;
    const totalReturn = holding.shares * price;

    const updatedStocks = { ...user.stocks };
    delete updatedStocks[stockId];

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === 0
          ? {
              ...p,
              cash: p.cash + totalReturn,
              stocks: updatedStocks,
            }
          : p
      )
    );

    if (soundEnabled) soundFx.playCash();
    addChatMessage(user.name, user.color, `Liquidated all ${holding.shares} shares of ${stockId} for $${totalReturn.toLocaleString()}. 📈`);
    setBannerToast({
      title: `📈 Stock Liquidated (+ $${totalReturn.toLocaleString()})`,
      desc: `Sold all ${holding.shares} shares of ${stockId} at market price $${price.toLocaleString()}.`,
    });
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto flex flex-col gap-3 p-2 sm:p-4 text-white font-sans select-none">
      
      {/* ================= TOP HEADER BAR ================= */}
      <div className="relative z-10 flex items-center justify-between bg-[#0b1022]/90 border border-[#1e293b] rounded-2xl p-2.5 sm:p-3 shadow-xl backdrop-blur-md">
        
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 via-rose-600 to-amber-500 p-0.5 shadow-[0_0_15px_rgba(220,38,38,0.5)] flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#0b1022] rounded-[10px] flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
          </div>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-black tracking-wider text-white m-0 uppercase drop-shadow flex items-center gap-1.5">
              <span>INTERNATIONAL BUSINESS</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-300 border border-red-400/30 font-bold hidden sm:inline">
                36 SPACES
              </span>
            </h1>
            <span className="text-[10px] text-gray-400 block truncate">
              Buy, Sell & Rent on the Roll of a Dice (1-6)
            </span>
          </div>
        </div>

        {/* Right: Cash Balance & Quick Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* User Cash Card & Portfolio Trigger */}
          <div
            onClick={() => setActiveModal('invest')}
            className="flex items-center gap-1.5 bg-[#0f172a] hover:bg-[#1e293b] border border-amber-400/40 rounded-xl px-2.5 py-1.5 shadow-inner cursor-pointer transition active:scale-95"
            title="View Player Portfolio & Live Stock Market"
          >
            <span className="text-sm">💵</span>
            <div className="flex flex-col text-right">
              <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider">
                {players[0].name}
              </span>
              <span className="text-xs sm:text-sm font-black font-mono text-[#ffe89e]">
                ${players[0].cash.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Quick Icons */}
          <div className="flex items-center gap-1">
            <button
              id="business-espionage-vaults-btn"
              onClick={() => setActiveModal('espionage_banking')}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-400 hover:to-purple-400 text-white font-black text-xs border border-indigo-300/40 shadow-[0_0_15px_rgba(99,102,241,0.4)] transition hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Corporate Vaults, Offshore Tax Shields & Industrial Espionage"
            >
              <span>🕵️‍♂️</span>
              <span className="hidden sm:inline text-[11px]">Espionage &amp; Vaults</span>
            </button>
            <MasterCrashControl
              currentUser={currentUser}
              onTriggerCrash={handleMasterTriggerCrash}
              className="static"
            />
            <button
              onClick={() => setIsBoardExpanded(!isBoardExpanded)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 border border-white/10 transition"
              title={isBoardExpanded ? 'Exit Full Board View' : 'Full Board Focus View'}
            >
              {isBoardExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setActiveModal('leaderboard')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 hover:text-amber-300 border border-white/10 transition"
              title="Leaderboard"
            >
              <Trophy className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition"
              title="Sound Toggle"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Player Lobby & Setup Selector (2-6 Players) */}
      <PlayerLobbySelector
        playerCount={playerCount}
        setPlayerCount={(count) => handlePlayerCountChange(count)}
        players={players}
        setPlayers={setPlayers}
        setTurnIndex={setTurnIndex}
        onResetGame={() => resetGame()}
      />

      {/* Motivational Options Panel Center */}
      <BusinessOptionsPanel
        playerCount={playerCount}
        onPlayerCountChange={handlePlayerCountChange}
        userColor={userColor}
        onUserColorChange={handleUserColorChange}
        activeSlots={slotConfigs.slice(0, playerCount)}
        onToggleSlotAi={handleToggleSlotAi}
        onResetGame={() => resetGame()}
        onOpenEspionage={() => setActiveModal('espionage_banking')}
        marketPhaseName={currentMarketPhase.name}
      />

      {/* ================= MAIN LAYOUT ================= */}
      <div className={`relative z-10 grid gap-4 items-start ${isBoardExpanded ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>
        
        {/* ================= LEFT COLUMN: PLAYERS & CHAT (3 cols) ================= */}
        {!isBoardExpanded && (
          <div className="lg:col-span-3 flex flex-col gap-3.5 order-2 lg:order-1">
            {/* Live Stopwatch & Next IRS Raid Circular Gauge Header */}
            <GameRaidHeader onRaidTrigger={handleExecutePeriodicRaid} />

            {/* Players Card Container */}
            <div className="bg-[#0b1022]/90 border border-[#1e293b] rounded-2xl p-3.5 shadow-xl flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-black uppercase text-gray-300">
                    Tycoons ({players.length}/{playerCount})
                  </span>
                </div>
                <span className="text-[10px] font-bold text-amber-400 truncate max-w-[120px]">
                  Turn: {currentPlayer.name}
                </span>
              </div>

              {/* Players List */}
              <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {players
                  .filter((p) => !eliminatedPlayers.some((ep) => ep.id === p.id))
                  .map((p, idx) => {
                    const isCurrent = turnIndex === idx;
                    return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-2.5 p-2 rounded-xl transition border relative ${
                        isCurrent
                          ? 'bg-gradient-to-r from-[#172554] to-[#0f172a] border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                          : 'bg-[#0f172a]/60 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {/* Avatar with Color Glow */}
                      <div className="relative shrink-0">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className={`w-10 h-10 rounded-xl object-cover border-2 ${p.borderClass}`}
                        />
                        <span className="absolute -bottom-1 -right-1 text-xs drop-shadow-md">{p.token}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white truncate flex items-center gap-1">
                            {p.name}
                            {p.isOwner && (
                              <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5" /> You
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-400">
                            ${p.cash.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[10px] text-gray-400 font-medium">
                            {p.propertiesOwned.length} Props
                          </span>
                          <span className="text-xs font-black text-[#ffe89e]">
                            ${p.netWorth.toLocaleString()}
                          </span>
                        </div>

                        {/* Dynamic Color Progress/Status Bar */}
                        <div className="grid grid-cols-4 gap-1 mt-1">
                          {[0, 1, 2, 3].map((seg) => (
                            <div
                              key={seg}
                              style={{
                                backgroundColor:
                                  seg < Math.min(4, Math.ceil(p.propertiesOwned.length / 2) + 1)
                                    ? p.color
                                    : 'rgba(51, 65, 85, 0.4)',
                                boxShadow:
                                  seg < Math.min(4, Math.ceil(p.propertiesOwned.length / 2) + 1)
                                    ? `0 0 6px ${p.color}`
                                    : 'none',
                              }}
                              className="h-1.5 rounded-full transition-all"
                            />
                          ))}
                        </div>

                        {/* Low Balance Warning Badge or Audit Raid Action */}
                        {p.hasUsedBribeBailout && (p.outstandingDebt || 0) > 0 && (
                          <div className="mt-1 flex items-center justify-between bg-amber-950/50 border border-amber-500/40 rounded-md px-1.5 py-0.5">
                            <span className="text-[8px] font-black text-amber-300 flex items-center gap-0.5">
                              ⚖️ Bailout Debt: ${(p.outstandingDebt || 0).toLocaleString()}
                            </span>
                            <span className="text-[7px] text-amber-400/80 uppercase font-mono">1-Time Used</span>
                          </div>
                        )}

                        {p.cash < 2500 ? (
                          <div className="mt-1.5 flex items-center justify-between bg-red-950/60 border border-red-500/50 rounded-lg px-2 py-0.5 animate-pulse">
                            <span className="text-[9px] font-black text-red-300 flex items-center gap-1">
                              ⚠️ Low Cash (&lt;$2,500)
                            </span>
                            {p.id === 0 && (
                              <button
                                onClick={() => setActiveModal('liquidation')}
                                className="text-[9px] font-bold text-amber-300 hover:text-amber-200 underline"
                              >
                                Recover
                              </button>
                            )}
                          </div>
                        ) : p.id !== 0 && !p.auditState?.underInvestigation ? (
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-[8px] font-mono text-gray-400">
                              Risk: <strong className={((p.riskIndex || 0) >= 50) ? 'text-red-400 font-bold' : 'text-gray-300'}>{p.riskIndex || 0}%</strong>
                            </span>
                            <button
                              onClick={() => {
                                launchCorporateAudit(
                                  0,
                                  p.id,
                                  setPlayers,
                                  (msg) => addChatMessage('System', '#ef4444', msg)
                                );
                              }}
                              disabled={currentPlayer.cash < AUDIT_CONFIG.AUDIT_COST}
                              className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded transition ${
                                currentPlayer.cash >= AUDIT_CONFIG.AUDIT_COST
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/40'
                                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
                              }`}
                              title={`Launch an official Tax Audit Raid for $${AUDIT_CONFIG.AUDIT_COST.toLocaleString()}`}
                            >
                              🚨 Raid ($15k)
                            </button>
                          </div>
                        ) : p.auditState?.underInvestigation ? (
                          <div className="mt-1 bg-red-950/80 border border-red-600/70 rounded px-1.5 py-0.5 flex items-center justify-between text-[8px] text-red-300 font-black animate-pulse">
                            <span>🚨 UNDER AUDIT RAID</span>
                            <span>{p.auditState.timer || 30}s</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {/* Eliminated Players Section */}
                {eliminatedPlayers.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                      Eliminated Tycoons ({eliminatedPlayers.length})
                    </span>
                    {eliminatedPlayers
                      .filter((ep, idx, arr) => arr.findIndex((p) => p.id === ep.id) === idx)
                      .map((ep, idx) => (
                        <div
                          key={`elim_${ep.id}_${idx}`}
                          className="p-1.5 rounded-xl bg-red-950/20 border border-red-900/40 opacity-60 flex items-center justify-between"
                        >
                        <div className="flex items-center gap-2">
                          <img src={ep.avatar} alt={ep.name} className="w-6 h-6 rounded-lg grayscale" />
                          <span className="text-xs text-gray-400 line-through">{ep.name}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/40 text-red-400 font-bold">
                          Bankrupt
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Game Chat Box */}
            <div className="bg-[#0b1022]/90 border border-[#1e293b] rounded-2xl p-3 shadow-xl flex flex-col h-[200px]">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
                <span className="text-sm">💬</span>
                <span className="text-xs font-black uppercase text-gray-300">Game Chat</span>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar text-xs">
                {chatMessages.map((msg, idx) => (
                  <div key={msg.id ? `${msg.id}_${idx}` : `chat_${idx}`} className="leading-tight">
                    <span className="font-bold mr-1.5" style={{ color: msg.color }}>
                      {msg.sender}:
                    </span>
                    <span className="text-gray-200">{msg.text}</span>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="mt-2 flex items-center gap-1.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-[#0f172a] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= CENTER COLUMN: AUTHENTIC 36-SPACE 10x10 BOARD ================= */}
        <div className={`flex flex-col items-center gap-3 order-1 lg:order-2 ${isBoardExpanded ? 'w-full' : 'lg:col-span-6'}`}>
          
          {/* Banner Toast Notification */}
          {bannerToast && (
            <div className="w-full bg-gradient-to-r from-sky-950/80 via-blue-950/80 to-indigo-950/80 border border-cyan-400/40 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0 animate-spin" />
                <div className="truncate">
                  <span className="text-xs font-black text-white mr-1.5">{bannerToast.title}</span>
                  <span className="text-[11px] text-gray-300 truncate hidden sm:inline">{bannerToast.desc}</span>
                </div>
              </div>
              <button
                onClick={() => setBannerToast(null)}
                className="text-gray-400 hover:text-white p-1 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* ================= 10x10 AUTHENTIC BOARD CONTAINER ================= */}
          <div className="relative w-full aspect-square max-w-[620px] bg-[#0c1630] border-4 border-[#bae6fd]/70 rounded-3xl p-1 sm:p-2 shadow-[0_0_50px_rgba(2,132,199,0.35)] flex flex-col justify-between overflow-hidden">
            
            {/* 10x10 CSS Grid */}
            <div className="grid grid-cols-10 grid-rows-10 gap-0.5 sm:gap-1 w-full h-full relative">
              
              {/* 36 Perimeter Tiles mapped to exact coordinates */}
              {spaces.map((space) => {
                const isTarget = targetSpaceId === space.id;
                return renderBoardTile(
                  space,
                  players,
                  isMovingPawn,
                  currentPlayer.id,
                  isTarget,
                  (sp) => {
                    if (sp.type === 'property' || sp.type === 'transit') {
                      const sectorKey = PROPERTY_SECTOR_MAP[sp.name] || (sp.type === 'transit' ? 'Aviation & Logistics' : 'Global Real Estate');
                      const owner = sp.ownerId !== undefined ? players.find((p) => p.id === sp.ownerId) : null;
                      setBannerToast({
                        title: `${sp.icon} ${sp.name} [${sectorKey}]`,
                        desc: `Price: $${sp.price.toLocaleString()} • Base Rent: $${sp.rent} • Owner: ${owner ? owner.name : 'Unowned (Roll dice to land & acquire)'}`,
                      });
                    } else if (sp.type === 'chance' || sp.specialType === 'chance') {
                      setBannerToast({
                        title: `🎲 ${sp.name}`,
                        desc: 'Draw a lucky Business Chance card (2-12 roll) when landing on this space after rolling the dice.',
                      });
                    } else if (sp.type === 'bank' || sp.specialType === 'bank') {
                      setBannerToast({
                        title: `🏦 ${sp.name}`,
                        desc: 'Access International Monetary Fund (IMF) liquidity/grant facilities when landing on this space after rolling the dice.',
                      });
                    } else {
                      setBannerToast({
                        title: `${sp.icon} ${sp.name}`,
                        desc: sp.description || `Special international board space (${sp.category})`,
                      });
                    }
                  }
                );
              })}

              {/* Center Artwork Spanning Rows 2-9, Columns 2-9 */}
              <div
                style={{
                  gridRow: '2 / 10',
                  gridColumn: '2 / 10',
                }}
                className="relative z-10 w-full h-full p-0.5 sm:p-1 overflow-hidden"
              >
                <InternationalBusinessCenter
                  isRolling={isRolling}
                  diceValue={diceValue}
                  secondDiceValue={secondDiceValue}
                  diceMode={diceMode}
                  onRoll={handleRollDice}
                  activePlayerColor={currentPlayer.color}
                />
              </div>
            </div>
          </div>

          {/* ================= DEDICATED VISUAL DICE ROLLER COMPONENT ================= */}
          <div className="w-full max-w-[620px]">
            <VisualDiceRoller
              diceValue={diceValue}
              secondDiceValue={secondDiceValue}
              diceMode={diceMode}
              onToggleDiceMode={() => setDiceMode((prev) => (prev === 'single' ? 'double' : 'single'))}
              isRolling={isRolling}
              isMovingPawn={isMovingPawn}
              onRoll={handleRollDice}
              allowedSteps={allowedSteps}
              targetSpaceName={prospectiveTargetSpace?.name}
              targetSpaceIcon={prospectiveTargetSpace?.icon}
              targetSpacePrice={prospectiveTargetSpace?.price}
              activePlayerName={currentPlayer.name}
              activePlayerColor={currentPlayer.color}
              activePlayerToken={currentPlayer.token}
              isAiTurn={currentPlayer.isAi}
              disabled={activeModal !== 'none'}
              hasExtraTurn={hasExtraTurn}
              isInJail={currentPlayer.inJail}
              isVisaCaptured={Boolean(currentPlayer.documents?.visaCaptured)}
              onOpenShop={() => setActiveModal('shop')}
              onSkipJailTurn={handleSkipJailTurn}
            />
          </div>
        </div>

        {/* ================= RIGHT COLUMN: MARKET TRENDS & ACTIONS (3 cols) ================= */}
        {!isBoardExpanded && (
          <div className="lg:col-span-3 flex flex-col gap-3.5 order-3">
            {/* LIVE GLOBAL MARKET REAL STOCK GRAPH (Recharts Interactive Feed) */}
            <GlobalMarketStockGraph
              compact={true}
              playerCash={players[0]?.cash || 0}
              onInvest={handleStockInvest}
              onExpand={() => setActiveModal('invest')}
            />

            {/* 4 PRIMARY ACTION BUTTONS: INVEST, TRADE, AUCTION, BUILD */}
            <div className="grid grid-cols-2 gap-2">
              {/* INVEST */}
              <button
                onClick={() => setActiveModal('invest')}
                className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs border border-emerald-400/40 shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <TrendingUp className="w-4 h-4" />
                <span>INVEST</span>
              </button>

              {/* TRADE */}
              <button
                onClick={() => setActiveModal('trade')}
                className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-xs border border-cyan-400/40 shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Repeat className="w-4 h-4" />
                <span>TRADE</span>
              </button>

              {/* AUCTION */}
              <button
                onClick={() => setActiveModal('auction')}
                className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-500 hover:to-yellow-500 text-white font-black text-xs border border-amber-400/40 shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Gavel className="w-4 h-4" />
                <span>AUCTION</span>
              </button>

              {/* BUILD */}
              <button
                onClick={() => setActiveModal('build')}
                className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black text-xs border border-purple-400/40 shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Building2 className="w-4 h-4" />
                <span>BUILD</span>
              </button>
            </div>

            {/* DAILY MISSION PROGRESS */}
            <div className="bg-[#0b1022]/90 border border-[#1e293b] rounded-2xl p-3 shadow-xl flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-gray-400 uppercase font-black block">
                    Daily Mission
                  </span>
                  <span className="text-xs font-bold text-white truncate block">
                    Own 3 Properties
                  </span>
                  {/* Progress Bar */}
                  <div className="w-24 sm:w-28 h-1.5 rounded-full bg-slate-800 mt-1 overflow-hidden">
                    <div
                      style={{ width: `${(missionProgress / 3) * 100}%` }}
                      className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-amber-400 font-mono">
                  {missionProgress}/3
                </span>
                <button
                  onClick={() => {
                    if (!missionClaimed && missionProgress >= 3) {
                      setMissionClaimed(true);
                      setPlayers((prev) =>
                        prev.map((p) => (p.id === 0 ? { ...p, cash: p.cash + 3000, netWorth: p.netWorth + 3000 } : p))
                      );
                      if (soundEnabled) soundFx.playCheck();
                    }
                  }}
                  disabled={missionClaimed || missionProgress < 3}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg mt-1 transition ${
                    missionClaimed
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : missionProgress >= 3
                      ? 'bg-amber-400 text-slate-950 font-black animate-bounce'
                      : 'bg-white/5 text-gray-400'
                  }`}
                >
                  {missionClaimed ? 'Claimed' : '🎁 Claim'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= BOTTOM NAVIGATION BAR ================= */}
      <div className="relative z-10 flex items-center justify-around bg-[#0b1022]/90 border border-[#1e293b] rounded-2xl p-2 shadow-xl mt-1">
        {[
          { id: 'profile', label: 'PROFILE', icon: <User className="w-4 h-4" /> },
          { id: 'trade', label: 'TRADE', icon: <Users className="w-4 h-4" /> },
          { id: 'shop', label: 'SHOP', icon: <ShoppingBag className="w-4 h-4 text-emerald-400" /> },
          { id: 'leaderboard', label: 'LEADERBOARD', icon: <Trophy className="w-4 h-4 text-amber-400" /> },
          { id: 'invest', label: 'INVEST', icon: <History className="w-4 h-4" /> },
          { id: 'build', label: 'BUILD', icon: <SettingsIcon className="w-4 h-4" /> },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => setActiveModal(item.id as any)}
            className={`flex flex-col items-center gap-1 px-2 sm:px-3 py-1 transition active:scale-90 ${
              activeModal === item.id ? 'text-amber-400 font-bold' : 'text-gray-400 hover:text-[#ffe89e]'
            }`}
          >
            {item.icon}
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* ================= MODALS & DIALOGS ================= */}

      {/* Dynamic Stock-Linked Property & Ways Title Deed Cards Modal */}
      {activeModal === 'buy_property' && pendingSpace && (
        <DynamicPropertyCard
          spaceName={pendingSpace.name}
          spaceType={pendingSpace.type}
          marketRates={marketRates}
          playerCash={currentPlayer.cash}
          currentHouses={pendingSpace.houses}
          owner={
            pendingSpace.ownerId !== undefined
              ? players.find((p) => p.id === pendingSpace.ownerId) || null
              : null
          }
          onBuy={(price) => {
            if (currentPlayer.cash >= price) {
              buyProperty(currentPlayer.id, pendingSpace.id);
              setActiveModal('none');
              setPendingSpace(null);
              nextTurn();
            } else {
              setBannerToast({
                title: '❌ Insufficient Funds',
                desc: 'You do not have enough cash to acquire this property.',
              });
            }
          }}
          onSkip={(mortgageValue) => {
            handleSkipProperty(mortgageValue);
          }}
          onStartAuction={() => {
            setActiveModal('auction');
          }}
          onBuildHouse={() => {
            const cityData = CITY_PROPERTY_CARDS[pendingSpace.name];
            const cost = cityData?.houseCost || 2000;
            if (currentPlayer.cash >= cost && pendingSpace.houses < 4) {
              setSpaces((prev) =>
                prev.map((s) =>
                  s.id === pendingSpace.id
                    ? { ...s, houses: s.houses + 1, rent: Math.round(s.rent * 1.5) }
                    : s
                )
              );
              setPlayers((prev) =>
                prev.map((p) =>
                  p.id === currentPlayer.id
                    ? { ...p, cash: p.cash - cost, netWorth: p.netWorth + Math.round(cost * 1.3) }
                    : p
                )
              );
              if (soundEnabled) soundFx.playCheck();
              setBannerToast({
                title: '🏠 Property Upgraded!',
                desc: `Built a house on ${pendingSpace.name}. Rent increased!`,
              });
              setActiveModal('none');
              setPendingSpace(null);
            }
          }}
          onMortgage={() => {
            const cityData = CITY_PROPERTY_CARDS[pendingSpace.name];
            const transitData = TRANSIT_WAYS_CARDS[pendingSpace.name];
            const mortgageValue = cityData?.mortgage || transitData?.mortgage || Math.round(pendingSpace.price * 0.5);

            setPlayers((prev) =>
              prev.map((p) =>
                p.id === currentPlayer.id
                  ? {
                      ...p,
                      cash: p.cash + mortgageValue,
                      propertiesOwned: p.propertiesOwned.filter((id) => id !== pendingSpace.id),
                    }
                  : p
              )
            );
            setSpaces((prev) =>
              prev.map((s) => (s.id === pendingSpace.id ? { ...s, ownerId: undefined } : s))
            );
            if (soundEnabled) soundFx.playCapture();
            setBannerToast({
              title: '🏦 Property Mortgaged',
              desc: `${pendingSpace.name} was mortgaged to the Bank for $${mortgageValue.toLocaleString()}.`,
            });
            setActiveModal('none');
            setPendingSpace(null);
          }}
        />
      )}

      {/* Chance & IMF Draw Modal */}
      {activeModal === 'chance_imf' && (
        <ChanceAndIMFModal
          spaceType={chanceModalSpaceType}
          playerName={currentPlayer.name}
          playerMoney={currentPlayer.cash}
          soundEnabled={soundEnabled}
          onSendToJail={() => sendPlayerToJail(currentPlayer.id)}
          onUpdateMoney={(newMoney) => {
            if (newMoney < currentPlayer.cash) {
              const diff = currentPlayer.cash - newMoney;
              handlePlayerDebtOrPayment(currentPlayer.id, 'bank', diff, `${chanceModalSpaceType} Penalty/Fee`);
            } else {
              setPlayers((prev) =>
                prev.map((p, idx) =>
                  idx === turnIndex
                    ? {
                        ...p,
                        cash: newMoney,
                        netWorth: p.netWorth + (newMoney - p.cash),
                      }
                    : p
                )
              );
            }
          }}
          onClose={() => {
            setActiveModal('none');
            nextTurn();
          }}
        />
      )}

      {/* Chance Card Modal */}
      {activeModal === 'chance' && activeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-[#0d142b] border-2 border-red-500 rounded-3xl p-5 shadow-[0_0_50px_rgba(239,68,68,0.4)] text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-red-600/20 border-2 border-red-500/60 flex items-center justify-center text-red-400 text-3xl font-black">
              ❓
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">
                CHANCE CARD
              </span>
              <h3 className="text-base font-black text-white mt-1">{activeCard.title}</h3>
              <p className="text-xs font-medium text-gray-200 mt-2 leading-relaxed bg-[#090f23] p-3 rounded-2xl border border-white/10">
                {activeCard.text}
              </p>
            </div>

            <button
              onClick={() => {
                setActiveModal('none');
                setActiveCard(null);
                nextTurn();
              }}
              className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-black text-xs transition shadow-lg mt-2 uppercase"
            >
              Collect & Continue
            </button>
          </div>
        </div>
      )}

      {/* Commonwealth Card Modal */}
      {activeModal === 'commonwealth' && activeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-[#0d142b] border-2 border-cyan-400 rounded-3xl p-5 shadow-[0_0_50px_rgba(0,240,255,0.4)] text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border-2 border-cyan-400/60 flex items-center justify-center text-cyan-300 text-3xl font-black">
              💎
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider">
                COMMON WEALTH
              </span>
              <h3 className="text-base font-black text-white mt-1">{activeCard.title}</h3>
              <p className="text-xs font-medium text-gray-200 mt-2 leading-relaxed bg-[#090f23] p-3 rounded-2xl border border-white/10">
                {activeCard.text}
              </p>
            </div>

            <button
              onClick={() => {
                setActiveModal('none');
                setActiveCard(null);
                nextTurn();
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition shadow-lg mt-2 uppercase"
            >
              Accept & Continue
            </button>
          </div>
        </div>
      )}

      {/* Invest Portfolio Modal - Unified Starting Wallet & Live Stock Exchange */}
      {activeModal === 'invest' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-4xl relative my-auto flex flex-col gap-3">
            {/* Modal Header Controls with Tabs */}
            <div className="flex items-center justify-between bg-slate-900/90 border border-slate-700/80 p-2.5 rounded-2xl">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInvestViewTab('dashboard')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    investViewTab === 'dashboard'
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <span>💼</span>
                  <span>Portfolio &amp; Live Market</span>
                </button>
                <button
                  onClick={() => setInvestViewTab('chart')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    investViewTab === 'chart'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Real-Time Charts</span>
                </button>
                <button
                  onClick={() => setInvestViewTab('heatmap')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    investViewTab === 'heatmap'
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <span>🔥</span>
                  <span>Market Heatmap</span>
                </button>
              </div>

              {/* Stock Market Crash Manager / Cycle Processor & Owner Control */}
              <div className="flex items-center gap-2">
                <MasterCrashControl
                  currentUser={currentUser}
                  onTriggerCrash={handleMasterTriggerCrash}
                  className="static"
                />

                <StockMarketManager
                  marketStocks={stocks}
                  setMarketStocks={setStocks}
                  isMarketCrashed={isMarketCrashed}
                  setIsMarketCrashed={setIsMarketCrashed}
                  turnsSinceLastCrash={turnsSinceLastCrash}
                  setTurnsSinceLastCrash={setTurnsSinceLastCrash}
                  onCrashTriggered={(msg) => {
                    if (soundEnabled) soundFx.playCapture();
                    setBannerToast({
                      title: `🚨 MARKET CRASH DETECTED!`,
                      desc: msg,
                    });
                    addChatMessage('System', '#ef4444', msg);
                  }}
                />

                {/* Close Button */}
                <button
                  onClick={() => setActiveModal('none')}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white flex items-center justify-center border border-white/20 transition cursor-pointer"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {investViewTab === 'dashboard' ? (
              <PlayerAndMarketDashboard
                player={{
                  name: players[0]?.name || 'Tycoon',
                  money: players[0]?.cash || 0,
                  cashDenominations: players[0]?.cashDenominations,
                  documents: players[0]?.documents,
                  stocks: players[0]?.stocks,
                  lowIncomeWarnings: players[0]?.lowIncomeWarnings,
                }}
                stocks={stocks}
                onBuyStock={(stockId, price, qty) => handleBuyStockShares(stockId, price, qty)}
                onSellStock={(stockId, price, qty) => handleSellStockShares(stockId, price, qty)}
                onCashOutProfit={(stockId, price) => handleCashOutStockProfit(stockId, price)}
                onRegainDocument={(docType, cost) => handleRegainPlayerDocument(docType, cost)}
                onTriggerBlackMoneyCheck={() => handleTriggerBlackMoneyCheck(players[0])}
                onClose={() => setActiveModal('none')}
              />
            ) : investViewTab === 'chart' ? (
              <GlobalMarketStockGraph
                compact={false}
                playerCash={players[0]?.cash || 0}
                chartTheme={chartTheme}
                isMarketCrashed={isMarketCrashed}
                onInvest={handleStockInvest}
                onCashOutProfit={handleSectorCashOutProfit}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <MarketHeatmap
                  stocks={stocks}
                  onSelectStock={(stock) => {
                    handleBuyStockShares(stock.id, stock.price, 1);
                  }}
                />
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">💡 Pro Tip:</span>
                    <span>Click any asset tile to quickly buy 1 share at the current live valuation.</span>
                  </div>
                  <button
                    onClick={() => setInvestViewTab('dashboard')}
                    className="text-purple-400 hover:text-purple-300 font-semibold underline text-xs cursor-pointer"
                  >
                    View My Portfolio →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Build / Upgrade Modal */}
      {activeModal === 'build' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#0d142b] border-2 border-purple-400 rounded-3xl p-5 shadow-[0_0_50px_rgba(168,85,247,0.4)] flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-black text-white uppercase">Build Skyscrapers</h3>
              </div>
              <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Upgrade owned properties with skyscrapers to multiply rent collections:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {spaces
                .filter((s) => s.ownerId === 0)
                .map((space) => (
                  <div key={space.id} className="p-2.5 rounded-xl bg-[#090f23] border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        {space.icon} {space.name}
                      </span>
                      <span className="text-[10px] text-amber-400">
                        Level: {space.houses}/3 • Rent: ${space.rent}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (players[0].cash >= 1500 && space.houses < 3) {
                          setSpaces((prev) =>
                            prev.map((s) => (s.id === space.id ? { ...s, houses: s.houses + 1, rent: Math.round(s.rent * 1.5) } : s))
                          );
                          setPlayers((prev) =>
                            prev.map((p) => (p.id === 0 ? { ...p, cash: p.cash - 1500, netWorth: p.netWorth + 2000 } : p))
                          );
                          if (soundEnabled) soundFx.playCheck();
                        }
                      }}
                      disabled={players[0].cash < 1500 || space.houses >= 3}
                      className={`px-3 py-1.5 rounded-lg font-black text-[11px] transition ${
                        space.houses >= 3
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-500 hover:bg-purple-400 text-white'
                      }`}
                    >
                      {space.houses >= 3 ? 'Max' : 'Upgrade $1,500'}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Trade Modal */}
      {activeModal === 'trade' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#0d142b] border-2 border-cyan-400 rounded-3xl p-5 shadow-[0_0_50px_rgba(0,240,255,0.4)] flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase">Corporate Trade &amp; Negotiation</h3>
              </div>
              <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Propose property acquisitions or asset swaps with other tycoons:
            </p>

            <div className="space-y-2">
              {players
                .filter((p) => p.id !== 0)
                .map((bot) => (
                  <div key={bot.id} className="p-2.5 rounded-xl bg-[#090f23] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={bot.avatar} alt={bot.name} className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <span className="text-xs font-bold text-white block">{bot.name}</span>
                        <span className="text-[10px] text-gray-400">{bot.propertiesOwned.length} Properties</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setBannerToast({
                          title: `🤝 Trade Offer Sent to ${bot.name}`,
                          desc: `${bot.name} is reviewing your acquisition terms.`,
                        });
                        setActiveModal('none');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] transition"
                    >
                      Offer Deal
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Auction Modal */}
      {activeModal === 'auction' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-[#0d142b] border-2 border-amber-400 rounded-3xl p-5 shadow-[0_0_50px_rgba(245,158,11,0.4)] text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-2xl">
              🔨
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                Live Tycoon Auction
              </span>
              <h3 className="text-lg font-black text-white mt-1">Satellite Orbital Relay</h3>
              <p className="text-xs text-gray-400 mt-1">
                Highest Bid: <span className="text-emerald-400 font-mono font-bold">$4,200</span>
              </p>
            </div>

            <div className="flex items-center gap-2 w-full mt-2">
              <button
                onClick={() => setActiveModal('none')}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-xs transition"
              >
                Pass
              </button>
              <button
                onClick={() => {
                  if (players[0].cash >= 4500) {
                    setPlayers((prev) =>
                      prev.map((p) => (p.id === 0 ? { ...p, cash: p.cash - 4500, netWorth: p.netWorth + 5000 } : p))
                    );
                    if (soundEnabled) soundFx.playCheck();
                    setBannerToast({
                      title: `🏆 Auction Won!`,
                      desc: `You placed the winning bid of $4,500 on the Satellite Relay.`,
                    });
                    setActiveModal('none');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition"
              >
                Bid $4,500
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {activeModal === 'leaderboard' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-[#0d142b] border-2 border-amber-400 rounded-3xl p-5 shadow-[0_0_50px_rgba(245,158,11,0.4)] flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white uppercase">International Leaderboard</h3>
              </div>
              <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {[...players]
                .sort((a, b) => b.netWorth - a.netWorth)
                .map((p, idx) => (
                  <div key={p.id} className="p-2 rounded-xl bg-[#090f23] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-400 w-4">{idx + 1}.</span>
                      <img src={p.avatar} alt={p.name} className="w-7 h-7 rounded-lg object-cover" />
                      <span className="text-xs font-bold text-white">{p.name}</span>
                    </div>
                    <span className="text-xs font-mono font-black text-[#ffe89e]">
                      ${p.netWorth.toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Bank Shop Modal */}
      {activeModal === 'shop' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl bg-[#0d142b] border-2 border-emerald-400 rounded-3xl p-5 shadow-[0_0_50px_rgba(16,185,129,0.4)] flex flex-col gap-3 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase">
                  🏦 Bank Shop &amp; Treasury
                </h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[#090f23] p-3 rounded-2xl border border-white/5 text-center shrink-0">
              <div>
                <span className="text-[10px] text-gray-400 uppercase block font-bold">Liquid Cash</span>
                <span className={`text-base font-mono font-black ${players[0].cash < 2500 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                  ${players[0].cash.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase block font-bold">Total Net Worth</span>
                <span className="text-base font-mono font-black text-[#ffe89e]">
                  ${players[0].netWorth.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-300 shrink-0">
              Purchase high-yield currency note denominations or renew/restore official international travel documents:
            </p>

            <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar max-h-[55vh]">
              {/* Travel Documents */}
              <div className="p-3 rounded-2xl bg-[#090f23] border border-cyan-500/30 space-y-2">
                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                  🛂 Official Travel Documents (Restore / Purchase)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {bankShopItems
                    .filter((item) => item.type === 'visa' || item.type === 'passport')
                    .map((item, idx) => {
                      const canAfford = players[0].cash >= item.cost;
                      const isVisa = item.type === 'visa';
                      const isCaptured = isVisa ? players[0].documents?.visaCaptured : players[0].documents?.passportCaptured;
                      return (
                        <div
                          key={`doc_shop_${idx}`}
                          className="p-3 rounded-xl bg-slate-900/90 border border-white/10 flex flex-col justify-between gap-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold text-white block">{item.label}</span>
                              <span className="text-[10px] text-cyan-400 font-semibold block">Official Travel Value: ${item.value.toLocaleString()}</span>
                            </div>
                            {isCaptured ? (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-600 text-white uppercase shrink-0 animate-pulse">
                                Captured
                              </span>
                            ) : (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-600/60 text-emerald-200 uppercase shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-xs text-amber-300 font-black">${item.cost.toLocaleString()}</span>
                            <button
                              onClick={() => handleBuyFromBankShop(item)}
                              disabled={!canAfford}
                              className={`px-3 py-1.5 rounded-lg font-black text-xs transition cursor-pointer ${
                                canAfford
                                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md active:scale-95'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
                              }`}
                            >
                              {isCaptured ? 'Restore / Buy' : 'Purchase'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Currency Denominations */}
              <div className="p-3 rounded-2xl bg-[#090f23] border border-amber-500/30 space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                  💵 Treasury Currency Note Denominations (High-Yield Exchange)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {bankShopItems
                    .filter((item) => item.type === 'currency')
                    .map((item, idx) => {
                      const canAfford = players[0].cash >= item.cost;
                      return (
                        <div
                          key={`curr_shop_${idx}`}
                          className="p-3 rounded-xl bg-slate-900/90 border border-white/10 flex flex-col justify-between gap-2"
                        >
                          <div>
                            <span className="text-xs font-bold text-white block">{item.label}</span>
                            <span className="text-[11px] text-emerald-400 font-black block">Yields: +${item.value.toLocaleString()} USD</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-xs text-amber-300 font-bold">Cost: ${item.cost.toLocaleString()}</span>
                            <button
                              onClick={() => handleBuyFromBankShop(item)}
                              disabled={!canAfford}
                              className={`px-3 py-1.5 rounded-lg font-black text-xs transition cursor-pointer ${
                                canAfford
                                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md active:scale-95'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
                              }`}
                            >
                              Exchange
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {activeModal === 'profile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-[#0d142b] border-2 border-blue-400 rounded-3xl p-5 shadow-[0_0_50px_rgba(59,130,246,0.4)] flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-black text-white uppercase">Player Profile</h3>
              </div>
              <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#090f23] rounded-2xl border border-white/5">
              <img src={players[0].avatar} alt={players[0].name} className="w-12 h-12 rounded-xl object-cover border-2 border-blue-400" />
              <div>
                <span className="text-sm font-bold text-white block">{players[0].name}</span>
                <span className="text-[10px] text-blue-400 font-semibold">International Tycoon</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded-xl bg-slate-900 border border-white/5">
                <span className="text-gray-400">Liquid Cash</span>
                <span className="font-bold text-emerald-400">${players[0].cash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-900 border border-white/5">
                <span className="text-gray-400">Net Worth</span>
                <span className="font-bold text-[#ffe89e]">${players[0].netWorth.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-900 border border-white/5">
                <span className="text-gray-400">Owned Properties</span>
                <span className="font-bold text-purple-400">{spaces.filter((s) => s.ownerId === 0).length}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-900 border border-white/5">
                <span className="text-gray-400">Visa Status</span>
                <span className={`font-bold ${players[0].documents?.visaCaptured ? 'text-red-400' : 'text-emerald-400'}`}>
                  {players[0].documents?.visaCaptured ? 'Captured' : 'Active'}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-900 border border-white/5">
                <span className="text-gray-400">Passport Status</span>
                <span className={`font-bold ${players[0].documents?.passportCaptured ? 'text-red-400' : 'text-emerald-400'}`}>
                  {players[0].documents?.passportCaptured ? 'Captured' : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Economic Recovery & Liquidation Modal */}
      {activeModal === 'liquidation' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl bg-[#0d142b] border-2 border-amber-400 rounded-3xl p-5 shadow-[0_0_50px_rgba(245,158,11,0.4)] flex flex-col gap-3 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white uppercase">
                  Emergency Liquidation &amp; Economic Recovery
                </h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-[#090f23] p-3 rounded-2xl border border-white/5 text-center shrink-0">
              <div>
                <span className="text-[10px] text-gray-400 uppercase block font-bold">Current Cash</span>
                <span className={`text-sm font-mono font-black ${players[0].cash < 2500 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                  ${players[0].cash.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase block font-bold">Safety Margin</span>
                <span className="text-sm font-mono font-black text-amber-300">
                  $2,500
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase block font-bold">Total Net Liquidity</span>
                <span className="text-sm font-mono font-black text-[#ffe89e]">
                  ${players[0].netWorth.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-300 shrink-0">
              Liquidate travel documents, surrender properties to the bank for mortgage payouts, or sell stock equity to stay above $2,500:
            </p>

            <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar max-h-[58vh]">
              {/* Section 0: Bank Shop (Currency Notes & Documents) */}
              <div className="p-3 rounded-2xl bg-[#090f23] border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                    🏦 Bank Shop (Currency Notes &amp; Official Documents)
                  </span>
                  <span className="text-[9px] text-gray-400">Direct Treasury Exchange</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {bankShopItems.map((item, idx) => {
                    const canAfford = players[0].cash >= item.cost;
                    const isDoc = item.type === 'visa' || item.type === 'passport';
                    const isDocCaptured = isDoc && (item.type === 'visa' ? players[0].documents?.visaCaptured : players[0].documents?.passportCaptured);
                    return (
                      <div
                        key={`bank_shop_item_${idx}`}
                        className="p-2.5 rounded-xl bg-slate-900/90 border border-white/10 flex flex-col justify-between gap-1.5"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <span className="text-xs font-bold text-white block leading-tight">
                              {item.label}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-semibold block">
                              {isDoc ? `Value: $${item.value.toLocaleString()}` : `Returns: +$${item.value.toLocaleString()}`}
                            </span>
                          </div>
                          {isDocCaptured && (
                            <span className="text-[8px] font-black px-1 py-0.5 rounded bg-rose-600 text-white uppercase shrink-0">
                              Captured
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/5">
                          <span className="text-[10px] text-gray-400 font-bold">
                            Cost: <span className="text-amber-300">${item.cost.toLocaleString()}</span>
                          </span>
                          <button
                            onClick={() => handleBuyFromBankShop(item)}
                            disabled={!canAfford}
                            className={`px-2.5 py-1 rounded-lg font-black text-[10px] transition cursor-pointer ${
                              canAfford
                                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md active:scale-95'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
                            }`}
                          >
                            Buy
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 1: Travel Documents Liquidation */}
              <div className="p-3 rounded-2xl bg-[#090f23] border border-cyan-500/20 space-y-2">
                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                  🛂 Travel Documents Liquidation (Redeem with Bank)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Visa */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    players[0].documents?.visaCaptured
                      ? 'bg-rose-950/40 border-rose-600/60'
                      : 'bg-slate-900/80 border-white/5'
                  }`}>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white block">VISA Document</span>
                        {players[0].documents?.visaCaptured && (
                          <span className="text-[9px] font-black px-1 rounded bg-rose-600 text-white uppercase">
                            Captured
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {players[0].documents?.visaCaptured
                          ? <span className="text-rose-400 font-semibold">Status: Confiscated (Black Money)</span>
                          : <>Owned: <span className="text-cyan-300 font-bold">{players[0].documents?.VISA || 0}</span> • Value: $10,000</>}
                      </span>
                    </div>
                    {players[0].documents?.visaCaptured ? (
                      <button
                        onClick={() => handleRegainPlayerDocument('visa', 10000)}
                        className="px-2.5 py-1.5 rounded-lg font-black text-xs transition cursor-pointer bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md active:scale-95"
                      >
                        Regain ($10,000)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSellTravelDocument('VISA')}
                        disabled={(players[0].documents?.VISA || 0) <= 0}
                        className={`px-2.5 py-1.5 rounded-lg font-black text-xs transition cursor-pointer ${
                          (players[0].documents?.VISA || 0) > 0
                            ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Sell +$10,000
                      </button>
                    )}
                  </div>

                  {/* Passport */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    players[0].documents?.passportCaptured
                      ? 'bg-rose-950/40 border-rose-600/60'
                      : 'bg-slate-900/80 border-white/5'
                  }`}>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white block">PASSPORT</span>
                        {players[0].documents?.passportCaptured && (
                          <span className="text-[9px] font-black px-1 rounded bg-rose-600 text-white uppercase">
                            Captured
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {players[0].documents?.passportCaptured
                          ? <span className="text-rose-400 font-semibold">Status: Confiscated (Black Money)</span>
                          : <>Owned: <span className="text-cyan-300 font-bold">{players[0].documents?.PASSPORT || 0}</span> • Value: $5,000</>}
                      </span>
                    </div>
                    {players[0].documents?.passportCaptured ? (
                      <button
                        onClick={() => handleRegainPlayerDocument('passport', 5000)}
                        className="px-2.5 py-1.5 rounded-lg font-black text-xs transition cursor-pointer bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md active:scale-95"
                      >
                        Regain ($5,000)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSellTravelDocument('PASSPORT')}
                        disabled={(players[0].documents?.PASSPORT || 0) <= 0}
                        className={`px-2.5 py-1.5 rounded-lg font-black text-xs transition cursor-pointer ${
                          (players[0].documents?.PASSPORT || 0) > 0
                            ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Sell +$5,000
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Stock Portfolio Equity Liquidation */}
              <div className="p-3 rounded-2xl bg-[#090f23] border border-purple-500/20 space-y-2">
                <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider flex items-center gap-1.5">
                  📈 Stock Portfolio Positions
                </span>
                {Object.keys(players[0].stocks || {}).length === 0 ? (
                  <div className="text-xs text-gray-500 italic p-1">
                    No active stock share positions held in portfolio.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {Object.entries(players[0].stocks || {}).map(([sId, holding]) => {
                      if (!holding || holding.shares <= 0) return null;
                      const liveStock = stocks.find((s) => s.id === sId);
                      const currentPrice = liveStock?.price || holding.avgBuyPrice;
                      const positionValue = holding.shares * currentPrice;
                      const costBasis = holding.shares * holding.avgBuyPrice;
                      const profit = positionValue - costBasis;

                      return (
                        <div
                          key={`stock_liq_${sId}`}
                          className="p-2 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between flex-wrap gap-2"
                        >
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {liveStock?.name || sId}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {holding.shares} shares @ ${currentPrice} = <span className="text-purple-300 font-bold">${positionValue.toLocaleString()}</span>
                              {profit > 0 && (
                                <span className="text-emerald-400 ml-1.5 font-bold">
                                  (+${profit.toLocaleString()} profit)
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {profit > 0 && (
                              <button
                                onClick={() => handleCashOutStockProfit(sId, currentPrice)}
                                className="px-2 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] transition cursor-pointer"
                              >
                                Cash Profit +${profit.toLocaleString()}
                              </button>
                            )}
                            <button
                              onClick={() => handleLiquidateAllStock(sId)}
                              className="px-2 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] transition cursor-pointer"
                            >
                              Sell All +${positionValue.toLocaleString()}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 3: Owned Properties Liquidation & Bank Mortgage */}
              <div className="p-3 rounded-2xl bg-[#090f23] border border-amber-500/20 space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center justify-between">
                  <span>🏰 Owned Properties &amp; Bank Mortgages ({spaces.filter((s) => s.ownerId === 0).length})</span>
                </span>
                {spaces.filter((s) => s.ownerId === 0).length === 0 ? (
                  <div className="text-xs text-gray-500 italic p-1">
                    No properties currently owned to mortgage or trade.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {spaces
                      .filter((s) => s.ownerId === 0)
                      .map((space) => {
                        const sectorKey = PROPERTY_SECTOR_MAP[space.name] || 'Global Real Estate';
                        const mult = marketRates[sectorKey] || 1.0;
                        const mortgageVal =
                          CITY_PROPERTY_CARDS[space.name]?.mortgage ||
                          TRANSIT_WAYS_CARDS[space.name]?.mortgage ||
                          Math.round((space.price || 2000) * 0.5);
                        const tradeVal = Math.round(space.price * 1.25 * mult);
                        const auctionVal = Math.round(space.price * 0.5 * mult);

                        return (
                          <div
                            key={`liq_${space.id}`}
                            className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between flex-wrap gap-2"
                          >
                            <div>
                              <span className="text-xs font-bold text-white flex items-center gap-1">
                                {space.icon} {space.name}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                Mortgage: <span className="text-emerald-400 font-bold">${mortgageVal.toLocaleString()}</span> • Trade: <span className="text-cyan-300 font-bold">${tradeVal.toLocaleString()}</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleMortgagePropertyToBank(space.id)}
                                className="px-2 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] transition cursor-pointer"
                                title="Surrender unbuilt property to bank for official Mortgage Value"
                              >
                                Bank Mortgage +${mortgageVal.toLocaleString()}
                              </button>
                              <button
                                onClick={() => {
                                  // Execute Trade
                                  setSpaces((prev) =>
                                    prev.map((s) => (s.id === space.id ? { ...s, ownerId: undefined, houses: 0 } : s))
                                  );
                                  setPlayers((prev) =>
                                    prev.map((p) =>
                                      p.id === 0
                                        ? {
                                            ...p,
                                            cash: p.cash + tradeVal,
                                            propertiesOwned: p.propertiesOwned.filter((id) => id !== space.id),
                                          }
                                        : p
                                    )
                                  );
                                  if (soundEnabled) soundFx.playCheck();
                                  setBannerToast({
                                    title: `🤝 Sold at Trade Value`,
                                    desc: `${space.name} traded to global market for $${tradeVal.toLocaleString()}.`,
                                  });
                                }}
                                className="px-2 py-1 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[10px] transition cursor-pointer"
                                title="Sell at Trade Value (125% * Market Rate)"
                              >
                                Trade +${tradeVal.toLocaleString()}
                              </button>
                              <button
                                onClick={() => {
                                  // Instant Auction Liquidation
                                  setSpaces((prev) =>
                                    prev.map((s) => (s.id === space.id ? { ...s, ownerId: undefined, houses: 0 } : s))
                                  );
                                  setPlayers((prev) =>
                                    prev.map((p) =>
                                      p.id === 0
                                        ? {
                                            ...p,
                                            cash: p.cash + auctionVal,
                                            propertiesOwned: p.propertiesOwned.filter((id) => id !== space.id),
                                          }
                                        : p
                                    )
                                  );
                                  if (soundEnabled) soundFx.playCapture();
                                  setBannerToast({
                                    title: `🔨 Auction Payout`,
                                    desc: `${space.name} liquidated in auction buyout for $${auctionVal.toLocaleString()}.`,
                                  });
                                }}
                                className="px-2 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] transition cursor-pointer"
                                title="Liquidate at Auction Price (50% * Market Rate)"
                              >
                                Auction +${auctionVal.toLocaleString()}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                )}
              </div>

              {/* Section 4: Claim Investing Dividends */}
              <div className="flex flex-col gap-2">
                <div className="p-3 rounded-2xl bg-[#090f23] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      📈 Harvest Dividend Yield
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      Collect yield gains from global investment positions
                    </span>
                  </div>
                  {(() => {
                    const userStocks = players[0]?.stocks || {};
                    const userShares = (players[0] as any)?.shares?.holdings || {};
                    const hasActiveStocks =
                      Object.values(userStocks).some((h: any) => (h?.shares || 0) > 0) ||
                      Object.values(userShares).some((count: any) => count > 0);

                    return (
                      <button
                        onClick={() => {
                          const dividend = Math.round(1500 * (marketRates['International Tech'] || 1.1));
                          setPlayers((prev) =>
                            prev.map((p) => (p.id === 0 ? { ...p, cash: p.cash + dividend, netWorth: p.netWorth + dividend } : p))
                          );
                          if (soundEnabled) soundFx.playCheck();
                          setBannerToast({
                            title: `📈 Dividend Collected: +$${dividend.toLocaleString()}`,
                            desc: 'Corporate portfolio dividend deposited to your treasury balance.',
                          });
                        }}
                        disabled={!hasActiveStocks}
                        className={`px-3 py-1.5 rounded-lg font-black text-xs transition flex items-center justify-center ${
                          hasActiveStocks
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-emerald-500/20 active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                        }`}
                      >
                        Claim Dividend
                      </button>
                    );
                  })()}
                </div>
                {(() => {
                  const userStocks = players[0]?.stocks || {};
                  const userShares = (players[0] as any)?.shares?.holdings || {};
                  const hasActiveStocks =
                    Object.values(userStocks).some((h: any) => (h?.shares || 0) > 0) ||
                    Object.values(userShares).some((count: any) => count > 0);

                  if (!hasActiveStocks) {
                    return (
                      <p className="text-[11px] text-amber-400/80 italic text-center">
                        Note: You must purchase stocks from the exchange market before you can harvest dividends.
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Federal Audit Raid Emergency Overlay (Siren pulses, HUD scanlines & glitch FX) */}
      {(() => {
        const auditedPlayer = players.find((p) => p.auditState?.underInvestigation);
        if (!auditedPlayer) return null;
        return <FederalAuditRaidOverlay targetPlayer={auditedPlayer} />;
      })()}

      {/* Corporate Audit Raid Defense Modal */}
      {(() => {
        const auditedHumanPlayer = players.find(
          (p) => !p.isAi && p.auditState?.underInvestigation
        );
        if (!auditedHumanPlayer || !auditedHumanPlayer.auditState) return null;

        return (
          <AuditDefenseModal
            player={auditedHumanPlayer}
            auditState={auditedHumanPlayer.auditState}
            onBribe={() => {
              resolveAuditOutcome(
                auditedHumanPlayer.id,
                true,
                false,
                setPlayers,
                undefined,
                eliminatePlayerFromGame,
                (msg) => addChatMessage('System', '#ef4444', msg),
                setEliminatedPlayers,
                setTurnIndex
              );
            }}
            onComplete={(won) => {
              resolveAuditOutcome(
                auditedHumanPlayer.id,
                false,
                won,
                setPlayers,
                undefined,
                eliminatePlayerFromGame,
                (msg) => addChatMessage('System', '#ef4444', msg),
                setEliminatedPlayers,
                setTurnIndex
              );
            }}
          />
        );
      })()}

      {/* Corporate Banking, Offshore Vaults & Industrial Espionage HQ Modal */}
      <EspionageAndBankingModal
        isOpen={activeModal === 'espionage_banking'}
        onClose={() => setActiveModal('none')}
        players={players}
        activePlayerId={players[turnIndex]?.id || 0}
        currentMarketPhase={currentMarketPhase}
        onTriggerMarketShift={() => {
          const newPhase = applyGlobalMarketPhase(
            setPlayers,
            setCurrentMarketPhase,
            (msg) => addChatMessage('Global Economy', '#38bdf8', msg)
          );
          if (soundEnabled) soundFx.playCash();
          setBannerToast({
            title: `🌐 ${newPhase.name}`,
            desc: newPhase.description,
          });
        }}
        setPlayers={setPlayers}
        onAddLogMessage={(msg) => addChatMessage('Espionage HQ', '#a855f7', msg)}
        onOpenCodebreaker={(targetName) => {
          setCodebreakerTargetName(targetName);
          setActiveModal('codebreaker');
        }}
      />

      {/* Safe Encryption Override Codebreaker Mini-Game Modal */}
      {activeModal === 'codebreaker' && (
        <CodebreakerMiniGame
          isOpen={true}
          targetPlayerName={codebreakerTargetName}
          onClose={() => setActiveModal('none')}
          onComplete={(victory) => {
            setActiveModal('none');
            if (victory) {
              setPlayers((prev) =>
                prev.map((p) =>
                  !p.isAi || p.id === 0
                    ? { ...p, riskIndex: Math.max(0, (p.riskIndex || 0) - 40) }
                    : p
                )
              );
              setBannerToast({
                title: '🔐 Decryption Successful!',
                desc: 'Audit records sanitized! IRS Risk Index dropped by 40%!',
              });
              addChatMessage(
                'Decryption Module',
                '#10b981',
                '🔐 SAFE OVERRIDE SUCCESS: Audit trail decrypted and sanitized.'
              );
            } else {
              setBannerToast({
                title: '❌ Decryption Failed',
                desc: 'Access denied. Audit logs remained exposed.',
              });
              addChatMessage(
                'Decryption Module',
                '#ef4444',
                '⚠️ SAFE OVERRIDE FAILED: Federal access lock remained in effect.'
              );
            }
          }}
        />
      )}

      {/* Bribe & Bailout Modal (When bankrupt player has not used bailout yet) */}
      {(() => {
        const bankruptPlayer = players.find((p) => p.isBankrupt && !p.isEliminated && !p.hasUsedBribeBailout && !p.isAi);
        if (!bankruptPlayer) return null;

        return (
          <BribeBailoutModal
            player={bankruptPlayer}
            onAcceptBribe={(id, cost) => {
              handleAcceptBribe(
                id,
                cost,
                setPlayers,
                (msg) => addChatMessage('System', '#eab308', msg),
                { playCashSound: () => soundEnabled && soundFx.playCash() }
              );
            }}
            onAcceptBankruptcy={(id) => {
              handleForfeitMatch(
                id,
                setPlayers,
                setEliminatedPlayers,
                setTurnIndex,
                (msg) => addChatMessage('System', '#ef4444', msg),
                eliminatePlayerFromGame
              );
            }}
          />
        );
      })()}

      {/* Game Over & Champion Victory Modal */}
      {(activeModal === 'game_over' || isGameOver) && winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fadeIn">
          <div className="w-full max-w-md bg-[#0d142b] border-2 border-amber-400 rounded-3xl p-6 shadow-[0_0_80px_rgba(245,158,11,0.6)] text-center flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 p-1 shadow-[0_0_30px_rgba(245,158,11,0.8)]">
                <img
                  src={winner.avatar}
                  alt={winner.name}
                  className="w-full h-full rounded-[22px] object-cover"
                />
              </div>
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-amber-400 border-2 border-slate-950 flex items-center justify-center text-slate-950 text-sm shadow-md animate-bounce">
                👑
              </div>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest block">
                TOURNAMENT CHAMPION
              </span>
              <h2 className="text-2xl font-black text-white mt-1">{winner.name} Wins!</h2>
              <p className="text-xs text-gray-300 mt-1 max-w-xs mx-auto">
                Last Tycoon standing! All competitors eliminated through international market bankruptcy.
              </p>
            </div>

            <div className="w-full grid grid-cols-2 gap-2 bg-[#090f23] p-3 rounded-2xl border border-white/5 text-left">
              <div>
                <span className="text-[10px] text-gray-400 uppercase block font-bold">Final Treasury</span>
                <span className="text-sm font-mono font-black text-emerald-400">
                  ${winner.cash.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase block font-bold">Total Net Worth</span>
                <span className="text-sm font-mono font-black text-[#ffe89e]">
                  ${winner.netWorth.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase block font-bold">Properties Owned</span>
                <span className="text-sm font-mono font-black text-cyan-300">
                  {winner.propertiesOwned.length} Assets
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase block font-bold">Eliminations</span>
                <span className="text-sm font-mono font-black text-rose-400">
                  {eliminatedPlayers.length} Tycoons
                </span>
              </div>
            </div>

            <button
              onClick={() => resetGame()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm transition shadow-xl uppercase tracking-wider active:scale-95"
            >
              Start New International Match
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper: Render individual authentic board perimeter space
function renderBoardTile(
  space: InternationalBoardSpace,
  players: BusinessPlayer[],
  isMovingPawn: boolean = false,
  currentTurnPlayerId: number = 0,
  isTargetSpace: boolean = false,
  onSpaceClick?: (space: InternationalBoardSpace) => void
) {
  if (!space) return null;

  // Find players currently on this space
  const playersHere = players.filter((p) => p.position === space.id);

  // Calculate Owner
  const owner = space.ownerId !== undefined ? players.find((p) => p.id === space.ownerId) : null;

  // Specific grid positioning
  const gridStyle: React.CSSProperties = {
    gridRowStart: space.gridPos.row,
    gridColumnStart: space.gridPos.col,
  };

  // Corner Tile Rendering
  if (space.type === 'corner') {
    return (
      <div
        key={space.id}
        style={gridStyle}
        onClick={() => onSpaceClick && onSpaceClick(space)}
        className={`relative rounded-xl border flex flex-col items-center justify-between p-1 select-none overflow-hidden transition-all duration-200 cursor-pointer ${
          space.specialType === 'start'
            ? 'bg-gradient-to-br from-red-600 via-rose-700 to-red-800 border-red-400 text-white shadow-lg'
            : space.specialType === 'jail'
            ? 'bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-950 border-zinc-500 text-gray-200'
            : space.specialType === 'beach'
            ? 'bg-gradient-to-br from-teal-700 via-cyan-800 to-slate-950 border-teal-400 text-white'
            : space.specialType === 'resort'
            ? 'bg-gradient-to-br from-emerald-800 via-green-800 to-slate-950 border-emerald-400 text-white'
            : 'bg-gradient-to-br from-green-800 via-emerald-900 to-slate-950 border-green-400 text-white'
        } ${isTargetSpace ? 'ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.8)] scale-105 z-20' : ''}`}
      >
        <span className="text-xs sm:text-base leading-none drop-shadow-md mt-0.5">
          {space.icon}
        </span>
        <span className="text-[7px] sm:text-[9px] font-black uppercase text-center tracking-tighter leading-tight drop-shadow">
          {space.name}
        </span>
        {space.description && (
          <span className="text-[5px] sm:text-[6px] text-amber-200 text-center leading-none hidden sm:block">
            {space.description}
          </span>
        )}

        {/* 3D Player Pawns On Space */}
        {playersHere.length > 0 && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center gap-0.5 flex-wrap p-0.5 z-20 pointer-events-none">
            {playersHere.map((p) => (
              <BusinessPawn
                key={p.id}
                colorHex={p.color}
                token={p.token}
                name={p.name}
                isMoving={isMovingPawn && p.id === currentTurnPlayerId}
                isCurrentTurn={p.id === currentTurnPlayerId}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Chance or Commonwealth Card Tile
  if (space.type === 'chance') {
    const isChance = space.specialType === 'chance' || space.type === 'chance';
    return (
      <div
        key={space.id}
        style={gridStyle}
        onClick={() => onSpaceClick && onSpaceClick(space)}
        className={`relative rounded-xl border transition-all duration-200 flex flex-col items-center justify-between p-0.5 sm:p-1 select-none overflow-hidden cursor-pointer ${
          isChance
            ? 'bg-gradient-to-b from-white via-red-50 to-red-100 border-red-400 text-red-600 shadow-md'
            : 'bg-gradient-to-b from-white via-cyan-50 to-blue-100 border-cyan-400 text-blue-600 shadow-md'
        } ${isTargetSpace ? 'ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.8)] scale-105 z-20' : ''}`}
      >
        <span className={`text-base sm:text-xl font-black leading-none ${isChance ? 'text-red-600' : 'text-blue-600'}`}>
          {isChance ? '?' : '💎'}
        </span>
        <span className={`text-[6px] sm:text-[7px] font-black uppercase text-center tracking-tighter truncate w-full ${isChance ? 'text-red-700' : 'text-blue-800'}`}>
          {space.name}
        </span>

        {/* 3D Player Pawns On Space */}
        {playersHere.length > 0 && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center gap-0.5 flex-wrap p-0.5 z-20 pointer-events-none">
            {playersHere.map((p) => (
              <BusinessPawn
                key={p.id}
                colorHex={p.color}
                token={p.token}
                name={p.name}
                isMoving={isMovingPawn && p.id === currentTurnPlayerId}
                isCurrentTurn={p.id === currentTurnPlayerId}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Property / Transit / Tax / Bank Tile
  return (
    <div
      key={space.id}
      style={{
        ...gridStyle,
        borderColor: owner ? owner.color : isTargetSpace ? '#f59e0b' : 'rgba(255,255,255,0.15)',
      }}
      onClick={() => onSpaceClick && onSpaceClick(space)}
      className={`relative rounded-xl border transition-all duration-200 flex flex-col justify-between p-0.5 select-none overflow-hidden bg-[#0c1630] cursor-pointer ${
        isTargetSpace ? 'ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.8)] scale-105 z-20' : 'hover:border-cyan-400/60'
      }`}
    >
      {/* Top Banner Color Strip */}
      <div className={`w-full h-1.5 sm:h-2 rounded-t-lg bg-gradient-to-r ${space.bannerColor || space.color || 'from-blue-600 to-indigo-600'} shrink-0`} />

      {/* Center Tile Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-0.5 min-h-0">
        <span className="text-[10px] sm:text-xs leading-none">{space.icon}</span>
        <span className="text-[6px] sm:text-[8px] font-black uppercase text-gray-100 truncate w-full tracking-tighter mt-0.5">
          {space.name}
        </span>
        {space.price > 0 && (
          <div className="w-full flex items-center justify-center">
            {space.isOwned || space.ownerId !== undefined ? (
              <span className="w-full text-center bg-rose-950/90 text-rose-300 text-[5.5px] sm:text-[7px] py-0.5 border border-rose-800/80 rounded font-black tracking-tight leading-none uppercase">
                HOUSEFULL
              </span>
            ) : (
              <span className="text-[6px] sm:text-[7px] font-mono font-bold text-[#ffe89e]">
                {space.type === 'tax' ? `Pay $${space.price}` : `$${space.price}`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Owner Badge */}
      {owner && (
        <div
          style={{ backgroundColor: owner.color }}
          className="w-full h-1 rounded-b-md shrink-0 shadow-sm"
          title={`Owned by ${owner.name}`}
        />
      )}

      {/* Renders House with Player Color ONLY if player selected and bought property */}
      {(space.hasHouse || space.houses > 0) && (
        <div className="absolute top-1 right-1 flex items-center gap-0.5 z-10">
          <div
            style={{
              backgroundColor: space.ownerColor || owner?.color || '#3b82f6',
              borderColor: 'rgba(0, 0, 0, 0.4)',
            }}
            className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-sm border shadow-md transform rotate-45 flex items-center justify-center"
            title={`House built by ${space.ownerColor || owner?.name || 'Owner'}`}
          />
          {space.houses > 1 && (
            <span className="text-[6px] font-black text-amber-300 drop-shadow">
              +{space.houses}
            </span>
          )}
        </div>
      )}

      {/* 3D Player Pawns On Space */}
      {playersHere.length > 0 && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center gap-0.5 flex-wrap p-0.5 z-20 pointer-events-none">
          {playersHere.map((p) => (
            <BusinessPawn
              key={p.id}
              colorHex={p.color}
              token={p.token}
              name={p.name}
              isMoving={isMovingPawn && p.id === currentTurnPlayerId}
              isCurrentTurn={p.id === currentTurnPlayerId}
              size="sm"
            />
          ))}
        </div>
      )}
    </div>
  );
}
