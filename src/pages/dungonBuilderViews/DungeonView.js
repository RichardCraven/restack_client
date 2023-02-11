import React from 'react'
import '@coreui/coreui/dist/css/coreui.min.css'
import '../../styles/dungeon-board.scss'
import '../../styles/map-maker.scss'
import Tile from '../../components/tile'
import { CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CCollapse, CSpinner, CFormSelect} from '@coreui/react';
import  CIcon  from '@coreui/icons-react'
import { cilCaretRight, cilSave, cilQrCode, cilLevelDown, cilLevelUp, cilLibraryAdd, cilTrash, cilOptions, cilPlus, cibTheMovieDatabase } from '@coreui/icons';
import '../../styles/dungeon-board.scss'
import '../../styles/map-maker.scss'
import Canvas from '../../components/Canvas/canvas'
import arrowDown from '../../assets/graphics/arrow_down.png'
import arrowUp from '../../assets/graphics/arrow_up.png'
import arrowUpInvalid from '../../assets/graphics/arrow_up_invalid.png'

class DungeonView extends React.Component {
    constructor(props){
      super(props)
      this.state = {
        hoveredPlane : null
      }
    }


    timer;
    onClickHandler = event => {
        console.log('evt');
        clearTimeout(this.timer);

        if (event.detail === 1) {
            console.log('SINGLE CLICK!');
            // this.timer = setTimeout(this.props.onClick, 200)
        } else if (event.detail === 2) {
            // this.props.onDoubleClick()
            console.log('DOUBLE CLICK!');
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
    containsImages = (passagesArray) => {
        let imageTypes = ['way_up', 'way_down']
        return passagesArray.some(p=>imageTypes.includes(p.contains))
    }
    countImages = (passagesArray) => {
        let imageTypes = ['way_up', 'way_down']
        return passagesArray.filter(p=>imageTypes.includes(p.contains)).length
    }
    draw = (ctx, frameCount, data) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        // console.log('framecount:', frameCount);
       // ctx.arc(50, 100, 20*Math.sin(frameCount*0.05)**2, 0, 2*Math.PI)
    //    ^^^ animation
        const levelData = this.props.overlayData?.find(x=>x.id === data.levelId);
        if(levelData){
            let planeSize = this.props.tileSize*2;
            let unit = planeSize/15;
            let passages;
            passages = data.orientation === 'front' ? levelData.frontPassages.filter(p=>p.miniboardIndex === data.index) :
            (data.orientation === 'back' ? levelData.backPassages.filter(p=>p.miniboardIndex === data.index) : null)
            if(data.levelId === 1 && data.orientation === 'front' && data.index === 4){
                // console.log('passages: ', passages, 'levelData.frontPassages', levelData.frontPassages);
                // console.log('incorrect planeSize = ', planeSize);
            }
            if(data.levelId === 0 && data.orientation === 'front' && data.index === 4){
                // console.log('passages: ', passages, 'levelData.frontPassages', levelData.frontPassages);
                // console.log('correct planeSize = ', planeSize);
            }
            // if(data.levelId === 1 && data.orientation === 'front'){
            //     console.log('data:', data, 'levelData: ', levelData, 'passages: ', passages);
            // }
            if(passages){
                const that = this;
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                passages.forEach((p, index)=>{
                    // if(data.levelId === 1 && data.orientation === 'front' && data.index === 4){
                    //     // console.log('passages: ', passages, 'levelData.frontPassages', levelData.frontPassages);
                    //     console.log('passage:', p);
                    // }
                    // ctx.fillStyle = fillStyle
                    let x = unit*p.coordinates[0] + unit/2
                    let y = unit*p.coordinates[1] + unit/2
                    let isConnected = levelData.connected.some(x => x.locationCode === p.locationCode)
                    if(p.contains === 'door' && isConnected){
                        let x = unit*p.coordinates[0] - 0.5*unit - (Math.sin(frameCount * 0.04)**2 * 2)
                        let y = unit*p.coordinates[1]
                        let size = 20 + Math.sin(frameCount * 0.04)**2 * 5
                        let imageKey = 'doorImg'
                        ctx.drawImage(this.props.imagesMatrix[imageKey], x, y, size, size);
                    } else if(p.contains === 'way_up'){
                        let x = unit*p.coordinates[0] - 0.5*unit - (Math.sin(frameCount * 0.04)**2 * 2)
                        let y = unit*p.coordinates[1]
                        let imageKey = isConnected ? 'arrowUpImg' : 'arrowUpImgInvalid'

                        

                        // console.log('way up ', 'connected: ', isConnected, imageKey);
                        let size = 20 + Math.sin(frameCount * 0.04)**2 * 5;
                        if(data.levelId === 0 && data.orientation === 'front' && data.index === 4){
                            // console.log('correct unit:', unit);
                            // console.log('correct p.coordinates[0]', p.coordinates[0]);
                            // console.log('passages: ', passages, 'levelData.frontPassages', levelData.frontPassages);
                            // x = 10; y = 10
                            // console.log('x y and size:', x, y, size);
                            // ctx.drawImage(this.props.imagesMatrix[imageKey], 100, 100, size, size);
                        }
                        ctx.drawImage(this.props.imagesMatrix[imageKey], x, y, size, size);
                    } else if(p.contains === 'way_down'){
                        let x = unit*p.coordinates[0] - 0.5*unit - (Math.sin(frameCount * 0.04)**2 * 2)
                        let y = unit*p.coordinates[1]
                        let size = 20 + Math.sin(frameCount * 0.04)**2 * 5
                        let imageKey = isConnected ? 'arrowDownImg' : 'arrowDownImgInvalid'
                   
                        if(data.levelId === 1 && data.orientation === 'front' && data.index === 4){
                            // console.log('passages: ', passages, 'levelData.frontPassages', levelData.frontPassages);
                            // x = 10; y = 10
                            // console.log(' unit:', unit);
                            // console.log('p.coordinates[0]', p.coordinates[0]);
                            // console.log('x y:', x, y);
                        }
                        // ctx.drawImage(this.props.imagesMatrix[imageKey], 120, 120, size, size);
                        ctx.drawImage(this.props.imagesMatrix[imageKey], x, y, size, size);
                    } else if(p.contains === 'spawn_point'){
                        let x = unit*p.coordinates[0] - 0.5*unit - (Math.sin(frameCount * 0.04)**2 * 2)
                        let y = unit*p.coordinates[1]
                        let size = 20 + Math.sin(frameCount * 0.04)**2 * 5
                        let imageKey = 'spawnPointImg'
                   
                        if(data.levelId === 1 && data.orientation === 'front' && data.index === 4){
                            // console.log('passages: ', passages, 'levelData.frontPassages', levelData.frontPassages);
                            // x = 10; y = 10
                            // console.log(' unit:', unit);
                            // console.log('p.coordinates[0]', p.coordinates[0]);
                            // console.log('x y:', x, y);
                        }
                        // ctx.drawImage(this.props.imagesMatrix[imageKey], 120, 120, size, size);
                        ctx.drawImage(this.props.imagesMatrix[imageKey], x, y, size, size);
                    } else {
                        ctx.beginPath()
                        let minVal = 3.5;
                        ctx.fillStyle = that.getPassageColors(p.contains)
                        ctx.arc(x, y, 3.5*Math.sin(frameCount*0.03 + index)**2 + minVal, 0, 2*Math.PI)
                        ctx.fill()  
                        // x ** 2 is the x squared
                    }
                }) 
            }

            if(data.orientation === 'doublewide'){
                let miniboardSize = this.props.tileSize*2;
                let planeHeight = this.props.tileSize*6;
                let unit = planeHeight/(this.props.tileSize*6);
                let leftPlaneSize = this.props.tileSize*6;
                ctx.fillStyle = 'red'
                
                let cols = [1,2,3,1,2,3,1,2,3]
                let rows = [1,1,1,2,2,2,3,3,3]

                levelData.connected.forEach((lim)=>{
                    let row = rows[lim.miniboardIndex] 
                    let col = cols[lim.miniboardIndex] 
                    let originPointX = (miniboardSize * col) - miniboardSize + (unit * 2)
                    let originPointX_back = ((3*miniboardSize) + miniboardSize * col) - miniboardSize + (unit * 2) 
                    let originPointY = (miniboardSize * row) - miniboardSize + (unit * 2);
                    let microUnit = miniboardSize/15;
                    let connectedTo = lim.connectedTo;
                    if(connectedTo.level !== lim.level) return
                    // doors only for now ^

                    let x = microUnit*lim.coordinates[0] + (unit * 2) 
                    let y = microUnit*lim.coordinates[1] + (unit * 2) ,
                    newOriginX = (originPointX + x) + (unit * 2) ,
                    newOriginY = (originPointY + y) + (unit * 2) ,
                    destinationX_back = (originPointX_back + x) + (unit * 4) ,
                    destinationY_back = (originPointY + y) + (unit * 4) 
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = 'lightgreen'
                    ctx.beginPath();
                    ctx.moveTo(newOriginX,newOriginY);
                    let bezierControlPoint1 = {x: newOriginX, y: newOriginY + 100}
                    let bezierControlPoint2 = {x:destinationX_back, y: newOriginY + 100}
                    ctx.bezierCurveTo(bezierControlPoint1.x, bezierControlPoint1.y, bezierControlPoint2.x, bezierControlPoint2.y, destinationX_back, destinationY_back)
                    ctx.stroke();
                })
            }
            if(data.orientation === 'doubletall_F' || data.orientation === 'doubletall_B'){
                const isFront = data.orientation.split('_')[1] === 'F'
                const isBack = data.orientation.split('_')[1] === 'B'
                let miniboardSize = this.props.tileSize*2;
                let planeHeight = this.props.tileSize*6;
                let unit = planeHeight/(this.props.tileSize*6);
                ctx.fillStyle = 'red'
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
                let cols = [1,2,3,1,2,3,1,2,3]
                let rows = [1,1,1,2,2,2,3,3,3]
                // if(levelData.passages)
                levelData.connected.filter(e=>e.type==='way_up').forEach((lim)=>{
                    // console.log('upwards:', lim);
                    let row = rows[lim.miniboardIndex] 
                    let col = cols[lim.miniboardIndex] 
                    let originPointX = (miniboardSize * col) - miniboardSize + (unit * 2)
                    // let originPointX_back = ((3*miniboardSize) + miniboardSize * col) - miniboardSize + (unit * 2) 
                    let originPointY = (miniboardSize * row) - miniboardSize + (unit * 2);
                    let originPointY_up = ((3*miniboardSize) + miniboardSize * row) - miniboardSize + (unit * 2) 
                    let microUnit = miniboardSize/15;
                    let connectedTo = lim.connectedTo;
                    // if(connectedTo.level !== lim.level) return
                    // doors only for now ^

                    let x = microUnit*lim.coordinates[0] + (unit * 2) 
                    let y = microUnit*lim.coordinates[1] + (unit * 2) ,
                    newOriginX = (originPointX + x)  ,
                    newOriginY = (originPointY + y) + (unit * 2) ,
                    destinationX_up = (originPointX + x)  ,
                    destinationY_up = (originPointY_up + y) + (unit * 2) 
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = 'lightgreen'
                    ctx.beginPath();
                    ctx.moveTo(newOriginX,newOriginY);
                    let bezierControlPoint1 = {x: newOriginX - 50, y: newOriginY}
                    let bezierControlPoint2 = {x:newOriginX - 50, y: destinationY_up}
                    ctx.bezierCurveTo(bezierControlPoint1.x, bezierControlPoint1.y, bezierControlPoint2.x, bezierControlPoint2.y, destinationX_up, destinationY_up)
                    ctx.stroke();
                })
            }
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
                            <CDropdownToggle disabled color="secondary">
                                Actions
                            </CDropdownToggle>
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
                                                                        return this.props.loadBoard(board)
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
                                                        return this.props.loadBoard(board)
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
                        <div className="dungeon-info">
                            <div className="dungeon-name">
                                { this.props.loadedDungeon && <div className={`dungeon-validity-indicator ${this.props.loadedDungeon.valid ? 'valid' : 'invalid'}`}></div>}
                                <CFormSelect 
                                aria-label="Dungeon Selector"
                                ref={this.props.dungeonSelectVal}
                                options={
                                    ['Dungeon Selector'].concat(this.props.dungeons.map((e, i)=>{
                                    return { label: e.name, value: e.name}
                                    }))
                                }
                                onChange={this.props.dungeonSelectOnChange}
                                />
                            </div>
                            {this.props.loadedDungeon && !this.props.loadingData && <div className="level-buttons-container">
                            <div className="icon-container" onClick={() => this.props.addDungeonLevelUp()}>
                                <CIcon icon={cilLibraryAdd} size="lg"/> <CIcon className="add-level-up-icon" icon={cilLevelUp} size="lg"/>
                            </div>
                            <div className="icon-container" onClick={() =>  this.props.saveDungeonLevel()}>
                                <CIcon icon={cilSave} size="lg"/>
                            </div>
                            <div className="icon-container" onClick={() => this.props.toggleDungeonLevelOverlay()}>
                                <CIcon icon={cilQrCode} size="lg"/>
                            </div>
                            <div className="icon-container" onClick={() => this.props.addDungeonLevelDown()}>
                                <CIcon icon={cilLibraryAdd} size="lg"/> <CIcon className="add-level-down-icon" icon={cilLevelDown} size="lg"/>
                            </div>
                            <div className="icon-container" onClick={() => this.props.addNewDungeon()}>
                                <CIcon icon={cilPlus} size="lg"/>
                            </div>
                            <div className="icon-container dungeon-options-container" >
                                <CDropdown>
                                    <CDropdownToggle color="white">
                                        <CIcon icon={cilOptions} size="lg"/>
                                    </CDropdownToggle>
                                    <CDropdownMenu>
                                        <CDropdownItem onClick={() => this.props.renameDungeon()}>Rename Dungeon</CDropdownItem>
                                        <CDropdownItem onClick={() => this.props.deleteDungeon()}>Delete Dungeon</CDropdownItem>
                                        <CDropdownItem onClick={() => this.props.downloadDungeon()}>Download Dungeon</CDropdownItem>
                                    </CDropdownMenu>
                                </CDropdown>
                            </div>

                            
                        </div>}
                        </div>
                        <div className="dungeon-planes-container">
                            {this.props.loadedDungeon && !this.props.loadingData && <div className="loaded-dungeon-wrapper"
                            style={{
                                justifyContent: this.props.loadedDungeon.levels.length > 2 ? 'flex-start' : 'center'
                            }}
                            >
                                { this.props.loadedDungeon.levels.sort((a,b) => b.id - a.id).map((level,levelIndex)=>{
                                     return <div key={levelIndex} className="level-wrapper">
                                        <div className="level-info">
                                            <div className={`level-valid-indicator ${level.valid ? 'valid' : ''} ${level.valid === false ? 'invalid' : ''}`}></div>
                                            <div className="level-readout">{`Lvl ${level.id}`}</div>
                                            {level.id !== 0 && <div className="icon-container" onClick={() =>  this.props.clearDungeonLevel(level.id)}>
                                                <CIcon icon={cilTrash} size="lg"/>
                                            </div>}
                                        </div>
                                        <div className="plane-board-displays-wrapper">
                                            {level.passages && level.passages.upwardPassages.filter(e=>e.orientation === 'front').length > 0 && <div className="front-upwards-connecting-canvas-wrapper">
                                                <Canvas 
                                                className="doubletall-canvas"
                                                width={this.props.tileSize*6}
                                                height={this.props.tileSize*12}
                                                draw={this.draw}
                                                data={{index: null, levelId: level.id, orientation: 'doubletall_F'}}
                                                />
                                            </div>}
                                            {level.passages && level.passages.upwardPassages.filter(e=>e.orientation === 'back').length > 0 && <div className="back-upwards-connecting-canvas-wrapper">
                                                <Canvas 
                                                className="doubletall-canvas"
                                                width={this.props.tileSize*6}
                                                height={this.props.tileSize*12}
                                                draw={this.draw}
                                                data={{index: null, levelId: level.id, orientation: 'doubletall_B'}}
                                                />
                                            </div>}
                                            <div className="horizontal-connecting-canvas-wrapper">
                                               {<Canvas 
                                                className="doublewide-canvas"
                                                width={this.props.tileSize*12}
                                                height={this.props.tileSize*6}
                                                draw={this.draw}
                                                data={{index: null, levelId: level.id, orientation: 'doublewide'}}
                                                />}
                                            </div>
                                            {level.front && <div className="front-plane plane-board-display">
                                                <div 
                                                className={`plane-preview draggable`}
                                                style={{
                                                    height: this.props.tileSize*6,
                                                    width: this.props.tileSize*6
                                                }}
                                                onDrop={(event)=>{this.props.onDropDungeon(levelIndex, 'front')}}
                                                >
                                                    <div className={`interaction-layer ${this.props.hoveredDungeonSection === `${levelIndex}_front` ? 'active': ''}`}
                                                        onDragOver={(event)=>this.props.onDragOverDungeon(event, levelIndex, 'front')}
                                                        onDrop={(event)=>{this.props.onDropDungeon(levelIndex, 'front')}}
                                                    >
                                                        {[1,2,3,4,5,6,7,8,9].map((e,i)=>{
                                                        return <div 
                                                                    key={i}
                                                                    style={{
                                                                        height: this.props.tileSize*2,
                                                                        width: this.props.tileSize*2
                                                                    }}
                                                                    className={`interaction-section`}
                                                                    onClick={() => this.props.zoomIntoBoard(level.id, i, 'front')}
                                                                ></div>
                                                        })}
                                                    </div>
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
                                                                hovered={false}
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
                                                    }}>
                                                    <div className={`interaction-layer ${this.props.hoveredDungeonSection === `${levelIndex}_back` ? 'active': ''}`}
                                                        onDragOver={(event)=>this.props.onDragOverDungeon(event, levelIndex, 'back')}
                                                        onDrop={(event)=>{this.props.onDropDungeon(levelIndex, 'back')}}
                                                    >
                                                        {[1,2,3,4,5,6,7,8,9].map((e,i)=>{
                                                        return <div
                                                                    key={i}
                                                                    style={{
                                                                        height: this.props.tileSize*2,
                                                                        width: this.props.tileSize*2
                                                                    }}
                                                                    className={`interaction-section`}
                                                                    onClick={() => this.props.zoomIntoBoard(level.id, i, 'back')}
                                                                ></div>
                                                        })}
                                                    </div>
                                                    <div 
                                                    className="canvas-overlay-container mini-boards-container"
                                                    style={{
                                                        height: this.props.tileSize*6,
                                                        width: this.props.tileSize*6
                                                    }}
                                                    onDrop={(event)=>{this.props.onDropDungeon(levelIndex, 'front')}}
                                                    >
                                                        {[1,2,3,4,5,6,7,8,9].map((e,i)=>{
                                                        return <Canvas 
                                                            key={i}
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
                            {/* {this.props.loadedDungeon && !this.props.loadingData && <div className="level-buttons-container">
                                <div className="icon-container" onClick={() => this.props.addDungeonLevelUp()}>
                                    <CIcon icon={cilLibraryAdd} size="lg"/> <CIcon className="add-level-up-icon" icon={cilLevelUp} size="lg"/>
                                </div>
                                <div className="icon-container" onClick={() =>  this.props.saveDungeonLevel()}>
                                    <CIcon icon={cilSave} size="lg"/>
                                </div>
                                <div className="icon-container" onClick={() => this.props.toggleDungeonLevelOverlay()}>
                                    <CIcon icon={cilQrCode} size="lg"/>
                                </div>
                                <div className="icon-container" onClick={() => this.props.addDungeonLevelDown()}>
                                    <CIcon icon={cilLibraryAdd} size="lg"/> <CIcon className="add-level-down-icon" icon={cilLevelDown} size="lg"/>
                                </div>
                            </div>} */}

                            {/* EMPTY STATE */}
                            {!this.props.loadedDungeon && !this.props.loadingData && <div className="empty-dungeons-container">
                                Select a dungeon, or create a new one
                            </div>}

                            {/* LOADING STATE */}
                            {this.props.loadingData && <div className="empty-dungeons-container">
                                <CSpinner/>
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