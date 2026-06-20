import React from 'react';
import cardManager, {
    buildPlayerDeck,
    buildReaperDeck,
    reaperStartingSoul,
} from '../../utils/card-manager';
import * as images from '../../utils/images';
import '../../styles/CardDuel.css';

// ─── Sphinx riddle pool ───────────────────────────────────────────────────────
const RIDDLES = [
    { q: 'I have cities but no houses, mountains but no trees, and water but no fish. What am I?', choices: ['A map', 'A dream', 'A mirror', 'A cloud'], answer: 0 },
    { q: 'The more you take, the more you leave behind. What am I?', choices: ['Shadows', 'Footsteps', 'Time', 'Regrets'], answer: 1 },
    { q: 'I speak without a mouth and hear without ears. I have no body but come alive with the wind. What am I?', choices: ['Fire', 'Water', 'An echo', 'A spirit'], answer: 2 },
    { q: 'I can be cracked, made, told, and played. What am I?', choices: ['A joke', 'An egg', 'A spell', 'A promise'], answer: 0 },
    { q: 'What has hands but cannot clap?', choices: ['A ghost', 'A statue', 'A clock', 'A door'], answer: 2 },
    { q: 'What gets wetter as it dries?', choices: ['Sand', 'Stone', 'A towel', 'Paper'], answer: 2 },
    { q: 'I am always hungry. I must always be fed. The finger I touch will soon turn red. What am I?', choices: ['A blade', 'Fire', 'Acid', 'A curse'], answer: 1 },
    { q: 'The more of me there is, the less you see. What am I?', choices: ['Rain', 'Darkness', 'Fog', 'Silence'], answer: 1 },
    { q: 'I have a head and a tail but no body. What am I?', choices: ['A coin', 'A snake', 'A comet', 'A key'], answer: 0 },
    { q: 'What runs but never walks, has a mouth but never talks?', choices: ['A ghost', 'Wind', 'A river', 'A shadow'], answer: 2 },
];

function pickRiddle() {
    return RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
}

// ─── Global skill helpers ─────────────────────────────────────────────────────
function hasGlobalSkill(crew, skillKey, minLevel = 1) {
    if (!Array.isArray(crew)) return false;
    return crew.some(m => {
        if (!m || !Array.isArray(m.globalSkills)) return false;
        const skill = m.globalSkills.find(s => (typeof s === 'string' ? s : s.key) === skillKey);
        if (!skill) return false;
        const lvl = typeof skill === 'string' ? 1 : (skill.level || 1);
        return lvl >= minLevel;
    });
}


class CardDuel extends React.Component {
    constructor(props) {
        super(props);

        const crew = props.crew || [];
        const meta = props.meta || {};
        const depth = props.dungeonDepth || 1;
        const activeEchoIds = (meta.echoCards || []).slice(0, 4);

        // Apply global skill passives
        const extraSoul = hasGlobalSkill(crew, 'strong_resolve') ? 5 : 0;
        const baseEnergy = hasGlobalSkill(crew, 'focused_rest') ? 4 : 3;
        const extraEnergy = hasGlobalSkill(crew, 'arcane_sense') ? 1 : 0;
        const drawBonusGlobal = hasGlobalSkill(crew, 'awake_refreshed') ? 1 : 0;

        const playerDeck = buildPlayerDeck(crew, activeEchoIds);
        const reaperDeck = buildReaperDeck(depth);
        const reaperSoul = reaperStartingSoul(depth);
        const playerSoul = 20 + (crew.filter(m => m && !m.dead).length * 2) + extraSoul;

        this.state = {
            playerDeck,
            playerHand: [],
            playerDiscard: [],
            playerSoul,
            playerMaxSoul: playerSoul,
            playerEnergy: baseEnergy + extraEnergy,
            playerBaseEnergy: baseEnergy + extraEnergy,
            playerEnergyPenaltyNextTurn: 0,
            playerBlockTurns: 0,
            playerDodgeTurns: 0,
            playerBonusAtk: 0,

            reaperDeck,
            reaperHand: [],
            reaperDiscard: [],
            reaperSoul,
            reaperMaxSoul: reaperSoul,
            reaperEnergy: 3,
            reaperStunTurns: 0,
            reaperSkipNextCard: false,
            reaperEnergyPenaltyNextTurn: 0,
            reaperShieldNextAtk: 0,

            turn: 'player',
            turnNumber: 1,
            phase: 'draw',   // draw | play | reaper | end
            message: '',
            log: ['The duel begins. Face the Reaper...'],
            gameOver: null,  // null | 'victory' | 'defeat'

            // Sphinx riddle
            riddleActive: null,    // { riddle, card }
            riddleAnswer: null,    // index of chosen answer

            // UI feedback
            shakePlayer: false,
            shakeReaper: false,
            playedCards: [],        // cards played this turn for animation
            damageNumbers: [],      // [{id, value, x}]

            // Iron Will passive — one-time survive at 1 HP
            ironWillUsed: false,
            showForfeitModal: false,

            isAiThinking: false,

            // Global skill flags (computed once)
            hasIronWill:     hasGlobalSkill(crew, 'iron_will'),
            hasMendBonus:    hasGlobalSkill(crew, 'mend'),
            hasRevive:       hasGlobalSkill(crew, 'revive'),
            hasAwakeRefreshed: drawBonusGlobal > 0,
            hasBloodhound:   hasGlobalSkill(crew, 'bloodhound'),
            hasSoulTithe:    hasGlobalSkill(crew, 'soul_tithe'),
            hasSpiritSight:  hasGlobalSkill(crew, 'spirit_sight'),
            hasKeenEye:      hasGlobalSkill(crew, 'keen_eye'),
            reviveUsed:      false,
            bloodhoundReveal: null,
        };

        this.logRef = React.createRef();
    }

