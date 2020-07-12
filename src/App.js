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

function App(props) {
const [isLoading] = useState(false);
const [loggedIn, setLoggedIn] = useState(false)
useEffect(() => {
  const token = sessionStorage.getItem('token');
  if(token){
    console.log('has token: ', true)
    setLoggedIn(true)
  }
}, [])
const logout = () => {
  sessionStorage.removeItem('isAdmin')
  sessionStorage.removeItem('token')
  setLoggedIn(false)
  return <Redirect to="/login" />
}
const login = () => {
  setLoggedIn(true)
}
 return (
   <div className="fullpage">
    {isLoading ?
      <h2>loading...</h2>
     :
      <div  className="App">
        {loggedIn && <button className="logout-button" onClick={logout}>
          Logout
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
  }
 </div>
 );
}

export default App;
