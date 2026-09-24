# Verification rules

- Outcome of a check: `pass`, `fail`, or `inconclusive`. Missing, stale or unsupported evidence is `inconclusive`.
- Evidence is the original runner output (Jest output, script logs, HTTP transcripts) stored under `.project/evidence/TASK-NNN/run-XX/`. Summaries never replace it.
- `report.json` follows the plan-driven-development format: `schema_version`, `task_id`, `spec_hash` (sha256 of project.yaml), `source_hash` (sha256 of the input manifest), `calibration`, and `criteria[]` with `checks[]`.
- Calibrated confidence is `null` unless a validated calibration applies. Never invent a score.
- `static_flow` means reviewing the control and data flow of the changed functions against the criterion, recorded in the report with the files and functions inspected.
- A completed task whose inputs change later becomes `needs_revalidation` (`[!]`). Its old evidence and implementation record stay.
