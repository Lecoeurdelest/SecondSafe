---
task: TASK-092
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-092 — Ant Design purchase requests and payment

## What was built

The purchase request dialog and the seller's request inbox (`modules/order/PurchaseRequest.jsx`, `PurchaseRequests.jsx`), the order payment page (`OrderPayment.jsx`) and the bank transfer result page (`SEPayOrderSuccess.jsx`) are built from Ant Design components. This is the thirteenth slice of the move to Ant Design, after the icon set (TASK-080) and the slices up to the order lists (TASK-081 to TASK-091).

- **Purchase request**: an Ant Design `Modal` holding a `Form`: the listing summary and total, a counting `Input.TextArea` ("0/500 ký tự"), an `InputNumber` for the offer with the minimum price as help text, an `Alert` for a failed request and the same buttons. The quick-buy variant hides the fields and confirms at the listed price. Validation messages, the trimmed message, the payload and the `onSuccess(response, { isQuickBuy })` callback are unchanged, so the product page and the cart did not change.
- **Request inbox**: a `Card` per request with a status `Tag`, the listing, the buyer's `Avatar`, the offer with the difference to the listed price and the message; "Từ chối" and "Chấp nhận" ask in a confirmation `Modal` instead of a hand-written overlay; results are toasts instead of `alert()`. `Spin`, `Alert` with a retry and `Empty` cover the other states.
- **Payment page**: two `Card`s (order and seller, payment details) in a `Row`/`Col` grid with `Descriptions`, the bank transfer method panel, a "Thanh toán An toàn" `Alert`, the escrow notes as an `Alert`, and the same hand-off to the SePay checkout. Error, no-access and already-paid states are `Alert`s with their button. The wallet branch, which no control reaches today, now asks through a confirmation dialog and reports through toasts.
- **Result page**: Ant Design `Result` for success and failure, `Spin` while checking, `Descriptions` for the amount and short transaction code; the 5-second polling is unchanged.
- **Stylesheets**: `PurchaseRequest.css` 379 → 51 lines, `PurchaseRequests.css` 430 → 92, `OrderPayment.css` 503 → 124, `SEPayOrderSuccess` inline styles → 30 lines of CSS. The global `.method-card` dark overrides in `index.css`, which styled the removed markup, are deleted.

## Acceptance criteria

- [ ] `AC-WEB-25-12` — inconclusive without a calibrated evaluator; the new `PurchaseRequest`, `PurchaseRequests`, `OrderPayment` and `SEPayOrderSuccess` tests and the existing suites pass, and the payment, quick-buy and result pages were observed in both themes at 390 and 1280 px, see `.project/evidence/TASK-092/run-01/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-092/run-01/frontend-test.txt` |
| Static analysis | N/A — the production build runs the CRA lint step with `CI=true` |
| Build/typecheck | `.project/evidence/TASK-092/run-01/frontend-build.txt` |
| Behavioral/manual | `.project/evidence/TASK-092/run-01/manual-review.md` and `screenshots/` |

## Deviations

- The purchase request dialog cannot be dismissed by clicking the backdrop (`mask={{ closable: false }}`), so a half-written message is not lost by a stray click; the close button and "Hủy" still close it. The inbox confirmation behaves the same.
- The browser `window.confirm` and `alert()` calls of the payment page and the inbox became Ant Design dialogs and toasts.
- The bank transfer method panel is a plain, always-selected panel: it was the only method and its click handler only reselected it.
- The purchase request's character counter is Ant Design's counter with the same "x/500 ký tự" text.

## Known gaps

- `PurchaseRequests.jsx` (the inbox) is not used by any route in the app, so it was exercised by tests only; the full message and price form of `PurchaseRequest.jsx` is not opened by any page either (the product page and the cart open it as a quick buy), so only tests cover it.
- The wallet payment branch of `OrderPayment.jsx` is unreachable from the interface and is covered by neither tests nor the browser.
- Observed with canned API responses in Chromium; no real SePay checkout, payment or polling against the bank.
- The order detail, shipping and receipt pages still use hand-written components.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | Not involved |
| `INV-02` | no | Not involved |
| `INV-03` | no | Not involved |
| `INV-04` | no | Not involved |
| `INV-05` | no | Not involved |
| `INV-06` | no | The same payment endpoints and the same hidden form POST are used; nothing is stored or logged in the browser |
| `INV-07` | no | Not involved |
| `INV-08` | no | Not involved |

## Compatibility and supersession

Dark theme, Phosphor icons and the earlier Ant Design slices are preserved. The components keep their routes, services and props (`product`, `onClose`, `onSuccess`, `isQuickBuy`), so the product page, the cart and the routes did not change.

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `frontend/src/modules/order/` (the four components, their stylesheets and tests)
- `frontend/src/index.css` (obsolete dark overrides removed)
