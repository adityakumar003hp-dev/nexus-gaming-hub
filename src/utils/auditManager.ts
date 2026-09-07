import { eliminatePlayerFromGame } from './blackMoneyManager';

/**
 * CORPORATE AUDIT SUBSYSTEM (FIXED & COMPLETE)
 */

export const AUDIT_CONFIG = {
  AUDIT_COST: 15000,
  INVESTIGATION_TIME_SEC: 30,
  BRIBE_PENALTY_MULTIPLIER: 1.5,
};

// AI Mini-Game Win Rates by Personality
export const AI_MINIGAME_WIN_RATES: Record<string, number> = {
  RISK_TAKER: 0.40,
  BALANCED: 0.65,
  CONSERVATIVE: 0.85,
};

export type MiniGameType = 'SHREDDER' | 'WIRE_DEFENSE' | 'NEGOTIATION' | 'CODEBREAKER';

export const MINI_GAMES_LIST: MiniGameType[] = ['SHREDDER', 'WIRE_DEFENSE', 'NEGOTIATION', 'CODEBREAKER'];

export const TAX_RATES_POOL = [10, 15, 20, 25, 30, 35]; // percentage tax brackets

export interface AuditState {
  underInvestigation: boolean;
  initiatorId?: number | string;
  timer?: number;
  riskAtRaid?: number;
  assignedMiniGame?: MiniGameType;
  activeTaxRate?: number;
  reason?: string;
}

/**
 * Trigger a Random Tax Rate Wave / Corporate Audit Surge
 * Randomly sets a new global tax rate and subjects a random or exposed tycoon to an audit with a random defense mini-game.
 */
export const triggerRandomTaxRateEvent = (
  players: any[],
  setPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
  addGameLog?: (msg: string) => void,
  currentTaxRate?: number
): {
  newTaxRate: number;
  targetPlayer: any | null;
  assignedGame: MiniGameType;
  message: string;
} => {
  const newTaxRate = TAX_RATES_POOL[Math.floor(Math.random() * TAX_RATES_POOL.length)];
  const assignedGame = MINI_GAMES_LIST[Math.floor(Math.random() * MINI_GAMES_LIST.length)];

  const eligiblePlayers = players.filter((p) => !p.auditState?.underInvestigation && !p.isBankrupt);
  if (eligiblePlayers.length === 0) {
    return {
      newTaxRate,
      targetPlayer: null,
      assignedGame,
      message: `🏛️ Global Corporate Tax Rate shifted to ${newTaxRate}%. All accounts currently clean.`,
    };
  }

  // Prioritize players with high risk (>40%) or choose randomly among all active tycoons
  const highRiskPlayers = eligiblePlayers.filter((p) => (p.riskIndex || 0) >= 40);
  const target = highRiskPlayers.length > 0
    ? highRiskPlayers[Math.floor(Math.random() * highRiskPlayers.length)]
    : eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];

  if (typeof setPlayers === 'function' && target) {
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) => {
        if (p.id === target.id) {
          return {
            ...p,
            auditState: {
              underInvestigation: true,
              initiatorId: 'IRS Global Authorities',
              timer: AUDIT_CONFIG.INVESTIGATION_TIME_SEC,
              riskAtRaid: p.riskIndex || Math.floor(Math.random() * 30) + 40,
              assignedMiniGame: assignedGame,
              activeTaxRate: newTaxRate,
              reason: `Tax Rate Surge (${newTaxRate}%)`,
            },
          };
        }
        return p;
      })
    );
  }

  const gameNames: Record<MiniGameType, string> = {
    SHREDDER: 'Document Shredder (Arcade Match)',
    WIRE_DEFENSE: 'Off-Shore Wire Defense (Pattern Memory)',
    NEGOTIATION: 'Regulatory Negotiation (Tug-of-War Slider)',
    CODEBREAKER: 'Codebreaker Encryption (3-Digit Lock)',
  };

  const alertMsg = `🏛️ IRS TAX RATE SURGE (${newTaxRate}%): Federal agents initiated a surprise Audit against ${target.name}! Defense Trial: ${gameNames[assignedGame]}`;

  if (typeof addGameLog === 'function') {
    addGameLog(alertMsg);
  }

  return {
    newTaxRate,
    targetPlayer: target,
    assignedGame,
    message: alertMsg,
  };
};

