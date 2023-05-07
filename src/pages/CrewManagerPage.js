import React from 'react'
import * as images from '../utils/images'
import {storeMeta, getMeta, getUserId, getUserName} from '../utils/session-handler';
// import {
//   loadAllDungeonsRequest,
//   loadDungeonRequest,
//   updateDungeonRequest,
//   updateUserRequest,
//   addDungeonRequest
// } from '../utils/api-handler';
class CrewManagerPage extends React.Component{
  constructor(props){
    super(props)
    this.state = {
        // dungeon: null,
        user: null,
        options: [],
        selectedCrew: [],
        selectedCrewMember: null
    }
  }

  componentWillMount(){
    console.log('crew manager component mounted props:', this)
    // const userData = getMeta();
    
    // this.getDungeonDetails();
    let options = [
                {
                    image: 'wizard', 
                    type: 'wizard',
                    name: 'Pendicus',
                    level: 1,
                    id: 33344,
                    stats: {
                        str: 3,
                        int: 7,
                        dex: 5,
                        vit: 4,
                        fort: 7,
                        hp:10,
                        atk:12,
                        energy: 0
                    }, 
                    portrait: 'wizard_portrait',
                    inventory: [],
                    specials: ['ice blast'],
                    attacks: ['magic missile'],
                    passives: ['magic affinity'],
                    weaknesses: ['ice', 'fire', 'electric', 'blood-magic'],
                    description: "Hailing from the magister's college, Pendicus was the dean of transmutation. A powerful magic user, he has been known to linger for long periods in the silent realm, searching for secret truths."
                },
                {
                    image: 'soldier', 
                    type: 'soldier',
                    name: 'Greco',
                    id: 123,
                    level: 1,
                    stats: {
                        str: 7,
                        int: 5,
                        dex: 5,
                        vit: 4,
                        fort: 7,
                        hp: 15,
                        atk: 8,
                        energy: 0
                    }, 
                    isLeader: true,
                    portrait: 'soldier_portrait',
                    inventory: [],
                    passives: ['inspiring force'],
                    specials: ['shield-wall'],
                    attacks: ['sword-swing', 'sword-thrust', 'shield-bash'],
                    weaknesses: ['ice', 'electric', 'blood-magic'],
                    description: "Once the captain of the royal army's legendary vangard battalion, Greco has a reputation for fair leadership and honor."
                },
                {
                    image: 'monk', 
                    type: 'monk',
                    name: 'Yu',
                    level: 1,
                    id: 8080,
                    stats: {
                        str: 5,
                        int: 6,
                        dex: 9,
                        vit: 4,
                        fort: 7,
                        hp: 13,
                        atk: 6,
                        energy: 0
                    }, 
                    portrait: 'monk_portrait',
                    inventory: [],
                    passives: ['diamond skin'],
                    specials: ['invisibility'],
                    attacks: ['meditate', 'dragon punch', 'flying lotus'],
                    weaknesses: ['fire', 'electric', 'ice', 'blood-magic', 'crushing'],
                    description: "Yu was born into the dynastic order of the White Serpent, inheriting the secrets of absolute stillness and unyielding motion"
                },
                {
                    image: 'sage', 
                    type: 'sage',
                    name: 'Loryastes',
                    level: 1,
                    id: 456,
                    stats: {
                        str: 3,
                        int: 7,
                        dex: 3,
                        vit: 4,
                        fort: 7,
                        hp: 9,
                        atk: 4,
                        energy: 0
                    }, 
                    portrait: 'sage_portrait',
                    inventory: [],
                    specials: ['healing-hymn', 'reveal-weakness'],
                    attacks: ['meditate', 'cane-strike'],
                    passives: ["owl's insight"],
                    weaknesses: ['fire', 'electric', 'ice', 'blood-magic', 'crushing'],
                    description: "Loryastes is the headmaster of Citadel library, chronicled the histories of three monarchies, and a pupil of The Great Scribe"
                },
                {
                    image: 'rogue', 
                    type: 'rogue',
                    name: 'Tyra',
                    level: 1,
                    id: 789,
                    stats: {
                        str: 5,
                        int: 5,
                        dex: 8,
                        vit: 6,
                        fort: 3,
                        hp: 12,
                        atk: 6,
                        energy: 0
                    }, 
                    portrait: 'rogue_portrait',
                    inventory: [],
                    specials: ['deadeye-shot'],
                    attacks: ['fire-arrow', 'sword-thrust'],
                    passives: ['nimble-dodge'],
                    weaknesses: ['ice', 'curse', 'crushing'],
                    description: "Tyra was born a slave, surviving and advancing through sheer cunning and a ruthless will"
                },
                {
                    image: 'barbarian', 
                    type: 'barbarian',
                    name: 'Ulaf',
                    level: 1,
                    id: 8822,
                    stats: {
                        str: 8,
                        int: 3,
                        dex: 4,
                        vit: 6,
                        fort: 6,
                        hp: 16,
                        atk: 9,
                        energy: 0
                    }, 
                    portrait: 'barbarian_portrait',
                    inventory: [],
                    specials: ['berserker-rage'],
                    attacks: ['axe throw', 'axe swing', 'spear throw'],
                    passives: ['fury'],
                    weaknesses: ['ice', 'curse', 'psionic'],
                    description: "Ulaf is the son of the chieftan of the Rootsnarl Clan. He is on a journey to prove his mettle and one day take his father's place"
                },
            ]
            // style={{backgroundImage: "url(" + images[fighter.portrait] + ")"
        let selectedCrew = [null, null, null, null, null]
    this.setState({
        options,
        selectedCrew
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
  selectCrewMember = (e) => {
    console.log('select crew memeber: ', e)

    this.setState({
        selectedCrewMember: e
    })

  }
  addMember = () => {
    let m = this.state.selectedCrewMember
    let a = this.state.selectedCrew
    let idx  = a.findIndex((e, i)=> e === null && i < 3)
    console.log(m, a, idx)
    if(idx !== -1){
        console.log('idx: ', idx)
        a[idx] = m
    }
    this.setState({
        selectedCrew: a
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
submit = () => {
    console.log('meta: ', getMeta())
    const meta = getMeta();
    meta.crew = this.state.selectedCrew.filter(e=> e !== null)
    console.log('storing', meta)
    storeMeta(meta)
}
  render(){
    return (
      <div className="crewManager">
        {/* { navToUserProfile && <Redirect to='/userProfilePage'/> }
        { navToShop && <Redirect to='/shop'/> }
        { navToPortal && <Redirect to='/mapmaker'/> }
        { navToDungeon && <Redirect to='/dungeon'/> }
        { navToUsermanager && <Redirect to='/usermanager'/> } */}
        <div className="content-container">
          <div className="title">Choose your crew</div>
          <div className="crew-selector">
            <div className="crew-options">
                {this.state.options.map((e,i)=> {
                    return <div className='portrait' key={i}
                    style={{backgroundImage: "url(" + images[e.portrait] + ")"}}
                    onClick={() => this.selectCrewMember(e)}
                    ></div>
                    }
                )}
            </div>
            <div className="member-panel">
                {this.state.selectedCrewMember && <div className='giant-portrait' 
                style={{backgroundImage: "url(" + images[this.state.selectedCrewMember.portrait] + ")"}}>
                    <div className="add-button" onClick={()=>this.addMember()}>+</div>
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
                {this.state.selectedCrew.map((e, i)=> {
                    return <div key={i} 
                    className={`selected-crew-portrait-wrapper ${i > 2 ? ' locked ' : ''}`}
                    >
                        {e !== null && <div className="portrait" style={{backgroundImage: "url(" + images[e.portrait] + ")"}}></div>}
                    </div>
                    }
                )}
            </div>
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