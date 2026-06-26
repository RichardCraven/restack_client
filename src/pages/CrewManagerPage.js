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
import { InventoryManager } from '../utils/inventory-manager';

const WEAKNESS_SYMBOLS = {
    holy: '☀️',
    fire: '🔥',
    ice: '❄️',
    electricity: '⚡',
    arcane: '🔮',
    psionic: '🧠',
    physical: '🛡️',
    crushing: '🔨',
    cutting: '⚔️',
    blood_magic: '🩸',
    curse: '💀'
};

const showWeaknessPopup = (type, label) => {
    const existing = document.getElementById('weakness-popup');
    if (existing) existing.remove();
    const existingOverlay = document.getElementById('weakness-popup-overlay');
    if (existingOverlay) existingOverlay.remove();

    const definitions = {
        fire: 'Deals fire damage and can burn targets, causing damage over time.',
        ice: 'Deals cold damage and slows down movement and action speeds.',
        electricity: 'Deals lightning damage, with potential to chain to nearby units.',
        arcane: 'Pure magical energy that bypasses standard physical armor.',
        psionic: 'Attacks the target\'s mind, triggering mental debuffs or bypassing physical defenses.',
        holy: 'Sacred energy that is highly effective against undead, demons, and aberrations.',
        physical: 'Standard physical damage from weapons, heavily reduced by armor.',
        crushing: 'Heavy blunt force that damages stamina and has a high chance to stun.',
        cutting: 'Sharp physical damage that can cause targets to bleed over time.',
        blood_magic: 'Dark magic that drains the target\'s health to heal the caster.',
        curse: 'Malevolent magic that reduces target statistics or infects them with debuffs.'
    };

    const desc = definitions[type.toLowerCase().replace('-', '_')] || 'A damage type that this unit is vulnerable to, taking increased damage.';

    const popup = document.createElement('div');
    popup.id = 'weakness-popup';
    popup.style.position = 'fixed';
    popup.style.left = '50%';
    popup.style.top = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.zIndex = '999999';
    popup.style.background = '#18181b';
    popup.style.color = '#fff';
    popup.style.padding = '20px';
    popup.style.borderRadius = '12px';
    popup.style.border = '1px solid #c084fc';
    popup.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(192, 132, 252, 0.2)';
    popup.style.maxWidth = '300px';
    popup.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";
    popup.style.textAlign = 'center';

    popup.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 8px;">${WEAKNESS_SYMBOLS[type.toLowerCase().replace('-', '_')] || '❓'}</div>
        <div style="font-weight: 700; font-size: 18px; color: #c084fc; margin-bottom: 8px;">${label}</div>
        <div style="font-size: 14px; color: #d4d4d8; line-height: 1.5; margin-bottom: 16px;">${desc}</div>
        <button id="close-weakness-popup" style="background: #c084fc; color: #18181b; border: none; padding: 6px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s;">Close</button>
    `;

    document.body.appendChild(popup);

    const overlay = document.createElement('div');
    overlay.id = 'weakness-popup-overlay';
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.zIndex = '999998';
    overlay.style.background = 'rgba(0, 0, 0, 0.6)';
    overlay.style.backdropFilter = 'blur(2px)';
    document.body.appendChild(overlay);

    const closePopup = () => {
        popup.remove();
        overlay.remove();
    };

    document.getElementById('close-weakness-popup').onclick = closePopup;
    overlay.onclick = closePopup;
};

const renderWeaknessSymbols = (weaknesses) => {
    if (!weaknesses || !Array.isArray(weaknesses)) return null;
    return weaknesses.map((w, idx) => {
        const type = typeof w === 'object' && w !== null ? (w.id || w.name || '') : w;
        const normalized = type.toLowerCase().replace('-', '_');
        const symbol = WEAKNESS_SYMBOLS[normalized] || WEAKNESS_SYMBOLS[type] || '❓';
        const label = type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        return (
            <span 
                key={idx} 
                title={label} 
                onClick={() => showWeaknessPopup(type, label)}
                style={{ 
                    marginRight: '6px', 
                    fontSize: '1.2em', 
                    cursor: 'pointer', 
                    display: 'inline-block' 
                }}
            >
                {symbol}
            </span>
        );
    });
};

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
    // ...existing code...
    //         // this.props.onDoubleClick()
    //     }
    // }

  componentDidMount(){
    window.addEventListener('keydown', this.handleKeyDown);
    let options = this.props.crewManager.adventurers;
    const meta = getMeta();
    let selectedCrew = [];
    if(meta && meta.crew && meta.crew.length){
        // Re-hydrate portrait from the live adventurers list so stale sessionStorage
        // URLs (from a previous webpack build) don't cause blank portraits in the tray.
        const adventurers = this.props.crewManager.adventurers || [];
        meta.crew.forEach((e,i) => {
            const template = adventurers.find(a =>
                (a.id && a.id === e.id) ||
                (a.image && a.image === (e.image || e.type)) ||
                (a.type && a.type === (e.type || e.image))
            );
            if (template) e.portrait = template.portrait;
            selectedCrew[i] = e;
        });
    }
    this.setState({
        options,
        selectedCrew,
        selectedCrewMember: selectedCrew[0]
    })
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.keyCode === 13) {
      event.preventDefault();
      this.submit();
    }
  }

  getDungeonDetails = async () => {
    // const user = getMeta();
    // user.name = 'Henry'
    // ...existing code...
    
    // if(!user.dungeonId){
    //   this.setState({
    //     user,
    //     dungeon: null
    //   })
    // } else {
    //   const res = await loadDungeonRequest(user.dungeonId)
    // ...existing code...
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
    let selectedCrew = this.state.selectedCrew.filter(e=> e !== null);

    // Provide starting items
    const im = new InventoryManager();
    im.initializeItems();
    const allItems = im.allItems || {};

    selectedCrew.forEach(member => {
        if (!member.inventory) member.inventory = [];
        if (member.inventory.length === 0) {
            let itemKey = null;
            const isBow = (k, item) => k.endsWith('_bow') || k === 'merklins_peacekeeper' || item.range === 'far';
            
            if (member.type === 'soldier' || member.type === 'barbarian') {
                // Melee Fighter: swords/axes (no bows) and helms/shields
                const pool = Object.keys(allItems).filter(k => {
                    const item = allItems[k];
                    if (!item || item.tier !== 1) return false;
                    const isMartialWeapon = item.type === 'weapon' && !isBow(k, item);
                    const isMartialArmor = item.type === 'armor' && (item.subtype === 'shield' || item.subtype === 'helm');
                    return isMartialWeapon || isMartialArmor;
                });
                if (pool.length) itemKey = pool[Math.floor(Math.random() * pool.length)];
            } else if (member.type === 'ranger') {
                // Ranger Fighter: bows only and helms/shields
                const pool = Object.keys(allItems).filter(k => {
                    const item = allItems[k];
                    if (!item || item.tier !== 1) return false;
                    const isRangerWeapon = item.type === 'weapon' && isBow(k, item);
                    const isMartialArmor = item.type === 'armor' && (item.subtype === 'shield' || item.subtype === 'helm');
                    return isRangerWeapon || isMartialArmor;
                });
                if (pool.length) itemKey = pool[Math.floor(Math.random() * pool.length)];
            } else if (['sage', 'wizard', 'monk', 'summoner', 'engineer'].includes(member.type)) {
                // Non-martial: amulets, masks, tabards, boots
                const pool = Object.keys(allItems).filter(k => {
                    const item = allItems[k];
                    if (!item || item.tier !== 1) return false;
                    return ['amulet', 'mask', 'tabard', 'boots'].includes(item.subtype);
                });
                if (pool.length) itemKey = pool[Math.floor(Math.random() * pool.length)];
            }

            if (itemKey && allItems[itemKey]) {
                const item = JSON.parse(JSON.stringify(allItems[itemKey]));
                item.equippedBy = member.id;
                
                // Determine accurate equippedSlot
                if (item.type === 'weapon') {
                    item.equippedSlot = 'right';
                } else if (item.subtype === 'shield') {
                    item.equippedSlot = 'left';
                } else if (item.subtype === 'helm' || item.subtype === 'mask') {
                    item.equippedSlot = 'head';
                } else if (item.subtype === 'tabard') {
                    item.equippedSlot = 'chest';
                } else if (item.subtype === 'boots') {
                    item.equippedSlot = 'boots';
                } else if (item.subtype === 'amulet' || item.subtype === 'charm') {
                    item.equippedSlot = 'ancillary-left';
                } else {
                    item.equippedSlot = 'right'; // fallback
                }
                
                member.inventory.push(item);
            }
        }
    });

    meta.crew = selectedCrew;
    await updateUserRequest(getUserId(), meta);
    storeMeta(meta);
    this.goBack();
}
clear = () => {
    const meta = getMeta();
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
                        const isSelected = this.state.selectedCrewMember && (
                            this.state.selectedCrewMember.id === e.id || this.state.selectedCrewMember.name === e.name
                        );
                        return <div className={`portrait${isSelected ? ' selected' : ''}`} key={i}
                        style={{backgroundImage: "url(" + e.portrait + ")"}}
                        onClick={(event) => this.selectCrewMember(event, e)}
                        ></div>
                        }
                    )}
                </div>
                <div className="member-panel">
                                        {this.state.selectedCrewMember &&
                                            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 15}}>
                                                <div
                                                    className="giant-portrait"
                                                    style={{
                                                        backgroundImage: "url(" + this.state.selectedCrewMember.portrait + ")",
                                                        ...(this.state.selectedCrewMember.name === 'Sardonis' ? {
                                                            backgroundSize: '90% 90%',
                                                            backgroundPosition: 'center'
                                                        } : {
                                                            backgroundSize: '100% 100%',
                                                            backgroundPosition: 'center'
                                                        }),
                                                        backgroundRepeat: 'no-repeat'
                                                    }}
                                                >
                                                        {/* <div className="add-button" onClick={()=>this.addMember()}>+</div> */}
                                                </div>
                                            </div>
                                        }
                    {this.state.selectedCrewMember && <div className="details-pane">
                        <div className="member-name">{this.state.selectedCrewMember.name}</div>
                        <div className="description">
                            {this.state.selectedCrewMember.description}
                        </div>
                    </div>}
                    {this.state.selectedCrewMember && <div className="stats-pane">
                        <div className="stat">Strength: {this.state.selectedCrewMember.stats?.str}</div>
                        <div className="stat">Dexterity: {this.state.selectedCrewMember.stats?.dex}</div>
                        <div className="stat">Intelligence: {this.state.selectedCrewMember.stats?.int}</div>
                        {/* Vitality removed */}
                        <div className="stat">Fortitude: {this.state.selectedCrewMember.stats?.fort}</div>
                    </div>}
                    {this.state.selectedCrewMember && <div className="abilities-pane">
                        {this.state.selectedCrewMember.skills ? (
                            <div className="specials">Skills: &nbsp;
                                {this.state.selectedCrewMember.skills.map((e, i) => {
                                    const name = typeof e === 'object' && e !== null ? e.name : e;
                                    return <div key={i}>{name}{i !== this.state.selectedCrewMember.skills.length - 1 ? ',' : ''} &nbsp; </div>
                                })}
                            </div>
                        ) : (
                            <>
                                <div className="attacks">Attacks: &nbsp;
                                    {(this.state.selectedCrewMember.attacks || []).map((e,i)=> {
                                        const name = typeof e === 'object' && e !== null ? e.name : e;
                                        return <div key={i}>{ name }{i !== this.state.selectedCrewMember.attacks.length-1 ?  ',' : ''} &nbsp; </div>
                                    })}
                                </div>
                                <div className="specials">Specials: &nbsp;
                                    {(this.state.selectedCrewMember.specials || []).map((e,i)=> {
                                        const name = typeof e === 'object' && e !== null ? e.name : e;
                                        return <div key={i}>{ name }{i !== this.state.selectedCrewMember.specials.length-1 ?  ',' : ''} &nbsp; </div>
                                    })}
                                </div>
                            </>
                        )}
                        <div className="passives">Passives: &nbsp;
                            {(this.state.selectedCrewMember.passives || []).map((e,i)=> {
                                const name = typeof e === 'object' && e !== null ? e.name : e;
                                return <div key={i}>{ name }{i !== this.state.selectedCrewMember.passives.length-1 ?  ',' : ''} &nbsp; </div>
                            })}
                        </div>
                        <div className="weaknesses" style={{ display: 'flex', alignItems: 'center' }}>Weaknesses: &nbsp;
                            {renderWeaknessSymbols(this.state.selectedCrewMember.weaknesses)}
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