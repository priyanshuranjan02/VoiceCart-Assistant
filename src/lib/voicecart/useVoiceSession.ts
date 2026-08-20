import { useCallback, useEffect, useRef, useState } from "react";
import { parseCommand, type ParsedCommand } from "./nlp";
import { VOICE_EXAMPLES } from "./data";
import {
  BrowserSpeechRecognizer,
  isSpeechRecognitionSupported,
  type SpeechRecognitionErrorType,
} from "@/services/speech/recognition";
import { speakConfirmation } from "@/services/speech/synthesis";
import { useVoiceCart } from "./store";

export type VoiceStatus = "idle" | "listening" | "processing" | "success" | "error";

type Options = {
  /** applies the parsed command to app state; return a confirmation string, or null when it failed */
  onCommand: (parsed: ParsedCommand) => string | null;
  enableSpeechFeedback?: boolean;
};

export function useVoiceSession({ onCommand, enableSpeechFeedback = true }: Options) {
  const { lang } = useVoiceCart();
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [parsed, setParsed] = useState<ParsedCommand | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<SpeechRecognitionErrorType | null>(null);

  const recognizerRef = useRef<BrowserSpeechRecognizer | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const after = useCallback((ms: number, fn: () => void) => {
    const timer = setTimeout(fn, ms);
    timers.current.push(timer);
    return timer;
  }, []);

  // Initialize browser speech recognizer
  useEffect(() => {
    recognizerRef.current = new BrowserSpeechRecognizer();
    recognizerRef.current.setLanguage(lang);

    return () => {
      clearTimers();
      recognizerRef.current?.abort();
    };
  }, [clearTimers, lang]);

  // Keep recognizer language in sync with app store
  useEffect(() => {
    if (recognizerRef.current) {
      recognizerRef.current.setLanguage(lang);
    }
  }, [lang]);

  const processTranscript = useCallback(
    (text: string) => {
      setStatus("processing");
      const result = parseCommand(text);
      setParsed(result);

      // Brief micro-delay for smooth UI transition
      after(250, () => {
        const confirmation = onCommand(result);
        if (confirmation) {
          setMessage(confirmation);
          setStatus("success");

          if (enableSpeechFeedback) {
            speakConfirmation(confirmation, lang);
          }

          after(2800, () => {
            setStatus("idle");
          });
        } else {
          setStatus("error");
          after(3500, () => {
            setStatus("idle");
          });
        }
      });
    },
    [after, onCommand, enableSpeechFeedback, lang],
  );

  const reset = useCallback(() => {
    clearTimers();
    recognizerRef.current?.abort();
    setStatus("idle");
    setTranscript("");
    setParsed(null);
    setMessage(null);
    setErrorType(null);
  }, [clearTimers]);

  // Simulated phrase playback (e.g. clicking "Try saying" badge)
  const runSimulatedPhrase = useCallback(
    (phrase?: string) => {
      clearTimers();
      const text =
        phrase ??
        VOICE_EXAMPLES[Math.floor(Math.random() * VOICE_EXAMPLES.length)] ??
        "Add 2 bottles of milk";

      setParsed(null);
      setMessage(null);
      setErrorType(null);
      setTranscript("");
      setStatus("listening");

      const words = text.split(" ");
      words.forEach((_, index) => {
        after(180 + index * 160, () => setTranscript(words.slice(0, index + 1).join(" ")));
      });

      const listenEnd = 180 + words.length * 160 + 200;
      after(listenEnd, () => {
        processTranscript(text);
      });
    },
    [after, clearTimers, processTranscript],
  );

  const start = useCallback(
    (phrase?: string) => {
      if (status === "listening" || status === "processing") {
        reset();
        return;
      }

      // If a specific phrase is passed, simulate it
      if (phrase) {
        runSimulatedPhrase(phrase);
        return;
      }

      // If browser does not support speech recognition, report error state
      if (!isSpeechRecognitionSupported()) {
        setErrorType("not-supported");
        setStatus("error");
        after(4000, () => {
          setStatus("idle");
        });
        return;
      }

      // Real microphone voice recognition
      clearTimers();
      setParsed(null);
      setMessage(null);
      setErrorType(null);
      setTranscript("");

      const started = recognizerRef.current?.start({
        onStart: () => {
          setStatus("listening");
        },
        onInterimResult: (interim) => {
          setTranscript(interim);
        },
        onFinalResult: (finalText) => {
          setTranscript(finalText);
          processTranscript(finalText);
        },
        onError: (err) => {
          setErrorType(err);
          setStatus("error");
          after(3500, () => {
            setStatus("idle");
          });
        },
        onEnd: () => {
          // If stopped without final result or processing, reset
          setStatus((prev) => (prev === "listening" ? "idle" : prev));
        },
      });

      if (!started) {
        setErrorType("not-supported");
        setStatus("error");
        after(3500, () => {
          setStatus("idle");
        });
      }
    },
    [status, reset, runSimulatedPhrase, clearTimers, processTranscript, after],
  );

  return {
    status,
    transcript,
    parsed,
    message,
    errorType,
    start,
    reset,
  };
}
