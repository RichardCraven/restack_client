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
        for(let i = 0; i< 225; i++){
            this.tiles.push({
                type: 'board-tile',
                id: i,
                color: null,
                showCoordinates: false
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
    this.setHovered = (idx) => {
        this.hoveredIdx = idx;
    }
}