---
id: TASK-077
title: Web marketplace visual restyle
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-077 — Web marketplace visual restyle

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — Restyle merged to main in PR 148 and PR 149; a second follow-up makes the seller order list open on its first tab and observes the staff notification panel; build and 60 frontend tests pass; automatic completion remains inconclusive without applicable calibration, and no page was observed against a real backend

## Traceability

| Field | Value |
|---|---|
| Requirements | [NFR-USA-02](../requirements/NFR.md#nfr-usa-02--responsive-user-interface) |
| Acceptance criteria | `AC-NFR-USA-02-1` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

The web client shares one visual language across the buyer marketplace and the staff consoles, with the same behaviour, routes and API calls as before; it renders from 360 px to 1920 px wide.

## In scope

- frontend/src/assets/styles/global.css
- frontend/src/index.css
- frontend/src/modules/home/Home.css
- frontend/src/components/ProductComponents.css
- frontend/src/modules/auth/Auth.css
- frontend/src/modules/staffTheme.js
- frontend/src/modules/admin/layout/AdminLayout.jsx
- frontend/src/modules/moderator/layout/ModeratorLayout.jsx
- frontend/src/index.js
- frontend/package.json
- frontend/package-lock.json
- Colour, radius, shadow and typography values in the other module stylesheets

## Out of scope

- Routes, services, API contracts and business rules
- New runtime dependencies other than the Font Awesome Free icon font
- Unrelated modules
- Production deployment

## Inputs and dependencies

- plan.md#12. Migration amendment (2026-10-09)
- docs/technical/gitflow.md

## Technical approach

Design tokens in global.css (brand gradient, surfaces, radius, shadows, DM Sans) drive the buyer pages, and the saturated blues of the old theme are recoloured to the brand hue across the module stylesheets. Staff consoles use a neutral palette and one shared Ant Design theme, and hide the storefront header while mounted. The two reference projects are visual references only; no code was copied from them.

## Files and symbols

- `frontend/src/assets/styles/global.css`
- `frontend/src/index.css`
- `frontend/src/modules/home/Home.css`
- `frontend/src/components/ProductComponents.css`
- `frontend/src/modules/auth/Auth.css`
- `frontend/src/modules/staffTheme.js`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-NFR-USA-02-1` (NFR-USA-02) — The user interface works from 360 px to 1920 px wide. Verify with: manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-077/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-077.md`.

## Stop conditions

- A change needs a route, service or API contract change
- A needed dependency is not approved
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
