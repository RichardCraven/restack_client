// Minimal Card Duel prototype component (player vs simple Reaper AI)
// Props:
// - inventoryManager (optional) : used to deduct gold on loss

// Minimal Card Duel prototype component (player vs simple Reaper AI)
// Props:
// - inventoryManager (optional) : used to deduct gold on loss
// - saveUserData (optional) : function to call after adjusting gold
// - onFinish(result) : callback when duel ends

import React from 'react';
import cardManager from '../../utils/card-manager';

// Minimal Card Duel prototype component (player vs simple Reaper AI)
// Props:
// - inventoryManager (optional) : used to deduct gold on loss
// - saveUserData (optional) : function to call after adjusting gold
// - onFinish(result) : callback when duel ends

class CardDuel extends React.Component {
    constructor(props){
        super(props);
        // Build decks
        const playerDeck = cardManager.buildStarterDeck();
        const reaperDeck = cardManager.buildStarterDeck();
        this.state = {
                    player: { deck: playerDeck, hand: [], field: [], discard: [], resolve: 6, symmetry: 0 },
                    reaper: { deck: reaperDeck, hand: [], field: [], discard: [], resolve: 8, symmetry: 0 },
                    turn: 'player',
                    turnNumber: 1,
                    maxSymmetry: 6,
                    message: 'Duel started'
                };
    }

    componentDidMount(){
                for(let i=0;i<5;i++){ this.draw('player'); this.draw('reaper'); }
                this.setState({message: 'Your turn'});
            }

            draw = (side) => {
                this.setState(prev => {
                    const s = {...prev[side]};
                    if(s.deck.length === 0){
                        if(s.discard.length > 0){ s.deck = cardManager.shuffle(s.discard.slice()); s.discard = []; }
                        else { this.finish(side === 'player' ? 'reaper' : 'player'); return prev; }
                    }
                    s.hand = s.hand.concat(s.deck.splice(0,1));
                    return { [side]: s };
                })
            }

            startTurn = (side) => {
                this.setState(prev => {
                    const next = {...prev};
                    const s = {...next[side]};
                    s.symmetry = Math.min(prev.maxSymmetry, s.symmetry + 1);
                    // reset constructs so they can attack again this turn
                    s.field = (s.field || []).map(f => ({...f, hasAttacked: false}));
                    next[side] = s; return next;
                }, () => { this.draw(side); if(side === 'reaper') this.aiPlay(); });
            }

            playCard = (side, cardId) => {
                const card = cardManager.getCard(cardId);
                if(!card) return;
                this.setState(prev => {
                    const s = {...prev[side]};
                    if(card.cost > s.symmetry) return prev;
                    s.symmetry -= card.cost;
                    const idx = s.hand.indexOf(cardId); if(idx !== -1) s.hand.splice(idx,1);
                    if(card.type === 'construct') s.field = s.field.concat([{...card, runtimeIntegrity: card.integrity, hasAttacked: false}]);
                    else if(card.type === 'sigil'){
                        const eff = card.effect || {};
                        if(eff.type === 'damage'){
                            const target = (side === 'player') ? 'reaper' : 'player'; const t = {...prev[target]};
                            t.resolve = Math.max(0, t.resolve - (eff.amount || 0)); s.discard = s.discard.concat(cardId);
                            return { [side]: s, [target]: t };
                        }
                        if(eff.type === 'symmetry') s.symmetry += (eff.amount || 0);
                        if(eff.type === 'destroy_weak'){
                            const target = (side === 'player') ? 'reaper' : 'player'; const t = {...prev[target]};
                            const kept = []; for(const c of t.field){ if((c.runtimeIntegrity||c.integrity) <= (eff.threshold||0)) t.discard = t.discard.concat(c.id||c); else kept.push(c); }
                            t.field = kept; s.discard = s.discard.concat(cardId); return { [side]: s, [target]: t };
                        }
                        s.discard = s.discard.concat(cardId);
                    }
                    return { [side]: s };
                }, () => { if(card && card.effect && card.effect.type === 'draw'){ const amount = card.effect.amount || 1; for(let i=0;i<amount;i++) this.draw(side); } this.checkVictory(); })
            }

            cardPlayable = (side, cardId) => { const card = cardManager.getCard(cardId); const s = this.state[side]; return card && (card.cost <= s.symmetry); }

            basicAttack = (attacker, fromSide, targetIndex = -1) => {
                const targetSide = (fromSide === 'player') ? 'reaper' : 'player';
                // Ensure the attacker hasn't already attacked this turn and update state atomically
                this.setState(prev => {
                    const from = {...prev[fromSide]};
                    const field = (from.field || []).slice();
                    const idx = field.findIndex(f => (f && attacker && ((f.id && attacker.id && f.id === attacker.id) || f === attacker)));
                    if(idx === -1) return prev; // attacker not found
                    if(field[idx].hasAttacked) return prev; // already attacked this turn
                    // mark as having attacked
                    field[idx] = { ...field[idx], hasAttacked: true };
                    from.field = field;
                    const defender = { ...prev[targetSide] };
                    // if targetIndex is -1 or target not found, attack resolve
                    if(targetIndex === -1 || !(defender.field && defender.field[targetIndex])){
                        defender.resolve = Math.max(0, defender.resolve - (field[idx].attack || 0));
                        return { [fromSide]: from, [targetSide]: defender };
                    }
                    // attack specific construct on defender's field
                    const defField = (defender.field || []).slice();
                    defField[targetIndex] = { ...defField[targetIndex], runtimeIntegrity: (defField[targetIndex].runtimeIntegrity || defField[targetIndex].integrity) - (field[idx].attack || 0) };
                    if(defField[targetIndex].runtimeIntegrity <= 0){
                        defender.discard = (defender.discard || []).concat(defField[targetIndex].id || defField[targetIndex]);
                        defField.splice(targetIndex, 1);
                    }
                    defender.field = defField;
                    return { [fromSide]: from, [targetSide]: defender };
                }, this.checkVictory);
            }

