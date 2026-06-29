import React from 'react';
import '../../styles/tower-siege.scss';
import SiegeCombatGrid from '../../components/combat-panes/SiegeCombatGrid';
import { MonsterManager } from '../../utils/monster-manager';

// ── Board constants ──────────────────────────────────────────────────────────
const SIEGE_ROWS = 15;
const SIEGE_COLS = 20;
const SIEGE_TILE_SIZE = 56;
const SIEGE_TILE_BORDER = 1;
const SIEGE_MAX_DEPTH = 19; // column index 0-19

const BOARD_WIDTH  = SIEGE_COLS * (SIEGE_TILE_SIZE + SIEGE_TILE_BORDER);  // 1140px
const BOARD_HEIGHT = SIEGE_ROWS * (SIEGE_TILE_SIZE + SIEGE_TILE_BORDER);  // 855px

// ── Phase sequence timings (ms) ──────────────────────────────────────────────
const PHASE_TIMINGS = {
    empty:     0,
    crew:      600,
    hashmallim: 2200,
    armies:    3800,
    combat:    5600,
};

// ── Default siege army (used when triggered from console) ────────────────────
const DEFAULT_SIEGE_ARMY_TYPES = [
    { type: 'skeleton', id: 'siege_sk_1', label: 'Skeleton' },
    { type: 'skeleton', id: 'siege_sk_2', label: 'Skeleton' },
    { type: 'goblin',   id: 'siege_gb_1', label: 'Goblin'   },
    { type: 'goblin',   id: 'siege_gb_2', label: 'Goblin'   },
    { type: 'mummy',    id: 'siege_mu_1', label: 'Mummy'    },
];

// ── Hashmallim army composition ──────────────────────────────────────────────
const HASHMALLIM_MINION_TYPES = [
    'beholder', 'beholder',
    'beholder_minion', 'beholder_minion', 'beholder_minion',
    'beholder_minion', 'beholder_minion', 'beholder_minion',
];

/**
 * TowerSiege — full-screen large-scale combat event.
 *
 * Lifecycle:
 *  1. Mount → build tile grid, compute board scale, start fade-in sequence
 *  2. Phases: empty → crew → hashmallim → armies → combat
 *  3. Combat runs via CombatManagerRedux (initializeSiegeCombat)
 *  4. Combat ends → show SiegeSummaryPanel → call onSiegeComplete
 */
class TowerSiege extends React.Component {
    constructor(props) {
        super(props);
        this._mm = new MonsterManager();
        this._isMounted = false;
        this._phaseTimers = [];
        this._combatInterval = null;
        this.state = {
            siegePhase: 'empty',   // empty | crew | hashmallim | armies | combat | summary
            combatTiles: [],
            battleData: {},
            showSummaryPanel: false,
            summaryResult: null,   // 'victory' | 'defeat'
            boardScale: 1,
        };
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    componentDidMount() {
        this._isMounted = true;
        this._buildTiles();
        this._updateBoardScale();
        window.addEventListener('resize', this._updateBoardScale);
        this._startFadeInSequence();
    }

    componentWillUnmount() {
        this._isMounted = false;
        this._phaseTimers.forEach(t => clearTimeout(t));
        if (this._combatInterval) clearInterval(this._combatInterval);
        window.removeEventListener('resize', this._updateBoardScale);
    }

    // ── Board setup ──────────────────────────────────────────────────────────

    _buildTiles = () => {
        const tiles = [];
        for (let i = 0; i < SIEGE_ROWS * SIEGE_COLS; i++) {
            tiles.push({ id: i, x: i % SIEGE_COLS, y: Math.floor(i / SIEGE_COLS) });
        }
        this.setState({ combatTiles: tiles });
    };

    _updateBoardScale = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const scaleX = vw < BOARD_WIDTH  ? vw  / BOARD_WIDTH  : 1;
        const scaleY = vh < BOARD_HEIGHT ? vh  / BOARD_HEIGHT : 1;
        const scale  = Math.min(scaleX, scaleY);
        if (this._isMounted) this.setState({ boardScale: scale });
    };

    // ── Fade-in sequence ─────────────────────────────────────────────────────

    _startFadeInSequence = () => {
        Object.entries(PHASE_TIMINGS).forEach(([phase, delay]) => {
            const t = setTimeout(() => {
                if (!this._isMounted) return;
                this.setState({ siegePhase: phase });
                if (phase === 'armies') {
                    this._initializeSiegeCombat();
                }
                if (phase === 'combat') {
                    this._startCombatTick();
                }
            }, delay);
            this._phaseTimers.push(t);
        });
    };

    // ── Combat initialization ────────────────────────────────────────────────

    _buildSiegeArmy = () => {
        return DEFAULT_SIEGE_ARMY_TYPES.map(entry => {
            const monsterDef = this._mm.getMonster(entry.type);
            if (!monsterDef) return null;
            return {
                ...monsterDef,
                id: entry.id,
                name: entry.label || monsterDef.name || entry.type,
                isMonster: false,
                isSiegeUnit: true,
                isSiegeArmy: true,
                // Strip minions — siege army units don't spawn their own minions
                minions: [],
                stats: { ...(monsterDef.stats || {}) },
            };
        }).filter(Boolean);
    };

    _buildHashmallimArmy = () => {
        const hashmallim = this._mm.getMonster('hashmallim');
        const minions = HASHMALLIM_MINION_TYPES.map((type, idx) => {
            const def = this._mm.getMonster(type);
            if (!def) return null;
            return { ...def, id: `hm_minion_${idx}`, isMinion: true };
        }).filter(Boolean);
        return { monster: hashmallim, minions };
    };

