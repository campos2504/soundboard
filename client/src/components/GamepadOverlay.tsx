import React, { useState } from 'react';
import { VisualizerCanvas } from './VisualizerCanvas';
import { AnalogVuMeter } from './AnalogVuMeter';
import { Radio, Headphones, Zap, Gauge, BarChart2 } from 'lucide-react';

export const GamepadOverlay: React.FC = () => {
  const [vuMode, setVuMode] = useState<'analog' | 'digital'>(() => {
    return (localStorage.getItem('soundboard_vu_mode') as 'analog' | 'digital') || 'analog';
  });

  const toggleVuMode = () => {
    const next = vuMode === 'analog' ? 'digital' : 'analog';
    setVuMode(next);
    localStorage.setItem('soundboard_vu_mode', next);
  };

  return (
    <footer className="deck-bottom-dock">
      {/* Left Rack Hex Screw */}
      <div className="rack-screw-wash" title="19-Inch Lower Rack Mount Flange Bolt">
        <div className="rack-hex-screw" />
      </div>

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
          <span>SHIFT + TECLA = TESTE FONES</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Toggle Mode Button */}
        <button
          type="button"
          onClick={toggleVuMode}
          className="btn-steamdeck btn-steamdeck-secondary"
          style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', height: '28px' }}
          title="Alternar entre VU Analógico de Agulhas e Barras de Espectro Digital"
        >
          {vuMode === 'analog' ? <Gauge size={13} color="var(--neon-yellow)" /> : <BarChart2 size={13} color="var(--neon-cyan)" />}
          <span>{vuMode === 'analog' ? 'VU Agulhas' : 'Espectro'}</span>
        </button>

        {vuMode === 'analog' ? (
          <AnalogVuMeter compact={true} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.85rem', color: 'var(--neon-green)' }}>
              SPECTRUM
            </span>
            <VisualizerCanvas />
          </div>
        )}

        {/* Right Rack Hex Screw */}
        <div className="rack-screw-wash" title="19-Inch Lower Rack Mount Flange Bolt">
          <div className="rack-hex-screw" />
        </div>
      </div>
    </footer>
  );
};
