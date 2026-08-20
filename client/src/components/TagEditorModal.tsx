import React, { useState, useEffect } from 'react';
import { X, Sliders, Keyboard, Palette, Volume2, Gauge, Check, Play, Square, Headphones, Upload, Trash2, Folder } from 'lucide-react';
import type { SoundItem } from '../types';
import { TagInputSelector } from './TagInputSelector';
import { WaveformTrimmer } from './WaveformTrimmer';
import { uploadAudioFile } from '../services/api';
import { AudioEngine } from '../services/AudioEngine';
import { normalizeCapturedKey } from './HotkeysTab';

interface TagEditorModalProps {
  isOpen: boolean;
  sound: SoundItem | null;
  availableTags?: Array<string | { name: string; count?: number }>;
  availableSoundboardTabs?: string[];
  onClose: () => void;
  onSave: (id: string, updates: Partial<SoundItem>) => void;
  onDelete?: (id: string) => void;
}

const STEAM_DECK_COLORS = [
  { label: 'Ciano 90s', hex: '#00f0ff' },
  { label: 'Magenta Pink', hex: '#ff007f' },
  { label: 'Amarelo Acid', hex: '#ffe600' },
  { label: 'Roxo Vapor', hex: '#a855f7' },
  { label: 'Verde Neon', hex: '#00ff88' },
  { label: 'Laranja Arcade', hex: '#ff6600' },
  { label: 'Azul Elétrico', hex: '#1a9fff' },
  { label: 'Grafite Fosco', hex: '#475569' },
];