    componentDidMount() {
        this.beginTurn();
    }

    // ─── Logging ──────────────────────────────────────────────────────────────
    addLog = (msg) => {
        this.setState(prev => ({ log: [...prev.log.slice(-60), msg], message: msg }));
    }

    componentDidUpdate(_, prevState) {
        if (prevState.log.length !== this.state.log.length && this.logRef.current) {
            this.logRef.current.scrollTop = this.logRef.current.scrollHeight;
        }
    }

    // ─── Turn management ──────────────────────────────────────────────────────
    beginTurn = () => {
        this.setState(prev => {
            const deck = prev.playerDeck.slice();
            let discard = prev.playerDiscard.slice();
            let hand = prev.playerHand.slice();

            // Reset block/dodge (they carry over only if specifically extending)
            const blockTurns = Math.max(0, prev.playerBlockTurns - (prev.turn === 'player' ? 0 : 1));
            const dodgeTurns = Math.max(0, prev.playerDodgeTurns - (prev.turn === 'player' ? 0 : 1));

            // Energy reset + penalty from last turn
            const energy = Math.max(0, prev.playerBaseEnergy - prev.playerEnergyPenaltyNextTurn);

            // Draw to hand of 3 (+global bonus)
            const drawTarget = 3 + (prev.hasAwakeRefreshed ? 1 : 0);
            const toDraw = Math.max(0, drawTarget - hand.length);
            for (let i = 0; i < toDraw; i++) {
                if (deck.length === 0) {
                    if (discard.length > 0) {
                        const newDeck = cardManager.shuffle(discard);
                        discard = [];
                        deck.push(...newDeck);
                    } else break;
                }
                hand.push(deck.splice(0, 1)[0]);
            }

            return {
                playerDeck: deck,
                playerHand: hand,
                playerDiscard: discard,
                playerEnergy: energy,
                playerEnergyPenaltyNextTurn: 0,
                playerBlockTurns: blockTurns,
                playerDodgeTurns: dodgeTurns,
                playerBonusAtk: 0,
                phase: 'play',
                turn: 'player',
                playedCards: [],
                message: `Turn ${prev.turnNumber} — your move.`,
            };
        }, () => {
            this.addLog(`─── Turn ${this.state.turnNumber} ───`);

            // Bloodhound: reveal what the Reaper will play
            if (this.state.hasBloodhound && this.state.reaperHand.length > 0) {
                const topCard = this.state.reaperHand[0];
                if (topCard) this.setState({ bloodhoundReveal: topCard.name });
            }
        });
    }

    endPlayerTurn = () => {
        if (this.state.phase !== 'play' || this.state.gameOver) return;
        this.addLog('Player ends turn.');

        // Calculate player's total ATK this turn
        const totalAtk = this.state.playerBonusAtk;
        this.setState({ phase: 'reaper', playerBonusAtk: 0, bloodhoundReveal: null }, () => {
            this.reaperTurn(totalAtk);
        });
    }

