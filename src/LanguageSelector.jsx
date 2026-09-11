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
      <span style={{ fontSize: '1rem' }}>🌐</span>
      <select 
        value={lang} 
        onChange={handleChange}
        className="dhms-lang-dropdown"
        style={{
          background: '#1e293b',
          color: '#f8fafc',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          padding: '4px 10px',
          fontSize: '0.85rem',
          fontWeight: '600',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
        }}
      >
        {SUPPORTED_LANGUAGES.map(l => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.nativeName} ({l.name})
          </option>
        ))}
      </select>
    </div>
  );
}
