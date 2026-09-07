import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Dices, ArrowRight, ShieldCheck, ShieldAlert, Footprints, Zap, ShoppingBag } from 'lucide-react';

export interface VisualDiceRollerProps {
  diceValue: number; // 1 to 6
  secondDiceValue?: number;
  diceMode?: 'single' | 'double';
  onToggleDiceMode?: () => void;
  isRolling: boolean;
  isMovingPawn: boolean;
  onRoll: () => void;
  allowedSteps: number;
  targetSpaceName?: string;
  targetSpaceIcon?: string;
  targetSpacePrice?: number;
  activePlayerName: string;
  activePlayerColor: string;
  activePlayerToken: string;
  isAiTurn: boolean;
  disabled?: boolean;
  hasExtraTurn?: boolean;
  isInJail?: boolean;
  isVisaCaptured?: boolean;
  onOpenShop?: () => void;
  onSkipJailTurn?: () => void;
}

// 3D Cube Rotation Targets for each Face (1-6)
const DICE_ROTATIONS: Record<number, { x: number; y: number; z: number }> = {
  1: { x: 0, y: 0, z: 0 },
  2: { x: -90, y: 0, z: 0 },
  3: { x: 0, y: -90, z: 0 },
  4: { x: 0, y: 90, z: 0 },
  5: { x: 90, y: 0, z: 0 },
  6: { x: 0, y: 180, z: 0 },
};

