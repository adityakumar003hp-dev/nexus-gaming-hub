// Business Empire Engine - Modular Feature Suites
// 1. Market Dynamics & Economic Cycles
// 2. Player Sabotage & Industrial Espionage
// 3. Corporate Banking, Offshore Vaults & Loans
// 5. Zero-Dependency Web Audio API Sound Synthesizer

export interface MarketFluxEvent {
  name: string;
  propertyMultiplier: number;
  stockVolatility: number;
  riskModifier: number;
  description: string;
  icon: string;
}

export const MARKET_FLUX_EVENTS: Record<string, MarketFluxEvent> = {
  BULL_RUN: {
    name: '📈 Global Market Surge',
    propertyMultiplier: 1.25,
    stockVolatility: 1.4,
    riskModifier: 0,
    description: 'Property yields +25%, stocks booming with hyper-volatility!',
    icon: '📈',
  },
  BEAR_CRASH: {
    name: '📉 Economic Recession',
    propertyMultiplier: 0.75,
    stockVolatility: 0.6,
    riskModifier: 10,
    description: 'Property yields down -25%, liquidity crunch across all sectors.',
    icon: '📉',
  },
  INFLATION_SPIKE: {
    name: '🔥 High Inflation Shock',
    propertyMultiplier: 1.1,
    stockVolatility: 1.1,
    riskModifier: 15,
    description: 'Federal interest rates climb, tax raid risk +15% for high-net-worth holders.',
    icon: '🔥',
  },
  REGULATORY_CRACKDOWN: {
    name: '⚖️ SEC & Federal Sweep',
    propertyMultiplier: 0.9,
    stockVolatility: 0.8,
    riskModifier: 25,
    description: 'Regulatory audit enforcement increased across international portfolios.',
    icon: '⚖️',
  },
};

export const calculatePassiveRentYield = (player: any, multiplier: number): number => {
  const properties = player.propertiesOwned || player.properties || [];
  const baseYield = properties.reduce(
    (sum: number, prop: any) => sum + (Number(prop.price || prop.cost || 5000) * 0.05),
    0
  );
  return Math.round(baseYield * multiplier);
};

export const applyGlobalMarketPhase = (
  setPlayers: React.Dispatch<React.SetStateAction<any[]>>,
  setGlobalMarket?: (phase: MarketFluxEvent) => void,
  addGameLog?: (msg: string) => void
): MarketFluxEvent => {
  const keys = Object.keys(MARKET_FLUX_EVENTS);
  const selectedEventKey = keys[Math.floor(Math.random() * keys.length)];
  const currentPhase = MARKET_FLUX_EVENTS[selectedEventKey];

  if (typeof setGlobalMarket === 'function') {
    setGlobalMarket(currentPhase);
  }

  setPlayers((prevPlayers) =>
    prevPlayers.map((player) => {
      const passiveBonus = calculatePassiveRentYield(player, currentPhase.propertyMultiplier);
      const newCash = Math.round((player.cash ?? player.totalCash ?? 0) + passiveBonus);
      const currentRisk = player.riskIndex ?? 0;
      const updatedRisk = Math.min(100, Math.max(0, currentRisk + currentPhase.riskModifier));

      return {
        ...player,
        cash: newCash,
        totalCash: newCash,
        riskIndex: updatedRisk,
        netWorth: (player.netWorth || 0) + passiveBonus,
      };
    })
  );

  if (typeof addGameLog === 'function') {
    addGameLog(`🌐 GLOBAL MARKET SHIFT: ${currentPhase.name} active! Property yields & risk updated.`);
  }

  return currentPhase;
};

// ==========================================
// 2. PLAYER SABOTAGE & INDUSTRIAL ESPIONAGE
// ==========================================
export interface SabotageOperation {
  name: string;
  cost: number;
  riskIncrease?: number;
  cashDrainPercent?: number;
  desc: string;
  icon: string;
}

