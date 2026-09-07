// src/utils/blackMoneyManager.ts
import { BusinessPlayer } from '../components/BusinessBoard';

export interface BlackMoneyCheckResult {
  penalized: boolean;
  message: string;
  taxAmount?: number;
  penalty?: number;
  totalDeduction?: number;
}

export interface BlackMoneyConfig {
  THRESHOLD?: number;
  NET_WORTH_THRESHOLD: number;
  LIQUID_CASH_THRESHOLD: number;
  BASE_FINE: number;
  EXCESS_PENALTY_RATE: number;
}

/**
 * DYNAMIC SCALABLE DUAL-THRESHOLD BLACK MONEY SUBSYSTEM
 * 
 * Scaled Multiplier Architecture:
 * - Triggers if Total Net Worth > $70,000 USD OR Liquid Cash > $40,000 USD.
 * - Dynamic Fine = Base Fine ($10,000) + (% Penalty * Excess Amount).
 * - Automatically scales across any cash/tier scale.
 */

// Configure default base economic tier with Dual Thresholds
export const BLACK_MONEY_CONFIG: BlackMoneyConfig = {
  THRESHOLD: 70000,             // Backward-compatibility alias
  NET_WORTH_THRESHOLD: 70000,   // Trigger if Total Net Worth > $70,000
  LIQUID_CASH_THRESHOLD: 40000, // Trigger if Liquid Cash > $40,000
  BASE_FINE: 10000,             // Base flat fine
  EXCESS_PENALTY_RATE: 0.50     // 50% penalty on excess
};

/**
 * Calculates total net worth including cash, stocks, and properties
 */
export const calculateTotalNetWorth = (entity: any): number => {
  const liquidCash = entity.totalCash ?? entity.cash ?? 0;

  // Calculate stock values across possible schema formats
  const stockHoldings = entity.shares?.holdings || {};
  const stockPrices = entity.shares?.prices || {};
  let stockValue = Object.keys(stockHoldings).reduce((total, symbol) => {
    const qty = Number(stockHoldings[symbol]) || 0;
    const price = Number(stockPrices[symbol]) || 0;
    return total + qty * price;
  }, 0);

  if (entity.stocks) {
    Object.values(entity.stocks).forEach((s: any) => {
      const shares = s?.shares || s?.quantity || 0;
      const currentPrice = s?.currentPrice || s?.price || 0;
      stockValue += shares * currentPrice;
    });
  }

  // Calculate property values
  const properties = entity.propertiesOwned || [];
  const propertyValue = properties.reduce((total: number, prop: any) => {
    return total + (Number(prop.price) || 5000);
  }, 0);

  return liquidCash + stockValue + propertyValue;
};

/**
 * Calculates dynamic penalty for any cash amount (Thousands, Millions, or Billions)
 * @param {number} totalCash 
 * @param {BlackMoneyConfig} config 
 * @returns {number} Dynamic fine amount
 */
export const calculateDynamicFine = (
  totalCash: number,
  config: BlackMoneyConfig = BLACK_MONEY_CONFIG
): number => {
  const threshold = config.LIQUID_CASH_THRESHOLD ?? config.THRESHOLD ?? 40000;
  if (totalCash <= threshold) return 0;

  const excessCash = totalCash - threshold;
  const percentagePenalty = excessCash * config.EXCESS_PENALTY_RATE;
  const calculatedFine = config.BASE_FINE + percentagePenalty;

  // Fine caps at total available cash (prevents negative balances)
  return Math.min(totalCash, Math.round(calculatedFine));
};

/**
 * Executes dual threshold seizure for both Human Players & AI Bots
 * Triggers if Net Worth > $70,000 OR Liquid Cash > $40,000.
 * Strips liquid excess, revokes all properties, captures Visa & Passport.
 */
export const executeDualThresholdSeizure = (
  entity: any,
  setPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
  setBankProperties?: any,
  config: BlackMoneyConfig = BLACK_MONEY_CONFIG
) => {
  let updated = { ...entity };
  const currentCash = updated.totalCash ?? updated.cash ?? 0;
  const netWorth = calculateTotalNetWorth(updated);

  // Trigger if Net Worth > $70k OR Cash > $40k
  const exceedsNetWorth = netWorth > config.NET_WORTH_THRESHOLD;
  const exceedsLiquidCash = currentCash > config.LIQUID_CASH_THRESHOLD;

  if ((exceedsNetWorth || exceedsLiquidCash) && !updated.documents?.blackMoneyFlagged) {
    // Calculate penalty based on the primary breach
    const excessAmount = exceedsNetWorth
      ? netWorth - config.NET_WORTH_THRESHOLD
      : currentCash - config.LIQUID_CASH_THRESHOLD;

    const totalFine = Math.min(
      currentCash,
      Math.round(config.BASE_FINE + excessAmount * config.EXCESS_PENALTY_RATE)
    );

    const seizedProperties = updated.propertiesOwned || [];

    // State Updates
    const remainingCash = Math.max(0, currentCash - totalFine);
    updated.cash = remainingCash;
    updated.totalCash = remainingCash;
    updated.netWorth = Math.max(0, netWorth - totalFine);
    updated.propertiesOwned = []; // Closes and strips all real estate holdings

    updated.documents = {
      ...updated.documents,
      visaCaptured: true,     // Confiscates Visa (locks movement)
      passportCaptured: true, // Confiscates Passport
      blackMoneyFlagged: true // Prevents repeat trigger in current turn
    };

    if (typeof setBankProperties === 'function' && seizedProperties.length > 0) {
      setBankProperties((prevPool: any[]) => {
        if (!Array.isArray(prevPool)) return prevPool;
        if (prevPool.length > 0 && 'ownerId' in prevPool[0]) {
          return prevPool.map((s: any) =>
            s.ownerId === updated.id
              ? { ...s, ownerId: undefined, isOwned: false, hasHouse: false, houses: 0 }
              : s
          );
        }
        return [...prevPool, ...seizedProperties];
      });
    }

    const isAi = updated.isAi || updated.isAI;
    console.warn(
      `🚨 [BLACK MONEY ENFORCED]\n` +
      `• Target: ${updated.id} (${isAi ? 'AI Bot' : 'Player'})\n` +
      `• Total Net Worth: $${netWorth.toLocaleString()} USD (Limit: $${config.NET_WORTH_THRESHOLD.toLocaleString()})\n` +
      `• Liquid Cash: $${currentCash.toLocaleString()} USD (Limit: $${config.LIQUID_CASH_THRESHOLD.toLocaleString()})\n` +
      `• Dynamic Penalty Deducted: -$${totalFine.toLocaleString()} USD\n` +
      `• Documents Captured: Visa & Passport Confiscated\n` +
      `• Real Estate Stripped: ${seizedProperties.length} properties returned to Bank.`
    );
  } else if (!exceedsNetWorth && !exceedsLiquidCash && updated.documents?.blackMoneyFlagged) {
    updated.documents = {
      ...updated.documents,
      blackMoneyFlagged: false,
    };
  }

  if (typeof setPlayers === 'function') {
    setPlayers((prev: any[]) => prev.map((p: any) => (p.id === updated.id ? updated : p)));
  }

  return updated;
};

