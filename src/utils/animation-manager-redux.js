/**
 * AnimationManagerRedux
 *
 * A lightweight, Sandbox-style animation driver for combat-redux.
 * Unlike the legacy AnimationManager (tile IDs + canvas callbacks),
 * this class uses plain pixel math and emits React-state-compatible
 * event objects. MonsterBattle wires connect() and feeds the result
 * into CombatGrid as an `activeAnimations` prop.
 *
 * No canvas, no tile lookup, no update() callbacks.
 */

import {
  claw_strike_animation,
  claw_hit,
  induce_fear,
  energy_drain,
  heartbeat,
  perceive,
  monk_punch,
  monk_force_punch,
  ranger_net_throw,
} from './images';

export class AnimationManagerRedux {
  constructor() {
    this.TILE_SIZE = 100;
    this.TILE_BORDER = 2; // added per-tile when SHOW_TILE_BORDERS=true
    this.USE_TILE_BORDERS = true;
    this.activeAnimations = [];
    this.onAnimationEvent = null; // callback(animations[]) wired by MonsterBattle
  }

  /** Wire the React setState callback from MonsterBattle */
  connect(callback) {
    this.onAnimationEvent = callback;
  }

  /** Pixel center of a tile at grid coordinates {x, y} */
  _px(coords) {
    if (!coords || typeof coords.x !== 'number' || typeof coords.y !== 'number') return { x: 0, y: 0 };
    const borderOffset = this.USE_TILE_BORDERS ? this.TILE_BORDER : 0;
    let x = coords.x * (this.TILE_SIZE + borderOffset) + this.TILE_SIZE / 2;
    let y = coords.y * (this.TILE_SIZE + borderOffset) + this.TILE_SIZE / 2;
    if (this._isTargetLarge && this._currentTargetCoords && coords.x === this._currentTargetCoords.x && coords.y === this._currentTargetCoords.y) {
      // Anchor row y is the bottom row of the 2x2. Center is 50px up.
      y -= this.TILE_SIZE / 2;
      // Anchor col x is right if x >= 4 (center is 50px left), otherwise left (center is 50px right)
      if (coords.x >= 4) {
        x -= this.TILE_SIZE / 2;
      } else {
        x += this.TILE_SIZE / 2;
      }
    }
    return { x, y };
  }

  /** Emit an animation event and auto-remove it after duration */
  _emit(anim) {
    const id = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const entry = { id, ...anim };
    this.activeAnimations = [...this.activeAnimations, entry];
    if (this.onAnimationEvent) this.onAnimationEvent([...this.activeAnimations]);

    const duration = anim.duration || 1000;
    setTimeout(() => {
      this.activeAnimations = this.activeAnimations.filter(a => a.id !== id);
      if (this.onAnimationEvent) this.onAnimationEvent([...this.activeAnimations]);
    }, duration);
  }

