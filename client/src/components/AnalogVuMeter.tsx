import React, { useRef, useEffect, useState } from 'react';
import { AudioEngine } from '../services/AudioEngine';

interface AnalogVuMeterProps {
  compact?: boolean;
}

export const AnalogVuMeter: React.FC<AnalogVuMeterProps> = ({ compact = true }) => {
  const [leftPeak, setLeftPeak] = useState(false);
  const [rightPeak, setRightPeak] = useState(false);

  const leftNeedleRef = useRef<HTMLDivElement | null>(null);
  const rightNeedleRef = useRef<HTMLDivElement | null>(null);

  // Physics animation state
  const physicsRef = useRef({
    leftAngle: -40,
    rightAngle: -40,
    leftVelocity: 0,
    rightVelocity: 0,
  });

  useEffect(() => {
    let animId: number;

    const updateNeedles = () => {
      const isPlaying = AudioEngine.isPlayingAny();
      const data = AudioEngine.getFrequencyData();

      // Calculate pseudo-stereo RMS / peak levels
      let lSum = 0;
      let rSum = 0;
      const half = Math.floor(data.length / 2);

      if (isPlaying) {
        for (let i = 0; i < half; i++) {
          lSum += (data[i] || 0) * (data[i] || 0);
        }
        for (let i = half; i < data.length; i++) {
          rSum += (data[i] || 0) * (data[i] || 0);
        }
      }

      const lRms = isPlaying ? Math.sqrt(lSum / half) / 255 : 0;
      const rRms = isPlaying ? Math.sqrt(rSum / half) / 255 : 0;

      // Target needle angles: -42 deg (rest, -20dB) to +42 deg (+3dB max)
      // 0 dB is around +18 deg
      const minAngle = -42;
      const maxAngle = 42;

      // Non-linear VU ballistic scale mapping
      const lTarget = isPlaying ? minAngle + Math.pow(lRms, 0.7) * (maxAngle - minAngle) : minAngle;
      const rTarget = isPlaying ? minAngle + Math.pow(rRms, 0.7) * (maxAngle - minAngle) : minAngle;

      const p = physicsRef.current;

      // Analog ballistic spring physics (Fast attack, damped decay)
      const attack = 0.35;
      const decay = 0.12;

      const lSpeed = lTarget > p.leftAngle ? attack : decay;
      const rSpeed = rTarget > p.rightAngle ? attack : decay;

      p.leftAngle += (lTarget - p.leftAngle) * lSpeed;
      p.rightAngle += (rTarget - p.rightAngle) * rSpeed;

      // Clamp
      p.leftAngle = Math.max(minAngle, Math.min(maxAngle + 2, p.leftAngle));
      p.rightAngle = Math.max(minAngle, Math.min(maxAngle + 2, p.rightAngle));

      if (leftNeedleRef.current) {
        leftNeedleRef.current.style.transform = `rotate(${p.leftAngle}deg)`;
      }
      if (rightNeedleRef.current) {
        rightNeedleRef.current.style.transform = `rotate(${p.rightAngle}deg)`;
      }

      // Peak LED trigger (over 0 dB threshold: angle > 15 deg)
      setLeftPeak(p.leftAngle > 15);
      setRightPeak(p.rightAngle > 15);

      animId = requestAnimationFrame(updateNeedles);
    };

    animId = requestAnimationFrame(updateNeedles);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className={`analog-stereo-vu-panel ${compact ? 'vu-compact' : 'vu-expanded'}`}>
      {/* LEFT CHANNEL VU METER */}
      <div className="analog-vu-meter-box">
        {/* Header with Channel Label & Peak LED */}
        <div className="vu-dial-header">
          <span className="vu-ch-label">CH-L</span>
          <div className="vu-peak-indicator">
            <span className={`vu-peak-led ${leftPeak ? 'vu-peak-on' : ''}`} />
            <span className="vu-peak-text">PEAK</span>
          </div>
        </div>

        {/* Backlit Dial Face */}
        <div className="vu-dial-face">
          {/* Printed Arc Scale SVG */}
          <svg viewBox="0 0 160 80" className="vu-scale-svg">
            {/* Base Scale Arc (Safe range: -20 to 0) */}
            <path
              d="M 22 70 A 62 62 0 0 1 122 28"
              fill="none"
              stroke="#222"
              strokeWidth="2"
            />
            {/* Overload Arc (Red zone: 0 to +3) */}
            <path
              d="M 122 28 A 62 62 0 0 1 146 44"
              fill="none"
              stroke="#d92438"
              strokeWidth="2.5"
            />

            {/* Tick Marks & Numbers */}
            <text x="20" y="76" className="vu-scale-text">-20</text>
            <text x="42" y="48" className="vu-scale-text">-10</text>
            <text x="68" y="34" className="vu-scale-text">-7</text>
            <text x="88" y="27" className="vu-scale-text">-5</text>
            <text x="108" y="24" className="vu-scale-text">-3</text>
            <text x="122" y="24" className="vu-scale-text vu-zero-text">0</text>
            <text x="135" y="30" className="vu-scale-text vu-red-text">+1</text>
            <text x="146" y="42" className="vu-scale-text vu-red-text">+3</text>
            <text x="76" y="55" className="vu-logo-text">VU</text>
          </svg>

          {/* Analog Physical Indicator Needle */}
          <div className="vu-needle-container">
            <div ref={leftNeedleRef} className="vu-needle" />
            <div className="vu-pivot-cap" />
          </div>
        </div>
      </div>

      {/* RIGHT CHANNEL VU METER */}
      <div className="analog-vu-meter-box">
        {/* Header with Channel Label & Peak LED */}
        <div className="vu-dial-header">
          <span className="vu-ch-label">CH-R</span>
          <div className="vu-peak-indicator">
            <span className={`vu-peak-led ${rightPeak ? 'vu-peak-on' : ''}`} />
            <span className="vu-peak-text">PEAK</span>
          </div>
        </div>

        {/* Backlit Dial Face */}
        <div className="vu-dial-face">
          {/* Printed Arc Scale SVG */}
          <svg viewBox="0 0 160 80" className="vu-scale-svg">
            <path
              d="M 22 70 A 62 62 0 0 1 122 28"
              fill="none"
              stroke="#222"
              strokeWidth="2"
            />
            <path
              d="M 122 28 A 62 62 0 0 1 146 44"
              fill="none"
              stroke="#d92438"
              strokeWidth="2.5"
            />

            <text x="20" y="76" className="vu-scale-text">-20</text>
            <text x="42" y="48" className="vu-scale-text">-10</text>
            <text x="68" y="34" className="vu-scale-text">-7</text>
            <text x="88" y="27" className="vu-scale-text">-5</text>
            <text x="108" y="24" className="vu-scale-text">-3</text>
            <text x="122" y="24" className="vu-scale-text vu-zero-text">0</text>
            <text x="135" y="30" className="vu-scale-text vu-red-text">+1</text>
            <text x="146" y="42" className="vu-scale-text vu-red-text">+3</text>
            <text x="76" y="55" className="vu-logo-text">VU</text>
          </svg>

          {/* Analog Physical Indicator Needle */}
          <div className="vu-needle-container">
            <div ref={rightNeedleRef} className="vu-needle" />
            <div className="vu-pivot-cap" />
          </div>
        </div>
      </div>
    </div>
  );
};
