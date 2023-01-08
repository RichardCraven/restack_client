import React from 'react'
import '@coreui/coreui/dist/css/coreui.min.css'
import '../styles/dungeon-board.scss'
import '../styles/map-maker.scss'
import BoardView from './dungonBuilderViews/BoardView'
import PlaneView from './dungonBuilderViews/PlaneView'
import DungeonView from './dungonBuilderViews/DungeonView'
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
  updateManyPlanesRequest,
  // loadBoardRequest, 
  addDungeonRequest,
  deleteDungeonRequest,
  updateDungeonRequest,
  // loadPlaneRequest,
} from '../utils/api-handler';

class MapMakerPage extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      loadedBoard: null,
      loadedPlane: null,
      loadedDungeon: null,
      tileSize: 0,
      boardSize: 0,
      boards : [],
      planes: [],
      dungeons: [],
      miniboards: [],
      hoveredTileIdx: null,
      hoveredPaletteTileIdx: null,
      optionClickedIdx: null,
      pinnedOption: null,
      mouseDown: false,
      toastMessage: null,
      // mapView: true,
      selectedView: 'dungeon',
      hoveredSection: null,
      hoveredDungeonSection: null,
      draggedBoard: null,
      draggedBoardOrigin: null,
      draggedPlane: null,
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
      activeDungeonLevel: 0
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
    this.setViewState('dungeon');
    setTimeout(()=>{
      console.log('wtffffff, loaded plane:', this.state.loadedPlane);
    })
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
  addNewDungeon(){
    console.log('add new dungeon');
    let d = new Date()
    let n = d.getTime();
    let rand = n.toString().slice(9,13)
    console.log('n: ', n, 'rand: ', rand);
    const dungeon = {
      name: `dungeon${rand}`,
      levels : [
        {
          id: 0,
          front: null,
          back: null
        }
      ],
      pocket_planes : [
        {firmament: null},
        {sheol: null},
        {hyperspace: null}
      ]
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
    console.log('loaded board:', this.state.loadedBoard);
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
    if(this.state.loadedBoard && this.state.loadedBoard.id){
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
              d.valid = this.props.mapMaker.isValidPlane(miniboards)
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
        name: this.state.loadedBoard.name,
        tiles: this.state.tiles,
        config
      }
      const addedMap = await addBoardRequest(newBoard)
      console.log('addBoardRequest complete:', addedMap);
      newBoard.id = addedMap.data._id

      this.loadAllBoards(); 
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

  loadBoard = (board) => {
    console.log('LOADING BOARD!')
    if(this.state.selectedView === 'plane'){
      this.setViewState('board')
    } 
    this.setState({
      loadedBoard: board,
      tiles: board.tiles
    })
  }
  // zoomInToBoard = (board) => {
  //   console.log('LOADING BOARD!')
  //   if(this.state.selectedView === 'plane'){
  //     this.setViewState('board')
  //   } 
  //   this.setState({
  //     loadedBoard: board,
  //     tiles: board.tiles
  //   })
  // }
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
      if(board.name && board.name.includes('_')){
        let obj, title = board.name.split('_')[0],
        subtitle = board.name.split('_').length > 2 ? board.name.split('_')[1] : null,
        folderExists = boardsFolders.map(e=>e.title).includes(title),
        existingSubfolder = boardsFolders.find(e=>e.title === title)?.subfolders.find(e=>e.title === subtitle)
        if(!folderExists && !existingSubfolder && !subtitle){
          boardsFolders.push({
            title,
            contents: [board],
            subfolders: [],
            expanded: false
          })
        } else if(!folderExists && !existingSubfolder && subtitle){
          boardsFolders.push({
            title,
            contents: [],
            subfolders: [{
              title: subtitle,
              contents: [board]
            }],
            expanded: false
          })
        } else if(folderExists && !existingSubfolder && !subtitle){
          boardsFolders.find(e=>e.title === title).contents.push(board)
        } else if(folderExists && !existingSubfolder && subtitle){
          boardsFolders.find(e=>e.title === title).subfolders.push({
            title: subtitle,
            contents: [board]
          })
        } else if(existingSubfolder){
          existingSubfolder.contents.push(board)
        }
      } else {
        boards.push(board)
      }
    })
    boardsFolders.map(e=>e.title).forEach(t=>boardsFoldersExpanded[t] = false)
    boardsFolders.forEach((f)=>{
      f.subfolders.forEach((s)=>{
        const title = `${f.title}_${s.title}`
        boardsFoldersExpanded[title] = false;
      })
    })
    console.log('final: ', boardsFolders);
    console.log('boards folder sexpanded:', boardsFoldersExpanded);
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

  addNewBoard = () => {
    this.clearLoadedBoard()
    let d = new Date()
    let n = d.getTime();
    let rand = n.toString().slice(9,13)
    console.log('n: ', n, 'rand: ', rand);

    let newBoard = {
        name: `board${rand}`,
        config: [[],[],[],[]],
        tiles: []
    }
    console.log('new board:', newBoard);
    this.setState({
      loadedBoard: newBoard
    })
    setTimeout(()=>{
      this.renameBoard();
    })
  }

  cloneBoard = () => {
    let d = new Date()
    let n = d.getTime();
    let rand = n.toString().slice(9,13)
    console.log('n: ', n, 'rand: ', rand);

    let newBoard = {
        name: `board${rand}`,
        config: [[],[],[],[]],
        tiles: []
    }
    console.log('new board:', newBoard);
    this.setState({
      loadedBoard: newBoard
    })
    setTimeout(()=>{
      this.renameBoard();
    })
  }

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
      console.log('updating plane, is valid:', obj, obj.valid);
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
  writeDungeon = async () => {
    console.log('writing dungeon', this.state.loadedDungeon)
    if(this.state.loadedDungeon && this.state.loadedDungeon.id){
      console.log('updating dungeon, investigate this', this.state.loadedDungeon);
      // let obj = {
      //   name: this.state.loadedDungeon.name,
      //   // miniboards: this.state.miniboards,
      //   // spawnPoints: this.props.mapMaker.getSpawnPoints(this.state.miniboards),
      //   // valid: this.props.mapMaker.isValidDungeon(this.state.miniboards)
      // }
      // console.log('updating Dungeon, is valid:', obj, obj.valid);
      await updateDungeonRequest(this.state.loadedDungeon.id, this.state.loadedDungeon);
      this.loadAllDungeons(); 
      this.toast('Dungeon Saved')
    } else {
      let newDungeonPayload = {
        name: this.state.loadedDungeon.name,
        levels: this.state.loadedDungeon.levels,
        pocket_planes: this.state.loadedDungeon.pocket_planes,
        descriptions: 'new dungeon description',
        valid: false
      }
      const newDungeonRes = await addDungeonRequest(newDungeonPayload);
      let ld = this.state.loadedDungeon
      ld.id = newDungeonRes.data._id;
      console.log('newDungeonRes:', newDungeonRes);
      this.setState({
        loadedDungeon: ld
        // miniboards: this.state.loadedDungeon.miniboards
      })
      this.toast('Dungeon Saved')
      this.loadAllDungeons(); 
    }
  }

  loadPlane = (plane) => {
    let miniboards = [];
    plane.miniboards.forEach((miniboard)=>{
      miniboards.push(miniboard)
    })
    console.log('miniboards now:', miniboards);
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

  onDragStart = (event, board, origin = null) => {
    console.log('drag start, origin: ', origin);
    this.setState({
      draggedBoard: board,
      draggedBoardOrigin: origin
    })
  }
  onDragOver = (event, i) => {
    if(this.state.hoveredSection !== i){
      this.setState({
        hoveredSection: i
      })
    }
      event.preventDefault();
  }

  onDrop = (event, index) => {
    let minis = [...this.state.miniboards]
    minis[index] = [];
    if(this.state.draggedBoardOrigin !== null){
      minis[this.state.draggedBoardOrigin] = []
    }
    this.setState({
      miniboards: minis
    })
    
    setTimeout(()=>{
      let sections = [...this.state.miniboards]
      if(this.state.draggedBoard){
        sections[index] = this.state.draggedBoard
      }
      this.setState({
        draggedBoard: null,
        hoveredSection: null,
        miniboards: [...sections]
      })
    })
  }

  // DUNGEON drag and drop
  onDragStartDungeon = (plane) => {
    console.log('drag start dungeon, plane: ', plane);
    this.setState({
      draggedPlane: plane
    })
  }
  onDragOverDungeon = (event, levelIndex, frontOrBack) => {
    const val = `${levelIndex}_${frontOrBack}`
    
    if(this.state.hoveredDungeonSection !== val){
      console.log('val: ', val)
      this.setState({
        hoveredDungeonSection: val
      })
    }
      event.preventDefault();
  }

  onDropDungeon = (levelIndex, frontOrBack) => {
    const dungeon = this.state.loadedDungeon

    console.log('this.lodaded dungeon:', this.state.loadedDungeon);
    let loadedDungeon = this.state.loadedDungeon;
    console.log('state.planes:',  this.state.planes);
    // const incomingPlane =  this.state.planes.find(p=>p.id === id);
    console.log('incoming plane:', this.state.draggedPlane);
    dungeon.levels[levelIndex][frontOrBack] = this.state.draggedPlane

    console.log('now dungeon is', dungeon);
    setTimeout(()=>{
      // let sections = [...this.state.miniboards]
      // if(this.state.draggedBoard){
      //   sections[index] = this.state.draggedBoard
      // }
      this.setState({
        loadedDungeon: dungeon,
        draggedPlane: null,
        hoveredDungeonSection: null
      })
    })
  }

  saveDungeonLevel = () => {
    console.log('save dungeon level');
    this.writeDungeon()
  }
  addDungeonLevelUp = () => {
    let dungeon = this.state.loadedDungeon;
    const levels = dungeon.levels
    const upperLevels = dungeon.levels.filter(l=>l.id > 0).sort((a,b) => a.id - b.id),
    lowerLevels = dungeon.levels.filter(l=>l.id < 0).sort((a,b) => a.id - b.id)
    console.log('levels', levels, 'upper:', upperLevels, 'lower:', lowerLevels);
    let newLevel;
    if(upperLevels.length === 0){
      newLevel = {
        id: 1,
        front: null,
        back: null
      }
      
    }
    else{
      let lastLevel = upperLevels[upperLevels.length-1],
      lastId = lastLevel.id
      console.log('upper levels:', upperLevels, lastLevel);
      newLevel = {
        id: lastId+1,
        front: null,
        back: null
      }
    }
    dungeon.levels.push(newLevel)
    this.setState({
      loadedDungeon: dungeon
    })
    setTimeout(()=>{
      console.log('now dungeon is: ', this.state.loadedDungeon);
    })
  }
  addDungeonLevelDown = () => {
    
  }
  toggleDungeonLevelOverlay = () => {
    console.log('toggle overlay');
  }
  clearFrontPlanePreview = (levelIndex) => {
    let dungeon = this.state.loadedDungeon;
    dungeon.levels[levelIndex].front = null;
    this.setState({
      loadedDungeon: dungeon
    })
  }
  clearBackPlanePreview = (levelIndex) => {
    let dungeon = this.state.loadedDungeon;
    dungeon.levels[levelIndex].back = null;

    this.setState({
      loadedDungeon: dungeon
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
        setTimeout(()=>{
          this.writeDungeon()
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
          this.writeBoard()
        })
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
            <CButton color="light" onClick={() => this.addNewDungeon()}>New</CButton>
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
              selectedView={this.state.selectedView}
              showCoordinates={this.props.showCoordinates}
              mapMaker={this.props.mapMaker}

              setViewState = {this.setViewState}
              addNewBoard = {this.addNewBoard}
              cloneBoard = {this.cloneBoard}
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
              selectedView={this.state.selectedView}
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
              resetLoadedPlane={this.resetLoadedPlane}
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

            {this.state.selectedView === 'dungeon' && <DungeonView
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
              selectedView={this.state.selectedView}
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
              resetLoadedPlane={this.resetLoadedPlane}
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

              loadedDungeon={this.state.loadedDungeon}
              hoveredDungeonSection={this.state.hoveredDungeonSection}
              onDragOverDungeon={this.onDragOverDungeon}
              onDropDungeon={this.onDropDungeon}
              onDragStartDungeon={this.onDragStartDungeon}
              saveDungeonLevel={this.saveDungeonLevel}
              toggleDungeonLevelOverlay={this.toggleDungeonLevelOverlay}
              addDungeonLevelUp={this.addDungeonLevelUp}
              addDungeonLevelDown={this.addDungeonLevelDown}
              clearFrontPlanePreview={this.clearFrontPlanePreview}
              clearBackPlanePreview={this.clearBackPlanePreview}
              activeDungeonLevel={this.state.activeDungeonLevel}
              ></DungeonView>}
          </div>
        </div>
      </div>
    )

  }


}

export default MapMakerPage;