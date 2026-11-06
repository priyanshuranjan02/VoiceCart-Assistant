import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  BrowserSpeechRecognizer,
  isSpeechRecognitionSupported,
  SILENCE_TIMEOUT_MS,
  MAX_RECOGNITION_DURATION_MS,
  type SpeechRecognitionEventShim,
  type SpeechRecognitionErrorEventShim,
  type SpeechRecognitionResultShim,
} from "@/services/speech/recognition";

// Ensure window is defined in Node vitest environment
const globalScope = globalThis as unknown as {
  window: unknown;
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
};

if (typeof globalScope.window === "undefined") {
  globalScope.window = globalScope;
}

class MockSpeechResultItem {
  public isFinal: boolean;
  public length = 1;
  private itemData: { transcript: string; confidence: number };

  constructor(transcript: string, isFinal: boolean, confidence = 0.9) {
    this.isFinal = isFinal;
    this.itemData = { transcript, confidence };
  }

  item(index: number) {
    return index === 0 ? this.itemData : { transcript: "", confidence: 0 };
  }

  get 0() {
    return this.itemData;
  }
}

class MockSpeechEvent {
  public resultIndex = 0;
  public results: SpeechRecognitionResultShim[];

  constructor(results: SpeechRecognitionResultShim[], resultIndex = 0) {
    this.results = results;
    this.resultIndex = resultIndex;
  }
}

class MockSpeechRecognitionInstance {
  public continuous = false;
  public interimResults = false;
  public lang = "en-IN";
  public maxAlternatives = 1;

  public onstart: (() => void) | null = null;
  public onresult: ((event: SpeechRecognitionEventShim) => void) | null = null;
  public onerror: ((event: SpeechRecognitionErrorEventShim) => void) | null = null;
  public onnomatch: (() => void) | null = null;
  public onend: (() => void) | null = null;
  public onspeechstart: (() => void) | null = null;

  public isStarted = false;
  public isStopped = false;
  public isAborted = false;
  public abortCount = 0;

  public start() {
    this.isStarted = true;
    this.isStopped = false;
    this.isAborted = false;
    setTimeout(() => {
      if (this.isStarted && !this.isAborted) {
        this.onstart?.();
      }
    }, 0);
  }

  public stop() {
    this.isStopped = true;
    this.isStarted = false;
    setTimeout(() => {
      this.onend?.();
    }, 0);
  }

  public abort() {
    this.abortCount += 1;
    this.isAborted = true;
    this.isStarted = false;
    setTimeout(() => {
      this.onerror?.({ error: "aborted" } as SpeechRecognitionErrorEventShim);
      this.onend?.();
    }, 0);
  }
}

