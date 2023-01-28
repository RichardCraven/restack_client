// import * as images from "./images";

export function MapMaker(props){
    this.tiles = [];
    this.options = [
        'delete',
        'void',
        'door',
        'pit',
        'way up',
        'way down',
        'cloud',
        'spawn',
        
        'monster',
        'item',
        'magic',
        'minor key',
        'major key',
        'master key',
        
        'gate',
        'treasure',
        'gold',
        'oracle',
        'dream den',

        'devil'
    ]

    this.paletteTiles = [];
    this.getIndexFromCoordinates = (coordinates) =>{
        let x = coordinates[0], y = coordinates[1];
        let row = x%15
        let col = y%15
        let index = row*15 + col;
        console.log('row: ', row, 'col: ', col)
        return index
    }
    this.resetCoordinates = (tiles) => {
        for(let row = 0; row < 15; row++){
            for(let column = 0; column<15; column++){
                // this.tiles[column+(15*row)].coordinates = [(row+1*15), column+1*15]
                // this.tiles[column+(15*row)].coordinates = [(row), column]
                tiles[column+(15*row)].coordinates = [column, row]
            }
        }
        return tiles
    }
    this.markPassages = (dungeon) => {
        dungeon.levels.forEach(lvl => {
            if(lvl.front) lvl.front.miniboards.forEach((mb, i) => {
                mb.tiles.forEach(t=> {
                    t.level = lvl.id
                    t.locationCode = `${t.contains}_level-${lvl.id}_miniboard-${i}_F_[${t.coordinates}]`
                })
            })
            if(lvl.back) lvl.back.miniboards.forEach((mb, i) => {
                mb.tiles.forEach(t=> {
                    t.level = lvl.id
                    t.locationCode = `${t.contains}_level-${lvl.id}_miniboard-${i}_B_[${t.coordinates}]`
                })
            })
        })
        let val = [];
        dungeon.levels.forEach((l) => {
            // let frontFilteredMiniboards = (!!l.front && l.front.miniboards) ? l.front.miniboards.map(b=>b.tiles.filter(t=>t.contains==='way_up' || 
            // t.contains === 'way_down' || t.contains==='door')) : [];
            let frontFilteredMiniboards = (!!l.front && l.front.miniboards) ? l.front.miniboards.map(b=>b.tiles.filter(t=>t.contains==='way_up' || 
            t.contains === 'way_down' || t.contains==='door')) : [];
            let backFilteredMiniboards = (!!l.back && l.back.miniboards) ? l.back.miniboards.map(b=>b.tiles.filter(t=>t.contains==='way_up' || 
            t.contains === 'way_down' || t.contains==='door')) : [];
            let aboveLevel = dungeon.levels.find(lev => lev.id === l.id+1)
            let belowLevel = dungeon.levels.find(lev => lev.id === l.id-1)
            let connected = []
            for(let i =0; i < 9; i++){
                const frontBoardPassages = frontFilteredMiniboards[i];
                const backBoardPassages = backFilteredMiniboards[i];
                const aboveFrontMiniboards = (aboveLevel && aboveLevel.front) ? aboveLevel.front.miniboards.map(b=>b.tiles.filter(t=>t.contains==='way_up' || 
                t.contains === 'way_down' || t.contains==='door')) : null;
                const aboveBackMiniboards = aboveLevel && aboveLevel.back ? aboveLevel.back.miniboards.map(b=>b.tiles.filter(t=>t.contains==='way_up' || 
                t.contains === 'way_down' || t.contains==='door')) : null;
                const belowFront = belowLevel && belowLevel.front ? belowLevel.front.miniboards.map(b=>b.tiles.filter(t=>t.contains==='way_up' || 
                t.contains === 'way_down' || t.contains==='door')) : null,
                belowBack = belowLevel && belowLevel.back ? belowLevel.back.miniboards.map(b=>b.tiles.filter(t=>t.contains==='way_up' || 
                t.contains === 'way_down' || t.contains==='door')) : null;
                if(frontBoardPassages && frontBoardPassages.length > 0){
                    frontBoardPassages.forEach((f)=>{
                        let backMatch = backBoardPassages ? backBoardPassages.find(b=>b.id === f.id) : null,
                        aboveMatch = aboveFrontMiniboards ? aboveFrontMiniboards[i].find(aboveTile=>aboveTile.id === f.id) : null,
                        belowMatch = belowFront ? belowFront[i].find(belowTile=>belowTile.id === f.id) : null;
                        switch(f.contains){
                            case 'way_up': 
                                if(aboveMatch){
                                    aboveMatch.miniboardIndex = i;
                                    connected.push({locationCode: f.locationCode, miniboardIndex: i, type: f.contains, coordinates: f.coordinates, orientation: 'front', connectedTo: aboveMatch, level: f.level})
                                }
                            break;
                            case 'way_down': 
                                if(belowMatch){
                                    belowMatch.miniboardIndex = i;
                                    connected.push({locationCode: f.locationCode, miniboardIndex: i, type: f.contains, coordinates: f.coordinates, orientation: 'front', connectedTo: belowMatch, level: f.level})
                                }
                            break;
                            case 'door': 
                                if(backMatch){
                                    backMatch.miniboardIndex = i;
                                    connected.push({locationCode: f.locationCode, miniboardIndex: i, type: f.contains, coordinates: f.coordinates, orientation: 'front', connectedTo: backMatch, level: f.level})
                                }
                            break;
                            default:
                                break;
                        }
                    })
                }
                if(backBoardPassages && backBoardPassages.length > 0){
                    backBoardPassages.forEach((b)=>{
                        let frontMatch = frontBoardPassages ? frontBoardPassages.find(f=>f.id === b.id): null,
                        aboveMatch = aboveBackMiniboards ? aboveBackMiniboards[i].find(above=>above.id === b.id) : null,
                        belowMatch = belowBack ? belowBack[i].find(below=>below.id === b.id) : null
                        switch(b.contains){
                            case 'way_up': 
                                if(aboveMatch){
                                    aboveMatch.miniboardIndex = i;
                                    connected.push({locationCode: b.locationCode, miniboardIndex: i, type: b.contains, coordinates: b.coordinates, orientation: 'back', connectedTo: aboveMatch, level: b.level})
                                }
                            break;
                            case 'way_down': 
                                if(belowMatch){
                                    belowMatch.miniboardIndex = i;
                                    connected.push({locationCode: b.locationCode, miniboardIndex: i, type: b.contains, coordinates: b.coordinates, orientation: 'back', connectedTo: belowMatch, level: b.level})
                                }
                            break;
                            case 'door': 
                                if(frontMatch){
                                    frontMatch.miniboardIndex = i;
                                    connected.push({locationCode: b.locationCode, miniboardIndex: i, type: b.contains, coordinates: b.coordinates, orientation: 'back', connectedTo: frontMatch, level: b.level})
                                }
                            break;
                            default:
                                break;
                        }
                    })
                }
            }
            let newFFmb = []
            frontFilteredMiniboards.forEach((x,i)=>{
                if(x.length > 0){
                    x.forEach(psg=>psg.miniboardIndex = i)
                    console.log('x:', x);
                    newFFmb = newFFmb.concat(x)

                }
            })
            console.log('newFFmb:', newFFmb, 'vs ', frontFilteredMiniboards);
            let newBBmb = []
            backFilteredMiniboards.forEach((x,i)=>{
                if(x.length > 0){
                    x.forEach(psg=>psg.miniboardIndex = i)
                    newBBmb = newBBmb.concat(x)
                }
            })

            // let newBBmb = backFilteredMiniboards.filter(f=>f.length > 0)
            if(frontFilteredMiniboards || backFilteredMiniboards){
                val.push({id: l.id, frontPassages: newFFmb, backPassages: newBBmb, connected})
            }
        })
        return val
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
        for(let row = 0; row < 15; row++){
            for(let column = 0; column<15; column++){
                // this.tiles[column+(15*row)].coordinates = [(row+1*15), column+1*15]
                // this.tiles[column+(15*row)].coordinates = [(row), column]
                this.tiles[column+(15*row)].coordinates = [column, row]
            }
        }
        for(let i = 0; i < this.options.length; i++){
            let key = this.options[i]
            if(key === 'void'){
                this.paletteTiles.push({
                    type: 'palette-tile',
                    optionType: 'void',
                    image: null,
                    color: 'black',
                    id: i
                })
            } else {
                // console.log(key, getPaletteImage(key))
                this.paletteTiles.push({
                    type: 'palette-tile',
                    image: this.getPaletteImage(key) ? this.getPaletteImage(key) : key,
                    optionType: key,
                    id: i
                })
            }
        }
    }
    this.initializeTilesWithInput = (input) => {
        console.log('input: ', input)
    }
    this.getMapConfiguration = (tiles) => {
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
    this.filterMapAdjacency = (map, boardIndex, boards) => {
        // boards in this case means all other maps
        console.log(map, boardIndex, boards)
        let config = map.config;
        let compatibilityMatrix = {
            top: [],
            right: [],
            bot: [],
            left: []
        }
        boards.forEach((b, i) => {
            let leftCompatibleCount = 0,
            rightCompatibleCount = 0,
            topCompatibleCount = 0,
            botCompatibleCount = 0

            // SCANS TOP TO BOTTOM, LEFT TO RIGHT
            
            // top
            if(boardIndex > 2){
                for(let i = 0; i < config[0].length; i++){
                    if(b.config[2].length !== config[0].length){
                        break;
                    }
                    if(b.config[2][i] && b.config[2][i]-210 === config[0][i]){topCompatibleCount++}
                }
                if(
                    (topCompatibleCount > 0 && topCompatibleCount === config[0].length)
                        || 
                        (b.config[2].length === 0 && config[0].length === 0)
                    ){
                    compatibilityMatrix.top.push(b.id);
                }
            }



            // right
            if(boardIndex !== 2 && boardIndex !== 5 && boardIndex !== 8){
                for(let i = 0; i < config[1].length; i++){
                    if(b.config[3].length !== config[1].length){
                        break;
                    }
                    if(b.config[3][i] && b.config[3][i]+14 === config[1][i]){rightCompatibleCount++}
                }
                
                if(
                    (rightCompatibleCount > 0 && rightCompatibleCount === config[1].length) 
                    || 
                    (b.config[3].length === 0 && config[1].length === 0)
                    ){
                    compatibilityMatrix.right.push(b.id);
                }
            }

            // bot
            if(boardIndex < 6){
                console.log('should be in bot', b.name)
                console.log(config[2], b.config[0])
                for(let i = 0; i < config[2].length; i++){
                    if(b.config[0].length !== config[2].length) break;
                    if(b.config[0][i] && b.config[0][i]+210 === config[2][i]){botCompatibleCount++}
                }
                if(
                    (botCompatibleCount > 0 && botCompatibleCount === config[2].length) 
                    || 
                    (b.config[0].length === 0 && config[2].length === 0)
                    ){
                    compatibilityMatrix.bot.push(b.id);
                }
            }

            // left
            if(boardIndex !== 0 && boardIndex !== 3 && boardIndex !== 6){
                for(let i = 0; i < config[3].length; i++){
                    if(b.config[1].length !== config[3].length) break;
                    if(b.config[1][i] && b.config[1][i]-14 === config[3][i]){leftCompatibleCount++}
                }
                if(
                    (leftCompatibleCount > 0 && leftCompatibleCount === config[3].length)
                    || 
                    (b.config[1].length === 0 && config[3].length === 0)
                    ){
                    compatibilityMatrix.left.push(b.id);
                }
            }

        })
        return compatibilityMatrix;
    }
    this.getSpawnPoints = (miniboards) => {
        let spawnPoints = []
        for(let i = 0; i< miniboards.length; i++){
            if(miniboards[i].tiles === undefined) return;
            miniboards[i].tiles.forEach((t, tileIndex) => {
                if(t.image === 'spawn_point' || t.contains === 'spawn_point'){
                    spawnPoints.push({
                        boardIndex: i,
                        tileIndex: tileIndex
                    })
                }
            })
        }
        return spawnPoints.length > 0 ? spawnPoints : null;
    }
    this.formatDungeon = (dungeonObj) => {
        let markedPassages = this.markPassages(dungeonObj)
        let dungeonValid = true;
        dungeonObj.levels.forEach((l)=>{
            let valid = true;
            let passages = markedPassages.find(p=>p.id === l.id)
            passages.frontPassages.forEach(passage=>{
                // console.log('mb:', mb);
                // mb.forEach(passage=>{
                    let connectedMatch = passages.connected.find(e=>e.locationCode === passage.locationCode)
                    if(!connectedMatch){
                        valid = false;
                    }
                // })
            })
            passages.backPassages.forEach(passage=>{
                // mb.forEach(passage=>{
                    let connectedMatch = passages.connected.find(e=>e.locationCode === passage.locationCode)
                    if(!connectedMatch){
                        valid = false;
                    }
                // })
            })
            passages.upwardPassages = passages.connected.filter(e=>e.type==='way_up')
            passages.downwardPassages = passages.connected.filter(e=>e.type==='way_down')
            l.passages = passages;
            l.valid = valid;
            if(!valid) dungeonValid = false;
        })
        dungeonObj.valid = dungeonValid;
        // dungeonObj.markedPassages = markedPassages;
        return dungeonObj



        // console.log('spawnpoints: ', this.getSpawnPoints(miniboards));
        // if(!this.getSpawnPoints(miniboards)){ 
        //     return false
        // }

        // ^ make sure there are valid spawnpoints SOMEWHAERE in the dungeon
    }
    this.isValidPlane = (miniboards) => {
        for(let b of miniboards){
            if(b.tiles === undefined){
                console.log('b.tiles undefined:', b);
                return false
            }
        }
        //check top boards
        for(let i = 0; i < 3; i++){
            let board = miniboards[i];
            for(let h = 0; h < 15; h++){
                if(board.tiles[h].contains !== 'void'){
                    console.log('BANG');
                    return false
                }
            }
        }
        //check bot boards
        for(let i = 6; i < 9; i++){
            let board = miniboards[i];
            for(let h = 210; h < 225; h++){
                if(board.tiles[h].contains !== 'void'){
                    console.log('BANG');
                    return false
                }
            }
        }
        //check right boards
        for(let i = 2; i < 9; i+=3){
            let board = miniboards[i];
            for(let h = 14; h < 225; h+=15){
                if(board.tiles[h].contains !== 'void'){
                    console.log('BANG', board);
                    return false
                }
            }
        }
        //check left boards
        for(let i = 0; i < 9; i+=3){
            let board = miniboards[i];
            for(let h = 0; h < 211; h+=15){
                if(board.tiles[h].contains !== 'void'){
                    console.log('BANG');
                    return false
                }
            }
        }
        return true
    }

    this.getPaletteImage = (key) => {
        //this switch case renames images so they can fit in a 2 tile space
        switch(key){
            case 'way up':
                return 'way_up'
            case 'way down':
                return 'way_down'
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
                return 'door'
            case 'dream den':
                return 'moon_castle'
            case 'major key':
                return 'major_key'  
            case 'minor key':
                return 'minor_key'  
            case 'master key':
                return 'ornate_key'  
            case 'devil':
                return 'mordu_devil'
            case 'spawn':
                return 'spawn_point'    
            default:
                return false
        }
    }

    this.getFolderColors = (numberOfFolders) => {
        // const colors = {
        //         'aqua' : ['#00ffff', '#13c2c2', '#199595', "#136565"],
        //         // '#00ffff' -> aqua
        //         // '#13c2c2' -> medium aqua
        //         // '#199595' -> dark aqua
        //         // "#136565" -> darkest aqua
        //         'lavender': ''
        // }
        

        // numberOfFolders
    }
}