# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally with canned API responses (`wallet-capture.js`). For light and dark at 1280 and 390 px the script signs in and opens the wallet (six transactions: a completed and a pending deposit, a completed payment, a pending and a failed withdrawal, and an earning; counts the transaction cards), the top-up page (picks "200.000 VNĐ" and checks the summary appears), the withdrawal page (types 60000 and submits to count the inline errors), and the failed top-up result and the success page with an amount, a note and a transaction code. Horizontal overflow and page errors are recorded on every page.

| File | What it shows |
|---|---|
| `light-w1280-wallet.png`, `dark-w1280-wallet.png` | Balance, five totals, filters and the transaction history with the pager |
| `light-w390-wallet.png` | The wallet at 390 px |
| `light-w1280-topup.png`, `dark-w390-topup.png` | Top-up form with a quick amount chosen, summary, method and security notice |
| `dark-w1280-withdraw.png`, `light-w390-withdraw.png` | Withdrawal form with inline errors, summary, notice and recent requests |
| `dark-w1280-result-failed.png`, `light-w1280-result-success.png` | The two result pages |

Results: in all four combinations the wallet showed six transaction cards, the top-up summary appeared after choosing an amount, the withdrawal form showed three inline errors, no page overflowed horizontally and none raised an error. Amounts keep their rules: completed credits in green with a plus, completed debits in red with a minus, unfinished ones in the normal colour with the "không thành công" suffix. The first capture used the wrong endpoint names in the mock (the wallet showed zeros) and the Descriptions labels showed a doubled colon and oversized card headings; the mock, the labels and the heading sizes were fixed and the pages re-captured.

Not observed: a real top-up hand-off to SePay, a real withdrawal request, a different currency formatting by locale, a real phone, Firefox or WebKit.
