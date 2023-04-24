import Phaser from 'phaser'

import mapJson from '../../assets/tilesets/ZeldaMap.json';
import zeldaTileset from '../../assets/tilesets/tiles.png';



export default class GameScene extends Phaser.Scene
{
	constructor()
	{
		super('game-scene')
	}

	preload()
    {
        console.log('in preload')
        // this.load.setBaseURL('http://labs.phaser.io')

        // this.load.image('sky', 'assets/skies/space3.png')
        // this.load.image('logo', 'assets/sprites/phaser3-logo.png')
        // this.load.image('red', 'assets/particles/red.png')

        this.load.tilemapTiledJSON('main-map', mapJson);
        this.load.image('tileset', zeldaTileset)
    }

    create()
    {
        console.log('in create')
        console.log('grid engine:', this.gridEngine)

        const map = this.make.tilemap({ key: 'main-map' });
        map.addTilesetImage('tileset', 'tileset');
        map.layers.forEach((layer, index) => {
            console.log('layer:', layer)
            map.createLayer(index, 'tileset', 0, 0);
        });

        // const heroSprite = this.physics.add.sprite(0, 0, 'hero');

        // const gridEngineConfig = {
        //     characters: [{
        //         id: 'hero',
        //         sprite: heroSprite,
        //         startPosition: { x: 1, y: 1 },
        //     }],
        // };
    // this.gridEngine.create(map, gridEngineConfig);



        // const height = this.game.config.height
        // const width = this.game.config.width
        // const middle = height/2

        // this.add.image(400, 300, 'sky')

        // const particles = this.add.particles('red')

        // const emitter = particles.createEmitter({
        //     speed: 100,
        //     scale: { start: 1, end: 0 },
        //     blendMode: 'ADD'
        // })

        // const logo = this.physics.add.image(400, 100, 'logo')

        // logo.setVelocity(100, 200)
        // logo.setBounce(1, 1)
        // logo.setCollideWorldBounds(true)

        // emitter.startFollow(logo)

        // console.log('this:', this)
        // // console.log()
        // const text = this.add.text(middle/2, middle, 'Click me', {
        //     backgroundColor: 'white',
        //     color: 'blue',
        //     fontSize: 48
        //   })
      
        // text.setInteractive({ useHandCursor: true })
    
        // text.on('pointerup', () => {
        // console.log('interaction')
        // // store.dispatch({ type: TOGGLE_UI })
        // })




    }
    update() {
        console.log('update')
        const cursors = this.input.keyboard.createCursorKeys();
    
        if (cursors.left.isDown) {
            this.gridEngine.move('hero', 'left');
        } else if (cursors.right.isDown) {
            this.gridEngine.move('hero', 'right');
        } else if (cursors.up.isDown) {
            this.gridEngine.move('hero', 'up');
        } else if (cursors.down.isDown) {
            this.gridEngine.move('hero', 'down');
        }
    }
}