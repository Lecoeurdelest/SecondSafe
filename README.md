# SecondSafe

A second-hand marketplace backend with escrow-protected payments: the buyer's money is held until the buyer confirms receipt. Moderators handle reports and disputes.

This repository is migrating the WDP frontend and backend through [tracked tasks](docs/task/README.md). The starting point contains the **backend skeleton**:

- the accepted MongoDB data layer (16 Mongoose schemas, seeds, index and migration scripts), carried from the WDP baseline;
- empty route, controller and service stubs for every module. They are rebuilt task by task;
- the plan-driven control framework: plan, requirements, tasks, execution state and evidence.

The [migration inventory](docs/technical/migration-wdp.md) maps source modules to 52 existing backend tasks and 21 migration/frontend/integration tasks. Work uses [Gitflow](docs/technical/gitflow.md), with one PR per task and `Lecoeurdelest` as the sole author of new commits and PRs. Initial inspection found an orders-router startup regression; current status and repair evidence are tracked in the task index.

## Quick start

```bash
git clone --recurse-submodules https://github.com/Lecoeurdelest/SecondSafe.git
cd SecondSafe/backend
cp .env.example .env          # set MONGODB_URI, JWT_SECRET, CHAT_ENCRYPTION_KEY, ADMIN_*
npm install
npm test                      # schema contract and app shell tests
npm run seed                  # categories + sample products (local MongoDB)
npm run create-admin          # first admin from ADMIN_* variables
npm run dev                   # http://localhost:5000/api/health
```

Other scripts: `npm run seed:verify`, `npm run db:indexes`, `npm run db:migrate`. MongoDB transactions, used by the money flows, need a replica set.

## How work is controlled

| What | Where |
|---|---|
| Intent, invariants, decisions | [plan.md](plan.md) |
| Requirements and tasks (structured) | [project.yaml](project.yaml) |
| Task status | [docs/task/README.md](docs/task/README.md) |
| Requirements (readable) | [docs/requirements/](docs/requirements/README.md) |
| Architecture and data model | [docs/technical/](docs/technical/) |
| Agent and contributor rules | [.agent/AGENTS.md](.agent/AGENTS.md) |

The framework is [plan-driven-development](https://github.com/Lecoeurdelest/plan-driven-development), pinned as a submodule in `tools/plan-driven-development`. After changing `project.yaml` or `.project/state.json`:

```bash
pip install pyyaml
python3 tools/pdd/render.py
python3 tools/plan-driven-development/scripts/check_project.py validate project.yaml
python3 tools/plan-driven-development/scripts/check_project.py audit-task-status docs/task/README.md
```
