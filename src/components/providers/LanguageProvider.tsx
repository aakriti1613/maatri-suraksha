"use client";

import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { SupportedLanguage, translate } from "@/lib/i18n/dictionary";

type LanguageContextValue = {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = "mh-language";

export const LanguageProvider = ({ children }: PropsWithChildren) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window === "undefined") {
      return (
        (process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE as SupportedLanguage) || "en"
      );
    }
    const persisted = window.localStorage.getItem(
      STORAGE_KEY,
    ) as SupportedLanguage | null;
    if (persisted) return persisted;
    return (
      (process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE as SupportedLanguage) || "en"
    );
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, language);
    }
  }, [language]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
  };

  const value: LanguageContextValue = {
    language,
    setLanguage,
    t: (key, fallback) => translate(language, key, fallback),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
};

