---
task: TASK-082
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-082 — Ant Design authentication pages

## What was built

The sign-in, registration, password recovery and password change pages (`frontend/src/modules/auth`) are built from Ant Design components. This is the third slice of the move to Ant Design, after the icon set (TASK-080) and the shell (TASK-081).

`AuthShell.jsx` holds what the four pages share: a `Card`, a `Typography.Title`, the intro, a success `Alert` for notices, an error `Alert`, and a footer row of links. Each page uses an Ant Design `Form` with vertical labels and rules: required fields, a valid email, a phone number that starts with 0 and has 10 or 11 digits, a six-digit code and a password of at least 8 characters. The browser's own validation bubbles are replaced by inline messages under the fields.

`PasswordField.jsx` is now a `Form.Item` with an `Input` and a text button inside it that shows or hides the password; its accessible names ("Hiện mật khẩu", "Ẩn mật khẩu") and `aria-pressed` are unchanged. The Google button uses a Phosphor logo icon, and the primary buttons keep the brand gradient from the shared theme. `Auth.css` went from 642 lines to 22.

Service calls, the order of steps (two-factor code, emailed registration code, recovery token, change password), texts and redirects did not change. The profile password page (`modules/profile/ChangePassword.jsx`) is a different file and moves with the profile area.

Test setup gained a timer-based `MessageChannel`, because Ant Design forms use it and jsdom has none.

## Acceptance criteria

- [ ] `AC-WEB-25-2` — inconclusive without a calibrated evaluator; the App tests (including a new inline-validation test) pass and the pages were observed in both themes at 390 and 1280 px, see `.project/evidence/TASK-082/run-01/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-082/run-01/frontend-test.txt` |
| Static analysis | N/A — the production build runs the CRA lint step with `CI=true` |
| Build/typecheck | `.project/evidence/TASK-082/run-01/frontend-build.txt` |
| Behavioral/manual | `.project/evidence/TASK-082/run-01/manual-review.md` and `screenshots/` |

## Deviations

None. Validation moved from the browser's `required` and `pattern` attributes to Ant Design rules with the same limits; the messages are new text.

## Known gaps

- Observed with canned API responses in Chromium; sign-in, registration and recovery were not exercised against the real backend, a real mail provider or Google.
- The frontend test suite is slower (the App tests alone take about two minutes).
- The profile password page and the other page areas still use hand-written components until their tasks.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | No money logic is involved |
| `INV-02` | no | Not involved |
| `INV-03` | no | Not involved |
| `INV-04` | no | Not involved |
| `INV-05` | no | Not involved |
| `INV-06` | no | Passwords still leave the page only in the sign-in and password requests; nothing is stored or logged |
| `INV-07` | no | Not involved |
| `INV-08` | no | Not involved |

## Compatibility and supersession

Dark theme, Phosphor icons and the Ant Design shell are preserved. The "Hiện mật khẩu" and "Ẩn mật khẩu" button names and every label used by the existing tests are unchanged.

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `frontend/src/modules/auth/` (`AuthShell.jsx` new; `Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ChangePassword.jsx`, `PasswordField.jsx`, `Auth.css`)
- `frontend/src/App.test.jsx`, `frontend/src/setupTests.js`
