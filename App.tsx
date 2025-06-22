
import React, { useState, useCallback, useEffect, useContext } from 'react';
import { FileDropzone } from './components/FileDropzone';
import { OutputDisplay } from './components/OutputDisplay';
import { MidiVisualizer } from './components/MidiVisualizer';
import { LoadingSpinner } from './components/LoadingSpinner';
import { GoogleGenAI, GenerateContentResponse as GenAIResponse } from "@google/genai"; 
import { processMidiFile, ProcessedMidiOutput, processMidiData, extractFileNameFromMidiText } from './services/midiProcessor';
import { convertTextToMidi, downloadMidi } from './services/textToMidiConverter';
import { audioPlayer } from './services/audioPlayer';
import { PlaybackControls } from './components/PlaybackControls';
// import { TextToMidiInput } from './components/TextToMidiInput'; // Hidden for now
import { GroundingSourcesDisplay, GroundingChunk } from './components/GroundingSourcesDisplay';
import { VolumeControlProvider, VolumeControlContext } from './contexts/VolumeControlContext';
import { VolumeControls } from './components/VolumeControls';
import { Midi } from '@tonejs/midi';
import * as Tone from 'tone';
import { StyleSelector, StyleOption } from './components/StyleSelector';
import { StartingPointSelector, ExampleSong } from './components/StartingPointSelector';
import { CollapsibleSection } from './components/CollapsibleSection';

const PREDEFINED_STYLES: Omit<StyleOption, 'content'>[] = [
  { name: "Jazz", fileName: "jazz.txt", path: "/contexts/jazz.txt"},
  { name: "Classical", fileName: "classical.txt", path: "/contexts/classical.txt" },
  { name: "Pop", fileName: "pop.txt", path: "/contexts/pop.txt" },
];

const EXAMPLE_SONGS_FOR_SELECTOR: ExampleSong[] = [
    { name: "Mary Had a Little Lamb", path: "/examples/mary.mid" },
    { name: "Lady Gaga - Bad Romance", path: "/examples/bad-romance.mid" },
];


const MidiIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
  </svg>
);

const MixerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
  </svg>
);

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

const ArrowUturnLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
  </svg>
);

const DocumentTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);


// Helper function to get duration from text
const getDurationFromMidiText = (text: string): number => {
  if (!text) return 0;
  let maxEndTime = 0;
  const lines = text.split('\n');
  let inInstrumentSection = false; 

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("Instrument:")) {
      inInstrumentSection = true; 
      continue; 
    }
    
    if (!inInstrumentSection && !trimmedLine.startsWith("Note:")) continue;

    if (trimmedLine.startsWith("Note:")) {
      const noteDataMatch = trimmedLine.match(/Time:\s*([\d.]+?)s,\s*Duration:\s*([\d.]+?)s/);
      if (noteDataMatch && noteDataMatch[1] && noteDataMatch[2]) {
        const time = parseFloat(noteDataMatch[1]);
        const duration = parseFloat(noteDataMatch[2]);
        if (!isNaN(time) && !isNaN(duration)) {
          const endTime = time + duration;
          if (endTime > maxEndTime) {
            maxEndTime = endTime;
          }
        } else {
          console.warn("Failed to parse time/duration for line:", trimmedLine);
        }
      }
    }
  }
  return maxEndTime;
};

interface HistoryState {
  processedData: ProcessedMidiOutput | null;
  midiTextForConversion: string;
  activeMidiObjectForPlayback: Midi | null;
  originalFileArrayBuffer: ArrayBuffer | null; 
  aiPrediction: string | null;
  groundingChunks: GroundingChunk[] | null;
  currentStartingPoint: string; // Keep track of starting point in history
  fileNameFromLoad: string | null; // Keep track of fileName in history
}
const MAX_HISTORY_SIZE = 10;

