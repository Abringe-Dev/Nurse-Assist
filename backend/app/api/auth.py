from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.db.models import User
from app.schemas.auth import AuthUser

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=AuthUser)
async def get_me(user: User = Depends(get_current_user)) -> AuthUser:
    return AuthUser(id=user.id, email=user.email, display_name=user.display_name)
