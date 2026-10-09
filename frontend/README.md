# SecondSafe web client migration

The React web client is being migrated from `Trungnc273/WDP@1cea2b7` through TASK-054 to TASK-072. TASK-073 verifies full-stack integration, responsive layout and browser compatibility. See [the migration inventory](../docs/technical/migration-wdp.md) and [task index](../docs/task/README.md).

The runtime and Vietnamese application shell are installable. Feature routes and their source files arrive through their assigned tasks; the shell does not yet expose catalog, account or payment flows.

```bash
cd frontend
cp .env.example .env
npm ci
npm start
npm test -- --watchAll=false --runInBand
npm run build
```

`REACT_APP_API_URL` is the backend origin without `/api` (default `http://localhost:5000`). The shared client appends `/api`, reads the existing `token` storage key, normalizes user-facing failures and emits `secondsafe:session-expired` for protected 401 responses; the authentication context introduced by TASK-055 handles that event. `REACT_APP_SOCKET_URL` can point to a separate Socket.IO origin. Never put server credentials in browser environment variables. Firebase, Ant Design, charts and sockets are added by their feature tasks.

The WDP global style tokens, placeholders and logo assets are retained. Keep environment files, runtime uploads, generated builds and dependencies out of Git. TASK-073 provides complete browser and responsive verification; the shell's initial build is not evidence for pending business flows.
