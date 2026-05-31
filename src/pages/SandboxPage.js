import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import AssemblyAnimation from '../components/assembly-animation';
import {
  ranger,
  ranger_notch,
  ranger_loose,
  ranger_mark,
  ranger_ensnare,
  ranger_net_throw,
  ranger_execute,
  ranger_ice_arrow,
  ranger_force_arrow,
  ranger_poison_arrow,
  ranger_celestial_arrow,
  sage,
  circle_of_protection,
  shielded,
  shielded_partial,
  healing_hands,
  soldier,
  wizard,
  barbarian,
  monk,
  summoner,
  engineer,
  goblin_portrait,
  soldier_portrait,
  claws,
  barbarian_slash,
  barbarian_cleave,
  barbarian_axe_throw,
  barbarian_berserker,
  barbarian_leap_attack,
  bleeding,
  poison,
  voidfill,
  grasp,
  fire_blast,
  heal,
  shield_wall,
  lightning,
  magic_missile,
  magic_missile_icon,
  ice_blast,
  ice_blast_icon,
  wizard_disintegrate,
  wizard_sleep,
  wizard_annihilation,
  wizard_vortex,
  wizard_acid_blast,
  fireball,
  frozen,
  acid_drop,
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
  // Soldier Screenshot 2 abilities
  soldier_slash,
  shield_slam,
  inspire,
  soldier_defensive_stance,
  soldier_defense_stance_mini_icon,
  soldier_fist_of_honor,
  soldier_imbued_strike,
  soldier_one_man_army,
  soldier_battlecry,
  // Monk abilities
  monk_ethereal_speed,
  monk_astral_focus,
  monk_astral_projection,
  monk_force_punch_flurry,
  monk_third_eye,
  monk_twin_finger_authority,
  monk_inner_fire,
  monk_meditate,
  monk_whirlwind,
  monk_force_punch,
  monk_flurry,
  monk_punch,
  // Swords
  shortsword,
  cutlass,
  gladius,
  longsword,
  broadsword,
  claymore,
  katana,
  greatsword,
  doomreaver,
  nightfall,
  dreadedge,
  sunsteel,
  frostbite,
  bloodsong,
  shadowfang,
  entropy,
  // Axes
  axe_1,
  axe_2,
  axe_3,
  axe_4,
  axe_5,
  axe_12,
  axe_13,
  axe_15,
  axe_16,
  axe_19,
  axe_20,
  axe_21,
  axe_23
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

const WEAPONS_DB = {
  swords: [
    // Tier 1
    { id: 'shortsword_sword', name: 'Shortsword', tier: 1, image: shortsword, description: 'Grants +25% base attack and +2.5 flat damage.' },
    { id: 'cutlass_sword', name: 'Cutlass', tier: 1, image: cutlass, description: 'Grants +30% base attack and +3.0 flat damage.' },
    { id: 'gladius_sword', name: 'Gladius', tier: 1, image: gladius, description: 'Grants +40% base attack and +4.0 flat damage.' },
    { id: 'longsword_sword', name: 'Longsword', tier: 1, image: longsword, description: 'Grants +45% base attack and +4.5 flat damage.' },
    { id: 'broadsword_sword', name: 'Broadsword', tier: 1, image: broadsword, description: 'Grants +50% base attack and +5.0 flat damage.' },
    { id: 'claymore_sword', name: 'Claymore', tier: 1, image: claymore, description: 'Grants +60% base attack and +6.0 flat damage.' },
    // Tier 2
    { id: 'doomreaver_sword', name: 'Doomreaver', tier: 2, image: doomreaver, description: 'Grants +78% base attack and +7.8 flat damage.' },
    { id: 'nightfall_sword', name: 'Nightfall', tier: 2, image: nightfall, description: 'Grants +82% base attack and +8.2 flat damage.' },
    { id: 'dreadedge_sword', name: 'Dreadedge', tier: 2, image: dreadedge, description: 'Grants +88% base attack and +8.8 flat damage.' },
    { id: 'sunsteel_sword', name: 'Sunsteel', tier: 2, image: sunsteel, description: 'Grants +95% base attack and +9.5 flat damage.' },
    // Tier 3
    { id: 'frostbite_sword', name: 'Frostbite', tier: 3, image: frostbite, description: 'Grants +130% base attack and +13.0 flat damage.' },
    { id: 'bloodsong_sword', name: 'Bloodsong', tier: 3, image: bloodsong, description: 'Grants +140% base attack and +14.0 flat damage.' },
    { id: 'shadowfang_sword', name: 'Shadowfang', tier: 3, image: shadowfang, description: 'Grants +150% base attack and +15.0 flat damage.' },
    { id: 'entropy_sword', name: 'Entropy Sword', tier: 3, image: entropy, description: 'Grants +190% base attack and +19.0 flat damage.' },
  ],
  axes: [
    // Tier 1
    { id: 'woodcutters_axe', name: "Woodcutter's Axe", tier: 1, image: axe_1, description: 'Grants +15% base attack and +1.5 flat damage.' },
    { id: 'bloodcleaver_axe', name: 'Bloodcleaver Axe', tier: 1, image: axe_2, description: 'Grants +18% base attack and +1.8 flat damage.' },
    { id: 'hillbiter_axe', name: 'Hillbiter Axe', tier: 1, image: axe_3, description: 'Grants +19% base attack and +1.9 flat damage.' },
    { id: 'ironcleaver_axe', name: 'Ironcleaver Axe', tier: 1, image: axe_4, description: 'Grants +20% base attack and +2.0 flat damage.' },
    { id: 'rune_axe', name: 'Rune Axe', tier: 1, image: axe_5, description: 'Grants +22% base attack and +2.2 flat damage.' },
    // Tier 2
    { id: 'razorfang_axe', name: 'Razorfang Axe', tier: 2, image: axe_12, description: 'Grants +40% base attack and +4.0 flat damage.' },
    { id: 'stonebreaker_axe', name: 'Stonebreaker Axe', tier: 2, image: axe_13, description: 'Grants +42% base attack and +4.2 flat damage.' },
    { id: 'warcleaver_axe', name: 'Warcleaver Axe', tier: 2, image: axe_15, description: 'Grants +46% base attack and +4.6 flat damage.' },
    { id: 'blackroot_axe', name: 'Blackroot Axe', tier: 2, image: axe_16, description: 'Grants +48% base attack and +4.8 flat damage.' },
    // Tier 3
    { id: 'thunderhewer_axe', name: 'Thunderhewer Axe', tier: 3, image: axe_19, description: 'Grants +70% base attack and +7.0 flat damage.' },
    { id: 'skullsplitter_axe', name: 'Skullsplitter Axe', tier: 3, image: axe_20, description: 'Grants +74% base attack and +7.4 flat damage.' },
    { id: 'giantsbane_axe', name: 'Giantsbane Axe', tier: 3, image: axe_21, description: 'Grants +78% base attack and +7.8 flat damage.' },
    { id: 'obsidian_axe', name: 'Obsidian Axe', tier: 3, image: axe_23, description: 'Grants +88% base attack and +8.8 flat damage.' },
  ]
};

// Predefined list of 8 crew fighters and their test abilities
const fightersData = [
  {
    id: 'ranger',
    name: 'Ranger',
    portrait: ranger,
    abilities: [
      { id: 'notch', name: 'Notch', desc: 'Select arrow type to load.', icon: ranger_notch, type: 'notch' },
      { id: 'loose', name: 'Loose', desc: 'Shoot the selected notched arrow.', icon: ranger_loose, type: 'loose' },
      { id: 'mark', name: 'Mark', desc: 'Place a target mark on the enemy. Lasts until hit by an arrow or expires.', icon: ranger_mark, type: 'mark' },
      { id: 'execute', name: 'Execute', desc: 'Shoot three arrows in rapid succession.', icon: ranger_execute, type: 'execute' },
      { id: 'ensnare', name: 'Ensnare', desc: 'Entangle the target, paralyzing them for a short duration.', icon: ranger_ensnare, type: 'ensnare' }
    ]
  },
  {
    id: 'sage',
    name: 'Sage',
    portrait: sage,
    abilities: [
      { id: 'heal', name: 'Heal', desc: 'Cast restorative magic on an ally.', icon: healing_hands, type: 'heal' },
      { id: 'circle_of_protection', name: 'Circle of Protection', desc: 'Create a sanctuary shielding allies.', icon: circle_of_protection, type: 'circle_of_protection' }
    ]
  },
  {
    id: 'soldier',
    name: 'Soldier',
    portrait: soldier,
    abilities: [
      { id: 'slash', name: 'Slash', desc: 'Execute a heavy steel blade slash.', icon: soldier_slash, type: 'melee' },
      { id: 'shield_wall', name: 'Shield Wall', desc: 'Deploy a protective energetic wall overlay.', icon: shield_wall, type: 'shield_wall' },
      { id: 'shield_slam', name: 'Shield Slam', desc: 'Ram target, causing heavy structural shake.', icon: shield_slam, type: 'melee_slam' },
      { id: 'defensive_stance', name: 'Defensive Stance', desc: 'Adopt a defensive stance to absorb damage.', icon: soldier_defensive_stance, type: 'defensive_stance' },
      { id: 'fist_of_honor', name: 'Fist of Honor', desc: 'Strike with a fist of pure honor.', icon: soldier_fist_of_honor, type: 'fist_of_honor' },
      { id: 'imbued_strike', name: 'Imbued Strike', desc: 'Strike with an energy-imbued blade.', icon: soldier_imbued_strike, type: 'imbued_strike' },
      { id: 'one_man_army', name: 'One Man Army', desc: 'Summon the strength of a one-man army.', icon: soldier_one_man_army, type: 'one_man_army' },
      { id: 'inspire', name: 'Inspire', desc: 'Inspire nearby allies to fight harder.', icon: inspire, type: 'inspire' },
      { id: 'battlecry', name: 'Battlecry', desc: 'Unleash a roar, amplifying size and damage.', icon: soldier_battlecry, type: 'battle_cry' }
    ]
  },
  {
    id: 'wizard',
    name: 'Wizard',
    portrait: wizard,
    abilities: [
      { id: 'fireball', name: 'Fireball', desc: 'Launch an explosive orb of flame.', icon: fireball, type: 'fireball' },
      { id: 'ice_blast', name: 'Ice Blast', desc: 'Freeze target in a block of absolute-zero ice.', icon: ice_blast_icon, type: 'ice_blast_proj' },
      { id: 'magic_missile', name: 'Magic Missile', desc: 'Fire three seeking missiles in sequence.', icon: magic_missile_icon, type: 'magic_missile' },
      { id: 'lightning_strike', name: 'Lightning', desc: 'Strike the target with electrical charge.', icon: lightning, type: 'lightning' },
      { id: 'acid_blast', name: 'Acid Blast', desc: 'Emit a conical green projectile that poisons the target.', icon: wizard_acid_blast, type: 'acid_blast' },
      { id: 'disintegrate', name: 'Disintegrate', desc: 'Call a white-red beam that expands and shakes target.', icon: wizard_disintegrate, type: 'disintegrate' },
      { id: 'sleep', name: 'Sleep', desc: 'Cast a soothing spell that puts the target to sleep.', icon: wizard_sleep, type: 'sleep' },
      { id: 'annihilation', name: 'Annihilation', desc: 'Unleash a devastating burst of pure energy.', icon: wizard_annihilation, type: 'annihilation' },
      { id: 'vortex', name: 'Vortex', desc: 'Create a swirling maelstrom at the target location.', icon: wizard_vortex, type: 'vortex' }
    ]
  },
  {
    id: 'barbarian',
    name: 'Barbarian',
    portrait: barbarian,
    abilities: [
      { id: 'barbarian_slash', name: 'Slash', desc: 'Execute a fast horizontal slash.', icon: barbarian_slash, type: 'barbarian_slash' },
      { id: 'barbarian_cleave', name: 'Cleave', desc: 'Crush target skull with axe, causing bleed.', icon: barbarian_cleave, type: 'barbarian_cleave' },
      { id: 'barbarian_axe_throw', name: 'Axe Throw', desc: 'Hurl a spinning axe at the target.', icon: barbarian_axe_throw, type: 'projectile', projectileIcon: barbarian_axe_throw },
      { id: 'barbarian_berserker', name: 'Berserker', desc: 'Enter a state of absolute fury.', icon: barbarian_berserker, type: 'barbarian_berserker' },
      { id: 'barbarian_leap_attack', name: 'Leap Attack', desc: 'Leap onto the target, knocking them back and stunning.', icon: barbarian_leap_attack, type: 'barbarian_leap' }
    ]
  },
  {
    id: 'monk',
    name: 'Monk',
    portrait: monk,
    abilities: [
      { id: 'monk_ethereal_speed', name: 'Ethereal Speed', desc: 'Flow like wind, gaining extreme speed and yellow glow.', icon: monk_ethereal_speed, type: 'monk_ethereal' },
      { id: 'monk_astral_focus', name: 'Astral Focus', desc: 'Enter astral focus, boosting concentration.', icon: monk_astral_focus, type: 'monk_astral_focus_type' },
      { id: 'monk_astral_projection', name: 'Astral Projection', desc: 'Project spirit forward to strike.', icon: monk_astral_projection, type: 'monk_astral_proj_type' },
      { id: 'monk_force_punch_flurry', name: 'Force Punch Flurry', desc: 'Unleash a flurry of force punches.', icon: monk_force_punch_flurry, type: 'monk_fp_flurry_type' },
      { id: 'monk_third_eye', name: 'Third Eye', desc: 'Open the third eye to foresee strikes.', icon: monk_third_eye, type: 'monk_third_eye_type' },
      { id: 'monk_twin_finger_authority', name: 'Twin Finger Authority', desc: 'Strike critical chakra points.', icon: monk_twin_finger_authority, type: 'monk_twin_finger_type' },
      { id: 'monk_inner_fire', name: 'Inner Fire', desc: 'Awaken the inner blaze, gaining orange glow and fiery attacks.', icon: monk_inner_fire, type: 'monk_inner' },
      { id: 'monk_meditate', name: 'Meditate', desc: 'Restores chi and heals deep wounds.', icon: monk_meditate, type: 'heal_gold' },
      { id: 'monk_whirlwind', name: 'Whirlwind', desc: 'Attack all adjacent units with a spinning vortex.', icon: monk_whirlwind, type: 'monk_whirlwind_type' },
      { id: 'monk_force_punch', name: 'Force Punch', desc: 'Concentrate force to strike.', icon: monk_force_punch, type: 'monk_force_punch_type' },
      { id: 'monk_flurry', name: 'Flurry', desc: 'Unleash a rapid flurry of strikes.', icon: monk_flurry, type: 'monk_flurry_type' },
      { id: 'monk_punch', name: 'Punch', desc: 'Deliver a powerful, centered chi punch.', icon: monk_punch, type: 'monk_punch_type' }
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
  const [notchedArrow, setNotchedArrow] = useState('force'); // 'ice', 'force', 'poison', 'celestial'
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [targetMarked, setTargetMarked] = useState(false);
  const [copActive, setCopActive] = useState(false);
  const [copFading, setCopFading] = useState(false);
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
  const [healIcon, setHealIcon] = useState(null); // { row, col, active }
  const [targetHealGlow, setTargetHealGlow] = useState(false);
  const [equippedWeapons, setEquippedWeapons] = useState({
    soldier: 'shortsword_sword',
    barbarian: 'woodcutters_axe',
    ranger: 'shortsword_sword',
    sage: 'shortsword_sword',
    wizard: 'shortsword_sword',
    monk: 'shortsword_sword',
    summoner: 'shortsword_sword',
    engineer: 'shortsword_sword'
  });
  const [weaponModalOpen, setWeaponModalOpen] = useState(false);
  const [weaponModalTab, setWeaponModalTab] = useState('swords');
  const [targetPushback, setTargetPushback] = useState(null);
  const [defensiveStanceActive, setDefensiveStanceActive] = useState(false);
  const [defensiveStanceFading, setDefensiveStanceFading] = useState(false);
  const [copEndTime, setCopEndTime] = useState(null);
  const [defensiveStanceEndTime, setDefensiveStanceEndTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [targetStunned, setTargetStunned] = useState(false);
  const [targetConfused, setTargetConfused] = useState(false);
  const [targetBleeding, setTargetBleeding] = useState(false);
  const [berserkerActive, setBerserkerActive] = useState(false);
  const [berserkerFading, setBerserkerFading] = useState(false);
  const [berserkerEndTime, setBerserkerEndTime] = useState(null);

  const [inspireActive, setInspireActive] = useState(false);
  const [inspireFading, setInspireFading] = useState(false);
  const [inspireEndTime, setInspireEndTime] = useState(null);
  const [oneManArmyActive, setOneManArmyActive] = useState(false);
  const [targetPoisoned, setTargetPoisoned] = useState(false);
  const [poisonEndTime, setPoisonEndTime] = useState(null);
  const poisonIntervalRef = useRef(null);
  const [fireballExplosion, setFireballExplosion] = useState(null); // { col, row } when active
  const [annihilationExplosion, setAnnihilationExplosion] = useState(null); // { col, row } when active
  const [lightningJagged, setLightningJagged] = useState(false);
  const [frozenIconActive, setFrozenIconActive] = useState(false);
  const [frozenEndTime, setFrozenEndTime] = useState(null);
  const [targetEnsnared, setTargetEnsnared] = useState(false);
  const [targetEnsnaredFading, setTargetEnsnaredFading] = useState(false);
  const [ensnareEndTime, setEnsnareEndTime] = useState(null);
  const [markEndTime, setMarkEndTime] = useState(null);
  const [targetAsleep, setTargetAsleep] = useState(false);
  const [sleepIconActive, setSleepIconActive] = useState(false);
  const [sleepEndTime, setSleepEndTime] = useState(null);
  const [targetDisintegrating, setTargetDisintegrating] = useState(false);
  const [vortexActive, setVortexActive] = useState(null); // { row, col }
  const [poisonDuration, setPoisonDuration] = useState(8000);
  const [annihilationSweepActive, setAnnihilationSweepActive] = useState(false);
  const [extraGoblin1Shake, setExtraGoblin1Shake] = useState(false);
  const [extraGoblin1Flash, setExtraGoblin1Flash] = useState(false);
  const [extraGoblin2Shake, setExtraGoblin2Shake] = useState(false);
  const [extraGoblin2Flash, setExtraGoblin2Flash] = useState(false);

  const [etherealSpeedActive, setEtherealSpeedActive] = useState(false);
  const [etherealSpeedFading, setEtherealSpeedFading] = useState(false);
  const [etherealSpeedEndTime, setEtherealSpeedEndTime] = useState(null);
  const [innerFireActive, setInnerFireActive] = useState(false);
  const [innerFireFading, setInnerFireFading] = useState(false);
  const [innerFireEndTime, setInnerFireEndTime] = useState(null);

  useEffect(() => {
    let interval;
    if (copActive || defensiveStanceActive || berserkerActive || inspireActive || etherealSpeedActive || innerFireActive || targetEnsnared || targetMarked || frozenIconActive || targetPoisoned || sleepIconActive) {
      interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 50);
    } else {
      setCurrentTime(Date.now());
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [copActive, defensiveStanceActive, berserkerActive, inspireActive, etherealSpeedActive, innerFireActive, targetEnsnared, targetMarked, frozenIconActive, targetPoisoned, sleepIconActive]);

  const getCopDashOffset = () => {
    if (!copEndTime) return 31.42;
    const remaining = Math.max(0, copEndTime - currentTime);
    const ratio = remaining / 8000;
    return (1 - ratio) * 31.42;
  };

  const getDefensiveStanceDashOffset = () => {
    if (!defensiveStanceEndTime) return 31.42;
    const remaining = Math.max(0, defensiveStanceEndTime - currentTime);
    const ratio = remaining / 8000;
    return (1 - ratio) * 31.42;
  };

  const getBerserkerDashOffset = () => {
    if (!berserkerEndTime) return 31.42;
    const remaining = Math.max(0, berserkerEndTime - currentTime);
    const ratio = remaining / 8000;
    return (1 - ratio) * 31.42;
  };

  const getInspireDashOffset = () => {
    if (!inspireEndTime) return 31.42;
    const remaining = Math.max(0, inspireEndTime - currentTime);
    const ratio = remaining / 8000;
    return (1 - ratio) * 31.42;
  };

  const getEtherealSpeedDashOffset = () => {
    if (!etherealSpeedEndTime) return 31.42;
    const remaining = Math.max(0, etherealSpeedEndTime - currentTime);
    const ratio = remaining / 8000;
    return (1 - ratio) * 31.42;
  };

  const getInnerFireDashOffset = () => {
    if (!innerFireEndTime) return 31.42;
    const remaining = Math.max(0, innerFireEndTime - currentTime);
    const ratio = remaining / 8000;
    return (1 - ratio) * 31.42;
  };

  const getMarkDashOffset = () => {
    if (!markEndTime) return 31.42;
    const remaining = Math.max(0, markEndTime - currentTime);
    const ratio = remaining / 8000;
    return (1 - ratio) * 31.42;
  };

  const getEnsnareDashOffset = () => {
    if (!ensnareEndTime) return 31.42;
    const remaining = Math.max(0, ensnareEndTime - currentTime);
    const ratio = remaining / 3000;
    return (1 - ratio) * 31.42;
  };

  const getFrozenDashOffset = () => {
    if (!frozenEndTime) return 31.42;
    const remaining = Math.max(0, frozenEndTime - currentTime);
    const ratio = remaining / 3000;
    return (1 - ratio) * 31.42;
  };

  const getPoisonDashOffset = () => {
    if (!poisonEndTime) return 31.42;
    const remaining = Math.max(0, poisonEndTime - currentTime);
    const ratio = remaining / poisonDuration;
    return (1 - ratio) * 31.42;
  };

  const getSleepDashOffset = () => {
    if (!sleepEndTime) return 31.42;
    const remaining = Math.max(0, sleepEndTime - currentTime);
    const ratio = remaining / 8000;
    return (1 - ratio) * 31.42;
  };

  const getRadialLineCoords = (endTime, totalDuration = 8000) => {
    if (!endTime) return null;
    const remaining = Math.max(0, endTime - currentTime);
    if (remaining <= 0 || remaining >= totalDuration) return null;
    const ratio = remaining / totalDuration;
    const angle = -(1 - ratio) * 360;
    const rad = angle * (Math.PI / 180);
    return {
      x2: 10 + 10 * Math.cos(rad),
      y2: 10 + 10 * Math.sin(rad)
    };
  };

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
    }, 1800);
  };

  // Helper to determine projectile rotation angle
  const getProjectileAngle = () => {
    const dy = targetPos.row - fighterPos.row;
    const dx = targetPos.col - fighterPos.col;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  // Arrow type color map for CSS arrow rendering
  const arrowTypeColors = {
    force: '#ff9f1c',
    ice: '#00bfff',
    poison: '#38b000',
    celestial: '#ffdd57'
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
      case 'heal_approach': {
        const dx = targetPos.col - fighterPos.col;
        const dy = targetPos.row - fighterPos.row;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
          const stepCol = Math.round(dx / dist);
          const stepRow = Math.round(dy / dist);
          const adjCol = targetPos.col - stepCol;
          const adjRow = targetPos.row - stepRow;
          const colDiff = adjCol - fighterPos.col;
          const rowDiff = adjRow - fighterPos.row;
          return `translate(${colDiff * 100}%, ${rowDiff * 100}%)`;
        }
        return 'none';
      }
      case 'leap_landing': {
        const dx = targetPos.col - fighterPos.col;
        const dy = targetPos.row - fighterPos.row;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          const colStep = Math.round(dx / dist);
          const rowStep = Math.round(dy / dist);
          const targetColOffset = (targetPos.col - colStep * 0.5) - fighterPos.col;
          const targetRowOffset = (targetPos.row - rowStep * 0.5) - fighterPos.row;
          return `translate(${targetColOffset * 100}%, ${targetRowOffset * 100}%)`;
        }
        return 'none';
      }
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
    if (animationPhase === 'leap_landing') return 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    if (animationPhase === 'heal_approach') return 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    if (animationPhase === 'leap') return 'transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    return 'transform 0.25s ease-in-out, opacity 0.2s';
  };

  // Main Ability trigger logic
  const triggerAbility = (ability) => {
    if (isAnimating) return;

    if (ability.type === 'melee' || ability.type === 'melee_poison' || ability.type === 'melee_slam' || ability.type === 'melee_heavy' || ability.type === 'melee_punches' || ability.type === 'melee_spin' || ability.type === 'barbarian_slash') {
      setAnimating(true);
      
      const isSlash = ability.id === 'slash' || ability.id === 'barbarian_slash';
      const isSlam = ability.type === 'melee_slam';

      if (isSlash) {
        setAnimationPhase('step_adjacent'); // Move to adjacent (takes 250ms)

        // Arrives adjacent: trigger weapon slash swing animation (duration 0.75s)
        setTimeout(() => {
          setHitEffect({ type: 'weapon_slash' });
        }, 250);

        // Impact peak (800ms total, 550ms into swing): shake target, flash red, add damage text
        setTimeout(() => {
          setTargetShake(true);
          setTargetFlash(true);
          addFloatingText('-15', 'normal', '#ff4d4d', targetPos.row, targetPos.col);

          // Clear target shake/flash after 250ms
          setTimeout(() => {
            setTargetShake(false);
            setTargetFlash(false);
          }, 250);
        }, 800);

        // Swing completes (1000ms total, 750ms swing): remove weapon icon, return to origin
        setTimeout(() => {
          setHitEffect(null);
          setAnimationPhase('return');
        }, 1000);

        // Arrives back at origin (1250ms total, return takes 250ms): end animation
        setTimeout(() => {
          setAnimating(false);
          setAnimationPhase(null);
        }, 1250);
      } else if (isSlam) {
        setAnimating(true);
        setAnimationPhase('lunge'); // Soldier lunges forward

        const dx = targetPos.col - fighterPos.col;
        const dy = targetPos.row - fighterPos.row;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pushCol = dist > 0 ? Math.round(dx / dist) : 1;
        const pushRow = dist > 0 ? Math.round(dy / dist) : 0;

        // Impact (at 200ms)
        setTimeout(() => {
          setTargetShake(true);
          setTargetFlash(true);
          setHitEffect({ type: 'shield_slam_connect' });
          addFloatingText('-18', 'normal', '#ff9f1c', targetPos.row, targetPos.col);
          
          // Push target smoothly back 1 tile in direction of attack
          setTargetPushback(`translate(${pushCol * 100}%, ${pushRow * 100}%)`);

          setTimeout(() => {
            setTargetShake(false);
            setTargetFlash(false);
            setHitEffect(null);
          }, 250);

          // Return starts at 450ms
          setTimeout(() => {
            setAnimationPhase('return');
          }, 250);
        }, 200);

        // Soldier returns to origin tile (at 750ms total time)
        setTimeout(() => {
          setAnimating(false);
          setAnimationPhase(null);
          setTargetPushback(null); // Reset target position smoothly back to origin
        }, 750);
      } else {
        setAnimationPhase('lunge');
        const hitDelay = 200;
        const totalDuration = 500;

        setTimeout(() => {
          // Impact
          setTargetShake(true);
          setTargetFlash(true);

          let hitType = 'slash';
          let dmg = '-15';
          let color = '#ff4d4d';

          if (ability.type === 'melee_heavy') {
            dmg = '-38';
            color = '#ff3333';
          } else if (ability.type === 'melee_poison') {
            dmg = '-12';
            color = '#38b000';
            hitType = 'slash';
          } else if (ability.type === 'melee_punches') {
            dmg = '-10';
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
    }

    // --- SOLDIER FIST OF HONOR ---
    else if (ability.type === 'fist_of_honor') {
      setAnimating(true);
      setAnimationPhase('step_adjacent');

      // 1. Connection (at 250ms when step_adjacent arrives)
      setTimeout(() => {
        setTargetShake(true);
        setTargetFlash(true);
        setHitEffect({ type: 'fist_connect' });
        setTargetStunned(true);
        addFloatingText('-24', 'crit', '#ffdd57', targetPos.row, targetPos.col);
      }, 250);

      // 2. Clear target shake/flash (at 500ms, 250ms duration)
      setTimeout(() => {
        setTargetShake(false);
        setTargetFlash(false);
      }, 500);

      // 3. Clear fist overlay and start return animation (at 1050ms, 800ms connect duration)
      setTimeout(() => {
        setHitEffect(null);
        setAnimationPhase('return');
      }, 1050);

      // 4. Return completes, end animation (at 1300ms, 250ms return duration)
      setTimeout(() => {
        setAnimating(false);
        setAnimationPhase(null);
      }, 1300);

      // 5. Stun effect ends (at 6250ms total, giving 6.0 seconds of stun starting at 250ms)
      setTimeout(() => {
        setTargetStunned(false);
      }, 6250);
    }

    // --- SOLDIER IMBUED STRIKE ---
    else if (ability.type === 'imbued_strike') {
      setAnimating(true);
      setAnimationPhase('step_adjacent');

      // 1. Trigger weapon slash overlay (at 250ms when step_adjacent arrives)
      setTimeout(() => {
        setHitEffect({ type: 'imbued_strike_effect' });
      }, 250);

      // 2. Thrust peak connection (at 900ms: 250ms start + 650ms thrust peak)
      setTimeout(() => {
        setTargetShake(true);
        setTargetFlash(true);
        addFloatingText('-28', 'normal', '#00ffff', targetPos.row, targetPos.col);
      }, 900);

      // 3. Clear target shake/flash (at 1150ms, 250ms duration)
      setTimeout(() => {
        setTargetShake(false);
        setTargetFlash(false);
      }, 1150);

      // 4. Clear weapon overlay and return (at 1250ms, 1000ms swing duration)
      setTimeout(() => {
        setHitEffect(null);
        setAnimationPhase('return');
      }, 1250);

      // 5. Return completes (at 1500ms, 250ms return duration)
      setTimeout(() => {
        setAnimating(false);
        setAnimationPhase(null);
      }, 1500);
    }

    // --- SOLDIER DEFENSIVE STANCE ---
    else if (ability.type === 'defensive_stance') {
      setAnimating(true);
      setSelfBuffEffect('barrier');
      setDefensiveStanceActive(true);
      setDefensiveStanceFading(false);
      setDefensiveStanceEndTime(Date.now() + 8000);
      addFloatingText('DEFENSIVE STANCE', 'normal', '#3b82f6', fighterPos.row, fighterPos.col);
      setTimeout(() => {
        setSelfBuffEffect(null);
        setAnimating(false);
      }, 1000);
      setTimeout(() => {
        setDefensiveStanceFading(true);
        setTimeout(() => {
          setDefensiveStanceActive(false);
          setDefensiveStanceFading(false);
          setDefensiveStanceEndTime(null);
        }, 300);
      }, 8000);
    }

    // --- SOLDIER ONE MAN ARMY ---
    else if (ability.type === 'one_man_army') {
      setAnimating(true);
      setSelfBuffEffect('rage');
      setOneManArmyActive(true);
      addFloatingText('ONE MAN ARMY!', 'crit', '#e63946', fighterPos.row, fighterPos.col);
      
      const arena = document.querySelector('.combat-grid-arena');
      if (arena) {
        arena.style.animation = 'shake 0.4s ease-out';
        setTimeout(() => arena.style.animation = 'none', 400);
      }

      setTimeout(() => {
        setSelfBuffEffect(null);
        setAnimating(false);
      }, 1500);

      setTimeout(() => {
        setOneManArmyActive(false);
      }, 8000);
    }

    // --- SOLDIER INSPIRE ---
    else if (ability.type === 'inspire') {
      setAnimating(true);
      setInspireActive(true);
      setInspireFading(false);
      setInspireEndTime(Date.now() + 8000);
      addFloatingText('INSPIRE!', 'normal', '#ffdd57', fighterPos.row, fighterPos.col);
      
      // Float combat stats on other friendly units (Ranger at 0,1 and Monk at 0,3)
      setTimeout(() => {
        addFloatingText('ATTACK UP!', 'normal', '#ffdd57', 0, 1);
        addFloatingText('DEFENSE UP!', 'normal', '#ffdd57', 0, 3);
      }, 100);
      setTimeout(() => {
        addFloatingText('DEFENSE UP!', 'normal', '#ffdd57', 0, 1);
        addFloatingText('ATTACK UP!', 'normal', '#ffdd57', 0, 3);
      }, 300);

      setTimeout(() => {
        setAnimating(false);
      }, 1000);

      setTimeout(() => {
        setInspireFading(true);
        setTimeout(() => {
          setInspireActive(false);
          setInspireFading(false);
          setInspireEndTime(null);
        }, 300);
      }, 8000);
    }

    // --- MONK ETHEREAL SPEED ---
    else if (ability.type === 'monk_ethereal') {
      setAnimating(true);
      setEtherealSpeedActive(true);
      setEtherealSpeedFading(false);
      setEtherealSpeedEndTime(Date.now() + 8000);
      addFloatingText('ETHEREAL SPEED!', 'normal', '#ffdd57', fighterPos.row, fighterPos.col);

      setTimeout(() => {
        setAnimating(false);
      }, 1000);

      setTimeout(() => {
        setEtherealSpeedFading(true);
        setTimeout(() => {
          setEtherealSpeedActive(false);
          setEtherealSpeedFading(false);
          setEtherealSpeedEndTime(null);
        }, 300);
      }, 8000);
    }

    // --- MONK INNER FIRE ---
    else if (ability.type === 'monk_inner') {
      setAnimating(true);
      setInnerFireActive(true);
      setInnerFireFading(false);
      setInnerFireEndTime(Date.now() + 8000);
      addFloatingText('INNER FIRE!', 'crit', '#ff5400', fighterPos.row, fighterPos.col);

      setTimeout(() => {
        setAnimating(false);
      }, 1000);

      setTimeout(() => {
        setInnerFireFading(true);
        setTimeout(() => {
          setInnerFireActive(false);
          setInnerFireFading(false);
          setInnerFireEndTime(null);
        }, 300);
      }, 8000);
    }

    // --- MONK PUNCH ---
    else if (ability.type === 'monk_punch_type') {
      setAnimating(true);
      setAnimationPhase('step_adjacent');

      setTimeout(() => {
        setTargetShake(true);
        setTargetFlash(true);
        setHitEffect({ type: 'monk_punch_effect' });
        addFloatingText('-15', 'normal', '#ffb703', targetPos.row, targetPos.col);

        setTimeout(() => {
          setTargetShake(false);
          setTargetFlash(false);
        }, 250);

        setTimeout(() => {
          setHitEffect(null);
          setAnimationPhase('return');
        }, 800);
      }, 250);

      setTimeout(() => {
        setAnimating(false);
        setAnimationPhase(null);
      }, 1100);
    }

    // --- MONK TWIN FINGER AUTHORITY ---
    else if (ability.type === 'monk_twin_finger_type') {
      setAnimating(true);

      const options = [
        { row: fighterPos.row, col: fighterPos.col + 1 },
        { row: fighterPos.row, col: fighterPos.col - 1 },
        { row: fighterPos.row + 1, col: fighterPos.col },
        { row: fighterPos.row - 1, col: fighterPos.col }
      ];
      const validOptions = options.filter(opt => opt.row >= 0 && opt.row < 5 && opt.col >= 0 && opt.col < 5);

      let bestAdjacent = targetPos;
      let minD = Infinity;
      validOptions.forEach(opt => {
        const dr = targetPos.row - opt.row;
        const dc = targetPos.col - opt.col;
        const d = dr * dr + dc * dc;
        if (d < minD) {
          minD = d;
          bestAdjacent = opt;
        }
      });

      const isAlreadyAdjacent = targetPos.row === bestAdjacent.row && targetPos.col === bestAdjacent.col;

      if (!isAlreadyAdjacent) {
        setTargetPos(bestAdjacent);
      }

      const strikeDelay = isAlreadyAdjacent ? 0 : 350;

      setTimeout(() => {
        setTargetShake(true);
        setTargetFlash(true);
        setHitEffect({ type: 'monk_twin_finger_effect' });
        setTargetStunned(true);
        addFloatingText('-20', 'normal', '#ffb703', bestAdjacent.row, bestAdjacent.col);

        setTimeout(() => {
          addFloatingText('STUNNED!', 'normal', '#ffe600', bestAdjacent.row, bestAdjacent.col);
        }, 150);

        setTimeout(() => {
          setTargetShake(false);
          setTargetFlash(false);
          setHitEffect(null);
          setAnimating(false);
        }, 400);

        setTimeout(() => {
          setTargetStunned(false);
        }, 3000);
      }, strikeDelay);
    }

    // --- BARBARIAN CLEAVE ---
    else if (ability.type === 'barbarian_cleave') {
      setAnimating(true);
      setAnimationPhase('step_adjacent');

      // 1. Trigger weapon slash overlay (at 250ms when step_adjacent arrives)
      setTimeout(() => {
        setHitEffect({ type: 'barbarian_cleave_effect' });
      }, 250);

      // 2. Stuck impact peak (at 600ms: 250ms start + 350ms swing to mid-arc)
      setTimeout(() => {
        setTargetShake(true);
        setTargetFlash(true);
        setTargetBleeding(true);
        addFloatingText('-22', 'normal', '#ff3333', targetPos.row, targetPos.col);
      }, 600);

      // 3. Clear target shake/flash (at 950ms, 350ms duration)
      setTimeout(() => {
        setTargetShake(false);
        setTargetFlash(false);
      }, 950);

      // 4. Clear weapon overlay and return (at 1100ms)
      setTimeout(() => {
        setHitEffect(null);
        setAnimationPhase('return');
      }, 1100);

      // 5. Return completes (at 1350ms)
      setTimeout(() => {
        setAnimating(false);
        setAnimationPhase(null);
      }, 1350);

      // 6. Bleed effect ends (after 4000ms duration, ending at 4600ms total)
      setTimeout(() => {
        setTargetBleeding(false);
      }, 4600);

      // 7. Bleed ticks (every 500ms starting at 1100ms, ending at 4600ms: 8 ticks)
      for (let i = 1; i <= 8; i++) {
        setTimeout(() => {
          setTargetShake(true);
          setTargetFlash(true);
          addFloatingText('-3', 'normal', '#e63946', targetPos.row, targetPos.col);
          setTimeout(() => {
            setTargetShake(false);
            setTargetFlash(false);
          }, 150);
        }, 600 + i * 500);
      }
    }

    // --- BARBARIAN BERSERKER ---
    else if (ability.type === 'barbarian_berserker') {
      setAnimating(true);
      setBerserkerActive(true);
      setBerserkerFading(false);
      setBerserkerEndTime(Date.now() + 8000);

      setTimeout(() => {
        setAnimating(false);
      }, 1000);

      setTimeout(() => {
        setBerserkerFading(true);
        setTimeout(() => {
          setBerserkerActive(false);
          setBerserkerFading(false);
          setBerserkerEndTime(null);
        }, 300);
      }, 8000);
    }

    // --- BARBARIAN LEAP ATTACK ---
    else if (ability.type === 'barbarian_leap') {
      setAnimating(true);
      setAnimationPhase('leap_landing');

      // 1. Connection (at 600ms when leap landing completes)
      setTimeout(() => {
        setTargetShake(true);
        setTargetFlash(true);
        setTargetStunned(true);

        // Push target back 1 tile in direction of attack
        const dx = targetPos.col - fighterPos.col;
        const dy = targetPos.row - fighterPos.row;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          const pushX = Math.round(dx / dist) * 100;
          const pushY = Math.round(dy / dist) * 100;
          setTargetPushback(`translate(${pushX}%, ${pushY}%)`);
        }

        addFloatingText('-30', 'crit', '#ffaa00', targetPos.row, targetPos.col);
      }, 600);

      // 2. Clear target shake/flash (at 950ms)
      setTimeout(() => {
        setTargetShake(false);
        setTargetFlash(false);
      }, 950);

      // 3. Clear lunge position, return to origin, and reset target position (at 1400ms)
      setTimeout(() => {
        setAnimationPhase('return');
        setTargetPushback(null);
      }, 1400);

      // 4. Return completes, end animation (at 1650ms)
      setTimeout(() => {
        setAnimating(false);
        setAnimationPhase(null);
      }, 1650);

      // 5. Stun effect ends (at 6600ms total, giving 6.0 seconds of stun starting at 600ms)
      setTimeout(() => {
        setTargetStunned(false);
      }, 6600);
    }

    // --- WIZARD FIREBALL ---
    else if (ability.type === 'fireball') {
      setAnimating(true);
      // CSS orb projectile
      setProjectile({
        x: fighterPos.col * 20,
        y: fighterPos.row * 20,
        isFireball: true
      });
      // Fly
      setTimeout(() => {
        setProjectile(prev => prev ? { ...prev, x: targetPos.col * 20, y: targetPos.row * 20 } : null);
      }, 30);
      // Impact
      setTimeout(() => {
        setProjectile(null);
        setTargetShake(true);
        setTargetFlash(true);
        setHitEffect({ type: 'fire_exp' });
        addFloatingText('-28', 'crit', '#ff5400', targetPos.row, targetPos.col);
        // Expanding fire ring
        setFireballExplosion({ row: targetPos.row, col: targetPos.col });
        setTimeout(() => setFireballExplosion(null), 700);
        setTimeout(() => {
          setTargetShake(false);
          setTargetFlash(false);
          setHitEffect(null);
        }, 350);
        setAnimating(false);
      }, 430);
    }

    // --- WIZARD ICE BLAST ---
    else if (ability.type === 'ice_blast_proj') {
      setAnimating(true);
      // CSS orb projectile
      setProjectile({
        x: fighterPos.col * 20,
        y: fighterPos.row * 20,
        isIceBlast: true
      });
      // Fly
      setTimeout(() => {
        setProjectile(prev => prev ? { ...prev, x: targetPos.col * 20, y: targetPos.row * 20 } : null);
      }, 30);
      // Impact
      setTimeout(() => {
        setProjectile(null);
        setTargetShake(true);
        setTargetFlash(true);
        setHitEffect({ type: 'ice_burst' });
        addFloatingText('-22', 'normal', '#00bfff', targetPos.row, targetPos.col);
        // Frozen overlay on portrait
        setTargetFrozen(true);
        // Frozen effect icon with timer
        const fEndTime = Date.now() + 3000;
        setFrozenEndTime(fEndTime);
        setFrozenIconActive(true);
        setTimeout(() => {
          setTargetFrozen(false);
          setFrozenIconActive(false);
          setFrozenEndTime(null);
        }, 3000);
        setTimeout(() => {
          setTargetShake(false);
          setTargetFlash(false);
          setHitEffect(null);
        }, 350);
        setAnimating(false);
      }, 430);
    }

    // --- PROJECTILE ATTACKS (generic: axe throw, shadow bolt, rifle, etc.) ---
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

        if (ability.id === 'throw_grenade') {
          hitType = 'fire_exp';
          dmg = '-20';
          color = '#ff5400';
        } else if (ability.id === 'shadow_bolt') {
          hitType = 'shadow';
          dmg = '-19';
          color = '#7209b7';
        } else if (ability.id === 'shoot_rifle') {
          hitType = 'arrow_hit';
          dmg = '-22';
          color = '#ffe600';
        } else if (ability.id === 'barbarian_axe_throw') {
          hitType = 'slash';
          dmg = '-20';
          color = '#ff5400';
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

    // --- RANGER LOOSE (FIRES ARROW) ---
    else if (ability.id === 'loose') {
      setAnimating(true);
      const arrowType = notchedArrow || 'ice';
      let pIcon = ranger_ice_arrow;
      if (arrowType === 'force') pIcon = ranger_force_arrow;
      else if (arrowType === 'poison') pIcon = ranger_poison_arrow;
      else if (arrowType === 'celestial') pIcon = ranger_celestial_arrow;

      setProjectile({
        x: fighterPos.col * 20,
        y: fighterPos.row * 20,
        icon: pIcon,
        isRangerArrow: true,
        arrowType: arrowType
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

        let hitType = 'arrow_hit';
        let dmg = '-16';
        let color = '#ff4d4d';

        if (arrowType === 'ice') {
          hitType = 'ice_burst';
          dmg = '-18';
          color = '#00bfff';
          setTargetFrozen(true);
          const fEndTime = Date.now() + 2000;
          setFrozenEndTime(fEndTime);
          setFrozenIconActive(true);
          setTimeout(() => {
            setTargetFrozen(false);
            setFrozenIconActive(false);
            setFrozenEndTime(null);
          }, 2000);
        } else if (arrowType === 'force') {
          hitType = 'fire_exp';
          dmg = '-22';
          color = '#ff9f1c';

          const dx = targetPos.col - fighterPos.col;
          const dy = targetPos.row - fighterPos.row;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            const pushX = Math.round(dx / dist) * 100;
            const pushY = Math.round(dy / dist) * 100;
            setTargetPushback(`translate(${pushX}%, ${pushY}%)`);
            setTimeout(() => {
              setTargetPushback(null);
            }, 800);
          }
        } else if (arrowType === 'poison') {
          hitType = 'poison_burst';
          dmg = '-14';
          color = '#38b000';
          // Start poison DoT — 8s duration, ticks every 1.5s
          if (poisonIntervalRef.current) clearInterval(poisonIntervalRef.current);
          const pEndTime = Date.now() + 8000;
          setPoisonEndTime(pEndTime);
          setTargetPoisoned(true);
          let ticks = 0;
          poisonIntervalRef.current = setInterval(() => {
            ticks++;
            addFloatingText('-4', 'normal', '#38b000', targetPos.row, targetPos.col);
            if (ticks >= 5) {
              clearInterval(poisonIntervalRef.current);
              setTargetPoisoned(false);
              setPoisonEndTime(null);
            }
          }, 1500);
        } else if (arrowType === 'celestial') {
          hitType = 'fire_exp';
          dmg = '-28';
          color = '#ffdd57';
        }

        setHitEffect({ type: hitType });
        addFloatingText(dmg, 'normal', color, targetPos.row, targetPos.col);

        if (targetMarked) {
          setTargetMarked(false);
          setMarkEndTime(null);
          setTimeout(() => {
            addFloatingText('+15', 'crit', '#e63946', targetPos.row, targetPos.col);
          }, 150);
        }

        setTimeout(() => {
          setTargetShake(false);
          setTargetFlash(false);
          setHitEffect(null);
        }, 300);

        setAnimating(false);
      }, 430);
    }

    // --- RANGER MARK ---
    else if (ability.id === 'mark') {
      setAnimating(true);
      addFloatingText('MARKED!', 'normal', '#ff5400', targetPos.row, targetPos.col);
      const endTime = Date.now() + 8000;
      setMarkEndTime(endTime);
      setTargetMarked(true);
      // Auto-clear after long duration (8000ms)
      setTimeout(() => {
        setTargetMarked(false);
        setMarkEndTime(null);
      }, 8000);
      setTimeout(() => {
        setAnimating(false);
      }, 400);
    }

    // --- RANGER ENSNARE ---
    else if (ability.id === 'ensnare') {
      setAnimating(true);
      setProjectile({
        x: fighterPos.col * 20,
        y: fighterPos.row * 20,
        icon: ranger_net_throw,
        isNet: true
      });
      setTimeout(() => {
        setProjectile(prev => prev ? { ...prev, x: targetPos.col * 20, y: targetPos.row * 20 } : null);
      }, 30);
      setTimeout(() => {
        setProjectile(null);
        setTargetShake(true);
        setTargetFlash(true);
        setHitEffect({ type: 'slash' });
        addFloatingText('ENSNARED!', 'normal', '#8bc34a', targetPos.row, targetPos.col);
        const endTime = Date.now() + 3000;
        setEnsnareEndTime(endTime);
        setTargetEnsnared(true);
        setTargetEnsnaredFading(false);
        setTimeout(() => {
          setTargetEnsnaredFading(true);
        }, 2500);
        setTimeout(() => {
          setTargetEnsnared(false);
          setTargetEnsnaredFading(false);
          setEnsnareEndTime(null);
        }, 3000);
        setTimeout(() => {
          setTargetShake(false);
          setTargetFlash(false);
          setHitEffect(null);
        }, 350);
        setAnimating(false);
      }, 430);
    }

    // --- RANGER EXECUTE (3 SEQUENTIAL ARROWS) ---
    else if (ability.id === 'execute') {
      setAnimating(true);
      const arrowType = notchedArrow || 'ice';
      let pIcon = ranger_ice_arrow;
      if (arrowType === 'force') pIcon = ranger_force_arrow;
      else if (arrowType === 'poison') pIcon = ranger_poison_arrow;
      else if (arrowType === 'celestial') pIcon = ranger_celestial_arrow;

      const fireArrow = (delayTime, index) => {
        setTimeout(() => {
          const arrowId = Math.random();
          setProjectiles(prev => [...prev, {
            id: arrowId,
            x: fighterPos.col * 20,
            y: fighterPos.row * 20,
            icon: pIcon,
            isRangerArrow: true,
            arrowType: arrowType
          }]);

          // Move
          setTimeout(() => {
            setProjectiles(prev => prev.map(p => p.id === arrowId ? {
              ...p,
              x: targetPos.col * 20,
              y: targetPos.row * 20
            } : p));
          }, 30);

          // Impact
          setTimeout(() => {
            setProjectiles(prev => prev.filter(p => p.id !== arrowId));
            setTargetShake(true);
            setTargetFlash(true);

            let hitType = 'arrow_hit';
            let dmg = '-12';
            let color = '#ff4d4d';

            if (arrowType === 'ice') {
              hitType = 'ice_burst';
              dmg = '-14';
              color = '#00bfff';
              setTargetFrozen(true);
              const fEndTime = Date.now() + 1500;
              setFrozenEndTime(fEndTime);
              setFrozenIconActive(true);
              setTimeout(() => {
                setTargetFrozen(false);
                setFrozenIconActive(false);
                setFrozenEndTime(null);
              }, 1500);
            } else if (arrowType === 'force') {
              hitType = 'fire_exp';
              dmg = '-18';
              color = '#ff9f1c';

              const dx = targetPos.col - fighterPos.col;
              const dy = targetPos.row - fighterPos.row;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 0) {
                const pushX = Math.round(dx / dist) * 100;
                const pushY = Math.round(dy / dist) * 100;
                setTargetPushback(`translate(${pushX}%, ${pushY}%)`);
                setTimeout(() => {
                  setTargetPushback(null);
                }, 800);
              }
            } else if (arrowType === 'poison') {
              hitType = 'poison_burst';
              dmg = '-10';
              color = '#38b000';
            } else if (arrowType === 'celestial') {
              hitType = 'fire_exp';
              dmg = '-22';
              color = '#ffdd57';
            }

            setHitEffect({ type: hitType });
            addFloatingText(dmg, 'normal', color, targetPos.row, targetPos.col);

            if (targetMarked) {
              setTargetMarked(false);
              setMarkEndTime(null);
              setTimeout(() => {
                addFloatingText('+15', 'crit', '#e63946', targetPos.row, targetPos.col);
              }, 150);
            }

            setTimeout(() => {
              setTargetShake(false);
              setTargetFlash(false);
              setHitEffect(null);
            }, 200);

            if (index === 3) {
              setAnimating(false);
            }
          }, 430);

        }, delayTime);
      };

      fireArrow(0, 1);
      fireArrow(250, 2);
      fireArrow(500, 3);
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
        addFloatingText('-30', 'crit', '#e63946', targetPos.row, targetPos.col);

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
          addFloatingText('-25', 'crit', '#7209b7', targetPos.row, targetPos.col);

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
      let txt = '+30';
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

      // Sage heal: approach the ally first, then heal
      if (selectedFighterId === 'sage' && ability.type === 'heal') {
        setAnimationPhase('heal_approach');
        setTimeout(() => {
          // a) Sage has arrived adjacent (350ms duration)
          const dx = targetPos.col - fighterPos.col;
          const dy = targetPos.row - fighterPos.row;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          let midCol = targetPos.col;
          let midRow = targetPos.row;
          if (dist > 0) {
            const stepCol = Math.round(dx / dist);
            const stepRow = Math.round(dy / dist);
            const adjCol = targetPos.col - stepCol;
            const adjRow = targetPos.row - stepRow;
            midCol = (adjCol + targetPos.col) / 2;
            midRow = (adjRow + targetPos.row) / 2;
          }

          // b) Render healing hands icon and target glow
          setHealIcon({ row: midRow, col: midCol, active: true });
          setTargetHealGlow(true);
          
          addFloatingText(txt, 'normal', color, targetPos.row, targetPos.col);
          setTimeout(() => {
            addFloatingText('+30', 'normal', '#2ec4b6', targetPos.row, targetPos.col);
          }, 150);

          // c) Effect is finished: icon fades and color glow fades after 800ms
          setTimeout(() => {
            setHealIcon(prev => prev ? { ...prev, active: false } : null);
            setTargetHealGlow(false);

            // d) Sage moves back to its origin tile after fade duration (300ms)
            setTimeout(() => {
              setAnimationPhase('return');
              setHealIcon(null);

              // Arrives back at origin
              setTimeout(() => {
                setAnimationPhase(null);
                setAnimating(false);
              }, 350);
            }, 300);
          }, 800);
        }, 350);
      } else {
        setSelfBuffEffect(buff);
        addFloatingText(txt, 'normal', color, fighterPos.row, fighterPos.col);

        if (selectedFighterId === 'sage') {
          setTimeout(() => {
            addFloatingText('+30', 'normal', '#2ec4b6', targetPos.row, targetPos.col);
          }, 150);
        }

        setTimeout(() => {
          setSelfBuffEffect(null);
          setAnimating(false);
        }, 1000);
      }
    }

    // --- CIRCLE OF PROTECTION ---
    else if (ability.type === 'circle_of_protection') {
      setAnimating(true);
      setCopActive(true);
      setCopFading(false);
      setCopEndTime(Date.now() + 8000);
      addFloatingText('SANCTUARY!', 'normal', '#00bfff', fighterPos.row, fighterPos.col);

      setTimeout(() => {
        setCopFading(true);
        setTimeout(() => {
          setCopActive(false);
          setCopFading(false);
          setAnimating(false);
          setCopEndTime(null);
        }, 300);
      }, 8000);
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

    // --- BEAM SPELLS (non-lightning) ---
    else if (ability.type === 'beam' || ability.type === 'beam_drain') {
      setAnimating(true);
      
      let beamType = 'smite';
      let dmg = '-32';
      let color = '#ffe600';

      if (ability.id === 'energy_drain') {
        beamType = 'drain';
        dmg = '-15';
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
          addFloatingText('+15', 'normal', '#2ec4b6', fighterPos.row, fighterPos.col);
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

    // --- WIZARD LIGHTNING ---
    else if (ability.type === 'lightning') {
      setAnimating(true);
      setActiveBeam('lightning');

      // Hit at 350ms
      setTimeout(() => {
        setActiveBeam(null);
        setTargetShake(true);
        setTargetFlash(true);
        setLightningJagged(true);
        setHitEffect({ type: 'lightning_hit' });
        addFloatingText('-30', 'crit', '#00ffff', targetPos.row, targetPos.col);

        setTimeout(() => {
          setTargetShake(false);
          setTargetFlash(false);
          setHitEffect(null);
          setLightningJagged(false);
        }, 500);

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
            isMagicMissile: true  // CSS orb, not an image
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
            setHitEffect({ type: 'shadow' });
            addFloatingText('-10', 'normal', '#b5179e', targetPos.row, targetPos.col);

            setTimeout(() => {
              setTargetShake(false);
              setTargetFlash(false);
              setHitEffect(null);
            }, 150);
          }, 430);

        }, delayTime);
      };

      fireMissile(0, -5);
      fireMissile(200, 0);
      fireMissile(400, 5);

      setTimeout(() => {
        setAnimating(false);
      }, 1050);
    }

    // --- WIZARD ACID BLAST ---
    else if (ability.type === 'acid_blast') {
      setAnimating(true);
      setProjectile({
        x: fighterPos.col * 20,
        y: fighterPos.row * 20,
        isAcidBlast: true
      });
      setTimeout(() => {
        setProjectile(prev => prev ? { ...prev, x: targetPos.col * 20, y: targetPos.row * 20 } : null);
      }, 30);
      setTimeout(() => {
        setProjectile(null);
        setTargetShake(true);
        setTargetFlash(true);
        setHitEffect({ type: 'poison_burst' });
        addFloatingText('-12', 'normal', '#38b000', targetPos.row, targetPos.col);

        if (poisonIntervalRef.current) clearInterval(poisonIntervalRef.current);
        setPoisonDuration(4000);
        setPoisonEndTime(Date.now() + 4000);
        setTargetPoisoned(true);

        let ticks = 0;
        poisonIntervalRef.current = setInterval(() => {
          ticks++;
          addFloatingText('-3', 'normal', '#38b000', targetPos.row, targetPos.col);
          if (ticks >= 4) {
            clearInterval(poisonIntervalRef.current);
            setTargetPoisoned(false);
            setPoisonEndTime(null);
          }
        }, 1000);

        setTimeout(() => {
          setTargetShake(false);
          setTargetFlash(false);
          setHitEffect(null);
        }, 350);
        setAnimating(false);
      }, 430);
    }

    // --- WIZARD DISINTEGRATE ---
    else if (ability.type === 'disintegrate') {
      setAnimating(true);
      setActiveBeam('disintegrate');
      setTargetDisintegrating(true);

      setTimeout(() => {
        addFloatingText('-6', 'normal', '#ff3333', targetPos.row, targetPos.col);
        setTargetFlash(true);
        setTimeout(() => setTargetFlash(false), 100);
      }, 400);
      setTimeout(() => {
        addFloatingText('-10', 'normal', '#ff1a1a', targetPos.row, targetPos.col);
        setTargetFlash(true);
        setTimeout(() => setTargetFlash(false), 100);
      }, 900);
      setTimeout(() => {
        addFloatingText('-18', 'normal', '#e60000', targetPos.row, targetPos.col);
        setTargetFlash(true);
        setTimeout(() => setTargetFlash(false), 100);
      }, 1400);
      setTimeout(() => {
        addFloatingText('-32', 'crit', '#ff0055', targetPos.row, targetPos.col);
        setHitEffect({ type: 'fire_exp' });
        setTargetFlash(true);
        setTimeout(() => setTargetFlash(false), 200);
      }, 1800);

      setTimeout(() => {
        setActiveBeam(null);
        setTargetDisintegrating(false);
        setHitEffect(null);
        setAnimating(false);
      }, 2200);
    }

    // --- WIZARD SLEEP ---
    else if (ability.type === 'sleep') {
      setAnimating(true);
      setProjectile({
        x: fighterPos.col * 20,
        y: fighterPos.row * 20,
        icon: wizard_sleep,
        isSleep: true
      });
      setTimeout(() => {
        setProjectile(prev => prev ? { ...prev, x: targetPos.col * 20, y: targetPos.row * 20 } : null);
      }, 30);
      setTimeout(() => {
        setProjectile(null);
        setTargetShake(true);
        setTargetFlash(true);
        setHitEffect({ type: 'sleep_rings' });

        setTimeout(() => {
          setTargetShake(false);
          setTargetFlash(false);
        }, 350);

        setTimeout(() => {
          setHitEffect(null);
          setTargetAsleep(true);
          setSleepIconActive(true);
          setSleepEndTime(Date.now() + 8000);
          addFloatingText('SLEEP', 'normal', '#90caf9', targetPos.row, targetPos.col);

          setTimeout(() => {
            setTargetAsleep(false);
            setSleepIconActive(false);
            setSleepEndTime(null);
          }, 8000);

          setAnimating(false);
        }, 2000);
      }, 430);
    }

    // --- WIZARD ANNIHILATION ---
    else if (ability.type === 'annihilation') {
      setAnimating(true);
      setActiveBeam('annihilation');
      setAnnihilationSweepActive(false);

      setTimeout(() => {
        setAnnihilationSweepActive(true);
      }, 50);

      setTimeout(() => {
        setActiveBeam(null);
        setAnnihilationSweepActive(false);
        setTargetShake(true);
        setTargetFlash(true);
        setHitEffect({ type: 'annihilation_portal' });
        addFloatingText('-48', 'crit', '#9d4edd', targetPos.row, targetPos.col);

        setAnnihilationExplosion({ row: targetPos.row, col: targetPos.col });
        setTimeout(() => setAnnihilationExplosion(null), 700);

        setTimeout(() => {
          setTargetShake(false);
          setTargetFlash(false);
          setHitEffect(null);
        }, 800);

        setAnimating(false);
      }, 850);
    }

    // --- WIZARD VORTEX ---
    else if (ability.type === 'vortex') {
      setAnimating(true);
      setVortexActive({ row: targetPos.row, col: targetPos.col });

      const interval = setInterval(() => {
        // Main target
        setTargetShake(true);
        setTimeout(() => setTargetShake(false), 80);
        addFloatingText('-5', 'normal', '#7b2cbf', targetPos.row, targetPos.col);

        // Check Extra Goblin 1 (row: 1, col: 4)
        if (Math.abs(1 - targetPos.row) <= 1 && Math.abs(4 - targetPos.col) <= 1) {
          setExtraGoblin1Shake(true);
          setExtraGoblin1Flash(true);
          setTimeout(() => {
            setExtraGoblin1Shake(false);
            setExtraGoblin1Flash(false);
          }, 80);
          addFloatingText('-5', 'normal', '#7b2cbf', 1, 4);
        }

        // Check Extra Goblin 2 (row: 3, col: 4)
        if (Math.abs(3 - targetPos.row) <= 1 && Math.abs(4 - targetPos.col) <= 1) {
          setExtraGoblin2Shake(true);
          setExtraGoblin2Flash(true);
          setTimeout(() => {
            setExtraGoblin2Shake(false);
            setExtraGoblin2Flash(false);
          }, 80);
          addFloatingText('-5', 'normal', '#7b2cbf', 3, 4);
        }
      }, 350);

      setTimeout(() => {
        clearInterval(interval);
        setVortexActive(null);
        setAnimating(false);
      }, 1600);
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
        addFloatingText('-22', 'normal', '#7209b7', targetPos.row, targetPos.col);

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
        @keyframes organicMorphYellow {
          0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: rotate(0deg); }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: rotate(180deg); }
          100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: rotate(360deg); }
        }
        @keyframes organicMorphOrange {
          0% { border-radius: 40% 60% 50% 50% / 40% 40% 60% 60%; transform: rotate(360deg); }
          50% { border-radius: 70% 30% 40% 60% / 60% 70% 30% 40%; transform: rotate(180deg); }
          100% { border-radius: 40% 60% 50% 50% / 40% 40% 60% 60%; transform: rotate(0deg); }
        }
        @keyframes organicGlow {
          0% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
            transform: rotate(0deg) scale(0.95);
          }
          50% {
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
            transform: rotate(180deg) scale(1.05);
          }
          100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
            transform: rotate(360deg) scale(0.95);
          }
        }
        @keyframes organicGlowRev {
          0% {
            border-radius: 40% 60% 50% 50% / 40% 40% 60% 60%;
            transform: rotate(360deg) scale(1.05);
          }
          50% {
            border-radius: 70% 30% 40% 60% / 60% 70% 30% 40%;
            transform: rotate(180deg) scale(0.95);
          }
          100% {
            border-radius: 40% 60% 50% 50% / 40% 40% 60% 60%;
            transform: rotate(0deg) scale(1.05);
          }
        }
        @keyframes poisonPulseGlow {
          0% {
            box-shadow: inset 0 0 10px rgba(56, 176, 0, 0.3), 0 0 8px rgba(56, 176, 0, 0.2);
            background: rgba(56, 176, 0, 0.05);
          }
          100% {
            box-shadow: inset 0 0 25px rgba(56, 176, 0, 0.7), 0 0 20px rgba(56, 176, 0, 0.6);
            background: rgba(56, 176, 0, 0.2);
          }
        }
        @keyframes acidDrip {
          0% {
            transform: translateY(-20px) scale(0.6);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          80% {
            opacity: 0.8;
            transform: translateY(60px) scale(1);
          }
          100% {
            transform: translateY(90px) scale(0.4);
            opacity: 0;
          }
        }
        @keyframes fireRingExpand {
          0% {
            width: 0px;
            height: 0px;
            opacity: 1;
            border: 4px solid #ffe49e;
            box-shadow: 0 0 10px #ff5a1f, inset 0 0 10px #ff5a1f;
          }
          50% {
            opacity: 0.8;
            border: 6px solid #ff9d2b;
            box-shadow: 0 0 25px #ff5a1f, inset 0 0 15px #ff5a1f;
          }
          100% {
            width: 260px;
            height: 260px;
            opacity: 0;
            border: 2px solid #d9230f;
            box-shadow: 0 0 40px #d9230f, inset 0 0 20px #d9230f;
          }
        }
        @keyframes fireballFlicker {
          0% { transform: scale(0.95); filter: brightness(1); }
          100% { transform: scale(1.05); filter: brightness(1.2); }
        }
        @keyframes iceFlicker {
          0% { transform: scale(0.9); }
          100% { transform: scale(1.1); }
        }
        @keyframes iceSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes missileGlow {
          0% { transform: scale(0.9); box-shadow: 0 0 8px #d946ef, 0 0 15px #701a75; }
          100% { transform: scale(1.1); box-shadow: 0 0 14px #d946ef, 0 0 25px #701a75; }
        }
        @keyframes lightningFlash {
          0%, 100% { opacity: 0; transform: scaleX(1); }
          50% { opacity: 1; transform: scaleX(1.1) skewX(-2deg); }
        }
        @keyframes lightningBgFlash {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.35; }
        }
        @keyframes whirlwindSpin {
          0% { transform: translate(-50%, -50%) scale(0.2) rotate(0deg); opacity: 0; }
          15% { transform: translate(-50%, -50%) scale(1.15) rotate(180deg); opacity: 0.9; }
          85% { transform: translate(-50%, -50%) scale(1.0) rotate(540deg); opacity: 0.9; }
          100% { transform: translate(-50%, -50%) scale(0.1) rotate(720deg); opacity: 0; }
        }
        @keyframes floatUp {
          0% { transform: translate(-50%, 0); opacity: 1; }
          100% { transform: translate(-50%, -40px); opacity: 0; }
        }
        @keyframes disintegrateBeam {
          0% {
            width: 8px;
            box-shadow: 0 0 10px #ffffff, 0 0 20px #ff1a1a, 0 0 30px #ff1a1a;
            opacity: 0.95;
          }
          15% {
            width: 10px;
            box-shadow: 0 0 12px #ffffff, 0 0 25px #ff1a1a, 0 0 35px #ff1a1a;
          }
          30% {
            width: 18px;
            box-shadow: 0 0 18px #ffffff, 0 0 35px #ff1a1a, 0 0 55px #ff1a1a;
          }
          75% {
            width: 48px;
            box-shadow: 0 0 30px #ffffff, 0 0 60px #ff1a1a, 0 0 90px #ff1a1a, 0 0 120px #ff1a1a;
            opacity: 1;
          }
          90% {
            width: 48px;
            box-shadow: 0 0 30px #ffffff, 0 0 60px #ff1a1a, 0 0 90px #ff1a1a, 0 0 120px #ff1a1a;
            opacity: 1;
          }
          100% {
            width: 0px;
            box-shadow: 0 0 0px transparent;
            opacity: 0;
          }
        }
        @keyframes disintegrateShake {
          0% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-1px, 1px) rotate(-0.5deg); }
          20% { transform: translate(1px, -1px) rotate(0.5deg); }
          30% { transform: translate(-2px, 2px) rotate(-1deg); }
          40% { transform: translate(2px, -2px) rotate(1deg); }
          50% { transform: translate(-3px, 1px) rotate(-1.5deg); }
          60% { transform: translate(3px, -1px) rotate(1.5deg); }
          70% { transform: translate(-5px, 3px) rotate(-2deg); }
          80% { transform: translate(5px, -3px) rotate(2deg); }
          90% { transform: translate(-7px, 4px) rotate(-3.5deg); }
          95% { transform: translate(7px, -4px) rotate(3.5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes zzzFloat {
          0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translate(15px, -35px) scale(1.25); opacity: 0; }
        }
        @keyframes vortexSpin {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(0.85); }
          50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.15); }
          100% { transform: translate(-50%, -50%) rotate(360deg) scale(0.85); }
        }
        @keyframes annihilationRing {
          0% {
            width: 0px;
            height: 0px;
            border: 4px solid #ff007f;
            background: rgba(142, 45, 226, 0.4);
            box-shadow: 0 0 15px #8e2de2, inset 0 0 10px #ff007f;
            opacity: 1;
          }
          100% {
            width: 160px;
            height: 160px;
            border: 1px solid transparent;
            background: rgba(142, 45, 226, 0);
            box-shadow: 0 0 45px #ff007f, inset 0 0 30px #8e2de2;
            opacity: 0;
          }
        }
        @keyframes collapsarRing {
          0% {
            transform: scale(1.3);
            opacity: 0;
          }
          15% {
            opacity: 0.95;
          }
          85% {
            opacity: 0.95;
          }
          100% {
            transform: scale(0.15);
            opacity: 0;
          }
        }
        @keyframes sleepShrinkRing {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(1.6);
            opacity: 0;
          }
          15% {
            opacity: 0.65;
            transform: translate(-50%, -50%) rotate(27deg) scale(1.36);
          }
          85% {
            opacity: 0.65;
            transform: translate(-50%, -50%) rotate(153deg) scale(0.34);
          }
          100% {
            transform: translate(-50%, -50%) rotate(180deg) scale(0.1);
            opacity: 0;
          }
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
        @keyframes modalScaleUp {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes weaponSwingArc {
          0% {
            transform: rotate(-60deg);
            opacity: 0;
          }
          10% {
            transform: rotate(-60deg);
            opacity: 1;
          }
          90% {
            transform: rotate(60deg);
            opacity: 1;
          }
          100% {
            transform: rotate(60deg);
            opacity: 0;
          }
        }
        @keyframes radialCooldownSweep {
          0% { stroke-dashoffset: 31.42; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes birdieOrbit1 {
          0% { transform: translate(25px, 0px) scale(1.1); z-index: 5; }
          25% { transform: translate(0px, 6px) scale(0.95); z-index: 5; }
          50% { transform: translate(-25px, 0px) scale(0.8); z-index: 1; }
          75% { transform: translate(0px, -6px) scale(0.95); z-index: 1; }
          100% { transform: translate(25px, 0px) scale(1.1); z-index: 5; }
        }
        @keyframes birdieOrbit2 {
          0% { transform: translate(-25px, 0px) scale(0.8); z-index: 1; }
          25% { transform: translate(0px, -6px) scale(0.95); z-index: 1; }
          50% { transform: translate(25px, 0px) scale(1.1); z-index: 5; }
          75% { transform: translate(0px, 6px) scale(0.95); z-index: 5; }
          100% { transform: translate(-25px, 0px) scale(0.8); z-index: 1; }
        }
        @keyframes imbuedStrikeThrust {
          0% {
            transform: rotate(-60deg) translateX(0);
            opacity: 0;
          }
          10% {
            transform: rotate(-60deg) translateX(0);
            opacity: 1;
          }
          35% {
            transform: rotate(0deg) translateX(0);
            opacity: 1;
          }
          55% {
            transform: rotate(0deg) translateX(0);
            opacity: 1;
          }
          65% {
            transform: rotate(0deg) translateX(24px);
            opacity: 1;
          }
          85% {
            transform: rotate(0deg) translateX(24px);
            opacity: 1;
          }
          100% {
            transform: rotate(0deg) translateX(24px);
            opacity: 0;
          }
        }
        @keyframes cleaveStuck {
          0% {
            transform: rotate(-60deg);
            opacity: 0;
          }
          10% {
            transform: rotate(-60deg);
            opacity: 1;
          }
          35% {
            transform: rotate(0deg);
            opacity: 1;
          }
          85% {
            transform: rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: rotate(0deg);
            opacity: 0;
          }
        }
        @keyframes leapScale {
          0% { transform: scale(1); }
          50% { transform: scale(1.55); }
          100% { transform: scale(1); }
        }
        @keyframes pulseRedIntense {
          0%, 100% {
            box-shadow: 0 0 15px rgba(255, 0, 0, 0.6), inset 0 0 8px rgba(255, 0, 0, 0.4);
            filter: brightness(1);
          }
          50% {
            box-shadow: 0 0 35px rgba(255, 0, 0, 0.95), inset 0 0 20px rgba(255, 0, 0, 0.85);
            filter: brightness(1.2) saturate(1.5);
          }
        }
        @keyframes dizzySpin {
          0% { transform: rotate(0deg) translateX(12px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(12px) rotate(-360deg); }
        }
        @keyframes stunWobble {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(-3deg) translateY(-2px); }
          75% { transform: rotate(3deg) translateY(1px); }
        }
        @keyframes ensnarePulse {
          0%, 100% { opacity: 0.7; box-shadow: 0 0 6px rgba(85,139,47,0.6); }
          50% { opacity: 1; box-shadow: 0 0 14px rgba(85,139,47,1); }
        }
        @keyframes beamShrink {
          0% { width: 18px; opacity: 1; }
          100% { width: 0px; opacity: 0; }
        }
        @keyframes pulse {
          0% { opacity: 0.45; }
          50% { opacity: 0.8; }
          100% { opacity: 0.45; }
        }
        @keyframes shake {
          0% { transform: translate(0, 0); }
          20% { transform: translate(-8px, 5px); }
          40% { transform: translate(8px, -5px); }
          60% { transform: translate(-5px, -3px); }
          80% { transform: translate(5px, 3px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes poisonDrop {
          0% { opacity: 0.9; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(-12px, 6px) scale(0.3); }
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
            flex: '0 0 280px',
            width: '280px',
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
                    if (f.id === 'sage') {
                      setTargetPos({ row: 2, col: 3 });
                    }
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
            flex: '1 1 auto',
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
              width: '500px',
              height: '500px',
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

                  // Sage & Soldier friendly units coordinates
                  const isAdditionalRanger = (selectedFighterId === 'sage' && r === 3 && c === 0) || (selectedFighterId === 'soldier' && r === 0 && c === 1);
                  const isAdditionalBarbarian = selectedFighterId === 'sage' && r === 0 && c === 3;
                  const isAdditionalSoldier = selectedFighterId === 'sage' && r === 2 && c === 3;
                  const isAdditionalMonk = selectedFighterId === 'soldier' && r === 0 && c === 3;

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => {
                        if (isAnimating) return;
                        if (placementMode === 'fighter') {
                          if (isTarget) return; // Overlap guard
                          // Also restrict placing over additional friendly units
                          if (selectedFighterId === 'sage' && ((r === 3 && c === 0) || (r === 0 && c === 3) || (r === 2 && c === 3))) return;
                          setFighterPos({ row: r, col: c });
                        } else {
                          if (isFighter) return; // Overlap guard
                          if (selectedFighterId === 'sage' && ((r === 3 && c === 0) || (r === 0 && c === 3) || (r === 2 && c === 3))) return;
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

                      {/* Render Additional Ranger for Sage */}
                      {isAdditionalRanger && (
                        <div
                          className={`friendly-portrait-unit ${copActive ? 'pulse-bright' : ''}`}
                          style={{
                            width: '80%',
                            height: '80%',
                            borderRadius: '8px',
                            border: '2px solid #8ecae6',
                            backgroundColor: '#222',
                            backgroundImage: `url(${ranger})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 8,
                            pointerEvents: 'none'
                          }}
                        >
                          {copActive && (
                            <div
                              className={copFading ? 'effect-icon-fading' : 'effect-icon-active'}
                              style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: '#111',
                                border: '2px solid #00bfff',
                                backgroundImage: `url(${shielded})`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                                zIndex: 15,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                overflow: 'hidden'
                              }}
                            >
                              <svg 
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  transform: 'rotate(-90deg)',
                                  pointerEvents: 'none'
                                }}
                                viewBox="0 0 20 20"
                              >
                                <circle
                                  cx="10"
                                  cy="10"
                                  r="5"
                                  fill="none"
                                  stroke="rgba(0, 0, 0, 0.35)"
                                  strokeWidth="10"
                                  strokeDasharray="31.42"
                                  strokeDashoffset={getCopDashOffset()}
                                />
                                {(() => {
                                  const coords = getRadialLineCoords(copEndTime);
                                  return coords ? (
                                    <line
                                      x1="10"
                                      y1="10"
                                      x2={coords.x2}
                                      y2={coords.y2}
                                      stroke="#ffffff"
                                      strokeWidth="0.8"
                                    />
                                  ) : null;
                                })()}
                              </svg>
                            </div>
                          )}
                          <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            width: '100%',
                            background: 'rgba(0,0,0,0.75)',
                            color: '#fff',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            padding: '1px 0',
                            borderBottomLeftRadius: '6px',
                            borderBottomRightRadius: '6px'
                          }}>
                            Ranger
                          </div>
                          {selectedFighterId === 'soldier' && inspireActive && (
                            <div
                              className={inspireFading ? 'effect-icon-fading' : 'effect-icon-active'}
                              style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: '#111',
                                border: '2px solid #ffdd57',
                                backgroundImage: `url(${inspire})`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                                zIndex: 15,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                overflow: 'hidden'
                              }}
                            >
                              <svg 
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  transform: 'rotate(-90deg)',
                                  pointerEvents: 'none'
                                }}
                                viewBox="0 0 20 20"
                              >
                                <circle
                                  cx="10"
                                  cy="10"
                                  r="5"
                                  fill="none"
                                  stroke="rgba(0, 0, 0, 0.35)"
                                  strokeWidth="10"
                                  strokeDasharray="31.42"
                                  strokeDashoffset={getInspireDashOffset()}
                                />
                                {(() => {
                                  const coords = getRadialLineCoords(inspireEndTime);
                                  return coords ? (
                                    <line
                                      x1="10"
                                      y1="10"
                                      x2={coords.x2}
                                      y2={coords.y2}
                                      stroke="#ffffff"
                                      strokeWidth="0.8"
                                    />
                                  ) : null;
                                })()}
                              </svg>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Render Additional Barbarian for Sage */}
                      {isAdditionalBarbarian && (
                        <div
                          style={{
                            width: '80%',
                            height: '80%',
                            borderRadius: '8px',
                            border: '2px solid #ffb703',
                            backgroundColor: '#222',
                            backgroundImage: `url(${barbarian})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 8,
                            pointerEvents: 'none'
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            width: '100%',
                            background: 'rgba(0,0,0,0.75)',
                            color: '#fff',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            padding: '1px 0',
                            borderBottomLeftRadius: '6px',
                            borderBottomRightRadius: '6px'
                          }}>
                            Barbarian
                          </div>
                        </div>
                      )}

                      {/* Render Additional Monk for Soldier */}
                      {isAdditionalMonk && (
                        <div
                          style={{
                            width: '80%',
                            height: '80%',
                            borderRadius: '8px',
                            border: '2px solid #ff9f1c',
                            backgroundColor: '#222',
                            backgroundImage: `url(${monk})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 8,
                            pointerEvents: 'none'
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            width: '100%',
                            background: 'rgba(0,0,0,0.75)',
                            color: '#fff',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            padding: '1px 0',
                            borderBottomLeftRadius: '6px',
                            borderBottomRightRadius: '6px'
                          }}>
                            Monk
                          </div>
                          {selectedFighterId === 'soldier' && inspireActive && (
                            <div
                              className={inspireFading ? 'effect-icon-fading' : 'effect-icon-active'}
                              style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: '#111',
                                border: '2px solid #ffdd57',
                                backgroundImage: `url(${inspire})`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                                zIndex: 15,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                overflow: 'hidden'
                              }}
                            >
                              <svg 
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  transform: 'rotate(-90deg)',
                                  pointerEvents: 'none'
                                }}
                                viewBox="0 0 20 20"
                              >
                                <circle
                                  cx="10"
                                  cy="10"
                                  r="5"
                                  fill="none"
                                  stroke="rgba(0, 0, 0, 0.35)"
                                  strokeWidth="10"
                                  strokeDasharray="31.42"
                                  strokeDashoffset={getInspireDashOffset()}
                                />
                                {(() => {
                                  const coords = getRadialLineCoords(inspireEndTime);
                                  return coords ? (
                                    <line
                                      x1="10"
                                      y1="10"
                                      x2={coords.x2}
                                      y2={coords.y2}
                                      stroke="#ffffff"
                                      strokeWidth="0.8"
                                    />
                                  ) : null;
                                })()}
                              </svg>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Render Additional Soldier for Sage */}
                      {isAdditionalSoldier && (
                        <div
                          className={`friendly-portrait-unit ${copActive ? 'pulse-dim' : ''}`}
                          style={{
                            width: '80%',
                            height: '80%',
                            borderRadius: '8px',
                            border: '2px solid #2a9d8f',
                            backgroundColor: '#222',
                            backgroundImage: `url(${soldier})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 8,
                            pointerEvents: 'none'
                          }}
                        >
                          {copActive && (
                            <div
                              className={copFading ? 'effect-icon-fading' : 'effect-icon-active'}
                              style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: '#111',
                                border: '2px solid #00bfff',
                                backgroundImage: `url(${shielded_partial})`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                                zIndex: 15,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                overflow: 'hidden'
                              }}
                            >
                              <svg 
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  transform: 'rotate(-90deg)',
                                  pointerEvents: 'none'
                                }}
                                viewBox="0 0 20 20"
                              >
                                <circle
                                  cx="10"
                                  cy="10"
                                  r="5"
                                  fill="none"
                                  stroke="rgba(0, 0, 0, 0.35)"
                                  strokeWidth="10"
                                  strokeDasharray="31.42"
                                  strokeDashoffset={getCopDashOffset()}
                                />
                                {(() => {
                                  const coords = getRadialLineCoords(copEndTime);
                                  return coords ? (
                                    <line
                                      x1="10"
                                      y1="10"
                                      x2={coords.x2}
                                      y2={coords.y2}
                                      stroke="#ffffff"
                                      strokeWidth="0.8"
                                    />
                                  ) : null;
                                })()}
                              </svg>
                            </div>
                          )}
                          <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            width: '100%',
                            background: 'rgba(0,0,0,0.75)',
                            color: '#fff',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            padding: '1px 0',
                            borderBottomLeftRadius: '6px',
                            borderBottomRightRadius: '6px'
                          }}>
                            Soldier
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ))}

              {/* --- Sage Circle of Protection (COP) Ring Overlay --- */}
              {selectedFighterId === 'sage' && copActive && (
                <div
                  className={copFading ? 'effect-icon-fading' : 'effect-icon-active'}
                  style={{
                    position: 'absolute',
                    width: '80%',
                    height: '80%',
                    left: `${fighterPos.col * 20 - 30}%`,
                    top: `${fighterPos.row * 20 - 30}%`,
                    zIndex: 7,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Outer ring with glow */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '5px solid rgba(0, 191, 255, 0.75)',
                    boxShadow: '0 0 35px rgba(0, 191, 255, 0.45), inset 0 0 35px rgba(0, 191, 255, 0.15)',
                    position: 'relative',
                    animation: 'spin-slow 20s linear infinite',
                  }}>
                    {/* Rune characters around the inside */}
                    {['\u16A0', '\u16A2', '\u16A6', '\u16A8', '\u16B1', '\u16B2', '\u16B7', '\u16B9', '\u16BA', '\u16C1', '\u16C3', '\u16C8'].map((rune, i) => {
                      const angle = (i / 12) * 360;
                      const radius = 42;
                      const rad = (angle - 90) * (Math.PI / 180);
                      return (
                        <span
                          key={i}
                          style={{
                            position: 'absolute',
                            left: `${50 + radius * Math.cos(rad)}%`,
                            top: `${50 + radius * Math.sin(rad)}%`,
                            transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                            color: 'rgba(0, 191, 255, 0.85)',
                            fontSize: '22px',
                            textShadow: '0 0 10px rgba(0, 191, 255, 1)',
                            userSelect: 'none',
                          }}
                        >
                          {rune}
                        </span>
                      );
                    })}
                    {/* Inner circle accent */}
                    <div style={{
                      position: 'absolute',
                      top: '15%',
                      left: '15%',
                      width: '70%',
                      height: '70%',
                      borderRadius: '50%',
                      border: '1px solid rgba(0, 191, 255, 0.2)',
                    }} />
                  </div>
                </div>
              )}

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
                {selectedFighterId === 'soldier' && oneManArmyActive && [
                  { x: -18, y: -18 },
                  { x: 18, y: -12 },
                  { x: -22, y: 14 },
                  { x: 22, y: 18 },
                  { x: 0, y: -24 }
                ].map((offset, idx) => (
                  <div
                    key={`oma-copy-${idx}`}
                    style={{
                      position: 'absolute',
                      left: `calc(10% + ${offset.x}px)`,
                      top: `calc(10% + ${offset.y}px)`,
                      width: '80%',
                      height: '80%',
                      borderRadius: '8px',
                      border: '2px solid #ffb703',
                      backgroundColor: '#222',
                      backgroundImage: `url(${selectedFighter.portrait})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: 0.75,
                      pointerEvents: 'none',
                      zIndex: 9
                    }}
                  />
                ))}
                <div
                  className={`${selectedFighterId === 'soldier' && shieldWallActive ? 'shield-wall-active-portrait' : ''} ${selectedFighterId === 'sage' && copActive ? 'pulse-bright' : ''}`}
                  style={{
                    width: '80%',
                    height: '80%',
                    borderRadius: '8px',
                    border: (selectedFighterId === 'soldier' && defensiveStanceActive)
                      ? '3px solid #ffffff'
                      : (selectedFighterId === 'barbarian' && berserkerActive)
                        ? '2px solid #ff3333'
                        : '2px solid #ffb703',
                    backgroundColor: '#222',
                    backgroundImage: `url(${selectedFighter.portrait})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    boxShadow: (selectedFighterId === 'soldier' && defensiveStanceActive)
                      ? '0 0 12px 3px rgba(255, 255, 255, 0.9), inset 0 0 8px rgba(255, 255, 255, 0.5)'
                      : (selectedFighterId === 'soldier' && shieldWallActive)
                        ? undefined
                        : (selectedFighterId === 'barbarian' && berserkerActive)
                          ? 'none'
                          : selfBuffEffect === 'rage'
                            ? '0 0 20px rgba(255, 0, 0, 0.7), inset 0 0 10px rgba(255, 0, 0, 0.5)'
                            : selfBuffEffect === 'barrier'
                              ? '0 0 20px rgba(0, 150, 255, 0.7), inset 0 0 10px rgba(0, 150, 255, 0.5)'
                              : '0 8px 16px rgba(0,0,0,0.5)',
                    animation: (selectedFighterId === 'barbarian' && animationPhase === 'leap_landing')
                      ? 'leapScale 0.6s ease-in-out forwards'
                      : (selectedFighterId === 'barbarian' && berserkerActive)
                        ? 'pulseRedIntense 1.0s infinite alternate'
                        : 'none',
                    position: 'relative'
                  }}>
                  {/* Monk Organic Glows */}
                  {selectedFighterId === 'monk' && etherealSpeedActive && (
                    <div style={{
                      position: 'absolute',
                      top: '-10px', left: '-10px', right: '-10px', bottom: '-10px',
                      zIndex: -1,
                      border: '3px solid rgba(255, 221, 87, 0.95)',
                      boxShadow: '0 0 25px 8px #ffdd57, inset 0 0 12px 4px #ffdd57',
                      background: 'rgba(255, 221, 87, 0.15)',
                      borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                      animation: 'organicGlow 4s linear infinite',
                      opacity: etherealSpeedFading ? 0.3 : 1,
                      transition: 'opacity 0.3s ease-in-out',
                      pointerEvents: 'none'
                    }} />
                  )}
                  {selectedFighterId === 'monk' && innerFireActive && (
                    <div style={{
                      position: 'absolute',
                      top: '-14px', left: '-14px', right: '-14px', bottom: '-14px',
                      zIndex: -2,
                      border: '3px solid rgba(255, 84, 0, 0.95)',
                      boxShadow: '0 0 35px 12px #ff5400, inset 0 0 18px 6px #ff5400',
                      background: 'rgba(255, 84, 0, 0.15)',
                      borderRadius: '40% 60% 50% 50% / 40% 40% 60% 60%',
                      animation: 'organicGlowRev 3.5s linear infinite',
                      opacity: innerFireFading ? 0.3 : 1,
                      transition: 'opacity 0.3s ease-in-out',
                      pointerEvents: 'none'
                    }} />
                  )}
                  {selectedFighterId === 'monk' && etherealSpeedActive && (
                    <div
                      className={etherealSpeedFading ? 'effect-icon-fading' : 'effect-icon-active'}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#111',
                        border: '2px solid #ffdd57',
                        backgroundImage: `url(${monk_ethereal_speed})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        zIndex: 15,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        overflow: 'hidden'
                      }}
                    >
                      <svg 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          transform: 'rotate(-90deg)',
                          pointerEvents: 'none'
                        }}
                        viewBox="0 0 20 20"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="5"
                          fill="none"
                          stroke="rgba(0, 0, 0, 0.35)"
                          strokeWidth="10"
                          strokeDasharray="31.42"
                          strokeDashoffset={getEtherealSpeedDashOffset()}
                        />
                        {(() => {
                          const coords = getRadialLineCoords(etherealSpeedEndTime);
                          return coords ? (
                            <line
                              x1="10"
                              y1="10"
                              x2={coords.x2}
                              y2={coords.y2}
                              stroke="#ffffff"
                              strokeWidth="0.8"
                            />
                          ) : null;
                        })()}
                      </svg>
                    </div>
                  )}
                  {selectedFighterId === 'monk' && innerFireActive && (
                    <div
                      className={innerFireFading ? 'effect-icon-fading' : 'effect-icon-active'}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: etherealSpeedActive ? '16px' : '-6px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#111',
                        border: '2px solid #ff5400',
                        backgroundImage: `url(${monk_inner_fire})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        zIndex: 15,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        overflow: 'hidden'
                      }}
                    >
                      <svg 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          transform: 'rotate(-90deg)',
                          pointerEvents: 'none'
                        }}
                        viewBox="0 0 20 20"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="5"
                          fill="none"
                          stroke="rgba(0, 0, 0, 0.35)"
                          strokeWidth="10"
                          strokeDasharray="31.42"
                          strokeDashoffset={getInnerFireDashOffset()}
                        />
                        {(() => {
                          const coords = getRadialLineCoords(innerFireEndTime);
                          return coords ? (
                            <line
                              x1="10"
                              y1="10"
                              x2={coords.x2}
                              y2={coords.y2}
                              stroke="#ffffff"
                              strokeWidth="0.8"
                            />
                          ) : null;
                        })()}
                      </svg>
                    </div>
                  )}
                  {selectedFighterId === 'sage' && copActive && (
                    <div
                      className={copFading ? 'effect-icon-fading' : 'effect-icon-active'}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#111',
                        border: '2px solid #00bfff',
                        backgroundImage: `url(${shielded})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        zIndex: 15,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        overflow: 'hidden'
                      }}
                    >
                      <svg 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          transform: 'rotate(-90deg)',
                          pointerEvents: 'none'
                        }}
                        viewBox="0 0 20 20"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="5"
                          fill="none"
                          stroke="rgba(0, 0, 0, 0.35)"
                          strokeWidth="10"
                          strokeDasharray="31.42"
                          strokeDashoffset={getCopDashOffset()}
                        />
                        {(() => {
                          const coords = getRadialLineCoords(copEndTime);
                          return coords ? (
                            <line
                              x1="10"
                              y1="10"
                              x2={coords.x2}
                              y2={coords.y2}
                              stroke="#ffffff"
                              strokeWidth="0.8"
                            />
                          ) : null;
                        })()}
                      </svg>
                    </div>
                  )}
                  {selectedFighterId === 'soldier' && defensiveStanceActive && (
                    <div
                      className={defensiveStanceFading ? 'effect-icon-fading' : 'effect-icon-active'}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#111',
                        border: '2px solid #3b82f6',
                        backgroundImage: `url(${soldier_defense_stance_mini_icon})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        zIndex: 15,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        overflow: 'hidden'
                      }}
                    >
                      <svg 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          transform: 'rotate(-90deg)',
                          pointerEvents: 'none'
                        }}
                        viewBox="0 0 20 20"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="5"
                          fill="none"
                          stroke="rgba(0, 0, 0, 0.35)"
                          strokeWidth="10"
                          strokeDasharray="31.42"
                          strokeDashoffset={getDefensiveStanceDashOffset()}
                        />
                        {(() => {
                          const coords = getRadialLineCoords(defensiveStanceEndTime);
                          return coords ? (
                            <line
                              x1="10"
                              y1="10"
                              x2={coords.x2}
                              y2={coords.y2}
                              stroke="#ffffff"
                              strokeWidth="0.8"
                            />
                          ) : null;
                        })()}
                      </svg>
                    </div>
                  )}
                  {selectedFighterId === 'barbarian' && berserkerActive && (
                    <div
                      className={berserkerFading ? 'effect-icon-fading' : 'effect-icon-active'}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#111',
                        border: '2px solid #ff3333',
                        backgroundImage: `url(${barbarian_berserker})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        zIndex: 15,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        overflow: 'hidden'
                      }}
                    >
                      <svg 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          transform: 'rotate(-90deg)',
                          pointerEvents: 'none'
                        }}
                        viewBox="0 0 20 20"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="5"
                          fill="none"
                          stroke="rgba(0, 0, 0, 0.35)"
                          strokeWidth="10"
                          strokeDasharray="31.42"
                          strokeDashoffset={getBerserkerDashOffset()}
                        />
                        {(() => {
                          const coords = getRadialLineCoords(berserkerEndTime);
                          return coords ? (
                            <line
                              x1="10"
                              y1="10"
                              x2={coords.x2}
                              y2={coords.y2}
                              stroke="#ffffff"
                              strokeWidth="0.8"
                            />
                          ) : null;
                        })()}
                      </svg>
                    </div>
                  )}
                  {selectedFighterId === 'ranger' && notchedArrow && (
                    <div style={{
                      position: 'absolute',
                      top: '-6px',
                      left: '-6px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#111',
                      border: '2px solid #ffb703',
                      backgroundImage: `url(${
                        notchedArrow === 'ice' ? ranger_ice_arrow :
                        notchedArrow === 'force' ? ranger_force_arrow :
                        notchedArrow === 'poison' ? ranger_poison_arrow :
                        ranger_celestial_arrow
                      })`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      zIndex: 15,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                      animation: 'scaleUp 0.2s ease-out'
                    }} />
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
                  transform: targetPushback ? targetPushback : 'none',
                  transition: 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), left 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}
              >
                <div style={{
                  width: '80%',
                  height: '80%',
                  borderRadius: '8px',
                  border: (innerFireActive && targetFlash)
                    ? '3px solid #ff5400'
                    : targetFlash
                      ? '3px solid #ff4d4d'
                      : '2px solid #ff5400',
                  backgroundColor: (innerFireActive && targetFlash)
                    ? '#cc4400'
                    : targetFlash
                      ? '#990000'
                      : '#222',
                  backgroundImage: `url(${targetPortrait})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: targetFrozen ? 'brightness(0.85) saturate(0.6)' : targetAsleep ? 'brightness(0.65) saturate(0.4) contrast(0.9)' : 'none',
                  boxShadow: (innerFireActive && targetFlash)
                    ? '0 0 24px 8px rgba(255, 84, 0, 0.95), inset 0 0 12px rgba(255, 84, 0, 0.8)'
                    : '0 8px 16px rgba(0,0,0,0.5)',
                  position: 'relative',
                  transform: targetShake ? 'translate(5px, 2px) rotate(2deg)' : 'none',
                  transition: 'transform 0.05s',
                  animation: targetDisintegrating
                    ? 'disintegrateShake 2.2s linear forwards'
                    : targetStunned
                      ? 'stunWobble 0.6s ease-in-out infinite'
                      : 'none'
                }}>
                  {targetStunned && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '60px',
                      height: '20px',
                      pointerEvents: 'none',
                      zIndex: 35,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {/* Tilted Ellipse Ring */}
                      <div style={{
                        position: 'absolute',
                        width: '50px',
                        height: '12px',
                        borderRadius: '50%',
                        border: '1.2px dashed rgba(255, 221, 87, 0.45)',
                        boxShadow: '0 0 4px rgba(255, 221, 87, 0.15)',
                        pointerEvents: 'none'
                      }} />
                      {/* Orbiting Star 1 */}
                      <div style={{
                        position: 'absolute',
                        fontSize: '12px',
                        color: '#ffe600',
                        textShadow: '0 0 5px #ffe600',
                        animation: 'birdieOrbit1 1.6s linear infinite',
                        fontWeight: 'bold',
                        userSelect: 'none'
                      }}>
                        ✦
                      </div>
                      {/* Orbiting Star 2 */}
                      <div style={{
                        position: 'absolute',
                        fontSize: '12px',
                        color: '#ffdd57',
                        textShadow: '0 0 5px #ffdd57',
                        animation: 'birdieOrbit2 1.6s linear infinite',
                        fontWeight: 'bold',
                        userSelect: 'none'
                      }}>
                        ✦
                      </div>
                    </div>
                  )}
                  {targetConfused && (
                    <div style={{
                      position: 'absolute',
                      top: '-15px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '60px',
                      height: '20px',
                      pointerEvents: 'none',
                      zIndex: 30,
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '4px'
                    }}>
                      {/* Swirling Star 1 */}
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#ffe600',
                        boxShadow: '0 0 8px #ffe600',
                        animation: 'dizzySpin 1.2s linear infinite'
                      }} />
                      {/* Swirling Star 2 */}
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#ffdd57',
                        boxShadow: '0 0 8px #ffdd57',
                        animation: 'dizzySpin 1.2s linear infinite 0.4s'
                      }} />
                      {/* Swirling Star 3 */}
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#ffb703',
                        boxShadow: '0 0 8px #ffb703',
                        animation: 'dizzySpin 1.2s linear infinite 0.8s'
                      }} />
                    </div>
                  )}
                  {targetAsleep && (
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, width: '100%', height: '100%',
                      pointerEvents: 'none',
                      zIndex: 20
                    }}>
                      <div style={{ position: 'absolute', right: '15%', top: '20%', color: '#90caf9', fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace', animation: 'zzzFloat 2s infinite', textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>Z</div>
                      <div style={{ position: 'absolute', right: '35%', top: '30%', color: '#90caf9', fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace', animation: 'zzzFloat 2s infinite 0.6s', textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>Z</div>
                      <div style={{ position: 'absolute', right: '22%', top: '42%', color: '#42a5f5', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace', animation: 'zzzFloat 2s infinite 1.2s', textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>Z</div>
                    </div>
                  )}
                  {/* Status Effect Icons Container */}
                  <div style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    display: 'flex',
                    flexDirection: 'row-reverse',
                    gap: '2px',
                    zIndex: 15
                  }}>
                    {targetBleeding && (
                      <div
                        className="effect-icon-active"
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#111',
                          border: '2px solid #ff3333',
                          backgroundImage: `url(${bleeding})`,
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                          overflow: 'hidden'
                        }}
                      />
                    )}
                    {targetPoisoned && (
                      <div
                        className="effect-icon-active"
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#111',
                          border: '2px solid #38b000',
                          backgroundImage: `url(${poison})`,
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                          overflow: 'hidden',
                          position: 'relative'
                        }}
                      >
                        <svg
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            transform: 'rotate(-90deg)',
                            pointerEvents: 'none'
                          }}
                          viewBox="0 0 20 20"
                        >
                          <circle
                            cx="10"
                            cy="10"
                            r="5"
                            fill="none"
                            stroke="rgba(0, 0, 0, 0.4)"
                            strokeWidth="10"
                            strokeDasharray="31.42"
                            strokeDashoffset={getPoisonDashOffset()}
                          />
                          {(() => {
                            const coords = getRadialLineCoords(poisonEndTime, 8000);
                            return coords ? (
                              <line
                                x1="10"
                                y1="10"
                                x2={coords.x2}
                                y2={coords.y2}
                                stroke="#ffffff"
                                strokeWidth="0.8"
                              />
                            ) : null;
                          })()}
                        </svg>
                      </div>
                    )}
                    {frozenIconActive && (
                      <div
                        className="effect-icon-active"
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#111',
                          border: '2px solid #00bfff',
                          backgroundImage: `url(${frozen})`,
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                          overflow: 'hidden',
                          position: 'relative'
                        }}
                      >
                        <svg
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            transform: 'rotate(-90deg)',
                            pointerEvents: 'none'
                          }}
                          viewBox="0 0 20 20"
                        >
                          <circle
                            cx="10"
                            cy="10"
                            r="5"
                            fill="none"
                            stroke="rgba(0, 0, 0, 0.45)"
                            strokeWidth="10"
                            strokeDasharray="31.42"
                            strokeDashoffset={getFrozenDashOffset()}
                          />
                          {(() => {
                            const coords = getRadialLineCoords(frozenEndTime, 3000);
                            return coords ? (
                              <line
                                x1="10"
                                y1="10"
                                x2={coords.x2}
                                y2={coords.y2}
                                stroke="#ffffff"
                                strokeWidth="0.8"
                              />
                            ) : null;
                          })()}
                        </svg>
                      </div>
                    )}
                    {sleepIconActive && (
                      <div
                        className="effect-icon-active"
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#111',
                          border: '2px solid #90caf9',
                          backgroundImage: `url(${wizard_sleep})`,
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                          overflow: 'hidden',
                          position: 'relative'
                        }}
                      >
                        <svg
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            transform: 'rotate(-90deg)',
                            pointerEvents: 'none'
                          }}
                          viewBox="0 0 20 20"
                        >
                          <circle
                            cx="10"
                            cy="10"
                            r="5"
                            fill="none"
                            stroke="rgba(0, 0, 0, 0.45)"
                            strokeWidth="10"
                            strokeDasharray="31.42"
                            strokeDashoffset={getSleepDashOffset()}
                          />
                          {(() => {
                            const coords = getRadialLineCoords(sleepEndTime, 8000);
                            return coords ? (
                              <line
                                x1="10"
                                y1="10"
                                x2={coords.x2}
                                y2={coords.y2}
                                stroke="#ffffff"
                                strokeWidth="0.8"
                              />
                            ) : null;
                          })()}
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Mark Effect Icon with Timer Ring */}
                  {targetMarked && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        left: '-6px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#111',
                        border: '2px solid #ff5400',
                        backgroundImage: `url(${ranger_mark})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        zIndex: 15,
                        boxShadow: '0 0 6px rgba(255, 84, 0, 0.7)',
                        overflow: 'hidden'
                      }}
                    >
                      <svg
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          transform: 'rotate(-90deg)',
                          pointerEvents: 'none'
                        }}
                        viewBox="0 0 20 20"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="5"
                          fill="none"
                          stroke="rgba(0, 0, 0, 0.4)"
                          strokeWidth="10"
                          strokeDasharray="31.42"
                          strokeDashoffset={getMarkDashOffset()}
                        />
                        {(() => {
                          const coords = getRadialLineCoords(markEndTime, 8000);
                          return coords ? (
                            <line
                              x1="10"
                              y1="10"
                              x2={coords.x2}
                              y2={coords.y2}
                              stroke="#ffffff"
                              strokeWidth="0.8"
                            />
                          ) : null;
                        })()}
                      </svg>
                    </div>
                  )}
                  {/* Ensnare Effect Icon with Timer Ring */}
                  {targetEnsnared && (
                    <div
                      className={targetEnsnaredFading ? 'effect-icon-fading' : 'effect-icon-active'}
                      style={{
                        position: 'absolute',
                        top: '14px',
                        left: '-6px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#111',
                        border: '2px solid #8bc34a',
                        backgroundImage: `url(${ranger_ensnare})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        zIndex: 15,
                        boxShadow: '0 0 6px rgba(139, 195, 74, 0.7)',
                        overflow: 'hidden'
                      }}
                    >
                      <svg
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          transform: 'rotate(-90deg)',
                          pointerEvents: 'none'
                        }}
                        viewBox="0 0 20 20"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="5"
                          fill="none"
                          stroke="rgba(0, 0, 0, 0.4)"
                          strokeWidth="10"
                          strokeDasharray="31.42"
                          strokeDashoffset={getEnsnareDashOffset()}
                        />
                        {(() => {
                          const coords = getRadialLineCoords(ensnareEndTime, 3000);
                          return coords ? (
                            <line
                              x1="10"
                              y1="10"
                              x2={coords.x2}
                              y2={coords.y2}
                              stroke="#ffffff"
                              strokeWidth="0.8"
                            />
                          ) : null;
                        })()}
                      </svg>
                    </div>
                  )}
                  {/* Shielded Overlay for target (Soldier when under Sage protection) */}
                  {selectedFighterId === 'sage' && copActive && (
                    <div
                      className={copFading ? 'effect-icon-fading' : 'effect-icon-active'}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#111',
                        border: '2px solid #00bfff',
                        backgroundImage: `url(${shielded_partial})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        zIndex: 15,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        overflow: 'hidden'
                      }}
                    >
                      <svg 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          transform: 'rotate(-90deg)',
                          pointerEvents: 'none'
                        }}
                        viewBox="0 0 20 20"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="5"
                          fill="none"
                          stroke="rgba(0, 0, 0, 0.35)"
                          strokeWidth="10"
                          strokeDasharray="31.42"
                          strokeDashoffset={getCopDashOffset()}
                        />
                        {(() => {
                          const coords = getRadialLineCoords(copEndTime);
                          return coords ? (
                            <line
                              x1="10"
                              y1="10"
                              x2={coords.x2}
                              y2={coords.y2}
                              stroke="#ffffff"
                              strokeWidth="0.8"
                            />
                          ) : null;
                        })()}
                      </svg>
                    </div>
                  )}
                  {/* Light Green Overlay/Glow for Healing */}
                  {selectedFighterId === 'sage' && (
                    <div style={{
                      boxSizing: 'border-box',
                      position: 'absolute',
                      top: 0, left: 0, width: '100%', height: '100%',
                      background: 'rgba(46, 196, 182, 0.15)',
                      border: '3px solid #2ec4b6',
                      borderRadius: '6px',
                      boxShadow: '0 0 25px rgba(46, 196, 182, 0.8), inset 0 0 15px rgba(46, 196, 182, 0.5)',
                      opacity: targetHealGlow ? 1 : 0,
                      transition: 'opacity 0.3s ease-in-out',
                      pointerEvents: 'none',
                      zIndex: 14
                    }} />
                  )}
                  {/* Frozen Overlay */}
                  {targetFrozen && (
                    <div style={{
                      boxSizing: 'border-box',
                      position: 'absolute',
                      top: 0, left: 0, width: '100%', height: '100%',
                      background: 'linear-gradient(135deg, rgba(0, 191, 255, 0.35), rgba(100, 200, 255, 0.2))',
                      border: '2px solid rgba(0, 191, 255, 0.8)',
                      borderRadius: '6px',
                      pointerEvents: 'none',
                      boxShadow: 'inset 0 0 15px rgba(0, 191, 255, 0.3)'
                    }}></div>
                  )}
                  {/* Poison Overlay (pulsing green glow) */}
                  {targetPoisoned && (
                    <div style={{
                      boxSizing: 'border-box',
                      position: 'absolute',
                      top: 0, left: 0, width: '100%', height: '100%',
                      borderRadius: '6px',
                      pointerEvents: 'none',
                      zIndex: 14,
                      animation: 'poisonPulseGlow 1.5s ease-in-out infinite alternate',
                      border: '2px solid rgba(56, 176, 0, 0.6)'
                    }} />
                  )}
                  {/* Dripping Acid Drops */}
                  {targetPoisoned && (
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, width: '100%', height: '100%',
                      pointerEvents: 'none',
                      zIndex: 15,
                      overflow: 'hidden',
                      borderRadius: '6px'
                    }}>
                      <img
                        src={acid_drop}
                        alt="drip 1"
                        style={{
                          position: 'absolute',
                          left: '20%',
                          width: '10px',
                          height: '15px',
                          animation: 'acidDrip 2s linear infinite'
                        }}
                      />
                      <img
                        src={acid_drop}
                        alt="drip 2"
                        style={{
                          position: 'absolute',
                          left: '70%',
                          width: '8px',
                          height: '12px',
                          animation: 'acidDrip 2.4s linear infinite 0.7s'
                        }}
                      />
                      <img
                        src={acid_drop}
                        alt="drip 3"
                        style={{
                          position: 'absolute',
                          left: '45%',
                          width: '12px',
                          height: '18px',
                          animation: 'acidDrip 1.7s linear infinite 1.3s'
                        }}
                      />
                    </div>
                  )}
                  {/* Lightning Jagged Overlay */}
                  {lightningJagged && (
                    <div style={{
                      boxSizing: 'border-box',
                      position: 'absolute',
                      top: 0, left: 0, width: '100%', height: '100%',
                      pointerEvents: 'none',
                      zIndex: 14,
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}>
                      <svg
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          filter: 'drop-shadow(0 0 4px #00ffff) drop-shadow(0 0 8px #ffffff)'
                        }}
                        viewBox="0 0 100 100"
                      >
                        <polyline
                          points="30,0 20,40 50,35 25,75 45,70 15,100"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            animation: 'lightningFlash 0.15s ease-in-out infinite'
                          }}
                        />
                        <polyline
                          points="75,0 85,35 60,30 80,65 55,60 70,100"
                          fill="none"
                          stroke="#00ffff"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            animation: 'lightningFlash 0.15s ease-in-out infinite 0.05s'
                          }}
                        />
                        <polyline
                          points="50,10 40,45 65,40 45,75 55,70 35,90"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            animation: 'lightningFlash 0.15s ease-in-out infinite 0.1s'
                          }}
                        />
                      </svg>
                      <div style={{
                        position: 'absolute',
                        top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: 'rgba(0, 255, 255, 0.25)',
                        animation: 'lightningBgFlash 0.12s ease-in-out infinite'
                      }} />
                    </div>
                  )}
                  {/* Mark Overlay */}
                  {targetMarked && (
                    <div style={{
                      position: 'absolute',
                      top: '-12.5%',
                      left: '-12.5%',
                      width: '125%',
                      height: '125%',
                      backgroundImage: `url(${ranger_mark})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      zIndex: 12,
                      animation: 'pulse 1.5s infinite ease-in-out',
                      opacity: 0.75
                    }}></div>
                  )}
                  {/* Ensnare Visual Overlay – root/vine paralysis effect */}
                  {targetEnsnared && (
                    <div
                      className={targetEnsnaredFading ? 'effect-icon-fading' : 'effect-icon-active'}
                      style={{
                        boxSizing: 'border-box',
                        position: 'absolute',
                        top: 0, left: 0, width: '100%', height: '100%',
                        border: '3px solid #8bc34a',
                        borderRadius: '6px',
                        boxShadow: '0 0 18px rgba(139, 195, 74, 0.9), inset 0 0 10px rgba(139, 195, 74, 0.4)',
                        pointerEvents: 'none',
                        zIndex: 13
                      }}
                    >
                      {/* Root vine corners */}
                      {[
                        { left: 0, top: 0, borderRadius: '0 0 100% 0' },
                        { right: 0, top: 0, borderRadius: '0 0 0 100%' },
                        { left: 0, bottom: 0, borderRadius: '0 100% 0 0' },
                        { right: 0, bottom: 0, borderRadius: '100% 0 0 0' }
                      ].map((pos, i) => (
                        <div key={i} style={{
                          position: 'absolute',
                          ...pos,
                          width: '18px', height: '18px',
                          border: '3.5px solid #558b2f',
                          boxShadow: '0 0 8px rgba(85,139,47,0.8)',
                          animation: `ensnarePulse 0.8s ease-in-out infinite ${i * 0.2}s`,
                          boxSizing: 'border-box'
                        }} />
                      ))}
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

              {/* --- Extra Goblins (col 4, row 1 & col 4, row 3) for Wizard --- */}
              {selectedFighterId === 'wizard' && (
                <>
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
                      zIndex: 9,
                      pointerEvents: 'none'
                    }}
                  >
                    <div style={{
                      width: '80%',
                      height: '80%',
                      borderRadius: '8px',
                      border: extraGoblin1Flash ? '3px solid #ff4d4d' : '2px solid #ff5400',
                      backgroundColor: extraGoblin1Flash ? '#990000' : '#222',
                      backgroundImage: `url(${targetPortrait})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                      position: 'relative',
                      transform: extraGoblin1Shake ? 'translate(5px, 2px) rotate(2deg)' : 'none',
                      transition: 'transform 0.05s'
                    }}>
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

                  <div
                    style={{
                      position: 'absolute',
                      width: '20%',
                      height: '20%',
                      left: `${4 * 20}%`,
                      top: `${3 * 20}%`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 9,
                      pointerEvents: 'none'
                    }}
                  >
                    <div style={{
                      width: '80%',
                      height: '80%',
                      borderRadius: '8px',
                      border: extraGoblin2Flash ? '3px solid #ff4d4d' : '2px solid #ff5400',
                      backgroundColor: extraGoblin2Flash ? '#990000' : '#222',
                      backgroundImage: `url(${targetPortrait})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                      position: 'relative',
                      transform: extraGoblin2Shake ? 'translate(5px, 2px) rotate(2deg)' : 'none',
                      transition: 'transform 0.05s'
                    }}>
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
                </>
              )}

              {/* --- Healing Hands Icon Overlay --- */}
              {healIcon && (
                <div
                  style={{
                    position: 'absolute',
                    left: `calc(${healIcon.col * 20}% + 10%)`,
                    top: `calc(${healIcon.row * 20}% + 10%)`,
                    width: '20%',
                    height: '20%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 25,
                    pointerEvents: 'none',
                    opacity: healIcon.active ? 1 : 0,
                    transform: `translate(-50%, -50%) scale(${healIcon.active ? 1.25 : 0.8})`,
                    transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
                  }}
                >
                  <img
                    src={healing_hands}
                    alt="healing hands"
                    style={{
                      width: '45px',
                      height: '45px',
                      filter: 'drop-shadow(0 0 8px #2ec4b6) drop-shadow(0 0 15px rgba(46, 196, 182, 0.6))',
                    }}
                  />
                </div>
              )}

              {/* --- Projectile Overlay --- */}
              {projectile && (
                projectile.isRangerArrow ? (
                  <div
                    style={{
                      position: 'absolute',
                      left: `calc(${projectile.x}% + 10% - 40px)`,
                      top: `calc(${projectile.y}% + 10% - 4px)`,
                      transform: `rotate(${getProjectileAngle()}deg)`,
                      zIndex: 30,
                      transition: 'left 0.4s linear, top 0.4s linear',
                      pointerEvents: 'none',
                      width: '80px',
                      height: '8px',
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      {/* Arrow head */}
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 0,
                        height: 0,
                        borderTop: '4px solid transparent',
                        borderBottom: '4px solid transparent',
                        borderLeft: `8px solid ${arrowTypeColors[projectile.arrowType] || '#ff9f1c'}`,
                        filter: `drop-shadow(0 0 4px ${arrowTypeColors[projectile.arrowType] || '#ff9f1c'})`
                      }} />
                      {/* Arrow shaft - tapered tail */}
                      <div style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '72px',
                        height: '6px',
                        background: `linear-gradient(to left, ${arrowTypeColors[projectile.arrowType] || '#ff9f1c'}, transparent)`,
                        clipPath: 'polygon(0% 50%, 100% 10%, 100% 90%)',
                        boxShadow: `0 0 6px ${arrowTypeColors[projectile.arrowType] || '#ff9f1c'}40`
                      }} />
                      {/* Poison droplets */}
                      {projectile.arrowType === 'poison' && (
                        <>
                          <div style={{ position: 'absolute', left: '5px', top: '-4px', width: '4px', height: '4px', borderRadius: '50%', background: '#38b000', opacity: 0.8, animation: 'poisonDrop 0.35s ease-out infinite', boxShadow: '0 0 4px #38b000' }} />
                          <div style={{ position: 'absolute', left: '15px', top: '8px', width: '3px', height: '3px', borderRadius: '50%', background: '#4ade80', opacity: 0.7, animation: 'poisonDrop 0.35s ease-out 0.12s infinite', boxShadow: '0 0 3px #4ade80' }} />
                          <div style={{ position: 'absolute', left: '10px', top: '-6px', width: '3px', height: '3px', borderRadius: '50%', background: '#22c55e', opacity: 0.6, animation: 'poisonDrop 0.35s ease-out 0.24s infinite', boxShadow: '0 0 3px #22c55e' }} />
                        </>
                      )}
                    </div>
                  </div>
                ) : projectile.isFireball ? (
                  <div
                    style={{
                      position: 'absolute',
                      width: '32px',
                      height: '32px',
                      left: `calc(${projectile.x}% + 10% - 16px)`,
                      top: `calc(${projectile.y}% + 10% - 16px)`,
                      background: 'radial-gradient(circle, #ffffff 10%, #ffd36b 30%, #ff5a1f 65%, rgba(217, 35, 15, 0) 100%)',
                      borderRadius: '50%',
                      boxShadow: '0 0 15px #ff5a1f, 0 0 25px #ff9d2b, 0 0 35px #d9230f',
                      zIndex: 30,
                      transition: 'left 0.4s linear, top 0.4s linear',
                      animation: 'fireballFlicker 0.15s ease-in-out infinite alternate',
                    }}
                  />
                ) : projectile.isAcidBlast ? (
                  <div
                    style={{
                      position: 'absolute',
                      left: `calc(${projectile.x}% + 10% - 20px)`,
                      top: `calc(${projectile.y}% + 10% - 20px)`,
                      width: '40px',
                      height: '40px',
                      zIndex: 30,
                      transition: 'left 0.4s linear, top 0.4s linear',
                      transform: `rotate(${getProjectileAngle()}deg)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none'
                    }}
                  >
                    <div style={{
                      position: 'relative',
                      width: '40px',
                      height: '36px',
                      filter: 'drop-shadow(0 0 6px #39ff14) drop-shadow(0 0 12px #38b000)'
                    }}>
                      <div style={{ position: 'absolute', right: '2px', top: '13px', width: '10px', height: '10px', borderRadius: '50%', background: 'radial-gradient(circle, #adff2f 10%, #39ff14 80%)', opacity: 0.95 }} />
                      <div style={{ position: 'absolute', right: '10px', top: '8px', width: '12px', height: '12px', borderRadius: '50%', background: 'radial-gradient(circle, #39ff14 20%, #38b000 80%)', opacity: 0.9 }} />
                      <div style={{ position: 'absolute', right: '10px', top: '18px', width: '11px', height: '11px', borderRadius: '50%', background: 'radial-gradient(circle, #39ff14 20%, #38b000 80%)', opacity: 0.9 }} />
                      <div style={{ position: 'absolute', left: '2px', top: '2px', width: '13px', height: '13px', borderRadius: '50%', background: 'radial-gradient(circle, #39ff14 20%, #38b000 80%)', opacity: 0.85 }} />
                      <div style={{ position: 'absolute', left: '2px', top: '21px', width: '14px', height: '14px', borderRadius: '50%', background: 'radial-gradient(circle, #39ff14 20%, #38b000 80%)', opacity: 0.85 }} />
                      <div style={{ position: 'absolute', left: '6px', top: '11px', width: '15px', height: '15px', borderRadius: '50%', background: 'radial-gradient(circle, #adff2f 10%, #38b000 80%)', opacity: 0.95 }} />
                      <div style={{ position: 'absolute', left: '16px', top: '5px', width: '11px', height: '11px', borderRadius: '50%', background: 'radial-gradient(circle, #39ff14 20%, #38b000 80%)', opacity: 0.85 }} />
                      <div style={{ position: 'absolute', left: '16px', top: '20px', width: '12px', height: '12px', borderRadius: '50%', background: 'radial-gradient(circle, #39ff14 20%, #38b000 80%)', opacity: 0.85 }} />
                      <div style={{ position: 'absolute', left: '0px', top: '16px', width: '6px', height: '6px', borderRadius: '50%', background: '#adff2f', opacity: 0.8 }} />
                      <div style={{ position: 'absolute', left: '10px', top: '3px', width: '5px', height: '5px', borderRadius: '50%', background: '#adff2f', opacity: 0.8 }} />
                    </div>
                  </div>
                ) : projectile.isIceBlast ? (
                  <div
                    style={{
                      position: 'absolute',
                      width: '28px',
                      height: '28px',
                      left: `calc(${projectile.x}% + 10% - 14px)`,
                      top: `calc(${projectile.y}% + 10% - 14px)`,
                      background: 'radial-gradient(circle, #ffffff 20%, #e0f7fa 40%, #00bfff 75%, rgba(0, 191, 255, 0) 100%)',
                      borderRadius: '50%',
                      boxShadow: '0 0 12px #00bfff, 0 0 20px #e0f7fa, inset 0 0 8px #ffffff',
                      zIndex: 30,
                      transition: 'left 0.4s linear, top 0.4s linear',
                      animation: 'iceFlicker 0.2s ease-in-out infinite alternate',
                    }}
                  >
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: '#ffffff',
                      transform: 'rotate(45deg)',
                      position: 'absolute',
                      left: '10px',
                      top: '10px',
                      boxShadow: '0 0 6px #ffffff',
                      animation: 'iceSpin 1s linear infinite'
                    }} />
                  </div>
                ) : (
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
                )
              )}

              {/* --- Multi-projectiles (Wizard missiles / Ranger execute arrows) --- */}
              {projectiles.map(p => (
                p.isRangerArrow ? (
                  <div
                    key={p.id}
                    style={{
                      position: 'absolute',
                      left: `calc(${p.x}% + 10% - 30px)`,
                      top: `calc(${p.y}% + 10% - 3px)`,
                      transform: `rotate(${getProjectileAngle()}deg)`,
                      zIndex: 30,
                      transition: 'left 0.4s linear, top 0.4s linear',
                      pointerEvents: 'none',
                      width: '60px',
                      height: '6px',
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <div style={{
                        position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                        width: 0, height: 0,
                        borderTop: '3px solid transparent', borderBottom: '3px solid transparent',
                        borderLeft: `6px solid ${arrowTypeColors[p.arrowType] || '#ff9f1c'}`,
                        filter: `drop-shadow(0 0 3px ${arrowTypeColors[p.arrowType] || '#ff9f1c'})`
                      }} />
                      <div style={{
                        position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                        width: '54px', height: '4px',
                        background: `linear-gradient(to left, ${arrowTypeColors[p.arrowType] || '#ff9f1c'}, transparent)`,
                        clipPath: 'polygon(0% 50%, 100% 10%, 100% 90%)',
                        boxShadow: `0 0 4px ${arrowTypeColors[p.arrowType] || '#ff9f1c'}40`
                      }} />
                      {p.arrowType === 'poison' && (
                        <>
                          <div style={{ position: 'absolute', left: '3px', top: '-3px', width: '3px', height: '3px', borderRadius: '50%', background: '#38b000', opacity: 0.7, animation: 'poisonDrop 0.3s ease-out infinite', boxShadow: '0 0 3px #38b000' }} />
                          <div style={{ position: 'absolute', left: '10px', top: '6px', width: '2px', height: '2px', borderRadius: '50%', background: '#4ade80', opacity: 0.6, animation: 'poisonDrop 0.3s ease-out 0.1s infinite' }} />
                        </>
                      )}
                    </div>
                  </div>
                ) : p.isMagicMissile ? (
                  <div
                    key={p.id}
                    style={{
                      position: 'absolute',
                      width: '18px',
                      height: '18px',
                      left: `calc(${p.x}% + 10% - 9px)`,
                      top: `calc(${p.y}% + 10% - 9px)`,
                      background: 'radial-gradient(circle, #ffffff 15%, #d946ef 45%, #701a75 80%)',
                      borderRadius: '50%',
                      border: '2px solid #ffffff',
                      boxShadow: '0 0 10px #d946ef, 0 0 20px #701a75, inset 0 0 4px #ffffff',
                      zIndex: 30,
                      transition: 'left 0.4s linear, top 0.4s linear',
                      animation: 'missileGlow 0.15s ease-in-out infinite alternate',
                    }}
                  />
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
                      transition: 'left 0.4s linear, top 0.4s linear'
                    }}
                  />
                )
              ))}

              {/* --- Special Beams / Overlays (like Smite, Lightning) --- */}
              {activeBeam && activeBeam !== 'annihilation' && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${targetPos.col * 20 + 10}%`,
                    width: activeBeam === 'disintegrate'
                      ? '8px'
                      : '12px',
                    background: activeBeam === 'smite'
                      ? 'linear-gradient(to bottom, #fff, #ffe600)'
                      : activeBeam === 'lightning'
                        ? 'linear-gradient(to bottom, #ffffff 15%, #00bfff 85%)'
                        : 'linear-gradient(to right, #ff1a1a, #ffffff 40%, #ffffff 60%, #ff1a1a)',
                    top: 0,
                    height: `${targetPos.row * 20 + 10}%`,
                    transform: 'translateX(-50%)',
                    boxShadow: activeBeam === 'smite'
                      ? '0 0 20px #ffe600, 0 0 40px #ffe600'
                      : activeBeam === 'lightning'
                        ? '0 0 10px #ffffff, 0 0 25px #00bfff, 0 0 45px #00bfff'
                        : 'none',
                    zIndex: 25,
                    animation: activeBeam === 'disintegrate'
                      ? 'disintegrateBeam 2.2s linear forwards'
                      : 'beamShrink 0.35s ease-out forwards'
                  }}
                />
              )}

              {/* Centered wobbly ball tip for Disintegrate (centered directly at target tile coordinates) */}
              {activeBeam === 'disintegrate' && (
                <div style={{
                  position: 'absolute',
                  left: `${targetPos.col * 20 + 10}%`,
                  top: `${targetPos.row * 20 + 10}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '45px',
                  height: '45px',
                  zIndex: 26,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle, #ffffff 20%, #ff1a1a 60%, rgba(255, 26, 26, 0) 100%)',
                    borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                    animation: 'organicGlow 1.5s linear infinite',
                    boxShadow: '0 0 15px #ff1a1a, 0 0 30px #ff1a1a',
                    opacity: 0.95
                  }} />
                </div>
              )}

              {/* --- Annihilation Horizontal Beam --- */}
              {activeBeam === 'annihilation' && (() => {
                const dx = (targetPos.col - fighterPos.col) * 20;
                const dy_start = (targetPos.row + 1) * 20 - (fighterPos.row * 20 + 10);
                const dy_end = targetPos.row * 20 - (fighterPos.row * 20 + 10);
                
                const length_start = Math.sqrt(dx * dx + dy_start * dy_start);
                const angle_start = Math.atan2(dy_start, dx) * (180 / Math.PI);
                
                const length_end = Math.sqrt(dx * dx + dy_end * dy_end);
                const angle_end = Math.atan2(dy_end, dx) * (180 / Math.PI);
                
                const length = annihilationSweepActive ? length_end : length_start;
                const angle = annihilationSweepActive ? angle_end : angle_start;
                
                return (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${fighterPos.col * 20 + 10}%`,
                      top: `${fighterPos.row * 20 + 10}%`,
                      width: `${length}%`,
                      height: '16px',
                      background: 'linear-gradient(to bottom, #7b2cbf, #ffffff 40%, #ffffff 60%, #7b2cbf)',
                      transform: `rotate(${angle}deg) translateY(-50%)`,
                      transformOrigin: 'left center',
                      boxShadow: '0 0 20px #ff007f, 0 0 40px #8e2de2, 0 0 60px #8e2de2',
                      zIndex: 25,
                      transition: annihilationSweepActive ? 'width 0.8s ease-in-out, transform 0.8s ease-in-out, opacity 0.2s' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      overflow: 'visible'
                    }}
                  >
                    {/* Fuzzy bubbling orb at the origin of the beam (left edge) to obscure sharp square lines */}
                    <div style={{
                      position: 'absolute',
                      left: '-20px',
                      top: '-12px',
                      width: '40px',
                      height: '40px',
                      background: 'radial-gradient(circle, #ffffff 20%, #7b2cbf 60%, rgba(123, 44, 191, 0) 100%)',
                      borderRadius: '60% 40% 50% 50% / 40% 50% 60% 50%',
                      animation: 'organicGlow 1.2s linear infinite',
                      boxShadow: '0 0 15px #ff007f, 0 0 25px #8e2de2'
                    }} />

                    {/* Undulating organic tip at the end of the beam touching the target */}
                    <div style={{
                      position: 'absolute',
                      right: '-20px',
                      top: '-12px',
                      width: '40px',
                      height: '40px',
                      background: 'radial-gradient(circle, #ffffff 20%, #8e2de2 60%, rgba(142, 45, 226, 0) 100%)',
                      borderRadius: '50% 50% 30% 70% / 60% 40% 60% 40%',
                      animation: 'organicGlow 1.2s linear infinite',
                      boxShadow: '0 0 15px #ff007f, 0 0 25px #8e2de2'
                    }} />
                  </div>
                );
              })()}

              {/* Fireball Expanding Explosion Ring */}
              {fireballExplosion && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${fireballExplosion.col * 20 + 10}%`,
                    top: `${fireballExplosion.row * 20 + 10}%`,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 35,
                    animation: 'fireRingExpand 0.7s cubic-bezier(0.1, 0.8, 0.3, 1) forwards'
                  }}
                />
              )}
              {annihilationExplosion && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${annihilationExplosion.col * 20 + 10}%`,
                    top: `${annihilationExplosion.row * 20 + 10}%`,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 35,
                    animation: 'annihilationRing 0.7s cubic-bezier(0.1, 0.8, 0.3, 1) forwards'
                  }}
                />
              )}
              {vortexActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${vortexActive.col * 20 + 10}%`,
                    top: `${vortexActive.row * 20 + 10}%`,
                    width: '60%',
                    height: '60%',
                    backgroundImage: `url(${wizard_vortex})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 35,
                    animation: 'vortexSpin 4s linear infinite',
                    opacity: 0.5,
                    maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 70%)',
                    WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 70%)',
                    filter: 'drop-shadow(0 0 12px #7b2cbf) drop-shadow(0 0 25px #8e2de2)'
                  }}
                />
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
                      width: '80px',
                      height: '80px',
                      position: 'relative',
                      animation: 'slashFade 0.3s ease-out forwards',
                      pointerEvents: 'none'
                    }}>
                      {/* Diagonal Slash Line 1 */}
                      <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#fff',
                        boxShadow: '0 0 10px #ffe600, 0 0 20px #ff5400',
                        borderRadius: '3px',
                        top: '50%',
                        left: 0,
                        transform: 'translateY(-50%) rotate(45deg)'
                      }} />
                      {/* Diagonal Slash Line 2 */}
                      <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#fff',
                        boxShadow: '0 0 10px #ffe600, 0 0 20px #ff5400',
                        borderRadius: '3px',
                        top: '50%',
                        left: 0,
                        transform: 'translateY(-50%) rotate(-45deg)'
                      }} />
                    </div>
                  )}
                  {hitEffect.type === 'weapon_slash' && (() => {
                    const activeWeaponId = equippedWeapons[selectedFighterId] || 'shortsword_sword';
                    const activeWeapon = WEAPONS_DB.swords.find(w => w.id === activeWeaponId) ||
                                         WEAPONS_DB.axes.find(w => w.id === activeWeaponId) ||
                                         WEAPONS_DB.swords[0];
                    const weaponIcon = activeWeapon.image;

                    const dx = fighterPos.col - targetPos.col;
                    const dy = fighterPos.row - targetPos.row;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    let adjCol = fighterPos.col;
                    let adjRow = fighterPos.row;
                    if (dist > 0) {
                      const colStep = Math.round(dx / dist);
                      const rowStep = Math.round(dy / dist);
                      adjCol = targetPos.col + colStep;
                      adjRow = targetPos.row + rowStep;
                    }
                    const swingDx = targetPos.col - adjCol;
                    const swingDy = targetPos.row - adjRow;
                    const baseAngle = Math.atan2(swingDy, swingDx) * (180 / Math.PI);
                    const adjDist = Math.sqrt(swingDx * swingDx + swingDy * swingDy);
                    const halfDistPx = (adjDist * 100) / 2;

                    // Calculate divide (midpoint) offset relative to Target (which is parent center 50%, 50%)
                    const leftOffset = (swingDx / 2) * -100;
                    const topOffset = (swingDy / 2) * -100;

                    return (
                      <div
                        style={{
                          position: 'absolute',
                          left: `calc(50% + ${leftOffset}px)`,
                          top: `calc(50% + ${topOffset}px)`,
                          width: '60px',
                          height: '60px',
                          transform: `translate(-50%, -50%) rotate(${baseAngle}deg)`,
                          pointerEvents: 'none',
                          zIndex: 5000,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={weaponIcon}
                          alt="weapon slash"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            transformOrigin: `${30 - halfDistPx}px 30px`,
                            animation: 'weaponSwingArc 0.75s ease-in-out forwards'
                          }}
                        />
                      </div>
                    );
                  })()}
                  {hitEffect.type === 'imbued_strike_effect' && (() => {
                    const activeWeaponId = equippedWeapons[selectedFighterId] || 'shortsword_sword';
                    const activeWeapon = WEAPONS_DB.swords.find(w => w.id === activeWeaponId) ||
                                         WEAPONS_DB.axes.find(w => w.id === activeWeaponId) ||
                                         WEAPONS_DB.swords[0];
                    const weaponIcon = activeWeapon.image;

                    const dx = fighterPos.col - targetPos.col;
                    const dy = fighterPos.row - targetPos.row;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    let adjCol = fighterPos.col;
                    let adjRow = fighterPos.row;
                    if (dist > 0) {
                      const colStep = Math.round(dx / dist);
                      const rowStep = Math.round(dy / dist);
                      adjCol = targetPos.col + colStep;
                      adjRow = targetPos.row + rowStep;
                    }
                    const swingDx = targetPos.col - adjCol;
                    const swingDy = targetPos.row - adjRow;
                    const baseAngle = Math.atan2(swingDy, swingDx) * (180 / Math.PI);
                    const adjDist = Math.sqrt(swingDx * swingDx + swingDy * swingDy);
                    const halfDistPx = (adjDist * 100) / 2;

                    const leftOffset = (swingDx / 2) * -100;
                    const topOffset = (swingDy / 2) * -100;

                    return (
                      <div
                        style={{
                          position: 'absolute',
                          left: `calc(50% + ${leftOffset}px)`,
                          top: `calc(50% + ${topOffset}px)`,
                          width: '60px',
                          height: '60px',
                          transform: `translate(-50%, -50%) rotate(${baseAngle}deg)`,
                          pointerEvents: 'none',
                          zIndex: 5000,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={weaponIcon}
                          alt="imbued strike weapon"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            transformOrigin: `${30 - halfDistPx}px 30px`,
                            animation: 'imbuedStrikeThrust 1.0s ease-in-out forwards',
                            filter: 'drop-shadow(0 0 6px rgba(0, 191, 255, 0.95)) drop-shadow(0 0 12px rgba(0, 191, 255, 0.6))'
                          }}
                        />
                      </div>
                    );
                  })()}
                  {hitEffect.type === 'barbarian_cleave_effect' && (() => {
                    const activeWeaponId = equippedWeapons['barbarian'] || 'woodcutters_axe';
                    const activeWeapon = WEAPONS_DB.axes.find(w => w.id === activeWeaponId) ||
                                         WEAPONS_DB.swords.find(w => w.id === activeWeaponId) ||
                                         WEAPONS_DB.axes[0];
                    const weaponIcon = activeWeapon.image;

                    const dx = fighterPos.col - targetPos.col;
                    const dy = fighterPos.row - targetPos.row;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    let adjCol = fighterPos.col;
                    let adjRow = fighterPos.row;
                    if (dist > 0) {
                      const colStep = Math.round(dx / dist);
                      const rowStep = Math.round(dy / dist);
                      adjCol = targetPos.col + colStep;
                      adjRow = targetPos.row + rowStep;
                    }
                    const swingDx = targetPos.col - adjCol;
                    const swingDy = targetPos.row - adjRow;
                    const baseAngle = Math.atan2(swingDy, swingDx) * (180 / Math.PI);
                    const adjDist = Math.sqrt(swingDx * swingDx + swingDy * swingDy);
                    const halfDistPx = (adjDist * 100) / 2;

                    const leftOffset = (swingDx / 2) * -100;
                    const topOffset = (swingDy / 2) * -100;

                    return (
                      <div
                        style={{
                          position: 'absolute',
                          left: `calc(50% + ${leftOffset}px)`,
                          top: `calc(50% + ${topOffset}px)`,
                          width: '60px',
                          height: '60px',
                          transform: `translate(-50%, -50%) rotate(${baseAngle}deg)`,
                          pointerEvents: 'none',
                          zIndex: 5000,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={weaponIcon}
                          alt="cleave weapon"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            transformOrigin: `${30 - halfDistPx}px 30px`,
                            animation: 'cleaveStuck 1.1s ease-in-out forwards'
                          }}
                        />
                      </div>
                    );
                  })()}
                  {hitEffect.type === 'shield_slam_connect' && (() => {
                    const dx = fighterPos.col - targetPos.col;
                    const dy = fighterPos.row - targetPos.row;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    let adjCol = fighterPos.col;
                    let adjRow = fighterPos.row;
                    if (dist > 0) {
                      const colStep = Math.round(dx / dist);
                      const rowStep = Math.round(dy / dist);
                      adjCol = targetPos.col + colStep;
                      adjRow = targetPos.row + rowStep;
                    }
                    const swingDx = targetPos.col - adjCol;
                    const swingDy = targetPos.row - adjRow;

                    // Calculate divide (midpoint) offset relative to Target (like healing hands)
                    const leftOffset = (swingDx / 2) * -100;
                    const topOffset = (swingDy / 2) * -100;

                    return (
                      <div
                        style={{
                          position: 'absolute',
                          left: `calc(50% + ${leftOffset}px)`,
                          top: `calc(50% + ${topOffset}px)`,
                          width: '56px',
                          height: '56px',
                          transform: 'translate(-50%, -50%)',
                          pointerEvents: 'none',
                          zIndex: 5000,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={shield_slam}
                          alt="shield slam connect"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            animation: 'scaleUp 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275) both'
                          }}
                        />
                      </div>
                    );
                  })()}
                  {hitEffect.type === 'monk_punch_effect' && (() => {
                    const dx = fighterPos.col - targetPos.col;
                    const dy = fighterPos.row - targetPos.row;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    let adjCol = fighterPos.col;
                    let adjRow = fighterPos.row;
                    if (dist > 0) {
                      const colStep = Math.round(dx / dist);
                      const rowStep = Math.round(dy / dist);
                      adjCol = targetPos.col + colStep;
                      adjRow = targetPos.row + rowStep;
                    }
                    const swingDx = targetPos.col - adjCol;
                    const swingDy = targetPos.row - adjRow;

                    // Calculate divide (midpoint) offset relative to Target
                    const leftOffset = (swingDx / 2) * -100;
                    const topOffset = (swingDy / 2) * -100;

                    return (
                      <div
                        style={{
                          position: 'absolute',
                          left: `calc(50% + ${leftOffset}px)`,
                          top: `calc(50% + ${topOffset}px)`,
                          width: '56px',
                          height: '56px',
                          transform: 'translate(-50%, -50%)',
                          pointerEvents: 'none',
                          zIndex: 5000,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={monk_punch}
                          alt="monk punch connect"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            animation: 'scaleUp 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275) both'
                          }}
                        />
                      </div>
                    );
                  })()}
                  {hitEffect.type === 'monk_twin_finger_effect' && (() => {
                    const dx = fighterPos.col - targetPos.col;
                    const dy = fighterPos.row - targetPos.row;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    let adjCol = fighterPos.col;
                    let adjRow = fighterPos.row;
                    if (dist > 0) {
                      const colStep = Math.round(dx / dist);
                      const rowStep = Math.round(dy / dist);
                      adjCol = targetPos.col + colStep;
                      adjRow = targetPos.row + rowStep;
                    }
                    const swingDx = targetPos.col - adjCol;
                    const swingDy = targetPos.row - adjRow;

                    const leftOffset = (swingDx / 2) * -100;
                    const topOffset = (swingDy / 2) * -100;

                    return (
                      <div
                        style={{
                          position: 'absolute',
                          left: `calc(50% + ${leftOffset}px)`,
                          top: `calc(50% + ${topOffset}px)`,
                          width: '56px',
                          height: '56px',
                          transform: 'translate(-50%, -50%)',
                          pointerEvents: 'none',
                          zIndex: 5000,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={monk_twin_finger_authority}
                          alt="monk twin finger authority"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 0 6px #ff9f1c)',
                            animation: 'scaleUp 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275) both'
                          }}
                        />
                      </div>
                    );
                  })()}
                  {hitEffect.type === 'fist_connect' && (() => {
                    const dx = fighterPos.col - targetPos.col;
                    const dy = fighterPos.row - targetPos.row;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    let adjCol = fighterPos.col;
                    let adjRow = fighterPos.row;
                    if (dist > 0) {
                      const colStep = Math.round(dx / dist);
                      const rowStep = Math.round(dy / dist);
                      adjCol = targetPos.col + colStep;
                      adjRow = targetPos.row + rowStep;
                    }
                    const swingDx = targetPos.col - adjCol;
                    const swingDy = targetPos.row - adjRow;
                    const baseAngle = Math.atan2(swingDy, swingDx) * (180 / Math.PI);

                    // Calculate divide (midpoint) offset relative to Target (like healing hands)
                    const leftOffset = (swingDx / 2) * -100;
                    const topOffset = (swingDy / 2) * -100;

                    return (
                      <div
                        style={{
                          position: 'absolute',
                          left: `calc(50% + ${leftOffset}px)`,
                          top: `calc(50% + ${topOffset}px)`,
                          width: '56px',
                          height: '56px',
                          transform: `translate(-50%, -50%) rotate(${baseAngle + 90}deg)`,
                          pointerEvents: 'none',
                          zIndex: 5000,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={soldier_fist_of_honor}
                          alt="fist connect"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            animation: 'scaleUp 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275) both'
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
                  {hitEffect.type === 'poison_burst' && (
                    <div style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, #70e000 20%, #38b000 70%, transparent 100%)',
                      animation: 'explode 0.3s ease-out forwards',
                      boxShadow: '0 0 25px #38b000'
                    }}></div>
                  )}
                  {hitEffect.type === 'arrow_hit' && (
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, #fff 30%, rgba(255, 183, 3, 0.6) 70%, transparent 100%)',
                      animation: 'explode 0.25s ease-out forwards',
                      boxShadow: '0 0 20px rgba(255, 183, 3, 0.8)'
                    }}></div>
                  )}
                  {hitEffect.type === 'ice_burst' && (
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'radial-gradient(circle, #ffffff 25%, #e0f7fa 55%, #00bfff 85%, transparent 100%)',
                      borderRadius: '52% 48% 46% 54% / 54% 46% 54% 46%',
                      animation: 'explode 0.4s ease-out forwards, organicGlow 0.4s linear infinite',
                      boxShadow: '0 0 20px 4px #00bfff, inset 0 0 10px rgba(0, 191, 255, 0.5)'
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
                  {hitEffect.type === 'annihilation_portal' && (
                    <div style={{
                      position: 'relative',
                      width: '90px',
                      height: '90px',
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 35
                    }}>
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            background: i === 0 ? 'rgba(0,0,0,0.65)' : 'transparent',
                            border: '3px solid #9d4edd',
                            borderRadius: '60% 40% 50% 50% / 40% 50% 60% 50%',
                            boxShadow: '0 0 15px #7b2cbf, inset 0 0 10px #7b2cbf',
                            animation: 'organicGlow 3s linear infinite, collapsarRing 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite',
                            animationDelay: `${i * 0.5}s`,
                            opacity: 0,
                            boxSizing: 'border-box'
                          }}
                        />
                       ))}
                    </div>
                  )}
                  {hitEffect.type === 'sleep_rings' && (
                    <div style={{
                      position: 'relative',
                      width: '100px',
                      height: '100px',
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 35
                    }}>
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '100%',
                            height: '100%',
                            border: '2.2px dashed rgba(160, 160, 165, 0.75)',
                            borderRadius: '60% 40% 50% 50% / 40% 50% 60% 50%',
                            boxShadow: '0 0 10px rgba(160, 160, 165, 0.35), inset 0 0 6px rgba(160, 160, 165, 0.25)',
                            animation: 'sleepShrinkRing 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
                            animationDelay: `${i * 0.4}s`,
                            opacity: 0,
                            boxSizing: 'border-box'
                          }}
                        />
                      ))}
                    </div>
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
                    animation: 'floatUp 1.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards'
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

              {/* Scoped Weapon Selector Modal Overlay */}
              {weaponModalOpen && (() => {
                const activeWeaponId = equippedWeapons[selectedFighterId] || 'shortsword_sword';
                return (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(20, 20, 22, 0.97)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'fadeIn 0.2s ease-out'
                  }}
                  onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modal Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                        <span style={{ fontSize: '13px', color: '#ffb703', fontWeight: 'bold', letterSpacing: '0.05em' }}>SELECT WEAPON</span>
                        <span style={{ fontSize: '10px', color: '#888' }}>Equipping for {selectedFighter.name}</span>
                      </div>
                      <button
                        onClick={() => setWeaponModalOpen(false)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#aaa',
                          fontSize: '20px',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#aaa'}
                      >
                        &times;
                      </button>
                    </div>

                    {/* Tabs */}
                    <div style={{
                      display: 'flex',
                      background: 'rgba(0, 0, 0, 0.25)',
                      padding: '3px',
                      margin: '10px 16px 5px 16px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.04)'
                    }}>
                      {['swords', 'axes'].map((tab) => {
                        const isActive = weaponModalTab === tab;
                        return (
                          <button
                            key={tab}
                            onClick={() => setWeaponModalTab(tab)}
                            style={{
                              flex: 1,
                              padding: '6px',
                              borderRadius: '4px',
                              background: isActive ? 'rgba(255, 183, 3, 0.12)' : 'transparent',
                              border: 'none',
                              color: isActive ? '#ffb703' : '#aaa',
                              fontWeight: 'bold',
                              fontSize: '11px',
                              cursor: 'pointer',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              transition: 'all 0.15s'
                            }}
                          >
                            {tab}
                          </button>
                        );
                      })}
                    </div>

                    {/* Scrollable Body */}
                    <div style={{
                      flex: 1,
                      padding: '5px 16px 16px 16px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '15px',
                      willChange: 'transform',
                      WebkitOverflowScrolling: 'touch',
                      transform: 'translateZ(0)'
                    }}>
                      {[1, 2, 3].map((tier) => {
                        const weaponsInTier = WEAPONS_DB[weaponModalTab].filter(w => w.tier === tier);
                        if (weaponsInTier.length === 0) return null;

                        const tierColors = {
                          1: '#a8a29e',
                          2: '#3b82f6',
                          3: '#d97706'
                        };

                        return (
                          <div key={tier} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: tierColors[tier],
                                boxShadow: `0 0 6px ${tierColors[tier]}`
                              }} />
                              <span style={{ fontSize: '9px', fontWeight: 'bold', color: tierColors[tier], letterSpacing: '0.08em' }}>TIER {tier}</span>
                            </div>

                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: '8px'
                            }}>
                              {weaponsInTier.map((weapon) => {
                                const isEquipped = activeWeaponId === weapon.id;
                                return (
                                  <div
                                    key={weapon.id}
                                    onClick={() => {
                                      setEquippedWeapons(prev => ({
                                        ...prev,
                                        [selectedFighterId]: weapon.id
                                      }));
                                      setWeaponModalOpen(false);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '6px 8px',
                                      background: isEquipped ? 'rgba(255, 183, 3, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                                      border: isEquipped ? '1px solid #ffb703' : '1px solid rgba(255, 255, 255, 0.05)',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s',
                                      position: 'relative'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isEquipped) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 183, 3, 0.3)';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isEquipped) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                      }
                                    }}
                                  >
                                    <div style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '4px',
                                      background: 'rgba(0, 0, 0, 0.3)',
                                      border: isEquipped ? '1px solid #ffb703' : '1px solid rgba(255, 255, 255, 0.1)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: '3px',
                                      flexShrink: 0
                                    }}>
                                      <img src={weapon.image} alt={weapon.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, textAlign: 'left' }}>
                                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{weapon.name}</span>
                                      <span style={{ fontSize: '8px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={weapon.description}>{weapon.description}</span>
                                    </div>

                                    {isEquipped && (
                                      <div style={{
                                        position: 'absolute',
                                        top: '-4px',
                                        right: '-4px',
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        background: '#ffb703',
                                        color: '#000',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '8px',
                                        fontWeight: 'bold'
                                      }}>
                                        ✓
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Weapon Selector Component */}
            {(() => {
              const activeWeaponId = equippedWeapons[selectedFighterId] || 'shortsword_sword';
              const activeWeapon = WEAPONS_DB.swords.find(w => w.id === activeWeaponId) ||
                                   WEAPONS_DB.axes.find(w => w.id === activeWeaponId) ||
                                   WEAPONS_DB.swords[0];
              return (
                <div
                  onClick={() => {
                    const isAxe = WEAPONS_DB.axes.some(w => w.id === activeWeaponId);
                    setWeaponModalTab(isAxe ? 'axes' : 'swords');
                    setWeaponModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '500px',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                    marginTop: '10px',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255, 183, 3, 0.4)';
                    e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(255, 183, 3, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.3)';
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 183, 3, 0.4)',
                    boxShadow: '0 0 12px rgba(255, 183, 3, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px',
                    flexShrink: 0
                  }}>
                    <img src={activeWeapon.image} alt={activeWeapon.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, textAlign: 'left' }}>
                    <span style={{ fontSize: '9px', color: '#ffb703', fontWeight: 'bold', letterSpacing: '0.12em' }}>EQUIPPED WEAPON</span>
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>{activeWeapon.name}</span>
                    <span style={{ fontSize: '11px', color: '#888' }}>Tier {activeWeapon.tier}</span>
                  </div>
                  {/* Subtle selection settings indicator */}
                  <div style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '18px', paddingLeft: '10px' }}>
                    ⚙
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Right Panel: Abilities */}
          <div style={{
            flex: '0 0 280px',
            width: '280px',
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
            {selectedFighter.abilities.map(a => {
              const isNotch = a.id === 'notch';
              return (
                <div key={a.id} style={{ position: 'relative', width: '100%' }}>
                  {isNotch && submenuOpen && (
                    <div style={{
                      position: 'absolute',
                      bottom: 'calc(100% - 10px)',
                      left: '20px',
                      width: '0',
                      height: '0',
                      zIndex: 100,
                    }}>
                      {[
                        { id: 'force', icon: ranger_force_arrow, label: 'Force', x: -32, y: -35 },
                        { id: 'ice', icon: ranger_ice_arrow, label: 'Ice', x: -11, y: -46 },
                        { id: 'poison', icon: ranger_poison_arrow, label: 'Poison', x: 11, y: -46 },
                        { id: 'celestial', icon: ranger_celestial_arrow, label: 'Celestial', x: 32, y: -35 }
                      ].map((arrow, idx) => {
                        const isCurrent = notchedArrow === arrow.id;
                        return (
                          <button
                            key={arrow.id}
                            title={`${arrow.label} Arrow`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setNotchedArrow(arrow.id);
                              setSubmenuOpen(false);
                            }}
                            style={{
                              position: 'absolute',
                              left: `${arrow.x}px`,
                              top: `${arrow.y}px`,
                              transform: 'translate(-50%, -50%)',
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: '#222',
                              backgroundImage: `url(${arrow.icon})`,
                              backgroundSize: '70%',
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'center',
                              border: isCurrent ? '2px solid #ffb703' : '1px solid rgba(255, 255, 255, 0.25)',
                              cursor: 'pointer',
                              boxShadow: isCurrent ? '0 0 8px #ffb703' : '0 4px 8px rgba(0,0,0,0.5)',
                              transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
                              padding: 0,
                              outline: 'none',
                              animation: `scaleUp 0.15s ease-out ${idx * 0.03}s both`
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.2)';
                              e.currentTarget.style.borderColor = '#ffb703';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                              e.currentTarget.style.borderColor = isCurrent ? '#ffb703' : 'rgba(255, 255, 255, 0.25)';
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                  <button
                    disabled={isAnimating}
                    onClick={() => {
                      if (isNotch) {
                        setSubmenuOpen(!submenuOpen);
                      } else {
                        triggerAbility(a);
                      }
                    }}
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
                      opacity: isAnimating ? 0.6 : 1,
                      width: '100%'
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
                </div>
              );
            })}
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
