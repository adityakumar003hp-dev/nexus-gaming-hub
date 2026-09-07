import React from 'react';

/**
 * BRIBE & BAILOUT SYSTEM
 * When a player hits $0 (bankrupt), instead of instant elimination, a high-stakes modal appears
 * giving them one chance to bribe tax officials for $5,000 to stay in the game and keep all their assets.
 */

export const BRIBE_BAILOUT_CONFIG = {
  BRIBE_COST: 5000,
};

/**
 * 1. Check for player bankruptcy on turn/cash update
 */
export const checkPlayerBankruptcy = (
  setPlayers: React.Dispatch<React.SetStateAction<any[]>>
) => {
  if (typeof setPlayers !== 'function') return;

  setPlayers((prev) =>
    prev.map((player) => {
      const cashBalance = player.totalCash !== undefined ? player.totalCash : player.cash;
      // Flag player as bankrupt if cash falls <= 0 and hasn't paid a bribe yet
      if (cashBalance <= 0 && !player.isBankrupt && !player.hasUsedBribeBailout) {
        return {
          ...player,
          isBankrupt: true,
        };
      }
      return player;
    })
  );
};

/**
 * 2. Process the $5,000 Bribe Action
 */
export const handleAcceptBribe = (
  playerId: number | string,
  bribeCost: number = 5000,
  setPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
  addGameLog?: (msg: string) => void,
  AudioFX?: any
) => {
  if (typeof setPlayers === 'function') {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            isBankrupt: false,
            hasUsedBribeBailout: true, // One-time bribe restriction
            cash: Math.max(0, p.cash || 0), // Wipes current negative balance
            totalCash: Math.max(0, p.totalCash || 0),
            outstandingDebt: (p.outstandingDebt || 0) + bribeCost, // Adds $5,000 bribe charge to debt balance
          };
        }
        return p;
      })
    );
  }

  if (AudioFX && typeof AudioFX.playCashSound === 'function') {
    AudioFX.playCashSound();
  }

  const pName = typeof playerId === 'number' ? `Player ${playerId}` : playerId;
  if (typeof addGameLog === 'function') {
    addGameLog(
      `⚖️ UNDER-THE-TABLE BAILOUT: ${pName} paid a $${bribeCost.toLocaleString()} bribe to federal regulators! Debt added to ledger, 100% assets & properties retained.`
    );
  }
};

/**
 * 3. Process Full Bankruptcy (Forfeit / Elimination)
 */
export const handleForfeitMatch = (
  playerId: number | string,
  setPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
  setEliminatedPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
  setTurnIndex?: React.Dispatch<React.SetStateAction<number>>,
  addGameLog?: (msg: string) => void,
  eliminateEntityFromGameFn?: (
    bankruptId: number,
    customReason?: string,
    setPlayers?: any,
    setEliminatedPlayers?: any,
    setTurnIndex?: any,
    addGameLog?: any
  ) => void
) => {
  const pName = typeof playerId === 'number' ? `Player ${playerId}` : playerId;
  const forfeitReason = `💀 FORFEIT: ${pName} declined the bribe and declared official bankruptcy! Assets liquidated.`;

  if (typeof eliminateEntityFromGameFn === 'function' && typeof playerId === 'number') {
    eliminateEntityFromGameFn(
      playerId,
      forfeitReason,
      setPlayers,
      setEliminatedPlayers,
      setTurnIndex,
      addGameLog
    );
  } else if (typeof setPlayers === 'function') {
    setPlayers((prev) => {
      const target = prev.find((p) => p.id === playerId);
      if (!target) return prev;

      if (typeof setEliminatedPlayers === 'function') {
        setEliminatedPlayers((prevElim) => [
          ...prevElim.filter((p) => p.id !== playerId),
          { ...target, isBankrupt: true, isEliminated: true, propertiesOwned: [], cash: 0, totalCash: 0, reason: forfeitReason },
        ]);
      }

      const remaining = prev.filter((p) => p.id !== playerId);
      if (typeof setTurnIndex === 'function' && remaining.length > 0) {
        setTurnIndex((prevIndex) => prevIndex % remaining.length);
      }
      return remaining;
    });

    if (typeof addGameLog === 'function') {
      addGameLog(forfeitReason);
    }
  }
};
