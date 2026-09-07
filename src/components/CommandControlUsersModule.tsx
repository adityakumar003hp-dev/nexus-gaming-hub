import React, { useEffect, useRef, useState } from 'react';
import { db, subscribeToActiveGame, switchActiveGame, revokeUserSession, adminUpdateUser, type ActiveGamePlatformState } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';

// 1. Save new permanent user record upon registration
export async function createPermanentUserAccount(userAuth: {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  role?: string;
  gems?: number;
  coins?: number;
}) {
  try {
    const userRef = doc(db, 'users', userAuth.uid);
    const isOwner = (userAuth.displayName || userAuth.email || '').toLowerCase().includes('aditya') ||
                    (userAuth.displayName || '').toLowerCase().includes('owner');

    await setDoc(userRef, {
      uid: userAuth.uid,
      username: userAuth.displayName || userAuth.email?.split('@')[0] || 'Player',
      email: userAuth.email || '',
      accountType: 'PERMANENT',
      role: isOwner ? 'SITE OWNER' : (userAuth.role || 'USER'),
      gems: userAuth.gems ?? (isOwner ? 999999 : 100),
      coins: userAuth.coins ?? (isOwner ? 9999999 : 1000),
      isBanned: false,
      banReason: '',
      isMuted: false,
      sessionRevokedAt: null,
      createdAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Notice: createPermanentUserAccount deferred or offline:', err);
  }
}

// 2. Render User Profile Management Card into #adminUserPanel
export function renderProfileCard(userId: string, userData: any) {
  const panel = document.getElementById('adminUserPanel');
  if (!panel) return;

  const currentRole = userData.role || 'USER';
  const gemsCount = typeof userData.gems === 'number' ? userData.gems : 0;
  const coinsCount = typeof userData.coins === 'number' ? userData.coins : 0;
  const username = userData.username || 'User';
  const isBanned = !!userData.isBanned;
  const isMuted = !!userData.isMuted;

  panel.innerHTML = `
    <div style="background:#12121a; border:1px solid #222230; border-radius:10px; padding:18px; margin-top:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h3 style="margin:0; font-family:monospace; color:#fff; font-size:16px;">User: ${username}</h3>
          <span style="font-size:11px; color:#888;">ID: ${userId}</span>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          ${isBanned ? '<span style="background:#ef4444; color:#fff; font-weight:bold; padding:2px 7px; border-radius:4px; font-size:10px;">BANNED</span>' : ''}
          ${isMuted ? '<span style="background:#f97316; color:#fff; font-weight:bold; padding:2px 7px; border-radius:4px; font-size:10px;">MUTED</span>' : ''}
          <span style="background:#ff8c00; color:#000; font-weight:bold; padding:3px 8px; border-radius:4px; font-size:11px;">${currentRole}</span>
        </div>
      </div>

      <div style="margin-top:15px;">
        <label style="font-size:10px; color:#aaa; font-weight:bold;">ROLE</label>
        <select id="roleSelect" style="width:100%; padding:8px; background:#1a1a24; border:1px solid #333; color:#fff; border-radius:4px; margin-top:4px; outline:none; font-family:sans-serif;">
          <option value="SITE OWNER" ${currentRole === 'SITE OWNER' ? 'selected' : ''}>SITE OWNER</option>
          <option value="ADMIN" ${currentRole === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
          <option value="MODERATOR" ${currentRole === 'MODERATOR' ? 'selected' : ''}>MODERATOR</option>
          <option value="USER" ${currentRole === 'USER' ? 'selected' : ''}>USER</option>
        </select>
      </div>

      <div style="margin-top:12px;">
        <label style="font-size:10px; color:#aaa; font-weight:bold;">ADD/DEDUCT GEMS (+/-) [CURRENT: 💎 ${gemsCount.toLocaleString()}]</label>
        <input type="number" id="gemDelta" placeholder="e.g. 500 or -100" style="width:100%; padding:8px; background:#1a1a24; border:1px solid #333; color:#fff; border-radius:4px; margin-top:4px; box-sizing:border-box; outline:none; font-family:monospace;">
      </div>

      <div style="margin-top:12px;">
        <label style="font-size:10px; color:#aaa; font-weight:bold;">ADD/DEDUCT COINS (+/-) [CURRENT: 🪙 ${coinsCount.toLocaleString()}]</label>
        <input type="number" id="coinDelta" placeholder="e.g. 5000 or -1000" style="width:100%; padding:8px; background:#1a1a24; border:1px solid #333; color:#fff; border-radius:4px; margin-top:4px; box-sizing:border-box; outline:none; font-family:monospace;">
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:18px;">
        <button onclick="window.saveAdjustments('${userId}')" style="background:#00c853; border:none; padding:10px; font-weight:bold; color:#000; border-radius:4px; cursor:pointer; font-size:12px; transition:opacity 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">SAVE ADJUSTMENTS</button>
        <button onclick="window.muteUser('${userId}')" style="background:#ff9100; border:none; padding:10px; font-weight:bold; color:#000; border-radius:4px; cursor:pointer; font-size:12px; transition:opacity 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">${isMuted ? 'UNMUTE CHAT' : 'MUTE CHAT'}</button>
        <button onclick="window.kickUser('${userId}')" style="background:#ffab00; border:none; padding:10px; font-weight:bold; color:#000; border-radius:4px; cursor:pointer; font-size:12px; transition:opacity 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">KICK SESSION</button>
        <button onclick="window.banUser('${userId}')" style="background:#ff1744; border:none; padding:10px; font-weight:bold; color:#fff; border-radius:4px; cursor:pointer; font-size:12px; transition:opacity 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">${isBanned ? 'UNBAN USER' : 'PERMANENT BAN'}</button>
      </div>
    </div>
  `;
}

// Default fallback permanent accounts if Firestore list is initially pending/empty
const DEFAULT_PERMANENT_USERS = [
  { id: 'usr_aditya_owner', username: 'ADITYA-OWNER', role: 'SITE OWNER', gems: 999999, coins: 9999999, accountType: 'PERMANENT', isBanned: false, isMuted: false },
  { id: 'usr_grandmaster_vikram', username: 'Vikram-GM', role: 'ADMIN', gems: 45000, coins: 250000, accountType: 'PERMANENT', isBanned: false, isMuted: false },
  { id: 'usr_blitz_mod_elena', username: 'Elena_Mod', role: 'MODERATOR', gems: 12000, coins: 85000, accountType: 'PERMANENT', isBanned: false, isMuted: false },
  { id: 'usr_challenger_alex', username: 'Alex_Pro', role: 'USER', gems: 3200, coins: 18400, accountType: 'PERMANENT', isBanned: false, isMuted: false }
];

// In-memory registry cache to synchronize Firestore and Backend
const localUserCache = new Map<string, any>();
DEFAULT_PERMANENT_USERS.forEach(u => localUserCache.set(u.id, { ...u }));

// 3. Fetch and render all permanent users into the list UI
export async function fetchPermanentUsers() {
  const container = document.getElementById('userListContainer');
  if (!container) return;

  const usersMap = new Map<string, any>();
  // Pre-seed with defaults
  DEFAULT_PERMANENT_USERS.forEach((u) => usersMap.set(u.id, { ...u }));
  // Apply any in-memory overrides
  localUserCache.forEach((u, id) => usersMap.set(id, { ...u }));

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('accountType', '==', 'PERMANENT'));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      usersMap.set(docSnap.id, {
        id: docSnap.id,
        ...data,
      });
      localUserCache.set(docSnap.id, {
        id: docSnap.id,
        ...data,
      });
    });
  } catch (err) {
    console.warn('Notice: fetchPermanentUsers Firestore read deferred (offline/cached):', err);
  }

  // Also query backend /api/admin/users if available
  try {
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      const json = await res.json();
      if (json.users && Array.isArray(json.users)) {
        json.users.forEach((srvUser: any) => {
          if (!usersMap.has(srvUser.id)) {
            usersMap.set(srvUser.id, srvUser);
            localUserCache.set(srvUser.id, srvUser);
          }
        });
      }
    }
  } catch {
    // ignore offline backend fetch
  }

  container.innerHTML = '';

  usersMap.forEach((userData, userId) => {
    const row = document.createElement('div');
    row.style.cssText = 'padding:8px 12px; background:#14141f; margin:4px 0; border-radius:6px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; border:1px solid #222230; transition:all 0.2s;';
    const role = userData.role || 'USER';
    const badgeBg = role === 'SITE OWNER' ? '#a855f7' : role === 'ADMIN' ? '#e11d48' : role === 'MODERATOR' ? '#3b82f6' : '#ff8c00';
    const isBanned = !!userData.isBanned;

    row.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:12px; color:${isBanned ? '#ef4444' : '#fff'}; text-decoration:${isBanned ? 'line-through' : 'none'};">
          <strong>${userData.username || 'User'}</strong>
          <small style="color:#666; margin-left:4px;">(${userId})</small>
        </span>
        ${isBanned ? '<span style="background:#ef4444; color:#fff; font-size:9px; padding:1px 5px; border-radius:3px; font-weight:bold;">BAN</span>' : ''}
        ${userData.isMuted ? '<span style="background:#f97316; color:#fff; font-size:9px; padding:1px 5px; border-radius:3px; font-weight:bold;">MUTE</span>' : ''}
      </div>
      <span style="background:${badgeBg}; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; font-weight:bold;">${role}</span>
    `;
    row.onclick = () => renderProfileCard(userId, userData);
    container.appendChild(row);
  });
}

// 4. Attach window handlers
export function setupWindowGovernanceHandlers() {
  // Direct Search / Lookup user by Username or UID
  (window as any).lookupUser = async function() {
    const input = document.getElementById('searchInput') as HTMLInputElement | null;
    const searchTerm = input?.value.trim();
    if (!searchTerm) {
      alert('Please enter a target Username or ID');
      return;
    }

    try {
      // 1. Direct UID lookup in Firestore
      const userDocRef = doc(db, 'users', searchTerm);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        localUserCache.set(userDocSnap.id, { id: userDocSnap.id, ...data });
        renderProfileCard(userDocSnap.id, data);
        return;
      }

      // 2. Search by username field in Firestore
      const q = query(collection(db, 'users'), where('username', '==', searchTerm));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const foundDoc = querySnapshot.docs[0];
        const data = foundDoc.data();
        localUserCache.set(foundDoc.id, { id: foundDoc.id, ...data });
        renderProfileCard(foundDoc.id, data);
        return;
      }
    } catch (err: any) {
      console.warn('Notice: Firestore user lookup offline fallback:', err);
    }

    // 3. Check local cache
    for (const [id, user] of localUserCache.entries()) {
      if (
        id.toLowerCase() === searchTerm.toLowerCase() ||
        (user.username && user.username.toLowerCase() === searchTerm.toLowerCase())
      ) {
        renderProfileCard(id, user);
        return;
      }
    }

    // 4. Check backend API /api/admin/user/search
    try {
      const res = await fetch('/api/admin/user/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTerm }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.user) {
          localUserCache.set(json.user.id, json.user);
          renderProfileCard(json.user.id, json.user);
          return;
        }
      }
    } catch {
      // ignore
    }

    alert('User not found!');
  };

  // 5. Governance Action Event Handlers
  (window as any).saveAdjustments = async function(userId: string) {
    const roleSelect = document.getElementById('roleSelect') as HTMLSelectElement | null;
    const gemInput = document.getElementById('gemDelta') as HTMLInputElement | null;
    const coinInput = document.getElementById('coinDelta') as HTMLInputElement | null;

    const newRole = roleSelect?.value || 'USER';
    const gemVal = parseInt(gemInput?.value || '0', 10) || 0;
    const coinVal = parseInt(coinInput?.value || '0', 10) || 0;

    const existing = localUserCache.get(userId) || { id: userId, username: 'Player', gems: 1000, coins: 5000 };
    const updatedGems = Math.max(0, (existing.gems || 0) + gemVal);
    const updatedCoins = Math.max(0, (existing.coins || 0) + coinVal);

    const updatedUser = {
      ...existing,
      role: newRole,
      gems: updatedGems,
      coins: updatedCoins,
    };
    localUserCache.set(userId, updatedUser);

    // Sync to Firestore
    try {
      const updates: Record<string, any> = { role: newRole };
      if (gemVal !== 0) updates.gems = increment(gemVal);
      if (coinVal !== 0) updates.coins = increment(coinVal);
      await setDoc(doc(db, 'users', userId), updates, { merge: true });
    } catch (err) {
      console.warn('Notice: Firestore save deferred (offline mode):', err);
    }

    // Sync to backend API
    try {
      await adminUpdateUser(userId, { role: newRole, gemDelta: gemVal, coinDelta: coinVal });
      await fetch('/api/admin/user/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole, gemDelta: gemVal, coinDelta: coinVal }),
      });
    } catch (e) {
      console.warn('Backend adjust warning:', e);
    }

    alert('Adjustments saved successfully!');
    renderProfileCard(userId, updatedUser);
    fetchPermanentUsers();
  };

  (window as any).banUser = async function(userId: string) {
    const existing = localUserCache.get(userId) || {};
    const nextBanStatus = !existing.isBanned;

    const actionText = nextBanStatus ? 'permanently ban' : 'unban';
    if (!confirm(`Are you sure you want to ${actionText} this user?`)) return;

    existing.isBanned = nextBanStatus;
    localUserCache.set(userId, existing);

    try {
      await setDoc(doc(db, 'users', userId), { isBanned: nextBanStatus }, { merge: true });
    } catch (err) {
      console.warn('Notice: Firestore ban status deferred:', err);
    }

    try {
      if (nextBanStatus) {
        await revokeUserSession(userId, 'Permanent account ban');
      }
      await adminUpdateUser(userId, { isBanned: nextBanStatus });
      await fetch('/api/admin/user/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason: nextBanStatus ? 'Permanent admin governance ban' : 'Unbanned by admin' }),
      });
    } catch (e) {
      console.warn('Backend ban warning:', e);
    }

    alert(`User ${nextBanStatus ? 'permanently banned' : 'unbanned'}.`);
    renderProfileCard(userId, existing);
    fetchPermanentUsers();
  };

  (window as any).kickUser = async function(userId: string) {
    try {
      await setDoc(doc(db, 'users', userId), { sessionRevokedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.warn('Notice: Firestore kick deferred:', err);
    }

    try {
      await revokeUserSession(userId, 'Session revoked via Command & Control Center');
      await fetch('/api/admin/user/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason: 'Session revoked via Command & Control Center' }),
      });
    } catch (e) {
      console.warn('Backend kick warning:', e);
    }

    alert('User active session revoked.');
  };

  (window as any).muteUser = async function(userId: string) {
    const existing = localUserCache.get(userId) || {};
    const nextMuteStatus = !existing.isMuted;

    existing.isMuted = nextMuteStatus;
    localUserCache.set(userId, existing);

    try {
      await setDoc(doc(db, 'users', userId), { isMuted: nextMuteStatus }, { merge: true });
    } catch (err) {
      console.warn('Notice: Firestore mute deferred:', err);
    }

    try {
      await fetch('/api/admin/user/mute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, durationMinutes: 60 }),
      });
    } catch (e) {
      console.warn('Backend mute warning:', e);
    }

    alert(`User chat access ${nextMuteStatus ? 'muted' : 'unmuted'}.`);
    renderProfileCard(userId, existing);
    fetchPermanentUsers();
  };
}

export const CommandControlUsersModule: React.FC = () => {
  const initializedRef = useRef(false);
  const [activeGame, setActiveGame] = useState<ActiveGamePlatformState>({
    activeGameId: 'DUO_CHESS',
    gameTitle: 'Duo Chess',
    entryFee: 100,
    currency: 'coins',
    switchedBy: 'ADITYA-OWNER',
  });
  const [selectedGameId, setSelectedGameId] = useState('DRAUGHTS');
  const [customFee, setCustomFee] = useState('50');
  const [customCurrency, setCustomCurrency] = useState<'coins' | 'gems'>('coins');
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchFeedback, setSwitchFeedback] = useState<string | null>(null);

  useEffect(() => {
    setupWindowGovernanceHandlers();
    fetchPermanentUsers();

    // Subscribe to real-time changes on platform_state/active_game
    const unsub = subscribeToActiveGame((state) => {
      if (state && state.activeGameId) {
        setActiveGame(state);
      }
    });

    if (!initializedRef.current) {
      initializedRef.current = true;
      // Pre-select ADITYA-OWNER profile card if nothing is selected yet
      setTimeout(() => {
        const panel = document.getElementById('adminUserPanel');
        if (panel && !panel.innerHTML.trim()) {
          renderProfileCard('usr_aditya_owner', DEFAULT_PERMANENT_USERS[0]);
        }
      }, 200);
    }

    return () => {
      unsub();
    };
  }, []);

  const handleSwitchGame = async () => {
    setIsSwitching(true);
    setSwitchFeedback(null);
    try {
      const titles: Record<string, string> = {
        DRAUGHTS: 'Draughts',
        DUO_CHESS: 'Duo Chess',
        CAR_TUNING: 'Car Tuning Showdown',
        CHESS_PRO: 'Chess Pro Master',
        CHECKERS: 'Classic Checkers',
        CONNECT_FOUR: 'Connect Four Arena',
        LUDO: 'Ludo Royal',
        BUSINESS: 'Business Tycoon',
        BACKGAMMON: 'Backgammon Pro',
        CARROM: 'Carrom Clash',
        DARTS: 'Darts Championship',
      };
      const title = titles[selectedGameId] || selectedGameId;
      const fee = Number(customFee) || 50;
      await switchActiveGame(selectedGameId, title, fee, customCurrency, 'ADITYA-OWNER');
      setActiveGame({
        activeGameId: selectedGameId,
        gameTitle: title,
        entryFee: fee,
        currency: customCurrency,
        switchedBy: 'ADITYA-OWNER',
      });
      setSwitchFeedback(`Successfully switched platform active game to ${title}!`);
      setTimeout(() => setSwitchFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to switch game mode.');
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div
      className="control-center-panel"
      style={{
        background: '#0a0a0f',
        padding: '20px',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '100%',
        margin: '0 auto',
        color: '#fff',
        fontFamily: 'sans-serif',
        border: '1px solid #1a1a24',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>🛡️ COMMAND & CONTROL CENTER</h2>
          <small style={{ color: '#888' }}>Platform Administration & Superuser Governance Hub</small>
        </div>
        <span style={{ background: '#a855f7', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>
          SITE OWNER
        </span>
      </div>

      {/* GLOBAL ACTIVE GAME CONTROLLER */}
      <div style={{
        background: '#12121a',
        border: '1px solid #2a2a3c',
        borderRadius: '10px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🎮</span>
            <span style={{ fontWeight: 800, fontSize: '13px', color: '#fff', letterSpacing: '0.5px' }}>
              GLOBAL ACTIVE GAME MODE
            </span>
          </div>
          <span style={{
            background: '#059669',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '6px'
          }}>
            ACTIVE: {activeGame.gameTitle} ({activeGame.entryFee} {activeGame.currency})
          </span>
        </div>

        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 12px 0' }}>
          Globally broadcast and switch active game mode via real-time Firestore synchronization.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '10px', color: '#aaa', fontWeight: 700 }}>SELECT GAME</label>
            <select
              value={selectedGameId}
              onChange={(e) => {
                const nextId = e.target.value;
                setSelectedGameId(nextId);
                if (nextId === 'CAR_TUNING') {
                  setCustomFee('10');
                  setCustomCurrency('gems');
                } else if (nextId === 'DUO_CHESS' || nextId === 'CHESS_PRO') {
                  setCustomFee('100');
                  setCustomCurrency('coins');
                } else if (nextId === 'BUSINESS') {
                  setCustomFee('200');
                  setCustomCurrency('coins');
                } else {
                  setCustomFee('50');
                  setCustomCurrency('coins');
                }
              }}
              style={{
                width: '100%',
                padding: '8px',
                background: '#1a1a26',
                border: '1px solid #333',
                color: '#fff',
                borderRadius: '6px',
                marginTop: '4px',
                fontSize: '12px',
                outline: 'none'
              }}
            >
              <option value="DRAUGHTS">Draughts (50 Coins)</option>
              <option value="DUO_CHESS">Duo Chess (100 Coins)</option>
              <option value="CAR_TUNING">Car Tuning Showdown (10 Gems)</option>
              <option value="CHESS_PRO">Chess Pro Master (100 Coins)</option>
              <option value="CHECKERS">Classic Checkers (50 Coins)</option>
              <option value="CONNECT_FOUR">Connect Four (40 Coins)</option>
              <option value="LUDO">Ludo Royal (50 Coins)</option>
              <option value="BUSINESS">Business Tycoon (200 Coins)</option>
              <option value="BACKGAMMON">Backgammon Pro (75 Coins)</option>
              <option value="CARROM">Carrom Clash (50 Coins)</option>
              <option value="DARTS">Darts Championship (40 Coins)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '10px', color: '#aaa', fontWeight: 700 }}>ENTRY FEE</label>
            <input
              type="number"
              value={customFee}
              onChange={(e) => setCustomFee(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                background: '#1a1a26',
                border: '1px solid #333',
                color: '#fff',
                borderRadius: '6px',
                marginTop: '4px',
                fontSize: '12px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '10px', color: '#aaa', fontWeight: 700 }}>CURRENCY</label>
            <select
              value={customCurrency}
              onChange={(e) => setCustomCurrency(e.target.value as any)}
              style={{
                width: '100%',
                padding: '8px',
                background: '#1a1a26',
                border: '1px solid #333',
                color: '#fff',
                borderRadius: '6px',
                marginTop: '4px',
                fontSize: '12px',
                outline: 'none'
              }}
            >
              <option value="coins">Coins</option>
              <option value="gems">Gems</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSwitchGame}
          disabled={isSwitching}
          style={{
            width: '100%',
            background: isSwitching ? '#4b5563' : '#3b82f6',
            color: '#fff',
            border: 'none',
            padding: '10px',
            borderRadius: '6px',
            fontWeight: 800,
            fontSize: '12px',
            cursor: isSwitching ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            letterSpacing: '0.5px'
          }}
        >
          {isSwitching ? 'BROADCASTING SWITCH...' : '⚡ SWITCH GLOBAL ACTIVE GAME'}
        </button>

        {switchFeedback && (
          <div style={{ marginTop: '8px', padding: '8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#6ee7b7', fontSize: '11px', textAlign: 'center', fontWeight: 'bold' }}>
            {switchFeedback}
          </div>
        )}
      </div>

      {/* SEARCH / LOOKUP SECTION */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: '#aaa', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
          USER LOOKUP & GOVERNANCE ACTIONS
        </label>
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <input
            type="text"
            id="searchInput"
            placeholder="Enter target Username or ID (e.g. ADITYA-OWNER)"
            style={{
              flex: 1,
              padding: '10px',
              background: '#12121a',
              border: '1px solid #222230',
              color: '#fff',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '13px',
              outline: 'none'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (typeof (window as any).lookupUser === 'function') {
                  (window as any).lookupUser();
                }
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (typeof (window as any).lookupUser === 'function') {
                (window as any).lookupUser();
              }
            }}
            style={{
              background: '#7c3aed',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              fontWeight: 'bold',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            LOOKUP
          </button>
        </div>
      </div>

      {/* PERMANENT USERS LIST CONTAINER */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ color: '#aaa', fontSize: '11px', fontWeight: 'bold' }}>PERMANENT ACCOUNTS</label>
        <div
          id="userListContainer"
          style={{
            maxHeight: '160px',
            overflowY: 'auto',
            marginTop: '5px',
            border: '1px solid #1a1a24',
            padding: '6px',
            borderRadius: '6px',
            background: '#0d0d14'
          }}
        >
          {/* Loaded dynamically via JavaScript */}
        </div>
      </div>

      {/* USER PROFILE GOVERNANCE CARD (Rendered on selection/lookup) */}
      <div id="adminUserPanel" />
    </div>
  );
};
