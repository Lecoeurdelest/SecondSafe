# Git rules

- The only author and committer is `Lecoeurdelest <116455158+Lecoeurdelest@users.noreply.github.com>` (D-007).
- Do not add `Co-authored-by`, `Signed-off-by`, "Generated with" or any other attribution trailer or footer to commits or pull requests.
- Before committing, set the identity locally:
  ```bash
  git config user.name "Lecoeurdelest"
  git config user.email "116455158+Lecoeurdelest@users.noreply.github.com"
  ```
- Commit subjects: short imperative sentence in English, for example `Implement wallet ledger (TASK-024)`.
- One task per commit series. Include the regenerated views (`python3 tools/pdd/render.py`) in the same commit as the state change.
