export interface InstrumentGroup {
  name: string;
  gmProgramNumber?: number; // 0-indexed
}

export const CONSOLIDATED_INSTRUMENTS = {
  PIANO: { name: "Piano (Consolidated)", gmProgramNumber: 0 } as InstrumentGroup,
  VIOLIN: { name: "Violin (Consolidated)", gmProgramNumber: 40 } as InstrumentGroup,
  STRING_ENSEMBLE: { name: "String Ensemble (Consolidated)", gmProgramNumber: 48 } as InstrumentGroup, // Formerly HIGH_STRINGS
  LOW_STRINGS: { name: "Low Strings (Cello, Contrabass, etc.)", gmProgramNumber: 42 } as InstrumentGroup,
  HIGH_GUITAR: { name: "High Guitar (Acoustic Steel, Electric Lead)", gmProgramNumber: 25 } as InstrumentGroup,
  ACOUSTIC_BASS: { name: "Acoustic Bass", gmProgramNumber: 32 } as InstrumentGroup,
  ELECTRIC_BASS: { name: "Electric Bass", gmProgramNumber: 33 } as InstrumentGroup,
  FLUTE: { name: "Flute Family", gmProgramNumber: 73 } as InstrumentGroup,
  CLARINET: { name: "Clarinet Family", gmProgramNumber: 71 } as InstrumentGroup,
  DRUMS: { name: "Drum Kit / Percussion" } as InstrumentGroup, // Channel 9 is implicit
  KOTO: { name: "Koto", gmProgramNumber: 107 } as InstrumentGroup,
  TROMBONE: { name: "Trombone", gmProgramNumber: 57 } as InstrumentGroup,
  OTHER: { name: "Other Instrument" } as InstrumentGroup, // Fallback for unmapped instruments
};

// General MIDI Instrument Names (Program Number 0-127)
// Source: https://www.midi.org/specifications-old/item/gm-level-1-sound-set
export const GM_INSTRUMENT_NAMES: string[] = [
  "Acoustic Grand Piano", "Bright Acoustic Piano", "Electric Grand Piano", "Honky-tonk Piano",
  "Electric Piano 1", "Electric Piano 2", "Harpsichord", "Clavinet",
  "Celesta", "Glockenspiel", "Music Box", "Vibraphone",
  "Marimba", "Xylophone", "Tubular Bells", "Dulcimer",
  "Drawbar Organ", "Percussive Organ", "Rock Organ", "Church Organ",
  "Reed Organ", "Accordion", "Harmonica", "Tango Accordion",
  "Acoustic Guitar (nylon)", "Acoustic Guitar (steel)", "Electric Guitar (jazz)", "Electric Guitar (clean)",
  "Electric Guitar (muted)", "Overdriven Guitar", "Distortion Guitar", "Guitar harmonics",
  "Acoustic Bass", "Electric Bass (finger)", "Electric Bass (pick)", "Fretless Bass",
  "Slap Bass 1", "Slap Bass 2", "Synth Bass 1", "Synth Bass 2",
  "Violin", "Viola", "Cello", "Contrabass",
  "Tremolo Strings", "Pizzicato Strings", "Orchestral Harp", "Timpani",
  "String Ensemble 1", "String Ensemble 2", "SynthStrings 1", "SynthStrings 2",
  "Choir Aahs", "Voice Oohs", "Synth Voice", "Orchestra Hit",
  "Trumpet", "Trombone", "Tuba", "Muted Trumpet",
  "French Horn", "Brass Section", "SynthBrass 1", "SynthBrass 2",
  "Soprano Sax", "Alto Sax", "Tenor Sax", "Baritone Sax",
  "Oboe", "English Horn", "Bassoon", "Clarinet",
  "Piccolo", "Flute", "Recorder", "Pan Flute",
  "Blown Bottle", "Shakuhachi", "Whistle", "Ocarina",
  "Lead 1 (square)", "Lead 2 (sawtooth)", "Lead 3 (calliope)", "Lead 4 (chiff)",
  "Lead 5 (charang)", "Lead 6 (voice)", "Lead 7 (fifths)", "Lead 8 (bass + lead)",
  "Pad 1 (new age)", "Pad 2 (warm)", "Pad 3 (polysynth)", "Pad 4 (choir)",
  "Pad 5 (bowed)", "Pad 6 (metallic)", "Pad 7 (halo)", "Pad 8 (sweep)",
  "FX 1 (rain)", "FX 2 (soundtrack)", "FX 3 (crystal)", "FX 4 (atmosphere)",
  "FX 5 (brightness)", "FX 6 (goblins)", "FX 7 (echoes)", "FX 8 (sci-fi)",
  "Sitar", "Banjo", "Shamisen", "Koto",
  "Kalimba", "Bag pipe", "Fiddle", "Shanai",
  "Tinkle Bell", "Agogo", "Steel Drums", "Woodblock",
  "Taiko Drum", "Melodic Tom", "Synth Drum", "Reverse Cymbal",
  "Guitar Fret Noise", "Breath Noise", "Seashore", "Bird Tweet",
  "Telephone Ring", "Helicopter", "Applause", "Gunshot"
];

