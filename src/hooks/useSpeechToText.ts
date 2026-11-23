import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function resolveSpeechLocale(languageLabel?: string, fallbackUiLang: 'el' | 'en' = 'el'): string {
  const lower = (languageLabel || '').toLowerCase();
  if (lower.includes('ελλ') || lower.includes('greek') || lower === 'el') return 'el-GR';
  if (lower.includes('eng') || lower.includes('αγγλ') || lower === 'en') return 'en-US';
  if (lower.includes('fran') || lower.includes('γαλλ')) return 'fr-FR';
  if (lower.includes('deut') || lower.includes('germ') || lower.includes('γερμ')) return 'de-DE';
  if (lower.includes('espa') || lower.includes('span') || lower.includes('ισπ')) return 'es-ES';
  if (lower.includes('ital') || lower.includes('ιταλ')) return 'it-IT';
  return fallbackUiLang === 'el' ? 'el-GR' : 'en-US';
}

interface UseSpeechToTextOptions {
  locale: string;
  onFinalTranscript: (text: string) => void;
}

export function useSpeechToText({ locale, onFinalTranscript }: UseSpeechToTextOptions) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onFinalRef = useRef(onFinalTranscript);
  onFinalRef.current = onFinalTranscript;

  const isSupported = Boolean(getSpeechRecognitionCtor());

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError('Speech recognition is not supported in this browser (try Chrome or Edge).');
      return;
    }

    setError(null);
    stop();

    try {
      const rec = new Ctor();
      rec.lang = locale;
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (event: SpeechRecognitionEventLike) => {
        let finalChunk = '';
        let interimChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript || '';
          if (result.isFinal) {
            finalChunk += text;
          } else {
            interimChunk += text;
          }
        }
        setInterimText(interimChunk.trim());
        if (finalChunk.trim()) {
          onFinalRef.current(finalChunk.trim());
        }
      };

      rec.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setError(`Speech error: ${event.error}`);
        }
        setIsListening(false);
        setInterimText('');
      };

      rec.onend = () => {
        setIsListening(false);
        setInterimText('');
        recognitionRef.current = null;
      };

      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start microphone.');
      setIsListening(false);
    }
  }, [locale, stop]);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    interimText,
    error,
    toggle,
    stop,
  };
}
