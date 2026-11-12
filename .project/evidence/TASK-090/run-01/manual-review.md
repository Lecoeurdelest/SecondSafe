# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally with canned API responses (`trust-capture.js`). For light and dark at 1280 and 390 px the script signs in and opens the seller reviews page (three reviews with photos and reviewed listings and a two-page pager; counts the cards), the public seller profile and its "Báo cáo người dùng" dialog (checks the send button is disabled while empty), and a product page and its "Báo cáo tin đăng này" dialog, chooses a reason and a description and checks the send button becomes enabled. Horizontal overflow and page errors are recorded.

| File | What it shows |
|---|---|
| `light-w1280-reviews.png`, `dark-w390-reviews.png` | Seller reviews with the rating summary, filter, review cards, photos, reviewed listing and pager |
| `light-w1280-report-product.png`, `light-w390-report-product.png` | Product report dialog with a reason and description filled in |
| `dark-w1280-report-user.png` | User report dialog in the dark theme |

Results: in all four combinations three review cards were shown, the user report dialog opened with its send button disabled, the product report dialog's send button became enabled once a reason and a description were given, no page overflowed horizontally and none raised an error. The rating and dispute dialogs share the same modal, form and evidence picker and are opened from the order pages, so they were exercised by tests only.

Not observed: the rating and dispute dialogs in the browser, a real evidence upload and report submission, video thumbnails, a real phone, Firefox or WebKit.
