export type SpeechRecognitionStatus = "idle" | "listening" | "processing" | "success" | "error";

export type SpeechRecognitionErrorType =
  | "not-allowed"
  | "no-speech"
  | "audio-capture"
  | "network"
  | "not-supported"
  | "aborted"
  | "unknown";

export interface SpeechRecognitionResultPayload {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export type SpeechRecognitionCallbacks = {
  onStart?: () => void;
  onInterimResult?: (transcript: string) => void;
  onFinalResult?: (transcript: string, confidence: number) => void;
  onError?: (errorType: SpeechRecognitionErrorType, rawError?: unknown) => void;
  onEnd?: () => void;
};

// Browser Web Speech API type shims
interface IWindowSpeechRecognition extends EventTarget {
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

interface SpeechRecognitionErrorEventShim extends Event {
  readonly error: string;
  readonly message?: string;
}

interface SpeechRecognitionEventShim extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListShim;
}

interface SpeechRecognitionResultListShim {
  readonly length: number;
  item(index: number): SpeechRecognitionResultShim;
  [index: number]: SpeechRecognitionResultShim;
}

interface SpeechRecognitionResultShim {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternativeShim;
  [index: number]: SpeechRecognitionAlternativeShim;
}

interface SpeechRecognitionAlternativeShim {
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

export class BrowserSpeechRecognizer {
  private recognition: IWindowSpeechRecognition | null = null;
  private isListening = false;
  private hasFinalResult = false;
  private callbacks: SpeechRecognitionCallbacks = {};
  private language = "en-IN";
  private fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === "undefined") return;

    const SpeechRecConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecConstructor) return;

    try {
      this.recognition = new SpeechRecConstructor();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.language;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.hasFinalResult = false;
        this.callbacks.onStart?.();
      };

      this.recognition.onresult = (event: SpeechRecognitionEventShim) => {
        let interimTranscript = "";
        let finalTranscript = "";
        let finalConfidence = 0.9;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const transcriptPiece = res[0]?.transcript || "";
          if (res.isFinal) {
            finalTranscript += transcriptPiece;
            finalConfidence = res[0]?.confidence || 0.9;
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        if (interimTranscript.trim() && !finalTranscript) {
          this.callbacks.onInterimResult?.(interimTranscript.trim());
        }

        if (finalTranscript.trim()) {
          this.hasFinalResult = true;
          this.callbacks.onFinalResult?.(finalTranscript.trim(), finalConfidence);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEventShim) => {
        let errType: SpeechRecognitionErrorType = "unknown";
        if (event.error === "not-allowed") errType = "not-allowed";
        else if (event.error === "no-speech") errType = "no-speech";
        else if (event.error === "audio-capture") errType = "audio-capture";
        else if (event.error === "network") errType = "network";
        else if (event.error === "aborted") errType = "aborted";

        this.callbacks.onError?.(errType, event);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.callbacks.onEnd?.();
      };
    } catch (e) {
      console.warn("Failed to instantiate SpeechRecognition:", e);
      this.recognition = null;
    }
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

  public start(callbacks: SpeechRecognitionCallbacks): boolean {
    this.callbacks = callbacks;

    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      callbacks.onError?.("not-supported");
      return false;
    }

    try {
      if (this.isListening) {
        this.recognition.abort();
      }
      this.recognition.lang = this.language;
      this.recognition.start();
      return true;
    } catch (err) {
      console.warn("Error starting speech recognition:", err);
      callbacks.onError?.("unknown", err);
      return false;
    }
  }

  public stop() {
    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore if already stopped
      }
    }
    this.isListening = false;
  }

  public abort() {
    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort();
      } catch (e) {
        // ignore
      }
    }
    this.isListening = false;
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }
}
