import React, { useState } from 'react';
import { X, Upload, Plus } from 'lucide-react';
import { uploadAudioFile } from '../services/api';

interface AddSoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSoundAdded: (sound: {
    title: string;
    url: string;
    source: 'local' | 'custom';
    tags: string[];
    color: string;
    hotkey?: string;
  }) => void;
}

export const AddSoundModal: React.FC<AddSoundModalProps> = ({
  isOpen,
  onClose,
  onSoundAdded,
}) => {
  const [title, setTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('local, custom');
  const [color] = useState('#1a9fff');
  const [hotkey, setHotkey] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        // Strip extension for title
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Por favor, selecione um arquivo de áudio (MP3, WAV, OGG, etc.)');
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadAudioFile(selectedFile);
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
        .filter((t) => t.length > 0);

      onSoundAdded({
        title: title.trim() || selectedFile.name,
        url: uploaded.url,
        source: 'local',
        tags: tags.length > 0 ? tags : ['local'],
        color,
        hotkey: hotkey.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      alert('Erro ao enviar áudio: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-deck" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-deck">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Upload size={20} color="var(--deck-cyan)" />
            <h2>Adicionar Som do Computador</h2>
          </div>
          <button className="icon-btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* File Upload Box */}
          <div className="form-group-deck">
            <label>Arquivo de Áudio (.mp3, .wav, .ogg, .webm)</label>
            <div
              style={{
                border: '2px dashed rgba(26, 159, 255, 0.4)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                textAlign: 'center',
                background: 'rgba(26, 159, 255, 0.04)',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <Upload size={32} color="var(--deck-cyan)" style={{ margin: '0 auto 0.5rem auto' }} />
              <p style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                {selectedFile ? selectedFile.name : 'Clique para selecionar arquivo de áudio'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Suporta MP3, WAV, OGG, AAC'}
              </p>
              <input
                id="file-upload-input"
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Title */}
          <div className="form-group-deck">
            <label>Nome do Som</label>
            <input
              type="text"
              className="input-deck"
              placeholder="Ex: Risa da Vitória, Grito Épico..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Tags */}
          <div className="form-group-deck">
            <label>Tags (separadas por vírgula)</label>
            <input
              type="text"
              className="input-deck"
              placeholder="Ex: meme, gaming, vitória, risada"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          {/* Hotkey */}
          <div className="form-group-deck">
            <label>Atalho de Teclado (Opcional)</label>
            <input
              type="text"
              className="input-deck"
              placeholder="Ex: 1, Q, F5..."
              value={hotkey}
              onChange={(e) => setHotkey(e.target.value.toUpperCase())}
              maxLength={6}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn-steamdeck btn-steamdeck-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-steamdeck btn-steamdeck-primary"
              disabled={uploading}
            >
              {uploading ? (
                <span>Enviando...</span>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Adicionar à Soundboard</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
