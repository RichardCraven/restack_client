// Force sync battleData from combatManager (including VCT positions)
import React from 'react'
// Show/hide tile coordinates overlay
import '../../styles/monster-battle.scss'
import '../../styles/level-up-screen.scss'
import * as images from '../../utils/images'
import { CModal } from '@coreui/react';
import '../../styles/inventory-modal.scss';
import DUST_TYPES from '../../utils/dusts';
import LevelUpScreen from '../../components/LevelUpScreen';
import skillsMatrix from '../../utils/skills-matrix';
import { Redirect } from "react-router-dom";
import { storeMeta, getMeta, getUserId } from '../../utils/session-handler';
import {
    updateUserRequest
} from '../../utils/api-handler';
import Canvas from '../../components/Canvas/canvas'
// import Overlay from '../../components/Overlay'
// import CanvasMagicMissile from '../../components/Canvas/canvas_magic_missile'
import CombatGrid, { getActiveEffects } from '../../components/combat-panes/CombatGrid'
import { AnimationManagerRedux } from '../../utils/animation-manager-redux';

import { INTERVALS, INTERVAL_DISPLAY_NAMES } from '../../utils/shared-constants';
import REAGENTS, { REAGENT_KEYS } from '../../utils/reagents';
import BREW_INGREDIENTS, { BREW_INGREDIENT_KEYS } from '../../utils/brew-ingredients';
import { BATTLE_TACTICS } from '../../utils/spells-table';

// const MAX_DEPTH = 7;
const NUM_COLUMNS = 8;
// ^ means 8 squares, account for depth of 0 is far left

const MAX_ROWS = 6;
const TILE_SIZE = 100;
const SHOW_TILE_BORDERS = true;
// const SHOW_COMBAT_BORDER_COLORS = false;
const SHOW_INTERACTION_PANE = true;
const SHOW_MONSTER_IDS = false;
// const SHOW_COORDINATES = false;

// const RANGES = {
//     close: 1,
//     medium: 3,
//     far: 5
// }

// Duration (ms) must match the CSS death animation/transition duration
const DEATH_ANIMATION_DURATION = 2200;


const AnimatedXPBar = ({ percentBefore, percentAfter, levelTransition }) => {
    // If level transition occurs, we start at percentBefore, fill to 100, drop to 0, then go to percentAfter.
    // To handle drop to 0 without backwards animation, we temporarily disable transition.
    const [currentPercent, setCurrentPercent] = React.useState(percentBefore);
    const [isLevelingUp, setIsLevelingUp] = React.useState(false);
    const [disableTransition, setDisableTransition] = React.useState(false);
    
    React.useEffect(() => {
        let t1, t2, t3, t4;
        
        t1 = setTimeout(() => {
            if (levelTransition) {
                // Animate to 100%
                setCurrentPercent(100);
                setIsLevelingUp(true);
                
                // Wait for fill to 100% to finish
                t2 = setTimeout(() => {
                    // Disable transition so it snaps to 0
                    setDisableTransition(true);
                    setCurrentPercent(0);
                    
                    // Wait a tiny bit for the snap to apply, then re-enable transition and go to percentAfter
                    t3 = setTimeout(() => {
                        setDisableTransition(false);
                        setCurrentPercent(percentAfter);
                        
                        t4 = setTimeout(() => {
                            setIsLevelingUp(false);
                        }, 800);
                    }, 50);
                }, 800);
            } else {
                setCurrentPercent(percentAfter);
            }
        }, 1000); // 1 sec delay before starting animation
        
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
        };
    }, [percentBefore, percentAfter, levelTransition]);
    
    const transitionStyle = disableTransition ? 'none' : 'width 0.8s ease-in-out, background-color 0.3s ease';
    
    return (
        <div className="crew-xp-container">
            <div className="crew-xp-bg" style={{ position: 'relative' }}>
                {isLevelingUp && (
                    <div className="level-up-glow" style={{ 
                        position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, 
                        boxShadow: '0 0 10px 2px rgba(255, 215, 0, 0.8), 0 0 20px 5px rgba(255, 215, 0, 0.4)', 
                        borderRadius: 'inherit', zIndex: 1, opacity: 1, transition: 'opacity 0.3s ease'
                    }} />
                )}
                <div 
                    className={`crew-xp-fill ${isLevelingUp ? 'leveling-up' : ''}`} 
                    style={{ 
                        width: `${currentPercent}%`, 
                        transition: transitionStyle,
                        backgroundColor: isLevelingUp ? '#ffd700' : undefined 
                    }} 
                />
            </div>
            <span className="crew-xp-text">{Math.round(currentPercent)}% XP</span>
        </div>
    );
};

// const SHOW_BORDERS = true;
class MonsterBattle extends React.Component {
    getGameSpeed = () => {
        return this.props.combatManager?.FIGHT_INTERVAL;
    }

    setGameSpeed = (newInterval) => {
        if (this.props.combatManager) {
            this.props.combatManager.updateAllFightIntervals(newInterval);
            // Persist to meta
            const meta = getMeta();
            meta.combatSpeed = newInterval;
            storeMeta(meta);
            if (typeof this.forceUpdate === 'function') this.forceUpdate();
        }
    }
    // lifecycle methods implemented further below

    // All keydown logic removed; now handled in CombatSimulator

    enableManualModeForSelectedFighter = () => {
        // Implement logic to enable manual control for the selected fighter
        // For example, set a flag in state or call a combatManager method
        if (this.state.selectedFighter) {
            this.props.combatManager.setManualControl(this.state.selectedFighter.id, true);
            this.setState({ manualControl: true });
        }
    }
    // Allow AI to trigger glyph/special casting using the same path as the UI
    // Allow AI to fire glyphs without requiring the fighter to be selected
    fireSpecialForAI = (fighter, glyph = null) => {
        if (glyph) {
            // If a consumable/spell glyph was provided by AI, remove one
            // instance from the fighter's consumable specialActions so the
            // UI reflects the usage immediately. Use a best-effort match by
            // reference, subtype, or name.
            try {
                if (fighter && Array.isArray(fighter.specialActions)) {
                    const matchIndex = fighter.specialActions.findIndex(sa => {
                        if (!sa) return false;
                        if (sa === glyph) return true;
                        if (glyph.subtype && sa.subtype && sa.subtype === glyph.subtype) return true;
                        if (glyph.name && sa.name && sa.name === glyph.name) return true;
                        return false;
                    });
                    if (matchIndex !== -1) {
                        fighter.specialActions.splice(matchIndex, 1);
                        // Notify local component state to re-render immediately
                        try { this.applyFighterUpdate(fighter); } catch (err) { console.warn('applyFighterUpdate failed', err); }
                    }
                }
            } catch (err) {
                console.warn('fireSpecialForAI: failed to remove glyph from fighter.specialActions', err);
            }

            this.fireGlyph(glyph, fighter);
        } else {
            // fallback: set selectedFighter for other specials
            this.setState({ selectedFighter: fighter }, () => {
                this.fireSpecial(null);
            });
        }
    }
    // ── Shield Wall registration / expiry ─────────────────────────────────────
    registerShieldWall = (wallData, fighter) => { // eslint-disable-line no-unused-vars
        this.setState(prev => ({
            activeWalls: [...prev.activeWalls, { ...wallData, id: `wall_${Date.now()}` }]
        }));
    }
    expireShieldWall = (wallData, fighter) => { // eslint-disable-line no-unused-vars
        if (!wallData) return;
        this.setState(prev => ({
            activeWalls: prev.activeWalls.filter(w => w.callerId !== wallData.callerId)
        }));
    }
    // ─────────────────────────────────────────────────────────────────────────
    removeDeadCombatantAfterDelay = (id) => {
        if (this.props.combatManager && typeof this.props.combatManager.removeCombatant === 'function') {
            this.props.combatManager.removeCombatant(id);
        }
        // Optionally, remove overlays for this id from overlayManager if present
        if (this.props.overlayManager && typeof this.props.overlayManager.removeCombatant === 'function') {
            this.props.overlayManager.removeCombatant(id);
        } else if (this.props.overlayManager && this.props.overlayManager.overlays) {
            // Fallback: delete overlays directly if no method
            delete this.props.overlayManager.overlays[id];
        }
    }
    constructor(props) {
        super(props)
        // mount flag to avoid setState on unmounted component warnings
        this._isMounted = false;
        this.state = {
            activeEffectPopup: null,
            activeSkillPopup: null,
            popupOpenedWhilePaused: false,
            message: '',
            combatStarted: false,
            source: null,
            indicatorsMatrix: {},
            attackType: '',
            target: null,
            battleData: {},
            animationData: { tiles: [] },
            catcher: null,
            selectedFighter: null,
            selectedMonster: null,
            selectedAttack: null,
            hoveredAttackTile: null,
            hoveredInventoryTile: null,
            hoveredSpecialTile: null,
            hoveredGlyphTile: null,
            showCrosshair: false,
            portraitHoveredId: null,
            greetingInProcess: true,
            combatTiles: [],
            draggedOverCombatTileId: null,
            draggingFighter: null,
            ghostPortraitMatrix: [],
            showSummaryPanel: false,
            suppressSummaryPortraits: false,
            isFinalDeath: false,
            // Inventory popup visibility
            showInventoryPopup: false,
            summaryMessage: '',
            experienceGained: null,
            goldGained: null,
            foodGained: 0,
            stolenItems: [],
            levelTransitions: {},
            xpPercentsBefore: {},
            crewManagerSnapshot: null,
            showLevelUpScreen: false,
            levelUpQueue: [],
            battleResult: null,
            monsterPortrait: '',
            navToDeathScene: false,
            glyphTrayExpanded: false,
            arrowUpImage: null,
            animationOverlays: [],
            magicMissile_fire: false,
            magicMissile_connectParticles: true,
            magicMissile_targetDistance: 0,
            magicMissile_targetLaneDiff: 0,
            teleportingFighterId: null,
            // Active shield walls: array of wallData objects
            activeWalls: [],
            // Board-wide fear overlay
            boardFearActive: false,
            // Transient glow on the casting monster portrait when induce_fear fires
            fearCastingActive: false,
            combatLog: [],
            // Sandbox-style CSS animation events from AnimationManagerRedux
            activeAnimations: [],
            logFilterSelectedFighter: false,
            logFontSize: 12,
            // Board column count — starts at 8, expanded by entropic_kindred
            numBoardColumns: NUM_COLUMNS,
            // Animated column-flash strips for entropic_kindred board expansion
            entropicKindredNewCols: [],
        }
        this.combatLogContainerRef = React.createRef();
        this.latestCombatLogEntryRef = React.createRef();
        // Internal flags for special group-death flow
        this._suppressPersistFinalHP = false;
        // Internal flag to ensure we only inject wizard spells once for simulation battles
        this._wizardSpellsEnsured = false;
        // Track timers/intervals created by this component so we can clear them on unmount
        this._timers = [];
        this._intervals = [];
        this._setTimeout = (fn, t) => { const id = setTimeout(fn, t); try { this._timers.push(id); } catch (e) { }; return id };
        this._setInterval = (fn, t) => { const id = setInterval(fn, t); try { this._intervals.push(id); } catch (e) { }; return id };
    }

    // Public method to force sync battleData from combatManager (including VCT positions)
    forceSyncBattleData = () => {
        if (this.props.combatManager && this.props.combatManager.combatants) {
            // Deep clone to ensure React state update
            const clonedBattleData = JSON.parse(JSON.stringify(this.props.combatManager.combatants));
            this.updateBattleData(clonedBattleData);
            console.log('[DIAG][MonsterBattle] forceSyncBattleData called.');
        } else {
            console.warn('[MonsterBattle] forceSyncBattleData: combatManager or combatants missing');
        }
    }

