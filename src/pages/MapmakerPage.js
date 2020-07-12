import React, {useState, useEffect} from 'react'
import '../styles/dungeon-board.scss'
import '../styles/map-maker.scss'
import Tile from '../components/tile'
import {addMapRequest, loadMapRequest, loadAllMapsRequest, updateMapRequest} from '../utils/api-handler';
import {useEventListener} from '../utils/useEventListener'

export default function MapmakerPage(props) {
  
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
  const [maps, setMaps] = useState([])
  const [loadedMap, setLoadedMap] = useState()
  const [hoveredTileIdx, setHover] = useState()
  const [hoveredPaletteTileIdx, setPaletteHover] = useState(null)
  const [optionClickedIdx, setOptionClicked] = useState(null)
  const [pinnedOption, setPinnedOption] = useState(null)
  const [mouseDown, setMouseDown] = useState(false)

  const initializeListeners = () => {
    // useEventListener('mousedown', mouseDownHandler);
    // useEventListener('mouseup', mouseUpHandler);
    // useEventListener('resize', handleResize);
  }

  useEffect(() => {
    console.log('in use effect')
    window.addEventListener('mousedown', mouseDownHandler)
    window.addEventListener('mouseup', mouseUpHandler)
    window.addEventListener('resize', handleResize)
    initializeListeners();
    if(props.mapMaker){
        props.mapMaker.initializeTiles();
        setTiles(props.mapMaker.tiles)
    }
    loadAllMaps()
  },[props.mapMaker])

  

  const handleHover = (id, type) => {
    if(mouseDown && props.mapMaker.paletteTiles[pinnedOption] && props.mapMaker.paletteTiles[pinnedOption].optionType === 'void'){
      console.log('chi', id)
      let tile = props.mapMaker.tiles[id]
      // handleClick(props.mapMaker.tiles[id])
      // setHover(null);
      // props.mapMaker.tiles[id].color = 'black'
      // setTiles(props.mapMaker.tiles) 


      let pinned = null;
      if(props.mapMaker.paletteTiles[pinnedOption]){ 
        console.log('money')
        pinned = props.mapMaker.paletteTiles[pinnedOption]
      }
      if(pinned && pinned.optionType === 'void'){
        console.log('hmm')
        setHover(null);
        props.mapMaker.tiles[tile.id].image = null;
        props.mapMaker.tiles[tile.id].color = 'black'
        console.log(props.mapMaker.tiles[tile.id])
        setTiles(props.mapMaker.tiles)
      } 
    }else{
      if(type === 'palette-tile'){
        setPaletteHover(id)
      } else {
        setHover(id);
      }
    }
  }
  
  const mouseDownHandler = () => {
    console.log('down')
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
    if(tile.type === 'palette-tile'){
      console.log(props.mapMaker.paletteTiles[tile.id])
      setOptionClicked(tile.id)
      setPinnedOption(tile.id)
    } else if(tile.type === 'board-tile'){
      console.log('boardtile')

      let pinned = null;
      if(props.mapMaker.paletteTiles[pinnedOption]){ 
        console.log('money')
        pinned = props.mapMaker.paletteTiles[pinnedOption]
      }
      if(pinned && pinned.optionType === 'void'){
        console.log('hmm')
        setHover(null);
        props.mapMaker.tiles[tile.id].image = null;
        props.mapMaker.tiles[tile.id].color = 'black'
        console.log(props.mapMaker.tiles[tile.id])
        setTiles(props.mapMaker.tiles)
      } else if(pinned){
        props.mapMaker.tiles[tile.id].image = pinned.image
        setHover(null);
        setTiles(props.mapMaker.tiles)
      }
    }
  }
  const writeMap = () => {
    if(loadedMap){
      let obj = {
        name: loadedMap.name,
        tiles: props.mapMaker.tiles
      }
      updateMapRequest(loadedMap.id, obj)
    } else {
      let d = new Date()
      let n = d.getTime();
      let rand = n.toString().slice(3,7)
      let obj = {
        name: 'map'+rand,
        tiles: props.mapMaker.tiles
      }
      addMapRequest(obj)
    }
    // writeRequest({message: JSON.stringify(obj)})
  }
  const loadMap = async (id) => {
    const val = await loadMapRequest(id)
    let e = val.data[0];
    let map = JSON.parse(e.content);
    map.id = e.id;
    setTiles(map.tiles)
    setLoadedMap(map)
  }

  const loadAllMaps = async () => {
    const val = await loadAllMapsRequest()
    let maps = [];
    val.data.forEach((e)=>{
      let map = JSON.parse(e.content)
      map.id = e.id;
      maps.push(map)
    })
    console.log('maps: ', maps)
    setMaps(maps)
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
        <div className="buttons-container">
          <button
          onClick={() => {return console.log(loadedMap)}}
          >Clear</button>
          <button
          onClick={() => {return writeMap()}}
          >Save</button>
          <button
          onClick={() => {return loadMap()}}
          >Load</button>
        </div>
        <div className="previews-container">
          {maps && maps.map((map, i) => {
            return (<div key={i}>
                      <div 
                        className="map-preview" 
                        
                        style={{
                          height: (tileSize*3)
                        }}
                        onClick={() => {return loadMap(map.id)}}
                      >
                      {map.tiles.map((tile, i) => {
                        return    <Tile 
                                  key={i}
                                  id={tile.id}
                                  tileSize={(tileSize*3)/15}
                                  image={tile.image ? tile.image : null}
                                  color={tile.color ? tile.color : 'lightgrey'}
                                  index={tile.id}
                                  showCoordinates={false}
                                  type={tile.type}
                                  hovered={
                                    false
                                  }
                                  >
                                  </Tile>
                                // <div 
                                // key={i} 
                                // style={{
                                //   height: (tileSize*3)/15,
                                //   width: (tileSize*3)/15
                                // }} 
                                // className="mini-tile"></div>
                                
                      })}
                      </div>
                      <div className="map-title">{map.name}</div>
                  </div>)
          })}
        </div>
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
              index={tile.id}
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