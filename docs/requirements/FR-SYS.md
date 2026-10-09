# FR-SYS — Scheduled jobs and data operations

Generated from `project.yaml`. Edit the model, not this file.

### FR-SYS-01 — Cancel orders past the payment deadline

Risk: `critical` · Component: `CMP-JOBS` · Source: `plan.md` § 4.13 Scheduled jobs and data operations

Baseline: `cron.service.js startPaymentTimeoutCron`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-SYS-01-1` | A job running every minute cancels orders awaiting payment past their deadline and returns the listing to active. | static flow review, behavioral test | [TASK-046](../task/TASK-046.md) `[]` |

### FR-SYS-02 — Complete delivered orders automatically

Risk: `critical` · Component: `CMP-JOBS` · Source: `plan.md` § 4.13 Scheduled jobs and data operations

Baseline: `cron.service.js startAutoCompleteDeliveredCron`, `escrow.service.js getOrdersEligibleForAutoRelease`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-SYS-02-1` | An hourly job completes delivered, undisputed orders older than the configured window (default 5 days) and releases escrow exactly once. | static flow review, behavioral test | [TASK-046](../task/TASK-046.md) `[]` |

### FR-SYS-03 — Refund orders not shipped in time

Risk: `critical` · Component: `CMP-JOBS` · Source: `plan.md` § 4.13 Scheduled jobs and data operations

Baseline: `cron.service.js startLateShippingRefundCron`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-SYS-03-1` | An hourly job refunds and cancels paid orders not shipped within the configured window (default 24 hours). | static flow review, behavioral test | [TASK-046](../task/TASK-046.md) `[]` |

### FR-SYS-04 — Expire old listings

Risk: `standard` · Component: `CMP-JOBS` · Source: `plan.md` § 4.13 Scheduled jobs and data operations

Baseline: `cron.service.js startExpiredListingCleanupCron`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-SYS-04-1` | A daily 03:00 job handles active listings older than the configured age (default 30 days) as decided in D-107. | behavioral test | [TASK-047](../task/TASK-047.md) `[!]` |

### FR-SYS-06 — Database initialization scripts

Risk: `standard` · Component: `CMP-JOBS` · Source: `plan.md` § 4.13 Scheduled jobs and data operations

Baseline: `seed-all.js`, `create-admin.js`, `create-indexes.js`, `verify-seed-data.js`, `migrate-data-consistency.js`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-SYS-06-1` | Category and product seed data satisfy the Mongoose schemas, and every product seed references a seeded category. | behavioral test | [TASK-001](../task/TASK-001.md) `[x]` |
| `AC-SYS-06-2` | create-admin reads the admin credentials from the environment, requires a strong password, never prints the password, and exits non-zero when configuration is missing; create-indexes and the seed scripts exit non-zero on failure. | behavioral test | [TASK-001](../task/TASK-001.md) `[x]` |
| `AC-SYS-06-3` | Against a MongoDB instance, npm run seed, npm run seed:verify, npm run db:indexes, npm run db:migrate and npm run create-admin complete successfully. | behavioral test | [TASK-002](../task/TASK-002.md) `[x]` |

### FR-SYS-05 — Release escrow 10 days after shipping (baseline dead code)

Risk: `standard` · Component: `CMP-JOBS` · Source: `plan.md` § 4.13 Scheduled jobs and data operations · Status: **retired**

> Baseline service was never started and is superseded by FR-SYS-02; kept for ID continuity only.

Baseline: `auto-release.service.js`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-SYS-05-1` | Automatic escrow release follows FR-SYS-02 only; no job releases escrow based on shipping age. | manual review | — |
