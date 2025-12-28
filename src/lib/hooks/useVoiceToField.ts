"use client";

import { useCallback } from "react";
import { useVoice } from "@/components/providers/VoiceProvider";
import { SupportedLanguage } from "@/lib/i18n/dictionary";

type Options = {
  language?: SupportedLanguage;
};

export const useVoiceToField = (setValue: (value: string) => void, options?: Options) => {
  const { startListening, stopListening, isListening } = useVoice();

  const handleStart = useCallback(() => {
    startListening({
      language: options?.language ?? "en",
      onResult: (transcript) => {
        setValue(transcript);
      },
    });
  }, [options?.language, setValue, startListening]);

  return {
    isListening,
    start: handleStart,
    stop: stopListening,
  };
};



