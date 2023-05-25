import React from 'react'
import '../../styles/monster-battle.scss'
import * as images from '../../utils/images'

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
            hoveredAttackTile: null,
            hoveredInventoryTile: null,
            hoveredSpecialTile: null,
            showCrosshair: false,
            portraitHoveredId: null
        }
    }
    componentDidMount(){
        console.log('DID MOUNT', this.props);
        this.props.combatManager.initialize();
        // const crewLeader = this.props.crew.find(e=>e.isLeader)
        this.establishMessageCallback();
        this.establishUpdateMatrixCallback();
        this.establishUpdateActorCallback();
        this.establishUpdateDataCallback();
        this.establishGameOverCallback();
        this.props.combatManager.initializeCombat({
            crew: this.props.crew,
            leader: this.getCrewLeader(),
            monster: this.props.monster,
            minions: this.props.minions

        })
        console.log('cre:', this.props.crew, this.props.crew[0], this.props.crew[0].portrait);
        // debugger
        setTimeout(()=>{
            this.fighterClicked(this.props.crew[0].id)
        })
    }

    fighterClicked = (id) => {
        console.log('battle data:', this.state.battleData, id)
        const selectedFighter = this.state.battleData[id];
        selectedFighter.portrait = this.props.crew.find(e=>e.id === id).portrait
        
        this.setState({
            selectedFighter
        })



        // console.log('fighterClicked', id)
        // this.setState({
        //     catcher: id
        // })
        // setTimeout(() => {
        //     this.setState({
        //         catcher: null
        //     })
        // }, 1000)
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
        console.log('updating indicators matrix', indicatorsMatrix)
        this.setState({
            indicatorsMatrix
        })
        console.log(this.state.indicatorsMatrix[this.props.monster.type].hp, '/', this.props.combatManager.monsterHp)
        console.log('percent:', (this.state.indicatorsMatrix[this.props.monster.type].hp / this.props.combatManager.monsterHp) * 100)
        setTimeout(()=>{
            // console.log('this.state.indicatorsMatrix:', this.state.indicatorsMatrix)
            // console.log('crew leader: ', this.getCrewLeader())
            // console.log('type:', this.getCrewLeader().type)
            // console.log(this.state.indicatorsMatrix[this.getCrewLeader().type])
            // console.log('monster:', this.props.combatManager.data.monster)
            // console.log('other monster:', this.props.monster, '< -- does this have hp')
            
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
        console.log('val:', this.props.combatManager.attacksMatrix[val])
        // this.setState({
        //     hoveredAttackTile: val
        // })
        this.setState({
            showCrosshair: true
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
    portraitClicked = (id) => {
        console.log('inventory manager:', this.props)
        this.setState({
            showCrosshair: false
        })
    }
    targetTileClicked = (tile) => {
        console.log('tile:', tile);
        console.log('active gither: ', this.state.selectedFighter);
        this.props.combatManager.setTargetFromClick(this.state.selectedFighter.id, tile.id)
        this.setState({
            showCrosshair: false
        })
    }
    render(){
        return (
            <div className={`mb-board ${this.state.showCrosshair ? 'show-crosshair' : ''}`}>
                {/* /// FIGHTERS */}
                <div className="mb-col left-col">
                    <div className="fighter-content">
                        {this.props.crew.map((fighter, i) => {
                           return <div key={i} className={`fighter-wrapper ${fighter.isLeader ? 'leader-wrapper' : ''}`} 
                           style=
                           {{
                            top: `${this.state.battleData[fighter.id]?.position * 110}px`,
                            left: `${this.state.battleData[fighter.id]?.depth * 100}px`
                           }}>
                                    <div className="portrait-wrapper">
                                        <div 
                                        className={`portrait fighter-portrait ${this.state.battleData[fighter.id]?.wounded ? 'fighterWoundedAnimation' : ''} ${fighter.isLeader ? 'leader-portrait' : ''} ${this.state.battleData[fighter.id]?.dead ? 'dead fighterDeadAnimation' : ''} ${this.state.battleData[fighter.id]?.active ? 'active' : ''}`} 
                                        style={{
                                            backgroundImage: "url(" + images[fighter.portrait] + ")", 
                                            filter: `saturate(${((this.state.battleData[fighter.id]?.hp / fighter.stats.hp) * 100) / 2}) 
                                                     sepia(${this.state.portraitHoveredId === fighter.id ? '2' : '0'})`
                                        }} 
                                        onClick={() => this.fighterClicked(fighter.id)}
                                        onMouseEnter={() => this.portraitHovered(fighter.id)} 
                                        onMouseLeave={() => this.portraitHovered(null)}
                                        ></div>
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
                                    {/* <div className={`action-bar-wrapper ${this.state.battleData[fighter.id]?.wounded ? 'fighterWoundedAnimation' : ''}`} style={{width: `calc(100% - ${this.getDistanceToTarget(fighter.id)}px)`}}> */}
                                    <div className={`action-bar-wrapper`} style={{width: this.state.battleData[fighter.id]?.targetId ? this.props.combatManager.getDistanceToTargetWidthString(this.state.battleData[fighter.id]) : '0px'}}>
                                        <div className={`action-bar ${(this.state.battleData[fighter.id]?.attacking) ? 'fighterHitsAnimation' : ''}`}>

                                        </div>
                                    </div>
                            </div>
                        })}
                    </div>
                </div>
                
                {/* /// MONSTERS & MINIONS */}
                <div className="mb-col right-col">
                    {/* // MONSTER // */}
                    <div className="monster-wrapper" 
                    style=
                    {{
                        top: `${this.state.battleData[this.props.monster.id]?.position * 110}px`,
                        right: `${this.state.battleData[this.props.monster.id]?.depth * 100}px`
                    }}>
                        <div className={`action-bar-wrapper}`} 
                             style={{width: this.state.battleData[this.props.monster.id]?.targetId ? this.props.combatManager.getDistanceToTargetWidthString(this.state.battleData[this.props.monster.id]) : '0px'}}>
                            <div className={`action-bar ${this.state.battleData[this.props.monster.id]?.attacking ? 'monsterHitsAnimation' : ''}`}>

                            </div>
                        </div>
                        <div className="portrait-wrapper">
                            <div 
                            className={
                                `portrait monster-portrait 
                                ${this.state.battleData[this.props.monster.id]?.active ? 'active' : ''} 
                                ${this.state.battleData[this.props.monster.id]?.dead ? 'dead monsterDeadAnimation' : ''}
                                ${this.state.battleData[this.props.monster.id]?.wounded ? 'fighterWoundedAnimation' : ''}`
                            } 
                            style={{
                                backgroundImage: "url(" + this.props.monster.portrait + ")", 
                                filter: `saturate(${((this.state.battleData[this.props.monster.id]?.hp / this.props.monster.stats.hp) * 100) / 2}) 
                                        sepia(${this.state.showCrosshair && this.state.portraitHoveredId === this.props.monster.id ? '2' : '0'})`
                            }} 
                            onMouseEnter={() => this.portraitHovered(this.props.monster.id)} 
                            onMouseLeave={() => this.portraitHovered(null)}
                            onClick={() => this.portraitClicked(this.props.monster.id)}
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

                    {/* // MINIONS // */}
                    {this.props.minions && this.props.minions.map((minion, i) => {
                        return <div key={i} className="monster-wrapper" 
                                style=
                                {{
                                    top: `${this.state.battleData[minion.id]?.position * 110}px`,
                                    right: `${this.state.battleData[minion.id]?.depth * 100}px`
                                }}>
                                    <div className={`action-bar-wrapper}`} 
                                        style={{width: this.state.battleData[minion.id]?.targetId ? this.props.combatManager.getDistanceToTargetWidthString(this.state.battleData[minion.id]) : '0px'}}>
                                        <div className={`action-bar ${this.state.battleData[minion.id]?.attacking ? 'monsterHitsAnimation' : ''}`}>
                                            {/* {minion.id} */}
                                        </div>
                                    </div>
                                    <div className="portrait-wrapper">
                                        <div 
                                        className={
                                            `portrait minion-portrait 
                                            ${this.state.battleData[minion.id]?.active ? 'active' : ''} 
                                            ${this.state.battleData[minion.id]?.dead ? 'dead monsterDeadAnimation' : ''}
                                            ${this.state.battleData[minion.id]?.wounded ? 'fighterWoundedAnimation' : ''}`
                                        } 
                                        style={{
                                            backgroundImage: "url(" + minion.portrait + ")", 
                                            filter: `saturate(${((this.state.battleData[minion.id]?.hp / minion.stats.hp) * 100) / 2}) 
                                                    sepia(${this.state.showCrosshair && this.state.portraitHoveredId === minion.id ? '2' : '0'})`
                                        }} 
                                        onMouseEnter={() => this.portraitHovered(minion.id)} 
                                        onMouseLeave={() => this.portraitHovered(null)}
                                        onClick={() => this.portraitClicked(minion.id)}
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
                    })}
                </div>

                {/* // INTERACTION PANE */}
                <div className="mb-interaction-pane">
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
                                {Object.values(this.state.battleData).filter(e=>e.isMonster || e.isMinion).map((a, i)=>{
                                return <div 
                                    key={i} 
                                    style={{backgroundImage: "url(" + a.portrait + ")", cursor: this.state.showCrosshair ? 'crosshair' : ''}} 
                                    className='interaction-tile target' 
                                    onClick={() => this.targetTileClicked(a)} 
                                    // onMouseEnter={() => this.specialTileHovered(a)} 
                                    // onMouseLeave={() => this.specialTileHovered(null)}
                                    >
                                    </div>
                                })}
                            </div>
                        </div>
                        <div className="combo-col">

                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default MonsterBattle;