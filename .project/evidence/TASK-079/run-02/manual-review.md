# Manual review

Run-02 observed the production build in headless Chromium against the real backend (`backend/src/server.js`) with a disposable MongoDB 7.0.14 replica set, so every response is real. The database was seeded with `backend/seed-all.js` (8 categories, 80 listings) and `seed-real.js` / `seed-real-2.js`, which create a buyer, an admin and a moderator and, through the real API, three purchase requests accepted into orders (one paid, one paid and shipped), a conversation with two messages, a favorite and a product report. Tokens were minted with the backend's own `generateJWT`; no login form was used.

`real-capture.js` opened 12 buyer pages in dark and in light (24 scans), 2 seller pages in dark, and 9 admin and 7 moderator pages with a dark preference stored (16 scans): 42 in all. It counted horizontal overflow and non-OK API responses, and scanned text contrast as in run-01. Results are in `real-backend-scan.json`; screenshots are the dark storefront pages (`buyer-dark-*`, `seller-dark-*`) and the staff pages (`admin-*`, `mod-*`).

Results: no page returned an API error (status 400 or above) or overflowed horizontally. Storefront pages in dark have no text below 3:1 except the green "Hoàn thành" badge (2.87, also in light). The first run found the my-listings page with a pale panel around dark cards and a pagination label at 1.87:1, because `MyProducts.css` declares its own `--bg`, `--card` and `--muted`; it now has dark values and the rescan is clean. Admin and moderator pages stayed in the light theme (`data-theme` was `light` on all 16) even with a dark preference stored.

Findings left alone: the admin and moderator pages have low-contrast text in their own light theme (sidebar descriptions and section labels at about 2.5:1, Ant Design select placeholders at 1.8:1 and warning tags at 2.8:1).

Not observed: a real phone, Firefox or WebKit (not installed in this environment), a real payment provider, modals, form errors, hover and focus styles, order detail with a dispute, and any admin or moderator page in a dark palette (they are always light by design).

Earlier run-01 notes: Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally, with the browser colour scheme set to dark (light for the last three rows) and signed in as a customer. The API was replaced by canned responses; `fixture-capture.js` holds the script and the data. No real backend or database was involved.

For each of 20 routes the script also scanned every text element for contrast against its nearest opaque background (elements over gradients or images are skipped) and wrote the offenders with a ratio below 3 to `contrast-dark.json`, `contrast-dark-w390.json` and `contrast-light.json`.

| File | Viewport | What it shows |
|---|---|---|
| `dark-home.png` | 1280 px | Home: hero, search card, categories |
| `dark-product-detail.png` | 1280 px | Product page |
| `dark-favorites.png` | 1280 px | Favorites |
| `dark-cart.png` | 1280 px | Cart |
| `dark-orders.png` | 1280 px | Buyer order list |
| `dark-order-detail.png` | 1280 px | Order detail |
| `dark-seller-orders.png` | 1280 px | Seller orders |
| `dark-wallet.png` | 1280 px | Wallet with balance card and transactions |
| `dark-topup.png` | 1280 px | Top-up |
| `dark-chat.png` | 1280 px | Conversation |
| `dark-assistant.png` | 1280 px | Assistant (the current one-shot form) |
| `dark-support.png` | 1280 px | Support |
| `dark-profile.png` | 1280 px | Profile |
| `dark-profile-edit.png` | 1280 px | Edit profile |
| `dark-my-products.png` | 1280 px | My listings |
| `dark-create-product.png` | 1280 px | Create listing |
| `dark-login.png` | 1280 px | Login |
| `dark-register.png` | 1280 px | Register |
| `dark-forgot.png` | 1280 px | Forgot password |
| `dark-change-password.png` | 1280 px | Change password |
| `dark-w390-home.png` | 390 px | Home on a phone-width screen |
| `dark-w390-product-detail.png` | 390 px | Product page |
| `dark-w390-orders.png` | 390 px | Orders |
| `dark-w390-wallet.png` | 390 px | Wallet |
| `dark-w390-chat.png` | 390 px | Conversation |
| `dark-w390-assistant.png` | 390 px | Assistant |
| `dark-w390-login.png` | 390 px | Login |
| `light-home.png` | 1280 px | Light theme after the sweep: home |
| `light-orders.png` | 1280 px | Light theme: orders |
| `light-wallet.png` | 1280 px | Light theme: wallet |

Results: in dark mode at 1280 px one element was below 3:1 (white text on the green "Hoàn thành" badge, 2.87, also present in the light theme); at 390 px the same one. The first scan found 10 more: dark text colours no sweep rule had covered (`#1a1a2e`, `#111`, `#1e293b`), pastel chips whose text a more specific rule had lightened, and a red link; these were fixed and the scan repeated. No page overflowed horizontally in either width. The light theme scan lists only elements that were already low before (emoji icons, a grey timestamp).

Not observed: open modals, form validation states, hover and focus styles, empty and loading states of each page, real data, order detail with a dispute, product photos beyond the placeholder, a phone, browsers other than Chromium, and the admin and moderator pages (always light by design).
