import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

export function LanguageSwitcher() {
  const { lang, setLang } = useTranslation();

  return (
    <select 
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      style={{
        padding: '6px 12px',
        borderRadius: '6px',
        border: '1px solid #e1e4e8',
        backgroundColor: 'white',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        outline: 'none',
        marginRight: '15px'
      }}
    >
      <option value="fr">🇫🇷 Français</option>
      <option value="en">🇬🇧 English</option>
      <option value="es">🇪🇸 Español</option>
    </select>
  );
}
