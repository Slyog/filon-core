/**
 * Voice Input Utility
 * Uses browser-native Web Speech API for speech-to-text conversion
 * Later can be replaced with Whisper or Edge Speech API
 */

export async function startVoiceCapture(): Promise<string | null> {
  if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
    alert("Speech recognition not supported in this browser.");
    return null;
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  return new Promise((resolve) => {
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };
    recognition.onerror = () => resolve(null);
    recognition.onend = () => resolve(null);
    recognition.start();
  });
}

/**
 * Test if voice recognition is available
 */
export function isVoiceRecognitionAvailable(): boolean {
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
}

/**
 * Get available languages for speech recognition
 * TODO: Allow user to select language in settings
 */
export function getSupportedLanguage(): string {
  // For now, use English (can be extended based on user preference)
  return "en-US";
}

