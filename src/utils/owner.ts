/**
 * Site Owner Identity & Recognition Utility
 * User "ADITYA-OWNER" is recognized as the verified Site Owner & Platform Creator across the entire platform.
 */

export const OWNER_USERNAME = 'ADITYA-OWNER';
export const OWNER_EMAIL = 'mukkuc41@gmail.com';
export const OWNER_TITLE = 'Site Owner & Platform Founder';
export const OWNER_BADGE_LABEL = 'SITE OWNER';

/**
 * Checks whether a given username or email corresponds to the Site Owner.
 */
export function isSiteOwner(identifier?: string | null): boolean {
  if (!identifier || typeof identifier !== 'string') return false;
  const clean = identifier.trim().toLowerCase();
  return (
    clean === 'mukkuc41@gmail.com' ||
    clean === 'aditya-owner' ||
    clean === 'aditya_owner' ||
    clean === 'aditya owner' ||
    clean === 'aditya' ||
    clean.startsWith('aditya-owner') ||
    clean.startsWith('aditya_owner')
  );
}

/**
 * Normalizes or returns the formal display format for the Site Owner.
 */
export function formatOwnerDisplayName(username?: string | null): string {
  if (isSiteOwner(username)) {
    return 'ADITYA-OWNER';
  }
  return username || 'Player';
}
