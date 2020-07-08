import React, {useEffect, useState} from 'react';
import './App.scss';
import axios from 'axios';
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'

import { Link, Route, Switch, Redirect } from "react-router-dom";

function App() {
  const [dogs, setDogs] = useState([]);
  // const [paneToggle, setPane] = useState(null)
  const [isLoading, setIsLoading] = useState(true);
  // const [registerName, setRegName] = useState('')
  // const [registerPass1, setRegPass1] = useState('')
  // const [registerPass2, setRegPass2] = useState('')
  // const [loginName, setLogName] = useState('')
  // const [loginPass, setLogPass] = useState('')
  useEffect(()=>{
    axios.get("http://localhost:5000/api/visitors/dogs")
    .then(res=>{
      console.log('res is ', res)
      setDogs(res.data)
      setIsLoading(false)
    })
    .catch(err=>console.log(err))
 },[]);

//  const renderSwitch = (param) => {
//    switch(param){
//      case 'login':
//        return (<div className="inputs-container">
//                 <input value={loginName} type="text" placeholder="Name" onChange={(e) => {handleChange(e, 'login-name')}}/>
//                 <input value={loginPass} type="password" placeholder="Password" onChange={(e) => {handleChange(e, 'login-password')}}/>
//               </div>)
//      case 'register':
//        return (<div className="inputs-container">
//                   <input value={registerName} type="text" placeholder="Name" onChange={(e) => {handleChange(e, 'register-name')}}/>
//                   <input value={registerPass1} type="password" placeholder="Password" onChange={(e) => {handleChange(e, 'register-password1')}}/>
//                   <input value={registerPass2} type="password" placeholder="Repeat password" onChange={(e) => {handleChange(e, 'register-password2')}}/>
//               </div>)
//      default:
//        return <div className="inputs-container">Welcome</div>
//    }
//  }

//  const handleChange = (e, type) => {
//    console.log(e.target.value, type)
//    switch(type){
//      case 'register-name':
//       setRegName(e.target.value)
//      break;
//      case 'login-name':
//       setLogName(e.target.value)
//      break;
//      case 'register-password1':
//       setRegPass1(e.target.value)
//      break;
//      case 'register-password2':
//       setRegPass2(e.target.value)
//      break;
//      case 'login-password':
//       setLogPass(e.target.value)
//      break;
//      default:
//       break;
//    }
//  }

//  const handleClick = (type) => {
//     switch(type){
//       case 'login':
//         if(paneToggle !== 'login'){
//           setPane('login')
//         } else {
//           console.log('trying to login with these creds:')
//           console.log(loginName, loginPass)
//           loginRequest();
//         }
//       break;
//       case 'register':
//         if(paneToggle !== 'register'){
//           setPane('register')
//         } else {
//           console.log('trying to register with these creds:')
//           console.log(registerName, registerPass1, registerPass2)
//           if(registerPass1 !== registerPass2){
//             alert('passwords must match')
//           } else {
//             console.log('logging in')
//             registerRequest();
//           }
//         }
//       break;
//       default:
//       break;
//     }
//  }

//  const registerRequest = () => {
//   axios.post("http://localhost:5000/api/admin/register", {username: registerName, password: registerPass1})
//     .then(res=>{
//       console.log('register res is ', res)
//       // setDogs(res.data)
//       // setIsLoading(false)
//     })
//     .catch(err=>console.log(err))
//  }
//  const loginRequest = () => {
//   axios.post("http://localhost:5000/api/admin/login", {username: loginName, password: loginPass})
//     .then(res=>{
//       console.log('login res is ', res)
//       // setDogs(res.data)
//       // setIsLoading(false)
//       if(res.status === 200){
//         console.log('switch route')
//       }
//     })
//     .catch(err=>console.log(err))
//  }

 return (
   <div className="fullpage">
    {isLoading ?
      <h2>loading...</h2>
     :
      // <div> 
      //   <h2>Restacks</h2>
      //   <div className="login-pane">
      //     {renderSwitch(paneToggle)}
      //     <div className="buttons-bar">
      //       { true && (
      //         <div>
      //           <button className="login-button" onClick={() => handleClick('login')}>Login</button>
      //           <button className="register-button" onClick={() => handleClick('register')}>Register</button>
      //         </div>
      //         )
      //       }
      //     </div>
      //   </div>
      // </div>
      <div className="App">
        <Route exact path="/" component={LoginPage} />
        <Route path="/landing" component={LandingPage}/>
      </div>
  }
 </div>
 );
}

export default App;
