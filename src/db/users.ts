import { db, isSqlAvailable } from './index.ts';
import { users, matches, achievements } from './schema.ts';
import { eq, or, sql } from 'drizzle-orm';

export interface DbUserRecord {
  id: number;
  uid: string;
  email: string;
  username: string | null;
  passwordHash: string | null;
  eloRating: number | null;
  gamesPlayed: number | null;
  wins: number | null;
  losses: number | null;
  draws: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export async function saveRegisteredUserToDb(data: {
  uid: string;
  email: string;
  username: string;
  passwordHash: string;
  eloRating?: number;
}): Promise<DbUserRecord | null> {
  if (!isSqlAvailable || !db) return null;
  try {
    const result = await db
      .insert(users)
      .values({
        uid: data.uid,
        email: data.email.toLowerCase(),
        username: data.username,
        passwordHash: data.passwordHash,
        eloRating: data.eloRating ?? 1200,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: data.email.toLowerCase(),
          username: data.username,
          passwordHash: data.passwordHash,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0] || null;
  } catch (error) {
    console.warn('Database fallback in saveRegisteredUserToDb:', error);
    return null;
  }
}

export async function findUserByEmailOrUsername(searchKey: string): Promise<DbUserRecord | null> {
  if (!isSqlAvailable || !db) return null;
  try {
    const cleanKey = searchKey.trim().toLowerCase();
    const result = await db
      .select()
      .from(users)
      .where(
        or(
          sql`LOWER(${users.email}) = ${cleanKey}`,
          sql`LOWER(${users.username}) = ${cleanKey}`
        )
      )
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.warn('Database fallback in findUserByEmailOrUsername:', error);
    return null;
  }
}

export async function getAllRegisteredUsersFromDb(): Promise<DbUserRecord[]> {
  if (!isSqlAvailable || !db) return [];
  try {
    return await db.select().from(users);
  } catch (error) {
    console.warn('Database fallback in getAllRegisteredUsersFromDb:', error);
    return [];
  }
}

export async function updateUserStatsInDb(
  uid: string,
  stats: {
    eloRating?: number;
    gamesPlayed?: number;
    wins?: number;
    losses?: number;
    draws?: number;
  }
): Promise<boolean> {
  if (!isSqlAvailable || !db) return false;
  try {
    await db
      .update(users)
      .set({
        ...stats,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid));
    return true;
  } catch (error) {
    console.warn('Database fallback in updateUserStatsInDb:', error);
    return false;
  }
}

export async function getOrCreateUser(uid: string, email: string, username?: string) {
  if (!isSqlAvailable || !db) {
    return {
      id: 1,
      uid,
      email,
      username: username || 'Player',
      eloRating: 1200,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        username: username || 'Player',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(username ? { username } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.warn("Database fallback in getOrCreateUser:", error);
    return {
      id: 1,
      uid,
      email,
      username: username || 'Player',
      eloRating: 1200,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export async function getUserByUid(uid: string) {
  if (!isSqlAvailable || !db) return null;
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.warn("Database fallback in getUserByUid:", error);
    return null;
  }
}

export async function getUserMatches(userId: number) {
  if (!isSqlAvailable || !db) return [];
  try {
    return await db.select().from(matches).where(eq(matches.userId, userId));
  } catch (error) {
    console.warn("Database fallback in getUserMatches:", error);
    return [];
  }
}
