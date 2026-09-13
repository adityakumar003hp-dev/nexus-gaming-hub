import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, Smartphone, Mail, Globe, Lock, PlayCircle, Image as ImageIcon, ArrowRight, AlertTriangle } from 'lucide-react';
import { agreePrivacyPolicy, hasAgreedPrivacyPolicy } from '../utils/auth';

interface PrivacyTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms' | 'appflow';
  isCompulsory?: boolean;
  onAgree?: () => void;
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'privacy',
  isCompulsory = false,
  onAgree,
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'appflow'>(defaultTab);
  const [isAgreed, setIsAgreed] = useState<boolean>(!isCompulsory && hasAgreedPrivacyPolicy());

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setIsAgreed(hasAgreedPrivacyPolicy());
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const handleAgreeAndProceed = async () => {
    if (!isAgreed) {
      alert('You must read and agree to all terms and conditions and privacy policy before entering the platform.');
      return;
    }
    await agreePrivacyPolicy();
    if (onAgree) {
      onAgree();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn"
      onClick={(e) => {
        if (!isCompulsory && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-slate-950 border border-amber-500/40 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-black/90 flex flex-col text-white">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-950/40 via-slate-950 to-indigo-950/40 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
                <span>Chess.pro Legal &amp; User Agreement</span>
                {isCompulsory ? (
                  <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-400/30 px-2 py-0.5 rounded-full font-bold">
                    Mandatory Agreement Required
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-semibold">
                    Official Terms &amp; Policy
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {isCompulsory
                  ? 'Compulsory user agreement: You must accept all terms to access matches & track statistics'
                  : 'Official Privacy Policy, Terms of Service & App Architecture'}
              </p>
            </div>
          </div>
          {!isCompulsory && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Compulsory Notification Notice if needed */}
        {isCompulsory && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-5 py-2.5 flex items-center gap-2.5 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Welcome! To ensure security, privacy compliance, and accurate telemetry time tracking, please agree to the terms below to unlock your first game.
            </span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-slate-900/60 p-1.5 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'privacy'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'terms'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms &amp; Conditions</span>
          </button>
          <button
            onClick={() => setActiveTab('appflow')}
            className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'appflow'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>App Flow &amp; Tour (Pages 1 &amp; 2)</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 leading-relaxed text-slate-300 text-sm">
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-xs flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">Welcome to Chess.pro Privacy Guarantee</h3>
                  <p>
                    Welcome to Chess.pro (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are highly committed to protecting your personal information, safeguarding your privacy, and providing a secure gaming environment. If you have any questions, concerns, or feedback regarding this privacy policy or our data handling practices, please contact us at <a href="mailto:mukkuc41@gmail.com" className="text-amber-300 underline font-bold">mukkuc41@gmail.com</a>.
                  </p>
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-amber-400 font-mono">01.</span> Information We Collect
                </h3>
                <p className="text-xs text-slate-300">
                  We only collect information necessary to operate multiplayer gameplay, provide secure user accounts, and ensure fair competition:
                </p>
                <ul className="space-y-2 text-xs list-disc list-inside text-slate-300 pl-2">
                  <li>
                    <strong className="text-white">Account &amp; Authentication Data:</strong> When you register via Google Authentication or guest sign-in, we store your unique identifier, username, email address (if provided), avatar preference, and account timestamp.
                  </li>
                  <li>
                    <strong className="text-white">In-Game Communication &amp; Chat Content:</strong> We process messages exchanged in multiplayer chat rooms, live match sessions, and global broadcast drawers to maintain security, enforce fair communication, and apply real-time sensitive information filters.
                  </li>
                  <li>
                    <strong className="text-white">Gameplay &amp; Telemetry Records:</strong> Game move notations (PGN/FEN), game outcomes, Elo ratings, match durations, network latency (ping/jitter), and telemetry records are processed to evaluate anti-cheat indicators and game statistics.
                  </li>
                  <li>
                    <strong className="text-white">Virtual Inventory &amp; Currency Balances:</strong> We record your earned virtual Coins, Gems, cosmetic item unlocks (Carrom strikers, board skins, 96 FX animation states), and purchase histories.
                  </li>
                  <li>
                    <strong className="text-white">Usage and Server Log Data:</strong> Standard server logs record anonymized IP addresses, browser user-agents, timestamps, and error traces for performance monitoring and DDoS prevention.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-amber-400 font-mono">02.</span> Real-Time Chat &amp; Sensitive Data (PII) Protection
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  To protect our community against doxxing, harassment, and identity theft, Chess.pro employs a specialized client- and server-side real-time content moderation engine:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs space-y-1">
                    <span className="text-amber-400 font-bold block">📱 Phone Number Masking</span>
                    <p className="text-slate-400 text-[11px]">
                      10-digit mobile numbers and formatted phone strings are intercepted and replaced with <code className="text-amber-300 font-mono">xxxxxxxxxx</code>.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs space-y-1">
                    <span className="text-sky-400 font-bold block">📍 Street &amp; Address Privacy</span>
                    <p className="text-slate-400 text-[11px]">
                      Identified street names, residential localities, and physical address keywords are converted to <code className="text-sky-300 font-mono">[address hidden]</code>.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs space-y-1">
                    <span className="text-purple-400 font-bold block">✉️ Email Address Concealment</span>
                    <p className="text-slate-400 text-[11px]">
                      Standard email formats submitted into chat are automatically masked with <code className="text-purple-300 font-mono">[email hidden]</code> before broadcast.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 italic">
                  Note: Masked sensitive data is not harvested, sold, or shared. The sanitization occurs automatically in transit to preserve user confidentiality.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-amber-400 font-mono">03.</span> How We Use Your Information
                </h3>
                <p className="text-xs text-slate-300">
                  Information processed by Chess.pro is used strictly for legitimate gaming operations:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                    <span className="text-amber-400 font-bold block mb-1">⚙️ Matchmaking &amp; Gameplay</span>
                    Facilitate PvP matchmaking, board turn state synchronization, and Stockfish AI computational analysis.
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                    <span className="text-indigo-400 font-bold block mb-1">🛡️ Anti-Cheat &amp; Fair Play</span>
                    Analyze move timing anomalies, external engine assistance patterns, and anti-tamper telemetry to maintain authentic competition.
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                    <span className="text-emerald-400 font-bold block mb-1">💎 Economy &amp; Inventory Sync</span>
                    Persist user Coins, Gems, cosmetic item unlocks, and leaderboard achievements across devices and game sessions.
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                    <span className="text-rose-400 font-bold block mb-1">🚫 Moderation &amp; Anti-Abuse</span>
                    Enforce community chat safety rules, prevent spam flooding, and apply chat slowmodes or mutes to disruptive participants.
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-amber-400 font-mono">04.</span> Data Protection &amp; Third-Party Policy
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We enforce stringent technical controls to secure your data. Chess.pro does not sell, trade, or rent personal data to advertisers or commercial data brokers. We utilize trusted cloud infrastructure (Firebase Firestore and secure cloud servers) solely for database persistence, real-time messaging, and application delivery.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-amber-400 font-mono">05.</span> Updates to This Policy
                </h3>
                <p className="text-xs text-slate-300">
                  We reserve the right to revise this Privacy Policy periodically to reflect platform enhancements, feature updates, and legal requirements. Material updates will be highlighted in the application header or legal dialog. <strong className="text-white">Last Updated: September 2026</strong>.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 text-indigo-200 text-xs flex items-start gap-3">
                <FileText className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">Terms &amp; Conditions (Rules, Regulations &amp; Fair Play)</h3>
                  <p>
                    Please review these Terms &amp; Conditions carefully before accessing or playing on Chess.pro (the &quot;Service&quot;). By creating an account, playing as a guest, or using our multiplayer arenas, you agree to be legally bound by these terms. If you disagree with any portion of these conditions, you must immediately cease using the Service.
                  </p>
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-indigo-400 font-mono">01.</span> Intellectual Property Rights &amp; Custom Engines
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The Service, including its game logic algorithms (Stockfish integration, opening book databases, 2D Carrom physics engine, Business Empire trading rules, Backgammon pip calculators), 96 Master FX animations, piece Cry States, user interfaces, audio design, and code architecture, is the exclusive proprietary property of Chess.pro. Unauthorized copying, reverse engineering, decompilation, scraping, or commercial exploitation is strictly prohibited.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-indigo-400 font-mono">02.</span> Real-Time Chat &amp; Community Code of Conduct
                </h3>
                <p className="text-xs text-slate-300">
                  To foster a respectful and safe gaming atmosphere across in-game chat, global broadcast drawers, and player interactions, the following conduct standards apply:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-red-500/10 border border-red-400/20 rounded-xl space-y-1">
                    <strong className="text-red-300 block">🚫 Personal Sensitive Data (PII) Strict Prohibition:</strong>
                    <span className="text-slate-300">
                      Users must not broadcast, request, or share sensitive personal identifiers—including phone numbers, personal email addresses, home street addresses, financial details, or government IDs. Our automated moderation engine replaces phone numbers with <code className="text-amber-300 font-mono">xxxxxxxxxx</code>, addresses with <code className="text-sky-300 font-mono">[address hidden]</code>, and emails with <code className="text-purple-300 font-mono">[email hidden]</code>. Intentionally attempting to evade or circumvent filtering (e.g. spelling numbers out, spacing tricks, obfuscation) is a direct terms violation.
                    </span>
                  </div>
                  <div className="p-3 bg-red-500/10 border border-red-400/20 rounded-xl space-y-1">
                    <strong className="text-red-300 block">🚫 Harassment, Hate Speech &amp; Abuse:</strong>
                    <span className="text-slate-300">
                      Zero tolerance for profanity, discriminatory slurs, targeted harassment, threats of violence, impersonation of administrators, or disruptive chat spam.
                    </span>
                  </div>
                  <div className="p-3 bg-red-500/10 border border-red-400/20 rounded-xl space-y-1">
                    <strong className="text-red-300 block">🚫 Solicitations &amp; External Links:</strong>
                    <span className="text-slate-300">
                      Unsolicited advertising, marketing promotions, unauthorized third-party links, or soliciting off-platform real-money transactions are forbidden.
                    </span>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-indigo-400 font-mono">03.</span> Virtual Currency &amp; Cosmetics Policy (Coins 🪙 &amp; Gems 💎)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Chess.pro features an integrated entertainment economy powered by virtual Coins (🪙) and Gems (💎):
                </p>
                <ul className="space-y-2 text-xs list-disc list-inside text-slate-300 pl-2">
                  <li>
                    <strong className="text-white">Strictly Virtual &amp; Non-Monetary:</strong> Virtual Coins, Gems, and Points have no monetary cash value, do not accrue interest, and cannot be redeemed, sold, exchanged, or refunded for real-world currency, legal tender, or physical property under any circumstance.
                  </li>
                  <li>
                    <strong className="text-white">Cosmetic Licensing:</strong> Unlocking items in the Carrom Shop (custom strikers, boards, puck designs), the 96 FX Master Hub (particle effects, Cry States, board cosmetics), or casual dice boards grants a limited, personal, non-transferable, revocable license to utilize cosmetic assets within the software.
                  </li>
                  <li>
                    <strong className="text-white">Prohibition of Exploits &amp; Tampering:</strong> Tampering with client state storage, exploiting currency glitches, sending fraudulent balance updates, or attempting unauthorized currency creation will result in immediate forfeiture of balances and permanent account termination.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-indigo-400 font-mono">04.</span> Fair Play &amp; Anti-Cheating Regulations
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Integrity is the cornerstone of Chess.pro. Players agree to compete honorably across all game modes:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-amber-400 font-bold block mb-1">🤖 External Engine Prohibition</span>
                    Using chess engines (e.g. Stockfish, Komodo), algorithmic solver browser extensions, or third-party assistive software during live PvP matches is strictly prohibited.
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-red-400 font-bold block mb-1">⏱️ Anti-Stalling &amp; Disconnect Abuse</span>
                    Intentionally delaying moves in lost positions, abandoning active match rooms, or disconnecting to avoid rating deductions constitutes unsportsmanlike conduct resulting in loss by forfeit.
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-sky-400 font-bold block mb-1">📊 Multi-Accounting &amp; Rating Boosting</span>
                    Creating multiple accounts to artificially manipulate leaderboard rankings, farm achievements, or transfer ratings is forbidden.
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-emerald-400 font-bold block mb-1">🔍 Telemetry Anomaly Auditing</span>
                    Our platform incorporates real-time telemetry heuristics tracking move timing consistency, centipawn loss rates, and input distributions to detect artificial play.
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-indigo-400 font-mono">05.</span> Multi-Game Arena Rules
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Platform participants agree to honor the official rule sets governing our supported game arenas:
                </p>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl">
                    <strong className="text-white">♚ Chess:</strong> Standard FIDE rules, including 3-fold repetition, 50-move rule, en passant, castling privileges, and rapid clock decrement mechanics.
                  </div>
                  <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl">
                    <strong className="text-white">🎯 Carrom Board:</strong> Striker release within baseline demarcations, queen pocketing and required cover follow-through, foul penalties, and board out-of-bounds resets.
                  </div>
                  <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl">
                    <strong className="text-white">🏢 Business Empire:</strong> Board tile acquisition, rent assessment, multi-player property auctions, bankruptcy liquidation sequences, and stock exchange trading cycles.
                  </div>
                  <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl">
                    <strong className="text-white">🎲 Draughts, Backgammon, Ludo &amp; Snakes:</strong> Mandatory captures in draughts, doubling cube and bear-off in backgammon, token safe zones in ludo, and deterministic physics-seeded dice rolls.
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-indigo-400 font-mono">06.</span> Administrative Authority &amp; Emergency Lockdown
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  System administrators retain full authority to preserve platform stability, deploy security patches, implement Emergency Lockdown maintenance, mute or suspend disruptive users, clear abusive chat logs, and adjust corrupted rating records.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-indigo-400 font-mono">07.</span> Disclaimer of Warranties &amp; Limitation of Liability
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The tools, game engines, graphics, and features on Chess.pro are provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. Under no circumstances shall Chess.pro, its developers, or affiliates be liable for any direct, indirect, incidental, or consequential damages resulting from platform downtime, lost match ratings, or network latency.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-indigo-400 font-mono">08.</span> Governing Law &amp; Jurisdiction
                </h3>
                <p className="text-xs text-slate-300">
                  These Terms shall be governed, interpreted, and construed in accordance with the substantive laws of <strong className="text-white">Rajasthan, India</strong>, without regard to its conflict of law principles. Any legal disputes arising in connection with Chess.pro must be submitted to the competent courts situated in Rajasthan, India.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-indigo-400 font-mono">09.</span> Contact Us
                </h3>
                <p className="text-xs text-slate-300">
                  For questions, reports of misconduct, or inquiries regarding these Terms and Conditions or Privacy Policy, contact our legal and support team at <a href="mailto:mukkuc41@gmail.com" className="text-amber-300 underline font-bold">mukkuc41@gmail.com</a>.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'appflow' && (
            <div className="space-y-6">


              {/* Page 1: Image & Video Overview of App */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-white text-sm">Page 1: Multi-Game Visual Tour &amp; Architecture</h3>
                  </div>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded font-bold">
                    Page 1 Explanation
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  Page 1 introduces users to the expanded multi-game arenas and visual customization built into Chess.pro: Chess, Carrom Board, Business Empire, Draughts (Checkers), Backgammon, Snakes &amp; Ladders, Ludo, and the 96 FX Master Hub.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <span>♔ Master Chess, Draughts &amp; AI Engine</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Real-time Stockfish AI evaluation, opening book recognition (Ruy Lopez, Sicilian Defense), 3D piece rendering, blunder analysis, and custom board themes.
                    </p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <span>🎯 Carrom Board Arena &amp; Striker Shop</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Realistic 2D impulse physics, multi-rebound puck dynamics, queen cover mechanics, and customizable strikers, pucks, and board wood finishes.
                    </p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                      <span>🏢 Business Empire (Monopoly) Arena</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Multiplayer property trading, live bidding auctions, dynamic rent calculations, stock market exchanges, and bankruptcy liquidation.
                    </p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <span>✨ 96 FX Master Hub &amp; Piece Cry States</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      96 interactive particle visual effects, capture shockwaves, dramatic piece crying animations upon blunders, and sound synthesis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Page 2: Real-Time Chat Shield & Security Architecture */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-white text-sm">Page 2: Real-Time Chat PII Shield &amp; Security Architecture</h3>
                  </div>
                  <span className="text-[10px] bg-indigo-400/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded font-bold">
                    Page 2 Explanation
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  Page 2 details the cryptographic guest security vault, real-time WebSocket room architecture, and automated personal data protection shield.
                </p>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-indigo-300">Key Security &amp; Privacy Specifications:</h4>
                  <ul className="space-y-1.5 text-[11px] text-gray-300 list-disc list-inside">
                    <li><strong className="text-white">Real-Time PII Shield:</strong> Automated client &amp; server regex filters masking phone numbers (<code className="text-amber-300 font-mono text-[10px]">xxxxxxxxxx</code>), street addresses (<code className="text-sky-300 font-mono text-[10px]">[address hidden]</code>), and emails (<code className="text-purple-300 font-mono text-[10px]">[email hidden]</code>).</li>
                    <li><strong className="text-white">Collision-Free UUID v4:</strong> Unbounded, guaranteed unique guest sessions.</li>
                    <li><strong className="text-white">Hardware Binding:</strong> Salted SHA-256 signatures tying guest profiles to local storage vault.</li>
                    <li><strong className="text-white">Rate Limit Defense:</strong> Max 3 guest creations per 24-hour IP window against bot attacks.</li>
                    <li><strong className="text-white">Dual Currency Integrity:</strong> Cryptographic verification of virtual Coins 🪙 and Gems 💎 balances.</li>
                    <li><strong className="text-white">Emergency Lockdown Protocol:</strong> Instant admin authority to secure rooms, broadcast announcements, and preserve data integrity.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 font-semibold select-none">
            <input
              type="checkbox"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="w-4 h-4 rounded accent-amber-400 bg-white/10 border-white/20 cursor-pointer"
            />
            <span>I have read and agree to all terms &amp; conditions and privacy policy</span>
          </label>

          <button
            onClick={handleAgreeAndProceed}
            disabled={!isAgreed}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheck className="w-4 h-4 text-slate-950" />
            <span>I Agree &amp; Proceed to Main Platform &gt;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
