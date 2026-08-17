import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Headphones, Square, SlidersHorizontal } from 'lucide-react';
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
    <header className="steamdeck-header">
      <div className="brand-section">
        <img
          src="/assets/logo-90s.jpg"
          alt="90s Soundwave Arcade"
          className="deck-logo-90s-img"
        />
        <div className="deck-title-group">
          <h1>
            ARCADE SOUNDWAVE 90s
            <span className="deck-badge-edition">PRO EDITION</span>
          </h1>
          <p>★ Stereo Soundboard Anos 90 • MyInstants & SoundButtonsWorld ★</p>
        </div>
      </div>

      <div className="header-controls">
        {/* THE 90s QUICK TEST PILL IN HEADER */}
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
          <SlidersHorizontal size={14} color="var(--neon-cyan)" />
          <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {config.primaryDeviceId === 'default' ? 'Saída: Padrão' : config.primaryDeviceLabel}
          </span>
        </button>

        {/* Master Volume */}
        <div className="volume-control-group">
          {config.masterVolume === 0 ? <VolumeX size={15} color="var(--neon-pink)" /> : <Volume2 size={15} color="var(--neon-cyan)" />}
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
          title="Parar todos os sons tocando imediatamente (Esc)"
        >
          <Square size={13} fill="#ffffff" />
          <span>PARAR (Esc)</span>
        </button>

        {/* 90s Digital Clock */}
        <div style={{ fontSize: '1.25rem', color: 'var(--neon-yellow)', paddingLeft: '0.4rem', fontFamily: 'var(--font-pixel)', letterSpacing: '1px' }}>
          {time}
        </div>
      </div>
    </header>
  );
};
