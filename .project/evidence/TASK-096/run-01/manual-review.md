# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally with canned API responses (`admin-capture.js`, original output in `capture-output.txt`). At 1280 and 390 px the script signs in as an administrator, opens the revenue report (four figures, four charts, three tables with six months, two products and one order), opens the account menu and, on the phone, the slide-in sidebar. Table rows, menu entries, overflow and page errors are recorded.

| File | What it shows |
|---|---|
| `w1280-revenue.png` | Sidebar, header, filters, figures, charts and tables |
| `w390-revenue.png` | The same on a phone |
| `w390-menu-open.png` | The slide-in sidebar with the current entry selected |
| `w1280-account-menu.png` | The account menu with "Đăng xuất" |

Results: at both widths the page showed the revenue heading, 9 table rows and 8 menu entries, the account menu offered "Đăng xuất", no page overflowed horizontally and none raised an error.

Not observed: the other administrator pages, a real sign-out, real revenue figures, dark theme (staff roles are light only), other browsers or a real phone.
