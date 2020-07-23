import React, {useState, useEffect} from 'react'
import '../styles/dungeon-board.scss'
import Tile from '../components/tile'
import {useEventListener} from '../utils/useEventListener'
import {
    loadMapRequest, 
    loadAllMapsRequest, 
    loadAllDungeonsRequest,
    loadDungeonRequest
  } from '../utils/api-handler';

export default function DungeonPage(props) {

    const [tileSize, setTileSize] = useState(() => {
        const h = Math.floor((window.innerHeight/17));
        const w = Math.floor((window.innerWidth/17));
        let tsize = 0;
        if(h < w){
            tsize = h;
          } else {
            tsize = w;
        }
        return tsize;
    })
    const [boardSize, setBoardSize] = useState(tileSize*15)

    
    const [tiles, setTiles] = useState()

    function handleResize() {
        const h = Math.floor((window.innerHeight/17));
        const w = Math.floor((window.innerWidth/17));
        let tsize = 0;
        if(h < w){
            tsize = h;
        } else {
            tsize = w;
        }
        setTileSize(tsize)
        setBoardSize(tsize*15)
    }
    

    useEffect(() => {
        let mounted = true;
        if(mounted){
            window.addEventListener('resize', handleResize)
            loadDungeon()
        }
        if(props.boardManager){
            props.boardManager.initializeTiles();
            setTiles(props.boardManager.tiles)
        }
        return () => {
            mounted = false
        }
    },[props.boardManager])

    const keyDownHandler = ({ key }) => {
        let newTiles = [];
        switch(key){
            case 'ArrowUp':
                // console.log('uhh', props.boardManager.moveUp())
                props.boardManager.moveUp();
                 newTiles = [...props.boardManager.tiles]
                setTiles(newTiles);
            break;
            case 'ArrowDown':
                props.boardManager.moveDown();
                 newTiles = [...props.boardManager.tiles]
                setTiles(newTiles);
            break;
            case 'ArrowLeft':
                props.boardManager.moveLeft();
                 newTiles = [...props.boardManager.tiles]
                setTiles(newTiles);
            break;
            case 'ArrowRight':
                props.boardManager.moveRight();
                newTiles = [...props.boardManager.tiles]
                setTiles(newTiles);
            break;
            default:
                console.log(key)
            break;
        }
    }
    //might need to put this function somewhere else so it doesnt fire on every rerender
    useEventListener('keydown', keyDownHandler);


    const handleHover = (id, type) => {
        console.log('pp', id)
    }
    // const handleClick = (tile) => {
    //     console.log('clicked ', tile)
    // }

    const loadDungeon = async () => {
        const val = await loadAllDungeonsRequest()
        console.log('val: ', val)
        let dungeons = [],
            spawnList = [],
            spawnPoint;
            
        val.data.forEach((e, i) => {
            let d = JSON.parse(e.content)
            d.id = e.id
            dungeons.push(d)
        })
        console.log('dungeons: ', dungeons)
        dungeons.forEach((v, i)=>{
            if(v.valid){
                console.log('valid dungeon: ', v)
                v.spawnPoints.forEach((s, i)=>{
                    spawnList.push(s)
                })
                let idx = Math.floor(Math.random()*spawnList.length);
                console.log('spawnPoints: ', spawnList, 'idx: ', idx)
                spawnPoint = spawnList[idx]
            }
        })

    }
    return (
    <div className="container">
        <div  className="board" style={{
            width: boardSize+'px', height: boardSize+ 'px',
            backgroundColor: 'white'
            }}>
            {tiles && tiles.map((tile, i) => {
                return <Tile 
                key={i}
                tileSize={tileSize}
                image={tile.image ? tile.image : null}
                color={tile.color ? tile.color : 'lightgrey'}
                coordinates={tile.coordinates}
                index={tile.id}
                showCoordinates={false}
                editMode={false}
                handleHover={handleHover}
                type={tile.type}
                >
                </Tile>
            })}
        </div>
    </div>
  )
}