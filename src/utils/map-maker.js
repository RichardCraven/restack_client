export function MapMaker(props){
    console.log('in map maker', props)
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
        console.log('in mapmaker initializeTiles')
        for(let i = 0; i< 225; i++){
            this.tiles.push({
                type: 'tile',
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
            'key',
            'monster',
            'pit',
            'cloud',
            'item'
        ]
        for(const e of options){
            console.log(e)
            this.paletteTiles.push({
                type: e,
            })
        }
    }
    this.setHovered = (idx) => {
        this.hoveredIdx = idx;
    }
}