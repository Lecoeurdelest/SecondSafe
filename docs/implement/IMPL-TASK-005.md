---
task: TASK-005
execution_status: verifying
relevance: current
date: 2026-10-09
author: Lecoeurdelest
---

# IMPL-TASK-005 — JWT authentication and role guards

Implemented HS256 JWT signing and verification with the configured lifetime, a required expiration and a validated user ID. Tokens contain only the user ID and standard JWT timestamps. Authentication reloads the current account and its role from MongoDB through a positive field projection, so a stale or forged role claim cannot grant access and password hashes are never attached to the request.

Required authentication rejects malformed, expired and deleted-account tokens. Optional authentication permits guests with absent or invalid credentials while forwarding database failures to the safe HTTP error handler. Role guards enforce user/moderator/admin permissions, with administrators inheriting moderator access. Account suspension and selling restrictions remain TASK-006; the unfinished order router remains unavailable until its prerequisites are implemented.

The 62 backend tests pass, including 19 authentication/authorization cases. A disposable MongoDB replica set also passes 12 HTTP assertions covering all three roles, privilege escalation, expiration and deleted accounts. The AST inventory, bounded flow review and cyclomatic-complexity check support the observed behavior; they are not a calibrated alignment evaluator. Current evidence is `.project/evidence/TASK-005/run-02/`; earlier evidence is retained.

The automatic completion gate returns `inconclusive` because no applicable calibration exists. Confidence remains null and the task stays `verifying`; dependent tasks have not been advanced. Completion requires applicable calibration or an explicitly accepted manual policy amendment. No schema or money flow changed.
