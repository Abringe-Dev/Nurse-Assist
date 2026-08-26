from dataclasses import dataclass

from app.core.config import get_settings
from app.rag.embeddings import get_embedder
from app.rag.fusion import reciprocal_rank_fusion
from app.rag.ingest import _tokenize, get_bm25, get_bm25_docs, get_collection


@dataclass
class RetrievedChunk:
    text: str
    metadata: dict
    score: float


def _dense_search(query: str, k: int, user_id: str | None) -> tuple[list[str], dict[str, tuple[str, dict, float]]]:
    where = {"user_id": user_id} if user_id else None
    result = get_collection().query(
        query_embeddings=[get_embedder().embed_query(query)],
        n_results=k,
        where=where,
        include=["documents", "metadatas", "distances"],
    )
    if not result["ids"] or not result["ids"][0]:
        return [], {}
    ids: list[str] = result["ids"][0]
    docs: list[str] = result["documents"][0]
    metas: list[dict] = result["metadatas"][0]
    dists: list[float] = result["distances"][0]
    lookup: dict[str, tuple[str, dict, float]] = {}
    for doc_id, text, meta, dist in zip(ids, docs, metas, dists):
        lookup[doc_id] = (text, meta, 1.0 - dist)
    return ids, lookup


def _sparse_search(query: str, k: int, user_id: str | None) -> tuple[list[str], dict[str, tuple[str, dict, float]]]:
    bm25 = get_bm25()
    if bm25 is None:
        return [], {}
    tokenized = _tokenize(query)
    if not tokenized:
        return [], {}
    scores = bm25.get_scores(tokenized)
    bm25_docs = get_bm25_docs()
    candidates: list[tuple[int, float]] = []
    for idx, score in enumerate(scores):
        if score <= 0:
            continue
        if user_id and bm25_docs[idx]["metadata"].get("user_id") != user_id:
            continue
        candidates.append((idx, float(score)))
    candidates.sort(key=lambda pair: pair[1], reverse=True)
    ids: list[str] = []
    lookup: dict[str, tuple[str, dict, float]] = {}
    for idx, score in candidates[:k]:
        entry = bm25_docs[idx]
        doc_id = entry["id"]
        ids.append(doc_id)
        lookup[doc_id] = (entry["text"], entry["metadata"], score)
    return ids, lookup


def retrieve(query: str, k: int | None = None, user_id: str | None = None) -> list[RetrievedChunk]:
    collection = get_collection()
    where = {"user_id": user_id} if user_id else None
    try:
        total = collection.count()
        if where:
            total = len(collection.get(where=where, include=[])["ids"])
    except Exception:
        total = collection.count()
    if total == 0:
        return []
    final_k = min(k or get_settings().top_k, total)
    dense_k = min(10, total)
    sparse_k = min(10, total)

    dense_ids, dense_lookup = _dense_search(query, dense_k, user_id)
    sparse_ids, sparse_lookup = _sparse_search(query, sparse_k, user_id)

    if not dense_ids and not sparse_ids:
        return []

    fused_ids = reciprocal_rank_fusion(
        [lst for lst in [dense_ids, sparse_ids] if lst], k=60
    )
    rerank_n = min(20, len(fused_ids))
    candidate_ids = fused_ids[:rerank_n]

    id_to_doc: dict[str, tuple[str, dict]] = {}
    for cid in candidate_ids:
        if cid in dense_lookup:
            text, meta, _ = dense_lookup[cid]
            id_to_doc[cid] = (text, meta)
        elif cid in sparse_lookup:
            text, meta, _ = sparse_lookup[cid]
            id_to_doc[cid] = (text, meta)
        else:
            fetched = collection.get(ids=[cid], include=["documents", "metadatas"])
            if fetched["ids"]:
                id_to_doc[cid] = (fetched["documents"][0], fetched["metadatas"][0])

    candidate_ids = [cid for cid in candidate_ids if cid in id_to_doc]

    if len(candidate_ids) > 1:
        try:
            from app.rag.reranker import rerank_scores

            texts = [id_to_doc[cid][0] for cid in candidate_ids]
            scores = rerank_scores(query, texts)
            ranked = sorted(
                zip(candidate_ids, scores), key=lambda pair: pair[1], reverse=True
            )
            return [
                RetrievedChunk(
                    text=id_to_doc[cid][0],
                    metadata=id_to_doc[cid][1],
                    score=round(float(score), 4),
                )
                for cid, score in ranked[:final_k]
            ]
        except Exception:
            pass

    fallback: list[RetrievedChunk] = []
    for cid in candidate_ids[:final_k]:
        text, meta = id_to_doc[cid]
        score = 0.0
        if cid in dense_lookup:
            score = round(dense_lookup[cid][2], 4)
        fallback.append(RetrievedChunk(text=text, metadata=meta, score=score))
    return fallback


def retrieve_dense_only(
    query: str, k: int | None = None, user_id: str | None = None
) -> list[RetrievedChunk]:
    collection = get_collection()
    where = {"user_id": user_id} if user_id else None
    try:
        total = collection.count()
        if where:
            total = len(collection.get(where=where, include=[])["ids"])
    except Exception:
        total = collection.count()
    if total == 0:
        return []
    top_k = min(k or get_settings().top_k, total)
    dense_ids, dense_lookup = _dense_search(query, top_k, user_id)
    return [
        RetrievedChunk(
            text=dense_lookup[cid][0],
            metadata=dense_lookup[cid][1],
            score=round(dense_lookup[cid][2], 4),
        )
        for cid in dense_ids
    ]
