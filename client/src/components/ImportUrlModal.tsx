import React, { useState } from 'react';
import { X, Link as LinkIcon, Plus, Search, Play, Square, Headphones, Check, Sparkles, AlertCircle } from 'lucide-react';
import { resolveSoundUrl } from '../services/api';
import { AudioEngine } from '../services/AudioEngine';

interface ImportUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSound: (sound: {
    title: string;
    url: string;
    source: 'myinstants' | 'soundbuttonsworld' | 'custom';
    sourceUrl?: string;
    tags: string[];
    color: string;
    hotkey?: string;
  }) => void;
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

export const ImportUrlModal: React.FC<ImportUrlModalProps> = ({
  isOpen,
  onClose,
  onImportSound,
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolved sound state
  const [resolved, setResolved] = useState<{
    title: string;
    url: string;
    source: 'myinstants' | 'soundbuttonsworld' | 'custom';
    sourceUrl?: string;
    tags: string[];
    color?: string;
  } | null>(null);

  const [title, setTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [color, setColor] = useState('#0099ff');
  const [hotkey, setHotkey] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleResolve = async (targetUrl?: string) => {
    const toResolve = targetUrl || url;
    if (!toResolve.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await resolveSoundUrl(toResolve.trim());
      setResolved(data);
      setTitle(data.title);
      setTagsInput(data.tags.join(', '));
      setColor(data.color || '#0099ff');
    } catch (err: any) {
      setError(err.message || 'Não foi possível extrair o áudio do link.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPreview = () => {
    if (!resolved) return;
    if (isPlaying) {
      AudioEngine.stop('preview_import');
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      setIsTesting(false);
      AudioEngine.play({ id: 'preview_import', url: resolved.url, title }, false);
    }
  };

  const handleTestPillPreview = () => {
    if (!resolved) return;
    if (isTesting) {
      AudioEngine.stop('preview_import');
      setIsTesting(false);
    } else {
      setIsTesting(true);
      setIsPlaying(false);
      AudioEngine.play({ id: 'preview_import', url: resolved.url, title }, true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolved) {
      handleResolve();
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    onImportSound({
      title: title.trim() || resolved.title,
      url: resolved.url,
      source: resolved.source,
      sourceUrl: resolved.sourceUrl,
      tags: tags.length > 0 ? tags : ['importado'],
      color,
      hotkey: hotkey.trim() || undefined,
    });

    // Reset & close
    AudioEngine.stop('preview_import');
    setUrl('');
    setResolved(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-deck" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-deck">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <LinkIcon size={22} color="var(--stream-cyan)" />
            <h2>Importar Link do MyInstants / SoundButtonsWorld</h2>
          </div>
          <button className="icon-btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group-deck">
            <label>Link da Página ou do Botão</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input-deck"
                placeholder="Ex: https://www.myinstants.com/pt/instant/faustao-errou/ ou soundbuttonsworld.com/..."
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (e.target.value.includes('http')) {
                    handleResolve(e.target.value);
                  }
                }}
                required
              />
              <button
                type="button"
                className="btn-streamdeck btn-streamdeck-primary"
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => handleResolve()}
                disabled={loading || !url.trim()}
              >
                {loading ? <span className="spinner-deck" style={{ width: '16px', height: '16px' }} /> : <Search size={15} />}
                <span>{loading ? 'Analisando...' : 'Detectar Link'}</span>
              </button>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              💡 Você pode colar diretamente o link da barra de endereços do <strong>MyInstants</strong>, <strong>SoundButtonsWorld</strong> ou qualquer link direto de áudio (.mp3).
            </p>
          </div>

          {/* Error display */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                background: 'rgba(255, 51, 75, 0.1)',
                border: '1px solid rgba(255, 51, 75, 0.3)',
                borderRadius: '8px',
                color: '#ff7788',
                fontSize: '0.82rem',
                margin: '0.75rem 0',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Resolved Sound Card Box */}
          {resolved && (
            <div
              style={{
                background: 'linear-gradient(145deg, #18202d 0%, #0e141d 100%)',
                border: '2px solid var(--stream-cyan)',
                borderRadius: '14px',
                padding: '1.25rem',
                margin: '1rem 0',
                boxShadow: '0 8px 25px rgba(0, 229, 255, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} color="var(--stream-cyan)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
                    Áudio Detectado com Sucesso! ({resolved.source.toUpperCase()})
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className={`btn-streamdeck ${isPlaying ? 'btn-streamdeck-primary' : 'btn-streamdeck-secondary'}`}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    onClick={handlePlayPreview}
                  >
                    {isPlaying ? <Square size={13} fill="#fff" /> : <Play size={13} fill="#fff" />}
                    <span>{isPlaying ? 'Parar' : 'Ouvir'}</span>
                  </button>

                  <button
                    type="button"
                    className={`btn-streamdeck ${isTesting ? 'btn-streamdeck-amber' : 'btn-streamdeck-secondary'}`}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', borderColor: '#ff8800', color: '#ffaa33' }}
                    onClick={handleTestPillPreview}
                    title="Pílula de Teste: Ouvir nos fones"
                  >
                    <Headphones size={13} />
                    <span>{isTesting ? 'Parar' : 'Testar Fone'}</span>
                  </button>
                </div>
              </div>

              {/* Title input */}
              <div className="form-group-deck" style={{ marginBottom: '0.75rem' }}>
                <label>Nome no Stream Deck</label>
                <input
                  type="text"
                  className="input-deck"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Tags input */}
              <div className="form-group-deck" style={{ marginBottom: '0.75rem' }}>
                <label>Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  className="input-deck"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>

              {/* Hotkey input */}
              <div className="form-group-deck" style={{ marginBottom: '0.75rem' }}>
                <label>Atalho de Teclado (Opcional)</label>
                <input
                  type="text"
                  className="input-deck"
                  placeholder="Ex: 1, Q, F5..."
                  value={hotkey}
                  onChange={(e) => setHotkey(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </div>

              {/* Color selector */}
              <div className="form-group-deck">
                <label>Cor do Botão</label>
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {STREAM_DECK_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: c.hex,
                        border: color === c.hex ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                        boxShadow: color === c.hex ? `0 0 10px ${c.hex}` : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title={c.label}
                    >
                      {color === c.hex && <Check size={14} color="#ffffff" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn-streamdeck btn-streamdeck-secondary"
              onClick={() => {
                AudioEngine.stop('preview_import');
                onClose();
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-streamdeck btn-streamdeck-primary"
              disabled={loading || !resolved}
            >
              <Plus size={16} />
              <span>Adicionar ao Stream Deck</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
