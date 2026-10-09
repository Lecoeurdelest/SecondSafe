# FR-WEB — Web client migration

Generated from `project.yaml`. Edit the model, not this file.

### FR-WEB-01 — Web runtime, API client and application shell

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-01-1` | The React app installs from a lockfile, builds and renders a Vietnamese shell; API and socket origins come from documented environment variables and errors have visible states. | behavioral test, manual review | [TASK-054](../task/TASK-054.md) `[x]` |

### FR-WEB-02 — Web authentication, session and route guards

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-02-1` | Registration, email verification, login, Google sign-in and recovery use the accepted API; session changes update guards; protected and staff routes reject unauthorized users; missing Firebase configuration does not crash the app. | behavioral test, manual review | [TASK-055](../task/TASK-055.md) `[]` |

### FR-WEB-03 — Web profile, password and public seller pages

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-03-1` | Users edit allowed profile fields and passwords; public seller profiles exclude contact details; loading, validation, unauthorized and error states are visible. | behavioral test, manual review | [TASK-056](../task/TASK-056.md) `[]` |

### FR-WEB-04 — Web home, catalog search and filters

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-04-1` | Guests browse searchable, filterable, paginated active listings with empty and error states; Vietnamese text, images and responsive layout work at desktop and mobile widths. | behavioral test, manual review | [TASK-057](../task/TASK-057.md) `[]` |

### FR-WEB-05 — Web seller listing creation and management

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-05-1` | Sellers create and edit validated listings with permitted images and structured locations; reserved or sold listings and restricted sellers cannot perform forbidden operations. | behavioral test, manual review | [TASK-058](../task/TASK-058.md) `[]` |

### FR-WEB-06 — Web listing detail and favorites

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-06-1` | Listing details link to the seller and allowed purchase/chat actions; authenticated users add and remove favorites with consistent visible state and missing-listing handling. | behavioral test, manual review | [TASK-059](../task/TASK-059.md) `[]` |

### FR-WEB-07 — Web notification inbox

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-07-1` | Notifications load, mark read and update unread counts through authenticated real-time events; subscriptions are cleaned up when the session or component changes. | behavioral test, manual review | [TASK-060](../task/TASK-060.md) `[]` |

### FR-WEB-08 — Web conversations, images and price offers

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-08-1` | Only conversation members access messages and image uploads; offers follow the API contract; sockets authenticate, reconnect and clean up without duplicate handlers. | behavioral test, manual review | [TASK-061](../task/TASK-061.md) `[]` |

### FR-WEB-09 — Web purchase requests and checkout

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-09-1` | Buyers create purchase requests or quick buys and sellers accept or reject them; integer VND totals and unavailable listings are handled without duplicate submission. | behavioral test, manual review | [TASK-062](../task/TASK-062.md) `[]` |

### FR-WEB-10 — Web order lists, payment and fulfilment

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-10-1` | Order parties see only their orders and allowed lifecycle actions; payment results are confirmed through the API; shipping, cancellation and receipt states refresh correctly. | behavioral test, manual review | [TASK-063](../task/TASK-063.md) `[]` |

### FR-WEB-11 — Web wallet, top-up and withdrawal

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-11-1` | Wallet balances and ledger entries come from the API; top-ups and withdrawals validate configured integer VND bounds and handle pending, failed and confirmed outcomes. | behavioral test, manual review | [TASK-064](../task/TASK-064.md) `[]` |

### FR-WEB-12 — Web seller reviews and ratings

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-12-1` | Only an eligible completed-order buyer can submit a review; public ratings and paginated reviews render with optional evidence and duplicate/error handling. | behavioral test, manual review | [TASK-065](../task/TASK-065.md) `[]` |

### FR-WEB-13 — Web violation reports and disputes

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-13-1` | Users submit validated reports and eligible order disputes, upload private evidence and view authorized case state; server denials remain visible and private assets are not exposed publicly. | behavioral test, manual review | [TASK-066](../task/TASK-066.md) `[]` |

### FR-WEB-14 — Web moderator shell, dashboard and profile

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-14-1` | Moderator and admin roles can navigate the responsive console and load dashboard/profile data; regular users cannot enter and locked moderators are denied. | behavioral test, manual review | [TASK-067](../task/TASK-067.md) `[]` |

### FR-WEB-15 — Web moderator report, order and review queues

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-15-1` | Staff search and paginate report/order/review queues, inspect authorized details and execute only server-permitted sanctions or lifecycle actions with validation and refreshed results. | behavioral test, manual review | [TASK-068](../task/TASK-068.md) `[]` |

### FR-WEB-16 — Web moderator disputes and withdrawals

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-16-1` | Staff inspect dispute evidence and resolve cases or approve/reject withdrawals through the shared API; repeat submissions and server failures do not fabricate success. | behavioral test, manual review | [TASK-069](../task/TASK-069.md) `[]` |

### FR-WEB-17 — Web admin shell, dashboard and user management

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-17-1` | Admins manage users and moderators through permitted operations, with filters and validation; protected admin accounts cannot be suspended, restricted, locked or deleted. | behavioral test, manual review | [TASK-070](../task/TASK-070.md) `[]` |

### FR-WEB-18 — Web admin order, review and report queues

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-18-1` | Admin queues and detail pages use paginated authorized APIs and show valid action results and failures without bypassing lifecycle or sanction rules. | behavioral test, manual review | [TASK-071](../task/TASK-071.md) `[]` |

### FR-WEB-19 — Web admin disputes, withdrawals and revenue

Risk: `standard` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-19-1` | Admin dispute settlement, withdrawal approval and revenue views use the shared backend flows and accurate integer VND totals with visible pending and failure states. | behavioral test, manual review | [TASK-072](../task/TASK-072.md) `[]` |

### FR-WEB-20 — Full-stack migration integration and release checks

Risk: `critical` · Component: `CMP-WEB` · Source: `plan.md` § 12. Migration amendment (2026-10-09)

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-WEB-20-1` | A disposable replica-set environment passes buyer/seller/staff end-to-end journeys, existing backend criteria, frontend tests/build and privacy checks; every task PR and new commit has the sole authorized author; remaining provider credentials and manual sandbox checks are explicitly reported. | behavioral test, manual review | [TASK-073](../task/TASK-073.md) `[]` |