            aiPlay = () => { const s = {...this.state.reaper}; for(const cid of s.hand.slice()){ const card = cardManager.getCard(cid); if(card && card.cost <= s.symmetry){ this.playCard('reaper', cid); break; } } setTimeout(()=>{ const reaperField = this.state.reaper.field || []; if(reaperField.length) this.basicAttack(reaperField[0], 'reaper'); this.setState(prev => ({ turn: 'player', turnNumber: prev.turnNumber + 1 }), () => { this.startTurn('player'); }); }, 350); }

            endTurn = () => { this.setState({ turn: 'reaper' }, () => this.startTurn('reaper')); }

            checkVictory = () => { if(this.state.player.resolve <= 0) { this.finish('reaper'); return; } if(this.state.reaper.resolve <= 0) { this.finish('player'); return; } }

            finish = (winner) => {
                const result = { winner, playerResolve: this.state.player.resolve, reaperResolve: this.state.reaper.resolve };
                if(winner === 'reaper' && this.props.inventoryManager){ try{ const im = this.props.inventoryManager; if(typeof im.gold === 'number'){ im.gold = Math.floor(im.gold * 0.75); } if(typeof this.props.saveUserData === 'function') this.props.saveUserData(); } catch(e){ console.warn('failed to tax gold after duel', e); } }
                if(typeof this.props.onFinish === 'function'){ try{ this.props.onFinish(result); } catch(e){} }
                this.setState({ message: `Duel finished: ${winner} wins.` });
            }

            renderCard = (cid, idx) => {
                const c = cardManager.getCard(cid);
                if(!c) return <div key={`${cid}-${idx}`}>{cid}</div>;
                return (
                    <div key={`${cid}-${idx}`} style={{border:'1px solid #666', padding:6, margin:4, width:160}}>
                        <strong>{c.name}</strong>
                        <div style={{fontSize:12}}>Cost: {c.cost} Type: {c.type}</div>
                        {c.type === 'construct' && <div style={{fontSize:12}}>Atk:{c.attack} Shd:{c.shield} Int:{c.integrity}</div>}
                        {c.type === 'sigil' && <div style={{fontSize:12}}>{c.text}</div>}
                        <div style={{marginTop:6}}>
                            {this.cardPlayable('player', cid) ? <button onClick={()=>this.playCard('player', cid)}>Play</button> : <button disabled>Play</button>}
                        </div>
                    </div>
                )
            }

            render(){
                const { player, reaper, message } = this.state;
                return (
                    <div style={{padding:12}}>
                        <h3>Fire of Circulation — Duel</h3>
                        <div style={{display:'flex', gap:12}}>
                            <div style={{flex:1}}>
                                <h4>Your zone — Resolve: {player.resolve} Symmetry: {player.symmetry}</h4>
                                <div style={{display:'flex', flexWrap:'wrap'}}>
                                    {player.hand.map((cid, idx) => this.renderCard(cid, idx))}
                                </div>
                                <div style={{marginTop:8}}>
                                    <button onClick={()=>this.endTurn()}>End Turn</button>
                                </div>
                                <div style={{marginTop:8}}>
                                    <strong>Field</strong>
                                    <div style={{display:'flex', gap:6}}>
                                        {player.field.map((c,idx)=> (
                                            <div key={idx} style={{border:'1px solid #333', padding:6}}>
                                                <div>{c.name}</div>
                                                <div>Atk:{c.attack} Int:{c.runtimeIntegrity||c.integrity}</div>
                                                <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                                                    {(reaper.field || []).map((tc, tIdx) => (
                                                        <button key={`t-${tIdx}`} onClick={()=>this.basicAttack(c,'player', tIdx)} disabled={c.hasAttacked}>Attack {tc.name}</button>
                                                    ))}
                                                    <button onClick={()=>this.basicAttack(c,'player', -1)} disabled={c.hasAttacked}>{c.hasAttacked ? 'Attacked' : 'Attack Reaper'}</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div style={{width:280}}>
                                <h4>Reaper — Resolve: {reaper.resolve} Symmetry: {reaper.symmetry}</h4>
                                <div><strong>Field</strong></div>
                                <div style={{display:'flex', flexDirection:'column', gap:6}}>
                                    {reaper.field.map((c,idx)=>(
                                        <div key={idx} style={{border:'1px solid #333', padding:6}}>{c.name} Atk:{c.attack} Int:{c.runtimeIntegrity||c.integrity}</div>
                                    ))}
                                </div>
                                <div style={{marginTop:8}}>
                                    <button onClick={()=>{ if(this.props.onFinish) this.props.onFinish({ winner: 'forfeit' }); }}>Forfeit</button>
                                </div>
                            </div>
                        </div>
                        <div style={{marginTop:12}}>{message}</div>
                    </div>
                )
            }
        }

export default CardDuel;
