# FR-PAY — Wallet, payments and escrow

Generated from `project.yaml`. Edit the model, not this file.

### FR-PAY-01 — View wallet

Risk: `standard` · Component: `CMP-WALLET` · Source: `plan.md` § 4.6 Wallet, payments and escrow

Baseline: `GET /api/wallets/balance`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PAY-01-1` | A wallet is created on first access and returns balance, available withdrawal balance (balance minus pending withdrawals) and lifetime totals. | behavioral test | [TASK-024](../task/TASK-024.md) `[]` |

### FR-PAY-02 — Transaction history

Risk: `standard` · Component: `CMP-WALLET` · Source: `plan.md` § 4.6 Wallet, payments and escrow

Baseline: `GET /api/wallets/transactions`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PAY-02-1` | Transactions are paginated, filterable by type and status, and include balance before and after. | behavioral test | [TASK-024](../task/TASK-024.md) `[]` |

### FR-PAY-03 — Top up through SePay

Risk: `critical` · Component: `CMP-WALLET` · Source: `plan.md` § 4.6 Wallet, payments and escrow

Baseline: `POST /api/payments/sepay/create`, `POST /api/payments/sepay/ipn`, `GET /api/payments/sepay/return`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PAY-03-1` | Top-up amounts must be integer VND within the configured bounds (default 10,000–500,000,000); other amounts return 400. | behavioral test | [TASK-026](../task/TASK-026.md) `[]` |
| `AC-PAY-03-2` | Payment notifications are authenticated by the secret header using a constant-time comparison; only ORDER_PAID events whose amount matches the pending transaction are processed. | static flow review, behavioral test | [TASK-026](../task/TASK-026.md) `[]` |
| `AC-PAY-03-3` | Each invoice credits the wallet at most once. | static flow review, behavioral test | [TASK-026](../task/TASK-026.md) `[]` |

### FR-PAY-04 — Top up through VNPay

Risk: `critical` · Component: `CMP-WALLET` · Source: `plan.md` § 4.6 Wallet, payments and escrow

Baseline: `POST /api/payments/vnpay/create`, `GET /api/payments/vnpay/callback`, `GET /api/payments/vnpay/return`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PAY-04-1` | VNPay payment URLs are signed, callbacks and returns are accepted only with a valid HMAC signature, and each payment credits the wallet at most once. | static flow review, behavioral test | [TASK-027](../task/TASK-027.md) `[!]` |

### FR-PAY-05 — Request a withdrawal

Risk: `standard` · Component: `CMP-WALLET` · Source: `plan.md` § 4.6 Wallet, payments and escrow

Baseline: `POST /api/wallets/withdraw`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PAY-05-1` | A withdrawal needs an integer amount at least the configured minimum (default 50,000 VND) and at most the available balance, a bank account of at least 6 characters, a bank name and an account holder; it is recorded as pending. | behavioral test | [TASK-028](../task/TASK-028.md) `[]` |

### FR-PAY-06 — Approve or reject withdrawals

Risk: `critical` · Component: `CMP-WALLET` · Source: `plan.md` § 4.6 Wallet, payments and escrow

Baseline: `/api/wallets/admin/withdrawals/*`, `/api/moderator/withdrawals/*`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PAY-06-1` | A single approval flow exists, owned by the role chosen in decision D-105. | static flow review | [TASK-029](../task/TASK-029.md) `[!]` |
| `AC-PAY-06-2` | Only pending withdrawals can be processed; approval debits the wallet and completes the request, and rejection records the reason without a debit. | static flow review, behavioral test | [TASK-029](../task/TASK-029.md) `[!]` |

### FR-PAY-07 — Escrow

Risk: `critical` · Component: `CMP-WALLET` · Source: `plan.md` § 4.6 Wallet, payments and escrow

Baseline: `escrow.service.js`, `escrow-hold.model.js`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PAY-07-1` | An escrow hold moves from held to released or refunded, and each transition happens at most once. | static flow review, behavioral test | [TASK-025](../task/TASK-025.md) `[]` |
| `AC-PAY-07-2` | A refund returns the full totalToPay to the buyer and a release credits the seller payout. | static flow review, behavioral test | [TASK-025](../task/TASK-025.md) `[]` |
