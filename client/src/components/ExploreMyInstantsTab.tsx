import React, { useState, useEffect } from 'react';
import { Search, Play, Square, Headphones, Plus, Flame, Sparkles } from 'lucide-react';
import type { ExternalSoundResult } from '../types';
import { searchMyInstants, getTrendingMyInstants } from '../services/api';
import { AudioEngine } from '../services/AudioEngine';

interface ExploreMyInstantsTabProps {
  onAddSound: (sound: {
    title: string;
    url: string;
    source: 'myinstants';
    sourceUrl?: string;
    tags: string[];
    color?: string;
  }) => void;
}

export const ExploreMyInstantsTab: React.FC<ExploreMyInstantsTabProps> = ({ onAddSound }) => {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<'brazil' | 'us' | 'global'>('brazil');
  const [results, setResults] = useState<ExternalSoundResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Load trending on mount or region change
  useEffect(() => {
    if (!query) {
      loadTrending(region);
    }
  }, [region]);

  const loadTrending = async (targetRegion: 'brazil' | 'us' | 'global') => {
    setLoading(true);
    try {
      const items = await getTrendingMyInstants(targetRegion);
      setResults(items);
    } catch (e) {
      console.error('Error loading trending MyInstants:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      loadTrending(region);
      return;
    }
    setLoading(true);
    try {
      const items = await searchMyInstants(query.trim());
      setResults(items);
    } catch (e) {
      console.error('Error searching MyInstants:', e);
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
      source: 'myinstants',
      sourceUrl: item.pageUrl,
      tags: item.suggestedTags || ['myinstants', 'meme'],
      color: item.color || '#ff7700',
    });
    setAddedIds((prev) => new Set([...prev, item.id]));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Search & Trending Bar */}
      <div className="tag-filter-container">
        <form onSubmit={handleSearch} className="filter-search-row">
          <div className="search-input-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar em milhões de sons do MyInstants (ex: anime, meme, faustao, roblox)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-steamdeck btn-steamdeck-amber">
            <Search size={14} />
            <span>Buscar no MyInstants</span>
          </button>
        </form>

        <div className="tag-chips-row">
          <span className="tag-chip-label">
            <Flame size={12} color="#ff7700" style={{ display: 'inline', marginRight: '4px' }} />
            Em Alta (Trending):
          </span>
          <button
            className={`tag-pill ${region === 'brazil' && !query ? 'active' : ''}`}
            onClick={() => {
              setQuery('');
              setRegion('brazil');
            }}
          >
            🇧🇷 Brasil
          </button>
          <button
            className={`tag-pill ${region === 'global' && !query ? 'active' : ''}`}
            onClick={() => {
              setQuery('');
              setRegion('global');
            }}
          >
            🌍 Global
          </button>
          <button
            className={`tag-pill ${region === 'us' && !query ? 'active' : ''}`}
            onClick={() => {
              setQuery('');
              setRegion('us');
            }}
          >
            🇺🇸 Estados Unidos
          </button>
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
                style={{ borderLeftColor: item.color || '#ff7700', borderLeftWidth: '4px' }}
              >
                <div className="card-header-row">
                  <div
                    className="sound-color-indicator"
                    style={{ background: item.color || '#ff7700' }}
                  />
                  <div className="sound-title-text" title={item.name}>
                    {item.name}
                  </div>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      background: 'rgba(255,119,0,0.2)',
                      color: '#ff9e00',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                  >
                    MyInstants
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
                    className={`btn-steamdeck ${isAdded ? 'btn-steamdeck-secondary' : 'btn-steamdeck-amber'}`}
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
          <Flame size={48} color="#ff7700" />
          <h3>Nenhum som encontrado</h3>
          <p>Tente buscar por termos populares como "roblox", "gta", "anime", "faustao" ou explore os sons em alta.</p>
          <button className="btn-steamdeck btn-steamdeck-amber" onClick={() => loadTrending('brazil')}>
            Carregar Em Alta no Brasil
          </button>
        </div>
      )}
    </div>
  );
};
