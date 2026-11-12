# Conversational assistant

The customer assistant is a stateless multi-turn chat. The browser keeps the thread, the backend redacts it, asks Gemini for the next reply and lets Gemini search real listings through one tool. Nothing about the conversation is stored on the server.

## Data flow

1. The web app posts `{ messages: [{ role, content }] }` to `POST /api/assistant/chat` (signed-in users, 12 requests per minute). The client sends at most the last 12 turns.
2. `sanitizeMessages` validates roles and types, rejects a message over 600 characters, redacts every turn with `redactSensitiveText` (emails, phone numbers, runs of 9 to 19 digits, `password:`/`otp:`/`token:` style text, links), merges consecutive turns from the same role, drops leading assistant turns and requires the last turn to be from the user.
3. `converse` calls `generateChat` with the platform system instruction, the redacted turns and the `search_products` declaration. When Gemini answers with a function call the tool runs, its result goes back as a `functionResponse`, and the loop continues for at most 2 rounds and 3 calls per round. The last request is sent without tools so the model must answer in text.
4. The reply is `{ answer, products, degraded }`. `products` are the cards the model saw, enriched for display. `degraded` is true when the answer did not come from Gemini.

## What Gemini receives

| Data | Sent to Gemini | Notes |
|---|---|---|
| Customer messages | Yes, redacted | Placeholders such as `[đã ẩn email]` replace removed text |
| Platform facts and safety rules | Yes | Fixed system instruction |
| Listing title, price, condition, category | Yes | From active listings of eligible sellers |
| Listing description | Yes, redacted and truncated | Listing text is untrusted: the instruction tells the model to ignore instructions inside it |
| Seller identity, location, listing ids, images | No | The browser receives location and image for the cards only |
| Anything from the database about the customer | No | |

## Search tool

`search_products({ query, maxPriceVnd?, condition? })` reads `Product` documents with `status: active` whose seller is in `getEligibleSellerIds()`. It tries the MongoDB text index on title and description first and falls back to a keyword match on the title when the index returns nothing. `condition` must be one of `new`, `like-new`, `good`, `fair`, `poor`. At most 5 listings are returned. Unknown tool names get an error response and do not touch the database.

## Failure behaviour

| Situation | Result |
|---|---|
| No `GEMINI_API_KEY`, timeout, non-2xx, malformed body | Local answer with `degraded: true`. A shopping question searches listings locally; any other question uses the FAQ answer for its topic |
| `ASSISTANT_LLM_SEES_MESSAGES=false` | Earlier behaviour: only a fixed topic is sent to Gemini through `ask`, no free text and no tools |
| Invalid input | HTTP 400 with the reason; never hidden behind a local answer |
| Rate limit | HTTP 429 from the existing limiter |

Provider errors are logged with `logger.warn` without the conversation text.

## Privacy decision

D-013 supersedes the earlier statement that free-form questions never reach Gemini. The provider now sees redacted conversation text. The switch above restores the earlier behaviour without a deploy of new code, and the chat screen shows a notice that messages are sent to Google Gemini after redaction.

## Web client

- `Assistant.jsx` renders the chat for customers, the checklist for moderators (`moderation`) and a sign-in prompt for visitors.
- `assistantThread.js` stores up to 30 messages in `sessionStorage` under `secondsafe:assistant:thread`. `clearSession` removes it at sign-out.
- `AssistantMessage.jsx` renders bubbles with a small safe formatter (bullets and `**bold**`, no `dangerouslySetInnerHTML`) and listing cards linking to `/product/:id`.
- Enter sends, Shift+Enter inserts a line break and IME composition is respected. A failed request keeps the question and offers "Thử lại".

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | none | Backend only |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Model name; `thinkingBudget: 0` is applied for 2.5 Flash |
| `ASSISTANT_LLM_SEES_MESSAGES` | `true` | `false` restores topic-only requests |

## Tests

`backend/tests/assistant-chat.test.js` covers validation, redaction, the tool loop, data minimisation, the keyword fallback, the round limit, local fallbacks and the switch. `frontend/src/modules/assistant/Assistant.test.jsx` covers sending, starters, keyboard handling, cards, the degraded hint, retry, persistence, reset and sign-out. Neither suite calls the network; the Gemini request shape is verified against mocks only.
