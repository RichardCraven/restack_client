import React from 'react'
import '@coreui/coreui/dist/css/coreui.min.css'
import '../styles/dungeon-board.scss'
import '../styles/map-maker.scss'
import {storeMeta, getMeta, setEditorPreference} from '../utils/session-handler'
import BoardView from './dungonBuilderViews/BoardView'
import BoardsPanel from './dungonBuilderViews/BoardsPanel'
import PlanesPanel from './dungonBuilderViews/PlanesPanel'
import PlaneView from './dungonBuilderViews/PlaneView'
import DungeonView from './dungonBuilderViews/DungeonView'
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { CFormCheck, CButtonGroup, CModal, CButton, CModalHeader, CModalTitle, CModalBody, CModalFooter} from '@coreui/react';
import arrowDown from '../assets/graphics/arrow_down.png'
import arrowUp from '../assets/graphics/arrow_up.png'
import arrowDownInvalid from '../assets/graphics/arrow_down_invalid.png'
import arrowUpInvalid from '../assets/graphics/arrow_up_invalid.png'
import spawnPoint from '../assets/graphics/location.png'
import door from '../assets/icons//portals/closed_door_browner.png'

import { CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CCollapse} from '@coreui/react';

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
  addDungeonRequest,
  deleteDungeonRequest,
  updateDungeonRequest,
  updateUserRequest
} from '../utils/api-handler';

import * as images from '../utils/images'
import BoardsPalette from './dungonBuilderViews/BoardsPalette'

const GATES = [
  {
      key: 'archway',
      requires: ''
  },
  {
      key: 'dungeon_door',
      requires: 'minor_key'
  },
  {
      key: 'gryphon_gate',
      requires: 'major_key'
  },
  {
      key: 'bat_gate',
      requires: 'major_key'
  },
  {
      key: 'evil_gate',
      requires: 'ornate_key'
  }
]

const clone = (thing) => {
  return JSON.parse(JSON.stringify(thing))
}

const delay = (numSeconds) => {
  return new Promise((resolve) => {
      setTimeout(()=>{
          resolve(numSeconds, ' complete')
      }, numSeconds * 1000)
  })
}

