# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally, with the browser colour scheme set to dark (light for the last three rows) and signed in as a customer. The API was replaced by canned responses; `fixture-capture.js` holds the script and the data. No real backend or database was involved.

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
