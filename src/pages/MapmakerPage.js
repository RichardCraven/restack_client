import React from 'react'
import '@coreui/coreui/dist/css/coreui.min.css'
import '../styles/dungeon-board.scss'
import '../styles/map-maker.scss'
import Tile from '../components/tile'
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CModal, CButton, CModalHeader, CModalTitle, CModalBody, CModalFooter } from '@coreui/react';
// import { CModal } from '@coreui/components'
// import CDropdown, {CDropdownToggle, CDropdownMenu, CDropdownItem} from '@coreui/react/components/dropdown/CDropdown'
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
      selectedView: 'board',
      hoveredSection: null,
      draggedMap: null,
      showCoordinates: false,
      adjacencyFilterOn: false,
      adjacencyFilterSet: false,
      adjacencyFilterHover: false,
      nameFilterOn: true,
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
      },
      showModal: false
    };
  }

  componentDidMount(){
    console.log('mounted, props: ', this.props);
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
    this.nameFilterClicked()
  }
  componentDidUpdate(){
    // console.log('updated, props: ', this.props);
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

  downloadDungeon(){
    const dungeon = this.state.loadedDungeon
    console.log('loaded dungeon: ', dungeon);
    const zip = new JSZip();
    let string = JSON.stringify(dungeon)
    console.log('string:', string);
    zip.file(`${dungeon.name}.dungeon.json`, string)
    zip.generateAsync({type:'blob'})
    .then((content) => {
      console.log('content', content)
        saveAs(content, `${dungeon.name}`.zip);
    });
  }
  renameDungeon(){
    this.setState({
      showModal: true
    })
    
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
      console.log('handle click, palette tile', tile)
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
        let arr = [...this.state.tiles];
        arr[tile.id].image = null;
        arr[tile.id].color = 'black'
        arr[tile.id].contains = 'void'
        this.setState({
          tiles: arr,
          hoveredTileIdx: null
        })
      } else if(pinned && pinned.optionType === 'delete'){
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
        arr[tile.id].contains = pinned.image
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
    let dungeonToUpdate;
    let miniboards;
    
    console.log('write map');

    const config = this.props.mapMaker.getMapConfiguration(this.state.tiles)    
    if(this.state.loadedMap){
      console.log('loaded map: ', this.state.loadedMap)
      if(this.state.dungeons.length > 0){
        console.log('state has dungeons', this.state.dungeons);
        this.state.dungeons.forEach((d) => {
          d.miniboards.forEach((b, index) => {
            if(b.id === this.state.loadedMap.id){
              console.log('b.id, ', b.id, 'vs', this.state.loadedMap.id);
              dungeonToUpdate = d
              console.log('DUNGEON TO UPDATE', d);
              miniboards = d.miniboards;
              miniboards[index] = this.state.loadedMap;
              miniboards[index].name = this.state.mapName;
              miniboards[index].tiles = this.state.tiles;
              miniboards[index].config = config;
            } 
          })
        })
        console.log('okay now miniboards are: ', miniboards, 'but state.tiles is: ', this.state.tiles)
      }

      let obj = {
        name: this.state.mapName,
        tiles: this.state.tiles,
        config
      }
      console.log('about to update map');
      await updateMapRequest(this.state.loadedMap.id, obj);
      this.loadAllMaps(); 
      this.toast('Map Saved')
    } else {
      console.log('BRAND NEW MAP');
      let d = new Date()
      let n = d.getTime();
      let rand = n.toString().slice(3,7)
      let obj = {
        name: this.state.mapName === 'map name' ? 'map'+rand : this.state.mapName,
        tiles: this.state.tiles,
        config
      }
      const addedMap = await addMapRequest(obj)
      console.log('addMapRequest complete:', addedMap);
      this.loadAllMaps(); 
      this.toast('Map Saved')
    }
    if(dungeonToUpdate){
      console.log('outgoing: ', miniboards)
      console.log('VALID: ', this.props.mapMaker.isValidDungeon(miniboards));
      let obj = {
        name: dungeonToUpdate.name,
        miniboards: miniboards,
        spawnPoints: this.props.mapMaker.getSpawnPoints(miniboards),
        valid: this.props.mapMaker.isValidDungeon(miniboards)
      }
      
      await updateDungeonRequest(dungeonToUpdate.id, obj);
      this.loadAllDungeons();
    }

    // writeRequest({message: JSON.stringify(obj)})
  }
  
  loadMap = async (id) => {
    console.log('load map with id:', id);
    const val = await loadMapRequest(id)
    let e = val.data[0];
    console.log('retrieved map:', val);
    let map = JSON.parse(e.content);
    map.id = e._id;
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
    console.log('maps: ', val);
    let maps = [];
    if(val.data.length > 0){
      console.log('load all maps content:', val);
      // debugger
    }
    val.data.forEach((e)=>{
      let map = JSON.parse(e.content)
      map.id = e._id;
      maps.push(map)
    })
    console.log('final maps:',maps);
    this.setState(() => {
      return {
        maps: maps
      }
    })
  }
  setMainView(view){
    return this.setState((state) => {
      return {selectedView: view}
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
      await deleteMapRequest(this.state.loadedMap.id);
      this.clearLoadedMap();
      this.loadAllMaps(); 
      this.toast('Map Deleted')
    }
  }
  

  // Dungeon CRUD Methods

  writeDungeon = async () => {
    console.log('writing dungeon', this.state.loadedDungeon)
    console.log('VALID: ', this.props.mapMaker.isValidDungeon(this.state.miniboards));
    if(this.state.loadedDungeon){
      let obj = {
        name: this.state.dungeonName,
        miniboards: this.state.miniboards,
        spawnPoints: this.props.mapMaker.getSpawnPoints(this.state.miniboards),
        valid: this.props.mapMaker.isValidDungeon(this.state.miniboards)
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
        miniboards: this.state.miniboards,
        spawnPoints: this.props.mapMaker.getSpawnPoints(this.state.miniboards),
        valid: this.props.mapMaker.isValidDungeon(this.state.miniboards)
      }
      await addDungeonRequest(obj);
      this.toast('Dungeon Saved')
      this.loadAllDungeons(); 
    }
  }
  loadDungeon = async (id) => {
    console.log('loading dungeon ', id);
    const val = await loadDungeonRequest(id)
    console.log('loaded dungeon response:', val);
    let e = val.data[0];
    let dungeon = JSON.parse(e.content);
    
    dungeon.id = e._id;
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
    console.log('all dungeons:', val);
    let dungeons = [];
    val.data.forEach((e)=>{
      let dungeon = JSON.parse(e.content)
      dungeon.id = e._id;
      dungeons.push(dungeon)
    })
    console.log('setting all dungeons:', dungeons);
    this.setState(() => {
      return {
        dungeons
      }
    })
  }
  deleteDungeon = async () => {
    if(this.state.loadedDungeon){
      await deleteDungeonRequest(this.state.loadedDungeon.id);
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
  adjacencyFilterClicked = () => {
    console.log('adjacency filter clicked');
    if(this.state.adjacencyFilterSet){
      this.setState((state) => {
        return {
          compatibilityMatrix: {
            show: false,
            showLeft: false,
            showRight: false,
            showTop: false,
            showBot: false
          },
          adjacencyFilterOn: false,
          adjacencyFilterSet: false,
          adjacencyHoverIdx: null
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
      // filter by id
      maps = this.state.maps.sort(function(a,b){
        return a.id > b.id ? 1 : -1
      })
    }
    this.setState((state) => {
      return {
        maps,
        nameFilterOn: !this.state.nameFilterOn,
        compatibilityMatrix: {
          show: false,
          showLeft: false,
          showRight: false,
          showTop: false,
          showBot: false
        },
        adjacencyFilterOn: false,
        adjacencyFilterSet: false,
        adjacencyHoverIdx: null
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
    this.setState({
      compatibilityMatrix: matrix
    })
    setTimeout(()=> {
      this.filterByAdjacency();
    })
  }
  filterByAdjacency = () => {
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
            showBot: !state.compatibilityMatrix.showBot
          }
        }))
      break;
      default:
      break;
    }
  }

  // Drag and Drop code

  onDragStart = (event, map) => {
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
    if(inputType === 'board-name'){
      this.setState({
        mapName: e.target.value
      })
    } else {
      this.setState({
        dungeonName: e.target.value
      })
    }
  }
  selectDungeon = (e) => {
    console.log('dungeon selected: ', e);
    this.loadDungeon(e.id)
  }

  render (){
    return (
      <div className="mapmaker-container">
        {this.state.toastMessage && <div className="toast-pane">
          {this.state.toastMessage}
        </div>}

        <CButton onClick={() => {return this.setState((state) => { return {showModal: true}})}}>Vmodal</CButton>
        <CModal alignment="center" visible={this.state.showModal} onClose={() => {return this.setState((state) => { return {showModal: false}})}}>
          <CModalHeader>
            <CModalTitle>Rename this dungeon</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <input className="dungeonname-input"  type="text" value={this.state.dungeonName || ''} placeholder={this.state.dungeonName || ''} onChange={(e) => {this.handleInputChange(e, 'dungeon-name')}}/>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => {return this.setState((state) => { return {showModal: false}})}}>
              Close
            </CButton>
            <CButton color="primary">Save changes</CButton>
          </CModalFooter>
        </CModal>
        <div 
          className="palette boards-palette" 
          style={{
            width: this.state.tileSize*3+'px', height: this.state.boardSize+ 'px',
            backgroundColor: 'white',
            // marginRight: '25px'
          }}
        > 
          <div className="boards-title">Boards</div>
          <div className="board-options-buttons-container" 
          style={{
            width: this.state.tileSize*3+'px',
            // height: this.state.tileSize*2
            height: '38px'
          }}
          >
            <CDropdown>
              <CDropdownToggle color="secondary">Board Actions</CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem onClick={() => this.clearLoadedMap()}>Clear</CDropdownItem>
                <CDropdownItem onClick={() => this.writeMap()}>Save</CDropdownItem>
                <CDropdownItem onClick={() => this.deleteMap()}>Delete</CDropdownItem>
                <CDropdownItem onClick={() => this.adjacencyFilterClicked()}>Filter: Adjacency</CDropdownItem>
                <CDropdownItem onClick={() => this.nameFilterClicked()}>Filter: Name</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </div>
          <div className="board-previews-container previews-container">
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
                            if(this.state.selectedView === 'board'){
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
               {this.state.compatibilityMatrix.right.length > 0 && 
               <div className="right">
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
        <div className="center-board-container">
          <div className="inputs-container">
            <CDropdown className='dungeon-selector'>
              <CDropdownToggle color="secondary">Dungeon Selector</CDropdownToggle>
              <CDropdownMenu>
                {this.state.dungeons && this.state.dungeons.map((e, i)=>{
                  return <CDropdownItem key={i} onClick={() => this.selectDungeon(e)}>{e.name}</CDropdownItem>
                })}
              </CDropdownMenu>
            </CDropdown>

            {/* {this.state.selectedView === 'board' && <input className="mapname-input"  type="text" value={this.state.mapName} placeholder={this.state.mapName} autoComplete="none" onChange={(e) => {this.handleInputChange(e, 'board-name')}} />} */}
            {/* {this.state.selectedView === 'plane' && <input className="dungeonname-input"  type="text" value={this.state.dungeonName || ''} placeholder={this.state.dungeonName || ''} onChange={(e) => {this.handleInputChange(e, 'dungeon-name')}}/>} */}

            <CDropdown className='view-selector'>
              <CDropdownToggle color="secondary">View Selector</CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem onClick={() => this.setMainView('board')}>Board View</CDropdownItem>
                <CDropdownItem onClick={() => this.setMainView('plane')}>Plane View</CDropdownItem>
                <CDropdownItem onClick={() => this.setMainView('dungeon')}>Dungeon View</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>

            <CDropdown className='dungeon-actions-selector'>
              <CDropdownToggle color="secondary">Dungeon Actions</CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem onClick={() => this.renameDungeon()}>Rename Dungeon</CDropdownItem>
                <CDropdownItem onClick={() => this.downloadDungeon()}>Download Dungeon</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </div>
          <div 
          className="board map-board" 
          style={{
              width: this.state.boardSize+'px', height: this.state.boardSize+ 'px',
              backgroundColor: 'white'
          }}
          onMouseLeave={() => {return this.setHover(null)}}
          >
              {this.state.selectedView === 'board' && this.state.tiles && this.state.tiles.map((tile, i) => {
                  return <Tile 
                  key={i}
                  id={tile.id}
                  index={tile.id}
                  tileSize={this.state.tileSize}
                  image={tile.image ? tile.image : null}
                  color={tile.color ? tile.color : 'lightgrey'}
                  coordinates={tile.coordinates}
                  showCoordinates={this.props.showCoordinates}
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

              {this.state.selectedView === 'plane' && 
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
        <div className="palette planes-palette" 
            style={{
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
              {this.state.selectedView === 'board' && this.props.mapMaker.paletteTiles && this.props.mapMaker.paletteTiles.map((tile, i) => {
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
            <div className="buttons-container-title">Planes</div>
            <div className="buttons-container" 
            style={{
              width: this.state.tileSize*3+'px',
              height: this.state.tileSize*2
            }}
            >
              <CDropdown>
                <CDropdownToggle color="secondary">Board Actions</CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem onClick={() => this.clearLoadedDungeon()}>Clear</CDropdownItem>
                  <CDropdownItem onClick={() => this.writeDungeon()}>Save</CDropdownItem>
                  <CDropdownItem onClick={() => this.deleteDungeon()}>Delete</CDropdownItem>
                  <CDropdownItem onClick={() => this.filterDungeonsClicked()}>Filter</CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </div>
            {this.state.selectedView === 'plane' && 
              <div className="plane-previews-container previews-container">
                {this.state.dungeons && this.state.dungeons.map((dungeon, i) => {
                  return (<div 
                            className='plane-previews-container'
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
                            <div className="map-title"> <span className={`validity-indicator ${dungeon.valid && 'valid'}`}></span>  {dungeon.name}</div>
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