import React from 'react'
// Show/hide tile coordinates overlay
import '../../styles/monster-battle.scss'
import * as images from '../../utils/images'
// import AnimationTile from '../../components/animation-tile';
import AnimationGrid from '../../components/animation-grid';
import { Redirect } from "react-router-dom";
import {storeMeta, getMeta, getUserId, getUserName} from '../../utils/session-handler';
import {
    updateUserRequest
  } from '../../utils/api-handler';
import Canvas from '../../components/Canvas/canvas'
import Overlay from '../../components/Overlay'
import CanvasMagicMissile from '../../components/Canvas/canvas_magic_missile'
import FightersCombatGrid from '../../components/combat-panes/fighters'
import MonstersCombatGrid from '../../components/combat-panes/monsters'

import { INTERVALS, INTERVAL_DISPLAY_NAMES } from '../../utils/shared-constants';

const MAX_DEPTH = 7;
const NUM_COLUMNS = 8;
// ^ means 8 squares, account for depth of 0 is far left

const MAX_ROWS = 5;
const TILE_SIZE = 100;
const SHOW_TILE_BORDERS = true;
const SHOW_COMBAT_BORDER_COLORS = false;
const SHOW_INTERACTION_PANE = true;
const SHOW_MONSTER_IDS = false;
const SHOW_COORDINATES = false;

const RANGES = {
    close: 1,
    medium: 3,
    far: 5
}

// Duration (ms) must match the CSS death animation/transition duration
const DEATH_ANIMATION_DURATION = 2200;


// const SHOW_BORDERS = true;
class MonsterBattle extends React.Component {
    getGameSpeed = () => {
        return this.props.combatManager?.FIGHT_INTERVAL;
    }
    componentDidMount() {
    // ...existing code...
    }

