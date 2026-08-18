import React, { useEffect, useState } from 'react';
import { Radio, Volume2 } from 'lucide-react';
import { AudioEngine } from '../services/AudioEngine';
import type { SoundItem } from '../types';

interface ObsOverlayViewProps {
  sounds: SoundItem[];
}

export const ObsOverlayView: React.FC<ObsOverlayViewProps> = ({ sounds }) => {
  const [playingIds, setPlayingIds] = useState<Set<string>>(new Set());
  const [activeTestIds, setActiveTestIds] = useState<Set<string>>(new Set());
  const [eqLevels, setEqLevels] = useState<number[]>([10, 25, 40, 60, 35, 80, 45, 20]);

  useEffect(() => {
    const unsubscribe = AudioEngine.subscribe((playing, testing) => {
      setPlayingIds(new Set(playing));
      setActiveTestIds(new Set(testing));
    });
    return unsubscribe;
  }, []);

  // Equalizer animation while playing
  useEffect(() => {
    const isAnyPlaying = playingIds.size > 0 || activeTestIds.size > 0;
    if (!isAnyPlaying) {
      setEqLevels([5, 8, 12, 10, 8, 15, 10, 5]);
      return;
    }

    const interval = setInterval(() => {
      setEqLevels(
        Array.from({ length: 12 }, () => Math.floor(Math.random() * 85) + 15)
      );
    }, 90);

    return () => clearInterval(interval);
  }, [playingIds, activeTestIds]);

  const activeSoundId = Array.from(playingIds)[0] || Array.from(activeTestIds)[0];
  const activeSound = sounds.find((s) => s.id === activeSoundId);
  const isPlaying = Boolean(activeSound);
  const isTest = activeSound ? activeTestIds.has(activeSound.id) : false;

  return (
    <div className={`obs-overlay-root ${isPlaying ? 'obs-active' : 'obs-idle'}`}>
      <div className={`obs-k7-container ${isTest ? 'obs-is-test' : 'obs-is-stream'}`}>
        {/* Top Ticker Broadcast Bar */}
        <div className="obs-ticker-bar">
          <div className="obs-live-tag">
            <span className="obs-live-dot" />
            <Radio size={12} />
            <span>{isTest ? 'MONITOR FONES' : 'AO VIVO / STREAM'}</span>
          </div>

          <div className="obs-eq-bars">
            {eqLevels.map((lvl, idx) => (
              <div
                key={idx}
                className="obs-eq-col"
                style={{
                  height: `${isPlaying ? lvl : 6}%`,
                  background: isTest ? 'var(--neon-pink)' : 'var(--neon-cyan)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Cassette Display Content */}
        <div className="obs-body-row">
          {/* Mini 3D Cassette Tape with Spinning Spools */}
          <div className="obs-mini-cassette">
            <div className="obs-k7-label">
              <div className="obs-k7-title">
                {activeSound ? activeSound.title : 'SOUNDBOARD RETRÔ'}
              </div>
              <div className="obs-k7-stripes" />
            </div>

            {/* Window & Spinning Reels */}
            <div className="obs-k7-window">
              <div className={`k7-spool ${isPlaying ? 'k7-spinning' : ''}`} style={{ width: 22, height: 22 }}>
                <div className="k7-cog-tooth k7-cog-1" />
                <div className="k7-cog-tooth k7-cog-2" />
                <div className="k7-cog-tooth k7-cog-3" />
                <div className="k7-cog-center" style={{ width: 10, height: 10 }} />
              </div>

              <div className="obs-tape-roll" />

              <div className={`k7-spool ${isPlaying ? 'k7-spinning' : ''}`} style={{ width: 22, height: 22 }}>
                <div className="k7-cog-tooth k7-cog-1" />
                <div className="k7-cog-tooth k7-cog-2" />
                <div className="k7-cog-tooth k7-cog-3" />
                <div className="k7-cog-center" style={{ width: 10, height: 10 }} />
              </div>
            </div>
          </div>

          {/* Sound Info & Marquee */}
          <div className="obs-info-box">
            <div className="obs-sound-marquee">
              <span className="obs-sound-title">
                {activeSound ? activeSound.title : 'Aguardando som...'}
              </span>
            </div>

            <div className="obs-meta-row">
              {activeSound?.hotkey && (
                <span className="obs-hotkey-badge">
                  KEY: [{activeSound.hotkey}]
                </span>
              )}
              {activeSound?.tab && (
                <span className="obs-tab-badge">
                  {activeSound.tab}
                </span>
              )}
              <span className="obs-sound-status">
                <Volume2 size={12} />
                {isPlaying ? 'TOCANDO AGORA' : 'STANDBY'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
