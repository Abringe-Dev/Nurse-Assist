from functools import lru_cache

from sentence_transformers import CrossEncoder

from app.core.config import get_settings


@lru_cache
def get_reranker() -> CrossEncoder:
    return CrossEncoder(get_settings().reranker_model, max_length=512)


def rerank_scores(query: str, documents: list[str]) -> list[float]:
    reranker = get_reranker()
    pairs = [(query, doc) for doc in documents]
    scores = reranker.predict(pairs)
    return [float(s) for s in scores]
