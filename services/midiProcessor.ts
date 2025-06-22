
import { Midi } from '@tonejs/midi';
import { getInstrumentName, GM_PERCUSSION_NAMES, getNoteNameFromMidi, getMidiFromNoteName, CONSOLIDATED_INSTRUMENTS } from '../constants/midiMapping';

export interface ProcessedMidiNote {
  name: string;
  time: number;
  duration: number;
  velocity: number;
  midi: number;
}
export interface ProcessedMidiTrack {
  instrumentName: string;
  notes: ProcessedMidiNote[];
}

export interface ProcessedMidiOutput {
  text: string;
  tracks: ProcessedMidiTrack[];
  totalDuration: number;
  fileName: string;
}

// Helper to extract the filename from the first line of MIDI text if available
export function extractFileNameFromMidiText(text: string): string | null {
  if (!text) return null;
  const firstLine = text.split('\n')[0];
  const nameMatch = firstLine.match(/MIDI File:\s*(.+)/i);
  if (nameMatch && nameMatch[1]) {
    return nameMatch[1].trim();
  }
  return null;
}


export async function processMidiData(midi: Midi, sourceFileName?: string): Promise<ProcessedMidiOutput> {

  // Convert Midi file data into plain text data. 


  let outputText = "";
  const processedTracks: ProcessedMidiTrack[] = [];
  let overallMaxTime = 0;

  // Prioritize sourceFileName if available (e.g., from file upload or example selection)
  const headerFileName = sourceFileName || midi.header.name || "Unknown MIDI";
  outputText += `MIDI File: ${headerFileName}\n`;
  
  if (midi.header.tempos.length > 0 && midi.header.tempos[0]?.bpm) {
    outputText += `Tempo: ${midi.header.tempos[0].bpm.toFixed(0)} BPM\n`;
  } else {
     outputText += `Tempo: 120 BPM (Default)\n`; // Default if not specified
  }
  if (midi.header.timeSignatures.length > 0 && midi.header.timeSignatures[0]?.timeSignature) {
    const ts = midi.header.timeSignatures[0].timeSignature;
    outputText += `Time Signature: ${ts[0]}/${ts[1]}\n`;
  } else {
     outputText += `Time Signature: 4/4 (Default)\n`;
  }
  outputText += `Total Tracks (in source MIDI): ${midi.tracks.length}\n`;

  const consolidatedTracksMap = new Map<string, ProcessedMidiNote[]>();

  midi.tracks.forEach(track => {
    const isDrumTrack = track.channel === 9;
    const programNumber = track.instrument.number;
    const instrumentName = getInstrumentName(programNumber, isDrumTrack); 

    if (!consolidatedTracksMap.has(instrumentName)) {
      consolidatedTracksMap.set(instrumentName, []);
    }
    const notesForInstrument = consolidatedTracksMap.get(instrumentName)!;

    track.notes.forEach(note => {
      let noteName = getNoteNameFromMidi(note.midi);
      if (isDrumTrack && GM_PERCUSSION_NAMES[note.midi]) {
        noteName = `${noteName} (${GM_PERCUSSION_NAMES[note.midi]})`;
      }
      
      notesForInstrument.push({
        name: noteName,
        midi: note.midi,
        time: note.time,
        duration: note.duration,
        velocity: note.velocity,
      });
      const noteEndTime = note.time + note.duration;
      if (noteEndTime > overallMaxTime) {
        overallMaxTime = noteEndTime;
      }
    });
  });
  
  outputText += `Consolidated Instrument Tracks: ${consolidatedTracksMap.size}\n\n`;

  // Sort instruments: Drums first, then others alphabetically
  const sortedInstrumentNames = Array.from(consolidatedTracksMap.keys()).sort((a, b) => {
    if (a === CONSOLIDATED_INSTRUMENTS.DRUMS.name) return -1;
    if (b === CONSOLIDATED_INSTRUMENTS.DRUMS.name) return 1;
    return a.localeCompare(b);
  });


  for (const instrumentName of sortedInstrumentNames) {
    const notes = consolidatedTracksMap.get(instrumentName)!.sort((a, b) => a.time - b.time || a.midi - b.midi);
    
    const processedTrackData: ProcessedMidiTrack = {
      instrumentName: instrumentName,
      notes: []
    };

    outputText += `Instrument: ${instrumentName}\n`;
    if (notes.length === 0) {
      outputText += "  (No notes for this instrument)\n";
    } else {
      notes.forEach(note => {
        outputText += `  Note: ${note.name}, Time: ${note.time.toFixed(2)}s, Duration: ${note.duration.toFixed(2)}s, Velocity: ${note.velocity.toFixed(2)}\n`;
        processedTrackData.notes.push({
          name: note.name,
          midi: note.midi,
          time: note.time,
          duration: note.duration,
          velocity: note.velocity,
        });
      });
    }
    processedTracks.push(processedTrackData);
    outputText += "\n";
  }
  
  return {
    text: outputText.trim(),
    tracks: processedTracks,
    totalDuration: overallMaxTime,
    fileName: headerFileName 
  };
}


export async function processMidiFile(file: File): Promise<ProcessedMidiOutput> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target && event.target.result) {
        try {
          const midi = new Midi(event.target.result as ArrayBuffer);
          const processedOutput = await processMidiData(midi, file.name); // Pass file.name as sourceFileName
          resolve(processedOutput);
        } catch (e) {
          console.error("Error parsing MIDI file:", e);
          reject(new Error("Could not parse MIDI file. It might be corrupted or not a valid MIDI."));
        }
      } else {
        reject(new Error("Failed to read file."));
      }
    };
    reader.onerror = () => {
      reject(new Error("Error reading file."));
    };
    reader.readAsArrayBuffer(file);
  });
}
