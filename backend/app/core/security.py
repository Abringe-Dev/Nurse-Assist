from typing import Annotated

from fastapi import Depends, Header, HTTPException
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.crud import get_or_create_user
from app.db.database import get_db
from app.db.models import User

ANON_USER_ID = "local-dev-user"
ANON_EMAIL = "local@dev"


def _decode_supabase_jwt(token: str) -> dict:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.supabase_jwt_secret, algorithms=["HS256"], options={"verify_aud": False})
        return payload
    except JWTError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}") from exc


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> User:
    settings = get_settings()
    if not settings.auth_enabled:
        return get_or_create_user(db, ANON_USER_ID, ANON_EMAIL, "Local Dev")

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    payload = _decode_supabase_jwt(token)
    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing sub claim")
    email = payload.get("email")
    name = payload.get("user_metadata", {}).get("full_name") if isinstance(payload.get("user_metadata"), dict) else None
    return get_or_create_user(db, user_id, email, name)


async def get_optional_user(
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> User | None:
    settings = get_settings()
    if not settings.auth_enabled:
        return get_or_create_user(db, ANON_USER_ID, ANON_EMAIL, "Local Dev")
    if not authorization:
        return None
    return await get_current_user(authorization, db)
