/**
 * Optional browser SpeechSynthesis feedback service.
 * Provides subtle spoken confirmations without throwing if unsupported.
 */

export function speakConfirmation(text: string, lang: "en" | "hi" = "en"): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // cancel any previous utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 0.85;

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (e) {
    console.debug("Speech synthesis unavailable or blocked:", e);
    return false;
  }
}
