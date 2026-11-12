---
task: TASK-095
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-095 — Ant Design staff dashboards

## What was built

The administrator and staff dashboards (`modules/dashboard/Dashboard.jsx`), the product management page (`AdminProducts.jsx`) and their shared shell (`DashboardLayout.jsx`) are built from Ant Design components. This is the sixteenth slice of the move to Ant Design, after the icon set (TASK-080) and the slices up to the order detail page (TASK-081 to TASK-094), and it removes the last hand-written screens of the storefront application.

- **Shell**: the same sidebar, top bar and heading, with Ant Design `Menu` (grouped links, the current page selected), `Breadcrumb`, `Avatar`, `Typography`, and a menu that wraps into a row above the content on narrow screens. The leftover symbol glyphs (`⌑`, `⌂`, `₫`) are Phosphor icons.
- **Dashboards**: metric `Card`s with `Statistic`, `Progress` bars with their values for the charts, `Badge` rows for the attention list, `Tag`s for the queue states and the recovery rate, `Empty` for empty charts, `Spin` while loading and an `Alert` with "Thử tải lại" and "Quay lại trang chủ" when loading fails. All figures, labels, the abandoned checkout summary and the work queue links are unchanged.
- **Product management**: a `Form` with the search `Input`, a status `Select` and "Tìm kiếm", an Ant Design `Table` with a status `Tag` and the "Ẩn tin" / "Khôi phục" action, `Alert`s for failures and results, `Empty`, `Spin` and `Pagination`. The same query, paging and visibility requests are made.
- **Stylesheets**: `Dashboard.css` 388 → 299 lines and `AdminProducts.css` 163 → 42 lines, now written with the shared colour tokens instead of fixed colours; the top bar rule is scoped to the shell so it no longer collides with the other admin dashboard stylesheet.

## Acceptance criteria

- [ ] `AC-WEB-25-15` — inconclusive without a calibrated evaluator; the new `Dashboard` tests, the extended `AdminProducts` tests and the existing suites pass, and the pages were observed at 390 and 1280 px, see `.project/evidence/TASK-095/run-01/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-095/run-01/frontend-test.txt` |
| Static analysis | N/A — the production build runs the CRA lint step with `CI=true` |
| Build/typecheck | `.project/evidence/TASK-095/run-01/frontend-build.txt` |
| Behavioral/manual | `.project/evidence/TASK-095/run-01/manual-review.md` and `screenshots/` |

## Deviations

- Staff roles are always shown in the light theme (`canChooseTheme` is false for them), so the dashboards were captured in the light theme and the "dark" captures are identical; the stylesheets use the shared tokens so a dark staff theme would need no further rewrite.
- The sidebar links are Ant Design menu items: the current page is marked with `ant-menu-item-selected` instead of `dashboard-sidebar__item--active` (the tests were updated).
- The bars are Ant Design `Progress` lines with the value beside them instead of hand-drawn tracks; empty charts show the Ant Design empty state with the same sentence.

## Known gaps

- Observed with canned API responses in Chromium; no real dashboard figures, product updates or other browsers.
- The other admin and moderator pages already used Ant Design and were not touched.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | Not involved |
| `INV-02` | no | Not involved |
| `INV-03` | no | Not involved |
| `INV-04` | no | Not involved |
| `INV-05` | no | Not involved |
| `INV-06` | no | The same dashboard and product endpoints are called; nothing is stored or logged in the browser |
| `INV-07` | no | Not involved |
| `INV-08` | no | The dashboards still show aggregate figures only, with no personal data or wallet details for staff |

## Compatibility and supersession

Routes, services, role rules and the Phosphor icons are preserved. The `dashboard-shell` class that hides the storefront header and footer on these pages is kept.

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `frontend/src/modules/dashboard/` (the three components, two stylesheets and the tests)
