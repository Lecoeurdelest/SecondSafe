# Abandoned checkout

A checkout is abandoned when a buyer starts paying and does not finish. SecondSafe tracks two cases and tries to recover each of them once.

| Case | Detected when | What the buyer gets |
|---|---|---|
| Unpaid order | An order in `awaiting_payment` is within `CHECKOUT_REMINDER_LEAD_MS` of its payment deadline | One reminder that links to the order, then, if the deadline passes, a notice that the listing is on sale again |
| Forgotten cart item | A cart item is older than `CART_ABANDON_AFTER_MS` and its listing is still on sale | One reminder that links to the listing |

## Lifecycle

```
(order within reminder lead) → at_risk ─ paid ──────────────→ recovered
                                  │
                                  └ deadline passed → open ─ bought again → recovered
(cart item past the age limit) ───────────────────→ open ─ buyer hides it → dismissed
                                                          └ listing gone, cart emptied or TTL passed → expired
```

- `at_risk`: the order can still be paid. The buyer's list shows **Tiếp tục thanh toán**.
- `open`: the order was cancelled by the payment-timeout job, or the cart item was left behind. The list shows **Mua lại**.
- A checkout counts as recovered when the same buyer has a paid order for the same listing created after the abandonment.
- An open checkout expires after `ABANDONED_CHECKOUT_TTL_MS`, when the listing stops being available, or when the buyer removes the item from the cart.

## Data

New collection `abandonedcheckouts` (`backend/src/modules/orders/abandoned-checkout.model.js`). It is additive: no existing schema changes and no data migration is needed. Run `npm run db:indexes` once so the indexes exist.

One document is kept per order (unique partial index on `orderId`). A cart item is tracked at most once for as long as it stays in the cart. Amounts are integer VND (INV-08).

## Scheduled jobs

Registered in `backend/src/services/cron.service.js`. They run in the long-lived server process (`src/server.js`) only; the Vercel serverless entry does not run them.

| Job | Interval | Effect |
|---|---|---|
| `checkout-payment-reminder` | 30 s | Sends the pre-deadline reminder and records the checkout as `at_risk` |
| `payment-timeout` | 30 s | Cancels unpaid orders past the deadline, reopens the listing, records the checkout as `open`, notifies buyer and seller |
| `abandoned-checkout-reconcile` | 5 min | Marks checkouts `recovered` or `expired` |
| `abandoned-cart-detection` | 1 h | Sends the forgotten-cart reminder |

## API

All routes require authentication.

| Route | Who | Purpose |
|---|---|---|
| `GET /api/abandoned-checkouts` | Buyer | Own `at_risk` and `open` checkouts with the next action (`resume_payment` or `buy_again`) |
| `POST /api/abandoned-checkouts/:id/dismiss` | Buyer | Hide one of the buyer's own checkouts |
| `GET /api/abandoned-checkouts/summary?from=&to=` | Moderator, admin | Counts, amounts and recovery rate, in total and by source |
| `GET /api/abandoned-checkouts/all?status=&source=` | Moderator, admin | Paginated list |

Recovery rate is `recovered / (recovered + dismissed + expired)`; checkouts that are still active are left out.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `CHECKOUT_REMINDER_LEAD_MS` | 60000 | Remind this long before the payment deadline |
| `CART_ABANDON_AFTER_MS` | 86400000 | Age after which a cart item counts as abandoned |
| `ABANDONED_CHECKOUT_TTL_MS` | 604800000 | How long a recovery offer stays open |

The payment window itself is `PAYMENT_WINDOW_MS` (default 3 minutes). Keep the reminder lead below it.

## Web client

- `frontend/src/modules/order/AbandonedCheckouts.jsx` shows the buyer's unfinished checkouts above the order list (`/orders`) and the cart (`/cart`).
- The admin and staff dashboards show the recovery summary.
