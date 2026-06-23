/**
 * ShrineScreen.js
 *
 * Full-screen animated shrine encounter running on the actual combat engine.
 *
 * Layout:
 *   - 8 × 6 grid (same tile size as combat = 100px)
 *   - Stone floor tiles at low opacity as background per cell
 *   - Shrine icon centered at top row (row 0, col 4)
 *   - Crew units and guardians spawn, real combat runs using CombatManagerRedux
 *   - Success / failure callbacks based on actual combat outcome
 */

import React from 'react';
import * as images from '../../utils/images';
import { CombatManagerRedux } from '../../utils/combat-manager-redux';
import { AnimationManagerRedux } from '../../utils/animation-manager-redux';
import CombatGrid from '../../components/combat-panes/CombatGrid';

// ── Grid constants ────────────────────────────────────────────────────────────
const COLS = 8;
const ROWS = 6;
const TILE_SIZE = 100;

const SHRINE_COL = Math.floor(COLS / 2); // col 4
const SHRINE_ROW = 0;

const TOTAL_ROUNDS = 6;

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

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

// ── Component ─────────────────────────────────────────────────────────────────

class ShrineScreen extends React.Component {
    // props:
    //   shrineData   - { tile, shrineClass, shrineKey, matchingMember }
    //   crew         - array of crew member objects
    //   monsterManager - for getRandomMonsterByTier
    //   overlayManager - from DungeonPage
    //   animationManager - from DungeonPage
    //   onShrineComplete(result) - called with { success, shrineData, selectedSkill? }

