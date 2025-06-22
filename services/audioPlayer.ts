import { Midi } from '@tonejs/midi';
import * as Tone from 'tone';
import { getInstrumentName, CONSOLIDATED_INSTRUMENTS, getNoteNameFromMidi } from '../constants/midiMapping';

let pianoSampler: Tone.Sampler | null = null;
const PIANO_SAMPLE_PATH = "/sound-samples/piano/c5.mp3";

let drumSampler: Tone.Sampler | null = null;
const DRUM_KIT_BASE_URL = "/sound-samples/drum-kit/";
const DRUM_SAMPLES_FILES = {
    "C2": "kick.mp3",        
    "D2": "snare.mp3",       
    "F#2": "closed-hat.mp3", 
    "A#2": "open-hat.mp3",   
    "C#3": "crash.mp3",      
};

let bassSampler: Tone.Sampler | null = null;
const BASS_SAMPLE_URL = "/sound-samples/bass/";
const BASS_SAMPLES_FILES = {
    "C3": "c3.mp3", 
};

let kotoSampler: Tone.Sampler | null = null;
const KOTO_SAMPLE_URL = "/sound-samples/koto/";
const KOTO_SAMPLES_FILES = {
    "C3": "c3.mp3",
};

let tromboneSampler: Tone.Sampler | null = null;
const TROMBONE_SAMPLE_URL = "/sound-samples/trombone/";
const TROMBONE_SAMPLES_FILES = {
    "C3": "c3.mp3",
};

let violinSampler: Tone.Sampler | null = null;
const VIOLIN_SAMPLE_PATH = "/sound-samples/violin/c3.mp3";


let scheduledEventIds: number[] = [];
let onPlaybackStateChangeCallback: (() => void) | null = null;
let playbackStartToneTime = 0;
let totalMidiDuration = 0; 
const MIN_PLAYBACK_DURATION = 0.01;
const DEFAULT_PLAYBACK_BPM = 120;
const MIN_REASONABLE_BPM = 20;
const MAX_REASONABLE_BPM = 500;

let currentGlobalVolumes = {
    piano: 3.52,
    drums: 0,
    bass: 0,
    koto: 0,
    trombone: 0,
    violin: 0, 
};

