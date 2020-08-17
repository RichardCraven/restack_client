import React from 'react'
import '../styles/user-manager-page.scss'
import {loadAllUsersRequest, deleteUserRequest} from '../utils/api-handler';

class UserManagerPage extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      users: [],
      color: '#008f68',
    };
    console.log('User Manager Page props: ', this.props)
  }
  async componentDidMount(){
    console.log('user manager component did mount')
    const response  = await loadAllUsersRequest()
    console.log('users: ', response.data)
    this.setState((state, props) => {
      return  {users: response.data}
    })
  }
  componentDidUpdate(){
    console.log('compomnent did update', this.state)
    
  }
  deleteUser = async (user) => {
    console.log('delete user ', user)
    const c = window.confirm("Are you sure you want to delete this user?")
    if(c){
      const response  = await deleteUserRequest(user.id)
      console.log('response: ', response)
      const final  = await loadAllUsersRequest()
      this.setState((state, props) => {
        return  {users: final.data}
      })
    }
  }
  // useEffect(()=> {
  //   let mounted = true;
  //   history.push({
  //     pathname: '/landing'
  //   })
  //   if(mounted){
  //     if(JSON.parse(sessionStorage.getItem('isAdmin'))){
  //       setIsAdmin(true)
  //     }

  //   }
  //   return () => {
  //     mounted = false;
  //   }
  // },[history])

  render(){
    return <div className="board">
        <div className="table">
          <div className="row">
            <div className="username-header">Username</div>
            <div className="isadmin-header">Is Admin</div>
            <div className="world-header">World</div>
            <div className="crew-header">Crew</div>
          </div>
          <hr/>
          {this.state.users.map((user, i) => {
            return <div key={i} className="row">
                      <div className="data-node username-header">{user.username}</div>
                      <div className="data-node isadmin-header">{user.isAdmin ? 'true' : 'false'}</div>
                      <div className="data-node world-header">{user.metadata ? 'dig for data' : 'N/A'}</div>
                      <div className="data-node crew-header">{user.metadata ? 'dig for data' : 'N/A'}</div>
                      <button onClick={() => {this.deleteUser(user)}}>X</button>
                  </div>
          })}
        </div>
      </div>
  }
}

export default UserManagerPage;