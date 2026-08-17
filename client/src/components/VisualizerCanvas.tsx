import React, { useRef, useEffect } from 'react';
import { AudioEngine } from '../services/AudioEngine';

export const VisualizerCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const data = AudioEngine.getFrequencyData();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 20;
      const barWidth = 3;
      const barSpacing = 2;
      const startX = 0;

      for (let i = 0; i < barCount; i++) {
        // Sample frequency data
        const index = Math.floor((i / barCount) * data.length);
        const value = data[index] || 0;
        const normalized = value / 255;
        const barHeight = Math.max(3, normalized * canvas.height);
        const y = canvas.height - barHeight;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#00ff88');
        gradient.addColorStop(0.5, '#ffe600');
        gradient.addColorStop(0.85, '#ff007f');
        gradient.addColorStop(1, '#00f0ff');

        ctx.fillStyle = gradient;
        ctx.fillRect(startX + i * (barWidth + barSpacing), y, barWidth, barHeight);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="visualizer-canvas-container" title="Visualizador de Espectro de Áudio SteamOS">
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
        SPECTRUM:
      </span>
      <canvas
        ref={canvasRef}
        width={100}
        height={22}
        className="visualizer-canvas"
      />
    </div>
  );
};
