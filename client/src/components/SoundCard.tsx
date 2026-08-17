import React from 'react';
import { Play, Square, Headphones, Star, Edit3, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SoundItem } from '../types';

interface SoundCardProps {
  sound: SoundItem;
  isPlayingMain: boolean;
  isPlayingTest: boolean;
  isEditMode?: boolean;
  primaryDeviceLabel?: string;
  secondaryDeviceLabel?: string;
  onPlayMain: (sound: SoundItem) => void;
  onPlayTest: (sound: SoundItem) => void;
  onStop: (soundId: string) => void;
  onEditTags: (sound: SoundItem) => void;
  onToggleFavorite: (sound: SoundItem) => void;
  onDelete: (soundId: string) => void;
  onSelectTag: (tag: string) => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}

export const SoundCard: React.FC<SoundCardProps> = ({
  sound,
  isPlayingMain,
  isPlayingTest,
  isEditMode = false,
  primaryDeviceLabel = 'Saída 1 (Stream)',
  secondaryDeviceLabel = 'Saída 2 (Fones)',
  onPlayMain,
  onPlayTest,
  onStop,
  onEditTags,
  onToggleFavorite,
  onDelete,
  onSelectTag,
  onMoveLeft,
  onMoveRight,
}) => {
  return (
    <div
      className={`sound-card-item ${
        isPlayingMain ? 'playing-main' : isPlayingTest ? 'playing-test' : ''
      }`}
      style={{
        borderLeftColor: sound.color || 'var(--neon-cyan)',
        borderLeftWidth: '5px',
      }}
    >
      {/* Sound Card Header */}
      <div className="card-header-row">
        <div
          className="sound-color-indicator"
          style={{ background: sound.color || 'var(--neon-cyan)', color: sound.color || 'var(--neon-cyan)' }}
          title={`Cor do Som: ${sound.color || 'Padrão'}`}
        />

        <div
          className="sound-title-text"
          title={sound.title}
          style={{ cursor: 'pointer' }}
          onClick={() => onEditTags(sound)}
        >
          {sound.title}
        </div>

        <div className="card-top-actions">
          {sound.hotkey && (
            <span
              className="hotkey-badge"
              title={`Atalho: Tecla [ ${sound.hotkey} ] toca na Saída 1 | [ Shift + ${sound.hotkey} ] toca na Saída 2`}
            >
              {sound.hotkey}
            </span>
          )}

          <button
            className={`icon-btn-ghost ${sound.isFavorite ? 'favorite-active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(sound);
            }}
            title={sound.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
          >
            <Star size={14} fill={sound.isFavorite ? 'var(--neon-yellow)' : 'none'} color={sound.isFavorite ? 'var(--neon-yellow)' : 'var(--text-muted)'} />
          </button>

          <button
            className="icon-btn-ghost"
            style={{ color: 'var(--neon-cyan)' }}
            onClick={(e) => {
              e.stopPropagation();
              onEditTags(sound);
            }}
            title="Editar Som (Nome, Tags, Cor, Atalho, Volume, Áudio)"
          >
            <Edit3 size={14} />
          </button>

          {isEditMode && (
            <button
              className="icon-btn-ghost"
              style={{ color: '#ff7777' }}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Deseja excluir "${sound.title}" da Soundboard?`)) {
                  onDelete(sound.id);
                }
              }}
              title="Excluir Som"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Edit Mode Quick Reordering Bar */}
      {isEditMode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 240, 255, 0.08)',
            border: '1px solid rgba(0, 240, 255, 0.25)',
            borderRadius: '6px',
            padding: '2px 6px',
            margin: '4px 0',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: 'var(--neon-cyan)', fontWeight: 600 }}>Posição:</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {onMoveLeft && (
              <button
                type="button"
                className="icon-btn-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveLeft();
                }}
                title="Mover para esquerda"
              >
                <ChevronLeft size={16} color="var(--neon-cyan)" />
              </button>
            )}
            {onMoveRight && (
              <button
                type="button"
                className="icon-btn-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveRight();
                }}
                title="Mover para direita"
              >
                <ChevronRight size={16} color="var(--neon-cyan)" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tags Chips inside Sound Card */}
      <div className="card-tags-list">
        {sound.tags && sound.tags.length > 0 ? (
          sound.tags.map((tag) => (
            <span
              key={tag}
              className="card-tag-pill"
              onClick={(e) => {
                e.stopPropagation();
                onSelectTag(tag);
              }}
              title={`Filtrar por #${tag}`}
            >
              #{tag}
            </span>
          ))
        ) : (
          <span
            className="card-tag-pill"
            style={{ opacity: 0.6, fontStyle: 'italic', cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onEditTags(sound);
            }}
          >
            + Adicionar tags
          </span>
        )}
      </div>

      {/* 90s Dual Action Buttons */}
      <div className="card-actions-row">
        {/* MAIN PLAY BUTTON */}
        <button
          className={`btn-deck-play ${isPlayingMain ? 'is-playing' : ''}`}
          onClick={() => (isPlayingMain ? onStop(sound.id) : onPlayMain(sound))}
          title={`Tocar na Saída Principal: ${primaryDeviceLabel}`}
        >
          {isPlayingMain ? (
            <>
              <Square size={13} fill="#fff" />
              <span>Parar</span>
            </>
          ) : (
            <>
              <Play size={13} fill="#fff" />
              <span>Tocar</span>
            </>
          )}
        </button>

        {/* DEDICATED TEST PILL BUTTON */}
        <button
          className={`btn-deck-test-pill ${isPlayingTest ? 'is-testing' : ''}`}
          onClick={() => (isPlayingTest ? onStop(sound.id) : onPlayTest(sound))}
          title={`Pílula de Teste: Ouvir nos fones na Saída 2 (${secondaryDeviceLabel})`}
        >
          <Headphones size={13} />
          <span>{isPlayingTest ? 'Parar' : 'Testar'}</span>
        </button>
      </div>
    </div>
  );
};
