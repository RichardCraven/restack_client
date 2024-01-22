import React, {useState, useEffect} from 'react'
import { Redirect } from "react-router-dom";
import { useHistory } from "react-router";
import {getMeta} from '../utils/session-handler';

export default function LandingPage(props) {
  const [navToUserProfile, setNavUserProfile] = useState(false);
  const [navToCrew, setNavCrew] = useState(false);
  const [navToPortal, setNavMapmaker] = useState(false);
  const [navToUsermanager, setNavUsermanager] = useState(false);
  const [navToDungeon, setNavDungeon] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  const [navToIntro, setNavToIntro] = useState(false)

  const history = useHistory();

  useEffect(()=> {
    let mounted = true;
    history.push({
      pathname: '/landing'
    })
    if(mounted){
      if(JSON.parse(sessionStorage.getItem('isAdmin'))){
        setIsAdmin(true)
      }
    }
    return () => {
      mounted = false;
    }
  },[history])
  const checkForCrew = () => {
    const meta = getMeta();
    console.log('meta: ', meta);
    if(!meta || !meta.crew || meta.crew.length === 0){
      setShowWarning(true)
    }
  }

  const enterClicked = () => {
    if(showWarning) return
    const meta = getMeta();
    console.log('enter clicked, meta: ', meta);
    if(meta.dungeonId){
      setNavDungeon(!showWarning)
    } else {  
      console.log('show intro sequence');




      props.setNarrativeSequence('intro')
      
      setNavToIntro(true)
    }
  }

  return (
       <div className="landing-pane pane">
          { navToIntro && <Redirect to='/intro'/>}
          { navToUserProfile && <Redirect to='/userProfilePage'/> }
          { navToCrew && <Redirect to='/crewManager'/> }
          { navToPortal && <Redirect to='/mapmaker'/> }
          { navToDungeon && <Redirect to='/dungeon'/> }
          { navToUsermanager && <Redirect to='/usermanager'/> }
          <div className="landing-buttons-container">
            {showWarning && <span className="warning">Cannot enter dungeon without a crew</span>}
            <div className={`landing-button enter-dungeon ${showWarning ? 'disabled' : ''}`} onMouseEnter={() => checkForCrew()} onMouseLeave={() => setShowWarning(false)} onClick={() => enterClicked()}>Enter</div>
            <div className="landing-button shop"  onClick={() => setNavCrew(true)} >Crew</div>
            <div className="landing-button user-data" onClick={() => setNavUserProfile(true)}>Profile</div>
            { isAdmin && <div className="landing-button map-maker" onClick={() => setNavMapmaker(true)}>Dungeon Builder</div>}
            { isAdmin && <div className="landing-button-last user-manager" onClick={() => setNavUsermanager(true)}>User Manager</div>}
          </div>
       </div>
  )
}