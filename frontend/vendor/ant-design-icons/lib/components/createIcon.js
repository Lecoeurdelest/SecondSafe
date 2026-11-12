'use strict';

Object.defineProperty(exports, '__esModule', { value: true });
var React = require('react');

function createIcon(name, Glyph, weight) {
  var Icon = React.forwardRef(function PhosphorAntIcon(props, ref) {
    var className = props.className, spin = props.spin, rotate = props.rotate, style = props.style;
    var rest = Object.assign({}, props);
    ['className', 'spin', 'rotate', 'style', 'children', 'twoToneColor'].forEach(function (key) { delete rest[key]; });
    var classes = ['anticon', 'anticon-' + name, spin || name === 'loading' ? 'anticon-spin' : '', className].filter(Boolean).join(' ');
    var glyphStyle = rotate ? { transform: 'rotate(' + rotate + 'deg)' } : undefined;
    return React.createElement(
      'span',
      Object.assign({ role: 'img', 'aria-label': name }, rest, { ref: ref, className: classes, style: style }),
      React.createElement(Glyph, { weight: weight, style: glyphStyle, 'aria-hidden': true })
    );
  });
  Icon.displayName = 'PhosphorAntIcon(' + name + ')';
  return Icon;
}

exports.default = createIcon;
