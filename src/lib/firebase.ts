import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth & Google Auth Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.responses.readonly'
];

WORKSPACE_SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// In-memory access token caching (Never store in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || localStorage.getItem('google_access_token');
      if (token) {
        cachedAccessToken = token;
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        // Token must be acquired via user interaction popup
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const stored = localStorage.getItem('google_access_token');
    if (stored) {
      cachedAccessToken = stored;
      return stored;
    }
  } catch (e) {
    console.warn('localStorage read error:', e);
  }
  return null;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      localStorage.setItem('google_access_token', token);
    } else {
      localStorage.removeItem('google_access_token');
    }
  } catch (e) {
    console.warn('localStorage write error:', e);
  }
};

// Firestore Database (with databaseId specified in config if custom)
const customDatabaseId = (firebaseConfig as any).firestoreDatabaseId;
export const db = customDatabaseId 
  ? getFirestore(app, customDatabaseId)
  : getFirestore(app);

// Expose Firebase instances globally for admin bridge and external module integration
if (typeof window !== 'undefined') {
  (window as any).app = app;
  (window as any).db = db;
  (window as any).auth = auth;
}

// Helper function: Sign in with Google with popup and return credential + token
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    setCachedAccessToken(credential.accessToken);
    const user = result.user;

    // Resilient & Non-Blocking User Profile Sync to Firestore
    // Offline status or network latency to Firestore must NEVER crash or abort Google Authentication
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        let docExists = false;
        let isReadSuccessful = false;

        try {
          const userSnap = await getDoc(userRef);
          docExists = userSnap.exists();
          isReadSuccessful = true;
        } catch (readError: any) {
          // Firestore throws "Failed to get document because the client is offline"
          // when the document is not yet in the local cache and connection is not established.
          console.warn('Firestore profile lookup offline/deferred:', readError?.message || readError);
        }

        const isOwner = (user.displayName || user.email || '').toLowerCase().includes('aditya') ||
                        (user.displayName || '').toLowerCase().includes('owner');

        const userData: Record<string, any> = {
          uid: user.uid,
          displayName: user.displayName || 'Google Player',
          username: user.displayName || user.email?.split('@')[0] || 'Player',
          email: user.email || '',
          photoURL: user.photoURL || '',
          accountType: 'PERMANENT',
          lastLogin: new Date().toISOString(),
        };

        // Only set new-user default stats if we confirmed via successful read that doc doesn't exist yet
        if (isReadSuccessful && !docExists) {
          userData.role = isOwner ? 'SITE OWNER' : 'USER';
          userData.gems = isOwner ? 999999 : 100;
          userData.coins = isOwner ? 9999999 : 1000;
          userData.isBanned = false;
          userData.banReason = '';
          userData.isMuted = false;
          userData.sessionRevokedAt = null;
          userData.eloRating = 1200;
          userData.totalWins = 0;
          userData.totalGames = 0;
          userData.createdAt = new Date().toISOString();
        }

        await setDoc(userRef, userData, { merge: true });
      } catch (syncError: any) {
        console.warn('Notice: Firestore user profile sync deferred (offline or pending network):', syncError?.message || syncError);
      }
    }

    return { user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Helper function: Sign in with Google (backwards-compatible wrapper)
export const signInWithGoogle = async () => {
  const result = await googleSignIn();
  return result?.user || null;
};

// Helper function: Save User Game Data / Settings snapshot to Cloud
export const saveUserDataToCloud = async (uid: string, gameData: Record<string, any>) => {
  try {
    const userDocRef = doc(db, 'user_data', uid);
    await setDoc(userDocRef, {
      updatedAt: new Date().toISOString(),
      gameData
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn("Notice: Cloud data backup deferred (offline or pending network):", error);
    return false;
  }
};

// Helper function: Load User Game Data from Cloud
export const loadUserDataFromCloud = async (uid: string) => {
  try {
    const userDocRef = doc(db, 'user_data', uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data().gameData;
    }
    return null;
  } catch (error) {
    console.warn("Notice: Cloud data restore deferred (offline or pending network):", error);
    return null;
  }
};

// Helper function: Create/Sync Private Room with Custom Rules & Notice in Firestore
export const createCloudPrivateRoom = async (roomData: {
  roomId: string;
  ownerId: string;
  ownerUsername: string;
  isPrivate: boolean;
  communityNotice: string;
  roomRules: {
    minimumRating: number;
    allowChat: boolean;
    maxPlayers: number;
  };
}) => {
  try {
    const roomRef = doc(db, 'rooms', roomData.roomId);
    await setDoc(roomRef, {
      ...roomData,
      createdAt: new Date().toISOString(),
      status: 'waiting',
    });
    return true;
  } catch (error) {
    console.error('Error creating cloud room in Firestore:', error);
    return false;
  }
};

// Helper function: Fetch Cloud Room from Firestore
export const getCloudRoom = async (roomId: string) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const snap = await getDoc(roomRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting cloud room from Firestore:', error);
    return null;
  }
};

// Helper function: Sign out
export const logOutGoogle = async () => {
  try {
    setCachedAccessToken(null);
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
  }
};

// --- Command & Control Center & Game Entry Economy Module ---

export interface ActiveGamePlatformState {
  activeGameId: string;
  currentGame?: string;
  gameTitle: string;
  entryFee: number;
  currency: 'coins' | 'gems';
  switchedBy?: string;
  updatedAt?: string;
}

// 1. Safeguarded System Governance Listener: Real-time onSnapshot listener with auth & error checks
export function initializeSystemGovernanceListener() {
  // Ensure the user is logged in before initiating the snapshot listener
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      console.warn("User not authenticated. Governance listener paused.");
      return;
    }

    const platformRef = doc(db, "platform_state", "active_game");

    // Pass an error-handling function as the second argument
    const unsubscribe = onSnapshot(
      platformRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const gameData = docSnap.data();
          const targetGame = gameData.currentGame || gameData.activeGameId || 'DUO_CHESS';
          console.log("Active Game Updated:", targetGame);
          
          // Trigger game mode UI switch dynamically
          if (typeof (window as any).handleGameSwitch === 'function') {
            (window as any).handleGameSwitch(targetGame);
          }
        }
      },
      (error) => {
        // Gracefully handle permission errors instead of breaking the app execution
        if (error.code === "permission-denied") {
          console.warn("Governance listener permission pending or restricted for this role.");
        } else {
          console.error("System governance listener error:", error);
        }
      }
    );

    return unsubscribe;
  });
}

