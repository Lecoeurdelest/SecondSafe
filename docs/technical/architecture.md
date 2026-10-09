# Architecture

## Stack (D-001)

| Concern | Choice |
|---|---|
| Runtime | Node.js 20+ (CommonJS); CI uses Node.js 22. SMTP dependency requires Node.js 20+. |
| HTTP | Express 4 |
| Database | MongoDB with Mongoose 8. Multi-document transactions need a replica set, including in development. |
| Real time | Socket.IO (TASK-023) |
| Scheduling | node-cron inside the API process, with a job lock (TASK-046) |
| Tests | Jest + Supertest (`backend/tests`) |
| Integrations | SePay, VNPay (D-102), Firebase Admin for Google sign-in, SMTP |

Dependencies are added by the task that first needs them. The skeleton installs only `express`, `cors`, `dotenv`, `mongoose` and `bcryptjs`.

## Repository layout

```
backend/
  src/
    app.js            Express app: CORS, body parsing, /api router
    server.js         Loads env, connects MongoDB, starts HTTP (socket and jobs attach here later)
    routes.js         Mounts every module router under the baseline prefixes (D-008)
    config/           db.js, env.js (baseline); business.js (TASK-004)
    common/           middlewares, utils, validators, constants (stubs until their task)
    modules/<domain>/ <name>.model.js (schema contract), .route.js, .controller.js, .service.js
    seeds/            category and product seed data
    services/         cron.service.js (TASK-046)
  tests/              Jest suites
  *.js                seed-all, verify-seed-data, create-indexes, create-admin, migrate-data-consistency
docs/                 requirements, task, technical, implement
tools/                plan-driven-development (submodule), pdd render helpers
.agent/  .project/    agent contract, execution state, evidence
```

## Module mount points

| Prefix | Router file |
|---|---|
| `/api/health` | routes.js |
| `/api/auth` | modules/auth/auth.route.js |
| `/api/products` | modules/products/product.route.js |
| `/api/categories` | modules/products/category.route.js |
| `/api/upload` | modules/products/upload.route.js |
| `/api/wallets` | modules/payments/wallet.route.js |
| `/api/payments/sepay` | modules/payments/sepay.route.js |
| `/api/payments` | modules/payments/payment.route.js |
| `/api/orders` | modules/orders/order.route.js |
| `/api/chat` | modules/chat/chat.route.js |
| `/api/reviews` | modules/reports/review.route.js |
| `/api` (reports, disputes) | modules/reports/report.route.js |
| `/api/users` | modules/users/user.route.js |
| `/api/delivery` | modules/delivery/delivery.route.js |
| `/api/favorites` | modules/users/favorite.route.js |
| `/api/moderator` | modules/moderator/moderator.route.js |
| `/api/notifications` | modules/notifications/notification.route.js |

Route order matters. Literal paths (`/all`, `/my-reviews`, `/my-disputes`) are declared before parameterised paths; the baseline got this wrong (DEF-01, DEF-02).

## Layering rules

1. **Route**: path, middleware chain (authenticate → role → restriction → upload), controller call. No logic.
2. **Controller**: reads the request, calls one service function, and maps the result or error to the response envelope.
3. **Service**: business rules and transactions. Services call other services, never controllers.
4. **Model**: schema, indexes and small pure helpers. Schema changes follow D-003.

Money-changing code goes only through `wallet.service` and `escrow.service` (INV-01).

## Response envelope (TASK-003)

```json
{ "success": true, "message": "…", "data": { } }
{ "success": false, "message": "…" }
```

Errors carry `statusCode`. The error middleware returns that status, or 500 without a stack trace in production (NFR-REL-06). User-facing messages are Vietnamese (D-005, NFR-USA-01).

## Security baseline

- JWT Bearer tokens for REST and the Socket.IO handshake (NFR-SEC-03).
- One suspension and selling-restriction service used by every entry point (FR-AUTH-10).
- Object-level authorization in services, covered by the gate in TASK-049 (NFR-SEC-04).
- Secrets only from the environment (NFR-SEC-08). Chat content is encrypted with `CHAT_ENCRYPTION_KEY` (NFR-SEC-07).
- Upload limits per bucket and signature checks (NFR-SEC-09). Evidence is not served from a public static folder.

## Configuration

`backend/.env.example` lists every variable. `config/env.js` stops the process when `MONGODB_URI` or `JWT_SECRET` is missing. Business constants (plan.md §7) move into `config/business.js` in TASK-004.

## Testing

- `backend/tests/scaffold.test.js` guards the schema contract and the application shell.
- Every task adds tests for its acceptance criteria. Money flows need transaction tests on a replica-set MongoDB.
- TASK-049 adds the authorization suite and coverage thresholds (NFR-MNT-03).
