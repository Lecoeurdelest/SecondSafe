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

The admin and staff dashboards read live aggregates from the MongoDB database configured by `MONGODB_URI`. For account setup and local access, see [the live dashboard setup](docs/technical/live-dashboard.md).

## Chat and AI assistant

Signed-in users can message a seller from a product page or open a customer-support conversation. Support messages are encrypted at rest using `CHAT_ENCRYPTION_KEY`. To enable Gemini-backed FAQ and product advice, set `GEMINI_API_KEY` in `backend/.env`; `GEMINI_MODEL` is optional and defaults to `gemini-2.5-flash`. The key stays on the backend and is never sent to the browser. Without a configured key, AI requests return a configuration error.

The customer assistant (`POST /api/assistant/chat`) is a multi-turn conversation: the last 12 messages are sent to Gemini after emails, phone numbers, long digit runs, credential-like text and links are replaced with placeholders. Gemini can call a `search_products` tool that reads active listings from eligible sellers; it receives only title, price, condition, category and a redacted description, never seller identity, location, ids or images, and the browser gets the full listing cards. The thread lives in the browser's session storage, is capped at 600 characters per message, and is removed on sign-out; the server stores nothing. If Gemini is unavailable the user gets a built-in answer or a local listing search instead. Set `ASSISTANT_LLM_SEES_MESSAGES=false` to return to topic-only behaviour, where only a fixed topic or category/condition/price attributes reach Gemini. Moderation guidance sends only report type, reason, and status; staff must make the final decision. Do not enter passwords, OTPs, payment details, addresses, or private-chat content into AI prompts. Design: `docs/technical/assistant-chat.md`.

The web foundation is available under `frontend/`:

```bash
cd frontend
cp .env.example .env
npm ci
npm start
```

See [frontend/README.md](frontend/README.md) for environment variables and checks. Feature screens migrate through TASK-055 to TASK-072; the foundational shell is not the completed marketplace.

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
