// src/utils/liquidationManager.ts
import { BusinessPlayer } from '../components/BusinessBoard';
import { InternationalBoardSpace } from '../data/internationalBusinessData';
import { StockListing, StockHolding } from './gameEconomicsSetup';
import { CITY_PROPERTY_CARDS, TRANSIT_WAYS_CARDS } from '../components/PropertyAndWaysCards';

export interface PaymentOrBankruptcyResult {
  success: boolean;
  bankrupt?: boolean;
  eliminated?: boolean;
  message: string;
  remainingCash?: number;
  liquidatedDetails?: {
    stocksSoldValue: number;
    propertiesSoldValue: number;
    visaValue: number;
    passportValue: number;
  };
}

/**
 * Handle landing on a property/fee tile and managing insufficient funds through automated liquidation.
 * Evaluates liquid cash, liquidates stocks, properties, visa, and passport step-by-step.
 * If debt cannot be covered, eliminates the bankrupt player.
 */
export const handleTilePaymentOrBankruptcy = (
  player: BusinessPlayer,
  amountDue: number,
  setPlayers: React.Dispatch<React.SetStateAction<BusinessPlayer[]>>,
  eliminatePlayer: (playerId: number, reason?: string) => void,
  sellStockAsset?: (stockId: string, shares: number) => void,
  sellPropertyAsset?: (spaceId: number) => void,
  sellDocumentAsset?: (docType: 'visa' | 'passport') => void,
  spaces?: InternationalBoardSpace[],
  marketStocks?: StockListing[],
  setSpaces?: React.Dispatch<React.SetStateAction<InternationalBoardSpace[]>>
): PaymentOrBankruptcyResult => {
  let currentCash = player.cash ?? (player as any).totalCash ?? 0;

  // 1. Check if the player can afford the amount directly with liquid cash
  if (currentCash >= amountDue) {
    const remainingCash = currentCash - amountDue;
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) => {
        if (p.id !== player.id) return p;
        return {
          ...p,
          cash: remainingCash,
          totalCash: remainingCash,
          netWorth: Math.max(0, (p.netWorth || 0) - amountDue),
        };
      })
    );
    return {
      success: true,
      bankrupt: false,
      eliminated: false,
      remainingCash,
      message: `Paid $${amountDue.toLocaleString()} successfully.`,
    };
  }

  // 2. Insufficient liquid cash: Attempt automatic asset liquidation
  let deficit = amountDue - currentCash;
  let stocksSoldValue = 0;
  let propertiesSoldValue = 0;
  let visaValue = 0;
  let passportValue = 0;

  // Track updated state copies
  let updatedStocks: Record<string, StockHolding> = player.stocks ? { ...player.stocks } : {};
  let updatedSharesHoldings: Record<string, number> = { ...((player as any).shares?.holdings || {}) };
  let stockPrices: Record<string, number> = (player as any).shares?.prices || {};
  let updatedPropertiesOwned: number[] = [...(player.propertiesOwned || [])];
  let visaCaptured = player.documents?.visaCaptured ?? false;
  let passportCaptured = player.documents?.passportCaptured ?? false;
  let updatedVisaCount = player.documents?.VISA ?? 0;
  let updatedPassportCount = player.documents?.PASSPORT ?? 0;

  // A. Try selling stocks first
  // Support both player.shares.holdings structure and player.stocks structure
  if (Object.keys(updatedSharesHoldings).length > 0) {
    for (const stockKey of Object.keys(updatedSharesHoldings)) {
      while (deficit > 0 && (updatedSharesHoldings[stockKey] || 0) > 0) {
        const stockPrice = stockPrices[stockKey] || 100;
        updatedSharesHoldings[stockKey] -= 1;
        currentCash += stockPrice;
        deficit -= stockPrice;
        stocksSoldValue += stockPrice;
        if (sellStockAsset) sellStockAsset(stockKey, 1);
      }
    }
  }

  if (deficit > 0 && Object.keys(updatedStocks).length > 0) {
    for (const [stockId, holding] of Object.entries(updatedStocks)) {
      if (holding.shares > 0 && deficit > 0) {
        const liveStock = marketStocks?.find((s) => s.id === stockId);
        const price = liveStock?.price || holding.avgBuyPrice || 100;
        const sharesToSell = Math.min(holding.shares, Math.ceil(deficit / price));
        const saleProceeds = sharesToSell * price;

        currentCash += saleProceeds;
        deficit -= saleProceeds;
        stocksSoldValue += saleProceeds;

        const remShares = holding.shares - sharesToSell;
        if (remShares <= 0) {
          delete updatedStocks[stockId];
        } else {
          updatedStocks[stockId] = { ...holding, shares: remShares };
        }

        if (sellStockAsset) sellStockAsset(stockId, sharesToSell);
      }
    }
  }

  // B. Try selling properties if still in deficit
  const soldPropertyIds: number[] = [];
  while (deficit > 0 && updatedPropertiesOwned.length > 0) {
    const propertyId = updatedPropertiesOwned.pop();
    if (propertyId !== undefined) {
      soldPropertyIds.push(propertyId);
      const propSpace = spaces?.find((s) => s.id === propertyId);
      const propValue = propSpace
        ? CITY_PROPERTY_CARDS[propSpace.name]?.mortgage ||
          TRANSIT_WAYS_CARDS[propSpace.name]?.mortgage ||
          Math.round((propSpace.price || 2000) * 0.5)
        : 5000;

      currentCash += propValue;
      deficit -= propValue;
      propertiesSoldValue += propValue;
      if (sellPropertyAsset) sellPropertyAsset(propertyId);
    }
  }

  // C. Try selling/surrendering Visa document if still in deficit
  const hasActiveVisa = !visaCaptured && (updatedVisaCount > 0 || !player.documents || player.documents.visaCaptured === false);
  if (deficit > 0 && hasActiveVisa) {
    const visaLiquidationRate = 2000; // Standard liquidation value
    currentCash += visaLiquidationRate;
    deficit -= visaLiquidationRate;
    visaValue = visaLiquidationRate;
    visaCaptured = true;
    if (updatedVisaCount > 0) updatedVisaCount = Math.max(0, updatedVisaCount - 1);
    if (sellDocumentAsset) sellDocumentAsset('visa');
  }

  // D. Try selling/surrendering Passport document if still in deficit
  const hasActivePassport = !passportCaptured && (updatedPassportCount > 0 || !player.documents || player.documents.passportCaptured === false);
  if (deficit > 0 && hasActivePassport) {
    const passportLiquidationRate = 2000;
    currentCash += passportLiquidationRate;
    deficit -= passportLiquidationRate;
    passportValue = passportLiquidationRate;
    passportCaptured = true;
    if (updatedPassportCount > 0) updatedPassportCount = Math.max(0, updatedPassportCount - 1);
    if (sellDocumentAsset) sellDocumentAsset('passport');
  }

  // 3. Final Check: If player still cannot pay after full asset liquidation -> Bankrupt & Kicked Out
  if (deficit > 0) {
    eliminatePlayer(player.id, `Insolvency: unable to pay $${amountDue.toLocaleString()} fee even after full liquidation.`);
    return {
      success: false,
      bankrupt: true,
      eliminated: true,
      remainingCash: 0,
      message: `Player ${player.id} (${player.name}) is bankrupt and has been kicked out!`,
      liquidatedDetails: {
        stocksSoldValue,
        propertiesSoldValue,
        visaValue,
        passportValue,
      },
    };
  }

  // 4. If liquidation successfully covered the debt, update final cash balance & asset records
  const remainingCash = Math.max(0, currentCash - deficit);

  if (setSpaces && soldPropertyIds.length > 0) {
    setSpaces((prev) =>
      prev.map((s) =>
        soldPropertyIds.includes(s.id)
          ? { ...s, ownerId: undefined, isOwned: false, hasHouse: false, houses: 0 }
          : s
      )
    );
  }

  setPlayers((prevPlayers) =>
    prevPlayers.map((p) => {
      if (p.id !== player.id) return p;
      return {
        ...p,
        cash: remainingCash,
        totalCash: remainingCash,
        propertiesOwned: updatedPropertiesOwned,
        stocks: updatedStocks,
        shares: {
          ...((p as any).shares || {}),
          holdings: updatedSharesHoldings,
        },
        documents: {
          ...p.documents,
          VISA: updatedVisaCount,
          PASSPORT: updatedPassportCount,
          visaCaptured,
          passportCaptured,
        },
      };
    })
  );

  return {
    success: true,
    bankrupt: false,
    eliminated: false,
    remainingCash,
    message: `Assets liquidated successfully to cover the $${amountDue.toLocaleString()} fee.`,
    liquidatedDetails: {
      stocksSoldValue,
      propertiesSoldValue,
      visaValue,
      passportValue,
    },
  };
};

