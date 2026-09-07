import React from 'react';
import { motion } from 'motion/react';

export interface BusinessPawnProps {
  colorHex: string;
  token?: string;
  name: string;
  isMoving?: boolean;
  isCurrentTurn?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const BusinessPawn: React.FC<BusinessPawnProps> = ({
  colorHex,
  token,
  name,
  isMoving = false,
  isCurrentTurn = false,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-5 h-7',
    md: 'w-6 h-8',
    lg: 'w-8 h-11',
  }[size];

  return (
    <motion.div
      animate={
        isMoving
          ? {
              y: [-2, -10, -2],
              scale: [1, 1.25, 1],
              rotate: [-4, 4, 0],
            }
          : isCurrentTurn
          ? {
              y: [0, -3, 0],
              scale: [1, 1.08, 1],
            }
          : {}
      }
      transition={{
        duration: isMoving ? 0.22 : 1.2,
        repeat: isMoving ? Infinity : isCurrentTurn ? Infinity : 0,
        ease: 'easeInOut',
      }}
      className={`relative flex flex-col items-center justify-end select-none shrink-0 ${sizeClasses}`}
      title={name}
    >
      {/* 3D Pawn Head (Glossy Sphere with Specular Reflection) */}
      <div
        className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full relative shadow-md z-10 flex items-center justify-center border border-white/60"
        style={{
          backgroundColor: colorHex,
          backgroundImage: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.2) 30%, ${colorHex} 70%, rgba(0,0,0,0.5) 100%)`,
          boxShadow: `0 0 10px ${colorHex}80, 0 2px 4px rgba(0,0,0,0.6)`,
        }}
      >
        {token && (
          <span className="text-[8px] sm:text-[9px] drop-shadow-md leading-none select-none">
            {token}
          </span>
        )}
      </div>

      {/* Pawn Neck / Waist */}
      <div
        className="w-2 h-1.5 -mt-0.5 z-0"
        style={{
          backgroundColor: colorHex,
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.4), ${colorHex}, rgba(255,255,255,0.5), ${colorHex}, rgba(0,0,0,0.4))`,
        }}
      />

      {/* 3D Pawn Bell / Body Base */}
      <div
        className="w-5 h-3 sm:w-5.5 sm:h-3.5 -mt-0.5 rounded-b-xl relative z-10 border-b-2 border-white/40"
        style={{
          backgroundColor: colorHex,
          backgroundImage: `radial-gradient(ellipse at top, rgba(255,255,255,0.6) 0%, ${colorHex} 60%, rgba(0,0,0,0.6) 100%)`,
          boxShadow: `0 3px 6px rgba(0,0,0,0.8), 0 0 8px ${colorHex}60`,
        }}
      >
        {/* Shiny Bottom Rim */}
        <div className="absolute -bottom-0.5 inset-x-0.5 h-1 rounded-full bg-white/40 blur-[0.5px]" />
      </div>

      {/* Pawn Ground Shadow Oval */}
      <div
        className="w-5 h-1.5 rounded-full bg-black/70 blur-[1px] -mt-0.5"
        style={{
          boxShadow: isMoving ? `0 0 8px ${colorHex}` : undefined,
        }}
      />
    </motion.div>
  );
};
