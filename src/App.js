import React, {useState} from 'react';
import './App.scss';
import LoginPage from './pages/LoginPage'

import LandingPage from './pages/LandingPage'
import DungeonPage from './pages/DungeonPage'
import MapmakerPage from './pages/MapmakerPage'
import UserManagerPage from './pages/UserManagerPage'
import UserProfilePage from './pages/UserProfilePage'
import CrewManagerPage from './pages/CrewManagerPage'


import { Route, Switch, Redirect} from "react-router-dom";
import { useEffect } from 'react';

import {updateUserRequest} from '../src/utils/api-handler'

import {getAllUsersRequest} from './utils/api-handler';
import {storeSessionData, getUserId, getMeta} from './utils/session-handler';
import { useHistory } from "react-router";


function App(props) {
const [loggedIn, setLoggedIn] = useState(!!getUserId())
// const [user, setUser] = useState(null);
const [isAdmin, setIsAdmin] = useState(sessionStorage.getItem('isAdmin') === 'true' ? true : false)
const [showCoordinates, setShowCoordinates] = useState(false)
const [allUsers, setAllUsers] = useState([])
const history = useHistory();
useEffect(() => {
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
  setTimeout(()=>{
    storeSessionData(user._id, user.token, user.isAdmin, user.username, user.metadata)
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
      storeSessionData(validUser._id, validUser.token, validUser.isAdmin, validUser.username, validUser.metadata)
      setLoggedIn(true)
      setIsAdmin(JSON.parse(sessionStorage.getItem('isAdmin') === 'true' ))
      history.push({
        pathname: '/landing'
      })
      // setTimeout(()=>{

      //   console.log('about to redirect to landing', loggedIn);
      //   return <Redirect to="/landing" />
      // })
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
  meta.inventory = props.inventoryManager.inventory;
  console.log('meta.crew:', meta.crew);
  meta.crew = props.crewManager.crew;
  meta.dungeonId = props.boardManager.dungeon.id;
  await updateUserRequest(userId, meta)
  sessionStorage.setItem('metadata', JSON.stringify(meta))
}
const goHome = () => {
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
          {<button className="menu-buttons logout-button" onClick={logout}>
            Logout
          </button>}
          {<button className="menu-buttons save-button" onClick={saveUserData}>
            Save
          </button>}
          {<button className="menu-buttons go-home-button" onClick={goHome}>
            Home
          </button>}    
          {/* {isAdmin && <button className="menu-buttons show-coordinates-button" onClick={toggleShowCoordinates}>
            Show Coordinates
          </button>}  */}


          
          {/* {showCoordinates && <div>{currentBoard}</div>} */}
        </div> }
        {/* <Route path="/">
          {!loggedIn ? <Redirect to="/login" /> : 
          <Redirect to="/landing" />}
        </Route> */}
        {/* <BrowserRouter> */}
        <Switch>
          {/* <UnauthenticatedRoute
            path="/login"
            component={LoginPage}
            appProps={{ loggedIn }}
          /> */}
          {/* <AuthenticatedRoute
            path="/landing"
            component={LandingPage}
            appProps={{ loggedIn }}
          /> */}
          <Route exact path="/login" render={() => (
            <LoginPage {...props} login={login} loginFromRegister={(e) => loginFromRegister(e)} refreshAllUsers={(e) => refreshAllUsers(e)}/>
          )}/>
          <Route exact path="/userProfilePage" render={() => (
            <UserProfilePage {...props} />
          )}/>
          <Route exact path="/crewManager" render={() => (
            <CrewManagerPage {...props} />
          )}/>
          <Route exact path="/dungeon" render={() => (
            !loggedIn ? <Redirect to="/login" /> :
              <DungeonPage {...props} saveUserData={saveUserData} showCoordinates={showCoordinates}/>
            )}/>
          {/* <Route exact path="/dungeon" {...props} saveUserData={saveUserData} showCoordinates={showCoordinates} component={LandingPage}>
            {!loggedIn && <Redirect to="/login" /> }
          </Route>  */}
          <Route exact path="/landing" component={LandingPage}>
            {!loggedIn && <Redirect to="/login" /> }
          </Route> 
          <Route exact path="/usermanager" render={() => (
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

          {/* <LoginPage {...props} login={login} loginFromRegister={(e) => loginFromRegister(e)} refreshAllUsers={(e) => refreshAllUsers(e)}></LoginPage> */}
          {/* <Route component={NotFound} /> */}
        </Switch>
        {/* </BrowserRouter> */}

        {/* <Route exact path="/login" render={() => (
          <LoginPage {...props} login={login} loginFromRegister={(e) => loginFromRegister(e)} refreshAllUsers={(e) => refreshAllUsers(e)}/>
        )}/>
        <Route exact path="/userProfilePage" render={() => (
            <UserProfilePage {...props} />
        )}/>
        <Route exact path="/dungeon" render={() => (
            <DungeonPage {...props} saveUserData={saveUserData} showCoordinates={showCoordinates}/>
          )}/>
        <Route exact path="/landing" component={LandingPage}/>
        <Route exact path="/usermanager" render={() => (
          <UserManagerPage {...props} />
          )}/>
        <Route exact path="/mapmaker" render={() => (
            <MapmakerPage {...props} showCoordinates={showCoordinates}  />
        )}/>
        <Route path="/">
          {loggedIn ? <Redirect to="/landing" /> : 
          <Redirect to="/login" />}
        </Route> */}

        
      </div>
 </div>
 );
}

export default App;
