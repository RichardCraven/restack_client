import DungeonPage from "../pages/DungeonPage";

// import {useEventListener} from '../utils/useEventListener'
export function BoardManager(){
    console.log('creating board manager')
    this.tiles = [];
    this.options = [
        'delete',
        'void',
        'door',
        'pit',
        'stairs',
        'cloud',
        'spawn',
        
        'monster',
        'item',
        'magic',
        'key',
        'masterkey',
        
        'gate',
        'treasure',
        'gold',
        'oracle',
        'dream den',

        'devil'
    ]
    this.playerTile = {
        location: [0,0]
    }
    this.dungeon = {};



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
    this.getCoordinatesFromIndex = (index) =>{
        console.log('in get coordinates from index')
        let row = Math.floor(index/15)
        let col = index%15
        let x = 15 + row
        let y = 15 + col
        console.log('col: ', col, 'row: ', row, x, y)
        // let index = row*15 + col;
        // let row = (index - col)/15


        // let x = coordinates[0], y = coordinates[1];
        // let row = x%15
        // let col = y%15
        // let index = row*15 + col;
        // console.log('row: ', row, 'col: ', col)
        return [x, y]
    }
    this.getIndexFromCoordinates = (coordinates) =>{
        let x = coordinates[0], y = coordinates[1];
        let row = x%15
        let col = y%15
        let index = row*15 + col;
        console.log('getting index from coordinates: ', coordinates, 'row: ', row, 'col: ', col)
        return index
    }
    this.setDungeon = (dungeon) => {
        this.dungeon = dungeon;
    }
    this.initializeTilesFromMap = (map, spawnTileIndex) => {
        console.log('in board manager initialize Tiles', map, this.dungeon)
        console.log('coordinates from index', spawnTileIndex, 'are: ', this.getCoordinatesFromIndex(spawnTileIndex))
        let spawnCoords = this.getCoordinatesFromIndex(spawnTileIndex);
        this.tiles = [];
        this.playerTile = {
            location: spawnCoords
        }
        for(let i = 0; i< map.tiles.length; i++){
            let tile = map.tiles[i]
            this.tiles.push({
                type: 'board-tile',
                id: tile.id,
                color: tile.color,
                showCoordinates: false,
                contains: tile.contains,
                image: this.getImage(tile.contains) ? this.getImage(tile.contains) : tile.contains
            })
        }
        console.log('this.tiles: ', this.tiles)
        for(let j = 0; j < 15; j++){
            for(let p = 0; p<15; p++){
                this.tiles[p+(15*j)].coordinates = [(j+1*15), p+1*15]
            }
        }
        this.placePlayer(this.playerTile.location)
        // for(let t = 0; t<this.tiles.length; t++){
        //     const tile = this.tiles[t];
        //     if(t%2 === 0){
        //         tile.color = 'lightcoral'
        //         tile.color = 'lightseagreen'
        //         tile.color = 'lightsteelblue'
        //     }
        //     if(t%2 !== 0){
        //         tile.color = 'lightsalmon'
        //     }
        // }
    }
    this.placePlayer = (coordinates) => {
        let index = this.getIndexFromCoordinates(coordinates)
        this.tiles[index].playerTile = true;
        this.tiles[index].image = 'avatar'
    }
    this.moveUp = () => {
        let tile = this.tiles[this.getIndexFromCoordinates(this.playerTile.location)];
        let destinationCoords = [(this.playerTile.location[0]- 1),this.playerTile.location[1]];
        let destinationIndex = this.getIndexFromCoordinates(destinationCoords);
        // let playerTile = this.playerTile;
        if(this.playerTile.location[0] === 15 || this.tiles[destinationIndex].contains === 'void') return
        //remove avatar from current tile
        tile.image = 
        this.getImage(tile.contains) ? this.getImage(tile.contains) : tile.contains;
        
        this.playerTile.location[0] = (this.playerTile.location[0]- 1)

        this.tiles[this.getIndexFromCoordinates(this.playerTile.location)].image = 'avatar'
        // console.log('***** new location: ',this.playerTile.location[0], this.playerTile.location[1])
    }
    this.moveDown = () => {
        let tile = this.tiles[this.getIndexFromCoordinates(this.playerTile.location)];
        let destinationCoords = [(this.playerTile.location[0]+ 1),this.playerTile.location[1]];
        let destinationIndex = this.getIndexFromCoordinates(destinationCoords);
        if(this.playerTile.location[0] === 29 || this.tiles[destinationIndex].contains === 'void') return
        //remove avatar from current tile
        tile.image = 
        this.getImage(tile.contains) ? this.getImage(tile.contains) : tile.contains;
        
        this.playerTile.location[0] = (this.playerTile.location[0]+ 1)

        this.tiles[this.getIndexFromCoordinates(this.playerTile.location)].image = 'avatar'
    }
    this.moveLeft = () => {
        let tile = this.tiles[this.getIndexFromCoordinates(this.playerTile.location)];
        let destinationCoords = [this.playerTile.location[0],(this.playerTile.location[1]- 1)];
        let destinationIndex = this.getIndexFromCoordinates(destinationCoords);
        if(this.playerTile.location[1] === 15 || this.tiles[destinationIndex].contains === 'void') return
        //remove avatar from current tile
        tile.image = 
        this.getImage(tile.contains) ? this.getImage(tile.contains) : tile.contains;
        
        this.playerTile.location[1] = (this.playerTile.location[1]- 1)

        this.tiles[this.getIndexFromCoordinates(this.playerTile.location)].image = 'avatar'
    }
    this.moveRight = () => {
        let tile = this.tiles[this.getIndexFromCoordinates(this.playerTile.location)];
        let destinationCoords = [this.playerTile.location[0],(this.playerTile.location[1]+ 1)];
        let destinationIndex = this.getIndexFromCoordinates(destinationCoords);
        if(this.playerTile.location[1] === 29 || this.tiles[destinationIndex].contains === 'void') return
        //remove avatar from current tile
        tile.image = 
        this.getImage(tile.contains) ? this.getImage(tile.contains) : tile.contains;
        
        this.playerTile.location[1] = (this.playerTile.location[1]+ 1)

        this.tiles[this.getIndexFromCoordinates(this.playerTile.location)].image = 'avatar'
    }
    this.getImage = (key) => {
        //this switch case renames images so they can fit in a 2 tile space
        switch(key){
            case 'delete':
                return 'trash'
            case 'monster':
                return 'monster'
            case 'item':
                return 'lantern'
            case 'magic':
                return 'spell'
            case 'stairs':
                return 'stairs_down'
            case 'door':
                return 'closed_door'
            case 'dream den':
                return 'moon_castle'
            case 'masterkey':
                return 'ornate_key'  
            case 'devil':
                return 'mordu_devil'
            case 'spawn':
                return 'spawn_point'    
            default:
                return false
        }
    } 
}