import React from 'react';
import skillsMatrix from '../utils/skills-matrix';
import * as images from '../utils/images';

// ── Interactables / dungeon objects catalogue ────────────────────────────────

const INTERACTABLES = [
    {
        id: 'chest_silver',
        name: 'Silver Chest',
        icon: images.silver_chest,
        category: 'interactable',
        desc: 'A medium-tier chest. Contains useful items and equipment. Requires no key.',
        tags: ['loot', 'chest'],
    },
    {
        id: 'chest_gold',
        name: 'Gold Chest',
        icon: images.gold_chest,
        category: 'interactable',
        desc: 'A high-tier chest with rarer items and higher-quality equipment. Requires no key.',
        tags: ['loot', 'chest'],
    },
    {
        id: 'chest_ornate',
        name: 'Ornate Chest',
        icon: images.ornate_chest,
        category: 'interactable',
        desc: 'The rarest chest type. Contains powerful magical items and endgame-tier equipment.',
        tags: ['loot', 'chest'],
    },
    {
        id: 'merchant',
        name: 'Merchant',
        icon: images.merchant,
        category: 'interactable',
        desc: 'A wandering trader. Buy, sell, and swap equipment and consumables. Stock refreshes each visit.',
        tags: ['vendor', 'shop'],
    },
    {
        id: 'alchemist',
        name: 'Alchemist',
        icon: images.alchemist,
        category: 'interactable',
        desc: 'Brews and sells potions and magical concoctions. Also buys raw components.',
        tags: ['vendor', 'potions'],
    },
    {
        id: 'minor_gate',
        name: 'Minor Gate',
        icon: images.minor_gate,
        category: 'interactable',
        desc: 'A sealed passage requiring a Minor Key to open. Guards lightly elevated loot.',
        tags: ['gate', 'key'],
    },
    {
        id: 'major_gate',
        name: 'Major Gate',
        icon: images.major_gate,
        category: 'interactable',
        desc: 'A sealed passage requiring a Major Key. Contains mid-tier rewards behind.',
        tags: ['gate', 'key'],
    },
    {
        id: 'treasury_gate',
        name: 'Treasury Gate',
        icon: images.treasury_gate,
        category: 'interactable',
        desc: 'A fortified vault gate. Opened only by a Treasury Key — expect rare loot inside.',
        tags: ['gate', 'key'],
    },
    {
        id: 'necrotic_gate',
        name: 'Necrotic Gate',
        icon: images.necrotic_gate,
        category: 'interactable',
        desc: 'An ancient gate suffused with dark energy. Necrotic Key required. Powerful undead often lurk beyond.',
        tags: ['gate', 'key', 'danger'],
    },
    {
        id: 'dimensional_gate',
        name: 'Dimensional Gate',
        icon: images.dimensional_gate,
        category: 'interactable',
        desc: 'A rift between planes. Dimensional Key opens the way to rare arcane encounters and items.',
        tags: ['gate', 'key', 'arcane'],
    },
    {
        id: 'stairs_down',
        name: 'Stairs Down',
        icon: images.stairs_down,
        category: 'interactable',
        desc: 'Descend to a deeper dungeon level. Monsters and rewards scale with depth.',
        tags: ['navigation', 'stairs'],
    },
    {
        id: 'narrative',
        name: 'Narrative Tile',
        icon: images.narrative,
        category: 'interactable',
        desc: 'Glowing story markers. Interacting reveals lore, choices, or triggered events.',
        tags: ['lore', 'event'],
    },
    {
        id: 'oracle',
        name: 'Oracle',
        icon: images.oracle,
        category: 'interactable',
        desc: 'A mystical presence that reveals hidden information about the dungeon or crew.',
        tags: ['mystery', 'lore'],
    },
    {
        id: 'minor_key',
        name: 'Minor Key',
        icon: images.minor_key,
        category: 'item',
        desc: 'Opens Minor Gates. Found in chests or dropped by enemies.',
        tags: ['key', 'item'],
    },
    {
        id: 'major_key',
        name: 'Major Key',
        icon: images.major_key,
        category: 'item',
        desc: 'Opens Major Gates. Rarer drop; found in higher-tier chests.',
        tags: ['key', 'item'],
    },
    {
        id: 'camp',
        name: 'Camp',
        icon: images.camp,
        category: 'camp',
        desc: 'Set up camp to rest the crew. Restores HP and resolve over time at the cost of food.',
        tags: ['rest', 'healing', 'food'],
    },
    {
        id: 'food',
        name: 'Food',
        icon: images.food,
        category: 'item',
        desc: 'Consumed during camping and food preparation. Low food limits rest options.',
        tags: ['item', 'resource'],
    },
    {
        id: 'gold',
        name: 'Gold',
        icon: images.gold,
        category: 'item',
        desc: 'Currency used to buy items from vendors. Dropped by monsters and found in chests.',
        tags: ['currency', 'item'],
    },
];

