import { useState, useEffect, useMemo, useCallback } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { NavigationTabs } from './components/NavigationTabs';
import type { TabType } from './components/NavigationTabs';
import { TagFilterBar } from './components/TagFilterBar';
import { SoundCard } from './components/SoundCard';
import { ExploreMyInstantsTab } from './components/ExploreMyInstantsTab';
import { ExploreSoundButtonsWorldTab } from './components/ExploreSoundButtonsWorldTab';
import { AudioRoutingModal } from './components/AudioRoutingModal';
import { TagEditorModal } from './components/TagEditorModal';
import { AddSoundModal } from './components/AddSoundModal';
import { RecordSoundModal } from './components/RecordSoundModal';
import { ImportUrlModal } from './components/ImportUrlModal';
import { HotkeysTab } from './components/HotkeysTab';
import { GamepadOverlay } from './components/GamepadOverlay';

import type { SoundItem, TagInfo, AudioRoutingConfig } from './types';
import { fetchSounds, fetchTags, createSound, updateSound, deleteSound } from './services/api';
import { AudioEngine } from './services/AudioEngine';
import { Radio } from 'lucide-react';

export default function App() {
  const [sounds, setSounds] = useState<SoundItem[]>([]);
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Playing States from AudioEngine
  const [playingMainIds, setPlayingMainIds] = useState<Set<string>>(new Set());
  const [playingTestIds, setPlayingTestIds] = useState<Set<string>>(new Set());

  // Modals
  const [isAudioRoutingOpen, setIsAudioRoutingOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isImportUrlModalOpen, setIsImportUrlModalOpen] = useState(false);
  const [editingSound, setEditingSound] = useState<SoundItem | null>(null);

  // Audio Config
  const [audioConfig, setAudioConfig] = useState<AudioRoutingConfig>(AudioEngine.getConfig());

  // Subscribe to Audio Engine state changes
  useEffect(() => {
    const unsubscribe = AudioEngine.subscribe((mainIds, testIds) => {
      setPlayingMainIds(mainIds);
      setPlayingTestIds(testIds);
    });
    return unsubscribe;
  }, []);

  // Load Sounds and Tags
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [soundList, tagList] = await Promise.all([
        fetchSounds(),
        fetchTags(),
      ]);
      setSounds(soundList);
      setTags(tagList);
    } catch (err) {
      console.error('Error loading soundboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global Keyboard Shortcuts (Number -> Saída 1 | Shift + Number -> Saída de Teste 2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      // Panic stop on 'B' or Escape (when not holding shift with a hotkey 'B')
      if (e.key === 'Escape' || (e.key.toLowerCase() === 'b' && !sounds.some((s) => s.hotkey?.toUpperCase() === 'B'))) {
        AudioEngine.stopAll();
        return;
      }

      const isShift = e.shiftKey;
      let pressedKey = e.key.toUpperCase();

      // Normalize digit keys if Shift is pressed (e.g. on US keyboard Shift+1 is '!', on PT-BR Shift+1 is '!')
      let digitKey: string | null = null;
      if (e.code && e.code.startsWith('Digit')) {
        digitKey = e.code.replace('Digit', '');
      } else if (e.code && e.code.startsWith('Numpad')) {
        digitKey = e.code.replace('Numpad', '');
      }

      // Match hotkeys
      const matched = sounds.find((s) => {
        if (!s.hotkey) return false;
        const hk = s.hotkey.toUpperCase();
        return hk === pressedKey || (digitKey && hk === digitKey);
      });

      if (matched) {
        e.preventDefault();
        // If Shift is held down -> routes to Secondary Output (Test Pill)
        // Otherwise -> routes to Primary Output (Broadcast / Main)
        AudioEngine.play(matched, isShift);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sounds]);

  // Handlers for Sounds
  const handlePlayMain = (sound: SoundItem) => {
    AudioEngine.play(sound, false);
  };

  const handlePlayTest = (sound: SoundItem) => {
    // Routes directly to secondary output device (Test Pill)
    AudioEngine.play(sound, true);
  };

  const handleStop = (soundId: string) => {
    AudioEngine.stop(soundId);
  };

  const handleToggleFavorite = async (sound: SoundItem) => {
    try {
      const updated = await updateSound(sound.id, { isFavorite: !sound.isFavorite });
      setSounds((prev) => prev.map((s) => (s.id === sound.id ? updated : s)));
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  const handleSaveSoundEdit = async (id: string, updates: Partial<SoundItem>) => {
    try {
      const updated = await updateSound(id, updates);
      setSounds((prev) => prev.map((s) => (s.id === id ? updated : s)));
      const refreshedTags = await fetchTags();
      setTags(refreshedTags);
    } catch (err) {
      console.error('Failed to update sound', err);
    }
  };

  const handleDeleteSound = async (id: string) => {
    try {
      await deleteSound(id);
      setSounds((prev) => prev.filter((s) => s.id !== id));
      const refreshedTags = await fetchTags();
      setTags(refreshedTags);
    } catch (err) {
      console.error('Failed to delete sound', err);
    }
  };

  const handleAddSound = async (soundData: Partial<SoundItem>) => {
    try {
      const created = await createSound(soundData);
      setSounds((prev) => [created, ...prev]);
      const refreshedTags = await fetchTags();
      setTags(refreshedTags);
      setActiveTab('library');
    } catch (err) {
      console.error('Failed to add sound', err);
    }
  };

  // Tag Filtering Logic
  const handleToggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  const handleClearTags = () => {
    setSelectedTags([]);
  };

  // Filtered sound list
  const filteredSounds = useMemo(() => {
    return sounds.filter((s) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesTag = s.tags.some((t) => t.toLowerCase().includes(q));
        const matchesHotkey = s.hotkey && s.hotkey.toLowerCase() === q;
        if (!matchesTitle && !matchesTag && !matchesHotkey) return false;
      }

      // Tag filter (AND logic for selected tags)
      if (selectedTags.length > 0) {
        const soundTags = s.tags.map((t) => t.toLowerCase());
        const hasAllTags = selectedTags.every((t) => soundTags.includes(t.toLowerCase()));
        if (!hasAllTags) return false;
      }

      // Source filter
      if (selectedSource && s.source !== selectedSource) {
        return false;
      }

      // Favorite filter
      if (onlyFavorites && !s.isFavorite) {
        return false;
      }

      return true;
    });
  }, [sounds, searchQuery, selectedTags, selectedSource, onlyFavorites]);

  return (
    <div className="app-container">
      {/* Top SteamOS Header Bar */}
      <HeaderBar
        onOpenAudioRouting={() => setIsAudioRoutingOpen(true)}
        config={audioConfig}
        onConfigChange={(newCfg) => setAudioConfig((prev) => ({ ...prev, ...newCfg }))}
      />

      {/* Steam Deck Tab Switcher */}
      <NavigationTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        soundCount={sounds.length}
      />

      {/* TAB: SOUNDBOARD LIBRARY */}
      {activeTab === 'library' && (
        <main>
          {/* Tag Filter & Action Bar */}
          <TagFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            tags={tags}
            selectedTags={selectedTags}
            onToggleTag={handleToggleTag}
            onClearTags={handleClearTags}
            onlyFavorites={onlyFavorites}
            onToggleFavorites={() => setOnlyFavorites((prev) => !prev)}
            selectedSource={selectedSource}
            onSelectSource={setSelectedSource}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenRecordModal={() => setIsRecordModalOpen(true)}
            onOpenImportUrlModal={() => setIsImportUrlModalOpen(true)}
          />

          {/* Sound Grid */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <div className="spinner-deck" />
            </div>
          ) : filteredSounds.length > 0 ? (
            <div className="soundboard-grid">
              {filteredSounds.map((sound) => (
                <SoundCard
                  key={sound.id}
                  sound={sound}
                  isPlayingMain={playingMainIds.has(sound.id)}
                  isPlayingTest={playingTestIds.has(sound.id)}
                  primaryDeviceLabel={audioConfig.primaryDeviceLabel}
                  secondaryDeviceLabel={audioConfig.secondaryDeviceLabel}
                  onPlayMain={handlePlayMain}
                  onPlayTest={handlePlayTest}
                  onStop={handleStop}
                  onEditTags={(s) => setEditingSound(s)}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDeleteSound}
                  onSelectTag={handleToggleTag}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state-container">
              <Radio size={48} color="var(--deck-cyan)" />
              <h3>Nenhum som encontrado para os filtros atuais</h3>
              <p>Tente limpar a busca ou explore as abas **MyInstants** e **SoundButtonsWorld** para adicionar novos memes à sua soundboard!</p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  className="btn-steamdeck btn-steamdeck-amber"
                  onClick={() => setActiveTab('myinstants')}
                >
                  🔥 Explorar MyInstants
                </button>
                <button
                  className="btn-steamdeck btn-steamdeck-primary"
                  onClick={() => setActiveTab('soundbuttonsworld')}
                >
                  🌐 Explorar SoundButtonsWorld
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* TAB: EXPLORE MYINSTANTS */}
      {activeTab === 'myinstants' && (
        <ExploreMyInstantsTab onAddSound={handleAddSound} />
      )}

      {/* TAB: EXPLORE SOUNDBUTTONSWORLD */}
      {activeTab === 'soundbuttonsworld' && (
        <ExploreSoundButtonsWorldTab onAddSound={handleAddSound} />
      )}

      {/* TAB: AUDIO ROUTING */}
      {activeTab === 'routing' && (
        <div style={{ maxWidth: '750px', margin: '0 auto', width: '100%' }}>
          <div className="tag-filter-container">
            <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem' }}>
              Configurações de Roteamento de Áudio SteamOS
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Configure a saída primária (transmissão/alto-falantes) e a saída secundária da <strong>Pílula de Teste</strong> para prévia privada em fones.
            </p>
            <button
              className="btn-steamdeck btn-steamdeck-primary"
              style={{ width: 'fit-content' }}
              onClick={() => setIsAudioRoutingOpen(true)}
            >
              Abrir Painel Completo de Roteamento de Áudio & Teste
            </button>
          </div>
        </div>
      )}

      {/* TAB: HOTKEYS & GAMEPAD */}
      {activeTab === 'hotkeys' && (
        <HotkeysTab
          sounds={sounds}
          onPlaySound={handlePlayMain}
          onEditSound={(s) => setEditingSound(s)}
        />
      )}

      {/* MODALS */}
      <AudioRoutingModal
        isOpen={isAudioRoutingOpen}
        onClose={() => setIsAudioRoutingOpen(false)}
        config={audioConfig}
        onSaveConfig={(newCfg) => setAudioConfig((prev) => ({ ...prev, ...newCfg }))}
      />

      <TagEditorModal
        isOpen={Boolean(editingSound)}
        sound={editingSound}
        onClose={() => setEditingSound(null)}
        onSave={handleSaveSoundEdit}
      />

      <AddSoundModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSoundAdded={handleAddSound}
      />

      <RecordSoundModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSoundRecorded={handleAddSound}
      />

      <ImportUrlModal
        isOpen={isImportUrlModalOpen}
        onClose={() => setIsImportUrlModalOpen(false)}
        onImportSound={handleAddSound}
      />

      {/* Bottom SteamOS Dock with button hints & visualizer */}
      <GamepadOverlay />
    </div>
  );
};
