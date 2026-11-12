---
id: TASK-085
title: Ant Design listing forms and location selector
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-085 — Ant Design listing forms and location selector

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — The listing creation and editing forms and the location selector are rebuilt from Ant Design form components; the new tests and the existing suites pass and the forms were observed in both themes at 390 and 1280 px; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-25](../requirements/FR-WEB.md#fr-web-25--web-storefront-on-ant-design) |
| Acceptance criteria | `AC-WEB-25-5` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Rebuild the listing creation and editing forms and the shared province, district and ward selector from Ant Design form components.

## In scope

- frontend/src/modules/product/CreateProduct.jsx
- frontend/src/modules/product/CreateProduct.css
- frontend/src/modules/product/CreateProduct.test.jsx
- frontend/src/modules/product/EditProduct.jsx
- frontend/src/modules/product/EditProduct.test.jsx
- frontend/src/modules/product/ProductImagePicker.jsx
- frontend/src/components/LocationSelector.jsx
- frontend/src/components/LocationSelector.css
- frontend/src/components/LocationSelector.test.jsx

## Out of scope

- The my-products page (next task)
- Services, routes, upload and save requests and the validation rules
- The profile and shipping forms that embed the selector, apart from the selector's own look

## Inputs and dependencies

- plan.md#17. Icon set and component library amendment (2026-11-12)
- docs/technical/gitflow.md

## Technical approach

Both forms keep their state and validation functions and render them through Form.Item with validateStatus and help, Input, Input.TextArea and Select; the category chips are toggle Buttons with aria-pressed. A ProductImagePicker shared by both forms shows the photo tiles and an add button that opens a hidden file input. The creation form shows a summary Card and a completeness Progress. The selector uses searchable Selects with the same onChange payloads. Success and failure messages use the Ant Design message instead of the browser alert. Shared class names were renamed to product-form-section, product-form-actions and product-sidebar-card so they no longer collide with other pages.

## Files and symbols

- `frontend/src/modules/product/ProductImagePicker.jsx`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-WEB-25-5` (FR-WEB-25) — The listing creation and editing forms and the province, district and ward selector are built from Ant Design form components with inline validation, a shared photo picker, a live summary and the same upload and save behaviour, and work from 360 px to 1920 px wide in both themes. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-085/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-085.md`.

## Stop conditions

- A required decision is not accepted
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
