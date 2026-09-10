import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  ShieldAlert,
  Flame,
  Clock,
  Check,
  Crown,
  Users,
  Smile,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { socketService } from '../utils/socket';
import { soundFx } from '../utils/audio';
import { isSiteOwner } from '../utils/owner';

export interface GlobalChatMessage {
  id: string;
  sender: string;
  avatar?: string;
  text: string;
  timestamp: number;
  isOwner?: boolean;
  tag?: string;
  isSystem?: boolean;
}

interface GlobalChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    username?: string;
    id?: string;
    email?: string;
  } | null;
}

// Banned words & spam phrases for auto-moderation
const BANNED_PATTERNS = [
  'cheat',
  'hack',
  'botter',
  'scam',
  'freerobux',
  'spamlink',
  'badword1',
  'badword2',
  'f**k',
  'idiot',
  'stupid',
];

const COOLDOWN_MS = 3000; // 3 seconds rate limit

const INITIAL_MESSAGES: GlobalChatMessage[] = [
  {
    id: 'msg_init_1',
    sender: 'Chess_Pro',
    avatar: '👨‍🚀',
    text: 'Anyone up for a quick match?',
    timestamp: Date.now() - 120000,
    tag: 'GRANDMASTER',
  },
  {
    id: 'msg_init_2',
    sender: 'Gamer_789',
    avatar: '🥷',
    text: 'Great game everyone! 🔥',
    timestamp: Date.now() - 300000,
    tag: 'ARENA VET',
  },
  {
    id: 'msg_init_3',
    sender: 'Aditya·Owner',
    avatar: '👑',
    text: "Let's go tournament! 💪",
    timestamp: Date.now() - 600000,
    isOwner: true,
    tag: 'SITE OWNER',
  },
];

const QUICK_EMOJIS = ['🔥', '⚔️', '♟️', '👑', '⚡', '🎉', '👍', '🧠'];
const QUICK_PHRASES = [
  'Anyone up for a match?',
  'Great game everyone! 🔥',
  "Let's go tournament! 💪",
  'Good luck & have fun!',
];

