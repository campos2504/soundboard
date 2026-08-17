import React from 'react';
import { Search, Plus, Mic, Link as LinkIcon, Star, X, Tag as TagIcon } from 'lucide-react';
import type { TagInfo } from '../types';

interface TagFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  tags: TagInfo[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  onlyFavorites: boolean;
  onToggleFavorites: () => void;
  selectedSource: string;
  onSelectSource: (source: string) => void;
  onOpenAddModal: () => void;
  onOpenRecordModal: () => void;
  onOpenImportUrlModal: () => void;
}

export const TagFilterBar: React.FC<TagFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  tags,
  selectedTags,
  onToggleTag,
  onClearTags,
  onlyFavorites,
  onToggleFavorites,
  selectedSource,
  onSelectSource,
  onOpenAddModal,
  onOpenRecordModal,
  onOpenImportUrlModal,
}) => {
  return (
    <div className="tag-filter-container">
      {/* Search and Action Buttons Row */}
      <div className="filter-search-row">
        <div className="search-input-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Pesquisar sons por nome, tag (#meme, #gaming) ou atalho..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="action-buttons-group">
          {/* Favorites Filter */}
          <button
            className={`btn-steamdeck ${onlyFavorites ? 'btn-steamdeck-amber' : 'btn-steamdeck-secondary'}`}
            onClick={onToggleFavorites}
            title="Filtrar apenas favoritos"
          >
            <Star size={14} fill={onlyFavorites ? '#fff' : 'none'} />
            <span>Favoritos</span>
          </button>

          {/* Record Button */}
          <button
            className="btn-steamdeck btn-steamdeck-secondary"
            onClick={onOpenRecordModal}
            title="Gravar áudio do microfone"
          >
            <Mic size={14} color="#00d2ff" />
            <span>Gravar Mic</span>
          </button>

          {/* Import URL */}
          <button
            className="btn-steamdeck btn-steamdeck-secondary"
            onClick={onOpenImportUrlModal}
            title="Importar por link do MyInstants ou URL"
          >
            <LinkIcon size={14} />
            <span>Link URL</span>
          </button>

          {/* Add Sound */}
          <button
            className="btn-steamdeck btn-steamdeck-primary"
            onClick={onOpenAddModal}
            title="Adicionar arquivo de áudio ou som customizado"
          >
            <Plus size={15} />
            <span>Novo Som</span>
          </button>
        </div>
      </div>

      {/* Tag Cloud & Source Filters */}
      <div className="tag-chips-row">
        <span className="tag-chip-label">
          <TagIcon size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Tags:
        </span>

        {/* Source Pills */}
        <button
          className={`tag-pill ${selectedSource === '' ? 'active' : ''}`}
          onClick={() => onSelectSource('')}
        >
          Todas Fontes
        </button>
        <button
          className={`tag-pill ${selectedSource === 'myinstants' ? 'active' : ''}`}
          onClick={() => onSelectSource(selectedSource === 'myinstants' ? '' : 'myinstants')}
        >
          🔥 MyInstants
        </button>
        <button
          className={`tag-pill ${selectedSource === 'soundbuttonsworld' ? 'active' : ''}`}
          onClick={() => onSelectSource(selectedSource === 'soundbuttonsworld' ? '' : 'soundbuttonsworld')}
        >
          🌐 SoundButtonsWorld
        </button>
        <button
          className={`tag-pill ${selectedSource === 'local' ? 'active' : ''}`}
          onClick={() => onSelectSource(selectedSource === 'local' ? '' : 'local')}
        >
          📁 Locais/Gravações
        </button>

        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

        {/* Dynamic Tags */}
        {tags.map((t) => {
          const isSelected = selectedTags.includes(t.name);
          return (
            <button
              key={t.name}
              className={`tag-pill ${isSelected ? 'active' : ''}`}
              onClick={() => onToggleTag(t.name)}
            >
              <span>#{t.name}</span>
              <span className="tag-pill-count">{t.count}</span>
            </button>
          );
        })}

        {selectedTags.length > 0 && (
          <button
            className="tag-pill"
            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ff7777' }}
            onClick={onClearTags}
          >
            <X size={12} />
            <span>Limpar filtros ({selectedTags.length})</span>
          </button>
        )}
      </div>
    </div>
  );
};
