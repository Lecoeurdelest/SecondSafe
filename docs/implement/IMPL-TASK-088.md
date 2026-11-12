---
task: TASK-088
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-088 — Ant Design assistant, chat and support pages

## What was built

The assistant (`modules/assistant`), the buyer-seller chat (`modules/chat`) and the support page (`modules/support`) are built from Ant Design components. This is the ninth slice of the move to Ant Design, after the icon set (TASK-080), the shell (TASK-081), the authentication pages (TASK-082), the home page (TASK-083), the product pages (TASK-084), the listing forms (TASK-085), the my-listings page (TASK-086) and the wallet pages (TASK-087).

- **Assistant**: `Avatar`, `Alert` for the privacy notice and for errors (with a "Thử lại" action), `Button` chips for the starters, `Spin` for the typing indicator, an `Input.TextArea` with `autoSize` for the composer (the manual height code is gone), `Card` listing cards and a `Card` for the moderation checklist. Rich-text rendering, the thread storage and the send rules are unchanged.
- **Chat**: conversation list as buttons with an online `Badge` and an unread `Badge`, `Card` panels, bubbles, an attach button that opens the hidden file input, a message `Input`, an offer `Form` and an error `Alert`. `OfferCard` is a `Card` with a status `Tag` and "Chấp nhận / Từ chối" buttons. Socket events, the REST fallback and the offer rules are unchanged.
- **Support**: the new-request form is an Ant Design `Form` with required rules and an `AutoComplete` for the subject suggestions (replacing the `datalist`); the inbox, the thread, the staff status filter (`Select`) and the close and reopen buttons are Ant Design components. Sending goes through the form's `onFinish`.
- **Theme**: information alerts now use a neutral blue (`#2f6fe4` light, `#60a5fa` dark) instead of the brand red, which made notices look like errors.
- **CSS**: `Assistant.css`, `Chat.css` and `Support.css` went from 459, 318 and 302 lines to 286, 207 and 196. Rules that style a panel's body are scoped to the panel's own body so they no longer reach nested cards.

## Acceptance criteria

- [ ] `AC-WEB-25-8` — inconclusive without a calibrated evaluator; the existing and new `Assistant`, `Chat` and `Support` tests pass, and the pages were observed in both themes at 390 and 1280 px, see `.project/evidence/TASK-088/run-01/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-088/run-01/frontend-test.txt` |
| Static analysis | N/A — the production build runs the CRA lint step with `CI=true` |
| Build/typecheck | `.project/evidence/TASK-088/run-01/frontend-build.txt` |
| Behavioral/manual | `.project/evidence/TASK-088/run-01/manual-review.md` and `screenshots/` |

## Deviations

- The support subject suggestions are an Ant Design `AutoComplete` list rather than a native `datalist`, so the support test opens the list and counts the seven options instead of counting `<option>` elements.
- Sending a chat message or a support reply goes through the form's asynchronous `onFinish`, so the socket test now waits for the emit instead of expecting it in the same tick.
- Required fields on the support form show inline messages ("Vui lòng nhập chủ đề hỗ trợ.", "Vui lòng mô tả vấn đề.") instead of the browser's `required` bubble.
- The moderation notice is an `Alert` with `role="note"` so it is not announced as an alert.

## Known gaps

- Observed with canned API responses in Chromium and without a live socket; typing indicators, presence and real-time delivery were not exercised in the browser (the tests cover the socket handlers).
- The staff inbox view is covered by tests only. A real image upload and real assistant answers were not exercised.
- The profile, review, report and delivery pages and the order area still use hand-written components.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | Offer prices are sent as before; no balance is touched |
| `INV-02` | no | Not involved |
| `INV-03` | no | Not involved |
| `INV-04` | no | Not involved |
| `INV-05` | no | Not involved |
| `INV-06` | no | The assistant notice and the redaction behaviour are unchanged; nothing sensitive is stored or logged |
| `INV-07` | no | Not involved |
| `INV-08` | no | Not involved |

## Compatibility and supersession

Dark theme, Phosphor icons and the earlier Ant Design slices are preserved. All names the existing tests use ("Câu hỏi", "Gửi", "Nội dung tin nhắn", "Gửi ảnh", "Đề nghị giá", "Chấp nhận", "Tin nhắn hỗ trợ" and the unread and online labels) are unchanged.

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `frontend/src/modules/assistant/`, `frontend/src/modules/chat/`, `frontend/src/modules/support/` (components, stylesheets and tests)
- `frontend/src/ui/antdTheme.js`
