import React, { useState, useRef } from 'react';
import AudioVisualizer from './components/AudioVisualizer';
import InteractiveBackground from './components/InteractiveBackground';
import './App.css';

function App() {
  const [audioStreamData, setAudioStreamData] = useState<Uint8Array>();
  const cardRef = useRef<HTMLDivElement>(null);

  // Function to handle cursor interactivity on the card
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Update CSS variables for the spotlight effect
    cardRef.current.style.setProperty('--mouse-x', `${x}%`);
    cardRef.current.style.setProperty('--mouse-y', `${y}%`);
    
    // Subtle tilt effect
    const tiltX = (y - 50) / 10;
    const tiltY = (x - 50) / -10;
    cardRef.current.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `rotateX(0deg) rotateY(0deg)`;
  };

  return (
    <div className="App" style={{ perspective: '1000px' }}>
      <InteractiveBackground audioData={audioStreamData} />
      
      <div 
        className="glass-container" 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <header className="fcb-branding">
            <span className="mes-que">ABZTEC's</span>
            <h1 className="dashboard-title">AUDIO VISUALIZER & TRANSCRIBER</h1>
        </header>

        <AudioVisualizer
            canvasWidth={450} 
            canvasHeight={450}
            websocketUrl="ws://localhost:8080/ws/transcribe"
            onProcessAudio={setAudioStreamData} 
        />
        <div className="internal-tech-lines">
          <div className="line l1"></div>
          <div className="line l2"></div>
          </div>
      </div>
    </div>
  );
}

export default App;