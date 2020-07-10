function storeToken(token){
    sessionStorage.setItem('token', token)
    console.log('session storage is now: ', sessionStorage)
}

export {storeToken};