export const SABOTAGE_CATALOG: Record<string, SabotageOperation> = {
  FRAME_JOB: {
    name: 'Frame Job',
    cost: 12000,
    riskIncrease: 35,
    desc: 'Inflates target IRS & Audit risk index by +35%.',
    icon: '🕵️‍♂️',
  },
  CYBER_ATTACK: {
    name: 'Cyber Attack',
    cost: 8000,
    cashDrainPercent: 0.15,
    desc: 'Hacks opponent accounts to siphon 15% liquid cash.',
    icon: '💻',
  },
  EXECUTIVE_POACH: {
    name: 'Poach Executive',
    cost: 20000,
    desc: 'Bribes rival management to claim a real estate asset.',
    icon: '🤝',
  },
};

export const executeSabotageOperation = (
  opType: 'FRAME_JOB' | 'CYBER_ATTACK' | 'EXECUTIVE_POACH',
  attackerId: number | string,
  targetId: number | string,
  setPlayers: React.Dispatch<React.SetStateAction<any[]>>,
  addGameLog?: (msg: string) => void
): { success: boolean; message: string } => {
  const config = SABOTAGE_CATALOG[opType];
  if (!config) return { success: false, message: 'Invalid espionage operation' };

  let statusMsg = '';
  let successful = false;

  setPlayers((prev) => {
    const attacker = prev.find((p) => p.id === attackerId);
    const target = prev.find((p) => p.id === targetId);

    const attackerCash = attacker ? (attacker.cash ?? attacker.totalCash ?? 0) : 0;

    if (!attacker || !target || attackerCash < config.cost) {
      statusMsg = 'Insufficient liquid capital for espionage operation!';
      return prev;
    }

    successful = true;

    return prev.map((p) => {
      if (p.id === attackerId) {
        const remainingCash = (p.cash ?? p.totalCash ?? 0) - config.cost;
        return {
          ...p,
          cash: Math.max(0, remainingCash),
          totalCash: Math.max(0, remainingCash),
          netWorth: Math.max(0, (p.netWorth ?? 0) - config.cost),
        };
      }

      if (p.id === targetId) {
        if (opType === 'FRAME_JOB') {
          const newRisk = Math.min(100, (p.riskIndex || 0) + (config.riskIncrease || 35));
          statusMsg = `🕵️ ESPIONAGE: ${attacker.name || attackerId} framed ${p.name || targetId}, boosting risk index to ${newRisk}%!`;
          return { ...p, riskIndex: newRisk };
        }

        if (opType === 'CYBER_ATTACK') {
          const currentTargetCash = p.cash ?? p.totalCash ?? 0;
          const drained = Math.round(currentTargetCash * (config.cashDrainPercent || 0.15));
          const remaining = Math.max(0, currentTargetCash - drained);
          statusMsg = `💻 CYBER SQUEEZE: ${attacker.name || attackerId} drained $${drained.toLocaleString()} from ${p.name || targetId}!`;
          return {
            ...p,
            cash: remaining,
            totalCash: remaining,
            netWorth: Math.max(0, (p.netWorth ?? 0) - drained),
          };
        }

        if (opType === 'EXECUTIVE_POACH') {
          statusMsg = `🤝 POACH OPERATION: Executive team of ${p.name || targetId} subverted!`;
          return { ...p, riskIndex: Math.min(100, (p.riskIndex || 0) + 15) };
        }
      }
      return p;
    });
  });

  if (successful && typeof addGameLog === 'function') {
    addGameLog(statusMsg || `🕵️ ESPIONAGE: ${attackerId} executed a covert ${config.name} against ${targetId}!`);
    AudioFX.playCashSound();
  }

  return { success: successful, message: statusMsg || 'Operation executed.' };
};

