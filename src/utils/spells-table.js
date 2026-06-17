// spells-table.js
// Central table for spell/glyph definitions and metadata

export const SPELLS = {
  magicMissile: {
    name: 'Magic Missile',
    prepareTime: 300000, // milliseconds (300 seconds)
    description: 'A basic arcane projectile that never misses.',
    energyCost: 30, // Default energy cost for magic missile
  },
};

// ── Tiered Glyph Definitions ───────────────────────────────────────────────
// Each tier has a fixed number of spell slots. Higher-tier spells consume more
// slots. A glyph stores the chosen spells and fires them all at once in combat.
export const GLYPHS = {
  minor: {
    key: 'minor',
    name: 'Minor Glyph',
    slots: 2,
    icon: 'minor_glyph',
  },
  major: {
    key: 'major',
    name: 'Major Glyph',
    slots: 3,
    icon: 'major_glyph',
  },
  supreme: {
    key: 'supreme',
    name: 'Supreme Glyph',
    slots: 5,
    icon: 'supreme_glyph',
  },
};

// How many glyph slots a spell costs, indexed by spell tier (1–4).
export const GLYPH_SPELL_SLOT_COST = { 1: 1, 2: 2, 3: 3, 4: 4 };

// Prep time (ms) contributed by each spell, by spell tier.
// T1 = 5 min, T2 = 10 min, T3 = 20 min, T4 = 40 min.
export const GLYPH_SPELL_PREP_TIME = { 1: 5 * 60 * 1000, 2: 20 * 60 * 1000, 3: 60 * 60 * 1000, 4: 120 * 60 * 1000 };

/**
 * Compute total glyph preparation time given an array of spell definitions
 * (each with a `tier` property). Returns milliseconds.
 */
export function computeGlyphPrepTime(spellDefs) {
  return spellDefs.reduce((sum, s) => {
    const tier = s.tier || 1;
    return sum + (GLYPH_SPELL_PREP_TIME[tier] || GLYPH_SPELL_PREP_TIME[1]);
  }, 0);
}

// Ritual definitions — each has a stable key, display name, description, and prep time.
// Shortest ritual is 1 hour (3 600 000 ms); others are 3h and 6h.
export const RITUALS = {
  veilOfShadows: {
    key: 'veilOfShadows',
    name: 'Veil of Shadows',
    icon: 'eclipse',
    prepareTime: 60 * 60 * 1000,           // 1 hour
    description: 'Weaves a cloak of living shadow around the party. Enemies have a 20% chance to miss all attacks for the next combat encounter.',
    flavorText: '"The darkness is not empty — it breathes."',
  },
  wardingCircle: {
    key: 'wardingCircle',
    name: 'Warding Circle',
    icon: 'magic_moon_1',
    prepareTime: 3 * 60 * 60 * 1000,        // 3 hours
    description: 'Inscribes a protective sigil on every party member. Reduces incoming damage by 15% and grants immunity to fear for two combat encounters.',
    flavorText: '"Draw the line. Nothing crosses it."',
  },
  riftBinding: {
    key: 'riftBinding',
    name: 'Rift Binding',
    icon: 'glyph_inverted',
    prepareTime: 6 * 60 * 60 * 1000,        // 6 hours
    description: 'Opens a momentary tear between planes and anchors it to the caster\'s will. On use, teleports the entire party past the next locked gate or sealed passage.',
    flavorText: '"Space is merely a suggestion to those who know how to argue."',
  },
};

// Camp cooking recipes — each has a stable key, display name, description, cooking time,
// food cost (deducted immediately on start) and food yield (added on completion).
export const RECIPES = {
  fieldBroth: {
    key: 'fieldBroth',
    name: 'Field Broth',
    icon: '🍲',
    cookTime: 30 * 60 * 1000,        // 30 minutes
    foodCost: 20,
    foodYield: 50,
    description: 'A quick, nourishing broth made from camp rations. Simple but effective.',
  },
  heartySoup: {
    key: 'heartySoup',
    name: 'Hearty Soup',
    icon: '🥘',
    cookTime: 2 * 60 * 60 * 1000,    // 2 hours
    foodCost: 50,
    foodYield: 120,
    description: 'A thick, slow-cooked stew that fortifies the crew for hard days ahead.',
  },
  ironFeast: {
    key: 'ironFeast',
    name: 'Iron Feast',
    icon: '🍖',
    cookTime: 6 * 60 * 60 * 1000,    // 6 hours
    foodCost: 100,
    foodYield: 250,
    description: 'A legendary camp meal. Takes all day, feeds the crew like kings.',
  },
};
