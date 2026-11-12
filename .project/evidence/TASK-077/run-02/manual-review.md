# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally, with the API replaced by canned responses (product list, one product, profile, empty lists). No real backend, database or payment provider was involved.

This run follows `run-01` after a second colour pass. The first pass skipped colours that were followed by a gradient position (`#2563eb 0%`) and left a purple gradient on the wallet card and the profile avatar; both are now converted. The screenshots in `screenshots/` are the new ones.

| File | Viewport | What it shows |
|---|---|---|
| `w360-home.png`, `w1920-home.png` | 360 and 1920 px | Home page: gradient hero, floating search card, category chips, product grid |
| `w360-login.png`, `w1440-login.png` | 360 and 1440 px | Login card and buttons |
| `w360-product-p0.png`, `w1440-product-p0.png` | 360 and 1440 px | Product detail |
| `w1280-orders.png`, `w1280-wallet.png`, `w1280-profile.png`, `w1280-my-products.png`, `w1280-cart.png` | 1280 px | Logged-in buyer pages, all in the brand palette (the wallet card and avatar use the brand gradient) |
| `w1440-admin-users.png`, `w1440-moderator-reports.png` | 1440 px | Staff shells: neutral palette, near-black Ant Design primary, storefront header hidden |

Source hash in `report.json` is the sha256 of `git ls-files -s frontend/src` taken after staging the working tree.

Not observed: the chat and support pages (they fell back to the error boundary because the canned responses lack their data, so they are not evaluated), the buyer navigation with many links (it wraps onto two rows at 1280 px, as before), dark mode, browsers other than Chromium, a real phone, and the remaining admin and moderator pages. Colours in the stylesheets and in a few inline styles were converted by a mechanical rule (saturated blues to the brand hue in buyer modules, to neutral greys in staff modules) and were not each inspected.
