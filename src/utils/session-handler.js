function storeToken(id, token, isAdmin, metadata){
    let bool = false;
    if(parseInt(isAdmin, 10)){
        bool = true;
    }
    console.log('in store token, isAdmin is ', isAdmin)
    sessionStorage.setItem('userId', id)
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('isAdmin', bool)
    sessionStorage.setItem('metadata', JSON.stringify(metadata))
    console.log('session storage is now: ', sessionStorage)
}

export {storeToken};