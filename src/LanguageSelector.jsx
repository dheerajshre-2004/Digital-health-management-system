import React, { useState, useEffect } from 'react';
import { SUPPORTED_LANGUAGES, getCurrentLanguage, setLanguage, subscribeLanguage } from './i18nService';

export default function LanguageSelector({ style = {} }) {
  const [lang, setLang] = useState(getCurrentLanguage());

  useEffect(() => {
    const unsub = subscribeLanguage((newLang) => {
      setLang(newLang);
    });
    return unsub;
  }, []);

  const handleChange = (e) => {
    setLanguage(e.target.value);
  };

  return (
    <div className="dhms-lang-selector-wrapper" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', ...style }}>
      <select 
        value={lang} 
        onChange={handleChange}
        className="dhms-lang-dropdown"
        aria-label="Language Selector"
        style={{
          background: '#f8fafc',
          color: '#1e293b',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          padding: '5px 10px',
          fontSize: '0.82rem',
          fontWeight: '600',
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        {SUPPORTED_LANGUAGES.map(l => (
          <option key={l.code} value={l.code}>
            {l.name} ({l.nativeName})
          </option>
        ))}
      </select>
    </div>
  );
}
