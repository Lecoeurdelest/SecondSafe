---
id: TASK-037
title: Violation reports
execution_status: todo
relevance: current
depends_on: [TASK-006, TASK-009, TASK-010]
supersedes: []
superseded_by: null
---

# TASK-037 — Violation reports

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-RPT-01](../requirements/FR-RPT.md#fr-rpt-01--report-a-listing), [FR-RPT-02](../requirements/FR-RPT.md#fr-rpt-02--report-a-user), [FR-RPT-03](../requirements/FR-RPT.md#fr-rpt-03--track-my-reports), [FR-RPT-04](../requirements/FR-RPT.md#fr-rpt-04--automatic-restriction-by-report-count) |
| Acceptance criteria | `AC-RPT-01-1`, `AC-RPT-01-2`, `AC-RPT-02-1`, `AC-RPT-03-1`, `AC-RPT-03-2`, `AC-RPT-04-1` |
| Components | `CMP-TRUST` |
| Decisions | `D-001` (accepted) |
| Milestone | M4 Trust and moderation |
| Baseline references | — |

## Objective

Users report listings and users, and repeated reports restrict sellers automatically.

## In scope

- Report creation, my reports, detail with redaction, auto restriction

## Out of scope

- Moderator resolution (TASK-040)

## Inputs and dependencies

- plan.md#4.9 Reports and disputes
- docs/technical/architecture.md
- docs/technical/data-model.md
- docs/technical/order-lifecycle.md
- TASK-006 evidence
- TASK-009 evidence
- TASK-010 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/reports/report.*.js`

## Invariants and constraints

- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.

## Acceptance criteria and verification

- [ ] `AC-RPT-01-1` (FR-RPT-01) — A listing report needs a reason (counterfeit, inappropriate, scam, spam, other) and a 10–1000 character description, with optional evidence. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-RPT-01-2` (FR-RPT-01) — A user cannot report their own listing or report the same listing twice. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-RPT-02-1` (FR-RPT-02) — A user report follows the same validation, targets an existing user, and cannot target the reporter. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-RPT-03-1` (FR-RPT-03) — A reporter lists their reports with pagination. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-RPT-03-2` (FR-RPT-03) — Report detail is visible only to the reporter, moderators and admins; the reported user sees a redacted view without the reporter identity. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-RPT-04-1` (FR-RPT-04) — Reaching the configured threshold (default 3 non-dismissed reports) applies a selling restriction automatically, never to admins. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-037/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-037.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