// Backward-compatible export
export const executeDynamicBlackMoneySeizure = executeDualThresholdSeizure;

/**
 * 1. Black Money & Document Confiscation Logic
 * Checks if the player's cash strictly exceeds the dynamic threshold ($70,000 USD).
 * If triggered, deducts the calculated dynamic fine ($10,000 base + 50% excess) and captures Visa & Passport.
 */
export const checkBlackMoneyThreshold = (
  player: any,
  setPlayers: React.Dispatch<React.SetStateAction<any[]>>,
  config: BlackMoneyConfig = BLACK_MONEY_CONFIG
): { penalized: boolean; message: string; fine?: number } => {
  const liquidCash = player.totalCash ?? player.cash ?? 0;

  // Threshold check: Cash strictly greater than threshold
  if (liquidCash > config.THRESHOLD) {
    const fine = calculateDynamicFine(liquidCash, config);

    setPlayers((prevPlayers) =>
      prevPlayers.map((p) => {
        if (p.id !== player.id) return p;

        const currentCash = p.totalCash ?? p.cash ?? 0;
        const updatedCash = Math.max(0, currentCash - fine);
        const updatedNetWorth = Math.max(0, (p.netWorth || 0) - fine);

        return {
          ...p,
          cash: updatedCash,
          totalCash: updatedCash,
          netWorth: updatedNetWorth,
          propertiesOwned: [],
          documents: {
            ...p.documents,
            visaCaptured: true,     // VISA legally captured
            passportCaptured: true, // PASSPORT legally captured
            blackMoneyFlagged: true,
          },
        };
      })
    );

    return {
      penalized: true,
      fine,
      message: `⚠️ Black Money Detected ($${liquidCash.toLocaleString()} > $${config.THRESHOLD.toLocaleString()} USD)! Scaled fine of $${fine.toLocaleString()} USD applied ($${config.BASE_FINE.toLocaleString()} base + ${(config.EXCESS_PENALTY_RATE * 100)}% excess), Visa & Passport legally captured.`,
    };
  }

  return { penalized: false, message: 'Asset check clear.' };
};

// Backward-compatible alias for handleBlackMoneyCheck
export const handleBlackMoneyCheck = (
  player: any,
  setPlayers: React.Dispatch<React.SetStateAction<any[]>>
): BlackMoneyCheckResult => {
  const res = checkBlackMoneyThreshold(player, setPlayers);
  return {
    penalized: res.penalized,
    penalty: res.fine || 0,
    totalDeduction: res.fine || 0,
    message: res.message,
  };
};

/**
 * 2. Document Recovery (Re-purchasing Visa and Passport)
 * Function to pay and recover captured Visa or Passport.
 */
export const recoverDocument = (
  player: any,
  docType: 'visa' | 'passport',
  visaCost: number,
  passportCost: number,
  setPlayers: React.Dispatch<React.SetStateAction<any[]>>
): { success: boolean; message: string } => {
  const cost = docType === 'visa' ? visaCost : passportCost;
  const currentCash = player.totalCash ?? player.cash ?? 0;

  if (currentCash < cost) {
    return {
      success: false,
      message: `Insufficient funds! You need $${cost.toLocaleString()} to recover your ${docType.toUpperCase()}.`,
    };
  }

  setPlayers((prevPlayers) =>
    prevPlayers.map((p) => {
      if (p.id !== player.id) return p;

      const pCash = p.totalCash ?? p.cash ?? 0;
      const updatedCash = pCash - cost;
      const isVisa = docType === 'visa';

      return {
        ...p,
        cash: updatedCash,
        totalCash: updatedCash,
        documents: {
          ...p.documents,
          [docType === 'visa' ? 'visaCaptured' : 'passportCaptured']: false,
          [isVisa ? 'VISA' : 'PASSPORT']: Math.max(1, (p.documents?.[isVisa ? 'VISA' : 'PASSPORT'] || 0)),
        },
      };
    })
  );

  return {
    success: true,
    message: `Successfully paid $${cost.toLocaleString()} to recover your ${docType.toUpperCase()}.`,
  };
};

// Backward-compatible wrapper for regainDocument
export const regainDocument = (
  player: any,
  docType: 'visa' | 'passport',
  documentCost: number,
  setPlayers: React.Dispatch<React.SetStateAction<any[]>>
): boolean => {
  const res = recoverDocument(player, docType, documentCost, documentCost, setPlayers);
  return res.success;
};

/**
 * 3. Visa Fee Tile Landing & Immediate Bankruptcy Rule
 * When a player lands on a Visa Fee tile, verifies Visa status.
 * If Visa is captured or missing and player cannot afford the fee, immediate bankruptcy and elimination is triggered.
 */
export const handleVisaFeeTileLanding = (
  player: any,
  visaFeeAmount: number,
  setPlayers: React.Dispatch<React.SetStateAction<any[]>>,
  eliminatePlayer: (playerId: number, reason?: string) => void
): { bankrupt: boolean; message: string } => {
  const isVisaCaptured = player.documents?.visaCaptured;
  const hasValidVisa = !isVisaCaptured;

  // If player doesn't have a valid Visa / Visa is captured
  if (!hasValidVisa) {
    const currentCash = player.totalCash ?? player.cash ?? 0;

    // Check if player can immediately pay the visa fee to verify/clear it
    if (currentCash >= visaFeeAmount) {
      // Pay fee and clear Visa capture
      setPlayers((prevPlayers) =>
        prevPlayers.map((p) => {
          if (p.id !== player.id) return p;
          const pCash = p.totalCash ?? p.cash ?? 0;
          const updatedCash = pCash - visaFeeAmount;
          return {
            ...p,
            cash: updatedCash,
            totalCash: updatedCash,
            documents: {
              ...p.documents,
              visaCaptured: false,
              VISA: Math.max(1, (p.documents?.VISA || 0)),
            },
          };
        })
      );

      return {
        bankrupt: false,
        message: `Visa fee of $${visaFeeAmount.toLocaleString()} paid upon landing. Visa verified successfully.`,
      };
    } else {
      // Unable to pay and verify Visa -> Immediate Bankruptcy & Elimination
      eliminatePlayer(
        player.id,
        `Landed on Visa Fee tile without a valid Visa and couldn't pay $${visaFeeAmount.toLocaleString()}.`
      );

      return {
        bankrupt: true,
        message: `🚨 Player ${player.id} landed on Visa Fee tile without a valid Visa and couldn't pay $${visaFeeAmount.toLocaleString()}. Player is BANKRUPT and kicked out!`,
      };
    }
  }

  return { bankrupt: false, message: 'Visa verified. Standard movement permitted.' };
};

