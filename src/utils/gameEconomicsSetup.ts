// src/utils/gameEconomicsSetup.ts

export interface PlayerCashDenominations {
  "10000": number;
  "5000": number;
  "1000": number;
  "500": number;
  "100": number;
  "50": number;
  [key: string]: number;
}

export interface PlayerDocuments {
  VISA: number;
  PASSPORT: number;
  visaCaptured?: boolean;
  passportCaptured?: boolean;
  blackMoneyFlagged?: boolean;
  [key: string]: any;
}

export interface StockHolding {
  shares: number;
  avgBuyPrice: number;
}

export interface StockListing {
  id: string;
  name: string;
  price: number;
  volatility: number;
  changeIndicator?: string;
  isPositive?: boolean;
}

// 1. Default Player Starting Portfolio
export function createNewPlayer(id: number, name: string) {
  return {
    id: id,
    name: name,
    money: 16650, // Sum of denominations: 10000 + 5000 + 1000 + 500 + 100 + 50
    cashDenominations: {
      "10000": 1,
      "5000": 1,
      "1000": 1,
      "500": 1,
      "100": 1,
      "50": 1
    } as PlayerCashDenominations,
    documents: {
      VISA: 1,     // Given by default (worth $10,000)
      PASSPORT: 1  // Given by default (worth $5,000)
    } as PlayerDocuments,
    stocks: {} as Record<string, StockHolding>,    // Player stock portfolio tracker { stockId: { shares, avgBuyPrice } }
    properties: [] as number[]
  };
}

// 2. Initial Stock Market Listings
export const INITIAL_STOCKS: StockListing[] = [
  { id: "TECH", name: "Global Tech Index", price: 1200, volatility: 0.08, changeIndicator: "+0.0%", isPositive: true },
  { id: "AIR", name: "SkyHigh Airways", price: 850, volatility: 0.12, changeIndicator: "+0.0%", isPositive: true },
  { id: "GOLD", name: "Apex Commodities", price: 2500, volatility: 0.04, changeIndicator: "+0.0%", isPositive: true },
  { id: "ECO", name: "GreenEnergy Corp", price: 600, volatility: 0.15, changeIndicator: "+0.0%", isPositive: true }
];

// 3. Stock Market Tick Function (Shifts prices up and down)
export function updateMarketPrices(currentStocks: StockListing[]): StockListing[] {
  return currentStocks.map(stock => {
    const percentChange = Math.random() * (stock.volatility * 2) - stock.volatility;
    const newPrice = Math.max(50, Math.round(stock.price * (1 + percentChange)));
    
    return {
      ...stock,
      price: newPrice,
      changeIndicator: `${percentChange >= 0 ? '+' : ''}${(percentChange * 100).toFixed(1)}%`,
      isPositive: percentChange >= 0
    };
  });
}

// 4. Stock Transaction Handlers
export function buyStock(
  player: { money: number; stocks?: Record<string, StockHolding> },
  stockId: string,
  stockPrice: number,
  quantity: number
) {
  const totalCost = stockPrice * quantity;
  if (player.money < totalCost) {
    return { success: false, message: "Insufficient funds to buy shares!" };
  }

  const current = player.stocks?.[stockId] || { shares: 0, avgBuyPrice: 0 };
  const newShares = current.shares + quantity;
  const totalSpent = (current.shares * current.avgBuyPrice) + totalCost;

  return {
    success: true,
    newMoney: player.money - totalCost,
    updatedStocks: {
      ...player.stocks,
      [stockId]: { shares: newShares, avgBuyPrice: totalSpent / newShares }
    },
    message: `Bought ${quantity} shares of ${stockId} for $${totalCost.toLocaleString()}.`
  };
}

export function sellStock(
  player: { money: number; stocks?: Record<string, StockHolding> },
  stockId: string,
  stockPrice: number,
  quantity: number
) {
  const current = player.stocks?.[stockId];
  if (!current || current.shares < quantity) {
    return { success: false, message: "You don't own enough shares to sell!" };
  }

  const totalReturn = stockPrice * quantity;
  const remainingShares = current.shares - quantity;
  const updatedStocks = { ...player.stocks };

  if (remainingShares === 0) {
    delete updatedStocks[stockId];
  } else {
    updatedStocks[stockId] = { ...current, shares: remainingShares };
  }

  return {
    success: true,
    newMoney: player.money + totalReturn,
    updatedStocks,
    message: `Sold ${quantity} shares of ${stockId} for $${totalReturn.toLocaleString()}.`
  };
}

// 5. Cash Out Profit Handler (Locks in gains and keeps initial shares intact)
import { calculateStockInvestmentReturn } from './stockRangeManager';
export { calculateStockInvestmentReturn };
export function cashOutStockProfit(
  player: { money: number; stocks?: Record<string, StockHolding> },
  stockId: string,
  currentStockPrice: number
) {
  const holding = player.stocks?.[stockId];
  if (!holding || holding.shares <= 0) {
    return { success: false, message: "You don't own any shares of this stock to cash out!" };
  }

  // Calculate total current value of shares
  const currentValue = holding.shares * currentStockPrice;

  // Calculate total money originally invested (Cost Basis)
  const totalCostBasis = holding.shares * holding.avgBuyPrice;

  // Profit is what's left above the original investment
  const profit = currentValue - totalCostBasis;

  if (profit <= 0) {
    return { success: false, message: "No profit to cash out right now (stock is even or down)." };
  }

  // Adjust avgBuyPrice up to current price to bank the realized profit
  const updatedStocks = {
    ...player.stocks,
    [stockId]: {
      ...holding,
      avgBuyPrice: currentStockPrice,
    },
  };

  return {
    success: true,
    cashEarned: profit,
    newMoney: player.money + profit,
    updatedStocks,
    message: `Successfully cashed out $${profit.toLocaleString()} in profit directly to your cash balance!`,
  };
}
