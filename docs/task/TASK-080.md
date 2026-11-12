---
id: TASK-080
title: Phosphor icon set
execution_status: verifying
relevance: current
depends_on: []
supersedes: []
superseded_by: null
---

# TASK-080 — Phosphor icon set

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — Every icon is now Phosphor: Font Awesome, Ant Design icon imports and glyph icons were converted, Ant Design's own icons go through a local replacement package, and tests keep the old sets out; frontend tests and build pass; pages scanned in both themes and against the real backend for the staff pages; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-24](../requirements/FR-WEB.md#fr-web-24--web-icon-set) |
| Acceptance criteria | `AC-WEB-24-1` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | —  |
| Baseline references | — |

## Objective

Replace every Font Awesome icon, Ant Design icon and emoji or symbol glyph used as an icon with the Phosphor set, remove the two icon packages, and keep a test that stops them coming back.

## In scope

- frontend/package.json
- frontend/package-lock.json
- frontend/src

## Out of scope

- Replacing Ant Design components or the storefront layout code (later tasks)
- Backend category icon values
- Text arrows inside option elements, which cannot hold an icon
- Behaviour, routes, services and API calls

## Inputs and dependencies

- plan.md#17. Icon set and component library amendment (2026-11-12)
- docs/technical/gitflow.md

## Technical approach

Icons are Phosphor React components imported by name, so unused icons are dropped from the bundle. Static Font Awesome markup, dynamic icon classes, Ant Design icon imports and glyph characters were converted file by file; category icons share one slug-to-icon map. A global rule aligns icons with text and an icon-spin class replaces the Font Awesome spinner. A policy test fails on any icon package import, icon class or glyph.

## Files and symbols

- `frontend/src/iconPolicy.test.js`
- `frontend/src/utils/categoryIcons.jsx`
- `frontend/src/assets/styles/global.css`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-WEB-24-1` (FR-WEB-24) — Every icon in the web application comes from the Phosphor icon set; the Font Awesome and Ant Design icon packages, icon classes and emoji or symbol glyphs used as icons are gone, icons keep a visible colour and size in the light and dark themes, and loading indicators still spin. Verify with: behavioral test, static flow review, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-080/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-080.md`.

## Stop conditions

- A required decision is not accepted
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
