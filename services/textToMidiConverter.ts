//textToMidiConverter.ts

import { Midi } from '@tonejs/midi';
import { getMidiFromNoteName, CONSOLIDATED_INSTRUMENTS, GM_INSTRUMENT_NAMES } from '../constants/midiMapping'; 


interface ParsedInstrument {
  name: string;
  notes: ParsedNote[];
}

interface ParsedNote {
  name: string; 
  time: number;
  duration: number;
  velocity: number;
}

const MIN_NOTE_DURATION = 0.01; // Minimum duration for a note in seconds
const DEFAULT_BPM = 120; // Default should only be used if the tempo cannot be extracted from text
const MIN_BPM = 20;  // Minimum reasonable BPM threshold
const MAX_BPM = 500; // Maximum reasonable BPM threshold


function getProgramNumberFromConsolidatedName(consolidatedName: string): number {

// Most instruments are consolidated into an alias for its main type

  for (const key in CONSOLIDATED_INSTRUMENTS) {
    const instrumentGroup = CONSOLIDATED_INSTRUMENTS[key as keyof typeof CONSOLIDATED_INSTRUMENTS];
    if (instrumentGroup.name === consolidatedName) {

      // For drums, program number can be 0, channel 9 is key

      if (instrumentGroup.name === CONSOLIDATED_INSTRUMENTS.DRUMS.name) return 0; 
      return instrumentGroup.gmProgramNumber !== undefined ? instrumentGroup.gmProgramNumber : 0;
    }
  }
  // Check if it's a direct GM instrument name
  const gmIndex = GM_INSTRUMENT_NAMES.indexOf(consolidatedName);
  if (gmIndex !== -1) return gmIndex;
  
  // Fail-safe if the the instrument isn't consolidated
  const lowerName = consolidatedName.toLowerCase();
  if (lowerName.includes("piano")) return 0; // Acoustic Grand Piano
  if (lowerName.includes("drum")) return 0; // Drums are channel 9, program can be 0


  console.warn(`Unmapped instrument name for program number: "${consolidatedName}". Defaulting to Piano (GM 0).`);
  return 0; // Default to Acoustic Grand Piano
}

function addNotesToTrack(track: any, notes: ParsedNote[]) {
// Iterate through all notes in the text, and add them to the midi track

 notes.forEach(noteInfo => {
    const baseNoteName = noteInfo.name.split(' ')[0]; // Handles "C4 (Percussion Name)" -> "C4"
    const midiNumber = getMidiFromNoteName(baseNoteName);
    let duration = noteInfo.duration;
    let velocity = noteInfo.velocity;

    if (isNaN(duration) || duration <= 0) {
      console.warn(`Parsed note duration for "${noteInfo.name}" is invalid (${noteInfo.duration}). Setting to a small default (${MIN_NOTE_DURATION}s).`);
      duration = MIN_NOTE_DURATION;
    }

    if (isNaN(velocity) || velocity < 0 || velocity > 1) {
      console.warn(`Parsed note velocity for "${noteInfo.name}" is invalid or out of range 0-1 (${noteInfo.velocity}). Clamping and defaulting to 0.5 if NaN.`);
      velocity = Math.max(0, Math.min(1, isNaN(velocity) ? 0.5 : velocity));
    }
    

    if (midiNumber !== -1 && midiNumber >=0 && midiNumber <= 127) { // Ensure valid MIDI note number
        track.addNote({
            midi: midiNumber,
            time: noteInfo.time,
            duration: duration,
            velocity: velocity,
        });
    } else {
        console.warn(`Could not parse or invalid MIDI number for note: ${noteInfo.name} (parsed as ${midiNumber}). Skipping note.`);
    }
  });
}

