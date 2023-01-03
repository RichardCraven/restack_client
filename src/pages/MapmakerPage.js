import React from 'react'
import '@coreui/coreui/dist/css/coreui.min.css'
import '../styles/dungeon-board.scss'
import '../styles/map-maker.scss'
import BoardView from './dungonBuilderViews/BoardView'
import PlaneView from './dungonBuilderViews/PlaneView'
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CModal, CButton, CModalHeader, CModalTitle, CModalBody, CModalFooter, CFormSelect} from '@coreui/react';
// import  CIcon  from '@coreui/icons-react'
// import { cilList, cilCaretRight, cilCaretBottom, cilGlobeAlt } from '@coreui/icons';
import {
  addBoardRequest, 
  loadAllBoardsRequest, 
  updateBoardRequest, 
  deleteBoardRequest, 
  loadAllDungeonsRequest,
  loadDungeonRequest,
  loadAllPlanesRequest,
  addPlaneRequest,
  deletePlaneRequest,
  updatePlaneRequest,
  updateManyPlanesRequest
  // loadBoardRequest, 
  // addDungeonRequest,
  // deleteDungeonRequest,
  // updateDungeonRequest,
  // loadPlaneRequest,
} from '../utils/api-handler';

class MapMakerPage extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      tileSize: 0,
      boardSize: 0,
      boards : [],
      planes: [],
      dungeons: [],
      miniboards: [],
      loadedBoard: null,
      hoveredTileIdx: null,
      hoveredPaletteTileIdx: null,
      optionClickedIdx: null,
      pinnedOption: null,
      mouseDown: false,
      toastMessage: null,
      // mapView: true,
      selectedView: 'plane',
      hoveredSection: null,
      draggedMap: null,
      adjacencyFilterOn: false,
      adjacencyFilterSet: false,
      adjacencyFilterHover: false,
      nameFilterOn: true,
      adjacencyHoverIdx: null,
      adjacentTo: null,
      showMapInputs: true,
      // dungeonName: 'dungeon name',
      // boardName: 'board name',
      // planeName: 'plane name',
      nameFilterHover: false,
      compatibilityMatrix: {
        show: false,
        showLeft: false,
        showRight: false,
        showTop: false,
        showBot: false
      },
      showModal: false,
      modalType: 'rename dungeon',
      inputValue: '',
      dungeonNameInput : React.createRef(),
      planeNameInput : React.createRef(),
      boardNameInput : React.createRef(),

      mainViewSelectVal : React.createRef(),

      cachedOriginal: null,
      cachedincoming: null,
      boardsFolders: [],
      boardsFoldersExpanded : {},
      visible: false,
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
    this.loadAllBoards();
    this.loadAllPlanes();
    this.loadAllDungeons();
    this.setState((state, props) => {
      return {
        tileSize,
        boardSize,
        tiles: props.mapMaker.tiles,
        miniboards: arr
      }
    })
    this.nameFilterClicked();
    this.setViewState('plane');
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
  createNewDungeon(){
    console.log('create new dungeon');
    let d = new Date()
    let n = d.getTime();
    let rand = n.toString().slice(9,13)
    console.log('n: ', n, 'rand: ', rand);
    const dungeon = {
      name: `dungeon${rand}`,
      planes : [
        {
          'p0': {
            'front': {},
            'back': {}
          }
        }
      ],
      pocket_planes : {
        'firmament': {},
        'sheol': {},
        'hyperspace': {}
      }
    }
    this.setState({
      showModal: true,
      modalType: 'name dungeon',
      loadedDungeon: dungeon
    })
  }
  downloadDungeon(){
    // const dungeon = this.state.loadedPlane
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
  renameDungeon = () => {
    this.setState({
      showModal: true,
      modalType: 'rename dungeon'
    })
  }
  renameBoard = () => {
    this.setState({
      showModal: true,
      modalType: 'rename board'
    })
  }
  renamePlane = () => {
    this.setState({
      showModal: true,
      modalType: 'rename plane'
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
      // console.log('handle click, palette tile', tile)
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
  setHover = (id) => {
    this.setState({
      hoveredTileIdx: id
    })
  }
  setPaletteHover = (id) => {
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

  setViewState = (state) => {
    let stateLabel;
    switch(state){
      case 'board':
        stateLabel = 'Board View';
      break;
      case 'plane':
        stateLabel = 'Plane View';
      break;
      case 'dungeon':
        stateLabel = 'Dungeon View';
      break;
      default:
      return;
    }
    let b = this.state.mainViewSelectVal
    b.current.value = stateLabel;
    this.setState({
      selectedView: state,
      mainViewSelectVal : b
    })
  }

  expandCollapseBoardFolders= (folderTitle) => {
    let matrix = this.state.boardsFoldersExpanded;
    matrix[folderTitle] = !matrix[folderTitle];
    this.setState(() => { return {boardsFoldersExpanded: matrix}})
  }

  // Board CRUD methods
  writeBoard = async () => {
    let planesToUpdate = [];
    let miniboards;
    
    console.log('write board');

    const config = this.props.mapMaker.getMapConfiguration(this.state.tiles)    
    if(this.state.loadedBoard){
      console.log('loaded board: ', this.state.loadedBoard)
      // debugger
      if(this.state.planes.length > 0){
        console.log('state has planes', this.state.planes);
        this.state.planes.forEach((d) => {
          d.miniboards.forEach((b, index) => {
            if(b.id === this.state.loadedBoard.id){
              console.log('b.id, ', b.id, 'vs', this.state.loadedBoard.id);
              miniboards = d.miniboards;
              miniboards[index] = this.state.loadedBoard;
              miniboards[index].name = this.state.loadedBoard.name;
              miniboards[index].tiles = this.state.tiles;
              miniboards[index].config = config;
              d.valid = this.props.mapMaker.isValidPlane(d)
              planesToUpdate.push(d)
            } 
          })
        })
        console.log('okay now miniboards are: ', miniboards, 'but state.tiles is: ', this.state.tiles)
      }
      console.log('WTF, loaded board:', this.state.loadedBoard);
      let obj = {
        name: this.state.loadedBoard.name,
        tiles: this.state.tiles,
        config
      }
      console.log('about to update board request', this.state.loadedBoard, this.state.boards);
      const res = await updateBoardRequest(this.state.loadedBoard.id, obj);
      console.log('update res:', res);
      // debugger
      console.log('about to load all boards:', this.state.loadedBoard, this.state.boards);
      this.loadAllBoards(); 
      this.toast('Board Saved')
    } else {
      console.log('BRAND NEW BOARD,  loaded board: ', this.state.loadedBoard);
      let d = new Date()
      let n = d.getTime();
      let rand = n.toString().slice(9,13)
      const newBoard = {
        // name: this.state.boardName === 'board name' ? 'map'+rand : this.state.boardName,
        name: `board${rand}`,
        tiles: this.state.tiles,
        config
      }
      const addedMap = await addBoardRequest(newBoard)
      console.log('addBoardRequest complete:', addedMap);
      newBoard.id = addedMap.data._id

      // this.loadAllBoards(); 
      this.loadBoard(newBoard)

      this.toast('Board Saved')
    }
    if(planesToUpdate && planesToUpdate.legnth > 1){
      console.log('outgoing: ', miniboards)
      // console.log('VALID: ', this.props.mapMaker.isValidDungeon(miniboards));
      const payload = planesToUpdate.map(p=> {
        return {
          name: p.name,
          miniboards: p.miniboards,
          spawnPoints: p.spawnPoints,
          valid: p.valid
        }
      })

      // const obj = {
      //   name: planesToUpdate.name,
      //   miniboards: miniboards,
      //   spawnPoints: this.props.mapMaker.getSpawnPoints(miniboards),
      //   valid: this.props.mapMaker.isValidDungeon(miniboards)
      // }
      console.log('update many payload: ', payload);
      // debugger
      await updateManyPlanesRequest(payload);
      this.loadAllPlanes();
    } else if (planesToUpdate && planesToUpdate.length === 1){
      let plane = planesToUpdate[0]
      const obj = {
        name: plane.name,
        miniboards: plane.miniboards,
        spawnPoints: plane.spawnPoints,
        valid: plane.valid
      }
      await updatePlaneRequest(plane.id, obj);
      this.loadAllPlanes();
    }

    // writeRequest({message: JSON.stringify(obj)})
  }
  
  // loadBoard = async (id) => {
  //   console.log('load map with id:', id);
  //   const val = await loadBoardRequest(id)
  //   let e = val.data[0];
  //   console.log('retrieved map:', val);
  //   let map = JSON.parse(e.content);
  //   map.id = e._id;
  //   map.tiles.forEach((t)=>{
  //     if(t.color === 'black'){
  //       t['contains'] = 'void'
  //     }
  //   })
  //   this.setState({
  //     loadedBoard: map,
  //     boardName: map.name,
  //     tiles: map.tiles
  //   })
  //   setTimeout(()=>{
  //     console.log('loaded board is now: ', this.state.loadedBoard);
  //   })
  // }
  loadBoard = (board) => {
    console.log('LOADING BOARD!')
    // debugger
    // console.log('load map with id:', id);
    // const val = await loadBoardRequest(id)
    // let e = val.data[0];
    // console.log('retrieved map:', val);
    // let map = JSON.parse(e.content);
    // map.id = e._id;
    // map.tiles.forEach((t)=>{
    //   if(t.color === 'black'){
    //     t['contains'] = 'void'
    //   }
    // })
    if(this.state.selectedView === 'plane'){
      this.setViewState('board')
    } 
    this.setState({
      loadedBoard: board,
      tiles: board.tiles
    })
  }
  loadAllBoards = async () => {
    const val = await loadAllBoardsRequest();
    // console.log('load all boards request responded:', val);
    const boards = [],
    boardsFolders = [],
    boardsFoldersExpanded = {};
    if(val.data && val.data.length > 0){
      console.log('load all boards content:', val);
    }
    
    val.data.forEach((e)=>{
      let board = JSON.parse(e.content)
      board.id = e._id;
      console.log('board:', board);
      if(!board.name){
        console.log('WTF!!!!!!! why no name? ', board)
      }
      if(board.name && board.name.includes('_')){
        let title = board.name.split('_')[0];
        if(!boardsFolders.map(e=>e.title).includes(title)){
          boardsFolders.push({
            title,
            contents: [board],
            expanded: false
          })
        } else {
          boardsFolders.find(e=>e.title === title).contents.push(board)
        }
      } else {
        boards.push(board)
      }
    })
    boardsFolders.map(e=>e.title).forEach(t=>boardsFoldersExpanded[t] = false)
    console.log('boards folders; ', boardsFolders);
    console.log('boards folders matrix; ', boardsFoldersExpanded);
    this.setState(() => {
      return {
        boards,
        boardsFolders,
        boardsFoldersExpanded
      }
    })
  }
  // setMainView(view){
  //   return this.setState(() => {
  //     return {selectedView: view}
  //   })
  // }
  clearLoadedBoard = () => {
    let arr = [...this.state.tiles]
    for(let t of arr){
      t.image = null;
      t.contains = null;
      t.color = null
    }

    // let miniboards = []
    // for(let i = 0; i < 9; i++){
    //   miniboards.push([])
    // }

    this.setState({
      loadedBoard: null,
      tiles: arr,
      // miniboards
    })
  }
  deleteBoard = async () => {
    if(this.state.loadedBoard){
      await deleteBoardRequest(this.state.loadedBoard.id);
      this.clearLoadedBoard();
      this.loadAllBoards(); 
      this.toast('Board Deleted')
    }
  }
  

  // Dungeon CRUD Methods
  saveDungeon = async () => {
    console.log('writing dungeon', this.state.loadedDungeon)
    if(this.state.loadedDungeon){
      let obj = {
        name: this.state.loadedDungeon.name,
        miniboards: this.state.miniboards,
        spawnPoints: this.props.mapMaker.getSpawnPoints(this.state.miniboards),
        valid: this.props.mapMaker.isValidPlane(this.state.miniboards)
      }
      await updatePlaneRequest(this.state.loadedDungeon.id, obj);
      this.loadAllPlanes(); 
      this.toast('Plane Saved')
    } else {
      let obj = {
        name: this.state.loadedDungeon.name,
        miniboards: this.state.miniboards,
        spawnPoints: this.props.mapMaker.getSpawnPoints(this.state.miniboards),
        valid: this.props.mapMaker.isValidPlane(this.state.miniboards)
      }
      await addPlaneRequest(obj);
      this.toast('Plane Saved')
      this.loadAllPlanes(); 
    }
  }
  writePlane = async () => {
    console.log('writing plane', this.state.loadedPlane)
    if(this.state.loadedPlane && this.state.loadedPlane.id){
      let obj = {
        name: this.state.loadedPlane.name,
        miniboards: this.state.miniboards,
        spawnPoints: this.props.mapMaker.getSpawnPoints(this.state.miniboards),
        valid: this.props.mapMaker.isValidPlane(this.state.miniboards)
      }
      await updatePlaneRequest(this.state.loadedPlane.id, obj);
      this.loadAllPlanes(); 
      this.toast('Plane Saved')
    } else {
      let newPlanePayload = {
        name: this.state.loadedPlane.name,
        miniboards: this.state.loadedPlane.miniboards,
        spawnPoints: this.state.loadedPlane.spawnPoints,
        valid: false
      }
      const newPlaneRes = await addPlaneRequest(newPlanePayload);
      let lp = this.state.loadedPlane
      lp.id = newPlaneRes.data._id;
      this.setState({
        loadedPlane: lp,
        miniboards: this.state.loadedPlane.miniboards
      })
      this.toast('Plane Saved')
      this.loadAllPlanes(); 
    }
  }
  loadPlane = (plane) => {
    let miniboards = [];
    plane.miniboards.forEach((miniboard)=>{
      miniboards.push(miniboard)
    })
    this.setState({
      loadedPlane: plane,
      miniboards: plane.miniboards
    })
  }
  loadDungeon = async (id) => {
    const val = await loadDungeonRequest(id)
    let e = val.data[0];
    let dungeon = JSON.parse(e.content);
    this.setState({
      loadedDungeon: dungeon
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
    // console.log('about to save the very first plane');
    // let plane = dungeons[0]
    // let d = new Date()
    //   let n = d.getTime();
    //   let rand = n.toString().slice(9,13)
    //   let obj = {
    //     name: 'plane'+rand,
    //     miniboards: plane.miniboards,
    //     spawnPoints: plane.spawnPoints,
    //     valid: plane.valid
    //   }
    //   addPlaneRequest(obj);
    //   this.toast('Plane Saved')

    this.setState(() => {
      return {
        dungeons
      }
    })
  }
  loadAllPlanes = async () => {
    const val = await loadAllPlanesRequest()
    console.log('all planes:', val);
    let planes = [];
    val.data.forEach((e)=>{
      let plane = JSON.parse(e.content)
      plane.id = e._id;
      planes.push(plane)
    })
    console.log('setting all planes:', planes);
    this.setState(() => {
      return {
        planes
      }
    })
  }
  addNewPlane = async () => {
    let d = new Date()
    let n = d.getTime();
    let rand = n.toString().slice(9,13)
    console.log('n: ', n, 'rand: ', rand);

    let newPlane = {
        name: `plane${rand}`,
        miniboards: [[],[],[],[],[],[],[],[],[]],
        spawnPoints: null,
        valid: false
    }
    this.setState({
      miniboards: [],
      loadedPlane: newPlane,
    })
    this.renamePlane();
  }
  deletePlane = async () => {
    if(this.state.loadedPlane){
      await deletePlaneRequest(this.state.loadedPlane.id);
      this.clearLoadedPlane();
      this.loadAllPlanes(); 
      this.toast('Plane Deleted')
    }
  }
  clearLoadedPlane = () => {
    let miniboards = []
    for(let i = 0; i < 9; i++){
      miniboards.push([])
    }
    this.setState({
      loadedPlane: null,
      miniboards
    })
  }
  resetLoadedPlane = () => {
    const plane = this.state.loadedPlane;
    let miniboards = [];
    plane.miniboards.forEach((miniboard)=>{
      miniboards.push(miniboard)
    })
    this.setState({
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
    let boards;
    if(!this.state.nameFilterOn){
    // ^ this is opposite because the sort would happen before the state change toggle
    // alternatively this could have been put inside a setTimeout, but I'd prefer to have 
    // only one setState in this function
      boards = this.state.boards.sort(function(a,b){
        return a.name > b.name ? 1 : -1
      })
    } else {
      // filter by id
      boards = this.state.boards.sort(function(a,b){
        return a.id > b.id ? 1 : -1
      })
    }
    this.setState((state) => {
      return {
        boards,
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
  adjacencyHover = (idx) => {
    if(this.state.adjacencyFilterOn && this.state.adjacencyFilterSet === false){
      this.setState({
        adjacencyHoverIdx: idx
      })
    }
  }
  adjacencyFilter = (board, index) => {
    let matrix = this.props.mapMaker.filterMapAdjacency(board, index, this.state.boards)
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
        left.push(this.state.boards.find(e => e.id === id))
      })
    }
    if(this.state.compatibilityMatrix.right.length > 0){
      right = [];
      this.state.compatibilityMatrix.right.forEach((id) => {
        right.push(this.state.boards.find(e => e.id === id))
      })
    }
    if(this.state.compatibilityMatrix.top.length > 0){
      top = [];
      this.state.compatibilityMatrix.top.forEach((id) => {
        top.push(this.state.boards.find(e => e.id === id))
      })
    }
    if(this.state.compatibilityMatrix.bot.length > 0){
      bot = [];
      this.state.compatibilityMatrix.bot.forEach((id) => {
        bot.push(this.state.boards.find(e => e.id === id))
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

  modalSaveChanges = () => {
    console.log('modal save changes, modal type:', this.state.modalType, this.state.modalType === ('name board' || 'rename board'));
    let type = this.state.modalType.split(' ')[1]
    switch(type){
      case 'dungeon':
        const dungeon = this.state.loadedDungeon;
        dungeon.name = this.state.dungeonNameInput.current.value
        this.setState({
          loadedDungeon: dungeon,
          showModal: false
        })
      break;
      case 'plane':
        const plane = this.state.loadedPlane;
        plane.name = this.state.planeNameInput.current.value
        this.setState({
          loadedPlane: plane,
          showModal: false
        })
        setTimeout(()=>{
          console.log('writing plane');
          this.writePlane()
        })
      break;
      case 'board':
        console.log('INSIDE, this.state.boardNameInput.current.value: ', this.state.boardNameInput.current.value, this.state.loadedBoard);
        let board = this.state.loadedBoard;
        board.name = this.state.boardNameInput.current.value
        console.log('about to set loaded board to ', board);
        // debugger
        this.setState({
          loadedBoard: board,
          showModal: false
        })
        setTimeout(()=>{
          console.log('ok now loaded board is:', this.state.loadedBoard, 'abuot top write board');
          // debugger
          this.writeBoard()
        }, 1000)
      break;
      default:

      break;
    }
  }

  dungeonSelectOnChange = (e) => {
    const dungeon = this.state.dungeons.find(x=>x.name === e.target.value)
    this.loadDungeon(dungeon.id)
  }
  viewSelectOnChange = (e) => {
    switch(e.target.value){
      case 'Board View': 
        this.setViewState('board');
      break;
      case 'Plane View': 
        this.setViewState('plane')
      break;
      case 'Dungeon View': 
        this.setViewState('dungeon')
      break;
      default: 
      break;    }
  }

  render (){
    return (
      <div className="mapmaker-container">
        {this.state.toastMessage && <div className="toast-pane">
          {this.state.toastMessage}
        </div>}

        <CModal alignment="center" visible={this.state.showModal} onClose={() => {return this.setState(() => { return {showModal: false}})}}>
          <CModalHeader>
            {this.state.modalType === 'name dungeon' && <CModalTitle>Name this dungeon</CModalTitle>}
            {this.state.modalType === 'rename dungeon' && <CModalTitle>Rename this dungeon</CModalTitle>}
            {this.state.modalType === 'name plane' && <CModalTitle>Name this plane</CModalTitle>}
            {this.state.modalType === 'rename plane' && <CModalTitle>Rename this plane</CModalTitle>}
            {this.state.modalType === 'name board' && <CModalTitle>Name this board</CModalTitle>}
            {this.state.modalType === 'rename board' && <CModalTitle>Rename this board</CModalTitle>}
          </CModalHeader>
          <CModalBody>
            {(this.state.modalType === 'name dungeon' || this.state.modalType === 'rename dungeon') && <input ref={this.state.dungeonNameInput} className="dungeonname-input"  type="text" defaultValue={this.state.loadedDungeon?.name || ''} placeholder={this.state.loadedDungeon?.name || ''}/>}
            {(this.state.modalType === 'name plane' || this.state.modalType === 'rename plane') && <input ref={this.state.planeNameInput} className="dungeonname-input"  type="text" defaultValue={this.state.loadedPlane?.name || ''} placeholder={this.state.loadedPlane?.name || ''}/>}
            {(this.state.modalType === 'name board' || this.state.modalType === 'rename board') && <input ref={this.state.boardNameInput} className="dungeonname-input"  type="text" defaultValue={this.state.loadedBoard?.name || ''} placeholder={this.state.loadedBoard?.name || ''}/>}
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => {return this.setState(() => { return {showModal: false}})}}>
              Close
            </CButton>
            <CButton color="primary" onClick={() => this.modalSaveChanges()}>Save changes</CButton>
          </CModalFooter>
        </CModal>
        <div className="column-wrapper">
          <div className="inputs-container">
            <CButton color="light" onClick={() => this.createNewDungeon()}>New</CButton>
            <CFormSelect 
              aria-label="Dungeon Selector"
              options={
              
                ['Dungeon Selector'].concat(this.state.dungeons.map((e, i)=>{
                  return { label: e.name, value: e.name}
                }))
              }
              onChange={this.dungeonSelectOnChange}
            />
            <CFormSelect 
              aria-label="Dungeon Selector"
              ref={this.state.mainViewSelectVal}
              options={
                [
                  'View Selector',
                  'Board View',
                  'Plane View',
                  'Dungeon View'
                ]
                // ['View Selector'].concat(this.state.dungeons.map((e, i)=>{
                //   return { label: e.name, value: e.name}
                // }))
              }
              // value={this.state.mainViewSelectVal}
              onChange={this.viewSelectOnChange}
            />

            <CDropdown className='dungeon-actions-selector'>
              <CDropdownToggle color="secondary">Dungeon Actions</CDropdownToggle>
              <CDropdownMenu>
              <CDropdownItem onClick={() => this.saveDungeon()}>Save Dungeon</CDropdownItem>
                <CDropdownItem onClick={() => this.renameDungeon()}>Rename Dungeon</CDropdownItem>
                <CDropdownItem onClick={() => this.downloadDungeon()}>Download Dungeon</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </div>
          <div className="row-wrapper">
            {this.state.selectedView === 'board' && <BoardView
              tileSize={this.state.tileSize}
              loadedBoard={this.state.loadedBoard}
              boardSize={this.state.boardSize}
              boardsFolders={this.state.boardsFolders}
              boardsFoldersExpanded={this.state.boardsFoldersExpanded}
              boards={this.state.boards}
              tiles={this.state.tiles}
              compatibilityMatrix={this.state.compatibilityMatrix}
              pinnedOption={this.state.pinnedOption}
              hoveredPaletteTileIdx={this.state.hoveredPaletteTileIdx}
              hoveredTileIdx={this.state.hoveredTileIdx}
              hoveredTileId={this.state.hoveredTileIdx}
              optionClickedIdx={this.state.optionClickedIdx}
              showCoordinates={this.props.showCoordinates}
              mapMaker={this.props.mapMaker}

              setViewState = {this.setViewState}
              clearLoadedBoard= {this.clearLoadedBoard}
              writeBoard = {this.writeBoard}
              deleteBoard = {this.deleteBoard}
              renameBoard = {this.renameBoard}
              adjacencyFilterClicked = {this.adjacencyFilterClicked}
              nameFilterClicked = {this.nameFilterClicked}
              expandCollapseBoardFolders={this.expandCollapseBoardFolders}
              collapseFilterHeader={this.collapseFilterHeader}
              setHover={this.setHover}
              handleClick={this.handleClick}
              handleHover={this.handleHover}
              setPaletteHover={this.setPaletteHover}
              loadBoard={this.loadBoard}
            ></BoardView>}

            {this.state.selectedView === 'plane' && <PlaneView
              tileSize={this.state.tileSize}
              boardSize={this.state.boardSize}
              boardsFolders={this.state.boardsFolders}
              boardsFoldersExpanded={this.state.boardsFoldersExpanded}
              boards={this.state.boards}
              tiles={this.state.tiles}
              compatibilityMatrix={this.state.compatibilityMatrix}
              pinnedOption={this.state.pinnedOption}
              hoveredPaletteTileIdx={this.state.hoveredPaletteTileIdx}
              hoveredTileIdx={this.state.hoveredTileIdx}
              hoveredTileId={this.state.hoveredTileIdx}
              optionClickedIdx={this.state.optionClickedIdx}
              showCoordinates={this.props.showCoordinates}
              mapMaker={this.props.mapMaker}

              loadedPlane={this.state.loadedPlane}
              planes={this.state.planes}
              miniboards={this.state.miniboards}
              adjacencyHoverIdx={this.state.adjacencyHoverIdx}
              hoveredSection={this.state.hoveredSection}
              adjacencyHover = {this.adjacencyHover}
              adjacencyFilter = {this.adacencyFilter}
              loadPlane={this.loadPlane}
              writePlane={this.writePlane}
              clearLoadedPlane={this.clearLoadedPlane}
              renamePlane={this.renamePlane}
              deletePlane={this.deletePlane}
              addNewPlane={this.addNewPlane}
              onDragOver={this.onDragOver}
              // filterDungeonsClicked={this.filterDungeonsClicked}
              onDragStart={this.onDragStart}
              onDrop={this.onDrop}
//            plane specific ^


              setViewState = {this.setViewState}
              clearLoadedBoard= {this.clearLoadedBoard}
              writeBoard = {this.writeBoard}
              deleteBoard = {this.deleteBoard}
              renameBoard = {this.renameBoard}
              adjacencyFilterClicked = {this.adjacencyFilterClicked}
              nameFilterClicked = {this.nameFilterClicked}
              expandCollapseBoardFolders={this.expandCollapseBoardFolders}
              collapseFilterHeader={this.collapseFilterHeader}
              setHover={this.setHover}
              handleClick={this.handleClick}
              handleHover={this.handleHover}
              setPaletteHover={this.setPaletteHover}
              loadBoard={this.loadBoard}
//            board specific ^              
            ></PlaneView>}
            {/* <div className="palette boards-palette" 
              style={{
                width: this.state.tileSize*3+'px', height: this.state.boardSize+ 'px',
                backgroundColor: 'white'
              }}
            > 
              <div className="boards-title" onClick={() => { 
                this.setViewState('board')
              }
            }>Boards</div>
              <div className="board-options-buttons-container" 
              style={{
                width: this.state.tileSize*3+'px',
                height: '38px'
              }}
              >
                <CDropdown>
                  <CDropdownToggle color="secondary">Actions</CDropdownToggle>
                  <CDropdownMenu>
                    <CDropdownItem onClick={() => this.clearLoadedBoard()}>Clear</CDropdownItem>
                    <CDropdownItem onClick={() => this.writeBoard()}>Save</CDropdownItem>
                    <CDropdownItem onClick={() => this.deleteBoard()}>Delete</CDropdownItem>
                    <CDropdownItem disabled={!this.state.loadedBoard} onClick={() => this.renameBoard()}>Rename Current Map</CDropdownItem>
                    <CDropdownItem onClick={() => this.adjacencyFilterClicked()}>Filter: Adjacency</CDropdownItem>
                    <CDropdownItem onClick={() => this.nameFilterClicked()}>Filter: Name</CDropdownItem>
                  </CDropdownMenu>
                </CDropdown>
              </div>
              <div className="board-previews-container previews-container" 
                  style={{
                height: (this.state.boardSize - 78)+ 'px'
              }}>
                {this.state.boardsFolders.length > 0 && this.state.boardsFolders.map((folder, i) => {
                  return  <div key={i}>
                            <div className="boards-folder-headline"  onClick={() => this.expandCollapseBoardFolders(folder.title)}> 
                            <div className="icon-container">
                              <CIcon icon={cilCaretRight} className={`expand-icon ${this.state.boardsFoldersExpanded[folder.title] ? 'expanded' : ''}`} size="xl"/>
                            </div>
                              <div className="folder-headline-text">{folder.title}</div> 
                            </div>
                            <CCollapse visible={this.state.boardsFoldersExpanded[folder.title]}>
                                {folder.contents.map((board, i) => {
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
                                                  return this.loadBoard(board)
                                                }
                                              }}
                                              onDragStart = {(event) => this.onDragStart(event, board)}
                                              draggable
                                            >
                                            {board.tiles.map((tile, i) => {
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
                                            <div className="map-title">{board.name}</div>
                                        </div>)
                                })}
                            </CCollapse>
                          </div>
                })}
                {this.state.boards && this.state.compatibilityMatrix.show === false && this.state.boards.map((board, i) => {
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
                                  return this.loadBoard(board)
                                }
                              }}
                              onDragStart = {(event) => this.onDragStart(event, board)}
                              draggable
                            >
                            {board.tiles.map((tile, i) => {
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
                            <div className="map-title">{board.name}</div>
                        </div>)
                })}
                {this.state.compatibilityMatrix && this.state.compatibilityMatrix.show === true && 
                <div className="compatibility-matrix-container">
                  {this.state.compatibilityMatrix.left.length > 0 && <div className="left">
                    <span onClick={() => {return this.collapseFilterHeader('left')}} className="adjacency-filter-header">LEFT</span> 
                    {this.state.compatibilityMatrix.showLeft && this.state.compatibilityMatrix.left.map((board,i)=>{
                      return (<div 
                        key={i}
                        >
                        <div 
                          className="map-preview draggable" 
                          
                          style={{
                            height: this.state.tileSize*3,
                            boxSizing: 'border-box'
                          }}
                          onClick={() => {return this.loadBoard(board)}}
                          onDragStart = {(event) => this.onDragStart(event, board)}
                          draggable
                        >
                          {board.tiles.map((tile, i) => {
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
                          <div className="map-title">{board.name}</div>
                        </div>)
                    })}
                    </div>}
                  {this.state.compatibilityMatrix.right.length > 0 && 
                  <div className="right">
                    <span onClick={() => {return this.collapseFilterHeader('right')}} className="adjacency-filter-header">RIGHT</span> 
                      {this.state.compatibilityMatrix.showRight && this.state.compatibilityMatrix.right.map((board,i)=>{
                      return (<div 
                        key={i}
                        >
                        <div 
                          className="map-preview draggable" 
                          style={{
                            height: this.state.tileSize*3,
                            boxSizing: 'border-box'
                          }}
                          onClick={() => {return this.loadBoard(board)}}
                          onDragStart = {(event) => this.onDragStart(event, board)}
                          draggable
                        >
                          {board.tiles.map((tile, i) => {
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
                          <div className="map-title">{board.name}</div>
                        </div>)
                    })}
                  </div>}
                  {this.state.compatibilityMatrix.top.length > 0 && <div className="top">
                  <span onClick={() => {return this.collapseFilterHeader('top')}} className="adjacency-filter-header">TOP</span> 
                    {this.state.compatibilityMatrix.showTop && this.state.compatibilityMatrix.top.map((board,i)=>{
                      return (<div 
                        key={i}
                        >
                        <div 
                          className="map-preview draggable" 
                          
                          style={{
                            height: this.state.tileSize*3,
                            boxSizing: 'border-box'
                          }}
                          onClick={() => {return this.loadBoard(board)}}
                          onDragStart = {(event) => this.onDragStart(event, board)}
                          draggable
                        >
                          {board.tiles.map((tile, i) => {
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
                          <div className="map-title">{board.name}</div>
                        </div>)
                    })}
                  </div>}
                  {this.state.compatibilityMatrix.bot.length > 0 && <div className="bot">
                  <span onClick={() => {return this.collapseFilterHeader('bot')}} className="adjacency-filter-header">BOT</span> 
                    {this.state.compatibilityMatrix.showBot && this.state.compatibilityMatrix.bot.map((board,i)=>{
                      return (<div 
                        key={i}
                        >
                        <div 
                          className="map-preview draggable" 
                          
                          style={{
                            height: this.state.tileSize*3,
                            boxSizing: 'border-box'
                          }}
                          onClick={() => {return this.loadBoard(board)}}
                          onDragStart = {(event) => this.onDragStart(event, board)}
                          draggable
                        >
                          {board.tiles.map((tile, i) => {
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
                          <div className="map-title">{board.name}</div>
                        </div>)
                    })}
                  </div>}
                </div>
                }
              </div>
            </div> */}

            {/* <div className="center-board-container">
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
            </div> */}

            {/* <div className="palette right-palette" 
                style={{
                  width: this.state.tileSize*3+'px', height: this.state.boardSize+ 'px',
                  backgroundColor: 'white',
                  overflow: 'scroll'
                  // marginLeft: '25px'
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
                {this.state.selectedView !== 'board' && <div className="planes-title">Planes</div>}
                {this.state.selectedView !== 'board' && <div className="planes-options-buttons-container" 
                style={{
                  width: this.state.tileSize*3+'px',
                  // height: this.state.tileSize*2
                }}
                >
                  <CDropdown>
                    <CDropdownToggle color="secondary">Actions</CDropdownToggle>
                    <CDropdownMenu>
                      <CDropdownItem onClick={() => this.addNewPlane()}>New</CDropdownItem>
                      <CDropdownItem onClick={() => this.clearLoadedPlane()}>Clear</CDropdownItem>
                      <CDropdownItem onClick={() => this.resetLoadedPlane()}>Reset</CDropdownItem>
                      <CDropdownItem onClick={() => this.writePlane()}>Save</CDropdownItem>
                      <CDropdownItem onClick={() => this.renamePlane()}>Rename</CDropdownItem>
                      <CDropdownItem onClick={() => this.deletePlane()}>Delete</CDropdownItem>
                      <CDropdownItem onClick={() => this.filterDungeonsClicked()}>Filter</CDropdownItem>
                    </CDropdownMenu>
                  </CDropdown>
                </div>}
                {this.state.selectedView !== 'board' && 
                  <div className="plane-previews-container previews-container"
                      style={{
                        height: (this.state.boardSize - 78)+ 'px'
                      }}
                  >
                    {this.state.planes && this.state.planes.map((plane, i) => {
                      return (<div 
                                className='plane-previews-container'
                                key={i}
                              >
                                <div 
                                  className="plane-preview" 
                                  style={{
                                    height: this.state.tileSize*3,
                                    width: this.state.tileSize*3,
                                    boxSizing: 'border-box'
                                  }}
                                  onClick={() => this.loadPlane(plane)}
                                >
                                  {plane.miniboards.map((board, i) => {
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
                                <div className="map-title"> <span className={`validity-indicator ${plane.valid && 'valid'}`}></span>  {plane.name}</div>
                            </div>)
                    })}
                  </div>
                }
            </div> */}
          </div>
        </div>
      </div>
    )

  }


}

export default MapMakerPage;