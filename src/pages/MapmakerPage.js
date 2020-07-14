import React from 'react'
import '../styles/dungeon-board.scss'
import '../styles/map-maker.scss'
import Tile from '../components/tile'
import {addMapRequest, loadMapRequest, loadAllMapsRequest, updateMapRequest} from '../utils/api-handler';

class MapMakerPage extends React.Component {
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
      draggedMap: null,
      filterPanelOpen: false,
      adjacencyFilterPressed: false,
      adjacencyHoverIdx: null,
      adjacentTo: null
    };
  }

  componentDidMount(){
    console.log('component did mount')
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
    this.loadAllMaps();
    this.setState((state, props) => {
      return {
        tileSize,
        boardSize,
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

  initializeListeners = () => {
    window.addEventListener('mousedown', this.mouseDownHandler);
    window.addEventListener('mouseup', this.mouseUpHandler);
    window.addEventListener('resize', this.handleResize);
  }

  handleHover = (id, type) => {
    if(this.state.mouseDown && this.props.mapMaker.paletteTiles[this.state.pinnedOption] && this.props.mapMaker.paletteTiles[this.state.pinnedOption].optionType === 'void'){
      let tile = this.props.mapMaker.tiles[id];
      let pinned = null;
      if(this.props.mapMaker.paletteTiles[this.state.pinnedOption]){ 
        console.log('money')
        pinned = this.props.mapMaker.paletteTiles[this.state.pinnedOption]
      }
      if(pinned && pinned.optionType === 'void'){
        let arr = [...this.state.tiles]
        arr[tile.id].image = null;
        arr[tile.id].color = 'black';
        arr[tile.id].contains = 'void'

        console.log(arr[tile.id])
        this.setState({
          hoveredTileIdx: null,
          tiles: arr
        })
      } 
    }else{
      if(type === 'palette-tile'){
        this.setState({
          hoveredPaletteTileIdx: id
        })
      } else {
        this.setState({
          hoveredTileIdx: id
        })
      }
    }
  }
  
  mouseDownHandler = () => {
    this.setState({mouseDown: true})
  }
  mouseUpHandler = () => {
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
    this.setState({
      tileSize: tsize,
      boardSize: tsize*15
    })
  }
  
  handleClick = (tile) => {
    if(tile.type === 'palette-tile'){
      this.setState({
        optionClickedIdx: tile.id,
        pinnedOption: tile.id
      })
    } else if(tile.type === 'board-tile'){
      let pinned = null;
      if(this.props.mapMaker.paletteTiles[this.state.pinnedOption]){ 
        pinned = this.props.mapMaker.paletteTiles[this.state.pinnedOption]
      }
      if(pinned && pinned.optionType === 'void'){
        console.log('hmm')
        let arr = [...this.state.tiles];
        arr[tile.id].image = null;
        arr[tile.id].color = 'black'
        arr[tile.id].contains = 'void'
        console.log(arr[tile.id])
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
    map.tiles.forEach((t)=>{
      if(t.color === 'black'){
        t['contains'] = 'void'
      }
    })
    this.setState({
      loadedMap: map,
      tiles: map.tiles
    })
  }

  loadAllMaps = async () => {
    const val = await loadAllMapsRequest()
    let maps = [];
    val.data.forEach((e)=>{
      let map = JSON.parse(e.content)
      map.id = e.id;
      maps.push(map)
    })
    this.setState(() => {
      return {
        maps: maps
      }
    })
  }
  filterMapsClicked = () => {
    this.setState((state, props) => {
      return {filterPanelOpen: !state.filterPanelOpen}
    })
  }
  adjacencyClicked(){
    this.setState({
      adjacencyFilterPressed: true
    })
  }
  adjacencyHover(idx){
    if(this.state.adjacencyFilterPressed){
      this.setState({
        adjacencyHoverIdx: idx
      })
    }
  }
  adjacencyFilter(board, index){
    // console.log('ok now filter off this board for adjacency: ', board)
    // console.log('maps to filter: ', this.state.maps)
    this.props.mapMaker.filterMapAdjacency(board, index, this.state.maps)
    this.setState({
      adjacencyFilterPressed: false,
      adjacencyHoverIdx: null
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
          <div className="buttons-container" 
          style={{
            width: this.state.tileSize*3+'px',
            height: this.state.tileSize*2
          }}
          >
            <button
            onClick={() => {return console.log(this.state.loadedMap)}}
            style={{height: this.state.tileSize/2}}
            >Clear</button>
            <button
            onClick={() => {return this.writeMap()}}
            style={{height: this.state.tileSize/2}}
            >Save</button>
            <button
            onClick={() => {return this.loadMap()}}
            style={{height: this.state.tileSize/2}}
            >Load</button>
            <button
            onClick={() => {return this.filterMapsClicked()}}
            style={{height: this.state.tileSize/2}}
            >Filter</button>
          </div>
          <div className="filter-container" 
            style={{
              width: this.state.tileSize*3+'px',
              top: this.state.filterPanelOpen ? this.state.tileSize*2+'px' : 0
            }}
          >
            <button
            onClick={() => {return this.adjacencyClicked()}}
            style={{
              fontSize: '10px',
              backgroundColor: this.state.adjacencyFilterPressed ? 'lightgreen' : 'inherit'
            }}
            >Adjacent to...</button>
            <button
            onClick={() => {return this.writeMap()}}
            >Other</button>
            {/* <button
            onClick={() => {return this.loadMap()}}
            >3</button>
            <button
            onClick={() => {return this.filterMaps()}}
            >4</button> */}
          </div>
          <div 
          className="previews-container"
          style={{
            paddingTop: this.state.filterPanelOpen ? this.state.tileSize*2 : 0
          }}
          >
            {this.state.maps && this.state.maps.map((map, i) => {
              return (<div 
                        key={i}
                        style={{
                          // marginBottom: '10px',
                          // marginTop: '10px'
                        }}
                      >
                        <div 
                          className="map-preview draggable" 
                          
                          style={{
                            // height: (this.state.tileSize*3),
                            height: '156px',
                            boxSizing: 'border-box'
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
                                backgroundColor: 
                                this.state.hoveredSection === i ? 'lightgrey': 
                                (this.state.adjacencyHoverIdx === i ? 'lightgreen' : 'white')
                              }}
                              onDragOver={(event)=>this.onDragOver(event, i)}
                              onDrop={(event)=>{this.onDrop(event, i)}}
                              onMouseOver= {() => {
                                this.adjacencyHover(i)
                              }}
                              onClick={() => {
                                if(this.state.adjacencyHoverIdx === i && board.tiles){
                                  this.adjacencyFilter(board, i)
                                }
                              }}
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