/**
 * Handle landing on a specific place tile (e.g., USA costing $8,500)
 * Evaluates player liquid cash, triggers stock & document liquidation if necessary,
 * or eliminates bankrupt player.
 */
export const handlePlaceLandingFee = (
  player: BusinessPlayer,
  placeName: string,
  feeAmount: number,
  setPlayers: React.Dispatch<React.SetStateAction<BusinessPlayer[]>>,
  eliminatePlayer: (playerId: number, reason?: string) => void,
  visaShopCost: number = 10000,
  passportShopCost: number = 5000,
  spaces?: InternationalBoardSpace[],
  marketStocks?: StockListing[],
  setSpaces?: React.Dispatch<React.SetStateAction<InternationalBoardSpace[]>>
): PaymentOrBankruptcyResult => {
  let currentCash = player.cash ?? (player as any).totalCash ?? 0;

  // 1. If the player can afford the fee directly
  if (currentCash >= feeAmount) {
    const remainingCash = currentCash - feeAmount;
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) => {
        if (p.id !== player.id) return p;
        return {
          ...p,
          cash: remainingCash,
          totalCash: remainingCash,
          netWorth: Math.max(0, (p.netWorth || 0) - feeAmount),
        };
      })
    );
    return {
      success: true,
      bankrupt: false,
      eliminated: false,
      remainingCash,
      message: `Landed on ${placeName}. Paid $${feeAmount.toLocaleString()} successfully.`,
    };
  }

  // 2. Insufficient funds: Trigger liquidation sequence to cover the deficit
  let deficit = feeAmount - currentCash;
  let stocksSoldValue = 0;
  let propertiesSoldValue = 0;
  let visaValue = 0;
  let passportValue = 0;

  // A. Sell stocks first if available
  let updatedShares: Record<string, number> = { ...((player as any).shares?.holdings || {}) };
  let stockPrices: Record<string, number> = (player as any).shares?.prices || {};
  let updatedStocks: Record<string, StockHolding> = player.stocks ? { ...player.stocks } : {};

  // Holdings selling (shares.holdings)
  Object.keys(updatedShares).forEach((stockKey) => {
    while (deficit > 0 && (updatedShares[stockKey] || 0) > 0) {
      const stockPrice = stockPrices[stockKey] || 100;
      updatedShares[stockKey] -= 1;
      currentCash += stockPrice;
      deficit -= stockPrice;
      stocksSoldValue += stockPrice;
    }
  });

  // Holdings selling (stocks)
  if (deficit > 0 && Object.keys(updatedStocks).length > 0) {
    for (const [stockId, holding] of Object.entries(updatedStocks)) {
      if (holding.shares > 0 && deficit > 0) {
        const liveStock = marketStocks?.find((s) => s.id === stockId);
        const price = liveStock?.price || holding.avgBuyPrice || 100;
        const sharesToSell = Math.min(holding.shares, Math.ceil(deficit / price));
        const saleProceeds = sharesToSell * price;

        currentCash += saleProceeds;
        deficit -= saleProceeds;
        stocksSoldValue += saleProceeds;

        const remShares = holding.shares - sharesToSell;
        if (remShares <= 0) {
          delete updatedStocks[stockId];
        } else {
          updatedStocks[stockId] = { ...holding, shares: remShares };
        }
      }
    }
  }

  // B. Sell Properties if still in deficit
  const updatedPropertiesOwned = [...(player.propertiesOwned || [])];
  const soldPropertyIds: number[] = [];
  while (deficit > 0 && updatedPropertiesOwned.length > 0) {
    const propertyId = updatedPropertiesOwned.pop();
    if (propertyId !== undefined) {
      soldPropertyIds.push(propertyId);
      const propSpace = spaces?.find((s) => s.id === propertyId);
      const propValue = propSpace
        ? CITY_PROPERTY_CARDS[propSpace.name]?.mortgage ||
          TRANSIT_WAYS_CARDS[propSpace.name]?.mortgage ||
          Math.round((propSpace.price || 2000) * 0.5)
        : 5000;

      currentCash += propValue;
      deficit -= propValue;
      propertiesSoldValue += propValue;
    }
  }

  // C. Sell Visa if still in deficit and player owns/has it active
  let visaCaptured = player.documents?.visaCaptured || false;
  let updatedVisaCount = player.documents?.VISA || 0;
  if (deficit > 0 && (!visaCaptured || updatedVisaCount > 0)) {
    const visaSellValue = Math.round(visaShopCost * 0.5); // Sell for half value / $5,000
    currentCash += visaSellValue;
    deficit -= visaSellValue;
    visaValue = visaSellValue;
    visaCaptured = true; // Marked as captured/surrendered
    updatedVisaCount = Math.max(0, updatedVisaCount - 1);
  }

  // D. Sell Passport if still in deficit and player owns/has it active
  let passportCaptured = player.documents?.passportCaptured || false;
  let updatedPassportCount = player.documents?.PASSPORT || 0;
  if (deficit > 0 && (!passportCaptured || updatedPassportCount > 0)) {
    const passportSellValue = Math.round(passportShopCost * 0.5); // Sell for half value / $2,500
    currentCash += passportSellValue;
    deficit -= passportSellValue;
    passportValue = passportSellValue;
    passportCaptured = true; // Marked as captured/surrendered
    updatedPassportCount = Math.max(0, updatedPassportCount - 1);
  }

  // 3. Final Bankruptcy Check: If deficit remains after selling everything, player is kicked out
  if (deficit > 0) {
    eliminatePlayer(player.id, `Player couldn't pay $${feeAmount.toLocaleString()} for ${placeName} even after full liquidation.`);
    return {
      success: false,
      bankrupt: true,
      eliminated: true,
      remainingCash: 0,
      message: `Player ${player.id} (${player.name}) couldn't pay $${feeAmount.toLocaleString()} for ${placeName} even after liquidation. BANKRUPT & kicked out!`,
      liquidatedDetails: {
        stocksSoldValue,
        propertiesSoldValue,
        visaValue,
        passportValue,
      },
    };
  }

  // 4. Liquidation successful: Update player's remaining cash and document status
  const finalCash = Math.max(0, currentCash - deficit);

  if (setSpaces && soldPropertyIds.length > 0) {
    setSpaces((prev) =>
      prev.map((s) =>
        soldPropertyIds.includes(s.id)
          ? { ...s, ownerId: undefined, isOwned: false, hasHouse: false, houses: 0 }
          : s
      )
    );
  }

  setPlayers((prevPlayers) =>
    prevPlayers.map((p) => {
      if (p.id !== player.id) return p;
      return {
        ...p,
        cash: finalCash,
        totalCash: finalCash,
        propertiesOwned: updatedPropertiesOwned,
        stocks: updatedStocks,
        shares: {
          ...((p as any).shares || {}),
          holdings: updatedShares,
        },
        documents: {
          ...p.documents,
          VISA: updatedVisaCount,
          PASSPORT: updatedPassportCount,
          visaCaptured,
          passportCaptured,
        },
      };
    })
  );

  return {
    success: true,
    bankrupt: false,
    eliminated: false,
    remainingCash: finalCash,
    message: `Assets liquidated to pay $${feeAmount.toLocaleString()} for landing on ${placeName}.`,
    liquidatedDetails: {
      stocksSoldValue,
      propertiesSoldValue,
      visaValue,
      passportValue,
    },
  };
};

