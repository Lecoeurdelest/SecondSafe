# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally with canned API responses (`payment-capture.js`, original output in `capture-output.txt`). For light and dark at 1280 and 390 px the script signs in and opens the payment page of an order awaiting payment, opens a product page and its "Mua ngay" quick-buy dialog, and opens the bank transfer result page for a completed, a rejected and a still-pending transaction. Headings, horizontal overflow and page errors are recorded.

| File | What it shows |
|---|---|
| `light-w1280-pay.png`, `dark-w390-pay.png` | Payment page with the order, the seller, the amounts, the bank transfer method, the safe-payment note and the escrow notes |
| `light-w390-quick-buy.png`, `dark-w1280-quick-buy.png` | The quick-buy dialog with the listing and total |
| `light-w1280-result-success.png`, `dark-w1280-result-success.png` | Completed payment with the amount and short code |
| `light-w1280-result-failed.png` | Rejected payment with the server message |
| `light-w390-result-checking.png` | Pending payment with the checking state |

Results: in all four combinations the payment button and the quick-buy confirmation were present, the result pages showed "Thanh toán thành công!", "Thanh toán không thành công" and "Đang kiểm tra...", no page overflowed horizontally and none raised an error.

Not observed: the purchase request inbox (no route reaches it) and the full message and price form of the purchase dialog (the product page and cart open it as a quick buy), the wallet branch, a real SePay checkout or bank confirmation, a real phone, Firefox or WebKit.
