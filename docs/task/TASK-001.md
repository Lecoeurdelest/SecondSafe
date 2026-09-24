---
id: TASK-001
title: Scaffold the backend database layer and control framework
execution_status: done
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-001 — Scaffold the backend database layer and control framework

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `done` — Scaffold verified; MongoDB run delegated to TASK-002

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-SYS-06](../requirements/FR-SYS.md#fr-sys-06--database-initialization-scripts), [NFR-SEC-02](../requirements/NFR.md#nfr-sec-02--one-strong-password-policy), [NFR-SEC-08](../requirements/NFR.md#nfr-sec-08--secrets-management), [NFR-REL-05](../requirements/NFR.md#nfr-rel-05--database-constraints), [NFR-PERF-02](../requirements/NFR.md#nfr-perf-02--query-indexes), [NFR-COMP-02](../requirements/NFR.md#nfr-comp-02--portable-runtime), [NFR-MNT-01](../requirements/NFR.md#nfr-mnt-01--modular-structure), [NFR-MNT-02](../requirements/NFR.md#nfr-mnt-02--no-duplicate-or-dead-code), [NFR-MNT-04](../requirements/NFR.md#nfr-mnt-04--project-documentation), [NFR-MNT-05](../requirements/NFR.md#nfr-mnt-05--plan-traceability) |
| Acceptance criteria | `AC-SYS-06-1`, `AC-SYS-06-2`, `AC-NFR-SEC-02-4`, `AC-NFR-SEC-08-1`, `AC-NFR-REL-05-1`, `AC-NFR-PERF-02-1`, `AC-NFR-COMP-02-1`, `AC-NFR-MNT-01-1`, `AC-NFR-MNT-01-2`, `AC-NFR-MNT-02-1`, `AC-NFR-MNT-04-1`, `AC-NFR-MNT-05-1` |
| Components | `CMP-DATA`, `CMP-PLATFORM`, `CMP-CONTROL` |
| Decisions | `D-001` (accepted), `D-002` (accepted), `D-003` (accepted), `D-004` (accepted), `D-005` (accepted), `D-006` (accepted), `D-007` (accepted), `D-008` (accepted) |
| Milestone | M0 Scaffold |
| Baseline references | `WDP@1cea2b7:backend/src/modules/*/*.model.js`, `WDP@1cea2b7:backend/src/seeds/`, `WDP@1cea2b7:backend/create-admin.js` |

## Objective

The repository contains the accepted WDP database layer, an empty module skeleton that boots, and the plan-driven control artifacts.

## In scope

- Copy all Mongoose schemas, database configuration, seed data, the data migration script and its chat-encryption helper from the baseline
- Stub every baseline route, controller, service, middleware and utility file
- Harden create-admin and seed scripts
- Create plan.md, project.yaml, docs, .agent and .project control files

## Out of scope

- Any business endpoint or service logic
- Frontend code
- Running scripts against MongoDB (TASK-002)

## Inputs and dependencies

- plan.md#4.13 Scheduled jobs and data operations
- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md

## Technical approach

Copy schemas byte-for-byte except documented script fixes; stubs export empty objects or empty routers so the route map in routes.js mounts every module prefix.

## Files and symbols

- `backend/src/modules/*/*.model.js`
- `backend/src/config/`
- `backend/src/seeds/`
- `backend/src/app.js`
- `backend/src/routes.js`
- `backend/src/server.js`
- `backend/tests/scaffold.test.js`
- `plan.md`
- `project.yaml`
- `docs/`
- `.agent/`
- `.project/`

## Invariants and constraints

- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [x] `AC-SYS-06-1` (FR-SYS-06) — Category and product seed data satisfy the Mongoose schemas, and every product seed references a seeded category. Verify with: behavioral test; `cd backend && npm test`.
- [x] `AC-SYS-06-2` (FR-SYS-06) — create-admin reads the admin credentials from the environment, requires a strong password, never prints the password, and exits non-zero when configuration is missing; create-indexes and the seed scripts exit non-zero on failure. Verify with: behavioral test; `cd backend && npm test`.
- [x] `AC-NFR-SEC-02-4` (NFR-SEC-02) — The create-admin script refuses a password that violates the policy. Verify with: behavioral test; `cd backend && npm test`.
- [x] `AC-NFR-SEC-08-1` (NFR-SEC-08) — The repository contains no credentials, .env.example lists every variable, and startup fails when MONGODB_URI or JWT_SECRET is missing. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [x] `AC-NFR-REL-05-1` (NFR-REL-05) — Unique constraints are declared for user email, favorite (user, listing) and conversation (buyer, seller, listing). Verify with: behavioral test; `cd backend && npm test`.
- [x] `AC-NFR-PERF-02-1` (NFR-PERF-02) — Indexes for the main queries are declared in the schemas. Verify with: behavioral test; `cd backend && npm test`.
- [x] `AC-NFR-COMP-02-1` (NFR-COMP-02) — Runtime code uses no operating-system specific commands. Verify with: static flow review; `cd backend && npm test`.
- [x] `AC-NFR-MNT-01-1` (NFR-MNT-01) — Every baseline module keeps its route, controller, service and model files at the baseline paths, with logic files as empty stubs. Verify with: static flow review; `cd backend && npm test`.
- [x] `AC-NFR-MNT-01-2` (NFR-MNT-01) — The application shell starts without business logic and GET /api/health returns 200. Verify with: behavioral test; `cd backend && npm test`.
- [x] `AC-NFR-MNT-02-1` (NFR-MNT-02) — Baseline dead code (auto-release service, payment wrappers, unused seed exits) is not carried into the skeleton. Verify with: static flow review; `cd backend && npm test`.
- [x] `AC-NFR-MNT-04-1` (NFR-MNT-04) — README, .env.example and the documentation index describe setup, configuration and the delivery workflow. Verify with: document check; `cd backend && npm test`.
- [x] `AC-NFR-MNT-05-1` (NFR-MNT-05) — project.yaml validates with the plan-driven-development checker, every task maps to requirements and criteria, and the task index passes the status audit. Verify with: document check; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-001/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-001.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
