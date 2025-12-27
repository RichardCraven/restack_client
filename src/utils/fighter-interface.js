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
 * @property {Array<string>} specials
 * @property {Array<string>} attacks
 * @property {Array<string>} passives
 * @property {Array<string>} weaknesses
 * @property {string} description
 * @property {Array<SpecialAction>} specialActions
 * @property {boolean} [actionsTrayExpanded]
 * @property {boolean} [actionMenuTypeExpanded]
 * @property {boolean} [selected]
 * @property {string} [color]
 * @property {Object} [coordinates] - {x: number, y: number}
 * @property {number} [depth]
 * @property {number} [position]
 * @property {number} [manualMovesCurrent]
 * @property {number} [manualMovesTotal]
 * @property {boolean} [dead]
 * @property {boolean} [isLeader]
 * @property {string} [combatStyle]
 */

// Example usage:
// /** @type {Fighter} */
// const wizard = { ... };
