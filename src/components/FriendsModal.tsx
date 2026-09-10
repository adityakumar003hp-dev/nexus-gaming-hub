import React, { useState } from 'react';
import { X, Users, UserPlus, Swords, CheckCircle2, Search, Circle, Trophy, MessageSquare, Trash2, Play, Flame, Shield } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { ActiveBoardGame } from '../types';

export interface FriendUser {
  id: string;
  username: string;
  status: 'Online' | 'In Match' | 'Offline';
  currentMatchGame?: string;
  elo: number;
  avatarSeed: string;
  isOwner?: boolean;
}

const DEFAULT_FRIENDS: FriendUser[] = [
  { id: 'f_alex', username: 'AlexGrandmaster', status: 'Online', elo: 1840, avatarSeed: 'Alex' },
  { id: 'f_sophia', username: 'Sophia_Tactics', status: 'In Match', currentMatchGame: 'Ludo Pro', elo: 1620, avatarSeed: 'Sophia' },
  { id: 'f_vikram', username: 'Vikram_Knight', status: 'Online', elo: 1950, avatarSeed: 'Vikram' },
  { id: 'f_chloe', username: 'ChloeCheckmate', status: 'Offline', elo: 1490, avatarSeed: 'Chloe' },
];

const AVAILABLE_GAMES: { id: ActiveBoardGame; name: string }[] = [
  { id: 'chess', name: 'Chess Pro' },
  { id: 'ludo', name: 'Ludo Arena' },
  { id: 'connect4', name: 'Connect Four' },
  { id: 'checkers', name: 'Checkers' },
  { id: 'uno', name: 'Uno Card Clash' },
  { id: 'battleship', name: 'Battleship' },
  { id: 'carrom', name: 'Carrom Blitz' },
];

export interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame?: (game: ActiveBoardGame) => void;
  onChallengeFriend?: (friend: FriendUser, game: ActiveBoardGame) => void;
  onNotification?: (text: string, type?: 'success' | 'warning' | 'error') => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
  onChallengeFriend,
  onNotification,
}) => {
  const [friends, setFriends] = useState<FriendUser[]>(() => {
    try {
      const raw = localStorage.getItem('user_friends_list');
      return raw ? JSON.parse(raw) : DEFAULT_FRIENDS;
    } catch {
      return DEFAULT_FRIENDS;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [newFriendInput, setNewFriendInput] = useState('');
  const [challengingFriend, setChallengingFriend] = useState<FriendUser | null>(null);
  const [selectedGame, setSelectedGame] = useState<ActiveBoardGame>('chess');
  const [selectedStake, setSelectedStake] = useState<string>('Free');

  if (!isOpen) return null;

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFriendInput.trim();
    if (!clean) return;
    if (friends.some((f) => f.username.toLowerCase() === clean.toLowerCase())) {
      if (onNotification) onNotification(`"${clean}" is already in your friends list!`, 'warning');
      return;
    }

    const newFriend: FriendUser = {
      id: `f_${Date.now()}`,
      username: clean,
      status: 'Online',
      elo: 1500 + Math.floor(Math.random() * 300),
      avatarSeed: clean,
    };

    const updated = [newFriend, ...friends];
    setFriends(updated);
    localStorage.setItem('user_friends_list', JSON.stringify(updated));
    setNewFriendInput('');
    soundFx.playMove();
    if (onNotification) onNotification(`Added "${clean}" to friends!`, 'success');
  };

  const handleRemoveFriend = (id: string, username: string) => {
    const updated = friends.filter((f) => f.id !== id);
    setFriends(updated);
    localStorage.setItem('user_friends_list', JSON.stringify(updated));
    soundFx.playError();
    if (onNotification) onNotification(`Removed ${username} from friends list.`, 'warning');
  };

  const handleSendChallenge = () => {
    if (!challengingFriend) return;
    soundFx.playWin();
    if (onNotification) {
      onNotification(
        `⚔️ Direct 1v1 Challenge sent to @${challengingFriend.username} in ${selectedGame.toUpperCase()} (${selectedStake} Stakes)!`,
        'success'
      );
    }
    if (onChallengeFriend) {
      onChallengeFriend(challengingFriend, selectedGame);
    } else if (onStartGame) {
      onStartGame(selectedGame);
    }
    setChallengingFriend(null);
    onClose();
  };

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-[#0b0f19] border border-sky-500/30 rounded-3xl shadow-[0_0_60px_rgba(14,165,233,0.2)] overflow-hidden text-slate-100 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#080c14]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.3)]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <span>Friends & Direct 1v1 Challenges</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  {friends.filter((f) => f.status === 'Online').length} ONLINE
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Connect with rivals, challenge friends to matches, and track online presence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Add friend & search bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono"
              />
            </div>

            {/* Add */}
            <form onSubmit={handleAddFriend} className="flex gap-2">
              <input
                type="text"
                value={newFriendInput}
                onChange={(e) => setNewFriendInput(e.target.value)}
                placeholder="Username to add..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase font-mono tracking-wider transition shrink-0 active:scale-95"
              >
                Add
              </button>
            </form>
          </div>

          {/* Friends List */}
          <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
            {filteredFriends.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-mono">
                No friends found matching your search.
              </div>
            ) : (
              filteredFriends.map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white font-bold text-sm shadow">
                      {f.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white font-mono">{f.username}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          ⚡ {f.elo} Elo
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs mt-0.5">
                        <Circle
                          className={`w-2 h-2 fill-current ${
                            f.status === 'Online'
                              ? 'text-emerald-400'
                              : f.status === 'In Match'
                              ? 'text-amber-400'
                              : 'text-slate-500'
                          }`}
                        />
                        <span className="text-slate-400 text-[11px] font-mono">
                          {f.status === 'In Match' ? `In Match: ${f.currentMatchGame}` : f.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChallengingFriend(f)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase font-mono tracking-wider transition active:scale-95 flex items-center gap-1.5 shadow"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Challenge</span>
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(f.id, f.username)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Remove friend"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Challenge Dialogue Popover */}
          {challengingFriend && (
            <div className="p-4 rounded-2xl bg-[#070b14] border border-amber-500/50 space-y-4 animate-scale-up">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-amber-400 font-mono flex items-center gap-2">
                  <Swords className="w-4 h-4" />
                  <span>Configure 1v1 Match vs @{challengingFriend.username}</span>
                </h3>
                <button
                  onClick={() => setChallengingFriend(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 font-mono">
                    Select Game
                  </label>
                  <select
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value as ActiveBoardGame)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  >
                    {AVAILABLE_GAMES.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 font-mono">
                    Entry Stakes
                  </label>
                  <select
                    value={selectedStake}
                    onChange={(e) => setSelectedStake(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  >
                    <option value="Free">Casual (No Stakes)</option>
                    <option value="100 Coins">🪙 100 Coins Stake</option>
                    <option value="500 Coins">🪙 500 Coins Stake</option>
                    <option value="2,000 Coins">🪙 2,000 High Roller</option>
                    <option value="10 Gems">💎 10 Gems Stake</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSendChallenge}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase font-mono tracking-wider shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Launch 1v1 Room Challenge Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#080c14] flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Friends receive sound alerts and push challenges upon receiving an invitation.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase tracking-wider transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
