"""
LeaseCheck backend — FastAPI application entrypoint.

Handles:
  - Auth (signup/login/logout, JWT + bcrypt, forgot/reset password)
  - Documents: PDF upload + text extraction, demo leases, list/search/filter,
    rename, favorite, soft delete/restore, permanent delete, re-analyze
  - Streaming lease analysis and lease Q&A chat via the Google Gemini API
  - Analysis history, export (PDF/Markdown/text), export history
  - Notifications, dashboard stats, per-user settings

All user-scoped data (documents, analyses, notifications, settings) is
persisted in PostgreSQL via SQLAlchemy and only ever accessible to the
owning user, enforced in app/core/deps.py + per-router ownership checks.

Security notes:
  - The Gemini API key is read from the GEMINI_API_KEY environment variable
    only. It is never sent to, or accepted from, the frontend.
  - Passwords are hashed with bcrypt; JWT access tokens are signed with
    JWT_SECRET and can be revoked (logout) via a blacklist table.
  - CORS is restricted via the ALLOWED_ORIGINS env var in production.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth, dashboard, documents, notifications, users

settings = get_settings()

app = FastAPI(title="LeaseCheck API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(documents.router)
app.include_router(notifications.router)
app.include_router(dashboard.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# Serve the built React frontend (for the single-container production image).
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(FRONTEND_DIST):
    from fastapi.staticfiles import StaticFiles

    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="static")
