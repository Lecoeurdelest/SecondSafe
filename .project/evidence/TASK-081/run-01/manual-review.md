# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally with canned API responses (`shell-capture.js`). The script opens the home page signed in and signed out, in light and dark, at 1280 and 390 px; checks horizontal overflow and page errors; opens the notification popover (signed in), the language dropdown and the help-center dialog and photographs them.

| File | What it shows |
|---|---|
| `light-w1280-in-header.png` | Signed-in header at 1280 px: brand, main menu, Đăng tin, notifications, account menu |
| `light-w1280-in-notifications.png` | Notification popover with an unread badge, mark-all link and three list items |
| `dark-w1280-in-notifications.png` | The same popover in the dark theme |
| `dark-w1280-in-support.png` | Help-center dialog in the dark theme |
| `dark-w390-in-header.png` | Signed-in header at 390 px: wrapped main links and the account menu overflowing into a "…" item |
| `light-w390-out-header.png` | Signed-out header at 390 px |
| `dark-w1280-out-language.png` | Language dropdown |
| `light-w390-in-notifications.png` | Notification popover at 390 px |

Results: no page overflowed horizontally and none raised an error in any of the eight combinations; the notification popover listed the three canned notifications each time. The shell keeps the brand colours, the gradient primary buttons, the pill shapes and DM Sans; the dark theme drives Ant Design's dark algorithm. The first capture showed the floating chat button as a small two-line square (icon above the word "Chat"); a rule for the Ant Design 6 markup made it a single-row pill like before.

Not observed: a real phone, Firefox or WebKit, the staff areas (unchanged), keyboard use of the header menus and popover beyond the tests, long notification lists with "Tải thêm", and the pages under the shell, which are not part of this task.
