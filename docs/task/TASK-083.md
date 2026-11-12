---
id: TASK-083
title: Ant Design home page and product list
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-083 — Ant Design home page and product list

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — The home page, the product list and the product card are rebuilt from Ant Design components; the new Home tests and the App tests pass and the page was observed in both themes at 390, 1280 and 1920 px; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-25](../requirements/FR-WEB.md#fr-web-25--web-storefront-on-ant-design) |
| Acceptance criteria | `AC-WEB-25-3` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Rebuild the home page, the product list and the product card from Ant Design components and remove the unused hand-written footer, mobile menu and search bar components.

## In scope

- frontend/src/modules/home
- frontend/src/components/ProductCard.jsx
- frontend/src/components/ProductList.jsx
- frontend/src/components/ProductComponents.css
- frontend/src/components/Footer.jsx
- frontend/src/components/Footer.css
- frontend/src/components/MobileMenu.jsx
- frontend/src/components/MobileMenu.css
- frontend/src/components/SearchBar.jsx
- frontend/src/services/language.service.js
- frontend/src/ui/antdTheme.js
- frontend/src/setupTests.js
- frontend/src/App.test.jsx

## Out of scope

- Product detail, creation, editing, favourites and cart pages (later tasks)
- Services, routes, the product query and its API parameters
- The location selector used by listing forms

## Inputs and dependencies

- plan.md#17. Icon set and component library amendment (2026-11-12)
- docs/technical/gitflow.md

## Technical approach

The hero search is a form made of Select, Input and Button; the search text and city are drafts that reach the query only when the form is submitted, so typing no longer sends a request per keystroke. Category chips are Buttons with aria-pressed that toggle the filter, and condition and sort are Selects with clearable values. The list is a Row and Col grid of Card components wrapped in a router Link, with Spin, Empty and Alert for the loading, empty and error states. The arrow glyphs in the sort labels become words to satisfy the icon policy, and their English translations are added. The footer, mobile menu and search bar components had no importers and are deleted.

## Files and symbols

- `frontend/src/modules/home/Home.test.jsx`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-WEB-25-3` (FR-WEB-25) — The home page and the product list are built from Ant Design components, with search, category, condition and sort controls that stay in step with the product query, product cards that open the listing as a real link, loading, empty and error states, and a load-more button, and work from 360 px to 1920 px wide in both themes. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-083/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-083.md`.

## Stop conditions

- A required decision is not accepted
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
