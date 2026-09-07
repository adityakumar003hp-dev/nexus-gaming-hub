// src/utils/stockPurchaseManager.ts

export interface StockHoldingState {
  stockId: string;
  sharesPurchased: number;
  totalInvested: number;
  avgBuyPrice: number;
  purchaseTimestamp: number;
  isHoldingActive: boolean;
}

export interface StockReturnOutcomeResult {
  isSuccess: boolean;
  amountChanged: number;
  message: string;
}

// 1. Called the exact moment a user buys a stock to initialize their holding state
export function initializeStockPurchase(
  stockId: string,
  purchaseAmount: number,
  currentStockPrice: number
): StockHoldingState {
  const shares = currentStockPrice > 0 ? Math.floor(purchaseAmount / currentStockPrice) : 1;

  return {
    stockId,
    sharesPurchased: shares,
    totalInvested: purchaseAmount,
    avgBuyPrice: currentStockPrice,
    purchaseTimestamp: Date.now(),
    isHoldingActive: true,
  };
}

// Function to generate random profit or loss within your specified ranges
export const getRandomFinancialOutcome = (isProfit: boolean): number => {
  if (isProfit) {
    // Profit range: 1,000 USD to 10,000 USD
    return Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
  } else {
    // Loss range: 5,000 USD to 50,000 USD
    return Math.floor(Math.random() * (50000 - 5000 + 1)) + 5000;
  }
};

// 2. Called when the user cashes out or closes the stock position
export function calculateStockReturnOutcome(forceProfit?: boolean): StockReturnOutcomeResult {
  // Randomly determine if the outcome is a profit or a loss (55% win rate if not forced)
  const isProfit = typeof forceProfit === 'boolean' ? forceProfit : Math.random() >= 0.45;
  const outcomeAmount = getRandomFinancialOutcome(isProfit);

  if (isProfit) {
    return {
      isSuccess: true,
      amountChanged: outcomeAmount,
      message: `Stock sold successfully! You secured a profit of +$${outcomeAmount.toLocaleString()} USD`,
    };
  } else {
    return {
      isSuccess: false,
      amountChanged: outcomeAmount,
      message: `Market downturn! You incurred a loss of -$${outcomeAmount.toLocaleString()} USD`,
    };
  }
}
