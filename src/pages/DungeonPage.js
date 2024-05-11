import React from 'react'
import '../styles/dungeon-board.scss'
import Tile from '../components/tile'
import MonsterBattle from './sub-views/MonsterBattle';
import ExpositionPane from './sub-views/ExpositionPane';
import {
    loadAllDungeonsRequest,
    loadDungeonRequest,
    updateDungeonRequest,
    updateUserRequest,
    addDungeonRequest
  } from '../utils/api-handler';
import {storeMeta, getMeta, getUserId, getUserName} from '../utils/session-handler';
import { cilCaretRight, cilCaretLeft, cilMenu} from '@coreui/icons';
import  CIcon  from '@coreui/icons-react';

import { CButton, CFormSelect, CFormInput, CModal, CModalHeader, CModalTitle, CModalBody, CTabPane, CTabContent} from '@coreui/react';
import * as images from '../utils/images'

Date.prototype.addHours= function(h){
    this.setHours(this.getHours()+h);
    return this;
}
Date.prototype.addMinutes= function(minutes){
    this.setMinutes(this.getMinutes()+minutes);
    return this;
}
Date.prototype.addSeconds= function(s){
    this.setSeconds(this.getSeconds()+s);
    return this;
}
Date.prototype.addMinutes= function(minutes){
    this.setMinutes(this.getMinutes()+minutes);
    return this;
}
function diff_minutes(dt2, dt1){
  var diff =(dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;
  return Math.round(diff);
}
function diff_seconds(dt2,dt1){
    var diff =(dt2.getTime() - dt1.getTime()) / 1000;
    // diff /= 60;
    return Math.round(diff);
}

// const MAX_DEPTH = 8;
// const MAX_ROWS = 5;
// const TILE_SIZE = 100;
// const SHOW_TILE_BORDERS = true;

const MARKER_TYPES = [
    'enemy',
    'gate',
    'merchant',
    'stairs',
    'misc',
    'custom'
]

class DungeonPage extends React.Component {
    constructor(props){
        super(props)
        this.monsterBattleComponentRef = React.createRef()
        this.state = {
            tileSize: 0,
            boardSize: 0,
            tiles: [],
            overlayTiles: [],
            spawn: {},
            showMessage: false,
            messageToDisplay: '',
            showSaving: true,
            intervalId: null,
            showDarkMask: false,
            currentBoard: '',
            leftPanelExpanded: false,
            rightPanelExpanded: false,
            inventoryHoverMatrix: {},
            crewHoverMatrix: {},
            selectedCrewMember: {},
            pending: null,
            activeInventoryItem: null,
            keysLocked: false,
            inMonsterBattle: false,
            monster: null,
            crewSize: 0,
            paused: false,
            minimap: [],
            minimapZoomedTile: null,
            minimapMarkerTrayOpen: false,
            minimapPlaceMapMarkerStarted: false,
            minimapIndicators: [],
            overlayHoveredTileId: null,
            mapMarkerInput: React.createRef(),
            markerSelectVal: React.createRef(),
            levelTracker: [
                {id: 2, active: false},
                {id: 1, active: false},
                {id: 0, active: false},
                {id: -1, active: false},
                {id: -2, active: false},
            ],
            markerName: '',
            markerType: '',
            descriptionText: '',
            actionsTrayExpanded: false,
            actionMenuExpanded: '',
            modalType: '',
            showModal: false,
            updates: [],
            timeToRespawn: '',
            respawnUpdateInterval: null,
            monsterBattleTileId: null,
            setMemberRitualOptions: null,
            ritualWrecked: false
        }
    }
    
    componentWillMount(){
        let tileSize = this.getTileSize(),
            boardSize = tileSize*15;
        this.initializeListeners();
        // this.startSaveInterval();
        if(this.props.mapMaker) this.props.mapMaker.initializeTiles();
        let arr = []
        for(let i = 0; i < 9; i++){
            arr.push([])
        }
        const meta = getMeta();
        // const meta = null
        this.props.boardManager.establishAvailableItems(this.props.inventoryManager.items);

        
        if(!meta || !meta.dungeonId){
            this.props.crewManager.initializeCrew(meta.crew);
            this.loadNewDungeon();
        } else {
            this.props.inventoryManager.initializeItems(meta.inventory);

            // this.props.inventoryManager.addItem(this.props.inventoryManager.allItems['minor_key'])

            this.props.crewManager.initializeCrew(meta.crew);
            this.loadExistingDungeon(meta.dungeonId)
        }
        const minimap = [];
        for(let i = 0; i<9; i++){
            minimap.push({active: false})
        }
        
        let updates = []
        meta.crew.forEach(member=>{
            member.specialActions.forEach(a=>{
                let end = new Date(a.endDate),
                now = new Date();
                if(end - now < 0 && !a.notified){
                    updates.push({
                        text: `${member.name} has finished ${a.actionType.text}`,
                        owner: `${member.name}`,
                        actionType: a.actionType.type
                    })
                }
            })
        })
        this.setState((state, props) => {
            return {
                tileSize,
                boardSize,
                inventoryHoverMatrix: {},
                leftPanelExpanded: meta?.leftExpanded,
                rightPanelExpanded: meta?.rightExpanded,
                crewSize: meta.crew.length,
                minimap,
                updates,
                modalType: updates.length > 0 ? 'Updates' : '',
                showModal: updates.length > 0
            }
        })
    }
    componentDidMount(){
        this.props.boardManager.establishAddItemToInventoryCallback(this.addItemToInventory)
        this.props.boardManager.establishAddTreasureToInventoryCallback(this.addTreasureToInventory)
        this.props.boardManager.establishAddCurrencyToInventoryCallback(this.addCurrencyToInventory)
        this.props.boardManager.establishUpdateDungeonCallback(this.updateDungeon)
        this.props.boardManager.establishPendingCallback(this.setPending)
        this.props.boardManager.establishMessagingCallback(this.messaging)
        this.props.boardManager.establishRefreshCallback(this.refreshTiles)
        this.props.boardManager.establishTriggerMonsterBattleCallback(this.triggerMonsterBattle)
        this.props.boardManager.establishSetMonsterCallback(this.setMonster)
        this.props.boardManager.establishGetCurrentInventoryCallback(this.getCurrentInventory)
        this.props.boardManager.establishRitualEncounterCallback(this.triggerRitualEncounter)

        this.props.boardManager.establishBoardTransitionCallback(this.boardTransition)
        this.props.boardManager.establishLevelChangeCallback(this.handleLevelChange)

        this.props.boardManager.establishUseConsumableFromInventoryCallback(this.useConsumableFromInventory)
        // this.props.inventoryManager.establishUseConsumableFromInventoryCallback(this.useConsumableFromInventory)

        window.addEventListener('beforeunload', this.componentCleanup);
        
        let respawnInterval = setInterval(()=>{
            // let meta = getMeta();
            // let respawn = new Date(meta.respawnDate);
            // if()
            // if()
            this.handleRespawnTime();
        }, 1000)
        this.setState({
            respawnUpdateInterval: respawnInterval
        })

        
        this.checkDungeon()
    }
    checkDungeon = async () => {
        const allDungeons = await loadAllDungeonsRequest();
        
        let dungeons = [];
            
        allDungeons.data.forEach((e, i) => {
            let d = JSON.parse(e.content)
            d.id = e._id
            dungeons.push(d)
        })
        // const selectedDungeon = dungeons.find(e=>e.name === 'Primari');
    }
    handleRespawnTime = () => {
        let meta = getMeta();
        if(!meta.respawnDate){
            this.setNewRespawnDate();
        } else {
            let respawn = new Date(meta.respawnDate);
            let now = new Date();
            let diffInMinutes = diff_minutes(respawn, now)
            let diffInSeconds = diff_seconds(respawn, now)
            let respawnString = ''
            if(diffInMinutes > 1){
                respawnString = `${diffInMinutes} m`
            } else if(diffInMinutes < 2 && diffInSeconds > 1){
                respawnString = `${diffInSeconds} s`
            } else {
                this.respawnMonsters();
                respawnString = ''
                this.setNewRespawnDate();
                return
            }
            this.setState({
                timeToRespawn: respawnString,
            })
        }
    }
    respawnMonsters = async () => {
        let dungeons = [],
        selectedDungeon;
        
        const allDungeons = await loadAllDungeonsRequest();

        allDungeons.data.forEach((e, i) => {
            let d = JSON.parse(e.content)
            d.id = e._id
            dungeons.push(d)
        })
        selectedDungeon = JSON.parse(JSON.stringify(dungeons.find(e=>e.name === 'Primari')));
        this.props.boardManager.respawnMonsters(selectedDungeon)
    }
    componentWillUnmount(){
        this.componentCleanup();
        window.removeEventListener('beforeunload', this.componentCleanup); 
    }
    
    componentCleanup = () => {
        window.removeEventListener('keydown', this.keyDownHandler)
        window.removeEventListener('resize', this.handleResize.bind(this));
        clearInterval(this.state.intervalId)
    }
    logMeta = () => {
        const meta = getMeta();
        console.log('meta: ', meta);
    }
    setNewRespawnDate = () => {
        let soon = new Date().addMinutes(10)
        let meta = getMeta();
        meta.respawnDate = soon;
        storeMeta(meta)


        let respawn = new Date(soon);
        let now = new Date();
        let diffInMinutes = diff_minutes(respawn, now);


        let respawnString = `${diffInMinutes} m`

        this.setState({
            timeToRespawn: respawnString,
        })
    }
    pickRandom = (array) => {
        let index = Math.floor(Math.random() * array.length)
        return array[index]
    }
    addCurrencyToInventory = (data) => {
        let type;
        switch(data.type){
            case 'gold':
                type = 'gold';
            break;
            case 'shimmering_dust':
                type = 'shimmering dust'
            break;
            case 'totems':
                type = data.amount > 1 ? 'totems' : 'totem'
            break;
            default:
            break;
        }
        this.displayMessage(`You found ${data.amount} ${type}!`)
        this.props.inventoryManager.addCurrency(data)
    }
    establishAnimationCallback = () => {
        this.props.animationManager.establishAnimationCallback(this.renderAnimation)
    }
    addItemToInventory = (tile) => {
        //this is coming from a board tile
        const tileContains = tile.contains;
        this.props.inventoryManager.addItem(this.props.inventoryManager.allItems[tileContains])
        const matrix = this.state.inventoryHoverMatrix;
        this.props.inventoryManager.inventory.forEach((e,i)=>{
            matrix[i] = '';
        })
        this.displayMessage(`You found a ${tileContains}!`)
        this.setState({
            inventoryHoverMatrix: matrix
        })
    }
    addTreasureToInventory = (treasure) => {
        let item = treasure.item
        const message = `You open the treasure chest and find a ${item.replaceAll('_',' ')} and ${treasure.currency.amount} ${treasure.currency.type.replace('_',' ')}!`
        this.displayMessage(message);
        this.props.inventoryManager.addItem(this.props.inventoryManager.allItems[treasure.item])
        this.props.inventoryManager.addCurrency(treasure.currency);
    }
    useConsumableFromInventory = (item) => {
        let foundItem = this.props.inventoryManager.inventory.find(e=> e.name === item.name),
        foundIndex = this.props.inventoryManager.inventory.findIndex(e=> e.name === item.name);
        foundItem.animation = 'consumed';
        this.forceUpdate();
        setTimeout(()=>{
            foundItem.animation = '';
            this.props.inventoryManager.removeItemByIndex(foundIndex)
            this.forceUpdate();
            this.props.saveUserData();
        }, 500)
    }
    updateDungeon = async (dungeon) => {
        await updateDungeonRequest(dungeon.id, dungeon);
    }
    messaging = (message) => {
        this.displayMessageAndHold(message)
    }
    setPending = (pendingState) => {
        this.setState({pending: pendingState})
    }
    refreshTiles = () => {
        let newTiles = this.props.boardManager.tiles,
            newOverlayTiles = this.props.boardManager.overlayTiles
        this.setState({
            tiles: newTiles,
            overlayTiles: newOverlayTiles
        })
    }
    triggerMonsterBattle = (bool, tileId) => {
        this.setState({
            keysLocked: bool,
            inMonsterBattle: bool,
            monsterBattleTileId: tileId
        })
    }
    setMonster = (monsterString) => {
        // monsterString = 'beholder'
        let monster = this.props.monsterManager.getMonster(monsterString), 
        minions = null;
        if(monster && monster.minions){
            minions = [];
            monster.minions.forEach((e,i)=>{
                const minion = this.props.monsterManager.getMonster(e)
                minion.id = minion.id+i+700
                let minionName = this.pickRandom(minion.monster_names)
                minion.name = minionName
                minion.inventory = [];

                minions.push(minion)
            })
        }


        if(!monster) monster = this.props.monsterManager.getRandomMonster();
        let monsterName = this.pickRandom(monster.monster_names)
        monster.name = monsterName
        monster.inventory = [];
        this.setState({
            monster,
            minions
        })
    }
    getCurrentInventory = () => {
        return this.props.inventoryManager.inventory;
    }
    
    handleLevelChange = (newLevelId) => {
        const levelTracker = this.state.levelTracker;
        levelTracker.forEach(e=>e.active = false)
        const level = levelTracker.find(e=>e.id === newLevelId);
        if(!level){
            console.log('new level doesnt exist in dungeon page, initialize better!');
            debugger
        }
        level.active = true;


        const meta = getMeta();
        let orientation = this.props.boardManager.currentOrientation;
        let indicatorsGroup = meta.minimapIndicators.find(e=>e.level === level.id && e.orientation === orientation)
        

        

        if(!indicatorsGroup){
            let newIndicators = []
            for(let i = 0; i < 9; i++){
                newIndicators.push({
                    enemies: [],
                    gates: [],
                    merchant: [],
                    stairs: [],
                    misc: [],
                    custom: []
                })
            }
            indicatorsGroup = {
                level: level.id,
                orientation,
                indicators: newIndicators
            }
            meta.minimapIndicators.push(indicatorsGroup)
            storeMeta(meta)
        }
        this.setState({
            levelTracker,
            minimapZoomedTile: null,
            minimapIndicators: indicatorsGroup.indicators
        })

    }
    boardTransition = (direction) => {
        const minimap = this.state.minimap;
        const currentIndex = minimap.findIndex(e=>e.active === true);
        let newIndex;
        minimap.forEach(e=>e.active = false)
        switch(direction){
            case 'left': 
                newIndex = currentIndex-1;
            break;
            case 'right':
                newIndex = currentIndex+1;
            break;
            case 'up':
                newIndex = currentIndex-3;
            break;
            case 'down':
                newIndex = currentIndex+3;
            break;
            default:
                break;
        }
        let zoomed = null;
        if(this.state.minimapZoomedTile !== null){
            zoomed = newIndex;
        }
        minimap[newIndex].active = true;
        this.setState({
            minimap,
            minimapZoomedTile: zoomed
        })
    }
    getTileSize(){
        const h = Math.floor((window.innerHeight/17));
        const w = Math.floor((window.innerWidth/17));
        let tsize = 0;
        if(h < w){
            tsize = h;
          } else {
            tsize = w;
        }
        return tsize;
    }

    handleResize() {
        let tileSize = this.getTileSize(),
            boardSize = tileSize*15;

        this.setState((state, props) => {
            return {
            tileSize,
            boardSize
            }
        })
    }

    initializeListeners = () => {
        window.addEventListener('keydown', this.keyDownHandler);
        // window.addEventListener('mouseup', this.mouseUpHandler);
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    startSaveInterval = () => {
        let intervalId = setInterval( async () => {
            this.setState(()=>{
                return {
                    showMessage : true
                }
            })
            this.props.saveUserData()
            this.displayMessage('saving...')
        }, 45000); 
        this.setState({intervalId: intervalId})
    }
    displayMessage = (message) => {
        this.setState(()=>{
            return {
                showMessage : true,
                messageToDisplay: message.replaceAll('_',' ')
            }
        })
        setTimeout(() => {
            this.setState(()=>{
                return {
                    showMessage : false,
                    messageToDisplay: ''
                }
            })
        },3900)
    }
    displayMessageAndHold = (message) => {
        this.setState(()=>{
            return {
                showMessage : true,
                messageToDisplay: message
            }
        })
    }


    // transform: perspective(3cm) rotateX(16deg) rotateY(0deg) rotateZ(0deg)

    keyDownHandler = (event) => {
        console.log('event: ', event,  'keys locked: ', this.state.keysLocked);
        if(this.state.keysLocked && this.state.inMonsterBattle){
            this.combatKeyDownHandler(event);
            return
        }

        if(this.state.keysLocked) return
        console.log('chi');
        let key = event.key, code = event.code
        let newTiles = [], overlayTiles = [];
        // if(code === 'Space'){
        //     let paused = !this.state.paused;
        //     this.props.combatManager.pauseCombat(paused)
        //     this.setState({
        //         paused
        //     })
        // }
        if(code === 'p'){
            let paused = !this.state.paused;
            this.props.combatManager.pauseCombat(paused)
            this.setState({
                paused
            })
        }
        if(code === 'Space'){
            console.log('SPACEEE');
            // console.log('key: ', key);
            this.checkWhichSideOfBoard();
        }
        switch(key){
            case 'Space':
            console.log('billy jessup');
            break;
            case 'Tab':
                event.preventDefault();
                if(this.monsterBattleComponentRef.current) this.monsterBattleComponentRef.current.tabToFighter();
            break;
            case 'ArrowUp':
                if(this.state.keysLocked) return
                this.props.boardManager.moveUp();
                newTiles = [...this.props.boardManager.tiles]
                overlayTiles = this.props.boardManager.overlayTiles;
                this.setState({
                    tiles: newTiles,
                    overlayTiles,
                    showDarkMask: this.props.boardManager.setCurrentOrientation === 'B'
                })
                
            break;
            case 'ArrowDown':
                if(this.state.keysLocked) return
                this.props.boardManager.moveDown();
                newTiles = [...this.props.boardManager.tiles]
                overlayTiles = this.props.boardManager.overlayTiles;
                this.setState({
                    tiles: newTiles,
                    overlayTiles,
                    showDarkMask: this.props.boardManager.setCurrentOrientation === 'B'
                })
            break;
            case 'ArrowLeft':
                if(this.state.keysLocked) return
                this.props.boardManager.moveLeft();
                newTiles = [...this.props.boardManager.tiles]
                overlayTiles = this.props.boardManager.overlayTiles;
                this.setState({
                    tiles: newTiles,
                    overlayTiles,
                    showDarkMask: this.props.boardManager.setCurrentOrientation === 'B'
                })
            break;
            case 'ArrowRight':
                if(this.state.keysLocked) return
                this.props.boardManager.moveRight();
                newTiles = [...this.props.boardManager.tiles]
                overlayTiles = this.props.boardManager.overlayTiles;
                this.setState({
                    tiles: newTiles,
                    overlayTiles,
                    showDarkMask: this.props.boardManager.setCurrentOrientation === 'B'
                })
            break;
            default:
                // nathin
            break;
        }
    }
    combatKeyDownHandler = (event) => {
        let key = event.key, code = event.code;
        if(code === 'Space'){
            this.props.combatManager.fighterManualAttack()
        }
        if(key === 'p'){
            let paused = !this.state.paused;
            this.props.combatManager.pauseCombat(paused)
            this.setState({
                paused
            })
        }
        switch(key){
            case 'Tab':
                event.preventDefault();
                if(this.monsterBattleComponentRef.current) this.monsterBattleComponentRef.current.tabToFighter();
            break;
            case 'ArrowUp':
                if(this.state.selectedCrewMember) this.props.combatManager.moveFighterOneSpace('up');
            break;
            case 'ArrowDown':
                if(this.state.selectedCrewMember) this.props.combatManager.moveFighterOneSpace('down');
            break;
            case 'ArrowLeft':
                if(this.state.selectedCrewMember) this.props.combatManager.moveFighterOneSpace('left');
            break;
            case 'ArrowRight':
                if(this.state.selectedCrewMember) this.props.combatManager.moveFighterOneSpace('right');
            break;
            default:
                // nuttin
            break;
        }
    }

    //might need to put this function somewhere else so it doesnt fire on every rerender
    // useEventListener('keydown', this.keyDownHandler);


    handleHover = (id, type, tile) => {
    }
    handleOverlayHover = (id, type, tile) => {
        this.setState({
            overlayHoveredTileId: id
        })
    }
    handleInventoryTileHover = (tileProps) => {
        let inv = this.state.inventoryHoverMatrix,
        descriptionText = '';
        this.props.inventoryManager.inventory.forEach((e,i)=>{
            inv[i] = '';
        })
        if(tileProps){
            inv[tileProps.id] = tileProps.contains;
            descriptionText = tileProps.description
            // switch(tileProps.image){
            //     case 'bundu_mask': 
            //         descriptionText = 'testing all bozos'
            //     break;
            //     default:
            //     break;
            // }
        }

        this.setState({
            inventoryHoverMatrix: inv,
            descriptionText
        })
    }
    
    handleCrewTileHover = (tileProps) => {
        let crew = this.state.crewHoverMatrix;
        this.props.crewManager.crew.forEach((e,i)=>{
            crew[i] = '';
        })
        if(tileProps) crew[tileProps.id] = tileProps.contains;
        this.setState({
            crewHoverMatrix: crew
        })
    }
    handleClick = (tile) => {
        // nothing
        console.log('tile: ', tile);
    }
    handleOverlayClick = (tile, event) => {
        if(!this.state.minimapPlaceMapMarkerStarted) return
        // this is for marking the minimap
        
        let minimapIndicators = this.state.minimapIndicators,
        activeMinimapIndex = this.state.minimap.findIndex(e=>e.active),
        indicatorContainer = minimapIndicators[activeMinimapIndex],
        inputElement = this.state.mapMarkerInput.current;
        switch(this.state.markerType){
            case 'enemy':
                indicatorContainer.enemies.push({
                    type: this.props.boardManager.tiles[tile.id].contains,
                    tileId: tile.id
                })
                inputElement.value = this.props.boardManager.tiles[tile.id].contains
            break;
            case 'merchant':
                console.log('merchant marker not set up yet');
            break;
            case 'gate':
                indicatorContainer.gates.push({
                    type: this.props.boardManager.tiles[tile.id].contains,
                    tileId: tile.id
                })
                inputElement.value = this.props.boardManager.tiles[tile.id].contains;
            break;
            case 'stairs':
                indicatorContainer.stairs.push({
                    type: this.props.boardManager.tiles[tile.id].contains,
                    tileId: tile.id
                })
                inputElement.value = this.props.boardManager.tiles[tile.id].contains;
            break;
            case 'custom':
                console.log('custom marker not set up yet');
            break;
            default:
                break;
        }
        this.setState({
            minimapIndicators,
            minimapPlaceMapMarkerStarted: false
        })
    }

    handleMemberClickRitual = (member) => {
        console.log('member: ', member);
        this.setState({
            setMemberRitualOptions: member.data
        })
        setTimeout(()=>{
            console.log('equal? ', member === this.state.setMemberRitualOptions);
        }, 1000)
    }
    learnNewRitual = (magicUser) => {
        console.log(magicUser.name, 'learns a new ritual');
        this.setState({ritualWrecked: true})
        setTimeout(()=>{
            this.setState({ritualWrecked: false}) 
        }, 1500)
    }
    handleMemberClick = (member) => {
        let meta = getMeta(), val;
        if(!member.data){
            return
        }
        let foundMember = this.props.crewManager.crew.find(e=>e.type === member.data.type);
        if(foundMember){
            this.props.crewManager.crew.forEach(c=>{
                c.selected = false;
            })
            foundMember.selected = true;
            meta.crew = this.props.crewManager.crew;
            storeMeta(meta);
            this.props.saveUserData();
        }
        if(this.state.selectedCrewMember && this.state.selectedCrewMember.type === member.data.type){
            val = {};
        } else {
            val = member.data;
        }
        
        this.setState({
            selectedCrewMember: val,
            actionsTrayExpanded: foundMember.actionsTrayExpanded,
            actionMenuTypeExpanded: foundMember.actionMenuTypeExpanded
        })
    }
    handleEquipmentItemClick = (item) => {
        if(!item)return;
        const selectedCrewMember = this.state.selectedCrewMember;
        const itemIndex = selectedCrewMember.inventory.findIndex(e=>e===item);
        item.equippedBy = null;
        this.props.inventoryManager.addItem(item)
        selectedCrewMember.inventory.splice(itemIndex,1);
        this.setState({
            selectedCrewMember
        })
    }
    handleItemClick = (item, index) => {
        const equipTypes = ['weapon', 'armor', 'ancillary', 'magical'];
        let selectedCrewMember = this.state.selectedCrewMember;
        if(selectedCrewMember && this.state.selectedCrewMember.inventory && equipTypes.includes(item.type) && !this.state.selectedCrewMember.inventory.map(e=>e.type).includes(item.type)){
            selectedCrewMember = this.state.selectedCrewMember;
            item.equippedBy = selectedCrewMember.id;
            selectedCrewMember.inventory.push(item)
            this.props.inventoryManager.removeItemByIndex(index)
        }
        this.setState({
            activeInventoryItem: item,
            selectedCrewMember
        })
        this.props.boardManager.setActiveInventoryItem(item)
        switch(item.contains){
            case 'minor_key':
                if(this.props.boardManager.pending && this.props.boardManager.pending.type === 'minor_gate'){
                    // nothing
                }
            break;
            case 'ornate_key':
                if(this.props.boardManager.pending && this.props.boardManager.pending.type === 'gate' && this.props.boardManager.pending.subtype === 'ornate'){
                    // nothing
                }
            break;
            default:
                // nothin
            break;
        }
    }
    outfitNewCrew = () => {
        const meta = getMeta(),
        crew = meta.crew;
        crew.forEach((c)=>{
            let weapon;
            switch(c.type){
                case 'rogue':
                    weapon = this.props.inventoryManager.allItems['longbow']
                    c.inventory.push(weapon);
                break;
                case 'monk':
                    weapon = this.props.inventoryManager.allItems['flail']
                    c.inventory.push(weapon);
                break;
                case 'wizard':
                    weapon = this.props.inventoryManager.allItems['scepter']
                    c.inventory.push(weapon);
                break;
                case 'soldier':
                    weapon = this.props.inventoryManager.allItems['sword']
                    c.inventory.push(weapon);
                break;
                case 'sage':
                    weapon = this.props.inventoryManager.allItems['scepter']
                    c.inventory.push(weapon);
                break;
                case 'barbarian':
                    weapon = this.props.inventoryManager.allItems['axe']
                    c.inventory.push(weapon);
                break;
                default:
                    break;
            }
        })

    }
    loadNewDungeon = async () => {
        const meta = getMeta(),
              userId = getUserId(),
              userName = getUserName();
        const allDungeons = await loadAllDungeonsRequest();
        
        let dungeons = [],
            spawnList = [],
            selectedDungeon,
            spawnPoint;
            
        allDungeons.data.forEach((e, i) => {
            let d = JSON.parse(e.content)
            d.id = e._id
            dungeons.push(d)
        })
        selectedDungeon = dungeons.find(e=>e.name === 'Primari');
        let newDungeonPayload = {
            name: `${selectedDungeon.name}_${userName}_${userId.slice(userId.length-4)}`,
            levels: selectedDungeon.levels,
            pocket_planes: selectedDungeon.pocket_planes,
            descriptions: `${userName}'s dungeon`,
            spawn_points: selectedDungeon.spawn_points,
            valid: selectedDungeon.valid
          }
        const newDungeonRes = await addDungeonRequest(newDungeonPayload);
        selectedDungeon = JSON.parse(newDungeonRes.data.content);

        selectedDungeon.id = newDungeonRes.data._id;
        spawnPoint = selectedDungeon.spawn_points[Math.floor(Math.random()*spawnList.length)]
        spawnPoint = selectedDungeon.spawn_points[1]
        // ^ remove later
        
        
        this.props.inventoryManager.initializeItems()

        if(spawnPoint){
            this.props.boardManager.setDungeon(selectedDungeon);
            let sp = spawnPoint.locationCode.split('_');
            const levelId =  spawnPoint.level;
            const level = selectedDungeon.levels.find(e=>e.id === levelId)
            const miniboardIndex = spawnPoint.miniboardIndex
            const orientation = sp[4];
            const spawnTileIndex = spawnPoint.id;
            const board = orientation === 'F' ? level.front.miniboards[miniboardIndex] : (orientation === 'B' ? level.back.miniboards[miniboardIndex] : null)
            if(board === null){
                console.log('board is null, investigate');
                debugger
            }
            
            meta.location = {
                boardIndex: spawnPoint.miniboardIndex,
                tileIndex: spawnPoint.id,
                levelId,
                orientation
            }
            meta.dungeonId = selectedDungeon.id;
            storeMeta(meta)
            await updateUserRequest(userId, meta);
            this.props.boardManager.setCurrentLevel(level);
            this.props.boardManager.setCurrentOrientation(orientation);
            this.props.boardManager.initializeTilesFromMap(miniboardIndex, spawnTileIndex);
            const levelTracker = this.state.levelTracker;
            const minimap = this.state.minimap;
            minimap[miniboardIndex].active = true;
            let foundLevel = levelTracker.find(e=>e.id === levelId)
            foundLevel.active = true;

            let newIndicators = []
            for(let i = 0; i < 9; i++){
                newIndicators.push({
                    enemies: [],
                    gates: [],
                    merchant: [],
                    stairs: [],
                    misc: [],
                    custom: []
                })
            }

            meta.minimapIndicators = [{
                indicators: newIndicators,
                orientation,
                level: level.id
            }]

            storeMeta(meta);

            this.setState(()=>{
                return {
                    overlayTiles: this.props.boardManager.overlayTiles,
                    tiles: this.props.boardManager.tiles,
                    minimap,
                    levelTracker,
                    minimapZoomedTile: null,
                    minimapIndicators: {
                        level: foundLevel.id,
                        orientation,
                        indicators: newIndicators
                    }
                }
            })
            const firstCrewMember = this.props.crewManager.crew[0];
            this.handleMemberClick({data:firstCrewMember})
            setTimeout(()=>{
                this.toggleLeftSidePanel();
                this.toggleRightSidePanel();
            }, 1000)
        } else {
            alert('no valid dungeon!')
        }
    }
    loadExistingDungeon = async (dungeonId) => {
        const meta = getMeta();
        
        const res = await loadDungeonRequest(dungeonId);
        const dungeon = JSON.parse(res.data[0].content)
        dungeon.id = res.data[0]._id;
        this.props.boardManager.setDungeon(dungeon)
        this.props.boardManager.setCurrentLevel(dungeon.levels.find(l=> l.id === meta.location.levelId));
        this.props.boardManager.setCurrentOrientation(meta.location.orientation);
        this.props.boardManager.initializeTilesFromMap(meta.location.boardIndex, meta.location.tileIndex);
        const minimap = this.state.minimap,
        levels = this.state.levelTracker;
        let level = levels.find(e => e.id === meta.location.levelId);
        levels.forEach(e=>e.active = false)
        level.active = true;
        minimap[meta.location.boardIndex].active = true;
        
        let orientation = this.props.boardManager.currentOrientation;
        let indicatorsGroup = meta.minimapIndicators && meta.minimapIndicators.find(e=>e.level === level.id && e.orientation === orientation);

        if(!indicatorsGroup){
            let newIndicators = []
            for(let i = 0; i < 9; i++){
                newIndicators.push({
                    enemies: [],
                    gates: [],
                    merchant: [],
                    stairs: [],
                    misc: [],
                    custom: []
                })
            }
            indicatorsGroup = {
                level: level.id,
                orientation,
                indicators: newIndicators
            }
            meta.minimapIndicators.push(indicatorsGroup)
            storeMeta(meta)
        }
        let selectedCrewMember = this.props.crewManager.crew.find(c=>c.selected) || {};
        this.setState(()=>{
            return {
                spawn: meta.location.tileIndex,
                tiles: this.props.boardManager.tiles,
                overlayTiles: this.props.boardManager.overlayTiles,
                minimap,
                minimapIndicators: indicatorsGroup.indicators,
                levelTracker: levels,
                selectedCrewMember,
                actionsTrayExpanded: selectedCrewMember ? selectedCrewMember.actionsTrayExpanded : false,
                actionMenuTypeExpanded: selectedCrewMember ? selectedCrewMember.actionMenuTypeExpanded: false
            }
        })
    }
    toggleLeftSidePanel = async () => {
        const newVal = !this.state.leftPanelExpanded;
        this.setState({leftPanelExpanded: newVal})
        const meta = getMeta()
        meta.leftExpanded = newVal
        storeMeta(meta)
        await updateUserRequest(getUserId(), meta)
    }
    toggleRightSidePanel = async () => {
        const newVal = !this.state.rightPanelExpanded
        this.setState({rightPanelExpanded: newVal})
        const meta = getMeta()
        meta.rightExpanded = newVal;
        storeMeta(meta)
        await updateUserRequest(getUserId(), meta)
    }
    toggleActionsTray = () => {
        const newVal = !this.state.actionsTrayExpanded

        let foundMember = this.props.crewManager.crew.find(c=>c.selected);
        foundMember.actionsTrayExpanded = newVal;
        let meta = getMeta();
        meta.crew = this.props.crewManager.crew;
        storeMeta(meta);
        this.props.saveUserData();


        this.setState({actionsTrayExpanded: newVal})
    }
    uppercaseFirstLetter = (text) => {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
    battleOver = (result) => {
        if(result === 'win'){
            this.props.boardManager.removeDefeatedMonsterTile(this.state.monsterBattleTileId)
            this.props.crewManager.checkForLevelUp(this.props.crewManager.crew)
            let meta = getMeta()
            meta.crew = this.props.crewManager.crew;
            storeMeta(meta)
            this.props.saveUserData()
        }
        this.setState({
            keysLocked : false
        })
    }
    minimapTileClicked = (index) => {
        this.setState({
            minimapZoomedTile: index
        })
    }
    calcPlayerIndicatorTop = () => {
        let formattedCoords = {x: this.props.boardManager.playerTile.location[0]-15, y: this.props.boardManager.playerTile.location[1]-15};
        let fromTop = formattedCoords.x
        return `${fromTop / 14 * 100}%`
    }
    calcPlayerIndicatorLeft = () => {
        let formattedCoords = {x: this.props.boardManager.playerTile.location[0]-15, y: this.props.boardManager.playerTile.location[1]-15}
        let fromLeft = formattedCoords.y;
        return `${fromLeft / 14 * 100}%`
    }
    calcIndicator = (tileId) => {
        let coords = this.props.boardManager.getCoordinatesFromIndex(tileId);
        return {
            left: `${(coords[1]-15) / 14 * 100}%`,
            top: `${(coords[0]-15) / 14 * 100}%`
        }
    }
    clearAllMarkers = () => {
        let meta = getMeta();
        meta.minimapIndicators = []
        storeMeta(meta)

        let newIndicators = []
        for(let i = 0; i < 9; i++){
            newIndicators.push({
                enemies: [],
                gates: [],
                merchant: [],
                stairs: [],
                misc: [],
                custom: []
            })
        }
        
        this.setState({
            minimapIndicators: newIndicators
        })
    }
    beginMarkingMap = () => {
        let current = this.state.minimapMarkerTrayOpen;
        this.setState({
            minimapMarkerTrayOpen: !current
        })
    }
    placeMapMarkerStart = () => {
        this.setState({
            minimapPlaceMapMarkerStarted: true
        })

    }
    submitMarkers = () => {
        let meta = getMeta();
        let indicators = this.state.minimapIndicators;
        let orientation = this.props.boardManager.currentOrientation;
        let levelId = this.props.boardManager.currentLevel.id
        let obj = {
            level: levelId,
            orientation,
            indicators
        }
        if(!meta['minimapIndicators']){
            meta['minimapIndicators'] = [obj]
        } else if(meta.minimapIndicators.find(e=>e.level === levelId && e.orientation === orientation)){
            let existing = meta.minimapIndicators.find(e=>e.level === levelId && e.orientation === orientation);
            existing.indicators = indicators;
        } else {
            meta.minimapIndicators.push(obj)
        }
        storeMeta(meta)
        // this.state.mapMarkerInput.current.value = null;
        // this.state.markerSelectVal.current.value = 'Marker Type';
        this.setState({
            minimapMarkerTrayOpen: false,
            minimapPlaceMapMarkerStarted: false,
            markerName: '',
            markerType: 'Marker Type'
        })
    }
    onMarkerNameInputChange = (markerName) => {
        this.setState({
            markerName
        })
    }
    onMarkerTypeDropdownChange = (markerType) => {
        this.setState({
            markerType
        })
    }
    handleActionClick = (action) => {
        let val = this.state.actionMenuTypeExpanded === action.type ? '' : action.type

        let foundMember = this.props.crewManager.crew.find(c=>c.selected);
        if(foundMember.actionMenuExpanded){
            delete foundMember.actionMenuExpanded
        }
        foundMember.actionMenuTypeExpanded = val;
        let meta = getMeta();
        meta.crew = this.props.crewManager.crew;
        storeMeta(meta);
        this.props.saveUserData();

        this.setState({
            actionMenuTypeExpanded: val
        })
    }
    getSubtypeClass = (subtype, maxReached) => {
        if(!subtype.available) return 'disabled'
        if(maxReached) return 'max-reached'
        if(this.state.selectedCrewMember.specialActions.some(a=> {
            let end = new Date(a.endDate);
            let now = new Date()
            return end > now
        })) return 'in-progress'
    }
    getSubtypeCountElement = (subtype) => {
        let arr = ['zero','one','two','three','four','five','six','seven','eight','nine']
        
        return <div className="numeral" style={{backgroundImage: `url(${images[arr[subtype.count]]})`}}></div>
    }
    handleActionSubtypeClick = (action, subType) => {
        let characterFromCrew = this.props.crewManager.crew.find(e=> e.id === this.state.selectedCrewMember.id)
        this.props.crewManager.beginSpecialAction(characterFromCrew, action, subType)
        const meta = getMeta();
        meta.crew = this.props.crewManager.crew;
        storeMeta(meta);
        this.props.saveUserData();
    }
    getActionCooldownPercentage = (action) => {
        if(!action) return;
        const startDate = new Date(action.startDate),
        endDate = new Date(action.endDate);
        let diffInMilli = endDate - startDate,
        diffInMinutes = diffInMilli / (1000 * 60);
        // diffInHours = diffInMinutes / (60)
        let currentTime = new Date()
        let minutesElapsed = (currentTime - startDate) / (1000 * 60)
        let percentageComplete = Math.ceil(minutesElapsed/diffInMinutes*100);
        if(percentageComplete > 100) percentageComplete = 100;
        return percentageComplete
    }
    getRotateDegreesRight = (percentage) => {
        let deg = Math.floor(percentage / 100 * 360)
        if(percentage >= 50) deg = 180;
        return deg
    }
    getRotateDegreesLeft = (percentage) => {
        let deg = Math.floor(percentage / 100 * 360)
        return deg
    }
    getCharacterActions = (character) => {
        let actions = [];
        switch(character.type){
            case 'wizard':
                actions.push({
                    text: 'Etch Glyph', 
                    icon_url: images['glyph_inverted'], 
                    type: 'glyph',
                    subTypes: [
                        {
                            type: 'magic missile', 
                            icon_url: images['magic_missile'],
                            available: true,
                            count: character.specialActions.filter(a=>a.available).length
                        }, 
                        {
                            type: 'doppleganger',
                            available: false,
                            count: 0
                        }, 
                        {
                            type: 'yawning rift',
                            available: false,
                            count: 0
                        }
                    ]
                })
                // actions.push({text: 'Etch Glyph', icon_url: images['glyph']})
                // actions.push({text: 'Etch Glyph', icon_url: images['glyph']})
            break;
            default:
                break;
        }
        let count = 0;
        actions.forEach(a=>{
            a.subTypes.forEach(s=>{
                count += s.count
            })
        })
        let maximumReached = count >= 3;
        return <div className='actions-container'>
            {actions.map((action,i)=>{
                return  <div className="action-wrapper" key={i}>
                            <div className='action-hover-wrapper' onClick={() => this.handleActionClick(action)} style={{
                                    border: `${this.getActionCooldownPercentage() && this.state.selectedCrewMember.specialActions.find(e=>e.actionType.type === action.type) ? '1px solid #635b4a' : ''}`
                                    }}>
                                {this.state.selectedCrewMember.specialActions.some(action=> this.getActionCooldownPercentage(action) < 100) && <div className="progress-overlay" style={{
                                    width: `${this.getActionCooldownPercentage(this.state.selectedCrewMember.specialActions.find(action=>this.getActionCooldownPercentage(action) < 100) )}%`,
                                    }}></div>}
                                <div className='action-icon' style={{backgroundImage: `url(${action.icon_url})`}}></div>
                                <div className="action-text">{action.text}</div>
                            </div>
                            <div className="info-icon" style={{backgroundImage: `url(${images['info']})`}}></div>
                            <div className={`action-sub-menu ${this.state.actionMenuTypeExpanded === action.type ? 'expanded' : ''}`}>
                                {maximumReached && <div className='max-reached'>maximum reached</div>}
                                {action.subTypes.map((subType,i)=>{
                                    return <div key={i} onClick={() => this.handleActionSubtypeClick(action, subType)} 
                                    className={`action-subtype ${this.getSubtypeClass(subType, maximumReached)} 
                                    `}>
                                        {/* ${!subType.available ? 'disabled' : (this.state.selectedCrewMember.specialActions.find(e=>e.actionType.type === action.type).actionSubtype.type === subType.type ? 'in-progress' : '')} */}
                                        {subType.type} {subType.count !== 0 && this.getSubtypeCountElement(subType)}
                                    </div>
                                })}
                            </div>
                        </div>
            })}
            {/* {actions.map((e,i)=>{
                return <div className='action-wrapper' key={i}>
                            <div className='action-icon' style={{backgroundImage: `url(${e.icon_url})`}}></div>
                            <div className="action-text">{e.text}</div>
                        </div>
            })}
            {actions.map((e,i)=>{
                return <div className='action-wrapper' key={i}>
                            <div className='action-icon' style={{backgroundImage: `url(${e.icon_url})`}}></div>
                            <div className="action-text">{e.text}</div>
                        </div>
            })} */}
        </div>
    }
    onUpdateModalClosed = () => {
        switch(this.state.modalType){
            case 'Updates':
                const meta = getMeta();
                let updates = this.state.updates;
                let crew = meta.crew;
                crew.forEach(c=>{
                    if(updates.some(e=>e.owner === c.name)){
                        let update = updates.find(e=>e.owner === c.name)
                        let ref = c.specialActions.find(e=> e.actionType.type === update.actionType && !e.notified)
                        ref.notified = true;
                    }
                })
                meta.crew = crew;
                this.props.crewManager.crew = crew;
                storeMeta(meta);
                this.props.saveUserData();
                this.setState({showModal: false})
            break;
            case 'Magic':
                this.setState({keysLocked: false})
            break;
        }
    }
    checkWhichSideOfBoard = () => {
        let side = this.props.boardManager.playerTile.location[0] < 22 ? 'top' : 'bottom'
        // console.log('side of board: ', side);
        return side
    }
    triggerRitualEncounter = () => {
        console.log('trigger ritual encounter');
        this.setState({
            keysLocked: true,
            modalType: 'Magic',
            showModal: true
        })
    }
    render(){
        return (
        <div className={`dungeon-container ${this.state.ritualWrecked ? 'wrecked' : ''}`}>
            <CModal alignment="center" visible={this.state.showModal} onClose={() => this.onUpdateModalClosed()}>
                <CModalHeader>
                    {this.state.modalType === 'Updates' && <CModalTitle>Since your last visit...</CModalTitle>}
                    {this.state.modalType === 'Magic' && <CModalTitle>You encounter a magic field...</CModalTitle>}
                </CModalHeader>
                <CModalBody>
                    {this.state.modalType === 'Updates' && <div>
                        {this.state.updates.map((update, i)=>{
                            return <div key={i}>
                                {update.text}
                            </div>
                        })}
                    </div>}
                    {this.state.modalType === 'Magic' && <div>
                        <p>
                        If you have a magic user in your crew you may begin a known ritual with 3x effect or learn a new one.
                        </p>
                        <div className="modal-zone">
                            {/* <CTabPane>
                                <CTabContent>
                                    tab content
                                </CTabContent>
                            </CTabPane> */}
                            {this.props.crewManager.crew.filter(e=> e.type === 'wizard' || e.type === 'sage').map((magicUser, i)=>{
                                return <div className="options-row" key={i}>
                                    <Tile 
                                    
                                    id={i}
                                    tileSize={this.state.tileSize}
                                    image={magicUser.image ? magicUser.image : null}
                                    imageOverride={magicUser.portrait ? magicUser.portrait : null}
                                    contains={magicUser.type}
                                    data={magicUser}
                                    color={magicUser.color}
                                    editMode={false}
                                    type={'crew-tile'}
                                    handleClick={this.handleMemberClickRitual}
                                    handleHover={this.handleCrewTileHover}
                                    className={`crew-tile `}> </Tile>
                                    {/* <div className="options-zone">
                                        OPTIONS
                                        {this.state.setMemberRitualOptions === null && 'yeee'}
                                        {this.state.setMemberRitualOptions?.name}
                                    </div> */}
                                    {this.state.setMemberRitualOptions === magicUser && <div className="options-zone">
                                        <div className="option" onClick={()=> this.learnNewRitual(magicUser)}>Learn</div>
                                        <div className={`option ${magicUser.specialActions.filter(e=>e.actionType.type === 'ritual').length === 0 ? 'disabled' : ''}`}>Perform ritual 3x</div>
                                    </div>}
                                </div>
                                
                            })}
                        </div>
                    </div>}
                </CModalBody>
            </CModal>
            {/* <ExpositionPane></ExpositionPane> */}
            {this.props.boardManager.currentOrientation === 'B' && <div className="dark-mask"></div>}
            <div className={`left-side-panel ${this.state.leftPanelExpanded ? 'expanded' : ''}`}>
                <div className="expand-collapse-button icon-container" onClick={this.toggleLeftSidePanel}>
                    <CIcon icon={cilCaretRight} className={`expand-icon ${this.state.leftPanelExpanded ? 'expanded' : ''}`} size="sm"/>
                </div>
                {/* <div className="minimap-container">

                </div> */}
                <div className="crew-container">
                    <div className="title" onClick={() => this.logMeta()}>Crew</div>
                    <div className="crew-tile-container">
                        {   this.props.crewManager.crew &&
                            this.props.crewManager.crew.map((member, i) => {
                                return <div className="sub-container" key={i}>
                                            { this.state.crewHoverMatrix[i] && <div className="hover-message">{this.state.crewHoverMatrix[i]}</div>}
                                            <Tile 
                                            key={i}
                                            id={i}
                                            tileSize={this.state.tileSize}
                                            image={member.image ? member.image : null}
                                            imageOverride={member.portrait ? member.portrait : null}
                                            contains={member.type}
                                            data={member}
                                            color={member.color}
                                            editMode={false}
                                            type={'crew-tile'}
                                            handleClick={this.handleMemberClick}
                                            handleHover={this.handleCrewTileHover}
                                            className={`crew-tile `}
                                            >
                                            </Tile>
                                        </div>
                            })
                        }
                    </div>
                </div>
                {this.state.selectedCrewMember.name && <div className="crew-info-section">
                        <div className="portrait-wrapper">
                            <div className="status-container">
                                <div className="member-level-indicator">Lvl {this.state.selectedCrewMember.level}</div>
                            </div>
                            <div className="portrait" style={{backgroundImage: "url(" + this.state.selectedCrewMember.portrait + ")"}}></div>
                            <div className="cooldowns-container">
                                {this.state.selectedCrewMember.specialActions.map((action, i)=>{
                                    return <div key={i}
                                    className="special-action-wrapper">
                                        <div className="special-action-icon" style={{backgroundImage: `url(${action.actionType.icon_url})`}}></div>
                                        {this.getActionCooldownPercentage(action) < 50 && <div className="progress-overlay"></div>}
                                        <div className="left" style={{transform: `rotate(${this.getRotateDegreesLeft(this.getActionCooldownPercentage(action))}deg)`}}></div>
                                        <div className="right" style={{transform: `rotate(${this.getRotateDegreesRight(this.getActionCooldownPercentage(action))}deg)`}}></div>
                                    </div>
                                })}
                            </div>
                        </div>
                        <div className="name-line">{this.state.selectedCrewMember.name} the {this.uppercaseFirstLetter(this.state.selectedCrewMember.type)}</div>
                        <div className="experience-line-container">
                            <div className="experience-line" style={{width: `${this.props.crewManager.calculateExpPercentage(this.state.selectedCrewMember)}%`}}></div>
                        </div>
                        <div className="stat-line"> <span className="stat-name">Strength</span>  <span className='stat-value'>{this.state.selectedCrewMember.stats.str} </span> </div>
                        <div className="stat-line">Dexterity <span className='stat-value'> {this.state.selectedCrewMember.stats.dex} </span></div>
                        <div className="stat-line">Intelligence <span className='stat-value'>{this.state.selectedCrewMember.stats.int} </span></div>
                        <div className="stat-line">Vitality <span className='stat-value'>{this.state.selectedCrewMember.stats.vit} </span></div>
                        <div className="stat-line">Fortitude <span className='stat-value'> {this.state.selectedCrewMember.stats.fort} </span></div>
                        <div className="icon-container menu" onClick={this.toggleActionsTray}>
                            <CIcon icon={cilMenu} className={`menu-icon ${this.state.leftPanelExpanded ? 'expanded' : ''}`} size="sm"/>
                            Actions
                        </div>
                        <div className={`actions-tray ${this.state.actionsTrayExpanded && this.state.actionMenuTypeExpanded ? 'double-expanded' : 
                        (this.state.actionsTrayExpanded ? 'expanded' : '')}`}>
                            {this.getCharacterActions(this.state.selectedCrewMember)}
                        </div>
                        <div className="equipment-panel">
                            <div className="equipment-line">
                                Weapon 
                                <div className="equipment-icon">
                                    <div className="equipment-name">
                                        {this.state.selectedCrewMember.inventory.find(e=> e.type === 'weapon')?.name}
                                    </div>
                                    <Tile 
                                    tileSize={this.state.tileSize}
                                    image={
                                        this.state.selectedCrewMember.inventory.find(e=> e.type === 'weapon') && 
                                        this.state.selectedCrewMember.inventory.find(e=> e.type === 'weapon').icon ? 
                                        this.state.selectedCrewMember.inventory.find(e=> e.type === 'weapon').icon : 
                                        null
                                    }
                                    contains={null}
                                    color={null}
                                    editMode={false}
                                    type={'inventory-tile'}
                                    handleClick={() => this.handleEquipmentItemClick(this.state.selectedCrewMember.inventory.find(e=> e.type === 'weapon'))}
                                    handleHover={this.handleInventoryTileHover}
                                    className={`inventory-tile equipment ${!this.state.selectedCrewMember.inventory.find(e=> e.type === 'weapon') ? 'empty' : ''}`}
                                    description={this.state.selectedCrewMember.inventory.find(e=> e.type === 'weapon')?.description}
                                    >
                                    </Tile>
                                </div> 
                            </div>
                            <div className="equipment-line">
                                Armor
                                <div className="equipment-icon">
                                    <div className="equipment-name">
                                        {this.state.selectedCrewMember.inventory.find(e=> e.type === 'armor')?.name}
                                    </div>
                                    <Tile 
                                        tileSize={this.state.tileSize}
                                        image={
                                            this.state.selectedCrewMember.inventory.find(e=> e.type === 'armor') && 
                                            this.state.selectedCrewMember.inventory.find(e=> e.type === 'armor').icon ? 
                                            this.state.selectedCrewMember.inventory.find(e=> e.type === 'armor').icon : 
                                            null
                                        }
                                        contains={null}
                                        color={null}
                                        editMode={false}
                                        type={'inventory-tile'}
                                        handleClick={() => this.handleEquipmentItemClick(this.state.selectedCrewMember.inventory.find(e=> e.type === 'armor'))}
                                        handleHover={this.handleInventoryTileHover}
                                        className={`inventory-tile equipment ${!this.state.selectedCrewMember.inventory.find(e=> e.type === 'armor') ? 'empty' : ''}`}
                                        description={this.state.selectedCrewMember.inventory.find(e=> e.type === 'armor')?.description}
                                        >
                                    </Tile>
                                </div> 
                            </div>
                            <div className="equipment-line">
                                Ancillary
                                <div className="equipment-icon">
                                    <div className="equipment-name">
                                        {this.state.selectedCrewMember.inventory.find(e=> e.type === 'ancillary')?.name}
                                    </div>
                                    <Tile 
                                        tileSize={this.state.tileSize}
                                        image={
                                            this.state.selectedCrewMember.inventory.find(e=> e.type === 'ancillary') && 
                                            this.state.selectedCrewMember.inventory.find(e=> e.type === 'ancillary').icon ? 
                                            this.state.selectedCrewMember.inventory.find(e=> e.type === 'ancillary').icon : 
                                            null
                                        }
                                        contains={null}
                                        color={null}
                                        editMode={false}
                                        type={'inventory-tile'}
                                        handleClick={() => this.handleEquipmentItemClick(this.state.selectedCrewMember.inventory.find(e=> e.type === 'ancillary'))}
                                        handleHover={this.handleInventoryTileHover}
                                        className={`inventory-tile equipment ${!this.state.selectedCrewMember.inventory.find(e=> e.type === 'ancillary') ? 'empty' : ''}`}
                                        description={this.state.selectedCrewMember.inventory.find(e=> e.type === 'ancillary')?.description}
                                        >
                                    </Tile>
                                </div>
                            </div>
                            <div className="equipment-line">
                                Magical
                                <div className="equipment-icon">
                                    <div className="equipment-name">
                                        {this.state.selectedCrewMember.inventory.find(e=> e.type === 'magical')?.name}
                                    </div>
                                    <Tile 
                                        tileSize={this.state.tileSize}
                                        image={
                                            this.state.selectedCrewMember.inventory.find(e=> e.type === 'magical') && 
                                            this.state.selectedCrewMember.inventory.find(e=> e.type === 'magical').icon ? 
                                            this.state.selectedCrewMember.inventory.find(e=> e.type === 'magical').icon : 
                                            null
                                        }
                                        contains={null}
                                        color={null}
                                        editMode={false}
                                        type={'inventory-tile'}
                                        handleClick={() => this.handleEquipmentItemClick(this.state.selectedCrewMember.inventory.find(e=> e.type === 'magical'))}
                                        handleHover={this.handleInventoryTileHover}
                                        className={`inventory-tile equipment ${!this.state.selectedCrewMember.inventory.find(e=> e.type === 'magical') ? 'empty' : ''}`}
                                        description={this.state.selectedCrewMember.inventory.find(e=> e.type === 'magical')?.description}
                                        >
                                    </Tile>
                                </div>
                            </div>
                        </div>
                        <div className="description-panel">
                            {this.state.descriptionText}
                        </div>
                </div>}
            </div>
            <div className={`right-side-panel ${this.state.rightPanelExpanded ? 'expanded' : ''}`}>
                <div className="minimap-container">
                    <div className="map-wrapper">
                        <div className="level-indicator">
                            {this.state.levelTracker && this.state.levelTracker.map((e,i)=>{
                                return <div key={i} className={`floor-level ${e.active ? 'active' : ''} `}></div>
                            })}
                        </div>
                        {this.state.minimap.map((e,i)=>{
                            return <div className={`minimap-tile 
                            ${this.state.minimap[i].active ? 'active' : ''}
                            ${this.state.minimapZoomedTile === i ? 'zoomed' : ''}
                            ${this.state.minimapZoomedTile === i && i === 0 ? 'topLeft' : ''}
                            ${this.state.minimapZoomedTile === i && i === 1 ? 'topMid' : ''}
                            ${this.state.minimapZoomedTile === i && i === 2 ? 'topRight' : ''}
                            ${this.state.minimapZoomedTile === i && i === 3 ? 'midLeft' : ''}
                            ${this.state.minimapZoomedTile === i && i === 5 ? 'midRight' : ''}
                            ${this.state.minimapZoomedTile === i && i === 6 ? 'botLeft' : ''}
                            ${this.state.minimapZoomedTile === i && i === 7 ? 'botMid' : ''}
                            ${this.state.minimapZoomedTile === i && i === 8 ? 'botRight' : ''}
                            `} key={i} onClick={() => this.minimapTileClicked(i)}>
                                
                                {/* // player // */}
                                {this.state.minimap[i].active && <div className="player-position-indicator"
                                style={{
                                    left: this.calcPlayerIndicatorLeft(),
                                    top: this.calcPlayerIndicatorTop()
                                }}></div>}

                                {/* // enemies // */}
                                {this.state.minimapIndicators[i] && this.state.minimapIndicators[i].enemies.map((indicator,idx)=>{
                                    return <div key={idx} className={`minimap-indicator enemy`}
                                    style={{
                                        left: this.calcIndicator(indicator.tileId).left,
                                        top: this.calcIndicator(indicator.tileId).top
                                    }}>
                                    </div>
                                })}

                                {/* // stairs // */}
                                {this.state.minimapIndicators[i] && this.state.minimapIndicators[i].stairs.map((indicator,idx)=>{
                                    return <div key={idx} className={`minimap-indicator stairs`}
                                    style={{
                                        left: this.calcIndicator(indicator.tileId).left,
                                        top: this.calcIndicator(indicator.tileId).top
                                    }}>
                                    </div>
                                })}

                                {/* // gates // */}
                                {this.state.minimapIndicators[i] && this.state.minimapIndicators[i].gates.map((indicator,idx)=>{
                                    return <div key={idx} className={`minimap-indicator gate`}
                                    style={{
                                        left: this.calcIndicator(indicator.tileId).left,
                                        top: this.calcIndicator(indicator.tileId).top
                                    }}>
                                    </div>
                                })}

                            </div>
                        })}
                    </div>
                    <div className={`tray-wrapper ${this.state.minimapZoomedTile !== null ? (this.state.minimapMarkerTrayOpen ? 'double-expanded' : 'expanded') : ''}`}>
                        {/* <button className="one" onClick={() => this.setState({minimapZoomedTile: null, minimapMarkerTrayOpen: false})}>Zoom Out</button> */}
                        {/* <button className="one" onClick={() => this.beginMarkingMap()}>Mark Map</button> */}
                        <CButton onClick={() => this.setState({minimapZoomedTile: null, minimapMarkerTrayOpen: false})}>Zoom Out</CButton>
                        <CButton onClick={() => this.beginMarkingMap()}>Mark Map</CButton>


                        {/* <button className="one">three</button> */}
                        <div className={`mark-map-tray ${this.state.minimapMarkerTrayOpen ? 'expanded' : ''}`}>
                            <CFormSelect 
                                aria-label="Marker Selector"
                                // ref={this.state.markerSelectVal}
                                options={
                                    ['Marker Type'].concat(MARKER_TYPES.map((e, i)=>{
                                    return e
                                    }))
                                }
                                value={this.state.markerType}
                                
                                onChange={e => this.onMarkerTypeDropdownChange(e.target.value)}
                                // onChange={this.props.dungeonSelectOnChange}
                            />
                            <CFormInput
                                type="text"
                                // ref={this.state.mapMarkerInput}
                                value={this.state.markerName}
                                onChange={e => this.onMarkerNameInputChange(e.target.value)}
                                placeholder="marker name"
                                aria-describedby="marker name"
                            ></CFormInput>
                            <CButton onClick={() => this.placeMapMarkerStart()} className='place-marker-button' component="a" color="light" href="#" role="button">Place Marker</CButton>
                            <CButton onClick={() => this.submitMarkers()} component="a" color="light" href="#" role="button">Submit</CButton>

                        </div>
                        <CButton className='clear-all-markers' onClick={() => this.clearAllMarkers()} color="danger">Clear All Markers</CButton>
                    </div>
                </div>
                <div className="inventory">
                    <div className="title">Inventory</div>
                    <div className="currency-container">
                        {this.props.inventoryManager.gold > 0 && <div className='gold-readout'>Gold: {this.props.inventoryManager.gold}</div>}
                        {this.props.inventoryManager.shimmering_dust > 0 && <div className='shimmering-dust-readout'>Shimmering Dust: {this.props.inventoryManager.shimmering_dust}</div>}
                        {this.props.inventoryManager.totems > 0 && <div className='totems-readout-readout'>
                            Totems: {this.props.inventoryManager.totems}
                            </div>}
                    </div>
                    <div className="inventory-tile-container">
                    {   this.props.inventoryManager && this.props.inventoryManager.inventory &&
                        this.props.inventoryManager.inventory.map((item, i) => {
                            return <div className={`sub-container ${item.animation === 'consumed' ? 'consumed' : ''}`} key={i}>
                                        { this.state.inventoryHoverMatrix[i] && 
                                            <div className="hover-message-container">
                                                <div className="hover-message">{this.state.inventoryHoverMatrix[i].replaceAll('_', ' ')}</div>
                                            </div>
                                        }
                                        <Tile 
                                        key={i}
                                        id={i}
                                        data={item}
                                        tileSize={this.state.tileSize}
                                        image={item.icon ? item.icon : null}
                                        contains={item.name.replace(' ', '_')}
                                        color={item.color}
                                        editMode={false}
                                        type={'inventory-tile'}
                                        handleClick={() => this.handleItemClick(item, i)}
                                        handleHover={this.handleInventoryTileHover}
                                        className={`inventory-tile ${this.state.activeInventoryItem?.id === i ? 'active' : ''}`}
                                        isActiveInventory={this.state.activeInventoryItem?.id === i}
                                        >
                                        </Tile>
                                    </div>
                        })
                    }
                    </div>
                </div>
                <div className="expand-collapse-button icon-container" onClick={this.toggleRightSidePanel}>
                    <CIcon icon={cilCaretLeft} className={`expand-icon ${this.state.rightPanelExpanded ? 'expanded' : ''}`} size="sm"/>
                </div>
            </div>
            {this.state.currentBoard && <div className="info-panel">{this.props.boardManager.currentBoard.name}</div>}
            {this.state.inMonsterBattle === false && <div style={{
                    opacity: this.state.tiles.length > 0 ? 1 : 0,
                    transition: 'opacity 1s'
                    }} className={`center-board-wrapper ${this.state.minimapPlaceMapMarkerStarted ? 'show-map-marker-cursor' : ''}`}>
                <div className="message-container">
                    {this.state.messageToDisplay}
                </div>
                <div className="respawn-message-container">
                    <div className="hourglass-icon" style={{
                        backgroundImage: `url(${images['hourglass1']})`
                    }}></div>{this.state.timeToRespawn}
                </div>
                <div  className="overlay-board" style={{
                    width: this.state.boardSize+'px', height: this.state.boardSize+ 'px',
                    backgroundColor: 'transparent',
                    pointerEvents: this.state.minimapPlaceMapMarkerStarted ? 'auto' : 'none'
                    }}>
                    {this.state.overlayTiles && this.state.overlayTiles.map((tile, i) => {
                        return <Tile 
                        key={i}
                        id={i}
                        cursor={this.state.minimapPlaceMapMarkerStarted ? 'crosshair' : 'default'}
                        tileSize={this.state.tileSize}
                        image={tile.image ? tile.image : null}
                        contains={tile.contains}
                        color={tile.color ? tile.color : 'lightgrey'}
                        borders={tile.borders}
                        coordinates={tile.coordinates}
                        index={tile.id}
                        editMode={false}
                        handleHover={this.handleOverlayHover}
                        type={'overlay-tile'}
                        passThrough={!this.state.minimapPlaceMapMarkerStarted}
                        handleClick={(e)=>this.handleOverlayClick}
                        backgroundColor={this.state.overlayHoveredTileId === i && this.state.minimapPlaceMapMarkerStarted ? 'rgba(100, 100, 38, 0.272)' : 'transparent'}
                        >
                        </Tile>
                    })}
                </div>
                <div  className="board" style={{
                    width: this.state.boardSize+'px', height: this.state.boardSize+ 'px',
                    backgroundColor: 'white'
                    }}>
                    {this.state.tiles && this.state.tiles.map((tile, i) => {
                        return <Tile 
                        key={i}
                        cursor={this.state.minimapPlaceMapMarkerStarted ? 'crosshair' : 'default'}
                        tileSize={this.state.tileSize}
                        image={tile.image ? tile.image : (tile.icon ? tile.icon : null)}
                        contains={tile.contains}
                        color={tile.color ? tile.color : 'lightgrey'}
                        borders={tile.borders}
                        coordinates={tile.coordinates}
                        index={tile.id}
                        showCoordinates={this.props.showCoordinates}
                        editMode={false}
                        handleHover={this.handleHover}
                        type={tile.type}
                        handleClick={this.handleClick}
                        >
                        </Tile>
                    })}
                </div>
            </div>}
            
            
            {/* /// ANIMATION GRID ///  */}
            {/* { this.state.keysLocked && 
                <AnimationGrid
                        animationManager={this.props.animationManager}
                        tileProps={{
                            TILE_SIZE,
                            MAX_DEPTH,
                            SHOW_TILE_BORDERS,
                            MAX_ROWS
                        }}
                ></AnimationGrid>
            } */}


            { this.state.keysLocked && this.state.inMonsterBattle &&
            <MonsterBattle
                ref={this.monsterBattleComponentRef}
                combatManager={this.props.combatManager}
                inventoryManager={this.props.inventoryManager}
                animationManager={this.props.animationManager}
                crewManager={this.props.crewManager}
                crew={this.props.crewManager.crew}
                monster={this.state.monster}
                minions={this.state.minions}
                battleOver={this.battleOver}
                paused={this.state.paused}
                setNarrativeSequence={this.props.setNarrativeSequence}
                useConsumableFromInventory={this.useConsumableFromInventory}
            ></MonsterBattle>}
        </div>
        )
    }
}

export default DungeonPage;