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
            'delete',
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
        // boards in this case means all other maps
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
                let compatibilityMatrix = {
                    top: [],
                    right: [],
                    bot: [],
                    left: []
                }
                boards.forEach((b, i) => {
                    
                    // if(b.id !== 10){
                    //     return
                    // }
                    console.log('board: ', b)

                    // SCANS TOP TO BOTTOM, LEFT TO RIGHT
                    let leftCompatibleCount = 0,
                        rightCompatibleCount = 0,
                        topCompatibleCount = 0,
                        botCompatibleCount = 0
                        // leftCompatible = false,
                        // rightCompatible = false,
                        // topCompatible = false,
                        // botCompatible = false;
 
                    // top
                    console.log(b.config[2])
                    console.log('vs ', config[0])
                    for(let i = 0; i < config[0].length; i++){
                        if(b.config[2].length !== config[0].length) return
                        if(b.config[2][i] && b.config[2][i]-210 === config[0][i]){topCompatibleCount++}
                    }
                    console.log('finally: ', topCompatibleCount, config[0].length)
                    if(
                        (topCompatibleCount > 0 && topCompatibleCount === config[0].length)
                         || 
                         (b.config[2].length === 0 && config[0].length === 0)
                      ){
                        console.log('TOP COMPATIBLE for board ', b)
                        // topCompatible = true;
                        compatibilityMatrix.top.push(b.id);
                    }
                    

                    // right
                    for(let i = 0; i < config[1].length; i++){
                        if(b.config[3].length !== config[1].length) return
                        if(b.config[3][i] && b.config[3][i]+14 === config[1][i]){rightCompatibleCount++}
                    }
                    if(
                        (rightCompatibleCount > 0 && rightCompatibleCount === config[1].length) 
                        || 
                        (b.config[3].length === 0 && config[1].length === 0)
                      ){
                        console.log('RIGHT COMPATIBLE for board ', b)
                        // rightCompatible = true;
                        compatibilityMatrix.right.push(b.id);
                    }

                    // bot
                    for(let i = 0; i < config[2].length; i++){
                        if(b.config[0].length !== config[2].length) return
                        if(b.config[0][i] && b.config[0][i]+211 === config[2][i]){botCompatibleCount++}
                    }
                    if(
                        (botCompatibleCount > 0 && botCompatibleCount === config[2].length) 
                        || 
                        (b.config[0].length === 0 && config[2].length === 0)
                      ){
                        console.log('BOT COMPATIBLE for board ', b)
                        // botCompatible = true;
                        compatibilityMatrix.bot.push(b.id);
                    }

                    // left
                    
                    for(let i = 0; i < config[3].length; i++){
                        if(b.config[1].length !== config[3].length) return
                        if(b.config[1][i] && b.config[1][i]-14 === config[3][i]){leftCompatibleCount++}
                    }
                    // console.log('finally: ', leftCompatibleCount, config[3].length)
                    if(
                        (leftCompatibleCount > 0 && leftCompatibleCount === config[3].length)
                        || 
                        (b.config[1].length === 0 && config[3].length === 0)
                      ){
                        console.log('LEFT COMPATIBLE for board ', b)
                        // leftCompatible = true;
                        compatibilityMatrix.left.push(b.id);
                    }


                })
                return compatibilityMatrix;
                // config[0]
            // break;
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