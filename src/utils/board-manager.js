// import {useEventListener} from '../utils/useEventListener'
export function BoardManager(){
    console.log('in board manager')
    this.tiles = [];
    // this.playerTile = {
    //     location: [26,18]
    // }



    // const keyDownHandler = ({ key }) => {
    //     // if (ESCAPE_KEYS.includes(String(key))) {
    //     //   console.log('Escape key pressed!');
    //     // }
    //     const that = this;
    //     console.log(key)
    //     switch(key){
    //         case 'ArrowUp':
    //             that.moveUp();
    //         break;
    //         case 'ArrowDown':
    //             that.moveDown();
    //         break;
    //         case 'ArrowLeft':
    //             that.moveLeft();
    //         break;
    //         case 'ArrowRight':
    //             that.moveRight();
    //         break;
    //     }
    // }

    // useEventListener('keydown', keyDownHandler);



    // 45*45=2025

    //225 per board, 9 boards

    //first tile (top left) is 0,0
    
    this.getIndexFromCoordinates = (coordinates) =>{
        let x = coordinates[0], y = coordinates[1];
        let row = x%15
        let col = y%15
        let index = row*15 + col;
        console.log('row: ', row, 'col: ', col)
        return index
    }
    this.initializeTiles = () => {
        console.log('in initializeTiles')
        this.playerTile = {
            location: [26,18]
        }
        for(let i = 0; i< 225; i++){
            this.tiles.push({
                type: 'board-tile',
                id: i
            })
        }
        this.placePlayer([26,18])
        for(let t = 0; t<this.tiles.length; t++){
            const tile = this.tiles[t];
            // if odd
            if(t%2 === 0){
                tile.color = 'lightcoral'
                tile.color = 'lightseagreen'
                tile.color = 'lightsteelblue'
            }
            if(t%2 !== 0){
                tile.color = 'lightsalmon'
            }
            // tile.coordinates = [t+15+1,t+15+1]
        }
        for(let j = 0; j < 15; j++){
            for(let p = 0; p<15; p++){
                this.tiles[p+(15*j)].coordinates = [(j+1*15), p+1*15]

            }
        }
    }
    this.placePlayer = (coordinates) => {
        let index = this.getIndexFromCoordinates(coordinates)
        this.tiles[index].playerTile = true;
        this.tiles[index].image = 'avatar'
    }
    this.moveUp = () => {
        console.log('moving up, OG location: ',this.playerTile.location[0], this.playerTile.location[1])
        // let playerTile = this.playerTile;
        if(this.playerTile.location[0] === 15) return
        //remove avatar from current tile
        this.tiles[this.getIndexFromCoordinates(this.playerTile.location)].image = null;
        
        this.playerTile.location[0] = (this.playerTile.location[0]- 1)

        this.tiles[this.getIndexFromCoordinates(this.playerTile.location)].image = 'avatar'
        // console.log('***** new location: ',this.playerTile.location[0], this.playerTile.location[1])
    }
    this.moveDown = () => {
        if(this.playerTile.location[0] === 29) return
        //remove avatar from current tile
        this.tiles[this.getIndexFromCoordinates(this.playerTile.location)].image = null;
        
        this.playerTile.location[0] = (this.playerTile.location[0]+ 1)

        this.tiles[this.getIndexFromCoordinates(this.playerTile.location)].image = 'avatar'
    }
    this.moveLeft = () => {
        if(this.playerTile.location[1] === 15) return
        //remove avatar from current tile
        this.tiles[this.getIndexFromCoordinates(this.playerTile.location)].image = null;
        
        this.playerTile.location[1] = (this.playerTile.location[1]- 1)

        this.tiles[this.getIndexFromCoordinates(this.playerTile.location)].image = 'avatar'
    }
    this.moveRight = () => {
        if(this.playerTile.location[1] === 29) return
        //remove avatar from current tile
        this.tiles[this.getIndexFromCoordinates(this.playerTile.location)].image = null;
        
        this.playerTile.location[1] = (this.playerTile.location[1]+ 1)

        this.tiles[this.getIndexFromCoordinates(this.playerTile.location)].image = 'avatar'
    }

}