# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally, with the API replaced by canned responses (product list, one product, profile, two conversations, empty lists). No real backend, database or payment provider was involved.

This run follows `run-02`. It adds a two-tier header (primary actions on the first row, a tab strip with the account and work links below), neutral staff logo tiles, and a check of more pages. Chat and support, which failed in `run-02` only because the canned responses had the wrong shape, now render with a correct fixture.

| File | Viewport | What it shows |
|---|---|---|
| `w360-home.png`, `w1920-home.png` | 360 and 1920 px | Home page |
| `w360-login.png`, `w1440-login.png`, `w1280-register.png` | 360, 1440, 1280 px | Authentication cards |
| `w360-product-p0.png`, `w1440-product-p0.png` | 360 and 1440 px | Product detail |
| `w1280-orders.png`, `w1280-wallet.png`, `w1280-profile.png`, `w1280-my-products.png`, `w1280-cart.png` | 1280 px | Logged-in buyer pages with the two-tier header on one row plus the tab strip |
| `w1280-chat.png`, `w1280-support.png`, `w1280-assistant.png` | 1280 px | Messaging, support and assistant pages |
| `w1440-admin-users.png`, `w1440-admin-orders.png` | 1440 px | Admin shell |
| `w1440-moderator-reports.png`, `w1440-moderator-withdrawals.png` | 1440 px | Moderator shell |

Source hash in `report.json` is the sha256 of `git ls-files -s frontend/src` taken after staging the working tree.

Not observed: a conversation thread with messages, the seller orders, order detail, wallet history and the dashboards with real data, the notification panel opened, the remaining admin and moderator pages, dark mode (not implemented), browsers other than Chromium and a real phone. Colours in the stylesheets and in a few inline styles were converted by a mechanical rule (saturated blues to the brand hue in buyer modules, to neutral greys in staff modules); pages not listed above were not each inspected.
