from sqlalchemy.orm import Session

from app.models import Notification, UserSettings

_PREF_FIELD = {
    "analysis_complete": "notify_analysis_complete",
    "report_ready": "notify_report_ready",
    "upload_failed": "notify_upload_failed",
    "export_complete": "notify_export_complete",
}


def notify(
    db: Session,
    *,
    user_id: str,
    type: str,
    title: str,
    message: str,
    document_id: str | None = None,
) -> Notification | None:
    settings_row = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    pref_field = _PREF_FIELD.get(type)
    if settings_row is not None and pref_field is not None and not getattr(settings_row, pref_field, True):
        return None

    note = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        document_id=document_id,
    )
    db.add(note)
    db.flush()
    return note
