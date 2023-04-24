import Phaser from 'phaser'

export class Bootstrap extends Phaser.Scene {
	constructor() {
		super('bootstrap')
	}

	init() {}

	preload() {
		// This Loads my assets created with texture packer
		// this.load.multiatlas('tankers', 'assets/tanker-game.json', 'assets')
	}

	create() {
		this.createNewGame()
	}

	update() {}

	createNewGame() {
		// this launches the game scene
		this.scene.launch('game')
	}
}