# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally with canned API responses (`dashboard-capture.js`, original output in `capture-output.txt`). For 1280 and 390 px the script signs in as an administrator and a moderator and opens the administrator dashboard (four metrics, six months of orders, category, order and product charts, the attention list and the abandoned checkout summary), the staff dashboard (four metrics, the work queue with its links and the abandoned checkout summary) and the product management page (filters, a table of four listings with status tags and actions, and a three-page pager). Staff roles are always shown in the light theme, so the "dark" captures are identical to the light ones. Overflow, chart bars, table rows and page errors are recorded.

| File | What it shows |
|---|---|
| `light-w1280-admin.png` | Administrator dashboard |
| `light-w390-staff.png` | Staff dashboard on a phone, with the menu wrapped above the content |
| `light-w1280-products.png`, `light-w390-products.png` | Product management with the filter form, table and pager |

Results: in all four combinations the three pages rendered their headings, no page overflowed horizontally and none raised an error; the administrator page showed 22 chart bars, the staff page 3, and the product table 4 rows. A first look showed the long platform-fee figure wrapping inside its card, the card subtitles cut off on a phone and a stray divider next to the menu, which were fixed before the final captures.

Not observed: real dashboard figures, a real visibility change, other browsers or a real phone.
