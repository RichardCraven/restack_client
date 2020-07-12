import React, {useState, useEffect} from 'react'
import { Redirect } from "react-router-dom";
import { useHistory } from "react-router";

export default function LandingPage() {
  const [navToUserProfile, setNavUserProfile] = useState(false);
  const [navToShop, setNavShop] = useState(false);
  const [navToPortal, setNavMapmaker] = useState(false);
  const [navToUsermanager, setNavUsermanager] = useState(false);
  const [navToDungeon, setNavDungeon] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false)

  const history = useHistory();

  useEffect(()=> {
    history.push({
      pathname: '/landing'
    })
    if(JSON.parse(sessionStorage.getItem('isAdmin'))){
      setIsAdmin(true)
    }
  },[history])
  // const handleClick = (type) => {

  // }
  return (
       <div className="landing-pane pane">

         { navToUserProfile && <Redirect to='/userProfilePage'/> }
         { navToShop && <Redirect to='/shop'/> }
         { navToPortal && <Redirect to='/mapmaker'/> }
         { navToDungeon && <Redirect to='/dungeon'/> }
         { navToUsermanager && <Redirect to='/usermanager'/> }

        <div className="user-row">
         <div className="user-data" onClick={() => setNavUserProfile(true)}>User Profile</div>
         <div className="shop" onClick={() => setNavShop(true)}>Shop</div>
         <div  className="enter-dungeon" onClick={() => setNavDungeon(true)}>Enter Dungeon</div>
        </div>
        { isAdmin && <div className="admin-row">
          <div className="user-manager" onClick={() => setNavUsermanager(true)}>User Manager</div>
          <div className="map-maker" onClick={() => setNavMapmaker(true)}>Map Maker</div>
          {/* <div className="map-maker" onClick={() => setNavMapmaker(true)}>Map Maker</div> */}
        </div>}
       </div>
  )
}