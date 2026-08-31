import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Headphones, Square, SlidersHorizontal, Tv, Palette, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { AudioEngine } from '../services/AudioEngine';
import type { AudioRoutingConfig } from '../types';

interface HeaderBarProps {
  onOpenAudioRouting: () => void;
  onOpenObsOverlay?: () => void;
  onOpenThemeSelector?: () => void;
  onSyncLibrary?: () => void;
  config: AudioRoutingConfig;
  onConfigChange: (newConfig: Partial<AudioRoutingConfig>) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onOpenAudioRouting,
  onOpenObsOverlay,
  onOpenThemeSelector,
  onSyncLibrary,
  config,
  onConfigChange,
}) => {
  const [time, setTime] = useState<string>('');
  const [isTestingPill, setIsTestingPill] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    // Detect if running in PWA standalone or Chrome extension
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleOpenNewWindow = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    } else {
      window.open(window.location.origin + window.location.pathname, '_blank', 'width=1280,height=800');
    }
  };

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
        {/* Left Rack Hex Screw */}
        <div className="rack-screw-wash" title="19-Inch Rack Mount Flange Bolt">
          <div className="rack-hex-screw" />
        </div>

        <img
          src="/icons/icon-48.png"
          alt="90s Soundwave Arcade"
          className="deck-logo-90s-img"
        />
        <div className="deck-title-group">
          <h1>ARCADE SOUNDWAVE 90s</h1>
          <p>Chrome App & Stereo Soundboard • MyInstants & SoundButtonsWorld</p>
        </div>
      </div>

      <div className="header-controls">
        {/* PWA Install Button when available */}
        {deferredPrompt && !isStandalone && (
          <button
            className="audio-status-btn"
            onClick={handleInstallClick}
            title="Instalar Soundboard como App do Chrome no Computador"
            style={{ borderColor: 'rgba(0, 229, 255, 0.6)', backgroundColor: 'rgba(0, 229, 255, 0.12)' }}
          >
            <Download size={14} color="var(--neon-cyan)" />
            <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold' }}>Instalar App</span>
          </button>
        )}

        {/* Open in full tab / window button */}
        <button
          className="audio-status-btn"
          onClick={handleOpenNewWindow}
          title="Abrir em Nova Aba ou Janela Expandida"
          style={{ borderColor: 'rgba(255, 0, 128, 0.3)' }}
        >
          <ExternalLink size={13} color="var(--neon-pink)" />
          <span>Expandir</span>
        </button>

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

        {/* OBS Overlay / Mini HUD Button */}
        {onOpenObsOverlay && (
          <button
            className="audio-status-btn"
            onClick={onOpenObsOverlay}
            title="Abrir Mini HUD Flutuante ou Copiar Link para OBS Studio"
            style={{ borderColor: 'rgba(255, 0, 128, 0.4)' }}
          >
            <Tv size={14} color="var(--neon-pink)" />
            <span>OBS / Mini HUD</span>
          </button>
        )}

        {/* Global Lighting Theme Selector */}
        {onOpenThemeSelector && (
          <button
            className="audio-status-btn"
            onClick={onOpenThemeSelector}
            title="Mudar Tema de Iluminação Global da Soundboard"
            style={{ borderColor: 'rgba(255, 230, 0, 0.4)' }}
          >
            <Palette size={14} color="var(--neon-yellow)" />
            <span>Temas</span>
          </button>
        )}

        {/* Sync / Reset Library Defaults */}
        {onSyncLibrary && (
          <button
            className="audio-status-btn"
            onClick={onSyncLibrary}
            title="Sincronizar Sons e Atualizar Biblioteca com o Banco de Dados mais recente"
            style={{ borderColor: 'rgba(0, 255, 170, 0.4)' }}
          >
            <RefreshCw size={13} color="#00ffaa" />
            <span>Sincronizar</span>
          </button>
        )}

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

        {/* Right Rack Hex Screw */}
        <div className="rack-screw-wash" title="19-Inch Rack Mount Flange Bolt">
          <div className="rack-hex-screw" />
        </div>
      </div>
    </header>
  );
};