    // ─── Play a card ──────────────────────────────────────────────────────────
    playCard = (card) => {
        if (this.state.phase !== 'play' || this.state.gameOver) return;
        if (this.state.playerEnergy < card.energyCost) return;

        const newHand = this.state.playerHand.filter(c => c.id !== card.id);
        let newEnergy = this.state.playerEnergy - card.energyCost;
        let newSoul = this.state.playerSoul;
        let newBonusAtk = this.state.playerBonusAtk;
        let reaperSoul = this.state.reaperSoul;
        let reaperStun = this.state.reaperStunTurns;
        let reaperSkip = this.state.reaperSkipNextCard;
        let reaperEnergyPenalty = this.state.reaperEnergyPenaltyNextTurn;
        let reaperShield = this.state.reaperShieldNextAtk;
        let playerBlockTurns = this.state.playerBlockTurns;
        let playerDodgeTurns = this.state.playerDodgeTurns;
        let newDeck = this.state.playerDeck.slice();
        let newHand2 = newHand.slice();
        let newDiscard = this.state.playerDiscard.slice();
        let shakeReaper = false;

        const eff = card.effect || {};
        let logMsg = `You play ${card.name}.`;

        // ── Champion card abilities ───────────────────────────────────────────
        if (card.type === 'champion') {
            const ability = card.ability || {};
            newBonusAtk += card.atk || 0;

            switch (ability.key) {
                case 'shield_wall':
                    reaperShield = Math.max(reaperShield, 2);
                    logMsg = `${card.name} deploys Shield Wall! (-2 to Reaper's next attack)`;
                    break;
                case 'pin_shot':
                    reaperSkip = true;
                    logMsg = `${card.name} fires Pin Shot! (Reaper skips 1 card)`;
                    break;
                case 'arcane_burst':
                    newBonusAtk += 3;
                    logMsg = `${card.name} channels Arcane Burst! (+3 ATK)`;
                    break;
                case 'inner_focus':
                    newEnergy = Math.min(newEnergy + 1, this.state.playerBaseEnergy);
                    logMsg = `${card.name} uses Inner Focus. (+1 Energy back)`;
                    break;
                case 'rampage': {
                    const bonus = newSoul <= 15 ? 4 : 2;
                    newBonusAtk += bonus;
                    logMsg = `${card.name} rampages! (+${bonus} ATK)`;
                    break;
                }
                case 'mend': {
                    const healAmt = this.state.hasMendBonus ? 4 : 2;
                    newSoul = Math.min(this.state.playerMaxSoul, newSoul + healAmt);
                    logMsg = `${card.name} uses Mend. (+${healAmt} Soul)`;
                    break;
                }
                case 'echo_call': {
                    const echoIdx = newDeck.findIndex(c => c.type === 'echo');
                    if (echoIdx !== -1) {
                        newHand2 = [...newHand2, newDeck.splice(echoIdx, 1)[0]];
                        logMsg = `${card.name} calls forth an Echo card!`;
                    } else {
                        logMsg = `${card.name} searches… no Echo found.`;
                    }
                    break;
                }
                case 'gadget_bomb':
                    reaperSoul = Math.max(0, reaperSoul - 3);
                    reaperShield = Math.max(reaperShield, 1);
                    shakeReaper = true;
                    logMsg = `${card.name} throws a Gadget Bomb! (-3 Reaper Soul)`;
                    break;
                default:
                    logMsg = `${card.name} charges into battle! (+${card.atk || 0} ATK)`;
                    break;
            }
        }
        // ── Echo card effects ─────────────────────────────────────────────────
        else if (card.type === 'echo') {
            // Soul Tithe: playing an echo restores 1 Soul
            if (this.state.hasSoulTithe) {
                newSoul = Math.min(this.state.playerMaxSoul, newSoul + 1);
            }

            switch (eff.type) {
                case 'damage':
                    reaperSoul = Math.max(0, reaperSoul - eff.amount);
                    shakeReaper = true;
                    logMsg = `${card.name} deals ${eff.amount} damage!`;
                    break;
                case 'piercing_damage':
                    reaperSoul = Math.max(0, reaperSoul - eff.amount);
                    shakeReaper = true;
                    logMsg = `${card.name} pierces through! ${eff.amount} damage (ignoring defenses).`;
                    break;
                case 'heal':
                    newSoul = Math.min(this.state.playerMaxSoul, newSoul + eff.amount);
                    logMsg = `${card.name} restores ${eff.amount} Soul.`;
                    break;
                case 'lifesteal':
                    reaperSoul = Math.max(0, reaperSoul - eff.damage);
                    newSoul = Math.min(this.state.playerMaxSoul, newSoul + eff.heal);
                    shakeReaper = true;
                    logMsg = `${card.name} drains ${eff.damage} from Reaper, restores ${eff.heal} to you.`;
                    break;
                case 'block_damage':
                    playerBlockTurns = eff.turns || 1;
                    logMsg = `${card.name} blocks all Reaper damage for ${eff.turns} turn(s).`;
                    break;
                case 'dodge_all':
                    playerDodgeTurns = eff.turns || 1;
                    logMsg = `${card.name} — you dodge everything for ${eff.turns} turn(s).`;
                    break;
                case 'weaken_reaper':
                    reaperEnergyPenalty += (eff.energyLoss || 1);
                    logMsg = `${card.name} weakens the Reaper! (-${eff.energyLoss} Energy next turn).`;
                    break;
                case 'stun_reaper':
                    reaperStun += (eff.turns || 1);
                    logMsg = `${card.name} stuns the Reaper for ${eff.turns} turn(s)!`;
                    break;
                case 'discard_reaper_card':
                    reaperSkip = true;
                    logMsg = `${card.name} hexes the Reaper — their next card is discarded!`;
                    break;
                case 'damage_and_shield':
                    reaperSoul = Math.max(0, reaperSoul - eff.damage);
                    reaperShield = Math.max(reaperShield, eff.shield || 0);
                    shakeReaper = true;
                    logMsg = `${card.name} deals ${eff.damage} and reduces next Reaper attack by ${eff.shield}.`;
                    break;
                case 'draw':
                    for (let i = 0; i < (eff.amount || 1); i++) {
                        if (newDeck.length === 0 && newDiscard.length > 0) {
                            const reshuffled = cardManager.shuffle(newDiscard);
                            newDiscard = [];
                            newDeck.push(...reshuffled);
                        }
                        if (newDeck.length > 0) newHand2 = [...newHand2, newDeck.splice(0, 1)[0]];
                    }
                    logMsg = `${card.name} — draw ${eff.amount} card(s).`;
                    break;
                case 'riddle':
                    // Open riddle modal — resolve on answer
                    this.setState({
                        playerHand: newHand2,
                        playerEnergy: newEnergy,
                        playerDiscard: [...newDiscard, card],
                        riddleActive: { riddle: pickRiddle(), card },
                        reaperSoul, reaperStunTurns: reaperStun, reaperSkipNextCard: reaperSkip,
                        reaperEnergyPenaltyNextTurn: reaperEnergyPenalty,
                        reaperShieldNextAtk: reaperShield,
                        playerSoul: newSoul, playerBonusAtk: newBonusAtk,
                        playerBlockTurns, playerDodgeTurns,
                        playerDeck: newDeck,
                    });
                    this.addLog(`${card.name} — a riddle appears...`);
                    return;
                default:
                    logMsg = `${card.name} is played.`;
            }
        }

        newDiscard = [...newDiscard, card];

        this.setState({
            playerHand: newHand2,
            playerEnergy: newEnergy,
            playerDiscard: newDiscard,
            playerDeck: newDeck,
            playerSoul: newSoul,
            playerBonusAtk: newBonusAtk,
            reaperSoul,
            reaperStunTurns: reaperStun,
            reaperSkipNextCard: reaperSkip,
            reaperEnergyPenaltyNextTurn: reaperEnergyPenalty,
            reaperShieldNextAtk: reaperShield,
            playerBlockTurns,
            playerDodgeTurns,
            shakeReaper,
        }, () => {
            if (shakeReaper) setTimeout(() => this.setState({ shakeReaper: false }), 400);
            this.addLog(logMsg);
            this.checkVictory();
        });
    }

