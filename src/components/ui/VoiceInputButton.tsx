"use client";

import { useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { useVoice } from "@/components/providers/VoiceProvider";
import { SupportedLanguage } from "@/lib/i18n/dictionary";

type VoiceInputButtonProps = {
  onTranscript: (transcript: string) => void;
  language?: SupportedLanguage;
  label?: string;
};

export const VoiceInputButton = ({
  onTranscript,
  language = "en",
  label,
}: VoiceInputButtonProps) => {
  const { isListening, startListening, stopListening } = useVoice();
  const [manualTrigger, setManualTrigger] = useState(false);

  const handleToggle = () => {
    if (isListening && manualTrigger) {
      stopListening();
      setManualTrigger(false);
      return;
    }
    setManualTrigger(true);
    startListening({
      language,
      onResult: (transcript) => {
        onTranscript(transcript);
      },
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] transition hover:bg-white ${isListening && manualTrigger ? "ring-2 ring-[var(--color-accent-mint)]" : ""}`}
    >
      {isListening && manualTrigger ? (
        <MicOff className="h-4 w-4 text-[var(--color-risk-high)]" />
      ) : (
        <Mic className="h-4 w-4 text-[var(--color-accent-mint)]" />
      )}
      {isListening && manualTrigger ? "Stop" : label ?? "Speak"}
    </button>
  );
};



