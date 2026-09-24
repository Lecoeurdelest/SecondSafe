# Coding rules

- Language: code, identifiers, docs and commit messages in English. User-facing API messages in Vietnamese with full diacritics (D-005).
- Layering: route → controller → service → model (see `docs/technical/architecture.md`). No business logic in routes or controllers.
- Comments: keep them minimal. Explain only non-obvious reasons, invariants or constraints that remain after refactoring.
- Complexity limits (`project.yaml` → `verification.complexity`): cyclomatic ≤ 10, cognitive ≤ 15, nesting ≤ 3 per function.
- Errors: throw errors with `statusCode`; never send raw stack traces.
- Money: integer VND only; use MongoDB transactions for multi-document changes; every balance change writes a transaction record.
- Configuration: read business constants from `config/business.js` (TASK-004), never inline numbers.
- Dependencies: add a package only in the task that needs it, and record it in the implementation record.
- Route order: declare literal paths before parameterised paths.