  /**
   * Main entry point — called by combat-manager-redux for every ability
   * @param {object} sourceCoords  { x, y }
   * @param {object} targetCoords  { x, y }
   * @param {string} abilityName   e.g. 'claw_strike', 'energy_drain'
   */
  triggerAbility(sourceCoords, targetCoords, abilityName, isTargetLarge = false, targetOccupiedCoords = null, sourceUnitId = null, arrowType = null) {
    if (!sourceCoords || !targetCoords) return;
    const name = (abilityName || '').toLowerCase().replace(/\s+/g, '_');
    this._currentTargetCoords = targetCoords;
    this._isTargetLarge = isTargetLarge;
    this._currentTargetOccupiedCoords = Array.isArray(targetOccupiedCoords) ? targetOccupiedCoords : null;
    this._currentAbilityName = name;

    switch (name) {
      case 'claw_strike':
      case 'claws':
      case 'bite':
      case 'crush':
      case 'tackle':
      case 'grasp':
      case 'stomp':
      case 'head_butt':
        this._clawStrike(sourceCoords, targetCoords);
        break;
      case 'energy_drain':
        this._energyDrain(sourceCoords, targetCoords);
        break;
      case 'induce_fear':
        this._induceFear(sourceCoords, targetCoords);
        break;
      case 'fireball':
      case 'fire_blast':
        this._fireball(sourceCoords, targetCoords);
        break;
      case 'magic_missile':
        this._magicMissile(sourceCoords, targetCoords);
        break;
      case 'lightning_strike':
      case 'lightning':
        this._lightning(sourceCoords, targetCoords);
        break;
      case 'ice_blast':
      case 'reveal_weakness':
        this._iceBlast(sourceCoords, targetCoords);
        break;
      case 'acid_blast':
        this._acidBlast(sourceCoords, targetCoords);
        break;
      case 'sword_swing':
      case 'slash':
      case 'barbarian_slash':
        this._swordSlash(sourceCoords, targetCoords);
        break;
      case 'imbued_strike':
        this._imbuedStrike(sourceCoords, targetCoords);
        break;
      case 'cleave':
      case 'barbarian_cleave':
        this._barbarianCleave(sourceCoords, targetCoords);
        break;
      case 'monk_punch':
      case 'punch':
      case 'monk_force_punch':
      case 'force_punch':
      case 'monk_force_punch_flurry':
      case 'force_punch_flurry':
        this._monkPunch(sourceCoords, targetCoords, name);
        break;
      case 'annihilation':
        this._annihilation(sourceCoords, targetCoords);
        break;
      case 'sleep':
      case 'sleep_spell':
        this._sleep(sourceCoords, targetCoords);
        break;
      case 'vortex':
        this._vortex(sourceCoords, targetCoords);
        break;
      case 'monk_meditate':
      case 'meditate':
        this._monkMeditate(sourceCoords, targetCoords);
        break;
      case 'ensnare':
        this._ensnareNet(sourceCoords, targetCoords);
        break;
      case 'axe_throw':
      case 'deadeye_shot':
      case 'spear_throw':
      case 'loose':
        this._projectileThrow(sourceCoords, targetCoords, name, arrowType);
        break;
      case 'execute':
        this._executeMultiShots(sourceCoords, targetCoords, name, arrowType);
        break;
      case 'circle_of_protection':
        this._circleOfProtection(sourceCoords, targetCoords);
        break;
      case 'heal':
      case 'healing_hymn':
        this._heal(sourceCoords, targetCoords);
        break;
      case 'crimson_sight':
        this._crimsonSight(sourceCoords, targetCoords);
        break;
      case 'perceive':
        this._perceive(sourceCoords, targetCoords);
        break;
      case 'disintegrate':
        this._disintegrate(sourceCoords, targetCoords);
        break;
      case 'barbarian_berserker':
      case 'berserker':
        this._berserker(sourceCoords, targetCoords);
        break;
      case 'barbarian_leap_attack':
      case 'leap_attack':
      case 'leap':
        this._leapAttack(sourceCoords, targetCoords, sourceUnitId);
        break;
      default:
        // Generic melee hit for unknown abilities
        this._genericHit(sourceCoords, targetCoords);
        break;
    }
  }

  _isProjectileAbility(name) {
    return [
      'axe_throw',
      'deadeye_shot',
      'spear_throw',
      'loose',
      'execute',
      'energy_drain',
      'fireball',
      'fire_blast',
      'magic_missile',
      'ice_blast',
      'reveal_weakness',
      'disintegrate',
    ].includes(name);
  }

  _getLargeTargetCenterPx() {
    if (!this._isTargetLarge) return null;
    const tiles = this._currentTargetOccupiedCoords;
    if (Array.isArray(tiles) && tiles.length > 0) {
      const sum = tiles.reduce((acc, tile) => {
        if (!tile || typeof tile.x !== 'number' || typeof tile.y !== 'number') return acc;
        return { x: acc.x + tile.x, y: acc.y + tile.y, n: acc.n + 1 };
      }, { x: 0, y: 0, n: 0 });
      if (sum.n > 0) {
        return this._px({ x: sum.x / sum.n, y: sum.y / sum.n });
      }
    }
    return this._px(this._currentTargetCoords);
  }

  _getImpactTargetPx(tgt) {
    if (this._isProjectileAbility(this._currentAbilityName) && this._isTargetLarge) {
      return this._getLargeTargetCenterPx();
    }
    return this._px(tgt);
  }