async function initializeSamplers(): Promise<void> {
  const samplerPromises = [];
  console.log("Initializing samplers...");

  if (!pianoSampler || pianoSampler.disposed) {
    console.log("Attempting to load Piano sampler...");
    samplerPromises.push(new Promise<void>((resolve, reject) => {
      pianoSampler = new Tone.Sampler({
        urls: { "C5": PIANO_SAMPLE_PATH },
        release: 1,
        volume: currentGlobalVolumes.piano,
        onload: () => { console.log(`Piano sampler loaded successfully from: ${PIANO_SAMPLE_PATH}`); resolve(); },
        onerror: (err) => { console.error(`Failed to load piano sampler from ${PIANO_SAMPLE_PATH}:`, err); reject(err); }
      }).toDestination();
    }));
  } else {
     console.log("Piano sampler already initialized. Applying current global volume:", currentGlobalVolumes.piano);
     pianoSampler.volume.value = currentGlobalVolumes.piano;
  }

  if (!drumSampler || drumSampler.disposed) {
    console.log("Attempting to load Drum sampler...");
    samplerPromises.push(new Promise<void>((resolve, reject) => {
      drumSampler = new Tone.Sampler({
        urls: DRUM_SAMPLES_FILES,
        release: 0.4, 
        baseUrl: DRUM_KIT_BASE_URL,
        volume: currentGlobalVolumes.drums,
        onload: () => { 
          console.log(`Drum sampler loaded successfully from base: ${DRUM_KIT_BASE_URL}`);
          Object.entries(DRUM_SAMPLES_FILES).forEach(([note, file]) => console.log(`  Loaded drum sample: ${DRUM_KIT_BASE_URL}${file} for note ${note}`));
          resolve(); 
        },
        onerror: (err) => { console.error(`Failed to load drum sampler from ${DRUM_KIT_BASE_URL}:`, err); reject(err); }
      }).toDestination();
    }));
  } else {
    console.log("Drum sampler already initialized. Applying current global volume:", currentGlobalVolumes.drums);
    drumSampler.volume.value = currentGlobalVolumes.drums;
  }

  if (!bassSampler || bassSampler.disposed) {
    console.log("Attempting to load Bass sampler...");
    samplerPromises.push(new Promise<void>((resolve, reject) => {
      bassSampler = new Tone.Sampler({
        urls: BASS_SAMPLES_FILES,
        release: 0.8, 
        baseUrl: BASS_SAMPLE_URL,
        volume: currentGlobalVolumes.bass,
        onload: () => { 
          console.log(`Bass sampler loaded successfully from base: ${BASS_SAMPLE_URL}`);
          Object.entries(BASS_SAMPLES_FILES).forEach(([note, file]) => console.log(`  Loaded bass sample: ${BASS_SAMPLE_URL}${file} for note ${note}`));
          resolve(); 
        },
        onerror: (err) => { console.error(`Failed to load bass sampler from ${BASS_SAMPLE_URL}:`, err); reject(err); }
      }).toDestination();
    }));
  } else {
    console.log("Bass sampler already initialized. Applying current global volume:", currentGlobalVolumes.bass);
    bassSampler.volume.value = currentGlobalVolumes.bass;
  }

  if (!kotoSampler || kotoSampler.disposed) {
    console.log("Attempting to load Koto sampler...");
    samplerPromises.push(new Promise<void>((resolve, reject) => {
      kotoSampler = new Tone.Sampler({
        urls: KOTO_SAMPLES_FILES,
        release: 0.8,
        baseUrl: KOTO_SAMPLE_URL,
        volume: currentGlobalVolumes.koto,
        onload: () => { 
          console.log(`Koto sampler loaded successfully from base: ${KOTO_SAMPLE_URL}`);
          Object.entries(KOTO_SAMPLES_FILES).forEach(([note, file]) => console.log(`  Loaded koto sample: ${KOTO_SAMPLE_URL}${file} for note ${note}`));
          resolve(); 
        },
        onerror: (err) => { console.error(`Failed to load koto sampler from ${KOTO_SAMPLE_URL}:`, err); reject(err); }
      }).toDestination();
    }));
  } else {
    console.log("Koto sampler already initialized. Applying current global volume:", currentGlobalVolumes.koto);
    kotoSampler.volume.value = currentGlobalVolumes.koto;
  }

  if (!tromboneSampler || tromboneSampler.disposed) {
    console.log("Attempting to load Trombone sampler...");
    samplerPromises.push(new Promise<void>((resolve, reject) => {
      tromboneSampler = new Tone.Sampler({
        urls: TROMBONE_SAMPLES_FILES,
        release: 1, 
        baseUrl: TROMBONE_SAMPLE_URL,
        volume: currentGlobalVolumes.trombone,
        onload: () => { 
          console.log(`Trombone sampler loaded successfully from base: ${TROMBONE_SAMPLE_URL}`);
          Object.entries(TROMBONE_SAMPLES_FILES).forEach(([note, file]) => console.log(`  Loaded trombone sample: ${TROMBONE_SAMPLE_URL}${file} for note ${note}`));
          resolve(); 
        },
        onerror: (err) => { console.error(`Failed to load trombone sampler from ${TROMBONE_SAMPLE_URL}:`, err); reject(err); }
      }).toDestination();
    }));
  } else {
    console.log("Trombone sampler already initialized. Applying current global volume:", currentGlobalVolumes.trombone);
    tromboneSampler.volume.value = currentGlobalVolumes.trombone;
  }

  if (!violinSampler || violinSampler.disposed) {
    console.log("Attempting to load Violin sampler...");
    samplerPromises.push(new Promise<void>((resolve, reject) => {
      violinSampler = new Tone.Sampler({
        urls: { "C3": VIOLIN_SAMPLE_PATH },
        release: 1, 
        volume: currentGlobalVolumes.violin,
        onload: () => { console.log(`Violin sampler loaded successfully from: ${VIOLIN_SAMPLE_PATH}`); resolve(); },
        onerror: (err) => { console.error(`Failed to load violin sampler from ${VIOLIN_SAMPLE_PATH}:`, err); reject(err); }
      }).toDestination();
    }));
  } else {
     console.log("Violin sampler already initialized. Applying current global volume:", currentGlobalVolumes.violin);
     violinSampler.volume.value = currentGlobalVolumes.violin;
  }


  try {
    await Promise.all(samplerPromises);
    console.log("All requested samplers initialized (or were already initialized and volumes updated).");
  } catch (error) {
    console.error("Error initializing one or more samplers:", error);
  }
}

