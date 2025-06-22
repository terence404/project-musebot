
import React, { useRef, useEffect, useState } from 'react';
import { ProcessedMidiTrack } from '../services/midiProcessor';
import { getInstrumentColor } from '../constants/midiMapping';
import { audioPlayer } from '../services/audioPlayer';
import { LoadingSpinner } from './LoadingSpinner';

interface MidiVisualizerProps {
  tracks: ProcessedMidiTrack[];
  totalDuration: number;
  isPlaying: boolean;
  onExtendAI: () => void;
  isPredictingAI: boolean;
  isLoading: boolean; 
  isReadyForAI: boolean;
}

const PIXELS_PER_SECOND = 60;
const NUM_VISUAL_OCTAVES = 3;
const SEMITONES_IN_OCTAVE = 12;
const TOTAL_VISUAL_SEMITONES = NUM_VISUAL_OCTAVES * SEMITONES_IN_OCTAVE;
const NOTE_SLOT_HEIGHT = 4; 
const NOTE_RECT_RENDER_HEIGHT = NOTE_SLOT_HEIGHT * 2; 
const MIN_NOTE_WIDTH = 2;
const VISUALIZER_BACKGROUND_COLOR = '#172033'; 

const EXTEND_BUTTON_WIDTH_NOTES_PRESENT = 40;
const EXTEND_BUTTON_WIDTH_SCRATCH_EMPTY = 100; 
const SCRUBBER_PIXEL_WIDTH = 2; // w-0.5 in Tailwind is 2px if 1rem = 16px

const ArrowRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

