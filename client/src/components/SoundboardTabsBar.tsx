import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Folder, Trash2, Edit2, Check } from 'lucide-react';

interface SoundboardTabsBarProps {
  tabs: string[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onAddTab: (tabName: string) => void;
  onRenameTab: (oldName: string, newName: string) => void;
  onDeleteTab: (tabName: string) => void;
  tabCounts: Record<string, number>;
}

export const SoundboardTabsBar: React.FC<SoundboardTabsBarProps> = ({
  tabs,
  activeTab,
  onSelectTab,
  onAddTab,
  onRenameTab,
  onDeleteTab,
  tabCounts,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const activeIndex = tabs.indexOf(activeTab);

  const handlePrevTab = () => {
    if (tabs.length === 0) return;
    const newIdx = activeIndex <= 0 ? tabs.length - 1 : activeIndex - 1;
    onSelectTab(tabs[newIdx]);
  };

  const handleNextTab = () => {
    if (tabs.length === 0) return;
    const newIdx = activeIndex >= tabs.length - 1 ? 0 : activeIndex + 1;
    onSelectTab(tabs[newIdx]);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTabName.trim();
    if (clean && !tabs.includes(clean)) {
      onAddTab(clean);
      onSelectTab(clean);
      setNewTabName('');
      setIsAdding(false);
    }
  };

  const handleRenameSubmit = (oldName: string) => {
    const clean = renameValue.trim();
    if (clean && clean !== oldName && !tabs.includes(clean)) {
      onRenameTab(oldName, clean);
    }
    setEditingTab(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 12, 32, 0.95)',
        border: '1px solid rgba(0, 240, 255, 0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.5rem 0.85rem',
        marginBottom: '1rem',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)',
        gap: '0.6rem',
        flexWrap: 'wrap',
      }}
    >
      {/* Left controls: Prev Tab with < shortcut */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <button
          type="button"
          className="btn-steamdeck btn-steamdeck-secondary"
          style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
          onClick={handlePrevTab}
          title="Aba Anterior (Atalho: Tecla < ou vírgula)"
        >
          <ChevronLeft size={16} color="var(--neon-cyan)" />
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', color: 'var(--neon-yellow)' }}>&lt;</span>
        </button>

        {/* Scrollable Soundboard Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto', padding: '2px 0' }}>
          {tabs.map((tab) => {
            const isActive = tab === activeTab;
            const count = tabCounts[tab] || 0;

            if (editingTab === tab) {
              return (
                <div key={tab} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="text"
                    className="input-deck"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.82rem', width: '110px' }}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit(tab);
                      if (e.key === 'Escape') setEditingTab(null);
                    }}
                  />
                  <button
                    type="button"
                    className="icon-btn-ghost"
                    onClick={() => handleRenameSubmit(tab)}
                    title="Confirmar"
                  >
                    <Check size={14} color="var(--neon-green)" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={tab}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(255, 0, 128, 0.35) 0%, rgba(0, 240, 255, 0.25) 100%)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: isActive ? '1px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isActive ? '0 0 16px var(--neon-cyan-glow)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                }}
                onClick={() => onSelectTab(tab)}
              >
                <Folder size={14} color={isActive ? 'var(--neon-cyan)' : 'var(--text-muted)'} />
                <span
                  style={{
                    fontFamily: 'var(--font-retro)',
                    fontSize: '0.88rem',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {tab}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '0.85rem',
                    background: 'rgba(0, 0, 0, 0.5)',
                    padding: '0 5px',
                    borderRadius: '4px',
                    color: isActive ? 'var(--neon-yellow)' : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>

                {/* Edit / Delete actions for custom tabs */}
                {isActive && tab !== 'Geral' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
                    <button
                      type="button"
                      className="icon-btn-ghost"
                      style={{ padding: '2px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTab(tab);
                        setRenameValue(tab);
                      }}
                      title="Renomear aba"
                    >
                      <Edit2 size={11} />
                    </button>
                    {tabs.length > 1 && (
                      <button
                        type="button"
                        className="icon-btn-ghost"
                        style={{ padding: '2px', color: '#ff7777' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Deseja excluir a aba "${tab}"? Os sons serão movidos para a aba "Geral".`)) {
                            onDeleteTab(tab);
                          }
                        }}
                        title="Excluir aba"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Tab Form */}
          {isAdding ? (
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="text"
                className="input-deck"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', width: '120px' }}
                placeholder="Nome da Aba..."
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn-steamdeck btn-steamdeck-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                Criar
              </button>
              <button
                type="button"
                className="icon-btn-ghost"
                onClick={() => setIsAdding(false)}
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="btn-steamdeck btn-steamdeck-secondary"
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
              onClick={() => setIsAdding(true)}
              title="Criar nova aba para a soundboard"
            >
              <Plus size={13} />
              <span>Nova Aba</span>
            </button>
          )}
        </div>

        {/* Right control: Next Tab with > shortcut */}
        <button
          type="button"
          className="btn-steamdeck btn-steamdeck-secondary"
          style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
          onClick={handleNextTab}
          title="Próxima Aba (Atalho: Tecla > ou ponto)"
        >
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', color: 'var(--neon-yellow)' }}>&gt;</span>
          <ChevronRight size={16} color="var(--neon-cyan)" />
        </button>
      </div>

      {/* Hotkey Helper Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '0.95rem',
            color: 'var(--neon-yellow)',
            background: 'rgba(255, 230, 0, 0.08)',
            border: '1px solid rgba(255, 230, 0, 0.3)',
            borderRadius: '6px',
            padding: '2px 8px',
          }}
        >
          ⌨️ Atalho: Teclas &lt; e &gt; navegam entre as abas
        </span>
      </div>
    </div>
  );
};
