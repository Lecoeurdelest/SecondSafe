# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally with canned API responses (`orders-capture.js`, original output in `capture-output.txt`). For light and dark at 1280 and 390 px the script signs in and opens the buyer orders page (four orders in different states, a two-page pager, and two unfinished checkouts above the list), switches to the selling tab, opens the cancel dialog from the first order and types a reason, then opens the seller orders page and the cart page with the unfinished checkouts. Counts, horizontal overflow and page errors are recorded.

| File | What it shows |
|---|---|
| `light-w1280-orders-buying.png`, `dark-w390-orders-buying.png` | Buyer orders with the unfinished-checkout section, tabs, status filter, order cards with status tags and actions, and the pager |
| `light-w1280-orders-selling.png` | The selling tab with the seller actions |
| `dark-w1280-orders-cancel.png` | The cancel dialog with a reason typed in, in the dark theme |
| `light-w390-seller-orders.png`, `dark-w390-seller-orders.png` | Seller orders page with three tabs and their counts that fit a phone |
| `light-w1280-abandoned.png` | The unfinished checkouts above the cart |

Results: in all four combinations four buying orders, four selling orders, two unfinished checkouts and two seller-page orders were shown, the cancel dialog opened, no page overflowed horizontally and none raised an error. After the first capture the seller page tabs were tightened because the third tab was folded into an overflow menu at 390 px; the final capture shows all three.

Not observed: the dispute, shipping and seller confirmation dialogs in the browser, a real cancellation or confirmation, a real phone, Firefox or WebKit.
