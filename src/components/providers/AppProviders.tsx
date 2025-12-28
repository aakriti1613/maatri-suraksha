"use client";

import { PropsWithChildren } from "react";
import { QueryProvider } from "./QueryProvider";
import { LanguageProvider } from "./LanguageProvider";
import { VoiceProvider } from "./VoiceProvider";
import { OfflineProvider } from "./OfflineProvider";
import { AppwriteProvider } from "./AppwriteProvider";

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <QueryProvider>
      <LanguageProvider>
        <VoiceProvider>
          <OfflineProvider>
            <AppwriteProvider>{children}</AppwriteProvider>
          </OfflineProvider>
        </VoiceProvider>
      </LanguageProvider>
    </QueryProvider>
  );
};

