/**
 * Two-Dice Turn Manager & Doubles Extra Turn Logic (src/utils/twoDiceTurnManager.ts)
 * 
 * Rules:
 * - Rolling two independent 1–6 dice, resulting in totals from 2 to 12.
 * - Rolling doubles (both dice land on the same number, e.g., 1-1, 2-2, 3-3, 4-4, 5-5, 6-6) grants an extra turn.
 * - Any non-matching combination moves the game forward to the next player in sequential order.
 */

export interface TwoDiceTurnGameState {
  players: any[];
  currentPlayerIndex: number;
  lastDiceRoll?: { die1: number; die2: number; total: number } | null;
  hasExtraTurn?: boolean;
  waitingForAction?: boolean;
  isGameOver?: boolean;
  isCardModalOpen?: boolean;
  currentTileData?: any;
  [key: string]: any;
}

/**
 * Rolls two separate 1-6 dice for the active player, updates board position & salary bonus,
 * and sets `hasExtraTurn` to true if doubles are rolled.
 */
export function rollTwoDiceForCurrentPlayer(
  gameState: TwoDiceTurnGameState,
  setGameState: (updater: (prev: TwoDiceTurnGameState) => TwoDiceTurnGameState) => void,
  boardSize: number = 36
) {
  if (gameState.isGameOver) {
    return { success: false, message: "Game is over!" };
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (!currentPlayer) {
    return { success: false, message: "Invalid player turn state." };
  }

  // Roll two separate dice (1-6 each)
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const totalDiceValue = die1 + die2;

  const oldPosition = currentPlayer.position || 0;
  const newPosition = (oldPosition + totalDiceValue) % boardSize;

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

  // RULE CHECK: Did they roll doubles (both dice match)? E.g., 1-1, 2-2, 6-6
  const rolledDoubles = die1 === die2;

  setGameState((prevState) => ({
    ...prevState,
    players: updatedPlayers,
    lastDiceRoll: { die1, die2, total: totalDiceValue },
    waitingForAction: true,
    hasExtraTurn: rolledDoubles, // Grants extra turn if doubles are rolled
  }));

  return {
    success: true,
    die1,
    die2,
    totalDiceValue,
    rolledDoubles,
    activePlayer: currentPlayer.name,
  };
}

/**
 * Handles moving to the next player or granting an extra turn on doubles.
 */
export function handleTwoDiceTurnCompletion(
  gameState: TwoDiceTurnGameState,
  setGameState: (updater: (prev: TwoDiceTurnGameState) => TwoDiceTurnGameState) => void
) {
  // If they rolled doubles, they keep their turn for a bonus round
  if (gameState.hasExtraTurn) {
    setGameState((prevState) => ({
      ...prevState,
      waitingForAction: false,
      lastDiceRoll: null,
      hasExtraTurn: false,
      isCardModalOpen: false,
      currentTileData: null,
    }));
    return { extraTurnGranted: true, message: "Rolled doubles! Take your extra turn." };
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
 * Pure rule helper to test if a two-dice roll represents doubles.
 */
export function checkDoublesRule(die1: number, die2: number): boolean {
  return die1 === die2;
}
