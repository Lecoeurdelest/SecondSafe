---
task: TASK-091
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-091 — Ant Design order lists

## What was built

The buyer and seller order list (`modules/order/Orders.jsx`), the seller orders page (`SellerOrders.jsx`) and the abandoned checkout recovery section (`AbandonedCheckouts.jsx`) are built from Ant Design components. This is the twelfth slice of the move to Ant Design, after the icon set (TASK-080) and the shell, authentication, home, product, listing-form, my-listings, wallet, messaging, profile and review slices (TASK-081 to TASK-090).

- **Order list**: Ant Design `Tabs` for "Đơn mua" and "Đơn bán" with the same counts, a `Select` for the status filter, one `Card` per order with a status `Tag`, the product, a `Descriptions` block for the other party and the dates, and the same action buttons for every status on both sides. `Spin` covers reloads, `Alert` with a retry button covers failures, `Empty` leads to the next step and `Pagination` replaces the "Trước / Sau" buttons.
- **Dialogs and messages**: cancelling an order asks for the reason in a `Modal` instead of `window.prompt`; the seller's "Xác nhận đơn" asks through a confirmation dialog instead of `window.confirm`; the results appear as toasts instead of `alert()`. A blank reason still falls back to "Người mua hủy đơn".
- **Seller orders page**: `Tabs` with a `Badge` count for "Chờ giao", "Đang giao" and "Hoàn thành", a `Card` per order with the product, an `Avatar` and name for the buyer, a status `Tag` and the "Chi tiết" button.
- **Abandoned checkouts**: a `Card` with the same region title, one row per checkout, the same two action links (`LinkButton`, still real links) and "Bỏ qua".
- **`orderStatus.js`** holds the status labels, tag colours and the price and date formats the list pages share.
- **Stylesheets**: `Orders.css` 666 → 120 lines, `SellerOrders.css` 553 → 91 lines, `AbandonedCheckouts.css` 75 → 61 lines. The old global `.order-card`, `.status-*` and `.btn-*` rules no longer leak out of these pages.

## Acceptance criteria

- [ ] `AC-WEB-25-11` — inconclusive without a calibrated evaluator; the new `Orders`, `SellerOrders` and `AbandonedCheckouts` tests and the existing suites pass, and the pages were observed in both themes at 390 and 1280 px, see `.project/evidence/TASK-091/run-01/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-091/run-01/frontend-test.txt` |
| Static analysis | N/A — the production build runs the CRA lint step with `CI=true` |
| Build/typecheck | `.project/evidence/TASK-091/run-01/frontend-build.txt` |
| Behavioral/manual | `.project/evidence/TASK-091/run-01/manual-review.md` and `screenshots/` |

## Deviations

- The cancel reason, the seller confirmation and the result messages are Ant Design dialogs and toasts instead of browser prompts, confirms and alerts.
- The order list's pager is Ant Design's numbered pager with the total ("14 đơn hàng") instead of "Trước / Sau" buttons.
- A missing price now shows `0 ₫` instead of `NaN ₫`.
- The buttons of a card no longer need to stop the click individually: the action row stops it once, so the buttons and the dialogs (rendered outside the cards) never open the order.
- The rating and report dialogs from TASK-090 now pass `mask={{ closable: false }}` because the Ant Design release in use deprecates `maskClosable`; that change is committed on the TASK-090 branch.

## Known gaps

- Observed with canned API responses in Chromium; the dispute dialog, the shipping dialog and the confirmation dialogs were exercised by tests only, and no real cancellation, confirmation or payment was made.
- The order detail, payment, purchase request, shipping and receipt pages still use hand-written components.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | Not involved |
| `INV-02` | no | Not involved |
| `INV-03` | no | Not involved |
| `INV-04` | no | Not involved |
| `INV-05` | no | Not involved |
| `INV-06` | no | The same order endpoints are called; nothing is stored or logged in the browser |
| `INV-07` | no | Not involved |
| `INV-08` | no | Not involved |

## Compatibility and supersession

Dark theme, Phosphor icons and the earlier Ant Design slices are preserved. The pages keep their routes, services and the props of the `Dispute` and `ShipOrder` dialogs they open.

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `frontend/src/modules/order/` (`Orders`, `SellerOrders`, `AbandonedCheckouts`, `orderStatus.js`, their stylesheets and tests)
