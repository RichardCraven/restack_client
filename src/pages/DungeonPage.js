import React, {useState, useEffect} from 'react'
import '../styles/dungeon-board.scss'
import Tile from '../components/tile'
// import {BoardManager} from '../utils/board-manager'
import {PlayerManager} from '../utils/player-manager'
import {useEventListener} from '../utils/useEventListener'
import { Component } from 'react'
// import { BoardManager } from '../utils/board-manager'

export default function DungeonPage(props) {
    console.log('dungeon page, props are ', props)
    
    const playerManager = new PlayerManager();

    // if(props.boardManager){
        const [boardManager, setBoard] = useState(props.boardManager)
    // }

    const [tileSize, setTileSize] = useState(() => {
        const h = Math.floor((window.innerHeight/17));
        const w = Math.floor((window.innerWidth/17));
        let tsize = 0;
        if(h < w){
            tsize = h;
          } else {
            tsize = w;
        }
        return tsize;
    })
    const [boardSize, setBoardSize] = useState(tileSize*15)

    
    const [tiles, setTiles] = useState()

    function handleResize() {
        const h = Math.floor((window.innerHeight/17));
        const w = Math.floor((window.innerWidth/17));
        let tsize = 0;
        if(h < w){
            tsize = h;
        } else {
            tsize = w;
        }
        setTileSize(tsize)
        setBoardSize(tsize*15)
    }
    

    useEffect(() => {
        // console.log('in Dungeon Page, tiles are ', tiles)
        // console.log('player manager.test is ', playerManager.something)
        
        window.addEventListener('resize', handleResize)

        console.log('USE EFFET', this, props, props.boardManager)
        // setBoard(new BoardManager())
        if(props.boardManager){
            props.boardManager.initializeTiles();
            setTiles(props.boardManager.tiles)

        }
        // boardManager.initializeTiles()
    },[])

    const keyDownHandler = ({ key }) => {
        // if (ESCAPE_KEYS.includes(String(key))) {
        //   console.log('Escape key pressed!');
        // }
        // const that = this;
        console.log(key)
        let newTiles = [];
        switch(key){
            case 'ArrowUp':
                // console.log('uhh', props.boardManager.moveUp())
                props.boardManager.moveUp();
                 newTiles = [...props.boardManager.tiles]
                setTiles(newTiles);
            break;
            case 'ArrowDown':
                props.boardManager.moveDown();
                 newTiles = [...props.boardManager.tiles]
                setTiles(newTiles);
            break;
            case 'ArrowLeft':
                props.boardManager.moveLeft();
                 newTiles = [...props.boardManager.tiles]
                setTiles(newTiles);
            break;
            case 'ArrowRight':
                props.boardManager.moveRight();
                 newTiles = [...props.boardManager.tiles]
                setTiles(newTiles);
            break;
        }
    }
    useEventListener('keydown', keyDownHandler);

  return (
    <div className="container">
         {/* <!-- BOARD --> */}
        <div  className="board" style={{
            width: boardSize+'px', height: boardSize+ 'px',
            backgroundColor: 'white'
            }}>
            {tiles && tiles.map((tile, i) => {
                return <Tile 
                key={i}
                tileSize={tileSize}
                image={tile.image ? tile.image : null}
                color={tile.color ? tile.color : 'lightgrey'}
                coordinates={tile.coordinates}
                index={tile.id}
                >
                </Tile>
            })
            }
            {/* <div *ngFor='let tile of currentTiles; index as i' 
            [ngStyle]="{'width': tileSize+'px', 'height': tileSize+ 'px'}"
            [name]='tile.id' [contains]='tile.contains' 
            (click)='clickTile(tile)'
            [ngClass]='{
            darkness: !tile.visible,
            key: tile.key,
            crown: tile.crown,
            monster: tile.monster,
            item: tile.item,
            stairs: tile.stairs,
            pit: tile.pit,
            cloud: tile.cloud,
            lantern: tile.lantern,
            disguise: tile.disguise,
            door: tile.door,
            skull: tile.skull,
            edge: tile.edge,
            empty: tile && !tile.contains,
            occupied: tile.occupied,
            green : tile.green,
            red: tile.monster,
            void: tile.void,
            scimitar: tile.scimitar,
            flail: tile.flail,
            spear: tile.spear,
            sword: tile.sword,
            axe: tile.axe,
            scepter: tile.scepter,
            basic_shield: tile.basic_shield,
            seeing_shield: tile.seeing_shield,
            bundu_mask: tile.bundu_mask,
            lundi_mask: tile.lundi_mask,
            mardi_mask: tile.mardi_mask,
            solomon_mask: tile.solomon_mask,
            zul_mask: tile.zul_mask,
            court_mask: tile.court_mask,
            helmet: tile.helmet,
            beetle_charm: tile.beetle_charm,
            demonskull_charm: tile.demonskull_charm,
            evilai_charm: tile.evilai_charm,
            hamsa_charm: tile.hamsa_charm,
            nukta_charm: tile.nukta_charm,
            scarab_charm: tile.scarab_charm,
            lundi_charm: tile.lundi_charm,
            beholder: tile.beholder,
            black_gorgon: tile.black_gorgon,
            white_gorgon: tile.white_gorgon,
            black_vampire: tile.black_vampire,
            white_vampire: tile.white_vampire,
            dragon: tile.dragon,
            horror: tile.horror,
            goblin: tile.goblin,
            imp: tile.imp,
            imp_overlord: tile.imp_overlord,
            ogre: tile.ogre,
            troll: tile.troll,
            sphinx: tile.sphinx,
            slime_mold: tile.slime_mold,
            black_minotaur: tile.black_minotaur,
            white_minotaur: tile.white_minotaur,
            black_banshee: tile.black_banshee,
            white_banshee: tile.white_banshee,
            black_wraith: tile.black_wraith,
            white_wraith: tile.white_wraith,
            black_kronos: tile.black_kronos,
            white_kronos: tile.white_kronos,
            naiad: tile.naiad,
            mummy: tile.mummy,
            skeleton: tile.skeleton,
            wyvern: tile.wyvern,
            black_djinn: tile.black_djinn,
            white_djinn: tile.white_djinn,
            manticore: tile.manticore,
            giant_scorpion: tile.giant_scorpion,
            title: tile.title,
            title1: tile.title1,
            title2: tile.title2,
            title3: tile.title3,
            title4: tile.title4,
            title5: tile.title5,
            title6: tile.title6,
            title7: tile.title7,
            title8: tile.title8,
            title9: tile.title9,
            title10: tile.title10,
            spawn_point: tile.spawn_point,
            highlight: tile.highlight,
            selected: tile.selected
            }' > */}
            {/* </div> */}
        </div>
    </div>
  )
}