import React, { useEffect, useRef } from 'react';

interface Props {
  audioData?: Uint8Array;
  isHovered: boolean;
}

const InteractiveBackground: React.FC<Props> = ({ audioData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      ctx.fillStyle = '#050507';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const avgVolume = audioData 
        ? audioData.reduce((a, b) => a + b) / audioData.length 
        : 0;

      phase += 0.008; // Rhythmic speed
      
      // Heartbeat pulse calculation for waves
      const heartbeat = Math.pow(Math.sin(phase * 2), 10) * 40; 
      const intensity = 1 + (avgVolume / 255) * 2;

      const waves = [
        { color: '#004d98', amp: 40 + heartbeat, freq: 0.002, speed: 1 },
        { color: '#a50044', amp: 25 + heartbeat, freq: 0.003, speed: -0.8 },
        { color: '#edbb00', amp: 12 + heartbeat, freq: 0.005, speed: 0.5 }
      ];

      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = wave.color;
        ctx.globalAlpha = 0.12;

        for (let x = 0; x < canvas.width; x += 4) {
          const y = (canvas.height * 0.5) + 
                    Math.sin(x * wave.freq + (phase * wave.speed)) * (wave.amp * intensity);
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [audioData]);

  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -1 }} />;
};

export default InteractiveBackground;