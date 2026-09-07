/**
 * Board Movement and Landing Handler
 * 
 * Ensures property and transit cards ONLY open and appear when a player
 * physically lands on that specific place via a dice roll, staying hidden
 * at all other times.
 */

export interface LandedTileData {
  id?: number;
  name: string;
  type: string;
  specialType?: string;
  category?: string;
  price?: number;
  rent?: number;
  houses?: number;
  ownerId?: number;
  color?: string;
  icon?: string;
  description?: string;
  [key: string]: any;
}

/**
 * Handles the logic when a player finishes moving and lands on a board tile.
 * Opens the card modal only if the tile is an unowned/buyable property or transit tile.
 * Special tiles (START, GO, Jail, Tax, IMF, Chance) ensure the modal stays closed.
 */
export function handlePlayerLanding<T = any>(
  landedTile: T | null | undefined,
  player: any,
  setCurrentTileData: (data: T | null) => void,
  setIsCardModalOpen: (isOpen: boolean) => void
): boolean {
  if (!landedTile) {
    setCurrentTileData(null);
    setIsCardModalOpen(false);
    return false;
  }

  const tile = landedTile as any;
  const normalizedType = (tile.type || '').toUpperCase();
  const isBuyableType =
    normalizedType === 'PROPERTY' ||
    normalizedType === 'TRANSIT' ||
    normalizedType === 'WAYS' ||
    tile.type === 'property' ||
    tile.type === 'transit' ||
    tile.type === 'ways';

  // Check if the landed tile is a buyable property, city, or transit/ways card
  if (isBuyableType && (tile.ownerId === undefined || tile.ownerId === null)) {
    // Pass the specific data of the tile the player landed on
    setCurrentTileData(landedTile);

    // Open the card modal ONLY now
    setIsCardModalOpen(true);
    return true;
  } else {
    // If it's a special tile (like GO, Jail, Tax, etc.) or already owned, ensure modal stays closed
    setCurrentTileData(null);
    setIsCardModalOpen(false);
    return false;
  }
}
