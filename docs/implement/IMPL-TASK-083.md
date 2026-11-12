---
task: TASK-083
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-083 — Ant Design home page and product list

## What was built

The home page (`frontend/src/modules/home/Home.jsx`), the product list and the product card are built from Ant Design components. This is the fourth slice of the move to Ant Design, after the icon set (TASK-080), the shell (TASK-081) and the authentication pages (TASK-082).

- **Hero search** is a `role="search"` form made of a clearable `Select` for the category, an `Input` for the text, an `Input` for the province or city and a primary `Button`. Each field has an accessible name.
- **Category chips** are `Button`s with `aria-pressed`. Clicking the active chip clears the category (before, it could only be replaced), and the category `Select` in the hero stays in step with the chips.
- **Condition and sort** are clearable `Select`s with the same values as before (`new`…`poor`, `price_asc`…`name_desc`).
- **List** is an Ant Design `Row`/`Col` grid (2, 3 and 4 columns from phone to desktop) of `Card`s. The card is wrapped in a router `Link`, so it is a real link (keyboard, middle click, open in a new tab) and keeps `id="product-<id>"` for the scroll-to-new-products behaviour. Photo count and the "Ảnh minh họa" label are `Tag`s; the title is still the only `h3` of the page.
- **States**: `Spin` inside a `role="status"` block while the first page loads, `Empty` with the same two lines when nothing matches, `Alert` with a "Thử lại" button when the request fails, and a "Xem thêm" button that reads "Đang tải sản phẩm..." and is disabled while the next page loads.
- **Cleanup**: `components/Footer`, `components/MobileMenu` and `components/SearchBar` (and their stylesheets) had no importers and are deleted, as is the unused `HomeBanner.css`. `Home.css` went from 489 lines to about 230 and `ProductComponents.css` from 169 to about 150.

The fetching code (pagination, filter, name-sort fallback, refresh events, scroll to the new batch) was not touched.

## Acceptance criteria

- [ ] `AC-WEB-25-3` — inconclusive without a calibrated evaluator; the new `Home.test.jsx` and the existing App tests pass, and the page was observed in both themes at 390, 1280 and 1920 px, see `.project/evidence/TASK-083/run-01/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-083/run-01/frontend-test.txt` |
| Static analysis | N/A — the production build runs the CRA lint step with `CI=true` |
| Build/typecheck | `.project/evidence/TASK-083/run-01/frontend-build.txt` |
| Behavioral/manual | `.project/evidence/TASK-083/run-01/manual-review.md` and `screenshots/` |

## Deviations

- The search text and the city are now drafts: they reach the product query when the form is submitted (button or Enter) instead of on every keystroke. Before, each typed character sent a request and a slow earlier answer could replace a newer one. The category, condition and sort still apply immediately.
- The sort labels read "Giá: thấp đến cao" instead of "Giá: thấp → cao" because the icon policy of TASK-080 forbids arrow glyphs outside `<option>` lines; the English translations were added to `language.service.js`.
- Clicking the active category chip clears the filter.

## Known gaps

- Observed with canned API responses in Chromium; the product query was not exercised against the real backend in this task (the query parameters did not change).
- The location selector used by the listing forms is untouched and moves with the product-forms task.
- `.product-card` rules in `UserProfile.css` and `MyProducts.css` are separate from the list and stay until their pages move.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | No money logic is involved; the price is only formatted |
| `INV-02` | no | Not involved |
| `INV-03` | no | Not involved |
| `INV-04` | no | Not involved |
| `INV-05` | no | Not involved |
| `INV-06` | no | Not involved |
| `INV-07` | no | Not involved |
| `INV-08` | no | Not involved |

## Compatibility and supersession

Dark theme, Phosphor icons, the Ant Design shell and the authentication pages are preserved. Texts and roles used by the existing tests ("Không tìm thấy sản phẩm nào", "Xem thêm", "Đang tải sản phẩm...", the `h3` card titles) are unchanged.

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `frontend/src/modules/home/` (`Home.jsx`, `Home.css`, `Home.test.jsx` new, `HomeBanner.css` deleted)
- `frontend/src/components/` (`ProductCard.jsx`, `ProductList.jsx`, `ProductComponents.css`; `Footer`, `MobileMenu`, `SearchBar` deleted)
- `frontend/src/services/language.service.js`
