/**
 * Centralized State Dispatcher & Unified Game Controller
 * Solves the "Upward vs. Downward" Sync Bug across Header, Hero, and Bottom Grid.
 */

import { auth, joinGameAndDeductFee } from './firebase';
import { executeGameSwitchFee } from './entryFeeEngine';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { ActiveBoardGame } from '../types';
import { soundFx } from '../utils/audio';

export interface GameMetadata {
  id: string; // Uppercase canonical ID e.g. "DRAUGHTS", "DUO_CHESS"
  boardId: ActiveBoardGame;
  title: string;
  icon: string;
  entryFee: number;
  currency: 'coins' | 'gems';
  playerSlots: string;
  category: string;
}

export const CANONICAL_GAMES: Record<string, GameMetadata> = {
  DRAUGHTS: {
    id: 'DRAUGHTS',
    boardId: 'checkers',
    title: 'Draughts Arena',
    icon: '👑',
    entryFee: 50,
    currency: 'coins',
    playerSlots: '2 Players',
    category: 'Strategy',
  },
  CHECKERS: {
    id: 'DRAUGHTS',
    boardId: 'checkers',
    title: 'Draughts Arena',
    icon: '👑',
    entryFee: 50,
    currency: 'coins',
    playerSlots: '2 Players',
    category: 'Strategy',
  },
  DUO_CHESS: {
    id: 'DUO_CHESS',
    boardId: 'chess',
    title: 'Duo Chess Pro',
    icon: '♟️',
    entryFee: 100,
    currency: 'coins',
    playerSlots: '2 Players',
    category: 'Strategy',
  },
  CHESS: {
    id: 'DUO_CHESS',
    boardId: 'chess',
    title: 'Duo Chess Pro',
    icon: '♟️',
    entryFee: 100,
    currency: 'coins',
    playerSlots: '2 Players',
    category: 'Strategy',
  },
  CHESS_PRO: {
    id: 'DUO_CHESS',
    boardId: 'chess',
    title: 'Duo Chess Pro',
    icon: '♟️',
    entryFee: 100,
    currency: 'coins',
    playerSlots: '2 Players',
    category: 'Strategy',
  },
  CARROM: {
    id: 'CARROM',
    boardId: 'carrom',
    title: 'Carrom Striker',
    icon: '🎯',
    entryFee: 50,
    currency: 'coins',
    playerSlots: '2-4 Players',
    category: 'Carrom Board',
  },
  LUDO: {
    id: 'LUDO',
    boardId: 'ludo',
    title: 'Ludo Classic',
    icon: '🎲',
    entryFee: 50,
    currency: 'coins',
    playerSlots: '2-4 Players',
    category: 'Board',
  },
  SNAKES: {
    id: 'SNAKES',
    boardId: 'snakes',
    title: 'Snakes & Ladders',
    icon: '🐍',
    entryFee: 40,
    currency: 'coins',
    playerSlots: '2-4 Players',
    category: 'Board',
  },
  BACKGAMMON: {
    id: 'BACKGAMMON',
    boardId: 'backgammon',
    title: 'Backgammon Club',
    icon: '🎲',
    entryFee: 75,
    currency: 'coins',
    playerSlots: '2 Players',
    category: 'Strategy',
  },
  SPEED: {
    id: 'SPEED',
    boardId: 'speed',
    title: '9-Ball Pool / Speed',
    icon: '🎱',
    entryFee: 60,
    currency: 'coins',
    playerSlots: '2 Players',
    category: 'Tabletop',
  },
  DARTS: {
    id: 'DARTS',
    boardId: 'darts',
    title: 'Darts Championship',
    icon: '🎯',
    entryFee: 50,
    currency: 'coins',
    playerSlots: '2 Players',
    category: 'Arcade',
  },
  PINGPONG: {
    id: 'PINGPONG',
    boardId: 'pingpong',
    title: 'Table Tennis Pro',
    icon: '🏓',
    entryFee: 50,
    currency: 'coins',
    playerSlots: '2 Players',
    category: 'Arcade',
  },
  SIM: {
    id: 'SIM',
    boardId: 'sim',
    title: 'Air Hockey / Sim',
    icon: '🏒',
    entryFee: 50,
    currency: 'coins',
    playerSlots: '2 Players',
    category: 'Arcade',
  },
  DOTSANDBOXES: {
    id: 'DOTSANDBOXES',
    boardId: 'dotsandboxes',
    title: 'Foosball / Dots & Boxes',
    icon: '⚽',
    entryFee: 40,
    currency: 'coins',
    playerSlots: '2 Players',
    category: 'Paper & Pen',
  },
  GOMOKU: {
    id: 'GOMOKU',
    boardId: 'gomoku',
    title: 'Mini Golf / Gomoku',
    icon: '⛳',
    entryFee: 50,
    currency: 'coins',
    playerSlots: '2 Players',
    category: 'Strategy',
  },
  BATTLESHIP: {
    id: 'BATTLESHIP',
    boardId: 'battleship',
    title: 'Battleship Fleet',
    icon: '🚢',
    entryFee: 60,
    currency: 'coins',
    playerSlots: '2 Players',
    category: 'Strategy',
  },
  REVERSI: {
    id: 'REVERSI',
    boardId: 'reversi',
    title: 'Reversi Masters',
    icon: '☯️',
    entryFee: 50,
    currency: 'coins',
    playerSlots: '2 Players',
    category: 'Strategy',
  },
  CONNECT_FOUR: {
    id: 'CONNECT_FOUR',
    boardId: 'connect4',
    title: 'Connect Four Arena',
    icon: '🔵',
    entryFee: 40,
    currency: 'coins',
    playerSlots: '2 Players',
    category: 'Strategy',
  },
  CONNECT4: {
    id: 'CONNECT_FOUR',
    boardId: 'connect4',
    title: 'Connect Four Arena',
    icon: '🔵',
    entryFee: 40,
    currency: 'coins',
    playerSlots: '2 Players',
    category: 'Strategy',
  },
  ULTIMATETICTACTOE: {
    id: 'ULTIMATETICTACTOE',
    boardId: 'ultimatetictactoe',
    title: 'Ultimate Tic Tac Toe',
    icon: '❌',
    entryFee: 30,
    currency: 'coins',
    playerSlots: '2 Players',
    category: 'Strategy',
  },
  UNO: {
    id: 'UNO',
    boardId: 'uno',
    title: 'Uno Card Arena',
    icon: '🔥',
    entryFee: 50,
    currency: 'coins',
    playerSlots: '2-4 Players',
    category: 'Card Game',
  },
  HEARTS: {
    id: 'HEARTS',
    boardId: 'hearts',
    title: 'Hearts Royale',
    icon: '♥',
    entryFee: 50,
    currency: 'coins',
    playerSlots: '4 Players',
    category: 'Card Game',
  },
  GINRUMMY: {
    id: 'GINRUMMY',
    boardId: 'ginrummy',
    title: 'Gin Rummy Club',
    icon: '🃏',
    entryFee: 60,
    currency: 'coins',
    playerSlots: '2 Players',
    category: 'Card Game',
  },
  BUSINESS: {
    id: 'BUSINESS',
    boardId: 'business',
    title: 'Business Tycoon',
    icon: '👑',
    entryFee: 200,
    currency: 'coins',
    playerSlots: '2-4 Players',
    category: 'Board',
  },
  CAR_TUNING: {
    id: 'CAR_TUNING',
    boardId: 'chess', // mapped to interactive view
    title: 'Car Tuning Showdown',
    icon: '🏎️',
    entryFee: 10,
    currency: 'gems',
    playerSlots: 'Multiplayer',
    category: 'Showdown',
  },
};

