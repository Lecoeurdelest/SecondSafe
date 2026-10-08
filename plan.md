# SecondSafe — Project Plan

SecondSafe is a second-hand marketplace where the buyer's money is held in escrow until the buyer confirms receipt. Moderators handle reports and disputes. This plan is the maintained statement of intent. `project.yaml` compiles it into requirements, decisions and tasks, and `.project/state.json` records execution.

<!-- BEGIN GENERATED: progress -->
**Progress (generated):** 6/73 tasks done (6 done, 2 verifying, 6 blocked, 2 ready, 57 todo). 156 active requirements, 231 acceptance criteria. See [docs/task/README.md](docs/task/README.md).
<!-- END GENERATED: progress -->

## 1. Purpose

Migrate the frontend and rebuild the backend of the WDP marketplace (baseline `Trungnc273/WDP@1cea2b7`, product name ReFlow) as **SecondSafe**. The rebuild starts from the accepted database layer and fixes the defects found during the requirement review before the business logic is written.

Success means:

- every functional and quality requirement in section 4 and 5 is mapped to a task with verifiable acceptance criteria;
- money moves only through the escrow and wallet ledger (INV-01);
- each task closes with an implementation record and original evidence.

## 2. Scope

**In scope (D-009):** React web frontend, REST API under `/api`, Socket.IO real-time channel, scheduled jobs, MongoDB data layer, seed and maintenance scripts, automated tests, technical documentation.

**Out of scope (D-009 supersedes D-002):** mobile apps, infrastructure provisioning, carrier integrations and automated bank transfers.

**Starting point (D-003, D-004):** all Mongoose schemas, database configuration, seeds and data scripts are carried from the baseline. Every route, controller, service, middleware and utility file exists as an empty stub, except the chat encryption helper required by the data migration script.

## 3. Actors

| Actor | Description |
|---|---|
| Guest | Browses listings and public profiles without an account |
| User | One account role (`user`) acting as **buyer** or **seller** depending on context |
| Moderator | Resolves reports, reviews, disputes and order issues |
| Admin | Manages accounts and has every moderator capability |
| System | Scheduled jobs and internal services |
| SePay / VNPay | Payment gateways that notify the backend |

## 4. Functional scope

### 4.1 Identity and access

Users register with email verification, log in with email and password or Google, change and recover passwords, and optionally confirm logins with an emailed code (D-101). Access is role-based. Suspension and selling restriction are evaluated on every request by one shared service. Login and recovery never reveal whether an account exists. Requirements: FR-AUTH-01 … FR-AUTH-10.

### 4.2 Profiles

Users and moderators manage their profile (name, phone, structured address, avatar). Anyone can read a public profile that excludes contact data. Requirements: FR-PROF-01 … FR-PROF-04, FR-MOD-09.

### 4.3 Listings and catalog

Sellers publish listings with images, categories, condition and location. Listings are published immediately unless D-103 adopts pre-publication moderation (FR-PROD-09). Reserved, sold or order-linked listings are read-only. Buyers browse, search, filter and keep favorites. Requirements: FR-PROD-01 … FR-PROD-09, FR-BROW-01 … FR-BROW-03, FR-FAV-01 … FR-FAV-02.

### 4.4 Chat and negotiation

Buyer and seller talk in one conversation per listing, in real time, with images. Message content is encrypted at rest. Either side can place a price offer inside the conversation. Requirements: FR-CHAT-01 … FR-CHAT-05.

### 4.5 Orders

An order starts from an accepted purchase request, an accepted offer, or a quick buy. It then follows the lifecycle in `docs/technical/order-lifecycle.md`: seller confirmation → payment into escrow → shipping → delivery → buyer confirmation, with cancellation and dispute branches. Requirements: FR-ORD-01 … FR-ORD-12.

### 4.6 Wallet, payments and escrow

Each user has a wallet ledger. Users top up through SePay (VNPay depends on D-102), pay orders into escrow, and withdraw through one approval flow (D-105). The platform fee is deducted from the seller payout. Requirements: FR-PAY-01 … FR-PAY-07.

### 4.7 Delivery

The seller records the carrier, tracking number and status history. Only the order parties and staff can read them. Requirements: FR-SHIP-01 … FR-SHIP-03.

### 4.8 Reviews

