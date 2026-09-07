import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, Sparkles, Zap } from 'lucide-react';

export interface InternationalBusinessCenterProps {
  children?: React.ReactNode;
  isRolling?: boolean;
  diceValue?: number;
  secondDiceValue?: number;
  diceMode?: 'single' | 'double';
  onRoll?: () => void;
  activePlayerColor?: string;
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

export const InternationalBusinessCenter: React.FC<InternationalBusinessCenterProps> = ({
  children,
  isRolling = false,
  diceValue = 4,
  secondDiceValue = 3,
  diceMode = 'single',
  onRoll,
  activePlayerColor = '#ef4444',
}) => {
  const rot1 = DICE_ROTATIONS[diceValue] || DICE_ROTATIONS[1];
  const rot2 = DICE_ROTATIONS[secondDiceValue] || DICE_ROTATIONS[3];

  return (
    <div
      onClick={onRoll}
      className={`relative w-full h-full rounded-2xl bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#075985] border-2 border-[#bae6fd]/40 overflow-hidden shadow-inner flex flex-col justify-between p-2 select-none ${
        onRoll ? 'cursor-pointer group' : ''
      }`}
    >
      {/* Sky Atmospheric Glow & Clouds */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.25)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

      {/* Floating Hot Air Balloons */}
      <motion.div
        animate={{ y: [0, -6, 0], x: [0, 2, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-16 left-6 text-base sm:text-lg opacity-85 pointer-events-none drop-shadow-md"
      >
        🎈
      </motion.div>
      <motion.div
        animate={{ y: [0, -8, 0], x: [0, -3, 0] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-20 right-8 text-sm sm:text-base opacity-80 pointer-events-none drop-shadow-md"
      >
        🎈
      </motion.div>

      {/* Flying Commercial Jet Airplane with Contrail */}
      <motion.div
        animate={{
          x: ['-20%', '115%'],
          y: ['0%', '-15%'],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute top-12 left-0 z-10 flex items-center pointer-events-none"
      >
        <div className="w-24 sm:w-36 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-white/90 rounded-full" />
        <div className="text-xl sm:text-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] transform rotate-[10deg]">
          ✈️
        </div>
      </motion.div>

      {/* ================= TOP PROMINENT RED BANNER ================= */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center mt-1 sm:mt-2">
        <div className="w-full max-w-[94%] bg-gradient-to-b from-[#dc2626] via-[#b91c1c] to-[#991b1b] border-2 border-[#fca5a5]/80 rounded-2xl px-3 py-2 sm:py-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.4),0_0_20px_rgba(220,38,38,0.45)] flex flex-col items-center group-hover:scale-[1.02] transition-transform">
          <span className="text-[9px] sm:text-xs font-black tracking-[0.25em] text-white uppercase drop-shadow">
            INTERNATIONAL
          </span>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white m-0 drop-shadow-[0_3px_5px_rgba(0,0,0,0.8)] font-sans uppercase">
            BUSINESS
          </h1>
          <span className="text-[7px] sm:text-[9px] font-bold tracking-wider text-amber-100 uppercase mt-0.5 drop-shadow">
            BUY, SELL, RENT ON THE ROLL OF A DICE!
          </span>
        </div>
      </div>

      {/* ================= 3D KINETIC CENTER DICE OVERLAY DURING ROLL / INTERACTION ================= */}
      <AnimatePresence>
        {isRolling && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="absolute inset-0 z-40 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 pointer-events-none"
          >
            {/* 3D Tumble Stage */}
            <div style={{ perspective: 900 }} className="flex items-center gap-6">
              {/* Dynamic 3D Tumble Cube 1 */}
              <motion.div
                animate={{
                  rotateX: [0, 720, 1440, 2160],
                  rotateY: [0, 1080, 2160, 3240],
                  rotateZ: [0, 360, 720, 1080],
                  y: [-10, 20, -25, 10, -5],
                  scale: [1, 1.25, 0.9, 1.15, 1],
                }}
                transition={{ duration: 0.65, repeat: Infinity, ease: 'linear' }}
                style={{
                  transformStyle: 'preserve-3d',
                  width: '64px',
                  height: '64px',
                  boxShadow: `0 0 35px ${activePlayerColor}80`,
                }}
                className="relative rounded-2xl"
              >
                {/* 6 Textured Cube Faces */}
                <div
                  style={{ transform: 'rotateY(0deg) translateZ(32px)' }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border-2 border-white flex items-center justify-center shadow-xl backface-visible"
                >
                  <div className="w-5 h-5 rounded-full bg-red-600 shadow-md" />
                </div>
                <div
                  style={{ transform: 'rotateY(180deg) translateZ(32px)' }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border-2 border-white p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center shadow-xl backface-visible"
                >
                  {[0, 2, 3, 5, 6, 8].map((i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                  ))}
                </div>
                <div
                  style={{ transform: 'rotateY(90deg) translateZ(32px)' }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border-2 border-white p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center shadow-xl backface-visible"
                >
                  {[2, 4, 6].map((i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                  ))}
                </div>
                <div
                  style={{ transform: 'rotateY(-90deg) translateZ(32px)' }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border-2 border-white p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center shadow-xl backface-visible"
                >
                  {[0, 2, 6, 8].map((i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                  ))}
                </div>
                <div
                  style={{ transform: 'rotateX(90deg) translateZ(32px)' }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border-2 border-white p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center shadow-xl backface-visible"
                >
                  {[2, 6].map((i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                  ))}
                </div>
                <div
                  style={{ transform: 'rotateX(-90deg) translateZ(32px)' }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border-2 border-white p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center shadow-xl backface-visible"
                >
                  {[0, 2, 4, 6, 8].map((i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                  ))}
                </div>
              </motion.div>

              {diceMode === 'double' && (
                <motion.div
                  animate={{
                    rotateX: [0, -720, -1440, -2160],
                    rotateY: [0, -1080, -2160, -3240],
                    rotateZ: [0, -360, -720, -1080],
                    y: [10, -20, 25, -10, 5],
                    scale: [1, 1.25, 0.9, 1.15, 1],
                  }}
                  transition={{ duration: 0.65, repeat: Infinity, ease: 'linear', delay: 0.08 }}
                  style={{
                    transformStyle: 'preserve-3d',
                    width: '64px',
                    height: '64px',
                    boxShadow: `0 0 35px ${activePlayerColor}80`,
                  }}
                  className="relative rounded-2xl"
                >
                  <div
                    style={{ transform: 'rotateY(0deg) translateZ(32px)' }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border-2 border-white flex items-center justify-center shadow-xl backface-visible"
                  >
                    <div className="w-5 h-5 rounded-full bg-red-600 shadow-md" />
                  </div>
                  <div
                    style={{ transform: 'rotateY(180deg) translateZ(32px)' }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border-2 border-white p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center shadow-xl backface-visible"
                  >
                    {[0, 2, 3, 5, 6, 8].map((i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                    ))}
                  </div>
                  <div
                    style={{ transform: 'rotateY(90deg) translateZ(32px)' }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border-2 border-white p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center shadow-xl backface-visible"
                  >
                    {[2, 4, 6].map((i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                    ))}
                  </div>
                  <div
                    style={{ transform: 'rotateY(-90deg) translateZ(32px)' }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border-2 border-white p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center shadow-xl backface-visible"
                  >
                    {[0, 2, 6, 8].map((i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                    ))}
                  </div>
                  <div
                    style={{ transform: 'rotateX(90deg) translateZ(32px)' }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border-2 border-white p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center shadow-xl backface-visible"
                  >
                    {[2, 6].map((i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                    ))}
                  </div>
                  <div
                    style={{ transform: 'rotateX(-90deg) translateZ(32px)' }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border-2 border-white p-2 grid grid-cols-3 grid-rows-3 items-center justify-items-center shadow-xl backface-visible"
                  >
                    {[0, 2, 4, 6, 8].map((i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Kinetic status banner */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 rounded-full font-black text-xs uppercase tracking-wider shadow-lg animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Rolling 3D Dice...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MIDDLE / LOWER: WORLD FAMOUS LANDMARKS MONTAGE OVER GLOBE ================= */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-end items-center pointer-events-none mt-1">
        {/* Landmarks Composite Horizon */}
        <div className="relative w-full flex items-end justify-center px-1">
          <div className="flex items-end justify-center gap-1 sm:gap-2 text-xl sm:text-3xl lg:text-4xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]">
            <span title="Big Ben & London Bridge">🕰️</span>
            <span title="Leaning Tower of Pisa">🏛️</span>
            <span title="Taj Mahal">🕌</span>
          </div>

          <div className="flex items-end justify-center gap-1 text-3xl sm:text-5xl lg:text-6xl drop-shadow-[0_6px_14px_rgba(0,0,0,0.8)] -mx-1 z-10">
            <span title="Eiffel Tower, Paris" className="animate-pulse">🗼</span>
            <span title="Saint Basil's Cathedral, Moscow">🏰</span>
          </div>

          <div className="flex items-end justify-center gap-1 sm:gap-2 text-xl sm:text-3xl lg:text-4xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]">
            <span title="Pyramids of Giza & Sphinx">🏺</span>
            <span title="Statue of Liberty, New York">🗽</span>
            <span title="Skyline Tower, Shanghai">🏙️</span>
          </div>
        </div>

        {/* Curved Blue-Green Earth Globe with Continents */}
        <div className="relative w-full h-14 sm:h-20 bg-gradient-to-t from-[#0369a1] via-[#0284c7] to-[#38bdf8] rounded-t-[100%] border-t-2 border-cyan-200/60 shadow-[0_-10px_30px_rgba(56,189,248,0.4)] flex items-center justify-around px-2 sm:px-4 overflow-hidden mt-0.5">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,#22c55e_0%,#15803d_60%,transparent_80%)]" />

          {/* Transportation Vehicles */}
          <div className="relative z-10 flex items-center justify-between w-full text-base sm:text-2xl px-2 drop-shadow-md">
            <span title="Bullet Train Logistics" className="transform -scale-x-100">🚆</span>
            <span title="Green Logistics Transport Truck">🚛</span>
            
            {/* Center Wealth Stack: Cash & Gold Coins */}
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full border border-amber-300/50 shadow-lg">
              <span className="text-sm sm:text-xl">💵</span>
              <span className="text-xs sm:text-base font-black text-amber-300 font-mono">$$$</span>
              <span className="text-sm sm:text-xl">🪙</span>
            </div>

            <span title="Container Cargo Ship">🚢</span>
          </div>
        </div>
      </div>

      {/* Children Elements Overlay */}
      {children && (
        <div className="relative z-30 w-full mt-1">
          {children}
        </div>
      )}
    </div>
  );
};
