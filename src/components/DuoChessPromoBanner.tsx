import React, { useState } from 'react';
import { ShieldCheck, Zap, Globe, MessageSquare, Gift, Copy, Check, Sparkles, Send, Share2 } from 'lucide-react';
import { isSiteOwner } from '../utils/owner';
import { soundFx } from '../utils/audio';

interface DuoChessPromoBannerProps {
  onPlayNow: () => void;
  onOpenChat?: () => void;
  onOpenInvite?: () => void;
  currentUser?: {
    username?: string;
  } | null;
}

export const DuoChessPromoBanner: React.FC<DuoChessPromoBannerProps> = ({
  onPlayNow,
  onOpenChat,
  onOpenInvite,
  currentUser,
}) => {
  const [copied, setCopied] = useState(false);

  const cleanUsername = currentUser?.username ? currentUser.username.toUpperCase().replace(/[^A-Z0-9]/g, '') : 'CHESS';
  const referralCode = `${cleanUsername}-ARENA99`;
  const referralUrl = `https://playduochess.ai.studio.com/invite?code=${referralCode}`;

  const handleInvite = () => {
    soundFx.playMove();
    if (onOpenInvite) {
      onOpenInvite();
      return;
    }

    const shareData = {
      title: 'Join Duo Chess & Multi Gaming Hub!',
      text: `Play 20+ board games and arenas with me on Duo Chess! Use my referral code: ${referralCode}`,
      url: referralUrl,
    };

    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() => console.log('Successfully shared'))
        .catch((err) => {
          console.log('Share canceled or failed:', err);
          if (navigator.clipboard) {
            navigator.clipboard.writeText(referralUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          }
        });
    } else {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(referralUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  return (
    <div className="w-full">
      {/* 3-Card Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* ================= CARD 1: DUO CHESS ARENA (5 Cols) ================= */}
        <div className="lg:col-span-5 bg-[#080d1d] border border-indigo-900/50 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-indigo-600/60 transition-all duration-300 text-left">
          {/* Ambient background glow */}
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-4 relative z-10">
            {/* 3D Isometric Glowing Chessboard Visual */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center">
              {/* Isometric grid box */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-[#1b0e38] via-[#0e1633] to-[#080c1d] border-2 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center justify-center relative transform rotate-6 hover:rotate-0 transition-transform duration-300">
                {/* Board grid pattern */}
                <div className="absolute inset-2 grid grid-cols-3 grid-rows-3 gap-0.5 opacity-40 rounded-lg overflow-hidden">
                  <div className="bg-purple-400" />
                  <div className="bg-transparent" />
                  <div className="bg-purple-400" />
                  <div className="bg-transparent" />
                  <div className="bg-purple-400" />
                  <div className="bg-transparent" />
                  <div className="bg-purple-400" />
                  <div className="bg-transparent" />
                  <div className="bg-purple-400" />
                </div>
                {/* Chess Pieces with Neon Glow */}
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-4xl filter drop-shadow-[0_0_14px_rgba(216,180,254,0.9)] animate-pulse">
                    ♟️
                  </span>
                  <div className="flex gap-1 text-lg filter drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] -mt-1">
                    <span>👑</span>
                    <span>♞</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="flex-1 space-y-1">
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono">
                DUO CHESS ARENA
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Real-time. Fair play. Global community.
              </p>
            </div>
          </div>

          {/* 3 Pill Badges */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 relative z-10">
            {/* Feature 1 */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#050814] border border-slate-800/90 text-center">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-200 leading-tight">Secure &amp; Fair Play</span>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#050814] border border-slate-800/90 text-center">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-1">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-200 leading-tight">Real-time Matches</span>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#050814] border border-slate-800/90 text-center">
              <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-1">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-200 leading-tight">Connect Globally</span>
            </div>
          </div>

          {/* Enter Arena Button */}
          <div className="mt-4 relative z-10">
            <button
              id="btn-hero-enter-arena"
              data-hero-game="DUO_CHESS"
              data-game-id="chess"
              data-game-title="Duo Chess Pro"
              onClick={() => {
                soundFx.playMove();
                if (typeof (window as any).setActiveGame === 'function') {
                  (window as any).setActiveGame('DUO_CHESS');
                } else {
                  onPlayNow();
                }
              }}
              className="hero-game-btn w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(99,102,241,0.45)] transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ENTER ARENA (100 COINS)</span>
            </button>
          </div>
        </div>

        {/* ================= CARD 2: CHAT PREVIEW (4 Cols - Exact Match to Screenshot) ================= */}
        <div className="lg:col-span-4 bg-[#080d1e] border border-slate-800/90 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-purple-600/60 transition-all duration-300 text-left">
          {/* Top Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span>CHAT PREVIEW</span>
            </h3>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live</span>
            </span>
          </div>

          {/* Live Chat Messages Feed */}
          <div className="space-y-2.5 my-3.5 flex-1">
            {/* Message 1 */}
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#050814]/90 border border-slate-800/80 text-xs">
              <div className="w-8 h-8 rounded-full bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-sm shrink-0">
                👨‍🚀
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-100 text-xs truncate">Chess_Pro</span>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">2m ago</span>
                </div>
                <div className="text-xs text-slate-300 truncate mt-0.5">Anyone up for a quick match?</div>
              </div>
            </div>

            {/* Message 2 */}
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#050814]/90 border border-slate-800/80 text-xs">
              <div className="w-8 h-8 rounded-full bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-sm shrink-0">
                🥷
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-100 text-xs truncate">Gamer_789</span>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">5m ago</span>
                </div>
                <div className="text-xs text-slate-300 truncate mt-0.5 flex items-center gap-1">
                  <span>Great game everyone!</span>
                  <span>🔥</span>
                </div>
              </div>
            </div>

            {/* Message 3: Aditya-Owner */}
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/40 text-xs">
              <div className="w-8 h-8 rounded-full bg-amber-950/90 border border-amber-400 flex items-center justify-center text-sm shrink-0">
                👑
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-black text-amber-300 text-xs truncate">Aditya·Owner</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                      SITE OWNER
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">10m ago</span>
                </div>
                <div className="text-xs text-amber-100 font-medium truncate mt-0.5 flex items-center gap-1">
                  <span>Let's go tournament!</span>
                  <span>💪</span>
                </div>
              </div>
            </div>
          </div>

          {/* Open Chat Button */}
          <div className="pt-2">
            <button
              onClick={() => {
                soundFx.playMove();
                if (onOpenChat) onOpenChat();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.45)] transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>OPEN CHAT</span>
            </button>
          </div>
        </div>

        {/* ================= CARD 3: REFER & EARN (3 Cols) ================= */}
        <div className="lg:col-span-3 bg-gradient-to-br from-[#120924] via-[#090d1f] to-[#050814] border border-purple-900/50 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-purple-500/60 transition-all duration-300 text-left">
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top text */}
          <div className="space-y-1 relative z-10">
            <h3 className="text-sm font-black uppercase tracking-wider font-mono bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 bg-clip-text text-transparent">
              REFER &amp; EARN
            </h3>
            <p className="text-xs text-slate-300 font-medium leading-snug">
              Invite friends and earn big rewards!
            </p>
          </div>

          {/* 3D Wrapped Gift Box Visual with Ribbons & Confetti */}
          <div className="relative my-3 flex items-center justify-center py-2 z-10">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Confetti particles */}
              <span className="absolute -top-2 left-2 text-xs animate-bounce">✨</span>
              <span className="absolute -top-1 right-2 text-xs">🎉</span>
              <span className="absolute bottom-1 -left-2 text-xs">⭐</span>
              <span className="absolute bottom-2 -right-1 text-xs">🟡</span>

              {/* Glowing 3D Gift Box */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-700 via-purple-600 to-pink-500 p-0.5 shadow-[0_0_25px_rgba(217,70,239,0.5)] flex items-center justify-center relative transform group-hover:scale-105 transition-transform duration-300">
                {/* Yellow Ribbon bands */}
                <div className="absolute inset-x-0 h-3 bg-gradient-to-r from-amber-300 to-yellow-400 top-1/2 -translate-y-1/2 shadow-md" />
                <div className="absolute inset-y-0 w-3 bg-gradient-to-b from-amber-300 to-yellow-400 left-1/2 -translate-x-1/2 shadow-md" />
                
                {/* Bow on top */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-2xl filter drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]">
                  🎀
                </div>
                
                {/* Core Gift Icon */}
                <div className="w-full h-full rounded-2xl bg-[#130722] flex items-center justify-center">
                  <Gift className="w-8 h-8 text-amber-300" />
                </div>
              </div>
            </div>
          </div>

          {/* Invite Now Button */}
          <div className="relative z-10">
            <button
              onClick={handleInvite}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_18px_rgba(168,85,247,0.4)] transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Invite Now</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