describe("Speech Recognition Service", () => {
  let originalSpeechRecognition: unknown;
  let originalWebkitSpeechRecognition: unknown;
  let activeMock: MockSpeechRecognitionInstance | null = null;
  let createdMocks: MockSpeechRecognitionInstance[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
    originalSpeechRecognition = globalScope.SpeechRecognition;
    originalWebkitSpeechRecognition = globalScope.webkitSpeechRecognition;
    createdMocks = [];

    function MockSpeechConstructor() {
      activeMock = new MockSpeechRecognitionInstance();
      createdMocks.push(activeMock);
      return activeMock;
    }

    globalScope.SpeechRecognition = MockSpeechConstructor;
    delete globalScope.webkitSpeechRecognition;
  });

  afterEach(() => {
    vi.useRealTimers();
    globalScope.SpeechRecognition = originalSpeechRecognition;
    globalScope.webkitSpeechRecognition = originalWebkitSpeechRecognition;
    activeMock = null;
    createdMocks = [];
  });

  it("detects whether speech recognition is supported in browser", () => {
    expect(isSpeechRecognitionSupported()).toBe(true);

    delete globalScope.SpeechRecognition;
    delete globalScope.webkitSpeechRecognition;
    expect(isSpeechRecognitionSupported()).toBe(false);
  });

  it("handles unsupported browser gracefully on start", () => {
    delete globalScope.SpeechRecognition;
    delete globalScope.webkitSpeechRecognition;

    const recognizer = new BrowserSpeechRecognizer();
    const onError = vi.fn();
    const started = recognizer.start({ onError });

    expect(started).toBe(false);
    expect(onError).toHaveBeenCalledWith("not-supported");
  });

  it("initializes and switches language correctly", () => {
    const recognizer = new BrowserSpeechRecognizer();
    expect(recognizer.getLanguage()).toBe("en-IN");

    recognizer.setLanguage("hi");
    expect(recognizer.getLanguage()).toBe("hi-IN");

    recognizer.setLanguage("en");
    expect(recognizer.getLanguage()).toBe("en-IN");

    recognizer.setLanguage("hi-IN");
    expect(recognizer.getLanguage()).toBe("hi-IN");
  });

  it("starts recognition and triggers onStart callback", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onStart = vi.fn();

    recognizer.start({ onStart });
    expect(activeMock).not.toBeNull();

    await vi.advanceTimersByTimeAsync(1);
    expect(onStart).toHaveBeenCalled();
    expect(recognizer.isCurrentlyListening()).toBe(true);
  });

  it("streams interim transcripts correctly", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onInterim = vi.fn();

    recognizer.start({ onInterimResult: onInterim });
    await vi.advanceTimersByTimeAsync(1);

    const interimEvent = new MockSpeechEvent(
      [
        new MockSpeechResultItem(
          "add 2 bottles",
          false,
          0.8,
        ) as unknown as SpeechRecognitionResultShim,
      ],
      0,
    );

    activeMock?.onresult?.(interimEvent as unknown as SpeechRecognitionEventShim);
    expect(onInterim).toHaveBeenCalledWith("add 2 bottles");
  });

  it("delivers final transcript exactly once even with repeated events", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onFinal = vi.fn();

    recognizer.start({ onFinalResult: onFinal });
    await vi.advanceTimersByTimeAsync(1);

    const finalEvent = new MockSpeechEvent(
      [
        new MockSpeechResultItem(
          "Add 2 bottles of milk",
          true,
          0.95,
        ) as unknown as SpeechRecognitionResultShim,
      ],
      0,
    );

    activeMock?.onresult?.(finalEvent as unknown as SpeechRecognitionEventShim);
    activeMock?.onresult?.(finalEvent as unknown as SpeechRecognitionEventShim);

    expect(onFinal).toHaveBeenCalledTimes(1);
    expect(onFinal).toHaveBeenCalledWith("Add 2 bottles of milk", 0.95);
  });

  it("promotes last interim transcript to final if recognition ends without isFinal", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onFinal = vi.fn();

    recognizer.start({ onFinalResult: onFinal });
    await vi.advanceTimersByTimeAsync(1);

    const interimEvent = new MockSpeechEvent(
      [new MockSpeechResultItem("Add bread", false, 0.8) as unknown as SpeechRecognitionResultShim],
      0,
    );
    activeMock?.onresult?.(interimEvent as unknown as SpeechRecognitionEventShim);

    activeMock?.onend?.();

    expect(onFinal).toHaveBeenCalledWith("Add bread", undefined);
  });

  it("handles permission denial error 'not-allowed'", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onError = vi.fn();

    recognizer.start({ onError });
    await vi.advanceTimersByTimeAsync(1);

    activeMock?.onerror?.({ error: "not-allowed" } as SpeechRecognitionErrorEventShim);
    expect(onError).toHaveBeenCalledWith("not-allowed", expect.anything());
  });

  it("handles audio capture failure error 'audio-capture'", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onError = vi.fn();

    recognizer.start({ onError });
    await vi.advanceTimersByTimeAsync(1);

    activeMock?.onerror?.({ error: "audio-capture" } as SpeechRecognitionErrorEventShim);
    expect(onError).toHaveBeenCalledWith("audio-capture", expect.anything());
  });

  it("handles network error 'network'", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onError = vi.fn();

    recognizer.start({ onError });
    await vi.advanceTimersByTimeAsync(1);

    activeMock?.onerror?.({ error: "network" } as SpeechRecognitionErrorEventShim);
    expect(onError).toHaveBeenCalledWith("network", expect.anything());
  });

  it("handles no match event 'onnomatch'", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onError = vi.fn();
    const onNoMatch = vi.fn();

    recognizer.start({ onError, onNoMatch });
    await vi.advanceTimersByTimeAsync(1);

    activeMock?.onnomatch?.();
    expect(onNoMatch).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith("no-match");
  });

  it("handles user-initiated abort cleanly without reporting unexpected error", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onError = vi.fn();

    recognizer.start({ onError });
    await vi.advanceTimersByTimeAsync(1);

    recognizer.abort();
    await vi.advanceTimersByTimeAsync(1);

    expect(onError).not.toHaveBeenCalled();
    expect(recognizer.isCurrentlyListening()).toBe(false);
  });

  it("triggers silence timeout error when no speech arrives within silence threshold", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onError = vi.fn();

    recognizer.start({ onError });
    await vi.advanceTimersByTimeAsync(1);

    await vi.advanceTimersByTimeAsync(SILENCE_TIMEOUT_MS + 100);

    expect(onError).toHaveBeenCalledWith("no-speech");
  });

  it("cancels silence timeout once speech starts", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onError = vi.fn();

    recognizer.start({ onError });
    await vi.advanceTimersByTimeAsync(1);

    activeMock?.onspeechstart?.();

    await vi.advanceTimersByTimeAsync(SILENCE_TIMEOUT_MS + 500);

    expect(onError).not.toHaveBeenCalledWith("no-speech");
  });

  it("enforces max recognition duration timeout", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onError = vi.fn();

    recognizer.start({ onError });
    await vi.advanceTimersByTimeAsync(1);

    activeMock?.onspeechstart?.();

    await vi.advanceTimersByTimeAsync(MAX_RECOGNITION_DURATION_MS + 100);

    expect(onError).toHaveBeenCalledWith("no-speech");
  });

  it("protects against repeated start calls by aborting prior session", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    recognizer.start({});
    await vi.advanceTimersByTimeAsync(1);

    const firstMock = activeMock;
    expect(firstMock?.isStarted).toBe(true);

    recognizer.start({});
    await vi.advanceTimersByTimeAsync(1);

    expect(firstMock?.abortCount).toBe(1);
    expect(recognizer.isCurrentlyListening()).toBe(true);
  });

  it("ignores a delayed onend from an aborted prior session without affecting a newer session", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onEnd1 = vi.fn();
    const onEnd2 = vi.fn();

    recognizer.start({ onEnd: onEnd1 });
    await vi.advanceTimersByTimeAsync(1);
    const mock1 = createdMocks[0];

    // Start session 2
    recognizer.start({ onEnd: onEnd2 });
    await vi.advanceTimersByTimeAsync(1);
    expect(recognizer.isCurrentlyListening()).toBe(true);

    // Delayed onend from session 1 arrives
    mock1.onend?.();

    // Session 2 is NOT terminated by session 1's delayed onend
    expect(recognizer.isCurrentlyListening()).toBe(true);
    expect(onEnd2).not.toHaveBeenCalled();
  });

  it("ignores a delayed onerror from an aborted prior session without reporting to newer session", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onError1 = vi.fn();
    const onError2 = vi.fn();

    recognizer.start({ onError: onError1 });
    await vi.advanceTimersByTimeAsync(1);
    const mock1 = createdMocks[0];

    // Start session 2
    recognizer.start({ onError: onError2 });
    await vi.advanceTimersByTimeAsync(1);

    // Delayed onerror from session 1 fires
    mock1.onerror?.({ error: "network" } as SpeechRecognitionErrorEventShim);

    // Session 2 did not receive session 1's error
    expect(onError2).not.toHaveBeenCalled();
  });

  it("ignores a delayed onresult from an old session without corrupting newer session", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onFinal1 = vi.fn();
    const onFinal2 = vi.fn();

    recognizer.start({ onFinalResult: onFinal1 });
    await vi.advanceTimersByTimeAsync(1);
    const mock1 = createdMocks[0];

    // Start session 2
    recognizer.start({ onFinalResult: onFinal2 });
    await vi.advanceTimersByTimeAsync(1);

    // Delayed onresult from session 1 fires
    const oldEvent = new MockSpeechEvent(
      [new MockSpeechResultItem("Old speech", true, 0.9) as unknown as SpeechRecognitionResultShim],
      0,
    );
    mock1.onresult?.(oldEvent as unknown as SpeechRecognitionEventShim);

    expect(onFinal2).not.toHaveBeenCalled();
  });

  it("handles rapid start -> abort -> start sequence seamlessly without leaking listeners", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onStart1 = vi.fn();
    const onStart2 = vi.fn();

    recognizer.start({ onStart: onStart1 });
    recognizer.abort();
    recognizer.start({ onStart: onStart2 });
    await vi.advanceTimersByTimeAsync(1);

    expect(onStart2).toHaveBeenCalled();
    expect(recognizer.isCurrentlyListening()).toBe(true);
  });

  it("handles native InvalidStateError during start gracefully without unhandled exceptions", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onError = vi.fn();

    // Temporarily make SpeechRecognition.start throw InvalidStateError
    const originalConstructor = globalScope.SpeechRecognition;
    function ThrowingConstructor(this: MockSpeechRecognitionInstance) {
      activeMock = new MockSpeechRecognitionInstance();
      activeMock.start = () => {
        const error = new Error("recognition has already started");
        error.name = "InvalidStateError";
        throw error;
      };
      return activeMock;
    }
    globalScope.SpeechRecognition = ThrowingConstructor;

    const started = recognizer.start({ onError });
    expect(started).toBe(false);
    expect(onError).toHaveBeenCalledWith("unknown", expect.anything());
    expect(recognizer.isCurrentlyListening()).toBe(false);

    globalScope.SpeechRecognition = originalConstructor;
  });

  it("ensures old session timers cannot affect a newer session", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onError1 = vi.fn();
    const onError2 = vi.fn();

    recognizer.start({ onError: onError1 });
    await vi.advanceTimersByTimeAsync(1);

    // Start session 2 before session 1 silence timer expires
    recognizer.start({ onError: onError2 });
    await vi.advanceTimersByTimeAsync(1);

    // Speak in session 2 to cancel silence timer
    activeMock?.onspeechstart?.();

    // Advance past silence timer threshold
    await vi.advanceTimersByTimeAsync(SILENCE_TIMEOUT_MS + 200);

    // Neither session 1 nor session 2 should trigger no-speech
    expect(onError2).not.toHaveBeenCalledWith("no-speech");
  });

  it("promotes interim-only transcript upon manual stop() without generating no-speech error", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onFinal = vi.fn();
    const onError = vi.fn();
    const onEnd = vi.fn();

    recognizer.start({ onFinalResult: onFinal, onError, onEnd });
    await vi.advanceTimersByTimeAsync(1);

    const interimEvent = new MockSpeechEvent(
      [
        new MockSpeechResultItem(
          "Find butter",
          false,
          0.75,
        ) as unknown as SpeechRecognitionResultShim,
      ],
      0,
    );
    activeMock?.onresult?.(interimEvent as unknown as SpeechRecognitionEventShim);

    // Manual stop called by user
    recognizer.stop();

    // Native stop triggers asynchronous onend
    await vi.advanceTimersByTimeAsync(10);

    expect(onFinal).toHaveBeenCalledWith("Find butter", undefined);
    expect(onError).not.toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(recognizer.isCurrentlyListening()).toBe(false);
  });

  it("preserves final transcript upon manual stop() and does not re-emit duplicate results", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onFinal = vi.fn();
    const onError = vi.fn();
    const onEnd = vi.fn();

    recognizer.start({ onFinalResult: onFinal, onError, onEnd });
    await vi.advanceTimersByTimeAsync(1);

    const finalEvent = new MockSpeechEvent(
      [
        new MockSpeechResultItem(
          "Add 1 milk",
          true,
          0.98,
        ) as unknown as SpeechRecognitionResultShim,
      ],
      0,
    );
    activeMock?.onresult?.(finalEvent as unknown as SpeechRecognitionEventShim);
    expect(onFinal).toHaveBeenCalledTimes(1);
    expect(onFinal).toHaveBeenCalledWith("Add 1 milk", 0.98);

    // User stops after final result
    recognizer.stop();
    await vi.advanceTimersByTimeAsync(10);

    expect(onFinal).toHaveBeenCalledTimes(1); // Not duplicated
    expect(onError).not.toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(recognizer.isCurrentlyListening()).toBe(false);
  });

  it("does not generate a no-speech error for an intentional manual stop() without speech", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onFinal = vi.fn();
    const onError = vi.fn();
    const onEnd = vi.fn();

    recognizer.start({ onFinalResult: onFinal, onError, onEnd });
    await vi.advanceTimersByTimeAsync(1);

    // Stop before any speech was detected
    recognizer.stop();
    await vi.advanceTimersByTimeAsync(10);

    expect(onError).not.toHaveBeenCalledWith("no-speech");
    expect(onFinal).not.toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(recognizer.isCurrentlyListening()).toBe(false);
  });

  it("drops all delayed callbacks from an aborted session after abort() is called", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onFinal = vi.fn();
    const onError = vi.fn();
    const onEnd = vi.fn();

    recognizer.start({ onFinalResult: onFinal, onError, onEnd });
    await vi.advanceTimersByTimeAsync(1);
    const mockInstance = activeMock;

    recognizer.abort();

    // Delayed callbacks fired on mock after abort
    mockInstance?.onresult?.(
      new MockSpeechEvent([
        new MockSpeechResultItem("Late text", true, 0.9) as unknown as SpeechRecognitionResultShim,
      ]) as unknown as SpeechRecognitionEventShim,
    );
    mockInstance?.onerror?.({ error: "no-speech" } as SpeechRecognitionErrorEventShim);
    mockInstance?.onend?.();

    expect(onFinal).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
    expect(recognizer.isCurrentlyListening()).toBe(false);
  });

  it("handles rapid abort followed by a new start and preserves new session completion behavior", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onFinal1 = vi.fn();
    const onFinal2 = vi.fn();
    const onEnd2 = vi.fn();

    recognizer.start({ onFinalResult: onFinal1 });
    await vi.advanceTimersByTimeAsync(1);

    recognizer.abort();

    // Start session 2 immediately
    recognizer.start({ onFinalResult: onFinal2, onEnd: onEnd2 });
    await vi.advanceTimersByTimeAsync(1);

    const eventSession2 = new MockSpeechEvent(
      [
        new MockSpeechResultItem(
          "Session 2 success",
          true,
          0.95,
        ) as unknown as SpeechRecognitionResultShim,
      ],
      0,
    );
    activeMock?.onresult?.(eventSession2 as unknown as SpeechRecognitionEventShim);
    activeMock?.onend?.();
    await vi.advanceTimersByTimeAsync(10);

    expect(onFinal1).not.toHaveBeenCalled();
    expect(onFinal2).toHaveBeenCalledWith("Session 2 success", 0.95);
    expect(onEnd2).toHaveBeenCalled();
  });

  it("invokes onEnd at most once when stop safety timer fires followed by delayed native onend", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onEnd = vi.fn();

    recognizer.start({ onEnd });
    await vi.advanceTimersByTimeAsync(1);

    const mock = activeMock;
    // Suppress mock's immediate onend scheduling to simulate a hanging browser engine
    if (mock) {
      mock.stop = vi.fn();
    }

    recognizer.stop();

    // Advance to trigger the 1500ms safety timer
    await vi.advanceTimersByTimeAsync(1600);
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(recognizer.isCurrentlyListening()).toBe(false);

    // Later, delayed native onend arrives from the browser
    mock?.onend?.();
    await vi.advanceTimersByTimeAsync(10);

    // Guaranteed exactly-once execution: still only 1 call
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("invokes onEnd exactly once when native stop throws an exception", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onEnd = vi.fn();

    recognizer.start({ onEnd });
    await vi.advanceTimersByTimeAsync(1);

    const mock = activeMock;
    if (mock) {
      mock.stop = () => {
        throw new Error("InvalidStateError: already stopped");
      };
    }

    recognizer.stop();
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(recognizer.isCurrentlyListening()).toBe(false);

    // If native onend subsequently fires, it must be ignored
    mock?.onend?.();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("resets internal listening state immediately when abort is called", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    recognizer.start({});
    await vi.advanceTimersByTimeAsync(1);

    expect(recognizer.isCurrentlyListening()).toBe(true);

    recognizer.abort();
    expect(recognizer.isCurrentlyListening()).toBe(false);
  });

  it("ensures an aborted session cannot deliver delayed callbacks or affect subsequent sessions", async () => {
    const recognizer = new BrowserSpeechRecognizer();
    const onFinal1 = vi.fn();
    const onEnd1 = vi.fn();
    const onFinal2 = vi.fn();
    const onEnd2 = vi.fn();

    recognizer.start({ onFinalResult: onFinal1, onEnd: onEnd1 });
    await vi.advanceTimersByTimeAsync(1);
    const mock1 = activeMock;

    recognizer.abort();

    // Start session 2
    recognizer.start({ onFinalResult: onFinal2, onEnd: onEnd2 });
    await vi.advanceTimersByTimeAsync(1);
    const mock2 = activeMock;

    // Delayed callbacks from session 1 arrive while session 2 is running
    mock1?.onresult?.(
      new MockSpeechEvent([
        new MockSpeechResultItem(
          "Session 1 ghost",
          true,
          0.9,
        ) as unknown as SpeechRecognitionResultShim,
      ]) as unknown as SpeechRecognitionEventShim,
    );
    mock1?.onend?.();

    expect(onFinal1).not.toHaveBeenCalled();
    expect(onEnd1).not.toHaveBeenCalled();

    // Session 2 delivers its own results and finishes cleanly
    mock2?.onresult?.(
      new MockSpeechEvent([
        new MockSpeechResultItem(
          "Session 2 valid",
          true,
          0.99,
        ) as unknown as SpeechRecognitionResultShim,
      ]) as unknown as SpeechRecognitionEventShim,
    );
    mock2?.onend?.();
    await vi.advanceTimersByTimeAsync(10);

    expect(onFinal2).toHaveBeenCalledWith("Session 2 valid", 0.99);
    expect(onEnd2).toHaveBeenCalledTimes(1);
  });
});
