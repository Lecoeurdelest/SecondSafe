---
id: TASK-096
title: Ant Design administrator shell and revenue report
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-096 — Ant Design administrator shell and revenue report

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — The administrator sidebar, header and revenue report, the route guard loading screens and the page error screen are rebuilt from Ant Design components; the new tests and the existing suites pass and the shell and report were observed at 390 and 1280 px; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-25](../requirements/FR-WEB.md#fr-web-25--web-storefront-on-ant-design) |
| Acceptance criteria | `AC-WEB-25-16` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Rebuild the administrator sidebar, header and revenue report, the route guard loading screens and the page error screen from Ant Design components, and remove the legacy admin stylesheet and unrouted dashboard.

## In scope

- frontend/src/modules/admin/layout
- frontend/src/modules/admin/revenue
- frontend/src/modules/admin/AdminModules.css
- frontend/src/modules/admin/dashboard/Dashboard.jsx
- frontend/src/modules/admin/dashboard/Dashboard.css
- frontend/src/routes
- frontend/src/components/AppErrorBoundary.jsx
- frontend/src/ui/PageLoading.jsx

## Out of scope

- Services, routes and role rules
- The admin and moderator pages that already use Ant Design

## Inputs and dependencies

- plan.md#17. Icon set and component library amendment (2026-11-12)
- docs/technical/gitflow.md

## Technical approach

The sidebar becomes an Ant Design Menu with the same entries, descriptions and selection rules, and the header uses Button, Avatar, Tag and a Dropdown for the account menu; the slide-in sidebar and overlay stay. The revenue report uses Card, Statistic, Input, Table, Alert, Spin and Empty around the unchanged charts. The route guards share one Spin loading screen and the page error screen uses Result. The 1,950-line admin stylesheet that only the revenue report imported and the unrouted legacy dashboard, whose rules collided with the live dashboard, are deleted.

## Files and symbols

- `frontend/src/ui/PageLoading.jsx`
- `frontend/src/modules/admin/layout/AdminLayout.test.jsx`
- `frontend/src/modules/admin/revenue/AdminRevenueReport.test.jsx`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-WEB-25-16` (FR-WEB-25) — The administrator shell (sidebar and header), the revenue report, the loading screens of the route guards and the page error screen are built from Ant Design components with the same menu, account actions, filters, tables, charts and messages, and work from 360 px to 1920 px wide. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-096/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-096.md`.

## Stop conditions

- A required decision is not accepted
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
