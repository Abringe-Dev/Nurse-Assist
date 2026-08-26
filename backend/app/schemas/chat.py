from pydantic import BaseModel, field_validator


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None

    @field_validator("message")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("message must not be blank")
        return value.strip()


class SourceInfo(BaseModel):
    title: str
    page: int
    snippet: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceInfo]
    session_id: str | None = None
