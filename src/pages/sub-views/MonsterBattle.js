import React from 'react'
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

const MAX_DEPTH = 7;
const NUM_COLUMNS = 8;
// ^ means 8 squares, account for depth of 0 is far left
const MAX_ROWS = 5;
const TILE_SIZE = 100;
const SHOW_TILE_BORDERS = true;
const SHOW_COMBAT_BORDER_COLORS = true;
const SHOW_INTERACTION_PANE=true

const RANGES = {
    close: 1,
    medium: 3,
    far: 5
}


// const SHOW_BORDERS = true;
class MonsterBattle extends React.Component {
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
            magicMissile_targetLaneDiff: 0
        }
    }
    componentDidMount(){
        this.props.combatManager.initialize();
        this.props.combatManager.connectOverlayManager(this.props.overlayManager)
        this.props.combatManager.connectAnimationManager(this.props.animationManager);

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
        this.establishOnFighterDeathCallback();
        
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
    fighter = (propsRefFighter) => {
        // console.log('monster: ', this.state.battleData[this.props.monster.id]);
        return this.state.battleData[propsRefFighter.id]
    }
    targetOf = (caller) => {
        let c = this.state.battleData[caller.id],
        target = this.state.battleData[c.targetId]
        return target
    }
    monsterDirectionReversed = () => {
        if(!this.monster()) return false
        return this.monster()?.coordinates.x < this.targetOf(this.monster())?.coordinates.x
    }
    minionDirectionReversed = (minion) => {
        return minion?.coordinates.x < this.targetOf(minion)?.coordinates.x
    }
    getHitAnimation = (combatant) => {
        if(!combatant || !combatant.wounded) return '';
        return `hit-from-${combatant.wounded.sourceDirection}-${combatant.wounded.severity}`
    }

    fighterFacingRight = (fighter) => {
        return this.props.combatManager.fighterFacingRight(fighter)
    }
    fighterFacingUp = (fighter) => {
        if(!fighter) return
        return this.props.combatManager.fighterFacingUp(fighter)
    }
    fighterFacingDown = (fighter) => {
        if(!fighter) return
        return this.props.combatManager.fighterFacingDown(fighter)
    }
    monsterFacingUp = (monster) => {
        return this.props.combatManager.monsterFacingUp(monster)
    }
    monsterFacingDown = (monster) => {
        return this.props.combatManager.monsterFacingDown(monster)
    }
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
        let b = selectedFighter?.specialActions?.find(a=> a && a.actionType.type==='glyph') 

        this.setState({
            selectedFighter,
            glyphTrayExpanded: selectedFighter.type === 'wizard'
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
        // console.log('fighter clicked: ', selectedFighter);
        // console.log('this.fighter(selectedFighter)?.coordinates.x * 100 = ', this.fighter(selectedFighter)?.coordinates.x * 100);
        // console.log('(this.fighter(selectedFighter)?.coordinates.x * 100 - 100)', (this.fighter(selectedFighter)?.coordinates.x * 100 - 100));
        // console.log('this.fighterFacingRight(selectedFighter): ', this.fighterFacingRight(selectedFighter));

        // console.log('this.props.combatManager.getRangeWidthVal(fighter)', this.props.combatManager.getRangeWidthVal(selectedFighter));

        // ${(this.fighter(fighter)?.coordinates.x * 100 + 100) - (this.fighterFacingRight(fighter) ? 0 : 100 - (this.props.combatManager.getRangeWidthVal(fighter) * 100))}


        // (selectedFighter?.coordinates.x * 100 + 100) - (this.fighterFacingRight(selectedFighter) ? 0 : (100 + this.props.combatManager.getRangeWidthVal(selectedFighter) * 100))
        let val = (this.fighter(selectedFighter)?.coordinates.x * 100) + (this.fighterFacingRight(selectedFighter) ? 100 : (0 - (this.props.combatManager.getRangeWidthVal(selectedFighter) * 100) ))
        // console.log('val: ', val);
        return val
    }
    fighterPortraitClicked = (id) => {
        const selectedFighter = this.state.battleData[id];
        console.log('fighter clicked: ', selectedFighter, this.state.animationOverlays[id]);
        let val = (this.fighter(selectedFighter)?.coordinates.x * 100) + (this.fighterFacingRight(selectedFighter) ? 0 : (100 - (this.props.combatManager.getRangeWidthVal(selectedFighter) * 100) ))
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
        // console.log('animationOverlays recieved: ', animationOverlaysUpdated);
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
        this.setState({
            battleData
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
            this.props.combatManager.fighterSpecialAttack(selectedSpecial)
            specials.forEach(e=>e.selected=false)
        } else if (selectedConsumableSpecial){
            if(selectedConsumableSpecial.actionType.type === 'glyph'){
                this.fireGlyph(selectedConsumableSpecial.actionType.subTypes[0])
            }
            consumableSpecials.forEach(a=>a.selected=false)
        } else {
            this.props.combatManager.fighterManualAttack()
        }
    }
    fireSpecial = (special) => {
        if(!this.state.selectedFighter) return
        console.log(this.state.selectedFighter.type, 'fire special', special );
        console.log('handle this');
        debugger
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
            if(selectedConsumableSpecial.actionType.type === 'glyph'){
                this.fireGlyph(selectedConsumableSpecial.actionType.subTypes[0])
            }
            consumableSpecials.forEach(a=>a.selected=false)
        } else {
            this.props.combatManager.fighterManualAttack()
        }
    }
    fireGlyph = (glyph) => {
        console.log('glyph firing', glyph);
        switch(glyph.type){
            case 'magic missile':
                console.log('!', this.props.animationManager);
                // this.props.animationManager.magicMissile()
                // this.props.animationManager.canvasAnimations.push({
                //     magicMissile_fire: false,
                //     magicMissile_connectParticles: true,
                //     magicMissile_targetDistance: 0,
                //     magicMissile_targetLaneDiff: 0
                // })

                



                let selectedFighter = this.state.selectedFighter;
                let specials = selectedFighter?.specials;
                let consumableSpecials = selectedFighter?.specialActions;
                consumableSpecials.forEach(a=>a.selected = false)
                if(specials) specials.forEach(a=>a.selected = false)



                let target = this.props.combatManager.getCombatant(this.state.selectedFighter.targetId)
                console.log('target: ', target);
                if(!target) return
                // let targetDistance = this.props.combatManager.getDistanceToTarget(this.state.selectedFighter, target)
                // let laneDiff = this.props.combatManager.getLaneDifferenceToTarget(this.state.selectedFighter, target)

                // console.log('laneDiff: ', laneDiff);
                const travelTime = 1500
                console.log('about to trigger from fighgter AI');
                this.props.combatManager.fighterAI.roster['wizard'].triggerMagicMissile(selectedFighter, target, travelTime)
                // this.props.combatManager.lockFighter(this.state.selectedFighter.id)
                // console.log('this.props.animationManager.canvasAnimations', this.props.animationManager.canvasAnimations);
                // this.props.animationManager.canvasAnimations[0]
                this.props.animationManager.magicMissile(selectedFighter.coordinates, target.coordinates)
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
                { this.state.navToDeathScene && <Redirect to='/death'/>}
                <div className="combat-grid-container"
                style={{
                    width: TILE_SIZE * NUM_COLUMNS + (SHOW_TILE_BORDERS ? NUM_COLUMNS * 2 : 0) + 'px',
                    height: TILE_SIZE * MAX_ROWS + (SHOW_TILE_BORDERS ? MAX_ROWS * 2 : 0) + 'px'
                }}>
                    {this.state.showSummaryPanel && <div className='summary-panel'>
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

                    {/* /// COMBAT GRID */}
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
                                <div className="coord-container">
                                    {t.x}, {t.y}
                                </div>
                                {this.state.ghostPortraitMatrix[i] && <div className="ghost-portrait"
                                style={{
                                    backgroundImage: "url(" + this.state.ghostPortraitMatrix[i] + ")"
                                }}>
                                    
                                </div>}
                            </div>
                        })}
                    </div>
                    {/* /// FIGHTERS */}
                    <div className="mb-col fighter-pane">
                        <div className="fighter-content">
                            {this.props.crew.map((fighter, i) => {
                        return  <div key={i}  className='lane-wrapper' 
                                    style={{ 
                                        top: `${this.state.battleData[fighter.id]?.coordinates.y * TILE_SIZE + (SHOW_TILE_BORDERS ? this.state.battleData[fighter.id]?.coordinates.y * 2 : 0)}px`,
                                        height: `${TILE_SIZE}px`
                                    }}>
                                    <div 
                                    className={`fighter-wrapper ${fighter.isLeader ? 'leader-wrapper' : ''}`} 
                                    >
                                        <div className="portrait-wrapper"
                                        style={{
                                            left: `${this.state.battleData[fighter.id]?.coordinates.x * 100 + (SHOW_TILE_BORDERS ? this.state.battleData[fighter.id]?.coordinates.x * 2 : 0)}px`,
                                            zIndex: `${this.state.battleData[fighter.id]?.dead ? '0' : '101'}`
                                        }}
                                        >
                                            <div 
                                            className={
                                                `portrait fighter-portrait 
                                                ${this.state.selectedFighter?.id === fighter.id && !fighter.dead ? 'selected' : ''}
                                                ${this.fighter(fighter)?.wounded ? (this.fighterFacingRight(fighter) ? 'hit-from-right-minor' : 'hit-from-left-minor') : ''} 
                                                ${this.fighter(fighter)?.woundedHeavily ? (this.fighterFacingRight(fighter) ? 'hit-from-right-severe' : 'hit-from-left-severe') : ''} 
                                                ${this.fighter(fighter)?.woundedLethal ? (this.fighterFacingRight(fighter) ? 'hit-from-right-lethal' : 'hit-from-left-lethal') : ''}
                                                ${this.fighter(fighter)?.rocked ? 'rocked' : ''}
                                                ${this.fighterFacingUp(this.fighter(fighter)) ? 'facing-up' : (this.fighterFacingDown(this.fighter(fighter)) ? 'facing-down' : '')}

                                                ${this.fighter(fighter)?.missed ? (this.fighterFacingRight(fighter) ? 'missed' : 'missed-reversed') : ''} 
                                                ${fighter.isLeader ? 'leader-portrait' : ''} 
                                                ${this.fighter(fighter)?.dead ? 'dead fighterDeadAnimation' : ''} 
                                                ${(this.state.selectedMonster?.targetId === fighter.id || this.state.selectedFighter?.targetId === fighter.id) ? 'targetted' : ''}
                                                ${this.fighter(fighter)?.active ? 'active' : ''}
                                                ${this.fighterFacingRight(fighter) ? '' : 'reversed'}

                                                ${this.fighter(fighter)?.locked ? 'locked' : ''}

                                                `
                                            } 
                                            style={{
                                                backgroundImage: "url(" + fighter.portrait + ")", 
                                                filter: `saturate(${((this.fighter(fighter)?.hp / fighter.stats.hp) * 100) / 2}) 
                                                        sepia(${this.state.portraitHoveredId === fighter.id ? '2' : '0'})`,
                                            }} 
                                            onClick={() => this.fighterPortraitClicked(fighter.id)}
                                            onMouseEnter={() => this.portraitHovered(fighter.id)} 
                                            onMouseLeave={() => this.portraitHovered(null)}
                                            onDragStart = {(event) => this.onDragStart(fighter)}
                                            draggable
                                            >
                                            </div>
                                            {this.state.animationOverlays[fighter.id] && this.getAllOverlaysById(fighter.id).map((overlay, i) => {
                                                return <Overlay key={i} animationType={overlay.type} data={overlay.data}/>
                                            })}
                                            {/* { fighter.type === 'wizard' && this.state.magicMissile_fire && <CanvasMagicMissile 
                                                width={100}
                                                height={100}
                                                connectParticlesActive={this.state.magicMissile_connectParticles}
                                                targetDistance={this.state.magicMissile_targetDistance}
                                                targetLaneDiff={this.state.magicMissile_targetLaneDiff}
                                            />} */}
                                            <div className={`portrait-overlay`} >
                                                <div className="damage-indicator-container">
                                                    {this.fighter(fighter)?.damageIndicators.map((e,i)=>{
                                                        return <div key={i} className="damage-indicator">
                                                            {e}
                                                        </div>
                                                    })}
                                                </div>
                                                <div className={`circular-progress ${this.state.selectedFighter?.id === fighter.id && !fighter.dead ? 'selected' : ''}`} style={{
                                                    background: `conic-gradient(${this.getManualMovementArcColor(this.fighter(fighter))} ${this.getManualMovementArc(this.fighter(fighter))}deg, black 0deg)`,
                                                }}  data-inner-circle-color="lightgrey" data-percentage="80" data-progress-color="crimson" data-bg-color="black">
                                                    <div className="inner-circle"></div>
                                                </div>
                                            </div>
                                            <div className="hp-bar">
                                            {!this.fighter(fighter)?.dead && <div className="red-fill" 
                                                style={{width: `${(this.fighter(fighter)?.hp / fighter.stats.hp) * 100}%`}}
                                                ></div>}
                                            </div>
                                            <div className="energy-bar">
                                                {!this.fighter(fighter)?.dead && <div className="yellow-fill" style={{width: `calc(${this.fighter(fighter)?.energy}%)`}}></div>}
                                            </div>
                                            <div className="tempo-bar">
                                                {!this.fighter(fighter)?.dead &&  <div className="tempo-indicator" style={{left: `calc(${this.fighter(fighter)?.tempo}% - 4px)`}}></div>}

                                            </div>
                                        </div>
                                        { this.fighter(fighter) && this.fighter(fighter).pendingAttack && !this.fighter(fighter).dead && 
                                        <div className={`weapon-wrapper
                                            ${!this.fighterFacingRight(fighter) ? 'reversed' : ''}
                                            ${this.fighter(fighter)?.aiming ? 'aiming' : ''}
                                            ${(this.fighter(fighter)?.attacking && this.fighter(fighter)?.pendingAttack.range === 'close') ? (this.fighterFacingRight(fighter) ? 'swinging-right' : 'swinging-left') 
                                            : (this.fighter(fighter)?.attacking && this.fighter(fighter)?.pendingAttack.range === 'far' ? 'shooting' : '')}
                                            ${this.fighterFacingUp(this.fighter(fighter)) ? 'pointing-up' : (this.fighterFacingDown(this.fighter(fighter)) ? 'pointing-down' : '')}
                                            medium`}
                                            style={{
                                            left: this.fighterFacingRight(fighter) ?
                                            `${this.fighter(fighter)?.coordinates.x * 100 + 45 + (this.fighter(fighter)?.coordinates.x * 2)}px` :
                                            `${this.fighter(fighter)?.coordinates.x * 100 - 65 + (this.fighter(fighter)?.coordinates.x * 2)}px`
                                            ,
                                            backgroundImage: "url(" + this.state.battleData[fighter.id].pendingAttack.icon + ")"
                                        }}>
                                        </div>}
                                        <div className={`action-bar-wrapper ${this.fighterFacingUp(this.fighter(fighter)) ? 'pointing-up' : (this.fighterFacingDown(this.fighter(fighter)) ? 'pointing-down' : '')}`} 
                                            style={{
                                            zIndex: 1001,
                                            height: '100%',
                                            width: !!this.fighter(fighter)?.pendingAttack ? `${this.props.combatManager.getRangeWidthVal(this.fighter(fighter)) * 100}px` : '0px',
                                            left: 
                                             this.fighter(fighter)?.pendingAttack ? 
                                            `${this.getActionBarLeftValForFighter(this.fighter(fighter)?.id)}px`
                                            : 0
                                        }}
                                        
                                        >
                                            <div className={`
                                            action-bar 
                                            ${(this.fighter(fighter)?.attacking) ? (this.fighterFacingRight(fighter) ? 'fighterHitsAnimation' : 'fighterHitsAnimation_RtoL') : ''}
                                            ${(this.fighter(fighter)?.healing) ? 'fighterHealsAnimation' : ''}
                                            `}></div>
                                        </div>
                                        {/* <div className={`range-bar-wrapper`} 
                                            style={{
                                                zIndex: 1001,
                                                height: '100%',
                                                border: this.state.selectedFighter?.pendingAttack ? '1px solid cyan' : '1px solid pink',
                                                width: !!this.state.selectedFighter?.pendingAttack ? `${this.props.combatManager.getRangeWidthVal(this.state.selectedFighter) * 100}px` : '0px',
                                                left: 
                                                this.state.selectedFighter?.pendingAttack ? 
                                                `${(this.state.selectedFighter?.coordinates.x * 100) - (RANGES[this.state.selectedFighter.pendingAttack.range]*100) + (this.fighterFacingRight(fighter) ? 200 : 0)}px` 
                                                : 0
                                                }}>
                                        </div> */}
                                    </div>
                                </div>    
                            })}
                        </div>
                    </div>
                    
                    {/* /// MONSTERS & MINIONS */}
                    <div className="mb-col monster-pane">
                        {/* // MONSTER // */}
                        <div className='lane-wrapper'  
                        style={{ 
                            top: `${this.state.battleData[this.props.monster.id]?.coordinates.y * TILE_SIZE + (SHOW_TILE_BORDERS ? this.state.battleData[this.props.monster.id]?.coordinates.y * 2 : 0)}px`,
                            height: `${TILE_SIZE}px`
                        }}>
                            <div className="monster-wrapper">
                                <div className={`action-bar-wrapper ${this.monsterFacingUp(this.monster()) ? 'pointing-up' : (this.monsterFacingDown(this.monster()) ? 'pointing-down' : '')}`} 
                                    style={{
                                        zIndex: 1000,
                                        // border: '1px dashed red',
                                        width: !!this.monster()?.targetId ? `${this.props.combatManager.getDistanceToTargetWidthString(this.state.battleData[this.props.monster.id])}px` : '0px',
                                        maxWidth: !!this.monster()?.pendingAttack ? `${this.props.combatManager.getRangeWidthVal(this.monster()) * 100}px` : '0px',
                                        left: this.props.combatManager.getMonsterActionBarLeftValue(this.monster())
                                        }}
                                    // 
                                    >
                                    <div  style={{
                                        zIndex: 1000, 
                                        // backgroundColor: '#2eb85c63'
                                        }}  className={`action-bar ${this.monster()?.attacking ? (this.monster()?.coordinates.x < this.targetOf(this.monster())?.coordinates.x ? 'monsterHitsAnimation_LtoR' : 'monsterHitsAnimation') : ''}`}>

                                    </div>
                                </div>
                                <div className={`range-bar-wrapper ${this.monsterFacingUp(this.monster()) ? 'pointing-up' : (this.monsterFacingDown(this.monster()) ? 'pointing-down' : '')}`} 
                                    style={{
                                        zIndex: 1001,
                                        height: '100%',
                                        // border: this.monster()?.pendingAttack ? '1px solid blue' : '1px solid pink',
                                        width: !!this.monster()?.pendingAttack ? `${this.props.combatManager.getRangeWidthVal(this.monster()) * 100}px` : '0px',
                                        left: this.monster()?.pendingAttack ? this.props.combatManager.getMonsterRangeBarLeftValue(this.monster()) : 0
                                        }}>
                                </div>
                                { this.monster() && this.monster().pendingAttack && <div className=
                                {`weapon-wrapper 
                                ${this.getMonsterWeaponAnimation(this.monster())}
                                ${this.monster()?.aiming ? 'aiming' : ''}
                                ${this.monsterFacingUp(this.monster()) ? 'pointing-up' : (this.monsterFacingDown(this.monster()) ? 'pointing-down' : '')}
                                `}
                                style={{
                                    left: this.monsterDirectionReversed() ? 
                                    `${this.monster()?.coordinates.x * 100 + 65 + (this.monster()?.coordinates.x * 2)}px` :
                                    `${this.monster()?.coordinates.x * 100 - 45 + (this.monster()?.coordinates.x * 2)}px`,
                                    backgroundImage: "url(" + this.monster().pendingAttack.icon + ")"
                                }}
                                ></div>}
                                <div 
                                className="portrait-wrapper monster-portrait-wrapper"
                                style={{
                                    left: `${this.monster()?.coordinates.x * 100 + (this.monster()?.coordinates.x * 2)}px`,
                                    zIndex: `${this.monster()?.dead ? '0' : '100'}`
                                }}
                                >
                                    <div
                                    className={
                                        `portrait monster-portrait
                                        ${this.state.greetingInProcess ? 'enlarged' : ''} 
                                        ${this.monster()?.active ? 'active' : ''} 
                                        ${this.monster()?.dead ? 'dead monsterDeadAnimation' : ''}

                                        ${this.monster()?.wounded ? (this.monsterDirectionReversed() ? 'hit-from-right-minor' : 'hit-from-left-minor') : ''} 
                                        ${this.monster()?.woundedHeavily ? (this.monsterDirectionReversed() ? 'hit-from-right-severe' : 'hit-from-left-severe') : ''}
                                        ${this.monster()?.woundedLethal ? (this.monsterDirectionReversed() ? 'hit-from-right-lethal' : 'hit-from-left-lethal') : ''}
                                        ${this.monsterFacingUp(this.monster()) ? 'facing-up' : (this.monsterFacingDown(this.monster()) ? 'facing-down' : '')}
                                        ${this.monster()?.rocked ? 'rocked' : ''}

                                        ${this.monster()?.missed ? (this.monsterDirectionReversed() ? 'missed-reversed' : 'missed') : ''}
                                        ${this.state.selectedMonster?.id === this.props.monster.id ? 'selected' : ''}
                                        ${this.state.selectedFighter?.targetId === this.props.monster.id ? 'targetted' : ''}
                                        ${this.monsterDirectionReversed() ? 'reversed' : ''}
                                        `
                                    } 
                                    style={{
                                        backgroundImage: "url(" + this.state.monsterPortrait + ")", 
                                        filter: this.monster() && 
                                        (this.monster().type === 'demon' ||
                                        this.monster().type === 'witch') ? `` 
                                        : `saturate(${((this.monster()?.hp / this.props.monster.stats.hp) * 100) / 2}) 
                                                sepia(${this.state.portraitHoveredId === this.props.monster.id ? '2' : '0'})`
                                    }}
                                    onClick={() => this.monsterCombatPortraitClicked(this.props.monster.id)}
                                    >
                                    {/* //no children, because 3d matrix will stretch them on hit   */}
                                    </div>
                                    {this.monster() && this.state.animationOverlays[this.monster().id] && this.getAllOverlaysById(this.monster().id).map((overlay, i) => {
                                                return <Overlay key={i} animationType={overlay.type} data={overlay.data}/>
                                    })}
                                    <div 
                                    className={
                                        `portrait-relative-container`
                                    }
                                    onMouseEnter={() => this.portraitHovered(this.props.monster.id)} 
                                    onMouseLeave={() => this.portraitHovered(null)}
                                    onClick={() => this.monsterCombatPortraitClicked(this.props.monster.id)}
                                    >
                                        <div className="pending-attack-container">
                                            <div className="pending-attack-icon" style={{
                                                backgroundImage: "url(" + this.monster()?.pendingAttack?.icon + ")"
                                            }}></div>
                                        </div>
                                        <div className="targetting-container">
                                            <div className='targetting-portrait' style={{backgroundImage: "url(" + this.props.combatManager.getCombatant(this.monster()?.targetId)?.portrait + ")"}}></div>
                                        </div>
                                        <div className="targetted-by-container">
                                            {this.state.battleData[this.props.monster.id]?.targettedBy.map((e,i)=>{
                                                return <div key={i} className='targetted-by-portrait' style={{backgroundImage: "url(" + this.state.battleData[e]?.portrait + ")"}}></div>
                                            })}
                                        </div>
                                    </div>
                                    <div className={`portrait-overlay selected ${this.monster()?.frozen ? 'frozen' : ''}`} >
                                        <div className="damage-indicator-container">
                                            {/* <div className="damage-indicator">33</div> */}
                                            {this.monster()?.damageIndicators.map((e,i)=>{
                                                return <div key={i} className="damage-indicator">
                                                    {e}
                                                </div>
                                            })}
                                        </div>
                                    </div>
                                    {<div className={`indicators-wrapper enlarged-portrait ${this.state.greetingInProcess ? 'hidden' : ''}`}>
                                        <div className="monster-hp-bar hp-bar">
                                            {!this.state.battleData[this.props.monster.id]?.dead && <div className="red-fill" style={{width: `${(this.state.battleData[this.props.monster.id]?.hp / this.props.monster.stats.hp) * 100}%`}}></div>}
                                        </div>
                                        <div className="monster-energy-bar energy-bar">
                                            {!this.state.battleData[this.props.monster.id]?.dead && <div className="yellow-fill" style={{width: `calc(${this.state.battleData[this.props.monster.id]?.energy}%)`}}></div>}
                                        </div>
                                        <div className="tempo-bar">
                                            {!this.state.battleData[this.props.monster.id]?.dead && <div className="tempo-indicator" style={{right: `calc(${this.state.battleData[this.props.monster.id]?.tempo}% - 4px)`}}></div>}
                                        </div>
                                    </div>}
                                </div>
                            </div>
                        </div>

                        {/* // MINIONS // */}
                        {this.props.minions && this.props.minions.map((minion, i) => {
                        return <div 
                                key={i} 
                                className='lane-wrapper' 
                                style={{ 
                                    top: `${this.state.battleData[minion.id]?.coordinates.y * TILE_SIZE + (this.state.battleData[minion.id]?.coordinates.y * 2)}px`,
                                    height: `${TILE_SIZE}px`
                                }}> 
                                    <div className="monster-wrapper">
                                        <div className={`action-bar-wrapper`} 
                                            style={{
                                                width: !!this.state.battleData[minion.id]?.targetId ? `${this.props.combatManager.getDistanceToTargetWidthString(this.state.battleData[minion.id])}px` : '5px',
                                                left: `calc(100px * ${this.props.combatManager.getCombatant(this.state.battleData[minion.id]?.targetId)?.coordinates.x} + 50px)`
                                                }}>
                                            <div className={`action-bar ${this.state.battleData[minion.id]?.attacking ? (this.minionDirectionReversed(minion) ? 'monsterHitsAnimation_LtoR' : 'monsterHitsAnimation') : ''}`}>
                                                {/* {minion.id} */}
                                            </div>
                                        </div>
                                        { this.state.battleData[minion.id] && this.state.battleData[minion.id].pendingAttack && <div className={`weapon-wrapper 
                                        ${this.getMonsterWeaponAnimation(this.state.battleData[minion.id])}
                                        ${this.state.battleData[minion.id]?.aiming ? 'aiming' : ''}
                                        small
                                        `}
                                        style={{
                                            left: this.minionDirectionReversed(minion) ? 
                                            `${this.state.battleData[minion.id]?.coordinates.x * 100 + 65 + (this.state.battleData[minion.id]?.coordinates.x * 2)}px` :
                                            `${this.state.battleData[minion.id]?.coordinates.x * 100 - 45 + (this.state.battleData[minion.id]?.coordinates.x * 2)}px`,
                                            backgroundImage: "url(" + this.state.battleData[minion.id].pendingAttack.icon + ")"
                                        }}
                                        ></div>}
                                        <div 
                                        className="portrait-wrapper"
                                        style={{
                                            left: `${this.state.battleData[minion.id]?.coordinates.x * 100 + (SHOW_TILE_BORDERS ? this.state.battleData[minion.id]?.coordinates.x * 2 : 0)}px`,
                                            zIndex: `${this.state.battleData[minion.id]?.dead ? '0' : '100'}`
                                        }}
                                        >
                                            <div 
                                            className={
                                                `portrait minion-portrait 
                                                ${this.state.battleData[minion.id]?.active ? 'active' : ''} 
                                                ${this.state.battleData[minion.id]?.dead ? 'dead monsterDeadAnimation' : ''}
                                                ${this.state.battleData[minion.id]?.wounded ? 'hit' : ''}

                                                ${this.state.battleData[minion.id]?.wounded ? this.getHitAnimation(this.state.battleData[minion.id]) : ''} 


                                                ${this.state.battleData[minion.id]?.missed ? (this.minionDirectionReversed(minion) ? 'missed-reversed' : 'missed') : ''}
                                                ${this.state.battleData[minion.id]?.rocked ? 'rocked' : ''}
                                                ${this.state.selectedMonster?.id === minion.id ? 'selected' : ''}
                                                ${this.state.selectedFighter?.targetId === minion.id ? 'targetted' : ''}`
                                            } 
                                            style={{
                                                backgroundImage: "url(" + minion.portrait + ")", 
                                                filter: `saturate(${((this.state.battleData[minion.id]?.hp / minion.stats.hp) * 100) / 2}) 
                                                        sepia(${this.state.portraitHoveredId === minion.id ? '2' : '0'})`
                                            }} 
                                            onClick={() => this.monsterCombatPortraitClicked(minion.id)}
                                            > 
                                            {minion.id} 
                                            </div>
                                            <div 
                                            className={
                                                `portrait-relative-container`
                                            }
                                            onMouseEnter={() => this.portraitHovered(minion.id)} 
                                            onMouseLeave={() => this.portraitHovered(null)}
                                            onClick={() => this.monsterCombatPortraitClicked(minion.id)}
                                            >
                                                <div className="targetted-by-container">
                                                    {this.state.battleData[minion.id]?.targettedBy.map((e,i)=>{
                                                        return <div key={i} className='targetted-by-portrait' style={{backgroundImage: "url(" + images[this.state.battleData[e]?.portrait] + ")"}}></div>
                                                    })}
                                                </div>
                                            </div>
                                            <div className={`portrait-overlay ${this.state.battleData[minion.id]?.frozen ? 'frozen' : ''}`} >
                                                <div className="damage-indicator-container">
                                                    {/* <div className="damage-indicator">33</div> */}
                                                    {this.state.battleData[minion.id]?.damageIndicators.map((e,i)=>{
                                                        return <div key={i} className="damage-indicator">
                                                            {e}
                                                        </div>
                                                    })}
                                                </div>
                                            </div>
                                            {<div className="indicators-wrapper">
                                                <div className="monster-hp-bar hp-bar">
                                                    {!this.state.battleData[minion.id]?.dead && this.state.combatStarted && <div className="red-fill" style={{width: `${(this.state.battleData[minion.id]?.hp / minion.stats.hp) * 100}%`}}></div>}
                                                </div>
                                                <div className="monster-energy-bar energy-bar">
                                                    {!this.state.battleData[minion.id]?.dead && <div className="yellow-fill" style={{width: `calc(${this.state.battleData[minion.id]?.energy}%)`}}></div>}
                                                </div>
                                                <div className="tempo-bar">
                                                    {!this.state.battleData[minion.id]?.dead && <div className="tempo-indicator" style={{right: `calc(${this.state.battleData[minion.id]?.tempo}% - 4px)`}}></div>}
                                                </div>
                                            </div>}
                                        </div>
                                    </div>
                                </div>
                        })}
                    </div>
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
                        <div className="glyphs-col" style={{width: this.state.glyphTrayExpanded ? '100px' : '0px'}}>
                            <div className="interaction-header">Glyphs</div>
                            <div className="interaction-tooltip">{this.state.hoveredGlyphTile}</div>
                            <div className="interaction-tile-container">
                                {this.state.selectedFighter?.specialActions.length > 0 && this.state.selectedFighter?.specialActions.map((glyphUnit, i)=>{
                                return <div key={i} className='interaction-tile-wrapper'>
                                            <div  
                                                style={{backgroundImage: "url(" + glyphUnit.actionType.subTypes[0].icon_url + "), radial-gradient(white 40%, black 80%)", cursor: 'pointer'}} 
                                                className={`interaction-tile special ${glyphUnit.selected ? 'selected' : ''}`}
                                                onClick={() => this.fireGlyph(glyphUnit.actionType.subTypes[0])}
                                                onMouseEnter={() => this.glyphTileHovered(glyphUnit)} 
                                                onMouseLeave={() => this.glyphTileHovered(null)}>
                                            </div>
                                        </div>
                                })}
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
        )
    }
}

export default MonsterBattle;