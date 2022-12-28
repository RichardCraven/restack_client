import React from 'react'
import '../styles/dungeon-board.scss'
import Tile from '../components/tile'
import {
    loadMapRequest, 
    loadAllMapsRequest, 
    loadAllDungeonsRequest,
    loadDungeonRequest,
    updateUserRequest
  } from '../utils/api-handler';

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
            intervalId: null
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
            // ^ why are you doing this
            

        }, 15000); 
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
                    tiles: newTiles
                })
                
            break;
            case 'ArrowDown':
                this.props.boardManager.moveDown();
                newTiles = [...this.props.boardManager.tiles]
                this.setState({
                    tiles: newTiles
                })
            break;
            case 'ArrowLeft':
                this.props.boardManager.moveLeft();
                newTiles = [...this.props.boardManager.tiles]
                this.setState({
                    tiles: newTiles
                })
            break;
            case 'ArrowRight':
                this.props.boardManager.moveRight();
                newTiles = [...this.props.boardManager.tiles]
                this.setState({
                    tiles: newTiles
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
        dungeons.forEach((v, i)=>{
            if(v.valid){
                v.spawnPoints.forEach((s, i)=>{
                    spawnList.push(s)
                })
                let idx = Math.floor(Math.random()*spawnList.length);
                spawnPoint = spawnList[idx]
                selectedDungeon = v;
                return
            }
        })
        if(spawnPoint){
            const meta = JSON.parse(sessionStorage.getItem('metadata'))
            const userId = sessionStorage.getItem('userId')
            meta.dungeonId = selectedDungeon.id
            meta.boardIndex = spawnPoint.boardIndex
            meta.tileIndex = spawnPoint.tileIndex
            const saveDungeon = await updateUserRequest(userId, meta)
            this.props.boardManager.setDungeon(selectedDungeon)
            this.props.boardManager.initializeTilesFromMap(spawnPoint.boardIndex, spawnPoint.tileIndex);
            this.setState(()=>{
                return {
                    spawn: spawnPoint,
                    tiles: this.props.boardManager.tiles,
                }
            })
        } else {
            alert('no valid dungeon!')
        }
    }
    loadExistingDungeon = async (dungeonId) => {
        const meta = JSON.parse(sessionStorage.getItem('metadata'))
        const res = await loadDungeonRequest(dungeonId)
        const dungeon = JSON.parse(res.data[0].content)
        dungeon.id = res.data[0]._id;
        this.props.boardManager.setDungeon(dungeon)
        this.props.boardManager.initializeTilesFromMap(meta.boardIndex, meta.tileIndex);
        this.setState(()=>{
            return {
                spawn: meta.tileIndex,
                tiles: this.props.boardManager.tiles,
            }
        })
    }
    render(){
        return (
        <div className="dungeon-container">
            {this.state.showMessage && <div className="message-panel">{this.state.showSaving ? 'saving...' : 'saved'}</div>}
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