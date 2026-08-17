import React, { useState, useRef } from 'react';
import { X, Mic, Square, Check } from 'lucide-react';
import { uploadAudioFile } from '../services/api';

interface RecordSoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSoundRecorded: (sound: {
    title: string;
    url: string;
    source: 'local';
    tags: string[];
    color: string;
    hotkey?: string;
  }) => void;
}

export const RecordSoundModal: React.FC<RecordSoundModalProps> = ({
  isOpen,
  onClose,
  onSoundRecorded,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [title, setTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('gravação, voz, mic');
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  if (!isOpen) return null;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert('Não foi possível acessar o microfone: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSave = async () => {
    if (!audioBlob) return;
    setUploading(true);
    try {
      const file = new File([audioBlob], `gravacao_${Date.now()}.webm`, { type: 'audio/webm' });
      const uploaded = await uploadAudioFile(file);
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
        .filter((t) => t.length > 0);

      onSoundRecorded({
        title: title.trim() || `Gravação Mic ${new Date().toLocaleTimeString()}`,
        url: uploaded.url,
        source: 'local',
        tags: tags.length > 0 ? tags : ['gravação', 'mic'],
        color: '#00d2ff',
      });

      onClose();
    } catch (err: any) {
      alert('Erro ao salvar gravação: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-deck" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-deck">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Mic size={20} color="var(--deck-cyan)" />
            <h2>Gravar Áudio do Microfone</h2>
          </div>
          <button className="icon-btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          {isRecording ? (
            <div>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '3px solid #ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                  animation: 'pulseCard 1s infinite alternate',
                }}
              >
                <Square size={32} fill="#ef4444" color="#ef4444" style={{ cursor: 'pointer' }} onClick={stopRecording} />
              </div>
              <p style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.1rem' }}>
                Gravando... {recordingDuration}s
              </p>
              <button
                className="btn-steamdeck btn-steamdeck-amber"
                style={{ marginTop: '1rem' }}
                onClick={stopRecording}
              >
                <Square size={14} fill="#fff" />
                <span>Parar Gravação</span>
              </button>
            </div>
          ) : (
            <div>
              <button
                className="btn-steamdeck btn-steamdeck-primary"
                style={{ padding: '0.9rem 1.5rem', fontSize: '1rem' }}
                onClick={startRecording}
              >
                <Mic size={20} />
                <span>{audioBlob ? 'Gravar Novamente' : 'Iniciar Gravação'}</span>
              </button>
            </div>
          )}

          {audioUrl && !isRecording && (
            <div style={{ marginTop: '1.5rem', background: '#0e141c', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Prévia da Gravação:</p>
              <audio controls src={audioUrl} style={{ width: '100%' }} />
            </div>
          )}
        </div>

        {audioBlob && (
          <div>
            <div className="form-group-deck">
              <label>Nome da Gravação</label>
              <input
                type="text"
                className="input-deck"
                placeholder="Ex: Minha voz engraçada..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group-deck">
              <label>Tags</label>
              <input
                type="text"
                className="input-deck"
                placeholder="Ex: voz, gravação, meme"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn-steamdeck btn-steamdeck-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button
                className="btn-steamdeck btn-steamdeck-primary"
                onClick={handleSave}
                disabled={uploading}
              >
                <Check size={16} />
                <span>{uploading ? 'Salvando...' : 'Salvar na Soundboard'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
