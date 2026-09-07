/**
 * Turn Manager & Extra Turn Logic (src/utils/turnManager.ts)
 * 
 * Rules:
 * - Rolling a 6 grants an extra turn for that player.
 * - Any other roll (1, 2, 3, 4, 5) moves the game forward to the next player in sequential order.
 */

export interface TurnGameState {
  players: any[];
  currentPlayerIndex: number;
  lastDiceRoll?: number | null;
  hasExtraTurn?: boolean;
  waitingForAction?: boolean;
  isGameOver?: boolean;
  isCardModalOpen?: boolean;
  currentTileData?: any;
  [key: string]: any;
}

/**
 * Executes a dice roll for the active player, updates position and salary pass,
 * and sets `hasExtraTurn` to true if a 6 is rolled.
 */
export function rollDiceForCurrentPlayer(
  gameState: TurnGameState,
  setGameState: (updater: (prev: TurnGameState) => TurnGameState) => void,
  boardSize: number = 36
) {
  if (gameState.isGameOver) {
    return { success: false, message: "Game is over!" };
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (!currentPlayer) {
    return { success: false, message: "Invalid player turn state." };
  }

  // Roll a standard 1-6 dice
  const diceValue = Math.floor(Math.random() * 6) + 1;

  const oldPosition = currentPlayer.position || 0;
  const newPosition = (oldPosition + diceValue) % boardSize;

  const passedGo = newPosition < oldPosition;
  const goBonus = passedGo ? 1500 : 0;

  // Update player position and money if passing GO
  const updatedPlayers = gameState.players.map((p, index) => {
    if (index === gameState.currentPlayerIndex) {
      return {
        ...p,
        position: newPosition,
        cash: (p.cash ?? p.money ?? 0) + goBonus,
        money: (p.cash ?? p.money ?? 0) + goBonus,
        netWorth: (p.netWorth ?? 0) + goBonus,
      };
    }
    return p;
  });

  // RULE CHECK: Did they roll a 6?
  const rolledSix = diceValue === 6;

  setGameState((prevState) => ({
    ...prevState,
    players: updatedPlayers,
    lastDiceRoll: diceValue,
    waitingForAction: true,
    // If they rolled a 6, they keep their turn (extra turn). Otherwise, mark that turn control can move next after action.
    hasExtraTurn: rolledSix,
  }));

  return {
    success: true,
    diceValue,
    newPosition,
    rolledSix,
    activePlayer: currentPlayer.name,
  };
}

/**
 * Handles turn completion, respecting the extra turn on rolling a 6 rule.
 * - If `hasExtraTurn` is true, keeps the turn on current player and resets the flag for their bonus roll.
 * - Otherwise, cleanly advances to the next player sequentially (1 -> 2 -> 3 -> 4 -> 1).
 */
export function handleTurnCompletion(
  gameState: TurnGameState,
  setGameState: (updater: (prev: TurnGameState) => TurnGameState) => void
) {
  // If the player rolled a 6, they get an extra turn (do NOT advance player index)
  if (gameState.hasExtraTurn) {
    setGameState((prevState) => ({
      ...prevState,
      waitingForAction: false,
      lastDiceRoll: null,
      hasExtraTurn: false, // Reset extra turn flag for the bonus round
      isCardModalOpen: false,
      currentTileData: null,
    }));
    return { extraTurnGranted: true, message: "Rolled a 6! Take your extra turn." };
  }

  // Otherwise, strictly advance to the next player in sequential order (1 -> 2 -> 3 -> 4 -> 1)
  const totalPlayers = gameState.players.length;
  const nextIndex = (gameState.currentPlayerIndex + 1) % totalPlayers;

  setGameState((prevState) => ({
    ...prevState,
    currentPlayerIndex: nextIndex,
    waitingForAction: false,
    lastDiceRoll: null,
    hasExtraTurn: false,
    isCardModalOpen: false,
    currentTileData: null,
  }));

  return { extraTurnGranted: false, message: "Turn passed to the next player." };
}

/**
 * Pure rule helper to test if a given dice roll grants an extra turn.
 */
export function checkExtraTurnRule(diceValue: number): boolean {
  return diceValue === 6;
}

/**
 * Standard fixed color sequence for Tycoons:
 * 0: Red, 1: Green, 2: Yellow, 3: Blue, 4: Orange, 5: Purple
 */
export const COLOR_TURN_SEQUENCE = ['Red', 'Green', 'Yellow', 'Blue', 'Orange', 'Purple'] as const;

/**
 * Jail rule parameters:
 * Deducts $500 when sent to jail and skips turn for 1 round.
 */
export const JAIL_FINE_AMOUNT = 500;

/**
 * Applies Jail penalty: Deducts $500 from the player and flags jail turn skip.
 */
export function applyJailPenalty<T extends { cash?: number; money?: number; netWorth?: number; inJail?: boolean; jailTurns?: number; position?: number }>(
  player: T,
  jailSpaceId: number = 9
): T {
  const currentCash = player.cash ?? player.money ?? 0;
  const newCash = Math.max(0, currentCash - JAIL_FINE_AMOUNT);
  const diff = currentCash - newCash;

  return {
    ...player,
    position: jailSpaceId,
    cash: newCash,
    money: newCash,
    netWorth: Math.max(0, (player.netWorth ?? currentCash) - diff),
    inJail: true,
    jailTurns: 1, // Skips turn for one time
  };
}

/**
 * Handles moving to the next player based on roll results:
 * - Order: 0: Red, 1: Green, 2: Yellow, 3: Blue, (and so on for more players)
 * - 1 to 5: standard single turn, systematically advances to the next player
 * - 6: grants an extra turn, keeping the active player's index
 */
export function handleDiceTurnCompletion<T extends { currentPlayerIndex: number; totalPlayers: number; [key: string]: any }>(
  currentState: T,
  diceResult: { totalRoll: number; [key: string]: any }
): T & { extraTurn: boolean; message: string; currentTextRole: null } {
  const { totalRoll } = diceResult;
  const { currentPlayerIndex, totalPlayers } = currentState;

  // If the player rolls a 6, they keep their turn (extra turn)
  if (totalRoll === 6) {
    return {
      ...currentState,
      extraTurn: true,
      currentTextRole: null,
      message: "Rolled a 6! Take your extra turn.",
    };
  }

  // Otherwise, systematically advance to the next player based on total players selected
  // Order: 0: Red, 1: Green, 2: Yellow, 3: Blue, (and so on for more players)
  const nextPlayerIndex = (currentPlayerIndex + 1) % totalPlayers;

  return {
    ...currentState,
    currentPlayerIndex: nextPlayerIndex,
    extraTurn: false,
    currentTextRole: null,
    message: "Turn passed to the next player.",
  };
}

