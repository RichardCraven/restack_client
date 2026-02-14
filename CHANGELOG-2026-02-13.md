# New stat system and refactor (February 13, 2026)

## Overview
- Replaced the old `vit`/"Vitality" attribute with a simplified canonical base-stat model.
- The only persistent base stats are now: Strength (`str`), Dexterity (`dex`), Fortitude (`fort`), and Intelligence (`int`).
- All other sub-stats (Atk, Def, HP, Energy, Willpower, Speed) are derived from those four base stats through a class-specific matrix.

## Key implementation details
- New derivation matrix and calculator added to `src/utils/crew-manager.js`:
  - `this.statConstituents` documents how each derived stat is calculated per class.
  - `this.computeDerivedStats(member)` computes derived values and writes them into `member.stats` (and `member.starting_hp`).
  - Derivation rule: If two constituents are listed -> derived = primary + floor(secondary / 2). If only one is listed -> derived = primary + floor(primary / 2).
    - Example: Monk Atk = Dex + floor(Str/2). If Dex=11 and Str=10, Atk = 11 + 5 = 16.

## Class breakdown (implemented)
- Attack:
  - Monk: Dex, Str
  - Barbarian: Str
  - Soldier: Str, Fort
  - Wizard: Int
  - Rogue: Dex, Str
  - Sage: Fort
- Defense (`def`, renamed from `baseDef`):
  - Monk: Dex
  - Barbarian: Str, Fort
  - Soldier: Str, Dex
  - Wizard: Dex, Str
  - Rogue: Str, Fort
  - Sage: Str, Fort
- HP (max) and Energy: derived from `fort` (all classes)
- Willpower: derived from `int` (all classes)
- Speed: derived from `dex` (all classes)

## Code changes (high level)
- `src/utils/crew-manager.js`
  - Added `statConstituents` and `computeDerivedStats`.
  - Normalizes incoming crew members to only include the four base stats and `experience`.
  - Calls `computeDerivedStats` during `initializeCrew`, `addCrewMember`, and after `levelUp` so derived substats update immediately when base stats change.
- `src/utils/monster-manager.js` and starter `adventurers` were updated to remove `vit` and to rely on `def` for defense where appropriate.
- Renamed `baseDef` → `def` across code and updated consumers (combat logic, factories, UI readouts, tests).
- `src/utils/factories.js` updated to map `def` into runtime fighter objects.
- UI files updated to remove the old "Vitality" field and read derived stats from the new computed values.

## Tests & migration notes
- Updated `src/utils/__tests__/combat-armor.test.js` to reflect `def` rename.
- If you have persisted save/meta data containing old derived fields (e.g., `vit`, `baseDef`, precomputed `atk`/`hp`), those should be normalized by stripping derived fields so `computeDerivedStats` can recompute them from base stats on load. Consider adding a small migration helper if needed.

## Next steps (recommended)
- Add unit tests that assert derived stat calculations for each class (I can add these).
- Add a one-time migration that normalizes persisted player/monster data on first load after this change.
- Optionally parameterize the derivation matrix to use explicit multipliers (e.g., primary * 1.2 + secondary * 0.5) for future tuning.

---

*Generated on February 13, 2026*