/**
 * SHOP LOGIC: Renew / Buy Visa or Passport back at the shop / embassy
 */
export const buyOrRenewDocumentAtShop = (
  player: BusinessPlayer,
  docType: 'visa' | 'passport',
  shopCost: number,
  setPlayers: React.Dispatch<React.SetStateAction<BusinessPlayer[]>>
): { success: boolean; message: string } => {
  const currentCash = player.cash ?? (player as any).totalCash ?? 0;

  if (currentCash < shopCost) {
    return {
      success: false,
      message: `Insufficient funds! You need $${shopCost.toLocaleString()} to buy/renew your ${docType.toUpperCase()}.`,
    };
  }

  setPlayers((prevPlayers) =>
    prevPlayers.map((p) => {
      if (p.id !== player.id) return p;

      const pCash = p.cash ?? (p as any).totalCash ?? 0;
      const updatedCash = pCash - shopCost;
      const isVisa = docType === 'visa';

      return {
        ...p,
        cash: updatedCash,
        totalCash: updatedCash,
        documents: {
          ...p.documents,
          [isVisa ? 'visaCaptured' : 'passportCaptured']: false,
          [isVisa ? 'VISA' : 'PASSPORT']: Math.max(1, (p.documents?.[isVisa ? 'VISA' : 'PASSPORT'] || 0)),
        },
      };
    })
  );

  return {
    success: true,
    message: `Successfully purchased/renewed ${docType.toUpperCase()} at the shop for $${shopCost.toLocaleString()}.`,
  };
};

