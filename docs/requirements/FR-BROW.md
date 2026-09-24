# FR-BROW — Browse and search

Generated from `project.yaml`. Edit the model, not this file.

### FR-BROW-01 — Browse listings

Risk: `standard` · Component: `CMP-CATALOG` · Source: `plan.md` § 4.3 Listings and catalog

Baseline: `GET /api/products`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-BROW-01-1` | Only active listings are returned, paginated with default 20 and maximum 100 per page. | behavioral test | [TASK-020](../task/TASK-020.md) `[]` |

### FR-BROW-02 — Search listings by keyword

Risk: `standard` · Component: `CMP-CATALOG` · Source: `plan.md` § 4.3 Listings and catalog

Baseline: `GET /api/products?search=`, `GET /api/products/search?q=`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-BROW-02-1` | Keyword search uses the text index on title and description, and both baseline search paths share one implementation. | behavioral test | [TASK-020](../task/TASK-020.md) `[]` |

### FR-BROW-03 — Filter and sort listings

Risk: `standard` · Component: `CMP-CATALOG` · Source: `plan.md` § 4.3 Listings and catalog

Baseline: `GET /api/products?category=&minPrice=&maxPrice=&city=&sort=`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-BROW-03-1` | Listings can be filtered by category (primary or any listed category), price range and one or more cities, and sorted. | behavioral test | [TASK-020](../task/TASK-020.md) `[]` |
