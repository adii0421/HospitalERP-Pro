"""
Authentication endpoints: login (issues JWT), register, and current-user info.
"""
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserCreate, UserOut
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """OAuth2-compatible token login using email as username."""
    service = AuthService(db)
    user = service.authenticate(form_data.username, form_data.password)
    token = service.issue_token(user)

    return Token(
        access_token=token,
        token_type="bearer"
    )


@router.post("/login-json", response_model=Token)
def login_json(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    """JSON-body login for React frontend."""
    service = AuthService(db)
    user = service.authenticate(payload.email, payload.password)
    token = service.issue_token(user)

    return Token(
        access_token=token,
        token_type="bearer"
    )


@router.post("/register", response_model=UserOut, status_code=201)
def register(
    payload: UserCreate,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    user = service.register(payload)
    return user


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user