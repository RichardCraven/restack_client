import * as images from '../utils/images'

import { FighterAI } from './fighter-ai/fighter-ai'
import { MonsterAI } from './monster-ai/monster-ai'
import {MovementMethods} from './fighter-ai/methods/movement-methods'
// import {MovementMethods} from './methods/movement-methods';

const MAX_DEPTH = 7
const MAX_LANES = 5
const FIGHT_INTERVAL = 5
const DEBUG_STEPS = false;

export function AnimationManager(){
    this.tiles = [];
    // this.establishAnimationCallbck = (callBack) => {
    //     console.log('establishCallback', callBack);
    //     // const {tileAnimated} = callBacks;
    //     this.tileAnimated = callBack;
    // }
    this.establishUpdateAnimationDataCallback = (callBack) => {
        console.log('establishAnimationDataCallback', callBack);
        // const {tileAnimated} = callBacks;
        this.updateAnimationData = callBack;
    }

    this.getTileIdByCoords = (coords) => {
        let tile = this.tiles.find(e=>e.x === coords.x && e.y === coords.y)
        return tile ? tile.id : null
    }


    this.initialize = (MAX_DEPTH, MAX_ROWS) => {
        console.log('animation manager initialized, MAX_DEPTH:', MAX_DEPTH, 'MAX_ROWS: ', MAX_ROWS)
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
                handleClick: this.handleTileClick 
            })
            // ghostPortraitMatrix.push(null)
        }
        console.log('animation tiles; ', arr);
        this.tiles = arr;
        this.updateAnimationData({tiles: this.tiles})
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
        console.log('triggerTileAnimation color: ', color)
        this.tileOn(tileId, color)
        setTimeout(()=>{
            this.tileOff(tileId)
        }, 1000)
    }
    this.tileOn = (tileId, color = null) => {
        console.log('tileOn color: ', color)
        let animationType = color ? `${color}-fade` : 'red-fade'
        // console.log('ANIMATION TYPE', animationType);
        const storedTile = this.tiles.find(e=>e.id === tileId)
        storedTile.animationOn = true;
        storedTile.animationType = color ? `${color}-fade` : 'red-fade';
        this.updateAnimationData({tiles: this.tiles})
    }
    this.tileOff = (tileId) => {
        const storedTile = this.tiles.find(e=>e.id === tileId)
        storedTile.animationOn = false;
        storedTile.animationType = ''
        this.updateAnimationData({tiles: this.tiles})
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
        console.log('ANIMATION on tileId: ', tileId, this.tiles);
        console.log('leftSide: ', leftSide);
        console.log('rightSide: ', rightSide);
        console.log('topAndBottom: ', topAndBottom);
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
    this.straightLineTo = (targetTileId, sourceTileId, color = null) => {
        const sourceTile = this.tiles.find(e=>e.id === sourceTileId)
        const destinationTile = this.tiles.find(e=>e.id === targetTileId)
        console.log('in STRAIGHT LINE TO sourceTile: ', sourceTile, 'destinationTile: ', destinationTile);
        let isOnSamePlane = sourceTile.y === destinationTile.y
        console.log('is on same plane', isOnSamePlane);
        // debugger

        return new Promise((resolve, reject) => {
            if(isOnSamePlane){
                let distanceAway = Math.abs(sourceTile.x - destinationTile.x)
                console.log('distance away: ', distanceAway);
    
                if(sourceTile.x > destinationTile.x){
                    console.log('GO LEFT');
                    let sourceX = sourceTile.x
                    let idArray = [];
                    for(let i = sourceX -1; i > destinationTile.x; i--){
                        let id = this.getTileIdByCoords({x: i, y: destinationTile.y})
                        idArray.push(id)
                    }
                    console.log('idArray is now ', idArray);
                    const lineInterval = setInterval(()=>{
                        if(idArray.length === 0){
                            clearInterval(lineInterval);
                            console.log('interval cleared');
                            resolve();
                        } else {
                            let id = idArray.shift();
                            this.triggerTileAnimation(id, color);
                        }
                    }, 100 + (distanceAway * 20))
                    // idArray.
                    // this.triggerTileAnimation(id, color)
                }
                // debugger
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

        const secondLayer = () => {
            leftSide = this.tiles.filter(e=>e.x === storedTile.x - 2 && (
                e.y === storedTile.y
                ))  
            rightSide = this.tiles.filter(e=>e.x === storedTile.x + 2 && (
                e.y === storedTile.y
                ))  
            topAndBottom = this.tiles.filter(e=>e.x === storedTile.x && (
                e.y === storedTile.y - 2 ||
                e.y === storedTile.y + 2
                )) 
            console.log('2nd layer ANIMATION on tileId: ', tileId, this.tiles);
            console.log('leftSide: ', leftSide);
            console.log('rightSide: ', rightSide);
            console.log('topAndBottom: ', topAndBottom);
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

        firstLayer()
        setTimeout(()=>{
            secondLayer()
        }, 100)
        
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
    this.zapBurstAnimation = async (targetTileId, sourceTileId, color = null) => {
        await this.straightLineTo(targetTileId, sourceTileId, color)
        this.crossAnimation(targetTileId, color)
    }


    // UTILS
    this.pickRandom = (array) => {
        let index = Math.floor(Math.random() * array.length)
        return array[index]
    }
}