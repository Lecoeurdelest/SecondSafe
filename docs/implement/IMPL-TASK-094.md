---
task: TASK-094
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-094 — Ant Design order detail

## What was built

The order detail page (`modules/order/OrderDetail.jsx`) and the dialogs it owns are built from Ant Design components. This is the fifteenth slice of the move to Ant Design, after the icon set (TASK-080) and the slices up to the shipment and receipt dialogs (TASK-081 to TASK-093), and it completes the order area.

- **Page**: a header with a back button, the order code and a status `Tag`; one `Card` each for the product (image, description, condition `Tag`, category and area in `Descriptions`), the other party (a linked `Avatar` and name) with the dates, the payment breakdown (the seller sees the platform fee and what they receive), the shipping details, the status `Timeline` (including the dispute and cancellation steps), the buyer's review (read-only `Rate`, comment, photos and videos) and the dispute (`Descriptions` and one `Card` per message with its evidence). Roles, the buttons for every status and side, the data requests and the auto-opened dialogs from `?action=` links are unchanged.
- **Dialogs**: the seller's reply and the buyer's follow-up are Ant Design `Modal`s holding a `Form`, a counting text area and the shared `EvidencePicker`; the return confirmation is a `Modal`; the cancellation reason is a `Modal` with a text area instead of `window.prompt`; the delivery confirmation is an Ant Design confirmation instead of `window.confirm`; every `alert()` is a toast (a warning when the receipt succeeded but the review did not).
- **Status labels** come from the shared `orderStatus.js`, so `awaiting_payment` and `awaiting_seller_confirmation` orders now show their label instead of an empty tag.
- **Stylesheets**: `OrderDetail.css` 990 → 156 lines. The dark override for the old `.condition-badge` in `index.css` is removed.

## Acceptance criteria

- [ ] `AC-WEB-25-14` — inconclusive without a calibrated evaluator; the new `OrderDetail` tests and the existing suites pass, and the page and its cancel and seller reply dialogs were observed in both themes at 390 and 1280 px, see `.project/evidence/TASK-094/run-01/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-094/run-01/frontend-test.txt` |
| Static analysis | N/A — the production build runs the CRA lint step with `CI=true` |
| Build/typecheck | `.project/evidence/TASK-094/run-01/frontend-build.txt` |
| Behavioral/manual | `.project/evidence/TASK-094/run-01/manual-review.md` and `screenshots/` |

## Deviations

- The cancellation reason, the delivery confirmation and all results are Ant Design dialogs and toasts instead of browser prompts, confirms and alerts; a blank reason still sends "Người mua hủy đơn".
- The dialogs cannot be dismissed by clicking the backdrop (`mask={{ closable: false }}`), so a half-written reply is not lost by a stray click.
- Evidence uploads show an "Đang tải tệp lên..." status while they run and each file can be removed before sending (the old inputs had neither).
- The old page replaced itself with a loading state while cancelling; the cancellation now keeps the dialog open with a loading button and reloads the order afterwards.
- The page reads the cancel and delivery services through static imports instead of dynamic `import()` calls.

## Known gaps

- Observed with canned API responses in Chromium; the buyer follow-up, return confirmation and receipt flows were exercised by tests only, and no real cancellation, reply or upload was made.
- Videos in review and dispute evidence were rendered by tests only (the browser capture used images).

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | Not involved |
| `INV-02` | no | Not involved |
| `INV-03` | no | Not involved |
| `INV-04` | no | Not involved |
| `INV-05` | no | Not involved |
| `INV-06` | no | The same order, review, dispute and evidence endpoints are called; nothing is stored or logged in the browser |
| `INV-07` | no | Not involved |
| `INV-08` | no | Not involved |

## Compatibility and supersession

Dark theme, Phosphor icons and the earlier Ant Design slices are preserved. Routes, services and the `?action=` links used by the order list and notifications are unchanged.

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `frontend/src/modules/order/` (`OrderDetail`, its stylesheet and test)
- `frontend/src/index.css` (obsolete dark override removed)