export const TagEditorModal: React.FC<TagEditorModalProps> = ({
  isOpen,
  sound,
  availableTags = [],
  availableSoundboardTabs = ['Geral'],
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [tab, setTab] = useState('Geral');
  const [tags, setTags] = useState<string[]>([]);
  const [color, setColor] = useState('#00f0ff');
  const [hotkey, setHotkey] = useState('');
  const [isRecordingHotkey, setIsRecordingHotkey] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number | undefined>(undefined);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isTestingPreview, setIsTestingPreview] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (sound) {
      setTitle(sound.title || '');
      setUrl(sound.url || '');
      setTab(sound.tab || 'Geral');
      setTags(sound.tags || []);
      setColor(sound.color || '#00f0ff');
      setHotkey(sound.hotkey || '');
      setVolume(sound.volume !== undefined ? sound.volume : 1);
      setPlaybackRate(sound.playbackRate !== undefined ? sound.playbackRate : 1);
      setStartTime(sound.startTime !== undefined ? sound.startTime : 0);
      setEndTime(sound.endTime);
      setIsRecordingHotkey(false);
      setIsPlayingPreview(false);
      setIsTestingPreview(false);
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

      const normalized = normalizeCapturedKey(e);
      if (normalized) {
        setHotkey(normalized);
        setIsRecordingHotkey(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecordingHotkey]);

  if (!isOpen || !sound) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingFile(true);
      try {
        const uploaded = await uploadAudioFile(file);
        setUrl(uploaded.url);
      } catch (err: any) {
        alert('Erro ao enviar novo arquivo de áudio: ' + err.message);
      } finally {
        setUploadingFile(false);
      }
    }
  };

  const handleTogglePlayPreview = () => {
    if (isPlayingPreview) {
      AudioEngine.stopAllNonTest();
      setIsPlayingPreview(false);
    } else {
      setIsPlayingPreview(true);
      setIsTestingPreview(false);
      AudioEngine.play(
        { id: 'edit_preview', url, volume, playbackRate, title },
        false
      );
    }
  };

  const handleToggleTestPreview = () => {
    if (isTestingPreview) {
      AudioEngine.stopAllTest();
      setIsTestingPreview(false);
    } else {
      setIsTestingPreview(true);
      setIsPlayingPreview(false);
      AudioEngine.play(
        { id: 'edit_preview', url, volume, playbackRate, title },
        true
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(sound.id, {
      title: title.trim() || sound.title,
      url: url.trim() || sound.url,
      tab: tab.trim() || 'Geral',
      tags,
      color,
      hotkey: hotkey.trim() || undefined,
      volume,
      playbackRate,
      startTime,
      endTime,
    });
    onClose();
  };

  const handleDeleteSound = () => {
    if (confirm(`Tem certeza que deseja excluir "${sound.title}" da soundboard?`)) {
      if (onDelete) onDelete(sound.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-deck" style={{ maxWidth: '660px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-deck">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sliders size={22} color="var(--neon-cyan)" />
            <h2>Editar Som da Soundboard</h2>
          </div>
          <button className="icon-btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Quick Sound Testing Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 0, 128, 0.08)',
              border: '1px solid rgba(255, 0, 128, 0.3)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
              Testar Configuração Atual:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn-steamdeck ${isPlayingPreview ? 'btn-steamdeck-primary' : 'btn-steamdeck-secondary'}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                onClick={handleTogglePlayPreview}
              >
                {isPlayingPreview ? <Square size={13} fill="#fff" /> : <Play size={13} fill="#fff" />}
                <span>{isPlayingPreview ? 'Parar' : 'Saída 1 (Principal)'}</span>
              </button>

              <button
                type="button"
                className={`btn-steamdeck ${isTestingPreview ? 'btn-steamdeck-amber' : 'btn-steamdeck-secondary'}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                onClick={handleToggleTestPreview}
              >
                <Headphones size={13} />
                <span>{isTestingPreview ? 'Parar' : 'Saída 2 (Fones)'}</span>
              </button>
            </div>
          </div>

          {/* Title and Soundboard Tab Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
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

            {/* Soundboard Tab / Page */}
            <div className="form-group-deck">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Folder size={14} />
                Aba da Soundboard
              </label>
              <select
                className="select-deck"
                value={tab}
                onChange={(e) => setTab(e.target.value)}
              >
                {Array.from(new Set(['Geral', ...availableSoundboardTabs, tab])).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Audio URL & Replacement */}
          <div className="form-group-deck">
            <label>URL / Arquivo de Áudio</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input-deck"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://... ou caminho do arquivo"
                required
              />
              <button
                type="button"
                className="btn-steamdeck btn-steamdeck-secondary"
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => document.getElementById('replace-audio-input')?.click()}
                disabled={uploadingFile}
              >
                <Upload size={14} />
                <span>{uploadingFile ? 'Subindo...' : 'Trocar Áudio'}</span>
              </button>
              <input
                id="replace-audio-input"
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
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
              Cor do Cartão Retrô
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
                  {color === c.hex && <Check size={16} color="#000000" />}
                </button>
              ))}
            </div>
          </div>

          {/* Hotkey Binding */}
          <div className="form-group-deck">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Keyboard size={14} />
              Atalho de Teclado (Exclusivo para a aba "{tab}")
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className={`btn-steamdeck ${isRecordingHotkey ? 'btn-steamdeck-amber' : 'btn-steamdeck-secondary'}`}
                style={{ minWidth: '170px', justifyContent: 'center' }}
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
              Sons em abas diferentes podem ter a mesma tecla de atalho. O atalho é disparado apenas quando a aba <strong>"{tab}"</strong> estiver ativa.
            </p>
          </div>

          {/* Waveform Visual Trimmer */}
          {url && (
            <div style={{ marginTop: '1rem' }}>
              <WaveformTrimmer
                audioUrl={url}
                initialStartTime={startTime}
                initialEndTime={endTime}
                onChange={(st, et) => {
                  setStartTime(st);
                  setEndTime(et);
                }}
              />
            </div>
          )}

          {/* Volume & Pitch Shifter */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div className="form-group-deck">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Volume2 size={14} />
                Volume Individual ({Math.round(volume * 100)}%)
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

          {/* Actions & Delete */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {onDelete ? (
              <button
                type="button"
                className="btn-steamdeck"
                style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ff7777' }}
                onClick={handleDeleteSound}
              >
                <Trash2 size={15} />
                <span>Excluir Som</span>
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn-steamdeck btn-steamdeck-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-steamdeck btn-steamdeck-primary">
                <Check size={16} />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
