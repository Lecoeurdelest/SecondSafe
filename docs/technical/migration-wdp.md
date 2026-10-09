# WDP to SecondSafe migration

Source: [Trungnc273/WDP](https://github.com/Trungnc273/WDP), inspected commit `1cea2b7fc673619f19e9bf76eb745e0e44cc50c1`. Destination: [Lecoeurdelest/SecondSafe](https://github.com/Lecoeurdelest/SecondSafe), starting commit `5ed8be5`. No source commit history is imported. Existing destination history and accepted schemas are retained.

WDP contains a CommonJS Express/Mongoose API and a React 18 application using React Router, Axios, Socket.IO, Ant Design, Recharts and Firebase. Its user-facing product name is ReFlow. SecondSafe contains the accepted data layer, PDD documents and mostly empty application stubs, plus orders code added by PR #1. The frontend is absent. The source revision matches the baseline already recorded by SecondSafe.

## Backend mapping

| WDP paths | Existing destination tasks | Review obligations |
|---|---|---|
| `backend/src/app.js`, `common/utils`, `config` | TASK-003, TASK-004 | One CORS policy, 1 MB bodies, Vietnamese response envelopes, bounded pagination and validated constants |
| `common/middlewares`, `modules/auth` | TASK-005 through TASK-009, TASK-011 through TASK-015 | JWT and role checks, shared suspension policy, single-use OTP, rate limits, provider configuration and signature-checked uploads |
| `modules/notifications`, `modules/users` | TASK-010, TASK-016, TASK-021 | Ownership, public-profile privacy and notification/favorite consistency |
| `modules/products` | TASK-017 through TASK-020 | Literal route ordering, listing lifecycle, seller restrictions and bounded queries |
| `modules/chat` | TASK-022, TASK-023, TASK-031 | Membership, encrypted content, authenticated sockets and offer contracts |
| `modules/payments` | TASK-024 through TASK-029 | Replica-set transactions, integer VND ledger, escrow idempotency and authenticated gateway callbacks |
| `modules/orders` | TASK-030 through TASK-034 | Audit existing merged orders code before adapting; preserve lifecycle and prevent concurrent reservations |
| `modules/delivery`, reviews in `modules/reports` | TASK-035, TASK-036 | Order-party authorization, one review per completed order and rating consistency |
| reports/disputes in `modules/reports`, `modules/moderator` | TASK-037 through TASK-043 | Private evidence, graded sanctions and exactly-once settlement |
| admin operations in `modules/users`, `modules/moderator` | TASK-044, TASK-045 | Admin immunity, moderator locks and shared privileged flows |
| `services/cron.service.js`, `services/auto-release.service.js` | TASK-046, TASK-047 | Use the accepted lifecycle, job locks and configured timers; do not revive retired duplicate auto-release |
| pre-publication changes and quality gates | TASK-048 through TASK-052 | Existing decisions, authorization tests, audit, API docs and measured performance |
| schemas, seeds and maintenance scripts | TASK-001, TASK-002 | Preserve schema contract and validate scripts against disposable MongoDB |

## Frontend mapping

| Task | Source slice |
|---|---|
| TASK-054 | Package/lockfile, public assets, app entry, network configuration and API client |
| TASK-055 | Authentication forms, context, hooks, Firebase and route guards |
| TASK-056 | Own/public profiles, password forms and user service |
| TASK-057 | Home, catalog cards/lists, search, filters and location/category/image helpers |
| TASK-058 | Seller listing creation/editing/management and location selector |
| TASK-059 | Product detail, listing page and favorites |
| TASK-060 | Notification panel and service |
| TASK-061 | Chat UI, transport and offers |
| TASK-062 | Purchase requests, checkout, cart and order transport |
| TASK-063 | Buyer/seller orders, payment, shipping, delivery and receipt |
| TASK-064 | Wallet, top-up results, withdrawals and gateway transports |
| TASK-065 | Ratings, reviews and public seller review lists |
| TASK-066 | Reports, disputes and private evidence |
| TASK-067 | Moderator layout, dashboard and profile |
| TASK-068 | Moderator report/order/review queues |
| TASK-069 | Moderator disputes and withdrawals |
| TASK-070 | Admin layout, dashboard, users and reusable account forms |
| TASK-071 | Admin order/review/report queues |
| TASK-072 | Admin disputes, withdrawals and revenue |
| TASK-073 | Full-stack journeys, accessibility/responsiveness and release evidence |

Each frontend task owns its associated CSS, images and tests. Files migrate only when their task is implemented; route registration must keep intermediate builds runnable. WDP `routes/AppRoutes.jsx` contains test code under a production filename: migrate it as a test after correcting the fixtures. Do not carry the Windows shortcut `src - Shortcut.lnk`, runtime uploads, `.env` files, generated builds or `node_modules`. Runtime Firebase must remain optional until configured. Placeholder images and public seed-image paths must agree. Browser payment redirects alone never establish payment success.

## Initial verification and gaps

At destination baseline `5ed8be5`, `cd backend && npm ci` succeeds. `npm test` fails during app import: `Router.use() requires a middleware function` in `modules/orders/order.route.js:13`. Authentication, role and seller guards are still stubs. TASK-001 is consequently `needs_revalidation`; original evidence is preserved. TASK-003 must restore startup with fail-closed handling of unavailable order dependencies, and TASK-005/TASK-006 implement the actual guards. Removing security checks to make startup pass is prohibited.

No MongoDB service or Docker executable was found in the initial host inspection. TASK-002 needs a disposable real MongoDB process, obtainable with a task-local development runner; no production database may be used. SMTP, Firebase and payment-provider behavior requires sandbox credentials. Decisions D-101 through D-109 remain proposed until resolved; tasks depending on them cannot claim completion. No automated calibrated domain-confidence evaluator exists in the current repository: record confidence as null and keep an automatic logic gate inconclusive where required.

## Completion

Complete a task only with current criterion evidence and its implementation record. Migrated code is reviewed against SecondSafe requirements, not only compared to WDP. Retain failed outputs and explicit gaps. Final integration includes buyer/seller/staff journeys, unauthorized access, concurrent payments/reservations, repeated callbacks, private evidence and mobile/desktop observations. PR review, code verification and project execution state are distinct.