    componentDidMount() {
        // mark mounted so async callbacks can safely call setState
        this._isMounted = true;
        // Reset any previous group-death suppression flag and one-time guards
        // when mounting a new battle. This prevents prior battle state from
        // affecting subsequent battles if the component instance is reused.
        this._suppressPersistFinalHP = false;
        this._gameOverHandled = false;
        this._goldAwarded = false;
        // Reset UI state that persists across remounts (shield walls, fear, etc.)
        this.setState({ activeWalls: [], boardFearActive: false, fearCastingActive: false });

        // --- FIX: Ensure combatManager resets combatants and removes all active enemies ---
        if (this.props.combatManager && typeof this.props.combatManager.reset === 'function') {
            this.props.combatManager.reset();
        }

        this.props.combatManager.initialize();
        this.props.combatManager.connectOverlayManager(this.props.overlayManager)
        this.props.combatManager.connectAnimationManager(this.props.animationManager);

        // Wire Sandbox-style AnimationManagerRedux (pure CSS state animations)
        this._animManagerRedux = new AnimationManagerRedux();
        this._animManagerRedux.connect((anims) => {
            if (this._isMounted) this.setState({ activeAnimations: anims });
        });
        if (typeof this.props.combatManager.connectAnimationManagerRedux === 'function') {
            this.props.combatManager.connectAnimationManagerRedux(this._animManagerRedux);
        }

        // Wire Monk teleport callback to set teleportingFighterId
        const monkAI = this.props.combatManager.fighterAI?.roster?.monk;
        if (monkAI) {
            monkAI.onTeleport = (caller) => {
                // debugger
                this.setState({ teleportingFighterId: caller.id });
                // Optionally clear after a tick for animation
                this._setTimeout(() => {
                    this.setState({ teleportingFighterId: null });
                }, 100);
            };
        }

        let arr = [], ghostPortraitMatrix = [];
        for (let i = 0; i < MAX_ROWS * NUM_COLUMNS; i++) {
            let x = i % NUM_COLUMNS,
                y = Math.floor(i / NUM_COLUMNS)
            arr.push({
                id: i,
                x,
                y
            })
            ghostPortraitMatrix.push(null)
        }

        // const crewLeader = this.props.crew.find(e=>e.isLeader)

        // combat manager callbacks
        this.establishMessageCallback();
        this.establishUpdateMatrixCallback();
        this.establishUpdateActorCallback();
        this.establishUpdateDataCallback();
        this.establishMorphPortraitCallback();
        this.establishGreetingCompleteCallback();
        this.establishGameOverCallback();
        this.establishOnFighterMovedToDestinationCallback();
        // Ensure both removal and selection logic are called for all combatants
        this.props.combatManager.establishOnFighterDeathCallback((id) => {
            // Wait for the death animation duration before removing
            this._setTimeout(() => {
                this.removeDeadCombatantAfterDelay(id);
            }, DEATH_ANIMATION_DURATION);
            this.handleFighterDeath(id);
        });

        // Wire up inventory callbacks so AI can read and consume communal/personal potions
        try {
            if (this.props.combatManager && typeof this.props.combatManager.establishGetCurrentInventoryCallback === 'function') {
                // Return the actual inventory objects (inventory) not the list of item keys (items)
                this.props.combatManager.establishGetCurrentInventoryCallback(() => {
                    try { return (this.props.inventoryManager && Array.isArray(this.props.inventoryManager.inventory)) ? this.props.inventoryManager.inventory : []; } catch (e) { return []; }
                });
            }
        } catch (e) { }
        try {
            if (this.props.combatManager && typeof this.props.combatManager.establishUseConsumableCallback === 'function') {
                this.props.combatManager.establishUseConsumableCallback((item) => {
                    try { if (this.props.useConsumableFromInventory) this.props.useConsumableFromInventory(item); } catch (e) { console.warn('useConsumableCallback failed', e); }
                });
            }
        } catch (e) { }
        try {
            if (this.props.combatManager && typeof this.props.combatManager.establishStolenItemCallback === 'function') {
                this._stolenItems = [];
                this.props.combatManager.establishStolenItemCallback((itemKey, itemName, itemIconKey = null) => {
                    try { if (this.props.inventoryManager) this.props.inventoryManager.removeItemByKey(itemKey); } catch (e) { }
                    this._stolenItems = this._stolenItems || [];
                    this._stolenItems.push({ itemName, itemIconKey });
                });
            }
        } catch (e) { }

        //overlay manager callbacks
        // this.establishInitializeOverlayManagerCallback();
        this.establishBroadcastNewAnimationCallback();

        // /animation CB
        this.establishUpdateAnimationDataCallback();
        // this.establishAnimationCallback();

        // Wire board-wide event callback (e.g. induce_fear overlay)
        this.props.combatManager.establishBoardEventCallback((eventType, data) => {
            if (eventType === 'induce_fear') {
                this.setState({ boardFearActive: true, fearCastingActive: true });
                const duration = (data && data.duration) ? data.duration : 20000;
                this._setTimeout(() => {
                    this.setState({ boardFearActive: false });
                }, duration);
                // Glow persists only for the cast moment, not the full fear duration
                this._setTimeout(() => {
                    this.setState({ fearCastingActive: false });
                }, 1800);
            }

            if (eventType === 'entropic_kindred') {
                const addedCols = (data && data.addedCols) ? data.addedCols : 3;
                const insertAt = (data && typeof data.insertAt === 'number') ? data.insertAt : 4;
                const newTotalCols = this.state.numBoardColumns + addedCols;

                // 1. Shift coordinates of existing tiles that are at or past the insertion point
                const shiftedTiles = this.state.combatTiles.map(tile => {
                    if (tile.x >= insertAt) {
                        return { ...tile, x: tile.x + addedCols };
                    }
                    return tile;
                });

                // 2. Generate the new empty tiles at the insertion columns (insertAt ... insertAt + addedCols - 1)
                const newTiles = [];
                for (let col = insertAt; col < insertAt + addedCols; col++) {
                    for (let row = 0; row < MAX_ROWS; row++) {
                        newTiles.push({
                            id: -1, // temporary placeholder
                            x: col,
                            y: row
                        });
                    }
                }

                // 3. Combine and sort all tiles row-by-row (y ascending, then x ascending)
                const combinedTiles = [...shiftedTiles, ...newTiles];
                combinedTiles.sort((a, b) => {
                    if (a.y !== b.y) return a.y - b.y;
                    return a.x - b.x;
                });

                // 4. Assign correct sequential IDs based on sorted index
                const updatedTiles = combinedTiles.map((tile, idx) => ({
                    ...tile,
                    id: idx
                }));

                // Re-initialize ghostPortraitMatrix to match the new size
                const newGhostPortraitMatrix = Array(updatedTiles.length).fill(null);

                // Build flash-column strips: one per new column, staggered
                const newColStrips = [];
                for (let i = 0; i < addedCols; i++) {
                    newColStrips.push({ colIndex: insertAt + i, delay: i * 120 });
                }

                // Show the expanded board immediately so tiles appear in correct positions
                this.setState({
                    numBoardColumns: newTotalCols,
                    entropicKindredNewCols: newColStrips,
                    combatTiles: updatedTiles,
                    ghostPortraitMatrix: newGhostPortraitMatrix
                });

                // Clear the flash strips after animation completes
                this._setTimeout(() => {
                    this.setState({ entropicKindredNewCols: [] });
                }, 1800);
            }
        });

        // For simulation battles: seed a tier-1 weapon into the group inventory so
        // goblin sticky-fingers has a valid item to steal during testing.
        if (this.props.isSimulation && this.props.inventoryManager &&
            typeof this.props.inventoryManager.addItemsByName === 'function') {
            this.props.inventoryManager.addItemsByName(['shortsword_sword']);
        }

        // Ensure every crew member's equipped weapons reflect the current
        // damage/stat values from inventory-manager before combat begins.
        if (this.props.inventoryManager && typeof this.props.inventoryManager.refreshWeaponStats === 'function') {
            (this.props.crew || []).forEach(member => {
                if (member && Array.isArray(member.inventory)) {
                    member.inventory = this.props.inventoryManager.refreshWeaponStats(member.inventory);
                }
            });
        }

        this.props.combatManager.initializeCombat({
            crew: this.props.crew,
            leader: this.getCrewLeader(),
            monster: this.props.monster,
            minions: this.props.minions

        })

        if (this.props.combatManager && typeof this.props.combatManager.pauseCombat === 'function') {
            this.props.combatManager.pauseCombat(!!this.props.paused);
        }

        if (this.props.animationManager && typeof this.props.animationManager.initialize === 'function') {
            this.props.animationManager.initialize(NUM_COLUMNS, MAX_ROWS);
        }

        this.setState({
            combatTiles: arr, ghostPortraitMatrix,
            monsterPortrait: this.props.monster?.portrait
        })

        // Wire the MonsterBattle component instance into the AI roster so
        // fighter profiles (e.g. Wizard) can call back to update UI state
        // directly. This is a best-effort hookup; other pages (CombatSimulator)
        // may also wire the ref.
        try {
            if (this.props.combatManager && this.props.combatManager.fighterAI && this.props.combatManager.fighterAI.roster && this.props.combatManager.fighterAI.roster.wizard) {
                this.props.combatManager.fighterAI.roster.wizard.monsterBattleRef = this;
            }
        } catch (err) {
            console.warn('failed to wire monsterBattleRef to wizard AI', err);
        }
        try {
            if (this.props.combatManager && this.props.combatManager.fighterAI && this.props.combatManager.fighterAI.roster && this.props.combatManager.fighterAI.roster.soldier) {
                this.props.combatManager.fighterAI.roster.soldier.monsterBattleRef = this;
            }
        } catch (err) {
            console.warn('failed to wire monsterBattleRef to soldier AI', err);
        }

        let arrowUp = new Image()
        arrowUp.src = images['arrowUp']
        let that = this;
        arrowUp.onload = function () {
            that.setState({
                arrowUpImage: arrowUp
            })
        }
        // key handling moved to parent DungeonPage

        // Continuous RAF loop to smoothly animate cooldowns at 60 FPS
        const updateLoop = () => {
            if (this._isMounted) {
                const isCombatActive = this.props.combatManager && !this.props.combatManager.gameOver && !this.props.paused;
                if (isCombatActive) {
                    this.forceUpdate();
                }
                this._rafId = requestAnimationFrame(updateLoop);
            }
        };
        this._rafId = requestAnimationFrame(updateLoop);
    }
    componentDidUpdate(prevProps, prevState) {
        if (prevProps.paused !== this.props.paused && this.props.combatManager && typeof this.props.combatManager.pauseCombat === 'function') {
            this.props.combatManager.pauseCombat(!!this.props.paused);
        }

        // When the summary panel appears, schedule clearing of any
        // `justLeveled` flags recorded on crew members so the arrow and
        // gain details are only visible temporarily. We clear the flags on
        // the authoritative CrewManager and then force a re-render.
        try {
            if (!prevState.showSummaryPanel && this.state.showSummaryPanel) {
                const crew = (this.props.crewManager && Array.isArray(this.props.crewManager.crew)) ? this.props.crewManager.crew : [];
                crew.forEach((m) => {
                    if (m && m.justLeveled) {
                        // schedule clearing after the summary animation/timeout
                        this._setTimeout(() => {
                            try {
                                if (this.props.crewManager && typeof this.props.crewManager.clearLevelFlags === 'function') {
                                    this.props.crewManager.clearLevelFlags(m);
                                }
                                // ensure UI updates
                                try { this.forceUpdate(); } catch (e) { }
                            } catch (err) {
                                console.warn('Failed to clear level flags for member', m, err);
                            }
                        }, 3500);
                    }
                });
            }
        } catch (err) {
            console.warn('componentDidUpdate: level-flag clearing failed', err);
        }

        if (prevState.combatLog.length !== this.state.combatLog.length && this.latestCombatLogEntryRef.current) {
            try {
                this.latestCombatLogEntryRef.current.scrollIntoView({
                    block: 'center',
                    behavior: 'smooth'
                });
            } catch (err) {
                console.warn('componentDidUpdate: combat-log scroll failed', err);
            }
        }
    }
    componentWillUnmount() {
        // mark unmounted to prevent async callbacks attempting setState
        try { this._isMounted = false; } catch (e) { }
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
        }
        // Detach callbacks first so in-flight manager timers cannot call setState.
        try {
            if (this.props && this.props.combatManager) {
                const noop = () => { };
                if (typeof this.props.combatManager.establishMessageCallback === 'function') this.props.combatManager.establishMessageCallback(noop);
                if (typeof this.props.combatManager.establishUpdateMatrixCallback === 'function') this.props.combatManager.establishUpdateMatrixCallback(noop);
                if (typeof this.props.combatManager.establishUpdateActorCallback === 'function') this.props.combatManager.establishUpdateActorCallback(noop);
                if (typeof this.props.combatManager.establishUpdateDataCallback === 'function') this.props.combatManager.establishUpdateDataCallback(noop);
                if (typeof this.props.combatManager.establishBoardEventCallback === 'function') this.props.combatManager.establishBoardEventCallback(noop);
                if (typeof this.props.combatManager.establishGameOverCallback === 'function') this.props.combatManager.establishGameOverCallback(noop);
                if (typeof this.props.combatManager.establishGreetingCompleteCallback === 'function') this.props.combatManager.establishGreetingCompleteCallback(noop);
                if (typeof this.props.combatManager.establishOnFighterMovedToDestinationCallback === 'function') this.props.combatManager.establishOnFighterMovedToDestinationCallback(noop);
                if (typeof this.props.combatManager.establishOnFighterDeathCallback === 'function') this.props.combatManager.establishOnFighterDeathCallback(noop);
                if (typeof this.props.combatManager.establishMorphPortraitCallback === 'function') this.props.combatManager.establishMorphPortraitCallback(noop);
            }
        } catch (e) { }
        // Best-effort: disconnect combat manager callbacks so no further calls come in
        try { if (this.props && this.props.combatManager && typeof this.props.combatManager.shutdown === 'function') this.props.combatManager.shutdown(); } catch (e) { }
        try { if (this.props && this.props.combatManager && typeof this.props.combatManager.disconnectOverlayManager === 'function') this.props.combatManager.disconnectOverlayManager(); } catch (e) { }
        // Flush all canvas and tile animations immediately so in-flight missiles,
        // fireballs etc. can't appear at the start of the next combat session.
        try { if (this.props && this.props.animationManager && typeof this.props.animationManager.reset === 'function') this.props.animationManager.reset(); } catch (e) { }
        // Clear any timers/intervals this component created
        try { if (Array.isArray(this._timers)) { this._timers.forEach(t => clearTimeout(t)); this._timers = []; } } catch (e) { }
        try { if (Array.isArray(this._intervals)) { this._intervals.forEach(i => clearInterval(i)); this._intervals = []; } } catch (e) { }
    }
    monster = () => {
        // console.log('monster: ', this.state.battleData[this.props.monster.id]);
        return this.state.battleData[this.props.monster.id]
    }
    getFighterDetails = (propsRefFighter) => {
        // console.log('monster: ', this.state.battleData[this.props.monster.id]);
        return this.state.battleData[propsRefFighter.id]
    }
    targetOf = (caller) => {
        let c = this.state.battleData[caller.id],
            target = c.targetId ? this.state.battleData[c.targetId] : null;
        return target
    }
    monsterDirectionReversed = () => {
        if (!this.monster()) return false
        return this.monster()?.coordinates.x < this.targetOf(this.monster())?.coordinates.x
    }
    minionDirectionReversed = (minionReference) => {
        const minion = this.state.battleData[minionReference.id]
        if (!minion || !minion.targetId) return false
        return minion?.coordinates?.x < this.targetOf(minion)?.coordinates.x
    }
    getHitAnimation = (combatant) => {
        if (!combatant || !combatant.wounded) return '';
        return `hit-from-${combatant.wounded.sourceDirection}-${combatant.wounded.severity}`
    }

    // Small helper to convert small counts to Roman numerals for UI badges
    romanNumeral = (n) => {
        if (!n || n <= 0) return '';
        const roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
        return roman[Math.min(n, roman.length - 1)];
    }

    // fighterFacingRight = (fighter) => {
    //     return this.props.combatManager.fighterFacingRight(fighter)
    // }
    // fighterFacingUp = (fighter) => {
    //     if(!fighter) return
    //     return this.props.combatManager.fighterFacingUp(fighter)
    // }
    // fighterFacingDown = (fighter) => {
    //     if(!fighter) return
    //     return this.props.combatManager.fighterFacingDown(fighter)
    // }
    // monsterFacingUp = (monster) => {
    //     return this.props.combatManager.monsterFacingUp(monster)
    // }
    // monsterFacingDown = (monster) => {
    //     return this.props.combatManager.monsterFacingDown(monster)
    // }
    milliDelay = (numMilliseconds) => {
        return new Promise((resolve) => {
            this._setTimeout(() => {
                resolve(numMilliseconds, ' complete')
            }, numMilliseconds)
        })
    }
    morphPortrait = () => {
        let stringBase = 'witch_p1_', count = 1, string;
        const morphInterval = this._setInterval(() => {
            string = stringBase + count;
            this.setState({
                monsterPortrait: images[string]
            })
            count++
            if (count > 8) clearInterval(morphInterval)
        }, 300)
    }
    greetingComplete = () => {
        this.combatBegins()
        this.setState({ greetingInProcess: false })
    }
    tabToFighter = () => {
        const liveCrew = this.getSortedLiveCrew();
        if (liveCrew.length === 0) return;
        const currentIndex = this.state.selectedFighter ? liveCrew.findIndex(e => e.id === this.state.selectedFighter.id) : -1;
        const nextIndex = currentIndex === liveCrew.length - 1 ? 0 : currentIndex + 1;
        const selectedFighter = liveCrew[nextIndex];
        if (!selectedFighter) return;
        if (this.props.combatManager && typeof this.props.combatManager.setSelectedFighter === 'function') {
            this.props.combatManager.setSelectedFighter(selectedFighter);
        }

        // Do NOT enable manual mode here; just select the fighter
        this.setState({
            selectedFighter,
            glyphTrayExpanded: selectedFighter.type === 'wizard',
            manualControl: false // Ensure manual mode is off when tabbing
        })
    }
    tabToRetarget = () => {
        if (!this.state.selectedFighter) return
        this.props.combatManager.manualRetarget(this.state.selectedFighter)
    }
    selectSpecial = () => {
        let selectedFighter = this.state.selectedFighter;
        let specials = selectedFighter?.specials;
        let consumableSpecials = selectedFighter?.specialActions;
        let currentSpecialIndex = specials.findIndex(a => a.selected)
        specials.forEach(a => a.selected = false)
        if (consumableSpecials.length) {
            consumableSpecials.forEach(a => a.selected = false)
        }



        if (currentSpecialIndex >= 0) {

            if (specials[currentSpecialIndex + 1]) {
                specials[currentSpecialIndex + 1].selected = true;
            } else {
                // all cleared
            }
        } else {
            specials[0].selected = true;
        }
    }
    selectConsumableSpecial = () => {
        let selectedFighter = this.state.selectedFighter;
        let specials = selectedFighter?.specials;
        let consumableSpecials = selectedFighter?.specialActions;

        let currentSpecialIndex = consumableSpecials.findIndex(a => a.selected);
        consumableSpecials.forEach(a => a.selected = false)
        if (specials) specials.forEach(a => a.selected = false)
        // currentSpecialIndex available for diagnostics
        // console.log('consumableSpecials: ', consumableSpecials, 'currentindex: ', currentSpecialIndex);
        if (currentSpecialIndex >= 0) {
            if (consumableSpecials[currentSpecialIndex + 1]) {
                consumableSpecials[currentSpecialIndex + 1].selected = true;
            } else {
                // all cleared
            }
        } else {
            consumableSpecials[0].selected = true;
        }
    }
    getActionBarLeftValForFighter = (id) => {
        // Determine the left pixel position for the action bar. For vertical facings
        // (up/down) we treat them like non-left-facing so the bar aligns over the
        // fighter rather than shifting left by the range width.
        const selectedFighter = this.state.battleData[id];
        const details = this.getFighterDetails(selectedFighter);
        const baseX = (details?.coordinates.x || 0) * 100;
        // Use the fighter details when asking combatManager for the range width
        const rangeWidth = this.props.combatManager.getRangeWidthVal(details) || 0;
        // If the fighter is explicitly facing left, offset to the left by the range width;
        // otherwise (right, up, down, or undefined) place the bar to the right.
        const offset = (selectedFighter?.facing === 'left') ? (0 - (rangeWidth * 100)) : 100;
        return baseX + offset;
    }
    fighterPortraitClicked = (id) => {
        const selectedFighter = this.state.battleData[id];
        const crewMember = this.props.crew.find(e => e.id === id);
        if (crewMember && crewMember.portrait) {
            selectedFighter.portrait = crewMember.portrait;
        }
        if (this.state.showCrosshair) {
            this.props.combatManager.queueAction(this.state.selectedFighter.id, id, this.state.selectedAttack)
            this.setState({
                showCrosshair: false
            })
        } else {
            this.props.combatManager.setSelectedFighter(selectedFighter)
            this.setState({
                selectedFighter,
                selectedMonster: null,
                selectedAttack: null
            })
        }
    }
    pickRandom = (array) => {
        let index = Math.floor(Math.random() * array.length)
        return array[index]
    }

    getCrewLeader = () => {
        return this.props.crew.find(e => e.isLeader)
    }

    setMessage = (messageData) => {
        const { message, source } = messageData;
        this.setState({
            message,
            source
        })
    }
    renderAnimation = () => {
        // nothin
    }
    updateIndicatorsMatrix = (indicatorsMatrix) => {
        this.setState({
            indicatorsMatrix
        })
    }
    getAllOverlaysById = (id) => {
        const animationsMatrix = this.state.animationOverlays[id].animations;
        let finalVal = [];
        Object.values(animationsMatrix).forEach(e => {
            finalVal = finalVal.concat(e);
        })
        return finalVal;
    }
    // initializeOverlayManager = (combatants) => {
    //     console.log('initializing overlay manager (from MB), combatants: ', combatants);
    //     combatants.forEach(c=>{
    //         this.props.overlayManager.addCombatant(c)
    //     })
    //     console.log('finally, overlayManager matrix: ', this.props.overlayManager.overlays);
    //     this.props.overlayManager.launchUpdateInterval()
    // }
    recieveAnimationBroadcastFromOverlayManager = (animationOverlaysUpdated) => {
        // const animationOverlays = this.state.animationOverlays;÷
        // switch(broadcastType){
        //     case 'add':
        //         animationOverlays.push(data.animation)
        //     break;
        //     case 'update':
        //         const overlay = animationOverlays.find(a=>a.id === data.id)
        //         console.log('found overlay: ', overlay);
        //     break;
        // }
        this.setState({
            animationOverlays: animationOverlaysUpdated
        })
        // console.log('animation overlays from state: ', this.state.animationOverlays);
    }
    updateBattleData = (battleData) => {
        if (!this._isMounted) return;

        const clonedBattleData = JSON.parse(JSON.stringify(battleData));

        // Preserve dead crew members so they are kept in state and can be rendered
        // in the "Dead Crew" summary column, even after being deleted from combatants map.
        if (this.state.battleData && Object.keys(clonedBattleData).length > 0) {
            Object.values(this.state.battleData).forEach(oldMember => {
                if (oldMember && !oldMember.isMonster && !oldMember.isMinion && !oldMember.isVCT) {
                    if (!clonedBattleData[oldMember.id]) {
                        clonedBattleData[oldMember.id] = {
                            ...oldMember,
                            dead: true,
                            hp: 0
                        };
                    }
                }
            });
        }

        // Ensure wizards have at least 3 "magic missile" spells available in their specialActions
        // Only for simulation-originated battles.
        if (this.props.isSimulation) {
            this.ensureWizardSpells(clonedBattleData);
        }
        // Normalize battleData entries to ensure UI rendering doesn't get tripped
        // by missing fields (portrait, damageIndicators). This helps avoid
        // empty portrait placeholders if an upstream producer omitted the field.
        try {
            Object.values(clonedBattleData).forEach(entry => {
                if (!entry) return;
                if (typeof entry.portrait === 'undefined' || entry.portrait === null) {
                    // Use canonical avatar fallback
                    entry.portrait = images['avatar'];
                }
                if (!Array.isArray(entry.damageIndicators)) entry.damageIndicators = [];
                if (!Array.isArray(entry.damageIndicators)) console.log('[DIAG][MonsterBattle] Initialized entry.damageIndicators as empty array for', entry);
            });
        } catch (err) {
            console.warn('updateBattleData: normalization failed', err);
        }

        const combatLog = this.props.combatManager && typeof this.props.combatManager.getCombatLog === 'function'
            ? this.props.combatManager.getCombatLog()
            : [];

        const selectedFighterId = this.state.selectedFighter?.id;
        // Deselect immediately if the fighter dies or gets dominated
        const nextSelectedFighter = selectedFighterId
            ? (clonedBattleData[selectedFighterId] && !clonedBattleData[selectedFighterId].dead && !clonedBattleData[selectedFighterId].dominated ? clonedBattleData[selectedFighterId] : null)
            : null;

        const selectedMonsterId = this.state.selectedMonster?.id;
        // Deselect immediately if the monster dies
        const nextSelectedMonster = selectedMonsterId
            ? (clonedBattleData[selectedMonsterId] && !clonedBattleData[selectedMonsterId].dead ? clonedBattleData[selectedMonsterId] : null)
            : null;

        this.setState({
            battleData: clonedBattleData,
            combatLog,
            ...(selectedFighterId ? { selectedFighter: nextSelectedFighter } : {}),
            ...(selectedMonsterId ? { selectedMonster: nextSelectedMonster } : {})
        }, () => {
            if (!this._isMounted) return;
            // If nothing is selected (neither fighter nor monster is active/alive), pick the default top-most / left-most crew member
            if (!this.state.selectedFighter && (!this.state.selectedMonster || this.state.selectedMonster.dead)) {
                const liveCrew = this.getSortedLiveCrew();
                if (liveCrew && liveCrew.length) {
                    const first = liveCrew[0];
                    // inform combatManager (authoritative) and update local state
                    if (this.props.combatManager && typeof this.props.combatManager.setSelectedFighter === 'function') {
                        this.props.combatManager.setSelectedFighter(first);
                    }
                    this.setState({
                        selectedFighter: first,
                        selectedMonster: null,
                        glyphTrayExpanded: first.type === 'wizard',
                        greetingInProcess: false // show interaction pane by default
                    });
                }
            }
        })
        // NOTE: persistence of HP/dead should only occur when combat ends
        // to avoid excessive writes; see gameOver for persistence logic.
    }

    // Allow external callers (AI helpers) to push an update for a single
    // fighter object into MonsterBattle's internal `battleData` state and
    // trigger a re-render. This is used by fighter AIs (e.g. Wizard) to
    // notify the UI that a fighter's consumable `specialActions` changed so
    // the interaction pane updates immediately.
    applyFighterUpdate = (fighter) => {
        if (!fighter || !fighter.id) return;
        try {
            // Clone existing battleData to ensure React sees the new reference
            const battleData = Object.assign({}, this.state.battleData);
            // Merge/replace the fighter entry with a shallow-cloned copy
            battleData[fighter.id] = JSON.parse(JSON.stringify(fighter));
            const newState = { battleData };
            // If the updated fighter is currently selected, keep selectedFighter
            // in-sync with the authoritative object.
            if (this.state.selectedFighter && this.state.selectedFighter.id === fighter.id) {
                newState.selectedFighter = battleData[fighter.id];
            }
            this.setState(newState);

            // Also persist consumable specialActions back to the global meta so
            // the DungeonPage and other pages reflect the updated counts immediately.
            try {
                // Notify parent (DungeonPage) if it provided a handler so it can
                // update its own state/selectedCrewMember immediately.
                try {
                    if (this.props && typeof this.props.onFighterUpdate === 'function') {
                        try { this.props.onFighterUpdate(battleData[fighter.id]); } catch (e) { }
                    }
                } catch (e) { }
                const meta = getMeta();
                if (meta && Array.isArray(meta.crew)) {
                    const idx = meta.crew.findIndex(c => c && c.id === fighter.id);
                    if (idx !== -1) {
                        // copy the specialActions from the updated fighter into meta
                        meta.crew[idx].specialActions = JSON.parse(JSON.stringify(battleData[fighter.id].specialActions || []));
                        storeMeta(meta);
                        // fire-and-forget server update to persist the change
                        try { updateUserRequest(getUserId(), meta).catch(() => { }); } catch (e) { }
                    }
                }
            } catch (err) {
                console.warn('applyFighterUpdate: failed to persist specialActions to meta', err);
            }
        } catch (err) {
            console.warn('applyFighterUpdate failed', err);
        }
    }

    // Public helper to toggle the inventory popup from parent via ref
    toggleInventory = () => {
        try {
            this.setState((prev) => ({ showInventoryPopup: !prev.showInventoryPopup }));
        } catch (err) {
            console.warn('toggleInventory failed', err);
        }
    }

    closeActiveEffectPopup = () => {
        const wasPausedWhenOpened = this.state.popupOpenedWhilePaused;
        this.setState({ activeEffectPopup: null });
        if (!wasPausedWhenOpened && this.props.combatManager && typeof this.props.combatManager.pauseCombat === 'function') {
            this.props.combatManager.pauseCombat(false);
        }
    }

    closeActiveSkillPopup = () => {
        const wasPausedWhenOpened = this.state.popupOpenedWhilePaused;
        this.setState({ activeSkillPopup: null });
        if (!wasPausedWhenOpened && this.props.combatManager && typeof this.props.combatManager.pauseCombat === 'function') {
            this.props.combatManager.pauseCombat(false);
        }
    }

    // Ensure each wizard combatant has at least 3 magic missile spells in their specialActions
    ensureWizardSpells = (battleData) => {
        if (!battleData) return;
        Object.values(battleData).forEach(combatant => {
            try {
                if (!combatant) return;
                if (combatant.type !== 'wizard') return;
                if (!combatant.specialActions) combatant.specialActions = [];
                const existing = combatant.specialActions.filter(sa => sa && sa.type === 'spell' && (sa.subtype === 'magic missile' || (sa.name && sa.name.toLowerCase().includes('magic missile'))));
                const needed = Math.max(0, 3 - existing.length);
                for (let i = 0; i < needed; i++) {
                    const newSpell = {
                        type: 'spell',
                        subtype: 'magic missile',
                        name: 'magic missile',
                        iconUrl: (images['magic_missile_icon']?.default || images['magic_missile_icon']) || (images['magic_missile']?.default || images['magic_missile']) || '',
                        selected: false,
                        cooldown_position: 100
                    };
                    // If a combatManager is available, merge in any canonical
                    // definition fields (energy_cost, cooldown, damage, etc.) so
                    // AI paths that expect those properties see them on the
                    // created specialAction objects.
                    try {
                        const cm = this.props && this.props.combatManager;
                        const def = cm && (
                            (cm.specialsMatrix && (cm.specialsMatrix['magic_missile'] || cm.specialsMatrix['major_magic_missile'] || cm.specialsMatrix['greater_magic_missile'])) ||
                            (cm.attacksMatrix && (cm.attacksMatrix['magic_missile'] || cm.attacksMatrix['major_magic_missile'] || cm.attacksMatrix['greater_magic_missile']))
                        );
                        if (def) {
                            ['energy_cost', 'cooldown', 'damage', 'effect', 'level', 'icon'].forEach(k => {
                                if (typeof def[k] !== 'undefined' && typeof newSpell[k] === 'undefined') {
                                    newSpell[k] = def[k];
                                }
                            });
                        }
                    } catch (err) {
                        console.debug('ensureWizardSpells merge diagnostic error', err);
                    }
                    combatant.specialActions.push(newSpell);
                }
            } catch (err) {
                // defensive: don't break update if something unexpected exists
                console.warn('ensureWizardSpells error', err);
            }
        });
    }

    // Return live crew sorted by top-most (lowest y) first, then left-to-right (lowest x)
    getSortedLiveCrew = () => {
        const crew = Object.values(this.state.battleData).filter(e => (!e.isMonster && !e.isMinion) && !e.dead);
        crew.sort((a, b) => {
            const ay = a.coordinates?.y ?? 0;
            const by = b.coordinates?.y ?? 0;
            if (ay !== by) return ay - by; // top-most first
            const ax = a.coordinates?.x ?? 0;
            const bx = b.coordinates?.x ?? 0;
            return ax - bx; // left-to-right
        });
        return crew;
    }
    updateAnimationData = (animationData) => {
        this.setState({
            animationData
        })
    }
    confirmClicked = () => {
        const hasLevelUps = Object.keys(this.state.levelTransitions || {}).length > 0;
        if (hasLevelUps && this.state.battleResult === 'win') {
            const queue = [];
            (this.props.crew || []).forEach(member => {
                if (member && Array.isArray(member.pendingLevelUpPicks) && member.pendingLevelUpPicks.length > 0) {
                    member.pendingLevelUpPicks.forEach(lvl => {
                        queue.push({
                            crewMember: member,
                            fromLevel: lvl - 1,
                            toLevel: lvl
                        });
                    });
                }
            });
            if (queue.length > 0) {
                this.setState({ showLevelUpScreen: true, levelUpQueue: queue });
                return;
            }
        }
        this.props.battleOver(this.state.battleResult);
    }
    handleLevelUpComplete = () => {
        this.setState({ showLevelUpScreen: false, levelUpQueue: [] }, () => {
            this.props.battleOver(this.state.battleResult);
        });
    }
    combatBegins = () => {
        this.setState({
            combatStarted: true
        })
    }
    gameOver = (outcome) => {
        // outcome received

        // Ensure gameOver runs only once per battle instance to avoid duplicate
        // awards or duplicated UI flows when multiple gameOver triggers fire.
        if (this._gameOverHandled) {
            // already handled
            return;
        }
        this._gameOverHandled = true;

        // Snapshot battle data BEFORE reset() wipes combatManager.combatants.
        // Attempt to use the freshest battleData available. Prefer component state
        // (updated via updateBattleData). If that's empty (race), fall back to the
        // authoritative combatManager.combatants snapshot.
        let latestBattleData = (this.state.battleData && Object.keys(this.state.battleData).length) ? this.state.battleData : (this.props.combatManager && this.props.combatManager.combatants ? JSON.parse(JSON.stringify(this.props.combatManager.combatants)) : {});

        const executeTeardown = () => {
            this.props.overlayManager.reset();
            this.props.combatManager.reset();

            if (this.props.isSimulation) {
                // exit simulation
                this.props.exitSimulator();
                return;
            }
        };

        if (this.props.isSimulation) {
            setTimeout(executeTeardown, 2500);
            return;
        }

        this._setTimeout(() => {
            executeTeardown();

            let experienceGained,
                goldGained,
                foodGained = 0,
                itemsGained,
                crewWins = outcome === 'crewWins' || outcome === true,
                summaryMessage, battleResult, levelTransitions = {},
                xpPercentsBefore = {};

            // liveCrew should be derived from the freshest snapshot
            let liveCrew = Object.values(latestBattleData).filter(e => !e.dead && !e.isMinion && !e.isMonster);
            if (crewWins) {
                battleResult = 'win';
                summaryMessage = 'The enemy is no more!';
                if (this.props.monster.drops) {
                    itemsGained = [];
                    this.props.monster.drops.forEach(e => {
                        let d = Math.random();
                        if (d < e.percentChance * .01) {
                            if (e.itemPool && Array.isArray(e.itemPool) && e.itemPool.length > 0) {
                                // Supports both flat pools and nested pools like [WEAPONS, ARMOR, MAGICAL]
                                const pickFromPool = (pool) => {
                                    if (!Array.isArray(pool) || pool.length === 0) return null;
                                    const idx = Math.floor(Math.random() * pool.length);
                                    const picked = pool[idx];
                                    return Array.isArray(picked) ? pickFromPool(picked) : picked;
                                };
                                const itemFromPool = pickFromPool(e.itemPool);
                                if (itemFromPool) itemsGained.push(itemFromPool);
                            } else if (e.item) {
                                itemsGained.push(e.item);
                            }
                        }
                    })
                    this.props.inventoryManager.addItemsByName(itemsGained)
                }
                experienceGained = this.props.monster.level * 10;
                try {
                    let spiderKillsCount = 0;
                    Object.values(latestBattleData || {}).forEach(c => {
                        if (c && c.type === 'spider_minion' && c.dead && c.hp <= 0 && !c.hasContacted) {
                            spiderKillsCount++;
                        }
                    });
                    if (spiderKillsCount > 0) {
                        const spiderXp = spiderKillsCount * 10;
                        experienceGained += spiderXp;
                        console.log(`[Spider XP] Added ${spiderXp} XP for killing ${spiderKillsCount} spider(s) before contact.`);
                    }
                } catch (e) { console.warn('[Spider XP] calculation failed', e); }
                // ── Battle Tactics: apply XP multiplier if an active tactic is in effect ──
                try {
                    const soldierMember = (this.props.crew || []).find(m => m && (m.type === 'soldier' || m.image === 'soldier'));
                    if (soldierMember) {
                        const activeTactic = (soldierMember.specialActions || []).find(
                            a => a && a.type === 'tactics' && a.available === true && (a.combatsRemaining || 0) > 0
                        );
                        if (activeTactic) {
                            const tacticDef = BATTLE_TACTICS[activeTactic.tacticKey];
                            if (tacticDef && tacticDef.xpMultiplier && tacticDef.xpMultiplier > 1) {
                                const rawXp = experienceGained;
                                experienceGained = Math.round(experienceGained * tacticDef.xpMultiplier);
                                console.log(`[Battle Tactics] XP boosted by ${tacticDef.name}: ${rawXp} → ${experienceGained} (×${tacticDef.xpMultiplier})`);
                            }
                        }
                    }
                } catch (e) { console.warn('[Battle Tactics] XP multiplier failed', e); }
                goldGained = Math.floor(Math.random() * experienceGained);
                // Defensive: log inventory/gold state before adding to help trace duplicate updates
                try { /* inventory snapshot suppressed */ } catch (e) { }
                // Food reward: 20% chance 5-15, 10% chance 20-30, 5% chance 40-60
                try {
                    const foodRoll = Math.random();
                    let foodRolled = 0;
                    if (foodRoll < 0.05) {
                        foodRolled = Math.floor(Math.random() * 21) + 40; // 40-60
                    } else if (foodRoll < 0.15) {
                        foodRolled = Math.floor(Math.random() * 11) + 20; // 20-30
                    } else if (foodRoll < 0.35) {
                        foodRolled = Math.floor(Math.random() * 11) + 5;  // 5-15
                    }
                    if (foodRolled > 0) {
                        foodGained = foodRolled;
                        const metaFood = getMeta() || {};
                        metaFood.food = (typeof metaFood.food === 'number' ? metaFood.food : 55) + foodGained;
                        try { storeMeta(metaFood); } catch (e) { }
                        console.log(`[Combat] food reward: +${foodGained} (total: ${metaFood.food})`);
                    }
                } catch (e) { console.warn('food reward failed', e); }
                // Ensure we only award gold once per battle
                if (!this._goldAwarded) {
                    try {
                        this.props.inventoryManager.addCurrency({ type: 'gold', amount: goldGained })
                        this._goldAwarded = true;
                    } catch (err) {
                        console.warn('gameOver: addCurrency failed', err);
                    }
                } else {
                    // gold already awarded, skipping
                }
                // ── Reagent loot drop: 15% chance per combat victory ─────────────
                try {
                    if (Math.random() < 0.15) {
                        const pickedKey = REAGENT_KEYS[Math.floor(Math.random() * REAGENT_KEYS.length)];
                        const reagentDef = REAGENTS[pickedKey];
                        if (reagentDef && this.props.inventoryManager) {
                            this.props.inventoryManager.addItem({ ...reagentDef });
                            // Trigger the loot arc overlay if parent exposes it
                            try {
                                if (typeof this.props.onTriggerLootArc === 'function') {
                                    this.props.onTriggerLootArc({ type: 'reagent', id: pickedKey + Math.random(), icon: images[reagentDef.icon], name: reagentDef.name });
                                }
                            } catch (e) { }
                        }
                    }
                } catch (e) { console.warn('reagent loot drop failed', e); }

                // ── Brew ingredient loot drop: 15% chance per combat victory if Barbarian is in party ─────────────
                try {
                    const hasBarbarian = (this.props.crew || []).some(m => m && m.type === 'barbarian');
                    if (hasBarbarian && Math.random() < 0.15) {
                        const pickedKey = BREW_INGREDIENT_KEYS[Math.floor(Math.random() * BREW_INGREDIENT_KEYS.length)];
                        const ingredientDef = BREW_INGREDIENTS[pickedKey];
                        if (ingredientDef && this.props.inventoryManager) {
                            this.props.inventoryManager.addItem({ ...ingredientDef });
                            try {
                                if (typeof this.props.onTriggerLootArc === 'function') {
                                    this.props.onTriggerLootArc({ type: 'reagent', id: pickedKey + Math.random(), icon: images[ingredientDef.icon], name: ingredientDef.name });
                                }
                            } catch (e) { }
                        }
                    }
                } catch (e) { console.warn('brew ingredient loot drop failed', e); }

                // ── Dust loot drop: 10% chance per combat victory ─────────────
                try {
                    if (Math.random() < 0.10) {
                        const dustRoll = Math.random();
                        let pickedKey = 'rubedo_dust';
                        if (dustRoll < 0.05) {
                            pickedKey = 'monadic_nugget';
                        } else if (dustRoll < 0.20) {
                            pickedKey = 'monadic_dust';
                        } else if (dustRoll < 0.60) {
                            pickedKey = 'spectral_dust';
                        } else {
                            pickedKey = 'rubedo_dust';
                        }
                        const dustDef = DUST_TYPES[pickedKey];
                        if (dustDef && this.props.inventoryManager) {
                            this.props.inventoryManager.addItem({ ...dustDef });
                            try {
                                if (typeof this.props.onTriggerLootArc === 'function') {
                                    this.props.onTriggerLootArc({ type: 'reagent', id: pickedKey + Math.random(), icon: images[dustDef.icon], name: dustDef.name });
                                }
                            } catch (e) { }
                        }
                    }
                } catch (e) { console.warn('dust loot drop failed', e); }

                // Snapshot levels before awarding XP so we can show before→after
                const levelsBefore = {};
                try {
                    (this.props.crewManager.crew || []).forEach(c => {
                        if (c && c.id) {
                            levelsBefore[c.id] = typeof c.level === 'number' ? c.level : 0;
                            xpPercentsBefore[c.id] = this.props.crewManager.calculateExpPercentage(c);
                        }
                    });
                } catch (e) { }
                // Use latest liveCrew snapshot when awarding experience
                try { this.props.crewManager.addExperience(liveCrew, experienceGained); } catch (e) { console.warn('addExperience failed', e); }
                // ── Battle Tactics: decrement combatsRemaining after this victory ──
                try {
                    const meta = getMeta() || {};
                    const metaCrew = Array.isArray(meta.crew) ? meta.crew : (this.props.crewManager.crew || []);
                    const soldierInMeta = metaCrew.find(m => m && (m.type === 'soldier' || m.image === 'soldier'));
                    if (soldierInMeta) {
                        const tacticAction = (soldierInMeta.specialActions || []).find(
                            a => a && a.type === 'tactics' && a.available === true && (a.combatsRemaining || 0) > 0
                        );
                        if (tacticAction) {
                            tacticAction.combatsRemaining = Math.max(0, (tacticAction.combatsRemaining || 1) - 1);
                            if (tacticAction.combatsRemaining === 0) {
                                // Tactic fully consumed — clear it
                                soldierInMeta.specialActions = (soldierInMeta.specialActions || []).filter(a => a !== tacticAction);
                                console.log(`[Battle Tactics] "${tacticAction.name}" fully consumed after this combat.`);
                            } else {
                                console.log(`[Battle Tactics] "${tacticAction.name}" — ${tacticAction.combatsRemaining} combat(s) remaining.`);
                            }
                            // Sync back to live crewManager
                            const liveSoldier = (this.props.crewManager.crew || []).find(m => m && m.id === soldierInMeta.id);
                            if (liveSoldier) {
                                liveSoldier.specialActions = soldierInMeta.specialActions;
                            }
                            meta.crew = metaCrew;
                            try { storeMeta(meta); } catch (e) { }
                        }
                    }
                } catch (e) { console.warn('[Battle Tactics] combatsRemaining decrement failed', e); }
                // Build level transitions map for display
                try {
                    (this.props.crewManager.crew || []).forEach(c => {
                        if (!c || !c.id) return;
                        const before = levelsBefore[c.id];
                        const after = typeof c.level === 'number' ? c.level : 0;
                        if (typeof before === 'number' && after > before) {
                            levelTransitions[c.id] = { from: before, to: after };
                        }
                    });
                } catch (e) { }
                let meta = getMeta();
                meta.crew = this.props.crewManager.crew;
                storeMeta(meta);
                updateUserRequest();


            } else {
                battleResult = 'loss'
                summaryMessage = 'Death has come for you and yours.'
                this._suppressPersistFinalHP = true;

                // Show the summary panel (with portraits)
                try { if (this._isMounted) this.setState({ showSummaryPanel: true, suppressSummaryPortraits: false }); } catch (e) { }

                this._setTimeout(async () => {
                    try { if (this._isMounted) this.setState({ showSummaryPanel: false, suppressSummaryPortraits: false }); } catch (e) { }

                    this.props.battleOver('loss');

                    this._suppressPersistFinalHP = false;
                }, 3000);
            }

            // Persist final HP and dead state for crew once when combat ends
            try {
                // If a group-death flow is in-progress, skip persisting final HP (we'll restore later)
                if (this._suppressPersistFinalHP) {
                    // do nothing
                } else {
                    const meta = getMeta();
                    if (meta && Array.isArray(meta.crew)) {
                        let modified = false;
                        const battleEntries = this.state.battleData || {};
                        Object.values(battleEntries).forEach(entry => {
                            try {
                                if (!entry) return;
                                if (entry.isMonster || entry.isMinion) return;
                                const idx = meta.crew.findIndex(c => c && c.id === entry.id);
                                if (idx !== -1) {
                                    if (typeof entry.hp !== 'undefined' && meta.crew[idx].hp !== entry.hp) {
                                        meta.crew[idx].hp = entry.hp;
                                        modified = true;
                                    }
                                    if (typeof entry.dead !== 'undefined' && meta.crew[idx].dead !== entry.dead) {
                                        meta.crew[idx].dead = !!entry.dead;
                                        modified = true;
                                    }
                                }
                                // notify parent so DungeonPage immediately reflects final HP/dead
                                try { if (this.props && typeof this.props.onFighterUpdate === 'function') this.props.onFighterUpdate(entry); } catch (e) { }
                            } catch (inner) { }
                        });
                        if (modified) {
                            try { storeMeta(meta); } catch (e) { }
                            try { updateUserRequest(getUserId(), meta).catch(() => { }); } catch (e) { }
                            try { if (this.props.saveUserData) this.props.saveUserData(); } catch (e) { }

                            // ── Battle Tactics: soldier death wipes stored tactics ──
                            try {
                                meta.crew.forEach(member => {
                                    if (!member) return;
                                    const isSoldier = member.type === 'soldier' || member.image === 'soldier';
                                    if (isSoldier && member.dead) {
                                        const hadTactics = (member.specialActions || []).some(a => a && a.type === 'tactics');
                                        if (hadTactics) {
                                            member.specialActions = (member.specialActions || []).filter(a => !a || a.type !== 'tactics');
                                            // Sync to live crewManager
                                            const liveSoldier = (this.props.crewManager?.crew || []).find(m => m && m.id === member.id);
                                            if (liveSoldier) liveSoldier.specialActions = member.specialActions;
                                            console.log('[Battle Tactics] Soldier died — tactics cleared.');
                                            try { storeMeta(meta); } catch (e) { }
                                        }
                                    }
                                });
                            } catch (e) { console.warn('[Battle Tactics] soldier-death clear failed', e); }
                        }
                    }
                }
            } catch (err) {
                console.warn('Failed to persist final battle HP to meta', err);
            }


            // Ensure suppressSummaryPortraits is only true for the special group-death flow
            // (that flow sets this._suppressPersistFinalHP and this.state.suppressSummaryPortraits
            //  earlier). For all other outcomes make sure portraits are shown.
            // Add debug logging to help trace missing portraits and repeated gold updates.
            try {
                // debug: _suppressPersistFinalHP state
                // Print brief portrait info from battleData for inspection
                try {
                    // portrait snapshot suppressed
                    void Object.values(this.state.battleData || {}).map(b => ({ id: b && b.id, portrait: b && b.portrait }));
                } catch (inner) { console.warn('gameOver: failed to snapshot battleData portraits', inner); }
            } catch (e) { }

            this.setState({
                showSummaryPanel: true,
                goldGained,
                foodGained,
                experienceGained,
                itemsGained,
                stolenItems: this._stolenItems && this._stolenItems.length ? [...this._stolenItems] : [],
                summaryMessage,
                battleResult,
                suppressSummaryPortraits: false,
                isFinalDeath: false,
                battleData: latestBattleData,
                levelTransitions,
                xpPercentsBefore,
            })
        }, 1500);
    }
    launchDeathSequence = () => {
        this.props.setNarrativeSequence('death')
        this.setState({
            navToDeathScene: true
        })
    }
    establishAnimationCallback = () => {
        if (this.props.animationManager && typeof this.props.animationManager.establishAnimationCallback === 'function') {
            this.props.animationManager.establishAnimationCallback(this.renderAnimation)
        }
    }
    establishUpdateActorCallback = () => {
        this.props.combatManager.establishUpdateActorCallback(this.updateCurrentActor)
    }
    establishUpdateMatrixCallback = () => {
        this.props.combatManager.establishUpdateMatrixCallback(this.updateIndicatorsMatrix)
    }
    establishMessageCallback = () => {
        this.props.combatManager.establishMessageCallback(this.setMessage)
    }
    establishUpdateDataCallback = () => {
        this.props.combatManager.establishUpdateDataCallback(this.updateBattleData)
    }
    establishUpdateAnimationDataCallback = () => {
        if (this.props.animationManager) {
            if (typeof this.props.animationManager.connect === 'function') {
                this.props.animationManager.connect(this.updateAnimationData);
            } else if (typeof this.props.animationManager.establishUpdateAnimationDataCallback === 'function') {
                this.props.animationManager.establishUpdateAnimationDataCallback(this.updateAnimationData);
            }
        }
    }
    establishMorphPortraitCallback = () => {
        this.props.combatManager.establishMorphPortraitCallback(this.morphPortrait)
    }
    establishGreetingCompleteCallback = () => {
        this.props.combatManager.establishGreetingCompleteCallback(this.greetingComplete)
    }
    establishGameOverCallback = () => {
        this.props.combatManager.establishGameOverCallback(this.gameOver)
    }
    establishOnFighterMovedToDestinationCallback = () => {
        this.props.combatManager.establishOnFighterMovedToDestinationCallback(this.onFighterMovedToDestination)
    }

    // Called when a fighter finishes moving to their destination (including teleport)
    onFighterMovedToDestination = (destination, fighter) => {
        // If the fighter is a monk and just teleported, clear teleportingFighterId after a tick
        if (fighter && fighter.type === 'monk') {
            // setTimeout(() => {
            //     this.setState({ teleportingFighterId: null });
            // }, 50); // allow one render with .teleporting class
        }
    }
    establishOnFighterDeathCallback = () => {
        this.props.combatManager.establishOnFighterDeathCallback(this.handleFighterDeath)
    }
    // OVERLAY MANAGER
    establishBroadcastNewAnimationCallback = () => {
        this.props.overlayManager.establishBroadcastAnimationEventCallback(this.recieveAnimationBroadcastFromOverlayManager)
    }
    // establishInitializeOverlayManagerCallback = () => {
    //     this.props.combatManager.establishInitializeOverlayManagerCallback(this.initializeOverlayManager)
    // }

    handleFighterDeath = (id) => {
        if (id === 'all enemies dead') {
            this.setState({
                selectedFighter: null
            })
            return
        }
        if (id === 'all fighters dead') {
            this.setState({
                selectedFighter: null
            })
            return
        }
        // Persist death immediately so dungeon/meta reflects 0 HP even if the
        // combat manager removes the fighter from battleData shortly after.
        try {
            const entry = this.state.battleData && this.state.battleData[id] ? this.state.battleData[id] : { id };
            // mark dead and hp=0 locally
            entry.dead = true;
            entry.hp = 0;
            // update meta
            try {
                const meta = getMeta();
                if (meta && Array.isArray(meta.crew)) {
                    const idx = meta.crew.findIndex(c => c && c.id === id);
                    if (idx !== -1) {
                        meta.crew[idx].hp = 0;
                        meta.crew[idx].dead = true;
                        try { storeMeta(meta); } catch (e) { }
                        try { updateUserRequest(getUserId(), meta).catch(() => { }); } catch (e) { }
                        try { if (this.props.saveUserData) this.props.saveUserData(); } catch (e) { }
                    }
                }
            } catch (inner) {
                console.warn('handleFighterDeath: failed to persist meta', inner);
            }
            // notify parent immediately so UI updates
            try { if (this.props && typeof this.props.onFighterUpdate === 'function') this.props.onFighterUpdate(entry); } catch (e) { }
        } catch (err) {
            console.warn('handleFighterDeath persistence failed', err);
        }
        if (this.state.selectedFighter && this.state.selectedFighter.id === id) {
            const liveFighters = this.props.combatManager.getLiveFighters();
            if (liveFighters.length) {
                this.fighterPortraitClicked(liveFighters[0].id)
            } else {
                this.setState({
                    selectedFighter: null
                })
            }
        }
    }


    getDistanceToTarget = (id) => {
        let source = this.state.battleData[id];
        if (!source) return 0;
        let targetId = this.state.battleData[id].targetId,
            target = this.state.battleData[targetId],
            returnVal = 50;
        if (!target) return 0;
        if (target.isMonster) {
            //nothin 
        }
        return returnVal;
    }

    attackTileClicked = (val) => {
        const selectedId = this.state.selectedFighter?.id;
        const selectedCombatant = selectedId && this.props.combatManager?.getCombatant
            ? this.props.combatManager.getCombatant(selectedId)
            : null;
        const fighterRef = selectedCombatant || this.state.selectedFighter;

        // Check if attack is off cooldown
        let isReady = false;
        if (this.props.combatManager && this.props.combatManager.round !== undefined && fighterRef) {
            const fKey = String(val.id || val.key || val.name || '').trim().toLowerCase().replaceAll(' ', '_');
            const remainingSec = fighterRef.cooldowns?.[val.id] || fighterRef.cooldowns?.[val.key] || fighterRef.cooldowns?.[fKey] || 0;
            isReady = remainingSec === 0;
        } else {
            isReady = val.cooldown_position === 100;
        }
        if (!isReady) return;

        const formatted_val = String(val.id || val.key || val.name || '').trim().toLowerCase().replaceAll(' ', '_');
        const isManualControl = !!selectedCombatant?.manualControl;

        if (isManualControl && selectedCombatant) {
            // Resolve to the live attack object on the combatant so cooldown/state remain authoritative.
            const resolvedAttack = (selectedCombatant.attacks || []).find((a) => {
                if (!a) return false;
                const aKey = String(a.id || a.key || a.name || '').trim().toLowerCase().replaceAll(' ', '_');
                return aKey === formatted_val;
            }) || val;

            selectedCombatant.activeAbility = resolvedAttack;
            this.setState({
                selectedAttack: resolvedAttack,
                showCrosshair: false,
            }, () => {
                if (selectedCombatant.targetId) {
                    this.props.combatManager.fighterManualAttack();
                } else {
                    console.log('[MonsterBattle] No target selected for immediate manual attack.');
                }
            });
            return;
        }

        this.setState({
            showCrosshair: true,
            selectedAttack: (this.props.combatManager && this.props.combatManager.attacksMatrix)
                ? (this.props.combatManager.attacksMatrix[formatted_val] || this.props.combatManager.attacksMatrix[val.name] || val)
                : val
        })
    }
    attackTileHovered = (val) => {
        this.setState({
            hoveredAttackTile: val
        })
    }
    inventoryTileHovered = (val) => {
        this.setState({
            hoveredInventoryTile: val
        })
    }
    combatInventoryTileClicked = (val) => {
        this.props.combatManager.itemUsed(val, this.state.selectedFighter)
        // simulation flag inspected
        // if(!this.props.isSimulation) this.props.useConsumableFromInventory(val);
        this.props.useConsumableFromInventory(val);
    }
    specialTileClicked = (val) => {
        // special tile clicked
        const selectedUnit = this.state.selectedFighter || this.state.selectedMonster;
        if (selectedUnit?.isMonster || selectedUnit?.isMinion) {
            console.log('[SpecialClickDiag][MonsterBattle] specialTileClicked ignored: monster/minion selected.');
            return;
        }
        console.log('[SpecialClickDiag][MonsterBattle] specialTileClicked', {
            incoming: val,
            selectedFighterId: this.state.selectedFighter?.id,
            selectedFighterType: this.state.selectedFighter?.type,
        });
        if (val !== null && typeof val === 'string') {
            val = val.replaceAll('_', ' ')
        }
        try {
            if (this.state.selectedFighter && this.props.combatManager && typeof this.props.combatManager.setSelectedFighter === 'function') {
                this.props.combatManager.setSelectedFighter(this.state.selectedFighter);
            }
        } catch (err) { }
        // special tile value
        this.fireSpecial(val)

        // if(val === 'glyph'){
        //     finalVal = !this.state.glyphTrayExpanded
        //     this.setState({
        //         glyphTrayExpanded: finalVal
        //     })
        // }
    }
    manualFire = () => {
        if (!this.state.selectedFighter) return
        // manual fire invoked

        let selectedFighter = this.state.selectedFighter;
        let specials = selectedFighter?.specials,
            consumableSpecials = selectedFighter?.specialActions,
            selectedSpecial = specials.find(a => a.selected),
            selectedConsumableSpecial = consumableSpecials.find(a => a.selected);

        if (selectedSpecial) {
            const requiredEnergy = Number(selectedSpecial.energy_cost) || 0;
            if ((this.state.selectedFighter.energy || 0) < requiredEnergy) {
                // not enough energy
                return
            }
            // (Teleport effect will now be triggered only on actual teleport, not on special selection)
            this.props.combatManager.fighterSpecialAttack(selectedSpecial)
            specials.forEach(e => e.selected = false)
        } else if (selectedConsumableSpecial) {
            if (selectedConsumableSpecial.type === 'spell') {
                this.fireSpell(selectedConsumableSpecial)
            }
            consumableSpecials.forEach(a => a.selected = false)
        } else {
            // manual attack: ensure the authoritative combatant has an activeAbility selected
            try {
                const sel = this.state.selectedFighter;
                if (sel && this.props.combatManager && typeof this.props.combatManager.getCombatant === 'function') {
                    const cmF = this.props.combatManager.getCombatant(sel.id);
                    if (cmF) {
                        // If the interaction pane selected an attack tile, prefer that attack for this manual fire.
                        if (this.state.selectedAttack && this.state.selectedAttack.cooldown_position === 100) {
                            const selected = this.state.selectedAttack;
                            const resolvedSelectedAttack = (cmF.attacks || []).find((a) =>
                                a &&
                                a.name === selected.name &&
                                a.range === selected.range &&
                                a.cooldown_position === 100
                            ) || (cmF.attacks || []).find((a) =>
                                a &&
                                a.name === selected.name &&
                                a.cooldown_position === 100
                            );
                            if (resolvedSelectedAttack) cmF.activeAbility = resolvedSelectedAttack;
                        }

                        // If no active ability is set, choose one using the combat manager helper
                        if (!cmF.activeAbility) {
                            const target = (cmF.targetId) ? this.props.combatManager.getCombatant(cmF.targetId) : null;
                            try {
                                if (typeof this.props.combatManager.chooseAttackType === 'function') {
                                    this.props.combatManager.chooseAttackType(cmF, target);
                                } else if (Array.isArray(cmF.attacks) && cmF.attacks.length) {
                                    cmF.activeAbility = cmF.attacks.find(a => a.cooldown_position === 100) || cmF.attacks[0];
                                }
                            } catch (e) {
                                // defensive fallback
                                if (Array.isArray(cmF.attacks) && cmF.attacks.length) {
                                    cmF.activeAbility = cmF.attacks.find(a => a.cooldown_position === 100) || cmF.attacks[0];
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn('manualFire: failed to ensure activeAbility', err);
            }
            // invoke the combat manager's manual attack which calls into the fighter
            this.props.combatManager.fighterManualAttack()
        }
    }
    fireSpecial = (special) => {
        if (!this.state.selectedFighter) {
            console.log('[SpecialClickDiag][MonsterBattle] fireSpecial aborted: no selected fighter', { special });
            return
        }
        // firing special
        // debugger

        let selectedFighter = this.state.selectedFighter;
        const cmFighter = this.props.combatManager && typeof this.props.combatManager.getCombatant === 'function'
            ? this.props.combatManager.getCombatant(selectedFighter.id)
            : null;
        const fighterRef = cmFighter || selectedFighter;
        let specials = fighterRef?.specials || [],
            consumableSpecials = fighterRef?.specialActions || [],
            selectedSpecial = specials.find(a => a.selected),
            selectedConsumableSpecial = consumableSpecials.find(a => a.selected);

        if (special) {
            if (typeof special === 'object' && special.type === 'glyph') {
                this.fireGlyph(special, fighterRef);
                return;
            }
            const specialName = (typeof special === 'string' ? special : special?.name || '')
                .replaceAll('_', ' ')
                .toLowerCase();
            const normalizedName = specialName.replaceAll(' ', '_');
            const resolvedSpecial = (this.props.combatManager && typeof this.props.combatManager.resolveSpecial === 'function')
                ? this.props.combatManager.resolveSpecial(fighterRef, specialName)
                : null;
            const clickedSpecial = resolvedSpecial || specials.find(a => {
                if (!a) return false;
                if (typeof a === 'string') {
                    const aNorm = a.toLowerCase().replaceAll(' ', '_');
                    return aNorm === normalizedName;
                }
                const aName = String(a.name || '').toLowerCase().replaceAll(' ', '_');
                return aName === normalizedName;
            }) || (typeof special === 'object' ? special : null);
            if (!clickedSpecial || !clickedSpecial.name) {
                console.log('[SpecialClickDiag][MonsterBattle] fireSpecial aborted: no clickedSpecial resolved', {
                    special,
                    specialName,
                    fighterId: fighterRef?.id,
                    fighterSpecials: (fighterRef?.specials || []).map(s => (typeof s === 'string' ? s : s?.name)),
                });
                return;
            }
            const hasCooldown = fighterRef?.cooldowns?.[clickedSpecial.id] > 0 || fighterRef?.cooldowns?.[clickedSpecial.id?.replace('barbarian_leap_attack', 'leap_attack')?.replace('barbarian_berserker', 'berserker')] > 0;
            if (hasCooldown) {
                console.log('[SpecialClickDiag][MonsterBattle] fireSpecial aborted: cooldown not ready', {
                    clickedSpecial: clickedSpecial.name,
                    fighterId: fighterRef?.id,
                });
                return;
            }
            const requiredEnergy = Number(clickedSpecial.energy_cost) || 0;
            if ((fighterRef.energy || 0) < requiredEnergy) {
                console.log('[SpecialClickDiag][MonsterBattle] fireSpecial aborted: not enough energy', {
                    clickedSpecial: clickedSpecial.name,
                    requiredEnergy,
                    currentEnergy: fighterRef.energy || 0,
                    fighterId: fighterRef?.id,
                });
                return;
            }
            const isSelfTarget = clickedSpecial.range === 'self' || clickedSpecial.id === 'notch' || (clickedSpecial.effect && (
                (Array.isArray(clickedSpecial.effect) && clickedSpecial.effect.some(e => typeof e === 'string' && e.includes('buff_self'))) ||
                (typeof clickedSpecial.effect === 'string' && clickedSpecial.effect.includes('buff_self')) ||
                clickedSpecial.id === 'monk_ethereal_speed' ||
                clickedSpecial.id === 'monk_meditate' ||
                clickedSpecial.id === 'monk_inner_fire'
            ));

            if (!isSelfTarget && !fighterRef.targetId) {
                console.log('[SpecialClickDiag][MonsterBattle] fireSpecial aborted: ability requires a target, but none is selected.', clickedSpecial.name);
                return;
            }

            console.log('[SpecialClickDiag][MonsterBattle] dispatch fighterSpecialAttack', {
                clickedSpecial: clickedSpecial.name,
                fighterId: fighterRef?.id,
                fighterType: fighterRef?.type,
                targetId: fighterRef?.targetId,
            });
            this.props.combatManager.fighterSpecialAttack(clickedSpecial)
            specials.forEach(e => e.selected = false)
            consumableSpecials.forEach(a => a.selected = false)
            return;
        }

        if (selectedSpecial) {
            this.props.combatManager.fighterSpecialAttack(selectedSpecial)
            specials.forEach(e => e.selected = false)
        } else if (selectedConsumableSpecial) {
            if (selectedConsumableSpecial.type === 'spell') {
                this.fireSpell(selectedConsumableSpecial)
            }
            consumableSpecials.forEach(a => a.selected = false)
        } else {
            this.props.combatManager.fighterManualAttack()
        }
    }
    // Accept optional fighter argument for AI path
    fireGlyph = (glyph, fighterOverride = null) => {
        // glyph firing
        // Use override if provided (AI), else fall back to selectedFighter (manual)
        const selectedFighter = fighterOverride || this.state.selectedFighter;

        // ── New tiered glyph: fire all stored spells sequentially (500ms apart) ──────────
        if (glyph.type === 'glyph' && Array.isArray(glyph.spells) && glyph.spells.length > 0) {
            const target = this.props.combatManager.getCombatant(selectedFighter?.targetId);
            if (!target) return;

            // Consume the glyph
            let consumableSpecials = selectedFighter.specialActions;
            if (consumableSpecials) {
                const targetIndex = consumableSpecials.findIndex(a => a.name === glyph.name && a.glyphTier === glyph.glyphTier && a.startDate === glyph.startDate);
                if (targetIndex > -1) {
                    consumableSpecials.splice(targetIndex, 1);
                    this.setState({
                        selectedFighter: { ...selectedFighter, specialActions: consumableSpecials }
                    }, () => {
                        if (this.props.combatManager && typeof this.props.combatManager.syncCrewMember === 'function') {
                            this.props.combatManager.syncCrewMember(this.state.selectedFighter);
                        }
                    });
                }
            }

            try {
                if (this.props.combatManager && typeof this.props.combatManager.appendCombatLog === 'function') {
                    const attackerName = typeof this.props.combatManager.getCombatantLogName === 'function'
                        ? this.props.combatManager.getCombatantLogName(selectedFighter)
                        : (selectedFighter.name || 'Wizard');
                    const targetName = typeof this.props.combatManager.getCombatantLogName === 'function'
                        ? this.props.combatManager.getCombatantLogName(target)
                        : (target.name || 'target');
                    const spellNames = (glyph.spellDefs || []).map(s => s.name).join(', ') || glyph.spells.join(', ');
                    this.props.combatManager.appendCombatLog(
                        `${attackerName} unleashes ${glyph.name || 'Glyph'} (${spellNames}) at ${targetName}!`
                    );
                }
            } catch (e) { }

            glyph.spells.forEach((spellKey, index) => {
                setTimeout(() => {
                    try {
                        const currentTarget = this.props.combatManager.getCombatant(selectedFighter.targetId);
                        if (!currentTarget) return;

                        // Look up the skill definition from combatManager or use a minimal object
                        const specialsMatrix = this.props.combatManager?.specialsMatrix || {};
                        const spellDef = specialsMatrix[spellKey] || { id: spellKey, name: spellKey, type: 'damage', selected: true };
                        const spellWithSelected = { ...spellDef, selected: true };

                        // Bypass action restrictions for barrage spells
                        const cmFighter = this.props.combatManager.getCombatant(selectedFighter.id);
                        const prevActions = cmFighter ? cmFighter.actionsTakenThisRound : 0;
                        if (cmFighter) cmFighter.actionsTakenThisRound = 0;

                        this.props.combatManager.fighterSpecialAttack(spellWithSelected);

                        // Restore so we don't grant free standard actions
                        if (cmFighter) cmFighter.actionsTakenThisRound = prevActions;
                        const combatLog = this.props.combatManager && typeof this.props.combatManager.getCombatLog === 'function'
                            ? this.props.combatManager.getCombatLog()
                            : [];
                        this.setState({ combatLog });
                    } catch (e) {
                        console.warn('[fireGlyph] spell firing error for', spellKey, e);
                    }
                }, index * 500);
            });
            return;
        }

        // ── Legacy: magic missile (backward compat for old persisted specialActions) ──────
        switch (glyph.subtype) {
            case 'magic missile': {
                let specials = selectedFighter?.specials;
                let consumableSpecials = selectedFighter?.specialActions;
                if (consumableSpecials) consumableSpecials.forEach(a => a.selected = false)
                if (specials) specials.forEach(a => a.selected = false)

                let target = this.props.combatManager.getCombatant(selectedFighter.targetId)
                if (!target) return
                try {
                    if (this.props.combatManager && typeof this.props.combatManager.appendCombatLog === 'function') {
                        const attackerName = (typeof this.props.combatManager.getCombatantLogName === 'function')
                            ? this.props.combatManager.getCombatantLogName(selectedFighter)
                            : (selectedFighter.name || selectedFighter.type || 'Wizard');
                        const targetName = (typeof this.props.combatManager.getCombatantLogName === 'function')
                            ? this.props.combatManager.getCombatantLogName(target)
                            : (target.name || target.type || 'target');
                        this.props.combatManager.appendCombatLog(`${attackerName} casts magic missile at ${targetName}`);
                    }
                } catch (e) { }
                const travelTime = 1500
                this.props.combatManager.fighterAI.roster['wizard'].triggerMagicMissile(selectedFighter, target, travelTime)
                const combatLog = this.props.combatManager && typeof this.props.combatManager.getCombatLog === 'function'
                    ? this.props.combatManager.getCombatLog()
                    : [];
                this.setState({ combatLog });
            }
                break;
            default:
            // unknown glyph subtype
        }
    }
    specialTileHovered = (val) => {
        this.setState({
            hoveredSpecialTile: val ? val.name : null
        })
    }

    // Minimal handler for spell hover to avoid missing-method runtime errors.
    // Logs a small message and updates hoveredSpellTile for the tooltip.
    spellTileHovered = (val) => {
        // spell hovered
        this.setState({ hoveredSpellTile: val ? (val.subtype || val.name) : null });
    }
    glyphTileHovered = (val) => {
        this.setState({
            hoveredGlyphTile: val ? val.type : null
        })
    }
    portraitHovered = (id) => {
        this.setState({ portraitHoveredId: id })
    }
    getManualMovementArc = (fighter) => {
        if (!fighter) return 0
        // console.log('fighter: ', fighter);
        // console.log('manual moves for ', fighter.name, 'is ', fighter.manualMovesCurrent / fighter.manualMovesTotal * 3.6);
        const percentage = (fighter.manualMovesCurrent / fighter.manualMovesTotal) * 100;
        const arc = percentage * 3.6
        return arc
    }
    getManualMovementArcColor = (fighter) => {
        if (!fighter) return 'black'
        if (fighter.manualMovesCurrent < 1) return '#818d6e'
        return 'greenyellow'
    }
    monsterCombatPortraitClicked = (id) => {
        // console.log('battle data: ', this.state.battleData);
        // console.log('images[this.state.battleData[e]?.portrait]', this.state.battleData[id].targettedBy);
        // let targettedBy = this.state.battleData[id].targettedBy;
        // console.log('should be Sadronis: ', this.state.battleData[targettedBy]);\

        const selectedMonster = this.state.battleData[id];
        // monster selected
        if (this.state.showCrosshair) {
            this.props.combatManager.queueAction(this.state.selectedFighter.id, id, this.state.selectedAttack)
            this.setState({
                showCrosshair: false
            })
        } else {
            this.setState({
                selectedMonster,
                selectedFighter: null,
                selectedAttack: null
            })
        }
        // selectedMonster.portrait = this.props.crew.find(e=>e.id === id).portrait


    }
    targetTileClicked = (tile) => {
        this.props.combatManager.setTargetFromClick(this.state.selectedFighter.id, tile.id)
        if (this.state.showCrosshair) {
            this.props.combatManager.queueAction(this.state.selectedFighter.id, tile.id, this.state.selectedAttack)
        }
        this.setState({
            showCrosshair: false,
            selectedAttack: null
        })
        // debugger
    }
    targetTileHovered = (tile) => {
        this.setState({
            portraitHoveredId: tile ? tile.id : null
        })
    }
    queueTileHovered = (tile) => {
        if (tile === null) {
            this.setState({
                draggedOverCombatTileId: null
            })
            return
        }
        switch (tile.instruction.type) {
            case 'move':
                let correspondingTile = this.state.combatTiles.find(e => e.x === tile.instruction.destinationCoordinates.x && e.y === tile.instruction.destinationCoordinates.y)
                this.setState({
                    draggedOverCombatTileId: correspondingTile.id
                })
                break;
            default:
                break;
        }
        // this.setState({
        //     draggedOverCombatTileId: tileIndex
        // })
    }
    onFighterMovedToDestination = (coordinates) => {
        const tile = this.state.combatTiles.find(t => t.x === coordinates.x && t.y === coordinates.y)
        let arr = this.state.ghostPortraitMatrix;
        arr[tile.id] = null;
        this.setState({
            ghostPortraitMatrix: arr
        })
    }
    onDragStart = (fighter) => {
        this.setState({
            selectedFighter: this.state.battleData[fighter.id],
            draggingFighter: fighter
        })
    }
    onDragOver = (event, tileIndex) => {
        event.preventDefault();
        if (tileIndex === this.state.draggedOverCombatTileId) return
        this.setState({
            draggedOverCombatTileId: tileIndex
        })
    }
    onDrop = (tileIndex) => {
        const selectedFighter = this.state.battleData[this.state.draggingFighter.id];
        const tile = this.state.combatTiles[tileIndex]
        this.props.combatManager.setFighterDestination(selectedFighter.id, { x: tile.x, y: tile.y });
        let arr = this.state.ghostPortraitMatrix;
        arr[tileIndex] = selectedFighter.portrait;
        this.setState({
            draggedOverCombatTileId: null,
            draggingFighter: null,
            ghostPortraitMatrix: arr
        })

    }
    getMonsterWeaponAnimation = (monster) => {
        if (!monster.attacking || !monster.activeAbility) return ''
        switch (monster.activeAbility.name) {
            case 'magic missile':
                // return 'spinning'
                return 'spin-left'
            case 'void lance':
                return 'swinging-left'
            default:
                break;
        }
        if (monster.activeAbility.name === 'magic missile') {
            // unexpected path reached
            debugger
        }
        switch (monster.activeAbility.range) {
            case 'close':
                return 'swinging-left'
            case 'medium':
                return 'lift-and-shoot'
            case 'far':
                return 'shooting';
            default:
                break;
        }
    }

    draw = (ctx, frameCount) => {
        const that = this,
            size = 20 + Math.sin(frameCount * 0.04) ** 2 * 5;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.drawImage(that.state.arrowUpImage, 5, 5, size, size);
    }

    render() {
        const selectedUnit = this.state.selectedFighter || this.state.selectedMonster;
        const liveSelectedFighter = selectedUnit
            ? (this.state.battleData[selectedUnit.id] || selectedUnit)
            : null;
        const activeTargetId = liveSelectedFighter?.targetId || null;
        const selectedPortraitUrl = liveSelectedFighter
            ? (images[liveSelectedFighter.portrait] || liveSelectedFighter.portrait || images.avatar)
            : images.avatar;
        const cooldownEnd = Number(liveSelectedFighter?.manualCommandCooldownUntil || 0);
        const cooldownStarted = Number(liveSelectedFighter?.manualCommandCooldownStartedAt || 0);
        const cooldownMsRaw = Number(liveSelectedFighter?.manualCommandCooldownMs || 0);
        const cooldownMs = cooldownMsRaw > 0
            ? cooldownMsRaw
            : Number(this.props.combatManager?.MANUAL_COMMAND_COOLDOWN_MS || 4000);
        const cooldownActive = cooldownEnd > Date.now() && cooldownMs > 0;
        const cooldownElapsedPct = cooldownActive
            ? Math.max(0, Math.min(100, ((Date.now() - cooldownStarted) / cooldownMs) * 100))
            : 100;
        const cooldownRemainingAngle = `${Math.max(0, Math.min(360, (1 - (cooldownElapsedPct / 100)) * 360))}deg`;

        return (
            <div className={`mb-board ${this.state.showCrosshair ? 'show-crosshair' : ''}`}>
                {/* Monster name in upper left */}
                <div style={{ position: 'absolute', top: -35, left: 20, color: 'white', fontSize: '18px', zIndex: 1000 }}>
                    {this.props.monster && this.props.monster.name ? `Fighting: ${this.props.monster.name}` : 'Fighting: Unknown'}
                </div>
                {/* Game speed / Round clock readout in upper right */}
                <div style={{ position: 'absolute', top: -45, right: 20, display: 'flex', alignItems: 'center', gap: '15px', color: 'white', fontSize: '14px', zIndex: 1000 }}>
                    {this.props.combatManager && this.props.combatManager.round !== undefined ? (
                        <>
                            {/* Fast/Slow selector */}
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button
                                    onClick={() => this.setGameSpeed(INTERVALS[0])}
                                    style={{
                                        backgroundColor: this.props.combatManager.gameSpeed === 'slowest' ? '#ffffff' : 'rgba(255,255,255,0.1)',
                                        color: this.props.combatManager.gameSpeed === 'slowest' ? '#000000' : '#ffffff',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Slowest
                                </button>
                                <button
                                    onClick={() => this.setGameSpeed(INTERVALS[1])}
                                    style={{
                                        backgroundColor: this.props.combatManager.gameSpeed === 'slow' ? '#ffffff' : 'rgba(255,255,255,0.1)',
                                        color: this.props.combatManager.gameSpeed === 'slow' ? '#000000' : '#ffffff',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Slow
                                </button>
                                <button
                                    onClick={() => this.setGameSpeed(INTERVALS[2])}
                                    style={{
                                        backgroundColor: this.props.combatManager.gameSpeed === 'fast' ? '#ffffff' : 'rgba(255,255,255,0.1)',
                                        color: this.props.combatManager.gameSpeed === 'fast' ? '#000000' : '#ffffff',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Fast
                                </button>
                            </div>

                            {/* Round Clock Widget */}
                            <div
                                style={{
                                    position: 'relative',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: `conic-gradient(rgba(255,255,255,0.8) 0deg, rgba(255,255,255,0.8) ${this.props.combatManager.roundTimeRemainingRatio * 360}deg, rgba(255,255,255,0.1) ${this.props.combatManager.roundTimeRemainingRatio * 360}deg, rgba(255,255,255,0.1) 360deg)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                                }}
                            >
                                <div
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: '#111111',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {this.props.combatManager.round}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div>
                            Game Speed: {
                                (() => {
                                    const intervalDisplayNames = INTERVAL_DISPLAY_NAMES;
                                    const intervals = INTERVALS;
                                    const current = this.getGameSpeed();
                                    const idx = intervals.indexOf(current);
                                    return idx !== -1 ? intervalDisplayNames[idx] : `${current} ms`;
                                })()
                            }
                        </div>
                    )}

                    {/* ── Party Resolve Meter ── */}
                    {(() => {
                        const meta = getMeta();
                        const resolve = (meta && typeof meta.resolve === 'number') ? meta.resolve : 100;
                        const pct = Math.max(0, Math.min(100, resolve));
                        const isCritical = resolve < 20;
                        const isLow = resolve >= 20 && resolve < 40;
                        const barColor = isCritical
                            ? 'linear-gradient(90deg, #7f1d1d, #ef4444)'
                            : isLow
                                ? 'linear-gradient(90deg, #78350f, #f59e0b)'
                                : 'linear-gradient(90deg, #14532d, #22c55e)';
                        const labelColor = isCritical ? '#fca5a5' : isLow ? '#fcd34d' : '#86efac';
                        return (
                            <div
                                title="Party Resolve — below 20: fighters may refuse to act (10% chance/turn). Below 40: reduced morale. 80+: high morale bonus."
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '3px',
                                    cursor: 'default',
                                    userSelect: 'none',
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '10px',
                                    color: labelColor,
                                    fontWeight: 700,
                                    letterSpacing: '0.5px',
                                    textTransform: 'uppercase',
                                }}>
                                    {isCritical && <span role="img" aria-label="warning" style={{ fontSize: '11px' }}>⚠️</span>}
                                    Resolve
                                    <span style={{ color: '#fff', fontWeight: 400 }}>{Math.round(resolve)}</span>
                                </div>
                                <div style={{
                                    width: '80px',
                                    height: '6px',
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '3px',
                                    overflow: 'hidden',
                                    border: isCritical ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                                }}>
                                    <div style={{
                                        width: `${pct}%`,
                                        height: '100%',
                                        background: barColor,
                                        borderRadius: '3px',
                                        transition: 'width 0.5s ease, background 0.5s ease',
                                    }} />
                                </div>
                            </div>
                        );
                    })()}

                </div>
                {this.state.navToDeathScene && <Redirect to='/death' />}
                <div className="combat-grid-container"
                    style={{
                        position: 'relative',
                        width: TILE_SIZE * this.state.numBoardColumns + (SHOW_TILE_BORDERS ? this.state.numBoardColumns * 2 : 0) + 'px',
                        height: TILE_SIZE * MAX_ROWS + (SHOW_TILE_BORDERS ? MAX_ROWS * 2 : 0) + 'px',
                        background: '#161618',
                        borderRadius: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                        overflow: 'visible',
                        transition: 'width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>
                    {this.state.showSummaryPanel && (() => {
                        const battleEntries = Object.values(this.state.battleData || {});
                        const isVictory = !this.state.suppressSummaryPortraits && battleEntries.some(e => e && !e.dead && !e.isMonster && !e.isMinion);
                        const headerText = isVictory ? "VICTORY" : "DEFEAT";
                        const headerClass = isVictory ? "victory-header" : "defeat-header";

                        return (
                            <div className={`summary-panel ${isVictory ? 'victory' : 'defeat'}`}>
                                {/* Header */}
                                <div className="summary-header">
                                    <h1 className={headerClass}>{headerText}</h1>
                                    <div className="summary-subtitle">{this.state.summaryMessage}</div>
                                </div>

                                {/* Content Grid */}
                                <div className="summary-content-grid">
                                    {/* Left: Battle Spoils */}
                                    <div className="summary-section spoils-section">
                                        <h2 className="section-title">BATTLE REWARDS</h2>
                                        <div className="spoils-grid">
                                            {this.state.goldGained > 0 && (
                                                <div className="spoil-card gold">
                                                    <img className="spoil-icon" src={images.gold} alt="Gold" />
                                                    <div className="spoil-info">
                                                        <span className="spoil-label">Gold Gained</span>
                                                        <span className="spoil-value">+{this.state.goldGained}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {this.state.foodGained > 0 && (
                                                <div className="spoil-card food">
                                                    <span className="spoil-icon-emoji" role="img" aria-label="meat">🍖</span>
                                                    <div className="spoil-info">
                                                        <span className="spoil-label">Food Foraged</span>
                                                        <span className="spoil-value">+{this.state.foodGained}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {this.state.experienceGained > 0 && (
                                                <div className="spoil-card exp">
                                                    <img className="spoil-icon" src={images.exp} alt="XP" />
                                                    <div className="spoil-info">
                                                        <span className="spoil-label">XP per Hero</span>
                                                        <span className="spoil-value">+{this.state.experienceGained}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Items Gained */}
                                        {((this.state.itemsGained && this.state.itemsGained.length > 0) || (this.state.stolenItems && this.state.stolenItems.length > 0)) && (
                                            <div className="gained-items-section">
                                                <h3 className="sub-section-title">ITEMS</h3>
                                                <div className="items-list">
                                                    {this.state.itemsGained && this.state.itemsGained.length > 0 &&
                                                        this.state.itemsGained.map((itemKey, idx) => {
                                                            const itemDef = this.props.inventoryManager.allItems[itemKey];
                                                            const iconSrc = itemDef?.icon ? images[itemDef.icon] : null;
                                                            const displayName = itemDef?.name || itemKey.replaceAll('_', ' ');
                                                            return (
                                                                <div key={`item-${idx}`} className="item-spoil-row">
                                                                    <div className="item-icon-wrapper">
                                                                        {iconSrc ? <img className="item-spoil-icon" src={iconSrc} alt="" /> : <span className="item-fallback-icon" role="img" aria-label="backpack">🎒</span>}
                                                                    </div>
                                                                    <span className="item-spoil-text">Found <strong className="highlight-text">{displayName}</strong></span>
                                                                </div>
                                                            );
                                                        })
                                                    }
                                                    {this.state.stolenItems && this.state.stolenItems.length > 0 &&
                                                        this.state.stolenItems.map((entry, idx) => {
                                                            const itemName = typeof entry === 'string' ? entry : entry?.itemName;
                                                            const itemIconKey = typeof entry === 'string' ? null : entry?.itemIconKey;
                                                            const iconSrc = (itemIconKey && images[itemIconKey]) ? images[itemIconKey] : images.goblin_portrait;
                                                            return (
                                                                <div key={`stolen-${idx}`} className="item-spoil-row stolen">
                                                                    <div className="item-icon-wrapper stolen">
                                                                        <img className="item-spoil-icon" src={iconSrc} alt="" />
                                                                    </div>
                                                                    <span className="item-spoil-text stolen"><strong className="highlight-text-stolen">{itemName}</strong> was stolen by a goblin!</span>
                                                                </div>
                                                            );
                                                        })
                                                    }
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Crew Status */}
                                    {!this.state.suppressSummaryPortraits && (
                                        <div className="summary-section crew-section">
                                            <h2 className="section-title">HEROES</h2>
                                            <div className="summary-crew-list">
                                                {/* Surviving Crew */}
                                                {Object.values(this.state.battleData).filter(e => !e.dead && !e.isMonster && !e.isMinion).map((crewMember, i) => {
                                                    const portraitUrl = images[crewMember.portrait] || crewMember.portrait || images['avatar'];
                                                    const cmMember = (this.props.crewManager && Array.isArray(this.props.crewManager.crew)) ? this.props.crewManager.crew.find(c => c && (c.id === crewMember.id || c.name === crewMember.name)) : null;
                                                    const percent = this.props.crewManager.calculateExpPercentage(crewMember);
                                                    const shouldShowArrow = (cmMember && cmMember.justLeveled) || percent >= 100;

                                                    let gainsAgg = null;
                                                    try {
                                                        if (cmMember && Array.isArray(cmMember._recentLevelGains) && cmMember._recentLevelGains.length) {
                                                            gainsAgg = {};
                                                            cmMember._recentLevelGains.forEach(g => {
                                                                Object.keys(g).forEach(k => {
                                                                    gainsAgg[k] = (gainsAgg[k] || 0) + (g[k] || 0);
                                                                });
                                                            });
                                                        }
                                                    } catch (err) { gainsAgg = null }

                                                    return (
                                                        <div key={`live-${i}`} className="crew-summary-row">
                                                            <div className="crew-portrait-box">
                                                                <div className="crew-portrait-img" style={{ backgroundImage: `url(${portraitUrl})` }} />
                                                                {shouldShowArrow && (
                                                                    <Canvas
                                                                        className="level-up-canvas"
                                                                        width={80}
                                                                        height={80}
                                                                        draw={this.draw}
                                                                    />
                                                                )}
                                                            </div>
                                                            <div className="crew-summary-details">
                                                                <div className="crew-name-row">
                                                                    <span className="crew-name">{crewMember.name}</span>
                                                                    {this.state.levelTransitions[crewMember.id] ? (
                                                                        <span className="crew-level-badge level-up">
                                                                            Lvl {this.state.levelTransitions[crewMember.id].from} → {this.state.levelTransitions[crewMember.id].to}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="crew-level-badge">Lvl {crewMember.stats?.level || 1}</span>
                                                                    )}
                                                                </div>

                                                                {/* XP Bar */}
                                                                <AnimatedXPBar 
                                                                    percentBefore={this.state.xpPercentsBefore ? (this.state.xpPercentsBefore[crewMember.id] || 0) : 0} 
                                                                    percentAfter={percent} 
                                                                    levelTransition={this.state.levelTransitions[crewMember.id]} 
                                                                />

                                                                {/* Stats Gains */}
                                                                {gainsAgg && Object.keys(gainsAgg).length > 0 && (
                                                                    <div className="crew-gains-pills">
                                                                        {Object.keys(gainsAgg).map((k, idx) => (
                                                                            <span key={idx} className="gain-pill">{k.toUpperCase()} +{gainsAgg[k]}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Dead Crew */}
                                                {Object.values(this.state.battleData).filter(e => e.dead && !e.isMonster && !e.isMinion).map((crewMember, i) => {
                                                    const portraitUrl = images[crewMember.portrait] || crewMember.portrait || images['avatar'];
                                                    return (
                                                        <div key={`dead-${i}`} className="crew-summary-row dead">
                                                            <div className="crew-portrait-box dead">
                                                                <div className="crew-portrait-img" style={{ backgroundImage: `url(${portraitUrl})` }} />
                                                                <div className="skull-overlay-icon" style={{ backgroundImage: `url(${images['whiteskull']})` }} />
                                                            </div>
                                                            <div className="crew-summary-details">
                                                                <div className="crew-name-row">
                                                                    <span className="crew-name dead">{crewMember.name}</span>
                                                                    <span className="crew-status-badge dead">FALLEN</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="summary-actions">
                                    {!this.state.isFinalDeath ? (
                                        <button className="confirm-btn-premium" onClick={() => this.confirmClicked()}>
                                            CONTINUE
                                        </button>
                                    ) : (
                                        <div className="final-death-disclaimer">GAME OVER</div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    <CModal className='inventory-modal' alignment='center' visible={this.state.showInventoryPopup} onClose={() => this.setState({ showInventoryPopup: false })}>
                        <div className='inventory-content'>
                            <div className='inventory-title'>Inventory</div>
                            <div className='crew-panels'>
                                {(this.props.crew || []).map((member, idx) => {
                                    const portraitUrl = images[member.portrait] || member.portrait;
                                    return (
                                        <div className='crew-panel' key={member.id || idx}>
                                            <div className='crew-portrait' style={{ backgroundImage: `url(${portraitUrl})` }}></div>
                                            <div className='crew-body' style={{ backgroundImage: `url(${images.body_male})` }}></div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </CModal>

                    {(() => {
                        if (!this.state.message) return null;

                        // Find the main monster (isMonster = true, not a minion)
                        const mainMonster = this.state.battleData && Object.values(this.state.battleData).find(c => c && c.isMonster && !c.isMinion);
                        if (mainMonster && mainMonster.coordinates) {
                            // Main monster is 2x scale (occupies coordinates.x, coordinates.y anchor, which is bottom-right or bottom-left of a 2x2).
                            // Let's compute its visual center X/Y using tilePos style logic.
                            // Anchor coordinates:
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
                            } else {
                                // 2x2 footprint
                                const hOffset = (mx >= 4) ? -TILE_SIZE : 0;
                                const leftPos = mx * TILE_SIZE + hOffset;
                                const topPos = my * TILE_SIZE - TILE_SIZE; // Top row of the 2x2

                                bubbleCenterX = leftPos + TILE_SIZE;
                                bubbleCenterY = topPos; // Directly above the top row
                            }

                            return (
                                <div
                                    className="message-container speech-bubble"
                                    style={{
                                        position: 'absolute',
                                        left: `${bubbleCenterX}px`,
                                        top: `${bubbleCenterY - 45}px`, // Place it slightly above the monster's top border
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
                                    {/* Small arrow pointing down towards the monster */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-8px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '0',
                                        height: '0',
                                        borderLeft: '8px solid transparent',
                                        borderRight: '8px solid transparent',
                                        borderTop: '8px solid rgba(20, 20, 22, 0.96)',
                                        zIndex: 451
                                    }} />
                                    {/* Outline for the arrow */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-10px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '0',
                                        height: '0',
                                        borderLeft: '9px solid transparent',
                                        borderRight: '9px solid transparent',
                                        borderTop: '9px solid #ff5400',
                                        zIndex: 450
                                    }} />
                                </div>
                            );
                        }

                        // Fallback default message styling if no monster is active
                        return (
                            <div className="message-container">
                                {this.state.message}
                            </div>
                        );
                    })()}



                    {/* Unified Combat Grid Cells (Sandbox Style) */}
                    <div className="combat-grid" style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%'
                    }}>
                        {this.state.combatTiles.map((t, i) => {
                            const isSelectedFighter = this.state.selectedFighter?.id && Object.values(this.state.battleData).some(e => e.id === this.state.selectedFighter.id && !e.dead && e.coordinates && e.coordinates.x === t.x && e.coordinates.y === t.y);
                            const isSelectedMonster = this.state.selectedMonster?.id && Object.values(this.state.battleData).some(e => e.id === this.state.selectedMonster.id && !e.dead && e.coordinates && e.coordinates.x === t.x && e.coordinates.y === t.y);
                            return (
                                <div
                                    key={i}
                                    className="combat-tile"
                                    onDragOver={(event) => this.onDragOver(event, i)}
                                    onDrop={() => { this.onDrop(i) }}
                                    style={{
                                        border: isSelectedFighter
                                            ? '1px dashed rgba(255, 183, 3, 0.25)'
                                            : isSelectedMonster
                                                ? '1px dashed rgba(255, 84, 0, 0.25)'
                                                : '1px solid rgba(255, 255, 255, 0.04)',
                                        background: this.state.draggedOverCombatTileId === i
                                            ? '#cccca4c1'
                                            : isSelectedFighter
                                                ? 'rgba(255, 183, 3, 0.06)'
                                                : isSelectedMonster
                                                    ? 'rgba(255, 84, 0, 0.06)'
                                                    : (t.x + t.y) % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.15)',
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {/* Cell Coordinates */}
                                    <div style={{ position: 'absolute', top: '5px', left: '5px', fontSize: '9px', color: 'rgba(255,255,255,0.15)', pointerEvents: 'none' }}>
                                        {t.x},{t.y}
                                    </div>
                                    {this.state.ghostPortraitMatrix[i] && <div className="ghost-portrait"
                                        style={{
                                            backgroundImage: "url(" + this.state.ghostPortraitMatrix[i] + ")"
                                        }}>
                                    </div>}
                                </div>
                            );
                        })}


                        {/* /// SHIELD WALL OVERLAYS */}
                        {(() => {
                            const reduxWalls = [];
                            if (this.state.battleData) {
                                Object.values(this.state.battleData).forEach(c => {
                                    if (c && !c.dead && c.shieldWallActive) {
                                        const wallX = (c.facing !== 'left') ? c.coordinates.x + 1 : c.coordinates.x - 1;
                                        const centerY = c.coordinates.y;
                                        const lanesAffected = [];
                                        for (let dy = -2; dy <= 2; dy++) {
                                            const lane = centerY + dy;
                                            if (lane >= 0 && lane < 5) {
                                                lanesAffected.push(lane);
                                            }
                                        }
                                        reduxWalls.push({
                                            id: `wall_${c.id}_redux`,
                                            x: wallX,
                                            lanesAffected,
                                            isFacingRight: (c.facing !== 'left'),
                                            callerId: c.id
                                        });
                                    }
                                });
                            }
                            const allWalls = [...(this.state.activeWalls || []), ...reduxWalls];
                            return allWalls.map((wall) => {
                                if (!wall.lanesAffected || !wall.lanesAffected.length) return null;
                                const minLane = Math.min(...wall.lanesAffected);
                                const topPx = minLane * TILE_SIZE;
                                const heightPx = wall.lanesAffected.length * TILE_SIZE;
                                const leftPx = wall.isFacingRight
                                    ? wall.x * TILE_SIZE - 3
                                    : (wall.x + 1) * TILE_SIZE - 3;
                                return (
                                    <div
                                        key={wall.id}
                                        className="shield-wall-overlay"
                                        style={{
                                            position: 'absolute',
                                            left: leftPx + 'px',
                                            top: topPx + 'px',
                                            width: '6px',
                                            height: heightPx + 'px',
                                            zIndex: 20,
                                            pointerEvents: 'none'
                                        }}
                                    />
                                );
                            });
                        })()}

                        {/* /// FEAR OVERLAY — board-wide shroud when induce_fear is active */}
                        {this.state.boardFearActive && (
                            <div className="fear-overlay" />
                        )}

                        {/* /// ENTROPIC KINDRED — column expansion flash strips */}
                        {this.state.entropicKindredNewCols && this.state.entropicKindredNewCols.map((strip, i) => {
                            const colPx = strip.colIndex * (TILE_SIZE + (SHOW_TILE_BORDERS ? 2 : 0));
                            return (
                                <div
                                    key={`ek-col-${i}`}
                                    className="entropic-kindred-col-flash"
                                    style={{
                                        position: 'absolute',
                                        left: `${colPx}px`,
                                        top: 0,
                                        width: `${TILE_SIZE}px`,
                                        height: '100%',
                                        animationDelay: `${strip.delay}ms`,
                                        zIndex: 80,
                                        pointerEvents: 'none',
                                    }}
                                />
                            );
                        })}

                        {/* /// UNIFIED COMBAT GRID — fighters, monsters & minions share the same board */}
                        <CombatGrid
                            crew={this.props.crew}
                            combatManager={this.props.combatManager}
                            battleData={this.state.battleData}
                            selectedFighter={this.state.selectedFighter}
                            selectedMonster={this.state.selectedMonster}
                            portraitHoveredId={this.state.portraitHoveredId}
                            animationOverlays={this.state.animationOverlays}
                            getAllOverlaysById={this.getAllOverlaysById}
                            portraitHovered={this.portraitHovered}
                            fighterPortraitClicked={this.fighterPortraitClicked}
                            monsterCombatPortraitClicked={this.monsterCombatPortraitClicked}
                            onDragStart={this.onDragStart}
                            getActionBarLeftValForFighter={this.getActionBarLeftValForFighter}
                            getManualMovementArc={this.getManualMovementArc}
                            getManualMovementArcColor={this.getManualMovementArcColor}
                            getFighterDetails={this.getFighterDetails}
                            getMonsterWeaponAnimation={this.getMonsterWeaponAnimation}
                            getHitAnimation={this.getHitAnimation}
                            teleportingFighterId={this.state.teleportingFighterId}
                            fearCastingActive={this.state.fearCastingActive}
                            greetingInProcess={this.state.greetingInProcess}
                            SHOW_MONSTER_IDS={SHOW_MONSTER_IDS}
                            activeAnimations={this.state.activeAnimations}
                            TILE_SIZE={TILE_SIZE}
                            SHOW_TILE_BORDERS={SHOW_TILE_BORDERS}
                        />
                    </div>
                </div>

                {/* // INTERACTION PANE */}
                {SHOW_INTERACTION_PANE && <div className={`mb-interaction-pane ${!this.state.greetingInProcess ? 'visible' : ''} `}>
                    <div className="header-row">
                        <div className="portrait" style={{ backgroundImage: `url(${selectedPortraitUrl})` }}>
                            {cooldownActive && (
                                <div
                                    className="manual-cooldown-mask"
                                    style={{ '--manual-cooldown-angle': cooldownRemainingAngle }}
                                ></div>
                            )}
                            {cooldownActive && (
                                <div className="manual-cooldown-label">
                                    {Math.max(1, Math.ceil((cooldownEnd - Date.now()) / 1000))}
                                </div>
                            )}
                        </div>
                        <div className="title">
                            <div className="name">
                                {liveSelectedFighter?.name}
                            </div>
                            <div className="readout">
                                {(liveSelectedFighter?.readout?.action || '')} {(liveSelectedFighter?.readout?.result || '')}
                            </div>
                            {this.props.paused && <span className="paused-marker">PAUSED</span>}
                        </div>
                    </div>

                    {/* ── Redux AI Mode: read-only status panel ───────────────────────── */}
                    {this.props.combatManager && this.props.combatManager.round !== undefined ? (
                        <div className="interaction-row redux-status-panel">

                            {/* LEFT COLUMN: stat bars + current target */}
                            <div className="redux-stats-col">
                                <div className="interaction-header">Status</div>

                                {/* ── Active Battle Tactic badge ──────────────── */}
                                {(() => {
                                    const soldier = (this.props.crew || []).find(m => m && (m.type === 'soldier' || m.image === 'soldier'));
                                    if (!soldier) return null;
                                    const activeTactic = (soldier.specialActions || []).find(
                                        a => a && a.type === 'tactics' && a.available === true && (a.combatsRemaining || 0) > 0
                                    );
                                    if (!activeTactic) return null;
                                    const tacticIconUrl = images['battle_tactics'];
                                    return (
                                        <div className="tactic-active-badge">
                                            {tacticIconUrl && (
                                                <div
                                                    className="tactic-active-badge-icon"
                                                    style={{ backgroundImage: `url(${tacticIconUrl})` }}
                                                />
                                            )}
                                            <div className="tactic-active-badge-text">
                                                <span className="tactic-active-name">{activeTactic.name}</span>
                                                <span className="tactic-active-meta">
                                                    ⚔ {activeTactic.combatsRemaining} left
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {liveSelectedFighter ? (
                                    <div className="redux-stat-block">
                                        {/* HP Bar */}
                                        <div className="redux-stat-label">
                                            <span>HP</span>
                                            <span className="redux-stat-value">
                                                {Math.max(0, Math.round(liveSelectedFighter.hp ?? 0))} / {Math.round(liveSelectedFighter.starting_hp ?? liveSelectedFighter.stats?.hp ?? 0)}
                                            </span>
                                        </div>
                                        <div className="redux-bar-track">
                                            <div
                                                className="redux-bar-fill hp-fill"
                                                style={{ width: `${Math.max(0, Math.min(100, ((liveSelectedFighter.hp ?? 0) / (liveSelectedFighter.starting_hp || liveSelectedFighter.stats?.hp || 1)) * 100))}%` }}
                                            />
                                        </div>

                                        {/* Endurance Bar */}
                                        {!(liveSelectedFighter.isMonster || liveSelectedFighter.isMinion) && (
                                            <>
                                                <div className="redux-stat-label">
                                                    <span>Endurance</span>
                                                    <span className="redux-stat-value">
                                                        {Math.max(0, Math.round(liveSelectedFighter.endurance ?? 0))} / {Math.round(liveSelectedFighter.maxEndurance ?? 100)}
                                                    </span>
                                                </div>
                                                <div className="redux-bar-track">
                                                    <div
                                                        className="redux-bar-fill endurance-fill"
                                                        style={{ width: `${Math.max(0, Math.min(100, ((liveSelectedFighter.endurance ?? 100) / (liveSelectedFighter.maxEndurance || 100)) * 100))}%` }}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* Active status effects */}
                                        {(() => {
                                            const liveUnit = this.props.combatManager.getCombatant?.(liveSelectedFighter.id) || liveSelectedFighter;
                                            const activeEffects = getActiveEffects(liveUnit, this.props.combatManager);
                                            if (!activeEffects || activeEffects.length === 0) return null;

                                            const EFFECT_LABELS = {
                                                frozen: 'Frozen',
                                                stunned: 'Stunned',
                                                sleep: 'Asleep',
                                                fear: 'Feared',
                                                bleed: 'Bleeding',
                                                poison: 'Poisoned',
                                                defensive_stance: 'Defensive Stance',
                                                berserker: 'Berserk',
                                                weakness: 'Weakness Revealed',
                                                marked: 'Marked',
                                                ensnared: 'Ensnared',
                                                shadow_curse: 'Shadow Curse',
                                                hexed: 'Hexed',
                                                polymorphed: 'Polymorphed',
                                                third_eye: 'Third Eye',
                                                shield_wall: 'Shield Wall',
                                                rift_portal: 'Rift Open',
                                                spiderweb: 'Spiderweb'
                                            };

                                            const EFFECT_EXPLANATIONS = {
                                                frozen: 'Frozen in absolute-zero ice. Cannot move or take actions.',
                                                stunned: 'Stunned. Cannot move or take actions.',
                                                sleep: 'Asleep. Cannot move or take actions. Wakes up when taking damage.',
                                                fear: 'Terrified. Bypasses normal behavior and flees to a corner tile.',
                                                bleed: 'Bleeding. Takes damage at the end of each round.',
                                                poison: 'Poisoned. Takes tick damage over time.',
                                                defensive_stance: 'Defensive Stance. Increases DEF and blocks incoming attacks.',
                                                berserker: 'Berserk. Increases Attack (ATK) by 12. Doubles movement speed (halves movement cooldown) and doubles attack speed (halves attack cooldowns) for 1 full turn cycle.',
                                                weakness: 'Weakness. Takes increased damage from physical and magical hits.',
                                                marked: 'Marked. Ranged attacks against this unit deal extra damage.',
                                                ensnared: 'Ensnared. Restricted movement. Cannot walk to adjacent tiles.',
                                                shadow_curse: 'Curse the target for 4 rounds. While active, the stamina (endurance) cost of any movement or action is tripled (increased from 2 to 6). If stamina drops to 0, the unit is immediately exhausted, falling asleep and becoming stunned for 4 rounds.',
                                                hexed: 'Hexed. Reduces ATK by 2 for 4 rounds. All skill uses have a 35% chance to backfire, failing the action and dealing 10 damage to the caster.',
                                                polymorphed: 'Polymorphed into a harmless creature. Stunned for the duration.',
                                                third_eye: 'Third Eye. Increases accuracy and critical strike chance.',
                                                shield_wall: 'Shield Wall. Protects adjacent allies and increases DEF.',
                                                rift_portal: 'Rift Open. Portal is open and channeling energy.',
                                                spiderweb: 'Trapped in a sticky spiderweb. Cannot move. Contact with spider minions will cause double damage and detonate in a purple blast.'
                                            };

                                            const mappedEffects = activeEffects.map(eff => {
                                                const label = EFFECT_LABELS[eff.key] || eff.key || 'Status Effect';
                                                const explanation = EFFECT_EXPLANATIONS[eff.key] || 'An active status effect.';
                                                return { ...eff, label, explanation };
                                            });

                                            return (
                                                <div className="redux-status-badges" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '10px 0', alignItems: 'center' }}>
                                                    {mappedEffects.map((eff, i) => {
                                                        const roundsLeft = eff.roundsLeft || 0;
                                                        const total = eff.totalDuration || 4;
                                                        const roundDurationMs = this.props.combatManager?.roundDurationMs || (this.props.combatManager?.gameSpeed === 'fast' ? 1000 : 2000);

                                                        let preciseRoundsLeft = 0;
                                                        if (eff.endTimeMs && eff.totalDurationMs && eff.totalDurationMs > 0) {
                                                            const now = Date.now();
                                                            const timeLeftMs = eff.endTimeMs - now;
                                                            preciseRoundsLeft = Math.max(0, (timeLeftMs / eff.totalDurationMs) * total);
                                                        } else {
                                                            const roundProgress = (this.props.combatManager?.roundTimeElapsedMs || 0) / roundDurationMs;
                                                            preciseRoundsLeft = roundsLeft > 0 ? Math.max(0, roundsLeft - roundProgress) : 0;
                                                        }

                                                        const segmentedDuration = eff.stackDuration || 0;
                                                        const segmentedRoundsLeft = eff.segmented && segmentedDuration > 0
                                                            ? (() => {
                                                                const modulo = preciseRoundsLeft % segmentedDuration;
                                                                return modulo === 0 && preciseRoundsLeft > 0 ? segmentedDuration : modulo;
                                                            })()
                                                            : preciseRoundsLeft;
                                                        const pctBase = eff.segmented && segmentedDuration > 0 ? segmentedDuration : total;
                                                        let pct = pctBase > 0 ? Math.min(100, Math.max(0, (segmentedRoundsLeft / pctBase) * 100)) : 0;
                                                        const dashOffset = (pct / 100) * 31.42;

                                                        const ratio = pct / 100;
                                                        const angle = (1 - ratio) * 360;
                                                        const rad = angle * (Math.PI / 180);
                                                        const coords = {
                                                            x2: 10 + 10 * Math.cos(rad),
                                                            y2: 10 + 10 * Math.sin(rad)
                                                        };

                                                        const showBadge = eff.alwaysShowBadge ? (eff.stacks || 0) > 0 : (eff.stacks || 0) > 1;

                                                        return (
                                                            <div
                                                                key={eff.key || i}
                                                                className="effect-icon-clickable"
                                                                style={{
                                                                    width: '28px',
                                                                    height: '28px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: '#111',
                                                                    border: `2px solid ${eff.border || '#f39c12'}`,
                                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                                                    position: 'relative',
                                                                    overflow: 'visible',
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={() => {
                                                                    const initiallyPaused = !!(this.props.paused || this.props.combatManager?.combatPaused);
                                                                    this.setState({
                                                                        activeEffectPopup: eff,
                                                                        popupOpenedWhilePaused: initiallyPaused
                                                                    });
                                                                    if (!initiallyPaused && this.props.combatManager && typeof this.props.combatManager.pauseCombat === 'function') {
                                                                        this.props.combatManager.pauseCombat(true);
                                                                    }
                                                                }}
                                                                title={`Click to inspect ${eff.label}`}
                                                            >
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    top: 0,
                                                                    left: 0,
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    borderRadius: '50%',
                                                                    backgroundImage: `url(${eff.icon?.default || eff.icon})`,
                                                                    backgroundSize: 'cover',
                                                                    backgroundRepeat: 'no-repeat',
                                                                    backgroundPosition: 'center'
                                                                }} />
                                                                {preciseRoundsLeft > 0 && (
                                                                    <svg
                                                                        style={{
                                                                            position: 'absolute',
                                                                            top: 0,
                                                                            left: 0,
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            transform: 'rotate(-90deg)',
                                                                            pointerEvents: 'none',
                                                                            zIndex: 10
                                                                        }}
                                                                        viewBox="0 0 20 20"
                                                                    >
                                                                        <circle
                                                                            cx="10"
                                                                            cy="10"
                                                                            r="5"
                                                                            fill="none"
                                                                            stroke="rgba(0, 0, 0, 0.5)"
                                                                            strokeWidth="10"
                                                                            strokeDasharray="31.42"
                                                                            strokeDashoffset={dashOffset}
                                                                        />
                                                                        {coords && (
                                                                            <line
                                                                                x1="10"
                                                                                y1="10"
                                                                                x2={coords.x2}
                                                                                y2={coords.y2}
                                                                                stroke="#ffffff"
                                                                                strokeWidth="0.8"
                                                                            />
                                                                        )}
                                                                    </svg>
                                                                )}
                                                                {showBadge && (
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        bottom: '-4px',
                                                                        left: '-8px',
                                                                        background: eff.badgeBackground || eff.border || '#f39c12',
                                                                        color: '#fff',
                                                                        fontSize: '9px',
                                                                        fontWeight: 'bold',
                                                                        borderRadius: '50%',
                                                                        width: '12px',
                                                                        height: '12px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        border: `1px solid ${eff.badgeBorder || '#111'}`,
                                                                        zIndex: 11
                                                                    }}>
                                                                        {eff.stacks}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}

                                        {/* Current Target */}
                                        {(() => {
                                            const liveUnit = this.props.combatManager.getCombatant?.(liveSelectedFighter.id);
                                            const targetId = liveUnit?.targetId;
                                            const target = targetId ? this.props.combatManager.getCombatant?.(targetId) : null;
                                            if (!target || target.dead) return null;
                                            const targetPortraitUrl = target
                                                ? (images[target.portrait] || target.portrait || images.avatar)
                                                : images.avatar;
                                            return (
                                                <div className="redux-target-row">
                                                    <span className="redux-stat-label-inline">Target:</span>
                                                    <div
                                                        className="redux-target-portrait"
                                                        style={{ backgroundImage: `url(${targetPortraitUrl})` }}
                                                    />
                                                    <span className="redux-target-name">{target.name || target.type}</span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="redux-no-selection">Click a unit portrait to inspect</div>
                                )}
                            </div>

                            {/* MIDDLE COLUMN: ability cooldown grid */}
                            <div className="redux-abilities-col">
                                <div className="interaction-header">Abilities</div>
                                <div className="interaction-tile-container">
                                    {liveSelectedFighter && (() => {
                                        const rawSpecials = [
                                            ...(liveSelectedFighter.specials || []),
                                            ...(liveSelectedFighter.attacks || []),
                                            ...(liveSelectedFighter.specialActions?.filter(a => a.type === 'glyph' && a.available) || [])
                                        ];
                                        const seenKeys = new Set();
                                        const cm = this.props.combatManager;
                                        return rawSpecials.filter(entry => {
                                            const key = typeof entry === 'string' ? entry : (entry?.key || entry?.name || '');
                                            const nk = String(key).trim().toLowerCase().replaceAll(' ', '_');
                                            if (!nk || seenKeys.has(nk)) return false;
                                            seenKeys.add(nk);
                                            return true;
                                        }).map((a, i) => {
                                            const sourceKey = typeof a === 'string' ? a : (a?.key || a?.name || '');
                                            const normalizedSourceKey = String(sourceKey).toLowerCase().replaceAll(' ', '_');
                                            const canonicalSpecial = cm
                                                ? ((cm.specialsMatrix && (cm.specialsMatrix[sourceKey] || cm.specialsMatrix[normalizedSourceKey])) ||
                                                    (cm.attacksMatrix && (cm.attacksMatrix[sourceKey] || cm.attacksMatrix[normalizedSourceKey])) || {})
                                                : {};
                                            const runtimeSpecial = (cm?.resolveSpecial && liveSelectedFighter)
                                                ? (cm.resolveSpecial(liveSelectedFighter, sourceKey) || {})
                                                : {};
                                            const spec = { ...canonicalSpecial, ...(typeof a === 'object' ? a : {}), ...runtimeSpecial };
                                            if (!spec.name) {
                                                spec.name = String(sourceKey).replaceAll('_', ' ');
                                            }
                                            const iconCandidate = spec.iconUrl || spec.icon;
                                            const resolveIcon = (candidate) => {
                                                if (!candidate) return '';
                                                if (typeof candidate === 'string') {
                                                    if (candidate.trim().startsWith('url(')) return candidate.replace(/^url\((.*)?\)$/i, '$1').replace(/^['"]|['"]$/g, '');
                                                    const mapped = images[candidate.trim()];
                                                    if (mapped) return mapped.default || mapped;
                                                    return candidate;
                                                }
                                                if (typeof candidate === 'object' && candidate.default) return candidate.default;
                                                return '';
                                            };
                                            const iconUrl = resolveIcon(iconCandidate);
                                            const remainingRounds = liveSelectedFighter?.cooldowns?.[spec.id] || liveSelectedFighter?.cooldowns?.[sourceKey] || liveSelectedFighter?.cooldowns?.[normalizedSourceKey] || 0;
                                            const baseCd = spec.cooldown || 5;
                                            const ratio = this.props.combatManager?.roundTimeRemainingRatio ?? 1.0;
                                            const smoothRemaining = remainingRounds > 0 ? Math.max(0, remainingRounds - (1 - ratio)) : 0;
                                            const cooldownPct = smoothRemaining > 0 ? (smoothRemaining / baseCd) * 100 : 0;
                                            const isReady = cooldownPct === 0;
                                            return (
                                                <div key={i} className="interaction-tile-wrapper">
                                                    <div
                                                        className={`interaction-tile special ${isReady ? 'available' : ''}`}
                                                        style={{
                                                            backgroundImage: iconUrl ? `url("${encodeURI(String(iconUrl).replace(/^['"]|['"]$/g, ''))}")` : 'none',
                                                            cursor: 'pointer',
                                                            opacity: isReady ? 1 : 0.7,
                                                        }}
                                                        title={spec.name || sourceKey}
                                                        onClick={() => {
                                                            const initiallyPaused = !!(this.props.paused || this.props.combatManager?.combatPaused);
                                                            this.setState({
                                                                activeSkillPopup: spec,
                                                                popupOpenedWhilePaused: initiallyPaused
                                                            });
                                                            if (!initiallyPaused && this.props.combatManager && typeof this.props.combatManager.pauseCombat === 'function') {
                                                                this.props.combatManager.pauseCombat(true);
                                                            }
                                                        }}
                                                    />
                                                    {cooldownPct > 0 && (
                                                        <svg
                                                            style={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                width: '100%',
                                                                height: '100%',
                                                                transform: 'rotate(-90deg)',
                                                                pointerEvents: 'none',
                                                                zIndex: 10
                                                            }}
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <circle
                                                                cx="10"
                                                                cy="10"
                                                                r="10"
                                                                fill="none"
                                                                stroke="rgba(0, 0, 0, 0.75)"
                                                                strokeWidth="20"
                                                                strokeDasharray="62.83"
                                                                strokeDashoffset={(1 - (cooldownPct / 100)) * 62.83}
                                                            />
                                                        </svg>
                                                    )}
                                                    {!isReady && (
                                                        <div className="redux-cd-badge">{Math.ceil(smoothRemaining)}</div>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* RIGHT COLUMN: event log */}
                            <div className="queue-col redux-log-col">
                                <div className="interaction-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <span>Event Log</span>
                                    <div className="log-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#aaa', cursor: 'pointer', userSelect: 'none' }}>
                                            <input
                                                type="checkbox"
                                                checked={this.state.logFilterSelectedFighter}
                                                onChange={(e) => this.setState({ logFilterSelectedFighter: e.target.checked })}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            Filter Selected
                                        </label>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                            <button
                                                onClick={() => this.setState(prev => ({ logFontSize: Math.max(8, prev.logFontSize - 1) }))}
                                                style={{ padding: '2px 6px', fontSize: '10px', lineHeight: '1', cursor: 'pointer', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '3px' }}
                                                title="Decrease Font Size"
                                            >
                                                −
                                            </button>
                                            <button
                                                onClick={() => this.setState(prev => ({ logFontSize: Math.min(24, prev.logFontSize + 1) }))}
                                                style={{ padding: '2px 6px', fontSize: '10px', lineHeight: '1', cursor: 'pointer', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '3px' }}
                                                title="Increase Font Size"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="event-log-container" ref={this.combatLogContainerRef}>
                                    {this.state.combatLog
                                        .filter((entry) => {
                                            const selectedUnit = this.state.selectedFighter || this.state.selectedMonster;
                                            if (!this.state.logFilterSelectedFighter || !selectedUnit) return true;
                                            const uName = String(selectedUnit.name || '').toLowerCase();
                                            const uType = String(selectedUnit.type || '').toLowerCase();
                                            const msg = String(entry.message || '').toLowerCase();
                                            return msg.includes(uName) || msg.includes(uType);
                                        })
                                        .map((entry, index, filteredArray) => {
                                            const isLatest = index === filteredArray.length - 1;
                                            return (
                                                <div
                                                    key={entry.id || index}
                                                    ref={isLatest ? this.latestCombatLogEntryRef : null}
                                                    className="event-log-entry"
                                                    style={{ fontSize: `${this.state.logFontSize}px` }}
                                                >
                                                    {entry.message}
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>

                        </div>
                    ) : (

                        /* ── Legacy Manual Mode ─────────────────────────────────────────── */
                        <div className="interaction-row">
                            <div className="inventory-col">
                                <div className="interaction-header">Consumables</div>
                                <div className="interaction-tooltip" style={{ fontSize: this.state.hoveredInventoryTile?.length > 8 ? '10px' : 'inherit' }}>{this.state.hoveredInventoryTile}</div>
                                <div className="interaction-tile-container">
                                    {this.state.selectedFighter && (() => {
                                        const consumables = this.props.inventoryManager?.inventory.filter(e => e.type === 'consumable') || [];
                                        if (!consumables.length) return null;
                                        const grouped = {};
                                        consumables.forEach(unit => {
                                            if (!unit) return;
                                            const key = unit.name;
                                            if (!grouped[key]) grouped[key] = [];
                                            grouped[key].push(unit);
                                        });
                                        return Object.keys(grouped).map((name) => {
                                            const group = grouped[name];
                                            const unit = group[0];
                                            const count = group.length;
                                            const iconUrl = unit && unit.icon && typeof unit.icon === 'string'
                                                ? ((unit.icon.includes('/') || unit.icon.startsWith('http') || unit.icon.startsWith('data:'))
                                                    ? unit.icon
                                                    : images[unit.icon])
                                                : null;
                                            const cooldownPct = typeof unit?.cooldown_position === 'number' ? unit.cooldown_position : null;
                                            return (
                                                <div key={name} className='interaction-tile-wrapper' style={{ position: 'relative' }}>
                                                    <div
                                                        className={`interaction-tile consumable`}
                                                        style={{
                                                            backgroundImage: iconUrl ? `url("${encodeURI(String(iconUrl).replace(/^['"]|['"]$/g, ''))}")` : 'none',
                                                            backgroundColor: iconUrl ? 'transparent' : 'whitesmoke',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => this.combatInventoryTileClicked(unit)}
                                                        onMouseEnter={() => this.inventoryTileHovered(unit.name)}
                                                        onMouseLeave={() => this.inventoryTileHovered(null)}
                                                    >
                                                    </div>
                                                    {cooldownPct !== null && (
                                                        <div className="interaction-tile-overlay" style={{ width: `${cooldownPct}%`, transition: cooldownPct === 0 ? '0s' : '0.2s' }}></div>
                                                    )}
                                                    {count > 1 && (
                                                        <div className="stack-badge">{this.romanNumeral(count)}</div>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                            <div className="specials-col">
                                <div className="interaction-header">Specials</div>
                                <div className="interaction-tooltip">{this.state.hoveredSpecialTile}</div>
                                <div className="interaction-tile-container">
                                    {(() => {
                                        const rawSpecials = [
                                            ...(this.state.selectedFighter?.specials || []),
                                            ...(this.state.selectedFighter?.attacks || [])
                                        ];
                                        const seenSpecials = new Set();
                                        const uniqueSpecials = rawSpecials.filter((entry) => {
                                            const rawKey = typeof entry === 'string' ? entry : (entry?.key || entry?.name || '');
                                            const normalizedKey = String(rawKey || '').trim().toLowerCase().replaceAll(' ', '_');
                                            if (!normalizedKey) return false;
                                            if (seenSpecials.has(normalizedKey)) return false;
                                            seenSpecials.add(normalizedKey);
                                            return true;
                                        });

                                        return uniqueSpecials.map((a, i) => {
                                            const cm = this.props.combatManager;
                                            const toSpecialKey = (value) => String(value || '').toLowerCase().replaceAll(' ', '_');
                                            const sourceKey = typeof a === 'string' ? a : (a?.key || a?.name || '');
                                            const canonicalSpecial = (cm && cm.specialsMatrix)
                                                ? (cm.specialsMatrix[sourceKey] || cm.specialsMatrix[toSpecialKey(sourceKey)] || null)
                                                : null;
                                            const runtimeSpecial = (cm?.resolveSpecial && this.state.selectedFighter)
                                                ? cm.resolveSpecial(this.state.selectedFighter, sourceKey)
                                                : null;
                                            const normalizedSpecial = {
                                                ...(canonicalSpecial || {}),
                                                ...(typeof a === 'object' ? a : {}),
                                                ...(runtimeSpecial || {}),
                                            };
                                            if (!normalizedSpecial.name) {
                                                normalizedSpecial.name = typeof a === 'string' ? a.replaceAll('_', ' ') : '';
                                            }
                                            const iconCandidate = normalizedSpecial?.iconUrl || normalizedSpecial?.icon;
                                            const resolveIconSource = (candidate) => {
                                                if (!candidate) return '';
                                                if (typeof candidate === 'string') {
                                                    const trimmed = candidate.trim();
                                                    if (!trimmed) return '';
                                                    if (trimmed.startsWith('url(')) {
                                                        return trimmed.replace(/^url\((.*)\)$/i, '$1').replace(/^['"]|['"]$/g, '');
                                                    }
                                                    const mapped = images[trimmed];
                                                    if (mapped) return mapped.default || mapped;
                                                    return trimmed;
                                                }
                                                if (typeof candidate === 'object' && candidate.default) return candidate.default;
                                                return '';
                                            };
                                            const cssUrl = (value) => {
                                                if (!value) return '';
                                                const normalizedValue = String(value).trim().replace(/^['"]|['"]$/g, '');
                                                return `url("${encodeURI(normalizedValue)}")`;
                                            };
                                            const specialIcon = resolveIconSource(iconCandidate);
                                            const specialBackgroundImage = specialIcon
                                                ? `${cssUrl(specialIcon)}`
                                                : 'none';
                                            let specialCooldownRemaining = 0;
                                            const ratio = this.props.combatManager?.roundTimeRemainingRatio ?? 1.0;
                                            if (this.props.combatManager && this.props.combatManager.round !== undefined) {
                                                const remainingSec = liveSelectedFighter?.cooldowns?.[normalizedSpecial.id] || liveSelectedFighter?.cooldowns?.[normalizedSpecial.key] || liveSelectedFighter?.cooldowns?.[sourceKey] || 0;
                                                if (remainingSec > 0) {
                                                    const baseCooldown = normalizedSpecial.cooldown || 5;
                                                    const smoothRemaining = Math.max(0, remainingSec - (1 - ratio));
                                                    specialCooldownRemaining = (smoothRemaining / baseCooldown) * 100;
                                                }
                                            } else {
                                                const specialCooldownPosition = typeof normalizedSpecial.cooldown_position === 'number'
                                                    ? normalizedSpecial.cooldown_position
                                                    : 100;
                                                specialCooldownRemaining = Math.max(0, Math.min(100, 100 - specialCooldownPosition));
                                            }
                                            const specialEnergyCost = Number(normalizedSpecial.energy_cost) || 0;
                                            const currentEnergy = Number(liveSelectedFighter?.energy || this.state.selectedFighter?.energy || 0);
                                            const specialEnergyFillPct = specialEnergyCost > 0
                                                ? Math.min(100, Math.floor((currentEnergy / specialEnergyCost) * 100))
                                                : 100;
                                            const showSpecialEnergyRing = specialEnergyCost > 0;
                                            return normalizedSpecial && <div key={i} className='interaction-tile-wrapper'>
                                                <div
                                                    style={{ backgroundImage: specialBackgroundImage, cursor: 'pointer' }}
                                                    className={`interaction-tile special ${specialCooldownRemaining <= 0 ? 'available' : ''} ${normalizedSpecial.selected ? 'selected' : ''}`}
                                                    onClick={() => this.specialTileClicked(normalizedSpecial)}
                                                    onMouseEnter={() => this.specialTileHovered(normalizedSpecial)}
                                                    onMouseLeave={() => this.specialTileHovered(null)}>
                                                </div>
                                                {specialCooldownRemaining > 0 && (
                                                    <svg
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            width: '100%',
                                                            height: '100%',
                                                            transform: 'rotate(-90deg)',
                                                            pointerEvents: 'none',
                                                            zIndex: 10
                                                        }}
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <circle
                                                            cx="10"
                                                            cy="10"
                                                            r="10"
                                                            fill="none"
                                                            stroke="rgba(0, 0, 0, 0.75)"
                                                            strokeWidth="20"
                                                            strokeDasharray="62.83"
                                                            strokeDashoffset={(1 - (specialCooldownRemaining / 100)) * 62.83}
                                                        />
                                                    </svg>
                                                )}
                                                {showSpecialEnergyRing && specialCooldownRemaining <= 0 && (
                                                    <div
                                                        className="interaction-tile-overlay energy-ring"
                                                        style={{ '--energy-ring-fill': specialEnergyFillPct }}
                                                    ></div>
                                                )}

                                            </div>
                                        })
                                    })()}
                                </div>
                            </div>
                            <div className="spells-col" style={{ width: this.state.glyphTrayExpanded ? '100px' : '0px' }}>
                                <div className="interaction-header">Spells</div>
                                <div className="interaction-tooltip">{this.state.hoveredSpellTile}</div>
                                <div className="interaction-tile-container">
                                    {(() => {
                                        const specialActions = this.state.selectedFighter?.specialActions || [];

                                        // Legacy spell entries (type:'spell', e.g. old magic missile)
                                        const legacySpells = specialActions.filter(a => a.type === 'spell' && a.available);
                                        // New tiered glyphs (type:'glyph', available)
                                        const readyGlyphs = specialActions.filter(a => a.type === 'glyph' && a.available);

                                        if (!legacySpells.length && !readyGlyphs.length) return null;

                                        const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V'];

                                        // ── Legacy spell tiles ──────────────────────────────────────
                                        const legacyGrouped = {};
                                        legacySpells.forEach(spellUnit => {
                                            if (!spellUnit) return;
                                            const spellType = spellUnit.subtype;
                                            if (!legacyGrouped[spellType]) legacyGrouped[spellType] = [];
                                            legacyGrouped[spellType].push(spellUnit);
                                        });
                                        const legacyTiles = Object.keys(legacyGrouped).map((type, idx) => {
                                            const group = legacyGrouped[type];
                                            const spellUnit = group[0];
                                            const count = group.length;
                                            const rawIcon = spellUnit.iconUrl || spellUnit.icon;
                                            let resolvedIconUrl = '';
                                            if (rawIcon) {
                                                if (typeof rawIcon === 'string') {
                                                    const mapped = images[rawIcon.trim()];
                                                    resolvedIconUrl = mapped ? (mapped.default || mapped) : rawIcon;
                                                } else if (typeof rawIcon === 'object') {
                                                    resolvedIconUrl = rawIcon.default || rawIcon;
                                                }
                                            }
                                            return (
                                                <div key={`legacy-${type}`} className='interaction-tile-wrapper' style={{ position: 'relative' }}>
                                                    <div
                                                        style={{ backgroundImage: resolvedIconUrl ? `url(${resolvedIconUrl}), radial-gradient(white 0%, black 60%)` : 'none', cursor: 'pointer' }}
                                                        className={`interaction-tile special ${spellUnit.selected ? 'selected' : ''}`}
                                                        onClick={() => this.fireSpell(spellUnit)}
                                                        onMouseEnter={() => this.spellTileHovered(spellUnit)}
                                                        onMouseLeave={() => this.spellTileHovered(null)}>
                                                    </div>
                                                    {count > 0 && (
                                                        <div className={`stack-badge small`}>{romanNumerals[Math.min(count, 5)]}</div>
                                                    )}
                                                </div>
                                            );
                                        });

                                        // ── New tiered glyph tiles ──────────────────────────────
                                        // Group by tier so each tier gets one tile with a count badge
                                        const glyphGrouped = {};
                                        readyGlyphs.forEach(g => {
                                            const tier = g.glyphTier || 'minor';
                                            if (!glyphGrouped[tier]) glyphGrouped[tier] = [];
                                            glyphGrouped[tier].push(g);
                                        });
                                        const glyphTiles = Object.keys(glyphGrouped).map((tier, idx) => {
                                            const group = glyphGrouped[tier];
                                            const representative = group[0];
                                            const count = group.length;
                                            const rawIcon = representative.iconUrl || images[`${tier}_glyph`] || images['glyph_inverted'] || '';
                                            let resolvedIconUrl = '';
                                            if (rawIcon) {
                                                if (typeof rawIcon === 'string') {
                                                    const mapped = images[rawIcon.trim()];
                                                    resolvedIconUrl = mapped ? (mapped.default || mapped) : rawIcon;
                                                } else if (typeof rawIcon === 'object') {
                                                    resolvedIconUrl = rawIcon.default || String(rawIcon);
                                                }
                                            }
                                            const spellNames = (representative.spellDefs || []).map(s => s.name).join(', ');
                                            const tooltip = `${representative.name}${spellNames ? ': ' + spellNames : ''}`;
                                            return (
                                                <div key={`glyph-${tier}`} className='interaction-tile-wrapper' style={{ position: 'relative' }}>
                                                    <div
                                                        style={{ backgroundImage: resolvedIconUrl ? `url(${resolvedIconUrl}), radial-gradient(white 0%, black 60%)` : 'none', cursor: 'pointer' }}
                                                        className={`interaction-tile special glyph-tile glyph-tile--${tier}`}
                                                        onClick={() => this.fireGlyph(representative)}
                                                        onMouseEnter={() => this.spellTileHovered({ subtype: tier, name: tooltip })}
                                                        onMouseLeave={() => this.spellTileHovered(null)}
                                                        title={tooltip}>
                                                    </div>
                                                    {count > 0 && (
                                                        <div className={`stack-badge small glyph-badge--${tier}`}>{romanNumerals[Math.min(count, 5)]}</div>
                                                    )}
                                                </div>
                                            );
                                        });

                                        return [...legacyTiles, ...glyphTiles];
                                    })()}
                                </div>
                            </div>
                            <div className="attacks-col">
                                <div className="interaction-header">Attacks</div>
                                <div className="interaction-tooltip">{this.state.hoveredAttackTile}</div>
                                <div className="interaction-tile-container">
                                    {(() => {
                                        const grouped = {};
                                        (this.state.selectedFighter?.attacks || []).forEach((attack) => {
                                            if (!attack) return;
                                            const key = `${attack.name || attack.key || 'attack'}__${attack.icon || ''}__${attack.range || ''}`;
                                            if (!grouped[key]) grouped[key] = [];
                                            grouped[key].push(attack);
                                        });

                                        return Object.keys(grouped).map((groupKey) => {
                                            const group = grouped[groupKey];
                                            if (!group || group.length === 0) return null;
                                            const displayAttack = group.find((unit) => unit && unit.cooldown_position === 100) || group[0];
                                            if (!displayAttack) return null;

                                            const cooldownPosition = typeof displayAttack.cooldown_position === 'number'
                                                ? displayAttack.cooldown_position
                                                : 100;

                                            let cooldownRemaining = Math.max(0, Math.min(100, 100 - cooldownPosition));
                                            if (this.props.combatManager && this.props.combatManager.round !== undefined) {
                                                const fKey = String(displayAttack.key || displayAttack.name || '').trim().toLowerCase().replaceAll(' ', '_');
                                                const remainingSec = liveSelectedFighter?.cooldowns?.[displayAttack.id] || liveSelectedFighter?.cooldowns?.[displayAttack.key] || liveSelectedFighter?.cooldowns?.[fKey] || 0;
                                                if (remainingSec > 0) {
                                                    const baseCooldown = displayAttack.cooldown || 3;
                                                    const ratio = this.props.combatManager?.roundTimeRemainingRatio ?? 1.0;
                                                    const smoothRemaining = Math.max(0, remainingSec - (1 - ratio));
                                                    cooldownRemaining = (smoothRemaining / baseCooldown) * 100;
                                                } else {
                                                    cooldownRemaining = 0;
                                                }
                                            }
                                            const normalizedAttackName = String(displayAttack.name || '').replaceAll('_', ' ').trim().toLowerCase();
                                            const isAxeThrowTile = normalizedAttackName === 'axe throw';
                                            const iconCandidate = displayAttack.icon;
                                            const directIcon = (typeof iconCandidate === 'string')
                                                ? iconCandidate
                                                : (iconCandidate && typeof iconCandidate === 'object')
                                                    ? (iconCandidate.default || iconCandidate.src || '')
                                                    : '';
                                            const fallbackKey = String(displayAttack.key || displayAttack.name || '')
                                                .trim()
                                                .toLowerCase()
                                                .replaceAll(' ', '_');
                                            const fallbackIconCandidate = images[fallbackKey];
                                            const fallbackIcon = (typeof fallbackIconCandidate === 'string')
                                                ? fallbackIconCandidate
                                                : (fallbackIconCandidate && typeof fallbackIconCandidate === 'object')
                                                    ? (fallbackIconCandidate.default || fallbackIconCandidate.src || '')
                                                    : '';
                                            const resolvedAttackIcon = directIcon || fallbackIcon;

                                            return <div key={groupKey} className='interaction-tile-wrapper'>
                                                <div
                                                    className={`interaction-tile ${cooldownPosition === 100 ? 'available' : ''} ${isAxeThrowTile ? 'attack-axe-throw' : ''}`}
                                                    style={{
                                                        backgroundImage: resolvedAttackIcon ? `url(${resolvedAttackIcon})` : 'none',
                                                        '--attack-icon-url': resolvedAttackIcon ? `url(${resolvedAttackIcon})` : 'none',
                                                        cursor: this.state.showCrosshair ? 'crosshair' : (cooldownPosition === 100 ? 'pointer' : '')
                                                    }}
                                                    onClick={() => this.attackTileClicked(displayAttack)}
                                                    onMouseEnter={() => this.attackTileHovered(displayAttack.name)}
                                                    onMouseLeave={() => this.attackTileHovered(null)}
                                                >
                                                    {cooldownRemaining > 0 && (
                                                        <svg
                                                            style={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                width: '100%',
                                                                height: '100%',
                                                                transform: 'rotate(-90deg)',
                                                                pointerEvents: 'none',
                                                                zIndex: 10
                                                            }}
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <circle
                                                                cx="10"
                                                                cy="10"
                                                                r="10"
                                                                fill="none"
                                                                stroke="rgba(0, 0, 0, 0.75)"
                                                                strokeWidth="20"
                                                                strokeDasharray="62.83"
                                                                strokeDashoffset={(1 - (cooldownRemaining / 100)) * 62.83}
                                                            />
                                                        </svg>
                                                    )}
                                                </div>
                                                {group.length > 1 && <div className="stack-badge">{this.romanNumeral(group.length)}</div>}
                                            </div>
                                        });
                                    })()}
                                </div>
                            </div>
                            <div className="target-col">
                                <div className="interaction-header">Target</div>
                                <div className="interaction-tooltip"> </div>
                                <div className="interaction-tile-container">
                                    {this.state.selectedFighter && this.state.selectedFighter.name !== 'Loryastes' && Object.values(this.state.battleData).filter(e => (e.isMonster || e.isMinion) && !e.dead && !e.invisible && !e.isVCT).map((a) => {
                                        return <div key={a.id} className='interaction-tile-wrapper'>
                                            <div
                                                style={{ backgroundImage: "url(" + a.portrait + ")", cursor: this.state.showCrosshair ? 'crosshair' : '' }}
                                                className={`interaction-tile target ${activeTargetId === a.id ? 'active-target' : ''} ${this.state.portraitHoveredId === a.id ? 'hover-linked-target' : ''}`}
                                                onClick={() => this.targetTileClicked(a)}
                                                onMouseEnter={() => this.targetTileHovered(a)}
                                                onMouseLeave={() => this.targetTileHovered(null)}>
                                            </div>
                                        </div>
                                    })}

                                    {this.state.selectedFighter && this.state.selectedFighter.name === 'Loryastes' && Object.values(this.state.battleData).filter(e => !e.isMonster && !e.isMinion && e.name !== 'Loryastes' && !e.dead && !e.invisible).map((a) => {
                                        return <div
                                            key={a.id}
                                            style={{ backgroundImage: "url(" + a.portrait + ")", cursor: this.state.showCrosshair ? 'crosshair' : '' }}
                                            className={`interaction-tile target ${activeTargetId === a.id ? 'active-target' : ''} ${this.state.portraitHoveredId === a.id ? 'hover-linked-target' : ''}`}
                                            onClick={() => this.targetTileClicked(a)}
                                            onMouseEnter={() => this.targetTileHovered(a)}
                                            onMouseLeave={() => this.targetTileHovered(null)}
                                        >
                                        </div>
                                    })}
                                </div>
                            </div>
                            <div className="combo-col">

                            </div>
                            <div className="queue-col">
                                <div className="interaction-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <span>Event Log</span>
                                    <div className="log-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#aaa', cursor: 'pointer', userSelect: 'none' }}>
                                            <input
                                                type="checkbox"
                                                checked={this.state.logFilterSelectedFighter}
                                                onChange={(e) => this.setState({ logFilterSelectedFighter: e.target.checked })}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            Filter Selected
                                        </label>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                            <button
                                                onClick={() => this.setState(prev => ({ logFontSize: Math.max(8, prev.logFontSize - 1) }))}
                                                style={{ padding: '2px 6px', fontSize: '10px', lineHeight: '1', cursor: 'pointer', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '3px' }}
                                                title="Decrease Font Size"
                                            >
                                                −
                                            </button>
                                            <button
                                                onClick={() => this.setState(prev => ({ logFontSize: Math.min(24, prev.logFontSize + 1) }))}
                                                style={{ padding: '2px 6px', fontSize: '10px', lineHeight: '1', cursor: 'pointer', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '3px' }}
                                                title="Increase Font Size"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="event-log-container" ref={this.combatLogContainerRef}>
                                    {this.state.combatLog
                                        .filter((entry) => {
                                            const selectedUnit = this.state.selectedFighter || this.state.selectedMonster;
                                            if (!this.state.logFilterSelectedFighter || !selectedUnit) return true;
                                            const uName = String(selectedUnit.name || '').toLowerCase();
                                            const uType = String(selectedUnit.type || '').toLowerCase();
                                            const msg = String(entry.message || '').toLowerCase();
                                            return msg.includes(uName) || msg.includes(uType);
                                        })
                                        .map((entry, index, filteredArray) => {
                                            const isLatest = index === filteredArray.length - 1;
                                            return (
                                                <div
                                                    key={entry.id || index}
                                                    ref={isLatest ? this.latestCombatLogEntryRef : null}
                                                    className="event-log-entry"
                                                    style={{ fontSize: `${this.state.logFontSize}px` }}
                                                >
                                                    {entry.message}
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>}

                {this.state.activeEffectPopup && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.375)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        backdropFilter: 'blur(4px)'
                    }} onClick={this.closeActiveEffectPopup}>
                        <div style={{
                            background: 'linear-gradient(135deg, #1e1e24 0%, #121215 100%)',
                            border: `2px solid ${this.state.activeEffectPopup.border || '#444'}`,
                            borderRadius: '12px',
                            padding: '24px',
                            maxWidth: '400px',
                            width: '90%',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 16px rgba(255, 255, 255, 0.05)',
                            textAlign: 'center',
                            color: '#fff',
                            animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }} onClick={(e) => e.stopPropagation()}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                border: `3px solid ${this.state.activeEffectPopup.border || '#444'}`,
                                margin: '0 auto 16px auto',
                                backgroundImage: `url(${this.state.activeEffectPopup.icon?.default || this.state.activeEffectPopup.icon})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                            }} />
                            <h3 style={{
                                margin: '0 0 4px 0',
                                fontSize: '22px',
                                fontWeight: '700',
                                color: this.state.activeEffectPopup.border || '#fff',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>{this.state.activeEffectPopup.label}</h3>
                            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '16px', fontWeight: '500' }}>
                                Active on {liveSelectedFighter?.name || 'this unit'}
                            </div>
                            {this.state.activeEffectPopup.roundsLeft !== undefined && (
                                <div style={{
                                    fontSize: '13px',
                                    color: '#888',
                                    marginBottom: '16px',
                                    fontWeight: '500'
                                }}>
                                    Duration: {Math.max(0, Math.ceil(this.state.activeEffectPopup.roundsLeft))} {Math.ceil(this.state.activeEffectPopup.roundsLeft) === 1 ? 'round' : 'rounds'} remaining
                                </div>
                            )}
                            <p style={{
                                fontSize: '15px',
                                lineHeight: '1.6',
                                color: '#ddd',
                                margin: '0 0 20px 0'
                            }}>{this.state.activeEffectPopup.explanation}</p>
                            <button style={{
                                padding: '8px 24px',
                                background: this.state.activeEffectPopup.border || '#3b82f6',
                                border: 'none',
                                color: '#fff',
                                fontWeight: 'bold',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                                outline: 'none'
                            }} onClick={this.closeActiveEffectPopup}>
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {this.state.activeSkillPopup && (() => {
                    const spec = this.state.activeSkillPopup;
                    const iconCandidate = spec.iconUrl || spec.icon;
                    let iconUrl = '';
                    if (iconCandidate) {
                        if (typeof iconCandidate === 'string') {
                            if (iconCandidate.trim().startsWith('url(')) {
                                iconUrl = iconCandidate.replace(/^url\((.*)?\)$/i, '$1').replace(/^['"]|['"]$/g, '');
                            } else {
                                const mapped = images[iconCandidate.trim()];
                                iconUrl = mapped ? (mapped.default || mapped) : iconCandidate;
                            }
                        } else if (typeof iconCandidate === 'object' && iconCandidate.default) {
                            iconUrl = iconCandidate.default;
                        }
                    }
                    const skillName = spec.name || 'Ability';
                    const cd = spec.cooldown || 0;
                    const cost = spec.energy_cost || spec.energyCost || spec.cost || 0;
                    const range = spec.range || '';
                    const type = spec.type || '';
                    const descText = spec.desc || spec.explanation || spec.description || 'No description available.';
                    return (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            backgroundColor: 'rgba(0, 0, 0, 0.375)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            backdropFilter: 'blur(4px)'
                        }} onClick={this.closeActiveSkillPopup}>
                            <div style={{
                                background: 'linear-gradient(135deg, #1e1e24 0%, #121215 100%)',
                                border: '2px solid #ffb830',
                                borderRadius: '12px',
                                padding: '24px',
                                maxWidth: '400px',
                                width: '90%',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 16px rgba(255, 255, 255, 0.05)',
                                textAlign: 'center',
                                color: '#fff',
                                animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }} onClick={(e) => e.stopPropagation()}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    border: '3px solid #ffb830',
                                    margin: '0 auto 16px auto',
                                    backgroundImage: iconUrl ? `url(${iconUrl})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                }} />
                                <h3 style={{
                                    margin: '0 0 4px 0',
                                    fontSize: '22px',
                                    fontWeight: '700',
                                    color: '#ffb830',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}>{skillName}</h3>
                                <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '16px', fontWeight: '500' }}>
                                    Ability of {liveSelectedFighter?.name || 'this unit'}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '16px',
                                    fontSize: '13px',
                                    color: '#888',
                                    marginBottom: '16px',
                                    fontWeight: '500'
                                }}>
                                    {cd > 0 && (
                                        <span>Cooldown: {cd} {cd === 1 ? 'round' : 'rounds'}</span>
                                    )}
                                    {cost > 0 && (
                                        <span>Cost: {cost} Energy</span>
                                    )}
                                    {range && (
                                        <span style={{ textTransform: 'capitalize' }}>Range: {range}</span>
                                    )}
                                    {type && (
                                        <span style={{ textTransform: 'capitalize' }}>Type: {type}</span>
                                    )}
                                </div>
                                <p style={{
                                    fontSize: '15px',
                                    lineHeight: '1.6',
                                    color: '#ddd',
                                    margin: '0 0 20px 0'
                                }}>{descText}</p>
                                <button style={{
                                    padding: '8px 24px',
                                    background: '#ffb830',
                                    border: 'none',
                                    color: '#000',
                                    fontWeight: 'bold',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                                    outline: 'none'
                                }} onClick={this.closeActiveSkillPopup}>
                                    Close
                                </button>
                            </div>
                        </div>
                    );
                })()}

                {this.state.showLevelUpScreen && this.state.levelUpQueue.length > 0 && (
                    <LevelUpScreen
                        queue={this.state.levelUpQueue}
                        crewManager={this.props.crewManager}
                        inventoryManager={this.props.inventoryManager}
                        skillsMatrix={skillsMatrix}
                        onComplete={this.handleLevelUpComplete}
                        onSave={() => { try { this.props.saveUserData && this.props.saveUserData(); } catch (e) { } }}
                    />
                )}
            </div>
        );
    }
}

export default MonsterBattle;