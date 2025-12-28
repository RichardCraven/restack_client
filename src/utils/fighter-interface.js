// src/utils/fighter-interface.js

/**
 * Interface for a Fighter (crew member or monster/minion) in the combat system.
 * This is a JSDoc typedef for IDE/type tooling. For TypeScript, convert to an interface.
 */

/**
 * @typedef {Object} SpecialActionSubtype
 * @property {string} type - The subtype name (e.g., 'magic missile')
 * @property {string} [icon_url] - Icon for the subtype
 * @property {boolean} [available] - If this subtype is available
 * @property {number} [count] - Number of uses or charges
 */

/**
 * @typedef {Object} SpecialActionType
 * @property {string} type - The action type (e.g., 'glyph')
 * @property {string} [text] - Display text
 * @property {string} [icon_url] - Icon for the action
 * @property {SpecialActionSubtype[]} [subTypes] - Subtypes for this action
 */

/**
 * @typedef {Object} SpecialAction
 * @property {SpecialActionType} actionType
 * @property {SpecialActionSubtype} actionSubtype
 * @property {Date|string} startDate
 * @property {Date|string} endDate
 * @property {boolean} available
 * @property {boolean} notified
 */

/**
 * @typedef {Object} Fighter
 * @property {string} image - Fighter class/type (e.g., 'wizard')
 * @property {string} type - Fighter type (e.g., 'wizard')
 * @property {string} name
 * @property {number} id
 * @property {number} level
 * @property {Object} stats - Fighter stats (str, int, dex, vit, fort, hp, atk, baseDef, energy, experience)
 * @property {string} portrait
 * @property {Array} inventory
 * @property {Array<string>} specials - Special abilities (string names; may be objects in future)
 * @property {Array<string>} attacks - Attack abilities (string names; may be objects in future)
 * @property {Array<string>} passives - Passive abilities (string names; may be objects in future)
 * @property {Array<string>} weaknesses - Weaknesses (string names; may be objects in future)
 * @property {string} description
 * @property {Array<SpecialAction>} specialActions - Consumable or time-gated special actions
 * @property {boolean} [actionsTrayExpanded] - UI state: is the actions tray expanded?
 * @property {boolean} [actionMenuTypeExpanded] - UI state: is the action menu type expanded?
 * @property {boolean} [selected] - UI state: is this fighter selected?
 * @property {string} [color] - UI: color for display/highlighting
 * @property {Object} [coordinates] - {x: number, y: number} grid position
 * @property {number} [depth] - Z-depth for rendering
 * @property {number} [position] - Position in party or formation
 * @property {number} [manualMovesCurrent] - Manual moves used this turn
 * @property {number} [manualMovesTotal] - Manual moves allowed per turn
 * @property {boolean} [dead] - Is the fighter dead?
 * @property {boolean} [isLeader] - Is this fighter the party leader?
 * @property {string} [combatStyle]
 */

// Example usage:
// /** @type {Fighter} */
// const wizard = { ... };
