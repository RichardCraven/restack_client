import React from 'react'
import {storeMeta, getMeta, getUserId} from '../utils/session-handler';
import { Route, Switch, Redirect} from "react-router-dom";
import MonsterBattle from './sub-views/MonsterBattle';


// import useScript from '../hooks/useScript.js'

// const useScriptCustom = (file) => {
//     const script = document.createElement('script');

//     script.src = file;
//     console.log('file: ', file);
//     script.type = 'type/javascript';
//     // script.async = true;
//     script.onload = () => {
//         console.log('script loaded!');
//         // this.scriptLoaded();
//     }

//     document.body.appendChild(script);
// }

const clone = (val) => {
    return JSON.parse(JSON.stringify(val))
}

class CrewManagerPage extends React.Component{
  constructor(props){
      super(props)
      this.monsterBattleComponentRef = React.createRef()
    this.state = {
        monster: null,
        minions: null,
        // dungeon: null,
        user: null,
        options: [],
        selectedCrew: [],
        selectedCrewMember: null,
        navToLanding: false,
        crewSlots: [null, null, null, null],
        advancedUser: false,
        crewSelected: false,
        shiftDown: false,
        ctrlDown: false
    }
  }
  timer = null;

  componentDidMount(){
    this.props.inventoryManager.initializeItems()
    let options = this.props.crewManager.adventurers;
    this.props.crewManager.initializeCrew(options)
    console.log('initialized crew', this.props.crewManager.crew);
    let wizard = this.props.crewManager.crew.find(e=>e.type==='wizard')
    let wizclone = clone(wizard);
    console.log('wizclone', wizclone);
    let action = {
        text: "Etch Glyph",
        type: "glyph",
        // available: true,
        subTypes: [
            {
                count: 1,
                icon_url: "/static/media/cycle.c9c8214b.png",
                type: "magic missile"
            }
        ]
    }
    this.props.crewManager.beginSpecialAction(wizard, action, action.subTypes[0])
    // wizard.specialActions.push(action)
    


    console.log('ok now ', this.props.crewManager.crew);
    let selectedCrew = [];
    // selectedCrew.push(options[0])
    // selectedCrew.push(options[1])
    // selectedCrew.push(options[2])

    selectedCrew.push(this.props.crewManager.crew.find(e=>e.type==='wizard'))
    selectedCrew.push(this.props.crewManager.crew.find(e=>e.type==='soldier'))
    // selectedCrew.push(this.props.crewManager.crew.find(e=>e.type==='rogue'))

    // selectedCrew.push(this.props.crewManager.crew.find(e=>e.type==='monk'))

    console.log('vs selected crew: ', selectedCrew);

    console.log('here we go w the load script!');
    // useScript('../assets/particles/particles.js')

    // useScriptCustom('../assets/particles/particles.js')

    // potatoe('test')

    
    // setTimeout(()=>{
    //     potato()

    // },5000)

    this.initializeListeners();
    this.setState({
        options,
        selectedCrew,
        selectedCrewMember: selectedCrew[0]
    })
  }
//   useScript('../assets/fullYear.js')