    // ─── Sphinx riddle resolution ─────────────────────────────────────────────
    resolveRiddle = (choiceIdx) => {
        const { riddleActive } = this.state;
        if (!riddleActive) return;
        const { riddle, card } = riddleActive;
        const correct = choiceIdx === riddle.answer;
        const dmg = correct ? (card.effect.successDamage || 8) : (card.effect.failDamage || 2);

        const newReaperSoul = Math.max(0, this.state.reaperSoul - dmg);
        const msg = correct
            ? `Correct! The Sphinx Riddle deals ${dmg} damage!`
            : `Wrong! The Sphinx Riddle deals only ${dmg} damage.`;

        this.setState({
            riddleActive: null,
            riddleAnswer: null,
            reaperSoul: newReaperSoul,
            shakeReaper: true,
        }, () => {
            setTimeout(() => this.setState({ shakeReaper: false }), 400);
            this.addLog(msg);
            this.checkVictory();
        });
    }

    // ─── Reaper AI turn ───────────────────────────────────────────────────────
    reaperTurn = async (pendingPlayerDamage) => {
        this.setState({ isAiThinking: true });

        // First: apply pending player damage from cards played this turn
        let reaperSoul = this.state.reaperSoul;

        // Apply champion ATK + any bonus
        if (pendingPlayerDamage > 0) {
            const blocked = this.state.reaperShieldNextAtk;
            const actualDmg = Math.max(0, pendingPlayerDamage - blocked);
            reaperSoul = Math.max(0, reaperSoul - actualDmg);
            if (actualDmg > 0) this.addLog(`Your crew deals ${actualDmg} damage to the Reaper!`);
            if (blocked > 0) this.addLog(`Reaper's shield absorbs ${blocked} damage.`);
        }

        await new Promise(r => setTimeout(r, 600));

        if (reaperSoul <= 0) {
            this.setState({ reaperSoul: 0, isAiThinking: false, reaperShieldNextAtk: 0 });
            this.checkVictory();
            return;
        }

        this.setState({ reaperSoul, reaperShieldNextAtk: 0 });

        // Check for stun
        if (this.state.reaperStunTurns > 0) {
            this.addLog('The Reaper is stunned! They skip their turn.');
            await new Promise(r => setTimeout(r, 800));
            this.setState(prev => ({ reaperStunTurns: Math.max(0, prev.reaperStunTurns - 1), isAiThinking: false }));
            this.beginNextTurn();
            return;
        }

        // Draw reaper hand
        let reaperHand = this.state.reaperHand.slice();
        let reaperDeck = this.state.reaperDeck.slice();
        let reaperDiscard = this.state.reaperDiscard.slice();

        const drawCount = 2;
        for (let i = 0; i < drawCount; i++) {
            if (reaperDeck.length === 0 && reaperDiscard.length > 0) {
                reaperDeck = cardManager.shuffle(reaperDiscard);
                reaperDiscard = [];
            }
            if (reaperDeck.length > 0) reaperHand.push(reaperDeck.splice(0, 1)[0]);
        }

        const baseEnergy = Math.max(0, 3 - this.state.reaperEnergyPenaltyNextTurn);
        let reaperEnergy = baseEnergy;
        this.setState({ reaperHand, reaperDeck, reaperDiscard, reaperEnergy, reaperEnergyPenaltyNextTurn: 0 });

        await new Promise(r => setTimeout(r, 500));

        // Reaper plays cards
        let playerSoul = this.state.playerSoul;
        let shieldRemaining = 0; // eslint-disable-line no-unused-vars
        let skipNextCard = this.state.reaperSkipNextCard;

        for (const card of [...reaperHand]) {
            if (reaperEnergy < (card.energyCost || 1)) continue;
            if (skipNextCard) {
                skipNextCard = false;
                this.addLog(`${card.name} is intercepted — discarded before play!`);
                reaperDiscard.push(card);
                reaperHand = reaperHand.filter(c => c.id !== card.id);
                reaperEnergy -= (card.energyCost || 1);
                continue;
            }

            reaperEnergy -= (card.energyCost || 1);
            reaperHand = reaperHand.filter(c => c.id !== card.id);
            reaperDiscard.push(card);

            this.addLog(`Reaper plays ${card.name}…`);
            await new Promise(r => setTimeout(r, 700));

            const eff = card.effect || {};
            switch (eff.type) {
                case 'damage': {
                    const rawDmg = eff.amount || 0;
                    if (this.state.playerDodgeTurns > 0 || this.state.playerBlockTurns > 0) {
                        this.addLog(`${card.name} — you dodge/block the damage!`);
                    } else {
                        // Apply dodge chance from champion cards in play
                        const dodgePct = this.state.hasKeenEye ? 10 : 0;
                        if (dodgePct > 0 && Math.random() * 100 < dodgePct) {
                            this.addLog(`${card.name} — a crew member deflects the blow!`);
                        } else {
                            playerSoul = Math.max(0, playerSoul - rawDmg);
                            this.setState({ shakePlayer: true });
                            setTimeout(() => this.setState({ shakePlayer: false }), 400);
                            this.addLog(`Reaper deals ${rawDmg} damage! (Your Soul: ${playerSoul})`);
                        }
                    }
                    break;
                }
                case 'shield':
                    shieldRemaining += (eff.amount || 0);
                    this.addLog(`Reaper raises a shield — blocks ${eff.amount} incoming.`);
                    break;
                case 'drain_energy':
                    this.setState(prev => ({ playerEnergyPenaltyNextTurn: prev.playerEnergyPenaltyNextTurn + (eff.amount || 1) }));
                    this.addLog(`Reaper Withers you — lose ${eff.amount} Energy next turn.`);
                    break;
                case 'damage_per_discard': {
                    const total = (reaperDiscard.length - 1) * (eff.amountPerCard || 2);
                    if (total > 0 && this.state.playerBlockTurns <= 0 && this.state.playerDodgeTurns <= 0) {
                        playerSoul = Math.max(0, playerSoul - total);
                        this.setState({ shakePlayer: true });
                        setTimeout(() => this.setState({ shakePlayer: false }), 400);
                        this.addLog(`Spectral Army deals ${total} damage!`);
                    }
                    break;
                }
                case 'heal': {
                    const newRSoul = Math.min(this.state.reaperMaxSoul, reaperSoul + (eff.amount || 0));
                    reaperSoul = newRSoul;
                    this.setState({ reaperSoul: newRSoul });
                    this.addLog(`Reaper harvests souls — restores ${eff.amount} Soul.`);
                    break;
                }
                case 'skip_player_card':
                    this.addLog(`Curse of Binding! One of your cards is locked this turn.`);
                    break;
                default:
                    break;
            }
        }

        this.setState({
            playerSoul,
            reaperHand: [],
            reaperDeck,
            reaperDiscard,
            reaperEnergy,
            reaperSkipNextCard: skipNextCard,
            isAiThinking: false,
        }, () => {
            // Check for Iron Will
            if (playerSoul <= 0 && this.state.hasIronWill && !this.state.ironWillUsed) {
                this.setState({ playerSoul: 1, ironWillUsed: true });
                this.addLog('Iron Will activates! You survive at 1 Soul!');
            } else {
                this.checkVictory();
            }
            if (this.state.gameOver !== 'defeat') {
                this.beginNextTurn();
            }
        });
    }

