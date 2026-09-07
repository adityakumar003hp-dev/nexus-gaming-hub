// src/components/MasterCrashControl.tsx
import React from 'react';
import { isSiteOwner } from '../utils/owner';

export interface MasterCrashControlProps {
  currentUser?: {
    username?: string;
    isSiteOwner?: boolean;
    isOwner?: boolean;
  } | null;
  onTriggerCrash: () => void;
  className?: string;
}

export default function MasterCrashControl({
  currentUser,
  onTriggerCrash,
  className = 'absolute top-4 right-4 z-50',
}: MasterCrashControlProps) {
  // 1. Verify if the username matches the site owner or has admin rights
  const isOwner =
    isSiteOwner(currentUser?.username) ||
    currentUser?.username === 'ADITYA-OWNER' ||
    currentUser?.isSiteOwner === true ||
    currentUser?.isOwner === true;

  // 2. Hide the master button entirely if the user is not the site owner
  if (!isOwner) {
    return null;
  }

  return (
    <div className={className}>
      {/* Shortened Master Crash Trigger Button */}
      <button
        id="btn-master-crash-trigger"
        onClick={onTriggerCrash}
        className="bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-500/60 px-2 py-1 rounded-lg text-xs font-bold shadow-xl backdrop-blur-md transition flex items-center gap-1 cursor-pointer active:scale-95 animate-fadeIn"
        title="Master Crash Trigger"
      >
        <span>👑</span> Crash
      </button>
    </div>
  );
}
