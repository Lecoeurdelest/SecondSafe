---
id: TASK-016
title: Profiles and public profile
execution_status: todo
relevance: current
depends_on: [TASK-005, TASK-009]
supersedes: []
superseded_by: null
---

# TASK-016 — Profiles and public profile

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-PROF-01](../requirements/FR-PROF.md#fr-prof-01--view-own-profile), [FR-PROF-02](../requirements/FR-PROF.md#fr-prof-02--update-profile), [FR-PROF-03](../requirements/FR-PROF.md#fr-prof-03--update-avatar), [FR-PROF-04](../requirements/FR-PROF.md#fr-prof-04--public-profile-and-statistics), [FR-MOD-09](../requirements/FR-MOD.md#fr-mod-09--moderator-profile) |
| Acceptance criteria | `AC-PROF-01-1`, `AC-PROF-02-1`, `AC-PROF-02-2`, `AC-PROF-03-1`, `AC-PROF-04-1`, `AC-MOD-09-1` |
| Components | `CMP-USERS` |
| Decisions | `D-001` (accepted) |
| Milestone | M1 Platform and identity |
| Baseline references | `WDP@1cea2b7:backend/src/modules/users/user.service.js` |

## Objective

Users and moderators manage their profile, and anyone can read public profiles.

## In scope

- Own profile read/update, avatar, public profile and stats

## Out of scope

- Admin user management

## Inputs and dependencies

- plan.md#4.2 Profiles
- plan.md#4.11 Moderation
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-005 evidence
- TASK-009 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/users/user.*.js`

## Invariants and constraints

- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.

## Acceptance criteria and verification

- [ ] `AC-PROF-01-1` (FR-PROF-01) — Both profile paths return the caller's profile from one handler, without the password. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-PROF-02-1` (FR-PROF-02) — Full name must be 2–80 characters, phone must match ^0\d{9,10}$ and be unused by another account, and address must be at most 255 characters; violations return 400. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-PROF-02-2` (FR-PROF-02) — Structured location (city, district, ward, specific address) is stored with the profile. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-PROF-03-1` (FR-PROF-03) — POST /api/users/avatar stores a path produced by the upload pipeline and rejects any other value with 400. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-PROF-04-1` (FR-PROF-04) — Public profile and statistics are available without authentication and never expose email, phone, address or wallet data. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-MOD-09-1` (FR-MOD-09) — Moderators view and update their own profile and change their password through the profile endpoints. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-016/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-016.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
