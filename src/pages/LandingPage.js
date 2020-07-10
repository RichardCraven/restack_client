import React, {useState} from 'react'
import { Redirect } from "react-router-dom";

export default function LandingPage() {
  console.log('landing')
  const [navToData, setNavData] = useState(false);
  const [navToShop, setNavShop] = useState(false);
  const [navToPortal, setNavPortal] = useState(false);
  const [navToDungeon, setNavDungeon] = useState(false);

  return (
       <div className="landing-pane pane">

         { navToData && <Redirect to='/data'/> }
         { navToShop && <Redirect to='/shop'/> }
         { navToPortal && <Redirect to='/portal'/> }
         { navToDungeon && <Redirect to='/dungeon'/> }

         <div className="user-data" onClick={() => setNavData(true)}>User Data</div>
         <div className="shop" onClick={() => setNavShop(true)}>Shop</div>
         <div className="portal" onClick={() => setNavPortal(true)}>Portal</div>
         <div  className="enter-dungeon" onClick={() => setNavDungeon(true)}>Enter Dungeon</div>
       </div>
  )
}