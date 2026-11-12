# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally, with canned API responses (`fixtures2.js`, `qa-lib.js` and `shots.js` hold the harness). No real backend was involved. A second independent review pass, made by a separate reviewer that read each page's code to build its fixtures, covered the staff detail pages, the moderator profile, the seller order tabs, the disputed and cancelled buyer order states, the notification panel and the staff pages at 390 px. This run re-checks the defects it reported and that were fixed.

Fixed and re-checked in the screenshots:

- Admin and moderator order detail at 390 px: the two-column description table never collapsed and scrolled sideways; it now uses one column below `md`.
- Notification panel at 576 px and below: it was invisible because the one-row scrolling header strip (added by this task) clipped it; the header now wraps and the panel spans the width under the header.
- Dispute detail at 390 px: the fixed 220 px label column and the 320 px textarea are now responsive.
- Off-palette Ant Design tags in the staff detail pages and the moderator role tags are neutral; amber warning tags have readable contrast.
- The moderator user chip no longer overshoots the header and the grey smudge under it is gone.
- Primary buttons in the staff consoles no longer show a dark underline shadow, and Popconfirm and other Ant Design texts are in Vietnamese.
- The seller order tabs are centred with the solid gradient on the active tab, and long status labels wrap inside their pill.
- The notification panel's `.close-btn` rule no longer collides with the order detail one.

Reported but not changed, on purpose or for lack of a decision:

- `SellerOrders.jsx` starts with the filter `pending`, which matches none of its three tabs, so no tab is active on first load. That is behaviour, not presentation.
- The admin order page labels a section "Thao tác của Moderator"; the moderator sidebar highlights "Tổng quan" on `/moderator/profile`; the admin header title wraps to two lines at 390 px.
- The dispute follow-up modal header is flat red, its file input is the native control, and `.timeline-step.current` is red, so the current step can read like an error.
- The floating chat button can cover right-aligned buttons at the bottom of a page.
- The staff notification panel was not observed, because the storefront header is hidden inside the staff shells.

Source hash in `report.json` is the sha256 of `git ls-files -s frontend` taken after staging the working tree.
