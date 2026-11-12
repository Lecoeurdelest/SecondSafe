# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally with canned API responses (`dialogs-capture.js`, original output in `capture-output.txt`). For light and dark at 1280 and 390 px the script signs in as the seller, opens the selling tab of the order list and the "Xác nhận giao hàng" dialog of a paid order (top, bottom, and with the custom pickup point switched on), then opens a shipped order as its buyer, which opens the receipt dialog, picks two highlights, types a review (top and bottom of the dialog) and presses "Xác nhận nhận hàng" to show the confirmation. Overflow and page errors are recorded.

| File | What it shows |
|---|---|
| `light-w1280-ship-top.png`, `light-w1280-ship-bottom.png` | Shipment dialog: order details, carrier, tracking code, date, default pickup point, notes and the escrow notes |
| `dark-w390-ship-custom.png` | The custom pickup point fields on a phone in the dark theme |
| `dark-w390-receipt-top.png`, `light-w1280-receipt-top.png` | Receipt dialog: order and shipping details, product summary, satisfaction choice and stars |
| `light-w1280-receipt-bottom.png` | Highlights, review text with counter, evidence picker, buttons and notes |
| `light-w1280-receipt-confirm.png` | The confirmation dialog before the receipt is confirmed |

Results: in all four combinations both dialogs opened, the confirmation appeared, no page overflowed horizontally and none raised an error. A first look at the receipt dialog on a phone showed the tracking tag wider than the product card, so tags now wrap; the final captures show the fix.

Not observed: the location lists of the custom pickup point, a real upload, a real shipment or receipt confirmation, a real phone, Firefox or WebKit.
