import React, { useRef, useEffect, useState, useCallback } from 'react';

interface VisualizerProps {
  canvasWidth: number;
  canvasHeight: number;
  websocketUrl: string;
  onProcessAudio?: (data: Uint8Array) => void; 
}

type ConnectionStatus = 'IDLE' | 'CONNECTED' | 'ERROR';

const AudioVisualizer: React.FC<VisualizerProps> = ({ 
  canvasWidth, 
  canvasHeight, 
  websocketUrl, 
  onProcessAudio 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const frequencyDataRef = useRef<Uint8Array>();
  const websocketRef = useRef<WebSocket>();

  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('IDLE');
  const [transcription, setTranscription] = useState('SYSTEM_IDLE: .........MES QUE UN CLUB');

  const baseRadius = 75;
  const numBars = 90;

  const floatTo16BitPCM = (input: Float32Array): DataView => {
    const output = new DataView(new ArrayBuffer(input.length * 2));
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return output;
  };

  const initWebSocket = useCallback(() => {
    const ws = new WebSocket(websocketUrl);
    websocketRef.current = ws;
    ws.onopen = () => {
      setTranscription('COMM_LINK_ESTABLISHED: VISCA ');
      setStatus('CONNECTED');
    };
    ws.onmessage = (event) => setTranscription(event.data);
    ws.onclose = () => { setStatus('ERROR'); setTranscription('CONNECTION_LOST: REBOOT SYSTEM'); };
    ws.onerror = () => setStatus('ERROR');
  }, [websocketUrl]);

  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !analyserRef.current || !frequencyDataRef.current) return;

    animationRef.current = requestAnimationFrame(drawVisualizer);
    analyserRef.current.getByteFrequencyData(frequencyDataRef.current);

    // Send data to background orbs
    if (onProcessAudio) {
      onProcessAudio(new Uint8Array(frequencyDataRef.current));
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const avgVolume = frequencyDataRef.current.reduce((a, b) => a + b) / frequencyDataRef.current.length;
    
    // Garnet Pulse
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius - 5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(165, 0, 68, ${0.1 + (avgVolume / 255) * 0.3})`;
    ctx.fill();

    for (let i = 0; i < numBars; i++) {
      const magnitude = frequencyDataRef.current[i] || 0;
      const barHeight = (magnitude / 255) * 110;
      const angle = (i * (2 * Math.PI)) / numBars;

      const startX = centerX + baseRadius * Math.cos(angle);
      const startY = centerY + baseRadius * Math.sin(angle);
      const endX = centerX + (baseRadius + barHeight) * Math.cos(angle);
      const endY = centerY + (baseRadius + barHeight) * Math.sin(angle);

      ctx.beginPath();
      ctx.lineWidth = 3;
      const isEven = i % 2 === 0;
      ctx.strokeStyle = isEven ? '#004d98' : '#a50044';
      ctx.shadowBlur = magnitude > 120 ? 15 : 0;
      ctx.shadowColor = ctx.strokeStyle as string;
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  };

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        const pcm16 = floatTo16BitPCM(e.inputBuffer.getChannelData(0));
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
          websocketRef.current.send(pcm16.buffer);
        }
      };

      source.connect(analyser);
      source.connect(processor);
      processor.connect(context.destination);

      analyserRef.current = analyser;
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      audioContextRef.current = context;

      initWebSocket();
      drawVisualizer();
      setIsReady(true);
    } catch (err) {
      setStatus('ERROR');
    }
  };

  return (
    <div className="visualizer-container">
      <div className="status-bar">
        <div className={`status-dot ${status.toLowerCase()}`}></div>
        <span className="status-text">CONNECTION_STATUS: {status}</span>
      </div>

      <div className="canvas-wrapper">
        <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} />
      </div>
      
      {!isReady && <button className="cyber-button" onClick={startStream}>ESTABLISH COMMS</button>}

      <div className="transcription-terminal">
        <span className="terminal-label">TRANSCRIPTION_FEED:</span>
        <div className="terminal-text">{`>> ${transcription}`}</div>
      </div>

      <style>{`
        .visualizer-container { display: flex; flex-direction: column; align-items: center; }
        .status-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding: 5px 15px; background: rgba(0, 77, 152, 0.2); border: 1px solid #004d98; border-radius: 4px; }
        .status-dot { width: 10px; height: 10px; border-radius: 50%; }
        .status-dot.idle { background: #edbb00; }
        .status-dot.connected { background: #00ff41; box-shadow: 0 0 10px #00ff41; animation: pulse 1s infinite; }
        .status-dot.error { background: #a50044; box-shadow: 0 0 10px #a50044; }
        @keyframes pulse { 50% { opacity: 0.5; } }
        .status-text { font-family: monospace; font-size: 0.65rem; color: #edbb00; letter-spacing: 2px; }
        .transcription-terminal { margin-top: 30px; width: 100%; max-width: 500px; text-align: left; }
        .terminal-label { color: #edbb00; font-size: 0.7rem; letter-spacing: 2px; font-weight: bold; }
        .terminal-text { margin-top: 8px; background: rgba(0, 0, 0, 0.6); padding: 15px; border-left: 4px solid #004d98; border-right: 4px solid #a50044; font-family: 'Courier New', monospace; color: white; min-height: 50px; overflow: hidden; }
        .cyber-button { background: transparent; color: #edbb00; border: 1px solid #edbb00; padding: 12px 24px; font-family: monospace; letter-spacing: 3px; cursor: pointer; transition: 0.3s; margin-top: 20px;}
        .cyber-button:hover { background: #004d98; color: white; box-shadow: 0 0 20px #004d98; }
      `}</style>
    </div>
  );
};

export default AudioVisualizer;