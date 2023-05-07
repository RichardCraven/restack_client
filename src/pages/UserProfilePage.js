import React from 'react'
import {storeMeta, getMeta, getUserId, getUserName} from '../utils/session-handler';
import {
  loadAllDungeonsRequest,
  loadDungeonRequest,
  updateDungeonRequest,
  updateUserRequest,
  addDungeonRequest
} from '../utils/api-handler';
class UserProfilePage extends React.Component{
  constructor(props){
    super(props)
    this.state = {
        dungeon: null,
        user: null
    }
  }

  componentWillMount(){
    console.log('component moiunted props:', this)
    // const userData = getMeta();
    
    this.getDungeonDetails();
  }

  getDungeonDetails = async () => {
    const user = getMeta();
    user.name = 'Henry'
    console.log('user:', user)
    
    if(!user.dungeonId){
      this.setState({
        user,
        dungeon: null
      })
    } else {
      const res = await loadDungeonRequest(user.dungeonId)
      console.log('res:', res)
      const dungeon = JSON.parse(res.data[0].content)
      console.log('dungeon:', dungeon)
      this.setState({
        user,
        dungeon
      })
    }
    // console.log('state:', )
  }
  clearDungeon = () => {
    console.log('clearing dungeon')
    if(this.state.dungeon){
      let user = getMeta();
      user.dungeonId = null;
      storeMeta(user);
      setTimeout(()=>{
        this.getDungeonDetails();
      })
    }
  }
  render(){
    return (
      <div className="landing-pane pane">
        {/* { navToUserProfile && <Redirect to='/userProfilePage'/> }
        { navToShop && <Redirect to='/shop'/> }
        { navToPortal && <Redirect to='/mapmaker'/> }
        { navToDungeon && <Redirect to='/dungeon'/> }
        { navToUsermanager && <Redirect to='/usermanager'/> } */}
        <div className="content-container">
          <div className="title">Name: {this.state.user?.name}</div>
          <div className="current-dungeon">Dungeon: {this.state.dungeon?.name}</div>
          <button onClick={() => this.clearDungeon()}>Clear Dungeon</button>
  
          {/* <div className="landing-button enter-dungeon" onClick={() => setNavDungeon(true)}>Enter</div>
          <div className="landing-button shop"  onClick={() => setNavShop(true)} >Crew</div>
          <div className="landing-button user-data" onClick={() => setNavUserProfile(true)}>Profile</div>
          { isAdmin && <div className="landing-button map-maker" onClick={() => setNavMapmaker(true)}>Dungeon Builder</div>}
          { isAdmin && <div className="landing-button-last user-manager" onClick={() => setNavUsermanager(true)}>User Manager</div>} */}
        </div>
      </div>
    )
  }
}

export default UserProfilePage;