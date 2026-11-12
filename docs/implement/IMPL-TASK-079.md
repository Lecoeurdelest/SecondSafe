---
task: TASK-079
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-079 — Storefront dark theme

## What was built

Customers and visitors can switch the storefront to a dark theme from a small moon/sun button in the top bar, next to the language selector. The first choice follows the browser's `prefers-color-scheme`; after a click the choice is kept in `localStorage` (`secondsafe:theme`). A short inline script in `public/index.html` sets `data-theme` on the root element before the first paint, so a dark visitor does not see a light flash.

`global.css` now holds light values and a `:root[data-theme="dark"]` block of the same custom properties: page and surface colours, the ink and grey scales (the `--gray-*` scale is inverted, which turns both grey backgrounds and grey text), borders, shadows and a lighter brand text colour. New tokens (`--surface-2`, `--surface-3`, `--surface-glass`, `--line`, `--line-strong`, `--text-2`, `--text-3`, `--brand-text`) carry the same values in the light theme that the stylesheets used as literals, within a few levels of difference.

About 36 storefront stylesheets were swept: literal white and near-white backgrounds, dark and grey text and neutral borders became tokens. Pastel status chips and error boxes keep their own colours and, where a rule left their text colour to inheritance, got an explicit one. A few chips whose text a more specific rule would lighten have dark-theme exceptions at the end of `index.css`.

Admin and moderator sessions always get the light theme and no switch (`utils/theme.js`), because their pages use Ant Design and their stylesheets were left untouched. Routes, services, API calls and business rules did not change.

The `mercari-clone` reference has a dark mode toggle; `ReMarket webapp` has none.

## Acceptance criteria

- [ ] `AC-WEB-23-1` — inconclusive without a calibrated evaluator; 4 new theme tests and 3 new App tests pass, and 20 storefront pages with canned data and 42 page scans against a real backend were checked for low text contrast, see `.project/evidence/TASK-079/run-01/manual-review.md` and `.project/evidence/TASK-079/run-02/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-079/run-03/frontend-test.txt` |
| Static analysis | N/A — the production build runs the CRA lint step with `CI=true` |
| Build/typecheck | `.project/evidence/TASK-079/run-03/frontend-build.txt` |
| Behavioral/manual | `.project/evidence/TASK-079/run-03/manual-review.md` and `screenshots/`; the pass after merging the assistant chat is `run-03`, the canned-data pass is in `run-01` (`screenshots/`, `contrast-*.json`), the pass against a real backend in `run-02` (`real-backend-scan.json`) |

## Deviations

None.

## Known gaps

- The check is a scan of computed text colours against the nearest opaque background plus screenshots of 20 pages with canned data; states that were not rendered (open modals, form errors, hover, empty and loading states of every page, pages that need real data such as order detail with a dispute) were not scanned.
- Elements over gradients or images are skipped by the scan, so text on the home hero and over product photos was judged from screenshots only.
- Native controls follow `color-scheme: dark`; their look differs a little between browsers and only Chromium was used.
- White text on the green "Hoàn thành" badge is 2.9:1 in both themes (already so before this task).
- After the conversational assistant (TASK-078) reached `main`, its stylesheet was taken from `main` and its `var(--brand-dark)` text colours became `var(--brand-text)`; the chat page was scanned in dark mode with canned data (`run-03`) but not against a real backend.
- Admin, moderator and dashboard pages have no dark theme by design.
- Run-02 used the real backend and a disposable MongoDB seeded with 80 listings, three orders, a conversation and a report, but seeded data and Chromium only: no real phone, no other browser (Firefox and WebKit are not installed here), no real payment provider.
- The real-backend run found one defect the canned run missed: `MyProducts.css` declares its own `--bg`, `--card` and `--muted` colours, which left a pale panel around dark cards. It now has dark values.
- With real data the admin and moderator pages stayed light as intended, and showed existing low-contrast text in their light theme (sidebar descriptions and section labels at about 2.5:1, Ant Design placeholders and warning tags); they were not part of this task and were left unchanged.

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

TASK-077 recorded dark mode as not implemented; this task adds it for the storefront and leaves the TASK-077 record and evidence unchanged. The light theme keeps its appearance (screenshots of the orders and wallet pages were compared by eye).

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `frontend/src/assets/styles/global.css`, `frontend/src/index.css`, `frontend/public/index.html`
- `frontend/src/App.js`, `frontend/src/App.test.jsx`, `frontend/src/components/ThemeToggle.jsx`, `frontend/src/utils/theme.js`, `frontend/src/utils/theme.test.js`
- Storefront stylesheets under `frontend/src/components/` and `frontend/src/modules/` (colour values only)
