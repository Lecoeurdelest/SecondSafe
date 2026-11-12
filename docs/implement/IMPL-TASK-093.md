---
task: TASK-093
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-093 — Ant Design shipment and receipt dialogs

## What was built

The seller's shipment confirmation dialog (`modules/order/ShipOrder.jsx`) and the buyer's receipt confirmation and review dialog (`ConfirmReceipt.jsx`) are built from Ant Design components. This is the fourteenth slice of the move to Ant Design, after the icon set (TASK-080) and the slices up to the purchase and payment pages (TASK-081 to TASK-092).

- **Shipment dialog**: an Ant Design `Modal` holding a `Form`: a `Descriptions` block for the order, a carrier `Select`, the read-only generated tracking code (regenerated with the carrier's prefix when the carrier changes), a date input that rejects past dates, a "Tùy chỉnh điểm lấy hàng" `Checkbox` that swaps the default pickup summary for the sender, phone, `LocationSelector` and street fields, a counting notes field, an `Alert` for failures and the notes about escrow. Validation messages, the payload and the `onSuccess` callback are unchanged.
- **Receipt dialog**: an Ant Design `Modal` holding the order and shipping `Descriptions`, a product and seller summary, the satisfaction choice and the highlight chips as pressed-state buttons (at most three highlights), `Rate` for the stars with the same texts, a counting review field whose counter includes the highlights, the shared `EvidencePicker` for photos and videos, and an Ant Design confirmation dialog instead of `window.confirm`. The confirmation, the review upload, the partial-success result (`reviewCreated`, `reviewError`) and the callbacks are unchanged.
- **Stylesheets**: `ShipOrder.css` 395 → 48 lines, `ConfirmReceipt.css` 723 → 107 lines.

## Acceptance criteria

- [ ] `AC-WEB-25-13` — inconclusive without a calibrated evaluator; the new `ShipOrder` and `ConfirmReceipt` tests and the existing suites pass, and both dialogs were observed in both themes at 390 and 1280 px, see `.project/evidence/TASK-093/run-01/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-093/run-01/frontend-test.txt` |
| Static analysis | N/A — the production build runs the CRA lint step with `CI=true` |
| Build/typecheck | `.project/evidence/TASK-093/run-01/frontend-build.txt` |
| Behavioral/manual | `.project/evidence/TASK-093/run-01/manual-review.md` and `screenshots/` |

## Deviations

- Both dialogs cannot be dismissed by clicking the backdrop (`mask={{ closable: false }}`), so a half-filled form is not lost by a stray click; the close button and "Hủy" still close them.
- The receipt confirmation is an Ant Design dialog titled "Xác nhận nhận hàng" with "Xác nhận" and "Hủy" instead of the browser's confirm.
- The shipment dialog now shows the "Địa chỉ thiếu. Vui lòng bật Tùy chỉnh để thêm địa chỉ giao hàng." message when the listing and the seller's profile have no address; the old dialog set that error but never displayed it, so the form silently refused to submit.
- The seller's avatar in the receipt dialog falls back to the avatar placeholder, not the product placeholder.
- The satisfaction choice is two pressed-state buttons rather than two hand-drawn cards, and the highlight chips are pressed-state buttons.

## Known gaps

- Observed with canned API responses in Chromium; the custom pickup point with the real location lists, a real upload and a real shipment or receipt confirmation were not exercised in the browser (tests cover the custom fields with a stubbed location selector).
- The order detail page that opens both dialogs still uses hand-written components (next task).

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | Not involved |
| `INV-02` | no | Not involved |
| `INV-03` | no | Not involved |
| `INV-04` | no | Not involved |
| `INV-05` | no | Not involved |
| `INV-06` | no | The same shipment, receipt, review and evidence endpoints are called; nothing is stored or logged in the browser |
| `INV-07` | no | Not involved |
| `INV-08` | no | Not involved |

## Compatibility and supersession

Dark theme, Phosphor icons and the earlier Ant Design slices are preserved. The dialogs keep their props (`order`, `onClose`, `onSuccess`), so the order list and the order detail page did not change.

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `frontend/src/modules/order/` (`ShipOrder`, `ConfirmReceipt`, their stylesheets and tests)