  // ─── Animation implementations ───────────────────────────────────────────────

  _clawStrike(src, tgt) {
    const srcPx = this._px(src);
    const tgtPx = this._px(tgt);
    const dx = tgtPx.x - srcPx.x;
    const dy = tgtPx.y - srcPx.y;
    // Place swipe icon halfway between attacker and target
    const midPx = { x: srcPx.x + dx * 0.6, y: srcPx.y + dy * 0.6 };
    const angle = (Math.atan2(dy, dx) * (180 / Math.PI)) + 180;

    // Phase 1: claw swipe arc traveling toward target
    this._emit({
      type: 'claw_swipe',
      srcPx,
      tgtPx,
      midPx,
      angle,
      icon: claw_strike_animation,
      duration: 750,
    });

    // Phase 2: claw_hit overlay on target, staggered after swipe
    setTimeout(() => {
      this._emit({
        type: 'claw_hit',
        tgtPx,
        icon: claw_hit,
        duration: 400,
      });
    }, 500);
  }

  _energyDrain(src, tgt) {
    const srcPx = this._px(src);
    const tgtPx = this._getImpactTargetPx(tgt);
    const dx = tgtPx.x - srcPx.x;
    const dy = tgtPx.y - srcPx.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    this._emit({
      type: 'energy_drain_beam',
      srcPx,
      tgtPx,
      length,
      angle,
      icon: energy_drain,
      duration: 1500,
    });
  }

  _induceFear(src, _tgt) {
    this._emit({
      type: 'induce_fear_overlay',
      srcPx: this._px(src),
      icon: induce_fear,
      duration: 1500,
    });
  }

  _fireball(src, tgt) {
    const srcPx = this._px(src);
    const tgtPx = this._getImpactTargetPx(tgt);
    const dx = tgtPx.x - srcPx.x;
    const dy = tgtPx.y - srcPx.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    this._emit({
      type: 'fireball_projectile',
      srcPx,
      tgtPx,
      angle,
      duration: 1000,
    });
    setTimeout(() => {
      this._emit({ type: 'explosion', tgtPx, duration: 600 });
    }, 900);
    setTimeout(() => {
      this._emit({ type: 'fire_secondary_ring', tgtPx, duration: 500 });
    }, 980);
  }

  _magicMissile(src, tgt) {
    const srcPx = this._px(src);
    const tgtPx = this._getImpactTargetPx(tgt);

    const fireMissile = (delayTime, offsetY) => {
      setTimeout(() => {
        const adjustedTgtPx = {
          x: tgtPx.x,
          y: tgtPx.y + offsetY
        };
        const dx = adjustedTgtPx.x - srcPx.x;
        const dy = adjustedTgtPx.y - srcPx.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        this._emit({
          type: 'magic_missile_projectile',
          srcPx,
          tgtPx: adjustedTgtPx,
          angle,
          duration: 400,
        });
      }, delayTime);
    };

    fireMissile(0, -15);
    fireMissile(200, 0);
    fireMissile(400, 15);
  }

  _lightning(src, tgt) {
    const tgtPx = this._px(tgt);
    // Emit lightning vertical beam
    this._emit({
      type: 'lightning_beam',
      tgtPx,
      duration: 700
    });
    // Emit lightning hit burst (or background flash overlays)
    setTimeout(() => {
      this._emit({
        type: 'lightning_hit',
        tgtPx,
        duration: 400
      });
    }, 150);
  }

  _iceBlast(src, tgt) {
    const srcPx = this._px(src);
    const tgtPx = this._getImpactTargetPx(tgt);
    const dx = tgtPx.x - srcPx.x;
    const dy = tgtPx.y - srcPx.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    this._emit({
      type: 'ice_projectile',
      srcPx,
      tgtPx,
      angle,
      duration: 700,
    });
    setTimeout(() => {
      this._emit({ type: 'ice_burst', tgtPx, duration: 500 });
    }, 600);
  }

