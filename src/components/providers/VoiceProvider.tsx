"use client";

import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { SupportedLanguage } from "@/lib/i18n/dictionary";

type SpeechRecognitionInstance = SpeechRecognition | null;

type VoiceContextValue = {
  isListening: boolean;
  language: SupportedLanguage;
  startListening: (opts: {
    language?: SupportedLanguage;
    onResult: (transcript: string) => void;
  }) => void;
  stopListening: () => void;
  speak: (text: string, lang?: SupportedLanguage) => void;
  cancelSpeak: () => void;
};

const VoiceContext = createContext<VoiceContextValue | undefined>(undefined);

const getBrowserLanguage = (lang: SupportedLanguage) => {
  if (lang === "hi") return "hi-IN";
  return "en-IN";
};

export const VoiceProvider = ({ children }: PropsWithChildren) => {
  const recognitionRef = useRef<SpeechRecognitionInstance>(null);
  const [isListening, setListening] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionCtor =
      (window as typeof window & {
        webkitSpeechRecognition?: typeof window.SpeechRecognition;
      }).SpeechRecognition ||
      (window as typeof window & {
        webkitSpeechRecognition?: typeof window.SpeechRecognition;
      }).webkitSpeechRecognition;

    if (SpeechRecognitionCtor) {
      const recognition = new SpeechRecognitionCtor();
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;
      recognitionRef.current = recognition;
    } else {
      recognitionRef.current = null;
    }
  }, []);

  const startListening = useCallback(
    ({
      language: lang = "en",
      onResult,
    }: {
      language?: SupportedLanguage;
      onResult: (transcript: string) => void;
    }) => {
      const recognition = recognitionRef.current;
      if (!recognition) {
        console.warn("Speech recognition not supported in this browser.");
        return;
      }

      setLanguage(lang);
      recognition.lang = getBrowserLanguage(lang);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0]?.transcript ?? "";
        onResult(transcript);
      };
      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
      };
      recognition.onend = () => {
        setListening(false);
      };
      setListening(true);
      recognition.start();
    },
    [],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const speak = useCallback(
    (text: string, lang: SupportedLanguage = "en") => {
      if (typeof window === "undefined") return;
      const synth = window.speechSynthesis;
      if (!synth) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getBrowserLanguage(lang);
      synth.cancel();
      synth.speak(utterance);
    },
    [],
  );

  const cancelSpeak = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
  }, []);

  const value: VoiceContextValue = {
    isListening,
    language,
    startListening,
    stopListening,
    speak,
    cancelSpeak,
  };

  return (
    <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const ctx = useContext(VoiceContext);
  if (!ctx) {
    throw new Error("useVoice must be used within VoiceProvider");
  }
  return ctx;
};

