import * as React from 'react';

export default function createIcon(name, Glyph, weight) {
  const Icon = React.forwardRef(function PhosphorAntIcon(props, ref) {
    const { className, spin, rotate, style, children, twoToneColor, ...rest } = props;
    const classes = ['anticon', 'anticon-' + name, spin || name === 'loading' ? 'anticon-spin' : '', className].filter(Boolean).join(' ');
    const glyphStyle = rotate ? { transform: 'rotate(' + rotate + 'deg)' } : undefined;
    return React.createElement(
      'span',
      { role: 'img', 'aria-label': name, ...rest, ref, className: classes, style },
      React.createElement(Glyph, { weight, style: glyphStyle, 'aria-hidden': true })
    );
  });
  Icon.displayName = 'PhosphorAntIcon(' + name + ')';
  return Icon;
}
