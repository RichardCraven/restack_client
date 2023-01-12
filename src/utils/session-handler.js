function storeToken(id, token, isAdmin, metadata){
    // let bool = false;
    // if(parseInt(isAdmin, 10)){
    //     bool = true;
    // }
    sessionStorage.setItem('userId', id)
    // sessionStorage.setItem('token', token)
    sessionStorage.setItem('isAdmin', isAdmin.toString())
    sessionStorage.setItem('metadata', metadata)
}

function storeMeta(metadata){
    sessionStorage.setItem('metadata', JSON.stringify(metadata))
}
function getMeta(){
    return JSON.parse(sessionStorage.getItem('metadata'))
}
function getUserId(){
    return sessionStorage.getItem('userId')
}
function setEditorPreference(key, val){
    let meta = getMeta();
    if(meta.preferences && meta.preferences.editor){
        meta.preferences.editor[key] = val
    }
    storeMeta(meta)
}


export {storeToken, storeMeta, getMeta, getUserId, setEditorPreference};