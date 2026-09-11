import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Scan,
  X,
  Send,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Layers,
  Search,
  Maximize2,
  Minimize2,
  RefreshCw,
  Lightbulb,
  ExternalLink,
  Lock,
  Compass,
  MessageSquare,
  Flame,
  CheckCircle2,
  Info,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { soundFx } from '../utils/audio';

export interface InspectedElementData {
  elementId: string;
  tagName: string;
  elementText: string;
  ariaLabel: string;
  role: string;
  sectionContext: string;
  cssClasses: string;
  isAdminContext: boolean;
}

export interface ElementInsight {
  title: string;
  role: string;
  purpose: string;
  actionExplanation: string;
  hintsAndTips: string[];
  safeAdminHint?: string;
  isGuarded: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isGuarded?: boolean;
}

// Preset elements representing the core architectural components of DUO CHESS
const PRESET_ELEMENT_CATALOG = [
  {
    category: 'Header & Identity',
    elements: [
      {
        name: 'Player Display Handle',
        selector: '#player-handle-badge',
        section: 'GameHeader',
        description: 'Shows your permanent username or uppercase GUEST_XXXXXXXX handle.',
        role: 'Identity Badge',
      },
      {
        name: 'Coin & Gem Balances',
        selector: '#currency-balances',
        section: 'GameHeader / Economy',
        description: 'Displays current Coins and Gems used for match entry fees and shop cosmetics.',
        role: 'Wallet Indicator',
      },
      {
        name: 'PRO Status Tier Tag',
        selector: '#pro-tier-tag',
        section: 'GameHeader',
        description: 'Denotes competitive ranked standing and priority match queuing.',
        role: 'Status Badge',
      },
      {
        name: 'Audio Soundpack Selector',
        selector: '#audio-toggle-btn',
        section: 'GameHeader',
        description: 'Toggles between Master, Synthwave, Retro 8-Bit, and Grandmaster soundpacks.',
        role: 'Audio Control',
      },
    ],
  },
  {
    category: 'Matchmaking & Stakes',
    elements: [
      {
        name: 'Game Entry Fee Modal',
        selector: '#game-entry-modal',
        section: 'GameEntryModal',
        description: 'Dynamic match staking modal where players choose Coins or Gems entry fees.',
        role: 'Modal / Stake Selector',
      },
      {
        name: 'Quick Play / AI Match Mode',
        selector: '#choose-mode-panel',
        section: 'ChooseModePanel',
        description: 'Choose between Real-Time Multiplayer, Play vs AI Bot, or Pass & Play.',
        role: 'Mode Switcher',
      },
      {
        name: 'AI Difficulty Selector',
        selector: '#ai-difficulty-selector',
        section: 'AIDifficultySelector',
        description: 'Tune the chess AI from Novice (800 ELO) to Grandmaster (2600 ELO).',
        role: 'Difficulty Config',
      },
    ],
  },
  {
    category: 'Arena & Multi-Game Catalog',
    elements: [
      {
        name: 'DUO CHESS Board Canvas',
        selector: '#chess-board-arena',
        section: 'ChessBoard',
        description: 'Interactive high-definition board supporting legal move highlights and sound effects.',
        role: 'Interactive Board',
      },
      {
        name: '20 Classic Arcade Games Hub',
        selector: '#wheel-of-luck-catalog',
        section: 'WheelOfLuckMainCatalog',
        description: 'Catalog of 20 classic games (Ludo, Battleship, Uno, Checkers, Carrom, etc.).',
        role: 'Game Browser',
      },
      {
        name: 'Tactical Evaluation Bar',
        selector: '#eval-bar-meter',
        section: 'EvalBar',
        description: 'Visual indicator of real-time material and positional balance.',
        role: 'Telemetry Gauge',
      },
    ],
  },
  {
    category: 'Telemetry & Social',
    elements: [
      {
        name: 'All Menu Active Users Sidebar',
        selector: '#active-users-sidebar',
        section: 'GlobalUserListSidebar',
        description: 'Real-time roster showing active players, match status, and country flags.',
        role: 'Presence Drawer',
      },
      {
        name: 'Global Telemetry Suite',
        selector: '#floating-suite-menu',
        section: 'FloatingSuiteAndTelemetryMenu',
        description: 'Floating suite tracking system ping, concurrency analytics, and cloud backups.',
        role: 'Floating Suite',
      },
      {
        name: 'Global Chat Drawer',
        selector: '#global-chat-drawer',
        section: 'GlobalChatDrawer',
        description: 'Lobby chat channel for public banter, spectator commentary, and match invites.',
        role: 'Communication Drawer',
      },
    ],
  },
  {
    category: 'Administration & Security',
    elements: [
      {
        name: 'Admin Panel & Fee Controls',
        selector: '#admin-panel-modal',
        section: 'AdminPanelModal',
        description: 'Platform management hub for dynamic fee balancing and server telemetry.',
        role: 'Restricted Administration',
        isAdminContext: true,
      },
      {
        name: 'Dual-Layer Token Engine',
        selector: '#auth-security-layer',
        section: 'Security & Auth',
        description: 'Cryptographic session protection ensuring guest and permanent session safety.',
        role: 'Security Subsystem',
        isAdminContext: true,
      },
    ],
  },
];

