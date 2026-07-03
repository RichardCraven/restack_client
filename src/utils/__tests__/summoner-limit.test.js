jest.mock('@coreui/icons', () => ({}));
jest.mock('../images', () => ({}));

import { CombatManagerRedux } from '../combat-manager-redux';

describe('Summoner Summon Count Limits and Player Queues', () => {
  let cm;
  let summoner;

  beforeEach(() => {
    cm = new CombatManagerRedux();
    cm.updateData = jest.fn();
    cm.appendCombatLog = jest.fn();
    cm.applyEnduranceCost = jest.fn();
    cm.animManagerRedux = { triggerAbility: jest.fn(), triggerSummon: jest.fn() };
    cm.hitCheck = jest.fn().mockReturnValue(true);
    cm.damageCheck = jest.fn((caller, target, dmg) => dmg);
    cm.targetKilled = jest.fn();

    summoner = {
      id: 'summoner_1',
      name: 'Vaelis',
      type: 'summoner',
      isMonster: false,
      dead: false,
      stats: { speed: 10, dex: 10, def: 5, int: 5, hp: 100, atk: 12 },
      skills: ['summon_skeleton', 'summon_imp', 'summoner_duplicate'],
      specials: ['summon_skeleton', 'summon_imp', 'summoner_duplicate'],
      attacks: [],
      coordinates: { x: 0, y: 1 },
      cooldowns: {},
      movesTakenThisRound: 0,
      actionsTakenThisRound: 0,
      endurance: 20,
      maxEndurance: 20,
      activeBuffs: [],
      activeDebuffs: [],
    };

    cm.combatants = {
      summoner_1: summoner
    };
  });

  test('should allow summoning when no minions of that type exist', () => {
    // Initial state: no skeletons
    expect(cm._abilityReady(summoner, 'summon_skeleton')).toBe(true);

    // Queue and execute summon_skeleton
    const summonSkeletonAbility = {
      id: 'summon_skeleton',
      name: 'Summon Skeleton',
      cooldown: 7,
      type: 'utility',
    };
    const dummyTarget = { id: 'dummy', coordinates: { x: 1, y: 1 } };
    cm.combatants['dummy'] = dummyTarget;

    cm.useAbility(summoner, summonSkeletonAbility, dummyTarget);

    // A skeleton should be summoned
    const minions = Object.values(cm.combatants).filter(c => c.isMinion);
    expect(minions.length).toBe(1);
    expect(minions[0].type).toBe('skeleton');
    expect(minions[0].summonedBy).toBe('summoner_1');
  });

  test('should prevent summoning when a minion of the same type already exists', () => {
    // Manually place a skeleton minion summoned by this summoner on the board
    const existingSkeleton = {
      id: 'skeleton_1',
      type: 'skeleton',
      isMinion: true,
      isMonster: false,
      dead: false,
      summonedBy: 'summoner_1',
      coordinates: { x: 0, y: 2 }
    };
    cm.combatants['skeleton_1'] = existingSkeleton;

    // summon_skeleton should NOT be ready because a skeleton already exists
    expect(cm._abilityReady(summoner, 'summon_skeleton')).toBe(false);

    // summon_imp should still be ready because no imps exist
    expect(cm._abilityReady(summoner, 'summon_imp')).toBe(true);
  });

  test('should allow duplicating existing minions (Option A bypass)', () => {
    // Place a skeleton minion on the board
    const existingSkeleton = {
      id: 'skeleton_1',
      type: 'skeleton',
      isMinion: true,
      isMonster: false,
      dead: false,
      summonedBy: 'summoner_1',
      coordinates: { x: 0, y: 2 }
    };
    cm.combatants['skeleton_1'] = existingSkeleton;

    // Since a minion exists, duplicate should be ready (Option A bypasses type limit)
    expect(cm._abilityReady(summoner, 'summoner_duplicate')).toBe(true);

    const duplicateAbility = {
      id: 'summoner_duplicate',
      name: 'Duplicate',
      cooldown: 8,
      type: 'utility',
    };

    cm.useAbility(summoner, duplicateAbility, summoner);

    // Now there should be 2 skeletons (original + copy)
    const skeletons = Object.values(cm.combatants).filter(c => c.type === 'skeleton');
    expect(skeletons.length).toBe(2);
    expect(skeletons[1].summonedBy).toBe('summoner_1');
  });
});
