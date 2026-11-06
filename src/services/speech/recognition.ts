export type SpeechRecognitionStatus = "idle" | "listening" | "processing" | "success" | "error";

export type SpeechRecognitionErrorType =
  | "not-allowed"
  | "no-speech"
  | "audio-capture"
  | "network"
  | "not-supported"
  | "aborted"
  | "no-match"
  | "unknown";

export interface SpeechRecognitionResultPayload {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
}

export type SpeechRecognitionCallbacks = {
  onStart?: () => void;
  onInterimResult?: (transcript: string) => void;
  onFinalResult?: (transcript: string, confidence?: number) => void;
  onError?: (errorType: SpeechRecognitionErrorType, rawError?: unknown) => void;
  onNoMatch?: () => void;
  onEnd?: () => void;
};

// Browser Web Speech API type shims
export interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onaudiostart: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
  onsoundstart: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
  onsoundend: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
  onaudioend: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: IWindowSpeechRecognition, ev: SpeechRecognitionEventShim) => void) | null;
  onnomatch: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: IWindowSpeechRecognition, ev: SpeechRecognitionErrorEventShim) => void) | null;
  onstart: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
  onend: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
}

export interface SpeechRecognitionErrorEventShim extends Event {
  readonly error: string;
  readonly message?: string;
}

export interface SpeechRecognitionEventShim extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListShim;
}

export interface SpeechRecognitionResultListShim {
  readonly length: number;
  item(index: number): SpeechRecognitionResultShim;
  [index: number]: SpeechRecognitionResultShim;
}

export interface SpeechRecognitionResultShim {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternativeShim;
  [index: number]: SpeechRecognitionAlternativeShim;
}

export interface SpeechRecognitionAlternativeShim {
  readonly transcript: string;
  readonly confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): IWindowSpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): IWindowSpeechRecognition;
    };
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// Sensible timeouts for voice commands
export const MAX_RECOGNITION_DURATION_MS = 10000; // 10 seconds total max duration
export const SILENCE_TIMEOUT_MS = 6000; // 6 seconds before assuming no speech started

export class BrowserSpeechRecognizer {
  private recognition: IWindowSpeechRecognition | null = null;
  private isListening = false;
  private hasFinalResult = false;
  private hasError = false;
  private hasEnded = false;
  private userInitiatedAbort = false;
  private userInitiatedStop = false;
  private lastInterimTranscript = "";
  private callbacks: SpeechRecognitionCallbacks = {};
  private language = "en-IN";
  private sessionCount = 0;
  private currentSessionId = 0;

