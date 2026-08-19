import React, { useState, useEffect } from 'react';
import {
  Keyboard,
  Play,
  Headphones,
  Zap,
  Sparkles,
  Sliders,
  Check,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Trash2,
  Settings,
} from 'lucide-react';
import type { SoundItem } from '../types';

type HotkeyStrategy = 'standard_qwerty' | 'numpad_only' | 'letters_only' | 'custom' | 'manual';

const STRATEGY_PRESETS: Record<string, { label: string; description: string; sequence: string[] }> = {
  standard_qwerty: {
    label: 'Padrão Arcade (1-0 ➔ QWERTY)',
    description: 'Números de 1 a 0 seguidos pelas linhas do teclado QWERTY.',
    sequence: [
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
      'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
      'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
      'Z', 'X', 'C', 'V', 'B', 'N', 'M',
    ],
  },
  numpad_only: {
    label: 'Apenas Números (1 a 0)',
    description: 'Atribui apenas dígitos numéricos (ideal para teclado numérico).',
    sequence: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  },
  letters_only: {
    label: 'Apenas Letras (Q a M)',
    description: 'Atribui apenas teclas de letras, sem números.',
    sequence: [
      'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
      'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
      'Z', 'X', 'C', 'V', 'B', 'N', 'M',
    ],
  },
  custom: {
    label: 'Sequência Customizada',
    description: 'Defina manualmente a ordem exata de teclas que deseja usar.',
    sequence: [],
  },
  manual: {
    label: 'Modo 100% Manual (Sem Auto-Atribuição)',
    description: 'Não altera atalhos ao mover cards. Cada som mantém seu atalho fixo.',
    sequence: [],
  },
};

interface HotkeysTabProps {
  sounds: SoundItem[];
  soundboardTabs: string[];
  activeSoundboardTab: string;
  onUpdateSound: (id: string, updates: Partial<SoundItem>) => Promise<void>;
  onBatchUpdateSounds: (updates: Array<{ id: string; hotkey?: string }>) => Promise<void>;
  onReorderSounds: (newOrderedIds: string[]) => Promise<void>;
  onPlaySound: (sound: SoundItem) => void;
  onPlayTest: (sound: SoundItem) => void;
}

