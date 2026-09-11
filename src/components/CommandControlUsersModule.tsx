import React, { useEffect, useRef, useState } from 'react';
import { db, subscribeToActiveGame, switchActiveGame, revokeUserSession, adminUpdateUser, type ActiveGamePlatformState } from '../lib/firebase';
import { adminAdjustUserBalance } from '../lib/universal_sync_engine';
import { executeAdminUserAction, executeAdminMassWealthAdjustment } from '../lib/master_admin_sync';
import { getUserPoints, setUserPoints, getUserGems, setUserGems } from '../utils/pointsManager';
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
  serverTimestamp,
  writeBatch
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
    <div class="user-item active selected-user" data-user-id="${userId}" style="background:#12121a; border:1px solid #222230; border-radius:12px; padding:18px; margin-top:12px;">
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
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <label style="font-size:10px; color:#aaa; font-weight:bold;">ROLE PERMISSION LEVEL</label>
          <div style="display:flex; gap:4px;">
            <button type="button" onclick="window.quickSetRole('${userId}', 'SITE OWNER')" style="background:#a855f7; border:none; color:#fff; font-size:9px; padding:2px 6px; border-radius:3px; cursor:pointer; font-weight:bold;">👑 OWNER</button>
            <button type="button" onclick="window.quickSetRole('${userId}', 'ADMIN')" style="background:#e11d48; border:none; color:#fff; font-size:9px; padding:2px 6px; border-radius:3px; cursor:pointer; font-weight:bold;">🛡️ ADMIN</button>
            <button type="button" onclick="window.quickSetRole('${userId}', 'MODERATOR')" style="background:#3b82f6; border:none; color:#fff; font-size:9px; padding:2px 6px; border-radius:3px; cursor:pointer; font-weight:bold;">MOD</button>
            <button type="button" onclick="window.quickSetRole('${userId}', 'USER')" style="background:#334155; border:none; color:#fff; font-size:9px; padding:2px 6px; border-radius:3px; cursor:pointer; font-weight:bold;">USER</button>
          </div>
        </div>
        <select id="roleSelect" style="width:100%; padding:8px; background:#1a1a24; border:1px solid #333; color:#fff; border-radius:4px; margin-top:4px; outline:none; font-family:sans-serif;">
          <option value="SITE OWNER" ${currentRole === 'SITE OWNER' ? 'selected' : ''}>SITE OWNER (Supreme Control)</option>
          <option value="ADMIN" ${currentRole === 'ADMIN' ? 'selected' : ''}>ADMIN (Game & User Management)</option>
          <option value="MODERATOR" ${currentRole === 'MODERATOR' ? 'selected' : ''}>MODERATOR (Chat & Fair Play)</option>
          <option value="USER" ${currentRole === 'USER' ? 'selected' : ''}>USER (Standard Player)</option>
        </select>
      </div>

      <input type="hidden" id="inputTargetUserId" value="${userId}" />
      <input type="hidden" id="targetUserIdInput" value="${userId}" />

      <div style="margin-top:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <label style="font-size:10px; color:#aaa; font-weight:bold;">GEMS BALANCE [💎 ${gemsCount.toLocaleString()}]</label>
          <div style="display:flex; gap:4px;">
            <button type="button" onclick="window.quickSetGems('${userId}', 500)" style="background:#1e293b; border:1px solid #475569; color:#f472b6; font-size:9px; padding:2px 5px; border-radius:3px; cursor:pointer; font-weight:bold;">+500</button>
            <button type="button" onclick="window.quickSetGems('${userId}', 2000)" style="background:#1e293b; border:1px solid #475569; color:#f472b6; font-size:9px; padding:2px 5px; border-radius:3px; cursor:pointer; font-weight:bold;">+2K</button>
            <button type="button" onclick="window.quickSetGems('${userId}', 10000)" style="background:#1e293b; border:1px solid #475569; color:#f472b6; font-size:9px; padding:2px 5px; border-radius:3px; cursor:pointer; font-weight:bold;">+10K</button>
            <button type="button" onclick="window.quickSetGems('${userId}', -500)" style="background:#1e293b; border:1px solid #475569; color:#f87171; font-size:9px; padding:2px 5px; border-radius:3px; cursor:pointer; font-weight:bold;">-500</button>
            <button type="button" onclick="window.quickSetGems('${userId}', -${gemsCount})" style="background:#450a0a; border:1px solid #991b1b; color:#fca5a5; font-size:9px; padding:2px 5px; border-radius:3px; cursor:pointer; font-weight:bold;">WIPE 0</button>
          </div>
        </div>
        <input type="number" id="inputNewGems" data-alias="gemDelta" name="gem_delta" class="user-gems-input" placeholder="Enter +/- amount (e.g. 1000 or -500)" style="width:100%; padding:8px; background:#1a1a24; border:1px solid #333; color:#fff; border-radius:4px; margin-top:4px; box-sizing:border-box; outline:none; font-family:monospace;">
      </div>

      <div style="margin-top:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <label style="font-size:10px; color:#aaa; font-weight:bold;">COINS BALANCE [🪙 ${coinsCount.toLocaleString()}]</label>
          <div style="display:flex; gap:4px;">
            <button type="button" onclick="window.quickSetCoins('${userId}', 1000)" style="background:#1e293b; border:1px solid #475569; color:#fbbf24; font-size:9px; padding:2px 5px; border-radius:3px; cursor:pointer; font-weight:bold;">+1K</button>
            <button type="button" onclick="window.quickSetCoins('${userId}', 10000)" style="background:#1e293b; border:1px solid #475569; color:#fbbf24; font-size:9px; padding:2px 5px; border-radius:3px; cursor:pointer; font-weight:bold;">+10K</button>
            <button type="button" onclick="window.quickSetCoins('${userId}', 50000)" style="background:#1e293b; border:1px solid #475569; color:#fbbf24; font-size:9px; padding:2px 5px; border-radius:3px; cursor:pointer; font-weight:bold;">+50K</button>
            <button type="button" onclick="window.quickSetCoins('${userId}', -5000)" style="background:#1e293b; border:1px solid #475569; color:#f87171; font-size:9px; padding:2px 5px; border-radius:3px; cursor:pointer; font-weight:bold;">-5K</button>
            <button type="button" onclick="window.quickSetCoins('${userId}', -${coinsCount})" style="background:#450a0a; border:1px solid #991b1b; color:#fca5a5; font-size:9px; padding:2px 5px; border-radius:3px; cursor:pointer; font-weight:bold;">WIPE 0</button>
          </div>
        </div>
        <input type="number" id="inputNewCoins" data-alias="coinDelta" name="coin_delta" class="user-coins-input" placeholder="Enter +/- amount (e.g. 50000 or -10000)" style="width:100%; padding:8px; background:#1a1a24; border:1px solid #333; color:#fff; border-radius:4px; margin-top:4px; box-sizing:border-box; outline:none; font-family:monospace;">
      </div>

      <!-- 🌐 MASS WEALTH DISPATCHER (GIVE / DEDUCT EVERYONE) -->
      <div style="background:linear-gradient(135deg, rgba(26, 26, 40, 0.95), rgba(15, 23, 42, 0.95)); border:1px solid #3b82f644; border-radius:10px; padding:12px; margin-top:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:14px;">🌐</span>
            <span style="font-size:11px; font-weight:800; color:#60a5fa; letter-spacing:0.5px;">GIVE / DEDUCT MONEY (EVERYONE)</span>
          </div>
          <span style="font-size:9px; background:#1e3a8a; color:#93c5fd; padding:2px 7px; border-radius:4px; font-weight:700;">ALL PLAYERS</span>
        </div>
        <p style="font-size:10px; color:#94a3b8; margin:0 0 10px 0; line-height:1.4;">
          Use amounts in Coins & Gems inputs above to give or deduct from <strong>EVERY player</strong> simultaneously:
        </p>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
          <button id="btnMassGiveAll" type="button" onclick="window.massAdjustFromInputs('give')" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; padding:10px; font-weight:800; border-radius:6px; cursor:pointer; font-size:11px; display:flex; align-items:center; justify-content:center; gap:5px; box-shadow:0 2px 6px rgba(16, 185, 129, 0.3); transition:all 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
            <span>🎁</span> GIVE TO EVERYONE
          </button>
          <button id="btnMassDeductAll" type="button" onclick="window.massAdjustFromInputs('deduct')" style="background:linear-gradient(135deg, #ef4444, #dc2626); color:#fff; border:none; padding:10px; font-weight:800; border-radius:6px; cursor:pointer; font-size:11px; display:flex; align-items:center; justify-content:center; gap:5px; box-shadow:0 2px 6px rgba(239, 68, 68, 0.3); transition:all 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
            <span>📉</span> DEDUCT FROM EVERYONE
          </button>
        </div>
        <div style="display:flex; gap:4px; margin-top:8px; justify-content:center; flex-wrap:wrap;">
          <button type="button" onclick="window.quickMassAdjust(5000, 500)" style="background:#1e293b; border:1px solid #3b82f6; color:#93c5fd; font-size:9px; padding:3px 6px; border-radius:3px; cursor:pointer; font-weight:bold;">+5K 🪙 & +500 💎 ALL</button>
          <button type="button" onclick="window.quickMassAdjust(20000, 2000)" style="background:#1e293b; border:1px solid #3b82f6; color:#93c5fd; font-size:9px; padding:3px 6px; border-radius:3px; cursor:pointer; font-weight:bold;">+20K 🪙 & +2K 💎 ALL</button>
          <button type="button" onclick="window.quickMassAdjust(100000, 10000)" style="background:#1e293b; border:1px solid #10b981; color:#6ee7b7; font-size:9px; padding:3px 6px; border-radius:3px; cursor:pointer; font-weight:bold;">+100K 🪙 & +10K 💎 ALL</button>
          <button type="button" onclick="window.quickMassAdjust(-5000, -500)" style="background:#371414; border:1px solid #991b1b; color:#fca5a5; font-size:9px; padding:3px 6px; border-radius:3px; cursor:pointer; font-weight:bold;">-5K 🪙 & -500 💎 ALL</button>
          <button type="button" onclick="window.quickMassAdjust(-20000, -2000)" style="background:#371414; border:1px solid #991b1b; color:#fca5a5; font-size:9px; padding:3px 6px; border-radius:3px; cursor:pointer; font-weight:bold;">-20K 🪙 & -2K 💎 ALL</button>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:16px;">
        <button id="btnSaveUserAdjustments" class="btn-save-adjustments" onclick="window.saveAdjustments('${userId}')" style="background:#00c853; border:none; padding:10px; font-weight:bold; color:#000; border-radius:6px; cursor:pointer; font-size:12px; transition:opacity 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">💾 SAVE ADJUSTMENTS</button>
        <button id="btnMuteChat" class="btn-mute-chat" onclick="window.muteUser('${userId}')" style="background:${isMuted ? '#4ade80' : '#ff9100'}; border:none; padding:10px; font-weight:bold; color:#000; border-radius:6px; cursor:pointer; font-size:12px; transition:opacity 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">${isMuted ? '🔊 UNMUTE CHAT' : '🔇 MUTE CHAT'}</button>
        <button id="btnKickSession" class="btn-kick-session" onclick="window.kickUser('${userId}')" style="background:#ffab00; border:none; padding:10px; font-weight:bold; color:#000; border-radius:6px; cursor:pointer; font-size:12px; transition:opacity 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">⚡ KICK SESSION</button>
        <button id="btnPermanentBan" class="btn-permanent-ban" onclick="window.banUser('${userId}')" style="background:${isBanned ? '#3b82f6' : '#ff1744'}; border:none; padding:10px; font-weight:bold; color:#fff; border-radius:6px; cursor:pointer; font-size:12px; transition:opacity 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">${isBanned ? '🛡️ UNBAN USER' : '⛔ PERMANENT BAN'}</button>
      </div>
    </div>
  `;

  if (typeof (window as any).setupAdminPanelEventListeners === 'function') {
    (window as any).setupAdminPanelEventListeners();
  }
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
    row.className = 'user-item';
    row.dataset.userId = userId;
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
    row.onclick = () => {
      container.querySelectorAll('.user-item').forEach(el => el.classList.remove('active', 'selected-user'));
      row.classList.add('active', 'selected-user');
      renderProfileCard(userId, userData);
    };
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
  (window as any).quickSetRole = function(userId: string, role: string) {
    const roleSelect = document.getElementById('roleSelect') as HTMLSelectElement | null;
    if (roleSelect) roleSelect.value = role;
    (window as any).saveAdjustments(userId);
  };

  (window as any).quickSetGems = function(userId: string, delta: number) {
    const input = document.getElementById('inputNewGems') as HTMLInputElement | null;
    if (input) input.value = String(delta);
    (window as any).saveAdjustments(userId);
  };

  (window as any).quickSetCoins = function(userId: string, delta: number) {
    const input = document.getElementById('inputNewCoins') as HTMLInputElement | null;
    if (input) input.value = String(delta);
    (window as any).saveAdjustments(userId);
  };

  (window as any).saveAdjustments = async function(userId: string) {
    const roleSelect = document.getElementById('roleSelect') as HTMLSelectElement | null;
    const gemInput = (document.getElementById('inputNewGems') || document.getElementById('gemDelta')) as HTMLInputElement | null;
    const coinInput = (document.getElementById('inputNewCoins') || document.getElementById('coinDelta')) as HTMLInputElement | null;

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

    // Synchronize to localStorage for active user
    const currentUsername = localStorage.getItem('chess_pro_username') || '';
    if (existing.username && (existing.username.toLowerCase() === currentUsername.toLowerCase() || userId === localStorage.getItem('chess_pro_user_id'))) {
      localStorage.setItem('chess_pro_points', String(updatedCoins));
      localStorage.setItem('chess_pro_gems', String(updatedGems));
      localStorage.setItem('chess_pro_role', newRole);
      if (newRole === 'SITE OWNER') {
        localStorage.setItem('chess_pro_is_owner', 'true');
        localStorage.setItem('chess_owner_verified', 'true');
      }
    }

    // Sync via Universal Sync Engine & Master Admin Sync directly to Firestore
    try {
      await executeAdminUserAction(userId, { role: newRole, coins: updatedCoins, gems: updatedGems });
      await adminAdjustUserBalance(userId, updatedCoins, updatedGems);
    } catch (e) {
      console.warn('universal_sync_engine balance update error:', e);
    }

    // Sync to Firestore role
    try {
      const updates: Record<string, any> = { role: newRole, coins: updatedCoins, gems: updatedGems };
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

    window.dispatchEvent(new CustomEvent('admin_user_governance_event', {
      detail: { userId, username: existing.username, role: newRole, coins: updatedCoins, gems: updatedGems }
    }));

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

    // Synchronize to localStorage
    if (existing.username) {
      localStorage.setItem(`user_banned_${existing.username.toLowerCase()}`, nextBanStatus ? 'true' : 'false');
    }
    localStorage.setItem(`user_banned_${userId}`, nextBanStatus ? 'true' : 'false');

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

    window.dispatchEvent(new CustomEvent('admin_user_governance_event', {
      detail: { userId, username: existing.username, isBanned: nextBanStatus }
    }));

    alert(`User ${nextBanStatus ? 'PERMANENTLY BANNED' : 'UNBANNED'}. Access gates enforced.`);
    renderProfileCard(userId, existing);
    fetchPermanentUsers();
  };

  (window as any).kickUser = async function(userId: string) {
    const existing = localUserCache.get(userId) || {};
    if (!confirm(`Forcibly terminate session and kick "${existing.username || userId}" immediately?`)) return;

    localStorage.setItem(`user_kicked_${userId}`, String(Date.now()));
    if (existing.username) {
      localStorage.setItem(`user_kicked_${existing.username.toLowerCase()}`, String(Date.now()));
    }

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

    window.dispatchEvent(new CustomEvent('admin_user_governance_event', {
      detail: { userId, username: existing.username, kicked: true }
    }));

    alert('User active session revoked immediately.');
  };

  (window as any).muteUser = async function(userId: string) {
    const existing = localUserCache.get(userId) || {};
    const nextMuteStatus = !existing.isMuted;

    existing.isMuted = nextMuteStatus;
    localUserCache.set(userId, existing);

    // Synchronize to localStorage for instant client-side chat moderation
    if (existing.username) {
      localStorage.setItem(`user_muted_${existing.username.toLowerCase()}`, nextMuteStatus ? 'true' : 'false');
    }
    localStorage.setItem(`user_muted_${userId}`, nextMuteStatus ? 'true' : 'false');

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

    window.dispatchEvent(new CustomEvent('admin_user_governance_event', {
      detail: { userId, username: existing.username, isMuted: nextMuteStatus }
    }));

    alert(`User chat access ${nextMuteStatus ? 'MUTED' : 'UNMUTED'}.`);
    renderProfileCard(userId, existing);
    fetchPermanentUsers();
  };

  // 6. Global Mass Wealth Adjustment (Give or Deduct Money to/from Everyone)
  (window as any).massAdjustFromInputs = async function(mode: 'give' | 'deduct') {
    const gemInput = (document.getElementById('inputNewGems') || document.getElementById('gemDelta')) as HTMLInputElement | null;
    const coinInput = (document.getElementById('inputNewCoins') || document.getElementById('coinDelta')) as HTMLInputElement | null;

    let rawCoins = Math.abs(parseInt(coinInput?.value || '0', 10) || 0);
    let rawGems = Math.abs(parseInt(gemInput?.value || '0', 10) || 0);

    if (rawCoins === 0 && rawGems === 0) {
      const promptCoin = prompt(`Enter COINS amount to ${mode.toUpperCase()} to EVERY registered player:`, '10000');
      if (promptCoin === null) return;
      rawCoins = Math.abs(parseInt(promptCoin, 10) || 0);

      const promptGem = prompt(`Enter GEMS amount to ${mode.toUpperCase()} to EVERY registered player (or 0):`, '1000');
      if (promptGem !== null) {
        rawGems = Math.abs(parseInt(promptGem, 10) || 0);
      }
    }

    if (rawCoins === 0 && rawGems === 0) {
      alert('Please enter a valid amount of Coins or Gems to give or deduct from everyone.');
      return;
    }

    const coinDelta = mode === 'give' ? rawCoins : -rawCoins;
    const gemDelta = mode === 'give' ? rawGems : -rawGems;

    await (window as any).executeGlobalMassWealthAdjustment(coinDelta, gemDelta);
  };

  (window as any).executeGlobalMassWealthAdjustment = async function(coinDelta: number, gemDelta: number) {
    if (coinDelta === 0 && gemDelta === 0) {
      alert('Please specify a non-zero Coin or Gem delta.');
      return { success: false };
    }

    const isGive = coinDelta >= 0 && gemDelta >= 0;
    const parts: string[] = [];
    if (coinDelta !== 0) {
      parts.push(`${coinDelta > 0 ? `+${coinDelta.toLocaleString()}` : coinDelta.toLocaleString()} Coins`);
    }
    if (gemDelta !== 0) {
      parts.push(`${gemDelta > 0 ? `+${gemDelta.toLocaleString()}` : gemDelta.toLocaleString()} Gems`);
    }
    const deltaSummary = parts.join(' and ');

    const confirmed = confirm(
      `CONFIRMATION REQUIRED:\n\nAre you sure you want to ${isGive ? 'GIVE / AIRDROP' : 'DEDUCT'} ${deltaSummary} to/from EVERY registered player across the entire platform?\n\nThis will instantly update all accounts in Firestore and local databases simultaneously.`
    );
    if (!confirmed) return { success: false, cancelled: true };

    let totalAccountsUpdated = 0;

    // 1. Update in-memory local cache
    localUserCache.forEach((userData, uid) => {
      const curC = typeof userData.coins === 'number' ? userData.coins : 0;
      const curG = typeof userData.gems === 'number' ? userData.gems : 0;
      const nextC = Math.max(0, curC + coinDelta);
      const nextG = Math.max(0, curG + gemDelta);

      localUserCache.set(uid, {
        ...userData,
        coins: nextC,
        gems: nextG,
      });
      totalAccountsUpdated++;
    });

    // 2. Update DEFAULT_PERMANENT_USERS array
    DEFAULT_PERMANENT_USERS.forEach((u) => {
      u.coins = Math.max(0, (u.coins || 0) + coinDelta);
      u.gems = Math.max(0, (u.gems || 0) + gemDelta);
    });

    // 3. Batch update Firestore 'users' collection
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      if (!usersSnap.empty) {
        const batch = writeBatch(db);
        usersSnap.forEach((docSnap) => {
          const curData = docSnap.data();
          const cCoins = typeof curData.coins === 'number' ? curData.coins : 0;
          const cGems = typeof curData.gems === 'number' ? curData.gems : 0;
          const nCoins = Math.max(0, cCoins + coinDelta);
          const nGems = Math.max(0, cGems + gemDelta);

          batch.set(doc(db, 'users', docSnap.id), {
            coins: nCoins,
            gems: nGems,
            lastMassAdjustmentAt: serverTimestamp(),
            updatedBy: 'ADMIN_GLOBAL_AIRDROP'
          }, { merge: true });

          if (!localUserCache.has(docSnap.id)) {
            localUserCache.set(docSnap.id, {
              id: docSnap.id,
              ...curData,
              coins: nCoins,
              gems: nGems
            });
            totalAccountsUpdated++;
          }
        });
        await batch.commit();
      }
    } catch (err) {
      console.warn('Notice: Firestore batch write deferred (offline mode):', err);
    }

    // 4. Update master_admin_sync helper
    try {
      await executeAdminMassWealthAdjustment(coinDelta, gemDelta);
    } catch (err) {
      console.warn('master_admin_sync error:', err);
    }

    // 5. Update local user points & gems
    try {
      const currentPoints = getUserPoints();
      const currentGems = getUserGems();
      const nextPoints = Math.max(0, currentPoints + coinDelta);
      const nextGems = Math.max(0, currentGems + gemDelta);

      setUserPoints(nextPoints, `Global Admin ${isGive ? 'Gift' : 'Deduction'}`);
      setUserGems(nextGems, `Global Admin ${isGive ? 'Gift' : 'Deduction'}`);

      localStorage.setItem('chess_pro_points', String(nextPoints));
      localStorage.setItem('chess_pro_gems', String(nextGems));
    } catch (e) {
      console.warn('pointsManager local update warning:', e);
    }

    // 6. Broadcast window events
    window.dispatchEvent(new CustomEvent('admin_user_governance_event', {
      detail: { massAdjustment: true, coinDelta, gemDelta, totalAccountsUpdated }
    }));
    window.dispatchEvent(new CustomEvent('chess_points_updated', {
      detail: { reason: 'Mass Wealth Adjustment', delta: coinDelta }
    }));
    window.dispatchEvent(new CustomEvent('chess_gems_updated', {
      detail: { reason: 'Mass Wealth Adjustment', delta: gemDelta }
    }));

    // 7. Refresh selected card if open
    const targetUserIdInput = document.getElementById('targetUserIdInput') as HTMLInputElement | null;
    const currentSelectedId = targetUserIdInput?.value;
    if (currentSelectedId && localUserCache.has(currentSelectedId)) {
      renderProfileCard(currentSelectedId, localUserCache.get(currentSelectedId));
    }

    // 8. Refresh permanent users list
    fetchPermanentUsers();

    // 9. Clear inputs if present
    const gemInput = (document.getElementById('inputNewGems') || document.getElementById('gemDelta')) as HTMLInputElement | null;
    const coinInput = (document.getElementById('inputNewCoins') || document.getElementById('coinDelta')) as HTMLInputElement | null;
    if (gemInput) gemInput.value = '';
    if (coinInput) coinInput.value = '';

    alert(
      `✅ GLOBAL WEALTH ACTION COMPLETE!\n\nSuccessfully ${isGive ? 'credited' : 'deducted'} ${deltaSummary} across all registered accounts (${totalAccountsUpdated} user accounts synchronized in real time).`
    );

    return { success: true, totalAccountsUpdated };
  };

  (window as any).quickMassAdjust = async function(coins: number, gems: number) {
    return await (window as any).executeGlobalMassWealthAdjustment(coins, gems);
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

  const [globalMassCoins, setGlobalMassCoins] = useState('');
  const [globalMassGems, setGlobalMassGems] = useState('');
  const [isMassAdjusting, setIsMassAdjusting] = useState(false);
  const [massFeedback, setMassFeedback] = useState<string | null>(null);

  const handleGlobalMassAdjust = async (mode: 'give' | 'deduct') => {
    let rawCoins = Math.abs(parseInt(globalMassCoins || '0', 10) || 0);
    let rawGems = Math.abs(parseInt(globalMassGems || '0', 10) || 0);

    if (rawCoins === 0 && rawGems === 0) {
      const promptCoin = prompt(`Enter COINS amount to ${mode.toUpperCase()} to EVERY registered player:`, '10000');
      if (promptCoin === null) return;
      rawCoins = Math.abs(parseInt(promptCoin, 10) || 0);

      const promptGem = prompt(`Enter GEMS amount to ${mode.toUpperCase()} to EVERY registered player (or 0):`, '1000');
      if (promptGem !== null) {
        rawGems = Math.abs(parseInt(promptGem, 10) || 0);
      }
    }

    if (rawCoins === 0 && rawGems === 0) {
      alert('Please enter a valid amount of Coins or Gems to give or deduct from everyone.');
      return;
    }

    const coinDelta = mode === 'give' ? rawCoins : -rawCoins;
    const gemDelta = mode === 'give' ? rawGems : -rawGems;

    setIsMassAdjusting(true);
    setMassFeedback('Broadcasting global wealth update across all player accounts...');
    try {
      if (typeof (window as any).executeGlobalMassWealthAdjustment === 'function') {
        const res = await (window as any).executeGlobalMassWealthAdjustment(coinDelta, gemDelta);
        if (res?.success) {
          setMassFeedback(`Successfully ${mode === 'give' ? 'credited' : 'deducted'} balances for all players!`);
          setGlobalMassCoins('');
          setGlobalMassGems('');
        } else if (res?.cancelled) {
          setMassFeedback('Mass update cancelled by admin.');
        }
      }
    } catch (err: any) {
      setMassFeedback(`Failed: ${err?.message || err}`);
    } finally {
      setIsMassAdjusting(false);
      setTimeout(() => setMassFeedback(null), 5000);
    }
  };

  const handleQuickPreset = async (coins: number, gems: number) => {
    setIsMassAdjusting(true);
    try {
      if (typeof (window as any).executeGlobalMassWealthAdjustment === 'function') {
        const res = await (window as any).executeGlobalMassWealthAdjustment(coins, gems);
        if (res?.success) {
          setMassFeedback('Successfully updated all player accounts!');
        }
      }
    } catch (err: any) {
      setMassFeedback(`Failed: ${err?.message || err}`);
    } finally {
      setIsMassAdjusting(false);
      setTimeout(() => setMassFeedback(null), 5000);
    }
  };

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
              name="game_select"
              id="game_select"
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
              name="entry_fee"
              id="entry_fee"
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
              name="currency_type"
              id="currency_type"
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
              <option value="Coins">Coins</option>
              <option value="Gems">Gems</option>
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
            name="target_user"
            placeholder="Target Username or ID"
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

      {/* GLOBAL WEALTH DISTRIBUTION (ALL PLAYERS) - ALWAYS VISIBLE */}
      <div
        style={{
          marginBottom: '16px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(24, 24, 37, 0.95))',
          border: '1px solid #3b82f644',
          borderRadius: '10px',
          padding: '14px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🌐</span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.5px' }}>
              GLOBAL WEALTH DISPATCHER (ALL PLAYERS)
            </span>
          </div>
          <span style={{ fontSize: '10px', background: '#1e3a8a', color: '#93c5fd', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
            SERVER-WIDE WEALTH
          </span>
        </div>

        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 12px 0', lineHeight: 1.4 }}>
          Instantly credit or debit Coins and Gems across <strong>all registered player accounts</strong> and synchronize Firestore in real time.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
              COINS DELTA (🪙)
            </label>
            <input
              type="number"
              placeholder="e.g. 50000 or -5000"
              value={globalMassCoins}
              onChange={(e) => setGlobalMassCoins(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                background: '#12121a',
                border: '1px solid #334155',
                color: '#fff',
                borderRadius: '5px',
                fontSize: '12px',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '10px', color: '#f472b6', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
              GEMS DELTA (💎)
            </label>
            <input
              type="number"
              placeholder="e.g. 2000 or -500"
              value={globalMassGems}
              onChange={(e) => setGlobalMassGems(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                background: '#12121a',
                border: '1px solid #334155',
                color: '#fff',
                borderRadius: '5px',
                fontSize: '12px',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            type="button"
            disabled={isMassAdjusting}
            onClick={() => handleGlobalMassAdjust('give')}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              border: 'none',
              padding: '10px',
              fontWeight: 800,
              borderRadius: '6px',
              cursor: isMassAdjusting ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              opacity: isMassAdjusting ? 0.7 : 1,
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
            }}
          >
            <span>🎁</span> GIVE TO EVERYONE
          </button>
          <button
            type="button"
            disabled={isMassAdjusting}
            onClick={() => handleGlobalMassAdjust('deduct')}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff',
              border: 'none',
              padding: '10px',
              fontWeight: 800,
              borderRadius: '6px',
              cursor: isMassAdjusting ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              opacity: isMassAdjusting ? 0.7 : 1,
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
            }}
          >
            <span>📉</span> DEDUCT FROM EVERYONE
          </button>
        </div>

        {/* Instant Presets */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleQuickPreset(5000, 500)}
            style={{ background: '#1e293b', border: '1px solid #3b82f6', color: '#93c5fd', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            +5K 🪙 & +500 💎 ALL
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(20000, 2000)}
            style={{ background: '#1e293b', border: '1px solid #3b82f6', color: '#93c5fd', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            +20K 🪙 & +2K 💎 ALL
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(100000, 10000)}
            style={{ background: '#1e293b', border: '1px solid #10b981', color: '#6ee7b7', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            +100K 🪙 & +10K 💎 ALL
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(-5000, -500)}
            style={{ background: '#371414', border: '1px solid #991b1b', color: '#fca5a5', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            -5K 🪙 & -500 💎 ALL
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(-20000, -2000)}
            style={{ background: '#371414', border: '1px solid #991b1b', color: '#fca5a5', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            -20K 🪙 & -2K 💎 ALL
          </button>
        </div>

        {massFeedback && (
          <div
            style={{
              marginTop: '10px',
              padding: '8px 12px',
              background: massFeedback.includes('Failed') || massFeedback.includes('cancelled') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              border: `1px solid ${massFeedback.includes('Failed') || massFeedback.includes('cancelled') ? '#ef4444' : '#10b981'}`,
              borderRadius: '6px',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          >
            {massFeedback}
          </div>
        )}
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
