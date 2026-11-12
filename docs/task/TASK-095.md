---
id: TASK-095
title: Ant Design staff dashboards
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-095 — Ant Design staff dashboards

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — The administrator and staff dashboards, the product management page and their shell are rebuilt from Ant Design components; the new tests and the existing suites pass and the pages were observed at 390 and 1280 px; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-25](../requirements/FR-WEB.md#fr-web-25--web-storefront-on-ant-design) |
| Acceptance criteria | `AC-WEB-25-15` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Rebuild the administrator and staff dashboards, the product management page and their navigation shell from Ant Design components.

## In scope

- frontend/src/modules/dashboard

## Out of scope

- Services and routes
- The admin and moderator page layouts that already use Ant Design
- A dark theme for staff roles, which are always shown in the light theme

## Inputs and dependencies

- plan.md#17. Icon set and component library amendment (2026-11-12)
- docs/technical/gitflow.md

## Technical approach

The shell keeps its sidebar and top bar and uses Menu, Breadcrumb and Avatar. The dashboards use Card, Statistic, Progress bars, Badge, Tag, Alert, Spin and a Row and Col grid, and the product page uses Form, Input, Select, Table, Pagination and Tag. Figures, requests and messages are unchanged. The stylesheets use the shared colour tokens instead of fixed colours, and the leftover symbol glyphs become Phosphor icons.

## Files and symbols

- `frontend/src/modules/dashboard/Dashboard.test.jsx`
- `frontend/src/modules/dashboard/AdminProducts.test.jsx`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-WEB-25-15` (FR-WEB-25) — The administrator and staff dashboards and the product management page, with their shared navigation shell, are built from Ant Design components with the same figures, charts, queue, filters, actions and messages, and work from 360 px to 1920 px wide. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-095/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-095.md`.

## Stop conditions

- A required decision is not accepted
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
