import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import skillsMatrix from '../utils/skills-matrix';
import * as images from '../utils/images';
import '../styles/skill-tree.scss';

const SkillTree = ({ crewMember, onClose }) => {
    const containerRef = useRef(null);
    const [lines, setLines] = useState([]);
    
    // We need to keep references to the DOM nodes of each skill to draw lines between them
    const nodeRefs = useRef({});

    const setNodeRef = (id, el) => {
        if (el) {
            nodeRefs.current[id] = el;
        }
    };

    const typePrefix = crewMember && crewMember.type ? crewMember.type.toLowerCase() : '';

    // Collect all class skills
    const classSkills = Object.keys(skillsMatrix)
        .filter(key => key.startsWith(typePrefix + '_') || skillsMatrix[key].class === typePrefix || 
            // Also include if the skill is directly assigned to the class via our update script
            (skillsMatrix[key].name && skillsMatrix[key].name.toLowerCase().includes(typePrefix)))
        .map(key => skillsMatrix[key]);

    // Group by path and then by tier
    const paths = {
        combat_a: {},
        global: {},
        combat_b: {}
    };

    classSkills.forEach(skill => {
        const tier = skill.tier || 1;
        const p = skill.treePath || 'global';
        if (paths[p]) {
            if (!paths[p][tier]) paths[p][tier] = [];
            paths[p][tier].push(skill);
        }
    });

    // We render bottom up, so Tier 4 is at the top, Tier 1 is at the bottom.
    const allTiers = Array.from(new Set(classSkills.map(s => s.tier || 1))).sort((a, b) => b - a);
    
    // Reverse for calculation of lines (from bottom to top)
    const tiersAscending = [...allTiers].sort((a, b) => a - b);

    const drawLines = () => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        
        const newLines = [];

        Object.keys(paths).forEach(pathName => {
            const tiers = paths[pathName];
            
            // Connect each tier to the tier below it
            for (let i = 1; i < tiersAscending.length; i++) {
                const currentTierNum = tiersAscending[i];
                const prevTierNum = tiersAscending[i - 1];
                
                const currentSkills = tiers[currentTierNum] || [];
                const prevSkills = tiers[prevTierNum] || [];

                if (currentSkills.length === 0 || prevSkills.length === 0) continue;

                // For simplicity, we connect every skill in current tier to every skill in prev tier within the same path
                // This creates a nice branching look.
                currentSkills.forEach(cSkill => {
                    const cNode = nodeRefs.current[cSkill.id];
                    if (!cNode) return;
                    const cRect = cNode.getBoundingClientRect();
                    
                    // Connection point is bottom-center of current node
                    const x1 = cRect.left + cRect.width / 2 - containerRect.left;
                    const y1 = cRect.bottom - containerRect.top;

                    prevSkills.forEach(pSkill => {
                        const pNode = nodeRefs.current[pSkill.id];
                        if (!pNode) return;
                        const pRect = pNode.getBoundingClientRect();
                        
                        // Connection point is top-center of prev node
                        const x2 = pRect.left + pRect.width / 2 - containerRect.left;
                        const y2 = pRect.top - containerRect.top;

                        newLines.push({
                            id: `${pSkill.id}-${cSkill.id}`,
                            x1, y1, x2, y2,
                            pathName
                        });
                    });
                });
            }
        });

        setLines(newLines);
    };

    useLayoutEffect(() => {
        // Draw lines after initial render
        const timeout = setTimeout(drawLines, 100);
        window.addEventListener('resize', drawLines);
        return () => {
            clearTimeout(timeout);
            window.removeEventListener('resize', drawLines);
        };
    }, []);

    const pathLabels = {
        combat_a: 'Combat A',
        global: 'Global',
        combat_b: 'Combat B'
    };

    if (crewMember && crewMember.type) {
        // Map specific class names to better labels if we want
        const t = crewMember.type.toLowerCase();
        if (t === 'ranger') { pathLabels.combat_a = 'Archery'; pathLabels.combat_b = 'Traps & Survival'; }
        if (t === 'sage') { pathLabels.combat_a = 'Healing'; pathLabels.combat_b = 'Holy Light'; }
        if (t === 'soldier') { pathLabels.combat_a = 'Defense & Shield'; pathLabels.combat_b = 'Offense & Sword'; }
        if (t === 'wizard') { pathLabels.combat_a = 'Destruction'; pathLabels.combat_b = 'Control & Ice'; }
        if (t === 'barbarian') { pathLabels.combat_a = 'Fury & Rage'; pathLabels.combat_b = 'Brutality'; }
        if (t === 'monk') { pathLabels.combat_a = 'Chi & Spirit'; pathLabels.combat_b = 'Martial Arts'; }
        if (t === 'summoner') { pathLabels.combat_a = 'Conjuration'; pathLabels.combat_b = 'Darkness & Void'; }
    }

    if (!crewMember) return null;

    return (
        <div className="skill-tree-container">
            <div className="skill-tree-header">
                <h2>{crewMember.name}'s Skill Tree ({crewMember.type})</h2>
                <button className="skill-tree-close-btn" onClick={onClose}>✕</button>
            </div>
            
            <div className="skill-tree-body" ref={containerRef}>
                {/* SVG Overlay for Lines */}
                <svg className="skill-tree-svg-overlay">
                    {lines.map((line) => {
                        // Create a curved path
                        const midY = (line.y1 + line.y2) / 2;
                        const d = `M ${line.x2} ${line.y2} C ${line.x2} ${midY}, ${line.x1} ${midY}, ${line.x1} ${line.y1}`;
                        
                        let strokeColor = '#FFD700'; // Global Yellow
                        if (line.pathName === 'combat_a') strokeColor = '#32CD32'; // Green
                        if (line.pathName === 'combat_b') strokeColor = '#FF4500'; // Red
                        
                        return (
                            <path
                                key={line.id}
                                d={d}
                                stroke={strokeColor}
                                strokeWidth="3"
                                fill="none"
                                opacity="0.6"
                            />
                        );
                    })}
                </svg>

                <div className="skill-tree-paths">
                    {['combat_a', 'global', 'combat_b'].map(pathName => (
                        <div key={pathName} className={`skill-tree-column path-${pathName}`}>
                            {/* Render Tiers from top to bottom (4 -> 1) */}
                            {allTiers.map(tier => {
                                const skillsInTier = paths[pathName][tier] || [];
                                return (
                                    <div key={`${pathName}-tier-${tier}`} className="skill-tier-row">
                                        {skillsInTier.map(skill => {
                                            const isKnown = skill.knownByDefault;
                                            return (
                                                <div 
                                                    key={skill.id} 
                                                    ref={(el) => setNodeRef(skill.id, el)}
                                                    className={`skill-node ${isKnown ? 'known' : 'locked'}`}
                                                    title={`${skill.name}\n${skill.desc}\nCooldown: ${skill.cooldown}`}
                                                >
                                                    <div className="skill-node-icon-wrapper">
                                                        <img src={skill.icon || images.avatar} alt={skill.name} />
                                                        {isKnown && <div className="known-badge">✓</div>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                            <div className="path-label">{pathLabels[pathName]}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SkillTree;
