# NFR — Quality requirements

Generated from `project.yaml`. Edit the model, not this file.

### NFR-SEC-01 — Password storage

Risk: `critical` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-SEC-01-1` | Passwords are stored only as bcrypt hashes with cost at least 10. | static flow review, behavioral test | [TASK-011](../task/TASK-011.md) `[]` |
| `AC-NFR-SEC-01-2` | No API response contains a password or password hash field. | behavioral test | [TASK-049](../task/TASK-049.md) `[]` |

### NFR-SEC-02 — One strong password policy

Risk: `critical` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-SEC-02-1` | Registration uses the shared policy: at least 8 characters with upper case, lower case, digit and special character. | behavioral test | [TASK-011](../task/TASK-011.md) `[]` |
| `AC-NFR-SEC-02-2` | Admin account creation uses the shared policy. | behavioral test | [TASK-044](../task/TASK-044.md) `[]` |
| `AC-NFR-SEC-02-3` | Password change and reset use the shared policy. | behavioral test | [TASK-014](../task/TASK-014.md) `[]` |
| `AC-NFR-SEC-02-4` | The create-admin script refuses a password that violates the policy. | behavioral test | [TASK-001](../task/TASK-001.md) `[x]` |

### NFR-SEC-03 — Token authentication

Risk: `critical` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-SEC-03-1` | REST authentication verifies JWTs signed with JWT_SECRET and enforces the configured expiry. | behavioral test | [TASK-005](../task/TASK-005.md) `[]` |
| `AC-NFR-SEC-03-2` | Socket.IO connections are authenticated with the same JWT verification. | behavioral test | [TASK-023](../task/TASK-023.md) `[]` |

### NFR-SEC-04 — Object-level authorization

Risk: `critical` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-SEC-04-1` | Automated tests cover every endpoint that reads or writes another user's orders, deliveries, disputes, reports, conversations, reviews or wallet data, and each returns 403 or 404 to non-parties. | behavioral test | [TASK-049](../task/TASK-049.md) `[]` |

### NFR-SEC-05 — Abuse protection for authentication

Risk: `critical` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-SEC-05-1` | Login, code requests, code verification and password recovery are rate limited (default 5 per minute per IP and email) and return 429 when exceeded. | behavioral test | [TASK-008](../task/TASK-008.md) `[]` |
| `AC-NFR-SEC-05-2` | A one-time code is invalidated after 5 wrong attempts. | behavioral test | [TASK-007](../task/TASK-007.md) `[]` |

### NFR-SEC-06 — Payment webhook security

Risk: `critical` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-SEC-06-1` | Webhook secrets are never logged and are accepted only from headers. | static flow review | [TASK-026](../task/TASK-026.md) `[]` |
| `AC-NFR-SEC-06-2` | VNPay responses are accepted only with a valid signature. | behavioral test | [TASK-027](../task/TASK-027.md) `[!]` |

### NFR-SEC-07 — Chat encryption at rest

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-SEC-07-1` | Chat content is stored with AES-256-GCM using the required CHAT_ENCRYPTION_KEY (no fallback to JWT_SECRET), and legacy plaintext messages remain readable. | behavioral test | [TASK-022](../task/TASK-022.md) `[]` |

### NFR-SEC-08 — Secrets management

Risk: `critical` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-SEC-08-1` | The repository contains no credentials, .env.example lists every variable, and startup fails when MONGODB_URI or JWT_SECRET is missing. | static flow review, behavioral test | [TASK-001](../task/TASK-001.md) `[x]` |

### NFR-SEC-09 — Safe file uploads

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-SEC-09-1` | Uploads are checked by file signature as well as extension and respect the size limits of each bucket. | behavioral test | [TASK-009](../task/TASK-009.md) `[]` |
| `AC-NFR-SEC-09-2` | Dispute and report evidence is served only to the related parties, moderators and admins. | behavioral test | [TASK-009](../task/TASK-009.md) `[]` |

### NFR-SEC-10 — No account enumeration

Risk: `critical` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-SEC-10-1` | Login responses do not reveal whether an account exists or is suspended before the password is verified. | behavioral test | [TASK-012](../task/TASK-012.md) `[]` |
| `AC-NFR-SEC-10-2` | Password recovery responses do not reveal whether an account exists. | behavioral test | [TASK-014](../task/TASK-014.md) `[]` |

