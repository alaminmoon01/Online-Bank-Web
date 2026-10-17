# SecureBank — Module 1: Authentication & Account Security

Full-stack starter for Module 1 of the bank project.

## Features

| # | Owner | Feature | Status |
|---|-------|---------|--------|
| 1 | Masrafi (133) | Registration & Login | Implemented |
| 2 | Payel (018) | Two-Factor Authentication (TOTP) | Implemented |
| 3 | Alamin (125) | Failed login detection & account lock | Implemented |
| 4 | Alamin (125) | Device / login monitoring | Implemented |

## Stack

- **Backend:** Node.js, Express, Prisma, SQLite, JWT, bcrypt, otplib
- **Frontend:** React, Vite, React Router

## Quick start

```bash
# From project root
npm install
npm run install:all
npm run db:push
```

Then run API and UI in two terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

- Frontend: http://localhost:5173  
- API: http://localhost:4000  

Or one command (after `npm install` at root):

```bash
npm run dev
```

## Default security rules

- Password minimum: 8 characters
- Failed attempts before lock: **5**
- Lock duration: **15 minutes** (configurable in `backend/.env`)

## API overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login (may return `requires2FA`) |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/logout` | Revoke current session |
| POST | `/api/auth/2fa/setup` | Start 2FA (QR + secret) |
| POST | `/api/auth/2fa/verify` | Confirm & enable 2FA |
| POST | `/api/auth/2fa/disable` | Disable 2FA |
| GET | `/api/sessions` | Active devices/sessions |
| DELETE | `/api/sessions/:id` | Revoke a session |
| DELETE | `/api/sessions/others` | Revoke all other sessions |
| GET | `/api/sessions/activity/log` | Recent login activity |

## Suggested ownership in code

- **Masrafi:** `backend/src/controllers/authController.js` (`register`, `login`), `frontend/src/pages/Register.jsx`, `Login.jsx`
- **Payel:** 2FA handlers in `authController.js`, Security page 2FA UI
- **Alamin:** lockout logic in `login`, `sessionController.js`, Security sessions/activity UI
