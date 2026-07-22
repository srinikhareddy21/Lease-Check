import json
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.deps import get_current_user
from app.database import get_db
from app.models import Analysis, Document, ExportRecord, User
from app.schemas.document import (
    ChatRequest,
    DocumentListResponse,
    DocumentResponse,
    ExportRequest,
    RenameDocumentRequest,
)
from app.services import export as export_service
from app.services.gemini import (
    DEMO_DOCS,
    extract_pdf_text,
    parse_analysis_json,
    stream_analysis,
    stream_chat,
)
from app.services.notify import notify

router = APIRouter(prefix="/api", tags=["documents"])
settings = get_settings()


def _to_response(doc: Document) -> DocumentResponse:
    latest = doc.analyses[0] if doc.analyses else None
    data = DocumentResponse.model_validate(doc)
    if latest is not None:
        from app.schemas.document import AnalysisResponse

        data.latest_analysis = AnalysisResponse.model_validate(latest)
    return data


def _get_owned_document(db: Session, doc_id: str, user_id: str) -> Document:
    doc = db.get(Document, doc_id)
    if doc is None or doc.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return doc


async def _run_and_persist_analysis(
    db: Session, document_id: str, user_id: str, lease_text: str
) -> AsyncGenerator[str, None]:
    """Wraps stream_analysis: forwards SSE chunks to the client as they arrive,
    then parses + persists the full result once the stream completes."""

    analysis = Analysis(document_id=document_id, status="pending")
    db.add(analysis)
    db.commit()

    full_text = ""
    had_error = False
    error_message = ""

    async for chunk in stream_analysis(lease_text):
        yield chunk
        payload = chunk[len("data: "):].strip()
        try:
            parsed = json.loads(payload)
        except json.JSONDecodeError:
            continue
        if "text" in parsed:
            full_text += parsed["text"]
        elif "error" in parsed:
            had_error = True
            error_message = parsed["error"]

    if had_error or not full_text.strip():
        analysis.status = "failed"
        analysis.error = error_message or "The model returned an empty response."
        db.commit()
        notify(
            db,
            user_id=user_id,
            type="upload_failed",
            title="Analysis failed",
            message=analysis.error,
            document_id=document_id,
        )
        db.commit()
        return

    try:
        result = parse_analysis_json(full_text)
    except (json.JSONDecodeError, ValueError) as exc:
        analysis.status = "failed"
        analysis.error = f"Could not parse the model's response: {exc}"
        db.commit()
        return

    analysis.status = "complete"
    analysis.summary = result.get("summary")
    analysis.risk_score = result.get("riskScore")
    analysis.risk_level = result.get("riskLevel")
    analysis.result_json = result
    db.commit()

    notify(
        db,
        user_id=user_id,
        type="analysis_complete",
        title="Analysis complete",
        message=f"Your lease analysis is ready — risk level: {result.get('riskLevel', 'unknown')}.",
        document_id=document_id,
    )
    db.commit()


@router.get("/demo-documents")
def list_demo_documents():
    return [{"id": k, "label": v["label"]} for k, v in DEMO_DOCS.items()]


