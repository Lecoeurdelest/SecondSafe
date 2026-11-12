# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally and the real backend (`backend/src/server.js`) with a disposable MongoDB 7.0.14 replica set seeded with 80 listings, a buyer, an admin and a moderator, three orders (one paid, one shipped), a conversation, a favorite and a report (`../../TASK-079/run-02/seed-real.js` and `seed-real-2.js`). Tokens were minted with the backend's own `generateJWT`.

`staff-scan.js` signs in as the admin and the moderator, opens 11 admin and 9 moderator pages (including report and order detail pages with real ids), scans every text element for contrast against its nearest opaque background (text over gradients and images is skipped) and lists the distinct offenders below 4.5:1 (`staff-scan-4.5.json`). `screenshots/` holds the 20 pages after the change.

Before (`staff-scan-before.txt`): 33 distinct pairs below 4.5:1, among them the admin sidebar descriptions (2.5:1), the dashboard section labels (2.5:1), Ant Design select placeholders (1.8:1), preset tag text (1.8 to 3.4:1), white text on the success and danger buttons (2.3 to 3.3:1), chart legend text (2.3 and 3.8:1) and several muted greys (3.0 to 4.4:1). After: one pair, the label of a disabled "Mở khóa" button (1.8:1), which is exempt for disabled controls.

Changes: the muted greys in the staff stylesheets became `#5b6472` (and `#666666` for the faintest); Ant Design tokens for placeholder, description, tertiary text, error and success were darkened in `staffTheme.js`; `staffContrast.css` sets preset tag text to the -8 shade (gold the -9) and chart legend text to `#374151`; the filled success buttons use `#15803d`; success text uses `#237804`. No page returned an API error, and the pages look the same in structure; tag text and button greens are darker.

Not observed: open modals, form errors, dispute detail with evidence, hover and focus states, a real phone, Firefox or WebKit, and any dark palette for these pages (they stay light by design).