const AppContent = (): JSX.Element | null => {
  const [processedData, setProcessedData] = useState<ProcessedMidiOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileNameFromLoad, setFileNameFromLoad] = useState<string | null>(null);

  const [aiPrediction, setAiPrediction] = useState<string | null>(null); 
  const [isPredictingAi, setIsPredictingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const [availableStyles, setAvailableStyles] = useState<StyleOption[]>([]);
  const [selectedStyleFileName, setSelectedStyleFileName] = useState<string>(PREDEFINED_STYLES[0]?.fileName || "");
  const [styleContextText, setStyleContextText] = useState<string | null>(null);


  const [midiTextForConversion, setMidiTextForConversion] = useState<string>(""); 
  const [activeMidiObjectForPlayback, setActiveMidiObjectForPlayback] = useState<Midi | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  
  const [originalFileArrayBuffer, setOriginalFileArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[] | null>(null);
  const [showVolumeControls, setShowVolumeControls] = useState<boolean>(false);
  
  const [currentStartingPoint, setCurrentStartingPoint] = useState<string>('scratch'); // 'scratch', 'current_piece', 'upload_new', or example path
  const [showFileDropzone, setShowFileDropzone] = useState<boolean>(false);

  const [historyStack, setHistoryStack] = useState<HistoryState[]>([]);

  const volumeContext = useContext(VolumeControlContext);
  if (!volumeContext) {
     console.error("VolumeControlContext not found, this should not happen if AppContent is wrapped in VolumeControlProvider.");
     return null; 
  }
  const { volumes } = volumeContext;

  useEffect(() => { audioPlayer.setPianoVolume(volumes.piano); }, [volumes.piano]);
  useEffect(() => { audioPlayer.setDrumVolume(volumes.drums); }, [volumes.drums]);
  useEffect(() => { audioPlayer.setBassVolume(volumes.bass); }, [volumes.bass]);
  useEffect(() => { audioPlayer.setKotoVolume(volumes.koto); }, [volumes.koto]);
  useEffect(() => { audioPlayer.setTromboneVolume(volumes.trombone); }, [volumes.trombone]);
  useEffect(() => { audioPlayer.setViolinVolume(volumes.violin); }, [volumes.violin]);


  useEffect(() => {
    const loadStyles = async () => {
      const loadedStyles: StyleOption[] = [];
      for (const style of PREDEFINED_STYLES) {
        try {
          const response = await fetch(style.path);
          if (!response.ok) {
            console.warn(`Failed to load style context: ${style.name} from ${style.path}`);
            continue;
          }
          const textContent = await response.text();
          loadedStyles.push({ ...style, content: textContent });
        } catch (err) {
          console.error(`Error fetching style context ${style.name}:`, err);
        }
      }
      setAvailableStyles(loadedStyles);
      if (loadedStyles.length > 0 && !selectedStyleFileName) {
        setSelectedStyleFileName(loadedStyles[0].fileName);
      }
    };
    loadStyles();
  }, []);
  
  useEffect(() => {
    const selectedStyle = availableStyles.find(s => s.fileName === selectedStyleFileName);
    if (selectedStyle && selectedStyle.content) {
      setStyleContextText(selectedStyle.content);
    } else if (selectedStyle) { 
      fetch(selectedStyle.path)
        .then(response => {
          if (!response.ok) throw new Error(`Failed to load context for ${selectedStyle.name}`);
          return response.text();
        })
        .then(text => {
          setStyleContextText(text);
          setAvailableStyles(prevStyles => prevStyles.map(s => s.fileName === selectedStyleFileName ? {...s, content: text} : s));
        })
        .catch(err => {
          console.error(`Failed to load style context for ${selectedStyle.name}:`, err);
          setAiError(`Failed to load stylistic context for ${selectedStyle.name}. AI features might be limited.`);
          setStyleContextText(null); 
        });
    } else {
      setStyleContextText(null); 
    }
  }, [selectedStyleFileName, availableStyles]);


  useEffect(() => {
    const callback = () => setIsPlaying(audioPlayer.isPlaying);
    audioPlayer.onPlaybackStateChange(callback);
    return () => audioPlayer.onPlaybackStateChange(null); 
  }, []);

  const commonResetLogic = (isFullClear: boolean = true) => {
    setError(null);
    setAiPrediction(null);
    setAiError(null);
    setPlayerError(null);
    setGroundingChunks(null);
    audioPlayer.stop();

    if(isFullClear) {
        setProcessedData(null);
        setActiveMidiObjectForPlayback(null);
        setMidiTextForConversion("");
        setOriginalFileArrayBuffer(null);
        setFileNameFromLoad(null);
    }
  };

  const pushToHistory = useCallback(() => {
    const currentState: HistoryState = {
      processedData: processedData ? JSON.parse(JSON.stringify(processedData)) : null,
      midiTextForConversion,
      activeMidiObjectForPlayback: activeMidiObjectForPlayback ? new Midi(activeMidiObjectForPlayback.toArray()) : null,
      originalFileArrayBuffer: originalFileArrayBuffer ? originalFileArrayBuffer.slice(0) : null,
      aiPrediction,
      groundingChunks,
      currentStartingPoint,
      fileNameFromLoad,
    };
    setHistoryStack(prev => {
      const newStack = [currentState, ...prev];
      if (newStack.length > MAX_HISTORY_SIZE) {
        return newStack.slice(0, MAX_HISTORY_SIZE);
      }
      return newStack;
    });
  }, [processedData, midiTextForConversion, activeMidiObjectForPlayback, originalFileArrayBuffer, aiPrediction, groundingChunks, currentStartingPoint, fileNameFromLoad]);

  const handleRevert = () => {
    if (historyStack.length > 0) {
      const prevState = historyStack[0]; 
      setHistoryStack(prev => prev.slice(1)); 

      setProcessedData(prevState.processedData);
      setMidiTextForConversion(prevState.midiTextForConversion);
      setActiveMidiObjectForPlayback(prevState.activeMidiObjectForPlayback);
      setOriginalFileArrayBuffer(prevState.originalFileArrayBuffer);
      setFileNameFromLoad(prevState.fileNameFromLoad); 
      setAiPrediction(prevState.aiPrediction);
      setGroundingChunks(prevState.groundingChunks);
      setCurrentStartingPoint(prevState.currentStartingPoint);

      setError(null);
      setPlayerError(null);
      setAiError(null);
      setShowFileDropzone(prevState.currentStartingPoint === 'upload_new'); 

      audioPlayer.stop(); 
      if (prevState.activeMidiObjectForPlayback) {
        // No auto-play on revert for now, user can press play
      }
    }
  };

const processNewMidi = async (arrayBuffer: ArrayBuffer, fileName: string) => {
    commonResetLogic(false); 
    setIsLoading(true);
    setFileNameFromLoad(fileName); 
    
    try {
        setOriginalFileArrayBuffer(arrayBuffer);
        const midiObj = new Midi(arrayBuffer); 
        const result = await processMidiData(midiObj, fileName); 
        
        setProcessedData(result); 
        setMidiTextForConversion(result.text);
        setActiveMidiObjectForPlayback(midiObj);
        
    } catch (err) {
        console.error(err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(`Error processing MIDI: ${errorMsg}`);
        setFileNameFromLoad(null);
        setOriginalFileArrayBuffer(null);
        setActiveMidiObjectForPlayback(null);
        setProcessedData(null); 
    } finally {
        setIsLoading(false);
    }
};


  const handleFileAccepted = useCallback(async (file: File) => {
    pushToHistory(); 
    setShowFileDropzone(false); 

    const arrayBuffer = await file.arrayBuffer();
    await processNewMidi(arrayBuffer, file.name);
    setCurrentStartingPoint('current_piece'); 
    
  }, [pushToHistory]);

  const handleExampleSongSelected = useCallback(async (songPath: string) => {
    pushToHistory();
    
    if (!songPath) { 
      commonResetLogic();
      setFileNameFromLoad(null);
      setOriginalFileArrayBuffer(null);
      setCurrentStartingPoint('scratch');
      return;
    }

    commonResetLogic(false); 
    setIsLoading(true);
    const songName = EXAMPLE_SONGS_FOR_SELECTOR.find(s => s.path === songPath)?.name || "Example Song";
    
    try {
        const response = await fetch(songPath);
        if (!response.ok) {
            throw new Error(`Failed to fetch example song: ${songName} (status: ${response.status})`);
        }
        const arrayBuffer = await response.arrayBuffer();
        await processNewMidi(arrayBuffer, songName); 
        setCurrentStartingPoint('current_piece'); 
        
    } catch (err) {
        console.error(err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(`Error loading example MIDI: ${errorMsg}`);
        setFileNameFromLoad(null); 
        setOriginalFileArrayBuffer(null);
        setProcessedData(null);
        setCurrentStartingPoint('scratch'); 
    } finally {
        setIsLoading(false);
    }
  }, [pushToHistory]);


  const handleClear = () => {
    pushToHistory(); 
    commonResetLogic();
    setCurrentStartingPoint('scratch');
    setShowFileDropzone(false);
    setFileNameFromLoad(null);
  };

  const handleStartingPointChange = (newStartingPoint: string) => {
    pushToHistory();
    setCurrentStartingPoint(newStartingPoint);

    if (newStartingPoint === 'scratch') {
      commonResetLogic(); 
      setFileNameFromLoad("New Piece (From Scratch)"); 
    } else if (newStartingPoint === 'upload_new') {
      commonResetLogic(false); 
      setShowFileDropzone(true);
    } else if (newStartingPoint.startsWith('/examples/')) {
      setShowFileDropzone(false);
      handleExampleSongSelected(newStartingPoint);
    } else if (newStartingPoint === 'current_piece') {
      setShowFileDropzone(false);
    }
  };

 const determineNewFileName = (baseName: string | null, operationType: 'scratch' | 'continuation', styleName?: string): string => {
    const selectedStyle = availableStyles.find(s => s.fileName === selectedStyleFileName);
    const currentStyleForName = styleName || (selectedStyle ? selectedStyle.name : "AI");

    if (operationType === 'scratch') {
        return `New ${currentStyleForName} Piece (From Scratch).mid`;
    }
    const cleanBase = (baseName || "Untitled").replace(/\.mid$/i, '').replace(/\s*\(AI.*?Extended\)$/i, '').replace(/\s*\(Text\)$/i, '').replace(/\s*\(From Scratch\)$/i, '').trim();
    return `${cleanBase} (AI ${currentStyleForName} Extended).mid`;
};

  const handlePredictContinuation = async () => {
    pushToHistory();

    setIsPredictingAi(true);
    setAiPrediction(null);
    setAiError(null);
    setGroundingChunks(null);
    
    const selectedStyle = availableStyles.find(s => s.fileName === selectedStyleFileName);
    const currentStyleName = selectedStyle ? selectedStyle.name : "Selected Style";

    if (!styleContextText) {
      setAiError(`Stylistic context for "${currentStyleName}" is not loaded. Cannot proceed with AI prediction.`);
      setIsPredictingAi(false);
      return;
    }
    if (!process.env.API_KEY) {
      setAiError("API_KEY environment variable is not set for Gemini API.");
      setIsPredictingAi(false);
      return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let finalPrompt: string;
    let isScratchGeneration = currentStartingPoint === 'scratch' && !processedData;
    let currentSongTextForPrompt = "";
    let continuationStartTimeOffset = 0;
    let baseNameForNewFile: string | null = null;

    if (isScratchGeneration) {
      if (!styleContextText) {
         setAiError("Style context is required to compose from scratch.");
         setIsPredictingAi(false);
         return;
      }
      finalPrompt = `You are a musical AI specializing in composing original short musical pieces in a specific style.
I will provide you with a "Style Reference Text": This is an example of musical pieces in the style I want you to emulate.
Your task is to:
- Analyze the "Style Reference Text".
- Generate a NEW, short musical piece (approximately 10-15 seconds long) from scratch.
- The new musical data you provide should start its timing from 0 seconds (e.g., the first note of your generated part might be at Time: 0.1s, to correctly offset the previous timing).
- The piece MUST be in the *style* demonstrated by the "Style Reference Text" ([Style = ${currentStyleName}]).
- The output MUST be in the standard text format for notes and instruments (e.g., "Instrument: Piano (Consolidated)\\n  Note: C4, Time: 0.10s, Duration: 0.50s, Velocity: 0.70"). Include instrument lines.
- Do NOT include any header lines (MIDI File, Tempo, Time Signature, Track counts, Consolidated counts), conversational text, or explanations. ONLY output the new musical data (instrument and note lines).

--- STYLE REFERENCE TEXT ---
[Style = ${currentStyleName}]

${styleContextText}
--- END OF STYLE REFERENCE TEXT ---



Generate a new short piece (~10-15 seconds) from scratch in the style of [${currentStyleName}], ensuring correct note format, and that it continues the song with correct timing, and doesn't interrupt the chord progression:
`;
    baseNameForNewFile = null; 
    } else { 
      currentSongTextForPrompt = midiTextForConversion || processedData?.text || "";
      if (!currentSongTextForPrompt) {
        setAiError("No MIDI data available to use as context for AI prediction.");
        setIsPredictingAi(false);
        return;
      }
      continuationStartTimeOffset = getDurationFromMidiText(currentSongTextForPrompt);
      
      baseNameForNewFile = fileNameFromLoad || extractFileNameFromMidiText(currentSongTextForPrompt) || "Piece";


      finalPrompt = `You are a musical AI specializing in continuing musical pieces in a specific style.
I will provide you with two things:
1.  A "Style Reference Text": This is an example of musical pieces in the style I want you to emulate. Pay attention to its songs and their structures, tempos, time signatures, instrument phrasings, and note patterns.
2.  A "Piece to Continue": This is the specific musical piece you need to extend, as if it was another song on the style reference.

Your task is to:
- Analyze the "Piece to Continue".
- Generate approximately 10 more seconds of music that would seamlessly follow the "Piece to Continue".
- The new musical data you provide should start its own timing from 0 seconds (e.g., the first note of your generated part might be at Time: 0.1s, the next at Time: 0.5s, etc., all relative to the beginning of YOUR generated 10-second segment). We will handle offsetting these times to correctly append your segment to the original piece.
- The continuation MUST be in the *style* demonstrated by the "Style Reference Text" ([Style = ${currentStyleName}]).
- The continuation MUST follow the exact same text format for notes and instruments as the "Piece to Continue" (including instrument names as they appear in the input).
- Ensure note durations and speed aren't inhumanely fast.
- **Do NOT change the main melody**, only small variations are allowed.
- Copying the "Piece to Continue" is okay, so long as it makes sense and variations are added.
- IMPORTANT: ONLY output the new, continued musical data (instrument and note lines). Do NOT include any header lines (MIDI File, Tempo, Time Signature, Track counts, Consolidated counts), conversational text, explanations, or repeat any part of the "Piece to Continue" in your output.



-- Additional prompting: Bonus points for unique motifs such as: brief musical pauses, instrument breakdowns and solos, removing and reintroducing instruments one-by-one, key-changes, arpeggios
  SUPER NEGATIVE points for completely abandoning the previous song's structure, melody, chord progression and motifs.

  Make sure the continued part sound a lot like the the "Piece to continue", you will be penalized heavily if your version doesn't seamlessly continue the song. This matters more than style.


--- STYLE REFERENCE TEXT ---
[Style = ${currentStyleName}]

${styleContextText}
--- END OF STYLE REFERENCE TEXT ---

--- PIECE TO CONTINUE ---
${currentSongTextForPrompt}
--- END OF PIECE TO CONTINUE ---

  Continue the song from here, and it will be appended to the current song (provide only the new musical data for the next ~10 seconds, starting your timing from 0s, ensuring correct note format):
`;
    }


    try {
      const genAIResponse: GenAIResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: finalPrompt
      });
      
      let aiGeneratedPartRaw = genAIResponse.text;
      console.log("AI Raw Output:", aiGeneratedPartRaw);

      if (!aiGeneratedPartRaw || aiGeneratedPartRaw.trim() === "") {
        setAiError("AI returned an empty response.");
        setIsPredictingAi(false);
        return;
      }
      
      const aiLinesRaw = aiGeneratedPartRaw.trim().split('\n');
      const cleanedAiLinesInitial = aiLinesRaw.filter(line => 
        !line.trim().startsWith("MIDI File:") &&
        !line.trim().startsWith("Tempo:") &&
        !line.trim().startsWith("Time Signature:") &&
        !line.trim().startsWith("Total Tracks (in source MIDI):") &&
        !line.trim().startsWith("Consolidated Instrument Tracks:")
      );
      let aiGeneratedPartCleaned = cleanedAiLinesInitial.join('\n').trim();

      if (!aiGeneratedPartCleaned) {
        setAiError("AI returned only header-like information or invalid data. No actual music data to process.");
        setAiPrediction(""); 
        setIsPredictingAi(false);
        return;
      }

      let finalMidiTextForConversion: string;
      let finalAiGeneratedPartDisplay: string;

      if (isScratchGeneration) {
        finalMidiTextForConversion = aiGeneratedPartCleaned; 
        finalAiGeneratedPartDisplay = aiGeneratedPartCleaned; 
      } else { 
        const aiOutputLines = aiGeneratedPartCleaned.split('\n');
        const processedAiOutputLines = aiOutputLines.map(line => {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("Note:")) {
            const noteDataMatch = trimmedLine.match(/Note:\s*(.+?),\s*Time:\s*([\d.]+?)s,\s*Duration:\s*([\d.]+?)s,\s*Velocity:\s*([\d.]+)/);
            if (noteDataMatch) {
              const [, name, timeStr, durationStr, velocityStr] = noteDataMatch;
              const originalTime = parseFloat(timeStr);
              const newTime = originalTime + continuationStartTimeOffset;
              return `  Note: ${name.trim()}, Time: ${newTime.toFixed(2)}s, Duration: ${durationStr}s, Velocity: ${velocityStr}`;
            }
          }
          return line; 
        });
        finalAiGeneratedPartDisplay = processedAiOutputLines.join('\n');
        finalMidiTextForConversion = (currentSongTextForPrompt || "").trim() + "\n\n" + finalAiGeneratedPartDisplay;
      }
      
      setAiPrediction(finalAiGeneratedPartDisplay);
      setMidiTextForConversion(finalMidiTextForConversion); 

      setIsLoading(true); 
      audioPlayer.stop();

      const newMidiObject = convertTextToMidi(finalMidiTextForConversion);

      if (newMidiObject && newMidiObject.tracks.length > 0) {
        const finalFileName = isScratchGeneration 
            ? determineNewFileName(null, 'scratch', currentStyleName) 
            : determineNewFileName(baseNameForNewFile, 'continuation', currentStyleName);

        setFileNameFromLoad(finalFileName); 
        const newProcessedFullData = await processMidiData(newMidiObject, finalFileName); 
        setProcessedData(newProcessedFullData);
        setActiveMidiObjectForPlayback(newMidiObject); 
        setOriginalFileArrayBuffer(null); 
        setError(null);
        setCurrentStartingPoint('current_piece'); 
      } else {
        const conversionIssue = `Failed to convert ${isScratchGeneration ? "AI generated" : "combined (original + AI)"} text to MIDI. The AI's output might be malformed or empty after cleaning and time adjustment.`;
        setError(conversionIssue); 
        setAiError(conversionIssue); 
      }

    } catch (err) {
      console.error("AI Prediction or processing error:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setAiError(errorMsg);
      setError(`Error during AI composition: ${errorMsg}`); 
    } finally {
      setIsLoading(false);
      setIsPredictingAi(false);
    }
  };
  

  const handlePlayPause = async () => {
    setPlayerError(null); 
    if (!audioPlayer.isInitialized) {
        await audioPlayer.init();
        if (!audioPlayer.isInitialized) {
            setPlayerError("Audio system could not be initialized. Please try interacting with the page (e.g., click) and try again.");
            return;
        }
    }

    if (activeMidiObjectForPlayback) { 
      if (audioPlayer.isPlaying) {
        audioPlayer.pause();
      } else {
         await audioPlayer.play(activeMidiObjectForPlayback);
      }
    } else if (originalFileArrayBuffer && currentStartingPoint !== 'scratch') { 
        try {
            const midiObj = new Midi(originalFileArrayBuffer);
            setActiveMidiObjectForPlayback(midiObj); 
            await audioPlayer.play(midiObj);
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            setPlayerError(`Failed to parse MIDI data for playback: ${errorMsg}`);
            console.error("Playback error from buffer:", e);
            return;
        }
    } else {
      setPlayerError("No MIDI data loaded to play.");
    }
  };

  const handleStopPlayback = () => {
    audioPlayer.stop();
  };
  
  const handleDownloadGeneratedMidi = () => {
    if (activeMidiObjectForPlayback) {
        let downloadName = (processedData?.fileName || fileNameFromLoad || "generated") ;
        if (!downloadName.toLowerCase().endsWith('.mid') && !downloadName.toLowerCase().endsWith('.midi')) {
            downloadName += ".mid";
        }
      downloadMidi(activeMidiObjectForPlayback, downloadName);
    } else {
        console.warn("Download attempted but no active MIDI object available.");
    }
  };

  const currentDisplayFileName = 
    currentStartingPoint === 'scratch' && !processedData 
    ? "New Piece (From Scratch)" 
    : (processedData?.fileName || fileNameFromLoad || (midiTextForConversion ? "From Text Input" : "Untitled"));

  const isReadyForAI = currentStartingPoint === 'scratch' ? !!styleContextText : (!!processedData || !!midiTextForConversion) && !!styleContextText;


  return (
    <div className="relative app-container-with-pattern min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-gray-100 flex flex-col items-center p-4 sm:p-8 selection:bg-blue-500 selection:text-white">
      <header className="relative z-10 mb-6 w-full max-w-5xl px-1 flex justify-between items-start">
          <div className="text-left">
            <div className="flex items-center space-x-3 mb-1">
              <MidiIcon className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-300 to-green-400">
                Project Musebot
              </h1>
            </div>
            <p className="text-md sm:text-lg text-slate-300 max-w-xl pl-[calc(2.5rem+0.75rem)] sm:pl-[calc(3rem+0.75rem)]">
              Continue existing midi tracks in specific styles, or make one from scratch with the help of AI.
            </p>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 pt-2 sm:pt-3 whitespace-nowrap text-right">Made with Gemini API</p>
      </header>

      <main className="relative z-10 w-full max-w-5xl bg-slate-800 shadow-2xl rounded-xl p-4 sm:p-6">
        
        <div className="flex flex-wrap items-baseline justify-start gap-x-2 gap-y-3 mb-6 p-4 bg-slate-700/30 rounded-lg">
          <span className="text-slate-200 text-sm sm:text-base">Compose in the style of</span>
          <StyleSelector
            availableStyles={availableStyles}
            selectedStyleFileName={selectedStyleFileName}
            onStyleChange={(fileName) => {
              pushToHistory(); 
              setSelectedStyleFileName(fileName);
            }}
          />
          <span className="text-slate-200 text-sm sm:text-base">starting from</span>
          <StartingPointSelector
            exampleSongs={EXAMPLE_SONGS_FOR_SELECTOR}
            currentFileName={processedData?.fileName || null}
            startingPoint={currentStartingPoint}
            onStartingPointChange={handleStartingPointChange}
          />
        </div>
        
        {currentStartingPoint === 'upload_new' && showFileDropzone && (
          <div className="mb-6 p-4 bg-slate-700/20 rounded-lg">
            <FileDropzone onFileAccepted={handleFileAccepted} accept=".mid,.midi,audio/midi,audio/mid" />
          </div>
        )}


        {isLoading && !isPredictingAi && (
          <div className="flex flex-col items-center justify-center p-10 bg-slate-700 rounded-lg my-4">
            <LoadingSpinner />
            <p className="mt-4 text-lg text-slate-300 animate-pulse">Loading {fileNameFromLoad || 'your MIDI data'}...</p>
          </div>
        )}

        {error && !isLoading && ( 
          <div className="p-6 bg-red-700/50 border border-red-500 text-red-200 rounded-lg text-center my-4">
            <h3 className="text-xl font-semibold mb-2">An Error Occurred</h3>
            <p className="mb-4">{error}</p>
            <button
              onClick={handleClear}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
            >
              Clear and Start Over
            </button>
          </div>
        )}
        
        {(processedData || (currentStartingPoint === 'scratch' && !error)) && !isLoading && (
          <>
            <div className="mb-4 p-3 bg-slate-700/50 rounded-lg shadow">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div>
                        <p className="text-xs text-slate-400">Current Piece:</p>
                        <p className="text-md font-medium text-slate-100">{currentDisplayFileName}</p>
                    </div>
                </div>
            </div>
            
            
            <div className="mb-6"> 
                <MidiVisualizer 
                    tracks={processedData?.tracks || []} 
                    totalDuration={processedData?.totalDuration || 0}
                    isPlaying={isPlaying}
                    onExtendAI={handlePredictContinuation}
                    isPredictingAI={isPredictingAi}
                    isLoading={isLoading}
                    isReadyForAI={isReadyForAI}
                />
                {currentStartingPoint === 'scratch' && !processedData && !isLoading && !error && isReadyForAI}
            </div>


            <div className="my-6 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 sm:gap-4 p-3 bg-slate-700/30 rounded-lg flex-wrap">
                <PlaybackControls
                    isPlaying={isPlaying}
                    onPlayPause={handlePlayPause}
                    onStop={handleStopPlayback}
                    isMidiAvailable={!!activeMidiObjectForPlayback || !!originalFileArrayBuffer}
                    onDownload={handleDownloadGeneratedMidi}
                    canDownload={!!activeMidiObjectForPlayback}
                />
                <button
                    onClick={() => setShowVolumeControls(prev => !prev)}
                    className="px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                    aria-expanded={showVolumeControls}
                    aria-controls="volume-controls-panel"
                >
                    <MixerIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{showVolumeControls ? 'Hide' : 'Show'} Mixer</span>
                    <ChevronDownIcon className={`w-3 h-3 sm:w-4 sm:h-4 transform transition-transform duration-200 ${showVolumeControls ? 'rotate-180' : ''}`} />
                </button>
                 <button
                    onClick={handleRevert}
                    disabled={historyStack.length === 0 || isLoading || isPredictingAi}
                    className="px-3 py-2 text-xs sm:text-sm font-medium text-amber-300 bg-amber-600/30 hover:bg-amber-500/40 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-slate-800"
                    title="Revert to the previous state of the MIDI"
                >
                    <ArrowUturnLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    Revert
                </button>
                 <button
                    onClick={handleClear}
                    className="px-3 py-2 text-xs sm:text-sm font-medium text-rose-300 bg-rose-600/30 hover:bg-rose-500/40 rounded-md transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-slate-800"
                >
                    Clear All
                </button>
            </div>

            {showVolumeControls && (
                <div id="volume-controls-panel" className="w-full max-w-lg mx-auto mb-6">
                    <VolumeControls />
                </div>
            )}
             {playerError && (
              <div className="my-4 p-3 bg-red-700/60 border border-red-500 text-red-200 rounded-lg text-center text-sm">
                <p>Playback Error: {playerError}</p>
              </div>
            )}

            {isPredictingAi && ( 
              <div className="my-6 flex flex-col items-center justify-center p-6 bg-slate-700/80 rounded-lg">
                <LoadingSpinner />
                <p className="mt-3 text-md text-slate-300 animate-pulse">AI is composing...</p>
              </div>
            )}
            
            {isLoading && isPredictingAi && ( 
                 <div className="my-6 flex flex-col items-center justify-center p-6 bg-slate-700/80 rounded-lg">
                    <LoadingSpinner />
                    <p className="mt-3 text-md text-slate-300 animate-pulse">Processing AI composition...</p>
                </div>
            )}
            
            {aiPrediction && !isPredictingAi && !aiError && ( 
                 <div className="my-4 p-4 bg-slate-700/60 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">AI Generated Output</h3>
                    <pre className="p-3 bg-slate-850 border border-slate-600 rounded-md text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap break-words min-h-[80px] max-h-[150px] shadow-inner scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-850">
                        {aiPrediction}
                    </pre>
                    <GroundingSourcesDisplay chunks={groundingChunks} />
                 </div>
            )}
             {aiError && !isPredictingAi && ( 
                  <div className="my-4 p-3 bg-red-800/60 border border-red-600 text-red-200 rounded-lg text-center text-sm">
                    <h4 className="text-md font-semibold mb-1">AI Composition Error:</h4>
                    <p>{aiError}</p>
                  </div>
            )}
            
            {processedData?.text && (
                <CollapsibleSection title="Current Piece (Text Format)" icon={<DocumentTextIcon className="w-5 h-5"/>} defaultOpen={false}>
                    <OutputDisplay text={processedData.text} />
                </CollapsibleSection>
            )}
          </>
        )}
      </main>

     
    </div>
  );
};

const App = (): JSX.Element => {
  return (
    <VolumeControlProvider>
      <AppContent />
    </VolumeControlProvider>
  );
};
export default App;