// Backward-compatible alias for handleVisaTileLanding
export const handleVisaTileLanding = (
  player: any,
  visaFeeAmount: number,
  setPlayers: React.Dispatch<React.SetStateAction<any[]>>,
  eliminatePlayer: (playerId: number, reason?: string) => void
): { success: boolean; eliminated: boolean; message: string } => {
  const res = handleVisaFeeTileLanding(player, visaFeeAmount, setPlayers, eliminatePlayer);
  return {
    success: !res.bankrupt,
    eliminated: res.bankrupt,
    message: res.message,
  };
};

/**
 * Function to check insolvency and trigger immediate bankruptcy
 * When Total Net Liquidity reaches $0 while Current Cash is $0 and all assets (Visa, Passport, Stocks, Properties)
 * are unavailable or captured, the system triggers absolute insolvency.
 */
export const checkTotalInsolvency = (
  player: any,
  eliminatePlayer: (playerId: number, reason?: string) => void,
  onAlert?: (title: string, desc: string, type: 'warning' | 'danger') => void
): { isBankrupt: boolean; message?: string } => {
  const currentCash = player.totalCash ?? player.cash ?? 0;
  const isVisaCaptured = player.documents?.visaCaptured ?? true;
  const isPassportCaptured = player.documents?.passportCaptured ?? true;

  // Check stock positions across possible structures
  let stockPositions = 0;
  if (player.shares?.holdings) {
    stockPositions += Object.keys(player.shares.holdings).length;
  }
  if (player.stocks) {
    stockPositions += Object.values(player.stocks).filter((s: any) => (s?.shares ?? 0) > 0).length;
  }
  if (player.investments) {
    stockPositions += Object.values(player.investments).filter((v: any) => (v ?? 0) > 0).length;
  }

  const propertyCount = (player.propertiesOwned || []).length;

  // Conditions from modal UI: Cash is $0, no stocks, no properties, documents captured
  const hasNoLiquidCash = currentCash === 0;
  const hasNoSellableDocs = isVisaCaptured && isPassportCaptured;
  const hasNoStocks = stockPositions === 0;
  const hasNoProperties = propertyCount === 0;

  if (hasNoLiquidCash && hasNoSellableDocs && hasNoStocks && hasNoProperties) {
    const playerLabel = player.isAi || player.isAI ? `${player.name || `Player ${player.id}`} (AI)` : player.name || `Player ${player.id}`;
    const bankruptcyMessage = 
      `🚨 ABSOLUTE BANKRUPTCY: ${player.id} (${playerLabel}) has $0 cash and zero remaining liquid assets ` +
      `(Visa/Passport Captured, No Stocks, No Properties). Financial recovery is impossible. ${player.id} is eliminated!`;

    console.error(bankruptcyMessage);
    
    // Trigger player elimination
    eliminatePlayer(player.id, bankruptcyMessage);
    
    if (onAlert) {
      onAlert(
        '🚨 ABSOLUTE BANKRUPTCY DETECTED',
        `Player: ${player.id} (${playerLabel})\nStatus: Total Net Liquidity reached $0. With $0 Cash, all travel documents captured, and no stocks or properties remaining to mortgage, financial recovery is impossible.\nOutcome: Player is immediately eliminated from the game.`,
        'danger'
      );
    }

    return {
      isBankrupt: true,
      message: bankruptcyMessage
    };
  }

  return { isBankrupt: false };
};

/**
 * 4. Automatic Economic Monitoring
 * Function to automatically and immediately monitor all player assets (Human and AI bots alike) on every turn cycle or asset update.
 * Scans for dynamic Black Money threshold (> $70,000 USD default, or configured scaling) and Low Income (< $2,500 USD).
 * Ensures AI bot assets and documents are tracked and penalized with identical parity to human players.
 */
