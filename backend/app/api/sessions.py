import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import ChatSession, Message, User
from app.schemas.sessions import (
    CreateSessionRequest,
    HistoryMessage,
    HistoryResponse,
    SessionInfo,
    SessionListResponse,
    SessionResponse,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])
history_router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=SessionResponse)
def create_session(
    payload: CreateSessionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SessionResponse:
    title = (payload.title or "New chat").strip() or "New chat"
    session = ChatSession(user_id=user.id, title=title[:300])
    db.add(session)
    db.commit()
    db.refresh(session)
    return SessionResponse(
        id=session.id, title=session.title, created_at=session.created_at, updated_at=session.updated_at
    )


@router.get("", response_model=SessionListResponse)
def list_sessions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SessionListResponse:
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    result = []
    for session in sessions:
        count = db.query(Message).filter(Message.session_id == session.id).count()
        result.append(
            SessionInfo(
                id=session.id,
                title=session.title,
                created_at=session.created_at,
                updated_at=session.updated_at,
                message_count=count,
            )
        )
    return SessionListResponse(sessions=result)


@router.delete("/{session_id}")
def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    session = db.get(ChatSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"deleted": True, "session_id": session_id}


@history_router.get("/history/{session_id}", response_model=HistoryResponse)
def get_history(
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> HistoryResponse:
    session = db.get(ChatSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return HistoryResponse(
        session_id=session_id,
        messages=[
            HistoryMessage(
                id=message.id,
                role=message.role,
                content=message.content,
                sources=json.loads(message.sources_json) if message.sources_json else None,
                created_at=message.created_at,
            )
            for message in messages
        ],
    )
