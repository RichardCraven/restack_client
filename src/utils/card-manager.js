import cardsData from '../data/cards.json';
import * as images from './images';

// ─── Monster tier → shard drop chance ────────────────────────────────────────
// Tier 1 (minions/common): 30%, Tier 2: 20%, Tier 3: 12%, Tier 4+: 7%
const TIER_SHARD_CHANCE = { 1: 0.30, 2: 0.20, 3: 0.12, 4: 0.07 };
const DEFAULT_SHARD_CHANCE = 0.15;

export function shardDropChance(monster) {
    if (!monster) return DEFAULT_SHARD_CHANCE;
    const tier = monster.tier || monster.level || 1;
    return TIER_SHARD_CHANCE[Math.min(4, Math.max(1, Number(tier)))] || DEFAULT_SHARD_CHANCE;
}

// ─── Card lookups ─────────────────────────────────────────────────────────────
const ALL_CARDS = cardsData;

export function getEchoCards() {
    return ALL_CARDS.filter(c => c.type === 'echo');
}

export function getReaperCards() {
    return ALL_CARDS.filter(c => c.type === 'reaper_card');
}

export function getEchoCardForMonster(monsterType) {
    return ALL_CARDS.find(c => c.type === 'echo' && c.monsterType === monsterType) || null;
}

export function getCard(id) {
    return ALL_CARDS.find(c => c.id === id) || null;
}

// ─── Crew member → Champion card ─────────────────────────────────────────────
// Class-specific special ability keys
const CLASS_ABILITIES = {
    soldier:  { key: 'shield_wall',   name: 'Shield Wall',   desc: "Reaper's attack this turn deals -2 damage." },
    ranger:   { key: 'pin_shot',      name: 'Pin Shot',      desc: 'Reaper skips one card next turn.' },
    wizard:   { key: 'arcane_burst',  name: 'Arcane Burst',  desc: '+3 bonus ATK added to this turn\'s damage.' },
    monk:     { key: 'inner_focus',   name: 'Inner Focus',   desc: '+1 Energy refunded after playing.' },
    barbarian:{ key: 'rampage',       name: 'Rampage',       desc: '+2 ATK normally; +4 ATK when Soul ≤ 15.' },
    sage:     { key: 'mend',          name: 'Mend',          desc: 'Restore 2 Soul (or 4 with Mend global skill).' },
    summoner: { key: 'echo_call',     name: 'Echo Call',     desc: 'Draw 1 Echo card from deck if one exists.' },
    engineer: { key: 'gadget_bomb',   name: 'Gadget Bomb',   desc: 'Deal 3 damage and reduce next Reaper attack by 1.' },
};

/**
 * Convert a live crew member to a champion card object.
 * Stats are derived from the member's actual stats.
 */
export function crewMemberToCard(member) {
    if (!member) return null;
    const type = (member.type || 'soldier').toLowerCase();
    const stats = member.stats || {};
    // Stat extraction — support multiple stat key formats
    const str  = stats.str  || stats.strength   || stats.atk  || 3;
    const dex  = stats.dex  || stats.dexterity  || stats.spd  || 3;
    const fort = stats.fort || stats.fortitude   || stats.def  || 3;
    const intel = stats.int || stats.intelligence || stats.wis || 3;

    const atk       = 1 + Math.floor(str / 3);
    const dodgeChance = Math.floor(dex * 4); // % value 0–100
    const energyCost  = Math.max(1, 4 - Math.floor(fort / 3));
    const drawBonus   = intel >= 5 ? 1 : 0;
    const ability     = CLASS_ABILITIES[type] || CLASS_ABILITIES.soldier;

    // Portrait image key — try member image key variants
    const portraitKey = member.image || `${type}_portrait` || `${type}`;

    return {
        id: `champion_${member.id || type}`,
        type: 'champion',
        memberId: member.id,
        memberType: type,
        name: member.name || type.charAt(0).toUpperCase() + type.slice(1),
        portrait: images[portraitKey] || images[`${type}_portrait`] || null,
        energyCost,
        atk,
        dodgeChance,
        drawBonus,
        ability,
        level: member.level || 1,
        hp: member.hp,
        maxHp: member.maxHp || member.hp,
        dead: !!member.dead,
    };
}

/**
 * Build the player's full deck:
 * - One champion card per living crew member
 * - Up to 4 active echo cards from meta.echoCards
 */
export function buildPlayerDeck(crew, activeEchoIds) {
    const champions = (crew || [])
        .filter(m => m && !m.dead)
        .map(crewMemberToCard)
        .filter(Boolean);

    const echos = (activeEchoIds || [])
        .slice(0, 4)
        .map(id => getCard(id))
        .filter(Boolean);

    return shuffle([...champions, ...echos]);
}

/**
 * Build the Reaper's AI deck — a fixed set of thematic cards.
 * Cards with higher threat scale up based on dungeon depth.
 */
export function buildReaperDeck(dungeonDepth) {
    const depth = Math.max(1, dungeonDepth || 1);
    // Base deck of card IDs
    const base = [
        'reaper_reap', 'reaper_reap', 'reaper_reap',
        'reaper_death_stare', 'reaper_death_stare',
        'reaper_shroud', 'reaper_shroud',
        'reaper_wither',
    ];

    // Add stronger cards at depth 2+
    if (depth >= 2) {
        base.push('reaper_spectral_army', 'reaper_curse');
    }
    // Add terror cards at depth 3+
    if (depth >= 3) {
        base.push('reaper_torment', 'reaper_soul_harvest');
    }
    // Boost at depth 4+
    if (depth >= 4) {
        base.push('reaper_torment', 'reaper_soul_harvest', 'reaper_spectral_army');
    }

    return shuffle(base.map(id => getCard(id)).filter(Boolean));
}

/**
 * Compute the Reaper's starting Soul based on dungeon depth.
 * Depth 1: 25, each depth adds 5, max 50.
 */
export function reaperStartingSoul(dungeonDepth) {
    const depth = Math.max(1, dungeonDepth || 1);
    return Math.min(50, 20 + depth * 5);
}

/**
 * List which Echo cards can be forged from the given shard counts.
 * Returns array of { cardId, monsterType, canForge, shardsHave, shardsNeeded }
 */
export function getForgeableEchos(soulShards) {
    const shards = soulShards || {};
    return getEchoCards().map(card => ({
        card,
        monsterType: card.monsterType,
        shardsHave: shards[card.monsterType] || 0,
        shardsNeeded: 3,
        canForge: (shards[card.monsterType] || 0) >= 3,
    }));
}

export function shuffle(array) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Default export object for backwards-compat if anything still uses it
export default {
    getCard,
    getEchoCards,
    getReaperCards,
    getEchoCardForMonster,
    crewMemberToCard,
    buildPlayerDeck,
    buildReaperDeck,
    reaperStartingSoul,
    getForgeableEchos,
    shardDropChance,
    shuffle,
};