  private maxDurationTimer: ReturnType<typeof setTimeout> | null = null;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private stopSafetyTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Recognition instances are created lazily or fresh on start()
  }

  private clearSilenceTimer(sessionId?: number) {
    if (sessionId !== undefined && this.currentSessionId !== sessionId) return;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private clearMaxDurationTimer(sessionId?: number) {
    if (sessionId !== undefined && this.currentSessionId !== sessionId) return;
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
  }

  private clearStopSafetyTimer() {
    if (this.stopSafetyTimer) {
      clearTimeout(this.stopSafetyTimer);
      this.stopSafetyTimer = null;
    }
  }

  private clearAllTimers(sessionId?: number) {
    this.clearSilenceTimer(sessionId);
    this.clearMaxDurationTimer(sessionId);
    this.clearStopSafetyTimer();
  }

  private finalizeSession(sessionId: number): void {
    if (this.currentSessionId !== sessionId || this.hasEnded) {
      return;
    }
    this.hasEnded = true;
    this.clearAllTimers(sessionId);

    // If recognition ended without final result, error, or manual abort:
    if (this.isListening && !this.hasFinalResult && !this.hasError && !this.userInitiatedAbort) {
      if (this.lastInterimTranscript) {
        // Promote last interim transcript without fabricating confidence (undefined)
        this.hasFinalResult = true;
        this.callbacks.onFinalResult?.(this.lastInterimTranscript, undefined);
      } else if (!this.userInitiatedStop) {
        // Recognition closed silently without speech and NOT an intentional manual stop
        this.hasError = true;
        this.callbacks.onError?.("no-speech");
      }
    }

    this.isListening = false;
    this.callbacks.onEnd?.();
  }

  private detachInstance(rec: IWindowSpeechRecognition | null) {
    if (!rec) return;
    rec.onstart = null;
    rec.onresult = null;
    rec.onerror = null;
    rec.onnomatch = null;
    rec.onspeechstart = null;
    rec.onspeechend = null;
    rec.onsoundstart = null;
    rec.onsoundend = null;
    rec.onaudiostart = null;
    rec.onaudioend = null;
    rec.onend = null;
  }

  public setLanguage(lang: "en" | "hi" | string) {
    if (lang === "hi") {
      this.language = "hi-IN";
    } else if (lang === "en") {
      this.language = "en-IN";
    } else {
      this.language = lang;
    }
    if (this.recognition) {
      this.recognition.lang = this.language;
    }
  }

  public getLanguage(): string {
    return this.language;
  }

  public start(callbacks: SpeechRecognitionCallbacks): boolean {
    // 1. Cleanly abort and invalidate any previously running session
    if (this.isListening || this.recognition) {
      this.abort();
    }

    const sessionId = ++this.sessionCount;
    this.currentSessionId = sessionId;

    this.clearAllTimers();
    this.callbacks = callbacks;
    this.hasFinalResult = false;
    this.hasError = false;
    this.hasEnded = false;
    this.userInitiatedAbort = false;
    this.userInitiatedStop = false;
    this.lastInterimTranscript = "";
    this.isListening = false;

    if (typeof window === "undefined") {
      callbacks.onError?.("not-supported");
      return false;
    }

    const SpeechRecConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecConstructor) {
      callbacks.onError?.("not-supported");
      return false;
    }

    try {
      const rec = new SpeechRecConstructor();
      this.recognition = rec;
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = this.language;

      rec.onstart = () => {
        if (this.currentSessionId !== sessionId) return;
        this.isListening = true;
        this.hasFinalResult = false;
        this.hasError = false;
        this.userInitiatedAbort = false;
        this.userInitiatedStop = false;
        this.lastInterimTranscript = "";
        this.callbacks.onStart?.();

        // Start silence timer if not speaking within threshold
        this.silenceTimer = setTimeout(() => {
          if (this.currentSessionId !== sessionId) return;
          if (this.isListening && !this.lastInterimTranscript && !this.hasFinalResult) {
            this.hasError = true;
            this.callbacks.onError?.("no-speech");
            this.abort();
          }
        }, SILENCE_TIMEOUT_MS);

        // Start total max recognition duration timer
        this.maxDurationTimer = setTimeout(() => {
          if (this.currentSessionId !== sessionId) return;
          if (this.isListening) {
            if (this.lastInterimTranscript && !this.hasFinalResult) {
              this.hasFinalResult = true;
              // Honest un-fabricated confidence: undefined for promoted interim
              this.callbacks.onFinalResult?.(this.lastInterimTranscript, undefined);
            } else if (!this.hasFinalResult) {
              this.hasError = true;
              this.callbacks.onError?.("no-speech");
            }
            this.stop();
          }
        }, MAX_RECOGNITION_DURATION_MS);
      };

      rec.onspeechstart = () => {
        if (this.currentSessionId !== sessionId) return;
        this.clearSilenceTimer(sessionId);
      };

      rec.onresult = (event: SpeechRecognitionEventShim) => {
        if (this.currentSessionId !== sessionId) return;
        this.clearSilenceTimer(sessionId);

        let interimTranscript = "";
        let finalTranscript = "";
        let finalConfidence: number | undefined;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const transcriptPiece = res[0]?.transcript || "";
          if (res.isFinal) {
            finalTranscript += transcriptPiece;
            finalConfidence = res[0]?.confidence;
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        if (interimTranscript.trim() && !finalTranscript) {
          this.lastInterimTranscript = interimTranscript.trim();
          this.callbacks.onInterimResult?.(this.lastInterimTranscript);
        }

        if (finalTranscript.trim()) {
          // Guard: deliver final result exactly once per session
          if (this.hasFinalResult) return;
          this.hasFinalResult = true;
          this.clearAllTimers(sessionId);
          this.callbacks.onFinalResult?.(finalTranscript.trim(), finalConfidence);
        }
      };

      rec.onnomatch = () => {
        if (this.currentSessionId !== sessionId) return;
        this.clearAllTimers(sessionId);
        this.hasError = true;
        this.callbacks.onNoMatch?.();
        this.callbacks.onError?.("no-match");
      };

      rec.onerror = (event: SpeechRecognitionErrorEventShim) => {
        if (this.currentSessionId !== sessionId) return;
        this.clearAllTimers(sessionId);

        // User-initiated abort should not be reported as a failure
        if (this.userInitiatedAbort || event.error === "aborted") {
          return;
        }

        this.hasError = true;
        let errType: SpeechRecognitionErrorType = "unknown";
        if (event.error === "not-allowed") errType = "not-allowed";
        else if (event.error === "no-speech") errType = "no-speech";
        else if (event.error === "audio-capture") errType = "audio-capture";
        else if (event.error === "network") errType = "network";
        else if (event.error === "no-match") errType = "no-match";

        this.callbacks.onError?.(errType, event);
      };

      rec.onend = () => {
        this.finalizeSession(sessionId);
      };

      rec.start();
      return true;
    } catch (err: unknown) {
      console.warn("Error starting speech recognition session:", err);
      this.clearAllTimers(sessionId);
      this.isListening = false;
      callbacks.onError?.("unknown", err);
      return false;
    }
  }

  public stop() {
    const sessionId = this.currentSessionId;
    if (sessionId === 0 || !this.isListening) {
      this.isListening = false;
      return;
    }

    this.userInitiatedStop = true;
    this.clearSilenceTimer(sessionId);
    this.clearMaxDurationTimer(sessionId);

    const rec = this.recognition;
    if (rec) {
      // Do not set isListening = false before native onend finalizes results.
      // Safety guard: ensure the session cannot remain stuck in listening state
      // if the browser fails to emit onend within 1500ms.
      this.stopSafetyTimer = setTimeout(() => {
        this.finalizeSession(sessionId);
      }, 1500);

      try {
        rec.stop();
      } catch {
        // If native stop throws (e.g. already stopped), finalize immediately
        this.finalizeSession(sessionId);
      }
    } else {
      this.finalizeSession(sessionId);
    }
  }

  public abort() {
    this.userInitiatedAbort = true;
    this.isListening = false;
    this.hasEnded = true;
    const sessionToAbort = this.currentSessionId;
    // 1. Invalidate current session identity BEFORE detaching and calling native abort
    this.currentSessionId = 0;
    this.clearAllTimers(sessionToAbort);
    const rec = this.recognition;
    this.recognition = null;
    if (rec) {
      this.detachInstance(rec);
      try {
        rec.abort();
      } catch {
        // ignore
      }
    }
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }
}
