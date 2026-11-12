---
task: TASK-080
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-080 — Phosphor icon set

## What was built

Every icon in the web application is now a Phosphor icon, imported by name from `@phosphor-icons/react` so unused icons stay out of the bundle. 95 distinct icons are used in 69 files.

Four kinds of icon were converted:

- Font Awesome: 70 `<i className="fas fa-…">` elements, the `icon` strings of the admin sidebar and four dynamic class expressions became Phosphor components. The spinner is a `CircleNotch` with the global `icon-spin` class, which slows down instead of stopping when the visitor prefers reduced motion.
- Ant Design icons: the 94 imports from `@ant-design/icons` in 26 admin and moderator files became Phosphor imports; filled variants use `weight="fill"`.
- Emoji and symbol glyphs that stood in for icons (cart, chat, payment methods, notification types, transaction types, ratings, arrows, close buttons, dashboard metrics and so on) became components. Category icons share `utils/categoryIcons.jsx`, a slug-to-icon map used by the home page and the listing form instead of the emoji stored with each category.
- Icons that Ant Design draws itself (select and pagination arrows, message, alert and confirm icons, close buttons, password toggle, form tooltip): `frontend/vendor/ant-design-icons` is a local package that replaces `@ant-design/icons` through a `file:` dependency. It exports the 51 icons the installed Ant Design imports, each keeping the `anticon` wrapper that Ant Design's styles expect and rendering a Phosphor glyph. `build.js` generates it and refuses an unknown Phosphor name.

`@fortawesome/fontawesome-free` and the real `@ant-design/icons` and `@ant-design/icons-svg` left the dependency tree. Selectors that styled `i` elements now target `svg`, `global.css` aligns icons with text, and three icons that blended into the background once the emoji were gone (the home search and location icons, the current step of the order timeline in the dark theme) got a visible colour.

`iconPolicy.test.js` fails on any icon package import, Font Awesome class or glyph character in the sources, and `antdIcons.test.jsx` renders the Ant Design components that draw icons and asserts every glyph is Phosphor.

The user's goal also asks to move the code to Ant Design. That half is read as migrating the storefront interface to Ant Design components and is planned as separate tasks (`plan.md` §17); this task is the icon half only.

## Acceptance criteria

- [ ] `AC-WEB-24-1` — inconclusive without a calibrated evaluator; the policy and icon tests pass, the audit finds nothing left, and the staff pages show only Phosphor glyphs; see `.project/evidence/TASK-080/run-01/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-080/run-01/frontend-test.txt` |
| Static analysis | `.project/evidence/TASK-080/run-01/flow-review.md` and `icon-audit.txt` |
| Build/typecheck | `.project/evidence/TASK-080/run-01/frontend-build.txt` and `clean-install.txt` (npm 10 in an empty directory) |
| Behavioral/manual | `.project/evidence/TASK-080/run-01/manual-review.md` and `screenshots/` |

## Deviations

None. The spec leaves out text arrows inside `option` elements because an option cannot hold an icon.

## Known gaps

- Icons in states that were not rendered (open modals, error states, the notification panel, the mobile menu, the support dialog) were not scanned for visibility.
- The local `@ant-design/icons` package covers exactly the icons the installed Ant Design imports. A newer Ant Design that imports another icon fails the build with a missing module until it is added to `build.js`.
- Four arrows in the home page sort options stay as text.
- The backend still stores an emoji with each category; the web application no longer shows it.
- Observed in Chromium only, with canned data for the storefront; no real phone and no other browser.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | No money logic is involved |
| `INV-02` | no | Not involved |
| `INV-03` | no | Not involved |
| `INV-04` | no | Not involved |
| `INV-05` | no | Not involved |
| `INV-06` | no | Not involved |
| `INV-07` | no | Not involved |
| `INV-08` | no | Not involved |

## Compatibility and supersession

TASK-077 allowed Font Awesome as the one added dependency; this task removes it and replaces its icons. Routes, services, API calls and business rules did not change; the favorite button's accessible name lost its heart glyph, and its test follows.

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `frontend/package.json`, `frontend/package-lock.json`, `frontend/vendor/ant-design-icons/`
- `frontend/src` components, modules and stylesheets that held an icon, `frontend/src/index.js`, `frontend/src/assets/styles/global.css`
- `frontend/src/utils/categoryIcons.jsx`, `frontend/src/iconPolicy.test.js`, `frontend/src/antdIcons.test.jsx`, `frontend/src/utils/categoryIcons.test.jsx`, `frontend/src/App.test.jsx`
