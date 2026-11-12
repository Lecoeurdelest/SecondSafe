---
task: TASK-090
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-090 — Ant Design reviews and report dialogs

## What was built

The seller reviews list (`modules/review/ReviewList.jsx`) and the rating, product report, user report and dispute dialogs (`modules/review/RateSeller.jsx`, `modules/report/ReportProduct.jsx`, `ReportUser.jsx`, `Dispute.jsx`) are built from Ant Design components. This is the eleventh slice of the move to Ant Design, after the icon set (TASK-080) and the shell, authentication, home, product, listing-form, my-listings, wallet, messaging and profile slices (TASK-081 to TASK-089).

- **Dialogs**: each is an Ant Design `Modal` holding a `Form`. Reason pickers are `Select`s, descriptions are counting `Input.TextArea`s, the rating is an Ant Design `Rate` with the same hover text ("Rất hài lòng" and so on), errors are `Alert`s and the buttons keep their names ("Hủy", "Gửi báo cáo", "Gửi đánh giá", "Tạo khiếu nại"). Each dialog keeps its own upload function, file limits, validation messages and success callback.
- **`EvidencePicker`** is new and shared by all four dialogs: a button that opens a hidden file input, the notes, an upload status, thumbnails for images and playable videos, and a remove button for each.
- **Reviews list**: a rating `Statistic` with a read-only `Rate`, a star-filter `Select`, one `Card` per review with an `Avatar`, a read-only `Rate`, the comment, photo and video thumbnails and the reviewed listing, an `Empty` state, an `Alert` for failures and an Ant Design `Pagination`.
- **Removed**: the four hand-written stylesheets of the dialogs (1,090 lines) and the delivery module, whose `ShippingForm` had no importer. `ReviewList.css` went from 276 to 78 lines.

## Acceptance criteria

- [ ] `AC-WEB-25-10` — inconclusive without a calibrated evaluator; the new `ReviewList`, `RateSeller` and report dialog tests and the existing suites pass, and the reviews page and the report dialogs were observed in both themes at 390 and 1280 px, see `.project/evidence/TASK-090/run-01/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-090/run-01/frontend-test.txt` |
| Static analysis | N/A — the production build runs the CRA lint step with `CI=true` |
| Build/typecheck | `.project/evidence/TASK-090/run-01/frontend-build.txt` |
| Behavioral/manual | `.project/evidence/TASK-090/run-01/manual-review.md` and `screenshots/` |

## Deviations

- The dialogs are Ant Design modals that cannot be dismissed by clicking the backdrop (`maskClosable={false}`), so a half-written report is not lost by a stray click; the close button and "Hủy" still close them.
- The Dispute dialog's important notes are an `Alert` with `role="note"` so they are not announced as an error.
- The reviews pager is Ant Design's numbered pager instead of "Trước / Sau" buttons.

## Known gaps

- Observed with canned API responses in Chromium; the rating and dispute dialogs (opened from the order pages) were exercised by tests only, and no real evidence upload or report submission was made.
- The order area still uses hand-written components.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | Not involved |
| `INV-02` | no | Not involved |
| `INV-03` | no | Not involved |
| `INV-04` | no | Not involved |
| `INV-05` | no | Not involved |
| `INV-06` | no | Evidence is uploaded through the same endpoints; nothing is stored or logged in the browser |
| `INV-07` | no | Not involved |
| `INV-08` | no | Not involved |

## Compatibility and supersession

Dark theme, Phosphor icons and the earlier Ant Design slices are preserved. The components keep their props (`order`, `product`, `reportedUser`, `initialReason`, `onSuccess`, `onCancel`), so the pages that open them did not change.

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `frontend/src/modules/review/`, `frontend/src/modules/report/` (components, tests, `ReviewList.css`; dialog stylesheets deleted)
- `frontend/src/modules/delivery/` (deleted)
- `frontend/src/components/EvidencePicker.jsx`, `EvidencePicker.css`, `ReportModal.css` (new)
