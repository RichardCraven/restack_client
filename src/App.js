import React, {useState} from 'react';
import './App.scss';
import LoginPage from './pages/LoginPage'

import LandingPage from './pages/LandingPage'
import DungeonPage from './pages/DungeonPage'
import PortalPage from './pages/PortalPage'

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
        {/* <Route exact path="/dungeon" component={DungeonPage} /> */}
        <Route exact path="/dungeon" render={() => (
            <DungeonPage {...props} />
          )}/>
        <Route path="/landing" component={LandingPage}/>
        {/* <Route path="/portal" component={PortalPage}/> */}
        <Route exact path="/portal" render={() => (
            <PortalPage {...props} />
          )}/>
      </div>
  }
 </div>
 );
}

export default App;