/**
 * Handle landing on a place fee, automatic multi-tiered asset liquidation (Stocks -> Properties -> Visa -> Passport),
 * and bankruptcy elimination.
 */
export const handleLandingFeeAndLiquidation = (
  player: any,
  placeName: string,
  placeValue: number,
  setPlayers: React.Dispatch<React.SetStateAction<any[]>>,
  eliminatePlayer: (playerId: number, reason?: string) => void,
  sellStockAsset?: (stockId: string, shares: number) => void,
  sellPropertyAsset?: (spaceId: number) => void,
  sellDocumentAsset?: (docType: 'visa' | 'passport') => void
): { success: boolean; bankrupt?: boolean; message: string } => {
  let currentCash = player.totalCash ?? player.cash ?? 0;

  // 1. Check if the player has enough cash to pay the place value directly
  if (currentCash >= placeValue) {
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) => {
        if (p.id !== player.id) return p;
        const newCash = (p.totalCash ?? p.cash ?? 0) - placeValue;
        return { ...p, totalCash: newCash, cash: newCash };
      })
    );
    return { success: true, message: `Landed on ${placeName}. Paid $${placeValue.toLocaleString()} successfully.` };
  }

  // 2. Insufficient funds: Automatically liquidate assets to cover the deficit
  let deficit = placeValue - currentCash;

  // A. Sell Stock Market holdings first
  let updatedShares = { ...(player.shares?.holdings || {}) };
  let stockPrices = player.shares?.prices || {};

  Object.keys(updatedShares).forEach((stockKey) => {
    while (deficit > 0 && updatedShares[stockKey] > 0) {
      const stockPrice = stockPrices[stockKey] || 100;
      updatedShares[stockKey] -= 1;
      currentCash += stockPrice;
      deficit -= stockPrice;
      if (sellStockAsset) sellStockAsset(stockKey, 1);
    }
  });

  // B. Sell Properties if still in deficit
  let updatedProperties = [...(player.propertiesOwned || [])];
  while (deficit > 0 && updatedProperties.length > 0) {
    const liquidatedPropertyId = updatedProperties.pop();
    const propertyLiquidationValue = 5000; // Standard property sell-back value
    currentCash += propertyLiquidationValue;
    deficit -= propertyLiquidationValue;
    if (sellPropertyAsset && liquidatedPropertyId !== undefined) {
      sellPropertyAsset(liquidatedPropertyId);
    }
  }

  // C. Sell Visa if still in deficit and active/not already captured
  let visaCaptured = player.documents?.visaCaptured || false;
  if (deficit > 0 && !visaCaptured) {
    const visaValue = 2500; // Liquidated value for Visa
    currentCash += visaValue;
    deficit -= visaValue;
    visaCaptured = true;
    if (sellDocumentAsset) sellDocumentAsset('visa');
  }

  // D. Sell Passport if still in deficit and active/not already captured
  let passportCaptured = player.documents?.passportCaptured || false;
  if (deficit > 0 && !passportCaptured) {
    const passportValue = 2500; // Liquidated value for Passport
    currentCash += passportValue;
    deficit -= passportValue;
    passportCaptured = true;
    if (sellDocumentAsset) sellDocumentAsset('passport');
  }

  // 3. Final Bankruptcy Check: If the player still cannot pay after exhausting all asset liquidations
  if (deficit > 0) {
    eliminatePlayer(player.id, `Couldn't pay $${placeValue.toLocaleString()} for ${placeName} even after liquidation.`);
    return {
      success: false,
      bankrupt: true,
      message: `Player ${player.id} couldn't pay $${placeValue.toLocaleString()} for ${placeName} even after selling stocks, properties, and travel documents. BANKRUPT & kicked out!`,
    };
  }

  // 4. Successful Liquidation: Update player's remaining cash and asset inventories
  const remainingCash = currentCash - deficit;
  setPlayers((prevPlayers) =>
    prevPlayers.map((p) => {
      if (p.id !== player.id) return p;
      return {
        ...p,
        totalCash: Math.max(0, remainingCash),
        cash: Math.max(0, remainingCash),
        propertiesOwned: updatedProperties,
        shares: { ...p.shares, holdings: updatedShares },
        documents: {
          ...p.documents,
          visaCaptured,
          passportCaptured,
        },
      };
    })
  );

  return {
    success: true,
    message: `Assets successfully liquidated to cover the $${placeValue.toLocaleString()} fee for landing on ${placeName}.`,
  };
};

