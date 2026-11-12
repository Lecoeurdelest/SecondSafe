# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally with canned API responses and a canned province list (`profile-capture.js`). For light and dark at 1280 and 390 px the script signs in and opens the account page (checks the heading and the six quick-action links), the profile editing page (checks the heading) and a public seller profile with four listings (checks the heading and the four cards), recording horizontal overflow and page errors on every page.

| File | What it shows |
|---|---|
| `light-w1280-profile.png`, `dark-w390-profile.png` | Account page with the details, rating and quick actions |
| `light-w1280-edit.png`, `dark-w390-edit.png` | Profile editing with the avatar, the details and the cascading area selects |
| `dark-w1280-seller.png`, `light-w390-seller.png` | Public seller profile with the stats, actions and listing cards |

Results: in all four combinations the account page showed its heading and six quick-action links, the editing page showed its heading, the seller page showed four listing cards, no page overflowed horizontally and none raised an error. The first capture showed card headings centred and the account page narrowed by legacy global rules in `index.css`, and the native file input visible on the editing page; the legacy rules were removed and a global rule makes the hidden attribute win, then the pages were re-captured.

Not observed: a real avatar upload and save, the report dialog from the seller page (covered by tests with a stub), a signed-out visit in the browser, long names or addresses beyond the sample, a real phone, Firefox or WebKit.
