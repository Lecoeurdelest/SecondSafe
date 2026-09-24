# FR-ORD — Orders

Generated from `project.yaml`. Edit the model, not this file.

### FR-ORD-01 — Send a purchase request

Risk: `standard` · Component: `CMP-ORDERS` · Source: `plan.md` § 4.5 Orders

Baseline: `POST /api/orders/purchase-request`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ORD-01-1` | A request needs a message (≤500 characters) and a positive price for an active listing the buyer does not own, from an unrestricted seller, by a buyer with phone and address on file. | behavioral test | [TASK-030](../task/TASK-030.md) `[]` |
| `AC-ORD-01-2` | A buyer cannot hold two pending requests for the same listing. | behavioral test | [TASK-030](../task/TASK-030.md) `[]` |

### FR-ORD-02 — Quick buy

Risk: `critical` · Component: `CMP-ORDERS` · Source: `plan.md` § 4.5 Orders

Baseline: `POST /api/orders/purchase-request (baseline message "Mua ngay")`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ORD-02-1` | Quick buy is selected by an explicit request type, never by message text. | static flow review | [TASK-030](../task/TASK-030.md) `[]` |
| `AC-ORD-02-2` | Quick buy atomically creates an order awaiting payment with a deadline of the configured payment window, reserves the listing, and notifies the seller. | static flow review, behavioral test | [TASK-030](../task/TASK-030.md) `[]` |

### FR-ORD-03 — Handle purchase requests

Risk: `critical` · Component: `CMP-ORDERS` · Source: `plan.md` § 4.5 Orders

Baseline: `GET /api/orders/purchase-requests/sent`, `GET /api/orders/purchase-requests/received`, `POST /api/orders/:requestId/accept`, `POST /api/orders/:requestId/reject`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ORD-03-1` | Buyers list sent requests and sellers list received requests. | behavioral test | [TASK-030](../task/TASK-030.md) `[]` |
| `AC-ORD-03-2` | Only the counterparty can accept or reject a pending request: the unrestricted seller for buyer-initiated requests, the buyer for seller-initiated offers. | behavioral test | [TASK-030](../task/TASK-030.md) `[]` |
| `AC-ORD-03-3` | Accepting atomically creates the order and reserves the listing; a buyer-initiated request starts in awaiting_payment, a seller-initiated offer starts in awaiting_seller_confirmation. | static flow review, behavioral test | [TASK-030](../task/TASK-030.md) `[]` |
| `AC-ORD-03-4` | Rejecting stores the reason and notifies the other party. | behavioral test | [TASK-030](../task/TASK-030.md) `[]` |

### FR-ORD-04 — Seller confirms an order

Risk: `standard` · Component: `CMP-ORDERS` · Source: `plan.md` § 4.5 Orders

Baseline: `PATCH /api/orders/:id/confirm`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ORD-04-1` | Only the order's seller can move awaiting_seller_confirmation to awaiting_payment, and the payment deadline starts at confirmation. | behavioral test | [TASK-032](../task/TASK-032.md) `[]` |

### FR-ORD-05 — Pay an order from the wallet

Risk: `critical` · Component: `CMP-ORDERS` · Source: `plan.md` § 4.5 Orders

Baseline: `POST /api/orders/:orderId/pay`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ORD-05-1` | Only the buyer can pay, and only an unpaid order awaiting payment. | behavioral test | [TASK-032](../task/TASK-032.md) `[]` |
| `AC-ORD-05-2` | Payment debits the buyer wallet by totalToPay and creates the escrow hold in the same transaction; insufficient balance returns 400 with no state change. | static flow review, behavioral test | [TASK-032](../task/TASK-032.md) `[]` |
| `AC-ORD-05-3` | A paid order has status paid and paidAt set. | behavioral test | [TASK-032](../task/TASK-032.md) `[]` |

### FR-ORD-06 — Pay an order through SePay

Risk: `critical` · Component: `CMP-ORDERS` · Source: `plan.md` § 4.5 Orders

Baseline: `POST /api/payments/sepay/order/:orderId/create`, `GET /api/payments/sepay/order/return`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ORD-06-1` | Creating a SePay order payment records a pending payment transaction bound to the order. | behavioral test | [TASK-032](../task/TASK-032.md) `[]` |
| `AC-ORD-06-2` | A verified payment notification marks the order paid and holds escrow exactly once. | static flow review, behavioral test | [TASK-032](../task/TASK-032.md) `[]` |
| `AC-ORD-06-3` | The return endpoint reports the transaction status. | behavioral test | [TASK-032](../task/TASK-032.md) `[]` |

