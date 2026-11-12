---
task: TASK-089
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-089 — Ant Design profile pages

## What was built

The account profile, the profile editing page, the public seller profile and the seller reviews page (`frontend/src/modules/profile`) are built from Ant Design components. This is the tenth slice of the move to Ant Design, after the icon set (TASK-080), the shell (TASK-081), the authentication pages (TASK-082), the home page (TASK-083), the product pages (TASK-084), the listing forms (TASK-085), the my-listings page (TASK-086), the wallet pages (TASK-087) and the messaging pages (TASK-088).

- **Account page**: header with "Chỉnh sửa" and "Đăng xuất", a `Card` with an `Avatar`, the rating with a link to the reviews, the member date and a `Descriptions` list (phone, address, role as a `Tag`), and a quick-actions `Card` of six links in a `Row`/`Col` grid. A signed-out visitor now sees the "Vui lòng đăng nhập để xem profile" alert; before, the page showed its spinner forever because the profile was only requested for a signed-in user.
- **Editing page**: `Form` items with an `Input` for the name and phone, the shared location selector, a counting `Input.TextArea`, an `Avatar` preview and a "Chọn ảnh" button that opens the hidden file input, and `Alert`s for the validation and result messages. The checks (name required, phone 10 or 11 digits, image type, 5 MB), the avatar upload, the update request, the session refresh and the redirect after two seconds are unchanged.
- **Seller profile**: an `Avatar` with an icon fallback, stats, the "Xem đánh giá người bán" link, a "Báo cáo người dùng" button (hidden on one's own profile) that opens the existing report dialog, and the listings as a `Row`/`Col` grid of linked `Card`s. Report messages are toasts instead of browser alerts.
- **Seller reviews**: the heading uses `Typography`; the review list itself belongs to the review area.
- **Removed**: `modules/profile/ChangePassword.jsx` and its stylesheet, which no route used (`/profile/change-password` renders the authentication area's page), and the legacy global profile rules in `index.css` (`.profile-container`, `.profile-card` and its centred headings, `.profile-info`, `.info-row`, `.role-badge`, `.profile-actions`), which restyled the new markup.
- **File inputs**: a global `input[hidden]` rule in `ui/shell.css` makes the `hidden` attribute win over a stylesheet that was showing the native file input on the listing, chat and profile forms.
- **CSS**: `Profile.css`, `EditProfile.css`, `UserProfile.css` and `UserReviews.css` went from 392, 278, 315 and 45 lines to 72, 44, 108 and 18.

## Acceptance criteria

- [ ] `AC-WEB-25-9` — inconclusive without a calibrated evaluator; the new `Profile`, `EditProfile` and `UserProfile` tests and the existing suites pass, and the pages were observed in both themes at 390 and 1280 px, see `.project/evidence/TASK-089/run-01/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-089/run-01/frontend-test.txt` |
| Static analysis | N/A — the production build runs the CRA lint step with `CI=true` |
| Build/typecheck | `.project/evidence/TASK-089/run-01/frontend-build.txt` |
| Behavioral/manual | `.project/evidence/TASK-089/run-01/manual-review.md` and `screenshots/` |

## Deviations

- Browser alerts on the seller profile became toasts.
- The editing page keeps its own validation messages in an alert instead of field-level rules, so the texts and the order of the checks did not change.
- Quick actions are cards in a grid instead of the hand-written action tiles.

## Known gaps

- Observed with canned API responses in Chromium; a real avatar upload and save and the report dialog from the seller page (tested with a stub) were not exercised in the browser.
- The review list (`modules/review`), the report dialogs (`modules/report`), the delivery pages and the order area still use hand-written components.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | Not involved |
| `INV-02` | no | Not involved |
| `INV-03` | no | Not involved |
| `INV-04` | no | Not involved |
| `INV-05` | no | Not involved |
| `INV-06` | no | Only the profile fields already sent are sent; nothing is stored or logged |
| `INV-07` | no | Not involved |
| `INV-08` | no | Not involved |

## Compatibility and supersession

Dark theme, Phosphor icons and the earlier Ant Design slices are preserved. The profile password route still renders the authentication area's page.

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `frontend/src/modules/profile/` (components, stylesheets and the new `Profile`, `EditProfile` and `UserProfile` tests; `ChangePassword.jsx` and `ChangePassword.css` deleted)
- `frontend/src/index.css`, `frontend/src/ui/shell.css`
