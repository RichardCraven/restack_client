import React from 'react';
import * as images from '../../utils/images';

/**
 * SiegeCombatGrid — renders unit portraits on the 15×20 siege board.
 *
 * This is a purpose-built, lightweight alternative to CombatGrid.js for
 * the Tower Siege event. It uses a configurable tileSize (56px by default)
 * rather than the standard 100px used in MonsterBattle.
 *
 * Props:
 *  - battleData      {object}  combatants keyed by id (from CombatManagerRedux)
 *  - tileSize        {number}  px per tile (default 56)
 *  - tileBorder      {number}  px border per tile (default 1)
 *  - siegeCols       {number}  total board columns (default 20)
 *  - siegeRows       {number}  total board rows (default 15)
 *  - showCrew        {bool}    show crew-side units (fade-in gate)
 *  - showHashmallim  {bool}    show hashmallim (fade-in gate)
 *  - showArmies      {bool}    show siege army + hashmallim army (fade-in gate)
 *  - combatStarted   {bool}    once true, all opacity gates are removed
 */
function SiegeCombatGrid({
    battleData = {},
    tileSize = 56,
    tileBorder = 1,
    siegeCols = 20,
    siegeRows = 15,
    showCrew = false,
    showHashmallim = false,
    showArmies = false,
    combatStarted = false,
}) {
    // Pixel position for a grid coordinate
    const tilePos = (coord) => coord * (tileSize + tileBorder);

    // Midpoint column separating player-side from enemy-side
    const midCol = Math.floor(siegeCols / 2);

    // Determine whether a combatant should currently be visible
    const isVisible = (c) => {
        if (combatStarted) return true;
        if (!c) return false;
        if (c.isSiegeArmy || c.isSiegeUnit) return showArmies;
        if (!c.isMonster) return showCrew;           // crew
        if (c.type === 'hashmallim') return showHashmallim;
        // hashmallim army (beholders, minions)
        return showArmies;
    };

    // Scale factor for portrait images:
    //  standard (1×1) = tileSize
    //  large   (2×2)  = 2×tileSize
    //  huge    (3×3)  = 3×tileSize
    const getPortraitScale = (c) => {
        if (!c) return 1;
        const isHuge = c.tier === 4 || c.type === 'dragon' || c.huge === true;
        if (isHuge) return 3;
        const LARGE_KEYS = ['beholder', 'ogre', 'sphinx', 'manticore', 'wyvern', 'mummy', 'djinn', 'vampire'];
        const isLarge = !isHuge && (c.large === true || (c.isMonster && c.tier === 3) || LARGE_KEYS.includes(c.type));
        if (isLarge) return 2;
        return 1;
    };

    const combatants = Object.values(battleData).filter(c => c && c.coordinates);

    return (
        <div
            className="ts-combat-units-layer"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
            {combatants.map((c) => {
                const { x, y } = c.coordinates;
                const scale = getPortraitScale(c);
                const px = tilePos(x);
                const py = tilePos(y);
                const sz = tileSize * scale;
                const visible = isVisible(c);
                const isDead = c.hp <= 0;

                // Determine portrait image key
                const imgKey = c.type || c.image;
                const portrait = images[imgKey] || null;

                // Faction colour coding
                let borderColor = 'rgba(255,255,255,0.2)';
                if (c.isSiegeArmy)      borderColor = '#4a9e6b';
                else if (!c.isMonster)  borderColor = c.color || '#6495ed';
                else if (c.type === 'hashmallim') borderColor = '#ff3333';
                else                    borderColor = '#cc4422';

                // HP bar
                const maxHp  = c.starting_hp || c.hp || 1;
                const curHp  = Math.max(0, c.hp || 0);
                const hpPct  = maxHp > 0 ? (curHp / maxHp) * 100 : 0;
                const hpColor = hpPct > 60 ? '#4caf50' : hpPct > 25 ? '#ff9800' : '#f44336';

                return (
                    <div
                        key={c.id}
                        className={`ts-unit${isDead ? ' ts-unit--dead' : ''}${c.isSiegeArmy ? ' ts-unit--siege-army' : ''}`}
                        style={{
                            position: 'absolute',
                            left: px,
                            top: py,
                            width: sz,
                            height: sz,
                            opacity: visible ? (isDead ? 0.2 : 1) : 0,
                            transition: `opacity 0.6s ease, left 0.4s ease, top 0.4s ease`,
                            zIndex: isDead ? 1 : 5 + y,
                        }}
                        title={`${c.name || c.type} | HP: ${curHp}/${maxHp}`}
                    >
                        {/* Portrait */}
                        {portrait && (
                            <img
                                src={portrait}
                                alt={c.type}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: scale > 1 ? 6 : 3,
                                    border: `${scale > 1 ? 2 : 1}px solid ${borderColor}`,
                                    imageRendering: 'pixelated',
                                    filter: isDead ? 'grayscale(100%) brightness(0.4)' : 'none',
                                }}
                            />
                        )}

                        {/* Fallback placeholder if no portrait */}
                        {!portrait && (
                            <div style={{
                                width: '100%', height: '100%',
                                background: borderColor,
                                borderRadius: 3,
                                opacity: 0.7,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: tileSize * 0.3,
                                color: '#fff',
                            }}>
                                {c.type?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}

                        {/* HP bar */}
                        {!isDead && (
                            <div style={{
                                position: 'absolute',
                                bottom: 1,
                                left: 1,
                                right: 1,
                                height: Math.max(3, tileSize * 0.07),
                                background: 'rgba(0,0,0,0.6)',
                                borderRadius: 2,
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    width: `${hpPct}%`,
                                    height: '100%',
                                    background: hpColor,
                                    transition: 'width 0.3s ease, background 0.3s ease',
                                }} />
                            </div>
                        )}

                        {/* Faction dot */}
                        <div style={{
                            position: 'absolute',
                            top: 1,
                            right: 1,
                            width: Math.max(4, tileSize * 0.1),
                            height: Math.max(4, tileSize * 0.1),
                            borderRadius: '50%',
                            background: borderColor,
                            boxShadow: `0 0 4px ${borderColor}`,
                        }} />
                    </div>
                );
            })}
        </div>
    );
}

export default SiegeCombatGrid;
