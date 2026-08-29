import React from 'react';
import { X, Share2 } from 'lucide-react';
import { CassettePlayerCard } from './CassettePlayerCard';
import type { SoundItem } from '../types';

interface ShareSoundModalProps {
  sound: SoundItem;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareSoundModal: React.FC<ShareSoundModalProps> = ({ sound, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content k7-modal-wrapper"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '92vw', padding: '1.25rem' }}
      >
        <div className="modal-header" style={{ marginBottom: '1rem' }}>
          <div className="modal-title-group">
            <div className="deck-screw-pill" />
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--neon-cyan)' }}>
              <Share2 size={18} color="var(--neon-cyan)" />
              Card K7 de Compartilhamento
            </h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Fechar (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* The Animated Cassette Card */}
        <CassettePlayerCard
          sound={sound}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
