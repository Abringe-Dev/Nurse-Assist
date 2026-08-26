import json
import math
import re
from pathlib import Path


def hit_at_k(retrieved_titles: list[str], expected_doc: str, k: int) -> int:
    return 1 if expected_doc in retrieved_titles[:k] else 0


def mrr(retrieved_titles: list[str], expected_doc: str) -> float:
    for rank, title in enumerate(retrieved_titles, start=1):
        if title == expected_doc:
            return 1.0 / rank
    return 0.0


def ndcg_at_k(retrieved_titles: list[str], expected_doc: str, k: int) -> float:
    dcg = 0.0
    for rank, title in enumerate(retrieved_titles[:k], start=1):
        rel = 1 if title == expected_doc else 0
        if rel:
            dcg += 1.0 / math.log2(rank + 1)
    idcg = 1.0 / math.log2(2) if expected_doc else 0.0
    return dcg / idcg if idcg else 0.0


def _dedup_titles(titles: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for title in titles:
        if title not in seen:
            seen.add(title)
            out.append(title)
    return out


def evaluate_retrieval(
    golden_path: Path,
    k: int = 5,
    user_id: str | None = None,
):
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

    from app.rag.retriever import retrieve, retrieve_dense_only

    golden = [json.loads(line) for line in golden_path.read_text(encoding="utf-8").splitlines() if line.strip()]

    rows = []
    for item in golden:
        q = item["question"]
        expected = item["expected_doc"]

        dense_hits = retrieve_dense_only(q, k=k, user_id=user_id)
        dense_titles = _dedup_titles([h.metadata["title"] for h in dense_hits])

        hybrid_hits = retrieve(q, k=k, user_id=user_id)
        hybrid_titles = _dedup_titles([h.metadata["title"] for h in hybrid_hits])

        rows.append(
            {
                "id": item["id"],
                "question": q,
                "expected": expected,
                "dense_titles": dense_titles,
                "hybrid_titles": hybrid_titles,
                "dense_hit": hit_at_k(dense_titles, expected, k),
                "hybrid_hit": hit_at_k(hybrid_titles, expected, k),
                "dense_mrr": mrr(dense_titles, expected),
                "hybrid_mrr": mrr(hybrid_titles, expected),
                "dense_ndcg": ndcg_at_k(dense_titles, expected, k),
                "hybrid_ndcg": ndcg_at_k(hybrid_titles, expected, k),
            }
        )

    def avg(key: str) -> float:
        return round(sum(r[key] for r in rows) / len(rows), 3) if rows else 0.0

    summary = {
        "k": k,
        "count": len(rows),
        "dense": {
            "hit_at_k": avg("dense_hit"),
            "mrr": avg("dense_mrr"),
            "ndcg": avg("dense_ndcg"),
        },
        "hybrid": {
            "hit_at_k": avg("hybrid_hit"),
            "mrr": avg("hybrid_mrr"),
            "ndcg": avg("hybrid_ndcg"),
        },
        "rows": rows,
    }
    return summary


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Evaluate retrieval (dense vs hybrid)")
    parser.add_argument("--k", type=int, default=5)
    parser.add_argument("--golden", type=str, default="golden_qa.jsonl")
    parser.add_argument("--user-id", type=str, default=None)
    parser.add_argument("--out", type=str, default=None)
    args = parser.parse_args()

    golden_path = Path(args.golden)
    if not golden_path.is_absolute():
        golden_path = Path(__file__).parent / golden_path

    result = evaluate_retrieval(golden_path, k=args.k, user_id=args.user_id)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    if args.out:
        Path(args.out).write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"written to {args.out}")
