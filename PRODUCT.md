# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Bedside nurses on shift first, nursing students studying second. The shift nurse needs a fast reference lookup between tasks — glanceable cited answers, large touch targets, readable in low-light wards on shared devices. The student uses the same corpus for study and revision. Both need to trust where every answer came from.

## Product Purpose

NurseAssist is a Retrieval-Augmented Generation chatbot over the user's own uploaded clinical reference documents (protocol manuals, drug formularies, procedure guides). It exists so nurses get cited, protocol-grounded answers instead of generic chatbot prose. Success means a nurse can upload a protocol, ask a question, and get a concise cited answer with visible provenance — or an honest general-knowledge answer clearly labeled as such when no document matches.

## Positioning

The mechanism a generic chatbot cannot copy: hybrid retrieval (dense + BM25 + cross-encoder rerank) over private per-user documents, with inline citations, per-answer confidence, guardrails that refuse diagnosis and patient-specific dosing, persistent cited history, and an eval harness (golden QA set with hit@k/MRR/nDCG plus Groq-as-judge faithfulness). Provenance is the product.

## Operating Context

Used on shared ward devices in low light, with interruptions — high contrast and large targets required. Local dev runs FastAPI (port 8000) + Vite (port 5173). Auth is Supabase Google-only when configured, otherwise a single local dev user. Documents: PDF/TXT/MD, chunked with page metadata, per-user isolated in Chroma and SQL.

## Capabilities and Constraints

Confirmed: document upload/ingest/delete, hybrid RAG chat with citations, streaming SSE with non-stream fallback, multi-session history, general-knowledge fallback labeled `is_general`, regex guardrails with refusal, eval scripts. Constraints: reference lookup only, never medical advice or diagnosis; citations must never be invented; OPEN: email/password auth not built (Google-only); per-user isolation is logical (`user_id` filter), not physical DBs.

## Brand Commitments

Name NurseAssist stays, clinical-reference purpose stays. No binding color, type, or layout commitment — full visual freedom granted for the redesign within clinical safety.

## Evidence on Hand

Sample corpus in `backend/sample_data/`: `hand_hygiene.md`, `med_admin_safety.md`, `infection_control.md`. Eval results in `backend/evals/results_retrieval.json` and `results_generation.json`. No testimonials, customers, or benchmarks — do not fabricate any.

## Product Principles

1. Provenance over prose: every grounded answer shows its sources.
2. Honest uncertainty: general-knowledge and low-confidence answers are labeled, never disguised.
3. Shift-ready: glanceable, high-contrast, interruption-tolerant.
4. Safety is structural: guardrails and audit live in the pipeline, not in a disclaimer alone.

## Accessibility & Inclusion

High contrast for low-light ward use; minimum 11px for microcopy; keyboard-operable chat and dialogs; touch targets usable with gloves where feasible.
