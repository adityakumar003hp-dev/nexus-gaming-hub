import React, { useState, useEffect } from 'react';
import {
  X,
  Gift,
  Copy,
  Check,
  Share2,
  Sparkles,
  Users,
  Award,
  Flame,
  ArrowRight,
  ShieldCheck,
  Clock,
  Coins,
  Send,
  Zap,
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface ReferAndEarnModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    username?: string;
    id?: string;
  } | null;
  userCoins?: number;
  onClaimReward?: (amount: number) => void;
}

export const ReferAndEarnModal: React.FC<ReferAndEarnModalProps> = ({
  isOpen,
  onClose,
  user,
  userCoins = 350,
  onClaimReward,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [claimedBonus, setClaimedBonus] = useState(false);

  // Generate clean referral code based on user's identity
  const cleanUsername = user?.username ? user.username.toUpperCase().replace(/[^A-Z0-9]/g, '') : 'CHESS';
  const referralCode = `${cleanUsername}-ARENA99`;
  const referralUrl = `https://playduochess.ai.studio.com/invite?code=${referralCode}`;

  const referralStats = {
    totalInvited: 14,
    pendingVerification: 2,
    rewardsEarned: 1400,
    claimablePoints: 200,
  };

  const recentReferrals = [
    { name: 'Grandmaster_Vikram', date: '2 hours ago', status: 'Completed', reward: '+100 Coins', avatar: '♟️' },
    { name: 'QueenSlayer99', date: 'Yesterday', status: 'Completed', reward: '+100 Coins', avatar: '👑' },
    { name: 'TacticsNinja', date: '2 days ago', status: 'Completed', reward: '+100 Coins', avatar: '🥷' },
    { name: 'CyberKnight_07', date: '3 days ago', status: 'Pending 1st Game', reward: 'Pending', avatar: '⚡' },
  ];

  if (!isOpen) return null;

  const handleCopyCode = () => {
    soundFx.playMove();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleCopyLink = () => {
    soundFx.playMove();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleNativeShare = () => {
    soundFx.playMove();
    const shareData = {
      title: 'Join Duo Chess & Multi Gaming Arena!',
      text: `Play 20+ multiplayer board games & chess with me on Duo Chess! Use my referral code: ${referralCode} to get 100 bonus Coins!`,
      url: referralUrl,
    };

    if (navigator.share) {
      navigator.share(shareData).catch((err) => {
        console.log('Share canceled or failed:', err);
        handleCopyLink();
      });
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    soundFx.playMove();
    const text = encodeURIComponent(
      `♟️ Hey! Join me on Duo Chess - 20+ multiplayer games, real-time matches & leaderboards!\n\nUse my referral code: *${referralCode}* to get 100 free Coins!\n👉 ${referralUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTelegramShare = () => {
    soundFx.playMove();
    const text = encodeURIComponent(
      `♟️ Play 20+ multiplayer board games with me on Duo Chess! Use code ${referralCode} for 100 free bonus Coins.`
    );
    const url = encodeURIComponent(referralUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const handleTwitterShare = () => {
    soundFx.playMove();
    const text = encodeURIComponent(
      `🎮 Join me in the arena on Duo Chess! Play 20+ games and chess in real-time. Use my referral code ${referralCode} for 100 free Coins!`
    );
    const url = encodeURIComponent(referralUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleClaim = () => {
    soundFx.playGameOver(true);
    setClaimedBonus(true);
    if (onClaimReward) {
      onClaimReward(referralStats.claimablePoints);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#090e1f] border border-purple-500/40 rounded-3xl shadow-[0_0_50px_rgba(147,51,234,0.3)] overflow-hidden my-auto text-left">
        
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(217,70,239,0.5)]">
              🎁
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <span>REFER &amp; EARN REWARDS</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black tracking-wider uppercase">
                  +100 COINS EACH
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Invite fellow gamers and unlock exclusive board themes, avatars, and coins!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playMove();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto relative z-10">
          
          {/* ================= 1. UNIQUE REFERRAL CODE & LINK CARD ================= */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#12092b] via-[#0b1029] to-[#070b1c] border border-purple-500/50 shadow-lg space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-purple-300 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>YOUR UNIQUE REFERRAL PASS</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active &amp; Verified</span>
              </span>
            </div>

            {/* Code Box & Link Box */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              
              {/* Referral Code Box */}
              <div className="sm:col-span-5 p-3 rounded-xl bg-[#050814] border border-purple-500/40 flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">REFERRAL CODE</div>
                  <div className="text-sm font-black text-amber-300 font-mono tracking-wider">{referralCode}</div>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold transition flex items-center gap-1 shrink-0"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Referral Link Box */}
              <div className="sm:col-span-7 p-3 rounded-xl bg-[#050814] border border-indigo-500/40 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">INVITE LINK</div>
                  <div className="text-xs text-indigo-300 font-mono truncate">{referralUrl}</div>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition flex items-center gap-1 shrink-0"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

            </div>

            {/* Direct Social Share Buttons */}
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono mb-2">
                INSTANT SOCIAL SHARE
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                
                {/* WhatsApp */}
                <button
                  onClick={handleWhatsAppShare}
                  className="py-2 px-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-2 group"
                >
                  <span className="text-base group-hover:scale-110 transition-transform">💬</span>
                  <span>WhatsApp</span>
                </button>

                {/* Telegram */}
                <button
                  onClick={handleTelegramShare}
                  className="py-2 px-3 rounded-xl bg-sky-950/40 border border-sky-500/40 hover:bg-sky-900/60 text-sky-300 text-xs font-bold transition flex items-center justify-center gap-2 group"
                >
                  <Send className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Telegram</span>
                </button>

                {/* Twitter / X */}
                <button
                  onClick={handleTwitterShare}
                  className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 group"
                >
                  <span className="font-mono text-sm group-hover:scale-110 transition-transform">𝕏</span>
                  <span>Twitter / X</span>
                </button>

                {/* Web Share / More */}
                <button
                  onClick={handleNativeShare}
                  className="py-2 px-3 rounded-xl bg-purple-950/40 border border-purple-500/40 hover:bg-purple-900/60 text-purple-300 text-xs font-bold transition flex items-center justify-center gap-2 group"
                >
                  <Share2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Share More</span>
                </button>

              </div>
            </div>

          </div>

          {/* ================= 2. HOW IT WORKS (3-Step Visual Guide) ================= */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>HOW IT WORKS (3 SIMPLE STEPS)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Step 1 */}
              <div className="p-3.5 rounded-2xl bg-[#060a17] border border-slate-800/90 text-left relative flex flex-col justify-between">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black flex items-center justify-center mb-2 font-mono">
                  1
                </div>
                <div>
                  <div className="text-xs font-black text-white mb-0.5">Share Your Link</div>
                  <div className="text-[11px] text-slate-400 leading-snug">
                    Send your referral link or custom code to your chess friends.
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-2xl bg-[#060a17] border border-slate-800/90 text-left relative flex flex-col justify-between">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black flex items-center justify-center mb-2 font-mono">
                  2
                </div>
                <div>
                  <div className="text-xs font-black text-white mb-0.5">Friend Plays 1 Game</div>
                  <div className="text-[11px] text-slate-400 leading-snug">
                    Your friend joins the arena and completes any single game mode.
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-2xl bg-[#060a17] border border-amber-500/40 text-left relative flex flex-col justify-between bg-gradient-to-b from-amber-950/10 to-transparent">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black flex items-center justify-center mb-2 font-mono">
                  3
                </div>
                <div>
                  <div className="text-xs font-black text-amber-300 mb-0.5 flex items-center gap-1">
                    <span>Get 100 Coins Each</span>
                    <span>🎉</span>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-snug">
                    Both of you instantly receive 100 Gamer Points &amp; Coins!
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ================= 3. REWARD TRACKER & STATS ================= */}
          <div className="p-4 rounded-2xl bg-[#070c1d] border border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>YOUR REFERRAL STATS &amp; REWARDS</span>
              </h3>
              {referralStats.claimablePoints > 0 && !claimedBonus && (
                <button
                  onClick={handleClaim}
                  className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-[11px] font-black uppercase tracking-wider transition shadow-[0_0_12px_rgba(245,158,11,0.5)] flex items-center gap-1 active:scale-95"
                >
                  <Sparkles className="w-3 h-3 text-slate-950" />
                  <span>Claim +200 Coins</span>
                </button>
              )}
              {claimedBonus && (
                <span className="text-emerald-400 text-xs font-bold font-mono flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Claimed!
                </span>
              )}
            </div>

            {/* 3 Metric Badges */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-[#050814] border border-slate-800/80 text-center">
                <div className="text-lg sm:text-xl font-black text-white font-mono">
                  {referralStats.totalInvited}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Friends Invited
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#050814] border border-slate-800/80 text-center">
                <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                  {referralStats.pendingVerification}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Pending Verification
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#050814] border border-slate-800/80 text-center">
                <div className="text-lg sm:text-xl font-black text-amber-300 font-mono">
                  🟡 {referralStats.rewardsEarned.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Total Coins Earned
                </div>
              </div>
            </div>

            {/* Recent Referral History */}
            <div className="space-y-2 pt-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                RECENT REFERRAL ACTIVITY
              </div>
              <div className="space-y-1.5">
                {recentReferrals.map((r, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-[#050814]/70 border border-slate-850 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm">{r.avatar}</span>
                      <div>
                        <div className="font-bold text-slate-200 text-[11px]">{r.name}</div>
                        <div className="text-[9px] text-slate-500">{r.date}</div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className={`text-[10px] font-bold ${r.status === 'Completed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {r.reward}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#050814] flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instant anti-fraud &amp; automatic reward verification</span>
          </div>
          <button
            onClick={() => {
              soundFx.playMove();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