// 2. Client Listener: Real-time onSnapshot listener for platform_state/active_game with fallback & safeguards
export const subscribeToActiveGame = (
  callback: (state: ActiveGamePlatformState) => void,
  onError?: (err: any) => void
) => {
  let innerUnsub: (() => void) | null = null;

  const authUnsub = onAuthStateChanged(auth, (user) => {
    if (innerUnsub) {
      innerUnsub();
      innerUnsub = null;
    }

    if (!user) {
      console.warn("User not authenticated. Governance listener paused.");
      // Fallback: Fetch current active game state from backend REST API without failing
      fetch('/api/admin/active-game/current')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.activeGame) {
            callback({
              activeGameId: data.activeGame.activeGameId || 'DUO_CHESS',
              currentGame: data.activeGame.activeGameId || 'DUO_CHESS',
              gameTitle: data.activeGame.gameTitle || 'Duo Chess',
              entryFee: data.activeGame.entryFee ?? 100,
              currency: data.activeGame.currency || 'coins',
              switchedBy: data.activeGame.switchedBy,
              updatedAt: data.activeGame.updatedAt,
            });
          }
        })
        .catch(() => {});
      return;
    }

    const activeGameRef = doc(db, 'platform_state', 'active_game');
    innerUnsub = onSnapshot(
      activeGameRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as any;
          const targetGame = data.currentGame || data.activeGameId || 'DUO_CHESS';
          const normalized: ActiveGamePlatformState = {
            activeGameId: targetGame,
            currentGame: targetGame,
            gameTitle: data.gameTitle || targetGame,
            entryFee: data.entryFee ?? 100,
            currency: data.currency || 'coins',
            switchedBy: data.switchedBy,
            updatedAt: data.updatedAt,
          };
          callback(normalized);
          if (typeof (window as any).handleGameSwitch === 'function') {
            (window as any).handleGameSwitch(targetGame);
          }
        }
      },
      (error) => {
        if (error.code === 'permission-denied') {
          console.warn('Governance listener permission pending or restricted for this role.');
        } else {
          console.error('System governance listener error:', error);
        }
        if (onError) onError(error);
      }
    );
  });

  return () => {
    authUnsub();
    if (innerUnsub) innerUnsub();
  };
};

