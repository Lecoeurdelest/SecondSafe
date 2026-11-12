# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally (`fixture-capture.js` holds the script and the canned data). The API was replaced by canned responses: one answer with a list and three listing cards, one plain answer, and one 503 failure. The listing images are the placeholder because the canned listings carry none. No real backend, database or Gemini request was involved, so this shows the screen, not the quality of the answers.

| File | Viewport | What it shows |
|---|---|---|
| `w1280-empty.png` | 1280 px | Welcome text, four starter questions, privacy notice, disabled send and "new conversation" buttons |
| `w1280-typing.png` | 1280 px | The user bubble and the typing indicator while the (delayed) reply is pending |
| `w1280-conversation.png` | 1280 px | Reply with a bullet list, bold text and three inline listing cards that link to the product page |
| `w1280-followup.png` | 1280 px | Second turn, answered in plain text |
| `w1280-error.png` | 1280 px | Failed request: error banner with a retry button, the question stays in the thread |
| `w360-empty.png` | 360 px | Empty state on a phone-width screen |
| `w360-typing.png` | 360 px | Typing indicator on a phone-width screen |
| `w360-conversation.png` | 360 px | Listing cards stacked in one column, composer at the fold |
| `w360-followup.png` | 360 px | Second turn on a phone-width screen |
| `w360-error.png` | 360 px | Error banner with retry on a phone-width screen |
| `w1920-empty.png` | 1920 px | Empty state on a wide screen |
| `w1920-typing.png` | 1920 px | Typing indicator on a wide screen |
| `w1920-conversation.png` | 1920 px | Conversation with cards on a wide screen |
| `w1920-followup.png` | 1920 px | Two turns on a wide screen |
| `w1920-error.png` | 1920 px | Error banner with retry on a wide screen |

Also checked by the script at 360, 1280 and 1920 px: after a reload in the same tab the thread was still on the page, and the document had no horizontal overflow; no page errors were raised.

A first capture showed the message box and the composer pushed below the fold at 360 px and then a sticky composer that covered the last messages; both were replaced by a fixed-height message box (38% of the viewport, at least 240 px) with the composer below it and room above the floating chat button. At 360 x 740 the site header still takes about 240 px, so the composer is at the fold and needs one scroll.

Not observed: a real Gemini answer, listings from a real database, a phone or any browser other than Chromium, keyboard use of the starters and the retry button (covered by the component tests only), dark mode (not implemented).

Run-02 addition: `real-mongodb-search.txt` is the output of `searchProducts` against a disposable MongoDB 7.0.14 replica set (80 listings from `backend/seed-all.js`, four eligible sellers, one listing already reserved by an order created through the real backend API). Filters on price and condition held, the text index was used, a query with no match returned nothing, and the reserved listing was not offered. The run exposed an over-wide keyword fallback, now fixed and covered by a test. Weakly related listings still follow the best matches because the text index scores Vietnamese loosely.
