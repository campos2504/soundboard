import React, { useState } from 'react';
import { X, Link as LinkIcon, Plus, Search, Play, Square, Headphones, Check, Sparkles, AlertCircle, ClipboardPaste } from 'lucide-react';
import { resolveSoundUrl } from '../services/api';
import { AudioEngine } from '../services/AudioEngine';
import { TagInputSelector } from './TagInputSelector';

interface ImportUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTags?: Array<string | { name: string; count?: number }>;
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

export const ImportUrlModal: React.FC<ImportUrlModalProps> = ({
  isOpen,
  onClose,
  availableTags = [],
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [color, setColor] = useState('#1a9fff');
  const [hotkey, setHotkey] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleResolve = async (targetUrl?: string) => {
    const toResolve = targetUrl !== undefined ? targetUrl : url;
    if (!toResolve.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await resolveSoundUrl(toResolve.trim());
      setResolved(data);
      setTitle(data.title);
      setSelectedTags(data.tags || []);
      setColor(data.color || '#1a9fff');
    } catch (err: any) {
      setError(err.message || 'Não foi possível extrair o áudio do link/botão.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        handleResolve(text);
      }
    } catch (e) {
      console.warn('Could not read clipboard', e);
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

    onImportSound({
      title: title.trim() || resolved.title,
      url: resolved.url,
      source: resolved.source,
      sourceUrl: resolved.sourceUrl,
      tags: selectedTags.length > 0 ? selectedTags : ['importado'],
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
      <div className="modal-content-deck" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-deck">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <LinkIcon size={22} color="var(--deck-cyan)" />
            <h2>Importador Universal de Botões & Links</h2>
          </div>
          <button className="icon-btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group-deck">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <label style={{ margin: 0 }}>Link do Botão ou Página</label>
              <button
                type="button"
                className="btn-steamdeck btn-steamdeck-secondary"
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.74rem' }}
                onClick={handlePasteFromClipboard}
              >
                <ClipboardPaste size={13} />
                <span>Colar da Área de Transferência</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input-deck"
                placeholder="Cole o link do botão do MyInstants, SoundButtonsWorld ou nome do som..."
                value={url}
                onChange={(e) => {
                  const val = e.target.value;
                  setUrl(val);
                  if (val.includes('http') || val.includes('myinstants') || val.includes('soundbutton')) {
                    handleResolve(val);
                  }
                }}
                required
              />
              <button
                type="button"
                className="btn-steamdeck btn-steamdeck-primary"
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => handleResolve()}
                disabled={loading || !url.trim()}
              >
                {loading ? <span className="spinner-deck" style={{ width: '16px', height: '16px' }} /> : <Search size={15} />}
                <span>{loading ? 'Extraindo...' : 'Extrair Áudio'}</span>
              </button>
            </div>

            <div style={{ marginTop: '0.5rem', background: 'rgba(26, 159, 255, 0.06)', border: '1px solid rgba(26, 159, 255, 0.15)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                💡 <strong>Como copiar do site:</strong> No <strong>MyInstants</strong> ou <strong>SoundButtonsWorld</strong>, clique com o botão direito no botão do meme e escolha <em>"Copiar endereço do link"</em> ou copie o link da página no navegador. O extrator identifica o som automaticamente!
              </p>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ff7777',
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
                background: 'linear-gradient(145deg, #182330 0%, #101822 100%)',
                border: '2px solid var(--deck-cyan)',
                borderRadius: '14px',
                padding: '1.25rem',
                margin: '1rem 0',
                boxShadow: '0 8px 25px rgba(26, 159, 255, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} color="var(--deck-cyan)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
                    Áudio Extraído com Sucesso! ({resolved.source.toUpperCase()})
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className={`btn-steamdeck ${isPlaying ? 'btn-steamdeck-primary' : 'btn-steamdeck-secondary'}`}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    onClick={handlePlayPreview}
                  >
                    {isPlaying ? <Square size={13} fill="#fff" /> : <Play size={13} fill="#fff" />}
                    <span>{isPlaying ? 'Parar' : 'Ouvir (Saída 1)'}</span>
                  </button>

                  <button
                    type="button"
                    className={`btn-steamdeck ${isTesting ? 'btn-steamdeck-amber' : 'btn-steamdeck-secondary'}`}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', borderColor: '#ff7700', color: '#ffaa44' }}
                    onClick={handleTestPillPreview}
                    title="Pílula de Teste: Ouvir nos fones"
                  >
                    <Headphones size={13} />
                    <span>{isTesting ? 'Parar' : 'Testar Fone (Saída 2)'}</span>
                  </button>
                </div>
              </div>

              {/* Title input */}
              <div className="form-group-deck" style={{ marginBottom: '0.75rem' }}>
                <label>Nome do Som</label>
                <input
                  type="text"
                  className="input-deck"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Interactive Tag Selector with Existing & New Tags */}
              <TagInputSelector
                selectedTags={selectedTags}
                onChange={setSelectedTags}
                availableTags={availableTags}
              />

              {/* Hotkey input (Letters A-Z and Numbers 0-9 only) */}
              <div className="form-group-deck" style={{ marginBottom: '0.75rem' }}>
                <label>Atalho de Teclado (Apenas 1 Letra ou Número)</label>
                <input
                  type="text"
                  className="input-deck"
                  placeholder="Ex: 1, 2, Q, A..."
                  value={hotkey}
                  onChange={(e) => setHotkey(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 1))}
                  maxLength={1}
                />
              </div>

              {/* Color selector */}
              <div className="form-group-deck">
                <label>Cor do Cartão</label>
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {STEAM_DECK_COLORS.map((c) => (
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
              className="btn-steamdeck btn-steamdeck-secondary"
              onClick={() => {
                AudioEngine.stop('preview_import');
                onClose();
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-steamdeck btn-steamdeck-primary"
              disabled={loading || !resolved}
            >
              <Plus size={16} />
              <span>Adicionar à Soundboard</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