export const runAutomaticEconomicMonitoring = (
  players: any[],
  setPlayers: React.Dispatch<React.SetStateAction<any[]>>,
  eliminatePlayer: (playerId: number, reason?: string) => void,
  visaCost?: number,
  passportCost?: number,
  onAlert?: (title: string, desc: string, type: 'warning' | 'danger') => void,
  config: BlackMoneyConfig = BLACK_MONEY_CONFIG,
  setBankProperties?: any
) => {
  if (!players || players.length === 0) return;

  const eliminations: { id: number; reason: string }[] = [];
  const alerts: { title: string; desc: string; type: 'warning' | 'danger' }[] = [];

  setPlayers((prevPlayers) => {
    return prevPlayers.map((player) => {
      const liquidCash = player.totalCash ?? player.cash ?? 0;
      let updatedCash = player.cash;
      let updatedTotalCash = player.totalCash ?? player.cash;
      let updatedNetWorth = player.netWorth ?? liquidCash;
      let updatedDocs = { ...(player.documents || {}) };
      let updatedWarnings = player.lowIncomeWarnings || 0;
      let stateChanged = false;

      // 0. ABSOLUTE INSOLVENCY CHECK ($0 Cash, no stocks, no properties, all docs captured)
      const isVisaCaptured = updatedDocs.visaCaptured ?? true;
      const isPassportCaptured = updatedDocs.passportCaptured ?? true;
      let stockPositions = 0;
      if (player.shares?.holdings) stockPositions += Object.keys(player.shares.holdings).length;
      if (player.stocks) stockPositions += Object.values(player.stocks).filter((s: any) => (s?.shares ?? 0) > 0).length;
      if (player.investments) stockPositions += Object.values(player.investments).filter((v: any) => (v ?? 0) > 0).length;
      const propertyCount = (player.propertiesOwned || []).length;

      if (liquidCash === 0 && isVisaCaptured && isPassportCaptured && stockPositions === 0 && propertyCount === 0) {
        const playerLabel = player.isAi || player.isAI ? `${player.name || `Player ${player.id}`} (AI)` : player.name || `Player ${player.id}`;
        eliminations.push({
          id: player.id,
          reason: `🚨 ABSOLUTE BANKRUPTCY: ${player.id} has $0 cash and zero remaining liquid assets (Visa/Passport Captured, No Stocks, No Properties). Financial recovery is impossible.`,
        });
        alerts.push({
          title: '🚨 ABSOLUTE BANKRUPTCY DETECTED',
          desc: `Player: ${player.id} (${playerLabel})\nStatus: Total Net Liquidity reached $0. With $0 Cash, all travel documents captured, and no stocks or properties remaining to mortgage, financial recovery is impossible.\nOutcome: Player is immediately eliminated from the game.`,
          type: 'danger',
        });
        console.error(`🚨 ABSOLUTE BANKRUPTCY: ${player.id} is eliminated due to total insolvency.`);
      }

      // 1. AUTOMATIC DUAL-THRESHOLD BLACK MONEY DETECTION (Net Worth > $70k OR Cash > $40k)
      const calculatedNetWorth = calculateTotalNetWorth(player);
      const exceedsNetWorth = calculatedNetWorth > config.NET_WORTH_THRESHOLD;
      const exceedsLiquidCash = liquidCash > config.LIQUID_CASH_THRESHOLD;

      if (exceedsNetWorth || exceedsLiquidCash) {
        const excessAmount = exceedsNetWorth
          ? calculatedNetWorth - config.NET_WORTH_THRESHOLD
          : liquidCash - config.LIQUID_CASH_THRESHOLD;

        const fine = Math.min(
          liquidCash,
          Math.round(config.BASE_FINE + excessAmount * config.EXCESS_PENALTY_RATE)
        );

        const needsPenalty = !updatedDocs.blackMoneyFlagged || !updatedDocs.visaCaptured || !updatedDocs.passportCaptured;

        if (needsPenalty) {
          updatedCash = Math.max(0, updatedCash - fine);
          updatedTotalCash = Math.max(0, updatedTotalCash - fine);
          updatedNetWorth = Math.max(0, calculatedNetWorth - fine);
          updatedDocs = {
            ...updatedDocs,
            visaCaptured: true, // VISA legally confiscated
            passportCaptured: true, // PASSPORT legally confiscated
            blackMoneyFlagged: true, // Flagged for exceeding threshold
          };
          stateChanged = true;

          const playerLabel = player.isAi || player.isAI ? `${player.name} (AI)` : player.name || `Player ${player.id}`;
          console.warn(
            `🚨 [BLACK MONEY ENFORCED]\n` +
            `• Target: ${playerLabel}\n` +
            `• Total Net Worth: $${calculatedNetWorth.toLocaleString()} USD (Limit: $${config.NET_WORTH_THRESHOLD.toLocaleString()})\n` +
            `• Liquid Cash: $${liquidCash.toLocaleString()} USD (Limit: $${config.LIQUID_CASH_THRESHOLD.toLocaleString()})\n` +
            `• Dynamic Penalty Deducted: -$${fine.toLocaleString()} USD\n` +
            `• Documents Confiscated: Visa (Captured), Passport (Captured)`
          );

          alerts.push({
            title: `🚨 BLACK MONEY SEIZURE (-$${fine.toLocaleString()})`,
            desc: `${playerLabel} breached limits (Net Worth: $${calculatedNetWorth.toLocaleString()}, Cash: $${liquidCash.toLocaleString()}). Dynamic penalty of $${fine.toLocaleString()} USD deducted, Visa & Passport confiscated!`,
            type: 'danger',
          });

          // If bank properties setter provided, strip properties back to bank
          if (setBankProperties && typeof setBankProperties === 'function') {
            setBankProperties((prevPool: any[]) => {
              if (!Array.isArray(prevPool)) return prevPool;
              if (prevPool.length > 0 && 'ownerId' in prevPool[0]) {
                return prevPool.map((s: any) =>
                  s.ownerId === player.id
                    ? { ...s, ownerId: undefined, isOwned: false, hasHouse: false, houses: 0 }
                    : s
                );
              }
              return prevPool;
            });
          }
        }
      } else if (!exceedsNetWorth && !exceedsLiquidCash && updatedDocs.blackMoneyFlagged) {
        // Reset black money flag if player/AI drops back below both thresholds
        updatedDocs = { ...updatedDocs, blackMoneyFlagged: false };
        stateChanged = true;
      }

      // 2. AUTOMATIC LOW-INCOME WARNING & BANKRUPTCY (< $2,500 USD) - Applied equally to Human & AI
      const lowIncomeThreshold = LOW_INCOME_THRESHOLD;
      const currentLiquid = updatedTotalCash ?? updatedCash ?? 0;
      let currentStreak = player.lowIncomeStreak ?? player.lowIncomeWarnings ?? 0;

      if (currentLiquid < lowIncomeThreshold) {
        currentStreak += 1;
        updatedWarnings = currentStreak;
        stateChanged = true;
        const isAi = player.isAi || player.isAI;
        const playerLabel = isAi ? `🤖 AI Bot (${player.name || player.id})` : `👤 Player (${player.name || player.id})`;

        if (currentStreak > MAX_ALLOWED_LOW_INCOME_STREAKS) {
          eliminations.push({
            id: player.id,
            reason: `🚨 REPEATED LOW-INCOME BANKRUPTCY DETECTED: ${playerLabel} failed to recover from low-income status for ${currentStreak} consecutive turns (>3 turns below $2,500 USD).`,
          });
          alerts.push({
            title: '💥 BANKRUPTCY: Stagnancy Limit Exceeded',
            desc: `${playerLabel} had liquid cash under $2,500 USD for ${currentStreak} consecutive rounds (> 3 allowed) and has been eliminated.`,
            type: 'danger',
          });
          console.error(
            `🚨 [AUTOMATIC BANKRUPTCY] ${playerLabel} exceeded 3 consecutive low-income turns (${currentStreak} turns < $2,500 USD) and has been eliminated!`
          );
        } else {
          const warningMessage = GET_STREAK_MESSAGE(player.name || player.id, currentStreak);
          alerts.push({
            title: `⚠️ Low Income Warning (Strike ${currentStreak}/3)`,
            desc: warningMessage,
            type: currentStreak === 3 ? 'danger' : 'warning',
          });
          console.warn(
            `⚠️ [AUTOMATIC WARNING] ${playerLabel}: ${warningMessage}`
          );
        }
      } else if (currentLiquid >= lowIncomeThreshold && currentStreak > 0) {
        // Reset streak counter if cash recovered above $2,500 USD
        currentStreak = 0;
        updatedWarnings = 0;
        stateChanged = true;
        console.log(`✅ FINANCIAL RECOVERY: ${player.name || player.id} recovered above $2,500 USD. Streak counter reset to 0.`);
      }

      if (stateChanged) {
        return {
          ...player,
          cash: updatedCash,
          totalCash: updatedTotalCash,
          netWorth: updatedNetWorth,
          propertiesOwned: (liquidCash > (config.LIQUID_CASH_THRESHOLD || config.THRESHOLD || 40000)) ? [] : player.propertiesOwned,
          documents: updatedDocs,
          lowIncomeWarnings: updatedWarnings,
          lowIncomeStreak: currentStreak,
        };
      }

      return player;
    });
  });

  // Dispatch all aggregated alerts and eliminations
  alerts.forEach((alert) => {
    if (onAlert) onAlert(alert.title, alert.desc, alert.type);
  });

  eliminations.forEach((elim) => {
    eliminatePlayer(elim.id, elim.reason);
  });
};