@router.post("/analyze/upload")
async def analyze_upload(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type != "application/pdf" and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")

    file_bytes = await file.read()
    if len(file_bytes) > settings.max_upload_bytes:
        raise HTTPException(status_code=400, detail="File too large (max 15MB).")

    lease_text = extract_pdf_text(file_bytes)

    document = Document(
        user_id=current_user.id,
        filename=file.filename,
        file_size=len(file_bytes),
        source="upload",
        lease_text=lease_text,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    return StreamingResponse(
        _run_and_persist_analysis(db, document.id, current_user.id, lease_text),
        media_type="text/event-stream",
        headers={"X-Document-Id": document.id},
    )


@router.get("/analyze/demo/{doc_id}")
async def analyze_demo(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    demo = DEMO_DOCS.get(doc_id)
    if not demo:
        raise HTTPException(status_code=404, detail="Unknown demo document.")

    document = Document(
        user_id=current_user.id,
        filename=demo["label"],
        source="demo",
        demo_id=doc_id,
        lease_text=demo["text"],
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    return StreamingResponse(
        _run_and_persist_analysis(db, document.id, current_user.id, demo["text"]),
        media_type="text/event-stream",
        headers={"X-Document-Id": document.id},
    )


@router.post("/documents/{doc_id}/reanalyze")
async def reanalyze(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = _get_owned_document(db, doc_id, current_user.id)
    return StreamingResponse(
        _run_and_persist_analysis(db, document.id, current_user.id, document.lease_text),
        media_type="text/event-stream",
    )


@router.get("/documents", response_model=DocumentListResponse)
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    q: str | None = Query(default=None, description="Search by filename"),
    favorite: bool | None = None,
    risk_level: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    include_deleted: bool = False,
    sort: str = Query(default="created_at", pattern="^(created_at|filename|risk)$"),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
):
    query = db.query(Document).filter(Document.user_id == current_user.id)
    if not include_deleted:
        query = query.filter(Document.is_deleted.is_(False))
    if q:
        query = query.filter(Document.filename.ilike(f"%{q}%"))
    if favorite is not None:
        query = query.filter(Document.is_favorite.is_(favorite))

    docs = query.all()

    if risk_level:
        docs = [d for d in docs if d.analyses and d.analyses[0].risk_level == risk_level]
    if status_filter:
        docs = [d for d in docs if d.analyses and d.analyses[0].status == status_filter]

    reverse = order == "desc"
    if sort == "filename":
        docs.sort(key=lambda d: d.filename.lower(), reverse=reverse)
    elif sort == "risk":
        docs.sort(key=lambda d: (d.analyses[0].risk_score or 0) if d.analyses else -1, reverse=reverse)
    else:
        docs.sort(key=lambda d: d.created_at, reverse=reverse)

    total = len(docs)
    start = (page - 1) * page_size
    page_docs = docs[start : start + page_size]

    return DocumentListResponse(
        items=[_to_response(d) for d in page_docs],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/documents/{doc_id}", response_model=DocumentResponse)
def get_document(doc_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document = _get_owned_document(db, doc_id, current_user.id)
    return _to_response(document)


@router.get("/documents/{doc_id}/analyses")
def get_analysis_history(doc_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document = _get_owned_document(db, doc_id, current_user.id)
    from app.schemas.document import AnalysisResponse

    return [AnalysisResponse.model_validate(a) for a in document.analyses]


@router.patch("/documents/{doc_id}", response_model=DocumentResponse)
def rename_document(
    doc_id: str,
    payload: RenameDocumentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = _get_owned_document(db, doc_id, current_user.id)
    document.filename = payload.filename
    db.commit()
    db.refresh(document)
    return _to_response(document)


@router.post("/documents/{doc_id}/favorite", response_model=DocumentResponse)
def toggle_favorite(doc_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document = _get_owned_document(db, doc_id, current_user.id)
    document.is_favorite = not document.is_favorite
    db.commit()
    db.refresh(document)
    return _to_response(document)


@router.delete("/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(doc_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document = _get_owned_document(db, doc_id, current_user.id)
    document.is_deleted = True
    db.commit()
    return None


@router.post("/documents/{doc_id}/restore", response_model=DocumentResponse)
def restore_document(doc_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document = _get_owned_document(db, doc_id, current_user.id)
    document.is_deleted = False
    db.commit()
    db.refresh(document)
    return _to_response(document)


@router.delete("/documents/{doc_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
def purge_document(doc_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document = _get_owned_document(db, doc_id, current_user.id)
    db.delete(document)
    db.commit()
    return None


@router.post("/documents/{doc_id}/export")
def export_document(
    doc_id: str,
    payload: ExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = _get_owned_document(db, doc_id, current_user.id)
    if not document.analyses or document.analyses[0].status != "complete":
        raise HTTPException(status_code=400, detail="This document doesn't have a completed analysis yet.")

    result = document.analyses[0].result_json or {}
    fmt = payload.format.lower()
    base_name = document.filename.rsplit(".", 1)[0]

    if fmt == "markdown":
        content = export_service.build_markdown(document.filename, result)
        media_type, ext = "text/markdown", "md"
        body = content.encode("utf-8")
    elif fmt == "text":
        content = export_service.build_text(document.filename, result)
        media_type, ext = "text/plain", "txt"
        body = content.encode("utf-8")
    elif fmt == "pdf":
        body = export_service.build_pdf(document.filename, result)
        media_type, ext = "application/pdf", "pdf"
    else:
        raise HTTPException(status_code=400, detail="Format must be one of: pdf, markdown, text.")

    db.add(ExportRecord(document_id=document.id, user_id=current_user.id, format=fmt))
    notify(
        db,
        user_id=current_user.id,
        type="export_complete",
        title="Export ready",
        message=f"{document.filename} was exported as {fmt.upper()}.",
        document_id=document.id,
    )
    db.commit()

    return Response(
        content=body,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{base_name}-report.{ext}"'},
    )


@router.get("/documents/{doc_id}/exports")
def list_exports(doc_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document = _get_owned_document(db, doc_id, current_user.id)
    return [
        {"id": e.id, "format": e.format, "created_at": e.created_at}
        for e in sorted(document.exports, key=lambda e: e.created_at, reverse=True)
    ]


@router.post("/documents/{doc_id}/chat")
async def chat_with_lease(
    doc_id: str,
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = _get_owned_document(db, doc_id, current_user.id)
    return StreamingResponse(
        stream_chat(document.lease_text, payload.question, payload.history),
        media_type="text/event-stream",
    )
