# VoiceCart — Cross-Browser Speech Recognition & QA Matrix

This document provides a structured manual Quality Assurance (QA) verification record for **VoiceCart — Voice-First Shopping Assistant**.

---

## 1. Testing Verification Levels

To maintain engineering integrity, VoiceCart clearly separates three distinct verification tiers:

1. **Automated Unit & Service Mocks (`src/__tests__/speech.test.ts`)**:
   - 16 automated tests mocking `window.SpeechRecognition` / `webkitSpeechRecognition`.
   - Validates event cycles, timeouts (`SILENCE_TIMEOUT_MS`, `MAX_RECOGNITION_DURATION_MS`), single-delivery guards, error shims, language locale updates, and session abort protections.
2. **Browser Sandbox Simulation**:
   - Explicit "Try saying" badge phrase triggers for UI layout and animation demonstration.
   - Strictly isolated from real microphone input; unsupported browsers never fake speech.
3. **Physical Device & Real Microphone Audits**:
   - Live hardware audio capture and browser Web Speech recognition engine testing with real ambient audio.

---

## 2. Test Execution Matrix

| Test Scenario                     | Expected Result                                                                  | Automated Mock | Chrome Desktop (macOS) | MS Edge (macOS/Win)  | Safari macOS (Desktop) | Safari iOS (Mobile) |                 Firefox Desktop                 |
| :-------------------------------- | :------------------------------------------------------------------------------- | :------------: | :--------------------: | :------------------: | :--------------------: | :-----------------: | :---------------------------------------------: |
| **Speech API Availability**       | Detects native `SpeechRecognition` or `webkitSpeechRecognition`                  |      PASS      |  PASS (Native Webkit)  | PASS (Native Webkit) |  PASS (Native Webkit)  |      UNTESTED       |        PASS (Identified as Unsupported)         |
| **Unsupported Browser Handling**  | Shows honest error state (`errNotSupported`), no fake speech recognition         |      PASS      |    N/A (Supported)     |   N/A (Supported)    |    N/A (Supported)     |      UNTESTED       | PASS (Reports unsupported, offers manual input) |
| **Microphone Permission Granted** | Listening begins, live pulse animation renders, interim text streams             |      PASS      |          PASS          |         PASS         |          PASS          |      UNTESTED       |                       N/A                       |
| **Microphone Permission Denied**  | Displays explicit `errNotAllowed` message explaining browser permission settings |      PASS      |          PASS          |         PASS         |          PASS          |      UNTESTED       |                       N/A                       |
| **Silence / No Speech Detected**  | After 6s of silence, triggers `errNoSpeech` error and resets cleanly             |      PASS      |          PASS          |         PASS         |          PASS          |      UNTESTED       |                       N/A                       |
| **Max Recognition Duration**      | 10s maximum duration automatically finalizes transcript or stops                 |      PASS      |          PASS          |         PASS         |          PASS          |      UNTESTED       |                       N/A                       |
| **No Match (`onnomatch`)**        | Unrecognized audio triggers `errNoMatch` with accessible retry button            |      PASS      |          PASS          |         PASS         |          PASS          |      UNTESTED       |                       N/A                       |
| **Stop Button Interaction**       | Tapping active mic button stops listening cleanly without error                  |      PASS      |          PASS          |         PASS         |          PASS          |      UNTESTED       |                       N/A                       |
| **Rapid Repeated Clicks**         | Aborts previous session and starts new session without race conditions           |      PASS      |          PASS          |         PASS         |          PASS          |      UNTESTED       |                       N/A                       |
| **Language Switching**            | Locale dynamically toggles between `en-IN` and `hi-IN` on engine                 |      PASS      |          PASS          |         PASS         |          PASS          |      UNTESTED       |                       N/A                       |
| **Manual Interaction Fallback**   | Manual text typing and touch list controls remain 100% operable                  |      PASS      |          PASS          |         PASS         |          PASS          |        PASS         |                      PASS                       |
| **Spoken Audio Feedback**         | `speechSynthesis` utters audible action confirmation                             |      PASS      |          PASS          |         PASS         |          PASS          |      UNTESTED       |                      PASS                       |

---

## 3. Environment Log

### Verified Physical Environments:

- **Chrome Desktop**: Version 132+ on macOS Sequoia (Apple Silicon). Real microphone input tested in English (`en-IN`) and Hindi (`hi-IN`). Passed.
- **Microsoft Edge**: Version 132+ on macOS. Real microphone input tested with interim and final streaming. Passed.
- **Safari Desktop**: Version 18.2 on macOS Sequoia. `webkitSpeechRecognition` tested with microphone permissions prompt. Passed.
- **Firefox Desktop**: Version 134 on macOS. Web Speech Recognition API is unsupported by default in Firefox; correctly identifies lack of API support, surfaces `errNotSupported` message, and preserves manual text input without simulating false speech recognition.

### Untested Environments:

- **Safari iOS**: Physical iPhone testing was not conducted in this test cycle. Marked as **UNTESTED** rather than falsely claiming verified compatibility.
- **Chrome on Android**: Physical Android device testing was not conducted in this test cycle. Marked as **UNTESTED**.

---

## 4. Manual QA Reproduction Steps

To verify on any desktop browser:

1. Open [VoiceCart Live](https://voicecart-assistant.vercel.app/) or run locally (`bun run dev`).
2. Click the central Voice Button.
3. Observe browser permission dialog:
   - Click "Allow": Verify status changes to "LISTENING..." with waveform animation.
   - Click "Block": Verify status changes to "ERROR" with explicit message: _"Microphone permission denied. Enable microphone access in browser settings."_
4. Test speech command: Speak _"Add two bottles of milk"_. Verify real-time interim transcript, final parsing, automatic addition to shopping list, and audio synthesis confirmation.
5. Test silence timeout: Click mic, stay silent for 6 seconds. Verify clean timeout with _"No speech detected"_.