// Specific mapping for consolidation. Key is GM Program Number (0-indexed).
export const INSTRUMENT_MAP: { [key: number]: InstrumentGroup } = {
  // Pianos (0-7)
  0: CONSOLIDATED_INSTRUMENTS.PIANO, 1: CONSOLIDATED_INSTRUMENTS.PIANO, 2: CONSOLIDATED_INSTRUMENTS.PIANO, 3: CONSOLIDATED_INSTRUMENTS.PIANO,
  4: CONSOLIDATED_INSTRUMENTS.PIANO, 5: CONSOLIDATED_INSTRUMENTS.PIANO, 6: CONSOLIDATED_INSTRUMENTS.PIANO, 7: CONSOLIDATED_INSTRUMENTS.PIANO,

  // Guitars (24-31)
  24: CONSOLIDATED_INSTRUMENTS.HIGH_GUITAR, 
  25: CONSOLIDATED_INSTRUMENTS.HIGH_GUITAR,   
  26: CONSOLIDATED_INSTRUMENTS.HIGH_GUITAR,   
  27: CONSOLIDATED_INSTRUMENTS.HIGH_GUITAR,   
  28: CONSOLIDATED_INSTRUMENTS.HIGH_GUITAR,   
  29: CONSOLIDATED_INSTRUMENTS.HIGH_GUITAR,   
  30: CONSOLIDATED_INSTRUMENTS.HIGH_GUITAR,   
  31: CONSOLIDATED_INSTRUMENTS.HIGH_GUITAR,   

  // Bass (32-39)
  32: CONSOLIDATED_INSTRUMENTS.ACOUSTIC_BASS, 
  33: CONSOLIDATED_INSTRUMENTS.ELECTRIC_BASS, 
  34: CONSOLIDATED_INSTRUMENTS.ELECTRIC_BASS, 
  35: CONSOLIDATED_INSTRUMENTS.ELECTRIC_BASS, 
  36: CONSOLIDATED_INSTRUMENTS.ELECTRIC_BASS, 
  37: CONSOLIDATED_INSTRUMENTS.ELECTRIC_BASS, 
  38: CONSOLIDATED_INSTRUMENTS.ELECTRIC_BASS, 
  39: CONSOLIDATED_INSTRUMENTS.ELECTRIC_BASS, 

  // Strings
  40: CONSOLIDATED_INSTRUMENTS.VIOLIN,        // Violin
  41: CONSOLIDATED_INSTRUMENTS.VIOLIN,        // Viola (proxy with Violin sample for now)
  42: CONSOLIDATED_INSTRUMENTS.LOW_STRINGS,   // Cello
  43: CONSOLIDATED_INSTRUMENTS.LOW_STRINGS,   // Contrabass
  44: CONSOLIDATED_INSTRUMENTS.STRING_ENSEMBLE, // Tremolo Strings
  45: CONSOLIDATED_INSTRUMENTS.STRING_ENSEMBLE, // Pizzicato Strings
  // 46: Orchestral Harp - often unique, could be OTHER or a new HARP category if sample added
  // Timpani (47) is percussion

  48: CONSOLIDATED_INSTRUMENTS.STRING_ENSEMBLE, // String Ensemble 1
  49: CONSOLIDATED_INSTRUMENTS.LOW_STRINGS,     // String Ensemble 2 (often darker, map to Low Strings)
  50: CONSOLIDATED_INSTRUMENTS.STRING_ENSEMBLE, // SynthStrings 1
  51: CONSOLIDATED_INSTRUMENTS.STRING_ENSEMBLE, // SynthStrings 2

  // Brass
  57: CONSOLIDATED_INSTRUMENTS.TROMBONE,    // Trombone

  // Winds (Flutes/Clarinets)
  71: CONSOLIDATED_INSTRUMENTS.CLARINET,    
  72: CONSOLIDATED_INSTRUMENTS.FLUTE,       
  73: CONSOLIDATED_INSTRUMENTS.FLUTE,       
  74: CONSOLIDATED_INSTRUMENTS.FLUTE,       
  75: CONSOLIDATED_INSTRUMENTS.FLUTE,       

  // Ethnic
  107: CONSOLIDATED_INSTRUMENTS.KOTO,       // Koto
  110: CONSOLIDATED_INSTRUMENTS.VIOLIN,     // Fiddle

  // Specific Percussive instruments that might not be on channel 9/10
  47: CONSOLIDATED_INSTRUMENTS.DRUMS, 
  113: CONSOLIDATED_INSTRUMENTS.DRUMS, 
  114: CONSOLIDATED_INSTRUMENTS.DRUMS, 
  115: CONSOLIDATED_INSTRUMENTS.DRUMS, 
  116: CONSOLIDATED_INSTRUMENTS.DRUMS, 
  117: CONSOLIDATED_INSTRUMENTS.DRUMS, 
  118: CONSOLIDATED_INSTRUMENTS.DRUMS, 
  119: CONSOLIDATED_INSTRUMENTS.DRUMS, 
};

