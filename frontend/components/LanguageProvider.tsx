"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { Language, t } from "@/lib/translations";

interface LanguageContextValue {
  lang: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  toggleLanguage: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("en");

  const toggleLanguage = useCallback(() => {
    setLang((prev) => (prev === "en" ? "es" : "en"));
  }, []);

  const translate = useCallback(
    (key: string) => t(key, lang),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
