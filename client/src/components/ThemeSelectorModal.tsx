import React from 'react';
import { X, Palette, Check } from 'lucide-react';
import { THEME_OPTIONS, ThemeService, type GlobalTheme } from '../services/ThemeService';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: GlobalTheme;
  onSelectTheme: (theme: GlobalTheme) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-deck" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-deck">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Palette size={22} color="var(--neon-cyan)" />
            <h2>Temas Globais de Iluminação da Interface</h2>
          </div>
          <button className="icon-btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1rem 0' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Alterne a atmosfera visual de toda a Soundboard com paletas estéticas retrô dos anos 90 e neon cyberpunk:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
            {THEME_OPTIONS.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => {
                    ThemeService.setTheme(theme.id);
                    onSelectTheme(theme.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1.15rem',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(0, 240, 255, 0.12)' : 'rgba(20, 15, 40, 0.6)',
                    border: isSelected ? '2px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: isSelected ? '0 0 20px rgba(0, 240, 255, 0.3)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Dual Color Dot Indicator */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: theme.primaryColor,
                          boxShadow: `0 0 10px ${theme.primaryColor}`,
                        }}
                      />
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: theme.secondaryColor,
                          boxShadow: `0 0 10px ${theme.secondaryColor}`,
                        }}
                      />
                    </div>

                    <div>
                      <strong style={{ fontSize: '0.95rem', color: isSelected ? '#ffffff' : '#e2e8f0', display: 'block' }}>
                        {theme.badge} — {theme.name}
                      </strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Cores de destaque: {theme.primaryColor} e {theme.secondaryColor}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isSelected ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--neon-green)',
                          background: 'rgba(0, 255, 136, 0.15)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(0, 255, 136, 0.3)',
                        }}
                      >
                        <Check size={14} /> Ativo
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn-steamdeck btn-steamdeck-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        Ativar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button type="button" className="btn-steamdeck btn-steamdeck-primary" onClick={onClose}>
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
