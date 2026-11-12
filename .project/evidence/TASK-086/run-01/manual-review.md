# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally with canned API responses (`my-products-capture.js`). For light and dark at 1280 and 390 px the script signs in and opens the page with six listings (active, active, hidden, sold, pending, deleted), counts the cards, opens the delete confirmation and cancels it, opens the hide confirmation and cancels it, then picks the "Đã bán" filter and checks that the next request asks for `status=sold`, recording horizontal overflow and page errors.

| File | What it shows |
|---|---|
| `light-w1280-list.png`, `dark-w1280-list.png` | The page with its header, filter and listing cards at 1280 px in both themes |
| `dark-w1280-delete.png` | The delete confirmation dialog in the dark theme |
| `light-w390-list.png` | The full page at 390 px in the light theme |
| `dark-w390-delete.png` | The delete confirmation dialog at 390 px in the dark theme |

Results: in all four combinations six cards were shown, the delete and hide confirmations opened, the filter sent `status=sold`, no page overflowed horizontally and none raised an error. Status tags are solid so they stay readable over any photo, the card links use the brand text colour, and the page aligns with the shell container.

Not observed: a real delete or visibility change against the backend, a restricted seller account, a list with several pages, long titles beyond the sample, a real phone, Firefox or WebKit.
