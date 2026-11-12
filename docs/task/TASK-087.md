---
id: TASK-087
title: Ant Design wallet pages
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-087 — Ant Design wallet pages

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — The wallet, top-up, withdrawal and result pages are rebuilt from Ant Design components; the new tests and the existing suites pass and the pages were observed in both themes at 390 and 1280 px; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-25](../requirements/FR-WEB.md#fr-web-25--web-storefront-on-ant-design) |
| Acceptance criteria | `AC-WEB-25-7` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Rebuild the wallet, top-up, withdrawal and payment result pages from Ant Design components, keeping the amounts, rules and requests.

## In scope

- frontend/src/modules/wallet

## Out of scope

- Services, routes, amount rules and the payment gateway hand-off
- The order payment page (order area)

## Inputs and dependencies

- plan.md#17. Icon set and component library amendment (2026-11-12)
- docs/technical/gitflow.md

## Technical approach

The wallet page keeps its balance logic and the rule that decides the sign, tone and suffix of each amount, moved into one helper, and renders them with Card, Statistic, Select, Input, Tag and Pagination. The top-up and withdrawal forms keep their validation and requests and render through Form.Item, Input, Select and Descriptions, with the quick amounts as buttons that report their pressed state. The two result pages use Result. Browser alerts become toasts, and a signed-out visitor to the top-up page is redirected with Navigate instead of a call during render.

## Files and symbols

- `frontend/src/modules/wallet/WalletResult.css`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-WEB-25-7` (FR-WEB-25) — The wallet, top-up, withdrawal and payment result pages are built from Ant Design components, with the balance and totals, the filtered and paged transaction history, inline validation, summaries, and result pages, and work from 360 px to 1920 px wide in both themes. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-087/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-087.md`.

## Stop conditions

- A required decision is not accepted
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
