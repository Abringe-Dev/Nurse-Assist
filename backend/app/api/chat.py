import json
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import SessionLocal, get_db
from app.db.models import ChatSession, Message, User
from app.core.config import get_settings
from app.rag.chain import generate_answer, generate_general_answer, stream_answer, stream_general_answer
from app.rag.guardrails import REFUSAL_MESSAGE, classify_query
from app.rag.retriever import retrieve
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])

NO_CONTEXT_ANSWER = (
    "There are no reference documents uploaded yet, so I can't look this up. "
    "Please upload a protocol, formulary, or procedure document first."
)


def _get_or_create_session(
    db: Session, user: User, session_id: str | None, message: str
) -> tuple[ChatSession, str]:
    if session_id:
        session = db.get(ChatSession, session_id)
        if not session or session.user_id != user.id:
            raise HTTPException(status_code=404, detail="Session not found")
        return session, session_id
    title = message.strip()[:60] or "New chat"
    session = ChatSession(user_id=user.id, title=title)
    db.add(session)
    db.flush()
    return session, session.id


@router.post("/message", response_model=ChatResponse)
def send_message(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ChatResponse:
    is_refusal, refusal_text = classify_query(payload.message)
    if is_refusal:
        session, session_id = _get_or_create_session(db, user, payload.session_id, payload.message)
        db.add(Message(session_id=session_id, role="user", content=payload.message))
        db.add(Message(session_id=session_id, role="assistant", content=refusal_text))
        session.updated_at = datetime.now(timezone.utc)
        db.commit()
        return ChatResponse(answer=refusal_text, sources=[], session_id=session_id)

    session, session_id = _get_or_create_session(db, user, payload.session_id, payload.message)
    db.add(Message(session_id=session_id, role="user", content=payload.message))

    retrieved = retrieve(payload.message, user_id=user.id)
    is_general = False
    if not retrieved:
        if not get_settings().enable_general_fallback:
            answer = NO_CONTEXT_ANSWER
            sources: list = []
        else:
            try:
                answer = generate_general_answer(payload.message)
            except RuntimeError as exc:
                db.rollback()
                raise HTTPException(status_code=503, detail=str(exc)) from exc
            sources: list = []
            is_general = True
    else:
        try:
            answer, sources = generate_answer(payload.message, retrieved)
        except RuntimeError as exc:
            db.rollback()
            raise HTTPException(status_code=503, detail=str(exc)) from exc

    sources_json = json.dumps([s.model_dump() for s in sources]) if sources else None
    db.add(Message(session_id=session_id, role="assistant", content=answer, sources_json=sources_json))
    session.updated_at = datetime.now(timezone.utc)
    if session.title == "New chat" and len(payload.message.strip()) > 0:
        session.title = payload.message.strip()[:60]
    db.commit()
    return ChatResponse(answer=answer, sources=sources, session_id=session_id, is_general=is_general)


@router.post("/stream")
def stream_message(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    is_refusal, refusal_text = classify_query(payload.message)
    if is_refusal:
        session, session_id = _get_or_create_session(db, user, payload.session_id, payload.message)
        db.add(Message(session_id=session_id, role="user", content=payload.message))
        db.add(Message(session_id=session_id, role="assistant", content=refusal_text))
        session.updated_at = datetime.now(timezone.utc)
        db.commit()

        def refusal_gen():
            yield f"data: {json.dumps({'token': refusal_text})}\n\n"
            yield f"data: {json.dumps({'done': True, 'session_id': session_id, 'sources': [], 'is_general': False})}\n\n"

        return StreamingResponse(refusal_gen(), media_type="text/event-stream")

    session, session_id = _get_or_create_session(db, user, payload.session_id, payload.message)
    db.add(Message(session_id=session_id, role="user", content=payload.message))
    db.commit()

    retrieved = retrieve(payload.message, user_id=user.id)
    if not retrieved:
        if not get_settings().enable_general_fallback:
            answer = NO_CONTEXT_ANSWER

            def no_ctx_gen():
                db2 = SessionLocal()
                try:
                    db2.add(Message(session_id=session_id, role="assistant", content=answer, sources_json=None))
                    sess = db2.get(ChatSession, session_id)
                    if sess:
                        sess.updated_at = datetime.now(timezone.utc)
                    db2.commit()
                finally:
                    db2.close()
                yield f"data: {json.dumps({'token': answer})}\n\n"
                yield f"data: {json.dumps({'done': True, 'session_id': session_id, 'sources': [], 'is_general': False})}\n\n"

            return StreamingResponse(no_ctx_gen(), media_type="text/event-stream")

        def general_gen():
            full_answer = ""
            try:
                for chunk in stream_general_answer(payload.message):
                    full_answer += chunk
                    yield f"data: {json.dumps({'token': chunk})}\n\n"
            except Exception as exc:
                yield f"data: {json.dumps({'error': str(exc)})}\n\n"
                return
            db2 = SessionLocal()
            try:
                db2.add(Message(session_id=session_id, role="assistant", content=full_answer, sources_json=None))
                sess = db2.get(ChatSession, session_id)
                if sess:
                    sess.updated_at = datetime.now(timezone.utc)
                    if sess.title == "New chat":
                        sess.title = payload.message.strip()[:60]
                db2.commit()
            finally:
                db2.close()
            yield f"data: {json.dumps({'done': True, 'session_id': session_id, 'sources': [], 'is_general': True})}\n\n"

        return StreamingResponse(general_gen(), media_type="text/event-stream")

    try:
        _, preview_sources = generate_answer(payload.message, retrieved)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    sources_payload = [s.model_dump() for s in preview_sources]

    def event_gen():
        full_answer = ""
        try:
            for chunk in stream_answer(payload.message, retrieved):
                full_answer += chunk
                yield f"data: {json.dumps({'token': chunk})}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
            return
        if full_answer and not re.search(r"\[\d+\]", full_answer):
            suffix = " [1]"
            full_answer += suffix
            yield f"data: {json.dumps({'token': suffix})}\n\n"
        db2 = SessionLocal()
        try:
            db2.add(
                Message(
                    session_id=session_id,
                    role="assistant",
                    content=full_answer,
                    sources_json=json.dumps(sources_payload) if sources_payload else None,
                )
            )
            sess = db2.get(ChatSession, session_id)
            if sess:
                sess.updated_at = datetime.now(timezone.utc)
                if sess.title == "New chat":
                    sess.title = payload.message.strip()[:60]
            db2.commit()
        finally:
            db2.close()
        yield f"data: {json.dumps({'done': True, 'session_id': session_id, 'sources': sources_payload, 'is_general': False})}\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream")
