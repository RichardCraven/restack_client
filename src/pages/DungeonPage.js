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
            minimap: {}
        }
    }
    
    componentWillMount(){
        console.log('DUNGEON PAGE MOUNTED');
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
        this.props.boardManager.establishAvailableItems(this.props.inventoryManager.items)
        // let inv = {}
        console.log('meta:', meta);
        if(!meta || !meta.dungeonId){
            this.loadNewDungeon();
        } else {
            this.props.inventoryManager.initializeItems(meta.inventory);
            this.props.crewManager.initializeCrew(meta.crew);
            this.loadExistingDungeon(meta.dungeonId)
        }
        this.setState((state, props) => {
            return {
                tileSize,
                boardSize,
                inventoryHoverMatrix: {},
                leftPanelExpanded: meta?.leftExpanded,
                rightPanelExpanded: meta?.rightExpanded,
                crewSize: meta.crew.length
            }
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
            case 'shimmeringDust':
                type = 'shimmering dust'
            break;
            case 'totems':
                type = data.amount > 1 ? 'totems' : 'totem'
            break;
        }
        this.displayMessage(`You found ${data.amount} ${type}!`)
        this.props.inventoryManager.addCurrency(data)
    }
    addItemToInventory = (tile) => {
        //this is coming from a board tile
        const tileContains = tile.contains;
        console.log('allItems: ', this.props.inventoryManager.allItems);
        console.log('this.props.inventoryManager.allItems[tileContains]: ', this.props.inventoryManager.allItems[tileContains]);
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
    triggerMonsterBattle = (bool) => {
        this.setState({
            keysLocked: bool,
            inMonsterBattle: bool
        })
    }
    setMonster = (monsterString) => {
        console.log('monster was supposed to be ', monsterString);
        monsterString = 'goat_demon'
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


        if(!monster) monster = this.props.monsterManager.getRandomMonster()
        console.log('ok replacement monster is ', monster);
        let monsterName = this.pickRandom(monster.monster_names)
        monster.name = monsterName
        monster.inventory = [];
        this.setState({
            monster,
            minions
        })
    }
    componentDidMount(){
        // const callbacks = [this.addItemToInventory]
        // this.props.boardManager.establishCallbacks(callbacks)
        this.props.boardManager.establishAddItemToInventoryCallback(this.addItemToInventory)
        this.props.boardManager.establishAddCurrencyToInventoryCallback(this.addCurrencyToInventory)
        this.props.boardManager.establishUpdateDungeonCallback(this.updateDungeon)
        this.props.boardManager.establishPendingCallback(this.setPending)
        this.props.boardManager.establishMessagingCallback(this.messaging)
        this.props.boardManager.establishRefreshCallback(this.refreshTiles)
        this.props.boardManager.establishTriggerMonsterBattleCallback(this.triggerMonsterBattle)
        this.props.boardManager.establishSetMonsterCallback(this.setMonster)

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
        console.log('display message', message);
        this.setState(()=>{
            return {
                showMessage : true,
                messageToDisplay: message
            }
        })
        setTimeout(() => {
            console.log('hide message');
            this.setState(()=>{
                return {
                    showMessage : false,
                    messageToDisplay: ''
                }
            })
        },1900)
    }
    displayMessageAndHold = (message) => {
        console.log('message and hold', message);
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
            // console.log('paused now:', paused)
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
                console.log('up');
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
                console.log('down');
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
                console.log('left');
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
                console.log('right');
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
        console.log('HANDLE CLICK, SHOULD NOT GET HERE tile:', tile)

        // switch(tile.contains){
        //     case 'minor_key':
        //         if(this.props.boardManager.pending) console.log(this.props.boardManager.pending)
        //     break;
        //     default:
        //         console.log('clicked ', tile, 'DUNGEON:', this.props.boardManager.dungeon)
        //     break;
        // }
    }
    handleMemberClick = (member) => {
        console.log('selected member: ', member.data);
        console.log('crew: ', this.props.crewManager.crew);
        this.setState({
            selectedCrewMember: member.data
        })
    }
    handleEquipmentItemClick = (item) => {
        if(!item)return
        console.log('equipment clicked: ', item);
        const selectedCrewMember = this.state.selectedCrewMember;
        const itemIndex = selectedCrewMember.inventory.findIndex(e=>e===item);
        console.log('itemIndex: ', itemIndex);
        item.equippedBy = null;
        this.props.inventoryManager.addItem(item)
        selectedCrewMember.inventory.splice(itemIndex,1);
        this.setState({
            selectedCrewMember
        })
    }
    handleItemClick = (item, index) => {
        const equipTypes = ['weapon', 'armor', 'ancillary', 'magical']
        console.log(this.props.inventoryManager.inventory)
        console.log('***CLICKED ITEM: ', item);
        console.log('selected member? ', this.state.selectedCrewMember);
        let selectedCrewMember = this.state.selectedCrewMember;
        if(selectedCrewMember && this.state.selectedCrewMember.inventory && equipTypes.includes(item.type) && !this.state.selectedCrewMember.inventory.map(e=>e.type).includes(item.type)){
            console.log('ADD EQUIPABLE ITEM TO INVENTORY');
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

    loadNewDungeon = async () => {
        console.log('load new dungeon')
        const userId = getUserId(),
              userName = getUserName();
        console.log('user id:', userId)
        console.log('username:', userName)
        


        const allDungeons = await loadAllDungeonsRequest()
        
        let dungeons = [],
            spawnList = [],
            selectedDungeon,
            spawnPoint;
            
        allDungeons.data.forEach((e, i) => {
            let d = JSON.parse(e.content)
            d.id = e._id
            dungeons.push(d)
        })
        console.log('all dungeons:', dungeons);
        // return

        selectedDungeon = dungeons.find(e=>e.name === 'Primari')
        console.log('SELECTED DUNGEON:', );
        
        console.log('spawn point: ', spawnPoint);


        // clone selected dungeon
        let newDungeonPayload = {
            name: `${selectedDungeon.name}_${userId}`,
            levels: selectedDungeon.levels,
            pocket_planes: selectedDungeon.pocket_planes,
            descriptions: `${userName}'s dungeon`,
            spawn_points: selectedDungeon.spawn_points,
            valid: selectedDungeon.valid
          }
          console.log('??payload:', newDungeonPayload)
        //   return
        const newDungeonRes = await addDungeonRequest(newDungeonPayload);
        selectedDungeon = JSON.parse(newDungeonRes.data.content);

        selectedDungeon.id = newDungeonRes.data._id;
        spawnPoint = selectedDungeon.spawn_points[Math.floor(Math.random()*spawnList.length)]
        spawnPoint = selectedDungeon.spawn_points[1]
        // ^ remove later
        
        
        this.props.inventoryManager.initializeItems()

        if(spawnPoint){
            
            this.props.boardManager.setDungeon(selectedDungeon)
            // this.props.boardManager.initializeTilesFromMap(spawnPoint.boardIndex, spawnPoint.tileIndex);

            // initializeTilesFromMap

            // console.log('initialize with spawn point:', spawnPoint);
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
            // console.log('board:', board);

            const meta = getMeta()
            const userId = getUserId()

            meta.location = {
                boardIndex: spawnPoint.miniboardIndex,
                tileIndex: spawnPoint.id,
                levelId,
                orientation
            }
            meta.dungeonId = selectedDungeon.id

            // meta.dungeonId = 
            // meta.boardIndex = 
            // meta.tileIndex = spawnPoint.id
            // meta.levelId = levelId
            // meta.orientation = orientation;

            storeMeta(meta)
            await updateUserRequest(userId, meta)




            this.props.boardManager.setCurrentLevel(level);
            this.props.boardManager.setCurrentOrientation(orientation);
            this.props.boardManager.initializeTilesFromMap(miniboardIndex, spawnTileIndex);
            this.setState(()=>{
                return {
                    // spawn: spawnPoint,
                    tiles: this.props.boardManager.tiles,
                }
            })
        } else {
            alert('no valid dungeon!')
        }
    }
    loadExistingDungeon = async (dungeonId) => {
        const meta = getMeta();
        const res = await loadDungeonRequest(dungeonId);
        console.log('meta: ', meta, 'dungeonId:', dungeonId);
        console.log('res: ', res);
        const dungeon = JSON.parse(res.data[0].content)
        dungeon.id = res.data[0]._id;
        this.props.boardManager.setDungeon(dungeon)
        this.props.boardManager.setCurrentLevel(dungeon.levels.find(l=> l.id === meta.location.levelId));
        this.props.boardManager.setCurrentOrientation(meta.location.orientation);
        this.props.boardManager.initializeTilesFromMap(meta.location.boardIndex, meta.location.tileIndex);
        
        this.setState(()=>{
            return {
                spawn: meta.location.tileIndex,
                tiles: this.props.boardManager.tiles,
                overlayTiles: this.props.boardManager.overlayTiles
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
        storeMeta(meta)
        await updateUserRequest(getUserId(), meta)
    }
    uppercaseFirstLetter = (text) => {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
    battleOver = (result) => {
        console.log('result: ', result);
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
            {/* {this.state.showMessage && <div className="message-panel">{this.state.messageToDisplay}</div>} */}
            {/* {!this.state.showMessage && <div className="message-panel">{this.props.boardManager.currentBoard.name}</div>} */}
            {this.props.boardManager.currentOrientation === 'B' && <div className="dark-mask"></div>}
            <div className={`left-side-panel ${this.state.leftPanelExpanded ? 'expanded' : ''}`}>
                <div className="expand-collapse-button icon-container" onClick={this.toggleLeftSidePanel}>
                    <CIcon icon={cilCaretRight} className={`expand-icon ${this.state.leftPanelExpanded ? 'expanded' : ''}`} size="sm"/>
                </div>
                <div className="minimap-container">

                </div>
                {/* <div className="inventory">
                    <div className="title">Inventory</div>
                    <div className="inventory-tile-container">
                    {   this.props.inventoryManager &&
                        this.props.inventoryManager.inventory.map((item, i) => {
                            return <div className="sub-container" key={i}>
                                        { this.state.inventoryHoverMatrix[i] && <div className="hover-message">{this.state.inventoryHoverMatrix[i]}</div>}
                                        <Tile 
                                        key={i}
                                        id={i}
                                        tileSize={this.state.tileSize}
                                        image={item.icon ? item.icon : null}
                                        contains={item.contains}
                                        color={item.color}
                                        editMode={false}
                                        type={'inventory-tile'}
                                        handleClick={this.handleItemClick}
                                        handleHover={this.handleInventoryTileHover}
                                        className={`inventory-tile ${this.state.activeInventoryItem?.id === i ? 'active' : ''}`}
                                        isActiveInventory={this.state.activeInventoryItem?.id === i}
                                        >
                                        </Tile>
                                    </div>
                        })
                    }
                    </div>
                </div> */}
                <div className="crew-container">
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
                <div className="inventory">
                    <div className="title">Inventory</div>
                    <div className="currency-container">
                        {this.props.inventoryManager.gold && <div className='gold-readout'>Gold: {this.props.inventoryManager.gold}</div>}
                    </div>
                    <div className="inventory-tile-container">
                    {   this.props.inventoryManager && this.props.inventoryManager.inventory &&
                        this.props.inventoryManager.inventory.map((item, i) => {
                            return <div className="sub-container" key={i}>
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
            { this.state.keysLocked && 
            <MonsterBattle
                ref={this.monsterBattleComponentRef}
                combatManager={this.props.combatManager}
                inventoryManager={this.props.inventoryManager}
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