import React, { useState, useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';

export interface GameRaidHeaderProps {
  onRaidTrigger?: () => void;
  compact?: boolean;
}

export const GameRaidHeader: React.FC<GameRaidHeaderProps> = ({
  onRaidTrigger,
  compact = false,
}) => {
  const RAID_INTERVAL_SEC = 20 * 60; // 20 minutes (1200 seconds)
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState(0);

  // Ref guarantees the interval callback always reads the latest callback without re-instantiating or resetting the timer
  const onRaidTriggerRef = useRef(onRaidTrigger);
  useEffect(() => {
    onRaidTriggerRef.current = onRaidTrigger;
  }, [onRaidTrigger]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTotalSecondsElapsed((prev) => {
        const nextTime = prev + 1;

        // Trigger raid every 1200 seconds (20 minutes)
        if (nextTime > 0 && nextTime % RAID_INTERVAL_SEC === 0) {
          if (typeof onRaidTriggerRef.current === 'function') {
            onRaidTriggerRef.current();
          }
        }

        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [RAID_INTERVAL_SEC]);

  // Format seconds into HH:MM:SS (Match Stopwatch)
  const formatStopwatch = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format remaining time for 20-min raid countdown (MM:SS)
  const secondsUntilRaid = RAID_INTERVAL_SEC - (totalSecondsElapsed % RAID_INTERVAL_SEC);
  const raidMins = Math.floor(secondsUntilRaid / 60);
  const raidSecs = secondsUntilRaid % 60;
  const formattedCountdown = `${raidMins.toString().padStart(2, '0')}:${raidSecs.toString().padStart(2, '0')}`;

  // Progress percentage (0% to 100%)
  const progressPercent = ((RAID_INTERVAL_SEC - secondsUntilRaid) / RAID_INTERVAL_SEC) * 100;
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="w-full bg-gradient-to-r from-[#0b1022] via-[#0f172a] to-[#0b1022] border border-cyan-500/20 rounded-2xl p-3 text-white font-mono shadow-xl flex items-center justify-between gap-3 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-12 -left-12 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* 1. MATCH STOPWATCH (Count-Up) */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-slate-900/90 rounded-xl border border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] flex items-center justify-center">
          <Timer className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <div className="text-[9px] text-cyan-300/80 font-black uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            Match Stopwatch
          </div>
          <div className="text-sm sm:text-base font-black text-slate-100 tabular-nums tracking-tight drop-shadow">
            {formatStopwatch(totalSecondsElapsed)}
          </div>
        </div>
      </div>

      {/* 2. 20-MINUTE RAID COUNTDOWN & CIRCULAR PROGRESS */}
      <div className="flex items-center gap-2.5 bg-[#070c18] px-3 py-1.5 rounded-xl border border-rose-900/50 shadow-inner">
        <div className="text-right">
          <div className="text-[9px] text-rose-400 font-black uppercase tracking-wider flex items-center justify-end gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            Next IRS Raid
          </div>
          {/* Numerical Countdown Display */}
          <div className="text-sm sm:text-base font-black text-rose-400 tabular-nums drop-shadow min-w-[50px]">
            {formattedCountdown}
          </div>
        </div>

        {/* Circular SVG Progress Ring */}
        <div className="relative w-8 h-8 min-w-[32px] flex items-center justify-center flex-shrink-0">
          <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r={radius}
              stroke="#1e293b"
              strokeWidth="3.5"
              fill="transparent"
            />
            <circle
              cx="20"
              cy="20"
              r={radius}
              stroke="#f43f5e"
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-rose-500 transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(244,63,94,0.6)]"
              fill="transparent"
            />
          </svg>
          <span className="absolute text-[8px] font-black text-rose-300">
            {Math.round(progressPercent)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default GameRaidHeader;
