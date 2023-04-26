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
            currentActor: '',
            attackType: '',
            target: null
        }
    }
    componentDidMount(){
        const crewLeader = this.props.crew.find(e=>e.leader)
        this.establishMessageCallback();
        this.establishUpdateMatrixCallback();
        this.establishUpdateActorCallback();
        this.props.combatManager.initializeCombat({
            crew: this.props.crew,
            leader: this.getCrewLeader(),
            monster: this.props.monster
        })
    }

    getCrewLeader = () => {
        return this.props.crew.find(e=>e.leader)
    }

    setMessage = (messageData) => {
        const {message, source} = messageData;
        this.setState({
            message,
            source
        })
    }
    updateCurrentActor = (data) => {
        const {actor, attackType, target} = data;
        console.log('actor: ', actor)
        this.setState({
            currentActor: actor,
            attackType,
            target
        })
        setTimeout(()=>{
            console.log('current actor type',this.state.currentActor.type, 'vs fighter type: ', this.props.crew.find(e=>e.type === this.state.currentActor.type))
        })
    }
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
    establishUpdateActorCallback = () => {
        this.props.combatManager.establishUpdateActorCallback(this.updateCurrentActor)
    }
    establishUpdateMatrixCallback = () => {
        this.props.combatManager.establishUpdateMatrixCallback(this.updateIndicatorsMatrix)
    }
    establishMessageCallback = () => {
        this.props.combatManager.establishMessageCallback(this.setMessage)
    }

    render(){
        return (
            <div className="mb-board">
                <div className="mb-col left-col">
                    <div className="leader-wrapper">
                        <div className={`fighter-portrait leader ${this.state.currentActor.type === this.getCrewLeader().type ? 'active' : ''}`} style={{backgroundImage: "url(" + images[this.getCrewLeader().portrait] + ")"}}></div>
                        <div className="leader-hp-bar">
                            <div className="red-fill" style={{width: `${(this.state.indicatorsMatrix[this.getCrewLeader().type]?.hp / this.getCrewLeader().stats.hp) * 100}%`}}></div>
                        </div>
                        <div className="leader-energy-bar"></div>
                    </div>
                    
                    <div className="fighter-content">
                        {this.props.crew.filter(e=>!e.leader).map((fighter, i) => {
                           return <div key={i} className='fighter-wrapper'>
                                    <div className={`fighter-portrait ${this.state.currentActor.type === fighter.type ? 'active' : ''}`} style={{backgroundImage: "url(" + images[fighter.portrait] + ")"}}></div>
                                    <div className="fighter-hp-bar">
                                        <div className="red-fill" style={{width: `${(this.state.indicatorsMatrix[fighter.type]?.hp / fighter.stats.hp) * 100}%`}}></div>
                                    </div>
                                    <div className="fighter-energy-bar"></div>
                                </div>
                        })}
                    </div>
                </div>
                <div className="center-board">
                    <div className={`top-section ${this.state.source ? this.state.source+'-action' : ''} `}>
                        <div className="greeting-text"> 
                            {this.state.message} 
                        </div>
                        {(this.state.currentActor.type === this.getCrewLeader().type || this.state.target?.type === this.getCrewLeader().type) && <div className={`action-text ${this.state.currentActor.isMonster ? 'monster-source' : 'fighter-source'}`}>
                            {this.state.attackType}
                        </div>}
                        <div className={`
                        action-color-band 
                        ${this.state.currentActor.type === this.getCrewLeader().type ? 'fighterHitsAnimation' : ''}
                        ${(this.state.target?.type === this.getCrewLeader().type) ? 'monsterHitsAnimation' : ''}
                        `}></div>
                        {/* <div className="message">{this.state.message}</div> */}
                    </div>
                    <div className="bottom-section">
                        {this.props.crew.filter(e=>!e.leader).map((fighter, i) => {
                           return <div key={i} className={`row `}>
                                        {(this.state.currentActor.type === fighter.type || this.state.target?.type === fighter.type) && <div className='row-wrapper'>
                                            <div className={`action-text ${this.state.currentActor.isMonster ? 'monster-source' : 'fighter-source'}`}>
                                                {this.state.attackType}
                                            </div>
                                            <div className={`
                                            action-color-band 
                                            ${this.state.currentActor.type === fighter.type ? 'fighterHitsAnimation' : ''}
                                            ${this.state.currentActor.type === this.props.monster.type ? 'monsterHitsAnimation' : ''}
                                            `}></div>
                                        </div>}
                                </div>
                        })}
                    </div>
                </div>
                <div className="mb-col right-col">
                    <div className={`monster-portrait ${this.state.currentActor.type === this.props.monster.type ? 'active' : ''}`} style={{backgroundImage: "url(" + this.props.monster.portrait + ")"}}></div>
                    <div className="monster-hp-bar">
                        <div className="red-fill" style={{width: `${(this.state.indicatorsMatrix[this.props.monster.type]?.hp / this.props.combatManager.monsterHp) * 100}%`}}></div>
                    </div>
                    <div className="monster-energy-bar"></div>
                    <div className="monster-content">

                    </div>
                </div>
            </div>
        )
    }
}

export default MonsterBattle;