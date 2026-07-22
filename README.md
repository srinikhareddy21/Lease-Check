# LeaseCheck

Upload a rental lease PDF and get a plain-language breakdown of what it
actually says — risk score, key terms, a financial breakdown, per-clause
risk cards, a timeline of important dates, and an AI chat that has already
read your lease. Not legal advice; just clarity before you sign.

A full production-style SaaS app: **React + TypeScript** frontend, **FastAPI**
backend, **PostgreSQL** persistence via **SQLAlchemy 2.0** + **Alembic**
migrations, **JWT** authentication with **bcrypt** password hashing, and
streaming analysis powered by the **Google Gemini API**.

## Tech stack

- **Frontend:** React 18 + TypeScript + Vite, Tailwind CSS, Framer Motion,
  TanStack Query, React Router, lucide-react icons, jsPDF
- **Backend:** FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL (psycopg2),
  PyJWT + bcrypt for auth, `pypdf` for text extraction, `fpdf2` for PDF
  export, `google-genai` SDK for streaming AI analysis and chat
- **Deployment:** single multi-stage Dockerfile (build frontend → serve via
  FastAPI) or `docker-compose` for local dev with hot reload

## What's real vs. what's a placeholder

Everything here is wired to a real, persistent backend — there is no mock
data or browser-only storage for any feature:

- Every user has a real account (signup/login/logout, hashed password, JWT).
- Every document, analysis, favorite, notification, and setting is a row in
  Postgres, scoped to `user_id`, enforced on every endpoint.
- Dashboard stats, search/filter/sort, and analysis history are computed
  from real queries, not fixtures.
- Exports (PDF/Markdown/text) are generated server-side from the stored
  analysis and logged as export records.

The one intentionally-stubbed piece: **password reset emails**. There's a
full token-based reset flow (expiring, single-use, hashed tokens in the
`password_reset_tokens` table), but with no email provider configured, the
reset link is logged server-side and returned directly in the API response
in dev mode. Wire in a real provider (Resend, SendGrid, Postmark, SES) in
`app/routers/auth.py::forgot_password` when you're ready to send real email.

## Project structure

```
leasecheck/
├── backend/
│   ├── main.py                 # FastAPI app: CORS, router registration, static hosting
│   ├── app/
│   │   ├── config.py            # env-based settings (pydantic-settings)
│   │   ├── database.py          # SQLAlchemy engine/session
│   │   ├── models/               # User, Document, Analysis, Notification, Settings, tokens
│   │   ├── schemas/              # Pydantic request/response models
│   │   ├── core/                 # security.py (bcrypt/JWT), deps.py (auth dependency)
│   │   ├── services/             # gemini.py (AI), export.py (PDF/MD/text), notify.py
│   │   └── routers/              # auth, users, documents, notifications, dashboard
│   ├── alembic/                  # migrations (versions/ has the initial schema)
│   ├── requirements.txt
│   └── Dockerfile.dev
├── frontend/
│   ├── src/
│   │   ├── lib/                  # api.ts (REST client), stream.ts (SSE), types.ts
│   │   ├── context/               # Auth, Theme, Toast
│   │   ├── components/            # Navbar, UploadZone, RiskGauge, ClauseCard, ChatPanel, ...
│   │   └── pages/                 # Landing, Login/Signup, Dashboard, Documents, AnalysisResult, Settings
│   └── ...
├── Dockerfile                     # production: builds frontend, serves via FastAPI
├── docker-compose.yml              # local dev: postgres + backend (hot reload) + frontend (hot reload)
└── .env.example
```

## Local development

1. Copy `.env.example` to `.env` in the project root and fill in your Gemini
   API key and a real `JWT_SECRET`:
   ```
   cp .env.example .env
   ```
2. Run everything (Postgres + backend + frontend):
   ```
   docker compose up
   ```
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000 (interactive docs at `/docs`)
   - The backend container runs `alembic upgrade head` automatically on boot.

### Running without Docker

```
# Postgres running locally, then:
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env   # edit DATABASE_URL to point at your local Postgres
alembic upgrade head
uvicorn main:app --reload

# in another terminal
cd frontend
npm install
npm run dev
```

## Creating a new migration

After changing any model in `backend/app/models/`:

```
cd backend
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

## Python version

The backend targets **Python 3.12+**. All dependency versions in
`requirements.txt` have prebuilt wheels for 3.12/3.13, including
`psycopg2-binary` and `bcrypt`.
