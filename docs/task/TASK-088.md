---
id: TASK-088
title: Ant Design assistant, chat and support pages
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-088 — Ant Design assistant, chat and support pages

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — The assistant, chat and support pages are rebuilt from Ant Design components; the existing and new tests pass and the pages were observed in both themes at 390 and 1280 px; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-25](../requirements/FR-WEB.md#fr-web-25--web-storefront-on-ant-design) |
| Acceptance criteria | `AC-WEB-25-8` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Rebuild the assistant, buyer-seller chat and support pages from Ant Design components, keeping every message flow and socket event.

## In scope

- frontend/src/modules/assistant
- frontend/src/modules/chat
- frontend/src/modules/support
- frontend/src/ui/antdTheme.js

## Out of scope

- Services, sockets, routes and the assistant's server-side behaviour
- The shell's help-center dialog (already on Ant Design)

## Inputs and dependencies

- plan.md#17. Icon set and component library amendment (2026-11-12)
- docs/technical/gitflow.md

## Technical approach

Each page keeps its state, effects, socket handlers and request code and renders through Card, Flex, Form, Input, Button, Alert, Tag, Badge, Avatar and Empty. The support request form uses Form rules and an AutoComplete for the subject suggestions; message sending goes through the form's onFinish. The offer card is a Card with a status Tag. Information alerts use a neutral blue instead of the brand red so they no longer look like errors.

## Files and symbols

- `frontend/src/modules/support/Support.test.jsx`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-WEB-25-8` (FR-WEB-25) — The assistant, chat and support pages are built from Ant Design components, with the same message flows, offer handling, validation and states, and work from 360 px to 1920 px wide in both themes. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-088/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-088.md`.

## Stop conditions

- A required decision is not accepted
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
