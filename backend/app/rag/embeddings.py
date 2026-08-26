from functools import lru_cache

from sentence_transformers import SentenceTransformer

from app.core.config import get_settings

BGE_QUERY_PREFIX = "Represent this sentence for searching relevant passages: "


class Embedder:
    def __init__(self, model_name: str):
        self._model = SentenceTransformer(model_name)
        self._prefix_queries = "bge" in model_name.lower()

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        vectors = self._model.encode(
            texts, normalize_embeddings=True, show_progress_bar=False
        )
        return [v.tolist() for v in vectors]

    def embed_query(self, text: str) -> list[float]:
        if self._prefix_queries:
            text = f"{BGE_QUERY_PREFIX}{text}"
        vector = self._model.encode(
            [text], normalize_embeddings=True, show_progress_bar=False
        )[0]
        return vector.tolist()


@lru_cache
def get_embedder() -> Embedder:
    return Embedder(get_settings().embedding_model)
