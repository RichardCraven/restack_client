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

export {registerRequest, loginRequest, ApiHandler};