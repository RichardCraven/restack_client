import React, {useState} from 'react'
import { useSpring, animated } from 'react-spring'
// import { Keyframes, } from 'react-spring/renderprops'
// import delay from 'delay'
import { Redirect } from "react-router-dom";

import {loginRequest, registerRequest} from '../utils/api-handler';
import {storeToken} from '../utils/session-handler';

export default function LoginPage() {
  const [paneToggle, setPane] = useState(null)
  const [registerName, setRegName] = useState('')
  const [registerPass1, setRegPass1] = useState('')
  const [registerPass2, setRegPass2] = useState('')
  const [loginName, setLogName] = useState('')
  const [loginPass, setLogPass] = useState('')
  const [invalidCredentials, setInvalid] = useState(false)

  const [navToLanding, setNav] = useState(false);

  const [loginInputPropsName, setLname] = useSpring(() => ({ x: '-200px', opacity: 0, config: { mass: 5, tension: 350, friction: 40 } }))
  const [loginInputPropsPass, setLpass] = useSpring(() => ({ x: '-200px', opacity: 0, config: { mass: 5, tension: 350, friction: 40 } }))
  const [registrationInputPropsName, setRname] = useSpring(() => ({ x: '200px', opacity: 0, config: { mass: 3, tension: 350, friction: 40 } }))
  const [registrationInputPropsPass1, setRpass1] = useSpring(() => ({ x: '200px', opacity: 0, config: { mass: 6, tension: 350, friction: 40 } }))
  const [registrationInputPropsPass2, setRpass2] = useSpring(() => ({ x: '200px', opacity: 0, config: { mass: 5, tension: 250, friction: 40 } }))

  const handleChange = (e, type) => {
    console.log(e.target.value, type)
    switch(type){
      case 'register-name':
       setRegName(e.target.value)
      break;
      case 'login-name':
       setLogName(e.target.value)
      break;
      case 'register-password1':
       setRegPass1(e.target.value)
      break;
      case 'register-password2':
       setRegPass2(e.target.value)
      break;
      case 'login-password':
       setLogPass(e.target.value)
      break;
      default:
       break;
    }
  }

  const handleClick = async (type) => {
    // ApiHandler('boiii')
    setInvalid(false);
    switch(type){
      case 'login':
        if(paneToggle !== 'login'){
          setLname({x: '0px', opacity: 1})
          setTimeout(() => {
            setLpass({x: '0px', opacity: 1})
          }, 90)

          setRname({x: '200px', opacity: 0})
          setTimeout(() => {
            setRpass1({x: '200px', opacity: 0})

            setRpass2({x: '200px', opacity: 0})
          }, 90)

          setPane('login')
        } else if(loginName.length > 0 && loginPass.length > 0){
          console.log('trying to login with these creds:')
          console.log(loginName, loginPass)
            const response = await loginRequest({username: loginName, password: loginPass})
            console.log('login response: ', response)
            if(response.status === 200){
              storeToken(response.data.token)
              setNav(true)
            } else {
              setInvalid(true)
            }
        }
      break;
      case 'register':
        if(paneToggle !== 'register'){
          setLname({x: '-200px', opacity: 0})
          setTimeout(() => {
            setLpass({x: '-200px', opacity: 0})
          }, 90)

          setRname({x: '0px', opacity: 1})
          setTimeout(() => {
            setRpass1({x: '0px', opacity: 1})

            setRpass2({x: '0px', opacity: 1})
          }, 90)
          setPane('register')
        } else {
          console.log('trying to register with these creds:')
          console.log(registerName, registerPass1, registerPass2)
          if(registerPass1 !== registerPass2){
            alert('passwords must match')
          } else if(registerPass1.length > 0){
            // console.log('logging in')
            const response = await registerRequest({username: registerName, password: registerPass1})
            console.log('reg response: ', response)
            if(response.status === 200){
              storeToken(response.data.token)
              setNav(true)
            } else {
              alert('something failed', response)
              // setInvalid(true)
            }
          }
        }
      break;
      default:
      break;
    }
  }
  // const registerRequest = () => {
  //   axios.post("http://localhost:5000/api/admin/register", {username: registerName, password: registerPass1})
  //     .then(res=>{
  //       console.log('register res is ', res)
  //       // setDogs(res.data)
  //       // setIsLoading(false)
  //     })
  //     .catch(err=>console.log(err))
  // }
  // const loginRequest = () => {
  //   axios.post("http://localhost:5000/api/admin/login", {username: loginName, password: loginPass})
  //     .then(res=>{
  //       console.log('login res is ', res)
  //       // setDogs(res.data)
  //       // setIsLoading(false)
  //       if(res.status === 200){
  //         console.log('switch route')
  //         setNav(true)
  //         // return <Redirect to='/landing' />
  //       }
  //     })
  //     .catch(err=> {
  //       console.log(err)
  //       setInvalid(true)
  //     })
  // }

  return (
    // if(navToLanding){

    // }
    <div>
      { navToLanding ? <Redirect to='/landing'/> :
        <div>
          <div className="login-pane pane">
            {/* {renderSwitch(paneToggle)} */}
            {paneToggle === null && 
              <div
                style={{
                  position: 'absolute',
                  top: '40%'
                }}
              >Doors and Keys</div>
            }
            <div className="inputs-container-row">
              <div className="absolute-wrapper" style={{
                  pointerEvents: paneToggle === 'register' ? 'none' : 'auto'
                }}>
                <div className="inputs-container">  
                      <animated.div style={{
                        transform: loginInputPropsName.x.interpolate((x) => `translate3d(${x},0,0)`),
                        opacity: loginInputPropsName.opacity,
                        transition: 'opacity 0.1s'
                        }}>
                        <input value={loginName} type="text" placeholder="Name" onChange={(e) => {handleChange(e, 'login-name')}}/>
                      </animated.div>
                      <animated.div style={{
                        transform: loginInputPropsPass.x.interpolate((x) => `translate3d(${x},0,0)`),
                        opacity: loginInputPropsName.opacity,
                        transition: 'opacity 0.1s'
                        }}>
                        <input value={loginPass} type="password" placeholder="Password" onChange={(e) => {handleChange(e, 'login-password')}}/>
                      </animated.div>
                </div>
              </div>
              <div className="absolute-wrapper" style={{
                  pointerEvents: paneToggle === 'login' ? 'none' : 'auto'
                }}>
                <div className="inputs-container">
                  <animated.div style={{
                      transform: registrationInputPropsName.x.interpolate((x) => `translate3d(${x},0,0)`),
                      opacity: registrationInputPropsName.opacity,
                      transition: 'opacity 0.1s'
                      }}>
                      <input value={registerName} type="text" placeholder="Name" onChange={(e) => {handleChange(e, 'register-name')}}/>
                  </animated.div>
                  <animated.div style={{
                      transform: registrationInputPropsPass1.x.interpolate((x) => `translate3d(${x},0,0)`),
                      opacity: registrationInputPropsPass1.opacity,
                      transition: 'opacity 0.1s'
                      }}>
                      <input value={registerPass1} type="password" placeholder="Password" onChange={(e) => {handleChange(e, 'register-password1')}}/>
                  </animated.div>
                  <animated.div style={{
                      transform: registrationInputPropsPass2.x.interpolate((x) => `translate3d(${x},0,0)`),
                      opacity: registrationInputPropsPass2.opacity,
                      transition: 'opacity 0.1s'
                      }}>
                      <input value={registerPass2} type="password" placeholder="Repeat password" onChange={(e) => {handleChange(e, 'register-password2')}}/>
                  </animated.div>
                </div>   
              </div>
            </div>
            {invalidCredentials && 
                    <div className="invalid-credentials">
                      Invalid Credentials
                    </div>
            }
            <div className="buttons-bar">
                <div>
                  <button className="login-button button" onClick={() => handleClick('login')}>Login</button>
                  <button className="register-button button" onClick={() => handleClick('register')}>Register</button>
                </div>
            </div>
          </div>
        </div>
      } 
      
    </div>
  )
}