
import React, { useState, useEffect } from 'react';

interface OutputDisplayProps {
  text: string;
}

const ClipboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V4.5m7.332 0A2.25 2.25 0 0013.5 2.25h-3c1.03 0 1.9.693 2.166 1.638m0 1.25h.008M5.25 7.5h13.5c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125H5.25c-.621 0-1.125-.504-1.125-1.125V8.625c0-.621.504-1.125 1.125-1.125z" />
  </svg>
);

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);


export const OutputDisplay: React.FC<OutputDisplayProps> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      alert("Failed to copy text. Please copy manually.");
    }
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!text) return null;

  return (
    <div className="mt-2 w-full"> {/* Reduced top margin */}
      <div className="flex justify-end items-center mb-2"> {/* Reduced bottom margin, align button to right */}
        <button
          onClick={handleCopy}
          className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800
            ${copied 
              ? 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-400' 
              : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'}`}
          disabled={copied}
          aria-label={copied ? "Text copied to clipboard" : "Copy MIDI text to clipboard"}
        >
          {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
          <span>{copied ? 'Copied!' : 'Copy Text'}</span>
        </button>
      </div>
      <pre className="p-3 bg-slate-850 border border-slate-700 rounded-lg text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap break-words min-h-[150px] max-h-[300px] shadow-inner scrollbar-thin"> {/* Adjusted padding, font size, min/max height */}
        {text}
      </pre>
    </div>
  );
};