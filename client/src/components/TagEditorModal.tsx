import React, { useState, useEffect } from 'react';
import { X, Tag as TagIcon, Keyboard, Palette, Volume2, Gauge, Check } from 'lucide-react';
import type { SoundItem } from '../types';
import { TagInputSelector } from './TagInputSelector';

interface TagEditorModalProps {
  isOpen: boolean;
  sound: SoundItem | null;
  availableTags?: Array<string | { name: string; count?: number }>;
  onClose: () => void;
  onSave: (id: string, updates: Partial<SoundItem>) => void;
}

const STEAM_DECK_COLORS = [
  { label: 'Ciano SteamOS', hex: '#1a9fff' },
  { label: 'Laranja Deck', hex: '#ff7700' },
  { label: 'Roxo Elétrico', hex: '#9d4edd' },
  { label: 'Verde Neon', hex: '#10b981' },
  { label: 'Vermelho Alerta', hex: '#ef4444' },
  { label: 'Amarelo Gold', hex: '#f59e0b' },
  { label: 'Rosa Magenta', hex: '#ec4899' },
  { label: 'Cinza Metálico', hex: '#64748b' },
];

export const TagEditorModal: React.FC<TagEditorModalProps> = ({
  isOpen,
  sound,
  availableTags = [],
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [color, setColor] = useState('#1a9fff');
  const [hotkey, setHotkey] = useState('');
  const [isRecordingHotkey, setIsRecordingHotkey] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    if (sound) {
      setTitle(sound.title || '');
      setTags(sound.tags || []);
      setColor(sound.color || '#1a9fff');
      setHotkey(sound.hotkey || '');
      setVolume(sound.volume !== undefined ? sound.volume : 1);
      setPlaybackRate(sound.playbackRate !== undefined ? sound.playbackRate : 1);
      setIsRecordingHotkey(false);
    }
  }, [sound]);

  useEffect(() => {
    if (!isRecordingHotkey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setIsRecordingHotkey(false);
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        setHotkey('');
        setIsRecordingHotkey(false);
        return;
      }

      let keyStr = e.key.toUpperCase();
      if (keyStr === ' ') keyStr = 'SPACE';
      setHotkey(keyStr);
      setIsRecordingHotkey(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecordingHotkey]);

  if (!isOpen || !sound) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(sound.id, {
      title: title.trim() || sound.title,
      tags,
      color,
      hotkey: hotkey.trim() || undefined,
      volume,
      playbackRate,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-deck" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-deck">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <TagIcon size={20} color="var(--deck-cyan)" />
            <h2>Editar Som & Tags</h2>
          </div>
          <button className="icon-btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group-deck">
            <label>Nome do Som</label>
            <input
              type="text"
              className="input-deck"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título do som..."
              required
            />
          </div>

          {/* Interactive Tag Selector with Existing and New Tags */}
          <TagInputSelector
            selectedTags={tags}
            onChange={setTags}
            availableTags={availableTags}
          />

          {/* Color Selector */}
          <div className="form-group-deck">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Palette size={14} />
              Cor do Cartão Steam Deck
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {STEAM_DECK_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: c.hex,
                    border: color === c.hex ? '3px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                    boxShadow: color === c.hex ? `0 0 12px ${c.hex}` : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={c.label}
                >
                  {color === c.hex && <Check size={16} color="#ffffff" />}
                </button>
              ))}
            </div>
          </div>

          {/* Hotkey Binding */}
          <div className="form-group-deck">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Keyboard size={14} />
              Atalho de Teclado
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className={`btn-steamdeck ${isRecordingHotkey ? 'btn-steamdeck-amber' : 'btn-steamdeck-secondary'}`}
                style={{ minWidth: '160px', justifyContent: 'center' }}
                onClick={() => setIsRecordingHotkey(true)}
              >
                {isRecordingHotkey ? 'Pressione qualquer tecla...' : hotkey ? `Tecla: [ ${hotkey} ]` : 'Definir Atalho'}
              </button>
              {hotkey && (
                <button
                  type="button"
                  className="icon-btn-ghost"
                  onClick={() => setHotkey('')}
                  title="Remover atalho"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Pressione esta tecla no teclado a qualquer momento para tocar o som (ou Shift + Tecla para ouvir no fone).
            </p>
          </div>

          {/* Volume & Pitch Shifter */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div className="form-group-deck">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Volume2 size={14} />
                Volume ({Math.round(volume * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="volume-slider"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group-deck">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Gauge size={14} />
                Velocidade / Pitch ({playbackRate}x)
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                className="volume-slider"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn-steamdeck btn-steamdeck-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-steamdeck btn-steamdeck-primary">
              <Check size={16} />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
