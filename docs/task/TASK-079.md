---
id: TASK-079
title: Storefront dark theme
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-079 — Storefront dark theme

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — Storefront dark theme implemented with a header switch, remembered choice and forced light theme for staff; frontend tests and build pass; 20 pages scanned and photographed with canned data and 42 page scans against a real backend with a disposable MongoDB; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-23](../requirements/FR-WEB.md#fr-web-23--web-storefront-dark-theme) |
| Acceptance criteria | `AC-WEB-23-1` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Customers and visitors can switch the storefront to a dark theme that follows their browser preference until they choose, stays readable on every storefront page observed, and never reaches the admin and moderator consoles.

## In scope

- frontend/src/assets/styles/global.css
- frontend/src/index.css
- frontend/public/index.html
- frontend/src/App.js
- frontend/src/App.test.jsx
- frontend/src/components/ThemeToggle.jsx
- frontend/src/utils/theme.js
- frontend/src/utils/theme.test.js
- Storefront module and component stylesheets under frontend/src (colour values only)

## Out of scope

- Admin, moderator and dashboard pages and their stylesheets
- Behaviour, routes, services and API calls
- Server-side storage of the preference

## Inputs and dependencies

- plan.md#16. Dark theme amendment (2026-11-12)
- docs/technical/gitflow.md

## Technical approach

Light and dark values live as custom properties on the root element, switched by a data-theme attribute that an inline script sets before the first paint. Neutral surfaces, text and borders in storefront stylesheets use the tokens; pastel status chips keep their own colours. Staff roles force the light theme, so the Ant Design consoles are untouched. The choice is kept in localStorage.

## Files and symbols

- `frontend/src/utils/theme.js`
- `frontend/src/components/ThemeToggle.jsx`
- `frontend/src/assets/styles/global.css`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-WEB-23-1` (FR-WEB-23) — Visitors and customers can switch the storefront between a light and a dark theme from the header; the first choice follows the browser preference, the choice is remembered, text stays readable on the pages observed, and admin and moderator sessions always use the light theme and are not offered the switch. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-079/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-079.md`.

## Stop conditions

- A required decision is not accepted
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
