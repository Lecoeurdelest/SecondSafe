---
id: TASK-091
title: Ant Design order lists
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-091 — Ant Design order lists

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — The buyer and seller order lists, the seller orders page and the abandoned checkout section are rebuilt from Ant Design components; the new tests and the existing suites pass and the pages were observed in both themes at 390 and 1280 px; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-25](../requirements/FR-WEB.md#fr-web-25--web-storefront-on-ant-design) |
| Acceptance criteria | `AC-WEB-25-11` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Rebuild the buyer and seller order lists, the seller orders page and the abandoned checkout recovery section from Ant Design components.

## In scope

- frontend/src/modules/order/Orders.jsx
- frontend/src/modules/order/Orders.css
- frontend/src/modules/order/SellerOrders.jsx
- frontend/src/modules/order/SellerOrders.css
- frontend/src/modules/order/AbandonedCheckouts.jsx
- frontend/src/modules/order/AbandonedCheckouts.css
- frontend/src/modules/order/orderStatus.js

## Out of scope

- Order detail, payment, purchase request, shipping and receipt pages and the shipping dialog (later order tasks)
- Services, routes and order rules

## Inputs and dependencies

- plan.md#17. Icon set and component library amendment (2026-11-12)
- docs/technical/gitflow.md

## Technical approach

Each page keeps its state, requests and actions and renders through Tabs, Select, Card, Tag, Descriptions, Badge, Avatar, Empty, Spin, Alert and Pagination. Cancelling an order asks for the reason in a Modal and confirming an order as seller asks in a confirmation dialog, replacing the browser prompt and confirm; results appear as toasts instead of alerts. The order status labels, tag colours and formats are shared in one small module. Buttons inside a clickable order card no longer open the order, and the dialogs are rendered outside the cards. The shipping and dispute dialogs opened from the list are unchanged.

## Files and symbols

- `frontend/src/modules/order/orderStatus.js`
- `frontend/src/modules/order/Orders.test.jsx`
- `frontend/src/modules/order/AbandonedCheckouts.test.jsx`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-WEB-25-11` (FR-WEB-25) — The buyer and seller order lists, the seller orders page and the abandoned checkout recovery section are built from Ant Design components, with the same tabs, filters, paging, actions and messages, a dialog instead of browser prompts for cancelling and confirming an order, and work from 360 px to 1920 px wide in both themes. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-091/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-091.md`.

## Stop conditions

- A required decision is not accepted
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
