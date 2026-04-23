// combat-effects.js
// Centralized helpers for applying and clearing combat effects (visual and stateful)

/**
 * Applies the "drained" effect to a combatant (energy drain visual flag).
 * - Sets drained=true, drained_eras=1 (cleared in restartTurnCycle)
 * - Sets energy=0
 * - Optionally triggers a data update callback
 * @param {object} target - The combatant object to apply the effect to
 * @param {function} [broadcastDataUpdate] - Optional callback to trigger UI update
 */
export function applyDrainedEffect(target, broadcastDataUpdate) {
    if (!target) return;
    target.energy = 0;
    target.drained = true;
    target.drained_eras = 1; // cleared in restartTurnCycle
    if (typeof broadcastDataUpdate === 'function') broadcastDataUpdate();
}

export function clearDrainedEffect(target) {
    if (!target) return;
    target.drained = false;
    target.drained_eras = 0;
}

/**
 * Applies the "bleed" effect to a combatant.
 * - Sets bleed=true, bleed_eras=duration
 * @param {object} target - The combatant object
 * @param {number} duration - Duration in eras
 * @param {function} [broadcastDataUpdate] - Optional callback
 */
export function applyBleedEffect(target, duration, broadcastDataUpdate) {
    if (!target) return;
    target.bleed = true;
    target.bleed_eras = duration || 1;
    if (typeof broadcastDataUpdate === 'function') broadcastDataUpdate();
}

/**
 * Clears the "bleed" effect from a combatant.
 * @param {object} target - The combatant object
 */
export function clearBleedEffect(target) {
    if (!target) return;
    target.bleed = false;
    target.bleed_eras = 0;
}

/**
 * Applies the "energy drain" effect to a combatant.
 * - Sets energy to 0
 * - Sets drained=true, drained_eras=duration
 * @param {object} target - The combatant object
 * @param {number} duration - Duration in eras
 * @param {function} [broadcastDataUpdate] - Optional callback
 */
export function applyEnergyDrainEffect(target, duration, broadcastDataUpdate) {
    if (!target) return;
    target.energy = 0;
    target.drained = true;
    target.drained_eras = duration || 1;
    if (typeof broadcastDataUpdate === 'function') broadcastDataUpdate();
}

/**
 * Applies the "stun" effect to a combatant.
 * - Sets stunned=true, stunned_eras=duration
 * @param {object} target - The combatant object
 * @param {number} duration - Duration in eras
 * @param {function} [broadcastDataUpdate] - Optional callback
 */
export function applyStunEffect(target, duration, broadcastDataUpdate) {
    if (!target) return;
    // Don't refresh stun if already stunned (standard game logic in combat-manager)
    if (!target.stunned) {
        target.stunned = true;
        target.stunned_eras = duration || 1;
        if (typeof broadcastDataUpdate === 'function') broadcastDataUpdate();
    }
}

/**
 * Clears the "stun" effect from a combatant.
 * @param {object} target - The combatant object
 */
export function clearStunEffect(target) {
    if (!target) return;
    target.stunned = false;
    target.stunned_eras = 0;
}

/**
 * Centralized dispatcher for applying combat effects from attacks.
 * Handles the chance roll and routes to the specific effect helper.
 * @param {object} target - The combatant being hit
 * @param {object} effect - The effect definition { type, chance, duration }
 * @param {function} [broadcastDataUpdate] - Optional callback for UI updates
 */
export function applyAttackEffect(target, effect, broadcastDataUpdate) {
    if (!target || !effect || !effect.type || target.hp <= 0) return;

    const roll = Math.random() * 100;
    if (roll >= (effect.chance || 100)) return;

    switch (effect.type.toLowerCase()) {
        case 'stun':
            applyStunEffect(target, effect.duration, broadcastDataUpdate);
            break;
        case 'bleed':
            applyBleedEffect(target, effect.duration, broadcastDataUpdate);
            break;
        case 'energy drain':
        case 'energy_drain':
            applyEnergyDrainEffect(target, effect.duration, broadcastDataUpdate);
            break;
        default:
            console.warn(`Unknown effect type: ${effect.type}`);
            break;
    }
}