/**
 * Function to check if a player is allowed to move/travel based on Visa status.
 * If a player does not have a valid Visa (visaCaptured: true or missing),
 * they are blocked from moving or traveling across the board until they purchase or renew a new one at the shop.
 */
export const handlePlayerMovementAttempt = (
  player: any,
  targetTile?: any,
  setNotification?: (msg: string) => void
): { canTravel: boolean; message?: string } => {
  const isVisaCaptured = player.documents?.visaCaptured;
  const hasValidVisa = !isVisaCaptured;

  // If the player does not have a valid Visa, block travel movement
  if (!hasValidVisa) {
    const errorMsg =
      '❌ Travel Restricted: You do not have a valid Visa! You cannot travel or move forward until you buy or renew a new Visa at the shop.';
    if (setNotification) {
      setNotification(errorMsg);
    }
    return { canTravel: false, message: errorMsg };
  }

  // Visa is valid, allow normal movement/travel
  return {
    canTravel: true,
    message: targetTile ? `Visa verified. Moving to ${targetTile.name}...` : 'Visa verified. Travel allowed.',
  };
};

export const LOW_INCOME_THRESHOLD = 2500;
export const MAX_ALLOWED_LOW_INCOME_STREAKS = 3;

/**
 * Custom system warning messages per strike level
 */
const GET_STREAK_MESSAGE = (entityId: number | string, streakCount: number): string => {
  const messages: Record<number, string> = {
    1: `⚠️ FINANCIAL WARNING (Strike 1/3): ${entityId}'s liquid cash dropped below $2,500 USD! Income recovery required.`,
    2: `⚠️ CRITICAL INCOME ALERT (Strike 2/3): ${entityId} is facing repeated low income! Generate revenue or sell assets soon.`,
    3: `🚨 INSOLVENCY DANGER (Strike 3/3): Final Warning! If ${entityId} ends the next turn with low income, automatic bankruptcy will trigger!`
  };
  return messages[streakCount] || `⚠️ ${entityId} is in low income state (Strike ${streakCount}/3).`;
};

/**
 * Evaluates Low-Income Streaks and handles Bankruptcy Elimination
 */
export const processLowIncomeStreak = (
  entity: any,
  setPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
  eliminatePlayer?: (playerId: number, reason?: string) => void,
  onAlert?: (title: string, desc: string, type: 'warning' | 'danger') => void
): { isBankrupt: boolean; streakCount: number; message?: string } => {
  let updated = { ...entity };
  const currentCash = updated.totalCash ?? updated.cash ?? 0;

  // Retrieve current streak counter (defaults to lowIncomeStreak or lowIncomeWarnings or 0)
  let currentStreak = updated.lowIncomeStreak ?? updated.lowIncomeWarnings ?? 0;

  // 1. CONDITION: Entity is in Low Income State (< $2,500 Cash)
  if (currentCash < LOW_INCOME_THRESHOLD) {
    currentStreak += 1;
    updated.lowIncomeStreak = currentStreak;
    updated.lowIncomeWarnings = currentStreak;

    // A. EXCEEDED 3 STRIKES (4th strike) -> TRIGGER IMMEDIATE BANKRUPTCY
    if (currentStreak > MAX_ALLOWED_LOW_INCOME_STREAKS) {
      const isAI = updated.isAi || updated.isAI || false;
      const entityLabel = isAI ? `🤖 AI Bot (${updated.id})` : `👤 Player (${updated.id})`;

      const bankruptcyMessage = 
        `🚨 REPEATED LOW-INCOME BANKRUPTCY DETECTED\n` +
        `Entity: ${updated.id}\n` +
        `Status: ${entityLabel} failed to recover from low-income status for ${currentStreak} consecutive turns.\n` +
        `Outcome: Financial stagnancy limit exceeded (>3 turns below $2,500 USD). ${updated.id} is immediately eliminated!`;

      console.error(bankruptcyMessage);

      // Eliminate player and remove from turn sequence
      if (typeof eliminatePlayer === 'function') {
        eliminatePlayer(updated.id, bankruptcyMessage);
      }

      if (onAlert) {
        onAlert(
          '💥 BANKRUPTCY: Repeated Low Income',
          `${entityLabel} had liquid cash below $2,500 USD for ${currentStreak} consecutive rounds (> 3 allowed) and has been eliminated.`,
          'danger'
        );
      }

      return {
        isBankrupt: true,
        streakCount: currentStreak,
        message: bankruptcyMessage
      };
    } 

    // B. WITHIN 1 TO 3 STRIKES -> SEND WARNING MESSAGE & CONTINUE GAMEPLAY
    else {
      const warningMessage = GET_STREAK_MESSAGE(updated.name || updated.id, currentStreak);
      console.warn(warningMessage);

      // Save updated streak counter to player state
      if (typeof setPlayers === 'function') {
        setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p));
      }

      if (onAlert) {
        onAlert(
          `⚠️ Low Income Warning (Strike ${currentStreak}/3)`,
          warningMessage,
          currentStreak === 3 ? 'danger' : 'warning'
        );
      }

      return {
        isBankrupt: false,
        streakCount: currentStreak,
        message: warningMessage
      };
    }
  } 

  // 2. CONDITION: Cash Recovered (>= $2,500) -> RESET STREAK COUNTER TO 0
  else if (currentStreak > 0) {
    updated.lowIncomeStreak = 0;
    updated.lowIncomeWarnings = 0;
    console.log(`✅ FINANCIAL RECOVERY: ${updated.name || updated.id} recovered above $2,500 USD. Streak counter reset to 0.`);

    if (typeof setPlayers === 'function') {
      setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p));
    }
  }

  return { isBankrupt: false, streakCount: 0 };
};

