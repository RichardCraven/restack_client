import React, {useState, useEffect} from 'react'

import { Redirect } from "react-router-dom";

// import crudeMap from "../assets/high_res_images/mj_graphics/crude_map.png";
import schematic from "../assets/high_res_images/mj_graphics/schematics/schematic 1.png";
import doorSequence1 from "../assets/high_res_images/mj_graphics/doorway/d1.png";
import doorSequence2 from "../assets/high_res_images/mj_graphics/doorway/d2.png";
import doorSequence3 from "../assets/high_res_images/mj_graphics/doorway/d3.png";

import Typewriter from "../utils/typewriter";
// import crudeMap from "../assets/high_res_images/mj_graphics/crude_map.png";

// INTRO scene 1
import darkForest1 from '../assets/high_res_images/mj_graphics/intro/1_in a dark forest/darkForest1.png'
import darkForest2 from '../assets/high_res_images/mj_graphics/intro/1_in a dark forest/darkForest2.png'
import darkForest3 from '../assets/high_res_images/mj_graphics/intro/1_in a dark forest/darkForest3.png'
import darkForest4 from '../assets/high_res_images/mj_graphics/intro/1_in a dark forest/darkForest4.png'
import darkForest5 from '../assets/high_res_images/mj_graphics/intro/1_in a dark forest/darkForest5.png'
import darkForest6 from '../assets/high_res_images/mj_graphics/intro/1_in a dark forest/darkForest6.png'

// INTRO scene 2
import crudeMap1 from '../assets/high_res_images/mj_graphics/intro/2_a map was found/crude map 1.png'
import crudeMap2 from '../assets/high_res_images/mj_graphics/intro/2_a map was found/crude map 2.png'
import crudeMap3 from '../assets/high_res_images/mj_graphics/intro/2_a map was found/crude map 3.png'

// INTRO scene 3
import braveSouls1 from '../assets/high_res_images/mj_graphics/intro/3_brave souls embark/brave souls 1.png'
import braveSouls2 from '../assets/high_res_images/mj_graphics/intro/3_brave souls embark/brave souls 2.png'
import braveSouls3 from '../assets/high_res_images/mj_graphics/intro/3_brave souls embark/brave souls 3.png'
import braveSouls4 from '../assets/high_res_images/mj_graphics/intro/3_brave souls embark/brave souls 4.png'
import braveSouls5 from '../assets/high_res_images/mj_graphics/intro/3_brave souls embark/brave souls 5.png'

// INTRO scene 4
import encounter1 from '../assets/high_res_images/mj_graphics/intro/4_encounter a tower/encounter 1.png'
import encounter2 from '../assets/high_res_images/mj_graphics/intro/4_encounter a tower/encounter 2.png'
import encounter3 from '../assets/high_res_images/mj_graphics/intro/4_encounter a tower/encounter 3.png'
// import encounter4 from '../assets/high_res_images/mj_graphics/intro/4_encounter a tower/encounter 4.png'

// INTRO scene 5
import passage1 from '../assets/high_res_images/mj_graphics/intro/5_a passage down/passage down 1.png'
import passage2 from '../assets/high_res_images/mj_graphics/intro/5_a passage down/passage down 2.png'
import passage3 from '../assets/high_res_images/mj_graphics/intro/5_a passage down/passage down 3.png'
import passage4 from '../assets/high_res_images/mj_graphics/intro/5_a passage down/passage down 4.png'
import passage5 from '../assets/high_res_images/mj_graphics/intro/5_a passage down/passage down 5.png'
import passage6 from '../assets/high_res_images/mj_graphics/intro/5_a passage down/passage down 6.png'

// INTRO scene 6
import ancientDoorway1 from '../assets/high_res_images/mj_graphics/intro/6_a doorway/door 1.png'
import ancientDoorway2 from '../assets/high_res_images/mj_graphics/intro/6_a doorway/door 2.png'
import ancientDoorway3 from '../assets/high_res_images/mj_graphics/intro/6_a doorway/door 3.png'
import ancientDoorway4 from '../assets/high_res_images/mj_graphics/intro/6_a doorway/door 4.png'
import ancientDoorway5 from '../assets/high_res_images/mj_graphics/intro/6_a doorway/door 5.png'

import ancientDoorway6 from '../assets/high_res_images/mj_graphics/intro/6_an ancient doorway/ancient doorway 1.png'
import ancientDoorway7 from '../assets/high_res_images/mj_graphics/intro/6_an ancient doorway/ancient doorway 2.png'
import ancientDoorway8 from '../assets/high_res_images/mj_graphics/intro/6_an ancient doorway/ancient doorway 3.png'
import ancientDoorway9 from '../assets/high_res_images/mj_graphics/intro/6_an ancient doorway/ancient doorway 4.png'
import ancientDoorway10 from '../assets/high_res_images/mj_graphics/intro/6_an ancient doorway/ancient doorway 5.png'

// INTRO scene 7

