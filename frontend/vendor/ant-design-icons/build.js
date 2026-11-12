const fs = require('fs');
const path = require('path');

const MAP = {
  CloseOutlined: ['close', 'X'],
  LoadingOutlined: ['loading', 'CircleNotch'],
  CloseCircleFilled: ['close-circle', 'XCircle', 'fill'],
  RightOutlined: ['right', 'CaretRight'],
  ExclamationCircleFilled: ['exclamation-circle', 'WarningCircle', 'fill'],
  LeftOutlined: ['left', 'CaretLeft'],
  CheckCircleFilled: ['check-circle', 'CheckCircle', 'fill'],
  DownOutlined: ['down', 'CaretDown'],
  EllipsisOutlined: ['ellipsis', 'DotsThree', 'bold'],
  SearchOutlined: ['search', 'MagnifyingGlass'],
  InfoCircleFilled: ['info-circle', 'Info', 'fill'],
  CheckOutlined: ['check', 'Check'],
  FileOutlined: ['file', 'File'],
  VerticalAlignTopOutlined: ['vertical-align-top', 'ArrowLineUp'],
  UpOutlined: ['up', 'CaretUp'],
  PlusOutlined: ['plus', 'Plus'],
  FileTextOutlined: ['file-text', 'FileText'],
  EyeOutlined: ['eye', 'Eye'],
  DeleteOutlined: ['delete', 'Trash'],
  ZoomOutOutlined: ['zoom-out', 'MagnifyingGlassMinus'],
  ZoomInOutlined: ['zoom-in', 'MagnifyingGlassPlus'],
  WarningFilled: ['warning', 'Warning', 'fill'],
  SwapRightOutlined: ['swap-right', 'ArrowRight'],
  SwapOutlined: ['swap', 'ArrowsLeftRight'],
  StarFilled: ['star', 'Star', 'fill'],
  RotateRightOutlined: ['rotate-right', 'ArrowClockwise'],
  RotateLeftOutlined: ['rotate-left', 'ArrowCounterClockwise'],
  ReloadOutlined: ['reload', 'ArrowClockwise'],
  QuestionCircleOutlined: ['question-circle', 'Question'],
  PlusSquareOutlined: ['plus-square', 'PlusSquare'],
  PictureOutlined: ['picture', 'Image'],
  PaperClipOutlined: ['paper-clip', 'Paperclip'],
  MinusSquareOutlined: ['minus-square', 'MinusSquare'],
  MinusOutlined: ['minus', 'Minus'],
  HolderOutlined: ['holder', 'DotsSixVertical'],
  FolderOutlined: ['folder', 'Folder'],
  FolderOpenOutlined: ['folder-open', 'FolderOpen'],
  FilterFilled: ['filter', 'Funnel', 'fill'],
  EyeInvisibleOutlined: ['eye-invisible', 'EyeSlash'],
  EnterOutlined: ['enter', 'ArrowElbowDownLeft'],
  EditOutlined: ['edit', 'PencilSimple'],
  DownloadOutlined: ['download', 'DownloadSimple'],
  DoubleRightOutlined: ['double-right', 'CaretDoubleRight'],
  DoubleLeftOutlined: ['double-left', 'CaretDoubleLeft'],
  CopyOutlined: ['copy', 'Copy'],
  ClockCircleOutlined: ['clock-circle', 'Clock'],
  CaretUpOutlined: ['caret-up', 'CaretUp', 'fill'],
  CaretDownOutlined: ['caret-down', 'CaretDown', 'fill'],
  CaretDownFilled: ['caret-down', 'CaretDown', 'fill'],
  CalendarOutlined: ['calendar', 'Calendar'],
  BarsOutlined: ['bars', 'List']
};

const root = __dirname;
const csr = path.join(require.resolve('@phosphor-icons/react/package.json'), '..', 'dist', 'csr');
const missing = Object.values(MAP).map(([, glyph]) => glyph).filter(glyph => !fs.existsSync(path.join(csr, `${glyph}.d.ts`)));
if (missing.length) throw new Error(`Unknown Phosphor icons: ${missing.join(', ')}`);

const names = Object.keys(MAP).sort();
const write = (file, text) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), text);
};

write('package.json', JSON.stringify({
  name: '@ant-design/icons',
  version: '6.3.4',
  description: 'Local replacement for @ant-design/icons that renders the Phosphor icons for the icons Ant Design itself uses',
  private: true,
  main: './lib/index.js',
  module: './es/index.js',
  sideEffects: false,
  peerDependencies: { react: '>=16.0.0', 'react-dom': '>=16.0.0' }
}, null, 2) + '\n');

write('es/components/Context.js', "import * as React from 'react';\n\nexport default React.createContext({});\n");
write('lib/components/Context.js', "'use strict';\n\nObject.defineProperty(exports, '__esModule', { value: true });\nvar React = require('react');\n\nexports.default = React.createContext({});\n");

write('es/components/createIcon.js', `import * as React from 'react';

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
`);
write('lib/components/createIcon.js', `'use strict';

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
`);

names.forEach(name => {
  const [antName, glyph, weight] = MAP[name];
  const w = weight ? `'${weight}'` : 'undefined';
  write(`es/icons/${name}.js`, `import { ${glyph} } from '@phosphor-icons/react';\nimport createIcon from '../components/createIcon';\n\nexport default createIcon('${antName}', ${glyph}, ${w});\n`);
  write(`${name}.js`, `'use strict';\n\nmodule.exports = require('./lib/icons/${name}');\n`);
  write(`lib/icons/${name}.js`, `'use strict';\n\nObject.defineProperty(exports, '__esModule', { value: true });\nvar phosphor = require('@phosphor-icons/react');\nvar createIcon = require('../components/createIcon').default;\n\nexports.default = createIcon('${antName}', phosphor.${glyph}, ${w});\n`);
});

write('es/index.js', names.map(name => `export { default as ${name} } from './icons/${name}';`).join('\n') + "\nexport { default as Context } from './components/Context';\n");
write('lib/index.js', "'use strict';\n\nObject.defineProperty(exports, '__esModule', { value: true });\n" + names.map(name => `Object.defineProperty(exports, '${name}', { enumerable: true, get: function () { return require('./icons/${name}').default; } });`).join('\n') + "\nObject.defineProperty(exports, 'Context', { enumerable: true, get: function () { return require('./components/Context').default; } });\n");

write('README.md', `# @ant-design/icons replacement

Ant Design draws its own controls (select arrows, pagination arrows, message and alert icons, close buttons) with icons imported from \`@ant-design/icons\`. This package replaces that dependency, through the \`overrides\` entry in \`frontend/package.json\`, so those controls use the Phosphor set too.

It exports only the ${names.length} icons that Ant Design imports. Each icon keeps the \`anticon\` wrapper that Ant Design's styles expect and renders the Phosphor glyph inside it. If a newer Ant Design imports another icon, the build fails with a missing module: add the icon to \`MAP\` in \`build.js\` and run \`node vendor/ant-design-icons/build.js\` from \`frontend/\`.
`);
console.log(`generated ${names.length} icons`);
