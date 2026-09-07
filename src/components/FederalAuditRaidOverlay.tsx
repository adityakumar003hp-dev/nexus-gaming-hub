import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, AlertTriangle, Radio, Crosshair, Zap, FileWarning, Lock } from 'lucide-react';

export interface FederalAuditRaidOverlayProps {
  targetPlayer: {
    id: number | string;
    name?: string;
    riskIndex?: number;
    cash?: number;
    totalCash?: number;
    auditState?: {
      underInvestigation: boolean;
      initiatorId?: number | string;
      timer?: number;
      riskAtRaid?: number;
    };
  } | null;
  onDismiss?: () => void;
}

export const FederalAuditRaidOverlay: React.FC<FederalAuditRaidOverlayProps> = ({
  targetPlayer,
  onDismiss,
}) => {
  const [glitchActive, setGlitchActive] = useState(false);
  const [audioPlayed, setAudioPlayed] = useState(false);

  // Trigger brief periodic visual distortion flickers
  useEffect(() => {
    if (!targetPlayer) {
      setAudioPlayed(false);
      return;
    }

    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 140);
    }, 2800);

    return () => clearInterval(interval);
  }, [targetPlayer]);

  if (!targetPlayer || !targetPlayer.auditState?.underInvestigation) {
    return null;
  }

  const isFederalBureau = targetPlayer.auditState.initiatorId === 'IRS_FEDERAL_BUREAU' || targetPlayer.auditState.initiatorId === 'IRS_PERIODIC_SWEEP';
  const targetName = targetPlayer.name || `Player ${targetPlayer.id}`;
  const riskPercent = targetPlayer.auditState.riskAtRaid ?? targetPlayer.riskIndex ?? 50;
  const timerSec = targetPlayer.auditState.timer ?? 30;

  return (
    <AnimatePresence>
      <motion.div
        id="federal-audit-raid-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="pointer-events-none fixed inset-0 z-40 overflow-hidden select-none"
      >
        {/* Pulsing Red/Blue Federal Emergency Light Flares */}
        <div className="absolute inset-0 bg-radial from-transparent via-red-950/20 to-red-900/40 animate-pulse pointer-events-none mix-blend-screen" />
        
        {/* Sweeping Emergency Siren Beams */}
        <div className="absolute top-0 left-0 right-0 h-full overflow-hidden opacity-30">
          <div className="absolute -inset-[100%] bg-gradient-to-r from-red-600/0 via-red-500/25 to-blue-600/25 animate-[spin_8s_linear_infinite]" />
        </div>

        {/* Scanlines & CRT Distortion Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] opacity-40 pointer-events-none" />

        {/* Outer Perimeter Hazard Borders */}
        <div className="absolute inset-0 border-4 border-red-500/60 shadow-[inset_0_0_80px_rgba(239,68,68,0.5)] animate-pulse pointer-events-none">
          {/* Tactical Corner Crosshairs */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 text-red-400 font-mono text-[10px] tracking-widest font-black bg-black/60 px-2 py-1 border border-red-500/50 rounded">
            <Crosshair className="w-3.5 h-3.5 animate-spin" />
            <span>FEDERAL_INTERCEPTION_HUD // ACTIVE</span>
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-1.5 text-amber-400 font-mono text-[10px] tracking-widest font-black bg-black/60 px-2 py-1 border border-amber-500/50 rounded">
            <Radio className="w-3.5 h-3.5 animate-pulse text-red-400" />
            <span>SAT_LINK: IRS_ENFORCEMENT</span>
          </div>

          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-red-300 font-mono text-[10px] tracking-widest font-black bg-black/60 px-2 py-1 border border-red-500/50 rounded">
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>ASSET_SEIZURE_PROTOCOL: ENGAGED</span>
          </div>

          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-gray-400 font-mono text-[10px] tracking-widest font-black bg-black/60 px-2 py-1 border border-white/20 rounded">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>RISK_EXPOSURE: {riskPercent}%</span>
          </div>
        </div>

        {/* Top Hazard Warning Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-7 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 flex items-center justify-around text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 whitespace-nowrap animate-[marquee_12s_linear_infinite]">
            <AlertTriangle className="w-4 h-4 fill-slate-950" />
            <span>⚠️ EMERGENCY TAX AUDIT IN PROGRESS ⚠️</span>
            <span>•</span>
            <span>TARGET: {targetName.toUpperCase()}</span>
            <span>•</span>
            <span>WARRANT ID: #FED-IRS-{targetPlayer.id}-99X</span>
            <span>•</span>
            <span>STATUS: LIQUID ASSET FREEZE ACTIVE</span>
            <span>•</span>
            <AlertTriangle className="w-4 h-4 fill-slate-950" />
          </div>
        </div>

        {/* Glitch Distortion Burst Layer */}
        {glitchActive && (
          <div className="absolute inset-0 bg-red-500/10 backdrop-invert-20 transform translate-x-1 -translate-y-1 pointer-events-none transition-all" />
        )}

        {/* Floating Center-Top Tactical HUD Banner */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <motion.div
            initial={{ y: -30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-gradient-to-b from-slate-950/95 via-red-950/90 to-slate-950/95 border-2 border-red-500/80 rounded-2xl px-6 py-3.5 shadow-[0_0_50px_rgba(239,68,68,0.7)] flex items-center gap-4 backdrop-blur-xl"
          >
            <div className="w-12 h-12 rounded-xl bg-red-600/30 border border-red-400 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white font-mono text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase">
                  {isFederalBureau ? 'IRS CRACKDOWN' : 'CORPORATE RAID'}
                </span>
                <span className="text-[10px] font-mono text-red-300 font-bold">
                  LEVEL 4 STATUTORY INVESTIGATION
                </span>
              </div>
              <h1 className="text-base font-black text-white tracking-wide flex items-center gap-2 mt-0.5">
                <span>{targetName}</span>
                <span className="text-xs font-mono text-gray-300 font-normal">is under federal audit</span>
              </h1>
            </div>

            {/* Live Raid Timer Clock */}
            <div className="pl-4 border-l border-white/20 flex flex-col items-center">
              <span className="text-[8px] font-mono font-bold text-gray-400 uppercase tracking-wider">Agents Inside</span>
              <span className="text-xl font-mono font-black text-red-400 tabular-nums">
                {timerSec}s
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FederalAuditRaidOverlay;
