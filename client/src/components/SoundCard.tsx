import React from 'react';
import { Play, Square, Headphones, Star, Edit3, Trash2, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import type { SoundItem } from '../types';

interface SoundCardProps {
  sound: SoundItem;
  index: number;
  isPlayingMain: boolean;
  isPlayingTest: boolean;
  isEditMode?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
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
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
}

type K7Theme = 'tdk-classic' | 'cyber-neon' | 'arcade-yellow' | 'vapor-purple' | 'metal-chrome' | 'walkman-blue';

// Deterministic Mix-Match Theme Selector based on color, tags, or index
function getK7Theme(sound: SoundItem, index: number): { themeClass: string; brandName: string; tapeType: string; subCode: string } {
  const color = (sound.color || '').toLowerCase();
  const title = (sound.title || '').toLowerCase();
  const tagsStr = (sound.tags || []).join(' ').toLowerCase();

  let theme: K7Theme = 'tdk-classic';

  if (color.includes('#ff007f') || color.includes('#ff15e4') || color.includes('#ec4899') || color.includes('pink') || tagsStr.includes('anime') || title.includes('uwu')) {
    theme = 'cyber-neon';
  } else if (color.includes('#00f0ff') || color.includes('#1a9fff') || color.includes('blue') || color.includes('cyan') || tagsStr.includes('discord')) {
    theme = 'walkman-blue';
  } else if (color.includes('#ffe600') || color.includes('#ffd249') || color.includes('yellow') || color.includes('#ff6600') || tagsStr.includes('gaming')) {
    theme = 'arcade-yellow';
  } else if (color.includes('#a855f7') || color.includes('#7a00ff') || color.includes('purple') || tagsStr.includes('faro')) {
    theme = 'vapor-purple';
  } else if (color.includes('#000000') || color.includes('#475569') || color.includes('gray') || color.includes('black') || tagsStr.includes('metalpipe')) {
    theme = 'metal-chrome';
  } else if (color.includes('#00ff88') || color.includes('#00e676') || color.includes('green') || tagsStr.includes('brasil')) {
    theme = 'tdk-classic';
  } else {
    const list: K7Theme[] = ['tdk-classic', 'cyber-neon', 'arcade-yellow', 'vapor-purple', 'metal-chrome', 'walkman-blue'];
    theme = list[index % list.length];
  }

  switch (theme) {
    case 'tdk-classic':
      return { themeClass: 'k7-theme-tdk', brandName: 'TDK', tapeType: 'D-C60', subCode: 'NORMAL BIAS EQ-120µs' };
    case 'cyber-neon':
      return { themeClass: 'k7-theme-cyber', brandName: 'CYBER-90', tapeType: 'FX-90', subCode: 'CHROME HIGH-BIAS' };
    case 'arcade-yellow':
      return { themeClass: 'k7-theme-arcade', brandName: 'ARCADE', tapeType: 'AX-60', subCode: 'SUPER METAL TAPE' };
    case 'vapor-purple':
      return { themeClass: 'k7-theme-vapor', brandName: 'VAPOR', tapeType: 'VP-90', subCode: 'EXTENDED DYNAMIC' };
    case 'metal-chrome':
      return { themeClass: 'k7-theme-metal', brandName: 'MAXELL', tapeType: 'XLII-S', subCode: 'IEC TYPE II CHROME' };
    case 'walkman-blue':
      return { themeClass: 'k7-theme-walkman', brandName: 'SONY', tapeType: 'HF-90', subCode: 'EXTRA HIGH FIDELITY' };
  }
}

export const SoundCard: React.FC<SoundCardProps> = ({
  sound,
  index,
  isPlayingMain,
  isPlayingTest,
  isEditMode = false,
  isDragging = false,
  isDragOver = false,
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
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}) => {
  const isPlaying = isPlayingMain || isPlayingTest;
  const k7 = getK7Theme(sound, index);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, index)}
      onDragOver={(e) => onDragOver && onDragOver(e, index)}
      onDragEnd={(e) => onDragEnd && onDragEnd(e)}
      onDrop={(e) => onDrop && onDrop(e, index)}
      className={`k7-cassette-card ${k7.themeClass} ${
        isPlayingMain ? 'k7-playing-main' : isPlayingTest ? 'k7-playing-test' : ''
      }`}
      style={{
        opacity: isDragging ? 0.35 : 1,
        transform: isDragging ? 'scale(0.96)' : isDragOver ? 'scale(1.03)' : undefined,
        outline: isDragOver ? '2px dashed var(--neon-yellow)' : undefined,
        outlineOffset: '4px',
        boxShadow: isDragOver ? '0 0 25px rgba(255, 230, 0, 0.5)' : undefined,
      }}
    >
      {/* 4 Corner Realistic Screws */}
      <div className="k7-screw k7-screw-tl" />
      <div className="k7-screw k7-screw-tr" />
      <div className="k7-screw k7-screw-bl" />
      <div className="k7-screw k7-screw-br" />

      {/* Top Cassette Paper Label */}
      <div className="k7-label">
        {/* Brand Header Line & Vintage Details */}
        <div className="k7-label-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              className="k7-drag-grip"
              title="Arraste para reordenar o K7"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GripVertical size={13} color="currentColor" style={{ opacity: 0.7 }} />
            </div>

            {/* Vintage SIDE Badge (Displays Hotkey or 'A') */}
            <div
              className="k7-side-badge"
              title={sound.hotkey ? `Atalho: Tecla [ ${sound.hotkey} ]` : 'Lado A'}
            >
              {sound.hotkey ? sound.hotkey : 'A'}
            </div>

            <div className="k7-brand-badge">
              <strong>{k7.brandName}</strong>
              <span className="k7-brand-sub">{k7.tapeType}</span>
            </div>
          </div>

          {/* Actions on Label Header (Favorite, Edit, Delete) */}
          <div className="k7-label-actions">
            <button
              type="button"
              className={`k7-icon-btn ${sound.isFavorite ? 'k7-favorite-active' : ''}`}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(sound);
              }}
              title={sound.isFavorite ? 'Remover dos favoritos' : 'Favoritar este K7'}
            >
              <Star size={14} fill={sound.isFavorite ? 'var(--neon-yellow)' : 'none'} color={sound.isFavorite ? 'var(--neon-yellow)' : 'currentColor'} />
            </button>

            <button
              type="button"
              className="k7-icon-btn"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEditTags(sound);
              }}
              title="Editar Som (Nome, Tags, Cor, Atalho, Volume, Áudio)"
            >
              <Edit3 size={14} />
            </button>

            <button
              type="button"
              className="k7-icon-btn k7-btn-delete"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Deseja excluir a fita K7 "${sound.title}"?`)) {
                  onDelete(sound.id);
                }
              }}
              title="Excluir K7 da Soundboard"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Cassette Title on Ruled Handwritten Lines */}
        <div
          className="k7-title-block"
          onClick={() => onEditTags(sound)}
          title={`Clique para editar: ${sound.title}`}
        >
          <div className="k7-ruled-line k7-ruled-line-1" />
          <div className="k7-ruled-line k7-ruled-line-2" />
          <div className="k7-title-text">
            {sound.title}
          </div>
        </div>

        {/* Vintage Colored Racing Stripes on Label */}
        <div className="k7-racing-stripes">
          <div className="k7-stripe k7-stripe-red" />
          <div className="k7-stripe k7-stripe-black" />
        </div>
      </div>

      {/* Center Transparent Tape Viewing Window */}
      <div className="k7-window-housing">
        <div className="k7-window">
          {/* Left Cogwheel Reel */}
          <div className={`k7-spool k7-spool-left ${isPlaying ? 'k7-spinning' : ''}`}>
            <div className="k7-cog-tooth k7-cog-1" />
            <div className="k7-cog-tooth k7-cog-2" />
            <div className="k7-cog-tooth k7-cog-3" />
            <div className="k7-cog-center" />
          </div>

          {/* Central Magnetic Tape Spool & Measurement Ruler */}
          <div className="k7-tape-center">
            <div className="k7-tape-roll" />
            <div className="k7-ruler-ticks">
              <span>|</span>
              <span>0</span>
              <span>50</span>
              <span>100</span>
              <span>|</span>
            </div>
          </div>

          {/* Right Cogwheel Reel */}
          <div className={`k7-spool k7-spool-right ${isPlaying ? 'k7-spinning' : ''}`}>
            <div className="k7-cog-tooth k7-cog-1" />
            <div className="k7-cog-tooth k7-cog-2" />
            <div className="k7-cog-tooth k7-cog-3" />
            <div className="k7-cog-center" />
          </div>
        </div>
      </div>

      {/* Edit Mode Position Arrows Bar */}
      {isEditMode && (
        <div className="k7-edit-bar">
          <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>POSIÇÃO:</span>
          <div style={{ display: 'flex', gap: '3px' }}>
            {onMoveLeft && (
              <button
                type="button"
                className="k7-pos-btn"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveLeft();
                }}
                title="Mover K7 para esquerda"
              >
                <ChevronLeft size={14} />
              </button>
            )}
            {onMoveRight && (
              <button
                type="button"
                className="k7-pos-btn"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveRight();
                }}
                title="Mover K7 para direita"
              >
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cassette Adhesive Tag Stickers */}
      <div className="k7-tags-row">
        {sound.tags && sound.tags.length > 0 ? (
          sound.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="k7-tag-chip"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
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
            className="k7-tag-chip"
            style={{ opacity: 0.5, fontStyle: 'italic' }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onEditTags(sound);
            }}
          >
            + tags
          </span>
        )}
        {sound.tags && sound.tags.length > 3 && (
          <span className="k7-tag-more">+{sound.tags.length - 3}</span>
        )}
      </div>

      {/* Lower Trapezoid Tape Head Section with Capstan Holes & Dual Deck Buttons */}
      <div className="k7-bottom-head">
        {/* 4 Tape Head Holes + Center Screw */}
        <div className="k7-head-holes-row">
          <div className="k7-head-hole" />
          <div className="k7-head-hole" />
          <div className="k7-screw k7-screw-center" />
          <div className="k7-head-hole" />
          <div className="k7-head-hole" />
        </div>

        {/* Mechanical Tape Transport Buttons */}
        <div className="k7-controls-row">
          {/* MAIN PLAY BUTTON (Saída 1 / Stream) */}
          <button
            type="button"
            className={`k7-deck-btn k7-btn-play ${isPlayingMain ? 'k7-is-active' : ''}`}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              isPlayingMain ? onStop(sound.id) : onPlayMain(sound);
            }}
            title={`Tocar K7 na Saída 1: ${primaryDeviceLabel}`}
          >
            {isPlayingMain ? <Square size={12} fill="#fff" /> : <Play size={12} fill="currentColor" />}
            <span>{isPlayingMain ? 'PARAR' : 'PLAY ▶'}</span>
          </button>

          {/* DEDICATED TEST / CUE BUTTON (Saída 2 / Fones) */}
          <button
            type="button"
            className={`k7-deck-btn k7-btn-test ${isPlayingTest ? 'k7-is-active' : ''}`}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              isPlayingTest ? onStop(sound.id) : onPlayTest(sound);
            }}
            title={`Ouvir prévia no Fone (Saída 2: ${secondaryDeviceLabel})`}
          >
            <Headphones size={12} />
            <span>{isPlayingTest ? 'PARAR' : 'TEST 🎧'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
