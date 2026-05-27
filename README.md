# 🎯 Rightpath JAMB Practice Platform

A full-stack JAMB CBT (Computer-Based Test) practice platform for Nigerian students, built with Node.js/Express and PostgreSQL.

---

## Project Structure

```
rightpath-jamb/
├── backend/
│   ├── config/
│   │   └── database.js          # PostgreSQL pool
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── activation.controller.js
│   │   │   ├── exam.controller.js
│   │   │   └── admin.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   └── error.middleware.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── exam.routes.js
│   │   │   ├── admin.routes.js
│   │   │   └── activation.routes.js
│   │   ├── services/
│   │   │   └── email.service.js
│   │   ├── utils/
│   │   │   └── badge.util.js
│   │   └── server.js
│   ├── schema.sql               # Full PostgreSQL schema
│   ├── .env.example
│   └── package.json
└── frontend/                    # (Next.js — to be built)
```

---

## API Endpoints

### Auth  `/api/auth`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register new student |
| POST | `/verify-email` | Verify email with token |
| POST | `/resend-verification` | Resend verification email |
| POST | `/login` | Login, receive JWT |
| POST | `/logout` | Clear auth cookies |
| POST | `/refresh` | Rotate access token |
| POST | `/forgot-password` | Send reset link |
| POST | `/reset-password` | Reset with token |
| GET  | `/me` | Get current user |

### Users  `/api/users`  *(auth required)*
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/profile` | Get profile + badge count |
| PATCH  | `/profile` | Update profile |
| PATCH  | `/change-password` | Change password |
| GET    | `/badges` | List earned badges |
| GET    | `/notifications` | List notifications |
| PATCH  | `/notifications/read-all` | Mark all read |

### Activation  `/api/activation`  *(auth + verified)*
| Method | Path | Description |
|--------|------|-------------|
| POST | `/redeem` | Redeem activation code |
| GET  | `/status` | Check subscription status |

### Exams  `/api/exams`  *(auth + verified + active subscription)*
| Method | Path | Description |
|--------|------|-------------|
| GET   | `/subjects` | List JAMB subjects |
| GET   | `/configs` | List exam configurations |
| POST  | `/start` | Start a new exam session |
| PATCH | `/:sessionId/answer` | Save answer to a question |
| PATCH | `/:sessionId/flag` | Toggle flag on question |
| PATCH | `/:sessionId/sync-time` | Heartbeat: sync time remaining |
| POST  | `/:sessionId/submit` | Submit and grade exam |
| GET   | `/history` | Paginated exam history |
| GET   | `/:sessionId/review` | Full review with answers |

### Admin  `/api/admin`  *(admin or superadmin only)*
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/dashboard` | Platform stats |
| POST   | `/activation-codes/generate` | Bulk generate codes |
| GET    | `/activation-codes` | List all codes |
| DELETE | `/activation-codes/:id` | Deactivate a code |
| GET    | `/students` | List students |
| PATCH  | `/students/:id/toggle` | Enable/disable student |
| GET    | `/questions` | List questions |
| POST   | `/questions/manual` | Add single question |
| POST   | `/questions/upload` | Upload JSON or PDF |
| DELETE | `/questions/:id` | Soft-delete question |

---

## Getting Started

### 1. Database
Create a PostgreSQL database and run the schema:
```bash
psql -U postgres -d your_db_name -f backend/schema.sql
```

Or paste `schema.sql` into the Supabase SQL editor.

### 2. Environment
```bash
cp backend/.env.example backend/.env
# Fill in DATABASE_URL, JWT_SECRET, SMTP credentials, FRONTEND_URL
```

### 3. Install & Run
```bash
cd backend
npm install
npm run dev     # development (nodemon)
npm start       # production
```

### 4. Health Check
```
GET http://localhost:5000/api/health
```

---

## Question Upload Format (JSON)

```json
[
  {
    "question_text": "Which of the following is a noble gas?",
    "option_a": "Nitrogen",
    "option_b": "Oxygen",
    "option_c": "Argon",
    "option_d": "Chlorine",
    "correct_answer": "C",
    "explanation": "Argon (Ar) is a noble gas in Group 18 of the periodic table.",
    "year": 2023,
    "difficulty": "easy",
    "topic": "Periodic Table"
  }
]
```

---

## Key Design Decisions

- **Answer shuffling** — Options are shuffled per exam session. The `shuffled_options` column stores a display→original letter mapping so grading always resolves back to the correct DB answer regardless of shuffle order.
- **Activation system** — Students need a time-limited activation code to access exams. Admins generate codes in bulk batches.
- **Badge engine** — 14 badges evaluated automatically on every exam submission. Non-fatal: badge failures never affect submission.
- **Race condition protection** — Activation code redemption uses `SELECT ... FOR UPDATE` inside a transaction.
- **Email enumeration prevention** — Forgot password and resend-verification always return 200.
