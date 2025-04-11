export interface VoiceRecognitionResult {
  text: string;
  isFinal: boolean;
}

export function startVoiceRecognition(
  onResult: (result: VoiceRecognitionResult) => void,
  onError: (error: Error) => void
): () => void {
  if (!('webkitSpeechRecognition' in window)) {
    onError(new Error('Speech recognition is not supported in this browser.'));
    return () => {};
  }

  // @ts-ignore - webkitSpeechRecognition is not in TypeScript's lib defs
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      onResult({ text: finalTranscript, isFinal: true });
    } else if (interimTranscript) {
      onResult({ text: interimTranscript, isFinal: false });
    }
  };

  recognition.onerror = (event: any) => {
    onError(new Error(`Speech recognition error: ${event.error}`));
  };

  recognition.start();

  // Return stop function
  return () => {
    recognition.stop();
  };
} 