// import * as images from "./images";

export function MapMaker(props){
    this.tiles = [];
    this.paletteTiles = [];
    this.configurations = {
        top: {
            0: [],
            1: [0],
            2: [1],
            3: [2],
            4: [3],
            5: [4],
            6: [5],
            7: [6],
            8: [7],
            9: [8],
            10: [9],
            11: [10],
            12: [11],
            13: [12],
            14: [13],
            15: [14],
            16: [0,15],
            17: []
        }
    }
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