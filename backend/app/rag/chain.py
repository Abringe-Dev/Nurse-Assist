import re
from functools import lru_cache

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from app.core.config import get_settings
from app.rag.prompts import (
    QUESTION_TEMPLATE,
    SYSTEM_PROMPT,
    SYSTEM_PROMPT_GENERAL,
    format_context,
)
from app.rag.retriever import RetrievedChunk
from app.schemas.chat import SourceInfo


@lru_cache
def get_llm() -> ChatGroq:
    settings = get_settings()
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")
    return ChatGroq(
        model=settings.llm_model,
        api_key=settings.groq_api_key,
        temperature=0.2,
    )


def _build_chain(streaming: bool = False, general: bool = False):
    system = SYSTEM_PROMPT_GENERAL if general else SYSTEM_PROMPT
    question_template = "{question}" if general else QUESTION_TEMPLATE
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system),
            ("human", question_template),
        ]
    )
    llm = get_llm()
    if streaming:
        llm = ChatGroq(
            model=get_settings().llm_model,
            api_key=get_settings().groq_api_key,
            temperature=0.2,
            streaming=True,
        )
    return prompt | llm | StrOutputParser()


BOLD_PAIR_RE = re.compile(r"\*\*(.+?)\*\*")
CITATION_DUP_RE = re.compile(r"【\d+[^】]*】\s*\.?\s*(\[\d+\])")


def normalize_answer(text: str) -> str:
    cleaned = text.strip()
    cleaned = re.sub(r"^\s*\*\*Answer:\*\*\s*", "", cleaned)
    cleaned = re.sub(r"(?m)^\s*\*\*Source[s]?:\*\*\s*(\[\d+\][^\n]*)\s*$", r"\1", cleaned)
    cleaned = re.sub(r"(?m)^\s*\*Source:[^\n]*\[\d+\][^\n]*\*\s*$", "", cleaned)
    cleaned = re.sub(r"(?m)^\s*Source:\s*(\[\d+\])\s*$", "", cleaned)
    cleaned = CITATION_DUP_RE.sub(r"\1", cleaned)
    cleaned = re.sub(r"^(#{1,6})\s+", "", cleaned, flags=re.MULTILINE)
    pairs = BOLD_PAIR_RE.findall(cleaned)
    if len(pairs) > 2:
        for extra in pairs[2:]:
            cleaned = cleaned.replace(f"**{extra}**", extra, 1)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def generate_answer(
    question: str, retrieved: list[RetrievedChunk]
) -> tuple[str, list[SourceInfo]]:
    from app.rag.guardrails import ensure_citations

    is_general = not retrieved
    context = "" if is_general else format_context(retrieved)
    question_payload = question if is_general else {"context": context, "question": question}
    if is_general:
        answer = _build_chain(general=True).invoke(question)
    else:
        answer = _build_chain().invoke(question_payload)
    answer = ensure_citations(normalize_answer(answer), bool(retrieved))
    sources = [
        SourceInfo(
            title=chunk.metadata["title"],
            page=chunk.metadata["page"],
            snippet=chunk.text[:220].strip(),
            score=chunk.score,
        )
        for chunk in retrieved
    ]
    return answer, sources


def generate_general_answer(question: str) -> str:
    return normalize_answer(_build_chain(general=True).invoke(question))


def stream_answer(question: str, retrieved: list[RetrievedChunk]):
    is_general = not retrieved
    if is_general:
        chain = _build_chain(streaming=True, general=True)
        for chunk in chain.stream(question):
            yield chunk
        return
    context = format_context(retrieved)
    chain = _build_chain(streaming=True)
    for chunk in chain.stream({"context": context, "question": question}):
        yield chunk


def stream_general_answer(question: str):
    for chunk in _build_chain(streaming=True, general=True).stream(question):
        yield chunk
