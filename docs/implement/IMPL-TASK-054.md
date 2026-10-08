---
task: TASK-054
execution_status: done
relevance: current
date: 2026-10-09
author: Lecoeurdelest
---

# IMPL-TASK-054 — Web foundation

Restored the React 18/React Router runtime, Axios client, Vietnamese HTML entry and app shell. WDP global style tokens and public logo/placeholder assets are preserved. The initial shell has accessible landmarks/skip navigation, a visible rendering-error recovery state and a working 404 route. Account, catalog, provider and staff screens remain assigned to their feature tasks.

API and socket origins are environment-controlled. The API client keeps the baseline token key for compatibility, tolerates unavailable browser storage, imposes a request timeout, preserves HTTP status on errors and normalizes Vietnamese network/email failures. Protected 401 responses emit a session-expiry event instead of forcing a page reload; public authentication errors remain available to their forms. No global JSON content-type is forced on future multipart uploads.

Clean installation from the lockfile, nine frontend tests, production build, and the 43 existing backend tests pass. Manual in-app browser observations at 360 and 1920 px show no horizontal overflow; 404 recovery works and the developer error log is empty. Evidence: `.project/evidence/TASK-054/run-01/`. This is manual frontend scaffold completion, with no claim that pending feature journeys or all target browsers have been verified.

Added CI for backend tests/document generation checks and frontend tests/build. React, React DOM, router, Axios, react-scripts and testing utilities are introduced from the source manifest; Firebase, Socket.IO, charts and Ant Design are deferred to the tasks that consume them. No backend schema or business behavior changed. INV-05/INV-06 remain server obligations; no private data or sample payment result is introduced in the shell.

Changed files: frontend package/lockfile, public assets, runtime/styles/API client/tests/environment example/README, `.gitignore`, application CI, execution/delivery records and generated views. The temporary welcome screen is replaced by the migrated home/catalog in TASK-057. TASK-055 supplies the session provider that consumes the expiry event. Full browser, accessibility and feature integration remain TASK-073.
