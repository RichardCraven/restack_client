import React, {useEffect, useState} from 'react'
import { useTransition, useSpring, useChain, useTrail, config, animated } from 'react-spring'
import { Keyframes, } from 'react-spring/renderprops'
import delay from 'delay'
import axios from 'axios';
import { Link, Route, Switch, Redirect } from "react-router-dom";

const calc = (x, y) => [-(y - window.innerHeight / 2) / 20, (x - window.innerWidth / 2) / 20, 1.1]
const trans = (x, y, s) => `perspective(600px) rotateX(${x}deg) rotateY(${y}deg) scale(${s})`

export default function LoginPage() {
  const [paneToggle, setPane] = useState(null)
  const [registerName, setRegName] = useState('')
  const [registerPass1, setRegPass1] = useState('')
  const [registerPass2, setRegPass2] = useState('')
  const [loginName, setLogName] = useState('')
  const [loginPass, setLogPass] = useState('')
  const [invalidCredentials, setInvalid] = useState(false)

  const [navToLanding, setNav] = useState(false);

  // react spring stuff
  const fast = { mass: 11, tension: 180, friction: 120 }
  const slow = { mass: 15, tension: 200, friction: 170 }
  const trans = (x, y) => `translate3d(${x}px,${y}px,0)`


  // const [springProps, setSpringProps, stop] = useSpring(() => ({opacity: 0.5, color: 'yellow'}))

  // const [toggle1, setToggle] = useState(true)
  // setSpringProps({opacity: toggle1 ? 0 : 1, color: toggle1 ? 'red' : 'blue'})

  // useEffect(() => {
  //   console.log('ye?', springProps)
  // }, [])


  // const [props, set] = useSpring(() => ({ xys: [0, 0, 1], config: { mass: 5, tension: 350, friction: 40 } }))
  const [props, set] = useSpring(() => ({ x: '-200px', config: { mass: 5, tension: 350, friction: 40 } }))

  const [loginInputPropsName, setLname] = useSpring(() => ({ x: '-200px', opacity: 0, config: { mass: 5, tension: 350, friction: 40 } }))
  const [loginInputPropsPass, setLpass] = useSpring(() => ({ x: '-200px', opacity: 0, config: { mass: 5, tension: 350, friction: 40 } }))
  const [registrationInputPropsName, setRname] = useSpring(() => ({ x: '-200px', opacity: 0, config: { mass: 5, tension: 350, friction: 40 } }))
  const [registrationInputPropsPass1, setRpass1] = useSpring(() => ({ x: '-200px', opacity: 0, config: { mass: 5, tension: 350, friction: 40 } }))
  const [registrationInputPropsPass2, setRpass2] = useSpring(() => ({ x: '-200px', opacity: 0, config: { mass: 5, tension: 350, friction: 40 } }))

  // const [state, toggle] = useState(true)
  // const { x } = useSpring({ from: { x: 0 }, x: state ? 1 : 0, config: { duration: 1000 } })



  // Creates a spring with predefined animation slots
  const Springer = Keyframes.Spring({
    login: { delay: 100, x: '100px'},
    // or async functions with side-effects
    close: async call => {
      await delay(400)
      await call({ delay: 0, x: '-100px'})
    },
  })
  const Content = Keyframes.Trail({
    open: { x: 0, opacity: 1, delay: 100 },
    close: { x: -100, opacity: 0, delay: 0 },
  })

  const loginInputs = [
        <input value={loginName} type="text" placeholder="Name" onChange={(e) => {handleChange(e, 'login-name')}}/>,
        <input value={loginPass} type="password" placeholder="Password" onChange={(e) => {handleChange(e, 'login-password')}}/>
  ]

  const renderSwitch = (param) => {
    console.log(loginInputPropsName.x)
    switch(param){
      case 'login':
        return (
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
                  {invalidCredentials && 
                    <div className="invalid-credentials">
                      Invalid Credentials
                    </div>
                  }
               </div>)
      case 'register':
        return (<div className="inputs-container">
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
                  
                  
                  
                  {invalidCredentials && 
                    <div className="invalid-credentials">
                      Invalid Credentials
                    </div>
                  }
               </div>)
      default:
        return <div className="inputs-container">Doors and Keys</div>
    }
  }

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

  const handleClick = (type) => {
    setInvalid(false);
    switch(type){
      case 'login':
        if(paneToggle !== 'login'){
          setLname({x: '0px', opacity: 1})
          setTimeout(() => {
            setLpass({x: '0px', opacity: 1})
          }, 90)
          setPane('login')
        } else if(loginName.length > 0 && loginPass.length > 0){
          console.log('trying to login with these creds:')
          console.log(loginName, loginPass)
          loginRequest();
        }
      break;
      case 'register':
        if(paneToggle !== 'register'){
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
            console.log('logging in')
            registerRequest();
          }
        }
      break;
      default:
      break;
    }
  }
  const registerRequest = () => {
    axios.post("http://localhost:5000/api/admin/register", {username: registerName, password: registerPass1})
      .then(res=>{
        console.log('register res is ', res)
        // setDogs(res.data)
        // setIsLoading(false)
      })
      .catch(err=>console.log(err))
  }
  const loginRequest = () => {
    axios.post("http://localhost:5000/api/admin/login", {username: loginName, password: loginPass})
      .then(res=>{
        console.log('login res is ', res)
        // setDogs(res.data)
        // setIsLoading(false)
        if(res.status === 200){
          console.log('switch route')
          setNav(true)
          // return <Redirect to='/landing' />
        }
      })
      .catch(err=> {
        console.log(err)
        setInvalid(true)
      })
  }

  return (
    // if(navToLanding){

    // }
    <div>
      { navToLanding ? <Redirect to='/landing'/> :
        <div>
          <div className="login-pane pane">
            {renderSwitch(paneToggle)}
            {/* <div >
              <animated.div 
              className="springer-container"
              onClick={() => set({ x: '300px' })}
              style={{ 
                transform: props.x.interpolate(x => `translate3d(${x},0,0)`)
              }}
              >i will fade</animated.div>
            </div> */}
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