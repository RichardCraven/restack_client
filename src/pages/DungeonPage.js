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
            paused: false
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
        this.props.boardManager.establishAvailableItems(this.props.inventoryManager.items)
        let inv = {}
        if(!meta || !meta.dungeonId){
            console.log('no dungeon id, make new dungeon')
            this.loadNewDungeon();
        } else {
            // meta.inventory = []
            let inventory = []
            let consumables = [{contains: 'minor_health_potion'}, {contains: 'minor_health_potion'}, {contains: 'flail'}, {contains: 'axe'}]
            for(let i = 0; i < consumables.length; i++){
                inventory.push(consumables[i])
            }
            console.log('inventory:', inventory)
            // debugger
            this.props.inventoryManager.initializeItems(inventory)
            // this.props.inventoryManager.initializeItems(meta.inventory ? meta.inventory : [])
            // this.props.inventoryManager.initializeItems([])

            this.props.crewManager.initializeCrew(meta.crew ? meta.crew : [])


            this.props.inventoryManager.inventory.forEach((e,i)=>{
                inv[i]= ''
            })
            // debugger
            this.loadExistingDungeon(meta.dungeonId)
        }
        this.setState((state, props) => {
            return {
                tileSize,
                boardSize,
                inventoryHoverMatrix: inv,
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
    addItemToInventory = (tile) => {
        const tileContains = tile.contains;
        this.props.inventoryManager.addItem(tileContains)
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
        // console.log('trigger monster battle')
        this.setState({
            keysLocked: bool,
            inMonsterBattle: bool
        })
    }
    setMonster = (monsterString) => {
        // console.log('sert monster:', monsterString)
        monsterString = 'mummy'
        let monster = this.props.monsterManager.getMonster(monsterString), 
        minions = null;

        if(monster && monster.minions){
            minions = [];
            monster.minions.forEach((e,i)=>{
                const minion = this.props.monsterManager.getMonster(e)
                // let str = minion.id.toString()
                // str += '00' + c.toString() 
                minion.id = minion.id+i+700
                let minionName = this.pickRandom(minion.monster_names)
                minion.name = minionName
                minion.inventory = [];

                minions.push(minion)
                // monions.forEach(m=>{
                //     m.isMinion = true;
                // })
            })
        }


        if(!monster) monster = this.props.monsterManager.getRandomMonster()
        let monsterName = this.pickRandom(monster.monster_names)
        monster.name = monsterName
        monster.inventory = [];
        // console.log('monster data:', monster)
        
        this.setState({
            monster,
            minions
        })
    }
    componentDidMount(){
        // const callbacks = [this.addItemToInventory]
        // this.props.boardManager.establishCallbacks(callbacks)
        this.props.boardManager.establishAddItemToInventoryCallback(this.addItemToInventory)
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
            // setTimeout(() => {
            //     this.setState(()=>{
            //         return {
            //             showSaving: false
            //         }
            //     })
            // },1000)
            // setTimeout(() => {
            //     this.setState(()=>{
            //         return {
            //             showSaving: true,
            //             showMessage : false
            //         }
            //     })
            // },1900)
            

        }, 45000); 
        this.setState({intervalId: intervalId})
    }
    displayMessage = (message) => {
        this.setState(()=>{
            return {
                showMessage : true,
                messageToDisplay: message
            }
        })
        setTimeout(() => {
            this.setState(()=>{
                return {
                    showMessage : false,
                    messageToDisplay: ''
                }
            })
        },1900)
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
        this.setState({
            selectedCrewMember: member.data
        })
    }
    handleItemClick = (item) => {
        this.setState({
            activeInventoryItem: item
        })
        this.props.boardManager.setActiveInventoryItem(item)
        setTimeout(()=>{
            console.log('active invetnory item:', this.state.activeInventoryItem)
        },200)
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
                console.log('clicked ', item, 'DUNGEON:', this.props.boardManager.dungeon)
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
    battleOver = () => {
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
                <div className="inventory">
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
                            // return <Tile 
                            // key={i}
                            // tileSize={this.state.tileSize}
                            // image={item.image ? item.image : null}
                            // contains={item.contains}
                            // color={item.color}
                            // editMode={false}
                            // type={'inventory-tile'}
                            // handleClick={this.handleItemClick}
                            // className={'inventory-tile'}
                            // >
                            // </Tile>
                        })
                    }
                    </div>
                </div>
                {/* <div className="party">

                </div> */}
            </div>
            <div className={`right-side-panel ${this.state.rightPanelExpanded ? 'expanded' : ''}`}>
                <div className="crew" style={{height: this.state.crewSize > 3 ? '175px' : '106px'}}>
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
                                            // isActiveInventory={this.state.activeInventoryItem?.id === i}
                                            >
                                            </Tile>
                                        </div>
                            })
                        }
                    </div>
                </div>
                {this.state.selectedCrewMember.name && <div className="crew-info-section">
                        {this.state.selectedCrewMember.portrait && <div className="portrait" style={{backgroundImage: "url(" + images[this.state.selectedCrewMember.portrait] + ")"}}></div>}
                        <div className="name-line">{this.state.selectedCrewMember.name} the {this.uppercaseFirstLetter(this.state.selectedCrewMember.type)}</div>
                        <div className="stat-line">Strength {this.state.selectedCrewMember.stats.str}</div>
                        <div className="stat-line">Dexterity {this.state.selectedCrewMember.stats.dex}</div>
                        <div className="stat-line">Intelligence {this.state.selectedCrewMember.stats.int}</div>
                        <div className="stat-line">Vitality {this.state.selectedCrewMember.stats.vit}</div>
                        <div className="stat-line">Fortitude {this.state.selectedCrewMember.stats.fort}</div>
                </div>}
                <div className="expand-collapse-button icon-container" onClick={this.toggleRightSidePanel}>
                    <CIcon icon={cilCaretLeft} className={`expand-icon ${this.state.rightPanelExpanded ? 'expanded' : ''}`} size="sm"/>
                </div>
            </div>
            {this.state.currentBoard && <div className="info-panel">{this.props.boardManager.currentBoard.name}</div>}
            {!this.state.keysLocked && <div className="center-board-wrapper">
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
                        // showCoordinates={this.props.showCoordinates}
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
                        // isActiveInventory={this.state.activeInventoryItem?.id === i}
                        // isActiveInventory={this.state.activeInventoryItem?.id === i}
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
            {/* { this.state.keysLocked && <div className="monster-battle-board">
                <div className="mb-col left-col">
                    <div className="fighter-portrait">

                    </div>
                    <div className="fighter-content">

                    </div>
                </div>
                <div className="mb-col right-col">
                    <div className="monster-portrait">

                    </div>
                    <div className="monster-content">

                    </div>
                </div>
            </div>
            } */}
        </div>
        )
    }
}

export default DungeonPage;