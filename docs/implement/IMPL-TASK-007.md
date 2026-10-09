---
task: TASK-007
execution_status: verifying
relevance: current
date: 2026-10-09
author: Lecoeurdelest
---

# IMPL-TASK-007 — Transactional email and one-time codes

## What was built

Migrated registration and login OTP mail into a configurable SecondSafe SMTP mailer, with a recovery-code email, escaped HTML/plain text and safe Vietnamese errors. Nodemailer 10.0.16 requires Node.js 20+, now reflected in the runtime manifest and architecture; CI uses Node.js 22. Legacy Gmail environment variables remain supported. SMTP connection, greeting, socket and whole-operation deadlines are bounded. No external email was sent during verification.

Replaced the baseline plaintext code map and `Math.random` with crypto-generated six-digit OTPs, salted digests and 256-bit recovery tokens. Codes are partitioned by purpose, expire, consume once and invalidate after five wrong attempts. Their store has an asynchronous atomic-update contract and a bounded default memory adapter. Callers must pass hashed registration credentials in the payload and await the asynchronous compatibility wrappers.

## Acceptance criteria and evidence

- AC-NOTI-04-1: configured sender, three mail types, safe HTTP 503, escaping and local SMTP delivery observed. Authentication endpoint wiring remains in its own tasks.
- AC-NFR-SEC-05-2: five-attempt invalidation, expiry, replacement, explicit revocation and concurrent single use observed.
- AC-NFR-REL-04-1: code-store interface and default adapter verified; rate counters remain TASK-008 and the shared adapter remains D-108.
- AC-NFR-INT-01-1: SMTP deadlines and mapped errors observed.

86 backend tests pass. Original outputs, AST inventory, flow review, analyzer lockfile and complexity results are in `.project/evidence/TASK-007/run-03/`; run-01 is retained. The automatic gate remains inconclusive without calibration, with null confidence; the task stays verifying. No dependent task is advanced.

## Deviations and known gaps

Recovery sends a one-time credential rather than the baseline temporary-password email, matching the planned reset flow. The shared adapter is deliberately deferred by the task. The memory adapter does not survive restarts or coordinate multiple processes. Live SMTP credentials and deployment delivery are not verified. No schema changed.

## Invariant check

INV-03 and INV-04 are untouched. INV-06 remains the responsibility of authentication callers: code payloads must contain password hashes, and no mail template sends a password. No money behavior changed.

## Files changed

Email/code/store utilities, the fixed OTP-attempt business setting, SMTP environment example, backend dependency manifest/lockfile, email/code tests, runtime architecture note, execution/evidence records and generated views.

Revalidation: fixed a reproduced clock mismatch when using the default store with a custom clock, and rejected non-string purpose values before regex coercion. Run-03 preserves the failed and successful reproductions; all earlier evidence remains available.
