import React from 'react'
import '../styles/dungeon-board.scss'
import Tile from '../components/tile'
import {
    loadMapRequest, 
    loadAllMapsRequest, 
    loadAllDungeonsRequest,
    loadDungeonRequest
  } from '../utils/api-handler';

class DungeonPage extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            tileSize: 0,
            boardSize: 0,
            tiles: [],
            spawn: {}
        }
    }
    
    componentDidMount(){
        console.log('dungeon props: ', this.props)
        let tileSize = this.getTileSize(),
            boardSize = tileSize*15;
        this.initializeListeners();
        if(this.props.mapMaker){
            this.props.mapMaker.initializeTiles();
        }
        let arr = []
        for(let i = 0; i < 9; i++){
            arr.push([])
        }
        this.loadDungeon();
        // this.props.boardManager.initializeTilesFromMap();
        this.setState((state, props) => {
            return {
            tileSize,
            boardSize,
            // tiles: props.boardManager.tiles,
            }
        })
    }
    componentWillUnmount(){
        this.destroyListeners()
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

    // const [tileSize, setTileSize] = useState(() => {
    //     const h = Math.floor((window.innerHeight/17));
    //     const w = Math.floor((window.innerWidth/17));
    //     let tsize = 0;
    //     if(h < w){
    //         tsize = h;
    //       } else {
    //         tsize = w;
    //     }
    //     return tsize;
    // })
    // const [boardSize, setBoardSize] = useState(tileSize*15)

    
    // const [tiles, setTiles] = useState()

    handleResize() {
        const h = Math.floor((window.innerHeight/17));
        const w = Math.floor((window.innerWidth/17));
        let tsize = 0;
        if(h < w){
            tsize = h;
        } else {
            tsize = w;
        }
        this.setTileSize(tsize)
        this.setBoardSize(tsize*15)
    }
    

    // useEffect(() => {
    //     let mounted = true;
    //     if(mounted){
    //         window.addEventListener('resize', handleResize)
    //         loadDungeon()
    //     }
    //     if(props.boardManager){
    //         props.boardManager.initializeTiles();
    //         setTiles(props.boardManager.tiles)
    //     }
    //     return () => {
    //         mounted = false
    //     }
    // },[props.boardManager])
    initializeListeners = () => {
        window.addEventListener('keydown', this.keyDownHandler);
        // window.addEventListener('mouseup', this.mouseUpHandler);
        // window.addEventListener('resize', this.handleResize.bind(this));
    }
    destroyListeners(){
        window.removeEventListener('keydown', this.keyDownHandler)
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
        console.log('pp', id)
    }
    // const handleClick = (tile) => {
    //     console.log('clicked ', tile)
    // }

    loadDungeon = async () => {
        const val = await loadAllDungeonsRequest()
        console.log('val: ', val)
        let dungeons = [],
            spawnList = [],
            selectedDungeon,
            spawnPoint;
            
        val.data.forEach((e, i) => {
            let d = JSON.parse(e.content)
            d.id = e.id
            dungeons.push(d)
        })
        console.log('dungeons: ', dungeons)
        dungeons.forEach((v, i)=>{
            console.log('in for each')
            if(v.valid){
                console.log('valid dungeon: ', v)
                v.spawnPoints.forEach((s, i)=>{
                    spawnList.push(s)
                })
                let idx = Math.floor(Math.random()*spawnList.length);
                console.log('spawnPoints: ', spawnList, 'idx: ', idx)
                spawnPoint = spawnList[idx]
                selectedDungeon = v;
                return
            }
        })
        if(spawnPoint){
            console.log('in spawn point')
            console.log(selectedDungeon.miniboards[spawnPoint.boardIndex], spawnPoint.boardIndex, dungeons)
            this.props.boardManager.setDungeon(selectedDungeon)
            this.props.boardManager.initializeTilesFromMap(selectedDungeon.miniboards[spawnPoint.boardIndex], spawnPoint.tileIndex);
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
    render(){
        return (
        <div className="container">
            <div  className="board" style={{
                width: this.state.boardSize+'px', height: this.state.boardSize+ 'px',
                backgroundColor: 'white'
                }}>
                {this.state.tiles && this.state.tiles.map((tile, i) => {
                    return <Tile 
                    key={i}
                    tileSize={this.state.tileSize}
                    image={tile.image ? tile.image : null}
                    color={tile.color ? tile.color : 'lightgrey'}
                    coordinates={tile.coordinates}
                    index={tile.id}
                    showCoordinates={false}
                    editMode={false}
                    handleHover={this.handleHover}
                    type={tile.type}
                    >
                    </Tile>
                })}
            </div>
        </div>
        )
    }
}

export default DungeonPage;