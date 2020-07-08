import React, {useEffect, useState} from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [dogs, setDogs] = useState([]);
  const [paneToggle, setPane] = useState(null)
  const [isLoading, setIsLoading] = useState(true);
  useEffect(()=>{
    console.log('hi')
    axios.get("http://localhost:5000/api/visitors/dogs")
    .then(res=>{
      console.log('res is ', res)
      setDogs(res.data)
      setIsLoading(false)
    })
    .catch(err=>console.log(err))
 },[])
 return (
   <div className="App">
    {isLoading ?
      <h2>loading...</h2>
     :
    //  dogs.map((dog, i)=>{
    //  return (
      //  <div key={i}> 
      // <p >{dog.name}</p>
      // <p >{dog.bio}</p>
      //  </div>
      <div> 
        <h2>Welcome</h2>
        <div className="login-pane">
          {/* <input type="text" placeholder="name"/>
          <input type="password" placeholder="password"/> */}
          <div className="buttons-bar">
            <button className="login-button">Login</button>
            <button className="register-button">Register</button>
          </div>
        </div>
      </div>
    //  )
    //  })
  }
 </div>
 );
}

export default App;
