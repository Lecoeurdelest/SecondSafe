# Tasks

This index is generated from `.project/state.json` and `project.yaml` by `tools/pdd/render.py`. Update the execution record first; never hand-edit a marker.

## Status legend

- `[]` — `todo` or `ready`
- `[!]` — `in_progress`, `verifying`, `blocked`, or `needs_revalidation`
- `[x]` — `done` with current evidence

## Status

| Status | ID | Title | Execution | Relevance | Milestone | Depends on | Detail | Evidence |
|---|---|---|---|---|---|---|---|---|
| [x] | [TASK-001](TASK-001.md) | Scaffold the backend database layer and control framework | `done` | `current` | M0 | — | Scaffold verified; MongoDB run delegated to TASK-002 | [run-01](../../.project/evidence/TASK-001/run-01/report.json) |
| [] | [TASK-002](TASK-002.md) | Verify database scripts against MongoDB | `ready` | `current` | M0 | TASK-001 | Dependencies done; ready to start | — |
| [] | [TASK-003](TASK-003.md) | HTTP foundation | `ready` | `current` | M1 | TASK-001 | Dependencies done; ready to start | — |
| [] | [TASK-004](TASK-004.md) | Business configuration module | `ready` | `current` | M1 | TASK-001 | Dependencies done; ready to start | — |
| [] | [TASK-005](TASK-005.md) | JWT authentication middleware and role guards | `todo` | `current` | M1 | TASK-003 | Waiting for TASK-003 | — |
| [] | [TASK-006](TASK-006.md) | Account suspension and selling-restriction service | `todo` | `current` | M1 | TASK-005 | Waiting for TASK-005 | — |
| [] | [TASK-007](TASK-007.md) | Email delivery and one-time code store | `todo` | `current` | M1 | TASK-003, TASK-004 | Waiting for TASK-003, TASK-004 | — |
| [] | [TASK-008](TASK-008.md) | Rate limiting for authentication endpoints | `todo` | `current` | M1 | TASK-003 | Waiting for TASK-003 | — |
| [] | [TASK-009](TASK-009.md) | Media upload pipeline | `todo` | `current` | M1 | TASK-005 | Waiting for TASK-005 | — |
| [] | [TASK-010](TASK-010.md) | Notifications | `todo` | `current` | M1 | TASK-005 | Waiting for TASK-005 | — |
| [] | [TASK-011](TASK-011.md) | Registration with email verification | `todo` | `current` | M1 | TASK-007, TASK-008 | Waiting for TASK-007, TASK-008 | — |
| [] | [TASK-012](TASK-012.md) | Login and logout | `todo` | `current` | M1 | TASK-006, TASK-008 | Waiting for TASK-006, TASK-008 | — |
| [] | [TASK-013](TASK-013.md) | Google sign-in | `todo` | `current` | M1 | TASK-006 | Waiting for TASK-006 | — |
| [] | [TASK-014](TASK-014.md) | Password change and recovery | `todo` | `current` | M1 | TASK-007, TASK-008, TASK-010, TASK-012 | Waiting for TASK-007, TASK-008, TASK-010, TASK-012 | — |
| [!] | [TASK-015](TASK-015.md) | Optional two-factor login | `blocked` | `current` | M1 | TASK-007, TASK-012 | Awaiting decision D-101 (proposed) | — |
| [] | [TASK-016](TASK-016.md) | Profiles and public profile | `todo` | `current` | M1 | TASK-005, TASK-009 | Waiting for TASK-005, TASK-009 | — |
| [] | [TASK-017](TASK-017.md) | Categories API | `todo` | `current` | M2 | TASK-003 | Waiting for TASK-003 | — |
| [] | [TASK-018](TASK-018.md) | Listing management | `todo` | `current` | M2 | TASK-006, TASK-009, TASK-017 | Waiting for TASK-006, TASK-009, TASK-017 | — |
| [] | [TASK-019](TASK-019.md) | Listing detail and seller listings | `todo` | `current` | M2 | TASK-018 | Waiting for TASK-018 | — |
| [] | [TASK-020](TASK-020.md) | Browse, search and filter | `todo` | `current` | M2 | TASK-018 | Waiting for TASK-018 | — |
| [] | [TASK-021](TASK-021.md) | Favorites | `todo` | `current` | M2 | TASK-018 | Waiting for TASK-018 | — |
| [] | [TASK-022](TASK-022.md) | Conversations and messages | `todo` | `current` | M2 | TASK-005, TASK-009, TASK-018 | Waiting for TASK-005, TASK-009, TASK-018 | — |
| [] | [TASK-023](TASK-023.md) | Realtime gateway | `todo` | `current` | M2 | TASK-010, TASK-022 | Waiting for TASK-010, TASK-022 | — |
| [] | [TASK-024](TASK-024.md) | Wallet ledger | `todo` | `current` | M3 | TASK-004, TASK-005 | Waiting for TASK-004, TASK-005 | — |
| [] | [TASK-025](TASK-025.md) | Escrow service | `todo` | `current` | M3 | TASK-024 | Waiting for TASK-024 | — |
| [] | [TASK-026](TASK-026.md) | SePay top-up and payment notifications | `todo` | `current` | M3 | TASK-010, TASK-024 | Waiting for TASK-010, TASK-024 | — |
| [!] | [TASK-027](TASK-027.md) | VNPay top-up | `blocked` | `current` | M3 | TASK-024 | Awaiting decision D-102 (proposed) | — |
| [] | [TASK-028](TASK-028.md) | Withdrawal requests | `todo` | `current` | M3 | TASK-024 | Waiting for TASK-024 | — |
| [!] | [TASK-029](TASK-029.md) | Withdrawal approval | `blocked` | `current` | M3 | TASK-010, TASK-028 | Awaiting decision D-105 (proposed) | — |
| [] | [TASK-030](TASK-030.md) | Purchase requests and quick buy | `todo` | `current` | M3 | TASK-006, TASK-010, TASK-016, TASK-018 | Waiting for TASK-006, TASK-010, TASK-016, TASK-018 | — |
| [] | [TASK-031](TASK-031.md) | Price offers in chat | `todo` | `current` | M3 | TASK-022, TASK-030 | Waiting for TASK-022, TASK-030 | — |
| [] | [TASK-032](TASK-032.md) | Order confirmation and payment | `todo` | `current` | M3 | TASK-025, TASK-026, TASK-030 | Waiting for TASK-025, TASK-026, TASK-030 | — |
| [] | [TASK-033](TASK-033.md) | Order fulfilment and cancellation | `todo` | `current` | M3 | TASK-025, TASK-032 | Waiting for TASK-025, TASK-032 | — |
| [] | [TASK-034](TASK-034.md) | Order queries | `todo` | `current` | M3 | TASK-030 | Waiting for TASK-030 | — |
| [] | [TASK-035](TASK-035.md) | Delivery tracking | `todo` | `current` | M3 | TASK-033 | Waiting for TASK-033 | — |
| [] | [TASK-036](TASK-036.md) | Reviews and rating statistics | `todo` | `current` | M3 | TASK-009, TASK-033 | Waiting for TASK-009, TASK-033 | — |
| [] | [TASK-037](TASK-037.md) | Violation reports | `todo` | `current` | M4 | TASK-006, TASK-009, TASK-010 | Waiting for TASK-006, TASK-009, TASK-010 | — |
| [] | [TASK-038](TASK-038.md) | Disputes for buyers and sellers | `todo` | `current` | M4 | TASK-009, TASK-010, TASK-033 | Waiting for TASK-009, TASK-010, TASK-033 | — |
| [] | [TASK-039](TASK-039.md) | Moderator dashboard and revenue report | `todo` | `current` | M4 | TASK-004, TASK-005, TASK-033 | Waiting for TASK-004, TASK-005, TASK-033 | — |
| [] | [TASK-040](TASK-040.md) | Report moderation and sanctions | `todo` | `current` | M4 | TASK-006, TASK-037 | Waiting for TASK-006, TASK-037 | — |
| [] | [TASK-041](TASK-041.md) | Order and review moderation | `todo` | `current` | M4 | TASK-033, TASK-036 | Waiting for TASK-033, TASK-036 | — |
| [] | [TASK-042](TASK-042.md) | Dispute resolution | `todo` | `current` | M4 | TASK-025, TASK-038 | Waiting for TASK-025, TASK-038 | — |
| [!] | [TASK-043](TASK-043.md) | Partial refunds in disputes | `blocked` | `current` | M4 | TASK-042 | Awaiting decision D-106 (proposed) | — |
| [] | [TASK-044](TASK-044.md) | Admin user management | `todo` | `current` | M5 | TASK-005, TASK-006 | Waiting for TASK-005, TASK-006 | — |
| [] | [TASK-045](TASK-045.md) | Admin restrictions, moderator lock and dashboard | `todo` | `current` | M5 | TASK-039, TASK-044 | Waiting for TASK-039, TASK-044 | — |
| [] | [TASK-046](TASK-046.md) | Order lifecycle jobs | `todo` | `current` | M5 | TASK-025, TASK-033 | Waiting for TASK-025, TASK-033 | — |
| [!] | [TASK-047](TASK-047.md) | Listing expiry job | `blocked` | `current` | M5 | TASK-018 | Awaiting decision D-107 (proposed) | — |
| [!] | [TASK-048](TASK-048.md) | Listing pre-publication moderation | `blocked` | `current` | M5 | TASK-018, TASK-040 | Awaiting decision D-103 (proposed) | — |
| [] | [TASK-049](TASK-049.md) | Authorization, privacy and coverage gates | `todo` | `current` | M5 | TASK-016, TASK-022, TASK-029, TASK-034, TASK-035, TASK-036, TASK-037, TASK-042, TASK-045 | Waiting for TASK-016, TASK-022, TASK-029, TASK-034, TASK-035, TASK-036, TASK-037, TASK-042, TASK-045 | — |
| [] | [TASK-050](TASK-050.md) | Audit logging | `todo` | `current` | M5 | TASK-029, TASK-040, TASK-041, TASK-042, TASK-045 | Waiting for TASK-029, TASK-040, TASK-041, TASK-042, TASK-045 | — |
| [] | [TASK-051](TASK-051.md) | API documentation | `todo` | `current` | M5 | TASK-049 | Waiting for TASK-049 | — |
| [] | [TASK-052](TASK-052.md) | Performance baseline | `todo` | `current` | M5 | TASK-049 | Waiting for TASK-049 | — |