class MapMakerPage extends React.Component {
  constructor(props){
    super(props)
    let viewStateFromPrefs,
    meta = getMeta();
    if(meta?.preferences?.editor?.selectedView){
      viewStateFromPrefs = meta.preferences.editor.selectedView
      // debugger
      // let dungeon = meta.preferences.editor.loadedDungeon;
      // this.setLoadedDungeonDropdownValue(dungeon.name)

      // this.setViewState(meta.preferences.editor.selectedView)
    }

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
      toastMessage: '',
      // mapView: true,
      selectedView: viewStateFromPrefs ? viewStateFromPrefs : 'plane',
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

      // mainViewSelectVal : React.createRef(),
      dungeonSelectVal : React.createRef(),

      cachedOriginal: null,
      cachedincoming: null,
      boardsFolders: [],
      boardsFoldersExpanded : {},
      visible: false,
      activeDungeonLevel: 0,
      dungeonOverlayOn: false,
      overlayData: null,
      loadingData: true,
      imagesMatrix: {},
      selectedThingTitle: '',
      showPlanesNames: false
    };
  }
  

  componentDidMount(){
    const that = this;
    let images = {};
    // console.log('mounted: ', this.props);
    // console.log('ok, this is: ', this);
    function checkIfAllImagesHaveLoaded(){
      if(
        images.arrowUpImg &&
        images.arrowUpImgInvalid &&
        images.arrowDownImg &&
        images.arrowDownImgInvalid &&
        images.doorImg &&
        images.spawnPointImg
      ){
        // debugger
        that.setState({imagesMatrix : images})
      }
    }
    
    let arrowUpImg = new Image()
    arrowUpImg.src = arrowUp
    arrowUpImg.onload = function(){
        images['arrowUpImg'] = arrowUpImg;
        checkIfAllImagesHaveLoaded()
    }
    let arrowDownImg = new Image()
    arrowDownImg.src = arrowDown
    arrowDownImg.onload = function(){
        images['arrowDownImg'] = arrowDownImg
        checkIfAllImagesHaveLoaded()
    }
    let arrowUpImgInvalid = new Image()
    arrowUpImgInvalid.src = arrowUpInvalid
    arrowUpImgInvalid.onload = function(){
        images['arrowUpImgInvalid'] = arrowUpImgInvalid
        checkIfAllImagesHaveLoaded()
    }
    let arrowDownImgInvalid = new Image()
    arrowDownImgInvalid.src = arrowDownInvalid
    arrowDownImgInvalid.onload = function(){
        images['arrowDownImgInvalid'] = arrowDownImgInvalid;
        checkIfAllImagesHaveLoaded()
    }
    let doorImg = new Image()
    doorImg.src = door
    doorImg.onload = function(){
        images['doorImg'] = doorImg;
        checkIfAllImagesHaveLoaded()
    }
    let spawnPointImg = new Image()
    spawnPointImg.src = spawnPoint
    spawnPointImg.onload = function(){
        images['spawnPointImg'] = spawnPointImg;
        checkIfAllImagesHaveLoaded()
    }
    

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
    const meta = getMeta()
    // console.log('meta:', meta);  
    
    this.setState((state, props) => {
      return {
        tileSize,
        boardSize,
        tiles: props.mapMaker.tiles,
        // miniboards: arr
      }
    })
    this.nameFilterClicked();

    // if(meta?.preferences?.editor?.selectedView){
    //   console.log('viewState!!!', meta.preferences.editor.selectedView);
    //   // debugger
    //   // let dungeon = meta.preferences.editor.loadedDungeon;
    //   // this.setLoadedDungeonDropdownValue(dungeon.name)

    //   this.setViewState(meta.preferences.editor.selectedView)
    // }


    // this.setViewState('dungeon');
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
  // addNewPlane = async () =>
  addNewDungeon = () => {
    console.log('add new dungeon');
    // console.log('');
    // console.log('this.setState', this.setState);
    let d = new Date()
    let n = d.getTime();
    let rand = n.toString().slice(9,13);
    const dungeon = {
      name: `dungeon${rand}`,
      levels : [
        {
          id: 0,
          front: null,
          back: null,
          valid: false
        }
      ],
      pocket_planes : [
        {firmament: null},
        {sheol: null},
        {hyperspace: null}
      ]
    }
    console.log('uhhh, this is ', this);
    this.setState({
      showModal: true,
      modalType: 'name dungeon',
      loadedDungeon: dungeon
    })
  }
  deleteDungeon = async () => {
    // deleteActiveDungeon
    const dungeon = this.state.loadedDungeon;
    console.log('delete dungeon ', dungeon);
    console.log(dungeon.id);
    await deleteDungeonRequest(dungeon.id)
    console.log(`dungeon ${dungeon.id} deleted`);
    this.setState({loadedDungeon: null})
    this.loadAllDungeons();
    this.setLoadedDungeonDropdownValue('Dungeon Selector');

    // update user
    const meta = JSON.parse(sessionStorage.getItem('metadata'))
    const userId = sessionStorage.getItem('userId');
    
    // NEED TO ABSTRACT THIS INTO A USER SERVICE
    if(meta.preferences && meta.preferences.editor){
      meta.preferences.editor['loadedDungeon'] = null
    } else {
      meta.preferences = {
        ...meta.prerences,
        editor: { loadedDungeon: null}
      }
    }
    console.log('about to update user with meta ', meta);
    updateUserRequest(userId, meta)
    storeMeta(meta);


  }
  downloadDungeon = () => {
    const dungeon = this.state.loadedDungeon;
    const zip = new JSZip();
    let string = JSON.stringify(dungeon)
    zip.file(`${dungeon.name}.dungeon.json`, string)
    zip.generateAsync({type:'blob'})
    .then((content) => {
        saveAs(content, `${dungeon.name}`.zip);
    });
  }
  renameDungeon = () => {
    console.log('rename ndungeon');
    this.setState({
      showModal: true,
      modalType: 'rename dungeon'
    })
  }
  renameBoard = () => {
    console.log('in rename board, state.loadedBoard.name', this.state.loadedBoard?.name);
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
    if(this.state.mouseDown && this.state.pinnedOption && this.props.mapMaker.paletteTiles[this.state.pinnedOption.id]){
      let tile = this.props.mapMaker.tiles[id];
      let pinned = null;
      if(this.props.mapMaker.paletteTiles[this.state.pinnedOption.id]){
        pinned = this.props.mapMaker.paletteTiles[this.state.pinnedOption.id]
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
      if(pinned && pinned.optionType === 'delete'){
        let arr = [...this.state.tiles];
        arr[tile.id].image = null;
        arr[tile.id].color = null;
        arr[tile.id].contains = null;
        this.setState({
          tiles: arr,
          hoveredTileIdx: null
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
        // console.log('min is height', h);
    } else {
        tsize = w;
        // console.log('min is width', w);
    }
    this.setState({
      tileSize: tsize,
      boardSize: tsize*15
    })
  }
  
  handleClick = (tile) => {
    console.log('tile clicked: ', tile);
    if(tile.type === 'palette-tile'){
      console.log('palette tile clicked');
      if(this.state.optionClickedIdx === tile.id){
        console.log('option already open');
        this.setState({
          optionClickedIdx: null,
          pinnedOption: null
        })
      } else {
        this.setState({
          optionClickedIdx: tile.id,
          pinnedOption: tile
        })
      }
      
    } else if(tile.type === 'monster-tile' || tile.type === 'gate-tile'){
      console.log('MONSTER/GATE TILE');
      this.setState({
        pinnedOption: tile
      })
      setTimeout(()=>{
        console.log('pinnedoption: ', this.state.pinnedOption);
      },500)
    } else if(tile.type === 'board-tile'){
      let pinned = null, monster, gate;
      if(this.state.pinnedOption && this.state.pinnedOption.type === 'monster-tile'){
        monster = Object.values(this.props.monsterManager.monsters)[this.state.pinnedOption.id];
      };
      if(this.state.pinnedOption && this.state.pinnedOption.type === 'gate-tile'){
        console.log('id: ', this.state.pinnedOption.id);
        gate = GATES[this.state.pinnedOption.id];
      };
      if(monster){
        console.log('monster get here, monster: ', monster);
        let arr = [...this.state.tiles];
        arr[tile.id].contains = monster.key
        arr[tile.id].image = monster.portrait
        console.log('arr[tile.id]:', arr[tile.id]);
        console.log('tiles now ', arr);
        this.setState({
          tiles: arr,
          hoveredTileIdx: null
        })
        return
      } else if(gate){
        console.log('gate get here');
        let arr = [...this.state.tiles];
        arr[tile.id].contains = gate.key
        arr[tile.id].image = images[gate.key]
        console.log('arr[tile.id]:', arr[tile.id]);
        console.log('tiles now ', arr);
        this.setState({
          tiles: arr,
          hoveredTileIdx: null
        })
        return
      } else if(this.state.pinnedOption && this.props.mapMaker.paletteTiles[this.state.pinnedOption.id]){ 
        pinned = this.props.mapMaker.paletteTiles[this.state.pinnedOption.id]
      }
      console.log('pinned: ', pinned);
      console.log('this.props.mapMaker.paletteTiles', this.props.mapMaker.paletteTiles);
      if(pinned && pinned.optionType === 'void'){
        let arr = [...this.state.tiles];
        arr[tile.id].image = null;
        arr[tile.id].color = 'black'
        arr[tile.id].contains = 'void'
        this.setState({
          tiles: arr,
          hoveredTileIdx: null
        })
      } else if(pinned && pinned.optionType === 'voidfill'){
        let arr = [...this.state.tiles];
        arr.forEach(e=>{
          e.image = null;
          e.color = 'black'
          e.contains = 'void'
        })
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
        console.log('in final pin block, pinned: ', pinned);
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
    let title = '';
    switch(state){
      case 'plane':
        // console.log('plane...');
        if(this.state.loadedPlane) title = `Plane: ${this.state.loadedPlane.name}`
      break;
      case 'board':
        if(this.state.loadedBoard) title = `Board: ${this.state.loadedBoard.name}`
      break;
      case 'dungeon':
        if(this.state.loadedDungeon) title = `Dungeon: ${this.state.loadedDungeon.name}`
      break;
    }
    this.setState({
      selectedView: state,
      dungeonOverlayOn: false,
      overlayData: null,
      selectedThingTitle: title
    })

    // update user
    const meta = JSON.parse(sessionStorage.getItem('metadata'))
    const userId = sessionStorage.getItem('userId');
    
    // NEED TO ABSTRACT THIS INTO A USER SERVICE
    if(meta.preferences && meta.preferences.editor){
      meta.preferences.editor['selectedView'] = state
    } else {
      meta.preferences = {
        editor: { selectedView: state}
      }
    }
    console.log('about to update user with meta ', meta);
    updateUserRequest(userId, meta)
    storeMeta(meta);
  }

  expandCollapseBoardFolders= (folderTitle) => {
    let matrix = this.state.boardsFoldersExpanded;
    matrix[folderTitle] = !matrix[folderTitle];
    this.setState(() => { return {boardsFoldersExpanded: matrix}})
  }

  // Board CRUD methods
  writeBoard = async () => {
    console.log('write board');
    // let planesToUpdate = [];
    let miniboards;

    const config = this.props.mapMaker.getMapConfiguration(this.state.tiles)    
    // state.loadBoard is currently set to the new incoming board
    let planesToUpdate = this.planesContainingBoard(this.state.loadedBoard)
    
    if(this.state.loadedBoard && this.state.loadedBoard.id){
      console.log('state.loadedboard" ', this.state.loadedBoard);

      // if(this.state.planes.length > 0){
      //   this.state.planes.forEach((d) => {
      //     let planeHasMatchingBoard = false;
      //     d.miniboards.forEach((b, index) => {
            
            // if(b.id === this.state.loadedBoard.id){
            //   planeHasMatchingBoard = true;
            //   console.log('found a plane with matching board: ', d);
            //   miniboards = d.miniboards;
            //   miniboards[index] = this.state.loadedBoard;
            //   miniboards[index].name = this.state.loadedBoard.name;
            //   miniboards[index].tiles = this.state.tiles;
            //   miniboards[index].config = config;
            // } 
      //     })
      //     // console.log('d.id:', d.id)
      //     d.valid = this.props.mapMaker.isValidPlane(miniboards)
      //     if(planeHasMatchingBoard) planesToUpdate.push(d)
          
      //   })
      // }
      let obj = {
        name: this.state.loadedBoard.name,
        tiles: clone(this.state.tiles),
        config: clone(config)
      }
      
      await updateBoardRequest(this.state.loadedBoard.id, obj);
      console.log('individual board API request resolved, planestoUpdate: ', planesToUpdate);
      console.log('LOAD ALL BOARDS BYPASSED');
      // this.loadAllBoards();
      // ^ this is only needed to update board to board BoardsPanel. instead, just directly add it!

      

      this.toast('Board Saved')
    } else {
      
      console.log('CLONE PATH, RENAME SHOULD NOT GET HERE');
      
      const newBoard = {
        name: clone(this.state.loadedBoard.name),
        tiles: clone(this.state.tiles),
        config: clone(config)
      }
      const addedMap = await addBoardRequest(newBoard)
      newBoard.id = addedMap.data._id

      console.log('LOAD ALL BOARDS BYPASSED 2');
      // this.loadAllBoards(); 
      this.insertNewBoardIntoPanel(newBoard)
      // ^ this is only needed to add board to board BoardsPanel. instead, just directly add it!

      this.loadBoard(newBoard)

      this.toast('Board Saved')
    }
    if(planesToUpdate && planesToUpdate.length > 1){
      console.log('multiple planes to update, figure this out');
      debugger
      
    } else if (planesToUpdate && planesToUpdate.length === 1){
      const newBoard = {
        name: clone(this.state.loadedBoard.name),
        tiles: clone(this.state.tiles),
        config: clone(config),
        id: this.state.loadedBoard.id
      }

      console.log('there is a plane to update', planesToUpdate[0]);
      let plane = clone(planesToUpdate[0]);
      console.log('planeId: ', plane.id);
      if(!newBoard.id){
        console.log('wtf how is this possible');
        debugger
      }
      let index = plane.miniboards.findIndex(b=> b.id === newBoard.id);
      plane.miniboards[index] = newBoard;
      const obj = {
        name: plane.name,
        miniboards: plane.miniboards,
        spawnPoints: plane.spawnPoints,
        valid: plane.valid
      }
      await updatePlaneRequest(plane.id, obj);
      await this.loadAllPlanes();

      const dungeonClone = clone(this.state.loadedDungeon);
      let needToUpdateDungeon = false;
      console.log('checking if ned to update dungeon');
      dungeonClone.levels.forEach(level => {
        const frontPlane = level.front,
        backPlane = level.back;
        if(frontPlane && frontPlane.id === plane.id){
          needToUpdateDungeon = true;
          level.front = clone(plane)
          console.log('CHICKEN DINNER');
          // frontPlane.miniboards.forEach((m,i)=>{
            //   if(m.id === this.state.loadedBoard.id){
              //     boardMatch = {levelId: l.id, orientation: 'front', miniboardIndex: i}
              //     f = true;
              //   }
              // })
        }
        console.log('back plane id vs plane id: ', backPlane?.id, plane.id);
        if(backPlane && backPlane.id === plane.id){
          needToUpdateDungeon = true;
          level.back = clone(plane)
          console.log('CHICKEN DINNER [backside');
          // backPlane.miniboards.forEach((m,i)=>{
          //   if(m.id === this.state.loadedBoard.id){
          //     boardMatch = {levelId: l.id, orientation: 'back', miniboardIndex: i}
          //     b = true;
          //   }
          // })
        }
      })
      if(needToUpdateDungeon){
        console.log('eyyyy');
        this.setState({loadedDungeon: dungeonClone})
        this.writeDungeon();
      }
      setTimeout(()=>{
        console.log('updated plane ref: ', this.state.planes.find(p=>p.id === plane.id));
        this.loadPlane(this.state.planes.find(p=>p.id === plane.id))
      })

      // let boardMatch;
      // if(this.state.loadedDungeon){
      //   this.state.loadedDungeon.levels.forEach(l=> {
      //     let f, b;
      //     if(l.front){
      //       l.front.miniboards.forEach((m,i)=>{
      //         if(m.id === this.state.loadedBoard.id){
      //           boardMatch = {levelId: l.id, orientation: 'front', miniboardIndex: i}
      //           f = true;
      //         }
      //       })
      //     }
      //     if(l.back){
      //       l.back.miniboards.forEach((m,i)=>{
      //         if(m.id === this.state.loadedBoard.id){
      //           boardMatch = {levelId: l.id, orientation: 'back', miniboardIndex: i}
      //           b = true;
      //         }
      //       })
      //     }
      //     if(f && b){
      //       console.log('SHOULD NOT HAVE BOTH FRONT AND BACK MATCH');
      //       debugger
      //     }
      //   })
      // }
      
      // if(boardMatch){
      //   console.log('this level is in currently loaded dungeon!!!! boarMatch: ', boardMatch);
        
      //   const dungeon = this.state.loadedDungeon;
      //   const level = dungeon.levels.find(l => l.id === boardMatch.levelId)
      //   if(boardMatch.orientation === 'front'){
      //     level.front.miniboards[boardMatch.miniboardIndex] = clone(this.state.loadedBoard)
      //   }
      //   if(boardMatch.orientation === 'back'){
      //     level.back.miniboards[boardMatch.miniboardIndex] = clone(this.state.loadedBoard)
      //   }
      //   console.log('dungeon:', dungeon, 'level:', level, boardMatch);
      //   this.setState({loadedDungeon: dungeon})
      //   this.writeDungeon();
      // }
    }
  }

  updateDungeonWithPlane = (plane) => {

  }

  updateBoard = (boardId) => {
    console.log('updating board with id: ', boardId);
  }

  loadBoard = (board) => {
    console.log('load board: ', board);
    const boardRef = this.findBoardRefInFolders(board.id)
    console.log('found board ref: ', boardRef);
    if(!boardRef){
      console.log('somehow you loaded a board that doesnt exist in folders or state.boards... investigate!');
      debugger
    }
    if(this.state.selectedView !== 'board'){
      this.setViewState('board')
    } 
    this.setState({
      loadedBoard: boardRef,
      tiles: boardRef.tiles,
      selectedThingTitle: `Board: ${board.name}`
    })
  }
  zoomIntoBoard = (levelId, miniboardIndex, frontOrBack) => {
    console.log('zoom into ', levelId, miniboardIndex, frontOrBack);
    const level = this.state.loadedDungeon.levels.find(e=>e.id === levelId)
    const miniboard = frontOrBack === 'front' ? level.front.miniboards[miniboardIndex] : level.back.miniboards[miniboardIndex]
    console.log('level:', level, 'miniboard:', miniboard);
    if(level && miniboard){
      this.loadBoard(miniboard)
      // console.log('setting videw state');
      // this.setViewState('board')
      // // this.set
      // this.setState({
      //   loadedBoard: miniboard,
      //   tiles: miniboard.tiles
      // })
    }
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
  findBoardRefInFolders = (boardId) => {
    const boardFolders = this.state.boardsFolders;
    let found = null;
    boardFolders.forEach(f=>{
      let localFound = f.contents.find(b=>b.id === boardId)
      if(localFound) found = localFound;
      f.subfolders.forEach(fsub=>{
        let localFound = fsub.contents.find(b=>b.id === boardId)
        if(localFound) found = localFound;
        fsub.deepfolders.forEach(fdeep=>{
          let localFound = fdeep.contents.find(b=>b.id === boardId)
          if(localFound) found = localFound;
        })
      })
    })
    let localFound = this.state.boards.find(b=>b.id === boardId)
    if(localFound) found = localFound;

    // console.log('board folders: ', boardFolders);
    // console.log('top level', this.state.boards);
    return found;
  }
  updateLoadedBoardInPanel = (board) => {

    // THIS IS TO UPDATE A BOARD FOLDER LOCATION ONLY (renaming is already handled)

    console.log('update board in panel: ', board);
    const loadedBoard = this.state.loadedBoard;
    const boards = this.state.boards,
    boardsFolders = this.state.boardsFolders;
    console.log('boardsFolders: ', boardsFolders);

    let b = boards.find(e=>e.id === loadedBoard.id),
    b_main, b_sub, b_deep, boardFound; 
    if(b) b = loadedBoard;
    // const clone = (obj) => {
    //   return JSON.parse(JSON.stringify(obj))
    // }
    this.state.boardsFolders.forEach(folder=>{
      let found = folder.contents.find(x=>x.id === loadedBoard.id)
      if(found){
        folder.contents = folder.contents.filter(r=>r!==found)
        boardFound = found;
      }

      // if(folder.subfolders){
        folder.subfolders.forEach(subfolder=>{
          let found2 = subfolder.contents.find(x=>x.id === loadedBoard.id)
          if(found2){
            subfolder.contents = subfolder.contents.filter(r=>r!==found2)
            boardFound = found2;
          }

          // if(subfolder.deepfolders){
            subfolder.deepfolders.forEach(deepfolder=>{
              let found3 = deepfolder.contents.find(x=>x.id === loadedBoard.id)
              if(found3){
                deepfolder.contents = deepfolder.contents.filter(r=>r!==found3)
                boardFound = found3;
              }
            })
          // }
        })
      // }
      if(!boardFound){
        console.log('this flow is from the rename of a brand new board');
        return
      }
      console.log('finally.... insert board found', boardFound);
      this.insertNewBoardIntoPanel(boardFound)
      console.log('b: ', b, 'b_main:', b_main, 'b_sub:', b_sub, 'b_deep:', b_deep);
    })


    // if(board.name && board.name.includes('_')){
    //   let title = board.name.split('_')[0],
    //   subtitle = board.name.split('_').length > 2 ? board.name.split('_')[1] : null,
    //   deeptitle = subtitle && board.name.split('_').length > 3 ? board.name.split('_')[2] : null,
    //   existingSubfolder = boardsFolders.find(e=>e.title === title)?.subfolders.find(e=>e.title === subtitle),
    //   existingDeepfolder = boardsFolders.find(e=>e.title === title)?.subfolders.find(e=>e.title === subtitle)?.deepfolders.find(e=>e.title === deeptitle)

    //   if(existingDeepfolder){
    //     let found = existingDeepfolder.contents.find(e=>e.name === board.name)
    //     // existingDeepfolder.contents = existingDeepfolder.contents.filter(e=> e.name !== board.name)
    //   }
    //   if(existingSubfolder){
    //     let found = existingSubfolder.contents.find(e=>e.name === board.name)
    //     // existingSubfolder.contents = existingSubfolder.contents.filter(e=> e.name !== board.name)
    //   }
    // } else {
    //   let found = boards.find(e=>e.name === board.name)
    //   // boards = boards.filter(e=> e.name !== board.name)
    // }

    // this.setState(() => {
    //   return {
    //     boards,
    //     boardsFolders
    //   }
    // })
  }
  isInSameFolder = (firstName, secondName) => {
    console.log('firstname, secondName', firstName, secondName);
    if(!firstName) return false;
    let title = firstName.split('_')[0],
      subfolder = firstName.split('_').length > 2 ? firstName.split('_')[1] : null,
      deepfolder = subfolder && firstName.split('_').length > 3 ? firstName.split('_')[2] : null

    let title2 = secondName.split('_')[0],
      subfolder2 = secondName.split('_').length > 2 ? secondName.split('_')[1] : null,
      deepfolder2 = subfolder2 && secondName.split('_').length > 3 ? secondName.split('_')[2] : null

    if(deepfolder) return deepfolder === deepfolder2
    if(subfolder) return subfolder === subfolder2
    if(title) return title === title2
    return false
    // const boardsFolders = this.state.boardsFolders;
    // let title_first = first.name.split('_')[0],
    //   subtitle_first = first.name.split('_').length > 2 ? first.name.split('_')[1] : null,
    //   deeptitle_first = subtitle_first && first.name.split('_').length > 3 ? first.name.split('_')[2] : null,
    //   folderExists_first = boardsFolders.map(e=>e.title).includes(title_first),
    //   existingSubfolder_first = boardsFolders.find(e=>e.title === title_first)?.subfolders.find(e=>e.title === subtitle_first),
    //   existingDeepfolder_first = boardsFolders.find(e=>e.title === title_first)?.subfolders.find(e=>e.title === subtitle_first)?.deepfolders.find(e=>e.title === deeptitle_first);

    // let title_second = second.name.split('_')[0],
    //   subtitle_second = second.name.split('_').length > 2 ? second.name.split('_')[1] : null,
    //   deeptitle_second = subtitle_second && second.name.split('_').length > 3 ? second.name.split('_')[2] : null,
    //   folderExists_second = boardsFolders.map(e=>e.title).includes(title_second),
    //   existingSubfolder_second = boardsFolders.find(e=>e.title === title_second)?.subfolders.find(e=>e.title === subtitle_second),
    //   existingDeepfolder_second = boardsFolders.find(e=>e.title === title_second)?.subfolders.find(e=>e.title === subtitle_second)?.deepfolders.find(e=>e.title === deeptitle_second);

    //   console.log('first', first.name, 'second', second.name);
    // console.log('title_first', title_first);
    // console.log('title_second', title_second);
    // console.log('subtitle_first', subtitle_first);
    // console.log('subtitle_second', subtitle_second);
    // console.log('deeptitle_first', deeptitle_first);
    // console.log('deeptitle_second', deeptitle_second);

    //   console.log('existingSubfolder_first', existingSubfolder_first);
    //   console.log('existingSubfolder_second', existingSubfolder_second);
    //   console.log('existingDeepfolder_first', existingDeepfolder_first);
    //   console.log('existingDeepfolder_second', existingDeepfolder_second);
    //   if(folderExists_first === folderExists_second && existingSubfolder_first === existingSubfolder_second && existingDeepfolder_first === existingDeepfolder_second) return true
    //   return false
  }
  insertNewBoardIntoPanel = (board) => {
    const boards = this.state.boards,
    boardsFolders = this.state.boardsFolders;
    // boardsFoldersExpanded = this.state.boardsFoldersExpanded;
    
    console.log('in insertNewBoardIntoPanel board: ', board, 'boards', boards, 'boardsFolders', boardsFolders);
    

    if(board.name && board.name.includes('_')){
      let title = board.name.split('_')[0],
      subtitle = board.name.split('_').length > 2 ? board.name.split('_')[1] : null,
      deeptitle = subtitle && board.name.split('_').length > 3 ? board.name.split('_')[2] : null,
      folderExists = boardsFolders.map(e=>e.title).includes(title),
      existingSubfolder = boardsFolders.find(e=>e.title === title)?.subfolders.find(e=>e.title === subtitle),
      existingDeepfolder = boardsFolders.find(e=>e.title === title)?.subfolders.find(e=>e.title === subtitle)?.deepfolders.find(e=>e.title === deeptitle)

      console.log('board title', title);
      console.log('board subtitle: ', subtitle);
      console.log('board deeptitle: ', deeptitle);

      if(!folderExists){
        boardsFolders.push({
          title,
          contents: [],
          subfolders: [],
          expanded: false
        })
      }
      if(!existingSubfolder && subtitle){
        boardsFolders.find(e=>e.title === title).subfolders.push({
          title: subtitle,
          contents: [],
          deepfolders: []
        })
      }
      if(!existingDeepfolder && deeptitle){
        boardsFolders.find(e=>e.title === title).subfolders.find(e=>e.title === subtitle).deepfolders.push({
          title: deeptitle,
          contents: []
        })
      }

      if(!subtitle){
        boardsFolders.find(e=>e.title === title).contents.push(board)
      }
      if(subtitle && !deeptitle){
        boardsFolders.find(e=>e.title === title).subfolders.find(e=>e.title === subtitle).contents.push(board)
      }
      if(deeptitle){
        boardsFolders.find(e=>e.title === title).subfolders.find(e=>e.title === subtitle).deepfolders.find(e=>e.title === deeptitle).contents.push(board)
      }
    } else {
      boards.push(board)
    }

    this.setState(() => {
      return {
        boards,
        boardsFolders
      }
    })
  }
  removeBoardFromPanel = (board) => {
    let boards = this.state.boards,
    boardsFolders = this.state.boardsFolders;

    if(board.name && board.name.includes('_')){
      let title = board.name.split('_')[0],
      subtitle = board.name.split('_').length > 2 ? board.name.split('_')[1] : null,
      deeptitle = subtitle && board.name.split('_').length > 3 ? board.name.split('_')[2] : null,
      existingSubfolder = boardsFolders.find(e=>e.title === title)?.subfolders.find(e=>e.title === subtitle),
      existingDeepfolder = boardsFolders.find(e=>e.title === title)?.subfolders.find(e=>e.title === subtitle)?.deepfolders.find(e=>e.title === deeptitle)

      if(existingDeepfolder){
        // let found = existingDeepfolder.contents.find(e=>e.name === board.name)
        existingDeepfolder.contents = existingDeepfolder.contents.filter(e=> e.name !== board.name)
      }
      if(existingSubfolder){
        // let found = existingSubfolder.contents.find(e=>e.name === board.name)
        existingSubfolder.contents = existingSubfolder.contents.filter(e=> e.name !== board.name)
      }
    } else {
      boards = boards.filter(e=> e.name !== board.name)
    }

    this.setState(() => {
      return {
        boards,
        boardsFolders
      }
    })
  }
  loadAllBoards = async () => {
    const val = await loadAllBoardsRequest();
    const boards = [],
    boardsFolders = [],
    boardsFoldersExpanded = {};
    val.data.forEach((e)=>{
      let board = JSON.parse(e.content)
      board.id = e._id;
      if(board.name && board.name.includes('_')){
        let title = board.name.split('_')[0],
        subtitle = board.name.split('_').length > 2 ? board.name.split('_')[1] : null,
        deeptitle = subtitle && board.name.split('_').length > 3 ? board.name.split('_')[2] : null,
        folderExists = boardsFolders.map(e=>e.title).includes(title),
        existingSubfolder = boardsFolders.find(e=>e.title === title)?.subfolders.find(e=>e.title === subtitle),
        existingDeepfolder = boardsFolders.find(e=>e.title === title)?.subfolders.find(e=>e.title === subtitle)?.deepfolders.find(e=>e.title === deeptitle)

        if(!folderExists){
          boardsFolders.push({
            title,
            contents: [],
            subfolders: [],
            expanded: false
          })
        }
        if(!existingSubfolder && subtitle){
          boardsFolders.find(e=>e.title === title).subfolders.push({
            title: subtitle,
            contents: [],
            deepfolders: []
          })
        }
        if(!existingDeepfolder && deeptitle){
          boardsFolders.find(e=>e.title === title).subfolders.find(e=>e.title === subtitle).deepfolders.push({
            title: deeptitle,
            contents: []
          })
        }

        if(!subtitle){
          boardsFolders.find(e=>e.title === title).contents.push(board)
        }
        if(subtitle && !deeptitle){
          boardsFolders.find(e=>e.title === title).subfolders.find(e=>e.title === subtitle).contents.push(board)
        }
        if(deeptitle){
          boardsFolders.find(e=>e.title === title).subfolders.find(e=>e.title === subtitle).deepfolders.find(e=>e.title === deeptitle).contents.push(board)
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
    this.setState(() => {
      return {
        boards,
        boardsFolders,
        boardsFoldersExpanded
      }
    })
  }

  addNewBoard = async () => {
    if(this.state.loadedBoard){
      await this.clearLoadedBoard();
    }
    
    let d = new Date()
    let n = d.getTime();
    let rand = n.toString().slice(9,13);

    let newBoard = {
        name: `board${rand}`,
        config: [[],[],[],[]],
        tiles: []
    }
    console.log('new board: ', newBoard);
    this.setState({
      loadedBoard: newBoard
    })
    setTimeout(()=>{
      console.log('1about to fire loaded board, this.state.loadedBoard:', clone(this.state.loadedBoard));
      this.renameBoard();
    })
    setTimeout(()=>{
      console.log('2about to fire loaded board, this.state.loadedBoard:', clone(this.state.loadedBoard));
      // this.renameBoard();
    },100)
    setTimeout(()=>{
      console.log('3about to fire loaded board, this.state.loadedBoard:', clone(this.state.loadedBoard));
      // this.renameBoard();
    },1000)
  }

  cloneBoard = () => {
    let d = new Date()
    let n = d.getTime();
    let rand = n.toString().slice(9,13)

    let newBoard = {
        name: `board${rand}`,
        config: [[],[],[],[]],
        tiles: []
    }
    this.setState({
      loadedBoard: newBoard
    })
    setTimeout(()=>{
      this.renameBoard();
    })
  }
  freezeSelectedPanelBoardBeforeClearing = () => {
    let loadedBoard = this.state.loadedBoard;
    let foundBoard;
    console.log('loadedBoard.id', loadedBoard.id);

    // return new Promise(resolve => {
      
    // })

    this.state.boardsFolders.forEach((folder)=>{
      let f = folder.contents.find(b=>b.id === loadedBoard.id)
      if(f) foundBoard = f;
      folder.subfolders.forEach((subfolder) => {
        let s = subfolder.contents.find(b=>b.id === loadedBoard.id)
        if(s) foundBoard = s;
        subfolder.deepfolders.forEach((deepfolder)=>{
          deepfolder.contents.forEach(e=>{
            // console.log('deep board.id', e.id, 'vs ', loadedBoard.id);
            // if(e.id === loadedBoard.id) foundbo
          })
          let d = deepfolder.contents.find(b=>b.id === loadedBoard.id)
          if(d) foundBoard = d;
        })
      })
    })
    let topLevelFound = this.state.boards.find(b=>b.id === loadedBoard.id)
    if(topLevelFound) foundBoard = topLevelFound;
    console.log('foundBoard: ', foundBoard);
    if(foundBoard){
      foundBoard.tiles = JSON.parse(JSON.stringify(loadedBoard.tiles))
      foundBoard = JSON.parse(JSON.stringify(loadedBoard))
    }
  }
  clearLoadedBoard = async () => {
    console.log('clearing loaded board');
    return new Promise(resolve => {
      if(this.state.loadedBoard) this.freezeSelectedPanelBoardBeforeClearing()
      
        let arr = [...this.state.tiles]
        for(let t of arr){
          t.image = null;
          t.contains = null;
          t.color = null
        }
        this.setState({
          loadedBoard: null,
          tiles: arr,
          // miniboards
        })
        console.log('should have cleared thre board');
        setTimeout(()=>{
          console.log('resolving promise');
          resolve()
        })
    })
    
    
    // let miniboards = []
    // for(let i = 0; i < 9; i++){
      //   miniboards.push([])
      // }
      
      
    
  }
  deleteBoard = async (boardId) => {
    if(this.state.loadedBoard){
      console.log('THIS FLOW SHOULD ONLY BE USED IF YOU WANT TO DELETE THE CURRENT LOADED BOARD, NOT FOR ITERATIVE METHOD');
      
      let board = this.state.loadedBoard;
      this.removeBoardFromPanel(board)
      let planesToUpdate = this.planesContainingBoard(this.state.loadedBoard)
      await deleteBoardRequest(board.id);
      await this.clearLoadedBoard();
      this.toast('Board Deleted')
      
      if(planesToUpdate && planesToUpdate.lensgth > 1){
        console.log('multiple planes to update, figure this out');
        debugger
        // const payload = planesToUpdate.map(p=> {
        //   return {
        //     name: p.name,
        //     miniboards: p.miniboards,
        //     spawnPoints: p.spawnPoints,
        //     valid: p.valid,
        //     id: p.id
        //   }
        // })
        
      } else if (planesToUpdate && planesToUpdate.length === 1){
        console.log('there is a plane to update', planesToUpdate[0]);
        let plane = planesToUpdate[0],
        index = plane.miniboards.findIndex(b => {
          return b.id === boardId
        }),
        planeId = plane.id;
        console.log('index to update', index);
        console.log('plane to update: ', plane);
        let newPlane = clone(plane)
        newPlane.miniboards[index] = {processed: undefined};
        console.log('now newPlane is ', newPlane);
        const obj = {
          name: newPlane.name,
          miniboards: newPlane.miniboards,
          spawnPoints: newPlane.spawnPoints,
          valid: newPlane.valid
        }
        await updatePlaneRequest(plane.id, obj);
        await this.loadAllPlanes();
      }
    }
  }
  planesContainingBoard = (board) => {
    let planesToUpdate = [];
    if(!board.id) return planesToUpdate;
    console.log('board: ', board, 'boardId = ', board.id);
    if(this.state.planes.length > 0){
      console.log('planes: ', this.state.planes);
      this.state.planes.forEach((plane) => {
        let planeHasMatchingBoard = false;
        console.log('plane: ', plane);
        plane.miniboards.forEach((b, index) => {
          
          if(b.id === board.id){
            planeHasMatchingBoard = true;
            console.log('found a plane with matching board: ', plane);
            // miniboards = d.miniboards;
            // miniboards[index] = board;
            // miniboards[index].name = board.name;
            // miniboards[index].tiles = this.state.tiles;
            // miniboards[index].config = config;
          } 
        })
        // d.valid = this.props.mapMaker.isValidPlane(miniboards)
        if(planeHasMatchingBoard) planesToUpdate.push(plane)
      })
    }
    return planesToUpdate;
  }
  
  dungeonsContainingPlane = (plane) => {
    //this actually needs to be a get all dungeons sort of flow, but for now I'm just going to handle the loaded dungeon
    console.log('loaded dungeon: ', this.state.loadedDungeon);
    
  }

  // Dungeon CRUD Methods
  // saveDungeon = async () => {
  //   console.log('save dungeon');
  //   if(this.state.loadedDungeon){
  //     let obj = {
  //       name: this.state.loadedDungeon.name,
  //       miniboards: this.state.miniboards,
  //       spawnPoints: this.props.mapMaker.getSpawnPoints(this.state.miniboards),
  //       valid: this.props.mapMaker.isValidPlane(this.state.miniboards)
  //     }
  //     await updatePlaneRequest(this.state.loadedDungeon.id, obj);
  //     this.loadAllPlanes(); 
  //     this.toast('Plane Saved')
  //   } else {
  //     let obj = {
  //       name: this.state.loadedDungeon.name,
  //       miniboards: this.state.miniboards,
  //       spawnPoints: this.props.mapMaker.getSpawnPoints(this.state.miniboards),
  //       valid: this.props.mapMaker.isValidPlane(this.state.miniboards)
  //     }
  //     await addPlaneRequest(obj);
  //     this.toast('Plane Saved')
  //     this.loadAllPlanes(); 
  //   }

  //   // this update user block NEEDS to be abstracted. you can search 'update user' to find all instances of it
  //   console.warn('this update user block NEEDS to be abstracted. you can search "update user" to find all instances of it')
  //   console.log('HELLO??? MCFLY???????');
  //   // update user
  //   const meta = JSON.parse(sessionStorage.getItem('metadata'))
  //   const userId = sessionStorage.getItem('userId');
    
  //   // NEED TO ABSTRACT THIS INTO A USER SERVICE
  //   if(meta.preferences && meta.preferences.editor){
  //     meta.preferences.editor['loadedDungeon'] = this.state.loadedDungeon
  //   } else {
  //     meta.preferences = {
  //       ...meta.prerences,
  //       editor: { loadedDungeon: this.state.loadedDungeon}
  //     }
  //   }
  //   console.log('about to update user with meta ', meta);
  //   updateUserRequest(userId, meta)
  //   storeMeta(meta);
  // }
  writePlane = async () => {
    if(this.state.selectedView !== 'plane') return
    if(this.state.loadedPlane && this.state.loadedPlane.id){
      console.log('miniboards: ', this.state.loadedPlane.miniboards);
      let obj = {
        name: this.state.loadedPlane.name,
        miniboards: this.state.loadedPlane.miniboards,
        spawnPoints: this.props.mapMaker.getSpawnPoints(this.state.loadedPlane.miniboards),
        valid: this.props.mapMaker.isValidPlane(this.state.loadedPlane.miniboards)
      }
      await updatePlaneRequest(this.state.loadedPlane.id, obj);
      this.loadAllPlanes(); 
      this.toast('Plane Saved')
    } else {
      console.log('brand new plane!')
      let newPlanePayload = {
        name: this.state.loadedPlane.name,
        miniboards: this.state.loadedPlane.miniboards,
        spawnPoints: this.state.loadedPlane.spawnPoints,
        valid: false
      }
      console.log('adding new plane with payload:', newPlanePayload)
      const newPlaneRes = await addPlaneRequest(newPlanePayload);
      let lp = this.state.loadedPlane
      lp.id = newPlaneRes.data._id;
      this.setState({
        loadedPlane: lp,
        // miniboards: this.state.loadedPlane.miniboards
      })
      this.toast('Plane Saved')
      this.loadAllPlanes(); 
    }
  }
  writeDungeon = async () => {
    console.log('loaded dungeon', this.state.loadedDungeon);
    if(this.state.loadedDungeon && this.state.loadedDungeon.id){
      console.log('existing dungeon, update');
      await updateDungeonRequest(this.state.loadedDungeon.id, this.state.loadedDungeon);
      setEditorPreference('loadedDungeon', this.state.loadedDungeon)
      this.loadAllDungeons()
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
      let loadedDungeon = this.state.loadedDungeon
      loadedDungeon.id = newDungeonRes.data._id;
      console.log('about to format');
      this.setState({
        loadedDungeon: this.props.mapMaker.formatDungeon(loadedDungeon)
        // miniboards: this.state.loadedDungeon.miniboards
      })
      this.toast('Dungeon Saved')
      this.loadAllDungeons(); 
    }
    // this update user block NEEDS to be abstracted. you can search 'update user' to find all instances of it
    console.warn('this update user block NEEDS to be abstracted. you can search "update user" to find all instances of it')
    console.log('HELLO??? MCFLY???????');
    // update user
    const meta = JSON.parse(sessionStorage.getItem('metadata'))
    const userId = sessionStorage.getItem('userId');
    
    // NEED TO ABSTRACT THIS INTO A USER SERVICE
    if(meta.preferences && meta.preferences.editor){
      meta.preferences.editor['loadedDungeon'] = this.state.loadedDungeon
    } else {
      console.log('about to format...');
      meta.preferences = {
        ...meta.prerences,
        editor: { loadedDungeon: this.props.mapMaker.formatDungeon(this.state.loadedDungeon)}
      }
    }
    console.log('about to update user with meta ', meta);
    updateUserRequest(userId, meta)
    storeMeta(meta);
  }
  validatePlane = (plane) => {
    console.log('validating plane: ', plane);
    plane.miniboards.forEach((b, i)=>{
      b.processed = this.props.mapMaker.filterMapAdjacency(b, i, plane.miniboards);
      // console.log('b.processed: ', b.processed);  
      if(!b.processed) return;

      if(i === 0){
        b.valid = b.processed.right.includes(plane.miniboards[1].id) &&
                  b.processed.bot.includes(plane.miniboards[3].id)
      }
      if(i === 1){
       
          b.valid = b.processed.left.includes(plane.miniboards[0].id) &&
          b.processed.right.includes(plane.miniboards[2].id) &&
          b.processed.bot.includes(plane.miniboards[4].id)
      }
      if(i === 2){
          b.valid = b.processed.left.includes(plane.miniboards[1].id) &&
          b.processed.bot.includes(plane.miniboards[5].id)
      }
      if(i === 3){
          b.valid = b.processed.top.includes(plane.miniboards[0].id) &&
          b.processed.right.includes(plane.miniboards[4].id) &&
          b.processed.bot.includes(plane.miniboards[6].id)
      }
      if(i === 4){
         b.valid = b.processed.left.includes(plane.miniboards[3].id) &&
        b.processed.bot.includes(plane.miniboards[7].id) &&
        b.processed.top.includes(plane.miniboards[1].id) &&
        b.processed.right.includes(plane.miniboards[5].id)
      }
      if(i === 5){
          b.valid = b.processed.left.includes(plane.miniboards[4].id) &&
          b.processed.bot.includes(plane.miniboards[8].id)
      }
      if(i === 6){
          b.valid = b.processed.top.includes(plane.miniboards[3].id) &&
          b.processed.right.includes(plane.miniboards[7].id)
        
      }
      if(i === 7){
          b.valid = b.processed.top.includes(plane.miniboards[4].id) &&
          b.processed.left.includes(plane.miniboards[6].id) &&
          b.processed.right.includes(plane.miniboards[8].id)
      }
      if(i === 8){
        b.valid = b.processed.top.includes(plane.miniboards[5].id) &&
        b.processed.left.includes(plane.miniboards[7].id)
      }
    })
    if(plane.miniboards.some(e=>!e.valid)) plane.valid = false
    console.log('validated plane:', plane)
    return plane
  }
  loadPlane = (incomingPlane) => {
    let plane = this.validatePlane(incomingPlane)
    console.log('loaded plane: ', plane);
    this.setState({
      loadedPlane: plane,
      selectedThingTitle: `Plane: ${plane.name}`
      // miniboards: plane.miniboards
    })
  }
  loadDungeon = async (id) => {
    console.log('load dungein: ', id);
    const val = await loadDungeonRequest(id)
    let e = val.data[0];
    console.log('e: ', e);
    let dungeon = JSON.parse(e.content), dungeonValid = true;
    console.log('dungeon before formatting:  ', dungeon);
    // debugger
    dungeon = this.props.mapMaker.formatDungeon(dungeon);
    console.log('dungeon after formattingL: ', dungeon);
    for(let key in dungeon.levels){
      let level = dungeon.levels[key]
      console.log('corncob level: ', dungeon.levels[key])
      if(level.front){
        level.front = this.validatePlane(level.front)
        if(!level.front.valid){
          dungeonValid = false;
          console.log('level not valid!')
        }
      }
      if(level.back){
        level.back = this.validatePlane(level.back)
        if(!level.back.valid) dungeonValid = false;
      }
    }
    dungeon.valid = dungeonValid;
    console.log('about to format 3');
    this.setState({
      loadedDungeon: this.props.mapMaker.formatDungeon(dungeon)
    })
  }
  loadAllDungeons = async () => {
    const val = await loadAllDungeonsRequest()
    let dungeons = [];
    val.data.forEach((e)=>{
      let dungeon = JSON.parse(e.content)
      // console.log('raw dungeon content ', JSON.parse(e.content));
      dungeon.id = e._id;
      dungeons.push(this.props.mapMaker.formatDungeon(dungeon))
    })
    // let primari = dungeons.find(e=>e.name==='Primari')
    // const newPlane = primari.levels.find(e=>e.id === -1).front
    // delete newPlane.id
    // console.log('new plane:', newPlane)
    // this.setState({
    //   loadedPlane : newPlane
    // })
    // setTimeout(()=>{
    //   this.writePlane()
    // })

    const meta = getMeta()
    this.setState({
        dungeons,
        loadingData: false
    })
    if(meta?.preferences?.editor?.loadedDungeon){
      let dungeon = meta.preferences.editor.loadedDungeon;
      this.setLoadedDungeonDropdownValue(dungeon.name)
      this.setState({
        loadedDungeon: dungeons.find(d=>d.id === dungeon.id)
      })
    }
  }
  setLoadedDungeonDropdownValue = (name) => {
    let b = this.state.dungeonSelectVal;
    if(b && b.current && b.current.value !== name){ 
      b.current.value = name;
      this.setState({
        dungeonSelectVal : b
      })
    }
  }
  loadAllPlanes = async () => {
    const val = await loadAllPlanesRequest()
    let planes = [];
    val.data.forEach((e)=>{
      if(!e.content) return
      let plane = JSON.parse(e.content)
      plane.id = e._id;
      planes.push(plane)
    })
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
    let newPlane = {
        name: `plane${rand}`,
        miniboards: [[],[],[],[],[],[],[],[],[]],
        spawnPoints: null,
        valid: false
    }
    this.setState({
      // miniboards: [],
      loadedPlane: newPlane,
    })
    this.renamePlane();
  }
  deletePlane = async () => {
    if(this.state.loadedPlane){
      const cachedPlane = clone(this.state.loadedPlane)
      await deletePlaneRequest(this.state.loadedPlane.id);
      this.clearLoadedPlane();
      await this.loadAllPlanes(); 
      this.toast('Plane Deleted')
      console.log('NEED TO HANDLE DUNGEONS WITH THIS PLANE!!!!!!!');

      let dungeonsToUpdate = this.dungeonsContainingPlane(cachedPlane)
      debugger
    }
  }
  clearLoadedPlane = () => {
    let miniboards = []
    for(let i = 0; i < 9; i++){
      miniboards.push([])
    }
    let planes = Array.from(this.state.planes)
    let loaded = planes.find(e=> e.id === this.state.loadedPlane.id)
    loaded.miniboards = miniboards
    this.setState({
      loadedPlane: loaded,
      planes,
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
  viewSelectorChange = (val) => {
    switch(val.target.id){
      case 'board-view':
        this.setViewState('board')
      break;
      case 'plane-view':
        this.setViewState('plane')
      break;
      case 'dungeon-view':
        this.setViewState('dungeon')
      break;
      default:
        break;
    }
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
    let minis = this.state.loadedPlane.miniboards
    minis[index] = [];
    if(this.state.draggedBoardOrigin !== null){
      minis[this.state.draggedBoardOrigin] = []
    }
    // const loadedPlane = this.state.loadedPlane;
    // loadedPlane.miniboards = minis
    // this.setState({
    //   loadedPlane
    // })
    
    // setTimeout(()=>{
      const loadedPlane = this.state.loadedPlane;
      let sections = loadedPlane.miniboards
      if(this.state.draggedBoard){
        sections[index] = this.state.draggedBoard
      }
      loadedPlane.miniboards = sections;
      this.setState({
        draggedBoard: null,
        hoveredSection: null,
        loadedPlane
      })
    // })
  }

  // DUNGEON drag and drop
  onDragStartDungeon = (plane) => {
    this.setState({
      draggedPlane: plane
    })
  }
  onDragOverDungeon = (event, levelIndex, frontOrBack) => {
    const val = `${levelIndex}_${frontOrBack}`;
    if(this.state.hoveredDungeonSection !== val){
      this.setState({
        hoveredDungeonSection: val
      })
    }
      event.preventDefault();
  }

  onDropDungeon = (levelIndex, frontOrBack) => {
    const dungeon = this.state.loadedDungeon;
    dungeon.levels[levelIndex][frontOrBack] = this.state.draggedPlane;
    setTimeout(()=>{
      this.setState({
        loadedDungeon: this.props.mapMaker.formatDungeon(dungeon),
        draggedPlane: null,
        hoveredDungeonSection: null
      })
    })
  }

  saveDungeonLevel = () => {
    this.writeDungeon()
  }
  clearDungeonLevel = (levelId) => {
    let dungeon = this.state.loadedDungeon;
    let level = dungeon.levels.find(l=>l.id === levelId)
    if(level.front === null && level.back === null){
      // clear upper level
      if(levelId > 0){
        if(!!dungeon.levels.find(l=>l.id === levelId+1)){
          alert('CANT DELETE THIS LEVEL BECAUSE THERE IS ONE ABOVE IT')
          return
        } else {
          dungeon.levels = dungeon.levels.filter(e=>e.id!==levelId)
        }

      }
      //clear lower level
      if(levelId < 0){
        if(!!dungeon.levels.find(l=>l.id === levelId-1)){
          alert('CANT DELETE THIS LEVEL BECAUSE THERE IS ONE BELOW IT')
          return
        } else {
          dungeon.levels = dungeon.levels.filter(e=>e.id!==levelId)
        }
      }
      this.setState({
        loadedDungeon : this.props.mapMaker.formatDungeon(dungeon)
      })
    } else {
      level.front = null;
      level.back = null;
      this.setState({
        loadedDungeon : this.props.mapMaker.formatDungeon(dungeon)
      })
    }
  }
  addDungeonLevelUp = () => {
    let dungeon = this.state.loadedDungeon;
    // const levels = dungeon.levels
    const upperLevels = dungeon.levels.filter(l=>l.id > 0).sort((a,b) => a.id - b.id)
    // lowerLevels = dungeon.levels.filter(l=>l.id < 0).sort((a,b) => a.id - b.id)
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
      lastId = lastLevel.id;
      newLevel = {
        id: lastId+1,
        front: null,
        back: null
      }
    }
    dungeon.levels.push(newLevel)
    this.setState({
      loadedDungeon: this.props.mapMaker.formatDungeon(dungeon)
    })
  }
  addDungeonLevelDown = () => {
    let dungeon = this.state.loadedDungeon;
    // const levels = dungeon.levels
    // const upperLevels = dungeon.levels.filter(l=>l.id > 0).sort((a,b) => a.id - b.id),
    let lowerLevels = dungeon.levels.filter(l=>l.id < 0).sort((a,b) => a.id - b.id)
    let newLevel;
    if(lowerLevels.length === 0){
      newLevel = {
        id: -1,
        front: null,
        back: null
      }
      
    }
    else{
      let lastLevel = lowerLevels[0],
      lastId = lastLevel.id
      newLevel = {
        id: lastId-1,
        front: null,
        back: null
      }
    }
    dungeon.levels.push(newLevel);
    this.setState({
      loadedDungeon: this.props.mapMaker.formatDungeon(dungeon)
    })
  }
  toggleDungeonLevelOverlay = () => {
    let e = this.state.dungeonOverlayOn,
    overlayData = null;
    if(!e === true){
      overlayData= this.props.mapMaker.markPassages(this.state.loadedDungeon);
    }
    this.setState({
      dungeonOverlayOn: !e,
      overlayData
    })
  }
  clearFrontPlanePreview = (levelIndex) => {
    let dungeon = this.state.loadedDungeon;
    dungeon.levels[levelIndex].front = null;
    this.setState({
      loadedDungeon: this.props.mapMaker.formatDungeon(dungeon)
    })
  }
  clearBackPlanePreview = (levelIndex) => {
    let dungeon = this.state.loadedDungeon;
    dungeon.levels[levelIndex].back = null;

    this.setState({
      loadedDungeon: this.props.mapMaker.formatDungeon(dungeon)
    })
  }

  modalSaveChanges = () => {
    let type = this.state.modalType.split(' ')[1]
    switch(type){
      case 'dungeon':
        const dungeon = this.state.loadedDungeon;
        dungeon.name = this.state.dungeonNameInput.current.value
        this.setState({
          loadedDungeon: this.props.mapMaker.formatDungeon(dungeon),
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
        let board = this.state.loadedBoard;
        if(!board){
          console.log('no loaded board, investigate');
          debugger
        }
        const needsFolderUpdate = !this.isInSameFolder(this.state.loadedBoard?.name, this.state.boardNameInput.current.value);
        board.name = this.state.boardNameInput.current.value;
        this.setState({
          loadedBoard: board,
          showModal: false
        })
        setTimeout(()=>{
          this.writeBoard()
          if(needsFolderUpdate) this.updateLoadedBoardInPanel()
        })
      break;
      default:

      break;
    }
  }

  dungeonSelectOnChange = (e) => {
    let dungeon;
    const meta = JSON.parse(sessionStorage.getItem('metadata'))
    const userId = sessionStorage.getItem('userId')
    if(e.target && e.target.value && e.target.value !== 'Dungeon Selector'){
      dungeon = this.state.dungeons.find(x=>x.name === e.target.value)
      this.setState({
        dungeonOverlayOn: false,
        overlayData: null
      })
      this.loadDungeon(dungeon.id)
    } else {
      this.setState({
        loadedDungeon: null
      })
    }
    
    // NEED TO ABSTRACT THIS INTO A USER SERVICE
    if(meta.preferences && meta.preferences.editor){
      meta.preferences.editor['loadedDungeon'] = dungeon;
    } else {
      meta.preferences = {
        editor: { loadedDungeon: this.props.mapMaker.formatDungeon(dungeon)}
      }
    }
    updateUserRequest(userId, meta)
    storeMeta(meta);
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

  closeModal = () => {
    this.setState({
      showModal: false
    })
  }

  toggleShowPlaneNames = () => {
    let currentVal = this.state.showPlanesNames
    this.setState({
      showPlanesNames: !currentVal
    })
  }

  render (){
    return (
      <div className="mapmaker-container">
        {this.state.toastMessage && <div className="toast-pane">
          <div className="relative-container">
            <div className="toast-message">
              {this.state.toastMessage}
            </div>
          </div>
        </div>}

        <CModal alignment="center" visible={this.state.showModal} onClose={
          () => this.closeModal()
          }>
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
            LOADED BOARD.NAME: {this.state.loadedBoard?.name}
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClose={() => this.closeModal()}>
              Close
            </CButton>
            <CButton color="primary" onClick={() => this.modalSaveChanges()}>Save changes</CButton>
          </CModalFooter>
        </CModal>
        <div className="column-wrapper">
          <div className="inputs-container">
            <div className="board-options-buttons-container" 
              style={{
                  width: this.state.tileSize*3+'px',
                  height: '40px'
              }}
              >
              <CDropdown>
              <CDropdownToggle color="secondary">Actions</CDropdownToggle>
              <CDropdownMenu style={{width: '100%'}}>
                  <CDropdownItem onClick={() => this.addNewBoard()}>New</CDropdownItem>
                  <CDropdownItem onClick={() => this.cloneBoard()}>Clone</CDropdownItem>
                  <CDropdownItem onClick={() => this.writeBoard()}>Save</CDropdownItem>
                  <CDropdownItem disabled={!this.state.loadedBoard} onClick={() => this.clearLoadedBoard()}>Clear</CDropdownItem>
                  <CDropdownItem disabled={!this.state.loadedBoard} onClick={() => this.deleteBoard(this.state.loadedBoard.id)}>Delete</CDropdownItem>
                  <CDropdownItem disabled={!this.state.loadedBoard} onClick={() => this.renameBoard()}>Rename Current Map</CDropdownItem>
                  <CDropdownItem onClick={() => this.adjacencyFilterClicked()}>Filter: Adjacency</CDropdownItem>
                  <CDropdownItem onClick={() => this.nameFilterClicked()}>Filter: Name</CDropdownItem>
              </CDropdownMenu>
              </CDropdown>
            </div>

            <div className="left-text-readout title">
              {this.state.selectedThingTitle}
            </div>

            <CButtonGroup className='view-state-radio-group' role="group" aria-label="Basic checkbox toggle button group" >
              <CFormCheck
                type="radio"
                button={{ color: 'secondary', variant: 'outline' }}
                name="btnradio"
                id="board-view"
                autoComplete="off"
                label="Board View"
                checked={this.state.selectedView === 'board'}
                onChange={this.viewSelectorChange}
              />
              <CFormCheck
                type="radio"
                button={{ color: 'secondary', variant: 'outline' }}
                name="btnradio"
                id="plane-view"
                autoComplete="off"
                label="Plane View"
                checked={this.state.selectedView === 'plane'}
                onChange={this.viewSelectorChange}
              />
              <CFormCheck
                type="radio"
                button={{ color: 'secondary', variant: 'outline' }}
                name="btnradio"
                id="dungeon-view"
                autoComplete="off"
                label="Dungeon View"
                checked={this.state.selectedView === 'dungeon'}
                onChange={this.viewSelectorChange}
              />
            </CButtonGroup>

            <div className="right-text-readout title">
              
            </div>

            <div className="right-menus">
            </div>
          </div>
          <div className="row-wrapper">

            <BoardsPanel
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
              monsterManager={this.props.monsterManager}
              gates={GATES}
              onDragStart={this.onDragStart}
            >
            </BoardsPanel>

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
              monsterManager={this.props.monsterManager}
              gates={GATES}
            ></BoardView>}

            {this.state.selectedView === 'board' && <BoardsPalette
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
              monsterManager={this.props.monsterManager}
              gates={GATES}
            >
            </BoardsPalette>}


            {this.state.selectedView === 'plane' && <PlaneView
              tileSize={this.state.tileSize}
              boardSize={this.state.boardSize}
              boardsFolders={this.state.boardsFolders}
              boardsFoldersExpanded={this.state.boardsFoldersExpanded}
              boards={this.state.boards}
              tiles={this.state.tiles}
              compatibilityMatrix={this.state.compatibilityMatrix}
              hoveredPaletteTileIdx={this.state.hoveredPaletteTileIdx}
              hoveredTileIdx={this.state.hoveredTileIdx}
              hoveredTileId={this.state.hoveredTileIdx}
              optionClickedIdx={this.state.optionClickedIdx}
              selectedView={this.state.selectedView}
              showCoordinates={this.props.showCoordinates}
              mapMaker={this.props.mapMaker}

              loadedPlane={this.state.loadedPlane}
              planes={this.state.planes}
              miniboards={this.state.loadedPlane?.miniboards || [[],[],[],[],[],[],[],[],[]]}
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
              showPlanesNames={this.state.showPlanesNames}
//            board specific ^              
            ></PlaneView>}

            {this.state.selectedView === 'dungeon' && 
            <DungeonView
              tileSize={this.state.tileSize}
              boardSize={this.state.boardSize}
              boardsFolders={this.state.boardsFolders}
              boardsFoldersExpanded={this.state.boardsFoldersExpanded}
              boards={this.state.boards}
              dungeons={this.state.dungeons}
              tiles={this.state.tiles}
              compatibilityMatrix={this.state.compatibilityMatrix}
              hoveredPaletteTileIdx={this.state.hoveredPaletteTileIdx}
              hoveredTileIdx={this.state.hoveredTileIdx}
              hoveredTileId={this.state.hoveredTileIdx}
              optionClickedIdx={this.state.optionClickedIdx}
              selectedView={this.state.selectedView}
              showCoordinates={this.props.showCoordinates}
              mapMaker={this.props.mapMaker}

              loadedPlane={this.state.loadedPlane}
              planes={this.state.planes}
              miniboards={this.state.loadedPlane?.miniboards || [[],[],[],[],[],[],[],[],[]]}
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
              clearDungeonLevel={this.clearDungeonLevel}
              addDungeonLevelUp={this.addDungeonLevelUp}
              addDungeonLevelDown={this.addDungeonLevelDown}
              clearFrontPlanePreview={this.clearFrontPlanePreview}
              clearBackPlanePreview={this.clearBackPlanePreview}
              activeDungeonLevel={this.state.activeDungeonLevel}
              dungeonOverlayOn={this.state.dungeonOverlayOn}
              overlayData={this.state.overlayData}
              loadingData={this.state.loadingData}
              dungeonSelectOnChange={this.dungeonSelectOnChange}
              dungeonSelectVal={this.state.dungeonSelectVal}

              downloadDungeon={this.downloadDungeon}
              renameDungeon={this.renameDungeon}
              deleteDungeon={this.deleteDungeon}
              addNewDungeon={this.addNewDungeon}

              imagesMatrix={this.state.imagesMatrix}
              zoomIntoBoard={this.zoomIntoBoard}
              ></DungeonView>}

          {(this.state.selectedView === 'plane' || 
           this.state.selectedView === 'dungeon') 
          && <PlanesPanel
              tileSize={this.state.tileSize}
              boardSize={this.state.boardSize}
              boardsFolders={this.state.boardsFolders}
              boardsFoldersExpanded={this.state.boardsFoldersExpanded}
              boards={this.state.boards}
              tiles={this.state.tiles}
              compatibilityMatrix={this.state.compatibilityMatrix}
              hoveredPaletteTileIdx={this.state.hoveredPaletteTileIdx}
              hoveredTileIdx={this.state.hoveredTileIdx}
              hoveredTileId={this.state.hoveredTileIdx}
              optionClickedIdx={this.state.optionClickedIdx}
              selectedView={this.state.selectedView}
              showCoordinates={this.props.showCoordinates}
              mapMaker={this.props.mapMaker}

              loadedPlane={this.state.loadedPlane}
              planes={this.state.planes}
              miniboards={this.state.loadedPlane?.miniboards || [[],[],[],[],[],[],[],[],[]]}
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
              imagesMatrix={this.state.imagesMatrix}
              zoomIntoBoard={this.zoomIntoBoard}
              onDragOverDungeon={this.onDragOverDungeon}
              onDropDungeon={this.onDropDungeon}
              onDragStartDungeon={this.onDragStartDungeon}

              toggleShowPlaneNames={this.toggleShowPlaneNames}
            ></PlanesPanel>}

          </div>
        </div>
      </div>
    )

  }


}

export default MapMakerPage;