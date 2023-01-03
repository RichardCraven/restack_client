import React from 'react'
import '@coreui/coreui/dist/css/coreui.min.css'
import '../../styles/dungeon-board.scss'
import '../../styles/map-maker.scss'
import Tile from '../../components/tile'
import { CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CCollapse} from '@coreui/react';
import  CIcon  from '@coreui/icons-react'
import { cilCaretRight } from '@coreui/icons';
import '../../styles/dungeon-board.scss'
import '../../styles/map-maker.scss'

class PlaneView extends React.Component {
    constructor(props){
      super(props)
      this.state = {}
      console.log('this.props:', this.props);
    }
    render (){
        return (
            <div className="board-view-container">
                <div className="left-palette  palette boards-palette" 
                    style={{
                        width: this.props.tileSize*3+'px', 
                        height: this.props.boardSize+ 'px',
                        // backgroundColor: 'white'
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
                                    <CCollapse visible={this.props.boardsFoldersExpanded[folder.title]}>
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
                                                        if(this.props.selectedView === 'board'){
                                                        return this.props.loadBoard(board)
                                                        }
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
                                    onClick={() => {this.props.loadBoard(board)
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
                        <div className="mini-boards-container">
                            {this.props.loadedPlane && this.props.miniboards && this.props.miniboards.map((board, i) => {
                                return  <div 
                                        className="mini-board board" 
                                        key={i}
                                        style={{
                                        height: (this.props.tileSize*15)/3-2+'px',
                                        width: (this.props.tileSize*15)/3-2+'px',
                                        backgroundColor: 
                                        this.props.hoveredSection === i ? 'lightgoldenrodyellow': 
                                        (this.props.adjacencyHoverIdx === i ? 'lightgreen' : 'white')
                                        }}
                                        onDragOver={(event)=>this.props.onDragOver(event, i)}
                                        onDrop={(event)=>{this.props.onDrop(event, i)}}
                                        onMouseOver= {() => {
                                        this.props.adjacencyHover(i)
                                        }}
                                        onClick={() => {
                                        if(this.props.adjacencyHoverIdx === i && board.tiles){
                                            this.props.adjacencyFilter(board, i)
                                        }
                                        }}
                                        >
                                        {board.tiles && board.tiles.map((tile, i) => {
                                            return <Tile
                                            key={i}
                                            id={i}
                                            tileSize={((this.props.tileSize*15)/3-2)/15}
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
                            {!this.props.loadedPlane && <div className="empty-planes-container">
                                Select a plane, or create a new one
                            </div>
                            }
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

                    
                    <div className="plane-previews-container previews-container"
                        style={{
                            height: (this.props.boardSize - 78)+ 'px'
                        }}
                    >
                        {this.props.planes && this.props.planes.map((plane, i) => {
                        return (<div 
                                    className='plane-previews-container'
                                    key={i}
                                >
                                    <div 
                                    className="plane-preview" 
                                    style={{
                                        height: this.props.tileSize*3,
                                        width: this.props.tileSize*3,
                                        boxSizing: 'border-box'
                                    }}
                                    onClick={() => this.props.loadPlane(plane)}
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
                                    <div className={`map-title ${this.props.loadedPlane?.id === plane.id ? 'selected' : ''}`}> <span className={`validity-indicator ${plane.valid && 'valid'}`}></span>  {plane.name}</div>
                                </div>)
                        })}
                    </div>




                    {/* {this.props.mapMaker.paletteTiles && this.props.mapMaker.paletteTiles.map((tile, i) => {
                        return (
                        <div key={i} className="palette-options-pane">
                            <div className="palette-option-container"
                            style={{
                                backgroundImage: this.props.optionClickedIdx === i ? 'linear-gradient(90deg, transparent, black)' : 'none'
                            }}
                            onMouseOver={() => this.props.setPaletteHover(i)}
                            onClick={() => {
                                this.props.handleClick({
                                type: 'palette-tile',
                                id: i
                                })}
                            }>
                            <Tile 
                            id={tile.id}
                            tileSize={this.props.tileSize}
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
                                this.props.hoveredPaletteTileIdx === tile.id ?
                                true :
                                false
                            }>
                            </Tile>
                            <div className={`
                                text-container
                                ${this.props.hoveredPaletteTileIdx === tile.id ? 'hovered' : ''}
                                ${this.props.pinnedOption === tile.id ? 'pinned' : ''}
                                `
                                }>
                                <span
                                style={{
                                color: this.props.optionClickedIdx === i ? 'white' : 'black'
                                }}
                                >{tile.optionType}</span>
                            </div>
                            </div>
                        </div>
                        )
                    })} */}
                </div>
            </div>
        )
    }
}

export default PlaneView;