export const VisualDiceRoller: React.FC<VisualDiceRollerProps> = ({
  diceValue,
  secondDiceValue = 3,
  diceMode = 'single',
  onToggleDiceMode,
  isRolling,
  isMovingPawn,
  onRoll,
  allowedSteps,
  targetSpaceName,
  targetSpaceIcon,
  targetSpacePrice,
  activePlayerName,
  activePlayerColor,
  activePlayerToken,
  isAiTurn,
  disabled = false,
  hasExtraTurn = false,
  isInJail = false,
  isVisaCaptured = false,
  onOpenShop,
  onSkipJailTurn,
}) => {
  const [spinRevs, setSpinRevs] = useState<number>(1);
  const [justLanded, setJustLanded] = useState<boolean>(false);

  // Trigger kinetic impact shockwave on roll end
  useEffect(() => {
    if (!isRolling && allowedSteps > 0) {
      setJustLanded(true);
      const timer = setTimeout(() => setJustLanded(false), 900);
      return () => clearTimeout(timer);
    }
  }, [isRolling, allowedSteps, diceValue]);

  const handleRollClick = () => {
    if (isRolling || isMovingPawn || disabled || isAiTurn) return;
    setSpinRevs((prev) => prev + 2);
    onRoll();
  };

  // 3D CSS True Cube Die Renderer
  const render3DCubeDie = (val: number, isSecond = false) => {
    const rot = DICE_ROTATIONS[val] || DICE_ROTATIONS[1];
    const offsetTurns = spinRevs * 360;

    return (
      <div
        className="relative group cursor-pointer"
        onClick={handleRollClick}
        title="Click to roll the 3D dice!"
      >
        {/* Under-Die Dynamic Shadow with Kinetic Scale */}
        <motion.div
          animate={
            isRolling
              ? {
                  scale: [0.6, 1.3, 0.5, 1.2, 0.7],
                  opacity: [0.3, 0.7, 0.2, 0.8, 0.4],
                }
              : justLanded
              ? { scale: [1.4, 0.9, 1], opacity: [0.9, 0.4, 0.6] }
              : { scale: 1, opacity: 0.6 }
          }
          transition={{ duration: isRolling ? 0.45 : 0.6, repeat: isRolling ? Infinity : 0 }}
          style={{
            background: `radial-gradient(ellipse at center, ${activePlayerColor}90 0%, rgba(0,0,0,0.8) 60%, transparent 80%)`,
          }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-14 h-4 rounded-full pointer-events-none blur-[3px]"
        />

        {/* 3D Perspective Scene Container */}
        <div
          style={{ perspective: 1000 }}
          className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center select-none"
        >
          {/* Rotating 3D Cube with preserve-3d */}
          <motion.div
            animate={
              isRolling
                ? {
                    rotateX: [0, 720 + rot.x, 1440 + rot.x],
                    rotateY: [0, 1080 + rot.y, 2160 + rot.y],
                    rotateZ: [0, 360 + rot.z, 720 + rot.z],
                    y: [0, -32, 4, -18, 0],
                    scale: [1, 1.15, 0.95, 1.08, 1],
                  }
                : justLanded
                ? {
                    rotateX: rot.x + (isSecond ? 360 : 720),
                    rotateY: rot.y + (isSecond ? 720 : 360),
                    rotateZ: rot.z,
                    y: [0, -14, 0, -4, 0],
                    scale: [1, 1.2, 0.95, 1.05, 1],
                  }
                : {
                    rotateX: rot.x,
                    rotateY: rot.y,
                    rotateZ: rot.z,
                    y: 0,
                    scale: 1,
                  }
            }
            transition={{
              duration: isRolling ? 0.55 : 0.6,
              repeat: isRolling ? Infinity : 0,
              ease: isRolling ? 'linear' : [0.34, 1.56, 0.64, 1], // Spring kinetic bounce
            }}
            style={{
              transformStyle: 'preserve-3d',
              width: '54px',
              height: '54px',
            }}
            className="relative transform-gpu transition-shadow"
          >
            {/* FACE 1: FRONT (translateZ: 27px) */}
            <div
              style={{ transform: 'rotateY(0deg) translateZ(27px)' }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-visible"
            >
              <div className="w-4 h-4 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8),inset_0_1px_2px_rgba(0,0,0,0.5)] border border-red-700 animate-pulse" />
            </div>

            {/* FACE 6: BACK (rotateY(180deg) translateZ(27px)) */}
            <div
              style={{ transform: 'rotateY(180deg) translateZ(27px)' }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center"
            >
              {[0, 2, 3, 5, 6, 8].map((idx) => (
                <div
                  key={idx}
                  style={{ gridRow: Math.floor(idx / 3) + 1, gridColumn: (idx % 3) + 1 }}
                  className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner"
                />
              ))}
            </div>

            {/* FACE 3: RIGHT (rotateY(90deg) translateZ(27px)) */}
            <div
              style={{ transform: 'rotateY(90deg) translateZ(27px)' }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center"
            >
              {[2, 4, 6].map((idx) => (
                <div
                  key={idx}
                  style={{ gridRow: Math.floor(idx / 3) + 1, gridColumn: (idx % 3) + 1 }}
                  className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner"
                />
              ))}
            </div>

            {/* FACE 4: LEFT (rotateY(-90deg) translateZ(27px)) */}
            <div
              style={{ transform: 'rotateY(-90deg) translateZ(27px)' }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center"
            >
              {[0, 2, 6, 8].map((idx) => (
                <div
                  key={idx}
                  style={{ gridRow: Math.floor(idx / 3) + 1, gridColumn: (idx % 3) + 1 }}
                  className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner"
                />
              ))}
            </div>

            {/* FACE 2: TOP (rotateX(90deg) translateZ(27px)) */}
            <div
              style={{ transform: 'rotateX(90deg) translateZ(27px)' }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center"
            >
              {[2, 6].map((idx) => (
                <div
                  key={idx}
                  style={{ gridRow: Math.floor(idx / 3) + 1, gridColumn: (idx % 3) + 1 }}
                  className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner"
                />
              ))}
            </div>

            {/* FACE 5: BOTTOM (rotateX(-90deg) translateZ(27px)) */}
            <div
              style={{ transform: 'rotateX(-90deg) translateZ(27px)' }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center"
            >
              {[0, 2, 4, 6, 8].map((idx) => (
                <div
                  key={idx}
                  style={{ gridRow: Math.floor(idx / 3) + 1, gridColumn: (idx % 3) + 1 }}
                  className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner"
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Kinetic Impact Sparkles upon Landing */}
        <AnimatePresence>
          {justLanded && (
            <motion.div
              initial={{ scale: 0.2, opacity: 0, y: 0 }}
              animate={{ scale: 1.3, opacity: 1, y: -20 }}
              exit={{ opacity: 0, scale: 1.6 }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex items-center gap-1 bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black text-[11px] font-mono shadow-[0_0_15px_rgba(251,191,36,0.8)] border border-white"
            >
              <Zap className="w-3 h-3 fill-slate-950 animate-bounce" />
              <span>+{val}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div
      style={{
        borderColor: `${activePlayerColor}60`,
      }}
      className="w-full bg-slate-950/90 backdrop-blur-md border-2 rounded-2xl p-2.5 sm:p-3 shadow-[0_10px_40px_rgba(0,0,0,0.7)] flex flex-col sm:flex-row items-center justify-between gap-3 text-white transition-all relative overflow-hidden"
    >
      {/* Dynamic Background Kinetic Ambient Glow */}
      <div
        style={{
          background: `radial-gradient(circle at 50% 50%, ${activePlayerColor}25 0%, transparent 70%)`,
        }}
        className="absolute inset-0 pointer-events-none"
      />

      {/* LEFT: Current Active Player Badge */}
      <div className="relative z-10 flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
        <div
          style={{
            borderColor: activePlayerColor,
            boxShadow: `0 0 15px ${activePlayerColor}50`,
          }}
          className="w-10 h-10 rounded-xl bg-slate-900 border-2 flex items-center justify-center text-xl shrink-0 relative"
        >
          <span>{activePlayerToken}</span>
          <span
            style={{ backgroundColor: activePlayerColor }}
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-950 animate-pulse"
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              style={{ color: activePlayerColor }}
              className="text-xs sm:text-sm font-black truncate max-w-[130px] sm:max-w-[160px]"
            >
              {activePlayerName}
            </span>
            {isAiTurn && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-bold uppercase">
                AI
              </span>
            )}
            {hasExtraTurn && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/60 font-black uppercase flex items-center gap-1 animate-bounce">
                <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300" /> Extra Turn!
              </span>
            )}
            {isInJail && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-400/60 font-black uppercase flex items-center gap-1">
                ⛓️ In Jail (-$500)
              </span>
            )}
            {isVisaCaptured && !isInJail && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-600/40 text-rose-300 border border-rose-500/70 font-black uppercase flex items-center gap-1 animate-pulse">
                🚫 No Visa
              </span>
            )}
          </div>
          <span className="text-[10px] text-gray-300 flex items-center gap-1 font-medium">
            {isVisaCaptured && !isInJail ? (
              <>
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                <span className="text-rose-400 font-bold">Travel Restricted: Visa Required</span>
              </>
            ) : isInJail ? (
              <>
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>In Jail: Skipping Turn (1 Round)</span>
              </>
            ) : hasExtraTurn ? (
              <>
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{diceMode === 'double' ? 'Bonus Turn Active (Rolled Doubles)' : 'Bonus Turn Active (Rolled 6)'}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Active Turn</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* CENTER: 3D Animated Kinetic Dice & Movement Range Indicator */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 w-full sm:w-auto">
        <div className="flex items-center gap-4 py-1">
          {render3DCubeDie(diceValue, false)}
          {diceMode === 'double' && secondDiceValue && render3DCubeDie(secondDiceValue, true)}
        </div>

        {/* Allowed Movement Range Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-white/10 text-[10px] sm:text-xs font-semibold shadow-inner">
          <Footprints className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-gray-300">{isInJail ? 'Jail Status:' : isVisaCaptured ? 'Travel Status:' : 'Allowed Range:'}</span>
          <span className="font-mono font-black text-amber-300">
            {isInJail ? 'Turn Skipped (0 Spaces)' : isVisaCaptured ? 'Blocked (0 Spaces)' : `+${allowedSteps || diceValue} Spaces`}
          </span>
          {targetSpaceName && !isInJail && !isVisaCaptured && (
            <>
              <ArrowRight className="w-3 h-3 text-gray-500" />
              <span className="text-cyan-300 font-bold truncate max-w-[110px]">
                {targetSpaceIcon} {targetSpaceName}
              </span>
              {targetSpacePrice && targetSpacePrice > 0 ? (
                <span className="text-[#ffe89e] font-mono font-bold">(${targetSpacePrice})</span>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* RIGHT: Roll Action Button & Die Mode Selector */}
      <div className="relative z-10 flex items-center gap-2 w-full sm:w-auto justify-end">
        {onToggleDiceMode && !isInJail && !isVisaCaptured && (
          <button
            onClick={onToggleDiceMode}
            disabled={isRolling || isMovingPawn}
            className="px-2.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-gray-300 hover:text-white border border-white/10 text-[10px] font-bold transition flex items-center gap-1"
            title="Toggle 1 Die (1-6) or 2 Dice (2-12)"
          >
            <Dices className="w-3.5 h-3.5 text-cyan-400" />
            <span>{diceMode === 'single' ? '1 Die' : '2 Dice'}</span>
          </button>
        )}

        {isInJail ? (
          <button
            onClick={onSkipJailTurn}
            disabled={isAiTurn}
            className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 select-none bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white border-2 border-rose-400/80 shadow-lg cursor-pointer animate-pulse"
          >
            <span>⛓️ {isAiTurn ? `${activePlayerName} in Jail (Skipping)` : 'SERVE JAIL TIME (SKIP TURN)'}</span>
          </button>
        ) : isVisaCaptured ? (
          <button
            onClick={onOpenShop || handleRollClick}
            disabled={isAiTurn}
            className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 select-none bg-gradient-to-r from-rose-700 via-red-600 to-amber-600 hover:from-rose-600 hover:to-amber-500 text-white border-2 border-rose-400 shadow-lg cursor-pointer animate-pulse"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isAiTurn ? `${activePlayerName} (No Visa)` : 'BUY VISA AT SHOP (TRAVEL RESTRICTED)'}</span>
          </button>
        ) : (
          <button
            onClick={handleRollClick}
            disabled={isRolling || isMovingPawn || disabled || isAiTurn}
            style={{
              boxShadow: isRolling
                ? 'none'
                : `0 0 20px ${activePlayerColor}50, 0 4px 12px rgba(0,0,0,0.5)`,
            }}
            className={`flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 select-none ${
              isRolling || isMovingPawn || isAiTurn
                ? 'bg-slate-800 text-gray-400 border border-white/10 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-200 text-slate-950 border-2 border-amber-200 cursor-pointer animate-pulse'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isRolling
                ? 'Tumbling 3D Dice...'
                : isMovingPawn
                ? 'Moving Piece...'
                : isAiTurn
                ? `${activePlayerName} Rolling...`
                : 'ROLL 3D DICE (1-6)'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
