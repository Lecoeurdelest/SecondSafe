---
task: TASK-003
execution_status: done
relevance: current
date: 2026-10-09
author: Lecoeurdelest
---

# IMPL-TASK-003 — HTTP foundation

The API now starts despite unavailable historical order dependencies. The orders router is loaded only after authentication, role and seller guard exports exist; until then it returns a Vietnamese 503 without invoking business handlers. This repairs the startup regression introduced before migration without exposing unprotected orders.

The platform applies Helmet, a single exact-origin CORS policy, 1 MB JSON/form limits, JSON 404/errors, compatible response helpers, bounded pagination and leveled structured logging. Unexpected server details and stacks are not returned. Existing runtime console calls were routed through the logger; operator seed scripts retain CLI output. Helmet 8.3.0 is the only added dependency.

All six task criteria are checked by the 23 passing Jest/Supertest tests, source syntax checks and runtime logging scan in `.project/evidence/TASK-003/run-01/`. This is manual platform/scaffold completion using observed HTTP and structural evidence; no domain-logic calibrated confidence is claimed. Future list implementations must call the shared pagination helper.

The accepted schemas remain unchanged. The original TASK-001 scaffold stage is historical and superseded by the explicitly requested migration; its records remain intact. Current schema and shell tests pass. Order business behavior is still pending TASK-030 through TASK-034 and its wallet/security prerequisites. The availability adapter is temporary and should be removed once those dependencies have their own verified implementation.

Changed files: app/server/routes, response/pagination/logger/error/available-router helpers, existing runtime log call sites, package/lockfile, environment example, HTTP tests, execution/delivery records and regenerated docs. INV-05 and INV-06 are preserved by closed unavailable order routes and non-disclosing errors; no money or schema changes occur.
