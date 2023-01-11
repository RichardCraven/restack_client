import React from 'react'
import '@coreui/coreui/dist/css/coreui.min.css'
import '../../styles/dungeon-board.scss'
import '../../styles/map-maker.scss'
import Tile from '../../components/tile'
import { CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CCollapse} from '@coreui/react';
import  CIcon  from '@coreui/icons-react'
import { cilCaretRight, cilSave, cilQrCode, cilLevelDown, cilLevelUp, cilLibraryAdd, cilX, cilOptions } from '@coreui/icons';
import '../../styles/dungeon-board.scss'
import '../../styles/map-maker.scss'
import Canvas from '../../components/Canvas/canvas'

class DungeonView extends React.Component {
    constructor(props){
      super(props)
      this.state = {
        hoveredPlane : null
      }
    }


    timer;
    onClickHandler = event => {
        clearTimeout(this.timer);

        if (event.detail === 1) {
            this.timer = setTimeout(this.props.onClick, 200)
        } else if (event.detail === 2) {
            this.props.onDoubleClick()
        }
    }
    getPassageColors = (contains) => {
        let val;
        const matrix = {
            'way_up': '#eb8560',
            'way_down': '#7bb1db',
            'door': '#c97cdc'
        }
        if(matrix[contains]) val=matrix[contains]
        return val
    }
    draw = (ctx, frameCount, data) => {
        // console.log('framecount:', frameCount);
       // ctx.arc(50, 100, 20*Math.sin(frameCount*0.05)**2, 0, 2*Math.PI)
    //    ^^^ animation



    let levelData = this.props.overlayData?.find(x=>x.id === data.levelId)
    let minVal = 1;
                if(levelData){

                    // orientation = data.orientation


                    let planeSize = this.props.tileSize*2;
                    let unit = planeSize/15;
                    let passages;
                    if(data.orientation === 'front'){
                        passages = levelData.frontPassages[data.index]
                    } else if(data.orientation === 'back'){
                        passages = levelData.backPassages[data.index]
                    }

                    if(data.orientation === 'doublewide'){
                        let miniboardSize = this.props.tileSize*2;

                        let planeWidth = this.props.tileSize*12;
                        let planeHeight = this.props.tileSize*6;
                        let unit = planeHeight/(this.props.tileSize*6);

                        let leftPlaneSize = this.props.tileSize*6;
                        let rightPlaneSize = this.props.tileSize*6;

                        ctx.fillStyle = 'red'
                        // let x = unit*p.coordinates[0] + unit/2
                        // let y = unit*p.coordinates[1] + unit/2
                        // let x = 15, y = 40;


                        let x1 = unit*leftPlaneSize/2 + unit/2
                        let y1 = unit*leftPlaneSize/2 + unit/2
                        let x2 = (unit*leftPlaneSize/2)*3 + unit/2
                        let y2 = (unit*leftPlaneSize/2) + unit/2

                        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
                        for(let miniboardIndex = 0; miniboardIndex < 9; miniboardIndex++){
                            // let col = (i < 3) ? 1 : (i > 5 ? 3 : 2)
                            // let col = i-1
                            let cols = [1,2,3,1,2,3,1,2,3]
                            let rows = [1,1,1,2,2,2,3,3,3]
                            // let rows = {
                            //     0: 1,
                            //     1: 1,
                            //     2: 1,
                            //     3: 2,
                            //     4: 2,
                            //     5: 2,
                            //     6: 3,
                            //     7: 3,
                            //     8: 3
                            // }
                            // let row = (i < 3) ? 1 : (i > 5 ? 3 : 2)
                            let row = rows[miniboardIndex] 
                            let col = cols[miniboardIndex] 
                            let centerOfMiniboard = miniboardSize/2

                            let originPointX = (miniboardSize * col) - miniboardSize
                            let originPointX_back = ((3*miniboardSize) + miniboardSize * col) - miniboardSize
                            let originPointY = (miniboardSize * row) - miniboardSize

                            let microUnit = miniboardSize/15;
                            if(levelData.frontPassages.length > 0){
                                levelData.frontPassages[miniboardIndex].forEach(p=>{
                                    let x = microUnit*p.coordinates[0] + unit/2
                                    let y = microUnit*p.coordinates[1] + unit/2
                                    ctx.beginPath()
                                    let minVal = 3.5;
                                    ctx.fillStyle = this.getPassageColors(p.contains)
                                    ctx.arc((originPointX + x), (originPointY + y), 3.5*Math.sin(frameCount*0.03)**2 + minVal, 0, 2*Math.PI)
                                    ctx.fill() 
                                })
                            }
                            if(levelData.backPassages.length > 0){
                                levelData.backPassages[miniboardIndex].forEach(p=>{
                                    let x = microUnit*p.coordinates[0] + unit/2
                                    let y = microUnit*p.coordinates[1] + unit/2
                                    ctx.beginPath()
                                    let minVal = 3.5;
                                    ctx.fillStyle = this.getPassageColors(p.contains)
                                    ctx.arc((originPointX_back + x), (originPointY + y), 3.5*Math.sin(frameCount*0.03)**2 + minVal, 0, 2*Math.PI)
                                    ctx.fill() 
                                })
                            }
                            if(levelData.connected.length > 0){
                                // levelData.connected[0]
                                let p = levelData.connected.find(e=>e.miniboardIndex === miniboardIndex)
                                if(p){
                                    let x = microUnit*p.coordinates[0] + unit/2
                                    let y = microUnit*p.coordinates[1] + unit/2,
                                    // miniboardIndex = levelData.connected[0].miniboardIndex
                                    newOriginX = (originPointX + x),
                                    newOriginY = (originPointY + y),
                                    newEndX_back = (originPointX_back + x)
                                    ctx.lineWidth = 3;
                                    ctx.strokeStyle = 'red'
                                    ctx.beginPath();
                                    ctx.moveTo(newOriginX,newOriginY);
                                    ctx.lineTo(newEndX_back,newOriginY);
                                    ctx.stroke();
                                }
                            }
                            
                            // if(levelData.frontPassages)



                            // let placementX = (miniboardSize * col) - (1/2 * miniboardSize)
                            // let placementY = (miniboardSize * row) - (1/2 * miniboardSize)

                            // let placementX = (miniboardSize * col) - miniboardSize
                            // let placementX_back = ((3*miniboardSize) + miniboardSize * col) - miniboardSize
                            // let placementY = (miniboardSize * row) - miniboardSize
                            // ^ dot at top left of each board

                            
                            // let placementX = (centerOfMiniboard * col*2) - centerOfMiniboard
                            // let placementY = (centerOfMiniboard * row*2) - centerOfMiniboard
                            // ^ dot at center of each miniboard

                            // console.log('x', placementX, 'y', placementY);
                            

                            // ctx.beginPath()
                            // ctx.arc(placementX, placementY, 5.5*Math.sin(frameCount*0.03)**2 + minVal, 0, 2*Math.PI)
                            // ctx.fill() 
                        }

                        // console.log('radius ', 5.5*Math.sin(frameCount*0.03)**2);
                        // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
                        // let unit2 = miniboardSize/15;
                        // let col = 3, row = 2
                        // let originPointX = (miniboardSize * col) - miniboardSize
                        // let originPointY = (miniboardSize * row) - miniboardSize
                        // let placementX = originPointX + unit2*8
                        // let placementY = originPointY + unit2*4
                        // ctx.beginPath()
                        // ctx.arc(placementX, placementY, 5.5*Math.sin(frameCount*0.03)**2 + minVal, 0, 2*Math.PI)
                        // ctx.fill() 


                        // ctx.beginPath()
                        // ctx.arc(x1, y1, 5.5*Math.sin(frameCount*0.03)**2 + minVal, 0, 2*Math.PI)
                        // ctx.fill() 

                        // ctx.beginPath()
                        // ctx.arc(x2, y2, 5.5*Math.sin(frameCount*0.03)**2 + minVal, 0, 2*Math.PI)
                        // ctx.fill() 
                        
                        // return
                    }
                    if(!passages) return


                    return 
                    // ^ remove later

                    let fillStyle = 'yellow'

                    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
                    passages.forEach((p, index)=>{
                        ctx.fillStyle = fillStyle
                        let x = unit*p.coordinates[0] + unit/2
                        let y = unit*p.coordinates[1] + unit/2
                        ctx.beginPath()
                        let minVal = 3.5;
                        ctx.fillStyle = this.getPassageColors(p.contains)
                        ctx.arc(x, y, 3.5*Math.sin(frameCount*0.03 + index)**2 + minVal, 0, 2*Math.PI)
                        ctx.fill()  
                        // x ** 2 is the x squared
                    }) 
                }
    }

