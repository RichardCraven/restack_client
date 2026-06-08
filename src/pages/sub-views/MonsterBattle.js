// Force sync battleData from combatManager (including VCT positions)
import React from 'react'
// Show/hide tile coordinates overlay
import '../../styles/monster-battle.scss'
import * as images from '../../utils/images'
import { CModal } from '@coreui/react';
import '../../styles/inventory-modal.scss';
import { Redirect } from "react-router-dom";
import {storeMeta, getMeta, getUserId} from '../../utils/session-handler';
import {
        updateUserRequest,
        deleteDungeonRequest
    } from '../../utils/api-handler';
import Canvas from '../../components/Canvas/canvas'
// import Overlay from '../../components/Overlay'
// import CanvasMagicMissile from '../../components/Canvas/canvas_magic_missile'
import CombatGrid from '../../components/combat-panes/CombatGrid'
import { AnimationManagerRedux } from '../../utils/animation-manager-redux';

import { INTERVALS, INTERVAL_DISPLAY_NAMES } from '../../utils/shared-constants';

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
    constructor(props){
        super(props)
        // mount flag to avoid setState on unmounted component warnings
        this._isMounted = false;
        this.state = {
            message: '',
            combatStarted : false,
            source: null,
            indicatorsMatrix: {},
            attackType: '',
            target: null,
            battleData: {},
            animationData: {tiles: []},
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
        this._setTimeout = (fn, t) => { const id = setTimeout(fn, t); try { this._timers.push(id); } catch(e){}; return id };
        this._setInterval = (fn, t) => { const id = setInterval(fn, t); try { this._intervals.push(id); } catch(e){}; return id };
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

    componentDidMount(){
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
    for(let i = 0; i < MAX_ROWS*NUM_COLUMNS; i++){
            let x = i%NUM_COLUMNS,
            y = Math.floor(i/NUM_COLUMNS)
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
        } catch (e) {}
        try {
            if (this.props.combatManager && typeof this.props.combatManager.establishUseConsumableCallback === 'function') {
                this.props.combatManager.establishUseConsumableCallback((item) => {
                    try { if (this.props.useConsumableFromInventory) this.props.useConsumableFromInventory(item); } catch (e) { console.warn('useConsumableCallback failed', e); }
                });
            }
        } catch (e) {}
        try {
            if (this.props.combatManager && typeof this.props.combatManager.establishStolenItemCallback === 'function') {
                this._stolenItems = [];
                this.props.combatManager.establishStolenItemCallback((itemKey, itemName, itemIconKey = null) => {
                    try { if (this.props.inventoryManager) this.props.inventoryManager.removeItemByKey(itemKey); } catch (e) {}
                    this._stolenItems = this._stolenItems || [];
                    this._stolenItems.push({ itemName, itemIconKey });
                });
            }
        } catch (e) {}
        
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

        this.props.animationManager.initialize(NUM_COLUMNS, MAX_ROWS);

        this.setState({
            combatTiles: arr, ghostPortraitMatrix,
            monsterPortrait: this.props.monster.portrait
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
        arrowUp.onload = function(){
            that.setState({
                arrowUpImage: arrowUp
            })
        }
        // key handling moved to parent DungeonPage
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
                                try { this.forceUpdate(); } catch(e){}
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
        try { this._isMounted = false; } catch(e){}
        // Detach callbacks first so in-flight manager timers cannot call setState.
        try {
            if (this.props && this.props.combatManager) {
                const noop = () => {};
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
        } catch(e){}
        // Best-effort: disconnect combat manager callbacks so no further calls come in
        try { if (this.props && this.props.combatManager && typeof this.props.combatManager.shutdown === 'function') this.props.combatManager.shutdown(); } catch(e){}
        try { if (this.props && this.props.combatManager && typeof this.props.combatManager.disconnectOverlayManager === 'function') this.props.combatManager.disconnectOverlayManager(); } catch(e){}
        // Flush all canvas and tile animations immediately so in-flight missiles,
        // fireballs etc. can't appear at the start of the next combat session.
        try { if (this.props && this.props.animationManager && typeof this.props.animationManager.reset === 'function') this.props.animationManager.reset(); } catch(e){}
        // Clear any timers/intervals this component created
        try { if (Array.isArray(this._timers)) { this._timers.forEach(t => clearTimeout(t)); this._timers = []; } } catch(e){}
        try { if (Array.isArray(this._intervals)) { this._intervals.forEach(i => clearInterval(i)); this._intervals = []; } } catch(e){}
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
        if(!this.monster()) return false
        return this.monster()?.coordinates.x < this.targetOf(this.monster())?.coordinates.x
    }
    minionDirectionReversed = (minionReference) => {
        const minion = this.state.battleData[minionReference.id]
        if(!minion || !minion.targetId) return false
        return minion?.coordinates?.x < this.targetOf(minion)?.coordinates.x
    }
    getHitAnimation = (combatant) => {
        if(!combatant || !combatant.wounded) return '';
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
            this._setTimeout(()=>{
                resolve(numMilliseconds, ' complete')
            }, numMilliseconds)
        })
    }
    morphPortrait = () => {
        let stringBase = 'witch_p1_', count = 1, string;
        const morphInterval = this._setInterval(()=>{
            string = stringBase+count;
            this.setState({
                monsterPortrait: images[string]
            })
            count++
            if(count > 8) clearInterval(morphInterval)
        }, 300)
    }
    greetingComplete = () => {
        this.combatBegins()
        this.setState({greetingInProcess: false})
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
        if(!this.state.selectedFighter) return
        this.props.combatManager.manualRetarget(this.state.selectedFighter)
    }
    selectSpecial = () => {
        let selectedFighter = this.state.selectedFighter;
        let specials = selectedFighter?.specials;
        let consumableSpecials = selectedFighter?.specialActions;
        let currentSpecialIndex = specials.findIndex(a=> a.selected)
        specials.forEach(a=>a.selected = false)
        if(consumableSpecials.length){
            consumableSpecials.forEach(a=>a.selected = false) 
        }



        if(currentSpecialIndex >= 0){
            
            if(specials[currentSpecialIndex + 1]){
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
        
        let currentSpecialIndex = consumableSpecials.findIndex(a=> a.selected);
        consumableSpecials.forEach(a=>a.selected = false)
        if(specials) specials.forEach(a=>a.selected = false)
            // currentSpecialIndex available for diagnostics
        // console.log('consumableSpecials: ', consumableSpecials, 'currentindex: ', currentSpecialIndex);
        if(currentSpecialIndex >= 0){
            if(consumableSpecials[currentSpecialIndex + 1]){
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
        if(this.state.showCrosshair){
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
        return this.props.crew.find(e=>e.isLeader)
    }

    setMessage = (messageData) => {
        const {message, source} = messageData;
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
        Object.values(animationsMatrix).forEach(e=>{
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

        // Mummy diagnostics
        const mummyBefore = Object.values(battleData || {}).find(c => c && (c.id === 'mummy' || c.type === 'mummy' || c.key === 'mummy' || String(c.id).includes('mummy')));
        const clonedBattleData = JSON.parse(JSON.stringify(battleData));
        const mummyAfter = Object.values(clonedBattleData || {}).find(c => c && (c.id === 'mummy' || c.type === 'mummy' || c.key === 'mummy' || String(c.id).includes('mummy')));
        
        if (mummyBefore || mummyAfter) {
            console.log('[MUMMY-DIAG][MonsterBattle] updateBattleData clone comparison:', {
                beforeExists: !!mummyBefore,
                afterExists: !!mummyAfter,
                beforeHP: mummyBefore?.hp,
                afterHP: mummyAfter?.hp,
                beforeDebuffs: mummyBefore?.activeDebuffs?.map(d => ({ name: d.name, rounds: d.roundsLeft })),
                afterDebuffs: mummyAfter?.activeDebuffs?.map(d => ({ name: d.name, rounds: d.roundsLeft })),
                beforePoison: mummyBefore?.poison,
                afterPoison: mummyAfter?.poison,
                beforeFrozen: mummyBefore?.frozen,
                afterFrozen: mummyAfter?.frozen,
                beforeEnsnared: mummyBefore?.ensnared,
                afterEnsnared: mummyAfter?.ensnared,
                beforeMarked: mummyBefore?.marked,
                afterMarked: mummyAfter?.marked,
                beforeStunned: mummyBefore?.stunned,
                afterStunned: mummyAfter?.stunned,
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
        const nextSelectedFighter = selectedFighterId
            ? clonedBattleData[selectedFighterId] || null
            : null;

        const selectedMonsterId = this.state.selectedMonster?.id;
        const nextSelectedMonster = selectedMonsterId
            ? clonedBattleData[selectedMonsterId] || null
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
                        try { this.props.onFighterUpdate(battleData[fighter.id]); } catch(e){}
                    }
                } catch(e){}
                const meta = getMeta();
                if (meta && Array.isArray(meta.crew)) {
                    const idx = meta.crew.findIndex(c => c && c.id === fighter.id);
                    if (idx !== -1) {
                        // copy the specialActions from the updated fighter into meta
                        meta.crew[idx].specialActions = JSON.parse(JSON.stringify(battleData[fighter.id].specialActions || []));
                        storeMeta(meta);
                        // fire-and-forget server update to persist the change
                        try { updateUserRequest(getUserId(), meta).catch(()=>{}); } catch(e){}
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
                            (cm.specialsMatrix && (cm.specialsMatrix['magic_missile'] || cm.specialsMatrix['major_magic_missile'])) ||
                            (cm.attacksMatrix  && (cm.attacksMatrix['magic_missile']  || cm.attacksMatrix['major_magic_missile']))
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
        this.props.battleOver(this.state.battleResult)
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

        executeTeardown();

        let experienceGained,
            goldGained,
            foodGained = 0,
            itemsGained,
            crewWins = outcome === 'crewWins' || outcome === true,
            summaryMessage, battleResult;

        // liveCrew should be derived from the freshest snapshot
        let liveCrew = Object.values(latestBattleData).filter(e=>!e.dead && !e.isMinion && !e.isMonster);
        if(crewWins){
            battleResult = 'win';
            summaryMessage = 'The enemy is no more!';
            if(this.props.monster.drops){
                itemsGained = [];
                this.props.monster.drops.forEach(e=>{
                    let d = Math.random();
                    if(d < e.percentChance*.01){
                        if(e.itemPool && Array.isArray(e.itemPool) && e.itemPool.length > 0){
                            // Supports both flat pools and nested pools like [WEAPONS, ARMOR, MAGICAL]
                            const pickFromPool = (pool) => {
                                if(!Array.isArray(pool) || pool.length === 0) return null;
                                const idx = Math.floor(Math.random() * pool.length);
                                const picked = pool[idx];
                                return Array.isArray(picked) ? pickFromPool(picked) : picked;
                            };
                            const itemFromPool = pickFromPool(e.itemPool);
                            if(itemFromPool) itemsGained.push(itemFromPool);
                        } else if(e.item){
                            itemsGained.push(e.item);
                        }
                    }
                })
                this.props.inventoryManager.addItemsByName(itemsGained)
            }
            experienceGained = this.props.monster.level * 10;
            goldGained = Math.floor(Math.random() * experienceGained);
            // Defensive: log inventory/gold state before adding to help trace duplicate updates
            try { /* inventory snapshot suppressed */ } catch(e){}
            // Food reward: 40% chance 5-15, 20% chance 20-30, 5% chance 40-60
            try {
                const foodRoll = Math.random();
                let foodRolled = 0;
                if (foodRoll < 0.05) {
                    foodRolled = Math.floor(Math.random() * 21) + 40; // 40-60
                } else if (foodRoll < 0.25) {
                    foodRolled = Math.floor(Math.random() * 11) + 20; // 20-30
                } else if (foodRoll < 0.65) {
                    foodRolled = Math.floor(Math.random() * 11) + 5;  // 5-15
                }
                if (foodRolled > 0) {
                    foodGained = foodRolled;
                    const metaFood = getMeta() || {};
                    metaFood.food = (typeof metaFood.food === 'number' ? metaFood.food : 55) + foodGained;
                    try { storeMeta(metaFood); } catch(e) {}
                    console.log(`[Combat] food reward: +${foodGained} (total: ${metaFood.food})`);
                }
            } catch(e) { console.warn('food reward failed', e); }
            // Ensure we only award gold once per battle
                    if (!this._goldAwarded) {
                try {
                    this.props.inventoryManager.addCurrency({type: 'gold', amount: goldGained})
                    this._goldAwarded = true;
                } catch (err) {
                    console.warn('gameOver: addCurrency failed', err);
                }
            } else {
                // gold already awarded, skipping
            }
            this._setTimeout(()=>{
                // Snapshot levels before awarding XP so we can show before→after
                const levelsBefore = {};
                try {
                    (this.props.crewManager.crew || []).forEach(c => {
                        if (c && c.id) levelsBefore[c.id] = typeof c.level === 'number' ? c.level : 0;
                    });
                } catch(e) {}
                // Use latest liveCrew snapshot when awarding experience
                try { this.props.crewManager.addExperience(liveCrew, experienceGained); } catch(e) { console.warn('addExperience failed', e); }
                // Build level transitions map for display
                const levelTransitions = {};
                try {
                    (this.props.crewManager.crew || []).forEach(c => {
                        if (!c || !c.id) return;
                        const before = levelsBefore[c.id];
                        const after = typeof c.level === 'number' ? c.level : 0;
                        if (typeof before === 'number' && after > before) {
                            levelTransitions[c.id] = { from: before, to: after };
                        }
                    });
                } catch(e) {}
                let meta = getMeta();
                meta.crew = this.props.crewManager.crew;
                storeMeta(meta)
                updateUserRequest();
                this.setState({ levelTransitions });
                this.forceUpdate();
            },1000)

            
        } else {
            battleResult = 'loss'
            summaryMessage = 'Death has come for you and yours.'
            // Implement group-death handling: track group deaths in meta.deathTracker.
            // On non-final deaths: increment counter, restore crew HP to 1, respawn at dungeon spawn,
            // and show the summary panel (do NOT navigate to the death scene).
            // On the third full-group death: clear dungeon and crew, persist, then run the final death sequence.
            try {
                const meta = getMeta();
                let deaths = meta.deathTracker || 0;
                deaths = deaths + 1;
                meta.deathTracker = deaths;
                try { storeMeta(meta); } catch(e) {}
                try { updateUserRequest(getUserId(), meta).catch(()=>{}); } catch(e) {}
                    // Notify parent (DungeonPage) so UI elements like death-tracker can refresh
                    try { if (this.props && typeof this.props.onDeathTrackerChanged === 'function') this.props.onDeathTrackerChanged(deaths); } catch(e) {}
                // deaths count incremented
                if (deaths >= 3) {
                    // ── FINAL DEATH ──────────────────────────────────────────────────
                    // Show "this is the end" summary for 3 seconds, then wipe the
                    // player's dungeon profile and launch the death sequence.

                    // Wipe dungeon profile immediately so it's clean before the
                    // narrative plays (profile reset is invisible behind the summary).
                    try {
                        if (meta.dungeonId) {
                            try { deleteDungeonRequest(meta.dungeonId).catch(()=>{}); } catch(e) {}
                        }
                    } catch (inner) {}
                    try { this.props.boardManager.dungeon.id = null; } catch(e) {}
                    try { this.props.inventoryManager.inventory = []; } catch(e) {}
                    meta.dungeonId = null;
                    meta.location = null;
                    meta.inventory = { items: [], gold: 0, shimmering_dust: 0, totems: 0 };
                    meta.crew = [];
                    meta.deathTracker = 0;
                    try { storeMeta(meta); } catch(e) {}
                    try { updateUserRequest(getUserId(), meta).catch(()=>{}); } catch(e) {}
                    try { this.props.crewManager.initializeCrew([]); } catch(e) {}

                    // Show the final-death summary (no OK button) then auto-launch
                    this._suppressPersistFinalHP = true;
                    try {
                        if (this._isMounted) this.setState({
                            showSummaryPanel: true,
                            suppressSummaryPortraits: true,
                            isFinalDeath: true,
                            summaryMessage: 'This is the end.',
                            battleResult: 'loss',
                        });
                    } catch(e) {}

                    this._setTimeout(() => {
                        this._suppressPersistFinalHP = false;
                        this.launchDeathSequence();
                    }, 3000);

                } else {
                    // We will show the battle summary (without portraits), wait 3s, then launch
                    // the death narrative and perform the respawn & restore so the narrative
                    // plays before the crew are moved/cleared in the UI.
                    try {
                        // persist the incremented death tracker now
                        try { storeMeta(meta); } catch(e) {}
                        try { updateUserRequest(getUserId(), meta).catch(()=>{}); } catch(e) {}
                    } catch (inner) {}

                    // Suppress the later "persist final HP" block so it does not overwrite our planned restore
                    this._suppressPersistFinalHP = true;

                    // Set a state flag so the summary-panel rendering hides portraits
                    try { if (this._isMounted) this.setState({ suppressSummaryPortraits: true }); } catch(e) {}

                    // After a short delay, close summary, restore crew and respawn (do NOT navigate to death scene for non-final deaths)
                    this._setTimeout(async () => {
                        try { if (this._isMounted) this.setState({ showSummaryPanel: false, suppressSummaryPortraits: false }); } catch(e) {}

                    this.props.battleOver('respawn');
                          

                        // allow later persistence block to run normally again
                        this._suppressPersistFinalHP = false;
                    }, 3000);
                    // Show the summary panel now (it will be visible until the timeout closes it)
                    try { if (this._isMounted) this.setState({ showSummaryPanel: true }); } catch(e) {}
                }
            } catch (err) {
                console.warn('group-death handler failed, falling back to death scene', err);
                this.launchDeathSequence();
            }
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
                            try { if (this.props && typeof this.props.onFighterUpdate === 'function') this.props.onFighterUpdate(entry); } catch(e) {}
                        } catch (inner) {}
                    });
                    if (modified) {
                        try { storeMeta(meta); } catch (e) {}
                        try { updateUserRequest(getUserId(), meta).catch(()=>{}); } catch(e) {}
                        try { if (this.props.saveUserData) this.props.saveUserData(); } catch(e) {}
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
        } catch (e) {}

        this.setState({
            showSummaryPanel: true,
            goldGained,
            foodGained,
            experienceGained,
            itemsGained,
            stolenItems: this._stolenItems && this._stolenItems.length ? [...this._stolenItems] : [],
            summaryMessage,
            battleResult,
            suppressSummaryPortraits: !!this._suppressPersistFinalHP,
            isFinalDeath: false,
        })
    }
    launchDeathSequence = () => {
            this.props.setNarrativeSequence('death')
            this.setState({
                navToDeathScene: true
            })
    }
    establishAnimationCallback = () => {
        this.props.animationManager.establishAnimationCallback(this.renderAnimation)
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
        this.props.animationManager.establishUpdateAnimationDataCallback(this.updateAnimationData)
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
        if(id === 'all enemies dead'){
            this.setState({
                selectedFighter: null
            })
            return
        }
        if(id === 'all fighters dead'){
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
                        try { storeMeta(meta); } catch (e) {}
                        try { updateUserRequest(getUserId(), meta).catch(()=>{}); } catch(e) {}
                        try { if (this.props.saveUserData) this.props.saveUserData(); } catch(e) {}
                    }
                }
            } catch (inner) {
                console.warn('handleFighterDeath: failed to persist meta', inner);
            }
            // notify parent immediately so UI updates
            try { if (this.props && typeof this.props.onFighterUpdate === 'function') this.props.onFighterUpdate(entry); } catch(e) {}
        } catch (err) {
            console.warn('handleFighterDeath persistence failed', err);
        }
        if(this.state.selectedFighter && this.state.selectedFighter.id === id){
            const liveFighters = this.props.combatManager.getLiveFighters();
            if(liveFighters.length){
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
        if(!source) return 0;
        let targetId = this.state.battleData[id].targetId,
        target = this.state.battleData[targetId],
        returnVal = 50;
        if(!target) return 0;
        if(target.isMonster){
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

            selectedCombatant.pendingAttack = resolvedAttack;
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
        if(val !== null && typeof val === 'string'){
            val = val.replaceAll('_', ' ')
        }
        try {
            if (this.state.selectedFighter && this.props.combatManager && typeof this.props.combatManager.setSelectedFighter === 'function') {
                this.props.combatManager.setSelectedFighter(this.state.selectedFighter);
            }
        } catch (err) {}
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
        if(!this.state.selectedFighter) return
    // manual fire invoked

        let selectedFighter = this.state.selectedFighter;
        let specials = selectedFighter?.specials,
        consumableSpecials = selectedFighter?.specialActions,
        selectedSpecial = specials.find(a=> a.selected),
        selectedConsumableSpecial = consumableSpecials.find(a=> a.selected);

        if(selectedSpecial){
            const requiredEnergy = Number(selectedSpecial.energy_cost) || 0;
            if((this.state.selectedFighter.energy || 0) < requiredEnergy){
                // not enough energy
                return
            }
            // (Teleport effect will now be triggered only on actual teleport, not on special selection)
            this.props.combatManager.fighterSpecialAttack(selectedSpecial)
            specials.forEach(e=>e.selected=false)
        } else if (selectedConsumableSpecial){
            if(selectedConsumableSpecial.type === 'spell'){
                this.fireSpell(selectedConsumableSpecial)
            }
            consumableSpecials.forEach(a=>a.selected=false)
        } else {
            // manual attack: ensure the authoritative combatant has a pendingAttack selected
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
                            if (resolvedSelectedAttack) cmF.pendingAttack = resolvedSelectedAttack;
                        }

                        // If no pending attack is set, choose one using the combat manager helper
                        if (!cmF.pendingAttack) {
                            const target = (cmF.targetId) ? this.props.combatManager.getCombatant(cmF.targetId) : null;
                            try {
                                if (typeof this.props.combatManager.chooseAttackType === 'function') {
                                    this.props.combatManager.chooseAttackType(cmF, target);
                                } else if (Array.isArray(cmF.attacks) && cmF.attacks.length) {
                                    cmF.pendingAttack = cmF.attacks.find(a => a.cooldown_position === 100) || cmF.attacks[0];
                                }
                            } catch (e) {
                                // defensive fallback
                                if (Array.isArray(cmF.attacks) && cmF.attacks.length) {
                                    cmF.pendingAttack = cmF.attacks.find(a => a.cooldown_position === 100) || cmF.attacks[0];
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn('manualFire: failed to ensure pendingAttack', err);
            }
            // invoke the combat manager's manual attack which calls into the fighter
            this.props.combatManager.fighterManualAttack()
        }
    }
    fireSpecial = (special) => {
        if(!this.state.selectedFighter) {
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
        selectedSpecial = specials.find(a=> a.selected),
        selectedConsumableSpecial = consumableSpecials.find(a=> a.selected);

        if (special) {
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
            specials.forEach(e=>e.selected=false)
            consumableSpecials.forEach(a=>a.selected=false)
            return;
        }

        if(selectedSpecial){
            this.props.combatManager.fighterSpecialAttack(selectedSpecial)
            specials.forEach(e=>e.selected=false)
        } else if (selectedConsumableSpecial){
            if(selectedConsumableSpecial.type === 'spell'){
                this.fireSpell(selectedConsumableSpecial)
            }
            consumableSpecials.forEach(a=>a.selected=false)
        } else {
            this.props.combatManager.fighterManualAttack()
        }
    }
    // Accept optional fighter argument for AI path
    fireGlyph = (glyph, fighterOverride = null) => {
    // glyph firing
        // Use override if provided (AI), else fall back to selectedFighter (manual)
        const selectedFighter = fighterOverride || this.state.selectedFighter;
        switch(glyph.subtype){
            case 'magic missile':
                // animation manager check
                //     magicMissile_targetLaneDiff: 0
                // })

                



                let specials = selectedFighter?.specials;
                let consumableSpecials = selectedFighter?.specialActions;
                if (consumableSpecials) consumableSpecials.forEach(a=>a.selected = false)
                if (specials) specials.forEach(a=>a.selected = false)



                let target = this.props.combatManager.getCombatant(selectedFighter.targetId)
                // target resolved
                if(!target) return
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
                } catch (e) {}
                // let targetDistance = this.props.combatManager.getDistanceToTarget(this.state.selectedFighter, target)
                // let laneDiff = this.props.combatManager.getLaneDifferenceToTarget(this.state.selectedFighter, target)

                // console.log('laneDiff: ', laneDiff);
                const travelTime = 1500
                // triggering magic missile via AI
                this.props.combatManager.fighterAI.roster['wizard'].triggerMagicMissile(selectedFighter, target, travelTime)
                const combatLog = this.props.combatManager && typeof this.props.combatManager.getCombatLog === 'function'
                    ? this.props.combatManager.getCombatLog()
                    : [];
                this.setState({ combatLog });
                // this.props.combatManager.lockFighter(this.state.selectedFighter.id)


                // this.props.animationManager.magicCircle(selectedFighter.coordinates, target.coordinates)
                // setTimeout(()=>{
                //     this.props.animationManager.magicTriangle(selectedFighter.coordinates, target.coordinates)
                // }, 500)


                
                
                
                // setTimeout(()=>{
                //     this.setState({
                //         magicMissile_fire: false,
                //         magicMissile_connectParticles: true
                //     })
                //     if(this.state.selectedFighter) this.props.combatManager.unlockFighter(this.state.selectedFighter.id)
                // }, 2500)
                // ^ travel time + 1 second of damage animation
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
        this.setState({portraitHoveredId: id})
    }
    getManualMovementArc = (fighter) => {
        if(!fighter) return 0
        // console.log('fighter: ', fighter);
        // console.log('manual moves for ', fighter.name, 'is ', fighter.manualMovesCurrent / fighter.manualMovesTotal * 3.6);
        const percentage = (fighter.manualMovesCurrent / fighter.manualMovesTotal) * 100;
        const arc = percentage * 3.6
        return  arc
    }
    getManualMovementArcColor = (fighter) => {
        if(!fighter) return 'black'
        if(fighter.manualMovesCurrent<1) return '#818d6e'
        return 'greenyellow'
    }
    monsterCombatPortraitClicked = (id) => {
        // console.log('battle data: ', this.state.battleData);
        // console.log('images[this.state.battleData[e]?.portrait]', this.state.battleData[id].targettedBy);
        // let targettedBy = this.state.battleData[id].targettedBy;
        // console.log('should be Sadronis: ', this.state.battleData[targettedBy]);\
        
        const selectedMonster = this.state.battleData[id];
    // monster selected
        if(this.state.showCrosshair){
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
        if(this.state.showCrosshair){
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
        if(tile === null){
            this.setState({
                draggedOverCombatTileId: null
            })
            return
        }
        switch(tile.instruction.type){
            case 'move':
                let correspondingTile = this.state.combatTiles.find(e=> e.x === tile.instruction.destinationCoordinates.x && e.y === tile.instruction.destinationCoordinates.y)
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
        const tile = this.state.combatTiles.find(t=> t.x === coordinates.x && t.y === coordinates.y)
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
        if(tileIndex === this.state.draggedOverCombatTileId) return
        this.setState({
            draggedOverCombatTileId: tileIndex
        })
    }
    onDrop = (tileIndex) => {
        const selectedFighter = this.state.battleData[this.state.draggingFighter.id];
        const tile = this.state.combatTiles[tileIndex]
        this.props.combatManager.setFighterDestination(selectedFighter.id, {x: tile.x, y: tile.y});
        let arr = this.state.ghostPortraitMatrix;
        arr[tileIndex] = selectedFighter.portrait;
        this.setState({
            draggedOverCombatTileId: null,
            draggingFighter: null,
            ghostPortraitMatrix: arr
        })
        
    }
    getMonsterWeaponAnimation = (monster) => {
        if(!monster.attacking) return ''
        switch(monster.pendingAttack.name){
            case 'magic missile':
                // return 'spinning'
                return 'spin-left'
            case 'void lance':
                return 'swinging-left'
            default:
            break;
        }
        if(monster.pendingAttack.name === 'magic missile'){
            // unexpected path reached
            debugger
        }
        switch(monster.pendingAttack.range){
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
            size = 20 + Math.sin(frameCount * 0.04)**2 * 5;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.drawImage(that.state.arrowUpImage, 5, 5, size, size);
    }

    render(){
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
                <div style={{position: 'absolute', top: -35, left: 20, color: 'white', fontSize: '18px', zIndex: 1000}}>
                    {this.props.monster && this.props.monster.name ? `Fighting: ${this.props.monster.name}` : 'Fighting: Unknown'}
                </div>
                {/* Game speed / Round clock readout in upper right */}
                <div style={{position: 'absolute', top: -45, right: 20, display: 'flex', alignItems: 'center', gap: '15px', color: 'white', fontSize: '14px', zIndex: 1000}}>
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
                { this.state.navToDeathScene && <Redirect to='/death'/>}
                <div className="combat-grid-container"
                    style={{
                        position: 'relative',
                        width: TILE_SIZE * NUM_COLUMNS + (SHOW_TILE_BORDERS ? NUM_COLUMNS * 2 : 0) + 'px',
                        height: TILE_SIZE * MAX_ROWS + (SHOW_TILE_BORDERS ? MAX_ROWS * 2 : 0) + 'px',
                        background: '#161618',
                        borderRadius: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                        overflow: 'visible'
                    }}>
                    {this.state.showSummaryPanel && 
                    <div className='summary-panel'>
                        <div className="content-container">
                            <div className="summary-message-container">
                                {this.state.summaryMessage}
                            </div>
                            {this.state.itemsGained && this.state.itemsGained.length > 0 &&
                                this.state.itemsGained.map((itemKey, idx) => {
                                    const itemDef = this.props.inventoryManager.allItems[itemKey];
                                    const iconSrc = itemDef?.icon ? images[itemDef.icon] : null;
                                    const displayName = itemDef?.name || itemKey.replaceAll('_', ' ');
                                    return (
                                        <div key={idx} className="experience-container">
                                            {iconSrc && <img className="summary-icon" src={iconSrc} alt="" />}
                                            You found a {displayName}
                                        </div>
                                    );
                                })
                            }
                            {this.state.goldGained > 0 && 
                            <div className="experience-container">
                                <img className="summary-icon" src={images.gold} alt="" />
                                You found {this.state.goldGained} gold
                            </div>
                            }
                            {this.state.stolenItems && this.state.stolenItems.length > 0 &&
                                this.state.stolenItems.map((entry, idx) => {
                                    const itemName = typeof entry === 'string' ? entry : entry?.itemName;
                                    const itemIconKey = typeof entry === 'string' ? null : entry?.itemIconKey;
                                    const iconSrc = (itemIconKey && images[itemIconKey]) ? images[itemIconKey] : images.goblin_portrait;
                                    return (
                                        <div key={`stolen-${idx}`} className="experience-container stolen-item">
                                            {iconSrc && <img className="summary-icon" src={iconSrc} alt="" />}
                                            {itemName} was stolen by a goblin!
                                        </div>
                                    );
                                })
                            }
                            {this.state.foodGained > 0 &&
                            <div className="experience-container">
                                <span className="summary-icon summary-icon-emoji" role="img" aria-label="meat">🍖</span>
                                Your crew foraged {this.state.foodGained} food
                            </div>
                            }
                            {this.state.experienceGained > 0 && 
                            <div className="experience-container">
                                <img className="summary-icon" src={images.exp} alt="" />
                                Each crew member has earned {this.state.experienceGained} experience
                            </div>} 
                            { !this.state.suppressSummaryPortraits && (
                                <div className="portraits-container">
                                    {Object.values(this.state.battleData).filter(e=>!e.dead && !e.isMonster && !e.isMinion).map((crewMember, i) => {
                                        // Defensive portrait resolution with avatar fallback
                                        const portraitUrl = images[crewMember.portrait] || crewMember.portrait || images['avatar'];
                                        // authoritative crew member stored in crewManager (may contain justLeveled and recent gains)
                                        const cmMember = (this.props.crewManager && Array.isArray(this.props.crewManager.crew)) ? this.props.crewManager.crew.find(c => c && (c.id === crewMember.id || c.name === crewMember.name)) : null;
                                        const percent = this.props.crewManager.calculateExpPercentage(crewMember);
                                        const shouldShowArrow = (cmMember && cmMember.justLeveled) || percent >= 100;
                                        // aggregate recent gains into a single object for display
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
                                            <div key={i} className="single-portrait-container">
                                                <div className="portrait" style={{backgroundImage: `url(${portraitUrl})`}}></div>
                                                {shouldShowArrow && (
                                                    <Canvas 
                                                        className="level-up-canvas"
                                                        width={80}
                                                        height={80}
                                                        draw={this.draw}
                                                    />
                                                )}
                                                {gainsAgg && Object.keys(gainsAgg).length > 0 && (
                                                    <div className="level-gains">
                                                        {Object.keys(gainsAgg).map((k, idx) => (
                                                            <div key={idx} className="gain-item">{k.toUpperCase()} +{gainsAgg[k]}</div>
                                                        ))}
                                                    </div>
                                                )}
                                                {this.state.levelTransitions[crewMember.id] && (
                                                    <div className="level-transition">
                                                        Lvl {this.state.levelTransitions[crewMember.id].from} → {this.state.levelTransitions[crewMember.id].to}
                                                    </div>
                                                )}
                                                <div className="experience-bar-container">
                                                    <div className="experience-bar" style={{width: `${percent}%`}}></div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {Object.values(this.state.battleData).filter(e=>e.dead && !e.isMonster && !e.isMinion).map((crewMember, i) => {
                                        const portraitUrl = images[crewMember.portrait] || crewMember.portrait || images['avatar'];
                                        return (
                                            <div key={i} className="single-portrait-container dead-member">
                                                <div className="portrait" style={{backgroundImage: `url(${portraitUrl})`}}>
                                                    <div className="skull-image" style={{backgroundImage: `url(${images['whiteskull']})`}}></div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="button-row">
                            {!this.state.isFinalDeath && <div className="confirm-button" onClick={() => this.confirmClicked()}>OK</div>}
                        </div>
                    </div>}

                    <CModal className='inventory-modal' alignment='center' visible={this.state.showInventoryPopup} onClose={() => this.setState({ showInventoryPopup: false })}>
                        <div className='inventory-content'>
                            <div className='inventory-title'>Inventory</div>
                            <div className='crew-panels'>
                                {(this.props.crew || []).map((member, idx) => {
                                    const portraitUrl = images[member.portrait] || member.portrait;
                                    return (
                                        <div className='crew-panel' key={member.id || idx}>
                                            <div className='crew-portrait' style={{backgroundImage: `url(${portraitUrl})`}}></div>
                                            <div className='crew-body' style={{backgroundImage: `url(${images.body_male})`}}></div>
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
                            
                            // Width is 2 tiles = 200px.
                            // Anchor is at bottom-right if mx >= 4 (hOffset = -100px), else bottom-left (hOffset = 0).
                            const hOffset = (mx >= 4) ? -TILE_SIZE : 0;
                            const leftPos = mx * TILE_SIZE + hOffset;
                            const topPos = my * TILE_SIZE - TILE_SIZE; // Top row of the 2x2
                            
                            // Center X of the 2x2 monster is leftPos + 100px.
                            // We place a speech bubble styled container pointing to this center.
                            const bubbleCenterX = leftPos + TILE_SIZE;
                            const bubbleCenterY = topPos; // Directly above the top row
                            
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
                                    onDragOver={(event)=>this.onDragOver(event, i)}
                                    onDrop={()=>{this.onDrop(i)}}
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
                { SHOW_INTERACTION_PANE && <div className={`mb-interaction-pane ${!this.state.greetingInProcess ? 'visible' : ''} `}>
                    <div className="header-row">
                        <div className="portrait" style={{backgroundImage: `url(${selectedPortraitUrl})`}}>
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
                                            const liveUnit = this.props.combatManager.getCombatant?.(liveSelectedFighter.id);
                                            const statuses = [];
                                            if (liveUnit?.frozen || liveSelectedFighter.frozen) statuses.push({ label: 'Frozen', color: '#7dd5f5' });
                                            if (liveUnit?.stunned || liveSelectedFighter.stunned) statuses.push({ label: 'Stunned', color: '#f5c842' });
                                            if (liveUnit?.bleed || liveSelectedFighter.bleed) statuses.push({ label: 'Bleeding', color: '#e05555' });
                                            if (liveUnit?.astralBeingActive) statuses.push({ label: 'Astral Being', color: '#21e6c1' });
                                            if (liveUnit?.thirdEyeActive) statuses.push({ label: 'Third Eye', color: '#21e6c1' });
                                            if (liveUnit?.shieldWallActive) statuses.push({ label: 'Shield Wall', color: '#90c4ff' });
                                            if (liveUnit?.berserkerActive || liveSelectedFighter.berserkerActive) statuses.push({ label: 'Berserk', color: '#ff4444' });
                                            if (liveUnit?.riftPortalActive) statuses.push({ label: 'Rift Open', color: '#cc44ff' });
                                            // Active buffs from _applyBuff
                                            if (Array.isArray(liveUnit?.activeBuffs)) {
                                                liveUnit.activeBuffs.forEach(b => {
                                                    if (b && b.label && !statuses.find(s => s.label === b.label)) {
                                                        statuses.push({ label: `${b.label} (${b.roundsLeft}r)`, color: '#7affa0' });
                                                    }
                                                });
                                            }
                                            if (Array.isArray(liveUnit?.activeDebuffs)) {
                                                liveUnit.activeDebuffs.forEach(d => {
                                                    if (d) {
                                                        const label = d.label || (d.name === 'Hexed' ? 'Hexed' : d.name === 'Polymorphed' ? 'Polymorphed' : d.name);
                                                        if (label && !statuses.find(s => s.label === label)) {
                                                            statuses.push({ label, color: '#ff8844' });
                                                        }
                                                    }
                                                });
                                            }
                                            if ((liveUnit?.hexed || liveSelectedFighter.hexed) && !statuses.find(s => s.label === 'Hexed')) {
                                                statuses.push({ label: 'Hexed', color: '#cc44ff' });
                                            }
                                            if ((liveUnit?.polymorphed || liveSelectedFighter.polymorphed) && !statuses.find(s => s.label === 'Polymorphed')) {
                                                statuses.push({ label: 'Polymorphed', color: '#22c55e' });
                                            }
                                            if (!statuses.length) return null;
                                            return (
                                                <div className="redux-status-badges">
                                                    {statuses.map((s, i) => (
                                                        <span key={i} className="redux-status-badge" style={{ borderColor: s.color, color: s.color }}>{s.label}</span>
                                                    ))}
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
                                            ...((liveSelectedFighter.isMonster || liveSelectedFighter.isMinion) ? (liveSelectedFighter.attacks || []) : [])
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
                                            const cooldownPct = remainingRounds > 0 ? Math.ceil((remainingRounds / baseCd) * 100) : 0;
                                            const isReady = cooldownPct === 0;
                                            return (
                                                <div key={i} className="interaction-tile-wrapper">
                                                    <div
                                                        className={`interaction-tile special ${isReady ? 'available' : ''}`}
                                                        style={{
                                                            backgroundImage: iconUrl ? `url("${encodeURI(String(iconUrl).replace(/^['"]|['"]$/g, ''))}")` : 'none',
                                                            cursor: (liveSelectedFighter.isMonster || liveSelectedFighter.isMinion) ? 'default' : 'pointer',
                                                            opacity: isReady ? 1 : 0.7,
                                                        }}
                                                        title={spec.name || sourceKey}
                                                        onClick={() => {
                                                            if (liveSelectedFighter.isMonster || liveSelectedFighter.isMinion) return;
                                                            this.specialTileClicked(spec);
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
                                                        <div className="redux-cd-badge">{Math.ceil(remainingRounds)}</div>
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
                                            if (!this.state.logFilterSelectedFighter || !this.state.selectedFighter) return true;
                                            const fName = String(this.state.selectedFighter.name || '').toLowerCase();
                                            const fType = String(this.state.selectedFighter.type || '').toLowerCase();
                                            const msg = String(entry.message || '').toLowerCase();
                                            return msg.includes(fName) || msg.includes(fType);
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
                            <div className="interaction-tooltip" style={{fontSize: this.state.hoveredInventoryTile?.length > 8 ? '10px': 'inherit'}}>{this.state.hoveredInventoryTile}</div>
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
                                            <div key={name} className='interaction-tile-wrapper' style={{position: 'relative'}}>
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
                                                    <div className="interaction-tile-overlay" style={{width: `${cooldownPct}%`, transition: cooldownPct === 0 ? '0s' : '0.2s'}}></div>
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
                                    const rawSpecials = this.state.selectedFighter?.specials || [];
                                    const seenSpecials = new Set();
                                    const uniqueSpecials = rawSpecials.filter((entry) => {
                                        const rawKey = typeof entry === 'string' ? entry : (entry?.key || entry?.name || '');
                                        const normalizedKey = String(rawKey || '').trim().toLowerCase().replaceAll(' ', '_');
                                        if (!normalizedKey) return false;
                                        if (seenSpecials.has(normalizedKey)) return false;
                                        seenSpecials.add(normalizedKey);
                                        return true;
                                    });

                                    return uniqueSpecials.map((a, i)=>{
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
                                    if (this.props.combatManager && this.props.combatManager.round !== undefined) {
                                        const remainingSec = liveSelectedFighter?.cooldowns?.[normalizedSpecial.id] || liveSelectedFighter?.cooldowns?.[normalizedSpecial.key] || liveSelectedFighter?.cooldowns?.[sourceKey] || 0;
                                        if (remainingSec > 0) {
                                            const baseCooldown = normalizedSpecial.cooldown || 5;
                                            specialCooldownRemaining = Math.ceil((remainingSec / baseCooldown) * 100);
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
                                                style={{backgroundImage: specialBackgroundImage, cursor: 'pointer'}} 
                                                className={`interaction-tile special ${specialCooldownRemaining === 0 ? 'available' : ''} ${normalizedSpecial.selected ? 'selected' : ''}`}
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
                                                {showSpecialEnergyRing && specialCooldownRemaining === 0 && (
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
                        <div className="spells-col" style={{width: this.state.glyphTrayExpanded ? '100px' : '0px'}}>
                            <div className="interaction-header">Spells</div>
                            <div className="interaction-tooltip">{this.state.hoveredSpellTile}</div>
                            <div className="interaction-tile-container">
                                {(() => {
                                    // Group spells by type
                                    const spells = this.state.selectedFighter?.specialActions?.filter(a => a.type === 'spell') || [];
                                    if (!spells.length) return null;
                                    const grouped = {};
                                    spells.forEach(spellUnit => {
                                        if (!spellUnit) return;
                                        const spellType = spellUnit.subtype;
                                        if (!grouped[spellType]) grouped[spellType] = [];
                                        grouped[spellType].push(spellUnit);
                                    });
                                    const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V'];
                                    return Object.keys(grouped).map((type, idx) => {
                                        const group = grouped[type];
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
                                            <div key={type} className='interaction-tile-wrapper' style={{position: 'relative'}}>
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
                                                {(() => {
                                                    const spellEnergyCost = Number(spellUnit.energy_cost || spellUnit.energyCost) || 0;
                                                    const spellEnergyFillPct = spellEnergyCost > 0
                                                        ? Math.min(100, Math.floor(((this.state.selectedFighter?.energy || 0) / spellEnergyCost) * 100))
                                                        : 100;
                                                    return spellEnergyCost > 0 && spellEnergyFillPct < 100
                                                        ? <div className="interaction-tile-overlay energy-fill" style={{ '--energy-fill': spellEnergyFillPct }}></div>
                                                        : null;
                                                })()}
                                            </div>
                                        );
                                    });
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


                                                cooldownRemaining = Math.ceil((remainingSec / baseCooldown) * 100);


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
                                {this.state.selectedFighter && this.state.selectedFighter.name !== 'Loryastes' && Object.values(this.state.battleData).filter(e => (e.isMonster || e.isMinion) && !e.dead && !e.invisible && !e.isVCT).map((a)=>{
                                    return <div key={a.id} className='interaction-tile-wrapper'>
                                                <div 
                                                    style={{backgroundImage: "url(" + a.portrait + ")", cursor: this.state.showCrosshair ? 'crosshair' : ''}} 
                                                    className={`interaction-tile target ${activeTargetId === a.id ? 'active-target' : ''} ${this.state.portraitHoveredId === a.id ? 'hover-linked-target' : ''}`} 
                                                    onClick={() => this.targetTileClicked(a)} 
                                                    onMouseEnter={() => this.targetTileHovered(a)} 
                                                    onMouseLeave={() => this.targetTileHovered(null)}>
                                                </div>
                                            </div>
                                })}

                                {this.state.selectedFighter && this.state.selectedFighter.name === 'Loryastes' && Object.values(this.state.battleData).filter(e => !e.isMonster && !e.isMinion && e.name !== 'Loryastes' && !e.dead && !e.invisible).map((a)=>{
                                return <div 
                                    key={a.id}
                                    style={{backgroundImage: "url(" + a.portrait + ")", cursor: this.state.showCrosshair ? 'crosshair' : ''}} 
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
                                        if (!this.state.logFilterSelectedFighter || !this.state.selectedFighter) return true;
                                        const fName = String(this.state.selectedFighter.name || '').toLowerCase();
                                        const fType = String(this.state.selectedFighter.type || '').toLowerCase();
                                        const msg = String(entry.message || '').toLowerCase();
                                        return msg.includes(fName) || msg.includes(fType);
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


            </div>
        );
    }
}

export default MonsterBattle;