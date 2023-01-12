import React, {useState} from 'react';
import './App.scss';
import LoginPage from './pages/LoginPage'

import LandingPage from './pages/LandingPage'
import DungeonPage from './pages/DungeonPage'
import MapmakerPage from './pages/MapmakerPage'
import UserManagerPage from './pages/UserManagerPage'
import UserProfilePage from './pages/UserProfilePage'

import { Route, Redirect} from "react-router-dom";
import { useEffect } from 'react';

import {updateUserRequest} from '../src/utils/api-handler'

import {getAllUsersRequest} from './utils/api-handler';
import {storeToken} from './utils/session-handler';
import { useHistory } from "react-router";

function App(props) {
const [loggedIn, setLoggedIn] = useState(false)
// const [user, setUser] = useState(null);
const [isAdmin, setIsAdmin] = useState(sessionStorage.getItem('isAdmin') === 'true' ? true : false)
const [showCoordinates, setShowCoordinates] = useState(false)
const [allUsers, setAllUsers] = useState([])
const history = useHistory();
useEffect(() => {

  getAllUsersRequest().then((response)=>{
    // setAllUsers(response.data)
  })

  const token = sessionStorage.getItem('token');
  console.log('token: ', token, typeof token, 'loggedIn:', loggedIn);
  if(token !== undefined && token !== 'undefined'){
    console.log('wait a minute...')
    setLoggedIn(true)
  } else {
    console.log('setting logged in to 44');
    setLoggedIn(false)
  }
  setTimeout(()=>{
    console.log('wtaf, loggedIn??', loggedIn);
  },1000)
}, [])
useEffect(()=>{
  console.log('all users', allUsers);
}, [allUsers])

const logout = () => {
  saveUserData();
  sessionStorage.clear()
  refreshAllUsers()
  setLoggedIn(false)
  return <Redirect to="/login" />
}
const loginFromRegister = (user) => {
  // setUser(user)
  setTimeout(()=>{
    console.log('user token: ', user.token, typeof user.token);
    storeToken(user._id, user.token, user.isAdmin, user.metadata)
    setLoggedIn(true)
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
      console.log('valid user.metadata:', validUser.metadata);
      storeToken(validUser._id, validUser.token, validUser.isAdmin, validUser.metadata)
      setLoggedIn(true)
      setIsAdmin(JSON.parse(sessionStorage.getItem('isAdmin') === 'true' ))
    })
      // const userId = validUser.id;

      // ProjectDataService.get(userId)
      // .then(res => {
      //     applyProjectData(res.data);
      // })

      // UserDataService.getImg(userId)
      // .then(res => {
      //     if(res.data) validUser.picture = res.data[0].data_string;
      //     dispatchUser(validUser)
      // })
      // .catch(() => {
      //     dispatchUser(validUser)
      // });
  } else {
      console.log('INVALID')
  }

  return
}

const refreshAllUsers = () => {
  getAllUsersRequest().then((response)=>{
    setAllUsers(response.data);
  })
}

const saveUserData = async () => {
  if(props.boardManager.boardIndex === null) return
  if(!props.boardManager.dungeon.id) return
  const meta = JSON.parse(sessionStorage.getItem('metadata'))
  const userId = sessionStorage.getItem('userId')
  meta.planeIndex = props.boardManager.playerTile.planeIndex
  meta.boardIndex = props.boardManager.playerTile.boardIndex
  meta.tileIndex = props.boardManager.getIndexFromCoordinates(props.boardManager.playerTile.location) 
  meta.dungeonId = props.boardManager.dungeon.id;
  await updateUserRequest(userId, meta)
  sessionStorage.setItem('metadata', JSON.stringify(meta))
}
const goHome = () => {
  console.log('go home');
  saveUserData();
  history.push({
    pathname: '/landing'
  })
}
const toggleShowCoordinates = () => {
  setShowCoordinates(!showCoordinates)
}
 return (
   <div className="fullpage">
      <div  className="App">
        {loggedIn === true && <div className="nav-buttons-container">
          {loggedIn && <button className="menu-buttons logout-button" onClick={logout}>
            Logout?
          </button>}
          {loggedIn && <button className="menu-buttons save-button" onClick={saveUserData}>
            Save
          </button>}
          {loggedIn && <button className="menu-buttons go-home-button" onClick={goHome}>
            Home
          </button>}    
          {loggedIn && isAdmin && <button className="menu-buttons show-coordinates-button" onClick={toggleShowCoordinates}>
            Show Coordinates
          </button>}  
        </div> }

        <Route exact path="/login" render={() => (
          <LoginPage {...props} login={login} loginFromRegister={(e) => loginFromRegister(e)} refreshAllUsers={(e) => refreshAllUsers(e)}/>
        )}/>
        <Route exact path="/userProfilePage" render={() => (
            <UserProfilePage {...props} />
        )}/>
        <Route exact path="/dungeon" render={() => (
            <DungeonPage {...props} saveUserData={saveUserData} showCoordinates={showCoordinates}/>
          )}/>
        <Route path="/landing" component={LandingPage}/>
        <Route exact path="/usermanager" render={() => (
          <UserManagerPage {...props} />
          )}/>
        <Route exact path="/mapmaker" render={() => (
            <MapmakerPage {...props} showCoordinates={showCoordinates}  />
        )}/>
        <Route path="/">
          {loggedIn ? <Redirect to="/landing" /> : 
          <Redirect to="/login" />}
        </Route>
      </div>
 </div>
 );
}

export default App;
