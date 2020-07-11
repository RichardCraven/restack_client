import React, {useState, useEffect} from 'react'
import '../styles/dungeon-board.scss'
import Tile from '../components/tile'
import {useEventListener} from '../utils/useEventListener'

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
        window.addEventListener('resize', handleResize)
        if(props.boardManager){
            props.boardManager.initializeTiles();
            setTiles(props.boardManager.tiles)
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
    useEventListener('keydown', keyDownHandler);


    const handleHover = (id, type) => {
        console.log('pp', id)
    }
    const handleClick = (tile) => {
        console.log('clicked ', tile)
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