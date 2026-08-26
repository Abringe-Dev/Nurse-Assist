from functools import lru_cache

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from app.core.config import get_settings
from app.rag.prompts import QUESTION_TEMPLATE, SYSTEM_PROMPT, format_context
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


def _build_chain(streaming: bool = False):
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            ("human", QUESTION_TEMPLATE),
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


def generate_answer(
    question: str, retrieved: list[RetrievedChunk]
) -> tuple[str, list[SourceInfo]]:
    from app.rag.guardrails import ensure_citations

    answer = _build_chain().invoke(
        {"context": format_context(retrieved), "question": question}
    )
    answer = ensure_citations(answer.strip(), bool(retrieved))
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


def stream_answer(question: str, retrieved: list[RetrievedChunk]):
    context = format_context(retrieved)
    chain = _build_chain(streaming=True)
    for chunk in chain.stream({"context": context, "question": question}):
        yield chunk
