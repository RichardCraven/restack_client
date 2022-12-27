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
const [user, setUser] = useState(null);
const [isAdmin, setIsAdmin] = useState(sessionStorage.getItem('isAdmin') === 'true' ? true : false)
const [showCoordinates, setShowCoordinates] = useState(false)
const [allUsers, setAllUsers] = useState([])
const history = useHistory();
useEffect(() => {

  getAllUsersRequest().then((response)=>{
    setAllUsers(response.data)
  })

  const token = sessionStorage.getItem('token');
  if(token){
    setLoggedIn(true)
  }
}, [])
useEffect(()=>{
  // console.log('all users changed', allUsers);
}, [allUsers])

const logout = () => {
  saveUserData();
  sessionStorage.clear()
  refreshAllUsers()
  setLoggedIn(false)
  return <Redirect to="/login" />
}
const loginFromRegister = (user) => {
  setUser(user)
  setTimeout(()=>{
    
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
    setUser(validUser)
    setTimeout(()=>{
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
  setUser(user)
  // ^ can be replaced by state management

  setTimeout(()=>{

    setLoggedIn(true)
  })
}

const refreshAllUsers = () => {
  getAllUsersRequest().then((response)=>{
    setAllUsers(response.data)
    setTimeout(()=>{
        console.log('now all users', allUsers);
    },500)
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
  meta.dungeonId = props.boardManager.dungeon.id
  // console.log('props.boardManager.dungeon: ', props.boardManager.dungeon);
  // console.log('board manager: ', props.boardManager);
  await updateUserRequest(userId, meta)
  sessionStorage.setItem('metadata', JSON.stringify(meta))
}
const goHome = () => {
  console.log('go home', 'wtf');
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
        {loggedIn && <button className="logout-button" onClick={logout}>
          Logout
        </button>}
        {loggedIn && <button className="save-button" onClick={saveUserData}>
          Save
        </button>}
        {loggedIn && <button className="go-home-button" onClick={goHome}>
          Home
        </button>}    
        {loggedIn && isAdmin && <button className="show-coordinates-button" onClick={toggleShowCoordinates}>
          Show Coordinates
        </button>}  

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
