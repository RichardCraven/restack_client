import React from 'react'
import '../styles/dungeon-board.scss'
import Tile from '../components/tile'
import {
    loadAllDungeonsRequest,
    loadDungeonRequest,
    updateUserRequest
  } from '../utils/api-handler';
  import {storeMeta, getMeta, setEditorPreference} from '../utils/session-handler'

class DungeonPage extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            tileSize: 0,
            boardSize: 0,
            tiles: [],
            spawn: {},
            showMessage: false,
            showSaving: true,
            intervalId: null,
            showDarkMask: false,
            currentBoard: 'test'
        }
    }
    
    componentWillMount(){
        let tileSize = this.getTileSize(),
            boardSize = tileSize*15;
        this.initializeListeners();
        this.startSaveInterval();
        if(this.props.mapMaker){
            this.props.mapMaker.initializeTiles();
        }
        let arr = []
        for(let i = 0; i < 9; i++){
            arr.push([])
        }
        const meta = JSON.parse(sessionStorage.getItem('metadata'));
        console.log('meta:' , meta)
        // this.loadNewDungeon();
        if(!meta || !meta.dungeonId){
            this.loadNewDungeon();
        } else {
            this.loadExistingDungeon(meta.dungeonId)
        }
        this.setState((state, props) => {
            return {
            tileSize,
            boardSize
            }
        })
    }
    componentDidMount(){
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
            
            setTimeout(() => {
                this.setState(()=>{
                    return {
                        showSaving: false
                    }
                })
            },1000)
            setTimeout(() => {
                this.setState(()=>{
                    return {
                        showSaving: true,
                        showMessage : false
                    }
                })
            },1900)
            

        }, 25000); 
        this.setState({intervalId: intervalId})
    }


    // transform: perspective(3cm) rotateX(16deg) rotateY(0deg) rotateZ(0deg)

    keyDownHandler = ({ key }) => {
        let newTiles = [];
        switch(key){
            case 'ArrowUp':
                this.props.boardManager.moveUp();
                newTiles = [...this.props.boardManager.tiles]
                this.setState({
                    tiles: newTiles,
                    showDarkMask: this.props.boardManager.setCurrentOrientation === 'B'
                })
                
            break;
            case 'ArrowDown':
                this.props.boardManager.moveDown();
                newTiles = [...this.props.boardManager.tiles]
                this.setState({
                    tiles: newTiles,
                    showDarkMask: this.props.boardManager.setCurrentOrientation === 'B'
                })
            break;
            case 'ArrowLeft':
                this.props.boardManager.moveLeft();
                newTiles = [...this.props.boardManager.tiles]
                this.setState({
                    tiles: newTiles,
                    showDarkMask: this.props.boardManager.setCurrentOrientation === 'B'
                })
            break;
            case 'ArrowRight':
                this.props.boardManager.moveRight();
                newTiles = [...this.props.boardManager.tiles]
                this.setState({
                    tiles: newTiles,
                    showDarkMask: this.props.boardManager.setCurrentOrientation === 'B'
                })
            break;
            default:
                console.log(key)
            break;
        }
    }


    //might need to put this function somewhere else so it doesnt fire on every rerender
    // useEventListener('keydown', this.keyDownHandler);


    handleHover = (id, type) => {
        // console.log('pp', id)
    }
    handleClick = (tile) => {
        console.log('clicked ', tile)
    }

    loadNewDungeon = async () => {
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
        selectedDungeon = dungeons.find(e=>e.name === 'Primari')
        console.log('SELECTED DUNGEON:', );
        spawnPoint = selectedDungeon.spawn_points[Math.floor(Math.random()*spawnList.length)]
        console.log('spawn point: ', spawnPoint);
        // dungeons.forEach((v, i)=>{
        //     if(v.valid){
        //         v.spawnPoints.forEach((s, i)=>{
        //             spawnList.push(s)
        //         })
        //         let idx = Math.floor(Math.random()*spawnList.length);
        //         spawnPoint = spawnList[idx]
        //         selectedDungeon = v;
        //         return
        //     }
        // })
        if(spawnPoint){
            
            this.props.boardManager.setDungeon(selectedDungeon)
            // this.props.boardManager.initializeTilesFromMap(spawnPoint.boardIndex, spawnPoint.tileIndex);

            // initializeTilesFromMap

            console.log('initialize with spawn point:', spawnPoint);
            let sp = spawnPoint.locationCode.split('_');
            const levelId =  spawnPoint.level;
            const level = selectedDungeon.levels.find(e=>e.id === levelId)
            const miniboardIndex = spawnPoint.miniboardIndex
            const orientation = sp[4];
            const spawnTileIndex = spawnPoint.id;
            console.log('levelId:', levelId, 'level', level, 'miniboard:', miniboardIndex, 'orientation:', orientation, 'tile id:', spawnTileIndex);
            const board = orientation === 'F' ? level.front.miniboards[miniboardIndex] : (orientation === 'B' ? level.back.miniboards[miniboardIndex] : null)
            if(board === null){
                console.log('board is null, investigate');
                debugger
            }
            console.log('board:', board);

            const meta = JSON.parse(sessionStorage.getItem('metadata'))
            const userId = sessionStorage.getItem('userId')

            meta.location = {
                boardIndex: spawnPoint.miniboardIndex,
                tileIndex: spawnPoint.id,
                levelId,
                orientation
            }
            meta.dungeonId = selectedDungeon.id

            delete meta.tileIndex
            delete meta.boardIndex
            // meta.dungeonId = 
            // meta.boardIndex = 
            // meta.tileIndex = spawnPoint.id
            // meta.levelId = levelId
            // meta.orientation = orientation;

            storeMeta(meta)
            await updateUserRequest(userId, meta)


            console.log('spawnPoint::: ', spawnPoint)
            console.log('spawnPoint.boardIndex::: ', spawnPoint.boardIndex)
            console.log('spawnPoint.tileIndex::: ', spawnPoint.tileIndex)
            console.log('meta::: ', meta)


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
        console.log('load existing dungeon');
        const meta = JSON.parse(sessionStorage.getItem('metadata'))
        const res = await loadDungeonRequest(dungeonId)
        const dungeon = JSON.parse(res.data[0].content)
        dungeon.id = res.data[0]._id;
        console.log('meta:', meta)
        this.props.boardManager.setDungeon(dungeon)
        this.props.boardManager.setCurrentLevel(dungeon.levels.find(l=> l.id === meta.location.levelId));
        this.props.boardManager.setCurrentOrientation(meta.location.orientation);
        this.props.boardManager.initializeTilesFromMap(meta.location.boardIndex, meta.location.tileIndex);
        
        this.setState(()=>{
            return {
                spawn: meta.location.tileIndex,
                tiles: this.props.boardManager.tiles,
            }
        })
    }
    render(){
        return (
        <div className="dungeon-container">
            {this.state.showMessage && <div className="message-panel">{this.state.showSaving ? 'saving...' : 'saved'}</div>}
            {this.props.boardManager.currentOrientation === 'B' && <div className="dark-mask"></div>}
            {this.props.showCoordinates && this.state.currentBoard && <div className="info-panel">{this.props.boardManager.currentBoard.name}</div>}
            <div  className="board" style={{
                width: this.state.boardSize+'px', height: this.state.boardSize+ 'px',
                backgroundColor: 'white'
                }}>
                {this.state.tiles && this.state.tiles.map((tile, i) => {
                    return <Tile 
                    key={i}
                    tileSize={this.state.tileSize}
                    image={tile.image ? tile.image : null}
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
        </div>
        )
    }
}

export default DungeonPage;