/**
 * RANDOM SYSTEM-INITIATED TAX RAID EVENT
 * Spontaneously triggers an unannounced federal audit against a random eligible player or AI bot.
 */
export const triggerRandomSystemAudit = (
  playersList: any[],
  setPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
  addGameLog?: (msg: string) => void
) => {
  if (!Array.isArray(playersList) || playersList.length === 0) return;

  // Filter out players already under investigation or bankrupt
  const eligibleTargets = playersList.filter(p => !p.auditState?.underInvestigation && !p.isBankrupt);
  if (eligibleTargets.length === 0) return;

  // Pick a random target from the active player pool
  const randomTarget = eligibleTargets[Math.floor(Math.random() * eligibleTargets.length)];

  if (typeof setPlayers === 'function') {
    setPlayers(prevPlayers => {
      return prevPlayers.map(p => {
        if (p.id === randomTarget.id) {
          return {
            ...p,
            auditState: {
              underInvestigation: true,
              initiatorId: "IRS_FEDERAL_BUREAU",
              timer: 30,
              riskAtRaid: p.riskIndex || 50 // Default baseline risk if none exists
            }
          };
        }
        return p;
      });
    });
  }

  const targetName = randomTarget.name || `Player ${randomTarget.id}`;

  const randomAlerts = [
    `🚨 FEDERAL CRACKDOWN: Unannounced IRS agents raided ${targetName}'s headquarters without warning!`,
    `⚡ RANDOM AUDIT SWEEP: Federal investigators burst through the doors of ${targetName}!`,
    `🔍 SURPRISE INSPECTION: Tax authorities flagged ${targetName} for an immediate spontaneous audit!`,
    `🏛️ BLACK OPS TAX RAID: Government regulators have randomly targeted ${targetName} for tax fraud!`
  ];

  const selectedAlert = randomAlerts[Math.floor(Math.random() * randomAlerts.length)];

  if (typeof addGameLog === 'function') {
    addGameLog(selectedAlert);
  }

  console.warn(`[RANDOM AUDIT] Triggered against: ${targetName} (${randomTarget.id})`);
};

export const launchCorporateAudit = (
  initiatorId: number | string,
  targetId: number | string,
  setPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
  addGameLog?: (msg: string) => void
) => {
  if (typeof setPlayers === 'function') {
    setPlayers(prevPlayers => {
      const initiator = prevPlayers.find(p => p.id === initiatorId);
      const target = prevPlayers.find(p => p.id === targetId);

      if (!initiator || !target) return prevPlayers;
      const initCash = initiator.totalCash ?? initiator.cash ?? 0;
      if (initCash < AUDIT_CONFIG.AUDIT_COST) {
        console.warn(`[AUDIT] ${initiatorId} has insufficient cash to raid ${targetId}`);
        return prevPlayers;
      }

      return prevPlayers.map(p => {
        if (p.id === initiatorId) {
          const newCash = (p.totalCash ?? p.cash ?? 0) - AUDIT_CONFIG.AUDIT_COST;
          return { ...p, totalCash: newCash, cash: newCash };
        }
        if (p.id === targetId) {
          return {
            ...p,
            auditState: {
              underInvestigation: true,
              initiatorId: initiatorId,
              timer: AUDIT_CONFIG.INVESTIGATION_TIME_SEC,
              riskAtRaid: p.riskIndex || 0,
            },
          };
        }
        return p;
      });
    });
  }

  if (typeof addGameLog === 'function') {
    addGameLog(`🚨 BREAKING NEWS: ${initiatorId} launched an official Tax Audit Raid against ${targetId}!`);
  }
};

/**
 * 2. RESOLVE AUDIT OUTCOME (Bribe, Probability, or Mini-Game Result)
 */
