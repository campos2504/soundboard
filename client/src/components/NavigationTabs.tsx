import React from 'react';
import { LayoutGrid, Flame, Globe2, Keyboard } from 'lucide-react';

export type TabType = 'library' | 'myinstants' | 'soundbuttonsworld' | 'hotkeys';

interface NavigationTabsProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  soundCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onSelectTab,
  soundCount,
}) => {
  return (
    <nav className="deck-nav-tabs">
      <button
        className={`nav-tab-item ${activeTab === 'library' ? 'active' : ''}`}
        onClick={() => onSelectTab('library')}
      >
        <LayoutGrid size={18} />
        <span>Soundboard Principal</span>
        <span className="nav-tab-badge">{soundCount} Sons</span>
      </button>

      <button
        className={`nav-tab-item ${activeTab === 'myinstants' ? 'active' : ''}`}
        onClick={() => onSelectTab('myinstants')}
      >
        <Flame size={18} color="#ff8800" />
        <span>MyInstants</span>
        <span className="nav-tab-badge">Em Alta & Busca</span>
      </button>

      <button
        className={`nav-tab-item ${activeTab === 'soundbuttonsworld' ? 'active' : ''}`}
        onClick={() => onSelectTab('soundbuttonsworld')}
      >
        <Globe2 size={18} color="#00e5ff" />
        <span>SoundButtonsWorld</span>
        <span className="nav-tab-badge">180k+ Sons</span>
      </button>

      <button
        className={`nav-tab-item ${activeTab === 'hotkeys' ? 'active' : ''}`}
        onClick={() => onSelectTab('hotkeys')}
      >
        <Keyboard size={18} />
        <span>Atalhos de Teclado</span>
      </button>
    </nav>
  );
};
