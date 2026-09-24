---
id: TASK-038
title: Disputes for buyers and sellers
execution_status: todo
relevance: current
depends_on: [TASK-009, TASK-010, TASK-033]
supersedes: []
superseded_by: null
---

# TASK-038 — Disputes for buyers and sellers

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-DSP-01](../requirements/FR-DSP.md#fr-dsp-01--open-a-dispute), [FR-DSP-02](../requirements/FR-DSP.md#fr-dsp-02--seller-responds-to-a-dispute), [FR-DSP-03](../requirements/FR-DSP.md#fr-dsp-03--buyer-adds-dispute-evidence), [FR-DSP-04](../requirements/FR-DSP.md#fr-dsp-04--seller-confirms-a-returned-item), [FR-DSP-05](../requirements/FR-DSP.md#fr-dsp-05--view-disputes) |
| Acceptance criteria | `AC-DSP-01-1`, `AC-DSP-01-2`, `AC-DSP-02-1`, `AC-DSP-03-1`, `AC-DSP-04-1`, `AC-DSP-05-1` |
| Components | `CMP-TRUST` |
| Decisions | `D-001` (accepted) |
| Milestone | M4 Trust and moderation |
| Baseline references | — |

## Objective

Buyers open disputes and both parties contribute evidence.

## In scope

- Open, respond, follow-up, confirm-return, lists and detail

## Out of scope

- Resolution (TASK-042)

## Inputs and dependencies

- plan.md#4.9 Reports and disputes
- docs/technical/architecture.md
- docs/technical/data-model.md
- docs/technical/order-lifecycle.md
- TASK-009 evidence
- TASK-010 evidence
- TASK-033 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/reports/report.*.js`

## Invariants and constraints

- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.

## Acceptance criteria and verification

- [ ] `AC-DSP-01-1` (FR-DSP-01) — Only the buyer of a shipped or delivered order can open one dispute per order, with an allowed reason, a 10–1000 character description and at least one evidence file. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-DSP-01-2` (FR-DSP-01) — Opening a dispute moves the order to disputed atomically, so automatic completion no longer applies. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-DSP-02-1` (FR-DSP-02) — The seller can respond with evidence only while the dispute is investigating. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-DSP-03-1` (FR-DSP-03) — The buyer can add a note or at least one file only while the dispute is investigating. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-DSP-04-1` (FR-DSP-04) — Return confirmation applies only to return_request disputes under investigation and can be recorded once. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-DSP-05-1` (FR-DSP-05) — Dispute lists include disputes where the caller is buyer or seller, and dispute detail is visible only to the parties, moderators and admins. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-038/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-038.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
