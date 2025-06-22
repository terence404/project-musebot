
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface TextToMidiInputProps {
  midiText: string;
  onTextChange: (text: string) => void;
  onConvert: () => void;
  isConverting: boolean;
  conversionError: string | null;
}

const ConvertIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991 0-3.182-3.182m0 0a8.25 8.25 0 0 0-11.667 0l3.182 3.182M12 5.25v2.087m0 0C12.522 7.661 13 8.107 13 8.625v.553c0 .44-.448.874-1 .999m-1 .001v2.087m0 0c.522.338 1 .784 1 1.3v.553c0 .44-.448.875-1 .999m0 0v2.086m0 0A.75.75 0 0 0 12 18.75h.008a.75.75 0 0 0 .75-.75V16.5M12 16.5V9.75M12 9.75a3 3 0 0 1 3-3h.008a3 3 0 0 1 3 3v.375" />
</svg>
);


export const TextToMidiInput: React.FC<TextToMidiInputProps> = ({
  midiText,
  onTextChange,
  onConvert,
  isConverting,
  conversionError,
}) => {
  return (
    <div className="mt-2 w-full"> {/* Reduced top margin */}
      <p className="text-xs text-slate-400 mb-2">
        Paste structured MIDI text (like the app's output format) to convert to MIDI.
      </p>
      <textarea
        value={midiText}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Paste structured MIDI text here..."
        className="w-full h-36 sm:h-40 p-3 bg-slate-850 border border-slate-700 rounded-lg text-xs text-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none scrollbar-thin resize-y"
        aria-label="MIDI text input for conversion"
      />
      {conversionError && (
        <p className="mt-2 text-xs text-red-400" role="alert">
          Error: {conversionError}
        </p>
      )}
      <button
        onClick={onConvert}
        disabled={isConverting || !midiText.trim()}
        className="mt-3 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-500 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-800"
        aria-label="Convert text to MIDI and play"
      >
        {isConverting ? (
          <>
            <LoadingSpinner sizeClasses="w-5 h-5" /> 
            <span className="ml-2">Converting...</span>
          </>
        ) : (
          <>
            <ConvertIcon className="w-5 h-5" />
            <span>Convert to MIDI & Play</span>
          </>
        )}
      </button>
    </div>
  );
};
