from pydantic import BaseModel


class SettingsResponse(BaseModel):
    theme: str
    language: str
    notify_analysis_complete: bool
    notify_report_ready: bool
    notify_upload_failed: bool
    notify_export_complete: bool

    model_config = {"from_attributes": True}


class UpdateSettingsRequest(BaseModel):
    theme: str | None = None
    language: str | None = None
    notify_analysis_complete: bool | None = None
    notify_report_ready: bool | None = None
    notify_upload_failed: bool | None = None
    notify_export_complete: bool | None = None


class DashboardStats(BaseModel):
    total_analyses: int
    high_risk_count: int
    safe_count: int
    favorites_count: int
    recent_activity: list[dict]
