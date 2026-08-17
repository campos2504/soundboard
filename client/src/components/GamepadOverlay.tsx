import React from 'react';
import { VisualizerCanvas } from './VisualizerCanvas';
import { Activity, Radio, Headphones } from 'lucide-react';

export const GamepadOverlay: React.FC = () => {
  return (
    <footer className="streamdeck-bottom-dock">
      <div className="dock-status-group">
        <div className="dock-status-badge" style={{ color: '#00e5ff' }}>
          <Radio size={14} />
          <span>Saída 1: Transmissão / Live</span>
        </div>

        <div className="dock-status-badge" style={{ color: '#ffaa33' }}>
          <Headphones size={14} />
          <span>Saída 2: Pílula de Teste (Monitor / Fones)</span>
        </div>

        <div className="dock-status-badge" style={{ opacity: 0.8 }}>
          <Activity size={14} />
          <span>Stream Deck Audio Engine: Ativo</span>
        </div>
      </div>

      <VisualizerCanvas />
    </footer>
  );
};
