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

/**
 * Clears the "drained" effect from a combatant (if eras expired).
 * @param {object} target - The combatant object
 */
export function clearDrainedEffect(target) {
    if (!target) return;
    target.drained = false;
    target.drained_eras = 0;
}
