from pydantic import BaseModel


class AuthUser(BaseModel):
    id: str
    email: str | None = None
    display_name: str | None = None