/**
 * Resolve any string ID (from data-game-id, button ID, or board name) to a canonical GameMetadata
 */
export function resolveGameMetadata(rawId: string): GameMetadata {
  const clean = String(rawId || '').trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  if (CANONICAL_GAMES[clean]) {
    return CANONICAL_GAMES[clean];
  }

  // Check boardId matches
  const lower = String(rawId || '').toLowerCase().trim();
  for (const key of Object.keys(CANONICAL_GAMES)) {
    const meta = CANONICAL_GAMES[key];
    if (meta.boardId === lower) {
      return meta;
    }
  }

  // Fallback to DUO_CHESS
  return CANONICAL_GAMES.DUO_CHESS;
}

let isDispatching = false;

export interface SetActiveGameOptions {
  skipModal?: boolean;
  paymentType?: 'coins' | 'gems';
  amount?: number;
  gameConfig?: Partial<GameMetadata>;
}

/**
 * Global Centralized State Dispatcher
 * Can be invoked anywhere: top hero cards, header, or bottom explore grid.
 */
export async function setActiveGame(
  rawGameId: string,
  options?: SetActiveGameOptions | Partial<GameMetadata>
): Promise<{ success: boolean; error?: string }> {
  const isSkipModal =
    options &&
    typeof options === 'object' &&
    'skipModal' in options &&
    (options as SetActiveGameOptions).skipModal === true;

  const passedConfig =
    options && typeof options === 'object' && 'gameConfig' in options
      ? (options as SetActiveGameOptions).gameConfig
      : (options as Partial<GameMetadata>);

  const meta = { ...resolveGameMetadata(rawGameId), ...passedConfig };

  // If entry fee selection modal has not been confirmed yet, trigger the GameEntryModal
  if (!isSkipModal && typeof (window as any).GameEconomy?.requestGameStart === 'function') {
    (window as any).GameEconomy.requestGameStart(meta.id, meta.title);
    return { success: true };
  }

  if (isDispatching) {
    console.warn('[setActiveGame] Dispatch already in progress, queuing or ignoring.');
    return { success: false, error: 'Transition in progress.' };
  }

  console.log(`[CentralizedDispatcher] Switching to active game: ${meta.title} (${meta.id})`);

  try {
    isDispatching = true;
    soundFx.playMove();

    // 1. Visually indicate loading on all clicked buttons
    const triggerButtons = document.querySelectorAll(
      `[data-game-id="${meta.boardId}"], [data-game-id="${meta.id}"], #btn-launch-${meta.id}, .hero-game-btn`
    );
    triggerButtons.forEach((btn) => {
      btn.setAttribute('disabled', 'true');
      btn.classList.add('opacity-70', 'cursor-wait');
    });

    // 2. Perform Game Switch & trigger Match Entry Fee flow
    const paymentType = options && 'paymentType' in options ? (options as SetActiveGameOptions).paymentType : undefined;
    const amount = options && 'amount' in options ? (options as SetActiveGameOptions).amount : undefined;

    let deductionResult: any = null;
    try {
      deductionResult = await joinGameAndDeductFee(meta.id, undefined, undefined, paymentType, amount);
      console.log('[CentralizedDispatcher] Fee deducted successfully:', deductionResult);
    } catch (err: any) {
      console.warn('[CentralizedDispatcher] Backend deduction notice:', err.message);
      // If error is insufficient balance, alert and halt
      if (err.message && err.message.toLowerCase().includes('insufficient')) {
        alert(`❌ Insufficient ${meta.currency}! Entry fee is ${meta.entryFee} ${meta.currency}.`);
        triggerButtons.forEach((btn) => {
          btn.removeAttribute('disabled');
          btn.classList.remove('opacity-70', 'cursor-wait');
        });
        isDispatching = false;
        return { success: false, error: err.message };
      }
    }

    // 3. Update DOM Currency Indicators if updated balance is returned
    if (deductionResult && typeof deductionResult.remainingBalance === 'number') {
      const isGems = (paymentType || meta.currency) === 'gems';
      const targetId = isGems ? 'playerGems' : 'playerCoins';
      const el = document.getElementById(targetId);
      if (el) {
        el.textContent = `${isGems ? '💎' : '🪙'} ${deductionResult.remainingBalance.toLocaleString()}`;
        el.classList.add('animate-pulse');
        setTimeout(() => el.classList.remove('animate-pulse'), 1000);
      }
    }

    // 4. Update Header and Hero Text & Icon displays
    const headerTitleEl = document.getElementById('activeGameTitleDisplay');
    if (headerTitleEl) {
      headerTitleEl.textContent = meta.title.toUpperCase();
    }
    const headerIconEl = document.getElementById('activeGameIconDisplay');
    if (headerIconEl) {
      headerIconEl.textContent = meta.icon;
    }

    // 5. Fire global window event to update App.tsx state & re-render board in #gameContainer
    const dispatchEvent = new CustomEvent('platform_game_switched', {
      detail: {
        gameId: meta.id,
        boardId: meta.boardId,
        gameTitle: meta.title,
        icon: meta.icon,
        entryFee: meta.entryFee,
        currency: meta.currency,
        deductionResult,
      },
    });
    window.dispatchEvent(dispatchEvent);

    // 6. Smoothly scroll into view of central game board container (#gameContainer)
    const gameContainer = document.getElementById('gameContainer') || document.getElementById('chessBoardWorkspace');
    if (gameContainer) {
      const topOffset = gameContainer.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
    }

    // Restore buttons
    setTimeout(() => {
      triggerButtons.forEach((btn) => {
        btn.removeAttribute('disabled');
        btn.classList.remove('opacity-70', 'cursor-wait');
      });
      isDispatching = false;
    }, 400);

    return { success: true };
  } catch (fatal: any) {
    console.error('[CentralizedDispatcher] Error in setActiveGame:', fatal);
    isDispatching = false;
    return { success: false, error: fatal.message };
  }
}

