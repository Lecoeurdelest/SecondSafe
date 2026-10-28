import React, { useEffect, useRef, useState } from 'react';

const languages = {
  vi: { label: 'Tiếng Việt', flag: '🇻🇳' },
  en: { label: 'English', flag: '🇬🇧' }
};

export default function LanguageSwitcher({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const closeMenu = event => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  const selected = languages[value] || languages.vi;

  function choose(language) {
    onChange(language);
    setOpen(false);
  }

  return (
    <div className="marketplace-language" ref={rootRef}>
      <button
        type="button"
        className="marketplace-language__button"
        aria-label="Ngôn ngữ"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
      >
        <span className="marketplace-language__flag" aria-hidden="true">{selected.flag}</span>
        <svg className="marketplace-language__chevron" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
      </button>
      {open && (
        <div className="marketplace-language__menu" role="menu">
          {Object.entries(languages).map(([code, language]) => (
            <button
              key={code}
              type="button"
              role="menuitem"
              className={code === value ? 'is-selected' : ''}
              onClick={() => choose(code)}
            >
              <span aria-hidden="true">{language.flag}</span>
              <span>{language.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
