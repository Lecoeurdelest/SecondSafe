# Live admin and staff dashboards

The admin and staff dashboard APIs query the current MongoDB collections used by the application. They do not read `demo_dashboard_snapshot`, require a JSON import, or copy data to another database. Keep `MONGODB_URI` pointed to the database that contains your real SecondSafe records.

The admin dashboard returns aggregated account, listing, order, report, dispute, wallet, review, delivery, and transaction metrics. The staff dashboard returns moderation workload counts and limited report summaries; it does not expose wallet balances or transaction details.

## Create platform accounts

Set `PLATFORM_ADMIN_EMAIL`, `PLATFORM_ADMIN_PASSWORD`, `PLATFORM_STAFF_EMAIL`, and `PLATFORM_STAFF_PASSWORD` in `backend/.env`. Use new passwords with at least eight characters, including uppercase, lowercase, a digit, and a special character. Do not reuse credentials that were shared in chat, and never commit `.env`.

From `backend/`, run:

```powershell
npm run create:platform-accounts
```

The command connects only to `MONGODB_URI`. It creates missing admin and moderator accounts with bcrypt password hashes. If an account already exists with the requested role, it leaves its credentials unchanged. If the email exists with a different role, setup stops rather than silently promoting that account.

Start the backend and frontend normally, sign in with the configured account credentials, and open `/admin` or `/staff`. The dashboard is read-only; moderation and order actions must use their respective workflow modules.
