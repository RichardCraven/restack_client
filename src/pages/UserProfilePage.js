import React from 'react'
import {storeMeta, getMeta, getUserName, getUserId} from '../utils/session-handler';
import {
  loadDungeonRequest,
  deleteDungeonRequest,
  updateUserRequest
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
    user.name = getUserName();
    console.log('user:', user)
    
    if(!user.dungeonId){
      this.setState({
        user,
        dungeon: null
      })
    } else {
      const res = await loadDungeonRequest(user.dungeonId)
      console.log('res:', res)
      const dungeon = res.data.length > 0 ? JSON.parse(res.data[0].content) : null
      console.log('dungeon:', dungeon)
      this.setState({
        user,
        dungeon
      })
    }
    // console.log('state:', )
  }
  clearDungeon = async () => {
    console.log('clearing dungeon', this.state.dungeon)
    let meta = getMeta();
    if(this.state.dungeon){
      await deleteDungeonRequest(meta.dungeonId)

      this.props.boardManager.dungeon.id = null;
      this.props.inventoryManager.inventory = [];

      meta.dungeonId = null;
      meta.location = null
      meta.inventory = { 
        items: [], 
        gold: 0,
        shimmering_dust: 0,
        totems: 0
      }
      await updateUserRequest(getUserId(), meta)
      storeMeta(meta);
      
      setTimeout(()=>{
        this.getDungeonDetails();
      })
    } else {
      console.log('no state dungeon, second block');
      meta.dungeonId = null;
      meta.location = null
      meta.inventory = { 
        items: [], 
        gold: 0,
        shimmering_dust: 0,
        totems: 0
      }
      await updateUserRequest(getUserId(), meta)
      storeMeta(meta);
      
      setTimeout(()=>{
        this.getDungeonDetails();
        console.log('meta: ', getMeta());
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