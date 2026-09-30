/**
 * N.E.X.U.S. Voice Engine
 * High-performance Speech Recognition (STT), Multilingual Voice Synthesis (TTS),
 * Hardware Digital Signal Processing, Real-Time Web Audio VAD Metering,
 * and Hands-Free Conversational Loop.
 */

import { SUPPORTED_LANGUAGES } from "./nexusAI";

export type VoiceGender = "male" | "female" | "auto";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    mozSpeechRecognition?: SpeechRecognitionConstructor;
    msSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function getSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return (
    window.SpeechRecognition ||
    window.webkitSpeechRecognition ||
    window.mozSpeechRecognition ||
    window.msSpeechRecognition ||
    null
  );
}

export interface VoiceEngineConfig {
  language: string;
  autoListen?: boolean;
  voiceGender?: VoiceGender;
  onStateChange?: (state: "idle" | "listening" | "thinking" | "speaking") => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onAudioEnergy?: (energy: number) => void;
  onError?: (msg: string) => void;
}

export class VoiceEngine {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening = false;
  private isSpeaking = false;
  private isStarting = false;
  private speechPending = false;
  private autoListenEnabled = false; // Enabled upon user activation
  private voiceGender: VoiceGender = "male";
  private energyIntervalId: number | null = null;
  private silenceTimer: number | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private keepAliveTimer: number | null = null;
  private speechWatchdog: number | null = null;
  private consecutiveErrors = 0;
  private restartTimer: number | null = null;
  private echoGuardTimer: number | null = null;

  // Acoustic Echo Shield: Window to drop any microphone feedback during & after TTS playback
  private ignoreTranscriptsUntil = 0;
  private lastSpokenText = "";
  private recentSpokenWords = new Set<string>();
  private recentPhrases: string[] = [];
  private micHardwareMuted = false;
  private echoGuardMs = 1200; // 1.2s delay for physical room echo / OS audio buffer decay

  // Real-time Web Audio API Analyser for physical mic energy
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private micVolumeLoopId: number | null = null;

  // Progressive speech accumulation & conversational silence detection
  private accumulatedFinal = "";
  private activeSessionFinal = "";
  private currentTurnInterim = "";
  private lastSpeechTimestamp = 0;
  private lastVoiceEnergyTimestamp = 0;
  // Natural conversational silence pause: 2.2s (2200ms) allows multi-sentence commands and breath pauses
  private conversationalSilenceThresholdMs = 2200;

  public config: VoiceEngineConfig;