// 2. BOARD RENDERER & STATE UPDATER
export function updateActiveGameUI(gameId: string) {
  const meta = resolveGameMetadata(gameId);
  const formattedTitle = `${gameId.replace('_', ' ').toUpperCase()} ACTIVE`;

  // Update Top Banner Dynamic Badge
  const activeTitle = document.getElementById('activeGameTitle');
  if (activeTitle) {
    activeTitle.textContent = formattedTitle;
  }

  const activeTitleDisplay = document.getElementById('activeGameTitleDisplay');
  if (activeTitleDisplay) {
    activeTitleDisplay.textContent = meta.title.toUpperCase();
  }

  const activeIconDisplay = document.getElementById('activeGameIconDisplay');
  if (activeIconDisplay) {
    activeIconDisplay.textContent = meta.icon;
  }

  // Display and Mount Game Canvas
  const gameContainer = document.getElementById('gameContainer');
  if (gameContainer) {
    gameContainer.style.display = 'block';
    gameContainer.classList.remove('hidden');

    // Mount game board UI by firing event to React application
    window.dispatchEvent(
      new CustomEvent('platform_game_switched', {
        detail: {
          gameId: meta.id,
          boardId: meta.boardId,
          gameTitle: meta.title,
          icon: meta.icon,
          entryFee: meta.entryFee,
          currency: meta.currency,
        },
      })
    );

    window.dispatchEvent(
      new CustomEvent('platform_game_launched', {
        detail: {
          gameId: meta.id,
          gameTitle: meta.title,
          fee: meta.entryFee,
          currency: meta.currency,
        },
      })
    );

    // Scroll smoothly down to the game board
    gameContainer.scrollIntoView({ behavior: 'smooth' });
  }
}

