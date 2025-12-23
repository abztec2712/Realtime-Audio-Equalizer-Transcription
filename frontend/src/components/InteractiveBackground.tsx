import React, { useEffect, useRef } from 'react';

interface Props {
  audioData?: Uint8Array;
}

const InteractiveBackground: React.FC<Props> = ({ audioData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    // Create static positions for background "Tactical Orbs"
    const orbs = [
      { x: 0.15, y: 0.2, color: '#004d98', size: 100 }, // Top Left Blue
      { x: 0.85, y: 0.8, color: '#a50044', size: 120 }, // Bottom Right Garnet
      { x: 0.8, y: 0.15, color: '#edbb00', size: 60 },  // Top Right Gold
    ];

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate average volume from audioData
      const avgVolume = audioData 
        ? audioData.reduce((a, b) => a + b) / audioData.length 
        : 0;

      orbs.forEach(orb => {
        const pulse = (avgVolume / 255) * 150; // Orbs grow based on sound
        const xPos = orb.x * canvas.width;
        const yPos = orb.y * canvas.height;

        const gradient = ctx.createRadialGradient(
          xPos, yPos, 0, 
          xPos, yPos, orb.size + pulse
        );
        
        gradient.addColorStop(0, orb.color + '44'); // 44 is transparency
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(xPos, yPos, orb.size + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Add small tech-circles around orbs
        ctx.strokeStyle = orb.color + '22';
        ctx.beginPath();
        ctx.arc(xPos, yPos, (orb.size + pulse) * 1.2, 0, Math.PI * 2);
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