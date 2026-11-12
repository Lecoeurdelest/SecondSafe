# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally with canned API responses (`messaging-capture.js`). For light and dark at 1280 and 390 px the script signs in as a buyer and opens the assistant (clicks the first starter and checks the answer with its two product cards), the buyer-seller chat (checks the three bubbles, the pending seller offer with its "Chấp nhận" button, then opens the offer form), and a customer support conversation (checks the two messages). Horizontal overflow and page errors are recorded on every page. The live socket was not available, so the pages used their REST fallback.

| File | What it shows |
|---|---|
| `light-w1280-assistant-answer.png`, `dark-w1280-assistant-answer.png` | Assistant with a rich answer and listing cards |
| `dark-w390-assistant-welcome.png` | Assistant welcome with the starters at 390 px |
| `dark-w1280-chat.png` | Chat with the conversation list and a seller offer |
| `light-w1280-chat-offer.png`, `dark-w390-chat-offer.png` | Chat with the offer form open |
| `light-w1280-support.png`, `dark-w390-support.png` | Support page with the new-request form, the inbox and a conversation |

Results: in all four combinations the assistant showed its answer with two listing cards, the chat showed three bubbles and an offer with its accept button, the support thread showed two messages, no page overflowed horizontally and none raised an error. The first capture showed the chat overflowing at 390 px and the offer card stretched to the height of the panel because a stylesheet rule for the panel body also matched the nested card; the rule now targets only the panel's own body. Information alerts were red-tinted like errors and now use a neutral blue.

Not observed: the live socket (typing, presence, real-time messages), the staff inbox in the browser (covered by tests), a real image upload, a real assistant answer from the model, a real phone, Firefox or WebKit.
