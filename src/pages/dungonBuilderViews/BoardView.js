import React from 'react'
import '@coreui/coreui/dist/css/coreui.min.css'
import '../../styles/dungeon-board.scss'
import '../../styles/map-maker.scss'
import Tile from '../../components/tile'
import CIcon from '@coreui/icons-react'
import { cilSave, cilPencil, cilTrash, cilPlus } from '@coreui/icons';
// import { CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CCollapse} from '@coreui/react';
// import  CIcon  from '@coreui/icons-react'
// import { cilCaretRight } from '@coreui/icons';
import '../../styles/dungeon-board.scss'
import '../../styles/map-maker.scss'
// import * as images from '../../utils/images'


// Expects prop: combatManager for VCT highlighting
class BoardView extends React.Component {
    constructor(props){
      super(props)
      this.state = {}
    }
    
    render (){
        return (
            <div className="board-view-container">
                <div className="center-board-container" style={{flexDirection: 'column'}}>
                    <div className="level-buttons-container plane-action-buttons">
                        <div className="icon-container" title="Save Board" onClick={() => this.props.writeBoard && this.props.writeBoard()}>
                            <CIcon icon={cilSave} size="lg"/>
                        </div>
                        <div className="icon-container" title="Rename Board" onClick={() => this.props.loadedBoard && this.props.renameBoard && this.props.renameBoard()}>
                            <CIcon icon={cilPencil} size="lg"/>
                        </div>
                        <div className="icon-container" title="Delete Board" onClick={() => this.props.loadedBoard && this.props.deleteBoard && this.props.deleteBoard(this.props.loadedBoard.id)}>
                            <CIcon icon={cilTrash} size="lg"/>
                        </div>
                        <div className="icon-container" title="New Board" onClick={() => this.props.addNewBoard && this.props.addNewBoard()}>
                            <CIcon icon={cilPlus} size="lg"/>
                        </div>
                    </div>
                    <div className="board map-board" 
                        onMouseLeave={() => {return this.props.setHover(null)}}
                        style={{
                        width: this.props.boardSize+'px', height: this.props.boardSize+ 'px',
                        backgroundColor: 'white'
                        }}>
                        {this.props.tiles && this.props.tiles.map((tile, i) => {
                            return <Tile 
                                key={i}
                                id={tile.id}
                                index={tile.id}
                                tileSize={this.props.tileSize}
                                image={tile.image ? tile.image : null}
                                imageOverride={tile.image && tile.image.includes('/') ? tile.image : null}
                                color={tile.color ? tile.color : 'lightgrey'}
                                borders={tile.borders}
                                coordinates={tile.coordinates}
                                showCoordinates={this.props.showCoordinates}
                                editMode={true}
                                handleHover={this.props.handleHover}
                                handleClick={this.props.handleClick}
                                type={tile.type}
                                hovered={
                                    this.props.hoveredTileIdx === tile.id ?
                                    true : false
                                }
                                combatManager={this.props.combatManager}
                            />
                        })}
                    </div>
                </div>
            </div>
        )
    }
}

export default BoardView;