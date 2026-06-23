jest.mock('@coreui/icons', () => ({}));
jest.mock('../images', () => ({}));

import { CombatManagerRedux } from '../combat-manager-redux';
import { BeholderMinion } from '../monster-ai/profiles/BeholderMinion';

describe('Beholder Minion & Minor Magic Missile', () => {
  test('minor_magic_missile has projectile and hit count of 1 in Redux engine', () => {
    const cm = new CombatManagerRedux();
    cm.updateData = jest.fn();
    cm.appendCombatLog = jest.fn();
    cm.applyEnduranceCost = jest.fn();
    cm.animManagerRedux = { triggerAbility: jest.fn(), triggerSummon: jest.fn() };
    cm.hitCheck = jest.fn().mockReturnValue(true);
    cm.damageCheck = jest.fn((caller, target, dmg) => dmg);
    cm.targetKilled = jest.fn();

    const unit = {
      id: 'beholder_unit',
      name: 'Beholder',
      type: 'beholder_minion',
      isMonster: true,
      stats: { speed: 5, dex: 5, def: 5, int: 5, hp: 80, atk: 10 },
      skills: ['minor_magic_missile'],
      coordinates: { x: 5, y: 2 }
    };

    const target = {
      id: 'target_unit',
      name: 'Soldier',
      type: 'soldier',
      stats: { speed: 5, dex: 5, def: 5, hp: 100 },
      coordinates: { x: 1, y: 2 }
    };

    cm.initializeCombat({ crew: [target], monster: unit, minions: [] });

    const beholder = cm.getCombatant('beholder_unit');
    const abilitySpec = cm.resolveSpecial(beholder, 'minor_magic_missile');

    expect(abilitySpec).toBeDefined();
    expect(abilitySpec.id).toBe('minor_magic_missile');

    const hitsSpy = jest.spyOn(cm, 'hitCheck');

    jest.useFakeTimers();
    cm.useAbility(beholder, abilitySpec, cm.getCombatant('target_unit'));
    jest.runAllTimers();

    expect(hitsSpy).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  test('Real-time BeholderMinion AI resolves specials correctly', () => {
    const data = { MAX_DEPTH: 8, MAX_LANES: 5, FIGHT_INTERVAL: 1000 };
    const utilMethods = {
      broadcastDataUpdate: jest.fn(),
      kickoffAttackCooldown: jest.fn(),
      kickoffSpecialCooldown: jest.fn(),
      missesTarget: jest.fn(),
      hitsTarget: jest.fn(),
      hitsCombatant: jest.fn(),
      getCombatants: jest.fn(),
      spawnMinion: jest.fn(),
      chooseAttackType: jest.fn(),
      clearTargetListById: jest.fn(),
    };

    const minionAI = new BeholderMinion(data, utilMethods, null, null);

    const caller = {
      id: 'beholder_id',
      dead: false,
      energy: 100,
      specials: [
        { id: 'minor_magic_missile', name: 'Minor Magic Missile', cooldown_position: 100 },
        { id: 'bifurcate', name: 'Bifurcate', cooldown_position: 100 }
      ],
      coordinates: { x: 5, y: 2 }
    };

    const target = {
      id: 'target_id',
      dead: false,
      coordinates: { x: 5, y: 2 }
    };

    const combatants = {
      beholder_id: caller,
      target_id: target
    };

    caller.targetId = 'target_id';
    caller.moveCooldown = 1000;
    caller.eras = [{ moved: false, attacked: false }];
    caller.eraIndex = 0;

    jest.useFakeTimers();
    minionAI.processMove(caller, combatants);
    jest.runAllTimers();

    expect(utilMethods.spawnMinion).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
