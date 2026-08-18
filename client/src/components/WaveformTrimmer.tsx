import React, { useEffect, useRef, useState } from 'react';
import { Play, Square, Scissors, RotateCcw } from 'lucide-react';
import { getAudioProxyUrl } from '../services/api';
import { AudioEngine } from '../services/AudioEngine';

interface WaveformTrimmerProps {
  audioUrl: string;
  initialStartTime?: number;
  initialEndTime?: number;
  onChange: (startTime: number, endTime: number) => void;
}

export const WaveformTrimmer: React.FC<WaveformTrimmerProps> = ({
  audioUrl,
  initialStartTime = 0,
  initialEndTime,
  onChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(initialStartTime);
  const [endTime, setEndTime] = useState<number>(initialEndTime || 0);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [currentPlayhead, setCurrentPlayhead] = useState<number>(initialStartTime);
  const [isLoadingWave, setIsLoadingWave] = useState<boolean>(true);

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Load and decode audio buffer for canvas waveform rendering
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingWave(true);

    async function loadWaveform() {
      try {
        const streamUrl = getAudioProxyUrl(audioUrl);
        const res = await fetch(streamUrl);
        const arrayBuf = await res.arrayBuffer();

        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const decoded = await ctx.decodeAudioData(arrayBuf);

        if (!isCancelled) {
          setAudioBuffer(decoded);
          const dur = decoded.duration;
          setDuration(dur);
          const end = initialEndTime && initialEndTime <= dur && initialEndTime > 0 ? initialEndTime : dur;
          setEndTime(end);
          onChange(initialStartTime, end);
          setIsLoadingWave(false);
        }
        ctx.close().catch(() => {});
      } catch (err) {
        console.warn('Could not decode audio buffer for waveform, using fallback slider', err);
        if (!isCancelled) {
          setIsLoadingWave(false);
        }
      }
    }

    if (audioUrl) {
      loadWaveform();
    }

    return () => {
      isCancelled = true;
    };
  }, [audioUrl]);

  // Draw Waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background Grid
    ctx.fillStyle = '#0a0614';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Waveform Peaks
    const channelData = audioBuffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);
    const amp = height / 2;

    const startX = duration > 0 ? (startTime / duration) * width : 0;
    const endX = duration > 0 ? (endTime / duration) * width : width;

    // Draw Unselected Dimmed Area (Left)
    if (startX > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, startX, height);
    }

    // Draw Unselected Dimmed Area (Right)
    if (endX < width) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(endX, 0, width - endX, height);
    }

    // Draw Active Selected Region Highlight
    const activeGrad = ctx.createLinearGradient(0, 0, 0, height);
    activeGrad.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
    activeGrad.addColorStop(0.5, 'rgba(255, 0, 128, 0.15)');
    activeGrad.addColorStop(1, 'rgba(0, 240, 255, 0.15)');
    ctx.fillStyle = activeGrad;
    ctx.fillRect(startX, 0, endX - startX, height);

    // Draw Waveform Bars
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const isInside = i >= startX && i <= endX;
      ctx.fillStyle = isInside ? '#00f0ff' : 'rgba(100, 116, 139, 0.4)';
      if (isInside) {
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 4;
      } else {
        ctx.shadowBlur = 0;
      }

      const barHeight = Math.max(2, (max - min) * amp * 0.9);
      const y = amp - barHeight / 2;
      ctx.fillRect(i, y, 1.5, barHeight);
    }

    // Draw Start Handle Line
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00ff88';
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.stroke();

    // Draw End Handle Line
    ctx.shadowColor = '#ff007f';
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();

    // Draw Animated Playhead if playing
    if (isPlayingPreview && duration > 0) {
      const playheadX = (currentPlayhead / duration) * width;
      ctx.shadowColor = '#ffe600';
      ctx.strokeStyle = '#ffe600';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }
  }, [audioBuffer, startTime, endTime, duration, isPlayingPreview, currentPlayhead]);

  // Preview Playback Logic
  const handleTogglePreview = () => {
    if (isPlayingPreview) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setIsPlayingPreview(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const streamUrl = getAudioProxyUrl(audioUrl);
    const audio = new Audio(streamUrl);
    const config = AudioEngine.getConfig();
    audio.volume = Math.max(0, Math.min(1, config.previewVolume));

    if (config.secondaryDeviceId && config.secondaryDeviceId !== 'default' && typeof (audio as any).setSinkId === 'function') {
      (audio as any).setSinkId(config.secondaryDeviceId).catch(() => {});
    }

    previewAudioRef.current = audio;
    audio.currentTime = startTime;

    audio.play().then(() => {
      setIsPlayingPreview(true);

      const updatePlayhead = () => {
        if (!audio || audio.paused || audio.ended) {
          setIsPlayingPreview(false);
          return;
        }
        setCurrentPlayhead(audio.currentTime);
        if (audio.currentTime >= endTime) {
          audio.pause();
          setIsPlayingPreview(false);
          return;
        }
        animFrameRef.current = requestAnimationFrame(updatePlayhead);
      };
      animFrameRef.current = requestAnimationFrame(updatePlayhead);
    }).catch((err) => {
      console.warn('Preview play error:', err);
      setIsPlayingPreview(false);
    });

    audio.onended = () => {
      setIsPlayingPreview(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  };

  const handleReset = () => {
    setStartTime(0);
    const fullEnd = duration || 0;
    setEndTime(fullEnd);
    onChange(0, fullEnd);
    if (isPlayingPreview && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  const trimmedDuration = Math.max(0, endTime - startTime);

  return (
    <div className="waveform-trimmer-container">
      <div className="trimmer-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Scissors size={14} color="var(--neon-cyan)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
            Corte Visual de Áudio (Trim)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="trim-duration-badge" title="Duração do trecho selecionado">
            {formatTime(trimmedDuration)}
          </span>
          <button
            type="button"
            className="trimmer-btn-ghost"
            onClick={handleReset}
            title="Resetar corte para o áudio completo"
          >
            <RotateCcw size={12} />
            <span>Resetar</span>
          </button>
        </div>
      </div>

      {/* Waveform Canvas Viewport */}
      <div className="waveform-canvas-box">
        {isLoadingWave ? (
          <div className="waveform-loading">
            <div className="k7-spool k7-spinning" style={{ width: 22, height: 22 }} />
            <span>Decodificando ondas sonoras...</span>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={480}
            height={80}
            className="waveform-canvas"
          />
        )}
      </div>

      {/* Dual Interactive Trim Sliders */}
      {duration > 0 && (
        <div className="trimmer-sliders-row">
          <div className="slider-group">
            <label style={{ color: '#00ff88' }}>Início (Start): {formatTime(startTime)}</label>
            <input
              type="range"
              min={0}
              max={Math.max(0, endTime - 0.1)}
              step={0.05}
              value={startTime}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setStartTime(val);
                onChange(val, endTime);
              }}
            />
          </div>

          <div className="slider-group">
            <label style={{ color: '#ff007f' }}>Fim (End): {formatTime(endTime)}</label>
            <input
              type="range"
              min={Math.min(duration, startTime + 0.1)}
              max={duration}
              step={0.05}
              value={endTime}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setEndTime(val);
                onChange(startTime, val);
              }}
            />
          </div>
        </div>
      )}

      {/* Preview Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
        <button
          type="button"
          className={`trimmer-preview-btn ${isPlayingPreview ? 'is-playing' : ''}`}
          onClick={handleTogglePreview}
        >
          {isPlayingPreview ? <Square size={12} fill="#fff" /> : <Play size={12} fill="currentColor" />}
          <span>{isPlayingPreview ? 'Parar Prévia' : '▶ Testar Corte Selecionado'}</span>
        </button>
      </div>
    </div>
  );
};
