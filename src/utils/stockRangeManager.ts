/**
 * Precise Range-Bound Stock Return Logic (src/utils/stockRangeManager.ts)
 * 
 * Rules:
 * - Profit Range: When a player wins on a stock trade/investment, profit is bounded between $1,000 and $10,000 USD.
 * - Loss Range: When the market goes down, loss is bounded between $1,000 and $5,000 USD.
 */

export interface StockInvestmentReturnResult {
  isProfit: boolean;
  amountChanged: number;
  message: string;
}

// Function to generate random profit or loss within specified ranges
export const getRandomFinancialOutcome = (isProfit: boolean): number => {
  if (isProfit) {
    // Profit range: 1,000 USD to 10,000 USD
    return Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
  } else {
    // Loss range: 5,000 USD to 50,000 USD
    return Math.floor(Math.random() * (50000 - 5000 + 1)) + 5000;
  }
};

export function calculateStockInvestmentReturn(
  investmentAmount?: number,
  volatility?: number
): StockInvestmentReturnResult {
  // Determine market trend direction (55% positive market odds)
  const isPositiveMarket = Math.random() >= 0.45;
  const outcomeAmount = getRandomFinancialOutcome(isPositiveMarket);

  if (isPositiveMarket) {
    return {
      isProfit: true,
      amountChanged: outcomeAmount,
      message: `Successful trade! Profit secured: +$${outcomeAmount.toLocaleString()} USD`,
    };
  } else {
    return {
      isProfit: false,
      amountChanged: outcomeAmount,
      message: `Market downturn. Loss incurred: -$${outcomeAmount.toLocaleString()} USD`,
    };
  }
}
