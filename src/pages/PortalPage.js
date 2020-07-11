import React, {useState, useEffect} from 'react'
import '../styles/dungeon-board.scss'
import '../styles/map-maker.scss'
import Tile from '../components/tile'
import {addMapRequest, loadMapRequest} from '../utils/api-handler';
import {useEventListener} from '../utils/useEventListener'

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
  const [hoveredPaletteTileIdx, setPaletteHover] = useState(null)
  const [optionClickedIdx, setOptionClicked] = useState(null)
  const [pinnedOption, setPinnedOption] = useState(null)
  const [mouseDown, setMouseDown] = useState(false)

  useEffect(() => {
    console.log('in use effect')
    // window.addEventListener('resize', handleResize)
    if(props.mapMaker){
        props.mapMaker.initializeTiles();
        setTiles(props.mapMaker.tiles)
    }
  },[props.mapMaker])

  const handleHover = (id, type) => {
    
    // if(mouseDown && props.mapMaker.paletteTiles[pinnedOption] && props.mapMaker.paletteTiles[pinnedOption].optionType === 'void'){
      console.log('chi', id)
      setHover(null);
      props.mapMaker.tiles[id].color = 'black'
      setTiles(props.mapMaker.tiles) 
    // }else{
    //   if(type === 'palette-tile'){
    //     setPaletteHover(id)
    //   } else {
    //     setHover(id);
    //   }
    // }
  }
  
  const mouseDownHandler = () => {
    setMouseDown(true)
  }
  const mouseUpHandler = () => {
    setMouseDown(false)
  }
  
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
  
  const handleClick = (tile) => {
    console.log('clicked ', tile)
    if(tile.type === 'palette-tile'){
      console.log(props.mapMaker.paletteTiles[tile.index])
      setOptionClicked(tile.index)
      setPinnedOption(tile.index)
    } else if(tile.type === 'board-tile'){
      let pinned = null;
      if(props.mapMaker.paletteTiles[pinnedOption]){ 
        pinned = props.mapMaker.paletteTiles[pinnedOption]
      }
      if(pinned && pinned.optionType === 'void'){
        setHover(null);
        props.mapMaker.tiles[tile.index].color = 'black'
        setTiles(props.mapMaker.tiles)
      } else if(pinned){
        // console.log(tile, props.mapMaker.paletteTiles[pinnedOption])
        props.mapMaker.tiles[tile.index].image = pinned.image
        setHover(null);
        setTiles(props.mapMaker.tiles)
      }
    }
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
    loadMapRequest(5)
  }

  useEventListener('mousedown', mouseDownHandler);
  useEventListener('mouseup', mouseUpHandler);
  useEventListener('resize', handleResize);


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
              type={tile.type}
              hovered={
                // hoveredTileIdx === tile.id ?
                // true :
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
          }}
          onMouseLeave={() => {
            if(optionClickedIdx === null){
              return setPaletteHover(null)
            }

          }}
          >
            {props.mapMaker.paletteTiles && props.mapMaker.paletteTiles.map((tile, i) => {
              return (
                <div key={i} className="palette-options-pane">
                  <div className="palette-option-container"
                    style={{
                      backgroundImage: optionClickedIdx === i ? 'linear-gradient(90deg, transparent, black)' : 'none'
                    }}
                  >
                    <Tile 
                    id={tile.id}
                    tileSize={tileSize}
                    image={tile.image ? tile.image : null}
                    color={tile.color ? tile.color : 'apricot'}
                    coordinates={tile.coordinates}
                    index={tile.id}
                    showCoordinates={false}
                    editMode={true}
                    handleHover={handleHover}
                    handleClick={handleClick}
                    type={tile.type}
                    hovered={
                      hoveredPaletteTileIdx === tile.id ?
                      true :
                      false
                    }
                    >
                    </Tile>
                    <div className={`
                      text-container
                      ${hoveredPaletteTileIdx === tile.id ? 'hovered' : ''}
                      ${pinnedOption === tile.id ? 'pinned' : ''}
                      `
                      }>
                      <span
                      style={{
                        color: optionClickedIdx === i ? 'white' : 'black'
                      }}
                      >{tile.optionType}</span>
                    </div>
                  </div>
                </div>
              )
          })}
      </div>
    </div>
  )
}