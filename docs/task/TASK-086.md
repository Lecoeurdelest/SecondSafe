---
id: TASK-086
title: Ant Design my-listings page
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-086 — Ant Design my-listings page

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — The my-listings page is rebuilt from Ant Design components; the new tests and the existing suites pass and the page was observed in both themes at 390 and 1280 px; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-25](../requirements/FR-WEB.md#fr-web-25--web-storefront-on-ant-design) |
| Acceptance criteria | `AC-WEB-25-6` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Rebuild the seller's my-listings page from Ant Design components and keep its filter, actions and confirmations.

## In scope

- frontend/src/modules/product/MyProducts.jsx
- frontend/src/modules/product/MyProducts.css
- frontend/src/modules/product/MyProducts.test.jsx

## Out of scope

- Services, routes and the listing status rules
- Other page areas

## Inputs and dependencies

- plan.md#17. Icon set and component library amendment (2026-11-12)
- docs/technical/gitflow.md

## Technical approach

The status filter is a Segmented control, the listings are Cards in a Row and Col grid with the status as a Tag over the photo and the actions in the card footer, deleting and hiding use Modal with a confirm loading state, and paging uses Pagination. The success and error notices are closable Alerts that are no longer cleared by the reload that follows the action, and a selling restriction is shown as a warning Alert. A failed load now shows an error. The overlay dialogs and the unscoped stylesheet rules that other pages also define are removed.

## Files and symbols

- `frontend/src/modules/product/MyProducts.test.jsx`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-WEB-25-6` (FR-WEB-25) — The my-listings page is built from Ant Design components, with the status filter, listing cards with their actions, confirmation dialogs for deleting and hiding, paging, and loading, empty and error states, and works from 360 px to 1920 px wide in both themes. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-086/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-086.md`.

## Stop conditions

- A required decision is not accepted
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
