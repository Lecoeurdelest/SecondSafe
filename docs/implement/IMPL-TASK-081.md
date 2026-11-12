---
task: TASK-081
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-081 — Ant Design storefront shell

## What was built

The storefront now has one Ant Design theme, and its shell is built from Ant Design components. This is the second slice of the goal to move the code to Ant Design (the first was the Phosphor icon set, TASK-080); pages and page-level components move in later tasks, by area.

`ui/AppProviders.jsx` wraps the app in a `ConfigProvider` and Ant Design's `App` context. `ui/antdTheme.js` carries the brand tokens (primary `#ff3b3b`, radii, DM Sans, surface and text colours for both themes) and picks the light or dark algorithm from the existing theme state, so the TASK-079 switch drives Ant Design too; the locale follows the interface language. Primary buttons keep the brand gradient through one rule in `ui/shell.css`.

The shell pieces:

- Top bar: `Flex`, text `Button`s, the theme switch as a round `Button`, and the language selector as a `Dropdown`.
- Header: `Layout.Header`, two horizontal `Menu`s (main links and account links, with the active page selected and automatic overflow into a "…" item on narrow screens), the "Đăng tin" and "Đăng ký" primary buttons, and "Đăng xuất" and "Đăng nhập" text buttons. Buttons that go to a page use `ui/LinkButton.jsx`, which renders a real anchor with an `href` and navigates through the router unless the click is modified, so keyboard use, middle-click and "open in new tab" keep working.
- Notifications: a `Popover` with a `Badge` for the unread count; `NotificationPanel` is now an Ant Design `List` with `Avatar`, `Badge` dots, `Empty`, a loading state and a "Tải thêm" `Button`, and starts in the loading state so the empty message does not flash.
- Help center: a `Modal` holding a `List` of the three support options.
- Floating chat button: `FloatButton` restyled as one pill; footer: `Layout.Footer`.

About 50 one-line shell rules left `index.css`; the remaining shell styles are in `ui/shell.css` and `NotificationPanel.css` shrank to a handful of rules. Routes, services, API calls and business rules did not change.

Test setup now supplies what Ant Design needs in jsdom (`matchMedia`, `ResizeObserver`, a `getComputedStyle` that survives its selectors), removes the style tags Ant Design injects after each test (they made later tests many times slower) and sets a 30 s test timeout. Two tests cover the help-center dialog and the link buttons; the language-menu test was scoped to the dropdown, because the header menus also have the `menu` role.

## Acceptance criteria

- [ ] `AC-WEB-25-1` — inconclusive without a calibrated evaluator; the App tests pass and the shell was observed in both themes at 390 and 1280 px, see `.project/evidence/TASK-081/run-01/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-081/run-01/frontend-test.txt` |
| Static analysis | N/A — the production build runs the CRA lint step with `CI=true` |
| Build/typecheck | `.project/evidence/TASK-081/run-01/frontend-build.txt` |
| Behavioral/manual | `.project/evidence/TASK-081/run-01/manual-review.md` and `screenshots/` |

## Deviations

None.

## Known gaps

- Only the shell moved. Home, product pages, forms, orders, wallet, chat and the other page areas still use hand-written components and stylesheets and are planned as separate tasks (`plan.md` §17); until they move, two styling systems coexist.
- The test suite is slower: Ant Design's styles make each render heavier in jsdom, so the whole frontend suite takes about 80 s instead of about 20 s.
- The bundle grew because Ant Design components now load on every page, not only in the admin and moderator areas; no size budget exists, and it was not measured against one.
- Observed in Chromium with canned API responses; no real phone and no other browser.

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

The dark theme of TASK-079 and the Phosphor icons of TASK-080 are preserved: the theme switch now also selects Ant Design's dark algorithm, and the shell's icons are Phosphor components. Staff sessions still get the light theme.

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `frontend/src/ui/` (new), `frontend/src/App.js`, `frontend/src/App.test.jsx`, `frontend/src/setupTests.js`, `frontend/src/index.css`
- `frontend/src/components/LanguageSwitcher.jsx`, `ThemeToggle.jsx`, `NotificationPanel.jsx`, `NotificationPanel.css`