    constructor(props) {
        super(props);

        // --- Stone tile assignment (seeded by position) ---
        const stoneTileMap = {};
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                stoneTileMap[`${c}_${r}`] = ((r * COLS + c * 3 + 7) % STONE_TILES_COUNT) + 1;
            }
        }

        this.state = {
            // ── Phase: 'enter' | 'communion' | 'done'
            phase: 'enter',

            // ── Stone floor
            stoneTileMap,

            // ── Real combat engine state
            battleData: {},
            activeAnimations: [],

            // ── Progress (concentration rounds)
            currentRound: 1,
            totalRounds: TOTAL_ROUNDS,

            // ── Log messages
            log: [],

            // ── Outcome
            outcome: null, // 'success' | 'failure'

            // ── Skill-select (after success)
            showSkillSelect: false,

            // ── Speech bubble message
            message: '',
            messageSource: null,

            // ── Selection states for CombatGrid (dummy/view-only)
            selectedFighter: null,
            selectedMonster: null
        };

        this.combatManager = null;
        this._animManagerRedux = null;
        this.shrineUnitId = null;
        this._enterTimeout = null;
    }

    componentDidMount() {
        this._isMounted = true;
        // Short enter delay, then initialize and start real combat
        this._enterTimeout = setTimeout(() => {
            if (this._isMounted) {
                this.setState({ phase: 'communion' }, () => {
                    this._initializeCombatEngine();
                });
            }
        }, 1800);
    }

    componentWillUnmount() {
        this._isMounted = false;
        if (this._enterTimeout) clearTimeout(this._enterTimeout);
        if (this.combatManager) {
            this.combatManager.shutdown();
        }
    }

    _initializeCombatEngine() {
        const { shrineData, monsterManager, overlayManager, animationManager } = this.props;
        const shrineClass = shrineData && shrineData.shrineClass;

        // 1. Instantiate CombatManagerRedux
        this.combatManager = new CombatManagerRedux();
        this.combatManager.initialize();

        if (overlayManager) {
            this.combatManager.connectOverlayManager(overlayManager);
        }
        if (animationManager) {
            this.combatManager.connectAnimationManager(animationManager);
        }

        // 2. Wire AnimationManagerRedux
        this._animManagerRedux = new AnimationManagerRedux();
        this._animManagerRedux.connect((anims) => {
            if (this._isMounted) this.setState({ activeAnimations: anims });
        });
        if (typeof this.combatManager.connectAnimationManagerRedux === 'function') {
            this.combatManager.connectAnimationManagerRedux(this._animManagerRedux);
        }

        // 3. Establish callbacks
        this.combatManager.establishMessageCallback((msgData) => {
            if (this._isMounted) {
                this.setState({
                    message: msgData?.message || '',
                    messageSource: msgData?.source || null
                });
            }
        });

        this.combatManager.establishUpdateDataCallback((battleData) => {
            if (!this._isMounted) return;
            const cloned = JSON.parse(JSON.stringify(battleData));
            
            // Normalize/fill missing fields like portrait
            Object.values(cloned).forEach(entry => {
                if (!entry) return;
                if (typeof entry.portrait === 'undefined' || entry.portrait === null) {
                    entry.portrait = images['avatar'];
                }
                if (!Array.isArray(entry.damageIndicators)) {
                    entry.damageIndicators = [];
                }
            });

            const combatLog = this.combatManager && typeof this.combatManager.getCombatLog === 'function'
                ? this.combatManager.getCombatLog()
                : [];

            this.setState({
                battleData: cloned,
                currentRound: this.combatManager.round,
                log: combatLog
            }, () => {
                this._checkCommunionOutcome();
            });
        });

        this.combatManager.establishOnFighterDeathCallback(() => {
            this._checkCommunionOutcome();
        });

        // 4. Generate the monsters/guardians for the shrine communion
        let mob1 = null, mob2 = null;
        try {
            mob1 = monsterManager && monsterManager.getRandomMonsterByTier(1);
            mob2 = monsterManager && monsterManager.getRandomMonsterByTier(1);
        } catch (e) {}

        if (!mob1) {
            mob1 = {
                type: 'goblin',
                key: 'goblin',
                stats: { hp: 45, atk: 7, def: 4 },
                portrait: images['goblin_portrait'],
                monster_names: ['Wiggit']
            };
        }
        if (!mob2) {
            mob2 = {
                type: 'skeleton',
                key: 'skeleton',
                stats: { hp: 40, atk: 6, def: 5 },
                portrait: images['skeleton_portrait'],
                monster_names: ['Bones']
            };
        }

        const name1 = (mob1.monster_names && mob1.monster_names.length)
            ? mob1.monster_names[Math.floor(Math.random() * mob1.monster_names.length)]
            : capitalize(mob1.type);
        const name2 = (mob2.monster_names && mob2.monster_names.length)
            ? mob2.monster_names[Math.floor(Math.random() * mob2.monster_names.length)]
            : capitalize(mob2.type);

        const monster = {
            id: `shrine_guardian_1_${Date.now()}`,
            type: mob1.type || mob1.key || 'monster',
            name: name1,
            stats: { ...mob1.stats },
            portrait: resolvePortrait(mob1.portrait),
            inventory: [],
            greetings: ["Guardians of the shrine emerge from the shadows!"],
            isShrineGuardian: true
        };

        const minions = [
            {
                id: `shrine_guardian_2_${Date.now()}`,
                type: mob2.type || mob2.key || 'monster',
                name: name2,
                stats: { ...mob2.stats },
                portrait: resolvePortrait(mob2.portrait),
                inventory: [],
                isShrineGuardian: true
            }
        ];

        // Prepare the player's crew (deep copy so we don't mutate global state directly during combat)
        const crewList = (this.props.crew || []).map(m => JSON.parse(JSON.stringify(m)));

        // Find the matching shrine-class member
        const shrineUnitIdx = shrineClass
            ? crewList.findIndex(m => (m.type || m.image || '').toLowerCase() === shrineClass.toLowerCase())
            : -1;

        // Initialize combat
        this.combatManager.initializeCombat({
            crew: crewList,
            leader: crewList.find(m => m.isLeader) || crewList[0],
            monster,
            minions
        });

        // Let's reposition the combatants on the 8x6 grid
        const combatantsList = Object.values(this.combatManager.combatants);
        const shrineUnit = shrineUnitIdx >= 0
            ? combatantsList.find(c => c.id === crewList[shrineUnitIdx].id)
            : null;

        if (shrineUnit) {
            shrineUnit.coordinates = { x: 4, y: 1 };
            shrineUnit.depth = 4;
            shrineUnit.position = 1;
            shrineUnit.skipAI = true;
            shrineUnit.isConcentrating = true;
            this.combatManager._setCombatantOccupiedCoords(shrineUnit, this.combatManager.combatants);
            this.shrineUnitId = shrineUnit.id;
        }

        // Position the other crew members on row 4 and row 5 around col 4 to defend the shrine unit
        const defenders = combatantsList.filter(c => !c.isMonster && (!shrineUnit || c.id !== shrineUnit.id));
        const defenderCoords = [
            { x: 3, y: 4 },
            { x: 5, y: 4 },
            { x: 2, y: 5 },
            { x: 6, y: 5 },
            { x: 1, y: 5 },
            { x: 7, y: 5 }
         ];
        defenders.forEach((c, idx) => {
            const coord = defenderCoords[idx] || { x: idx % 8, y: 5 };
            c.coordinates = { ...coord };
            c.depth = coord.x;
            c.position = coord.y;
            this.combatManager._setCombatantOccupiedCoords(c, this.combatManager.combatants);
        });

        // Position the guardians on the left and right sides
        const guardians = combatantsList.filter(c => c.isMonster);
        guardians.forEach((c, idx) => {
            const startX = (idx % 2 === 0) ? 0 : 7;
            const startY = 2 + (idx % 3);
            c.coordinates = { x: startX, y: startY };
            c.depth = startX;
            c.position = startY;
            this.combatManager._setCombatantOccupiedCoords(c, this.combatManager.combatants);
        });

        // Force a state sync to initialize the grid rendering
        this.setState({
            battleData: JSON.parse(JSON.stringify(this.combatManager.combatants))
        });
    }

    _checkCommunionOutcome() {
        if (this.state.phase !== 'communion' || this.state.outcome) return;

        const { battleData } = this.state;
        if (!battleData || Object.keys(battleData).length === 0) return;

        // 1. Check if the shrine unit died
        if (this.shrineUnitId) {
            const shrineUnit = battleData[this.shrineUnitId];
            if (shrineUnit && (shrineUnit.dead || shrineUnit.hp <= 0)) {
                if (this.combatManager) this.combatManager.shutdown();
                this.setState({
                    phase: 'done',
                    outcome: 'failure',
                    message: ''
                });
                return;
            }
        }

        // 2. Check if 6 rounds have completed
        if (this.combatManager && this.combatManager.round >= 7) {
            if (this.combatManager) this.combatManager.shutdown();
            this.setState({
                phase: 'done',
                outcome: 'success',
                showSkillSelect: true,
                message: ''
            });
            return;
        }

        // 3. Check if all monsters/guardians are defeated
        const aliveMonsters = Object.values(battleData).filter(
            c => c && c.isMonster && !c.dead && c.hp > 0
        );
        if (aliveMonsters.length === 0) {
            if (this.combatManager) this.combatManager.shutdown();
            this.setState({
                phase: 'done',
                outcome: 'success',
                showSkillSelect: true,
                message: ''
            });
        }
    }

    getActionBarLeftValForFighter = (id) => {
        if (!this.state.battleData) return 0;
        const selectedFighter = this.state.battleData[id];
        const details = this.state.battleData[id];
        const baseX = (details?.coordinates.x || 0) * 100;
        const rangeWidth = this.combatManager?.getRangeWidthVal(details) || 0;
        const offset = (selectedFighter?.facing === 'left') ? (0 - (rangeWidth * 100)) : 100;
        return baseX + offset;
    }

    getFighterDetails = (fighter) => {
        if (!fighter || !this.state.battleData) return null;
        return this.state.battleData[fighter.id];
    }

    getHitAnimation = (combatant) => {
        if (!combatant || !combatant.wounded) return '';
        return `hit-from-${combatant.wounded.sourceDirection}-${combatant.wounded.severity}`;
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
        const { phase, stoneTileMap, currentRound, totalRounds, log, outcome, showSkillSelect } = this.state;

        const shrineClass = shrineData && shrineData.shrineClass;
        const classLabel = shrineClass ? capitalize(shrineClass) : 'Unknown';
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
                    {phase === 'communion' && (
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

                    {/* Unified Combat Grid — renders actual fighters & guardians */}
                    {phase === 'communion' && (
                        <CombatGrid
                            crew={this.props.crew}
                            combatManager={this.combatManager}
                            battleData={this.state.battleData}
                            selectedFighter={this.state.selectedFighter}
                            selectedMonster={this.state.selectedMonster}
                            portraitHoveredId={null}
                            animationOverlays={{}}
                            getAllOverlaysById={() => null}
                            portraitHovered={() => {}}
                            fighterPortraitClicked={(fighter) => this.setState({ selectedFighter: fighter })}
                            monsterCombatPortraitClicked={(monster) => this.setState({ selectedMonster: monster })}
                            onDragStart={() => {}}
                            getActionBarLeftValForFighter={this.getActionBarLeftValForFighter}
                            getManualMovementArc={() => null}
                            getManualMovementArcColor={() => 'rgba(255,255,255,0)'}
                            getFighterDetails={this.getFighterDetails}
                            getHitAnimation={this.getHitAnimation}
                            teleportingFighterId={null}
                            fearCastingActive={false}
                            greetingInProcess={this.state.message !== ''}
                            SHOW_MONSTER_IDS={false}
                            activeAnimations={this.state.activeAnimations}
                            TILE_SIZE={TILE_SIZE}
                            SHOW_TILE_BORDERS={true}
                        />
                    )}

                    {/* Concentration progress bar */}
                    {phase === 'communion' && this.shrineUnitId && this.state.battleData[this.shrineUnitId] && !this.state.battleData[this.shrineUnitId].dead && (() => {
                        const sUnit = this.state.battleData[this.shrineUnitId];
                        const left = sUnit.coordinates.x * (TILE_SIZE + 2) - 10;
                        const top = sUnit.coordinates.y * (TILE_SIZE + 2) - 20;
                        return (
                            <div style={{
                                position: 'absolute',
                                left: `${left}px`,
                                top: `${top}px`,
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
                                        width: `${Math.min(100, (currentRound / totalRounds) * 100)}%`,
                                        background: 'linear-gradient(90deg, #7b5ea7, #c9a227)',
                                        borderRadius: '3px',
                                        transition: 'width 0.8s ease',
                                        boxShadow: '0 0 6px rgba(201,162,39,0.6)',
                                    }} />
                                </div>
                            </div>
                        );
                    })()}

                    {/* Speech bubble message from the guardians */}
                    {this.state.message && (() => {
                        const mainMonster = Object.values(this.state.battleData).find(c => c && c.isMonster && !c.isMinion);
                        if (!mainMonster || !mainMonster.coordinates) return null;
                        
                        const mx = mainMonster.coordinates.x;
                        const my = mainMonster.coordinates.y;
                        
                        const isHuge = mainMonster.tier === 4 || mainMonster.type === 'dragon' || mainMonster.key === 'dragon' || mainMonster.huge === true || mainMonster.size === 3;
                        
                        let bubbleCenterX = 0;
                        let bubbleCenterY = 0;

                        if (isHuge) {
                            // 3x3 footprint: top row is my - 2, middle column is mx + hDir
                            const hDir = (mx >= 4) ? -1 : 1;
                            const middleCol = mx + hDir;
                            const topRow = my - 2;

                            bubbleCenterX = middleCol * TILE_SIZE + TILE_SIZE / 2;
                            bubbleCenterY = topRow * TILE_SIZE;
                        } else if (mainMonster.isLarge || mainMonster.size === 2) {
                            // 2x2 footprint
                            const hOffset = (mx >= 4) ? -TILE_SIZE : 0;
                            const leftPos = mx * TILE_SIZE + hOffset;
                            const topPos = my * TILE_SIZE - TILE_SIZE; // Top row of the 2x2

                            bubbleCenterX = leftPos + TILE_SIZE;
                            bubbleCenterY = topPos; // Directly above the top row
                        } else {
                            // 1x1 footprint
                            bubbleCenterX = mx * TILE_SIZE + TILE_SIZE / 2;
                            bubbleCenterY = my * TILE_SIZE;
                        }

                        return (
                            <div
                                className="message-container speech-bubble"
                                style={{
                                    position: 'absolute',
                                    left: `${bubbleCenterX}px`,
                                    top: `${bubbleCenterY - 45}px`,
                                    transform: 'translateX(-50%)',
                                    width: 'max-content',
                                    maxWidth: '220px',
                                    height: 'auto',
                                    padding: '10px 14px',
                                    background: 'rgba(20, 20, 22, 0.96)',
                                    border: '2px solid #ff5400',
                                    borderRadius: '12px',
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    textAlign: 'center',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.8), 0 0 15px rgba(255, 84, 0, 0.4)',
                                    zIndex: 450,
                                    pointerEvents: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {this.state.message}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-8px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '0',
                                    height: '0',
                                    borderLeft: '8px solid transparent',
                                    borderRight: '8px solid transparent',
                                    borderTop: '8px solid #ff5400',
                                }} />
                            </div>
                        );
                    })()}
                </div>

                {/* Combat log */}
                <div style={{
                    width: `${gridW}px`,
                    marginTop: '8px',
                    minHeight: '64px',
                    zIndex: 1,
                }}>
                    {log.slice(-3).map((msg, i) => (
                        <div key={msg?.id || i} style={{
                            color: i === log.slice(-3).length - 1 ? '#e8d5a3' : '#7a6a50',
                            fontSize: '11px',
                            lineHeight: '1.5',
                            textAlign: 'center',
                            transition: 'color 0.5s',
                        }}>
                            {msg?.message || msg}
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
                            The communion was broken by the guardians. The shrine's power fades.
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
                            The ancestors have heard the champion's prayer.
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
        const isConcentrating = phase === 'communion' || (phase === 'done' && this.state.outcome === 'success');
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
                            width: `${Math.min(100, (currentRound / totalRounds) * 100)}%`,
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
}

export default ShrineScreen;
