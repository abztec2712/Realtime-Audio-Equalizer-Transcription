// frontend/src/App.tsx
import AudioVisualizer from './components/AudioVisualizer';
import './App.css';

function App() {
  const websocketUrl = 'ws://localhost:8080/ws/transcribe';

  return (
    <div className="App">
      <AudioVisualizer
        canvasWidth={400}
        canvasHeight={400}
        websocketUrl={websocketUrl}
      />
    </div>
  );
}

export default App;
