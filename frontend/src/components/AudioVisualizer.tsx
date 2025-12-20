// src/components/AudioVisualizer.tsx

import React, { useRef, useEffect, useState, useCallback } from 'react';

// --- Type Definitions for Props and State ---

interface VisualizerProps {
  canvasWidth: number;
  canvasHeight: number;
  websocketUrl: string; // URL for the Spring Boot WebSocket endpoint (e.g., 'ws://localhost:8080/ws/transcribe')
}

// --- Audio Visualizer Component ---

const AudioVisualizer: React.FC<VisualizerProps> = ({ canvasWidth, canvasHeight, websocketUrl }) => {
  // --- Refs for DOM and Web Audio API Elements ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const processorNodeRef = useRef<ScriptProcessorNode>(); // Used for chunking audio data
  const frequencyDataRef = useRef<Uint8Array>(); // Array to hold the current frequency magnitudes
  const websocketRef = useRef<WebSocket>();

  // --- State for UI Updates ---
  const [isReady, setIsReady] = useState(false);
  const [transcription, setTranscription] = useState('Waiting for connection...');

  // --- Visualization Constants ---
  const baseRadius = 50;
  const numBars = 60;
  const barWidth = 3;

  // --- UTILITY FUNCTIONS ---

  /**
   * Converts Float32 audio data (standard output from Web Audio API)
   * to 16-bit PCM binary format, suitable for most real-time speech APIs.
   * @param input - The Float32Array channel data.
   * @returns A DataView containing 16-bit PCM binary data.
   */
  const floatTo16BitPCM = (input: Float32Array): DataView => {
    const output = new DataView(new ArrayBuffer(input.length * 2)); // 2 bytes per sample (16-bit)
    let offset = 0;
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      // Convert to 16-bit signed integer (range -32768 to 32767)
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return output;
  };

  // --- WEBSOCKET STREAMING LOGIC ---

  const initWebSocket = useCallback(() => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) return;

    // 1. Establish WebSocket connection
    const ws = new WebSocket(websocketUrl);
    websocketRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket Connected to transcription backend.');
      setTranscription('Connected. Speak now to start transcription...');
    };

    // 2. Handle incoming transcription chunks (Streamed from Server)
    ws.onmessage = (event) => {
      // Backend (Spring Boot) sends text transcription updates
      const partialTranscript = event.data;
      setTranscription(partialTranscript);
    };

    ws.onclose = (event) => {
      console.log('WebSocket Disconnected:', event.code, event.reason);
      setTranscription('Connection lost. Please restart.');
      // Optionally stop audio processing here
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setTranscription('Connection error. Check console for details.');
    };
  }, [websocketUrl]);

  // --- WEB AUDIO API & VISUALIZER LOGIC ---

  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const frequencyData = frequencyDataRef.current;

    if (!canvas || !analyser || !frequencyData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Smooth Animation at 60 FPS
    animationRef.current = requestAnimationFrame(drawVisualizer);

    // 2. Analyze frequency data
    analyser.getByteFrequencyData(frequencyData);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const angleStep = (2 * Math.PI) / numBars;
    const stepSize = Math.floor(frequencyData.length / numBars);

    // Clear the canvas for the new frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 3. Render a circular frequency visualizer
    for (let i = 0; i < numBars; i++) {
      const dataIndex = Math.floor(i * stepSize);
      // Magnitude (0-255) reacts instantly to volume/frequency changes
      const magnitude = frequencyData[dataIndex] || 0;
      const barHeight = (magnitude / 255) * 100;
      const angle = i * angleStep;

      // Define points for the bar: Start (base circle) and End (extended by height)
      const startX = centerX + baseRadius * Math.cos(angle);
      const startY = centerY + baseRadius * Math.sin(angle);
      const endX = centerX + (baseRadius + barHeight) * Math.cos(angle);
      const endY = centerY + (baseRadius + barHeight) * Math.sin(angle);

      // Drawing the bar
      ctx.beginPath();
      ctx.lineWidth = barWidth;
      // Dynamic color for visual appeal
      const hue = 250 + (magnitude * 0.5);
      ctx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  };

  const initAudioAndStream = async () => {
    if (audioContextRef.current) return;

    try {
      // 1. Access microphone using MediaStream API
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;

      const mediaStreamSource = context.createMediaStreamSource(stream);

      // 2. Setup ScriptProcessorNode for Audio Chunking
      const bufferSize = 4096;
      // NOTE: ScriptProcessorNode is deprecated; AudioWorklet is preferred in modern code
      const processor = context.createScriptProcessor(bufferSize, 1, 1);

      processor.onaudioprocess = (e) => {
        const inputBuffer = e.inputBuffer.getChannelData(0);
        const pcm16 = floatTo16BitPCM(inputBuffer);

        // 3. Send audio chunk to backend immediately
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
          websocketRef.current.send(pcm16.buffer);
        }
      };

      // Connect the graph: Microphone -> Analyser -> Processor -> Destination
      mediaStreamSource.connect(analyser);
      mediaStreamSource.connect(processor);
      processor.connect(context.destination);

      // Store references
      audioContextRef.current = context;
      analyserRef.current = analyser;
      processorNodeRef.current = processor;
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);

      // Start the visualization and streaming
      initWebSocket();
      drawVisualizer();
      setIsReady(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setTranscription(`Error: Could not access microphone. ${err instanceof Error ? err.name : 'Unknown Error'}`);
    }
  };

  // --- EFFECTS & CLEANUP ---

  useEffect(() => {
    // Cleanup function to stop animation loop and close WebSocket on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // --- RENDER ---

  return (
    <div>
      {/* Visualizer Canvas */}
      <canvas 
        ref={canvasRef} 
        width={canvasWidth} 
        height={canvasHeight}
        style={{ border: '1px solid #ccc', display: 'block', margin: '0 auto' }}
      />

      {/* Control Button */}
      {!isReady && (
        <button onClick={initAudioAndStream} style={{ display: 'block', margin: '20px auto' }}>
          Start Microphone, Visualizer, & Stream
        </button>
      )}

      {isReady && (
        <p style={{ textAlign: 'center', color: 'green' }}>
          Visualizer Active. Streaming audio chunks...
        </p>
      )}

      {/* Transcription Output */}
      <div style={{ margin: '20px auto', maxWidth: '600px', padding: '10px' }}>
        <h3>Real-Time Transcription:</h3>
        <p style={{ 
          background: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '5px',
          minHeight: '100px'
        }}>
          {transcription}
        </p>
      </div>
    </div>
  );
};

export default AudioVisualizer;
