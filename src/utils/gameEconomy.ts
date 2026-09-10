/**
 * Universal Game Entry Script (game_economy.ts)
 * Handles automatic entry fee modal trigger for all 20 games, currency validation & deduction.
 */

import {
  getUserPoints,
  setUserPoints,
  getUserGems,
  setUserGems,
  spendPoints,
  spendGems,
  addPoints,
  addGems,
  syncBalancesToBackend,
} from './pointsManager';
import { soundFx } from './audio';

export interface GameEconomyPlayerState {
  coins: number;
  gems: number;
  activeGameId: number | string | null;
  activeGameTitle: string;
  isMatchInProgress: boolean;
}

let onMatchStartListener: (() => void) | null = null;
let onWheelOpenListener: (() => void) | null = null;
let currentSelection: 'quick_match' | 'vs_ai' | 'pass_play' | null = null;
const gameLaunchCallbacks: Map<string | number, () => void> = new Map();

// Helper function to show and scroll to the chess board area
export function openBoardView() {
  const boardWorkspace = document.getElementById('chessBoardWorkspace');
  if (boardWorkspace) {
    boardWorkspace.style.display = 'flex';
    boardWorkspace.classList.remove('hidden');
    boardWorkspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Global payment success callback for opening panels/modals
export function handlePaymentSuccess() {
  const gameEntryModal = document.getElementById('gameEntryModal');
  const roomModal = document.getElementById('privateRoomModal');
  const btnVsAi = document.getElementById('btnVsAi');
  const btnPassPlay = document.getElementById('btnPassPlay');
  const opponentLabel = document.getElementById('blackOpponentTag');

  // Hide payment modal
  if (gameEntryModal) {
    gameEntryModal.style.display = 'none';
    gameEntryModal.classList.add('hidden');
  }

  switch (currentSelection) {
    case 'quick_match':
      // Open Quick Match / Private Room Configuration Modal
      if (typeof (window as any).openMatchmakingModal === 'function') {
        (window as any).openMatchmakingModal();
      }
      if (roomModal) {
        roomModal.style.display = 'flex';
        roomModal.classList.remove('hidden');
        roomModal.style.zIndex = '9999';
      }
      break;

    case 'vs_ai':
      // Open Main Board View with AI Controls Active
      openBoardView();
      if (btnVsAi) {
        btnVsAi.classList.add('active', 'bg-purple-600');
        btnVsAi.classList.remove('text-gray-400');
      }
      if (btnPassPlay) {
        btnPassPlay.classList.remove('active', 'bg-purple-600');
        btnPassPlay.classList.add('text-gray-400');
      }
      if (opponentLabel) {
        const textSpan = opponentLabel.querySelector('span') || opponentLabel;
        textSpan.innerText = '🤖 AI Opponent';
      }
      break;

    case 'pass_play':
      // Open Main Board View with Human Pass & Play Active
      openBoardView();
      if (btnPassPlay) {
        btnPassPlay.classList.add('active', 'bg-purple-600');
        btnPassPlay.classList.remove('text-gray-400');
      }
      if (btnVsAi) {
        btnVsAi.classList.remove('active', 'bg-purple-600');
        btnVsAi.classList.add('text-gray-400');
      }
      if (opponentLabel) {
        const textSpan = opponentLabel.querySelector('span') || opponentLabel;
        textSpan.innerText = '👤 Human Player';
      }
      break;
  }
}

// Trigger payment flow for mode selection
export function triggerPaymentFlow(mode: 'quick_match' | 'vs_ai' | 'pass_play') {
  currentSelection = mode;
  const gameEntryModal = document.getElementById('gameEntryModal');
  const titleEl = document.getElementById('entryGameTitle');
  const entryStep = document.getElementById('entrySelectStep');
  const errorStep = document.getElementById('insufficientStep');

  if (titleEl) {
    const titles = {
      quick_match: '⚡ Quick Match',
      vs_ai: '🤖 Play with AI',
      pass_play: '👥 Pass & Play',
    };
    titleEl.innerText = `🎮 Play ${titles[mode] || 'Match'}`;
  }

  if (gameEntryModal) {
    if (entryStep) entryStep.classList.remove('hidden');
    if (errorStep) errorStep.classList.add('hidden');
    gameEntryModal.style.display = 'flex';
    gameEntryModal.classList.remove('hidden');
  } else {
    // If no payment modal exists, launch mode directly
    if (typeof (window as any).onPaymentSuccess === 'function') {
      (window as any).onPaymentSuccess();
    } else {
      handlePaymentSuccess();
    }
  }
}

export const GameEconomy = {
  playerState: {
    get coins(): number {
      return getUserPoints();
    },
    set coins(val: number) {
      setUserPoints(val, 'GameEconomy Sync');
    },
    get gems(): number {
      return getUserGems();
    },
    set gems(val: number) {
      setUserGems(val, 'GameEconomy Sync');
    },
    activeGameId: null as number | string | null,
    activeGameTitle: 'Selected Game',
    isMatchInProgress: false,
  },

  // Target entry fees for every game and rematch (can be dynamically updated by Admin)
  get FEE_COINS(): number {
    return this.getFeeCoins();
  },
  set FEE_COINS(val: number) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_game_fee_coins', String(val));
      if (window.GAME_STATE) window.GAME_STATE.entryFeeCoins = val;
    }
  },

  get FEE_GEMS(): number {
    return this.getFeeGems();
  },
  set FEE_GEMS(val: number) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_game_fee_gems', String(val));
      if (window.GAME_STATE) window.GAME_STATE.entryFeeGems = val;
    }
  },

  isFreeMode(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('admin_free_mode') === 'true';
  },

  getFeeCoins(gameTitle?: string): number {
    if (this.isFreeMode()) return 0;
    if (typeof window !== 'undefined') {
      if (gameTitle) {
        try {
          const rawOverrides = localStorage.getItem('admin_game_fee_overrides');
          if (rawOverrides) {
            const parsed = JSON.parse(rawOverrides);
            const key = String(gameTitle).toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const [k, v] of Object.entries(parsed)) {
              if (key.includes(k) && typeof (v as any).coins === 'number') {
                return (v as any).coins;
              }
            }
          }
        } catch (e) {}
      }
      const saved = localStorage.getItem('admin_game_fee_coins');
      if (saved !== null && !isNaN(Number(saved))) return Number(saved);
      if (window.GAME_STATE?.entryFeeCoins !== undefined) return window.GAME_STATE.entryFeeCoins;
    }
    return 2000;
  },

  getFeeGems(gameTitle?: string): number {
    if (this.isFreeMode()) return 0;
    if (typeof window !== 'undefined') {
      if (gameTitle) {
        try {
          const rawOverrides = localStorage.getItem('admin_game_fee_overrides');
          if (rawOverrides) {
            const parsed = JSON.parse(rawOverrides);
            const key = String(gameTitle).toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const [k, v] of Object.entries(parsed)) {
              if (key.includes(k) && typeof (v as any).gems === 'number') {
                return (v as any).gems;
              }
            }
          }
        } catch (e) {}
      }
      const saved = localStorage.getItem('admin_game_fee_gems');
      if (saved !== null && !isNaN(Number(saved))) return Number(saved);
      if (window.GAME_STATE?.entryFeeGems !== undefined) return window.GAME_STATE.entryFeeGems;
    }
    return 2000;
  },

  setFees(coins: number, gems: number, isFreeMode: boolean = false, gameOverrides?: Record<string, { coins?: number; gems?: number }>) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_game_fee_coins', String(coins));
      localStorage.setItem('admin_game_fee_gems', String(gems));
      localStorage.setItem('admin_free_mode', isFreeMode ? 'true' : 'false');
      if (gameOverrides) {
        localStorage.setItem('admin_game_fee_overrides', JSON.stringify(gameOverrides));
      }
      if (window.GAME_STATE) {
        window.GAME_STATE.entryFeeCoins = coins;
        window.GAME_STATE.entryFeeGems = gems;
      }
      window.dispatchEvent(
        new CustomEvent('admin_fee_updated', {
          detail: { coins, gems, isFreeMode, gameOverrides },
        })
      );
    }
  },

  setMatchStartListener(fn: (() => void) | null) {
    onMatchStartListener = fn;
  },

  setWheelOpenListener(fn: (() => void) | null) {
    onWheelOpenListener = fn;
  },

  registerGameLauncher(gameId: string | number, callback: () => void) {
    gameLaunchCallbacks.set(gameId, callback);
  },

  updateUI() {
    const coinEl = document.getElementById('playerCoins');
    const gemEl = document.getElementById('playerGems');
    if (coinEl) coinEl.innerText = `🪙 ${this.playerState.coins.toLocaleString()}`;
    if (gemEl) gemEl.innerText = `💎 ${this.playerState.gems.toLocaleString()}`;

    const modalCoin = document.getElementById('playerCoinsModal');
    const modalGem = document.getElementById('playerGemsModal');
    if (modalCoin) modalCoin.innerText = `🪙 ${this.playerState.coins.toLocaleString()} Coins`;
    if (modalGem) modalGem.innerText = `💎 ${this.playerState.gems.toLocaleString()} Gems`;

    // Sync to backend storage
    syncBalancesToBackend(this.playerState.gems, this.playerState.coins);
  },

  /**
   * Universal Game Entry Trigger (Supports Game IDs 1 to 20)
   */
  requestGameStart(
    gameId: number | string = 1,
    gameTitle: string = 'Selected Game',
    onStartCallback?: () => void,
    mode?: 'quick_match' | 'vs_ai' | 'pass_play'
  ) {
    this.playerState.activeGameId = gameId;
    this.playerState.activeGameTitle = gameTitle || `Game #${gameId}`;

    if (mode) {
      currentSelection = mode;
    } else if (typeof gameId === 'string' && (gameId === 'quick_match' || gameId === 'vs_ai' || gameId === 'pass_play')) {
      currentSelection = gameId;
    }

    if (onStartCallback) {
      onMatchStartListener = onStartCallback;
    }

    const modal = document.getElementById('gameEntryModal');
    const titleEl = document.getElementById('entryGameTitle');
    const entryStep = document.getElementById('entrySelectStep');
    const errorStep = document.getElementById('insufficientStep');

    if (titleEl) {
      titleEl.innerText = `🎮 Play ${gameTitle}`;
    }

    if (modal && entryStep && errorStep) {
      entryStep.classList.remove('hidden');
      errorStep.classList.add('hidden');
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    } else {
      // Direct prompt fallback
      const useCoins = confirm(`Deduct 100 Coins to start ${gameTitle}? (Cancel for 50 Gems)`);
      this.confirmAndStartGame(useCoins ? 'coins' : 'gems');
    }
  },

  /**
   * Validates Balance, Deducts Fee & Launches Active Game
   */
  confirmAndStartGame(paymentType: 'coins' | 'gems'): boolean {
    const feeCoins = this.getFeeCoins(this.playerState.activeGameTitle);
    const feeGems = this.getFeeGems(this.playerState.activeGameTitle);

    if (this.isFreeMode() || (paymentType === 'coins' && feeCoins === 0) || (paymentType === 'gems' && feeGems === 0)) {
      // Free mode - bypass deduction
      soundFx.playWin();
      this.closeEntryModal();
      this.playerState.isMatchInProgress = true;
      if (typeof (window as any).onPaymentSuccess === 'function') {
        (window as any).onPaymentSuccess();
      } else {
        handlePaymentSuccess();
      }
      this.launchGameById(this.playerState.activeGameId);
      return true;
    }

    if (paymentType === 'coins') {
      if (this.playerState.coins < feeCoins) {
        soundFx.playError();
        this.showInsufficientError('coins', feeCoins);
        return false;
      }
      this.playerState.coins -= feeCoins;
    } else if (paymentType === 'gems') {
      if (this.playerState.gems < feeGems) {
        soundFx.playError();
        this.showInsufficientError('gems', feeGems);
        return false;
      }
      this.playerState.gems -= feeGems;
    } else {
      alert('Invalid payment type selected.');
      return false;
    }

    soundFx.playWin();
    this.updateUI();
    this.closeEntryModal();
    this.playerState.isMatchInProgress = true;

    // Trigger payment success UI opening (mode modals, boards, toggles)
    if (typeof (window as any).onPaymentSuccess === 'function') {
      (window as any).onPaymentSuccess();
    } else {
      handlePaymentSuccess();
    }

    // Launch Game Logic based on Active ID
    this.launchGameById(this.playerState.activeGameId);
    return true;
  },

  showInsufficientError(type: 'coins' | 'gems', required?: number) {
    const feeCoins = required ?? this.getFeeCoins(this.playerState.activeGameTitle);
    const feeGems = required ?? this.getFeeGems(this.playerState.activeGameTitle);

    const entryStep = document.getElementById('entrySelectStep');
    const errorStep = document.getElementById('insufficientStep');
    const titleEl = document.getElementById('insufficientTitle');
    const msgEl = document.getElementById('insufficientMsg');

    if (entryStep && errorStep) {
      entryStep.classList.add('hidden');
      errorStep.classList.remove('hidden');
    }

    if (type === 'coins') {
      if (titleEl) titleEl.innerText = '🪙 Insufficient Coins!';
      if (msgEl) {
        msgEl.innerHTML = `Entry costs <strong>${feeCoins.toLocaleString()} Coins</strong>. You currently have <strong>${this.playerState.coins.toLocaleString()} Coins</strong>.<br><br>Earn coins via daily tasks, spin the wheel, or request admin allocation!`;
      }
    } else {
      if (titleEl) titleEl.innerText = '💎 Insufficient Gems!';
      if (msgEl) {
        msgEl.innerHTML = `Entry costs <strong>${feeGems.toLocaleString()} Gems</strong>. You currently have <strong>${this.playerState.gems.toLocaleString()} Gems</strong>.<br><br>Earn gems via daily tasks, spin the wheel, or request admin allocation!`;
      }
    }
  },

  closeEntryModal() {
    const modal = document.getElementById('gameEntryModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  },

  spinWheel(): void {
    this.closeEntryModal();
    if (onWheelOpenListener) {
      onWheelOpenListener();
    } else if (typeof (window as any).openDailyWheel === 'function') {
      (window as any).openDailyWheel();
    } else {
      const wheelBtn = document.getElementById('dailyWheelNavBtn');
      if (wheelBtn) {
        wheelBtn.click();
      } else {
        alert('Navigating to Wheel of Fortune...');
      }
    }
  },

  /**
   * Route Game Start to Specific Board / Engine logic
   */
  launchGameById(gameId: number | string | null) {
    console.log(`✅ Entry fee deducted! Launching Game ID: ${gameId}`);

    // Reveal game board container if hidden
    const boardContainer = document.getElementById('gameContainer') || document.getElementById('chessBoardWorkspace');
    if (boardContainer) {
      boardContainer.style.display = 'flex';
      boardContainer.scrollIntoView({ behavior: 'smooth' });
    }

    // Call centralized dispatcher with skipModal: true to sync backend deduction & events
    if (gameId && typeof (window as any).setActiveGame === 'function') {
      (window as any).setActiveGame(String(gameId), { skipModal: true });
    }

    // Switch game if board switcher exists
    if (gameId && typeof (window as any).handleGameSwitch === 'function') {
      (window as any).handleGameSwitch(String(gameId));
    }

    // Trigger game specific reset functions
    if (typeof (window as any).resetBoard === 'function') {
      (window as any).resetBoard();
    }
    if (typeof (window as any).startMatchTimer === 'function') {
      (window as any).startMatchTimer();
    }

    // Notify custom match start listener if registered
    if (onMatchStartListener) {
      onMatchStartListener();
      onMatchStartListener = null;
    }

    // Call game specific launcher callback if registered
    if (gameId && gameLaunchCallbacks.has(gameId)) {
      const cb = gameLaunchCallbacks.get(gameId);
      if (cb) cb();
    }
  },

  /**
   * Backward-compatible alias for launchGameById
   */
  launchGame(gameId: number | string | null) {
    this.launchGameById(gameId);
  },

  // -------------------------------------------------------------
  // MATCH WINNING REWARDS
  // -------------------------------------------------------------
  claimMatchReward(rank: number): void {
    let coinsEarned = 0;
    let gemsEarned = 0;

    switch (rank) {
      case 1: // 1st Place
        coinsEarned = 2000;
        gemsEarned = 90;
        break;
      case 2: // 2nd Place
        coinsEarned = 1000;
        gemsEarned = 60;
        break;
      case 3: // 3rd Place
        coinsEarned = 500;
        gemsEarned = 30;
        break;
      default:
        alert('No rewards for ranks outside top 3.');
        return;
    }

    addPoints(coinsEarned, `Rank ${rank} Match Finish Reward`);
    addGems(gemsEarned, `Rank ${rank} Match Finish Reward`);
    soundFx.playWin();
    this.updateUI();

    alert(`🏆 Rank ${rank} Finish!\nAwarded: +${coinsEarned} 🪙 Coins & +${gemsEarned} 💎 Gems!`);
  },

  // -------------------------------------------------------------
  // TASK REWARDS (Randomly gives 100 Coins or 100 Gems)
  // -------------------------------------------------------------
  completeTask(taskId: string = 'Win 1 Game'): void {
    const isCoins = Math.random() < 0.5;

    if (isCoins) {
      addPoints(100, `Task: ${taskId}`);
      soundFx.playWin();
      alert(`🎯 Task "${taskId}" Completed!\nReward: +100 🪙 Coins!`);
    } else {
      addGems(100, `Task: ${taskId}`);
      soundFx.playWin();
      alert(`🎯 Task "${taskId}" Completed!\nReward: +100 💎 Gems!`);
    }

    this.updateUI();
  },

  // -------------------------------------------------------------
  // WHEEL OF FORTUNE
  // -------------------------------------------------------------
  executeSpinWheelPrize(): void {
    const prizes = [
      { type: 'coins' as const, amount: 200 },
      { type: 'gems' as const, amount: 50 },
      { type: 'coins' as const, amount: 500 },
      { type: 'gems' as const, amount: 100 },
      { type: 'coins' as const, amount: 1000 },
      { type: 'gems' as const, amount: 200 },
    ];

    const prize = prizes[Math.floor(Math.random() * prizes.length)];

    if (prize.type === 'coins') {
      addPoints(prize.amount, 'Wheel of Fortune Prize');
      soundFx.playWin();
      alert(`🎡 Wheel Spin Won: +${prize.amount} 🪙 Coins!`);
    } else {
      addGems(prize.amount, 'Wheel of Fortune Prize');
      soundFx.playWin();
      alert(`🎡 Wheel Spin Won: +${prize.amount} 💎 Gems!`);
    }

    this.updateUI();
  },

  payEntryFee(gameId: number | string = 1, paymentType: 'coins' | 'gems' = 'coins'): boolean {
    return this.confirmAndStartGame(paymentType);
  },
};

/**
 * AUTOMATIC GLOBAL BINDING
 * Intercepts clicks on all elements with data-game-id, .game-card, .mode-btn, .game-item
 */
export function initGlobalGameEntryListeners() {
  if (typeof document === 'undefined') return;

  // STEP A: Attach Click Handlers to Mode Selection Cards
  const quickMatchBtn = document.querySelector<HTMLElement>('[data-mode="quick_match"]');
  const playAiBtn = document.querySelector<HTMLElement>('[data-mode="vs_ai"]');
  const passPlayBtn = document.querySelector<HTMLElement>('[data-mode="pass_play"]');

  if (quickMatchBtn && quickMatchBtn.dataset.modeBound !== 'true') {
    quickMatchBtn.dataset.modeBound = 'true';
    quickMatchBtn.addEventListener('click', () => triggerPaymentFlow('quick_match'));
  }
  if (playAiBtn && playAiBtn.dataset.modeBound !== 'true') {
    playAiBtn.dataset.modeBound = 'true';
    playAiBtn.addEventListener('click', () => triggerPaymentFlow('vs_ai'));
  }
  if (passPlayBtn && passPlayBtn.dataset.modeBound !== 'true') {
    passPlayBtn.dataset.modeBound = 'true';
    passPlayBtn.addEventListener('click', () => triggerPaymentFlow('pass_play'));
  }

  // Option A: Bind via data attribute (e.g., <div data-game-id="5" data-game-title="Arcade Chess">)
  document.querySelectorAll<HTMLElement>('[data-game-id]').forEach((element) => {
    if (element.dataset.boundEconomy === 'true') return;
    element.dataset.boundEconomy = 'true';

    element.addEventListener('click', (e) => {
      const id = element.getAttribute('data-game-id');
      const title = element.getAttribute('data-game-title') || element.innerText.trim();
      if (id) {
        GameEconomy.requestGameStart(id, title);
      }
    });
  });

  // Option B: Bind all buttons inside games section automatically
  const gameButtons = document.querySelectorAll<HTMLElement>('.game-card, .game-item');
  gameButtons.forEach((btn, index) => {
    if (btn.dataset.boundEconomy === 'true') return;
    btn.dataset.boundEconomy = 'true';

    if (!btn.hasAttribute('data-game-id')) {
      btn.setAttribute('data-game-id', String(index + 1));
      btn.addEventListener('click', () => {
        GameEconomy.requestGameStart(index + 1, btn.innerText.trim());
      });
    }
  });
}

/**
 * JavaScript Alert Integration Code for Insufficient Balance checking
 */
export function checkBalanceAndPlay(currencyType: 'coins' | 'gems', gameTitle?: string): boolean {
  if (GameEconomy.isFreeMode()) return true;
  const reqCoins = GameEconomy.getFeeCoins(gameTitle);
  const reqGems = GameEconomy.getFeeGems(gameTitle);

  if (currencyType === 'coins' && reqCoins > 0 && GameEconomy.playerState.coins < reqCoins) {
    return false;
  }

  if (currencyType === 'gems' && reqGems > 0 && GameEconomy.playerState.gems < reqGems) {
    return false;
  }

  return true;
}

// Bind to window and document for instant vanilla HTML compatibility
if (typeof window !== 'undefined') {
  (window as any).GameEconomy = GameEconomy;
  (window as any).checkBalanceAndPlay = checkBalanceAndPlay;
  (window as any).initGlobalGameEntryListeners = initGlobalGameEntryListeners;
  (window as any).triggerPaymentFlow = triggerPaymentFlow;
  (window as any).openBoardView = openBoardView;
  (window as any).onPaymentSuccess = handlePaymentSuccess;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalGameEntryListeners);
  } else {
    initGlobalGameEntryListeners();
  }
}
