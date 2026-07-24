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

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

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
#
# This MUST be registered after every app.include_router(...) call above:
# FastAPI/Starlette matches routes in the order they were added, and this
# catch-all matches literally any path, so any API route added after it
# would be shadowed and unreachable.
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(FRONTEND_DIST):
    INDEX_HTML = os.path.join(FRONTEND_DIST, "index.html")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """
        Catch-all for the React SPA.

        Previously the frontend was served via
        `StaticFiles(directory=FRONTEND_DIST, html=True)` mounted at "/".
        That only auto-serves index.html for the exact root path ("/") —
        for a request like GET /dashboard it looks for a literal file or
        directory named "dashboard" under static/, doesn't find one, and
        raises a 404 `{"detail": "Not Found"}`. That's fine for initial
        client-side navigation (React Router intercepts link clicks before
        any request is made) but breaks a hard refresh or direct URL entry
        on any non-root route, since the browser's GET goes straight to
        FastAPI.

        This route fixes that by falling back to index.html for anything
        that isn't a real file on disk, so React Router can take over and
        render the correct client-side route again.
        """
        # Any /api/* path that reached this point wasn't matched by one of
        # the routers included above, so it's a genuine unknown API
        # endpoint — keep returning a normal 404 instead of the SPA shell.
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")

        # Serve real built assets directly (e.g. /assets/index-abc123.js,
        # /assets/index-abc123.css, /favicon.ico).
        candidate = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)

        # Everything else (/, /dashboard, /profile, /chat, /history, ...)
        # is a React Router route: hand back index.html and let the SPA's
        # own router render the right page client-side.
        return FileResponse(INDEX_HTML)