// ==========================================
// 3. BANKING, OFFSHORE VAULTS & LOANS
// ==========================================
export const processCorporateBanking = {
  // Deposit funds into offshore vault (Shields cash from IRS seizures)
  depositOffshore: (
    playerId: number | string,
    amount: number,
    setPlayers: React.Dispatch<React.SetStateAction<any[]>>,
    addGameLog?: (msg: string) => void
  ): boolean => {
    let success = false;
    setPlayers((prev) =>
      prev.map((p) => {
        const playerCash = p.cash ?? p.totalCash ?? 0;
        if (p.id === playerId && playerCash >= amount && amount > 0) {
          success = true;
          const newCash = playerCash - amount;
          return {
            ...p,
            cash: newCash,
            totalCash: newCash,
            offshoreVault: (p.offshoreVault || 0) + amount,
          };
        }
        return p;
      })
    );

    if (success) {
      AudioFX.playCashSound();
      if (addGameLog) addGameLog(`🏦 OFFSHORE SHIELD: ${playerId} stashed $${amount.toLocaleString()} in an offshore vault.`);
    }
    return success;
  },

  // Withdraw funds from offshore vault back to active liquid cash
  withdrawOffshore: (
    playerId: number | string,
    amount: number,
    setPlayers: React.Dispatch<React.SetStateAction<any[]>>,
    addGameLog?: (msg: string) => void
  ): boolean => {
    let success = false;
    setPlayers((prev) =>
      prev.map((p) => {
        const vault = p.offshoreVault || 0;
        if (p.id === playerId && vault >= amount && amount > 0) {
          success = true;
          const currentCash = p.cash ?? p.totalCash ?? 0;
          return {
            ...p,
            cash: currentCash + amount,
            totalCash: currentCash + amount,
            offshoreVault: vault - amount,
          };
        }
        return p;
      })
    );

    if (success) {
      AudioFX.playCashSound();
      if (addGameLog) addGameLog(`🏦 OFFSHORE WITHDRAWAL: ${playerId} repatriated $${amount.toLocaleString()} into treasury.`);
    }
    return success;
  },

  // Issue emergency bank loan (Incurs 20% interest on outstanding debt)
  issueEmergencyLoan: (
    playerId: number | string,
    loanAmount: number,
    setPlayers: React.Dispatch<React.SetStateAction<any[]>>,
    addGameLog?: (msg: string) => void
  ): void => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === playerId) {
          const currentCash = p.cash ?? p.totalCash ?? 0;
          const newDebt = (p.outstandingDebt || 0) + Math.round(loanAmount * 1.2); // 20% interest
          return {
            ...p,
            cash: currentCash + loanAmount,
            totalCash: currentCash + loanAmount,
            outstandingDebt: newDebt,
            netWorth: (p.netWorth || 0) + loanAmount - Math.round(loanAmount * 0.2),
          };
        }
        return p;
      })
    );

    AudioFX.playCashSound();
    if (addGameLog) addGameLog(`💳 CREDIT LINE: Secured a $${loanAmount.toLocaleString()} emergency bank credit line.`);
  },

  // Repay outstanding debt
  repayLoan: (
    playerId: number | string,
    repayAmount: number,
    setPlayers: React.Dispatch<React.SetStateAction<any[]>>,
    addGameLog?: (msg: string) => void
  ): boolean => {
    let success = false;
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === playerId) {
          const currentCash = p.cash ?? p.totalCash ?? 0;
          const debt = p.outstandingDebt || 0;
          const actualRepay = Math.min(repayAmount, debt, currentCash);
          if (actualRepay > 0) {
            success = true;
            return {
              ...p,
              cash: currentCash - actualRepay,
              totalCash: currentCash - actualRepay,
              outstandingDebt: debt - actualRepay,
            };
          }
        }
        return p;
      })
    );

    if (success) {
      AudioFX.playCashSound();
      if (addGameLog) addGameLog(`💳 DEBT CLEARED: Repaid $${repayAmount.toLocaleString()} towards outstanding debt.`);
    }
    return success;
  },
};

// ==========================================
// 5. WEB AUDIO API SOUND SYSTEM (ZERO-DEPENDENCY)
// ==========================================
class EngineAudioFX {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Cash Register / Transaction Sound
  public playCashSound() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, this.ctx.currentTime + 0.1); // E6

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      // Audio fallback
    }
  }

  // Siren Sound for Tax Raids / Audit Alarms
  public playSirenSound() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(900, this.ctx.currentTime + 0.25);
      osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      // Audio fallback
    }
  }

  // Decryption Key Press Beep
  public playKeyBeep() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, this.ctx.currentTime); // A6

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      // Audio fallback
    }
  }

  // Hacker Override / Victory Fanfare
  public playOverrideSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.25, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.2);
      });
    } catch (e) {
      // Audio fallback
    }
  }

  // Access Denied Buzzer
  public playAccessDenied() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3
      osc.frequency.setValueAtTime(116.54, this.ctx.currentTime + 0.15); // A#2

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      // Audio fallback
    }
  }
}

export const AudioFX = new EngineAudioFX();
