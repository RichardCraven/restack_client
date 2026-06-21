/**
 * ShrineScreen.js
 *
 * Full-screen animated shrine encounter. Replaces the old popup + timer overlay.
 *
 * Layout:
 *   - 8 × 6 grid (same tile size as combat = 100px)
 *   - Stone floor tiles at low opacity as background per cell
 *   - Shrine icon centered at top row (row 0, col 4)
 *   - Crew units start at bottom row (row 5), shrine-class member centered
 *   - Cinematic: shrine unit walks upward; monsters spawn at mid-point from edges
 *   - Concentration phase: 6 rounds of auto-combat
 *   - Success / failure callbacks
 */

import React from 'react';
import * as images from '../../utils/images';

// ── Grid constants ────────────────────────────────────────────────────────────
const COLS = 8;
const ROWS = 6;
const TILE_SIZE = 100;

const SHRINE_COL = Math.floor(COLS / 2); // col 4
const SHRINE_ROW = 0;
const CREW_ROW = ROWS - 1; // row 5

const TOTAL_ROUNDS = 6;
const ROUND_DURATION_MS = 2000;
const MOVE_INTERVAL_MS = 800; // ms per tile move in cinematic

// How close (rows) the shrine unit needs to be to start concentrating
const CONCENTRATE_DISTANCE = 1;

// Seed stone tile assignment per cell
const STONE_TILES_COUNT = 16; // terrain_1 … terrain_16

// Resolve portrait key → URL (mirrors CombatGrid.resolvePortrait)
const resolvePortrait = (portraitVal) => {
    if (!portraitVal) return '';
    if (typeof portraitVal === 'string') {
        const mapped = images[portraitVal];
        if (mapped) return mapped.default || mapped;
        return portraitVal;
    }
    if (typeof portraitVal === 'object') return portraitVal.default || '';
    return '';
};

// Get a crew member's portrait image
const crewPortrait = (member) => {
    if (!member) return '';
    const type = (member.type || member.image || '').toLowerCase();
    // Try portrait key first, then type-named image
    const key = type + '_portrait';
    if (images[key]) return images[key].default || images[key];
    if (images[type]) return images[type].default || images[type];
    return '';
};

// HP for crew: use stats.hp, starting_hp or a default
const getMemberHp = (member) => {
    if (!member) return 60;
    const s = member.stats || {};
    return s.hp || member.starting_hp || 60;
};

// ATK for crew
const getMemberAtk = (member) => {
    if (!member) return 8;
    const s = member.stats || {};
    return s.atk || 8;
};

// DEF for crew
const getMemberDef = (member) => {
    if (!member) return 5;
    const s = member.stats || {};
    return s.def || 5;
};

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

// ── Component ─────────────────────────────────────────────────────────────────

class ShrineScreen extends React.Component {
    // props:
    //   shrineData   - { tile, shrineClass, shrineKey, matchingMember }
    //   crew         - array of crew member objects
    //   monsterManager - for getRandomMonsterByTier
    //   onShrineComplete(result) - called with { success, shrineData, selectedSkill? }