  constructor(config: VoiceEngineConfig) {
    this.config = config;
    if (config.autoListen !== undefined) {
      this.autoListenEnabled = config.autoListen;
    }
    if (config.voiceGender) {
      this.voiceGender = config.voiceGender;
    }
    if (typeof window !== "undefined") {
      this.loadVoices();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  /**
   * Hardware mute/unmute of physical microphone media tracks.
   * Completely silences audio input into the browser and analyser during TTS playback.
   */
  public setMicHardwareMute(muted: boolean) {
    this.micHardwareMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        try {
          track.enabled = !muted;
        } catch {}
      });
    }
  }

  /**
   * Register AI spoken text into history to prevent mic echo loops
   */
  private registerSpokenText(text: string) {
    this.lastSpokenText = text;
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3);

    for (const w of words) {
      this.recentSpokenWords.add(w);
    }

    this.recentPhrases.push(text.toLowerCase());
    if (this.recentPhrases.length > 8) {
      this.recentPhrases.shift();
    }

    // Decay spoken words after 18 seconds
    setTimeout(() => {
      for (const w of words) {
        this.recentSpokenWords.delete(w);
      }
    }, 18000);
  }

  /**
   * Determine if a recognized text phrase is an acoustic echo of the AI's own voice
   */
  public isAcousticEcho(rawText: string): boolean {
    const text = rawText.trim().toLowerCase();
    if (!text) return true;

    // 1. If timestamp is still within ignore window, it is definitively an echo
    if (Date.now() < this.ignoreTranscriptsUntil) {
      return true;
    }

    // 2. If AI is speaking or about to speak, drop any mic input
    if (this.isSpeaking || this.speechPending) {
      return true;
    }

    // 3. Ignore very short phantom murmurs (1-2 chars or single sound)
    const words = text.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
    if (words.length === 1 && words[0].length <= 2) {
      return true;
    }

    // 4. Exact or substring match against recently spoken text
    if (this.lastSpokenText) {
      const cleanLast = this.lastSpokenText.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
      const cleanInput = text.replace(/[^a-z0-9\s]/g, " ");
      if (cleanLast.includes(cleanInput) && cleanInput.length >= 4) {
        return true;
      }
    }

    // 5. Check phrase history
    for (const phrase of this.recentPhrases) {
      const cleanPhrase = phrase.replace(/[^a-z0-9\s]/g, " ");
      const cleanInput = text.replace(/[^a-z0-9\s]/g, " ");
      if (cleanPhrase.includes(cleanInput) && cleanInput.length >= 4) {
        return true;
      }
    }

    // 6. Token overlap test: If >= 40% of words in the query match words the AI recently spoke
    if (this.recentSpokenWords.size > 0 && words.length > 0) {
      let matchCount = 0;
      for (const w of words) {
        if (this.recentSpokenWords.has(w)) {
          matchCount++;
        }
      }
      const ratio = matchCount / words.length;
      if (ratio >= 0.4 && words.length <= 6) {
        return true;
      }
    }

    return false;
  }

  public getIsEchoGuarded(): boolean {
    return this.isSpeaking || this.speechPending || Date.now() < this.ignoreTranscriptsUntil;
  }

  /**
   * Check if speech recognition is supported in current browser
   */
  public isSpeechRecognitionSupported(): boolean {
    return getSpeechRecognitionClass() !== null;
  }

  /**
   * Get current state of microphone and voice loop
   */
  public getMicrophoneState() {
    return {
      isSupported: this.isSpeechRecognitionSupported(),
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      speechPending: this.speechPending,
      isEchoGuarded: this.getIsEchoGuarded(),
      autoListenEnabled: this.autoListenEnabled,
      hasMicrophoneStream: !!this.mediaStream && this.mediaStream.active,
    };
  }

  /**
   * Request / ensure microphone stream with hardware DSP filters
   * (echo cancellation, noise suppression, auto gain control).
   */
  public async ensureMicrophoneStream(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    try {
      if (!this.mediaStream || !this.mediaStream.active || this.mediaStream.getTracks().every((t) => t.readyState === "ended")) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }
      this.setupAudioAnalysis();
      return true;
    } catch (err: any) {
      console.warn("Microphone access request:", err.name, err.message);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        this.config.onError?.("Microphone permission denied. Click the lock/site settings icon in your browser to allow.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        this.config.onError?.("No microphone detected. Please check your audio input hardware.");
      } else {
        this.config.onError?.(`Microphone initialization error: ${err.message || err.name}`);
      }
      return false;
    }
  }

  /**
   * Setup Web Audio API analyser to measure physical microphone sound levels
   */
  private setupAudioAnalysis() {
    if (!this.mediaStream) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext || this.audioContext.state === "closed") {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === "suspended") {
        void this.audioContext.resume();
      }
      if (!this.analyserNode) {
        this.analyserNode = this.audioContext.createAnalyser();
        this.analyserNode.fftSize = 256;
        this.analyserNode.smoothingTimeConstant = 0.45;
      }
      if (!this.micSourceNode) {
        this.micSourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.micSourceNode.connect(this.analyserNode);
      }
    } catch (err) {
      console.warn("Web Audio API setup notice:", err);
    }
  }

  /**
   * Real-time microphone volume detection loop (60fps)
   * Drives visualizer bars and 3D Orb reactively to user voice.
   */
  private startMicEnergyMonitoring() {
    this.stopMicEnergyMonitoring();
    if (!this.analyserNode) {
      this.setupAudioAnalysis();
    }
    if (!this.analyserNode) return;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    const checkVolume = () => {
      if (!this.isListening || this.isSpeaking || this.speechPending || this.micHardwareMuted) {
        this.stopMicEnergyMonitoring();
        return;
      }

      if (this.analyserNode) {
        this.analyserNode.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Non-linear amplification to highlight natural human speech range
        const energy = Math.min(1.0, Math.pow(avg / 96, 1.2));
        if (energy > 0.08) {
          this.lastVoiceEnergyTimestamp = Date.now();
        }
        this.config.onAudioEnergy?.(energy);
      }

      this.micVolumeLoopId = requestAnimationFrame(checkVolume);
    };

    this.micVolumeLoopId = requestAnimationFrame(checkVolume);
  }

  private stopMicEnergyMonitoring() {
    if (this.micVolumeLoopId !== null) {
      cancelAnimationFrame(this.micVolumeLoopId);
      this.micVolumeLoopId = null;
    }
    if (!this.isSpeaking) {
      this.config.onAudioEnergy?.(0);
    }
  }

  /**
   * Test microphone sound input directly for diagnostic calibration
   */
  public async testMicrophone(onVolume: (energy: number) => void, durationMs = 4000): Promise<boolean> {
    const ok = await this.ensureMicrophoneStream();
    if (!ok || !this.analyserNode) return false;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    let active = true;

    const loop = () => {
      if (!active || !this.analyserNode) return;
      this.analyserNode.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const energy = Math.min(1.0, Math.max(0.0, avg / 100));
      onVolume(energy);
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);

    setTimeout(() => {
      active = false;
      onVolume(0);
    }, durationMs);

    return true;
  }

  private loadVoices() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
  }

  /**
   * Initialize a fresh SpeechRecognition instance cleanly
   */
  private createRecognitionInstance(): SpeechRecognitionInstance | null {
    const SpeechRec = getSpeechRecognitionClass();
    if (!SpeechRec) {
      console.warn("Speech Recognition API is not supported in this browser environment.");
      return null;
    }

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = this.config.language || "en-US";
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      // If AI is currently vocalizing or within acoustic decay window, abort immediately
      if (this.isSpeaking || this.speechPending || Date.now() < this.ignoreTranscriptsUntil) {
        try {
          rec.abort();
        } catch {}
        this.isListening = false;
        this.isStarting = false;
        return;
      }
      this.isListening = true;
      this.isStarting = false;
      this.consecutiveErrors = 0;
      this.config.onStateChange?.("listening");
      this.startMicEnergyMonitoring();
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      // 1. Acoustic Echo Shield: Discard if AI is speaking or room echo is decaying
      if (this.isSpeaking || this.speechPending || Date.now() < this.ignoreTranscriptsUntil) {
        return;
      }

      // Web Speech API Continuous Mode:
      // Loop across all results in event.results from index 0 to length - 1.
      // This guarantees no missed lines, no duplication, and smooth progressive accumulation.
      let sessionFinal = "";
      let sessionInterim = "";

      for (let i = 0; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          sessionFinal += item[0].transcript + " ";
        } else {
          sessionInterim += item[0].transcript;
        }
      }

      this.activeSessionFinal = sessionFinal;
      this.currentTurnInterim = sessionInterim;

      const fullTurnText = (this.accumulatedFinal + " " + this.activeSessionFinal + " " + this.currentTurnInterim)
        .replace(/\s+/g, " ")
        .trim();

      if (!fullTurnText) return;

      // 2. Reject if this matches the AI's recently spoken words
      if (this.isAcousticEcho(fullTurnText)) {
        return;
      }

      this.lastSpeechTimestamp = Date.now();

      // Stream live progressive text to subtitles so user sees all lines building up live
      this.config.onTranscript?.(fullTurnText, false);

      // Conversational pause detection (2.2s threshold)
      this.scheduleSilenceCheck();
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      const err = event.error;
      this.isStarting = false;

      if (err === "no-speech") {
        // Normal silence timeout in speech recognition. Ignore.
        return;
      }
      if (err === "aborted") {
        // Recognition aborted intentionally or during cycle reset. Ignore.
        return;
      }

      console.warn("Speech recognition event warning:", err);
      this.consecutiveErrors++;

      if (err === "not-allowed" || err === "service-not-allowed") {
        this.autoListenEnabled = false;
        this.stopListening(true);
        this.config.onError?.("Microphone permission required. Tap Mic button to allow access.");
        return;
      }

      if (err === "audio-capture") {
        this.autoListenEnabled = false;
        this.stopListening(true);
        this.config.onError?.("Audio capture error. Please verify your microphone is connected and unmuted.");
        return;
      }

      if (err === "network") {
        if (this.consecutiveErrors >= 3) {
          this.autoListenEnabled = false;
          this.config.onError?.("Speech network timeout. You can enter commands via the chat box (T).");
        }
        return;
      }
    };

    rec.onend = () => {
      this.isListening = false;
      this.isStarting = false;
      this.stopMicEnergyMonitoring();

      // Preserve finalized text from this recognition session
      if (this.activeSessionFinal) {
        this.accumulatedFinal = (this.accumulatedFinal + " " + this.activeSessionFinal)
          .replace(/\s+/g, " ")
          .trim();
        this.activeSessionFinal = "";
      }
      this.currentTurnInterim = "";

      if (!this.isSpeaking && !this.speechPending) {
        this.config.onStateChange?.("idle");
      }

      // Check if user was in the middle of a command (turn in progress with pending silence check)
      const turnInProgress = this.accumulatedFinal.trim().length > 0 && this.silenceTimer !== null;

      // Automatically restart listening continuously ONLY if user activated hands-free mode
      // OR if user was in the middle of a multi-line command and took a breath pause
      if (
        (this.autoListenEnabled || turnInProgress) &&
        !this.isSpeaking &&
        !this.speechPending &&
        Date.now() >= this.ignoreTranscriptsUntil &&
        this.consecutiveErrors < 3
      ) {
        if (this.restartTimer !== null) clearTimeout(this.restartTimer);
        this.restartTimer = window.setTimeout(() => {
          if (
            (this.autoListenEnabled || turnInProgress) &&
            !this.isSpeaking &&
            !this.speechPending &&
            !this.isListening &&
            Date.now() >= this.ignoreTranscriptsUntil
          ) {
            void this.startListening(this.autoListenEnabled, false);
          }
        }, 250);
      }
    };

    return rec;
  }

  /**
   * Smart conversational silence detection:
   * Waits for 2.2s (2200ms) of true silence after the user finishes speaking.
   * If physical mic audio energy shows active voice (> 0.08) or speech events arrived recently,
   * it defers submission so multi-line / multi-sentence commands are never cut off.
   */
  private scheduleSilenceCheck() {
    if (this.silenceTimer !== null) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    const checkAndSubmit = () => {
      const now = Date.now();
      const timeSinceSpeech = now - this.lastSpeechTimestamp;
      const timeSinceEnergy = now - this.lastVoiceEnergyTimestamp;

      // If user vocalized in the last 1800ms or speech event arrived in the last 2000ms, postpone!
      if (timeSinceEnergy < 1800 || timeSinceSpeech < 2000) {
        const remaining = Math.max(
          400,
          this.conversationalSilenceThresholdMs - Math.min(timeSinceSpeech, timeSinceEnergy)
        );
        this.silenceTimer = window.setTimeout(checkAndSubmit, remaining);
        return;
      }

      const candidateQuery = (this.accumulatedFinal + " " + this.activeSessionFinal + " " + this.currentTurnInterim)
        .replace(/\s+/g, " ")
        .trim();

      if (!this.isSpeaking && !this.speechPending && candidateQuery.length >= 2) {
        if (this.isAcousticEcho(candidateQuery)) {
          console.log("[VoiceEngine] Discarded acoustic feedback:", candidateQuery);
          this.accumulatedFinal = "";
          this.activeSessionFinal = "";
          this.currentTurnInterim = "";
          return;
        }

        const submittedQuery = candidateQuery;

        // Reset buffers for next turn
        this.accumulatedFinal = "";
        this.activeSessionFinal = "";
        this.currentTurnInterim = "";

        // Stop current recognition turn to prevent audio spill
        this.stopListening(false);
        this.config.onTranscript?.(submittedQuery, true);
      }
    };

    this.silenceTimer = window.setTimeout(checkAndSubmit, this.conversationalSilenceThresholdMs);
  }

  public setLanguage(langCode: string) {
    this.config.language = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
      if (this.isListening) {
        this.stopListening(false);
        setTimeout(() => {
          if (this.autoListenEnabled) {
            void this.startListening(true);
          }
        }, 150);
      }
    }
  }

  public setVoiceGender(gender: VoiceGender) {
    this.voiceGender = gender;
  }

  public getVoiceGender(): VoiceGender {
    return this.voiceGender;
  }

  public setAutoListen(enabled: boolean) {
    this.autoListenEnabled = enabled;
  }

  public getAutoListen() {
    return this.autoListenEnabled;
  }

  /**
   * Start listening with safety guards against rapid double-starts and browser locks
   */
  public async startListening(enableAuto = false, isUserGesture = false) {
    if (isUserGesture) {
      this.consecutiveErrors = 0;
    }
    if (enableAuto) {
      this.autoListenEnabled = true;
    }

    // Do NOT start listening if AI is currently speaking, pending speech, or inside the acoustic echo decay window
    if (this.isSpeaking || this.speechPending || Date.now() < this.ignoreTranscriptsUntil) {
      return;
    }

    if (this.isListening || this.isStarting) return;

    if (!this.isSpeechRecognitionSupported()) {
      this.config.onError?.("Speech recognition not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    // Request/ensure mic hardware stream on user gesture
    if (isUserGesture || !this.mediaStream) {
      const ok = await this.ensureMicrophoneStream();
      if (!ok && isUserGesture) {
        return;
      }
    }

    // Ensure mic hardware track is unmuted
    this.setMicHardwareMute(false);

    // Reset turn buffers on manual start or gesture
    if (isUserGesture) {
      this.accumulatedFinal = "";
      this.activeSessionFinal = "";
      this.currentTurnInterim = "";
    }

    // Clean up stale recognition instance before starting fresh
    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }

    const rec = this.createRecognitionInstance();
    if (!rec) return;

    this.recognition = rec;
    this.isStarting = true;

    try {
      rec.start();
    } catch (err: any) {
      this.isStarting = false;
      if (err.name !== "InvalidStateError") {
        console.warn("Could not start speech recognition:", err);
      }
    }
  }

  /**
   * Stop listening safely
   */
  public stopListening(disableAuto = false) {
    if (disableAuto) {
      this.autoListenEnabled = false;
      this.accumulatedFinal = "";
      this.activeSessionFinal = "";
      this.currentTurnInterim = "";
    }

    if (this.restartTimer !== null) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (this.silenceTimer !== null) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    this.stopMicEnergyMonitoring();

    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort();
      } catch {}
    }

    this.isListening = false;
    this.isStarting = false;

    if (!this.isSpeaking && !this.speechPending) {
      this.config.onStateChange?.("idle");
    }
  }

  /**
   * Immediately commit and execute whatever multi-line command is currently buffered,
   * without waiting for the 2.2s conversational silence pause.
   */
  public commitCurrentTranscript(): boolean {
    if (this.silenceTimer !== null) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    const candidateQuery = (this.accumulatedFinal + " " + this.activeSessionFinal + " " + this.currentTurnInterim)
      .replace(/\s+/g, " ")
      .trim();

    if (candidateQuery.length >= 2 && !this.isSpeaking && !this.speechPending) {
      if (this.isAcousticEcho(candidateQuery)) {
        this.accumulatedFinal = "";
        this.activeSessionFinal = "";
        this.currentTurnInterim = "";
        return false;
      }

      const submittedQuery = candidateQuery;
      this.accumulatedFinal = "";
      this.activeSessionFinal = "";
      this.currentTurnInterim = "";

      this.stopListening(false);
      this.config.onTranscript?.(submittedQuery, true);
      return true;
    }

    return false;
  }

  /**
   * Toggle listening on user button tap or shortcut key
   */
  public toggleListening(forceAuto?: boolean): boolean {
    if (this.isListening) {
      // If user had spoken words, commit and execute them immediately
      const committed = this.commitCurrentTranscript();
      if (!committed) {
        this.stopListening(true);
      }
      return false;
    } else {
      const auto = forceAuto !== undefined ? forceAuto : this.autoListenEnabled;
      void this.startListening(auto, true);
      return true;
    }
  }

  /**
   * Speak text in fast, snappy JARVIS persona style.
   * Fully integrates the Acoustic Echo Shield:
   * 1. Immediately aborts mic recognition so no audio buffer spill can occur.
   * 2. Mutes physical microphone hardware tracks while speakers play.
   * 3. Remembers spoken phrase to reject any acoustic echo.
   * 4. Enforces a 1200ms acoustic decay window before any mic resumption.
   */
  public speak(text: string, onEnd?: () => void): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }

    // 1. Immediately mark state as speaking & speechPending to block all listeners
    this.isSpeaking = true;
    this.speechPending = true;

    // 2. Clear all scheduled restart & silence timers immediately
    if (this.restartTimer !== null) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.echoGuardTimer !== null) {
      clearTimeout(this.echoGuardTimer);
      this.echoGuardTimer = null;
    }
    if (this.silenceTimer !== null) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    // 3. Clear turn buffers
    this.accumulatedFinal = "";
    this.activeSessionFinal = "";
    this.currentTurnInterim = "";

    // 4. Forcefully mute microphone hardware tracks & stop visualizer monitoring
    this.setMicHardwareMute(true);
    this.stopMicEnergyMonitoring();

    // 5. Forcefully abort any active SpeechRecognition instance
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }
    this.isListening = false;
    this.isStarting = false;
    this.config.onStateChange?.("speaking");

    // Natural human speech preprocessing: strip thought/think tags, emojis, and code blocks
    const cleanSpeech = text
      .replace(/<(?:thought|think)>[\s\S]*?<\/(?:thought|think)>/gi, "")
      .replace(/<speech>([\s\S]*?)<\/speech>/gi, "$1")
      .replace(/N\.E\.X\.U\.S\./gi, "Nexus")
      .replace(/N\.E\.X\.U\.S/gi, "Nexus")
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
      .replace(/https?:\/\/\S+/gi, "link in chat box")
      .replace(/mailto:\S+/gi, "email in chat box")
      .replace(/github\.com\/\S+/gi, "GitHub profile")
      .replace(/```[\s\S]*?```/g, "Code implementation displayed in your chat box.")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*_#>[\]()]/g, " ")
      .replace(/\betc\.\b/gi, "etcetera")
      .replace(/\be\.g\.\b/gi, "for example")
      .replace(/\bi\.e\.\b/gi, "that is")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanSpeech) {
      this.isSpeaking = false;
      this.speechPending = false;
      this.setMicHardwareMute(false);
      this.config.onStateChange?.("idle");
      onEnd?.();
      return;
    }

    // Cache words and text into acoustic echo history
    this.registerSpokenText(cleanSpeech);

    try {
      window.speechSynthesis.cancel();
    } catch {}

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);

    // Select optimal voice considering language and Male/Female gender
    const voiceResult = this.pickBestVoice(this.config.language, this.voiceGender);
    if (voiceResult.voice) {
      utterance.voice = voiceResult.voice;
      utterance.lang = voiceResult.lang;
    } else {
      utterance.lang = this.config.language || "en-US";
    }

    // Motivated, confident delivery with natural human prosody
    if (this.voiceGender === "female") {
      utterance.pitch = 1.02;
      utterance.rate = 1.04;
    } else {
      utterance.pitch = 0.94; // Resonant, confident, motivated delivery
      utterance.rate = 1.03; // Smooth, articulate cadence
    }

    let hasEnded = false;
    const cleanup = () => {
      if (hasEnded) return;
      hasEnded = true;

      if (this.speechWatchdog !== null) {
        clearTimeout(this.speechWatchdog);
        this.speechWatchdog = null;
      }
      if (this.keepAliveTimer !== null) {
        clearInterval(this.keepAliveTimer);
        this.keepAliveTimer = null;
      }

      this.isSpeaking = false;
      this.speechPending = false;
      this.stopEnergySimulation();
      this.config.onStateChange?.("idle");

      // Critical: Windows audio output buffer latency decay window (1200ms)
      this.ignoreTranscriptsUntil = Date.now() + this.echoGuardMs;

      try {
        onEnd?.();
      } catch (err) {
        console.warn("onEnd callback notice:", err);
      }

      // Echo guard delay: wait 1200ms after speech ends for room echo to decay, then unmute mic
      if (this.echoGuardTimer !== null) {
        clearTimeout(this.echoGuardTimer);
      }
      this.echoGuardTimer = window.setTimeout(() => {
        // Unmute microphone hardware tracks
        this.setMicHardwareMute(false);

        // Resume listening ONLY if autoListenEnabled was explicitly activated by user
        if (this.autoListenEnabled && !this.isSpeaking && !this.speechPending && !this.isListening) {
          void this.startListening(true);
        }
      }, this.echoGuardMs);
    };

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.speechPending = false;
      this.config.onStateChange?.("speaking");
      this.startEnergySimulation();

      // Chrome speech synthesis freeze prevention (keep alive ping every 2.5s)
      if (this.keepAliveTimer !== null) clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = window.setInterval(() => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        }
      }, 2500);

      // Watchdog timeout: auto-cleans up if onend fails to fire in Chrome
      const estimatedMs = Math.max(2500, Math.ceil((cleanSpeech.length / 14) * 1000) + 2000);
      if (this.speechWatchdog !== null) clearTimeout(this.speechWatchdog);
      this.speechWatchdog = window.setTimeout(() => {
        if (this.isSpeaking) {
          console.warn("SpeechSynthesis watchdog fired (recovering voice state)");
          cleanup();
        }
      }, estimatedMs);
    };

    utterance.onend = cleanup;
    utterance.onerror = cleanup;

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      cleanup();
    }
  }

  public stopSpeaking() {
    if (this.speechWatchdog !== null) {
      clearTimeout(this.speechWatchdog);
      this.speechWatchdog = null;
    }
    if (this.keepAliveTimer !== null) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    if (this.echoGuardTimer !== null) {
      clearTimeout(this.echoGuardTimer);
      this.echoGuardTimer = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.isSpeaking = false;
    this.speechPending = false;
    this.stopEnergySimulation();
    this.setMicHardwareMute(false);
    this.ignoreTranscriptsUntil = Date.now() + 500;
    if (!this.isListening) {
      this.config.onStateChange?.("idle");
    }
  }

  private pickBestVoice(targetLang: string, gender: VoiceGender): { voice: SpeechSynthesisVoice | null; lang: string } {
    if (!this.voices.length) {
      this.loadVoices();
    }
    if (!this.voices.length) return { voice: null, lang: targetLang };

    const femaleKeywords = [
      "natural",
      "neural",
      "zira",
      "kalpana",
      "samantha",
      "victoria",
      "karen",
      "susan",
      "catherine",
      "marie",
      "heera",
      "google uk english female",
      "female",
    ];
    const maleKeywords = [
      "natural",
      "neural",
      "christopher",
      "guy",
      "ryan",
      "daniel",
      "george",
      "oliver",
      "david",
      "google uk english male",
      "google us english",
      "microsoft mark",
      "male",
    ];

    // 1. Marathi language routing
    if (targetLang.startsWith("mr")) {
      const mrVoices = this.voices.filter(
        (v) => v.name.toLowerCase().includes("marathi") || v.lang.toLowerCase().includes("mr")
      );
      if (mrVoices.length) {
        if (gender === "female") {
          const fem = mrVoices.find((v) => femaleKeywords.some((k) => v.name.toLowerCase().includes(k)));
          if (fem) return { voice: fem, lang: fem.lang };
        } else {
          const mal = mrVoices.find((v) => maleKeywords.some((k) => v.name.toLowerCase().includes(k)));
          if (mal) return { voice: mal, lang: mal.lang };
        }
        return { voice: mrVoices[0], lang: mrVoices[0].lang };
      }

      // Fallback to Hindi Indian voice for Devanagari pronunciation
      const indianVoices = this.voices.filter(
        (v) =>
          v.lang.toLowerCase().includes("hi") ||
          v.name.toLowerCase().includes("hindi") ||
          v.name.toLowerCase().includes("kalpana") ||
          v.name.toLowerCase().includes("hemant") ||
          v.lang.toLowerCase().includes("in")
      );
      if (indianVoices.length) {
        if (gender === "female") {
          const fem = indianVoices.find((v) => femaleKeywords.some((k) => v.name.toLowerCase().includes(k)));
          if (fem) return { voice: fem, lang: fem.lang.startsWith("hi") ? "hi-IN" : fem.lang };
        } else {
          const mal = indianVoices.find((v) => maleKeywords.some((k) => v.name.toLowerCase().includes(k)));
          if (mal) return { voice: mal, lang: mal.lang.startsWith("hi") ? "hi-IN" : mal.lang };
        }
        return {
          voice: indianVoices[0],
          lang: indianVoices[0].lang.startsWith("hi") ? "hi-IN" : indianVoices[0].lang,
        };
      }
    }

    // 2. Filter matching target language
    const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang);
    const hints = langInfo?.voiceHints || [targetLang];

    const langMatchedVoices = this.voices.filter((voice) =>
      hints.some((h) => voice.name.toLowerCase().includes(h.toLowerCase()) || voice.lang.toLowerCase().includes(h.toLowerCase()))
    );

    const candidates = langMatchedVoices.length ? langMatchedVoices : this.voices;

    // Filter by gender preference
    if (gender === "female") {
      const femMatch = candidates.find((v) => femaleKeywords.some((k) => v.name.toLowerCase().includes(k)));
      if (femMatch) return { voice: femMatch, lang: femMatch.lang };
    } else if (gender === "male") {
      const maleMatch = candidates.find((v) => maleKeywords.some((k) => v.name.toLowerCase().includes(k)));
      if (maleMatch) return { voice: maleMatch, lang: maleMatch.lang };
    }

    return { voice: candidates[0] || this.voices[0] || null, lang: targetLang };
  }

  private startEnergySimulation() {
    this.stopEnergySimulation();
    let step = 0;

    this.energyIntervalId = window.setInterval(() => {
      if (!this.isSpeaking) {
        this.stopEnergySimulation();
        return;
      }
      step += 0.25;
      const baseWave = Math.sin(step * 3.7) * 0.3 + Math.sin(step * 7.1) * 0.25;
      const pause = Math.sin(step * 0.8) > 0.85 ? 0.1 : 1.0;
      const energy = Math.max(0.15, Math.min(1.0, (0.55 + baseWave * 0.45) * pause));
      this.config.onAudioEnergy?.(energy);
    }, 35);
  }

  private stopEnergySimulation() {
    if (this.energyIntervalId !== null) {
      clearInterval(this.energyIntervalId);
      this.energyIntervalId = null;
    }
    if (!this.isListening) {
      this.config.onAudioEnergy?.(0);
    }
  }

  public getIsListening() {
    return this.isListening;
  }

  public getIsSpeaking() {
    return this.isSpeaking;
  }

  public dispose() {
    this.stopSpeaking();
    this.stopListening(true);
    this.stopMicEnergyMonitoring();

    if (this.restartTimer !== null) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.echoGuardTimer !== null) {
      clearTimeout(this.echoGuardTimer);
      this.echoGuardTimer = null;
    }
    if (this.silenceTimer !== null) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.micSourceNode) {
      try {
        this.micSourceNode.disconnect();
      } catch {}
      this.micSourceNode = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        void this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }
}