After completion the buyer rates the seller once, with optional evidence. Ratings are recalculated automatically. Requirements: FR-REV-01 … FR-REV-05.

### 4.9 Reports and disputes

Users report listings and users. Repeated reports restrict a seller automatically. Buyers dispute shipped or delivered orders; both sides add evidence while a moderator investigates. Requirements: FR-RPT-01 … FR-RPT-05, FR-DSP-01 … FR-DSP-05.

### 4.10 Notifications

Domain events create stored notifications that are pushed in real time. Transactional email covers verification and recovery codes. Requirements: FR-NOTI-01 … FR-NOTI-04.

### 4.11 Moderation

Moderators work from a dashboard. They resolve reports with graded sanctions, correct order states within the transition matrix, judge reviews, and settle disputes by refund, release, or a partial refund (D-106). Requirements: FR-MOD-01 … FR-MOD-10.

### 4.12 Administration

Admins manage accounts, create moderators, restrict sellers, lock moderators and read platform statistics. Requirements: FR-ADM-01 … FR-ADM-08.

### 4.13 Scheduled jobs and data operations

Jobs cancel unpaid orders, refund unshipped orders, complete delivered orders and expire old listings (D-107). Scripts seed, verify, index, migrate and create the first admin. Requirements: FR-SYS-01 … FR-SYS-06 (FR-SYS-05 retired).

## 5. Quality requirements

Security (NFR-SEC-01 … NFR-SEC-12), data protection (NFR-DATA-01), reliability (NFR-REL-01 … NFR-REL-06), performance (NFR-PERF-01 … NFR-PERF-05), usability of the API (NFR-USA-01, NFR-USA-03), portability (NFR-COMP-02), integrations (NFR-INT-01), maintainability (NFR-MNT-01 … NFR-MNT-05), observability (NFR-OBS-01) and business-rule configuration (NFR-BIZ-01, NFR-BIZ-02). NFR-USA-02 and NFR-COMP-01 were deferred in the original backend scaffold; frontend accessibility and responsive compatibility are restored through D-009 and FR-WEB tasks.

## 6. Global invariants

| ID | Invariant |
|---|---|
| INV-01 | Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once. |
| INV-02 | A listing has at most one active order and is reserved while that order is open. |
| INV-03 | A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden. |
| INV-04 | Admin accounts are never suspended, restricted, locked or deleted by platform rules. |
| INV-05 | Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins. |
| INV-06 | Passwords exist only as bcrypt hashes and never leave the service. |
| INV-07 | Order status changes only along the documented lifecycle edges. |
| INV-08 | All amounts are integer VND. |

## 7. Business constants

Baseline values become configuration defaults (NFR-BIZ-01, NFR-BIZ-02).

| Constant | Default | Source |
|---|---|---|
| Platform fee rate | 5% of agreed amount, deducted from seller payout | WDP order.service.js |
| Top-up bounds | 10,000 – 500,000,000 VND | WDP sepay/vnpay services |
| Minimum withdrawal | 50,000 VND | WDP wallet.service.js |
| OTP lifetime | 5 minutes | WDP otp.manager.js |
| Payment window | 3 minutes (D-104 proposes 15) | WDP order.service.js |
| Shipping window before automatic refund | 24 hours | WDP cron.service.js |
| Automatic completion after delivery | 5 days | WDP escrow.service.js |
| Maximum listing age | 30 days | WDP cron.service.js |
| Reset credential lifetime | 1 hour | WDP auth.service.js |
| JWT lifetime | 7 days | WDP jwt.util.js |
| Automatic restriction threshold | 3 non-dismissed reports | WDP report.service.js |
| Sanction ladder | 24 hours → 1 week → 1 year at 3/6/9 | WDP report.service.js, moderator.service.js |
| Dispute violation restriction | 30 days at 3 violations | WDP moderator.service.js |

## 8. Decisions

Accepted: D-001 stack, D-002 backend-only scope, D-003 schema contract, D-004 empty logic stubs, D-005 English artifacts, D-006 control framework, D-007 single author, D-008 baseline API prefixes.

Proposed. Tasks that depend on an open decision stay blocked until the decision is accepted:

