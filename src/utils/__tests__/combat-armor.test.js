import { CombatManager } from '../combat-manager'

describe('CombatManager armor percent reduction', () => {
  test('equipped armor reduces damage by percent', () => {
    const cm = new CombatManager();
    cm.updateData = jest.fn();

    const caller = {
      id: 'attacker',
      name: 'Attacker',
      atk: 10,
      readout: { result: '' },
      stats: { fort: 0 },
      level: 1,
      coordinates: { x: 0, y: 0 }
    };

    const combatantHit = {
      id: 'defender',
      name: 'Defender',
      hp: 200,
      damageIndicators: [],
  stats: { dex: 1, def: 5 },
      coordinates: { x: 1, y: 0 },
      inventory: [
        { type: 'armor', armor: 50, equippedSlot: 'head', name: 'helm' }
      ]
    };

    cm.combatants = { [caller.id]: caller, [combatantHit.id]: combatantHit };
    // Use supplementalData.damage to force a known damage value of 100
    cm.hitsCombatant(caller, combatantHit, { damage: 100 }, { forceHit: true, forceCritical: false });

    // After 50% armor + natural armor (total 70 armor => 49% reduction), damage applied should be 51
    expect(combatantHit.hp).toBe(149);
    expect(combatantHit.damageIndicators.length).toBeGreaterThan(0);
    expect(combatantHit.damageIndicators[0].value).toBe(51);
    expect(caller.readout.result).toContain('hits Defender for 51');
  });
});
