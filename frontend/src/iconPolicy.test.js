const fs = require('fs');
const path = require('path');

const SOURCE_DIR = __dirname;
const GLYPH = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{25A0}-\u{25FF}×]/u;
const EXEMPT_FILES = new Set(['services/language.service.js']);

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(jsx?|css)$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name) ? [full] : [];
  });
}

function withoutComments(text, file) {
  if (file.endsWith('.css')) return text.replace(/\/\*[\s\S]*?\*\//g, '');
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
}

const files = sourceFiles(SOURCE_DIR).map(file => ({ file, name: path.relative(SOURCE_DIR, file).split(path.sep).join('/') }));

test('icons come from Phosphor: no Font Awesome or Ant Design icon imports and no icon classes', () => {
  const offenders = [];
  files.forEach(({ file, name }) => {
    const text = withoutComments(fs.readFileSync(file, 'utf8'), name);
    if (/@fortawesome|@ant-design\/icons/.test(text)) offenders.push(`${name}: icon package import`);
    if (/className=\{?["'`][^"'`]*\bfas?\b ?fa-|["'`]fas fa-|\bfa-(solid|regular|spin)\b/.test(text)) offenders.push(`${name}: Font Awesome class`);
  });
  expect(offenders).toEqual([]);
});

test('no emoji or symbol glyph stands in for an icon in the sources', () => {
  const offenders = [];
  files.forEach(({ file, name }) => {
    if (EXEMPT_FILES.has(name)) return;
    withoutComments(fs.readFileSync(file, 'utf8'), name).split('\n').forEach((line, index) => {
      if (/<option\b/.test(line)) return;
      if (GLYPH.test(line)) offenders.push(`${name}:${index + 1}: ${line.trim().slice(0, 80)}`);
    });
  });
  expect(offenders).toEqual([]);
});
