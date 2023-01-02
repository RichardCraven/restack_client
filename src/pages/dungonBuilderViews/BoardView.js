import React from 'react'
import '@coreui/coreui/dist/css/coreui.min.css'
import '../../styles/dungeon-board.scss'
import '../../styles/map-maker.scss'
import Tile from '../../components/tile'
import { CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CModal, CButton, CModalHeader, CModalTitle, CModalBody, CModalFooter, CFormSelect} from '@coreui/react';


class BoardView extends React.Component {
    constructor(props){
      super(props)
      this.state = {}
    }
    render (){
        return (
            <div className="board-view-container">
                <div className="left-palette  palette boards-palette" style={{
                width: this.props.tileSize*3+'px', 
                height: this.props.boardSize+ 'px',
                backgroundColor: 'white',
                // marginRight: '25px'
                }}>
                    <div className="board-options-buttons-container" 
                    style={{
                        width: this.state.tileSize*3+'px',
                        // height: this.state.tileSize*2
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
                            height: (this.props.boardSize - 78)+ 'px'
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
                    <div className="board map-board" 
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
                    </div>
                </div>
                <div className="palette right-palette" 
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