// 1. UNIFIED DISPATCHER (Invoked by Top Menu Buttons)
export const selectAndLaunchGame = async function (gameId: string) {
  const launchButtons = document.querySelectorAll('.launch-btn');
  launchButtons.forEach((btn: any) => {
    btn.disabled = true;
  });

  try {
    console.log(`[Upper Module] Initiating game switch: ${gameId}`);
    
    // Call Cloud Function / backend deduction
    const result: any = await joinGameAndDeductFee({ gameId });

    if ((result && result.data && result.data.success) || (result && result.success)) {
      const remainingBalance = result.data ? result.data.remainingBalance : result.remainingBalance;
      console.log(`[Transaction Success] Remaining Balance: ${remainingBalance}`);

      // Update UI and load board
      updateActiveGameUI(gameId);
    }
  } catch (error: any) {
    console.error('[Launch Failed]:', error.message);
    alert(`Could not start ${gameId}: ${error.message}`);
  } finally {
    launchButtons.forEach((btn: any) => {
      btn.disabled = false;
    });
  }
};

if (typeof window !== 'undefined') {
  (window as any).selectAndLaunchGame = selectAndLaunchGame;
  (window as any).updateActiveGameUI = updateActiveGameUI;
  (window as any).setActiveGame = setActiveGame;
}

