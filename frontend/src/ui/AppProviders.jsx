import React from 'react';
import { App as AntApp, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import enUS from 'antd/locale/en_US';
import { storefrontTheme } from './antdTheme';

export default function AppProviders({ themeMode, language, children }) {
  return (
    <ConfigProvider locale={language === 'en' ? enUS : viVN} theme={storefrontTheme(themeMode)}>
      <AntApp component={false}>{children}</AntApp>
    </ConfigProvider>
  );
}
