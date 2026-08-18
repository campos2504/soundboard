import React, { useState } from 'react';
import { Search, Plus, Mic, Link as LinkIcon, Star, X, Tag as TagIcon, Edit3, CheckSquare, ChevronDown, ChevronUp } from 'lucide-react';
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
  isEditMode: boolean;
  onToggleEditMode: () => void;
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
  isEditMode,
  onToggleEditMode,
  onOpenAddModal,
  onOpenRecordModal,
  onOpenImportUrlModal,
}) => {
  const [isTagsCollapsed, setIsTagsCollapsed] = useState(() => {
    return localStorage.getItem('soundboard_tags_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsTagsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('soundboard_tags_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="tag-filter-container">
      {/* Search and Action Buttons Row */}
      <div className="filter-search-row">
        <div className="search-input-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Pesquisar sons por nome, tag (#meme, #faro) ou atalho..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'rgba(255, 0, 85, 0.15)',
                border: '1px solid rgba(255, 0, 85, 0.4)',
                borderRadius: '3px',
                color: '#ff4d88',
                cursor: 'pointer',
                padding: '2px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontFamily: 'var(--font-pixel)',
                fontSize: '0.85rem',
                zIndex: 3,
              }}
              title="Limpar pesquisa"
            >
              <span>CLR</span>
              <X size={11} />
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
            <Star size={14} fill={onlyFavorites ? 'var(--neon-yellow)' : 'none'} color={onlyFavorites ? 'var(--neon-yellow)' : 'currentColor'} />
            <span>Favoritos</span>
          </button>

          {/* Edit Mode Toggle */}
          <button
            className={`btn-steamdeck ${isEditMode ? 'btn-steamdeck-primary' : 'btn-steamdeck-secondary'}`}
            style={isEditMode ? { borderColor: 'var(--neon-cyan)', boxShadow: '0 0 15px var(--neon-cyan-glow)' } : {}}
            onClick={onToggleEditMode}
            title="Ativar/Desativar modo de organização e edição da soundboard"
          >
            {isEditMode ? <CheckSquare size={14} /> : <Edit3 size={14} color="var(--neon-cyan)" />}
            <span>{isEditMode ? 'Concluir Edição' : 'Modo Edição'}</span>
          </button>

          {/* Record Button */}
          <button
            className="btn-steamdeck btn-steamdeck-secondary"
            onClick={onOpenRecordModal}
            title="Gravar áudio do microfone"
          >
            <Mic size={14} color="var(--neon-cyan)" />
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

      {/* Tag Cloud Header & Collapse Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.45rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-steamdeck btn-steamdeck-secondary"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={toggleCollapse}
            title={isTagsCollapsed ? 'Expandir nuvem de tags' : 'Minimizar nuvem de tags'}
          >
            <TagIcon size={13} color="var(--neon-cyan)" />
            <span>Filtro de Tags ({tags.length})</span>
            {isTagsCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          {/* Source Filter Quick Pills (always available) */}
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <button
              className={`tag-pill ${selectedSource === '' ? 'active' : ''}`}
              style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
              onClick={() => onSelectSource('')}
            >
              Todas
            </button>
            <button
              className={`tag-pill ${selectedSource === 'myinstants' ? 'active' : ''}`}
              style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
              onClick={() => onSelectSource(selectedSource === 'myinstants' ? '' : 'myinstants')}
            >
              MyInstants
            </button>
            <button
              className={`tag-pill ${selectedSource === 'soundbuttonsworld' ? 'active' : ''}`}
              style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
              onClick={() => onSelectSource(selectedSource === 'soundbuttonsworld' ? '' : 'soundbuttonsworld')}
            >
              SoundButtons
            </button>
          </div>

          {/* When collapsed, display active selected tag chips */}
          {isTagsCollapsed && selectedTags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--neon-yellow)' }}>Ativos:</span>
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="tag-pill active"
                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                  onClick={() => onToggleTag(tag)}
                  title="Clique para remover filtro"
                >
                  #{tag} ×
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Clear Tags Filter */}
        {selectedTags.length > 0 && (
          <button
            className="tag-pill"
            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ff7777', padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
            onClick={onClearTags}
          >
            <X size={12} />
            <span>Limpar filtros ({selectedTags.length})</span>
          </button>
        )}
      </div>

      {/* Expanded Tag Cloud */}
      {!isTagsCollapsed && (
        <div
          className="tag-chips-row"
          style={{
            marginTop: '0.45rem',
            paddingTop: '0.45rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            maxHeight: '140px',
            overflowY: 'auto',
          }}
        >
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
        </div>
      )}
    </div>
  );
};
