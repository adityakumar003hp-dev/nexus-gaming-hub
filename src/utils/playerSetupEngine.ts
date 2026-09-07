import React from 'react';
import { BUSINESS_COLORS, BusinessColorConfig, BusinessColorKey } from '../data/businessConfig';

// Master configuration pool for up to 6 players
export const COLOR_POOL = [
  { id: 'Red', defaultName: 'Red (You)', colorHex: '#ef4444', defaultAI: false, colorKey: 'red' as BusinessColorKey },
  { id: 'Green', defaultName: 'Green Tycoon', colorHex: '#22c55e', defaultAI: true, colorKey: 'green' as BusinessColorKey },
  { id: 'Yellow', defaultName: 'Yellow Tycoon', colorHex: '#eab308', defaultAI: true, colorKey: 'yellow' as BusinessColorKey },
  { id: 'Blue', defaultName: 'Blue Tycoon', colorHex: '#3b82f6', defaultAI: true, colorKey: 'blue' as BusinessColorKey },
  { id: 'Orange', defaultName: 'Orange Tycoon', colorHex: '#f97316', defaultAI: true, colorKey: 'orange' as BusinessColorKey },
  { id: 'Purple', defaultName: 'Purple Tycoon', colorHex: '#a855f7', defaultAI: true, colorKey: 'purple' as BusinessColorKey },
];

/**
 * Universal Player Count Switcher (Supports 2 to 6 Players)
 */
export const updateGamePlayerCount = (
  selectedCount: number,
  setPlayerCount: (count: number) => void,
  setPlayers: React.Dispatch<React.SetStateAction<any[]>>,
  setTurnIndex?: (idx: number) => void,
  onResetGameCallback?: () => void
) => {
  // 1. Update lobby button state
  if (typeof setPlayerCount === 'function') {
    setPlayerCount(selectedCount);
  }

  // 2. Slice pool to exact count & construct fresh player state
  const activePlayers = COLOR_POOL.slice(0, selectedCount).map((slot, index) => {
    const businessColor = BUSINESS_COLORS.find((c) => c.key === slot.colorKey) || BUSINESS_COLORS[index] || BUSINESS_COLORS[0];
    const isAi = index === 0 ? false : slot.defaultAI;

    return {
      id: index,
      colorKey: slot.colorKey,
      name: index === 0 ? 'Red (You)' : slot.defaultName,
      avatar: businessColor.avatar,
      color: slot.colorHex,
      borderClass: businessColor.borderClass,
      badgeBg: businessColor.badgeBg,
      token: businessColor.token,
      isAI: isAi,
      isAi: isAi, // Slot 0 is Human, all others start as AI
      isOwner: index === 0,
      cash: 16650,
      totalCash: 16650,
      netWorth: 16650,
      position: 0,
      boardPosition: 0,
      inJail: false,
      jailTurns: 0,
      propertiesOwned: [],
      investments: { tech: 2000, realEstate: 2000 },
      cashDenominations: {
        "10000": 1,
        "5000": 1,
        "1000": 1,
        "500": 1,
        "100": 1,
        "50": 1,
      },
      documents: {
        VISA: 1,
        PASSPORT: 1,
      },
      stocks: {},
      isBankrupt: false,
      riskIndex: 0,
      auditState: { underInvestigation: false, timer: 0 },
    };
  });

  // 3. Set active players state driving the board & turn loops
  if (typeof setPlayers === 'function') {
    setPlayers(activePlayers);
  }

  // 4. Safely reset turn order back to player 1
  if (typeof setTurnIndex === 'function') {
    setTurnIndex(0);
  }

  if (typeof onResetGameCallback === 'function') {
    onResetGameCallback();
  }
};
