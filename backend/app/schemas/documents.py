from pydantic import BaseModel


class DocumentInfo(BaseModel):
    doc_id: str
    title: str
    pages: list[int]
    chunks: int


class UploadResponse(BaseModel):
    doc_id: str
    title: str
    pages: int
    chunks: int


class DocumentListResponse(BaseModel):
    documents: list[DocumentInfo]


class DeleteResponse(BaseModel):
    deleted: bool
    doc_id: str
