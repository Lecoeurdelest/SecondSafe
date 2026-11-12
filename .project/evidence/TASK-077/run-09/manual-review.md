# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build of this branch, served locally. The API was replaced by canned responses; `fixture-capture.js` holds the script and the data. No real backend or database was involved.

| File | Viewport | What it shows |
|---|---|---|
| `w1280-staff-notifications.png` | 1280 px | A moderator account on the home page with the notification panel open: four notifications, two unread with a red dot, "Thông báo (2)" in the header |
| `w390-staff-notifications.png` | 390 px | The same panel on a phone-width screen, full width below the header, no clipping |
| `w1280-seller-orders-default.png` | 1280 px | Seller orders on first load: the "Chờ giao" tab is the only active tab and two orders are listed |
| `w390-seller-orders-default.png` | 390 px | The same page on a phone-width screen with the tabs stacked |
| `w1280-seller-orders-shipping.png` | 1280 px | After choosing "Đang giao": one order |
| `w390-seller-orders-shipping.png` | 390 px | The same on a phone-width screen |

The script also checked that exactly one tab was active on first load (before the fix none was) and that the document had no horizontal overflow at either width.

Findings: staff accounts see the notification control only on storefront pages, because the admin and moderator shells have none, so the earlier note that the panel was unobservable was only true inside the shells. A dispute notification opens the buyer order list for any account, staff included; this was left alone.

Still open: dark mode (not implemented), a real backend, browsers other than Chromium, and a real phone.
