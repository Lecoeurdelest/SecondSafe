# FR-FAV — Favorites

Generated from `project.yaml`. Edit the model, not this file.

### FR-FAV-01 — Add and remove favorites

Risk: `standard` · Component: `CMP-CATALOG` · Source: `plan.md` § 4.3 Listings and catalog

Baseline: `POST /api/favorites`, `DELETE /api/favorites/:productId`, `GET /api/favorites/check/:productId`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-FAV-01-1` | A user can add, remove and check a favorite; adding an existing favorite is idempotent. | behavioral test | [TASK-021](../task/TASK-021.md) `[]` |

### FR-FAV-02 — List favorites

Risk: `standard` · Component: `CMP-CATALOG` · Source: `plan.md` § 4.3 Listings and catalog

Baseline: `GET /api/favorites`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-FAV-02-1` | Favorites are listed with pagination and without listings that no longer exist. | behavioral test | [TASK-021](../task/TASK-021.md) `[]` |
