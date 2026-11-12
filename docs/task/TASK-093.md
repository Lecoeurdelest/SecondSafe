---
id: TASK-093
title: Ant Design shipment and receipt dialogs
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-093 — Ant Design shipment and receipt dialogs

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — The shipment and receipt dialogs are rebuilt from Ant Design components; the new tests and the existing suites pass and both dialogs were observed in both themes at 390 and 1280 px; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-25](../requirements/FR-WEB.md#fr-web-25--web-storefront-on-ant-design) |
| Acceptance criteria | `AC-WEB-25-13` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Rebuild the seller's shipment confirmation dialog and the buyer's receipt confirmation and review dialog from Ant Design components.

## In scope

- frontend/src/modules/order/ShipOrder.jsx
- frontend/src/modules/order/ShipOrder.css
- frontend/src/modules/order/ConfirmReceipt.jsx
- frontend/src/modules/order/ConfirmReceipt.css

## Out of scope

- The order detail page that opens the dialogs (next order task)
- Services, shipment and receipt rules and the review upload endpoints

## Inputs and dependencies

- plan.md#17. Icon set and component library amendment (2026-11-12)
- docs/technical/gitflow.md

## Technical approach

Both dialogs become Ant Design Modals holding a Form. The shipment dialog uses Descriptions for the order and the default pickup point, a Select for the carrier, a read-only generated tracking code, a date input, a Checkbox that reveals the custom pickup fields with the location selector, and an Alert for the notes. The receipt dialog uses Descriptions, a product summary, pressed-state buttons for the satisfaction and highlight choices, Rate for the stars, the shared EvidencePicker for photos and videos, and an Ant Design confirmation dialog instead of the browser confirm. Each keeps its validation messages, payloads and result callbacks.

## Files and symbols

- `frontend/src/modules/order/ShipOrder.test.jsx`
- `frontend/src/modules/order/ConfirmReceipt.test.jsx`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-WEB-25-13` (FR-WEB-25) — The shipment confirmation and receipt confirmation dialogs are built from Ant Design components with the same fields, generated tracking code, pickup point choices, validation, review and evidence upload, results and messages, a dialog instead of the browser confirm, and work from 360 px to 1920 px wide in both themes. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-093/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-093.md`.

## Stop conditions

- A required decision is not accepted
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