/**
 * Function to evaluate low income and apply bankruptcy after 3 consecutive warnings (< $2,500 USD liquid cash).
 */
export const checkLowIncomeWarnings = (
  player: any,
  setPlayers: React.Dispatch<React.SetStateAction<any[]>>,
  eliminatePlayer: (playerId: number, reason?: string) => void
): { bankrupt: boolean; message: string; warningCount?: number } => {
  const liquidCash = player.cash ?? player.totalCash ?? 0;
  const threshold = 2500;

  if (liquidCash < threshold) {
    // Increment warning count
    const currentWarnings = (player.lowIncomeWarnings || 0) + 1;

    setPlayers((prevPlayers) =>
      prevPlayers.map((p) => {
        if (p.id !== player.id) return p;
        return {
          ...p,
          lowIncomeWarnings: currentWarnings,
        };
      })
    );

    if (currentWarnings >= 3) {
      // 3 warnings reached -> Bankrupt & Kicked Out
      eliminatePlayer(
        player.id,
        `Received 3 consecutive low-income warnings (< $2,500 USD) and was declared bankrupt.`
      );
      return {
        bankrupt: true,
        warningCount: currentWarnings,
        message: `Player ${player.id} (${player.name || 'Player'}) received 3 low-income warnings (< $2,500 USD) and is now bankrupt!`,
      };
    } else {
      return {
        bankrupt: false,
        warningCount: currentWarnings,
        message: `Low income warning (${currentWarnings}/3)! Cash is below $2,500 USD.`,
      };
    }
  } else {
    // Reset warnings if cash goes back above the threshold
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) => {
        if (p.id !== player.id || (p.lowIncomeWarnings || 0) === 0) return p;
        return {
          ...p,
          lowIncomeWarnings: 0, // Reset warning streak on recovery
        };
      })
    );
  }

  return { bankrupt: false, warningCount: 0, message: 'Income level is safe.' };
};

