---
id: TASK-084
title: Ant Design product detail, cart and saved listings
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-084 — Ant Design product detail, cart and saved listings

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — The product detail, cart and saved-listings pages are rebuilt from Ant Design components; the new tests and the App tests pass and the pages were observed in both themes at 390 and 1280 px; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-25](../requirements/FR-WEB.md#fr-web-25--web-storefront-on-ant-design) |
| Acceptance criteria | `AC-WEB-25-4` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Rebuild the product detail, cart and saved-listings pages from Ant Design components, and make the frontend tests fast enough to run Ant Design pages.

## In scope

- frontend/src/modules/product/ProductDetail.jsx
- frontend/src/modules/product/ProductDetail.css
- frontend/src/modules/product/ProductDetail.test.jsx
- frontend/src/modules/product/Cart.jsx
- frontend/src/modules/product/Cart.css
- frontend/src/modules/product/Cart.test.jsx
- frontend/src/modules/product/Favorites.jsx
- frontend/src/modules/product/Favorites.css
- frontend/src/modules/product/Favorites.test.jsx
- frontend/src/setupTests.js

## Out of scope

- Product creation, editing, my-products and the location selector (next task)
- The purchase and report dialogs opened from the detail page (order and report areas)
- Services, routes and API calls

## Inputs and dependencies

- plan.md#17. Icon set and component library amendment (2026-11-12)
- docs/technical/gitflow.md

## Technical approach

The detail page uses Row and Col, a Card for the photo, Typography, Descriptions for the facts, Alert for notices and errors, and Button for the actions, with the same names and aria-pressed on the favourite button. The cart uses a Card per item and Pagination, and the saved list uses a Card grid with a Popconfirm in place of the browser confirm dialog. An error while loading a product now shows the error alert instead of the not-found message. Test setup replaces jsdom's stylesheet-based computed style, which took seconds per role query once many Ant Design styles were present, with one built from the inline style and Ant Design's hidden classes.

## Files and symbols

- `frontend/src/modules/product/ProductDetail.test.jsx`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-WEB-25-4` (FR-WEB-25) — The product detail, cart and saved-listings pages are built from Ant Design components, with the same actions, notices, confirmation before removing a saved listing, paging, and loading, empty and error states, and work from 360 px to 1920 px wide in both themes. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-084/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-084.md`.

## Stop conditions

- A required decision is not accepted
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
