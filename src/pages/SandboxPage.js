import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import AssemblyAnimation from '../components/assembly-animation';

// Dynamically load all runes from the directory
const req = require.context('../assets/icons/runes', true, /\.png$/);

const runesData = {};

req.keys().forEach(key => {
  const parts = key.split('/');
  if (parts.length === 2) {
    // Base rune icon, e.g., "./archaic.png"
    const runeName = parts[1].replace('.png', '');
    if (!runesData[runeName]) runesData[runeName] = { isComplete: false, pieces: {} };
    runesData[runeName].baseImg = req(key).default || req(key);
  } else if (parts.length === 3) {
    // Inside a rune directory, e.g., "./archaic/top right.png"
    const runeName = parts[1];
    if (!runesData[runeName]) runesData[runeName] = { isComplete: false, pieces: {} };
    
    const fileName = parts[2].replace('.png', '');
    if (fileName === `${runeName}_assembled`) {
      runesData[runeName].assembledImg = req(key).default || req(key);
    } else {
      runesData[runeName].pieces[fileName] = req(key).default || req(key);
    }
  }
});

// Evaluate completeness for each rune
Object.keys(runesData).forEach(runeName => {
  const data = runesData[runeName];
  const requiredPieces = ['top left', 'top right', 'bottom left', 'bottom right', 'top center'];
  
  // Check if it has all the exact required piece names
  const hasAllPieces = requiredPieces.every(piece => !!data.pieces[piece]);
  
  if (data.assembledImg && hasAllPieces) {
    data.isComplete = true;
    
    // Filter out any "copy" or "edited" backup files that might be in the directory
    const filteredPieces = {};
    requiredPieces.forEach(piece => {
      filteredPieces[piece] = data.pieces[piece];
    });
    data.pieces = filteredPieces;
  }
});

const SandboxPage = () => {
  const history = useHistory();
  const [activeTab, setActiveTab] = useState('shard assembly');
  const [isAssembled, setIsAssembled] = useState(false);
  const [selectedRune, setSelectedRune] = useState('archaic');

  const activeData = runesData[selectedRune];

  const tabs = [
    { id: 'shard assembly', label: 'Shard Assembly', enabled: true },
    { id: 'item upgrade', label: 'Item Upgrade', enabled: false },
    { id: 'combat animations', label: 'Combat Animations', enabled: false }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#111',
      color: 'white',
      paddingTop: '20px'
    }}>
      {/* Header & Tabs */}
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        borderBottom: '1px solid #333', 
        padding: '0 20px',
        marginBottom: '40px'
      }}>
        <button 
          onClick={() => history.push('/landing')}
          style={{
            padding: '10px 20px',
            cursor: 'pointer',
            alignSelf: 'center'
          }}
        >
          Back
        </button>
        
        <div style={{ display: 'flex', gap: '20px', marginLeft: '40px' }}>
          {tabs.map(tab => (
            <div 
              key={tab.id}
              onClick={() => tab.enabled && setActiveTab(tab.id)}
              style={{
                padding: '15px 20px',
                cursor: tab.enabled ? 'pointer' : 'not-allowed',
                opacity: tab.enabled ? 1 : 0.5,
                borderBottom: activeTab === tab.id ? '2px solid white' : '2px solid transparent',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'shard assembly' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px'
        }}>
          {/* Rune Selection Menu */}
      <div style={{
        display: 'flex',
        gap: '15px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        background: '#222',
        padding: '15px',
        borderRadius: '8px'
      }}>
        {Object.keys(runesData).map(runeName => {
          const data = runesData[runeName];
          const isSelected = selectedRune === runeName;
          
          return (
            <div 
              key={runeName} 
              style={{ 
                position: 'relative', 
                cursor: data.isComplete ? 'pointer' : 'not-allowed', 
                opacity: data.isComplete ? 1 : 0.4,
                border: isSelected ? '2px solid white' : '2px solid transparent',
                borderRadius: '4px',
                padding: '4px',
                transition: 'border 0.2s'
              }}
              onClick={() => data.isComplete && setSelectedRune(runeName)}
              title={runeName}
            >
              <img src={data.baseImg} alt={runeName} style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
              {!data.isComplete && (
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'rgba(255, 0, 0, 0.8)', 
                  fontSize: '60px', 
                  fontWeight: 'bold',
                  pointerEvents: 'none'
                }}>
                  X
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button 
        onClick={() => setIsAssembled(!isAssembled)}
        style={{
          padding: '10px 20px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          opacity: activeData?.isComplete ? 1 : 0.5,
          pointerEvents: activeData?.isComplete ? 'auto' : 'none'
        }}
      >
        {isAssembled ? 'Reset' : 'Animate'}
      </button>

      {/* Animation Containers */}
      {activeData?.isComplete && (
        <div style={{ display: 'flex', gap: '50px' }}>
          {/* Container 1: Assembled Image Reference */}
          <div style={{
            width: '100px',
            height: '100px',
            border: '1px solid #333',
            position: 'relative'
          }}>
            <img 
              src={activeData.assembledImg} 
              alt={`${selectedRune} Assembled`} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>

          {/* Container 2: Shards Overlay */}
          <div style={{
            width: '100px',
            height: '100px',
            border: '1px solid #333',
            position: 'relative'
          }}>
            <AssemblyAnimation 
              pieces={activeData.pieces} 
              isAssembled={isAssembled} 
              distance={40}
            />
          </div>
        </div>
      )}
      
        </div>
      )}

    </div>
  );
};

export default SandboxPage;
