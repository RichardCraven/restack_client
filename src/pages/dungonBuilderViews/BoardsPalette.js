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
import * as images from '../../utils/images'

class BoardsPalette extends React.Component {
    constructor(props){
        super(props)
        this.state = {}
    }

    render (){
        return (
            <div className="palette right-palette" 
                style={{
                    width: this.props.tileSize*3+'px', height: this.props.boardSize+ 'px',
                    backgroundColor: 'white',
                    overflow: 'scroll'
                    // marginLeft: '25px'
                }}
                onMouseLeave={() => {
                    if(this.props.optionClickedIdx === null){
                        return this.props.setPaletteHover(null)
                    }
                }}
            >
                {this.props.mapMaker.paletteTiles && this.props.mapMaker.paletteTiles.map((tile, i) => {
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
                            color={tile.color ? tile.color : 'white'}
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
                                ${this.props.pinnedOption && this.props.pinnedOption.id === tile.id ? 'pinned' : ''}
                                `
                                }>
                                <span
                                style={{
                                color: this.props.optionClickedIdx === i ? 'white' : 'black'
                                }}
                                >{tile.optionType}</span>
                            </div>
                        </div>
                        {tile.optionType === 'monster' && <div className={`palette-option-expandable-container ${this.props.optionClickedIdx === i ? 'expanded' : ''}`}>
                            {Object.values(this.props.monsterManager.monsters).map((monster,i)=>{
                                return <div 
                                key={i} 
                                className={`palette-option-subcontainer`}
                                onClick={() => {
                                    this.props.handleClick({
                                    type: 'monster-tile',
                                    id: i
                                    })}
                                }
                                >
                                    <div className="text-container">
                                        {monster.key.replaceAll('_', ' ')}
                                    </div>
                                    <Tile 
                                    id={monster.id}
                                    tileSize={this.props.tileSize}
                                    image={monster.portrait}
                                    // color={monster.color ? monster.color : 'white'}
                                    // coordinates={monster.coordinates}
                                    index={monster.id}
                                    // showCoordinates={false}
                                    // editMode={true}
                                    imageOverride={monster.portrait}
                                    handleHover={null}
                                    handleClick={null}
                                    type={monster.type}
                                    hovered={
                                        this.props.hoveredPaletteTileIdx === monster.id ?
                                        true :
                                        false
                                    }>
                                    </Tile>
                                    
                                </div> 
                            })}
                        </div>}
                        {tile.optionType === 'gate' && <div className={`palette-option-expandable-container ${this.props.optionClickedIdx === i ? 'expanded' : ''}`}>
                            {this.props.gates.map((gate,i)=>{
                                return <div 
                                key={i} 
                                className={`palette-option-subcontainer`}
                                onClick={() => {
                                    this.props.handleClick({
                                    type: 'gate-tile',
                                    id: i
                                    })}
                                }
                                >
                                    <div className="text-container">
                                        {gate.key.replace('_', ' ')}
                                    </div>
                                    <Tile 
                                    id={i}
                                    tileSize={this.props.tileSize}
                                    index={gate.id}
                                    image={images[gate.key]}
                                    // showCoordinates={false}
                                    // editMode={true}
                                    imageOverride={images[gate.key]}
                                    handleHover={null}
                                    handleClick={null}
                                    type={'gate'}>
                                    </Tile>
                                    
                                </div> 
                            })}
                        </div>}
                    </div>
                    )
                })}
            </div>
        )
    }
}

export default BoardsPalette;


