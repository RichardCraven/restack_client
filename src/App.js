import React, {useEffect, useState} from 'react';
import './App.scss';
// import axios from 'axios';
import LoginPage from './pages/LoginPage'
import {BoardManager} from './utils/board-manager'

import LandingPage from './pages/LandingPage'
import DungeonPage from './pages/DungeonPage'
import PortalPage from './pages/PortalPage'

import { Route} from "react-router-dom";

const ogboardManager = new BoardManager();

function App(props) {
  console.log('app props: ', props)
  const [isLoading] = useState(false);
  // const wtf = 'wtf'
  // const [boardManager, setBoard] = useState(null)
  useEffect(()=>{
    console.log('app useEffect')
    // setBoard(ogboardManager)
    // axios.get("http://localhost:5000/api/visitors/dogs")
    // .then(res=>{
    //   console.log('res is ', res)
    //   setIsLoading(false)
    // })
    // .catch(err=>console.log(err))
 },[]);

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
