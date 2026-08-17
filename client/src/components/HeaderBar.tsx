import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Headphones, Square, SlidersHorizontal, Layers } from 'lucide-react';
import { AudioEngine } from '../services/AudioEngine';
import type { AudioRoutingConfig } from '../types';

interface HeaderBarProps {
  onOpenAudioRouting: () => void;
  config: AudioRoutingConfig;
  onConfigChange: (newConfig: Partial<AudioRoutingConfig>) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onOpenAudioRouting,
  config,
  onConfigChange,
}) => {
  const [time, setTime] = useState<string>('');
  const [isTestingPill, setIsTestingPill] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleQuickTest = async () => {
    setIsTestingPill(true);
    // Play test tone on secondary device
    await AudioEngine.playTestTone(config.secondaryDeviceId, true);
    setTimeout(() => setIsTestingPill(false), 700);
  };

  const handleStopAll = () => {
    AudioEngine.stopAll();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onConfigChange({ masterVolume: val });
    AudioEngine.saveConfig({ masterVolume: val });
  };

  return (
    <header className="streamdeck-header">
      <div className="brand-section">
        <div className="streamdeck-key-logo">
          <Layers size={24} />
        </div>
        <div className="deck-title-group">
          <h1>
            STREAM DECK SOUNDBOARD
            <span className="streamdeck-badge">STUDIO</span>
          </h1>
          <p>Multi-Output Soundboard Hub • MyInstants & SoundButtonsWorld</p>
        </div>
      </div>

      <div className="header-controls">
        {/* THE QUICK TEST PILL IN HEADER */}
        <button
          className={`quick-test-pill ${isTestingPill ? 'active' : ''}`}
          onClick={handleQuickTest}
          title={`Testar saída secundária (${config.secondaryDeviceLabel})`}
        >
          <Headphones size={15} />
          <span>Pílula de Teste (Fones)</span>
        </button>

        {/* Audio Output Router Button */}
        <button
          className="audio-status-btn"
          onClick={onOpenAudioRouting}
          title="Configurar Roteamento de Saída de Áudio"
        >
          <div className="device-dot" />
          <SlidersHorizontal size={14} />
          <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {config.primaryDeviceId === 'default' ? 'Saída: Padrão' : config.primaryDeviceLabel}
          </span>
        </button>

        {/* Master Stream Volume */}
        <div className="volume-control-group">
          {config.masterVolume === 0 ? <VolumeX size={15} color="#ff334b" /> : <Volume2 size={15} color="#00e5ff" />}
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config.masterVolume}
            onChange={handleVolumeChange}
            className="volume-slider"
            title={`Volume Master: ${Math.round(config.masterVolume * 100)}%`}
          />
        </div>

        {/* Emergency Stop All Sounds */}
        <button
          className="panic-stop-btn"
          onClick={handleStopAll}
          title="Parar todos os sons tocando imediatamente (Esc / Tecla B)"
        >
          <Square size={14} fill="#ff334b" />
          <span>PARAR TUDO (Esc)</span>
        </button>

        {/* Studio Time */}
        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-secondary)', paddingLeft: '0.5rem', fontFamily: 'var(--font-mono)' }}>
          {time}
        </div>
      </div>
    </header>
  );
};
