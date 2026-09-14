// Source: Google Maps Platform Code Assist
// Tracking Attribution: gmp_mcp_codeassist_v1_aistudio

interface GeocodingResult {
  formatted_address: string;
  place_id: string;
  types: string[];
  geometry: {
    location: { lat: number; lng: number };
    location_type: string;
  };
}

interface GeocodingApiResponse {
  status: string;
  error_message?: string;
  results: GeocodingResult[];
}

interface AddressValidationResult {
  isAddress: boolean;
  reason?: string;
  formattedAddress?: string;
  placeId?: string;
  cached?: boolean;
}

// In-memory cache for Geocoding API results to reduce latency and API billing costs
// Caching complies with Google Maps Platform Terms of Service (under 30 consecutive calendar days)
const addressCache = new Map<string, { result: AddressValidationResult; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Regex to detect clear locational cues before making network API requests
const LOCATIONAL_CUE_REGEX = /\b(street|st\.|road|rd\.|marg|avenue|ave|lane|ln|drive|dr|blvd|boulevard|chowk|nagar|colony|sector|sec\b|phase|enclave|vihar|apartment|apt|flat|floor|block|tower|building|bldg|house|h\.no|p\.o\.|pin\s*code|zip\s*code|\d{5,6}|cross|circle|bypass|highway|nh-\d+|landmark|near\s+[A-Za-z]+|behind\s+[A-Za-z]+|opp\s+[A-Za-z]+|opposite\s+[A-Za-z]+)\b/i;

// Regex to detect chess notations or common chat expressions that should bypass geocoding immediately
const COMMON_CLEAN_CHAT_REGEX = /^(gg|good\s*game|well\s*played|wp|rematch|hello|hi|hey|bye|good\s*luck|gl|hf|draw\?|resign|nice\s*move|blunder|checkmate|1-0|0-1|1\/2-1\/2|o-o|o-o-o|[kqrbn]?[a-h]?[1-8]?x?[a-h][1-8](\=[qrbn])?[\+#]?)$/i;

/**
 * Checks whether a given message text resolves to a real-world physical address
 * using Google Maps Geocoding API with multi-tier caching and heuristic pre-filtering.
 */
export async function validateAddressWithGoogleMaps(messageText: string): Promise<AddressValidationResult> {
  const trimmed = messageText.trim();

  // Step 1: Filter thresholds - skip short messages or common non-location chat
  if (trimmed.length < 5) {
    return { isAddress: false };
  }

  if (COMMON_CLEAN_CHAT_REGEX.test(trimmed)) {
    return { isAddress: false };
  }

  const cacheKey = trimmed.toLowerCase();
  const cachedEntry = addressCache.get(cacheKey);
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
    return { ...cachedEntry.result, cached: true };
  }

  // Check if message has explicit locational cues or structural address patterns
  const hasLocationalCue = LOCATIONAL_CUE_REGEX.test(trimmed);
  const hasDigitAndWords = /\d+[\w\s,.-]{4,}/.test(trimmed) && /[a-zA-Z]/.test(trimmed);

  // If there are no address clues, bypass the external API to save quota & minimize latency
  if (!hasLocationalCue && !hasDigitAndWords) {
    const negativeResult: AddressValidationResult = { isAddress: false };
    addressCache.set(cacheKey, { result: negativeResult, timestamp: Date.now() });
    return negativeResult;
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    // If no Google Maps API key is provided, perform heuristic regex fallback
    const fallbackIsAddress = hasLocationalCue && hasDigitAndWords;
    const fallbackResult: AddressValidationResult = {
      isAddress: fallbackIsAddress,
      reason: fallbackIsAddress ? 'Matched physical address pattern (fallback)' : undefined,
    };
    return fallbackResult;
  }

  // Step 2: Query Google Maps Geocoding API
  const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}&key=${apiKey}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      console.warn(`[Google Maps API] Geocoding HTTP status: ${response.status}`);
      return { isAddress: false };
    }

    const data = (await response.json()) as GeocodingApiResponse;

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const topResult = data.results[0];
      const types = topResult.types || [];

      // Valid physical location types that indicate a real-world address or locality
      const physicalTypes = [
        'street_address',
        'premise',
        'subpremise',
        'route',
        'intersection',
        'neighborhood',
        'sublocality',
        'sublocality_level_1',
        'sublocality_level_2',
        'sublocality_level_3',
        'locality',
        'postal_code',
        'point_of_interest',
        'establishment',
        'park',
        'airport',
      ];

      const matchesPhysicalType = types.some((t) => physicalTypes.includes(t));
      const isTooGeneric = types.length === 1 && (types.includes('country') || types.includes('continent'));

      if (matchesPhysicalType && !isTooGeneric) {
        const positiveResult: AddressValidationResult = {
          isAddress: true,
          formattedAddress: topResult.formatted_address,
          placeId: topResult.place_id,
          reason: `Resolved to real-world address: ${topResult.formatted_address}`,
        };
        addressCache.set(cacheKey, { result: positiveResult, timestamp: Date.now() });
        return positiveResult;
      }
    } else if (data.status === 'ZERO_RESULTS') {
      const negativeResult: AddressValidationResult = { isAddress: false };
      addressCache.set(cacheKey, { result: negativeResult, timestamp: Date.now() });
      return negativeResult;
    } else if (data.status === 'REQUEST_DENIED' || data.status === 'OVER_QUERY_LIMIT') {
      console.warn(`[Google Maps API] Status: ${data.status} - ${data.error_message || ''}`);
    }
  } catch (error) {
    console.error('[Google Maps API] Error querying Geocoding API:', error);
  }

  const defaultResult: AddressValidationResult = { isAddress: false };
  return defaultResult;
}

/**
 * Convenience helper returning a boolean indicating if text is a real-world address.
 */
export async function containsRealWorldAddress(messageText: string): Promise<boolean> {
  const validation = await validateAddressWithGoogleMaps(messageText);
  return validation.isAddress;
}
