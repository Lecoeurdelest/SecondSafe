---
id: TASK-089
title: Ant Design profile pages
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-089 — Ant Design profile pages

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — The account profile, profile editing and seller profile pages are rebuilt from Ant Design components; the new tests and the existing suites pass and the pages were observed in both themes at 390 and 1280 px; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-25](../requirements/FR-WEB.md#fr-web-25--web-storefront-on-ant-design) |
| Acceptance criteria | `AC-WEB-25-9` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Rebuild the account profile, profile editing, seller profile and seller reviews pages from Ant Design components and remove the unused profile password page.

## In scope

- frontend/src/modules/profile
- frontend/src/index.css
- frontend/src/ui/shell.css

## Out of scope

- Services, routes and the report dialog opened from the seller profile (report area)
- The review list shown on the seller reviews page (review area)

## Inputs and dependencies

- plan.md#17. Icon set and component library amendment (2026-11-12)
- docs/technical/gitflow.md

## Technical approach

Each page keeps its state and requests and renders through Card, Avatar, Descriptions, Tag, Form items, Input, Button, Alert and a Row and Col grid. The edit form keeps its own validation messages and the avatar upload; the avatar button opens a hidden file input. Browser alerts become toasts. A signed-out visitor no longer sees a spinner forever on the account page. The legacy global profile rules in index.css, which centred card headings and styled the old markup, are removed, and a global rule makes the hidden attribute win on file inputs. The profile password page that no route used is deleted.

## Files and symbols

- `frontend/src/modules/profile/Profile.test.jsx`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-WEB-25-9` (FR-WEB-25) — The account profile, profile editing and public seller profile pages are built from Ant Design components, with the same details, validation, avatar upload, report flow and states, and work from 360 px to 1920 px wide in both themes. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-089/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-089.md`.

## Stop conditions

- A required decision is not accepted
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
