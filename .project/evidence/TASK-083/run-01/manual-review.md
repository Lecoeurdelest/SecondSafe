# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally with canned API responses (`home-capture.js`). For light and dark at 1280 and 390 px, and the product list also at 1920 px, the script loads the home page with twelve products (three with several photos, two with only the placeholder image), then with an empty answer, a failing request and a request that stays pending. At 1280 px it also clicks a category chip (checks `aria-pressed`), opens the condition select, picks a condition, types a search text and counts the requests made while typing, then submits the search form and records the query that was sent.

| File | What it shows |
|---|---|
| `light-w1280-list-top.png` | Hero search, category chips, condition and sort selects, first cards (light) |
| `dark-w1280-list-top.png` | Same page in the dark theme with a category chosen |
| `dark-w1280-list-condition-open.png` | The condition select open in the dark theme |
| `light-w1920-list-cards.png` | Four-column card grid at 1920 px with photo count and illustration labels |
| `dark-w1920-list-cards.png` | Same in the dark theme |
| `light-w390-list-cards.png`, `dark-w390-list-cards.png` | Two-column grid at 390 px |
| `light-w1280-loading.png` | Loading state |
| `light-w390-empty.png` | Empty state at 390 px |
| `dark-w390-error.png` | Error alert with the retry button at 390 px |

Results: in all combinations no page overflowed horizontally and none raised an error. The grid showed 4 columns at 1920 and 1280 px and 2 columns at 390 px. After choosing a category chip it reported `aria-pressed="true"`; typing a search text sent 0 requests; submitting sent `search=balo&category=books&condition=like-new` together with the page and limit. The loading, empty and error states each rendered with the same texts as before. Cards are links to `/product/<id>`; hovering lifts them. The muted text and placeholders use a stronger shared colour than the Ant Design default so they stay readable in both themes.

Not observed: the real backend and its filters, a very long product title or city, a real phone, Firefox or WebKit.
