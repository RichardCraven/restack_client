import React from 'react';

export default function Overlay(props) {
    // {id: combatant.id, animationType: animationType, data: combatant}
    let content;
    // console.log('props.animationType: ', props.animationType);
    switch(props.animationType){
        case 'targetted':
            // console.log('targetted!');
            content =   <div className={`overlay-content overlay-targetted ${props.data?.color ? props.data.color : 'default-color'} ${props.data.fadeOut ? 'fade-out' : ''}`}>
                            <div className="relative-child">
                                <div className="moving-square top-left"></div>
                                <div className="moving-square top-right"></div>
                                <div className="moving-square bot-left"></div>
                                <div className="moving-square bot-right"></div>
                            </div>
                        </div>
        break;
        case 'blinded':
            // console.log('blinded!');
            content = <div className="overlay-content">
                            BLINDED
                        </div>
        break;
    }
    return (
        content
    )
}