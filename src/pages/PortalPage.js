import React, {useState, useEffect} from 'react'
import '../styles/dungeon-board.scss'
import Tile from '../components/tile'
import {useEventListener} from '../utils/useEventListener'
import {writeRequest, loadRequest, addMapRequest, loadMapRequest} from '../utils/api-handler';

export default function PortalPage(props) {
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
  const [hoveredTileIdx, setHover] = useState()

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
    if(props.mapMaker){
        props.mapMaker.initializeTiles();
        setTiles(props.mapMaker.tiles)
    }
  },[])

  const handleHover = (id) => {
    // props.mapMaker.setHovered(id)
    // let arr = [...props.mapMaker.tiles]
    setHover(id);
  }
  const handleClick = (id) => {
    console.log('clicked ', id)
    
  }
  const writeMap = () => {
    let obj = {
      something: 'oppooooyah bebey',
      twiddles: [1,2,3],
      nested: {
        child1: 'hi',
        child2: 'by1e'
      }
    }
    // writeRequest({message: JSON.stringify(obj)})
    addMapRequest(obj)
  }
  const loadMap = () => {
    // loadRequest({message: JSON.stringify(obj)})
    loadMapRequest(5)
  }
  return (
    <div className="container">
      <div 
      className="palette" 
      style={{
        width: tileSize*3+'px', height: boardSize+ 'px',
        backgroundColor: 'white',
        marginRight: '25px'
      }}
      >
        <button
        onClick={() => {return writeMap()}}
        >Write</button>
        <button
        onClick={() => {return loadMap()}}
        >Load</button>
      </div>

      <div 
      className="board" 
      style={{
          width: boardSize+'px', height: boardSize+ 'px',
          backgroundColor: 'white'
      }}
      onMouseLeave={() => {return setHover(null)}}
      >
          {tiles && tiles.map((tile, i) => {
              return <Tile 
              key={i}
              id={tile.id}
              tileSize={tileSize}
              image={tile.image ? tile.image : null}
              color={tile.color ? tile.color : 'lightgrey'}
              coordinates={tile.coordinates}
              index={tile.id}
              showCoordinates={false}
              editMode={true}
              handleHover={handleHover}
              handleClick={handleClick}
              hovered={
                hoveredTileIdx === tile.id ?
                true :
                false
              }
              >
              </Tile>
          })}
      </div>
      <div className="palette" style={{
          width: tileSize*3+'px', height: boardSize+ 'px',
          backgroundColor: 'white',
          marginLeft: '25px'
          }}>

      </div>
    </div>
  )
}