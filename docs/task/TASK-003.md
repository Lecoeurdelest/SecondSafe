---
id: TASK-003
title: HTTP foundation
execution_status: done
relevance: current
depends_on: [TASK-001]
supersedes: []
superseded_by: null
---

# TASK-003 — HTTP foundation

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `done` — HTTP platform/scaffold manually verified: 23 tests pass; orders fail closed while guards are unavailable; no domain-confidence claim

## Traceability

| Field | Value |
|---|---|
| Requirements | [NFR-SEC-11](../requirements/NFR.md#nfr-sec-11--cors-and-security-headers), [NFR-REL-06](../requirements/NFR.md#nfr-rel-06--consistent-error-responses), [NFR-PERF-01](../requirements/NFR.md#nfr-perf-01--bounded-pagination), [NFR-PERF-04](../requirements/NFR.md#nfr-perf-04--request-size-limit), [NFR-USA-01](../requirements/NFR.md#nfr-usa-01--vietnamese-api-messages), [NFR-OBS-01](../requirements/NFR.md#nfr-obs-01--logging-and-audit-trail) |
| Acceptance criteria | `AC-NFR-SEC-11-1`, `AC-NFR-REL-06-1`, `AC-NFR-PERF-01-1`, `AC-NFR-PERF-04-1`, `AC-NFR-USA-01-1`, `AC-NFR-OBS-01-1` |
| Components | `CMP-PLATFORM` |
| Decisions | `D-001` (accepted), `D-008` (accepted) |
| Milestone | M1 Platform and identity |
| Baseline references | `WDP@1cea2b7:backend/src/common/utils/response.util.js`, `WDP@1cea2b7:backend/src/common/middlewares/error.middleware.js` |

## Objective

Every endpoint shares one response envelope, error handler, logger, pagination helper and security middleware.

## In scope

- response.util.js and error.middleware.js
- logger.util.js with levels
- Pagination helper (default 20, max 100)
- helmet, single CORS configuration, 1 MB body limit
- Vietnamese message catalogue conventions

## Out of scope

- Authentication

## Inputs and dependencies

- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-001 evidence

## Technical approach

Errors carry statusCode; the error middleware maps unknown errors to 500 without stack traces when NODE_ENV=production.

## Files and symbols

- `backend/src/common/utils/response.util.js`
- `backend/src/common/middlewares/error.middleware.js`
- `backend/src/common/utils/logger.util.js`
- `backend/src/app.js`

## Invariants and constraints

- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.

## Acceptance criteria and verification

- [x] `AC-NFR-SEC-11-1` (NFR-SEC-11) — CORS is configured once and allows only FRONTEND_URL, and security headers are applied to every response. Verify with: behavioral test; `cd backend && npm test`.
- [x] `AC-NFR-REL-06-1` (NFR-REL-06) — Errors use {success:false, message} with the correct HTTP status and never include stack traces in production. Verify with: behavioral test; `cd backend && npm test`.
- [x] `AC-NFR-PERF-01-1` (NFR-PERF-01) — A shared pagination helper applies default 20 and maximum 100 to every list endpoint. Verify with: behavioral test; `cd backend && npm test`.
- [x] `AC-NFR-PERF-04-1` (NFR-PERF-04) — JSON and form bodies are limited to 1 MB; files go through the upload pipeline. Verify with: behavioral test; `cd backend && npm test`.
- [x] `AC-NFR-USA-01-1` (NFR-USA-01) — User-facing API messages are Vietnamese with full diacritics, and money is expressed in integer VND. Verify with: behavioral test; `cd backend && npm test`.
- [x] `AC-NFR-OBS-01-1` (NFR-OBS-01) — A leveled logger replaces direct console output in application code. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-003/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-003.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
