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

class PlanesPanel extends React.Component {
    constructor(props){
      super(props)
      this.state = {
        hoveredPlane : null
      }
    //   console.log('this.props:', this.props);
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
    miniboardClicked(event, board, boardIndex){
        console.log('miniboard clicked', event.detail);
        if(this.props.adjacencyHoverIdx === boardIndex && board.tiles){
            this.props.adjacencyFilter(board, boardIndex)
        }
        if (event.detail === 2) {
            if(board.tiles){
                this.props.loadBoard(board)
            }
        }
    }

    render (){
        return (
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
                            <CDropdownItem onClick={() => this.props.toggleShowPlaneNames()}>Toggle Show Name</CDropdownItem>
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
        )}

}

export default PlanesPanel;