/**
 * Function to handle automatic place landing payment and liquidation recovery options (stocks, properties, travel documents)
 * and final bankruptcy elimination.
 */
export const handlePlaceLandingAndLiquidation = (
  player: any,
  placeName: string,
  placePrice: number,
  setPlayers: React.Dispatch<React.SetStateAction<any[]>>,
  eliminatePlayer: (playerId: number, reason?: string) => void
): { success: boolean; bankrupt?: boolean; message: string } => {
  let currentCash = player.totalCash ?? player.cash ?? 0;

  // 1. Check if the player can afford the place price directly
  if (currentCash >= placePrice) {
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) => {
        if (p.id !== player.id) return p;
        const remaining = (p.totalCash ?? p.cash ?? 0) - placePrice;
        return { ...p, totalCash: remaining, cash: remaining };
      })
    );
    return {
      success: true,
      message: `Successfully landed on ${placeName} and paid $${placePrice.toLocaleString()}!`,
    };
  }

  // 2. Insufficient funds: Calculate deficit and attempt liquidation options
  let deficit = placePrice - currentCash;

  // Option A: Sell stocks if available in holdings
  let updatedShares = { ...(player.shares?.holdings || {}) };
  let stockPrices = player.shares?.prices || {};

  Object.keys(updatedShares).forEach((stockKey) => {
    while (deficit > 0 && updatedShares[stockKey] > 0) {
      const stockPrice = stockPrices[stockKey] || 100; // Default price fallback
      updatedShares[stockKey] -= 1;
      currentCash += stockPrice;
      deficit -= stockPrice;
    }
  });

  // Option B: Sell properties if still in deficit
  let updatedProperties = [...(player.propertiesOwned || [])];
  while (deficit > 0 && updatedProperties.length > 0) {
    updatedProperties.pop(); // Remove property asset
    const propertyLiquidationValue = 5000; // Bank mortgage/sell value per property
    currentCash += propertyLiquidationValue;
    deficit -= propertyLiquidationValue;
  }

  // Option C: Sell Visa and Passport travel documents if still in deficit
  let visaCaptured = player.documents?.visaCaptured || false;
  if (deficit > 0 && !visaCaptured) {
    const visaValue = 2500;
    currentCash += visaValue;
    deficit -= visaValue;
    visaCaptured = true; // Marked as surrendered/sold
  }

  let passportCaptured = player.documents?.passportCaptured || false;
  if (deficit > 0 && !passportCaptured) {
    const passportValue = 2500;
    currentCash += passportValue;
    deficit -= passportValue;
    passportCaptured = true; // Marked as surrendered/sold
  }

  // 3. Final Check: If player is still unable to pay after exhausting all options -> Bankrupt & Kicked Out
  if (deficit > 0) {
    eliminatePlayer(
      player.id,
      `Bankruptcy Alert: Player ${player.id} could not clear the $${placePrice.toLocaleString()} fee for ${placeName} even after liquidating stocks, properties, and travel documents.`
    );
    return {
      success: false,
      bankrupt: true,
      message: `🚨 Bankruptcy Alert: Player ${player.id} could not clear the $${placePrice.toLocaleString()} fee for ${placeName} even after liquidating stocks, properties, and travel documents. Player is declared BANKRUPT and has been kicked out of the game!`,
    };
  }

  // 4. Successful Recovery: Update player's remaining cash and liquidated assets
  const finalCash = currentCash - deficit;
  setPlayers((prevPlayers) =>
    prevPlayers.map((p) => {
      if (p.id !== player.id) return p;
      return {
        ...p,
        totalCash: Math.max(0, finalCash),
        cash: Math.max(0, finalCash),
        propertiesOwned: updatedProperties,
        shares: { ...p.shares, holdings: updatedShares },
        documents: {
          ...p.documents,
          visaCaptured,
          passportCaptured,
        },
      };
    })
  );

  return {
    success: true,
    message: `Assets successfully liquidated (stocks, properties, or documents) to cover the $${placePrice.toLocaleString()} fee for ${placeName}.`,
  };
};