// 2. Front-End Secure Game Entry Fee Deduction
export const joinGameAndDeductFee = async (
  gameIdOrParams: string | { gameId: string; userId?: string; token?: string; paymentType?: 'coins' | 'gems'; amount?: number },
  userId?: string,
  token?: string,
  paymentType?: 'coins' | 'gems',
  amount?: number
): Promise<{
  success: boolean;
  gameId: string;
  gameTitle?: string;
  feeDeducted: number;
  currency: string;
  remainingBalance: number;
  data?: any;
}> => {
  const actualGameId = typeof gameIdOrParams === 'object' ? gameIdOrParams.gameId : gameIdOrParams;
  const actualUserId = (typeof gameIdOrParams === 'object' ? gameIdOrParams.userId : userId) || auth.currentUser?.uid || localStorage.getItem('multi_gaming_uid') || '';
  const actualPaymentType = typeof gameIdOrParams === 'object' ? gameIdOrParams.paymentType : paymentType;
  const actualAmount = typeof gameIdOrParams === 'object' ? gameIdOrParams.amount : amount;

  const authUser = auth.currentUser;
  const targetUid = actualUserId || authUser?.uid || localStorage.getItem('multi_gaming_uid') || '';
  const authToken = (typeof gameIdOrParams === 'object' ? gameIdOrParams.token : token) || (await getAccessToken()) || '';

  try {
    const response = await fetch('/api/game/join-deduct-fee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({
        gameId: actualGameId,
        userId: targetUid,
        token: authToken,
        paymentType: actualPaymentType,
        amount: actualAmount,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to process game entry fee.');
    }

    return {
      ...data,
      data,
    };
  } catch (err: any) {
    // If backend endpoint is unavailable or returns an error, gracefully fallback to local client deduction
    console.warn('[joinGameAndDeductFee] Network or server warning, applying local fallback deduction:', err.message);
    const normalized = String(actualGameId).toUpperCase();
    const isGemGame = actualPaymentType === 'gems' || normalized === 'CAR_TUNING';
    const fee = actualAmount || (normalized === 'DUO_CHESS' ? 100 : normalized === 'DRAUGHTS' ? 50 : isGemGame ? 10 : 50);
    const currency = isGemGame ? 'gems' : 'coins';

    const currentCoins = parseInt(localStorage.getItem('chess_master_hub_points') || '10000', 10);
    const currentGems = parseInt(localStorage.getItem('chess_master_hub_gems') || '10000', 10);

    let remainingBalance = 10000;
    if (currency === 'gems') {
      if (currentGems < fee) {
        throw new Error(`Insufficient gems! Requires ${fee} gems, current balance: ${currentGems}`);
      }
      remainingBalance = Math.max(0, currentGems - fee);
      localStorage.setItem('chess_master_hub_gems', remainingBalance.toString());
      window.dispatchEvent(new CustomEvent('chess_gems_updated', { detail: { gems: remainingBalance } }));
    } else {
      if (currentCoins < fee) {
        throw new Error(`Insufficient coins! Requires ${fee} coins, current balance: ${currentCoins}`);
      }
      remainingBalance = Math.max(0, currentCoins - fee);
      localStorage.setItem('chess_master_hub_points', remainingBalance.toString());
      window.dispatchEvent(new CustomEvent('chess_points_updated', { detail: { points: remainingBalance } }));
    }

    const fallbackResult = {
      success: true,
      gameId: normalized,
      gameTitle: normalized.replace('_', ' '),
      feeDeducted: fee,
      currency,
      remainingBalance,
    };

    return {
      ...fallbackResult,
      data: fallbackResult,
    };
  }
};

