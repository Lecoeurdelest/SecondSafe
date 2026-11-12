---
task: TASK-077
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-077 — Web marketplace visual restyle

## What was built

The web client has one visual language. Design tokens in `frontend/src/assets/styles/global.css` define a red-to-orange brand gradient, white card surfaces on a light grey page, larger corner radii, softer shadows and the DM Sans typeface. The saturated blues of the old theme were converted to the brand hue across the module stylesheets, and the old `--primary-*` variables were renamed `--brand*`.

Buyer pages changed most: a sticky header with pill links and a gradient call-to-action, a gradient hero with a floating search card on the home page, category chips that scroll sideways, product cards with a 4:3 image and a lifting hover, and the login and register cards. The footer sits at the bottom of short pages.

The header is split into two tiers: primary actions on the first row and a tab strip with the account and work links below it, so a signed-in user's fourteen links no longer wrap. The admin and moderator consoles use a neutral palette. Both shells are wrapped in one Ant Design theme (`frontend/src/modules/staffTheme.js`) with a near-black primary colour, and the storefront header, footer and chat button are hidden while either shell is mounted. Routes, services, API calls and business rules were not touched.

One shared button set in `global.css` replaces about twelve competing `.btn` definitions, the storefront chrome is hidden in the dashboards as well as the staff shells, and the dashboards and admin pages use the neutral palette.

The application never loaded Font Awesome, so about 60 icons rendered blank. The frontend now depends on `@fortawesome/fontawesome-free` (`^6.7.2`, self-hosted, solid style only) and imports it in `frontend/src/index.js`; the task scope was amended to allow this one dependency.

The two reference projects (`itsnotvii/mercari-clone`, `ReMarket-SE2/webapp`) have no licence file, so they were used as visual references only. No code was copied.

A follow-up after the merge of PR 148 fixes what a second review found: the staff order detail table and dispute detail at 390 px, the notification panel that the one-row scrolling header clipped on mobile, off-palette Ant Design tags, the primary button shadow, Ant Design texts in Vietnamese through a shared locale, the moderator header chip, and the seller order tabs.

A second follow-up (`run-09`) makes the seller order list open on its first tab, "Chờ giao" (`SellerOrders.jsx` started on a filter named `pending` that matched no tab, so every order was listed and no tab was marked), and records the first observation of the notification panel for a staff account.

## Acceptance criteria

- [ ] `AC-NFR-USA-02-1` — inconclusive: buyer, messaging, support and staff pages were observed at widths from 360 to 1920 px without horizontal overflow; see `.project/evidence/TASK-077/run-08/manual-review.md` and, for the seller order tabs and the staff notification panel, `.project/evidence/TASK-077/run-09/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-077/run-09/frontend-test.txt` — 10 suites, 60 tests pass (2 new for the seller order tabs) |
| Static analysis | N/A — no logic changed; the production build runs the CRA lint step |
| Build/typecheck | `.project/evidence/TASK-077/run-09/frontend-build.txt` — compiled successfully |
| Behavioral/manual | `.project/evidence/TASK-077/run-08/manual-review.md` and `screenshots/` (`run-01` to `run-07` are the earlier passes; `run-08` closes four small items; `run-09` covers the seller order tabs and the staff notification panel) |

## Deviations

The task spec first excluded new dependencies and was amended to allow the Font Awesome Free icon font; `project.yaml` and the earlier evidence reports therefore carry an older `spec_hash`.

The task has no dependencies on other tasks because it changes presentation only. The `TASK-057` home page and the other web tasks remain the owners of behaviour on those pages.

## Known gaps

- Observed only in Chromium against canned API responses; no real phone, no other browser (`NFR-COMP-01` is not evaluated here).
- Every page was checked only with realistic canned data, never against a real backend. Staff detail pages, the moderator profile and some order tabs were not observed.
- Font Awesome icon names that were renamed or dropped between version 5 and 6 would still render blank; the 41 names in use were not each checked.
- OrderDetail, OrderPayment, Wallet and UserProfile still carry older card radii and shadows.
- Status chips that were blue "info" colours in buyer modules are now brand-coloured and can read like the error colour; the shared `--info` colour was kept blue.
- Dark mode is not implemented.
- The dashboards under `frontend/src/modules/dashboard/` and the legacy `Footer.jsx` were not redesigned.

- Staff accounts reach the notification panel only from storefront pages (home, chat, profile): the admin and moderator shells have no notification control. It renders correctly at 1280 and 390 px with canned notifications, but clicking a dispute notification sends a staff account to the buyer order list (`/orders`). Whether the shells should get a panel is a product decision and was not changed here.
- The seller order tabs open on "Chờ giao" (decided without a product owner: it is the tab that needs the seller to act). The empty message for that tab shows when the seller has only shipped or completed orders.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | No money logic is involved |
