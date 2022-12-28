import axios from 'axios';

const getAllUsersRequest = () => {
  return axios.get("http://localhost:5000/api/users")
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
const registerRequest = (regObj) => {
    // return axios.post("http://localhost:5000/api/register", regObj)
    return axios.post("http://localhost:5000/api/users", regObj)
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
const loginRequest = (loginObj) => {
    return axios.post("http://localhost:5000/api/login", loginObj)
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

const deleteUserRequest = (userId) => {
  return axios.delete("http://localhost:5000/api/users/"+userId)
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

const updateUserRequest = (userId, metadata) => {
  return axios.put("http://localhost:5000/api/users/"+userId, {metadata: JSON.stringify(metadata)})
    .then(res=>{
      if(res.status === 200){
        res.data.metadata = metadata
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
  console.log('adding map: ', mapObj);
  return axios.post("http://localhost:5000/api/maps", {map: JSON.stringify(mapObj)})
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
  return axios.put("http://localhost:5000/api/maps/"+id, {map: JSON.stringify(mapObj)})
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
const deleteBoardRequest = (id) => {
  return axios.delete("http://localhost:5000/api/maps/"+id)
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
  return axios.get("http://localhost:5000/api/maps/"+id)
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
const loadAllMapsRequest = () => {
  // return axios.get("http://localhost:5000/api/maps")
  return axios.get("http://localhost:5000/api/maps")
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

// Plane APIs --------------------------------------------------------

const addPlaneRequest = (planeObj) => {
  return axios.post("http://localhost:5000/api/planes", {plane: JSON.stringify(planeObj)})
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
const updatePlaneRequest = (id, planeObj) => {
  return axios.put("http://localhost:5000/api/planes/"+id, {plane: JSON.stringify(planeObj)})
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
const loadAllPlanesRequest = (id) => {
  return axios.get("http://localhost:5000/api/planes")
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
const loadPlaneRequest = (id) => {
  return axios.get("http://localhost:5000/api/planes/"+id)
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
const deletePlaneRequest = (id) => {
  return axios.delete("http://localhost:5000/api/planes/"+id)
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

// Dungeon APIs --------------------------------------------------------

const addDungeonRequest = (dungeonObj) => {
  return axios.post("http://localhost:5000/api/dungeons", {dungeon: JSON.stringify(dungeonObj)})
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
const updateDungeonRequest = (id, dungeonObj) => {
  return axios.put("http://localhost:5000/api/dungeons/"+id, {dungeon: JSON.stringify(dungeonObj)})
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
  return axios.get("http://localhost:5000/api/dungeons")
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
  return axios.get("http://localhost:5000/api/dungeons/"+id)
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
  return axios.delete("http://localhost:5000/api/dungeons/"+id)
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
  return axios.get("http://localhost:5000/api/users")
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


// const isAuthorized = ()

export {
  registerRequest,
  loginRequest, 
  updateUserRequest,
  addMapRequest, 
  loadMapRequest, 
  loadAllMapsRequest,
  updateMapRequest,
  deleteBoardRequest,
  loadAllUsersRequest,
  loadAllDungeonsRequest,
  addDungeonRequest,
  loadDungeonRequest,
  updateDungeonRequest,
  deleteDungeonRequest,
  deleteUserRequest,
  getAllUsersRequest,
  addPlaneRequest,
  deletePlaneRequest,
  updatePlaneRequest,
  loadAllPlanesRequest,
  loadPlaneRequest
};