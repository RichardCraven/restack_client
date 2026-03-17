import * as images from '../utils/images'
import React from 'react';
import CanvasAxeThrow from '../components/Canvas/canvas_axe_throw';
export function AnimationManager(){
    // Animation durations (ms)
    this.animationsMatrix = {
        claw: { duration: 600 },
        sword_swing: { duration: 600 },
        spin_attack: { duration: 900 },
        dragon_punch: { duration: 700 },
        punch: { duration: 600 },
        spin_attack_arc: { duration: 800 },
        windmill: { duration: 750 }
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
        let resolvedIcon = icon;
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
        return new Promise((resolve) => {
            const data = {
                sourceTileId,
                targetTileId,
                type: animType || 'dragon_punch',
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
            }, this.animationsMatrix[animType]?.duration || 700);
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

    /**
     * Windmill — 4-direction simultaneous strike.
     *
     * Sets animationType='windmill' on the source tile (triggers the CSS burst +
     * 4 fist keyframes), then after a short delay hits every enemy that is
     * orthogonally adjacent (N / S / E / W) and triggers a hit-flash on those tiles.
     *
     * @param {object}   caller      - The Monk combatant object
     * @param {object}   combatants  - All combatants map
     * @param {function} hitCallback - Called with each enemy hit (e.g. hitsCombatant)
     * @param {number}   duration    - Total animation duration in ms (default 750)
     * @returns {Promise<object[]>}  - Resolves with array of combatants hit
     */
    this.triggerWindmill = (caller, combatants, hitCallback, duration = 750) => {
        const sourceTileId = this.getTileIdByCoords(caller.coordinates);
        const animationTile = sourceTileId !== null ? this.tiles.find(e => e.id === sourceTileId) : null;

        // Kick off the CSS animation on the source tile
        if (animationTile) {
            animationTile.animationType = 'windmill';
            animationTile.transitionType = null;
            animationTile.animationData = { duration };
            this.update();
        }

        return new Promise((resolve) => {
            // Hit window: halfway through the animation (fists reach full extension)
            const hitDelayMs = Math.round(duration * 0.6);
            setTimeout(() => {
                const { x, y } = caller.coordinates;
                const cardinals = [
                    { x, y: y - 1 }, // N
                    { x, y: y + 1 }, // S
                    { x: x + 1, y }, // E
                    { x: x - 1, y }, // W
                ];

                const hit = [];
                cardinals.forEach(tileCoords => {
                    // Hit-flash the tile
                    const tile = this.tiles.find(t => t.x === tileCoords.x && t.y === tileCoords.y);
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
                    // Damage every living enemy on this tile
                    Object.values(combatants).forEach(e => {
                        if (!e.dead && (e.isMonster || e.isMinion) &&
                            e.coordinates.x === tileCoords.x && e.coordinates.y === tileCoords.y) {
                            hit.push(e);
                            if (typeof hitCallback === 'function') hitCallback(e);
                        }
                    });
                });

                resolve(hit);
            }, hitDelayMs);

            // Clear the source tile animation after the full duration
            setTimeout(() => {
                if (animationTile) {
                    animationTile.animationType = null;
                    animationTile.transitionType = null;
                    animationTile.animationData = {};
                    this.update();
                }
            }, duration);
        });
    };

    this.magicMissile = (sourceCoords, targetCoords, variant = 'major') => {
        const ref = {
            origin: sourceCoords,
            distanceToTarget: this.getDistanceToTarget(sourceCoords, targetCoords), 
            verticalDistanceToTarget: this.getVerticalDistanceToTarget(sourceCoords, targetCoords),
            connectParticles: false,
            variant, // 'major' (purple) or 'minor' (green, fewer particles)
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

    this.minorMagicMissile = (sourceCoords, targetCoords) => {
        this.magicMissile(sourceCoords, targetCoords, 'minor');
    }
    // Magic Circle Animation: static circle of particles at midpoint between source and target
    this.magicCircle = (sourceCoords, targetCoords, options = {}) => {
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

        // Optional arrival callback: compute arrival time based on tiles to travel
        const onComplete = typeof options.onComplete === 'function' ? options.onComplete : null;
        const tilesToTravel = Math.abs(targetDistance) || 0;
        const perTileMs = typeof options.perTileMs === 'number' ? options.perTileMs : 300;
        const arrivalMs = Math.max(100, tilesToTravel * perTileMs);
        if (onComplete) {
            setTimeout(() => {
                try {
                    onComplete();
                } catch (err) {
                    console.warn('magicCircle onComplete handler threw', err);
                }
            }, arrivalMs);
        }

        setTimeout(() => {
            let e = this.canvasAnimations.find(c => c === ref);
            this.canvasAnimations = this.canvasAnimations.filter(v => v !== e);
            this.update();
        }, duration);
    }
        // Magic Triangle Animation: triangle of particles at midpoint between source and target
    this.magicTriangle = (sourceCoords, targetCoords, options = {}) => {
        console.log('MAGIC TRIANGLE ANIMATION REQUESTED, targetCoords', sourceCoords, targetCoords, options);
        // debugger
        // Center the triangle at the destination tile
        // Draw triangle at the center of the canvas, but animate canvas from origin to destination
        const numParticles = 3;
        const radius = options.radius || 4; // in tile units
        const duration = options.duration || 2500;
        // For movement animation (like magic missile)
        const origin = sourceCoords;
        const targetDistance = this.getDistanceToTarget(sourceCoords, targetCoords);
        const targetLaneDiff = this.getVerticalDistanceToTarget(sourceCoords, targetCoords);
        // The triangle is always drawn at the center of the canvas (0.5, 0.5 in tile units)
        const ref = {
            type: 'magicTriangle',
            center: { x: 0.5, y: 0.5 }, // always draw at canvas center
            radius,
            numParticles,
            duration,
            color: options.color || 'aqua',
            origin,
            // Animate canvas from origin to destination
            targetDistance,
            targetLaneDiff,
            dest: { x: targetCoords.x, y: targetCoords.y }
        };
        this.canvasAnimations.push(ref);
        this.update();
        const onComplete = typeof options.onComplete === 'function' ? options.onComplete : null;

        // Compute an arrival time (when the animated triangle should reach
        // the target) based on horizontal distance in tiles. This lets us
        // fire onComplete exactly when the visual reaches its destination
        // rather than waiting the full particle lifetime (`duration`).
        const tilesToTravel = Math.abs(targetDistance) || 0;
        const perTileMs = typeof options.perTileMs === 'number' ? options.perTileMs : 300; // ms per tile
        const arrivalMs = Math.max(100, tilesToTravel * perTileMs);

        if (onComplete) {
            setTimeout(() => {
                try {
                    onComplete();
                } catch (err) {
                    console.warn('magicTriangle onComplete handler threw', err);
                }
            }, arrivalMs);
        }

        // Remove the canvas animation after the full visual lifetime
        setTimeout(() => {
            let e = this.canvasAnimations.find(c => c === ref);
            this.canvasAnimations = this.canvasAnimations.filter(v => v !== e);
            this.update();
        }, duration);
    }
    this.fireball = (sourceCoords, targetCoords, options = {}) => {
        // Very similar to magicTriangle but renders a fireball canvas component
    const numParticles = options.numParticles || 50;
    const radius = options.radius || 1.8;
    // Make fireball noticeably faster by default (shorter visual lifetime)
    // and reduce per-tile travel time so long-range fireballs don't crawl.
    // Halve the default visual lifetime so fireball appears twice as fast by default
    const duration = options.duration || 400;
        const origin = sourceCoords;
        const targetDistance = this.getDistanceToTarget(sourceCoords, targetCoords);
        const targetLaneDiff = this.getVerticalDistanceToTarget(sourceCoords, targetCoords);
        const ref = {
            type: 'fireball',
            center: { x: 0.5, y: 0.5 },
            radius,
            numParticles,
            duration,
            color: options.color || 'red',
            origin,
            targetDistance,
            targetLaneDiff,
            dest: { x: targetCoords.x, y: targetCoords.y }
        };
        this.canvasAnimations.push(ref);
        this.update();

        const onComplete = typeof options.onComplete === 'function' ? options.onComplete : null;
        const tilesToTravel = Math.abs(targetDistance) || 0;
    // Reduce per-tile travel time to double travel speed (ms per tile)
    const perTileMs = typeof options.perTileMs === 'number' ? options.perTileMs : 60;
        const arrivalMs = Math.max(100, tilesToTravel * perTileMs);

        if (onComplete) {
            setTimeout(() => {
                try {
                    onComplete();
                } catch (err) {
                    console.warn('fireball onComplete handler threw', err);
                }
            }, arrivalMs);
        }

        // Remove after full visual lifetime
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
        // Flush any canvas animations left over from a previous session so they
        // don't bleed into the new one (e.g. a magic missile still in-flight when
        // the last combat ended).
        this.canvasAnimations = [];
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
    // Hard-reset all animation state — call this when a combat session ends so
    // stale canvas animations (missiles, fireballs, etc.) can't bleed into the
    // next session via in-flight setTimeout cleanup callbacks.
    this.reset = () => {
        this.canvasAnimations = [];
        // Clear all tile animation state too so tile-based effects don't linger
        this.tiles.forEach(t => {
            t.animationOn = false;
            t.animationType = '';
            t.animationData = {};
            t.transitionType = '';
        });
        this.update();
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
            case 'axe_throw':
                    // Diagnostic log: capture when axe_throw animation is triggered in tile animation
                    console.log('[AnimationManager] triggerTileAnimationComplex axe_throw', {
                        tile: animationTile,
                        data,
                        actor: this.currentActor,
                        tileId: sourceTileId,
                        targetTileId,
                        facing
                    });
                    // Calculate origin and target tile coordinates
                    const originCoords = this.getTileCoordsById(sourceTileId);
                    const targetCoords = this.getTileCoordsById(targetTileId);
                    // Add a canvas animation for the flying axe
                    this.canvasAnimations.push({
                        type: 'axe_throw',
                        origin: originCoords,
                        target: targetCoords
                    });
                    this.update();
                    // Remove the animation after it completes
                    setTimeout(() => {
                        this.canvasAnimations = this.canvasAnimations.filter(anim => anim.type !== 'axe_throw');
                        this.update();
                    }, this.animationsMatrix['sword_swing'].duration);
                    return;
                break;
            case 'claw':
                animationTile.animationType = `claw`;
                animationTile.transitionType = 'fade';
                animationTile.animationData = {facing, duration: this.animationsMatrix[type].duration};
                this.update();
                setTimeout(()=>{
                    animationTile.animationType = null;
                    animationTile.transitionType = null;
                    animationTile.animationData = {};
                    this.update();
                },this.animationsMatrix[type].duration)
            break;
            case 'sword_swing':
                // Diagnostic log: capture when sword_swing animation is triggered in tile animation
                console.log('[AnimationManager] triggerTileAnimationComplex sword_swing', {
                    tile: animationTile,
                    data,
                    actor: this.currentActor,
                    tileId: sourceTileId,
                    targetTileId,
                    facing
                });
                animationTile.animationType = 'sword_swing';
                animationTile.transitionType = 'fade';
                animationTile.animationData = {
                    facing,
                    duration: this.animationsMatrix[type].duration,
                    fighterType: data.fighterType,
                    attackType: data.attackType
                };
                this.update();
                setTimeout(() => {
                    animationTile.animationType = null;
                    animationTile.transitionType = null;
                    animationTile.animationData = {};
                    this.update();
                }, this.animationsMatrix[type].duration);
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
                animationTile.animationType = 'dragon_punch';
                animationTile.transitionType = 'fade';
                animationTile.animationData = {
                    icon: data.icon || images['hand_7'],
                    duration: this.animationsMatrix[type].duration,
                    facing
                };
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
    this.axeThrow = async (targetTileId, sourceTileId, facing, resolve, fighterType, attackType) => {
        const sourceTile = this.tiles.find(e => e.id === sourceTileId);
        if (!sourceTile) {
            console.log('missing source');
            debugger;
        }
        const data = {
            targetTileId,
            type: 'axe_throw',
            facing,
            sourceTileId: sourceTile.id,
            fighterType,
            attackType
        };
        this.triggerTileAnimationComplex(data);
        let tileCoords = targetTileId ? this.getTileCoordsById(targetTileId) : null;
        let collision = tileCoords ? this.checkForCollision(tileCoords) : false;
        resolve(collision);
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
        let isOnSamePlane = sourceTile.y === destinationTile.y; // eslint-disable-line no-unused-vars
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
        // Defensive: ensure source tile exists
        if (!sourceTile) {
            console.warn('clawTo: missing sourceTile for sourceTileId', sourceTileId);
            return Promise.resolve(null);
        }

        // If destination tile is missing (target may have died or be off-map),
        // still play a local 'claw' animation on the source tile and bail gracefully.
        if (!destinationTile) {
            console.warn('clawTo: destinationTile missing for targetTileId', targetTileId, ' — animating source only');
            const facing = 'right'; // default facing when target coords are unknown
            const data = {
                sourceTileId: sourceTile.id,
                targetTileId: null,
                type: 'claw',
                facing
            };
            this.triggerTileAnimationComplex(data);
            return Promise.resolve(null);
        }

        const facing = sourceTile.x > destinationTile.x ? 'left' : (
            sourceTile.x < destinationTile.x ? 'right' :
            (sourceTile.y > destinationTile.y ? 'up' : 'down')
        )
        return new Promise((resolve, reject) => {
                let distanceAway = Math.abs(sourceTile.x - destinationTile.x) // eslint-disable-line no-unused-vars
                let id = this.getTileIdByCoords({x: destinationTile.x, y: destinationTile.y})
                    const data = {
                        sourceTileId: sourceTile.id,
                        targetTileId: id,
                        type: 'claw',
                        facing
                    }
                    // need to handle attacks from above or below
                    this.triggerTileAnimationComplex(data);
                    let tileCoords = id != null ? this.getTileCoordsById(id) : null
                    let collision = null
                    try {
                        collision = (typeof this.checkForCollision === 'function' && tileCoords) ? this.checkForCollision(tileCoords) : null
                    } catch (err) {
                        console.warn('clawTo: checkForCollision threw', err)
                        collision = null
                    }
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

    /**
     * Void Lance: a dark-purple beam that travels tile-by-tile from source to
     * target, then bursts with a ripple at the impact point.
     *
     * Returns a Promise that resolves once the beam reaches the target tile.
     * The caller is responsible for applying damage after the travel time.
     *
     * @param {object} sourceCoords  { x, y }
     * @param {object} targetCoords  { x, y }
     * @returns {Promise<number>}  resolves with the travel time in ms
     */
    this.voidLance = (sourceCoords, targetCoords) => {
        return new Promise((resolve) => {
            const sourceTileId  = this.getTileIdByCoords(sourceCoords);
            const targetTileId  = this.getTileIdByCoords(targetCoords);

            if (sourceTileId === null || targetTileId === null) {
                resolve(0);
                return;
            }

            const sourceTile      = this.tiles.find(e => e.id === sourceTileId);
            const destinationTile = this.tiles.find(e => e.id === targetTileId);

            if (!sourceTile || !destinationTile) {
                resolve(0);
                return;
            }

            const sameRow     = sourceTile.y === destinationTile.y;
            const dx          = destinationTile.x - sourceTile.x;
            const dy          = destinationTile.y - sourceTile.y;
            const horizontal  = Math.abs(dx);
            const vertical    = Math.abs(dy);
            const steps       = Math.max(horizontal, vertical);

            // Build an ordered list of intermediate tile ids between source and target
            const idArray = [];
            for (let i = 1; i <= steps; i++) {
                const fx = sourceTile.x + Math.round((dx / steps) * i);
                const fy = sourceTile.y + Math.round((dy / steps) * i);
                const id = this.getTileIdByCoords({ x: fx, y: fy });
                if (id !== null) idArray.push(id);
            }

            // For a short same-lane shot (1 tile gap) there are no intermediate tiles;
            // flash the target directly after a short delay so something always plays.
            if (idArray.length === 0) idArray.push(targetTileId);

            // Speed: ~80 ms per tile feels like a fast lance
            const msPerStep = sameRow ? 80 : 100;
            let stepIndex   = 0;

            const beamInterval = setInterval(() => {
                if (stepIndex >= idArray.length) {
                    clearInterval(beamInterval);
                    // Impact burst at the target
                    this.rippleAnimation(targetTileId, 'purple');
                    resolve(steps * msPerStep);
                    return;
                }
                this.triggerTileAnimation(idArray[stepIndex], 'purple');
                stepIndex++;
            }, msPerStep);
        });
    };


    // UTILS
    this.pickRandom = (array) => {
        let index = Math.floor(Math.random() * array.length)
        return array[index]
    }
    // Render a flying axe animation using a moving canvas
    this.renderAxeThrowCanvas = (origin, target) => {
        // This method should be called from a React component context
        // Example usage: ReactDOM.render(this.renderAxeThrowCanvas(origin, target), container)
        return <CanvasAxeThrow origin={origin} target={target} />;
    }
}