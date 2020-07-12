import React, {useState, useEffect} from 'react'
import { Redirect } from "react-router-dom";

export default function LandingPage() {
  console.log('landing')
  const [navToUserProfile, setNavUserProfile] = useState(false);
  const [navToShop, setNavShop] = useState(false);
  const [navToPortal, setNavPortal] = useState(false);
  const [navToDungeon, setNavDungeon] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(()=> {
    if(JSON.parse(sessionStorage.getItem('isAdmin'))){
      setIsAdmin(true)
    }
  },[])
  return (
       <div className="landing-pane pane">

         { navToUserProfile && <Redirect to='/userProfilePage'/> }
         { navToShop && <Redirect to='/shop'/> }
         { navToPortal && <Redirect to='/mapmaker'/> }
         { navToDungeon && <Redirect to='/dungeon'/> }

        <div className="user-row">
         <div className="user-data" onClick={() => setNavUserProfile(true)}>User Profile</div>
         <div className="shop" onClick={() => setNavShop(true)}>Shop</div>
         <div  className="enter-dungeon" onClick={() => setNavDungeon(true)}>Enter Dungeon</div>
        </div>
        { isAdmin && <div className="admin-row">
          <div className="map-maker" onClick={() => setNavPortal(true)}>Map Maker</div>
          <div className="user-manager" onClick={() => setNavPortal(true)}>User Manager</div>
        </div>}
       </div>
  )
}