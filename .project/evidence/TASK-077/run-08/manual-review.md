# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally, with canned API responses (the harness is in `../run-07`). No real backend was involved.

This run closes four small items that `run-07` had left open:

- The dispute follow-up modal header is the brand gradient instead of flat red, and its file input shows a pill-shaped "Choose Files" button (see `screenshots/buyer-order-disputed-followup-modal.png`).
- The current step of the order timeline is dark ink instead of red, so it no longer reads like an error.
- The moderator sidebar no longer highlights "Tổng quan" on `/moderator/profile`.
- The admin order page section is titled "Thao tác quản trị" instead of "Thao tác của Moderator".

Only the modal was re-captured; the timeline, sidebar and title changes were verified by reading the code and by the passing tests.

Still open: the seller order filter that starts on `pending` and matches no tab (behaviour, needs a decision), the staff notification panel (not observable, because the storefront header is hidden inside the staff shells), dark mode, a real backend and browsers other than Chromium.

Source hash in `report.json` is the sha256 of `git ls-files -s frontend` taken after staging the working tree.
