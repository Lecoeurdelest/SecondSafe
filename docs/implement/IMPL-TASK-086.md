---
task: TASK-086
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-086 — Ant Design my-listings page

## What was built

The seller's my-listings page (`frontend/src/modules/product/MyProducts.jsx`) is built from Ant Design components. This is the seventh slice of the move to Ant Design, after the icon set (TASK-080), the shell (TASK-081), the authentication pages (TASK-082), the home page (TASK-083), the product detail, cart and saved listings (TASK-084) and the listing forms (TASK-085).

- **Filter**: an Ant Design `Segmented` control with the same five options ("Tất cả (n)", "Đang bán", "Đã bán", "Đã ẩn", "Đã xóa"); picking one asks for that status from the first page.
- **Listings**: a `Row`/`Col` grid of `Card`s. The photo carries a solid status `Tag`; the body shows title, price, category and city; the card footer holds the actions: "Xem" and "Sửa" as link buttons, "Ẩn" or "Hiện", and "Xóa". Sold, in-transaction and in-order listings show only "Xem" and a note, and deleted listings show only the note, as before.
- **Dialogs**: deleting and hiding or showing use `Modal` with the same titles, texts and "Hủy / Xóa / Xác nhận" buttons and a confirm loading state, replacing the hand-written overlays.
- **Paging and states**: `Pagination`, `Empty` with a link to post a listing, `Spin` while loading, and closable `Alert`s for results.
- **CSS**: `MyProducts.css` went from 832 to 107 lines. It also defined `:root` variables and unscoped `.btn`, `.pagination`, `.empty-state`, `.product-card` and similar rules; every other page that uses those names defines its own, so they were removed. The page now aligns with the shell's `container`.

## Acceptance criteria

- [ ] `AC-WEB-25-6` — inconclusive without a calibrated evaluator; the new `MyProducts.test.jsx` and the existing suites pass, and the page was observed in both themes at 390 and 1280 px, see `.project/evidence/TASK-086/run-01/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-086/run-01/frontend-test.txt` |
| Static analysis | N/A — the production build runs the CRA lint step with `CI=true` |
| Build/typecheck | `.project/evidence/TASK-086/run-01/frontend-build.txt` |
| Behavioral/manual | `.project/evidence/TASK-086/run-01/manual-review.md` and `screenshots/` |

## Deviations

- The success notice after deleting or hiding a listing is now visible. Before, `fetchMyProducts` cleared the notice at the start of the reload that follows every action, so it never showed; the reset now happens when the filter or the page changes.
- A failed load shows an error alert; before, the failure was only logged and the page said the account had no listings.
- A selling restriction is shown as a warning alert on the page. Before, the "Hiện" button was disabled and its click handler, which called `alert`, could never run; that unreachable code is gone.
- The status filter is a segmented control instead of pill buttons, and paging is Ant Design's numbered pager instead of "Trước / Sau" buttons.

## Known gaps

- Observed with canned API responses in Chromium; a real delete or visibility change, a restricted account and a list with several pages were not exercised in the browser (the tests cover them).
- The profile area, the order area, the wallet, the chat and support pages and the report and review pages still use hand-written components.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | No money logic is involved; prices are only formatted |
| `INV-02` | no | Not involved |
| `INV-03` | no | Not involved |
| `INV-04` | no | Not involved |
| `INV-05` | no | Not involved |
| `INV-06` | no | Not involved |
| `INV-07` | no | Not involved |
| `INV-08` | no | Not involved |

## Compatibility and supersession

Dark theme, Phosphor icons and the earlier Ant Design slices are preserved. The selling-restriction rule, the locked-listing rule and the service calls did not change.

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `frontend/src/modules/product/` (`MyProducts.jsx`, `MyProducts.css`, `MyProducts.test.jsx` new)