## Milestones

| Milestone | Tasks | Done |
|---|---|---|
| M0 Scaffold | TASK-001 … TASK-002 | 1/2 |
| M1 Platform and identity | TASK-003 … TASK-016 | 0/14 |
| M2 Catalog and chat | TASK-017 … TASK-023 | 0/7 |
| M3 Money and orders | TASK-024 … TASK-036 | 0/13 |
| M4 Trust and moderation | TASK-037 … TASK-043 | 0/7 |
| M5 Administration and operations | TASK-044 … TASK-052 | 0/9 |

## Open decisions

| Decision | Question | Recommendation | Blocks |
|---|---|---|---|
| D-101 | Two-factor login: keep as a per-user opt-in or retire FR-AUTH-04 | Keep as opt-in per user | TASK-015 |
| D-102 | VNPay: keep alongside SePay or retire FR-PAY-04 | Retire VNPay; SePay only | TASK-027 |
| D-103 | Listings: publish immediately or require moderator approval before publishing | Publish immediately (baseline) | TASK-048 |
| D-104 | Payment window after order confirmation (baseline 3 minutes) | 15 minutes | none |
| D-105 | Withdrawal approval owner | Admin and moderator through one flow | TASK-029 |
| D-106 | Partial refunds in dispute resolution | Implement partial_refund | TASK-043 |
| D-107 | Listing expiry handling after the maximum age | Soft expire (status expired) | TASK-047 |
| D-108 | Shared store (for example Redis) for one-time codes, rate limits and socket presence | Single instance, in-memory adapter until horizontal scaling is needed | none |
| D-109 | Token revocation and refresh strategy | Stateless JWT (baseline) for the first release | none |
