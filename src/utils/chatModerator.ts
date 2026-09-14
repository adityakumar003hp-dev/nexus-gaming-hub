// Real-Time Chat Moderation & Location Prohibition System
// Automatically detects, masks, and prohibits sensitive personal information and location sharing

export interface ModerationRule {
  pattern: RegExp;
  mask: string;
  category: 'location' | 'phone' | 'email' | 'other';
}

export interface ModerationResult {
  cleanText: string;
  isFlagged: boolean;
  hasLocationViolation: boolean;
  hasPhoneViolation: boolean;
  hasEmailViolation: boolean;
  prohibitionReason?: string;
}

// Comprehensive location patterns to detect and prohibit sharing of coordinates, addresses, maps, and locality names
export const locationPatterns: RegExp[] = [
  // Specific street address keywords followed by locations (Jaipur & Indian metropolitan areas)
  /(shyam nagar|vaishali nagar|mansarovar|raja park|malviya nagar|tonk road|c-scheme|jawahar nagar|sodala|bani park|ajmer road|gopalpura bypass|pratap nagar|vidhyadhar nagar|jhotwara)/gi,

  // General street address patterns (Sector, Phase, Marg, Road, Colony, Apartment, Street, Society, etc.)
  /\b(sector|phase|block|pocket|flat|apt|apartment|tower|plot|street|avenue|lane|marg|vihar|colony|enclave|chowk|nagar|society|layout)\s*(?:no\.?|number|#)?\s*\d+[a-z0-9\s,-]*/gi,

  // GPS Coordinates (Standard decimal Lat/Long pairs like 26.9124, 75.7873 or 26.9124 N, 75.7873 E)
  /\b[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)\s*[,;/]\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)\b/g,
  /\b\d{1,2}°\s*\d{1,2}'(?:\s*\d{1,2}(?:\.\d+)?")?\s*[NSEW]\b/gi,

  // Evasion: Spaced GPS Coordinates (e.g. 26 . 9124 , 75 . 7873 or coordinates with spaces)
  /\b\d{1,2}\s*\.\s*\d{3,}\s*[,;/]\s*-?\d{1,3}\s*\.\s*\d{3,}\b/gi,
  /\b(latitude|longitude|coords|coordinates)\s*[:=]?\s*[-+]?[\d\s.,+-]{6,}/gi,

  // Google Plus Codes (Open Location Codes - OLC, e.g. 87G8M34X+48 or 7JFJ+R2 Jaipur)
  /\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}(?:\s+[a-zA-Z]+)?\b/gi,

  // What3Words (e.g. ///filled.count.soap or what3words.com/filled.count.soap)
  /(?:\/{3}|what3words\.com\/)[a-zA-Z]{3,}\.[a-zA-Z]{3,}\.[a-zA-Z]{3,}/gi,

  // Map & Live Location URLs (Google Maps, Apple Maps, Waze, Bing Maps, OpenStreetMap)
  /(?:https?:\/\/)?(?:www\.)?(?:maps\.google\.com|goo\.gl\/maps|maps\.app\.goo\.gl|waze\.com|bing\.com\/maps|maps\.apple\.com|openstreetmap\.org)\S*/gi,

  // Live Location Sharing & GPS Tracking Services (Glympse, Apple Find My, Snapchat Snap Map, Strava Beacon, Life360, Zenly, Telegram/WhatsApp Live Location)
  /(?:https?:\/\/)?(?:www\.)?(?:glympse\.com|icloud\.com\/find|map\.snapchat\.com|strava\.com\/beacon|life360\.com|geozilla\.com|zenly\.app)\S*/gi,
  /(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/(?:share\/url\?url=|location|joinchat)\S*/gi,
  /(?:https?:\/\/)?(?:www\.)?(?:wa\.me|api\.whatsapp\.com)\/(?:send\?|location)\S*/gi,

  // URL Shorteners frequently used to disguise location links (bit.ly, tinyurl, t.co, etc.)
  /(?:https?:\/\/)?(?:www\.)?(?:bit\.ly|tinyurl\.com|t\.co|cutt\.ly|is\.gd|rb\.gy|ow\.ly|buff\.ly|rebrand\.ly|shorturl\.at|soo\.gd)\/\S+/gi,

  // Location intent & disclosure phrases
  /\b(my location is|i am at|i'm at|i live in|i live at|current location[:=]|sharing location|share location|meet me at|come to my house|come to my place|track me at|here is my location)\b[^.!?\n]{2,50}/gi,

  // Postal codes / Pin codes with explicit context
  /\b(pin\s*code|pincode|postal\s*code|zip\s*code)[:\s-]*\d{4,6}\b/gi,
];

// Regex patterns to detect personal sensitive information
export const moderationRules: ModerationRule[] = [
  // 1. Location Sharing Prohibition Rules
  ...locationPatterns.map((pattern): ModerationRule => ({
    pattern,
    mask: '[location prohibited]',
    category: 'location',
  })),

  // 2. Phone numbers (10 digits, optional country code, spaces, or dashes)
  {
    pattern: /(\+?\d{1,3}[\s-]?)?\(?\d{3,5}\)?[\s-]?\d{3,5}[\s-]?\d{3,5}/g,
    mask: 'xxxxxxxxxx',
    category: 'phone',
  },

  // 3. Emails
  {
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    mask: '[email hidden]',
    category: 'email',
  },
];

/**
 * Checks specifically if the message attempts to share physical location, GPS coordinates, or addresses.
 */
export function isLocationSharingAttempt(input: string): boolean {
  if (!input) return false;
  return locationPatterns.some((pattern) => {
    pattern.lastIndex = 0;
    const matched = pattern.test(input);
    pattern.lastIndex = 0;
    return matched;
  });
}

/**
 * Moderates user input by masking restricted personal data and flagging prohibited location sharing.
 * @param {string} input - Raw text message typed by user.
 * @returns {ModerationResult} - Object containing masked message, category flags, and violation reasons.
 */
export function moderateChatMessage(input: string): ModerationResult {
  if (!input) {
    return {
      cleanText: '',
      isFlagged: false,
      hasLocationViolation: false,
      hasPhoneViolation: false,
      hasEmailViolation: false,
    };
  }

  let moderatedText = input;
  let hasViolation = false;
  let hasLocationViolation = false;
  let hasPhoneViolation = false;
  let hasEmailViolation = false;

  moderationRules.forEach((rule) => {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(moderatedText)) {
      hasViolation = true;
      if (rule.category === 'location') hasLocationViolation = true;
      if (rule.category === 'phone') hasPhoneViolation = true;
      if (rule.category === 'email') hasEmailViolation = true;

      rule.pattern.lastIndex = 0;
      moderatedText = moderatedText.replace(rule.pattern, rule.mask);
    }
  });

  let prohibitionReason: string | undefined;
  if (hasLocationViolation) {
    prohibitionReason = '🚫 Location sharing is strictly prohibited on Chess.pro for your safety!';
  } else if (hasPhoneViolation) {
    prohibitionReason = '🛡️ Phone numbers are masked to protect your privacy.';
  } else if (hasEmailViolation) {
    prohibitionReason = '🛡️ Email addresses are masked to protect your privacy.';
  }

  return {
    cleanText: moderatedText,
    isFlagged: hasViolation,
    hasLocationViolation,
    hasPhoneViolation,
    hasEmailViolation,
    prohibitionReason,
  };
}

/**
 * Enforces strict prohibition policy for chat messages.
 * Returns whether the message is permitted to be broadcast.
 */
export function checkChatSafety(input: string): {
  allowed: boolean;
  cleanText: string;
  reason?: string;
  isLocationViolation: boolean;
} {
  const result = moderateChatMessage(input);

  if (result.hasLocationViolation) {
    return {
      allowed: false,
      cleanText: result.cleanText,
      reason: '🚫 Location sharing is strictly prohibited on Chess.pro for your safety!',
      isLocationViolation: true,
    };
  }

  return {
    allowed: true,
    cleanText: result.cleanText,
    reason: result.prohibitionReason,
    isLocationViolation: false,
  };
}

export default moderateChatMessage;
