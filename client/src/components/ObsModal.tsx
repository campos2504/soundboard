import React, { useState } from 'react';
import { X, Tv, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';

interface ObsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ObsModal: React.FC<ObsModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const overlayUrl = `${window.location.origin}/?overlay=true`;

  const handleCopy = () => {
    navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenMiniPlayer = () => {
    window.open(
      overlayUrl,
      'K7MiniPlayerHUD',
      'width=440,height=220,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-deck" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-deck">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Tv size={22} color="var(--neon-cyan)" />
            <h2>Modo OBS Overlay & Mini Player HUD</h2>
          </div>
          <button className="icon-btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1rem 0' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            Exiba a fita K7 animada e o equalizador em tempo real na tela da sua Live no <strong>OBS Studio / Streamlabs</strong> ou use como um <strong>Mini Player Flutuante</strong> por cima de jogos e Discord!
          </p>

          {/* Option 1: Floating Mini Player */}
          <div
            style={{
              background: 'rgba(0, 240, 255, 0.08)',
              border: '1px solid var(--neon-cyan)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '0.95rem', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={15} color="var(--neon-cyan)" />
                  Mini Player Flutuante (Picture-in-Picture)
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Abre uma janelinha compacta e minimalista na sua tela.
                </p>
              </div>
              <button
                type="button"
                className="btn-steamdeck btn-steamdeck-primary"
                onClick={handleOpenMiniPlayer}
              >
                <ExternalLink size={14} />
                <span>Abrir Mini HUD</span>
              </button>
            </div>
          </div>

          {/* Option 2: OBS Studio Browser Source */}
          <div
            style={{
              background: 'rgba(255, 0, 128, 0.08)',
              border: '1px solid rgba(255, 0, 128, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
            }}
          >
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tv size={15} color="var(--neon-pink)" />
              Overlay Transparente para OBS Studio
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              No OBS: <em>Adicionar Fonte ➔ Navegador ➔ Cole o link abaixo com fundo transparente</em>.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                readOnly
                value={overlayUrl}
                style={{
                  flex: 1,
                  background: '#0d0a1c',
                  border: '1px solid rgba(255, 0, 128, 0.3)',
                  borderRadius: '6px',
                  color: 'var(--neon-cyan)',
                  padding: '0.5rem 0.75rem',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                className="btn-steamdeck btn-steamdeck-secondary"
                onClick={handleCopy}
              >
                {copied ? <Check size={14} color="#00ff88" /> : <Copy size={14} />}
                <span>{copied ? 'Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button type="button" className="btn-steamdeck btn-steamdeck-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