export const GlobalChatDrawer: React.FC<GlobalChatDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [messages, setMessages] = useState<GlobalChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('global_chat_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_MESSAGES;
  });
  const [inputText, setInputText] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isChatLocked, setIsChatLocked] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('admin_chat_locked') === 'true';
  });

  const lastMessageTimeRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync messages to local storage
  useEffect(() => {
    try {
      localStorage.setItem('global_chat_history', JSON.stringify(messages.slice(-50)));
    } catch (e) {}
  }, [messages]);

  // Listen for admin moderation events
  useEffect(() => {
    const handleClearChat = () => {
      setMessages([
        {
          id: `gmsg_cleared_${Date.now()}`,
          sender: '🛡️ SYSTEM ADMIN',
          avatar: '⚡',
          text: '🧹 Global chat history was purged by an Administrator.',
          timestamp: Date.now(),
          isOwner: true,
          tag: 'ADMIN ACTION',
        },
      ]);
      localStorage.removeItem('global_chat_history');
      soundFx.playError();
      setModerationWarning('Global chat history has been cleared by Admin.');
      setTimeout(() => setModerationWarning(null), 4000);
    };

    const handleAdminBroadcast = (e: any) => {
      const text = e.detail?.text || e.detail?.message;
      if (!text) return;
      const broadcastMsg: GlobalChatMessage = {
        id: `gmsg_broadcast_${Date.now()}`,
        sender: '📢 GLOBAL ANNOUNCEMENT',
        avatar: '👑',
        text: String(text),
        timestamp: Date.now(),
        isOwner: true,
        tag: 'OFFICIAL BROADCAST',
      };
      setMessages((prev) => [...prev, broadcastMsg]);
      soundFx.playWin();
    };

    const handleChatLockToggle = (e: any) => {
      const locked = !!e.detail?.locked;
      setIsChatLocked(locked);
      if (locked) {
        setModerationWarning('🔒 Global chat has been locked by Administrator.');
      } else {
        setModerationWarning('🔓 Global chat unlocked.');
      }
      setTimeout(() => setModerationWarning(null), 4000);
    };

    window.addEventListener('admin_clear_global_chat', handleClearChat);
    window.addEventListener('admin_broadcast_message', handleAdminBroadcast);
    window.addEventListener('admin_chat_lock_toggled', handleChatLockToggle);

    return () => {
      window.removeEventListener('admin_clear_global_chat', handleClearChat);
      window.removeEventListener('admin_broadcast_message', handleAdminBroadcast);
      window.removeEventListener('admin_chat_lock_toggled', handleChatLockToggle);
    };
  }, []);

  // Auto-scroll to bottom on new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  // Cooldown timer ticker
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 100));
    }, 100);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  // Connect to socket and listen for global messages
  useEffect(() => {
    const socket = socketService.connect();

    socket.emit('global:join');

    const handleGlobalMessage = (msg: GlobalChatMessage) => {
      setMessages((prev) => {
        // Avoid duplicate messages
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (soundEnabled) {
        soundFx.playMove();
      }
    };

    socket.on('global:message', handleGlobalMessage);

    return () => {
      socket.off('global:message', handleGlobalMessage);
    };
  }, [soundEnabled]);

  // Sanitize message against banned words
  const sanitizeMessage = (text: string): { cleanText: string; filteredCount: number } => {
    let cleanText = text;
    let filteredCount = 0;

    BANNED_PATTERNS.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(cleanText)) {
        filteredCount++;
        cleanText = cleanText.replace(regex, '****');
      }
    });

    return { cleanText: cleanText.trim(), filteredCount };
  };

  const handleSend = (textToSend?: string) => {
    const rawText = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!rawText) return;

    const username = currentUser?.username || 'Player';
    const isOwnerUser = isSiteOwner(currentUser?.username || currentUser?.email);

    // 1. Lockdown check
    const chatLocked = localStorage.getItem('admin_chat_locked') === 'true';
    if (chatLocked && !isOwnerUser) {
      soundFx.playError();
      setModerationWarning('🔒 Global chat is currently locked down by an Administrator.');
      setTimeout(() => setModerationWarning(null), 4000);
      return;
    }

    // 2. Mute check
    const isUserMuted =
      Boolean((currentUser as any)?.isMuted) ||
      Boolean((currentUser as any)?.isChatMuted) ||
      localStorage.getItem(`user_muted_${username.toLowerCase()}`) === 'true' ||
      localStorage.getItem(`user_muted_${currentUser?.id}`) === 'true';

    if (isUserMuted && !isOwnerUser) {
      soundFx.playError();
      setModerationWarning('🔇 You are muted by an Administrator and cannot post in global chat.');
      setTimeout(() => setModerationWarning(null), 5000);
      return;
    }

    const now = Date.now();
    const timeSinceLast = now - lastMessageTimeRef.current;
    const slowmodeSeconds = Number(localStorage.getItem('admin_chat_slowmode') || 3);
    const effectiveCooldown = slowmodeSeconds * 1000;

    // 3. Rate Limiting Check
    if (timeSinceLast < effectiveCooldown && !isOwnerUser) {
      const remainingSec = Math.ceil((effectiveCooldown - timeSinceLast) / 1000);
      setCooldownRemaining(effectiveCooldown - timeSinceLast);
      setModerationWarning(`⏳ Slow-mode active: please wait ${remainingSec}s before posting.`);
      setTimeout(() => setModerationWarning(null), 3000);
      return;
    }

    // 4. Auto-Moderation Sanitize
    const filterEnabled = localStorage.getItem('admin_chat_profanity_filter') !== 'disabled';
    const { cleanText, filteredCount } = filterEnabled
      ? sanitizeMessage(rawText)
      : { cleanText: rawText, filteredCount: 0 };

    if (filteredCount > 0) {
      setModerationWarning('🛡️ Auto-moderation active: filtered flagged words.');
      setTimeout(() => setModerationWarning(null), 4000);
    }

    const newMessage: GlobalChatMessage = {
      id: `gmsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sender: username,
      avatar: isOwnerUser ? '👑' : '♟️',
      text: cleanText,
      timestamp: now,
      isOwner: isOwnerUser,
      tag: isOwnerUser ? 'SITE OWNER' : 'PLAYER',
    };

    // Update locally
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    lastMessageTimeRef.current = now;
    setCooldownRemaining(effectiveCooldown);

    if (soundEnabled) {
      soundFx.playMove();
    }

    // Emit over socket for multi-client global broadcast
    const socket = socketService.getSocket();
    if (socket && socket.connected) {
      socket.emit('global:send', newMessage);
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const elapsed = Date.now() - timestamp;
    if (elapsed < 30000) return 'Just now';
    if (elapsed < 60000) return '1m ago';
    const mins = Math.floor(elapsed / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return '1d ago';
  };

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        />
      )}

      {/* Slide-Out Drawer (Matching requested Dark Glassmorphism Specs) */}
      <div
        id="chatDrawer"
        className={`fixed top-0 right-0 w-full sm:w-[400px] h-[100dvh] bg-[#0c0d1a]/95 backdrop-blur-xl border-l border-white/10 shadow-[-10px_0_40px_rgba(0,0,0,0.8)] flex flex-col z-[1000] transition-transform duration-300 ease-in-out text-left ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ================= 1. DRAWER HEADER ================= */}
        <div className="px-5 py-4 bg-white/[0.03] border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Live pulsing glowing indicator */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00ff88] shadow-[0_0_10px_#00ff88] animate-pulse" />
              <h3 className="text-base font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <span>GLOBAL ARENA CHAT</span>
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold font-mono">
              ALL REGIONS
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound Toggle Button */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute chat sounds' : 'Enable chat sounds'}
              className="w-8 h-8 rounded-lg bg-slate-850 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition border border-slate-700"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Close Button */}
            <button
              id="closeChatBtn"
              onClick={() => {
                soundFx.playMove();
                onClose();
              }}
              className="w-8 h-8 rounded-lg bg-slate-850 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700 text-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Auto-Moderation Banner / Cooldown Alert */}
        {moderationWarning && (
          <div className="px-4 py-2 bg-amber-950/80 border-b border-amber-500/50 text-amber-200 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{moderationWarning}</span>
          </div>
        )}

        {/* ================= 2. CHAT MESSAGES FEED ================= */}
        <div
          id="chatMessagesFeed"
          className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
        >
          {/* Welcome Notice */}
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-slate-300 space-y-1">
            <div className="font-bold text-purple-300 flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Real-Time Edge Network Active</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Messages broadcast instantly across global edge nodes with automated anti-spam and profanity shield.
            </p>
          </div>

          {/* Messages Rendering */}
          {messages.map((msg) => {
            const isOwner = msg.isOwner || msg.sender.toUpperCase().includes('ADITYA');
            return (
              <div
                key={msg.id}
                className={`p-3 rounded-2xl border transition-all text-xs ${
                  isOwner
                    ? 'bg-amber-950/25 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-[#121424] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* User Avatar */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 border ${
                        isOwner
                          ? 'bg-amber-900/60 border-amber-400 text-amber-300'
                          : 'bg-purple-950/60 border-purple-500/40 text-purple-200'
                      }`}
                    >
                      {msg.avatar || (isOwner ? '👑' : '♟️')}
                    </div>

                    {/* Username & Tag */}
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`font-black text-xs truncate ${isOwner ? 'text-amber-300' : 'text-slate-200'}`}>
                        {msg.sender}
                      </span>
                      {isOwner && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[8px] font-black uppercase tracking-wider shrink-0">
                          SITE OWNER
                        </span>
                      )}
                      {!isOwner && msg.tag && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-900/60 border border-purple-500/30 text-purple-300 text-[8px] font-bold uppercase tracking-wider shrink-0 font-mono">
                          {msg.tag}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Relative Timestamp */}
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {formatRelativeTime(msg.timestamp)}
                  </span>
                </div>

                {/* Message Text */}
                <div
                  className={`text-xs leading-relaxed break-words pl-9 ${
                    isOwner ? 'text-amber-100 font-medium' : 'text-slate-200'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* ================= 3. QUICK CHIPS & EMOJIS ================= */}
        <div className="px-4 py-2 border-t border-white/[0.06] bg-black/40 space-y-2 shrink-0">
          {/* Quick Phrases */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_PHRASES.map((phrase, i) => (
              <button
                key={i}
                onClick={() => handleSend(phrase)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-purple-600/30 border border-white/10 text-slate-300 hover:text-white text-[11px] font-medium whitespace-nowrap transition"
              >
                {phrase}
              </button>
            ))}
          </div>

          {/* Quick Emojis */}
          <div className="flex items-center gap-2">
            {QUICK_EMOJIS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => handleSend(emoji)}
                className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-sm transition active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* ================= 4. CHAT INPUT AREA ================= */}
        <div className="p-4 border-t border-white/[0.08] bg-[#0a0a12]/90 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              id="chatInput"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send a global message..."
              maxLength={150}
              disabled={cooldownRemaining > 0}
              className="flex-1 bg-white/[0.06] border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-none transition disabled:opacity-60 font-sans"
            />

            <button
              id="sendChatBtn"
              type="submit"
              disabled={!inputText.trim() || cooldownRemaining > 0}
              className="send-btn px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.4)] shrink-0"
            >
              {cooldownRemaining > 0 ? (
                <span className="font-mono">{Math.ceil(cooldownRemaining / 1000)}s</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </>
              )}
            </button>
          </form>

          {/* Character counter & Safe Chat rule */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 font-mono">
            <span>🛡️ Auto-moderated live channel</span>
            <span>{inputText.length}/150</span>
          </div>
        </div>
      </div>
    </>
  );
};
