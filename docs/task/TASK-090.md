---
id: TASK-090
title: Ant Design reviews and report dialogs
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-090 — Ant Design reviews and report dialogs

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — The seller reviews list and the rating, report and dispute dialogs are rebuilt from Ant Design components; the new tests and the existing suites pass and the pages were observed in both themes at 390 and 1280 px; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-25](../requirements/FR-WEB.md#fr-web-25--web-storefront-on-ant-design) |
| Acceptance criteria | `AC-WEB-25-10` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Rebuild the seller reviews list and the rating, report and dispute dialogs from Ant Design components and remove the unused shipping form.

## In scope

- frontend/src/modules/review
- frontend/src/modules/report
- frontend/src/modules/delivery
- frontend/src/components/EvidencePicker.jsx
- frontend/src/components/EvidencePicker.css
- frontend/src/components/ReportModal.css

## Out of scope

- Services, evidence upload endpoints and moderation views
- The order pages that open the rating and dispute dialogs (order area)

## Inputs and dependencies

- plan.md#17. Icon set and component library amendment (2026-11-12)
- docs/technical/gitflow.md

## Technical approach

The four dialogs become Ant Design Modals holding a Form with Select, Input.TextArea, Rate and Alert, and share one EvidencePicker for the photo and video upload, thumbnails and removal. Each dialog keeps its own upload function, limits and validation messages. The reviews list uses Statistic, Rate, Card, Avatar, Select and Pagination. The delivery module's shipping form had no importer and is deleted.

## Files and symbols

- `frontend/src/components/EvidencePicker.jsx`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-WEB-25-10` (FR-WEB-25) — The seller reviews list and the rating, product report, user report and dispute dialogs are built from Ant Design components with the same fields, validation, evidence upload and messages, and work from 360 px to 1920 px wide in both themes. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-090/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-090.md`.

## Stop conditions

- A required decision is not accepted
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
