import React, { useContext } from 'react';
import { VolumeControlContext, InstrumentVolumes } from '../contexts/VolumeControlContext';

const InstrumentVolumeSlider: React.FC<{
  instrumentKey: keyof InstrumentVolumes;
  label: string;
  minDb?: number;
  maxDb?: number;
  step?: number;
}> = ({ instrumentKey, label, minDb = -40, maxDb = 6, step = 0.1 }) => {
  const context = useContext(VolumeControlContext);
  if (!context) {
    throw new Error("InstrumentVolumeSlider must be used within a VolumeControlProvider");
  }

  const { volumes, setVolume } = context;
  const currentVolume = volumes[instrumentKey];

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(instrumentKey, parseFloat(event.target.value));
  };

  return (
    <div className="mb-3">
      <label htmlFor={`${instrumentKey}-volume`} className="block text-xs font-medium text-slate-300 mb-1">
        {label}: {currentVolume.toFixed(1)} dB
      </label>
      <input
        type="range"
        id={`${instrumentKey}-volume`}
        name={`${instrumentKey}-volume`}
        min={minDb}
        max={maxDb}
        step={step}
        value={currentVolume}
        onChange={handleChange}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        aria-label={`${label} volume`}
      />
    </div>
  );
};


export const VolumeControls: React.FC = () => {
  return (
    <div className="p-4 bg-slate-700/70 rounded-lg shadow-md mt-4">
      <h4 className="text-md font-semibold text-slate-100 mb-3">Instrument Volumes</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        <InstrumentVolumeSlider instrumentKey="piano" label="Piano" />
        <InstrumentVolumeSlider instrumentKey="drums" label="Drums" />
        <InstrumentVolumeSlider instrumentKey="bass" label="Bass" />
        <InstrumentVolumeSlider instrumentKey="koto" label="Koto" />
        <InstrumentVolumeSlider instrumentKey="trombone" label="Trombone" />
        <InstrumentVolumeSlider instrumentKey="violin" label="Violin" />
      </div>
    </div>
  );
};
