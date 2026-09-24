# FR-REV — Reviews

Generated from `project.yaml`. Edit the model, not this file.

### FR-REV-01 — Review a seller

Risk: `standard` · Component: `CMP-REVIEWS` · Source: `plan.md` § 4.8 Reviews

Baseline: `POST /api/reviews/orders/:orderId/rate`, `GET /api/reviews/orders/:orderId/can-review`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-REV-01-1` | Only the buyer of a completed order can review, once per order, with a rating of 1–5, a comment of at most 500 characters and at most 5 png, jpg or mp4 evidence files. | behavioral test | [TASK-036](../task/TASK-036.md) `[]` |
| `AC-REV-01-2` | The can-review endpoint reports whether the caller may review the order. | behavioral test | [TASK-036](../task/TASK-036.md) `[]` |

### FR-REV-02 — Read reviews and rating statistics

Risk: `standard` · Component: `CMP-REVIEWS` · Source: `plan.md` § 4.8 Reviews

Baseline: `GET /api/reviews/users/:userId/reviews`, `GET /api/reviews/users/:userId/rating-stats`, `GET /api/reviews/orders/:orderId/review`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-REV-02-1` | Active reviews and rating statistics (average and star distribution) are publicly readable. | behavioral test | [TASK-036](../task/TASK-036.md) `[]` |

### FR-REV-03 — Edit or remove own review

Risk: `standard` · Component: `CMP-REVIEWS` · Source: `plan.md` § 4.8 Reviews

Baseline: `PUT /api/reviews/reviews/:reviewId`, `DELETE /api/reviews/reviews/:reviewId`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-REV-03-1` | Only the author can update a review (rating 1–5) or remove it, and removal hides the review. | behavioral test | [TASK-036](../task/TASK-036.md) `[]` |

### FR-REV-04 — List my reviews

Risk: `standard` · Component: `CMP-REVIEWS` · Source: `plan.md` § 4.8 Reviews

Baseline: `GET /api/reviews/reviews/my-reviews`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-REV-04-1` | GET /api/reviews/reviews/my-reviews returns the caller's reviews; the route is declared before /reviews/:reviewId. | behavioral test | [TASK-036](../task/TASK-036.md) `[]` |

### FR-REV-05 — Maintain seller rating

Risk: `standard` · Component: `CMP-REVIEWS` · Source: `plan.md` § 4.8 Reviews

Baseline: `review.model.js calculateAverageRating`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-REV-05-1` | A user's rating and review count are recalculated from active reviews after every create, update, hide or moderation change. | behavioral test | [TASK-036](../task/TASK-036.md) `[]` |
