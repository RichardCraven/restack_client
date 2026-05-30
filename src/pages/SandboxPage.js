import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import AssemblyAnimation from '../components/assembly-animation';
import {
  ranger,
  ranger_notch,
  ranger_loose,
  ranger_mark,
  ranger_execute,
  sage,
  soldier,
  wizard,
  barbarian,
  monk,
  summoner,
  engineer,
  goblin_portrait,
  soldier_portrait,
  claws,
  axe_throw,
  axe_swing,
  voidfill,
  grasp,
  fire_blast,
  heal,
  shield_wall,
  lightning,
  magic_missile,
  tackle,
  ice_blast,
  meditate,
  energy_blast,
  bat_gate,
  energy_drain,
  void_lance,
  bow_and_arrow,
  arrowUp,
  construct_icon,
  sigil_icon,
  sword_white
} from '../utils/images';

// Dynamically load all runes from the directory
const req = require.context('../assets/icons/runes', true, /\.png$/);

const runesData = {};

req.keys().forEach(key => {
  const parts = key.split('/');
  if (parts.length === 2) {
    // Base rune icon, e.g., "./archaic.png"
    const runeName = parts[1].replace('.png', '');
    if (!runesData[runeName]) runesData[runeName] = { isComplete: false, pieces: {} };
    runesData[runeName].baseImg = req(key).default || req(key);
  } else if (parts.length === 3) {
    // Inside a rune directory, e.g., "./archaic/top right.png"
    const runeName = parts[1];
    if (!runesData[runeName]) runesData[runeName] = { isComplete: false, pieces: {} };
    
    const fileName = parts[2].replace('.png', '');
    if (fileName === `${runeName}_assembled`) {
      runesData[runeName].assembledImg = req(key).default || req(key);
    } else {
      runesData[runeName].pieces[fileName] = req(key).default || req(key);
    }
  }
});

// Evaluate completeness for each rune
Object.keys(runesData).forEach(runeName => {
  const data = runesData[runeName];
  const requiredPieces = ['top left', 'top right', 'bottom left', 'bottom right', 'top center'];
  
  // Check if it has all the exact required piece names
  const hasAllPieces = requiredPieces.every(piece => !!data.pieces[piece]);
  
  if (data.assembledImg && hasAllPieces) {
    data.isComplete = true;
    
    // Filter out any "copy" or "edited" backup files that might be in the directory
    const filteredPieces = {};
    requiredPieces.forEach(piece => {
      filteredPieces[piece] = data.pieces[piece];
    });
    data.pieces = filteredPieces;
  }
});

// Predefined list of 8 crew fighters and their test abilities
const fightersData = [
  {
    id: 'ranger',
    name: 'Ranger',
    portrait: ranger,
    abilities: [
      { id: 'notch', name: 'Notch', desc: 'Select arrow type to load.', icon: ranger_notch, type: 'notch' },
      { id: 'loose', name: 'Loose', desc: 'Shoot the selected notched arrow.', icon: ranger_loose, type: 'loose' },
      { id: 'mark', name: 'Mark', desc: 'Place a target mark on the enemy.', icon: ranger_mark, type: 'mark' },
      { id: 'execute', name: 'Execute', desc: 'Shoot three arrows in rapid succession.', icon: ranger_execute, type: 'execute' }
    ]
  },
  {
    id: 'sage',
    name: 'Sage',
    portrait: sage,
    abilities: [
      { id: 'divine_blast', name: 'Divine Blast', desc: 'Fire a projectile of holy energy.', icon: fire_blast, type: 'projectile', projectileIcon: magic_missile },
      { id: 'heal', name: 'Heal', desc: 'Cast restorative magic on self.', icon: heal, type: 'heal' },
      { id: 'barrier', name: 'Barrier', desc: 'Enshroud self in a protective energy bubble.', icon: shield_wall, type: 'barrier' },
      { id: 'smite', name: 'Smite', desc: 'Call down a holy beam of light from the heavens.', icon: lightning, type: 'beam' }
    ]
  },
  {
    id: 'soldier',
    name: 'Soldier',
    portrait: soldier,
    abilities: [
      { id: 'slash', name: 'Slash', desc: 'Execute a heavy steel blade slash.', icon: sword_white || axe_swing, type: 'melee' },
      { id: 'shield_wall', name: 'Shield Wall', desc: 'Deploy a protective energetic wall overlay.', icon: shield_wall, type: 'shield_wall' },
      { id: 'shield_slam', name: 'Shield Slam', desc: 'Ram target, causing heavy structural shake.', icon: tackle, type: 'melee_slam' },
      { id: 'axe_throw', name: 'Axe Throw', desc: 'Throw a spinning hand axe.', icon: axe_throw, type: 'projectile', projectileIcon: axe_throw }
    ]
  },
  {
    id: 'wizard',
    name: 'Wizard',
    portrait: wizard,
    abilities: [
      { id: 'fireball', name: 'Fireball', desc: 'Launch an explosive orb of flame.', icon: fire_blast, type: 'projectile', projectileIcon: fire_blast },
      { id: 'ice_blast', name: 'Ice Blast', desc: 'Freeze target in a block of absolute-zero ice.', icon: ice_blast, type: 'projectile', projectileIcon: ice_blast },
      { id: 'magic_missile', name: 'Magic Missile', desc: 'Fire three seeking missiles in sequence.', icon: magic_missile, type: 'magic_missile' },
      { id: 'lightning_strike', name: 'Lightning', desc: 'Strike the target with electrical charge.', icon: lightning, type: 'lightning' }
    ]
  },
  {
    id: 'barbarian',
    name: 'Barbarian',
    portrait: barbarian,
    abilities: [
      { id: 'heavy_swing', name: 'Heavy Swing', desc: 'A massive double-handed strike.', icon: axe_swing, type: 'melee_heavy' },
      { id: 'leap_attack', name: 'Leap Attack', desc: 'Leap high and crush target on landing.', icon: tackle, type: 'leap' },
      { id: 'battle_cry', name: 'Battle Cry', desc: 'Unleash a roar, amplifying size and damage.', icon: meditate, type: 'battle_cry' },
      { id: 'axe_throw', name: 'Axe Throw', desc: 'Throw a rotating combat axe.', icon: axe_throw, type: 'projectile', projectileIcon: axe_throw }
    ]
  },
  {
    id: 'monk',
    name: 'Monk',
    portrait: monk,
    abilities: [
      { id: 'fist_punch', name: 'Fist Punch', desc: 'Execute a rapid double-fist combo.', icon: claws, type: 'melee_punches' },
      { id: 'whirlwind_kick', name: 'Whirlwind Kick', desc: 'Spin forward with a flurry of kicks.', icon: meditate, type: 'melee_spin' },
      { id: 'chi_blast', name: 'Chi Blast', desc: 'Launch a concentrated sphere of inner energy.', icon: energy_blast, type: 'projectile', projectileIcon: energy_blast },
      { id: 'chakra_restore', name: 'Chakra Restore', desc: 'Meditate to heal wounds and recharge.', icon: meditate, type: 'heal_gold' }
    ]
  },
  {
    id: 'summoner',
    name: 'Summoner',
    portrait: summoner,
    abilities: [
      { id: 'summon_familiar', name: 'Summon Bat', desc: 'Open a dark portal and summon a bat minion.', icon: bat_gate, type: 'summon' },
      { id: 'energy_drain', name: 'Energy Drain', desc: 'Siphon lifeforce from target to summoner.', icon: energy_drain, type: 'beam_drain' },
      { id: 'void_portal', name: 'Void Portal', desc: 'Open a black hole directly under the target.', icon: voidfill, type: 'void_portal' },
      { id: 'shadow_bolt', name: 'Shadow Bolt', desc: 'Hurl a bolt of condensed dark shadow.', icon: void_lance, type: 'projectile', projectileIcon: void_lance }
    ]
  },
  {
    id: 'engineer',
    name: 'Engineer',
    portrait: engineer,
    abilities: [
      { id: 'shoot_rifle', name: 'Shoot Rifle', desc: 'Fire a rifle shot with mechanical precision.', icon: bow_and_arrow, type: 'projectile', projectileIcon: arrowUp },
      { id: 'throw_grenade', name: 'Throw Grenade', desc: 'Toss a shrapnel bomb in an arc.', icon: fire_blast, type: 'projectile_arc', projectileIcon: fire_blast },
      { id: 'deploy_turret', name: 'Deploy Turret', desc: 'Construct a defensive turret on the grid.', icon: construct_icon, type: 'deploy_turret' },
      { id: 'overdrive', name: 'Overdrive', desc: 'Overload mechanical core for extra stats.', icon: sigil_icon, type: 'overdrive' }
    ]
  }
];