export const MidiVisualizer: React.FC<MidiVisualizerProps> = ({ 
    tracks, 
    totalDuration, 
    isPlaying,
    onExtendAI,
    isPredictingAI,
    isLoading,
    isReadyForAI
}) => {
  const [playbackScrubberPosition, setPlaybackScrubberPosition] = useState(0);
  const animationFrameIdRef = useRef<number | null>(null);
  
  const canvasHeight = TOTAL_VISUAL_SEMITONES * NOTE_SLOT_HEIGHT;

  // Condition for "Start" button mode: AI is ready, no tracks/duration (implies scratch mode from App.tsx logic for isReadyForAI)
  const isEffectivelyScratchAndEmpty = isReadyForAI && (!tracks || tracks.length === 0) && totalDuration === 0;

  const currentExtendButtonWidth = isEffectivelyScratchAndEmpty ? EXTEND_BUTTON_WIDTH_SCRATCH_EMPTY : EXTEND_BUTTON_WIDTH_NOTES_PRESENT;
  const notesCanvasWidth = isEffectivelyScratchAndEmpty ? 0 : Math.max(totalDuration * PIXELS_PER_SECOND, 100); 
  const scrollContentWidth = notesCanvasWidth + currentExtendButtonWidth;

  useEffect(() => {
    const updateScrubber = () => {
      if (isPlaying) {
        const currentTime = audioPlayer.getCurrentPlaybackTime();
        let newRawPosition = currentTime * PIXELS_PER_SECOND;
        
        const maxScrubberLeft = notesCanvasWidth > SCRUBBER_PIXEL_WIDTH 
          ? notesCanvasWidth - SCRUBBER_PIXEL_WIDTH 
          : 0;

        const newCappedPosition = Math.min(newRawPosition, maxScrubberLeft);
        
        setPlaybackScrubberPosition(newCappedPosition);
        animationFrameIdRef.current = requestAnimationFrame(updateScrubber);
      }
    };

    if (isPlaying) {
      animationFrameIdRef.current = requestAnimationFrame(updateScrubber);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      // Only reset to 0 if playback stopped AND time is effectively 0
      // This prevents snapping to 0 if paused mid-track.
      if (audioPlayer.getCurrentPlaybackTime() === 0 && !isPlaying) {
         setPlaybackScrubberPosition(0);
      }
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isPlaying, notesCanvasWidth]); // notesCanvasWidth is a dependency for maxScrubberLeft
  
  useEffect(() => {
    // Reset scrubber when totalDuration (and thus notesCanvasWidth) changes, e.g. new file loaded
    setPlaybackScrubberPosition(0);
  }, [totalDuration]); // totalDuration is a proxy for when the underlying MIDI data changes

  const showVisualizerArea = (tracks && tracks.length > 0 && totalDuration > 0) || isReadyForAI;

  if (!showVisualizerArea) {
    return (
      <div className="p-4 my-4 bg-slate-850 border border-slate-700 rounded-lg text-slate-400 text-center">
        No visual data to display. Load a MIDI or choose "From Scratch" with a style.
      </div>
    );
  }
  
  const buttonBaseClasses = "absolute top-0 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-800";
  let buttonSpecificClasses = "";
  const buttonStyleProps: React.CSSProperties = {
    left: `${notesCanvasWidth}px`,
    top: '0',
    width: `${currentExtendButtonWidth}px`,
    height: `${canvasHeight}px`,
    zIndex: 150, // Ensure button is above scrubber (scrubber is zIndex: 100)
  };

  if (isEffectivelyScratchAndEmpty && notesCanvasWidth === 0) {
    buttonSpecificClasses = "rounded-md hover:bg-teal-700/30"; // Full rounded corners
    buttonStyleProps.backgroundColor = VISUALIZER_BACKGROUND_COLOR; // Match visualizer background
  } else {
    buttonSpecificClasses = "bg-teal-600/70 hover:bg-teal-500/80 rounded-r-md";
  }
  const finalButtonClassName = `${buttonBaseClasses} ${buttonSpecificClasses}`;


  return (
    <div className="bg-slate-800 p-4 rounded-lg shadow-inner mb-6">
      <h3 className="text-xl font-semibold text-slate-100 mb-3">MIDI Visualizer</h3>
      <div 
        className="relative rounded-md overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 midi-visualizer-scroll-container"
        style={{ height: `${canvasHeight}px` }} 
        role="application"
        aria-roledescription="Condensed piano roll displaying MIDI notes and AI extend/start control"
      >
        <div 
          className="relative" 
          style={{ 
            width: `${scrollContentWidth}px`, 
            height: `${canvasHeight}px`,
             backgroundColor: (isEffectivelyScratchAndEmpty && notesCanvasWidth === 0) ? VISUALIZER_BACKGROUND_COLOR : undefined,
          }}
        >
          {/* Notes Canvas - only render if not in scratch and empty mode */}
          {!isEffectivelyScratchAndEmpty && notesCanvasWidth > 0 && (
            <div
              style={{
                width: `${notesCanvasWidth}px`,
                height: `${canvasHeight}px`,
                backgroundColor: VISUALIZER_BACKGROUND_COLOR,
                position: 'absolute', 
                left: 0,
                top: 0,
              }}
              aria-hidden={isEffectivelyScratchAndEmpty}
            >
              {/* Time grid lines */}
              {Array.from({ length: Math.floor(totalDuration) + 1 }).map((_, sec) => (
                <div
                  key={`time-grid-${sec}`}
                  className="absolute top-0 bottom-0 border-l border-slate-700/50"
                  style={{ left: `${sec * PIXELS_PER_SECOND}px`, width: '1px' }}
                  aria-hidden="true"
                ></div>
              ))}

              {/* Notes */}
              {tracks && tracks.map((track) => 
                track.notes.map((note, noteIndex) => {
                  const noteColor = getInstrumentColor(track.instrumentName);
                  const noteX = note.time * PIXELS_PER_SECOND;
                  const noteWidth = Math.max(note.duration * PIXELS_PER_SECOND, MIN_NOTE_WIDTH);
                  
                  const visualPitchInSemitones = note.midi % TOTAL_VISUAL_SEMITONES;
                  const noteY_slot_top = ( (TOTAL_VISUAL_SEMITONES - 1) - visualPitchInSemitones ) * NOTE_SLOT_HEIGHT; 
                  const noteDrawingTop = noteY_slot_top - (NOTE_SLOT_HEIGHT / 2); 

                  return (
                    <div
                      key={`note-${track.instrumentName}-${note.midi}-${note.time}-${noteIndex}`}
                      className="absolute opacity-90 hover:opacity-100 transition-opacity"
                      style={{
                        left: `${noteX}px`,
                        top: `${noteDrawingTop}px`,
                        width: `${noteWidth}px`,
                        height: `${NOTE_RECT_RENDER_HEIGHT}px`,
                        backgroundColor: noteColor,
                        boxSizing: 'border-box', 
                      }}
                      title={`${note.name}\nInstrument: ${track.instrumentName}\nTime: ${note.time.toFixed(2)}s`}
                      aria-label={`Note ${note.name} for ${track.instrumentName} at ${note.time.toFixed(2)} seconds`}
                    >
                    </div>
                  );
                })
              )}

              {/* Playback Scrubber */}
              {isPlaying && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500/70 pointer-events-none"
                  style={{ left: `${playbackScrubberPosition}px`, zIndex: 100 }} 
                  aria-hidden="true"
                ></div>
              )}
            </div>
          )}

          {/* Extend with AI Button / Start Button */}
          <button
            onClick={onExtendAI}
            disabled={isPredictingAI || isLoading || !isReadyForAI}
            className={finalButtonClassName}
            style={buttonStyleProps} // zIndex is now applied here
            title={isEffectivelyScratchAndEmpty ? "Compose From Scratch with AI" : "Extend current piece with AI"}
            aria-label={isEffectivelyScratchAndEmpty ? "Start composing from scratch with AI" : "Extend current piece with AI"}
          >
            {isPredictingAI ? <LoadingSpinner sizeClasses="w-10 h-10" /> : (
              isEffectivelyScratchAndEmpty ? (
                <div className="flex items-center justify-center"> 
                  <span className="mr-1.5">Start</span> <ArrowRightIcon className="w-5 h-5" />
                </div>
              ) : (
                <ArrowRightIcon className="w-6 h-6" />
              )
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
