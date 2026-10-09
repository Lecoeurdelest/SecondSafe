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
- Follow `docs/technical/gitflow.md` (D-011): `main` is stable, `develop` integrates, and each task has a `feature/task-NNN-description` branch and PR. Keep dependent PRs explicitly stacked until their prerequisite merges; retarget to `develop` afterward.
- Create PRs through the authenticated `Lecoeurdelest` account. Keep them open for user review unless merging is separately authorized. Preserve existing history.
- Every commit and PR follows Gitflow. Local work uses a named `feature/task-NNN-description`, `release/<version>` or `hotfix/<description>` branch. Never commit directly on `main`, `develop` or detached HEAD.
- Every non-merge feature commit references its branch's `TASK-NNN`. Feature PRs integrate into `develop`; prerequisite feature targets are temporary review stacks and are retargeted after their prerequisite merges. Only release/hotfix PRs target `main`; synchronize their results into `develop`.
- Run `python3 tools/pdd/install-gitflow-hooks.py` once per checkout setup to enable the shared local commit hooks. Before pushing, run `tools/pdd/check-gitflow.py` with the PR refs/SHA range and `check-authorship.py`; CI checks every PR target, including `main`.