export interface BankShopItem {
  label: string;
  type: 'visa' | 'passport' | 'currency';
  value: number;
  cost: number;
}

// Complete Bank Shop items including Visa and Passport and currency notes
export const bankShopItems: BankShopItem[] = [
  { label: 'International Visa', type: 'visa', value: 10000, cost: 10000 },
  { label: 'International Passport', type: 'passport', value: 5000, cost: 5000 },
  { label: '$10,000 USD Note', type: 'currency', value: 50000, cost: 10000 },
  { label: '$5,000 USD Note', type: 'currency', value: 10000, cost: 5000 },
  { label: '$1,000 USD Note', type: 'currency', value: 5000, cost: 1000 },
  { label: '$500 USD Note', type: 'currency', value: 1000, cost: 500 },
];

// Bank Shop items with swapped value and cost ratios
export const bankShopDenominations = [
  { label: '$10,000 USD Note', value: 50000, cost: 10000 },
  { label: '$5,000 USD Note', value: 10000, cost: 5000 },
  { label: '$1,000 USD Note', value: 5000, cost: 1000 },
  { label: '$500 USD Note', value: 1000, cost: 500 },
];

/**
 * Updated Shop Handler Function
 * Handles purchasing currency notes or renewing/buying back travel documents directly from the shop interface.
 */