// ── Monster descriptions ──────────────────────────────────────────────────────
// Supplements data from MonsterManager with lore/tactical notes.

const MONSTER_LORE = {
    goblin:           { lore: 'Fast and fragile. Notorious for surprise attacks. Weak to crushing and electricity.', tactics: 'Dispatch quickly — their high dex makes them hard to hit. AoE attacks shine here.' },
    skeleton:         { lore: 'Undead soldier reanimated by dark magic. Can reassemble after being defeated.', tactics: 'Apply fire damage to prevent Reassembly. Focus fire to ensure destruction.' },
    troll:            { lore: 'A hulking regenerating brute. Nearly impossible to keep down without sustained damage.', tactics: 'Stack damage-over-time effects. Prevent healing with bleed or acid.' },
    ogre:             { lore: 'A brutish giant with earth-shaking attacks. Slow but devastating in close quarters.', tactics: 'Keep ranged units mobile. Tank with Soldier or Barbarian.' },
    vampire:          { lore: 'A cunning undead predator. Drains life and transforms into bats to reposition.', tactics: 'Interrupt Bat Fly to prevent retreats. Heal mitigation helps against Soul Suck.' },
    mummy:            { lore: 'Ancient cursed remains wrapped in death-magic. Induces fear and drains energy.', tactics: 'High willpower units resist Induce Fear. Keep back-row safe from Energy Drain.' },
    wraith:           { lore: 'An incorporeal spirit that phases through defenses. Ignores conventional armor.', tactics: 'Use magical attacks. Physical damage is heavily reduced against wraiths.' },
    sphinx:           { lore: 'A guardian of arcane knowledge with powerful riddle-curses and lightning breath.', tactics: 'Interrupt spells with stuns. Prioritize killing before it unleashes Storm.' },
    wyvern:           { lore: 'A winged serpent that dives and retreats. Poison tail strikes at range.', tactics: 'Ranger and Sage shine here. Force it to stay grounded with ensnare.' },
    djinn:            { lore: 'A betraying elemental of immense power. Binds targets and fires death missiles.', tactics: 'Use fire resistance. Avoid bunching up — Death Missile hits multiple targets.' },
    dragon:           { lore: 'The apex predator of the dungeon. Breathes fire, claws, and bites with terrible force.', tactics: 'Spread your crew. Use ice and water damage. Have the Sage on constant heal duty.' },
    gorgon:           { lore: 'A serpentine horror with a petrifying gaze and stone-shattering tail sweep.', tactics: 'Do not rely on tanking — dodge-based classes (Monk, Ranger) fare best.' },
    imp:              { lore: 'Diminutive chaos demons. Individually weak but dangerous in swarms.', tactics: 'Eagle Eye (Ranger) and AoE spells (Wizard) clear swarms efficiently.' },
    witch:            { lore: 'A shadowy hex-caster who curses, dispels, and whispers demonic commands.', tactics: 'Purge curses with Sage. High willpower units resist hex effects.' },
    beholder:         { lore: 'A floating eyeball horror with multiple magical ray attacks, each with a different effect.', tactics: 'Divide attention — keep crew spread to avoid being caught by multiple rays.' },
    ghoul:            { lore: 'A ravenous undead predator. Tears flesh and can paralyze with its bite.', tactics: 'Poison and acid are effective. Paralysis breaks your action economy — purge fast.' },
};

