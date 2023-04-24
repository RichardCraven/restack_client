// import Phaser from 'phaser'
// import { createWorld, addEntity, addComponent, System, IWorld } from 'bitecs'
// import {
// 	Position,
// 	Rotation,
// 	Velocity,
// 	Sprite,
// 	Player,
// 	CPU,
// 	Input,
// 	ArcadeSprite,
// 	ArcadeSpriteStatic,
// } from '../components'
// import {
// 	createSpriteSystem,
// 	createMovementSystem,
// 	createPlayerSystem,
// 	createCPUSystem,
// 	createArcadeSpriteSystem,
// 	createArcadeSpriteStaticSystem,
// } from '../systems'
// const Textures = {
// 	TankBlue : 0,
// 	TankRed : 1,
// 	TankGreen : 2,
// 	TankSand : 3,
// 	TankDark : 4,
// 	TreeBrownLarge : 5,
// 	TreeBrownSmall : 6,
// 	TreeGreenLarge : 7,
// 	TreeGreenSmall : 8
// }
// const TextureKeys = [
// 	'tank_blue.png',
// 	'tank_red.png',
// 	'tank_green.png',
// 	'tank_sand.png',
// 	'tank_dark.png',
// 	'treeBrown_large.png',
// 	'treeBrown_small.png',
// 	'treeGreen_large.png',
// 	'treeGreen_small.png',
// ]

// export class Game extends Phaser.Scene {
// 	world;
// 	spriteSystem;
// 	spriteStaticSystem;
// 	movementSystem;
// 	playerSystem;
// 	cpuSystem;
// 	cursors;

// 	constructor() {
// 		super('game')
// 	}

// 	init() {
// 		this.cursors = this.input.keyboard.createCursorKeys()
// 	}

// 	create() {
// 		const { width, height } = this.scale

// 		this.world = createWorld()

// 		const tank = addEntity(this.world)

// 		addComponent(this.world, Position, tank)
// 		Position.x[tank] = 200
// 		Position.y[tank] = 200

// 		addComponent(this.world, Rotation, tank)
// 		addComponent(this.world, Velocity, tank)
// 		addComponent(this.world, Input, tank)

// 		addComponent(this.world, ArcadeSprite, tank)
// 		ArcadeSprite.texture[tank] = Textures.TankBlue

// 		addComponent(this.world, Player, tank)

// 		// Create Large Tree
// 		const largeTree = addEntity(this.world)
// 		addComponent(this.world, Position, largeTree)
// 		addComponent(this.world, ArcadeSpriteStatic, largeTree)

// 		Position.x[largeTree] = 400
// 		Position.y[largeTree] = 400

// 		ArcadeSpriteStatic.texture[largeTree] = Textures.TreeGreenLarge

// 		// Create Small Tree
// 		const smallTree = addEntity(this.world)
// 		addComponent(this.world, Position, smallTree)
// 		addComponent(this.world, ArcadeSpriteStatic, smallTree)

// 		Position.x[smallTree] = 300
// 		Position.y[smallTree] = 200

// 		ArcadeSpriteStatic.texture[smallTree] = Textures.TreeBrownSmall

// 		// Create random CPU Tanks
// 		for (let i = 0; i < 5; i++) {
// 			const cpuTank = addEntity(this.world)

// 			addComponent(this.world, Position, cpuTank)
// 			Position.x[cpuTank] = Phaser.Math.Between(width * 0.25, width * 0.75)
// 			Position.y[cpuTank] = Phaser.Math.Between(height * 0.25, height * 0.75)

// 			addComponent(this.world, Rotation, cpuTank)
// 			Rotation.angle[cpuTank] = 0

// 			addComponent(this.world, Velocity, cpuTank)
// 			Velocity.x[cpuTank] = 0
// 			Velocity.y[cpuTank] = 0

// 			addComponent(this.world, ArcadeSprite, cpuTank)
// 			ArcadeSprite.texture[cpuTank] = Phaser.Math.Between(1, 4)

// 			addComponent(this.world, CPU, cpuTank)
// 			CPU.timeBetweenActions[cpuTank] = Phaser.Math.Between(100, 500)

// 			addComponent(this.world, Input, cpuTank)
// 		}

// 		const spriteGroup = this.physics.add.group()
// 		const spriteStaticGroup = this.physics.add.staticGroup()
// 		this.physics.add.collider(spriteGroup, spriteStaticGroup)
// 		this.physics.add.collider(spriteGroup, spriteGroup)

// 		this.spriteSystem = createArcadeSpriteSystem(spriteGroup, TextureKeys)
// 		this.spriteStaticSystem = createArcadeSpriteStaticSystem(
// 			spriteStaticGroup,
// 			TextureKeys
// 		)
// 		this.movementSystem = createMovementSystem()
// 		this.playerSystem = createPlayerSystem(this.cursors)
// 		this.cpuSystem = createCPUSystem(this)
// 	}

// 	update() {
// 		if (!this.world) return

// 		this.playerSystem(this.world)
// 		this.cpuSystem(this.world)
// 		this.movementSystem(this.world)
// 		this.spriteSystem(this.world)
// 		this.spriteStaticSystem(this.world)
// 	}
// }