export const resolveAuditOutcome = (
  targetId: number | string,
  didBribe: boolean,
  miniGameWon: boolean | undefined,
  setPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
  setBankProperties?: React.Dispatch<React.SetStateAction<any[]>>,
  eliminatePlayerFn?: (
    bankruptPlayerId: number,
    bankruptcyReason?: string,
    setPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
    setEliminatedPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
    setTurnIndex?: React.Dispatch<React.SetStateAction<number>>,
    currentTurnIndex?: number
  ) => void,
  addGameLog?: (msg: string) => void,
  setEliminatedPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
  setTurnIndex?: React.Dispatch<React.SetStateAction<number>>
) => {
  if (typeof setPlayers !== 'function') return;

  setPlayers(prevPlayers => {
    const target = prevPlayers.find(p => p.id === targetId);
    if (!target || !target.auditState?.underInvestigation) return prevPlayers;

    let updatedTarget = { ...target };
    const currentRisk = updatedTarget.riskIndex || 0;
    const currentCash = updatedTarget.totalCash ?? updatedTarget.cash ?? 0;

    // SCENARIO A: Target paid Bribe
    if (didBribe) {
      const bribeCost = Math.round(AUDIT_CONFIG.AUDIT_COST * AUDIT_CONFIG.BRIBE_PENALTY_MULTIPLIER);
      if (currentCash >= bribeCost) {
        const newCash = currentCash - bribeCost;
        updatedTarget.totalCash = newCash;
        updatedTarget.cash = newCash;
        updatedTarget.riskIndex = Math.max(0, currentRisk - 25);
        updatedTarget.auditState = { underInvestigation: false };

        if (typeof addGameLog === 'function') {
          addGameLog(`💼 CORRUPTION: ${target.name || targetId} paid $${bribeCost.toLocaleString()} USD in hush money to settle the audit.`);
        }
        return prevPlayers.map(p => p.id === targetId ? updatedTarget : p);
      }
    }

    // SCENARIO B: Audit Resolution (Mini-Game Result or Risk-Based Fallback)
    const isCleared = miniGameWon !== undefined 
      ? miniGameWon 
      : (Math.random() * 100) > currentRisk;

    if (!isCleared) {
      const fineAmount = Math.round(currentCash * (currentRisk / 100)) + 20000;
      const seizedProperties = updatedTarget.propertiesOwned || [];
      const newCash = currentCash - fineAmount;

      updatedTarget.totalCash = newCash;
      updatedTarget.cash = newCash;
      updatedTarget.propertiesOwned = [];
      updatedTarget.riskIndex = 0;
      updatedTarget.auditState = { underInvestigation: false };

      if (typeof setBankProperties === 'function' && seizedProperties.length > 0) {
        setBankProperties(prevPool => [...prevPool, ...seizedProperties]);
      }

      if (typeof addGameLog === 'function') {
        addGameLog(`🏛️ FRAUD CONFIRMED: ${target.name || targetId} guilty! -$${fineAmount.toLocaleString()} USD fined & ${seizedProperties.length} properties seized.`);
      }

      // Insolvency Check - Synchronous elimination execution to prevent stale closures
      if (newCash <= 0) {
        const elimFn = eliminatePlayerFn || eliminatePlayerFromGame;
        const elimReason = `🚨 FORCED BANKRUPTCY: ${target.name || targetId} collapsed under IRS fines!`;
        
        // Add to eliminated list and filter directly
        if (typeof setEliminatedPlayers === 'function') {
          setEliminatedPlayers(prev => [
            ...prev.filter(p => p.id !== targetId),
            { ...updatedTarget, isBankrupt: true, reason: elimReason }
          ]);
        }

        const remaining = prevPlayers.filter(p => p.id !== targetId);
        if (typeof setTurnIndex === 'function' && remaining.length > 0) {
          setTurnIndex(prevIndex => prevIndex % remaining.length);
        }

        return remaining;
      }

      return prevPlayers.map(p => p.id === targetId ? updatedTarget : p);
    }

    // SCENARIO C: Audit Cleared
    updatedTarget.riskIndex = 0;
    updatedTarget.auditState = { underInvestigation: false };
    if (typeof addGameLog === 'function') {
      addGameLog(`🛡️ AUDIT CLEARED: ${target.name || targetId} successfully defended against all audit charges.`);
    }
    return prevPlayers.map(p => p.id === targetId ? updatedTarget : p);
  });
};