export const HotkeysTab: React.FC<HotkeysTabProps> = ({
  sounds,
  soundboardTabs,
  activeSoundboardTab: initialTab,
  onUpdateSound,
  onBatchUpdateSounds,
  onReorderSounds,
  onPlaySound,
  onPlayTest,
}) => {
  const [selectedTab, setSelectedTab] = useState<string>(initialTab || 'Geral');
  const [strategy, setStrategy] = useState<HotkeyStrategy>(() => {
    return (localStorage.getItem('soundboard_hotkey_strategy') as HotkeyStrategy) || 'standard_qwerty';
  });
  const [autoAssignOnDrag, setAutoAssignOnDrag] = useState<boolean>(() => {
    const saved = localStorage.getItem('soundboard_auto_assign_on_drag');
    return saved !== null ? saved === 'true' : true;
  });
  const [customSequenceStr, setCustomSequenceStr] = useState<string>(() => {
    return localStorage.getItem('soundboard_custom_sequence') || '1234567890QWERTYUIOPASDFGHJKLZXCVBNM';
  });

  const [editingHotkeyId, setEditingHotkeyId] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync selectedTab if initialTab changes
  useEffect(() => {
    if (initialTab && soundboardTabs.includes(initialTab)) {
      setSelectedTab(initialTab);
    }
  }, [initialTab, soundboardTabs]);

  // Persist settings
  const handleStrategyChange = (newStrategy: HotkeyStrategy) => {
    setStrategy(newStrategy);
    localStorage.setItem('soundboard_hotkey_strategy', newStrategy);
  };

  const handleToggleAutoAssign = () => {
    const next = !autoAssignOnDrag;
    setAutoAssignOnDrag(next);
    localStorage.setItem('soundboard_auto_assign_on_drag', String(next));
  };

  const handleCustomSequenceChange = (val: string) => {
    const sanitized = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    setCustomSequenceStr(sanitized);
    localStorage.setItem('soundboard_custom_sequence', sanitized);
  };

  // Get active sequence array
  const getActiveSequence = (): string[] => {
    if (strategy === 'custom') {
      return customSequenceStr.split('');
    }
    return STRATEGY_PRESETS[strategy]?.sequence || [];
  };

  // Sounds in the currently selected tab
  const tabSounds = sounds.filter((s) => (s.tab || 'Geral').trim() === selectedTab.trim());

  // Conflict detector: find duplicate hotkeys within this tab
  const hotkeyCounts: Record<string, number> = {};
  for (const s of tabSounds) {
    if (s.hotkey) {
      const hk = s.hotkey.toUpperCase().trim();
      hotkeyCounts[hk] = (hotkeyCounts[hk] || 0) + 1;
    }
  }

  // Batch Apply Sequence to Tab
  const handleApplySequenceToTab = async (targetTabName?: string) => {
    const target = targetTabName || selectedTab;
    const targetSounds = sounds.filter((s) => (s.tab || 'Geral').trim() === target.trim());
    const seq = getActiveSequence();

    if (seq.length === 0 && strategy !== 'manual') {
      alert('A sequência de teclas está vazia. Digite algumas letras ou números.');
      return;
    }

    const updates: Array<{ id: string; hotkey?: string }> = targetSounds.map((s, idx) => ({
      id: s.id,
      hotkey: idx < seq.length ? seq[idx] : undefined,
    }));

    await onBatchUpdateSounds(updates);
    setSaveSuccessMsg(`Sequência aplicada com sucesso para a aba "${target}"!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Batch Apply to ALL Tabs
  const handleApplyToAllTabs = async () => {
    if (!confirm('Deseja aplicar a sequência de atalhos a TODAS as abas da Soundboard?')) return;

    const seq = getActiveSequence();
    const updates: Array<{ id: string; hotkey?: string }> = [];

    for (const t of soundboardTabs) {
      const tabItems = sounds.filter((s) => (s.tab || 'Geral').trim() === t.trim());
      tabItems.forEach((s, idx) => {
        updates.push({
          id: s.id,
          hotkey: idx < seq.length ? seq[idx] : undefined,
        });
      });
    }

    await onBatchUpdateSounds(updates);
    setSaveSuccessMsg('Sequência aplicada a todas as abas com sucesso!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Clear Hotkeys in Current Tab
  const handleClearTabHotkeys = async () => {
    if (!confirm(`Deseja remover todos os atalhos da aba "${selectedTab}"?`)) return;
    const updates = tabSounds.map((s) => ({ id: s.id, hotkey: undefined }));
    await onBatchUpdateSounds(updates);
    setSaveSuccessMsg(`Atalhos da aba "${selectedTab}" removidos!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Move Sound Up or Down within Tab
  const handleMoveSound = async (soundId: string, direction: 'up' | 'down') => {
    const currentIndex = tabSounds.findIndex((s) => s.id === soundId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= tabSounds.length) return;

    const reorderedTab = [...tabSounds];
    const [moved] = reorderedTab.splice(currentIndex, 1);
    reorderedTab.splice(targetIndex, 0, moved);

    // If auto-assign is on, update hotkeys to match new positions
    if (autoAssignOnDrag && strategy !== 'manual') {
      const seq = getActiveSequence();
      reorderedTab.forEach((s, idx) => {
        s.hotkey = idx < seq.length ? seq[idx] : undefined;
      });
    }

    // Reassemble full soundboard preserving tab groups in deterministic soundboardTabs order
    const orderedTabs = Array.from(new Set(['Geral', ...soundboardTabs]));
    const targetNorm = selectedTab.trim();
    const fullReordered: SoundItem[] = [];

    const tabGroups = new Map<string, SoundItem[]>();
    for (const s of sounds) {
      const t = (s.tab || 'Geral').trim();
      if (t === targetNorm) continue;
      if (!tabGroups.has(t)) tabGroups.set(t, []);
      tabGroups.get(t)!.push(s);
    }

    for (const t of orderedTabs) {
      const tNorm = t.trim();
      if (tNorm === targetNorm) {
        fullReordered.push(...reorderedTab);
      } else if (tabGroups.has(tNorm)) {
        fullReordered.push(...tabGroups.get(tNorm)!);
        tabGroups.delete(tNorm);
      }
    }

    for (const [_, leftoverList] of tabGroups.entries()) {
      fullReordered.push(...leftoverList);
    }

    await onReorderSounds(fullReordered.map((s) => s.id));

    if (autoAssignOnDrag && strategy !== 'manual') {
      await onBatchUpdateSounds(reorderedTab.map((s) => ({ id: s.id, hotkey: s.hotkey })));
    }
  };

  // Inline Hotkey Key Listener for Single Sound
  const handleStartEditingHotkey = (soundId: string) => {
    setEditingHotkeyId(soundId);
  };

  useEffect(() => {
    if (!editingHotkeyId) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setEditingHotkeyId(null);
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        await onUpdateSound(editingHotkeyId, { hotkey: undefined });
        setEditingHotkeyId(null);
        return;
      }

      const raw = e.key.toUpperCase();
      if (/^[A-Z0-9]$/.test(raw)) {
        await onUpdateSound(editingHotkeyId, { hotkey: raw });
        setEditingHotkeyId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingHotkeyId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
      {/* Header Banner */}
      <div className="tag-filter-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(255,230,0,0.2), rgba(0,240,255,0.15))',
                border: '1px solid var(--neon-yellow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(255,230,0,0.3)',
              }}
            >
              <Settings size={24} color="var(--neon-yellow)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Central de Mapeamento & Ordem dos Atalhos
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Personalize a sequência das teclas, alterne entre modos automáticos ou manuais e configure a ordem de cada aba.
              </p>
            </div>
          </div>

          {/* Quick Dual Routing Pill Reminder */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(0,0,0,0.4)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
            }}
          >
            <span><strong>Dica:</strong> [Tecla] = Saída 1 | [Shift + Tecla] = Fones</span>
          </div>
        </div>

        {saveSuccessMsg && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.65rem 1rem',
              background: 'rgba(0, 255, 136, 0.15)',
              border: '1px solid #00ff88',
              borderRadius: '8px',
              color: '#00ff88',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Check size={16} />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* STRATEGY CONFIGURATION CARD */}
      <div className="tag-filter-container">
        <h3 style={{ fontSize: '1rem', color: '#ffffff', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sliders size={18} color="var(--neon-cyan)" />
          1. Escolha a Estratégia de Atribuição de Atalhos
        </h3>

        {/* Strategy Selector Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {Object.entries(STRATEGY_PRESETS).map(([key, preset]) => {
            const isSelected = strategy === key;
            return (
              <div
                key={key}
                onClick={() => handleStrategyChange(key as HotkeyStrategy)}
                style={{
                  padding: '0.85rem',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(0, 240, 255, 0.12)' : 'rgba(15, 10, 30, 0.6)',
                  border: isSelected ? '2px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: isSelected ? '0 0 20px rgba(0, 240, 255, 0.3)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '0.9rem', color: isSelected ? 'var(--neon-cyan)' : '#ffffff' }}>
                    {preset.label}
                  </strong>
                  {isSelected && <Check size={16} color="var(--neon-cyan)" />}
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                  {preset.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Custom Sequence Input Box (Visible when 'custom' is selected) */}
        {strategy === 'custom' && (
          <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: '1px solid rgba(255,230,0,0.3)' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--neon-yellow)', marginBottom: '6px' }}>
              Digite os caracteres na ordem desejada (ex: WASD123456QER...):
            </label>
            <input
              type="text"
              value={customSequenceStr}
              onChange={(e) => handleCustomSequenceChange(e.target.value)}
              placeholder="Digite a ordem de teclas..."
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                background: '#0a0614',
                border: '1px solid var(--neon-yellow)',
                borderRadius: '6px',
                color: '#ffffff',
                fontFamily: 'monospace',
                fontSize: '1rem',
                letterSpacing: '2px',
                outline: 'none',
              }}
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Total de teclas configuradas: <strong>{customSequenceStr.length}</strong> (serão atribuídas na ordem da esquerda para a direita).
            </p>
          </div>
        )}

        {/* Auto-assign toggle on Drag & Drop */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', display: 'block' }}>
              Auto-atualizar atalhos ao arrastar cards (Drag & Drop)
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Quando ativado, arrastar uma fita K7 no grid atualiza a tecla do som para a posição onde foi solta.
            </span>
          </div>

          <button
            type="button"
            className={`btn-steamdeck ${autoAssignOnDrag ? 'btn-steamdeck-primary' : 'btn-steamdeck-secondary'}`}
            onClick={handleToggleAutoAssign}
          >
            {autoAssignOnDrag ? '✓ Auto-Atribuição Ativada' : '✕ Modo Fixo (Não Alterar ao Arrastar)'}
          </button>
        </div>
      </div>

      {/* TAB SELECTOR & BATCH ACTIONS */}
      <div className="tag-filter-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', color: '#ffffff', margin: 0 }}>
              2. Selecione a Aba para Mapear & Reordenar
            </h3>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Cada aba possui seu próprio grid de teclas independentes.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-steamdeck btn-steamdeck-primary"
              onClick={() => handleApplySequenceToTab()}
              title="Aplica a sequência selecionada aos sons desta aba"
            >
              <Zap size={14} />
              <span>Aplicar Sequência nesta Aba</span>
            </button>

            <button
              type="button"
              className="btn-steamdeck btn-steamdeck-amber"
              onClick={handleApplyToAllTabs}
              title="Aplica a sequência a todas as abas da soundboard"
            >
              <Sparkles size={14} />
              <span>Aplicar a Todas as Abas</span>
            </button>

            <button
              type="button"
              className="btn-steamdeck"
              style={{ background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)', color: '#ff7777' }}
              onClick={handleClearTabHotkeys}
              title="Limpa os atalhos desta aba"
            >
              <Trash2 size={14} />
              <span>Limpar Atalhos</span>
            </button>
          </div>
        </div>

        {/* Tab Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {soundboardTabs.map((t) => {
            const isTabSelected = selectedTab === t;
            const count = sounds.filter((s) => (s.tab || 'Geral').trim() === t.trim()).length;
            return (
              <button
                key={t}
                type="button"
                className={`tag-pill ${isTabSelected ? 'active' : ''}`}
                onClick={() => setSelectedTab(t)}
                style={{ fontSize: '0.85rem', padding: '6px 12px' }}
              >
                <span>{t}</span>
                <span className="tag-pill-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* REORDERABLE SOUNDS LIST WITH INLINE HOTKEY MAPPING */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Keyboard size={18} color="var(--neon-cyan)" />
            Ordem dos Cards & Atalhos na Aba "{selectedTab}" ({tabSounds.length} sons)
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Clique na tecla para editar diretamente ou use as setas para subir/descer na ordem.
          </span>
        </div>

        {tabSounds.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tabSounds.map((sound, idx) => {
              const hk = sound.hotkey ? sound.hotkey.toUpperCase().trim() : '';
              const hasConflict = hk ? (hotkeyCounts[hk] || 0) > 1 : false;
              const isEditingThis = editingHotkeyId === sound.id;

              return (
                <div
                  key={sound.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(23, 19, 48, 0.85)',
                    border: hasConflict
                      ? '1px solid #ef4444'
                      : isEditingThis
                      ? '1px solid var(--neon-yellow)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    gap: '1rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Left: Position Number & Hotkey Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        minWidth: '28px',
                      }}
                    >
                      #{idx + 1}
                    </span>

                    {/* Interactive Hotkey Badge */}
                    <button
                      type="button"
                      onClick={() => handleStartEditingHotkey(sound.id)}
                      className="hotkey-badge"
                      style={{
                        minWidth: '38px',
                        height: '30px',
                        fontSize: '1.2rem',
                        background: isEditingThis ? 'var(--neon-yellow)' : '#090618',
                        color: isEditingThis ? '#000000' : hasConflict ? '#ef4444' : 'var(--neon-yellow)',
                        border: isEditingThis ? '2px solid #ffffff' : hasConflict ? '2px solid #ef4444' : undefined,
                        cursor: 'pointer',
                      }}
                      title={isEditingThis ? 'Pressione qualquer tecla ou Backspace para limpar' : 'Clique para alterar a tecla'}
                    >
                      {isEditingThis ? '...' : sound.hotkey || '-'}
                    </button>

                    {/* Sound Title & Color Bar */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: sound.color || 'var(--neon-cyan)',
                          }}
                        />
                        <strong style={{ fontSize: '0.95rem', color: '#ffffff' }}>
                          {sound.title}
                        </strong>
                      </div>
                      {hasConflict && (
                        <span style={{ fontSize: '0.7rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <AlertTriangle size={11} /> Tecla duplicada nesta aba!
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Reorder Up/Down Arrows & Audio Previews */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Move Up Button */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      className="k7-pos-btn"
                      onClick={() => handleMoveSound(sound.id, 'up')}
                      title="Mover para cima na lista"
                      style={{ opacity: idx === 0 ? 0.3 : 1 }}
                    >
                      <ArrowUp size={14} />
                    </button>

                    {/* Move Down Button */}
                    <button
                      type="button"
                      disabled={idx === tabSounds.length - 1}
                      className="k7-pos-btn"
                      onClick={() => handleMoveSound(sound.id, 'down')}
                      title="Mover para baixo na lista"
                      style={{ opacity: idx === tabSounds.length - 1 ? 0.3 : 1 }}
                    >
                      <ArrowDown size={14} />
                    </button>

                    {/* Play Main Button */}
                    <button
                      type="button"
                      className="btn-steamdeck btn-steamdeck-primary"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      onClick={() => onPlaySound(sound)}
                      title="Tocar na Saída 1"
                    >
                      <Play size={12} fill="#ffffff" />
                      <span>Tocar</span>
                    </button>

                    {/* Test Button */}
                    <button
                      type="button"
                      className="btn-steamdeck btn-steamdeck-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      onClick={() => onPlayTest(sound)}
                      title="Ouvir na Saída 2 (Fones)"
                    >
                      <Headphones size={12} />
                      <span>Testar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state-container" style={{ padding: '2.5rem' }}>
            <Keyboard size={36} color="var(--text-muted)" />
            <h4>Nenhum som encontrado na aba "{selectedTab}"</h4>
            <p>Adicione ou mova sons para esta aba para configurar a ordem e os atalhos de teclado.</p>
          </div>
        )}
      </div>
    </div>
  );
};
