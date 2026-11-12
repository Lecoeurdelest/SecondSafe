# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally with canned API responses (`product-capture.js`). For light and dark at 1280 and 390 px the script signs in, opens a product page (checks there is one level-1 heading), clicks "Thêm yêu thích" (checks the button becomes "Đã yêu thích" with `aria-pressed="true"`), clicks "Thêm vào giỏ hàng" (checks the success notice), then opens the cart (three items, 45 in total so the pager shows) and the saved listings (eight cards), clicks "Bỏ lưu" on the first card (checks the confirmation appears) and records horizontal overflow and page errors on every page.

| File | What it shows |
|---|---|
| `light-w1280-detail-notice.png` | Product page after saving it and adding it to the cart (light) |
| `dark-w1280-detail.png` | Product page in the dark theme |
| `light-w390-detail.png`, `dark-w390-detail-notice.png` | Product page at 390 px |
| `light-w1280-cart.png`, `dark-w1280-cart.png` | Cart with three items and the pager |
| `light-w390-cart.png` | Cart at 390 px |
| `light-w1280-favorites-confirm.png` | Saved listings with the confirmation popover open |
| `dark-w1280-favorites.png`, `dark-w390-favorites.png` | Saved listings in the dark theme at both widths |

Results: in all four combinations the favourite button reported `aria-pressed="true"` after saving, the cart notice appeared, the cart listed three items, the saved list listed eight cards, the confirmation appeared before a listing was removed, no page overflowed horizontally and none raised an error. The first capture found the product page overflowing by a few pixels at 390 px (the row gutter was wider than the container padding) and the saved list overflowing after it moved into the shared container; both were fixed with a responsive gutter and the pages re-captured.

Not observed: the purchase and report dialogs opened from the product page (they belong to the order and report areas), the real backend, long titles or descriptions beyond the sample, a real phone, Firefox or WebKit.
