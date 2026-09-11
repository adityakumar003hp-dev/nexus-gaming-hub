import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess, Square } from 'chess.js';
import {
  GameSettings,
  GameResult,
  MoveRecord,
  GameMode,
  UserSession,
  ChatMessage,
  MatchRecord,
  ActiveBoardGame,
  LobbyUser,
  AIDifficulty,
} from './types';
import { ChessBoard } from './components/ChessBoard';
import { ChessClock } from './components/ChessClock';
import { MoveHistory } from './components/MoveHistory';
import { CapturedPieces } from './components/CapturedPieces';
import { PromotionModal } from './components/PromotionModal';
import { GameOverModal } from './components/GameOverModal';
import { GameHeader } from './components/GameHeader';
import { GameSettingsModal } from './components/GameSettingsModal';
import { AuthModal } from './components/AuthModal';
import { StatsModal } from './components/StatsModal';
import { ChatPanel } from './components/ChatPanel';
import { MatchmakingModal } from './components/MatchmakingModal';
import { AskGeminiModal } from './components/AskGeminiModal';
import { EvalBar } from './components/EvalBar';
import { PuzzleModal } from './components/PuzzleModal';
import { PositionEditorModal } from './components/PositionEditorModal';
import { CustomChessVariantSandboxModal } from './components/CustomChessVariantSandboxModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { UserProfileModal } from './components/UserProfileModal';
import { SEOHead } from './components/SEOHead';
import { SEOFooter } from './components/SEOFooter';
import { MultiGameHubModal } from './components/MultiGameHubModal';
import { WheelOfLuckMainCatalog, GameCatalogItem } from './components/WheelOfLuckMainCatalog';
import { WheelOfLuckGameLobbyModal, LobbyParticipant } from './components/WheelOfLuckGameLobbyModal';
import { CheckersBoard } from './components/CheckersBoard';
import { BackgammonBoard } from './components/BackgammonBoard';
import { SnakesAndLaddersBoard } from './components/SnakesAndLaddersBoard';
import { LudoBoard } from './components/LudoBoard';
import { GomokuBoard } from './components/GomokuBoard';
import { ReversiBoard } from './components/ReversiBoard';
import { ConnectFourBoard } from './components/ConnectFourBoard';
import { UltimateTicTacToeBoard } from './components/UltimateTicTacToeBoard';
import { DotsAndBoxesBoard } from './components/DotsAndBoxesBoard';
import { BattleshipBoard } from './components/BattleshipBoard';
import { SimBoard } from './components/SimBoard';
import { UnoBoard } from './components/UnoBoard';
import { HeartsBoard } from './components/HeartsBoard';
import { GinRummyBoard } from './components/GinRummyBoard';
import { SpeedBoard } from './components/SpeedBoard';
import { CarromBoard } from './components/CarromBoard';
import { DartsBoard } from './components/DartsBoard';
import { PingPongBoard } from './components/PingPongBoard';
import { BusinessBoard } from './components/BusinessBoard';
import { ArcadeCanvasModal } from './components/ArcadeCanvasModal';
import { GameBarSelector } from './components/GameBarSelector';
import { GameOptionsControlPanel } from './components/GameOptionsControlPanel';
import { GameRulesModal } from './components/GameRulesModal';
import { AnimationLibraryModal } from './components/AnimationLibraryModal';
import { AnimationEffectsMasterHubModal } from './components/AnimationEffectsMasterHubModal';
import { DailyWheelModal } from './components/DailyWheelModal';
import { CoinHistoryModal } from './components/CoinHistoryModal';
import { CurrencyExchangeModal } from './components/CurrencyExchangeModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { EmergencyLockdownOverlay } from './components/EmergencyLockdownOverlay';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth, subscribeToActiveGame, type ActiveGamePlatformState } from './lib/firebase';
import { initDelegatedGameSelector, setActiveGame, resolveGameMetadata } from './lib/gameDispatcher';
import { OwnerVerificationModal } from './components/OwnerVerificationModal';
import { executeFirstMoveWithFee } from './lib/entryFeeEngine';
import { PlayerStatusCardDeck } from './components/PlayerStatusCardDeck';
import { PrivacyTermsModal } from './components/PrivacyTermsModal';
import { CommunitySocialModal } from './components/CommunitySocialModal';
import { TournamentModal } from './components/TournamentModal';
import { CoachPanel } from './components/CoachPanel';
import { AIDifficultySelector } from './components/AIDifficultySelector';
import { QuestPanel } from './components/QuestPanel';
import { CustomizationModal } from './components/CustomizationModal';
import { VoiceProximityPanel } from './components/VoiceProximityPanel';
import { GlobalUserListSidebar } from './components/telemetry/GlobalUserListSidebar';
import { GlobalAnalyticsDashboardModal } from './components/telemetry/GlobalAnalyticsDashboardModal';
import { GoogleConnectModal } from './components/GoogleConnectModal';
import { GoogleFormsModal } from './components/GoogleFormsModal';
import { FloatingSuiteAndTelemetryMenu } from './components/FloatingSuiteAndTelemetryMenu';
import { AIElementBot } from './components/AIElementBot';
import { CosmeticsShopModal } from './components/CosmeticsShopModal';
import { DailyStreakModal } from './components/DailyStreakModal';
import { FriendsModal } from './components/FriendsModal';
import { RankedLadderModal } from './components/RankedLadderModal';
import { InGameReactionsBar } from './components/InGameReactionsBar';

import { OwnerHeroCard } from './components/OwnerHeroCard';
import { ChooseModePanel } from './components/ChooseModePanel';
import { MatchSettingsWheelPanel } from './components/MatchSettingsWheelPanel';
import { LiveMatchesAndStatsSection } from './components/LiveMatchesAndStatsSection';
import { QuestsAndTournamentBanner } from './components/QuestsAndTournamentBanner';
import { DuoChessPromoBanner } from './components/DuoChessPromoBanner';
import { GameEntryFeeModal } from './components/GameEntryFeeModal';
import { GameEntryModal } from './components/GameEntryModal';
import { GlobalChatDrawer } from './components/GlobalChatDrawer';
import { ReferAndEarnModal } from './components/ReferAndEarnModal';
import { LeaderboardAndRecentMatches } from './components/LeaderboardAndRecentMatches';
import { AboutUsSection } from './components/AboutUsSection';
import { EmergencySystem } from './lib/emergencySystem';
import { ExploreGamesGrid } from './components/ExploreGamesGrid';

import { telemetryEngine } from './utils/telemetryEngine';
import { GameEconomy, initGlobalGameEntryListeners } from './utils/gameEconomy';
import { evaluateBoard } from './utils/evalEngine';
import { detectOpening } from './utils/openingBook';
import { recordPlayerCaptureForHatrick, updateQuestProgress, applyMatchLossPenalty, getUserPoints, getUserGems } from './utils/pointsManager';

import { RotateCcw, BookOpen, Wand2, ShieldAlert, Flame, Sliders, History, Sparkles, Gamepad2, Lock, ArrowRight } from 'lucide-react';
import { layoutToFen } from './utils/variantManager';
import { soundFx } from './utils/audio';
import {
  fetchGuestAuth,
  fetchCurrentUser,
  clearStoredToken,
  recordGameResult,
  trackGameOpened,
  syncGameTime,
  hasAgreedPrivacyPolicy,
  agreePrivacyPolicy,
  getDefaultGuestHandle,
  formatGuestUsername,
} from './utils/auth';
import { recordTwentyGameResult } from './utils/statsEngine';
import { socketService } from './utils/socket';
import { getAIMove } from './utils/aiEngine';

const defaultSettings: GameSettings = {
  boardTheme: 'emerald',
  pieceTheme: 'classic',
  autoFlipBoard: false,
  showLegalMoves: true,
  showLastMove: true,
  soundEnabled: true,
  timeControl: {
    preset: '10+0',
    initialSeconds: 600,
    incrementSeconds: 0,
  },
  whitePlayer: {
    name: 'Player 1',
    avatar: '♔',
  },
  blackPlayer: {
    name: 'Player 2',
    avatar: '♚',
  },
  aiDifficulty: 'medium',
};

export function getGameDisplayTitle(game: ActiveBoardGame): string {
  switch (game) {
    case 'chess':
      return 'Duo Chess Arena';
    case 'checkers':
      return 'Checkers & Draughts Arena';
    case 'backgammon':
      return 'Backgammon Royale';
    case 'snakes':
      return 'Snakes & Ladders Arena';
    case 'ludo':
      return 'Ludo Royale Arena';
    case 'gomoku':
      return 'Gomoku 5-in-a-Row Arena';
    case 'reversi':
      return 'Reversi Othello Arena';
    case 'connect4':
      return 'Connect Four Arena';
    case 'ultimatetictactoe':
      return 'Ultimate Tic-Tac-Toe Arena';
    case 'dotsandboxes':
      return 'Dots & Boxes Arena';
    case 'battleship':
      return 'Battleship Naval Warfare Arena';
    case 'sim':
      return 'Sim Pencil Game Arena';
    case 'uno':
      return 'Uno Color Cards Arena';
    case 'hearts':
      return 'Hearts Royale Arena';
    case 'ginrummy':
      return 'Gin Rummy Arena';
    case 'speed':
      return 'Speed Cards Arena';
    case 'carrom':
      return 'Carrom Striker Arena';
    case 'darts':
      return 'Darts 3D Bullseye Arena';
    case 'pingpong':
      return 'Table Tennis Ping Pong Arena';
    case 'business':
      return 'International Business Arena';
    default:
      return `${String(game).toUpperCase()} Arena`;
  }
}

