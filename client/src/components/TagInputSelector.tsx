import React, { useState } from 'react';
import { Plus, X, Tag as TagIcon } from 'lucide-react';

interface TagInputSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  availableTags?: Array<string | { name: string; count?: number }>;
}

export const TagInputSelector: React.FC<TagInputSelectorProps> = ({
  selectedTags = [],
  onChange,
  availableTags = [],
}) => {
  const [newTagInput, setNewTagInput] = useState('');

  const handleAddCustomTag = () => {
    const clean = newTagInput.trim().toLowerCase().replace(/^#/, '');
    if (clean && !selectedTags.includes(clean)) {
      onChange([...selectedTags, clean]);
      setNewTagInput('');
    }
  };

  const handleToggleTag = (tag: string) => {
    const clean = tag.toLowerCase().replace(/^#/, '');
    if (selectedTags.includes(clean)) {
      onChange(selectedTags.filter((t) => t !== clean));
    } else {
      onChange([...selectedTags, clean]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(selectedTags.filter((t) => t !== tagToRemove));
  };

  // Extract raw string names
  const normalizedAvailable = availableTags.map((t) => (typeof t === 'string' ? t : t.name));

  // Combine available tags and selected tags, deduplicate
  const allUniqueTags = Array.from(
    new Set([...normalizedAvailable, ...selectedTags].filter(Boolean).map((t) => t.toLowerCase()))
  );

  return (
    <div className="form-group-deck">
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <TagIcon size={14} />
        Tags do Som (Filtros & Categorias)
      </label>

      {/* Input to type a brand new tag */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
        <input
          type="text"
          className="input-deck"
          placeholder="Digitar nova tag e pressionar Enter..."
          value={newTagInput}
          onChange={(e) => setNewTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustomTag();
            }
          }}
        />
        <button
          type="button"
          className="btn-steamdeck btn-steamdeck-secondary"
          onClick={handleAddCustomTag}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Plus size={14} />
          <span>Adicionar</span>
        </button>
      </div>

      {/* Selected tags pills */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', minHeight: '28px', marginBottom: '0.75rem' }}>
        {selectedTags.length > 0 ? (
          selectedTags.map((t) => (
            <span
              key={t}
              className="tag-pill active"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(26, 159, 255, 0.25)',
                borderColor: 'var(--deck-cyan)',
                color: 'var(--deck-cyan-light)',
                fontWeight: 700,
              }}
            >
              #{t}
              <button
                type="button"
                onClick={() => handleRemoveTag(t)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Remover tag"
              >
                <X size={12} style={{ opacity: 0.8 }} />
              </button>
            </span>
          ))
        ) : (
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic', alignSelf: 'center' }}>
            Nenhuma tag selecionada ainda. Clique nas tags abaixo ou digite uma nova.
          </span>
        )}
      </div>

      {/* Existing tags list to click and toggle */}
      {allUniqueTags.length > 0 && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            padding: '0.6rem 0.75rem',
          }}
        >
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
            🏷️ Tags Existentes na Soundboard (Clique para selecionar):
          </span>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', maxHeight: '110px', overflowY: 'auto' }}>
            {allUniqueTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`tag-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => handleToggleTag(tag)}
                  style={{
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderColor: isSelected ? 'var(--deck-cyan)' : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <span>#{tag}</span>
                  {isSelected && <span style={{ fontSize: '0.65rem', marginLeft: '2px' }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
