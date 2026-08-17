import React from 'react';
import { VisualizerCanvas } from './VisualizerCanvas';
import { Radio, Headphones, Zap } from 'lucide-react';

export const GamepadOverlay: React.FC = () => {
  return (
    <footer className="deck-bottom-dock">
      <div className="dock-status-group">
        <div className="dock-status-badge" style={{ color: 'var(--neon-cyan)', textShadow: '0 0 8px var(--neon-cyan-glow)' }}>
          <Radio size={15} />
          <span>CH-1: TRANSMISSÃO (LIVE)</span>
        </div>

        <div className="dock-status-badge" style={{ color: 'var(--neon-pink)', textShadow: '0 0 8px var(--neon-pink-glow)' }}>
          <Headphones size={15} />
          <span>CH-2: TESTE (FONES)</span>
        </div>

        <div className="dock-status-badge" style={{ color: 'var(--neon-yellow)' }}>
          <Zap size={14} />
          <span>SHIFT + NÚMERO = PREVIEW</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.95rem', color: 'var(--neon-green)' }}>
          STEREO VU
        </span>
        <VisualizerCanvas />
      </div>
    </footer>
  );
};
