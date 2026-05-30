import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import AssemblyAnimation from '../components/assembly-animation';
import {
  rogue,
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
  sword_white,

  // Ranger Specials
  ranger_ice_arrow,
  ranger_force_arrow,
  ranger_poison_arrow,
  ranger_celestial_arrow,
  ranger_loose,
  ranger_notch,
  ranger_mark,
  ranger_execute,

  // Sage Specials
  healing_hands,
  circle_of_protection,
  shielded,
  shielded_partial,

  // Monk Specials
  monk_ethereal_speed,
  monk_astral_focus,
  monk_astral_projection,
  monk_third_eye,
  monk_whirlwind,
  monk_inner_fire,
  monk_meditate,
  monk_force_punch,
  monk_punch,
  monk_twin_finger_authority,
  monk_flurry,
  monk_force_punch_flurry,

  // Wizard Specials
  wizard_disintegrate,
  wizard_sleep,
  wizard_annihilation,
  wizard_vortex,
  wizard_acid_blast,
  broadsword,
  claymore,
  katana,
  falchion,
} from '../utils/images';

// Predefined list of 8 crew fighters and their test abilities
const fightersData = [
  {
    id: 'rogue',
    name: 'Rogue',
  barbarian_swing,
  barbarian_cleave,
  barbarian_axe_throw,
  barbarian_berserker,
  barbarian_leap_attack,

  // Weapons
  longsword,
  broadsword,
  claymore,
  warlords_cleaver,
  axe,
  axe_white,

  // Monsters
  ogre_portrait,
  mummy_portrait,
  troll_portrait,
  vampire_portrait,
  wraith_portrait,
  skeleton_portrait,
  djinn_portrait,
  gorgon_portrait,
  goat_demon_portrait,

  // Effects
  bleeding
} from '../utils/images';

// Dynamically load all runes from the directory
const req = require.context('../assets/icons/runes', true, /\.png$/);

const runesData = {};

req.keys().forEach(key => {
  const parts = key.split('/');
      { id: 'ice_blast', name: 'Ice Blast', desc: 'Freeze target in a block of absolute-zero ice.', icon: ice_blast, type: 'projectile', projectileIcon: ice_blast },
      { id: 'magic_missile', name: 'Magic Missile', desc: 'Fire three seeking missiles in sequence.', icon: magic_missile, type: 'magic_missile' },
      { id: 'lightning_strike', name: 'Lightning', desc: 'Strike the target with electrical charge.', icon: lightning, type: 'lightning' }

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
    id: 'rogue',
    name: 'Rogue
});

// Predefined list of 8 crew fighters and their test abilities
const fightersData = [
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
  const [selectedFighterId, setSelectedFighterId] = useState('rogue');
  const [fighterPos, setFighterPos] = useState({ row: 2, col: 1 });
  const [targetPos, setTargetPos] = useState({ row: 2, col: 3 });
  const [placementMode, setPlacementMode] = 
const SandboxPage = () => {
  const history = useHistory();
    { id: 'titans_claw', name: 'Titan\'s Claw', icon: titans_claw },
    { id: 'entropy', name: 'Entropy', icon: entropy }
  ]
};

const AXES_TIERS = {
  'Tier 1 (Common)': [
    { id: 'axe_upright', name: 'Common Axe', icon: axe_upright },
    { id: 'axe_1', name: 'Hand Axe', icon: axe_1 },
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
//   - [x] Update Monk abilities configuration in SandboxPage.js with new names and icons
//   - [x] Modify ArcAnimation keyframes to start closer to divide and cover a wider arc
//   - [x] Implement cleave_slash hit type and CleaveAnimation keyframes with impact jerk
//   - [x] Render cleave_slash inside the JSX hit overlay in SandboxPage.js
// 
// - [x] Tight Swing Arc and Quoted Icon URLs
//   - [x] Adjust swing and cleave keyframe animations to execute a tighter arc closer to the divide
//   - [x] Add double quotes around all CSS url() strings in SandboxPage.js to fix files with spaces in filenames
//   - [x] Verify build and tests pass successfully
  const [animationPhase, setAnimationPhase] = useState(null); // 'lunge', 'leap', 'behind_target', 'teleport_fade', etc.
  const [projectile, setProjectile] = useState(null);
  const [projectiles, setProjectiles] = useState([]); // For wizard magic missile
  const [hitEffect, setHitEffect] = useState(null);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [targetShake, setTargetShake] = useState(false);
  const [targetFlash, setTargetFlash] = useState(false);
  const [targetFrozen, setTargetFrozen] = useState(false);
  const [targetHealActive, setTargetHealActive] = useState(false);
  const [targetPushing, setTargetPushing] = useState(false);
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
  
  // Barbarian States
  const [berserkerActive, setBerserkerActive] = useState(false);
  const [berserkerFading, setBerserkerFading] = useState(false);

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
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 3000);
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
        addFloatingText(d
    : (selectedFighterId === 'sage' ? 'Soldier Target' : 'Goblin Target');

  // Helper to push floating combat numbers
  const addFloatingText = (text, type, color, row, col) => {
    const id = Math.random();
    setFloatingTexts(prev => [...prev, { id, text, type, color, row, col }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 2000);
  };

  // Helper to determine projectile rotation angle
  const getProjectileAngle = () => {
    const dy = targetPos.row - fighterPos.row;
    const dx = targetPos.col - fighterPos.col;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };
    const dy = targetPos.row - fighterPos.row;
    const dx = targetPos.col - fighterPos.col;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const colDiff = targetPos.col - fighterPos.col;
  const rowDiff = targetPos.row - fighterPos.row;
  const dist = Math.sqrt(colDiff * colDiff + rowDiff * rowDiff);
  const leapColOffset = dist > 0 ? colDiff - (0.5 * colDiff / dist) : colDiff;
  const leapRowOffset = dist > 0 ? rowDiff - (0.5 * rowDiff / dist) : rowDiff;

  // Helper to determine dynamic lunge/jump transform offsets
  const getFighterTransformStyle = () => {
    if (!isAnimating) return 'none';

    switch (animationPhase) {
      case 'lunge':
        // Lunge 80% of the way to target
        return `translate(${colDiff * 80}%, ${rowDiff * 80}%)`;
      case 'step_adjacent':
        const dx = fighterPos.col - targetPos.col;
        const dy = fighterPos.row - targetPos.row;
        const stepDist = Math.sqrt(dx * dx + dy * dy);
        if (stepDist > 0) {
          const colStep = Math.round(dx / stepDist);
          const rowStep = Math.round(dy / stepDist);
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
        return `translate(${leapColOffset * 100}%, ${leapRowOffset * 100}%)`;
      case 'behind_target':
        const colOffset = targetPos.col < 4 ? 1 : -1;
        const targetCol = targetPos.col + colOffset - fighterPos.col;
        const targetRow = targetPos.row - fighterPos.row;
        return `translate(${targetCol * 100}%, ${targetRow * 100}%)`;
      case 'teleport_fade':
        return 'scale(0.8)';
      default:
        return 'none';
  const getFighterTransitionStyle = () => {
    if (!isAnimating) return 'none';
    if (animationPhase === 'teleport_fade') return 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out';
    if (animationPhase === 'lunge') return 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    if (animationPhase === 'step_adjacent') return 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    if (animationPhase === 'leap') return 'none';
    return 'transform 0.25s ease-in-out, opacity 0.2s';
  };

  // Helper to determine the target's protection state relative to Sage's location
  const getTargetProtectionLevel = () => {
    if (leftTab !== 'fighters' || selectedFighterId !== 'sage' || !circleActive) return 'none';
    const dx = targetPos.col - fighterPos.col;
    const dy = targetPos.row - fighterPos.row;
    const distSq = dx * dx + dy * dy;
    );
  };

  // Helper to render berserker overlay icon on Barbarian's portrait
  const renderBerserkerIcon = () => {
    if (!berserkerActive) return null;
    return (
      <div
        style={{
  const renderShieldIcon = (level) => {
    if (level === 'none') return null;
    const isFull = level === 'full';
    return (
      <div
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          width: '24px',
          height: '24px',
          zIndex: 25,
          borderRadius: '4px',
          overflow: 'hidden',
          animation: circleFading 
            ? 'scaleDownAndFade 0.5s ease-in-out forwards' 
            : 'scaleUp 0.3s ease-out'
        }}
      >
        <img
          src={isFull ? shielded : shielded_partial}
          alt={isFull ? 'full protection' : 'partial protection'}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '2px',
            boxSizing: 'border-box',
            filter: 'drop-shadow(0 0 4px rgba(0, 191, 255, 0.8))'
          }}
        />
        {!circleFading && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transform: 'rotate(-90deg)',
              r="6"
              fill="none"
              stroke="rgba(230, 57, 70, 0.35)"
              strokeWidth="12"
              strokeDasharray="37.7"
              strokeDashoffset="37.7"
              style={{
                animation: 'progressSweep 8.8s linear forwards'
              }}
              cx="12"
              cy="12"
              r="6"
              fill="none"
              stroke="rgba(230, 57, 70, 0.35)"
              strokeWidth="12"
              strokeDasharray="37.7"
              strokeDashoffset="37.7"
              style={{
                animation: 'progressSweep 8.8s linear forwards'
              }}
            />
          </svg>
        )}
      </div>
    );
  };

  const renderEtherealIcon = () => {
    if (!etherealActive) return null;
    return (
      <div
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          width: '24px',
          height: '24px',
          zIndex: 25,
          borderRadius: '4px',
          overflow: 'hidden',
          animation: etherealFading 
            ? 'scaleDownAndFade 0.5s ease-in-out forwards' 
            : 'scaleUp 0.3s ease-out'
        }}
      >
        <img
          src={monk_ethereal_speed}
          alt="ethereal speed"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '2px',
            boxSizing: 'border-box',
            filter: 'drop-shadow(0 0 4px rgba(255, 159, 28, 0.8))'
          }}
        />
      
            <circle
              cx="12"
              cy="12"
              r="6"
              fill="none"
              stroke="rgba(255, 159, 28, 0.35)"
              strokeWidth="12"
              strokeDasharray="37.7"
              strokeDashoffset="37.7"
              style={{
                animation: 'progressSweep 8.8s linear forwards'
              }}
            />
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
          
          if (ability.id === 'fireball') {
            // Trigger 1-tile adjacent fire ring splash
            setFireRingActive(true);
            setTimeout(() => setFireRingActive(false), 800);
            
            // Check if Extra Goblin at (4,1) is adjacent
            if (leftTab === 'fighters' && getDistance(targetPos, { row: 4, col: 1 }) <= 1) {
              setWizardGoblinShake(true);
              setWizardGoblinFlash(true);
              addFloatingText('-14 SPLASH!', 'normal', '#ff5400', 4, 1);
              setTimeout(() => {
                setWizardGoblinShake(false);
                setWizardGoblinFlash(false);
              }, 300);
            }
          }
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
        } else if (ability.id === 'sleep') {
          hitType = 'sleep_sparkle';
          dmg = 'SLEEP';
          color = '#9b5de5';
          setTargetSleeping(true);
          setTimeout(() => setTargetSleeping(false), 2500);
        } else if (ability.id === 'acid_blast') {
          hitType = 'acid_splash';
          dmg = '-15 ACID CORROSION';
          color = '#38b000';
          setTargetAcidMelt(true);
          // 3 ticks of acid
          for (let i = 1; i <= 3; i++) {
            setTimeout(() => {
              addFloatingText('-5 ACID', 'normal', '#38b000', targetPos.row, targetPos.col);
              setTargetShake(true);
              setTimeout(() => setTargetShake(false), 150);
            }, i * 500);
          }
          setTimeout(() => setTargetAcidMelt(false), 2000);
        } else if (ability.id === 'annihilation') {
          hitType = 'annihilation_exp';
          dmg = '-45 ANNIHILATION!';
          color = '#7209b7';
          // Shake arena
          const arena = document.querySelector('.combat-grid-arena');
          if (arena) {
            arena.style.animation = 'shake 0.4s ease-out';
            setTimeout(() => arena.style.animation = 'none', 400);
          }
        }

        setHitEffect({ type: hitType });
 
      }, 400);
    }
  };

      setTimeout(() => {
        setTargetShake(true);
        setTargetFlash(true);
        setHitEffect({ type: 'fire_exp' });
        addFloatingText('-30 HEAVY LANDING!', 'crit', '#e63946', targetPos.row, targetPos.col);

        // Shake the whole arena
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
      }, 960);

      setTimeout(() => {
        setAnimating(false);
        setAnimationPhase(null);
      }, 1200);
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
            
              setHitEffect(null);
            }, 150);
          }, 430);

        }, delayTime);
      };

      // Shoot three arrows in rapid succession
      fireArrow(0, 1);
        setTargetShake(true);
        setTargetFlash(true);

        let hitType = 'slash';
        let dmg = '-18';
        let color = '#ff4d4d';

        if (selectedArrowType === 'ice') {
          hitType = 'ice_burst';
          dmg = '-15 FREEZE';
          color = '#00bfff';
          setTargetFrozen(true);
          setTimeout(() => setTargetFrozen(false), 2000);
        } else if (selectedArrowType === 'poison') {
          hitType = 'shadow';
          dmg = '-12 POISON';
          color = '#38b000';
        } else if (selectedArrowType === 'force') {
          hitType = 'fire_exp';
          dmg = '-20 FORCE';
          color = '#ff007f';
        } else if (selectedArrowType === 'celestial') {
          hitType = 'celestial_hit';
          dmg = '-25 CELESTIAL';
          color = '#ffe600';
        }

        setHitEffect({ type: hitType });
        addFloatingText(dmg, 'normal', color, targetPos.row, targetPos.col);
        setTargetMarked(false);

        setTimeout(() => {
          setTargetShake(false);
          setTargetFlash(false);
          setHitEffect(null);
        }, 300);

        setAnimating(false);
      }, 430);
      return;
    }

    if (ability.id === 'execute') {
      setAnimating(true);
      
      const fireArrow = (delayTime, index) => {
        setTimeout(() => {
          const arrowId = Math.random();
          const arrowIcons = {
            ice: ranger_ice_arrow,
            poison: ranger_poison_arrow,
            force: ranger_force_arrow,
            celestial: ranger_celestial_arrow
          };
          const arrowIcon = arrowIcons[selectedArrowType] || ranger_force_arrow;

          setProjectiles(prev => [...prev, {
            id: arrowId,
            x: fighterPos.col * 20,
            y: fighterPos.row * 20,
            isArrow: true,
            arrowType: selectedArrowType,
            icon: arrowIcon
          }]);

          // Fly to target
          setTimeout(() => {
            setProjectiles(prev => prev.map(p => p.id === arrowId ? {
              ...p,
              x: targetPos.col * 20,
              y: targetPos.row * 20
            } : p));
          }, 30);

          // Spawn trail if poison
          const startX = fighterPos.col * 20;
          const startY = fighterPos.row * 20;
          const endX = targetPos.col * 20;
          const endY = targetPos.row * 20;
          if (selectedArrowType === 'poison') {
            for (let i = 0; i < 5; i++) {
              setTimeout(() => {
                const t = (i + 1) / 6;
                const px = startX + (endX - startX) * t;
                const py = startY + (endY - startY) * t;
                const particleId = Math.random();
                setPoisonTrail(prev => [...prev, { id: particleId, x: px, y: py }]);
                setTimeout(() => {
                  setPoisonTrail(prev => prev.filter(p => p.id !== particleId));
                }, 300);
  
             color = '#ffdd57';
           } else if (ability.type === 'cleave') {
             dmg = '-30 CLEAVE!';
             color = '#d9230f';
             hitType = 'cleave_slash';
           } else if (ability.id === 'punch') {
             dmg = '-18 PUNCH';
             color = '#ffb703';
             hitType = 'monk_punch';
           } else if (ability.id === 'force_punch') {
             dmg = '-24 FORCE!';
             color = '#00ffff';
             hitType = 'monk_force_punch';
           }

          setHitEffect({ type: hitType });
          addFloatingText(dmg, ability.type === 'melee_heavy' ? 'crit' : 'normal', color, targetPos.row, targetPos.col);

          if (ability.id === 'shield_slam' || ability.id === 'force_punch') {
            setTargetPushing(true);
            const originalPos = { ...targetPos };
            const colDiff = targetPos.col - fighterPos.col;
        addFloatingText('ETHEREAL SPEED', 'normal', '#ffcc00', fighterPos.row, fighterPos.col);
        
        setTimeout(() => setEtherealSpeedFading(true), 8800);
        setTimeout(() => {
          setEtherealSpeedActive(false);
          setEtherealSpeedFading(false);
          setAnimating(false);
        }, 10800);

      } else if (ability.id === 'defensive_stance') {
        setDefensiveStanceActive(true);
        setDefensiveStanceFading(false);
        addFloatingText('DEFENSIVE STANCE', 'normal', '#a0a0a0', fighterPos.row, fighterPos.col);
        
        setTimeout(() => setDefensiveStanceFading(true), 8800);
        setTimeout(() => {
          setDefensiveStanceActive(false);
          setDefensiveStanceFading(false);
          setAnimating(false);
        }, 10800);

      } else if (ability.id === 'battle_cry_soldier') {
        addFloatingText('+2x ATK BOOST!', 'normal', '#e63946', fighterPos.row, fighterPos.col);
        // Amplifies teammates
        if (leftTab === 'fighters') {
          addFloatingText('ATK BOOST!', 'normal', '#e63946', 1, 3);
          addFloatingText('ATK BOOST!', 'normal', '#e63946', 3, 0);
        }
        setTimeout(() => setAnimating(false), 800);

      } else if (ability.id === 'one_man_army') {
        setOneManArmyActive(true);
        addFloatingText('ONE MAN ARMY!', 'normal', '#00bfff', fighterPos.row, fighterPos.col);
        setTimeout(() => {
          setOneManArmyActive(false);
          setAnimating(false);
        }, 3000);

      } else {
        // Standard self heal or buff
        let buff = 'heal';
      setAnimationPhase(isMeleeStep ? 'step_adjacent' : 'lunge');

      const hitDelay = isMeleeStep ? 250 : 200;
      const totalDuration = isMeleeStep ? 1300 : 500;

      setTimeout(() => {
        if (ability.id === 'flurry') {
          const firePunch = (offset, dmgText) => {
            setTimeout(() => {
              setTargetShake(true);
              setTargetFlash(true);
              setHitEffect({ type: 'monk_punch' });
              addFloatingText(dmgText, 'normal', '#ffb703', targetPos.row, targetPos.col);

              setTimeout(() => {
                setTargetShake(false);
                setTargetFlash(false);
                setHitEffect(null);
              }, 120);
            }, offset);
          };

          firePunch(0, '-10 FLURRY');
          firePunch(150, '-10 FLURRY');
          firePunch(300, '-10 FLURRY');

          setTimeout(() => {
            setTargetShake(false);
            setTargetFlash(false);
            setHitEffect(null);
            setAnimationPhase('return');
          }, 800);
        } else {
 
          setTargetFlash(true);

           let hitType = 'slash';
           if (ability.id === 'cleave') {
             hitType = 'cleave_slash';
            setTimeout(() => {
              setTargetShake(false);
              setTargetFlash(false);
              setHitEffect(null);
            }, 150);
          }, 430);

        }, delayTime);
      };

      // Shoot three arrows in rapid succession
      fireArrow(0, 1);
      fireArrow(150, 2);
      fireArrow(300, 3);

      setTimeout(() => {
        setAnimating(false);
      }, 950);
      return;
    }

    // --- MELEE ATTACKS ---
    if (ability.type === 'melee' || ability.type === 'melee_poison' || ability.type === 'melee_slam' || ability.type === 'melee_heavy' || ability.type === 'melee_punches' || ability.type === 'melee_spin' || ability.type === 'cleave' || ability.type === 'flurry') {
      setAnimating(true);
      
      const isMeleeStep = ability.id === 'slash' || ability.id === 'stab' || ability.id === 'cleave' || ability.id === 'heavy_swing' || ability.id === 'punch' || ability.id === 'force_punch' || ability.id === 'flurry' || ability.id === 'imbued_strike' || ability.id === 'fist_of_honor';
      setAnimationPhase(isMeleeStep ? 'step_adjacent' : 'lunge');

      const hitDelay = isMeleeStep ? 250 : 200;
      const totalDuration = isMeleeStep ? 1300 : 500;
            
            let hitType = 'slash';
            let dmg = '-10';
            let color = '#ff4d4d';

            if (selectedArrowType === 'ice') {
              hitType = 'ice_burst';
              dmg = '-8 FREEZE';
              color = '#00bfff';
              setTargetFrozen(true);
              setTimeout(() => setTargetFrozen(false), 2000);
            } else if (selectedArrowType === 'poison') {
              hitType = 'shadow';
              dmg = '-8 POISON';
              color = '#38b000';
            } else if (selectedArrowType === 'force') {
              hitType = 'fire_exp';
              dmg = '-12 FORCE';
              color = '#ff007f';
            } else if (selectedArrowType === 'celestial') {
              hitType = 'celestial_hit';
              dmg = '-15 CELESTIAL';
              color = '#ffe600';
            }

            setHitEffect({ type: hitType });
            addFloatingText(dmg, 'normal', color, targetPos.row, targetPos.col);
            setTargetMarked(false);

            setTimeout(() => {
              setTargetShake(false);
              setTargetFlash(false);
              setHitEffect(null);
            }, 150);
          }, 430);

        }, delayTime);
      };

      // Shoot three arrows in rapid succession
      fireArrow(0, 1);
      fireArrow(150, 2);
      fireArrow(300, 3);

      setTimeout(() => {
        setAnimating(false);
      }, 950);
      return;
    }

    if (ability.id === 'inner_fire') {
      setAnimating(true);
      setInnerFireActive(true);
      setInnerFireFading(false);
      addFloatingText('INNER FIRE!', 'normal', '#ff5400', fighterPos.row, fighterPos.col);

      setTimeout(() => {
        setAnimating(false);
      }, 1000);

      setTimeout(() => {
        setInnerFireFading(true);
      }, DURATION_LONG - 2000);

      setTimeout(() => {
        setInnerFireActive(false);
        setInnerFireFading(false);
      }, DURATION_LONG);
      return;
    }

    if (ability.id === 'force_punch_flurry') {
      setAnimating(true);
      const originalTargetPos = { ...targetPos };

      // Step 1: Punch initial target (3,2) which is targetPos
      setAnimationPhase('step_adjacent');

      setTimeout(() => {
        // Impact 1
        setTargetShake(true);
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
          }, DURATION_LONG);
        } else {
          setSelfBuffEffect(buff);
          addFloatingText(txt, 'normal', color, fighterPos.row, fighterPos.col);

          setTimeout(() => {
            setSelfBuffEffect(null);
            setAnimating(false);
          }, 1000);
        }
      }
    }
    else if (ability.type === 'inspire') {
      setAnimating(true);
      setInspireActive(true);

      const wCol = Math.max(0, Math.min(4, fighterPos.col - 1));
      const wRow = Math.max(0, Math.min(4, fighterPos.row - 1));
      const rCol = Math.max(0, Math.min(4, fighterPos.col - 1));
          setTargetFlash(true);
          setHitEffect({ type: 'monk_force_punch' });
          addFloatingText('-24 FORCE!', 'normal', '#00ffff', 3, 3);

          setTimeout(() => {
            setTargetShake(false);
            setTargetFlash(false);
            setHitEffect(null);
          }, 300);
        }, 250);
      }, 1400);

      // Return home and restore original position
      setTimeout(() => {
        setTargetPos(originalTargetPos);
        setAnimationPhase('return');

        setTimeout(() => {
          setAnimating(false);
          setAnimationPhase(null);
        }, 400);
      }, 2100);

      return;
    }

    if (ability.id === 'twin_finger_authority') {
      setAnimating(true);
      setAnimationPhase('step_adjacent');

      setTimeout(() => {
        // Impact
        setTargetShake(true);
        setTargetFlash(true);
        setHitEffect({ type: 'monk_twin_finger_authority' });
        addFloatingText('-15 TWIN FINGER', 'normal', '#ff4500', targetPos.row, targetPos.col);

        // Apply stun and bleeding
        setTargetStunned(true);
        setTargetBleeding(true);

        // Schedule consecutive damage ticks (bleeding means consecutive damage)
        // Let's do 4 ticks of -5 BLEED at 500ms, 1000ms, 1500ms, 2000ms.
        for (let i = 1; i <= 4; i++) {
          setTimeout(() => {
            addFloatingText('-5 BLEED', 'normal', '#ff0000', targetPos.row, targetPos.col);
            setTargetShake(true);
            setTimeout(() => setTargetShake(false), 100);
          }, i * 500);
        }

        // Clean up stun and bleeding after a short duration
        setTimeout(() => {
          setTargetBleedingFading(true);
        }, 2000);

        setTimeout(() => {
          setTargetStunned(false);
          setTargetBleeding(false);
          setTargetBleedingFading(false);
        }, 2500);

        setTimeout(() => {
          setTargetShake(false);
          setTargetFlash(false);
          setHitEffect(null);
          setAnimationPhase('return');
        }, 800);

      }, 250);

      setTimeout(() => {
        setAnimating(false);
        setAnimationPhase(null);
      }, 1300);

      return;
    }

    // --- MELEE ATTACKS ---
    if (ability.type === 'melee' || ability.type === 'melee_poison' || ability.type === 'melee_slam' || ability.type === 'melee_heavy' || ability.type === 'melee_punches' || ability.type === 'melee_spin' || ability.type === 'cleave' || ability.type === 'flurry') {
      setAnimating(true);
      
      const isMeleeStep = ability.id === 'slash' || ability.id === 'stab' || ability.id === 'cleave' || ability.id === 'heavy_swing' || ability.id === 'punch' || ability.id === 'force_punch' || ability.id === 'flurry' || ability.id === 'imbued_strike' || ability.id === 'fist_of_honor';
      setAnimationPhase(isMeleeStep ? 'step_adjacent' : 'lunge');

      const hitDelay = isMeleeStep ? 250 : 200;
      const totalDuration = isMeleeStep ? (ability.id === 'flurry' ? 1800 : 1300) : 500;

      setTimeout(() => {
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
          100% { transform: scaleX(0.1) scal
                  setTargetShake(true);
                  setTimeout(() => setTargetShake(false), 100);
                }, i * 500);
              }

              setTimeout(() => {
                setTargetBleedingFading(true);
              }, 2000);

              setTimeout(() => {
                setTargetBleeding(false);
                setTargetBleedingFading(false);
              }, 2500);
            } else if (ability.id === 'slash' || ability.id === 'heavy_swing') {
              hitType = 'sword_slash';
            } else if (ability.id === 'stab') {
              hitType = 'dagger_stab';
            } else if (ability.id === 'punch') {
              hitType = 'monk_punch';
            } else if (ability.id === 'force_punch') {
              hitType = 'monk_force_punch';
            } else if (ability.id === 'imbued_strike') {
              hitType = 'soldier_imbued_strike';
            } else if (ability.id === 'fist_of_honor') {
              hitType = 'soldier_fist_of_honor';
            }

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
           } else if (ability.type === 'cleave') {
             dmg = '-30 CLEAVE!';
             color = '#d9230f';
             hitType = 'cleave_slash';
           } else if (ability.id === 'punch') {
             dmg = '-18 PUNCH';
             color = '#ffb703';
             hitType = 'monk_punch';
           } else if (ability.id === 'force_punch') {
             dmg = '-24 FORCE!';
             color = '#00ffff';
             hitType = 'monk_force_punch';
           } else if (ability.id === 'imbued_strike') {
             dmg = '-36 IMBUED';
             color = '#00d2ff';
           } else if (ability.id === 'fist_of_honor') {
             dmg = '-18 STUN';
             color = '#ffd700';
             setTargetStunned(true);
             setTimeout(() => {
               setTargetStunned(false);
             }, 2000);
           }

          setHitEffect({ type: hitType });
          addFloatingText(dmg, ability.type === 'melee_heavy' ? 'crit' : 'normal', color, targetPos.row, targetPos.col);

          if (ability.id === 'shield_slam' || ability.id === 'force_punch') {
            setTargetPushing(true);
            const originalPos = { ...targetPos };
            const colDiff = targetPos.col - fighterPos.col;
            const rowDiff = targetPos.row - fighterPos.row;
            const pushCol = Math.max(0, Math.min(4, targetPos.col + Math.sign(colDiff)));
            const pushRow = Math.max(0, Math.min(4, targetPos.row + Math.sign(rowDiff)));
            
            setTargetPos({ row: pushRow, col: pushCol });

            setTimeout(() => {
              setTargetPos(originalPos);
              setTimeout(() => {
                setTargetPushing(false);
              }, 300);
            }, 600);
          }

          if (isMeleeS
        turretRow = (fighterPos.row + 1) % 5;
      }

      setAnimating(true);
      addFloatingText('DEPLOY TURRET', 'normal', '#ffb703', turretRow, turretCol);

      setTimeout(() => {
        setTurrets(prev => [...prev, { row: turretRow, col: turretCol }]);
        setAnimating(false);

    // --- BEAM SPELLS ---
    else if (ability.type === 'beam' || ability.type === 'lightning' || ability.type === 'beam_drain') {
      setAnimating(true);
      
      let beamType = 'smite';
      let dmg = '-32 HOLY';
      let color = '#ffe600';

      if (ability.id === 'lightning_strike') {

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
            to { box-shadow: 0 0 20px #00bfff; }
        }
        .berserker-pulse {
            box-shadow: 0 0 12px #ff0000;
            border-color: #ff0000 !important;
            animation: redPulseFull 0.8s ease-in-out infinite alternate;
        }
        .berserker-pulse-fade {
            border-color: #ff0000 !important;
            animation: scaleDownAndFade 2s ease-out forwards;
        }
        @keyframes redPulseFull {
            from { box-shadow: 0 0 6px #ff0000, inset 0 0 4px #ff0000; }
            to { box-shadow: 0 0 24px #ff0000, inset 0 0 12px #ff0000; }
        }
        .ethereal-pulse {
            box-shadow: 0 0 12px #ffcc00;
            border-color: #ffcc00 !important;
            animation: orangeYellowPulseFull 1.0s ease-in-out infinite alternate;
        }
        .ethereal-pulse-fade {
            border-color: #ffcc00 !important;
            animation: scaleDownAndFade 2s ease-out forwards;
        }
        @keyframes orangeYellowPulseFull {
            from { box-shadow: 0 0 6px #ffcc00; }
            to { box-shadow: 0 0 22px #ffcc00; }
        }
        .defensive-stance-pulse {
            box-shadow: 0 0 10px #a0a0a0;
            border-color: #a0a0a0 !important;
            animation: grayPulse 1.2s ease-in-out infinite alternate;
        }
        .defensive-stance-pulse-fade {
           

            {/* Animation Containers */}
            {activeData?.isComplete && (
              <div style={{ display: 'flex', gap: '50px' }}>
            to { box-shadow: 0 0 22px #ffcc00; }
        }
        .defensive-stance-pulse {
            box-shadow: 0 0 10px #a0a0a0;
            border-color: #a0a0a0 !important;
            animation: grayPulse 1.2s ease-in-out infinite alternate;
        }
        .defensive-stance-pulse-fade {
            border-color: #a0a0a0 !important;
            animation: scaleDownAndFade 2s ease-out forwards;
        }
        @keyframes grayPulse {
            from { box-shadow: 0 0 4px #a0a0a0; }
            to { box-shadow: 0 0 16px #a0a0a0; }
        }
        .scaleDownAndFade {
            animation: scaleDownAndFade 2s ease-out forwards;
        }
        @keyframes sweep {
            from { stroke-dashoffset: 0; }
            to { stroke-dashoffset: 62.83; }
        }
        .spinning-reticle {
          animation: reticleSpin 2.5s linear infinite;
        }
        @keyframes reticleSpin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
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
                  fontWeight: 'bold',
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
                box-shadow: 0 0 12px rgba(0, 191, 255, 0.55), inset 0 0 6px rgba(255, 255, 255, 0.3);
                border-color: rgba(255, 255, 255, 0.6) !important;
            }
        }
        .berserker-pulse {
            animation: redPulseFull 0.5s infinite alternate ease-in-out !important;
        }
        @keyframes redPulseFull {
            0% {
                box-shadow: 0 0 15px rgba(255, 0, 0, 0.7), inset 0 0 8px rgba(255, 0, 0, 0.4);
                border-color: #ff3333 !important;
                filter: brightness(1.0);
            }
            100% {
                box-shadow: 0 0 45px rgba(255, 0, 0, 1), inset 0 0 22px rgba(255, 0, 0, 0.9);
                border-color: #ff0000 !important;
                filter: brightness(1.35) saturate(1.2);
            }
        }
        .berserker-pulse-fade {
            animation: redPulseFullFade 2.0s forwards ease-out !important;
        }
        .circle-protection-pulse-full-fade-sage {
            animation: blueWhitePulseFullFadeSage 2.0s forwards ease-out !important;
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

        if (beamType === 'lightning') {
          setTargetLightningActive(true);
          setTimeout(() => {
            setTargetLightningActive(false);
          }, 1600);
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

          // Impact (30ms start delay + 600ms transition = 630ms total from spawn)
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
          }, 630);

        }, delayTime);
      };

      fireMissile(0, -6);
      fireMissile(250, 0);
      fireMissile(500, 6);

      setTimeout(() => {
        setAnimating(false);
      }, 1400);
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
      if (stepDist > 0) {
        const colStep = Math.round(dx / stepDist);
        const rowStep = Math.round(dy / stepDist);
        stepCol = targetPos.col + colStep;
        stepRow = targetPos.row + rowStep;
        if (stepCol === fighterPos.col && stepRow === fighterPos.row) {
          stepCol = fighterPos.col + Math.round((targetPos.col - fighterPos.col) * 0.35);
          stepRow = fighterPos.row + Math.round((targetPos.row - fighterPos.row) * 0.35);
        }
      }

      const checkAdjacent = (r, c) => {
        return Math.abs(r - stepRow) <= 1 && Math.abs(c - stepCol) <= 1 && !(r === stepRow && c === stepCol);
      };

      setTimeout(() => {
        setWhirlwindActive(true);

        // Main target
        if (checkAdjacent(targetPos.row, targetPos.col)) {
          setTargetShake(true);
          setTargetFlash(true);
          addFloatingText('-20 SPIN', 'normal', '#ffcc00', targetPos.row, targetPos.col);
        }

        // Extra target 1 (row 1, col 2)
        if (selectedFighterId === 'monk' && checkAdjacent(1, 2)) {
          setExtraTarget1Shake(true);
          setExtraTarget1Flash(true);
          addFloatingText('-20 SPIN', 'normal', '#ffcc00', 1, 2);
        }

        // Extra target 2 (row 3, col 3)
        if (selectedFighterId === 'monk' && checkAdjacent(3, 3)) {
          setExtraTarget2Shake(true);
          setExtraTarget2Flash(true);
          addFloatingText('-20 SPIN', 'normal', '#ffcc00', 3, 3);
        }

        setTimeout(() => {
          setTargetShake(false);
          setTargetFlash(false);
          setExtraTarget1Shake(false);
          setExtraTarget1Flash(false);
          setExtraTarget2Shake(false);
          setExtraTarget2Flash(false);
        }, 400);

      }, 250);

      setTimeout(() => {
        setWhirlwindActive(false);
        setAnimationPhase('return');
        setTimeout(() => {
          setAnimating(false);
          setAnimationPhase(null);
        }, 250);
      }, 1250);
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
        @keyframes dripAndFade {
          0% { transform: scale(1) translateY(0); opacity: 1; }
          100% { transform: scale(0.4) translateY(12px); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
        @keyframes scaleUpCentered {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
                  outline: 'none'
                }}
              >
                Monsters
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes fadeInCentered {
          0% { transform: translate(-50%, -50%); opacity: 0; }
          100% { transform: translate(-50%, -50%); opacity: 1; }
        }
        @keyframes leapJump {
          0% {
            transform: translate(0, 0) scale(1);
          }
        @keyframes dripAndFade {
          0% { transform: scale(1) translateY(0); opacity: 1; }
          100% { transform: scale(0.4) translateY(12px); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
        @keyframes scaleUpCentered {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes fadeInCentered {
          0% { transform: translate(-50%, -50%); opacity: 0; }
          100% { transform: translate(-50%, -50%); opacity: 1; }
        }
        @keyframes leapJump {
          0% {
            transform: translate(0, 0) scale(1);
          }
          70% {
            transform: translate(${leapColOffset * 70}%, ${leapRowOffset * 70 - 45}%) scale(1.6);
          }
          100% {
            transform: translate(${leapColOffset * 100}%, ${leapRowOffset * 100}%) scale(1);
          }
        }
        @keyframes inspireAura {
          0% { box-shadow: 0 0 10px rgba(255, 183, 3, 0.4), inset 0 0 5px rgba(255, 183, 3, 0.2); }
          50% { box-shadow: 0 0 30px rgba(255, 183, 3, 0.95), inset 0 0 15px rgba(255, 183, 3, 0.7); }
          100% { box-shadow: 0 0 10px rgba(255, 183, 3, 0.4), inset 0 0 5px rgba(255, 183, 3, 0.2); }
        }
        @keyframes inspireBoost {
          0% { transform: translateY(15px) scale(0.7); opacity: 0; }
          30% { opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translateY(-25px) scale(1.1); opacity: 0; }
        }
        @keyframes beamShrink {
          0% { width: 18px; opacity: 1; }
          100% { width: 0px; opacity: 0; }
        }
        @keyframes lightningFlicker {
          0% { opacity: 0; stroke-width: 0px; }
          10% { opacity: 1; stroke-width: 6px; }
          20% { opacity: 0.2; stroke-width: 2px; }
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(255, 183, 3, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '2px solid #ffb703' : '2px solid transparent',
                      cursor: isAnimating ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 0 15px rgba(255, 183, 3, 0.15)' : 'none'
                    }}
                  >
                    <img src={m.portrait} alt={m.name} style={{ width: '50px', height: '50px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.15)', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{m.name}</div>
                      <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.04em' }}>{m.id}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

                  <div
                    key={f.id}
                    onClick={() => {
                      if (isAnimating) return;
                      setSelectedFighterId(f.id);
                      // Reset character specific visual states
                      setTargetFrozen(false);
                      setShieldWallActive(false);
                      setTargetHealActive(false);
                      setTurrets([]);
                      setMinions([]);
                      setTargetMarked(false);
                      setNotchMenuOpen(false);
                      setCircleActive(false);
                      setCircleFading(false);
                      setBerserkerActive(false);
                      setBerserkerFading(false);
                      setEtherealActive(false);
                      setEtherealFading(false);
                      setWhirlwindActive(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      padding: '10px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(255, 183, 3, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '2px solid #ffb703' : '2px solid transparent',
                      cursor: isAnima
                      cursor: isAnimating ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 0 15px rgba(255, 183, 3, 0.15)' : 'none'
                    }}
                  >
        }
        @keyframes dizzyStun {
          0% { transform: translateX(-50%) rotate(0deg) translateY(0px); }
                filter: none;
            }
        }
        @keyframes dizzyStun {
          0% { transform: translateX(-50%) rotate(0deg) translateY(0px); }
          50% { transform: translateX(-50%) rotate(180deg) translateY(-3px); }
          100% { transform: translateX(-50%) rotate(360deg) translateY(0px); }
        }
        @keyframes cloneSpawn {
          0% { transform: scale(0); opacity: 0; filter: drop-shadow(0 0 0px #00ffff) brightness(2); }
          100% { transform: scale(1); opacity: 0.35; filter: drop-shadow(0 0 6px #00ffff) saturate(1.25) brightness(1.1); }
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
            transform: translate(-85px, -50px) rotate(-90deg);
            opacity: 0.1;
          }
          30%{
            transform: translate(-70px, -25px) rotate(-30deg);
            opacity: 0.8;
          }
          60%{
            transform: translate(-55px, 0px) rotate(15deg);
            opacity: 1.0;
          }
          85%{
            transform: translate(-70px, 25px) rotate(60deg);
            opacity: 1.0;
          }
          100%{
            transform: translate(-85px, 50px) rotate(90deg);
            opacity: 0;
          }
        }
        @keyframes ArcAnimation_left {
          0%{
            transform: translate(85px, -50px) rotate(90deg);
            opacity: 0.1;
          }
          30%{
            transform: translate(70px, -25px) rotate(30deg);
            opacity: 0.8;
          }
          60%{
            transform: translate(55px, 0px) rotate(-15deg);
            opacity: 1.0;
          }
          85%{
            transform: translate(70px, 25px) rotate(-60deg);
            opacity: 1.0;
          }
          100%{
            transform: translate(85px, 50px) rotate(-90deg);
            opacity: 0;
          }
        }
        @keyframes CleaveAnimation_right {
          0% {
            transform: translate(-85px, -50px) rotate(-90deg);
            opacity: 0.1;
          }
          22% {
            transform: translate(-55px, 0px) rotate(15deg);
            opacity: 1;
          }
          26% {
            transform: translate(-60px, -3px) rotate(10deg);
            opacity: 1;
          }
          30% {
            transform: translate(-55px, 0px) rotate(15deg);
            opacity: 1;
          }
          75% {
            transform: translate(-55px, 0px) rotate(15deg);
            opacity: 1;
          }
          100% {
            transform: translate(-55px, 0px) rotate(15deg);
            opacity: 0;
          }
        }
        @keyframes CleaveAnimation_left {
          0% {
            transform: translate(85px, -50px) rotate(90deg);
            opacity: 0.1;
          }
          22% {
            transform: translate(55px, 0px) rotate(-15deg);
            opacity: 1;
          }
          26% {
            transform: translate(60px, -3px) rotate(-10deg);
            opacity: 1;
          }
          30% {
            transform: translate(55px, 0px) rotate(-15deg);
            opacity: 1;
          }
          75% {
            transform: translate(55px, 0px) rotate(-15deg);
            opacity: 1;
          }
          100% {
            transform: translate(55px, 0px) rotate(-15deg);
            opacity: 0;
          }
        }
        @keyframes ImbuedStrikeAnimation_right {
          0% {
            transform: translate(-85px, -50px) rotate(-90deg);
            opacity: 0.1;
          }
          22% {
            transform: translate(-55px, 0px) rotate(15deg);
            opacity: 1;
          }
          26% {
            transform: translate(-60px, -3px) rotate(10deg);
            opacity: 1;
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

            transform: translate(55px, 0px) rotate(-15deg);
            opacity: 0;
          }
        }
        @keyframes fireRingSplash {
          0% {
            transform: translate(-50%, -50%) scale(0.1);
            opacity: 0.9;
            border: 4px solid #ff5400;
            box-shadow: 0 0 15px #ff5400, inset 0 0 15px #ff5400;
          }
          50% {
            border: 8px solid #ff2000;
            box-shadow: 0 0 30px #ff2000, inset 0 0 20px #ff2000;
            opacity: 0.95;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.4);
            opacity: 0;
            border: 2px solid #ffe600;
            box-shadow: 0 0 40px #ffe600, inset 0 0 10px #ffe600;
          }
        }
        .circle-protection-pulse-full {
            animation: blueWhitePulseFull 1.5s infinite alternate ease-in-out !important;
        }
        .circle-protection-pulse-partial {
            animation: blueWhitePulsePartial 1.5s infinite alternate ease-in-out !important;
        }
        @keyframes blueWhitePulseFull {
            0% {
                box-shadow: 0 0 8px rgba(0, 191, 255, 0.4), inset 0 0 4px rgba(0, 191, 255, 0.2);
                border-color: rgba(0, 191, 255, 0.5) !important;
            }
            100% {
                box-shadow: 0 0 22px rgba(0, 191, 255, 0.9), inset 0 0 10px rgba(255, 255, 255, 0.6);
                border-color: #fff !important;
            }
            }
        }
        .ethereal-pulse-fade {
            animation: orangeYellowPulseFullFade 2.0s forwards ease-out !important;
        }
        @keyframes orangeYellowPulseFullFade {
            0% {
                box-shadow: 0 0 45px rgba(255, 159, 28, 1), inset 0 0 22px rgba(255, 159, 28, 0.95);
 
                box-shadow: 0 0 15px rgba(70, 130, 180, 0.75), inset 0 0 8px rgba(70, 130, 180, 0.45);
                border-color: #4682b4 !important;
                filter: brightness(1.0);
            }
            100% {
                box-shadow: 0 0 45px rgba(70, 130, 180, 1), inset 0 0 22px rgba(70, 130, 180, 0.95);
                        border: '1px solid rgba(255,255,255,0.4)',
                        padding: '2px',
                        boxSizing: 'border-box',
                        zIndex: 15
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
                  setTurrets([]);
                  setMinions([]);
                  setTargetFrozen(false);
                  setShieldWallActive(false);
                  setCircleActive(false);
                  setCircleFading(false);
                  setBerserkerActive(false);
                  setBerserkerFading(false);
                  setEtherealActive(false);
                  setEtherealFading(false);
                  setWhirlwindActive(false);
                  setDefensiveStanceActive(false);
                  setDefensiveStanceFading(false);
                  setTargetStunned(false);
                  setOneManArmyActive(false);
                }}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: '#ccc',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '4px 12px',
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
                        cursor: isAnim
                          animation: 'inspireAura 1.5s ease-in-out infinite',
                          pointerEvents: 'none',
                          zIndex: 20,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(255, 183, 3, 0.15)'
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
                  transition: getFighterTransitionStyle(),
                  animation: animationPhase === 'leap' ? 'leapJump 1.2s ease-in-out forwards' : 'none'
                }}
              >
                {leftTab === 'fighters' && selectedFighterId === 'soldier' && oneManArmyActive && (
    
                        height: '80%',
                        top: '-30%',
                        left: '10%',
                        borderRadius: '8px',
                        border: '2px solid #00ffff',
                        backgroundColor: '#222',
                        backgroundImage: `url("${selectedFighter.portrait}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)',
                        animation: 'cloneSpawn 0.4s ease-out forwards',
                        zIndex: 5,
                        pointerEvents: 'none'
                      }}
                    />
                    {/* Clone 2 (Top-Left) */}
                    <div
                      style={{
                        position: 'absolute',
                        width: '80%',
                        height: '80%',
                        top: '-5%',
                        left: '-30%',
                        borderRadius: '8px',
                        border: '2px solid #00ffff',
                        backgroundColor: '#222',
                        backgroundImage: `url("${selectedFighter.portrait}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)',
                        animation: 'cloneSpawn 0.4s ease-out forwards',
                        zIndex: 5,
                        pointerEvents: 'none'
                      }}
                    />
                      setWhirlwindActive(false);
                      setDefensiveStanceActive(false);
                      setDefensiveStanceFading(false);
                      setTargetStunned(false);
                      setOneManArmyActive(false);
                      setInnerFireActive(false);
                      setInnerFireFading(false);
                      setTargetBleeding(false);
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



                        : ''
                  }
                  style={{
                    width: '80%',
                    height: '80%',
                    borderRadius: '8px',
                    border: targetFlash 
                      ? '3px solid #ff4d4d' 
                      : targetHealActive 
                        ? '2px solid #60ff9b' 
                        : targetFrozen 
                          ? '2px solid #00bfff' 
                        zIndex: 5,
                        pointerEvents: 'none'
                      }}
                    />
                  </>
                )}

                <div
                  className={
                      setCircleActive(false);
                      setCircleFading(false);
                      setBerserkerActive(false);
                      setBerserkerFading(false);
                      setEtherealActive(false);
                      setEtherealFading(false);
                      setWhirlwindActive(false);
                      setDefensiveStanceActive(false);
                      setDefensiveStanceFading(false);
                      setTargetStunned(false);
                      setOneManArmyActive(false);
                      setInnerFireActive(false);
                      setInnerFireFading(false);
                      setTargetBleeding(false);
                      setExtraTarget1Shake(false);
                      setExtraTarget1Flash(false);
                      setExtraTarget2Shake(false);
                      setExtraTarget2Flash(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      padding: '10px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(255, 183, 3, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '2px solid #ffb703' : '2px solid transparent',
                      cursor: isAnimating ? 'not-allowed' :
                            ? '0 0 20px rgba(0, 150, 255, 0.7), inset 0 0 10px rgba(0, 150, 255, 0.5)'
                            : selfBuffEffect === 'ethereal'
                              ? '0 0 20px rgba(255, 159, 28, 0.7), inset 0 0 10px rgba(255, 159, 28, 0.5)'
                              : '0 8px 16px rgba(0,0,0,0.5)',
                    position: 'relative'
                  }}>
                  {leftTab === 'fighters' && selectedFighterId === 'sage' && circleActive && renderShieldIcon('full')}
                      <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.04em' }}>{f.id}</div>
                    </div>
                  </div>
                );
              })
        }
        .ethereal-pulse {
            animation: orangeYellowPulseFull 0.5s infinite alternate ease-in-out !important;
        }
        @keyframes orangeYellowPulseFull {
            0% {
                box-shadow: 0 0 15px rgba(255, 159, 28, 0.75), inset 0 0 8px rgba(255, 159, 28, 0.45);
                border-color: #ffb703 !important;
                filter: brightness(1.0);
            }
            100% {
                box-shadow: 0 0 45px rgba(255, 159, 28, 1), inset 0 0 22px rgba(255, 159, 28, 0.95);
                border-color: #ff9f1c !important;
                filter: brightness(1.3) saturate(1.2);
            }
        }
        .ethereal-pulse-fade {
            animation: orangeYellowPulseFullFade 2.0s forwards ease-out !important;
        }
        @keyframes orangeYellowPulseFullFade {
            0% {
                box-shadow: 0 0 45px rgba(255, 159, 28, 1), inset 0 0 22px rgba(255, 159, 28, 0.95);
                border-color: #ff9f1c !important;
                filter: brightness(1.3) saturate(1.2);
            }
            100% {
                box-shadow: none;
                border-color: #ffb703 !important;
                filter: none;
            }
        }
        .inner-fire-pulse {
            border-color: #ff4500 !important;
            box-shadow: 0 0 10px rgba(255, 69, 0, 0.4) !important
                      setExtraTarget2Flash(false);
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
                    <img src={m.portrait} alt={m.name} style={{ width: '50px', height: '50px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.15)', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{m.name}</div>
                      <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.04em' }}>{m.id}</div>
                    </div>
                  </div>
      
              {/* --- Target Portrait Overlay --- */}
              <div
                style={{
                  position: 'absolute',
                  background: 'none',
                  border: 'none',
                  padding: '5px 10px',
            to { transform: rotate(360deg) scale(1); }
        }
        @keyframes spinGlowFade {
            0% { transform: rotate(0deg) scale(1.08); opacity: 1; }
            100% { transform: rotate(360deg) scale(0.3); opacity: 0; }
        }
        .defensive-stance-pulse {
            animation: steelBluePulseFull 0.5s infinite alternate ease-in-out !important;
        }
        @keyframes steelBluePulseFull {
            0% {
                box-shadow: 0 0 15px rgba(70, 130, 180, 0.75), inset 0 0 8px rgba(70, 130, 180, 0.45);
                border-color: #4682b4 !important;
                filter: brightness(1.0);
            }
            100% {
                box-shadow: 0 0 45px rgba(70, 130, 180, 1), inset 0 0 22px rgba(70, 130, 180, 0.95);
                border-color: #5f9ea0 !important;
                filter: brightness(1.25) saturate(1.15);
            }
        }
        .defensive-stance-pulse-fade {
            animation: steelBluePulseFullFade 2.0s forwards ease-out !important;
        }
        @keyframes steelBluePulseFullFade {
            0% {
                box-shadow: 0 0 45px rgba(70, 130, 180, 1), inset 0 0 22px rgba(70, 130, 180, 0.95);
                border-color: #5f9ea0 !important;
                filter: brightness(1.25) saturate(1.15);
            }
            100% {
                box-shadow: none;
                border-color: #ffb703 !important;
                filter: none;
            }
        }
        @keyframes dizzyStun {
          0% { transform: translateX(-50%) rotate(0deg) translateY(0px); }
          50% { transform: translateX(-50%) rotate(180deg) translateY(-3px); }
          100% { transform: translateX(-50%) rotate(360deg) translateY(0px); }
        }
        @keyframes cloneSpawn {
          0% { transform: scale(0); opacity: 0; filter: drop-shadow(0 0 0px #00ffff) brightness(2); }
          100% { transform: scale(1); opacity: 0.35; filter: drop-shadow(0 0 6px #00ffff) saturate(1.25) brightness(1.1); }
        }
      `}</style>
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
                    animation: 'floatUp 2.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards'
                  }}
                >
                  {ft.text}
                </div>
              ))}

              {/* --- Shield Wall Overlay (Real established visual) --- */}
              {shieldWallActive && leftTab === 'fighters' && selectedFighterId === 'soldier' && (() => {
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

            {/* Weapon Equipped Panel */}
            {leftTab === 'fighters' && (() => {
              const currentEquipped = equippedWeapons[selectedFighterId];
              return currentEquipped && (
                <>
                  <div style={{
                    marginTop: '20px',
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.02)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '15px 25px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: 'rgba(255, 255, 255, 0.4)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                      }}>
                        Weapon Equipped
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  pointerEvents: 'none',
                  transform: getFighterTransformStyle(),
                  opacity: selfBuffEffect === 'stealth' ? 0.3 : 1,
                  transition: getFighterTransitionStyle(),
                  animation: animationPhase === 'leap' ? 'leapJump 1.2s ease-in-out forwards' : 'none'
                }}
              >
                {leftTab === 'fighters' && selectedFighterId === 'soldier' && oneManArmyActive && (
                  <>
                    {/* Clone 1 (Top) */}
                    <div
                      style={{
                        position: 'absolute',
                        width: '80%',
                        height: '80%',
                        top: '-30%',
                        left: '10%',
                        borderRadius: '8px',
                        border: '2px solid #00ffff',
                        backgroundColor: '#222',
                        backgroundImage: `url("${selectedFighter.portrait}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)',
                        animation: 'cloneSpawn 0.4s ease-out forwards',
                        zIndex: 2,
                        pointerEvents: 'none'
                          : (leftTab === 'fighters' && selectedFighterId === 'monk' && etherealActive)
                            ? (etherealFading ? 'ethereal-pulse-fade' : 'ethereal-pulse')
                            : ''
                  }
                  style={{
                    width: '80%',
                    height: '80%',
                    borderRadius: '8px',
                    border: '2px solid #ffb703',
      
                      }} />
                      {/* Vertical Reticle Line */}
                      <div style={{
                    boxShadow: (leftTab === 'fighters' && selectedFighterId === 'soldier' && shieldWallActive)
                      ? undefined
                      : (leftTab === 'fighters' && selectedFighterId === 'soldier' && defensiveStanceActive)
                        ? '0 0 20px rgba(70, 130, 180, 0.7), inset 0 0 10px rgba(70, 130, 180, 0.5)'
                        : selfBuffEffect === 'rage'
                          ? '0 0 20px rgba(255, 0, 0, 0.7), inset 0 0 10px rgba(255, 0, 0, 0.5)'
                          : selfBuffEffect === 'barrier'
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
                  setCircleActive(false);
                  setCircleFading(false);
                  setBerserkerActive(false);
                  setBerserkerFading(false);
                  setEtherealActive(false);
                  setEtherealFading(false);
                  setWhirlwindActive(false);
                  setDefensiveStanceActive(false);
                  setDefensiveStanceFading(false);
                  setTargetStunned(false);
                  setOneManArmyActive(false);
                  setInnerFireActive(false);
                  setInnerFireFading(false);
                  setTargetBleeding(false);
                  setTargetBleedingFading(false);
                  setExtraTarget1Shake(false);
                  setExtraTarget1Flash(false);
                  setExtraTarget2Shake(false);
                  setExtraTarget2Flash(false);
                  setWizardGoblinShake(false);
                  setWizardGoblinFlash(false);
                  setFireRingActive(false);
                }}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: '#ccc',
                        position: 'absolute',
                        width: '80%',
                        height: '80%',
                        top: '-5%',
                        left: '-30%',
                        borderRadius: '8px',
                        border: '2px solid #00ffff',
                        backgroundColor: '#222',
                        backgroundImage: `url("${selectedFighter.portrait}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)',
                        animation: 'cloneSpawn 0.4s ease-out forwards',
                        zIndex: 2,
                        pointerEvents: 'none'
                      }}
                    />
                    {/* Clone 3 (Top-Right) */}
                    <div
                      style={{
                        position: 'absolute',
                        width: '80%',
                        height: '80%',
                        top: '-5%',
                        left: '50%',
                        borderRadius: '8px',
                        border: '2px solid #00ffff',
                        backgroundColor: '#222',
                        backgroundImage: `url("${selectedFighter.portrait}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)',
                        animation: 'cloneSpawn 0.4s ease-out forwards',
                        zIndex: 2,
                        pointerEvents: 'none'
                      }}
                    />
                    {/* Clone 4 (Bottom-Left) */}
                    <div
                      style={{
                        position: 'absolute',
                        width: '80%',
                        height: '80%',
                        top: '35%',
                        left: '-15%',
                        borderRadius: '8px',
                        border: '2px solid #00ffff',
                        backgroundColor: '#222',
                        backgroundImage: `url("${selectedFighter.portrait}")`,
                       
                  zIndex: 8,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Outer spinning wind slash container */}
                  <div style={{
                    width: '100%',

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
                  transform: targetShake 
                    ? 'translate(5px, 2px) rotate(2deg)' 
                    : targetHealActive 
                      ? 'scale(1.08)' 
                      : 'none',
                  transition: targetPushing 
                    ? 'transform 0.15s, left 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
                    : 'transform 0.15s'
                }}
              >
                <div
                  className={
                    getTargetProtectionLevel() === 'full' 
                      ? (circleFading ? 'circle-protection-pulse-full-fade-target' : 'circle-protection-pulse-full') 
                      : getTargetProtectionLevel() === 'partial' 
                        ? (circleFading ? 'circle-protection-pulse-partial-fade-target' : 'circle-protection-pulse-partial') 
                  left: `${fighterPos.col * 20}%`,
                  top: `${fighterPos.row * 20}%`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  pointerEvents: 'none',
                  transform: getFighterTransformStyle(),
                  opacity: selfBuffEffect === 'stealth' ? 0.3 : 1,
                  transition: getFighterTransitionStyle(),
                  animation: animationPhase === 'leap' ? 'leapJump 1.2s ease-in-out forwards' : 'none'
                }}
              >
                {leftTab === 'fighters' && selectedFighterId === 'monk' && innerFireActive && (
                  <div
                    className={innerFireFading ? 'inner-fire-organic-glow-fade' : 'inner-fire-organic-glow'}
                    style={{
                      position: 'absolute',
                      width: '140%',
                      height: '140%',
                      zIndex: 9,
                      pointerEvents: 'none'
                    }}
                  />
                )}
                {leftTab === 'fighters' && selectedFighterId === 'soldier' && oneManArmyActive && (
                        : '0 8px 16px rgba(0,0,0,0.5)',
                    position: 'relative'
                  }}>
              )}

              {/* --- Sage Healing Hands Overlay --- */}
              {targetHealActive && (() => {
                const dx = fighterPos.col - targetPos.col;
                const dy = fighterPos.row - targetPos.row;
                const dist = Math.sqrt(dx * dx + dy * dy);
                let midCol = (fighterPos.col + targetPos.col) / 2;
                let midRow = (fighterPos.row + targetPos.row) / 2;
                
                if (dist > 0) {
                  const colStep = Math.round(dx / dist);
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          animation: 'lightningFlicker 0.35s ease-out forwards'
                        }}
                      />
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none'
                    }}
                  >
                    {/* Arrow Shaft (Line, tapered on the left end) */}
                    <div style={{
                      width: '45px',
                      height: '5px',
                      clipPath: 'polygon(100% 0, 0 50%, 100% 100%)',
                      backgroundColor: projectile.arrowType === 'force' ? '#ffc0cb' :
                                       projectile.arrowType === 'poison' ? '#b5e7a0' :
                                       projectile.arrowType === 'ice' ? '#d4f1f9' : '#fff',
                      boxShadow: projectile.arrowType === 'force' ? '0 0 8px #ff007f' :
                                 projectile.arrowType === 'poison' ? '0 0 8px #38b000' :
                                 projectile.arrowType === 'ice' ? '0 0 8px #00bfff' : '0 0 8px #ffe600'
                    }} />
                    {/* Arrow Head (Triangle) */}
                    <div style={{
                      width: 0,
                      height: 0,
                      borderTop: '7px solid transparent',
                      borderBottom: '7px solid transparent',
                      borderLeft: `15px solid ${
                        projectile.arrowType === 'for
                  width: '100px',
                  height: '100px',
                  border: '1px solid #333',
                  position: 'relative'
                        projectile.arrowType === 'force' ? '#ff007f' :
                        projectile.arrowType === 'poison' ? '#70e000' :
                        projectile.arrowType === 'ice' ? '#d4f1f9' : '#ffe600'
                      })`
                    }} />
                  </div>
                ) : projectile.icon === fireball ? (
                  <div
                    style={{
                      position: 'absolute',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, #fff 15%, #ffe600 45%, #ff5400 70%, #d9230f 100%)',
                      boxShadow: '0 0 15px #ff2000, 0 0 25px #ff5400, 0 0 35px #ffe600, inset 0 0 8px rgba(255,255,255,0.9)',
                      left: `calc(${projectile.x}% + 10% - 15px)`,
                      top: `calc(${projectile.y}% + 10% - 15px)`,
                      zIndex: 30,
                      transition: 'left 0.4s linear, top 0.4s linear'
                    }}
                  />
                ) : projectile.icon === ice_blast ? (
                  <div
                    style={{
                      position: 'absolute',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, #fff 15%, #b3e5fc 45%, #00bfff 70%, #0056b3 100%)',
                      boxShadow: '0 0 15px #00bfff, 0 0 25px #0056b3, 0 0 35px #b3e5fc, inset 0 0 8px rgba(255,255,255,0.9)',
                      left: `calc(${projectile.x}% + 10% - 15px)`,











                        stroke="#ffffff"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="1000"
                        strokeDashoffset="1000"
                        style={{
                          animation: 'lightningStrike 0.35s ease-out forwards'
                        }}
                      />
                    </g>
                  </svg>
                );
              })()}

              {activeBeam && activeBeam !== 'lightning' && (
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
                        backgroundColor: '#ff3333',
                        position: 'absolute',
                        boxShadow: '0 0 4px rgba(255, 51, 51, 0.8)'
                      }} />
                    </div>
                  )}
                  {/* Frozen Overlay */}
                  {targetFrozen && (
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, width: '100%', height: '100%',
                      background: 'rgba(0, 191, 255, 0.15)',
                      border: '1px solid rgba(0, 191, 255, 0.3)',
                      borderRadius: '6px',
                      pointerEvents: 'none'
                    }}></div>
                  )}
                  {/* Stun Dizzy Overlay */}
                  {targetStunned && (
                    <div style={{
                      position: 'absolute',
                      top: '-15px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '100%',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      zIndex: 25,
                      animation: 'dizzyStun 2s linear infinite'
                    }}>
                      <span style={{ fontSize: '24px', filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))' }}>💫</span>
                    </div>
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
              
              {/* --- Circle of Protection Overlay --- */}
              {circleActive && (
                <div style={{
                  position: 'absolute',
                  left: `${fighterPos.col * 20 + 10}%`,
                  top: `${fighterPos.row * 20 + 10}%`,
                  width: '80%',
                  height: '80%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 8,
                  pointerEvents: 'none',
                  opacity: circleFading ? 0 : 1,
                  transition: 'opacity 0.5s ease-in-out',
                  animation: 'scaleUpCentered 0.3s ease-out'
                }}>
                  {/* Slow rotating runic ring */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '6px solid rgba(0, 191, 255, 0.85)',
                    boxShadow: '0 0 25px rgba(0, 191, 255, 0.8), inset 0 0 25px rgba(0, 191, 255, 0.8)',
                            transform: flipStyle,
                            filter: activeWeapon ? 'drop-shadow(0 0 8px rgba(255, 0, 0, 0.85))' : 'none'
                          }}
                        />
                      </div>
                    );
                  })()}
                  {hitEffect.type === 'dagger_stab' && (() => {
                    const dx = targetPos.col - fighterPos.col;
                      ? 'scale(1.08)' 
                      : 'none',
                  transition: targetPushing 
                    ? 'transform 0.15s, left 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
                    : 'transform 0.15s'
                }}
              >
                <div
                  className={
                    getTargetProtectionLevel() === 'full' 
                      ? (circleFading ? 'circle-protection-pulse-full-fade-target' : 'circle-protection-pulse-full') 
                      : getTargetProtectionLevel() === 'partial' 
                        ? (circleFading ? 'circle-protection-pulse-partial-fade-target' : 'circle-protection-pulse-partial') 
                        : ''
                  }
                  style={{
                    width: '80%',
                    height: '80%',
                    borderRadius: '8px',
                    border: targetFlash 
                      ? '3px solid #ff4d4d' 
                      : targetHealActive 
                        ? '2px solid #60ff9b' 
                        : targetFrozen 
                          ? '2px solid #00bfff' 
                          : '2px solid #ff5400',
                    backgroundColor: targetFlash ? '#990000' : '#222',
                    backgroundImage: `url("${targetPortrait}")`,
       
                    backgroundPosition: 'center',
                    filter: targetFrozen 
                      ? 'sepia(1) hue-rotate(190deg) saturate(3) brightness(0.95)' 
                      : targetStunned
                        ? 'grayscale(1) brightness(0.8)'
                        : 'none',
                    boxShadow: targetHealActive
                      ? '0 0 25px rgba(96, 255, 155, 0.9), inset 0 0 10px rgba(96, 255, 155, 0.5)'
                      : targetFrozen
                        ? '0 0 25px rgba(0, 191, 255, 0.8), inset 0 0 10px rgba(0, 191, 255, 0.5)'
                        : '0 8px 16px rgba(0,0,0,0.5)',
                    position: 'relative'
                  }}>
                  {getTargetProtectionLevel() !== 'none' && renderShieldIcon(getTargetProtectionLevel())}
                  {targetLightningActive && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      zIndex: 15,
                      overflow: 'hidden',
                      borderRadius: '6px'
                    }}>
                      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ position: 'absolute', top: 0, left: 0 }}>
                        <defs>
                          <filter id="lightningGlow">
                            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        {/* Crackling path 1 */}
                        <path
                          d="M 10 20 L 30 25 L 20 45 L 50 40 L 40 70 L 60 65 L 50 90"
                          fill="none"
                          stroke="#e0ffff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#lightningGlow)"
                          style={{
                            strokeDasharray: '200',
                            strokeDashoffset: '0',
                            animation: 'crackStep 0.4s steps(4) infinite'
                          }}
                        />
                        {/* Crackling path 2 */}
                        <path
                          d="M 90 15 L 70 30 L 80 50 L 55 55 L 70 75 L 45 80"
                          fill="none"
                          stroke="#00ffff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#lightningGlow)"
          
                            strokeDasharray: '200',
                            strokeDashoffset: '0',
                            animation: 'crackStep 0.4s steps(4) infinite 0.1s'
                          }}
                        />
                        {/* Crackling path 3 */}
                        <path
                          d="M 30 10 L 45 35 L 35 30 L 60 55 L 45 60 L 70 85"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#lightningGlow)"
                          style={{
                            strokeDasharray: '200',
                            strokeDashoffset: '0',
                            animation: 'crackStep 0.4s steps(4) infinite 0.2s'
                          }}
                        />
                      </svg>
                      {/* Blueish flashing overlay */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
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
                  transform: targetShake 
                    ? 'translate(5px, 2px) rotate(2deg)' 
                    : targetHealActive 
                      ? 'scale(1.08)' 
                      : 'none',
                  transition: targetPushing 
                    ? 'transform 0.15s, left 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
                    : 'transform 0.15s'
                }}
              >
                <div
                  className={
                    getTargetProtectionLevel() === 'full' 
                      ? (circleFading ? 'circle-protection-pulse-full-fade-target' : 'circle-protection-pulse-full') 
                      : getTargetProtectionLevel() === 'partial' 
                        ? (circleFading ? 'circle-protection-pulse-partial-fade-target' : 'circle-protection-pulse-partial') 
                        : ''
                  }
                  style={{
                      <div style={{
                        width: '35%',
                        height: '35%',
                        borderRadius: '50%',
                        border: '2px solid #ff3333',
                        position: 'absolute',
                        boxShadow: '0 0 6px rgba(255, 51, 51, 0.8)'
                      }} />
                      {/* Horizontal Reticle Line */}
                      <div style={{
                        width: '85%',
            
                      ].map((arrow, idx) => {
                        const angles = [150, 110, 70, 30];
                        const angle = angles[idx];
                        const rad = (angle * Math.PI) / 180;
                        const R = 55;
                        const x = Math.round(R * Math.cos(rad));
                        const y = -Math.round(R * Math.sin(rad));








                  {targetFrozen && (
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, width: '100%', height: '100%',
                      background: 'rgba(0, 191, 255, 0.15)',
                      border: '1px solid rgba(0, 191, 255, 0.3)',
                      borderRadius: '6px',
                      pointerEvents: 'none'
                    }}></div>
                  )}
                  {/* Stun Dizzy Overlay */}
                  {targetStunned && (
                    <div style={{
                      position: 'absolute',
                      top: '-15px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '100%',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      zIndex: 25,
                      animation: 'dizzyStun 2s linear infinite'
                    }}>
                      <span style={{ fontSize: '24px', filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))' }}>💫</span>
                    </div>
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
              
              {/* --- Circle of Protection Overlay --- */}
              {circleActive && (
                <div style={{
                  position: 'absolute',
                  left: `${fighterPos.col * 20 + 10}%`,
                  top: `${fighterPos.row * 20 + 10}%`,
                  width: '80%',
                  height: '80%',
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
              
              {/* --- Circle of Protection Overlay --- */}
              {circleActive && (
                <div style={{
                  position: 'absolute',
                  left: `${fighterPos.col * 20 + 10}%`,
                  {targetMarked && (
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, width: '100%', height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      zIndex: 12
                    }}>
                      {/* Outer Ring */}
                      <div style={{
                        width: '70%',
                        height: '70%',
                        borderRadius: '50%',
                        border: '3px dashed #ff3333',
                        position: 'absolute',
                        animation: 'spin 4s linear infinite',
                        boxShadow: '0 0 10px rgba(255, 51, 51, 0.8)'
                      }} />
                      {/* Inner Ring */}
                      <div style={{
                        width: '35%',
                        height: '35%',
                        borderRadius: '50%',
                        border: '2px solid #ff3333',
                        position: 'absolute',
                        boxShadow: '0 0 6px rgba(255, 51, 51, 0.8)'
                      }} />
                      {/* Horizontal Reticle Line */}
                      <div style={{
                        width: '85%',
                        height: '2px',
                        backgroundColor: '#ff3333',
                        position: 'absolute',
                      : targetHealActive 
                        ? '2px solid #60ff9b' 
                        : targetFrozen 
                          ? '2px solid #00bfff' 
                          : '2px solid #ff5400',
                    backgroundColor: targetFlash ? '#990000' : '#222',
                    backgroundImage: `url("${targetPortrait}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: targetFrozen 
                      ? 'sepia(1) hue-rotate(190deg) saturate(3) brightness(0.95)' 
                      : targetStunned
                        ? 'grayscale(1) brightness(0.8)'
                        : 'none',
                    boxShadow: targetHealActive
                      ? '0 0 25px rgba(96, 255, 155, 0.9), inset 0 0 10px rgba(96, 255, 155, 0.5)'
                      : targetFrozen
                        ? '0 0 25px rgba(0, 191, 255, 0.8), inset 0 0 10px rgba(0, 191, 255, 0.5)'
                        : '0 8px 16px rgba(0,0,0,0.5)',
                    position: 'relative'
                  }}>
                  {getTargetProtectionLevel() !== 'none' && renderShieldIcon(getTargetProtectionLevel())}
                  {targetLightningActive && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 
                      top: '-15px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '100%',
                      height: '30px',
             
                      clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
                      animation: 'explode 0.4s ease-out forwards',
                      pointerEvents: 'none',
                          <filter id="lightningGlow">
                            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        {/* Crackling path 1 */}
                        <path
                          d="M 10 20 L 30 25 L 20 45 L 50 40 L 40 70 L 60 65 L 50 90"
                          fill="none"
                          stroke="#e0ffff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#lightningGlow)"
                          style={{
                            strokeDasharray: '200',
                            strokeDashoffset: '0',
                            animation: 'crackStep 0.4s steps(4) infinite'
                          }}
                        />
                        {/* Crackling path 2 */}
                        <path
                          d="M 90 15 L 70 30 L 80 50 L 55 55 L 70 75 L 45 80"
                          fill="none"
                          stroke="#00ffff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#lightningGlow)"
                          style={{
                            strokeDasharray: '200',
                            strokeDashoffset: '0',
                            animation: 'crackStep 0.4s steps(4) infinite 0.1s'
                          }}
                        />
                        {/* Crackling path 3 */}
                        <path
                          d="M 30 10 L 45 35 L 35 30 L 60 55 L 45 60 L 70 85"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#lightningGlow)"
                          style={{
                            strokeDasharray: '200',
                            strokeDashoffset: '0',
                            animation: 'crackStep 0.4s steps(4) infinite 0.2s'
                          }}
                        />
                      </svg>
                      {/* Blueish flashing overlay */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 255, 255, 0.15)',
                        animation: 'lightningFlashOverlay 0.15s ease-in-out infinite alternate',
                        mixBlendMode: 'color-dodge'
                      }} />
                    </div>
                  )}
                  {/* Target Mark Overlay */}
                  {targetMarked && (
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, width: '100%', height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      zIndex: 12
                    }}>
                      {/* Outer Ring */}
                      <div style={{
                        width: '70%',
                        height: '70%',
                        borderRadius: '50%',
                        border: '3px dashed #ff3333',
                        position: 'absolute',
                        animation: 'spin 4s linear infinite',
                        boxShadow: '0 0 10px rgba(255, 51, 51, 0.8)'
                      }} />
                      {/* Inner Ring */}
                      <div style={{
                        width: '35%',
                        height: '35%',
                        borderRadius: '50%',
                        border: '2px solid #ff3333',
                        position: 'absolute',
                        boxShadow: '0 0 6px rgba(255, 51, 51, 0.8)'
                      }} />
                      {/* Horizontal Reticle Line */}
                      <div style={{
                        width: '85%',
                        height: '2px',
                        backgroundColor: '#ff3333',
                        position: 'absolute',
                        boxShadow: '0 0 4px rgba(255, 51, 51, 0.8)'
                      }} />
                      {/* Vertical Reticle Line */}
                      <div style={{
                        width: '2px',
                        height: '85%',
                        backgroundColor: '#ff3333',
                        position: 'absolute',
                        boxShadow: '0 0 4px rgba(255, 51, 51, 0.8)'
                      }} />
                    </div>
                  )}
      
                </div>
              )}

              {/* Extra Goblin 2 (3,3) */}
              {leftTab === 'fighters' && selectedFighterId === 'monk' && (targetPos.row !== 3 || targetPos.col !== 3) && (
                      border: '1px solid rgba(0, 191, 255, 0.3)',
                      borderRadius: '6px',
                      pointerEvents: 'none'
                    }}></div>
                  )}
                  {/* Stun Dizzy Overlay */}
                  {targetStunned && (
                    <div style={{
                      position: 'absolute',
                      top: '-15px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '100%',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      zIndex: 25,
                      animation: 'dizzyStun 2s linear infinite'
                    }}>
                      <span style={{ fontSize: '24px', filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))' }}>💫</span>
                    </div>
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

                {/* Bleeding Overlay (moved outside grayscale filter) */}
                {targetBleeding && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(10% + 4px)',
                    left: 'calc(10% + 4px)',
                    width: '24px',
                    height: '24px',
                    zIndex: 25,
                    borderRadius: '4px',
                    overflow: 'hidden',
                    animation: targetBleedingFading 
                      ? 'scaleDownAndFade 0.5s ease-in-out forwards' 
                      : 'scaleUp 0.3s ease-out'
                  }}>
                    <img
                      src={bleeding}
                      alt="bleeding"
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,0,0,0.4)',
                        padding: '2px',
                        boxSizing: 'border-box',
                        filter: 'drop-shadow(0 0 4px rgba(255, 0, 0, 0.8))'
                      }}
                    />
                  </div>
                )}
              </div>
                          pointerEvents: 'none',
                          zIndex: 5000,
                          animation: `ArcAnimation_${direction} 1.0s linear forwards`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                    top: `${1 * 20}%`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 8,
                    pointerEvents: 'none',
                    transform: extraTarget1Shake ? 'translate(5px, 2px) rotate(2deg)' : 'none',
                    transition: 'transform 0.15s'
                  }}
                >
                  <div
                    style={{
                      width: '80%',
                      height: '80%',
                      borderRadius: '8px',
                      border: extraTarget1Flash ? '3px solid #ff4d4d' : '2px solid #ff5400',
                      backgroundColor: extraTarget1Flash ? '#990000' : '#222',
                      backgroundImage: `url("${goblin_portrait}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                      position: 'relative'
                    }}
                  >
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
                      Goblin Target
                    </div>
                  </div>
                </div>
              )}

              {/* Extra Goblin 2 (3,3) */}
              {leftTab === 'fighters' && selectedFighterId === 'monk' && (targetPos.row !== 3 || targetPos.col !== 3) && (
                <div
                  style={{
                    position: 'absolute',
                    width: '20%',
                    height: '20%',
                    left: `${3 * 20}%`,
                    top: `${3 * 20}%`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 8,
                    pointerEvents: 'none',
                    transform: extraTarget2Shake ? 'translate(5px, 2px) rotate(2deg)' : 'none',
                    transition: 'transform 0.15s'
                  }}
                >
                  <div
                    style={{
                      width: '80%',
                      height: '80%',
                      borderRadius: '8px',
                      border: extraTarget2Flash ? '3px solid #ff4d4d' : '2px solid #ff5400',
                      backgroundColor: extraTarget2Flash ? '#990000' : '#222',
                      backgroundImage: `url("${goblin_portrait}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                      position: 'relative'
                    }}
                  >
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
                      Goblin Target
                    </div>
                  </div>
                </div>
              )}

              {/* Extra Goblin 3 (4,1) for Wizard */}
              {leftTab === 'fighters' && selectedFighterId === 'wizard' && (targetPos.row !== 1 || targetPos.col !== 4) && (
                <div
                  style={{
                    position: 'absolute',
                    width: '20%',
                    height: '20%',
                    left: `${4 * 20}%`,
                    top: `${1 * 20}%`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 8,
                    pointerEvents: 'none',
                    transform: wizardGoblinShake ? 'translate(5px, 2px) rotate(2deg)' : 'none',
                    transition: 'transform 0.15s'
                  }}
                >
                  <div
                    style={{
                      width: '80%',
                      height: '80%',
                      borderRadius: '8px',
                      border: wizardGoblinFlash ? '3px solid #ff4d4d' : '2px solid #ff5400',
                      backgroundColor: wizardGoblinFlash ? '#990000' : '#222',
                      backgroundImage: `url("${goblin_portrait}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                      position: 'relative'
                    }}
                  >
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
                      Goblin Target
                    </div>
                  </div>
                </div>
              )}
              
              {/* --- Fire Ring Splash Overlay --- */}
              {fireRingActive && (
                <div style={{
                  position: 'absolute',
                  left: `${targetPos.col * 20 + 10}%`,
                  top: `${targetPos.row * 20 + 10}%`,
                  width: '60%',
                  height: '60%',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 14,
                  pointerEvents: 'none',
                  animation: 'fireRingSplash 0.8s ease-out forwards'
                }} />
              )}

              {/* --- Circle of Protection Overlay --- */}
              {circleActive && (
                <div style={{
                  position: 'absolute',
                  left: `${fighterPos.col * 20 + 10}%`,
                  top: `${fighterPos.row * 20 + 10}%`,
                  width: '80%',
                  height: '80%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 8,
                  pointerEvents: 'none',
                  opacity: circleFading ? 0 : 1,
                  transition: 'opacity 0.5s ease-in-out',
                  animation: 'scaleUpCentered 0.3s ease-out'
                }}>
                  {/* Slow rotating runic ring */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '6px solid rgba(0, 191, 255, 0.85)',
                    boxShadow: '0 0 25px rgba(0, 191, 255, 0.8), inset 0 0 25px rgba(0, 191, 255, 0.8)',
                    animation: 'spin 15s linear infinite',
                    position: 'relative'









                      zIndex: 30,
                      filter: 'drop-shadow(0 0 2px #fff) drop-shadow(0 0 6px #ff00ff) drop-shadow(0 0 10px #fff) drop-shadow(0 0 2px #000) drop-shadow(0 0 4px #000) brightness(1.4)',
                      transition: 'left 0.4s linear, top 0.4s linear'
                    }}
                  />
                )
              ))}

              {/* --- Special Beams / Overlays (like Smite, Lightning) --- */}
              {activeBeam && activeBeam === 'lightning' && (() => {
                const targetX = targetPos.col * 20 + 10;
                const targetY = targetPos.row * 20 + 10;
                return (
                  <svg
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: '100%',
                      height: '100%',
              )}

              {/* --- Whirlwind Overlay --- */}
              {whirlwindActive && (
                <div style={{
                  position: 'absolute',
                  left: `${fighterPos.col * 20}%`,
                  top: `${fighterPos.row * 20}%`,
                  width: '20%',
                  height: '20%',
                  transform: getFighterTransformStyle(),
                  transition: getFighterTransitionStyle(),
                  zIndex: 8,
                  pointerEvents: 'none',
                }}>
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: '300%',
                    height: '300%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: 'whirlwindVortex 1.0s cubic-bezier(0.1, 0.8, 0.3, 1) forwards'
                    }}>
                      {/* Concentric wind rings */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '80%',
                        height: '80%',
                        borderRadius: '50%',
                        animation: 'windRing 0.8s ease-out infinite',
                        pointerEvents: 'none'
                      }} />
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '60%',
                        height: '60%',
                        borderRadius: '50%',
                        animation: 'windRing 0.8s ease-out infinite 0.25s',
                        pointerEvents: 'none'
                      }} />
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












































                    }} />
                  </div>
                ) : (
                  <img
                    key={p.id}
                      filter: `drop-shadow(0 0 4px ${
                        p.arrowType === 'force' ? '#ff007f' :
                        p.arrowType === 'poison' ? '#70e000' :
                        p.arrowType === 'ice' ? '#d4f1f9' : '#ffe600'
                      })`
                    }} />
                  </div>
                ) : (
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
                      transition: p.icon === magic_missile ? 'left 0.8s linear, top 0.8s linear' : 'left 0.4s linear, top 0.4s linear'
                    }}
                  />
                )
              ))}

              {/* --- Special Beams / Overlays (like Smite, Lightning) --- */}
              {activeBeam && activeBeam === 'lightning' && (() => {
                const targetX = targetPos.col * 20 + 10;
                const targetY = targetPos.row * 20 + 10;
                return (
                  <>
                    <div
                      style={{



















































                            animation: 'lightningStrike 0.35s ease-out forwards'
                          }}
                        />
                      </g>
                    </svg>
                  </>
                );
              })()}

              {activeBeam && activeBeam !== 'lightning' && (
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
























                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >

                  {hitEffect.type === 'soldier_imbued_strike' && (() => {
                    const dx = targetPos.col - fighterPos.col;
                    const direction = dx >= 0 ? 'right' : 'left';
                    const activeWeapon = leftTab === 'fighters' ? equippedWeapons[selectedFighterId] : null;
                    const weaponIcon = activeWeapon ? activeWeapon.icon : sword_white;
                    const flipStyle = direction === 'left' ? 'scaleX(-1)' : 'none';
                    return (
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          pointerEvents: 'none',
                          zIndex: 5000,
                          animation: `ArcAnimation_${direction} 1.0s linear forwards`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={weaponIcon}
                          alt="imbued strike swing"
                          style={{
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            transform: flipStyle,
                            filter: 'drop-shadow(0 0 12px rgba(0, 191, 255, 1)) brightness(1.5) saturate(2)'
                          }}
                        />
                      </div>
                    );
                  })()}
                  {hitEffect.type === 'soldier_fist_of_honor' && (() => {
                    const dx = targetPos.col - fighterPos.col;
                    const direction = dx >= 0 ? 'right' : 'left';
                    const flipStyle = direction === 'left' ? 'scaleX(-1)' : 'none';
                    return (
                      <div
                        style={{
                          }}
                        />
                        <img
                          src={monk_force_punch}
                          alt="monk force punch strike"
                          style={{
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            transform: flipStyle,
                            filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.9))'
                          }}
                        />
                      </div>
                    );
                  })()}
                  {hitEffect.type === 'fire_exp' && (
                    <div style={{
                      width: '80px',
                          }}
                        />
                      </div>
                    );
                  })()}
                  {hitEffect.type === 'sword_slash' && (() => {
                    const dx = targetPos.col - fighterPos.col;
                    const direction = dx >= 0 ? 'right' : 'left';
                    const activeWeapon = leftTab === 'fighters' ? equippedWeapons[selectedFighterId] : null;
                    const weaponIcon = activeWeapon ? activeWeapon.icon : sword_white;
                    const flipStyle = direction === 'left' ? 'scaleX(-1)' : 'none';
                    return (
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          pointerEvents: 'none',
                          zIndex: 5000,
                          animation: `ArcAnimation_${direction} 1.0s linear forwards`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={weaponIcon}
                          alt="weapon swing"
                          style={{
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            transform: flipStyle,
                            filter: activeWeapon ? 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.7))' : 'none'
                          }}
                        />
                      </div>
                    );
                  })()}
                  {hitEffect.type === 'cleave_slash' && (() => {
                    const dx = targetPos.col - fighterPos.col;
                    const direction = dx >= 0 ? 'right' : 'left';
                    const activeWeapon = leftTab === 'fighters' ? equippedWeapons[selectedFighterId] : null;
                    const weaponIcon = activeWeapon ? activeWeapon.icon : sword_white;
                    const flipStyle = direction === 'left' ? 'scaleX(-1)' : 'none';
                    return (
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          pointerEvents: 'none',
                          zIndex: 5000,
                          animation: `CleaveAnimation_${direction} 1.0s linear forwards`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={weaponIcon}
                          alt="weapon cleave"
                          style={{
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            transform: flipStyle,
                            filter: activeWeapon ? 'drop-shadow(0 0 8px rgba(255, 0, 0, 0.85))' : 'none'
                          }}
                        />
                      </div>
                    );
                  })()}
                  {hitEffect.type === 'dagger_stab' && (() => {
                    const dx = targetPos.col - fighterPos.col;
                    const direction = dx >= 0 ? 'right' : 'left';
                    return (
                      <img
                        src={dagger_icon}
                        alt="dagger stab"
                        style={{
                          width: '50px',
                          height: '50px',

















































                    top: `${targetPos.row * 20 + 10}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 40,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >

                  {hitEffect.type === 'soldier_imbued_strike' && (() => {
                    const dx = targetPos.col - fighterPos.col;
                    const direction = dx >= 0 ? 'right' : 'left';
                    const activeWeapon = leftTab === 'fighters' ? equippedWeapons[selectedFighterId] : null;
                    const weaponIcon = activeWeapon ? activeWeapon.icon : sword_white;
                    const flipStyle = direction === 'left' ? 'scaleX(-1)' : 'none';
                    return (
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          pointerEvents: 'none',
                          zIndex: 5000,
                          animation: `ImbuedStrikeAnimation_${direction} 1.0s linear forwards`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={weaponIcon}
                          alt="imbued strike swing"
                          style={{
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            transform: flipStyle,
                            filter: 'drop-shadow(0 0 12px rgba(0, 191, 255, 1)) brightness(1.5) saturate(2)'
                          }}
                        />
                      </div>
                    );
                  })()}
                  {hitEffect.type === 'soldier_fist_of_honor' && (() => {
                    const dx = targetPos.col - fighterPos.col;
                    const direction = dx >= 0 ? 'right' : 'left';
                    const flipStyle = direction === 'left' ? 'scaleX(-1)' : 'none';
                    return (
                      <div
                        style={{
                          width: '60px',



















                        />
                      </div>
                    );
                  })()}
                  {hitEffect.type === 'sword_slash' && (() => {
                    const dx = targetPos.col - fighterPos.col;
                    const direction = dx >= 0 ? 'right' : 'left';
                    const activeWeapon = leftTab === 'fighters' ? equippedWeapons[selectedFighterId] : null;
                    const weaponIcon = activeWeapon ? activeWeapon.icon : sword_white;
                    const flipStyle = direction === 'left' ? 'scaleX(-1)' : 'none';
                    return (
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          pointerEvents: 'none',
                          zIndex: 5000,
                          animation: `ArcAnimation_${direction} 0.65s linear forwards`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={weaponIcon}
                          alt="weapon swing"
                          style={{
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            transform: flipStyle,
                            filter: activeWeapon ? 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.7))' : 'none'
                          }}
                        />
                      </div>
                    );
                  })()}
                  {hitEffect.type === 'cleave_slash' && (() => {
                    const dx = targetPos.col - fighterPos.col;
                    const direction = dx >= 0 ? 'right' : 'left';
                    const activeWeapon = leftTab === 'fighters' ? equippedWeapons[selectedFighterId] : null;
                    const weaponIcon = activeWeapon ? activeWeapon.icon : sword_white;
                    const flipStyle = direction === 'left' ? 'scaleX(-1)' : 'none';
                    return (
                      <div
                        style={{
                          width: '72px',
                          height: '72px',
                          pointerEvents: 'none',
                          zIndex: 5000,
                          animation: `CleaveAnimation_${direction} 1.0s linear forwards`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={weaponIcon}
                          alt="weapon cleave"
                          style={{
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            transform: flipStyle,
                            filter: activeWeapon ? 'drop-shadow(0 0 8px rgba(255, 0, 0, 0.85))' : 'none'
                          }}
                        />
                      </div>
                    );
                  })()}
                  {hitEffect.type === 'dagger_stab' && (() => {
                    const dx = targetPos.col - fighterPos.col;
                    const direction = dx >= 0 ? 'right' : 'left';
                    return (
                      <img
                        src={dagger_icon}
                        alt="dagger stab"
                        style={{
                          width: '50px',
                          height: '50px',
                          pointerEvents: 'none',




                      />
                    );
                  })()}
                  {hitEffect.type === 'monk_punch' && (() => {
                    const dx = targetPos.col - fighterPos.col;
                    const direction = dx >= 0 ? 'right' : 'left';
                    const flipStyle = direction === 'left' ? 'scaleX(-1)' : 'none';
                    return (
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          pointerEvents: 'none',
                          zIndex: 5000,
                          animation: `PunchThrust_${direction} 1.0s linear forwards`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={monk_punch}
                          alt="monk punch strike"
                          style={{
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            transform: flipStyle,
                            filter: 'drop-shadow(0 0 8px rgba(255, 200, 0, 0.8))'
                          }}
                        />
                      </div>
                    );
                  })()}
                  {hitEffect.type === 'monk_force_punch' && (() => {
                    const dx = targetPos.col - fighterPos.col;
                    const direction = dx >= 0 ? 'right' : 'left';
                    const flipStyle = direction === 'left' ? 'scaleX(-1)' : 'none';
                    return (
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          pointerEvents: 'none',
                          zIndex: 5000,
                          animation: `PunchThrust_${direction} 1.0s linear forwards`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            border: '3px solid #00ffff',
                            boxShadow: '0 0 15px rgba(0, 255, 255, 0.55)',
                            animation: 'forceShockwave 0.4s ease-out forwards',
                            pointerEvents: 'none',
                            zIndex: 4999
                          }}
                        />
                        <img
                          src={monk_force_punch}
                          alt="monk force punch strike"
                          style={{
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            transform: flipStyle,
                            filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.9))'
                          }}
                        />
                      </div>
                    );
                  })()}
                  {hitEffect.type === 'monk_twin_finger_authority' && (() => {
                    const dx = targetPos.col - fighterPos.col;
                    const direction = dx >= 0 ? 'right' : 'left';
                    const flipStyle = direction === 'left' ? 'scaleX(-1)' : 'none';
                    return (
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          pointerEvents: 'none',
                          zIndex: 5000,
                          animation: `PunchThrust_${direction} 1.0s linear forwards`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={monk_twin_finger_authority}
                          alt="twin finger authority strike"
                          style={{
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            transform: flipStyle,
                            filter: 'drop-shadow(0 0 10px rgba(255, 69, 0, 0.9))'
                          }}
                        />
                      </div>
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
                      clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
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
