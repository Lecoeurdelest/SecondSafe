---
task: TASK-084
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-084 — Ant Design product detail, cart and saved listings

## What was built

The product detail page, the cart and the saved-listings page (`frontend/src/modules/product`) are built from Ant Design components. This is the fifth slice of the move to Ant Design, after the icon set (TASK-080), the shell (TASK-081), the authentication pages (TASK-082) and the home page (TASK-083).

- **Product detail**: `Row`/`Col` layout, a `Card` for the photo, `Typography` for category, title, price, description and seller, `Descriptions` for the condition and area, `Alert` for the error and success notices (with the "Mở danh sách" link), and `Button`s for the four actions. The favourite button keeps `aria-pressed` and the names "Thêm yêu thích" and "Đã yêu thích". Back, edit and manage links are real anchors through the shared `LinkButton`. The purchase and report dialogs it opens are unchanged and move with the order and report areas.
- **Cart**: one `Card` per item with the photo, title, price, seller and the "Mua ngay" and "Xóa" buttons, an `Empty` state, `Alert`s for the error and notice, `Spin` while loading, and an Ant Design `Pagination` in place of the hand-written "Trang trước / Trang sau" buttons.
- **Saved listings**: a `Row`/`Col` grid of `Card`s with the photo and an "Đã lưu" `Tag`, a `Statistic` for the count, `Empty`, and `Pagination`. Removing a listing now asks through an Ant Design `Popconfirm` ("Xóa khỏi yêu thích?") instead of the browser's `window.confirm`.
- **CSS**: `ProductDetail.css`, `Cart.css` and `Favorites.css` shrank from 147, 152 and 271 lines to 72, 70 and 116.

## Test environment

Role queries (`getByRole`, `findByRole`) took 9 to 17 seconds each on the product page once many Ant Design styles were present, because jsdom matched every stylesheet rule against every element to compute visibility. `setupTests.js` now builds the computed style from the element's inline style and Ant Design's `ant-*-hidden` classes, which is all the queries need. One role query on that page went from about 9 seconds to 7 milliseconds and the whole frontend suite from about 100 seconds to under 20.

## Acceptance criteria

- [ ] `AC-WEB-25-4` — inconclusive without a calibrated evaluator; the new `ProductDetail.test.jsx`, extended `Cart.test.jsx` and `Favorites.test.jsx` and the App tests pass, and the pages were observed in both themes at 390 and 1280 px, see `.project/evidence/TASK-084/run-01/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-084/run-01/frontend-test.txt` |
| Static analysis | N/A — the production build runs the CRA lint step with `CI=true` |
| Build/typecheck | `.project/evidence/TASK-084/run-01/frontend-build.txt` |
| Behavioral/manual | `.project/evidence/TASK-084/run-01/manual-review.md` and `screenshots/` |

## Deviations

- A failure while loading a product (anything but 404) now shows the error alert with the server message. Before, the condition `error?.status === 404 || !product` was always true when an error existed, so every failure showed "Không tìm thấy sản phẩm" and the alert branch was unreachable.
- Cart and saved listings use Ant Design's numbered pager instead of "Trang trước / Trang sau" buttons and a "Trang n / m" label.
- Removing a saved listing uses a popover confirmation instead of the browser's dialog; the question and the "Bỏ lưu" label are unchanged.

## Known gaps

- Observed with canned API responses in Chromium; the purchase and report dialogs and the real backend were not exercised.
- Because role queries now ignore stylesheet-driven visibility, a test cannot detect an element hidden only by a CSS rule outside Ant Design's `ant-*-hidden` classes.
- Product creation, editing, my-products and the location selector still use hand-written components until the next task.

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

Dark theme, Phosphor icons, the shell, the authentication pages and the home page are preserved. Texts and roles used by the existing tests ("Thêm vào giỏ hàng", "Thêm yêu thích", "Đã yêu thích", "Nhắn tin người bán", "Mua ngay", "Xóa", "Tin đã lưu", "Chưa có tin đã lưu") are unchanged.

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `frontend/src/modules/product/` (`ProductDetail`, `Cart`, `Favorites` and their stylesheets; `ProductDetail.test.jsx` new; `Cart.test.jsx`, `Favorites.test.jsx` extended)
- `frontend/src/setupTests.js`