    beginNextTurn = () => {
        this.setState(prev => ({
            turnNumber: prev.turnNumber + 1,
            playerBlockTurns: Math.max(0, prev.playerBlockTurns - 1),
            playerDodgeTurns: Math.max(0, prev.playerDodgeTurns - 1),
        }), () => {
            // Revive: if crew champion was discarded, put it back in deck once
            if (this.state.hasRevive && !this.state.reviveUsed) {
                const discardedChamp = this.state.playerDiscard.find(c => c.type === 'champion');
                if (discardedChamp) {
                    this.setState(prev => ({
                        playerDeck: [discardedChamp, ...prev.playerDeck],
                        playerDiscard: prev.playerDiscard.filter(c => c.id !== discardedChamp.id),
                        reviveUsed: true,
                    }));
                    this.addLog(`Revive: ${discardedChamp.name} returns to your deck!`);
                }
            }
            this.beginTurn();
        });
    }

    // ─── Victory check ────────────────────────────────────────────────────────
    checkVictory = () => {
        if (this.state.playerSoul <= 0 && !this.state.gameOver) {
            this.setState({ gameOver: 'defeat' });
            this.addLog('Your Soul is extinguished. The Reaper triumphs.');
            if (!this.props.scrimmage && this.props.inventoryManager) {
                this.props.inventoryManager.gold = Math.floor((this.props.inventoryManager.gold || 0) * 0.75);
                if (this.props.saveUserData) this.props.saveUserData();
            }
            setTimeout(() => {
                if (this.props.onFinish) this.props.onFinish({ winner: 'reaper' });
            }, 2000);
        } else if (this.state.reaperSoul <= 0 && !this.state.gameOver) {
            this.setState({ gameOver: 'victory' });
            this.addLog('The Reaper is vanquished! Your crew prevails!');
        }
    }