### FR-ORD-07 — Seller ships an order

Risk: `standard` · Component: `CMP-ORDERS` · Source: `plan.md` § 4.5 Orders

Baseline: `POST /api/orders/:orderId/ship`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ORD-07-1` | Only the seller can move paid to shipped, and recipient name, phone and address are required. | behavioral test | [TASK-033](../task/TASK-033.md) `[]` |
| `AC-ORD-07-2` | The tracking number is taken from the request or generated as <PROVIDER>-<order suffix>-<random>. | behavioral test | [TASK-033](../task/TASK-033.md) `[]` |

### FR-ORD-08 — Seller confirms delivery

Risk: `standard` · Component: `CMP-ORDERS` · Source: `plan.md` § 4.5 Orders

Baseline: `POST /api/orders/:orderId/deliver`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ORD-08-1` | Only the seller can move shipped to delivered, and deliveredAt is recorded. | behavioral test | [TASK-033](../task/TASK-033.md) `[]` |

### FR-ORD-09 — Buyer confirms receipt

Risk: `critical` · Component: `CMP-ORDERS` · Source: `plan.md` § 4.5 Orders

Baseline: `POST /api/orders/:orderId/confirm-receipt`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ORD-09-1` | Only the buyer can move delivered to completed. | behavioral test | [TASK-033](../task/TASK-033.md) `[]` |
| `AC-ORD-09-2` | Completion releases escrow to the seller minus the platform fee, marks the listing sold and notifies the seller in one transaction. | static flow review, behavioral test | [TASK-033](../task/TASK-033.md) `[]` |

### FR-ORD-10 — Buyer cancels an order

Risk: `critical` · Component: `CMP-ORDERS` · Source: `plan.md` § 4.5 Orders

Baseline: `POST /api/orders/:id/cancel`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ORD-10-1` | The buyer can cancel only in awaiting_seller_confirmation, awaiting_payment or paid; other states return 400. | behavioral test | [TASK-033](../task/TASK-033.md) `[]` |
| `AC-ORD-10-2` | Cancelling a paid order refunds totalToPay to the buyer wallet; every cancellation returns the listing to active and notifies the seller. | static flow review, behavioral test | [TASK-033](../task/TASK-033.md) `[]` |

### FR-ORD-11 — Order lists and detail

Risk: `standard` · Component: `CMP-ORDERS` · Source: `plan.md` § 4.5 Orders

Baseline: `GET /api/orders/buying`, `GET /api/orders/selling`, `GET /api/orders/:id`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ORD-11-1` | Buying and selling lists filter by status and are paginated. | behavioral test | [TASK-034](../task/TASK-034.md) `[]` |
| `AC-ORD-11-2` | Order detail is visible only to the buyer, the seller, moderators and admins. | behavioral test | [TASK-034](../task/TASK-034.md) `[]` |

### FR-ORD-12 — Platform fee

Risk: `critical` · Component: `CMP-ORDERS` · Source: `plan.md` § 4.5 Orders

Baseline: `order.service.js calculatePlatformFee`, `escrow.service.js`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ORD-12-1` | The fee equals round(agreedAmount × fee rate) with the rate read from configuration (default 5%); the buyer pays agreedAmount, the seller receives agreedAmount minus the fee, and the fee is recorded as a fee transaction. | static flow review, behavioral test | [TASK-025](../task/TASK-025.md) `[]` |
| `AC-ORD-12-2` | The revenue report computes fees from the same configuration source. | behavioral test | [TASK-039](../task/TASK-039.md) `[]` |
