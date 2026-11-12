# @ant-design/icons replacement

Ant Design draws its own controls (select arrows, pagination arrows, message and alert icons, close buttons) with icons imported from `@ant-design/icons`. This package replaces that dependency, through the `overrides` entry in `frontend/package.json`, so those controls use the Phosphor set too.

It exports only the 51 icons that Ant Design imports. Each icon keeps the `anticon` wrapper that Ant Design's styles expect and renders the Phosphor glyph inside it. If a newer Ant Design imports another icon, the build fails with a missing module: add the icon to `MAP` in `build.js` and run `node vendor/ant-design-icons/build.js` from `frontend/`.
