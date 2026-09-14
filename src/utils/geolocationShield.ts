/**
 * Client-Side Geolocation Shield
 *
 * Explicitly neutralizes navigator.geolocation so that neither client scripts,
 * third-party widgets, nor compromised components can ever query the user's
 * physical coordinates or device GPS.
 */

export function enforceGeolocationShield(): void {
  if (typeof window === 'undefined') return;

  try {
    if ('geolocation' in navigator) {
      const blockedPositionError = {
        code: 1, // PERMISSION_DENIED
        message: 'User geolocation access is strictly prohibited on Chess.pro for privacy and safety.',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      // Override getCurrentPosition to immediately reject with PERMISSION_DENIED
      navigator.geolocation.getCurrentPosition = (
        _success: PositionCallback,
        error?: PositionErrorCallback | null
      ) => {
        console.warn('[Geolocation Shield] Blocked unauthorized attempt to query device GPS location.');
        if (error) {
          error(blockedPositionError as GeolocationPositionError);
        }
      };

      // Override watchPosition to immediately reject
      navigator.geolocation.watchPosition = (
        _success: PositionCallback,
        error?: PositionErrorCallback | null
      ): number => {
        console.warn('[Geolocation Shield] Blocked unauthorized attempt to watch live device location.');
        if (error) {
          error(blockedPositionError as GeolocationPositionError);
        }
        return -1;
      };

      navigator.geolocation.clearWatch = (_id: number) => {};
    }
  } catch (e) {
    // If navigator.geolocation is read-only in strict environments, ignore
  }
}

// Auto-enforce on module evaluation
enforceGeolocationShield();
