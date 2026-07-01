import React, { createContext, useState, useEffect } from 'react';

interface Translations {
  [key: string]: {
    fr: string;
    en?: string;
    es?: string;
  }
}

interface TranslationContextType {
  translations: Translations;
  lang: string;
  setLang: (lang: string) => void;
}

export const TranslationContext = createContext<TranslationContextType>({
  translations: {},
  lang: 'fr',
  setLang: () => {}
});

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [translations, setTranslations] = useState<Translations>({});
  const [lang, setLang] = useState('fr');

  useEffect(() => {
    // Pour l'instant, pas de traductions
    console.log('Traductions pas encore chargées');
  }, []);

  return (
    <TranslationContext.Provider value={{ translations, lang, setLang }}>
      {children}
    </TranslationContext.Provider>
  );
}