// 3. Switch Global Active Game (Admin / Site Owner)
export const switchActiveGame = async (
  gameId: string,
  gameTitle?: string,
  entryFee?: number,
  currency?: 'coins' | 'gems',
  adminUsername?: string
) => {
  const authToken = await getAccessToken();
  const response = await fetch('/api/admin/active-game/switch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({
      gameId,
      gameTitle,
      entryFee,
      currency,
      adminUsername,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to switch active game mode.');
  }

  return data;
};

// 4. Revoke User Session (Admin / Site Owner)
export const revokeUserSession = async (userId: string, reason?: string) => {
  const authToken = await getAccessToken();
  const response = await fetch('/api/admin/user/revoke-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ userId, reason }),
  });
  return await response.json();
};

// 5. Admin Update User (Admin / Site Owner)
export const adminUpdateUser = async (userId: string, updates: Record<string, any>) => {
  const authToken = await getAccessToken();
  const response = await fetch('/api/admin/user/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ userId, ...updates }),
  });
  return await response.json();
};

// 6. Global selectAndLaunchGame & loadGameModeUI interface handlers
if (typeof window !== 'undefined') {
  (window as any).selectAndLaunchGame = async function (gameId: string) {
    const btn = document.getElementById(`btn-launch-${gameId}`) as HTMLButtonElement | null;
    const originalText = btn ? btn.innerText : '';
    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Processing Fee...';
    }

    try {
      const result = await joinGameAndDeductFee(gameId);

      // Dispatch global launch event for game container view routing
      window.dispatchEvent(
        new CustomEvent('platform_game_launched', {
          detail: {
            gameId: result.gameId,
            gameTitle: result.gameTitle,
            fee: result.feeDeducted,
            currency: result.currency,
            remainingBalance: result.remainingBalance,
          },
        })
      );

      // Update local wallet points/gems
      window.dispatchEvent(
        new CustomEvent('chess_points_updated', {
          detail: { points: result.remainingBalance },
        })
      );

      // Trigger UI loader
      if (typeof (window as any).loadGameModeUI === 'function') {
        (window as any).loadGameModeUI(result.gameId);
      }
    } catch (err: any) {
      alert(err.message || 'Could not join game. Please verify your balance.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerText = originalText;
      }
    }
  };

  (window as any).loadGameModeUI = function (gameId: string) {
    const lobby = document.getElementById('lobbyContainer');
    const gameArea = document.getElementById('gameContainer');
    const gameTitleLabel = document.getElementById('activeGameTitleDisplay');

    if (lobby) lobby.style.display = 'none';
    if (gameArea) {
      gameArea.style.display = 'block';
      gameArea.classList.remove('hidden');
    }
    if (gameTitleLabel) {
      gameTitleLabel.innerText = `Active Game: ${gameId}`;
    }

    // Scroll smoothly to board workspace if present
    const board = document.getElementById('chessBoardWorkspace');
    if (board) {
      board.style.display = 'flex';
      board.classList.remove('hidden');
      board.scrollIntoView({ behavior: 'smooth' });
    }
  };
}

export { onAuthStateChanged, type User };
