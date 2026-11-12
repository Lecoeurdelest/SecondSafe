---
id: TASK-081
title: Ant Design storefront shell
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-081 — Ant Design storefront shell

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — The storefront shell is rebuilt on Ant Design with one theme that follows the light or dark choice and the language; App tests pass and the shell was observed in both themes at 390 and 1280 px; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-25](../requirements/FR-WEB.md#fr-web-25--web-storefront-on-ant-design) |
| Acceptance criteria | `AC-WEB-25-1` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Give the storefront one Ant Design theme and rebuild its shell (top bar, header, navigation, notifications, support dialog, floating chat and footer) from Ant Design components, so later tasks can move each page area over without redoing the base.

## In scope

- frontend/src/App.js
- frontend/src/App.test.jsx
- frontend/src/setupTests.js
- frontend/src/index.css
- frontend/src/ui
- frontend/src/components/LanguageSwitcher.jsx
- frontend/src/components/ThemeToggle.jsx
- frontend/src/components/NotificationPanel.jsx
- frontend/src/components/NotificationPanel.css

## Out of scope

- Pages and page-level components (later tasks, by area)
- Admin, moderator and dashboard pages, which already use Ant Design
- Behaviour, routes, services and API calls

## Inputs and dependencies

- plan.md#17. Icon set and component library amendment (2026-11-12)
- docs/technical/gitflow.md

## Technical approach

One ConfigProvider wraps the app with the brand tokens, the light or dark algorithm chosen by the existing theme state and the Vietnamese or English locale, plus Ant Design's App context. The shell uses Layout, Menu, Button, Badge, Popover, Dropdown, Modal, List, FloatButton and Flex; links that look like buttons go through a small LinkButton that keeps a real anchor and navigates with the router. The notification panel becomes an Ant Design list inside a popover. Test setup gains the browser stubs Ant Design needs and removes the style tags it injects after each test.

## Files and symbols

- `frontend/src/ui/AppProviders.jsx`
- `frontend/src/ui/antdTheme.js`
- `frontend/src/ui/LinkButton.jsx`
- `frontend/src/ui/shell.css`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-WEB-25-1` (FR-WEB-25) — The storefront shell (announcement bar, header, navigation, notification panel, support dialog, floating chat button and footer) is built from Ant Design components inside one theme that follows the light or dark choice and the interface language, keeps the brand colours, and works from 360 px to 1920 px wide. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-081/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-081.md`.

## Stop conditions

- A required decision is not accepted
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
