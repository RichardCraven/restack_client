// Thin CampManager helpers extracted from DungeonPage to keep camping logic reusable
// Functions accept the DungeonPage component instance as the first arg so we can
// reuse existing component state and helpers without heavy refactors.

import { storeMeta, getMeta, getUserId } from './session-handler';
import { updateUserRequest } from './api-handler';

export async function setUpCamp(component, maybeDuration) {
    let durationSeconds = 10;
    console.log('chhanging duration to 90 seconds');
    try { if (typeof maybeDuration === 'number') durationSeconds = maybeDuration; } catch(e){}
    try {
        try {
            if (component.campTimeout) { clearTimeout(component.campTimeout); component.campTimeout = null; }
        } catch (e) {}
        try { if (component.campInterval) { try { clearInterval(component.campInterval); } catch(e){} component.campInterval = null; } } catch(e){}
        let meta = getMeta() || {};
        const now = new Date();
        meta.camping = true;
        meta.campingStart = now.toISOString();
        meta.campingEnd = new Date(now.getTime() + durationSeconds * 1000).toISOString();
        storeMeta(meta);
        try { await updateUserRequest(getUserId(), meta); } catch (e) {}
        // Persist meta via the higher-level save helper so location and session
        // state are stored consistently (ensures position is saved on refresh).
        try { if (component.props.saveUserData) await component.props.saveUserData(); } catch (e) {}
        // camping started
        // lock movement hotkeys while camping
        try { component.setState({ keysLocked: true }); } catch(e) {}
        if (component.props.boardManager && typeof component.props.boardManager.placePlayer === 'function') {
            try{ component.props.boardManager.placePlayer(component.props.boardManager.playerTile.location); } catch(e){}
        }
        try { component.setState({ overlayTiles: component.props.boardManager.overlayTiles }); } catch(e){}
        // ensure continuous draw loop while camping to avoid flashing
        try {
            component._forcedDraw = true;
            if (!component.cooldownAnimationFrame) component.cooldownAnimationFrame = requestAnimationFrame(component.drawCooldowns);
        } catch (e) {}
        // schedule end
        try {
            component.campTimeout = component._setTimeout(() => { try { endCamp(component); } catch(e){ console.warn('endCamp timeout failed', e); } }, durationSeconds*1000 + 200);
        } catch(e){}

        // start an interval that logs camp progress every 10 seconds
        try {
            const startIso = meta.campingStart;
            const endIso = meta.campingEnd;
            const startTs = new Date(startIso).getTime();
            const endTs = new Date(endIso).getTime();
            const logOnce = () => {
                const now = Date.now();
                const elapsed = Math.max(0, Math.floor((now - startTs) / 1000));
                const remaining = Math.max(0, Math.ceil((endTs - now) / 1000));
                console.log(`[CampManager] camp start=${startIso} end=${endIso} elapsed_s=${elapsed} remaining_s=${remaining}`);
            };
            // log immediately once
            try { logOnce(); } catch(e){}
            const setIntervalFn = (component._setInterval && typeof component._setInterval === 'function') ? component._setInterval : setInterval;
            component.campInterval = setIntervalFn(() => {
                try { logOnce(); } catch(e){}
            }, 10000);
        } catch (e) { console.warn('camp interval setup failed', e); }
    } catch (err) { console.warn('setUpCamp error', err); }
}

export async function endCamp(component) {
    try {
        try { if (component.campTimeout) { clearTimeout(component.campTimeout); component.campTimeout = null; } } catch (e) {}
        try { if (component.campInterval) { try { clearInterval(component.campInterval); } catch(e){} component.campInterval = null; } } catch(e){}
        let m = getMeta() || {};
        m.camping = false;
        delete m.campingStart;
        delete m.campingEnd;
        try {
            const crew = (component.props.crewManager && component.props.crewManager.crew) || [];
            crew.forEach(member => {
                if (!member) return;
                if (member.dead) { member.dead = false; member.hp = 1; }
                else { try { member.hp = (member.stats && typeof member.stats.hp === 'number') ? member.stats.hp : member.hp || 0; } catch(e){} }
            });
            m.crew = crew;
            try { if (component.props.crewManager) component.props.crewManager.crew = m.crew; } catch(e){}
        } catch(e){}
        storeMeta(m);
        try { await updateUserRequest(getUserId(), m); } catch(e){}
        if (component.props.boardManager && typeof component.props.boardManager.placePlayer === 'function') {
            try{ component.props.boardManager.placePlayer(component.props.boardManager.playerTile.location); } catch(e){}
        }
        try { component.setState({ overlayTiles: component.props.boardManager.overlayTiles, selectedCrewMember: component.state.selectedCrewMember }); } catch(e){}
        try { if (component.props.saveUserData) component.props.saveUserData(); } catch(e){}
        // camping ended and crew restored
        // unlock movement hotkeys
        try { component.setState({ keysLocked: false }); } catch(e) {}
        // stop forced draw loop and clear canvas
        try {
            component._forcedDraw = false;
            if (component.cooldownAnimationFrame) { cancelAnimationFrame(component.cooldownAnimationFrame); component.cooldownAnimationFrame = null; }
            if (component.cooldownCanvas) {
                const ctx = component.cooldownCanvas.getContext && component.cooldownCanvas.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, component.cooldownCanvas.width, component.cooldownCanvas.height);
            }
        } catch (e) {}
    } catch (err) { console.warn('endCamp error', err); }
}

export default {
    setUpCamp,
    endCamp
}
