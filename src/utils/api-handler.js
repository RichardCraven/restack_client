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

const deleteUserRequest = (userId) => {
  return axios.delete("http://localhost:5000/api/admin/"+userId)
    .then(res=>{
      console.log('delete res is ', res)
      if(res.status === 200){
        return(res)
      }
    })
    .catch(err=> {
      console.log(err)
      return(err)
    })
}

const updateUserRequest = (userId, metadata) => {
  return axios.put("http://localhost:5000/api/admin/"+userId, {metadata: JSON.stringify(metadata)})
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

// Map APIs --------------------------------------------------------

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
const loadAllMapsRequest = () => {
  // return axios.get("http://localhost:5000/api/admin/maps")
  return axios.get("http://localhost:5000/api/admin/allmaps/0")
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


// Dungeon APIs --------------------------------------------------------

const addDungeonRequest = (dungeonObj) => {
  return axios.post("http://localhost:5000/api/admin/dungeons", {dungeon: JSON.stringify(dungeonObj)})
    .then(res=>{
      console.log('received res!: ', res)
      if(res.status === 200 || res.status === 201){
        return(res)
      }
    })
    .catch(err=> {
      console.log(err)
      return(err)
    })
}
const updateDungeonRequest = (id, dungeonObj) => {
  return axios.put("http://localhost:5000/api/admin/dungeons/"+id, {dungeon: JSON.stringify(dungeonObj)})
    .then(res=>{
      if(res.status === 200 || res.status === 201){
        return(res)
      }
    })
    .catch(err=> {
      console.log(err)
      return(err)
    })
}
const loadAllDungeonsRequest = (id) => {
  return axios.get("http://localhost:5000/api/admin/dungeons/0")
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
const loadDungeonRequest = (id) => {
  return axios.get("http://localhost:5000/api/admin/dungeons/"+id)
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
const deleteDungeonRequest = (id) => {
  return axios.delete("http://localhost:5000/api/admin/dungeons/"+id)
    .then(res=>{
      if(res.status === 200 || res.status === 201){
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
  updateUserRequest,
  writeRequest, 
  ApiHandler, 
  addMapRequest, 
  loadMapRequest, 
  loadAllMapsRequest,
  updateMapRequest,
  deleteMapRequest,
  loadAllUsersRequest,
  loadAllDungeonsRequest,
  addDungeonRequest,
  loadDungeonRequest,
  updateDungeonRequest,
  deleteDungeonRequest,
  deleteUserRequest
};