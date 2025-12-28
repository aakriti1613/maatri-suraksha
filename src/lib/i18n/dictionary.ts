export type SupportedLanguage = "en" | "hi";

type Dictionary = Record<string, string | Dictionary>;

const baseDictionary: Record<SupportedLanguage, Dictionary> = {
  en: {
    common: {
      appName: "Maatri Suraksha",
      loading: "Loading...",
      continue: "Continue",
      cancel: "Cancel",
      save: "Save",
      syncNow: "Sync Now",
      offline: "Offline mode",
      online: "Back online",
      voiceInput: "Speak",
      stop: "Stop",
    },
    splash: {
      welcome: "Empowering safe motherhood journeys",
      chooseLanguage: "Choose your language",
      english: "English",
      hindi: "हिन्दी",
      getStarted: "Get Started",
      intro1Title: "Why maternal risk matters",
      intro1Body:
        "Early detection prevents complications and saves mothers and babies.",
      intro2Title: "How to use the app",
      intro2Body:
        "Track visits, record vitals, predict risk, and follow guided care plans.",
      intro3Title: "Privacy and ethics",
      intro3Body:
        "Your data stays secure, with full consent and human oversight.",
    },
  },
  hi: {
    common: {
      appName: "मातृ सुरक्षा",
      loading: "लोड हो रहा है...",
      continue: "आगे बढ़ें",
      cancel: "रद्द करें",
      save: "सहेजें",
      syncNow: "सिंक करें",
      offline: "ऑफ़लाइन मोड",
      online: "फिर से ऑनलाइन",
      voiceInput: "बोलें",
      stop: "रोकें",
    },
    splash: {
      welcome: "सुरक्षित मातृत्व यात्राओं को सशक्त बनाना",
      chooseLanguage: "अपनी भाषा चुनें",
      english: "अंग्रेज़ी",
      hindi: "हिन्दी",
      getStarted: "शुरू करें",
      intro1Title: "मातृ जोखिम क्यों महत्वपूर्ण है",
      intro1Body:
        "समय रहते पहचान से जटिलताएँ रुकती हैं और माँ-बच्चे सुरक्षित रहते हैं।",
      intro2Title: "ऐप कैसे उपयोग करें",
      intro2Body:
        "दौरों को ट्रैक करें, जाँच दर्ज करें, जोखिम जानें और देखभाल योजना अपनाएँ।",
      intro3Title: "गोपनीयता और नैतिकता",
      intro3Body:
        "आपका डेटा सुरक्षित है, पूर्ण सहमति और विशेषज्ञ निगरानी के साथ।",
    },
  },
};

const flatten = (
  dict: Dictionary,
  prefix = "",
  result: Record<string, string> = {},
) => {
  Object.entries(dict).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      result[path] = value;
    } else {
      flatten(value, path, result);
    }
  });
  return result;
};

const flattened = {
  en: flatten(baseDictionary.en),
  hi: flatten(baseDictionary.hi),
};

export const translate = (
  language: SupportedLanguage,
  key: string,
  fallback?: string,
) => {
  return flattened[language][key] ?? flattened.en[key] ?? fallback ?? key;
};

export const dictionary = baseDictionary;

