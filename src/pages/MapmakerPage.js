import React from 'react'
import '../styles/dungeon-board.scss'
import '../styles/map-maker.scss'
import Tile from '../components/tile'
import {
  addMapRequest, 
  loadMapRequest, 
  loadAllMapsRequest, 
  updateMapRequest, 
  deleteMapRequest, 
  loadAllDungeonsRequest,
  loadDungeonRequest,
  addDungeonRequest,
  deleteDungeonRequest,
  updateDungeonRequest
} from '../utils/api-handler';

class MapMakerPage extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      tileSize: 0,
      boardSize: 0,
      maps : [],
      dungeons: [],
      miniboards: [],
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
      showCoordinates: false,
      filterPanelOpen: false,
      adjacencyFilterOn: false,
      adjacencyFilterSet: false,
      adjacencyFilterHover: false,
      nameFilterOn: false,
      adjacencyHoverIdx: null,
      adjacentTo: null,
      showDeleteMaps: false,
      showMapInputs: true,
      dungeonName: 'dungeon name',
      mapName: 'map name',
      nameFilterHover: false,
      compatibilityMatrix: {
        show: false,
        showLeft: false,
        showRight: false,
        showTop: false,
        showBot: false
      }
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
    this.loadAllDungeons();
    this.setState((state, props) => {
      return {
        tileSize,
        boardSize,
        tiles: props.mapMaker.tiles,
        miniboards: arr
      }
    })
  }
  // componentDidUpdate(){
  //   console.log('update')
  //   console.log(this.state.showCoordinates)
  // }
  toggleCoords = () => {
    this.setState((state) => {
      return {
        showCoordinates: !state.showDeleteMaps
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
    window.addEventListener('resize', this.handleResize.bind(this));
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
    console.log('resize this is ', this)
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
        this.setState({
          tiles: arr,
          hoveredTileIdx: null
        })
      } if(pinned && pinned.optionType === 'delete'){
        console.log('delete')
        let arr = [...this.state.tiles];
        arr[tile.id].image = null;
        arr[tile.id].color = null;
        arr[tile.id].contains = null;
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

  // Map CRUD methods
  writeMap = async () => {
    const config = this.props.mapMaker.getMapConfiguration(this.state.tiles)
    if(this.state.loadedMap){
      let obj = {
        name: this.state.mapName,
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
        name: this.state.mapName === 'map name' ? 'map'+rand : this.state.mapName,
        tiles: this.state.tiles,
        config
      }
      await addMapRequest(obj)
      this.loadAllMaps(); 
      this.toast('Map Saved')
    }
    // writeRequest({message: JSON.stringify(obj)})
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
      mapName: map.name,
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
  clearLoadedMap(){
    let arr = [...this.state.tiles]
    for(let t of arr){
      t.image = null;
      t.contains = null;
      t.color = null
    }

    let miniboards = []
    for(let i = 0; i < 9; i++){
      miniboards.push([])
    }

    this.setState({
      loadedMap: null,
      tiles: arr,
      miniboards
    })
  }
  deleteMap = async () => {
    if(this.state.loadedMap){
      const res = await deleteMapRequest(this.state.loadedMap.id);
      console.log('delete res is', res)
      this.clearLoadedMap();
      this.loadAllMaps(); 
      this.toast('Map Deleted')
    }
  }
  

  // Dungeon CRUD Methods

  writeDungeon = async () => {
    if(this.state.loadedDungeon){
      console.log('im where I should be', this.state.dungeonName)
      let obj = {
        name: this.state.dungeonName,
        miniboards: this.state.miniboards
      }
      await updateDungeonRequest(this.state.loadedDungeon.id, obj);
      this.loadAllDungeons(); 
      this.toast('Dungeon Saved')
    } else {
      let d = new Date()
      let n = d.getTime();
      let rand = n.toString().slice(3,7)
      let obj = {
        name: this.state.dungeonName === 'dungeon name' ? 'dungeon'+rand : this.state.dungeonName,
        miniboards: this.state.miniboards
      }
      const res = await addDungeonRequest(obj);
      console.log('save dungeon res: ', res)
      this.toast('Dungeon Saved')
      this.loadAllDungeons(); 
    }
  }
  loadAllDungeons = async () => {
    const val = await loadAllDungeonsRequest()
    let dungeons = [];
    val.data.forEach((e)=>{
      let dungeon = JSON.parse(e.content)
      dungeon.id = e.id;
      dungeons.push(dungeon)
    })
    console.log('load all dungeons: ', dungeons)
    this.setState(() => {
      return {
        dungeons: dungeons
      }
    })
  }
  loadDungeon = async (id) => {
    const val = await loadDungeonRequest(id)
    let e = val.data[0];
    let dungeon = JSON.parse(e.content);
    
    dungeon.id = e.id;
    console.log('loaded dungeon val is ', dungeon)
    let miniboards = [];
    dungeon.miniboards.forEach((miniboard)=>{
      miniboards.push(miniboard)
    })
    this.setState({
      loadedDungeon: dungeon,
      dungeonName: dungeon.name,
      miniboards
    })
  }
  loadAllDungeons = async () => {
    const val = await loadAllDungeonsRequest()
    let dungeons = [];
    val.data.forEach((e)=>{
      let dungeon = JSON.parse(e.content)
      dungeon.id = e.id;
      dungeons.push(dungeon)
    })
    this.setState(() => {
      return {
        dungeons
      }
    })
  }
  deleteDungeon = async () => {
    if(this.state.loadedDungeon){
      const res = await deleteDungeonRequest(this.state.loadedDungeon.id);
      console.log('delete res is', res)
      this.clearLoadedDungeon();
      this.loadAllDungeons(); 
      this.toast('Dungeon Deleted')
    }
  }
  clearLoadedDungeon(){
    let miniboards = []
    for(let i = 0; i < 9; i++){
      miniboards.push([])
    }
    this.setState({
      loadedDungeon: null,
      dungeonName: null,
      miniboards
    })
  }

  // Filter methods

  filterMapsClicked = () => {
    this.setState((state, props) => {
      return {filterPanelOpen: !state.filterPanelOpen}
    })
  }
  adjacencyFilterClicked = () => {
    if(this.state.adjacencyFilterSet){
      this.setState((state) => {
        return {
          adjacencyFilterOn: !state.adjacencyFilterOn,
          adjacencyFilterSet: false
        }
      })
    } else {
      this.setState((state) => {
        return {
          adjacencyFilterOn: !state.adjacencyFilterOn
        }
      })
    }
  }
  nameFilterClicked = () => {
    let maps;
    if(!this.state.nameFilterOn){
    // ^ this is opposite because the sort would happen before the state change toggle
    // alternatively this could have been put inside a setTimeout, but I'd prefer to have 
    // only one setState in this function
      maps = this.state.maps.sort(function(a,b){
        return a.name > b.name ? 1 : -1
      })
    } else {
      maps = this.state.maps.sort(function(a,b){
        return a.id > b.id ? 1 : -1
      })
    }
    this.setState((state) => {
      return {
        maps,
        nameFilterOn: !this.state.nameFilterOn
      }
    })
  }
  adjacencyHover(idx){
    if(this.state.adjacencyFilterOn && this.state.adjacencyFilterSet === false){
      this.setState({
        adjacencyHoverIdx: idx
      })
    }
  }
  adjacencyFilter(board, index){
    let matrix = this.props.mapMaker.filterMapAdjacency(board, index, this.state.maps)
    console.log('compatibility: ', matrix)
    this.setState({
      // adjacencyFilterOn: false,
      // adjacencyHoverIdx: null
      compatibilityMatrix: matrix
    })
    setTimeout(()=> {
      this.filterByAdjacency();
    })
  }
  filterByAdjacency = () => {
    console.log('current compat matrix: ', this.state.compatibilityMatrix)
    let left, right, top, bot;
    if(this.state.compatibilityMatrix.left.length > 0){
      left = [];
      this.state.compatibilityMatrix.left.forEach((id) => {
        left.push(this.state.maps.find(e => e.id === id))
      })
    }
    if(this.state.compatibilityMatrix.right.length > 0){
      right = [];
      this.state.compatibilityMatrix.right.forEach((id) => {
        right.push(this.state.maps.find(e => e.id === id))
      })
    }
    if(this.state.compatibilityMatrix.top.length > 0){
      top = [];
      this.state.compatibilityMatrix.top.forEach((id) => {
        top.push(this.state.maps.find(e => e.id === id))
      })
    }
    if(this.state.compatibilityMatrix.bot.length > 0){
      bot = [];
      this.state.compatibilityMatrix.bot.forEach((id) => {
        bot.push(this.state.maps.find(e => e.id === id))
      })
    }
    const updatedMatrix = {
      show: true,
      left: left ? left : [],
      showLeft: left ? true : false,
      right: right ? right : [],
      showRight: right ? true : false,
      top: top ? top : [],
      showTop: top ? true : false,
      bot: bot ? bot : [],
      showBot: bot ? true : false,
    }
    this.setState((state) => {
      return {
        adjacencyFilterSet: true,
        compatibilityMatrix: updatedMatrix
      }
    })
  }
  collapseFilterHeader = (header) => {
    switch(header){
      case 'left':
        this.setState(state => ({
          compatibilityMatrix: {...state.compatibilityMatrix,
            showLeft: !state.compatibilityMatrix.showLeft
          }
        }))
      break;
      case 'right':
        this.setState(state => ({
          compatibilityMatrix: {...state.compatibilityMatrix,
            showRight: !state.compatibilityMatrix.showRight
          }
        }))
      break;
      case 'top':
        this.setState(state => ({
          compatibilityMatrix: {...state.compatibilityMatrix,
            showTop: !state.compatibilityMatrix.showTop
          }
        }))
      break;
      case 'bot':
        this.setState(state => ({
          compatibilityMatrix: {...state.compatibilityMatrix,
            showTop: !state.compatibilityMatrix.showTop
          }
        }))
      break;
      default:
      break;
    }
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
    let minis = [...this.state.miniboards]
    minis[id] = [];
    this.setState({
      miniboards: minis
    })
    
    setTimeout(()=>{
      let sections = [...this.state.miniboards]
      if(this.state.draggedMap){
        sections[id] = this.state.draggedMap
      }
      this.setState({
        hoveredSection: null,
        miniboards: [...sections]
      })
    })
  }

  handleInputChange = (e, inputType) => {
    if(inputType === 'map-name'){
      this.setState({
        mapName: e.target.value
      })
    } else {
      this.setState({
        dungeonName: e.target.value
      })
    }
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
              return this.setState((state) => {
                return {mapView: !state.mapView}
              })
            }}
            >{this.state.mapView === true ? 'Switch to Dungeon View' : 'Switch to Map View'}
        </button>
        {this.state.showMapInputs && <div style={{
            position: 'absolute',
            top: '2%',
            left: '20%',
          }} className="map-inputs-pane">
        </div>}
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
            onClick={() => {return this.clearLoadedMap()}}
            style={{height: this.state.tileSize/2}}
            >Clear</button>
            <button
            onClick={() => {return this.writeMap()}}
            style={{height: this.state.tileSize/2}}
            >Save</button>
            <button
            onClick={() => {return this.deleteMap()}}
            style={{height: this.state.tileSize/2}}
            >Delete</button>
            <button
            onClick={() => {return this.filterMapsClicked()}}
            style={{height: this.state.tileSize/2}}
            >Filter</button>
          </div>
          <div className="filter-container" 
            style={{
              width: this.state.tileSize*3+'px',
              height: this.state.tileSize*2,
              top: this.state.filterPanelOpen ? this.state.tileSize*2+'px' : 0
            }}
          >
            <button
            onClick={() => {return this.adjacencyFilterClicked()}}
            onMouseEnter={() => { return this.setState({adjacencyFilterHover: true})}}
            onMouseLeave={() => { return this.setState({adjacencyFilterHover: false})}}
            style={{
              fontSize: '10px',
              backgroundColor: this.state.adjacencyFilterOn ? 'lightgreen' : 
              (this.state.adjacencyFilterHover ? 'lightblue' : 'inherit')
            }}
            >Adjacent to...</button>
            <button
            onClick={() => {return this.nameFilterClicked()}}
            onMouseEnter={() => { return this.setState({nameFilterHover: true})}}
            onMouseLeave={() => { return this.setState({nameFilterHover: false})}}
            style = {{
              backgroundColor: this.state.nameFilterOn ? 'lightgreen' : 
              (this.state.nameFilterHover ? 'lightblue' : 'inherit')
            }}
            >Name</button>
          </div>
          <div 
          className="previews-container"
          style={{
            paddingTop: this.state.filterPanelOpen ? this.state.tileSize*2 : 0
          }}
          >
            {this.state.maps && this.state.compatibilityMatrix.show === false && this.state.maps.map((map, i) => {
              return (<div 
                        key={i}
                      >
                        <div 
                          className="map-preview draggable" 
                          
                          style={{
                            height: this.state.tileSize*3,
                            boxSizing: 'border-box'
                          }}
                          onClick={() => {
                            if(this.state.mapView){
                              return this.loadMap(map.id)
                            }
                          }}
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
                                  
                        })}
                        </div>
                        <div className="map-title">{map.name}</div>
                    </div>)
            })}
            {this.state.compatibilityMatrix && this.state.compatibilityMatrix.show === true && 
             <div className="compatibility-matrix-container">
               {this.state.compatibilityMatrix.left.length > 0 && <div className="left">
                 <span onClick={() => {return this.collapseFilterHeader('left')}} className="adjacency-filter-header">LEFT</span> 
                 {this.state.compatibilityMatrix.showLeft && this.state.compatibilityMatrix.left.map((map,i)=>{
                   return (<div 
                    key={i}
                    >
                    <div 
                      className="map-preview draggable" 
                      
                      style={{
                        height: this.state.tileSize*3,
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
                      })}
                      </div>
                      <div className="map-title">{map.name}</div>
                    </div>)
                 })}
                 </div>}
               {this.state.compatibilityMatrix.right.length > 0 && <div className="right">
               <span onClick={() => {return this.collapseFilterHeader('right')}} className="adjacency-filter-header">RIGHT</span> 
                 {this.state.compatibilityMatrix.showRight && this.state.compatibilityMatrix.right.map((map,i)=>{
                   return (<div 
                    key={i}
                    >
                    <div 
                      className="map-preview draggable" 
                      
                      style={{
                        height: this.state.tileSize*3,
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
                      })}
                      </div>
                      <div className="map-title">{map.name}</div>
                    </div>)
                 })}
              </div>}
               {this.state.compatibilityMatrix.top.length > 0 && <div className="top">
               <span onClick={() => {return this.collapseFilterHeader('top')}} className="adjacency-filter-header">TOP</span> 
                 {this.state.compatibilityMatrix.showTop && this.state.compatibilityMatrix.top.map((map,i)=>{
                   return (<div 
                    key={i}
                    >
                    <div 
                      className="map-preview draggable" 
                      
                      style={{
                        height: this.state.tileSize*3,
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
                      })}
                      </div>
                      <div className="map-title">{map.name}</div>
                    </div>)
                 })}
               </div>}
               {this.state.compatibilityMatrix.bot.length > 0 && <div className="bot">
               <span onClick={() => {return this.collapseFilterHeader('bot')}} className="adjacency-filter-header">BOT</span> 
                 {this.state.compatibilityMatrix.showBot && this.state.compatibilityMatrix.bot.map((map,i)=>{
                   return (<div 
                    key={i}
                    >
                    <div 
                      className="map-preview draggable" 
                      
                      style={{
                        height: this.state.tileSize*3,
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
                      })}
                      </div>
                      <div className="map-title">{map.name}</div>
                    </div>)
                 })}
              </div>}
            </div>
            }
          </div>
        </div>
        <div className="board-container">
          <div className="inputs-container">
            {this.state.mapView && <input className="mapname-input"  type="text" placeholder={this.state.mapName} autoComplete="none" onChange={(e) => {this.handleInputChange(e, 'map-name')}} />}
            {!this.state.mapView && <input className="dungeonname-input"  type="text" placeholder={this.state.dungeonName} onChange={(e) => {this.handleInputChange(e, 'dungeon-name')}}/>}
            {this.state.mapView && <button
            className="lightblueOnHover"
             style={{
               marginLeft: '35px'
             }}
             onClick={() => {return this.setState((state) => { return {showCoordinates: !state.showCoordinates}})}}
            >Show Coordinates</button>}
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
                  showCoordinates={this.state.showCoordinates}
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
                  {this.state.miniboards && this.state.miniboards.map((board, i) => {
                        return  <div 
                                className="mini-board board" 
                                key={i}
                                style={{
                                  height: (this.state.tileSize*15)/3-2+'px',
                                  width: (this.state.tileSize*15)/3-2+'px',
                                  backgroundColor: 
                                  this.state.hoveredSection === i ? 'lightgoldenrodyellow': 
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
              {this.state.mapView && this.props.mapMaker.paletteTiles && this.props.mapMaker.paletteTiles.map((tile, i) => {
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
            <div className="buttons-container-title">Dungeons</div>
            <div className="buttons-container" 
            style={{
              width: this.state.tileSize*3+'px',
              height: this.state.tileSize*2
            }}
            >
              
              <button
              onClick={() => {return this.clearLoadedDungeon()}}
              style={{height: this.state.tileSize/2}}
              >Clear</button>
              <button
              onClick={() => {return this.writeDungeon()}}
              style={{height: this.state.tileSize/2}}
              >Save</button>
              <button
              onClick={() => {return this.deleteDungeon()}}
              style={{height: this.state.tileSize/2}}
              >Delete</button>
              <button
              onClick={() => {return this.filterDungeonsClicked()}}
              style={{height: this.state.tileSize/2}}
              >Filter</button>
            </div>
            {!this.state.mapView && 
              <div className="previews-container">
                {this.state.dungeons && this.state.dungeons.map((dungeon, i) => {
                  return (<div 
                            key={i}
                          >
                            <div 
                              className="dungeon-preview" 
                              style={{
                                height: this.state.tileSize*3,
                                width: this.state.tileSize*3,
                                boxSizing: 'border-box'
                              }}
                              onClick={() => {
                                  return this.loadDungeon(dungeon.id)
                              }}
                            >
                              {dungeon.miniboards.map((board, i) => {
                                return    <div 
                                          className="micro-board board" 
                                          key={i}
                                          style={{
                                            height: (this.state.tileSize*3)/3-2+'px',
                                            width: (this.state.tileSize*3)/3-2+'px'
                                          }}
                                          > 
                                            {board.tiles && board.tiles.map((tile, i) => {
                                              return <Tile
                                              key={i}
                                              id={i}
                                              tileSize={((this.state.tileSize*3)/3-2)/15}
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
                            <div className="map-title">{dungeon.name}</div>
                        </div>)
                })}
              </div>
            }
        </div>
      </div>
    )

  }


}

export default MapMakerPage;