| ID | Question | Recommendation | Blocks |
|---|---|---|---|
| D-101 | Keep two-factor login? | Keep as per-user opt-in | TASK-015 |
| D-102 | Keep VNPay? | Retire; SePay only | TASK-027 |
| D-103 | Moderate listings before publishing? | Publish immediately | TASK-048 |
| D-104 | Payment window | 15 minutes | none (configuration) |
| D-105 | Who approves withdrawals? | Admin and moderator through one flow | TASK-029 |
| D-106 | Partial refunds in disputes? | Implement | TASK-043 |
| D-107 | Expired listings | Soft expire (status `expired`) | TASK-047 |
| D-108 | Shared store for codes, limits, presence | In-memory until scaling | none (adapter boundary) |
| D-109 | Token revocation | Stateless JWT for the first release | none |

## 9. Baseline and carry-over

`docs/technical/baseline-wdp.md` lists what was carried, what was changed, and how each defect from the tracking workbook (DEF-01 … DEF-22, plus DEF-23 found during scaffolding) is handled.

## 10. Milestones

| Milestone | Tasks | Outcome |
|---|---|---|
| M0 Scaffold | TASK-001 … TASK-002 | Database layer verified, control framework in place |
| M1 Platform and identity | TASK-003 … TASK-016 | Secure foundation, accounts, profiles, notifications |
| M2 Catalog and chat | TASK-017 … TASK-023 | Listings, search, favorites, real-time chat |
| M3 Money and orders | TASK-024 … TASK-036 | Wallet, escrow, gateways, order lifecycle, delivery, reviews |
| M4 Trust and moderation | TASK-037 … TASK-043 | Reports, disputes, moderation console |
| M5 Administration and operations | TASK-044 … TASK-052 | Admin tools, jobs, quality gates, documentation, performance |

## 11. Non-goals

- Importing baseline defects without review against the accepted criteria.
- Production deployment without a separate release request.
- Automatic bank payouts, carrier APIs, recommendation features.

## 12. Migration amendment (2026-10-09)

The user requests migration of WDP into SecondSafe through small frontend and backend tasks, documented in the repository and tracked with a separate PR per task under Gitflow. The existing backend task IDs, acceptance criteria, schemas and evidence history remain authoritative. D-009 supersedes the earlier backend-only scope D-002. D-004 describes the historical scaffold; D-010 permits adapting source implementations while preserving all current behavioral requirements and fixing the reviewed defects.

TASK-053 establishes the migration inventory and delivery conventions. TASK-054 through TASK-072 migrate the React client in bounded feature slices. TASK-073 verifies the complete integration. Each task includes its source paths, dependencies, exclusions and observable criteria. The five-hour splitting guideline applies; full-stack integration is explicitly a broader final gate. Source and destination are pinned in `docs/technical/migration-wdp.md`.

The review-size amendment of 2026-10-09 permits a task to use explicitly stacked dependency, asset and behavior PRs, aiming for at most 500 changed lines of authored implementation per PR. TASK-054 uses PR #83 for dependencies, #84 for styles/assets and #79 for runtime/API behavior and final acceptance. Generated lockfiles and raw runner output remain available separately from the authored review. Only the final task PR closes its issue; prerequisite slices are recorded in `.project/delivery.json` under `supporting_prs`.

`main` remains stable, `develop` is the integration base, and `codex/feature/task-NNN-<description>` holds each task. Independent PRs target `develop`; dependent work may use a clearly documented stacked PR until its prerequisite is merged, then retarget to `develop`. PR creation is authorized. PRs remain open for review unless the user separately authorizes merging. Release and hotfix branches follow `docs/technical/gitflow.md`.

Every new commit author, committer and PR author is Lecoeurdelest, with no co-author or generated attribution. Pre-existing history, including PR #1 by another contributor, is preserved. GitHub issue/PR mappings live in `.project/delivery.json` and are rendered in the task index. A feature copied from WDP is not complete until its current criteria are evidenced. Provider-dependent payment, SMTP and Google checks require sandbox configuration; missing evidence remains visible.

The initial destination inspection finds an app-start regression: the merged orders routes call authentication and seller guards that are still stubs. TASK-001 is marked `needs_revalidation` with historical evidence retained. TASK-003 restores fail-closed HTTP startup while TASK-005/TASK-006 supply the guards. The repair must never expose orders without authentication.
