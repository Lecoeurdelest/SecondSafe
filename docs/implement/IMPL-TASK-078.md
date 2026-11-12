---
task: TASK-078
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-078 — Conversational AI assistant

## What was built

The assistant page is now a chat. A signed-in user types free text, the page keeps the whole thread and sends the last 12 turns to a new endpoint, `POST /api/assistant/chat`, so each answer takes the conversation so far into account. The old form with a topic select and a single question is gone for customers; the moderator checklist and the signed-out prompt are unchanged.

The backend (`assistant-chat.service.js`) redacts every turn, then runs a bounded loop with Gemini function calling. The platform facts and safety rules sit in a system instruction, and the single tool, `search_products`, reads active listings of eligible sellers (text index first, keyword match on the title as a fallback). Gemini sees only title, price, condition, category and a redacted description; the browser additionally gets location and image for the listing cards. If the provider is unavailable, times out or returns something unusable, the user gets a local answer (a FAQ answer for help questions, a local listing search for shopping questions) with a hint that it is the built-in answer. `ASSISTANT_LLM_SEES_MESSAGES=false` restores the earlier topic-only behaviour.

The chat screen shows bubbles, starter questions, a typing indicator, inline listing cards that link to the product page, a retry button after a failure, a "new conversation" action and a privacy notice. The thread lives in `sessionStorage`, survives a reload in the same tab and is removed at sign-out. Nothing about the conversation is stored on the server, so there is no schema change (D-003).

D-013 records the data-flow change: free-form text, after redaction, now reaches Google Gemini. The README paragraph that said the opposite was rewritten, `docs/technical/assistant-chat.md` describes the flow, and `plan.md` §15 carries the amendment.

## Acceptance criteria

- [ ] `AC-CHAT-06-1` — inconclusive without a calibrated evaluator; backend tests drive the tool loop with a mocked provider and mocked data access and pass (multi-turn contents, listing filters, cards)
- [ ] `AC-CHAT-06-2` — inconclusive without a calibrated evaluator; backend tests show contact details and links never appear in what the provider receives, tool results carry no seller identity or location, and local answers and the switch work
- [ ] `AC-WEB-22-1` — inconclusive without a calibrated evaluator; 11 component tests pass and the page was observed at 360, 1280 and 1920 px against canned responses, see `.project/evidence/TASK-078/run-01/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-078/run-01/jest.txt` (backend, 44 suites) and `frontend-test.txt` (frontend, 9 suites) |
| Static analysis | N/A — the production build runs the CRA lint step with `CI=true` |
| Build/typecheck | `.project/evidence/TASK-078/run-01/frontend-build.txt` |
| Behavioral/manual | `.project/evidence/TASK-078/run-01/manual-review.md` and `screenshots/` |

## Deviations

None. The `PRODUCT_INTENT` pattern was narrowed during implementation so that a plain help request such as "Tôi cần hỗ trợ" is not routed to listing search; the behaviour is covered by a test.

## Known gaps

- No request has been sent to the real Gemini API from this environment: the key exists only in the Vercel backend environment. The function-calling request shape follows the public REST format and is verified against mocks only. If Gemini rejects it, users get the built-in answer with the "đang bận" hint, not an error.
- The search tool was tested with a mocked `Product` model, never against MongoDB, so the text index and the regex fallback have not run against real data.
- The browser observation used canned API responses in headless Chromium; no real phone and no other browser.
- On a 360 × 740 screen the site header takes about 240 px, so the message box sits at the fold and needs one scroll.
- Gemini quality (tone, Vietnamese accuracy, how well it follows the "never invent listings" rule) has not been judged.
- Dark mode is not implemented in this application.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | No money logic is involved |
| `INV-02` | no | The tool only reads listings |
| `INV-03` | no | Eligible sellers come from the existing `getEligibleSellerIds` |
| `INV-04` | no | Not involved |
| `INV-05` | no | The assistant never reads order, conversation or evidence data |
| `INV-06` | no | Not involved |
| `INV-07` | no | Not involved |
| `INV-08` | no | Prices are passed through as integer VND |

## Compatibility and supersession

`POST /api/assistant/ask` and `GET /api/assistant/moderation/:reportId` are unchanged, and `ask` is reused for the topic-only mode. D-013 supersedes the README statement that free-form questions are not sent to Gemini.

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `backend/src/modules/assistant/assistant-chat.service.js`, `gemini.service.js`, `assistant.service.js`, `assistant.controller.js`, `assistant.route.js`
- `backend/tests/assistant-chat.test.js`, `backend/.env.example`
- `frontend/src/modules/assistant/Assistant.jsx`, `Assistant.css`, `Assistant.test.jsx`, `AssistantMessage.jsx`, `assistantThread.js`
- `frontend/src/services/assistant.service.js`, `frontend/src/services/session.service.js`
- `README.md`, `docs/technical/assistant-chat.md`
