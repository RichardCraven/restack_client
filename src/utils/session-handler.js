function storeToken(token, isAdmin){
    console.log('yozo', parseInt(isAdmin, 10))
    let bool = false;
    if(parseInt(isAdmin, 10)){
        bool = true;
    }
    console.log('in store token, isAdmin is ', isAdmin)
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('isAdmin', bool)
    console.log('session storage is now: ', sessionStorage)
}

export {storeToken};