export default function App() {
  // Main Chess Engine Instance
  const chessRef = useRef<Chess>(new Chess());
  const [fen, setFen] = useState<string>(chessRef.current.fen());
  const [pgn, setPgn] = useState<string>('');

  // Authentication & User Session
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Game Mode State: 'pvp' | 'ai' | 'local'
  const [gameMode, setGameMode] = useState<GameMode>('pvp');
  // Selected Board Game: ActiveBoardGame
  const [activeBoardGame, setActiveBoardGame] = useState<ActiveBoardGame>('chess');

  // Real-Time PvP Room State
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [myPvPColor, setMyPvPColor] = useState<'w' | 'b' | 'spectator'>('w');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [roomNotice, setRoomNotice] = useState<string>('');
  const [roomRules, setRoomRules] = useState<{ minimumRating: number; allowChat: boolean; maxPlayers: number } | null>(null);

  // Matchmaking & Modals State
  const [isMatchmakingOpen, setIsMatchmakingOpen] = useState<boolean>(false);
  const [matchmakingStatus, setMatchmakingStatus] = useState<'idle' | 'waiting' | 'error'>('idle');
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [matchmakingError, setMatchmakingError] = useState<string>('');
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isWheelCatalogOpen, setIsWheelCatalogOpen] = useState<boolean>(false);
  const [selectedWheelGame, setSelectedWheelGame] = useState<GameCatalogItem | null>(null);
  const [isWheelGameLobbyOpen, setIsWheelGameLobbyOpen] = useState<boolean>(false);
  const [lobbyUsers, setLobbyUsers] = useState<LobbyUser[]>([]);
  const [isAskGeminiOpen, setIsAskGeminiOpen] = useState<boolean>(false);
  const [isPuzzleOpen, setIsPuzzleOpen] = useState<boolean>(false);
  const [isPositionEditorOpen, setIsPositionEditorOpen] = useState<boolean>(false);
  const [isCustomSandboxOpen, setIsCustomSandboxOpen] = useState<boolean>(false);
  const [activeCustomVariant, setActiveCustomVariant] = useState<{
    name: string;
    boardSize: number;
    timeLimit: number;
    layout: Record<string, string>;
    theme?: any;
    fen?: string;
  } | null>(null);
  const [isGameHubOpen, setIsGameHubOpen] = useState<boolean>(false);
  const [isSocialHubOpen, setIsSocialHubOpen] = useState<boolean>(false);
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState<boolean>(false);
  const [isReferModalOpen, setIsReferModalOpen] = useState<boolean>(false);
  const [isTournamentOpen, setIsTournamentOpen] = useState<boolean>(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState<boolean>(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState<boolean>(false);
  const [isSpectator, setIsSpectator] = useState<boolean>(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isAnimationLibraryOpen, setIsAnimationLibraryOpen] = useState<boolean>(false);
  const [isMasterHubOpen, setIsMasterHubOpen] = useState<boolean>(false);
  const [isDailyWheelOpen, setIsDailyWheelOpen] = useState<boolean>(false);
  const [isCoinHistoryModalOpen, setIsCoinHistoryModalOpen] = useState<boolean>(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState<boolean>(false);
  const [isCosmeticsShopOpen, setIsCosmeticsShopOpen] = useState<boolean>(false);
  const [isDailyStreakOpen, setIsDailyStreakOpen] = useState<boolean>(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState<boolean>(false);
  const [isRankedLadderOpen, setIsRankedLadderOpen] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [isOwnerVerifyOpen, setIsOwnerVerifyOpen] = useState<boolean>(false);
  const [exchangeDirection, setExchangeDirection] = useState<'gemToCoin' | 'coinToGem'>('gemToCoin');
  const [hatrickNotification, setHatrickNotification] = useState<{ show: boolean; reward: number; streak: number } | null>(null);

  // Emergency Mode Lockdown State (Firestore system/governance & platform_state/lockdown)
  const [emergencyLockdown, setEmergencyLockdown] = useState<{
    active: boolean;
    reason: string;
    initiatedBy: string;
    unlockAt: Date | null;
    durationMinutes: number;
  } | null>(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('emergency_shutdown_active') === 'true') {
        return {
          active: true,
          reason: 'Admin Initiated Maintenance & Security Shutdown',
          initiatedBy: 'Owner Authorization',
          unlockAt: null,
          durationMinutes: 60,
        };
      }
    } catch (e) {}
    return null;
  });
  // Platform Active Game State (Firestore platform_state/active_game)
  const [platformActiveGame, setPlatformActiveGame] = useState<ActiveGamePlatformState | null>(null);
  const [activeGameBannerNotice, setActiveGameBannerNotice] = useState<string | null>(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [isCompulsoryPrivacy, setIsCompulsoryPrivacy] = useState<boolean>(false);
  const [privacyModalTab, setPrivacyModalTab] = useState<'privacy' | 'terms' | 'appflow'>('privacy');
  const [isTelemetryOpen, setIsTelemetryOpen] = useState<boolean>(false);
  const [telemetryInitialTab, setTelemetryInitialTab] = useState<'charts' | 'spectator' | 'network' | 'rivalry' | 'alerts' | 'roster' | 'regional' | 'badges'>('charts');
  const [isGoogleAuthOpen, setIsGoogleAuthOpen] = useState<boolean>(false);
  const [googleInitialTab, setGoogleInitialTab] = useState<'profile' | 'cloud' | 'controller' | 'achievements' | 'setup'>('profile');
  const [isGoogleFormsOpen, setIsGoogleFormsOpen] = useState<boolean>(false);
  const [isArcadeCanvasOpen, setIsArcadeCanvasOpen] = useState<boolean>(false);
  const [isEntryFeeModalOpen, setIsEntryFeeModalOpen] = useState<boolean>(false);
  const [hasPaidGameFee, setHasPaidGameFee] = useState<boolean>(false);
  const hasPaidGameFeeRef = useRef<boolean>(false);
  const [pendingGameStartAction, setPendingGameStartAction] = useState<(() => void) | null>(null);
  const [economyVersion, setEconomyVersion] = useState<number>(0);

  // Sync with Admin Panel game fee changes & currency adjustments immediately
  useEffect(() => {
    const handleEconomyUpdate = () => {
      setEconomyVersion((v) => v + 1);
    };
    window.addEventListener('admin_fee_updated', handleEconomyUpdate);
    window.addEventListener('admin_economy_updated', handleEconomyUpdate);
    window.addEventListener('global_config_updated', handleEconomyUpdate);
    window.addEventListener('chess_points_updated', handleEconomyUpdate);
    window.addEventListener('chess_gems_updated', handleEconomyUpdate);
    window.addEventListener('storage', handleEconomyUpdate);
    return () => {
      window.removeEventListener('admin_fee_updated', handleEconomyUpdate);
      window.removeEventListener('admin_economy_updated', handleEconomyUpdate);
      window.removeEventListener('global_config_updated', handleEconomyUpdate);
      window.removeEventListener('chess_points_updated', handleEconomyUpdate);
      window.removeEventListener('chess_gems_updated', handleEconomyUpdate);
      window.removeEventListener('storage', handleEconomyUpdate);
    };
  }, []);

  // Settings & Configuration
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Board View State
  const [orientation, setOrientation] = useState<'w' | 'b'>('w');
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  // Move History & Review Mode
  const [moveRecords, setMoveRecords] = useState<MoveRecord[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);

  // Game Status
  const [isGameActive, setIsGameActive] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<GameResult>({ winner: null, reason: null });

  // Pawn Promotion Modal
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(
    null
  );
  const [compromiseAlert, setCompromiseAlert] = useState<string | null>(null);

  // Clocks State (in seconds)
  const [whiteTime, setWhiteTime] = useState<number>(settings.timeControl.initialSeconds);
  const [blackTime, setBlackTime] = useState<number>(settings.timeControl.initialSeconds);

  const matchStartTimeRef = useRef<number>(Date.now());

  const isUntimed = settings.timeControl.preset === 'untimed';
  const activeTurn = chessRef.current.turn();

  // 1. Initial Guest Auth & Socket Setup
  useEffect(() => {
    async function initAuth() {
      try {
        let user = await fetchCurrentUser();
        if (!user) {
          user = await fetchGuestAuth();
        }
        if (user) {
          if (user.isGuest && user.username) {
            user.username = formatGuestUsername(user.username);
          }
          setCurrentUser(user);
        }

        // Connect socket
        const socket = socketService.connect();
        if (user?.token) {
          socketService.authenticate(user.token);
        }

        // Check compulsory privacy & terms agreement
        const agreed = hasAgreedPrivacyPolicy();
        if (!agreed) {
          setIsCompulsoryPrivacy(true);
          setIsPrivacyModalOpen(true);
        } else {
          trackGameOpened(activeBoardGame);
        }
      } catch (err) {
        console.error('Failed to initialize user session:', err);
      } finally {
        // Smoothly hide preloader overlay once app is ready (3.0s animation)
        if (typeof window !== 'undefined' && window.hideChessProPreloader) {
          window.hideChessProPreloader();
        }
        // Step 1: Open Login Screen immediately after splash animation completes (if privacy already agreed)
        setTimeout(() => {
          if (hasAgreedPrivacyPolicy()) {
            setIsAuthModalOpen(true);
          }
        }, 5200);
      }
    }
    initAuth();

    const handleCompromiseAlert = (e: any) => {
      const msg =
        e.detail?.message ||
        'Security Anomaly Prevented: Token reuse attempt detected. All active session tokens across all devices were globally revoked.';
      setCompromiseAlert(msg);
      setCurrentUser(null);
      setIsAuthModalOpen(true);
    };

    window.addEventListener('token_compromised_alert', handleCompromiseAlert);

    const handleHatrickAchieved = (e: any) => {
      const { reward, streak } = e.detail || { reward: 2000, streak: 3 };
      setHatrickNotification({ show: true, reward, streak });
      soundFx.playGameOver(true);
      setTimeout(() => {
        setHatrickNotification(null);
      }, 6000);
    };

    window.addEventListener('chess_hatrick_achieved', handleHatrickAchieved);

    const handlePointsUpdated = (e: any) => {
      const pts = e.detail?.points ?? getUserPoints();
      setCurrentUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          gamerPoints: pts,
          stats: prev.stats
            ? {
                ...prev.stats,
                points: pts,
              }
            : undefined,
        };
      });
    };

    window.addEventListener('chess_points_updated', handlePointsUpdated);

    (window as any).openMatchmakingModal = () => setIsMatchmakingOpen(true);

    return () => {
      delete (window as any).openMatchmakingModal;
      window.removeEventListener('token_compromised_alert', handleCompromiseAlert);
      window.removeEventListener('chess_hatrick_achieved', handleHatrickAchieved);
      window.removeEventListener('chess_points_updated', handlePointsUpdated);
    };
  }, []);

  // Initialize universal game entry economy listeners
  useEffect(() => {
    initGlobalGameEntryListeners();
    const timer = setTimeout(initGlobalGameEntryListeners, 600);
    return () => clearTimeout(timer);
  }, [activeBoardGame]);

  // Section 3: App Frontend Auto-Unlock Verification & Snapshot Listener
  useEffect(() => {
    // Expose activateFrontendLockdown conforming to spec
    (window as any).activateFrontendLockdown = (reason: string, unlockTime: any) => {
      sessionStorage.clear();
      setEmergencyLockdown({
        active: true,
        reason: reason || 'Admin Initiated Maintenance & Security Shutdown',
        initiatedBy: 'ADITYA-OWNER',
        unlockAt: unlockTime ? new Date(unlockTime) : null,
        durationMinutes: 60,
      });
    };

    let latestGovernance: { active: boolean; reason: string; initiatedBy: string; unlockAt: Date | null; durationMinutes: number } | null = null;
    let latestPlatform: { active: boolean; reason: string; initiatedBy: string; unlockAt: Date | null; durationMinutes: number } | null = null;

    const reconcileLockdown = () => {
      const activeEntry = (latestPlatform && latestPlatform.active) 
        ? latestPlatform 
        : ((latestGovernance && latestGovernance.active) ? latestGovernance : null);

      if (activeEntry) {
        try {
          localStorage.setItem('emergency_shutdown_active', 'true');
        } catch (e) {}
        setEmergencyLockdown(activeEntry);
      } else {
        // Only clear if both explicitly report false
        if (latestPlatform && latestGovernance && !latestPlatform.active && !latestGovernance.active) {
          try {
            localStorage.removeItem('emergency_shutdown_active');
          } catch (e) {}
          setEmergencyLockdown(null);
        }
      }
    };

    const unsub = onSnapshot(
      doc(db, 'system', 'governance'),
      (docSnap) => {
        if (!docSnap.exists()) {
          latestGovernance = { active: false, reason: '', initiatedBy: '', unlockAt: null, durationMinutes: 60 };
          reconcileLockdown();
          return;
        }

        const data = docSnap.data();
        const unlockTime = data.unlockAt ? new Date(data.unlockAt) : null;

        if (data.panicModeActive) {
          try {
            sessionStorage.clear();
          } catch (e) {}

          latestGovernance = {
            active: true,
            reason: data.reason || 'Admin Initiated Maintenance & Security Shutdown',
            initiatedBy: data.initiatedBy || 'ADITYA-OWNER',
            unlockAt: unlockTime,
            durationMinutes: data.durationMinutes || 60,
          };
        } else {
          latestGovernance = { active: false, reason: '', initiatedBy: '', unlockAt: null, durationMinutes: 60 };
        }
        reconcileLockdown();
      },
      (error) => {
        console.warn('System governance listener warning:', error);
      }
    );

    // Synchronized listener on platform_state/lockdown
    const unsubPlatformLockdown = onSnapshot(
      doc(db, 'platform_state', 'lockdown'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.active === true) {
            try {
              sessionStorage.clear();
              localStorage.removeItem('chess_pro_token');
            } catch (e) {}

            const startMs = data.timestamp ? new Date(data.timestamp).getTime() : Date.now();
            const dur = Number(data.durationMinutes) || 60;
            const unlockAt = new Date(startMs + dur * 60 * 1000);

            latestPlatform = {
              active: true,
              reason: data.reason || 'Server Initiated Emergency Shutdown',
              initiatedBy: data.initiatedBy || 'Owner Authorization',
              unlockAt: unlockAt,
              durationMinutes: dur,
            };
          } else {
            latestPlatform = { active: false, reason: '', initiatedBy: '', unlockAt: null, durationMinutes: 60 };
          }
        } else {
          latestPlatform = { active: false, reason: '', initiatedBy: '', unlockAt: null, durationMinutes: 60 };
        }
        reconcileLockdown();
      },
      (err) => console.warn('platform_state/lockdown listener warning:', err)
    );

    return () => {
      delete (window as any).activateFrontendLockdown;
      unsub();
      unsubPlatformLockdown();
    };
  }, []);

  // Section 4: Real-Time Platform Active Game State Synchronization via Firestore
  useEffect(() => {
    const unsub = subscribeToActiveGame(
      (activeState) => {
        if (activeState && activeState.activeGameId) {
          setPlatformActiveGame(activeState);

          const idMap: Record<string, ActiveBoardGame> = {
            DRAUGHTS: 'checkers',
            CHECKERS: 'checkers',
            DUO_CHESS: 'chess',
            CHESS_PRO: 'chess',
            CONNECT_FOUR: 'connect4',
            LUDO: 'ludo',
            BUSINESS: 'business',
            BACKGAMMON: 'backgammon',
            CARROM: 'carrom',
            DARTS: 'darts',
            SNAKES: 'snakes',
            GOMOKU: 'gomoku',
            REVERSI: 'reversi',
            BATTLESHIP: 'battleship',
            SIM: 'sim',
            UNO: 'uno',
            HEARTS: 'hearts',
            GINRUMMY: 'ginrummy',
            SPEED: 'speed',
            PINGPONG: 'pingpong',
          };

          const matchedBoardGame = idMap[activeState.activeGameId.toUpperCase()];
          if (matchedBoardGame) {
            setActiveBoardGame(matchedBoardGame);
          }

          setActiveGameBannerNotice(
            `⚡ Platform Active Game Mode Switched to: ${activeState.gameTitle} (${activeState.entryFee} ${activeState.currency.toUpperCase()})`
          );
          setTimeout(() => setActiveGameBannerNotice(null), 8000);
        }
      },
      (err) => {
        console.warn('Active game listener notification:', err);
      }
    );

    const handlePlatformGameLaunched = (e: any) => {
      const detail = e.detail;
      if (detail && detail.gameId) {
        const idMap: Record<string, ActiveBoardGame> = {
          DRAUGHTS: 'checkers',
          CHECKERS: 'checkers',
          DUO_CHESS: 'chess',
          CHESS_PRO: 'chess',
          CONNECT_FOUR: 'connect4',
          LUDO: 'ludo',
          BUSINESS: 'business',
          BACKGAMMON: 'backgammon',
          CARROM: 'carrom',
          DARTS: 'darts',
          SNAKES: 'snakes',
          GOMOKU: 'gomoku',
          REVERSI: 'reversi',
          BATTLESHIP: 'battleship',
          SIM: 'sim',
          UNO: 'uno',
          HEARTS: 'hearts',
          GINRUMMY: 'ginrummy',
          SPEED: 'speed',
          PINGPONG: 'pingpong',
        };
        const mapped = idMap[detail.gameId.toUpperCase()];
        if (mapped) {
          setActiveBoardGame(mapped);
          hasPaidGameFeeRef.current = false;
          setHasPaidGameFee(false);
          resetGame();
          setIsEntryFeeModalOpen(true);
        }
      }
    };

    // Global hook for dynamic game switching triggered by Firestore governance listener or client actions
    (window as any).handleGameSwitch = (gameIdentifier: string) => {
      if (!gameIdentifier) return;
      const meta = resolveGameMetadata(gameIdentifier);
      if (meta && meta.boardId) {
        setActiveBoardGame(meta.boardId);
        hasPaidGameFeeRef.current = false;
        setHasPaidGameFee(false);
        resetGame();
        setIsEntryFeeModalOpen(true);
      }
      setActiveGameBannerNotice(`⚡ Active Game Updated: ${meta?.title || gameIdentifier}`);
      setTimeout(() => setActiveGameBannerNotice(null), 6000);
    };

    // Initialize Delegated Game Selector for Top-Level Hero Cards
    const cleanupDelegator = initDelegatedGameSelector();

    // Initialize Real-Time Emergency Lockdown Global Listener
    const cleanupEmergency = EmergencySystem.initGlobalListener();

    const handlePlatformGameSwitched = (e: any) => {
      const detail = e.detail;
      if (detail && detail.boardId) {
        setActiveBoardGame(detail.boardId);
        hasPaidGameFeeRef.current = false;
        setHasPaidGameFee(false);
        resetGame();
        setIsEntryFeeModalOpen(true);
        setActiveGameBannerNotice(
          `⚡ Active Game Switched: ${detail.gameTitle} - Match entry fee required to play.`
        );
        setTimeout(() => setActiveGameBannerNotice(null), 5000);
      }
    };

    const handleMatchFeePaid = () => {
      hasPaidGameFeeRef.current = true;
      setHasPaidGameFee(true);
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              gamerPoints: getUserPoints(),
              gems: getUserGems(),
            }
          : null
      );
    };

    window.addEventListener('platform_game_launched', handlePlatformGameLaunched);
    window.addEventListener('platform_game_switched', handlePlatformGameSwitched);
    window.addEventListener('match_fee_paid', handleMatchFeePaid);

    return () => {
      unsub();
      cleanupDelegator();
      if (typeof cleanupEmergency === 'function') cleanupEmergency();
      delete (window as any).handleGameSwitch;
      window.removeEventListener('platform_game_launched', handlePlatformGameLaunched);
      window.removeEventListener('platform_game_switched', handlePlatformGameSwitched);
      window.removeEventListener('match_fee_paid', handleMatchFeePaid);
    };
  }, []);

  // Sync current user session and connected lobby users into global telemetry engine
  useEffect(() => {
    const activeGameId = selectedWheelGame?.id || 'chess';
    const roomTitle = selectedWheelGame ? `${selectedWheelGame.name} Arena - Room #${activeRoomId || '001'}` : 'Main Platform Lobby';
    const activeUsername = currentUser?.username || getDefaultGuestHandle();
    const isGuest = currentUser ? !!currentUser.isGuest : true;

    telemetryEngine.updateLocalUserSession(
      activeUsername,
      currentUser?.stats,
      isGuest,
      activeGameId,
      roomTitle
    );

    lobbyUsers.forEach((lu) => {
      if (lu.username && lu.username !== activeUsername) {
        telemetryEngine.updateLocalUserSession(
          lu.username,
          undefined,
          false,
          'chess',
          'Multiplayer Match Arena'
        );
      }
    });
  }, [currentUser, selectedWheelGame, activeRoomId, lobbyUsers]);

  // Track each game open event whenever a game is switched or loaded
  useEffect(() => {
    if (hasAgreedPrivacyPolicy()) {
      trackGameOpened(activeBoardGame);
    }
  }, [activeBoardGame]);

  // Periodic active gameplay duration synchronization (starts when user agreements privacy policy and starts playing)
  useEffect(() => {
    const timer = setInterval(() => {
      if (hasAgreedPrivacyPolicy() && isGameActive && !isPaused) {
        syncGameTime(10, activeBoardGame);
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [isGameActive, isPaused, activeBoardGame]);

  // 2. Socket.io Event Handlers
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    socket.on('lobby:users', (users: LobbyUser[]) => {
      setLobbyUsers(users);
    });

    socket.on('matchmaking:waiting', () => {
      setMatchmakingStatus('waiting');
    });

    socket.on('game:started', (data: { roomId: string; whiteUsername: string; blackUsername: string; fen: string; communityNotice?: string; roomRules?: any }) => {
      setActiveRoomId(data.roomId);
      setIsMatchmakingOpen(false);
      setMatchmakingStatus('idle');
      setCreatedRoomCode(null);
      if (data.communityNotice !== undefined) setRoomNotice(data.communityNotice);
      if (data.roomRules) setRoomRules(data.roomRules);

      // Determine player color
      const isWhite = data.whiteUsername.toLowerCase() === currentUser?.username.toLowerCase();
      const myColor: 'w' | 'b' = isWhite ? 'w' : 'b';
      setMyPvPColor(myColor);
      setOrientation(myColor);

      // Update Player Names
      setSettings((prev) => ({
        ...prev,
        whitePlayer: { ...prev.whitePlayer, name: data.whiteUsername },
        blackPlayer: { ...prev.blackPlayer, name: data.blackUsername },
      }));

      // Reset Board
      chessRef.current.reset();
      setFen(chessRef.current.fen());
      setMoveRecords([]);
      setCurrentMoveIndex(-1);
      setIsGameActive(true);
      setGameResult({ winner: null, reason: null });
      setWhiteTime(settings.timeControl.initialSeconds);
      setBlackTime(settings.timeControl.initialSeconds);
      setChatMessages([]);
      soundFx.playClick();
    });

    socket.on('room:created', (data: { roomId: string; room?: any }) => {
      setCreatedRoomCode(data.roomId);
      setActiveRoomId(data.roomId);
      setMyPvPColor('w');
      setOrientation('w');
      setIsSpectator(false);
      if (data.room?.communityNotice !== undefined) setRoomNotice(data.room.communityNotice);
      if (data.room?.roomRules) setRoomRules(data.room.roomRules);
    });

    socket.on('room:joined', (data: { roomId: string; myColor: 'w' | 'b' | 'spectator'; isSpectator?: boolean; room?: any; communityNotice?: string; roomRules?: any }) => {
      setActiveRoomId(data.roomId);
      setIsMatchmakingOpen(false);
      setMatchmakingStatus('idle');
      setCreatedRoomCode(null);
      if (data.communityNotice !== undefined) setRoomNotice(data.communityNotice);
      else if (data.room?.communityNotice !== undefined) setRoomNotice(data.room.communityNotice);
      if (data.roomRules) setRoomRules(data.roomRules);
      else if (data.room?.roomRules) setRoomRules(data.room.roomRules);

      if (data.isSpectator || data.myColor === 'spectator') {
        setIsSpectator(true);
        setMyPvPColor('spectator');
      } else {
        setIsSpectator(false);
        setMyPvPColor(data.myColor);
        setOrientation(data.myColor);
      }

      if (data.room) {
        setSettings((prev) => ({
          ...prev,
          whitePlayer: { ...prev.whitePlayer, name: data.room.whiteUsername || 'White' },
          blackPlayer: { ...prev.blackPlayer, name: data.room.blackUsername || 'Black' },
        }));
        if (data.room.fen) {
          try {
            chessRef.current.load(data.room.fen);
            setFen(chessRef.current.fen());
          } catch (e) {}
        }
      }
      setIsGameActive(true);
      soundFx.playClick();
    });

    socket.on('room:error', (data: { message: string }) => {
      setMatchmakingError(data.message);
    });

    socket.on('game:moved', (data: { from: Square; to: Square; promotion?: string; fen: string; san: string; turn: 'w' | 'b' }) => {
      try {
        const moveRes = chessRef.current.move({
          from: data.from,
          to: data.to,
          promotion: data.promotion || 'q',
        });
        if (moveRes) {
          const newFen = chessRef.current.fen();
          setFen(newFen);
          setPgn(chessRef.current.pgn());
          setLastMove({ from: data.from, to: data.to });

          const record: MoveRecord = {
            san: moveRes.san,
            from: data.from,
            to: data.to,
            piece: moveRes.piece,
            captured: moveRes.captured,
            promotion: moveRes.promotion,
            color: moveRes.color,
            fen: newFen,
            moveNumber: Math.ceil((moveRecords.length + 1) / 2),
          };

          setMoveRecords((prev) => [...prev, record]);
          setCurrentMoveIndex((prev) => prev + 1);

          if (chessRef.current.isCheckmate()) {
            soundFx.playGameOver(true);
          } else if (chessRef.current.isCheck()) {
            soundFx.playCheck();
          } else if (moveRes.captured) {
            soundFx.playCapture();
          } else {
            soundFx.playMove();
          }
        }
      } catch (err) {
        console.error('Error handling socket move:', err);
      }
    });

    socket.on('game:ended', (data: { winner: 'w' | 'b' | 'draw'; reason: string }) => {
      setIsGameActive(false);
      setGameResult({ winner: data.winner, reason: data.reason as any });
      const userLost = data.winner !== null && data.winner !== 'draw' && data.winner !== myPvPColor;
      if (userLost) {
        applyMatchLossPenalty(activeBoardGame, 10000);
        soundFx.playGameOver(false);
      } else {
        soundFx.playGameOver(data.winner !== null && data.winner !== 'draw');
      }
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on('game:draw_offered', (data: { offeredBy: string }) => {
      if (window.confirm(`${data.offeredBy} is offering a draw. Do you accept?`)) {
        socket.emit('game:draw_respond', { roomId: activeRoomId, accept: true });
      } else {
        socket.emit('game:draw_respond', { roomId: activeRoomId, accept: false });
      }
    });

    return () => {
      socket.off('lobby:users');
      socket.off('lobby:spin_result');
      socket.off('matchmaking:waiting');
      socket.off('game:started');
      socket.off('room:created');
      socket.off('room:error');
      socket.off('game:moved');
      socket.off('game:ended');
      socket.off('chat:message');
      socket.off('game:draw_offered');
    };
  }, [activeRoomId, currentUser, moveRecords.length, settings.timeControl.initialSeconds]);

  // Sync soundFx setting
  useEffect(() => {
    soundFx.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Clock Timer
  useEffect(() => {
    if (isUntimed || !isGameActive || isPaused || gameResult.winner !== null) return;

    const timer = setInterval(() => {
      if (activeTurn === 'w') {
        setWhiteTime((prev) => Math.max(0, prev - 1));
      } else {
        setBlackTime((prev) => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTurn, isGameActive, isPaused, isUntimed, gameResult.winner]);

  // Player vs AI Engine Turn Trigger
  useEffect(() => {
    if (
      gameMode === 'ai' &&
      isGameActive &&
      gameResult.winner === null &&
      activeTurn === 'b'
    ) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(chessRef.current, settings.aiDifficulty);
        if (aiMove) {
          executeMove(aiMove.from, aiMove.to, aiMove.promotion);
        }
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [gameMode, isGameActive, gameResult.winner, activeTurn, settings.aiDifficulty]);

  // Derived captured pieces
  const capturedPieces = React.useMemo(() => {
    const whiteCaps: ('p' | 'n' | 'b' | 'r' | 'q')[] = [];
    const blackCaps: ('p' | 'n' | 'b' | 'r' | 'q')[] = [];

    moveRecords.slice(0, currentMoveIndex + 1).forEach((m) => {
      if (m.captured) {
        if (m.color === 'w') {
          whiteCaps.push(m.captured as 'p' | 'n' | 'b' | 'r' | 'q');
        } else {
          blackCaps.push(m.captured as 'p' | 'n' | 'b' | 'r' | 'q');
        }
      }
    });

    return { white: whiteCaps, black: blackCaps };
  }, [moveRecords, currentMoveIndex]);

  // Find King square if in check
  const kingInCheckSquare = React.useMemo(() => {
    if (!chessRef.current.isCheck()) return null;
    const board = chessRef.current.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === activeTurn) {
          return piece.square as Square;
        }
      }
    }
    return null;
  }, [fen, activeTurn]);

  // Execute Move Core Logic
  const executeMove = useCallback(
    (from: Square, to: Square, promotionPiece?: 'q' | 'r' | 'b' | 'n') => {
      const chess = chessRef.current;
      const piece = chess.get(from);

      // Require match entry fee before any moves can be executed
      if (!hasPaidGameFeeRef.current) {
        setPendingGameStartAction(() => () => {
          executeMove(from, to, promotionPiece);
        });
        setIsEntryFeeModalOpen(true);
        return;
      }

      // Check promotion requirement
      if (
        piece &&
        piece.type === 'p' &&
        ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1')) &&
        !promotionPiece
      ) {
        setPendingPromotion({ from, to });
        return;
      }

      try {
        const moveResult = chess.move({
          from,
          to,
          promotion: promotionPiece || 'q',
        });

        if (!moveResult) return;

        // Sounds & Voice Announcement
        if (chess.isCheckmate()) {
          const userColorCode = gameMode === 'pvp' ? (myPvPColor === 'b' ? 'b' : 'w') : orientation;
          soundFx.playGameOver(moveResult.color === userColorCode);
        } else if (chess.isCheck()) {
          soundFx.playCheck();
        } else if (moveResult.captured) {
          soundFx.playCapture();
        } else {
          soundFx.playMove();
        }
        soundFx.announceMove(moveResult.san);

        const newFen = chess.fen();
        const newPgn = chess.pgn();
        setFen(newFen);
        setPgn(newPgn);
        setLastMove({ from, to });

        const record: MoveRecord = {
          san: moveResult.san,
          from,
          to,
          piece: moveResult.piece,
          captured: moveResult.captured,
          promotion: moveResult.promotion,
          color: moveResult.color,
          fen: newFen,
          moveNumber: Math.ceil((moveRecords.length + 1) / 2),
        };

        const updatedHistory = [...moveRecords, record];
        setMoveRecords(updatedHistory);
        setCurrentMoveIndex(updatedHistory.length - 1);

        // Update Quest & Hatrick Progress for player actions
        const isPlayerTurn = (gameMode === 'ai' && moveResult.color === orientation) ||
                             (gameMode === 'local') ||
                             (gameMode === 'pvp' && moveResult.color === myPvPColor);

        if (isPlayerTurn) {
          updateQuestProgress('moves', 1);

          if (moveResult.captured) {
            recordPlayerCaptureForHatrick(moveResult.captured);
            updateQuestProgress('capture', 1);
          }

          if (chess.isCheck()) {
            updateQuestProgress('check', 1);
          }

          if (moveResult.san.includes('O-O')) {
            updateQuestProgress('castle', 1);
          }

          if (moveResult.promotion) {
            updateQuestProgress('promote', 1);
          }
        }

        // Check game over conditions
        let isGameOver = false;
        let winnerRes: 'w' | 'b' | 'draw' = 'draw';
        let reasonRes = '';

        if (chess.isCheckmate()) {
          isGameOver = true;
          winnerRes = moveResult.color;
          reasonRes = 'checkmate';
          setIsGameActive(false);
          setGameResult({ winner: winnerRes, reason: 'checkmate' });
          const userColorCode = gameMode === 'pvp' ? (myPvPColor === 'b' ? 'b' : 'w') : orientation;
          if (winnerRes !== userColorCode) {
            applyMatchLossPenalty('chess', 10000);
          }
          if (isPlayerTurn && winnerRes === moveResult.color) {
            updateQuestProgress('win', 1);
          }
        } else if (chess.isStalemate()) {
          isGameOver = true;
          winnerRes = 'draw';
          reasonRes = 'stalemate';
          setIsGameActive(false);
          setGameResult({ winner: 'draw', reason: 'stalemate' });
        } else if (chess.isThreefoldRepetition()) {
          isGameOver = true;
          winnerRes = 'draw';
          reasonRes = 'threefold';
          setIsGameActive(false);
          setGameResult({ winner: 'draw', reason: 'threefold' });
        } else if (chess.isInsufficientMaterial()) {
          isGameOver = true;
          winnerRes = 'draw';
          reasonRes = 'insufficient';
          setIsGameActive(false);
          setGameResult({ winner: 'draw', reason: 'insufficient' });
        } else if (chess.isDraw()) {
          isGameOver = true;
          winnerRes = 'draw';
          reasonRes = 'agreement';
          setIsGameActive(false);
          setGameResult({ winner: 'draw', reason: 'agreement' });
        }

        // Emit over socket if in PvP mode
        if (gameMode === 'pvp' && activeRoomId) {
          const socket = socketService.getSocket();
          socket?.emit('game:move', {
            roomId: activeRoomId,
            from,
            to,
            promotion: promotionPiece || 'q',
            fen: newFen,
            san: moveResult.san,
            isGameOver,
            winner: winnerRes,
            reason: reasonRes,
          });
        }

        // Record AI game if finished
        if (isGameOver && gameMode === 'ai') {
          recordGameResult({
            gameType: activeBoardGame,
            mode: 'ai',
            whiteUsername: currentUser?.username || 'Guest',
            blackUsername: `Computer (${settings.aiDifficulty})`,
            winner: winnerRes,
            reason: reasonRes,
            moveCount: updatedHistory.length,
            pgn: newPgn,
            moves: updatedHistory,
            timeControlPreset: settings.timeControl.preset,
          });

          const isWin = winnerRes === orientation;
          const matchEarnings = isWin ? 1000 : (winnerRes === 'draw' ? 300 : 0);
          recordTwentyGameResult(2, isWin, matchEarnings, currentUser?.username);
        }
      } catch (err) {
        console.error('Invalid move attempted:', err);
      }
    },
    [activeBoardGame, activeRoomId, currentUser?.username, gameMode, moveRecords, settings.aiDifficulty, settings.timeControl.preset]
  );

  // Handle Timeout
  const handleTimeout = useCallback((loserColor: 'w' | 'b') => {
    soundFx.playGameOver(false);
    setIsGameActive(false);
    const winnerColor = loserColor === 'w' ? 'b' : 'w';
    const userColorCode = gameMode === 'pvp' ? (myPvPColor === 'b' ? 'b' : 'w') : orientation;
    if (loserColor === userColorCode) {
      applyMatchLossPenalty('chess', 10000);
    }
    setGameResult({
      winner: winnerColor,
      reason: 'timeout',
    });
  }, [gameMode, myPvPColor, orientation]);

  // Handle Game End for any of the 18 platform board games
  const handleBoardGameEnd = useCallback(
    (gameType: ActiveBoardGame, w: 'w' | 'b' | 'draw', reason?: string) => {
      const durationSec = Math.max(5, Math.round((Date.now() - matchStartTimeRef.current) / 1000));
      const userColorCode: 'w' | 'b' = gameMode === 'pvp' ? (myPvPColor === 'b' ? 'b' : 'w') : orientation;
      const isDefeat = w !== 'draw' && w !== userColorCode;

      // Deduct 10,000 points in 96 FX Hub & user points manager on any match defeat
      if (isDefeat) {
        applyMatchLossPenalty(gameType, 10000);
        soundFx.playGameOver(false);
      } else if (w !== 'draw') {
        soundFx.playGameOver(true);
      }

      recordGameResult({
        gameType,
        mode: gameMode,
        whiteUsername: currentUser?.username || 'Guest',
        blackUsername: gameMode === 'ai' ? 'Computer' : 'Player 2',
        winner: w,
        reason: reason || `${gameType}_match_end`,
        moveCount: 15,
        durationSeconds: durationSec,
      });

      // Update 20-Game Master Profile and XP Progression
      const isWin = w !== 'draw' && !isDefeat;
      const matchEarnings = isWin ? 1000 : (w === 'draw' ? 300 : 0);
      recordTwentyGameResult(gameType, isWin, matchEarnings, currentUser?.username);

      setGameResult({
        winner: w,
        reason: reason || `${gameType}_completed`,
      });
    },
    [currentUser?.username, gameMode, myPvPColor, orientation]
  );

  // Reset Game
  const resetGame = (forceClassical: boolean | React.MouseEvent = false) => {
    const shouldForceClassical = forceClassical === true;
    if (activeCustomVariant && !shouldForceClassical && activeCustomVariant.boardSize === 8) {
      const customFen = activeCustomVariant.fen || layoutToFen(activeCustomVariant.layout, 8);
      try {
        chessRef.current.load(customFen);
      } catch {
        chessRef.current.reset();
      }
    } else {
      chessRef.current.reset();
      if (shouldForceClassical) {
        setActiveCustomVariant(null);
      }
    }
    setFen(chessRef.current.fen());
    setPgn('');
    setLastMove(null);
    setMoveRecords([]);
    setCurrentMoveIndex(-1);
    setIsGameActive(true);
    setIsPaused(false);
    setGameResult({ winner: null, reason: null });
    setWhiteTime(settings.timeControl.initialSeconds);
    setBlackTime(settings.timeControl.initialSeconds);
    hasPaidGameFeeRef.current = false;
    setHasPaidGameFee(false);
    setPendingGameStartAction(null);
    soundFx.playClick();
  };

  // Dedicated Universal Game Switcher with Mandatory Entry Fee Enforcement
  const switchActiveGame = (gameId: ActiveBoardGame, newGameMode?: GameMode) => {
    setActiveBoardGame(gameId);
    if (newGameMode) {
      setGameMode(newGameMode);
    }
    hasPaidGameFeeRef.current = false;
    setHasPaidGameFee(false);
    resetGame();
    setIsEntryFeeModalOpen(true);
    setActiveGameBannerNotice(`⚡ Selected: ${getGameDisplayTitle(gameId)} - Match entry fee required to play.`);
    setTimeout(() => setActiveGameBannerNotice(null), 5000);
    const gameContainer = document.getElementById('gameContainer') || document.getElementById('boardRenderArea');
    if (gameContainer) {
      const topOffset = gameContainer.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
    }
  };

  // Prompt Game Entry Fee Deduction Menu
  const promptGameEntryFee = (onSuccessAction?: () => void) => {
    setPendingGameStartAction(() => onSuccessAction || (() => resetGame(true)));
    setIsEntryFeeModalOpen(true);
  };

  // Bind to global window for external access
  if (typeof window !== 'undefined') {
    (window as any).promptGameFeeAndStart = promptGameEntryFee;
    (window as any).resetBoard = () => resetGame(true);
    (window as any).startMatchTimer = () => setIsPaused(false);
    (window as any).switchActiveGame = switchActiveGame;
    (window as any).selectAndLaunchGame = switchActiveGame;
  }

  // Undo Move (Single-Player & Local mode)
  const handleUndoMove = () => {
    if (gameMode === 'pvp' || moveRecords.length === 0) return;

    const undoCount = gameMode === 'ai' && moveRecords.length >= 2 ? 2 : 1;
    for (let i = 0; i < undoCount; i++) {
      chessRef.current.undo();
    }

    const newHistory = moveRecords.slice(0, Math.max(0, moveRecords.length - undoCount));
    setMoveRecords(newHistory);
    setCurrentMoveIndex(newHistory.length - 1);
    setFen(chessRef.current.fen());
    setPgn(chessRef.current.pgn());

    const prevMove = newHistory[newHistory.length - 1];
    setLastMove(prevMove ? { from: prevMove.from as Square, to: prevMove.to as Square } : null);
    soundFx.playClick();
  };

  // Reviewing historical move positions
  const handleSelectMoveIndex = (index: number) => {
    soundFx.playClick();
    setCurrentMoveIndex(index);

    const tempChess = new Chess();
    if (index === -1) {
      setFen(tempChess.fen());
      setLastMove(null);
      return;
    }

    const targetRecord = moveRecords[index];
    if (targetRecord) {
      for (let i = 0; i <= index; i++) {
        const m = moveRecords[i];
        if (m) tempChess.move({ from: m.from as Square, to: m.to as Square, promotion: m.promotion });
      }
      setFen(tempChess.fen());
      setLastMove({ from: targetRecord.from as Square, to: targetRecord.to as Square });
    }
  };

  const handleResign = () => {
    soundFx.playGameOver(false);
    setIsGameActive(false);
    const winningColor = activeTurn === 'w' ? 'b' : 'w';
    applyMatchLossPenalty(activeBoardGame, 10000);
    setGameResult({
      winner: winningColor,
      reason: 'resignation',
    });

    if (gameMode === 'pvp' && activeRoomId) {
      const socket = socketService.getSocket();
      socket?.emit('game:resign', { roomId: activeRoomId });
    } else if (gameMode === 'ai') {
      recordGameResult({
        gameType: activeBoardGame,
        mode: 'ai',
        whiteUsername: currentUser?.username || 'Guest',
        blackUsername: `Computer (${settings.aiDifficulty})`,
        winner: winningColor,
        reason: 'resignation',
        moveCount: moveRecords.length,
        pgn,
        moves: moveRecords,
        timeControlPreset: settings.timeControl.preset,
      });
    }
  };

  const handleOfferDraw = () => {
    if (gameMode === 'pvp' && activeRoomId) {
      const socket = socketService.getSocket();
      socket?.emit('game:draw_offer', { roomId: activeRoomId });
    } else if (window.confirm('Do both players agree to a draw?')) {
      setIsGameActive(false);
      setGameResult({
        winner: 'draw',
        reason: 'agreement',
      });
    }
  };

  // Send Chat Message
  const handleSendMessage = (text: string) => {
    if (gameMode === 'pvp' && activeRoomId) {
      const socket = socketService.getSocket();
      socket?.emit('chat:send', { roomId: activeRoomId, text });
    } else {
      const msg: ChatMessage = {
        id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        sender: currentUser?.username || 'Guest',
        text,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, msg]);
    }
  };

  // Replay Past Match
  const handleReplayMatch = (match: MatchRecord) => {
    chessRef.current.reset();
    const tempMoves: MoveRecord[] = [];

    match.moves.forEach((m, idx) => {
      const moveRes = chessRef.current.move({
        from: m.from,
        to: m.to,
        promotion: m.promotion,
      });
      if (moveRes) {
        tempMoves.push({
          san: moveRes.san,
          from: m.from,
          to: m.to,
          piece: moveRes.piece,
          captured: moveRes.captured,
          promotion: moveRes.promotion,
          color: moveRes.color,
          fen: chessRef.current.fen(),
          moveNumber: Math.ceil((idx + 1) / 2),
        });
      }
    });

    setMoveRecords(tempMoves);
    setCurrentMoveIndex(tempMoves.length - 1);
    setFen(chessRef.current.fen());
    setPgn(chessRef.current.pgn());
    setIsGameActive(false);
    setGameResult({ winner: match.winner as any, reason: match.reason as any });
  };

  const isReviewMode = currentMoveIndex < moveRecords.length - 1;

  // Real-time Opening Book & Evaluation Meter
  const detectedOpening = React.useMemo(() => {
    return detectOpening(moveRecords.map((m) => m.san));
  }, [moveRecords]);

  const evalResult = React.useMemo(() => {
    return evaluateBoard(chessRef.current);
  }, [fen]);

  // Determine board interaction read-only rule
  const isMyTurnInPvP = gameMode === 'pvp' ? activeTurn === myPvPColor : true;
  const isReadOnlyBoard = !hasPaidGameFee || !isGameActive || isReviewMode || !isMyTurnInPvP;

  return (
    <div
      className="min-h-screen text-white flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden"
      style={{
        background:
          'radial-gradient(at 0% 0%, #1e1b4b 0px, transparent 50%), radial-gradient(at 100% 0%, #312e81 0px, transparent 50%), radial-gradient(at 100% 100%, #4338ca 0px, transparent 50%), radial-gradient(at 0% 100%, #1e293b 0px, transparent 50%), #0f172a',
      }}
    >
      <SEOHead />

      {/* Top Banner: Made in India & Owner Badge */}
      <div className="w-full bg-[#0a0806]/95 border-b border-[#f3ce6b]/40 py-2 px-4 text-center flex flex-col items-center justify-center gap-1.5 z-40 relative shadow-md">
        {/* Top: Made in India with India Flag */}
        <div className="flex items-center justify-center gap-2">
          {/* India Flag Vector Badge */}
          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-950/70 via-stone-900/90 to-emerald-950/70 border border-orange-500/40 px-3 py-0.5 rounded-full shadow-md backdrop-blur-md">
            <svg
              className="w-5 h-3.5 rounded-[2px] shadow-sm overflow-hidden shrink-0 border border-white/20"
              viewBox="0 0 900 600"
              aria-label="Flag of India"
            >
              <rect width="900" height="200" fill="#FF9933" />
              <rect y="200" width="900" height="200" fill="#FFFFFF" />
              <rect y="400" width="900" height="200" fill="#138808" />
              <g transform="translate(450, 300)">
                <circle r="80" fill="none" stroke="#000080" strokeWidth="6" />
                <circle r="16" fill="#000080" />
                {Array.from({ length: 24 }).map((_, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1="0"
                    x2={80 * Math.cos((i * 15 * Math.PI) / 180)}
                    y2={80 * Math.sin((i * 15 * Math.PI) / 180)}
                    stroke="#000080"
                    strokeWidth="3.5"
                  />
                ))}
              </g>
            </svg>
            <span className="text-[11px] sm:text-xs font-black tracking-wider uppercase bg-gradient-to-r from-orange-400 via-stone-100 to-emerald-400 bg-clip-text text-transparent">
              Made in India
            </span>
          </span>
        </div>

        {/* Below: Owner: Aditya - Click to open Owner Verification */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              if ((window as any).OwnerAuthModal?.open) {
                (window as any).OwnerAuthModal.open();
              }
              setIsOwnerVerifyOpen(true);
            }}
            id="top-banner-owner-btn"
            className="owner-pill-btn group cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 px-4 py-1 rounded-full bg-[#14100c]/90 border border-[#f3ce6b]/60 hover:border-amber-300 text-[#ffe89e] shadow-lg shadow-[#f3ce6b]/20 hover:shadow-amber-500/40 backdrop-blur-md"
            title="Click to authenticate as Site Owner ADITYA and open Command Center"
          >
            <span className="text-amber-400 text-sm group-hover:scale-110 transition-transform">👑</span>
            <span className="text-xs font-black tracking-widest uppercase">OWNER:</span>
            <strong className="text-white font-extrabold tracking-wider group-hover:text-amber-300 transition-colors">ADITYA</strong>
          </button>
        </div>
      </div>

      {/* Real-time Global Active Game Mode Announcement Toast / Banner */}
      {activeGameBannerNotice && (
        <div
          id="globalActiveGameBannerNotice"
          className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white text-xs font-black py-2.5 px-4 text-center shadow-lg flex items-center justify-center gap-2 z-40 relative animate-pulse"
        >
          <span>🎮</span>
          <span className="tracking-wide">{activeGameBannerNotice}</span>
        </div>
      )}

      {/* Top Navigation */}
      <GameHeader
        activeBoardGame={activeBoardGame}
        gameMode={gameMode}
        onChangeGameMode={(mode) => {
          setGameMode(mode);
          resetGame();
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenStats={() => setIsStatsModalOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenTelemetry={() => setIsTelemetryOpen(true)}
        onOpenGoogleAuth={() => setIsGoogleAuthOpen(true)}
        onOpenGoogleForms={() => setIsGoogleFormsOpen(true)}
        onOpenWheelLobby={() => setIsWheelCatalogOpen(true)}
        onOpenMatchmaking={() => setIsMatchmakingOpen(true)}
        onOpenTournament={() => setIsTournamentOpen(true)}
        onOpenQuests={() => setIsQuestsOpen(true)}
        onOpenCustomization={() => setIsCustomizationOpen(true)}
        onOpenGameHub={() => setIsGameHubOpen(true)}
        onOpenSocialHub={() => setIsSocialHubOpen(true)}
        onOpenAskGemini={() => setIsAskGeminiOpen(true)}
        onOpenAnimationHub={() => setIsMasterHubOpen(true)}
        onOpenDailyWheel={() => setIsDailyWheelOpen(true)}
        onOpenCoinHistory={() => setIsCoinHistoryModalOpen(true)}
        onOpenCosmeticsShop={() => setIsCosmeticsShopOpen(true)}
        onOpenDailyStreak={() => setIsDailyStreakOpen(true)}
        onOpenFriends={() => setIsFriendsModalOpen(true)}
        onOpenRankedLadder={() => setIsRankedLadderOpen(true)}
        onOpenExchange={(dir) => {
          setExchangeDirection(dir || 'gemToCoin');
          setIsExchangeModalOpen(true);
        }}
        onOpenAdminPanel={() => setIsOwnerVerifyOpen(true)}
        onOpenPuzzles={() => setIsPuzzleOpen(true)}
        onOpenPositionEditor={() => setIsPositionEditorOpen(true)}
        onOpenCustomSandbox={() => setIsCustomSandboxOpen(true)}
        onUndoMove={handleUndoMove}
        canUndo={moveRecords.length > 0 && gameMode !== 'pvp'}
        onResetGame={resetGame}
        onFlipBoard={() => setOrientation((prev) => (prev === 'w' ? 'b' : 'w'))}
        onOfferDraw={handleOfferDraw}
        onResign={handleResign}
        onOpenSettings={() => setIsSettingsOpen(true)}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() =>
          setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
        }
        isGameActive={isGameActive && gameResult.winner === null}
        isSpectator={isSpectator}
      />

      {/* DUO CHESS Dark-Gaming Hero & Arena Controls */}
      <div className="max-w-7xl w-full mx-auto px-4 md:px-6 pt-4 space-y-4">
        {/* Aditya Solo Owner Hero Banner */}
        <OwnerHeroCard
          currentUser={currentUser}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenDailyWheel={() => setIsDailyWheelOpen(true)}
          onOpenExchange={(dir) => {
            setExchangeDirection(dir || 'gemToCoin');
            setIsExchangeModalOpen(true);
          }}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenGoogleAuth={() => setIsGoogleAuthOpen(true)}
          onOpenMatchmaking={() => setIsMatchmakingOpen(true)}
          onOpenTournaments={() => setIsTournamentOpen(true)}
          onOpenAdminPanel={() => setIsOwnerVerifyOpen(true)}
        />

        {/* 20 Games Category Bar Selector */}
        <GameBarSelector
          activeBoardGame={activeBoardGame}
          onSelectGame={(game) => switchActiveGame(game)}
          onOpenMultiGameHub={() => setIsGameHubOpen(true)}
        />

        {/* Choose Mode 4-Card Grid Panel */}
        <ChooseModePanel
          gameMode={gameMode}
          activeBoardGame={activeBoardGame}
          onChangeGameMode={(mode) => {
            switchActiveGame(activeBoardGame, mode);
            if (mode === 'pvp') {
              setIsMatchmakingOpen(true);
            }
          }}
          onOpenMatchmaking={() => setIsMatchmakingOpen(true)}
          onOpenTournament={() => setIsTournamentOpen(true)}
          onOpenPuzzles={() => setIsPuzzleOpen(true)}
          onOpenAskGemini={() => setIsAskGeminiOpen(true)}
          onOpenWheelLobby={() => setIsWheelCatalogOpen(true)}
          aiDifficulty={settings.aiDifficulty}
          onAiDifficultyChange={(diff) => {
            setSettings((prev) => ({ ...prev, aiDifficulty: diff }));
          }}
        />

        {/* Match Settings, Bet & Spin Wheel Panel */}
        <MatchSettingsWheelPanel
          settings={settings}
          onUpdateSettings={setSettings}
          orientation={orientation}
          onSetOrientation={setOrientation}
          onOpenDailyWheel={() => setIsDailyWheelOpen(true)}
        />
      </div>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:px-6 py-2 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left Column: Board & Controls - Central Game Container */}
        <div id="gameContainer" data-workspace="chessBoardWorkspace" className="flex flex-col items-center gap-3 w-full">
          <div id="boardRenderArea" className="w-full flex flex-col items-center gap-3">
          {/* AI Difficulty Selector - Displayed in Player vs AI mode for EVERY game */}
          {gameMode === 'ai' && (
            <div className="w-full max-w-[580px] my-1 animate-fadeIn">
              <AIDifficultySelector
                currentLevel={settings.aiDifficulty}
                onSelectLevel={(level) => {
                  setSettings((prev) => ({ ...prev, aiDifficulty: level as AIDifficulty }));
                }}
              />
            </div>
          )}

          {/* Real-time Room Community Notice & Rules Banner */}
          {roomNotice && roomNotice.trim() !== '' && (
            <div
              id="communityNoticeBanner"
              className="w-full max-w-[580px] bg-amber-500/20 border border-amber-400/60 rounded-2xl p-3.5 flex items-start gap-3 backdrop-blur-md shadow-lg shadow-amber-500/10 text-left animate-fadeIn"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/30 border border-amber-400/50 flex items-center justify-center shrink-0 text-amber-200 text-sm">
                📢
              </div>
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">Room Notice & Rules</span>
                  {roomRules && (
                    <span className="text-[10px] text-amber-300 font-mono bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/40">
                      Min Rating: {roomRules.minimumRating}
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-100 leading-relaxed font-medium">{roomNotice}</p>
              </div>
            </div>
          )}

          {/* Active Board Game Arena Container with Mandatory Entry Fee Lock */}
          <div className="w-full relative flex flex-col items-center justify-center">
            {/* Locked Gate Overlay when Entry Fee has not been paid */}
            {!hasPaidGameFee && (() => {
              const isFreePlayActive = GameEconomy.isFreeMode();
              const currentFeeCoins = isFreePlayActive ? 0 : GameEconomy.getFeeCoins(activeBoardGame);
              const currentFeeGems = isFreePlayActive ? 0 : GameEconomy.getFeeGems(activeBoardGame);
              const isCompletelyFree = isFreePlayActive || (currentFeeCoins === 0 && currentFeeGems === 0);
              const userCoins = getUserPoints();
              const userGems = getUserGems();

              const handleUnlockOrOpenModal = (e?: React.MouseEvent) => {
                if (e) e.stopPropagation();
                if (isCompletelyFree) {
                  hasPaidGameFeeRef.current = true;
                  setHasPaidGameFee(true);
                  soundFx.playWin();
                  if (pendingGameStartAction) {
                    pendingGameStartAction();
                    setPendingGameStartAction(null);
                  }
                } else {
                  setIsEntryFeeModalOpen(true);
                }
              };

              return (
                <div
                  id="matchEntryFeeLockedOverlay"
                  onClick={handleUnlockOrOpenModal}
                  className="absolute inset-0 z-30 min-h-[480px] bg-slate-950/85 backdrop-blur-md rounded-3xl border-2 border-purple-500/50 shadow-[0_0_60px_rgba(168,85,247,0.25)] flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none animate-in fade-in zoom-in-95 duration-200"
                >
                  {/* Glowing Lock Badge */}
                  <div className="relative mb-4">
                    <div className={`absolute -inset-2 rounded-2xl blur-lg opacity-70 animate-pulse ${
                      isCompletelyFree
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                        : 'bg-gradient-to-r from-amber-500 to-purple-600'
                    }`} />
                    <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl shadow-xl ${
                      isCompletelyFree
                        ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/30'
                        : 'bg-gradient-to-tr from-amber-500 to-purple-600 shadow-purple-500/30'
                    }`}>
                      {isCompletelyFree ? <Sparkles className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-white" />}
                    </div>
                  </div>

                  <div className="space-y-1.5 max-w-md">
                    <span className={`text-[11px] uppercase font-mono font-black tracking-widest px-3 py-1 rounded-full border inline-block ${
                      isCompletelyFree
                        ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                        : 'text-amber-400 bg-amber-500/15 border-amber-500/30'
                    }`}>
                      {isCompletelyFree ? '✨ Free Play Mode Active' : 'Match Gate Locked'}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-mono">
                      {isCompletelyFree ? 'Match Entry Fee Waived' : 'Match Entry Fee Required'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 font-medium">
                      {isCompletelyFree ? (
                        <>
                          To run and play <strong className="text-emerald-300 font-bold">{getGameDisplayTitle(activeBoardGame)}</strong> ({gameMode.toUpperCase()}), entry fees have been waived by Admin to <span className="text-emerald-300 font-bold">0 🪙 Coins</span> and <span className="text-emerald-300 font-bold">0 💎 Gems</span>.
                        </>
                      ) : (
                        <>
                          To run and play <strong className="text-amber-300 font-bold">{getGameDisplayTitle(activeBoardGame)}</strong> ({gameMode.toUpperCase()}), pay the entry fee of <span className="text-amber-300 font-bold">{currentFeeCoins.toLocaleString()} 🪙 Coins</span> or <span className="text-fuchsia-300 font-bold">{currentFeeGems.toLocaleString()} 💎 Gems</span> for every match and rematch.
                        </>
                      )}
                    </p>
                  </div>

                  {/* Primary Action Button */}
                  <button
                    type="button"
                    onClick={handleUnlockOrOpenModal}
                    className={`mt-5 py-3.5 px-8 rounded-2xl text-white font-black text-sm sm:text-base shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2.5 cursor-pointer ${
                      isCompletelyFree
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 shadow-emerald-500/30 hover:shadow-emerald-500/50'
                        : 'bg-gradient-to-r from-amber-500 via-purple-600 to-pink-600 hover:from-amber-400 hover:to-pink-500 shadow-purple-500/30 hover:shadow-purple-500/50'
                    }`}
                  >
                    <span>
                      {isCompletelyFree
                        ? '🎮 Enter Free Match (0🪙 / 0💎)'
                        : `🎮 Pay Entry Fee to Play (${currentFeeCoins.toLocaleString()}🪙 / ${currentFeeGems.toLocaleString()}💎)`}
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  {/* Real-time Balances display */}
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800 shadow-inner">
                      <span>🪙 Your Coins:</span>
                      <strong className="text-amber-300 font-mono font-bold">{userCoins.toLocaleString()}</strong>
                      <span className="text-[10px] text-slate-500">
                        {isCompletelyFree ? '(Free Entry)' : `(Need ${currentFeeCoins.toLocaleString()})`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800 shadow-inner">
                      <span>💎 Your Gems:</span>
                      <strong className="text-fuchsia-300 font-mono font-bold">{userGems.toLocaleString()}</strong>
                      <span className="text-[10px] text-slate-500">
                        {isCompletelyFree ? '(Free Entry)' : `(Need ${currentFeeGems.toLocaleString()})`}
                      </span>
                    </div>
                  </div>

                  {/* Quick actions if balance low */}
                  <div className="flex items-center gap-3 mt-4 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDailyWheelOpen(true);
                      }}
                      className="text-purple-400 hover:text-purple-300 underline font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <span>🎡 Spin Wheel</span>
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsQuestsOpen(true);
                      }}
                      className="text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <span>🎯 Tasks & Quests</span>
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExchangeDirection('gemToCoin');
                        setIsExchangeModalOpen(true);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <span>🔄 Convert Currency</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Board Container with blur & disabled state when fee not paid */}
            <div className={`w-full flex flex-col items-center gap-3 transition-all duration-300 ${!hasPaidGameFee ? 'pointer-events-none opacity-20 filter blur-[1.5px] select-none' : ''}`}>
              {activeBoardGame === 'chess' && (
            <>
              {/* Universal Game & AI Options Control Panel */}
              <GameOptionsControlPanel
                playerCountOptions={[2]}
                playerCount={2}
                gameMode={gameMode}
                onGameModeChange={(m) => {
                  setGameMode(m);
                  resetGame();
                }}
                userColorId={orientation}
                onUserColorChange={(col) => {
                  setOrientation(col as 'w' | 'b');
                  resetGame();
                }}
                aiDifficulty={settings.aiDifficulty}
                onAiDifficultyChange={(diff) => {
                  setSettings((prev) => ({ ...prev, aiDifficulty: diff }));
                }}
                playerSlots={[
                  {
                    id: 'w',
                    name: 'White Pieces',
                    colorHex: '#f8fafc',
                    isAi: gameMode === 'ai' && orientation === 'b',
                    isUser: orientation === 'w',
                  },
                  {
                    id: 'b',
                    name: 'Black Pieces',
                    colorHex: '#1e293b',
                    isAi: gameMode === 'ai' && orientation === 'w',
                    isUser: orientation === 'b',
                  },
                ]}
                onOpenCustomSandbox={() => setIsCustomSandboxOpen(true)}
                onResetGame={resetGame}
              />

              {/* Active Custom Variant Banner */}
              {activeCustomVariant && (
                <div className="w-full max-w-[580px] bg-gradient-to-r from-amber-950/60 via-stone-900/90 to-amber-950/60 border border-amber-500/40 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md shadow-xl shadow-amber-950/30 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-300 font-extrabold">
                      <Flame className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-300">{activeCustomVariant.name}</span>
                        <span className="text-[9px] text-amber-200 font-mono bg-amber-500/25 px-1.5 py-0.2 rounded border border-amber-400/30 font-bold uppercase tracking-wider">
                          Custom Variant Active
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        {activeCustomVariant.boardSize}x{activeCustomVariant.boardSize} Sandbox Setup • {activeCustomVariant.timeLimit}s Clock
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setIsCustomSandboxOpen(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 text-[11px] font-bold transition flex items-center gap-1"
                      title="Open sandbox editor or switch variant"
                    >
                      <Sliders className="w-3 h-3 text-amber-400" />
                      <span>Sandbox / History</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => resetGame(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] font-semibold transition"
                      title="Reset to classical 8x8 standard chess"
                    >
                      <span>Standard Chess</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Detected Opening Book Banner */}
              {detectedOpening && (
                <div className="w-full max-w-[580px] bg-slate-900/90 border border-indigo-400/30 rounded-2xl p-3 flex items-start gap-3 backdrop-blur-md shadow-lg shadow-black/40 animate-in fade-in">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shrink-0 text-indigo-300 font-extrabold text-xs">
                    {detectedOpening.eco}
                  </div>
                  <div className="space-y-0.5 text-left flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{detectedOpening.name}</span>
                      <span className="text-[10px] text-indigo-300 font-mono bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-400/30 font-bold">
                        Opening Book
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight">{detectedOpening.description}</p>
                  </div>
                </div>
              )}

              {/* Review Mode Banner */}
              {isReviewMode && (
                <div className="w-full max-w-[580px] bg-indigo-500/15 backdrop-blur-md border border-indigo-400/30 text-indigo-200 text-xs py-2.5 px-4 rounded-2xl flex items-center justify-between shadow-lg">
                  <span>Viewing Move {currentMoveIndex + 1} history preview</span>
                  <button
                    onClick={() => handleSelectMoveIndex(moveRecords.length - 1)}
                    className="font-bold underline hover:text-white transition"
                  >
                    Jump to Live
                  </button>
                </div>
              )}

              {/* Chess Board & Real-Time Eval Meter */}
              <div className="flex items-center gap-2.5 sm:gap-4 w-full justify-center">
                {/* Real-time Engine Advantage Meter */}
                <EvalBar evalResult={evalResult} orientation={orientation} />

                <ChessBoard
                  chess={
                    isReviewMode
                      ? (() => {
                          const c = new Chess();
                          for (let i = 0; i <= currentMoveIndex; i++) {
                            const m = moveRecords[i];
                            if (m) c.move({ from: m.from as Square, to: m.to as Square, promotion: m.promotion });
                          }
                          return c;
                        })()
                      : chessRef.current
                  }
                  orientation={orientation}
                  boardTheme={settings.boardTheme}
                  onMove={executeMove}
                  showLegalMoves={settings.showLegalMoves && !isReviewMode}
                  showLastMove={settings.showLastMove}
                  lastMove={lastMove}
                  kingInCheckSquare={isReviewMode ? null : kingInCheckSquare}
                  readOnly={isReadOnlyBoard}
                  onFlipOrientation={() => setOrientation((prev) => (prev === 'w' ? 'b' : 'w'))}
                  onChangeTheme={(newTheme) => setSettings((prev) => ({ ...prev, boardTheme: newTheme }))}
                  onOpenMasterHub={() => setIsMasterHubOpen(true)}
                  onOpenQuests={() => setIsQuestsOpen(true)}
                  onOpenDailyWheel={() => setIsDailyWheelOpen(true)}
                />
              </div>
            </>
          )}

          {activeBoardGame === 'checkers' && (
            <div className="w-full animate-fadeIn">
              <CheckersBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('checkers', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'backgammon' && (
            <div className="w-full animate-fadeIn">
              <BackgammonBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('backgammon', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'snakes' && (
            <div className="w-full animate-fadeIn">
              <SnakesAndLaddersBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('snakes', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'ludo' && (
            <div className="w-full animate-fadeIn">
              <LudoBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('ludo', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'gomoku' && (
            <div className="w-full animate-fadeIn">
              <GomokuBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('gomoku', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'reversi' && (
            <div className="w-full animate-fadeIn">
              <ReversiBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('reversi', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'connect4' && (
            <div className="w-full animate-fadeIn">
              <ConnectFourBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('connect4', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'ultimatetictactoe' && (
            <div className="w-full animate-fadeIn">
              <UltimateTicTacToeBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('ultimatetictactoe', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'dotsandboxes' && (
            <div className="w-full animate-fadeIn">
              <DotsAndBoxesBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('dotsandboxes', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'battleship' && (
            <div className="w-full animate-fadeIn">
              <BattleshipBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('battleship', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'sim' && (
            <div className="w-full animate-fadeIn">
              <SimBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('sim', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'uno' && (
            <div className="w-full animate-fadeIn">
              <UnoBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('uno', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'hearts' && (
            <div className="w-full animate-fadeIn">
              <HeartsBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('hearts', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'ginrummy' && (
            <div className="w-full animate-fadeIn">
              <GinRummyBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('ginrummy', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'speed' && (
            <div className="w-full animate-fadeIn">
              <SpeedBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('speed', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'carrom' && (
            <div className="w-full animate-fadeIn">
              <CarromBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('carrom', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'darts' && (
            <div className="w-full animate-fadeIn">
              <DartsBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('darts', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'pingpong' && (
            <div className="w-full animate-fadeIn">
              <PingPongBoard
                gameMode={gameMode}
                onGameEnd={(w, reason) => handleBoardGameEnd('pingpong', w, reason)}
              />
            </div>
          )}

          {activeBoardGame === 'business' && (
            <div className="w-full animate-fadeIn">
              <BusinessBoard
                gameMode={gameMode}
                currentUser={currentUser}
                onGameEnd={(w, reason) => handleBoardGameEnd('business', w, reason)}
              />
            </div>
          )}
            </div>
          </div>

          {/* Action Row: Reset, Rules, Arcade Booth, 96 FX Hub & Motion Library */}
          <div className="w-full max-w-[580px] grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
            <button
              onClick={() => {
                hasPaidGameFeeRef.current = false;
                setHasPaidGameFee(false);
                resetGame();
                setIsEntryFeeModalOpen(true);
              }}
              className="py-2.5 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-xs border border-white/10 hover:border-amber-400/40 shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Reset & Fee</span>
            </button>

            <button
              onClick={() => setIsRulesModalOpen(true)}
              className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 text-[#ffe89e] font-extrabold text-xs border border-[#f3ce6b]/40 shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-[#f3ce6b]" />
              <span>📖 Rules</span>
            </button>

            <button
              onClick={() => setIsArcadeCanvasOpen(true)}
              className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500/30 via-red-500/30 to-amber-500/30 hover:from-amber-500/40 hover:to-red-500/40 text-amber-200 font-black text-xs border border-amber-400/50 shadow-lg shadow-amber-500/10 transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Gamepad2 className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>🕹️ Arcade</span>
            </button>

            <button
              onClick={() => setIsMasterHubOpen(true)}
              className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-200 font-extrabold text-xs border border-emerald-400/40 shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>96 FX</span>
            </button>

            <button
              onClick={() => setIsAnimationLibraryOpen(true)}
              className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 text-cyan-200 font-extrabold text-xs border border-cyan-400/40 shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1"
            >
              <Wand2 className="w-4 h-4 text-cyan-300" />
              <span>✨ VFX</span>
            </button>
          </div>

          {/* Real-time In-Game Reactions & Taunts Bar */}
          <div className="w-full max-w-[580px] flex items-center justify-between px-1 mt-1">
            <InGameReactionsBar />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCosmeticsShopOpen(true)}
                className="text-[11px] font-mono text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-lg transition"
              >
                🛍️ Cosmetics
              </button>
              <button
                onClick={() => setIsRankedLadderOpen(true)}
                className="text-[11px] font-mono text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 px-2 py-0.5 rounded-lg transition"
              >
                👑 Ranked
              </button>
            </div>
          </div>

          {/* Dynamic Player Status Cards & Adaptive Control Deck */}
          <div className="w-full max-w-[580px] mt-2">
            <PlayerStatusCardDeck
              activeBoardGame={activeBoardGame}
              gameMode={gameMode}
              currentUser={currentUser}
              whiteTime={whiteTime}
              blackTime={blackTime}
              activeTurn={activeTurn}
              isGameActive={isGameActive && gameResult.winner === null}
              isPaused={isPaused}
              onTogglePause={() => setIsPaused(!isPaused)}
              onResign={() => handleTimeout('w')}
              onOfferDraw={() => alert('Draw offer sent to opponent!')}
            />
          </div>
          </div>
        </div>

        {/* Right Column: Clocks, Captured Pieces, Move History & Real-Time Chat */}
        <div className="flex flex-col gap-4 w-full">
          {/* Chess Clocks - Only shown for Chess */}
          {activeBoardGame === 'chess' && (
            <ChessClock
              whitePlayer={settings.whitePlayer}
              blackPlayer={settings.blackPlayer}
              whiteTime={whiteTime}
              blackTime={blackTime}
              activeTurn={activeTurn}
              isGameActive={hasPaidGameFee && isGameActive && gameResult.winner === null}
              isPaused={isPaused}
              isUntimed={isUntimed}
              onTimeout={handleTimeout}
              onTogglePause={() => setIsPaused(!isPaused)}
            />
          )}

          {/* Captured Pieces - Only shown for Chess */}
          {activeBoardGame === 'chess' && (
            <CapturedPieces
              capturedByWhite={capturedPieces.white}
              capturedByBlack={capturedPieces.black}
            />
          )}

          {/* Real-Time Room Chat */}
          <ChatPanel
            roomId={activeRoomId}
            currentUserHandle={currentUser?.username || 'Guest'}
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            disabled={!currentUser}
            socket={socketService.getSocket()}
            activeBoardGame={activeBoardGame}
            gameTitle="Chess Pro Arena"
            moveCount={moveRecords.length}
            gameResult={gameResult}
            stats={currentUser?.stats || null}
            communityNotice={roomNotice}
            allowChat={roomRules ? roomRules.allowChat : true}
          />

          {/* 3D Spatial Proximity Voice Lounge & AI Moderation Shield */}
          <VoiceProximityPanel
            currentUsername={currentUser?.username || 'Guest'}
            roomId={activeRoomId || 'default_lounge'}
          />

          {/* AI Strategic Coach Panel */}
          <CoachPanel
            activeGame={activeBoardGame}
            gameTitle="Chess Pro Arena"
            moveHistory={moveRecords.map((m) => m.san)}
          />

          {/* Move Log & Export - Only shown for Chess */}
          {activeBoardGame === 'chess' && (
            <MoveHistory
              moves={moveRecords}
              currentMoveIndex={currentMoveIndex}
              onSelectMove={handleSelectMoveIndex}
              pgn={pgn}
              fen={fen}
            />
          )}
        </div>
      </main>

      {/* Lower Dashboard & Community Modules */}
      <div className="max-w-7xl w-full mx-auto px-4 md:px-6 space-y-6 mt-4">
        {/* Live Matches & Spectator Statistics */}
        <LiveMatchesAndStatsSection
          currentUser={currentUser}
          chatMessages={chatMessages}
          onSendMessage={handleSendMessage}
          onOpenStats={() => setIsStatsModalOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenMatchmaking={() => setIsMatchmakingOpen(true)}
          onOpenTournament={() => setIsTournamentOpen(true)}
        />

        {/* Daily Quests & Tournament Brackets Banner */}
        <QuestsAndTournamentBanner
          onOpenDailyQuests={() => setIsQuestsOpen(true)}
          onOpenTournament={() => setIsTournamentOpen(true)}
          onOpenAchievements={() => setIsStatsModalOpen(true)}
          onStartGame={() => {
            setGameMode('pvp');
            setIsMatchmakingOpen(true);
          }}
        />

        {/* Duo Chess Promo & Invite Banner */}
        <DuoChessPromoBanner
          currentUser={currentUser}
          onPlayNow={() => {
            setGameMode('pvp');
            setIsMatchmakingOpen(true);
          }}
          onOpenChat={() => {
            setIsGlobalChatOpen(true);
          }}
          onOpenInvite={() => {
            setIsReferModalOpen(true);
          }}
        />

        {/* Progression, Shop, Streaks & Social Hub Grid */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Cosmetics Emporium */}
          <div 
            onClick={() => setIsCosmeticsShopOpen(true)}
            className="p-4 rounded-2xl bg-[#080d1a]/90 hover:bg-slate-900 border border-amber-500/30 hover:border-amber-400/70 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 shadow-lg shadow-amber-950/20 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-lg">🛍️</span>
              <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">SHOP</span>
            </div>
            <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">Cosmetics Emporium</h4>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">Equip custom dice sets, vibrant board styles & trails using Coins & Gems</p>
          </div>

          {/* 7-Day Login Streak */}
          <div 
            onClick={() => setIsDailyStreakOpen(true)}
            className="p-4 rounded-2xl bg-[#080d1a]/90 hover:bg-slate-900 border border-orange-500/30 hover:border-orange-400/70 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 shadow-lg shadow-orange-950/20 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-lg">🔥</span>
              <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-400/30">STREAK</span>
            </div>
            <h4 className="text-sm font-black text-white group-hover:text-orange-300 transition-colors">7-Day Login Streak</h4>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">Log in daily to claim escalating coin bonuses and the Day 7 Mythic Chest</p>
          </div>

          {/* Friends & 1v1 Arena */}
          <div 
            onClick={() => setIsFriendsModalOpen(true)}
            className="p-4 rounded-2xl bg-[#080d1a]/90 hover:bg-slate-900 border border-sky-500/30 hover:border-sky-400/70 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 shadow-lg shadow-sky-950/20 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-lg">👥</span>
              <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">SOCIAL</span>
            </div>
            <h4 className="text-sm font-black text-white group-hover:text-sky-300 transition-colors">Friends & 1v1 Arena</h4>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">Add buddies, monitor live game status, and initiate direct 1v1 challenges</p>
          </div>

          {/* Ranked Ladder & RP Division */}
          <div 
            onClick={() => setIsRankedLadderOpen(true)}
            className="p-4 rounded-2xl bg-[#080d1a]/90 hover:bg-slate-900 border border-yellow-500/30 hover:border-yellow-400/70 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 shadow-lg shadow-yellow-950/20 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-9 h-9 rounded-xl bg-yellow-500/20 border border-yellow-400/40 flex items-center justify-center text-lg">👑</span>
              <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-400/30">SEASON 4</span>
            </div>
            <h4 className="text-sm font-black text-white group-hover:text-yellow-300 transition-colors">Ranked RP Divisions</h4>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">Ascend Bronze through Grandmaster, earn division trophies and season rewards</p>
          </div>
        </div>

        {/* Explore All 20 Playable Arena Games */}
        <ExploreGamesGrid
          activeBoardGame={activeBoardGame}
          onSelectGame={(game) => switchActiveGame(game)}
          onOpenMultiGameHub={() => setIsGameHubOpen(true)}
        />

        {/* Global Leaderboard & Recent Match History */}
        <LeaderboardAndRecentMatches
          currentUser={currentUser}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenRecentMatches={() => setIsStatsModalOpen(true)}
        />
      </div>

      {/* Pawn Promotion Dialog */}
      {pendingPromotion && (
        <PromotionModal
          color={activeTurn}
          onSelect={(piece) => {
            const { from, to } = pendingPromotion;
            setPendingPromotion(null);
            executeMove(from, to, piece);
          }}
        />
      )}

      {/* Game Over Dialog */}
      {gameResult.winner !== null && (
        <GameOverModal
          result={gameResult}
          gameType={activeBoardGame}
          userColor={gameMode === 'pvp' ? (myPvPColor === 'b' ? 'b' : 'w') : orientation}
          whitePlayer={
            activeBoardGame === 'chess'
              ? settings.whitePlayer
              : { name: currentUser?.username || 'Player 1' }
          }
          blackPlayer={
            activeBoardGame === 'chess'
              ? settings.blackPlayer
              : { name: gameMode === 'ai' ? 'Computer' : 'Player 2' }
          }
          moveCount={moveRecords.length || 12}
          onNewGame={() => {
            setGameResult({ winner: null, reason: null });
            hasPaidGameFeeRef.current = false;
            setHasPaidGameFee(false);
            resetGame(true);
            setIsEntryFeeModalOpen(true);
          }}
          onReviewBoard={() => {
            setGameResult({ winner: null, reason: null });
            hasPaidGameFeeRef.current = false;
            setHasPaidGameFee(false);
          }}
          onOpenCoinHistory={() => setIsCoinHistoryModalOpen(true)}
        />
      )}

      {/* User Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        user={currentUser}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPrivacyModalTab('privacy');
          setIsPrivacyModalOpen(true);
        }}
        onUserUpdated={(updatedUser) => {
          setCurrentUser(updatedUser);
          socketService.authenticate(updatedUser.token);
          setIsAuthModalOpen(false);
          setPrivacyModalTab('privacy');
          setIsPrivacyModalOpen(true);
        }}
        onLogout={() => {
          clearStoredToken();
          fetchGuestAuth().then((guest) => {
            if (guest && guest.isGuest && guest.username) {
              guest.username = formatGuestUsername(guest.username);
            }
            setCurrentUser(guest);
            socketService.authenticate(guest.token);
          });
          setIsAuthModalOpen(false);
        }}
        onOpenPrivacyTerms={(tab) => {
          setPrivacyModalTab(tab || 'privacy');
          setIsPrivacyModalOpen(true);
        }}
      />

      {/* Global Leaderboard Modal */}
      <LeaderboardModal
        activeBoardGame={activeBoardGame}
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentUserHandle={currentUser?.username}
      />

      {/* Global Real-Time User List Sidebar Ticker (All Menus) */}
      <GlobalUserListSidebar />

      {/* Global Real-Time Telemetry & Analytics Dashboard Modal */}
      <GlobalAnalyticsDashboardModal
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        username={currentUser?.username || 'Grandmaster'}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        gameType={activeBoardGame}
      />

      {/* Statistics & Match History Modal */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        onReplayMatch={handleReplayMatch}
      />

      {/* Matchmaking Modal */}
      <MatchmakingModal
        isOpen={isMatchmakingOpen}
        status={matchmakingStatus}
        createdRoomId={createdRoomCode}
        createdRoomNotice={roomNotice}
        createdRoomRules={roomRules || undefined}
        errorMessage={matchmakingError}
        onClose={() => setIsMatchmakingOpen(false)}
        onStartQuickMatch={() => {
          setMatchmakingError('');
          const socket = socketService.getSocket();
          socket?.emit('matchmaking:join');
        }}
        onCancelQuickMatch={() => {
          const socket = socketService.getSocket();
          socket?.emit('matchmaking:cancel');
          setMatchmakingStatus('idle');
        }}
        onCreatePrivateRoom={(config) => {
          setMatchmakingError('');
          if (config?.communityNotice !== undefined) {
            setRoomNotice(config.communityNotice);
          }
          if (config) {
            setRoomRules({
              minimumRating: config.minRating,
              allowChat: config.allowChat,
              maxPlayers: config.maxPlayers || 2,
            });
          }
          const socket = socketService.getSocket();
          socket?.emit('room:create', {
            title: config?.title,
            communityNotice: config?.communityNotice,
            roomRules: config
              ? {
                  minimumRating: config.minRating,
                  allowChat: config.allowChat,
                  maxPlayers: config.maxPlayers || 2,
                }
              : undefined,
          });
        }}
        onJoinPrivateRoom={(code, asSpectator) => {
          setMatchmakingError('');
          const socket = socketService.getSocket();
          socket?.emit('room:join', { roomId: code, asSpectator });
        }}
        onSendMessage={handleSendMessage}
      />

      {/* Settings Modal */}
      <GameSettingsModal
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          if (newSettings.timeControl.preset !== settings.timeControl.preset) {
            setWhiteTime(newSettings.timeControl.initialSeconds);
            setBlackTime(newSettings.timeControl.initialSeconds);
          }
        }}
      />

      {/* Ask Gemini Modal */}
      <AskGeminiModal
        activeBoardGame={activeBoardGame}
        isOpen={isAskGeminiOpen}
        onClose={() => setIsAskGeminiOpen(false)}
        fen={fen}
        pgn={pgn}
        turn={activeTurn}
        legalMoves={
          chessRef.current
            ? chessRef.current.moves({ verbose: true }).map((m) => `${m.piece.toUpperCase()}${m.to}`)
            : []
        }
      />

      {/* Puzzle Tactics Trainer Modal */}
      <PuzzleModal
        activeBoardGame={activeBoardGame}
        isOpen={isPuzzleOpen}
        onClose={() => setIsPuzzleOpen(false)}
      />

      {/* Import Position FEN / PGN Modal */}
      <PositionEditorModal
        isOpen={isPositionEditorOpen}
        onClose={() => setIsPositionEditorOpen(false)}
        onLoadFen={(newFen) => {
          chessRef.current.load(newFen);
          setFen(newFen);
          setPgn(chessRef.current.pgn());
          setMoveRecords([]);
          setCurrentMoveIndex(-1);
          setLastMove(null);
          setIsGameActive(true);
          setGameResult({ winner: null, reason: null });
        }}
        onLoadPgn={(newPgn) => {
          chessRef.current.loadPgn(newPgn);
          setFen(chessRef.current.fen());
          setPgn(newPgn);
          const history = chessRef.current.history({ verbose: true });
          const tempMoves: MoveRecord[] = history.map((m, idx) => ({
            san: m.san,
            from: m.from,
            to: m.to,
            piece: m.piece,
            captured: m.captured,
            promotion: m.promotion,
            color: m.color,
            fen: '',
            moveNumber: Math.ceil((idx + 1) / 2),
          }));
          setMoveRecords(tempMoves);
          setCurrentMoveIndex(tempMoves.length - 1);
          setIsGameActive(true);
          setGameResult({ winner: null, reason: null });
        }}
      />

      {/* Custom Chess Variant Sandbox Modal */}
      <CustomChessVariantSandboxModal
        isOpen={isCustomSandboxOpen}
        onClose={() => setIsCustomSandboxOpen(false)}
        onApplyVariant={(variant) => {
          setActiveBoardGame('chess');
          setActiveCustomVariant({
            name: variant.name || 'Custom Chess Variant',
            boardSize: variant.boardSize,
            timeLimit: variant.timeLimit,
            layout: variant.layout,
            theme: variant.theme,
            fen: variant.fen,
          });

          if (variant.theme) {
            setSettings((prev) => ({ ...prev, boardTheme: variant.theme! }));
          }
          if (variant.timeLimit) {
            setSettings((prev) => ({
              ...prev,
              timeControl: {
                ...prev.timeControl,
                initialSeconds: variant.timeLimit,
              },
            }));
            setWhiteTime(variant.timeLimit);
            setBlackTime(variant.timeLimit);
          }

          if (variant.boardSize === 8) {
            const customFen = variant.fen || layoutToFen(variant.layout, 8);
            try {
              chessRef.current.load(customFen);
              setFen(chessRef.current.fen());
              setPgn('');
              setMoveRecords([]);
              setCurrentMoveIndex(-1);
              setLastMove(null);
              setIsGameActive(true);
              setIsPaused(false);
              setGameResult({ winner: null, reason: null });
            } catch (err) {
              console.warn('Custom layout applied to sandbox configuration.', err);
            }
          }
        }}
      />

      {/* Integrated Multi-Game Arena Hub Modal */}
      <MultiGameHubModal
        isOpen={isGameHubOpen}
        onClose={() => setIsGameHubOpen(false)}
        onSelectMode={(mode) => {
          setGameMode(mode);
          resetGame();
        }}
        onSelectGame={(game) => setActiveBoardGame(game)}
        onOpenWheelLobby={() => setIsWheelCatalogOpen(true)}
        onOpenMatchmaking={() => setIsMatchmakingOpen(true)}
        onOpenPuzzles={() => setIsPuzzleOpen(true)}
        onOpenAskGemini={() => setIsAskGeminiOpen(true)}
        onOpenPositionEditor={() => setIsPositionEditorOpen(true)}
        onOpenCustomSandbox={() => setIsCustomSandboxOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenStats={() => setIsStatsModalOpen(true)}
        activeLobbyCount={lobbyUsers.length || 8}
      />

      {/* Rules & Strategy Modal */}
      <GameRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        activeGame={activeBoardGame}
      />

      {/* 2D Canvas Arcade Engine & Retro Booth Modal */}
      <ArcadeCanvasModal
        isOpen={isArcadeCanvasOpen}
        onClose={() => setIsArcadeCanvasOpen(false)}
        onLaunchFullGame={(game) => {
          setActiveBoardGame(game);
          setIsArcadeCanvasOpen(false);
        }}
        initialGame={activeBoardGame}
      />

      {/* Master Web Animation & Transition Library Modal */}
      <AnimationLibraryModal
        isOpen={isAnimationLibraryOpen}
        onClose={() => setIsAnimationLibraryOpen(false)}
        onOpenMasterHub={() => setIsMasterHubOpen(true)}
      />

      {/* 96-Item Master Customization Hub (Shop, Inventory & Sandbox) Modal */}
      <AnimationEffectsMasterHubModal
        isOpen={isMasterHubOpen}
        onClose={() => setIsMasterHubOpen(false)}
        onOpenDailyWheel={() => {
          setIsMasterHubOpen(false);
          setIsDailyWheelOpen(true);
        }}
        onOpenQuests={() => {
          setIsMasterHubOpen(false);
          setIsQuestsOpen(true);
        }}
      />

      {/* Daily Wheel of Rewards (24h Cooldown Spin) Modal */}
      <DailyWheelModal
        isOpen={isDailyWheelOpen}
        onClose={() => setIsDailyWheelOpen(false)}
        onOpenQuestsOrHatrick={() => {
          setIsDailyWheelOpen(false);
          setIsQuestsOpen(true);
        }}
      />

      {/* Coin Ledger & Rewards Hub (Immutable Audit Trail, 7-Day Ladder, Quests, Ads) */}
      <CoinHistoryModal
        isOpen={isCoinHistoryModalOpen}
        onClose={() => setIsCoinHistoryModalOpen(false)}
        username={currentUser?.username || 'Player'}
      />

      {/* Simultaneous Hatrick Achievement Banner Toast */}
      {hatrickNotification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[160] animate-bounce max-w-md w-full px-4">
          <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-slate-950 p-4 rounded-3xl shadow-[0_0_40px_rgba(245,158,11,0.6)] border-2 border-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center text-2xl shrink-0">
                🔥
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-wide">
                  Hatrick Complete! 3 Consecutive Captures!
                </h4>
                <p className="text-xs font-bold text-slate-900/90">
                  +{(hatrickNotification.reward ?? 2000).toLocaleString()} PTS added to your wallet!
                </p>
              </div>
            </div>
            <button
              onClick={() => setHatrickNotification(null)}
              className="p-1 rounded-lg bg-black/10 hover:bg-black/20 text-slate-950"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Privacy Policy, Terms & Conditions & App Flow Modal */}
      <PrivacyTermsModal
        isOpen={isPrivacyModalOpen}
        onClose={() => {
          if (!isCompulsoryPrivacy) {
            setIsPrivacyModalOpen(false);
          }
        }}
        defaultTab={privacyModalTab}
        isCompulsory={isCompulsoryPrivacy}
        onAgree={() => {
          setIsCompulsoryPrivacy(false);
          setIsPrivacyModalOpen(false);
          trackGameOpened(activeBoardGame);
        }}
      />

      {/* Social, Community, Quests, Badges & Activity Feed Hub Modal */}
      <CommunitySocialModal
        isOpen={isSocialHubOpen}
        onClose={() => setIsSocialHubOpen(false)}
      />

      {/* Global Arena Chat Slide-out Drawer with Auto-Moderation */}
      <GlobalChatDrawer
        isOpen={isGlobalChatOpen}
        onClose={() => setIsGlobalChatOpen(false)}
        currentUser={currentUser}
      />

      {/* Esports Tournament Bracket Arena Modal */}
      <TournamentModal
        isOpen={isTournamentOpen}
        onClose={() => setIsTournamentOpen(false)}
      />

      {/* Daily Quests & Rank Progression Modal */}
      <QuestPanel
        isOpen={isQuestsOpen}
        onClose={() => setIsQuestsOpen(false)}
      />

      {/* Audio Soundpack & Board Texture Customizer Modal */}
      <CustomizationModal
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
      />

      {/* Floating UI Menu for Google Suite & Telemetry Analytics */}
      <FloatingSuiteAndTelemetryMenu
        onOpenTelemetryTab={(tab) => {
          setTelemetryInitialTab(tab);
          setIsTelemetryOpen(true);
        }}
        onOpenGoogleTab={(tab) => {
          setGoogleInitialTab(tab);
          setIsGoogleAuthOpen(true);
        }}
        onOpenGoogleForms={() => setIsGoogleFormsOpen(true)}
        onRestoreLocalData={(cloudData) => {
          if (cloudData.localStorageDump) {
            Object.keys(cloudData.localStorageDump).forEach((key) => {
              localStorage.setItem(key, cloudData.localStorageDump[key]);
            });
          }
        }}
        getLocalDataToBackup={() => ({
          savedAt: new Date().toISOString(),
          localStorageDump: { ...localStorage },
          settings,
          gameMode,
        })}
      />

      {/* Universal Website AI Element Bot & Safe Guide */}
      <AIElementBot />

      {/* Real-Time Global Telemetry & Concurrency Analytics Modal */}
      <GlobalAnalyticsDashboardModal
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
        initialTab={telemetryInitialTab}
      />

      {/* Google Account & Play Services Suite Modal */}
      <GoogleConnectModal
        isOpen={isGoogleAuthOpen}
        onClose={() => setIsGoogleAuthOpen(false)}
        initialTab={googleInitialTab}
        onOpenGoogleForms={() => setIsGoogleFormsOpen(true)}
        onRestoreLocalData={(cloudData) => {
          if (cloudData.localStorageDump) {
            Object.keys(cloudData.localStorageDump).forEach((key) => {
              localStorage.setItem(key, cloudData.localStorageDump[key]);
            });
          }
        }}
        getLocalDataToBackup={() => ({
          savedAt: new Date().toISOString(),
          localStorageDump: { ...localStorage },
          settings,
          gameMode
        })}
      />

      {/* Google Forms API v1 & Drive Workspace Integration Modal */}
      <GoogleFormsModal
        isOpen={isGoogleFormsOpen}
        onClose={() => setIsGoogleFormsOpen(false)}
      />

      {/* Security Compromise Warning Modal */}
      {compromiseAlert && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/50 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-400/40 flex items-center justify-center mx-auto text-red-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">
              Token Reuse Anomaly Detected
            </h3>
            <p className="text-xs text-red-200/80 leading-relaxed">
              {compromiseAlert}
            </p>
            <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-2xl text-[11px] text-white/70">
              The platform's Automated Breach Defense activated, revoking all active sessions across all devices for your protection.
            </div>
            <button
              onClick={() => {
                setCompromiseAlert(null);
                setIsAuthModalOpen(true);
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-2xl transition shadow-lg"
            >
              Acknowledge & Re-authenticate
            </button>
          </div>
        </div>
      )}

      {/* Wheel of Luck Main 16-Game Catalog Modal */}
      <WheelOfLuckMainCatalog
        isOpen={isWheelCatalogOpen}
        onClose={() => setIsWheelCatalogOpen(false)}
        onSelectGameToLobby={(game) => {
          setSelectedWheelGame(game);
          setIsWheelGameLobbyOpen(true);
        }}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenStats={() => setIsStatsModalOpen(true)}
      />

      {/* Wheel of Luck Game-Specific Matchmaking Lobby Modal */}
      <WheelOfLuckGameLobbyModal
        isOpen={isWheelGameLobbyOpen}
        onClose={() => setIsWheelGameLobbyOpen(false)}
        selectedGame={selectedWheelGame}
        currentUserUsername={currentUser?.username || 'Guest'}
        onTeleportToMatch={(gameId) => {
          setIsWheelGameLobbyOpen(false);
          setIsWheelCatalogOpen(false);
          setIsGameHubOpen(false);
          setActiveBoardGame(gameId);
          setGameMode('pvp');
          resetGame();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Universal Bi-Directional Currency Exchange Hub Modal */}
      <CurrencyExchangeModal
        isOpen={isExchangeModalOpen}
        onClose={() => setIsExchangeModalOpen(false)}
        defaultDirection={exchangeDirection}
      />

      {/* Site Owner Authentication & Verification Modal */}
      <OwnerVerificationModal
        isOpen={isOwnerVerifyOpen}
        onClose={() => setIsOwnerVerifyOpen(false)}
        onSuccess={() => {
          setIsOwnerVerifyOpen(false);
          setIsAdminPanelOpen(true);
        }}
      />

      {/* Command & Control Center (Site Owner & Admin Hub) Modal */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        currentUsername={currentUser?.username}
      />

      {/* Cosmetics & Theme Emporium Modal */}
      <CosmeticsShopModal
        isOpen={isCosmeticsShopOpen}
        onClose={() => setIsCosmeticsShopOpen(false)}
        onEquip={() => {
          if (currentUser) {
            setCurrentUser({
              ...currentUser,
              gamerPoints: getUserPoints(),
              gems: getUserGems(),
            });
          }
        }}
      />

      {/* 7-Day Login Streak Rewards Modal */}
      <DailyStreakModal
        isOpen={isDailyStreakOpen}
        onClose={() => setIsDailyStreakOpen(false)}
        onClaim={(coins, gems) => {
          if (currentUser) {
            setCurrentUser({
              ...currentUser,
              gamerPoints: getUserPoints(),
              gems: getUserGems(),
            });
          }
        }}
      />

      {/* Friends & 1v1 Social Challenges Modal */}
      <FriendsModal
        isOpen={isFriendsModalOpen}
        onClose={() => setIsFriendsModalOpen(false)}
        onChallengeFriend={(friend, game) => {
          setIsFriendsModalOpen(false);
          setActiveBoardGame(game as any);
          setGameMode('pvp');
          resetGame();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Ranked Competitive Ladder & RP Divisions Modal */}
      <RankedLadderModal
        isOpen={isRankedLadderOpen}
        onClose={() => setIsRankedLadderOpen(false)}
        onPlayRanked={() => {
          setIsRankedLadderOpen(false);
          setGameMode('pvp');
          setIsMatchmakingOpen(true);
        }}
      />

      {/* Refer and Earn Rewards Modal */}
      <ReferAndEarnModal
        isOpen={isReferModalOpen}
        onClose={() => setIsReferModalOpen(false)}
        user={currentUser}
        userCoins={currentUser?.gamerPoints || 350}
        onClaimReward={(amount) => {
          if (currentUser) {
            setCurrentUser({
              ...currentUser,
              gamerPoints: (currentUser.gamerPoints || 0) + amount,
            });
          }
        }}
      />

      {/* Game Entry Fee Deduction Modal */}
      <GameEntryFeeModal
        isOpen={isEntryFeeModalOpen}
        gameTitle={getGameDisplayTitle(activeBoardGame)}
        gameMode={gameMode}
        onClose={() => {
          setIsEntryFeeModalOpen(false);
          setPendingGameStartAction(null);
        }}
        onConfirmStart={() => {
          hasPaidGameFeeRef.current = true;
          setHasPaidGameFee(true);
          if (currentUser) {
            setCurrentUser((prev) =>
              prev
                ? {
                    ...prev,
                    gamerPoints: getUserPoints(),
                    gems: getUserGems(),
                  }
                : null
            );
          }
          if (pendingGameStartAction) {
            pendingGameStartAction();
          }
          setPendingGameStartAction(null);
        }}
        onOpenWheel={() => setIsDailyWheelOpen(true)}
        onOpenTasks={() => setIsQuestsOpen(true)}
        onOpenExchange={() => {
          setExchangeDirection('gemToCoin');
          setIsExchangeModalOpen(true);
        }}
      />

      {/* Game Entry & Insufficient Balance Modal (gameEntryModal) */}
      <GameEntryModal
        onOpenWheel={() => setIsDailyWheelOpen(true)}
        onMatchStarted={() => {
          hasPaidGameFeeRef.current = true;
          setHasPaidGameFee(true);
          resetGame(true);
        }}
      />

      {/* About Us Section */}
      <AboutUsSection
        onOpenWheelLobby={() => setIsWheelCatalogOpen(true)}
        onOpenAskGemini={() => setIsAskGeminiOpen(true)}
        onOpenGameHub={() => setIsGameHubOpen(true)}
      />

      {/* Comprehensive SEO Content & Footer Section */}
      <SEOFooter
        onOpenWheelLobby={() => setIsWheelCatalogOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenMatchmaking={() => setIsMatchmakingOpen(true)}
        onOpenGameHub={() => setIsGameHubOpen(true)}
        onOpenPuzzles={() => setIsPuzzleOpen(true)}
        onOpenStats={() => setIsStatsModalOpen(true)}
        onOpenTournaments={() => setIsTournamentOpen(true)}
        onOpenAchievements={() => setIsStatsModalOpen(true)}
        onOpenGoogleForms={() => setIsGoogleFormsOpen(true)}
        onOpenPrivacyTerms={(tab) => {
          setPrivacyModalTab(tab || 'privacy');
          setIsPrivacyModalOpen(true);
        }}
      />

      {/* Emergency Mode Lockdown Screen Freeze UI */}
      {emergencyLockdown?.active && (
        <EmergencyLockdownOverlay
          reason={emergencyLockdown.reason}
          initiatedBy={emergencyLockdown.initiatedBy}
          unlockAt={emergencyLockdown.unlockAt}
          durationMinutes={emergencyLockdown.durationMinutes}
          onUnlocked={() => setEmergencyLockdown(null)}
        />
      )}
    </div>
  );
}
