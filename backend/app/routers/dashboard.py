from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models import Analysis, Document, User
from app.schemas.settings import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = (
        db.query(Document)
        .filter(Document.user_id == current_user.id, Document.is_deleted.is_(False))
        .all()
    )

    total_analyses = sum(1 for d in docs if d.analyses)
    high_risk = sum(1 for d in docs if d.analyses and d.analyses[0].risk_level == "high")
    safe = sum(1 for d in docs if d.analyses and d.analyses[0].risk_level == "low")
    favorites = sum(1 for d in docs if d.is_favorite)

    recent = sorted(docs, key=lambda d: d.updated_at, reverse=True)[:6]
    recent_activity = [
        {
            "document_id": d.id,
            "filename": d.filename,
            "risk_level": d.analyses[0].risk_level if d.analyses else None,
            "status": d.analyses[0].status if d.analyses else "pending",
            "updated_at": d.updated_at,
        }
        for d in recent
    ]

    return DashboardStats(
        total_analyses=total_analyses,
        high_risk_count=high_risk,
        safe_count=safe,
        favorites_count=favorites,
        recent_activity=recent_activity,
    )