export const handleShopPurchase = (
  player: any,
  item: BankShopItem | { label: string; type?: string; value: number; cost: number },
  setPlayers: React.Dispatch<React.SetStateAction<any[]>>
): { success: boolean; message: string } => {
  const currentCash = player.totalCash ?? player.cash ?? 0;

  if (currentCash < item.cost) {
    return {
      success: false,
      message: `Insufficient funds! You need $${item.cost.toLocaleString()} to purchase ${item.label}.`,
    };
  }

  setPlayers((prevPlayers) =>
    prevPlayers.map((p) => {
      if (p.id !== player.id) return p;

      const pCash = p.totalCash ?? p.cash ?? 0;

      // If purchasing a travel document (Visa or Passport)
      if (item.type === 'visa' || item.type === 'passport') {
        const isVisa = item.type === 'visa';
        const updatedCash = pCash - item.cost;
        return {
          ...p,
          cash: updatedCash,
          totalCash: updatedCash,
          documents: {
            ...p.documents,
            [isVisa ? 'visaCaptured' : 'passportCaptured']: false, // Restored/Active
            [isVisa ? 'VISA' : 'PASSPORT']: Math.max(1, (p.documents?.[isVisa ? 'VISA' : 'PASSPORT'] || 0)),
          },
        };
      }

      // If purchasing currency note denominations
      const updatedCash = pCash - item.cost + item.value; // Deducts cost and adds the note value
      const diff = item.value - item.cost;
      return {
        ...p,
        cash: updatedCash,
        totalCash: updatedCash,
        netWorth: (p.netWorth || 0) + diff,
      };
    })
  );

  return {
    success: true,
    message: `Successfully purchased ${item.label} for $${item.cost.toLocaleString()}!`,
  };
};

export {
  checkTotalInsolvency,
  BLACK_MONEY_CONFIG,
  calculateTotalNetWorth,
  executeDualThresholdSeizure,
  processLowIncomeStreak,
  LOW_INCOME_THRESHOLD,
  MAX_ALLOWED_LOW_INCOME_STREAKS,
  CONFIG,
  GET_LOW_INCOME_WARNING,
  executeAITurnLogic,
  evaluateEntityBankruptcy,
  AI_PERSONALITIES,
  executeHumanizedAITurn,
  executeAITurnWithDelay,
  getRandomInt,
  eliminatePlayerFromGame,
  eliminateEntityFromGame,
  BANKRUPTCY_MESSAGES,
  getRandomBankruptcyMsg,
} from './blackMoneyManager';
export type { AIPersonalityType } from './blackMoneyManager';

export {
  AUDIT_CONFIG,
  AI_MINIGAME_WIN_RATES,
  launchCorporateAudit,
  resolveAuditOutcome,
  processAIAuditDecisions,
  triggerRandomSystemAudit,
  triggerRecurringRaid,
  processAuditTimerTick,
  AUDIT_BANKRUPTCY_MESSAGES,
  getRandomAuditMsg,
} from './auditManager';
export type { AuditState } from './auditManager';

export {
  BRIBE_BAILOUT_CONFIG,
  checkPlayerBankruptcy,
  handleAcceptBribe,
  handleForfeitMatch,
} from './bribeManager';
