---
id: TASK-007
title: Email delivery and one-time code store
execution_status: ready
relevance: current
depends_on: [TASK-003, TASK-004]
supersedes: []
superseded_by: null
---

# TASK-007 — Email delivery and one-time code store

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `ready` — Dependencies complete; ready to implement and verify

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-NOTI-04](../requirements/FR-NOTI.md#fr-noti-04--transactional-email), [NFR-SEC-05](../requirements/NFR.md#nfr-sec-05--abuse-protection-for-authentication), [NFR-REL-04](../requirements/NFR.md#nfr-rel-04--no-critical-state-in-process-memory), [NFR-INT-01](../requirements/NFR.md#nfr-int-01--resilient-integrations) |
| Acceptance criteria | `AC-NOTI-04-1`, `AC-NFR-SEC-05-2`, `AC-NFR-REL-04-1`, `AC-NFR-INT-01-1` |
| Components | `CMP-AUTH`, `CMP-NOTIFY` |
| Decisions | `D-001` (accepted) |
| Milestone | M1 Platform and identity |
| Baseline references | `WDP@1cea2b7:backend/src/common/utils/email.util.js`, `WDP@1cea2b7:backend/src/common/utils/otp.manager.js` |

## Objective

Transactional email and one-time codes work behind replaceable interfaces.

## In scope

- SMTP mailer with timeout
- Code store interface with in-memory adapter, expiry, single use and attempt limit

## Out of scope

- Shared store adapter (D-108)

## Inputs and dependencies

- plan.md#4.10 Notifications
- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-003 evidence
- TASK-004 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/common/utils/email.util.js`
- `backend/src/common/utils/otp.manager.js`

## Invariants and constraints

- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.
- `INV-04` — Admin accounts are never suspended, restricted, locked or deleted by platform rules.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.

## Acceptance criteria and verification

- [ ] `AC-NOTI-04-1` (FR-NOTI-04) — Registration, two-factor and recovery emails are sent through the configured SMTP account; delivery failures return 5xx without exposing SMTP details. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-SEC-05-2` (NFR-SEC-05) — A one-time code is invalidated after 5 wrong attempts. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-REL-04-1` (NFR-REL-04) — One-time codes and rate-limit counters use a store interface with an in-memory adapter by default and a shared adapter chosen by D-108. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-INT-01-1` (NFR-INT-01) — SMTP calls have timeouts and mapped errors. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-007/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-007.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
