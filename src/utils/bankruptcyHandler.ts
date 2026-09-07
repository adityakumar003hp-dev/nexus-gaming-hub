// src/utils/bankruptcyHandler.ts
import { StockHolding, StockListing } from './gameEconomicsSetup';
import { CITY_PROPERTY_CARDS, TRANSIT_WAYS_CARDS } from '../components/PropertyAndWaysCards';
import { InternationalBoardSpace } from '../data/internationalBusinessData';

export const BANKRUPTCY_THRESHOLD = 2500;

export interface PlayerBankruptcyState {
  id: number;
  name: string;
  money?: number;
  cash?: number;
  netWorth?: number;
  stocks?: Record<string, StockHolding>;
  documents?: { VISA?: number; PASSPORT?: number; [key: string]: number | undefined };
  properties?: Array<{ mortgage?: number; [key: string]: any }>;
  propertiesOwned?: number[];
}

export interface BankruptcyCheckOutcome {
  isBankrupt: boolean;
  isEliminated?: boolean; // backwards compatibility
  requiresLiquidation?: boolean;
  status?: 'ELIMINATED' | 'WARNING' | 'HEALTHY';
  message?: string;
  totalNetWorth?: number;
  portfolioValue?: number;
  visaValue?: number;
  passportValue?: number;
  propertyMortgageTotal?: number;
  liquidatableAssets?: number;
  shortfall?: number;
}

/**
 * 1. Bankruptcy Check & Elimination Utility
 * Checks whether a player is bankrupt or needs liquidation:
 * If cash < $2,500 AND total net liquidity (cash + stocks + visas + passports + property mortgages) < $2,500, they are eliminated.
 * If cash < $2,500 but total assets >= $2,500, they are in a warning state requiring asset liquidation.
 */
export function checkPlayerBankruptcy(
  player: PlayerBankruptcyState,
  currentMarketStocks?: StockListing[],
  spaces?: InternationalBoardSpace[]
): BankruptcyCheckOutcome {
  const currentMoney = player.cash ?? player.money ?? 0;

  // 1. Calculate total liquid cash + stock portfolio value
  let portfolioValue = 0;
  if (player.stocks) {
    for (const [stockId, holding] of Object.entries(player.stocks)) {
      const liveStock = currentMarketStocks?.find((s) => s.id === stockId);
      const stockPrice = liveStock?.price ?? holding.avgBuyPrice ?? 0;
      portfolioValue += (holding.shares || 0) * stockPrice;
    }
  }

  // Value of travel documents (Visa: $10,000, Passport: $5,000)
  const visaCount = player.documents?.VISA || 0;
  const passportCount = player.documents?.PASSPORT || 0;
  const visaValue = visaCount * 10000;
  const passportValue = passportCount * 5000;

  // Total Property Mortgage values
  let propertyMortgageTotal = 0;
  if (player.properties && player.properties.length > 0) {
    propertyMortgageTotal = player.properties.reduce((sum, prop) => sum + (prop.mortgage || 0), 0);
  } else if (player.propertiesOwned && player.propertiesOwned.length > 0 && spaces) {
    player.propertiesOwned.forEach((spaceId) => {
      const space = spaces.find((s) => s.id === spaceId);
      if (space) {
        if (CITY_PROPERTY_CARDS[space.name]) {
          propertyMortgageTotal += CITY_PROPERTY_CARDS[space.name].mortgage;
        } else if (TRANSIT_WAYS_CARDS[space.name]) {
          propertyMortgageTotal += TRANSIT_WAYS_CARDS[space.name].mortgage;
        } else {
          propertyMortgageTotal += Math.round((space.price || 2000) * 0.5);
        }
      }
    });
  }

  // Total Net Liquidity = Cash + Stocks + Documents + Properties (Mortgage values)
  const liquidatableAssets = portfolioValue + visaValue + passportValue + propertyMortgageTotal;
  const totalNetWorth = currentMoney + liquidatableAssets;

  // 2. Check if player falls below the elimination threshold ($2,500)
  if (currentMoney < BANKRUPTCY_THRESHOLD && totalNetWorth < BANKRUPTCY_THRESHOLD) {
    const shortfall = Math.max(0, BANKRUPTCY_THRESHOLD - totalNetWorth);
    return {
      isBankrupt: true,
      isEliminated: true,
      requiresLiquidation: false,
      status: 'ELIMINATED',
      totalNetWorth,
      portfolioValue,
      visaValue,
      passportValue,
      propertyMortgageTotal,
      liquidatableAssets,
      shortfall,
      message: `${player.name} has fallen below $2,500 and total assets cannot cover liabilities. Player is eliminated!`
    };
  }

  // 3. Warning state if liquid cash is low, but they have assets to liquidate
  if (currentMoney < BANKRUPTCY_THRESHOLD) {
    return {
      isBankrupt: false,
      isEliminated: false,
      requiresLiquidation: true,
      status: 'WARNING',
      totalNetWorth,
      portfolioValue,
      visaValue,
      passportValue,
      propertyMortgageTotal,
      liquidatableAssets,
      message: `Warning: Low cash balance! Liquidate properties, stocks, or travel documents to stay above $2,500.`
    };
  }

  return {
    isBankrupt: false,
    isEliminated: false,
    requiresLiquidation: false,
    status: 'HEALTHY',
    totalNetWorth,
    portfolioValue,
    visaValue,
    passportValue,
    propertyMortgageTotal,
    liquidatableAssets
  };
}

/**
 * 2. Process Player Payment & Bankruptcy Transition Flow
 */
export function processPlayerPayment(
  player: PlayerBankruptcyState,
  amountDue: number,
  marketStocks?: StockListing[],
  spaces?: InternationalBoardSpace[],
  setPlayerState?: (updated: any) => void,
  eliminatePlayerCallback?: (id: number) => void
) {
  const currentMoney = player.cash ?? player.money ?? 0;
  const updatedMoney = currentMoney - amountDue;
  const updatedPlayer = { ...player, cash: updatedMoney, money: updatedMoney };

  const bankruptcyCheck = checkPlayerBankruptcy(updatedPlayer, marketStocks, spaces);

  if (bankruptcyCheck.isBankrupt) {
    if (eliminatePlayerCallback) {
      eliminatePlayerCallback(player.id);
    }
    return {
      success: false,
      eliminated: true,
      warning: false,
      message: bankruptcyCheck.message,
      check: bankruptcyCheck
    };
  }

  if (bankruptcyCheck.requiresLiquidation) {
    if (setPlayerState) {
      setPlayerState(updatedPlayer);
    }
    return {
      success: true,
      eliminated: false,
      warning: true,
      message: bankruptcyCheck.message,
      check: bankruptcyCheck
    };
  }

  if (setPlayerState) {
    setPlayerState(updatedPlayer);
  }

  return {
    success: true,
    eliminated: false,
    warning: false,
    check: bankruptcyCheck
  };
}
