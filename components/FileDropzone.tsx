
import React, { useCallback, useState } from 'react';

interface FileDropzoneProps {
  onFileAccepted: (file: File) => void;
  accept?: string;
}

const UploadCloudIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 group-hover:text-blue-400 transition-colors" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75m-7.5 3L4.5 12M21 12l-3.75 3.75M3 17.25V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25z" />
  </svg>
);


export const FileDropzone: React.FC<FileDropzoneProps> = ({ onFileAccepted, accept }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.mid') || file.name.toLowerCase().endsWith('.midi') || file.type === "audio/midi" || file.type === "audio/mid") {
        onFileAccepted(file);
      } else {
        alert("Please upload a valid MIDI file (.mid, .midi).");
      }
      e.dataTransfer.clearData();
    }
  }, [onFileAccepted]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
       if (file.name.toLowerCase().endsWith('.mid') || file.name.toLowerCase().endsWith('.midi') || file.type === "audio/midi" || file.type === "audio/mid") {
        onFileAccepted(file);
      } else {
        alert("Please upload a valid MIDI file (.mid, .midi).");
      }
    }
  };

  const inputId = 'file-upload-input-' + React.useId(); 

  return (
    <div
      className={`group relative flex flex-col items-center justify-center w-full p-3 sm:p-4 border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out
        ${isDragging ? 'border-blue-500 bg-slate-700 scale-105' : 'border-slate-600 hover:border-slate-500 bg-slate-700/50 hover:bg-slate-700'}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ minHeight: '100px' }} 
    >
      <input
        type="file"
        id={inputId}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept={accept || ".mid,.midi,audio/midi,audio/mid"}
        onChange={handleFileChange}
        aria-label="Upload MIDI file"
      />
      <label htmlFor={inputId} className="flex flex-col items-center justify-center cursor-pointer text-center p-2">
        <UploadCloudIcon />
        <p className="mt-1 text-xs sm:text-sm font-medium text-slate-300 group-hover:text-slate-100">
          <span className="font-semibold text-blue-400 group-hover:text-blue-300">Click to upload</span> or drag & drop MIDI
        </p>
        <p className="text-xs text-slate-400 group-hover:text-slate-300">(.mid, .midi)</p>
      </label>
    </div>
  );
};