  _acidBlast(src, tgt) {
    const srcPx = this._px(src);
    const tgtPx = this._px(tgt);
    const dx = tgtPx.x - srcPx.x;
    const dy = tgtPx.y - srcPx.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    this._emit({
      type: 'acid_projectile',
      srcPx,
      tgtPx,
      angle,
      duration: 700,
    });
    setTimeout(() => {
      this._emit({ type: 'poison_burst', tgtPx, duration: 500 });
    }, 600);
    setTimeout(() => {
      this._emit({ type: 'acid_secondary_ring', tgtPx, duration: 450 });
    }, 690);
  }

  _swordSlash(src, tgt) {
    const srcPx = this._px(src);
    const tgtPx = this._px(tgt);
    const dx = tgtPx.x - srcPx.x;
    const dy = tgtPx.y - srcPx.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    this._emit({
      type: 'sword_slash',
      srcPx,
      tgtPx,
      angle,
      duration: 600,
    });
  }

  _imbuedStrike(src, tgt) {
    const srcPx = this._px(src);
    const tgtPx = this._px(tgt);
    const dx = tgtPx.x - srcPx.x;
    const dy = tgtPx.y - srcPx.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    this._emit({
      type: 'imbued_strike',
      srcPx,
      tgtPx,
      angle,
      duration: 600,
    });
  }

  _projectileThrow(src, tgt, name, arrowType = null) {
    const srcPx = this._px(src);
    const tgtPx = this._getImpactTargetPx(tgt);
    const dx = tgtPx.x - srcPx.x;
    const dy = tgtPx.y - srcPx.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    this._emit({
      type: 'generic_projectile',
      subtype: name,
      srcPx,
      tgtPx,
      angle,
      arrowType,
      duration: 700,
    });
  }

  _ensnareNet(src, tgt) {
    const srcPx = this._px(src);
    const tgtPx = this._getImpactTargetPx(tgt);
    const dx = tgtPx.x - srcPx.x;
    const dy = tgtPx.y - srcPx.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    this._emit({
      type: 'generic_projectile',
      subtype: 'ensnare_net',
      srcPx,
      tgtPx,
      angle,
      isNet: true,
      netIcon: ranger_net_throw,
      duration: 500,
    });
  }

  _executeMultiShots(src, tgt, name, arrowType = null) {
    const srcPx = this._px(src);
    const tgtPx = this._getImpactTargetPx(tgt);
    const dx = tgtPx.x - srcPx.x;
    const dy = tgtPx.y - srcPx.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const fireArrow = () => {
      this._emit({
        type: 'generic_projectile',
        subtype: name,
        srcPx,
        tgtPx,
        angle,
        arrowType,
        duration: 700,
      });
    };

    fireArrow();
    setTimeout(fireArrow, 250);
    setTimeout(fireArrow, 500);
  }

  _heal(src, tgt) {
    const tgtPx = this._px(tgt);
    this._emit({
      type: 'heal_glow',
      srcPx: this._px(src),
      tgtPx,
      duration: 800,
    });
  }

  _circleOfProtection(src, tgt) {
    const srcPx = this._px(src);
    this._emit({
      type: 'circle_of_protection',
      srcPx,
      duration: 8000,
    });
  }

  _genericHit(src, tgt) {
    const tgtPx = this._px(tgt);
    this._emit({
      type: 'generic_hit',
      tgtPx,
      duration: 400,
    });
  }

  _crimsonSight(src, tgt) {
    const tgtPx = this._px(tgt);
    this._emit({
      type: 'crimson_sight_anim',
      srcPx: this._px(src),
      tgtPx,
      icon: heartbeat,
      duration: 1500,
    });
  }

  _perceive(src, tgt) {
    const tgtPx = this._px(tgt);
    this._emit({
      type: 'perceive_anim',
      srcPx: this._px(src),
      tgtPx,
      icon: perceive,
      duration: 1500,
    });
  }

