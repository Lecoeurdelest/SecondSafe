# Deployment (Vercel)

Two Vercel projects from this repo: **backend** (Root Directory `backend`, Framework `Other`) and **frontend** (Root Directory `frontend`, Create React App).

CI = `.github/workflows/ci.yml`. CD = `.github/workflows/deploy.yml` (runs after CI passes on `main`, or manually).

## One-time setup
1. Create both Vercel projects (Import repo twice, set Root Directory as above). In each: Settings -> Git -> disconnect or disable production auto-deploy, otherwise Vercel and GitHub Actions both deploy.
2. GitHub repo -> Settings -> Secrets and variables -> Actions: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_BACKEND_PROJECT_ID`, `VERCEL_FRONTEND_PROJECT_ID` (IDs are in each project's Settings -> General, or `.vercel/project.json` after `vercel link`).
3. Backend project -> Environment Variables -> import `backend/.env.vercel`. Frontend project -> import `frontend/.env.vercel`. Both files are gitignored.

## Order for the first deploy (the two URLs depend on each other)
1. Deploy backend -> note its URL.
2. Set `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` on the frontend project to the backend URL, deploy frontend -> note its URL.
3. Set `FRONTEND_URL` on the backend project to the frontend URL (exact origin, no trailing slash; CORS compares it exactly), redeploy backend.
4. MongoDB Atlas -> Network Access: allow `0.0.0.0/0` (Vercel has no fixed egress IPs).

## Vercel limits for this backend
- Socket.IO (realtime chat) and cron jobs live in `src/server.js`, which Vercel does not run; they are inactive there.
- Disk is read-only/ephemeral, so `uploads/` (multer) does not persist.
- Payment callbacks (SePay/VNPay) need `FRONTEND_URL` and the return URLs set to the deployed domains.