// Random helper within a range
export const getRandomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

// Personality profiles to make each bot feel unique
export const AI_PERSONALITIES = {
  RISK_TAKER: 'RISK_TAKER',   // Keeps low cash reserves, buys aggressively
  CONSERVATIVE: 'CONSERVATIVE', // Saves cash, avoids risky purchases
  BALANCED: 'BALANCED'         // Plays standard strategy
} as const;

export type AIPersonalityType = (typeof AI_PERSONALITIES)[keyof typeof AI_PERSONALITIES];

/**
 * Executes a human-like turn for an AI Bot
 */
export const executeHumanizedAITurn = (
  aiBot: any,
  setPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
  availableProperties: any[] = []
) => {
  if (!aiBot.isAI && !aiBot.isAi) return aiBot;

  let bot = JSON.parse(JSON.stringify(aiBot)); // Deep clone state
  const currentCash = bot.totalCash ?? bot.cash ?? 0;
  
  // Assign a random personality if not already set
  if (!bot.personality) {
    const personalities = Object.values(AI_PERSONALITIES);
    bot.personality = personalities[getRandomInt(0, personalities.length - 1)];
  }

  // 1. HUMANIZED DOCUMENT BUYBACK (Not instant, depends on panic/personality)
  if (bot.documents?.visaCaptured) {
    // 15% chance a human "forgets" or delays buying a Visa even if they have cash
    const forgetChance = Math.random() < 0.15;
    
    if (currentCash >= 10000 && !forgetChance) {
      bot.totalCash = currentCash - 10000;
      bot.cash = bot.totalCash;
      bot.documents.visaCaptured = false;
      console.log(`🤖 [HUMANIZED AI] ${bot.id} (${bot.personality}) decided to buy back Visa.`);
    } else if (forgetChance) {
      console.log(`🤖 [HUMANIZED AI] ${bot.id} has enough cash for a Visa but skipped it this turn!`);
    }
  }

  // 2. HUMANIZED EMERGENCY SELLING (Panic vs Calculated)
  // Humans don't always sell the exact mathematical amount; they might panic-sell too much or sell too late.
  if ((bot.totalCash ?? bot.cash ?? 0) < 2500 && bot.shares?.holdings) {
    const symbols = Object.keys(bot.shares.holdings).filter(s => (bot.shares.holdings[s] || 0) > 0);
    
    if (symbols.length > 0) {
      // Pick a random stock symbol to sell instead of always optimal ones
      const randomSymbol = symbols[getRandomInt(0, symbols.length - 1)];
      const currentQty = bot.shares.holdings[randomSymbol];
      
      // 30% chance of a "Panic Sell" (sells all shares of that stock)
      const isPanicSell = Math.random() < 0.30;
      const sellQty = isPanicSell ? currentQty : getRandomInt(1, currentQty);
      
      const price = bot.shares.prices?.[randomSymbol] || 500;
      const proceeds = sellQty * price;
      bot.totalCash = (bot.totalCash ?? bot.cash ?? 0) + proceeds;
      bot.cash = bot.totalCash;
      bot.shares.holdings[randomSymbol] -= sellQty;

      console.log(
        `🤖 [HUMANIZED AI] ${bot.id} ${isPanicSell ? 'PANIC SOLD' : 'sold'} ` +
        `${sellQty} shares of ${randomSymbol} for $${proceeds} USD.`
      );
    }
  }

  // Also support stocks format for humanized emergency selling if present
  if ((bot.totalCash ?? bot.cash ?? 0) < 2500 && bot.stocks) {
    const stockKeys = Object.keys(bot.stocks).filter((k) => (bot.stocks[k]?.shares || bot.stocks[k]?.quantity || 0) > 0);
    if (stockKeys.length > 0) {
      const randomStockKey = stockKeys[getRandomInt(0, stockKeys.length - 1)];
      const holding = bot.stocks[randomStockKey];
      const currentQty = holding.shares || holding.quantity || 0;
      const isPanicSell = Math.random() < 0.30;
      const sellQty = isPanicSell ? currentQty : getRandomInt(1, currentQty);
      const price = holding.currentPrice || holding.price || 500;
      const proceeds = sellQty * price;

      bot.totalCash = (bot.totalCash ?? bot.cash ?? 0) + proceeds;
      bot.cash = bot.totalCash;
      holding.shares = currentQty - sellQty;

      console.log(
        `🤖 [HUMANIZED AI] ${bot.id} ${isPanicSell ? 'PANIC SOLD' : 'sold'} ` +
        `${sellQty} shares of ${randomStockKey} for $${proceeds} USD.`
      );
    }
  }

  // 3. HUMANIZED PROPERTY BUYING (Impulse purchases)
  const currentBotCash = bot.totalCash ?? bot.cash ?? 0;
  if (availableProperties.length > 0 && currentBotCash > 5000) {
    // Decision threshold based on personality
    let buyProbability = 0.50; // Balanced
    if (bot.personality === AI_PERSONALITIES.RISK_TAKER) buyProbability = 0.80;
    if (bot.personality === AI_PERSONALITIES.CONSERVATIVE) buyProbability = 0.25;

    // Roll dice for impulse buy
    if (Math.random() < buyProbability) {
      const unownedProps = availableProperties.filter((p: any) => !p.isOwned && !p.ownerId && p.price);
      const poolToChoose = unownedProps.length > 0 ? unownedProps : availableProperties;
      const randomProp = poolToChoose[getRandomInt(0, poolToChoose.length - 1)];
      const propPrice = Number(randomProp.price) || 5000;

      if ((bot.totalCash ?? bot.cash ?? 0) >= propPrice) {
        bot.totalCash = (bot.totalCash ?? bot.cash ?? 0) - propPrice;
        bot.cash = bot.totalCash;
        bot.propertiesOwned = bot.propertiesOwned || [];
        bot.propertiesOwned.push(randomProp);
        console.log(`🤖 [HUMANIZED AI] ${bot.id} impulse-bought property: ${randomProp.name || 'Real Estate'}`);
      }
    }
  }

  // Save state back to global players list
  if (typeof setPlayers === 'function') {
    setPlayers(prev => prev.map(p => p.id === bot.id ? bot : p));
  }

  return bot;
};

/**
 * Simulates human turn delay (e.g., 1.5 to 3.5 seconds) 
 * so AI turns don't happen instantaneously.
 */