export const getInstrumentName = (programNumber: number, isDrumTrack: boolean): string => {
  if (isDrumTrack) {
    return CONSOLIDATED_INSTRUMENTS.DRUMS.name;
  }
  const mappedInstrument = INSTRUMENT_MAP[programNumber];
  if (mappedInstrument) {
    return mappedInstrument.name;
  }
  
  const gmName = GM_INSTRUMENT_NAMES[programNumber];
  if (gmName) {
    const lowerGmName = gmName.toLowerCase();
    if (lowerGmName.includes("piano")) return CONSOLIDATED_INSTRUMENTS.PIANO.name;
    if (lowerGmName.includes("violin") || lowerGmName.includes("fiddle")) return CONSOLIDATED_INSTRUMENTS.VIOLIN.name;
    if (lowerGmName.includes("viola")) return CONSOLIDATED_INSTRUMENTS.VIOLIN.name; // Use Violin sample for Viola for now
    if (lowerGmName.includes("cello") || lowerGmName.includes("contrabass")) return CONSOLIDATED_INSTRUMENTS.LOW_STRINGS.name;
    if (lowerGmName.includes("string ensemble") || lowerGmName.includes("synthstrings") || lowerGmName.includes("tremolo strings") || lowerGmName.includes("pizzicato strings")) return CONSOLIDATED_INSTRUMENTS.STRING_ENSEMBLE.name;

    if (lowerGmName.includes("guitar") && !lowerGmName.includes("bass")) return CONSOLIDATED_INSTRUMENTS.HIGH_GUITAR.name;
    if (lowerGmName.includes("bass") && lowerGmName.includes("acoustic")) return CONSOLIDATED_INSTRUMENTS.ACOUSTIC_BASS.name;
    if (lowerGmName.includes("bass") && lowerGmName.includes("electric")) return CONSOLIDATED_INSTRUMENTS.ELECTRIC_BASS.name;
    if (lowerGmName.includes("bass")) return CONSOLIDATED_INSTRUMENTS.ELECTRIC_BASS.name; 
    if (lowerGmName.includes("flute") || lowerGmName.includes("piccolo") || lowerGmName.includes("recorder")) return CONSOLIDATED_INSTRUMENTS.FLUTE.name;
    if (lowerGmName.includes("clarinet")) return CONSOLIDATED_INSTRUMENTS.CLARINET.name;
    if (lowerGmName.includes("koto")) return CONSOLIDATED_INSTRUMENTS.KOTO.name;
    if (lowerGmName.includes("trombone")) return CONSOLIDATED_INSTRUMENTS.TROMBONE.name;
    if (lowerGmName.includes("drum") || lowerGmName.includes("percussion") || lowerGmName.includes("tom") || lowerGmName.includes("cymbal") || lowerGmName.includes("snare")) return CONSOLIDATED_INSTRUMENTS.DRUMS.name;
    
    return gmName; // Return original GM name if no specific consolidation rule matches after primary checks
  }
  return CONSOLIDATED_INSTRUMENTS.OTHER.name; 
};