  _barbarianCleave(src, tgt) {
    const srcPx = this._px(src);
    const tgtPx = this._px(tgt);
    const dx = src.x - tgt.x;
    const dy = src.y - tgt.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const colStep = dist > 0 ? Math.round(dx / dist) : 0;
    const rowStep = dist > 0 ? Math.round(dy / dist) : 0;
    const swingDx = -colStep;
    const swingDy = -rowStep;
    const baseAngle = Math.atan2(swingDy, swingDx) * (180 / Math.PI);
    const adjDist = Math.sqrt(swingDx * swingDx + swingDy * swingDy);
    const halfDistPx = (adjDist * 100) / 2;
    const leftOffset = (swingDx / 2) * -100;
    const topOffset = (swingDy / 2) * -100;

    this._emit({
      type: 'barbarian_cleave_effect',
      srcPx,
      tgtPx,
      baseAngle,
      halfDistPx,
      leftOffset,
      topOffset,
      duration: 1100
    });
  }

  _monkPunch(src, tgt, name) {
    const srcPx = this._px(src);
    const tgtPx = this._px(tgt);
    const dx = src.x - tgt.x;
    const dy = src.y - tgt.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const colStep = dist > 0 ? Math.round(dx / dist) : 0;
    const rowStep = dist > 0 ? Math.round(dy / dist) : 0;
    const swingDx = -colStep;
    const swingDy = -rowStep;
    const leftOffset = (swingDx / 2) * -100;
    const topOffset = (swingDy / 2) * -100;

    const isForce = name.includes('force');
    const punchIcon = isForce ? monk_force_punch : monk_punch;

    this._emit({
      type: isForce ? 'monk_force_punch_effect' : 'monk_punch_effect',
      srcPx,
      tgtPx,
      leftOffset,
      topOffset,
      icon: punchIcon,
      duration: 500
    });
  }

  _annihilation(src, tgt) {
    const srcPx = this._px(src);
    const tgtPx = this._px(tgt);
    const dx = tgtPx.x - srcPx.x;
    const dy = tgtPx.y - srcPx.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Phase 1: Annihilation horizontal beam sweeps target
    this._emit({
      type: 'annihilation_beam',
      srcPx,
      tgtPx,
      length,
      angle,
      duration: 1200
    });

    // Phase 2: Concentric ring explosion on target
    setTimeout(() => {
      this._emit({
        type: 'annihilation_burst',
        tgtPx,
        duration: 700
      });
    }, 1100);

    // Phase 3: Hit effect annihilation_portal on target
    setTimeout(() => {
      this._emit({
        type: 'annihilation_portal',
        tgtPx,
        duration: 1200
      });
    }, 1200);
  }

  _sleep(src, tgt) {
    const tgtPx = this._px(tgt);
    this._emit({
      type: 'sleep_rings',
      tgtPx,
      duration: 1500
    });
  }

  _vortex(src, tgt) {
    const tgtPx = this._getImpactTargetPx(tgt);
    this._emit({
      type: 'vortex',
      tgtPx,
      duration: 4000
    });
  }

  _monkMeditate(src) {
    const srcPx = this._px(src);
    this._emit({
      type: 'monk_meditate',
      srcPx,
      duration: 1800
    });
  }

  _disintegrate(src, tgt) {
    const tgtPx = this._getImpactTargetPx(tgt);
    this._emit({
      type: 'disintegrate_beam',
      tgtPx,
      duration: 2200
    });
  }

  _berserker(src, tgt) {
    const srcPx = this._px(src);
    this._emit({
      type: 'berserker_rage',
      srcPx,
      duration: 1000
    });
  }

  _leapAttack(src, tgt, sourceUnitId = null) {
    const srcPx = this._px(src);
    const tgtPx = this._px(tgt);
    const dxFull = tgtPx.x - srcPx.x;
    const dyFull = tgtPx.y - srcPx.y;
    const dist = Math.sqrt(dxFull * dxFull + dyFull * dyFull);
    let landPx = tgtPx;
    if (dist > 0) {
      const stepX = (dxFull / dist) * 102;
      const stepY = (dyFull / dist) * 102;
      landPx = {
        x: tgtPx.x - stepX,
        y: tgtPx.y - stepY
      };
    }
    const dx = landPx.x - srcPx.x;
    const dy = landPx.y - srcPx.y;
    this._emit({
      type: 'leap_attack_jump',
      sourceUnitId,
      srcPx,
      tgtPx: landPx,
      dx,
      dy,
      duration: 1650
    });
  }
}
