import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Check } from 'lucide-react';

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
    <div className="studio-rack-frame">
      {/* 19" Studio Rack Flange Ears with Metallic Hex Bolts & Spec Nameplate */}
      <div className="rack-ear-strip">
        <div className="rack-screw-group">
          <div className="rack-screw-wash">
            <div className="rack-hex-screw" />
          </div>
          <div className="rack-spec-plate">
            <span className="rack-spec-text">PRESET BANK // STEREO SOUNDBOARD</span>
          </div>
        </div>

        <div className="rack-vent-grille" style={{ width: '100px' }} />

        <div className="rack-screw-group">
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.85rem', color: 'var(--neon-yellow)' }}>
            &lt; &gt; NAVEGAR PRESETS
          </span>
          <div className="rack-screw-wash">
            <div className="rack-hex-screw" />
          </div>
        </div>
      </div>

      {/* Main Analog Tuner / Preset Bank Chassis */}
      <div className="analog-preset-bank-chassis">
        {/* Left Skip Key (<) */}
        <button
          type="button"
          className="analog-skip-key"
          onClick={handlePrevTab}
          title="Aba Anterior (Atalho: Tecla < ou vírgula)"
        >
          <ChevronLeft size={16} />
        </button>

        {/* VFD Digital Screen Preset Displays */}
        <div className="radio-preset-keys-wrapper">
          {tabs.map((tab, idx) => {
            const isActive = tab === activeTab;
            const count = tabCounts[tab] || 0;

            if (editingTab === tab) {
              return (
                <div key={tab} className="vfd-preset-screen-module active" style={{ minWidth: '140px', padding: '4px 6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
                    <input
                      type="text"
                      className="input-deck"
                      style={{ padding: '0.15rem 0.4rem', fontSize: '0.78rem', width: '100%' }}
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
                      <Check size={13} color="var(--neon-green)" />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={tab}
                className={`vfd-preset-screen-module ${isActive ? 'active' : ''}`}
                onClick={() => onSelectTab(tab)}
                title={`Preset ${idx + 1}: ${tab} (${count} sons)`}
              >
                {/* Smoked Glass VFD Screen Display */}
                <div className="vfd-screen-lens">
                  <span className="vfd-screen-text">
                    {tab}
                  </span>
                  <span className="vfd-count-tag">
                    {count < 10 ? `0${count}` : count}
                  </span>
                </div>

                {/* Subtitle / Channel Code under Screen */}
                <div className="vfd-sub-indicator">
                  <span className="vfd-ch-code">
                    BANK-{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </span>

                  {/* Edit / Delete actions for custom tabs */}
                  {isActive && tab !== 'Geral' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <button
                        type="button"
                        className="icon-btn-ghost"
                        style={{ padding: '1px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTab(tab);
                          setRenameValue(tab);
                        }}
                        title="Renomear aba"
                      >
                        <Edit2 size={10} />
                      </button>
                      {tabs.length > 1 && (
                        <button
                          type="button"
                          className="icon-btn-ghost"
                          style={{ padding: '1px', color: '#ff7777' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Deseja excluir a aba "${tab}"? Os sons serão movidos para a aba "Geral".`)) {
                              onDeleteTab(tab);
                            }
                          }}
                          title="Excluir aba"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Tab Preset Key */}
          {isAdding ? (
            <form onSubmit={handleCreateSubmit} className="vfd-preset-screen-module active" style={{ minWidth: '150px', padding: '4px 6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
                <input
                  type="text"
                  className="input-deck"
                  style={{ padding: '0.15rem 0.4rem', fontSize: '0.78rem', width: '100px' }}
                  placeholder="Nova Aba..."
                  value={newTabName}
                  onChange={(e) => setNewTabName(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="btn-steamdeck btn-steamdeck-primary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>
                  Ok
                </button>
                <button
                  type="button"
                  className="icon-btn-ghost"
                  onClick={() => setIsAdding(false)}
                >
                  ✕
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="vfd-preset-screen-module"
              style={{ minWidth: '85px', borderStyle: 'dashed' }}
              onClick={() => setIsAdding(true)}
              title="Criar nova aba / preset"
            >
              <div className="vfd-screen-lens" style={{ justifyContent: 'center', gap: '4px' }}>
                <Plus size={12} color="var(--neon-cyan)" />
                <span className="vfd-screen-text" style={{ fontSize: '0.9rem' }}>+ NOVO</span>
              </div>
            </button>
          )}
        </div>

        {/* Right Skip Key (>) */}
        <button
          type="button"
          className="analog-skip-key"
          onClick={handleNextTab}
          title="Próxima Aba (Atalho: Tecla > ou ponto)"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
