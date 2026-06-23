import { CombatManagerRedux } from '../combat-manager-redux';
import { CombatManager } from '../combat-manager';

describe('Monster HP scaling based on tier', () => {
  const createMockData = (tier, type = 'goblin', hp = 50) => ({
    crew: [
      { id: 'soldier_1', type: 'soldier', stats: { hp: 100, vitality: 50, atk: 10, def: 5, str: 10, int: 5, dex: 5, fort: 5 } }
    ],
    monster: {
      id: 'boss_1',
      type: type,
      tier: tier,
      stats: { hp: hp, vitality: 30, atk: 10, def: 5, str: 10, int: 5, dex: 5, fort: 5 }
    },
    minions: []
  });

  describe('CombatManagerRedux', () => {
    test('doubles HP (+100%) for a Tier 1 main monster', () => {
      const cm = new CombatManagerRedux();
      const data = createMockData(1, 'goblin', 50);

      cm.initializeCombat(data);

      const boss = cm.combatants['boss_1'];
      expect(boss).toBeDefined();
      expect(boss.starting_hp).toBe(100);
      expect(boss.hp).toBe(100);
    });

    test('doubles HP (+100%) for a Tier 2 main monster', () => {
      const cm = new CombatManagerRedux();
      const data = createMockData(2, 'ghoul', 80);

      cm.initializeCombat(data);

      const boss = cm.combatants['boss_1'];
      expect(boss).toBeDefined();
      expect(boss.starting_hp).toBe(160);
      expect(boss.hp).toBe(160);
    });

    test('does not double HP for a Tier 1 or 2 main monster if isShrineGuardian is true', () => {
      const cm = new CombatManagerRedux();
      const data = createMockData(1, 'goblin', 50);
      data.monster.isShrineGuardian = true;

      cm.initializeCombat(data);

      const boss = cm.combatants['boss_1'];
      expect(boss).toBeDefined();
      expect(boss.starting_hp).toBe(50);
      expect(boss.hp).toBe(50);
    });

    test('does not double HP for a Tier 3 main monster', () => {
      const cm = new CombatManagerRedux();
      const data = createMockData(3, 'witch', 120);

      cm.initializeCombat(data);

      const boss = cm.combatants['boss_1'];
      expect(boss).toBeDefined();
      expect(boss.starting_hp).toBe(120);
      expect(boss.hp).toBe(120);
    });
  });

  describe('CombatManager', () => {
    test('doubles HP (+100%) for a Tier 1 main monster', () => {
      const cm = new CombatManager();
      const data = createMockData(1, 'goblin', 50);

      cm.initializeCombat(data);

      const boss = cm.combatants['boss_1'];
      expect(boss).toBeDefined();
      expect(boss.starting_hp).toBe(100);
      expect(boss.hp).toBe(100);
    });

    test('doubles HP (+100%) for a Tier 2 main monster', () => {
      const cm = new CombatManager();
      const data = createMockData(2, 'ghoul', 80);

      cm.initializeCombat(data);

      const boss = cm.combatants['boss_1'];
      expect(boss).toBeDefined();
      expect(boss.starting_hp).toBe(160);
      expect(boss.hp).toBe(160);
    });
  });
});
