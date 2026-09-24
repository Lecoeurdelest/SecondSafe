---
id: TASK-009
title: Media upload pipeline
execution_status: todo
relevance: current
depends_on: [TASK-005]
supersedes: []
superseded_by: null
---

# TASK-009 — Media upload pipeline

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-PROD-02](../requirements/FR-PROD.md#fr-prod-02--upload-listing-images), [FR-RPT-05](../requirements/FR-RPT.md#fr-rpt-05--upload-evidence), [NFR-SEC-09](../requirements/NFR.md#nfr-sec-09--safe-file-uploads) |
| Acceptance criteria | `AC-PROD-02-1`, `AC-RPT-05-1`, `AC-NFR-SEC-09-1`, `AC-NFR-SEC-09-2` |
| Components | `CMP-PLATFORM` |
| Decisions | `D-001` (accepted) |
| Milestone | M1 Platform and identity |
| Baseline references | `WDP@1cea2b7:backend/src/common/middlewares/upload.middleware.js`, `WDP@1cea2b7:backend/src/modules/products/upload.route.js` |

## Objective

Images and evidence are uploaded safely and served only to authorized users.

## In scope

- Product, chat and evidence buckets with limits
- File signature check
- Authorized serving for evidence

## Out of scope

- Cloud storage

## Inputs and dependencies

- plan.md#4.3 Listings and catalog
- plan.md#4.9 Reports and disputes
- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- docs/technical/order-lifecycle.md
- TASK-005 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/common/middlewares/upload.middleware.js`
- `backend/src/modules/products/upload.route.js`

## Invariants and constraints

- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.

## Acceptance criteria and verification

- [ ] `AC-PROD-02-1` (FR-PROD-02) — Image uploads accept jpg, jpeg, png and gif up to 5 MB each and at most 5 files per request, stored under random file names. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-RPT-05-1` (FR-RPT-05) — Evidence uploads accept jpg, jpeg, png and mp4 up to 100 MB each and at most 5 files per request. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-SEC-09-1` (NFR-SEC-09) — Uploads are checked by file signature as well as extension and respect the size limits of each bucket. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-SEC-09-2` (NFR-SEC-09) — Dispute and report evidence is served only to the related parties, moderators and admins. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-009/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-009.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
