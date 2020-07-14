import React, {useState, useEffect} from 'react'
import '../styles/dungeon-board.scss'
import '../styles/map-maker.scss'
import Tile from '../components/tile'
import {addMapRequest, loadMapRequest, loadAllMapsRequest, updateMapRequest} from '../utils/api-handler';
// import {useEventListener} from '../utils/useEventListener'
// import { useHistory } from "react-router";

class MapMakerPage extends React.Component {
  // const history = useHistory();
  constructor(props){
    super(props)
    this.state = {
      tileSize: 0,
      boardSize: 0,
      maps : [],
      miniBoards: [],
      loadedMap: null,
      hoveredTileIdx: null,
      hoveredPaletteTileIdx: null,
      optionClickedIdx: null,
      pinnedOption: null,
      mouseDown: false,
      toastMessage: null,
      mapView: true,
      hoveredSection: null,
      draggedMap: null
    };
    // console.log('Map Maker Page props: ', this.props)
  }

  componentDidMount(){
    console.log('component did mount')
    let tileSize = this.getTileSize(),
        boardSize = tileSize*15;
    this.initializeListeners();
    if(this.props.mapMaker){
      this.props.mapMaker.initializeTiles();
      // setTiles(props.mapMaker.tiles)
    }
    let arr = []
    for(let i = 0; i < 9; i++){
      arr.push([])
    }
    this.loadAllMaps();
    this.setState((state, props) => {
      return {
        tileSize,
        boardSize,
        // maps,
        tiles: props.mapMaker.tiles,
        miniBoards: arr
      }
    })
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
  //   const h = Math.floor((window.innerHeight/17));
  //   const w = Math.floor((window.innerWidth/17));
  //   let tsize = 0;
  //   if(h < w){
  //       tsize = h;
  //     } else {
  //       tsize = w;
  //   }
  //   return tsize;
  // })
  // const [boardSize, setBoardSize] = useState(tileSize*15)
  // const [tiles, setTiles] = useState()
  // const [maps, setMaps] = useState([])
  // const [loadedMap, setLoadedMap] = useState()
  // const [hoveredTileIdx, setHover] = useState()
  // const [hoveredPaletteTileIdx, setPaletteHover] = useState(null)
  // const [optionClickedIdx, setOptionClicked] = useState(null)
  // const [pinnedOption, setPinnedOption] = useState(null)
  // const [mouseDown, setMouseDown] = useState(false)

  initializeListeners = () => {
    window.addEventListener('mousedown', this.mouseDownHandler);
    window.addEventListener('mouseup', this.mouseUpHandler);
    window.addEventListener('resize', this.handleResize);
  }

  // useEffect(() => {
  //   console.log('in use effect')
  //   let mounted = true;
  //   if(mounted){
  //     initializeListeners();
  //     if(props.mapMaker){
  //       props.mapMaker.initializeTiles();
  //       setTiles(props.mapMaker.tiles)
  //     }
      
  //     window.addEventListener('mousedown', mouseDownHandler)
  //     window.addEventListener('mouseup', mouseUpHandler)
  //     window.addEventListener('resize', handleResize)
  //     loadAllMaps()
  //   }
  //   return () => mounted = false;
  // },[props.mapMaker])

  

  handleHover = (id, type) => {
    if(this.state.mouseDown && this.props.mapMaker.paletteTiles[this.state.pinnedOption] && this.props.mapMaker.paletteTiles[this.state.pinnedOption].optionType === 'void'){
      let tile = this.props.mapMaker.tiles[id];
      let pinned = null;
      if(this.props.mapMaker.paletteTiles[this.state.pinnedOption]){ 
        console.log('money')
        pinned = this.props.mapMaker.paletteTiles[this.state.pinnedOption]
      }
      if(pinned && pinned.optionType === 'void'){
        console.log('hmm')
        // setHover(null);
        let arr = [...this.state.tiles]
        arr[tile.id].image = null;
        arr[tile.id].color = 'black';
        arr[tile.id].contains = 'void'

        console.log(arr[tile.id])
        // setTiles(props.mapMaker.tiles)
        this.setState({
          hoveredTileIdx: null,
          tiles: arr
        })
      } 
    }else{
      if(type === 'palette-tile'){
        // setPaletteHover(id)
        this.setState({
          hoveredPaletteTileIdx: id
        })
      } else {
        // setHover(id);
        this.setState({
          hoveredTileIdx: id
        })
      }
    }
  }
  
  mouseDownHandler = () => {
    // console.log('down')
    // setMouseDown(true)
    this.setState({mouseDown: true})
  }
  mouseUpHandler = () => {
    // setMouseDown(false)
    this.setState({mouseDown: false})
  }
  
  handleResize() {
    const h = Math.floor((window.innerHeight/17));
    const w = Math.floor((window.innerWidth/17));
    let tsize = 0;
    if(h < w){
        tsize = h;
    } else {
        tsize = w;
    }
    // setTileSize(tsize)
    // setBoardSize(tsize*15)
    this.setState({
      tileSize: tsize,
      boardSize: tsize*15
    })
  }
  
  handleClick = (tile) => {
    if(tile.type === 'palette-tile'){
      // console.log(this.props.mapMaker.paletteTiles[tile.id])
      // setOptionClicked(tile.id)
      // setPinnedOption(tile.id)
      this.setState({
        optionClickedIdx: tile.id,
        pinnedOption: tile.id
      })
    } else if(tile.type === 'board-tile'){
      // console.log('boardtile')

      let pinned = null;
      if(this.props.mapMaker.paletteTiles[this.state.pinnedOption]){ 
        // console.log('money')
        pinned = this.props.mapMaker.paletteTiles[this.state.pinnedOption]
      }
      if(pinned && pinned.optionType === 'void'){
        console.log('hmm')
        // setHover(null);
        let arr = [...this.state.tiles];
        arr[tile.id].image = null;
        arr[tile.id].color = 'black'
        arr[tile.id].contains = 'void'
        console.log(arr[tile.id])
        // setTiles(state.tiles)
        this.setState({
          tiles: arr,
          hoveredTileIdx: null
        })
      } else if(pinned){
        let arr = [...this.state.tiles];
        arr[tile.id].image = pinned.image
        this.setState({
          tiles: arr,
          hoveredTileIdx: null
        })
      }
    }
  }
  setHover(id){
    this.setState({
      hoveredTileIdx: id
    })
  }
  setPaletteHover(id){
    this.setState({
      hoveredPaletteTileIdx: id
    })
  }
  getMapConfiguration(){
    
  }
  writeMap = async () => {
    // console.log('wrting with: ', this.state.tiles)
    const config = this.props.mapMaker.getMapConfiguration(this.state.tiles)
    if(this.state.loadedMap){
      let obj = {
        name: this.state.loadedMap.name,
        tiles: this.state.tiles,
        config
      }
      await updateMapRequest(this.state.loadedMap.id, obj);
      this.loadAllMaps(); 
      this.toast('Map Saved')
    } else {
      let d = new Date()
      let n = d.getTime();
      let rand = n.toString().slice(3,7)
      let obj = {
        name: 'map'+rand,
        tiles: this.state.tiles,
        config
      }
      await addMapRequest(obj)
      this.loadAllMaps(); 
      this.toast('Map Saved')
    }
    // writeRequest({message: JSON.stringify(obj)})
  }
  toast(msg){
    console.log('in toast')
    this.setState({
      toastMessage: msg
    })
    setTimeout(() => {
      this.setState({
        toastMessage: null
      })
    }, 2000)
  }
  loadMap = async (id) => {
    const val = await loadMapRequest(id)
    let e = val.data[0];
    let map = JSON.parse(e.content);
    map.id = e.id;
    // setTiles(map.tiles)
    // setLoadedMap(map)
    map.tiles.forEach((t)=>{
      if(t.color === 'black'){
        t['contains'] = 'void'
      }
    })
    let boards = [...this.state.miniBoards]
    boards[4] = map;
    this.setState({
      loadedMap: map,
      tiles: map.tiles,
      miniBoards: boards
    })
    console.log(this.state.tiles)
    console.log('miniboards: ', this.state.miniBoards)
  }

  loadAllMaps = async () => {
    const val = await loadAllMapsRequest()
    let maps = [];
    val.data.forEach((e)=>{
      let map = JSON.parse(e.content)
      map.id = e.id;
      maps.push(map)
    })
    console.log('now maps are ', maps)
    this.setState(() => {
      return {
        maps: maps
      }
    })
  }

  // Drag and Drop code
  onDragStart = (event, map) => {
    console.log('dragstart on div: ', map);
    // event.dataTransfer.setData("taskName", taskName);
    this.setState({
      draggedMap: map
    })
  }
  onDragOver = (event, i) => {
    // console.log('section id: ', i)
    if(this.state.hoveredSection !== i){
      this.setState({
        hoveredSection: i
      })
    }
      event.preventDefault();
  }

  onDrop = (event, id) => {
    console.log('miniboard id: ', id)
    let sections = [...this.state.miniBoards]
    // section = sections[id]
    if(this.state.draggedMap){
      sections[id] = this.state.draggedMap
      // console.log(section)
      // console.log()
      console.log('inside', sections)
    }
    this.setState({
      hoveredSection: null,
      draggedMap: null,
      miniBoards: sections
    })
  }


  render (){
    return (
      <div className="container">
        {this.state.toastMessage && <div className="toast-pane">
          {this.state.toastMessage}
        </div>}
        <button
            className="view-toggle-button"
            onClick={() => {
              return this.setState((state, props) => {
                return {mapView: !state.mapView}
              })
            }}
            >{this.state.mapView === true ? 'Dungeon View' : 'Map View'}
        </button>
        <div 
        className="palette" 
        style={{
          width: this.state.tileSize*3+'px', height: this.state.boardSize+ 'px',
          backgroundColor: 'white',
          marginRight: '25px'
        }}
        > 
          <div className="buttons-container">
            <button
            onClick={() => {return console.log(this.state.loadedMap)}}
            >Clear</button>
            <button
            onClick={() => {return this.writeMap()}}
            >Save</button>
            <button
            onClick={() => {return this.loadMap()}}
            >Load</button>
          </div>
          <div className="previews-container">
            {this.state.maps && this.state.maps.map((map, i) => {
              return (<div 
                        key={i}
                        style={{
                          marginBottom: '10px',
                          marginTop: '10px'
                        }}
                      >
                        <div 
                          className="map-preview draggable" 
                          
                          style={{
                            height: (this.state.tileSize*3)
                          }}
                          onClick={() => {return this.loadMap(map.id)}}
                          onDragStart = {(event) => this.onDragStart(event, map)}
                          draggable
                        >
                        {map.tiles.map((tile, i) => {
                          return    <Tile 
                                    key={i}
                                    id={tile.id}
                                    tileSize={(this.state.tileSize*3)/15}
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
            width: this.state.boardSize+'px', height: this.state.boardSize+ 'px',
            backgroundColor: 'white'
        }}
        onMouseLeave={() => {return this.setHover(null)}}
        >
            {this.state.mapView && this.state.tiles && this.state.tiles.map((tile, i) => {
                return <Tile 
                key={i}
                id={tile.id}
                index={tile.id}
                tileSize={this.state.tileSize}
                image={tile.image ? tile.image : null}
                color={tile.color ? tile.color : 'lightgrey'}
                coordinates={tile.coordinates}
                showCoordinates={false}
                editMode={true}
                handleHover={this.handleHover}
                handleClick={this.handleClick}
                type={tile.type}
                hovered={
                  this.state.hoveredTileIdx === tile.id ?
                  true :
                  false
                }
                >
                </Tile>
            })}

            {!this.state.mapView && 
              <div className="mini-boards-container">
                {this.state.miniBoards && this.state.miniBoards.map((board, i) => {
                      return  <div 
                              className="mini-board board" 
                              key={i}
                              style={{
                                height: (this.state.tileSize*15)/3-2+'px',
                                width: (this.state.tileSize*15)/3-2+'px',
                                backgroundColor: this.state.hoveredSection === i ? 'lightgrey': 'white'
                              }}
                              onDragOver={(event)=>this.onDragOver(event, i)}
                              onDrop={(event)=>{this.onDrop(event, i)}}
                              >
                                {board.tiles && board.tiles.map((tile, i) => {
                                  return <Tile
                                  key={i}
                                  id={i}
                                  tileSize={((this.state.tileSize*15)/3-2)/15}
                                  image={tile.image ? tile.image : null}
                                  color={tile.color ? tile.color : 'apricot'}
                                  coordinates={tile.coordinates}
                                  index={tile.id}
                                  showCoordinates={false}
                                  editMode={true}
                                  handleHover={null}
                                  handleClick={null}
                                  type={tile.type}
                                  hovered={
                                    false
                                  }
                                  />
                                })}
                              </div>
                
            
                })}
              </div>
            }
              
        </div>
        <div className="palette" style={{
            width: this.state.tileSize*3+'px', height: this.state.boardSize+ 'px',
            backgroundColor: 'white',
            marginLeft: '25px'
            }}
            onMouseLeave={() => {
              if(this.state.optionClickedIdx === null){
                return this.setPaletteHover(null)
              }
  
            }}
            >
              {this.props.mapMaker.paletteTiles && this.props.mapMaker.paletteTiles.map((tile, i) => {
                return (
                  <div key={i} className="palette-options-pane">
                    <div className="palette-option-container"
                      style={{
                        backgroundImage: this.state.optionClickedIdx === i ? 'linear-gradient(90deg, transparent, black)' : 'none'
                      }}
                      onMouseOver={() => this.setPaletteHover(i)}
                      onClick={() => {
                        this.handleClick({
                          type: 'palette-tile',
                          id: i
                        })
                      }}
                    >
                      <Tile 
                      id={tile.id}
                      tileSize={this.state.tileSize}
                      image={tile.image ? tile.image : null}
                      color={tile.color ? tile.color : 'apricot'}
                      coordinates={tile.coordinates}
                      index={tile.id}
                      showCoordinates={false}
                      editMode={true}
                      handleHover={null}
                      handleClick={null}
                      type={tile.type}
                      hovered={
                        this.state.hoveredPaletteTileIdx === tile.id ?
                        true :
                        false
                      }
                      >
                      </Tile>
                      <div className={`
                        text-container
                        ${this.state.hoveredPaletteTileIdx === tile.id ? 'hovered' : ''}
                        ${this.state.pinnedOption === tile.id ? 'pinned' : ''}
                        `
                        }>
                        <span
                        style={{
                          color: this.state.optionClickedIdx === i ? 'white' : 'black'
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


}

export default MapMakerPage;