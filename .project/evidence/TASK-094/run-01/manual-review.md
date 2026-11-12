# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally with canned API responses (`detail-capture.js`, original output in `capture-output.txt`). For light and dark at 1280 and 390 px the script opens three orders: one awaiting payment as its buyer (then opens the cancel dialog), one completed as its buyer with shipping details and a review with two photos, and one in dispute as its seller with two conversation messages (then opens the reply dialog). Card counts, horizontal overflow and page errors are recorded.

| File | What it shows |
|---|---|
| `light-w1280-completed.png` | Completed order: product, seller and dates, payment, shipping, timeline and the review with photos |
| `dark-w390-disputed.png` | Seller's view of a disputed order on a phone: fee and net amount, timeline with dispute steps, dispute details and conversation |
| `light-w1280-disputed-response.png` | The seller's reply dialog with the evidence picker |
| `dark-w1280-buyerPending-cancel.png` | The cancel dialog with a reason field (buyer of an unpaid order) |

Results: in all four combinations the pages showed 4, 6 and 5 cards, both dialogs opened, no page overflowed horizontally and none raised an error. A first capture centred the timeline around its line with the date far from the label; the timeline now reads left to right in one column and the final captures show it.

Not observed: the buyer follow-up and return confirmation dialogs, the receipt and rating dialogs from this page, a real cancellation, reply or upload, videos in the evidence, a real phone, Firefox or WebKit.
