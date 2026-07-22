from datetime import datetime

from pydantic import BaseModel


class AnalysisResult(BaseModel):
    """Structured shape the AI is asked to return. Kept loose (defaults) since
    it's produced by an LLM and shouldn't 500 the request if a field is missing."""

    summary: str = ""
    riskScore: float = 0
    riskLevel: str = "medium"
    keyTerms: dict = {}
    importantDates: list[dict] = []
    financial: dict = {}
    clauses: list[dict] = []
    questions: list[str] = []
    recommendations: list[str] = []


class AnalysisResponse(BaseModel):
    id: str
    status: str
    error: str | None = None
    summary: str | None = None
    risk_score: float | None = None
    risk_level: str | None = None
    result_json: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_size: int | None = None
    source: str
    demo_id: str | None = None
    is_favorite: bool
    created_at: datetime
    updated_at: datetime
    latest_analysis: AnalysisResponse | None = None

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int
    page: int
    page_size: int


class RenameDocumentRequest(BaseModel):
    filename: str


class ChatRequest(BaseModel):
    question: str
    history: list[dict] = []


class ExportRequest(BaseModel):
    format: str  # "pdf" | "markdown" | "text"
