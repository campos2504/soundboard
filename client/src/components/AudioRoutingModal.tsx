import React, { useState, useEffect } from 'react';
import { X, Volume2, Headphones, Sliders, CheckCircle2, ShieldCheck, Play, Bell } from 'lucide-react';
import type { AudioOutputDevice, AudioRoutingConfig } from '../types';
import { AudioEngine } from '../services/AudioEngine';

interface AudioRoutingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AudioRoutingConfig;
  onSaveConfig: (newConfig: Partial<AudioRoutingConfig>) => void;
}

const SAMPLE_SOUND = {
  id: 'test_sample_sound',
  title: 'Vine Boom Test',
  url: 'https://soundbuttonsworld.com/uploads/707db471-c834-494e-a3d9-ada985203ef6.mp3',
  source: 'soundbuttonsworld' as const,
  tags: ['test'],
  createdAt: Date.now(),
};

export const AudioRoutingModal: React.FC<AudioRoutingModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [devices, setDevices] = useState<AudioOutputDevice[]>([]);
  const [primaryDevice, setPrimaryDevice] = useState(config.primaryDeviceId);
  const [secondaryDevice, setSecondaryDevice] = useState(config.secondaryDeviceId);
  const [masterVolume, setMasterVolume] = useState(config.masterVolume);
  const [previewVolume, setPreviewVolume] = useState(config.previewVolume);
  const [dualOutput, setDualOutput] = useState(config.dualOutputEnabled);
  const [overlapMode, setOverlapMode] = useState(config.overlapMode);
  const [earProtection, setEarProtection] = useState(config.earProtectionMode !== false);
  const [testingPrimaryTone, setTestingPrimaryTone] = useState(false);
  const [testingSecondaryTone, setTestingSecondaryTone] = useState(false);
  const [testingPrimarySample, setTestingPrimarySample] = useState(false);
  const [testingSecondarySample, setTestingSecondarySample] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const refreshDevices = async (forcePrompt: boolean = false) => {
    const list = await AudioEngine.getAvailableOutputDevices(forcePrompt);
    setDevices(list);
    if (list.some((d) => d.label && !d.label.startsWith('Saída de Áudio'))) {
      setPermissionGranted(true);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshDevices();
      setPrimaryDevice(config.primaryDeviceId);
      setSecondaryDevice(config.secondaryDeviceId);
      setMasterVolume(config.masterVolume);
      setPreviewVolume(config.previewVolume);
      setDualOutput(config.dualOutputEnabled);
      setOverlapMode(config.overlapMode);
      setEarProtection(config.earProtectionMode !== false);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleSelectPrimary = (devId: string) => {
    setPrimaryDevice(devId);
    const pDev = devices.find((d) => d.deviceId === devId);
    AudioEngine.saveConfig({
      primaryDeviceId: devId,
      primaryDeviceLabel: pDev?.label || 'Padrão do Sistema',
    });
  };

  const handleSelectSecondary = (devId: string) => {
    setSecondaryDevice(devId);
    const sDev = devices.find((d) => d.deviceId === devId);
    AudioEngine.saveConfig({
      secondaryDeviceId: devId,
      secondaryDeviceLabel: sDev?.label || 'Padrão do Sistema',
    });
  };

  const handleTestTone = async (target: 'primary' | 'secondary') => {
    if (target === 'primary') {
      setTestingPrimaryTone(true);
      await AudioEngine.playTestTone(primaryDevice, false);
      setTimeout(() => setTestingPrimaryTone(false), 600);
    } else {
      setTestingSecondaryTone(true);
      await AudioEngine.playTestTone(secondaryDevice, true);
      setTimeout(() => setTestingSecondaryTone(false), 600);
    }
  };

  const handleTestSampleSound = async (target: 'primary' | 'secondary') => {
    if (target === 'primary') {
      setTestingPrimarySample(true);
      await AudioEngine.play(SAMPLE_SOUND, false);
      setTimeout(() => setTestingPrimarySample(false), 1500);
    } else {
      setTestingSecondarySample(true);
      await AudioEngine.play(SAMPLE_SOUND, true);
      setTimeout(() => setTestingSecondarySample(false), 1500);
    }
  };

  const handleSave = () => {
    const pDev = devices.find((d) => d.deviceId === primaryDevice);
    const sDev = devices.find((d) => d.deviceId === secondaryDevice);

    const updated = {
      primaryDeviceId: primaryDevice,
      primaryDeviceLabel: pDev?.label || 'Padrão do Sistema',
      secondaryDeviceId: secondaryDevice,
      secondaryDeviceLabel: sDev?.label || 'Padrão do Sistema',
      masterVolume,
      previewVolume,
      dualOutputEnabled: dualOutput,
      overlapMode,
      earProtectionMode: earProtection,
    };

    onSaveConfig(updated);
    AudioEngine.saveConfig(updated);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-deck" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-deck">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sliders size={22} color="var(--deck-cyan)" />
            <h2>Roteamento de Saídas de Áudio & Teste</h2>
          </div>
          <button className="icon-btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Device Permission Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            background: 'rgba(26, 159, 255, 0.08)',
            border: '1px solid rgba(26, 159, 255, 0.25)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={20} color="var(--deck-cyan)" />
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                {permissionGranted ? 'Dispositivos de Áudio Desbloqueados' : 'Desbloquear Nomes de Dispositivos'}
              </span>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {permissionGranted
                  ? 'O navegador está autorizado a rotear áudio para cada placa/fone.'
                  : 'Clique para permitir que o navegador identifique seus fones, cabos virtuais e auto-falantes.'}
              </p>
            </div>
          </div>
          <button
            className="btn-steamdeck btn-steamdeck-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
            onClick={() => refreshDevices(true)}
          >
            {permissionGranted ? 'Atualizar Lista' : 'Desbloquear'}
          </button>
        </div>

        {/* Primary Output Device */}
        <div className="form-group-deck" style={{ background: 'rgba(26, 159, 255, 0.04)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(26, 159, 255, 0.15)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--deck-cyan-light)', fontWeight: 700 }}>
            <Volume2 size={16} />
            SAÍDA PRINCIPAL 1 [A] (Transmissão / Discord / Cabo Virtual / Auto-falantes)
          </label>
          <select
            className="select-deck"
            value={primaryDevice}
            onChange={(e) => handleSelectPrimary(e.target.value)}
            style={{ marginTop: '0.3rem', marginBottom: '0.5rem' }}
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className={`btn-steamdeck ${testingPrimaryTone ? 'btn-steamdeck-primary' : 'btn-steamdeck-secondary'}`}
              onClick={() => handleTestTone('primary')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
            >
              <Bell size={13} />
              <span>{testingPrimaryTone ? 'Tocando Tom...' : 'Tom de Teste (Saída 1)'}</span>
            </button>
            <button
              className={`btn-steamdeck ${testingPrimarySample ? 'btn-steamdeck-primary' : 'btn-steamdeck-secondary'}`}
              onClick={() => handleTestSampleSound('primary')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
            >
              <Play size={13} />
              <span>{testingPrimarySample ? 'Tocando Meme...' : 'Som de Teste Meme (Saída 1)'}</span>
            </button>
          </div>
        </div>

        {/* SECONDARY OUTPUT DEVICE (TEST PILL) */}
        <div className="form-group-deck" style={{ background: 'rgba(255, 119, 0, 0.04)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 119, 0, 0.2)', marginTop: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffaa44', fontWeight: 700 }}>
            <Headphones size={16} />
            SAÍDA SECUNDÁRIA 2 [X] - PÍLULA DE TESTE (Fones de Ouvido / Monitor de Áudio)
          </label>
          <select
            className="select-deck"
            value={secondaryDevice}
            onChange={(e) => handleSelectSecondary(e.target.value)}
            style={{ marginTop: '0.3rem', marginBottom: '0.5rem' }}
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className={`btn-steamdeck ${testingSecondaryTone ? 'btn-steamdeck-amber' : 'btn-steamdeck-secondary'}`}
              onClick={() => handleTestTone('secondary')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem', borderColor: '#ff7700', color: '#ffaa44' }}
            >
              <Bell size={13} />
              <span>{testingSecondaryTone ? 'Tocando Tom...' : 'Tom de Teste (Saída 2)'}</span>
            </button>
            <button
              className={`btn-steamdeck ${testingSecondarySample ? 'btn-steamdeck-amber' : 'btn-steamdeck-secondary'}`}
              onClick={() => handleTestSampleSound('secondary')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem', borderColor: '#ff7700', color: '#ffaa44' }}
            >
              <Headphones size={13} />
              <span>{testingSecondarySample ? 'Tocando Meme...' : 'Som de Teste Meme (Saída 2)'}</span>
            </button>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Ao clicar no botão <strong>Testar [X]</strong> em qualquer som na Soundboard, o áudio será enviado <strong>exclusivamente para esta saída secundária</strong>!
          </p>
        </div>

        {/* Volumes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.25rem 0' }}>
          <div className="form-group-deck">
            <label>Volume Saída Principal ({Math.round(masterVolume * 100)}%)</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={masterVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setMasterVolume(val);
                AudioEngine.saveConfig({ masterVolume: val });
              }}
              className="volume-slider"
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group-deck">
            <label>Volume Pílula de Teste / Fones ({Math.round(previewVolume * 100)}%)</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={previewVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setPreviewVolume(val);
                AudioEngine.saveConfig({ previewVolume: val });
              }}
              className="volume-slider"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Mode Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={dualOutput}
              onChange={(e) => {
                setDualOutput(e.target.checked);
                AudioEngine.saveConfig({ dualOutputEnabled: e.target.checked });
              }}
              style={{ width: '18px', height: '18px', accentColor: 'var(--neon-pink)' }}
            />
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                Habilitar Saída Dupla Simultânea
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Ao tocar um som normal, reproduz ao mesmo tempo na saída principal e secundária.
              </p>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={overlapMode === 'cut'}
              onChange={(e) => {
                const mode = e.target.checked ? 'cut' : 'overlap';
                setOverlapMode(mode);
                AudioEngine.saveConfig({ overlapMode: mode });
              }}
              style={{ width: '18px', height: '18px', accentColor: 'var(--deck-cyan)' }}
            />
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                Modo Cortar Som Anterior
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Interrompe sons anteriores ao disparar um novo som.
              </p>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', background: 'rgba(0, 255, 136, 0.06)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(0, 255, 136, 0.25)' }}>
            <input
              type="checkbox"
              checked={earProtection}
              onChange={(e) => {
                setEarProtection(e.target.checked);
                AudioEngine.saveConfig({ earProtectionMode: e.target.checked });
              }}
              style={{ width: '18px', height: '18px', accentColor: 'var(--neon-green)' }}
            />
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--neon-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Proteção Auricular Anti-Estouro (Limiter Dinâmico nos Fones)
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Comprime e limita automaticamente o ganho de memes explosivos na saída de teste para evitar saturação e proteger seus ouvidos.
              </p>
            </div>
          </label>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn-steamdeck btn-steamdeck-secondary" onClick={onClose}>
            Fechar
          </button>
          <button className="btn-steamdeck btn-steamdeck-primary" onClick={handleSave}>
            <CheckCircle2 size={16} />
            <span>Salvar Configurações</span>
          </button>
        </div>
      </div>
    </div>
  );
};
