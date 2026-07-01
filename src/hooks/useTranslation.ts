import { useContext } from 'react';
import { TranslationContext } from '../contexts/TranslationContext';

export function useTranslation() {
  const { translations, lang, setLang } = useContext(TranslationContext);
  
  // Pour l'instant, ça retourne juste le texte original
  const t = (text: string): string => {
    return text; // Plus tard, on retournera la traduction
  };
  
  return { t, lang, setLang };
}
