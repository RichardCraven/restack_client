import React from 'react'
import '../styles/user-manager-page.scss'
import {loadAllUsersRequest} from '../utils/api-handler';

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
                  </div>
          })}
        </div>
      </div>
  }
}

export default UserManagerPage;