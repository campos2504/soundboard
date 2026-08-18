import React, { useState, useEffect } from 'react';
import { Search, Play, Square, Headphones, Plus, Globe2, Check } from 'lucide-react';
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
      const data = await getTrendingSoundButtonsWorld(1, 30);
      setResults(data);
    } catch (err) {
      console.error('Failed to load SoundButtonsWorld trending', err);
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
      const data = await searchSoundButtonsWorld(query.trim());
      setResults(data);
    } catch (err) {
      console.error('Failed to search SoundButtonsWorld', err);
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
      tags: item.suggestedTags || ['sbworld', 'meme'],
      color: item.color || '#00d2ff',
    });
    setAddedIds((prev) => new Set([...prev, item.id]));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Search & Suggestions Bar */}
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

      {/* Results Grid with K7 Cassettes */}
      {!loading && results.length > 0 && (
        <div className="soundboard-grid">
          {results.map((item, idx) => {
            const isPlaying = playingId === item.id;
            const isTesting = testingId === item.id;
            const isAnyPlaying = isPlaying || isTesting;
            const isAdded = addedIds.has(item.id);
            const themes = ['k7-theme-walkman', 'k7-theme-cyber', 'k7-theme-arcade', 'k7-theme-tdk', 'k7-theme-vapor', 'k7-theme-metal'];
            const themeClass = themes[idx % themes.length];

            return (
              <div
                key={item.id}
                className={`k7-cassette-card ${themeClass} ${
                  isPlaying ? 'k7-playing-main' : isTesting ? 'k7-playing-test' : ''
                }`}
              >
                {/* 4 Corner Screws */}
                <div className="k7-screw k7-screw-tl" />
                <div className="k7-screw k7-screw-tr" />
                <div className="k7-screw k7-screw-bl" />
                <div className="k7-screw k7-screw-br" />

                {/* Top Cassette Paper Label */}
                <div className="k7-label">
                  <div className="k7-label-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="k7-side-badge">
                        SBW
                      </div>
                      <div className="k7-brand-badge">
                        <strong>SB-WORLD</strong>
                        <span className="k7-brand-sub">{item.category || 'MEME'}</span>
                      </div>
                    </div>

                    {/* Quick Add button */}
                    <button
                      type="button"
                      className={`btn-steamdeck ${isAdded ? 'btn-steamdeck-secondary' : 'btn-steamdeck-primary'}`}
                      style={{ padding: '2px 8px', fontSize: '0.72rem', height: '24px' }}
                      onClick={() => handleAdd(item)}
                      disabled={isAdded}
                      title="Adicionar som à Soundboard"
                    >
                      {isAdded ? (
                        <>
                          <Check size={12} color="var(--neon-green)" />
                          <span>Salvo</span>
                        </>
                      ) : (
                        <>
                          <Plus size={12} />
                          <span>+ Add</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Cassette Title on Ruled Handwriting Lines */}
                  <div className="k7-title-block" title={item.name}>
                    <div className="k7-ruled-line k7-ruled-line-1" />
                    <div className="k7-ruled-line k7-ruled-line-2" />
                    <div className="k7-title-text">
                      {item.name}
                    </div>
                  </div>

                  {/* Colored Racing Stripes */}
                  <div className="k7-racing-stripes">
                    <div className="k7-stripe k7-stripe-red" />
                    <div className="k7-stripe k7-stripe-black" />
                  </div>
                </div>

                {/* Center Transparent Tape Viewing Window */}
                <div className="k7-window-housing">
                  <div className="k7-window">
                    {/* Left Cogwheel Reel */}
                    <div className={`k7-spool k7-spool-left ${isAnyPlaying ? 'k7-spinning' : ''}`}>
                      <div className="k7-cog-tooth k7-cog-1" />
                      <div className="k7-cog-tooth k7-cog-2" />
                      <div className="k7-cog-tooth k7-cog-3" />
                      <div className="k7-cog-center" />
                    </div>

                    {/* Central Magnetic Tape Spool */}
                    <div className="k7-tape-center">
                      <div className="k7-tape-roll" />
                      <div className="k7-ruler-ticks">
                        <span>|</span>
                        <span>0</span>
                        <span>50</span>
                        <span>100</span>
                        <span>|</span>
                      </div>
                    </div>

                    {/* Right Cogwheel Reel */}
                    <div className={`k7-spool k7-spool-right ${isAnyPlaying ? 'k7-spinning' : ''}`}>
                      <div className="k7-cog-tooth k7-cog-1" />
                      <div className="k7-cog-tooth k7-cog-2" />
                      <div className="k7-cog-tooth k7-cog-3" />
                      <div className="k7-cog-center" />
                    </div>
                  </div>
                </div>

                {/* Suggested Tags Chips */}
                <div className="k7-tags-row">
                  {item.suggestedTags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="k7-tag-chip">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Lower Trapezoid Tape Head Section with Capstan Holes & Dual Deck Buttons */}
                <div className="k7-bottom-head">
                  <div className="k7-head-holes-row">
                    <div className="k7-head-hole" />
                    <div className="k7-head-hole" />
                    <div className="k7-screw k7-screw-center" />
                    <div className="k7-head-hole" />
                    <div className="k7-head-hole" />
                  </div>

                  <div className="k7-controls-row">
                    {/* Play Main */}
                    <button
                      type="button"
                      className={`k7-deck-btn k7-btn-play ${isPlaying ? 'k7-is-active' : ''}`}
                      onClick={() => handlePlay(item)}
                      title="Ouvir no Canal Principal"
                    >
                      {isPlaying ? <Square size={12} fill="#fff" /> : <Play size={12} fill="currentColor" />}
                      <span>{isPlaying ? 'PARAR' : 'OUVIR ▶'}</span>
                    </button>

                    {/* Test Pill */}
                    <button
                      type="button"
                      className={`k7-deck-btn k7-btn-test ${isTesting ? 'k7-is-active' : ''}`}
                      onClick={() => handleTestPill(item)}
                      title="Pílula de Teste: Ouvir no Fone"
                    >
                      <Headphones size={12} />
                      <span>{isTesting ? 'PARAR' : 'TEST 🎧'}</span>
                    </button>
                  </div>
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