export default function NarrativeSequence(props) {

    const pickRandom = (array) => {
        let index = Math.floor(Math.random() * array.length)
        return array[index]
    }
    const [fadeInFirstFrame, setFadeInFirstFrame] = useState(false)
    const [navToDungeon, setNavToDungeon] = useState(false)
    const [currentSequence, setCurrentSequence] = useState(null)

    const [currentOddSequence, setCurrentOddSequence] = useState(null)
    const [currentEvenSequence, setCurrentEvenSequence] = useState(null)

    // in the deep of a starless night
    const darkForest = [darkForest1, darkForest2, darkForest3, darkForest4, darkForest5, darkForest6]
    // an old map was found
    const oldMap = [crudeMap1, crudeMap3]
    // a three brave souls set out 
    const braveSouls = [braveSouls1, braveSouls2, braveSouls3, braveSouls4, braveSouls5]
    // and encounter a crumbling tower
    const encounter = [encounter1, encounter2, encounter3]
    // and a passage leading down
    const passage = [passage1, passage2, passage3, passage4, passage5, passage6]
    // and an ancient door
    const ancientDoorway = [
        ancientDoorway1, 
        ancientDoorway2, 
        ancientDoorway3, 
        ancientDoorway4, 
        ancientDoorway5, 
        ancientDoorway6, 
        ancientDoorway7, 
        ancientDoorway8, 
        ancientDoorway9, 
        ancientDoorway10,
        ancientDoorway7, 
        ancientDoorway8, 
        ancientDoorway9, 
        ancientDoorway10
    ]

    const introSequence = [
        {
            image: pickRandom(darkForest),
            text: 'In the deep of night',
            id: 1
        },
        {
            image: pickRandom(oldMap),
            text: 'an old map was found.',
            id: 2
        },
        {
            image: pickRandom(braveSouls),
            text: 'Three brave souls set out ',
            id: 3
        },
        {
            image: pickRandom(encounter),
            text: 'and encounter a crumbling tower',
            id: 4
        },
        {
            image: pickRandom(passage),
            text: 'and a passage leading down...',
            id: 5
        },
        {
            image: pickRandom(ancientDoorway),
            text: 'to an ancient door.',
            id: 6
        }
    ]

    const delay = (numSeconds) => {
        return new Promise((resolve) => {
            setTimeout(()=>{
                resolve(numSeconds, ' complete')
            }, numSeconds * 1000)
        })
    }

  useEffect(()=> {
    console.log('commence intro sequence');

    setCurrentOddSequence(introSequence[0])
    setCurrentEvenSequence(introSequence[1])

    delay(1).then(()=>{
        setFadeInFirstFrame(true);
        runSequence();
    })
    props.beginIntroSequence();
  }, [])

  useEffect(()=> {
    console.log('NOW current sequence: ', currentSequence);
  }, [currentSequence])
  const runSequence = () => {

    // setCurrentOddSequence(introSequence[0])
    // setCurrentEvenSequence(introSequence[1])

    console.log('in sequence');

    let introSequenceClone = Array.from(introSequence)

    // console.log('arr:', arr);

    let counter;
    const fireItOff = () => {
        // let sequence = counter % 2 === 1 ? introSequenceOdd.shift() : introSequenceEven.shift()
        let sequence = introSequenceClone.shift()
        
        console.log('sequence: ', sequence);
        if(sequence.id % 2 === 1){
            setCurrentOddSequence(sequence)
        } else {
            setCurrentEvenSequence(sequence)
        }
        setCurrentSequence(sequence);
        counter = sequence.id;

        let nextSequence = introSequenceClone.find(e=>e.id === counter + 1)
        if(counter % 2 === 0 && nextSequence){
            delay(1.5).then(()=>{
                setCurrentOddSequence(nextSequence)
            })
        } else if(counter > 1 && nextSequence){
            delay(1.5).then(()=>{
                setCurrentEvenSequence(nextSequence)
            })
        }

        delay(4).then(()=>{
            console.log('go');
            // console.log('current: ', sequence);
            // console.log('but current sequence: ', currentSequence);
            if(introSequenceClone.length){
                console.log('arr.length: ', introSequenceClone.length);
                fireItOff();
            } else {
                endSequence();
                props.endIntroSequence();
            }
        })
    }
    fireItOff();
    const endSequence = () => {
        console.log('end sequence');
        setNavToDungeon(true)
    }
  }

  return (
    <div className="intro-pane pane">
        {currentOddSequence && <img 
         className="intro-image"
         src={currentOddSequence.image}
         style={{opacity: currentSequence && currentSequence.id%2===1 ? 1 : 0}}  
         />}

         {currentEvenSequence && <img 
         className="intro-image"
         src={currentEvenSequence.image}
         style={{opacity: currentSequence && currentSequence.id%2===0 && fadeInFirstFrame ? 1 : 0}}  
         />}

         {currentSequence && currentSequence.id%2===0 && <div 
         className="text-container">
            <Typewriter text={currentSequence.text} delay={40}></Typewriter>
         </div>}

         {currentSequence && currentSequence.id%2===1 && <div 
         className="text-container">
            <Typewriter text={currentSequence.text} delay={40}></Typewriter>
         </div>}
         { navToDungeon && <Redirect to='/dungeon'/> }
    </div>
  )
}