// ── Classes info ─────────────────────────────────────────────────────────────
const CLASS_LORE = [
    { id: 'soldier',   emoji: '🛡', name: 'Soldier',   role: 'Tank / Leader',       color: '#4a86c8', desc: 'A stalwart front-line warrior. Specializes in protection, morale-boosting battlecries, and sustained melee combat. Their Shield Wall and Defensive Stance make them essential for absorbing heavy hits. As a natural leader, their presence boosts the crew\'s resolve.' },
    { id: 'barbarian', emoji: '🪓', name: 'Barbarian', role: 'Melee Berserker',       color: '#c94040', desc: 'A ferocious melee powerhouse. Enters a Berserker state for tremendous damage at the cost of defense. Cleave hits multiple targets; Leap Attack closes distance in an instant. High HP pool makes them surprisingly durable.' },
    { id: 'monk',      emoji: '🥋', name: 'Monk',      role: 'Agile Striker',        color: '#d48a30', desc: 'Channels inner force through lightning-fast strikes. Ethereal Speed enables repositioning; Astral Projection creates a decoy. Force Punch launches enemies back; Flurry chains rapid hits. Excels at disruption and mobility.' },
    { id: 'ranger',    emoji: '🏹', name: 'Ranger',    role: 'Ranged / Debuffer',    color: '#5aab5a', desc: 'A precise archer who never needs to get close. Notch selects arrow types; Loose fires them with deadly accuracy. Mark amplifies all damage on a target; Ensnare immobilizes. Eagle Eye passively shoots summoned enemies.' },
    { id: 'wizard',    emoji: '🔮', name: 'Wizard',    role: 'Spellcaster / AoE',   color: '#9b64c9', desc: 'A destructive master of elemental magic. Fireball, Ice Blast, and Lightning Strike cover the fire/ice/lightning damage triangle. Disintegrate deals massive damage; Sleep disables; Annihilation is a devastating room-clearing ultimate.' },
    { id: 'sage',      emoji: '📖', name: 'Sage',      role: 'Healer / Support',     color: '#48b0b0', desc: 'The crew\'s lifeline. Heal restores HP; Circle of Protection raises defense; Perceive reveals enemy weaknesses. The Sage\'s Owl\'s Insight passive makes them invaluable for strategic knowledge and keeping the crew alive under pressure.' },
    { id: 'summoner',  emoji: '💀', name: 'Summoner',  role: 'Minion Controller',    color: '#8a5caa', desc: 'Overwhelms the battlefield with an army of summoned undead and demons. Rifts destabilize enemy formations; Skeleton Knights hold the line while the Summoner directs from safety. Duplicate and Triplicate create ally copies mid-fight.' },
    { id: 'engineer',  emoji: '⚙️', name: 'Engineer',  role: 'Utility / Control',    color: '#7a9ab0', desc: 'A battlefield machinist who controls spacing and tactical pressure. Force Back pushes enemies into unfavorable positions. Combines weapon mastery with mechanical gadgetry for unique hybrid play.' },
];

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
    { id: 'skills',         label: 'Skills',         emoji: '⚡' },
    { id: 'monsters',       label: 'Monsters',       emoji: '👹' },
    { id: 'classes',        label: 'Classes',        emoji: '🧑‍🤝‍🧑' },
    { id: 'interactables',  label: 'World',          emoji: '🗺️' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveImg(val) {
    if (!val) return null;
    if (typeof val === 'string') return val;
    return val.default || null;
}

function classColor(cls) {
    const map = { ranger:'#5aab5a', sage:'#48b0b0', soldier:'#4a86c8', wizard:'#9b64c9', barbarian:'#c94040', monk:'#d48a30', summoner:'#8a5caa', engineer:'#7a9ab0' };
    return map[(cls||'').toLowerCase()] || '#888';
}

function typeColor(t) {
    const map = { damage:'#c94040', debuff:'#9b64c9', buff:'#4a86c8', heal:'#48b0b0', utility:'#d48a30', passive:'#666', summon:'#8a5caa' };
    return map[(t||'').toLowerCase()] || '#666';
}

// ── CodexModal component ──────────────────────────────────────────────────────

export default function CodexModal({ visible, onClose, monsterManager }) {
    const [activeTab, setActiveTab] = React.useState('skills');
    const [search, setSearch] = React.useState('');
    const [selectedEntry, setSelectedEntry] = React.useState(null);
    const [skillClassFilter, setSkillClassFilter] = React.useState('all');

    // Reset selection when tab changes
    React.useEffect(() => {
        setSelectedEntry(null);
        setSearch('');
    }, [activeTab]);

    if (!visible) return null;

    const q = search.trim().toLowerCase();

    // ── Skills data
    const allSkills = Object.values(skillsMatrix).filter(s =>
        s && s.name && s.id &&
        !s.id.includes('_global_') &&
        s.treePath !== 'global'
    );
    const filteredSkills = allSkills.filter(s => {
        const matchQ = !q || s.name.toLowerCase().includes(q) || (s.desc || '').toLowerCase().includes(q) || (s.class || '').toLowerCase().includes(q);
        const matchClass = skillClassFilter === 'all' || (s.class || '').toLowerCase() === skillClassFilter;
        return matchQ && matchClass;
    });

    // ── Monsters data
    const monsters = monsterManager ? Object.values(monsterManager.monsters || {}) : [];
    const filteredMonsters = monsters.filter(m => !q || (m.type||'').includes(q) || (MONSTER_LORE[m.type] || {}).lore?.toLowerCase().includes(q));

    // ── Classes
    const filteredClasses = CLASS_LORE.filter(c => !q || c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));

    // ── Interactables
    const filteredInteractables = INTERACTABLES.filter(i => !q || i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || (i.tags||[]).some(t => t.includes(q)));

    // Class list for filter pills
    const skillClasses = ['all', 'ranger', 'sage', 'soldier', 'wizard', 'barbarian', 'monk', 'summoner', 'engineer'];

    return (
        <div className="codex-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="codex-modal">
                {/* ── Header ─────────────────────────────────────── */}
                <div className="codex-header">
                    <div className="codex-header-left">
                        <img
                            src={resolveImg(images.codex)}
                            alt="Codex"
                            className="codex-header-icon"
                        />
                        <div>
                            <div className="codex-header-title">Codex</div>
                            <div className="codex-header-subtitle">Encyclopedia of the Dungeon</div>
                        </div>
                    </div>
                    <button className="codex-close-btn" onClick={onClose} aria-label="Close Codex">✕</button>
                </div>

                {/* ── Tabs ───────────────────────────────────────── */}
                <div className="codex-tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`codex-tab${activeTab === tab.id ? ' active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span role="img" aria-label={tab.label}>{tab.emoji}</span> {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Search + Filters ───────────────────────────── */}
                <div className="codex-search-bar">
                    <input
                        className="codex-search-input"
                        placeholder={`Search ${activeTab}…`}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        aria-label="Search codex"
                    />
                    {activeTab === 'skills' && (
                        <div className="codex-class-filters">
                            {skillClasses.map(cls => (
                                <button
                                    key={cls}
                                    className={`codex-class-pill${skillClassFilter === cls ? ' active' : ''}`}
                                    style={skillClassFilter === cls && cls !== 'all' ? { borderColor: classColor(cls), color: classColor(cls), background: `${classColor(cls)}18` } : {}}
                                    onClick={() => setSkillClassFilter(cls)}
                                >
                                    {cls === 'all' ? 'All Classes' : cls.charAt(0).toUpperCase() + cls.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Body: List + Detail ────────────────────────── */}
                <div className="codex-body">

                    {/* ── SKILLS tab ───────────────────────────────── */}
                    {activeTab === 'skills' && (
                        <>
                            <div className="codex-list">
                                {filteredSkills.length === 0 && <div className="codex-empty">No skills match your search.</div>}
                                {filteredSkills.map(skill => {
                                    const iconSrc = resolveImg(skill.icon);
                                    const selected = selectedEntry && selectedEntry.id === skill.id;
                                    return (
                                        <div
                                            key={skill.id}
                                            className={`codex-list-row${selected ? ' selected' : ''}`}
                                            onClick={() => setSelectedEntry(skill)}
                                        >
                                            {iconSrc && <img src={iconSrc} alt="" className="codex-row-icon" />}
                                            <div className="codex-row-content">
                                                <div className="codex-row-name">{skill.name}</div>
                                                <div className="codex-row-meta">
                                                    <span style={{ color: classColor(skill.class) }}>{(skill.class || '').toUpperCase()}</span>
                                                    <span style={{ color: typeColor(skill.type) }}> · {skill.type}</span>
                                                    {skill.tier && <span style={{ color: '#666' }}> · T{skill.tier}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="codex-detail">
                                {selectedEntry ? (
                                    <SkillDetail skill={selectedEntry} />
                                ) : (
                                    <CodexDetailPlaceholder tab="skills" />
                                )}
                            </div>
                        </>
                    )}

                    {/* ── MONSTERS tab ─────────────────────────────── */}
                    {activeTab === 'monsters' && (
                        <>
                            <div className="codex-list">
                                {filteredMonsters.length === 0 && <div className="codex-empty">No monsters match your search.</div>}
                                {filteredMonsters.map(monster => {
                                    const iconSrc = resolveImg(monster.portrait);
                                    const selected = selectedEntry && selectedEntry.key === monster.key;
                                    return (
                                        <div
                                            key={monster.key || monster.type}
                                            className={`codex-list-row${selected ? ' selected' : ''}`}
                                            onClick={() => setSelectedEntry(monster)}
                                        >
                                            {iconSrc && <img src={iconSrc} alt="" className="codex-row-icon codex-row-icon--round" />}
                                            <div className="codex-row-content">
                                                <div className="codex-row-name" style={{ textTransform: 'capitalize' }}>{(monster.type || '').replace(/_/g, ' ')}</div>
                                                <div className="codex-row-meta">
                                                    <span style={{ color: '#888' }}>Lvl {monster.level || '?'}</span>
                                                    {monster.subtype && <span style={{ color: '#666' }}> · {monster.subtype}</span>}
                                                    {monster.tier && <span style={{ color: '#555' }}> · Tier {monster.tier}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="codex-detail">
                                {selectedEntry && selectedEntry.stats ? (
                                    <MonsterDetail monster={selectedEntry} />
                                ) : (
                                    <CodexDetailPlaceholder tab="monsters" />
                                )}
                            </div>
                        </>
                    )}

                    {/* ── CLASSES tab ──────────────────────────────── */}
                    {activeTab === 'classes' && (
                        <>
                            <div className="codex-list">
                                {filteredClasses.map(cls => {
                                    const selected = selectedEntry && selectedEntry.id === cls.id;
                                    return (
                                        <div
                                            key={cls.id}
                                            className={`codex-list-row${selected ? ' selected' : ''}`}
                                            onClick={() => setSelectedEntry(cls)}
                                        >
                                            <div className="codex-class-emoji-badge" style={{ background: `${cls.color}22`, border: `1px solid ${cls.color}55` }}>
                                                <span role="img" aria-label={cls.name}>{cls.emoji}</span>
                                            </div>
                                            <div className="codex-row-content">
                                                <div className="codex-row-name" style={{ color: cls.color }}>{cls.name}</div>
                                                <div className="codex-row-meta" style={{ color: '#666' }}>{cls.role}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="codex-detail">
                                {selectedEntry && selectedEntry.role ? (
                                    <ClassDetail cls={selectedEntry} allSkills={allSkills} />
                                ) : (
                                    <CodexDetailPlaceholder tab="classes" />
                                )}
                            </div>
                        </>
                    )}

                    {/* ── INTERACTABLES tab ────────────────────────── */}
                    {activeTab === 'interactables' && (
                        <>
                            <div className="codex-list">
                                {filteredInteractables.length === 0 && <div className="codex-empty">No entries match your search.</div>}
                                {filteredInteractables.map(item => {
                                    const iconSrc = resolveImg(item.icon);
                                    const selected = selectedEntry && selectedEntry.id === item.id;
                                    return (
                                        <div
                                            key={item.id}
                                            className={`codex-list-row${selected ? ' selected' : ''}`}
                                            onClick={() => setSelectedEntry(item)}
                                        >
                                            {iconSrc && <img src={iconSrc} alt="" className="codex-row-icon" />}
                                            <div className="codex-row-content">
                                                <div className="codex-row-name">{item.name}</div>
                                                <div className="codex-row-meta" style={{ color: '#666' }}>{item.category}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="codex-detail">
                                {selectedEntry && selectedEntry.tags ? (
                                    <InteractableDetail item={selectedEntry} />
                                ) : (
                                    <CodexDetailPlaceholder tab="world" />
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Sub-detail components ─────────────────────────────────────────────────────

function SkillDetail({ skill }) {
    const iconSrc = resolveImg(skill.icon);
    return (
        <div className="codex-detail-inner">
            <div className="codex-detail-header">
                {iconSrc && <img src={iconSrc} alt="" className="codex-detail-icon" />}
                <div>
                    <div className="codex-detail-name">{skill.name}</div>
                    <div className="codex-detail-sub" style={{ color: classColor(skill.class) }}>
                        {(skill.class || '').toUpperCase()} — <span style={{ color: typeColor(skill.type) }}>{skill.type}</span>
                    </div>
                </div>
            </div>
            <div className="codex-detail-desc">{skill.desc || 'No description available.'}</div>
            <div className="codex-detail-stats">
                {skill.cooldown != null && <CodexStat label="Cooldown" value={skill.cooldown === 0 ? 'None' : `${skill.cooldown} turns`} />}
                {skill.duration && <CodexStat label="Duration" value={skill.duration} />}
                {skill.range && <CodexStat label="Range" value={skill.range} />}
                {skill.tier && <CodexStat label="Tier" value={skill.tier} />}
                {skill.isPassive && <CodexStat label="Passive" value="Yes — always active" />}
            </div>
            {skill.effect && (
                <div className="codex-detail-effects">
                    <div className="codex-effects-label">Effects</div>
                    <div className="codex-effects-list">
                        {(Array.isArray(skill.effect) ? skill.effect : [skill.effect]).map((e, i) => (
                            <span key={i} className="codex-effect-pill">{typeof e === 'object' ? `${e.type} (${e.chance}%)` : e}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function MonsterDetail({ monster }) {
    const iconSrc = resolveImg(monster.portrait);
    const lore = MONSTER_LORE[monster.type] || {};
    const stats = monster.stats || {};
    return (
        <div className="codex-detail-inner">
            <div className="codex-detail-header">
                {iconSrc && <img src={iconSrc} alt="" className="codex-detail-icon codex-detail-icon--round" />}
                <div>
                    <div className="codex-detail-name" style={{ textTransform: 'capitalize' }}>{(monster.type || '').replace(/_/g, ' ')}</div>
                    <div className="codex-detail-sub">Level {monster.level || '?'} · {monster.subtype || 'creature'} · Tier {monster.tier || '?'}</div>
                </div>
            </div>
            {lore.lore && <div className="codex-detail-desc">{lore.lore}</div>}
            <div className="codex-detail-stats">
                {stats.hp   != null && <CodexStat label="HP"    value={stats.hp}   color="#c94040" />}
                {stats.atk  != null && <CodexStat label="ATK"   value={stats.atk}  color="#d48a30" />}
                {stats.def  != null && <CodexStat label="DEF"   value={stats.def}  color="#4a86c8" />}
                {stats.spd  != null && <CodexStat label="SPD"   value={stats.spd}  />}
                {stats.speed!= null && <CodexStat label="SPD"   value={stats.speed}/>}
            </div>
            {monster.weaknesses && monster.weaknesses.length > 0 && (
                <div className="codex-detail-effects">
                    <div className="codex-effects-label" style={{ color: '#c94040' }}>Weaknesses</div>
                    <div className="codex-effects-list">
                        {monster.weaknesses.map((w, i) => <span key={i} className="codex-effect-pill codex-weakness-pill">{w}</span>)}
                    </div>
                </div>
            )}
            {monster.specials && monster.specials.length > 0 && (
                <div className="codex-detail-effects">
                    <div className="codex-effects-label" style={{ color: '#9b64c9' }}>Specials</div>
                    <div className="codex-effects-list">
                        {monster.specials.map((s, i) => <span key={i} className="codex-effect-pill codex-special-pill">{s.replace(/_/g, ' ')}</span>)}
                    </div>
                </div>
            )}
            {lore.tactics && (
                <div className="codex-tactics-box">
                    <div className="codex-effects-label"><span role="img" aria-label="crossed swords">⚔️</span> Tactics</div>
                    <div className="codex-tactics-text">{lore.tactics}</div>
                </div>
            )}
        </div>
    );
}

function ClassDetail({ cls, allSkills }) {
    const classSkills = allSkills.filter(s => (s.class || '').toLowerCase() === cls.id && s.treePath !== 'global');
    return (
        <div className="codex-detail-inner">
            <div className="codex-detail-header">
                <div className="codex-class-emoji-large" style={{ background: `${cls.color}22`, border: `1px solid ${cls.color}55` }}>
                    <span role="img" aria-label={cls.name}>{cls.emoji}</span>
                </div>
                <div>
                    <div className="codex-detail-name" style={{ color: cls.color }}>{cls.name}</div>
                    <div className="codex-detail-sub">{cls.role}</div>
                </div>
            </div>
            <div className="codex-detail-desc">{cls.desc}</div>
            {classSkills.length > 0 && (
                <div className="codex-detail-effects">
                    <div className="codex-effects-label">Abilities ({classSkills.length})</div>
                    <div className="codex-class-skill-grid">
                        {classSkills.map(s => {
                            const iconSrc = resolveImg(s.icon);
                            return (
                                <div key={s.id} className="codex-class-skill-chip" title={s.desc}>
                                    {iconSrc && <img src={iconSrc} alt="" className="codex-chip-icon" />}
                                    <span>{s.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function InteractableDetail({ item }) {
    const iconSrc = resolveImg(item.icon);
    return (
        <div className="codex-detail-inner">
            <div className="codex-detail-header">
                {iconSrc && <img src={iconSrc} alt="" className="codex-detail-icon" style={{ imageRendering: 'auto' }} />}
                <div>
                    <div className="codex-detail-name">{item.name}</div>
                    <div className="codex-detail-sub" style={{ color: '#888' }}>{item.category}</div>
                </div>
            </div>
            <div className="codex-detail-desc">{item.desc}</div>
            {item.tags && (
                <div className="codex-detail-effects">
                    <div className="codex-effects-label">Tags</div>
                    <div className="codex-effects-list">
                        {item.tags.map((t, i) => <span key={i} className="codex-effect-pill">{t}</span>)}
                    </div>
                </div>
            )}
        </div>
    );
}

function CodexDetailPlaceholder({ tab }) {
    return (
        <div className="codex-detail-placeholder">
            <img src={resolveImg(images.codex)} alt="Codex" className="codex-placeholder-icon" />
            <div className="codex-placeholder-text">Select an entry from the {tab} list to read more.</div>
        </div>
    );
}

function CodexStat({ label, value, color }) {
    return (
        <div className="codex-stat-row">
            <span className="codex-stat-label">{label}</span>
            <span className="codex-stat-value" style={color ? { color } : {}}>{value}</span>
        </div>
    );
}
