# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally with canned API responses and a canned province list (`forms-capture.js`). For light and dark at 1280 and 390 px the script signs in and opens the creation form (checks the heading and the profile-location notice), switches to a custom location and chooses a province and a district in the searchable selects, attaches two photos, toggles the "Sách" category chip (checks `aria-pressed`), fills the title and price, then clears the title and submits (counts the inline errors), and finally opens the edit form of a listing (checks the heading and the two existing photos). Horizontal overflow and page errors are recorded on both pages.

| File | What it shows |
|---|---|
| `light-w1280-create-filled.png` | Creation form with photos, category, custom location, summary and progress (light) |
| `dark-w1280-create.png` | Empty creation form with the profile location in the dark theme |
| `light-w1280-create-errors.png` | Inline errors after submitting (light) |
| `dark-w390-create-errors.png` | Inline errors at 390 px in the dark theme |
| `light-w390-create.png` | Creation form at 390 px (light) |
| `dark-w1280-edit.png`, `dark-w390-edit.png` | Edit form in the dark theme at both widths |

Results: in all four combinations the heading and the profile-location notice appeared, two photo previews were added, the category chip reported `aria-pressed="true"`, the district was chosen, clearing the title and the description showed two inline errors, the edit form showed its two existing photos, no page overflowed horizontally and none raised an error. The first capture showed the native file input visible at 390 px because a stylesheet overrode the `hidden` attribute; it is now hidden by the stylesheet and the pages were re-captured.

Not observed: a real upload and save against the backend, the province list from its real service, long titles and descriptions beyond the sample, the profile and shipping forms that embed the selector, a real phone, Firefox or WebKit.
