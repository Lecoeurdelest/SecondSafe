# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally, with the API replaced by canned responses (product list, one product, profile). No real backend, database or payment provider was involved.

Screenshots are in `screenshots/`:

| File | Viewport | What it shows |
|---|---|---|
| `w360-home.png`, `w1920-home.png` | 360 and 1920 px | Home page: gradient hero, floating search card, category chips, product grid (5 columns at 1920 px, 2 at 360 px) |
| `w360-login.png`, `w1440-login.png` | 360 and 1440 px | Login card, primary and secondary buttons, footer at the page bottom |
| `w360-product-p0.png`, `w1440-product-p0.png` | 360 and 1440 px | Product detail with the new buttons and typography |
| `w1440-admin-users.png` | 1440 px | Admin shell: neutral palette, storefront header hidden, Ant Design theme with a near-black primary |
| `w1440-moderator-reports.png` | 1440 px | Moderator shell with the same theme |

Source hash in `report.json` is the sha256 of `git ls-files -s frontend/src` taken after staging the working tree.

Not observed: dark mode (not part of this task), browsers other than Chromium, a real phone, the cart, order, wallet, chat, assistant and profile pages with real data, and the remaining admin and moderator pages. Colours in those stylesheets were converted by a mechanical rule (saturated blues to the brand hue in buyer modules, to neutral greys in staff modules) and were not each inspected.
