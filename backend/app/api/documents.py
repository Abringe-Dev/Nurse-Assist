from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import Document, User
from app.rag.ingest import (
    ALLOWED_EXTENSIONS,
    MAX_UPLOAD_BYTES,
    chunk_document,
    delete_document,
    ingest_chunks,
)
from app.schemas.documents import (
    DeleteResponse,
    DocumentInfo,
    DocumentListResponse,
    UploadResponse,
)

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UploadResponse:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 20 MB limit")

    doc_id, chunks = chunk_document(file.filename or "upload", data, user_id=user.id)
    if not chunks:
        raise HTTPException(status_code=422, detail="No extractable text found in the document")

    ingested = ingest_chunks(doc_id, chunks)
    pages = sorted({chunk.metadata["page"] for chunk in chunks})

    record = Document(
        chroma_doc_id=doc_id,
        user_id=user.id,
        title=Path(file.filename or "upload").name,
        pages=len(pages),
        chunks=ingested,
    )
    db.add(record)
    db.commit()

    return UploadResponse(doc_id=doc_id, title=record.title, pages=len(pages), chunks=ingested)


@router.get("", response_model=DocumentListResponse)
def get_documents(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DocumentListResponse:
    rows = db.query(Document).filter(Document.user_id == user.id).order_by(Document.created_at.desc()).all()
    return DocumentListResponse(
        documents=[
            DocumentInfo(doc_id=row.chroma_doc_id, title=row.title, pages=list(range(1, row.pages + 1)), chunks=row.chunks)
            for row in rows
        ]
    )


@router.delete("/{doc_id}", response_model=DeleteResponse)
def remove_document(
    doc_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DeleteResponse:
    row = db.query(Document).filter(Document.chroma_doc_id == doc_id, Document.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found")
    deleted = delete_document(doc_id, user_id=user.id)
    db.delete(row)
    db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found in vector store")
    return DeleteResponse(deleted=True, doc_id=doc_id)
