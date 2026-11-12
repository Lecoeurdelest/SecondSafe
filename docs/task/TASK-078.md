---
id: TASK-078
title: Conversational AI assistant
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-078 — Conversational AI assistant

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — Conversational assistant implemented and verified with mocked provider and data access plus a canned-API browser observation; no live Gemini call; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-CHAT-06](../requirements/FR-CHAT.md#fr-chat-06--ai-assistant-conversation), [FR-WEB-22](../requirements/FR-WEB.md#fr-web-22--web-conversational-assistant) |
| Acceptance criteria | `AC-CHAT-06-1`, `AC-CHAT-06-2`, `AC-WEB-22-1` |
| Components | `CMP-CHAT`, `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted), `D-013` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Signed-in users chat with an assistant that remembers the conversation, finds real listings through a search tool, answers questions about how SecondSafe works, degrades to a local answer when the provider is unavailable, and never lets unredacted contact details or seller identity reach the provider.

## In scope

- backend/src/modules/assistant/
- backend/tests/assistant-chat.test.js
- backend/.env.example
- frontend/src/modules/assistant/
- frontend/src/services/assistant.service.js
- README.md
- docs/technical/assistant-chat.md
- Associated styles and tests; observable loading, empty and failure states

## Out of scope

- Schema changes (the conversation lives in the browser tab)
- The moderation guidance endpoint
- Unrelated modules
- Production deployment

## Inputs and dependencies

- plan.md#15. Conversational assistant amendment (2026-11-12)
- docs/technical/assistant-chat.md
- docs/technical/gitflow.md

## Technical approach

A stateless chat endpoint takes the last turns from the browser, redacts them, and runs a bounded loop with Gemini function calling. The only tool is a listing search that reads active listings of eligible sellers and returns title, description, price, condition and category. Platform facts sit in the system instruction. A deterministic fallback answers when the provider fails or the switch is off. The chat screen keeps the thread in sessionStorage.

## Files and symbols

- `backend/src/modules/assistant/assistant-chat.service.js`
- `backend/src/modules/assistant/gemini.service.js`
- `backend/src/modules/assistant/assistant.route.js`
- `backend/tests/assistant-chat.test.js`
- `frontend/src/modules/assistant/Assistant.jsx`
- `frontend/src/modules/assistant/Assistant.css`
- `frontend/src/services/assistant.service.js`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-CHAT-06-1` (FR-CHAT-06) — A signed-in user can hold a multi-turn conversation with the assistant; each reply takes the conversation so far into account, and the listings it recommends come from active listings of eligible sellers. Verify with: behavioral test; `cd backend && npm test -- --runInBand`, `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.
- [ ] `AC-CHAT-06-2` (FR-CHAT-06) — Email addresses, phone numbers, long digit sequences, links and credential-like text are redacted before anything reaches the provider; listing data sent to the provider excludes seller identity and location; when the provider is unavailable or the switch is off, the user still gets a local answer. Verify with: behavioral test; `cd backend && npm test -- --runInBand`, `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.
- [ ] `AC-WEB-22-1` (FR-WEB-22) — The assistant page shows the conversation as chat bubbles with starter questions, a typing indicator, inline listing cards, a new-conversation action and a privacy notice, keeps the thread across a page reload in the same tab, and works from 360 px to 1920 px wide. Verify with: behavioral test, manual review; `cd backend && npm test -- --runInBand`, `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-078/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-078.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
