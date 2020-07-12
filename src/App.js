import React, {useState} from 'react';
import './App.scss';
import LoginPage from './pages/LoginPage'

import LandingPage from './pages/LandingPage'
import DungeonPage from './pages/DungeonPage'
import MapmakerPage from './pages/MapmakerPage'
import UserProfilePage from './pages/UserProfilePage'

import { Route} from "react-router-dom";

function App(props) {
const [isLoading] = useState(false);

 return (
   <div className="fullpage">
    {isLoading ?
      <h2>loading...</h2>
     :
      <div  className="App">
        <Route exact path="/" component={LoginPage} />
        <Route exact path="/userProfilePage" render={() => (
            <UserProfilePage {...props} />
        )}/>
        <Route exact path="/dungeon" render={() => (
            <DungeonPage {...props} />
          )}/>
        <Route path="/landing" component={LandingPage}/>
        <Route exact path="/mapmaker" render={() => (
            <MapmakerPage {...props} />
        )}/>
        <Route exact path="/usermanager" render={() => (
            <MapmakerPage {...props} />
        )}/>
      </div>
  }
 </div>
 );
}

export default App;
