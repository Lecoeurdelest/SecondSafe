# Gitflow and task delivery

`main` is the stable branch. `develop` starts at destination baseline `5ed8be5` and is the integration branch. Each task has one `feature/task-NNN-description` branch and one PR. Release preparation uses `release/<version>` from `develop`; urgent fixes use `hotfix/<description>` from `main` and are integrated back into `develop` after release. Branch names use these Gitflow prefixes directly, without an additional namespace.

Independent task PRs target `develop`. For prerequisites still under review, dependent branches may start at the prerequisite branch and PRs target that branch so the review contains only the new task. Each PR names its prerequisite and intended final integration into `develop`. Retarget to `develop` once the prerequisite merges. Never merge an unreviewed stack into `main` or open a cumulative PR pretending to contain a single task.

PR creation is authorized by the user request dated 2026-10-09. PRs remain open for user review until merging is separately authorized. No release, deployment, force push, history rewrite or branch-protection change is part of migration delivery.

New commit author and committer must both be `Lecoeurdelest <116455158+Lecoeurdelest@users.noreply.github.com>`. PRs and issues are created through the authenticated `Lecoeurdelest` account. Use the local Git configuration from `.agent/rules/git.md`. No `Co-authored-by`, `Signed-off-by`, generated attribution or other authorship footer is added. Existing commits remain unchanged, including the historical orders contribution in PR #1.

Before pushing, inspect `git log <base>..HEAD --format='%an <%ae> | %cn <%ce> | %s'` and run the task checks. PR descriptions state the problem, resulting behavior, exact verification, known gaps, issue link and dependencies. `.project/delivery.json` stores canonical issue/PR URLs; `tools/pdd/render.py` projects them into the task index. GitHub issues stay open until accepted task delivery, and evidence-backed execution state is independent of PR review status.
