import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw, Copy, Check, MessageCircle, Download, ExternalLink, Sparkles, Volume2 } from 'lucide-react';
import { ProceduralAudio } from '../services/ProceduralAudio';
import type { SoundItem } from '../types';

interface CassettePlayerCardProps {
  sound: Partial<SoundItem>;
  onClose?: () => void;
  onExploreFullBoard?: () => void;
  isStandaloneView?: boolean;
}

export const CassettePlayerCard: React.FC<CassettePlayerCardProps> = ({
  sound,
  onClose,
  onExploreFullBoard,
  isStandaloneView = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [volume, setVolume] = useState(sound.volume ?? 1);
  const [playbackRate, setPlaybackRate] = useState(sound.playbackRate ?? 1);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const title = sound.title || 'Meme Retrô dos Anos 90';
  const soundUrl = sound.url || '';
  const soundColor = sound.color || '#1a9fff';

  // Generate shareable link
  const getShareUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://campos2504.github.io/soundboard/';
    const params = new URLSearchParams();
    if (sound.url) params.set('play', sound.url);
    if (sound.title) params.set('title', sound.title);
    if (sound.color) params.set('color', sound.color);
    if (sound.tags && sound.tags.length > 0) params.set('tags', sound.tags.join(','));
    if (sound.id) params.set('id', sound.id);
    return `${origin}?${params.toString()}`;
  };

  const handlePlayAudio = () => {
    if (!soundUrl) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    ProceduralAudio.playTapeInsert();

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(soundUrl);
    audio.volume = volume;
    audio.playbackRate = playbackRate;
    audioRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    audio.ontimeupdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    audio.onerror = () => {
      setIsPlaying(false);
    };

    audio.play().catch(() => {
      setIsPlaying(false);
    });
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      if (!isPlaying) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      handlePlayAudio();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const url = getShareUrl();
    const message = `🔊 *${title}*\n📼 Ouça esse som no Card K7 Anos 90:\n${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleDownloadMp3 = () => {
    if (!soundUrl) return;
    const a = document.createElement('a');
    a.href = soundUrl;
    a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp3`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`cassette-card-container ${isStandaloneView ? 'standalone-mode' : ''}`}>
      {/* 90s Hi-Fi Cassette Tape Body */}
      <div className="cassette-tape-body" style={{ borderColor: isPlaying ? soundColor : 'rgba(255, 255, 255, 0.15)' }}>
        {/* 4 Corner Screws */}
        <div className="screw screw-top-left" />
        <div className="screw screw-top-right" />
        <div className="screw screw-bottom-left" />
        <div className="screw screw-bottom-right" />

        {/* Cassette Header Bar (Brand & Bias specs) */}
        <div className="cassette-header-stripe">
          <div className="cassette-brand-tag">
            <span className="brand-logo-text">SOUNDWAVE</span>
            <span className="bias-type">CrO₂ TYPE II</span>
          </div>
          <div className="side-badge">SIDE A</div>
          <div className="duration-tag">STEREO 60 MIN</div>
        </div>

        {/* Main Paper/Sticker Label */}
        <div className="cassette-label-sticker" style={{ borderTopColor: soundColor }}>
          {/* Label Header Line */}
          <div className="sticker-header-lines">
            <div className="line-item">A <span className="nr-box">DOLBY NR [ON]</span></div>
            <div className="eq-spec">HIGH BIAS 70µs EQ</div>
          </div>

          {/* Sound Title handwritten on lined paper */}
          <div className="cassette-title-box">
            <div className="ruled-line" />
            <h2 className="cassette-sound-title" style={{ color: isPlaying ? 'var(--neon-yellow)' : '#ffffff' }}>
              {title}
            </h2>
            <div className="ruled-line" />
          </div>

          {/* Tags & Meta Badges */}
          <div className="cassette-tags-row">
            {sound.tags && sound.tags.map((t, idx) => (
              <span key={idx} className="k7-tag-pill">#{t}</span>
            ))}
            {sound.source && (
              <span className="k7-source-pill">{sound.source.toUpperCase()}</span>
            )}
          </div>
        </div>

        {/* Cassette Center Mechanism (Window, Reels & Magnetic Tape) */}
        <div className="cassette-center-mechanism">
          {/* Left Tape Reel (Spool) */}
          <div className="cassette-spool-assembly">
            <div className={`tape-spool ${isPlaying ? 'spinning' : ''}`} style={{ animationDuration: `${2 / playbackRate}s` }}>
              <div className="spool-teeth spool-teeth-1" />
              <div className="spool-teeth spool-teeth-2" />
              <div className="spool-teeth spool-teeth-3" />
              <div className="spool-center-hole" />
            </div>
            {/* Magnetic tape roll thickness */}
            <div
              className="magnetic-tape-roll left-roll"
              style={{ transform: `scale(${1.25 - (progress / 100) * 0.45})` }}
            />
          </div>

          {/* Center Transparent Meter Window */}
          <div className="cassette-meter-window">
            <div className="tape-counter-digits">
              {isPlaying ? Math.floor((progress / 100) * 450).toString().padStart(3, '0') : '000'}
            </div>
            <div className="tape-window-grid">
              <div className="grid-tick" />
              <div className="grid-tick main-tick" />
              <div className="grid-tick" />
            </div>
            {/* Glowing LED Status Indicator */}
            <div className="cassette-led-group">
              <div className={`led-dot ${isPlaying ? 'active-green' : ''}`} title="Playback Active" />
              <span className="led-text">{isPlaying ? 'PLAYING' : 'READY'}</span>
            </div>
          </div>

          {/* Right Tape Reel (Spool) */}
          <div className="cassette-spool-assembly">
            <div className={`tape-spool ${isPlaying ? 'spinning' : ''}`} style={{ animationDuration: `${2 / playbackRate}s` }}>
              <div className="spool-teeth spool-teeth-1" />
              <div className="spool-teeth spool-teeth-2" />
              <div className="spool-teeth spool-teeth-3" />
              <div className="spool-center-hole" />
            </div>
            {/* Right magnetic tape roll thickness (grows as audio plays) */}
            <div
              className="magnetic-tape-roll right-roll"
              style={{ transform: `scale(${0.8 + (progress / 100) * 0.45})` }}
            />
          </div>
        </div>

        {/* Cassette Trapezoid Lower Head Area */}
        <div className="cassette-bottom-trapezoid">
          <div className="head-guide-hole left-hole" />
          <div className="capstan-guide-slot" />
          <div className="center-screw" />
          <div className="head-guide-hole right-hole" />
        </div>
      </div>

      {/* Retro Tape Deck Control Buttons (Mechanical Clickers) */}
      <div className="cassette-controls-bar">
        {/* Main PLAY Button */}
        <button
          className={`tape-deck-btn play-btn ${isPlaying ? 'is-active' : ''}`}
          onClick={handlePlayAudio}
          title={isPlaying ? 'Pausar Áudio' : 'Tocar Fita K7'}
        >
          <Play size={18} fill="#ffffff" />
          <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        {/* STOP Button */}
        <button
          className="tape-deck-btn stop-btn"
          onClick={handleStop}
          title="Parar fita"
        >
          <Square size={16} fill="#ffffff" />
          <span>STOP</span>
        </button>

        {/* Rewind / Restart */}
        <button
          className="tape-deck-btn restart-btn"
          onClick={handleRestart}
          title="Reiniciar som do início"
        >
          <RotateCcw size={16} />
          <span>REPLAY</span>
        </button>

        {/* Speed / Pitch Switchers */}
        <div className="speed-pills-group">
          {[0.75, 1.0, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              className={`speed-pill ${playbackRate === rate ? 'active' : ''}`}
              onClick={() => handleRateChange(rate)}
              title={`Velocidade ${rate}x`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Volume Slider */}
        <div className="k7-volume-slider-group">
          <Volume2 size={16} color="var(--neon-cyan)" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="k7-slider"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
        </div>
      </div>

      {/* Sharing Actions Area */}
      <div className="cassette-share-actions">
        {/* WhatsApp Direct Share Button */}
        <button
          className="share-action-btn whatsapp-btn"
          onClick={handleWhatsAppShare}
          title="Enviar no WhatsApp com card e pré-visualização"
        >
          <MessageCircle size={18} />
          <span>Enviar no WhatsApp</span>
        </button>

        {/* Copy Card Link Button */}
        <button
          className="share-action-btn copy-btn"
          onClick={handleCopyLink}
          title="Copiar Link direto deste Card K7"
        >
          {copied ? <Check size={18} color="#00ff88" /> : <Copy size={18} />}
          <span>{copied ? 'Link Copiado!' : 'Copiar Link K7'}</span>
        </button>

        {/* Download MP3 */}
        <button
          className="share-action-btn download-btn"
          onClick={handleDownloadMp3}
          title="Baixar arquivo de áudio (.mp3)"
        >
          <Download size={17} />
          <span>Baixar MP3</span>
        </button>
      </div>

      {/* Explore Full Soundboard Button (If opened from shared link or modal) */}
      {(onExploreFullBoard || isStandaloneView) && (
        <div className="explore-more-bar">
          <button
            className="explore-soundboard-btn"
            onClick={onExploreFullBoard || onClose}
          >
            <Sparkles size={16} color="var(--neon-yellow)" />
            <span>Explorar Soundboard Completa (+200 Sons)</span>
            <ExternalLink size={15} />
          </button>
        </div>
      )}
    </div>
  );
};