  pickRandom = (array) => {
    let index = Math.floor(Math.random() * array.length)
    return array[index]
  }
  initializeListeners = () => {
    window.addEventListener('keydown', this.combatKeyDownHandler);
    window.addEventListener('keyup', this.combatKeyUpListener)
    window.addEventListener('beforeunload', this.componentCleanup);
  }
  componentCleanup = () => {
    console.log('combat simulator cleanup');
    window.removeEventListener('keydown', this.combatKeyDownHandler)
    window.removeEventListener('keyup', this.combatKeyUpListener)
    window.removeEventListener('beforeunload', this.componentCleanup); 
  }
  getDungeonDetails = async () => {
    const user = getMeta();
  }
  singleClick = (crewMember) => {
    this.setState({
        selectedCrewMember: crewMember
    })
  }
  exitSimulator = () => {
    console.log('exit sim');
    this.componentCleanup();
    this.props.navToLanding();
    // const history = useHistory();
    // history.push('/landing')
  }
  selectCrewMember = (event, crewMember) => {
    clearTimeout(this.timer);
    if (event.detail === 1) {
        this.timer = setTimeout(this.singleClick(crewMember), 200)
    } else if (event.detail === 2) {
        let crew = this.state.selectedCrew;
        if(crew.length === 3 && !this.state.advancedUser) return
        if(!crew.includes(crewMember)) crew.push(crewMember)
        this.setState({
            selectedCrew: crew
        })
    }
    this.setState({
        selectedCrewMember: crewMember
    })

  }
  addMember = (index) => {
    let member = this.state.selectedCrewMember
    let crew = this.state.selectedCrew;
    if(!crew.includes(member)) crew.push(member)
    this.setState({
        selectedCrew: crew
    })
  }
  setMonster = (monsterString) => {
    // monsterString = 'beholder'
    // monsterString = 'djinn'
    monsterString = 'skeleton'
    let monster = this.props.monsterManager.getMonster(monsterString), 
    minions = [];
    if(monster && monster.minions){

        monster.minions = ['skeleton', 'skeleton', 'skeleton', 'skeleton'];
        // monster.minions = [];

        monster.minions.forEach((e,i)=>{
            const minion = this.props.monsterManager.getMonster(e)
            minion.id = minion.id+i+700
            let minionName = this.pickRandom(minion.monster_names)
            minion.name = minionName
            minion.inventory = [];

            minions.push(minion)
        })
    }

    // console.log('monster: ', monster);

    if(!monster) monster = this.props.monsterManager.getRandomMonster();
    let monsterName = this.pickRandom(monster.monster_names)
    monster.name = monsterName
    monster.inventory = [];
    this.setState({
        monster,
        minions
    })
}

submit = async () => {
    this.setMonster()
    this.setState({
        crewSelected: true
    })
}
clear = () => {
    const meta = getMeta();
    console.log('meta: ', meta);
    meta.crew = [];
    storeMeta(meta);
    this.setState({
        selectedCrew: []
    })
}
goBack = () => {
    this.setState({
        navToLanding: true
    })
}
useConsumableFromInventory = (item) => {
    let foundItem = this.props.inventoryManager.inventory.find(e=> e.name === item.name),
    foundIndex = this.props.inventoryManager.inventory.findIndex(e=> e.name === item.name);
    foundItem.animation = 'consumed';
    this.forceUpdate();
    setTimeout(()=>{
        foundItem.animation = '';
        this.props.inventoryManager.removeItemByIndex(foundIndex)
    }, 500)
}
combatKeyDownHandler = (event) => {
    let key = event.key, code = event.code;
    if(code === 'Space'){
        if(this.monsterBattleComponentRef.current) this.monsterBattleComponentRef.current.manualFire();
    }
    switch(key){
        case 'p':
            let paused = !this.state.paused;
            this.props.combatManager.pauseCombat(paused)
            this.setState({
                paused
            })
        break;
        case 'q':
            if(this.monsterBattleComponentRef.current) this.monsterBattleComponentRef.current.selectSpecial();
        break;
        case 'w':
            if(this.monsterBattleComponentRef.current) this.monsterBattleComponentRef.current.selectConsumableSpecial();
        break;
        case 'Tab':
            event.preventDefault();
            if(this.state.shiftDown){
                if(this.monsterBattleComponentRef.current) this.monsterBattleComponentRef.current.tabToRetarget();
            } else if(this.state.ctrlDown){
                console.log('YEEEEEEE');
            } else {
                if(this.monsterBattleComponentRef.current) this.monsterBattleComponentRef.current.tabToFighter();
            }
        break;
        case 'Control':
            event.preventDefault();
            this.setState({ ctrlDown: true })
        break;
        case 'Shift':
            event.preventDefault();
            this.setState({ shiftDown: true })
        break;
        case 'ArrowUp':
            if(this.state.selectedCrewMember) this.props.combatManager.moveFighterOneSpace('up');
        break;
        case 'ArrowDown':
            if(this.state.selectedCrewMember) this.props.combatManager.moveFighterOneSpace('down');
        break;
        case 'ArrowLeft':
            if(this.state.selectedCrewMember) this.props.combatManager.moveFighterOneSpace('left');
        break;
        case 'ArrowRight':
            if(this.state.selectedCrewMember) this.props.combatManager.moveFighterOneSpace('right');
        break;
        default:
            // nuttin
        break;
    }
}
combatKeyUpListener = (event) => {
    let key = event.key, code = event.code;
    switch(key){
        case 'Shift':
            this.setState({
                shiftDown: false
            })
        break;
        case 'Control':
            this.setState({
                ctrlDown: false
            })
        break;
        case 'q':
            if(this.state.specialDown){
                // cycle specials
                console.log('CYCLE SPECIALS');
            }
            this.setState({
                specialDown: false
            })
        break;
    }
}
  render(){
    return (
    <div className="page-container">

        {!this.state.crewSelected && <div className="crew-manager">
            { this.state.navToLanding && <Redirect to='/'/> }
            <div className="content-container">
                <div className="button-row-top">
                    <button onClick={() => this.submit()}>Back</button>
                </div>
                <div className="title">Choose your crew</div>
                <div className="crew-selector">
                    <div className="crew-options">
                        {this.state.options.map((e,i)=> {
                            return <div className='portrait' key={i}
                            style={{backgroundImage: "url(" + e.portrait + ")"}}
                            onClick={(event) => this.selectCrewMember(event, e)}
                            ></div>
                            }
                        )}
                    </div>
                    <div className="member-panel">
                        {this.state.selectedCrewMember && <div className='giant-portrait' 
                        style={{backgroundImage: "url(" + this.state.selectedCrewMember.portrait + ")"}}>
                            <div className="name">{this.state.selectedCrewMember.name}</div>
                        </div>}
                        {this.state.selectedCrewMember && <div className="details-pane">
                            <div className="description">
                                {this.state.selectedCrewMember.description}
                            </div>
                        </div>}
                        {this.state.selectedCrewMember && <div className="stats-pane">
                            <div className="stat">Strength: {this.state.selectedCrewMember.stats.str}</div>
                            <div className="stat">Dexterity: {this.state.selectedCrewMember.stats.dex}</div>
                            <div className="stat">Intelligence: {this.state.selectedCrewMember.stats.int}</div>
                            <div className="stat">Vitality: {this.state.selectedCrewMember.stats.vit}</div>
                            <div className="stat">Fortitude: {this.state.selectedCrewMember.stats.fort}</div>
                        </div>}
                        {this.state.selectedCrewMember && <div className="abilities-pane">
                            <div className="attacks">Attacks: &nbsp;
                                {this.state.selectedCrewMember.attacks.map((e,i)=> {
                                    return <div key={i}>{ e }{i !== this.state.selectedCrewMember.attacks.length-1 ?  ',' : ''} &nbsp; </div>
                                })}
                            </div>
                            <div className="specials">Specials: &nbsp;
                                {this.state.selectedCrewMember.specials.map((e,i)=> {
                                    return <div key={i}>{ e }{i !== this.state.selectedCrewMember.specials.length-1 ?  ',' : ''} &nbsp; </div>
                                })}
                            </div>
                            <div className="passives">Passives: &nbsp;
                                {this.state.selectedCrewMember.passives.map((e,i)=> {
                                    return <div key={i}>{ e }{i !== this.state.selectedCrewMember.passives.length-1 ?  ',' : ''} &nbsp; </div>
                                })}
                            </div>
                            <div className="weaknesses">Weaknesses: &nbsp;
                                {this.state.selectedCrewMember.weaknesses.map((e,i)=> {
                                    return <div key={i}>{ e }{i !== this.state.selectedCrewMember.weaknesses.length-1 ?  ',' : ''} &nbsp; </div>
                                })}
                            </div>
                        </div>}
                    </div>
                    <div className="crew-tray">
                        {this.state.crewSlots.map((slot, i)=>{
                    return  <div key={i} className={`selected-crew-portrait-container ${i === 3 && !this.state.advancedUser ? 'closed' : ''}`}>

                                {(i === 3 && !this.state.advancedUser) === false && <div className={`add-button ${!this.state.selectedCrewMember ? 'disabled' : ''}`} onClick={()=>this.addMember(i)}>&oplus;</div>}

                                {this.state.selectedCrew[i] && <div className="portrait" style={{backgroundImage: "url(" + this.state.selectedCrew[i].portrait + ")"}}></div>}
                            </div>
                        })}
                    </div>
                </div>
                <div className="button-row-bottom-left">
                    <button onClick={() => this.clear()}>Clear</button>
                </div>
                <div className="button-row">
                    <button onClick={() => this.submit()}>Submit</button>
                </div>
            </div>
        </div>}

        {this.state.crewSelected && <div>   
            <MonsterBattle
                isSimulation={true}
                exitSimulator={this.exitSimulator}
                ref={this.monsterBattleComponentRef}
                overlayManager={this.props.overlayManager}
                combatManager={this.props.combatManager || null}
                inventoryManager={this.props.inventoryManager}
                animationManager={this.props.animationManager}
                crewManager={this.props.crewManager || null}
                crew={this.state.selectedCrew|| null}
                monster={this.state.monster || null}
                minions={this.state.minions || null}
                battleOver={this.battleOver || null}
                paused={this.state.paused || null}
                setNarrativeSequence={this.props.setNarrativeSequence || null}
                useConsumableFromInventory={this.useConsumableFromInventory || null}
            ></MonsterBattle> 
        </div>}
    </div>
    )
  }
}

export default CrewManagerPage;