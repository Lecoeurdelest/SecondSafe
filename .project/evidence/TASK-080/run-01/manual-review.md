# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build. Storefront pages used canned API responses (`fixture-capture.js`: 20 routes, light and dark, signed in as a customer); the 20 admin and moderator pages used the real backend (`backend/src/server.js`) with a disposable MongoDB 7.0.14 replica set and the seed scripts of TASK-079 run-02 (`staff-scan.js`). Both scripts also check icons: every `svg` with the Phosphor viewBox gets its colour compared with its background (below 2.5:1 is reported), and the staff scan counts leftover Ant Design glyphs (viewBox `64 64 896 896`) and Font Awesome elements.

| File | What it shows |
|---|---|
| `light-home.png` | Light theme home: Phosphor category, search, cart and theme icons |
| `light-orders.png` | Light theme order list: tab and button icons |
| `dark-home.png` | Dark theme home |
| `dark-wallet.png` | Dark theme wallet: Phosphor transaction icon |
| `dark-order-detail.png` | Dark theme order detail: timeline markers |
| `dark-assistant.png` | Dark theme assistant chat |
| `dark-profile.png` | Dark theme profile |
| `dark-chat.png` | Dark theme conversation |
| `admin-dashboard.png` | Admin dashboard: sidebar, header and metric icons |
| `admin-users.png` | Admin users: select arrows, pagination arrows and action icons |
| `admin-reports.png` | Admin reports |
| `mod-reports.png` | Moderator reports |
| `mod-orders.png` | Moderator orders |
| `staff-dashboard.png` | Staff dashboard |

Results: the 20 staff pages render 12 to 30 Phosphor icons each and no Ant Design or Font Awesome glyph (`legacy-icons=0` on every page), including the select arrows, pagination arrows, password toggle and form tooltip that Ant Design draws itself; they come from the local `@ant-design/icons` replacement. A unit test (`antdIcons.test.jsx`) renders alerts, select, pagination, password input, table, popconfirm, message and modal confirm and finds only Phosphor glyphs. The storefront scan found two icons that blended into the background (the home search and location icons inherited a white colour, which the emoji had hidden) and one that was invisible in dark mode (the current step of the order timeline); all three were fixed, and the final scans report no icon below 2.5:1 except disabled controls (pagination arrows on a single page, a disabled button). The text contrast scan keeps its two earlier known items (a grey timestamp and white on the green "Hoàn thành" badge). No page overflowed horizontally.

`icon-audit.txt` lists the icon package imports, icon classes and glyph characters left in `frontend/src` (none, apart from one arrow inside a code comment) and the exempt text arrows in four `option` elements, which cannot hold an icon. `iconPolicy.test.js` fails on any icon package import, Font Awesome class or glyph character in the sources.

Not observed: icons in states that were not rendered (open modals, error states, notification panel, mobile menu, the support dialog), a real phone, Firefox or WebKit, and Gemini or payment flows.
