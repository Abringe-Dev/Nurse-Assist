from datetime import datetime

from pydantic import BaseModel


class CreateSessionRequest(BaseModel):
    title: str | None = None


class SessionInfo(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class SessionListResponse(BaseModel):
    sessions: list[SessionInfo]


class SessionResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime


class HistoryMessage(BaseModel):
    id: str
    role: str
    content: str
    sources: list[dict] | None = None
    created_at: datetime


class HistoryResponse(BaseModel):
    session_id: str
    messages: list[HistoryMessage]
