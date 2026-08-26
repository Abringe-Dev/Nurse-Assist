import uuid
from functools import lru_cache
from pathlib import Path
from dataclasses import dataclass
from io import BytesIO

import re

import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

from app.core.config import get_settings
from app.rag.embeddings import get_embedder

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}
MAX_UPLOAD_BYTES = 20 * 1024 * 1024


@dataclass
class Page:
    number: int
    text: str


@dataclass
class Chunk:
    text: str
    metadata: dict


@lru_cache
def get_collection():
    settings = get_settings()
    client = chromadb.PersistentClient(
        path=str(settings.chroma_dir),
        settings=chromadb.Settings(anonymized_telemetry=False),
    )
    return client.get_or_create_collection(
        name=settings.collection_name,
        metadata={"hnsw:space": "cosine"},
    )


def _splitter() -> RecursiveCharacterTextSplitter:
    settings = get_settings()
    return RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        encoding_name="cl100k_base",
        chunk_size=settings.chunk_size_tokens,
        chunk_overlap=settings.chunk_overlap_tokens,
    )


def extract_pages(filename: str, data: bytes) -> list[Page]:
    suffix = Path(filename).suffix.lower()
    if suffix == ".pdf":
        reader = PdfReader(BytesIO(data))
        pages = [
            Page(number=i + 1, text=(page.extract_text() or "").strip())
            for i, page in enumerate(reader.pages)
        ]
    else:
        pages = [Page(number=1, text=data.decode("utf-8", errors="ignore").strip())]
    return [page for page in pages if page.text]


def chunk_document(filename: str, data: bytes, user_id: str = "") -> tuple[str, list[Chunk]]:
    doc_id = uuid.uuid4().hex
    splitter = _splitter()
    chunks: list[Chunk] = []
    for page in extract_pages(filename, data):
        for piece in splitter.split_text(page.text):
            meta: dict = {
                "doc_id": doc_id,
                "title": Path(filename).name,
                "page": page.number,
            }
            if user_id:
                meta["user_id"] = user_id
            chunks.append(Chunk(text=piece, metadata=meta))
    return doc_id, chunks


def ingest_chunks(doc_id: str, chunks: list[Chunk]) -> int:
    if not chunks:
        return 0
    vectors = get_embedder().embed_documents([chunk.text for chunk in chunks])
    get_collection().upsert(
        ids=[f"{doc_id}:{i}" for i in range(len(chunks))],
        embeddings=vectors,
        documents=[chunk.text for chunk in chunks],
        metadatas=[chunk.metadata for chunk in chunks],
    )
    rebuild_bm25()
    return len(chunks)


def delete_document(doc_id: str, user_id: str | None = None) -> bool:
    where: dict = {"doc_id": doc_id}
    if user_id:
        where = {"$and": [{"doc_id": doc_id}, {"user_id": user_id}]}
    existing = get_collection().get(where=where, include=[])
    if not existing["ids"]:
        return False
    get_collection().delete(where=where)
    rebuild_bm25()
    return True


def list_documents(user_id: str | None = None) -> list[dict]:
    where = {"user_id": user_id} if user_id else None
    data = get_collection().get(where=where, include=["metadatas"])
    grouped: dict[str, dict] = {}
    for meta in data["metadatas"]:
        entry = grouped.setdefault(
            meta["doc_id"],
            {"doc_id": meta["doc_id"], "title": meta["title"], "pages": set(), "chunks": 0},
        )
        entry["pages"].add(meta["page"])
        entry["chunks"] += 1
    return [
        {
            "doc_id": value["doc_id"],
            "title": value["title"],
            "pages": sorted(value["pages"]),
            "chunks": value["chunks"],
        }
        for value in grouped.values()
    ]


def _tokenize(text: str) -> list[str]:
    return re.findall(r"\w+", text.lower())


_bm25 = None
_bm25_docs: list[dict] = []


def rebuild_bm25() -> None:
    global _bm25, _bm25_docs
    data = get_collection().get(include=["documents", "metadatas"])
    ids: list[str] = data["ids"]
    documents: list[str] = data["documents"]
    metadatas: list[dict] = data["metadatas"]
    if not ids:
        _bm25 = None
        _bm25_docs = []
        return
    _bm25_docs = [
        {"id": doc_id, "text": text, "metadata": metadata}
        for doc_id, text, metadata in zip(ids, documents, metadatas)
    ]
    corpus = [_tokenize(entry["text"]) for entry in _bm25_docs]
    from rank_bm25 import BM25Okapi

    _bm25 = BM25Okapi(corpus)


def get_bm25():
    if _bm25 is None and get_collection().count() > 0:
        rebuild_bm25()
    return _bm25


def get_bm25_docs() -> list[dict]:
    if _bm25 is None and get_collection().count() > 0:
        rebuild_bm25()
    return _bm25_docs
