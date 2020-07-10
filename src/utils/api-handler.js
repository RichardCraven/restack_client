import axios from 'axios';

function ApiHandler(poo){
    console.log('oh whaddup ', poo)
}
// function doSomething(){

// }

const registerRequest = (regObj) => {
    return axios.post("http://localhost:5000/api/admin/register", regObj)
      .then(res=>{
        console.log('register res is ', res);
        if(res.status === 200){
            return(res)
        }
      })
      .catch(err=> {
        console.log(err)
        return(err)
      })
}
const loginRequest = (loginObj) => {
    return axios.post("http://localhost:5000/api/admin/login", loginObj)
      .then(res=>{
        console.log('login res is ', res)
        if(res.status === 200){
          return(res)
        }
      })
      .catch(err=> {
        console.log(err)
        return(err)
      })
}

const addMapRequest = (mapObj) => {
  return axios.post("http://localhost:5000/api/admin/maps", {map: JSON.stringify(mapObj)})
    .then(res=>{
      if(res.status === 200){
        return(res)
      }
    })
    .catch(err=> {
      console.log(err)
      return(err)
    })
}
const loadMapRequest = (id) => {
  return axios.get("http://localhost:5000/api/admin/maps/"+id)
    .then(res=>{
      console.log('get map req is ', res)
      if(res.status === 200){
        return(res)
      }
    })
    .catch(err=> {
      console.log(err)
      return(err)
    })
}

const writeRequest = (messageObj) => {
  return axios.post("http://localhost:5000/api/admin/write", messageObj)
}
const loadRequest = (mapId) => {
  return axios.post("http://localhost:5000/api/admin/write", mapId)
}

// const isAuthorized = ()

export {registerRequest, loginRequest, writeRequest, ApiHandler, addMapRequest, loadMapRequest};