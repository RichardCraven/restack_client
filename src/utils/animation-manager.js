export function AnimationManager(){
    this.tiles = [];
    this.canvasAnimations = [];
    this.MAX_DEPTH = 0;

    this.connectCombatMethods = (callback) => {
        this.checkForCollision = callback;
    }


    this.magicMissile = (sourceCoords, targetCoords) => {
        console.log('sourceCoords', sourceCoords, 'targetCoords', targetCoords);
        const ref = {
            origin: sourceCoords,
            distanceToTarget: this.getDistanceToTarget(sourceCoords, targetCoords), 
            verticalDistanceToTarget: this.getVerticalDistanceToTarget(sourceCoords, targetCoords),
            connectParticles: false
        };
        this.canvasAnimations.push(ref)
        this.update();
        setTimeout(()=>{
            let e = this.canvasAnimations.find(c=>c===ref);
            this.canvasAnimations = this.canvasAnimations.filter(v=>v!==e);
            // if(this.state.selectedFighter) this.props.combatManager.unlockFighter(this.state.selectedFighter.id)
            this.update();
        }, 2500)
        // ^ travel time + 1 second of damage animation
    }
    this.getDistanceToTarget = (sourceCoords, targetCoords) => {
        // if(!target) return 0;
        let d = targetCoords.x - sourceCoords.x
        return d
    }
    this.getVerticalDistanceToTarget = (sourceCoords, targetCoords) => {
        // if(!target) return 0;
        let d = targetCoords.y - sourceCoords.y
        return d
    }
    // this.establishAnimationCallbck = (callBack) => {
    //     console.log('establishCallback', callBack);
    //     // const {tileAnimated} = callBacks;
    //     this.tileAnimated = callBack;
    // }
    this.establishUpdateAnimationDataCallback = (callBack) => {
        this.updateAnimationData = callBack;
    }

    this.getTileIdByCoords = (coords) => {
        let tile = this.tiles.find(e=>e.x === coords.x && e.y === coords.y)
        return tile ? tile.id : null
    }
    this.getTileCoordsById = (id) => {
        let tile = this.tiles.find(e=>e.id === id)
        return tile ? {x: tile.x, y: tile.y} : null
    }


    this.initialize = (MAX_DEPTH, MAX_ROWS) => {
        this.MAX_DEPTH = MAX_DEPTH;
        console.log('max depth: ', MAX_DEPTH);
        let arr = [];
        for(let i = 0; i < MAX_ROWS*MAX_DEPTH; i++){
            let x = i%MAX_DEPTH,
            y = Math.floor(i/MAX_DEPTH)
            arr.push({
                id: i,
                x,
                y,
                animationOn: false,
                animationType: '',
                animationtransitionType: '',
                handleClick: this.handleTileClick 
            })
        }
        this.tiles = arr;
        this.update();
        console.log('animation manager initialize');
    }
    this.update = () => {
        this.updateAnimationData({tiles: this.tiles, canvasAnimations: this.canvasAnimations})
    }
    this.handleTileClick = (tileId) => {
        let colors = ['purple', 'red', 'green', 'white'],
        color = this.pickRandom(colors);

        if(this.pickRandom([true, false])){
            this.rippleAnimation(tileId, color)
        } else {
            this.crossAnimation(tileId, color)
        }
    }


    this.triggerTileAnimation = (tileId, color = null) => {
        this.tileOn(tileId, 'solid', color)
        setTimeout(()=>{
            this.tileOff(tileId)
        }, 1000)
    }
    this.triggerTileAnimation_line = (tileId, color = null) => {
        this.tileOn(tileId, 'line', color);
        setTimeout(()=>{
            this.tileOff(tileId)
        }, 1000)
    }
    this.tileOn = (tileId, animationType, color = null) => {
        const storedTile = this.tiles.find(e=>e.id === tileId)
        storedTile.animationOn = true;
        storedTile.animationType = animationType;
        storedTile.transitionType = color ? `${color}-fade` : 'red-fade';
        this.update();
    }
    this.tileOff = (tileId) => {
        const storedTile = this.tiles.find(e=>e.id === tileId)
        storedTile.animationOn = false;
        storedTile.transitionType = ''
        storedTile.animationType = ''
        this.update();
    }

    // ANIMATION METHODS
    this.ripple = (tileId, color = null) => {
        const storedTile = this.tiles.find(e=>e.id === tileId)
        const leftSide = this.tiles.filter(e=>e.x === storedTile.x - 1 && (
            e.y === storedTile.y ||
            e.y === storedTile.y - 1 ||
            e.y === storedTile.y + 1
            ))  
        const rightSide = this.tiles.filter(e=>e.x === storedTile.x + 1 && (
            e.y === storedTile.y ||
            e.y === storedTile.y - 1 ||
            e.y === storedTile.y + 1
            ))  
        const topAndBottom = this.tiles.filter(e=>e.x === storedTile.x && (
            e.y === storedTile.y - 1 ||
            e.y === storedTile.y + 1
            )) 
     
        const animate = () => {
            leftSide.forEach((e) => {
                this.triggerTileAnimation(e.id, color)
            })
            rightSide.forEach((e) => {
                this.triggerTileAnimation(e.id, color)
            })
            topAndBottom.forEach((e) => {
                this.triggerTileAnimation(e.id, color)
            }) 
        }
        setTimeout(()=>{
            animate();
        },100)
    }
    this.straightBeamTo = (targetTileId, sourceTileId, color = null) => {
        console.log('TARGET TILE ID ', targetTileId);
        const sourceTile = this.tiles.find(e=>e.id === sourceTileId)
        const destinationTile = this.tiles.find(e=>e.id === targetTileId)
        let isOnSamePlane = sourceTile.y === destinationTile.y;
        let direction = sourceTile.x > destinationTile.x ? 'rightToLeft' : 'leftToRight'
        console.log('about to rerturn promise', sourceTile, destinationTile);
        return new Promise((resolve, reject) => {
            console.log('is On Same Plane ', isOnSamePlane);
            if(isOnSamePlane){
                let distanceAway = Math.abs(sourceTile.x - destinationTile.x)

                if(sourceTile.x > destinationTile.x && direction === 'rightToLeft'){
                    let sourceX = sourceTile.x
                    let idArray = [];
                    for(let i = sourceX -1; i > destinationTile.x; i--){
                        let id = this.getTileIdByCoords({x: i, y: destinationTile.y})
                        idArray.push(id)
                    }
                    
                    const lineInterval = setInterval(()=>{
                        if(idArray.length === 0){
                            clearInterval(lineInterval);
                            resolve();
                        } else {
                            let id = idArray.shift();
                            this.triggerTileAnimation(id, color);
                        }
                    }, 100 + (distanceAway * 5))
                    // idArray.
                    // this.triggerTileAnimation(id, color)
                }
                if(sourceTile.x < destinationTile.x && direction === 'leftToRight'){
                    console.log('left to right');
                    let sourceX = sourceTile.x
                    let idArray = [];
                    for(let i = sourceX + 1; i < destinationTile.x; i++){
                        let id = this.getTileIdByCoords({x: i, y: destinationTile.y})
                        idArray.push(id)
                    }
                    
                    const lineInterval = setInterval(()=>{
                        if(idArray.length === 0){
                            clearInterval(lineInterval);
                            resolve();
                        } else {
                            let id = idArray.shift();
                            this.triggerTileAnimation(id, color);
                        }
                    }, 10 + (distanceAway * 5))
                }
            }
        })
    }
    this.straightBeamNoTarget = (sourceTileId, color = null, resolve) => {
        const sourceTile = this.tiles.find(e=>e.id === sourceTileId)
        console.log('siourceTile: ', sourceTile);
        
        let maxX = this.MAX_DEPTH-1;
        let newCoords = {x: maxX, y: sourceTile.y}
        console.log('maxX: ', maxX, 'sourceTile.x', sourceTile.x);
        console.log('new coords: ', newCoords);
        let destinationTileId = this.getTileIdByCoords(newCoords)
        let destinationTile = this.tiles[destinationTileId]
        console.log('destination ', destinationTile);
        // const destinationTile = this.tiles.find(e=>e.id === targetTileId)
        let isOnSamePlane = sourceTile.y === destinationTile.y;
        let direction = sourceTile.x > destinationTile.x ? 'rightToLeft' : 'leftToRight'
        console.log('about to rerturn promise', sourceTile, destinationTile, 'DIRECTION:::', direction);
        return new Promise((resolve, reject) => {
            console.log('is On Same Plane ', isOnSamePlane);
            // if(isOnSamePlane){
                let distanceAway = Math.abs(sourceTile.x - destinationTile.x)
                console.log('init, distanceAway', distanceAway);
                if(sourceTile.x > destinationTile.x && direction === 'rightToLeft'){
                    let sourceX = sourceTile.x
                    let idArray = [];
                    for(let i = sourceX -1; i > destinationTile.x; i--){
                        let id = this.getTileIdByCoords({x: i, y: destinationTile.y})
                        idArray.push(id)
                    }
                    
                    const lineInterval = setInterval(()=>{
                        if(idArray.length === 0){
                            clearInterval(lineInterval);
                            resolve();
                        } else {
                            let id = idArray.shift();
                            // this.checkForCollision(id)
                            this.triggerTileAnimation(id, color);
                        }
                    }, 100 + (distanceAway * 5))
                    // idArray.
                    // this.triggerTileAnimation(id, color)
                }
                console.log('sourceTile.x', sourceTile.x, 'destinationTile.x', destinationTile.x);
                if(sourceTile.x < destinationTile.x && direction === 'leftToRight'){
                    console.log('left to right');
                    let sourceX = sourceTile.x
                    let idArray = [];
                    for(let i = sourceX + 1; i < destinationTile.x +1; i++){
                        let id = this.getTileIdByCoords({x: i, y: destinationTile.y})
                        idArray.push(id)
                    }
                    console.log('idArray', idArray);
                    
                    const lineInterval = setInterval(()=>{
                        if(idArray.length === 0){
                            clearInterval(lineInterval);
                            resolve();
                        } else {
                            let id = idArray.shift();
                            let tileCoords = this.getTileCoordsById(id)
                            console.log('tileCoords: ', tileCoords);
                            let collision = this.checkForCollision(tileCoords)
                            this.triggerTileAnimation(id, color);
                            if(collision){
                                clearInterval(lineInterval);
                                resolve();
                            }
                        }
                    }, 10 + (distanceAway * 5))
                }
            // }
        })
    }
    this.straightNarrowBeamTo = (targetTileId, sourceTileId, color = null) => {
        const sourceTile = this.tiles.find(e=>e.id === sourceTileId)
        const destinationTile = this.tiles.find(e=>e.id === targetTileId)
        let isOnSamePlane = sourceTile.y === destinationTile.y;
        let direction = sourceTile.x > destinationTile.x ? 'rightToLeft' : 'leftToRight'
        
        return new Promise((resolve, reject) => {
            if(isOnSamePlane){
                let distanceAway = Math.abs(sourceTile.x - destinationTile.x)

                if(sourceTile.x > destinationTile.x && direction === 'rightToLeft'){
                    let sourceX = sourceTile.x
                    let idArray = [];
                    for(let i = sourceX -1; i > destinationTile.x; i--){
                        let id = this.getTileIdByCoords({x: i, y: destinationTile.y})
                        idArray.push(id)
                    }
                    
                    const lineInterval = setInterval(()=>{
                        if(idArray.length === 0){
                            clearInterval(lineInterval);
                            resolve();
                        } else {
                            let id = idArray.shift();
                            this.triggerTileAnimation_line(id, color);
                        }
                    }, 100 + (distanceAway * 20))
                }
                if(sourceTile.x < destinationTile.x && direction === 'leftToRight'){
                    let sourceX = sourceTile.x
                    let idArray = [];
                    for(let i = sourceX + 1; i < destinationTile.x; i++){
                        let id = this.getTileIdByCoords({x: i, y: destinationTile.y})
                        idArray.push(id)
                    }
                    
                    const lineInterval = setInterval(()=>{
                        if(idArray.length === 0){
                            clearInterval(lineInterval);
                            resolve();
                        } else {
                            let id = idArray.shift();
                            this.triggerTileAnimation_line(id, color)
                        }
                    }, 10 + (distanceAway * 10))
                }
                
                // debugger
            }
        })
    }
    this.straightLineTo = (targetTileId, sourceTileId, color = null) => {
        const sourceTile = this.tiles.find(e=>e.id === sourceTileId)
        const destinationTile = this.tiles.find(e=>e.id === targetTileId)
        let isOnSamePlane = sourceTile.y === destinationTile.y;
        let direction = sourceTile.x > destinationTile.x ? 'rightToLeft' : 'leftToRight'

        return new Promise((resolve, reject) => {
            if(isOnSamePlane){
                let distanceAway = Math.abs(sourceTile.x - destinationTile.x)

                if(sourceTile.x > destinationTile.x && direction === 'rightToLeft'){
                    let sourceX = sourceTile.x
                    let idArray = [];
                    for(let i = sourceX -1; i > destinationTile.x; i--){
                        let id = this.getTileIdByCoords({x: i, y: destinationTile.y})
                        idArray.push(id)
                    }
                    
                    const lineInterval = setInterval(()=>{
                        if(idArray.length === 0){
                            clearInterval(lineInterval);
                            resolve();
                        } else {
                            let id = idArray.shift();
                            this.triggerTileAnimation(id, color);
                        }
                    }, 50 + (distanceAway * 5));
                }
                if(sourceTile.x < destinationTile.x && direction === 'leftToRight'){
                    let sourceX = sourceTile.x
                    let idArray = [];
                    for(let i = sourceX + 1; i < destinationTile.x; i++){
                        let id = this.getTileIdByCoords({x: i, y: destinationTile.y})
                        idArray.push(id)
                    }
                    
                    const lineInterval = setInterval(()=>{
                        if(idArray.length === 0){
                            clearInterval(lineInterval);
                            resolve();
                        } else {
                            let id = idArray.shift();
                            this.triggerTileAnimation(id, color);
                        }
                    }, 50 + (distanceAway * 5));
                }
            }
        })
    }
    this.cross = (tileId, color = null) => {
        const storedTile = this.tiles.find(e=>e.id === tileId)
        let leftSide, rightSide, topAndBottom;

        const firstLayer = () => {
            leftSide = this.tiles.filter(e=>e.x === storedTile.x - 1 && (
                e.y === storedTile.y
                ))  
            rightSide = this.tiles.filter(e=>e.x === storedTile.x + 1 && (
                e.y === storedTile.y
                ))  
            topAndBottom = this.tiles.filter(e=>e.x === storedTile.x && (
                e.y === storedTile.y - 1 ||
                e.y === storedTile.y + 1
                )) 
            const animate = () => {
                leftSide.forEach((e) => {
                    this.triggerTileAnimation(e.id, color)
                })
                rightSide.forEach((e) => {
                    this.triggerTileAnimation(e.id, color)
                })
                topAndBottom.forEach((e) => {
                    this.triggerTileAnimation(e.id, color)
                }) 
            }
            setTimeout(()=>{
                animate();
            },100)
        }

        // const secondLayer = () => {
        //     leftSide = this.tiles.filter(e=>e.x === storedTile.x - 2 && (
        //         e.y === storedTile.y
        //         ))  
        //     rightSide = this.tiles.filter(e=>e.x === storedTile.x + 2 && (
        //         e.y === storedTile.y
        //         ))  
        //     topAndBottom = this.tiles.filter(e=>e.x === storedTile.x && (
        //         e.y === storedTile.y - 2 ||
        //         e.y === storedTile.y + 2
        //         )) 
        //     console.log('2nd layer ANIMATION on tileId: ', tileId, this.tiles);
        //     console.log('leftSide: ', leftSide);
        //     console.log('rightSide: ', rightSide);
        //     console.log('topAndBottom: ', topAndBottom);
        //     const animate = () => {
        //         leftSide.forEach((e) => {
        //             this.triggerTileAnimation(e.id, color)
        //         })
        //         rightSide.forEach((e) => {
        //             this.triggerTileAnimation(e.id, color)
        //         })
        //         topAndBottom.forEach((e) => {
        //             this.triggerTileAnimation(e.id, color)
        //         }) 
        //     }
        //     setTimeout(()=>{
        //         animate();
        //     },100)
        // }

        firstLayer()
        // setTimeout(()=>{
        //     secondLayer()
        // }, 100)
        
    }

    


    // ANIMATION WRAPPERS
    this.rippleAnimation = (tileId, color = null) => {
        // this is a simple wrapper for now, in case I want to abstract this later
        this.triggerTileAnimation(tileId, color)
        this.ripple(tileId, color)
    }
    this.singleAnimation = (tileId, color = null) => {
        this.triggerTileAnimation(tileId, color)
    }
    this.crossAnimation = (tileId, color = null) => {
        this.triggerTileAnimation(tileId, color)
        this.cross(tileId, color)
    }
    this.zapBurstAnimation = async (targetTileId, sourceTileId, color = null, resolve) => {
        await this.straightLineTo(targetTileId, sourceTileId, color)
        resolve()
        this.crossAnimation(targetTileId, color)
    }
    this.zapAnimation = async (targetTileId, sourceTileId, color = null, resolve) => {
        await this.straightLineTo(targetTileId, sourceTileId, color)
        resolve();
    }
    this.beamAnimation = async (targetTileId, sourceTileId, color = null, resolve) => {
        console.log('animstion mnger beam');
        await this.straightBeamTo(targetTileId, sourceTileId, color)
        resolve();
    }
    this.narrowBeamAnimation = async (targetTileId, sourceTileId, color = null, resolve) => {
        await this.straightNarrowBeamTo(targetTileId, sourceTileId, color)
        resolve();
    }


    // UTILS
    this.pickRandom = (array) => {
        let index = Math.floor(Math.random() * array.length)
        return array[index]
    }
}