// General MIDI Percussion Key Map (for notes on channel 9/10)
// Key: MIDI Note Number (0-127)
export const GM_PERCUSSION_NAMES: { [key: number]: string } = {
    27: "High Q", 28: "Slap", 29: "Scratch Push", 30: "Scratch Pull", 31: "Sticks", 32: "Square Click",
    33: "Metronome Click", 34: "Metronome Bell", 35: "Acoustic Bass Drum", 36: "Bass Drum 1",
    37: "Side Stick", 38: "Acoustic Snare", 39: "Hand Clap", 40: "Electric Snare",
    41: "Low Floor Tom", 42: "Closed Hi-Hat", 43: "High Floor Tom", 44: "Pedal Hi-Hat",
    45: "Low Tom", 46: "Open Hi-Hat", 47: "Low-Mid Tom", 48: "High-Mid Tom",
    49: "Crash Cymbal 1", 50: "High Tom", 51: "Ride Cymbal 1", 52: "Chinese Cymbal",
    53: "Ride Bell", 54: "Tambourine", 55: "Splash Cymbal", 56: "Cowbell",
    57: "Crash Cymbal 2", 58: "Vibraslap", 59: "Ride Cymbal 2", 60: "Hi Bongo",
    61: "Low Bongo", 62: "Mute Hi Conga", 63: "Open Hi Conga", 64: "Low Conga",
    65: "High Timbale", 66: "Low Timbale", 67: "High Agogo", 68: "Low Agogo",
    69: "Cabasa", 70: "Maracas", 71: "Short Whistle", 72: "Long Whistle",
    73: "Short Guiro", 74: "Long Guiro", 75: "Claves", 76: "Hi Wood Block",
    77: "Low Wood Block", 78: "Mute Cuica", 79: "Open Cuica", 80: "Mute Triangle",
    81: "Open Triangle", 82: "Shaker", 83: "Jingle Bell", 84: "Bell Tree", 85: "Castanets",
    86: "Mute Surdo", 87: "Open Surdo"
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const getNoteNameFromMidi = (midiNumber: number): string => {
    if (midiNumber < 0 || midiNumber > 127) return `MIDI#${midiNumber}`; 
    const octave = Math.floor(midiNumber / 12) - 1;
    const noteIndex = midiNumber % 12;
    return `${NOTE_NAMES[noteIndex]}${octave}`;
};

export const getMidiFromNoteName = (noteName: string): number => {
  const standardNoteRegex = /^([A-G])([#b]?)(-?\d+)$/;
  let match = noteName.match(standardNoteRegex);

  if (match) {
    let noteStr = match[1]; 
    const accidental = match[2]; 
    const octaveStr = match[3]; 
    
    let noteBaseIndex = NOTE_NAMES.indexOf(noteStr);

    if (accidental === '#') {
      noteBaseIndex = (noteBaseIndex + 1) % 12;
    } else if (accidental === 'b') {
      noteBaseIndex = (noteBaseIndex - 1 + 12) % 12;
    }
    
    if (noteStr.length > 1 && NOTE_NAMES.includes(noteStr)) {
         noteBaseIndex = NOTE_NAMES.indexOf(noteStr);
    } else if (accidental === '') { 
        
    } else { 
        const combinedNoteIndex = NOTE_NAMES.indexOf(`${noteStr}${accidental}`);
        if(combinedNoteIndex !== -1) {
            noteBaseIndex = combinedNoteIndex;
        } else {
             if (accidental === '#') {
                noteBaseIndex = (NOTE_NAMES.indexOf(noteStr) + 1) % 12;
            } else if (accidental === 'b') {
                noteBaseIndex = (NOTE_NAMES.indexOf(noteStr) - 1 + 12) % 12;
            }
        }
    }


    if (noteBaseIndex === -1 && noteStr.length === 1) { 
        console.warn(`Unknown base note: ${noteStr} in ${noteName}`);
        return -3; 
    }


    const octave = parseInt(octaveStr, 10);
    return noteBaseIndex + (octave + 1) * 12;
  }
  
  const midiHashMatch = noteName.match(/^MIDI#(-?\d+)$/);
  if (midiHashMatch && midiHashMatch[1]) {
      return parseInt(midiHashMatch[1], 10);
  }

  console.warn(`Could not parse note name: ${noteName} into MIDI number.`);
  return -1; 
};

export const CONSOLIDATED_INSTRUMENT_COLORS: { [key: string]: string } = {
  [CONSOLIDATED_INSTRUMENTS.PIANO.name]: "#3B82F6",             // blue-500
  [CONSOLIDATED_INSTRUMENTS.VIOLIN.name]: "#EC4899",           // pink-500 
  [CONSOLIDATED_INSTRUMENTS.STRING_ENSEMBLE.name]: "#A855F7",   // purple-500 (was Other)
  [CONSOLIDATED_INSTRUMENTS.LOW_STRINGS.name]: "#8B5CF6",       // violet-500 
  [CONSOLIDATED_INSTRUMENTS.HIGH_GUITAR.name]: "#F59E0B",       // amber-500 
  [CONSOLIDATED_INSTRUMENTS.ACOUSTIC_BASS.name]: "#10B981",     // emerald-500 
  [CONSOLIDATED_INSTRUMENTS.ELECTRIC_BASS.name]: "#D97706",     // amber-600  
  [CONSOLIDATED_INSTRUMENTS.FLUTE.name]: "#06B6D4",            // cyan-500 
  [CONSOLIDATED_INSTRUMENTS.CLARINET.name]: "#0EA5E9",          // sky-500 
  [CONSOLIDATED_INSTRUMENTS.KOTO.name]: "#2DD4BF",              // teal-400
  [CONSOLIDATED_INSTRUMENTS.TROMBONE.name]: "#FBBF24",          // amber-400
  [CONSOLIDATED_INSTRUMENTS.DRUMS.name]: "#6B7280",             // slate-500 
  [CONSOLIDATED_INSTRUMENTS.OTHER.name]: "#EF4444",             // red-500 (new)
  "Default": "#9CA3AF"                                         // slate-400
};

export const getInstrumentColor = (instrumentName: string): string => {
  return CONSOLIDATED_INSTRUMENT_COLORS[instrumentName] || CONSOLIDATED_INSTRUMENT_COLORS["Default"];
};
