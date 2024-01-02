import React from 'react'
import '../styles/dungeon-board.scss'
import Tile from '../components/tile'
import MonsterBattle from './sub-views/MonsterBattle';
import {
    loadAllDungeonsRequest,
    loadDungeonRequest,
    updateDungeonRequest,
    updateUserRequest,
    addDungeonRequest
  } from '../utils/api-handler';
import {storeMeta, getMeta, getUserId, getUserName} from '../utils/session-handler';
import { cilCaretRight, cilCaretLeft} from '@coreui/icons';
import  CIcon  from '@coreui/icons-react'
import * as images from '../utils/images'
// import AnimationGrid from '../components/animation-grid';

const MAX_DEPTH = 8;
const MAX_ROWS = 5;
const TILE_SIZE = 100;
const SHOW_TILE_BORDERS = true;

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
            levelTracker: [
                {id: 2, active: false},
                {id: 1, active: false},
                {id: 0, active: false},
                {id: -1, active: false},
                {id: -2, active: false},
            ]
        }
    }
    
    componentWillMount(){
        let tileSize = this.getTileSize(),
            boardSize = tileSize*15;
        this.initializeListeners();
        this.startSaveInterval();
        if(this.props.mapMaker) this.props.mapMaker.initializeTiles();
        let arr = []
        for(let i = 0; i < 9; i++){
            arr.push([])
        }
        const meta = getMeta();
        // const meta = null
        this.props.boardManager.establishAvailableItems(this.props.inventoryManager.items);

        
        if(!meta || !meta.dungeonId){
            this.loadNewDungeon();
        } else {
            console.log('meta: ', meta);
            this.props.inventoryManager.initializeItems(meta.inventory);

            // this.props.inventoryManager.addItem(this.props.inventoryManager.allItems['minor_key'])

            this.props.crewManager.initializeCrew(meta.crew);
            this.loadExistingDungeon(meta.dungeonId)
        }
        const minimap = [];
        for(let i = 0; i<9; i++){
            minimap.push({active: false})
        }
        console.log('this.props.crewManager.crew', this.props.crewManager.crew);
        console.log('minimap is now: ', minimap);
        this.setState((state, props) => {
            return {
                tileSize,
                boardSize,
                inventoryHoverMatrix: {},
                leftPanelExpanded: meta?.leftExpanded,
                rightPanelExpanded: meta?.rightExpanded,
                crewSize: meta.crew.length,
                minimap
            }
        })
    }
    logMeta = () => {
        const meta = getMeta();
        console.log('meta:', meta)
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
        console.log('consumable used: ', item);
        console.log('inventory; ', this.props.inventoryManager.inventory);
        let foundItem = this.props.inventoryManager.inventory.find(e=> e.name === item.name),
        foundIndex = this.props.inventoryManager.inventory.findIndex(e=> e.name === item.name);
        console.log('inventory equivalent: ', foundItem, 'foundIndex: ', foundIndex);
        console.log('found item index: ', this.props.inventoryManager.inventory.findIndex(e=> e.name === item.name));
        foundItem.animation = 'consumed';
        setTimeout(()=>{
            console.log('remove item index ', foundIndex);
            this.props.inventoryManager.removeItemByIndex(foundIndex)
            this.forceUpdate();
            this.props.saveUserData();
        }, 1000)
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
        console.log('refresh');
        let newTiles = this.props.boardManager.tiles,
            newOverlayTiles = this.props.boardManager.overlayTiles
        this.setState({
            tiles: newTiles,
            overlayTiles: newOverlayTiles
        })
    }
    triggerMonsterBattle = (bool) => {
        this.setState({
            keysLocked: bool,
            inMonsterBattle: bool
        })
    }
    setMonster = (monsterString) => {
        // monsterString = 'beholder'
        let monster = this.props.monsterManager.getMonster(monsterString), 
        minions = null;
        console.log('monster supposed to be', monsterString);
        console.log('monster set to ', monster);
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
        console.log('get it');
        return this.props.inventoryManager.inventory;
    }
    componentDidMount(){
        // const callbacks = [this.addItemToInventory]
        // this.props.boardManager.establishCallbacks(callbacks)
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

        this.props.boardManager.establishBoardTransitionCallback(this.boardTransition)
        this.props.boardManager.establishLevelChangeCallback(this.handleLevelChange)
        this.props.boardManager.establishUseConsumableFromInventoryCallback(this.useConsumableFromInventory)

        window.addEventListener('beforeunload', this.componentCleanup)
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
    handleLevelChange = (newLevelId) => {
        const levelTracker = this.state.levelTracker;
        levelTracker.forEach(e=>e.active = false)
        const level = levelTracker.find(e=>e.id === newLevelId);
        if(!level){
            console.log('new level doesnt exist in dungeon page, initialize better!');
            debugger
        }
        level.active = true;
        this.setState({
            levelTracker
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
        }
        minimap[newIndex].active = true;
        this.setState({
            minimap
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
        let key = event.key, code = event.code
        let newTiles = [], overlayTiles = [];
        if(code === 'Space'){
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
                // console.log(key === ' ')
            break;
        }
    }


    //might need to put this function somewhere else so it doesnt fire on every rerender
    // useEventListener('keydown', this.keyDownHandler);


    handleHover = (id, type, tile) => {
        // console.log('tile', tile)
    }
    handleInventoryTileHover = (tileProps) => {
        let inv = this.state.inventoryHoverMatrix;
        this.props.inventoryManager.inventory.forEach((e,i)=>{
            inv[i] = '';
        })
        if(tileProps) inv[tileProps.id] = tileProps.contains;
        this.setState({
            inventoryHoverMatrix: inv
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
        console.log('HANDLE CLICK, SHOULD NOT GET HERE tile:', tile);
    }
    handleMemberClick = (member) => {
        this.setState({
            selectedCrewMember: member.data
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
        // setTimeout(()=>{
        //     console.log('active invetnory item:', this.state.activeInventoryItem)
        // },200)
        switch(item.contains){
            case 'minor_key':
                if(this.props.boardManager.pending && this.props.boardManager.pending.type === 'minor_gate'){
                    console.log(this.props.boardManager.pending)
                    console.log('OPEN MINOR GATE')
                    // debugger
                }
            break;
            case 'ornate_key':
                if(this.props.boardManager.pending && this.props.boardManager.pending.type === 'gate' && this.props.boardManager.pending.subtype === 'ornate'){
                    console.log(this.props.boardManager.pending)
                    console.log('OPEN ORNATE GATE')
                }
            break;
            default:
                // console.log('clicked ', item, 'DUNGEON:', this.props.boardManager.dungeon)
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
                    console.log('rogue');
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
            }
        })

    }
    loadNewDungeon = async () => {
        const meta = getMeta(),
              userId = getUserId(),
              userName = getUserName();
        const allDungeons = await loadAllDungeonsRequest()


        console.log('new dungoen, crew: ', meta.crew);

        
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
            // console.log('levelId:', levelId, 'level', level, 'miniboard:', miniboardIndex, 'orientation:', orientation, 'tile id:', spawnTileIndex);
            const board = orientation === 'F' ? level.front.miniboards[miniboardIndex] : (orientation === 'B' ? level.back.miniboards[miniboardIndex] : null)
            if(board === null){
                console.log('board is null, investigate');
                debugger
            }
            
            console.log('HANDLE MINIMAP FOR NEW DUNGEON');
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
            this.setState(()=>{
                return {
                    overlayTiles: this.props.boardManager.overlayTiles,
                    tiles: this.props.boardManager.tiles,
                    minimap,
                    levelTracker
                }
            })
        } else {
            alert('no valid dungeon!')
        }
    }
    loadExistingDungeon = async (dungeonId) => {
        const meta = getMeta();
        console.log('meta: ', meta);
        const res = await loadDungeonRequest(dungeonId);
        const dungeon = JSON.parse(res.data[0].content)
        dungeon.id = res.data[0]._id;
        console.log('dungeon::: ', dungeon);
        this.props.boardManager.setDungeon(dungeon)
        this.props.boardManager.setCurrentLevel(dungeon.levels.find(l=> l.id === meta.location.levelId));
        console.log('meta.location: ', meta.location);
        console.log('meta.location.orientation', meta.location.orientation);
        console.log('meta.location.boardIndex: ', meta.location.boardIndex, 'meta.location.tileIndex', meta.location.tileIndex);
        this.props.boardManager.setCurrentOrientation(meta.location.orientation);
        this.props.boardManager.initializeTilesFromMap(meta.location.boardIndex, meta.location.tileIndex);
        const minimap = this.state.minimap,
        levels = this.state.levelTracker;
        let level = levels.find(e => e.id === meta.location.levelId)
        console.log('location meta: ', meta.location, 'found level', level);
        levels.forEach(e=>e.active = false)
        level.active = true;
        minimap[meta.location.boardIndex].active = true;
        this.setState(()=>{
            return {
                spawn: meta.location.tileIndex,
                tiles: this.props.boardManager.tiles,
                overlayTiles: this.props.boardManager.overlayTiles,
                minimap,
                levelTracker: levels
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
        meta.rightExpanded = newVal
        console.log('right sight expanded: ', newVal);
        storeMeta(meta)
        await updateUserRequest(getUserId(), meta)
    }
    uppercaseFirstLetter = (text) => {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
    battleOver = (result) => {
        if(result === 'win'){
            console.log('win result passed');
            this.props.boardManager.removeDefeatedMonsterTile()
        }
        this.setState({
            keysLocked : false
        })
    }
    render(){
        return (
        <div className="dungeon-container">
            {this.props.boardManager.currentOrientation === 'B' && <div className="dark-mask"></div>}
            <div className={`left-side-panel ${this.state.leftPanelExpanded ? 'expanded' : ''}`}>
                <div className="expand-collapse-button icon-container" onClick={this.toggleLeftSidePanel}>
                    <CIcon icon={cilCaretRight} className={`expand-icon ${this.state.leftPanelExpanded ? 'expanded' : ''}`} size="sm"/>
                </div>
                {/* <div className="minimap-container">

                </div> */}
                <div className="crew-container" onClick={() => this.logMeta()}>
                    <div className="title">Crew</div>
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
                        {this.state.selectedCrewMember.portrait && <div className="portrait" style={{backgroundImage: "url(" + this.state.selectedCrewMember.portrait + ")"}}></div>}
                        <div className="name-line">{this.state.selectedCrewMember.name} the {this.uppercaseFirstLetter(this.state.selectedCrewMember.type)}</div>
                        <div className="stat-line">Strength {this.state.selectedCrewMember.stats.str}</div>
                        <div className="stat-line">Dexterity {this.state.selectedCrewMember.stats.dex}</div>
                        <div className="stat-line">Intelligence {this.state.selectedCrewMember.stats.int}</div>
                        <div className="stat-line">Vitality {this.state.selectedCrewMember.stats.vit}</div>
                        <div className="stat-line">Fortitude {this.state.selectedCrewMember.stats.fort}</div>
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
                                        >
                                    </Tile>
                                </div>
                            </div>
                        </div>
                </div>}
            </div>
            <div className={`right-side-panel ${this.state.rightPanelExpanded ? 'expanded' : ''}`}>
                <div className="minimap-container">
                    <div className="level-indicator">
                        {this.state.levelTracker && this.state.levelTracker.map((e,i)=>{
                            return <div key={i} className={`floor-level ${e.active ? 'active' : ''} `}></div>
                        })}
                    </div>
                    {this.state.minimap.map((e,i)=>{
                        return <div className={`minimap-tile ${this.state.minimap[i].active ? 'active' : ''}`} key={i}>
                            
                        </div>
                    })

                    }
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
                                                {/* <div className="hover-message">yesy</div> */}
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
            {!this.state.keysLocked && <div className="center-board-wrapper">
                <div className="message-container">
                    {this.state.messageToDisplay}
                </div>
                <div  className="overlay-board" style={{
                    width: this.state.boardSize+'px', height: this.state.boardSize+ 'px',
                    backgroundColor: 'transparent'
                    }}>
                    {this.state.overlayTiles && this.state.overlayTiles.map((tile, i) => {
                        return <Tile 
                        key={i}
                        tileSize={this.state.tileSize}
                        image={tile.image ? tile.image : null}
                        contains={tile.contains}
                        color={tile.color ? tile.color : 'lightgrey'}
                        borders={tile.borders}
                        coordinates={tile.coordinates}
                        index={tile.id}
                        editMode={false}
                        handleHover={this.handleHover}
                        type={'overlay-tile'}
                        handleClick={this.handleClick}
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


            { this.state.keysLocked && 
            <MonsterBattle
                ref={this.monsterBattleComponentRef}
                combatManager={this.props.combatManager}
                inventoryManager={this.props.inventoryManager}
                animationManager={this.props.animationManager}
                crew={this.props.crewManager.crew}
                monster={this.state.monster}
                minions={this.state.minions}
                battleOver={this.battleOver}
                paused={this.state.paused}
            ></MonsterBattle>}
        </div>
        )
    }
}

export default DungeonPage;