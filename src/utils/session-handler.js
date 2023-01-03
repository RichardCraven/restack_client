function storeToken(id, token, isAdmin, metadata){
    // let bool = false;
    // if(parseInt(isAdmin, 10)){
    //     bool = true;
    // }
    sessionStorage.setItem('userId', id)
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('isAdmin', isAdmin.toString())
    sessionStorage.setItem('metadata', metadata)
}

export {storeToken};