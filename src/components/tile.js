import React from 'react';
import * as images from '../utils/images'


function Tile(props) {
    const hoverLabelTimerRef = React.useRef(null);
    const [showDelayedHoverLabel, setShowDelayedHoverLabel] = React.useState(false);

    React.useEffect(() => {
        return () => {
            if (hoverLabelTimerRef.current) {
                clearTimeout(hoverLabelTimerRef.current);
                hoverLabelTimerRef.current = null;
            }
        };
    }, []);

    React.useEffect(() => {
        if (!props.delayedHoverLabel && showDelayedHoverLabel) {
            setShowDelayedHoverLabel(false);
        }
    }, [props.delayedHoverLabel, showDelayedHoverLabel]);

    const beginDelayedHoverLabel = () => {
        if (!props.delayedHoverLabel) return;
        if (hoverLabelTimerRef.current) {
            clearTimeout(hoverLabelTimerRef.current);
        }
        setShowDelayedHoverLabel(false);
        hoverLabelTimerRef.current = setTimeout(() => {
            setShowDelayedHoverLabel(true);
            hoverLabelTimerRef.current = null;
        }, 1500);
    };

    const endDelayedHoverLabel = () => {
        if (hoverLabelTimerRef.current) {
            clearTimeout(hoverLabelTimerRef.current);
            hoverLabelTimerRef.current = null;
        }
        setShowDelayedHoverLabel(false);
    };

    if(props.image === 'void_fill'){
        console.log('void fill ', images[props.image]);
    }
    // Normalize coordinates for display only.
    // Engine uses a world-offset coordinate system (tiles often start at 15..29).
    // We expose zero-based coordinates for UI without changing game logic.
    const getDisplayCoords = (coords) => {
        if (!coords) return null;
        // support [x,y] arrays
        if (Array.isArray(coords) && coords.length >= 2) {
            const x = coords[0];
            const y = coords[1];
            const displayX = (typeof x === 'number' && x >= 15) ? x - 15 : x;
            const displayY = (typeof y === 'number' && y >= 15) ? y - 15 : y;
            return [displayX, displayY];
        }
        // support {x,y} objects
        if (typeof coords === 'object' && coords !== null && coords.x != null && coords.y != null) {
            const x = coords.x;
            const y = coords.y;
            const displayX = (typeof x === 'number' && x >= 15) ? x - 15 : x;
            const displayY = (typeof y === 'number' && y >= 15) ? y - 15 : y;
            return [displayX, displayY];
        }
        return null;
    }
    // derive hp and maxHp from props or nested data so callers can pass either shape
    const hpVal = (typeof props.hp === 'number') ? props.hp : (props.data && typeof props.data.hp === 'number' ? props.data.hp : undefined);
    let maxHpVal = (typeof props.maxHp === 'number') ? props.maxHp : (props.data && props.data.stats && typeof props.data.stats.hp === 'number' ? props.data.stats.hp : (props.data && typeof props.data.max_hp === 'number' ? props.data.max_hp : (props.data && typeof props.data.starting_hp === 'number' ? props.data.starting_hp : undefined)));
    // If caller only provides current HP (no max), treat max as current so the bar renders full.
    if (typeof hpVal === 'number' && typeof maxHpVal !== 'number') {
        maxHpVal = hpVal;
    }

    // VCT border logic: if combatManager and isVCT, add a 2px solid white border
    let vctBorder = undefined;
    if (props.combatManager && props.coordinates && typeof props.combatManager.isVCT === 'function') {
        if (props.combatManager.isVCT(props.coordinates.x, props.coordinates.y)) {
            vctBorder = '2px solid white';
        }
    }
    const foregroundPortalImages = ['archway', 'gryphon_gate_opened', 'bat_gate_opened', 'evil_gate_opened', 'dungeon_door_opened'];
    const portraitZIndex = foregroundPortalImages.includes(props.image) ? 12 : 3;

    return (
        <div style={{
            pointerEvents: props.passThrough ? 'none' : 'inherit',
            boxSizing: 'border-box',
            transition: 'background-color 0.25s',
            cursor: props.cursor ? props.cursor : 'pointer',
            height: props.tileSize+'px',
            width: props.tileSize+'px',
            backgroundColor: 
                props.backgroundColor ? props.backgroundColor :
                (props.hovered && props.type === 'board-tile') ? 
                '#8080807a' : 
                ( props.type === 'overlay-tile' ? 
                    'transparent': 
                    (props.isActiveInventory && props.type === 'inventory-tile' ? 'lightgreen' : props.color)),
            fontSize: '0.7em',
            position: 'relative',
            overflow: 'hidden',
            border: vctBorder,
            borderLeft: vctBorder ? undefined : (props.borders && props.borders.left ? props.borders.left : ((props.type === 'palette-tile' && !props.hovered) ? '2px solid transparent' : 
                (props.type === 'palette-tile' && props.hovered ? '2px solid red' : '1px solid transparent'))),
            borderRight: vctBorder ? undefined : ((props.borders && props.borders.right) ? props.borders.right : '1px solid transparent'),
            borderTop: vctBorder ? undefined : ((props.borders && props.borders.top) ? props.borders.top : '1px solid transparent'),
            borderBottom: vctBorder ? undefined : ((props.borders && props.borders.bottom) ? props.borders.bottom : '1px solid transparent')
            }}
            onMouseEnter={() => {
                beginDelayedHoverLabel();
                if(props.type === 'crew-tile'){
                    return props.handleHover(props)
                } else if(props.handleHover && props.type === 'overlay-tile'){
                    return props.handleHover(props.id)
                }  else if(props.handleHover && props.type !== 'inventory-tile'){
                    return props.handleHover(props.id, props.type, this)
                } else if(props.handleHover && props.type === 'inventory-tile'){
                    return props.handleHover(props)
                } else{
                    return null
                }
            }}
            onMouseLeave={() => {
                endDelayedHoverLabel();
                if(props.type === 'crew-tile' || props.type === 'inventory-tile'){
                    return props.handleHover(null)
                } 
                // else if(props.handleHover && props.type !== 'inventory-tile'){
                //     return props.handleHover(props.id, props.type, this)
                // } else if(props.handleHover && props.type === 'inventory-tile'){
                //     return props.handleHover(props)
                // } else{
                //     return null
                // }
            }}
            onMouseDown={() => {
                if(props.handleClick){
                    return props.handleClick(props)
                } else {
                    return null
                }
            }}
            onDragStart={(e) => e.preventDefault()}
            className={`tile ${props.className}`}
        >
           {/* HP fill: rendered as a vertical fill using the tile's color when hp & maxHp are provided */}
         { (typeof hpVal === 'number' && typeof maxHpVal === 'number') && (() => {
             // Render a visible left-side vertical HP bar so it shows even when the portrait
             // image is fully opaque. This acts as the "background" HP meter while keeping
             // the portrait visible. Width is small so it reads as a meter but you can
             // change it by passing props.hpBarWidth (percent number).
             const pct = Math.max(0, Math.min(1, maxHpVal <= 0 ? 0 : hpVal / maxHpVal));
             const heightPct = Math.round(pct * 100);
             const barWidthPct = (typeof props.hpBarWidth === 'number') ? props.hpBarWidth : 10;
                         return <div className="hp-fill" style={{position: 'absolute', left: 0, bottom: 0, width: `${barWidthPct}%`, height: `${heightPct}%`, backgroundColor: props.color || '#888', opacity: 0.95, zIndex: 2, transition: 'height 250ms linear', boxShadow: 'inset 2px 0 6px rgba(0,0,0,0.25)'}}></div>
         })()}

                     {/* Terrain background: chosen per-tile (terrain_1..terrain_16) and rendered beneath portrait/items */}
                     { props.terrain && props.color !== 'black' && (() => {
                         let terrainUrl = (props.terrain && props.terrain.includes('/')) ? props.terrain : (images[props.terrain] || null);
                         return <div className="terrain-bg" style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: terrainUrl ? `url(${terrainUrl})` : 'none', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', zIndex: 0, opacity: 0.5}} />
                     })()}

                     {/* Portrait sits above the hp-fill and terrain so the image remains visible */}
                     {(props.imageOverride || images[props.image]) && (
                         <div className="portrait" style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: props.imageOverride ? "url('" + props.imageOverride + "')" : images[props.image] ? "url('" + images[props.image] + "')" : undefined, backgroundSize: '100% 100%', backgroundPosition: 'inherit', backgroundRepeat: 'no-repeat', zIndex: portraitZIndex}} />
                     )}

           {/* Dead overlay: visible when data.dead === true */}
           { props.data && props.data.dead && (
                <div className="dead-overlay" style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: Math.max(12, (props.tileSize / 3)) + 'px', zIndex: 3}}>
                    {/* simple skull mark — keeps UI minimal */}
                    ☠
                </div>
           )}

           {/* Obscured space texture overlay */}
           { ((props.contains && props.contains.type === 'obscured_space') || props.optionType === 'obscured space') && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: 'repeating-linear-gradient(45deg, #777 0, #777 2px, transparent 2px, transparent 8px)',
                    zIndex: 1,
                    opacity: 0.5,
                    pointerEvents: 'none'
                }} />
           )}

           {props.showCoordinates && (() => {
                const displayCoords = getDisplayCoords(props.coordinates);
                if (!displayCoords) return null;
                return (
                    <div style={{color: 'yellow', userSelect: 'none', position: 'absolute', zIndex: 4}}>
                        {displayCoords[0]},{displayCoords[1]} <span style={{color: 'red'}}>{props.index}</span>
                    </div>
                )
           })()}

           {showDelayedHoverLabel && props.delayedHoverLabel && (
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '4px',
                    transform: 'translateX(-50%)',
                    maxWidth: '92%',
                    padding: '2px 5px',
                    backgroundColor: 'rgba(0, 0, 0, 0.82)',
                    color: 'white',
                    fontSize: Math.max(9, props.tileSize * 0.18) + 'px',
                    lineHeight: 1.15,
                    borderRadius: '3px',
                    textAlign: 'center',
                    zIndex: 20,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                }}>
                    {props.delayedHoverLabel}
                </div>
           )}
        </div>
    )
}

// Memoize so the thousands of read-only dungeon-view tiles don't re-render on
// every parent state change (e.g. dropdown open/close).  Tile content never
// changes mid-render in the dungeon preview — only tileSize, image, color, and
// coordinates matter.  All other props that Tile receives in DungeonView are
// stable primitives (false / null / 'board-tile'), so the shallow comparison
// is reliable and cheap.
export default React.memo(Tile);