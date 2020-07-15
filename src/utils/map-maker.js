// import * as images from "./images";

export function MapMaker(props){
    this.tiles = [];
    this.paletteTiles = [];
    this.getIndexFromCoordinates = (coordinates) =>{
        let x = coordinates[0], y = coordinates[1];
        let row = x%15
        let col = y%15
        let index = row*15 + col;
        console.log('row: ', row, 'col: ', col)
        return index
    }
    this.initializeTiles = () => {
        this.tiles = [];
        this.paletteTiles = [];
        for(let i = 0; i< 225; i++){
            this.tiles.push({
                type: 'board-tile',
                id: i,
                color: null,
                showCoordinates: false,
                contains: null
            })
        }
        for(let j = 0; j < 15; j++){
            for(let p = 0; p<15; p++){
                this.tiles[p+(15*j)].coordinates = [(j+1*15), p+1*15]

            }
        }

        const options = [
            'void',
            'door',
            'pit',
            'stairs',
            'cloud',
            
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

            'mordu_devil'
        ]
        function getPaletteImage(key){
            switch(key){
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
                default:
                    return false
            }
        }
        
        for(let i = 0; i < options.length; i++){
            let key = options[i]
            if(key === 'void'){
                this.paletteTiles.push({
                    type: 'palette-tile',
                    optionType: 'void',
                    image: null,
                    color: 'black',
                    id: i
                })
            } else {
                this.paletteTiles.push({
                    type: 'palette-tile',
                    image: getPaletteImage(key) ? getPaletteImage(key) : key,
                    optionType: key,
                    id: i
                })
            }
        }
    }
    this.getMapConfiguration = (tiles) => {
        // let xOffset = tiles[0].coordinates[0],
        //     yOffset = tiles[0].coordinates[1];
        // console.log('wtf??? tiles are ', tiles)
        // return null
            let topRow = function(){
                let openings = []
                for(let p = 0; p<15; p++){
                    if(tiles[p].contains !== 'void'){
                        openings.push(p)
                    }
                }
                return openings
            }
            let leftCol = function(){
                let openings = []
                for(let p = 0; p<15; p++){
                    let index = p*15
                    if(tiles[p*15].contains !== 'void'){
                        openings.push(index)
                    }
                }
                return openings
            }
            let rightCol = function(){
                let openings = []
                for(let p = 0; p<15; p++){
                    let index = p*15+14
                    if(tiles[index].contains !== 'void'){
                        openings.push(index)
                    }
                }
                return openings
            }
            let botRow = function(){
                let openings = []
                for(let p = 210; p<225; p++){
                    if(tiles[p].contains !== 'void'){
                        openings.push(p)
                    }
                }
                return openings
            }
        return [topRow(), rightCol(), botRow(), leftCol()]
    }
    this.filterMapAdjacency = (map, mapIndex, boards) => {
        console.log(map, mapIndex, boards)
        let config = map.config;
        switch(mapIndex){
            case 0: 
                console.log('top left')
            break;
            case 1: 
                console.log('top mid')
            break;
            case 2: 
                console.log('top right')
            break;
            case 3: 
                console.log('mid left')
            break;
            case 4: 
                console.log('center')
                boards.forEach((b, i) => {
                    // SCANS TOP TO BOTTOM, LEFT TO RIGHT

                    
                    // top
                    if(b.config[2][0]-211 === config[0][0]){
                        console.log('top compatible: ', b)
                    }

                    // right
                    if(b.config[3][0]+14 === config[1][0]){
                        console.log('right compatible: ', b)
                    }

                    // bot
                    if(b.config[0][0]+211 === config[2][0]){
                        
                        console.log('bot compatible: ', b)
                    }

                    // left
                    if(b.config[1][0]-14 === config[3][0]){
                        console.log('left compatible: ', b)
                    }
                })
                // config[0]
            break;
            case 5: 
                console.log('mid right')
            break;
            case 6: 
                console.log('bot left')
            break;
            case 7: 
                console.log('bot mid')
            break;
            case 8: 
                console.log('bot right')
            break;
            default:
            break;
        }
    }
}