    // ─── Rendering ────────────────────────────────────────────────────────────
    renderSoulBar = (current, max, isPlayer) => {
        const pct = Math.max(0, (current / max) * 100);
        const color = isPlayer
            ? `hsl(${(pct * 1.2).toFixed(0)}, 70%, 50%)`
            : '#c94040';
        return (
            <div className="pe-soul-bar-wrap">
                <div className="pe-soul-bar-bg">
                    <div className="pe-soul-bar-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
                <div className="pe-soul-label">{current} / {max}</div>
            </div>
        );
    }

    renderChampionCard = (card, fromHand = true) => {
        const canPlay = fromHand && this.state.playerEnergy >= card.energyCost && this.state.phase === 'play' && !this.state.gameOver;
        const portrait = card.portrait;
        return (
            <div
                key={card.id}
                className={`pe-card pe-card--champion ${canPlay ? 'pe-card--playable' : ''} ${fromHand ? '' : 'pe-card--field'}`}
                onClick={() => canPlay && this.playCard(card)}
                title={card.ability ? card.ability.desc : ''}
            >
                <div className="pe-card-cost">{card.energyCost}</div>
                <div className="pe-card-portrait" style={portrait ? { backgroundImage: `url(${portrait})` } : {}}>
                    {!portrait && <span className="pe-card-class-emoji" role="img" aria-label="class emoji">{CLASS_EMOJI[card.memberType] || '🗡'}</span>}
                </div>
                <div className="pe-card-body">
                    <div className="pe-card-name">{card.name}</div>
                    <div className="pe-card-class-badge">{(card.memberType || '').toUpperCase()}</div>
                    <div className="pe-card-stats-row">
                        <span className="pe-stat pe-stat--atk"><span role="img" aria-label="attack">⚔</span> {card.atk}</span>
                        {card.dodgeChance > 0 && <span className="pe-stat pe-stat--dex"><span role="img" aria-label="dodge chance">⚡</span> {card.dodgeChance}%</span>}
                    </div>
                    {card.ability && (
                        <div className="pe-card-ability">
                            <span className="pe-ability-name">{card.ability.name}</span>
                            <span className="pe-ability-desc">{card.ability.desc}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    renderEchoCard = (card, fromHand = true) => {
        const canPlay = fromHand && this.state.playerEnergy >= card.energyCost && this.state.phase === 'play' && !this.state.gameOver;
        const artKey = card.art;
        const art = images[artKey] || null;
        const isNeedRiddle = card.effect && card.effect.type === 'riddle';
        return (
            <div
                key={card.id}
                className={`pe-card pe-card--echo ${canPlay ? 'pe-card--playable' : ''}`}
                onClick={() => canPlay && this.playCard(card)}
            >
                <div className="pe-card-cost">{card.energyCost}</div>
                <div className="pe-card-portrait pe-card-portrait--echo" style={art ? { backgroundImage: `url(${art})` } : {}}>
                    {!art && <span className="pe-echo-glyph">◈</span>}
                </div>
                <div className="pe-card-body">
                    <div className="pe-card-name">{card.name}</div>
                    <div className="pe-card-class-badge pe-badge--echo">ECHO</div>
                    <div className="pe-card-text">{card.text}</div>
                    {isNeedRiddle && <div className="pe-riddle-hint"><span role="img" aria-label="question mark">❓</span> Answer a riddle</div>}
                </div>
            </div>
        );
    }

    renderCard = (card, fromHand = true) => {
        if (!card) return null;
        if (card.type === 'champion') return this.renderChampionCard(card, fromHand);
        if (card.type === 'echo')     return this.renderEchoCard(card, fromHand);
        return null;
    }

    renderRiddleModal = () => {
        const { riddleActive } = this.state;
        if (!riddleActive) return null;
        const { riddle } = riddleActive;
        return (
            <div className="pe-riddle-backdrop">
                <div className="pe-riddle-modal">
                    <div className="pe-riddle-header">
                        <span className="pe-riddle-sphinx" role="img" aria-label="sphinx">🦁</span>
                        <h2>The Sphinx Speaks</h2>
                    </div>
                    <div className="pe-riddle-question">{riddle.q}</div>
                    <div className="pe-riddle-choices">
                        {riddle.choices.map((choice, idx) => (
                            <button
                                key={idx}
                                className="pe-riddle-choice"
                                onClick={() => this.resolveRiddle(idx)}
                            >
                                {choice}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    renderVictoryScreen = () => {
        const { gameOver } = this.state;
        if (!gameOver) return null;
        const isVictory = gameOver === 'victory';
        return (
            <div className={`pe-end-screen ${isVictory ? 'pe-end--victory' : 'pe-end--defeat'}`}>
                <div className="pe-end-modal">
                    <div className="pe-end-icon">
                        {isVictory ? (
                            <span role="img" aria-label="victory">✨</span>
                        ) : (
                            <span role="img" aria-label="defeat">💀</span>
                        )}
                    </div>
                    <h2>{isVictory ? 'VICTORY' : 'DEFEATED'}</h2>
                    <p>{isVictory
                        ? 'The Reaper crumbles. Your crew lives to delve deeper.'
                        : (this.props.scrimmage ? 'The Reaper wins this scrimmage.' : 'You lost. 25% of your gold is forfeit.')}</p>
                    <button
                        className="pe-btn pe-btn--primary"
                        onClick={() => this.props.onFinish && this.props.onFinish({ winner: isVictory ? 'player' : 'reaper' })}
                    >
                        {isVictory ? 'Return' : 'Accept Defeat'}
                    </button>
                </div>
            </div>
        );
    }

    render() {
        const {
            playerHand, playerSoul, playerMaxSoul, playerEnergy, playerBaseEnergy,
            reaperSoul, reaperMaxSoul, reaperHand,
            phase, turnNumber, log, shakePlayer, shakeReaper,
            gameOver, isAiThinking, bloodhoundReveal,
            playerBlockTurns, playerDodgeTurns, reaperStunTurns, reaperSkipNextCard,
        } = this.state;

        const canEndTurn = phase === 'play' && !gameOver && !isAiThinking;
        const bgImg = images.card_game_background ? `url(${images.card_game_background})` : undefined;

        return (
            <div className="pe-root" style={bgImg ? { backgroundImage: bgImg } : {}}>
                <div className="pe-overlay" />
                <div className="pe-layout">

                    {/* ── LEFT SIDEBAR: Log + Controls ── */}
                    <div className="pe-sidebar">
                        <div className="pe-sidebar-title">Pyre &amp; Echo</div>
                        <div className="pe-turn-badge">
                            Turn {turnNumber} · {isAiThinking ? 'REAPER' : 'YOUR TURN'}
                        </div>

                        {bloodhoundReveal && (
                            <div className="pe-bloodhound-hint">
                                <span role="img" aria-label="dog">🐕</span> Bloodhound: Reaper has <em>{bloodhoundReveal}</em>
                            </div>
                        )}

                        {/* Status badges */}
                        <div className="pe-status-badges">
                            {playerBlockTurns > 0  && <div className="pe-badge pe-badge--block"><span role="img" aria-label="shield">🛡</span> Block ({playerBlockTurns}t)</div>}
                            {playerDodgeTurns > 0  && <div className="pe-badge pe-badge--dodge"><span role="img" aria-label="lightning">⚡</span> Dodge ({playerDodgeTurns}t)</div>}
                            {reaperStunTurns > 0   && <div className="pe-badge pe-badge--stun"><span role="img" aria-label="snowflake">❄</span> Reaper Stunned ({reaperStunTurns}t)</div>}
                            {reaperSkipNextCard     && <div className="pe-badge pe-badge--skip"><span role="img" aria-label="prohibited">🚫</span> Skip Reaper Card</div>}
                        </div>

                        <button
                            className="pe-btn pe-btn--end-turn"
                            disabled={!canEndTurn}
                            onClick={this.endPlayerTurn}
                        >
                            End Turn
                        </button>

                        <button
                            className="pe-btn pe-btn--forfeit"
                            onClick={() => this.setState({ showForfeitModal: true })}
                        >
                            Forfeit
                        </button>

                        {/* Event log */}
                        <div className="pe-log" ref={this.logRef}>
                            {log.map((l, i) => (
                                <div key={i} className="pe-log-entry">{l}</div>
                            ))}
                        </div>
                    </div>

                    {/* ── CENTER: Battle Arena ── */}
                    <div className="pe-arena">

                        {/* Reaper Zone */}
                        <div className={`pe-combatant pe-combatant--reaper ${shakeReaper ? 'pe-shake' : ''}`}>
                            <div className="pe-combatant-header">
                                <div className="pe-combatant-name">THE REAPER</div>
                                <div className="pe-energy-row">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className={`pe-energy-pip ${i < this.state.reaperEnergy ? 'pe-energy-pip--filled' : ''}`} />
                                    ))}
                                </div>
                            </div>
                            {this.renderSoulBar(reaperSoul, reaperMaxSoul, false)}
                            <div className="pe-reaper-figure">
                                <div className="pe-reaper-portrait" style={images.reaper_card_back ? { backgroundImage: `url(${images.reaper_card_back})` } : {}}>
                                    <div className="pe-reaper-glow" />
                                </div>
                                {/* Reaper hand — face down */}
                                <div className="pe-reaper-hand">
                                    {reaperHand.map((_, i) => (
                                        <div key={i} className="pe-card-back" style={images.reaper_card_back ? { backgroundImage: `url(${images.reaper_card_back})` } : {}} />
                                    ))}
                                    {reaperHand.length === 0 && <span className="pe-no-cards">—</span>}
                                </div>
                            </div>
                        </div>

                        {/* Battle message divider */}
                        <div className="pe-message-strip">
                            <div className="pe-message-text">{this.state.message}</div>
                        </div>

                        {/* Player Zone */}
                        <div className={`pe-combatant pe-combatant--player ${shakePlayer ? 'pe-shake' : ''}`}>
                            <div className="pe-combatant-header">
                                <div className="pe-combatant-name">YOUR CREW</div>
                                <div className="pe-energy-row">
                                    {[...Array(playerBaseEnergy)].map((_, i) => (
                                        <div key={i} className={`pe-energy-pip ${i < playerEnergy ? 'pe-energy-pip--filled pe-energy-pip--player' : ''}`} />
                                    ))}
                                    <span className="pe-energy-label">{playerEnergy} Energy</span>
                                </div>
                            </div>
                            {this.renderSoulBar(playerSoul, playerMaxSoul, true)}
                        </div>
                    </div>

                    {/* ── RIGHT: Player Hand ── */}
                    <div className="pe-hand-panel">
                        <div className="pe-hand-title">Your Hand ({playerHand.length})</div>
                        <div className="pe-hand-scroll">
                            {playerHand.map(card => this.renderCard(card, true))}
                            {playerHand.length === 0 && (
                                <div className="pe-empty-hand">No cards in hand.</div>
                            )}
                        </div>
                        <div className="pe-deck-info">
                            <span>Deck: {this.state.playerDeck.length}</span>
                            <span>Discard: {this.state.playerDiscard.length}</span>
                        </div>
                    </div>
                </div>

                {this.renderRiddleModal()}
                {this.renderForfeitModal()}
                {this.renderVictoryScreen()}
            </div>
        );
    }
}

// ─── Forfeit confirm modal ────────────────────────────────────────────────────
CardDuel.prototype.renderForfeitModal = function() {
    if (!this.state.showForfeitModal) return null;
    const isScrimmage = !!this.props.scrimmage;
    return (
        <div className="pe-riddle-backdrop" onClick={e => { if (e.target === e.currentTarget) this.setState({ showForfeitModal: false }); }}>
            <div className="pe-forfeit-modal">
                <div className="pe-forfeit-icon"><span role="img" aria-label="white flag">🏳</span></div>
                <h2 className="pe-forfeit-title">Forfeit the Duel?</h2>
                {isScrimmage ? (
                    <p className="pe-forfeit-body">This is a scrimmage — no penalty applies.</p>
                ) : (
                    <p className="pe-forfeit-body">You will forfeit <span className="pe-forfeit-gold">500 gold</span> to the Reaper.</p>
                )}
                <div className="pe-forfeit-btns">
                    <button
                        className="pe-btn pe-forfeit-cancel"
                        onClick={() => this.setState({ showForfeitModal: false })}
                    >
                        Cancel
                    </button>
                    <button
                        className="pe-btn pe-forfeit-confirm"
                        onClick={() => {
                            this.setState({ showForfeitModal: false });
                            if (!isScrimmage && this.props.inventoryManager) {
                                this.props.inventoryManager.gold = Math.max(0, (this.props.inventoryManager.gold || 0) - 500);
                                if (this.props.saveUserData) this.props.saveUserData();
                            }
                            if (this.props.onClose) this.props.onClose();
                        }}
                    >
                        {isScrimmage ? 'Leave' : 'Forfeit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CLASS_EMOJI = {
    soldier: '🛡', barbarian: '🪓', monk: '🥋', ranger: '🏹',
    wizard: '🔮', sage: '📖', summoner: '💀', engineer: '⚙️',
};

export default CardDuel;
