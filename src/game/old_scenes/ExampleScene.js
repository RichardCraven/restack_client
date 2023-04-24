import Phaser from "phaser";

export default class ExampleScene extends Phaser.Scene {
  preload() {
    this.load.image("logo", "assets/Hikaron.jpg");
  }
  create() {
    const text = this.add.text(250, 250, "Phaser", {
      backgroundColor: "white",
      color: "blue",
      fontSize: 48
    });

    text.setInteractive({ useHandCursor: true });
    this.add.image(400, 300, "logo");

    text.on("pointerup", () => {
      console.log("Hello!");
      //store.dispatch({ type: ACTION_TYPE });
    });
  }
}