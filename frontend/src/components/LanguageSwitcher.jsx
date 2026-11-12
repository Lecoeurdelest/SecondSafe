import React, { useState } from 'react';
import { Button, Dropdown } from 'antd';
import { CaretDown } from '@phosphor-icons/react';

const languages = {
  vi: { label: 'Tiếng Việt', flag: '🇻🇳' },
  en: { label: 'English', flag: '🇬🇧' }
};

export default function LanguageSwitcher({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = languages[value] || languages.vi;
  const items = Object.entries(languages).map(([code, language]) => ({
    key: code,
    label: (
      <span className="marketplace-language__option">
        <span aria-hidden="true">{language.flag}</span>
        <span>{language.label}</span>
      </span>
    )
  }));

  return (
    <Dropdown
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      menu={{
        items,
        selectable: true,
        selectedKeys: [value],
        onClick: ({ key }) => {
          onChange(key);
          setOpen(false);
        }
      }}
    >
      <Button type="text" size="small" aria-label="Ngôn ngữ" aria-haspopup="menu" aria-expanded={open}>
        <span aria-hidden="true">{selected.flag}</span>
        <CaretDown aria-hidden="true" />
      </Button>
    </Dropdown>
  );
}
