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
    console.log('meta stored: ', metadata );
}
function getMeta(){
    if(sessionStorage.getItem('metadata')){
        return JSON.parse(sessionStorage.getItem('metadata'))
    } else {
        return {
            dungeonId: null,
            boardIndex: null,
            tileIndex: null,
            crew: null,
            inventory: null
        }
    }
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