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
            // currentActor: '',
            attackType: '',
            target: null,
            battleData: {},
            catcher: null
        }
    }
    componentDidMount(){
        this.props.combatManager.initialize();
        const crewLeader = this.props.crew.find(e=>e.isLeader)
        this.establishMessageCallback();
        this.establishUpdateMatrixCallback();
        this.establishUpdateActorCallback();
        this.establishUpdateDataCallback();
        this.establishGameOverCallback();
        this.props.combatManager.initializeCombat({
            crew: this.props.crew,
            leader: this.getCrewLeader(),
            monster: this.props.monster
        })
    }

    simulateAttack = (id) => {
        this.props.combatManager.initiateAttack(id)



        // console.log('simulateAttack', id)
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
        let targetId = this.state.battleData[id].nextTargetId,
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

    render(){
        return (
            <div className="mb-board">
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
                                        className={`portrait fighter-portrait ${fighter.isLeader ? 'leader-portrait' : ''} ${this.state.battleData[fighter.id]?.dead ? 'dead fighterDeadAnimation' : ''} ${this.state.battleData[fighter.id]?.active ? 'active' : ''}`} 
                                        style={{backgroundImage: "url(" + images[fighter.portrait] + ")", filter: `saturate(${(this.state.battleData[fighter.id]?.hp / fighter.stats.hp) * 100})`}} 
                                        onClick={() => this.simulateAttack(fighter.id)}></div>
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
                                    <div className={`action-bar-wrapper ${this.state.battleData[fighter.id]?.wounded ? 'fighterWoundedAnimation' : ''}`} style={{width: this.state.battleData[fighter.id]?.distanceToTarget}}>
                                        <div className={`action-bar ${(this.state.battleData[fighter.id]?.attacking) ? 'fighterHitsAnimation' : ''}`}>

                                        </div>
                                    </div>
                            </div>
                        })}
                    </div>
                </div>
                
                {/* /// MONSTERS */}
                <div className="mb-col right-col">
                    <div className="monster-wrapper" 
                    style=
                    {{
                        top: `${this.state.battleData[this.props.monster.id]?.position * 110}px`,
                        right: `${this.state.battleData[this.props.monster.id]?.depth * 100}px`
                    }}>
                        <div className={`action-bar-wrapper ${this.state.battleData[this.props.monster.id]?.wounded ? 'monsterWoundedAnimation' : ''}`} style={{width: this.state.battleData[this.props.monster.id]?.distanceToTarget}}>
                            <div className={`action-bar ${this.state.battleData[this.props.monster.id]?.attacking ? 'monsterHitsAnimation' : ''}`}>

                            </div>
                        </div>
                        <div className="portrait-wrapper">
                            <div className={`portrait monster-portrait ${this.state.battleData[this.props.monster.id]?.active ? 'active' : ''} ${this.state.battleData[this.props.monster.id]?.dead ? 'dead monsterDeadAnimation' : ''}`} style={{backgroundImage: "url(" + this.props.monster.portrait + ")", filter: `saturate(${(this.state.battleData[this.props.monster.id]?.hp / this.props.monster.stats.hp) * 100})`}}></div>
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
            </div>
        )
    }
}

export default MonsterBattle;