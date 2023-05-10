function storeSessionData(id, token, isAdmin, username, metadata){
    // let bool = false;
    // if(parseInt(isAdmin, 10)){
    //     bool = true;
    // }
    console.log('token:', token, 'username', username)
    sessionStorage.setItem('userId', id)
    sessionStorage.setItem('userName', username)
    sessionStorage.setItem('isAdmin', isAdmin.toString())
    sessionStorage.setItem('metadata', metadata)
}

function storeMeta(metadata){
    console.log('storing meta: ', metadata)
    sessionStorage.setItem('metadata', JSON.stringify(metadata))
}
function getMeta(){
    // console.log('getting meta, ss:', sessionStorage)
    return JSON.parse(sessionStorage.getItem('metadata'))
}
function getUserId(){
    return sessionStorage.getItem('userId')
}
function getUserName(){
    return sessionStorage.getItem('userName')
}
function setEditorPreference(key, val){
    let meta = getMeta();
    if(meta.preferences && meta.preferences.editor){
        meta.preferences.editor[key] = val
    }
    storeMeta(meta)
}


export {storeSessionData, storeMeta, getMeta, getUserId, setEditorPreference, getUserName};