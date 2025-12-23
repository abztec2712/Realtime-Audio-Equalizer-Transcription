import React, { useState, useRef } from 'react';
import AudioVisualizer from './components/AudioVisualizer';
import InteractiveBackground from './components/InteractiveBackground';
import './App.css';

function App() {
  const [audioStreamData, setAudioStreamData] = useState<Uint8Array>();
  const [isHovered, setIsHovered] = useState(false);
  const [isSystemActive, setIsSystemActive] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false); 
  const cardRef = useRef<HTMLDivElement>(null);

  const handleInteraction = (e: React.MouseEvent) => {
    // Tilt persists before and after activation, but pauses while flipped
    if (!cardRef.current || isFlipped) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    cardRef.current.style.setProperty('--mouse-x', `${x}%`);
    cardRef.current.style.setProperty('--mouse-y', `${y}%`);
    
    const tiltX = (y - 50) / 12;
    const tiltY = (x - 50) / -12;
    cardRef.current.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  };

  const handleCardFlip = (e: React.MouseEvent) => {
    // Prevent flipping if system is active to keep focus on visualizer
    if (isSystemActive) return;
    
    setIsFlipped(!isFlipped);
    
    if (cardRef.current) {
      // Direct rotation override to ensure smooth 180deg turn
      cardRef.current.style.transform = !isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)';
    }
  };

  return (
    <div className="App">
      {/* Background waves rendered globally behind the card scene */}
      <InteractiveBackground audioData={audioStreamData} isHovered={isHovered} />
      
      <div className="card-scene">
        <div 
          className={`glass-container ${isFlipped ? 'is-flipped' : ''}`} 
          ref={cardRef}
          onMouseMove={handleInteraction}
          onClick={handleCardFlip}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            if (cardRef.current && !isFlipped) {
              cardRef.current.style.transform = `rotateX(0deg) rotateY(0deg)`;
            }
          }}
        >
          {/* FRONT FACE: Tactical Interface */}
          <div className="card-face card-front">
            <header className="fcb-branding">
                <span className="mes-que">MÉS QUE UN CLUB</span>
                <h1 className="dashboard-title">TACTICAL VOICE INTERFACE</h1>
            </header>

            <div className="main-stage">
              <AudioVisualizer
                  canvasWidth={450} 
                  canvasHeight={450}
                  websocketUrl="ws://localhost:8080/ws/transcribe"
                  onProcessAudio={setAudioStreamData}
                  isSystemActive={isSystemActive}
                  onSystemActivated={() => setIsSystemActive(true)}
              />
            </div>

            <div className="data-fragment-stream">
              <div className="fragment f1"></div>
              <div className="fragment f2"></div>
            </div>

            <div className="tech-corner tl" />
            <div className="tech-corner br" />
          </div>

          {/* BACK FACE: Briefing Overview */}
          <div className="card-face card-back">
            <header className="fcb-branding">
                <span className="mes-que">INTEL_BRIEFING</span>
                <h1 className="dashboard-title">SYSTEM_OVERVIEW</h1>
            </header>
            
            <div className="back-content-area">
              <p>CORE_ENGINE: <strong>GEMINI_PRO</strong></p>
              <p>VISUAL_MATRIX: <strong>BLAUGRANA_SYNC</strong></p>
              <p>STATUS: <strong>READY</strong></p>
              <div className="click-to-return">CLICK ANYWHERE TO RETURN</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;