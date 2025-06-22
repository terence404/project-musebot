
import React from 'react';

// Define the type for a single grounding chunk, focusing on web sources
export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  // Add other potential chunk types if needed in the future
}

interface GroundingSourcesDisplayProps {
  chunks: GroundingChunk[] | null;
}

export const GroundingSourcesDisplay: React.FC<GroundingSourcesDisplayProps> = ({ chunks }) => {
  if (!chunks || chunks.length === 0) {
    return null;
  }

  const validLinks = chunks.filter(chunk => chunk.web && chunk.web.uri);

  if (validLinks.length === 0) {
    // Optionally, display a message if grounding was attempted but no usable web sources were found
    // return <p className="text-sm text-slate-400 mt-2">No web grounding sources found for this generation.</p>;
    return null; 
  }

  return (
    <div className="mt-4 p-4 bg-slate-700/60 rounded-lg shadow">
      <h4 className="text-md font-semibold text-slate-200 mb-2">
        Grounding Sources:
      </h4>
      <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-500 scrollbar-track-slate-700/50">
        {validLinks.map((chunk, index) => (
          <li key={index} className="text-xs text-slate-300 truncate">
            <a
              href={chunk.web!.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 hover:underline focus:outline-none focus:ring-1 focus:ring-blue-300 rounded"
              title={chunk.web!.uri} 
            >
              {chunk.web!.title || chunk.web!.uri}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
