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
const updateMapRequest = (id, mapObj) => {
  return axios.put("http://localhost:5000/api/admin/maps/"+id, {map: JSON.stringify(mapObj)})
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
const deleteMapRequest = (id) => {
  return axios.delete("http://localhost:5000/api/admin/maps/"+id)
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

const loadAllDungeonsRequest = (id) => {
  return axios.get("http://localhost:5000/api/admin/dungeons")
    .then(res=>{
      console.log('get all dungeons req is ', res)
      if(res.status === 200){
        return(res)
      }
    })
    .catch(err=> {
      console.log(err)
      return(err)
    })
}

const loadAllMapsRequest = () => {
  // return axios.get("http://localhost:5000/api/admin/maps")
  return axios.get("http://localhost:5000/api/admin/allmaps/0")
    .then(res=>{
      console.log('get all maps req is ', res)
      if(res.status === 200){
        return(res)
      }
    })
    .catch(err=> {
      console.log(err)
      return(err)
    })
}

const loadAllUsersRequest = () => {
  console.log('getting users')
  // return axios.get("http://localhost:5000/api/admin/maps")
  return axios.get("http://localhost:5000/api/admin/users")
    .then(res=>{
      console.log('get all users req is ', res)
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

// const isAuthorized = ()

export {
  registerRequest,
  loginRequest, 
  writeRequest, 
  ApiHandler, 
  addMapRequest, 
  loadMapRequest, 
  loadAllMapsRequest,
  updateMapRequest,
  deleteMapRequest,
  loadAllUsersRequest,
  loadAllDungeonsRequest
};