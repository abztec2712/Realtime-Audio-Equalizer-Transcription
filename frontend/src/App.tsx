// frontend/src/App.tsx
import AudioVisualizer from './components/AudioVisualizer';
import './App.css'; 

function App() {
  
  const websocketUrl = 'ws://localhost:8080/ws/transcribe'; 

  return (
    <div className="container">
      <h1>Audio Equalizer & Real-Time Transcription</h1>
      {/* Set canvas size and pass the backend WebSocket URL */}
      <AudioVisualizer 
        canvasWidth={400} 
        canvasHeight={400} 
        websocketUrl={websocketUrl} 
      />
    </div>
  );
}

export default App;