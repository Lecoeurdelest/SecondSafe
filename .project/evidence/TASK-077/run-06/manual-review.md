# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally, with canned API responses (`../run-05/qa.js` holds the fixtures). No real backend was involved.

This run adds the Font Awesome Free icon font. Before it, `index.html` never loaded the font, so about 60 `<i className="fas ...">` icons rendered as nothing, including the arrow on the seller order "Chi tiết" button and the order detail actions. The package `@fortawesome/fontawesome-free` is now a dependency of the frontend (licences: CC-BY-4.0 for the icons, OFL-1.1 for the fonts, MIT for the code); only `fontawesome.min.css` and `solid.min.css` are imported, because the application uses solid icons only, so the build ships one 158 KB `woff2` file (plus a `ttf` fallback) and makes no request to a third-party host.

| File | What it shows |
|---|---|
| `screenshots/buyer-seller-orders.png` | The arrow icon now shows in the outlined "Chi tiết" button; neutral grey avatars |
| `screenshots/buyer-order-detail-pending.png` | Order detail product card |
| `screenshots/admin-users.png` | Admin list with the shared theme and the eye icon in "Chi tiết" |
| `screenshots/icons-sheet.png` | Crops of the three pages above |

Not observed: every page that uses an icon (41 distinct icon names are used in the code), a real backend, browsers other than Chromium and a real phone. Icon names that Font Awesome 6 dropped from version 5 would still render blank; none was checked one by one.

Source hash in `report.json` is the sha256 of `git ls-files -s frontend` taken after staging the working tree.
