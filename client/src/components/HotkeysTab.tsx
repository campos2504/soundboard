import React from 'react';
import { Keyboard, Play, Headphones, Zap, Radio } from 'lucide-react';
import type { SoundItem } from '../types';

interface HotkeysTabProps {
  sounds: SoundItem[];
  onPlaySound: (sound: SoundItem) => void;
  onEditSound: (sound: SoundItem) => void;
}

export const HotkeysTab: React.FC<HotkeysTabProps> = ({
  sounds,
  onPlaySound,
  onEditSound,
}) => {
  const soundsWithHotkeys = sounds.filter((s) => Boolean(s.hotkey));
  const soundsWithoutHotkeys = sounds.filter((s) => !s.hotkey);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Dual Hotkey Routing Guide Box */}
      <div className="tag-filter-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(26,159,255,0.2), rgba(0,210,255,0.1))',
              border: '1px solid var(--deck-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={22} color="var(--deck-cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Atalhos Rápidos com Roteamento Duplo</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Use seu teclado ou teclado numérico para disparar os sons na transmissão ou ouvir a prévia privada em seus fones!
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem', background: 'rgba(26,159,255,0.08)', borderRadius: '10px', border: '1px solid rgba(26,159,255,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--deck-cyan-light)', fontWeight: 700, fontSize: '0.85rem' }}>
              <Radio size={15} />
              <span>Apenas a Tecla [ 1 - 9 ]</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Toca o som no <strong>Canal Principal (Saída 1 / Discord / Live)</strong>.
            </p>
          </div>

          <div style={{ padding: '0.75rem', background: 'rgba(255,119,0,0.08)', borderRadius: '10px', border: '1px solid rgba(255,119,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffaa44', fontWeight: 700, fontSize: '0.85rem' }}>
              <Headphones size={15} />
              <span>Shift + Tecla [ Shift + 1 - 9 ]</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Pílula de Teste: Toca <strong>exclusivamente na Saída 2 (Fones de Ouvido)</strong>.
            </p>
          </div>

          <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.08)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ff7777', fontWeight: 700, fontSize: '0.85rem' }}>
              <Keyboard size={15} />
              <span>Tecla [ Esc ]</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              <strong>Parada de Emergência:</strong> Interrompe imediatamente todos os sons.
            </p>
          </div>
        </div>
      </div>

      {/* Hotkeys Table & Mapping */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Keyboard size={20} color="var(--deck-cyan)" />
          Sons com Atalhos Mapeados ({soundsWithHotkeys.length})
        </h3>

        {soundsWithHotkeys.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {soundsWithHotkeys.map((s) => (
              <div
                key={s.id}
                className="sound-card-item"
                style={{ minHeight: 'auto', borderLeftColor: s.color || 'var(--deck-cyan)', borderLeftWidth: '4px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span className="hotkey-badge" title="Tocar na Saída 1">
                        {s.hotkey}
                      </span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'monospace' }}>
                        +Shift
                      </span>
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: '#fff', display: 'block' }}>{s.title}</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Tecla: [{s.hotkey}] • Teste: [Shift+{s.hotkey}]
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      className="btn-steamdeck btn-steamdeck-primary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      onClick={() => onPlaySound(s)}
                      title={`Tocar [${s.hotkey}]`}
                    >
                      <Play size={12} fill="#fff" />
                      <span>Tocar</span>
                    </button>
                    <button
                      className="btn-steamdeck btn-steamdeck-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      onClick={() => onEditSound(s)}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state-container" style={{ padding: '2rem' }}>
            <Keyboard size={36} color="var(--text-muted)" />
            <h4>Nenhum atalho de teclado configurado</h4>
            <p>Clique no ícone de tag em qualquer som na Soundboard para atribuir uma tecla rápida.</p>
          </div>
        )}
      </div>

      {/* Soundboard items without hotkeys */}
      {soundsWithoutHotkeys.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Outros sons na biblioteca (Clique para atribuir tecla):
          </h4>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {soundsWithoutHotkeys.map((s) => (
              <button
                key={s.id}
                className="tag-pill"
                onClick={() => onEditSound(s)}
                title="Clique para adicionar atalho"
              >
                <span>+ [ ] {s.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