/**
 * 3. AI BOT WHISTLEBLOWER & DEFENSE ENGINE
 */
export const processAIAuditDecisions = (
  aiBot: any,
  playersList: any[],
  setPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
  setBankProperties?: React.Dispatch<React.SetStateAction<any[]>>,
  eliminatePlayerFn?: any,
  addGameLog?: (msg: string) => void,
  setEliminatedPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
  setTurnIndex?: React.Dispatch<React.SetStateAction<number>>
) => {
  if (!aiBot.isAI && !aiBot.isAi) return;

  const botCash = aiBot.totalCash ?? aiBot.cash ?? 0;

  // A. Whistleblower Action: Target rivals with high risk index (>= 50%)
  if (!aiBot.auditState?.underInvestigation && botCash >= AUDIT_CONFIG.AUDIT_COST) {
    const highRiskTarget = playersList.find(p => p.id !== aiBot.id && (p.riskIndex || 0) >= 50);
    
    if (highRiskTarget && Math.random() < 0.40) {
      launchCorporateAudit(aiBot.id, highRiskTarget.id, setPlayers, addGameLog);
    }
  }

  // B. AI Defense Action: Handles Bribes or Mini-Game Skill Rolls
  if (aiBot.auditState?.underInvestigation) {
    const bribeCost = Math.round(AUDIT_CONFIG.AUDIT_COST * AUDIT_CONFIG.BRIBE_PENALTY_MULTIPLIER);
    const shouldBribe = botCash >= bribeCost && (aiBot.riskIndex || 0) > 40;

    if (shouldBribe) {
      resolveAuditOutcome(
        aiBot.id,
        true,
        undefined,
        setPlayers,
        setBankProperties,
        eliminatePlayerFn,
        addGameLog,
        setEliminatedPlayers,
        setTurnIndex
      );
    } else {
      // Direct Risk Index percentage chance (e.g. 75% risk = 75% seizure success rate)
      resolveAuditOutcome(
        aiBot.id,
        false,
        undefined,
        setPlayers,
        setBankProperties,
        eliminatePlayerFn,
        addGameLog,
        setEliminatedPlayers,
        setTurnIndex
      );
    }
  }
};

// 1. Dynamic Bankruptcy Message Pool
export const AUDIT_BANKRUPTCY_MESSAGES = [
  "🚨 AUDIT COLLAPSE: {id} failed to raise $5,000 liquid capital before the IRS raid timer hit 0s!",
  "⚖️ FEDERAL LIQUIDATION: {id} couldn't cover the $5,000 audit defense threshold and was booted!",
  "🏛️ ASSET SEIZURE COMPLETE: {id}'s cash remained under $5,000 during the inspection. Total insolvency!",
  "💸 IRS EVICTION: {id} fell short of the $5,000 audit requirement and has been permanently removed!"
];

export const getRandomAuditMsg = (playerId: number | string, playerName?: string) => {
  const name = playerName || (typeof playerId === 'number' ? `Player ${playerId}` : playerId);
  const template = AUDIT_BANKRUPTCY_MESSAGES[Math.floor(Math.random() * AUDIT_BANKRUPTCY_MESSAGES.length)];
  return template.replace("{id}", String(name));
};

/**
 * LIVE AUDIT TICK ENGINE
 * Counts down audit timers every second.
 * When timer hits 0s:
 * - Cash >= $5,000: Audit cleared safely.
 * - Cash < $5,000: Forced bankruptcy & permanent removal from game.
 */