    constructor(props) {
        super(props);

        const { shrineData, crew } = props;
        const shrineClass = shrineData && shrineData.shrineClass;

        // --- Build crew unit list ---
        // shrine-class member goes to center col, flankers around it
        const crewMembers = (crew || []).filter(m => m && (m.type || m.image));
        const shrineUnitIdx = shrineClass
            ? crewMembers.findIndex(m => (m.type || m.image || '').toLowerCase() === shrineClass.toLowerCase())
            : -1;

        // Arrange positions: center = SHRINE_COL, then alternate left/right
        const crewPositions = this._buildCrewPositions(crewMembers, shrineUnitIdx);

        // --- Stone tile assignment (seeded by position) ---
        const stoneTileMap = {};
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                stoneTileMap[`${c}_${r}`] = ((r * COLS + c * 3 + 7) % STONE_TILES_COUNT) + 1;
            }
        }

        this.state = {
            // ── Phase: 'enter' | 'cinematic' | 'concentration' | 'done'
            phase: 'enter',

            // ── Stone floor
            stoneTileMap,

            // ── Units (crew + monsters): { id, role:'crew'|'shrine_unit'|'monster', type, name, portrait, col, row, hp, maxHp, atk, def, dead: false, isConcentrating: false }
            units: crewPositions,

            // ── Monsters (spawned later)
            monstersSpawned: false,

            // ── Progress (concentration rounds)
            currentRound: 0,
            totalRounds: TOTAL_ROUNDS,

            // ── Log messages
            log: [],

            // ── Outcome
            outcome: null, // 'success' | 'failure'

            // ── Skill-select (after success)
            showSkillSelect: false,
        };

        this._moveInterval = null;
        this._roundInterval = null;
    }

    // Distribute crew across bottom row, centering the shrine-class unit
    _buildCrewPositions(crewMembers, shrineUnitIdx) {
        if (!crewMembers.length) return [];

        const centerCol = SHRINE_COL;
        // Generate column offsets from center: 0, +1, -1, +2, -2, …
        const offsets = [0];
        for (let i = 1; i <= Math.ceil(crewMembers.length / 2); i++) {
            offsets.push(i);
            offsets.push(-i);
        }

        // Rotate so shrine unit is at offset 0 (center)
        // Put shrine unit first in order, then others
        const ordered = [];
        if (shrineUnitIdx >= 0) {
            ordered.push(crewMembers[shrineUnitIdx]);
            crewMembers.forEach((m, i) => { if (i !== shrineUnitIdx) ordered.push(m); });
        } else {
            ordered.push(...crewMembers);
        }

        return ordered.map((member, i) => {
            const col = Math.max(0, Math.min(COLS - 1, centerCol + offsets[i]));
            const role = i === 0 && shrineUnitIdx >= 0 ? 'shrine_unit' : 'crew';
            const maxHp = getMemberHp(member);
            const type = (member.type || member.image || '').toLowerCase();
            return {
                id: `crew_${member.id || type || i}`,
                role,
                type,
                name: member.name || capitalize(type),
                portrait: crewPortrait(member),
                col,
                row: CREW_ROW,
                hp: maxHp,
                maxHp,
                atk: getMemberAtk(member),
                def: getMemberDef(member),
                dead: false,
                isConcentrating: false,
                member,
            };
        });
    }

    componentDidMount() {
        // Short enter delay, then start cinematic
        setTimeout(() => {
            this.setState({ phase: 'cinematic' }, () => {
                this._startCinematic();
            });
        }, 1800);
    }

    componentWillUnmount() {
        clearInterval(this._moveInterval);
        clearInterval(this._roundInterval);
    }

    // ── Cinematic Phase ───────────────────────────────────────────────────────

    _startCinematic() {
        // Tick: move units each MOVE_INTERVAL_MS
        this._moveInterval = setInterval(() => {
            this._cinematicTick();
        }, MOVE_INTERVAL_MS);
    }

    _cinematicTick() {
        this.setState(prev => {
            if (prev.phase !== 'cinematic') return null;

            const units = prev.units.map(u => ({ ...u }));
            const shrineUnit = units.find(u => u.role === 'shrine_unit');
            let monstersSpawned = prev.monstersSpawned;
            let newLog = [...prev.log];
            let nextPhase = 'cinematic';

            if (!shrineUnit || shrineUnit.dead) {
                clearInterval(this._moveInterval);
                return { phase: 'done', outcome: 'failure' };
            }

            // Move shrine unit toward shrine (decrease row)
            if (shrineUnit.row > SHRINE_ROW + CONCENTRATE_DISTANCE) {
                shrineUnit.row -= 1;
            }

            // Once shrine unit reaches midpoint (row 3), spawn monsters
            if (!monstersSpawned && shrineUnit.row <= Math.floor(ROWS / 2)) {
                monstersSpawned = true;
                const newMonsters = this._createMonsters();
                newMonsters.forEach(m => units.push(m));
                newLog = [...newLog, `⚠️ Guardians of the shrine emerge from the shadows!`];
            }

            // Move monsters toward shrine unit
            units.filter(u => u.role === 'monster' && !u.dead).forEach(mob => {
                const dx = shrineUnit.col - mob.col;
                const dy = shrineUnit.row - mob.row;
                // Move one step per tick (prefer row movement first)
                if (Math.abs(dy) >= Math.abs(dx)) {
                    mob.row += Math.sign(dy);
                } else {
                    mob.col += Math.sign(dx);
                }
                mob.col = Math.max(0, Math.min(COLS - 1, mob.col));
                mob.row = Math.max(0, Math.min(ROWS - 1, mob.row));
            });

            // Move crew members toward nearest monster
            units.filter(u => u.role === 'crew' && !u.dead).forEach(crew => {
                const mobs = units.filter(u => u.role === 'monster' && !u.dead);
                if (!mobs.length) return;
                const target = mobs.reduce((closest, mob) => {
                    const distA = Math.abs(crew.col - mob.col) + Math.abs(crew.row - mob.row);
                    const distB = Math.abs(crew.col - closest.col) + Math.abs(crew.row - closest.row);
                    return distA < distB ? mob : closest;
                }, mobs[0]);
                const dx = target.col - crew.col;
                const dy = target.row - crew.row;
                if (Math.abs(dy) >= Math.abs(dx)) {
                    crew.row += Math.sign(dy);
                } else {
                    crew.col += Math.sign(dx);
                }
                crew.col = Math.max(0, Math.min(COLS - 1, crew.col));
                crew.row = Math.max(0, Math.min(ROWS - 1, crew.row));
            });

            // Check: is shrine unit adjacent to shrine?
            if (shrineUnit.row <= SHRINE_ROW + CONCENTRATE_DISTANCE) {
                shrineUnit.row = SHRINE_ROW + CONCENTRATE_DISTANCE;
                shrineUnit.isConcentrating = true;
                clearInterval(this._moveInterval);
                nextPhase = 'concentration';
                newLog = [...newLog, `🧘 ${shrineUnit.name} kneels before the shrine and begins the communion…`];
            }

            return {
                units,
                monstersSpawned,
                log: newLog.slice(-6),
                phase: nextPhase,
            };
        }, () => {
            if (this.state.phase === 'concentration') {
                this._startConcentration();
            }
        });
    }

    _createMonsters() {
        const { monsterManager } = this.props;
        const monsters = [];
        for (let i = 0; i < 2; i++) {
            let mob = null;
            try {
                mob = monsterManager && monsterManager.getRandomMonsterByTier(1);
            } catch (e) {}
            if (!mob) {
                mob = {
                    type: i === 0 ? 'goblin' : 'skeleton',
                    key: i === 0 ? 'goblin' : 'skeleton',
                    stats: { hp: 38, atk: 6, def: 4 },
                    portrait: i === 0 ? images['goblin_portrait'] : images['skeleton_portrait'],
                    monster_names: [i === 0 ? 'Wiggit' : 'Bones'],
                };
            }
            const maxHp = mob.stats ? mob.stats.hp : 40;
            const name = (mob.monster_names && mob.monster_names.length)
                ? mob.monster_names[Math.floor(Math.random() * mob.monster_names.length)]
                : (mob.type ? capitalize(mob.type) : 'Guardian');
            monsters.push({
                id: `monster_${i}_${Date.now()}`,
                role: 'monster',
                type: mob.type || mob.key || 'monster',
                name,
                portrait: resolvePortrait(mob.portrait),
                col: i === 0 ? 0 : COLS - 1,
                row: 2 + Math.floor(Math.random() * 2),
                hp: maxHp,
                maxHp,
                atk: mob.stats ? mob.stats.atk : 6,
                def: mob.stats ? mob.stats.def : 3,
                dead: false,
                isConcentrating: false,
            });
        }
        return monsters;
    }

    // ── Concentration Phase ───────────────────────────────────────────────────

    _startConcentration() {
        this._roundInterval = setInterval(() => {
            this._doRound();
        }, ROUND_DURATION_MS);
    }

    _doRound() {
        this.setState(prev => {
            if (prev.phase !== 'concentration') return null;

            const units = prev.units.map(u => ({ ...u }));
            const shrineUnit = units.find(u => u.role === 'shrine_unit');
            const aliveMonsters = units.filter(u => u.role === 'monster' && !u.dead);
            const aliveCrewDefenders = units.filter(u => u.role === 'crew' && !u.dead);

            let newLog = [...prev.log];
            let newRound = prev.currentRound + 1;

            if (!shrineUnit || shrineUnit.dead) {
                clearInterval(this._roundInterval);
                return { phase: 'done', outcome: 'failure', log: [...newLog, `💀 The communion has been broken!`].slice(-6) };
            }

            // --- Monsters attack shrine unit ---
            aliveMonsters.forEach(mob => {
                if (shrineUnit.dead) return;
                const baseDmg = mob.atk || 6;
                const dmg = Math.max(1, Math.floor(baseDmg * (0.7 + Math.random() * 0.6)) - Math.floor((shrineUnit.def || 3) * 0.3));
                const unitInState = units.find(u => u.id === shrineUnit.id);
                if (unitInState) {
                    unitInState.hp = Math.max(0, unitInState.hp - dmg);
                    newLog = [...newLog, `⚔️ ${mob.name} strikes ${shrineUnit.name} for ${dmg} damage!`];
                    if (unitInState.hp <= 0) {
                        unitInState.dead = true;
                        unitInState.isConcentrating = false;
                    }
                }
            });

            // Check shrine unit died
            const shrineUnitUpdated = units.find(u => u.role === 'shrine_unit');
            if (shrineUnitUpdated && shrineUnitUpdated.dead) {
                clearInterval(this._roundInterval);
                return {
                    units,
                    currentRound: newRound,
                    log: [...newLog, `💀 The communion was broken. ${shrineUnitUpdated.name} has fallen.`].slice(-6),
                    phase: 'done',
                    outcome: 'failure',
                };
            }

            // --- Crew attack monsters ---
            aliveCrewDefenders.forEach(crewMember => {
                const liveMobs = units.filter(u => u.role === 'monster' && !u.dead);
                if (!liveMobs.length) return;
                const target = liveMobs[0];
                const baseDmg = crewMember.atk || 8;
                const dmg = Math.max(1, Math.floor(baseDmg * (0.6 + Math.random() * 0.8)) - Math.floor((target.def || 3) * 0.4));
                const mobInState = units.find(u => u.id === target.id);
                if (mobInState) {
                    mobInState.hp = Math.max(0, mobInState.hp - dmg);
                    newLog = [...newLog, `🗡️ ${crewMember.name} attacks ${target.name} for ${dmg} damage!`];
                    if (mobInState.hp <= 0) {
                        mobInState.dead = true;
                        newLog = [...newLog, `💀 ${target.name} has been slain!`];
                    }
                }
            });

            // Check if all rounds complete → success
            if (newRound >= TOTAL_ROUNDS) {
                clearInterval(this._roundInterval);
                // Kill all monsters
                units.filter(u => u.role === 'monster').forEach(m => { m.dead = true; });
                return {
                    units,
                    currentRound: newRound,
                    log: [...newLog, `✨ The communion is complete! The shrine's power flows through ${shrineUnitUpdated ? shrineUnitUpdated.name : 'the champion'}!`].slice(-6),
                    phase: 'done',
                    outcome: 'success',
                    showSkillSelect: true,
                };
            }

            return {
                units,
                currentRound: newRound,
                log: newLog.slice(-6),
            };
        });
    }

    // ── Skill-select helpers (mirrored from DungeonPage globalSkillsByClass) ──

    _getGlobalSkillsByClass() {
        return {
            ranger:   [{ key: 'keen_eye', name: 'Keen Eye', desc: 'Reveals +2 fog tiles on miniboard entry' }, { key: 'hunters_quarry', name: "Hunter's Quarry", desc: '+10% food drop on monster defeat' }, { key: 'read_the_land', name: 'Read the Land', desc: 'Adjacent tile types hinted on entry' }, { key: 'trailblaze', name: 'Trailblaze', desc: 'Visual breadcrumb to last camp spot' }, { key: 'scrounging_rat', name: 'Scrounging Rat', desc: 'Forage for food in camp: 15-30 food (3h) / 30-50 food (2h) / 50-80 food (1h).' }, { key: 'fastidious_crow', name: 'Fastidious Crow', desc: 'Scout a 10x10 board area for 24h.' }],
            sage:     [{ key: 'herbalism', name: 'Herbalism', desc: 'Camp costs 1 less food per member' }, { key: 'mend', name: 'Mend', desc: 'Out-of-combat potions restore +15% HP' }, { key: 'ritual_efficiency', name: 'Ritual Efficiency', desc: 'Ritual prep time -25%' }, { key: 'revive', name: 'Revive', desc: 'Once per run: fallen member revived at 25% HP' }, { key: 'awake_refreshed', name: 'Awake Refreshed', desc: 'Recuperates an additional +10/+20/+40 Resolve after camping.' }],
            soldier:  [{ key: 'fortify', name: 'Fortify', desc: 'Resolve does not decay while camping' }, { key: 'breacher', name: 'Breacher', desc: 'Force open a Minor Key gate once per level' }, { key: 'rally', name: 'Rally', desc: '+5 bonus Resolve on combat victory' }, { key: 'iron_will', name: 'Iron Will', desc: "Party Resolve never drops below 20 from deaths" }, { key: 'awake_refreshed', name: 'Awake Refreshed', desc: 'Recuperates an additional +10/+20/+40 Resolve after camping.' }, { key: 'strong_resolve', name: 'Strong Resolve', desc: 'Reduces Resolve penalties by 40%/75%/90%.' }],
            wizard:   [{ key: 'arcane_sense', name: 'Arcane Sense', desc: 'Identifies chest tier before opening' }, { key: 'ley_tap', name: 'Ley Tap', desc: 'Draw energy at Magic Nexus — recover 15% endurance' }, { key: 'dimensional_pocket', name: 'Dimensional Pocket', desc: '+2 shared inventory slots' }, { key: 'scry', name: 'Scry', desc: 'Reveals all chests and monsters for 30s once per run' }],
            barbarian:[{ key: 'iron_gut', name: 'Iron Gut', desc: 'Barbarian does not count toward camping food cost' }, { key: 'savage_haul', name: 'Savage Haul', desc: 'Heavy items take only 1 inventory slot' }, { key: 'bloodhound', name: 'Bloodhound', desc: 'Reveals all monsters on miniboard entry' }, { key: 'endure', name: 'Endure', desc: 'Zero-food camp: no Resolve penalty, crew heals to 50%' }],
            monk:     [{ key: 'swift_step', name: 'Swift Step', desc: 'Movement animation 30% faster' }, { key: 'focused_rest', name: 'Focused Rest', desc: 'Camping duration -30% (same healing)' }, { key: 'pressure_points', name: 'Pressure Points', desc: '15% vendor discount once per vendor' }, { key: 'astral_map', name: 'Astral Map', desc: 'Full fog reveal for 60s once per run' }],
            summoner: [{ key: 'spirit_sight', name: 'Spirit Sight', desc: 'Narrative tiles glow through fog' }, { key: 'plunder', name: 'Plunder', desc: 'Open a chest a second time once per run' }, { key: 'soul_tithe', name: 'Soul Tithe', desc: '+1 Shimmering Dust per combat victory' }, { key: 'dark_pact', name: 'Dark Pact', desc: 'Trade Shimmering Dust at vendors (1 Dust = 25g)' }],
        };
    }

    _getNextSkillForMember(member, shrineClass) {
        if (!member || !shrineClass) return null;
        const allSkills = this._getGlobalSkillsByClass()[shrineClass] || [];
        const getLevel = (key) => {
            if (!member.globalSkills) return 0;
            const found = member.globalSkills.find(s => (typeof s === 'string' ? s : s.key) === key);
            if (!found) return 0;
            return typeof found === 'string' ? 1 : (found.level || 1);
        };
        const unlocked = allSkills.filter(s => getLevel(s.key) < 3);
        if (!unlocked.length) return null;
        const next = unlocked[0];
        return { ...next, currentLevel: getLevel(next.key), nextLevel: getLevel(next.key) + 1 };
    }

    // ── Render ────────────────────────────────────────────────────────────────

    render() {
        const { shrineData } = this.props;
        const { phase, units, stoneTileMap, currentRound, totalRounds, log, outcome, showSkillSelect } = this.state;

        const shrineClass = shrineData && shrineData.shrineClass;
        const classLabel = shrineClass ? capitalize(shrineClass) : 'Unknown';
        const shrineUnit = units.find(u => u.role === 'shrine_unit');
        const terrainTiles = images.getTerrainSetForLevel(0);

        // Skill select data
        const nextSkill = shrineData && shrineData.matchingMember
            ? this._getNextSkillForMember(shrineData.matchingMember, shrineClass)
            : null;

        const gridW = COLS * TILE_SIZE + (COLS - 1) * 2; // with 2px borders
        const gridH = ROWS * TILE_SIZE + (ROWS - 1) * 2;

        return (
            <div className="shrine-screen-backdrop" style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: '#0a0614',
                zIndex: 7500,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Palatino Linotype', Palatino, serif",
                overflow: 'hidden',
            }}>
                {/* Ambient particles */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                    {[...Array(18)].map((_, i) => (
                        <div key={i} style={{
                            position: 'absolute',
                            width: i % 3 === 0 ? '3px' : '2px',
                            height: i % 3 === 0 ? '3px' : '2px',
                            borderRadius: '50%',
                            background: i % 2 === 0 ? '#c9a227' : '#7b5ea7',
                            opacity: 0.35 + (i % 3) * 0.1,
                            left: `${5 + i * 5.5}%`,
                            top: `${10 + (i % 5) * 16}%`,
                            animation: `shrine-float-up ${2.5 + (i % 3) * 0.8}s ease-in-out ${i * 0.25}s infinite alternate`,
                            boxShadow: `0 0 8px 2px ${i % 2 === 0 ? 'rgba(201,162,39,0.5)' : 'rgba(123,94,167,0.5)'}`,
                        }} />
                    ))}
                </div>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '10px', zIndex: 1 }}>
                    <div style={{ color: '#c9a227', fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', opacity: 0.75, marginBottom: '4px' }}>
                        Ancestral Shrine
                    </div>
                    <div style={{ color: '#fff', fontSize: '18px', letterSpacing: '2px', textShadow: '0 0 20px rgba(201,162,39,0.6)', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        <img src={images.shrine} alt="shrine" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                        <span>{classLabel} Communion</span>
                    </div>
                    {phase === 'concentration' && (
                        <div style={{ color: '#c9a227', fontSize: '12px', marginTop: '4px', letterSpacing: '1px' }}>
                            Concentration — Round {currentRound} / {totalRounds}
                        </div>
                    )}
                </div>

                {/* Grid */}
                <div style={{
                    position: 'relative',
                    width: `${gridW}px`,
                    height: `${gridH}px`,
                    flexShrink: 0,
                    zIndex: 1,
                    border: '1px solid rgba(201,162,39,0.25)',
                    boxShadow: '0 0 40px rgba(123,94,167,0.15), 0 0 80px rgba(201,162,39,0.08)',
                }}>
                    {/* Stone floor layer */}
                    {Array.from({ length: ROWS }, (_, r) =>
                        Array.from({ length: COLS }, (_, c) => {
                            const tileIdx = stoneTileMap[`${c}_${r}`] || 1;
                            const stoneImg = terrainTiles && terrainTiles[tileIdx - 1];
                            const left = c * (TILE_SIZE + 2);
                            const top = r * (TILE_SIZE + 2);
                            return (
                                <div key={`floor_${c}_${r}`} style={{
                                    position: 'absolute',
                                    left: `${left}px`,
                                    top: `${top}px`,
                                    width: `${TILE_SIZE}px`,
                                    height: `${TILE_SIZE}px`,
                                    overflow: 'hidden',
                                }}>
                                    {stoneImg && (
                                        <img src={stoneImg} alt="" style={{
                                            width: '100%', height: '100%',
                                            objectFit: 'cover',
                                            opacity: 0.18,
                                            display: 'block',
                                        }} />
                                    )}
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        border: '1px solid rgba(255,255,255,0.04)',
                                    }} />
                                </div>
                            );
                        })
                    )}

                    {/* Shrine tile at top */}
                    {this._renderShrineTile()}

                    {/* Unit tiles */}
                    {units.filter(u => !u.dead).map(unit => this._renderUnit(unit))}

                    {/* Concentration progress bar */}
                    {phase === 'concentration' && shrineUnit && !shrineUnit.dead && (
                        <div style={{
                            position: 'absolute',
                            left: `${shrineUnit.col * (TILE_SIZE + 2) - 10}px`,
                            top: `${shrineUnit.row * (TILE_SIZE + 2) - 20}px`,
                            width: `${TILE_SIZE + 20}px`,
                            zIndex: 30,
                            transition: 'top 0.5s ease, left 0.5s ease',
                        }}>
                            <div style={{ fontSize: '9px', color: '#c9a227', textAlign: 'center', letterSpacing: '1px', marginBottom: '2px', textShadow: '0 0 8px rgba(201,162,39,0.8)' }}>
                                CONCENTRATING
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.7)', borderRadius: '3px', height: '8px', border: '1px solid rgba(201,162,39,0.4)', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${(currentRound / totalRounds) * 100}%`,
                                    background: 'linear-gradient(90deg, #7b5ea7, #c9a227)',
                                    borderRadius: '3px',
                                    transition: 'width 0.8s ease',
                                    boxShadow: '0 0 6px rgba(201,162,39,0.6)',
                                }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Combat log */}
                <div style={{
                    width: `${gridW}px`,
                    marginTop: '8px',
                    minHeight: '64px',
                    zIndex: 1,
                }}>
                    {log.slice(-3).map((msg, i) => (
                        <div key={i} style={{
                            color: i === log.slice(-3).length - 1 ? '#e8d5a3' : '#7a6a50',
                            fontSize: '11px',
                            lineHeight: '1.5',
                            textAlign: 'center',
                            transition: 'color 0.5s',
                        }}>
                            {msg}
                        </div>
                    ))}
                </div>

                {/* Outcome overlays */}
                {outcome === 'failure' && !showSkillSelect && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(10,4,20,0.9)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        zIndex: 100,
                        animation: 'shrine-fade-in 0.6s ease-out',
                    }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}><span role="img" aria-label="skull">💀</span></div>
                        <div style={{ color: '#c0392b', fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '2px' }}>
                            Communion Failed
                        </div>
                        <div style={{ color: '#999', fontSize: '13px', maxWidth: '320px', textAlign: 'center', lineHeight: 1.6, marginBottom: '24px', fontStyle: 'italic' }}>
                            {shrineUnit ? `${shrineUnit.name} fell before the communion could be completed.` : 'The shrine guardians were too powerful.'}
                            {' '}The shrine's power fades.
                        </div>
                        <button
                            onClick={() => this.props.onShrineComplete({ success: false, shrineData })}
                            style={{
                                background: 'rgba(192,57,43,0.2)', border: '1px solid rgba(192,57,43,0.6)',
                                color: '#e74c3c', padding: '10px 28px', borderRadius: '6px',
                                cursor: 'pointer', fontSize: '13px', letterSpacing: '1px',
                                fontFamily: 'inherit',
                            }}
                        >
                            Return to Dungeon
                        </button>
                    </div>
                )}

                {outcome === 'success' && showSkillSelect && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(10,4,20,0.93)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        zIndex: 100,
                        animation: 'shrine-fade-in 0.6s ease-out',
                    }}>
                        {/* Gold shimmer particles */}
                        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                            {[...Array(20)].map((_, i) => (
                                <div key={i} style={{
                                    position: 'absolute',
                                    width: '3px', height: '3px', borderRadius: '50%',
                                    background: '#c9a227',
                                    opacity: 0.5,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animation: `shrine-float-up ${1.5 + Math.random() * 2}s ease-in-out ${Math.random() * 2}s infinite`,
                                    boxShadow: '0 0 6px 2px rgba(201,162,39,0.6)',
                                }} />
                            ))}
                        </div>
                        <div style={{ fontSize: '36px', marginBottom: '10px' }}><span role="img" aria-label="sparkles">✨</span></div>
                        <div style={{ color: '#c9a227', fontSize: '20px', letterSpacing: '2px', marginBottom: '6px' }}>
                            Communion Complete
                        </div>
                        <div style={{ color: '#ccc', fontSize: '13px', fontStyle: 'italic', marginBottom: '24px', maxWidth: '320px', textAlign: 'center', lineHeight: 1.6 }}>
                            The ancestors have heard {shrineUnit ? shrineUnit.name : 'the champion'}'s prayer.
                            A gift of ancient wisdom is bestowed.
                        </div>

                        {nextSkill ? (
                            <div
                                onClick={() => this.props.onShrineComplete({ success: true, shrineData, selectedSkill: nextSkill.key })}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(201,162,39,0.2), rgba(201,162,39,0.08))',
                                    border: '1px solid rgba(201,162,39,0.6)',
                                    borderRadius: '10px', padding: '18px 28px',
                                    cursor: 'pointer', maxWidth: '340px', width: '100%',
                                    transition: 'all 0.2s',
                                    textAlign: 'center',
                                    marginBottom: '12px',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(201,162,39,0.35), rgba(201,162,39,0.15))';
                                    e.currentTarget.style.boxShadow = '0 0 24px rgba(201,162,39,0.35)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(201,162,39,0.2), rgba(201,162,39,0.08))';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ color: '#c9a227', fontSize: '16px', fontWeight: 'bold', marginBottom: '6px' }}>
                                    {nextSkill.name}
                                    {nextSkill.nextLevel > 1 ? ` (Upgrade to Level ${nextSkill.nextLevel})` : ''}
                                </div>
                                <div style={{ color: '#aaa', fontSize: '12px', lineHeight: 1.5 }}>
                                    {nextSkill.desc}
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: '#888', fontSize: '13px', marginBottom: '20px', fontStyle: 'italic' }}>
                                All skills for this shrine have already been mastered.
                            </div>
                        )}

                        {!nextSkill && (
                            <button
                                onClick={() => this.props.onShrineComplete({ success: true, shrineData, selectedSkill: null })}
                                style={{
                                    background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.5)',
                                    color: '#c9a227', padding: '10px 28px', borderRadius: '6px',
                                    cursor: 'pointer', fontSize: '13px', letterSpacing: '1px',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Return to Dungeon
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    }

    _renderShrineTile() {
        const left = SHRINE_COL * (TILE_SIZE + 2);
        const top = SHRINE_ROW * (TILE_SIZE + 2);
        const { phase, currentRound, totalRounds } = this.state;
        const isConcentrating = phase === 'concentration';
        return (
            <div key="shrine-tile" style={{
                position: 'absolute',
                left: `${left}px`,
                top: `${top}px`,
                width: `${TILE_SIZE}px`,
                height: `${TILE_SIZE}px`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                filter: isConcentrating ? 'drop-shadow(0 0 16px rgba(201,162,39,0.9))' : 'drop-shadow(0 0 8px rgba(201,162,39,0.5))',
                animation: isConcentrating ? 'shrine-glow-pulse 1.2s ease-in-out infinite alternate' : 'shrine-float 3s ease-in-out infinite alternate',
            }}>
                <img
                    src={images.shrine}
                    alt="shrine"
                    style={{ width: '72px', height: '72px', objectFit: 'contain' }}
                />
                {isConcentrating && (
                    <div style={{
                        position: 'absolute', bottom: '4px',
                        width: '80%', height: '4px',
                        background: 'rgba(0,0,0,0.6)', borderRadius: '2px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${(currentRound / totalRounds) * 100}%`,
                            background: 'linear-gradient(90deg, #c9a227, #fff8dc)',
                            borderRadius: '2px',
                            boxShadow: '0 0 4px rgba(201,162,39,0.8)',
                            transition: 'width 0.8s ease',
                        }} />
                    </div>
                )}
            </div>
        );
    }

    _renderUnit(unit) {
        const left = unit.col * (TILE_SIZE + 2);
        const top = unit.row * (TILE_SIZE + 2);
        const hpPct = Math.max(0, unit.hp / unit.maxHp);
        const isShrineUnit = unit.role === 'shrine_unit';
        const isMonster = unit.role === 'monster';

        const borderColor = isShrineUnit
            ? 'rgba(201,162,39,0.8)'
            : isMonster
                ? 'rgba(192,57,43,0.7)'
                : 'rgba(100,160,220,0.5)';

        const hpColor = hpPct > 0.5
            ? '#2ecc71'
            : hpPct > 0.25
                ? '#f39c12'
                : '#e74c3c';

        return (
            <div key={unit.id} style={{
                position: 'absolute',
                left: `${left}px`,
                top: `${top}px`,
                width: `${TILE_SIZE}px`,
                height: `${TILE_SIZE}px`,
                zIndex: 20,
                transition: 'top 0.5s ease, left 0.5s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                {/* Portrait */}
                <div style={{
                    width: '70px', height: '70px',
                    borderRadius: '6px',
                    border: `2px solid ${borderColor}`,
                    backgroundImage: unit.portrait ? `url(${unit.portrait})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center top',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: unit.portrait ? 'transparent' : 'rgba(40,20,60,0.6)',
                    boxShadow: isShrineUnit && unit.isConcentrating
                        ? '0 0 16px rgba(201,162,39,0.6), 0 0 32px rgba(201,162,39,0.3)'
                        : `0 0 8px rgba(0,0,0,0.5)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    filter: isMonster ? 'hue-rotate(330deg) saturate(1.3)' : 'none',
                    animation: isShrineUnit && unit.isConcentrating ? 'shrine-concentrate-pulse 2s ease-in-out infinite' : 'none',
                }}>
                    {!unit.portrait && (
                        <span style={{ fontSize: '28px' }}>
                            {isShrineUnit ? '🧙' : isMonster ? '👹' : '⚔️'}
                        </span>
                    )}
                </div>

                {/* HP bar */}
                <div style={{
                    width: '70px', height: '5px',
                    background: 'rgba(0,0,0,0.6)',
                    borderRadius: '3px', marginTop: '3px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)',
                }}>
                    <div style={{
                        height: '100%',
                        width: `${hpPct * 100}%`,
                        background: hpColor,
                        borderRadius: '3px',
                        transition: 'width 0.4s ease',
                    }} />
                </div>

                {/* Name label */}
                <div style={{
                    fontSize: '8px', color: '#ccc',
                    textAlign: 'center', marginTop: '2px',
                    maxWidth: '90px', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                }}>
                    {unit.name}
                </div>
            </div>
        );
    }
}

export default ShrineScreen;
