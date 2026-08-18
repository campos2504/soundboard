import { useState, useEffect, useMemo, useCallback } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { NavigationTabs } from './components/NavigationTabs';
import type { TabType } from './components/NavigationTabs';
import { TagFilterBar } from './components/TagFilterBar';
import { SoundboardTabsBar } from './components/SoundboardTabsBar';
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
import { ObsOverlayView } from './components/ObsOverlayView';
import { ObsModal } from './components/ObsModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { ThemeService, type GlobalTheme } from './services/ThemeService';

import type { SoundItem, TagInfo, AudioRoutingConfig } from './types';
import { fetchSounds, fetchTags, createSound, updateSound, deleteSound, reorderSounds } from './services/api';
import { AudioEngine } from './services/AudioEngine';
import { ProceduralAudio } from './services/ProceduralAudio';
import { Radio } from 'lucide-react';

export default function App() {
  const isOverlayMode = typeof window !== 'undefined' && window.location.search.includes('overlay=true');

  const [sounds, setSounds] = useState<SoundItem[]>([]);
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<GlobalTheme>(() => ThemeService.getTheme());

  useEffect(() => {
    return ThemeService.subscribe(setCurrentTheme);
  }, []);

  // Soundboard Profiles / Pages / Tabs
  const [soundboardTabs, setSoundboardTabs] = useState<string[]>(() => {
    const saved = localStorage.getItem('soundboard_custom_tabs');
    const base = ['Geral', 'Rodrigo Faro', 'Memes & TV', 'Gaming', 'Efeitos'];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.from(new Set(['Geral', 'Rodrigo Faro', ...parsed]));
      } catch (e) {}
    }
    return base;
  });
  const [activeSoundboardTab, setActiveSoundboardTab] = useState<string>('Rodrigo Faro');

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

  // Subscribe to Audio Engine state and config changes
  useEffect(() => {
    const unsubState = AudioEngine.subscribe((mainIds, testIds) => {
      setPlayingMainIds(mainIds);
      setPlayingTestIds(testIds);
    });
    const unsubConfig = AudioEngine.subscribeConfig((newCfg) => {
      setAudioConfig(newCfg);
    });
    return () => {
      unsubState();
      unsubConfig();
    };
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

      // Merge any new tab names present in sounds
      const soundTabNames = soundList.map((s) => (s.tab || 'Geral').trim()).filter(Boolean);
      setSoundboardTabs((prev) => {
        const merged = Array.from(new Set(['Geral', ...prev, ...soundTabNames]));
        localStorage.setItem('soundboard_custom_tabs', JSON.stringify(merged));
        return merged;
      });

      // Background Pre-scan: Pre-analyze loudness profile for all sounds to detect bursts before playback
      setTimeout(() => {
        soundList.forEach((s) => {
          if (s.url) AudioEngine.analyzeSoundLoudness(s.url).catch(() => {});
        });
      }, 500);
    } catch (err) {
      console.error('Error loading soundboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global Keyboard Shortcuts (Number -> Saída 1 | Shift + Number -> Saída de Teste 2 | < and > -> Muda Aba)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      // Switch Soundboard Tabs with < and > (or , and .)
      if (e.key === '<' || e.key === ',') {
        e.preventDefault();
        ProceduralAudio.playTapeInsert();
        setSoundboardTabs((tabs) => {
          const idx = tabs.indexOf(activeSoundboardTab);
          const prevIdx = idx <= 0 ? tabs.length - 1 : idx - 1;
          const target = tabs[prevIdx] || 'Geral';
          setActiveSoundboardTab(target);
          return tabs;
        });
        return;
      }

      if (e.key === '>' || e.key === '.') {
        e.preventDefault();
        ProceduralAudio.playTapeInsert();
        setSoundboardTabs((tabs) => {
          const idx = tabs.indexOf(activeSoundboardTab);
          const nextIdx = idx >= tabs.length - 1 ? 0 : idx + 1;
          const target = tabs[nextIdx] || 'Geral';
          setActiveSoundboardTab(target);
          return tabs;
        });
        return;
      }

      // Panic stop on 'B' or Escape (when not holding shift with a hotkey 'B')
      if (e.key === 'Escape' || (e.key.toLowerCase() === 'b' && !sounds.some((s) => s.hotkey?.toUpperCase() === 'B'))) {
        AudioEngine.stopAll();
        return;
      }

      const isShift = e.shiftKey;
      let pressedKey = e.key.toUpperCase();

      // Normalize digit keys if Shift is pressed
      let digitKey: string | null = null;
      if (e.code && e.code.startsWith('Digit')) {
        digitKey = e.code.replace('Digit', '');
      } else if (e.code && e.code.startsWith('Numpad')) {
        digitKey = e.code.replace('Numpad', '');
      }

      // Match hotkeys ONLY FOR SOUNDS IN THE CURRENT ACTIVE SOUNDBOARD TAB!
      const matched = sounds.find((s) => {
        const sTab = (s.tab || 'Geral').trim();
        if (sTab !== activeSoundboardTab.trim()) return false;
        if (!s.hotkey) return false;
        const hk = s.hotkey.toUpperCase();
        return hk === pressedKey || (digitKey && hk === digitKey);
      });

      if (matched) {
        e.preventDefault();
        AudioEngine.play(matched, isShift);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sounds, activeSoundboardTab]);

  // Handlers for Sounds
  const handlePlayMain = (sound: SoundItem) => {
    AudioEngine.play(sound, false);
  };

  const handlePlayTest = (sound: SoundItem) => {
    AudioEngine.play(sound, true);
  };

  const handleStop = (soundId: string) => {
    AudioEngine.stop(soundId);
    AudioEngine.stop(`test_${soundId}`);
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
      const normalizedHotkey = updated.hotkey ? updated.hotkey.toUpperCase().trim() : undefined;
      const targetTab = (updated.tab || 'Geral').trim();

      setSounds((prev) =>
        prev.map((s) => {
          if (s.id === id) return updated;
          const sTab = (s.tab || 'Geral').trim();
          if (sTab === targetTab && normalizedHotkey && s.hotkey && s.hotkey.toUpperCase().trim() === normalizedHotkey) {
            return { ...s, hotkey: undefined };
          }
          return s;
        })
      );
      const refreshedTags = await fetchTags();
      setTags(refreshedTags);
    } catch (err) {
      console.error('Failed to update sound', err);
    }
  };

  const handleDeleteSound = async (id: string) => {
    try {
      const soundToDelete = sounds.find((s) => s.id === id);
      await deleteSound(id);

      const targetTab = (soundToDelete?.tab || activeSoundboardTab).trim();
      const remainingSounds = sounds.filter((s) => s.id !== id);

      // If auto-assign is active, resequence remaining sounds in that tab
      const seq = getCurrentHotkeySequence();
      if (seq !== null) {
        const tabSounds = remainingSounds.filter((s) => (s.tab || 'Geral').trim() === targetTab);
        tabSounds.forEach((s, idx) => {
          s.hotkey = idx < seq.length ? seq[idx] : undefined;
        });
        Promise.all(tabSounds.map((s) => updateSound(s.id, { hotkey: s.hotkey }))).catch(() => {});
      }

      setSounds(remainingSounds);
      const refreshedTags = await fetchTags();
      setTags(refreshedTags);
    } catch (err) {
      console.error('Failed to delete sound', err);
    }
  };

  const handleAddSound = async (soundData: Partial<SoundItem>) => {
    try {
      const targetTab = (soundData.tab || activeSoundboardTab).trim();
      const tabSounds = sounds.filter((s) => (s.tab || 'Geral').trim() === targetTab);
      const seq = getCurrentHotkeySequence();

      let assignedHotkey = soundData.hotkey;
      if (!assignedHotkey && seq !== null && tabSounds.length < seq.length) {
        assignedHotkey = seq[tabSounds.length];
      }

      const dataWithTab = {
        ...soundData,
        tab: targetTab,
        hotkey: assignedHotkey,
      };

      const created = await createSound(dataWithTab);
      const normalizedHotkey = created.hotkey ? created.hotkey.toUpperCase().trim() : undefined;

      setSounds((prev) => [
        ...prev.map((s) => {
          const sTab = (s.tab || 'Geral').trim();
          return sTab === targetTab && normalizedHotkey && s.hotkey && s.hotkey.toUpperCase().trim() === normalizedHotkey
            ? { ...s, hotkey: undefined }
            : s;
        }),
        created,
      ]);
      const refreshedTags = await fetchTags();
      setTags(refreshedTags);
      setActiveTab('library');
    } catch (err) {
      console.error('Failed to add sound', err);
    }
  };

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Helper to retrieve user's configured hotkey sequence (or null if manual mode)
  const getCurrentHotkeySequence = (): string[] | null => {
    const strategy = localStorage.getItem('soundboard_hotkey_strategy') || 'standard_qwerty';
    const autoAssign = localStorage.getItem('soundboard_auto_assign_on_drag');
    if (autoAssign === 'false' || strategy === 'manual') {
      return null;
    }
    if (strategy === 'numpad_only') {
      return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    }
    if (strategy === 'letters_only') {
      return [
        'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
        'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
        'Z', 'X', 'C', 'V', 'B', 'N', 'M',
      ];
    }
    if (strategy === 'custom') {
      const custom = localStorage.getItem('soundboard_custom_sequence') || '1234567890QWERTYUIOPASDFGHJKLZXCVBNM';
      return custom.split('');
    }
    return [
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
      'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
      'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
      'Z', 'X', 'C', 'V', 'B', 'N', 'M',
    ];
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const tabSounds = sounds.filter((s) => (s.tab || 'Geral').trim() === activeSoundboardTab.trim());
    if (draggedIndex < 0 || draggedIndex >= tabSounds.length || targetIndex < 0 || targetIndex >= tabSounds.length) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Splice and insert at target position
    const [moved] = tabSounds.splice(draggedIndex, 1);
    tabSounds.splice(targetIndex, 0, moved);

    ProceduralAudio.playTapeInsert();

    // Re-assign hotkeys based on user's active strategy (if not manual mode)
    const seq = getCurrentHotkeySequence();
    if (seq !== null) {
      tabSounds.forEach((s, idx) => {
        s.hotkey = idx < seq.length ? seq[idx] : undefined;
      });
    }

    // Reassemble full array
    const otherSounds = sounds.filter((s) => (s.tab || 'Geral').trim() !== activeSoundboardTab.trim());
    const updatedSounds = [...tabSounds, ...otherSounds];

    setSounds(updatedSounds);
    setDraggedIndex(null);
    setDragOverIndex(null);

    try {
      await reorderSounds(updatedSounds.map((s) => s.id));
      if (seq !== null) {
        await Promise.all(
          tabSounds.map((s) => updateSound(s.id, { hotkey: s.hotkey }))
        );
      }
    } catch (err) {
      console.error('Failed to save drag-and-drop order:', err);
    }
  };

  // Reorder Sound position: The order of cards dictates the order of hotkeys!
  const handleMoveSound = async (soundId: string, direction: 'left' | 'right') => {
    // Get sounds in the currently active tab
    const tabSounds = sounds.filter((s) => (s.tab || 'Geral').trim() === activeSoundboardTab.trim());
    const currentIndexInTab = tabSounds.findIndex((s) => s.id === soundId);
    if (currentIndexInTab === -1) return;

    const targetIndexInTab = direction === 'left' ? currentIndexInTab - 1 : currentIndexInTab + 1;
    if (targetIndexInTab < 0 || targetIndexInTab >= tabSounds.length) return;

    // Swap positions within the active tab
    const [moved] = tabSounds.splice(currentIndexInTab, 1);
    tabSounds.splice(targetIndexInTab, 0, moved);

    ProceduralAudio.playTapeInsert();

    // Re-assign hotkeys based on user's active strategy (if not manual mode)
    const seq = getCurrentHotkeySequence();
    if (seq !== null) {
      tabSounds.forEach((s, idx) => {
        s.hotkey = idx < seq.length ? seq[idx] : undefined;
      });
    }

    // Reassemble the full sounds array preserving other tabs
    const otherSounds = sounds.filter((s) => (s.tab || 'Geral').trim() !== activeSoundboardTab.trim());
    const updatedSounds = [...tabSounds, ...otherSounds];

    setSounds(updatedSounds);

    try {
      await reorderSounds(updatedSounds.map((s) => s.id));
      if (seq !== null) {
        await Promise.all([
          updateSound(tabSounds[targetIndexInTab].id, { hotkey: tabSounds[targetIndexInTab].hotkey }),
          updateSound(tabSounds[currentIndexInTab].id, { hotkey: tabSounds[currentIndexInTab].hotkey }),
        ]);
      }
    } catch (err) {
      console.error('Failed to save soundboard order and hotkeys:', err);
    }
  };

  const handleBatchUpdateSounds = async (updates: Array<{ id: string; hotkey?: string }>) => {
    try {
      const updateMap = new Map(updates.map((u) => [u.id, u.hotkey]));
      setSounds((prev) =>
        prev.map((s) => (updateMap.has(s.id) ? { ...s, hotkey: updateMap.get(s.id) } : s))
      );
      await Promise.all(
        updates.map((u) => updateSound(u.id, { hotkey: u.hotkey }))
      );
    } catch (err) {
      console.error('Batch update sounds failed:', err);
    }
  };

  const handleReorderSoundsList = async (newOrderedIds: string[]) => {
    try {
      const soundMap = new Map(sounds.map((s) => [s.id, s]));
      const reordered = newOrderedIds.map((id) => soundMap.get(id)!).filter(Boolean);
      setSounds(reordered);
      await reorderSounds(newOrderedIds);
    } catch (err) {
      console.error('Reorder sounds failed:', err);
    }
  };

  // Soundboard Tab Management Handlers
  const handleAddTab = (newTab: string) => {
    const updated = Array.from(new Set([...soundboardTabs, newTab]));
    setSoundboardTabs(updated);
    localStorage.setItem('soundboard_custom_tabs', JSON.stringify(updated));
  };

  const handleRenameTab = async (oldName: string, newName: string) => {
    const updatedTabs = soundboardTabs.map((t) => (t === oldName ? newName : t));
    setSoundboardTabs(updatedTabs);
    localStorage.setItem('soundboard_custom_tabs', JSON.stringify(updatedTabs));
    if (activeSoundboardTab === oldName) {
      setActiveSoundboardTab(newName);
    }
    for (const s of sounds) {
      if ((s.tab || 'Geral') === oldName) {
        await updateSound(s.id, { tab: newName });
      }
    }
    await loadData();
  };

  const handleDeleteTab = async (tabToDelete: string) => {
    const updatedTabs = soundboardTabs.filter((t) => t !== tabToDelete);
    const fallback = updatedTabs.length > 0 ? updatedTabs : ['Geral'];
    setSoundboardTabs(fallback);
    localStorage.setItem('soundboard_custom_tabs', JSON.stringify(fallback));
    if (activeSoundboardTab === tabToDelete) {
      setActiveSoundboardTab('Geral');
    }
    for (const s of sounds) {
      if (s.tab === tabToDelete) {
        await updateSound(s.id, { tab: 'Geral' });
      }
    }
    await loadData();
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

  // Sound count per soundboard tab
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of sounds) {
      const t = (s.tab || 'Geral').trim();
      counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }, [sounds]);

  // Filtered sound list: Filtered by active soundboard tab + search + tags
  const filteredSounds = useMemo(() => {
    return sounds.filter((s) => {
      // Must match active soundboard tab
      const soundTab = (s.tab || 'Geral').trim();
      if (soundTab !== activeSoundboardTab.trim()) {
        return false;
      }

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
  }, [sounds, activeSoundboardTab, searchQuery, selectedTags, selectedSource, onlyFavorites]);

  if (isOverlayMode) {
    return <ObsOverlayView sounds={sounds} />;
  }

  return (
    <div className="app-container">
      {/* Top SteamOS Header Bar */}
      <HeaderBar
        onOpenAudioRouting={() => setIsAudioRoutingOpen(true)}
        onOpenObsOverlay={() => setIsObsModalOpen(true)}
        onOpenThemeSelector={() => setIsThemeModalOpen(true)}
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
          {/* Soundboard Profile / Page Switcher Bar */}
          <SoundboardTabsBar
            tabs={soundboardTabs}
            activeTab={activeSoundboardTab}
            onSelectTab={(t) => {
              ProceduralAudio.playTapeInsert();
              setActiveSoundboardTab(t);
            }}
            onAddTab={handleAddTab}
            onRenameTab={handleRenameTab}
            onDeleteTab={handleDeleteTab}
            tabCounts={tabCounts}
          />

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
            isEditMode={isEditMode}
            onToggleEditMode={() => setIsEditMode((prev) => !prev)}
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
              {filteredSounds.map((sound, idx) => (
                <SoundCard
                  key={sound.id}
                  sound={sound}
                  index={idx}
                  isPlayingMain={playingMainIds.has(sound.id)}
                  isPlayingTest={playingTestIds.has(sound.id)}
                  isEditMode={isEditMode}
                  isDragging={draggedIndex === idx}
                  isDragOver={dragOverIndex === idx}
                  primaryDeviceLabel={audioConfig.primaryDeviceLabel}
                  secondaryDeviceLabel={audioConfig.secondaryDeviceLabel}
                  onPlayMain={handlePlayMain}
                  onPlayTest={handlePlayTest}
                  onStop={handleStop}
                  onEditTags={(s) => setEditingSound(s)}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDeleteSound}
                  onSelectTag={handleToggleTag}
                  onMoveLeft={idx > 0 ? () => handleMoveSound(sound.id, 'left') : undefined}
                  onMoveRight={idx < filteredSounds.length - 1 ? () => handleMoveSound(sound.id, 'right') : undefined}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state-container">
              <Radio size={48} color="var(--deck-cyan)" />
              <h3>Nenhum som na aba "{activeSoundboardTab}"</h3>
              <p>Adicione novos memes nesta aba ou clique em <strong>✏️ Editar</strong> em qualquer som para movê-lo para esta aba!</p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  className="btn-steamdeck btn-steamdeck-primary"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  + Novo Som Nesta Aba
                </button>
                <button
                  className="btn-steamdeck btn-steamdeck-amber"
                  onClick={() => setActiveTab('myinstants')}
                >
                  🔥 Explorar MyInstants
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

      {/* TAB: HOTKEYS & SEQUENCING CONFIGURATOR */}
      {activeTab === 'hotkeys' && (
        <HotkeysTab
          sounds={sounds}
          soundboardTabs={soundboardTabs}
          activeSoundboardTab={activeSoundboardTab}
          onUpdateSound={handleSaveSoundEdit}
          onBatchUpdateSounds={handleBatchUpdateSounds}
          onReorderSounds={handleReorderSoundsList}
          onPlaySound={handlePlayMain}
          onPlayTest={handlePlayTest}
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
        availableTags={tags}
        availableSoundboardTabs={soundboardTabs}
        onClose={() => setEditingSound(null)}
        onSave={handleSaveSoundEdit}
        onDelete={handleDeleteSound}
      />

      <AddSoundModal
        isOpen={isAddModalOpen}
        availableTags={tags}
        onClose={() => setIsAddModalOpen(false)}
        onSoundAdded={handleAddSound}
      />

      <RecordSoundModal
        isOpen={isRecordModalOpen}
        availableTags={tags}
        onClose={() => setIsRecordModalOpen(false)}
        onSoundRecorded={handleAddSound}
      />

      <ImportUrlModal
        isOpen={isImportUrlModalOpen}
        availableTags={tags}
        onClose={() => setIsImportUrlModalOpen(false)}
        onImportSound={handleAddSound}
      />

      <ObsModal
        isOpen={isObsModalOpen}
        onClose={() => setIsObsModalOpen(false)}
      />

      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
      />

      {/* Bottom SteamOS Dock with button hints & visualizer */}
      <GamepadOverlay />
    </div>
  );
}
