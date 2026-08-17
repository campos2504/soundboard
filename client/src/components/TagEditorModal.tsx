import React, { useState, useEffect } from 'react';
import { X, Tag as TagIcon, Keyboard, Palette, Volume2, Gauge, Check, Plus } from 'lucide-react';
import type { SoundItem } from '../types';

interface TagEditorModalProps {
  isOpen: boolean;
  sound: SoundItem | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<SoundItem>) => void;
}

const STREAM_DECK_COLORS = [
  { label: 'Azul Stream', hex: '#0099ff' },
  { label: 'Ciano Elétrico', hex: '#00e5ff' },
  { label: 'Laranja Monitor', hex: '#ff8800' },
  { label: 'Verde Neon', hex: '#00e676' },
  { label: 'Roxo Streamer', hex: '#a855f7' },
  { label: 'Vermelho Alerta', hex: '#ff334b' },
  { label: 'Amarelo Gold', hex: '#f59e0b' },
  { label: 'Grafite Fosco', hex: '#334155' },
];

const SUGGESTED_POPULAR_TAGS = [
  'meme',
  'gaming',
  'anime',
  'brasil',
  'grito',
  'risada',
  'sfx',
  'loud',
  'musica',
  'troll',
  'reacao',
  'tv',
];

export const TagEditorModal: React.FC<TagEditorModalProps> = ({
  isOpen,
  sound,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
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
      setNewTagInput('');
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

  const handleAddTag = () => {
    const clean = newTagInput.trim().toLowerCase().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleToggleSuggested = (sTag: string) => {
    if (tags.includes(sTag)) {
      setTags(tags.filter((t) => t !== sTag));
    } else {
      setTags([...tags, sTag]);
    }
  };

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
      <div className="modal-content-deck" onClick={(e) => e.stopPropagation()}>
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

          {/* Tags */}
          <div className="form-group-deck">
            <label>Tags do Som (para busca e filtros)</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                className="input-deck"
                placeholder="Digitar nova tag e pressionar Enter..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <button
                type="button"
                className="btn-steamdeck btn-steamdeck-secondary"
                onClick={handleAddTag}
              >
                <Plus size={15} />
                <span>Adicionar</span>
              </button>
            </div>

            {/* Current Tags Chips */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', minHeight: '30px', marginBottom: '0.6rem' }}>
              {tags.map((t) => (
                <span
                  key={t}
                  className="tag-pill active"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  #{t}
                  <X
                    size={12}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleRemoveTag(t)}
                  />
                </span>
              ))}
            </div>

            {/* Popular Suggested Tags */}
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Sugestões rápidas:
              </span>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {SUGGESTED_POPULAR_TAGS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`tag-pill ${tags.includes(st) ? 'active' : ''}`}
                    onClick={() => handleToggleSuggested(st)}
                  >
                    #{st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Steam Deck Color */}
          <div className="form-group-deck">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Palette size={14} />
              Cor do Botão Stream Deck
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {STREAM_DECK_COLORS.map((c) => (
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
              Pressione esta tecla no teclado a qualquer momento para tocar o som instantaneamente.
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
