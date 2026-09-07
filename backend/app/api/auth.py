import json
from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from app.db.database import get_db
from app.db.models import User, AuditLog
from app.services.auth_service import auth_service, AuthService

router = APIRouter(prefix="/api/auth", tags=["Authentication & RBAC"])
security = HTTPBearer(auto_error=False)

# Schemas
class SignupRequest(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "Analyst"

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class UserResponse(BaseModel):
    user_id: str
    username: str
    email: str
    role: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Extract and validate current user from Authorization header if present."""
    if not credentials:
        return None
    token = credentials.credentials
    payload = AuthService.decode_token(token)
    if not payload or "sub" not in payload:
        return None
    user_id = payload["sub"]
    user = db.query(User).filter(User.user_id == user_id).first()
    return user

def require_auth(
    user: Optional[User] = Depends(get_current_user)
) -> User:
    """Enforce authentication."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required or token invalid/expired."
        )
    return user

def require_admin(
    user: User = Depends(require_auth)
) -> User:
    """Enforce Admin role."""
    if user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Admin role required for this action."
        )
    return user

@router.post("/signup", response_model=AuthResponse)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    # Check if username or email exists
    existing = db.query(User).filter((User.username == req.username) | (User.email == req.email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is already registered."
        )

    # Validate role
    role = "Admin" if req.role and req.role.lower() == "admin" else "Analyst"

    hashed_pw = AuthService.hash_password(req.password)
    new_user = User(
        username=req.username,
        email=req.email,
        password_hash=hashed_pw,
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Audit log
    audit = AuditLog(
        user_id=new_user.user_id,
        actor=new_user.username,
        action=f"User registered with role '{new_user.role}'",
        event_type="AUTH_SIGNUP",
        details=json.dumps({"username": new_user.username, "email": new_user.email, "role": new_user.role}),
        severity="INFO"
    )
    db.add(audit)
    db.commit()

    token = AuthService.create_access_token({
        "sub": new_user.user_id,
        "username": new_user.username,
        "role": new_user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": new_user.user_id,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role
        }
    }

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == req.username_or_email) | (User.email == req.username_or_email)
    ).first()

    if not user or not AuthService.verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )

    token = AuthService.create_access_token({
        "sub": user.user_id,
        "username": user.username,
        "role": user.role
    })

    # Audit log
    audit = AuditLog(
        user_id=user.user_id,
        actor=user.username,
        action=f"User '{user.username}' logged in successfully",
        event_type="AUTH_LOGIN",
        details=json.dumps({"role": user.role}),
        severity="INFO"
    )
    db.add(audit)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }

@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(require_auth)):
    return {
        "user_id": user.user_id,
        "username": user.username,
        "email": user.email,
        "role": user.role
    }
