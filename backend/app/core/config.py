from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    groq_api_key: str = ""

    llm_model: str = "openai/gpt-oss-120b"
    embedding_model: str = "BAAI/bge-small-en-v1.5"

    chroma_dir: Path = Path("./data/chroma")
    collection_name: str = "nurseassist"

    chunk_size_tokens: int = 450
    chunk_overlap_tokens: int = 75

    top_k: int = 5
    reranker_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    enable_general_fallback: bool = True

    database_url: str = ""
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_jwt_secret: str = ""

    cors_origins: str = "http://localhost:5173"

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def effective_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        return "sqlite:///./data/app.db"

    @property
    def auth_enabled(self) -> bool:
        return bool(self.supabase_jwt_secret and self.supabase_url)


@lru_cache
def get_settings() -> Settings:
    return Settings()
