import React, { createContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

export interface InstrumentVolumes {
  piano: number;
  drums: number;
  bass: number;
  koto: number;
  trombone: number;
  violin: number;
}

export interface VolumeControlContextType {
  volumes: InstrumentVolumes;
  setVolume: (instrument: keyof InstrumentVolumes, value: number) => void;
  setVolumes: Dispatch<SetStateAction<InstrumentVolumes>>;
}

export const defaultVolumes: InstrumentVolumes = {
  piano: 3.52,
  drums: 0,
  bass: 0,
  koto: 0,
  trombone: 0,
  violin: 0,
};

export const VolumeControlContext = createContext<VolumeControlContextType | undefined>(undefined);

interface VolumeControlProviderProps {
  children: ReactNode;
}

export const VolumeControlProvider: React.FC<VolumeControlProviderProps> = ({ children }) => {
  const [volumes, setVolumesState] = useState<InstrumentVolumes>(defaultVolumes);

  const setVolume = (instrument: keyof InstrumentVolumes, value: number) => {
    setVolumesState(prevVolumes => ({
      ...prevVolumes,
      [instrument]: value,
    }));
  };
  
  const setVolumes = (newVolumesOrUpdater: SetStateAction<InstrumentVolumes>) => {
    setVolumesState(newVolumesOrUpdater);
  };

  return (
    <VolumeControlContext.Provider value={{ volumes, setVolume, setVolumes }}>
      {children}
    </VolumeControlContext.Provider>
  );
};
