---
task: TASK-063
execution_status: verifying
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-063 — Web order lists, payment and fulfilment

## What was built

The order list, order detail, payment, SePay result and seller order pages are routed behind the session guard. A quick buy now goes straight to the payment page of the new order. Signed-in users get header links to their purchases and sales. Unused variables and hook dependency warnings that fail the CI build once the pages are reachable are fixed.

## Acceptance criteria

- [ ] `AC-WEB-10-1` — not verified. App test "buyers who confirm a quick purchase are taken straight to payment" passes; the order pages themselves have no test.

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Web tests | 48 tests in 6 suites pass (`.project/evidence/TASK-063/run-01/frontend-test.txt`). |
| Build | Production build with `CI=true` (warnings are errors) compiles (`.project/evidence/TASK-063/run-01/frontend-build.txt`). |
| Manual observation | `.project/evidence/TASK-063/run-01/manual-review.md`. |
| Static analysis | ESLint (react-app) runs inside the build; the backend complexity limits are not applied to migrated React pages. |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

The quick-purchase test now expects the payment page instead of a notice with the order id, because the behaviour changed on purpose.

## Known gaps

Payment through SePay needs sandbox credentials and was not exercised. Shipping, delivery confirmation, cancellation and receipt were not observed.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | The client moves no money; it calls the API |
| `INV-05` | no | Visibility is enforced by the API |
| `INV-06` | no | — |
| `INV-08` | no | Amounts are displayed as received |

## Compatibility and supersession

Vietnamese product copy and the existing API paths are kept.

## Files changed

- `frontend/src/App.js`
- `frontend/src/App.test.jsx`
- `frontend/src/modules/order/OrderDetail.jsx`
- `frontend/src/modules/order/OrderPayment.jsx`
- `frontend/src/modules/order/Orders.jsx`
- `frontend/src/modules/order/SellerOrders.jsx`
- `frontend/src/modules/product/ProductDetail.jsx`
- `frontend/src/routes/index.js`
- `docs/implement/IMPL-TASK-063.md`
- `.project/evidence/TASK-063/run-01/`
- `.project/state.json and generated views`
