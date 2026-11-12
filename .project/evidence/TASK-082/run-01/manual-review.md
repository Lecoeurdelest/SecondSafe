# Manual review

Observed on 2026-11-12 in headless Chromium (Playwright) against the production build served locally with canned API responses (`auth-capture.js`). For light and dark at 1280 and 390 px the script opens the sign-in page, submits it empty (counts the inline errors), fills it, toggles the password (checks the input type becomes text), submits (the canned response asks for a two-factor code, so it checks that step appears), then opens registration, recovery and, signed in, the password change page, checking horizontal overflow and page errors.

| File | What it shows |
|---|---|
| `light-w1280-login.png` | Sign-in page |
| `light-w1280-login-validation.png` | Inline validation after submitting an empty form |
| `dark-w1280-login-2fa.png` | Two-factor code step in the dark theme |
| `light-w1280-register.png` | Registration form |
| `dark-w390-register.png` | Registration at 390 px in the dark theme |
| `light-w390-forgot.png` | Password recovery at 390 px |
| `dark-w1280-change-password.png` | Password change in the dark theme |
| `dark-w390-login.png` | Sign-in at 390 px in the dark theme |

Results: in all four combinations the empty form showed two inline errors, the password toggle changed the input type, the two-factor step appeared after sign-in, no page overflowed horizontally and none raised an error. The pages keep the brand gradient on the primary button, the card on the page background in both themes, and fit a 390 px screen.

Not observed: the real backend, a real mail provider and Google sign-in; the registration code step and the recovery reset step in the browser (covered by the App tests); long server error messages; a real phone, Firefox or WebKit.