### NFR-SEC-11 — CORS and security headers

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-SEC-11-1` | CORS is configured once and allows only FRONTEND_URL, and security headers are applied to every response. | behavioral test | [TASK-003](../task/TASK-003.md) `[x]` |

### NFR-SEC-12 — Safe regular expressions

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-SEC-12-1` | Listing search escapes user input before building a regular expression. | behavioral test | [TASK-020](../task/TASK-020.md) `[]` |
| `AC-NFR-SEC-12-2` | Admin user search escapes user input before building a regular expression. | behavioral test | [TASK-044](../task/TASK-044.md) `[]` |

### NFR-DATA-01 — Personal data protection

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-DATA-01-1` | Public and non-party responses exclude email, phone, address and bank data. | behavioral test | [TASK-049](../task/TASK-049.md) `[]` |

### NFR-REL-01 — Atomic money and order changes

Risk: `critical` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-REL-01-1` | Escrow hold, release and refund update wallet, transaction and escrow documents in one MongoDB transaction. | static flow review, behavioral test | [TASK-025](../task/TASK-025.md) `[]` |
| `AC-NFR-REL-01-2` | Order payment updates the order and escrow in the same transaction. | static flow review, behavioral test | [TASK-032](../task/TASK-032.md) `[]` |
| `AC-NFR-REL-01-3` | Fulfilment and cancellation update order, listing and escrow in one transaction. | static flow review, behavioral test | [TASK-033](../task/TASK-033.md) `[]` |

### NFR-REL-02 — Idempotent financial operations

Risk: `critical` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-REL-02-1` | Repeating an escrow release or refund has no additional effect. | static flow review, behavioral test | [TASK-025](../task/TASK-025.md) `[]` |
| `AC-NFR-REL-02-2` | Repeating a payment notification has no additional effect. | static flow review, behavioral test | [TASK-026](../task/TASK-026.md) `[]` |

### NFR-REL-03 — Reliable scheduled jobs

Risk: `critical` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-REL-03-1` | A failure on one record does not stop a job, and a lock ensures only one instance runs each job at a time. | static flow review, behavioral test | [TASK-046](../task/TASK-046.md) `[]` |

### NFR-REL-04 — No critical state in process memory

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-REL-04-1` | One-time codes and rate-limit counters use a store interface with an in-memory adapter by default and a shared adapter chosen by D-108. | behavioral test | [TASK-007](../task/TASK-007.md) `[]` |
| `AC-NFR-REL-04-2` | Socket presence uses the same store interface. | behavioral test | [TASK-023](../task/TASK-023.md) `[]` |

### NFR-REL-05 — Database constraints

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-REL-05-1` | Unique constraints are declared for user email, favorite (user, listing) and conversation (buyer, seller, listing). | behavioral test | [TASK-001](../task/TASK-001.md) `[x]` |

### NFR-REL-06 — Consistent error responses

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-REL-06-1` | Errors use {success:false, message} with the correct HTTP status and never include stack traces in production. | behavioral test | [TASK-003](../task/TASK-003.md) `[x]` |

### NFR-PERF-01 — Bounded pagination

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-PERF-01-1` | A shared pagination helper applies default 20 and maximum 100 to every list endpoint. | behavioral test | [TASK-003](../task/TASK-003.md) `[x]` |

### NFR-PERF-02 — Query indexes

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-PERF-02-1` | Indexes for the main queries are declared in the schemas. | behavioral test | [TASK-001](../task/TASK-001.md) `[x]` |
| `AC-NFR-PERF-02-2` | npm run db:indexes creates the declared indexes for every model on a MongoDB instance. | behavioral test | [TASK-002](../task/TASK-002.md) `[]` |

### NFR-PERF-03 — Response time baseline

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-PERF-03-1` | A load test records p95 latency with 100 concurrent users against the proposed targets (read ≤500 ms, write ≤1 s) and the result is recorded in the evidence. | behavioral test | [TASK-052](../task/TASK-052.md) `[]` |

### NFR-PERF-04 — Request size limit

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-PERF-04-1` | JSON and form bodies are limited to 1 MB; files go through the upload pipeline. | behavioral test | [TASK-003](../task/TASK-003.md) `[x]` |

### NFR-PERF-05 — Lightweight authentication checks

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-PERF-05-1` | Authentication performs no database writes for unrestricted users, and restriction side effects run once per state change. | behavioral test | [TASK-006](../task/TASK-006.md) `[]` |

### NFR-USA-01 — Vietnamese API messages

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-USA-01-1` | User-facing API messages are Vietnamese with full diacritics, and money is expressed in integer VND. | behavioral test | [TASK-003](../task/TASK-003.md) `[x]` |

### NFR-USA-03 — Real-time delivery

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-USA-03-1` | New messages and notifications reach connected recipients within 2 seconds in the integration test environment. | behavioral test | [TASK-023](../task/TASK-023.md) `[]` |

