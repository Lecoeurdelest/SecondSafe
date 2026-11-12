import viVN from 'antd/locale/vi_VN';
import './staffContrast.css';

export const staffLocale = viVN;

const staffTheme = {
  token: {
    colorPrimary: '#111827',
    colorInfo: '#374151',
    colorInfoBg: '#f3f4f6',
    colorInfoBorder: '#d1d5db',
    colorInfoText: '#374151',
    colorBgLayout: '#f9fafb',
    colorError: '#cf1322',
    colorSuccess: '#237804',
    colorTextPlaceholder: 'rgba(0, 0, 0, 0.55)',
    colorTextDescription: 'rgba(0, 0, 0, 0.6)',
    colorTextTertiary: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
  },
  components: {
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none'
    }
  }
};

export default staffTheme;
