from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, chat, documents, sessions
from app.core.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from app.db.database import init_db

        init_db()
    except Exception:
        pass
    try:
        from app.rag.ingest import rebuild_bm25

        rebuild_bm25()
    except Exception:
        pass
    yield


app = FastAPI(title="NurseAssist API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(sessions.router)
app.include_router(sessions.history_router)


@app.get("/")
def root() -> dict:
    return {"message": "NurseAssist API — see /docs for the interactive API docs"}


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
