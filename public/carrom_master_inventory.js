// ============================================================================
// FILE: carrom_master_inventory.js
// Description: Master Inventory Data for Strikers, Powers, Pucks, Trails & Pockets
// ============================================================================

export const CARROM_SHOP_DATA = {

  // --------------------------------------------------------------------------
  // 1. STRIKERS CATALOG (Grouped by Rarity: Mythic, Legendary, Epic, Rare, Standard)
  // --------------------------------------------------------------------------
  strikers: [
    // Standard / Default
    { id: "str_blaze", name: "Blaze", rarity: "STANDARD", source: "Default", price: { type: "coins", amount: 0 }, stats: { force: 3, aim: 2, time: 2 } },
    { id: "str_zen", name: "Zen", rarity: "STANDARD", source: "Delhi Lounge +", price: { type: "coins", amount: 1000 }, stats: { force: 2, aim: 3, time: 2 } },
    { id: "str_vega", name: "Vega", rarity: "STANDARD", source: "London Park +", price: { type: "coins", amount: 1200 }, stats: { force: 3, aim: 2, time: 3 } },
    { id: "str_taj", name: "Taj", rarity: "STANDARD", source: "Delhi Lounge +", price: { type: "coins", amount: 1500 }, stats: { force: 3, aim: 3, time: 2 } },
    { id: "str_chakra", name: "Chakra", rarity: "STANDARD", source: "Delhi Lounge +", price: { type: "coins", amount: 1500 }, stats: { force: 2, aim: 4, time: 2 } },
    { id: "str_starlight", name: "Starlight", rarity: "STANDARD", source: "Cairo Gallery +", price: { type: "coins", amount: 1800 }, stats: { force: 4, aim: 2, time: 2 } },
    { id: "str_star", name: "S.T.A.R.", rarity: "STANDARD", source: "London Park +", price: { type: "coins", amount: 2000 }, stats: { force: 3, aim: 3, time: 3 } },
    { id: "str_hound", name: "Hound", rarity: "STANDARD", source: "London Park +", price: { type: "coins", amount: 2000 }, stats: { force: 4, aim: 2, time: 3 } },

    // Mythic
    { id: "str_astro", name: "Astro", rarity: "MYTHIC", source: "Events +", price: { type: "gems", amount: 300 }, stats: { force: 9, aim: 8, time: 7 } },
    { id: "str_pulse", name: "Pulse", rarity: "MYTHIC", source: "Events +", price: { type: "gems", amount: 300 }, stats: { force: 8, aim: 9, time: 7 } },

    // Legendary
    { id: "str_trace", name: "Trace", rarity: "LEGENDARY", source: "Flashback +", price: { type: "gems", amount: 150 }, stats: { force: 7, aim: 7, time: 6 } },
    { id: "str_aman", name: "Aman", rarity: "LEGENDARY", source: "Flashback +", price: { type: "gems", amount: 150 }, stats: { force: 8, aim: 6, time: 6 } },
    { id: "str_toran", name: "Toran", rarity: "LEGENDARY", source: "Flashback +", price: { type: "gems", amount: 150 }, stats: { force: 6, aim: 8, time: 6 } },
    { id: "str_digitriker", name: "Digitriker", rarity: "LEGENDARY", source: "Flashback +", price: { type: "gems", amount: 160 }, stats: { force: 7, aim: 7, time: 7 } },
    { id: "str_abeer", name: "Abeer", rarity: "LEGENDARY", source: "Flashback +", price: { type: "gems", amount: 160 }, stats: { force: 8, aim: 7, time: 5 } },
    { id: "str_superstar", name: "Superstar", rarity: "LEGENDARY", source: "Flashback +", price: { type: "gems", amount: 180 }, stats: { force: 9, aim: 6, time: 6 } },
    { id: "str_rr", name: "RR", rarity: "LEGENDARY", source: "Flashback +", price: { type: "gems", amount: 170 }, stats: { force: 7, aim: 8, time: 6 } },
    { id: "str_gyaani", name: "Gyaani", rarity: "LEGENDARY", source: "Collectors +", price: { type: "gems", amount: 175 }, stats: { force: 8, aim: 8, time: 5 } },
    { id: "str_aqua", name: "Aqua", rarity: "LEGENDARY", source: "Flashback +", price: { type: "gems", amount: 150 }, stats: { force: 6, aim: 9, time: 6 } },
    { id: "str_drishti", name: "Drishti", rarity: "LEGENDARY", source: "Login Calendar +", price: { type: "gems", amount: 160 }, stats: { force: 8, aim: 7, time: 7 } },
    { id: "str_bio", name: "Bio", rarity: "LEGENDARY", source: "Offers +", price: { type: "gems", amount: 180 }, stats: { force: 9, aim: 7, time: 6 } },
    { id: "str_bushi", name: "Bushi", rarity: "LEGENDARY", source: "Collectors +", price: { type: "gems", amount: 180 }, stats: { force: 7, aim: 9, time: 6 } },
    { id: "str_cyclops", name: "Cyclops", rarity: "LEGENDARY", source: "Grand Master Chest", price: { type: "gems", amount: 200 }, stats: { force: 9, aim: 8, time: 7 } },
    { id: "str_xolotl", name: "Xolotl", rarity: "LEGENDARY", source: "Grand Master Chest", price: { type: "gems", amount: 200 }, stats: { force: 8, aim: 9, time: 7 } },
    { id: "str_devi", name: "Devi", rarity: "LEGENDARY", source: "Flashback +", price: { type: "gems", amount: 190 }, stats: { force: 9, aim: 9, time: 6 } },
    { id: "str_neon", name: "Neon", rarity: "LEGENDARY", source: "Grand Master Chest", price: { type: "gems", amount: 200 }, stats: { force: 9, aim: 8, time: 8 } },
    { id: "str_dew", name: "Dew", rarity: "LEGENDARY", source: "Premium +", price: { type: "gems", amount: 170 }, stats: { force: 7, aim: 8, time: 7 } },
    { id: "str_simhakt", name: "Simhakt", rarity: "LEGENDARY", source: "Collectors +", price: { type: "gems", amount: 180 }, stats: { force: 8, aim: 8, time: 7 } },
    { id: "str_sweep", name: "Sweep", rarity: "LEGENDARY", source: "Grand Master Chest", price: { type: "gems", amount: 190 }, stats: { force: 8, aim: 9, time: 6 } },
    { id: "str_bhai", name: "Bhai", rarity: "LEGENDARY", source: "Grand Master Chest", price: { type: "gems", amount: 190 }, stats: { force: 9, aim: 7, time: 7 } },
    { id: "str_deathstrike", name: "Deathstrike", rarity: "LEGENDARY", source: "Grand Master Chest", price: { type: "gems", amount: 210 }, stats: { force: 10, aim: 8, time: 6 } },

    // Epic
    { id: "str_surge", name: "Surge", rarity: "EPIC", source: "Flashback +", price: { type: "coins", amount: 8000 }, stats: { force: 6, aim: 5, time: 5 } },
    { id: "str_spade", name: "Spade", rarity: "EPIC", source: "Carrom Trials +", price: { type: "coins", amount: 8000 }, stats: { force: 5, aim: 6, time: 5 } },
    { id: "str_sniper", name: "Sniper", rarity: "EPIC", source: "Paris Stage +", price: { type: "coins", amount: 9000 }, stats: { force: 4, aim: 8, time: 4 } },
    { id: "str_trifecta", name: "Trifecta", rarity: "EPIC", source: "Flashback +", price: { type: "coins", amount: 8500 }, stats: { force: 6, aim: 6, time: 5 } },
    { id: "str_shobha", name: "Shobha", rarity: "EPIC", source: "Flashback +", price: { type: "coins", amount: 8500 }, stats: { force: 5, aim: 7, time: 5 } },
    { id: "str_treant", name: "Treant", rarity: "EPIC", source: "Delhi Lounge +", price: { type: "coins", amount: 7500 }, stats: { force: 7, aim: 4, time: 5 } },
    { id: "str_ninja", name: "Ninja", rarity: "EPIC", source: "Frenzy +", price: { type: "coins", amount: 9500 }, stats: { force: 6, aim: 8, time: 5 } },
    { id: "str_lightning", name: "Lightning", rarity: "EPIC", source: "Flashback +", price: { type: "coins", amount: 9000 }, stats: { force: 8, aim: 5, time: 5 } },
    { id: "str_cosmos", name: "Cosmos", rarity: "EPIC", source: "Frenzy +", price: { type: "coins", amount: 9000 }, stats: { force: 7, aim: 6, time: 6 } },
    { id: "str_shaman", name: "Shaman", rarity: "EPIC", source: "Dubai Skybar +", price: { type: "coins", amount: 10000 }, stats: { force: 6, aim: 7, time: 6 } },
    { id: "str_umbrella", name: "Umbrella", rarity: "EPIC", source: "Dubai Skybar +", price: { type: "coins", amount: 10000 }, stats: { force: 5, aim: 8, time: 5 } },
    { id: "str_dragonstar", name: "Dragon Star", rarity: "EPIC", source: "Mumbai Arena +", price: { type: "coins", amount: 11000 }, stats: { force: 8, aim: 6, time: 5 } }
  ],

  // --------------------------------------------------------------------------
  // 2. POWERS UPGRADES
  // --------------------------------------------------------------------------
  powers: [
    { id: "pwr_blaze", name: "Blaze Power", isUnlocked: true, force: 8, aim: 6, time: 5, pointsRequired: 0, price: { type: "coins", amount: 0 } },
    { id: "pwr_spine", name: "Spine", isUnlocked: false, force: 2, aim: 3, time: 2, pointsRequired: 20, price: { type: "coins", amount: 2500 } },
    { id: "pwr_venom", name: "Venom", isUnlocked: false, force: 3, aim: 2, time: 3, pointsRequired: 20, price: { type: "coins", amount: 2500 } },
    { id: "pwr_particle", name: "Particle", isUnlocked: false, force: 4, aim: 4, time: 3, pointsRequired: 25, price: { type: "gems", amount: 50 } },
    { id: "pwr_radiance", name: "Radiance", isUnlocked: false, force: 5, aim: 3, time: 4, pointsRequired: 25, price: { type: "gems", amount: 50 } },
    { id: "pwr_reptile", name: "Reptile", isUnlocked: false, force: 4, aim: 5, time: 3, pointsRequired: 30, price: { type: "coins", amount: 5000 } },
    { id: "pwr_roulette", name: "Roulette", isUnlocked: false, force: 6, aim: 4, time: 3, pointsRequired: 30, price: { type: "coins", amount: 5000 } },
    { id: "pwr_wave", name: "Wave", isUnlocked: false, force: 5, aim: 5, time: 4, pointsRequired: 35, price: { type: "gems", amount: 75 } },
    { id: "pwr_petal", name: "Petal", isUnlocked: false, force: 4, aim: 6, time: 4, pointsRequired: 35, price: { type: "gems", amount: 75 } },
    { id: "pwr_gaia", name: "Gaia", isUnlocked: false, force: 6, aim: 6, time: 4, pointsRequired: 40, price: { type: "gems", amount: 100 } },
    { id: "pwr_crystal", name: "Crystal", isUnlocked: false, force: 5, aim: 7, time: 5, pointsRequired: 40, price: { type: "gems", amount: 100 } },
    { id: "pwr_target", name: "Target", isUnlocked: false, force: 7, aim: 7, time: 5, pointsRequired: 45, price: { type: "gems", amount: 120 } }
  ],

  // --------------------------------------------------------------------------
  // 3. PUCKS CATALOG
  // --------------------------------------------------------------------------
  pucks: [
    { id: "puck_black_std", name: "Black Standard", rarity: "STANDARD", source: "Default", price: { type: "coins", amount: 0 } },
    { id: "puck_white_std", name: "White Standard", rarity: "STANDARD", source: "Default", price: { type: "coins", amount: 0 } },
    { id: "puck_vervain", name: "Vervain", rarity: "STANDARD", source: "Paris Stage +", price: { type: "coins", amount: 1500 } },
    { id: "puck_oscar", name: "Oscar", rarity: "STANDARD", source: "London Park +", price: { type: "coins", amount: 2000 } },
    { id: "puck_milo", name: "Milo", rarity: "STANDARD", source: "Istanbul Bazaar +", price: { type: "coins", amount: 2500 } },
    { id: "puck_titan", name: "Titan", rarity: "STANDARD", source: "Istanbul Bazaar +", price: { type: "coins", amount: 2500 } },
    { id: "puck_enchant", name: "Enchant", rarity: "RARE", source: "Delhi Lounge +", price: { type: "coins", amount: 3500 } },
    { id: "puck_saffron", name: "Saffron", rarity: "RARE", source: "London Park +", price: { type: "coins", amount: 4000 } },
    { id: "puck_surya", name: "Surya", rarity: "RARE", source: "Istanbul Bazaar +", price: { type: "coins", amount: 4500 } },
    { id: "puck_nuke", name: "Nuke", rarity: "RARE", source: "Cairo Gallery +", price: { type: "coins", amount: 5000 } },
    { id: "puck_magma", name: "Magma", rarity: "RARE", source: "Cairo Gallery +", price: { type: "coins", amount: 5000 } },
    { id: "puck_lockdown", name: "Lockdown", rarity: "RARE", source: "Flashback +", price: { type: "coins", amount: 6000 } },
    { id: "puck_stardust", name: "Stardust", rarity: "EPIC", source: "Delhi Lounge +", price: { type: "gems", amount: 45 } },
    { id: "puck_moon", name: "Moon", rarity: "EPIC", source: "London Park +", price: { type: "gems", amount: 50 } },
    { id: "puck_candy", name: "Candy", rarity: "EPIC", source: "Istanbul Bazaar +", price: { type: "gems", amount: 60 } },
    { id: "puck_tron", name: "Tron", rarity: "EPIC", source: "Cairo Gallery +", price: { type: "gems", amount: 75 } },
    { id: "puck_king", name: "King", rarity: "EPIC", source: "Singapore Plaza +", price: { type: "gems", amount: 80 } },
    { id: "puck_neon", name: "Neon", rarity: "EPIC", source: "Singapore Plaza +", price: { type: "gems", amount: 80 } }
  ],

  // --------------------------------------------------------------------------
  // 4. TRAILS CATALOG
  // --------------------------------------------------------------------------
  trails: [
    { id: "trl_none", name: "No Trail", rarity: "STANDARD", source: "Default", price: { type: "coins", amount: 0 } },
    { id: "trl_verdant", name: "Verdant", rarity: "STANDARD", source: "Events", price: { type: "coins", amount: 3000 } },
    { id: "trl_burst", name: "Burst", rarity: "STANDARD", source: "Events", price: { type: "coins", amount: 3000 } },
    { id: "trl_death", name: "Death", rarity: "RARE", source: "Events", price: { type: "coins", amount: 6000 } },
    { id: "trl_slash", name: "Slash", rarity: "RARE", source: "Events", price: { type: "coins", amount: 6000 } },
    { id: "trl_flame", name: "Flame", rarity: "RARE", source: "Events", price: { type: "coins", amount: 6500 } },
    { id: "trl_smash", name: "Smash", rarity: "RARE", source: "Cinema Party +", price: { type: "coins", amount: 7000 } },
    { id: "trl_blueray", name: "BlueRay", rarity: "RARE", source: "Cinema Party +", price: { type: "coins", amount: 7000 } },
    { id: "trl_rainbow", name: "Rainbow", rarity: "EPIC", source: "Flashback +", price: { type: "gems", amount: 75 } },
    { id: "trl_ignis7", name: "Ignis7", rarity: "LEGENDARY", source: "Flashback +", price: { type: "gems", amount: 120 } },
    { id: "trl_cinematic", name: "Cinematic", rarity: "LEGENDARY", source: "Flashback +", price: { type: "gems", amount: 130 } },
    { id: "trl_novachip", name: "Novachip", rarity: "LEGENDARY", source: "Flashback +", price: { type: "gems", amount: 140 } },
    { id: "trl_spotlight", name: "Spotlight", rarity: "LEGENDARY", source: "Flashback +", price: { type: "gems", amount: 140 } },
    { id: "trl_abyss", name: "Abyss", rarity: "LEGENDARY", source: "Flashback +", price: { type: "gems", amount: 150 } }
  ],

  // --------------------------------------------------------------------------
  // 5. POCKETS CATALOG
  // --------------------------------------------------------------------------
  pockets: [
    { id: "pkt_none", name: "No Pocket Effect", rarity: "STANDARD", source: "Default", price: { type: "coins", amount: 0 } },
    { id: "pkt_firestarter", name: "Firestarter", rarity: "STANDARD", source: "Shop", price: { type: "gems", amount: 50 } },
    { id: "pkt_jade_echo", name: "Jade Echo", rarity: "RARE", source: "Shop", price: { type: "coins", amount: 12000 } },
    { id: "pkt_mystic", name: "Mystic", rarity: "EPIC", source: "Coming Soon", price: { type: "gems", amount: 90 } },
    { id: "pkt_plasma", name: "Plasma", rarity: "EPIC", source: "Shop", price: { type: "gems", amount: 100 } }
  ]
};
