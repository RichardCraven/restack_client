import React from 'react';
import Phaser from 'phaser';
import GridEngine from 'grid-engine';
// import GameScene from './scenes/GameScene.js'

// const config = {
// 	type: Phaser.AUTO,
	// width: 800,
	// height: 600,
	// physics: {
	// 	default: 'arcade',
	// 	arcade: {
	// 		gravity: { y: 200 }
	// 	}
	// },
// 	scene: [GameScene]
// }

// export default new Phaser.Game(config)

export default class GameComponent extends React.Component {
    componentDidMount() {
      const config = {
        type: Phaser.AUTO,
        // width: GAME_WIDTH,
        // height: GAME_HEIGHT,
        parent: 'phaser-game',
        width: 600,
        height: 600,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 200 }
            }
        },
        scene: [],
        backgroundColor: '#00F000',
        plugins: {
            scene: [{
                    key: 'gridEngine',
                    plugin: GridEngine,
                    mapping: 'gridEngine',
                }],
        },
      }
  
      new Phaser.Game(config)
    }
  
    shouldComponentUpdate() {
      return false
    }
  
    render() {
      return <div id="phaser-game" />
    }
  }






// function GameComponent() {
//     console.log('game component')
//     const game = new Phaser.Game({
//         // ...configs,
//         parent: 'game-content',
//     });

//     return <div id="game-content" />;
// };

// export default GameComponent;



// import Phaser from 'phaser' 

// import { Bootstrap, Game } from './scenes'

// const config = {
// 	type: Phaser.AUTO,
// 	parent: 'phaser-container',
// 	backgroundColor: '#282c34',
// 	scale: {
// 		mode: Phaser.Scale.ScaleModes.RESIZE,
// 		width: window.innerWidth,
// 		height: window.innerHeight,
// 	},
// 	physics: {
// 		default: 'arcade',
// 		arcade: {
// 			gravity: { y: 0 },
// 			debug: true,
// 		},
// 	},
// 	scene: [Bootstrap, Game],
// }
// // eslint-disable-next-line import/no-anonymous-default-export
// export default new Phaser.Game(config)




// import ExampleScene from "./scenes/ExampleScene";

// // import * as React from "react";

// import React from 'react';
// import Phaser from 'phaser';

// import { Bootstrap, Game } from './scenes'


// export default class Game extends React.Component {
//   componentDidMount() {
//     const config = {
//       type: Phaser.AUTO,
//       parent: "phaser-example",
//       width: 800,
//       height: 600,
//       scene: [ExampleScene]
//     };

//     new Phaser.Game(config);
//   }

//   shouldComponentUpdate() {
//     return false;
//   }

//   render() {
//     return <div id="phaser-game" />;
//   }
// }


// import React from 'react';
// import Phaser from 'phaser';
// import ExampleScene from "./scenes/ExampleScene";

// export default class Game extends React.Component() {
//     // const game = new Phaser.Game({
//     //     ...configs,
//     //     parent: 'game-content',
//     //     physics: {
//     //         default: 'arcade',
//     //     },
//     // });

//     componentDidMount() {
//     const config = {
//       type: Phaser.AUTO,
//       parent: "phaser-example",
//       width: 800,
//       height: 600,
//       scene: [ExampleScene]
//     };

//     new Phaser.Game(config);
//   }


//     // const config = {
//     //     type: Phaser.AUTO,
//     //     parent: "phaser-example",
//     //     width: 800,
//     //     height: 600,
//     //     scene: [ExampleScene]
//     //   };
//     //   new Phaser.Game(config);


//     // useEffect(() => {
//     //     async function initPhaser() {
//     //         // Need to initialize Phaser here otherwise Gatsby will try to SSR it
//     //         const Phaser = await import('phaser');
//     //         const { default: GameScene } = await import('../game/scenes/GameScene');
//     //         const { default: GridEngine } = await import('grid-engine');

//     //         const game = new Phaser.Game({
//     //             ...configs,
//     //             parent: 'game-content',
//     //             scene: [GameScene],
//     //         });
//     //     }

//     //     initPhaser();
//     // }, []);



//     // return <div id="game-content" />;

//     const [messages, setMessage] = useState('');
//     const [showDialogBox, setShowDialogBox] = useState(false);

//     useEffect(() => {
//         const dialogBoxEventListener = ({ detail }) => {
//             setMessage(detail.message);
//             setShowDialogBox(true);
//         };
//         window.addEventListener('start-dialog', dialogBoxEventListener);

//         return () => {
//             window.removeEventListener('start-dialog', dialogBoxEventListener);
//         };
//     });

//     const handleMessageIsDone = useCallback(() => {
//         const customEvent = new CustomEvent('end-dialog');
//         window.dispatchEvent(customEvent);

//         setMessage('');
//         setShowDialogBox(false);
//     }, [characterName]);

//     return (
//         <>
//             {showDialogBox && (
//                 <DialogBox
//                     message={message}
//                     onDone={handleMessageIsDone}
//                 />
//             )}
//             <div id="game-content" />
//         </>
//     );


// };

// // Phaser scene
// class GameScene extends Phaser.Scene {
//     constructor() {
//         super('GameScene');
//     }

//     create() {
//         const dialogBoxFinishedEventListener = () => {
//             window.removeEventListener('end-dialog', dialogBoxFinishedEventListener);
//             // Do whatever is needed when the dialog is over
//         };
//         window.addEventListener('end-dialog', dialogBoxFinishedEventListener);
//     }
// }

// export default GameComponent;