/**
 * Initialize Delegated Event Listeners for Top-level Hero cards
 * This eliminates "upward vs. downward" sync discrepancies.
 */
export function initDelegatedGameSelector(): () => void {
  const handleDelegatedClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Search up DOM tree for game triggers
    const trigger = target.closest(
      '[data-game-id], [data-launch-game], [data-hero-game], .game-card, .hero-card, #btn-hero-enter-arena'
    ) as HTMLElement | null;

    if (!trigger) return;

    // Extract game identifier
    let gameId =
      trigger.getAttribute('data-game-id') ||
      trigger.getAttribute('data-launch-game') ||
      trigger.getAttribute('data-hero-game');

    // Check if it's the Hero "ENTER ARENA" button
    if (!gameId && (trigger.id === 'btn-hero-enter-arena' || trigger.closest('#btn-hero-enter-arena'))) {
      gameId = 'DUO_CHESS';
    }

    // Check button id prefix e.g. btn-launch-DRAUGHTS
    if (!gameId && trigger.id && trigger.id.startsWith('btn-launch-')) {
      gameId = trigger.id.replace('btn-launch-', '');
    }

    if (gameId) {
      e.preventDefault();
      e.stopPropagation();
      selectAndLaunchGame(gameId);
    }
  };

  document.addEventListener('click', handleDelegatedClick, true);

  return () => {
    document.removeEventListener('click', handleDelegatedClick, true);
  };
}

/**
 * Safe Firestore System Governance Listener with Authentication Guard
 */
export function initializeSystemGovernanceListener(
  onSwitchCallback?: (targetGame: string) => void
): () => void {
  let unsubscribeSnapshot: (() => void) | null = null;

  const authUnsubscribe = onAuthStateChanged(auth, (user) => {
    // If listener was previously active, clean it up
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }

    if (!user) {
      console.warn('[Governance] User not authenticated. Governance listener paused.');
      return;
    }

    const platformRef = doc(db, 'platform_state', 'active_game');

    unsubscribeSnapshot = onSnapshot(
      platformRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const gameData = docSnap.data();
          const targetGame = gameData.currentGame || gameData.activeGameId || 'DUO_CHESS';
          console.log('[Governance] Active Game Updated in Firestore:', targetGame);

          updateActiveGameUI(targetGame);

          if (onSwitchCallback) {
            onSwitchCallback(targetGame);
          } else if (typeof (window as any).handleGameSwitch === 'function') {
            (window as any).handleGameSwitch(targetGame);
          }
        }
      },
      (error) => {
        if (error.code === 'permission-denied') {
          console.warn('[Governance] Listener permission pending or restricted for this role.');
        } else {
          console.error('[Governance] System governance listener error:', error);
        }
      }
    );
  });

  return () => {
    authUnsubscribe();
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }
  };
}
