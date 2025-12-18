import * as images from '../utils/images'
export function AnimationManager(){
    // Animation durations (ms)
    this.animationsMatrix = {
        claw: { duration: 600 },
        sword_swing: { duration: 600 },
        spin_attack: { duration: 900 },
        dragon_punch: { duration: 700 },
        punch: { duration: 600 },
        spin_attack_arc: { duration: 800 },
    };

    // Generic attack animation trigger for AI modules (e.g., Monk)
    this.triggerAttackAnimation = async ({ coordinates, facing, icon, type, animationType }) => {
        // Default to using 'type' as animationType if not provided
        const animType = animationType || type;
        const sourceTileId = this.getTileIdByCoords(coordinates);
        if (sourceTileId === null || sourceTileId === undefined) {
            console.warn('triggerAttackAnimation: Invalid coordinates for tile:', coordinates);
            return null;
        }
        // Set icon based on type if not provided
        console.log('ok got past the first check');
        let resolvedIcon = icon;
        console.log('resolvedIcon before switch: ', resolvedIcon);
        if (!resolvedIcon) {
            switch (type) {
                case 'dragon_punch':
                    resolvedIcon = images['scepter_white'];
                    break;
                case 'sword_swing':
                    resolvedIcon = images['sword'];
                    break;
                case 'spin_attack':
                    resolvedIcon = images['sword'];
                    break;
                // Add more cases as needed
                default:
                    resolvedIcon = undefined;
            }
        }
        // Determine the target tile based on facing
        let targetCoords = { ...coordinates };
        switch (facing) {
            case 'right':
                targetCoords.x += 1;
                break;
            case 'left':
                targetCoords.x -= 1;
                break;
            case 'up':
                targetCoords.y -= 1;
                break;
            case 'down':
                targetCoords.y += 1;
                break;
            default:
                break;
        }
        const targetTileId = this.getTileIdByCoords(targetCoords);
        console.log('about to trigger tile animation complex with:', { sourceTileId, targetTileId, type: type || 'dragon_punch' }   );
        return new Promise((resolve) => {
            const data = {
                sourceTileId,
                targetTileId,
                type: type || 'dragon_punch',
                icon: resolvedIcon,
                facing
            };
            this.triggerTileAnimationComplex(data);
            // After the animation, check for a combatant at the target tile
            setTimeout(() => {
                let combatantHit = null;
                if (typeof this.checkForCollision === 'function' && targetTileId !== null) {
                    const tileCoords = this.getTileCoordsById(targetTileId);
                    combatantHit = this.checkForCollision(tileCoords);
                }
                resolve(combatantHit);
            }, this.animationsMatrix[type]?.duration || 700);
        });
    }
    this.tiles = [];
    this.canvasAnimations = [];
    this.MAX_DEPTH = 0;
    this.TILE_SIZE = 100;

    this.connectCombatMethods = (callback) => {
        this.checkForCollision = callback;
    }
    this.animationsMatrix = {
        sword_swing: {
            duration: 500
        },
        claw: {
            duration: 500
        },
        spin_attack: {
            duration: 800
        },
        dragon_punch: {
            duration: 700
        }
    }
    this.spinAttack = (sourceTileId, resolve) => {
        const animationTile = this.tiles.find(e=>e.id === sourceTileId);
        if (!animationTile) return;

        animationTile.animationType = 'spin_attack';
        animationTile.transitionType = 'spin';
        animationTile.animationData = {
            icon: images['sword'], // use your sword icon
            duration: 800 // ms, adjust as needed
        };
        this.update();

        setTimeout(() => {
            animationTile.animationType = null;
            animationTile.transitionType = null;
            animationTile.animationData = {};
            this.update();
            if (resolve) resolve();
        }, 800);
    }

    this.arcAttack = (arcTiles, sourceTileId, combatants, hitCallback, duration = 800) => {
        const animationTile = this.tiles.find(e => e.id === sourceTileId);
        if (!animationTile) return;
        animationTile.tileSize = this.TILE_SIZE;
        animationTile.animationType = 'spin_attack_arc';
        animationTile.transitionType = 'arc';
        animationTile.animationData = {
            arcTiles,
            currentFrame: 0,
            duration,
            frameDuration: duration / arcTiles.length
        };
        this.update();

        // For hit-flash: mark each tile hit for 0.5s
        const markHitFlashTile = (coords) => {
            const tile = this.tiles.find(e => e.x === coords.x && e.y === coords.y);
            if (tile) {
                tile.animationType = 'hit-flash';
                this.update();
                setTimeout(() => {
                    if (tile.animationType === 'hit-flash') {
                        tile.animationType = null;
                        this.update();
                    }
                }, 500);
            }
        };

        let frame = 0;
        const animateStep = () => {
            frame++;
            if (frame < arcTiles.length) {
                animationTile.animationData.currentFrame = frame;
                this.update();

                // --- HIT LOGIC ---
                const tile = arcTiles[frame];
                markHitFlashTile(tile);
                if (combatants && hitCallback) {
                    // Find all enemies on this tile (in case of multiple units per tile)
                    const enemies = Object.values(combatants).filter(e =>
                        !e.dead &&
                        e.coordinates.x === tile.x &&
                        e.coordinates.y === tile.y
                    );
                    enemies.forEach(enemy => hitCallback(enemy));
                }
                // --- END HIT LOGIC ---

                setTimeout(animateStep, animationTile.animationData.frameDuration);
            } else {
                animationTile.animationType = null;
                animationTile.transitionType = null;
                animationTile.animationData = {};
                this.update();
            }
        };
        setTimeout(animateStep, animationTile.animationData.frameDuration);
    };
    // this.arcAttack = (arcTiles, sourceTileId, duration = 800) => {
    //     const animationTile = this.tiles.find(e => e.id === sourceTileId);
    //     if (!animationTile) return;

    //     // Store arc path and start at frame 0
    //     animationTile.animationType = 'spin_attack_arc';
    //     animationTile.transitionType = 'arc';
    //     animationTile.animationData = {
    //         arcTiles,           // Array of {x, y}
    //         currentFrame: 0,    // Start at first tile
    //         duration,
    //         frameDuration: duration / arcTiles.length
    //     };
    //     this.update();

    //     // Animate the sword moving along the arc
    //     let frame = 0;
    //     const animateStep = () => {
    //         frame++;
    //         if (frame < arcTiles.length) {
    //             animationTile.animationData.currentFrame = frame;
    //             this.update();
    //             setTimeout(animateStep, animationTile.animationData.frameDuration);
    //         } else {
    //             // End animation
    //             animationTile.animationType = null;
    //             animationTile.transitionType = null;
    //             animationTile.animationData = {};
    //             this.update();
    //         }
    //     };
    //     setTimeout(animateStep, animationTile.animationData.frameDuration);
    // };
    // ^ 2nd iteration

    // this.arcAttack = (arcTiles, duration = 2800) => {
    //     arcTiles.forEach(coords => {
    //         const tile = this.tiles.find(e => e.x === coords.x && e.y === coords.y);
    //         if (!tile) return;
    //         tile.animationType = 'spin_attack_arc';
    //         tile.transitionType = 'arc';
    //         tile.animationData = {
    //             duration
    //         };
    //     });
    //     this.update();
    //     setTimeout(() => {
    //         arcTiles.forEach(coords => {
    //             const tile = this.tiles.find(e => e.x === coords.x && e.y === coords.y);
    //             if (!tile) return;
    //             tile.animationType = null;
    //             tile.transitionType = null;
    //             tile.animationData = {};
    //         });
    //         this.update();
    //     }, duration);
    // }
    this.magicMissile = (sourceCoords, targetCoords) => {
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
    // Magic Circle Animation: static circle of particles at midpoint between source and target
    this.magicCircle = (sourceCoords, targetCoords, options = {}) => {
        console.log('in magic circle with sourceCoords, targetCoords:', sourceCoords, targetCoords);
        // Calculate midpoint between source and target
        const midX = (sourceCoords.x + targetCoords.x) / 2;
        const midY = (sourceCoords.y + targetCoords.y) / 2;
        // Circle parameters
        const numParticles = options.numParticles || 12;
        const radius = options.radius || 4; // in tile units
        const duration = options.duration || 2500;
        // For movement animation (like magic missile)
        const origin = sourceCoords;
        const targetDistance = this.getDistanceToTarget(sourceCoords, targetCoords);
        const targetLaneDiff = this.getVerticalDistanceToTarget(sourceCoords, targetCoords);
        const ref = {
            type: 'magicCircle',
            center: { x: midX, y: midY },
            radius,
            numParticles,
            duration,
            color: options.color || 'aqua',
            origin,
            targetDistance,
            targetLaneDiff
        };
        this.canvasAnimations.push(ref);
        this.update();
        setTimeout(() => {
            let e = this.canvasAnimations.find(c => c === ref);
            this.canvasAnimations = this.canvasAnimations.filter(v => v !== e);
            this.update();
        }, duration);
    }
        // Magic Triangle Animation: triangle of particles at midpoint between source and target
    this.magicTriangle = (sourceCoords, targetCoords, options = {}) => {
        // Calculate midpoint between source and target
        const midX = (sourceCoords.x + targetCoords.x) / 2;
        const midY = (sourceCoords.y + targetCoords.y) / 2;
        // Triangle parameters
        const numParticles = 3;
        const radius = options.radius || 4; // in tile units
        const duration = options.duration || 2500;
        // For movement animation (like magic missile)
        const origin = sourceCoords;
        const targetDistance = this.getDistanceToTarget(sourceCoords, targetCoords);
        const targetLaneDiff = this.getVerticalDistanceToTarget(sourceCoords, targetCoords);
        const ref = {
            type: 'magicTriangle',
            center: { x: midX, y: midY },
            radius,
            numParticles,
            duration,
            color: options.color || 'aqua',
            origin,
            targetDistance,
            targetLaneDiff
        };
        this.canvasAnimations.push(ref);
        this.update();
        setTimeout(() => {
            let e = this.canvasAnimations.find(c => c === ref);
            this.canvasAnimations = this.canvasAnimations.filter(v => v !== e);
            this.update();
        }, duration);
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
        let arr = [];
        // Use row-major order: id = y * MAX_DEPTH + x
        for (let y = 0; y < MAX_ROWS; y++) {
            for (let x = 0; x < MAX_DEPTH; x++) {
                let id = y * MAX_DEPTH + x;
                arr.push({
                    id,
                    x,
                    y,
                    animationOn: false,
                    animationType: '',
                    animationData: {},
                    animationtransitionType: '',
                    handleClick: this.handleTileClick
                });
            }
        }
        this.tiles = arr;
        this.update();
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
    this.triggerTileAnimationComplex = (data) => {
        console.log('**** TRIGGERED ANIMATION COMPLEX ****', data);
        const targetTileId = data.targetTileId, type = data.type, facing = data.facing;
        const sourceTileId = data.sourceTileId;
        let animationTile = this.tiles.find(e=>e.id === sourceTileId);
        // PUNCH animation: move fist from source to target and fade out
        if(type === 'punch') {
            const duration = this.animationsMatrix['punch']?.duration || 600;
            animationTile.animationType = 'punch';
            animationTile.transitionType = 'move-fade';
            // Calculate pixel positions for from/to (center of tiles)
            const tileSize = this.TILE_SIZE;
            const from = { x: 0, y: 0 };
            const to = { x: 0, y: 0 };
            let sourceTileX = 0, sourceTileY = 0;
            if(animationTile && typeof animationTile.x === 'number' && typeof animationTile.y === 'number') {
                from.x = animationTile.x * tileSize + tileSize/2;
                from.y = animationTile.y * tileSize + tileSize/2;
                sourceTileX = animationTile.x;
                sourceTileY = animationTile.y;
            }
            const targetTile = this.tiles.find(e=>e.id === targetTileId);
            if(targetTile && typeof targetTile.x === 'number' && typeof targetTile.y === 'number') {
                to.x = targetTile.x * tileSize + tileSize/2;
                to.y = targetTile.y * tileSize + tileSize/2;
            }
            animationTile.animationData = {
                icon: data.icon || images['fist_punch'],
                duration,
                from,
                to,
                progress: 0,
                sourceTileX,
                sourceTileY
            };
            this.update();
            // Animate progress from 0 to 1
            let start = null;
            const step = (timestamp) => {
                if (!start) start = timestamp;
                const elapsed = timestamp - start;
                const progress = Math.min(elapsed / duration, 1);
                animationTile.animationData.progress = progress;
                this.update();
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    animationTile.animationType = null;
                    animationTile.transitionType = null;
                    animationTile.animationData = {};
                    this.update();
                }
            };
            requestAnimationFrame(step);
            return;
        }
        switch(type){
            case 'claw':
                animationTile.animationType = `claw`;
                animationTile.transitionType = 'fade';
                animationTile.animationData = {facing: data.facing, duration: this.animationsMatrix[type].duration};
                this.update();
                setTimeout(()=>{
                    animationTile.animationType = null;
                    animationTile.transitionType = null;
                    animationTile.animationData = {};
                    this.update();
                },this.animationsMatrix[type].duration)
            break;
            case 'sword_swing':
                animationTile.animationType = 'sword_swing';
                animationTile.transitionType = 'fade';
                animationTile.animationData = {facing: data.facing, duration: this.animationsMatrix[type].duration};
                this.update();
                setTimeout(()=>{
                    animationTile.animationType = null;
                    animationTile.transitionType = null;
                    animationTile.animationData = {};
                    this.update();
                },this.animationsMatrix[type].duration)
            break;
            case 'spin_attack':
                animationTile.animationType = 'spin_attack';
                animationTile.transitionType = 'spin';
                animationTile.animationData = {
                    icon: data.icon || images['sword'],
                    duration: this.animationsMatrix[type].duration,
                };
                this.update();
                setTimeout(()=>{
                    animationTile.animationType = null;
                    animationTile.transitionType = null;
                    animationTile.animationData = {};
                    this.update();
                }, this.animationsMatrix[type].duration)
            break;
            case 'dragon_punch':
                console.log('animation complex, dragon_punch case');
                animationTile.animationType = 'dragon_punch';
                animationTile.transitionType = 'fade';
                animationTile.animationData = {
                    icon: data.icon || images['scepter_white'],
                    duration: this.animationsMatrix[type].duration,
                    facing: data.facing
                };
                console.log('animationTile: ', animationTile);
                this.update();
                setTimeout(()=>{
                    animationTile.animationType = null;
                    animationTile.transitionType = null;
                    animationTile.animationData = {};
                    this.update();
                }, this.animationsMatrix[type].duration)
            break;
            case 'spin_attack_arc':
                animationTile.animationType = 'spin_attack_arc';
                animationTile.transitionType = 'arc';
                animationTile.animationData = {
                    arcTiles: data.arcTiles,
                    duration: data.duration || this.animationsMatrix['spin_attack'].duration
                };
                this.update();
                setTimeout(()=>{
                    animationTile.animationType = null;
                    animationTile.transitionType = null;
                    animationTile.animationData = {};
                    this.update();
                }, animationTile.animationData.duration);
            break;
            default:
                console.log('animation not properly specified... INVESTIGATE');
                break;

        }
    }
    this.triggerTileAnimation_line = (tileId, color = null) => {
        this.tileOn(tileId, 'line', color);
        setTimeout(()=>{
            this.tileOff(tileId)
        }, 1000)
    }
    this.tileOn = (tileId, animationType, color = null) => {
        const animationTile = this.tiles.find(e=>e.id === tileId)
        animationTile.animationType = animationType;
        animationTile.transitionType = color ? `${color}-fade` : 'red-fade';
        this.update();
    }
    this.tileOff = (tileId) => {
        const animationTile = this.tiles.find(e=>e.id === tileId)
        animationTile.transitionType = ''
        animationTile.animationType = ''
        this.update();
    }

    // ANIMATION METHODS
    this.ripple = (tileId, color = null) => {
        const animationTile = this.tiles.find(e=>e.id === tileId)
        const leftSide = this.tiles.filter(e=>e.x === animationTile.x - 1 && (
            e.y === animationTile.y ||
            e.y === animationTile.y - 1 ||
            e.y === animationTile.y + 1
            ))  
        const rightSide = this.tiles.filter(e=>e.x === animationTile.x + 1 && (
            e.y === animationTile.y ||
            e.y === animationTile.y - 1 ||
            e.y === animationTile.y + 1
            ))  
        const topAndBottom = this.tiles.filter(e=>e.x === animationTile.x && (
            e.y === animationTile.y - 1 ||
            e.y === animationTile.y + 1
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
                    }, 100 + (distanceAway * 5))
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
                    }, 10 + (distanceAway * 5))
                }
            }
        })
    }
    this.straightBeamNoTarget = (sourceTileId, direction, color = null, resolve) => {
        const sourceTile = this.tiles.find(e=>e.id === sourceTileId)
        const maxX = this.MAX_DEPTH-1;
        let newCoords
        if(direction === 'left-to-right'){
            newCoords = {x: maxX, y: sourceTile.y}
        } else if(direction === "right-to-left"){
            newCoords = {x: 0, y: sourceTile.y}
        }
        let destinationTileId = this.getTileIdByCoords(newCoords)
        let destinationTile = this.tiles[destinationTileId]
        let isOnSamePlane = sourceTile.y === destinationTile.y;
        return new Promise(() => {
                let distanceAway = Math.abs(sourceTile.x - destinationTile.x)
                if(sourceTile.x > destinationTile.x && direction === 'right-to-left'){
                    let sourceX = sourceTile.x
                    let idArray = [];
                    for(let i = sourceX -1; i >= destinationTile.x; i--){
                        let id = this.getTileIdByCoords({x: i, y: destinationTile.y})
                        idArray.push(id)
                    }
                    
                    const lineInterval = setInterval(()=>{
                        if(idArray.length === 0){
                            clearInterval(lineInterval);
                            resolve(false);
                        } else {
                            let id = idArray.shift();
                            let tileCoords = this.getTileCoordsById(id)
                            let collision = this.checkForCollision(tileCoords)

                            this.triggerTileAnimation(id, color);
                            if(collision){
                                clearInterval(lineInterval);
                                resolve(collision);
                            }
                        }
                    }, 10 + (distanceAway * 5))
                }
                if(sourceTile.x < destinationTile.x && direction === 'left-to-right'){
                    let sourceX = sourceTile.x
                    let idArray = [];
                    for(let i = sourceX + 1; i < destinationTile.x+1; i++){
                        let id = this.getTileIdByCoords({x: i, y: destinationTile.y})
                        idArray.push(id)
                    }
                    const lineInterval = setInterval(()=>{
                        if(idArray.length === 0){
                            clearInterval(lineInterval);
                            resolve(false);
                        } else {
                            let id = idArray.shift();
                            let tileCoords = this.getTileCoordsById(id)
                            let collision = this.checkForCollision(tileCoords)
                            // collision is a combatant object
                            this.triggerTileAnimation(id, color);
                            if(collision){
                                clearInterval(lineInterval);
                                resolve(collision);
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
            }
        })
    }
    this.clawTo = (targetTileId, sourceTileId) => {
        const sourceTile = this.tiles.find(e=>e.id === sourceTileId)
        const destinationTile = this.tiles.find(e=>e.id === targetTileId)
        if(!sourceTile || !destinationTile){
            debugger
        }
        const facing = sourceTile.x > destinationTile.x ? 'left' : (
            sourceTile.x < destinationTile.x ? 'right' :
            (sourceTile.y > destinationTile.y ? 'up' : 'down')
        )
        return new Promise((resolve, reject) => {
                let distanceAway = Math.abs(sourceTile.x - destinationTile.x)
                let id = this.getTileIdByCoords({x: destinationTile.x, y: destinationTile.y})
                    const data = {
                        sourceTileId: sourceTile.id,
                        targetTileId: id,
                        type: 'claw',
                        facing
                    }
                    // need to handle attacks from above or below
                    this.triggerTileAnimationComplex(data);
                    let tileCoords = this.getTileCoordsById(id)
                    let collision = this.checkForCollision(tileCoords)
                    resolve(collision);
            // }
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
        const animationTile = this.tiles.find(e=>e.id === tileId)
        let leftSide, rightSide, topAndBottom;

        const firstLayer = () => {
            leftSide = this.tiles.filter(e=>e.x === animationTile.x - 1 && (
                e.y === animationTile.y
                ))  
            rightSide = this.tiles.filter(e=>e.x === animationTile.x + 1 && (
                e.y === animationTile.y
                ))  
            topAndBottom = this.tiles.filter(e=>e.x === animationTile.x && (
                e.y === animationTile.y - 1 ||
                e.y === animationTile.y + 1
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
        //     leftSide = this.tiles.filter(e=>e.x === animationTile.x - 2 && (
        //         e.y === animationTile.y
        //         ))  
        //     rightSide = this.tiles.filter(e=>e.x === animationTile.x + 2 && (
        //         e.y === animationTile.y
        //         ))  
        //     topAndBottom = this.tiles.filter(e=>e.x === animationTile.x && (
        //         e.y === animationTile.y - 2 ||
        //         e.y === animationTile.y + 2
        //         )) 
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
    this.clawToTarget = async (targetTileId, sourceTileId, resolve) => {
        let hit = await this.clawTo(targetTileId, sourceTileId)
        resolve(hit)
    }
    this.swordSwing = async (targetTileId, sourceTileId, facing, resolve) => {
        const sourceTile = this.tiles.find(e=>e.id === sourceTileId)
        // const destinationTile = this.tiles.find(e=>e.id === targetTileId)
        if(!sourceTile){
            console.log('missing source');
            debugger
        }
        return new Promise(() => {
            const data = {
                targetTileId,
                type: 'sword_swing',
                facing,
                sourceTileId: sourceTile.id
            }
            this.triggerTileAnimationComplex(data)
            //target tile ID can be null if they are facing left at the left edge
            // ...not entirely sure when this would happen
            let tileCoords = targetTileId ? this.getTileCoordsById(targetTileId) : null;
            let collision = tileCoords ? this.checkForCollision(tileCoords) : false;
            resolve(collision);
        })
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