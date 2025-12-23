import React, { useEffect, useRef } from 'react';

const BackgroundWaves: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      offset += 0.005;

      // Draw 3 layers of waves with different speeds and opacities
      const waves = [
        { amplitude: 60, frequency: 0.01, speed: 1, opacity: 0.1, color: '#004d98' }, // FCB Blue
        { amplitude: 40, frequency: 0.015, speed: 1.2, opacity: 0.1, color: '#a50044' }, // FCB Garnet
        { amplitude: 80, frequency: 0.005, speed: 0.5, opacity: 0.05, color: '#edbb00' } // FCB Gold
      ];

      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = wave.color;
        ctx.globalAlpha = wave.opacity;

        for (let x = 0; x < canvas.width; x++) {
          const y = canvas.height / 2 + 
                    Math.sin(x * wave.frequency + offset * wave.speed) * wave.amplitude +
                    Math.sin(x * 0.002 + offset) * 20; // Extra variation
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1, // Keep it behind everything
        pointerEvents: 'none',
      }}
    />
  );
};

export default BackgroundWaves;