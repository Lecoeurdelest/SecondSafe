# Accepted WDP parity choices

D-012 records the user instruction dated 2026-10-11: "Làm y như dự án cũ là được" (match the old project).
The inspected baseline is `Trungnc273/WDP@1cea2b7fc673619f19e9bf76eb745e0e44cc50c1`.
The accepted product behavior follows inspected working flows. Earlier recommendations remain in `project.yaml` as history.

| Decision | Accepted behavior | Baseline evidence |
|---|---|---|
| D-101 | Password login returns a JWT directly. Do not add a per-user two-factor setting. | `backend/src/modules/auth/auth.service.js`: `loginUser`; `modules/users/user.model.js` has no two-factor flag. The controller and `frontend/src/modules/auth/Login.jsx` contain a dormant challenge branch. |
| D-102 | Keep both SePay and VNPay top-up. | `backend/src/modules/payments/payment.route.js` mounts both providers; `sepay.route.js` and frontend payment services retain the baseline contracts. |
| D-103 | Publish listings immediately as `active`, with `moderationStatus: approved`. | `backend/src/modules/products/product.service.js`: `createProduct`. |
| D-104 | Keep the three-minute payment window. | `backend/src/modules/orders/order.service.js`: payment deadline; `services/cron.service.js`: timeout job. |
| D-105 | Keep admin and moderator withdrawal screens and endpoints; delegate both to one ledger-backed approval service. | `backend/src/modules/payments/wallet.route.js`, `modules/moderator/moderator.route.js`; `frontend/src/modules/{admin,moderator}/withdrawals/`. Consolidation preserves visible behavior and prevents duplicate debits under INV-01. |
| D-106 | Dispute settlement supports `refund` and `release` only. | `backend/src/modules/moderator/moderator.controller.js`: `resolveDispute` validates these two values; both staff dispute detail screens offer these outcomes. `partial_refund` is only a dormant schema value. |
| D-107 | At 03:00 daily, hard-delete active listings aged at least the configured age, default 30 days. | `backend/src/services/cron.service.js`: `startExpiredListingCleanupCron`, `Product.findByIdAndDelete`. |
| D-108 | Keep a single-instance, in-memory store behind the implemented adapter interface. | `backend/src/common/utils/otp.manager.js`: `Map`; no shared store is required for baseline deployment. |
| D-109 | Keep stateless seven-day JWTs; logout discards the client token. | `backend/src/common/utils/jwt.util.js`; frontend auth session/logout code. |

## Scope reconciliation

TASK-015 / FR-AUTH-04, TASK-043 / FR-MOD-10 and TASK-048 / FR-PROD-09 are retired extensions.
They remain in the model and generated documents with their original acceptance criteria and history.
Retirement is not a passing code result. Do not mark them `done` or remove their schema fields.
TASK-012 keeps direct login, TASK-018 keeps immediate publication and TASK-042 keeps full refund/release settlement.
Unsupported settlement values must not debit or release funds.

TASK-027, TASK-029 and TASK-047 are unfinished implementation tasks with accepted product decisions.
Missing prerequisites or provider sandbox evidence still prevent their completion.
The user-visible FE layout, navigation and existing contracts remain migration inputs; new UI redesigns and product features are outside parity scope.
The SecondSafe product name and accepted security, ownership, integer-money and exactly-once settlement requirements remain applicable.

## Verification and concurrent work

The scope amendment changes no runtime files and makes no new code completion claim.
The code acceptance policy is unchanged; TASK-005, TASK-007, TASK-008 and TASK-017 remain `verifying`.
Their behavioral tests exist, but applicable calibrated evidence or a separately authorized manual code policy is still required to advance dependent tasks.

At inspection, `develop` was `07caff7b4b4179da4c7974e0abdfb455d3b60f76` and `main` had also received PR #102 (`8401e9f`).
That separate FE contribution is preserved. This amendment branches from `develop` and does not revert or import the contribution into its docs review.
