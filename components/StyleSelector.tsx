
import React from 'react';

export interface StyleOption {
  name: string;
  fileName: string;
  path: string;
  content: string | null; // To store fetched content
}

interface StyleSelectorProps {
  availableStyles: StyleOption[];
  selectedStyleFileName: string;
  onStyleChange: (fileName: string) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  availableStyles,
  selectedStyleFileName,
  onStyleChange,
}) => {
  if (availableStyles.length === 0) {
    return <p className="text-sm text-slate-400">Loading styles...</p>;
  }

  return (
    <div className="flex flex-col">
      {/* Visually hidden label, as context is provided by the sentence in App.tsx */}
      <label htmlFor="style-selector" className="sr-only"> 
        Composition Style
      </label>
      <select
        id="style-selector"
        value={selectedStyleFileName}
        onChange={(e) => onStyleChange(e.target.value)}
        className="w-full sm:w-auto bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm focus:outline-none"
        aria-label="Select composition style"
      >
        {availableStyles.map((style) => (
          <option key={style.fileName} value={style.fileName}>
            {style.name}
          </option>
        ))}
        {availableStyles.length === 0 && <option disabled>No styles available</option>}
      </select>
    </div>
  );
};