    render (){
        return (
            <div className="board-view-container">
                <div className="left-palette  palette boards-palette" 
                    style={{
                        width: this.props.tileSize*3+'px', 
                        height: this.props.boardSize+ 'px'
                    }}>
                    <div className="boards-title" onClick={() => { this.props.setViewState('board')}}>
                        <div className="color-line-blocker"></div>
                        Boards
                    </div>
                    <div className="board-options-buttons-container disabled" 
                    style={{
                        width: this.props.tileSize*3+'px',
                        height: '40px'
                    }}
                    >
                        <div className="color-line-blocker"></div>
                        <CDropdown>
                        <CDropdownToggle disabled color="secondary">Actions</CDropdownToggle>
                        <CDropdownMenu>
                            <CDropdownItem onClick={() => this.props.clearLoadedBoard()}>Clear</CDropdownItem>
                            <CDropdownItem onClick={() => this.props.writeBoard()}>Save</CDropdownItem>
                            <CDropdownItem onClick={() => this.props.deleteBoard()}>Delete</CDropdownItem>
                            <CDropdownItem disabled={!this.props.loadedBoard} onClick={() => this.renameBoard()}>Rename Current Map</CDropdownItem>
                            <CDropdownItem onClick={() => this.props.adjacencyFilterClicked()}>Filter: Adjacency</CDropdownItem>
                            <CDropdownItem onClick={() => this.props.nameFilterClicked()}>Filter: Name</CDropdownItem>
                        </CDropdownMenu>
                        </CDropdown>
                    </div>
                    <div className="board-previews-container previews-container"
                        style={{
                            height: (this.props.boardSize - 78)+ 'px'
                          }}
                    >
                        {this.props.boardsFolders.length > 0 && this.props.boardsFolders.map((folder, idx) => {
                        return  <div key={idx}>
                                    <div className="boards-folder-headline"  onClick={() => this.props.expandCollapseBoardFolders(folder.title)}> 
                                        <div className="folder-color-line" style={{backgroundColor: idx % 2 ? 'magenta' : 'aqua'}}></div>
                                        <div className="icon-container">
                                            <CIcon icon={cilCaretRight} className={`expand-icon ${this.props.boardsFoldersExpanded[folder.title] ? 'expanded' : ''}`} size="sm"/>
                                        </div>
                                        <div className="folder-headline-text">{folder.title}</div> 
                                    </div>
{/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~// TOP LEVEL FOLDER // */}
                                    <CCollapse visible={this.props.boardsFoldersExpanded[folder.title]}>
{/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~// SUBFOLDER HEADER //  */}
                                        {folder.subfolders?.length > 0 && folder.subfolders.map((subfolder, i)=>{
                                        return (
                                            <div key={i} className="subfolder-wrapper">
                                                <div className="boards-folder-headline"  onClick={() => this.props.expandCollapseBoardFolders(`${folder.title}_${subfolder.title}`)}> 
                                                    <div className="folder-color-line" style={{backgroundColor: i % 2 ? '#199595' : '#13c2c2'}}></div>
                                                    <div className="icon-container">
                                                        <CIcon icon={cilCaretRight} className={`expand-icon ${this.props.boardsFoldersExpanded[`${folder.title}_${subfolder.title}`] ? 'expanded' : ''}`} size="sm"/>
                                                    </div>
                                                    <div className="folder-headline-text">{subfolder.title}</div> 
                                                </div>
{/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~// SUBFOLDER CONTENTS //  */}
                                                <CCollapse visible={this.props.boardsFoldersExpanded[`${folder.title}_${subfolder.title}`]}>
                                                    <div className="subfolder-contents-wrapper">
                                                        {subfolder.contents.map((board, idx) => {
                                                        return (<div key={idx} className="board-preview-wrapper">
                                                                    <div className="folder-color-line" style={{backgroundColor: i % 2 ? '#199595' : '#13c2c2'}}></div>
                                                                    <div 
                                                                    className="map-preview draggable" 
                                                                    onDragStart = {(event) => this.props.onDragStart(event, board)}
                                                                    draggable
                                                                    style={{
                                                                        height: this.props.tileSize*3,
                                                                        boxSizing: 'border-box'
                                                                    }}
                                                                    onClick={() => {
                                                                        // console.log('hmm ', this.props.selectedView);
                                                                        // if(this.props.selectedView === 'board'){
                                                                        return this.props.loadBoard(board)
                                                                        // }
                                                                    }}>
                                                                    {board.tiles.map((tile, i) => {
                                                                    return    <Tile 
                                                                                key={i}
                                                                                id={tile.id}
                                                                                tileSize={(this.props.tileSize*3)/15}
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
                                                    </div>
                                                </CCollapse>
                                            </div>
                                        )})}
{/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~// FOLDER CONTENTS //  */}                                        
                                        {folder.contents.map((board, i) => {
                                        return (<div key={i} className="board-preview-wrapper">
                                                    <div className="folder-color-line" style={{backgroundColor: idx % 2 ? 'magenta' : 'aqua'}}></div>
                                                    <div 
                                                    className="map-preview draggable" 
                                                    onDragStart = {(event) => this.props.onDragStart(event, board)}
                                                    draggable
                                                    style={{
                                                        height: this.props.tileSize*3,
                                                        boxSizing: 'border-box'
                                                    }}
                                                    onClick={() => {
                                                        // if(this.props.selectedView === 'board'){
                                                            return this.props.loadBoard(board)
                                                        // }
                                                    }}>
                                                    {board.tiles.map((tile, i) => {
                                                    return    <Tile 
                                                                key={i}
                                                                id={tile.id}
                                                                tileSize={(this.props.tileSize*3)/15}
                                                                image={tile.image ? tile.image : null}
                                                                color={tile.color ? tile.color : 'lightgrey'}
                                                                index={tile.id}
                                                                showCoordinates={false}
                                                                type={tile.type}
                                                                hovered={
                                                                false
                                                                }>
                                                                </Tile>
                                                            
                                                    })}
                                                    </div>
                                                    <div className="map-title">{board.name}</div>
                                                </div>)
                                        })}
                                    </CCollapse>
                                </div>
                        })}
                        {this.props.boards && this.props.compatibilityMatrix.show === false && this.props.boards.map((board, i) => {
                        return (<div key={i} className="board-preview-wrapper">
                                    <div 
                                    onDragStart = {(event) => this.props.onDragStart(event, board)}
                                    draggable
                                    className="map-preview draggable" 
                                    style={{
                                        height: this.props.tileSize*3,
                                        boxSizing: 'border-box'
                                    }}
                                    onClick={() => {this.props.loadBoard(board)}}>
                                    {board.tiles.map((tile, i) => {
                                    return    <Tile 
                                                key={i}
                                                id={tile.id}
                                                tileSize={(this.props.tileSize*3)/15}
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
                        {this.props.compatibilityMatrix && this.props.compatibilityMatrix.show === true && 
                        <div className="compatibility-matrix-container">
                        {this.props.compatibilityMatrix.left.length > 0 && <div className="left">
                            <span onClick={() => {return this.props.collapseFilterHeader('left')}} className="adjacency-filter-header">LEFT</span> 
                            {this.props.compatibilityMatrix.showLeft && this.props.compatibilityMatrix.left.map((board,i)=>{
                            return (
                                <div key={i} className="board-preview-wrapper">
                                    <div 
                                    className="map-preview draggable" 
                                    onClick={() => {return this.props.loadBoard(board)}}
                                    onDragStart = {(event) => this.props.onDragStart(event, board)}
                                    draggable
                                    style={{
                                        height: this.props.tileSize*3,
                                        boxSizing: 'border-box'
                                    }}>
                                        {board.tiles.map((tile, i) => {
                                    return  <Tile 
                                            key={i}
                                            id={tile.id}
                                            tileSize={(this.props.tileSize*3)/15}
                                            image={tile.image ? tile.image : null}
                                            color={tile.color ? tile.color : 'lightgrey'}
                                            index={tile.id}
                                            showCoordinates={false}
                                            type={tile.type}
                                            hovered={false}>
                                            </Tile>
                                        })}
                                    </div>
                                    <div className="map-title">{board.name}</div>
                                </div>)
                            })}
                            </div>}
                        {this.props.compatibilityMatrix.right.length > 0 && 
                        <div className="right">
                            <span onClick={() => {return this.props.collapseFilterHeader('right')}} className="adjacency-filter-header">RIGHT</span> 
                            {this.props.compatibilityMatrix.showRight && this.props.compatibilityMatrix.right.map((board,i)=>{
                            return (<div key={i} className="board-preview-wrapper">
                                <div 
                                className="map-preview draggable" 
                                style={{
                                    height: this.props.tileSize*3,
                                    boxSizing: 'border-box'
                                }}
                                onClick={() => {return this.props.loadBoard(board)}}
                                onDragStart = {(event) => this.props.onDragStart(event, board)}
                                draggable
                                >
                                {board.tiles.map((tile, i) => {
                                    return    <Tile 
                                            key={i}
                                            id={tile.id}
                                            tileSize={(this.props.tileSize*3)/15}
                                            image={tile.image ? tile.image : null}
                                            color={tile.color ? tile.color : 'lightgrey'}
                                            index={tile.id}
                                            showCoordinates={false}
                                            type={tile.type}
                                            hovered={false}>
                                            </Tile>
                                })}
                                </div>
                                <div className="map-title">{board.name}</div>
                                </div>)
                            })}
                        </div>}
                        {this.props.compatibilityMatrix.top.length > 0 && <div className="top">
                        <span onClick={() => {return this.props.collapseFilterHeader('top')}} className="adjacency-filter-header">TOP</span> 
                            {this.props.compatibilityMatrix.showTop && this.props.compatibilityMatrix.top.map((board,i)=>{
                            return (<div key={i} className="board-preview-wrapper">
                                <div 
                                className="map-preview draggable" 
                                onClick={() => {return this.props.loadBoard(board)}}
                                onDragStart = {(event) => this.props.onDragStart(event, board)}
                                draggable
                                style={{
                                    height: this.props.tileSize*3,
                                    boxSizing: 'border-box'
                                }}>
                                {board.tiles.map((tile, i) => {
                                return  <Tile 
                                        key={i}
                                        id={tile.id}
                                        tileSize={(this.props.tileSize*3)/15}
                                        image={tile.image ? tile.image : null}
                                        color={tile.color ? tile.color : 'lightgrey'}
                                        index={tile.id}
                                        showCoordinates={false}
                                        type={tile.type}
                                        hovered={false}>
                                        </Tile>
                                })}
                                </div>
                                <div className="map-title">{board.name}</div>
                                </div>)
                            })}
                        </div>}
                        {this.props.compatibilityMatrix.bot.length > 0 && <div className="bot">
                        <span onClick={() => {return this.props.collapseFilterHeader('bot')}} className="adjacency-filter-header">BOT</span> 
                            {this.props.compatibilityMatrix.showBot && this.props.compatibilityMatrix.bot.map((board,i)=>{
                            return (<div key={i} className="board-preview-wrapper">
                                <div 
                                className="map-preview draggable" 
                                onClick={() => {return this.props.loadBoard(board)}}
                                onDragStart = {(event) => this.props.onDragStart(event, board)}
                                draggable
                                style={{
                                    height: this.props.tileSize*3,
                                    boxSizing: 'border-box'
                                }} >
                                {board.tiles.map((tile, i) => {
                                    return    <Tile 
                                            key={i}
                                            id={tile.id}
                                            tileSize={(this.props.tileSize*3)/15}
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
                </div>
                <div className="center-board-container">
                    <div 
                    onMouseLeave={() => {return this.props.setHover(null)}}
                    className="board map-board" 
                    style={{
                        width: this.props.boardSize+'px', height: this.props.boardSize+ 'px',
                        backgroundColor: 'white'
                    }}
                    >
                        <div className="dungeon-planes-container">
                            {this.props.loadedDungeon && <div className="loaded-dungeon-wrapper"
                            style={{
                                justifyContent: this.props.loadedDungeon.levels.length > 2 ? 'flex-start' : 'center'
                            }}
                            >
                                { this.props.loadedDungeon.levels.sort((a,b) => b.id - a.id).map((level,levelIndex)=>{
                                     return <div key={levelIndex} className="level-wrapper">
                                        <div className="level-info">
                                            <div className="level-readout">{`Lvl ${level.id}`}</div>
                                            <div className="icon-container" onClick={() =>  this.props.clearDungeonLevel(level.id)}>
                                                <CIcon icon={cilX} size="lg"/>
                                            </div>
                                        </div>
                                        <div className="plane-board-displays-wrapper">
                                            <div className="horizontal-connecting-canvas-wrapper">
                                                <Canvas 
                                                // key={i}
                                                // id={`${level.id}F`} 

                                                // size={this.props.tileSize*2} 
                                                className="doublewide-canvas"
                                                width={this.props.tileSize*12}
                                                height={this.props.tileSize*6}
                                                draw={this.draw}
                                                data={{index: null, levelId: level.id, orientation: 'doublewide'}}
                                                />
                                            </div>
                                            {level.front && <div className="front-plane plane-board-display">
                                                <div 
                                                className={`plane-preview draggable`}
                                                style={{
                                                    height: this.props.tileSize*6,
                                                    width: this.props.tileSize*6
                                                }}
                                                >
                                                    <div 
                                                    className="canvas-overlay-container mini-boards-container"
                                                    style={{
                                                        height: this.props.tileSize*6,
                                                        width: this.props.tileSize*6
                                                    }}
                                                    >
                                                        {[1,2,3,4,5,6,7,8,9].map((e,i)=>{
                                                        return <Canvas 
                                                            key={i}
                                                            // id={`${level.id}F`} 
                                                            // size={this.props.tileSize*2} 

                                                            width={this.props.tileSize*2}
                                                            height={this.props.tileSize*2}

                                                            draw={this.draw}
                                                            data={{index: i, levelId: level.id, orientation: 'front'}}
                                                            />
                                                        })}
                                                    </div>
                                                    {level.front.miniboards.map((board, i) => {
                                                    return    <div 
                                                            className="micro-board board" 
                                                            key={i}
                                                            style={{
                                                                height: (this.props.tileSize*6)/3-2+'px',
                                                                width: (this.props.tileSize*6)/3-2+'px'
                                                            }}
                                                            > 
                                                                {board.tiles && board.tiles.map((tile, i) => {
                                                                return <Tile
                                                                key={i}
                                                                id={i}
                                                                tileSize={((this.props.tileSize*6)/3-2)/15}
                                                                image={tile.image ? tile.image : null}
                                                                color={tile.color ? tile.color : 'white'}
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
                                            </div>}
                                            {level.back && <div className="back-plane plane-board-display">
                                                <div 
                                                className={`plane-preview draggable`}
                                                style={{
                                                    height: this.props.tileSize*6,
                                                    width: this.props.tileSize*6
                                                }}
                                                >
                                                    <div 
                                                    className="canvas-overlay-container mini-boards-container"
                                                    style={{
                                                        height: this.props.tileSize*6,
                                                        width: this.props.tileSize*6
                                                    }}
                                                    >
                                                        {[1,2,3,4,5,6,7,8,9].map((e,i)=>{
                                                        return <Canvas 
                                                            key={i}
                                                            // id={`${level.id}F`} 
                                                            width={this.props.tileSize*2}
                                                            height={this.props.tileSize*2}
                                                            draw={this.draw}
                                                            data={{index: i, levelId: level.id, orientation: 'back'}}
                                                            />
                                                        })}
                                                    </div>
                                                    {level.back.miniboards.map((board, i) => {
                                                    return    <div 
                                                            className="micro-board board" 
                                                            key={i}
                                                            style={{
                                                                height: (this.props.tileSize*6)/3-2+'px',
                                                                width: (this.props.tileSize*6)/3-2+'px'
                                                            }}
                                                            > 
                                                                {board.tiles && board.tiles.map((tile, i) => {
                                                                return <Tile
                                                                key={i}
                                                                id={i}
                                                                tileSize={((this.props.tileSize*6)/3-2)/15}
                                                                image={tile.image ? tile.image : null}
                                                                color={tile.color ? tile.color : 'white'}
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
                                            </div>}
                                            {!level.front && <div 
                                            className="front-plane plane-board-display"
                                            style={{
                                                height: this.props.tileSize*6,
                                                width: this.props.tileSize*6,
                                                backgroundColor: 
                                                this.props.hoveredDungeonSection === `${levelIndex}_front` ? 'lightgoldenrodyellow': 'white'
                                            }}

                                            onDragOver={(event)=>this.props.onDragOverDungeon(event, levelIndex, 'front')}
                                            onDrop={(event)=>{this.props.onDropDungeon(levelIndex, 'front')}}
                                            >
                                                Drag plane onto here (Front)
                                            </div>}
                                            {!level.back && <div className="back-plane plane-board-display"
                                            style={{
                                                height: this.props.tileSize*6,
                                                width: this.props.tileSize*6,
                                                backgroundColor: 
                                                this.props.hoveredDungeonSection === `${levelIndex}_back` ? 'lightgoldenrodyellow': 'white'
                                            }}

                                            onDragOver={(event)=>this.props.onDragOverDungeon(event, levelIndex, 'back')}
                                            onDrop={(event)=>{this.props.onDropDungeon(levelIndex, 'back')}}>Drag plane onto here (Back)</div>}

                                        </div>
                                    </div>
                                })}
                            </div>}
                            {this.props.loadedDungeon && <div className="level-buttons-container">
                                <div className="icon-container" onClick={() => this.props.addDungeonLevelUp()}>
                                    <CIcon icon={cilLibraryAdd} size="lg"/> <CIcon className="add-level-up-icon" icon={cilLevelUp} size="lg"/>
                                </div>
                                {/* this.props.saveDungeonLevel() */}
                                <div className="icon-container" onClick={() =>  this.props.saveDungeonLevel()}>
                                    <CIcon icon={cilSave} size="lg"/>
                                </div>
                                {/* <div className="double-icon-container">
                                    <div className="icon-container">
                                        <CIcon onClick={() => this.props.clearFrontPlanePreview(levelIndex)} icon={cilX} size="lg"/>
                                    </div>
                                    <div className="icon-container">
                                        <CIcon onClick={() => this.props.clearBackPlanePreview(levelIndex)} icon={cilX} size="lg"/>
                                    </div>
                                </div> */}
                                <div className="icon-container" onClick={() => this.props.toggleDungeonLevelOverlay()}>
                                    <CIcon icon={cilQrCode} size="lg"/>
                                </div>
                                <div className="icon-container" onClick={() => this.props.addDungeonLevelDown()}>
                                    <CIcon icon={cilLibraryAdd} size="lg"/> <CIcon className="add-level-down-icon" icon={cilLevelDown} size="lg"/>
                                </div>
                            </div>}

                            {/* EMPTY STATE */}
                            {!this.props.loadedDungeon && <div className="empty-dungeons-container">
                                Select a dungeon, or create a new one
                            </div>}
                        </div>
                    </div>
                </div>

                <div className="palette right-palette" 
                    style={{
                        width: this.props.tileSize*3+'px', height: this.props.boardSize+ 'px',
                        backgroundColor: 'white',
                        overflow: 'scroll'
                    }}
                    onMouseLeave={() => {
                        if(this.props.optionClickedIdx === null){
                            return this.props.setPaletteHover(null)
                        }
                    }}
                >
                    <div className="planes-title">Planes</div>
                    <div className="planes-options-buttons-container" 
                    style={{width: this.props.tileSize*3+'px'}}
                    >
                        <CDropdown>
                            <CDropdownToggle color="secondary">Actions</CDropdownToggle>
                            <CDropdownMenu>
                                <CDropdownItem onClick={() => this.props.addNewPlane()}>New</CDropdownItem>
                                <CDropdownItem onClick={() => this.props.clearLoadedPlane()}>Clear</CDropdownItem>
                                <CDropdownItem onClick={() => this.props.resetLoadedPlane()}>Reset</CDropdownItem>
                                <CDropdownItem onClick={() => this.props.writePlane()}>Save</CDropdownItem>
                                <CDropdownItem onClick={() => this.props.renamePlane()}>Rename</CDropdownItem>
                                <CDropdownItem onClick={() => this.props.deletePlane()}>Delete</CDropdownItem>
                                {/* <CDropdownItem onClick={() => this.props.filterDungeonsClicked()}>Filter</CDropdownItem> */}
                                {/* gonna need a filterPlanes feature................... */}
                            </CDropdownMenu>
                        </CDropdown>
                    </div>
                    
                    <div className="previews-container"
                        style={{
                            height: (this.props.boardSize - 78)+ 'px'
                        }}
                    >
                        {this.props.planes && this.props.planes.map((plane, planeIndex) => {
                        return (<div 
                                    className='plane-previews-container'
                                    key={planeIndex}
                                >
                                    <div 
                                    className={`plane-preview draggable ${this.state.hoveredPlane === planeIndex ? 'hovered' : ''}`}
                                    draggable
                                    
                                    onDragStart = {() => this.props.onDragStartDungeon(plane)}


                                    style={{
                                        height: this.props.tileSize*3,
                                        width: this.props.tileSize*3
                                    }}
                                    onClick={() => {
                                        this.setState({hoveredPlane : null})
                                        return this.props.loadPlane(plane)
                                    }}
                                    onMouseEnter={() => {
                                        if(this.props.loadedPlane?.id !== plane.id){
                                            return this.setState({hoveredPlane : planeIndex})
                                        }
                                    }}
                                    onMouseLeave={() => this.setState({hoveredPlane : null})}
                                    >
                                    {plane.miniboards.map((board, i) => {
                                        return    <div 
                                                className="micro-board board" 
                                                key={i}
                                                style={{
                                                    height: (this.props.tileSize*3)/3-2+'px',
                                                    width: (this.props.tileSize*3)/3-2+'px'
                                                }}
                                                > 
                                                    {board.tiles && board.tiles.map((tile, i) => {
                                                    return <Tile
                                                    key={i}
                                                    id={i}
                                                    tileSize={((this.props.tileSize*3)/3-2)/15}
                                                    image={tile.image ? tile.image : null}
                                                    color={tile.color ? tile.color : 'white'}
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
                                    <div className={`map-title ${this.props.loadedPlane?.id === plane.id ? 'selected' : ''} ${this.state.hoveredPlane === plane.id ? 'hovered' : ''}`}> <span className={`validity-indicator ${plane.valid && 'valid'}`}></span>  {plane.name}</div>
                                </div>)
                        })}
                    </div>
                </div>
            </div>
        )
    }
}

export default DungeonView;