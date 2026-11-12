---
id: TASK-082
title: Ant Design authentication pages
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-082 — Ant Design authentication pages

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — The sign-in, registration, recovery and password change pages are rebuilt from Ant Design forms with inline validation; App tests pass and the pages were observed in both themes at 390 and 1280 px; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-25](../requirements/FR-WEB.md#fr-web-25--web-storefront-on-ant-design) |
| Acceptance criteria | `AC-WEB-25-2` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Rebuild the sign-in, registration, password recovery and password change pages from Ant Design form components, keeping every step and message.

## In scope

- frontend/src/modules/auth
- frontend/src/App.test.jsx
- frontend/src/setupTests.js

## Out of scope

- The profile password page (profile area task)
- Services, routes and the sign-in rules
- Other page areas

## Inputs and dependencies

- plan.md#17. Icon set and component library amendment (2026-11-12)
- docs/technical/gitflow.md

## Technical approach

One AuthShell (Card, Typography, Alert, Flex) holds the title, intro, notice, error and footer links. Each page uses an Ant Design Form with rules for required fields, email, phone, six-digit code and password length; PasswordField keeps the "Hiện/Ẩn mật khẩu" toggle as a button inside the input. Service calls, step order and texts are unchanged. Test setup gains a timer-based MessageChannel because Ant Design forms use it.

## Files and symbols

- `frontend/src/modules/auth/AuthShell.jsx`
- `frontend/src/modules/auth/PasswordField.jsx`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-WEB-25-2` (FR-WEB-25) — The sign-in, registration, password recovery and password change pages are built from Ant Design form components with inline validation messages, a show and hide toggle on password fields, success and error alerts and the emailed-code and Google steps, and work from 360 px to 1920 px wide in both themes. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-082/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-082.md`.

## Stop conditions

- A required decision is not accepted
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
