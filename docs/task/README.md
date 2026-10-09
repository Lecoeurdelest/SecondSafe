# Tasks

This index is generated from `.project/state.json` and `project.yaml` by `tools/pdd/render.py`. Update the execution record first; never hand-edit a marker.

## Status legend

- `[]` — `todo` or `ready`
- `[!]` — `in_progress`, `verifying`, `blocked`, or `needs_revalidation`
- `[x]` — `done` with current evidence

## Status

| Status | ID | Title | Execution | Relevance | Milestone | Depends on | Detail | Evidence | Delivery |
|---|---|---|---|---|---|---|---|---|---|
| [x] | [TASK-001](TASK-001.md) | Scaffold the backend database layer and control framework | `done` | `superseded` | M0 | — | Historical empty scaffold superseded by D-009/D-010 migration; original evidence retained; current schema and boot regression checks pass in TASK-003 | [run-01](../../.project/evidence/TASK-001/run-01/report.json) | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/2) |
| [x] | [TASK-002](TASK-002.md) | Verify database scripts against MongoDB | `done` | `current` | M0 | TASK-001 | MongoDB 7.0.24 replica-set verification passes: all five scripts, 16-model indexes, seeded data and hashed admin; 43 backend tests pass | [run-02](../../.project/evidence/TASK-002/run-02/report.json) | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/3), [PR](https://github.com/Lecoeurdelest/SecondSafe/pull/91) |
| [x] | [TASK-003](TASK-003.md) | HTTP foundation | `done` | `current` | M1 | TASK-001 | HTTP platform/scaffold manually verified: 23 tests pass; orders fail closed while guards are unavailable; no domain-confidence claim | [run-01](../../.project/evidence/TASK-003/run-01/report.json) | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/4), [PR](https://github.com/Lecoeurdelest/SecondSafe/pull/89) |
| [x] | [TASK-004](TASK-004.md) | Business configuration module | `done` | `current` | M1 | TASK-001 | Validated baseline money/time defaults and documented environment overrides; all 43 backend tests pass | [run-01](../../.project/evidence/TASK-004/run-01/report.json) | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/5), [PR](https://github.com/Lecoeurdelest/SecondSafe/pull/90) |
| [] | [TASK-005](TASK-005.md) | JWT authentication middleware and role guards | `ready` | `current` | M1 | TASK-003 | Dependencies complete; ready to implement and verify | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/6), [PR](https://github.com/Lecoeurdelest/SecondSafe/pull/95) |
| [] | [TASK-006](TASK-006.md) | Account suspension and selling-restriction service | `todo` | `current` | M1 | TASK-005 | Waiting for TASK-005 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/7) |
| [] | [TASK-007](TASK-007.md) | Email delivery and one-time code store | `ready` | `current` | M1 | TASK-003, TASK-004 | Dependencies complete; ready to implement and verify | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/8), [PR](https://github.com/Lecoeurdelest/SecondSafe/pull/96) |
| [] | [TASK-008](TASK-008.md) | Rate limiting for authentication endpoints | `ready` | `current` | M1 | TASK-003 | Dependencies complete; ready to implement and verify | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/9), [PR](https://github.com/Lecoeurdelest/SecondSafe/pull/98) |
| [] | [TASK-009](TASK-009.md) | Media upload pipeline | `todo` | `current` | M1 | TASK-005 | Waiting for TASK-005 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/10) |
| [] | [TASK-010](TASK-010.md) | Notifications | `todo` | `current` | M1 | TASK-005 | Waiting for TASK-005 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/11) |
| [] | [TASK-011](TASK-011.md) | Registration with email verification | `todo` | `current` | M1 | TASK-007, TASK-008 | Waiting for TASK-007, TASK-008 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/12) |
| [] | [TASK-012](TASK-012.md) | Login and logout | `todo` | `current` | M1 | TASK-006, TASK-008 | Waiting for TASK-006, TASK-008 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/13) |
| [] | [TASK-013](TASK-013.md) | Google sign-in | `todo` | `current` | M1 | TASK-006 | Waiting for TASK-006 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/14) |
| [] | [TASK-014](TASK-014.md) | Password change and recovery | `todo` | `current` | M1 | TASK-007, TASK-008, TASK-010, TASK-012 | Waiting for TASK-007, TASK-008, TASK-010, TASK-012 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/15) |
| [!] | [TASK-015](TASK-015.md) | Optional two-factor login | `blocked` | `current` | M1 | TASK-007, TASK-012 | Awaiting decision D-101 (proposed) | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/16) |
| [] | [TASK-016](TASK-016.md) | Profiles and public profile | `todo` | `current` | M1 | TASK-005, TASK-009 | Waiting for TASK-005, TASK-009 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/17) |
| [] | [TASK-017](TASK-017.md) | Categories API | `ready` | `current` | M2 | TASK-003 | Dependencies complete; ready to implement and verify | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/18), [PR](https://github.com/Lecoeurdelest/SecondSafe/pull/97) |
| [] | [TASK-018](TASK-018.md) | Listing management | `todo` | `current` | M2 | TASK-006, TASK-009, TASK-017 | Waiting for TASK-006, TASK-009, TASK-017 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/19) |
| [] | [TASK-019](TASK-019.md) | Listing detail and seller listings | `todo` | `current` | M2 | TASK-018 | Waiting for TASK-018 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/20) |
| [] | [TASK-020](TASK-020.md) | Browse, search and filter | `todo` | `current` | M2 | TASK-018 | Waiting for TASK-018 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/21) |
| [] | [TASK-021](TASK-021.md) | Favorites | `todo` | `current` | M2 | TASK-018 | Waiting for TASK-018 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/22) |
| [] | [TASK-022](TASK-022.md) | Conversations and messages | `todo` | `current` | M2 | TASK-005, TASK-009, TASK-018 | Waiting for TASK-005, TASK-009, TASK-018 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/23) |
| [] | [TASK-023](TASK-023.md) | Realtime gateway | `todo` | `current` | M2 | TASK-010, TASK-022 | Waiting for TASK-010, TASK-022 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/24) |
| [] | [TASK-024](TASK-024.md) | Wallet ledger | `todo` | `current` | M3 | TASK-004, TASK-005 | Waiting for TASK-004, TASK-005 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/25) |
| [] | [TASK-025](TASK-025.md) | Escrow service | `todo` | `current` | M3 | TASK-024 | Waiting for TASK-024 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/26) |
| [] | [TASK-026](TASK-026.md) | SePay top-up and payment notifications | `todo` | `current` | M3 | TASK-010, TASK-024 | Waiting for TASK-010, TASK-024 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/27) |
| [!] | [TASK-027](TASK-027.md) | VNPay top-up | `blocked` | `current` | M3 | TASK-024 | Awaiting decision D-102 (proposed) | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/28) |
| [] | [TASK-028](TASK-028.md) | Withdrawal requests | `todo` | `current` | M3 | TASK-024 | Waiting for TASK-024 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/29) |
| [!] | [TASK-029](TASK-029.md) | Withdrawal approval | `blocked` | `current` | M3 | TASK-010, TASK-028 | Awaiting decision D-105 (proposed) | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/30) |
| [] | [TASK-030](TASK-030.md) | Purchase requests and quick buy | `todo` | `current` | M3 | TASK-006, TASK-010, TASK-016, TASK-018 | Waiting for TASK-006, TASK-010, TASK-016, TASK-018 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/31) |
| [] | [TASK-031](TASK-031.md) | Price offers in chat | `todo` | `current` | M3 | TASK-022, TASK-030 | Waiting for TASK-022, TASK-030 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/32) |
| [] | [TASK-032](TASK-032.md) | Order confirmation and payment | `todo` | `current` | M3 | TASK-025, TASK-026, TASK-030 | Waiting for TASK-025, TASK-026, TASK-030 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/33) |
| [] | [TASK-033](TASK-033.md) | Order fulfilment and cancellation | `todo` | `current` | M3 | TASK-025, TASK-032 | Waiting for TASK-025, TASK-032 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/34) |
| [] | [TASK-034](TASK-034.md) | Order queries | `todo` | `current` | M3 | TASK-030 | Waiting for TASK-030 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/35) |
| [] | [TASK-035](TASK-035.md) | Delivery tracking | `todo` | `current` | M3 | TASK-033 | Waiting for TASK-033 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/36) |
| [] | [TASK-036](TASK-036.md) | Reviews and rating statistics | `todo` | `current` | M3 | TASK-009, TASK-033 | Waiting for TASK-009, TASK-033 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/37) |
| [] | [TASK-037](TASK-037.md) | Violation reports | `todo` | `current` | M4 | TASK-006, TASK-009, TASK-010 | Waiting for TASK-006, TASK-009, TASK-010 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/38) |
| [] | [TASK-038](TASK-038.md) | Disputes for buyers and sellers | `todo` | `current` | M4 | TASK-009, TASK-010, TASK-033 | Waiting for TASK-009, TASK-010, TASK-033 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/39) |
| [] | [TASK-039](TASK-039.md) | Moderator dashboard and revenue report | `todo` | `current` | M4 | TASK-004, TASK-005, TASK-033 | Waiting for TASK-004, TASK-005, TASK-033 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/40) |
| [] | [TASK-040](TASK-040.md) | Report moderation and sanctions | `todo` | `current` | M4 | TASK-006, TASK-037 | Waiting for TASK-006, TASK-037 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/41) |
| [] | [TASK-041](TASK-041.md) | Order and review moderation | `todo` | `current` | M4 | TASK-033, TASK-036 | Waiting for TASK-033, TASK-036 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/42) |
| [] | [TASK-042](TASK-042.md) | Dispute resolution | `todo` | `current` | M4 | TASK-025, TASK-038 | Waiting for TASK-025, TASK-038 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/43) |
| [!] | [TASK-043](TASK-043.md) | Partial refunds in disputes | `blocked` | `current` | M4 | TASK-042 | Awaiting decision D-106 (proposed) | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/44) |
| [] | [TASK-044](TASK-044.md) | Admin user management | `todo` | `current` | M5 | TASK-005, TASK-006 | Waiting for TASK-005, TASK-006 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/45) |
| [] | [TASK-045](TASK-045.md) | Admin restrictions, moderator lock and dashboard | `todo` | `current` | M5 | TASK-039, TASK-044 | Waiting for TASK-039, TASK-044 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/46) |
| [] | [TASK-046](TASK-046.md) | Order lifecycle jobs | `todo` | `current` | M5 | TASK-025, TASK-033 | Waiting for TASK-025, TASK-033 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/47) |
| [!] | [TASK-047](TASK-047.md) | Listing expiry job | `blocked` | `current` | M5 | TASK-018 | Awaiting decision D-107 (proposed) | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/48) |
| [!] | [TASK-048](TASK-048.md) | Listing pre-publication moderation | `blocked` | `current` | M5 | TASK-018, TASK-040 | Awaiting decision D-103 (proposed) | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/49) |
| [] | [TASK-049](TASK-049.md) | Authorization, privacy and coverage gates | `todo` | `current` | M5 | TASK-016, TASK-022, TASK-029, TASK-034, TASK-035, TASK-036, TASK-037, TASK-042, TASK-045 | Waiting for TASK-016, TASK-022, TASK-029, TASK-034, TASK-035, TASK-036, TASK-037, TASK-042, TASK-045 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/50) |
| [] | [TASK-050](TASK-050.md) | Audit logging | `todo` | `current` | M5 | TASK-029, TASK-040, TASK-041, TASK-042, TASK-045 | Waiting for TASK-029, TASK-040, TASK-041, TASK-042, TASK-045 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/51) |
| [] | [TASK-051](TASK-051.md) | API documentation | `todo` | `current` | M5 | TASK-049 | Waiting for TASK-049 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/52) |
| [] | [TASK-052](TASK-052.md) | Performance baseline | `todo` | `current` | M5 | TASK-049 | Waiting for TASK-049 | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/53) |
| [x] | [TASK-053](TASK-053.md) | Migration inventory, FE task decomposition and Gitflow delivery | `done` | `current` | M6 | — | 73 task issues created; 52 BE definitions preserved; 21 migration/web/integration tasks and sole-author Gitflow checks validated | [run-03](../../.project/evidence/TASK-053/run-03/report.json) | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/54), [PR](https://github.com/Lecoeurdelest/SecondSafe/pull/88), [PR slice 1](https://github.com/Lecoeurdelest/SecondSafe/pull/99) |
| [x] | [TASK-054](TASK-054.md) | Web runtime, API client and application shell | `done` | `current` | M7 | TASK-053 | React shell installs from lockfile; 9 FE and 43 BE tests pass; production build and manual 360/1920 px checks pass | [run-01](../../.project/evidence/TASK-054/run-01/report.json) | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/55), [PR](https://github.com/Lecoeurdelest/SecondSafe/pull/94), [PR slice 1](https://github.com/Lecoeurdelest/SecondSafe/pull/92), [PR slice 2](https://github.com/Lecoeurdelest/SecondSafe/pull/93) |
| [] | [TASK-055](TASK-055.md) | Web authentication, session and route guards | `todo` | `current` | M7 | TASK-054, TASK-011, TASK-012, TASK-013, TASK-014 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/56) |
| [] | [TASK-056](TASK-056.md) | Web profile, password and public seller pages | `todo` | `current` | M7 | TASK-055, TASK-016 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/57) |
| [] | [TASK-057](TASK-057.md) | Web home, catalog search and filters | `todo` | `current` | M7 | TASK-054, TASK-017, TASK-020 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/58) |
| [] | [TASK-058](TASK-058.md) | Web seller listing creation and management | `todo` | `current` | M7 | TASK-055, TASK-057, TASK-018 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/59) |
| [] | [TASK-059](TASK-059.md) | Web listing detail and favorites | `todo` | `current` | M7 | TASK-055, TASK-057, TASK-019, TASK-021 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/60) |
| [] | [TASK-060](TASK-060.md) | Web notification inbox | `todo` | `current` | M7 | TASK-055, TASK-010, TASK-023 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/61) |
| [] | [TASK-061](TASK-061.md) | Web conversations, images and price offers | `todo` | `current` | M7 | TASK-055, TASK-059, TASK-022, TASK-023, TASK-031 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/62) |
| [] | [TASK-062](TASK-062.md) | Web purchase requests and checkout | `todo` | `current` | M7 | TASK-055, TASK-059, TASK-030 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/63) |
| [] | [TASK-063](TASK-063.md) | Web order lists, payment and fulfilment | `todo` | `current` | M7 | TASK-062, TASK-032, TASK-033, TASK-034, TASK-035 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/64) |
| [] | [TASK-064](TASK-064.md) | Web wallet, top-up and withdrawal | `todo` | `current` | M7 | TASK-055, TASK-024, TASK-026, TASK-028, TASK-029 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/65) |
| [] | [TASK-065](TASK-065.md) | Web seller reviews and ratings | `todo` | `current` | M7 | TASK-056, TASK-063, TASK-036 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/66) |
| [] | [TASK-066](TASK-066.md) | Web violation reports and disputes | `todo` | `current` | M7 | TASK-055, TASK-063, TASK-037, TASK-038 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/67) |
| [] | [TASK-067](TASK-067.md) | Web moderator shell, dashboard and profile | `todo` | `current` | M7 | TASK-055, TASK-039 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/68) |
| [] | [TASK-068](TASK-068.md) | Web moderator report, order and review queues | `todo` | `current` | M7 | TASK-067, TASK-040, TASK-041 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/69) |
| [] | [TASK-069](TASK-069.md) | Web moderator disputes and withdrawals | `todo` | `current` | M7 | TASK-067, TASK-029, TASK-042 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/70) |
| [] | [TASK-070](TASK-070.md) | Web admin shell, dashboard and user management | `todo` | `current` | M7 | TASK-055, TASK-044, TASK-045 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/71) |
| [] | [TASK-071](TASK-071.md) | Web admin order, review and report queues | `todo` | `current` | M7 | TASK-070, TASK-040, TASK-041 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/72) |
| [] | [TASK-072](TASK-072.md) | Web admin disputes, withdrawals and revenue | `todo` | `current` | M7 | TASK-070, TASK-029, TASK-039, TASK-042 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/73) |
| [] | [TASK-073](TASK-073.md) | Full-stack migration integration and release checks | `todo` | `current` | M8 | TASK-002, TASK-049, TASK-050, TASK-051, TASK-052, TASK-055, TASK-056, TASK-057, TASK-058, TASK-059, TASK-060, TASK-061, TASK-062, TASK-063, TASK-064, TASK-065, TASK-066, TASK-067, TASK-068, TASK-069, TASK-070, TASK-071, TASK-072 | Waiting for dependencies and feature integration evidence | — | [ISSUE](https://github.com/Lecoeurdelest/SecondSafe/issues/74) |

## Milestones

| Milestone | Tasks | Done |
|---|---|---|
| M0 Scaffold | TASK-001 … TASK-002 | 2/2 |
| M1 Platform and identity | TASK-003 … TASK-016 | 2/14 |
| M2 Catalog and chat | TASK-017 … TASK-023 | 0/7 |
| M3 Money and orders | TASK-024 … TASK-036 | 0/13 |
| M4 Trust and moderation | TASK-037 … TASK-043 | 0/7 |
| M5 Administration and operations | TASK-044 … TASK-052 | 0/9 |
| M6 Migration control | TASK-053 … TASK-053 | 1/1 |
| M7 Web client | TASK-054 … TASK-072 | 1/19 |
| M8 Full-stack integration | TASK-073 … TASK-073 | 0/1 |

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