const SandboxPage = () => {
  const history = useHistory();
  const [activeTab, setActiveTab] = useState('combat animations');
  const [isAssembled, setIsAssembled] = useState(false);
  const [selectedRune, setSelectedRune] = useState('archaic');

  // --- Combat Animations States ---
  const [selectedFighterId, setSelectedFighterId] = useState('ranger');
  const [fighterPos, setFighterPos] = useState({ row: 2, col: 1 });
  const [targetPos, setTargetPos] = useState({ row: 2, col: 3 });
  const [placementMode, setPlacementMode] = useState('fighter'); // 'fighter' or 'target'
  const [isAnimating, setAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(null); // 'lunge', 'leap', 'behind_target', 'teleport_fade', etc.
  const [projectile, setProjectile] = useState(null);
  const [projectiles, setProjectiles] = useState([]); // For wizard magic missile
  const [hitEffect, setHitEffect] = useState(null);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [targetShake, setTargetShake] = useState(false);
  const [targetFlash, setTargetFlash] = useState(false);
  const [targetFrozen, setTargetFrozen] = useState(false);
  const [selfBuffEffect, setSelfBuffEffect] = useState(null); // 'heal', 'barrier', 'rage'
  const [shieldWallActive, setShieldWallActive] = useState(false);
  const [activeBeam, setActiveBeam] = useState(null); // 'smite', 'lightning', 'drain'
  const [turrets, setTurrets] = useState([]); // List of coordinates {row, col}
  const [minions, setMinions] = useState([]); // List of coordinates {row, col}

  const activeData = runesData[selectedRune];

  const tabs = [
    { id: 'combat animations', label: 'Combat Animations', enabled: true },
    { id: 'shard assembly', label: 'Shard Assembly', enabled: true },
    { id: 'item upgrade', label: 'Item Upgrade', enabled: false }
  ];

  const selectedFighter = fightersData.find(f => f.id === selectedFighterId) || fightersData[0];
  const targetPortrait = selectedFighterId === 'sage' ? soldier_portrait : goblin_portrait;
  const targetName = selectedFighterId === 'sage' ? 'Soldier Target' : 'Goblin Target';

  // Helper to push floating combat numbers
  const addFloatingText = (text, type, color, row, col) => {
    const id = Math.random();
    setFloatingTexts(prev => [...prev, { id, text, type, color, row, col }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 1000);
  };

  // Helper to determine projectile rotation angle
  const getProjectileAngle = () => {
    const dy = targetPos.row - fighterPos.row;
    const dx = targetPos.col - fighterPos.col;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  // Helper to determine dynamic lunge/jump transform offsets
  const getFighterTransformStyle = () => {
    if (!isAnimating) return 'none';
    const colDiff = targetPos.col - fighterPos.col;
    const rowDiff = targetPos.row - fighterPos.row;

    switch (animationPhase) {
      case 'lunge':
        // Lunge 80% of the way to target
        return `translate(${colDiff * 80}%, ${rowDiff * 80}%)`;
      case 'step_adjacent':
        const dx = fighterPos.col - targetPos.col;
        const dy = fighterPos.row - targetPos.row;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          const colStep = Math.round(dx / dist);
          const rowStep = Math.round(dy / dist);
          let targetColOffset = (targetPos.col + colStep) - fighterPos.col;
          let targetRowOffset = (targetPos.row + rowStep) - fighterPos.row;
          if (targetColOffset === 0 && targetRowOffset === 0) {
            targetColOffset = (targetPos.col - fighterPos.col) * 0.35;
            targetRowOffset = (targetPos.row - fighterPos.row) * 0.35;
          }
          return `translate(${targetColOffset * 100}%, ${targetRowOffset * 100}%)`;
        }
        return 'none';
      case 'leap':
        return `translate(${colDiff * 100}%, ${rowDiff * 100}%) scale(1.35)`;
      case 'behind_target':
        const colOffset = targetPos.col < 4 ? 1 : -1;
        const targetCol = targetPos.col + colOffset - fighterPos.col;
        const targetRow = targetPos.row - fighterPos.row;
        return `translate(${targetCol * 100}%, ${targetRow * 100}%)`;
      case 'teleport_fade':
        return 'scale(0.8)';
      default:
        return 'none';
    }
  };

  // Helper for transitions
  const getFighterTransitionStyle = () => {
    if (!isAnimating) return 'none';
    if (animationPhase === 'teleport_fade') return 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out';
    if (animationPhase === 'lunge') return 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    if (animationPhase === 'step_adjacent') return 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    if (animationPhase === 'leap') return 'transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    return 'transform 0.25s ease-in-out, opacity 0.2s';
  };

  // Main Ability trigger logic
  const triggerAbility = (ability) => {
    if (isAnimating) return;

    // --- MELEE ATTACKS ---
    if (ability.type === 'melee' || ability.type === 'melee_poison' || ability.type === 'melee_slam' || ability.type === 'melee_heavy' || ability.type === 'melee_punches' || ability.type === 'melee_spin') {
      setAnimating(true);
      
      const isSlash = ability.id === 'slash';
      setAnimationPhase(isSlash ? 'step_adjacent' : 'lunge');

      const hitDelay = isSlash ? 250 : 200;
      const totalDuration = isSlash ? 550 : 500;

      setTimeout(() => {
        // Impact
        setTargetShake(true);
        setTargetFlash(true);

        let hitType = isSlash ? 'sword_slash' : 'slash';
        let dmg = '-15';
        let color = '#ff4d4d';

        if (ability.type === 'melee_heavy') {
          dmg = '-38 CRIT!';
          color = '#ff3333';
        } else if (ability.type === 'melee_poison') {
          dmg = '-12 POISON';
          color = '#38b000';
          hitType = 'slash';
        } else if (ability.type === 'melee_slam') {
          dmg = '-18 SLAM';
          color = '#ff9f1c';
          hitType = 'slash';
        } else if (ability.type === 'melee_punches') {
          dmg = '-10 x2';
          color = '#ffdd57';
        }

        setHitEffect({ type: hitType });
        addFloatingText(dmg, ability.type === 'melee_heavy' ? 'crit' : 'normal', color, targetPos.row, targetPos.col);

        setTimeout(() => {
          setTargetShake(false);
          setTargetFlash(false);
          setHitEffect(null);
        }, 250);

        // Return
        setAnimationPhase('return');
      }, hitDelay);

      setTimeout(() => {
        setAnimating(false);
        setAnimationPhase(null);
      }, totalDuration);
    }

    // --- PROJECTILE ATTACKS ---
    else if (ability.type === 'projectile' || ability.type === 'projectile_arc') {
      setAnimating(true);
      
      const pIcon = ability.projectileIcon || ability.icon;
      setProjectile({
        x: fighterPos.col * 20,
        y: fighterPos.row * 20,
        icon: pIcon
      });

      // Fly to target
      setTimeout(() => {
        setProjectile(prev => prev ? {
          ...prev,
          x: targetPos.col * 20,
          y: targetPos.row * 20
        } : null);
      }, 30);

      // Hit target
      setTimeout(() => {
        setProjectile(null);
        setTargetShake(true);
        setTargetFlash(true);

        let hitType = 'slash';
        let dmg = '-16';
        let color = '#ff4d4d';

        if (ability.id === 'fireball' || ability.id === 'throw_grenade') {
          hitType = 'fire_exp';
          dmg = ability.id === 'fireball' ? '-28 EXPLODE!' : '-20 BOMB!';
          color = '#ff5400';
        } else if (ability.id === 'ice_blast') {
          hitType = 'ice_burst';
          dmg = '-14 FREEZE';
          color = '#00bfff';
          setTargetFrozen(true);
          setTimeout(() => setTargetFrozen(false), 2000);
        } else if (ability.id === 'shadow_bolt') {
          hitType = 'shadow';
          dmg = '-19 DECAY';
          color = '#7209b7';
        } else if (ability.id === 'shoot_rifle') {
          dmg = '-22 SNIPE!';
          color = '#ffe600';
        }

        setHitEffect({ type: hitType });
        addFloatingText(dmg, 'normal', color, targetPos.row, targetPos.col);

        setTimeout(() => {
          setTargetShake(false);
          setTargetFlash(false);
          setHitEffect(null);
        }, 300);

        setAnimating(false);
      }, 430);
    }

    // --- LEAP ATTACK ---
    else if (ability.type === 'leap') {
      setAnimating(true);
      setAnimationPhase('leap');

      // Hits target
      setTimeout(() => {
        setTargetShake(true);
        setTargetFlash(true);
        setHitEffect({ type: 'fire_exp' });
        addFloatingText('-30 HEAVY LANDING!', 'crit', '#e63946', targetPos.row, targetPos.col);

        // Shake the whole arena momentarily
        const arena = document.querySelector('.combat-grid-arena');
        if (arena) {
          arena.style.animation = 'shake 0.3s ease-out';
          setTimeout(() => arena.style.animation = 'none', 300);
        }

        setTimeout(() => {
          setTargetShake(false);
          setTargetFlash(false);
          setHitEffect(null);
        }, 300);

        setAnimationPhase('return');
      }, 450);

      setTimeout(() => {
        setAnimating(false);
        setAnimationPhase(null);
      }, 800);
    }

    // --- TELEPORT ATTACK (SHADOWSTEP) ---
    else if (ability.type === 'teleport') {
      setAnimating(true);
      setAnimationPhase('teleport_fade');
      setSelfBuffEffect('stealth');

      // Disappear
      setTimeout(() => {
        setAnimationPhase('behind_target');
        setSelfBuffEffect(null);

        // Strike
        setTimeout(() => {
          setTargetShake(true);
          setTargetFlash(true);
          setHitEffect({ type: 'slash' });
          addFloatingText('-25 AMBUSH!', 'crit', '#7209b7', targetPos.row, targetPos.col);

          setTimeout(() => {
            setTargetShake(false);
            setTargetFlash(false);
            setHitEffect(null);

            // Teleport back
            setAnimationPhase('teleport_fade');
            setSelfBuffEffect('stealth');
            setTimeout(() => {
              setAnimationPhase(null);
              setSelfBuffEffect(null);
              setAnimating(false);
            }, 150);
          }, 300);
        }, 150);
      }, 200);
    }

    // --- BUFFS & HEALS ---
    else if (ability.type === 'heal' || ability.type === 'heal_gold' || ability.type === 'barrier' || ability.type === 'battle_cry' || ability.type === 'overdrive') {
      setAnimating(true);
      let buff = 'heal';
      let txt = '+30 HEAL';
      let color = '#2ec4b6';

      if (ability.type === 'barrier') {
        buff = 'barrier';
        txt = 'SHIELD ON!';
        color = '#00bfff';
      } else if (ability.type === 'battle_cry') {
        buff = 'rage';
        txt = 'RAGE ATTACK!';
        color = '#e63946';
      } else if (ability.type === 'overdrive') {
        buff = 'rage';
        txt = 'OVERDRIVE';
        color = '#ffb703';
      }

      setSelfBuffEffect(buff);
      addFloatingText(txt, 'normal', color, fighterPos.row, fighterPos.col);

      setTimeout(() => {
        setSelfBuffEffect(null);
        setAnimating(false);
      }, 1000);
    }

    // --- SHIELD WALL ---
    else if (ability.type === 'shield_wall') {
      setAnimating(true);
      setShieldWallActive(true);
      addFloatingText('DEFENSE UP', 'normal', '#00bfff', fighterPos.row, fighterPos.col);
      setTimeout(() => {
        setShieldWallActive(false);
        setAnimating(false);
      }, 2000);
    }

    // --- BEAM SPELLS ---
    else if (ability.type === 'beam' || ability.type === 'lightning' || ability.type === 'beam_drain') {
      setAnimating(true);
      
      let beamType = 'smite';
      let dmg = '-32 HOLY';
      let color = '#ffe600';

      if (ability.id === 'lightning_strike') {
        beamType = 'lightning';
        dmg = '-30 LIGHTNING';
        color = '#00ffff';
      } else if (ability.id === 'energy_drain') {
        beamType = 'drain';
        dmg = '-15 DRAIN';
        color = '#7209b7';
      }

      setActiveBeam(beamType);

      // Hit target
      setTimeout(() => {
        setActiveBeam(null);
        setTargetShake(true);
        setTargetFlash(true);

        if (beamType === 'drain') {
          setHitEffect({ type: 'shadow' });
          addFloatingText('+15 HEAL', 'normal', '#2ec4b6', fighterPos.row, fighterPos.col);
        } else {
          setHitEffect({ type: 'slash' });
        }

        addFloatingText(dmg, 'normal', color, targetPos.row, targetPos.col);

        setTimeout(() => {
          setTargetShake(false);
          setTargetFlash(false);
          setHitEffect(null);
        }, 300);

        setAnimating(false);
      }, 350);
    }

    // --- MAGIC MISSILE ---
    else if (ability.type === 'magic_missile') {
      setAnimating(true);
      
      const fireMissile = (delayTime, offsetY) => {
        setTimeout(() => {
          const missileId = Math.random();
          setProjectiles(prev => [...prev, {
            id: missileId,
            x: fighterPos.col * 20,
            y: fighterPos.row * 20,
            icon: magic_missile
          }]);

          // Move
          setTimeout(() => {
            setProjectiles(prev => prev.map(p => p.id === missileId ? {
              ...p,
              x: targetPos.col * 20,
              y: targetPos.row * 20 + offsetY
            } : p));
          }, 30);

          // Impact
          setTimeout(() => {
            setProjectiles(prev => prev.filter(p => p.id !== missileId));
            setTargetShake(true);
            setTargetFlash(true);
            setHitEffect({ type: 'slash' });
            addFloatingText('-8', 'normal', '#b5179e', targetPos.row, targetPos.col);

            setTimeout(() => {
              setTargetShake(false);
              setTargetFlash(false);
              setHitEffect(null);
            }, 150);
          }, 430);

        }, delayTime);
      };

      fireMissile(0, -6);
      fireMissile(150, 0);
      fireMissile(300, 6);

      setTimeout(() => {
        setAnimating(false);
      }, 950);
    }

    // --- SUMMON BAT MINION ---
    else if (ability.type === 'summon') {
      // Find empty slot adjacent to summoner
      let summonRow = fighterPos.row;
      let summonCol = fighterPos.col + 1;
      if (summonCol > 4) summonCol = fighterPos.col - 1;

      // Ensure it doesn't overlap with target
      if (summonCol === targetPos.col && summonRow === targetPos.row) {
        summonRow = (fighterPos.row + 1) % 5;
      }

      setAnimating(true);
      // Spawn hit portal effect
      setHitEffect({ type: 'void_portal' });
      addFloatingText('SUMMON!', 'normal', '#7209b7', summonRow, summonCol);

      setTimeout(() => {
        setMinions(prev => [...prev, { row: summonRow, col: summonCol }]);
        setHitEffect(null);
        setAnimating(false);
      }, 800);
    }

    // --- DEPLOY TURRET ---
    else if (ability.type === 'deploy_turret') {
      let turretRow = fighterPos.row;
      let turretCol = fighterPos.col + 1;
      if (turretCol > 4) turretCol = fighterPos.col - 1;

      if (turretCol === targetPos.col && turretRow === targetPos.row) {
        turretRow = (fighterPos.row + 1) % 5;
      }

      setAnimating(true);
      addFloatingText('DEPLOY TURRET', 'normal', '#ffb703', turretRow, turretCol);

      setTimeout(() => {
        setTurrets(prev => [...prev, { row: turretRow, col: turretCol }]);
        setAnimating(false);
      }, 500);
    }

    // --- VOID PORTAL ---
    else if (ability.type === 'void_portal') {
      setAnimating(true);
      setHitEffect({ type: 'void_portal' });

      setTimeout(() => {
        setTargetShake(true);
        setTargetFlash(true);
        addFloatingText('-22 VOID DUST', 'normal', '#7209b7', targetPos.row, targetPos.col);

        setTimeout(() => {
          setTargetShake(false);
          setTargetFlash(false);
          setHitEffect(null);
        }, 400);

        setAnimating(false);
      }, 400);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#111',
      color: 'white',
      paddingTop: '20px',
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      {/* Dynamic Keyframes Stylesheet */}
      <style>{`
        @keyframes floatUp {
          0% { transform: translate(-50%, 0); opacity: 1; }
          100% { transform: translate(-50%, -80px); opacity: 0; }
        }
        @keyframes slashFade {
          0% { transform: scale(0.6) rotate(-20deg); opacity: 1; }
          50% { transform: scale(1.2) rotate(20deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 0; }
        }
        @keyframes explode {
          0% { transform: scale(0.3); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes portalGrow {
          0% { transform: scaleX(0.1) scaleY(0.05); opacity: 0; }
          20% { transform: scaleX(1) scaleY(0.5); opacity: 1; }
          80% { transform: scaleX(1) scaleY(0.5); opacity: 1; }
          100% { transform: scaleX(0.1) scaleY(0.05); opacity: 0; }
        }
        @keyframes scaleUp {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes beamShrink {
          0% { width: 18px; opacity: 1; }
          100% { width: 0px; opacity: 0; }
        }
        @keyframes pulse {
          0% { opacity: 0.6; box-shadow: 0 0 5px #00bfff; }
          100% { opacity: 1; box-shadow: 0 0 20px #00bfff; }
        }
        @keyframes shake {
          0% { transform: translate(0, 0); }
          20% { transform: translate(-8px, 5px); }
          40% { transform: translate(8px, -5px); }
          60% { transform: translate(-5px, -3px); }
          80% { transform: translate(5px, 3px); }
          100% { transform: translate(0, 0); }
        }
        .shield-wall-overlay {
            background: linear-gradient(
                to right,
                rgba(180, 220, 255, 0.2) 0%,
                rgba(255, 255, 255, 1)   35%,
                rgba(200, 230, 255, 1)   50%,
                rgba(255, 255, 255, 1)   65%,
                rgba(180, 220, 255, 0.2) 100%
            );
            border-radius: 3px;
            box-shadow:
                0 0 8px 4px rgba(180, 210, 255, 0.9),
                0 0 20px 8px rgba(100, 180, 255, 0.5),
                0 0 40px 16px rgba(60, 130, 255, 0.25);
            animation: shieldWallPulse 1.2s ease-in-out infinite alternate;
        }
        .shield-wall-active-portrait {
            box-shadow:
                0 0 8px 4px rgba(180, 210, 255, 0.9),
                0 0 20px 8px rgba(100, 180, 255, 0.5),
                0 0 40px 16px rgba(60, 130, 255, 0.25);
            animation: shieldWallPulse 1.2s ease-in-out infinite alternate;
        }
        @keyframes shieldWallPulse {
            from {
                opacity: 0.8;
                box-shadow:
                    0 0 8px 4px rgba(180, 210, 255, 0.9),
                    0 0 20px 8px rgba(100, 180, 255, 0.5),
                    0 0 40px 16px rgba(60, 130, 255, 0.25);
            }
            to {
                opacity: 1;
                box-shadow:
                    0 0 12px 6px rgba(200, 230, 255, 1),
                    0 0 28px 12px rgba(140, 200, 255, 0.7),
                    0 0 55px 22px rgba(80, 160, 255, 0.4);
            }
        }
        @keyframes ArcAnimation_right {
          0%{
            transform: translate(-45px, -35px) rotate(-60deg);
            opacity: 0.1;
          }
          50%{
            transform: translate(0px, -10px) rotate(15deg);
            opacity: 0.9;
          }
          80%{
            transform: translate(15px, 10px) rotate(50deg);
            opacity: 1;
          }
          100%{
            transform: translate(0px, 25px) rotate(90deg);
            opacity: 0;
          }
        }
        @keyframes ArcAnimation_left {
          0%{
            transform: translate(45px, -35px) rotate(60deg);
            opacity: 0.1;
          }
          50%{
            transform: translate(0px, -10px) rotate(-15deg);
            opacity: 0.9;
          }
          80%{
            transform: translate(-15px, 10px) rotate(-50deg);
            opacity: 1;
          }
          100%{
            transform: translate(0px, 25px) rotate(-90deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* Header & Tabs */}
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        borderBottom: '1px solid #333', 
        padding: '0 20px',
        marginBottom: '40px'
      }}>
        <button 
          onClick={() => history.push('/landing')}
          style={{
            padding: '10px 20px',
            cursor: 'pointer',
            alignSelf: 'center',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            borderRadius: '4px',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >
          Back
        </button>
        
        <div style={{ display: 'flex', gap: '20px', marginLeft: '40px' }}>
          {tabs.map(tab => (
            <div 
              key={tab.id}
              onClick={() => tab.enabled && setActiveTab(tab.id)}
              style={{
                padding: '15px 20px',
                cursor: tab.enabled ? 'pointer' : 'not-allowed',
                opacity: tab.enabled ? 1 : 0.5,
                borderBottom: activeTab === tab.id ? '2px solid white' : '2px solid transparent',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                transition: 'all 0.2s',
                color: activeTab === tab.id ? 'white' : '#888'
              }}
            >
              {tab.label}
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'combat animations' && (
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          maxWidth: '1200px',
          gap: '30px',
          padding: '0 20px',
          alignItems: 'stretch',
          marginBottom: '50px'
        }}>
          {/* Left Panel: Fighters */}
          <div style={{
            flex: '1',
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxHeight: '75vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', fontSize: '18px', color: '#ffb703', letterSpacing: '0.05em' }}>FIGHTERS</h3>
            {fightersData.map(f => {
              const isSelected = selectedFighterId === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => {
                    if (isAnimating) return;
                    setSelectedFighterId(f.id);
                    // Reset character specific visual states
                    setTargetFrozen(false);
                    setShieldWallActive(false);
                    setTurrets([]);
                    setMinions([]);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '10px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(255, 183, 3, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '2px solid #ffb703' : '2px solid transparent',
                    cursor: isAnimating ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? '0 0 15px rgba(255, 183, 3, 0.15)' : 'none'
                  }}
                >
                  <img src={f.portrait} alt={f.name} style={{ width: '50px', height: '50px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.15)', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{f.name}</div>
                    <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.04em' }}>{f.id}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Panel: Combat Arena */}
          <div className="combat-grid-arena" style={{
            flex: '2.5',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            alignItems: 'center'
          }}>
            {/* Grid Controls */}
            <div style={{
              display: 'flex',
              gap: '20px',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.03)',
              padding: '8px 20px',
              borderRadius: '30px',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <span style={{ fontSize: '13px', color: '#aaa' }}>Click grid to place:</span>
              <button
                onClick={() => setPlacementMode('fighter')}
                style={{
                  background: placementMode === 'fighter' ? '#ffb703' : 'transparent',
                  color: placementMode === 'fighter' ? '#000' : '#fff',
                  border: 'none',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  transition: 'all 0.2s'
                }}
              >
                Attacker
              </button>
              <button
                onClick={() => setPlacementMode('target')}
                style={{
                  background: placementMode === 'target' ? '#ff5400' : 'transparent',
                  color: placementMode === 'target' ? '#000' : '#fff',
                  border: 'none',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  transition: 'all 0.2s'
                }}
              >
                Target
              </button>
              
              <button
                onClick={() => {
                  setFighterPos({ row: 2, col: 1 });
                  setTargetPos({ row: 2, col: 3 });
                  setTurrets([]);
                  setMinions([]);
                  setTargetFrozen(false);
                  setShieldWallActive(false);
                }}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: '#ccc',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  transition: 'all 0.2s'
                }}
              >
                Reset Coordinates
              </button>
            </div>

            {/* Grid Container */}
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1/1',
              background: '#161618',
              borderRadius: '16px',
              border: '2px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gridTemplateRows: 'repeat(5, 1fr)',
              overflow: 'hidden'
            }}>
              {/* Render grid cells */}
              {Array.from({ length: 5 }).map((_, r) => (
                Array.from({ length: 5 }).map((_, c) => {
                  const isFighter = fighterPos.row === r && fighterPos.col === c;
                  const isTarget = targetPos.row === r && targetPos.col === c;
                  const isTurret = turrets.some(t => t.row === r && t.col === c);
                  const isMinion = minions.some(m => m.row === r && m.col === c);

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => {
                        if (isAnimating) return;
                        if (placementMode === 'fighter') {
                          if (isTarget) return; // Overlap guard
                          setFighterPos({ row: r, col: c });
                        } else {
                          if (isFighter) return; // Overlap guard
                          setTargetPos({ row: r, col: c });
                        }
                      }}
                      style={{
                        border: '1px solid rgba(255,255,255,0.04)',
                        background: (r + c) % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.15)',
                        position: 'relative',
                        cursor: isAnimating ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                      }}
                    >
                      {/* Cell Coordinates */}
                      <div style={{ position: 'absolute', top: '5px', left: '5px', fontSize: '9px', color: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }}>
                        {c},{r}
                      </div>

                      {/* Render Turret */}
                      {isTurret && (
                        <div style={{ width: '60%', height: '60%', position: 'relative', animation: 'scaleUp 0.3s ease-out' }}>
                          <img src={construct_icon} alt="turret" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          <div style={{ position: 'absolute', bottom: '-8px', left: '0', width: '100%', textAlign: 'center', fontSize: '9px', color: '#ffb703', fontWeight: 'bold' }}>TURRET</div>
                        </div>
                      )}

                      {/* Render Minion */}
                      {isMinion && (
                        <div style={{ width: '60%', height: '60%', position: 'relative', animation: 'scaleUp 0.3s ease-out' }}>
                          <img src={bat_gate} alt="bat minion" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          <div style={{ position: 'absolute', bottom: '-8px', left: '0', width: '100%', textAlign: 'center', fontSize: '9px', color: '#a2d2ff', fontWeight: 'bold' }}>BAT</div>
                        </div>
                      )}
                    </div>
                  );
                })
              ))}

              {/* --- Attacker Portrait Overlay --- */}
              <div
                style={{
                  position: 'absolute',
                  width: '20%',
                  height: '20%',
                  left: `${fighterPos.col * 20}%`,
                  top: `${fighterPos.row * 20}%`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  pointerEvents: 'none',
                  transform: getFighterTransformStyle(),
                  opacity: selfBuffEffect === 'stealth' ? 0.3 : 1,
                  transition: getFighterTransitionStyle()
                }}
              >
                <div
                  className={selectedFighterId === 'soldier' && shieldWallActive ? 'shield-wall-active-portrait' : ''}
                  style={{
                    width: '80%',
                    height: '80%',
                    borderRadius: '8px',
                    border: '2px solid #ffb703',
                    backgroundColor: '#222',
                    backgroundImage: `url(${selectedFighter.portrait})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    boxShadow: (selectedFighterId === 'soldier' && shieldWallActive)
                      ? undefined
                      : selfBuffEffect === 'rage'
                        ? '0 0 20px rgba(255, 0, 0, 0.7), inset 0 0 10px rgba(255, 0, 0, 0.5)'
                        : selfBuffEffect === 'barrier'
                          ? '0 0 20px rgba(0, 150, 255, 0.7), inset 0 0 10px rgba(0, 150, 255, 0.5)'
                          : '0 8px 16px rgba(0,0,0,0.5)',
                    position: 'relative'
                  }}>
                  {/* Name Tag */}
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    width: '100%',
                    background: 'rgba(0,0,0,0.75)',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    padding: '2px 0',
                    borderBottomLeftRadius: '6px',
                    borderBottomRightRadius: '6px'
                  }}>
                    {selectedFighter.name}
                  </div>
                </div>
              </div>

              {/* --- Target Portrait Overlay --- */}
              <div
                style={{
                  position: 'absolute',
                  width: '20%',
                  height: '20%',
                  left: `${targetPos.col * 20}%`,
                  top: `${targetPos.row * 20}%`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9,
                  pointerEvents: 'none',
                  transform: targetShake ? 'translate(5px, 2px) rotate(2deg)' : 'none',
                  transition: 'transform 0.05s'
                }}
              >
                <div style={{
                  width: '80%',
                  height: '80%',
                  borderRadius: '8px',
                  border: targetFlash ? '3px solid #ff4d4d' : '2px solid #ff5400',
                  backgroundColor: targetFlash ? '#990000' : '#222',
                  backgroundImage: `url(${targetPortrait})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: targetFrozen ? 'hue-rotate(180deg) brightness(1.2)' : 'none',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                  position: 'relative'
                }}>
                  {/* Frozen Overlay */}
                  {targetFrozen && (
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, width: '100%', height: '100%',
                      background: 'rgba(0, 191, 255, 0.25)',
                      border: '2px solid #00bfff',
                      borderRadius: '6px',
                      pointerEvents: 'none'
                    }}></div>
                  )}
                  {/* Name Tag */}
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    width: '100%',
                    background: 'rgba(0,0,0,0.75)',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    padding: '2px 0',
                    borderBottomLeftRadius: '6px',
                    borderBottomRightRadius: '6px'
                  }}>
                    {targetName}
                  </div>
                </div>
              </div>

              {/* --- Projectile Overlay --- */}
              {projectile && (
                <img
                  src={projectile.icon}
                  alt="projectile"
                  style={{
                    position: 'absolute',
                    width: '40px',
                    height: '40px',
                    left: `calc(${projectile.x}% + 10% - 20px)`,
                    top: `calc(${projectile.y}% + 10% - 20px)`,
                    transform: `rotate(${getProjectileAngle()}deg)`,
                    objectFit: 'contain',
                    zIndex: 30,
                    filter: projectile.icon === magic_missile
                      ? 'drop-shadow(0 0 2px #fff) drop-shadow(0 0 6px #ff00ff) drop-shadow(0 0 10px #fff) drop-shadow(0 0 2px #000) drop-shadow(0 0 4px #000) brightness(1.4)'
                      : 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))',
                    transition: 'left 0.4s linear, top 0.4s linear'
                  }}
                />
              )}

              {/* --- Wizard Magic Missiles (multi-projectiles) --- */}
              {projectiles.map(p => (
                <img
                  key={p.id}
                  src={p.icon}
                  alt="magic missile"
                  style={{
                    position: 'absolute',
                    width: '30px',
                    height: '30px',
                    left: `calc(${p.x}% + 10% - 15px)`,
                    top: `calc(${p.y}% + 10% - 15px)`,
                    transform: `rotate(${getProjectileAngle()}deg)`,
                    objectFit: 'contain',
                    zIndex: 30,
                    filter: 'drop-shadow(0 0 2px #fff) drop-shadow(0 0 6px #ff00ff) drop-shadow(0 0 10px #fff) drop-shadow(0 0 2px #000) drop-shadow(0 0 4px #000) brightness(1.4)',
                    transition: 'left 0.4s linear, top 0.4s linear'
                  }}
                />
              ))}

              {/* --- Special Beams / Overlays (like Smite, Lightning) --- */}
              {activeBeam && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${targetPos.col * 20 + 10}%`,
                    width: '12px',
                    background: activeBeam === 'smite' ? 'linear-gradient(to bottom, #fff, #ffe600)' : 'linear-gradient(to bottom, #00ffff, #0088ff)',
                    top: 0,
                    height: `${targetPos.row * 20 + 10}%`,
                    transform: 'translateX(-50%)',
                    boxShadow: activeBeam === 'smite' ? '0 0 20px #ffe600, 0 0 40px #ffe600' : '0 0 20px #00ffff, 0 0 40px #00ffff',
                    zIndex: 25,
                    animation: 'beamShrink 0.35s ease-out forwards'
                  }}
                ></div>
              )}

              {/* --- Hit Particle Effect Overlay --- */}
              {hitEffect && (
                <div
                  style={{
                    position: 'absolute',
                    width: '120px',
                    height: '120px',
                    left: `${targetPos.col * 20 + 10}%`,
                    top: `${targetPos.row * 20 + 10}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 40,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {hitEffect.type === 'slash' && (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url(${claws})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      animation: 'slashFade 0.3s ease-out forwards'
                    }}></div>
                  )}
                  {hitEffect.type === 'sword_slash' && (() => {
                    const dx = targetPos.col - fighterPos.col;
                    const direction = dx >= 0 ? 'right' : 'left';
                    return (
                      <img
                        src={sword_white}
                        alt="sword swing"
                        style={{
                          width: '60px',
                          height: '60px',
                          pointerEvents: 'none',
                          zIndex: 5000,
                          animation: `ArcAnimation_${direction} 0.35s linear forwards`
                        }}
                      />
                    );
                  })()}
                  {hitEffect.type === 'fire_exp' && (
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, #ffe600 20%, #ff5400 60%, transparent 100%)',
                      animation: 'explode 0.3s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                      boxShadow: '0 0 30px #ff5400'
                    }}></div>
                  )}
                  {hitEffect.type === 'ice_burst' && (
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'radial-gradient(circle, #fff 10%, #00bfff 60%, transparent 100%)',
                      clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                      animation: 'explode 0.4s ease-out forwards',
                      boxShadow: '0 0 20px #00bfff'
                    }}></div>
                  )}
                  {hitEffect.type === 'shadow' && (
                    <div style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, #7209b7 30%, #560bad 80%, transparent 100%)',
                      animation: 'explode 0.3s ease-out forwards',
                      boxShadow: '0 0 20px #7209b7'
                    }}></div>
                  )}
                  {hitEffect.type === 'void_portal' && (
                    <div style={{
                      width: '90px',
                      height: '25px',
                      background: '#111',
                      border: '2px solid #7209b7',
                      borderRadius: '50%',
                      boxShadow: '0 0 15px #7209b7',
                      animation: 'portalGrow 0.8s ease-out forwards',
                      transform: 'scaleY(0.5)'
                    }}></div>
                  )}
                </div>
              )}

              {/* --- Floating Combat Text --- */}
              {floatingTexts.map(ft => (
                <div
                  key={ft.id}
                  style={{
                    position: 'absolute',
                    left: `${ft.col * 20 + 10}%`,
                    top: `${ft.row * 20}%`,
                    transform: 'translateX(-50%)',
                    color: ft.color || '#ff4d4d',
                    fontWeight: 'bold',
                    fontSize: ft.type === 'crit' ? '22px' : '17px',
                    textShadow: '0 2px 4px #000, 0 0 8px rgba(0,0,0,0.8)',
                    zIndex: 60,
                    pointerEvents: 'none',
                    animation: 'floatUp 0.9s cubic-bezier(0.1, 0.8, 0.3, 1) forwards'
                  }}
                >
                  {ft.text}
                </div>
              ))}

              {/* --- Shield Wall Overlay (Real established visual) --- */}
              {shieldWallActive && selectedFighterId === 'soldier' && (() => {
                const centerY = fighterPos.row;
                const lanesAffected = [];
                for (let dy = -2; dy <= 2; dy++) {
                  const lane = centerY + dy;
                  if (lane >= 0 && lane < 5) {
                    lanesAffected.push(lane);
                  }
                }
                const minLane = Math.min(...lanesAffected);
                const topPercent = minLane * 20;
                const heightPercent = lanesAffected.length * 20;
                return (
                  <div
                    className="shield-wall-overlay"
                    style={{
                      position: 'absolute',
                      left: `calc(${(fighterPos.col + 1) * 20}% - 3px)`,
                      top: `${topPercent}%`,
                      width: '6px',
                      height: `${heightPercent}%`,
                      zIndex: 20,
                      pointerEvents: 'none'
                    }}
                  />
                );
              })()}
            </div>
          </div>

          {/* Right Panel: Abilities */}
          <div style={{
            flex: '1',
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            maxHeight: '75vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', fontSize: '18px', color: '#ff5400', letterSpacing: '0.05em' }}>ABILITIES</h3>
            {selectedFighter.abilities.map(a => (
              <button
                key={a.id}
                disabled={isAnimating}
                onClick={() => triggerAbility(a)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  cursor: isAnimating ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  outline: 'none',
                  opacity: isAnimating ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (isAnimating) return;
                  e.currentTarget.style.background = 'rgba(255, 84, 0, 0.12)';
                  e.currentTarget.style.borderColor = '#ff5400';
                }}
                onMouseLeave={(e) => {
                  if (isAnimating) return;
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '4px',
                  background: '#222',
                  backgroundImage: `url(${a.icon})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  border: '1px solid rgba(255,255,255,0.15)',
                  flexShrink: '0'
                }}></div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#ff9f1c' }}>{a.name}</div>
                  <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px', lineHeight: '1.3' }}>{a.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Shard Assembly Content (preserved functionality) */}
      {activeTab === 'shard assembly' && (
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          maxWidth: '1200px',
          gap: '30px',
          padding: '0 20px',
          alignItems: 'stretch',
          marginBottom: '50px'
        }}>
          {/* Left panel placeholder with matching dimensions */}
          <div style={{
            flex: '1',
            visibility: 'hidden',
            maxHeight: '75vh'
          }} />

          {/* Center Panel: Shard Assembly Content */}
          <div style={{
            flex: '2.5',
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
            alignItems: 'center',
            justifyContent: 'flex-start',
            minHeight: '75vh'
          }}>
            {/* Rune Selection Menu */}
            <div style={{
              display: 'flex',
              gap: '15px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              background: '#222',
              padding: '15px',
              borderRadius: '8px'
            }}>
              {Object.keys(runesData).map(runeName => {
                const data = runesData[runeName];
                const isSelected = selectedRune === runeName;
                
                return (
                  <div 
                    key={runeName} 
                    style={{ 
                      position: 'relative', 
                      cursor: data.isComplete ? 'pointer' : 'not-allowed', 
                      opacity: data.isComplete ? 1 : 0.4,
                      border: isSelected ? '2px solid white' : '2px solid transparent',
                      borderRadius: '4px',
                      padding: '4px',
                      transition: 'border 0.2s'
                    }}
                    onClick={() => data.isComplete && setSelectedRune(runeName)}
                    title={runeName}
                  >
                    <img src={data.baseImg} alt={runeName} style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                    {!data.isComplete && (
                      <div style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'rgba(255, 0, 0, 0.8)', 
                        fontSize: '60px', 
                        fontWeight: 'bold',
                        pointerEvents: 'none'
                      }}>
                        X
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => setIsAssembled(!isAssembled)}
              style={{
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                opacity: activeData?.isComplete ? 1 : 0.5,
                pointerEvents: activeData?.isComplete ? 'auto' : 'none',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: '4px'
              }}
            >
              {isAssembled ? 'Reset' : 'Animate'}
            </button>

            {/* Animation Containers */}
            {activeData?.isComplete && (
              <div style={{ display: 'flex', gap: '50px' }}>
                {/* Container 1: Assembled Image Reference */}
                <div style={{
                  width: '100px',
                  height: '100px',
                  border: '1px solid #333',
                  position: 'relative'
                }}>
                  <img 
                    src={activeData.assembledImg} 
                    alt={`${selectedRune} Assembled`} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                  />
                </div>

                {/* Container 2: Shards Overlay */}
                <div style={{
                  width: '100px',
                  height: '100px',
                  border: '1px solid #333',
                  position: 'relative'
                }}>
                  <AssemblyAnimation 
                    pieces={activeData.pieces} 
                    isAssembled={isAssembled} 
                    distance={40}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right panel placeholder with matching dimensions */}
          <div style={{
            flex: '1',
            visibility: 'hidden',
            maxHeight: '75vh'
          }} />
        </div>
      )}
    </div>
  );
};

export default SandboxPage;
