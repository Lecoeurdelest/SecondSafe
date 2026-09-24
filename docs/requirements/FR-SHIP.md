# FR-SHIP — Delivery

Generated from `project.yaml`. Edit the model, not this file.

### FR-SHIP-01 — Record shipping information

Risk: `standard` · Component: `CMP-DELIVERY` · Source: `plan.md` § 4.7 Delivery

Baseline: `POST /api/delivery/create`, `PUT /api/delivery/:orderId`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-SHIP-01-1` | Only the order's seller (and moderators or admins for updates) can create or update the single delivery record of an order, with a provider from the allowed list. | behavioral test | [TASK-035](../task/TASK-035.md) `[]` |

### FR-SHIP-02 — Delivery status and tracking history

Risk: `standard` · Component: `CMP-DELIVERY` · Source: `plan.md` § 4.7 Delivery

Baseline: `PUT /api/delivery/:orderId/status`, `GET /api/delivery/:orderId`, `GET /api/delivery/:orderId/tracking`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-SHIP-02-1` | Each status change appends to the tracking history, and delivery data is readable only by the order's parties, moderators and admins. | behavioral test | [TASK-035](../task/TASK-035.md) `[]` |

### FR-SHIP-03 — List all deliveries

Risk: `standard` · Component: `CMP-DELIVERY` · Source: `plan.md` § 4.7 Delivery

Baseline: `GET /api/delivery/all`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-SHIP-03-1` | GET /api/delivery/all is reachable (declared before /:orderId) and restricted to admins. | behavioral test | [TASK-035](../task/TASK-035.md) `[]` |
