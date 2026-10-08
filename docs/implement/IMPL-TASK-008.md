---
task: TASK-008
execution_status: verifying
relevance: current
date: 2026-10-09
author: Lecoeurdelest
---

# IMPL-TASK-008 — Authentication rate limits

Added scoped IP/email limiters before the login, registration-code request/verification, login-2FA verification and password recovery/reset routes. The default is five requests per minute per IP and provided normalized email. Excess requests return Vietnamese 429 responses with Retry-After. Identifiers are hashed in counter keys, and forwarding headers cannot override Express's default peer identification.

Counters use a replaceable asynchronous atomic-increment interface with a bounded expiring memory adapter. It remains independent from the one-time-code adapter and does not require TASK-007 completion. Shared adapters must preserve atomic increments and first-request expiry. Backend failures fail closed through the shared safe error handler. The fixed defaults are frozen in business configuration.

AC-NFR-SEC-05-1 is exercised by 18 new scenarios; all 108 backend tests pass. Tests cover both key dimensions, concurrent traffic, exact expiry, retry headers, spoofing, storage failure/capacity and all six actual router paths. Original test output, AST review and cyclomatic/cognitive/nesting results are in `.project/evidence/TASK-008/run-02/`. The automatic gate is inconclusive without applicable calibration; confidence remains null and this task stays verifying.

Known gaps: shared multi-process storage awaits D-108; requests without an email are limited by IP. Authentication controllers remain in TASK-011/012/015, so allowed requests currently reach 404 until those handlers are migrated. The production proxy topology must be configured explicitly before trusting proxy IP headers. No schema, listing, sanction or money behavior changed; INV-03/04/06 are untouched.

Changed files: rate-limit middleware/counter adapter, auth route bindings, business defaults, tests, execution/delivery/evidence records and generated views. No baseline endpoint was removed and no global API limit was added.

Final review added explicit scope type validation and constructor boundary tests; earlier run-01 evidence is preserved.
