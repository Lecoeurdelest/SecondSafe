---
task: TASK-077
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-077 — Web marketplace visual restyle

## What was built

The web client has one visual language. Design tokens in `frontend/src/assets/styles/global.css` define a red-to-orange brand gradient, white card surfaces on a light grey page, larger corner radii, softer shadows and the DM Sans typeface. The saturated blues of the old theme were converted to the brand hue across the module stylesheets, and the old `--primary-*` variables were renamed `--brand*`.

Buyer pages changed most: a sticky header with pill links and a gradient call-to-action, a gradient hero with a floating search card on the home page, category chips that scroll sideways, product cards with a 4:3 image and a lifting hover, and the login and register cards. The footer sits at the bottom of short pages.

The admin and moderator consoles use a neutral palette. Both shells are wrapped in one Ant Design theme (`frontend/src/modules/staffTheme.js`) with a near-black primary colour, and the storefront header, footer and chat button are hidden while either shell is mounted. Routes, services, API calls and business rules were not touched.

The two reference projects (`itsnotvii/mercari-clone`, `ReMarket-SE2/webapp`) have no licence file, so they were used as visual references only. No code was copied.

## Acceptance criteria

- [ ] `AC-NFR-USA-02-1` — inconclusive: home, login, product detail and five logged-in buyer pages were observed at widths from 360 to 1920 px without horizontal overflow; see `.project/evidence/TASK-077/run-02/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-077/run-02/frontend-test.txt` — 9 suites, 58 tests pass |
| Static analysis | N/A — no logic changed; the production build runs the CRA lint step |
| Build/typecheck | `.project/evidence/TASK-077/run-02/frontend-build.txt` — compiled successfully |
| Behavioral/manual | `.project/evidence/TASK-077/run-02/manual-review.md` and `screenshots/` (`run-01` is the earlier pass) |

## Deviations

The task has no dependencies on other tasks because it changes presentation only. The `TASK-057` home page and the other web tasks remain the owners of behaviour on those pages.

## Known gaps

- Observed only in Chromium against canned API responses; no real phone, no other browser (`NFR-COMP-01` is not evaluated here).
- The chat and support pages fell back to the error boundary under the canned API responses and were not evaluated; other pages not listed in `manual-review.md` were converted by a mechanical colour rule and not each inspected.
- The buyer navigation has about fourteen links for a signed-in user and wraps onto two rows at 1280 px, as before; rebuilding it needs a markup change that is outside this task.
- Status chips that were blue "info" colours in buyer modules are now brand-coloured and can read like the error colour; the shared `--info` colour was kept blue.
- Dark mode is not implemented.
- The dashboards under `frontend/src/modules/dashboard/` and the legacy `Footer.jsx` were not redesigned.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | No money logic is involved |