export const processAuditTimerTick = (
  setPlayers: React.Dispatch<React.SetStateAction<any[]>>,
  eliminateEntityFromGameCallback?: (playerId: any, reason: string) => void,
  addGameLog?: (msg: string) => void
) => {
  if (typeof setPlayers !== 'function') return;

  setPlayers((prevPlayers) => {
    let hasChanges = false;

    const updatedPlayers = prevPlayers.map((player) => {
      // Check if player/AI is currently under active audit
      if (player.auditState?.underInvestigation && (player.auditState.timer ?? 0) > 0) {
        hasChanges = true;
        const newTimer = (player.auditState.timer ?? 30) - 1;
        const pName = player.name || `Player ${player.id}`;

        // COUNTDOWN HIT 0 SECONDS -> EVALUATE CASH THRESHOLD
        if (newTimer <= 0) {
          const currentCash = player.totalCash !== undefined ? player.totalCash : (player.cash ?? 0);

          // CONDITION A: FAILED TO REACH $5,000 USD -> FORCED BANKRUPTCY & KICK
          if (currentCash < 5000) {
            const dynamicReason = getRandomAuditMsg(player.id, pName);

            // Trigger immediate elimination from active turn order
            setTimeout(() => {
              if (typeof eliminateEntityFromGameCallback === 'function') {
                eliminateEntityFromGameCallback(player.id, dynamicReason);
              }
            }, 0);

            return {
              ...player,
              isBankrupt: true,
              auditState: { ...player.auditState, underInvestigation: false, timer: 0 },
            };
          }

          // CONDITION B: REACHED $5,000 USD OR MORE -> AUDIT CLEARED
          if (typeof addGameLog === 'function') {
            addGameLog(
              `🛡️ AUDIT CLEARED: ${pName} maintained over $5,000 cash and passed the federal investigation!`
            );
          }

          return {
            ...player,
            riskIndex: Math.max(0, (player.riskIndex || 0) - 20),
            auditState: { ...player.auditState, underInvestigation: false, timer: 0 },
          };
        }

        // DECREMENT TIMER (30s -> 29s -> 28s...)
        return {
          ...player,
          auditState: {
            ...player.auditState,
            timer: newTimer,
          },
        };
      }

      return player;
    });

    return hasChanges ? updatedPlayers : prevPlayers;
  });
};

/**
 * RECURRING 20-MINUTE AUTOMATIC RAID ENGINE
 * Automatically picks one random player/AI for a raid every 20 minutes.
 */
export const triggerRecurringRaid = (
  activePlayers: any[],
  setPlayers?: React.Dispatch<React.SetStateAction<any[]>>,
  addGameLog?: (msg: string) => void,
  AudioFX?: any
) => {
  if (!Array.isArray(activePlayers) || activePlayers.length === 0) return;

  // Filter for active players not currently under audit or bankrupt
  const eligibleTargets = activePlayers.filter((p) => !p.auditState?.underInvestigation && !p.isBankrupt);
  if (eligibleTargets.length === 0) return;

  // Select 1 random player/AI from total player pool
  const randomIndex = Math.floor(Math.random() * eligibleTargets.length);
  const selectedTarget = eligibleTargets[randomIndex];
  const targetName = selectedTarget.name || `Player ${selectedTarget.id}`;

  // Play audio alert if available
  if (AudioFX && typeof AudioFX.playSirenSound === 'function') {
    AudioFX.playSirenSound();
  }

  // Set target under investigation (30-second defense window)
  if (typeof setPlayers === 'function') {
    setPlayers((prevPlayers) => {
      return prevPlayers.map((p) => {
        if (p.id === selectedTarget.id) {
          return {
            ...p,
            auditState: {
              underInvestigation: true,
              initiatorId: "IRS_PERIODIC_SWEEP",
              timer: 30,
              riskAtRaid: p.riskIndex || 50,
            },
          };
        }
        return p;
      });
    });
  }

  const alerts = [
    `🚨 20-MINUTE RAID CYCLE: Federal agents randomly targeted ${targetName} for an unannounced tax audit!`,
    `⚡ SYSTEM TAX RAID: The 20-minute audit timer expired! ${targetName} is under investigation!`,
    `🔍 SURPRISE INSPECTION: Tax authorities flagged ${targetName} for dynamic verification!`,
    `🏛️ PERIODIC CRACKDOWN: Government auditors burst into ${targetName}'s office!`
  ];

  const selectedAlert = alerts[Math.floor(Math.random() * alerts.length)];

  if (typeof addGameLog === 'function') {
    addGameLog(selectedAlert);
  }

  console.warn(`[20-MIN RAID TRIGGERED] Target: ${targetName} (${selectedTarget.id})`);
};

