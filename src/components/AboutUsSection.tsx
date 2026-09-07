import React from 'react';
import { ShieldCheck, Zap, Globe, Smartphone, Lock, Award, Sparkles, CheckCircle2 } from 'lucide-react';

interface AboutUsSectionProps {
  onOpenWheelLobby?: () => void;
  onOpenAskGemini?: () => void;
  onOpenGameHub?: () => void;
}

export const AboutUsSection: React.FC<AboutUsSectionProps> = ({
  onOpenWheelLobby,
  onOpenAskGemini,
  onOpenGameHub,
}) => {
  return (
    <section id="about-us" className="about-section w-full">
      <div className="about-container">
        
        {/* Hero Header */}
        <div className="about-header">
          <div className="inline-flex items-center gap-1.5 mb-2">
            <span className="badge-tag">MADE IN INDIA SUITE</span>
          </div>
          <h2>About Wheel of Luck Chess Arena</h2>
          <p className="subtitle">Where Strategic Mastery Meets High-Octane Gamification</p>
        </div>

        {/* Core Platform Intro */}
        <div className="about-content">
          <p>
            <strong>Wheel of Luck Chess Arena</strong> (by <em>Chess Pro Multi-Game Arena</em>) is a next-generation strategic gaming hub engineered by <strong>Aditya</strong>. Built from the ground up to eliminate board-game fatigue, our platform seamlessly fuses classic competitive play with dynamic retention mechanics, real-time AI assistance, and high-performance visual effects.
          </p>
        </div>

        {/* System Highlights Grid */}
        <div className="about-grid">
          <div
            className="about-card group cursor-pointer"
            onClick={onOpenGameHub}
            title="Explore 20-in-1 Multi-Game Arena"
          >
            <div className="card-icon">♟️</div>
            <h3>20-in-1 Sandbox Core</h3>
            <p>From classic Chess to Draughts, Gomoku, and Ludo—play 20 strategy modules with unified progression without extra loads.</p>
          </div>

          <div className="about-card">
            <div className="card-icon">⚡</div>
            <h3>Ultra-Fast Performance</h3>
            <p>Optimized with lightweight 298KB payloads, sub-4.5s speeds, and browser caching for zero input lag across devices.</p>
          </div>

          <div
            className="about-card group cursor-pointer"
            onClick={onOpenWheelLobby}
            title="Open 25-Segment Wheel of Luck"
          >
            <div className="card-icon">🎡</div>
            <h3>25-Segment Economy</h3>
            <p>Spin the daily Wheel of Fortune to unlock cosmetic rewards, entrance tokens, multiplier cards, and custom asset packs.</p>
          </div>

          <div
            className="about-card group cursor-pointer"
            onClick={onOpenAskGemini}
            title="Open Gemini AI Strategy Coach"
          >
            <div className="card-icon">🤖</div>
            <h3>Gemini AI Integration</h3>
            <p>Elevate your strategy with real-time positional evaluations and grandmaster-level coaching powered by Google Gemini AI.</p>
          </div>
        </div>

        {/* Verified Performance Banner */}
        <div className="performance-scorecard">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h4 className="m-0">⚡ Verified Platform Metrics (100/100 Grade)</h4>
          </div>
          <p className="text-xs text-slate-400 mb-5 max-w-xl mx-auto">
            Independently verified by Google Lighthouse &amp; Website Grader for world-class web performance, security, and mobile ergonomics.
          </p>
          <div className="metrics-row">
            <div className="metric-item">
              <span className="score">30/30</span>
              <span className="label">Performance (298KB)</span>
            </div>
            <div className="metric-item">
              <span className="score">30/30</span>
              <span className="label">SEO Optimized</span>
            </div>
            <div className="metric-item">
              <span className="score">30/30</span>
              <span className="label">Mobile Ergo</span>
            </div>
            <div className="metric-item">
              <span className="score">10/10</span>
              <span className="label">SSL Security</span>
            </div>
          </div>
        </div>

        {/* Footer Ownership Stamp */}
        <div className="about-footer-stamp">
          <p>
            <strong>Platform Owner &amp; Chief Architect:</strong> Aditya
          </p>
          <p className="sub-text">
            Encrypted Communications • TLS 1.3 • Built for Desktop &amp; Mobile Browser Engines • Made in India 🇮🇳
          </p>
        </div>

      </div>
    </section>
  );
};
