# FR-DSP — Disputes

Generated from `project.yaml`. Edit the model, not this file.

### FR-DSP-01 — Open a dispute

Risk: `critical` · Component: `CMP-TRUST` · Source: `plan.md` § 4.9 Reports and disputes

Baseline: `POST /api/orders/:orderId/dispute`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-DSP-01-1` | Only the buyer of a shipped or delivered order can open one dispute per order, with an allowed reason, a 10–1000 character description and at least one evidence file. | behavioral test | [TASK-038](../task/TASK-038.md) `[]` |
| `AC-DSP-01-2` | Opening a dispute moves the order to disputed atomically, so automatic completion no longer applies. | static flow review, behavioral test | [TASK-038](../task/TASK-038.md) `[]` |

### FR-DSP-02 — Seller responds to a dispute

Risk: `standard` · Component: `CMP-TRUST` · Source: `plan.md` § 4.9 Reports and disputes

Baseline: `POST /api/disputes/:disputeId/respond`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-DSP-02-1` | The seller can respond with evidence only while the dispute is investigating. | behavioral test | [TASK-038](../task/TASK-038.md) `[]` |

### FR-DSP-03 — Buyer adds dispute evidence

Risk: `standard` · Component: `CMP-TRUST` · Source: `plan.md` § 4.9 Reports and disputes

Baseline: `POST /api/disputes/:disputeId/buyer-follow-up`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-DSP-03-1` | The buyer can add a note or at least one file only while the dispute is investigating. | behavioral test | [TASK-038](../task/TASK-038.md) `[]` |

### FR-DSP-04 — Seller confirms a returned item

Risk: `standard` · Component: `CMP-TRUST` · Source: `plan.md` § 4.9 Reports and disputes

Baseline: `POST /api/disputes/:disputeId/confirm-return`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-DSP-04-1` | Return confirmation applies only to return_request disputes under investigation and can be recorded once. | behavioral test | [TASK-038](../task/TASK-038.md) `[]` |

### FR-DSP-05 — View disputes

Risk: `standard` · Component: `CMP-TRUST` · Source: `plan.md` § 4.9 Reports and disputes

Baseline: `GET /api/disputes/my-disputes`, `GET /api/disputes`, `GET /api/disputes/:disputeId`, `GET /api/orders/:orderId/dispute`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-DSP-05-1` | Dispute lists include disputes where the caller is buyer or seller, and dispute detail is visible only to the parties, moderators and admins. | behavioral test | [TASK-038](../task/TASK-038.md) `[]` |
