import React, { useRef, useEffect, useState, useCallback } from 'react';

interface VisualizerProps {
  canvasWidth: number;
  canvasHeight: number;
  websocketUrl: string;
  onProcessAudio?: (data: Uint8Array) => void;
  isSystemActive: boolean;
  onSystemActivated: () => void;
}

const AudioVisualizer: React.FC<VisualizerProps> = ({ 
  canvasWidth, canvasHeight, websocketUrl, onProcessAudio, isSystemActive, onSystemActivated 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const frequencyDataRef = useRef<Uint8Array>();
  const websocketRef = useRef<WebSocket>();

  const [status, setStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [transcription, setTranscription] = useState('SYSTEM_IDLE: .........MES QUE UN CLUB');

  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !analyserRef.current || !frequencyDataRef.current) return;

    animationRef.current = requestAnimationFrame(drawVisualizer);
    analyserRef.current.getByteFrequencyData(frequencyDataRef.current);
    if (onProcessAudio) onProcessAudio(new Uint8Array(frequencyDataRef.current));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2, centerY = canvas.height / 2;
    const avgVolume = frequencyDataRef.current.reduce((a, b) => a + b) / frequencyDataRef.current.length;

    ctx.beginPath();
    ctx.arc(centerX, centerY, 75, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 0, 85, ${0.15 + (avgVolume / 255) * 0.4})`;
    ctx.fill();

    for (let i = 0; i < 90; i++) {
      const mag = frequencyDataRef.current[i] || 0;
      const h = (mag / 255) * 120;
      const angle = (i * 2 * Math.PI) / 90;
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = i % 2 === 0 ? '#0076ff' : '#ff0055';
      ctx.moveTo(centerX + 80 * Math.cos(angle), centerY + 80 * Math.sin(angle));
      ctx.lineTo(centerX + (80 + h) * Math.cos(angle), centerY + (80 + h) * Math.sin(angle));
      ctx.stroke();
    }
  };

  const startStream = async () => {
    onSystemActivated();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
          // PCM conversion and WS send logic here
      };

      source.connect(analyser);
      source.connect(processor);
      processor.connect(context.destination);
      analyserRef.current = analyser;
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      audioContextRef.current = context;

      const ws = new WebSocket(websocketUrl);
      websocketRef.current = ws;
      ws.onopen = () => setStatus('CONNECTED');
      ws.onmessage = (e) => setTranscription(e.data);
      ws.onclose = () => setStatus('ERROR');
      
      drawVisualizer();
    } catch (err) { setStatus('ERROR'); }
  };

  return (
    <div className="v-wrapper">
      {!isSystemActive ? (
        <button 
          className="cyber-button" 
          onClick={(e) => { e.stopPropagation(); startStream(); }}
        >
          ESTABLISH TACTICAL LINK
        </button>
      ) : (
        <div className="active-ui">
          <div className="status-indicator-bar">
            <div className={`indicator-dot ${status.toLowerCase()}`}></div>
            <span className="indicator-text">SYSTEM_STATUS: {status}</span>
          </div>

          <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} />

          <div className="terminal-container">
            <div className="terminal-content">{`>> ${transcription}`}</div>
          </div>
        </div>
      )}
      <style>{`
        .v-wrapper { width: 100%; display: flex; justify-content: center; align-items: center; }
        .active-ui { display: flex; flex-direction: column; align-items: center; width: 100%; animation: fadeIn 1s forwards; }
        
        .status-indicator-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding: 8px 15px; background: rgba(0, 118, 255, 0.1); border: 1px solid #0076ff; border-radius: 4px; }
        .indicator-dot { width: 10px; height: 10px; border-radius: 50%; }
        .indicator-dot.idle { background: #ffcc00; }
        .indicator-dot.connected { background: #00ff41; box-shadow: 0 0 10px #00ff41; animation: ledPulse 1.5s infinite !important; }
        .indicator-dot.error { background: #ff0055; box-shadow: 0 0 10px #ff0055; }
        
        @keyframes ledPulse { 0%, 100% { opacity: 1; filter: brightness(1.2); } 50% { opacity: 0.3; filter: brightness(0.8); } }
        .indicator-text { color: #ffcc00; font-family: monospace; font-size: 0.7rem; letter-spacing: 1px; }

        .terminal-container { 
          border-left: 4px solid #0076ff; 
          border-right: 4px solid #ff0055;
          background: rgba(0, 0, 0, 0.85); 
          padding: 20px; 
          width: 85%; /* Keeps box inside card boundaries */
          max-width: 500px;
          margin-top: 25px;
          box-sizing: border-box;
        }
        .terminal-content { color: white; font-family: monospace; font-size: 0.8rem; text-align: left; line-height: 1.4; }
        
        .cyber-button { background: transparent; color: var(--fcb-gold); border: 1px solid var(--fcb-gold); padding: 15px 30px; letter-spacing: 2px; font-weight: bold; cursor: pointer; transition: 0.3s; z-index: 50; }
        .cyber-button:hover { background: #0076ff; color: white; box-shadow: 0 0 20px #0076ff; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default AudioVisualizer;