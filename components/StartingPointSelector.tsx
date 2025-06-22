
import React from 'react';

export interface ExampleSong {
  name: string;
  path: string;
}

interface StartingPointSelectorProps {
  exampleSongs: ExampleSong[];
  currentFileName: string | null;
  startingPoint: string; // 'scratch', 'current_piece', 'upload_new', or example path
  onStartingPointChange: (value: string) => void;
}

export const StartingPointSelector: React.FC<StartingPointSelectorProps> = ({
  exampleSongs,
  currentFileName,
  startingPoint,
  onStartingPointChange,
}) => {
  return (
    <div className="flex flex-col">
      <label htmlFor="starting-point-selector" className="mb-1 text-xs font-medium text-slate-300 sr-only"> 
      {/* Visually hidden label, as context is provided by the sentence */}
        Starting From:
      </label>
      <select
        id="starting-point-selector"
        value={startingPoint}
        onChange={(e) => onStartingPointChange(e.target.value)}
        className="w-auto bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm focus:outline-none"
        aria-label="Select starting point for composition"
      >
        <option value="scratch">Scratch</option>
        {currentFileName && startingPoint !== 'scratch' && startingPoint !== 'upload_new' && (
          <option value="current_piece">Current Piece: {currentFileName}</option>
        )}
        {exampleSongs.map((song) => (
          <option key={song.path} value={song.path}>
            Example: {song.name}
          </option>
        ))}
        <option value="upload_new">Upload New MIDI...</option>
      </select>
    </div>
  );
};