export const audioPlayer = {
  isPlaying: false,
  isInitialized: false, 

  async init() {
    if (Tone.context.state !== 'running') {
      try {
        await Tone.start();
        console.log("AudioContext started by audioPlayer.init()");
        this.isInitialized = true;
      } catch (e) {
        console.error("Failed to start AudioContext via audioPlayer.init():", e);
        this.isInitialized = false; 
        return; 
      }
    } else {
        this.isInitialized = true;
    }
    
    if (this.isInitialized) {
        await initializeSamplers();
    }
  },

  setPianoVolume(db: number) {
    currentGlobalVolumes.piano = db;
    if (pianoSampler && !pianoSampler.disposed) {
      pianoSampler.volume.value = db;
    }
  },
  setDrumVolume(db: number) {
    currentGlobalVolumes.drums = db;
    if (drumSampler && !drumSampler.disposed) {
      drumSampler.volume.value = db;
    }
  },
  setBassVolume(db: number) {
    currentGlobalVolumes.bass = db;
    if (bassSampler && !bassSampler.disposed) {
      bassSampler.volume.value = db;
    }
  },
  setKotoVolume(db: number) {
    currentGlobalVolumes.koto = db;
    if (kotoSampler && !kotoSampler.disposed) {
      kotoSampler.volume.value = db;
    }
  },
  setTromboneVolume(db: number) {
    currentGlobalVolumes.trombone = db;
    if (tromboneSampler && !tromboneSampler.disposed) {
      tromboneSampler.volume.value = db;
    }
  },
  setViolinVolume(db: number) {
    currentGlobalVolumes.violin = db;
    if (violinSampler && !violinSampler.disposed) {
      violinSampler.volume.value = db;
    }
  },

  getCurrentPlaybackTime(): number {
    if (Tone.Transport.state === "started" || Tone.Transport.state === "paused") {
        return Tone.Transport.seconds;
    }
    return 0;
  },

  async play(midiObject: Midi | null) {
    if (!midiObject) {
      console.error("AudioPlayer: No MIDI object provided to play.");
      return;
    }
    if (!this.isInitialized) {
      await this.init(); 
      if(!this.isInitialized){
        console.error("AudioPlayer: AudioContext could not be initialized. Cannot play audio.");
        return;
      }
    }
    
    await initializeSamplers(); 

    this.stop(); 
    
    playbackStartToneTime = Tone.now();
    totalMidiDuration = midiObject.duration || 0; // Ensure duration is a number

    if (midiObject.header.tempos && midiObject.header.tempos.length > 0 && midiObject.header.tempos[0].bpm) {
      const newBpm = midiObject.header.tempos[0].bpm;
      if (isFinite(newBpm) && newBpm >= MIN_REASONABLE_BPM && newBpm <= MAX_REASONABLE_BPM) {
          Tone.Transport.bpm.value = newBpm;
      } else {
          Tone.Transport.bpm.value = DEFAULT_PLAYBACK_BPM;
          console.warn(`AudioPlayer: Parsed BPM ${newBpm} is out of reasonable range. Defaulting to ${DEFAULT_PLAYBACK_BPM} BPM.`);
      }
    } else {
      Tone.Transport.bpm.value = DEFAULT_PLAYBACK_BPM;
      console.warn(`AudioPlayer: Tempo information missing. Defaulting to ${DEFAULT_PLAYBACK_BPM} BPM.`);
    }
    console.log(`AudioPlayer: Tone.Transport.bpm.value set to: ${Tone.Transport.bpm.value}`);

    midiObject.tracks.forEach((track, trackIndex) => {
      const isDrumTrackChannel = track.channel === 9;
      const programNumber = track.instrument.number;
      const instrumentNameFromMidi = getInstrumentName(programNumber, isDrumTrackChannel); 
      
      console.log(`AudioPlayer: Processing Track ${trackIndex}: Channel=${track.channel}, Program=${programNumber}, Derived Name="${instrumentNameFromMidi}"`);

      let targetSampler: Tone.Sampler | null = null;
      let samplerType = "Unknown";

      if (isDrumTrackChannel) {
        if (drumSampler && !drumSampler.disposed) { targetSampler = drumSampler; samplerType = "Drum"; } 
        else { console.warn(`Drum sampler not ready for track (channel ${track.channel}). Notes will be silent.`); }
      } else if (instrumentNameFromMidi === CONSOLIDATED_INSTRUMENTS.ACOUSTIC_BASS.name || 
                 instrumentNameFromMidi === CONSOLIDATED_INSTRUMENTS.ELECTRIC_BASS.name) {
        if (bassSampler && !bassSampler.disposed) { targetSampler = bassSampler; samplerType = "Bass"; } 
        else { console.warn(`Bass sampler not ready for track "${instrumentNameFromMidi}". Notes will be silent.`); }
      } else if (instrumentNameFromMidi === CONSOLIDATED_INSTRUMENTS.KOTO.name) {
        if (kotoSampler && !kotoSampler.disposed) { targetSampler = kotoSampler; samplerType = "Koto"; } 
        else { console.warn(`Koto sampler not ready for track "${instrumentNameFromMidi}". Notes will be silent.`); }
      } else if (instrumentNameFromMidi === CONSOLIDATED_INSTRUMENTS.TROMBONE.name) {
         if (tromboneSampler && !tromboneSampler.disposed) { targetSampler = tromboneSampler; samplerType = "Trombone"; } 
         else { console.warn(`Trombone sampler not ready for track "${instrumentNameFromMidi}". Notes will be silent.`); }
      } else if (instrumentNameFromMidi === CONSOLIDATED_INSTRUMENTS.VIOLIN.name) {
         if (violinSampler && !violinSampler.disposed) { targetSampler = violinSampler; samplerType = "Violin"; }
         else { console.warn(`Violin sampler not ready for track "${instrumentNameFromMidi}". Notes will be silent.`); }
      }
      else { 
        // Default to piano for other melodic instruments or if a  sampler is missing
        if (pianoSampler && !pianoSampler.disposed) { targetSampler = pianoSampler; samplerType = "Piano (Default)"; } 
        else { console.warn(`Default piano sampler not ready for track "${instrumentNameFromMidi}". Notes will be silent.`); }
      }

      if (!targetSampler) {
        console.warn(`AudioPlayer: No target sampler found or sampler not ready for track "${instrumentNameFromMidi}". Skipping notes.`);
        return; 
      }
      console.log(`AudioPlayer: Track "${instrumentNameFromMidi}" (Program ${programNumber}, Channel ${track.channel}) using ${samplerType} sampler.`);

      track.notes.forEach(note => {
        let playDuration = note.duration;
        if (playDuration <= 0) {
          playDuration = MIN_PLAYBACK_DURATION;
        }
        const noteNameToPlay = getNoteNameFromMidi(note.midi);

        const id = Tone.Transport.scheduleOnce(time => {
          if (targetSampler && !targetSampler.disposed) {
            targetSampler.triggerAttackRelease(noteNameToPlay, playDuration, time, note.velocity);
          }
        }, note.time);
        scheduledEventIds.push(id);
      });
    });

    const endEventId = Tone.Transport.scheduleOnce(() => {
      this.isPlaying = false;
      console.log("AudioPlayer: Playback finished.");
      if (onPlaybackStateChangeCallback) {
        onPlaybackStateChangeCallback();
      }
    }, totalMidiDuration + 0.5); 
    scheduledEventIds.push(endEventId);

    Tone.Transport.start(playbackStartToneTime);
    this.isPlaying = true;
    if (onPlaybackStateChangeCallback) {
      onPlaybackStateChangeCallback();
    }
    console.log(`AudioPlayer: Playback started. Total duration: ${totalMidiDuration.toFixed(2)}s`);
  },

  pause() {
    if (this.isPlaying) {
      Tone.Transport.pause();
      this.isPlaying = false;
      console.log("AudioPlayer: Playback paused.");
      if (onPlaybackStateChangeCallback) {
        onPlaybackStateChangeCallback();
      }
    }
  },

  resume() {
    const samplersAvailable = (pianoSampler && !pianoSampler.disposed) || 
                              (drumSampler && !drumSampler.disposed) ||
                              (bassSampler && !bassSampler.disposed) ||
                              (kotoSampler && !kotoSampler.disposed) ||
                              (tromboneSampler && !tromboneSampler.disposed) ||
                              (violinSampler && !violinSampler.disposed); // Added violinSampler

    if (!this.isPlaying && Tone.Transport.state === "paused" && samplersAvailable) {
      Tone.Transport.start(); 
      this.isPlaying = true;
      console.log("AudioPlayer: Playback resumed.");
      if (onPlaybackStateChangeCallback) {
        onPlaybackStateChangeCallback();
      }
    } else if (!this.isPlaying && Tone.Transport.state === "paused") {
        console.warn("AudioPlayer: Cannot resume, one or more samplers might not be ready or loaded.");
    }
  },

  stop() {
    Tone.Transport.stop();
    Tone.Transport.cancel(0); 
    Tone.Transport.position = 0; 

    scheduledEventIds.forEach(id => Tone.Transport.clear(id));
    scheduledEventIds = [];
    
    if (pianoSampler && !pianoSampler.disposed) pianoSampler.releaseAll();
    if (drumSampler && !drumSampler.disposed) drumSampler.releaseAll();
    if (bassSampler && !bassSampler.disposed) bassSampler.releaseAll();
    if (kotoSampler && !kotoSampler.disposed) kotoSampler.releaseAll();
    if (tromboneSampler && !tromboneSampler.disposed) tromboneSampler.releaseAll();
    if (violinSampler && !violinSampler.disposed) violinSampler.releaseAll();
    
    const wasPlaying = this.isPlaying;
    this.isPlaying = false;
    
    if (wasPlaying && onPlaybackStateChangeCallback) { 
        onPlaybackStateChangeCallback();
    }
    console.log("AudioPlayer: Playback stopped and transport reset.");
  },

  onPlaybackStateChange(callback: (() => void) | null ) { 
    onPlaybackStateChangeCallback = callback;
  }
};

if (typeof window !== 'undefined') {
  // Initialization is deferred to user interaction (e.g., first play click)
}