export const AIElementBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'inspect' | 'chat' | 'catalog'>('inspect');
  const [isInspectorActive, setIsInspectorActive] = useState(false);
  const [inspectedElement, setInspectedElement] = useState<InspectedElementData | null>(null);
  const [elementInsight, setElementInsight] = useState<ElementInsight | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `👋 **Greetings! I am the NEXUS AI Element Bot.**\n\nI can inspect **any element** across the entire website and explain its purpose, function, and gameplay tips!\n\n🛡️ *Security Note: Platform authentication methods and confidential admin credentials are strictly protected. For admin elements, I provide insightful architectural hints and tips!*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Search in catalog
  const [catalogSearch, setCatalogSearch] = useState('');

  // Live Inspector Overlays
  const hoverOverlayRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Inspect Element API call
  const analyzeElementWithAI = async (elementData: InspectedElementData) => {
    setIsLoadingInsight(true);
    setInspectedElement(elementData);

    try {
      const res = await fetch('/api/ai/inspect-element', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(elementData),
      });

      if (!res.ok) throw new Error('Failed to analyze element');
      const data = await res.json();
      if (data && data.insight) {
        setElementInsight(data.insight);
      }
    } catch (err) {
      console.warn('AI inspection error fallback:', err);
      // Fallback display
      setElementInsight({
        title: elementData.elementText ? `"${elementData.elementText.slice(0, 30)}"` : 'Interactive Element',
        role: elementData.role || elementData.tagName || 'User Interface Control',
        purpose: `Operates inside the ${elementData.sectionContext || 'DUO CHESS Interface'}.`,
        actionExplanation: 'Clicking triggers matching actions or updates application state.',
        hintsAndTips: [
          'Tip: Use the AI Element Bot anytime to inspect buttons, meters, and modals.',
          'Navigation: Elements synchronize real-time match and telemetry data.',
        ],
        safeAdminHint: elementData.isAdminContext
          ? 'Platform Hint: Administration fee updates synchronize immediately with all player game entry modals.'
          : undefined,
        isGuarded: elementData.isAdminContext,
      });
    } finally {
      setIsLoadingInsight(false);
    }
  };

  // Turn on/off global DOM element inspector
  useEffect(() => {
    if (!isInspectorActive) {
      if (hoverOverlayRef.current) hoverOverlayRef.current.style.display = 'none';
      if (tooltipRef.current) tooltipRef.current.style.display = 'none';
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (!target || target.closest('#nexus-ai-bot-container') || target.closest('#inspector-hud-banner')) {
        if (hoverOverlayRef.current) hoverOverlayRef.current.style.display = 'none';
        if (tooltipRef.current) tooltipRef.current.style.display = 'none';
        return;
      }

      const rect = target.getBoundingClientRect();
      if (hoverOverlayRef.current) {
        hoverOverlayRef.current.style.display = 'block';
        hoverOverlayRef.current.style.top = `${rect.top + window.scrollY}px`;
        hoverOverlayRef.current.style.left = `${rect.left + window.scrollX}px`;
        hoverOverlayRef.current.style.width = `${rect.width}px`;
        hoverOverlayRef.current.style.height = `${rect.height}px`;
      }

      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'block';
        const tooltipX = Math.min(window.innerWidth - 220, Math.max(10, e.clientX + 14));
        const tooltipY = Math.max(10, e.clientY - 36);
        tooltipRef.current.style.top = `${tooltipY + window.scrollY}px`;
        tooltipRef.current.style.left = `${tooltipX + window.scrollX}px`;

        const tag = target.tagName.toLowerCase();
        const id = target.id ? `#${target.id}` : '';
        const preview = (target.getAttribute('aria-label') || target.innerText || '').trim().slice(0, 24);
        tooltipRef.current.innerText = `<${tag}${id}> ${preview ? `"${preview}"` : ''}`;
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (!target || target.closest('#nexus-ai-bot-container') || target.closest('#inspector-hud-banner')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      try {
        soundFx.playMove();
      } catch {}

      // Identify context
      const sectionParent =
        target.closest('[data-section]')?.getAttribute('data-section') ||
        target.closest('header')?.tagName ||
        target.closest('nav')?.tagName ||
        target.closest('[role="dialog"]')?.getAttribute('aria-label') ||
        target.closest('main')?.tagName ||
        'DUO CHESS Arena';

      const isInsideAdmin = Boolean(
        target.closest('#admin-panel-modal') ||
          target.closest('[data-admin="true"]') ||
          /admin|operator/i.test(target.className + ' ' + target.id)
      );

      const capturedData: InspectedElementData = {
        elementId: target.id || '',
        tagName: target.tagName,
        elementText: (target.innerText || target.getAttribute('title') || '').trim().slice(0, 150),
        ariaLabel: target.getAttribute('aria-label') || '',
        role: target.getAttribute('role') || target.tagName.toLowerCase(),
        sectionContext: sectionParent,
        cssClasses: target.className ? String(target.className).slice(0, 100) : '',
        isAdminContext: isInsideAdmin,
      };

      setIsInspectorActive(false);
      setIsOpen(true);
      setActiveTab('inspect');
      analyzeElementWithAI(capturedData);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsInspectorActive(false);
        setIsOpen(true);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isInspectorActive]);

  // Send message to AI Bot
  const handleSendMessage = async (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim() || isSendingChat) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsSendingChat(true);

    try {
      const res = await fetch('/api/ai/bot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.reply || 'I am ready to help you explore any part of DUO CHESS.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isGuarded: data.isGuarded,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.warn('Bot chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: '🤖 **NEXUS AI Bot**: I can tell you about any feature on this platform! You can click **Inspect Any Element** to test any button or modal live.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const filteredCatalog = PRESET_ELEMENT_CATALOG.map((group) => ({
    ...group,
    elements: group.elements.filter(
      (el) =>
        el.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        el.description.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        el.section.toLowerCase().includes(catalogSearch.toLowerCase())
    ),
  })).filter((group) => group.elements.length > 0);

  return (
    <>
      {/* Visual Live Hover Highlight Box */}
      <div
        ref={hoverOverlayRef}
        className="fixed pointer-events-none z-[99998] border-2 border-cyan-400 bg-cyan-400/10 rounded-md transition-all duration-75 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
        style={{ display: 'none' }}
      />

      {/* Floating Hover Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed pointer-events-none z-[99999] bg-slate-900/95 border border-cyan-500/60 text-cyan-300 text-xs font-mono px-2.5 py-1 rounded shadow-xl whitespace-nowrap backdrop-blur-md"
        style={{ display: 'none' }}
      />

      {/* Full-Screen Inspector Banner when Inspector is active */}
      {isInspectorActive && (
        <div
          id="inspector-hud-banner"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[99999] bg-slate-950/95 border border-cyan-500/80 px-5 py-2.5 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center gap-4 text-white animate-bounce backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <span className="text-sm font-black tracking-wide text-cyan-300">
              TARGET SCANNER ACTIVE
            </span>
          </div>
          <span className="text-xs text-slate-300 hidden sm:inline">
            Hover &amp; click any element on screen to inspect
          </span>
          <button
            onClick={() => {
              setIsInspectorActive(false);
              setIsOpen(true);
            }}
            className="text-xs px-2.5 py-1 bg-red-600/80 hover:bg-red-500 text-white rounded font-bold transition-colors"
          >
            Cancel (Esc)
          </button>
        </div>
      )}

      {/* Persistent Floating Bot Trigger Widget */}
      {!isInspectorActive && (
        <div id="nexus-ai-bot-container" className="fixed bottom-6 left-6 z-[9990] flex items-center">
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              try {
                soundFx.playMove();
              } catch {}
            }}
            id="nexus-ai-bot-launcher"
            className="group relative flex items-center gap-2.5 bg-gradient-to-r from-indigo-950/90 via-slate-900/90 to-cyan-950/90 hover:from-indigo-900 hover:to-cyan-900 border border-cyan-500/50 hover:border-cyan-400 text-white px-3.5 py-2.5 rounded-2xl shadow-[0_8px_25px_-5px_rgba(6,182,212,0.4)] backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95"
            title="Open AI Element Inspector & Site Guide"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-inner">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wider text-cyan-300">AI BOT</span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
              <span className="text-[10px] text-slate-400 block font-medium">Element Guide</span>
            </div>
          </button>
        </div>
      )}

      {/* Main AI Bot Window Modal */}
      {isOpen && !isInspectorActive && (
        <div className="fixed bottom-20 left-6 z-[9999] w-[92vw] sm:w-[460px] h-[580px] max-h-[82vh] bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.2)] backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border-b border-cyan-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">NEXUS AI BOT</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold">
                    GEMINI 3.8
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Universal Website Element Inspector &amp; Guide</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsInspectorActive(true);
                  setIsOpen(false);
                }}
                className="p-1.5 hover:bg-cyan-950/60 rounded-lg text-cyan-400 hover:text-cyan-200 transition-colors"
                title="Activate Screen Crosshair Scanner"
              >
                <Scan className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Close Window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800/80 bg-slate-900/50 px-2 pt-2 gap-1 text-xs">
            <button
              onClick={() => setActiveTab('inspect')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold transition-all border-b-2 ${
                activeTab === 'inspect'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-950/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Inspector</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold transition-all border-b-2 ${
                activeTab === 'chat'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-950/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask AI Bot</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-bold transition-all border-b-2 ${
                activeTab === 'catalog'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-950/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Catalog</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-200">
            {/* TAB 1: INSPECTOR */}
            {activeTab === 'inspect' && (
              <div className="space-y-4">
                {/* Scanner Trigger Banner */}
                <div className="p-3.5 bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900 border border-cyan-500/30 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Scan className="w-3.5 h-3.5 text-cyan-400" />
                      Live Element Scanner
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Point and click any button, card, or element on the page.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsInspectorActive(true);
                      setIsOpen(false);
                    }}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-black tracking-wide shadow-md transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                  >
                    Inspect Element
                  </button>
                </div>

                {/* Analysis Display */}
                {isLoadingInsight ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-cyan-300 font-mono font-medium animate-pulse">
                      Analyzing element structure with Gemini AI...
                    </p>
                  </div>
                ) : inspectedElement && elementInsight ? (
                  <div className="space-y-3">
                    {/* Element Identity Pill */}
                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-bold">
                          &lt;{inspectedElement.tagName.toLowerCase()}&gt;
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {inspectedElement.sectionContext}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        {elementInsight.title}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {elementInsight.purpose}
                      </p>
                    </div>

                    {/* How It Works */}
                    <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> How It Works
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {elementInsight.actionExplanation}
                      </p>
                    </div>

                    {/* Hints and Tips */}
                    {elementInsight.hintsAndTips?.length > 0 && (
                      <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Tips &amp; Insights
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {elementInsight.hintsAndTips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold mt-0.5">•</span>
                              <div className="markdown-body">
                                <Markdown>{tip}</Markdown>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Admin Safety Notice & Conceptual Hint */}
                    {elementInsight.isGuarded && (
                      <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Admin Guardrail: Credentials &amp; Auth Hidden</span>
                        </div>
                        <p className="text-[11px] text-amber-200/90 leading-relaxed">
                          {elementInsight.safeAdminHint ||
                            'Platform Hint: System entry fees are dynamically balanced between 50-500 Coins and 5-50 Gems to maintain an active competition pool.'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-3 bg-slate-900/30 border border-dashed border-slate-800 rounded-xl p-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800/80 text-cyan-400 flex items-center justify-center mx-auto">
                      <Scan className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">No Element Inspected Yet</h4>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                        Click **Inspect Element** above or pick an element from the **Catalog** tab to reveal its inner workings and strategies.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CHAT WITH AI BOT */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full space-y-3">
                {/* Chat History */}
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'bot' && (
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-1">
                          <Bot className="w-3 h-3" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                          msg.sender === 'user'
                            ? 'bg-cyan-600 text-white font-medium rounded-br-none'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
                        }`}
                      >
                        <div className="markdown-body prose prose-invert max-w-none text-xs leading-relaxed">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className="text-[9px] text-slate-400 font-mono">{msg.timestamp}</span>
                          {msg.isGuarded && (
                            <span className="text-[9px] text-amber-400 font-bold flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5" /> Guarded
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isSendingChat && (
                    <div className="flex gap-2.5 justify-start">
                      <div className="w-6 h-6 rounded-lg bg-cyan-600 flex items-center justify-center text-white shrink-0">
                        <Bot className="w-3 h-3 animate-spin" />
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-400 animate-pulse">
                        Thinking with Gemini AI...
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Quick Query Chips */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-medium block mb-1.5">
                    Quick Inquiries:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Explain the Game Fee Economy',
                      'Hint about Admin Panel data',
                      'What do Coins and Gems do?',
                      'How do 20 Arcade Games work?',
                      'What is the Global Active Users sidebar?',
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(chip)}
                        className="text-[10px] bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 px-2 py-1 rounded-full transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CATALOG */}
            {activeTab === 'catalog' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search any button, modal, or element..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                {/* Categories */}
                <div className="space-y-4">
                  {filteredCatalog.map((cat, cIdx) => (
                    <div key={cIdx} className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block">
                        {cat.category}
                      </span>
                      <div className="space-y-1.5">
                        {cat.elements.map((elem, eIdx) => (
                          <div
                            key={eIdx}
                            onClick={() => {
                              setActiveTab('inspect');
                              analyzeElementWithAI({
                                elementId: elem.selector.replace('#', ''),
                                tagName: 'DIV',
                                elementText: elem.name,
                                ariaLabel: elem.description,
                                role: elem.role,
                                sectionContext: elem.section,
                                cssClasses: '',
                                isAdminContext: !!(elem as any).isAdminContext,
                              });
                            }}
                            className="p-2.5 bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/50 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h5 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                                  {elem.name}
                                </h5>
                                {(elem as any).isAdminContext && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 border border-amber-600/40 text-amber-400 font-bold">
                                    Guarded
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                {elem.description}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Input Bar (for Chat mode) */}
          {activeTab === 'chat' && (
            <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about any element or feature..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputQuery.trim() || isSendingChat}
                className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-md active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};
