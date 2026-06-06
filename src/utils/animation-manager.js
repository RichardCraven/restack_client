
import * as images from '../utils/images';

export function AnimationManager(){
    // ...existing code...

    // Canvas-based claw swipe animation (for Skeleton and claw attacks)
    this.clawSwipe = (targetTileId, sourceTileId, facing, resolve) => {
        const originCoords = this.getTileCoordsById(sourceTileId);
        const targetCoords = this.getTileCoordsById(targetTileId);

        if (originCoords && targetCoords) {
            const animId = `claw_swipe_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            const duration = 500;
            const canvasAnim = {
                id: animId,
                type: 'claw_swipe',
                origin: originCoords,
                target: targetCoords,
                facing: facing || 'left',
                duration,
                tracer: false,
                onComplete: () => {
                    const idx = this.canvasAnimations.findIndex(a => a.id === animId);
                    if (idx !== -1) {
                        this.canvasAnimations.splice(idx, 1);
                        this.update();
                    }
                    if (resolve) resolve();
                }
            };
            this.canvasAnimations.push(canvasAnim);
            this.update();
            setTimeout(() => {
                if (canvasAnim.onComplete) {
                    const cb = canvasAnim.onComplete;
                    canvasAnim.onComplete = null;
                    cb();
                }
            }, duration);
        } else {
            if (resolve) resolve();
        }
    };

    this.axeSwing = (targetTileId, sourceTileId, facing, resolve) => {
        const animationTile = this.tiles.find(e => e.id === sourceTileId);
        if (!animationTile) return;
        // Diagnostic log: trace axeSwing animation trigger
        console.log('[AnimationManager] axeSwing animation triggered', {
            tile: animationTile,
            targetTileId,
            sourceTileId,
            facing
        });
        const duration = 600; // ms — matches sword_swing for consistent feel
        animationTile.animationType = 'axe_swing';
        animationTile.transitionType = 'swing';
        animationTile.animationData = {
            icon: images['axe_white'],
            facing,
            duration,
            startTime: Date.now()
        };
        this.update();
        setTimeout(() => {
            animationTile.animationType = null;
            animationTile.transitionType = null;
            animationTile.animationData = {};
            this.update();
            if (resolve) {
                const tileCoords = targetTileId ? this.getTileCoordsById(targetTileId) : null;
                const collision = tileCoords ? this.checkForCollision(tileCoords) : null;
                resolve(collision);
            }
        }, duration);
    }
    // Animation durations (ms)
    // Animation type separation:
    // - tile: tile-based animation (fixed duration, affects board tiles)
    // - canvas: canvas-based animation (dynamic duration, rendered in overlay/canvas)
    this.animationsMatrix = {
        sword_swing: { duration: 600, animationType: 'canvas' },
        spin_attack: { duration: 900, animationType: 'tile' },
        dragon_punch: { duration: 700, animationType: 'tile' },
        punch: { duration: 600, animationType: 'tile' },
        spin_attack_arc: { duration: 800, animationType: 'tile' },
        windmill: { duration: 750, animationType: 'tile' },
        whirlwind: { duration: 650, animationType: 'canvas' },
        axe_swing: { duration: 600, animationType: 'tile' },
        axe_throw: { duration: 1200, animationType: 'canvas' },
        grasp: { duration: 600, animationType: 'canvas' },
        energy_drain: { duration: 1400, animationType: 'tile' },
        bite: { duration: 600, animationType: 'canvas' },
        tackle: { duration: 600, animationType: 'canvas' },
        crush: { duration: 600, animationType: 'canvas' },
        reassembly: { duration: 600, animationType: 'tile' },
        acid_blast: { duration: 600, animationType: 'tile' },
        sleep: { duration: 600, animationType: 'tile' },
        claw_strike: { duration: 600, animationType: 'tile' },
        shield_slam: { duration: 600, animationType: 'tile' },
        vortex: { duration: 600, animationType: 'tile' },
        induce_fear: { duration: 600, animationType: 'tile' },
        defensive_stance: { duration: 600, animationType: 'tile' },
        shield_wall: { duration: 600, animationType: 'tile' },
        cleave: { duration: 600, animationType: 'tile' },
        leap_attack: { duration: 600, animationType: 'tile' },
        disintegrate: { duration: 600, animationType: 'tile' },
        one_man_army: { duration: 600, animationType: 'tile' },
        inspire: { duration: 600, animationType: 'tile' },
        annihilation: { duration: 600, animationType: 'tile' },
        berserker: { duration: 600, animationType: 'tile' }
    };

    this._handIconKeys = Array.from({ length: 22 }, (_, i) => `hand_${i + 1}`);
    this.getRandomHandIcon = () => {
        const key = this._handIconKeys[Math.floor(Math.random() * this._handIconKeys.length)];
        return images[key] || images['fist_punch'];
    };
    this.getRandomHandIcons = (count = 1) => {
        return Array.from({ length: Math.max(1, count) }, () => this.getRandomHandIcon());
    };

    // Generic attack animation trigger for AI modules (e.g., Monk)
    this.triggerAttackAnimation = async (data) => {
        // Default to using 'type' as animationType if not provided
        const animType = data.animationType || data.type;
        const sourceTileId = this.getTileIdByCoords(data.coordinates);
        if (sourceTileId === null || sourceTileId === undefined) {
            console.warn('triggerAttackAnimation: Invalid coordinates for tile:', data.coordinates);
            return null;
        }
        // Set icon based on type if not provided
        let resolvedIcon = data.icon;
        if (!resolvedIcon) {
            switch (data.type) {
                case 'dragon_punch':
                case 'punch':
                    resolvedIcon = this.getRandomHandIcon();
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
        let targetCoords = { ...data.coordinates };
        switch (data.facing) {
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
            const matrixEntry = this.animationsMatrix[animType] || { duration: 700, animationType: 'tile' };
            const duration = matrixEntry.duration || 700;

            if (matrixEntry.animationType === 'canvas') {
                const animId = `canvas_anim_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
                const canvasAnim = {
                    id: animId,
                    type: 'physical_attack', // Generic canvas type we just added to AnimationGrid
                    origin: data.coordinates,
                    target: targetCoords,
                    icon: resolvedIcon || images[animType],
                    duration,
                    facing: data.facing,
                    onComplete: () => {
                        const idx = this.canvasAnimations.findIndex(a => a.id === animId);
                        if (idx !== -1) {
                            this.canvasAnimations.splice(idx, 1);
                            this.update();
                        }
                    }
                };
                this.canvasAnimations.push(canvasAnim);
                this.update();
            } else {
                const animData = {
                    sourceTileId,
                    targetTileId,
                    type: animType || 'dragon_punch',
                    icon: resolvedIcon,
                    facing: data.facing,
                    selectedAction: data.selectedAction
                };
                this.triggerTileAnimationComplex(animData);
            }

            // After the animation, check for a combatant at the target tile
            setTimeout(() => {
                let combatantHit = null;
                if (typeof this.checkForCollision === 'function' && targetTileId !== null) {
                    const tileCoords = this.getTileCoordsById(targetTileId);
                    combatantHit = this.checkForCollision(tileCoords);
                }
                resolve(combatantHit);
            }, duration);
        });
    }
    this.tiles = [];
    this.canvasAnimations = [];
    this.MAX_DEPTH = 0;
    this.TILE_SIZE = 100;

    this.connectCombatMethods = (callback) => {
        this.checkForCollision = callback;
    }
    // this.animationsMatrix = {
    //     sword_swing: {
    //         duration: 500
    //     },
    //     spin_attack: {
    //         duration: 800
    //     },
    //     dragon_punch: {
    //         duration: 700
    //     }
    // }
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
            animationTile.animationData = {
                duration,
                handIcons: this.getRandomHandIcons(4)
            };
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

    /**
     * Whirlwind — canvas spin around the caller that hits all adjacent enemies once.
     * Adjacent means the 8 surrounding tiles (orthogonal + diagonal).
     */
    this.triggerWhirlwind = (caller, combatants, hitCallback, duration = 650) => {
        const origin = caller && caller.coordinates
            ? { x: caller.coordinates.x, y: caller.coordinates.y }
            : null;
        if (!origin) return Promise.resolve([]);

        const animId = `whirlwind_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const whirlwindAnim = {
            id: animId,
            type: 'whirlwind',
            animationType: 'canvas',
            origin,
            duration,
            onComplete: null,
        };

        return new Promise((resolve) => {
            let hitFired = false;

            const hitOnce = () => {
                if (hitFired) return;
                hitFired = true;

                const hit = [];
                const { x, y } = origin;
                const surroundings = [
                    { x, y: y - 1 },
                    { x: x + 1, y: y - 1 },
                    { x: x + 1, y },
                    { x: x + 1, y: y + 1 },
                    { x, y: y + 1 },
                    { x: x - 1, y: y + 1 },
                    { x: x - 1, y },
                    { x: x - 1, y: y - 1 },
                ];

                const seen = new Set();
                Object.values(combatants || {}).forEach((e) => {
                    if (!e || e.dead || !e.coordinates || !e.id || seen.has(e.id)) return;
                    if (!(e.isMonster || e.isMinion) || e.isVCT) return;
                    const adjacent = surroundings.some((s) => s.x === e.coordinates.x && s.y === e.coordinates.y);
                    if (!adjacent) return;
                    seen.add(e.id);
                    hit.push(e);
                    if (typeof hitCallback === 'function') hitCallback(e);
                });
                return hit;
            };

            whirlwindAnim.onComplete = () => {
                const idx = this.canvasAnimations.findIndex((a) => a.id === animId);
                if (idx !== -1) {
                    this.canvasAnimations.splice(idx, 1);
                    this.update();
                }
                const hit = hitOnce() || [];
                resolve(hit);
            };

            this.canvasAnimations.push(whirlwindAnim);
            this.update();

            // Sync impact to mid-animation, then guarantee completion cleanup.
            setTimeout(() => { hitOnce(); }, Math.round(duration * 0.55));
            setTimeout(() => {
                if (whirlwindAnim.onComplete) {
                    const cb = whirlwindAnim.onComplete;
                    whirlwindAnim.onComplete = null;
                    cb();
                }
            }, duration);
        });
    };

    this.magicMissile = (sourceCoords, targetCoords, variant = 'major', options = {}) => {
        const ref = {
            id: `magic_missile_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type: 'magicMissile',
            origin: sourceCoords,
            distanceToTarget: this.getDistanceToTarget(sourceCoords, targetCoords), 
            verticalDistanceToTarget: this.getVerticalDistanceToTarget(sourceCoords, targetCoords),
            connectParticles: false,
            variant, // 'major' (purple) or 'minor' (green, fewer particles)
            target: targetCoords ? { x: targetCoords.x, y: targetCoords.y } : null,
            getCurrentTargetCoords: typeof options.getCurrentTargetCoords === 'function' ? options.getCurrentTargetCoords : null,
        };
        this.canvasAnimations.push(ref)
        this.update();
        setTimeout(()=>{
            const idx = this.canvasAnimations.findIndex(anim => anim.id === ref.id);
            if (idx !== -1) {
                this.canvasAnimations.splice(idx, 1);
                // if(this.state.selectedFighter) this.props.combatManager.unlockFighter(this.state.selectedFighter.id)
                this.update();
            }
        }, 2500)
        // ^ travel time + 1 second of damage animation
    }

    this.minorMagicMissile = (sourceCoords, targetCoords, options = {}) => {
        this.magicMissile(sourceCoords, targetCoords, 'minor', options);
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
            id: `magic_circle_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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
            const idx = this.canvasAnimations.findIndex(anim => anim.id === ref.id);
            if (idx !== -1) {
                this.canvasAnimations.splice(idx, 1);
                this.update();
            }
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
            id: `magic_triangle_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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
            const idx = this.canvasAnimations.findIndex(anim => anim.id === ref.id);
            if (idx !== -1) {
                this.canvasAnimations.splice(idx, 1);
                this.update();
            }
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
            id: `fireball_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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
            const idx = this.canvasAnimations.findIndex(anim => anim.id === ref.id);
            if (idx !== -1) {
                this.canvasAnimations.splice(idx, 1);
                this.update();
            }
        }, duration);
    }
    this.triggerJaggedCircle = (targetCoords, options = {}) => {
        if (!targetCoords || typeof targetCoords.x !== 'number' || typeof targetCoords.y !== 'number') return;

        const ref = {
            id: `jagged_circle_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type: 'jaggedCircle',
            origin: options.origin && typeof options.origin.x === 'number' && typeof options.origin.y === 'number'
                ? { x: options.origin.x, y: options.origin.y }
                : { x: targetCoords.x, y: targetCoords.y },
            target: { x: targetCoords.x, y: targetCoords.y },
            duration: options.duration || 900,
            travelDuration: options.travelDuration || 260,
            lingerDuration: options.lingerDuration || 520,
            color: options.color || '#9f5cff',
            accentColor: options.accentColor || '#f06bff',
            radius: options.radius || 0.48,
            jaggedness: options.jaggedness || 0.18,
            rotationSpeed: options.rotationSpeed || 0.0045,
            lineWidth: options.lineWidth || 4,
        };

        this.canvasAnimations.push(ref);
        this.update();

        setTimeout(() => {
            const idx = this.canvasAnimations.findIndex((anim) => anim.id === ref.id);
            if (idx !== -1) {
                this.canvasAnimations.splice(idx, 1);
                this.update();
            }
        }, ref.duration);
    }
    this.triggerPsionicBurnCircle = (targetCoords, originCoords = null) => {
        this.triggerJaggedCircle(targetCoords, {
            origin: originCoords || targetCoords,
            duration: 900,
            travelDuration: 240,
            lingerDuration: 600,
            color: '#8b5cf6',
            accentColor: '#f472b6',
            radius: 0.43,
            jaggedness: 0.16,
            rotationSpeed: 0.0055,
            lineWidth: 3,
        });
    }
    this.triggerObliterateCircle = (targetCoords, originCoords = null) => {
        this.triggerJaggedCircle(targetCoords, {
            origin: originCoords || targetCoords,
            duration: 1100,
            travelDuration: 280,
            lingerDuration: 760,
            color: '#ff8c42',
            accentColor: '#ffe08a',
            radius: 0.52,
            jaggedness: 0.22,
            rotationSpeed: 0.0018,
            lineWidth: 4,
        });
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
        if (!coords || typeof coords.x !== 'number' || typeof coords.y !== 'number') return null;
        let tile = this.tiles.find(e=>e.x === coords.x && e.y === coords.y)
        return tile ? tile.id : null
    }
    this.getTileCoordsById = (id) => {
        let tile = this.tiles.find(e=>e.id === id)
        return tile ? {x: tile.x, y: tile.y} : null
    }


    this.initialize = (MAX_DEPTH, MAX_ROWS) => {
        this.MAX_DEPTH = MAX_DEPTH;
        // Only clear canvasAnimations if a full session reset is intended.
        // this.canvasAnimations = [];
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
        // Full session reset: clear all canvas animations
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
                icon: data.icon || this.getRandomHandIcon(),
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
                    // Calculate origin and target tile coordinates
                    const originCoords = this.getTileCoordsById(sourceTileId);
                    const targetCoords = this.getTileCoordsById(targetTileId);
                    // Add a canvas animation for the flying axe with a unique id
                    const axeAnimId = `axe_throw_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
                    // Calculate duration based on origin/target distance and speed (match CanvasAxeThrow logic)
                    const axeAnim = {
                        id: axeAnimId,
                        type: 'axe_throw',
                        animationType: 'canvas',
                        origin: originCoords,
                        target: targetCoords,
                        onComplete: null  // set below so the closure captures axeAnim
                    };
                    axeAnim.onComplete = () => {
                        // Guard against double-fire (same pattern as clawSwipe)
                        if (!axeAnim.onComplete) return;
                        axeAnim.onComplete = null;
                        // Remove the canvas animation
                        const idx = this.canvasAnimations.findIndex(anim => anim.id === axeAnimId);
                        if (idx !== -1) {
                            this.canvasAnimations.splice(idx, 1);
                            this.update();
                        }
                        // Trigger a hit-flash effect on the target tile
                        const hitTileId = this.getTileIdByCoords(targetCoords);
                        if (hitTileId !== null && hitTileId !== undefined) {
                            const hitTile = this.tiles.find(e => e.id === hitTileId);
                            if (hitTile) {
                                hitTile.animationType = 'hit-flash';
                                hitTile.transitionType = 'fade';
                                hitTile.animationData = { axeThrowHit: true, duration: 500 };
                                this.update();
                                setTimeout(() => {
                                    hitTile.animationType = null;
                                    hitTile.transitionType = null;
                                    hitTile.animationData = {};
                                    this.update();
                                }, 500);
                            }
                        }
                        // Resolve hit/miss — check who is standing on the target tile NOW
                        // (after the axe has visually arrived, matching clawSwipe architecture)
                        if (axeAnim._resolve) {
                            const tileCoords = this.getTileCoordsById(hitTileId);
                            const collision = tileCoords ? this.checkForCollision(tileCoords) : null;
                            axeAnim._resolve(collision);
                            axeAnim._resolve = null;
                        }
                    };
                    this.canvasAnimations.push(axeAnim);
                    this.update();
                    return;
            case 'grasp': {
                let isGif = false;
                let icon = undefined;
                if (data && data.selectedAction) {
                    isGif = !!data.selectedAction.isGif;
                    icon = data.selectedAction.icon;
                }
                animationTile.animationType = 'grasp';
                animationTile.transitionType = 'fade';
                animationTile.animationData = {
                    facing,
                    startTime: Date.now(),
                    duration: this.animationsMatrix[type]?.duration || 900,
                    isGif,
                    icon
                };
                this.update();
                setTimeout(()=>{
                    animationTile.animationType = null;
                    animationTile.transitionType = null;
                    animationTile.animationData = {};
                    this.update();
                }, this.animationsMatrix[type]?.duration || 900);
            }
            break;
            case 'energy_drain': {
                const drainDuration = this.animationsMatrix['energy_drain']?.duration || 900;
                animationTile.animationType = 'energy_drain';
                animationTile.transitionType = 'fade';
                animationTile.animationData = {
                    facing,
                    duration: drainDuration,
                    icon: data.icon || images['energy_drain'],
                };
                this.update();
                setTimeout(() => {
                    animationTile.animationType = null;
                    animationTile.transitionType = null;
                    animationTile.animationData = {};
                    this.update();
                }, drainDuration);
            }
            break;
            case 'sword_swing': {
                // Use TARGET tile — so hits on the source tile (Soldier getting hit) can't
                // interrupt the swing animation mid-frame.
                const swingTile = this.tiles.find(e => e.id === targetTileId) || animationTile;
                const swingDuration = this.animationsMatrix[type].duration;
                swingTile.animationType = 'sword_swing';
                swingTile.transitionType = 'fade';
                swingTile.animationData = {
                    facing,
                    duration: swingDuration,
                    fighterType: data.fighterType,
                    attackType: data.attackType,
                    startTime: Date.now()
                };
                this.update();
                setTimeout(() => {
                    swingTile.animationType = null;
                    swingTile.transitionType = null;
                    swingTile.animationData = {};
                    this.update();
                }, swingDuration);
            }
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
            case 'bite':
            case 'tackle':
            case 'crush':
            case 'reassembly':
            case 'acid_blast':
            case 'sleep':
            case 'claw_strike':
            case 'shield_slam':
            case 'vortex':
            case 'induce_fear':
            case 'defensive_stance':
            case 'shield_wall':
            case 'cleave':
            case 'leap_attack':
            case 'disintegrate':
            case 'one_man_army':
            case 'inspire':
            case 'annihilation':
            case 'berserker': {
                let iconKey = type;
                if (type === 'sleep') iconKey = 'wizard_sleep';
                else if (type === 'vortex') iconKey = 'wizard_vortex';
                else if (type === 'acid_blast') iconKey = 'wizard_acid_blast';
                else if (type === 'defensive_stance') iconKey = 'soldier_defensive_stance';
                else if (type === 'claw_strike') iconKey = 'claw_strike_animation';
                else if (type === 'cleave') iconKey = 'barbarian_cleave';
                else if (type === 'leap_attack') iconKey = 'barbarian_leap_attack';
                else if (type === 'disintegrate') iconKey = 'wizard_disintegrate';
                else if (type === 'one_man_army') iconKey = 'soldier_one_man_army';
                else if (type === 'inspire') iconKey = 'inspire';
                else if (type === 'annihilation') iconKey = 'wizard_annihilation';
                else if (type === 'berserker') iconKey = 'barbarian_berserker';

                animationTile.animationType = type;
                animationTile.transitionType = 'fade';
                animationTile.animationData = {
                    icon: data.icon || images[iconKey] || images[type],
                    duration: this.animationsMatrix[type].duration,
                    facing
                };
                this.update();
                setTimeout(() => {
                    animationTile.animationType = null;
                    animationTile.transitionType = null;
                    animationTile.animationData = {};
                    this.update();
                }, this.animationsMatrix[type].duration);
            }
                break;
            case 'void lance': {
                if (sourceTileId == null || targetTileId == null) break;
                const beamColor = 'purple';
                this.straightBeamTo(targetTileId, sourceTileId, beamColor)
                    .then(() => {
                        // this.rippleAnimation(targetTileId, beamColor);
                    })
                    .catch(() => {
                        // Best-effort visuals only.
                    });
            }
                break;
            default:
                console.log('animation not properly specified... INVESTIGATE', type);
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
    this.axeThrow = (targetTileId, sourceTileId, facing, resolve, fighterType, attackType) => {
        const sourceTile = this.tiles.find(e => e.id === sourceTileId);
        if (!sourceTile) {
            if (resolve) resolve(null);
            return;
        }
        const data = {
            targetTileId,
            type: 'axe_throw',
            facing,
            sourceTileId: sourceTile.id,
            fighterType,
            attackType
        };
        this.triggerTileAnimationComplex({ ...data });
        // Store resolve on the canvas animation so onComplete can call it after
        // the axe visually reaches the target (matches clawSwipe architecture).
        // triggerTileAnimationComplex pushes the axeAnim as the last canvas animation.
        const axeAnim = this.canvasAnimations[this.canvasAnimations.length - 1];
        if (axeAnim && axeAnim.type === 'axe_throw') {
            axeAnim._resolve = resolve;
        } else {
            // Fallback: canvas animation wasn't created (e.g. invalid tile), miss immediately
            if (resolve) resolve(null);
        }
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
    this.straightBeamNoTarget = (sourceTileId, direction, color = null, onResolve) => {
        const sourceTile = this.tiles.find(e => e.id === sourceTileId);
        if (!sourceTile) {
            if (typeof onResolve === 'function') onResolve(false);
            return Promise.resolve(false);
        }
        const maxX = this.MAX_DEPTH - 1;
        let newCoords;
        if (direction === 'left-to-right') {
            newCoords = { x: maxX, y: sourceTile.y };
        } else if (direction === 'right-to-left') {
            newCoords = { x: 0, y: sourceTile.y };
        } else {
            if (typeof onResolve === 'function') onResolve(false);
            return Promise.resolve(false);
        }

        const destinationTileId = this.getTileIdByCoords(newCoords);
        const destinationTile = this.tiles[destinationTileId];
        if (!destinationTile) {
            if (typeof onResolve === 'function') onResolve(false);
            return Promise.resolve(false);
        }

        return new Promise((promiseResolve) => {
            const finish = (result) => {
                try {
                    if (typeof onResolve === 'function') onResolve(result);
                } catch (e) {
                    // non-fatal callback errors should not break animation completion
                }
                promiseResolve(result);
            };

            const distanceAway = Math.abs(sourceTile.x - destinationTile.x);

            if (sourceTile.x > destinationTile.x && direction === 'right-to-left') {
                const sourceX = sourceTile.x;
                const idArray = [];
                for (let i = sourceX - 1; i >= destinationTile.x; i--) {
                    const id = this.getTileIdByCoords({ x: i, y: destinationTile.y });
                    idArray.push(id);
                }

                const lineInterval = setInterval(() => {
                    if (idArray.length === 0) {
                        clearInterval(lineInterval);
                        finish(false);
                    } else {
                        const id = idArray.shift();
                        const tileCoords = this.getTileCoordsById(id);
                        const collision = this.checkForCollision(tileCoords);

                        this.triggerTileAnimation(id, color);
                        if (collision) {
                            clearInterval(lineInterval);
                            finish(collision);
                        }
                    }
                }, 10 + (distanceAway * 5));
                return;
            }

            if (sourceTile.x < destinationTile.x && direction === 'left-to-right') {
                const sourceX = sourceTile.x;
                const idArray = [];
                for (let i = sourceX + 1; i < destinationTile.x + 1; i++) {
                    const id = this.getTileIdByCoords({ x: i, y: destinationTile.y });
                    idArray.push(id);
                }

                const lineInterval = setInterval(() => {
                    if (idArray.length === 0) {
                        clearInterval(lineInterval);
                        finish(false);
                    } else {
                        const id = idArray.shift();
                        const tileCoords = this.getTileCoordsById(id);
                        const collision = this.checkForCollision(tileCoords);
                        this.triggerTileAnimation(id, color);
                        if (collision) {
                            clearInterval(lineInterval);
                            finish(collision);
                        }
                    }
                }, 10 + (distanceAway * 5));
                return;
            }

            finish(false);
        });
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
    this.swordSwing = (targetTileId, sourceTileId, facing, resolve) => {
        // Trigger hit-flash on target tile instantly
        if (targetTileId !== null && targetTileId !== undefined) {
            const hitTile = this.tiles.find(e => e.id === targetTileId);
            if (hitTile) {
                hitTile.animationType = 'hit-flash';
                hitTile.transitionType = 'fade';
                hitTile.animationData = { swordSwipeHit: true, duration: 400 };
                this.update();
                setTimeout(() => {
                    hitTile.animationType = null;
                    hitTile.transitionType = null;
                    hitTile.animationData = {};
                    this.update();
                }, 400);
            }
        }
        if (resolve) {
            const tileCoords = targetTileId ? this.getTileCoordsById(targetTileId) : null;
            const collision = tileCoords ? this.checkForCollision(tileCoords) : null;
            resolve(collision);
        }
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
                    resolve(steps * msPerStep);
                    return;
                }
                this.triggerTileAnimation(idArray[stepIndex], 'purple');
                stepIndex++;
            }, msPerStep);
        });
    };

    this.energyBlast = (sourceCoords, targetCoords, onComplete) => {
        return new Promise((resolve) => {
            if (!sourceCoords || !targetCoords) {
                if (onComplete) onComplete();
                resolve(0);
                return;
            }

            const travelDuration = 800;
            const impactHoldDuration = 180;
            const fadeOutDuration = 220;
            const animationDuration = travelDuration + impactHoldDuration + fadeOutDuration;
            const animObj = {
                id: `energy_blast_${Date.now()}_${Math.random()}`,
                type: 'energy_blast',
                origin: sourceCoords,
                target: targetCoords,
                duration: animationDuration,
                travelDuration,
                onComplete: () => {
                    try {
                        if (onComplete) onComplete();
                    } catch (e) {
                        console.warn('energyBlast onComplete callback failed', e);
                    }
                    resolve(animationDuration);
                }
            };

            this.canvasAnimations.push(animObj);
            this.update();

            // Remove animation after it completes
            setTimeout(() => {
                const idx = this.canvasAnimations.indexOf(animObj);
                if (idx !== -1) {
                    this.canvasAnimations.splice(idx, 1);
                    this.update();
                }
            }, animationDuration + 20);
        });
    };

    this.heal = (sourceCoords, targetCoords, onComplete) => {
        return new Promise((resolve) => {
            if (!sourceCoords || !targetCoords) {
                if (onComplete) onComplete();
                resolve(0);
                return;
            }

            const travelDuration = 600;
            const impactHoldDuration = 200;
            const fadeOutDuration = 200;
            const animationDuration = travelDuration + impactHoldDuration + fadeOutDuration;
            let completed = false;
            const finish = () => {
                if (completed) return;
                completed = true;
                try {
                    if (onComplete) onComplete();
                } catch (e) {
                    console.warn('heal onComplete callback failed', e);
                }
                resolve(animationDuration);
            };
            const animObj = {
                id: `heal_${Date.now()}_${Math.random()}`,
                type: 'heal',
                origin: sourceCoords,
                target: targetCoords,
                duration: animationDuration,
                travelDuration,
                onComplete: () => {
                    finish();
                }
            };

            this.canvasAnimations.push(animObj);
            this.update();

            // Fallback: ensure heal resolution even if CanvasHeal callback is skipped
            // due to remount/unmount timing during frequent board updates.
            setTimeout(() => {
                finish();
            }, animationDuration + 30);

            // Remove animation after it completes
            setTimeout(() => {
                const idx = this.canvasAnimations.indexOf(animObj);
                if (idx !== -1) {
                    this.canvasAnimations.splice(idx, 1);
                    this.update();
                }
            }, animationDuration + 20);
        });
    };


    // UTILS
    this.pickRandom = (array) => {
        let index = Math.floor(Math.random() * array.length)
        return array[index]
    }
// End of AnimationManager function
}