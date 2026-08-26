import json
import re
import time
from pathlib import Path


JUDGE_PROMPT = """You are an expert evaluator for a Retrieval-Augmented Generation system used by nurses. Score the assistant's answer on a 1-5 scale.

Question: {question}
Expected answer (reference): {expected}
Generated answer: {generated}
Retrieved context titles: {titles}

Score JSON with:
- faithfulness: 1-5 (how well the generated answer is supported by the expected answer/context; 5 = fully supported, no hallucination; 1 = major hallucination)
- relevance: 1-5 (how well it answers the question; 5 = directly answers)
- citation_present: 0 or 1 (does the generated answer contain a citation like [1]?)

Return ONLY valid JSON: {{"faithfulness": int, "relevance": int, "citation_present": int, "reason": "short reason"}}"""


def _call_judge(client, model: str, question: str, expected: str, generated: str, titles: list[str]) -> dict:
    prompt = JUDGE_PROMPT.format(
        question=question, expected=expected, generated=generated, titles=", ".join(titles) or "none"
    )
    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=300,
        )
        content = resp.choices[0].message.content or ""
        json_match = re.search(r"\{.*\}", content, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(0))
            return {
                "faithfulness": int(data.get("faithfulness", 3)),
                "relevance": int(data.get("relevance", 3)),
                "citation_present": int(data.get("citation_present", 0)),
                "reason": str(data.get("reason", ""))[:200],
                "raw": content[:500],
            }
    except Exception as exc:
        return {"faithfulness": 0, "relevance": 0, "citation_present": 0, "reason": str(exc)[:200], "raw": ""}
    return {"faithfulness": 0, "relevance": 0, "citation_present": 0, "reason": "no json", "raw": ""}


def evaluate_generation(
    golden_path: Path,
    judge_model: str = "openai/gpt-oss-120b",
    user_id: str | None = None,
    sleep: float = 0.3,
):
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

    from app.core.config import get_settings
    from app.rag.chain import generate_answer
    from app.rag.retriever import retrieve

    settings = get_settings()
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")

    try:
        from groq import Groq
    except ImportError as exc:
        raise RuntimeError("groq package is required for judge; pip install groq") from exc

    groq_client = Groq(api_key=settings.groq_api_key)
    golden = [json.loads(line) for line in golden_path.read_text(encoding="utf-8").splitlines() if line.strip()]

    rows = []
    for item in golden:
        q = item["question"]
        retrievals = retrieve(q, user_id=user_id)
        titles = [r.metadata["title"] for r in retrievals]
        try:
            answer, sources = generate_answer(q, retrievals)
        except Exception as exc:
            answer, sources = f"ERROR: {exc}", []
            titles = []

        judge = _call_judge(groq_client, judge_model, q, item["expected_answer"], answer, titles)
        time.sleep(sleep)
        has_citation = 1 if re.search(r"\[\d+\]", answer) else 0
        rows.append(
            {
                "id": item["id"],
                "question": q,
                "expected_doc": item["expected_doc"],
                "retrieved_titles": titles,
                "answer": answer,
                "judge": judge,
                "has_citation": has_citation,
            }
        )

    def avg(key_fn):
        return round(sum(key_fn(r) for r in rows) / len(rows), 2) if rows else 0.0

    summary = {
        "count": len(rows),
        "judge_model": judge_model,
        "avg_faithfulness": avg(lambda r: r["judge"]["faithfulness"]),
        "avg_relevance": avg(lambda r: r["judge"]["relevance"]),
        "citation_rate": avg(lambda r: r["judge"]["citation_present"]),
        "heuristic_citation_rate": avg(lambda r: r["has_citation"]),
        "rows": rows,
    }
    return summary


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Evaluate generation with Groq-as-judge")
    parser.add_argument("--golden", type=str, default="golden_qa.jsonl")
    parser.add_argument("--model", type=str, default="openai/gpt-oss-120b")
    parser.add_argument("--user-id", type=str, default=None)
    parser.add_argument("--out", type=str, default=None)
    args = parser.parse_args()

    golden_path = Path(args.golden)
    if not golden_path.is_absolute():
        golden_path = Path(__file__).parent / golden_path

    result = evaluate_generation(golden_path, judge_model=args.model, user_id=args.user_id)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    if args.out:
        Path(args.out).write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"written to {args.out}")
