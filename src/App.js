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

function App(props) {
const [loggedIn, setLoggedIn] = useState(false)
useEffect(() => {
  const token = sessionStorage.getItem('token');
  if(token){
    setLoggedIn(true)
  }
}, [])
const logout = () => {
  sessionStorage.clear()
  setLoggedIn(false)
  return <Redirect to="/login" />
}
const login = () => {
  setLoggedIn(true)
}
const save = async () => {
  if(props.boardManager.mapIndex === null) return
  if(!props.boardManager.dungeon.id) return
  const location = props.boardManager.getIndexFromCoordinates(props.boardManager.playerTile.location) 
  const meta = JSON.parse(sessionStorage.getItem('metadata'))
  const userId = sessionStorage.getItem('userId')
  meta.mapIndex = props.boardManager.playerTile.mapIndex
  meta.locationTileIndex = location
  meta.dungeonId = props.boardManager.dungeon.id
  const res = await updateUserRequest(userId, meta)
  sessionStorage.setItem('metadata', res.data.metadata)
}
 return (
   <div className="fullpage">
      <div  className="App">
        {loggedIn && <button className="logout-button" onClick={logout}>
          Logout
        </button>}
        {loggedIn && <button className="save-button" onClick={save}>
          Save
        </button>}
        <Route exact path="/login" render={() => (
          <LoginPage {...props} login={login} />
        )}/>
        <Route exact path="/userProfilePage" render={() => (
            <UserProfilePage {...props} />
        )}/>
        <Route exact path="/dungeon" render={() => (
            <DungeonPage {...props} />
          )}/>
        <Route path="/landing" component={LandingPage}/>
        <Route exact path="/usermanager" render={() => (
          <UserManagerPage {...props} />
          )}/>
        <Route exact path="/mapmaker" render={() => (
            <MapmakerPage {...props} />
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
