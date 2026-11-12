import { theme as antdTheme } from 'antd';

const FONT_FAMILY = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif";

const SURFACES = {
  light: { layout: '#f5f5f7', container: '#ffffff', elevated: '#ffffff', text: '#1a1a1a', border: '#e5e7eb', muted: 'rgba(0, 0, 0, 0.6)' },
  dark: { layout: '#0f1012', container: '#17181b', elevated: '#1d1f23', text: '#f2f3f5', border: '#2e3035', muted: 'rgba(255, 255, 255, 0.6)' }
};

export function storefrontTheme(mode) {
  const dark = mode === 'dark';
  const surface = SURFACES[dark ? 'dark' : 'light'];
  return {
    algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#ff3b3b',
      colorLink: dark ? '#ff7b7b' : '#c42222',
      colorLinkHover: '#ff3b3b',
      colorInfo: dark ? '#60a5fa' : '#2f6fe4',
      colorError: '#e74c3c',
      colorSuccess: '#38a169',
      colorWarning: '#f39c12',
      colorBgLayout: surface.layout,
      colorBgContainer: surface.container,
      colorBgElevated: surface.elevated,
      colorText: surface.text,
      colorTextDescription: surface.muted,
      colorTextPlaceholder: surface.muted,
      colorBorder: surface.border,
      colorBorderSecondary: surface.border,
      borderRadius: 10,
      borderRadiusLG: 14,
      fontFamily: FONT_FAMILY,
      fontSize: 14
    },
    components: {
      Layout: { headerBg: 'transparent', headerHeight: 'auto', headerPadding: '0', headerColor: surface.text, footerBg: surface.container, footerPadding: '28px 0', bodyBg: surface.layout },
      Menu: { itemBg: 'transparent', horizontalItemSelectedColor: '#ff3b3b', itemSelectedBg: 'rgba(255, 59, 59, 0.08)', itemHoverBg: 'rgba(255, 59, 59, 0.08)', activeBarHeight: 0, itemBorderRadius: 999, horizontalLineHeight: '38px' },
      Button: { primaryShadow: 'none', defaultShadow: 'none', fontWeight: 600 }
    }
  };
}