### NFR-COMP-02 — Portable runtime

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-COMP-02-1` | Runtime code uses no operating-system specific commands. | static flow review | [TASK-001](../task/TASK-001.md) `[x]` |

### NFR-INT-01 — Resilient integrations

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-INT-01-1` | SMTP calls have timeouts and mapped errors. | behavioral test | [TASK-007](../task/TASK-007.md) `[]` |
| `AC-NFR-INT-01-2` | Payment gateway calls have timeouts and mapped errors. | behavioral test | [TASK-026](../task/TASK-026.md) `[]` |

### NFR-MNT-01 — Modular structure

Risk: `standard` · Component: `CMP-CONTROL` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-MNT-01-1` | Every baseline module keeps its route, controller, service and model files at the baseline paths, with logic files as empty stubs. | static flow review | [TASK-001](../task/TASK-001.md) `[x]` |
| `AC-NFR-MNT-01-2` | The application shell starts without business logic and GET /api/health returns 200. | behavioral test | [TASK-001](../task/TASK-001.md) `[x]` |

### NFR-MNT-02 — No duplicate or dead code

Risk: `standard` · Component: `CMP-CONTROL` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-MNT-02-1` | Baseline dead code (auto-release service, payment wrappers, unused seed exits) is not carried into the skeleton. | static flow review | [TASK-001](../task/TASK-001.md) `[x]` |

### NFR-MNT-03 — Automated tests and coverage

Risk: `standard` · Component: `CMP-CONTROL` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-MNT-03-1` | Service-layer line coverage is at least 60% for orders, escrow, wallet and disputes, enforced by the test command. | behavioral test | [TASK-049](../task/TASK-049.md) `[]` |

### NFR-MNT-04 — Project documentation

Risk: `standard` · Component: `CMP-CONTROL` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-MNT-04-1` | README, .env.example and the documentation index describe setup, configuration and the delivery workflow. | document check | [TASK-001](../task/TASK-001.md) `[x]` |
| `AC-NFR-MNT-04-2` | An OpenAPI description covers every endpoint. | document check | [TASK-051](../task/TASK-051.md) `[]` |

### NFR-MNT-05 — Plan traceability

Risk: `standard` · Component: `CMP-CONTROL` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-MNT-05-1` | project.yaml validates with the plan-driven-development checker, every task maps to requirements and criteria, and the task index passes the status audit. | document check | [TASK-001](../task/TASK-001.md) `[x]` |

### NFR-OBS-01 — Logging and audit trail

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-OBS-01-1` | A leveled logger replaces direct console output in application code. | behavioral test | [TASK-003](../task/TASK-003.md) `[x]` |
| `AC-NFR-OBS-01-2` | Admin, moderator and money actions write an audit record with actor, action, target and time. | behavioral test | [TASK-050](../task/TASK-050.md) `[]` |

### NFR-BIZ-01 — Money rules as configuration

Risk: `critical` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-BIZ-01-1` | Fee rate, top-up bounds and withdrawal minimum are configuration values with the baseline defaults, and all amounts are integer VND. | behavioral test | [TASK-004](../task/TASK-004.md) `[x]` |

### NFR-BIZ-02 — Time rules as configuration

Risk: `standard` · Component: `CMP-PLATFORM` · Source: `plan.md` § 5. Quality requirements

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-BIZ-02-1` | OTP lifetime, payment window (decision D-104), shipping window, auto-completion window, listing age, reset lifetime and JWT lifetime are configuration values with the baseline defaults. | behavioral test | [TASK-004](../task/TASK-004.md) `[x]` |

### NFR-USA-02 — Responsive user interface

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-USA-02-1` | The user interface works from 360 px to 1920 px wide. | manual review | [TASK-073](../task/TASK-073.md) `[]` |

### NFR-COMP-01 — Browser support

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NFR-COMP-01-1` | Current Chrome, Firefox, Safari and Edge are supported. | manual review | [TASK-073](../task/TASK-073.md) `[]` |

### NFR-MIG-01 — Migration inventory, FE task decomposition and Gitflow delivery

Risk: `standard` · Component: `CMP-CONTROL` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-MIG-01-1` | The inventory pins both repositories, preserves TASK-001 through TASK-052, maps frontend modules to new bounded tasks, and defines sole-author Gitflow PR delivery. | document check | [TASK-053](../task/TASK-053.md) `[x]` |
