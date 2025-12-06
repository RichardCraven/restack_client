import React, {useState} from 'react';
import './App.scss';
import LoginPage from './pages/LoginPage'

import NarrativeSequence from './pages/NarrativeSequence'
import LandingPage from './pages/LandingPage'
import DungeonPage from './pages/DungeonPage'
import MapmakerPage from './pages/MapmakerPage'
import UserManagerPage from './pages/UserManagerPage'
import UserProfilePage from './pages/UserProfilePage'
import CrewManagerPage from './pages/CrewManagerPage'
import CombatSimulator from './pages/CombatSimulator'


import { Route, Switch, Redirect} from "react-router-dom";
import { useEffect } from 'react';

import {updateUserRequest} from '../src/utils/api-handler'

import {getAllUsersRequest} from './utils/api-handler';
import {storeSessionData, getUserId, getMeta} from './utils/session-handler';
import { useHistory } from "react-router";
import * as images from '../src/utils/images'


function App(props) {
const [loggedIn, setLoggedIn] = useState(!!getUserId())
const [menuTrayExpanded, setMenuTrayExpanded] = useState(false)
// const [isAdmin, setIsAdmin] = useState(sessionStorage.getItem('isAdmin') === 'true' ? true : false)
const [isAdmin, setIsAdmin] = useState(sessionStorage.getItem('isAdmin') === 'true' ? true : true)
const [showCoordinates, setShowCoordinates] = useState(false)
const [allUsers, setAllUsers] = useState([])
const [showToolbar, setShowToolbar] = useState(true)
const [narrativeSequenceType, setNarrativeSequenceType] = useState('')
const history = useHistory();
useEffect(() => {
  // ...existing code...
  window.pickRandom = (array) => {
    let index = Math.floor(Math.random() * array.length)
    return array[index]
}
  getAllUsersRequest().then((response)=>{
    setAllUsers(response.data)
  })
  if(getUserId()){
    setLoggedIn(true)
  } else {
    setLoggedIn(false)
  }
}, [])
useEffect(()=>{
}, [allUsers])


const logout = () => {
  saveUserData();
  sessionStorage.clear()
  refreshAllUsers()
  setLoggedIn(false)
  return <Redirect to="/login" />
}
const loginFromRegister = (user) => {
  // ...existing code...
  // ...existing code...
  setTimeout(()=>{
  // ...existing code...
    storeSessionData(user._id, user.token, user.isAdmin, user.username, user.metadata)
    setLoggedIn(true)
    setIsAdmin(JSON.parse(sessionStorage.getItem('isAdmin') === 'true' ))
    navToLanding()
  }, 500)
}
const navToLanding = () =>{
  history.push({
    pathname: '/landing'
  })
}
const login = (userCredentials) => {
  let validUser = null;
  allUsers.forEach((user)=>{
      if(userCredentials.username === user.username && userCredentials.password === user.password ){
          validUser = user;
      }
  })
  if(validUser){
    // setUser(validUser)
    setTimeout(()=>{
      storeSessionData(validUser._id, validUser.token, validUser.isAdmin, validUser.username, validUser.metadata)
      setLoggedIn(true)
      setIsAdmin(JSON.parse(sessionStorage.getItem('isAdmin') === 'true' ))
      history.push({
        pathname: '/landing'
      })
    })
  } else {
  // ...existing code...
  }
  return
}

const refreshAllUsers = () => {
  getAllUsersRequest().then((response)=>{
    setAllUsers(response.data);
  })
}

const saveUserData = async () => {
  // ...existing code...
  setMenuTrayExpanded(false);
  if(props.boardManager.boardIndex === null) return
  if(!props.boardManager.dungeon.id) return
  const meta = getMeta()
  const userId = getUserId();

  let boardIndex = props.boardManager.getBoardIndexFromBoard(props.boardManager.currentBoard)
  // return
  meta.location = {
    boardIndex,
    tileIndex: props.boardManager.getIndexFromCoordinates(props.boardManager.playerTile.location) ,
    levelId: props.boardManager.currentLevel.id,
    orientation: props.boardManager.currentOrientation
  }
  meta.inventory = { 
    items: props.inventoryManager.inventory, 
    gold: props.inventoryManager.gold,
    shimmering_dust: props.inventoryManager.shimmering_dust,
    totems: props.inventoryManager.totems
  }
  if(props.crewManager.crew.length === 0){
  // ...existing code...
    debugger
  }
  meta.crew = props.crewManager.crew;
  meta.dungeonId = props.boardManager.dungeon.id;
  await updateUserRequest(userId, meta)
  sessionStorage.setItem('metadata', JSON.stringify(meta));
}
const goHome = () => {
  setMenuTrayExpanded(false);
  saveUserData();
  history.push({
    pathname: '/landing'
  })
}
const toggleShowCoordinates = () => {
  setMenuTrayExpanded(false);
  setShowCoordinates(!showCoordinates)
}
const setNarrativeSequence = (type) => {
  setNarrativeSequenceType(type)
  if(type === 'death'){
    beginDeathSequence()
  }
}
const beginIntroSequence = () => {
  setShowToolbar(false);
}
const endIntroSequence = () => {
  // ...existing code...
  setShowToolbar(true);
}
const beginDeathSequence = () => {
  setShowToolbar(false);
}
const endDeathSequence = () => {
  setShowToolbar(true);
}
const toggleMenuTray = () => {
  let expanded = menuTrayExpanded;
  setMenuTrayExpanded(!expanded)
}
 return (
   <div className="fullpage">
      <div className="App">
        {loggedIn === true && showToolbar === true && <div className="nav-buttons-container">
          <div className="hamburger-button" style={{backgroundImage: `url(${images['hamburger']})`}} onClick={() => toggleMenuTray()}></div>
          <div className="menu-tray" style={{
            height: menuTrayExpanded ? '126px' : '0px',
            border: menuTrayExpanded ? '1px solid lightgrey' : '1px solid #d3d3d300'
          }}>
            {<button className="menu-buttons logout-button" onClick={logout}>
              Logout
            </button>}
            {<button className="menu-buttons save-button" onClick={saveUserData}>
              Save
            </button>}
            {<button className="menu-buttons go-home-button" onClick={goHome}>
              Home
            </button>}    
            {isAdmin && <button className="menu-buttons show-coordinates-button" onClick={toggleShowCoordinates}>
              Show Coordinates
            </button>}
          </div>
        </div> }
        <Switch>
          <Route exact path="/login" render={() => (
            <LoginPage {...props} login={login} loginFromRegister={(e) => loginFromRegister(e)} refreshAllUsers={(e) => refreshAllUsers(e)}/>
          )}/>
          <Route exact path="/intro" render={() => (
            !loggedIn ? <Redirect to="/login" /> :
            <NarrativeSequence {...props} sequenceType={narrativeSequenceType} beginIntroSequence={beginIntroSequence} endIntroSequence={endIntroSequence}/>
          )}/>
          <Route exact path="/death" render={() => (
            !loggedIn ? <Redirect to="/login" /> :
            narrativeSequenceType !== 'death' ? <Redirect to="/landing" /> :
            <NarrativeSequence {...props} sequenceType={narrativeSequenceType} beginDeathSequence={beginDeathSequence} endDeathSequence={endDeathSequence}/>
          )}/>
          <Route exact path="/userProfilePage" render={() => (
            !loggedIn ? <Redirect to="/login" /> :
            <UserProfilePage {...props} />
          )}/>
          <Route exact path="/crewManager" render={() => (
            !loggedIn ? <Redirect to="/login" /> :
            <CrewManagerPage {...props} />
          )}/>
          <Route exact path="/combatSimulator" render={() => (
            !loggedIn ? <Redirect to="/login" /> :
            <CombatSimulator {...props} navToLanding={navToLanding} />
          )}/>
          <Route exact path="/dungeon" render={() => (
            !loggedIn ? <Redirect to="/login" /> :
              <DungeonPage {...props} saveUserData={saveUserData} setNarrativeSequence={setNarrativeSequence} showCoordinates={showCoordinates}/>
          )
          }/>


          <Route exact path="/landing" render={() => (
            !loggedIn ? <Redirect to="/login" /> :
            <LandingPage {...props} setNarrativeSequence={setNarrativeSequence} beginIntroSequence={beginIntroSequence} endIntroSequence={endIntroSequence}/>
          )}/>

          {/* <Route exact path="/landing" component={LandingPage}>
            {!loggedIn && <Redirect to="/login" /> }
          </Route>  */}


          
          <Route exact path="/usermanager" render={() => (
            !loggedIn ? <Redirect to="/login" /> :
            <UserManagerPage {...props} />
            )}/>
          <Route exact path="/mapmaker" render={() => (
            !loggedIn ? <Redirect to="/login" /> :
              <MapmakerPage {...props} showCoordinates={showCoordinates}  />
          )}/>
          <Route path="/">
              {loggedIn ? <Redirect to="/landing" /> : 
              <Redirect to="/login" />}
          </Route>
        </Switch>
      </div>
 </div>
 );
}

export default App;
