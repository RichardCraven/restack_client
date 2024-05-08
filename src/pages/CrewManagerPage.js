import React from 'react'
import { Redirect } from "react-router-dom";
import {storeMeta, getMeta, getUserId} from '../utils/session-handler';
import {
//   loadAllDungeonsRequest,
//   loadDungeonRequest,
//   updateDungeonRequest,
  updateUserRequest,
//   addDungeonRequest
} from '../utils/api-handler';
class CrewManagerPage extends React.Component{
  constructor(props){
    super(props)
    this.state = {
        // dungeon: null,
        user: null,
        options: [],
        selectedCrew: [],
        selectedCrewMember: null,
        navToLanding: false,
        crewSlots: [null, null, null, null],
        advancedUser: false
    }
  }

    timer = null

    // onClickHandler = event => {
    //     clearTimeout(this.timer);

    //     if (event.detail === 1) {
    //         this.timer = setTimeout(this.props.onClick, 200)
    //     } else if (event.detail === 2) {
    //         console.log('double click!');
    //         // this.props.onDoubleClick()
    //     }
    // }

  componentDidMount(){
    console.log('crew manager component mounted props:', this)
    // const userData = getMeta();
    
    // this.getDungeonDetails();
    console.log('this.props:', this.props)
    let options = this.props.crewManager.adventurers;
    console.log('options:', options);
    const meta = getMeta();
    let selectedCrew = [];
    console.log('meta: ', meta);
    if(meta && meta.crew && meta.crew.length){
        meta.crew.forEach((e,i)=>selectedCrew[i] = e)
    }
    this.setState({
        options,
        selectedCrew,
        selectedCrewMember: selectedCrew[0]
    })
  }

  getDungeonDetails = async () => {
    const user = getMeta();
    // user.name = 'Henry'
    console.log('user:', user)
    
    // if(!user.dungeonId){
    //   this.setState({
    //     user,
    //     dungeon: null
    //   })
    // } else {
    //   const res = await loadDungeonRequest(user.dungeonId)
    //   console.log('res:', res)
    //   const dungeon = JSON.parse(res.data[0].content)
    //   console.log('dungeon:', dungeon)
    //   this.setState({
    //     user,
    //     dungeon
    //   })
    // }
  }
  singleClick = (crewMember) => {
    this.setState({
        selectedCrewMember: crewMember
    })
  }
  selectCrewMember = (event, crewMember) => {
    clearTimeout(this.timer);
    if (event.detail === 1) {
        this.timer = setTimeout(this.singleClick(crewMember), 200)
    } else if (event.detail === 2) {
        let crew = this.state.selectedCrew;
        console.log('double click!', crewMember);
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
//   clearDungeon = () => {
//     console.log('clearing dungeon')
//     if(this.state.dungeon){
//       let user = getMeta();
//       user.dungeonId = null;
//       storeMeta(user);
//       setTimeout(()=>{
//         this.getDungeonDetails();
//       })
//     }
//   }
submit = async () => {
    const meta = getMeta();
    meta.crew = this.state.selectedCrew.filter(e=> e !== null)
    await updateUserRequest(getUserId(), meta)
    console.log('updated meta: ', meta);
    // if(meta.dungeonId){
    //     console.log('wtf');
    //     debugger
    // }
    // return
    storeMeta(meta)
    this.goBack()
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
  render(){
    return (
    <div className="crew-manager">
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
                        {/* <div className="add-button" onClick={()=>this.addMember()}>+</div> */}
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
                    {/* <div className="button-container">
                        <button>+</button>
                    </div> */}
                </div>
                <div className="crew-tray">
                    {this.state.crewSlots.map((slot, i)=>{
                return  <div key={i} className={`selected-crew-portrait-container ${i === 3 && !this.state.advancedUser ? 'closed' : ''}`}>

                            {(i === 3 && !this.state.advancedUser) === false && <div className={`add-button ${!this.state.selectedCrewMember ? 'disabled' : ''}`} onClick={()=>this.addMember(i)}>&oplus;</div>}

                            {this.state.selectedCrew[i] && <div className="portrait" style={{backgroundImage: "url(" + this.state.selectedCrew[i].portrait + ")"}}></div>}
                        </div>
                    })}
                    {/* <div className="selected-crew-portrait-container">
                        <div className="add-button" onClick={()=>this.addMember()}>+</div>
                    </div>
                    <div className="selected-crew-portrait-container">
                        
                    </div>
                    <div className="selected-crew-portrait-container">
                        
                    </div>
                    <div className="selected-crew-portrait-container closed">
                        
                    </div> */}

                    {/* {this.state.selectedCrew.map((e, i)=> {
                        return <div key={i} 
                        className={`selected-crew-portrait-wrapper ${i > 2 ? ' locked ' : ''}`}
                        >
                            {e !== null && <div className="portrait" style={{backgroundImage: "url(" + e.portrait + ")"}}></div>}
                        </div>
                        }
                    )} */}

                </div>
            </div>
            <div className="button-row-bottom-left">
                <button onClick={() => this.clear()}>Clear</button>
            </div>
            <div className="button-row">
                <button onClick={() => this.submit()}>Submit</button>
            </div>
        </div>
    </div>
    )
  }
}

export default CrewManagerPage;