export const executeAITurnWithDelay = (
  aiBot: any,
  setPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
  availableProperties: any[] = [],
  onComplete?: (updatedBot: any) => void
) => {
  const delayMs = getRandomInt(1500, 3500); // 1.5s - 3.5s thinking time
  
  const timer = setTimeout(() => {
    const updatedBot = executeHumanizedAITurn(aiBot, setPlayers, availableProperties);
    if (typeof onComplete === 'function') {
      onComplete(updatedBot);
    }
  }, delayMs);

  return timer;
};

export const CONFIG = {
  LOW_INCOME_THRESHOLD: 2500,
  MAX_LOW_INCOME_STRIKES: 3,
  NET_WORTH_BLACK_MONEY_LIMIT: 70000,
  LIQUID_CASH_BLACK_MONEY_LIMIT: 40000,
  BASE_FINE: 10000,
  EXCESS_PENALTY_RATE: 0.50
};

// Custom Warning Messages per Strike
export const GET_LOW_INCOME_WARNING = (entityId: number | string, strike: number): string => {
  const alerts: Record<number, string> = {
    1: `⚠️ LOW INCOME WARNING (Strike 1/3): ${entityId}'s liquid cash is under $2,500 USD! Liquidate assets or increase earnings.`,
    2: `⚠️ REPEATED LOW INCOME (Strike 2/3): ${entityId} is in financial distress! Prolonged low income will lead to forced closure.`,
    3: `🚨 FINAL BANKRUPTCY WARNING (Strike 3/3): Danger! If ${entityId} remains in low income next turn, immediate bankruptcy will execute!`
  };
  return alerts[strike] || `⚠️ ${entityId} low income strike ${strike}/3.`;
};

/**
 * 1. REALISTIC AI BOT BEHAVIOR SYSTEM
 * Makes AI bots act like strategic human players to prevent foolish bankruptcy.
 */
export const executeAITurnLogic = (
  aiBot: any,
  setPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
  bankProperties?: any
) => {
  if (!aiBot.isAI && !aiBot.isAi) return aiBot;
  let bot = { ...aiBot };

  // AI Document Recovery Priority: Buy Visa/Passport if captured and cash permits
  if (bot.documents?.visaCaptured && (bot.totalCash ?? bot.cash ?? 0) >= 10000) {
    const current = bot.totalCash ?? bot.cash ?? 0;
    bot.totalCash = current - 10000;
    bot.cash = bot.totalCash;
    bot.documents.visaCaptured = false;
    console.log(`🤖 AI ${bot.id} strategically purchased a new Visa for $10,000 USD to maintain mobility.`);
  }

  // AI Low-Income Defense: Auto-liquidate stocks if cash drops into danger zone (< $2,500)
  const currentCash = bot.totalCash ?? bot.cash ?? 0;
  if (currentCash < CONFIG.LOW_INCOME_THRESHOLD && bot.shares?.holdings) {
    Object.keys(bot.shares.holdings).forEach(symbol => {
      const qty = bot.shares.holdings[symbol] || 0;
      const botCash = bot.totalCash ?? bot.cash ?? 0;
      if (qty > 0 && botCash < CONFIG.LOW_INCOME_THRESHOLD) {
        const sharePrice = bot.shares.prices?.[symbol] || 500;
        const sellQty = Math.min(qty, Math.ceil((CONFIG.LOW_INCOME_THRESHOLD - botCash) / sharePrice));
        
        const newCash = botCash + sellQty * sharePrice;
        bot.totalCash = newCash;
        bot.cash = newCash;
        bot.shares.holdings[symbol] -= sellQty;
        console.log(`🤖 AI ${bot.id} liquidated ${sellQty} shares of ${symbol} to avoid a Low-Income Strike!`);
      }
    });
  }

  // Also support stocks format if present
  if ((bot.totalCash ?? bot.cash ?? 0) < CONFIG.LOW_INCOME_THRESHOLD && bot.stocks) {
    Object.keys(bot.stocks).forEach(symbol => {
      const holding = bot.stocks[symbol];
      const shares = holding?.shares || holding?.quantity || 0;
      const botCash = bot.totalCash ?? bot.cash ?? 0;
      if (shares > 0 && botCash < CONFIG.LOW_INCOME_THRESHOLD) {
        const sharePrice = holding?.currentPrice || holding?.price || 500;
        const sellQty = Math.min(shares, Math.ceil((CONFIG.LOW_INCOME_THRESHOLD - botCash) / sharePrice));
        const newCash = botCash + sellQty * sharePrice;
        bot.totalCash = newCash;
        bot.cash = newCash;
        holding.shares = shares - sellQty;
        console.log(`🤖 AI ${bot.id} liquidated ${sellQty} shares of ${symbol} to avoid a Low-Income Strike!`);
      }
    });
  }

  // Save AI updates
  if (typeof setPlayers === 'function') {
    setPlayers((prev: any[]) => prev.map((p: any) => p.id === bot.id ? bot : p));
  }
  return bot;
};

/**
 * 2. UNIVERSAL BANKRUPTCY & STREAK EVALUATOR
 * Checks Absolute Insolvency OR Forced 3-Strike Low-Income Bankruptcy.
 */
