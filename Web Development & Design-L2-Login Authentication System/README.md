# Login Authentication System (Approach A: front-end only)

HTML + CSS + vanilla JavaScript. No install needed: open `login.html` (or `index.html`) in a current browser.

## Pages
- `register.html` – create an account (username or email + password)
- `login.html` – log in
- `dashboard.html` – protected page, redirects to login without a session

## How it meets the checklist
| Requirement | Where |
|---|---|
| Registration form + Register button | `register.html`, `js/register.js` |
| Password: min 8 chars, at least 1 number | `Auth.validatePassword` in `js/auth.js` (live checklist on the form) |
| Duplicate username/email error | `Auth.register` (case-insensitive check) |
| Login form + Login button | `login.html`, `js/login.js` |
| Generic error for wrong credentials | `Auth.login` returns one message for unknown user and wrong password |
| Protected dashboard + redirect | `js/guard.js` (runs in `<head>`) and `js/dashboard.js` |
| Logout clears session and redirects | `dashboard.js` -> `Auth.logout()` |
| No plain-text passwords | Random salt + PBKDF2-SHA-256 (150,000 iterations) via the Web Crypto API |
| No empty submissions | Both forms validate before calling `Auth` |

## Storage
- `localStorage` key `authDemo.users`: `{ id, key, display, salt, hash, iterations, createdAt }` (never the password)
- `sessionStorage` key `authDemo.session`: `{ userId, startedAt }`. It is cleared on logout and when the tab closes.

## Important limitation
This is a learning demo. All checks run in the browser, so anyone can edit storage in dev tools and fake a session. Real authentication verifies credentials on a server and issues a session cookie (see MDN: "HTTP cookies" / "Using HTTP cookies"). Salted hashing here protects the stored passwords, not the app itself.
