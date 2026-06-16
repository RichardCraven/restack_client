import { MonsterManager } from '../monster-manager';

describe('Dragon debug', () => {
  test('check dragon portrait', () => {
    const mm = new MonsterManager();
    console.log('--- DEBUG DRAGON ---');
    console.log('DRAGON PORTRAIT IS:', mm.monsters.dragon.portrait);
    console.log('DRAGON IMAGE NAMES ARE:', mm.monsters.dragon.image_names);
    console.log('--- END DEBUG ---');
  });
});
