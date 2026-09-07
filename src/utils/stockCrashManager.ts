// src/utils/stockCrashManager.ts
import { StockListing } from './gameEconomicsSetup';

export interface MarketCrashResult {
  hasCrashed: boolean;
  updatedStocks: StockListing[];
  message: string;
  crashSeverityMultiplier?: number;
  dropPercentage?: number;
}

/**
 * Checks for and executes a market crash based on probability (default 10%-12%).
 * When triggered, stock prices drop drastically by 30% to 60%.
 */
export function checkAndTriggerMarketCrash(
  currentStocks: StockListing[],
  crashProbability: number = 0.12
): MarketCrashResult {
  // Generate a random number between 0 and 1
  const roll = Math.random();

  // If the roll is less than or equal to the probability, a crash happens!
  if (roll <= crashProbability) {
    // Retains 40% to 70% of value (30-60% drop)
    const crashSeverityMultiplier = 0.4 + Math.random() * 0.3;
    const dropPercentage = Math.round((1 - crashSeverityMultiplier) * 100);

    const crashedStocks: StockListing[] = currentStocks.map((stock) => {
      const newPrice = Math.max(50, Math.round(stock.price * crashSeverityMultiplier));
      const priceDrop = stock.price - newPrice;
      const pctDrop = stock.price > 0 ? Math.round((priceDrop / stock.price) * 100) : dropPercentage;

      return {
        ...stock,
        price: newPrice,
        isPositive: false,
        changeIndicator: `-${pctDrop}% 🚨`,
      };
    });

    return {
      hasCrashed: true,
      updatedStocks: crashedStocks,
      crashSeverityMultiplier,
      dropPercentage,
      message: '🚨 MARKET CRASH! Economic downturn has hit all global indices hard! Stock prices plummeted drastically (-30% to -60%)!',
    };
  }

  return {
    hasCrashed: false,
    updatedStocks: currentStocks,
    message: 'Market stable.',
  };
}
