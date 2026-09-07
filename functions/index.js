/**
 * Firebase Cloud Functions (functions/index.js)
 * Production-ready serverless backend logic for:
 * 1. joinGameAndDeductFee (Atomic Firestore transaction for game entry fees)
 * 2. switchActiveGame (Global platform game mode switcher with real-time sync)
 * 3. revokeUserSession (Force logout & JWT invalidation via Firebase Admin SDK)
 * 4. adminUpdateUser (Atomic role, coin, gem adjustments, mute & ban toggles)
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// 1. Comprehensive Game Entry Fee Configuration Matrix
const GAME_ENTRY_FEES = {
  DRAUGHTS: { currency: "coins", amount: 50, title: "Draughts" },
  DUO_CHESS: { currency: "coins", amount: 100, title: "Duo Chess" },
  CAR_TUNING: { currency: "gems", amount: 10, title: "Car Tuning Showdown" },
  CHESS_PRO: { currency: "coins", amount: 100, title: "Chess Pro Master" },
  CHECKERS: { currency: "coins", amount: 50, title: "Classic Checkers" },
  CONNECT_FOUR: { currency: "coins", amount: 40, title: "Connect Four Arena" },
  LUDO: { currency: "coins", amount: 50, title: "Ludo Royal" },
  BUSINESS: { currency: "coins", amount: 200, title: "Business Tycoon" },
  BACKGAMMON: { currency: "coins", amount: 75, title: "Backgammon Pro" }
};

// Helper to verify admin privileges
async function verifyAdminUser(authContext) {
  if (!authContext || !authContext.uid) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  // Check admin email override
  if (authContext.token && authContext.token.email === "mukkuc41@gmail.com") {
    return true;
  }

  const userDoc = await db.collection("users").doc(authContext.uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError("permission-denied", "User record not found.");
  }

  const role = (userDoc.data().role || "").toUpperCase();
  if (role !== "ADMIN" && role !== "SITE OWNER") {
    throw new functions.https.HttpsError("permission-denied", "Requires SITE_OWNER or ADMIN privileges.");
  }

  return true;
}

/**
 * 1. Secure Server-Side Entry Fee Deduction
 * Deducts entry fees atomically before the game environment loads.
 */
exports.joinGameAndDeductFee = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  const userId = context.auth.uid;
  const gameId = (data.gameId || "").toUpperCase();

  const gameConfig = GAME_ENTRY_FEES[gameId];
  if (!gameConfig) {
    throw new functions.https.HttpsError("invalid-argument", `Invalid game selected: ${gameId}`);
  }

  const userRef = db.collection("users").doc(userId);
  const txRef = userRef.collection("coin_history").doc();

  return await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User profile not found.");
    }

    const userData = userDoc.data();

    // Check account status
    if (userData.isBanned) {
      throw new functions.https.HttpsError("permission-denied", "Account is suspended.");
    }

    const currentBalance = typeof userData[gameConfig.currency] === "number" ? userData[gameConfig.currency] : 0;

    // Check if user has sufficient funds
    if (currentBalance < gameConfig.amount) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Insufficient ${gameConfig.currency}. You need ${gameConfig.amount} to play.`
      );
    }

    // Deduct the entry fee atomically
    const newBalance = currentBalance - gameConfig.amount;
    transaction.update(userRef, {
      [gameConfig.currency]: newBalance,
      lastGamePlayed: gameId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Write immutable transaction ledger
    transaction.set(txRef, {
      txId: txRef.id,
      userId: userId,
      amount: -gameConfig.amount,
      type: "match_entry",
      gameId: gameId,
      currency: gameConfig.currency,
      description: `Entry fee for ${gameConfig.title}`,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      gameId: gameId,
      feeDeducted: gameConfig.amount,
      currency: gameConfig.currency,
      remainingBalance: newBalance
    };
  });
});

/**
 * 2. Global Active Game Mode Switcher
 * Allows administrators to switch active game on the fly.
 * Clients listening to platform_state/active_game via onSnapshot update automatically.
 */
exports.switchActiveGame = functions.https.onCall(async (data, context) => {
  await verifyAdminUser(context.auth);

  const { gameId, gameTitle, entryFee, currency } = data;
  if (!gameId) {
    throw new functions.https.HttpsError("invalid-argument", "Game ID is required.");
  }

  const normalizedId = String(gameId).toUpperCase();
  const config = GAME_ENTRY_FEES[normalizedId] || {
    currency: currency || "coins",
    amount: entryFee || 50,
    title: gameTitle || normalizedId
  };

  const activeGameRef = db.collection("platform_state").doc("active_game");
  const payload = {
    activeGameId: normalizedId,
    gameTitle: config.title || gameTitle || normalizedId,
    entryFee: config.amount,
    currency: config.currency,
    switchedBy: context.auth.token.email || context.auth.uid,
    switchedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await activeGameRef.set(payload, { merge: true });

  return {
    success: true,
    message: `Active game globally switched to ${payload.gameTitle}`,
    activeGame: payload
  };
});

/**
 * 3. Revoke User Session (Force Logout & Token Invalidation)
 */
exports.revokeUserSession = functions.https.onCall(async (data, context) => {
  await verifyAdminUser(context.auth);

  const { userId, reason } = data;
  if (!userId) {
    throw new functions.https.HttpsError("invalid-argument", "Target userId is required.");
  }

  // Revoke Firebase Auth refresh tokens
  try {
    await admin.auth().revokeRefreshTokens(userId);
  } catch (err) {
    console.warn(`Notice: auth token revocation error for ${userId}:`, err.message);
  }

  // Update user document session timestamp
  const userRef = db.collection("users").doc(userId);
  await userRef.set(
    {
      sessionRevokedAt: admin.firestore.FieldValue.serverTimestamp(),
      revocationReason: reason || "Session revoked by site administrator"
    },
    { merge: true }
  );

  return {
    success: true,
    message: `User ${userId} session tokens revoked successfully.`
  };
});

/**
 * 4. Admin Governance: Update User (Atomic Balances, Role, Ban, Mute)
 */
exports.adminUpdateUser = functions.https.onCall(async (data, context) => {
  await verifyAdminUser(context.auth);

  const { userId, role, gemDelta, coinDelta, isBanned, isMuted } = data;
  if (!userId) {
    throw new functions.https.HttpsError("invalid-argument", "Target userId is required.");
  }

  const updates = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (role) updates.role = role;
  if (typeof isBanned === "boolean") updates.isBanned = isBanned;
  if (typeof isMuted === "boolean") updates.isMuted = isMuted;
  if (gemDelta) updates.gems = admin.firestore.FieldValue.increment(Number(gemDelta));
  if (coinDelta) updates.coins = admin.firestore.FieldValue.increment(Number(coinDelta));

  // If user is banned, also revoke their active sessions immediately
  if (isBanned === true) {
    try {
      await admin.auth().revokeRefreshTokens(userId);
      updates.sessionRevokedAt = admin.firestore.FieldValue.serverTimestamp();
    } catch (e) {
      console.warn(`Auth revoke warning on ban:`, e.message);
    }
  }

  const userRef = db.collection("users").doc(userId);
  await userRef.set(updates, { merge: true });

  return {
    success: true,
    message: `User governance updates applied for ${userId}`,
    updates
  };
});
