import React from 'react';
import { LayoutGrid, Flame, Globe2, Sliders, Keyboard } from 'lucide-react';

export type TabType = 'library' | 'myinstants' | 'soundbuttonsworld' | 'routing' | 'hotkeys';

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
    <nav className="streamdeck-nav-tabs">
      <button
        className={`nav-tab-item ${activeTab === 'library' ? 'active' : ''}`}
        onClick={() => onSelectTab('library')}
      >
        <LayoutGrid size={18} />
        <span>Stream Deck Principal</span>
        <span className="nav-tab-badge">{soundCount} Botões</span>
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
        className={`nav-tab-item ${activeTab === 'routing' ? 'active' : ''}`}
        onClick={() => onSelectTab('routing')}
      >
        <Sliders size={18} />
        <span>Roteamento de Saídas & Pílula de Teste</span>
      </button>

      <button
        className={`nav-tab-item ${activeTab === 'hotkeys' ? 'active' : ''}`}
        onClick={() => onSelectTab('hotkeys')}
      >
        <Keyboard size={18} />
        <span>Atalhos de Teclado & Macros</span>
      </button>
    </nav>
  );
};