export const evaluateEntityBankruptcy = (
  entity: any,
  setPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
  eliminatePlayer?: (playerId: number, reason?: string) => void
) => {
  let updated = { ...entity };
  const cash = updated.totalCash ?? updated.cash ?? 0;

  // Asset Count Calculations
  const isVisaCaptured = updated.documents?.visaCaptured ?? true;
  const isPassportCaptured = updated.documents?.passportCaptured ?? true;
  const hasNoDocs = isVisaCaptured && isPassportCaptured;

  const stockHoldings: Record<string, any> = updated.shares?.holdings || {};
  let totalShares = Object.values(stockHoldings).reduce<number>((a, b) => a + (Number(b) || 0), 0);
  if (updated.stocks) {
    totalShares += Object.values(updated.stocks as Record<string, any>).reduce<number>((a, s) => a + (Number(s?.shares || s?.quantity) || 0), 0);
  }
  const propertyCount = (updated.propertiesOwned || []).length;

  const isAI = updated.isAI || updated.isAi || false;
  const label = isAI ? `🤖 AI Bot (${updated.name || updated.id})` : `👤 Player (${updated.name || updated.id})`;

  // CONDITION A: ABSOLUTE INSOLVENCY ($0 Cash + Zero Liquidatable Assets)
  if (cash === 0 && hasNoDocs && totalShares === 0 && propertyCount === 0) {
    const bankruptcyMessage = 
      `🚨 ABSOLUTE BANKRUPTCY DETECTED\n` +
      `Target: ${label}\n` +
      `Status: Total Net Liquidity reached $0. Cash is $0, documents are captured, and no stocks/properties remain.\n` +
      `Outcome: ${label} is forcefully eliminated from the game!`;

    console.error(bankruptcyMessage);
    if (typeof eliminatePlayer === 'function') eliminatePlayer(updated.id, bankruptcyMessage);
    return { isBankrupt: true, message: bankruptcyMessage };
  }

  // CONDITION B: REPEATED LOW-INCOME STREAK (< $2,500 Cash)
  let streak = updated.lowIncomeStreak ?? updated.lowIncomeWarnings ?? 0;

  if (cash < CONFIG.LOW_INCOME_THRESHOLD) {
    streak += 1;
    updated.lowIncomeStreak = streak;
    updated.lowIncomeWarnings = streak;

    // FORCED BANKRUPTCY AFTER MORE THAN 3 STRIKES (4th Strike)
    if (streak > CONFIG.MAX_LOW_INCOME_STRIKES) {
      const forcedMessage = 
        `🚨 FORCED BANKRUPTCY ENFORCED\n` +
        `Target: ${label}\n` +
        `Status: Failed to recover from low-income status (< $2,500 USD) for 4 consecutive turns.\n` +
        `Outcome: Financial stagnancy limit exceeded. ${label} is forcefully eliminated!`;

      console.error(forcedMessage);
      if (typeof eliminatePlayer === 'function') eliminatePlayer(updated.id, forcedMessage);
      return { isBankrupt: true, message: forcedMessage };
    } 
    
    // STRIKES 1 TO 3 WARNINGS
    else {
      const warningMessage = GET_LOW_INCOME_WARNING(updated.name || updated.id, streak);
      console.warn(warningMessage);

      if (typeof setPlayers === 'function') {
        setPlayers((prev: any[]) => prev.map((p: any) => p.id === updated.id ? updated : p));
      }
      return { isBankrupt: false, streakCount: streak, message: warningMessage };
    }
  } 
  
  // RESET STREAK COUNTER ON FINANCIAL RECOVERY (Cash >= $2,500)
  else if (streak > 0) {
    updated.lowIncomeStreak = 0;
    updated.lowIncomeWarnings = 0;
    console.log(`✅ STREAK RESET: ${label} cash restored to $${cash.toLocaleString()} USD. Low income streak reset to 0.`);
    if (typeof setPlayers === 'function') {
      setPlayers((prev: any[]) => prev.map((p: any) => p.id === updated.id ? updated : p));
    }
  }

  return { isBankrupt: false, streakCount: 0 };
};

export const BANKRUPTCY_MESSAGES = [
  "🚨 LIQUIDATION: {id} filed for Chapter 11 and has been permanently booted from the board!",
  "💸 EMPIRE COLLAPSE: {id} ran out of liquid cash and was forcibly evicted from the server!",
  "🏛️ IRS SEIZURE: Federal agents raided {id}'s headquarters. Assets seized, player eliminated!",
  "📉 MARKET CRASH: {id} suffered total insolvency and was kicked from the session!",
  "💣 FINANCIAL NUKE: {id}'s reckless debts triggered immediate total bankruptcy!"
];

export const getRandomBankruptcyMsg = (playerId: number | string) => {
  const template = BANKRUPTCY_MESSAGES[Math.floor(Math.random() * BANKRUPTCY_MESSAGES.length)];
  return template.replace("{id}", String(playerId));
};

/**
 * UNIVERSAL ELIMINATION (HUMANS & AI BOTS)
 * Strips bankrupt entities immediately from active turn order with randomized bankruptcy broadcast.
 */
export const eliminateEntityFromGame = (
  bankruptId: number, 
  customReason?: string, 
  setPlayers?: React.Dispatch<React.SetStateAction<any[]>>, 
  setEliminatedPlayers?: React.Dispatch<React.SetStateAction<any[]>>, 
  setTurnIndex?: React.Dispatch<React.SetStateAction<number>>,
  addGameLog?: (msg: string) => void
) => {
  if (typeof setPlayers !== 'function') return;

  const dynamicMsg = customReason || getRandomBankruptcyMsg(bankruptId);

  setPlayers(prevPlayers => {
    const target = prevPlayers.find(p => p.id === bankruptId);
    if (!target) return prevPlayers;

    // 1. Log to eliminated graveyard list for UI
    if (typeof setEliminatedPlayers === 'function') {
      setEliminatedPlayers(prev => [
        ...prev.filter(p => p.id !== bankruptId), 
        { ...target, isBankrupt: true, reason: dynamicMsg }
      ]);
    }

    // 2. Permanently remove from active players array (Kicks them out of server state)
    const remainingPlayers = prevPlayers.filter(p => p.id !== bankruptId);

    // 3. Recalculate turn index so active turn sequence never breaks
    if (typeof setTurnIndex === 'function' && remainingPlayers.length > 0) {
      setTurnIndex(prevIndex => prevIndex % remainingPlayers.length);
    }

    return remainingPlayers;
  });

  // Broadcast dynamic message to global feed
  if (typeof addGameLog === 'function') {
    addGameLog(dynamicMsg);
  }

  console.warn(`❌ [KICKED] ${bankruptId} removed. Reason: ${dynamicMsg}`);
};

/**
 * COMPLETE PLAYER ELIMINATION & TURN SKIPPER (Alias pointing to eliminateEntityFromGame)
 */
export const eliminatePlayerFromGame = (
  bankruptPlayerId: number, 
  bankruptcyReason?: string, 
  setPlayers?: React.Dispatch<React.SetStateAction<any[]>>, 
  setEliminatedPlayers?: React.Dispatch<React.SetStateAction<any[]>>, 
  setTurnIndex?: React.Dispatch<React.SetStateAction<number>>, 
  currentTurnIndex?: number,
  addGameLog?: (msg: string) => void
) => {
  eliminateEntityFromGame(
    bankruptPlayerId,
    bankruptcyReason,
    setPlayers,
    setEliminatedPlayers,
    setTurnIndex,
    addGameLog
  );
};

// Export liquidation and payment routines
export {
  handleTilePaymentOrBankruptcy,
  handlePlaceLandingFee,
  handleLandingFeeAndLiquidation,
  handlePlaceLandingAndLiquidation,
  checkLowIncomeWarnings,
  buyOrRenewDocumentAtShop,
  bankShopItems,
  bankShopDenominations,
  handleShopPurchase,
} from './liquidationManager';
export type { PaymentOrBankruptcyResult, BankShopItem } from './liquidationManager';

