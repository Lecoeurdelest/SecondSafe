---
task: TASK-096
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-096 — Ant Design administrator shell and revenue report

## What was built

A final audit of the frontend for components that did not use Ant Design found the administrator shell, the revenue report, the route guards' loading screens and the page error screen still hand-written. This slice (the seventeenth, after TASK-080 and TASK-081 to TASK-095) rebuilds them.

- **Administrator sidebar** (`modules/admin/layout/AdminSidebar.jsx`): an Ant Design `Menu` with the same eight entries, descriptions and selection rules (nested order, report, review, withdrawal and dispute pages keep their entry selected), `Avatar`s for the brand and the signed-in user, and a close button for small screens. The slide-in behaviour and overlay are unchanged.
- **Administrator header** (`AdminHeader.jsx`): `Button`, `Avatar` and `Tag`, with the account menu as an Ant Design `Dropdown` (user, "Đăng xuất").
- **Revenue report** (`modules/admin/revenue/AdminRevenueReport.jsx`): `Card`s with `Statistic` for the four figures, `Input` date fields with the same validation messages, "Áp dụng" and "Mặc định" buttons, a dismissible `Alert`, `Spin` and `Empty` states, and three `Table`s. The charts are the same recharts charts.
- **Shared screens**: `ui/PageLoading.jsx` (a `Spin` with "Đang tải...") is used by the four route guards (`ProtectedRoute`, `PublicRoute`, `AdminRoute`, `ModeratorRoute`) in place of ad-hoc markup, and `AppErrorBoundary` shows an Ant Design `Result` with the same message and link.
- **Removed**: `modules/admin/AdminModules.css` (1,950 lines, imported only by the revenue report and defining global `.btn`, `.alert`, `.modal-*`, `.loading` and `.filter-input` rules that could leak into other pages) and the unrouted legacy `modules/admin/dashboard/Dashboard.jsx` and its stylesheet, whose `.dashboard-topbar` rules collided with the live dashboard. `AdminLayout.css` went from 527 to 193 lines.

## Acceptance criteria

- [ ] `AC-WEB-25-16` — inconclusive without a calibrated evaluator; the new `AdminLayout` and `AdminRevenueReport` tests and the existing suites pass, and the shell and report were observed at 390 and 1280 px, see `.project/evidence/TASK-096/run-01/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-096/run-01/frontend-test.txt` |
| Static analysis | N/A — the production build runs the CRA lint step with `CI=true` |
| Build/typecheck | `.project/evidence/TASK-096/run-01/frontend-build.txt` |
| Behavioral/manual | `.project/evidence/TASK-096/run-01/manual-review.md` and `screenshots/` |

## Deviations

- The loading screen of the four route guards is one shared component with a `status` role; the guards previously used a paragraph, a `div` with a `loading` class or nothing equivalent.
- The deleted legacy dashboard was not imported by any route; `project.yaml` names the `modules/admin/dashboard/` directory only as historical scope of an earlier task, and the preservation audit still passes.
- Staff roles stay in the light theme, so the admin shell is not themed for dark mode.

## Known gaps

- Observed with canned API responses in Chromium; the other administrator pages were not touched and not re-observed, and the account menu's sign-out was exercised by tests only.
- The route guard loading screen and the page error screen were exercised by tests only (the error screen by the existing App test).

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | Not involved |
| `INV-02` | no | Not involved |
| `INV-03` | no | Not involved |
| `INV-04` | no | Not involved |
| `INV-05` | no | Not involved |
| `INV-06` | no | The same revenue endpoint is called; nothing is stored or logged in the browser |
| `INV-07` | no | Not involved |
| `INV-08` | no | The role rules of the route guards are unchanged |

## Compatibility and supersession

Routes, services and role redirects are preserved; the `admin-layout` class that hides the storefront header and footer is kept.

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `frontend/src/modules/admin/layout/`, `frontend/src/modules/admin/revenue/` (components, stylesheets, tests); `AdminModules.css` and `admin/dashboard/` deleted
- `frontend/src/routes/`, `frontend/src/components/AppErrorBoundary.jsx`, `frontend/src/ui/PageLoading.jsx`