    componentWillUnmount() {
    // ...existing code...
    }

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
            this.fireGlyph(glyph, fighter);
        } else {
            // fallback: set selectedFighter for other specials
            this.setState({ selectedFighter: fighter }, () => {
                this.fireSpecial(null);
            });
        }
    }
    removeDeadCombatantAfterDelay = (id) => {
            // Only remove from combatManager (the source of truth)
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
            summaryMessage: '',
            experienceGained: null,
            goldGained: null,
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
            teleportingFighterId: null
        }
    }
    componentDidMount(){
        this.props.combatManager.initialize();
        this.props.combatManager.connectOverlayManager(this.props.overlayManager)
        this.props.combatManager.connectAnimationManager(this.props.animationManager);

        // Wire Monk teleport callback to set teleportingFighterId
        const monkAI = this.props.combatManager.fighterAI?.roster?.monk;
        if (monkAI) {
            monkAI.onTeleport = (caller) => {
                console.log('Monk teleported: ', caller.id);
                // debugger
                this.setState({ teleportingFighterId: caller.id });
                // Optionally clear after a tick for animation
                setTimeout(() => {
                    this.setState({ teleportingFighterId: null });
                }, 100);
            };
        }

        let arr = [], ghostPortraitMatrix = [];
        for(let i = 0; i < 5*NUM_COLUMNS; i++){
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
            setTimeout(() => {
                this.removeDeadCombatantAfterDelay(id);
            }, DEATH_ANIMATION_DURATION);
            this.handleFighterDeath(id);
        });
        
        //overlay manager callbacks
        // this.establishInitializeOverlayManagerCallback();
        this.establishBroadcastNewAnimationCallback();
        
        // /animation CB
        this.establishUpdateAnimationDataCallback();
        // this.establishAnimationCallback();

        this.props.combatManager.initializeCombat({
            crew: this.props.crew,
            leader: this.getCrewLeader(),
            monster: this.props.monster,
            minions: this.props.minions

        })

        this.props.animationManager.initialize(NUM_COLUMNS, MAX_ROWS);

        this.setState({
            combatTiles: arr, ghostPortraitMatrix,
            monsterPortrait: this.props.monster.portrait
        })

        let arrowUp = new Image()
        arrowUp.src = images['arrowUp']
        let that = this;
        arrowUp.onload = function(){
            that.setState({
                arrowUpImage: arrowUp
            })
        }
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
            setTimeout(()=>{
                resolve(numMilliseconds, ' complete')
            }, numMilliseconds)
        })
    }
    morphPortrait = () => {
        let stringBase = 'witch_p1_', count = 1, string;
        const morphInterval = setInterval(()=>{
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
        const liveCrew = Object.values(this.state.battleData).filter(e=>(!e.isMonster && !e.isMinion) && !e.dead)
        if(liveCrew.length === 0) return
        const currentIndex = this.state.selectedFighter ? liveCrew.findIndex(e=>e.id === this.state.selectedFighter.id) : -1;
        const nextIndex = currentIndex === liveCrew.length-1 ? 0 : currentIndex + 1;
        const selectedFighter = liveCrew[nextIndex];
        this.props.combatManager.setSelectedFighter(selectedFighter)
    let a = selectedFighter?.specialActions
    let b = selectedFighter?.specialActions?.find(a=> a && a.type==='spell')

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
            
            console.log('hmm ', specials[currentSpecialIndex + 1]);
            if(specials[currentSpecialIndex + 1]){
                console.log('specials[currentSpecialIndex + 1]', specials[currentSpecialIndex + 1]);
                specials[currentSpecialIndex + 1].selected = true;
            } else {
                // all cleared
                console.log('all cleared');
            }
        } else {
            specials[0].selected = true;
        }
    }
    selectConsumableSpecial = () => {
        console.log('consumable');
        let selectedFighter = this.state.selectedFighter;
        let specials = selectedFighter?.specials;
        let consumableSpecials = selectedFighter?.specialActions;
        
        let currentSpecialIndex = consumableSpecials.findIndex(a=> a.selected);
        consumableSpecials.forEach(a=>a.selected = false)
        if(specials) specials.forEach(a=>a.selected = false)
            console.log('currentSpecialIndex', currentSpecialIndex);
        // console.log('consumableSpecials: ', consumableSpecials, 'currentindex: ', currentSpecialIndex);
        if(currentSpecialIndex >= 0){
            console.log('hmm index', currentSpecialIndex + 1, consumableSpecials[currentSpecialIndex + 1]);
            if(consumableSpecials[currentSpecialIndex + 1]){
                // console.log('specials[currentSpecialIndex + 1]', consumableSpecials[currentSpecialIndex + 1]);
                console.log('SET next');
                consumableSpecials[currentSpecialIndex + 1].selected = true;
            } else {
                // all cleared
                console.log('all cleared');
            }
        } else {
            console.log('set 0');
            consumableSpecials[0].selected = true;
        }
    }
    getActionBarLeftValForFighter = (id) => {
    //cyan 
    const selectedFighter = this.state.battleData[id];
    let val = (this.getFighterDetails(selectedFighter)?.coordinates.x * 100) + (selectedFighter?.facing === 'right' ? 100 : (0 - (this.props.combatManager.getRangeWidthVal(selectedFighter) * 100) ))
    return val
    }
    fighterPortraitClicked = (id) => {
    const selectedFighter = this.state.battleData[id];
    console.log('fighter clicked: ', selectedFighter, this.state.animationOverlays[id]);
    let val = (this.getFighterDetails(selectedFighter)?.coordinates.x * 100) + (selectedFighter?.facing === 'right' ? 0 : (100 - (this.props.combatManager.getRangeWidthVal(selectedFighter) * 100) ))
    selectedFighter.portrait = this.props.crew.find(e=>e.id === id).portrait

        console.log('setting selected fighter: ', selectedFighter);
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
        // Deep clone to ensure new reference for React
        // if (Object.values(battleData).some(e => e.dead)) {
        //     console.log('*****************battleData update received in MB   ', battleData);
        //     debugger;
        // }
        const clonedBattleData = JSON.parse(JSON.stringify(battleData));
        this.setState({
            battleData: clonedBattleData
        })
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
        console.log('outcome', outcome);

        this.props.overlayManager.reset();
        this.props.combatManager.reset();

        if(this.props.isSimulation){
            console.log('exit simulation');
            this.props.exitSimulator();
            return
        }
        let experienceGained,
            goldGained,
            itemsGained,
            crewWins = outcome === 'crewWins',
            summaryMessage, battleResult, liveCrew = Object.values(this.state.battleData).filter(e=>!e.dead && !e.isMinion && !e.isMonster);
        if(crewWins){
            battleResult = 'win';
            summaryMessage = 'The enemy is no more!';
            if(this.props.monster.drops){
                itemsGained = [];
                this.props.monster.drops.forEach(e=>{
                    let d = Math.random();
                    if(d < e.percentChance*.01) itemsGained.push(e.item)
                })
                this.props.inventoryManager.addItemsByName(itemsGained)
            }
            experienceGained = this.props.monster.level * 10;
            goldGained = Math.floor(Math.random() * experienceGained);
            this.props.inventoryManager.addCurrency({type: 'gold', amount: goldGained})
            setTimeout(()=>{
                console.log('timeout triggered');
                this.props.crewManager.addExperience(liveCrew, experienceGained);
                let meta = getMeta();
                meta.crew = this.props.crewManager.crew;
                storeMeta(meta)
                updateUserRequest();
                this.forceUpdate();
            },1000)

            
        } else {
            battleResult = 'loss'
            summaryMessage = 'Death has come for you and yours.'
            this.launchDeathSequence();
        }

        this.setState({
            showSummaryPanel: true,
            goldGained,
            experienceGained,
            itemsGained,
            summaryMessage,
            battleResult
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
        if(val.cooldown_position !== 100) return;
        const formatted_val = val.name.replaceAll(' ', '_');
        this.setState({
            showCrosshair: true,
            selectedAttack: this.props.combatManager.attacksMatrix[formatted_val]
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
        console.log('this.is simulationL ', this.props.isSimulation);
        // if(!this.props.isSimulation) this.props.useConsumableFromInventory(val);
        this.props.useConsumableFromInventory(val);
    }
    specialTileClicked = (val) => {
        console.log('special tile clicked: ', val);
        let finalVal;
        if(val !== null && typeof val === 'string'){
            val = val.replaceAll('_', ' ')
        }
        console.log('val: ', val);
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
        console.log(this.state.selectedFighter.type, 'manual fire');
        let consumableSpecialSelected;

        let selectedFighter = this.state.selectedFighter;
        let specials = selectedFighter?.specials,
        consumableSpecials = selectedFighter?.specialActions,
        selectedSpecial = specials.find(a=> a.selected),
        selectedConsumableSpecial = consumableSpecials.find(a=> a.selected);

        if(selectedSpecial){
            if(this.state.selectedFighter.energy < 100){
                console.log('bnot enough energy');
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
            console.log('manual attack');
            this.props.combatManager.fighterManualAttack()
        }
    }
    fireSpecial = (special) => {
        if(!this.state.selectedFighter) return
        console.log(this.state.selectedFighter.type, 'fire special', special );
        console.log('handle this');
        // debugger
        let consumableSpecialSelected;

        let selectedFighter = this.state.selectedFighter;
        let specials = selectedFighter?.specials,
        consumableSpecials = selectedFighter?.specialActions,
        selectedSpecial = specials.find(a=> a.selected),
        selectedConsumableSpecial = consumableSpecials.find(a=> a.selected);

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
        console.log('glyph firing', glyph, 'fighterOverride', fighterOverride);
        // Use override if provided (AI), else fall back to selectedFighter (manual)
        const selectedFighter = fighterOverride || this.state.selectedFighter;
        switch(glyph.subtype){
            case 'magic missile':
                console.log('!', this.props.animationManager);
                //     magicMissile_targetLaneDiff: 0
                // })

                



                let specials = selectedFighter?.specials;
                let consumableSpecials = selectedFighter?.specialActions;
                if (consumableSpecials) consumableSpecials.forEach(a=>a.selected = false)
                if (specials) specials.forEach(a=>a.selected = false)



                let target = this.props.combatManager.getCombatant(selectedFighter.targetId)
                console.log('target: ', target);
                if(!target) return
                // let targetDistance = this.props.combatManager.getDistanceToTarget(this.state.selectedFighter, target)
                // let laneDiff = this.props.combatManager.getLaneDifferenceToTarget(this.state.selectedFighter, target)

                // console.log('laneDiff: ', laneDiff);
                const travelTime = 1500
                console.log('about to trigger from fighgter AI');
                this.props.combatManager.fighterAI.roster['wizard'].triggerMagicMissile(selectedFighter, target, travelTime)
                // this.props.combatManager.lockFighter(this.state.selectedFighter.id)


                // this.props.animationManager.magicCircle(selectedFighter.coordinates, target.coordinates)
                // setTimeout(()=>{
                //     this.props.animationManager.magicTriangle(selectedFighter.coordinates, target.coordinates)
                // }, 500)


                // this.setState({
                //     magicMissile_fire: true,
                //     magicMissile_targetDistance: targetDistance,
                //     magicMissile_targetLaneDiff: laneDiff,
                // })
                // setTimeout(()=>{
                //     this.setState({
                //         magicMissile_connectParticles: false
                //     })
                // },1000)
                
                
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
                console.log('huh?');
        }
    }
    specialTileHovered = (val) => {
        this.setState({
            hoveredSpecialTile: val ? val.name : null
        })
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
        console.log('monster', selectedMonster);
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
            console.log('should not have gotten here');
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
                   
        return (
            <div className={`mb-board ${this.state.showCrosshair ? 'show-crosshair' : ''}`}>
                {/* Game speed readout in upper right */}
                <div style={{position: 'absolute', top: -35, right: 20, color: 'white', fontSize: '18px', zIndex: 1000}}>
                    Game Speed: {
                        (() => {
                            // Try to get intervalDisplayNames from parent props (CombatSimulator)
                            const intervalDisplayNames = INTERVAL_DISPLAY_NAMES;
                            const intervals = INTERVALS;
                            const current = this.getGameSpeed();
                            const idx = intervals.indexOf(current);
                            return idx !== -1 ? intervalDisplayNames[idx] : `${current} ms`;
                        })()
                    }
                </div>
                { this.state.navToDeathScene && <Redirect to='/death'/>}
                <div className="combat-grid-container"
                    style={{
                        width: TILE_SIZE * NUM_COLUMNS + (SHOW_TILE_BORDERS ? NUM_COLUMNS * 2 : 0) + 'px',
                        height: TILE_SIZE * MAX_ROWS + (SHOW_TILE_BORDERS ? MAX_ROWS * 2 : 0) + 'px'
                    }}>
                    {this.state.showSummaryPanel && 
                    <div className='summary-panel'>
                        <div className="content-container">
                            <div className="summary-message-container">
                                {this.state.summaryMessage}
                            </div>
                            {this.state.itemsGained && this.state.itemsGained.length > 0 &&
                            <div className="experience-container">
                                You found a {this.state.itemsGained.map(e=> e.replaceAll('_',' ')).join(', ')}
                            </div>} 
                            {this.state.goldGained > 0 && 
                            <div className="experience-container">
                                You found {this.state.goldGained} gold
                            </div>
                            } 
                            {this.state.experienceGained > 0 && 
                            <div className="experience-container">
                                Each crew member has earned {this.state.experienceGained} experience
                            </div>} 
                            <div className="portraits-container">
                                {Object.values(this.state.battleData).filter(e=>!e.dead && !e.isMonster && !e.isMinion).map((crewMember, i) => {
                                    return <div key={i} className="single-portrait-container">
                                        <div className="portrait" style={{backgroundImage: `url(${crewMember.portrait})`}}></div>
                                        {this.props.crewManager.calculateExpPercentage(crewMember) >= 100 && <Canvas 
                                        className="level-up-canvas"
                                        width={80}
                                        height={80}
                                        draw={this.draw}
                                        />}
                                        <div className="experience-bar-container">
                                            <div className="experience-bar" style={{width: `${this.props.crewManager.calculateExpPercentage(crewMember)}%`}}></div>
                                        </div>
                                    </div>
                                })}
                                {Object.values(this.state.battleData).filter(e=>e.dead && !e.isMonster && !e.isMinion).map((crewMember, i) => {
                                    return <div key={i} className="single-portrait-container dead-member">
                                        <div className="portrait" style={{backgroundImage: `url(${crewMember.portrait})`}}>
                                            <div className="skull-image" style={{backgroundImage: `url(${images['whiteskull']})`}}></div>
                                        </div>
                                    </div>
                                })}
                            </div>
                        </div>
                        <div className="button-row">
                            <div className="confirm-button" onClick={() => this.confirmClicked()}>OK</div>
                        </div>
                    </div>}

                    {(this.state.message) && <div className="message-container">
                                {this.state.message}
                    </div>}

                    {/* /// ANIMATION GRID ///  */}
                    <AnimationGrid
                    animationManager={this.props.animationManager}
                    animationData={this.state.animationData}
                    tileProps={{
                        TILE_SIZE,
                        NUM_COLUMNS,
                        SHOW_TILE_BORDERS,
                        MAX_ROWS
                    }}
                    ></AnimationGrid>

                    {/* /// COMBAT GRID .   <--- not really in use, only shows grid lines */}
                    <div className="combat-grid" style={{width: TILE_SIZE * NUM_COLUMNS + (SHOW_TILE_BORDERS ? NUM_COLUMNS * 2 : 0) + 'px'}}>
                        {this.state.combatTiles.map((t,i)=>{
                            return <div 
                            key={i} 
                            className="combat-tile"
                            onDragOver={(event)=>this.onDragOver(event, i)}
                            onDrop={()=>{this.onDrop(i)}}
                            style={{
                                backgroundColor: this.state.draggedOverCombatTileId === i ? '#cccca4c1' : 'inherit',
                                border: SHOW_COMBAT_BORDER_COLORS ? '1px solid #e8e880' : '1px solid transparent'
                            }}
                            >
                                {SHOW_COORDINATES && (
                                    <div className="coord-container">
                                        {t.x}, {t.y}
                                    </div>
                                )}
                                {this.state.ghostPortraitMatrix[i] && <div className="ghost-portrait"
                                style={{
                                    backgroundImage: "url(" + this.state.ghostPortraitMatrix[i] + ")"
                                }}>
                                </div>}
                            </div>
                        })}
                    </div>
                    {/* /// FIGHTERS */}
                    <FightersCombatGrid 
                        crew={this.props.crew}
                        combatManager={this.props.combatManager}
                        selectedFighter={this.state.selectedFighter}
                        battleData={this.state.battleData}
                        getFighterDetails={this.getFighterDetails}
                        selectedMonster={this.state.selectedMonster}
                        // fighterFacingRight={this.fighterFacingRight}
                        // fighterFacingUp={this.fighterFacingUp}
                        // fighterFacingDown={this.fighterFacingDown}
                        portraitHoveredId={this.state.portraitHoveredId}
                        onDragStart={this.onDragStart}
                        getActionBarLeftValForFighter={this.getActionBarLeftValForFighter}
                        getManualMovementArc={this.getManualMovementArc}
                        getManualMovementArcColor={this.getManualMovementArcColor}
                        animationOverlays={this.state.animationOverlays}
                        getAllOverlaysById={this.getAllOverlaysById}
                        portraitHovered={this.portraitHovered}
                        fighterPortraitClicked={this.fighterPortraitClicked}
                        teleportingFighterId={this.state.teleportingFighterId}
                    />
                    {/* /// MONSTERS & MINIONS */}
                    <MonstersCombatGrid
                        monster={this.props.monster}
                        minions={this.props.minions}
                        battleData={this.state.battleData}
                        monsterData={this.monster()}
                        combatManager={this.props.combatManager}
                        selectedMonster={this.state.selectedMonster}
                        // monsterFacingUp={this.monsterFacingUp}
                        // monsterFacingDown={this.monsterFacingDown}
                        portraitHovered={this.portraitHovered}
                        greetingInProcess={this.state.greetingInProcess}
                        monsterCombatPortraitClicked={this.monsterCombatPortraitClicked}
                        animationOverlays={this.state.animationOverlays}
                        getAllOverlaysById={this.getAllOverlaysById}
                        minionDirectionReversed={this.minionDirectionReversed}
                        getMonsterWeaponAnimation={this.getMonsterWeaponAnimation}
                        getHitAnimation={this.getHitAnimation}
                        images={images}
                        TILE_SIZE={TILE_SIZE}
                        SHOW_TILE_BORDERS={SHOW_TILE_BORDERS}
                        SHOW_MONSTER_IDS={SHOW_MONSTER_IDS}
                    />
                </div>

                {/* // INTERACTION PANE */}
                { SHOW_INTERACTION_PANE && <div className={`mb-interaction-pane ${!this.state.greetingInProcess ? 'visible' : ''} `}>
                    <div className="header-row">
                        <div className="portrait" style={{backgroundImage: "url(" + images[this.state.selectedFighter?.portrait] + ")"}}></div>
                        <div className="title">
                            <div className="name">
                                {this.state.selectedFighter?.name}
                            </div>
                            <div className="readout">
                                {this.state.selectedFighter?.readout.action} {this.state.selectedFighter?.readout.result}
                            </div>
                            {this.props.paused && <span className="paused-marker">PAUSED</span>}
                        </div>
                    </div>
                    <div className="interaction-row">
                        <div className="inventory-col">
                            <div className="interaction-header">Consumables</div>
                            <div className="interaction-tooltip" style={{fontSize: this.state.hoveredInventoryTile?.length > 8 ? '10px': 'inherit'}}>{this.state.hoveredInventoryTile}</div>
                            <div className="interaction-tile-container">
                                {this.state.selectedFighter && this.props.inventoryManager?.inventory.filter(e=>e.type==='consumable').map((a, i)=>{
                                    return <div key={i}  className='interaction-tile-wrapper'>
                                                <div 
                                                className={`interaction-tile consumable`} 
                                                style={{backgroundImage: "url(" + images[a.icon] + "), radial-gradient(white 40%, black 80%)", cursor: 'pointer'}} 
                                                onClick={() => this.combatInventoryTileClicked(a)} 
                                                onMouseEnter={() => this.inventoryTileHovered(a.name)} 
                                                onMouseLeave={() => this.inventoryTileHovered(null)}
                                                >
                                                </div>
                                                <div className="interaction-tile-overlay" style={{width: `${a.cooldown_position}%`, transition: a.cooldown_position === 0 ? '0s' : '0.2s'}}></div>
                                            </div>
                                })}
                            </div>
                        </div>
                        <div className="specials-col">
                            <div className="interaction-header">Specials</div>
                            <div className="interaction-tooltip">{this.state.hoveredSpecialTile}</div>
                            <div className="interaction-tile-container">
                                {this.state.selectedFighter?.specials.map((a, i)=>{
                                    return <div key={i} className='interaction-tile-wrapper'>
                                                <div 
                                                style={{backgroundImage: "url(" + a.icon + "), radial-gradient(white 40%, black 80%)", cursor: 'pointer'}} 
                                                className={`interaction-tile special ${a.selected ? 'selected' : ''}`}
                                                onClick={() => this.specialTileClicked(a)} 
                                                onMouseEnter={() => this.specialTileHovered(a)} 
                                                onMouseLeave={() => this.specialTileHovered(null)}>
                                                </div>
                                                <div className="interaction-tile-overlay" style={{width: `${a.cooldown_position}%`, transition: a.cooldown_position === 0 ? '0s' : '0.2s', backgroundColor: a.cooldown_position === 100 && this.state.selectedFighter?.energy >= 100 ? 'green' : '#c2bd0f'}}></div>
                                            </div>
                                })}
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
                                        return (
                                            <div key={type} className='interaction-tile-wrapper' style={{position: 'relative'}}>
                                                <div
                                                    style={{ backgroundImage: `url(${spellUnit.iconUrl}), radial-gradient(white 40%, black 80%)`, cursor: 'pointer' }}
                                                    className={`interaction-tile special ${spellUnit.selected ? 'selected' : ''}`}
                                                    onClick={() => this.fireSpell(spellUnit)}
                                                    onMouseEnter={() => this.spellTileHovered(spellUnit)}
                                                    onMouseLeave={() => this.spellTileHovered(null)}>
                                                </div>
                                                {count > 1 && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 13,
                                                        right: -26,
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        borderRadius: '50%',
                                                        minWidth: 18,
                                                        minHeight: 18,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 10,
                                                        zIndex: 99,
                                                    }}>{romanNumerals[Math.min(count, 5)]}</div>
                                                )}
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
                                    {this.state.selectedFighter?.attacks.map((a, i)=>{
                                        return <div key={i}  className='interaction-tile-wrapper'>
                                                    <div 
                                                    className={`interaction-tile ${a.cooldown_position === 100 ? 'available' : ''}`} 
                                                    style={{backgroundImage: "url(" + a.icon + ")", cursor: this.state.showCrosshair ? 'crosshair' : (a.cooldown_position === 100 ? 'pointer' : '')}} 
                                                    onClick={() => this.attackTileClicked(a)} 
                                                    onMouseEnter={() => this.attackTileHovered(a.name)} 
                                                    onMouseLeave={() => this.attackTileHovered(null)}
                                                    >
                                                    </div>
                                                    <div className="interaction-tile-overlay" style={{width: `${a.cooldown_position}%`, transition: a.cooldown_position === 0 ? '0s' : '0.2s'}}></div>
                                                </div>
                                    })}
                            </div>
                        </div>
                        <div className="target-col">
                            <div className="interaction-header">Target</div>
                            <div className="interaction-tooltip"> </div>
                            <div className="interaction-tile-container">
                                {this.state.selectedFighter && this.state.selectedFighter.name !== 'Loryastes' && Object.values(this.state.battleData).filter(e=>e.isMonster || (e.isMinion && !e.dead)).map((a, i)=>{
                                    return <div key={i} className='interaction-tile-wrapper'>
                                                <div 
                                                    key={i} 
                                                    style={{backgroundImage: "url(" + a.portrait + ")", cursor: this.state.showCrosshair ? 'crosshair' : ''}} 
                                                    className={`interaction-tile target ${this.state.selectedFighter?.targetId === a.id ? 'targetted' : ''}`} 
                                                    onClick={() => this.targetTileClicked(a)} 
                                                    onMouseEnter={() => this.targetTileHovered(a)} 
                                                    onMouseLeave={() => this.targetTileHovered(null)}>
                                                </div>
                                            </div>
                                })}

                                {this.state.selectedFighter && this.state.selectedFighter.name === 'Loryastes' && Object.values(this.state.battleData).filter(e=>!e.isMonster && !e.isMinion && e.name !== 'Loryastes' && !e.dead).map((a, i)=>{
                                return <div 
                                    key={i} 
                                    style={{backgroundImage: "url(" + a.portrait + ")", cursor: this.state.showCrosshair ? 'crosshair' : ''}} 
                                    className={`interaction-tile target ${this.state.selectedFighter?.targetId === a.id ? 'targetted' : ''}`} 
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
                            <div className="interaction-header">Queue</div>
                            <div className="queue-tile-container">
                                {this.state.selectedFighter?.action_queue.map((action, i)=>{
                                    return <div 
                                    key={i} 
                                    style={{backgroundImage: "url(" + images[action.icon] + ")", cursor: 'pointer'}} 
                                    className='interaction-tile action' 
                                    onMouseEnter={() => this.queueTileHovered(action)} 
                                    onMouseLeave={() => this.queueTileHovered(null)}
                                    >
                                        {/* {a} */}
                                    </div>
                                })}
                            </div>
                        </div>
                    </div>
                </div>}
            </div>
        );
    }
}

export default MonsterBattle;