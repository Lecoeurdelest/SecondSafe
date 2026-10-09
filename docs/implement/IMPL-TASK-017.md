---
task: TASK-017
execution_status: verifying
relevance: current
date: 2026-10-09
author: Lecoeurdelest
---

# IMPL-TASK-017 — Categories API

Migrated WDP's public category list and slug lookup into the route → controller → service → model layers. The list selects baseline public fields from active categories sorted by name. Slug lookup excludes inactive records and returns the Vietnamese 404 for unknown or inactive slugs. Shared response/error handling preserves the source API envelope and safely handles database failures.

AC-PROD-08-1 behavior is observed by six Jest scenarios and five HTTP scenarios (12 assertions) against disposable MongoDB 7.0.24. All 90 backend tests pass. Original runner outputs, HTTP transcripts, AST flow review and complexity checks are in `.project/evidence/TASK-017/run-01/`. The automatic gate remains inconclusive without calibration; confidence is null and this task stays verifying. TASK-018 has not advanced.

The additional controller/service files satisfy the architecture rule that business queries stay outside routes. No category administration was introduced. The schema and public API prefix are unchanged. INV-02 and INV-03 are untouched; this task reads category metadata and performs no listing, order or money mutation. Live data/deployment behavior remains part of integration verification in TASK-073.

Changed files: category route/controller/service, category tests, execution/delivery/evidence records and generated views.