    _initializeSiegeCombat = () => {
        const { combatManager, crew } = this.props;
        if (!combatManager) return;

        const siegeArmy = this._buildSiegeArmy();
        const { monster, minions } = this._buildHashmallimArmy();

        // Wire up data update callback so SiegeCombatGrid stays current
        combatManager.updateData = (combatants) => {
            if (this._isMounted) this.setState({ battleData: combatants });
        };

        // Wire game-over callback
        combatManager.gameOver = (result) => {
            if (!this._isMounted) return;
            if (this._combatInterval) {
                clearInterval(this._combatInterval);
                this._combatInterval = null;
            }
            const summaryResult = result && result.crewWon ? 'victory' : 'defeat';
            this.setState({ siegePhase: 'summary', showSummaryPanel: true, summaryResult });
        };

        try {
            combatManager.initializeSiegeCombat({
                crew: crew || [],
                siegeArmy,
                monster,
                minions,
                siegeMaxDepth: SIEGE_MAX_DEPTH,
            });
        } catch (e) {
            console.error('[TowerSiege] initializeSiegeCombat failed', e);
        }
    };

    _startCombatTick = () => {
        const { combatManager } = this.props;
        if (!combatManager) return;
        const interval = combatManager.FIGHT_INTERVAL || 40;
        this._combatInterval = setInterval(() => {
            if (!this._isMounted) return;
            try { combatManager.tick(); } catch (e) {}
        }, interval);
    };

    // ── Event handlers ───────────────────────────────────────────────────────

    handleExit = () => {
        if (this.props.onSiegeComplete) this.props.onSiegeComplete();
    };

    // ── Tile position helper ─────────────────────────────────────────────────

    tilePos = (coord) => coord * (SIEGE_TILE_SIZE + SIEGE_TILE_BORDER);

    // ── Render ───────────────────────────────────────────────────────────────

    render() {
        const { siegePhase, combatTiles, battleData, boardScale, showSummaryPanel, summaryResult } = this.state;

        const combatStarted = siegePhase === 'combat' || siegePhase === 'summary';
        const showCrew      = ['crew', 'hashmallim', 'armies', 'combat', 'summary'].includes(siegePhase);
        const showHashmallim = ['hashmallim', 'armies', 'combat', 'summary'].includes(siegePhase);
        const showArmies    = ['armies', 'combat', 'summary'].includes(siegePhase);

        return (
            <div className="ts-overlay">
                <div
                    className="ts-board-scaler"
                    style={{ transform: `scale(${boardScale})`, transformOrigin: 'top left' }}
                >
                    {/* ── Background tile grid ── */}
                    <div className="ts-board" style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}>
                        <div className="ts-tile-grid">
                            {combatTiles.map((t) => (
                                <div
                                    key={t.id}
                                    className={`ts-tile ${(t.x + t.y) % 2 === 0 ? 'ts-tile--light' : 'ts-tile--dark'}`}
                                    style={{
                                        width: SIEGE_TILE_SIZE,
                                        height: SIEGE_TILE_SIZE,
                                        left: this.tilePos(t.x),
                                        top: this.tilePos(t.y),
                                    }}
                                />
                            ))}
                        </div>

                        {/* ── Faction zone overlays ── */}
                        <div className="ts-zone ts-zone--player" style={{ width: this.tilePos(4), height: BOARD_HEIGHT }} />
                        <div className="ts-zone ts-zone--enemy"  style={{ width: this.tilePos(7), height: BOARD_HEIGHT, left: this.tilePos(13) }} />

                        {/* ── Unit portraits ── */}
                        <SiegeCombatGrid
                            battleData={battleData}
                            tileSize={SIEGE_TILE_SIZE}
                            tileBorder={SIEGE_TILE_BORDER}
                            siegeCols={SIEGE_COLS}
                            siegeRows={SIEGE_ROWS}
                            showCrew={showCrew}
                            showHashmallim={showHashmallim}
                            showArmies={showArmies}
                            combatStarted={combatStarted}
                        />

                        {/* ── Phase label (during fade-in only) ── */}
                        {!combatStarted && siegePhase !== 'empty' && (
                            <div className="ts-phase-label">
                                {siegePhase === 'crew'       && 'Your crew stands ready…'}
                                {siegePhase === 'hashmallim' && 'The Hashmallim arrives…'}
                                {siegePhase === 'armies'     && 'Forces converge…'}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── HUD bar ── */}
                <div className="ts-hud">
                    <div className="ts-hud__title">TOWER SIEGE</div>
                    <div className="ts-hud__phase">{siegePhase === 'combat' ? 'Combat in progress' : siegePhase.toUpperCase()}</div>
                    <button className="ts-hud__exit" onClick={this.handleExit}><span role="img" aria-label="retreat">✕</span> Retreat</button>
                </div>

                {/* ── Summary panel ── */}
                {showSummaryPanel && (
                    <div className="ts-summary">
                        <div className={`ts-summary__result ts-summary__result--${summaryResult}`}>
                            {summaryResult === 'victory'
                                ? <><span role="img" aria-label="victory">⚔</span> Victory!</>
                                : <><span role="img" aria-label="defeated">💀</span> Defeated</>}
                        </div>
                        <p className="ts-summary__text">
                            {summaryResult === 'victory'
                                ? 'The Hashmallim has fallen. The siege is won.'
                                : 'Your forces have been overwhelmed. The siege is lost.'}
                        </p>
                        <button className="ts-summary__btn" onClick={this.handleExit}>
                            Return to Dungeon
                        </button>
                    </div>
                )}
            </div>
        );
    }
}

export default TowerSiege;
