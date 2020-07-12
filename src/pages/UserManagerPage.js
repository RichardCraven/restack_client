import React from 'react'
import '../styles/user-manager-page.scss'

class UserManagerPage extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      reptile: 'alligator',
      color: '#008f68',
    };
    console.log('User Manager Page props: ', this.props)
  }
  render(){
    return <div className="board">
      USER MANAGER PAGE
      {this.state.reptile}
      </div>
  }
}

export default UserManagerPage;