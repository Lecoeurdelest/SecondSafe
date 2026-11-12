---
task: TASK-087
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-087 — Ant Design wallet pages

## What was built

The wallet page, the top-up page, the withdrawal page and the two payment result pages (`frontend/src/modules/wallet`) are built from Ant Design components. This is the eighth slice of the move to Ant Design, after the icon set (TASK-080), the shell (TASK-081), the authentication pages (TASK-082), the home page (TASK-083), the product pages (TASK-084), the listing forms (TASK-085) and the my-listings page (TASK-086).

- **Wallet**: a balance `Card` with `Statistic`s for the balance and the five totals; a history `Card` with a type `Select` and two date `Input`s; one `Card` per transaction with an `Avatar` icon, the details, the amount and a status `Tag`; `Pagination`; `Spin`, `Empty` and an `Alert` with a retry button. The rule that decides the sign, tone and suffix of every amount moved unchanged into one helper, `describeAmount`.
- **Top-up**: quick amounts are buttons that report `aria-pressed`; the amount and note are `Form.Item`s with the same validation messages; the summary uses `Descriptions`; the payment method is a card; the security notice is an `Alert`. Paying still asks the service for a checkout and posts a hidden form to the gateway.
- **Withdrawal**: balance `Statistic`, a pending-amount warning `Alert`, quick amounts, a searchable bank `Select`, the account fields with inline errors, a `Descriptions` summary, the notice and the recent requests as cards with status `Tag`s.
- **Result pages**: `TopUpResult` and `VNPaySuccess` use `Result`, with a `Descriptions` block of amount, note and transaction code on the success page. Their navigation buttons are real links.
- **CSS**: `Wallet.css`, `TopUp.css` and `Withdrawal.css` went from 408, 384 and 476 lines to 117, 72 and 104; the inline styles of the result pages became `WalletResult.css`. The top-up payment-method classes were renamed with a `topup-method` prefix because `OrderPayment.css` defines `.method-card` globally.

## Acceptance criteria

- [ ] `AC-WEB-25-7` — inconclusive without a calibrated evaluator; the new `Wallet`, `TopUp`, `Withdrawal` and result tests and the existing suites pass, and the pages were observed in both themes at 390 and 1280 px, see `.project/evidence/TASK-087/run-01/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-087/run-01/frontend-test.txt` |
| Static analysis | N/A — the production build runs the CRA lint step with `CI=true` |
| Build/typecheck | `.project/evidence/TASK-087/run-01/frontend-build.txt` |
| Behavioral/manual | `.project/evidence/TASK-087/run-01/manual-review.md` and `screenshots/` |

## Deviations

- Browser `alert` dialogs on the top-up and withdrawal failures became toasts.
- A signed-out visitor on the top-up page is redirected with `<Navigate>`; before, the page called `navigate` during render, which React Router ignores, so the page stayed blank. The route is also behind `ProtectedRoute`, so this only matters if the page is rendered on its own.
- The date filters are native date inputs inside Ant Design `Input`s, not the Ant Design date picker, to keep the same `YYYY-MM-DD` values the service expects.
- Pagination is Ant Design's numbered pager instead of "Trước / Sau" buttons.

## Known gaps

- Observed with canned API responses in Chromium; the hand-off to the payment gateway and a real withdrawal were not exercised.
- The order payment page (`modules/order/OrderPayment.jsx`) belongs to the order area and still uses hand-written components.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | The pages only display balances and send the same requests; no balance is computed or changed in the browser |
| `INV-02` | no | Not involved |
| `INV-03` | no | Not involved |
| `INV-04` | no | Not involved |
| `INV-05` | no | Not involved |
| `INV-06` | no | Bank details are sent only in the withdrawal request, as before; nothing is stored or logged |
| `INV-07` | no | Not involved |
| `INV-08` | no | Not involved |

## Compatibility and supersession

Dark theme, Phosphor icons and the earlier Ant Design slices are preserved. The amount rules, the minimum and maximum amounts and the requests did not change.

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `frontend/src/modules/wallet/` (`Wallet`, `TopUp`, `Withdrawal`, `TopUpResult`, `VNPaySuccess` and their stylesheets; `WalletResult.css` and the `Wallet`, `TopUp`, `Withdrawal` and `WalletResult` tests new)
