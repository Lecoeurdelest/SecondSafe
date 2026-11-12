# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally. The canned API responses have realistic shapes and contents (`qa.js` and `qa-lib.js` hold them); no real backend, database or payment provider was involved. An independent pass, made by a separate reviewer that read each page's code to build its fixtures, found the defects listed below; this run is the re-check after the fixes.

Defects found by that pass and fixed here:

- The seller profile product grid was broken by unscoped `.product-info` and `.product-image` rules in `ReportProduct.css`; they are now scoped to `.report-modal`.
- About twelve stylesheets each declared their own `.btn` and `.btn-primary`, so button style depended on load order; one shared button set in `global.css` now wins.
- The old brand red family (`#eb3225`, `#d8291d` and variants) and the old status badges were folded into the brand tokens, and indigo status badges were restored where the colour sweep had turned their backgrounds pink while their text stayed indigo.
- Moderator pages scrolled horizontally because a decorative header pseudo-element overhung the viewport; `/admin/reviews` and `/moderator/reviews` overflowed because the admin main column had no `min-width: 0` and the table no horizontal scroll.
- Ant Design "processing" tags had about 3:1 contrast because the staff theme made the info colour near-black; the info colours are now explicit.
- The staff dashboards still showed the storefront chrome and a red, purple, orange and green palette with 9 and 10 px text; they now use the neutral palette, 11 px minimum text and no storefront chrome.
- Magenta, blue and orange accents in staff tags, the moderator header badge and the revenue page were neutralised; the moderator footer text now reads "SecondSafe Moderation / Trung tâm kiểm duyệt".
- The avatar placeholder and the `theme-color` meta tag were still the old blue.
- Floating chat covered content at the bottom of buyer pages; they now keep 64 px of clearance.

Screenshots are in `screenshots/`: seller orders, order detail (pending), payment, wallet, seller profile, my products, both dashboards, and the admin and moderator list pages (users, orders, reports, reviews, revenue).

Not observed or not fixed:

- Order, report and dispute detail pages in the staff consoles, the moderator profile page, and the "Chờ giao" and "Đang giao" order tabs.
- Font Awesome icons: `index.html` never loads Font Awesome, so about 60 `<i className="fas ...">` icons render as nothing (including the admin hamburger button). This predates the restyle and needs a decision on how to ship the font, so it was left alone.
- Charts on the admin revenue page keep their categorical colours, and Ant Design success-green "Duyệt" buttons keep their semantic green.
- OrderDetail, OrderPayment, Wallet and UserProfile still carry older card radii and shadows that were not harmonised page by page.
- Dark mode (not implemented), browsers other than Chromium, a real phone and a real backend.

Source hash in `report.json` is the sha256 of `git ls-files -s frontend` (the whole frontend, because this run also changes `public/`) taken after staging the working tree.
