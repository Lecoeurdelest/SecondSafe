---
id: TASK-053
title: Migration inventory, FE task decomposition and Gitflow delivery
execution_status: done
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-053 — Migration inventory, FE task decomposition and Gitflow delivery

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `done` — 73 task issues created; 52 BE definitions preserved; 21 migration/web/integration tasks and sole-author Gitflow checks validated

## Traceability

| Field | Value |
|---|---|
| Requirements | [NFR-MIG-01](../requirements/NFR.md#nfr-mig-01--migration-inventory-fe-task-decomposition-and-gitflow-delivery) |
| Acceptance criteria | `AC-MIG-01-1` |
| Components | `CMP-CONTROL` |
| Decisions | `D-009` (accepted), `D-010` (accepted), `D-011` (accepted) |
| Milestone | M6 Migration control |
| Baseline references | — |

## Objective

The inventory pins both repositories, preserves TASK-001 through TASK-052, maps frontend modules to new bounded tasks, and defines sole-author Gitflow PR delivery.

## In scope

- Pin source and destination revisions and document inspected behavior
- Add bounded FE tasks without changing the 52 existing BE definitions
- Track task issues and PRs in .project/delivery.json and generated docs
- Document Gitflow and enforce the existing sole-author rule

## Out of scope

- Unrelated modules
- Schema or business-rule changes outside an explicit task
- Production deployment or live payment execution

## Inputs and dependencies

- plan.md#12. Migration amendment (2026-10-09)
- docs/technical/migration-wdp.md
- docs/technical/gitflow.md
- docs/technical/architecture.md

## Technical approach

Preserve existing task IDs, criteria, schemas and history. Add a full-stack scope amendment, FE requirements, task dependencies and a delivery view. Record the initial backend import regression as observed failure, not passing behavior.

## Files and symbols

- `plan.md`
- `project.yaml`
- `docs/technical/migration-wdp.md`
- `docs/technical/gitflow.md`
- `tools/pdd/render.py`
- `tools/pdd/check-migration.py`
- `tools/pdd/sync-issues.py`
- `.project/delivery.json`
- `docs/task/TASK-053.md`
- `tools/pdd/check-authorship.py`
- `.github/workflows/task-delivery.yml`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [x] `AC-MIG-01-1` (NFR-MIG-01) — The inventory pins both repositories, preserves TASK-001 through TASK-052, maps frontend modules to new bounded tasks, and defines sole-author Gitflow PR delivery. Verify with: document check; `python3 tools/pdd/check-migration.py`, `python3 tools/pdd/render.py --check`.

## Required evidence

- Original runner output under `.project/evidence/TASK-053/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-053.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
