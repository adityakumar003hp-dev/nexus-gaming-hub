// src/utils/gameLogicController.ts
import { BusinessPlayer } from '../components/BusinessBoard';
import { InternationalBoardSpace } from '../data/internationalBusinessData';
import { CITY_PROPERTY_CARDS, TRANSIT_WAYS_CARDS } from '../components/PropertyAndWaysCards';
import {
  checkPlayerBankruptcy as checkPlayerBankruptcyHandler,
  BankruptcyCheckOutcome,
  BANKRUPTCY_THRESHOLD,
  processPlayerPayment,
} from './bankruptcyHandler';

export type BankruptcyCheckResult = BankruptcyCheckOutcome;
export { BANKRUPTCY_THRESHOLD, processPlayerPayment };

/**
 * Checks whether a player is in bankruptcy/elimination territory:
 * When a player's cash drops below $2,500 and/or they cannot cover totalDebtOwed,
 * we calculate their liquidatable assets (mortgage values of owned properties/transit + stocks + documents).
 * If cash + liquidatableAssets < debt or < 2500, they are eliminated.
 */
export function checkPlayerBankruptcy(
  player: {
    id: number;
    name: string;
    cash?: number;
    money?: number;
    propertiesOwned?: number[];
    stocks?: any;
    documents?: any;
    properties?: any[];
  },
  totalDebtOwed: number = 0,
  spaces: InternationalBoardSpace[] = []
): BankruptcyCheckResult {
  const currentMoney = player.cash ?? player.money ?? 0;
  const outcome = checkPlayerBankruptcyHandler(player, undefined, spaces);

  // If there's an explicit debt owed, check if liquidatable total can cover debt
  if (totalDebtOwed > 0) {
    const totalPotentialCapital = currentMoney + (outcome.liquidatableAssets || 0);
    if (totalPotentialCapital < totalDebtOwed || totalPotentialCapital < BANKRUPTCY_THRESHOLD) {
      const shortfall = Math.max(
        BANKRUPTCY_THRESHOLD - totalPotentialCapital,
        totalDebtOwed - totalPotentialCapital
      );
      return {
        ...outcome,
        isBankrupt: true,
        isEliminated: true,
        requiresLiquidation: false,
        status: 'ELIMINATED',
        shortfall,
        message: `${player.name} is unable to cover debts/liabilities (Assets: $${totalPotentialCapital.toLocaleString()}, Debt: $${totalDebtOwed.toLocaleString()}) and has been eliminated!`,
      };
    }
  }

  return outcome;
}


/**
 * Process economic operations:
 * - EARN_INVESTING_DIVIDEND: Earn money based on active investing rate percentage (market multiplier)
 * - EXECUTE_TRADE: Earn money by selling property at Trade Value (125% * marketRateMultiplier)
 * - WIN_AUCTION_PAYOUT: Bank payout from an auctioned property sale (50% * marketRateMultiplier)
 * - BUILD_UPGRADE: Calculate cost of building house/hotel or network upgrade
 */
export function processEconomicAction(
  player: { cash?: number; money?: number; [key: string]: any },
  actionType: 'EARN_INVESTING_DIVIDEND' | 'EXECUTE_TRADE' | 'WIN_AUCTION_PAYOUT' | 'BUILD_UPGRADE',
  assetValue: number,
  marketRateMultiplier: number = 1.0
): number {
  let currentCash = player.cash ?? player.money ?? 0;

  switch (actionType) {
    case 'EARN_INVESTING_DIVIDEND': {
      // Earn money based on active investing rate percentage
      const dividend = Math.round(assetValue * (marketRateMultiplier - 1));
      currentCash += dividend > 0 ? dividend : 0;
      break;
    }

    case 'EXECUTE_TRADE': {
      // Earn money by selling at Trade Value
      const tradeVal = Math.round(assetValue * 1.25 * marketRateMultiplier);
      currentCash += tradeVal;
      break;
    }

    case 'WIN_AUCTION_PAYOUT': {
      // Bank payout from an auctioned property sale
      const auctionPrice = Math.round(assetValue * 0.5 * (marketRateMultiplier || 1.0));
      currentCash += auctionPrice;
      break;
    }

    case 'BUILD_UPGRADE': {
      const buildPrice = Math.round(assetValue);
      currentCash -= buildPrice;
      break;
    }

    default:
      break;
  }

  return currentCash;
}
