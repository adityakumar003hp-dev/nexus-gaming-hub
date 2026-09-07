import React, { useState } from 'react';
import {
  Trophy,
  Gamepad2,
  Swords,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  Globe,
  Sparkles,
  HelpCircle,
  Dices,
  BookOpen,
  MapPin,
  Server,
  Code,
  ShieldCheck,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface SEOFooterProps {
  onOpenWheelLobby?: () => void;
  onOpenLeaderboard: () => void;
  onOpenPuzzles?: () => void;
  onOpenStats: () => void;
  onOpenMatchmaking: () => void;
  onOpenGameHub?: () => void;
  onOpenPrivacyTerms?: (tab?: 'privacy' | 'terms' | 'appflow') => void;
  onOpenTournaments?: () => void;
  onOpenAchievements?: () => void;
  onOpenGoogleForms?: () => void;
}

export const SEOFooter: React.FC<SEOFooterProps> = ({
  onOpenWheelLobby,
  onOpenLeaderboard,
  onOpenPuzzles,
  onOpenStats,
  onOpenMatchmaking,
  onOpenGameHub,
  onOpenPrivacyTerms,
  onOpenTournaments,
  onOpenAchievements,
  onOpenGoogleForms,
}) => {
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  const faqs = [
    {
      q: 'How do I start playing games on Duo Chess?',
      a: 'Simply click "Enter Arena", "Multi-Game Hub", or select any game tile from the 20 available titles. You can play against the engine or jump into live online matchmaking instantly!',
    },
    {
      q: 'Is Duo Chess free to play with friends?',
      a: 'Yes! Duo Chess is 100% free with real-time multiplayer, global leaderboards, puzzles, wheel of luck, and cross-platform instant web play.',
    },
    {
      q: 'How does the ranking and Elo rating work?',
      a: 'Your rating starts at 1200 and adjusts in real-time based on competitive victories, draws, and tournament rankings across all supported modes.',
    },
    {
      q: 'Who is the platform owner and founder?',
      a: 'Duo Chess was founded and created by Aditya (Solo Platform Founder & Site Owner) based in Rajasthan, India, powered by Google Cloud & Firebase.',
    },
  ];

  const scrollToTop = () => {
    soundFx.playMove();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full mt-10 bg-[#050711] border-t border-slate-900 text-slate-300 py-10 px-4 md:px-8 shadow-2xl relative overflow-hidden font-sans">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-7 relative z-10 flex flex-col items-center text-center">

        {/* ================= 1. FREQUENTLY ASKED QUESTIONS (FAQ Accordion) ================= */}
        <div className="w-full bg-[#080d1e]/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-left transition">
          <button
            onClick={() => {
              soundFx.playMove();
              setIsFaqOpen(!isFaqOpen);
            }}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-sm font-bold text-amber-100 hover:text-white transition bg-[#060a17]/90 border-b border-transparent hover:border-slate-800"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full border border-amber-400/60 text-amber-400 flex items-center justify-center text-xs font-bold font-mono">
                ?
              </span>
              <span className="font-mono tracking-wide text-amber-200/90 text-sm">
                Frequently Asked Questions (FAQ)
              </span>
            </div>
            {isFaqOpen ? (
              <ChevronUp className="w-4 h-4 text-amber-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {isFaqOpen && (
            <div className="p-5 border-t border-slate-800/80 space-y-4 bg-[#050814]/95 animate-in fade-in duration-200">
              {faqs.map((f, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-xs font-bold text-amber-300 font-mono">
                    Q: {f.q}
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed pl-3 border-l-2 border-amber-500/40">
                    {f.a}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= 2. MULTI GAMING HUB METADATA CARD (Exact match to screenshot) ================= */}
        <div className="w-full bg-[#080d1e]/90 border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-2xl text-left space-y-4 relative overflow-hidden">
          
          {/* Header Title, Class 11 Developer Project Badge & Featured Platform */}
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-sky-400 tracking-wide font-sans">
              Multi Gaming Hub
            </h3>
            
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#0d1527] border border-slate-800 text-slate-300 text-xs font-mono tracking-wide">
                Class 11 Developer Project
              </span>
            </div>

            <div className="text-xs text-slate-400 font-mono pt-1">
              Featured Game Platform:{' '}
              <a
                href="https://playduochess.ai.studio.com"
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:text-sky-300 transition font-medium"
              >
                playduochess.ai.studio.com
              </a>
            </div>
          </div>

          {/* 4 Metadata Detail Cards */}
          <div className="space-y-2.5 pt-2">
            
            {/* 1. OWNER / CREATOR */}
            <div className="p-3.5 rounded-xl bg-[#050814] border border-slate-800/80 flex flex-col justify-center text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                OWNER / CREATOR
              </span>
              <span className="text-sm font-black text-white font-mono mt-0.5">
                Aditya (Solo)
              </span>
            </div>

            {/* 2. LOCATION */}
            <div className="p-3.5 rounded-xl bg-[#050814] border border-slate-800/80 flex flex-col justify-center text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                LOCATION
              </span>
              <span className="text-sm font-black text-white font-mono mt-0.5 flex items-center gap-1.5">
                <span>Rajasthan, India</span>
                <span>🇮🇳</span>
              </span>
            </div>

            {/* 3. TECH STACK */}
            <div className="p-3.5 rounded-xl bg-[#050814] border border-slate-800/80 flex flex-col justify-center text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                TECH STACK
              </span>
              <span className="text-sm font-black text-sky-400 font-mono mt-0.5">
                Python, JS, TS, HTML5, CSS, Node.js
              </span>
            </div>

            {/* 4. INFRASTRUCTURE */}
            <div className="p-3.5 rounded-xl bg-[#050814] border border-slate-800/80 flex flex-col justify-center text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                INFRASTRUCTURE
              </span>
              <span className="text-sm font-black text-emerald-400 font-mono mt-0.5 flex items-center gap-1.5">
                <span>Firebase &amp; Cloud Run</span>
              </span>
            </div>

            {/* 5. CONNECTION SECURITY NOTICE BOX */}
            <div className="p-3.5 rounded-xl bg-[#0c1833]/90 border border-sky-900/60 flex items-start sm:items-center gap-3 text-left">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-xs shrink-0 mt-0.5 sm:mt-0">
                🔒
              </div>
              <div className="text-[11px] sm:text-xs text-sky-200 font-mono leading-relaxed break-all">
                <span className="font-bold text-sky-100">Connection Security:</span> TLS 1.3 | AES_128_GCM | Key Exchange: X25519MLKEM768 | Cert: WWE1 (WR2)
              </div>
            </div>

          </div>

          {/* Support & License Sub-row */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 font-mono gap-2 border-t border-slate-800/60">
            <div>
              Support:{' '}
              <a
                href="mailto:mukkuc41@gmail.com"
                className="text-sky-400 hover:text-sky-300 transition"
              >
                mukkuc41@gmail.com
              </a>
            </div>
            <div>
              License:{' '}
              <span className="text-slate-300 font-medium">Open Source (Google Licensed)</span>
            </div>
          </div>

        </div>

        {/* ================= 3. BOTTOM COPYRIGHT & LEGAL LINKS (Exact match to screenshot) ================= */}
        <div className="w-full space-y-2 pt-2 text-center text-xs text-slate-400 font-sans">
          
          {/* Top Line: Copyright, Owner, Made in India */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-slate-400">
            <span>&copy; {new Date().getFullYear()} <strong className="text-white font-bold">Chess.pro Arena</strong>. All rights reserved.</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-white font-semibold">
              <span>👑</span>
              <span>Owner:</span>
              <strong className="text-white">Aditya</strong>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-slate-300 bg-[#0a1020] border border-slate-800 px-2 py-0.5 rounded-md font-medium text-[11px]">
              <span>🇮🇳</span>
              <span>Made in India</span>
            </span>
          </div>

          {/* Bottom Line: Legal & Tour links */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-amber-200/90 text-xs pt-1">
            <button
              onClick={() => {
                soundFx.playMove();
                const el = document.getElementById('about-us');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-amber-100 transition font-bold text-sky-400 cursor-pointer"
            >
              About Us
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => {
                soundFx.playMove();
                onOpenPrivacyTerms?.('privacy');
              }}
              className="hover:text-amber-100 transition font-medium cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => {
                soundFx.playMove();
                onOpenPrivacyTerms?.('terms');
              }}
              className="hover:text-amber-100 transition font-medium"
            >
              Terms &amp; Conditions
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => {
                soundFx.playMove();
                onOpenPrivacyTerms?.('appflow');
              }}
              className="hover:text-amber-100 transition font-medium"
            >
              App Tour (Pages 1 &amp; 2)
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => {
                soundFx.playMove();
                if (onOpenGoogleForms) onOpenGoogleForms();
              }}
              className="hover:text-emerald-300 text-emerald-400 transition font-bold"
            >
              Google Forms &amp; Polls
            </button>
            <span className="text-slate-700">•</span>
            <a
              href="mailto:mukkuc41@gmail.com"
              className="text-slate-400 hover:text-slate-200 transition font-mono text-[11px]"
            >
              Contact: mukkuc41@gmail.com
            </a>
          </div>

        </div>

      </div>

    </footer>
  );
};