export function convertTextToMidi(textInput: string): Midi | null {
  if (!textInput || textInput.trim() === "") {
    console.warn("convertTextToMidi: Empty text input. Returning null.");
    return null;
  }

  const midi = new Midi();
  const lines = textInput.trim().split('\n');

  let fileName: string | undefined = undefined;
  let parsedTempoValue: number = DEFAULT_BPM;
  let parsedTimeSignature: [number, number] = [4, 4];
  
  let lineIndex = 0;
  let foundTempoInHeader = false;

  // Pass 1 (Parse Header)
  for (; lineIndex < lines.length; lineIndex++) {
    const trimmedLine = lines[lineIndex].trim();
    if (trimmedLine.startsWith("Instrument:")) {
      break; // Stop header parsing, proceed to instrument parsing
    }
    if (trimmedLine === "") continue; // Skip empty lines in header

    const fileMatch = trimmedLine.match(/MIDI File:\s*(.+)/i);
    if (fileMatch && fileMatch[1] && fileName === undefined) { // Take the first file name
      fileName = fileMatch[1].trim();
      continue;
    }

    if (!foundTempoInHeader) { // Only parse the first tempo line encountered in the header
        const tempoMatch = trimmedLine.match(/Tempo:\s*([\d.]+)\s*BPM/i);
        if (tempoMatch && tempoMatch[1]) {
            const bpm = parseFloat(tempoMatch[1]);
            if (isFinite(bpm) && bpm >= MIN_BPM && bpm <= MAX_BPM) {
                parsedTempoValue = bpm;
                console.log(`convertTextToMidi (Header Pass): Parsed tempo: ${parsedTempoValue} BPM`);
            } else {
                console.warn(`convertTextToMidi (Header Pass): Parsed BPM "${tempoMatch[1]}" is invalid or out of range (${MIN_BPM}-${MAX_BPM}). Using default ${DEFAULT_BPM} BPM.`);
                // parsedTempoValue remains DEFAULT_BPM
            }
            foundTempoInHeader = true; // Mark that we've processed a tempo line (valid or not)
            continue;
        }
    }


    const tsMatch = trimmedLine.match(/Time Signature:\s*(\d+)\/(\d+)/);
    if (tsMatch && tsMatch[1] && tsMatch[2]) { // Take the first time signature
      const num = parseInt(tsMatch[1], 10);
      const den = parseInt(tsMatch[2], 10);
      const validDenominators = [1, 2, 4, 8, 16, 32]; // Denominator must be a power of 2
      if (isFinite(num) && num > 0 && isFinite(den) && validDenominators.includes(den)) {
         parsedTimeSignature = [num, den];
      } else {
        console.warn(`convertTextToMidi (Header Pass): Invalid time signature values "${tsMatch[0]}". Using default 4/4.`);
        // parsedTimeSignature remains [4,4]
      }
      continue;
    }
  }
  
  midi.header.name = fileName || "Converted MIDI";
  midi.header.setTempo(parsedTempoValue);
  
  midi.header.timeSignatures.pop(); // Clear any default time signature
  midi.header.timeSignatures.push({
    ticks: 0,
    timeSignature: parsedTimeSignature,
  });


  // Pass 2: (Parse Instruments and Notes)
  let currentInstrumentData: ParsedInstrument | null = null;

  for (; lineIndex < lines.length; lineIndex++) {
    const trimmedLine = lines[lineIndex].trim();

    if (trimmedLine.startsWith("Instrument:")) {
      if (currentInstrumentData && currentInstrumentData.notes.length > 0) { // Finalize previous instrument
        const track = midi.addTrack();
        track.name = currentInstrumentData.name;
        const programNumber = getProgramNumberFromConsolidatedName(currentInstrumentData.name);
        track.instrument.number = programNumber;
        if (currentInstrumentData.name === CONSOLIDATED_INSTRUMENTS.DRUMS.name) {
          track.channel = 9; // MIDI drum channel
        }
        addNotesToTrack(track, currentInstrumentData.notes);
      }
      const instrumentName = trimmedLine.substring("Instrument:".length).trim();
      currentInstrumentData = { name: instrumentName, notes: [] };
    } else if (trimmedLine.startsWith("Note:") && currentInstrumentData) {
      const noteDataMatch = trimmedLine.match(/Note:\s*(.+?),\s*Time:\s*([\d.]+?)s,\s*Duration:\s*([\d.]+?)s,\s*Velocity:\s*([\d.]+)/);
      if (noteDataMatch) {
        const [, name, timeStr, durationStr, velocityStr] = noteDataMatch;
        
        const time = parseFloat(timeStr);
        let duration = parseFloat(durationStr);
        let velocity = parseFloat(velocityStr);

        if (isNaN(time)) {
            console.warn(`Note line: "${trimmedLine}" has invalid time ${timeStr}. Skipping note.`);
            continue;
        }

        if (isNaN(duration) || duration <= 0) {
          console.warn(`Note line: "${trimmedLine}" has non-positive or invalid duration ${durationStr}. Setting to ${MIN_NOTE_DURATION}s.`);
          duration = MIN_NOTE_DURATION;
        }
        if (isNaN(velocity) || velocity < 0 || velocity > 1) {
            console.warn(`Note line: "${trimmedLine}" has invalid velocity ${velocityStr}. Clamping to 0-1 range (defaulting to 0.5 if NaN).`);
            velocity = Math.max(0, Math.min(1, isNaN(velocity) ? 0.5 : velocity));
        }

        currentInstrumentData.notes.push({
          name: name.trim(),
          time: time,
          duration: duration,
          velocity: velocity,
        });
      } else {
         console.warn(`Could not parse note line: "${trimmedLine}"`);
      }
    } else if (trimmedLine === "" && currentInstrumentData) {
       if (currentInstrumentData.notes.length > 0) { 
            const track = midi.addTrack();
            track.name = currentInstrumentData.name;
            const programNumber = getProgramNumberFromConsolidatedName(currentInstrumentData.name);
            track.instrument.number = programNumber;
            if (currentInstrumentData.name === CONSOLIDATED_INSTRUMENTS.DRUMS.name) {
                track.channel = 9;
            }
            addNotesToTrack(track, currentInstrumentData.notes);
        }
        currentInstrumentData = null; 
    }
  }

  // Finalize the last instrument if any
  if (currentInstrumentData && currentInstrumentData.notes.length > 0) {
    const track = midi.addTrack();
    track.name = currentInstrumentData.name;
    const programNumber = getProgramNumberFromConsolidatedName(currentInstrumentData.name);
    track.instrument.number = programNumber;
    if (currentInstrumentData.name === CONSOLIDATED_INSTRUMENTS.DRUMS.name) {
      track.channel = 9;
    }
    addNotesToTrack(track, currentInstrumentData.notes);
  }

  if (midi.tracks.length === 0) {
    console.warn("convertTextToMidi: No tracks with notes were created from the text input. Returning null.");
    return null;
  }

  return midi;
}

export function downloadMidi(midiObject: Midi, fileName: string = "converted.mid") {
  if (!midiObject) return;
  try {
    const midiArray = midiObject.toArray();
    const blob = new Blob([midiArray], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Error preparing MIDI for download:", e);
    alert("Could not prepare MIDI for download.");
  }
}
