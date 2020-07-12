import React, {useState, useEffect} from 'react'
import { useSpring, animated } from 'react-spring'
// import { Keyframes, } from 'react-spring/renderprops'
// import delay from 'delay'
import { Redirect } from "react-router-dom";

import {loginRequest, registerRequest} from '../utils/api-handler';
import {storeToken} from '../utils/session-handler';

export default function LoginPage(props) {
  
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


  useEffect(() => {
    console.log('login page props are: ', props)
  }, [props])

  const handleChange = (e, type) => {
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
            const response = await loginRequest({username: loginName, password: loginPass})
            if(response.status === 200){
              storeToken(response.data.token, response.data.isAdmin)
              props.login()
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
          if(registerPass1 !== registerPass2){
            alert('passwords must match')
          } else if(registerPass1.length > 0){
            const response = await registerRequest({username: registerName, password: registerPass1})
            if(response.status === 200){
              storeToken(response.data.token)
              props.login()
              setNav(true)
            } else {
              alert('something failed', response)
            }
          }
        }
      break;
      default:
      break;
    }
  }
  return (
    <div>
      { navToLanding ? <Redirect to='/landing'/> :
        <div>
          <div className="login-pane pane">
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
                <form action="">
                  <div className="inputs-container">  
                        <animated.div style={{
                          transform: loginInputPropsName.x.interpolate((x) => `translate3d(${x},0,0)`),
                          opacity: loginInputPropsName.opacity,
                          transition: 'opacity 0.1s'
                          }}>
                          <input value={loginName} autoComplete="none" type="text" placeholder="Name" onChange={(e) => {handleChange(e, 'login-name')}}/>
                        </animated.div>
                        <animated.div style={{
                          transform: loginInputPropsPass.x.interpolate((x) => `translate3d(${x},0,0)`),
                          opacity: loginInputPropsName.opacity,
                          transition: 'opacity 0.1s'
                          }}>
                          <input value={loginPass} autoComplete="current-password" type="password" placeholder="Password" onChange={(e) => {handleChange(e, 'login-password')}}/>
                        </animated.div>
                  </div>
                </form>
              </div>
              <div className="absolute-wrapper" style={{
                  pointerEvents: paneToggle === 'login' ? 'none' : 'auto'
                }}>
                <form action="">
                  <div className="inputs-container">
                    <animated.div style={{
                        transform: registrationInputPropsName.x.interpolate((x) => `translate3d(${x},0,0)`),
                        opacity: registrationInputPropsName.opacity,
                        transition: 'opacity 0.1s'
                        }}>
                        <input value={registerName} autoComplete="none" type="text" placeholder="Name" onChange={(e) => {handleChange(e, 'register-name')}}/>
                    </animated.div>
                    <animated.div style={{
                        transform: registrationInputPropsPass1.x.interpolate((x) => `translate3d(${x},0,0)`),
                        opacity: registrationInputPropsPass1.opacity,
                        transition: 'opacity 0.1s'
                        }}>
                        <input value={registerPass1} autoComplete="current-password" type="password" placeholder="Password" onChange={(e) => {handleChange(e, 'register-password1')}}/>
                    </animated.div>
                    <animated.div style={{
                        transform: registrationInputPropsPass2.x.interpolate((x) => `translate3d(${x},0,0)`),
                        opacity: registrationInputPropsPass2.opacity,
                        transition: 'opacity 0.1s'
                        }}>
                        <input value={registerPass2} autoComplete="current-password" type="password" placeholder="Repeat password" onChange={(e) => {handleChange(e, 'register-password2')}}/>
                    </animated.div>
                  </div>   
                  
                </form>
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