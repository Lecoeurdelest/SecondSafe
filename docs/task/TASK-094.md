---
id: TASK-094
title: Ant Design order detail
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-094 — Ant Design order detail

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — The order detail page and its seller reply, buyer follow-up, return confirmation and cancellation dialogs are rebuilt from Ant Design components; the new tests and the existing suites pass and the page was observed in both themes at 390 and 1280 px; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-25](../requirements/FR-WEB.md#fr-web-25--web-storefront-on-ant-design) |
| Acceptance criteria | `AC-WEB-25-14` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Rebuild the order detail page and its seller reply, buyer follow-up, return confirmation and cancellation dialogs from Ant Design components.

## In scope

- frontend/src/modules/order/OrderDetail.jsx
- frontend/src/modules/order/OrderDetail.css

## Out of scope

- Services, routes and order and dispute rules
- The shipment, receipt, rating and dispute dialogs the page opens (earlier tasks)

## Inputs and dependencies

- plan.md#17. Icon set and component library amendment (2026-11-12)
- docs/technical/gitflow.md

## Technical approach

The page keeps its state, requests, role rules and auto-opened dialogs and renders through Card, Descriptions, Tag, Timeline, Rate, Avatar, Alert and Spin. The seller reply and buyer follow-up become Modals holding a Form and the shared EvidencePicker, the return confirmation a Modal, the cancellation reason a Modal instead of the browser prompt, and the delivery confirmation an Ant Design confirmation instead of the browser confirm; results appear as toasts. Order status labels come from the shared status module. The legacy dark override for the old condition badge is removed from index.css.

## Files and symbols

- `frontend/src/modules/order/OrderDetail.test.jsx`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-WEB-25-14` (FR-WEB-25) — The order detail page, with its seller reply, buyer follow-up, return confirmation and cancellation dialogs, is built from Ant Design components with the same details, actions, auto-opened dialogs, messages and states, dialogs and toasts instead of browser prompts, confirms and alerts, and works from 360 px to 1920 px wide in both themes. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-094/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-094.md`.

## Stop conditions

- A required decision is not accepted
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
