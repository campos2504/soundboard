import React from 'react';
import { Play, Square, Headphones, Star, Tag, Trash2 } from 'lucide-react';
import type { SoundItem } from '../types';

interface SoundCardProps {
  sound: SoundItem;
  isPlayingMain: boolean;
  isPlayingTest: boolean;
  primaryDeviceLabel?: string;
  secondaryDeviceLabel?: string;
  onPlayMain: (sound: SoundItem) => void;
  onPlayTest: (sound: SoundItem) => void;
  onStop: (soundId: string) => void;
  onEditTags: (sound: SoundItem) => void;
  onToggleFavorite: (sound: SoundItem) => void;
  onDelete: (soundId: string) => void;
  onSelectTag: (tag: string) => void;
}

export const SoundCard: React.FC<SoundCardProps> = ({
  sound,
  isPlayingMain,
  isPlayingTest,
  primaryDeviceLabel = 'Saída 1 (Stream)',
  secondaryDeviceLabel = 'Saída 2 (Fones)',
  onPlayMain,
  onPlayTest,
  onStop,
  onEditTags,
  onToggleFavorite,
  onDelete,
  onSelectTag,
}) => {
  return (
    <div
      className={`streamdeck-key-card ${
        isPlayingMain ? 'playing-main' : isPlayingTest ? 'playing-test' : ''
      }`}
      style={{
        borderLeftColor: sound.color || 'var(--stream-blue)',
        borderLeftWidth: '4px',
      }}
    >
      {/* Stream Deck Key Header */}
      <div className="card-header-row">
        <div
          className="sound-color-indicator"
          style={{ background: sound.color || 'var(--stream-blue)', color: sound.color || 'var(--stream-blue)' }}
          title={`Cor do Botão: ${sound.color || 'Padrão'}`}
        />

        <div className="sound-title-text" title={sound.title}>
          {sound.title}
        </div>

        <div className="card-top-actions">
          {sound.hotkey && (
            <span
              className="hotkey-badge"
              title={`Atalho: Tecla [ ${sound.hotkey} ] toca na Saída 1 | [ Shift + ${sound.hotkey} ] toca na Saída de Teste 2`}
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
            <Star size={14} fill={sound.isFavorite ? '#fbbf24' : 'none'} />
          </button>

          <button
            className="icon-btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              onEditTags(sound);
            }}
            title="Editar Tags, Atalho e Volume"
          >
            <Tag size={13} />
          </button>

          <button
            className="icon-btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Deseja excluir "${sound.title}" do seu Stream Deck?`)) {
                onDelete(sound.id);
              }
            }}
            title="Excluir Som"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Tags Chips inside Stream Deck Key */}
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
            style={{ opacity: 0.5, fontStyle: 'italic', cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onEditTags(sound);
            }}
          >
            + Adicionar tags
          </span>
        )}
      </div>

      {/* Stream Deck Key Dual Action Buttons */}
      <div className="card-actions-row">
        {/* TRANSMIT / LIVE STREAM BUTTON */}
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

        {/* DEDICATED TEST / MONITOR PILL BUTTON */}
        <button
          className={`btn-deck-test-pill ${isPlayingTest ? 'is-testing' : ''}`}
          onClick={() => (isPlayingTest ? onStop(sound.id) : onPlayTest(sound))}
          title={`Pílula de Teste: Ouvir em particular na Saída 2 (${secondaryDeviceLabel})`}
        >
          <Headphones size={13} />
          <span>{isPlayingTest ? 'Parar' : 'Testar'}</span>
        </button>
      </div>
    </div>
  );
};
