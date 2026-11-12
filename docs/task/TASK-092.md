---
id: TASK-092
title: Ant Design purchase requests and payment
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-092 — Ant Design purchase requests and payment

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — The purchase request dialog and inbox, the order payment page and the bank transfer result page are rebuilt from Ant Design components; the new tests and the existing suites pass and the reachable pages were observed in both themes at 390 and 1280 px; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-25](../requirements/FR-WEB.md#fr-web-25--web-storefront-on-ant-design) |
| Acceptance criteria | `AC-WEB-25-12` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Rebuild the purchase request dialog and inbox, the order payment page and the bank transfer result page from Ant Design components.

## In scope

- frontend/src/modules/order/PurchaseRequest.jsx
- frontend/src/modules/order/PurchaseRequest.css
- frontend/src/modules/order/PurchaseRequests.jsx
- frontend/src/modules/order/PurchaseRequests.css
- frontend/src/modules/order/OrderPayment.jsx
- frontend/src/modules/order/OrderPayment.css
- frontend/src/modules/order/SEPayOrderSuccess.jsx
- frontend/src/modules/order/SEPayOrderSuccess.css

## Out of scope

- Order detail, shipping and receipt pages (next order task)
- Services, routes, payment rules and the SePay hand-off

## Inputs and dependencies

- plan.md#17. Icon set and component library amendment (2026-11-12)
- docs/technical/gitflow.md

## Technical approach

The purchase request becomes an Ant Design Modal holding a Form with a counting text area and a price input, keeping its validation messages, quick-buy variant and result callback. The inbox uses Card, Tag, Avatar, Empty and a confirmation Modal. The payment page uses Card, Descriptions, Alert and Row and Col, hands the buyer to the same SePay checkout, and replaces the browser confirm and alert with dialogs and toasts. The result page uses Result, Descriptions and Spin and keeps its polling. Dark overrides in index.css for the removed payment method markup are deleted.

## Files and symbols

- `frontend/src/modules/order/PurchaseRequest.test.jsx`
- `frontend/src/modules/order/PurchaseRequests.test.jsx`
- `frontend/src/modules/order/OrderPayment.test.jsx`
- `frontend/src/modules/order/SEPayOrderSuccess.test.jsx`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-WEB-25-12` (FR-WEB-25) — The purchase request dialog and inbox, the order payment page and the bank transfer result page are built from Ant Design components, with the same fields, validation, payment hand-off, polling and messages, dialogs and toasts instead of browser confirms and alerts, and work from 360 px to 1920 px wide in both themes. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-092/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-092.md`.

## Stop conditions

- A required decision is not accepted
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
