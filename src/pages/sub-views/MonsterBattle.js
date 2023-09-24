import React from 'react'
import '../../styles/monster-battle.scss'
import * as images from '../../utils/images'

const MAX_DEPTH = 8;
const MAX_ROWS = 5;
const TILE_SIZE = 100
const SHOW_TILE_BORDERS = true;
const SHOW_INTERACTION_PANE=true
class MonsterBattle extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            message: '',
            source: null,
            indicatorsMatrix: {},
            attackType: '',
            target: null,
            battleData: {},
            catcher: null,
            selectedFighter: null,
            selectedMonster: null,
            selectedAttack: null,
            hoveredAttackTile: null,
            hoveredInventoryTile: null,
            hoveredSpecialTile: null,
            showCrosshair: false,
            portraitHoveredId: null,
            greetingInProcess: true,
            combatTiles: [],
            draggedOverCombatTileId: null,
            draggingFighter: null
        }
    }
    componentDidMount(){
        // const MAX_DEPTH = 8;
        this.props.combatManager.initialize();
        let arr = [];
        for(let i = 0; i < 5*MAX_DEPTH; i++){
            let x = i%MAX_DEPTH,
            y = Math.floor(i/MAX_DEPTH)
            arr.push({
                id: i,
                x,
                y 
            })
        }
        console.log('arr:', arr, 'props.crew:', this.props.crew);
        this.setState({combatTiles: arr})
        // const crewLeader = this.props.crew.find(e=>e.isLeader)
        this.establishMessageCallback();
        this.establishUpdateMatrixCallback();
        this.establishUpdateActorCallback();
        this.establishUpdateDataCallback();
        this.establishGreetingCompleteCallback();
        this.establishGameOverCallback();
        this.props.combatManager.initializeCombat({
            crew: this.props.crew,
            leader: this.getCrewLeader(),
            monster: this.props.monster,
            minions: this.props.minions

        })
        // setTimeout(()=>{
        //     this.fighterClicked(this.props.crew[0].id)
        // })
    }
    greetingComplete = () => {
        console.log('greeting complete');
        this.fighterClicked(this.props.crew[0].id)
        this.setState({greetingInProcess: false})
    }
    tabToFighter = () => {
        const liveCrew = Object.values(this.state.battleData).filter(e=>(!e.isMonster && !e.isMinion) && !e.dead)
        if(liveCrew.length === 0) return
        const currentIndex = liveCrew.findIndex(e=>e.id === this.state.selectedFighter.id);
        const nextIndex = currentIndex === liveCrew.length-1 ? 0 : currentIndex + 1
        // let nextId = this.props.crew[nextIndex].id
        const selectedFighter = liveCrew[nextIndex];
        // selectedFighter.portrait = this.props.crew.find(e=>e.id === nextId).portrait

        this.setState({
            selectedFighter
        })
    }
    fighterClicked = (id) => {
        const selectedFighter = this.state.battleData[id];
        console.log('fighter clicked: ', selectedFighter)
        selectedFighter.portrait = this.props.crew.find(e=>e.id === id).portrait
        
        this.setState({
            selectedFighter,
            selectedMonster: null,
            selectedAttack: null
        })
    }
    pickRandom = (array) => {
        let index = Math.floor(Math.random() * array.length)
        return array[index]
    }

    getCrewLeader = () => {
        return this.props.crew.find(e=>e.isLeader)
    }

    setMessage = (messageData) => {
        const {message, source} = messageData;
        this.setState({
            message,
            source
        })
    }
    // updateCurrentActor = (data) => {
    //     const {actor, attackType, target} = data;
    //     console.log('actor: ', actor)
    //     this.setState({
    //         currentActor: actor,
    //         attackType,
    //         target
    //     })
    //     setTimeout(()=>{
    //         console.log('current actor type',this.state.currentActor.type, 'vs fighter type: ', this.props.crew.find(e=>e.type === this.state.currentActor.type))
    //     })
    // }
    updateIndicatorsMatrix = (indicatorsMatrix) => {
        this.setState({
            indicatorsMatrix
        })
    }
    updateBattleDate = (battleData) => {
        // console.log('updating battle data:', JSON.parse(JSON.stringify(battleData)))
        // debugger
        this.setState({
            battleData
        })
    }
    gameOver = () => {
        console.log('****GEM OVER****')
        this.props.battleOver()
    }
    establishUpdateActorCallback = () => {
        this.props.combatManager.establishUpdateActorCallback(this.updateCurrentActor)
    }
    establishUpdateMatrixCallback = () => {
        this.props.combatManager.establishUpdateMatrixCallback(this.updateIndicatorsMatrix)
    }
    establishMessageCallback = () => {
        this.props.combatManager.establishMessageCallback(this.setMessage)
    }
    establishUpdateDataCallback = () => {
        this.props.combatManager.establishUpdateDataCallback(this.updateBattleDate)
    }
    establishGreetingCompleteCallback = () => {
        this.props.combatManager.establishGreetingCompleteCallback(this.greetingComplete)
    }
    establishGameOverCallback = () => {
        this.props.combatManager.establishGameOverCallback(this.gameOver)
    }


    getDistanceToTarget = (id) => {
        // console.log(id, this.state.battleData)
        let source = this.state.battleData[id];
        if(!source) return 0;
        let targetId = this.state.battleData[id].targetId,
        target = this.state.battleData[targetId],
        returnVal = 50;
        if(!target) return 0;


        // if(target.isMonster && target.wounded) returnVal = 300;
        // if(target.isMonster && !target.wounded) returnVal = 200;
        // if(!target.isMonster && target.wounded) return 300
        if(target.isMonster){

        }
        return returnVal;
    }

    attackTileClicked = (val) => {
        if(val.cooldown_position !== 100) return
        // if(val !== null){
        //     val = val.replace('_', ' ')
        // }
        console.log('val: ', val);
        const formatted_val = val.name.replace(' ', '_')
        console.log('this.props.combatManager.attacksMatrix[val]: ', this.props.combatManager.attacksMatrix[formatted_val]);
        console.log('val:', this.props.combatManager.attacksMatrix)
        // this.setState({
        //     hoveredAttackTile: val
        // })
        this.setState({
            showCrosshair: true,
            selectedAttack: this.props.combatManager.attacksMatrix[formatted_val]
        })
    }
    attackTileHovered = (val) => {
        // if(val !== null){
        //     val = val.replace('_', ' ')
        // }
        this.setState({
            hoveredAttackTile: val
        })
    }
    inventoryTileHovered = (val) => {
        console.log('val:', val)
        this.setState({
            hoveredInventoryTile: val
        })
    }
    inventoryTileClicked = (val) => {
        console.log('val:', val)
    }
    specialTileClicked = (val) => {
        console.log('k...', Object.values(this.state.battleData).filter(e=>e.isMonster || e.isMinion));


        if(val !== null){
            val = val.replace('_', ' ')
        }
        console.log('val:', val)
        // this.setState({
        //     hoveredAttackTile: val
        // })
    }
    specialTileHovered = (val) => {
        // console.log('sepcial tile hovered:', val)
        this.setState({
            hoveredSpecialTile: val ? val.name : null
        })
    }
    portraitHovered = (id) => {
        this.setState({portraitHoveredId: id})
    }
    monsterCombatPortraitClicked = (id) => {
        const selectedMonster = this.state.battleData[id];
        console.log('monster clicked: ', selectedMonster)
        if(this.state.showCrosshair){
            this.props.combatManager.queueAttackOn(this.state.selectedFighter.id, id, this.state.selectedAttack)
            this.setState({
                selectedAttack: null
            })
        } else {
            this.setState({
                selectedMonster,
                selectedFighter: null,
                selectedAttack: null
            })
        }
        // selectedMonster.portrait = this.props.crew.find(e=>e.id === id).portrait
        
        
    }
    portraitClicked = (id) => {
        console.log('portrait clicked:', this.props)
        this.setState({
            showCrosshair: false
        })
    }
    targetTileClicked = (tile) => {
        console.log('tile:', tile);
        console.log('active fighter: ', this.state.selectedFighter);
        console.log('selected attack: ', this.state.selectedAttack);
        this.props.combatManager.setTargetFromClick(this.state.selectedFighter.id, tile.id)
        if(this.state.showCrosshair){
            this.props.combatManager.queueAttackOn(this.state.selectedFighter.id, tile.id, this.state.selectedAttack)
        }
        this.setState({
            showCrosshair: false,
            selectedAttack: null
        })
        // debugger
    }
    targetTileHovered = (tile) => {
        console.log('hover ', tile);
        this.setState({
            portraitHoveredId: tile ? tile.id : null
        })
    }
    queueTileHovered = (tile) => {
        console.log('hover ', tile);
        if(tile === null){
            this.setState({
                draggedOverCombatTileId: null
            })
            return
        }
        switch(tile.instruction.type){
            case 'move':
                let correspondingTile = this.state.combatTiles.find(e=> e.x === tile.instruction.destinationCoordinates.x && e.y === tile.instruction.destinationCoordinates.y)
                console.log('corresponding tile:', correspondingTile);
                this.setState({
                    draggedOverCombatTileId: correspondingTile.id
                })
            break;
            default:
            break;
        }
        // this.setState({
        //     draggedOverCombatTileId: tileIndex
        // })
    }
    onDragStart = (fighter) => {
        console.log('dragging fighter', fighter);
        this.setState({
            selectedFighter: this.state.battleData[fighter.id],
            draggingFighter: fighter
        })
    }
    onDragOver = (event, tileIndex) => {
        event.preventDefault();
        if(tileIndex === this.state.draggedOverCombatTileId) return
        this.setState({
            draggedOverCombatTileId: tileIndex
        })
    }
    onDrop = (tileIndex) => {
        const selectedFighter = this.state.battleData[this.state.draggingFighter.id];
        const tile = this.state.combatTiles[tileIndex]
        this.props.combatManager.setFighterDestination(selectedFighter.id, {x: tile.x, y: tile.y})
        this.setState({
            draggedOverCombatTileId: null,
            draggingFighter: null
        })
        
    }
    render(){
        return (
            <div className={`mb-board ${this.state.showCrosshair ? 'show-crosshair' : ''}`} 
            
            >
                <div className="combat-grid-container"
                style={{
                    width: TILE_SIZE * MAX_DEPTH + (SHOW_TILE_BORDERS ? MAX_DEPTH * 2 : 0) + 'px',
                    height: TILE_SIZE * MAX_ROWS + (SHOW_TILE_BORDERS ? MAX_ROWS * 2 : 0) + 'px'
                }}>
                    {/* /// COMBAT GRID */}
                    <div className="combat-grid" style={{width: TILE_SIZE * MAX_DEPTH + (SHOW_TILE_BORDERS ? MAX_DEPTH * 2 : 0) + 'px'}}>
                        {this.state.combatTiles.map((t,i)=>{
                            return <div 
                            key={i} 
                            className="combat-tile"
                            onDragOver={(event)=>this.onDragOver(event, i)}
                            onDrop={()=>{this.onDrop(i)}}
                            style={{
                                backgroundColor: this.state.draggedOverCombatTileId === i ? '#cccca4c1' : 'inherit'
                            }}
                            >
                                <div className="coord-container">
                                    {t.x}, {t.y}
                                </div>
                            </div>
                        })}
                    </div>
                    {/* /// FIGHTERS */}
                    <div className="mb-col fighter-pane">
                        <div className="fighter-content">
                            {this.props.crew.map((fighter, i) => {
                        return  <div key={i}  className='lane-wrapper' 
                                    style={{ 
                                        top: `${this.state.battleData[fighter.id]?.position * TILE_SIZE + (SHOW_TILE_BORDERS ? this.state.battleData[fighter.id]?.position * 2 : 0)}px`,
                                        height: `${TILE_SIZE}px`
                                    }}>
                                    <div 
                                    className={`fighter-wrapper ${fighter.isLeader ? 'leader-wrapper' : ''}`} 
                                    >
                                        <div className="portrait-wrapper"
                                        style={{
                                            left: `${this.state.battleData[fighter.id]?.depth * 100 + (SHOW_TILE_BORDERS ? this.state.battleData[fighter.id]?.depth * 2 : 0)}px`,
                                            zIndex: `${this.state.battleData[fighter.id]?.dead ? '0' : '100'}`
                                        }}
                                        >
                                            <div 
                                            className={
                                                `portrait fighter-portrait 
                                                ${this.state.selectedFighter?.id === fighter.id ? 'selected' : ''}
                                                ${this.state.battleData[fighter.id]?.wounded ? 'fighterWoundedAnimation' : ''} 
                                                ${fighter.isLeader ? 'leader-portrait' : ''} 
                                                ${this.state.battleData[fighter.id]?.dead ? 'dead fighterDeadAnimation' : ''} 
                                                ${this.state.selectedMonster?.targetId === fighter.id ? 'targetted' : ''}
                                                ${this.state.battleData[fighter.id]?.active ? 'active' : ''}`
                                            } 
                                            style={{
                                                backgroundImage: "url(" + images[fighter.portrait] + ")", 
                                                filter: `saturate(${((this.state.battleData[fighter.id]?.hp / fighter.stats.hp) * 100) / 2}) 
                                                        sepia(${this.state.portraitHoveredId === fighter.id ? '2' : '0'})`
                                            }} 
                                            onClick={() => this.fighterClicked(fighter.id)}
                                            onMouseEnter={() => this.portraitHovered(fighter.id)} 
                                            onMouseLeave={() => this.portraitHovered(null)}
                                            onDragStart = {(event) => this.onDragStart(fighter)}
                                            draggable
                                            >
                                                <div className="coord">
                                                    {this.state.battleData[fighter.id]?.coordinates?.x},{this.state.battleData[fighter.id]?.coordinates?.y}
                                                </div>
                                            </div>
                                            <div className="hp-bar">
                                            {!this.state.battleData[fighter.id]?.dead && <div className="red-fill" 
                                                style={{width: `${(this.state.battleData[fighter.id]?.hp / fighter.stats.hp) * 100}%`}}
                                                ></div>}
                                            </div>
                                            <div className="energy-bar">
                                                {!this.state.battleData[fighter.id]?.dead && <div className="yellow-fill" style={{width: `calc(${this.state.battleData[fighter.id]?.energy}%)`}}></div>}
                                            </div>
                                            <div className="tempo-bar">
                                                {!this.state.battleData[fighter.id]?.dead &&  <div className="tempo-indicator" style={{left: `calc(${this.state.battleData[fighter.id]?.tempo}% - 4px)`}}></div>}

                                            </div>
                                        </div>
                                        <div className={`action-bar-wrapper`} style={{
                                            width: !!this.state.battleData[fighter.id]?.targetId ? `${this.props.combatManager.getDistanceToTargetWidthString(this.state.battleData[fighter.id])}px` : '5px',
                                            left: `calc(100px * ${this.state.battleData[fighter.id]?.depth} + 50px)`
                                            }}>
                                            <div className={`action-bar ${(this.state.battleData[fighter.id]?.attacking) ? 'fighterHitsAnimation' : ''}`}></div>
                                        </div>
                                    </div>
                                </div>    
                            })}
                        </div>
                    </div>
                    
                    {/* /// MONSTERS & MINIONS */}
                    <div className="mb-col monster-pane">
                        {/* // MONSTER // */}
                        <div className='lane-wrapper'  
                        style={{ 
                            top: `${this.state.battleData[this.props.monster.id]?.position * TILE_SIZE + (SHOW_TILE_BORDERS ? this.state.battleData[this.props.monster.id]?.position * 2 : 0)}px`,
                            height: `${TILE_SIZE}px`
                        }}>
                            <div className="monster-wrapper">
                                <div className={`action-bar-wrapper`} 
                                    style={{
                                        width: !!this.state.battleData[this.props.monster.id]?.targetId ? `${this.props.combatManager.getDistanceToTargetWidthString(this.state.battleData[this.props.monster.id])}px` : '5px',
                                        left: `calc(100px * ${this.props.combatManager.getCombatant(this.state.battleData[this.props.monster.id]?.targetId)?.depth} + 50px)`
                                        }}>
                                    <div className={`action-bar ${this.state.battleData[this.props.monster.id]?.attacking ? 'monsterHitsAnimation' : ''}`}>

                                    </div>
                                </div>
                                <div 
                                className="portrait-wrapper"
                                style={{
                                    left: `${this.state.battleData[this.props.monster.id]?.depth * 100 + (SHOW_TILE_BORDERS ? this.state.battleData[this.props.monster.id]?.depth * 2: 0)}px`,
                                    zIndex: `${this.state.battleData[this.props.monster.id]?.dead ? '0' : '100'}`
                                }}
                                >
                                    <div 
                                    className={
                                        `portrait monster-portrait 
                                        ${this.state.greetingInProcess ? 'enlarged' : ''} 
                                        ${this.state.battleData[this.props.monster.id]?.active ? 'active' : ''} 
                                        ${this.state.battleData[this.props.monster.id]?.dead ? 'dead monsterDeadAnimation' : ''}
                                        ${this.state.battleData[this.props.monster.id]?.wounded ? 'fighterWoundedAnimation' : ''}
                                        ${this.state.selectedMonster?.id === this.props.monster.id ? 'selected' : ''}
                                        ${this.state.selectedFighter?.targetId === this.props.monster.id ? 'targetted' : ''}`
                                    } 
                                    style={{
                                        backgroundImage: "url(" + this.props.monster.portrait + ")", 
                                        filter: `saturate(${((this.state.battleData[this.props.monster.id]?.hp / this.props.monster.stats.hp) * 100) / 2}) 
                                                sepia(${this.state.portraitHoveredId === this.props.monster.id ? '2' : '0'})`
                                    }} 
                                    onMouseEnter={() => this.portraitHovered(this.props.monster.id)} 
                                    onMouseLeave={() => this.portraitHovered(null)}
                                    onClick={() => this.monsterCombatPortraitClicked(this.props.monster.id)}
                                    >
                                        <div className="targetted-by-container">
                                            {this.state.battleData[this.props.monster.id]?.targettedBy.map((e,i)=>{
                                                return <div key={i} className='targetted-by-portrait' style={{backgroundImage: "url(" + images[this.state.battleData[e]?.portrait] + ")"}}></div>
                                            })}
                                        </div>
                                    </div>
                                    {<div className="indicators-wrapper">
                                        <div className="monster-hp-bar hp-bar">
                                            {!this.state.battleData[this.props.monster.id]?.dead && <div className="red-fill" style={{width: `${(this.state.battleData[this.props.monster.id]?.hp / this.props.monster.stats.hp) * 100}%`}}></div>}
                                        </div>
                                        <div className="monster-energy-bar energy-bar">
                                            {!this.state.battleData[this.props.monster.id]?.dead && <div className="yellow-fill" style={{width: `calc(${this.state.battleData[this.props.monster.id]?.energy}%)`}}></div>}
                                        </div>
                                        <div className="tempo-bar">
                                            {!this.state.battleData[this.props.monster.id]?.dead && <div className="tempo-indicator" style={{right: `calc(${this.state.battleData[this.props.monster.id]?.tempo}% - 4px)`}}></div>}
                                        </div>
                                    </div>}
                                </div>
                            </div>
                        </div>

                        {/* // MINIONS // */}
                        {this.props.minions && this.props.minions.map((minion, i) => {
                    return <div key={i} className='lane-wrapper' 
                    style={{ 
                        top: `${this.state.battleData[minion.id]?.position * TILE_SIZE + (SHOW_TILE_BORDERS ? this.state.battleData[minion.id]?.position * 2 : 0)}px`,
                        height: `${TILE_SIZE}px`
                    }}
                        > 
                                <div className="monster-wrapper">
                                    <div className={`action-bar-wrapper`} 
                                        style={{
                                            width: !!this.state.battleData[minion.id]?.targetId ? `${this.props.combatManager.getDistanceToTargetWidthString(this.state.battleData[minion.id])}px` : '5px',
                                            left: `calc(100px * ${this.props.combatManager.getCombatant(this.state.battleData[minion.id]?.targetId)?.depth} + 50px)`
                                            }}>
                                        <div className={`action-bar ${this.state.battleData[minion.id]?.attacking ? 'monsterHitsAnimation' : ''}`}>
                                            {/* {minion.id} */}
                                        </div>
                                    </div>
                                    <div 
                                    className="portrait-wrapper"
                                    style={{
                                        left: `${this.state.battleData[minion.id]?.depth * 100 + (SHOW_TILE_BORDERS ? this.state.battleData[minion.id]?.depth * 2 : 0)}px`,
                                        zIndex: `${this.state.battleData[minion.id]?.dead ? '0' : '100'}`
                                    }}
                                    >
                                        <div 
                                        className={
                                            `portrait minion-portrait 
                                            ${this.state.battleData[minion.id]?.active ? 'active' : ''} 
                                            ${this.state.battleData[minion.id]?.dead ? 'dead monsterDeadAnimation' : ''}
                                            ${this.state.battleData[minion.id]?.wounded ? 'fighterWoundedAnimation' : ''}
                                            ${this.state.selectedMonster?.id === minion.id ? 'selected' : ''}
                                            ${this.state.selectedFighter?.targetId === minion.id ? 'targetted' : ''}`
                                        } 
                                        style={{
                                            backgroundImage: "url(" + minion.portrait + ")", 
                                            filter: `saturate(${((this.state.battleData[minion.id]?.hp / minion.stats.hp) * 100) / 2}) 
                                                    sepia(${this.state.portraitHoveredId === minion.id ? '2' : '0'})`
                                        }} 
                                        onMouseEnter={() => this.portraitHovered(minion.id)} 
                                        onMouseLeave={() => this.portraitHovered(null)}
                                        onClick={() => this.monsterCombatPortraitClicked(minion.id)}
                                        >
                                            <div className="targetted-by-container">
                                                {this.state.battleData[minion.id]?.targettedBy.map((e,i)=>{
                                                    return <div key={i} className='targetted-by-portrait' style={{backgroundImage: "url(" + images[this.state.battleData[e]?.portrait] + ")"}}></div>
                                                })}
                                            </div>
                                        </div>
                                        {<div className="indicators-wrapper">
                                            <div className="monster-hp-bar hp-bar">
                                                {!this.state.battleData[minion.id]?.dead && <div className="red-fill" style={{width: `${(this.state.battleData[minion.id]?.hp / minion.stats.hp) * 100}%`}}></div>}
                                            </div>
                                            <div className="monster-energy-bar energy-bar">
                                                {!this.state.battleData[minion.id]?.dead && <div className="yellow-fill" style={{width: `calc(${this.state.battleData[minion.id]?.energy}%)`}}></div>}
                                            </div>
                                            <div className="tempo-bar">
                                                {!this.state.battleData[minion.id]?.dead && <div className="tempo-indicator" style={{right: `calc(${this.state.battleData[minion.id]?.tempo}% - 4px)`}}></div>}
                                            </div>
                                        </div>}
                                    </div>
                                </div>
                            </div>
                        })}
                    </div>
                </div>

                {/* // INTERACTION PANE */}
                { SHOW_INTERACTION_PANE && <div className="mb-interaction-pane">
                    <div className="header-row">
                        <div className="portrait" style={{backgroundImage: "url(" + images[this.state.selectedFighter?.portrait] + ")"}}></div>
                        <div className="title">
                            <div className="name">
                                {this.state.selectedFighter?.name}
                            </div>
                            <div className="readout">
                                {this.state.selectedFighter?.readout}
                            </div>
                            {this.props.paused && <span className="paused-marker">PAUSED</span>}
                        </div>
                    </div>
                    <div className="interaction-row">
                        {/* <div className="stats-col">

                        </div> */}
                        <div className="inventory-col">
                            <div className="interaction-header">Consumables</div>
                            <div className="interaction-tooltip" style={{fontSize: this.state.hoveredInventoryTile?.length > 8 ? '10px': 'inherit'}}>{this.state.hoveredInventoryTile}</div>
                            <div className="interaction-tile-container">
                                    {this.props.inventoryManager?.inventory.filter(e=>e.type==='consumable').map((a, i)=>{
                                        return <div key={i}  className='interaction-tile-wrapper'>
                                                    <div 
                                                    className={`interaction-tile consumable`} 
                                                    style={{backgroundImage: "url(" + images[a.icon] + ")", cursor: 'pointer'}} 
                                                    onClick={() => this.inventoryTileClicked(a)} 
                                                    onMouseEnter={() => this.inventoryTileHovered(a.name)} 
                                                    onMouseLeave={() => this.inventoryTileHovered(null)}
                                                    >
                                                    </div>
                                                    <div className="interaction-tile-overlay" style={{width: `${a.cooldown_position}%`, transition: a.cooldown_position === 0 ? '0s' : '0.2s'}}></div>
                                                </div>
                                    })}
                            </div>
                        </div>
                        <div className="specials-col">
                            <div className="interaction-header">Specials</div>
                            <div className="interaction-tooltip">{this.state.hoveredSpecialTile}</div>
                            <div className="interaction-tile-container">
                                {this.state.selectedFighter?.specials.map((a, i)=>{
                                    return <div 
                                    key={i} 
                                    style={{backgroundImage: "url(" + images[a.icon] + ")", cursor: 'pointer'}} 
                                    className='interaction-tile special' 
                                    onClick={() => this.specialTileClicked(a)} 
                                    onMouseEnter={() => this.specialTileHovered(a)} 
                                    onMouseLeave={() => this.specialTileHovered(null)}>
                                        {/* {a} */}
                                    </div>
                                })}
                            </div>
                        </div>
                        <div className="attacks-col">
                            <div className="interaction-header">Attacks</div>
                            <div className="interaction-tooltip">{this.state.hoveredAttackTile}</div>
                            <div className="interaction-tile-container">
                                    {this.state.selectedFighter?.attacks.map((a, i)=>{
                                        return <div key={i}  className='interaction-tile-wrapper'>
                                                    <div 
                                                    className={`interaction-tile ${a.cooldown_position === 100 ? 'available' : ''}`} 
                                                    style={{backgroundImage: "url(" + images[a.icon] + ")", cursor: this.state.showCrosshair ? 'crosshair' : (a.cooldown_position === 100 ? 'pointer' : '')}} 
                                                    onClick={() => this.attackTileClicked(a)} 
                                                    onMouseEnter={() => this.attackTileHovered(a.name)} 
                                                    onMouseLeave={() => this.attackTileHovered(null)}
                                                    >
                                                    </div>
                                                    <div className="interaction-tile-overlay" style={{width: `${a.cooldown_position}%`, transition: a.cooldown_position === 0 ? '0s' : '0.2s'}}></div>
                                                </div>
                                    })}
                            </div>
                        </div>
                        <div className="target-col">
                            <div className="interaction-header">Target</div>
                            <div className="interaction-tooltip"> </div>
                            <div className="interaction-tile-container">
                                {Object.values(this.state.battleData).filter(e=>e.isMonster || e.isMinion && !e.dead).map((a, i)=>{
                                return <div 
                                    key={i} 
                                    style={{backgroundImage: "url(" + a.portrait + ")", cursor: this.state.showCrosshair ? 'crosshair' : ''}} 
                                    className={`interaction-tile target ${this.state.selectedFighter?.targetId === a.id ? 'targetted' : ''}`} 
                                    onClick={() => this.targetTileClicked(a)} 
                                    onMouseEnter={() => this.targetTileHovered(a)} 
                                    onMouseLeave={() => this.targetTileHovered(null)}
                                    >
                                    </div>
                                })}
                            </div>
                        </div>
                        <div className="combo-col">

                        </div>
                        <div className="queue-col">
                            <div className="interaction-header">Queue</div>
                            <div className="queue-tile-container">
                                {this.state.selectedFighter?.action_queue.map((action, i)=>{
                                    return <div 
                                    key={i} 
                                    style={{backgroundImage: "url(" + images[action.icon] + ")", cursor: 'pointer'}} 
                                    className='interaction-tile action' 
                                    onMouseEnter={() => this.queueTileHovered(action)} 
                                    onMouseLeave={() => this.queueTileHovered(null)}
                                    >
                                        {/* {a} */}
                                    </div>
                                })}
                            </div>
                        </div>
                    </div>
                </div>}
            </div>
        )
    }
}

export default MonsterBattle;