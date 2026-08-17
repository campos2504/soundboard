import React, { useState, useEffect } from 'react';
import { Search, Play, Square, Headphones, Plus, Globe2, Sparkles } from 'lucide-react';
import type { ExternalSoundResult } from '../types';
import { searchSoundButtonsWorld, getTrendingSoundButtonsWorld } from '../services/api';
import { AudioEngine } from '../services/AudioEngine';

interface ExploreSoundButtonsWorldTabProps {
  onAddSound: (sound: {
    title: string;
    url: string;
    source: 'soundbuttonsworld';
    sourceUrl?: string;
    tags: string[];
    color?: string;
  }) => void;
}

export const ExploreSoundButtonsWorldTab: React.FC<ExploreSoundButtonsWorldTabProps> = ({
  onAddSound,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ExternalSoundResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    setLoading(true);
    try {
      const items = await getTrendingSoundButtonsWorld(1, 30);
      setResults(items);
    } catch (e) {
      console.error('Error loading SoundButtonsWorld trending:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      loadTrending();
      return;
    }
    setLoading(true);
    try {
      const items = await searchSoundButtonsWorld(query.trim());
      setResults(items);
    } catch (e) {
      console.error('Error searching SoundButtonsWorld:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (item: ExternalSoundResult) => {
    if (playingId === item.id) {
      AudioEngine.stop(item.id);
      setPlayingId(null);
    } else {
      setPlayingId(item.id);
      setTestingId(null);
      await AudioEngine.play({ id: item.id, url: item.url, title: item.name }, false);
    }
  };

  const handleTestPill = async (item: ExternalSoundResult) => {
    if (testingId === item.id) {
      AudioEngine.stop(item.id);
      setTestingId(null);
    } else {
      setTestingId(item.id);
      setPlayingId(null);
      await AudioEngine.play({ id: item.id, url: item.url, title: item.name }, true);
    }
  };

  const handleAdd = (item: ExternalSoundResult) => {
    onAddSound({
      title: item.name,
      url: item.url,
      source: 'soundbuttonsworld',
      sourceUrl: item.pageUrl,
      tags: item.suggestedTags || ['soundbuttonsworld', 'meme'],
      color: item.color || '#00d2ff',
    });
    setAddedIds((prev) => new Set([...prev, item.id]));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Search Bar */}
      <div className="tag-filter-container">
        <form onSubmit={handleSearch} className="filter-search-row">
          <div className="search-input-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar em 180.000+ sons do SoundButtonsWorld (ex: vine boom, bruh, meme, fart)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-steamdeck btn-steamdeck-primary">
            <Search size={14} />
            <span>Buscar no SoundButtonsWorld</span>
          </button>
        </form>

        <div className="tag-chips-row">
          <span className="tag-chip-label">
            <Globe2 size={12} color="#00d2ff" style={{ display: 'inline', marginRight: '4px' }} />
            Sugestões Rápidas:
          </span>
          {['vine boom', 'bruh', 'we do not care', 'fortnite', 'goofy ahh', 'indian', 'fart', 'android beep'].map((q) => (
            <button
              key={q}
              className={`tag-pill ${query === q ? 'active' : ''}`}
              onClick={() => {
                setQuery(q);
                searchSoundButtonsWorld(q).then(setResults);
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner-deck" />
        </div>
      )}

      {/* Results Grid */}
      {!loading && results.length > 0 && (
        <div className="soundboard-grid">
          {results.map((item) => {
            const isPlaying = playingId === item.id;
            const isTesting = testingId === item.id;
            const isAdded = addedIds.has(item.id);

            return (
              <div
                key={item.id}
                className={`sound-card-item ${isPlaying ? 'playing-main' : isTesting ? 'playing-test' : ''}`}
                style={{ borderLeftColor: item.color || '#00d2ff', borderLeftWidth: '4px' }}
              >
                <div className="card-header-row">
                  <div
                    className="sound-color-indicator"
                    style={{ background: item.color || '#00d2ff' }}
                  />
                  <div className="sound-title-text" title={item.name}>
                    {item.name}
                  </div>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      background: 'rgba(0,210,255,0.15)',
                      color: '#00d2ff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                  >
                    {item.category || 'SBWorld'}
                  </span>
                </div>

                {/* Suggested Tags */}
                <div className="card-tags-list">
                  {item.suggestedTags?.map((tag) => (
                    <span key={tag} className="card-tag-pill">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Actions Row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: 'auto' }}>
                  <div className="card-actions-row">
                    <button
                      className={`btn-deck-play ${isPlaying ? 'is-playing' : ''}`}
                      onClick={() => handlePlay(item)}
                    >
                      {isPlaying ? <Square size={13} fill="#fff" /> : <Play size={13} fill="#fff" />}
                      <span>{isPlaying ? 'Parar' : 'Ouvir'}</span>
                    </button>

                    {/* Dedicated Test Pill */}
                    <button
                      className={`btn-deck-test-pill ${isTesting ? 'is-testing' : ''}`}
                      onClick={() => handleTestPill(item)}
                      title="Pílula de Teste: Prévia na Saída Secundária"
                    >
                      <Headphones size={13} />
                      <span>{isTesting ? 'Parar' : 'Testar'}</span>
                    </button>
                  </div>

                  <button
                    className={`btn-steamdeck ${isAdded ? 'btn-steamdeck-secondary' : 'btn-steamdeck-primary'}`}
                    style={{ width: '100%', justifyContent: 'center', padding: '0.45rem' }}
                    onClick={() => handleAdd(item)}
                    disabled={isAdded}
                  >
                    {isAdded ? (
                      <>
                        <Sparkles size={14} color="#00d2ff" />
                        <span>Adicionado à Soundboard!</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Adicionar à Soundboard</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && (
        <div className="empty-state-container">
          <Globe2 size={48} color="#00d2ff" />
          <h3>Nenhum som encontrado no SoundButtonsWorld</h3>
          <p>Tente buscar por outras palavras em inglês ou termos como "vine boom", "bruh", "game", "meme".</p>
          <button className="btn-steamdeck btn-steamdeck-primary" onClick={loadTrending}>
            Carregar Populares
          </button>
        </div>
      )}
    </div>
  );
};
