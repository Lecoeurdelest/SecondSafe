# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally. Unlike the earlier runs, the canned API responses here have realistic shapes and contents (`fixture-capture.js` holds them): three buyer orders, a wallet balance with three transactions, a conversation with three messages, and three notifications. The session token carries a user id so the chat page can tell which bubbles are the user's own. No real backend, database or payment provider was involved.

| File | Viewport | What it shows |
|---|---|---|
| `w1280-orders-data.png` | 1280 px | Buyer order list with an order card, status chip and price block |
| `w1280-wallet-data.png` | 1280 px | Wallet balance card in the brand gradient with the summary tiles |
| `w1280-chat-thread.png` | 1280 px | Conversation list with an unread badge and a thread; the user's own bubbles use the brand gradient |
| `w1280-notifications-open.png` | 1280 px | Notification panel opened from the header on the home page |

This run changes one stylesheet since `run-03` (`frontend/src/modules/chat/Chat.css`: bubble radius and the gradient for the user's own bubbles).

Not observed: seller orders, order detail, wallet history rows scrolled into view, the dashboards, the remaining admin and moderator pages with data, dark mode (not implemented), browsers other than Chromium and a real phone.
