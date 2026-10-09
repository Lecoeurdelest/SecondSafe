# FR-AUTH — Identity and access

Generated from `project.yaml`. Edit the model, not this file.

### FR-AUTH-01 — Register with email verification

Risk: `standard` · Component: `CMP-AUTH` · Source: `plan.md` § 4.1 Identity and access

Baseline: `POST /api/auth/register/request-otp`, `POST /api/auth/register/verify`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-AUTH-01-1` | Registration code requests without email, password, full name or phone, with a malformed email, with a phone not matching ^0\d{9,10}$, or with an email or phone already registered are rejected with 400. | behavioral test | [TASK-011](../task/TASK-011.md) `[]` |
| `AC-AUTH-01-2` | The password must satisfy the strong password policy (NFR-SEC-02) before a code is sent. | behavioral test | [TASK-011](../task/TASK-011.md) `[]` |
| `AC-AUTH-01-3` | A 6-digit code is emailed, expires after the configured OTP lifetime (default 5 minutes) and can be used once. | behavioral test | [TASK-011](../task/TASK-011.md) `[]` |
| `AC-AUTH-01-4` | The account (role user, bcrypt-hashed password) is created only when the submitted code matches; no user document exists before verification. | static flow review, behavioral test | [TASK-011](../task/TASK-011.md) `[]` |

### FR-AUTH-02 — Log in with email and password

Risk: `critical` · Component: `CMP-AUTH` · Source: `plan.md` § 4.1 Identity and access

Baseline: `POST /api/auth/login`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-AUTH-02-1` | Valid credentials return a signed JWT (configured lifetime, default 7 days) and the user profile without the password. | behavioral test | [TASK-012](../task/TASK-012.md) `[]` |
| `AC-AUTH-02-2` | An unknown email and a wrong password produce the same 401 response. | behavioral test | [TASK-012](../task/TASK-012.md) `[]` |
| `AC-AUTH-02-3` | Suspension state is disclosed only after the password is verified: an active suspension returns 403 with end time and reason; an expired suspension is lifted automatically. | static flow review, behavioral test | [TASK-012](../task/TASK-012.md) `[]` |

### FR-AUTH-03 — Sign in with Google

Risk: `standard` · Component: `CMP-AUTH` · Source: `plan.md` § 4.1 Identity and access

Baseline: `POST /api/auth/google`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-AUTH-03-1` | The Firebase ID token is verified server-side; invalid or expired tokens return 401. | behavioral test | [TASK-013](../task/TASK-013.md) `[]` |
| `AC-AUTH-03-2` | A first-time Google email creates a user with role user, a random strong password, and the Google name and avatar. | behavioral test | [TASK-013](../task/TASK-013.md) `[]` |
| `AC-AUTH-03-3` | Existing users pass through the same suspension and selling-restriction checks as password login. | behavioral test | [TASK-013](../task/TASK-013.md) `[]` |

### FR-AUTH-04 — Two-factor login (optional)

Risk: `standard` · Component: `CMP-AUTH` · Source: `plan.md` § 4.1 Identity and access

Baseline: `POST /api/auth/login/verify-2fa`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-AUTH-04-1` | For a user with two-factor login enabled, a correct password returns requires2FA and emails a 6-digit code instead of a token. | behavioral test | [TASK-015](../task/TASK-015.md) `[!]` |
| `AC-AUTH-04-2` | POST /api/auth/login/verify-2fa issues the token only for a valid, unexpired code with purpose login_2fa. | behavioral test | [TASK-015](../task/TASK-015.md) `[!]` |

### FR-AUTH-05 — Recover a forgotten password

Risk: `critical` · Component: `CMP-AUTH` · Source: `plan.md` § 4.1 Identity and access

Baseline: `POST /api/auth/forgot-password`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-AUTH-05-1` | POST /api/auth/forgot-password returns the same response whether or not the email is registered. | behavioral test | [TASK-014](../task/TASK-014.md) `[]` |
| `AC-AUTH-05-2` | The stored password hash does not change until the requester proves control of the email with an expiring one-time code or signed reset credential (lifetime at most 1 hour). | static flow review, behavioral test | [TASK-014](../task/TASK-014.md) `[]` |
| `AC-AUTH-05-3` | After a successful reset, a security notification is created for the account. | behavioral test | [TASK-014](../task/TASK-014.md) `[]` |

### FR-AUTH-06 — Reset the password with a verified credential

Risk: `critical` · Component: `CMP-AUTH` · Source: `plan.md` § 4.1 Identity and access

Baseline: `POST /api/auth/reset-password`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-AUTH-06-1` | POST /api/auth/reset-password accepts only a valid, unexpired, unused credential issued by the recovery flow and sets a password that satisfies the strong policy. | static flow review, behavioral test | [TASK-014](../task/TASK-014.md) `[]` |

### FR-AUTH-07 — Change password

Risk: `standard` · Component: `CMP-AUTH` · Source: `plan.md` § 4.1 Identity and access

Baseline: `POST /api/auth/change-password`, `POST /api/users/change-password`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-AUTH-07-1` | A wrong current password returns 400 and leaves the stored hash unchanged. | behavioral test | [TASK-014](../task/TASK-014.md) `[]` |
| `AC-AUTH-07-2` | The new password must satisfy the strong password policy. | behavioral test | [TASK-014](../task/TASK-014.md) `[]` |
| `AC-AUTH-07-3` | Both baseline paths are served by one handler. | static flow review | [TASK-014](../task/TASK-014.md) `[]` |

### FR-AUTH-08 — Log out

Risk: `standard` · Component: `CMP-AUTH` · Source: `plan.md` § 4.1 Identity and access

Baseline: `POST /api/auth/logout`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-AUTH-08-1` | POST /api/auth/logout returns 200 for an authenticated user; server-side token handling follows decision D-109 (baseline: the client discards the token). | behavioral test | [TASK-012](../task/TASK-012.md) `[]` |

### FR-AUTH-09 — Role-based access control

Risk: `critical` · Component: `CMP-AUTH` · Source: `plan.md` § 4.1 Identity and access

Baseline: `auth / role / admin middleware`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-AUTH-09-1` | Protected endpoints return 401 without a valid Bearer token and 403 when the caller role is not allowed. | behavioral test | [TASK-005](../task/TASK-005.md) `[!]` |
| `AC-AUTH-09-2` | Moderator endpoints accept moderator and admin; admin endpoints accept admin only. | behavioral test | [TASK-005](../task/TASK-005.md) `[!]` |

### FR-AUTH-10 — Enforce suspension and selling restriction on every request

Risk: `critical` · Component: `CMP-AUTH` · Source: `plan.md` § 4.1 Identity and access

Baseline: `auth.middleware.js`, `seller-restriction.util.js`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-AUTH-10-1` | An authenticated request from a suspended account returns 403 until the suspension ends; expired suspensions are lifted automatically. | behavioral test | [TASK-006](../task/TASK-006.md) `[]` |
| `AC-AUTH-10-2` | While a selling restriction is active, the seller's active listings are hidden and seller actions return 403; an expired restriction is cleared automatically. | behavioral test | [TASK-006](../task/TASK-006.md) `[]` |
| `AC-AUTH-10-3` | Suspension and restriction rules live in one shared service used by login, Google sign-in and the authentication middleware. | static flow review | [TASK-006](../task/TASK-006.md) `[]` |
