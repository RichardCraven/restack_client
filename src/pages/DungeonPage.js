import React from 'react';

import { INTERVALS } from '../utils/shared-constants';
import '../styles/dungeon-board.scss'
import Tile from '../components/tile'
import MonsterBattle from './sub-views/MonsterBattle';
import CardDuel from './sub-views/CardDuel';
import ExpositionPane from './sub-views/ExpositionPane';
import {
    loadAllDungeonsRequest,
    loadDungeonRequest,
    updateDungeonRequest,
    updateUserRequest,
    addDungeonRequest
  } from '../utils/api-handler';
import {storeMeta, getMeta, getUserId, getUserName} from '../utils/session-handler';
import { cilCaretRight, cilCaretLeft, cilMenu} from '@coreui/icons';
import  CIcon  from '@coreui/icons-react';

import { CButton, CFormSelect, CFormInput, CModal, CModalHeader, CModalTitle, CModalBody, CTabPane, CTabContent} from '@coreui/react';
import * as images from '../utils/images'
import '../styles/inventory-modal.scss'

// helper: convert 3/6-digit hex to rgba string
function hexToRgba(hex, alpha = 1){
    let h = hex.replace('#','').trim();
    if(h.length === 3){
        h = h.split('').map(c=>c+c).join('');
    }
    if(h.length !== 6) return hex;
    const r = parseInt(h.substring(0,2),16);
    const g = parseInt(h.substring(2,4),16);
    const b = parseInt(h.substring(4,6),16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Small subcomponent to render modal header + body based on modalType
const ModalInner = ({ modalType, updates, crew, tileSize, handleMemberClickRitual, handleCrewTileHover, setMemberRitualOptions }) => {
    return (
        <CModalBody>
            {modalType === 'Updates' && (
                <div className='updates-zone'>
                    {(updates || []).map((update, i) => (
                        <div key={i}>{update.text}</div>
                    ))}
                </div>
            )}

            {modalType === 'PrepComplete' && (
                <div>
                    <p>Spell preparation completed.</p>
                    {(updates || []).map((update, i) => (
                        <div key={i}>{update.text}</div>
                    ))}
                </div>
            )}

            {modalType === 'Magic' && (
                <div>
                    <p>
                        If you have a magic user in your crew you may begin a known ritual with 3x effect or learn a new one.
                    </p>
                    <div className="modal-zone">
                        {crew.filter(e=> e.type === 'wizard' || e.type === 'sage').map((magicUser, i)=>{
                            return <div className="options-row" key={i}>
                                <Tile 
                                    id={i}
                                    tileSize={tileSize}
                                    image={magicUser.image ? magicUser.image : null}
                                    imageOverride={magicUser.portrait ? magicUser.portrait : null}
                                    contains={magicUser.type}
                                    data={magicUser}
                                    color={magicUser.color}
                                    editMode={false}
                                    type={'crew-tile'}
                                    handleClick={handleMemberClickRitual}
                                    handleHover={handleCrewTileHover}
                                    className={`crew-tile `}> </Tile>
                                {setMemberRitualOptions === magicUser && <div className="options-zone">
                                    <div className="option" onClick={()=> {/* learn */}}>Learn</div>
                                    <div className={`option ${magicUser.specialActions.filter(e=>e.type === 'ritual').length === 0 ? 'disabled' : ''}`}>Perform ritual 3x</div>
                                </div>}
                            </div>
                        })}
                    </div>
                </div>
            )}
        </CModalBody>
    )
}

Date.prototype.addHours= function(h){
    this.setHours(this.getHours()+h);
    return this;
}
Date.prototype.addMinutes= function(minutes){
    this.setMinutes(this.getMinutes()+minutes);
    return this;
}
Date.prototype.addSeconds= function(s){
    this.setSeconds(this.getSeconds()+s);
    return this;
}
Date.prototype.addMinutes= function(minutes){
    this.setMinutes(this.getMinutes()+minutes);
    return this;
}
function diff_minutes(dt2, dt1){
  var diff =(dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;
  return Math.round(diff);
}
function diff_seconds(dt2,dt1){
    var diff =(dt2.getTime() - dt1.getTime()) / 1000;
    // diff /= 60;
    return Math.round(diff);
}

// const MAX_DEPTH = 8;
// const MAX_ROWS = 5;
// const TILE_SIZE = 100;
// const SHOW_TILE_BORDERS = false;

const MARKER_TYPES = [
    'enemy',
    'gate',
    'merchant',
    'stairs',
    'misc',
    'custom'
]

class DungeonPage extends React.Component {
    getCharacterActions = (character) => {
        // Show all potential glyphs for wizard, with only magic missile available initially
        let actions = [];
        if (character.type === 'wizard') {
            // Count available for each subtype
                const mmCount = (character.specialActions || []).filter(a => a.subtype === 'magic missile' && a.available).length;
            actions.push({
                type: 'glyph',
                name: 'Etch Glyph',
                iconUrl: images['glyph_inverted'],
                subTypes: [
                    {
                        type: 'magic missile',
                        iconUrl: images['magic_missile_inverted'],
                        available: true,
                        count: mmCount
                    },
                    {
                        type: 'doppleganger',
                        iconUrl: '',
                        available: false,
                        count: 0
                    },
                    {
                        type: 'yawning rift',
                        iconUrl: '',
                        available: false,
                        count: 0
                    }
                ]
            });
        }
        // Add other class logic here as needed
        let count = 0;
        actions.forEach(a => {
            (a.subTypes || []).forEach(s => {
                count += s.count;
            });
        });
        let maximumReached = count >= 3;
        return <div className='actions-container'>
            {actions.map((action, i) => {
                // find any active special action for this character (used by canvas overlay)
                const activeAction = (character.specialActions || []).find(a => {
                    if (!a || !a.startDate || !a.endDate) return false;
                    const start = new Date(a.startDate);
                    const end = new Date(a.endDate);
                    const now = new Date();
                    return now >= start && now < end;
                });
                return (
                <div className="action-wrapper" key={i}>
                    <div className='action-hover-wrapper' onClick={() => this.handleActionClick(action)} style={{
                        border: `${this.getActionCooldownPercentage() && (character.specialActions || []).find(e=>e.type === action.type) ? '1px solid #635b4a' : ''}`
                    }}>
                        {/* placeholder used by canvas to draw high-frequency progress overlays */}
                        {(() => {
                            // Use a stable placeholder id so the DOM node isn't recreated on every render.
                            // Recreating the node caused the canvas overlay to flicker when it tried to
                            // draw into a rapidly-unmounting element. Use the character id/type and
                            // action type to form a stable key.
                            const placeholderId = `po-${character.id || character.type}-${action.type}`;
                            const start = activeAction ? activeAction.startDate : '';
                            const end = activeAction ? activeAction.endDate : '';
                            return (
                                <div
                                    id={placeholderId}
                                    ref={el => this.placeholderRef(el, placeholderId, start, end)}
                                    className="progress-overlay progress-overlay-placeholder"
                                    data-start={start}
                                    data-end={end}
                                ></div>
                            );
                        })()}
                        <div className='action-icon' style={{backgroundImage: `url(${action.iconUrl})`}}></div>
                        <div className="action-text">{action.name}</div>
                    </div>
                    <div className="info-icon" style={{backgroundImage: `url(${images['info']})`}}></div>
                    <div className={`action-sub-menu ${this.state.actionMenuTypeExpanded === action.type ? 'expanded' : ''}`}>
                        {maximumReached && <div className='max-reached'>maximum reached</div>}
                        {action.subTypes && action.subTypes.map((subType, j) => (
                            <div key={j} onClick={() => this.handleActionSubtypeClick(action, subType)}
                                className={`action-subtype ${this.getSubtypeClass(subType, maximumReached)} `}>
                                {subType.type} {subType.count !== 0 && this.getSubtypeImageCountElement(subType)}
                            </div>
                        ))}
                    </div>
                </div>
                )
            })}
        </div>;
    }
    
    // Scans crew specialActions for finished preparations, marks availability, optionally marks notified,
    // persists meta and returns any collected updates.
    checkAndCollectFinishedSpecialActions = ({ markNotified = true } = {}) => {
        const meta = getMeta();
        let updates = [];
        let modified = false;
        let numeralUpdate = false;

        meta.crew.forEach(member => {
            (member.specialActions || []).forEach(a => {
                if (!a || !a.endDate) return;
                const end = new Date(a.endDate);
                const now = new Date();
                        if (end - now < 0) {
                    if (!a.available) {
                        a.available = true;
                        modified = true;
                        numeralUpdate = true;
                    }
                    if (markNotified) {
                        if (!a.notified) {
                            updates.push({
                                text: `${member.name} has finished ${a.name}`,
                                owner: `${member.name}`,
                                actionType: a.type
                            });
                            a.notified = true;
                            modified = true;
                        }
                    } else {
                        if (!a.notified) {
                            updates.push({
                                text: `${member.name} has finished ${a.name}`,
                                owner: `${member.name}`,
                                actionType: a.type
                            });
                        }
                    }
                }
            });
        });

        if (modified) {
            meta.crew = meta.crew;
            storeMeta(meta);
            this.props.crewManager.crew = meta.crew;
            this.props.saveUserData();
        }

        return { updates, modified, numeralUpdate };
    }
    getRotateDegreesLeft = (percentage) => {
        let deg = Math.floor(percentage / 100 * 360);
        return deg;
    }

    getRotateDegreesRight = (percentage) => {
        let deg = Math.floor(percentage / 100 * 360);
        if (percentage >= 50) deg = 180;
        return deg;
    }
    realTimeSpecialActionCheckInterval = null;
    prepCompleteTimeout = null;
    // Canvas-based cooldown overlay for high-frequency updates
    cooldownCanvas = null;
    cooldownAnimationFrame = null;
    constructor(props){
        super(props)
        this.monsterBattleComponentRef = React.createRef()
        // internal registry of active placeholders (id -> { el, start:Date, end:Date })
        this._placeholderRegistry = new Map();
        this._nextPlaceholderId = 1;
        this._lastDrawTimestamp = 0;
        this._fpsLimit = 30; // cap draw loop to 30fps
        this.state = {
            tileSize: 0,
            boardSize: 0,
            tiles: [],
            overlayTiles: [],
            spawn: {},
            showMessage: false,
            messageToDisplay: '',
            showSaving: true,
            intervalId: null,
            showDarkMask: false,
            currentBoard: '',
            leftPanelExpanded: false,
            rightPanelExpanded: false,
            inventoryHoverMatrix: {},
            crewHoverMatrix: {},
            selectedCrewMember: {},
            pending: null,
            showInventoryPopup: false,
            activeInventoryItem: null,
            keysLocked: false,
            inMonsterBattle: false,
            monster: null,
            crewSize: 0,
            paused: false,
            minimap: [],
            minimapZoomedTile: null,
            minimapMarkerTrayOpen: false,
            minimapPlaceMapMarkerStarted: false,
            minimapIndicators: [],
            overlayHoveredTileId: null,
            mapMarkerInput: React.createRef(),
            markerSelectVal: React.createRef(),
            levelTracker: [
                {id: 2, active: false},
                {id: 1, active: false},
                {id: 0, active: false},
                {id: -1, active: false},
                {id: -2, active: false},
            ],
            markerName: '',
            markerType: '',
            descriptionText: '',
            actionsTrayExpanded: false,
            actionMenuExpanded: '',
            modalType: '',
            showModal: false,
            updates: [],
            timeToRespawn: '',
            respawnUpdateInterval: null,
            monsterBattleTileId: null,
            setMemberRitualOptions: null,
            ritualWrecked: false,
            shiftDown: false,
            showFullScreen: false
            , showCardDuelModal: false
            , cardDuelTileId: null
            , toastMessage: null
            , prototypeTasksOpen: false
        }
    // Native browser tooltip will be used for death-tracker; no custom tooltip state required.
        // Track timers/intervals created by this component so we can clear on unmount
        this._timers = [];
        this._intervals = [];
        this._setTimeout = (fn, t) => { const id = setTimeout(fn, t); try { this._timers.push(id); } catch(e){}; return id };
        this._setInterval = (fn, t) => { const id = setInterval(fn, t); try { this._intervals.push(id); } catch(e){}; return id };
    }

    // Reverted to native browser tooltip; no custom tooltip lifecycle is necessary.
    
    componentWillMount(){
        let tileSize = this.getTileSize(),
            boardSize = tileSize*15;
        this.initializeListeners();
        // this.startSaveInterval();
        if(this.props.mapMaker) this.props.mapMaker.initializeTiles();
        let arr = []
        for(let i = 0; i < 9; i++){
            arr.push([])
        }
        const meta = getMeta();
        console.log('META:', meta);
        // meta.crew[0].stats.hp = 1000;
        // remove this after debugging ^


        // const meta = null
        this.props.boardManager.establishAvailableItems(this.props.inventoryManager.items);

        
        if(!meta || !meta.dungeonId){
            this.props.crewManager.initializeCrew(meta.crew);
            this.loadNewDungeon();
        } else {
            this.props.inventoryManager.initializeItems(meta.inventory);

            // this.props.inventoryManager.addItem(this.props.inventoryManager.allItems['minor_key'])

            this.props.crewManager.initializeCrew(meta.crew);
            this.loadExistingDungeon(meta.dungeonId)
        }
        const minimap = [];
        for(let i = 0; i<9; i++){
            minimap.push({active: false})
        }
        
        // Consolidated check: mark finished special actions available and collect updates
        const { updates, modified } = this.checkAndCollectFinishedSpecialActions({ markNotified: false });
        this.setState((state, props) => {
            return {
                leftPanelExpanded: meta?.leftExpanded,
                rightPanelExpanded: meta?.rightExpanded,
                // persist/rehydrate crew actions tray expanded state
                crewActionsTrayExpanded: meta?.crewActionsTrayExpanded || false,
                crewSize: meta.crew.length,
                minimap,
                updates,
                modalType: updates.length > 0 ? 'Updates' : '',
                showModal: updates.length > 0
            };
        });
    }

    handleDeathTrackerChanged = (deaths) => {
        try {
            const meta = getMeta() || {};
            meta.deathTracker = deaths;
            storeMeta(meta);
            // trigger a re-render so UI elements that read meta will update
            this.forceUpdate();
        } catch (e) {
            console.warn('handleDeathTrackerChanged failed', e);
        }
    }

    // --- Card Duel modal helpers ---
    openCardDuel = (tileId) => {
        this.setState({ showCardDuelModal: true, cardDuelTileId: tileId, toastMessage: null });
    }

    closeCardDuel = () => {
        this.setState({ showCardDuelModal: false, cardDuelTileId: null });
    }

    handleCardDuelFinish = (result) => {
        try{
            if(result && result.winner === 'player'){
                console.log('you win');
            } else if(result && result.winner === 'reaper'){
                // Surface a toast informing of the pending tax, but DO NOT apply it here.
                const taxPercent = 25;
                this.setState({ toastMessage: `You lost the duel — pending tax ${taxPercent}% gold (NOT applied in test)` });
            }
        } catch(e){ console.warn('handleCardDuelFinish failed', e); }
        this.closeCardDuel();
    }

    togglePrototypeTasks = () => {
        this.setState(prev => ({ prototypeTasksOpen: !prev.prototypeTasksOpen }));
    }
    componentDidMount(){
        // Migration: normalize legacy equippedSlot keys to 'pet'
        try {
            const metaForMigration = getMeta() || {};
            let migrated = false;
            (metaForMigration.crew || []).forEach(member => {
                (member.inventory || []).forEach(item => {
                    try {
                        if (item && item.equippedSlot === 'bottom-left') {
                            item.equippedSlot = 'pet';
                            migrated = true;
                        }
                    } catch (e) {}
                });
            });
            if (migrated) {
                try { storeMeta(metaForMigration); } catch (e) {}
                try { updateUserRequest(getUserId(), metaForMigration).catch(()=>{}); } catch (e) {}
            }
        } catch (e) {}

        // Real-time check for completed special actions
    this.realTimeSpecialActionCheckInterval = this._setInterval(() => {
            // Use centralized helper to find finished actions and optionally mark them notified
            const { updates, modified, numeralUpdate } = this.checkAndCollectFinishedSpecialActions({ markNotified: true });

            const meta = getMeta();

            if (updates.length > 0) {
                // Also update selectedCrewMember reference so numerals/counts update immediately
                let selectedCrewMember = this.state.selectedCrewMember;
                if (selectedCrewMember && selectedCrewMember.id) {
                    const updated = meta.crew.find(c => c.id === selectedCrewMember.id);
                    if (updated) selectedCrewMember = { ...updated };
                }
                    this.setState({
                        updates,
                        // Use a distinct modal for in-session preparation completions
                        modalType: 'PrepComplete',
                        showModal: true,
                        selectedCrewMember,
                        numeralUpdate: (this.state.numeralUpdate || false) ? false : true // toggle dummy state
                    }, () => {
                        this.forceUpdate();
                        // auto-dismiss PrepComplete modal after a short delay
                        try {
                            if (this.prepCompleteTimeout) clearTimeout(this.prepCompleteTimeout);
                        } catch (e) {}
                        this.prepCompleteTimeout = this._setTimeout(() => {
                            if (this.state.modalType === 'PrepComplete' && this.state.showModal) {
                                this.onUpdateModalClosed();
                            }
                        }, 3500);
                    });
            } else if (modified || numeralUpdate) {
                // If no popup, still force update for numeral/count UI
                this.setState(prevState => {
                    let selectedCrewMember = prevState.selectedCrewMember;
                    if (selectedCrewMember && selectedCrewMember.id) {
                        const updated = meta.crew.find(c => c.id === selectedCrewMember.id);
                        if (updated) selectedCrewMember = { ...updated };
                    }
                    return { selectedCrewMember, numeralUpdate: (prevState.numeralUpdate || false) ? false : true };
                }, () => {
                    this.forceUpdate();
                });
            } else {
                // No updates/modified flags — but the cooldown visuals rely on frequent re-renders
                // (getActionCooldownPercentage uses current time). Only trigger a lightweight
                // re-render if any special action is currently in-progress to avoid needless work.
                const anyActive = meta.crew && meta.crew.some(member =>
                    (member.specialActions || []).some(a => {
                        if (!a || !a.startDate || !a.endDate) return false;
                        const start = new Date(a.startDate);
                        const end = new Date(a.endDate);
                        const now = new Date();
                        return now >= start && now < end;
                    })
                );
                if (anyActive) {
                    // update a tiny state field so React re-renders and progress UI updates
                    this.setState({ _cooldownTick: Date.now() });
                    // ensure canvas draw loop is running
                        try {
                            if (!this.cooldownAnimationFrame) {
                                this.cooldownAnimationFrame = requestAnimationFrame(this.drawCooldowns);
                            }
                        } catch (e) {}
                } else {
                    // stop canvas loop if running and clear canvas
                    try {
                        if (this.cooldownAnimationFrame) {
                            cancelAnimationFrame(this.cooldownAnimationFrame);
                            this.cooldownAnimationFrame = null;
                        }
                        if (this.cooldownCanvas) {
                            const ctx = this.cooldownCanvas.getContext && this.cooldownCanvas.getContext('2d');
                            if (ctx) ctx.clearRect(0, 0, this.cooldownCanvas.width, this.cooldownCanvas.height);
                        }
                    } catch (e) {}
                }
            }
    }, 100);
        // Create a full-page canvas used to draw cooldown overlays at high frequency
        try {
            if (!this.cooldownCanvas) {
                this.cooldownCanvas = document.createElement('canvas');
                this.cooldownCanvas.id = 'cooldownCanvas';
                Object.assign(this.cooldownCanvas.style, {
                    position: 'fixed',
                    left: '0',
                    top: '0',
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: '9999'
                });
                document.body.appendChild(this.cooldownCanvas);
            }
        } catch (e) {
            console.warn('Could not create cooldown canvas', e);
        }
        // start the draw loop only if there are active cooldowns
        try {
            if (this.hasActiveCooldowns()) {
                this.cooldownAnimationFrame = requestAnimationFrame(this.drawCooldowns);
            }
        } catch (e) {}

        // If a camp was active before a reload, rehydrate the camping state so the
        // progress continues from the stored start/end times and the endCamp is scheduled.
        try {
            const meta = getMeta() || {};
            if (meta.camping && meta.campingEnd) {
                const now = new Date();
                const end = new Date(meta.campingEnd);
                const remaining = end - now;
                if (remaining > 0) {
                    // ensure continuous draw loop while camping
                    this._forcedDraw = true;
                    if (!this.cooldownAnimationFrame) this.cooldownAnimationFrame = requestAnimationFrame(this.drawCooldowns);
                    // lock movement hotkeys while rehydrated camping is active
                    try { this.setState({ keysLocked: true }); } catch(e) {}
                    // schedule endCamp after the remaining time
                    try { this.campTimeout = this._setTimeout(() => { try { this.endCamp(); } catch(e){ console.warn('endCamp timeout failed during rehydrate', e); } }, remaining + 200); } catch(e){}
                    // refresh player visuals and overlay tiles
                    try{ if (this.props.boardManager && typeof this.props.boardManager.placePlayer === 'function') this.props.boardManager.placePlayer(this.props.boardManager.playerTile.location); } catch(e){}
                    try{ this.setState({ overlayTiles: this.props.boardManager.overlayTiles }); } catch(e){}
                } else {
                    // expired while offline / between reloads: end immediately
                    try { this._setTimeout(() => { try { this.endCamp(); } catch(e){} }, 50); } catch(e){}
                }
            }
        } catch(e) {}
        
        this.props.boardManager.establishAddItemToInventoryCallback(this.addItemToInventory)
        this.props.boardManager.establishAddTreasureToInventoryCallback(this.addTreasureToInventory)
        this.props.boardManager.establishAddCurrencyToInventoryCallback(this.addCurrencyToInventory)
        this.props.boardManager.establishUpdateDungeonCallback(this.updateDungeon)
        this.props.boardManager.establishPendingCallback(this.setPending)
        this.props.boardManager.establishMessagingCallback(this.messaging)
        this.props.boardManager.establishRefreshCallback(this.refreshTiles)
        this.props.boardManager.establishTriggerMonsterBattleCallback(this.triggerMonsterBattle)
        this.props.boardManager.establishSetMonsterCallback(this.setMonster)
        this.props.boardManager.establishGetCurrentInventoryCallback(this.getCurrentInventory)
        this.props.boardManager.establishRitualEncounterCallback(this.triggerRitualEncounter)

        this.props.boardManager.establishBoardTransitionCallback(this.boardTransition)
        this.props.boardManager.establishLevelChangeCallback(this.handleLevelChange)

        this.props.boardManager.establishUseConsumableFromInventoryCallback(this.useConsumableFromInventory)
        // this.props.inventoryManager.establishUseConsumableFromInventoryCallback(this.useConsumableFromInventory)

        window.addEventListener('beforeunload', this.componentCleanup);
        // Ensure initial layout calculations run once on mount so the board renders
        // correctly without requiring a manual window resize.
        try {
            this.handleResize();
        } catch (e) {}
        
    let respawnInterval = this._setInterval(()=>{
            // let meta = getMeta();
            // let respawn = new Date(meta.respawnDate);
            // if()
            // if()
            this.handleRespawnTime();
        }, 1000)
        this.setState({
            respawnUpdateInterval: respawnInterval
        })

        
        this.checkDungeon();
    }
    checkDungeon = async () => {
        const allDungeons = await loadAllDungeonsRequest();
        
        let dungeons = [];
            
        allDungeons.data.forEach((e, i) => {
            let d = JSON.parse(e.content)
            d.id = e._id
            dungeons.push(d)
        })
        // const selectedDungeon = dungeons.find(e=>e.name === 'Primari');
    }
    handleRespawnTime = () => {
        let meta = getMeta();
        if(!meta.respawnDate){
            this.setNewRespawnDate();
        } else {
            let respawn = new Date(meta.respawnDate);
            let now = new Date();
            let diffInMinutes = diff_minutes(respawn, now)
            let diffInSeconds = diff_seconds(respawn, now)
            let respawnString = ''
            if(diffInMinutes > 1){
                respawnString = `${diffInMinutes} m`
            } else if(diffInMinutes < 2 && diffInSeconds > 1){
                respawnString = `${diffInSeconds} s`
            } else {
                this.respawnMonsters();
                respawnString = ''
                this.setNewRespawnDate();
            }
            this.setState({
                timeToRespawn: respawnString,
            })
        }
    }
    respawnMonsters = async () => {
        let dungeons = [],
        selectedDungeon;
        
        const allDungeons = await loadAllDungeonsRequest();

        allDungeons.data.forEach((e, i) => {
            let d = JSON.parse(e.content)
            d.id = e._id
            dungeons.push(d)
        })
        selectedDungeon = dungeons[0];
        try {
            this.props.boardManager.respawnMonsters(selectedDungeon)
            // Persist meta after a respawn event so UI/session state is saved
            try {
                const meta = getMeta();
                storeMeta(meta);
            } catch (e) {
                // ignore storeMeta failures
            }
            if (this.props.saveUserData) {
                try {
                    this.props.saveUserData();
                } catch (e) {
                    // ignore save failures
                }
            }
        } catch (e) {
            console.warn('Error triggering respawnMonsters', e);
        }
    }
    componentWillUnmount(){
        // Clear any timers/intervals created via helpers
        try { if (Array.isArray(this._timers)) { this._timers.forEach(t => clearTimeout(t)); this._timers = []; } } catch(e){}
        try { if (Array.isArray(this._intervals)) { this._intervals.forEach(i => clearInterval(i)); this._intervals = []; } } catch(e){}
        // Backwards compat: clear any direct references as well
        try { if (this.realTimeSpecialActionCheckInterval) { clearInterval(this.realTimeSpecialActionCheckInterval); } } catch(e){}
        try { if (this.prepCompleteTimeout) { clearTimeout(this.prepCompleteTimeout); this.prepCompleteTimeout = null; } } catch(e){}
        try { if (this.campTimeout) { clearTimeout(this.campTimeout); this.campTimeout = null; } } catch(e){}
        try { if (this.state && this.state.respawnUpdateInterval) { clearInterval(this.state.respawnUpdateInterval); } } catch(e){}
        // stop canvas animation and remove canvas
        try {
            if (this.cooldownAnimationFrame) {
                cancelAnimationFrame(this.cooldownAnimationFrame);
                this.cooldownAnimationFrame = null;
            }
            if (this.cooldownCanvas) {
                if (this.cooldownCanvas.parentNode) this.cooldownCanvas.parentNode.removeChild(this.cooldownCanvas);
                this.cooldownCanvas = null;
            }
        } catch (e) {
            console.warn('Error cleaning up cooldown canvas', e);
        }
        this.componentCleanup();
        window.removeEventListener('beforeunload', this.componentCleanup); 
    }
    
    componentCleanup = () => {
        window.removeEventListener('keydown', this.keyDownHandler)
        window.removeEventListener('resize', this.handleResize.bind(this));
        clearInterval(this.state.intervalId)
    }

    // Draw cooldown overlays onto the full-page canvas. This runs on requestAnimationFrame
    drawCooldowns = (timestamp) => {
        // throttle to _fpsLimit
        try {
            if (this._lastDrawTimestamp && timestamp && (timestamp - this._lastDrawTimestamp) < (1000 / this._fpsLimit)) {
                // still need to schedule next frame if active
                if (this.hasActiveCooldowns()) {
                    this.cooldownAnimationFrame = requestAnimationFrame(this.drawCooldowns);
                } else {
                    this.cooldownAnimationFrame = null;
                }
                return;
            }
            this._lastDrawTimestamp = timestamp || performance.now();
        } catch (e) {}
        try {
            const canvas = this.cooldownCanvas;
            if (!canvas) return;
            const dpr = window.devicePixelRatio || 1;
            const rect = document.documentElement.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            const cw = Math.floor(width * dpr);
            const ch = Math.floor(height * dpr);
            if (canvas.width !== cw || canvas.height !== ch) {
                canvas.width = cw;
                canvas.height = ch;
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;
            }
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            // reset transform/clear
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.scale(dpr, dpr);
            const now = new Date();
            try { if (!this._lastDebugLogTime) this._lastDebugLogTime = 0; } catch(e) { this._lastDebugLogTime = 0; }
            for (const [id, entry] of this._placeholderRegistry) {
                try {
                    const { el, start, end } = entry;
                    // debug: occasional log (disabled to avoid console spam)
                    if (!el || !start || !end) continue;
                    // Skip canvas drawing for the camp CSS-driven placeholder so we don't double-draw
                    try {
                        if (id === 'camp-progress-placeholder' || (el.classList && el.classList.contains && el.classList.contains('camp-anim'))) {
                            continue;
                        }
                    } catch (e) {}
                    if (now < start || now >= end) continue;
                    const pct = Math.min(1, (now - start) / (end - start));
                    const r = el.getBoundingClientRect();
                    const x = r.left;
                    const y = r.top;
                    const w = r.width;
                    const h = r.height;
                    // draw a semi-opaque overlay matching the original style
                    // Updated to use the requested color #f9b11554 (approx rgba(249,177,21,0.329))
                    ctx.fillStyle = 'rgba(249,177,21,0.6)';
                    ctx.fillRect(x, y, w * pct, h);
                    // debug: draw logging disabled to avoid frequent console output
                } catch (inner) {
                    // skip problematic element
                }
            }

            // restore transform before next frame
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        } catch (e) {
            console.warn('Error drawing cooldowns', e);
        }

        // Schedule next frame while there are active cooldowns or forced draw is enabled
        try {
            if (this.hasActiveCooldowns() || this._forcedDraw) {
                this.cooldownAnimationFrame = requestAnimationFrame(this.drawCooldowns);
            } else {
                this.cooldownAnimationFrame = null;
            }
        } catch (e) {
            this.cooldownAnimationFrame = null;
        }
    }

    // Returns true when any placeholder indicates an in-progress cooldown
    hasActiveCooldowns = () => {
        try {
            const now = new Date();
            for (const [id, entry] of this._placeholderRegistry) {
                const { start, end } = entry;
                if (!start || !end) continue;
                if (now >= start && now < end) return true;
            }
        } catch (e) {
            return false;
        }
        return false;
    }
    
    // ref callback used to register/unregister placeholders
    placeholderRef = (el, id, start, end) => {
        try {
            if (el) {
                // normalize start/end to Date
                const s = start ? new Date(start) : null;
                const e = end ? new Date(end) : null;
                this._placeholderRegistry.set(id, { el, start: s, end: e });
                // try { console.log(`placeholderRef: registered ${id} start=${s} end=${e}`); } catch(e){}
                // ensure the draw loop is running when a new active placeholder is registered
                try {
                    if (!this.cooldownAnimationFrame && (this.hasActiveCooldowns() || this._forcedDraw)) {
                        this.cooldownAnimationFrame = requestAnimationFrame(this.drawCooldowns);
                    }
                } catch (e) {}
            } else {
                // element unmounted, remove from registry
                this._placeholderRegistry.delete(id);
                // try { console.log(`placeholderRef: unregistered ${id}`); } catch(e){}
                // if no active placeholders, stop the draw loop and clear canvas
                try {
                    if (!this.hasActiveCooldowns() && !this._forcedDraw && this.cooldownAnimationFrame) {
                        cancelAnimationFrame(this.cooldownAnimationFrame);
                        this.cooldownAnimationFrame = null;
                        if (this.cooldownCanvas) {
                            const ctx = this.cooldownCanvas.getContext && this.cooldownCanvas.getContext('2d');
                            if (ctx) ctx.clearRect(0, 0, this.cooldownCanvas.width, this.cooldownCanvas.height);
                        }
                    }
                } catch (e) {}
            }
        } catch (e) {
            // ignore
        }
    }
    logMeta = () => {
        const meta = getMeta();
    }
    setNewRespawnDate = () => {
        let soon = new Date().addMinutes(1)
        let meta = getMeta();
        meta.respawnDate = soon;
        storeMeta(meta)


        let respawn = new Date(soon);
        let now = new Date();
        let diffInMinutes = diff_minutes(respawn, now);


        let respawnString = `${diffInMinutes} m`

        this.setState({
            timeToRespawn: respawnString,
        })
    }
    pickRandom = (array) => {
        let index = Math.floor(Math.random() * array.length)
        return array[index]
    }
    addCurrencyToInventory = (data) => {
        let type;
        switch(data.type){
            case 'gold':
                type = 'gold';
            break;
            case 'shimmering_dust':
                type = 'shimmering dust'
            break;
            case 'totems':
                type = data.amount > 1 ? 'totems' : 'totem'
            break;
            default:
            break;
        }
        this.displayMessage(`You found ${data.amount} ${type}!`)
        this.props.inventoryManager.addCurrency(data)
    }
    establishAnimationCallback = () => {
        this.props.animationManager.establishAnimationCallback(this.renderAnimation)
    }
    addItemToInventory = (tile) => {
        //this is coming from a board tile
        const tileContains = tile.contains;
        this.props.inventoryManager.addItem(this.props.inventoryManager.allItems[tileContains])
        const matrix = this.state.inventoryHoverMatrix;
        this.props.inventoryManager.inventory.forEach((e,i)=>{
            matrix[i] = '';
        })
        this.displayMessage(`You found a ${tileContains}!`)
        this.setState({
            inventoryHoverMatrix: matrix
        })
    }
    addTreasureToInventory = (treasure) => {
        let item = treasure.item
        const message = `You open the treasure chest and find a ${item.replaceAll('_',' ')} and ${treasure.currency.amount} ${treasure.currency.type.replace('_',' ')}!`
        this.displayMessage(message);
        this.props.inventoryManager.addItem(this.props.inventoryManager.allItems[treasure.item])
        this.props.inventoryManager.addCurrency(treasure.currency);
    }
    useConsumableFromInventory = (item) => {
        let foundItem = this.props.inventoryManager.inventory.find(e=> e.name === item.name),
        foundIndex = this.props.inventoryManager.inventory.findIndex(e=> e.name === item.name);
        foundItem.animation = 'consumed';
        this.forceUpdate();
        this._setTimeout(()=>{
            foundItem.animation = '';
            this.props.inventoryManager.removeItemByIndex(foundIndex)
            this.forceUpdate();
            this.props.saveUserData();
        }, 500)
    }
    updateDungeon = async (dungeon) => {
        await updateDungeonRequest(dungeon.id, dungeon);
    }
    messaging = (message) => {
        this.displayMessageAndHold(message)
    }
    setPending = (pendingState) => {
        this.setState({pending: pendingState})
    }
    refreshTiles = () => {
        let newTiles = this.props.boardManager.tiles,
            newOverlayTiles = this.props.boardManager.overlayTiles

        // Ensure each visible (non-void) tile has a randomly chosen terrain background
        try {
            if (Array.isArray(newTiles) && this.props.boardManager && typeof this.props.boardManager.getContainsType === 'function') {
                for (let i = 0; i < newTiles.length; i++) {
                    const t = newTiles[i];
                    if (!t) continue;
                    const containsType = this.props.boardManager.getContainsType(t.contains);
                    // skip void tiles or currently hidden (black) tiles — fog-of-war will mark hidden tiles as black
                    if (containsType === 'void' || t.color === 'black') continue;
                    // do not override an existing terrain assignment so reloads keep the same visuals
                    if (!t.terrain) {
                        const n = Math.floor(Math.random() * 16) + 1;
                        t.terrain = `terrain_${n}`;
                    }
                }
            }
        } catch (e) {
            // defensive: if anything goes wrong, don't block the refresh
            console.warn('refreshTiles: failed to assign terrain:', e);
        }

        this.setState({
            tiles: newTiles,
            overlayTiles: newOverlayTiles
        })
    }
    triggerMonsterBattle = (bool, tileId) => {
        // When entering combat: remember current side-panel state and
        // collapse both panels. On exit, restore the saved state.
        try {
            if (bool) {
                // entering combat - save previous panel expand/collapse state
                this._preCombatPanels = {
                    left: !!this.state.leftPanelExpanded,
                    right: !!this.state.rightPanelExpanded
                };
                this.setState({
                    keysLocked: bool,
                    inMonsterBattle: bool,
                    monsterBattleTileId: tileId,
                    leftPanelExpanded: false,
                    rightPanelExpanded: false
                });
            } else {
                // exiting combat - restore previous panel state if we saved it
                const prev = this._preCombatPanels || { left: false, right: false };
                this.setState({
                    keysLocked: bool,
                    inMonsterBattle: bool,
                    monsterBattleTileId: tileId,
                    leftPanelExpanded: !!prev.left,
                    rightPanelExpanded: !!prev.right
                });
                this._preCombatPanels = null;
            }
        } catch (e) {
            // Fallback to original behavior if anything goes wrong
            this.setState({
                keysLocked: bool,
                inMonsterBattle: bool,
                monsterBattleTileId: tileId
            })
        }
    }
    setMonster = (monsterString) => {
        // monsterString = 'beholder'
        let monster = this.props.monsterManager.getMonster(monsterString), 
        minions = null;
        if(monster && monster.minions){
            minions = [];
            monster.minions.forEach((e,i)=>{
                const minion = this.props.monsterManager.getMonster(e)
                minion.id = minion.id+i+700
                let minionName = this.pickRandom(minion.monster_names)
                minion.name = minionName
                minion.inventory = [];

                minions.push(minion)
            })
        }


        if(!monster) monster = this.props.monsterManager.getRandomMonster();
        let monsterName = this.pickRandom(monster.monster_names)
        monster.name = monsterName
        monster.inventory = [];
        this.setState({
            monster,
            minions
        })
    }
    getCurrentInventory = () => {
        return this.props.inventoryManager.inventory;
    }
    
    handleLevelChange = (newLevelId) => {
        const levelTracker = this.state.levelTracker;
        levelTracker.forEach(e=>e.active = false)
        const level = levelTracker.find(e=>e.id === newLevelId);
        if(!level){
            // level missing -- initialize better
            debugger
        }
        level.active = true;


        const meta = getMeta();
        let orientation = this.props.boardManager.currentOrientation;
        let indicatorsGroup = meta.minimapIndicators.find(e=>e.level === level.id && e.orientation === orientation)
        

        

        if(!indicatorsGroup){
            let newIndicators = []
            for(let i = 0; i < 9; i++){
                newIndicators.push({
                    enemies: [],
                    gates: [],
                    merchant: [],
                    stairs: [],
                    misc: [],
                    custom: []
                })
            }
            indicatorsGroup = {
                level: level.id,
                orientation,
                indicators: newIndicators
            }
            meta.minimapIndicators.push(indicatorsGroup)
            storeMeta(meta)
        }
        this.setState({
            levelTracker,
            minimapZoomedTile: null,
            minimapIndicators: indicatorsGroup.indicators
        })

    }
    boardTransition = (direction) => {
        const minimap = this.state.minimap;
        const currentIndex = minimap.findIndex(e=>e.active === true);
        let newIndex;
        minimap.forEach(e=>e.active = false)
        switch(direction){
            case 'left': 
                newIndex = currentIndex-1;
            break;
            case 'right':
                newIndex = currentIndex+1;
            break;
            case 'up':
                newIndex = currentIndex-3;
            break;
            case 'down':
                newIndex = currentIndex+3;
            break;
            default:
                break;
        }
        let zoomed = null;
        if(this.state.minimapZoomedTile !== null){
            zoomed = newIndex;
        }
        minimap[newIndex].active = true;
        this.setState({
            minimap,
            minimapZoomedTile: zoomed
        })
    }
    getTileSize(){
        const h = Math.floor((window.innerHeight/17));
        const w = Math.floor((window.innerWidth/17));
        let tsize = 0;
        if(h < w){
            tsize = h;
          } else {
            tsize = w;
        }
        return tsize;
    }

    handleResize() {
        let tileSize = this.getTileSize(),
            boardSize = tileSize*15;

        this.setState((state, props) => {
            return {
                tileSize,
                boardSize
            }
        })
    }

    initializeListeners = () => {
        window.addEventListener('keydown', this.keyDownHandler);
        // window.addEventListener('mouseup', this.mouseUpHandler);
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    startSaveInterval = () => {
        let intervalId = this._setInterval( async () => {
            this.setState(()=>{
                return {
                    showMessage : true
                }
            })
            this.props.saveUserData()
            this.displayMessage('saving...')
        }, 45000); 
        this.setState({intervalId: intervalId})
    }
    displayMessage = (message) => {
        this.setState(()=>{
            return {
                showMessage : true,
                messageToDisplay: message
            }
        })
        this._setTimeout(() => {
            this.setState(()=>{
                return {
                    showMessage : false
                }
            })
        },3900)
    }
    displayMessageAndHold = (message) => {
        this.setState(()=>{
            return {
                showMessage : true,
                messageToDisplay: message
            }
        })
    }
    toggleFullscreen = () => {
        const currentState = this.state.showFullScreen;
        this.toggleLeftSidePanel({expanded: !currentState});
        this.toggleRightSidePanel({expanded: !currentState});
        this.setState(()=>{
            return {
                showFullScreen: !currentState
            }
        })
    }

    keyDownHandler = (event) => {
        // Allow global 'i' to toggle MonsterBattle inventory when a battle is active
        try {
            const maybeKey = event.key;
            // Enter should confirm summary panel when visible inside MonsterBattle
            if ((maybeKey === 'Enter' || maybeKey === 'Return') && this.state.inMonsterBattle && this.monsterBattleComponentRef && this.monsterBattleComponentRef.current) {
                try {
                    const mb = this.monsterBattleComponentRef.current;
                    if (mb.state && mb.state.showSummaryPanel) {
                        event.preventDefault();
                        if (typeof mb.confirmClicked === 'function') mb.confirmClicked();
                        return;
                    }
                } catch (err) {
                    console.warn('failed to invoke MonsterBattle.confirmClicked via ref', err);
                }
            }
            if ((maybeKey === 'i' || maybeKey === 'I') && this.state.inMonsterBattle && this.monsterBattleComponentRef && this.monsterBattleComponentRef.current) {
                event.preventDefault();
                try {
                    const mb = this.monsterBattleComponentRef.current;
                    if (mb && typeof mb.toggleInventory === 'function') {
                        mb.toggleInventory();
                    } else if (mb) {
                        // fallback
                        mb.setState((prev) => ({ showInventoryPopup: !prev.showInventoryPopup }));
                    }
                } catch (err) {
                    console.warn('failed to toggle MonsterBattle inventory via ref', err);
                }
                return;
            }
            // Toggle dungeon-level inventory when not in a monster battle
            if ((maybeKey === 'i' || maybeKey === 'I') && !this.state.inMonsterBattle) {
                event.preventDefault();
                    this.setState((prev) => ({ showInventoryPopup: !prev.showInventoryPopup }));
                return;
            }
        } catch (err) {
            // ignore key handling errors
        }

        if(this.state.keysLocked && this.state.inMonsterBattle){
            this.combatKeyDownHandler(event);
            return
        }

        if(this.state.keysLocked) return
        let key = event.key, code = event.code
        let newTiles = [], overlayTiles = [];
        // if(code === 'Space'){
        //     let paused = !this.state.paused;
        //     this.props.combatManager.pauseCombat(paused)
        //     this.setState({
        //         paused
        //     })
        // }

    // debug code/key log removed
        if(code === 'p'){
            let paused = !this.state.paused;
            this.props.combatManager.pauseCombat(paused)
            this.setState({
                paused
            })
        }
        if(code === 'Space'){
            this.checkWhichSideOfBoard();
        }
        switch(key){
                case '1':
                this.toggleFullscreen();
            break;
            case 'Space':
                
            break;
            case 'Tab':
                event.preventDefault();
                // Battle-specific tab handling (existing behavior)
                // if(this.monsterBattleComponentRef.current) this.monsterBattleComponentRef.current.tabToFighter();
                if(this.state.shiftDown){
                    if(this.monsterBattleComponentRef.current) this.monsterBattleComponentRef.current.tabToRetarget();
                } else {
                    if(this.monsterBattleComponentRef.current) this.monsterBattleComponentRef.current.tabToFighter();
                }
                // Dungeon-level tab handling: cycle selected crew member when not in a monster battle
                if(!this.state.inMonsterBattle){
                    const direction = this.state.shiftDown ? 'prev' : 'next';
                    this.cycleSelectedCrewMember(direction);
                }
            break;
            case 'Shift':
                event.preventDefault();
                this.setState({
                    shiftDown: true
                })
        break;
            case 'ArrowUp':
                if(this.state.keysLocked) return
                this.props.boardManager.moveUp();
                newTiles = [...this.props.boardManager.tiles]
                overlayTiles = this.props.boardManager.overlayTiles;
                this.setState({
                    tiles: newTiles,
                    overlayTiles,
                    showDarkMask: this.props.boardManager.setCurrentOrientation === 'B'
                })
                
            break;
            case 'ArrowDown':
                if(this.state.keysLocked) return
                this.props.boardManager.moveDown();
                newTiles = [...this.props.boardManager.tiles]
                overlayTiles = this.props.boardManager.overlayTiles;
                this.setState({
                    tiles: newTiles,
                    overlayTiles,
                    showDarkMask: this.props.boardManager.setCurrentOrientation === 'B'
                })
            break;
            case 'ArrowLeft':
                if(this.state.keysLocked) return
                this.props.boardManager.moveLeft();
                newTiles = [...this.props.boardManager.tiles]
                overlayTiles = this.props.boardManager.overlayTiles;
                this.setState({
                    tiles: newTiles,
                    overlayTiles,
                    showDarkMask: this.props.boardManager.setCurrentOrientation === 'B'
                })
            break;
            case 'ArrowRight':
                if(this.state.keysLocked) return
                this.props.boardManager.moveRight();
                newTiles = [...this.props.boardManager.tiles]
                overlayTiles = this.props.boardManager.overlayTiles;
                this.setState({
                    tiles: newTiles,
                    overlayTiles,
                    showDarkMask: this.props.boardManager.setCurrentOrientation === 'B'
                })
            break;
            default:
                // nathin
            break;
        }
    }
    combatKeyDownHandler = (event) => {
        let key = event.key, code = event.code;
        if(code === 'Space'){
            if(this.monsterBattleComponentRef.current) this.monsterBattleComponentRef.current.manualFire();
        }
        switch(key){
                // =/+ key: increase speed (decrease interval)
                case '=':
                case '+': {
                    const current = this.props.combatManager?.FIGHT_INTERVAL;
                    const idx = INTERVALS.indexOf(current);
                    if (idx < INTERVALS.length - 1) {
                        this.props.combatManager.updateAllFightIntervals(INTERVALS[idx + 1]);
                        this.forceUpdate();
                    }
                    break;
                }
                // - key: decrease speed (increase interval)
                case '-': {
                    const current = this.props.combatManager?.FIGHT_INTERVAL;
                    const idx = INTERVALS.indexOf(current);
                    if (idx > 0) {
                        this.props.combatManager.updateAllFightIntervals(INTERVALS[idx - 1]);
                        this.forceUpdate();
                    }
                    break;
                }
            case 'p':
                let paused = !this.state.paused;
                this.props.combatManager.pauseCombat(paused)
                this.setState({
                    paused
                })
            break;
            case 'q':
                if(this.monsterBattleComponentRef.current) this.monsterBattleComponentRef.current.selectSpecial();
            break;
            case 'w':
                if(this.monsterBattleComponentRef.current) this.monsterBattleComponentRef.current.selectConsumableSpecial();
            break;
            case 'Tab':
                event.preventDefault();
                if(this.state.shiftDown){
                    if(this.monsterBattleComponentRef.current) this.monsterBattleComponentRef.current.tabToRetarget();
                } else if(this.state.ctrlDown){
                    
                } else {
                    if(this.monsterBattleComponentRef.current) this.monsterBattleComponentRef.current.tabToFighter();
                }
            break;
            case 'Control':
                event.preventDefault();
                this.setState({ ctrlDown: true })
            break;
            case 'Shift':
                event.preventDefault();
                this.setState({ shiftDown: true })
            break;
            case 'ArrowUp':
                if(this.state.selectedCrewMember) this.props.combatManager.moveFighterOneSpace('up');
            break;
            case 'ArrowDown':
                if(this.state.selectedCrewMember) this.props.combatManager.moveFighterOneSpace('down');
            break;
            case 'ArrowLeft':
                if(this.state.selectedCrewMember) this.props.combatManager.moveFighterOneSpace('left');
            break;
            case 'ArrowRight':
                if(this.state.selectedCrewMember) this.props.combatManager.moveFighterOneSpace('right');
            break;
            default:
                // nuttin
            break;
        }
    }

    //might need to put this function somewhere else so it doesnt fire on every rerender
    // useEventListener('keydown', this.keyDownHandler);


    handleHover = (id, type, tile) => {
    }
    handleOverlayHover = (id, type, tile) => {
        this.setState({
            overlayHoveredTileId: id
        })
    }
    handleInventoryTileHover = (tileProps) => {
        let inv = this.state.inventoryHoverMatrix,
        descriptionText = '';
        this.props.inventoryManager.inventory.forEach((e,i)=>{
            inv[i] = '';
        })
        if(tileProps){
            inv[tileProps.id] = tileProps.contains;
            descriptionText = tileProps.description
            // switch(tileProps.image){
            //     case 'bundu_mask': 
            //         descriptionText = 'testing all bozos'
            //     break;
            //     default:
            //     break;
            // }
        }

        this.setState({
            inventoryHoverMatrix: inv,
            descriptionText
        })
    }
    
    handleCrewTileHover = (tileProps) => {
        let crew = this.state.crewHoverMatrix;
        this.props.crewManager.crew.forEach((e,i)=>{
            crew[i] = '';
        })
        if(tileProps) crew[tileProps.id] = tileProps.contains;
        this.setState({
            crewHoverMatrix: crew
        })
    }
    handleClick = (tile) => {
        // nothing
        console.log('tile: ', tile);
    }
    handleOverlayClick = (tile, event) => {
        if(!this.state.minimapPlaceMapMarkerStarted) return
        // this is for marking the minimap
        
        let minimapIndicators = this.state.minimapIndicators,
        activeMinimapIndex = this.state.minimap.findIndex(e=>e.active),
        indicatorContainer = minimapIndicators[activeMinimapIndex],
        inputElement = this.state.mapMarkerInput.current;
        switch(this.state.markerType){
            case 'enemy':
                {
                    const c = this.props.boardManager.tiles[tile.id].contains;
                    const typeVal = (typeof c === 'object' && c !== null) ? c.subtype || c.type : c;
                    indicatorContainer.enemies.push({ type: typeVal, tileId: tile.id })
                    inputElement.value = typeVal
                }
            break;
            case 'merchant':
                // merchant marker handling not implemented yet
            break;
            case 'gate':
                {
                    const c = this.props.boardManager.tiles[tile.id].contains;
                    const typeVal = (typeof c === 'object' && c !== null) ? (c.subtype || c.type) : c;
                    indicatorContainer.gates.push({ type: typeVal, tileId: tile.id })
                    inputElement.value = typeVal;
                }
            break;
            case 'stairs':
                {
                    const c = this.props.boardManager.tiles[tile.id].contains;
                    const typeVal = (typeof c === 'object' && c !== null) ? (c.subtype || c.type) : c;
                    indicatorContainer.stairs.push({ type: typeVal, tileId: tile.id })
                    inputElement.value = typeVal;
                }
            break;
            case 'custom':
                // custom marker handling not implemented yet
            break;
            default:
                break;
        }
        this.setState({
            minimapIndicators,
            minimapPlaceMapMarkerStarted: false
        })
    }

    handleMemberClickRitual = (member) => {
        this.setState({
            setMemberRitualOptions: member.data
        })
    }
    learnNewRitual = (magicUser) => {
        this.setState({ritualWrecked: true})
        this._setTimeout(()=>{
            this.setState({ritualWrecked: false}) 
        }, 1500)
    }
    handleMemberClick = (member) => {
        let meta = getMeta(), val;
        if(!member.data){
            return
        }
        let foundMember = this.props.crewManager.crew.find(e=>e.type === member.data.type);
        if(foundMember){
            this.props.crewManager.crew.forEach(c=>{
                c.selected = false;
            })
            foundMember.selected = true;
            meta.crew = this.props.crewManager.crew;
            storeMeta(meta);
            this.props.saveUserData();
        }
        if(this.state.selectedCrewMember && this.state.selectedCrewMember.type === member.data.type){
            val = {};
        } else {
            val = member.data;
        }
        
        this.setState({
            selectedCrewMember: val,
            actionsTrayExpanded: foundMember.actionsTrayExpanded,
            actionMenuTypeExpanded: foundMember.actionMenuTypeExpanded
        })
    }

    cycleSelectedCrewMember = (direction = 'next') => {
        // direction: 'next' or 'prev'
        const crew = (this.props.crewManager && this.props.crewManager.crew) || [];
        if(!crew || crew.length === 0) return;

        const currentType = this.state.selectedCrewMember && this.state.selectedCrewMember.type;
        let currentIndex = crew.findIndex(c => c.type === currentType);
        if(currentIndex === -1) currentIndex = 0;

        let nextIndex = 0;
        if(direction === 'prev'){
            nextIndex = (currentIndex - 1 + crew.length) % crew.length;
        } else {
            nextIndex = (currentIndex + 1) % crew.length;
        }

    // clear selection on all crew
        crew.forEach(c => c.selected = false);
        const foundMember = crew[nextIndex];
        foundMember.selected = true;

    // debug: log the selected member when cycling (Tab) so dev can inspect available stats
    try { console.log('cycleSelectedCrewMember selected:', foundMember); } catch (e) {}

        // persist selection to meta so other parts of the app see it
        try{
            const meta = getMeta();
            meta.crew = crew;
            storeMeta(meta);
            if(this.props.saveUserData) this.props.saveUserData();
        } catch (e) {
            console.warn('failed to store meta when cycling selected crew', e);
        }

        // update local state so UI updates (inventory popup border, etc.)
        this.setState({
            selectedCrewMember: foundMember,
            actionsTrayExpanded: foundMember.actionsTrayExpanded,
            actionMenuTypeExpanded: foundMember.actionMenuTypeExpanded
        })
    }
    handleEquipmentItemClick = (item) => {
        if(!item)return;
        const selectedCrewMember = this.state.selectedCrewMember;
        const itemIndex = selectedCrewMember.inventory.findIndex(e=>e===item);
        item.equippedBy = null;
        this.props.inventoryManager.addItem(item)
        selectedCrewMember.inventory.splice(itemIndex,1);
        this.setState({
            selectedCrewMember
        })
    }
    handleItemClick = (item, index) => {
        // New equip logic: place item into an appropriate equip slot on the selected crew member
        if(!item || index === undefined || index === null) return;
        const selected = this.state.selectedCrewMember;
        if(!selected || !selected.id){
            // nothing to equip to
            return;
        }

        // ensure inventory array exists on member
        if(!Array.isArray(selected.inventory)) selected.inventory = [];

        const subtype = item.subtype || '';
        const type = item.type || '';

        const slotOccupied = (slotName) => selected.inventory.some(i => i.equippedSlot === slotName);

        let targetSlot = null;

        // Map by subtype/type
        if(['helm','mask'].includes(subtype)){
            targetSlot = 'head';
            if(slotOccupied(targetSlot)) targetSlot = null;
        } else if(['amulet','armor'].includes(subtype)){
            targetSlot = 'chest';
            if(slotOccupied(targetSlot)) targetSlot = null;
        } else if(subtype === 'wand' || type === 'weapon' || subtype === 'shield'){
            // prefer left, then right
            if(!slotOccupied('left')) targetSlot = 'left';
            else if(!slotOccupied('right')) targetSlot = 'right';
            else targetSlot = null;
        } else if(subtype === 'charm'){
            // ancillary slots
            if(!slotOccupied('ancillary-left')) targetSlot = 'ancillary-left';
            else if(!slotOccupied('ancillary-right')) targetSlot = 'ancillary-right';
            else targetSlot = null;
        }

        if(!targetSlot){
            // no eligible slot or all relevant slots full — do nothing
            return;
        }

        // equip: set metadata on item, move from global inventory into crew member inventory
        try{
            item.equippedBy = selected.id;
            item.equippedSlot = targetSlot;

            // remove from player's global inventory by index
            if(this.props.inventoryManager && typeof this.props.inventoryManager.removeItemByIndex === 'function'){
                this.props.inventoryManager.removeItemByIndex(index);
            }

            // add to crew member inventory
            selected.inventory.push(item);

            // persist selection to meta and save
            const meta = getMeta();
            const crew = meta.crew || this.props.crewManager.crew;
            const found = crew.find(c => c.id === selected.id);
            if(found){
                // ensure found.inventory reflects selected.inventory
                found.inventory = selected.inventory;
            }
            meta.crew = crew;
            storeMeta(meta);
            if(this.props.saveUserData) this.props.saveUserData();

            // update state so UI refreshes
            this.setState({
                activeInventoryItem: item,
                selectedCrewMember: selected
            });
        } catch (err) {
            console.warn('failed to equip item', err);
        }
    }
    outfitNewCrew = () => {
        const meta = getMeta(),
        crew = meta.crew;
        crew.forEach((c)=>{
            let weapon;
            switch(c.type){
                case 'rogue':
                    weapon = this.props.inventoryManager.allItems['longbow']
                    c.inventory.push(weapon);
                break;
                case 'monk':
                    weapon = this.props.inventoryManager.allItems['flail']
                    c.inventory.push(weapon);
                break;
                case 'wizard':
                    weapon = this.props.inventoryManager.allItems['scepter']
                    c.inventory.push(weapon);
                break;
                case 'soldier':
                    weapon = this.props.inventoryManager.allItems['sword']
                    c.inventory.push(weapon);
                break;
                case 'sage':
                    weapon = this.props.inventoryManager.allItems['scepter']
                    c.inventory.push(weapon);
                break;
                case 'barbarian':
                    weapon = this.props.inventoryManager.allItems['axe']
                    c.inventory.push(weapon);
                break;
                default:
                    break;
            }
        })

    }
    loadNewDungeon = async () => {
        const meta = getMeta(),
              userId = getUserId(),
              userName = getUserName();
        const allDungeons = await loadAllDungeonsRequest();
        
        let dungeons = [],
            spawnList = [],
            selectedDungeon,
            spawnPoint;
            
        allDungeons.data.forEach((e, i) => {
            let d = JSON.parse(e.content)
            d.id = e._id
            dungeons.push(d)
        })
    // dungeons loaded
        selectedDungeon = dungeons[0]
        // selectedDungeon = dungeons.find(e=>e.name === 'Primari');
        let newDungeonPayload = {
            name: `${selectedDungeon.name}_${userName}_${userId.slice(userId.length-4)}`,
            levels: selectedDungeon.levels,
            pocket_planes: selectedDungeon.pocket_planes,
            descriptions: `${userName}'s dungeon`,
            spawn_points: selectedDungeon.spawn_points,
            valid: selectedDungeon.valid
          }
        const newDungeonRes = await addDungeonRequest(newDungeonPayload);
        selectedDungeon = JSON.parse(newDungeonRes.data.content);
        selectedDungeon.id = newDungeonRes.data._id;
        // spawnPoint = selectedDungeon.spawn_points[Math.floor(Math.random()*spawnList.length)]
        // ^ need to populate spawnList
        spawnPoint = selectedDungeon.spawn_points[0]


        this.props.inventoryManager.initializeItems()
    // spawnpoint selected
        if(spawnPoint){
            // return
            this.props.boardManager.setDungeon(selectedDungeon);
            let sp = spawnPoint.locationCode.split('_');
            const levelId =  spawnPoint.level;
            const level = selectedDungeon.levels.find(e=>e.id === levelId)
            const miniboardIndex = spawnPoint.miniboardIndex
            const orientation = sp[4];
            const spawnTileIndex = spawnPoint.id;
            const board = orientation === 'F' ? level.front.miniboards[miniboardIndex] : (orientation === 'B' ? level.back.miniboards[miniboardIndex] : null)
            if(board === null){
                // board is null -- investigate
                debugger
            }
            meta.selectedDungeon = selectedDungeon;
            meta.spawnPoint = spawnPoint;
            meta.location = {
                boardIndex: spawnPoint.miniboardIndex,
                tileIndex: spawnPoint.id,
                levelId,
                orientation
            }
            meta.dungeonId = selectedDungeon.id;
            storeMeta(meta)
            await updateUserRequest(userId, meta);
            this.props.boardManager.setCurrentLevel(level);
            this.props.boardManager.setCurrentOrientation(orientation);
            this.props.boardManager.initializeTilesFromMap(miniboardIndex, spawnTileIndex);
            const levelTracker = this.state.levelTracker;
            const minimap = this.state.minimap;
            minimap[miniboardIndex].active = true;
            let foundLevel = levelTracker.find(e=>e.id === levelId)
            foundLevel.active = true;

            let newIndicators = []
            for(let i = 0; i < 9; i++){
                newIndicators.push({
                    enemies: [],
                    gates: [],
                    merchant: [],
                    stairs: [],
                    misc: [],
                    custom: []
                })
            }

            meta.minimapIndicators = [{
                indicators: newIndicators,
                orientation,
                level: level.id
            }]

            storeMeta(meta);

            this.setState(()=>{
                return {
                    overlayTiles: this.props.boardManager.overlayTiles,
                    tiles: this.props.boardManager.tiles,
                    minimap,
                    levelTracker,
                    minimapZoomedTile: null,
                    minimapIndicators: {
                        level: foundLevel.id,
                        orientation,
                        indicators: newIndicators
                    }
                }
            })
            const firstCrewMember = this.props.crewManager.crew[0];
            this.handleMemberClick({data:firstCrewMember})
            this._setTimeout(()=>{
                this.toggleLeftSidePanel();
                this.toggleRightSidePanel();
            }, 1000)
        } else {
            // no valid dungeon
            // alert('no valid dungeon!')
        }
    }
    loadExistingDungeon = async (dungeonId) => {
        const meta = getMeta();

        // clear death tracker if you want:
        
        // try {
        //     meta.deathTracker = 0;
        //     storeMeta(meta);
        //     await updateUserRequest(getUserId(), meta).catch(()=>{});
        //     // Notify local UI/state handlers immediately so death-tracker visuals update.
        //     try { if (typeof this.handleDeathTrackerChanged === 'function') this.handleDeathTrackerChanged(0); } catch(e){}
        //     console.log('meta cleared: , meta:', meta);
        // } catch (e) {
        //     // best-effort: still persist locally
        //     try { meta.deathTracker = 0; storeMeta(meta); } catch (inner) {}
        // }

        const res = await loadDungeonRequest(dungeonId);
        if(res.data && res.data.length === 0){
            // cached dungeon deleted; go to first time flow
            this.loadNewDungeon();
            return
        }
        const dungeon = JSON.parse(res.data[0].content)
        dungeon.id = res.data[0]._id;
        const cleanupSummary = this.props.boardManager.setDungeon(dungeon)
        console.log('DungeonPage.loadExistingDungeon: called boardManager.setDungeon; cleanupSummary:', cleanupSummary);
        try {
            const metaAfter = getMeta() || {};
            if (metaAfter.lastMonsterTileCleanup) console.log('DungeonPage.loadExistingDungeon: meta.lastMonsterTileCleanup =', metaAfter.lastMonsterTileCleanup);
        } catch (e) {}
        this.props.boardManager.setCurrentLevel(dungeon.levels.find(l=> l.id === meta.location.levelId));
        this.props.boardManager.setCurrentOrientation(meta.location.orientation);
        this.props.boardManager.initializeTilesFromMap(meta.location.boardIndex, meta.location.tileIndex);
        const minimap = this.state.minimap,
        levels = this.state.levelTracker;
        let level = levels.find(e => e.id === meta.location.levelId);
        levels.forEach(e=>e.active = false)
        level.active = true;
        minimap[meta.location.boardIndex].active = true;
        
        let orientation = this.props.boardManager.currentOrientation;
        let indicatorsGroup = meta.minimapIndicators && meta.minimapIndicators.find(e=>e.level === level.id && e.orientation === orientation);

        if(!indicatorsGroup){
            let newIndicators = []
            for(let i = 0; i < 9; i++){
                newIndicators.push({
                    enemies: [],
                    gates: [],
                    merchant: [],
                    stairs: [],
                    misc: [],
                    custom: []
                })
            }
            indicatorsGroup = {
                level: level.id,
                orientation,
                indicators: newIndicators
            }
            meta.minimapIndicators.push(indicatorsGroup)
            storeMeta(meta)
        }
    let selectedCrewMember = this.props.crewManager.crew.find(c=>c.selected) || {};
        this.setState(()=>{
            return {
                spawn: meta.location.tileIndex,
                tiles: this.props.boardManager.tiles,
                overlayTiles: this.props.boardManager.overlayTiles,
                minimap,
                minimapIndicators: indicatorsGroup.indicators,
                levelTracker: levels,
                selectedCrewMember,
                actionsTrayExpanded: selectedCrewMember ? selectedCrewMember.actionsTrayExpanded : false,
                actionMenuTypeExpanded: selectedCrewMember ? selectedCrewMember.actionMenuTypeExpanded: false
            }
        })
    }
    toggleLeftSidePanel = async (val = null) => {
        // toggle left side panel
        // If called as an onClick handler it may receive an event object.
        // Accept either an object like { expanded: true } or no arg to toggle.
        const newVal = (val && typeof val === 'object' && Object.prototype.hasOwnProperty.call(val, 'expanded')) ? val.expanded : !this.state.leftPanelExpanded;
        this.setState({leftPanelExpanded: newVal})
        const meta = getMeta()
        meta.leftExpanded = newVal
        storeMeta(meta)
        await updateUserRequest(getUserId(), meta)
    }
    toggleRightSidePanel = async (val = null) => {
        // Handle event objects from onClick; accept { expanded } objects or toggle when no arg
        const newVal = (val && typeof val === 'object' && Object.prototype.hasOwnProperty.call(val, 'expanded')) ? val.expanded : !this.state.rightPanelExpanded
        this.setState({rightPanelExpanded: newVal})
        const meta = getMeta()
        meta.rightExpanded = newVal;
        storeMeta(meta)
        await updateUserRequest(getUserId(), meta)
    }
    toggleActionsTray = () => {
        const newVal = !this.state.actionsTrayExpanded

        let foundMember = this.props.crewManager.crew.find(c=>c.selected);
        foundMember.actionsTrayExpanded = newVal;
        let meta = getMeta();
        meta.crew = this.props.crewManager.crew;
        storeMeta(meta);
        this.props.saveUserData();


        this.setState({actionsTrayExpanded: newVal})
    }
    toggleCrewActionsTray = () => {
        const newVal = !this.state.crewActionsTrayExpanded;
        // persist crew actions tray state to meta so it survives reloads
        try {
            const meta = getMeta() || {};
            meta.crewActionsTrayExpanded = newVal;
            storeMeta(meta);
            if (this.props.saveUserData) this.props.saveUserData();
        } catch (e) {}
        this.setState({ crewActionsTrayExpanded: newVal });
    }

    // Start camping. Accepts optional durationSeconds (number). If called as an event handler,
    // the first param may be an event object; use default when not provided.
    setUpCamp = async (maybeDuration) => {
        let durationSeconds = 180;
        try { if (typeof maybeDuration === 'number') durationSeconds = maybeDuration; } catch(e){}
        try {
            try { if (this.campTimeout) { clearTimeout(this.campTimeout); this.campTimeout = null; } } catch (e) {}
            let meta = getMeta() || {};
            const now = new Date();
            meta.camping = true;
            meta.campingStart = now.toISOString();
            meta.campingEnd = new Date(now.getTime() + durationSeconds * 1000).toISOString();
            storeMeta(meta);
            try { await updateUserRequest(getUserId(), meta); } catch (e) {}
            // Persist meta via the higher-level save helper so location and session
            // state are stored consistently (ensures position is saved on refresh).
            try { if (this.props.saveUserData) await this.props.saveUserData(); } catch (e) {}
            // camping started
            // lock movement hotkeys while camping
            try { this.setState({ keysLocked: true }); } catch(e) {}
            if (this.props.boardManager && typeof this.props.boardManager.placePlayer === 'function') {
                try{ this.props.boardManager.placePlayer(this.props.boardManager.playerTile.location); } catch(e){}
            }
            this.setState({ overlayTiles: this.props.boardManager.overlayTiles });
            // ensure continuous draw loop while camping to avoid flashing
            try {
                this._forcedDraw = true;
                if (!this.cooldownAnimationFrame) this.cooldownAnimationFrame = requestAnimationFrame(this.drawCooldowns);
            } catch (e) {}
            // schedule end
            try { this.campTimeout = this._setTimeout(() => { try { this.endCamp(); } catch(e){ console.warn('endCamp timeout failed', e); } }, durationSeconds*1000 + 200); } catch(e){}
        } catch (err) { console.warn('setUpCamp error', err); }
    }

    // End camping immediately and apply restorative effects
    endCamp = async () => {
        try {
            try { if (this.campTimeout) { clearTimeout(this.campTimeout); this.campTimeout = null; } } catch (e) {}
            let m = getMeta() || {};
            m.camping = false;
            delete m.campingStart;
            delete m.campingEnd;
            try {
                const crew = (this.props.crewManager && this.props.crewManager.crew) || [];
                crew.forEach(member => {
                    if (!member) return;
                    if (member.dead) { member.dead = false; member.hp = 1; }
                    else { try { member.hp = (member.stats && typeof member.stats.hp === 'number') ? member.stats.hp : member.hp || 0; } catch(e){} }
                });
                m.crew = crew;
                try { if (this.props.crewManager) this.props.crewManager.crew = m.crew; } catch(e){}
            } catch(e){}
            storeMeta(m);
            try { await updateUserRequest(getUserId(), m); } catch(e){}
            if (this.props.boardManager && typeof this.props.boardManager.placePlayer === 'function') {
                try{ this.props.boardManager.placePlayer(this.props.boardManager.playerTile.location); } catch(e){}
            }
            this.setState({ overlayTiles: this.props.boardManager.overlayTiles, selectedCrewMember: this.state.selectedCrewMember });
            try { if (this.props.saveUserData) this.props.saveUserData(); } catch(e){}
            // camping ended and crew restored
            // unlock movement hotkeys
            try { this.setState({ keysLocked: false }); } catch(e) {}
            // stop forced draw loop and clear canvas
            try {
                this._forcedDraw = false;
                if (this.cooldownAnimationFrame) { cancelAnimationFrame(this.cooldownAnimationFrame); this.cooldownAnimationFrame = null; }
                if (this.cooldownCanvas) {
                    const ctx = this.cooldownCanvas.getContext && this.cooldownCanvas.getContext('2d');
                    if (ctx) ctx.clearRect(0, 0, this.cooldownCanvas.width, this.cooldownCanvas.height);
                }
            } catch (e) {}
        } catch (err) { console.warn('endCamp error', err); }
    }
    uppercaseFirstLetter = (text) => {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
    battleOver = (result) => {
        console.log('battle over result: ', result);
        if(result === 'win'){
            this.props.boardManager.removeDefeatedMonsterTile(this.state.monsterBattleTileId)
            this.props.crewManager.checkForLevelUp(this.props.crewManager.crew)
            let meta = getMeta()
            meta.crew = this.props.crewManager.crew;
            storeMeta(meta)
            this.props.saveUserData()
        } else if(result === 'respawn'){
                  // Try to respawn the player at spawn point (guard against missing boardManager)
                  const meta2 = getMeta();
                    if (meta2 && Array.isArray(meta2.crew)) {
                        meta2.crew.forEach(c => {
                            if (!c) return;
                            c.hp = 1;
                            c.dead = false;
                        });
                        const spawnPoint = meta2.spawnPoint;
                        console.log('spawn point: ', spawnPoint);
                        const selectedDungeon = meta2.selectedDungeon;
                        let sp = spawnPoint.locationCode.split('_');
                        const levelId =  spawnPoint.level;
                        const level = selectedDungeon.levels.find(e=>e.id === levelId)
                        const miniboardIndex = spawnPoint.miniboardIndex
                        const orientation = sp[4];
                        const spawnTileIndex = spawnPoint.id;
                        const board = orientation === 'F' ? level.front.miniboards[miniboardIndex] : (orientation === 'B' ? level.back.miniboards[miniboardIndex] : null)

                        meta2.location = {
                            boardIndex: spawnPoint.miniboardIndex,
                            tileIndex: spawnPoint.id,
                            levelId,
                            orientation
                        }
                        try { storeMeta(meta2); } catch(e) {}
                        try { this.props.crewManager.initializeCrew(meta2.crew); } catch(e) {}
                        try { if (this.props.saveUserData) this.props.saveUserData(); } catch(e) {}

                        // // Notify parent UI for each crew member so DungeonPage updates portrait overlays
                        // try {
                        //     if (this.props && typeof this.props.onFighterUpdate === 'function') {
                        //         meta2.crew.forEach(c => {
                        //             try { this.props.onFighterUpdate(c); } catch (inner) {}
                        //         });
                        //     }
                        // } catch (inner) { }
                    }
            try {
                
                console.log('current location: ', meta2.location);
                // debugger
                if (meta2 && meta2.location && this.props && this.props.boardManager) {
                    try {
                        const bm = this.props.boardManager;
                        // Place the player at the saved location without reinitializing the
                        // entire board (which could reintroduce removed items). Then
                        // respawn monsters only using the boardManager.respawnMonsters
                        // method which only affects monster tiles.
                        if (typeof bm.getCoordinatesFromIndex === 'function' && typeof bm.placePlayer === 'function') {
                            const coords = bm.getCoordinatesFromIndex(meta2.location.tileIndex);
                            bm.placePlayer(coords);
                        }
                        try {
                            // Use the manager's own dungeon/template to respawn monsters.
                            if (typeof bm.respawnMonsters === 'function') bm.respawnMonsters(bm.dungeon || {});
                        } catch (inner) { console.warn('respawnMonsters failed', inner); }
                        try { if (typeof this.setState === 'function') this.setState({ overlayTiles: bm.overlayTiles, tiles: bm.tiles }); } catch(e){}
                    } catch (inner) {
                        console.warn('group-death: respawn failed', inner);
                    }
                } else {
                    console.warn('group-death: cannot respawn - boardManager missing');
                }
            } catch (inner) { console.warn('group-death: respawn failed', inner); }
        }
        try {
            // If we saved the pre-combat panel state, restore it now so the UI returns
            // to the same expanded/collapsed configuration the player had before combat.
            if (this._preCombatPanels) {
                const prev = this._preCombatPanels;
                try {
                    this.setState({
                        leftPanelExpanded: !!prev.left,
                        rightPanelExpanded: !!prev.right
                    });
                } catch (e) {}
                try {
                    const meta = getMeta() || {};
                    meta.leftExpanded = !!prev.left;
                    meta.rightExpanded = !!prev.right;
                    try { storeMeta(meta); } catch (e) {}
                    try { updateUserRequest(getUserId(), meta).catch(()=>{}); } catch(e) {}
                } catch (inner) {}
                this._preCombatPanels = null;
            }
        } catch (err) {
            console.warn('battleOver: failed to restore panel state', err);
        }

        this.setState({
            keysLocked : false,
            inMonsterBattle: false
        })
    }
    minimapTileClicked = (index) => {
        this.setState({
            minimapZoomedTile: index
        })
    }
    calcPlayerIndicatorTop = () => {
        let formattedCoords = {x: this.props.boardManager.playerTile.location[0]-15, y: this.props.boardManager.playerTile.location[1]-15};
        let fromTop = formattedCoords.x
        return `${fromTop / 14 * 100}%`
    }
    calcPlayerIndicatorLeft = () => {
        let formattedCoords = {x: this.props.boardManager.playerTile.location[0]-15, y: this.props.boardManager.playerTile.location[1]-15}
        let fromLeft = formattedCoords.y;
        return `${fromLeft / 14 * 100}%`
    }
    calcIndicator = (tileId) => {
        let coords = this.props.boardManager.getCoordinatesFromIndex(tileId);
        return {
            left: `${(coords[1]-15) / 14 * 100}%`,
            top: `${(coords[0]-15) / 14 * 100}%`
        }
    }
    clearAllMarkers = () => {
        let meta = getMeta();
        meta.minimapIndicators = []
        storeMeta(meta)

        let newIndicators = []
        for(let i = 0; i < 9; i++){
            newIndicators.push({
                enemies: [],
                gates: [],
                merchant: [],
                stairs: [],
                misc: [],
                custom: []
            })
        }
        
        this.setState({
            minimapIndicators: newIndicators
        })
    }
    beginMarkingMap = () => {
        let current = this.state.minimapMarkerTrayOpen;
        this.setState({
            minimapMarkerTrayOpen: !current
        })
    }
    placeMapMarkerStart = () => {
        this.setState({
            minimapPlaceMapMarkerStarted: true
        })

    }
    submitMarkers = () => {
        let meta = getMeta();
        let indicators = this.state.minimapIndicators;
        let orientation = this.props.boardManager.currentOrientation;
        let levelId = this.props.boardManager.currentLevel.id
        let obj = {
            level: levelId,
            orientation,
            indicators
        }
        if(!meta['minimapIndicators']){
            meta['minimapIndicators'] = [obj]
        } else if(meta.minimapIndicators.find(e=>e.level === levelId && e.orientation === orientation)){
            let existing = meta.minimapIndicators.find(e=>e.level === levelId && e.orientation === orientation);
            existing.indicators = indicators;
        } else {
            meta.minimapIndicators.push(obj)
        }
        storeMeta(meta)
        // this.state.mapMarkerInput.current.value = null;
        // this.state.markerSelectVal.current.value = 'Marker Type';
        this.setState({
            minimapMarkerTrayOpen: false,
            minimapPlaceMapMarkerStarted: false,
            markerName: '',
            markerType: 'Marker Type'
        })
    }
    onMarkerNameInputChange = (markerName) => {
        this.setState({
            markerName
        })
    }
    onMarkerTypeDropdownChange = (markerType) => {
        this.setState({
            markerType
        })
    }
    handleActionClick = (action) => {
        let val = this.state.actionMenuTypeExpanded === action.type ? '' : action.type

        let foundMember = this.props.crewManager.crew.find(c=>c.selected);
        if(foundMember.actionMenuExpanded){
            delete foundMember.actionMenuExpanded
        }
        foundMember.actionMenuTypeExpanded = val;
        let meta = getMeta();
        meta.crew = this.props.crewManager.crew;
        storeMeta(meta);
        this.props.saveUserData();

        this.setState({
            actionMenuTypeExpanded: val
        })
    }
    getSubtypeClass = (subtype, maxReached) => {
        if(!subtype.available) return 'disabled'
        if(maxReached) return 'max-reached'
        if(this.state.selectedCrewMember.specialActions.some(a=> {
            let end = new Date(a.endDate);
            let now = new Date()
            return end > now
        })) return 'in-progress'
    }
    // For special-action-icon: Roman numerals as text
    getSubtypeNumeralElement = (subtype) => {
        if (!subtype.count || subtype.count < 1) return null;
        const numerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
        const idx = Math.max(0, Math.min(subtype.count, numerals.length - 1));
        return <div className="numeral">{numerals[idx]}</div>;
    }

    // For action-sub-menu/action-subtype: image-based numbers
    getSubtypeImageCountElement = (subtype) => {
        let arr = ['zero','one','two','three','four','five','six','seven','eight','nine'];
        if (!subtype.count || subtype.count < 1) return null;
        let idx = Math.max(0, Math.min(subtype.count, arr.length - 1));
        return <div className="numeral" style={{backgroundImage: `url(${images[arr[idx]]})`}}></div>;
    }
    handleActionSubtypeClick = (action, subType) => {
        let characterFromCrew = this.props.crewManager.crew.find(e=> e.id === this.state.selectedCrewMember.id)
        this.props.crewManager.beginSpecialAction(characterFromCrew, action, subType)
        const meta = getMeta();
        meta.crew = this.props.crewManager.crew;
        storeMeta(meta);
        this.props.saveUserData();
        // Force update to reflect new specialActions count immediately
        // Find updated selectedCrewMember from crewManager
        const updatedCrewMember = this.props.crewManager.crew.find(e => e.id === this.state.selectedCrewMember.id);
        if (updatedCrewMember) {
            this.setState({ selectedCrewMember: { ...updatedCrewMember } });
        }
    }

    // Called by MonsterBattle (via prop) when a fighter's consumable specialActions change
    handleFighterUpdateFromBattle = (fighter) => {
        if (!fighter || !fighter.id) return;
        try {
            // Update crewManager's copy
            if (this.props.crewManager && Array.isArray(this.props.crewManager.crew)) {
                const idx = this.props.crewManager.crew.findIndex(c => c && c.id === fighter.id);
                if (idx !== -1) {
                    this.props.crewManager.crew[idx].specialActions = JSON.parse(JSON.stringify(fighter.specialActions || []));
                    // Also update hp/dead if provided by combat
                    if (typeof fighter.hp !== 'undefined') this.props.crewManager.crew[idx].hp = fighter.hp;
                    if (typeof fighter.dead !== 'undefined') this.props.crewManager.crew[idx].dead = !!fighter.dead;
                }
            }

            // If this fighter is currently selected, update selectedCrewMember state so UI updates immediately
            if (this.state.selectedCrewMember && this.state.selectedCrewMember.id === fighter.id) {
                this.setState({ selectedCrewMember: { ...this.state.selectedCrewMember, specialActions: JSON.parse(JSON.stringify(fighter.specialActions || [])), hp: (typeof fighter.hp !== 'undefined' ? fighter.hp : this.state.selectedCrewMember.hp), dead: (typeof fighter.dead !== 'undefined' ? !!fighter.dead : this.state.selectedCrewMember.dead) } });
            }

            // Persist to meta as well
            try {
                const meta = getMeta();
                if (meta && Array.isArray(meta.crew)) {
                    const mIdx = meta.crew.findIndex(c => c && c.id === fighter.id);
                    if (mIdx !== -1) {
                        meta.crew[mIdx].specialActions = JSON.parse(JSON.stringify(fighter.specialActions || []));
                        if (typeof fighter.hp !== 'undefined') meta.crew[mIdx].hp = fighter.hp;
                        if (typeof fighter.dead !== 'undefined') meta.crew[mIdx].dead = !!fighter.dead;
                        storeMeta(meta);
                        if (typeof this.props.saveUserData === 'function') this.props.saveUserData();
                    }
                }
            } catch (err) {
                console.warn('handleFighterUpdateFromBattle: failed to persist meta', err);
            }
        } catch (err) {
            console.warn('handleFighterUpdateFromBattle failed', err);
        }
    }
    getActionCooldownPercentage = (action) => {
    if(!action) return;
    const startDate = new Date(action.startDate);
    const endDate = new Date(action.endDate);
    let diffInMilli = endDate - startDate;
    let diffInMinutes = diffInMilli / (1000 * 60);
    let currentTime = new Date();
    let minutesElapsed = (currentTime - startDate) / (1000 * 60);
    let percentageComplete = Math.ceil(minutesElapsed/diffInMinutes*100);
    if(percentageComplete > 100) percentageComplete = 100;
    return percentageComplete;
    }
    onUpdateModalClosed = () => {
        switch(this.state.modalType){
            case 'Updates':
                const meta = getMeta();
                let updates = this.state.updates;
                let crew = meta.crew;
                crew.forEach(c=>{
                    if(updates.some(e=>e.owner === c.name)){
                        let update = updates.find(e=>e.owner === c.name)
                        let ref = c.specialActions.find(e=> e.type === update.actionType && !e.notified)
                        if (ref) ref.notified = true;
                    }
                })
                meta.crew = crew;
                this.props.crewManager.crew = crew;
                storeMeta(meta);
                this.props.saveUserData();
                this.setState({showModal: false})
            break;
            case 'PrepComplete':
                // In-session preparation completion modal — clear auto-dismiss timeout and close
                if (this.prepCompleteTimeout) {
                    clearTimeout(this.prepCompleteTimeout);
                    this.prepCompleteTimeout = null;
                }
                this.setState({ showModal: false });
            break;
            case 'Magic':
                this.setState({keysLocked: false})
            break;
        }
    }
    checkWhichSideOfBoard = () => {
        let side = this.props.boardManager.playerTile.location[0] < 22 ? 'top' : 'bottom'
        // console.log('side of board: ', side);
        return side
    }
    triggerRitualEncounter = () => {
        this.setState({
            keysLocked: true,
            modalType: 'Magic',
            showModal: true
        })
    }
    render(){
        return (
        <div className={`dungeon-container ${this.state.ritualWrecked ? 'wrecked' : ''}`}>
            <CModal className={this.state.modalType === 'PrepComplete' ? 'prep-complete-modal' : ''} alignment="center" visible={this.state.showModal} onClose={() => this.onUpdateModalClosed()}>
                <ModalInner
                    modalType={this.state.modalType}
                    updates={this.state.updates}
                    crew={this.props.crewManager.crew}
                    tileSize={this.state.tileSize}
                    handleMemberClickRitual={this.handleMemberClickRitual}
                    handleCrewTileHover={this.handleCrewTileHover}
                    setMemberRitualOptions={this.state.setMemberRitualOptions}
                />
            </CModal>
            {/* <ExpositionPane></ExpositionPane> */}
            {this.props.boardManager.currentOrientation === 'B' && <div className="dark-mask"></div>}
            <div className={`left-side-panel ${this.state.leftPanelExpanded ? 'expanded' : ''}`}>
                <div className="expand-collapse-button icon-container" onClick={this.toggleLeftSidePanel}>
                    <CIcon icon={cilCaretRight} className={`expand-icon ${this.state.leftPanelExpanded ? 'expanded' : ''}`} size="sm"/>
                </div>
                {/* <div className="minimap-container">

                </div> */}
                {/* crew-container moved to right-side panel */}
                {this.state.selectedCrewMember.name && <div className="crew-info-section">
                        <div className="portrait-wrapper">
                            <div className="status-container">
                                <div className="member-level-indicator">Lvl {this.state.selectedCrewMember.level}</div>
                            </div>
                            <div className="portrait" style={{backgroundImage: "url(" + this.state.selectedCrewMember.portrait + ")"}}></div>
                            <div className="cooldowns-container">
                                {/* Group special actions by type (flat structure) */}
                                {(() => {
                                    const actions = this.state.selectedCrewMember.specialActions || [];
                                    const grouped = {};
                                    actions.forEach(action => {
                                        const type = action.type;
                                        if (!grouped[type]) grouped[type] = [];
                                        grouped[type].push(action);
                                    });
                                    return Object.keys(grouped).map((type, i) => {
                                        const group = grouped[type];
                                        const action = group[0]; // representative
                                        const count = group.filter(a => a.available).length;
                                        // Prefer an in-progress action (one whose start/end bracket 'now') for the circular progress UI.
                                        const now = new Date();
                                        const inProgressAction = group.find(a => {
                                            if (!a || !a.startDate || !a.endDate) return false;
                                            const s = new Date(a.startDate);
                                            const e = new Date(a.endDate);
                                            return now >= s && now < e;
                                        });
                                        const progressPct = inProgressAction ? this.getActionCooldownPercentage(inProgressAction) : 0;
                                        
                                        // Prefer iconUrlInverted for DungeonPage (dark bg), fallback to iconUrl, then subtype/default
                                        let iconUrl = action.iconUrlInverted || action.iconUrl;
                                        if (!iconUrl && action.subtype === 'magic missile' && typeof images !== 'undefined') {
                                            iconUrl = images['magic_missile_inverted'] || images['magic_missile'];
                                        }
                                        if (!iconUrl && typeof images !== 'undefined') {
                                            iconUrl = images['glyph_inverted'] || '';
                                        }
                                        return (
                                            <div key={type} className="special-action-wrapper" style={{position: 'relative'}}>
                                                <div className="special-action-icon" style={{backgroundImage: `url(${iconUrl})`}}></div>
                                                {inProgressAction && progressPct < 50 && <div className="progress-overlay"></div>}
                                                {inProgressAction && <div className="left" style={{transform: `rotate(${this.getRotateDegreesLeft(progressPct)}deg)`}}></div>}
                                                {inProgressAction && <div className="right" style={{transform: `rotate(${this.getRotateDegreesRight(progressPct)}deg)`}}></div>}
                                                {count >= 1 && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 6,
                                                        right: -16,
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        borderRadius: '50%',
                                                        minWidth: 18,
                                                        minHeight: 18,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 10,
                                                        zIndex: 99,
                                                    }}>
                                                        {this.getSubtypeNumeralElement({count})}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                        <div className="name-line">{this.state.selectedCrewMember.name} the {this.uppercaseFirstLetter(this.state.selectedCrewMember.type)}</div>
                        {/* HP bar (hp-line-container) - shows current HP proportion */}
                        {(() => {
                            const selected = this.state.selectedCrewMember || {};
                            const maxHp = (selected.stats && selected.stats.hp) ? selected.stats.hp : 0;
                            const currentHp = (typeof selected.hp !== 'undefined') ? selected.hp : maxHp;
                            const hpPct = maxHp > 0 ? Math.max(0, Math.min(100, Math.ceil((currentHp / maxHp) * 100))) : 0;
                            return (
                                <div className="hp-line-container" style={{width: '100%'}}>
                                    <div className="hp-line" style={{width: `${hpPct}%`}}></div>
                                </div>
                            )
                        })()}

                        <div className="experience-line-container">
                            <div className="experience-line" style={{width: `${this.props.crewManager.calculateExpPercentage(this.state.selectedCrewMember)}%`}}></div>
                        </div>

                        {/* Max HP stat-line under the experience container */}
                        {(() => {
                            const selected = this.state.selectedCrewMember || {};
                            const maxHp = (selected.stats && selected.stats.hp) ? selected.stats.hp : 0;
                            return (
                                <div className="stat-line"> <span className="stat-name">Max HP</span>  <span className='stat-value'>{maxHp} </span> </div>
                            )
                        })()}
                        <div className="stat-line"> <span className="stat-name">Strength</span>  <span className='stat-value'>{this.state.selectedCrewMember.stats.str} </span> </div>
                        <div className="stat-line">Dexterity <span className='stat-value'> {this.state.selectedCrewMember.stats.dex} </span></div>
                        <div className="stat-line">Intelligence <span className='stat-value'>{this.state.selectedCrewMember.stats.int} </span></div>
                        <div className="stat-line">Vitality <span className='stat-value'>{this.state.selectedCrewMember.stats.vit} </span></div>
                        <div className="stat-line">Fortitude <span className='stat-value'> {this.state.selectedCrewMember.stats.fort} </span></div>
                        <div className="icon-container menu" onClick={this.toggleActionsTray}>
                            <CIcon icon={cilMenu} className={`menu-icon ${this.state.leftPanelExpanded ? 'expanded' : ''}`} size="sm"/>
                            Actions
                        </div>
                        <div className={`actions-tray ${this.state.actionsTrayExpanded && this.state.actionMenuTypeExpanded ? 'double-expanded' : 
                        (this.state.actionsTrayExpanded ? 'expanded' : '')}`}>
                            {this.getCharacterActions(this.state.selectedCrewMember)}
                        </div>
                        <div className="equipment-panel">
                            {/* Replaced with a direct copy of the `.crew-body` from the inventory popup */}
                            <div className='crew-body' style={{backgroundImage: `url(${images.body_male})`, filter: 'invert(1)', backgroundSize: '130%', marginTop: '-16px'}}>
                                {/* equip slots: chest, right-hand, left-hand, head, ancillary-left, ancillary-right */}
                                {(() => {
                                    const selected = this.state.selectedCrewMember || {};
                                    const findEquipped = (slot) => {
                                        const slotsToCheck = (slot === 'pet' || slot === 'bottom-left') ? ['pet','bottom-left'] : [slot];
                                        return (selected.inventory || []).find(i => slotsToCheck.includes(i.equippedSlot));
                                    };
                                    const chest = findEquipped('chest');
                                    const right = findEquipped('right');
                                    const left = findEquipped('left');
                                    const head = findEquipped('head');
                                    const bottomLeft = findEquipped('pet');
                                    const ancillaryLeft = findEquipped('ancillary-left');
                                    const ancillaryRight = findEquipped('ancillary-right');
                                    return (
                                        <>
                                            <div className='equip-slot slot-chest'>{chest && (
                                                <Tile
                                                    id={chest.id}
                                                    data={chest}
                                                    tileSize={this.state.tileSize}
                                                    image={chest.icon}
                                                    contains={chest.name ? chest.name.replace(' ', '_') : null}
                                                    color={chest.color}
                                                    editMode={false}
                                                    type={'inventory-tile'}
                                                    handleClick={() => this.handleEquipmentItemClick(chest)}
                                                    handleHover={this.handleInventoryTileHover}
                                                />
                                            )}</div>
                                            <div className='equip-slot slot-right'>{right && (
                                                <Tile
                                                    id={right.id}
                                                    data={right}
                                                    tileSize={this.state.tileSize}
                                                    image={right.icon}
                                                    contains={right.name ? right.name.replace(' ', '_') : null}
                                                    color={right.color}
                                                    editMode={false}
                                                    type={'inventory-tile'}
                                                    handleClick={() => this.handleEquipmentItemClick(right)}
                                                    handleHover={this.handleInventoryTileHover}
                                                />
                                            )}</div>
                                            <div className='equip-slot slot-left'>{left && (
                                                <Tile
                                                    id={left.id}
                                                    data={left}
                                                    tileSize={this.state.tileSize}
                                                    image={left.icon}
                                                    contains={left.name ? left.name.replace(' ', '_') : null}
                                                    color={left.color}
                                                    editMode={false}
                                                    type={'inventory-tile'}
                                                    handleClick={() => this.handleEquipmentItemClick(left)}
                                                    handleHover={this.handleInventoryTileHover}
                                                />
                                            )}</div>
                                            <div className='equip-slot slot-head'>{head && (
                                                <Tile
                                                    id={head.id}
                                                    data={head}
                                                    tileSize={this.state.tileSize}
                                                    image={head.icon}
                                                    contains={head.name ? head.name.replace(' ', '_') : null}
                                                    color={head.color}
                                                    editMode={false}
                                                    type={'inventory-tile'}
                                                    handleClick={() => this.handleEquipmentItemClick(head)}
                                                    handleHover={this.handleInventoryTileHover}
                                                />
                                            )}</div>
                                            <div className='equip-slot slot-ancillary-left'>{ancillaryLeft && (
                                                <Tile
                                                    id={ancillaryLeft.id}
                                                    data={ancillaryLeft}
                                                    tileSize={this.state.tileSize}
                                                    image={ancillaryLeft.icon}
                                                    contains={ancillaryLeft.name ? ancillaryLeft.name.replace(' ', '_') : null}
                                                    color={ancillaryLeft.color}
                                                    editMode={false}
                                                    type={'inventory-tile'}
                                                    handleClick={() => this.handleEquipmentItemClick(ancillaryLeft)}
                                                    handleHover={this.handleInventoryTileHover}
                                                />
                                            )}</div>
                                            <div className='equip-slot slot-ancillary-right'>{ancillaryRight && (
                                                <Tile
                                                    id={ancillaryRight.id}
                                                    data={ancillaryRight}
                                                    tileSize={this.state.tileSize}
                                                    image={ancillaryRight.icon}
                                                    contains={ancillaryRight.name ? ancillaryRight.name.replace(' ', '_') : null}
                                                    color={ancillaryRight.color}
                                                    editMode={false}
                                                    type={'inventory-tile'}
                                                    handleClick={() => this.handleEquipmentItemClick(ancillaryRight)}
                                                    handleHover={this.handleInventoryTileHover}
                                                />
                                            )}</div>
                                            <div className='equip-slot slot-pet'>{bottomLeft && (
                                                <Tile
                                                    id={bottomLeft.id}
                                                    data={bottomLeft}
                                                    tileSize={this.state.tileSize}
                                                    image={bottomLeft.icon}
                                                    contains={bottomLeft.name ? bottomLeft.name.replace(' ', '_') : null}
                                                    color={bottomLeft.color}
                                                    editMode={false}
                                                    type={'inventory-tile'}
                                                    handleClick={() => this.handleEquipmentItemClick(bottomLeft)}
                                                    handleHover={this.handleInventoryTileHover}
                                                />
                                            )}</div>
                                        </>
                                    )
                                })()}
                            </div>
                            {/* left-body-preview mirror (kept for legacy styling hooks) */}
                            <div className='left-body-preview' style={{backgroundImage: `url(${images.body_male})`, backgroundSize: '130%'}}></div>
                            {/* stats display area removed from left panel (kept only in inventory popup) */}
                        </div>
                        <div className="description-panel">
                            {this.state.descriptionText}
                        </div>
                </div>}
            </div>
            <div className={`right-side-panel ${this.state.rightPanelExpanded ? 'expanded' : ''}`}>
                <div className="minimap-container">
                    <div className="map-wrapper">
                        <div className="level-indicator">
                            {this.state.levelTracker && this.state.levelTracker.map((e,i)=>{
                                return <div key={i} className={`floor-level ${e.active ? 'active' : ''} `}></div>
                            })}
                        </div>
                        {this.state.minimap.map((e,i)=>{
                            return <div className={`minimap-tile 
                            ${this.state.minimap[i].active ? 'active' : ''}
                            ${this.state.minimapZoomedTile === i ? 'zoomed' : ''}
                            ${this.state.minimapZoomedTile === i && i === 0 ? 'topLeft' : ''}
                            ${this.state.minimapZoomedTile === i && i === 1 ? 'topMid' : ''}
                            ${this.state.minimapZoomedTile === i && i === 2 ? 'topRight' : ''}
                            ${this.state.minimapZoomedTile === i && i === 3 ? 'midLeft' : ''}
                            ${this.state.minimapZoomedTile === i && i === 5 ? 'midRight' : ''}
                            ${this.state.minimapZoomedTile === i && i === 6 ? 'botLeft' : ''}
                            ${this.state.minimapZoomedTile === i && i === 7 ? 'botMid' : ''}
                            ${this.state.minimapZoomedTile === i && i === 8 ? 'botRight' : ''}
                            `} key={i} onClick={() => this.minimapTileClicked(i)}>
                                
                                {/* // player // */}
                                {this.state.minimap[i].active && <div className="player-position-indicator"
                                style={{
                                    left: this.calcPlayerIndicatorLeft(),
                                    top: this.calcPlayerIndicatorTop()
                                }}></div>}

                                {/* // enemies // */}
                                {this.state.minimapIndicators[i] && this.state.minimapIndicators[i].enemies.map((indicator,idx)=>{
                                    return <div key={idx} className={`minimap-indicator enemy`}
                                    style={{
                                        left: this.calcIndicator(indicator.tileId).left,
                                        top: this.calcIndicator(indicator.tileId).top
                                    }}>
                                    </div>
                                })}

                                {/* // stairs // */}
                                {this.state.minimapIndicators[i] && this.state.minimapIndicators[i].stairs.map((indicator,idx)=>{
                                    return <div key={idx} className={`minimap-indicator stairs`}
                                    style={{
                                        left: this.calcIndicator(indicator.tileId).left,
                                        top: this.calcIndicator(indicator.tileId).top
                                    }}>
                                    </div>
                                })}

                                {/* // gates // */}
                                {this.state.minimapIndicators[i] && this.state.minimapIndicators[i].gates.map((indicator,idx)=>{
                                    return <div key={idx} className={`minimap-indicator gate`}
                                    style={{
                                        left: this.calcIndicator(indicator.tileId).left,
                                        top: this.calcIndicator(indicator.tileId).top
                                    }}>
                                    </div>
                                })}

                            </div>
                        })}
                    </div>
                    <div className={`tray-wrapper ${this.state.minimapZoomedTile !== null ? (this.state.minimapMarkerTrayOpen ? 'double-expanded' : 'expanded') : ''}`}>
                        {/* <button className="one" onClick={() => this.setState({minimapZoomedTile: null, minimapMarkerTrayOpen: false})}>Zoom Out</button> */}
                        {/* <button className="one" onClick={() => this.beginMarkingMap()}>Mark Map</button> */}
                        <CButton onClick={() => this.setState({minimapZoomedTile: null, minimapMarkerTrayOpen: false})}>Zoom Out</CButton>
                        <CButton onClick={() => this.beginMarkingMap()}>Mark Map</CButton>


                        {/* <button className="one">three</button> */}
                        <div className={`mark-map-tray ${this.state.minimapMarkerTrayOpen ? 'expanded' : ''}`}>
                            <CFormSelect 
                                aria-label="Marker Selector"
                                // ref={this.state.markerSelectVal}
                                options={
                                    ['Marker Type'].concat(MARKER_TYPES.map((e, i)=>{
                                    return e
                                    }))
                                }
                                value={this.state.markerType}
                                
                                onChange={e => this.onMarkerTypeDropdownChange(e.target.value)}
                                // onChange={this.props.dungeonSelectOnChange}
                            />
                            <CFormInput
                                type="text"
                                // ref={this.state.mapMarkerInput}
                                value={this.state.markerName}
                                onChange={e => this.onMarkerNameInputChange(e.target.value)}
                                placeholder="marker name"
                                aria-describedby="marker name"
                            ></CFormInput>
                            <CButton onClick={() => this.placeMapMarkerStart()} className='place-marker-button' component="a" color="light" href="#" role="button">Place Marker</CButton>
                            <CButton onClick={() => this.submitMarkers()} component="a" color="light" href="#" role="button">Submit</CButton>

                        </div>
                        <CButton className='clear-all-markers' onClick={() => this.clearAllMarkers()} color="danger">Clear All Markers</CButton>
                    </div>
                </div>
                <div className="crew-container">
                    <div className="title">Crew</div>
                    {/* Prototype tasks toggle (user-requested visible hook) */}
                    <div className="prototype-tasks-toggle" onClick={this.togglePrototypeTasks} style={{cursor:'pointer', fontSize:12, color:'#ccc', marginBottom:6}}>Prototype Tasks</div>
                    {this.state.prototypeTasksOpen && <div className="prototype-tasks-panel" style={{background:'#1b1b1b', padding:6, borderRadius:4, marginBottom:8}}>
                        <div style={{fontSize:12, color:'#fff'}}>improve prototype package</div>
                    </div>}

                    {/* Death tracker: shows skull icons for recent group deaths (meta.deathTracker) */}
                    {(() => {
                        try {
                            const meta = getMeta() || {};
                            const deaths = meta.deathTracker || 0;
                            const tooltip = 'Your crew has met death and been spared. If this happens thrice, your journey is over';
                            // Always render the container (so the portal ref exists and the UI is inspectable)
                            // but only render skulls when deaths > 0
                                return (
                                <div className="death-tracker" aria-label={deaths > 0 ? tooltip : 'No recent group deaths'}>
                                    {deaths > 0 && new Array(deaths).fill(0).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className="death-skull-wrapper"
                                            tabIndex={0}
                                            title={tooltip}
                                            aria-label={tooltip}
                                            role="button"
                                            onClick={() => this.openCardDuel(idx)}
                                            style={{cursor: 'pointer'}}
                                        >
                                            <div className="death-skull" style={{backgroundImage: `url(${images['whiteskull']})`}}></div>
                                        </div>
                                    ))}
                                </div>
                            );
                        } catch (e) { return null; }
                    })()}
                    {this.state.toastMessage && <div className="dungeon-toast" style={{marginTop:8, padding:8, background:'#2b1b1b', color:'#f0d', borderRadius:4}}>{this.state.toastMessage}</div>}

                    {/* Card duel modal (opens when clicking a death skull) */}
                    <CModal visible={this.state.showCardDuelModal} onClose={this.closeCardDuel} backdrop={true} size="lg">
                        <CModalHeader>
                            <CModalTitle>Fire of Circulation — Duel</CModalTitle>
                        </CModalHeader>
                        <CModalBody>
                            <CardDuel onFinish={this.handleCardDuelFinish} saveUserData={this.props.saveUserData} />
                        </CModalBody>
                    </CModal>
                    <div className="crew-tile-container">
                        {   this.props.crewManager.crew &&
                            this.props.crewManager.crew.map((member, i) => {
                                const isSelectedTile = this.state.selectedCrewMember && this.state.selectedCrewMember.id === member.id;
                                return <div className="sub-container" key={i} style={{opacity: isSelectedTile ? 1 : 0.5}}>
                                            { this.state.crewHoverMatrix[i] && <div className="hover-message">{this.state.crewHoverMatrix[i]}</div>}
                                            <Tile 
                                            key={i}
                                            id={i}
                                            tileSize={this.state.tileSize}
                                            image={member.image ? member.image : null}
                                            imageOverride={member.portrait ? member.portrait : null}
                                            contains={member.type}
                                            data={member}
                                            color={member.color}
                                            backgroundColor={hexToRgba(member.color, 0.5)}
                                            editMode={false}
                                            type={'crew-tile'}
                                            handleClick={this.handleMemberClick}
                                            handleHover={this.handleCrewTileHover}
                                            className={`crew-tile `}
                                            >
                                            </Tile>
                                        </div>
                            })
                        }
                    </div>
                    {/* Crew Actions: a right-panel mirror of the left Actions menu */}
                    <div className="menu crew-actions" onClick={this.toggleCrewActionsTray}>
                        <CIcon icon={cilMenu} className={`menu-icon ${this.state.crewActionsTrayExpanded ? 'expanded' : ''}`} size="sm"/>
                        Crew Actions
                    </div>
                    <div className={`actions-tray crew-actions-tray ${this.state.crewActionsTrayExpanded ? 'expanded' : ''}`}>
                        {(() => {
                            const meta = getMeta() || {};
                            const camping = meta.camping;
                            if (camping) {
                                const start = meta.campingStart || '';
                                const end = meta.campingEnd || '';
                                const now = new Date();
                                const startDate = start ? new Date(start) : null;
                                const endDate = end ? new Date(end) : null;
                                // compute total and elapsed seconds so we can use a negative animationDelay
                                const totalSeconds = (startDate && endDate) ? Math.max(0, (endDate - startDate) / 1000) : 0;
                                const elapsedSeconds = (startDate) ? Math.max(0, (now - startDate) / 1000) : 0;
                                // use a stable id so the placeholder element is not recreated each render
                                const placeholderId = 'camp-progress-placeholder';
                                return (
                                    <div className="crew-action-item action-row" style={{position:'relative'}}>
                                        <div className="camp-label" style={{position: 'relative'}}>
                                            Recuperating in Camp...
                                            <div
                                                id={placeholderId}
                                                ref={el => this.placeholderRef(el, placeholderId, start, end)}
                                                className={`progress-overlay progress-overlay-placeholder debug-placeholder camp-anim`}
                                                data-start={start}
                                                data-end={end}
                                                style={{ animationDuration: `${totalSeconds}s`, animationDelay: `-${elapsedSeconds}s` }}
                                            ></div>
                                            <div
                                                onClick={() => this.endCamp()}
                                                role="button"
                                                aria-label="Close camp"
                                                style={{position: 'absolute', right: 6, top: 2, cursor: 'pointer', fontWeight: 700, zIndex: 3}}
                                            >
                                                ×
                                            </div>
                                            </div>
                                        
                                    </div>
                                );
                            }
                            return (
                                <div className="crew-action-item action-row" style={{display:'flex', gap:8}}>
                                    <div onClick={() => this.setUpCamp()} style={{cursor:'pointer', paddingLeft: '15px'}}>Set Up Camp</div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
                <div className="expand-collapse-button icon-container" onClick={this.toggleRightSidePanel}>
                    <CIcon icon={cilCaretLeft} className={`expand-icon ${this.state.rightPanelExpanded ? 'expanded' : ''}`} size="sm"/>
                </div>
            </div>
            {this.state.currentBoard && <div className="info-panel">{this.props.boardManager.currentBoard.name}</div>}
            {this.state.inMonsterBattle === false && <div style={{
                    opacity: this.state.tiles.length > 0 ? 1 : 0,
                    transition: 'opacity 1s'
                    }} className={`center-board-wrapper ${this.state.minimapPlaceMapMarkerStarted ? 'show-map-marker-cursor' : ''}`}>
                <div className="message-container">
                    {this.state.messageToDisplay}
                </div>
                <div className="respawn-message-container">
                    <div className="hourglass-icon" style={{
                        backgroundImage: `url(${images['hourglass1']})`
                    }}></div>{this.state.timeToRespawn}
                </div>
                <div  className="overlay-board" style={{
                    width: this.state.boardSize+'px', height: this.state.boardSize+ 'px',
                    backgroundColor: 'transparent',
                    pointerEvents: this.state.minimapPlaceMapMarkerStarted ? 'auto' : 'none'
                    }}>
                    {this.state.overlayTiles && this.state.overlayTiles.map((tile, i) => {
                        return <Tile 
                        key={i}
                        id={i}
                        cursor={this.state.minimapPlaceMapMarkerStarted ? 'crosshair' : 'default'}
                        tileSize={this.state.tileSize}
                        image={tile.image ? tile.image : null}
                        imageOverride={tile.image && tile.image.includes('/') ? tile.image : null}
                        contains={tile.contains}
                        terrain={tile.terrain}
                        color={tile.color ? tile.color : 'lightgrey'}
                        borders={tile.borders}
                        coordinates={tile.coordinates}
                        index={tile.id}
                        editMode={false}
                        handleHover={this.handleOverlayHover}
                        type={'overlay-tile'}
                        passThrough={!this.state.minimapPlaceMapMarkerStarted}
                        handleClick={(e)=>this.handleOverlayClick}
                        // For overlay tiles we want the background color to reflect overlay state (e.g. edge indicator)
                        backgroundColor={tile.color ? tile.color : (this.state.overlayHoveredTileId === i && this.state.minimapPlaceMapMarkerStarted ? 'rgba(100, 100, 38, 0.272)' : 'transparent')}
                        >
                        </Tile>
                    })}
                </div>
                <div  className="board" style={{
                    width: this.state.boardSize+'px', height: this.state.boardSize+ 'px',
                    backgroundColor: 'white'
                    }}>
                    {this.state.tiles && this.state.tiles.map((tile, i) => {
                        return <Tile 
                        key={i}
                        cursor={this.state.minimapPlaceMapMarkerStarted ? 'crosshair' : 'default'}
                        tileSize={this.state.tileSize}
                        image={tile.image ? tile.image : (tile.icon ? tile.icon : null)}
                        imageOverride={tile.image && tile.image.includes('/') ? tile.image : null}
                        contains={tile.contains}
                        terrain={tile.terrain}
                        color={tile.color ? tile.color : 'lightgrey'}
                        borders={tile.borders}
                        coordinates={tile.coordinates}
                        index={tile.id}
                        showCoordinates={this.props.showCoordinates}
                        editMode={false}
                        handleHover={this.handleHover}
                        type={tile.type}
                        handleClick={this.handleClick}
                        >
                        </Tile>
                    })}
                </div>
            </div>}
            
            
            {/* /// ANIMATION GRID ///  */}
            {/* { this.state.keysLocked && 
                <AnimationGrid
                        animationManager={this.props.animationManager}
                        tileProps={{
                            TILE_SIZE,
                            MAX_DEPTH,
                            SHOW_TILE_BORDERS,
                            MAX_ROWS
                        }}
                ></AnimationGrid>
            } */}


            { this.state.keysLocked && this.state.inMonsterBattle &&
            <MonsterBattle
                ref={this.monsterBattleComponentRef}
                combatManager={this.props.combatManager}
                overlayManager={this.props.overlayManager}
                inventoryManager={this.props.inventoryManager}
                animationManager={this.props.animationManager}
                crewManager={this.props.crewManager}
                crew={this.props.crewManager.crew}
                monster={this.state.monster}
                minions={this.state.minions}
                battleOver={this.battleOver}
                paused={this.state.paused}
                setNarrativeSequence={this.props.setNarrativeSequence}
                useConsumableFromInventory={this.useConsumableFromInventory}
                onFighterUpdate={this.handleFighterUpdateFromBattle}
                onDeathTrackerChanged={this.handleDeathTrackerChanged}
            ></MonsterBattle>}

            <CModal className='inventory-modal' alignment='center' visible={this.state.showInventoryPopup} onClose={() => this.setState({ showInventoryPopup: false })}>
                <div className='inventory-content'>
                    <div className='inventory-header'>
                        <div className='inventory-title'>Inventory</div>
                        {this.props.inventoryManager && this.props.inventoryManager.gold > 0 && (
                            <div className='inventory-gold'>
                                <div className='gold-readout'>Gold: {this.props.inventoryManager.gold}</div>
                            </div>
                        )}
                    </div>
                    <div className='crew-panels'>
                        {(this.props.crewManager && this.props.crewManager.crew || []).map((member, idx) => {
                            const portraitUrl = (images && images[member.portrait]) || member.portrait;
                            const isSelected = this.state.selectedCrewMember && this.state.selectedCrewMember.id === member.id;
                            return (
                                <div className='crew-panel' key={member.id || idx}>
                                    <div
                                        className='crew-portrait'
                                        style={{
                                            backgroundImage: `url(${portraitUrl})`,
                                            border: isSelected ? '3px solid lightgreen' : '3px solid transparent',
                                            boxSizing: 'border-box'
                                        }}
                                    ></div>
                                    <div className='crew-body' style={{
                                        backgroundImage: `url(${images.body_male})`,
                                        filter: 'invert(1)',
                                        backgroundSize: '130%',
                                        opacity: isSelected ? 1 : 0.5,
                                        pointerEvents: isSelected ? 'auto' : 'none',
                                        marginTop: '-16px'
                                    }}>
                                        {/* equip slots: chest, right-hand, left-hand, head, and ancillary */}
                                        {(() => {
                                            const findEquipped = (m, slot) => {
                                                const slotsToCheck = (slot === 'pet' || slot === 'bottom-left') ? ['pet', 'bottom-left'] : [slot];
                                                return (m.inventory || []).find(i => slotsToCheck.includes(i.equippedSlot));
                                            };
                                            const chest = findEquipped(member, 'chest');
                                            const right = findEquipped(member, 'right');
                                            const left = findEquipped(member, 'left');
                                            const head = findEquipped(member, 'head');
                                            const bottomLeft = findEquipped(member, 'pet');
                                            const ancillaryLeft = findEquipped(member, 'ancillary-left');
                                            const ancillaryRight = findEquipped(member, 'ancillary-right');
                                            return (
                                                <>
                                                    <div className='equip-slot slot-chest' style={{border: isSelected && chest ? '2px solid #782d7b' : undefined}}>{chest && (
                                                        <Tile
                                                            id={chest.id}
                                                            data={chest}
                                                            tileSize={this.state.tileSize}
                                                            image={chest.icon}
                                                            contains={chest.name ? chest.name.replace(' ', '_') : null}
                                                            color={chest.color}
                                                            editMode={false}
                                                            type={'inventory-tile'}
                                                            handleClick={() => isSelected ? this.handleEquipmentItemClick(chest) : null}
                                                            handleHover={this.handleInventoryTileHover}
                                                        />
                                                    )}</div>
                                                    <div className='equip-slot slot-right' style={{border: isSelected && right ? '2px solid #782d7b' : undefined}}>{right && (
                                                        <Tile
                                                            id={right.id}
                                                            data={right}
                                                            tileSize={this.state.tileSize}
                                                            image={right.icon}
                                                            contains={right.name ? right.name.replace(' ', '_') : null}
                                                            color={right.color}
                                                            editMode={false}
                                                            type={'inventory-tile'}
                                                            handleClick={() => isSelected ? this.handleEquipmentItemClick(right) : null}
                                                            handleHover={this.handleInventoryTileHover}
                                                        />
                                                    )}</div>
                                                    <div className='equip-slot slot-left' style={{border: isSelected && left ? '2px solid #782d7b' : undefined}}>{left && (
                                                        <Tile
                                                            id={left.id}
                                                            data={left}
                                                            tileSize={this.state.tileSize}
                                                            image={left.icon}
                                                            contains={left.name ? left.name.replace(' ', '_') : null}
                                                            color={left.color}
                                                            editMode={false}
                                                            type={'inventory-tile'}
                                                            handleClick={() => isSelected ? this.handleEquipmentItemClick(left) : null}
                                                            handleHover={this.handleInventoryTileHover}
                                                        />
                                                    )}</div>
                                                    <div className='equip-slot slot-head' style={{border: isSelected && head ? '2px solid #782d7b' : undefined}}>{head && (
                                                        <Tile
                                                            id={head.id}
                                                            data={head}
                                                            tileSize={this.state.tileSize}
                                                            image={head.icon}
                                                            contains={head.name ? head.name.replace(' ', '_') : null}
                                                            color={head.color}
                                                            editMode={false}
                                                            type={'inventory-tile'}
                                                            handleClick={() => isSelected ? this.handleEquipmentItemClick(head) : null}
                                                            handleHover={this.handleInventoryTileHover}
                                                        />
                                                    )}</div>
                                                    <div className='equip-slot slot-ancillary-left' style={{border: isSelected && ancillaryLeft ? '2px solid #782d7b' : undefined}}>{ancillaryLeft && (
                                                        <Tile
                                                            id={ancillaryLeft.id}
                                                            data={ancillaryLeft}
                                                            tileSize={this.state.tileSize}
                                                            image={ancillaryLeft.icon}
                                                            contains={ancillaryLeft.name ? ancillaryLeft.name.replace(' ', '_') : null}
                                                            color={ancillaryLeft.color}
                                                            editMode={false}
                                                            type={'inventory-tile'}
                                                            handleClick={() => isSelected ? this.handleEquipmentItemClick(ancillaryLeft) : null}
                                                            handleHover={this.handleInventoryTileHover}
                                                        />
                                                    )}</div>
                                                    <div className='equip-slot slot-ancillary-right' style={{border: isSelected && ancillaryRight ? '2px solid #782d7b' : undefined}}>{ancillaryRight && (
                                                        <Tile
                                                            id={ancillaryRight.id}
                                                            data={ancillaryRight}
                                                            tileSize={this.state.tileSize}
                                                            image={ancillaryRight.icon}
                                                            contains={ancillaryRight.name ? ancillaryRight.name.replace(' ', '_') : null}
                                                            color={ancillaryRight.color}
                                                            editMode={false}
                                                            type={'inventory-tile'}
                                                            handleClick={() => isSelected ? this.handleEquipmentItemClick(ancillaryRight) : null}
                                                            handleHover={this.handleInventoryTileHover}
                                                        />
                                                    )}</div>
                                    <div className='equip-slot slot-pet' style={{border: isSelected && bottomLeft ? '2px solid #782d7b' : undefined}}>{bottomLeft && (
                                                        <>
                                                        <Tile
                                                            id={bottomLeft.id}
                                                            data={bottomLeft}
                                                            tileSize={this.state.tileSize}
                                                            image={bottomLeft.icon}
                                                            contains={bottomLeft.name ? bottomLeft.name.replace(' ', '_') : null}
                                                            color={bottomLeft.color}
                                                            editMode={false}
                                                            type={'inventory-tile'}
                                                            handleClick={() => isSelected ? this.handleEquipmentItemClick(bottomLeft) : null}
                                                            handleHover={this.handleInventoryTileHover}
                                                        />
                                                        <div className="pet-overlay" aria-hidden="true">🐾</div>
                                                        </>
                                                    )}</div>
                                                </>
                                            )
                                        })()}
                                    </div>
                                    <div className="stats-display" style={{width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '8px', boxSizing: 'border-box', marginTop: '-38px', opacity: isSelected ? 1 : 0.5}}>
                                        {[
                                            'attack',
                                            'defense',
                                            'speed',
                                            'luck',
                                            'willpower',
                                            'hp',
                                            'energy max',
                                            'energy regeneration'
                                        ].map((key) => {
                                            let value = 0;
                                            try {
                                                if (key === 'attack') value = (member && member.stats && typeof member.stats.atk === 'number') ? member.stats.atk : 0;
                                                else if (key === 'defense') value = (member && member.stats && typeof member.stats.baseDef === 'number') ? member.stats.baseDef : 0;
                                                else if (key === 'hp') value = (member && member.stats && typeof member.stats.hp === 'number') ? member.stats.hp : 0;
                                            } catch (e) {}

                                            // compute equipped weapon percent bonus (sum of equipped weapons)
                                            let weaponPercent = 0;
                                            // compute equipped armor percent bonus (sum of equipped armor pieces)
                                            let armorPercent = 0;
                                            try {
                                                if (member && Array.isArray(member.inventory)) {
                                                    if (key === 'attack') {
                                                        const equippedWeapons = member.inventory.filter(i => i && i.type === 'weapon' && (i.equippedSlot === 'right' || i.equippedSlot === 'left' || i.equippedBy === member.id));
                                                        if (equippedWeapons.length) {
                                                            weaponPercent = equippedWeapons.reduce((acc, w) => acc + (typeof w.damage === 'number' ? w.damage : 0), 0);
                                                        }
                                                    }
                                                    if (key === 'defense') {
                                                        const equippedArmor = member.inventory.filter(i => i && i.type === 'armor' && (i.equippedSlot || i.equippedBy === member.id));
                                                        if (equippedArmor.length) {
                                                            armorPercent = equippedArmor.reduce((acc, a) => acc + (typeof a.armor === 'number' ? a.armor : 0), 0);
                                                        }
                                                    }
                                                }
                                            } catch (e) { weaponPercent = 0; armorPercent = 0 }

                                            return (
                                                <div key={key} className="stat-line" style={{display: 'flex', justifyContent: 'space-between', width: '100%', padding: '2px 0'}}>
                                                    <span className="stat-name">{key === 'hp' ? 'hp max' : key}</span>
                                                    {key === 'attack' ? (
                                                        <span className="stat-value" style={{display: 'flex', alignItems: 'center', gap: 6}}>
                                                            {weaponPercent > 0 && (
                                                                <span style={{color: 'lightgreen', fontWeight: 600, marginRight: 6}}>{`+${weaponPercent}%`}</span>
                                                            )}
                                                            <span>{value}</span>
                                                        </span>
                                                    ) : key === 'defense' ? (
                                                        <span className="stat-value" style={{display: 'flex', alignItems: 'center', gap: 6}}>
                                                            {armorPercent > 0 && (
                                                                <span style={{color: 'lightgreen', fontWeight: 600, marginRight: 6}}>{`+${armorPercent}%`}</span>
                                                            )}
                                                            <span>{value}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="stat-value">{value}</span>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="inventory-descriptor-panel">
                        TESTING 123
                    </div>
                    <div className='inventory-strip'>
                        {(() => {
                            const inv = (this.props.inventoryManager && this.props.inventoryManager.inventory) || [];
                            const grouped = {};
                            inv.forEach((item, idx) => {
                                const key = item.name || item.type || `item_${idx}`;
                                if (!grouped[key]) grouped[key] = { items: [], firstIndex: idx };
                                grouped[key].items.push(item);
                            });

                            return Object.keys(grouped).map((key, gIdx) => {
                                const group = grouped[key];
                                const count = group.items.length;
                                const item = group.items[0];
                                const firstIndex = group.firstIndex;
                                return (
                                    <div className={`strip-item sub-container ${item.animation === 'consumed' ? 'consumed' : ''}`} key={gIdx} style={{position: 'relative'}}>
                                        { this.state.inventoryHoverMatrix[firstIndex] && 
                                            <div className="hover-message-container">
                                                <div className="hover-message">{this.state.inventoryHoverMatrix[firstIndex].replaceAll('_', ' ')}</div>
                                            </div>
                                        }
                                        <Tile
                                            key={gIdx}
                                            id={firstIndex}
                                            data={item}
                                            tileSize={this.state.tileSize}
                                            image={item.icon ? item.icon : null}
                                            contains={item.name ? item.name.replace(' ', '_') : null}
                                            color={item.color}
                                            editMode={false}
                                            type={'inventory-tile'}
                                            handleClick={() => this.handleItemClick(item, firstIndex)}
                                            handleHover={this.handleInventoryTileHover}
                                            className={`inventory-tile ${this.state.activeInventoryItem?.id === firstIndex ? 'active' : ''}`}
                                            isActiveInventory={this.state.activeInventoryItem?.id === firstIndex}
                                        />
                                        {count > 1 && (
                                            <div className='stack-count-badge'>
                                                {count}
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        })()}
                    </div>
                </div>
            </CModal>
        </div>
        )
    }
}

export default DungeonPage;