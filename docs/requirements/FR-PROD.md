# FR-PROD — Listings

Generated from `project.yaml`. Edit the model, not this file.

### FR-PROD-01 — Create a listing

Risk: `standard` · Component: `CMP-CATALOG` · Source: `plan.md` § 4.3 Listings and catalog

Baseline: `POST /api/products`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PROD-01-1` | Title (≤200 characters), description (≤2000), price (integer VND ≥0), at least one category, condition (new, like-new, good, fair, poor), at least one image, city and district are required; violations return 400. | behavioral test | [TASK-018](../task/TASK-018.md) `[]` |
| `AC-PROD-01-2` | An optional other-category label is limited to 100 characters. | behavioral test | [TASK-018](../task/TASK-018.md) `[]` |
| `AC-PROD-01-3` | A seller under selling restriction receives 403. | behavioral test | [TASK-018](../task/TASK-018.md) `[]` |
| `AC-PROD-01-4` | A valid listing is published with status active (unless decision D-103 introduces pre-publication moderation). | behavioral test | [TASK-018](../task/TASK-018.md) `[]` |

### FR-PROD-02 — Upload listing images

Risk: `standard` · Component: `CMP-CATALOG` · Source: `plan.md` § 4.3 Listings and catalog

Baseline: `POST /api/upload/image`, `POST /api/upload/images`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PROD-02-1` | Image uploads accept jpg, jpeg, png and gif up to 5 MB each and at most 5 files per request, stored under random file names. | behavioral test | [TASK-009](../task/TASK-009.md) `[]` |

### FR-PROD-03 — Edit a listing

Risk: `standard` · Component: `CMP-CATALOG` · Source: `plan.md` § 4.3 Listings and catalog

Baseline: `PUT /api/products/:id`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PROD-03-1` | Only the owner can edit; a sold listing, a reserved listing or a listing linked to an active order cannot be edited. | behavioral test | [TASK-018](../task/TASK-018.md) `[]` |

### FR-PROD-04 — Delete a listing

Risk: `standard` · Component: `CMP-CATALOG` · Source: `plan.md` § 4.3 Listings and catalog

Baseline: `DELETE /api/products/:id`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PROD-04-1` | Only the owner can delete, under the same state rules as editing; deletion sets status deleted instead of removing the document. | behavioral test | [TASK-018](../task/TASK-018.md) `[]` |

### FR-PROD-05 — Hide or show a listing

Risk: `standard` · Component: `CMP-CATALOG` · Source: `plan.md` § 4.3 Listings and catalog

Baseline: `PATCH /api/products/:id/visibility`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PROD-05-1` | The owner toggles active and hidden; a restricted seller cannot re-activate; deleted, sold and reserved listings cannot change visibility. | behavioral test | [TASK-018](../task/TASK-018.md) `[]` |

### FR-PROD-06 — List my listings

Risk: `standard` · Component: `CMP-CATALOG` · Source: `plan.md` § 4.3 Listings and catalog

Baseline: `GET /api/products/my-products`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PROD-06-1` | GET /api/products/my-products returns the caller's listings filtered by status, paginated (default 20, maximum 100). | behavioral test | [TASK-019](../task/TASK-019.md) `[]` |

### FR-PROD-07 — View listing detail

Risk: `standard` · Component: `CMP-CATALOG` · Source: `plan.md` § 4.3 Listings and catalog

Baseline: `GET /api/products/:id`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PROD-07-1` | The detail returns the listing with a seller summary and returns 404 when the seller is deleted or suspended. | behavioral test | [TASK-019](../task/TASK-019.md) `[]` |

### FR-PROD-09 — Pre-publication listing moderation

Risk: `standard` · Component: `CMP-CATALOG` · Source: `plan.md` § 4.3 Listings and catalog

Baseline: `moderationStatus field in product.model.js (unused in baseline)`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PROD-09-1` | When enabled by D-103, new listings stay pending until a moderator approves them, and rejection stores a reason visible to the seller. | behavioral test | [TASK-048](../task/TASK-048.md) `[!]` |

### FR-PROD-08 — Categories

Risk: `standard` · Component: `CMP-CATALOG` · Source: `plan.md` § 4.3 Listings and catalog

Baseline: `GET /api/categories`, `GET /api/categories/:slug`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PROD-08-1` | Active categories are listed sorted by name; an unknown or inactive slug returns 404. | behavioral test | [TASK-017](../task/TASK-017.md) `[!]` |
